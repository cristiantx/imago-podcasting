import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { requireEnvValue } from "@/lib/config";
import * as schema from "@/lib/db/schema";

const databaseUrl = requireEnvValue("DATABASE_URL");

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const pgClient =
  globalForDb.pgClient ??
  postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });
