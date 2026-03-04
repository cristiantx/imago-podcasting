# Podcast Intelligence SaaS Feature Research

## Scope
Subsequent milestone focus after core ingestion/transcription/vector search foundation. This document prioritizes product features for a public SaaS motion and classifies:
- table stakes (must-have to compete)
- differentiators (create defensible product advantage)
- anti-features (explicitly not in this milestone)

## Complexity Scale
- S: small (<= 1 week, mostly UI/service wiring)
- M: medium (1-2 weeks, moderate backend and UX coordination)
- L: large (2-4 weeks, new data pipelines/indexes or multi-surface UX)
- XL: very large (> 1 month, high algorithmic/operational risk)

## Table Stakes
| Feature | Why It Matters | Dependencies | Complexity |
|---|---|---|---|
| Answer-first search with episode/time citations | Trust and usability baseline for research workflows | Retrieval orchestration, citation span mapping, player deep-links, response evaluation harness | M |
| Multi-feed workspace management | Teams need one knowledge base across multiple shows/feeds | Workspace-feed data model, ingestion scheduling by feed, feed health/status UI | M |
| Ingestion reliability and auto-sync operations | SaaS retention depends on fresh corpus with low failure rates | Inngest retry policy, idempotent job keys, dead-letter/replay tooling, pipeline observability | L |
| Search quality controls (filters, recency, source constraints) | Reduces hallucinated/irrelevant answers in larger corpora | Metadata indexing (show/episode/date), retrieval filters, ranking tuning | M |
| Usage, entitlements, and hard limits enforcement | Required for monetization and abuse control | Existing entitlement model, per-workspace quotas, throttling, billing event accuracy | M |
| Security hardening on import/search surfaces | Required before scale in public SaaS | SSRF protections on RSS fetch, webhook/auth hardening, tenant data isolation checks, audit logs | L |

## Differentiators
| Feature | User Outcome | Dependencies | Complexity |
|---|---|---|---|
| Episode concept/topic extraction with confidence | Users see structured takeaways instead of raw transcripts | NLP extraction jobs, concept schema, confidence scoring, human-in-the-loop overrides | L |
| Cross-episode concept graph (co-occurrence + evolution) | Reveals relationships and trend shifts over time | Graph-like materialized views, temporal aggregation jobs, concept deduplication | L |
| Entity intelligence (people/orgs/products) with canonical profiles | Faster research on repeated guests/themes | Entity extraction + linking, canonicalization rules, profile pages, merge/split workflow | XL |
| Monitoring/watchlists for concepts/entities | Users get proactive alerts when topics emerge | Saved monitors, incremental matching on new episodes, notification pipeline (email/in-app) | M |
| Evidence pack export (answer + citations + quotes) | Enables sharing and team workflows without re-research | Citation formatter, export templates (Markdown/PDF), permission-safe sharing | M |
| Perspective/stance clustering per topic | Surfaces disagreement/consensus across episodes | Semantic clustering, stance rubric, explainability UI tied to evidence | XL |

## Anti-Features (Not In This Milestone)
| Anti-Feature | Why Excluded Now | Revisit Trigger |
|---|---|---|
| Listener/download attribution to transcript concepts | Requires reliable behavioral + attribution model not yet present | Stable event model and validated attribution requirements |
| General-purpose conversational copilot/agent workflows | High scope; risks quality regressions vs focused answer+citation experience | Search quality KPIs consistently strong and citation trust proven |
| Audio/video editing and publishing suite | Pulls product away from intelligence core and duplicates adjacent tools | Clear evidence that users need in-product editing for retention |
| Social scheduling/content calendar tooling | Adjacent marketing domain, weak dependency with intelligence core | Post-intelligence adoption signal and dedicated GTM demand |
| Real-time/live transcription product path | Different latency architecture and cost profile than current batch pipeline | Explicit live use-case demand and infra budget for low-latency path |
| Fully custom model-training UI for customers | Operationally heavy and unnecessary before robust default extraction quality | Enterprise pull requiring configurable/custom models |

## Dependency Summary
### Shared Platform Dependencies
- Tenant-safe workspace model across feeds, episodes, vectors, and insights
- Reliable async orchestration (retries, replay, backpressure, observability)
- Search evaluation harness with golden questions and citation precision/recall checks
- Permission and billing guardrails wired to all expensive operations

### Data/ML Dependencies
- Transcript segmentation quality and stable chunk metadata
- Extraction pipeline for concepts/entities with versioned schemas
- Backfill strategy for newly introduced insight features on historical episodes
- Feedback loop for correcting bad extractions (admin or user-assisted)

### UX Dependencies
- Consistent citation interaction model (jump-to-time, context window, source transparency)
- Workspace-level filters and saved views for multi-feed discovery
- Progressive disclosure: answer first, then evidence, then insight graph/entity details

## Suggested Sequencing (Subsequent Milestone)
1. Ship table stakes that close current active requirements: citation quality, multi-feed UX, ingestion reliability hardening.
2. Add first differentiator layer: concept/topic extraction + basic concept views per episode.
3. Expand to cross-episode intelligence: concept graph, watchlists, and evidence-pack exports.
4. Defer XL bets (entity canonicalization at scale, stance clustering) behind usage validation.

## Recommended Success Metrics
- Search trust: citation click-through rate, answer acceptance rate, reduction in reformulation loops
- Reliability: auto-sync success rate, mean time to recovery for failed jobs, backfill completion time
- Intelligence adoption: percentage of workspaces using concept/entity views weekly
- Retention signal: share/export rate of evidence packs and returning multi-feed research sessions
