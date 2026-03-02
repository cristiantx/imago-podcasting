import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { fail } from "@/lib/http";
import { buildEpisodeTranscriptVttExport } from "@/lib/services/transcript-export";
import { podcastIdSchema } from "@/lib/validation/common";

const episodeIdSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ podcastId: string; episodeId: string }> }
) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId, episodeId } = await context.params;

    const file = await buildEpisodeTranscriptVttExport({
      clerkUserId,
      podcastId: podcastIdSchema.parse(podcastId),
      episodeId: episodeIdSchema.parse(episodeId)
    });

    return new Response(file.content, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export episode transcript";
    const status = message === "Unauthorized" ? 401 : message.includes("not found") ? 404 : 400;
    return fail(message, status);
  }
}
