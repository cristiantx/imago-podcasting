"use client";

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

export function PodcastDetailBoard({ podcastId }: { podcastId: string }) {
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
      <div className="col-span-12 space-y-6 xl:col-span-7">
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
                    <RefreshIcon />
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
                <SettingsIcon />
                Settings
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#8c2bee] to-[#a855f7] px-6 text-sm font-medium text-white shadow-[0_10px_24px_rgba(140,43,238,0.3)] transition hover:brightness-105"
                onClick={(event) => event.preventDefault()}
              >
                <PlusIcon />
                New Episode
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-lg font-bold text-slate-900">Recent Episodes</h3>
          <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-slate-700" onClick={(event) => event.preventDefault()}>
            <span className="font-normal text-slate-500">Sort by:</span> Date Added
            <ChevronDownIcon />
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
                  className={`group relative overflow-visible rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:shadow-[0_20px_45px_rgba(15,23,42,0.1)] ${
                    episode.episodeUrl ? "cursor-pointer" : "cursor-default"
                  }`}
                  role={episode.episodeUrl ? "link" : undefined}
                  tabIndex={episode.episodeUrl ? 0 : -1}
                  onClick={() => openEpisodeDetails(episode.episodeUrl)}
                  onKeyDown={(event) => {
                    if (!episode.episodeUrl) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openEpisodeDetails(episode.episodeUrl);
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
                          <MicIcon />
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
                            <MoreVerticalIcon />
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
                                  openEpisodeDetails(episode.episodeUrl);
                                  setOpenMenuEpisodeId(null);
                                }}
                              >
                                Open episode details
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                                onClick={() => {
                                  void copyEpisodeUrl(episode.episodeUrl);
                                  setOpenMenuEpisodeId(null);
                                }}
                              >
                                Copy episode link
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
                          <ClockIcon />
                          {formatDuration(episode.durationSec)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <CalendarIcon />
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

      <div className="col-span-12 h-full xl:col-span-5">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(79,70,229,0.1)]">
          <div className="pointer-events-none absolute right-0 top-0 p-3 opacity-10">
            <BrainGhostIcon />
          </div>

          <div className="relative z-10 border-b border-slate-100 p-7">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <SparkleIcon />
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
                  <SearchIcon />
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
                          <ArrowUpRightIcon />
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
                    <ChevronRightIcon />
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
      icon: <FailedIcon />
    };
  }

  if (normalized.includes("processing") || normalized.includes("transcribing")) {
    return {
      label: "Transcribing",
      iconBadgeClassName: "grid h-7 w-7 place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-600",
      icon: <HourglassIcon />
    };
  }

  if (episode.isTranscribed || normalized.includes("completed")) {
    return {
      label: "Transcribed",
      iconBadgeClassName: "grid h-7 w-7 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600",
      icon: <CheckIcon />
    };
  }

  return {
    label: "Not transcribed",
    iconBadgeClassName: "grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-400",
    icon: <DotIcon />
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

function openEpisodeDetails(url: string | null) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyEpisodeUrl(url: string | null) {
  if (!url) {
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // no-op: clipboard can fail in restricted browser contexts
  }
}

function MicIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="7" y="2.7" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.8 9.8a5.2 5.2 0 0 0 10.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 15v2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.6 17.2h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m13.2 13.2 3.6 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
      <path d="M4.8 10a5.2 5.2 0 0 1 9-3.6m1.4-1.9V8h-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.2 10a5.2 5.2 0 0 1-9 3.6M3.8 15.5V12h3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M10 6.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm7.2 3.2-1.5.9c0 .3-.2.7-.3 1l.8 1.6-1.6 1.6-1.6-.8a5.5 5.5 0 0 1-1 .4l-.9 1.5H8.9l-.9-1.5a5.5 5.5 0 0 1-1-.4l-1.6.8-1.6-1.6.8-1.6a5.5 5.5 0 0 1-.4-1L2.8 10l1.5-.9c0-.3.2-.7.3-1l-.8-1.6 1.6-1.6 1.6.8c.3-.1.6-.3 1-.4l.9-1.5h2.2l.9 1.5c.4.1.7.3 1 .4l1.6-.8 1.6 1.6-.8 1.6c.1.3.3.7.4 1l1.4.9Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 4.5v11m-5.5-5.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path d="M10 2.8 11.8 8l5.2 1.8-5.2 1.8L10 16.8l-1.8-5.2L3 9.8 8.2 8 10 2.8Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function BrainGhostIcon() {
  return (
    <svg viewBox="0 0 220 220" fill="none" className="h-44 w-44 text-primary">
      <circle cx="110" cy="110" r="82" stroke="currentColor" strokeWidth="14" />
      <path
        d="M78 118c0-13 11-24 24-24h16c13 0 24 11 24 24M92 82c0 8-6 14-14 14s-14-6-14-14 6-14 14-14 14 6 14 14Zm64 0c0 8-6 14-14 14s-14-6-14-14 6-14 14-14 14 6 14 14Z"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
      <path d="M6.2 13.8 13.8 6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.2 6.2h6.6v6.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-slate-300">
      <path d="m8 5 4 5-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreVerticalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <circle cx="10" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
      <circle cx="10" cy="10" r="6.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6.8V10l2.2 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
      <rect x="3.5" y="4.8" width="13" height="11.7" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 8.1h13M7 3.6v2.4m6-2.4v2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m5.4 10.4 3.1 3.1 6.1-6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M6 3.8h8M6 16.2h8M6.4 4.4c0 2.5 1.3 3.4 3.6 4.8-2.3 1.4-3.6 2.3-3.6 4.8m7.2-9.6c0 2.5-1.3 3.4-3.6 4.8 2.3 1.4 3.6 2.3 3.6 4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DotIcon() {
  return <span className="inline-block h-2 w-2 rounded-full bg-current" />;
}

function FailedIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m6.2 6.2 7.6 7.6m0-7.6-7.6 7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
