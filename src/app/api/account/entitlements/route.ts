import { requireUser } from "@/lib/auth/session";
import { getEntitlementSnapshot } from "@/lib/entitlements/service";
import { fail, ok } from "@/lib/http";

export async function GET() {
  try {
    const clerkUserId = await requireUser();
    const snapshot = await getEntitlementSnapshot(clerkUserId);
    return ok(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load entitlements";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
