import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, ingestJobs, podcasts, searchLogs, transcriptSegments, usageLedger } from "@/lib/db/schema";
import { deleteAudioFromBlob } from "@/lib/storage/audio";
import { deleteTranscriptFromBlob } from "@/lib/storage/transcript";
import { getNamespace } from "@/lib/vector/pinecone";

export async function deletePodcastForUser(input: { clerkUserId: string; podcastId: string }) {
  const podcast = await db.query.podcasts.findFirst({
    columns: { id: true, clerkUserId: true },
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  const episodeRows = await db.query.episodes.findMany({
    columns: { id: true, audioBlobUrl: true, transcriptVttBlobUrl: true },
    where: eq(episodes.podcastId, podcast.id)
  });

  const episodeIds = episodeRows.map((episode) => episode.id);
  const audioBlobUrls = episodeRows
    .map((episode) => episode.audioBlobUrl)
    .filter((url): url is string => typeof url === "string" && url.length > 0);
  const transcriptVttBlobUrls = episodeRows
    .map((episode) => episode.transcriptVttBlobUrl)
    .filter((url): url is string => typeof url === "string" && url.length > 0);
  const segmentRows =
    episodeIds.length > 0
      ? await db.query.transcriptSegments.findMany({
          columns: { pineconeVectorId: true },
          where: inArray(transcriptSegments.episodeId, episodeIds)
        })
      : [];
  const vectorIds = segmentRows
    .map((segment) => segment.pineconeVectorId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  await Promise.all(
    audioBlobUrls.map(async (url) => {
      try {
        await deleteAudioFromBlob(url);
      } catch {
        return undefined;
      }
    })
  );

  await Promise.all(
    transcriptVttBlobUrls.map(async (url) => {
      try {
        await deleteTranscriptFromBlob(url);
      } catch {
        return undefined;
      }
    })
  );

  if (vectorIds.length > 0) {
    try {
      const namespace = getNamespace(podcast.clerkUserId);
      const chunkSize = 500;
      for (let i = 0; i < vectorIds.length; i += chunkSize) {
        const chunk = vectorIds.slice(i, i + chunkSize);
        await namespace.deleteMany(chunk);
      }
    } catch {
      // Ignore vector cleanup errors so database deletion still completes.
    }
  }

  await db.transaction(async (tx) => {
    if (episodeIds.length > 0) {
      await tx.delete(transcriptSegments).where(inArray(transcriptSegments.episodeId, episodeIds));
    }

    await tx.delete(episodes).where(eq(episodes.podcastId, podcast.id));
    await tx.delete(ingestJobs).where(eq(ingestJobs.podcastId, podcast.id));
    await tx.delete(searchLogs).where(eq(searchLogs.podcastId, podcast.id));
    await tx.update(usageLedger).set({ podcastId: null }).where(eq(usageLedger.podcastId, podcast.id));
    await tx.delete(podcasts).where(eq(podcasts.id, podcast.id));
  });

  return {
    podcastId: podcast.id,
    deletedEpisodes: episodeIds.length
  };
}
