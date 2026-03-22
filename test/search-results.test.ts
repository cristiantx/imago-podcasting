import { describe, expect, it } from "vitest";

import type { SemanticSearchResult } from "@/lib/ui/search-results";
import {
  filterSearchResults,
  getHighlightTokens,
  paginateSearchResults,
  formatPreviewSpeakerLabel,
  sortSearchResults
} from "@/lib/ui/search-results";

const results: SemanticSearchResult[] = [
  {
    podcastId: "pod-1",
    podcastTitle: "Design Matters",
    podcastImageUrl: null,
    episodeId: "ep-1",
    episodeTitle: "Recent Match",
    episodeUrl: "https://example.com/ep-1?t=42",
    episodeHref: "/podcasts/pod-1/episodes/ep-1?t=42",
    publishedAt: "2026-03-01T00:00:00.000Z",
    startSec: 42,
    endSec: 58,
    speaker: "Host",
    snippet: "Sustainable design patterns keep teams aligned.",
    score: 0.92
  },
  {
    podcastId: "pod-1",
    podcastTitle: "Design Matters",
    podcastImageUrl: null,
    episodeId: "ep-2",
    episodeTitle: "Older Match",
    episodeUrl: "https://example.com/ep-2?t=12",
    episodeHref: "/podcasts/pod-1/episodes/ep-2?t=12",
    publishedAt: "2025-10-01T00:00:00.000Z",
    startSec: 12,
    endSec: 25,
    speaker: null,
    snippet: "Design systems can scale if the organization stays disciplined.",
    score: 0.97
  },
  {
    podcastId: "pod-2",
    podcastTitle: "Tech Talks Daily",
    podcastImageUrl: null,
    episodeId: "ep-3",
    episodeTitle: "Undated Match",
    episodeUrl: "https://example.com/ep-3?t=33",
    episodeHref: "/podcasts/pod-2/episodes/ep-3?t=33",
    publishedAt: null,
    startSec: 33,
    endSec: 49,
    speaker: null,
    snippet: "AI design tooling still needs strong workflow rules.",
    score: 0.95
  },
  {
    podcastId: "pod-2",
    podcastTitle: "Tech Talks Daily",
    podcastImageUrl: null,
    episodeId: "ep-4",
    episodeTitle: "Low Score Match",
    episodeUrl: "https://example.com/ep-4?t=75",
    episodeHref: "/podcasts/pod-2/episodes/ep-4?t=75",
    publishedAt: "2026-03-04T00:00:00.000Z",
    startSec: 75,
    endSec: 93,
    speaker: null,
    snippet: "A weaker match should fall below the score threshold.",
    score: 0.71
  }
];

describe("search results helpers", () => {
  it("filters by date range and score threshold", () => {
    const filtered = filterSearchResults(results, {
      dateRange: "30d",
      minScorePercent: 85,
      now: new Date("2026-03-09T00:00:00.000Z")
    });

    expect(filtered.map((result) => result.episodeId)).toEqual(["ep-1"]);
  });

  it("includes undated results only for all-time searches", () => {
    const filtered = filterSearchResults(results, {
      dateRange: "all",
      minScorePercent: 90,
      now: new Date("2026-03-09T00:00:00.000Z")
    });

    expect(filtered.map((result) => result.episodeId)).toEqual(["ep-1", "ep-2", "ep-3"]);
  });

  it("sorts by newest date and by confidence", () => {
    const dateSorted = sortSearchResults(results, "date");
    const confidenceSorted = sortSearchResults(results, "confidence");

    expect(dateSorted.map((result) => result.episodeId)).toEqual(["ep-4", "ep-1", "ep-2", "ep-3"]);
    expect(confidenceSorted.map((result) => result.episodeId)).toEqual(["ep-2", "ep-3", "ep-1", "ep-4"]);
  });

  it("paginates visible results", () => {
    const paginated = paginateSearchResults(results, 2);

    expect(paginated.map((result) => result.episodeId)).toEqual(["ep-1", "ep-2"]);
  });

  it("highlights exact meaningful query terms only", () => {
    const tokens = getHighlightTokens(
      "Designers talk about design systems and sustainable design work.",
      "design sustainable and the"
    );

    expect(tokens.filter((token) => token.highlighted).map((token) => token.text.toLowerCase())).toEqual([
      "design",
      "sustainable",
      "design"
    ]);
  });

  it("formats preview speaker labels", () => {
    expect(formatPreviewSpeakerLabel("Host")).toBe("Host");
    expect(formatPreviewSpeakerLabel(null)).toBe("Transcript match");
  });
});
