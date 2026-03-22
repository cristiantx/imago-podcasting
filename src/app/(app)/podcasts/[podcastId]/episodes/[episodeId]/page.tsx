import { z } from "zod";
import { notFound } from "next/navigation";

import { EpisodeDetailBoard } from "@/components/episode-detail-board";
import { requireUser } from "@/lib/auth/session";
import { getEpisodeDetailForUser } from "@/lib/services/podcast-reader";
import { normalizeEpisodeSeekParam } from "@/lib/ui/episode-seek";
import { podcastIdSchema } from "@/lib/validation/common";

const episodeIdSchema = z.string().uuid();

export default async function EpisodeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ podcastId: string; episodeId: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const clerkUserId = await requireUser();
  const { podcastId, episodeId } = await params;
  const { t } = await searchParams;

  try {
    const payload = await getEpisodeDetailForUser({
      clerkUserId,
      podcastId: podcastIdSchema.parse(podcastId),
      episodeId: episodeIdSchema.parse(episodeId)
    });

    return (
      <EpisodeDetailBoard
        podcastId={payload.podcast.id}
        podcast={{
          id: payload.podcast.id,
          title: payload.podcast.title,
          imageUrl: payload.podcast.imageUrl,
          author: payload.podcast.author,
          category: payload.podcast.category
        }}
        episode={{
          id: payload.episode.id,
          title: payload.episode.title,
          summary: payload.episode.summary,
          publishedAt: payload.episode.publishedAt ? payload.episode.publishedAt.toISOString() : null,
          audioUrl: payload.episode.audioUrl,
          audioBlobUrl: payload.episode.audioBlobUrl,
          episodeImageUrl: payload.episode.episodeImageUrl,
          durationSec: payload.episode.durationSec,
          status: payload.episode.status
        }}
        initialSeekSec={normalizeEpisodeSeekParam(t)}
        segments={payload.segments}
      />
    );
  } catch (error) {
    if (error instanceof Error && (error.message === "Podcast not found" || error.message === "Episode not found")) {
      notFound();
    }

    throw error;
  }
}
