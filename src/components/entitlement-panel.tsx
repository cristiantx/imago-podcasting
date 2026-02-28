"use client";

import { useEffect, useState } from "react";

type EntitlementSnapshot = {
  planCode: string;
  planQuota: number;
  extraCredits: number;
  consumedUnits: number;
  remainingUnits: number;
};

export function EntitlementPanel() {
  const [data, setData] = useState<EntitlementSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/account/entitlements")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unable to load entitlements.");
        }
        return (await res.json()) as EntitlementSnapshot;
      })
      .then(setData)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      });
  }, []);

  return (
    <aside className="panel" style={{ padding: 20 }}>
      <h3 className="heading" style={{ marginTop: 0, fontSize: "1.4rem" }}>
        Your Allowance
      </h3>
      {error ? <p className="status-error">{error}</p> : null}
      {data ? (
        <div className="kpi-grid">
          <div className="kpi">
            <div className="muted">Plan</div>
            <strong>{data.planCode}</strong>
          </div>
          <div className="kpi">
            <div className="muted">Plan Quota</div>
            <strong>{data.planQuota}</strong>
          </div>
          <div className="kpi">
            <div className="muted">Extra Credits</div>
            <strong>{data.extraCredits}</strong>
          </div>
          <div className="kpi">
            <div className="muted">Consumed</div>
            <strong>{data.consumedUnits}</strong>
          </div>
          <div className="kpi">
            <div className="muted">Remaining</div>
            <strong>{data.remainingUnits}</strong>
          </div>
        </div>
      ) : (
        <p className="muted">Loading entitlement snapshot...</p>
      )}
    </aside>
  );
}
