import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SearchResultsColumn } from "@/components/search-results-column";
import type { SemanticSearchResult } from "@/lib/ui/search-results";

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
  it("renders the inline preview directly after the selected card", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SearchResultsColumn, {
        results: [firstResult, secondResult],
        activeResult: firstResult,
        submittedQuery: "selectable cards",
        actionFeedback: {},
        canLoadMore: false,
        onLoadMore: vi.fn(),
        onSelectResult: vi.fn(),
        onCopyQuote: vi.fn(),
        onShareResult: vi.fn()
      })
    );

    const selectedIndex = markup.indexOf("Selected Result");
    const previewIndex = markup.indexOf("Jump to 0:42");
    const nextResultIndex = markup.indexOf("Next Result");

    expect(selectedIndex).toBeGreaterThan(-1);
    expect(previewIndex).toBeGreaterThan(selectedIndex);
    expect(nextResultIndex).toBeGreaterThan(previewIndex);
  });
});
