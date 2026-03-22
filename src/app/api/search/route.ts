import { and, eq, inArray } from "drizzle-orm";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { podcasts, searchLogs } from "@/lib/db/schema";
import { fail, ok } from "@/lib/http";
import { embedTextBatch } from "@/lib/vector/embeddings";
import { getNamespace } from "@/lib/vector/pinecone";
import { searchSchema } from "@/lib/validation/common";

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const clerkUserId = await requireUser();
    const body = searchSchema.parse(await request.json());
    const scopePodcastIds = resolveScopePodcastIds(body);

    const authorizedPodcasts = await db.query.podcasts.findMany({
      columns: {
        id: true,
        title: true,
        imageUrl: true,
        deletedAt: true
      },
      where: and(eq(podcasts.clerkUserId, clerkUserId), inArray(podcasts.id, scopePodcastIds))
    });

    const podcastsForUser = authorizedPodcasts.filter((podcast) => podcast && podcast.id && podcast.deletedAt == null);
    if (podcastsForUser.length !== scopePodcastIds.length) {
      return fail("Podcast not found", 404);
    }

    const podcastById = new Map(
      podcastsForUser.map((podcast) => [
        podcast.id,
        {
          title: podcast.title,
          imageUrl: podcast.imageUrl
        }
      ])
    );

    const [embedding] = await embedTextBatch([body.query]);
    const namespace = getNamespace(clerkUserId);
    const requestedTopK = body.topK;
    const candidateTopK = Math.min(Math.max(requestedTopK * 3, 30), 100);

    const searchResult = await namespace.query({
      vector: embedding,
      topK: candidateTopK,
      includeMetadata: true,
      filter:
        scopePodcastIds.length === 1
          ? { podcastId: scopePodcastIds[0] }
          : { podcastId: { $in: scopePodcastIds } }
    });

    const deduped = dedupeMatches(
      (searchResult.matches ?? []).map((item) => ({
        score: item.score ?? 0,
        podcastId: String(item.metadata?.podcastId ?? ""),
        episodeId: String(item.metadata?.episodeId ?? ""),
        episodeTitle: String(item.metadata?.episodeTitle ?? "Untitled"),
        episodeUrl: String(item.metadata?.episodeUrl ?? ""),
        publishedAt: item.metadata?.publishedAt ? String(item.metadata.publishedAt) : null,
        startMs: Number(item.metadata?.startMs ?? 0),
        endMs: Number(item.metadata?.endMs ?? 0),
        speaker: item.metadata?.speaker ? String(item.metadata.speaker) : null,
        snippet: String(item.metadata?.snippet ?? "")
      }))
    )
      .filter((item) => podcastById.has(item.podcastId))
      .slice(0, requestedTopK)
      .map((item) => {
        const podcast = podcastById.get(item.podcastId);
        const startSec = Math.floor(item.startMs / 1000);

        return {
          podcastId: item.podcastId,
          podcastTitle: podcast?.title ?? "Untitled Podcast",
          podcastImageUrl: podcast?.imageUrl ?? null,
          episodeId: item.episodeId,
          episodeTitle: item.episodeTitle,
          episodeUrl: appendTimestamp(item.episodeUrl, startSec),
          episodeHref: `/podcasts/${item.podcastId}/episodes/${item.episodeId}?t=${startSec}`,
          publishedAt: item.publishedAt,
          startSec,
          endSec: Math.floor(item.endMs / 1000),
          speaker: item.speaker,
          snippet: item.snippet,
          score: item.score
        };
      });

    if (scopePodcastIds.length === 1) {
      await db.insert(searchLogs).values({
        podcastId: scopePodcastIds[0],
        queryText: body.query,
        resultCount: deduped.length,
        latencyMs: Date.now() - startedAt
      });
    }

    return ok({ results: deduped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

type SearchPayload = {
  podcastId?: string;
  podcastIds?: string[];
  query: string;
  topK: number;
};

type Match = {
  score: number;
  podcastId: string;
  episodeId: string;
  episodeTitle: string;
  episodeUrl: string;
  publishedAt: string | null;
  startMs: number;
  endMs: number;
  speaker: string | null;
  snippet: string;
};

function resolveScopePodcastIds(body: SearchPayload) {
  const scope = body.podcastIds ?? (body.podcastId ? [body.podcastId] : []);
  return Array.from(new Set(scope));
}

function appendTimestamp(url: string, seconds: number) {
  if (!url) {
    return "";
  }

  return url.includes("?") ? `${url}&t=${seconds}` : `${url}?t=${seconds}`;
}

function dedupeMatches(matches: Match[]): Match[] {
  const sorted = [...matches].sort((a, b) => b.score - a.score);
  const keep: Match[] = [];

  for (const candidate of sorted) {
    const overlap = keep.find((existing) => {
      if (existing.episodeId !== candidate.episodeId) {
        return false;
      }

      const startsClose = Math.abs(existing.startMs - candidate.startMs) < 20_000;
      const endsClose = Math.abs(existing.endMs - candidate.endMs) < 20_000;
      return startsClose && endsClose;
    });

    if (!overlap) {
      keep.push(candidate);
    }
  }

  return keep;
}
