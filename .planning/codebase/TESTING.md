# Testing (Quality Focus)

## Current Test Stack
- Test runner: Vitest (`vitest.config.ts`).
- Environment: Node (`test.environment = "node"` in `vitest.config.ts`).
- Alias support for `@` paths is mirrored in tests (`vitest.config.ts`).
- Main command: `npm test` -> `vitest run` (`package.json`).

## Current Suite Status
- Last local run: `npm test` on 2026-03-03.
- Result: 5 test files, 19 tests, all passing.
- Runtime was fast (<1s), enabling frequent local execution.

## Test Inventory (Concrete Files)
- `test/podcast-import-routes.test.ts`
  - Covers API route behavior for:
    - `src/app/api/podcasts/import/route.ts`
    - `src/app/api/podcasts/import/preview/route.ts`
  - Uses `vi.mock(...)` for `@/lib/auth/session` and `@/lib/services/import-service`.
- `test/entitlements-policy.test.ts`
  - Covers pure policy logic in `src/lib/entitlements/policy.ts`.
- `test/app-shell-config.test.ts`
  - Covers route/header/navigation helpers in `src/lib/ui/app-shell-config.ts`.
- `test/chunking.test.ts`
  - Covers transcript chunking behavior in `src/lib/chunking/transcript-chunker.ts`.
- `test/dashboard-table.test.ts`
  - Covers filtering, pagination, CSV escaping in `src/lib/ui/dashboard-table.ts`.

## Testing Conventions Observed
- Files follow `*.test.ts` naming in top-level `test/`.
- Tests use clear behavior-oriented `describe`/`it` naming (for example "returns 409 when import is requested for an existing feed").
- Route tests call exported handlers directly with `new Request(...)` instead of spinning up Next server infra (`test/podcast-import-routes.test.ts`).
- Mocking is explicit and typed via `vi.mocked(...)`.
- Assertions focus on externally visible contract: HTTP status, payload shape, and helper outputs.

## Coverage Shape
- Strongest coverage:
  - Deterministic pure functions (`src/lib/entitlements/policy.ts`, `src/lib/ui/*`, `src/lib/chunking/transcript-chunker.ts`).
  - Selected API contracts for podcast import routes.
- Limited coverage:
  - Most API routes under `src/app/api/**` are untested (15 routes exist; only import/preview routes are covered in tests).
  - Core orchestration and side-effect-heavy services are largely untested:
    - `src/lib/services/import-service.ts`
    - `src/lib/pipeline/process-episode.ts`
    - `src/lib/services/podcast-management.ts`
    - `src/lib/services/podcast-reader.ts`
    - `src/lib/services/transcript-export.ts`
  - External adapters are untested:
    - `src/lib/vector/embeddings.ts`
    - `src/lib/transcription/deepgram.ts`
    - `src/lib/vector/pinecone.ts`
    - `src/lib/storage/audio.ts`
    - `src/lib/storage/transcript.ts`

## Missing Quality Signals
- No coverage thresholds configured (`vitest.config.ts` has no `coverage` block).
- No `setupFiles`/global fixtures configured in Vitest; each file owns setup.
- No dedicated integration/e2e suite for full ingest/search flows (no Playwright/Cypress config present).
- No CI workflow directory found (`.github/workflows/*` absent), so continuous automated test enforcement is not visible in-repo.

## High-Value Next Tests
1. Add route contract tests for remaining critical endpoints:
   - `src/app/api/search/route.ts`
   - `src/app/api/podcasts/[podcastId]/status/route.ts`
   - `src/app/api/podcasts/[podcastId]/retry-queue/route.ts`
2. Add service-level tests for import orchestration edge cases in `src/lib/services/import-service.ts` (reservation release, dispatch failure, duplicate episodes).
3. Add failure-path tests for `src/lib/pipeline/process-episode.ts` (transcription failure, cleanup behavior, usage release).
4. Add adapter contract tests for external APIs with mocked `fetch` (`src/lib/vector/embeddings.ts`, `src/lib/transcription/deepgram.ts`).
5. Enable and enforce coverage reporting in `vitest.config.ts` and CI.
