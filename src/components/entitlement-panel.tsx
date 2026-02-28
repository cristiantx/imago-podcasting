"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Allowance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        {data ? (
          <div className="grid grid-cols-2 gap-2">
            <Stat title="Plan" value={data.planCode.toUpperCase()} />
            <Stat title="Plan Quota" value={String(data.planQuota)} />
            <Stat title="Extra Credits" value={String(data.extraCredits)} />
            <Stat title="Consumed" value={String(data.consumedUnits)} />
            <div className="col-span-2 rounded-2xl border border-border/80 bg-secondary/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-2xl font-semibold">{data.remainingUnits}</p>
                <Badge variant="accent">Episodes</Badge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading entitlement snapshot...</p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
