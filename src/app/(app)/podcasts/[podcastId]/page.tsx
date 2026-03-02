import { PodcastDetailBoard } from "@/components/podcast-detail-board";

export default async function PodcastDetailPage({ params }: { params: Promise<{ podcastId: string }> }) {
  const { podcastId } = await params;

  return <PodcastDetailBoard podcastId={podcastId} />;
}
