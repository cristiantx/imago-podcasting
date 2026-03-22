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
        submittedQuery: "selectable cards",
        copyFeedback: "Copied",
        shareFeedback: "Shared"
      })
    );

    expect(markup).toContain("Jump to 0:42");
    expect(markup).toContain("Host");
    expect(markup).toContain("Selectable cards should stay readable and easy to navigate.");
    expect(markup).toContain(result.episodeHref);
    expect(markup).toContain('aria-label="Jump to Extracting Selectable Cards at 0:42"');
    expect(markup).toContain("Confidence Layer");
    expect(markup).toContain('aria-label="Copy quote from Extracting Selectable Cards"');
    expect(markup).toContain('aria-label="Share Extracting Selectable Cards"');
    expect(markup).toContain("Copied");
    expect(markup).toContain("Shared");
  });

  it("uses a unique labeled region for each preview rail instance", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(SearchPreviewRail, {
          result,
          submittedQuery: "selectable cards",
          variant: "rail"
        }),
        React.createElement(SearchPreviewRail, {
          result,
          submittedQuery: "selectable cards",
          variant: "inline"
        })
      )
    );

    const ids = Array.from(markup.matchAll(/aria-labelledby="([^"]+)"/g), (match) => match[1]);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(markup).not.toContain('search-preview-rail-title');
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

  it("renders no-results messaging instead of the generic null state", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SearchPreviewRail, {
        result: null,
        submittedQuery: "selectable cards",
        emptyState: "no-results"
      })
    );

    expect(markup).toContain("No transcript moments matched this search");
    expect(markup).toContain("Refine search");
    expect(markup).not.toContain("Select a result to preview it here");
    expect(markup).not.toContain("Pick a result to load the preview");
  });
});
