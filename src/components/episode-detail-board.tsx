"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type EpisodeTranscriptSegment = {
  id: string;
  speakerLabel: string | null;
  startMs: number;
  endMs: number;
  text: string;
  chunkIndex: number;
};

type EpisodeDetailBoardProps = {
  podcastId: string;
  podcast: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    author: string | null;
    category: string | null;
  };
  episode: {
    id: string;
    title: string;
    summary: string | null;
    publishedAt: string | null;
    audioUrl: string;
    audioBlobUrl: string | null;
    episodeImageUrl: string | null;
    durationSec: number | null;
    status: string;
  };
  segments: EpisodeTranscriptSegment[];
};

type MentionItem = {
  name: string;
  description: string;
  timestamps: string[];
  avatarClassName: string;
  initial: string;
};

const COMPANY_MENTION_CANDIDATES = [
  { keyword: "figma", name: "Figma", avatarClassName: "bg-black text-white", initial: "F" },
  { keyword: "penpot", name: "Penpot", avatarClassName: "bg-emerald-500 text-white", initial: "P" },
  { keyword: "openai", name: "OpenAI", avatarClassName: "bg-slate-900 text-white", initial: "O" },
  { keyword: "google", name: "Google", avatarClassName: "bg-blue-500 text-white", initial: "G" },
  { keyword: "spotify", name: "Spotify", avatarClassName: "bg-green-600 text-white", initial: "S" },
  { keyword: "apple", name: "Apple", avatarClassName: "bg-slate-700 text-white", initial: "A" }
] as const;

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "because",
  "being",
  "between",
  "could",
  "every",
  "first",
  "going",
  "great",
  "hello",
  "into",
  "just",
  "know",
  "like",
  "maybe",
  "other",
  "really",
  "should",
  "their",
  "there",
  "these",
  "thing",
  "think",
  "those",
  "through",
  "today",
  "under",
  "using",
  "want",
  "well",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "would",
  "your"
]);

export function EpisodeDetailBoard({ podcastId, podcast, episode, segments }: EpisodeDetailBoardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const transcriptRowRefById = useRef(new Map<string, HTMLButtonElement | null>());

  const [query, setQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.durationSec ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();
  const audioSource = episode.audioUrl || episode.audioBlobUrl || "";
  const lastSegmentEndSec = segments.length > 0 ? segments[segments.length - 1].endMs / 1000 : 0;
  const timelineDuration = duration > 0 ? duration : Math.max(episode.durationSec ?? 0, lastSegmentEndSec);

  const filteredSegments = useMemo(() => {
    if (!normalizedQuery) {
      return segments;
    }

    return segments.filter((segment) => {
      const speaker = formatSpeakerLabel(segment.speakerLabel).toLowerCase();
      return segment.text.toLowerCase().includes(normalizedQuery) || speaker.includes(normalizedQuery);
    });
  }, [normalizedQuery, segments]);

  const activeSegmentIndex = useMemo(() => findActiveSegmentIndex(segments, currentTime), [segments, currentTime]);
  const activeSegmentId = activeSegmentIndex >= 0 ? segments[activeSegmentIndex]?.id : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const syncDuration = () => {
      const mediaDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      const fallbackDuration = Math.max(episode.durationSec ?? 0, lastSegmentEndSec);
      setDuration(mediaDuration > 0 ? mediaDuration : fallbackDuration);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    syncDuration();

    return () => {
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [episode.durationSec, lastSegmentEndSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!activeSegmentId) {
      return;
    }

    if (!filteredSegments.some((segment) => segment.id === activeSegmentId)) {
      return;
    }

    const container = transcriptContainerRef.current;
    const row = transcriptRowRefById.current.get(activeSegmentId);

    if (!container || !row) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const topThreshold = containerRect.top + 100;
    const bottomThreshold = containerRect.bottom - 180;

    if (rowRect.top < topThreshold || rowRect.bottom > bottomThreshold) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSegmentId, filteredSegments]);

  function registerTranscriptRow(segmentId: string) {
    return (node: HTMLButtonElement | null) => {
      if (node) {
        transcriptRowRefById.current.set(segmentId, node);
        return;
      }

      transcriptRowRefById.current.delete(segmentId);
    };
  }

  function seekTo(nextTimeSec: number, playOnSeek = false) {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const clampedTime = clamp(nextTimeSec, 0, timelineDuration || nextTimeSec || 0);
    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);

    if (playOnSeek) {
      void audio.play().catch(() => undefined);
    }
  }

  function onSegmentClick(segment: EpisodeTranscriptSegment) {
    seekTo(segment.startMs / 1000, true);
  }

  function onProgressChange(value: number) {
    if (timelineDuration <= 0) {
      return;
    }

    const nextTime = (value / 1000) * timelineDuration;
    seekTo(nextTime);
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play().catch(() => undefined);
      return;
    }

    audio.pause();
  }

  function adjustPlaybackRate() {
    setPlaybackRate((previousRate) => {
      if (previousRate >= 2) {
        return 1;
      }

      return Number((previousRate + 0.25).toFixed(2));
    });
  }

  const progressValue = timelineDuration > 0 ? Math.round((currentTime / timelineDuration) * 1000) : 0;
  const podcastTitle = podcast.title ?? "Untitled Podcast";

  return (
    <section className="page-transition -mx-4 -my-6 lg:-mx-12 lg:-my-8">
      <div className="h-screen overflow-hidden bg-[#f7f6f8]">
        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <header className="z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur md:px-8 lg:px-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-xl">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search transcript content..."
                  className="h-11 w-full rounded-xl border-0 bg-slate-100 pl-10 pr-4 text-sm text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)] outline-none transition focus:shadow-[inset_0_0_0_2px_rgba(140,43,238,0.35)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/api/podcasts/${podcastId}/episodes/${episode.id}/transcript/download`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/20"
                >
                  <DownloadIcon />
                  Export
                </a>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-primary/30 hover:text-primary"
                  onClick={(event) => event.preventDefault()}
                  aria-label="Settings"
                >
                  <SettingsIcon />
                </button>
              </div>
            </div>
          </header>

          <div ref={transcriptContainerRef} className="transcript-scroll flex-1 overflow-y-auto px-4 pb-44 pt-7 md:px-8 lg:px-12 lg:pb-48">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{episode.title}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {podcastTitle}
                  {episode.publishedAt ? ` • ${formatPublishedDate(episode.publishedAt)}` : ""}
                </p>
              </div>

              {segments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  No transcript chunks are available for this episode yet.
                </p>
              ) : null}

              {segments.length > 0 && filteredSegments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  No transcript chunks match your search.
                </p>
              ) : null}

              {filteredSegments.length > 0 ? (
                <div className="space-y-2">
                  {filteredSegments.map((segment) => {
                    const isActive = segment.id === activeSegmentId;
                    const speakerName = formatSpeakerLabel(segment.speakerLabel);

                    return (
                      <button
                        key={segment.id}
                        ref={registerTranscriptRow(segment.id)}
                        type="button"
                        onClick={() => onSegmentClick(segment)}
                        className={cn(
                          "group relative flex w-full gap-4 rounded-2xl px-3 py-3 text-left transition md:gap-6 md:px-4",
                          isActive ? "bg-primary/8" : "hover:bg-white"
                        )}
                        style={{ contentVisibility: "auto", containIntrinsicSize: "1px 90px" }}
                      >
                        {isActive ? <span className="absolute -left-1 bottom-3 top-3 w-1 rounded-full bg-primary" /> : null}

                        <span
                          className={cn(
                            "w-12 flex-none pt-1 text-right font-mono text-xs transition-colors",
                            isActive ? "font-bold text-primary" : "text-slate-400 group-hover:text-primary"
                          )}
                        >
                          {formatClock(segment.startMs / 1000)}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="mb-1 flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-bold uppercase tracking-[0.1em]",
                                isActive ? "text-primary" : "text-slate-700"
                              )}
                            >
                              {speakerName}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                isActive ? "bg-primary/15 text-primary" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {resolveSpeakerRole(speakerName)}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "block text-base leading-relaxed md:text-lg",
                              isActive ? "font-medium text-slate-900" : "text-slate-600"
                            )}
                          >
                            {highlightText(segment.text, normalizedQuery)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <audio ref={audioRef} src={audioSource} preload="metadata" className="hidden" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-12px_40px_-18px_rgba(15,23,42,0.28)] lg:left-80 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            {episode.episodeImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={episode.episodeImageUrl} alt={`${episode.title} cover`} className="h-11 w-11 flex-none rounded-lg object-cover shadow" />
            ) : (
              <div className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-slate-200 text-slate-500">
                <MicIcon className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{episode.title}</p>
                  <p className="truncate text-xs text-slate-500">{podcastTitle}</p>
                </div>
                <p className="flex-none whitespace-nowrap text-xs font-mono font-bold text-primary">
                  {formatClock(currentTime)} / <span className="text-slate-400">{formatClock(timelineDuration)}</span>
                </p>
              </div>

              <input
                type="range"
                min={0}
                max={1000}
                step={1}
                value={progressValue}
                onChange={(event) => onProgressChange(Number(event.target.value))}
                className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary"
                aria-label="Playback progress"
              />
            </div>

            <div className="flex flex-none items-center gap-1 text-slate-500 sm:gap-2">
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-primary/10 hover:text-primary"
                onClick={() => seekTo(currentTime - 10, true)}
                aria-label="Back 10 seconds"
              >
                <ReplayIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white shadow-[0_8px_20px_rgba(140,43,238,0.35)] transition hover:brightness-105"
                onClick={() => {
                  void togglePlayback();
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-primary/10 hover:text-primary"
                onClick={() => seekTo(currentTime + 30, true)}
                aria-label="Forward 30 seconds"
              >
                <ForwardIcon className="h-4 w-4" />
              </button>
              <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
              <button
                type="button"
                className="hidden h-7 w-14 flex-none rounded-full border border-slate-200 text-center text-xs font-semibold text-slate-600 transition hover:border-primary/35 hover:text-primary sm:block"
                onClick={adjustPlaybackRate}
              >
                {playbackRate.toFixed(2).replace(/\.00$/, "")}x
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EpisodeMentionsSidebar({ companies, people, concepts }: { companies: MentionItem[]; people: MentionItem[]; concepts: string[] }) {
  return (
    <aside className="fixed bottom-0 right-0 top-0 z-20 hidden w-80 flex-col border-l border-slate-200 bg-white xl:flex">
      <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="mb-1 flex items-center gap-2">
          <FactCheckIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">Mentions</h3>
        </div>
        <p className="text-[11px] text-slate-500">Entities detected in this episode</p>
      </div>

      <div className="transcript-scroll flex-1 space-y-6 overflow-y-auto p-4">
        <MentionSection title="Companies & Tools" items={companies} />
        <MentionSection title="People" items={people} />

        <div>
          <h4 className="mb-3 pl-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Key Concepts</h4>
          <div className="flex flex-wrap gap-2">
            {concepts.map((concept) => (
              <span
                key={concept}
                className="cursor-default rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/40 p-4">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 transition hover:border-primary/30 hover:text-primary"
        >
          <ExploreIcon className="h-4 w-4" />
          Explore Related Episodes
        </button>
      </div>
    </aside>
  );
}

function MentionSection({ title, items }: { title: string; items: MentionItem[] }) {
  return (
    <div>
      <h4 className="mb-3 pl-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${title}-${item.name}`}
            className="group cursor-default rounded-xl border border-transparent bg-slate-50 p-3 transition hover:border-primary/20 hover:bg-white"
          >
            <div className="flex items-start gap-3">
              <div className={cn("grid h-8 w-8 flex-none place-items-center rounded-lg text-xs font-bold", item.avatarClassName)}>{item.initial}</div>
              <div className="min-w-0">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-900">{item.name}</span>
                  <OpenIcon className="h-3 w-3 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                </div>
                <p className="mb-2 text-[10px] text-slate-500">{item.description}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.timestamps.map((timestamp, index) => (
                    <span
                      key={`${item.name}-${timestamp}`}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold",
                        index === 0 ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {timestamp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function deriveCompanyMentions(transcriptText: string, segments: EpisodeTranscriptSegment[]): MentionItem[] {
  const normalizedText = transcriptText.toLowerCase();

  const matchedMentions = COMPANY_MENTION_CANDIDATES.flatMap((candidate) => {
    if (!normalizedText.includes(candidate.keyword)) {
      return [];
    }

    const firstChunk = segments.find((segment) => segment.text.toLowerCase().includes(candidate.keyword));

    return [
      {
        name: candidate.name,
        description: `Mentioned in this conversation around ${candidate.name}.`,
        timestamps: [formatClock((firstChunk?.startMs ?? 0) / 1000)],
        avatarClassName: candidate.avatarClassName,
        initial: candidate.initial
      } satisfies MentionItem
    ];
  });

  if (matchedMentions.length > 0) {
    return matchedMentions.slice(0, 4);
  }

  const fallbackTimestamp = formatClock((segments[0]?.startMs ?? 0) / 1000);

  return [
    {
      name: "Figma",
      description: "Design collaboration tool mentions and references.",
      timestamps: [fallbackTimestamp],
      avatarClassName: "bg-black text-white",
      initial: "F"
    },
    {
      name: "Penpot",
      description: "Open-source design tooling mentions in this episode.",
      timestamps: [fallbackTimestamp],
      avatarClassName: "bg-emerald-500 text-white",
      initial: "P"
    }
  ];
}

function derivePeopleMentions(segments: EpisodeTranscriptSegment[]): MentionItem[] {
  const firstOccurrence = new Map<string, number>();

  for (const segment of segments) {
    const speakerName = formatSpeakerLabel(segment.speakerLabel);
    if (!firstOccurrence.has(speakerName)) {
      firstOccurrence.set(speakerName, segment.startMs);
    }
  }

  const items = Array.from(firstOccurrence.entries())
    .slice(0, 4)
    .map(([name, timestampMs]) => ({
      name,
      description: `${resolveSpeakerRole(name)} in this episode transcript.`,
      timestamps: [formatClock(timestampMs / 1000)],
      avatarClassName: "bg-slate-800 text-white",
      initial: name.slice(0, 1).toUpperCase()
    }));

  if (items.length > 0) {
    return items;
  }

  return [
    {
      name: "Speaker 1",
      description: "Conversation participant identified by diarization.",
      timestamps: ["00:00"],
      avatarClassName: "bg-slate-800 text-white",
      initial: "S"
    }
  ];
}

function deriveKeyConcepts(transcriptText: string) {
  const words = transcriptText.match(/[A-Za-z][A-Za-z'-]{4,}/g) ?? [];
  const frequencyByWord = new Map<string, number>();

  for (const rawWord of words) {
    const normalizedWord = rawWord.toLowerCase();

    if (STOP_WORDS.has(normalizedWord)) {
      continue;
    }

    frequencyByWord.set(normalizedWord, (frequencyByWord.get(normalizedWord) ?? 0) + 1);
  }

  const ordered = Array.from(frequencyByWord.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => toTitleCase(word));

  if (ordered.length > 0) {
    return ordered;
  }

  return ["Episode Insight", "Conversation Theme", "Transcript Context"];
}

function findActiveSegmentIndex(segments: EpisodeTranscriptSegment[], currentTimeSec: number) {
  if (segments.length === 0) {
    return -1;
  }

  const currentMs = Math.floor(currentTimeSec * 1000);
  let left = 0;
  let right = segments.length - 1;
  let candidate = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const segment = segments[middle];

    if (segment.startMs <= currentMs) {
      candidate = middle;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  if (candidate === -1) {
    return 0;
  }

  const activeSegment = segments[candidate];
  if (currentMs <= activeSegment.endMs) {
    return candidate;
  }

  return Math.min(candidate + 1, segments.length - 1);
}

function highlightText(text: string, query: string): ReactNode {
  if (!query) {
    return text;
  }

  const escapedQuery = escapeRegExp(query);
  const pattern = new RegExp(`(${escapedQuery})`, "ig");
  const pieces = text.split(pattern);

  return pieces.map((piece, index) => {
    const isMatch = piece.toLowerCase() === query.toLowerCase();

    if (!isMatch) {
      return <span key={`${piece}-${index}`}>{piece}</span>;
    }

    return (
      <mark key={`${piece}-${index}`} className="transcript-highlight rounded px-0.5 py-px text-inherit">
        {piece}
      </mark>
    );
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatSpeakerLabel(label: string | null) {
  if (!label || label.trim().length === 0) {
    return "Speaker";
  }

  const normalized = label
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return toTitleCase(normalized);
}

function resolveSpeakerRole(speakerName: string) {
  if (speakerName.endsWith("1") || speakerName.toLowerCase().includes("host")) {
    return "Host";
  }

  return "Guest";
}

function formatPublishedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatClock(totalSeconds: number) {
  const safeTotal = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safeTotal / 3600);
  const minutes = Math.floor((safeTotal % 3600) / 60);
  const seconds = safeTotal % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m13.2 13.2 3.6 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 3.8v8.5m0 0 3.1-3.1M10 12.3 6.9 9.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.7 14.5h10.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="7" y="2.7" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.8 9.8a5.2 5.2 0 0 0 10.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 15v2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.6 17.2h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5.4 10.1a4.6 4.6 0 1 1 2 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5.8 6.5v3.4h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ForwardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M14.6 10.1a4.6 4.6 0 1 0-2 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.2 6.5v3.4H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="m7.3 5.7 7.2 4.3-7.2 4.3V5.7Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="6.1" y="5.5" width="2.7" height="9" rx="1" fill="currentColor" />
      <rect x="11.2" y="5.5" width="2.7" height="9" rx="1" fill="currentColor" />
    </svg>
  );
}

function FactCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3.2" y="3.8" width="13.6" height="12.4" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m6.2 10 2.1 2.1 5.3-5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8.4 11.6 1-3.2 3.2-1-1 3.2-3.2 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function OpenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7 13 13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 7h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
