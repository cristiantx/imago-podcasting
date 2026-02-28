"use client";

import { FormEvent, useState } from "react";

type SearchResult = {
  episodeId: string;
  episodeTitle: string;
  episodeUrl: string;
  publishedAt: string | null;
  startSec: number;
  endSec: number;
  speaker: string | null;
  snippet: string;
  score: number;
};

export function SearchPanel() {
  const [podcastId, setPodcastId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ podcastId, query, topK: 20 })
      });

      const payload = (await res.json()) as { results?: SearchResult[]; error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Search failed.");
      }

      setResults(payload.results ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel" style={{ padding: 20 }}>
      <form className="stack" onSubmit={onSubmit}>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Podcast ID</div>
          <input value={podcastId} onChange={(event) => setPodcastId(event.target.value)} required />
        </label>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Search Query</div>
          <textarea value={query} onChange={(event) => setQuery(event.target.value)} required rows={3} placeholder="pricing psychology stories" />
        </label>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Searching..." : "Run Semantic Search"}
        </button>
      </form>

      {error ? <p className="status-error">{error}</p> : null}

      <div className="stack" style={{ marginTop: 16 }}>
        {results.length === 0 ? <p className="muted">No results yet. Run a query.</p> : null}
        {results.map((result) => (
          <article className="result-card" key={`${result.episodeId}-${result.startSec}`}>
            <h3 className="heading" style={{ marginTop: 0, marginBottom: 6 }}>{result.episodeTitle}</h3>
            <div>
              <span className="timestamp-chip">{formatTime(result.startSec)} - {formatTime(result.endSec)}</span>
              {result.speaker ? <span className="speaker-chip">{result.speaker}</span> : null}
              <span className="muted">score {result.score.toFixed(3)}</span>
            </div>
            <p>{result.snippet}</p>
            <a href={result.episodeUrl} target="_blank" rel="noreferrer">Open episode</a>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
