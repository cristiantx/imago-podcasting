import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  podcastFindMany: vi.fn(),
  podcastFindFirst: vi.fn(),
  episodeFindMany: vi.fn(),
  ingestFindMany: vi.fn(),
  segmentFindMany: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    query: {
      podcasts: {
        findMany: mocks.podcastFindMany,
        findFirst: mocks.podcastFindFirst
      },
      episodes: {
        findMany: mocks.episodeFindMany
      },
      ingestJobs: {
        findMany: mocks.ingestFindMany
      },
      transcriptSegments: {
        findMany: mocks.segmentFindMany
      }
    }
  }
}));

import { getEpisodeDetailForUser, getPodcastEpisodesForUser, listPodcastsForUser } from "@/lib/services/podcast-reader";

describe("podcast reader soft delete handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits deleted podcasts from the sidebar list", async () => {
    mocks.podcastFindMany.mockResolvedValue([
      {
        id: "podcast_active",
        title: "Active Show",
        description: null,
        feedUrl: "https://example.com/active.xml",
        imageUrl: null,
        language: "en",
        status: "idle",
        lastSyncedAt: null,
        createdAt: new Date("2026-03-20T00:00:00.000Z"),
        updatedAt: new Date("2026-03-20T00:00:00.000Z"),
        deletedAt: null
      },
      {
        id: "podcast_deleted",
        title: "Deleted Show",
        description: null,
        feedUrl: "https://example.com/deleted.xml",
        imageUrl: null,
        language: "en",
        status: "idle",
        lastSyncedAt: null,
        createdAt: new Date("2026-03-20T00:00:00.000Z"),
        updatedAt: new Date("2026-03-20T00:00:00.000Z"),
        deletedAt: new Date("2026-03-20T00:00:00.000Z")
      }
    ]);
    mocks.episodeFindMany.mockResolvedValue([]);
    mocks.ingestFindMany.mockResolvedValue([]);

    const podcasts = await listPodcastsForUser("user_123");

    expect(podcasts.map((podcast) => podcast.id)).toEqual(["podcast_active"]);
  });

  it("treats deleted podcasts as missing on episode list views", async () => {
    mocks.podcastFindFirst.mockResolvedValue({
      id: "podcast_deleted",
      clerkUserId: "user_123",
      deletedAt: new Date("2026-03-20T00:00:00.000Z")
    });

    await expect(
      getPodcastEpisodesForUser({
        clerkUserId: "user_123",
        podcastId: "podcast_deleted"
      })
    ).rejects.toThrow("Podcast not found");
  });

  it("treats deleted podcasts as missing on episode detail views", async () => {
    mocks.podcastFindFirst.mockResolvedValue({
      id: "podcast_deleted",
      clerkUserId: "user_123",
      deletedAt: new Date("2026-03-20T00:00:00.000Z")
    });

    await expect(
      getEpisodeDetailForUser({
        clerkUserId: "user_123",
        podcastId: "podcast_deleted",
        episodeId: "episode_1"
      })
    ).rejects.toThrow("Podcast not found");
  });
});
