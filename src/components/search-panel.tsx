"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PodcastOption = {
  id: string;
  title: string | null;
  episodeCount: number;
};

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
  const [podcasts, setPodcasts] = useState<PodcastOption[]>([]);
  const [selectedPodcastId, setSelectedPodcastId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPodcasts, setLoadingPodcasts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPodcasts();
  }, []);

  const selectedPodcast = useMemo(
    () => podcasts.find((podcast) => podcast.id === selectedPodcastId) ?? null,
    [podcasts, selectedPodcastId]
  );

  async function fetchPodcasts() {
    setLoadingPodcasts(true);

    try {
      const res = await fetch("/api/podcasts");
      const payload = (await res.json()) as { podcasts?: PodcastOption[]; error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to load podcasts");
      }

      const rows = payload.podcasts ?? [];
      setPodcasts(rows);
      if (rows.length > 0) {
        setSelectedPodcastId(rows[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load podcasts");
    } finally {
      setLoadingPodcasts(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPodcastId) {
      setError("Select a podcast before searching.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ podcastId: selectedPodcastId, query, topK: 20 })
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
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_330px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Semantic Search</CardTitle>
          <CardDescription>Ask naturally and jump directly to precise moments in your episodes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="podcast-select">Podcast</Label>
              <select
                id="podcast-select"
                className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-sm"
                value={selectedPodcastId}
                onChange={(event) => setSelectedPodcastId(event.target.value)}
                disabled={loadingPodcasts || podcasts.length === 0}
              >
                {podcasts.length === 0 ? <option value="">No podcasts available</option> : null}
                {podcasts.map((podcast) => (
                  <option key={podcast.id} value={podcast.id}>
                    {(podcast.title ?? "Untitled Podcast") + ` (${podcast.episodeCount} episodes)`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-query">What are you looking for?</Label>
              <Textarea
                id="search-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                required
                rows={3}
                placeholder="Example: moments where we discuss pricing psychology and buyer hesitation"
              />
            </div>

            <Button type="submit" disabled={loading || loadingPodcasts || !selectedPodcastId}>
              {loading ? "Searching..." : "Search Transcript"}
            </Button>
          </form>

          {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

          <div className="space-y-3">
            {results.length === 0 ? <p className="text-sm text-muted-foreground">Run a query to view matched transcript moments.</p> : null}
            {results.map((result) => (
              <Card key={`${result.episodeId}-${result.startSec}`} className="border-border/70">
                <CardContent className="space-y-2 p-4">
                  <h3 className="text-lg font-semibold">{result.episodeTitle}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="accent">
                      {formatTime(result.startSec)} - {formatTime(result.endSec)}
                    </Badge>
                    {result.speaker ? <Badge variant="secondary">{result.speaker}</Badge> : null}
                    <span className="text-muted-foreground">Relevance {result.score.toFixed(3)}</span>
                  </div>
                  <p className="text-sm text-foreground/90">{result.snippet}</p>
                  <a className="text-sm font-medium text-primary hover:underline" href={result.episodeUrl} target="_blank" rel="noreferrer">
                    Open episode at timestamp
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="overflow-hidden border-transparent bg-gradient-to-br from-[#7d70fb] to-[#6a5bf0] text-white">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/75">Current Scope</p>
            <h3 className="mt-2 text-2xl font-semibold">{selectedPodcast?.title ?? "Choose a podcast"}</h3>
            <p className="mt-1 text-sm text-white/85">{selectedPodcast ? `${selectedPodcast.episodeCount} imported episodes available` : "Select a podcast to start querying."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Prompt Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Use intent-based language, not exact quotes.</p>
            <p>Include context like guest topic, story type, or decision stage.</p>
            <p>Search multiple angles in separate queries to uncover hidden clips.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
