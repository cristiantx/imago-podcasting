# Codebase Concerns

## Critical

### 1) Webhook authentication can silently degrade
- **Risk:** `/api/inngest` is intentionally public, but signing-related env vars default to empty strings. A misconfigured deployment can expose background processing endpoints to spoofed events.
- **Why it matters:** Event spoofing can trigger arbitrary ingestion workloads and cost spikes.
- **Evidence:**
`src/middleware.ts:3`
`src/middleware.ts:7`
`src/app/api/inngest/route.ts:6`
`src/lib/config.ts:13`
`src/lib/config.ts:14`
`src/lib/config.ts:15`
`.env.example:10`

### 2) SSRF surface from untrusted feed/audio URLs
- **Risk:** User-provided RSS URLs and feed-provided enclosure URLs are fetched server-side with no host allowlist or private-network blocking.
- **Why it matters:** Attackers can target internal services from the server network.
- **Evidence:**
`src/lib/validation/common.ts:3`
`src/lib/rss/parse-feed.ts:63`
`src/lib/rss/parse-feed.ts:70`
`src/lib/storage/audio.ts:6`

### 3) Transcript/audio blobs are stored with public access
- **Risk:** Both temporary audio and transcript VTT uploads use `access: "public"`.
- **Why it matters:** Leaked URLs can expose customer content.
- **Evidence:**
`src/lib/storage/audio.ts:18`
`src/lib/storage/transcript.ts:13`

## High

### 4) Internal/vendor errors are returned directly to clients
- **Risk:** Upstream error bodies are embedded in thrown errors and sent back through API `fail(message, ...)`.
- **Why it matters:** Leaks implementation details and possibly sensitive provider payloads.
- **Evidence:**
`src/lib/vector/embeddings.ts:33`
`src/lib/transcription/deepgram.ts:31`
`src/lib/http.ts:7`
`src/app/api/search/route.ts:75`
`src/app/api/podcasts/import/route.ts:36`

### 5) Entitlement reservation is race-prone under concurrency
- **Risk:** Quota checks are computed from aggregate reads and then inserted, without explicit row/advisory locking or hard DB constraints on total reserved+consumed units.
- **Why it matters:** Parallel imports may over-reserve usage.
- **Evidence:**
`src/lib/entitlements/service.ts:107`
`src/lib/entitlements/service.ts:115`
`src/lib/entitlements/service.ts:126`
`src/lib/entitlements/service.ts:149`
`src/lib/db/schema.ts:130`

### 6) Duplicate podcast imports are possible
- **Risk:** `podcasts` lacks a unique `(clerkUserId, feedUrl)` constraint and the service relies on check-then-insert.
- **Why it matters:** Concurrent imports can create duplicate podcast rows and fragmented job history.
- **Evidence:**
`src/lib/db/schema.ts:47`
`src/lib/services/import-service.ts:72`
`src/lib/services/import-service.ts:175`
`src/lib/services/import-service.ts:532`

### 7) Vector/DB state can diverge on partial failures
- **Risk:** Pinecone upsert happens before transcript row write; failure after upsert marks episode failed but does not remove just-written vectors.
- **Why it matters:** Stale vector matches can appear for failed episodes.
- **Evidence:**
`src/lib/pipeline/process-episode.ts:87`
`src/lib/pipeline/process-episode.ts:91`
`src/lib/pipeline/process-episode.ts:128`
`src/lib/services/podcast-management.ts:33`

## Medium

### 8) Episode processing has no retries for transient failures
- **Risk:** Episode worker is configured with `retries: 0`, and pipeline errors are swallowed inside the step.
- **Why it matters:** Temporary external outages (Deepgram/Pinecone/Blob) become permanent failed episodes until manual re-sync.
- **Evidence:**
`src/inngest/functions.ts:93`
`src/inngest/functions.ts:130`

### 9) Query patterns will degrade as data grows
- **Risk:** Several endpoints load full episode sets for aggregation/details and only one list endpoint has a hardcoded limit.
- **Why it matters:** Latency and memory pressure increase non-linearly with catalog size.
- **Evidence:**
`src/app/api/podcasts/[podcastId]/status/route.ts:29`
`src/lib/services/podcast-reader.ts:17`
`src/lib/services/podcast-reader.ts:93`
`src/lib/services/podcast-reader.ts:208`
`src/lib/validation/common.ts:8`
`src/lib/validation/common.ts:9`

### 10) Admin authorization relies on shared secret only
- **Risk:** Admin API checks only `x-admin-key`; no explicit role/claim guard is applied.
- **Why it matters:** Any authenticated user with the key can mutate entitlements.
- **Evidence:**
`src/app/api/admin/entitlements/adjust/route.ts:18`
`src/app/api/admin/entitlements/adjust/route.ts:23`
`src/app/(app)/admin/page.tsx:4`
`src/components/admin-entitlements-form.tsx:23`

### 11) CSV export is vulnerable to spreadsheet formula injection
- **Risk:** CSV escaping covers commas/quotes/newlines but not formula-leading characters (`=`, `+`, `-`, `@`).
- **Why it matters:** Opening exported CSV in spreadsheet apps can execute attacker-controlled formulas.
- **Evidence:**
`src/lib/ui/dashboard-table.ts:59`
`src/lib/ui/dashboard-table.ts:67`
`src/lib/ui/dashboard-table.ts:71`

## Quality Debt

### 12) Tooling/tests are too narrow for the risk profile
- **Risk:** Coverage focuses on helper logic and mocked route behavior; async pipeline/integration paths are untested.
- **Why it matters:** Regressions in ingestion, queue dispatch, vector indexing, and cleanup can ship undetected.
- **Evidence:**
`test/podcast-import-routes.test.ts`
`test/entitlements-policy.test.ts`
`test/app-shell-config.test.ts`
`test/dashboard-table.test.ts`
`test/chunking.test.ts`
`src/lib/pipeline/process-episode.ts`
`src/inngest/functions.ts`
`src/lib/services/transcript-export.ts`

### 13) Linting is not operationally configured
- **Risk:** `lint` script uses deprecated `next lint` and prompts for setup interactively instead of running deterministic checks in CI.
- **Why it matters:** Static analysis is not enforceable in automation.
- **Evidence:**
`package.json:10`

