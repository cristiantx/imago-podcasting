"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Copy, Share2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatSearchScorePercent, getHighlightTokens, type SemanticSearchResult } from "@/lib/ui/search-results";

void React;

type SearchResultCardProps = {
  result: SemanticSearchResult;
  submittedQuery: string;
  selected: boolean;
  startLabel: string;
  copyFeedback: string;
  shareFeedback: string;
  onSelect: () => void;
  onCopyQuote: () => void;
  onShareResult: () => void;
};

export function SearchResultCard({
  result,
  submittedQuery,
  selected,
  startLabel,
  copyFeedback,
  shareFeedback,
  onSelect,
  onCopyQuote,
  onShareResult
}: SearchResultCardProps) {
  const scorePercent = formatSearchScorePercent(result.score);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[30px] border p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] motion-safe:transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_30px_70px_rgba(15,23,42,0.12)] motion-reduce:transform-none motion-reduce:transition-none sm:p-7",
        selected
          ? "border-primary/30 bg-white shadow-[0_28px_72px_rgba(140,43,238,0.12)]"
          : "border-white/80 bg-white/95"
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1 rounded-l-[30px] transition-colors",
          selected ? "bg-primary" : "bg-slate-200 group-hover:bg-primary/40"
        )}
      />

      <button
        type="button"
        aria-pressed={selected}
        aria-label={`Select ${result.episodeTitle} for preview`}
        onClick={onSelect}
        className="block w-full cursor-pointer rounded-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-inset motion-reduce:transition-none"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <PodcastResultAvatar result={result} />
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{result.episodeTitle}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {result.podcastTitle}
                {result.publishedAt ? ` • ${formatPublishedAt(result.publishedAt)}` : ""}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex h-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm",
              scorePercent >= 95 ? "border-primary/20 bg-primary/10 text-primary" : "border-primary/10 bg-primary/5 text-primary/80"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {scorePercent}% Match
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-7 text-slate-700 sm:text-base">
          {getHighlightTokens(result.snippet, submittedQuery).map((token, tokenIndex) =>
            token.highlighted ? (
              <span
                key={`${result.episodeId}-${tokenIndex}`}
                className="mx-[1px] rounded-md bg-primary/10 px-1.5 py-0.5 font-semibold text-primary shadow-[inset_0_0_0_1px_rgba(140,43,238,0.12)]"
              >
                {token.text}
              </span>
            ) : (
              <span key={`${result.episodeId}-${tokenIndex}`}>{token.text}</span>
            )
          )}
        </p>
      </button>

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <button
            type="button"
            aria-label={`Copy quote from ${result.episodeTitle}`}
            onClick={() => {
              onCopyQuote();
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-medium motion-safe:transition motion-safe:hover:text-primary motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span aria-live="polite" aria-atomic="true">
              {copyFeedback}
            </span>
          </button>
          <button
            type="button"
            aria-label={`Share ${result.episodeTitle}`}
            onClick={() => {
              onShareResult();
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-medium motion-safe:transition motion-safe:hover:text-primary motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span aria-live="polite" aria-atomic="true">
              {shareFeedback}
            </span>
          </button>
        </div>

        <Link
          href={result.episodeHref}
          aria-label={`Go to ${result.episodeTitle} at ${startLabel}`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(140,43,238,0.26)] motion-safe:transition motion-safe:hover:brightness-105 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 sm:w-auto"
        >
          Go to Episode
          <span aria-hidden="true">-</span>
          {startLabel}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function PodcastResultAvatar({ result }: { result: SemanticSearchResult }) {
  if (result.podcastImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={result.podcastImageUrl}
        alt={`${result.podcastTitle} cover`}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
      />
    );
  }

  return (
    <div className="grid h-12 w-12 place-items-center rounded-full bg-[radial-gradient(circle_at_28%_25%,#d8b4fe,#7e22ce)] text-sm font-semibold text-white">
      {result.podcastTitle.slice(0, 1).toUpperCase()}
    </div>
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
