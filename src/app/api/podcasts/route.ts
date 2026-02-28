import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { listPodcastsForUser } from "@/lib/services/podcast-reader";

export async function GET() {
  try {
    const clerkUserId = await requireUser();
    const podcasts = await listPodcastsForUser(clerkUserId);
    return ok({ podcasts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list podcasts";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
