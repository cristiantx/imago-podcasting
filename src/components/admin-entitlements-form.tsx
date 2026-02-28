"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminEntitlementsForm() {
  const [clerkUserId, setClerkUserId] = useState("");
  const [planCode, setPlanCode] = useState("free");
  const [creditDelta, setCreditDelta] = useState(0);
  const [adminKey, setAdminKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/entitlements/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey
        },
        body: JSON.stringify({ clerkUserId, planCode, creditDelta })
      });

      const payload = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to update entitlements.");
      }

      setMessage(payload.message ?? "Updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="clerk-user-id">Clerk User ID</Label>
        <Input id="clerk-user-id" value={clerkUserId} onChange={(event) => setClerkUserId(event.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-code">Plan Code</Label>
        <Input id="plan-code" value={planCode} onChange={(event) => setPlanCode(event.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="credit-delta">Credit Delta</Label>
        <Input id="credit-delta" type="number" value={creditDelta} onChange={(event) => setCreditDelta(Number(event.target.value))} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-api-key">Admin API Key</Label>
        <Input id="admin-api-key" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} required />
      </div>

      <Button type="submit" variant="secondary">Apply</Button>
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </form>
  );
}
