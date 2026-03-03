# Conventions (Quality Focus)

## Tooling Baseline
- Runtime/build stack is Next.js + TypeScript with ESM (`package.json`, `tsconfig.json`).
- Quality gates are script-driven: `npm run lint`, `npm run typecheck`, `npm test` (`package.json`).
- TypeScript strict mode is enabled (`tsconfig.json` uses `"strict": true` and `"noEmit": true`).
- Module alias `@/* -> ./src/*` is used across app, lib, and tests (`tsconfig.json`, `vitest.config.ts`).

## Project Structure and Naming
- App Router layout with route groups and dynamic segments under `src/app/(app)` and `src/app/api/**/route.ts`.
- Domain logic is pushed into `src/lib/*` (for example `src/lib/services/import-service.ts`, `src/lib/entitlements/service.ts`) and routes remain thin.
- Component files are kebab-case (`src/components/rss-import-form.tsx`, `src/components/episode-detail-board.tsx`).
- Utility modules follow domain folders plus descriptive filenames (`src/lib/ui/dashboard-table.ts`, `src/lib/chunking/transcript-chunker.ts`).

## API Handler Conventions
- Route handlers consistently export HTTP verb functions (`GET`, `POST`, `DELETE`) in `route.ts` files (for example `src/app/api/podcasts/import/route.ts`).
- Common response helpers are centralized: `ok()` and `fail()` in `src/lib/http.ts`.
- Most handlers follow this flow:
  1. `requireUser()` auth guard (`src/lib/auth/session.ts`).
  2. Zod parse of body or params (`src/lib/validation/common.ts` + local `bodySchema`).
  3. Delegate to service layer in `src/lib/services/*`.
  4. Catch error and map to status code with `fail(...)`.
- Dynamic params are validated explicitly (`src/app/api/podcasts/[podcastId]/episodes/route.ts`, `src/app/api/podcasts/[podcastId]/episodes/[episodeId]/transcript/download/route.ts`).

## Validation and Configuration
- Zod is the standard validation layer for request schemas and env parsing (`src/lib/validation/common.ts`, `src/lib/config.ts`).
- Environment access is centralized through `getEnv()` and `requireEnvValue()` (`src/lib/config.ts`), avoiding direct scattered `process.env` reads.

## Data and Service Patterns
- Drizzle ORM is used with schema-first tables in `src/lib/db/schema.ts`.
- DB client is singleton-cached for dev hot reload via `globalThis` (`src/lib/db/client.ts`).
- Business workflows are service-centric and orchestrate DB + external systems (for example `startImportFromFeed()` and queue dispatch handling in `src/lib/services/import-service.ts`).
- Critical flows use transaction boundaries in entitlement operations (`src/lib/entitlements/service.ts`).

## UI and Styling Conventions
- UI composition combines custom app components and shadcn-style primitives under `src/components/ui/*`.
- Class composition uses `cn()` helper (`src/lib/utils.ts`) and variant-driven components (`src/components/ui/button.tsx` with `cva`).
- Tailwind utility-first styling is dominant in app screens/components (`src/components/app-shell.tsx`, `src/app/globals.css`).

## Error Handling and Observability Conventions
- Error handling is exception-based in services and normalized in routes via `fail(...)`.
- Authorization convention is `requireUser()` throwing `"Unauthorized"` and handlers mapping that to HTTP 401.
- External API failures are wrapped with explicit error context (`src/lib/vector/embeddings.ts`, `src/lib/transcription/deepgram.ts`).

## Quality Risks / Inconsistencies
- `any` is still present in transaction helper typing (`src/lib/entitlements/service.ts`), weakening strict typing in a critical path.
- A stray `console.log();` exists in production code (`src/lib/transcription/deepgram.ts`).
- Formatting style is mostly consistent (double quotes, semicolons, alias imports), but some files show different comma formatting, suggesting no single enforced formatter config file (`.prettierrc*`/`prettier.config.*` not present).
