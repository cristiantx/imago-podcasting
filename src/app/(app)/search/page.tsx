import { SearchPanel } from "@/components/search-panel";
import { requireUser } from "@/lib/auth/session";
import { getCachedPodcastsForUser } from "@/lib/services/podcast-reader";

export default async function SearchPage() {
  const clerkUserId = await requireUser();
  const podcasts = await getCachedPodcastsForUser(clerkUserId);

  return (
    <SearchPanel
      podcasts={podcasts.map((podcast) => ({
        id: podcast.id,
        title: podcast.title,
        imageUrl: podcast.imageUrl,
        episodeCount: podcast.episodeCount
      }))}
    />
  );
}
