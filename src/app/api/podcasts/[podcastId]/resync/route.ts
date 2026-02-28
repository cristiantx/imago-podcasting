import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { startResyncForPodcast } from "@/lib/services/import-service";
import { podcastIdSchema, requestedEpisodesSchema } from "@/lib/validation/common";

const bodySchema = z.object({
  requestedEpisodes: requestedEpisodesSchema
});

export async function POST(request: Request, context: { params: Promise<{ podcastId: string }> }) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId } = await context.params;
    const parsedPodcastId = podcastIdSchema.parse(podcastId);
    const body = bodySchema.parse(await request.json());

    const result = await startResyncForPodcast({
      clerkUserId,
      podcastId: parsedPodcastId,
      requestedEpisodes: body.requestedEpisodes
    });

    return ok({
      jobId: result.jobId,
      allowedEpisodes: result.allowedEpisodes,
      remainingAfterReservation: result.remainingAfterReservation,
      queueDispatchStatus: result.queueDispatchStatus,
      queueDispatchError: result.queueDispatchError
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resync podcast";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
