import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { retryQueueDispatchForPodcast } from "@/lib/services/import-service";
import { podcastIdSchema } from "@/lib/validation/common";

export async function POST(_request: Request, context: { params: Promise<{ podcastId: string }> }) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId } = await context.params;
    const parsedPodcastId = podcastIdSchema.parse(podcastId);

    const result = await retryQueueDispatchForPodcast({
      clerkUserId,
      podcastId: parsedPodcastId
    });

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry queue dispatch";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
