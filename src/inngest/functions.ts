import { and, eq, inArray, sql } from "drizzle-orm";

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

    const total = payload.episodeIds.length;

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

    let processed = 0;
    let failed = 0;

    for (const episodeId of payload.episodeIds) {
      try {
        await step.run(`process-episode-${episodeId}`, async () => {
          await processEpisodePipeline({ episodeId });
        });
        processed += 1;
      } catch (error) {
        failed += 1;
      }

      await step.run(`job-progress-${episodeId}`, async () => {
        await db
          .update(ingestJobs)
          .set({
            processedItems: processed,
            failedItems: failed,
            updatedAt: new Date()
          })
          .where(eq(ingestJobs.id, payload.jobId));
      });
    }

    await step.run("complete-job", async () => {
      await db
        .update(ingestJobs)
        .set({
          status: failed > 0 ? "completed_with_errors" : "completed",
          finishedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(ingestJobs.id, payload.jobId));

      await db
        .update(podcasts)
        .set({
          status: failed > 0 ? "ready_with_errors" : "ready",
          lastSyncedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(podcasts.id, payload.podcastId));
    });

    return { processed, failed };
  }
);

export const functions = [importRequested];
