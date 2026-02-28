import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  PINECONE_API_KEY: z.string().min(1),
  PINECONE_INDEX_NAME: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  DEEPGRAM_API_KEY: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_SERVE_ORIGIN: z.string().optional(),
  INNGEST_BASE_URL: z.string().optional(),
  ABSOLUTE_EPISODE_SAFETY_CAP: z.coerce.number().int().positive().default(500),
  ADMIN_API_KEY: z.string().min(1)
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  cachedEnv = parsed.data;
  return parsed.data;
}
