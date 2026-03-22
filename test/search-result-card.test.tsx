import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SearchResultCard } from "@/components/search-result-card";
import type { SemanticSearchResult } from "@/lib/ui/search-results";

const result: SemanticSearchResult = {
  podcastId: "pod-1",
  podcastTitle: "Design Matters",
  podcastImageUrl: null,
  episodeId: "ep-1",
  episodeTitle: "Extracting Selectable Cards",
  episodeUrl: "https://example.com/ep-1?t=42",
  episodeHref: "/podcasts/pod-1/episodes/ep-1?t=42",
  publishedAt: "2026-03-01T00:00:00.000Z",
  startSec: 42,
  endSec: 58,
  speaker: "Host",
  snippet: "Selectable cards should stay readable and easy to navigate.",
  score: 0.96
};

describe("SearchResultCard", () => {
  it("renders selected state semantics for a search result", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SearchResultCard, {
        result,
        submittedQuery: "selectable cards",
        selected: true,
        startLabel: "0:42",
        copyFeedback: "Copy Quote",
        shareFeedback: "Share",
        onSelect: vi.fn(),
        onCopyQuote: vi.fn(),
        onShareResult: vi.fn()
      })
    );

    expect(markup).toContain('aria-pressed="true"');
    expect(markup).not.toContain('role="button"');
    expect(markup).toContain("Extracting Selectable Cards");
    expect(markup).toContain("Go to Episode");
    expect(markup).toContain('aria-label="Copy quote from Extracting Selectable Cards"');
    expect(markup).toContain('aria-label="Share Extracting Selectable Cards"');
    expect(markup).toContain('aria-label="Go to Extracting Selectable Cards at 0:42"');
  });
});
