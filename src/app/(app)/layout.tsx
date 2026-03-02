import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { getPlanNameForUser } from "@/lib/entitlements/service";
import { listPodcastsForUser } from "@/lib/services/podcast-reader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const clerkUserId = await requireUser();
  const [podcasts, planName] = await Promise.all([listPodcastsForUser(clerkUserId), getPlanNameForUser(clerkUserId)]);

  return (
    <AppShell
      planName={planName}
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
