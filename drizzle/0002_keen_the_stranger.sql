ALTER TABLE "usage_ledger" DROP CONSTRAINT "usage_ledger_podcast_id_fk";
--> statement-breakpoint
ALTER TABLE "usage_ledger" ALTER COLUMN "podcast_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_podcast_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
