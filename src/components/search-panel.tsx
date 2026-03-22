"use client";

import React from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Podcast, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchResultCard } from "@/components/search-result-card";
import { cn } from "@/lib/utils";
import {
  type SemanticSearchResult,
  filterSearchResults,
  getSearchResultKey,
  paginateSearchResults,
  resolveInitialActiveResultKey,
  resolveRetainedActiveResultKey,
  sortSearchResults
} from "@/lib/ui/search-results";

void React;

const INITIAL_VISIBLE_RESULTS = 6;
const SEARCH_TOP_K = 60;

type SearchPodcastOption = {
  id: string;
  title: string | null;
  imageUrl: string | null;
  episodeCount: number;
};

export function SearchPanel({ podcasts }: { podcasts: SearchPodcastOption[] }) {
  const feedbackTimerIdsRef = useRef(new Map<string, number>());

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedPodcastIds, setSelectedPodcastIds] = useState<string[]>([]);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESULTS);
  const [activeResultKey, setActiveResultKey] = useState<string | null>(null);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});

  const activePodcastIds = selectedPodcastIds.length > 0 ? selectedPodcastIds : podcasts.map((podcast) => podcast.id);
  const filteredResults = useMemo(
    () =>
      sortSearchResults(
        filterSearchResults(results, {
          dateRange: "all",
          minScorePercent: 0
        }),
        "relevance"
      ),
    [results]
  );
  const visibleResults = useMemo(() => paginateSearchResults(filteredResults, visibleCount), [filteredResults, visibleCount]);
  const activeResult = useMemo(
    () => filteredResults.find((result) => getSearchResultKey(result) === activeResultKey) ?? null,
    [activeResultKey, filteredResults]
  );
  const canLoadMore = filteredResults.length > visibleResults.length;

  useEffect(() => {
    return () => {
      for (const timerId of feedbackTimerIdsRef.current.values()) {
        window.clearTimeout(timerId);
      }
      feedbackTimerIdsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setActiveResultKey((currentKey) => resolveRetainedActiveResultKey(filteredResults, currentKey));
  }, [filteredResults]);

  function onAllPodcastsClick() {
    setSelectedPodcastIds([]);
  }

  function onPodcastToggle(podcastId: string) {
    setSelectedPodcastIds((currentIds) => {
      if (currentIds.length === 0) {
        return [podcastId];
      }

      if (currentIds.includes(podcastId)) {
        const nextIds = currentIds.filter((currentId) => currentId !== podcastId);
        return nextIds.length > 0 ? nextIds : [];
      }

      return [...currentIds, podcastId];
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    setHasSubmittedSearch(true);

    if (podcasts.length === 0) {
      setError("Import a podcast before searching transcripts.");
      return;
    }

    if (trimmedQuery.length < 2) {
      setError("Search query must contain at least 2 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          activePodcastIds.length === 1
            ? {
                podcastId: activePodcastIds[0],
                query: trimmedQuery,
                topK: SEARCH_TOP_K
              }
            : {
                podcastIds: activePodcastIds,
                query: trimmedQuery,
                topK: SEARCH_TOP_K
              }
        )
      });

      const payload = (await response.json()) as { results?: SemanticSearchResult[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Search failed.");
      }

      setSubmittedQuery(trimmedQuery);
      setResults(payload.results ?? []);
      setActiveResultKey(resolveInitialActiveResultKey(payload.results ?? []));
      setVisibleCount(INITIAL_VISIBLE_RESULTS);
      setActionFeedback({});
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopyQuote(result: SemanticSearchResult) {
    try {
      const absoluteUrl = resolveAbsoluteUrl(result.episodeHref);
      const quote = `${result.podcastTitle}\n${result.episodeTitle}\n${formatTime(result.startSec)} - ${formatTime(result.endSec)}\n\n"${result.snippet}"\n\n${absoluteUrl}`;
      await copyToClipboard(quote);
      setActionMessage(`${result.episodeId}:copy`, "Copied");
    } catch {
      setError("Unable to copy that quote right now.");
    }
  }

  async function onShareResult(result: SemanticSearchResult) {
    const absoluteUrl = resolveAbsoluteUrl(result.episodeHref);

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: result.episodeTitle,
          text: result.snippet,
          url: absoluteUrl
        });
        setActionMessage(`${result.episodeId}:share`, "Shared");
        return;
      } catch (shareError) {
        if (isAbortError(shareError)) {
          return;
        }
      }
    }

    try {
      await copyToClipboard(absoluteUrl);
      setActionMessage(`${result.episodeId}:share`, "Link copied");
    } catch {
      setError("Unable to share that result right now.");
    }
  }

  function setActionMessage(key: string, message: string) {
    const existingTimerId = feedbackTimerIdsRef.current.get(key);
    if (existingTimerId) {
      window.clearTimeout(existingTimerId);
    }

    setActionFeedback((currentFeedback) => ({
      ...currentFeedback,
      [key]: message
    }));

    const timerId = window.setTimeout(() => {
      setActionFeedback((currentFeedback) => {
        const nextFeedback = { ...currentFeedback };
        delete nextFeedback[key];
        return nextFeedback;
      });
      feedbackTimerIdsRef.current.delete(key);
    }, 1800);

    feedbackTimerIdsRef.current.set(key, timerId);
  }

  return (
    <section className="page-transition space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(248,244,255,0.98)_52%,rgba(241,238,255,0.92)_100%)] shadow-[0_32px_80px_rgba(76,29,149,0.08)]">
        <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-sky-200/40 blur-3xl" />

          <div className="relative space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Search Scope
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onAllPodcastsClick}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                    selectedPodcastIds.length === 0
                      ? "border-primary bg-primary text-white shadow-[0_10px_30px_rgba(140,43,238,0.22)]"
                      : "border-slate-200 bg-white/90 text-slate-700 hover:border-primary/35 hover:text-primary"
                  )}
                >
                  <Podcast className="h-4 w-4" aria-hidden="true" />
                  All Podcasts
                </button>

                {podcasts.map((podcast) => {
                  const active = selectedPodcastIds.includes(podcast.id);
                  return (
                    <button
                      key={podcast.id}
                      type="button"
                      onClick={() => onPodcastToggle(podcast.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-2.5 py-2 pr-4 text-sm font-medium transition",
                        active
                          ? "border-primary/25 bg-primary/10 text-primary shadow-[0_10px_25px_rgba(140,43,238,0.12)]"
                          : "border-slate-200 bg-white/90 text-slate-700 hover:border-primary/30 hover:text-primary"
                      )}
                    >
                      <PodcastAvatar podcast={podcast} sizeClassName="h-7 w-7" />
                      <span className="max-w-[10rem] truncate">{podcast.title ?? "Untitled Podcast"}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-slate-500">
                {selectedPodcastIds.length === 0
                  ? `Searching across ${podcasts.length} imported podcast${podcasts.length === 1 ? "" : "s"}.`
                  : `Searching ${selectedPodcastIds.length} selected podcast${selectedPodcastIds.length === 1 ? "" : "s"}.`}
              </p>
            </div>

            <form onSubmit={onSubmit} className="relative">
              <div className="relative rounded-[28px] border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search concepts, topics, and exact phrases across your transcript archive."
                  className="h-16 w-full rounded-[24px] bg-transparent pl-14 pr-36 text-base text-slate-900 outline-none placeholder:text-slate-400 sm:text-lg"
                  disabled={podcasts.length === 0}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || podcasts.length === 0}
                  className="absolute right-3 top-1/2 h-10 -translate-y-1/2 rounded-2xl px-5 text-sm shadow-[0_12px_30px_rgba(140,43,238,0.24)]"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Searching
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        {hasSubmittedSearch ? (
          <div className="rounded-[28px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:px-6">
            <div className="space-y-1">
              <p className="text-sm text-slate-500">
                Found <span className="font-semibold text-slate-900">{filteredResults.length}</span> results for{" "}
                <span className="font-semibold text-slate-900">&quot;{submittedQuery}&quot;</span>
              </p>
              {loading ? <p className="text-xs font-medium text-primary">Refreshing results…</p> : null}
            </div>
          </div>
        ) : null}

        {podcasts.length === 0 ? (
          <EmptyState
            title="No podcasts imported yet"
            description="Add a feed from the workspace sidebar, then come back here to search your transcript archive by meaning."
          />
        ) : null}

        {podcasts.length > 0 && !hasSubmittedSearch ? (
          <EmptyState
            title="Run a query to view matched transcript moments"
            description="Use natural language, exact phrases, or audience problems to surface the strongest episode clips."
          />
        ) : null}

        {podcasts.length > 0 && hasSubmittedSearch && filteredResults.length === 0 ? (
          <EmptyState
            title="No semantic matches found"
            description="Try broadening the query or switching the search scope to all podcasts."
          />
        ) : null}

        {visibleResults.length > 0 ? (
          <div className="space-y-4">
            {visibleResults.map((result) => {
              const copyFeedback = actionFeedback[`${result.episodeId}:copy`] ?? "Copy Quote";
              const shareFeedback = actionFeedback[`${result.episodeId}:share`] ?? "Share";
              const isActiveResult =
                activeResult !== null &&
                activeResult.episodeId === result.episodeId &&
                activeResult.startSec === result.startSec;

              return (
                <SearchResultCard
                  key={`${result.episodeId}-${result.startSec}`}
                  result={result}
                  submittedQuery={submittedQuery}
                  selected={isActiveResult}
                  copyFeedback={copyFeedback}
                  shareFeedback={shareFeedback}
                  onSelect={() => {
                    setActiveResultKey(getSearchResultKey(result));
                  }}
                  onCopyQuote={() => {
                    void onCopyQuote(result);
                  }}
                  onShareResult={() => {
                    void onShareResult(result);
                  }}
                />
              );
            })}
          </div>
        ) : null}

        {canLoadMore ? (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisibleCount((currentCount) => currentCount + INITIAL_VISIBLE_RESULTS)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition hover:border-primary/35 hover:text-primary"
            >
              Load More Results
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[30px] border border-dashed border-slate-300 bg-white/75 px-6 py-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function PodcastAvatar({
  podcast,
  sizeClassName
}: {
  podcast: SearchPodcastOption;
  sizeClassName: string;
}) {
  if (podcast.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={podcast.imageUrl} alt={`${podcast.title ?? "Podcast"} cover`} className={cn("rounded-full object-cover", sizeClassName)} />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_28%_25%,#d8b4fe,#7e22ce)] font-semibold text-white",
        sizeClassName
      )}
      aria-hidden="true"
    >
      {(podcast.title ?? "P").slice(0, 1).toUpperCase()}
    </span>
  );
}
function formatPublishedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function copyToClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable");
  }

  await navigator.clipboard.writeText(value);
}

function resolveAbsoluteUrl(pathname: string) {
  return typeof window === "undefined" ? pathname : `${window.location.origin}${pathname}`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
