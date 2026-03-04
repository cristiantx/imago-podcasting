# Podcast Intelligence SaaS Stack Research (2026)

## Scope and Decision Rule
This stack is for the **next milestone** after core ingestion/transcription/vector search. It follows `PROJECT.md` constraints: keep the existing architecture shape (Next.js + TypeScript + Postgres + Inngest + Deepgram + vector search) and optimize for SaaS reliability, citation trust, and multi-feed scale.

Inference from project context: the right move is **targeted upgrades + operational hardening**, not stack churn.

## Standard Stack (2026 Recommendation)

| Layer | Choice (Prescriptive) | Rationale | Confidence |
|---|---|---|---|
| Web framework | **Next.js 16.x** (App Router) + **React 19.2** | Next.js 16 is current stable and on active support track; React 19.2 is current stable release line. | **High** |
| Runtime | **Node.js 24 LTS** for production; keep CI matrix with Node 22 LTS during transition | Node 24 is Active LTS in 2026; Node 22 is still maintenance LTS, useful for compatibility checks during rollout. | **High** |
| Language | **TypeScript 5.9.x** (strict), defer TS 6 until framework/toolchain green | TS 5.9 is stable now; TS 6 is in beta phase and should not be baseline for SaaS prod yet. | **High** |
| Primary data store | **PostgreSQL 18.x** (managed), upgrade target **18.3+** | PG18 is current major line with meaningful planner/I/O improvements and current patch stream. | **High** |
| ORM / schema | **Drizzle ORM + postgres-js** (keep) | Already integrated in codebase; minimizing ORM churn reduces migration risk this milestone. | **High** |
| Workflow orchestration | **Inngest** durable functions (`step.run`, retries, concurrency keys, cancelation signals) | Fits long-running feed/audio/transcription/indexing workflows and keeps request path clean. | **High** |
| Speech-to-text | **Deepgram Nova-3** as default batch transcription model | Existing integration + active model updates in 2026 (language coverage expanding). | **Medium-High** |
| Embeddings | **OpenAI `text-embedding-3-small`** default; `text-embedding-3-large` for quality-critical reindex jobs | Cost/quality tiering is explicit in current OpenAI pricing; supports cost control by workload class. | **High** |
| Vector search | **Pinecone serverless indexes** with **namespace-per-workspace** + metadata filters (`workspaceId`, `feedId`, `episodeId`) | Pinecone’s serverless multitenancy guidance aligns with SaaS tenant isolation and scaling patterns. | **High** |
| Retrieval strategy | **Hybrid-ready retrieval** (dense now, optional sparse/hybrid for lexical lift) | Pinecone index model supports dense/sparse/hybrid; keeps roadmap open for citation precision tuning. | **Medium-High** |
| Blob/artifact storage | **Vercel Blob** (current) unless compliance/egress constraints force S3/R2 move | Already integrated; avoids storage migration during reliability-focused milestone. | **Medium-High** |

## Implementation Notes for This Milestone
- Keep transactional truth in Postgres and vectors in Pinecone.
- Keep async orchestration in Inngest; do not move long jobs into request/response paths.
- Enforce tenant isolation in **both** SQL predicates and vector query filters.
- Separate embedding lanes:
  - `search-ingest-default`: fast/cost-aware (`text-embedding-3-small`)
  - `quality-reindex`: higher quality (`text-embedding-3-large`) for selective backfills
- Pin versions by major/minor policy and re-validate quarterly (framework + runtime + DB + model APIs).

## What Not To Use (2026)

| Avoid | Why |
|---|---|
| Next.js canary builds in production | Official policy says canary is for testing only; production support is for stable channels. |
| Next.js < 15 for this codebase | Unsupported by current Next.js support policy. |
| Non-LTS Node in production | Higher operational churn and shorter support windows for a SaaS workload. |
| Pinecone pod-based indexes for greenfield accounts | Pinecone disabled pod index create/manage for accounts created on/after 2025-08-18. |
| Single global namespace across tenants | Conflicts with Pinecone multitenancy guidance; weak isolation and harder cost attribution. |
| Relying on Inngest concurrency as time-window rate limiting | Inngest docs explicitly note concurrency is not period rate limiting. Use explicit budget/rate controls. |
| Pinecone integrated-embedding indexes for mutable transcript corpora | Current limitations: text update/import constraints increase operational friction for frequent transcript corrections/reprocessing. |
| Re-platforming ORM/vector DB in same milestone | Inference: this milestone’s bottleneck is reliability + search trust, not data-layer replacement. |

## Confidence Breakdown
- **High**: Next.js 16, React 19.2, Node 24 LTS, Postgres 18.x, Inngest orchestration, Pinecone serverless namespaces.
- **Medium-High**: Deepgram Nova-3 default, hybrid retrieval timing, staying on Vercel Blob this milestone.
- **Lower confidence areas (watchlist)**:
  - Rapid model pricing/performance shifts (LLM + embeddings) can change preferred defaults.
  - Retrieval quality may require sparse/hybrid sooner than expected depending on citation precision metrics.

## Sources (Checked 2026-03-04)
- Next.js support policy: https://nextjs.org/support-policy
- Next.js latest docs/version header: https://nextjs.org/docs
- React 19.2 release: https://react.dev/blog/2025/10/01/react-19-2
- TypeScript 5.9 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/
- TypeScript 6.0 beta announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-6-beta/
- Node.js releases schedule: https://nodejs.org/en/about/previous-releases
- PostgreSQL 18 release notes: https://www.postgresql.org/about/news/postgresql-18-released-3142/
- PostgreSQL current versions: https://www.postgresql.org/support/versioning/
- Inngest reliability/durable execution docs: https://www.inngest.com/docs/features/inngest-functions/reliability-and-debouncing
- Inngest concurrency docs: https://www.inngest.com/docs/features/inngest-functions/concurrency
- Deepgram changelog (Nova-3 updates): https://developers.deepgram.com/changelog
- Pinecone multitenancy guidance: https://docs.pinecone.io/guides/indexes/implement-multitenancy
- Pinecone pod deprecation timeline: https://docs.pinecone.io/reference/api/2025-01/control-plane/create_index
- Pinecone integrated embedding limitations: https://docs.pinecone.io/guides/data/upsert-data
- OpenAI pricing and embeddings: https://openai.com/api/pricing/
