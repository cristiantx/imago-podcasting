# Imago Podcasting Technical Decisions

This document captures the key technical decisions agreed during implementation, including the main question that triggered each decision and the chosen outcome.

## Decision Log

| ID | Date | Question | Decision | Why |
| --- | --- | --- | --- | --- |
| TD-001 | 2026-02-27 | Should ingestion be fixed to 50 episodes? | Episode limits are entitlement-driven (`plan base quota + extra credits`) and configurable from DB. | Product needed free/premium flexibility without code changes. |
| TD-002 | 2026-02-27 | What is default free allowance? | Free plan defaults to `5` episodes (`plans.base_episode_quota = 5`). | Keeps MVP cost controlled while preserving upgrade path. |
| TD-003 | 2026-02-27 | Should we hardcode product limits at all? | No business hardcode; only operational guardrail via `ABSOLUTE_EPISODE_SAFETY_CAP` env var. | Safety for runaway jobs without coupling product policy to code. |
| TD-004 | 2026-02-27 | How should background processing run? | Inngest event workflows with fan-out per episode and retry/backoff. | Durable async processing and clearer status tracking than request-time processing. |
| TD-005 | 2026-02-27 | How should transcription work? | Deepgram URL transcription with speaker diarization and utterances. | Needed speaker-aware transcript segments for better search UX. |
| TD-006 | 2026-02-27 | Which vector stack should we use? | App-generated embeddings + Pinecone vector index. | Gives predictable model control and podcast-level filtering. |
| TD-007 | 2026-03-02 | Why `OPENAI_API_KEY` / can Pinecone embed directly? | Replaced direct OpenAI key usage with Vercel AI Gateway (`AI_GATEWAY_API_KEY`, model `openai/text-embedding-3-small`). | Centralized provider routing/observability and safer key management. |
| TD-008 | 2026-02-28 | If embeddings generation is removed, can we still query semantically? | No. Semantic query requires embedding both indexed chunks and user query text in compatible vector space. | Vector search depends on embedding vectors, not raw text equality. |
| TD-009 | 2026-02-28 | Are transcripts stored as text and downloadable? | Yes. Transcript chunks are stored in Postgres (`transcript_segments.text`) and export endpoints were added for podcast/episode download. | Required for auditability, download UX, and search result grounding. |
| TD-010 | 2026-02-28 | Should only files be stored instead of DB transcript text? | Keep searchable chunk text in DB for MVP; file-only storage is not enough for semantic retrieval/filters. | Query latency and product behavior rely on structured chunk rows. |
| TD-011 | 2026-02-28 | What is `ADMIN_API_KEY` for? | Protect internal admin entitlement-adjust endpoint (`/api/admin/entitlements/adjust`). | Prevents unauthorized quota/credit manipulation. |
| TD-012 | 2026-02-28 | What are `INNGEST_SERVE_ORIGIN` and `INNGEST_BASE_URL`? | `INNGEST_SERVE_ORIGIN` identifies serving origin for local/hosted handlers; `INNGEST_BASE_URL` points SDK/client calls to the Inngest API/base endpoint. | Needed to align local dev and deployed execution URLs. |
| TD-013 | 2026-02-28 | What if queue dispatch fails while API request succeeds? | Persist dispatch status/error on `ingest_jobs` and expose manual `retry-queue` API/UI action. | Gives operator recovery path for temporary outages. |
| TD-014 | 2026-02-28 | Should UX expose internal IDs directly? | No. Product UX moved to podcast/episode library views, statuses, and action-based flows (without raw IDs in primary UI). | Needed to make MVP user-ready rather than dev-oriented. |
| TD-015 | 2026-02-27 | Which UI approach should be used? | Tailwind CSS + shadcn/ui components with premium dashboard visual direction. | Matches desired speed + consistency + branded UI quality. |

## Decisions By Area

### Product Scope
- Public RSS only.
- English only.
- One feed in MVP UX, schema prepared for multiple feeds later.
- Manual re-sync only.
- Search only (no clip extraction yet).

### Entitlements and Usage
- Source of truth is database (`plans`, `account_entitlements`, `usage_ledger`).
- Import allowance formula:
  - `available = base_episode_quota + extra_episode_credits - consumed_units`
  - `allowed_for_job = min(requested, available, feedEpisodeCount, ABSOLUTE_EPISODE_SAFETY_CAP)`
- Consumption order:
  - Consume plan quota units first.
  - Consume credits after plan units are exhausted.
- Failed episodes release reserved usage units.

### Search and Transcript Data
- Transcript is persisted as chunk rows for retrieval and ranking context.
- Pinecone stores vectors + metadata for semantic lookup.
- Query path always embeds query text using the same embedding model family as indexing.
- Download endpoints expose transcript text for users.

### Reliability and Operations
- Ingestion is event-driven (Inngest), not synchronous API processing.
- Queue dispatch failures are tracked and recoverable through manual retry.
- Status surfaces include podcast, job, and episode-level processing state.

## Open Follow-ups (Post-MVP)

- Add live billing integrations for plan changes and credit purchases.
- Add optional transcript file archival strategy (object storage + retention policy).
- Add hybrid retrieval (keyword + vector) and optional reranking for long catalogs.
- Add pagination and multi-feed management in UI.

