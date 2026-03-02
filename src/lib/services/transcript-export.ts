import { and, eq, inArray } from "drizzle-orm";

import type { Utterance } from "@/lib/chunking/transcript-chunker";
import { db } from "@/lib/db/client";
import { episodes, podcasts, transcriptSegments } from "@/lib/db/schema";
import { storeEpisodeWebVtt } from "@/lib/storage/transcript";
import { buildWebVttFromUtterances } from "@/lib/transcription/captions";

export async function buildPodcastTranscriptTextExport(input: { clerkUserId: string; podcastId: string }) {
  const podcast = await db.query.podcasts.findFirst({
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  const episodeRows = await db.query.episodes.findMany({
    columns: {
      id: true,
      title: true,
      publishedAt: true,
      episodeUrl: true,
      audioUrl: true,
      status: true
    },
    where: eq(episodes.podcastId, podcast.id)
  });

  if (episodeRows.length === 0) {
    throw new Error("No episodes found for this podcast");
  }

  const episodeIds = episodeRows.map((row) => row.id);

  const segmentRows = await db.query.transcriptSegments.findMany({
    columns: {
      episodeId: true,
      speakerLabel: true,
      startMs: true,
      endMs: true,
      text: true,
      chunkIndex: true
    },
    where: inArray(transcriptSegments.episodeId, episodeIds),
    orderBy: [transcriptSegments.episodeId, transcriptSegments.chunkIndex]
  });

  const segmentsByEpisode = groupSegmentsByEpisode(segmentRows);

  const orderedEpisodes = [...episodeRows].sort((a, b) => {
    const left = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const right = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return right - left;
  });

  const lines: string[] = [];
  lines.push(`# ${podcast.title ?? "Untitled Podcast"} - Transcript Export`);
  lines.push(`Feed: ${podcast.feedUrl}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  for (const episode of orderedEpisodes) {
    lines.push(`## ${episode.title}`);
    lines.push(`Episode URL: ${episode.episodeUrl ?? episode.audioUrl}`);
    lines.push(`Published: ${episode.publishedAt ? new Date(episode.publishedAt).toISOString() : "unknown"}`);
    lines.push(`Status: ${episode.status}`);

    const segments = segmentsByEpisode.get(episode.id) ?? [];

    if (segments.length === 0) {
      lines.push("(No transcript segments stored)");
      lines.push("");
      continue;
    }

    for (const segment of segments) {
      const speaker = segment.speakerLabel ?? "Speaker";
      lines.push(`[${formatTimestamp(segment.startMs)} - ${formatTimestamp(segment.endMs)}] ${speaker}: ${segment.text}`);
    }

    lines.push("");
  }

  return {
    filename: toSafeFilename(`${podcast.title ?? "podcast"}-transcripts-${new Date().toISOString().slice(0, 10)}.txt`),
    content: lines.join("\n")
  };
}

export async function buildEpisodeTranscriptVttExport(input: {
  clerkUserId: string;
  podcastId: string;
  episodeId: string;
}) {
  const podcast = await db.query.podcasts.findFirst({
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  const episode = await db.query.episodes.findFirst({
    where: and(eq(episodes.id, input.episodeId), eq(episodes.podcastId, podcast.id))
  });

  if (!episode) {
    throw new Error("Episode not found");
  }

  const filename = toSafeFilename(`${episode.title}-transcript-${new Date().toISOString().slice(0, 10)}.vtt`);

  if (episode.transcriptVttBlobUrl) {
    const storedVtt = await fetch(episode.transcriptVttBlobUrl)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const content = await response.text();
        return content.trim().startsWith("WEBVTT") ? content : null;
      })
      .catch(() => null);

    if (storedVtt) {
      return { filename, content: storedVtt };
    }
  }

  const segments = await db.query.transcriptSegments.findMany({
    where: eq(transcriptSegments.episodeId, episode.id),
    orderBy: [transcriptSegments.chunkIndex]
  });

  if (segments.length === 0) {
    throw new Error("No transcript segments available for this episode");
  }

  const utterances: Utterance[] = segments.map((segment) => ({
    speaker: segment.speakerLabel,
    startMs: segment.startMs,
    endMs: segment.endMs,
    text: segment.text
  }));
  const content = buildWebVttFromUtterances(utterances);

  await storeEpisodeWebVtt({
    podcastId: podcast.id,
    episodeId: episode.id,
    content
  })
    .then(async (stored) => {
      await db
        .update(episodes)
        .set({
          transcriptVttBlobUrl: stored.url,
          updatedAt: new Date()
        })
        .where(eq(episodes.id, episode.id));
    })
    .catch(() => {
      return undefined;
    });

  return { filename, content };
}

function groupSegmentsByEpisode(
  segments: Array<{
    episodeId: string;
    speakerLabel: string | null;
    startMs: number;
    endMs: number;
    text: string;
    chunkIndex: number;
  }>
) {
  const byEpisode = new Map<string, typeof segments>();
  for (const segment of segments) {
    const current = byEpisode.get(segment.episodeId) ?? [];
    current.push(segment);
    byEpisode.set(segment.episodeId, current);
  }

  return byEpisode;
}

function formatTimestamp(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function toSafeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
