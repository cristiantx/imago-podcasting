"use client";

import { FormEvent, useState } from "react";

type StatusPayload = {
  podcast: {
    id: string;
    title: string | null;
    feedUrl: string;
    status: string;
    lastSyncedAt: string | null;
  };
  latestJob: {
    id: string;
    status: string;
    totalItems: number;
    processedItems: number;
    failedItems: number;
    errorSummary: string | null;
  } | null;
  stageCounts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
};

export function StatusBoard() {
  const [podcastId, setPodcastId] = useState("");
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/podcasts/${podcastId}/status`);
      const payload = (await res.json()) as StatusPayload | { error: string };

      if (!res.ok) {
        throw new Error("error" in payload ? payload.error : "Failed to load status.");
      }

      setData(payload as StatusPayload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel" style={{ padding: 20 }}>
      <form className="stack" onSubmit={fetchStatus}>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Podcast ID</div>
          <input value={podcastId} onChange={(event) => setPodcastId(event.target.value)} placeholder="UUID" required />
        </label>
        <button type="submit" className="secondary" disabled={loading}>
          {loading ? "Loading..." : "Load Status"}
        </button>
      </form>

      {error ? <p className="status-error">{error}</p> : null}

      {data ? (
        <div className="stack" style={{ marginTop: 16 }}>
          <article className="result-card">
            <h3 className="heading" style={{ marginTop: 0 }}>{data.podcast.title ?? "Untitled Podcast"}</h3>
            <p className="muted" style={{ marginBottom: 4 }}>{data.podcast.feedUrl}</p>
            <div>Status: <strong>{data.podcast.status}</strong></div>
            <div>Last sync: <strong>{data.podcast.lastSyncedAt ?? "never"}</strong></div>
          </article>
          <div className="kpi-grid">
            <div className="kpi"><div className="muted">Queued</div><strong>{data.stageCounts.queued}</strong></div>
            <div className="kpi"><div className="muted">Processing</div><strong>{data.stageCounts.processing}</strong></div>
            <div className="kpi"><div className="muted">Completed</div><strong>{data.stageCounts.completed}</strong></div>
            <div className="kpi"><div className="muted">Failed</div><strong>{data.stageCounts.failed}</strong></div>
          </div>
          {data.latestJob ? (
            <article className="result-card">
              <div>Latest Job: <strong>{data.latestJob.id.slice(0, 8)}</strong></div>
              <div>Status: <strong>{data.latestJob.status}</strong></div>
              <div>Processed: <strong>{data.latestJob.processedItems}/{data.latestJob.totalItems}</strong></div>
              <div>Failed: <strong>{data.latestJob.failedItems}</strong></div>
              {data.latestJob.errorSummary ? <p className="status-error">{data.latestJob.errorSummary}</p> : null}
            </article>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
