import { requireUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { listDashboardEpisodesForUser } from "@/lib/services/podcast-reader";
import type { DashboardOverviewPayload } from "@/lib/ui/dashboard-overview";

export async function GET() {
  try {
    const clerkUserId = await requireUser();
    const episodes = await listDashboardEpisodesForUser(clerkUserId);

    const payload: DashboardOverviewPayload = {
      episodes,
      generatedAt: new Date().toISOString()
    };

    return ok(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard overview";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
