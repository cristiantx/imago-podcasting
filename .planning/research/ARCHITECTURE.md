# Architecture Proposal: Podcast Intelligence SaaS

## Purpose
Define a production-ready architecture for the next milestone that evolves Imago from transcript search into a multi-tenant podcast intelligence platform with reliable ingestion, answer-with-citations retrieval, and episode-level concept/topic insights.

## Scope Alignment (from PROJECT.md)
- Preserve existing stack: Next.js 15 + TypeScript + Postgres/Drizzle + Inngest + Deepgram + Pinecone + Vercel Blob.
- Prioritize:
  - Answer + citation search UX.
  - Multi-feed knowledge base management.
  - Reliable auto-sync ingestion at SaaS scale.
  - Concept/topic insights generated from transcripts.
- Keep out-of-scope: advanced attribution analytics and full copilot workflows.

## Architectural Principles
- Multi-tenant first: all domain data keyed by workspace and enforced at API/data layers.
- Asynchronous by default: long-running media and NLP work runs through durable event-driven pipelines.
- Idempotent processing: every external job (RSS, transcription, embedding, insight extraction) must be safely retryable.
- Traceable outputs: every answer and insight must link to episode/timestamp/source segments.
- Quality gates before scale: reliability and security controls are foundational, not follow-up work.

## Component Boundaries

| Component | Responsibility | Owns Data | Interfaces |
|---|---|---|---|
| Web App (Next.js UI) | Workspace/feed setup, search UI, insights UI, usage/admin pages | UI/session state only | Server Actions/API routes |
| API/Application Layer | Authorization, tenant scoping, orchestration commands, response shaping (answers+citations) | Business DTOs, request audit logs | HTTP/internal service calls |
| Identity & Entitlements | Authentication, workspace membership, plan limits, quota checks | users, workspaces, memberships, plans, usage counters | Called by API + workflow guards |
| Feed Registry Service | Manage feed configs per workspace; schedule backfill and sync intents | podcasts, feed_configs, sync_cursor, import_runs | Invoked by UI/API; emits ingest jobs |
| Ingestion Workflow (Inngest) | Fetch RSS, diff episodes, upsert metadata, enqueue media/transcription tasks | episode ingest state, dedupe keys, failure reasons | Triggered by schedule + feed events |
| Media & Transcript Pipeline | Audio fetch/storage, transcription, normalization, segmenting | audio blobs, transcripts, transcript_segments, transcript_job_runs | Consumes ingest jobs; emits indexing/insight jobs |
| Retrieval Indexing Service | Generate embeddings and maintain vector index references | segment embeddings metadata, vector ids, index status | Consumes transcript segment events |
| Search & Answer Service | Query rewrite/retrieval, rerank, answer synthesis, citation assembly | query logs, result traces, answer artifacts | Called synchronously by search endpoint |
| Insights Extraction Service | Derive concepts/topics per episode and workspace aggregate summaries | episode_insights, concept_catalog, topic_edges, extraction runs | Consumes transcript-complete events |
| Observability & Reliability Layer | Workflow metrics, DLQs, retry dashboards, alerts, audit trails | job metrics, error events, SLA counters | Cross-cutting across all services |

## Data Model Boundaries (High-Level)
- Tenant/Auth domain:
  - `users`, `workspaces`, `workspace_members`, `api_keys` (optional), `plans`, `usage_events`.
- Content graph domain:
  - `podcasts`, `feeds`, `episodes`, `episode_assets`, `transcripts`, `transcript_segments`.
- Processing domain:
  - `ingest_runs`, `workflow_events`, `job_attempts`, `idempotency_keys`, `sync_cursors`.
- Intelligence domain:
  - `segment_embeddings`, `search_queries`, `search_answers`, `search_citations`, `episode_concepts`, `episode_topics`, `concept_relationships`.

Boundary rule: keep transactional truth in Postgres; keep semantic vectors in Pinecone; keep large binary/audio artifacts in Blob storage.

## End-to-End Data Flow

### 1. Feed onboarding and backfill
1. User adds RSS feed to a workspace.
2. API validates workspace entitlement + feed ownership policy.
3. Feed Registry creates feed config and emits `feed.backfill.requested` event.
4. Ingestion Workflow fetches RSS, diffs by stable GUID/URL+published date, upserts episodes.
5. For each new episode, emit `episode.process.requested` with idempotency key.

### 2. Episode processing pipeline
1. Media pipeline fetches audio and stores canonical asset metadata.
2. Transcription job runs (Deepgram), stores transcript, normalizes text, builds timestamped segments.
3. Emit `transcript.ready` event.
4. Retrieval Indexing service embeds segments and upserts vectors in Pinecone.
5. Insights Extraction service derives episode concepts/topics and stores scored entities + evidence segment references.
6. Episode status transitions to `ready` only after transcript + vector index minimum completeness checks.

### 3. Continuous sync
1. Scheduled Inngest job triggers `feed.sync.requested` per active feed.
2. Sync compares latest cursor/checksum to avoid full reprocessing.
3. New/changed episodes pass through same pipeline; unchanged episodes are skipped.
4. Failures are retried with backoff; poison jobs move to DLQ state with operator-visible diagnostics.

### 4. Search with answer + citations
1. User submits query scoped to workspace (and optional feed filters).
2. Search service performs semantic retrieval over segment vectors + metadata constraints.
3. Retrieved segments are reranked, deduplicated, and grouped by episode/time windows.
4. Answer synthesis returns concise response plus citation objects (`episode`, `timestamp_start/end`, `quote/segment_id`, `confidence`).
5. Query and trace are logged for quality evaluation and usage accounting.

## Reliability and Security Controls
- Reliability:
  - Idempotency key on every workflow stage.
  - Explicit state machine for episode lifecycle (`discovered -> queued -> transcribed -> indexed -> insighted -> ready`).
  - Dead-letter queues and retry budgets per job type.
  - Back-pressure controls for transcription and embedding concurrency.
- Security:
  - Strict tenant scoping in every DB query and vector metadata filter.
  - SSRF-hardened RSS/audio fetchers (allowlist/egress protections, URL validation).
  - Webhook verification and replay protection.
  - Audit logging for admin-sensitive operations (feed deletion, workspace export).

## Suggested Build Order

### Phase 1: Foundation hardening (must do first)
- Formalize tenant boundaries and authorization checks across API and jobs.
- Add episode/job state machine + idempotency and retry semantics.
- Introduce workflow observability tables/dashboards.

### Phase 2: Multi-feed workspace model
- Implement first-class workspace feed registry and feed management UX.
- Add sync cursors and feed-level health/status indicators.
- Validate entitlement limits (feeds, episodes/month, search volume).

### Phase 3: Search answer + citation contract
- Define canonical answer response schema with citations.
- Add retrieval+rerank trace logging and quality evaluation hooks.
- Ship UI that renders answer and source jumps to episode timestamps.

### Phase 4: Insights extraction pipeline
- Implement concept/topic extraction worker over transcript-ready events.
- Store evidence-linked insights and expose episode insights UI/API.
- Add reprocessing controls for prompt/model version changes.

### Phase 5: SaaS reliability at scale
- Tighten autosync scheduling strategy and concurrency controls.
- Add DLQ triage workflows and operator tooling.
- Establish SLOs for ingestion freshness and search latency.

### Phase 6: Intelligence graph evolution (next milestone extension)
- Build cross-episode concept linking and relationship graph queries.
- Add workspace-level topic trend summaries.
- Prepare hooks for deferred analytics use cases.

## Implementation Notes for Current Codebase
- Keep orchestration in Inngest; avoid moving long-running work into request cycle.
- Keep Drizzle migrations as source of truth for state-machine and intelligence tables.
- Use Pinecone metadata filters that always include `workspaceId` and `episodeId`.
- Version insight extraction outputs (`extractor_version`) to support re-runs and A/B quality checks.

## Delivery Risks to Track Early
- Transcript quality variability affects both search and insights quality.
- Feed heterogeneity (invalid XML, missing GUIDs, moving media URLs) can break naive sync assumptions.
- Vector cost/latency growth without segment size and retention policies.
- Citation trust can degrade if answer synthesis is not constrained to retrieved evidence.

## Definition of Done for this Architecture Direction
- New feed-to-ready pipeline is idempotent, observable, and tenant-safe.
- Search endpoint returns answer with structured citations in production.
- Episode-level concepts/topics are generated and displayed with evidence links.
- Autosync runs continuously with actionable failure visibility.
