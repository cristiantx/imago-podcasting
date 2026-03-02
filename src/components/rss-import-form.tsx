"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type ExistingFeedError = {
  error: string;
  podcastId: string;
  podcastTitle: string | null;
};

type PreviewResponse = {
  feed: {
    rssUrl: string;
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    language: string;
    totalEpisodes: number;
  };
  usage: {
    planCode: string;
    planQuota: number;
    extraCredits: number;
    consumedUnits: number;
    remainingUnits: number;
  };
  importPolicy: {
    maxImportable: number;
    defaultRequestedEpisodes: number;
    upgradeSuggested: boolean;
  };
  episodes: Array<{
    guid: string;
    title: string;
    publishedAt: string | null;
    durationSec: number | null;
    episodeUrl: string;
    episodeImageUrl: string | null;
  }>;
};

const PREVIEW_LIST_LIMIT = 25;

export function RssImportForm() {
  const router = useRouter();
  const [rssUrl, setRssUrl] = useState("");
  const [requestedEpisodes, setRequestedEpisodes] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [existingFeed, setExistingFeed] = useState<ExistingFeedError | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const previewEpisodes = useMemo(() => {
    if (!preview) {
      return [];
    }

    return preview.episodes.slice(0, PREVIEW_LIST_LIMIT);
  }, [preview]);

  async function onLoadFeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreviewLoading(true);
    setPreviewError(null);
    setImportError(null);
    setExistingFeed(null);

    try {
      const res = await fetch("/api/podcasts/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl })
      });

      const payload = (await res.json()) as PreviewResponse | ExistingFeedError | { error: string };

      if (res.status === 409) {
        const existing = payload as ExistingFeedError;
        setPreview(null);
        setExistingFeed(existing);
        return;
      }

      if (!res.ok) {
        throw new Error("error" in payload ? payload.error : "Import failed");
      }

      const nextPreview = payload as PreviewResponse;
      setPreview(nextPreview);
      setRequestedEpisodes(nextPreview.importPolicy.defaultRequestedEpisodes);
    } catch (err: unknown) {
      setPreview(null);
      setPreviewError(err instanceof Error ? err.message : "Failed to load RSS feed.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function onImportFeed() {
    if (!preview) {
      return;
    }

    setImportLoading(true);
    setImportError(null);

    try {
      const res = await fetch("/api/podcasts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl: preview.feed.rssUrl, requestedEpisodes })
      });

      const payload = (await res.json()) as ImportResponse | ExistingFeedError | { error: string };

      if (res.status === 409) {
        const existing = payload as ExistingFeedError;
        setExistingFeed(existing);
        setPreview(null);
        return;
      }

      if (!res.ok) {
        throw new Error("error" in payload ? payload.error : "Import failed");
      }

      router.push(`/podcasts/${(payload as ImportResponse).podcastId}`);
      router.refresh();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Failed to import RSS feed.");
    } finally {
      setImportLoading(false);
    }
  }

  function onCancelPreview() {
    setPreview(null);
    setExistingFeed(null);
    setPreviewError(null);
    setImportError(null);
    setRequestedEpisodes(0);
  }

  function onRequestedEpisodesChange(nextValue: number) {
    if (!preview) {
      return;
    }

    const maxImportable = preview.importPolicy.maxImportable;
    if (maxImportable === 0) {
      setRequestedEpisodes(0);
      return;
    }

    const normalized = Math.max(1, Math.min(nextValue, maxImportable));
    setRequestedEpisodes(normalized);
  }

  return (
    <div className="space-y-6">
      <form className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]" onSubmit={onLoadFeed}>
        <div className="space-y-3">
          <Label htmlFor="rss-url" className="text-sm font-semibold text-slate-700">
            Podcast RSS Feed URL
          </Label>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              id="rss-url"
              value={rssUrl}
              onChange={(event) => setRssUrl(event.target.value)}
              placeholder="https://feeds.simplecast.com/your-podcast"
              className="h-12 rounded-full px-5"
              required
            />
            <Button type="submit" disabled={previewLoading} className="h-12 rounded-full px-7 text-base font-semibold">
              {previewLoading ? "Loading..." : "Load Feed"}
            </Button>
          </div>
        </div>
      </form>

      {previewError ? <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{previewError}</p> : null}

      {existingFeed ? (
        <div className="space-y-3 rounded-3xl border border-amber-300/60 bg-amber-50/70 p-5">
          <p className="text-sm font-medium text-amber-800">
            {existingFeed.podcastTitle ? `"${existingFeed.podcastTitle}" is already in your workspace.` : "This feed already exists in your workspace."}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/podcasts/${existingFeed.podcastId}`}>Open Existing Podcast</Link>
          </Button>
        </div>
      ) : null}

      {preview ? (
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <div className="space-y-4 border-b border-border/70 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">Fetch Settings</p>
                <p className="text-sm text-muted-foreground">
                  {preview.feed.title ?? "Untitled Podcast"} • {preview.feed.totalEpisodes} episodes in feed
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {preview.usage.planCode.toUpperCase()} plan
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Stat title="Consumed" value={String(preview.usage.consumedUnits)} />
              <Stat title="Remaining" value={String(preview.usage.remainingUnits)} />
              <Stat title="Can process now" value={String(preview.importPolicy.maxImportable)} />
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Number of recent episodes</p>
                <p className="text-xs text-muted-foreground">Newest episodes are auto-selected up to your current limit.</p>
              </div>
              <p className="text-sm font-semibold text-primary">
                {requestedEpisodes} / {preview.importPolicy.maxImportable}
              </p>
            </div>

            <input
              type="range"
              min={preview.importPolicy.maxImportable > 0 ? 1 : 0}
              max={Math.max(preview.importPolicy.maxImportable, 1)}
              value={preview.importPolicy.maxImportable > 0 ? requestedEpisodes : 0}
              onChange={(event) => onRequestedEpisodesChange(Number(event.target.value))}
              className="w-full accent-primary"
              disabled={preview.importPolicy.maxImportable === 0}
            />

            {preview.importPolicy.upgradeSuggested ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                Upgrade to process more historical episodes from this feed.
              </p>
            ) : null}

            {preview.importPolicy.maxImportable === 0 ? (
              <p className="rounded-2xl border border-border/70 bg-secondary/20 px-4 py-2 text-xs text-muted-foreground">
                You have no remaining episode allowance. Add credits or upgrade your plan to continue.
              </p>
            ) : null}
          </div>

          <div className="border-t border-border/70 px-6 py-5">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Available Episodes</h3>
              <Badge variant="outline">From Feed</Badge>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/80 bg-white/80">
              {previewEpisodes.map((episode, index) => {
                const withinAllowance = index < preview.importPolicy.maxImportable;
                const selected = index < requestedEpisodes;

                return (
                  <div
                    key={episode.guid}
                    className={`flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 ${
                      !withinAllowance ? "opacity-55" : ""
                    }`}
                  >
                    <div
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${
                        selected ? "border-primary bg-primary text-white" : "border-border bg-white text-transparent"
                      }`}
                    >
                      •
                    </div>

                    {episode.episodeImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={episode.episodeImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                        {(preview.feed.title ?? "P").slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{episode.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(episode.durationSec)} • {formatDate(episode.publishedAt)}
                      </p>
                    </div>

                    {!withinAllowance ? <p className="text-xs text-muted-foreground">Limit reached</p> : null}
                  </div>
                );
              })}
            </div>

            {preview.episodes.length > PREVIEW_LIST_LIMIT ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing first {PREVIEW_LIST_LIMIT} episodes out of {preview.episodes.length}.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-secondary/15 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onCancelPreview}>
              Cancel
            </Button>
            <Button type="button" onClick={onImportFeed} disabled={importLoading || preview.importPolicy.maxImportable === 0}>
              {importLoading ? "Starting import..." : `Import ${requestedEpisodes} Episodes`}
            </Button>
          </div>
        </section>
      ) : null}

      {importError ? <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{importError}</p> : null}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown publish date";
  }

  return new Date(value).toLocaleDateString();
}

function formatDuration(value: number | null) {
  if (!value || value <= 0) {
    return "Unknown duration";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}
