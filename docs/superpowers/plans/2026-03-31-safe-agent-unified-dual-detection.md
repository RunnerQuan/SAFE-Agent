# SAFE-Agent Unified Dual Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace separate DOE and composition-vulnerability task/report flows with a single unified scan workflow that starts from one form and ends in one integrated detail/report page.

**Architecture:** Introduce a unified scan detail model that can contain DOE and MTAtlas sub-results, extend the server scan-service to create and read combined scans, and refactor the `scans` pages to be the sole workflow surface. Keep `skillpecker` untouched and make old `reports` routes redirect into `scans`.

**Tech Stack:** Next.js 14 app router, React, TanStack Query, TypeScript, local JSON-backed server services.

---

### Task 1: Define unified scan/report types and service contract

**Files:**
- Modify: `frontend/lib/types.ts`
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/lib/server/scan-service.ts`

- [ ] **Step 1: Add shared dual-detection types**

Add scan-level sub-status and integrated report sections so one `Scan` can expose DOE and composition results together.

- [ ] **Step 2: Update client API helpers**

Make `getScan` and `listScans` the primary integrated workflow endpoints, and keep report APIs only for compatibility/download support.

- [ ] **Step 3: Remove the hard split in server orchestration**

Replace the current `createScan` rejection for `['exposure', 'fuzzing']` with unified orchestration that can launch one or both backends and aggregate their outputs.

- [ ] **Step 4: Preserve old report lookup compatibility**

Keep server helpers able to resolve report downloads/details from integrated scan data so old routes can redirect safely.

### Task 2: Implement unified scan execution and aggregation on the server

**Files:**
- Modify: `frontend/lib/server/scan-service.ts`
- Modify: `frontend/lib/server/agentraft-service.ts`
- Modify: `frontend/lib/server/mtatlas-service.ts`
- Modify: `frontend/app/api/scans/route.ts`
- Modify: `frontend/app/api/scans/[id]/route.ts`
- Modify: `frontend/app/api/scans/[id]/logs/route.ts`
- Modify: `frontend/app/api/reports/route.ts`
- Modify: `frontend/app/api/reports/[id]/route.ts`
- Modify: `frontend/app/api/reports/[id]/download/route.ts`

- [ ] **Step 1: Expose backend-specific detail readers**

Add server helpers to read DOE and MTAtlas scan/report data independently without forcing page code to know each backend layout.

- [ ] **Step 2: Create unified scans**

Make one scan record own the shared metadata input, selected checks, DOE config, and the child execution ids for DOE/MTAtlas when those sub-runs are started.

- [ ] **Step 3: Aggregate scan detail and status**

Build one integrated scan response that includes overall status, per-check progress, findings summary, and downloadable raw artifacts.

- [ ] **Step 4: Redirect legacy report API reads**

Change old report APIs to resolve the parent scan or return compatibility payloads sourced from integrated scan data.

### Task 3: Refactor homepage and app shell navigation

**Files:**
- Modify: `frontend/app/(main)/page.tsx`
- Modify: `frontend/components/common/app-shell.tsx`
- Modify: `frontend/app/globals.css` (if needed)

- [ ] **Step 1: Center all homepage capability card contents**

Update card layout so icon, heading, description, and CTA align centrally.

- [ ] **Step 2: Point DOE and composition cards to the same entry**

Both cards should navigate to `/scans/new`, while `skillpecker` remains unchanged.

- [ ] **Step 3: Remove the standalone report nav entry**

Keep only `首页`, `Skill 可信安全检测`, and `任务` in the main nav and update the home secondary CTA to `查看任务`.

### Task 4: Rebuild the scans new/list/detail pages around the unified workflow

**Files:**
- Modify: `frontend/app/(main)/scans/new/page.tsx`
- Modify: `frontend/app/(main)/scans/page.tsx`
- Modify: `frontend/app/(main)/scans/[id]/page.tsx`
- Create or modify any small supporting presentational code only if needed under `frontend/components/common` or `frontend/components/ui`

- [ ] **Step 1: Turn new scan into a unified form**

Replace mode selection with one combined form: task name, shared metadata input, advanced DOE source/sink configuration, enabled-check summary, and one submit action.

- [ ] **Step 2: Update the scans list wording and metrics**

Reframe the page around unified analysis tasks, showing selected checks and result availability without a separate reports mental model.

- [ ] **Step 3: Convert scan detail into an integrated report page**

Show overall header, per-check execution progress, executive summary, DOE section, composition section, raw artifacts, and keep logs accessible.

- [ ] **Step 4: Keep rerun/cancel/download actions coherent**

Ensure rerun copies unified inputs, cancel works for active child runs, and downloads expose integrated JSON/PDF where available.

### Task 5: Retire standalone report pages in favor of redirects

**Files:**
- Modify: `frontend/app/(main)/reports/page.tsx`
- Modify: `frontend/app/(main)/reports/[id]/page.tsx`

- [ ] **Step 1: Redirect report index to scans**

Make `/reports` leave the main flow and send users to `/scans`.

- [ ] **Step 2: Redirect report detail to parent scan detail**

Make `/reports/[id]` resolve the owning scan and redirect there; if it cannot resolve, send users to `/scans`.

### Task 6: Verify behavior

**Files:**
- No code changes required unless verification reveals defects

- [ ] **Step 1: Run lint or targeted type/build verification**

Run the strongest available frontend verification command that fits the repo state.

- [ ] **Step 2: Re-check the approved spec against the diff**

Confirm the implementation matches the approved design: centered homepage cards, no report nav, unified new scan flow, unified detail page, `skillpecker` untouched.
