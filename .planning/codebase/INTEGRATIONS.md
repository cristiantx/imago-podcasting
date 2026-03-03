# Integrations

## External Services Matrix
| Integration | Purpose | Code Touchpoints | Config |
| --- | --- | --- | --- |
| Clerk | Authentication/session identity | `src/app/layout.tsx`, `src/lib/auth/session.ts`, `src/middleware.ts` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (`src/lib/config.ts`) |
| Postgres (Neon-style) | System of record for app state and transcripts | `src/lib/db/client.ts`, `src/lib/db/schema.ts`, `drizzle.config.ts` | `DATABASE_URL` |
| Inngest | Async orchestration for import/episode processing | `src/inngest/client.ts`, `src/inngest/functions.ts`, `src/app/api/inngest/route.ts`, `src/lib/services/import-service.ts` | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `INNGEST_SERVE_ORIGIN`, `INNGEST_BASE_URL` |
| Deepgram | Audio transcription with diarization | `src/lib/transcription/deepgram.ts`, `src/lib/pipeline/process-episode.ts` | `DEEPGRAM_API_KEY` |
| Vercel AI Gateway | Embedding generation for chunks and queries | `src/lib/vector/embeddings.ts`, `src/lib/pipeline/process-episode.ts`, `src/app/api/search/route.ts` | `AI_GATEWAY_API_KEY` |
| Pinecone | Vector storage/query per-user namespace | `src/lib/vector/pinecone.ts`, `src/lib/pipeline/process-episode.ts`, `src/app/api/search/route.ts`, `src/lib/services/podcast-management.ts` | `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` |
| Vercel Blob | Temporary audio storage and transcript VTT storage | `src/lib/storage/audio.ts`, `src/lib/storage/transcript.ts`, `src/lib/pipeline/process-episode.ts`, `src/lib/services/transcript-export.ts` | `BLOB_READ_WRITE_TOKEN` |
| RSS feeds (public) | Podcast metadata/episode source ingestion | `src/lib/rss/parse-feed.ts`, `src/lib/services/import-service.ts` | request payload `rssUrl` |

## Internal Integration Topology
1. UI clients call Next API routes via `fetch`.
2. API routes call service modules in `src/lib/services/*`.
3. Services coordinate DB + external systems (Inngest, Deepgram, Blob, Pinecone, AI Gateway).
4. Background handlers in Inngest execute the heavy episode pipeline.

Primary evidence:
- UI fetch usage: `src/components/rss-import-form.tsx`, `src/components/search-panel.tsx`, `src/components/podcast-episodes-board.tsx`, `src/components/entitlement-panel.tsx`.
- API layer: `src/app/api/**/route.ts`.
- Service layer: `src/lib/services/import-service.ts`, `src/lib/services/podcast-reader.ts`, `src/lib/services/transcript-export.ts`, `src/lib/services/podcast-management.ts`.

## Route-to-Service Integration Map
| Route | Service / Integration Chain |
| --- | --- |
| `POST /api/podcasts/import/preview` (`src/app/api/podcasts/import/preview/route.ts`) | `previewImportFromFeed` -> RSS parse + entitlement policy (`src/lib/services/import-service.ts`) |
| `POST /api/podcasts/import` (`src/app/api/podcasts/import/route.ts`) | `startImportFromFeed` -> DB upsert/reservation -> Inngest dispatch (`src/lib/services/import-service.ts`) |
| `POST /api/podcasts/:id/resync` (`src/app/api/podcasts/[podcastId]/resync/route.ts`) | `startResyncForPodcast` -> import service |
| `POST /api/podcasts/:id/retry-queue` (`src/app/api/podcasts/[podcastId]/retry-queue/route.ts`) | `retryQueueDispatchForPodcast` -> Inngest re-dispatch |
| `POST /api/search` (`src/app/api/search/route.ts`) | embed query -> Pinecone query -> DB search log insert |
| `GET /api/account/entitlements` (`src/app/api/account/entitlements/route.ts`) | entitlement snapshot from DB policy service |
| `POST /api/admin/entitlements/adjust` (`src/app/api/admin/entitlements/adjust/route.ts`) | admin-key gated entitlement mutation |
| `GET /api/podcasts/:id/transcripts/download` (`src/app/api/podcasts/[podcastId]/transcripts/download/route.ts`) | transcript aggregation/export |
| `GET /api/podcasts/:id/episodes/:episodeId/transcript/download` (`src/app/api/podcasts/[podcastId]/episodes/[episodeId]/transcript/download/route.ts`) | VTT retrieval/regeneration/export |

## Background Workflow Integrations (Inngest)
| Function | Trigger | Downstream Integrations |
| --- | --- | --- |
| `podcast-import-requested` (`src/inngest/functions.ts`) | `podcast/import.requested` event | DB job state updates + fan-out `podcast/episode.process.requested` |
| `podcast-episode-process-requested` (`src/inngest/functions.ts`) | per-episode event | `processEpisodePipeline` |
| `processEpisodePipeline` (`src/lib/pipeline/process-episode.ts`) | called from Inngest step | Blob download/upload, Deepgram transcription, chunking, AI Gateway embeddings, Pinecone upsert, DB transcript persistence, Blob cleanup, entitlement consumption/release |

## Security and Boundary Notes
- Middleware exposes `/api/inngest` publicly for webhook execution while protecting other routes (`src/middleware.ts`).
- Route auth for user actions is centralized via `requireUser()` (`src/lib/auth/session.ts`).
- Admin entitlement mutation uses `x-admin-key` and `ADMIN_API_KEY` (`src/app/api/admin/entitlements/adjust/route.ts`, `src/lib/config.ts`).
- External credentials are validated through `requireEnvValue` (`src/lib/config.ts`).
