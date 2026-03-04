# Research Synthesis Summary

## Key Findings
- The research converges on a **stability-first path**: preserve current architecture shape and prioritize operational hardening over stack churn.
- v1 product success depends on **search trust** (answer + verifiable citations) and **ingestion freshness/reliability** more than on advanced intelligence features.
- Multi-tenant correctness must be enforced end-to-end (SQL + vector filters + exports), not only at route/controller level.
- Cost and reliability risks are tightly coupled: retries, backfills, embedding/transcription volume, and quota enforcement need explicit controls from day one.
- Differentiation should begin with **episode-level concept/topic extraction** only after citation trust and pipeline reliability are stable.

## Recommended v1 Scope
- In scope (must ship):
  - Answer-first search with structured citations (episode, timestamp range, supporting snippet/evidence link).
  - Multi-feed workspace management with feed health/status.
  - Durable ingestion/autosync with idempotency, retries, DLQ/replay tooling, and observable episode/job states.
  - Search quality controls (filters by workspace/feed/date, source constraints, recency).
  - Security baseline for public SaaS (SSRF protections, webhook verification fail-closed, signed/least-privilege blob access).
  - Usage/entitlement enforcement with atomic quota accounting and hard limits.
- In scope (conditional, if above is stable):
  - Episode-level concept/topic extraction with evidence references and versioned extractor output.
- Out of scope for v1:
  - General copilot/agent workflows, attribution analytics, editing/publishing suite, social/calendar tooling, live transcription architecture, custom model-training UX.
  - XL bets: large-scale entity canonicalization and stance clustering.

## Sequence Guidance
1. Foundation hardening first: tenant boundaries, authz invariants, state machine, idempotency, retries, observability.
2. Multi-feed model + operations: workspace feed registry, cursors, health UX, entitlement guards.
3. Search trust contract: finalize citation schema, retrieval/rerank traces, UI verification flow, eval harness gates.
4. Reliability scale-up: autosync concurrency controls, DLQ triage/replay, SLO alerts for freshness/error/latency.
5. Add insights v1: episode concept/topic extraction with strict quality thresholds and evidence-linked display.
6. Defer cross-episode graph/entity-scale work until usage and quality metrics justify expansion.

## Major Risks & Mitigations
- Confident-but-wrong answers:
  - Mitigate by constraining generation to retrieved evidence, adding citation validation checks, and supporting explicit “insufficient evidence” outputs.
- Ingestion drift and silent failures at volume:
  - Mitigate with idempotency keys, bounded retries, DLQ + replay tooling, and lag/failure SLO paging.
- Transcript/vector inconsistency:
  - Mitigate with two-phase indexing semantics, consistency audits (DB vs index), and automatic repair jobs.
- Cross-tenant leakage:
  - Mitigate with tenant-scoped query primitives, mandatory vector metadata filters (`workspaceId`), and isolation integration tests across read/write/export paths.
- Security regressions on ingest/search edges:
  - Mitigate with SSRF guards, webhook signature fail-closed behavior, least-privilege blob access, and security regression tests.
- Unit economics degradation:
  - Mitigate with atomic quota accounting, per-workspace budgets/throttles, and provider-cost dashboards tied to plan margins.

## Open Questions
- What are the exact v1 quality gates for launch (citation accuracy threshold, wrong-answer ceiling, acceptable “insufficient evidence” rate)?
- What plan/entitlement model is required for GA (feeds/workspace, processed minutes, query volume, export limits)?
- What reprocessing policy is acceptable when transcription/model/extractor versions change (scope, cadence, customer visibility)?
- What minimum security/compliance bar is required before broad onboarding (audit logging depth, retention, access controls)?
- Should hybrid retrieval (dense+sparse) be part of v1 or an explicit v1.1 trigger based on measured citation precision/recall?
- What operator UX is required for supportability at launch (DLQ triage, replay controls, incident runbooks, customer-facing status)?
