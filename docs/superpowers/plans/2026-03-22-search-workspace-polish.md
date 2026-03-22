# Search Workspace Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the search page into a two-column review workspace with a sticky preview rail, active result selection, and flagship-level interaction polish without changing the search API contract.

**Architecture:** Keep the API and result model stable, move new selection and preview behavior into testable UI helpers, and split the search page into focused presentational units so the main container only owns fetch/state orchestration. The desktop layout becomes a results column plus sticky preview rail; mobile keeps the same data model but stacks the preview under the active result.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest

---

## File Map

- Modify: `src/components/search-panel.tsx`
  Responsibility: Own fetch state, query submission, result selection, and responsive layout composition.
- Create: `src/components/search-preview-rail.tsx`
  Responsibility: Render the sticky preview rail / stacked mobile preview for the active result.
- Create: `src/components/search-result-card.tsx`
  Responsibility: Render a selectable result card with selected, hover, focus, and action states.
- Modify: `src/lib/ui/search-results.ts`
  Responsibility: Add pure helpers for active-result identity, preview fallback text, and selection retention.
- Create: `test/search-workspace.test.ts`
  Responsibility: Cover new pure UI helpers and selection behavior.
- Modify: `test/search-results.test.ts`
  Responsibility: Extend existing helper coverage if any new helper belongs in the existing module.
- Modify: `src/app/globals.css`
  Responsibility: Add shared search workspace surface/motion utilities only if the styles are reused enough to justify globals.

### Task 1: Add Testable Search Workspace Helpers

**Files:**
- Modify: `src/lib/ui/search-results.ts`
- Create: `test/search-workspace.test.ts`

- [ ] **Step 1: Write the failing tests for active-result selection helpers**

```ts
import { describe, expect, it } from "vitest";

import type { SemanticSearchResult } from "@/lib/ui/search-results";
import {
  getSearchResultKey,
  resolveInitialActiveResultKey,
  resolveRetainedActiveResultKey
} from "@/lib/ui/search-results";

const results: SemanticSearchResult[] = [
  {
    podcastId: "pod-1",
    podcastTitle: "Design Matters",
    podcastImageUrl: null,
    episodeId: "ep-1",
    episodeTitle: "Recent Match",
    episodeUrl: "https://example.com/ep-1?t=42",
    episodeHref: "/podcasts/pod-1/episodes/ep-1?t=42",
    publishedAt: "2026-03-01T00:00:00.000Z",
    startSec: 42,
    endSec: 58,
    speaker: "Host",
    snippet: "Sustainable design patterns keep teams aligned.",
    score: 0.92
  }
];

describe("search workspace helpers", () => {
  it("derives a stable result key from episode and timestamp", () => {
    expect(getSearchResultKey(results[0])).toBe("ep-1:42");
  });

  it("defaults the active result to the first visible result", () => {
    expect(resolveInitialActiveResultKey(results)).toBe("ep-1:42");
  });

  it("retains the active result when it still exists after reload", () => {
    expect(resolveRetainedActiveResultKey(results, "ep-1:42")).toBe("ep-1:42");
  });
});
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `npx vitest run test/search-workspace.test.ts`
Expected: FAIL with missing exports from `src/lib/ui/search-results.ts`

- [ ] **Step 3: Implement minimal pure helpers in `src/lib/ui/search-results.ts`**

```ts
export function getSearchResultKey(result: SemanticSearchResult) {
  return `${result.episodeId}:${result.startSec}`;
}

export function resolveInitialActiveResultKey(results: SemanticSearchResult[]) {
  return results.length > 0 ? getSearchResultKey(results[0]) : null;
}

export function resolveRetainedActiveResultKey(
  results: SemanticSearchResult[],
  currentKey: string | null
) {
  if (currentKey && results.some((result) => getSearchResultKey(result) === currentKey)) {
    return currentKey;
  }

  return resolveInitialActiveResultKey(results);
}
```

- [ ] **Step 4: Add one preview-oriented helper test and minimal implementation**

```ts
it("builds preview metadata with speaker fallback", () => {
  expect(formatPreviewSpeakerLabel("Host")).toBe("Host");
  expect(formatPreviewSpeakerLabel(null)).toBe("Transcript match");
});
```

```ts
export function formatPreviewSpeakerLabel(speaker: string | null) {
  return speaker?.trim() ? speaker : "Transcript match";
}
```

- [ ] **Step 5: Run the helper tests to verify they pass**

Run: `npx vitest run test/search-workspace.test.ts test/search-results.test.ts`
Expected: PASS

- [ ] **Step 6: Commit the helper layer**

```bash
git add src/lib/ui/search-results.ts test/search-workspace.test.ts test/search-results.test.ts
git commit -m "test: add search workspace helper coverage"
```

### Task 2: Reshape Search State Around an Active Result

**Files:**
- Modify: `src/components/search-panel.tsx`
- Modify: `src/lib/ui/search-results.ts`
- Test: `test/search-workspace.test.ts`

- [ ] **Step 1: Add a failing helper test for selection retention after pagination or refresh**

```ts
it("falls back to the first result when the active result disappears", () => {
  expect(
    resolveRetainedActiveResultKey(results, "missing:0")
  ).toBe("ep-1:42");
});
```

- [ ] **Step 2: Run the helper tests to verify the new case fails**

Run: `npx vitest run test/search-workspace.test.ts`
Expected: FAIL until the fallback logic is confirmed

- [ ] **Step 3: Update `src/components/search-panel.tsx` to store an active result key and selected result**

```ts
const [activeResultKey, setActiveResultKey] = useState<string | null>(null);

const visibleResults = paginateSearchResults(filteredResults, visibleCount);
const activeResult = visibleResults.find(
  (result) => getSearchResultKey(result) === activeResultKey
) ?? filteredResults.find(
  (result) => getSearchResultKey(result) === activeResultKey
) ?? null;
```

- [ ] **Step 4: Reset active selection after successful search using the helper**

```ts
setResults(payload.results ?? []);
setVisibleCount(INITIAL_VISIBLE_RESULTS);
setActiveResultKey(resolveInitialActiveResultKey(payload.results ?? []));
```

- [ ] **Step 5: Retain or repair active selection when filtered results change**

```ts
useEffect(() => {
  setActiveResultKey((currentKey) =>
    resolveRetainedActiveResultKey(filteredResults, currentKey)
  );
}, [filteredResults]);
```

- [ ] **Step 6: Run helper tests and targeted typecheck**

Run: `npx vitest run test/search-workspace.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit the state refactor**

```bash
git add src/components/search-panel.tsx src/lib/ui/search-results.ts test/search-workspace.test.ts
git commit -m "feat: add active selection state to search"
```

### Task 3: Extract Selectable Result Cards

**Files:**
- Create: `src/components/search-result-card.tsx`
- Modify: `src/components/search-panel.tsx`
- Modify: `src/app/globals.css` (only if shared state classes are reused)

- [ ] **Step 1: Create a focused result card component shell**

```tsx
type SearchResultCardProps = {
  result: SemanticSearchResult;
  submittedQuery: string;
  selected: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onShare: () => void;
};
```

- [ ] **Step 2: Move result-card rendering out of `search-panel.tsx`**

```tsx
<SearchResultCard
  key={getSearchResultKey(result)}
  result={result}
  submittedQuery={submittedQuery}
  selected={getSearchResultKey(result) === activeResultKey}
  onSelect={() => setActiveResultKey(getSearchResultKey(result))}
  onCopy={() => void onCopyQuote(result)}
  onShare={() => void onShareResult(result)}
/>
```

- [ ] **Step 3: Make the card selectable first and navigable second**

```tsx
<button
  type="button"
  onClick={onSelect}
  className={cn(
    "group relative w-full rounded-[28px] border text-left transition",
    selected
      ? "border-primary/30 bg-white shadow-[0_24px_64px_rgba(76,29,149,0.14)]"
      : "border-white/80 bg-white/95 hover:-translate-y-0.5 hover:shadow-[0_24px_64px_rgba(15,23,42,0.1)]"
  )}
>
```

- [ ] **Step 4: Add explicit selected, hover, and focus-visible treatments**

Use:
- timestamp chip with stronger selected styling
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- action buttons that stop propagation so copy/share do not change selection accidentally

- [ ] **Step 5: Run typecheck after extraction**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit the card extraction**

```bash
git add src/components/search-panel.tsx src/components/search-result-card.tsx src/app/globals.css
git commit -m "feat: extract selectable search result cards"
```

### Task 4: Add the Sticky Preview Rail

**Files:**
- Create: `src/components/search-preview-rail.tsx`
- Modify: `src/components/search-panel.tsx`
- Modify: `src/app/globals.css` (if shared preview classes are warranted)

- [ ] **Step 1: Create the preview rail component interface**

```tsx
type SearchPreviewRailProps = {
  result: SemanticSearchResult | null;
  copyLabel: string;
  shareLabel: string;
  onCopy: () => void;
  onShare: () => void;
};
```

- [ ] **Step 2: Render a sticky desktop rail and stacked mobile variant from the same component**

```tsx
<div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_24rem]">
  <div>{/* results */}</div>
  <SearchPreviewRail ... />
</div>
```

- [ ] **Step 3: Make the preview prioritize a mini-player shell and jump action**

```tsx
<div className="rounded-[28px] border border-sky-100/80 bg-[linear-gradient(180deg,rgba(246,251,255,0.98)_0%,rgba(255,255,255,0.98)_100%)] p-5 shadow-[0_24px_70px_rgba(55,113,164,0.12)]">
  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
    Preview
  </p>
  <div className="mt-4 rounded-[22px] bg-slate-950 px-4 py-4 text-white">
    {/* play button, scrubber shell, timestamp */}
  </div>
</div>
```

- [ ] **Step 4: Use the selected result’s deep link and timestamp as the primary CTA**

```tsx
<Link href={result.episodeHref} className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-bold text-white">
  Jump to Episode at {formatTime(result.startSec)}
</Link>
```

- [ ] **Step 5: Add a null-state preview when no result is selected**

The empty rail should:
- explain that preview appears after search
- keep the layout height stable
- avoid looking like an error state

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit the preview rail**

```bash
git add src/components/search-panel.tsx src/components/search-preview-rail.tsx src/app/globals.css
git commit -m "feat: add search preview rail"
```

### Task 5: Polish Feedback States, Mobile Layout, and Accessibility

**Files:**
- Modify: `src/components/search-panel.tsx`
- Modify: `src/components/search-preview-rail.tsx`
- Modify: `src/components/search-result-card.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Tighten empty, loading, and error copy in `search-panel.tsx`**

Use clearer task-oriented strings such as:

```ts
title="Search your transcript archive"
description="Start with a topic, phrase, guest, or audience problem to surface the strongest moments."
```

- [ ] **Step 2: Keep layout stable during searches**

Implement:
- persistent results shell after first search
- non-jumping loading message in the summary/header area
- no collapsing preview rail while refresh is in progress

- [ ] **Step 3: Ensure mobile keeps the same mental model**

Implement:
- selected card first
- preview stacked below selected card
- remaining results below the preview

- [ ] **Step 4: Add accessibility wiring**

Implement:
- `aria-pressed` or equivalent selected-state semantics on selectable cards
- descriptive `aria-label` values for copy/share/jump controls
- visible focus rings on all interactive elements

- [ ] **Step 5: Run targeted verification**

Run: `npm run typecheck`
Expected: PASS

Run: `npx vitest run test/search-workspace.test.ts test/search-results.test.ts`
Expected: PASS

- [ ] **Step 6: Commit the polish pass**

```bash
git add src/components/search-panel.tsx src/components/search-preview-rail.tsx src/components/search-result-card.tsx src/app/globals.css
git commit -m "feat: polish search workspace states and accessibility"
```

### Task 6: Final Verification

**Files:**
- Modify: `src/components/search-panel.tsx`
- Modify: `src/components/search-preview-rail.tsx`
- Modify: `src/components/search-result-card.tsx`
- Modify: `src/lib/ui/search-results.ts`
- Modify: `test/search-workspace.test.ts`
- Modify: `test/search-results.test.ts`

- [ ] **Step 1: Run the full targeted test suite**

Run: `npx vitest run test/search-workspace.test.ts test/search-results.test.ts test/search-route.test.ts`
Expected: PASS

- [ ] **Step 2: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run a production build smoke test**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual QA checklist**

Verify:
- desktop shows results + sticky preview rail
- first search result auto-selects
- selecting another result updates the preview
- copy/share still work
- jump CTA lands on the right episode timestamp
- mobile stacks preview under the selected result without horizontal scroll
- focus indicators remain visible
- reduced-motion behavior still feels acceptable

- [ ] **Step 5: Commit the final verified state**

```bash
git add src/components/search-panel.tsx src/components/search-preview-rail.tsx src/components/search-result-card.tsx src/lib/ui/search-results.ts test/search-workspace.test.ts test/search-results.test.ts
git commit -m "feat: ship polished search workspace"
```
