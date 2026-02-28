CREATE TABLE IF NOT EXISTS "account_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"plan_id" uuid NOT NULL,
	"extra_episode_credits" integer DEFAULT 0 NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_entitlements_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid NOT NULL,
	"rss_guid" text NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp with time zone,
	"audio_url" text NOT NULL,
	"episode_url" text,
	"audio_blob_url" text,
	"duration_sec" integer,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"deepgram_job_id" text,
	"usage_ledger_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "episodes_podcast_guid_unique" UNIQUE("podcast_id","rss_guid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingest_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid NOT NULL,
	"type" varchar(32) DEFAULT 'import' NOT NULL,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"processed_items" integer DEFAULT 0 NOT NULL,
	"failed_items" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"error_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"base_episode_quota" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "podcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"feed_url" text NOT NULL,
	"title" text,
	"description" text,
	"image_url" text,
	"language" varchar(16) DEFAULT 'en' NOT NULL,
	"status" varchar(32) DEFAULT 'idle' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid NOT NULL,
	"query_text" text NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcript_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"speaker_label" varchar(64),
	"start_ms" bigint NOT NULL,
	"end_ms" bigint NOT NULL,
	"text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"pinecone_vector_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"podcast_id" uuid NOT NULL,
	"episode_id" uuid,
	"units" integer DEFAULT 1 NOT NULL,
	"source" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'reserved' NOT NULL,
	"reservation_key" varchar(128),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account_entitlements" ADD CONSTRAINT "account_entitlements_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "episodes" ADD CONSTRAINT "episodes_podcast_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingest_jobs" ADD CONSTRAINT "ingest_jobs_podcast_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_podcast_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_podcast_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_entitlements_plan_id_idx" ON "account_entitlements" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episodes_podcast_id_idx" ON "episodes" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingest_jobs_podcast_id_idx" ON "ingest_jobs" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "podcasts_clerk_user_id_idx" ON "podcasts" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_logs_podcast_id_idx" ON "search_logs" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transcript_segments_episode_id_idx" ON "transcript_segments" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_ledger_clerk_user_id_idx" ON "usage_ledger" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_ledger_podcast_id_idx" ON "usage_ledger" USING btree ("podcast_id");