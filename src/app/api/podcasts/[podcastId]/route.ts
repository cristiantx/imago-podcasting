import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { deletePodcastForUser, renamePodcastForUser } from "@/lib/services/podcast-management";
import { podcastIdSchema, podcastTitleSchema } from "@/lib/validation/common";

const renameBodySchema = z.object({
  title: podcastTitleSchema
});

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

export async function PATCH(request: Request, context: { params: Promise<{ podcastId: string }> }) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId } = await context.params;
    const parsedPodcastId = podcastIdSchema.parse(podcastId);
    const body = renameBodySchema.parse(await request.json());

    const result = await renamePodcastForUser({
      clerkUserId,
      podcastId: parsedPodcastId,
      title: body.title
    });

    return ok({
      ...result,
      message: "Podcast renamed."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rename podcast";
    return fail(message, message === "Unauthorized" ? 401 : message === "Podcast not found" ? 404 : 400);
  }
}
