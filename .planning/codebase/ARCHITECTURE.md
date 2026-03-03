# Architecture

## Style and Topology
- Application style: modular monolith on Next.js App Router (`src/app/**`) with server routes and React UI in one deployable unit.
- Pattern: route handlers call service modules; services orchestrate DB + external systems (`src/app/api/**` -> `src/lib/services/**` -> `src/lib/**`).
- Async domain: event-driven ingestion pipeline via Inngest (`src/app/api/inngest/route.ts`, `src/inngest/functions.ts`).
- Persistence split: relational source of truth in Postgres (`src/lib/db/schema.ts`) + vector index in Pinecone (`src/lib/vector/pinecone.ts`).

## Runtime Entry Points
- Web app shell and auth boundary:
  - `src/middleware.ts` protects most routes and leaves `/api/inngest` public.
  - `src/app/layout.tsx` wraps app in `ClerkProvider` and signed-in/signed-out shells.
  - `src/app/(app)/layout.tsx` loads user plan + podcast list for shared sidebar.
- API surface (App Router route handlers):
  - Import/search/status/exports under `src/app/api/**`.
  - Inngest HTTP handler at `src/app/api/inngest/route.ts`.

## Layer Responsibilities
1. Route layer
- Validates input and maps HTTP status/errors (`src/app/api/podcasts/import/route.ts`, `src/app/api/search/route.ts`).
- Enforces caller identity through `requireUser` (`src/lib/auth/session.ts`).

2. Service/application layer
- Podcast import orchestration and queue dispatch (`src/lib/services/import-service.ts`).
- Read models and aggregation for dashboard/podcast detail (`src/lib/services/podcast-reader.ts`).
- Destructive cleanup workflow (`src/lib/services/podcast-management.ts`).
- Transcript export assembly (`src/lib/services/transcript-export.ts`).

3. Domain/support layer
- Entitlement accounting + reservation policy (`src/lib/entitlements/service.ts`, `src/lib/entitlements/policy.ts`).
- Episode processing pipeline (`src/lib/pipeline/process-episode.ts`).
- RSS parse, transcription, chunking, embedding, storage adapters:
  - `src/lib/rss/parse-feed.ts`
  - `src/lib/transcription/deepgram.ts`
  - `src/lib/chunking/transcript-chunker.ts`
  - `src/lib/vector/embeddings.ts`
  - `src/lib/storage/audio.ts`, `src/lib/storage/transcript.ts`

4. Data access layer
- Drizzle schema is the canonical data model (`src/lib/db/schema.ts`).
- DB client singleton via postgres-js (`src/lib/db/client.ts`).
- Plan/bootstrap helpers (`src/lib/db/bootstrap.ts`).

## Core Data and State Model
- Main entities: `podcasts`, `ingest_jobs`, `episodes`, `transcript_segments`, `usage_ledger`, `account_entitlements`, `plans`, `search_logs` (`src/lib/db/schema.ts`).
- Processing state progression:
  - Episode: `queued -> processing -> completed|failed`.
  - Job: `queued|processing -> completed|completed_with_errors|dispatch_failed`.
  - Podcast: `idle|queued|processing -> ready|ready_with_errors|dispatch_failed`.

## Primary Data Flows
### Import + processing
1. `POST /api/podcasts/import` validates and calls `startImportFromFeed` (`src/app/api/podcasts/import/route.ts`, `src/lib/services/import-service.ts`).
2. Service parses RSS, reserves units, inserts queued episodes/job, dispatches `podcast/import.requested` (`src/lib/services/import-service.ts`).
3. Inngest import function fans out episode events (`src/inngest/functions.ts`).
4. Episode worker runs `processEpisodePipeline` (`src/inngest/functions.ts`, `src/lib/pipeline/process-episode.ts`).
5. Pipeline performs audio fetch/blob upload, Deepgram transcript, chunking, embeddings, Pinecone upsert, transcript row replace, status updates.

### Search
1. `POST /api/search` validates ownership and embeds query (`src/app/api/search/route.ts`).
2. Queries Pinecone namespace `user_<clerkUserId>` with `podcastId` filter (`src/lib/vector/pinecone.ts`).
3. Dedupes temporal overlaps and logs query metrics in `search_logs`.

## Integration Boundaries
- Auth: Clerk (`src/middleware.ts`, `src/lib/auth/session.ts`).
- Workflow engine: Inngest (`src/inngest/client.ts`, `src/inngest/functions.ts`).
- Database: Neon/Postgres + Drizzle (`src/lib/db/client.ts`, `drizzle.config.ts`, `drizzle/*.sql`).
- AI/transcription: Vercel AI Gateway embeddings + Deepgram transcription (`src/lib/vector/embeddings.ts`, `src/lib/transcription/deepgram.ts`).
- File storage: Vercel Blob for temporary audio and VTT assets (`src/lib/storage/audio.ts`, `src/lib/storage/transcript.ts`).
- Vector index: Pinecone (`src/lib/vector/pinecone.ts`).

## Cross-Cutting Concerns
- Validation: Zod schemas in route layer (`src/lib/validation/common.ts`).
- Error shape: shared JSON helpers (`src/lib/http.ts`).
- Config safety: env parsing + required value checks (`src/lib/config.ts`).
- Authorization model: ownership checks done in query predicates (`eq(...clerkUserId...)`) across service/read paths.

## Architectural Notes
- Strength: clear separation between HTTP handlers and orchestration services, with reusable domain modules.
- Strength: long-running ingestion is decoupled from request lifecycle through event fan-out.
- Tradeoff: service layer contains direct DB operations and external calls in same modules (pragmatic, but can increase change surface in `src/lib/services/import-service.ts` and `src/lib/pipeline/process-episode.ts`).
