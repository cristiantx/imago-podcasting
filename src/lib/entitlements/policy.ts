export type ReservationInputs = {
  requestedEpisodes?: number;
  feedEpisodeCount: number;
  planQuota: number;
  planUsed: number;
  extraCredits: number;
  creditUsed: number;
  operationalCap: number;
};

export type ReservationPolicy = {
  availablePlan: number;
  availableCredits: number;
  availableTotal: number;
  requested: number;
  allowedForJob: number;
  reserveFromPlan: number;
  reserveFromCredits: number;
  remainingAfterReservation: number;
};

export function computeReservationPolicy(input: ReservationInputs): ReservationPolicy {
  const availablePlan = Math.max(input.planQuota - input.planUsed, 0);
  const availableCredits = Math.max(input.extraCredits - input.creditUsed, 0);
  const availableTotal = availablePlan + availableCredits;
  const requested = input.requestedEpisodes ?? availableTotal;

  const rawAllowed = Math.min(requested, availableTotal, input.feedEpisodeCount, Math.max(input.operationalCap, 1));
  const allowedForJob = Math.max(rawAllowed, 0);

  const reserveFromPlan = Math.min(allowedForJob, availablePlan);
  const reserveFromCredits = Math.max(allowedForJob - reserveFromPlan, 0);
  const remainingAfterReservation = Math.max(availableTotal - allowedForJob, 0);

  return {
    availablePlan,
    availableCredits,
    availableTotal,
    requested,
    allowedForJob,
    reserveFromPlan,
    reserveFromCredits,
    remainingAfterReservation
  };
}
