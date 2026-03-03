"use client";

import {
  ArrowUpRight,
  BrainCircuit,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  EllipsisVertical,
  Hourglass,
  Mic,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type EpisodeItem = {
  id: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  status: string;
  durationSec: number | null;
  episodeUrl: string | null;
  episodeImageUrl: string | null;
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
    author: string | null;
    category: string | null;
    imageUrl: string | null;
    description: string | null;
    language: string;
    lastSyncedAt: string | null;
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
    startedAt: string;
    updatedAt: string;
  } | null;
  stageCounts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  episodes: EpisodeItem[];
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

const TRENDING_TOPICS = [
  "Artificial Intelligence",
  "UX Research",
  "Mental Models",
  "Ethics",
  "Design Systems",
  "Leadership"
];

const TOP_ENTITIES = [
  { name: "Figma", mentions: "Mentioned in 12 episodes", initial: "F", tone: "blue" },
  { name: "Adobe", mentions: "Mentioned in 8 episodes", initial: "A", tone: "indigo" },
  { name: "Y Combinator", mentions: "Mentioned in 5 episodes", initial: "Y", tone: "orange" }
] as const;

export function PodcastEpisodesBoard({ podcastId }: { podcastId: string }) {
  const router = useRouter();
  const [episodesData, setEpisodesData] = useState<EpisodesPayload | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [episodesError, setEpisodesError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const [openMenuEpisodeId, setOpenMenuEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function refreshEpisodes() {
      setLoadingEpisodes(true);
      setEpisodesError(null);

      try {
        const response = await fetch(`/api/podcasts/${podcastId}/episodes`);
        const payload = (await response.json()) as EpisodesPayload | { error: string };
        if (!response.ok) {
          throw new Error("error" in payload ? payload.error : "Failed to load episodes.");
        }

        if (isCurrent) {
          setEpisodesData(payload as EpisodesPayload);
        }
      } catch (error: unknown) {
        if (isCurrent) {
          setEpisodesError(error instanceof Error ? error.message : "Failed to load episodes.");
        }
      } finally {
        if (isCurrent) {
          setLoadingEpisodes(false);
        }
      }
    }

    void refreshEpisodes();

    return () => {
      isCurrent = false;
    };
  }, [podcastId]);

  useEffect(() => {
    if (!openMenuEpisodeId) {
      return;
    }

    function onWindowClick() {
      setOpenMenuEpisodeId(null);
    }

    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  }, [openMenuEpisodeId]);

  function openEpisodeDetails(episodeId: string) {
    router.push(`/podcasts/${podcastId}/episodes/${episodeId}`);
  }

  async function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    setHasSubmittedSearch(true);

    if (trimmedQuery.length < 2) {
      setSearchError("Search query must contain at least 2 characters.");
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcastId,
          query: trimmedQuery,
          topK: 12
        })
      });

      const payload = (await response.json()) as { results?: SearchResult[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Search failed.");
      }

      setSearchResults(payload.results ?? []);
    } catch (error: unknown) {
      setSearchError(error instanceof Error ? error.message : "Search failed.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  const podcastTitle = episodesData?.podcast.title ?? (loadingEpisodes ? "Loading podcast..." : "Untitled Podcast");
  const podcastAuthor = resolvePodcastAuthor(episodesData?.podcast.author ?? null, episodesData?.podcast.feedUrl ?? null);
  const podcastCategory = resolvePodcastCategory(episodesData?.podcast.category ?? null, episodesData?.podcast.language ?? null);

  return (
    <section className="page-transition grid grid-cols-12 gap-8 pb-10">
      <div className="col-span-12 space-y-6">
        <div className="pt-1">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {episodesData?.podcast.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={episodesData.podcast.imageUrl}
                  alt={`${podcastTitle} cover`}
                  className="h-[72px] w-[72px] rounded-2xl border border-slate-100 object-cover shadow-[0_8px_24px_rgba(15,23,42,0.1)]"
                />
              ) : (
                <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-[radial-gradient(circle_at_28%_25%,#d8b4fe,#7e22ce)] text-lg font-semibold text-white">
                  {podcastTitle.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-5xl font-bold leading-tight text-slate-900">{podcastTitle}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{podcastAuthor}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{podcastCategory}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="inline-flex items-center gap-1 text-primary">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Updated {formatRelativeDate(episodesData?.podcast.lastSyncedAt ?? null)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-800 transition hover:border-primary/30 hover:text-primary"
                onClick={(event) => event.preventDefault()}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-lg font-bold text-slate-900">Recent Episodes</h3>
          <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-slate-700" onClick={(event) => event.preventDefault()}>
            <span className="font-normal text-slate-500">Sort by:</span> Date Added
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {loadingEpisodes ? <StateMessage>Loading episodes...</StateMessage> : null}
        {episodesError ? <ErrorMessage>{episodesError}</ErrorMessage> : null}

        {!loadingEpisodes && !episodesError && episodesData?.episodes.length === 0 ? (
          <StateMessage>No episodes have been imported for this podcast yet.</StateMessage>
        ) : null}

        {!loadingEpisodes && !episodesError && episodesData?.episodes.length ? (
          <div className="space-y-4">
            {episodesData.episodes.map((episode, index) => {
              const status = getEpisodeStatus(episode);
              return (
                <article
                  key={episode.id}
                  className="group relative overflow-visible rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:cursor-pointer hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)]"
                  role="link"
                  tabIndex={0}
                  onClick={() => openEpisodeDetails(episode.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openEpisodeDetails(episode.id);
                    }
                  }}
                >
                  <div className="flex gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                      {episode.episodeImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={episode.episodeImageUrl} alt={`${episode.title} thumbnail`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-slate-400">
                          <Mic className="h-5 w-5" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <h4 className="truncate text-base font-bold text-slate-900">{episode.title}</h4>
                        <div className="relative flex items-center gap-2">
                          <span className={status.iconBadgeClassName} title={status.label}>
                            {status.icon}
                          </span>
                          <button
                            type="button"
                            aria-label="Episode actions"
                            className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuEpisodeId((current) => (current === episode.id ? null : episode.id));
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {openMenuEpisodeId === episode.id ? (
                            <div
                              className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                                onClick={() => {
                                  openEpisodeDetails(episode.id);
                                  setOpenMenuEpisodeId(null);
                                }}
                              >
                                Open episode details
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                                onClick={() => {
                                  void copyEpisodeDetailUrl(podcastId, episode.id);
                                  setOpenMenuEpisodeId(null);
                                }}
                              >
                                Copy detail page link
                              </button>
                              {episode.isTranscribed ? (
                                <a
                                  href={`/api/podcasts/${podcastId}/episodes/${episode.id}/transcript/download`}
                                  className="block rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                                  onClick={() => setOpenMenuEpisodeId(null)}
                                >
                                  Download transcript
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">{formatEpisodeSummary(episode.summary)}</p>

                      {episode.errorMessage ? <p className="mt-2 text-xs text-red-600">{episode.errorMessage}</p> : null}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDuration(episode.durationSec)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatRelativeDate(episode.publishedAt)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                          Ep. {episodesData.episodes.length - index}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="hidden">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(79,70,229,0.1)]">
          <div className="pointer-events-none absolute right-0 top-0 p-3 opacity-10">
            <BrainCircuit className="h-44 w-44 text-primary" aria-hidden="true" />
          </div>

          <div className="relative z-10 border-b border-slate-100 p-7">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Semantic Insights</h3>
            </div>
            <p className="text-sm text-slate-500">Explore concepts and themes across all transcribed episodes of this show.</p>
          </div>

          <div className="relative z-10 flex-1 space-y-7 overflow-y-auto p-7">
            <form onSubmit={onSearchSubmit} className="space-y-3">
              <label htmlFor="podcast-semantic-search" className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-primary">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="podcast-semantic-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search concepts in this show..."
                  className="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="submit"
                    disabled={searchLoading || loadingEpisodes}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500 transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {searchLoading ? "..." : "RUN"}
                  </button>
                </div>
              </div>
            </form>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Search Results</h4>
                <span className="text-xs text-slate-400">{searchResults.length} matches</span>
              </div>

              {searchError ? <ErrorMessage>{searchError}</ErrorMessage> : null}

              {!searchError && searchLoading ? <StateMessage>Searching transcript embeddings...</StateMessage> : null}

              {!searchError && !searchLoading && hasSubmittedSearch && searchResults.length === 0 ? (
                <StateMessage>No semantic matches for this query yet.</StateMessage>
              ) : null}

              {!searchError && !searchLoading && !hasSubmittedSearch ? (
                <StateMessage>Run a query to view transcript moments.</StateMessage>
              ) : null}

              {!searchError && searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div key={`${result.episodeId}-${result.startSec}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{result.episodeTitle}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{result.snippet}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                          {formatTime(result.startSec)} - {formatTime(result.endSec)}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">Score {result.score.toFixed(3)}</span>
                        {result.speaker ? <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500">{result.speaker}</span> : null}
                        <a
                          className="ml-auto inline-flex items-center gap-1 font-medium text-primary transition hover:text-primary/80"
                          href={result.episodeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Trending Topics</h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">UI only</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TOPICS.map((topic, index) => (
                  <span
                    key={topic}
                    className={
                      index % 3 === 0
                        ? "rounded-lg border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"
                        : "rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600"
                    }
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Top Entities</h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">UI only</span>
              </div>
              <div className="space-y-2">
                {TOP_ENTITIES.map((entity) => (
                  <div key={entity.name} className="flex items-center justify-between rounded-xl px-2 py-2 transition hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={entityInitialClassName(entity.tone)}>{entity.initial}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{entity.name}</p>
                        <p className="text-xs text-slate-500">{entity.mentions}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#6b21a8] p-6 text-white shadow-[0_20px_45px_rgba(126,34,206,0.35)]">
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-200">Total Insights</p>
                <h4 className="mt-2 text-3xl font-bold">1,248</h4>
                <p className="mt-2 text-sm text-white/85">Concept nodes extracted from your library this month.</p>
                <span className="mt-4 inline-flex rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-medium">Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StateMessage({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-500">{children}</p>;
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{children}</p>;
}

function entityInitialClassName(tone: "blue" | "indigo" | "orange") {
  if (tone === "blue") {
    return "grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700";
  }

  if (tone === "indigo") {
    return "grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700";
  }

  return "grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700";
}

function getEpisodeStatus(episode: EpisodeItem) {
  const normalized = episode.status.toLowerCase();

  if (normalized.includes("failed")) {
    return {
      label: "Failed",
      iconBadgeClassName: "grid h-7 w-7 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600",
      icon: <X className="h-4 w-4" aria-hidden="true" />
    };
  }

  if (normalized.includes("processing") || normalized.includes("transcribing")) {
    return {
      label: "Transcribing",
      iconBadgeClassName: "grid h-7 w-7 place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-600",
      icon: <Hourglass className="h-4 w-4" aria-hidden="true" />
    };
  }

  if (episode.isTranscribed || normalized.includes("completed")) {
    return {
      label: "Transcribed",
      iconBadgeClassName: "grid h-7 w-7 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600",
      icon: <Check className="h-4 w-4" aria-hidden="true" />
    };
  }

  return {
    label: "Not transcribed",
    iconBadgeClassName: "grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-400",
    icon: <span className="inline-block h-2 w-2 rounded-full bg-current" />
  };
}

function formatDuration(value: number | null) {
  if (!value || value <= 0) {
    return "Unknown duration";
  }

  const totalMinutes = Math.floor(value / 60);

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  return `${totalMinutes} min`;
}

function formatRelativeDate(value: string | null) {
  if (!value) {
    return "never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }

  return date.toLocaleDateString();
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function resolvePodcastAuthor(author: string | null, feedUrl: string | null) {
  if (author && author.trim().length > 0) {
    return author.trim();
  }

  if (!feedUrl) {
    return "Podcast Author";
  }

  try {
    const hostname = new URL(feedUrl).hostname.replace(/^www\./, "");
    return hostname.length > 0 ? hostname : "Podcast Author";
  } catch {
    return "Podcast Author";
  }
}

function resolvePodcastCategory(category: string | null, language: string | null) {
  if (category && category.trim().length > 0) {
    return category.trim();
  }

  if (!language) {
    return "Podcast";
  }

  return language.toUpperCase();
}

function formatEpisodeSummary(summary: string | null) {
  const normalized = (summary ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "No episode summary available.";
  }

  if (normalized.length <= 250) {
    return normalized;
  }

  return `${normalized.slice(0, 250).trimEnd()}...`;
}

async function copyEpisodeDetailUrl(podcastId: string, episodeId: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/podcasts/${podcastId}/episodes/${episodeId}`);
  } catch {
    // no-op: clipboard can fail in restricted browser contexts
  }
}
