import { describe, expect, it } from "vitest";

import type { SemanticSearchResult } from "@/lib/ui/search-results";
import {
  getSearchResultKey,
  resolveInitialActiveResultKey,
  resolveRetainedActiveResultKey
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
  }
];

describe("search workspace helpers", () => {
  it("builds a stable result key from an episode and timestamp", () => {
    expect(getSearchResultKey(results[0])).toBe("ep-1:42");
  });

  it("returns the first result key as the initial active result", () => {
    expect(resolveInitialActiveResultKey(results)).toBe("ep-1:42");
    expect(resolveInitialActiveResultKey([])).toBeNull();
  });

  it("retains the current active result when it is still present", () => {
    expect(resolveRetainedActiveResultKey(results, "ep-2:12")).toBe("ep-2:12");
    expect(resolveRetainedActiveResultKey(results, "missing:99")).toBe("ep-1:42");
    expect(resolveRetainedActiveResultKey([], "missing:99")).toBeNull();
  });
});
