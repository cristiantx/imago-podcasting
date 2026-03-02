import { and, desc, eq, inArray } from "drizzle-orm";

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

type QueueDispatchStatus = "not_required" | "sent" | "failed";

type ImportResult = {
  podcastId: string;
  jobId: string;
  allowedEpisodes: number;
  remainingAfterReservation: number;
  queueDispatchStatus: QueueDispatchStatus;
  queueDispatchError: string | null;
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
    columns: { id: true, rssGuid: true, episodeImageUrl: true },
    where: eq(episodes.podcastId, podcast.id)
  });

  const existingByGuid = new Map(existingEpisodes.map((episode) => [episode.rssGuid, episode]));

  const imageBackfills = parsedFeed.episodes.filter((episode) => {
    const existing = existingByGuid.get(episode.guid);
    return Boolean(existing && !existing.episodeImageUrl && episode.episodeImageUrl);
  });

  if (imageBackfills.length > 0) {
    await Promise.all(
      imageBackfills.map(async (episode) => {
        const existing = existingByGuid.get(episode.guid);
        if (!existing || !episode.episodeImageUrl) {
          return;
        }

        await db
          .update(episodes)
          .set({
            episodeImageUrl: episode.episodeImageUrl,
            updatedAt: new Date()
          })
          .where(eq(episodes.id, existing.id));
      })
    );
  }

  const newCandidates = parsedFeed.episodes.filter((item) => !existingByGuid.has(item.guid));

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
      queueDispatchStatus: selected.length === 0 ? "not_required" : "pending",
      queueDispatchAttempts: 0,
      queueDispatchError: null,
      queuedEpisodeIds: [],
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
      remainingAfterReservation: reservation.remainingAfterReservation,
      queueDispatchStatus: "not_required",
      queueDispatchError: null
    };
  }

  const candidateRows = selected.map((episode, index) => ({
    podcastId: podcast.id,
    rssGuid: episode.guid,
    title: episode.title,
    publishedAt: episode.publishedAt,
    audioUrl: episode.audioUrl,
    episodeUrl: episode.episodeUrl,
    episodeImageUrl: episode.episodeImageUrl,
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

  const insertedEpisodeIds = inserted.map((item) => item.id);

  await db
    .update(ingestJobs)
    .set({
      totalItems: inserted.length,
      status: inserted.length === 0 ? "completed" : "queued",
      finishedAt: inserted.length === 0 ? new Date() : null,
      queueDispatchStatus: inserted.length === 0 ? "not_required" : "pending",
      queueDispatchError: null,
      queuedEpisodeIds: insertedEpisodeIds,
      updatedAt: new Date()
    })
    .where(eq(ingestJobs.id, job.id));

  if (inserted.length === 0) {
    return {
      podcastId: podcast.id,
      jobId: job.id,
      allowedEpisodes: 0,
      remainingAfterReservation: reservation.remainingAfterReservation,
      queueDispatchStatus: "not_required",
      queueDispatchError: null
    };
  }

  await db
    .update(podcasts)
    .set({
      status: "queued",
      updatedAt: new Date()
    })
    .where(eq(podcasts.id, podcast.id));

  const dispatch = await dispatchImportJob({
    podcastId: podcast.id,
    jobId: job.id,
    episodeIds: insertedEpisodeIds
  });

  if (dispatch.queueDispatchStatus === "sent") {
    await db
      .update(podcasts)
      .set({
        status: "processing",
        updatedAt: new Date()
      })
      .where(eq(podcasts.id, podcast.id));
  } else {
    await db
      .update(podcasts)
      .set({
        status: "dispatch_failed",
        updatedAt: new Date()
      })
      .where(eq(podcasts.id, podcast.id));
  }

  const allowedEpisodes = inserted.length;
  const remainingAfterReservation = Math.max(reservation.remainingAfterReservation + (reservation.allowedForJob - allowedEpisodes), 0);

  return {
    podcastId: podcast.id,
    jobId: job.id,
    allowedEpisodes,
    remainingAfterReservation,
    queueDispatchStatus: dispatch.queueDispatchStatus,
    queueDispatchError: dispatch.queueDispatchError
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

export async function retryQueueDispatchForPodcast(input: { clerkUserId: string; podcastId: string }) {
  const podcast = await db.query.podcasts.findFirst({
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  const job = await db.query.ingestJobs.findFirst({
    where: and(eq(ingestJobs.podcastId, podcast.id), inArray(ingestJobs.queueDispatchStatus, ["pending", "failed"])),
    orderBy: [desc(ingestJobs.startedAt)]
  });

  if (!job) {
    throw new Error("No queued job needs dispatch retry");
  }

  const episodeIds = (job.queuedEpisodeIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);

  if (episodeIds.length === 0) {
    throw new Error("No queued episodes found for this job");
  }

  const queuedEpisodeRows = await db.query.episodes.findMany({
    columns: { id: true },
    where: and(eq(episodes.podcastId, podcast.id), inArray(episodes.id, episodeIds), eq(episodes.status, "queued"))
  });

  const queuedEpisodeIds = queuedEpisodeRows.map((row) => row.id);

  if (queuedEpisodeIds.length === 0) {
    return {
      jobId: job.id,
      queueDispatchStatus: "not_required" as const,
      queueDispatchError: null,
      queuedEpisodes: 0,
      message: "No queued episodes require dispatch"
    };
  }

  const dispatch = await dispatchImportJob({
    podcastId: podcast.id,
    jobId: job.id,
    episodeIds: queuedEpisodeIds
  });

  if (dispatch.queueDispatchStatus === "sent") {
    await db
      .update(podcasts)
      .set({
        status: "processing",
        updatedAt: new Date()
      })
      .where(eq(podcasts.id, podcast.id));
  }

  return {
    jobId: job.id,
    queueDispatchStatus: dispatch.queueDispatchStatus,
    queueDispatchError: dispatch.queueDispatchError,
    queuedEpisodes: queuedEpisodeIds.length,
    message: dispatch.queueDispatchStatus === "sent" ? "Dispatch retry succeeded" : "Dispatch retry failed"
  };
}

async function dispatchImportJob(input: { podcastId: string; jobId: string; episodeIds: string[] }) {
  const currentJob = await db.query.ingestJobs.findFirst({ where: eq(ingestJobs.id, input.jobId) });
  const nextAttempt = (currentJob?.queueDispatchAttempts ?? 0) + 1;

  try {
    await inngest.send({
      name: "podcast/import.requested",
      data: {
        podcastId: input.podcastId,
        jobId: input.jobId,
        episodeIds: input.episodeIds
      }
    });

    await db
      .update(ingestJobs)
      .set({
        queueDispatchStatus: "sent",
        queueDispatchAttempts: nextAttempt,
        queueDispatchError: null,
        status: "queued",
        updatedAt: new Date()
      })
      .where(eq(ingestJobs.id, input.jobId));

    return { queueDispatchStatus: "sent" as const, queueDispatchError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to dispatch job to queue";

    await db
      .update(ingestJobs)
      .set({
        queueDispatchStatus: "failed",
        queueDispatchAttempts: nextAttempt,
        queueDispatchError: message,
        status: "dispatch_failed",
        updatedAt: new Date()
      })
      .where(eq(ingestJobs.id, input.jobId));

    return { queueDispatchStatus: "failed" as const, queueDispatchError: message };
  }
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
