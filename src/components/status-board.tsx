"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card>
      <CardContent className="space-y-5 p-6">
        <form className="space-y-3" onSubmit={fetchStatus}>
          <div className="space-y-2">
            <Label htmlFor="status-podcast-id">Podcast ID</Label>
            <Input id="status-podcast-id" value={podcastId} onChange={(event) => setPodcastId(event.target.value)} placeholder="UUID" required />
          </div>
          <Button type="submit" variant="secondary" disabled={loading}>
            {loading ? "Loading..." : "Load Status"}
          </Button>
        </form>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

        {data ? (
          <div className="space-y-4">
            <Card className="border-border/70">
              <CardContent className="space-y-1 p-4">
                <h3 className="text-xl font-semibold">{data.podcast.title ?? "Untitled Podcast"}</h3>
                <p className="text-sm text-muted-foreground">{data.podcast.feedUrl}</p>
                <p className="text-sm">Status: <span className="font-semibold">{data.podcast.status}</span></p>
                <p className="text-sm">Last sync: <span className="font-semibold">{data.podcast.lastSyncedAt ?? "never"}</span></p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Kpi title="Queued" value={data.stageCounts.queued} />
              <Kpi title="Processing" value={data.stageCounts.processing} />
              <Kpi title="Completed" value={data.stageCounts.completed} />
              <Kpi title="Failed" value={data.stageCounts.failed} />
            </div>

            {data.latestJob ? (
              <Card className="border-border/70">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p>Latest Job: <span className="font-semibold">{data.latestJob.id.slice(0, 8)}</span></p>
                  <p>Status: <span className="font-semibold">{data.latestJob.status}</span></p>
                  <p>
                    Processed: <span className="font-semibold">{data.latestJob.processedItems}/{data.latestJob.totalItems}</span>
                  </p>
                  <p>Failed: <span className="font-semibold">{data.latestJob.failedItems}</span></p>
                  {data.latestJob.errorSummary ? <p className="font-medium text-destructive">{data.latestJob.errorSummary}</p> : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
