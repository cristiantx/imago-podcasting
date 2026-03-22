import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  renamePodcastForUser: vi.fn(),
  deletePodcastForUser: vi.fn()
}));

const PODCAST_ID = "11111111-1111-4111-8111-111111111111";

vi.mock("@/lib/auth/session", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("@/lib/services/podcast-management", () => ({
  renamePodcastForUser: mocks.renamePodcastForUser,
  deletePodcastForUser: mocks.deletePodcastForUser
}));

import { PATCH as podcastRoutePatch } from "@/app/api/podcasts/[podcastId]/route";

describe("podcast detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue("user_123");
    mocks.renamePodcastForUser.mockResolvedValue({
      podcastId: PODCAST_ID,
      title: "Renamed Podcast",
      updatedAt: "2026-03-22T00:00:00.000Z"
    });
  });

  it("renames a podcast title", async () => {
    const response = await podcastRoutePatch(
      new Request(`http://localhost/api/podcasts/${PODCAST_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Renamed Podcast" })
      }),
      { params: Promise.resolve({ podcastId: PODCAST_ID }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.renamePodcastForUser).toHaveBeenCalledWith({
      clerkUserId: "user_123",
      podcastId: PODCAST_ID,
      title: "Renamed Podcast"
    });

    const payload = (await response.json()) as { title: string; message: string };
    expect(payload.title).toBe("Renamed Podcast");
    expect(payload.message).toContain("renamed");
  });
});
