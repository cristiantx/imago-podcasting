"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EntitlementPanel } from "@/components/entitlement-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PodcastSummary = {
  id: string;
  title: string | null;
  description: string | null;
  feedUrl: string;
  imageUrl: string | null;
  language: string;
  status: string;
  lastSyncedAt: string | null;
  episodeCount: number;
  stageCounts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  latestJob: {
    id: string;
    status: string;
    totalItems: number;
    processedItems: number;
    failedItems: number;
    queueDispatchStatus: string;
    queueDispatchAttempts: number;
    queueDispatchError: string | null;
  } | null;
};

type PodcastsPayload = {
  podcasts: PodcastSummary[];
};

export function StatusBoard() {
  const [podcasts, setPodcasts] = useState<PodcastSummary[]>([]);
  const [loadingPodcasts, setLoadingPodcasts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshPodcasts();
  }, []);

  const totals = useMemo(() => {
    return podcasts.reduce(
      (acc, podcast) => {
        acc.episodes += podcast.episodeCount;
        acc.queued += podcast.stageCounts.queued;
        acc.processing += podcast.stageCounts.processing;
        acc.completed += podcast.stageCounts.completed;
        acc.failed += podcast.stageCounts.failed;
        return acc;
      },
      {
        episodes: 0,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }
    );
  }, [podcasts]);

  async function refreshPodcasts() {
    setLoadingPodcasts(true);
    setError(null);

    try {
      const response = await fetch("/api/podcasts");
      const payload = (await response.json()) as PodcastsPayload | { error: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Failed to load podcasts.");
      }

      const rows = (payload as PodcastsPayload).podcasts;
      setPodcasts(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load podcasts");
    } finally {
      setLoadingPodcasts(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_330px]">
      <div className="space-y-4">
        <Card className="overflow-hidden border-transparent bg-gradient-to-r from-[#6f63f4] via-[#6b60ea] to-[#7f75ff] text-white">
          <CardContent className="p-6 md:p-7">
            <p className="text-xs uppercase tracking-[0.18em] text-white/80">Podcast Archive</p>
            <h2 className="mt-2 max-w-xl text-3xl font-semibold md:text-4xl">Your podcasts at a glance.</h2>
            <p className="mt-2 max-w-lg text-sm text-white/85">Open a podcast to see episodes, transcript state, and ingestion actions.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Your Podcasts</CardTitle>
            <CardDescription>Dashboard shows podcasts only. Episodes are available inside each podcast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingPodcasts ? <p className="text-sm text-muted-foreground">Loading podcasts...</p> : null}
            {!loadingPodcasts && podcasts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No podcasts yet. Add your RSS feed from the Add Feed page.
              </div>
            ) : null}

            {podcasts.map((podcast) => {
              return (
                <Link
                  key={podcast.id}
                  href={`/podcasts/${podcast.id}`}
                  className="block w-full rounded-2xl border border-border/80 bg-white p-4 text-left transition hover:border-primary/35"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{podcast.title ?? "Untitled Podcast"}</h3>
                    <Badge variant={podcast.status.includes("failed") ? "outline" : "secondary"}>{podcast.status}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{podcast.feedUrl}</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <StatMini label="Episodes" value={podcast.episodeCount} />
                    <StatMini label="Done" value={podcast.stageCounts.completed} />
                    <StatMini label="Queued" value={podcast.stageCounts.queued} />
                    <StatMini label="Failed" value={podcast.stageCounts.failed} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last sync: {formatDate(podcast.lastSyncedAt)}. Click to open podcast details.
                  </p>
                </Link>
              );
            })}

            {!loadingPodcasts && podcasts.length > 0 ? (
              <Button variant="outline" asChild>
                <Link href="/onboarding">Add Another Feed</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <EntitlementPanel />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Episode Processing</CardTitle>
            <CardDescription>Global processing across all podcasts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ProgressItem label="Total Episodes" value={totals.episodes} />
            <ProgressItem label="Queued" value={totals.queued} />
            <ProgressItem label="Processing" value={totals.processing} />
            <ProgressItem label="Completed" value={totals.completed} />
            <ProgressItem label="Failed" value={totals.failed} />
          </CardContent>
        </Card>

        {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
      </div>
    </section>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 px-2 py-1">
      <p>{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProgressItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/25 px-3 py-2">
      <p>{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleDateString();
}
