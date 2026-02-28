ALTER TABLE "ingest_jobs" ADD COLUMN "queue_dispatch_status" varchar(24) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "ingest_jobs" ADD COLUMN "queue_dispatch_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ingest_jobs" ADD COLUMN "queue_dispatch_error" text;--> statement-breakpoint
ALTER TABLE "ingest_jobs" ADD COLUMN "queued_episode_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;