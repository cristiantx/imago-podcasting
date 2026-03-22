import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  findMany: vi.fn(),
  embedTextBatch: vi.fn(),
  getNamespace: vi.fn(),
  namespaceQuery: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    query: {
      podcasts: {
        findMany: mocks.findMany
      }
    },
    insert: mocks.insert
  }
}));

vi.mock("@/lib/vector/embeddings", () => ({
  embedTextBatch: mocks.embedTextBatch
}));

vi.mock("@/lib/vector/pinecone", () => ({
  getNamespace: mocks.getNamespace
}));

import { POST as searchRoutePost } from "@/app/api/search/route";

const PODCAST_ID_ONE = "11111111-1111-4111-8111-111111111111";
const PODCAST_ID_TWO = "22222222-2222-4222-8222-222222222222";
const EPISODE_ID_ONE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const EPISODE_ID_TWO = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue("user_123");
    mocks.embedTextBatch.mockResolvedValue([[0.12, 0.34, 0.56]]);
    mocks.getNamespace.mockReturnValue({
      query: mocks.namespaceQuery
    });
    mocks.insert.mockReturnValue({
      values: mocks.insertValues
    });
    mocks.insertValues.mockResolvedValue(undefined);
  });

  it("returns enriched single-podcast results and logs the search", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: PODCAST_ID_ONE,
        title: "Design Matters",
        imageUrl: "https://example.com/design.jpg"
      }
    ]);
    mocks.namespaceQuery.mockResolvedValue({
      matches: [
        {
          score: 0.981,
          metadata: {
            podcastId: PODCAST_ID_ONE,
            episodeId: EPISODE_ID_ONE,
            episodeTitle: "Ep 42: The Future of AI Design",
            episodeUrl: "https://example.com/ep-42",
            publishedAt: "2026-03-01T00:00:00.000Z",
            startMs: 62_000,
            endMs: 91_000,
            speaker: "Host",
            snippet: "A strong semantic result."
          }
        }
      ]
    });

    const response = await searchRoutePost(
      new Request("http://localhost/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcastId: PODCAST_ID_ONE,
          query: "semantic result",
          topK: 20
        })
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      results: Array<{
        podcastId: string;
        podcastTitle: string;
        podcastImageUrl: string | null;
        episodeHref: string;
        episodeUrl: string;
      }>;
    };

    expect(payload.results[0]).toMatchObject({
      podcastId: PODCAST_ID_ONE,
      podcastTitle: "Design Matters",
      podcastImageUrl: "https://example.com/design.jpg",
      episodeHref: `/podcasts/${PODCAST_ID_ONE}/episodes/${EPISODE_ID_ONE}?t=62`,
      episodeUrl: "https://example.com/ep-42?t=62"
    });
    expect(mocks.namespaceQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 60,
        filter: { podcastId: PODCAST_ID_ONE }
      })
    );
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        podcastId: PODCAST_ID_ONE,
        queryText: "semantic result"
      })
    );
  });

  it("supports multi-podcast scope and skips logging", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: PODCAST_ID_ONE,
        title: "Design Matters",
        imageUrl: "https://example.com/design.jpg"
      },
      {
        id: PODCAST_ID_TWO,
        title: "Tech Talks Daily",
        imageUrl: null
      }
    ]);
    mocks.namespaceQuery.mockResolvedValue({
      matches: [
        {
          score: 0.94,
          metadata: {
            podcastId: PODCAST_ID_TWO,
            episodeId: EPISODE_ID_TWO,
            episodeTitle: "Scalable Architecture",
            episodeUrl: "https://example.com/ep-2",
            publishedAt: "2026-02-27T00:00:00.000Z",
            startMs: 25_000,
            endMs: 45_000,
            speaker: "",
            snippet: "Cross-show search can still render podcast context."
          }
        }
      ]
    });

    const response = await searchRoutePost(
      new Request("http://localhost/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcastIds: [PODCAST_ID_ONE, PODCAST_ID_TWO],
          query: "cross show context",
          topK: 10
        })
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      results: Array<{
        podcastTitle: string;
        podcastImageUrl: string | null;
      }>;
    };

    expect(payload.results[0]).toMatchObject({
      podcastTitle: "Tech Talks Daily",
      podcastImageUrl: null
    });
    expect(mocks.namespaceQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 30,
        filter: {
          podcastId: {
            $in: [PODCAST_ID_ONE, PODCAST_ID_TWO]
          }
        }
      })
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an empty search scope", async () => {
    const response = await searchRoutePost(
      new Request("http://localhost/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcastIds: [],
          query: "semantic result",
          topK: 10
        })
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.namespaceQuery).not.toHaveBeenCalled();
  });

  it("fails before querying vectors when a requested podcast is unauthorized", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: PODCAST_ID_ONE,
        title: "Design Matters",
        imageUrl: null
      }
    ]);

    const response = await searchRoutePost(
      new Request("http://localhost/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podcastIds: [PODCAST_ID_ONE, PODCAST_ID_TWO],
          query: "semantic result",
          topK: 10
        })
      })
    );

    expect(response.status).toBe(404);
    expect(mocks.embedTextBatch).not.toHaveBeenCalled();
    expect(mocks.namespaceQuery).not.toHaveBeenCalled();
  });
});
