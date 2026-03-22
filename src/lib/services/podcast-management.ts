import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { podcasts } from "@/lib/db/schema";

export async function deletePodcastForUser(input: { clerkUserId: string; podcastId: string }) {
  const podcast = await db.query.podcasts.findFirst({
    columns: { id: true, clerkUserId: true, deletedAt: true },
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  const deletedAt = podcast.deletedAt ?? new Date();

  await db
    .update(podcasts)
    .set({
      deletedAt,
      updatedAt: new Date()
    })
    .where(eq(podcasts.id, podcast.id));

  return {
    podcastId: podcast.id,
    deletedAt: deletedAt.toISOString()
  };
}

export async function renamePodcastForUser(input: { clerkUserId: string; podcastId: string; title: string }) {
  const podcast = await db.query.podcasts.findFirst({
    columns: { id: true, clerkUserId: true, deletedAt: true },
    where: and(eq(podcasts.id, input.podcastId), eq(podcasts.clerkUserId, input.clerkUserId))
  });

  if (!podcast || podcast.deletedAt) {
    throw new Error("Podcast not found");
  }

  const [updated] = await db
    .update(podcasts)
    .set({
      title: input.title,
      updatedAt: new Date()
    })
    .where(eq(podcasts.id, podcast.id))
    .returning({
      id: podcasts.id,
      title: podcasts.title,
      updatedAt: podcasts.updatedAt
    });

  return {
    podcastId: updated?.id ?? podcast.id,
    title: updated?.title ?? input.title,
    updatedAt: updated?.updatedAt?.toISOString?.() ?? new Date().toISOString()
  };
}
