# Phase 1: Security & Tenant Isolation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens ingest boundaries and protected data access so external feed/webhook inputs are safe and transcript/search/export access cannot cross the intended tenant boundary. It does not add new product capabilities beyond those guardrails.

</domain>

<decisions>
## Implementation Decisions

### Tenant isolation rules
- Treat the account as the hard access boundary in Phase 1 rather than introducing workspace-level isolation yet.
- Admins/support can have normal direct access to customer transcript/search/export data as part of operations.
- Export access should follow the same authorization rules as in-product search and transcript access.
- Denied access responses should reveal minimal detail and should not confirm whether a protected resource exists.

### Claude's Discretion
- Exact HTTP status strategy for "minimal detail" responses.
- Whether admin access is surfaced only in dedicated admin tools or shared application paths.
- Audit/logging depth for admin reads, as long as normal admin access remains available.

</decisions>

<specifics>
## Specific Ideas

- Keep Phase 1 permissive enough for operators to inspect customer data directly when needed.
- Avoid verbose permission errors that leak resource existence or ownership details.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/auth/session.ts`: existing authenticated-user guard for protected routes.
- `src/lib/http.ts`: shared response helpers that can standardize minimal denial/error responses.
- `src/app/api/search/route.ts`: current search entry point already combines auth, validation, and vector query flow.
- `src/lib/services/transcript-export.ts`: current export assembly path that should align with the same access policy as search.
- `src/lib/vector/pinecone.ts`: current vector query layer where tenant filters are enforced today.

### Established Patterns
- Route handlers are thin and delegate to service/domain modules after `requireUser()` and Zod validation.
- Authorization is currently enforced through ownership checks in DB queries and vector metadata filters tied to `clerkUserId`.
- Error handling is centralized through `ok()` / `fail()` helpers, which supports consistent low-detail denial behavior.

### Integration Points
- `src/app/api/search/route.ts`
- `src/app/api/podcasts/[podcastId]/transcripts/download/route.ts`
- `src/app/api/podcasts/[podcastId]/episodes/[episodeId]/transcript/download/route.ts`
- `src/lib/services/podcast-reader.ts`
- `src/lib/services/transcript-export.ts`
- `src/lib/vector/pinecone.ts`

</code_context>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 01-security-tenant-isolation*
*Context gathered: 2026-03-09*
