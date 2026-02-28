"use client";

import { FormEvent, useState } from "react";

type ImportResponse = {
  podcastId: string;
  jobId: string;
  allowedEpisodes: number;
  remainingAfterReservation: number;
};

export function RssImportForm() {
  const [rssUrl, setRssUrl] = useState("");
  const [requestedEpisodes, setRequestedEpisodes] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/podcasts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl, requestedEpisodes })
      });

      const payload = (await res.json()) as ImportResponse | { error: string };
      if (!res.ok) {
        throw new Error("error" in payload ? payload.error : "Import failed");
      }

      setResult(payload as ImportResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import RSS feed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>RSS Feed URL</div>
        <input value={rssUrl} onChange={(event) => setRssUrl(event.target.value)} placeholder="https://example.com/feed.xml" required />
      </label>

      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Requested Episodes</div>
        <input
          type="number"
          min={1}
          value={requestedEpisodes}
          onChange={(event) => setRequestedEpisodes(Number(event.target.value))}
          required
        />
      </label>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? "Starting import..." : "Import Feed"}
        </button>
      </div>

      {error ? <p className="status-error">{error}</p> : null}

      {result ? (
        <article className="panel" style={{ padding: 14 }}>
          <strong>Import queued.</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Job {result.jobId.slice(0, 8)} started for podcast {result.podcastId.slice(0, 8)}. Allowed episodes: {result.allowedEpisodes}. Remaining after reservation: {result.remainingAfterReservation}.
          </p>
        </article>
      ) : null}
    </form>
  );
}
