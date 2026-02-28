import { requireUser } from "@/lib/auth/session";
import { fail } from "@/lib/http";
import { buildPodcastTranscriptTextExport } from "@/lib/services/transcript-export";
import { podcastIdSchema } from "@/lib/validation/common";

export async function GET(_request: Request, context: { params: Promise<{ podcastId: string }> }) {
  try {
    const clerkUserId = await requireUser();
    const { podcastId } = await context.params;
    const parsedPodcastId = podcastIdSchema.parse(podcastId);

    const file = await buildPodcastTranscriptTextExport({
      clerkUserId,
      podcastId: parsedPodcastId
    });

    return new Response(file.content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export transcripts";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
