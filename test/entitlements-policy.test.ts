import { describe, expect, it } from "vitest";

import { computeReservationPolicy } from "@/lib/entitlements/policy";

describe("computeReservationPolicy", () => {
  it("supports free user default allowance of 5", () => {
    const policy = computeReservationPolicy({
      requestedEpisodes: 10,
      feedEpisodeCount: 20,
      planQuota: 5,
      planUsed: 0,
      extraCredits: 0,
      creditUsed: 0,
      operationalCap: 500
    });

    expect(policy.allowedForJob).toBe(5);
    expect(policy.reserveFromPlan).toBe(5);
    expect(policy.reserveFromCredits).toBe(0);
  });

  it("consumes plan quota first and then credits", () => {
    const policy = computeReservationPolicy({
      requestedEpisodes: 9,
      feedEpisodeCount: 40,
      planQuota: 5,
      planUsed: 3,
      extraCredits: 10,
      creditUsed: 6,
      operationalCap: 500
    });

    expect(policy.reserveFromPlan).toBe(2);
    expect(policy.reserveFromCredits).toBe(3);
    expect(policy.allowedForJob).toBe(5);
  });

  it("clamps request when it exceeds remaining allowance", () => {
    const policy = computeReservationPolicy({
      requestedEpisodes: 50,
      feedEpisodeCount: 50,
      planQuota: 10,
      planUsed: 8,
      extraCredits: 4,
      creditUsed: 2,
      operationalCap: 500
    });

    expect(policy.allowedForJob).toBe(4);
    expect(policy.remainingAfterReservation).toBe(0);
  });

  it("uses remaining allowance when requested episodes are omitted", () => {
    const policy = computeReservationPolicy({
      feedEpisodeCount: 20,
      planQuota: 10,
      planUsed: 6,
      extraCredits: 4,
      creditUsed: 1,
      operationalCap: 500
    });

    expect(policy.requested).toBe(7);
    expect(policy.allowedForJob).toBe(7);
  });

  it("honors operational safety cap", () => {
    const policy = computeReservationPolicy({
      requestedEpisodes: 100,
      feedEpisodeCount: 100,
      planQuota: 300,
      planUsed: 0,
      extraCredits: 300,
      creditUsed: 0,
      operationalCap: 42
    });

    expect(policy.allowedForJob).toBe(42);
  });
});
