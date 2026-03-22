# Search Workspace Polish Design

## Summary

Polish the search experience into a flagship workspace for solo podcasters and small podcast teams who need to jump to the exact episode timestamp quickly. The page should feel modern, playful, and friendly while improving confidence before navigation.

This design keeps the existing semantic search API and search result model. The work is focused on the client-side search workspace in [`src/components/search-panel.tsx`](/Users/cristianc/dev/podcasting.imago/src/components/search-panel.tsx), with light supporting UI utilities if needed.

## Goals

- Make the fastest path through search: query -> scan results -> confirm with playback -> jump to timestamp.
- Upgrade the interface from a vertical stack of cards into a structured review workspace.
- Keep the tone bright, warm, and approachable without drifting into decorative excess.
- Improve state quality across loading, empty, error, selected, focus, and mobile layouts.

## Non-Goals

- No changes to embedding generation, Pinecone query logic, or search API semantics.
- No new modal or drawer-based search interaction.
- No redesign of episode detail or app shell in this phase.
- No large data model changes beyond small UI-facing helpers if needed.

## Current State

The current search page has a strong hero input and polished result cards, but it is still fundamentally a stacked feed:

- Results are independent cards with no persistent selected state.
- There is no inline confirmation layer before navigation.
- Playback context is deferred to the episode detail page.
- The page can feel visually pleasant but operationally shallow for rapid retrieval work.

## Proposed Experience

### Layout

Transform the result area into a two-column workspace on desktop:

- Left column: search results list and filtering context.
- Right column: sticky preview rail for the currently selected result.

On smaller screens:

- The preview rail collapses beneath the selected result.
- The same content model is preserved instead of switching to a modal or drawer.

### Result Selection Model

- The first result auto-selects after a successful search.
- Clicking a result card sets it as the active selection without navigating away.
- The active card receives a clear selected treatment distinct from hover.
- Keyboard focus and selected state remain visually obvious.

### Preview Rail

The preview rail is the confidence layer before navigation. It should prioritize:

1. Mini player
2. Timestamp and episode context
3. Short transcript context around the matched snippet
4. Primary jump action
5. Secondary actions such as copy/share

If a direct audio preview is not possible from current data, the mini player can initially use the episode audio source with the selected timestamp as the anchored context. The rail should still visually read as a lightweight player, not a full editor.

## Visual Direction

### Tone

- Modern, playful, friendly
- Bright surfaces with subtle tinting
- Structured editorial workspace rather than generic SaaS dashboard

### Visual Principles

- Stronger hierarchy on timestamps and episode titles
- Less ornamental card chrome, more disciplined spacing
- Playful energy concentrated in the preview rail and state transitions
- Warm neutrals and soft accent color usage consistent with existing brand direction

### Motion

- Use small opacity and transform transitions for card selection, rail updates, and loading changes
- No layout-janky animations
- Respect `prefers-reduced-motion`

## Component Changes

### Search Header

Keep the current search hero structure, but tighten copy and spacing so it hands off more cleanly into the workspace below.

Potential adjustments:

- Clearer scope summary text
- Better wrapping behavior for podcast chips
- Tighter visual relationship between the query bar and results summary

### Results List

Replace large standalone cards with denser selectable result rows/cards that support scanning:

- Episode title
- Podcast title and publish date
- Highlighted snippet
- Dominant timestamp chip
- Match score
- Secondary actions

Each result should feel tappable/selectable first and navigable second.

### Preview Rail

Introduce a sticky aside on desktop that updates from the active result:

- Podcast and episode identity
- Mini player shell
- Selected timestamp
- Short snippet/transcript context
- Primary CTA: jump to episode at timestamp

The rail should have enough presence to stabilize the page without overpowering the result list.

### Empty and Feedback States

Upgrade the existing empty states so they feel intentional and task-specific:

- No podcasts: explain the dependency on imported feeds
- Pre-search: teach what kind of queries work well
- No results: suggest broader phrasing or wider search scope
- Loading: keep layout stable and indicate refresh without collapsing content
- Error: use clearer recovery-oriented language

## Behavior and State Details

### Search Submission

- Preserve current validation rules.
- After successful search:
  - store submitted query
  - reset visible count
  - auto-select the first visible result

### Active Result

Introduce local state for the currently selected result keyed by episode/timestamp identity.

Selection should remain stable when:

- copying quote
- sharing
- loading more results

If a new search returns no matching active result, fall back to the first available result.

### Navigation

Primary navigation remains the existing episode deep link with `?t=` seek parameter.

Potential support behavior:

- clicking the active preview CTA navigates
- clicking a non-primary area of a result selects it
- optional double-click or direct timestamp action may navigate later, but not required for this phase

## Responsive Strategy

- Desktop: two-column layout with sticky preview rail
- Tablet: narrower two-column or stacked transition depending on available width
- Mobile: selected result followed by inline preview content

Requirements:

- no horizontal scroll
- touch targets at least 44x44
- readable text sizing on mobile
- selected state remains obvious without hover reliance

## Accessibility

- Result selection must be keyboard accessible
- Focus states must remain visible and distinct from hover
- Preview rail updates should preserve clear reading order
- Buttons and links need precise accessible labels
- Motion reductions must be respected
- Contrast must meet WCAG AA

## Implementation Notes

Likely files:

- [`src/components/search-panel.tsx`](/Users/cristianc/dev/podcasting.imago/src/components/search-panel.tsx)
- [`src/lib/ui/search-results.ts`](/Users/cristianc/dev/podcasting.imago/src/lib/ui/search-results.ts) for UI helpers if selection/presentation helpers are useful
- [`src/app/globals.css`](/Users/cristianc/dev/podcasting.imago/src/app/globals.css) only if shared motion or surface classes are justified

The search API in [`src/app/api/search/route.ts`](/Users/cristianc/dev/podcasting.imago/src/app/api/search/route.ts) should remain unchanged unless the preview rail reveals a minimal missing field that is necessary for display.

## Testing and Verification

### Functional

- Search still submits and renders results for single and multi-podcast scopes
- First result auto-selects after search
- Selecting another result updates the preview rail
- Jump CTA still navigates with the correct timestamp
- Copy/share actions still work

### UX Quality

- Empty, loading, and error states render cleanly
- Desktop and mobile layouts remain coherent
- Focus and keyboard navigation work end to end
- Reduced motion behavior remains acceptable

## Open Question

If the mini player needs richer playback controls than the current search payload can support comfortably, the first implementation can keep the rail visually player-led while using the existing episode audio source and timestamp context, then deepen playback behavior in a later phase.
