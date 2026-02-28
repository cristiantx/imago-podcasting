import { and, desc, eq } from "drizzle-orm";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { episodes, ingestJobs, podcasts } from "@/lib/db/schema";
import { getEntitlementSnapshot } from "@/lib/entitlements/service";
import { fail, ok } from "@/lib/http";
import { podcastIdSchema } from "@/lib/validation/common";

export async function GET(_request: Request, context: { params: Promise<{ podcastId: string }> }) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId } = await context.params;
    const parsedPodcastId = podcastIdSchema.parse(podcastId);

    const podcast = await db.query.podcasts.findFirst({
      where: and(eq(podcasts.id, parsedPodcastId), eq(podcasts.clerkUserId, clerkUserId))
    });

    if (!podcast) {
      return fail("Podcast not found", 404);
    }

    const latestJob = await db.query.ingestJobs.findFirst({
      where: eq(ingestJobs.podcastId, podcast.id),
      orderBy: [desc(ingestJobs.startedAt)]
    });

    const allEpisodes = await db.query.episodes.findMany({
      columns: { status: true },
      where: eq(episodes.podcastId, podcast.id)
    });

    const stageCounts = allEpisodes.reduce(
      (acc, item) => {
        if (item.status === "queued") acc.queued += 1;
        else if (item.status === "processing") acc.processing += 1;
        else if (item.status === "completed") acc.completed += 1;
        else if (item.status === "failed") acc.failed += 1;
        return acc;
      },
      { queued: 0, processing: 0, completed: 0, failed: 0 }
    );

    const entitlement = await getEntitlementSnapshot(clerkUserId);

    return ok({
      podcast,
      latestJob,
      stageCounts,
      entitlement
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch status";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
