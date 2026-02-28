import { and, eq } from "drizzle-orm";

import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { releaseReservedUnit, reserveEpisodeUnits } from "@/lib/entitlements/service";
import { episodes, ingestJobs, podcasts } from "@/lib/db/schema";
import { parseRssFeed } from "@/lib/rss/parse-feed";

type ImportRequest = {
  clerkUserId: string;
  rssUrl: string;
  requestedEpisodes?: number;
};

type ImportResult = {
  podcastId: string;
  jobId: string;
  allowedEpisodes: number;
  remainingAfterReservation: number;
};

export async function startImportFromFeed(input: ImportRequest): Promise<ImportResult> {
  const parsedFeed = await parseRssFeed(input.rssUrl);

  const podcast = await upsertPodcast({
    clerkUserId: input.clerkUserId,
    feedUrl: input.rssUrl,
    title: parsedFeed.title,
    description: parsedFeed.description,
    imageUrl: parsedFeed.imageUrl,
    language: parsedFeed.language
  });

  const existingEpisodes = await db.query.episodes.findMany({
    columns: { rssGuid: true },
    where: eq(episodes.podcastId, podcast.id)
  });

  const existingGuids = new Set(existingEpisodes.map((item) => item.rssGuid));

  const newCandidates = parsedFeed.episodes.filter((item) => !existingGuids.has(item.guid));

  const reservationKey = crypto.randomUUID();
  const reservation = await reserveEpisodeUnits({
    clerkUserId: input.clerkUserId,
    podcastId: podcast.id,
    requestedEpisodes: input.requestedEpisodes,
    feedEpisodeCount: newCandidates.length,
    reservationKey
  });

  const selected = newCandidates.slice(0, reservation.allowedForJob);

  const [job] = await db
    .insert(ingestJobs)
    .values({
      podcastId: podcast.id,
      type: "import",
      status: selected.length === 0 ? "completed" : "queued",
      totalItems: selected.length,
      processedItems: 0,
      failedItems: 0,
      startedAt: new Date(),
      finishedAt: selected.length === 0 ? new Date() : null
    })
    .returning();

  if (selected.length === 0) {
    await releaseUnusedUnits(reservation.reservedUnits.map((unit) => unit.id));
    return {
      podcastId: podcast.id,
      jobId: job.id,
      allowedEpisodes: 0,
      remainingAfterReservation: reservation.remainingAfterReservation
    };
  }

  const candidateRows = selected.map((episode, index) => ({
    podcastId: podcast.id,
    rssGuid: episode.guid,
    title: episode.title,
    publishedAt: episode.publishedAt,
    audioUrl: episode.audioUrl,
    episodeUrl: episode.episodeUrl,
    durationSec: episode.durationSec,
    status: "queued",
    usageLedgerId: reservation.reservedUnits[index]?.id
  }));

  const inserted = await db
    .insert(episodes)
    .values(candidateRows)
    .onConflictDoNothing({ target: [episodes.podcastId, episodes.rssGuid] })
    .returning({ id: episodes.id, usageLedgerId: episodes.usageLedgerId });

  const consumedUnitSet = new Set(inserted.map((item) => item.usageLedgerId).filter((id): id is string => Boolean(id)));

  const unusedUnits = reservation.reservedUnits.filter((unit) => !consumedUnitSet.has(unit.id)).map((unit) => unit.id);
  await releaseUnusedUnits(unusedUnits);

  await db
    .update(ingestJobs)
    .set({
      totalItems: inserted.length,
      status: inserted.length === 0 ? "completed" : "queued",
      finishedAt: inserted.length === 0 ? new Date() : null,
      updatedAt: new Date()
    })
    .where(eq(ingestJobs.id, job.id));

  if (inserted.length > 0) {
    await db
      .update(podcasts)
      .set({
        status: "processing",
        updatedAt: new Date()
      })
      .where(eq(podcasts.id, podcast.id));

    await inngest.send({
      name: "podcast/import.requested",
      data: {
        podcastId: podcast.id,
        jobId: job.id,
        episodeIds: inserted.map((item) => item.id)
      }
    });
  }

  const allowedEpisodes = inserted.length;
  const remainingAfterReservation = Math.max(reservation.remainingAfterReservation + (reservation.allowedForJob - allowedEpisodes), 0);

  return {
    podcastId: podcast.id,
    jobId: job.id,
    allowedEpisodes,
    remainingAfterReservation
  };
}

export async function startResyncForPodcast(input: {
  clerkUserId: string;
  podcastId: string;
  requestedEpisodes?: number;
}) {
  const podcast = await db.query.podcasts.findFirst({
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  return startImportFromFeed({
    clerkUserId: input.clerkUserId,
    rssUrl: podcast.feedUrl,
    requestedEpisodes: input.requestedEpisodes
  });
}

async function upsertPodcast(input: {
  clerkUserId: string;
  feedUrl: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  language: string;
}) {
  const existing = await db.query.podcasts.findFirst({
    where: and(eq(podcasts.clerkUserId, input.clerkUserId), eq(podcasts.feedUrl, input.feedUrl))
  });

  if (existing) {
    const [updated] = await db
      .update(podcasts)
      .set({
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        language: input.language || "en",
        updatedAt: new Date()
      })
      .where(eq(podcasts.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(podcasts)
    .values({
      clerkUserId: input.clerkUserId,
      feedUrl: input.feedUrl,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      language: input.language || "en",
      status: "idle"
    })
    .returning();

  return created;
}

async function releaseUnusedUnits(ids: string[]) {
  await Promise.all(ids.map((id) => releaseReservedUnit(id)));
}
