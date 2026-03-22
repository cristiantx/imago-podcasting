import { z } from "zod";

export const rssUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith("http://") || url.startsWith("https://"), "Invalid feed URL protocol");

export const requestedEpisodesSchema = z.number().int().positive().max(10_000).optional();
export const selectedEpisodeGuidsSchema = z.array(z.string().min(1)).max(10_000).optional();
export const podcastTitleSchema = z.string().trim().min(1).max(120);

export const podcastIdSchema = z.string().uuid();

export const searchSchema = z
  .object({
    podcastId: podcastIdSchema.optional(),
    podcastIds: z.array(podcastIdSchema).min(1).max(1000).optional(),
    query: z.string().min(2).max(500),
    topK: z.number().int().positive().max(60).optional().default(20)
  })
  .superRefine((value, ctx) => {
    if (!value.podcastId && !value.podcastIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a podcastId or podcastIds."
      });
    }

    if (value.podcastId && value.podcastIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either podcastId or podcastIds, not both."
      });
    }
  });
