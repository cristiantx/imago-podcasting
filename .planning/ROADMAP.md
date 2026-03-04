# Roadmap: Imago Podcast Intelligence

## Overview

This roadmap hardens the existing ingestion/search foundation into a reliable public SaaS product by sequencing security and tenant safety first, then multi-feed and ingestion operations, then trusted answer-with-citations search, followed by entitlement controls and episode-level insights.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Security & Tenant Isolation** - Enforce safety boundaries and cross-tenant isolation invariants.
- [ ] **Phase 2: Workspace & Feed Management** - Make multi-feed workspaces first-class and operationally visible.
- [ ] **Phase 3: Ingestion Reliability & Replay** - Deliver durable backfill, autosync, retry, and replay behavior.
- [ ] **Phase 4: Trusted Search Experience** - Ship answer-first retrieval with verifiable evidence and confidence controls.
- [ ] **Phase 5: Usage Limits & Entitlements** - Enforce atomic quotas with clear user-facing limit feedback.
- [ ] **Phase 6: Episode Insights Beta** - Expose transcript-grounded concepts/topics for internal beta users.

## Phase Details

### Phase 1: Security & Tenant Isolation
**Goal**: The system safely ingests external feed data and guarantees tenant-isolated access for all transcript and search surfaces.
**Depends on**: Nothing (first phase)
**Requirements**: SECU-01, SECU-02, SECU-03
**Success Criteria** (what must be TRUE):
  1. User attempts to add unsafe/private-network RSS or enclosure targets are rejected with a clear failure reason.
  2. Ingestion webhooks/events with missing or invalid signature/auth configuration are rejected and do not trigger processing.
  3. A user cannot access transcripts, search results, vector matches, or exports from another workspace across any API path.
**Plans**: 3 plans

Plans:
- [ ] 01-01: SSRF protections for RSS/enclosure fetch paths
- [ ] 01-02: Fail-closed webhook/event authentication checks
- [ ] 01-03: Tenant isolation enforcement and integration tests

### Phase 2: Workspace & Feed Management
**Goal**: Users can manage multiple feeds per workspace and understand feed sync health at a glance.
**Depends on**: Phase 1
**Requirements**: WORK-01, WORK-02, WORK-03
**Success Criteria** (what must be TRUE):
  1. User can create a workspace and connect multiple podcast RSS feeds within it.
  2. User can see per-feed sync health including last sync time, sync state, and latest error.
  3. User can pause and resume sync for a feed without losing historical indexed episodes.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Workspace feed registry and lifecycle controls
- [ ] 02-02: Feed health/status surface in product UI

### Phase 3: Ingestion Reliability & Replay
**Goal**: Ingestion runs continuously and recoverably at scale for backfill and ongoing episode sync.
**Depends on**: Phase 2
**Requirements**: INGT-01, INGT-02, INGT-03, INGT-04
**Success Criteria** (what must be TRUE):
  1. User can trigger a full feed backfill and track progress by episode/job state.
  2. Newly published RSS episodes are ingested automatically without manual triggers.
  3. Retries and repeated events do not create duplicate processing for the same source item.
  4. Operator can replay failed ingestion/transcription jobs from a failed/DLQ path and observe recovery.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Backfill and autosync orchestration behavior
- [ ] 03-02: Idempotency and duplicate-prevention guarantees
- [ ] 03-03: Failed-job replay tooling and observability

### Phase 4: Trusted Search Experience
**Goal**: Users receive direct answers that are transparently grounded in episode/time evidence.
**Depends on**: Phase 3
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05
**Success Criteria** (what must be TRUE):
  1. User can ask a natural-language question and receive a direct answer derived only from indexed transcript evidence.
  2. Every answer shows citations with episode reference and timestamp range.
  3. User can open cited context (snippet/player deep-link) to verify answer quality.
  4. User can constrain search by feed/workspace and recency/date filters.
  5. When evidence is weak, the system returns an explicit insufficient-evidence response instead of a fabricated answer.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Answer + citation response contract
- [ ] 04-02: Citation verification UX and deep-link evidence context
- [ ] 04-03: Retrieval filters and insufficient-evidence gating

### Phase 5: Usage Limits & Entitlements
**Goal**: Workspace limits are enforced accurately and predictably across ingest and search workloads.
**Depends on**: Phase 3 and Phase 4
**Requirements**: ENTL-01, ENTL-02, ENTL-03
**Success Criteria** (what must be TRUE):
  1. Ingest and search operations stop at configured workspace limits without quota overrun.
  2. Users receive actionable limit feedback that explains what limit was hit and what to do next.
  3. Usage accounting remains consistent through retries, failures, and replay flows.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Atomic entitlement enforcement in ingest/search paths
- [ ] 05-02: Consistent usage accounting and limit feedback UX

### Phase 6: Episode Insights Beta
**Goal**: Internal beta users can review transcript-grounded concepts/topics per episode with transparent confidence and evidence.
**Depends on**: Phase 4
**Requirements**: INSG-01, INSG-02
**Success Criteria** (what must be TRUE):
  1. Internal beta user can view extracted episode-level concepts/topics in the product.
  2. Each concept/topic shows confidence and links to supporting transcript evidence.
  3. User can open insight evidence and validate the underlying transcript context.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Concept/topic extraction pipeline for episode outputs
- [ ] 06-02: Insights display with confidence and evidence links

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 1.1 -> 1.2 -> 2 -> 2.1 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security & Tenant Isolation | 0/3 | Not started | - |
| 2. Workspace & Feed Management | 0/2 | Not started | - |
| 3. Ingestion Reliability & Replay | 0/3 | Not started | - |
| 4. Trusted Search Experience | 0/3 | Not started | - |
| 5. Usage Limits & Entitlements | 0/2 | Not started | - |
| 6. Episode Insights Beta | 0/2 | Not started | - |
