"use client";

import React, { Fragment } from "react";

import { SearchPreviewRail } from "@/components/search-preview-rail";
import { SearchResultCard } from "@/components/search-result-card";
import { cn } from "@/lib/utils";
import { getSearchResultKey, type SemanticSearchResult } from "@/lib/ui/search-results";

type SearchResultsColumnProps = {
  results: SemanticSearchResult[];
  activeResult: SemanticSearchResult | null;
  submittedQuery: string;
  actionFeedback: Record<string, string>;
  canLoadMore: boolean;
  onLoadMore: () => void;
  onSelectResult: (result: SemanticSearchResult) => void;
  onCopyQuote: (result: SemanticSearchResult) => void;
  onShareResult: (result: SemanticSearchResult) => void;
};

export function SearchResultsColumn({
  results,
  activeResult,
  submittedQuery,
  actionFeedback,
  canLoadMore,
  onLoadMore,
  onSelectResult,
  onCopyQuote,
  onShareResult
}: SearchResultsColumnProps) {
  return (
    <div className="space-y-4">
      {results.map((result) => {
        const copyFeedback = actionFeedback[`${result.episodeId}:copy`] ?? "Copy Quote";
        const shareFeedback = actionFeedback[`${result.episodeId}:share`] ?? "Share";
        const isActiveResult =
          activeResult !== null &&
          activeResult.episodeId === result.episodeId &&
          activeResult.startSec === result.startSec;

        return (
          <Fragment key={getSearchResultKey(result)}>
            <SearchResultCard
              result={result}
              submittedQuery={submittedQuery}
              selected={isActiveResult}
              startLabel={formatTime(result.startSec)}
              copyFeedback={copyFeedback}
              shareFeedback={shareFeedback}
              onSelect={() => {
                onSelectResult(result);
              }}
              onCopyQuote={() => {
                onCopyQuote(result);
              }}
              onShareResult={() => {
                onShareResult(result);
              }}
            />

            {isActiveResult ? (
              <div className={cn("pt-2 lg:hidden")}>
                <SearchPreviewRail result={activeResult} submittedQuery={submittedQuery} variant="inline" />
              </div>
            ) : null}
          </Fragment>
        );
      })}

      {canLoadMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            Load More Results
          </button>
        </div>
      ) : null}
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
