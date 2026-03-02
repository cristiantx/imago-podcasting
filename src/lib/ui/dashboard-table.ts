import type { DashboardEpisodeRow } from "@/lib/ui/dashboard-overview";

export const DASHBOARD_STATUSES = ["all", "queued", "processing", "completed", "failed"] as const;

export type DashboardStatusFilter = (typeof DASHBOARD_STATUSES)[number];

type PaginationResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
};

function normalizeStatus(status: string) {
  const value = status.toLowerCase();

  if (value.includes("queued")) return "queued";
  if (value.includes("processing") || value.includes("transcribing")) return "processing";
  if (value.includes("completed")) return "completed";
  if (value.includes("failed")) return "failed";

  return "unknown";
}

export function filterEpisodesByStatus(rows: DashboardEpisodeRow[], status: DashboardStatusFilter) {
  if (status === "all") {
    return rows;
  }

  return rows.filter((row) => normalizeStatus(row.status) === status);
}

export function paginateItems<T>(rows: T[], page: number, pageSize: number): PaginationResult<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  const items = rows.slice(start, end);
  const startIndex = totalItems === 0 ? 0 : start + 1;
  const endIndex = totalItems === 0 ? 0 : start + items.length;

  return {
    items,
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex
  };
}

function escapeCsvValue(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}

export function toDashboardCsv(rows: DashboardEpisodeRow[]) {
  const headers = ["Episode", "Podcast", "Status", "Published Date", "Duration (sec)", "Episode URL"];
  const dataLines = rows.map((row) =>
    [
      row.episodeTitle,
      row.podcastTitle ?? "Untitled Podcast",
      row.status,
      row.publishedAt ?? "",
      row.durationSec === null ? "" : String(row.durationSec),
      row.episodeUrl ?? ""
    ]
      .map((value) => escapeCsvValue(value))
      .join(",")
  );

  return [headers.join(","), ...dataLines].join("\n");
}
