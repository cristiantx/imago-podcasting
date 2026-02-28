"use client";

import { FormEvent, useState } from "react";

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
    <form className="stack" onSubmit={onSubmit}>
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Clerk User ID</div>
        <input value={clerkUserId} onChange={(event) => setClerkUserId(event.target.value)} required />
      </label>
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Plan Code</div>
        <input value={planCode} onChange={(event) => setPlanCode(event.target.value)} required />
      </label>
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Credit Delta</div>
        <input type="number" value={creditDelta} onChange={(event) => setCreditDelta(Number(event.target.value))} required />
      </label>
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Admin API Key</div>
        <input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} required />
      </label>
      <button className="secondary" type="submit">Apply</button>
      {message ? <p className="status-ok">{message}</p> : null}
      {error ? <p className="status-error">{error}</p> : null}
    </form>
  );
}
