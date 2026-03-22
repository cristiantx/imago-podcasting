import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  podcastFindFirst: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    query: {
      podcasts: {
        findFirst: mocks.podcastFindFirst
      }
    }
  }
}));

import { getExistingPodcastForFeed } from "@/lib/services/import-service";

describe("import service soft delete handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores soft-deleted podcasts when checking for an existing feed", async () => {
    mocks.podcastFindFirst.mockResolvedValue({
      id: "podcast_deleted",
      title: "Deleted Show",
      deletedAt: new Date("2026-03-21T00:00:00.000Z")
    });

    await expect(
      getExistingPodcastForFeed({
        clerkUserId: "user_123",
        feedUrl: "https://example.com/feed.xml"
      })
    ).resolves.toBeUndefined();
  });
});
