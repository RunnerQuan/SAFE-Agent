# SkillPecker Native Routes Migration Design

## Goal

Migrate the SAFE-Agent SkillPecker module away from the current iframe-based embedding model to a native Next.js route structure while preserving the current module landing experience and eliminating mismatched mouse wheel behavior between parent and embedded content.

The migration keeps `/skillpecker` as the module landing page and introduces three native subroutes:

- `/skillpecker/intro`
- `/skillpecker/console`
- `/skillpecker/library`

## Current Problem

The current `/skillpecker` page embeds three module views with iframes. The parent page intercepts wheel events from the iframe document and forwards them to the outer window. The embedded SkillPecker app also manages its own wheel behavior for the home experience. This creates two scroll control layers, which results in inconsistent mouse wheel and trackpad behavior.

This architecture also has secondary costs:

- Nested scroll contexts complicate modal handling and height synchronization.
- Route sharing is poor because each subsection is hidden inside one host page.
- Theme, navigation, and interaction behaviors are harder to unify across SAFE-Agent and SkillPecker.

## Scope

This migration covers:

- Replacing iframe-based section embedding in `/skillpecker`
- Introducing native Next.js pages for intro, console, and library
- Reusing the existing `/api/skillpecker/[...path]` proxy for backend access
- Rebuilding the relevant UI as React components instead of embedding static HTML

This migration does not cover:

- Backend API redesign
- Reworking non-SkillPecker SAFE-Agent pages
- Full visual parity for every legacy animation in the static app
- Refactoring unrelated shared frontend infrastructure

## Route Design

### `/skillpecker`

Remains the module landing page. It preserves the current three-section preview feeling, but each section becomes a native React preview block instead of an iframe.

Responsibilities:

- Present module overview and brand framing
- Preview the three major areas
- Link users into the dedicated native routes

The landing page should feel like a guided entry point, not a dashboard with full functionality embedded inline.

### `/skillpecker/intro`

Native page for the current home/introduction experience.

Responsibilities:

- Product introduction and trust/safety framing
- Headline metrics
- Supporting charts or summary visualizations
- Recent results summary list

### `/skillpecker/console`

Native page for scan operations.

Responsibilities:

- Upload mode selection
- ZIP or directory submission flow
- Job queue and task status
- Result inspection dialog

### `/skillpecker/library`

Native page for the malicious Skill library.

Responsibilities:

- Search
- Decision-level filters
- Paginated list
- Expandable detail view

## Architecture

The new architecture follows a shared shell plus route-specific module pattern.

### Shared Shell

A SkillPecker-native shell should sit inside the existing SAFE-Agent app shell and provide:

- Shared section navigation between intro, console, and library
- Consistent spacing, glass surfaces, and typography treatments
- Route-local heading and supporting actions

This shell should be React-native and must not depend on the legacy static app bootstrap script.

### Shared Data Layer

Introduce a small typed client wrapper around `/api/skillpecker/*`.

Responsibilities:

- Centralize request paths and response parsing
- Keep page components free of ad hoc fetch strings
- Support reuse across intro, console, and library

The migration should prefer focused hooks over a global store.

Suggested hooks:

- `useSkillPeckerOverview`
- `useSkillPeckerQueue`
- `useSkillPeckerLibrary`

If an endpoint does not yet support a dedicated overview response, the first version may compose the landing/intro summaries from existing queue and library endpoints.

### Shared Components

Create reusable components for repeated module UI instead of duplicating large page blocks.

Expected shared components:

- `SkillPeckerSectionNav`
- `SkillPeckerShell`
- `SkillPeckerHero`
- `SkillPeckerResultDialog`
- `SkillPeckerStatCard`
- `SkillPeckerEmptyState`

### Route-Specific Components

Each page should own only the components that are specific to its core purpose.

Examples:

- `console`: upload form, queue list, queue status strip
- `library`: search bar, filter chip group, pagination controls, result cards
- `intro`: metrics grid, summary charts, recent result list

## State Design

State should stay local unless there is a clear reuse need.

### Local UI State

Keep in the page or local route components:

- Upload mode
- Selected files
- Expanded queue item
- Current library page
- Search query
- Filter selections
- Dialog open state

### Shared Query State

Handle with route-specific hooks and standard React state/effect flow.

Do not introduce Redux or another global state layer for this migration. The module complexity does not justify it, and it would enlarge the refactor surface without solving the actual iframe problem.

## Visual Design Constraints

The native pages should remain recognizably SkillPecker.

Preserve:

- Existing brand assets
- Existing color direction and glass-panel language
- Existing information hierarchy and module tone

Do not preserve:

- Scroll-jacking behavior
- Parent/child wheel coordination logic
- Static-app-only global document scripting

The intro page may keep a staged visual layout, but scrolling must remain native and predictable.

## Migration Strategy

Implement in controlled steps to keep the module usable during the transition.

### Step 1: Establish Native Route Skeleton

- Replace the current iframe page at `/skillpecker`
- Add `/skillpecker/intro`
- Add `/skillpecker/console`
- Add `/skillpecker/library`

### Step 2: Introduce Shared SkillPecker React Layer

- Add shared shell and section navigation
- Add API client utilities
- Add common dialog and card primitives if needed

### Step 3: Migrate Console and Library First

These two pages solve the biggest functional pain first and remove the most important iframe interactions.

### Step 4: Migrate Intro

Migrate the home/introduction experience after the functional routes are stable. This page has the highest visual complexity and should be rebuilt after the lower-risk pages establish the pattern.

### Step 5: Retire iframe Implementation

Once all routes are native and linked from the landing page, remove the iframe-based host page implementation entirely.

The legacy static assets may remain temporarily as reference material during the migration, but they should no longer be used for runtime rendering inside SAFE-Agent.

## Error Handling

All native pages should handle upstream failure gracefully.

Requirements:

- Show a user-facing error state if the SkillPecker backend proxy is unavailable
- Keep failure scoped to the affected page section when practical
- Allow retry for queue and library fetches
- Avoid blank panels with silent console-only failures

## Testing Strategy

### Functional Verification

- `/skillpecker` renders without iframes
- Each section preview navigates to the correct native route
- `/skillpecker/console` can submit scans and show queue updates
- `/skillpecker/library` can search, filter, paginate, and inspect results
- `/skillpecker/intro` shows expected overview content and recent results

### UX Verification

- Mouse wheel behavior is native and consistent on all SkillPecker routes
- No nested scrolling is required for normal page use
- Modal behavior does not freeze unrelated page state
- Layout works on desktop and mobile breakpoints

### Regression Verification

- Existing SAFE-Agent global navigation still behaves correctly on SkillPecker routes
- The `/api/skillpecker/[...path]` proxy remains the only backend integration point
- No remaining references to iframe height synchronization or wheel forwarding logic exist in the SkillPecker route implementation

## Implementation Notes

- Prefer route-local React components over large single-file pages.
- Preserve current content semantics where useful, but do not mechanically copy the old static DOM tree.
- Use the static SkillPecker assets as a visual and content reference, not as a runtime dependency.

## Success Criteria

The migration is successful when:

- `/skillpecker` is a native landing page with three preview sections
- `/skillpecker/intro`, `/skillpecker/console`, and `/skillpecker/library` are all native Next.js pages
- No SkillPecker route in SAFE-Agent uses iframe embedding
- Scroll behavior is fully native and consistent
- Users can directly navigate to and share each subroute
