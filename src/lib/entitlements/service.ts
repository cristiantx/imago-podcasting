import { and, eq, inArray, sql } from "drizzle-orm";

import { getEnv } from "@/lib/config";
import { db } from "@/lib/db/client";
import { ensureDefaultPlan } from "@/lib/db/bootstrap";
import { accountEntitlements, plans, usageLedger } from "@/lib/db/schema";
import { computeReservationPolicy } from "@/lib/entitlements/policy";

type EntitlementSnapshot = {
  entitlementId: string;
  planId: string;
  planCode: string;
  planQuota: number;
  extraCredits: number;
  consumedUnits: number;
  remainingUnits: number;
};

type ReserveResult = {
  allowedForJob: number;
  remainingAfterReservation: number;
  reservedUnits: Array<{ id: string; source: "plan" | "credit" }>;
};

export async function getOrCreateEntitlement(clerkUserId: string) {
  return db.transaction(async (tx) => getOrCreateEntitlementInTx(tx, clerkUserId));
}

async function getOrCreateEntitlementInTx(
  tx: any,
  clerkUserId: string
) {
  const defaultPlan = await ensureDefaultPlan();

  const existing = await tx.query.accountEntitlements.findFirst({
    where: eq(accountEntitlements.clerkUserId, clerkUserId)
  });

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(accountEntitlements)
    .values({
      clerkUserId,
      planId: defaultPlan.id,
      extraEpisodeCredits: 0
    })
    .returning();

  return created;
}

export async function getEntitlementSnapshot(clerkUserId: string): Promise<EntitlementSnapshot> {
  const entitlement = await getOrCreateEntitlement(clerkUserId);
  const plan = await db.query.plans.findFirst({ where: eq(plans.id, entitlement.planId) });

  if (!plan) {
    throw new Error("Entitlement plan not found");
  }

  const [{ count }] = await db
    .select({ count: sql<number>`coalesce(sum(${usageLedger.units}), 0)` })
    .from(usageLedger)
    .where(
      and(
        eq(usageLedger.clerkUserId, clerkUserId),
        inArray(usageLedger.status, ["reserved", "consumed"])
      )
    );

  const consumedUnits = Number(count ?? 0);
  const totalUnits = plan.baseEpisodeQuota + entitlement.extraEpisodeCredits;
  const remainingUnits = Math.max(totalUnits - consumedUnits, 0);

  return {
    entitlementId: entitlement.id,
    planId: plan.id,
    planCode: plan.code,
    planQuota: plan.baseEpisodeQuota,
    extraCredits: entitlement.extraEpisodeCredits,
    consumedUnits,
    remainingUnits
  };
}

export async function reserveEpisodeUnits(input: {
  clerkUserId: string;
  podcastId: string;
  requestedEpisodes?: number;
  feedEpisodeCount: number;
  reservationKey: string;
}): Promise<ReserveResult> {
  const env = getEnv();

  return db.transaction(async (tx) => {
    const entitlement = await getOrCreateEntitlementInTx(tx, input.clerkUserId);
    const plan = await tx.query.plans.findFirst({ where: eq(plans.id, entitlement.planId) });

    if (!plan) {
      throw new Error("Plan not found while reserving usage");
    }

    const [{ planUsed }] = await tx
      .select({ planUsed: sql<number>`coalesce(sum(${usageLedger.units}), 0)` })
      .from(usageLedger)
      .where(
        and(
          eq(usageLedger.clerkUserId, input.clerkUserId),
          eq(usageLedger.source, "plan"),
          inArray(usageLedger.status, ["reserved", "consumed"])
        )
      );

    const [{ creditUsed }] = await tx
      .select({ creditUsed: sql<number>`coalesce(sum(${usageLedger.units}), 0)` })
      .from(usageLedger)
      .where(
        and(
          eq(usageLedger.clerkUserId, input.clerkUserId),
          eq(usageLedger.source, "credit"),
          inArray(usageLedger.status, ["reserved", "consumed"])
        )
      );

    const policy = computeReservationPolicy({
      requestedEpisodes: input.requestedEpisodes,
      feedEpisodeCount: input.feedEpisodeCount,
      planQuota: plan.baseEpisodeQuota,
      planUsed: Number(planUsed ?? 0),
      extraCredits: entitlement.extraEpisodeCredits,
      creditUsed: Number(creditUsed ?? 0),
      operationalCap: env.ABSOLUTE_EPISODE_SAFETY_CAP
    });

    const rows: Array<{ id: string; source: "plan" | "credit" }> = [];

    if (policy.reserveFromPlan > 0) {
      const created = await tx
        .insert(usageLedger)
        .values(
          Array.from({ length: policy.reserveFromPlan }).map(() => ({
            clerkUserId: input.clerkUserId,
            podcastId: input.podcastId,
            units: 1,
            source: "plan" as const,
            status: "reserved",
            reservationKey: input.reservationKey
          }))
        )
        .returning({ id: usageLedger.id, source: usageLedger.source });
      rows.push(...created.map((item) => ({ id: item.id, source: "plan" as const })));
    }

    if (policy.reserveFromCredits > 0) {
      const created = await tx
        .insert(usageLedger)
        .values(
          Array.from({ length: policy.reserveFromCredits }).map(() => ({
            clerkUserId: input.clerkUserId,
            podcastId: input.podcastId,
            units: 1,
            source: "credit" as const,
            status: "reserved",
            reservationKey: input.reservationKey
          }))
        )
        .returning({ id: usageLedger.id, source: usageLedger.source });
      rows.push(...created.map((item) => ({ id: item.id, source: "credit" as const })));
    }

    return {
      allowedForJob: policy.allowedForJob,
      remainingAfterReservation: policy.remainingAfterReservation,
      reservedUnits: rows
    };
  });
}

export async function markUnitConsumed(usageLedgerId: string, episodeId: string) {
  await db
    .update(usageLedger)
    .set({
      episodeId,
      status: "consumed"
    })
    .where(and(eq(usageLedger.id, usageLedgerId), eq(usageLedger.status, "reserved")));
}

export async function releaseReservedUnit(usageLedgerId: string) {
  await db
    .update(usageLedger)
    .set({
      status: "released",
      releasedAt: new Date()
    })
    .where(and(eq(usageLedger.id, usageLedgerId), eq(usageLedger.status, "reserved")));
}

export async function releaseReservationByKey(reservationKey: string) {
  await db
    .update(usageLedger)
    .set({
      status: "released",
      releasedAt: new Date()
    })
    .where(and(eq(usageLedger.reservationKey, reservationKey), eq(usageLedger.status, "reserved")));
}
