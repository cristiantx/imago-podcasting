"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  latestJob: PodcastSummary["latestJob"];
  stageCounts: PodcastSummary["stageCounts"];
  episodes: EpisodeItem[];
};

export function StatusBoard() {
  const [podcasts, setPodcasts] = useState<PodcastSummary[]>([]);
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const [episodesData, setEpisodesData] = useState<EpisodesPayload | null>(null);
  const [requestedEpisodes, setRequestedEpisodes] = useState(5);
  const [loadingPodcasts, setLoadingPodcasts] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [runningAction, setRunningAction] = useState<"resync" | "retry" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshPodcasts();
  }, []);

  useEffect(() => {
    if (!selectedPodcastId) {
      setEpisodesData(null);
      return;
    }

    void refreshEpisodes(selectedPodcastId);
  }, [selectedPodcastId]);

  const selectedPodcast = useMemo(
    () => podcasts.find((podcast) => podcast.id === selectedPodcastId) ?? null,
    [podcasts, selectedPodcastId]
  );

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
      setSelectedPodcastId((current) => {
        if (rows.length === 0) {
          return null;
        }

        if (current && rows.some((podcast) => podcast.id === current)) {
          return current;
        }

        return rows[0].id;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load podcasts");
    } finally {
      setLoadingPodcasts(false);
    }
  }

  async function refreshEpisodes(podcastId: string) {
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
    if (!selectedPodcastId) {
      return;
    }

    setRunningAction("resync");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/podcasts/${selectedPodcastId}/resync`, {
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

      await refreshPodcasts();
      await refreshEpisodes(selectedPodcastId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start resync");
    } finally {
      setRunningAction(null);
    }
  }

  async function runRetryDispatch() {
    if (!selectedPodcastId) {
      return;
    }

    setRunningAction("retry");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/podcasts/${selectedPodcastId}/retry-queue`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; message?: string; queueDispatchStatus?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to retry queue dispatch");
      }

      setMessage(payload.message ?? "Queue dispatch retried.");
      await refreshPodcasts();
      await refreshEpisodes(selectedPodcastId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to retry queue dispatch");
    } finally {
      setRunningAction(null);
    }
  }

  async function runDeletePodcast() {
    if (!selectedPodcastId || runningAction !== null) {
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
      const response = await fetch(`/api/podcasts/${selectedPodcastId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete podcast");
      }

      setMessage(payload.message ?? "Podcast deleted.");
      await refreshPodcasts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete podcast");
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_330px]">
      <div className="space-y-4">
        <Card className="overflow-hidden border-transparent bg-gradient-to-r from-[#6f63f4] via-[#6b60ea] to-[#7f75ff] text-white">
          <CardContent className="relative p-6 md:p-7">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute bottom-0 right-16 h-20 w-20 rounded-full bg-white/10 blur-xl" />
            <p className="text-xs uppercase tracking-[0.18em] text-white/80">Podcast Archive</p>
            <h2 className="mt-2 max-w-xl text-3xl font-semibold md:text-4xl">Explore every episode, quote, and story without scrubbing audio.</h2>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Browse podcasts, track transcription state, retry failed queue dispatches, and export transcripts directly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Your Podcasts</CardTitle>
            <CardDescription>Select a podcast to inspect episodes and transcript availability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingPodcasts ? <p className="text-sm text-muted-foreground">Loading podcasts...</p> : null}
            {!loadingPodcasts && podcasts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No podcasts yet. Add your RSS feed from the Add Feed page.
              </div>
            ) : null}

            {podcasts.map((podcast) => {
              const active = selectedPodcastId === podcast.id;
              return (
                <button
                  key={podcast.id}
                  type="button"
                  onClick={() => setSelectedPodcastId(podcast.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-primary/50 bg-primary/5 shadow-[0_10px_30px_rgba(111,99,244,0.2)]"
                      : "border-border/80 bg-white hover:border-primary/35"
                  }`}
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
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Episode Library</CardTitle>
            <CardDescription>
              {selectedPodcast ? `Episodes from ${selectedPodcast.title ?? "selected podcast"}` : "Choose a podcast to view episodes."}
            </CardDescription>
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
                      {episode.isTranscribed ? (
                        <Button asChild size="sm">
                          <a href={`/api/podcasts/${episodesData.podcast.id}/episodes/${episode.id}/transcript/download`}>
                            Download Transcript
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
            <CardDescription>Manage ingestion and transcript exports for the selected podcast.</CardDescription>
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

            <Button className="w-full" onClick={runResync} disabled={!selectedPodcastId || runningAction !== null}>
              {runningAction === "resync" ? "Starting Resync..." : "Resync Feed"}
            </Button>

            <Button variant="outline" className="w-full" onClick={runRetryDispatch} disabled={!selectedPodcastId || runningAction !== null}>
              {runningAction === "retry" ? "Retrying..." : "Retry Queue Dispatch"}
            </Button>

            <Button variant="destructive" className="w-full" onClick={runDeletePodcast} disabled={!selectedPodcastId || runningAction !== null}>
              {runningAction === "delete" ? "Deleting Podcast..." : "Delete Podcast"}
            </Button>

            <Button variant="secondary" asChild className="w-full">
              <a
                href={selectedPodcastId ? `/api/podcasts/${selectedPodcastId}/transcripts/download` : "#"}
                onClick={(event) => {
                  if (!selectedPodcastId) {
                    event.preventDefault();
                  }
                }}
              >
                Download Full Podcast Transcript
              </a>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <a href="/onboarding">Add or Change RSS Feed</a>
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
