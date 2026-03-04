# Podcast Intelligence SaaS Pitfalls (Subsequent Milestone)

## Purpose
This document identifies high-probability failure modes for the next Imago milestone and provides early warning signs, prevention strategies, and phase mapping to keep delivery and product outcomes on track.

## Proposed Phase Map (for this milestone)
- **P1 — Search Trust & Citation UX**: answer quality, citation accuracy, explainability
- **P2 — Multi-Feed Knowledge Base**: cross-feed retrieval and entity/topic normalization
- **P3 — Ingestion Reliability at SaaS Scale**: backfill + auto-sync resilience, retries, idempotency
- **P4 — Insight Extraction Quality**: concept/topic extraction correctness and drift control
- **P5 — Security, Privacy, and Tenant Isolation**: SSRF/webhook hardening, data exposure control
- **P6 — Cost & Unit Economics Controls**: entitlement integrity, per-workspace cost controls, abuse resistance
- **P7 — Observability, QA, and Release Safety**: instrumentation, eval harnesses, integration coverage, rollout controls

## Pitfall Matrix

### 1) Confident but wrong answers erode trust
- **Warning signs**
  - User reports “answer sounds right but source does not support it.”
  - High answer click-through but low return usage.
  - Citation spans repeatedly point to loosely related segments.
- **Prevention strategies**
  - Require answer generation from retrieved segments only (no free-form completion).
  - Add citation-level validation checks: timestamp bounds, segment-to-episode ownership, quote overlap threshold.
  - Ship confidence bands and “insufficient evidence” state as first-class output.
  - Track answer quality with human-labeled eval sets before major prompt/retrieval changes.
- **Phase mapping**: **P1**, **P7**

### 2) Citation UX is technically correct but unusable
- **Warning signs**
  - Citations exist but users cannot quickly verify claims.
  - Long unscannable evidence blocks with unclear episode context.
  - Support requests asking “where exactly is this said?”
- **Prevention strategies**
  - Standardize citation cards: show podcast, episode title, timestamp range, and direct jump action.
  - Limit answer length and enforce evidence snippets adjacent to claims.
  - Add UI tests for citation rendering and timestamp navigation.
- **Phase mapping**: **P1**, **P7**

### 3) Cross-feed retrieval collapses under topic/entity ambiguity
- **Warning signs**
  - Same person/topic split into multiple near-duplicate entities.
  - Query results cluster around one feed while ignoring relevant others.
  - Manual triage needed to merge obvious duplicates.
- **Prevention strategies**
  - Introduce canonical entity/topic IDs with alias tables.
  - Re-rank results with diversity constraints across feeds when intent is broad.
  - Add normalization jobs with deterministic merge rules and review queue.
- **Phase mapping**: **P2**, **P4**

### 4) Ingestion reliability degrades silently at volume
- **Warning signs**
  - Rising queued/failed episodes with no immediate alert.
  - Auto-sync lag increases beyond SLA windows.
  - Repeated transient provider outages become permanent failures.
- **Prevention strategies**
  - Add bounded retries + dead-letter handling for transient errors.
  - Enforce idempotency keys across import and episode processing events.
  - Add lag/error SLOs and page on breach (queue age, fail ratio, backlog growth).
  - Build replay tooling for failed windows with blast-radius constraints.
- **Phase mapping**: **P3**, **P7**

### 5) Duplicate imports and race conditions create fragmented truth
- **Warning signs**
  - Same feed appears multiple times per workspace.
  - Inconsistent episode/job state transitions under concurrent imports.
  - Support tickets for “missing” episodes that exist in parallel records.
- **Prevention strategies**
  - Add database uniqueness constraints for workspace/feed identity.
  - Replace check-then-insert with transactional upsert patterns.
  - Add concurrency tests for import endpoints and queue fan-out paths.
- **Phase mapping**: **P3**, **P6**, **P7**

### 6) Transcript/vector divergence causes stale or ghost retrievals
- **Warning signs**
  - Search returns episodes marked failed or deleted.
  - Vector counts drift from transcript segment counts.
  - Reindex jobs repeatedly “fix” the same records.
- **Prevention strategies**
  - Use two-phase write semantics with compensating cleanup on failure.
  - Add consistency audits (DB vs vector index) and automatic repair jobs.
  - Gate retrieval to only completed, non-deleted, ownership-verified content.
- **Phase mapping**: **P3**, **P7**

### 7) Insight extraction drifts into low-value taxonomy noise
- **Warning signs**
  - Topic list grows fast but user interactions stay flat.
  - Similar concepts appear with slight phrasing differences.
  - Product demos look impressive, but workflow outcomes do not improve.
- **Prevention strategies**
  - Define a compact ontology for v1 (fewer, high-signal concept classes).
  - Add precision/recall acceptance thresholds using curated benchmark episodes.
  - Introduce “promote to canonical” workflow for repeated extracted concepts.
  - Tie insight surfacing to user tasks (search refinement, episode comparison, briefs).
- **Phase mapping**: **P4**, **P1**, **P7**

### 8) Security hardening lags feature velocity
- **Warning signs**
  - Public ingestion endpoints accept requests under weak/missing signature config.
  - Server-side URL fetches accept private/internal network targets.
  - Sensitive transcript/audio assets remain publicly addressable.
- **Prevention strategies**
  - Fail closed on webhook signature config; block startup without required secrets.
  - Add SSRF protections: scheme/host validation, private IP rejection, allowlists where possible.
  - Move blobs to least-privilege access patterns with expiring signed URLs.
  - Add security regression tests for known high-risk paths.
- **Phase mapping**: **P5**, **P7**

### 9) Multi-tenant data isolation breaks under edge paths
- **Warning signs**
  - Cross-tenant query artifacts in logs or support reports.
  - Admin functions rely on shared secrets without role claims.
  - Exports include records from unintended workspaces.
- **Prevention strategies**
  - Enforce tenant filters at repository/query primitives, not route-only checks.
  - Add defense-in-depth authorization: role claims + key checks for admin routes.
  - Implement tenant-isolation integration tests across all read/write/export paths.
- **Phase mapping**: **P5**, **P7**

### 10) Unit economics become unworkable before growth
- **Warning signs**
  - Cost per processed minute/query rises faster than revenue per workspace.
  - Entitlement reservations exceed actual allowances under concurrency.
  - Abuse patterns (mass imports, repeated expensive queries) appear early.
- **Prevention strategies**
  - Make quota accounting atomic with strict DB constraints.
  - Add per-workspace budgets, soft/hard limits, and anomaly throttles.
  - Cache/reuse embeddings and summary artifacts where quality permits.
  - Track margin dashboards by plan, workload type, and provider.
- **Phase mapping**: **P6**, **P3**, **P7**

### 11) Performance regresses as corpus grows
- **Warning signs**
  - Dashboard/status endpoints get slower with larger episode counts.
  - Memory spikes on aggregation-heavy routes.
  - Search latency p95 degrades during ingestion spikes.
- **Prevention strategies**
  - Replace full-set reads with paginated and incremental aggregations.
  - Add materialized rollups for heavy dashboard views.
  - Enforce query budgets and alert on p95/p99 regressions in CI/canary.
- **Phase mapping**: **P2**, **P3**, **P7**

### 12) Weak test/eval coverage allows silent regressions
- **Warning signs**
  - Frequent hotfixes after routine pipeline or prompt changes.
  - Limited confidence around Inngest/provider integrations.
  - Lint/test steps not reliably enforced in CI.
- **Prevention strategies**
  - Add end-to-end ingestion + search integration tests with representative fixtures.
  - Establish eval gates for retrieval/citation quality before merges.
  - Make CI deterministic: non-interactive linting, mandatory checks on protected branches.
- **Phase mapping**: **P7** (supports all phases)

## Leading Indicators to Monitor Weekly
- Citation accuracy rate (human-reviewed sample)
- “Insufficient evidence” rate vs wrong-answer rate
- Auto-sync lag (p50/p95) and failed-episode ratio
- Duplicate feed incidence per workspace
- Vector/DB consistency drift count
- Cross-tenant access test pass rate
- Gross margin per workspace cohort
- Search latency p95/p99 under concurrent ingestion

## Recommended Sequencing Constraints
- Do not scale **P4 (insights extraction)** before **P1 (search trust)** and **P3 (reliability)** are stable.
- Treat **P5 (security/privacy)** as parallel blocking work, not a follow-up hardening pass.
- Gate each phase with measurable exit criteria in **P7** (tests + production SLO checks).

## Immediate Milestone Guardrails
- Define and freeze a v1 citation contract before further UI polish.
- Add idempotency + retry strategy before increasing import concurrency.
- Close top security gaps (webhook config fail-closed, SSRF controls, blob access model) before broad SaaS onboarding.
- Stand up a small eval dataset (20-50 episodes) to regression-test retrieval, citation, and concept quality continuously.
