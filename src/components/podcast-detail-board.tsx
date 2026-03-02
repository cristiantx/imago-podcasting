"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EpisodeItem = {
  id: string;
  title: string;
  publishedAt: string | null;
  status: string;
  durationSec: number | null;
  episodeUrl: string | null;
  audioUrl: string;
  errorMessage: string | null;
  isTranscribed: boolean;
  segmentCount: number;
};

type EpisodesPayload = {
  podcast: {
    id: string;
    title: string | null;
    status: string;
    feedUrl: string;
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
  stageCounts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  episodes: EpisodeItem[];
};

export function PodcastDetailBoard({ podcastId }: { podcastId: string }) {
  const router = useRouter();
  const [episodesData, setEpisodesData] = useState<EpisodesPayload | null>(null);
  const [requestedEpisodes, setRequestedEpisodes] = useState(5);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [runningAction, setRunningAction] = useState<"resync" | "retry" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshEpisodes();
  }, [podcastId]);

  async function refreshEpisodes() {
    setLoadingEpisodes(true);
    setError(null);

    try {
      const response = await fetch(`/api/podcasts/${podcastId}/episodes`);
      const payload = (await response.json()) as EpisodesPayload | { error: string };
      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Failed to load episodes.");
      }
      setEpisodesData(payload as EpisodesPayload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load episodes");
    } finally {
      setLoadingEpisodes(false);
    }
  }

  async function runResync() {
    setRunningAction("resync");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/podcasts/${podcastId}/resync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedEpisodes })
      });

      const payload = (await response.json()) as { error?: string; queueDispatchStatus?: string; queueDispatchError?: string | null };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to start resync");
      }

      if (payload.queueDispatchStatus === "failed") {
        setMessage(`Resync created, but queue dispatch failed: ${payload.queueDispatchError ?? "unknown error"}`);
      } else {
        setMessage("Resync started successfully.");
      }

      await refreshEpisodes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start resync");
    } finally {
      setRunningAction(null);
    }
  }

  async function runRetryDispatch() {
    setRunningAction("retry");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/podcasts/${podcastId}/retry-queue`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to retry queue dispatch");
      }

      setMessage(payload.message ?? "Queue dispatch retried.");
      await refreshEpisodes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to retry queue dispatch");
    } finally {
      setRunningAction(null);
    }
  }

  async function runDeletePodcast() {
    if (runningAction !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this podcast and all related episodes, transcripts, jobs, and search logs? Usage history will be kept."
    );

    if (!confirmed) {
      return;
    }

    setRunningAction("delete");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/podcasts/${podcastId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete podcast");
      }

      setMessage(payload.message ?? "Podcast deleted.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete podcast");
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_330px]">
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Podcast Details</p>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
                {episodesData?.podcast.title ?? (loadingEpisodes ? "Loading podcast..." : "Podcast")}
              </h1>
              {episodesData?.podcast.feedUrl ? <p className="mt-1 text-sm text-muted-foreground">{episodesData.podcast.feedUrl}</p> : null}
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Episode Library</CardTitle>
            <CardDescription>Episodes are shown only inside the podcast view.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEpisodes ? <p className="text-sm text-muted-foreground">Loading episodes...</p> : null}

            {!loadingEpisodes && episodesData && episodesData.episodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No episodes have been imported for this podcast yet.</p>
            ) : null}

            {!loadingEpisodes && episodesData?.episodes.length ? (
              <div className="space-y-2">
                {episodesData.episodes.map((episode) => (
                  <div key={episode.id} className="grid gap-3 rounded-2xl border border-border/80 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold md:text-base">{episode.title}</h4>
                        <Badge variant={episode.isTranscribed ? "secondary" : "outline"}>
                          {episode.isTranscribed ? "Transcribed" : "Pending transcription"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {episode.publishedAt ? new Date(episode.publishedAt).toLocaleDateString() : "Unknown publish date"}
                        {episode.durationSec ? ` • ${Math.round(episode.durationSec / 60)} min` : ""}
                        {episode.segmentCount > 0 ? ` • ${episode.segmentCount} transcript chunks` : ""}
                      </p>
                      {episode.errorMessage ? <p className="mt-1 text-xs text-destructive">{episode.errorMessage}</p> : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {episode.episodeUrl ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={episode.episodeUrl} target="_blank" rel="noreferrer">
                            Open Episode
                          </a>
                        </Button>
                      ) : null}
                      {episode.isTranscribed && episodesData?.podcast.id ? (
                        <Button asChild size="sm">
                          <a href={`/api/podcasts/${episodesData.podcast.id}/episodes/${episode.id}/transcript/download`}>
                            Download WebVTT
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Actions</CardTitle>
            <CardDescription>Manage ingestion and transcript exports for this podcast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resync Episode Count</p>
              <Input
                type="number"
                min={1}
                value={requestedEpisodes}
                onChange={(event) => setRequestedEpisodes(Number(event.target.value))}
              />
            </div>

            <Button className="w-full" onClick={runResync} disabled={runningAction !== null}>
              {runningAction === "resync" ? "Starting Resync..." : "Resync Feed"}
            </Button>

            <Button variant="outline" className="w-full" onClick={runRetryDispatch} disabled={runningAction !== null}>
              {runningAction === "retry" ? "Retrying..." : "Retry Queue Dispatch"}
            </Button>

            <Button variant="destructive" className="w-full" onClick={runDeletePodcast} disabled={runningAction !== null}>
              {runningAction === "delete" ? "Deleting Podcast..." : "Delete Podcast"}
            </Button>

            <Button variant="secondary" asChild className="w-full">
              <a href={`/api/podcasts/${podcastId}/transcripts/download`}>Download Full Podcast Transcript</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Current Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ProgressItem label="Queued" value={episodesData?.stageCounts.queued ?? 0} />
            <ProgressItem label="Processing" value={episodesData?.stageCounts.processing ?? 0} />
            <ProgressItem label="Completed" value={episodesData?.stageCounts.completed ?? 0} />
            <ProgressItem label="Failed" value={episodesData?.stageCounts.failed ?? 0} />
            {episodesData?.latestJob?.queueDispatchError ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                Queue dispatch error: {episodesData.latestJob.queueDispatchError}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
      </div>
    </section>
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
