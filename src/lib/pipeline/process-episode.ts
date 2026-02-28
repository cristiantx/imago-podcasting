import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, podcasts, transcriptSegments } from "@/lib/db/schema";
import { chunkUtterances } from "@/lib/chunking/transcript-chunker";
import { releaseReservedUnit, markUnitConsumed } from "@/lib/entitlements/service";
import { downloadAndStoreAudio, deleteAudioFromBlob } from "@/lib/storage/audio";
import { transcribeFromUrl } from "@/lib/transcription/deepgram";
import { embedTextBatch } from "@/lib/vector/embeddings";
import { getNamespace } from "@/lib/vector/pinecone";

export async function processEpisodePipeline(input: { episodeId: string }) {
  const episode = await db.query.episodes.findFirst({ where: eq(episodes.id, input.episodeId) });

  if (!episode) {
    throw new Error(`Episode ${input.episodeId} not found`);
  }

  const podcast = await db.query.podcasts.findFirst({ where: eq(podcasts.id, episode.podcastId) });
  if (!podcast) {
    throw new Error("Podcast not found for episode");
  }

  let uploadedBlobUrl: string | null = null;

  try {
    await db.update(episodes).set({ status: "processing", updatedAt: new Date() }).where(eq(episodes.id, episode.id));

    const stored = await downloadAndStoreAudio({
      podcastId: episode.podcastId,
      episodeId: episode.id,
      sourceUrl: episode.audioUrl
    });

    uploadedBlobUrl = stored.url;

    await db
      .update(episodes)
      .set({
        audioBlobUrl: stored.url,
        updatedAt: new Date()
      })
      .where(eq(episodes.id, episode.id));

    const utterances = await transcribeFromUrl(stored.url);
    const chunks = chunkUtterances(utterances);

    if (chunks.length === 0) {
      throw new Error("No transcript content produced for this episode");
    }

    const embeddings = await embedTextBatch(chunks.map((chunk) => chunk.text));

    const namespace = getNamespace(podcast.clerkUserId);
    const vectors = chunks.map((chunk, index) => {
      const vectorId = `${episode.id}:${index}`;
      return {
        id: vectorId,
        values: embeddings[index],
        metadata: {
          podcastId: episode.podcastId,
          episodeId: episode.id,
          episodeTitle: episode.title,
          episodeUrl: episode.episodeUrl ?? episode.audioUrl,
          publishedAt: episode.publishedAt?.toISOString() ?? "",
          startMs: chunk.startMs,
          endMs: chunk.endMs,
          speaker: chunk.speaker ?? "",
          snippet: chunk.text
        }
      };
    });

    await namespace.upsert(vectors);

    await db.delete(transcriptSegments).where(eq(transcriptSegments.episodeId, episode.id));

    await db.insert(transcriptSegments).values(
      chunks.map((chunk, index) => ({
        episodeId: episode.id,
        speakerLabel: chunk.speaker,
        startMs: chunk.startMs,
        endMs: chunk.endMs,
        text: chunk.text,
        chunkIndex: index,
        tokenCount: estimateTokenCount(chunk.text),
        pineconeVectorId: `${episode.id}:${index}`
      }))
    );

    const durationSec = Math.round((chunks[chunks.length - 1]?.endMs ?? 0) / 1000);

    await db
      .update(episodes)
      .set({
        status: "completed",
        durationSec,
        errorMessage: null,
        updatedAt: new Date()
      })
      .where(eq(episodes.id, episode.id));

    if (episode.usageLedgerId) {
      await markUnitConsumed(episode.usageLedgerId, episode.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown episode processing failure";

    await db
      .update(episodes)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date()
      })
      .where(eq(episodes.id, episode.id));

    if (episode.usageLedgerId) {
      await releaseReservedUnit(episode.usageLedgerId);
    }

    throw error;
  } finally {
    if (uploadedBlobUrl) {
      await deleteAudioFromBlob(uploadedBlobUrl).catch(() => {
        return undefined;
      });

      await db
        .update(episodes)
        .set({
          audioBlobUrl: null,
          updatedAt: new Date()
        })
        .where(eq(episodes.id, episode.id));
    }
  }
}

function estimateTokenCount(text: string) {
  return Math.ceil(text.length / 4);
}
