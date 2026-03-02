export type DashboardEpisodeRow = {
  id: string;
  podcastId: string;
  podcastTitle: string | null;
  podcastImageUrl: string | null;
  episodeTitle: string;
  episodeImageUrl: string | null;
  episodeUrl: string | null;
  publishedAt: string | null;
  durationSec: number | null;
  status: string;
};

export type DashboardOverviewPayload = {
  episodes: DashboardEpisodeRow[];
  generatedAt: string;
};
