import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { previewImportFromFeed } from "@/lib/services/import-service";
import { rssUrlSchema } from "@/lib/validation/common";

const bodySchema = z.object({
  rssUrl: rssUrlSchema
});

export async function POST(request: Request) {
  try {
    const clerkUserId = await requireUser();
    const body = bodySchema.parse(await request.json());
    const result = await previewImportFromFeed({ clerkUserId, rssUrl: body.rssUrl });

    if (result.status === "existing_feed") {
      return fail("Feed already exists in your workspace", 409, {
        podcastId: result.podcastId,
        podcastTitle: result.podcastTitle
      });
    }

    return ok(result.payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to preview feed import";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
