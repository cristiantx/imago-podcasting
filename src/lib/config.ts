import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().default(""),
  CLERK_SECRET_KEY: z.string().default(""),
  DATABASE_URL: z.string().default(""),
  PINECONE_API_KEY: z.string().default(""),
  PINECONE_INDEX_NAME: z.string().default(""),
  AI_GATEWAY_API_KEY: z.string().default(""),
  DEEPGRAM_API_KEY: z.string().default(""),
  BLOB_READ_WRITE_TOKEN: z.string().default(""),
  INNGEST_EVENT_KEY: z.string().optional().default(""),
  INNGEST_SIGNING_KEY: z.string().optional().default(""),
  INNGEST_SERVE_ORIGIN: z.string().optional().default(""),
  INNGEST_BASE_URL: z.string().optional().default(""),
  ABSOLUTE_EPISODE_SAFETY_CAP: z.coerce.number().int().positive().default(500),
  ADMIN_API_KEY: z.string().default("")
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

export function requireEnvValue(name: keyof AppEnv) {
  const env = getEnv();
  const value = env[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
