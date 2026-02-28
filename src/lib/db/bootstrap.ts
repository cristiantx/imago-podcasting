import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { plans } from "@/lib/db/schema";

export async function ensureDefaultPlan() {
  const existing = await db.query.plans.findFirst({ where: eq(plans.code, "free") });
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(plans)
    .values({
      code: "free",
      name: "Free",
      baseEpisodeQuota: 5,
      active: true
    })
    .returning();

  return created;
}

export async function ensurePlanByCode(input: { code: string; defaultQuota?: number }) {
  const existing = await db.query.plans.findFirst({ where: eq(plans.code, input.code) });
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(plans)
    .values({
      code: input.code,
      name: input.code.toUpperCase(),
      baseEpisodeQuota: input.defaultQuota ?? 50,
      active: true
    })
    .returning();

  return created;
}
