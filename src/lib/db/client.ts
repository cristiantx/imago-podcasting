import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { getEnv } from "@/lib/config";
import * as schema from "@/lib/db/schema";

const env = getEnv();

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const pgClient =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });
