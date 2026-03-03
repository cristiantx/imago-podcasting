# Imago Podcast Intelligence

## What This Is

Imago is a web app that turns podcast RSS feeds into a searchable knowledge base. It ingests one or more podcast feeds, backfills historical episodes, auto-syncs new episodes, transcribes audio, and lets users query transcripts semantically. The product direction extends this foundation into structured podcast intelligence (concepts, topics, and higher-order relationships).

## Core Value

Turn long-form podcast audio into reliable, searchable knowledge that can answer questions in seconds.

## Requirements

### Validated

- ✓ Authenticated multi-user web app shell with protected routes — existing
- ✓ RSS import orchestration with queued episode jobs — existing
- ✓ Automated episode transcription pipeline and transcript storage — existing
- ✓ Vector indexing and semantic retrieval over transcript segments — existing
- ✓ Podcast/episode status tracking and dashboard views — existing
- ✓ Entitlement and usage accounting model — existing

### Active

- [ ] Search returns direct answers with clear episode/time citations
- [ ] Multi-feed knowledge bases are first-class and easy to manage
- [ ] Import pipeline reliability supports continuous auto-sync at SaaS scale
- [ ] Episode-level concept/topic insights generated from transcript content

### Out of Scope

- Listener/download correlation to concepts/topics in v1 — defer until core search + insights are stable
- Deep business analytics attribution models — defer until reliable behavioral data model exists
- Full conversational copilot workflows beyond answer + citations — keep v1 focused

## Context

This is a brownfield codebase with a working Next.js + TypeScript application, Postgres (Drizzle), Inngest workflows, Deepgram transcription, Pinecone vector search, and Vercel Blob storage. The immediate product pain is that podcast research is slow and manual across many episodes. The target user is a public SaaS audience (podcasters/teams), not a single internal user. The project should build on existing ingestion/transcription/search capabilities and increase product quality around retrieval UX, reliability, and insight extraction.

## Constraints

- **Tech stack**: Continue on existing Next.js 15 + TypeScript + Postgres + Inngest architecture — reduces delivery risk by leveraging current system
- **Data ingestion**: RSS-driven backfill plus automatic sync is required — product value depends on fresh corpus without manual ops
- **Search UX**: v1 output must include answer + citations — trust requires verifiable references to episode/time
- **Security/Compliance**: Harden known risks in webhook/auth/SSRF/data exposure paths — SaaS deployment requires safer defaults before scale

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build for public SaaS users (not just internal use) | Product goal is reusable by many podcasters and teams | — Pending |
| Keep v1 scope to ingest + transcribe + semantic search | Fastest path to core value and user validation | — Pending |
| Require answer + citations in search results | Users need trust and source traceability | — Pending |
| Support multiple RSS feeds in one workspace | Users need cross-show or multi-feed discovery | — Pending |
| Use backfill + auto-sync ingestion model | Reduces manual effort and keeps corpus current | — Pending |

---
*Last updated: 2026-03-03 after initialization*
