import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  baseEpisodeQuota: integer("base_episode_quota").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const accountEntitlements = pgTable(
  "account_entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 191 }).notNull().unique(),
    planId: uuid("plan_id").notNull(),
    extraEpisodeCredits: integer("extra_episode_credits").notNull().default(0),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.planId],
      foreignColumns: [plans.id],
      name: "account_entitlements_plan_id_fk"
    }),
    index("account_entitlements_plan_id_idx").on(table.planId)
  ]
);

export const podcasts = pgTable(
  "podcasts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 191 }).notNull(),
    feedUrl: text("feed_url").notNull(),
    title: text("title"),
    description: text("description"),
    imageUrl: text("image_url"),
    language: varchar("language", { length: 16 }).notNull().default("en"),
    status: varchar("status", { length: 32 }).notNull().default("idle"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("podcasts_clerk_user_id_idx").on(table.clerkUserId)]
);

export const ingestJobs = pgTable(
  "ingest_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    podcastId: uuid("podcast_id").notNull(),
    type: varchar("type", { length: 32 }).notNull().default("import"),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    totalItems: integer("total_items").notNull().default(0),
    processedItems: integer("processed_items").notNull().default(0),
    failedItems: integer("failed_items").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    errorSummary: text("error_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.podcastId],
      foreignColumns: [podcasts.id],
      name: "ingest_jobs_podcast_id_fk"
    }),
    index("ingest_jobs_podcast_id_idx").on(table.podcastId)
  ]
);

export const episodes = pgTable(
  "episodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    podcastId: uuid("podcast_id").notNull(),
    rssGuid: text("rss_guid").notNull(),
    title: text("title").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    audioUrl: text("audio_url").notNull(),
    episodeUrl: text("episode_url"),
    audioBlobUrl: text("audio_blob_url"),
    durationSec: integer("duration_sec"),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    errorMessage: text("error_message"),
    deepgramJobId: text("deepgram_job_id"),
    usageLedgerId: uuid("usage_ledger_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.podcastId],
      foreignColumns: [podcasts.id],
      name: "episodes_podcast_id_fk"
    }),
    unique("episodes_podcast_guid_unique").on(table.podcastId, table.rssGuid),
    index("episodes_podcast_id_idx").on(table.podcastId)
  ]
);

export const usageLedger = pgTable(
  "usage_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 191 }).notNull(),
    podcastId: uuid("podcast_id").notNull(),
    episodeId: uuid("episode_id"),
    units: integer("units").notNull().default(1),
    source: varchar("source", { length: 16 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("reserved"),
    reservationKey: varchar("reservation_key", { length: 128 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true })
  },
  (table) => [
    foreignKey({
      columns: [table.podcastId],
      foreignColumns: [podcasts.id],
      name: "usage_ledger_podcast_id_fk"
    }),
    index("usage_ledger_clerk_user_id_idx").on(table.clerkUserId),
    index("usage_ledger_podcast_id_idx").on(table.podcastId)
  ]
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    episodeId: uuid("episode_id").notNull(),
    speakerLabel: varchar("speaker_label", { length: 64 }),
    startMs: bigint("start_ms", { mode: "number" }).notNull(),
    endMs: bigint("end_ms", { mode: "number" }).notNull(),
    text: text("text").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    tokenCount: integer("token_count").notNull().default(0),
    pineconeVectorId: text("pinecone_vector_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.episodeId],
      foreignColumns: [episodes.id],
      name: "transcript_segments_episode_id_fk"
    }),
    index("transcript_segments_episode_id_idx").on(table.episodeId)
  ]
);

export const searchLogs = pgTable(
  "search_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    podcastId: uuid("podcast_id").notNull(),
    queryText: text("query_text").notNull(),
    resultCount: integer("result_count").notNull().default(0),
    latencyMs: integer("latency_ms").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.podcastId],
      foreignColumns: [podcasts.id],
      name: "search_logs_podcast_id_fk"
    }),
    index("search_logs_podcast_id_idx").on(table.podcastId)
  ]
);
