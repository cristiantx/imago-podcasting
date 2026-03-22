import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  returning: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    query: {
      podcasts: {
        findFirst: mocks.findFirst
      }
    },
    update: mocks.update
  }
}));

import { deletePodcastForUser } from "@/lib/services/podcast-management";

describe("podcast management", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.findFirst.mockResolvedValue({
      id: "podcast_1",
      clerkUserId: "user_123",
      deletedAt: null
    });

    mocks.update.mockReturnValue({
      set: mocks.set
    });
    mocks.set.mockReturnValue({
      where: mocks.where
    });
    mocks.where.mockResolvedValue(undefined);
    mocks.where.mockReturnValue({
      returning: mocks.returning
    });
    mocks.returning.mockResolvedValue([
      {
        id: "podcast_1",
        title: "My Renamed Podcast",
        updatedAt: new Date("2026-03-22T00:00:00.000Z")
      }
    ]);
  });

  it("soft deletes a podcast without removing related records", async () => {
    const result = await deletePodcastForUser({
      clerkUserId: "user_123",
      podcastId: "podcast_1"
    });

    expect(result.podcastId).toBe("podcast_1");
    expect(typeof result.deletedAt).toBe("string");
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date)
      })
    );
  });

  it("renames a podcast title without changing its identity", async () => {
    const { renamePodcastForUser } = await import("@/lib/services/podcast-management");

    const result = await renamePodcastForUser({
      clerkUserId: "user_123",
      podcastId: "podcast_1",
      title: "My Renamed Podcast"
    });

    expect(result.podcastId).toBe("podcast_1");
    expect(result.title).toBe("My Renamed Podcast");
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My Renamed Podcast",
        updatedAt: expect.any(Date)
      })
    );
  });
});
