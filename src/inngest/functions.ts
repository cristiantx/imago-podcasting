import { and, eq, inArray } from "drizzle-orm";

import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { episodes, ingestJobs, podcasts } from "@/lib/db/schema";
import { processEpisodePipeline } from "@/lib/pipeline/process-episode";

export const importRequested = inngest.createFunction(
  { id: "podcast-import-requested", retries: 3 },
  { event: "podcast/import.requested" },
  async ({ event, step }) => {
    const payload = event.data as {
      podcastId: string;
      jobId: string;
      episodeIds: string[];
    };

    const job = await step.run("load-job", async () => {
      return db.query.ingestJobs.findFirst({ where: eq(ingestJobs.id, payload.jobId) });
    });

    if (!job) {
      throw new Error(`Ingest job ${payload.jobId} not found`);
    }

    if (!["queued", "dispatch_failed", "processing"].includes(job.status)) {
      return { skipped: true, reason: `Job already in status ${job.status}` };
    }

    const episodeIds =
      payload.episodeIds?.filter((id): id is string => typeof id === "string" && id.length > 0) ??
      (job.queuedEpisodeIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);
    const total = episodeIds.length;

    if (job.status !== "processing") {
      await step.run("start-job", async () => {
        await db
          .update(ingestJobs)
          .set({
            status: "processing",
            totalItems: total,
            processedItems: 0,
            failedItems: 0,
            updatedAt: new Date()
          })
          .where(eq(ingestJobs.id, payload.jobId));
      });
    }

    if (episodeIds.length === 0) {
      await step.run("complete-empty-job", async () => {
        await db
          .update(ingestJobs)
          .set({
            status: "completed",
            finishedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(ingestJobs.id, payload.jobId));

        await db
          .update(podcasts)
          .set({
            status: "ready",
            lastSyncedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(podcasts.id, payload.podcastId));
      });

      return { queuedEpisodeEvents: 0 };
    }

    await step.run("enqueue-episode-events", async () => {
      for (const episodeId of episodeIds) {
        await inngest.send({
          id: `${payload.jobId}:${episodeId}`,
          name: "podcast/episode.process.requested",
          data: {
            podcastId: payload.podcastId,
            jobId: payload.jobId,
            episodeId
          }
        });
      }
    });

    return { queuedEpisodeEvents: episodeIds.length };
  }
);

export const episodeProcessRequested = inngest.createFunction(
  { id: "podcast-episode-process-requested", retries: 0 },
  { event: "podcast/episode.process.requested" },
  async ({ event, step }) => {
    const payload = event.data as {
      podcastId: string;
      jobId: string;
      episodeId: string;
    };

    const job = await step.run("load-job", async () => {
      return db.query.ingestJobs.findFirst({ where: eq(ingestJobs.id, payload.jobId) });
    });

    if (!job) {
      return { skipped: true, reason: `Ingest job ${payload.jobId} not found` };
    }

    const expectedEpisodeIds = (job.queuedEpisodeIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);
    if (!expectedEpisodeIds.includes(payload.episodeId)) {
      return { skipped: true, reason: "Episode is not part of the queued job payload" };
    }

    const episode = await step.run("load-episode", async () => {
      return db.query.episodes.findFirst({
        where: and(eq(episodes.id, payload.episodeId), eq(episodes.podcastId, payload.podcastId))
      });
    });

    if (!episode) {
      await step.run("sync-missing-episode-progress", async () => {
        await syncJobProgress({ jobId: payload.jobId, podcastId: payload.podcastId });
      });
      return { skipped: true, reason: `Episode ${payload.episodeId} not found` };
    }

    if (episode.status !== "completed") {
      await step.run(`process-episode-${payload.episodeId}`, async () => {
        try {
          await processEpisodePipeline({ episodeId: payload.episodeId });
        } catch {
          return;
        }
      });
    }

    await step.run("sync-job-progress", async () => {
      await syncJobProgress({ jobId: payload.jobId, podcastId: payload.podcastId });
    });

    return { episodeId: payload.episodeId, status: "processed" };
  }
);

async function syncJobProgress(input: { jobId: string; podcastId: string }) {
  const job = await db.query.ingestJobs.findFirst({ where: eq(ingestJobs.id, input.jobId) });
  if (!job) {
    return;
  }

  const queuedEpisodeIds = (job.queuedEpisodeIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);

  if (queuedEpisodeIds.length === 0) {
    await db
      .update(ingestJobs)
      .set({
        status: "completed",
        totalItems: 0,
        processedItems: 0,
        failedItems: 0,
        finishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(ingestJobs.id, input.jobId));

    await db
      .update(podcasts)
      .set({
        status: "ready",
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(podcasts.id, input.podcastId));
    return;
  }

  const rows = await db.query.episodes.findMany({
    columns: { id: true, status: true },
    where: and(eq(episodes.podcastId, input.podcastId), inArray(episodes.id, queuedEpisodeIds))
  });

  const failedItems = rows.filter((row) => row.status === "failed").length;
  const completedItems = rows.filter((row) => row.status === "completed").length;
  const processedItems = failedItems + completedItems;
  const totalItems = queuedEpisodeIds.length;
  const isDone = processedItems >= totalItems;

  await db
    .update(ingestJobs)
    .set({
      status: isDone ? (failedItems > 0 ? "completed_with_errors" : "completed") : "processing",
      totalItems,
      processedItems,
      failedItems,
      finishedAt: isDone ? new Date() : null,
      updatedAt: new Date()
    })
    .where(eq(ingestJobs.id, input.jobId));

  if (!isDone) {
    return;
  }

  await db
    .update(podcasts)
    .set({
      status: failedItems > 0 ? "ready_with_errors" : "ready",
      lastSyncedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(podcasts.id, input.podcastId));
}

export const functions = [importRequested, episodeProcessRequested];
