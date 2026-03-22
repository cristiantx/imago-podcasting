import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SearchResultsColumn } from "@/components/search-results-column";
import { getSearchResultKey, type SemanticSearchResult } from "@/lib/ui/search-results";

const firstResult: SemanticSearchResult = {
  podcastId: "pod-1",
  podcastTitle: "Design Matters",
  podcastImageUrl: null,
  episodeId: "ep-1",
  episodeTitle: "Selected Result",
  episodeUrl: "https://example.com/ep-1?t=42",
  episodeHref: "/podcasts/pod-1/episodes/ep-1?t=42",
  publishedAt: "2026-03-01T00:00:00.000Z",
  startSec: 42,
  endSec: 58,
  speaker: "Host",
  snippet: "Selectable cards should stay readable and easy to navigate.",
  score: 0.96
};

const secondResult: SemanticSearchResult = {
  podcastId: "pod-1",
  podcastTitle: "Design Matters",
  podcastImageUrl: null,
  episodeId: "ep-2",
  episodeTitle: "Next Result",
  episodeUrl: "https://example.com/ep-2?t=90",
  episodeHref: "/podcasts/pod-1/episodes/ep-2?t=90",
  publishedAt: "2026-03-02T00:00:00.000Z",
  startSec: 90,
  endSec: 104,
  speaker: null,
  snippet: "A second match should remain after the preview on mobile.",
  score: 0.94
};

describe("SearchResultsColumn", () => {
  it("keeps the selected card in place and renders the preview directly beneath it on mobile", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SearchResultsColumn, {
        results: [firstResult, secondResult],
        activeResult: secondResult,
        submittedQuery: "selectable cards",
        actionFeedback: {},
        canLoadMore: false,
        onLoadMore: vi.fn(),
        onSelectResult: vi.fn(),
        onCopyQuote: vi.fn(),
        onShareResult: vi.fn()
      })
    );

    const mobileSectionStart = markup.indexOf('class="flex flex-col gap-4 lg:hidden"');
    const desktopSectionStart = markup.indexOf('class="hidden flex-col gap-4 lg:flex"');
    const mobileSection = markup.slice(mobileSectionStart, desktopSectionStart);
    const desktopSection = markup.slice(desktopSectionStart);

    expect(mobileSection.indexOf('aria-label="Select Selected Result for preview"')).toBeGreaterThan(-1);
    expect(mobileSection.indexOf('aria-label="Select Next Result for preview"')).toBeGreaterThan(
      mobileSection.indexOf('aria-label="Select Selected Result for preview"')
    );
    expect(mobileSection.indexOf("Jump to 1:30")).toBeGreaterThan(
      mobileSection.indexOf('aria-label="Select Next Result for preview"')
    );

    expect(desktopSection.indexOf('aria-label="Select Selected Result for preview"')).toBeGreaterThan(-1);
    expect(desktopSection.indexOf('aria-label="Select Next Result for preview"')).toBeGreaterThan(
      desktopSection.indexOf('aria-label="Select Selected Result for preview"')
    );
  });

  it("keeps feedback separate for matches from the same episode", () => {
    const firstSameEpisodeResult: SemanticSearchResult = {
      ...firstResult,
      episodeId: "ep-shared",
      episodeTitle: "Shared Episode Match One",
      startSec: 42,
      endSec: 58,
      snippet: "First match from the same episode."
    };
    const secondSameEpisodeResult: SemanticSearchResult = {
      ...firstResult,
      episodeId: "ep-shared",
      episodeTitle: "Shared Episode Match Two",
      startSec: 126,
      endSec: 141,
      snippet: "Second match from the same episode."
    };

    const markup = renderToStaticMarkup(
      React.createElement(SearchResultsColumn, {
        results: [firstSameEpisodeResult, secondSameEpisodeResult],
        activeResult: secondSameEpisodeResult,
        submittedQuery: "shared episode",
        actionFeedback: {
          [`${getSearchResultKey(firstSameEpisodeResult)}:copy`]: "Copied first",
          [`${getSearchResultKey(firstSameEpisodeResult)}:share`]: "Shared first",
          [`${getSearchResultKey(secondSameEpisodeResult)}:copy`]: "Copied second",
          [`${getSearchResultKey(secondSameEpisodeResult)}:share`]: "Shared second"
        },
        canLoadMore: false,
        onLoadMore: vi.fn(),
        onSelectResult: vi.fn(),
        onCopyQuote: vi.fn(),
        onShareResult: vi.fn()
      })
    );

    expect(markup).toContain("Copied first");
    expect(markup).toContain("Shared first");
    expect(markup).toContain("Copied second");
    expect(markup).toContain("Shared second");
  });
});
