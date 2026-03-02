import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { getExistingPodcastForFeed, startImportFromFeed } from "@/lib/services/import-service";
import { requestedEpisodesSchema, rssUrlSchema } from "@/lib/validation/common";

const bodySchema = z.object({
  rssUrl: rssUrlSchema,
  requestedEpisodes: requestedEpisodesSchema
});

export async function POST(request: Request) {
  try {
    const clerkUserId = await requireUser();
    const body = bodySchema.parse(await request.json());
    const existing = await getExistingPodcastForFeed({ clerkUserId, feedUrl: body.rssUrl });

    if (existing) {
      return fail("Feed already exists in your workspace", 409, {
        podcastId: existing.id,
        podcastTitle: existing.title
      });
    }

    const result = await startImportFromFeed({
      clerkUserId,
      rssUrl: body.rssUrl,
      requestedEpisodes: body.requestedEpisodes
    });

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create import";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
