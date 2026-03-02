import { describe, expect, it } from "vitest";

import type { DashboardEpisodeRow } from "@/lib/ui/dashboard-overview";
import { filterEpisodesByStatus, paginateItems, toDashboardCsv } from "@/lib/ui/dashboard-table";

const rows: DashboardEpisodeRow[] = [
  {
    id: "1",
    podcastId: "pod-1",
    podcastTitle: "Design Matters",
    podcastImageUrl: null,
    episodeTitle: "Ep 42: The Future of AI Design",
    episodeImageUrl: "https://example.com/ep-42.jpg",
    episodeUrl: "https://example.com/ep-42",
    publishedAt: "2023-10-24T00:00:00.000Z",
    durationSec: 2720,
    status: "processing"
  },
  {
    id: "2",
    podcastId: "pod-1",
    podcastTitle: "Design Matters",
    podcastImageUrl: null,
    episodeTitle: "Ep 43: Color Theory",
    episodeImageUrl: "https://example.com/ep-43.jpg",
    episodeUrl: "https://example.com/ep-43",
    publishedAt: "2023-10-22T00:00:00.000Z",
    durationSec: 1900,
    status: "completed"
  },
  {
    id: "3",
    podcastId: "pod-2",
    podcastTitle: "Tech Talks Daily",
    podcastImageUrl: null,
    episodeTitle: "Scaling Search",
    episodeImageUrl: null,
    episodeUrl: null,
    publishedAt: null,
    durationSec: null,
    status: "failed"
  }
];

describe("dashboard table helpers", () => {
  it("filters rows by status", () => {
    expect(filterEpisodesByStatus(rows, "all")).toHaveLength(3);
    expect(filterEpisodesByStatus(rows, "processing")).toHaveLength(1);
    expect(filterEpisodesByStatus(rows, "completed")).toHaveLength(1);
    expect(filterEpisodesByStatus(rows, "failed")).toHaveLength(1);
  });

  it("paginates rows and exposes showing bounds", () => {
    const pageOne = paginateItems(rows, 1, 2);
    const pageTwo = paginateItems(rows, 2, 2);

    expect(pageOne.totalPages).toBe(2);
    expect(pageOne.startIndex).toBe(1);
    expect(pageOne.endIndex).toBe(2);
    expect(pageTwo.startIndex).toBe(3);
    expect(pageTwo.endIndex).toBe(3);
  });

  it("creates CSV with escaped fields", () => {
    const csv = toDashboardCsv([
      {
        ...rows[0],
        episodeTitle: 'Episode, "Quoted"'
      }
    ]);

    expect(csv).toContain("Episode,Podcast,Status,Published Date,Duration (sec),Episode URL");
    expect(csv).toContain("\"Episode, \"\"Quoted\"\"\"");
  });
});
