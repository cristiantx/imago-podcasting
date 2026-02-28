import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { deletePodcastForUser } from "@/lib/services/podcast-management";
import { podcastIdSchema } from "@/lib/validation/common";

export async function DELETE(_request: Request, context: { params: Promise<{ podcastId: string }> }) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId } = await context.params;
    const parsedPodcastId = podcastIdSchema.parse(podcastId);

    const result = await deletePodcastForUser({
      clerkUserId,
      podcastId: parsedPodcastId
    });

    return ok({
      ...result,
      message: "Podcast deleted. Usage history was preserved."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete podcast";
    return fail(message, message === "Unauthorized" ? 401 : message === "Podcast not found" ? 404 : 400);
  }
}
