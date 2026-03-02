import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireUser } from "@/lib/auth/session";
import { getExistingPodcastForFeed, previewImportFromFeed, startImportFromFeed } from "@/lib/services/import-service";
import { POST as importRoutePost } from "@/app/api/podcasts/import/route";
import { POST as previewRoutePost } from "@/app/api/podcasts/import/preview/route";

vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn()
}));

vi.mock("@/lib/services/import-service", () => ({
  getExistingPodcastForFeed: vi.fn(),
  previewImportFromFeed: vi.fn(),
  startImportFromFeed: vi.fn()
}));

const requireUserMock = vi.mocked(requireUser);
const getExistingPodcastForFeedMock = vi.mocked(getExistingPodcastForFeed);
const previewImportFromFeedMock = vi.mocked(previewImportFromFeed);
const startImportFromFeedMock = vi.mocked(startImportFromFeed);

describe("podcast import routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue("user_123");
  });

  it("returns preview payload with zero remaining allowance and upgrade hint", async () => {
    previewImportFromFeedMock.mockResolvedValue({
      status: "ready",
      payload: {
        feed: {
          rssUrl: "https://example.com/feed.xml",
          title: "Example Podcast",
          description: "desc",
          imageUrl: null,
          language: "en",
          totalEpisodes: 20
        },
        usage: {
          planCode: "free",
          planQuota: 5,
          extraCredits: 0,
          consumedUnits: 5,
          remainingUnits: 0
        },
        importPolicy: {
          maxImportable: 0,
          defaultRequestedEpisodes: 0,
          upgradeSuggested: true
        },
        episodes: [
          {
            guid: "g1",
            title: "Episode 1",
            publishedAt: "2026-03-01T00:00:00.000Z",
            durationSec: 1234,
            episodeUrl: "https://example.com/ep-1",
            episodeImageUrl: null
          }
        ]
      }
    });

    const response = await previewRoutePost(
      new Request("http://localhost/api/podcasts/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl: "https://example.com/feed.xml" })
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      importPolicy: { maxImportable: number; upgradeSuggested: boolean };
      usage: { remainingUnits: number };
      feed: { title: string | null };
    };
    expect(payload.feed.title).toBe("Example Podcast");
    expect(payload.usage.remainingUnits).toBe(0);
    expect(payload.importPolicy.maxImportable).toBe(0);
    expect(payload.importPolicy.upgradeSuggested).toBe(true);
  });

  it("returns 409 when preview is requested for an existing feed", async () => {
    previewImportFromFeedMock.mockResolvedValue({
      status: "existing_feed",
      podcastId: "podcast_1",
      podcastTitle: "Design Matters"
    });

    const response = await previewRoutePost(
      new Request("http://localhost/api/podcasts/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl: "https://example.com/feed.xml" })
      })
    );

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { error: string; podcastId: string };
    expect(payload.error).toContain("already exists");
    expect(payload.podcastId).toBe("podcast_1");
  });

  it("returns 409 when import is requested for an existing feed", async () => {
    getExistingPodcastForFeedMock.mockResolvedValue({
      id: "podcast_existing",
      title: "Existing Show"
    });

    const response = await importRoutePost(
      new Request("http://localhost/api/podcasts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl: "https://example.com/feed.xml", requestedEpisodes: 5 })
      })
    );

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { error: string; podcastId: string };
    expect(payload.error).toContain("already exists");
    expect(payload.podcastId).toBe("podcast_existing");
    expect(startImportFromFeedMock).not.toHaveBeenCalled();
  });

  it("returns 401 when user is unauthorized", async () => {
    requireUserMock.mockRejectedValue(new Error("Unauthorized"));

    const response = await previewRoutePost(
      new Request("http://localhost/api/podcasts/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl: "https://example.com/feed.xml" })
      })
    );

    expect(response.status).toBe(401);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("Unauthorized");
  });
});
