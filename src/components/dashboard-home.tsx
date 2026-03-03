"use client";

import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { DashboardOverviewPayload } from "@/lib/ui/dashboard-overview";
import { paginateItems } from "@/lib/ui/dashboard-table";

const PAGE_SIZE = 4;

export function DashboardHome() {
  const [episodes, setEpisodes] = useState<DashboardOverviewPayload["episodes"]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadOverview() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/dashboard/overview");
        const payload = (await response.json()) as DashboardOverviewPayload | { error: string };

        if (!response.ok) {
          throw new Error("error" in payload ? payload.error : "Failed to load dashboard episodes.");
        }

        if (isCurrent) {
          setEpisodes((payload as DashboardOverviewPayload).episodes);
        }
      } catch (err: unknown) {
        if (isCurrent) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard episodes.");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      isCurrent = false;
    };
  }, []);

  const pagination = useMemo(() => paginateItems(episodes, page, PAGE_SIZE), [episodes, page]);

  return (
    <section className="space-y-4">
      <div className="app-shell-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 lg:px-6">
          <h2 className="text-lg font-semibold leading-none text-slate-900">Recent Episodes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <colgroup>
              <col className="w-[44%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-slate-50/85 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3 lg:px-6">EPISODE</th>
                <th className="px-5 py-3">STATUS</th>
                <th className="px-5 py-3">PUBLISHED DATE</th>
                <th className="px-5 py-3">DURATION</th>
                <th className="px-5 py-3 text-right lg:px-6">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500 lg:px-6">
                    Loading episodes...
                  </td>
                </tr>
              ) : null}

              {!loading && error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-destructive lg:px-6">
                    {error}
                  </td>
                </tr>
              ) : null}

              {!loading && !error && pagination.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500 lg:px-6">
                    No episodes match this filter.
                  </td>
                </tr>
              ) : null}

              {!loading && !error
                ? pagination.items.map((episode) => (
                    <tr key={episode.id} className="border-t border-border/70">
                      <td className="px-5 py-4 lg:px-6">
                        <div className="flex items-center gap-3">
                          {episode.episodeImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={episode.episodeImageUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[radial-gradient(circle_at_30%_25%,#d8b4fe,#7e22ce)] text-xs font-semibold text-white">
                              {(episode.podcastTitle ?? "P").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 max-w-[26rem]">
                            <p className="truncate text-base font-semibold text-slate-900" title={episode.episodeTitle}>
                              {episode.episodeTitle}
                            </p>
                            <p className="truncate text-sm text-slate-500" title={episode.podcastTitle ?? "Untitled Podcast"}>
                              {episode.podcastTitle ?? "Untitled Podcast"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusPillClassName(episode.status)}>
                          {statusBadgeLabel(episode.status)}
                          {statusBadgeDot(episode.status) ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-85" /> : null}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatDate(episode.publishedAt)}</td>
                      <td className="px-5 py-4 font-mono text-sm text-slate-600">{formatDuration(episode.durationSec)}</td>
                      <td className="px-5 py-4 text-right lg:px-6">
                        <div className="flex justify-end">
                          <Link
                            href={`/podcasts/${episode.podcastId}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-primary/5 hover:text-primary"
                            aria-label="Open episode actions"
                          >
                            <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-5 py-3 text-sm text-slate-500 lg:px-6">
          <p>
            Showing {pagination.startIndex}-{pagination.endIndex} of {pagination.totalItems} episodes
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={pagination.page <= 1}
              className="h-8 rounded-full border border-border bg-white px-3 transition hover:border-primary/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="h-8 rounded-full border border-border bg-white px-3 transition hover:border-primary/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function statusPillClassName(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("processing") || normalized.includes("transcribing")) {
    return "inline-flex items-center rounded-full border border-[#c4b5fd] bg-[#ede9fe] px-2.5 py-1 text-xs font-semibold text-[#7c3aed]";
  }

  if (normalized.includes("completed")) {
    return "inline-flex items-center rounded-full bg-[#7c3aed] px-2.5 py-1 text-xs font-semibold text-white shadow-[0_3px_10px_rgba(124,58,237,0.24)]";
  }

  if (normalized.includes("failed")) {
    return "inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700";
  }

  if (normalized.includes("queued")) {
    return "inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600";
  }

  return "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700";
}

function statusBadgeLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("processing") || normalized.includes("transcribing")) return "Transcribing";
  if (normalized.includes("completed")) return "Completed";
  if (normalized.includes("queued")) return "Draft";
  if (normalized.includes("failed")) return "Failed";
  return "Unknown";
}

function statusBadgeDot(status: string) {
  const normalized = status.toLowerCase();
  return normalized.includes("processing") || normalized.includes("transcribing");
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
}

function formatDuration(value: number | null) {
  if (!value || value <= 0) {
    return "-";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
