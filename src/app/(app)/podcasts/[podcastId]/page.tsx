import { PodcastEpisodesBoard } from "@/components/podcast-episodes-board";

export default async function PodcastEpisodesPage({ params }: { params: Promise<{ podcastId: string }> }) {
  const { podcastId } = await params;

  return <PodcastEpisodesBoard podcastId={podcastId} />;
}
