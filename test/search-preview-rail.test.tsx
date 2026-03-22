import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchPreviewRail } from "@/components/search-preview-rail";
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

describe("SearchPreviewRail", () => {
  it("renders a selected preview with a jump CTA", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SearchPreviewRail, {
        result,
        submittedQuery: "selectable cards"
      })
    );

    expect(markup).toContain("Jump to 0:42");
    expect(markup).toContain("Host");
    expect(markup).toContain("Selectable cards should stay readable and easy to navigate.");
    expect(markup).toContain(result.episodeHref);
  });

  it("renders a null-state preview when no result is selected", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SearchPreviewRail, {
        result: null,
        submittedQuery: "selectable cards"
      })
    );

    expect(markup).toContain("Select a result to preview it here");
    expect(markup).toContain("Jump to episode");
  });
});
