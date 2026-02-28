import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, ingestJobs, podcasts, transcriptSegments } from "@/lib/db/schema";

type EpisodeStatus = "queued" | "processing" | "completed" | "failed" | string;

export async function listPodcastsForUser(clerkUserId: string) {
  const podcastRows = await db.query.podcasts.findMany({
    where: eq(podcasts.clerkUserId, clerkUserId),
    orderBy: [desc(podcasts.updatedAt)]
  });

  const podcastIds = podcastRows.map((podcast) => podcast.id);

  const episodeRows = podcastIds.length
    ? await db.query.episodes.findMany({
        columns: {
          id: true,
          podcastId: true,
          status: true
        },
        where: inArray(episodes.podcastId, podcastIds)
      })
    : [];

  const jobRows = podcastIds.length
    ? await db.query.ingestJobs.findMany({
        columns: {
          id: true,
          podcastId: true,
          status: true,
          totalItems: true,
          processedItems: true,
          failedItems: true,
          queueDispatchStatus: true,
          queueDispatchAttempts: true,
          queueDispatchError: true,
          startedAt: true,
          updatedAt: true
        },
        where: inArray(ingestJobs.podcastId, podcastIds),
        orderBy: [desc(ingestJobs.startedAt)]
      })
    : [];

  const latestJobByPodcast = new Map<string, (typeof jobRows)[number]>();
  for (const job of jobRows) {
    if (!latestJobByPodcast.has(job.podcastId)) {
      latestJobByPodcast.set(job.podcastId, job);
    }
  }

  const episodesByPodcast = new Map<string, Array<{ id: string; status: EpisodeStatus }>>();
  for (const episode of episodeRows) {
    const bucket = episodesByPodcast.get(episode.podcastId) ?? [];
    bucket.push({ id: episode.id, status: episode.status });
    episodesByPodcast.set(episode.podcastId, bucket);
  }

  return podcastRows.map((podcast) => {
    const podcastEpisodes = episodesByPodcast.get(podcast.id) ?? [];
    const stageCounts = summarizeStageCounts(podcastEpisodes.map((episode) => episode.status));

    return {
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      feedUrl: podcast.feedUrl,
      imageUrl: podcast.imageUrl,
      language: podcast.language,
      status: podcast.status,
      lastSyncedAt: podcast.lastSyncedAt,
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt,
      episodeCount: podcastEpisodes.length,
      stageCounts,
      latestJob: latestJobByPodcast.get(podcast.id) ?? null
    };
  });
}

export async function getPodcastEpisodesForUser(input: { clerkUserId: string; podcastId: string }) {
  const podcast = await db.query.podcasts.findFirst({
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  const episodeRows = await db.query.episodes.findMany({
    where: eq(episodes.podcastId, podcast.id),
    orderBy: [desc(episodes.publishedAt), desc(episodes.createdAt)]
  });

  const episodeIds = episodeRows.map((episode) => episode.id);
  const segmentRows = episodeIds.length
    ? await db.query.transcriptSegments.findMany({
        columns: {
          id: true,
          episodeId: true
        },
        where: inArray(transcriptSegments.episodeId, episodeIds)
      })
    : [];

  const segmentCountByEpisode = new Map<string, number>();
  for (const segment of segmentRows) {
    segmentCountByEpisode.set(segment.episodeId, (segmentCountByEpisode.get(segment.episodeId) ?? 0) + 1);
  }

  const latestJob = await db.query.ingestJobs.findFirst({
    where: eq(ingestJobs.podcastId, podcast.id),
    orderBy: [desc(ingestJobs.startedAt)]
  });

  const stageCounts = summarizeStageCounts(episodeRows.map((episode) => episode.status));

  return {
    podcast,
    latestJob,
    stageCounts,
    episodes: episodeRows.map((episode) => {
      const segmentCount = segmentCountByEpisode.get(episode.id) ?? 0;
      return {
        ...episode,
        segmentCount,
        isTranscribed: segmentCount > 0
      };
    })
  };
}

function summarizeStageCounts(statuses: EpisodeStatus[]) {
  return statuses.reduce(
    (acc, status) => {
      if (status === "queued") acc.queued += 1;
      else if (status === "processing") acc.processing += 1;
      else if (status === "completed") acc.completed += 1;
      else if (status === "failed") acc.failed += 1;
      return acc;
    },
    { queued: 0, processing: 0, completed: 0, failed: 0 }
  );
}
