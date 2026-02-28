import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db/client";
import { ensurePlanByCode } from "@/lib/db/bootstrap";
import { accountEntitlements } from "@/lib/db/schema";
import { getEnv } from "@/lib/config";
import { fail, ok } from "@/lib/http";

const bodySchema = z.object({
  clerkUserId: z.string().min(2),
  planCode: z.string().min(2),
  creditDelta: z.number().int()
});

export async function POST(request: Request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (!adminKey || adminKey !== getEnv().ADMIN_API_KEY) {
      return fail("Unauthorized admin request", 401);
    }

    const body = bodySchema.parse(await request.json());
    const plan = await ensurePlanByCode({
      code: body.planCode,
      defaultQuota: body.planCode === "free" ? 5 : 50
    });

    const entitlement = await db.query.accountEntitlements.findFirst({
      where: eq(accountEntitlements.clerkUserId, body.clerkUserId)
    });

    if (!entitlement) {
      await db.insert(accountEntitlements).values({
        clerkUserId: body.clerkUserId,
        planId: plan.id,
        extraEpisodeCredits: Math.max(body.creditDelta, 0)
      });
    } else {
      await db
        .update(accountEntitlements)
        .set({
          planId: plan.id,
          extraEpisodeCredits: Math.max(entitlement.extraEpisodeCredits + body.creditDelta, 0),
          updatedAt: new Date()
        })
        .where(eq(accountEntitlements.id, entitlement.id));
    }

    return ok({ message: "Entitlement updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to adjust entitlements";
    return fail(message, 400);
  }
}
