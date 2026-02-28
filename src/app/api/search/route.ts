import { and, eq } from "drizzle-orm";

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

    const podcast = await db.query.podcasts.findFirst({
      where: and(eq(podcasts.id, body.podcastId), eq(podcasts.clerkUserId, clerkUserId))
    });

    if (!podcast) {
      return fail("Podcast not found", 404);
    }

    const [embedding] = await embedTextBatch([body.query]);
    const namespace = getNamespace(clerkUserId);

    const searchResult = await namespace.query({
      vector: embedding,
      topK: body.topK,
      includeMetadata: true,
      filter: {
        podcastId: body.podcastId
      }
    });

    const deduped = dedupeMatches(
      (searchResult.matches ?? []).map((item) => ({
        score: item.score ?? 0,
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
      .slice(0, body.topK)
      .map((item) => ({
        episodeId: item.episodeId,
        episodeTitle: item.episodeTitle,
        episodeUrl: item.episodeUrl.includes("?")
          ? `${item.episodeUrl}&t=${Math.floor(item.startMs / 1000)}`
          : `${item.episodeUrl}?t=${Math.floor(item.startMs / 1000)}`,
        publishedAt: item.publishedAt,
        startSec: Math.floor(item.startMs / 1000),
        endSec: Math.floor(item.endMs / 1000),
        speaker: item.speaker,
        snippet: item.snippet,
        score: item.score
      }));

    await db.insert(searchLogs).values({
      podcastId: body.podcastId,
      queryText: body.query,
      resultCount: deduped.length,
      latencyMs: Date.now() - startedAt
    });

    return ok({ results: deduped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

type Match = {
  score: number;
  episodeId: string;
  episodeTitle: string;
  episodeUrl: string;
  publishedAt: string | null;
  startMs: number;
  endMs: number;
  speaker: string | null;
  snippet: string;
};

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
