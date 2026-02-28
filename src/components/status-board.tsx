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
    queueDispatchStatus?: string;
    queueDispatchAttempts?: number;
    queueDispatchError?: string | null;
  } | null;
  stageCounts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
};

type RetryPayload = {
  message: string;
  queueDispatchStatus: string;
  queueDispatchError: string | null;
  queuedEpisodes: number;
};

export function StatusBoard() {
  const [podcastId, setPodcastId] = useState("");
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

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

  async function retryQueueDispatch() {
    if (!podcastId) {
      return;
    }

    setRetrying(true);
    setRetryMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/podcasts/${podcastId}/retry-queue`, {
        method: "POST"
      });
      const payload = (await res.json()) as RetryPayload | { error: string };

      if (!res.ok) {
        throw new Error("error" in payload ? payload.error : "Retry failed");
      }

      const retry = payload as RetryPayload;
      setRetryMessage(
        retry.queueDispatchStatus === "sent"
          ? `Queue retry succeeded for ${retry.queuedEpisodes} queued episode(s).`
          : retry.message
      );

      const statusRes = await fetch(`/api/podcasts/${podcastId}/status`);
      if (statusRes.ok) {
        const statusPayload = (await statusRes.json()) as StatusPayload;
        setData(statusPayload);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  const canRetryDispatch =
    data?.latestJob &&
    (data.latestJob.queueDispatchStatus === "failed" || data.latestJob.queueDispatchStatus === "pending") &&
    data.stageCounts.processing === 0;

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <form className="space-y-3" onSubmit={fetchStatus}>
          <div className="space-y-2">
            <Label htmlFor="status-podcast-id">Podcast ID</Label>
            <Input id="status-podcast-id" value={podcastId} onChange={(event) => setPodcastId(event.target.value)} placeholder="UUID" required />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" disabled={loading}>
              {loading ? "Loading..." : "Load Status"}
            </Button>
            <Button type="button" variant="outline" disabled={!canRetryDispatch || retrying} onClick={retryQueueDispatch}>
              {retrying ? "Retrying..." : "Retry Queue Dispatch"}
            </Button>
            <Button asChild type="button" variant="outline">
              <a
                href={data?.podcast?.id ? `/api/podcasts/${data.podcast.id}/transcripts/download` : "#"}
                onClick={(event) => {
                  if (!data?.podcast?.id) {
                    event.preventDefault();
                  }
                }}
              >
                Download Transcripts (.txt)
              </a>
            </Button>
          </div>
        </form>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        {retryMessage ? <p className="text-sm font-medium text-emerald-700">{retryMessage}</p> : null}

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
                  <p>
                    Queue Dispatch: <span className="font-semibold">{data.latestJob.queueDispatchStatus ?? "unknown"}</span>
                    {typeof data.latestJob.queueDispatchAttempts === "number"
                      ? ` (attempts ${data.latestJob.queueDispatchAttempts})`
                      : ""}
                  </p>
                  {data.latestJob.queueDispatchError ? (
                    <p className="font-medium text-destructive">Dispatch error: {data.latestJob.queueDispatchError}</p>
                  ) : null}
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
