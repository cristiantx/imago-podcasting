import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { listPodcastsForUser } from "@/lib/services/podcast-reader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const clerkUserId = await requireUser();
  const podcasts = await listPodcastsForUser(clerkUserId);

  return (
    <AppShell
      podcasts={podcasts.map((podcast) => ({
        id: podcast.id,
        title: podcast.title,
        imageUrl: podcast.imageUrl
      }))}
    >
      {children}
    </AppShell>
  );
}
