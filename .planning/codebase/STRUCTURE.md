# Structure

## Repository Layout
- `src/`: application source.
- `drizzle/`: SQL migrations and Drizzle metadata snapshots.
- `test/`: Vitest suite for route/unit helpers.
- `docs/`: product/technical narrative docs.
- Root config: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `drizzle.config.ts`.

## Source Tree (`src/`)
### App router and pages
- `src/app/layout.tsx`: root HTML/auth wrapper.
- `src/app/page.tsx`: public landing and signed-in redirect.
- `src/app/(app)/layout.tsx`: authenticated shell loader.
- Feature pages:
  - `src/app/(app)/dashboard/page.tsx`
  - `src/app/(app)/search/page.tsx`
  - `src/app/(app)/onboarding/page.tsx`
  - `src/app/(app)/podcasts/[podcastId]/page.tsx`
  - `src/app/(app)/podcasts/[podcastId]/episodes/[episodeId]/page.tsx`
  - `src/app/(app)/admin/page.tsx`
  - `src/app/(app)/analytics/page.tsx`
- Auth routes:
  - `src/app/sign-in/[[...sign-in]]/page.tsx`
  - `src/app/sign-up/[[...sign-up]]/page.tsx`

### API routes (`src/app/api`)
- Import + queue control:
  - `src/app/api/podcasts/import/preview/route.ts`
  - `src/app/api/podcasts/import/route.ts`
  - `src/app/api/podcasts/[podcastId]/resync/route.ts`
  - `src/app/api/podcasts/[podcastId]/retry-queue/route.ts`
- Podcast reads/mutation:
  - `src/app/api/podcasts/route.ts`
  - `src/app/api/podcasts/[podcastId]/route.ts` (delete)
  - `src/app/api/podcasts/[podcastId]/status/route.ts`
  - `src/app/api/podcasts/[podcastId]/episodes/route.ts`
- Search:
  - `src/app/api/search/route.ts`
- Transcript exports:
  - `src/app/api/podcasts/[podcastId]/transcripts/download/route.ts`
  - `src/app/api/podcasts/[podcastId]/episodes/[episodeId]/transcript/download/route.ts`
- Account/admin:
  - `src/app/api/account/entitlements/route.ts`
  - `src/app/api/admin/entitlements/adjust/route.ts`
- Workflow webhook:
  - `src/app/api/inngest/route.ts`

### UI components
- Shell and feature components in `src/components/`:
  - `app-shell.tsx`, `dashboard-home.tsx`, `rss-import-form.tsx`, `search-panel.tsx`, `podcast-episodes-board.tsx`, `episode-detail-board.tsx`, `admin-entitlements-form.tsx`.
- Design primitives in `src/components/ui/` (button, card, input, checkbox, badge, etc.).

### Domain and infrastructure modules (`src/lib/`)
- `auth/`: session guard (`src/lib/auth/session.ts`).
- `db/`: schema, client, bootstrap (`src/lib/db/schema.ts`, `src/lib/db/client.ts`, `src/lib/db/bootstrap.ts`).
- `services/`: application orchestration:
  - `import-service.ts`
  - `podcast-reader.ts`
  - `podcast-management.ts`
  - `transcript-export.ts`
- `pipeline/`: episode worker pipeline (`process-episode.ts`).
- `entitlements/`: quota policy + ledger operations (`policy.ts`, `service.ts`).
- `rss/`: feed parsing (`parse-feed.ts`).
- `transcription/`: Deepgram + caption utilities (`deepgram.ts`, `captions.ts`).
- `chunking/`: transcript chunk builder (`transcript-chunker.ts`).
- `vector/`: embeddings + Pinecone adapters (`embeddings.ts`, `pinecone.ts`).
- `storage/`: blob persistence helpers (`audio.ts`, `transcript.ts`).
- `ui/`: typed UI payloads and table/header helpers (`app-shell-config.ts`, `dashboard-overview.ts`, `dashboard-table.ts`).
- Shared utilities and contracts: `config.ts`, `http.ts`, `validation/common.ts`, `utils.ts`.

### Workflow functions
- `src/inngest/client.ts`: Inngest client initialization.
- `src/inngest/functions.ts`: import fan-out + per-episode processing functions.

### Middleware
- `src/middleware.ts`: Clerk protection policy and public route exceptions.

## Data and Migration Files
- Drizzle schema definition: `src/lib/db/schema.ts`.
- Migration config: `drizzle.config.ts`.
- SQL migrations: `drizzle/0000_hesitant_mockingbird.sql` ... `drizzle/0006_podcast_author_category.sql`.
- Snapshot metadata: `drizzle/meta/*.json`, `drizzle/meta/_journal.json`.

## Tests
- Framework and alias config: `vitest.config.ts`.
- Test files under `test/`:
  - `test/podcast-import-routes.test.ts` (route contract + mocking)
  - `test/entitlements-policy.test.ts` (quota policy invariants)
  - `test/chunking.test.ts` (chunking behavior)
  - `test/dashboard-table.test.ts` (UI data helpers)
  - `test/app-shell-config.test.ts` (route-to-header/nav rules)

## Configuration Surface
- Runtime env parsing and required secrets: `src/lib/config.ts`.
- Frontend build and TS paths: `next.config.ts`, `tsconfig.json`.
- Styling system: `tailwind.config.ts`, `src/app/globals.css`.
- Package scripts for lifecycle:
  - `npm run dev|build|start`
  - `npm run test|typecheck|lint`
  - `npm run db:generate|db:push`

## Structural Conventions
- Import alias `@/` maps to `src/` (`tsconfig.json`, `vitest.config.ts`).
- Route handlers stay thin and delegate to service/domain modules.
- DB ownership checks are colocated with queries in service/read modules.
- API responses standardize through `ok`/`fail` helpers in `src/lib/http.ts`.
