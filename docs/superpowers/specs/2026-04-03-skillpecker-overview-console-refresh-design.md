# SkillPecker Overview And Console Refresh Design

## Goal

Refine the native SkillPecker routes so the module structure is clearer and the visual language more closely matches the original SkillPecker experience from `master`.

This refresh removes duplicated overview content, renames the primary introduction route to `/skillpecker/overview`, restores the original homepage-style information architecture, and reworks the console into the original vertical upload-plus-queue layout.

## Route Changes

The SkillPecker route set should be:

- `/skillpecker`
- `/skillpecker/overview`
- `/skillpecker/console`
- `/skillpecker/library`

### `/skillpecker`

This route should no longer act as a standalone landing page with its own preview content.

It should redirect to `/skillpecker/overview` so there is only one authoritative overview route and no duplicated "module overview" versus "module introduction" content.

### `/skillpecker/overview`

This route replaces the previous `/skillpecker/intro` page and becomes the single overview page for the module.

The navigation label should be `工具总览`.

### Removed Route Concept

The separate `模块介绍` concept should be removed from the route navigation and page hierarchy.

## Overview Page Design

The new overview page should preserve the visual identity of the original SkillPecker homepage while remaining a fully native React page.

### Content Structure

The page should contain exactly three major sections:

1. Hero introduction
2. Three capability cards
3. Analytics dashboard

### Hero Introduction

The hero copy should use the following Chinese text:

- `SkillPecker`
- `面向 Agent Skill 的安全可信检测套件`
- `基于用户意图解析与行为分析，精准识别权限滥用、隐蔽数据访问与潜在恶意路径`

This section should keep the same technical, glassmorphism-heavy tone as the legacy homepage rather than adopting a generic product dashboard look.

### Capability Cards

Immediately below the hero, render three square cards styled as close as practical to the original homepage bento cards.

The three cards should present:

- 异步任务队列
- 意图驱动检测
- 持久化样本库

These cards should be informational only. They should not act as route-preview cards and should not introduce additional module-jump CTAs inside the overview page.

### Analytics Dashboard

Below the capability cards, render the legacy homepage analytics layout:

- Three summary metric cards across the top
- Two chart cards in the next row
- One wide chart card across the bottom

Required chart titles:

- `问题类型分布`
- `主风险类别`
- `问题Skill业务分类TOP10`

The previous native overview content should be removed:

- Recent jobs list
- Recent sample list
- Route-preview card grid

### Visual Constraints

The page should stay close to the old SkillPecker homepage style in:

- Typography emphasis
- Card radii and glass backgrounds
- Blue, orange, red chart accents
- Spacious chart containers

It should not reproduce the old scroll-jacking or stage-based wheel handling.

## Console Page Design

The console should move from the current side-by-side layout back to the original vertical structure:

1. Upload and status launchpad at the top
2. Task queue below

### Top Launchpad

The upper panel should visually resemble the original scan console:

- Left side: scan title, description, queue counters, and step cards
- Right side: upload form with archive/folder mode switch and selected package summary

This remains a single top section, but the full page structure is vertical because the task queue sits underneath rather than beside it.

### Queue Section

The queue should occupy its own full-width section below the launchpad.

Queue cards should preserve the original hierarchy:

- Job identifier
- Timestamp
- Status chip
- Summary counts
- Result view action

## Result Dialog Design

The result dialog should become larger and visually closer to the original modal.

### Size

Increase the modal width beyond the first native version so it feels like a workspace, not a narrow detail drawer.

### Layout

Preserve a two-column structure:

- Left: skill list and selection state
- Right: active skill findings and evidence

### Content Treatment

The right-side panel should more closely mirror the original SkillPecker result style:

- Stronger hierarchy for current skill name
- Prominent verdict and confidence-related pills
- Larger finding cards
- Evidence sections that read like investigation records

The modal should still remain native React and use typed API data. It should not reintroduce raw legacy HTML rendering or imperative DOM injection.

## Data And Component Changes

### Route And Navigation

- Rename the intro page component responsibility to overview
- Replace `/skillpecker/intro` links in the section nav
- Update active navigation labels to `工具总览`, `扫描控制台`, `恶意 Skill 库`

### Overview Components

The existing overview implementation should be simplified and restyled rather than extended.

Expected outcomes:

- Remove route-preview components from overview usage
- Remove recent-job and recent-sample blocks
- Add homepage-style capability cards
- Restructure chart cards to match the legacy layout

### Console Components

The console implementation should be restructured without changing backend integration:

- Keep the existing upload mutation
- Keep queue polling
- Keep job detail and skill result queries
- Rebuild the layout and presentation to match the legacy console

### Dialog Components

The result dialog should keep its existing data flow but adopt a larger visual frame and more investigation-oriented card styling.

## Verification

Verification for this refresh must confirm:

- `/skillpecker` redirects to `/skillpecker/overview`
- The navigation no longer shows `模块介绍`
- `/skillpecker/overview` no longer contains recent jobs, recent samples, or preview-jump cards
- `/skillpecker/overview` shows the required hero copy, three capability cards, and three analytics chart sections
- `/skillpecker/console` renders as top launchpad plus bottom queue
- The result dialog is visibly larger and preserves left skill navigation plus right investigation content
- `npm exec tsc --noEmit` passes
- `npm run build` passes
