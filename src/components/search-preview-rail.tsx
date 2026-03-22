"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Play, Podcast, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPreviewSpeakerLabel, type SemanticSearchResult } from "@/lib/ui/search-results";

type SearchPreviewRailProps = {
  result: SemanticSearchResult | null;
  submittedQuery: string;
};

export function SearchPreviewRail({ result, submittedQuery }: SearchPreviewRailProps) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div
        className={cn(
          "overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,244,255,0.98)_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)]",
          "lg:shadow-[0_28px_76px_rgba(15,23,42,0.10)]"
        )}
      >
        <div className="border-b border-white/70 px-5 py-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Preview Rail
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <PlayerShell result={result} />

          {result ? (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Selected Result</p>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold leading-tight text-slate-900">{result.episodeTitle}</h3>
                  <p className="text-sm font-medium text-slate-500">
                    {result.podcastTitle}
                    {result.publishedAt ? ` • ${formatPublishedAt(result.publishedAt)}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <MetaPill label={formatPreviewSpeakerLabel(result.speaker)} />
                <MetaPill label={formatTime(result.startSec)} icon={<Clock3 className="h-3.5 w-3.5" aria-hidden="true" />} />
                <MetaPill label={submittedQuery.length > 0 ? `Matched: ${submittedQuery}` : "Matched in transcript"} />
              </div>

              <p className="text-[15px] leading-7 text-slate-700">{result.snippet}</p>

              <div className="rounded-[24px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Jump Action</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Go straight to the matched moment</p>
                    <p className="text-sm text-slate-500">
                      Start at <span className="font-semibold text-slate-900">{formatTime(result.startSec)}</span> in this episode.
                    </p>
                  </div>

                  <Link
                    href={result.episodeHref}
                    className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(140,43,238,0.26)] transition hover:brightness-105"
                  >
                    Jump to {formatTime(result.startSec)}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <NullPreviewState />
          )}
        </div>
      </div>
    </aside>
  );
}

function PlayerShell({ result }: { result: SemanticSearchResult | null }) {
  const hasSelection = result !== null;

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-slate-950 px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-[18px] shadow-[0_18px_36px_rgba(0,0,0,0.28)]",
            hasSelection
              ? "bg-[radial-gradient(circle_at_28%_25%,#d8b4fe,#7e22ce)]"
              : "bg-[radial-gradient(circle_at_28%_25%,rgba(148,163,184,0.9),rgba(51,65,85,0.95))]"
          )}
        >
          <Play className="h-6 w-6 translate-x-0.5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              {hasSelection ? "Mini Player Shell" : "Waiting for a selection"}
            </p>
            <p className="truncate text-base font-semibold text-white">
              {hasSelection ? result.episodeTitle : "Pick a result to load the preview"}
            </p>
            <p className="truncate text-sm text-white/70">{hasSelection ? result.podcastTitle : "The rail keeps the jump action close by."}</p>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 rounded-full bg-white/12">
              <div className={cn("h-full rounded-full", hasSelection ? "w-[48%] bg-primary" : "w-[18%] bg-white/45")} />
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-white/60">
              <span>{hasSelection ? formatTime(result.startSec) : "0:00"}</span>
              <span>{hasSelection ? formatTime(result.endSec) : "Preview only"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NullPreviewState() {
  return (
    <div className="space-y-4 rounded-[24px] border border-dashed border-slate-300/80 bg-white/75 px-5 py-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[radial-gradient(circle_at_28%_25%,#e2e8f0,#94a3b8)] text-white shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
        <Podcast className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Select a result to preview it here</h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-500">
          The preview rail keeps a player-style summary, timestamp, and jump link ready for the currently selected result.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
        Jump to episode
      </div>
    </div>
  );
}

function MetaPill({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
      {icon}
      {label}
    </span>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
