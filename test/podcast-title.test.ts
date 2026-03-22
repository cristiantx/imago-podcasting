import { describe, expect, it } from "vitest";

import { resolvePodcastTitleForFeedSync } from "@/lib/services/podcast-title";

describe("podcast title sync", () => {
  it("preserves an existing custom title during feed sync", () => {
    expect(
      resolvePodcastTitleForFeedSync({
        currentTitle: "My Custom Title",
        feedTitle: "Original Feed Title"
      })
    ).toBe("My Custom Title");
  });

  it("uses the feed title when no custom title exists", () => {
    expect(
      resolvePodcastTitleForFeedSync({
        currentTitle: null,
        feedTitle: "Original Feed Title"
      })
    ).toBe("Original Feed Title");
  });
});
