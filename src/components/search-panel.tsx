"use client";

import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <Card>
      <CardContent className="space-y-5 p-6">
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="search-podcast-id">Podcast ID</Label>
            <Input id="search-podcast-id" value={podcastId} onChange={(event) => setPodcastId(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Query</Label>
            <Textarea
              id="search-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              required
              rows={3}
              placeholder="pricing psychology stories"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Run Semantic Search"}
          </Button>
        </form>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

        <div className="space-y-3">
          {results.length === 0 ? <p className="text-sm text-muted-foreground">No results yet. Run a query.</p> : null}
          {results.map((result) => (
            <Card key={`${result.episodeId}-${result.startSec}`} className="border-border/70">
              <CardContent className="space-y-2 p-4">
                <h3 className="text-xl font-semibold">{result.episodeTitle}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="accent">
                    {formatTime(result.startSec)} - {formatTime(result.endSec)}
                  </Badge>
                  {result.speaker ? <Badge variant="secondary">{result.speaker}</Badge> : null}
                  <span className="text-muted-foreground">score {result.score.toFixed(3)}</span>
                </div>
                <p className="text-sm text-foreground/90">{result.snippet}</p>
                <a className="text-sm font-medium text-primary hover:underline" href={result.episodeUrl} target="_blank" rel="noreferrer">
                  Open episode
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
