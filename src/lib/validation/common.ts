import { z } from "zod";

export const rssUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith("http://") || url.startsWith("https://"), "Invalid feed URL protocol");

export const requestedEpisodesSchema = z.number().int().positive().max(10_000).optional();

export const podcastIdSchema = z.string().uuid();

export const searchSchema = z.object({
  podcastId: podcastIdSchema,
  query: z.string().min(2).max(500),
  topK: z.number().int().positive().max(50).optional().default(20)
});
