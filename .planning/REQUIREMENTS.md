# Requirements: Imago Podcast Intelligence

**Defined:** 2026-03-03
**Core Value:** Turn long-form podcast audio into reliable, searchable knowledge that can answer questions in seconds.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Workspace & Feeds

- [ ] **WORK-01**: User can create a workspace and connect multiple podcast RSS feeds.
- [ ] **WORK-02**: User can view feed health/status (last sync time, sync state, latest error) for each feed in the workspace.
- [ ] **WORK-03**: User can pause/resume sync for a feed without deleting historical indexed data.

### Ingestion & Processing

- [ ] **INGT-01**: User can trigger full backfill for connected feeds and monitor progress by episode/job state.
- [ ] **INGT-02**: System automatically ingests newly published RSS episodes without manual intervention.
- [ ] **INGT-03**: System processes retries safely (idempotent jobs, no duplicate episode processing for the same source item).
- [ ] **INGT-04**: Operator can replay failed ingestion/transcription jobs from a dead-letter or failed queue path.

### Search Experience

- [ ] **SRCH-01**: User can ask natural-language questions and receive a direct answer based only on indexed transcript evidence.
- [ ] **SRCH-02**: User sees citations for each answer with episode reference and timestamp range.
- [ ] **SRCH-03**: User can open cited evidence context (snippet/player deep-link) to verify answer quality.
- [ ] **SRCH-04**: User can filter search by feed/workspace and recency/date constraints.
- [ ] **SRCH-05**: System can return "insufficient evidence" when confidence/evidence is not strong enough.

### Security & Isolation

- [ ] **SECU-01**: System rejects unsafe RSS/enclosure fetch targets (SSRF protections including private-network and disallowed-host rules).
- [ ] **SECU-02**: Ingestion webhook/event endpoints fail closed when signature/auth configuration is invalid.
- [ ] **SECU-03**: Tenant isolation is enforced for transcript/search/export reads and vector queries across all API paths.

### Usage & Entitlements

- [ ] **ENTL-01**: Workspace usage limits are enforced atomically during ingest and search operations.
- [ ] **ENTL-02**: User receives actionable limit feedback (what limit was hit and what to do next).
- [ ] **ENTL-03**: Usage accounting stays consistent across retries, failures, and replays.

### Insights (Internal Beta)

- [ ] **INSG-01**: Internal beta users can view episode-level concepts/topics extracted from transcripts.
- [ ] **INSG-02**: Each concept/topic includes confidence and linked source evidence from the transcript.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Intelligence

- **INTL-01**: User can explore cross-episode concept relationships and trend evolution.
- **INTL-02**: User can navigate entity intelligence pages (people/orgs/products) with canonical profiles.
- **INTL-03**: User can create topic/entity watchlists and receive proactive alerts.
- **INTL-04**: User can export evidence packs (answer + citations + quotes) for sharing.

### Attribution & Analytics

- **ANLT-01**: User can correlate concepts/topics with listener behavior and download performance.
- **ANLT-02**: User can analyze topic performance trends by audience segment/cohort.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full conversational copilot workflows | Keep v1 focused on trusted answer + citation experience |
| Listener/download attribution modeling | Requires stable behavioral event model not yet validated |
| Audio/video editing and publishing suite | Adjacent product domain; not core to podcast intelligence value |
| Real-time/live transcription architecture | Different latency/cost profile from current batch-first system |
| Full billing/pricing platform rebuild | Existing entitlements are sufficient for this milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WORK-01 | TBD | Pending |
| WORK-02 | TBD | Pending |
| WORK-03 | TBD | Pending |
| INGT-01 | TBD | Pending |
| INGT-02 | TBD | Pending |
| INGT-03 | TBD | Pending |
| INGT-04 | TBD | Pending |
| SRCH-01 | TBD | Pending |
| SRCH-02 | TBD | Pending |
| SRCH-03 | TBD | Pending |
| SRCH-04 | TBD | Pending |
| SRCH-05 | TBD | Pending |
| SECU-01 | TBD | Pending |
| SECU-02 | TBD | Pending |
| SECU-03 | TBD | Pending |
| ENTL-01 | TBD | Pending |
| ENTL-02 | TBD | Pending |
| ENTL-03 | TBD | Pending |
| INSG-01 | TBD | Pending |
| INSG-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 0
- Unmapped: 20 ⚠️

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after initial definition*
