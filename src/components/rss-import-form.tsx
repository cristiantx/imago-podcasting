"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ImportResponse = {
  podcastId: string;
  jobId: string;
  allowedEpisodes: number;
  remainingAfterReservation: number;
  queueDispatchStatus: "not_required" | "sent" | "failed";
  queueDispatchError: string | null;
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
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="rss-url">RSS Feed URL</Label>
        <Input id="rss-url" value={rssUrl} onChange={(event) => setRssUrl(event.target.value)} placeholder="https://example.com/feed.xml" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requested-episodes">Requested Episodes</Label>
        <Input
          id="requested-episodes"
          type="number"
          min={1}
          value={requestedEpisodes}
          onChange={(event) => setRequestedEpisodes(Number(event.target.value))}
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Starting import..." : "Import Feed"}
        </Button>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      {result ? (
        <Card className={result.queueDispatchStatus === "failed" ? "border-destructive/40 bg-destructive/5" : "border-primary/20 bg-primary/5"}>
          <CardContent className="space-y-1 p-4">
            <p className="text-sm font-semibold">Import queued.</p>
            <p className="text-sm text-muted-foreground">
              Job {result.jobId.slice(0, 8)} started for podcast {result.podcastId.slice(0, 8)}. Allowed episodes: {result.allowedEpisodes}. Remaining after reservation: {result.remainingAfterReservation}.
            </p>
            <p className="text-sm">
              Queue dispatch status: <span className="font-semibold">{result.queueDispatchStatus}</span>
            </p>
            {result.queueDispatchStatus === "failed" ? (
              <p className="text-sm font-medium text-destructive">
                Dispatch failed: {result.queueDispatchError ?? "unknown error"}. Use Dashboard → Retry Queue Dispatch.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
}
