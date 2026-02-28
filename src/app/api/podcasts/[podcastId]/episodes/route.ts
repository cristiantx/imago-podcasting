import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { getPodcastEpisodesForUser } from "@/lib/services/podcast-reader";
import { podcastIdSchema } from "@/lib/validation/common";

export async function GET(_request: Request, context: { params: Promise<{ podcastId: string }> }) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId } = await context.params;
    const parsedPodcastId = podcastIdSchema.parse(podcastId);

    const payload = await getPodcastEpisodesForUser({
      clerkUserId,
      podcastId: parsedPodcastId
    });

    return ok(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list episodes";
    return fail(message, message === "Unauthorized" ? 401 : message === "Podcast not found" ? 404 : 400);
  }
}
