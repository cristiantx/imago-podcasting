ALTER TABLE "podcasts" ADD COLUMN IF NOT EXISTS "author" text;
ALTER TABLE "podcasts" ADD COLUMN IF NOT EXISTS "category" text;
