# SkillPecker Frontend Integration Design

Date: 2026-04-02
Status: Approved in conversation, pending user review of written spec

## Overview

This design updates the SAFE-Agent `/skillpecker` page to reduce the current "embedded external page" feel and reposition SkillPecker as a native SAFE-Agent research module. The selected direction is:

- Architecture: Mixed native shell plus partial embedded business surfaces
- Priority: Brand consistency and visual cohesion first
- Tone: Research platform / academic technology
- Layout: B1 vertical research-board layout

The goal is not to rewrite SkillPecker end-to-end in one step. The first implementation stage should native-ize the page framing, information architecture, and key presentation layers while keeping the core scanning functionality intact.

## User-Confirmed Decisions

The following decisions were explicitly confirmed in the conversation:

1. Prefer deep integration over a simple wrapper polish.
2. Prioritize brand consistency and page look-and-feel before workflow optimization.
3. Keep the existing Chinese and English descriptive copy instead of rewriting product language.
4. Use the mixed integration strategy rather than full immediate rewrite.
5. Use the B1 vertical research-board layout.
6. Adopt a research-platform / academic-technology visual tone instead of enterprise SaaS dashboard styling.

## Problem Statement

The current `/skillpecker` page is visually functional but feels like an extra page embedded inside SAFE-Agent rather than a native module. The root issue is structural:

- The page shell is SAFE-Agent.
- The main content is still a full SkillPecker landing page embedded through `iframe`.
- The outer glass-card styling and inner standalone homepage compete with each other.
- The current tab layout emphasizes "switching between embedded pages" instead of presenting a coherent module experience.

This creates brand fragmentation, duplicated hero content, and a weak sense of hierarchy.

## Design Goals

### Primary Goals

1. Make SkillPecker feel like a first-class SAFE-Agent module.
2. Preserve the existing SkillPecker scanning capability with minimal functional risk.
3. Replace the current embedded-homepage-first experience with a native SAFE-Agent-first experience.
4. Keep the selected research-platform visual tone consistent with SAFE-Agent's existing aesthetic direction.

### Secondary Goals

1. Create a page structure that supports gradual future native replacement of more SkillPecker surfaces.
2. Improve readability and narrative flow so users understand the module before entering the scan console.
3. Reduce the visual harshness of the iframe boundary.

### Non-Goals

1. Do not fully rewrite all SkillPecker functionality in this iteration.
2. Do not change backend scanning behavior.
3. Do not change existing product copy unless required by layout constraints.
4. Do not introduce unrelated refactors to other SAFE-Agent modules.

## Selected Architecture

The `/skillpecker` page will become a native SAFE-Agent page with four vertical sections:

1. Native Hero
2. Native Research Overview Band
3. Scan Workbench Section
4. Malicious Skill Library Section

The "tool intro" tab will be removed as an embedded full-page experience. Instead, its role is replaced by the native Hero and overview sections.

The remaining embedded surfaces are narrowed to only the business-heavy content that is still expensive or risky to reimplement immediately.

## Page Structure

### 1. Native Hero

Purpose:

- Establish `/skillpecker` as a SAFE-Agent research module.
- Present SkillPecker in the SAFE-Agent visual language before any embedded content appears.
- Retain the user's current Chinese and English descriptions.

Content:

- Module label such as SAFE-Agent research module metadata
- Main title using the existing SkillPecker naming
- Existing descriptive copy, unchanged in wording
- Primary CTA: begin detection / enter workbench
- Secondary CTA: view sample library
- Three native capability cards that summarize the existing module highlights

Visual intent:

- A composed research-board hero rather than a standalone product landing page
- Controlled typography hierarchy and structural framing
- Background grid, linework, or subtle coordinate cues that suggest analysis and experimentation

### 2. Native Research Overview Band

Purpose:

- Replace the need for an embedded intro homepage
- Explain the module in concise, native SAFE-Agent terms
- Bridge the page from brand framing into actual work areas

Content candidates:

- Detection object
- Analysis method
- Risk focus
- Output artifacts
- Capability highlights already represented by the current intro cards

Presentation:

- Three or four horizontal information cards
- Short labels and supporting descriptions
- Consistent card language with the SAFE-Agent homepage

### 3. Scan Workbench Section

Purpose:

- Make scanning the main workflow center of the page
- Let SAFE-Agent own the framing while SkillPecker continues to power the heavy business UI

Structure:

- Native section heading
- Native explanatory copy above the embedded business surface
- Optional small status strip or process note
- Embedded scan console content below

Important constraint:

- The embedded content remains in place for now, but it should no longer be the page's first impression
- The outer container must visually absorb the embedded content so it reads as a workbench panel

### 4. Malicious Skill Library Section

Purpose:

- Position the library as a research resource inside the same module narrative
- Avoid treating it as a separate website tab

Structure:

- Native section heading
- Native explanatory copy
- Embedded library content

Presentation:

- Use the same framing language as the scan workbench for consistency
- Keep transitions and spacing calm and research-like rather than dashboard-like

## Layout Decision: B1 Vertical Research Board

The approved page layout is the B1 vertical research-board format.

Why this was selected:

1. It best supports the primary goal of improving brand consistency.
2. It turns the page into a readable narrative rather than a tabbed embed shell.
3. It fits the selected research-platform tone better than a dense split-pane dashboard.
4. It allows incremental replacement of embedded surfaces without redesigning the whole page again.

Expected reading flow:

1. Understand the module
2. Understand the research framing
3. Enter scanning
4. Explore the malicious skill library

## Visual Language

### Tone

The page should look like a research platform or academic technology module, not a generic enterprise SaaS dashboard.

### Visual Principles

1. Preserve SAFE-Agent's warm-to-cool ambient background direction.
2. Add subtle scientific structure cues such as grids, linework, coordinates, or diagram-like framing.
3. Use restrained glass surfaces, light borders, and soft shadowing.
4. Avoid loud marketing-block styling and avoid heavy operational dashboard density.
5. Treat SkillPecker as a module within SAFE-Agent, not as a visually separate sub-brand homepage.

### Copy Handling

The existing Chinese and English descriptions should be preserved as-is unless exact layout constraints require line-breaking adjustments only.

## Interaction Design

### Remove Current Tab-First Model

The current top-level tab structure emphasizes switching entire embedded pages:

- Tool intro
- Scan console
- Library

This should be replaced with vertical section flow. The user should scroll through a native page rather than feel they are navigating a shell around an iframe application.

### New Interaction Flow

1. User lands on native Hero and overview
2. User chooses to start detection or scroll to workbench
3. User interacts with the embedded scan console inside a native SAFE-Agent section
4. User scrolls to or jumps to the sample library section as needed

### Anchors and Navigation

Lightweight in-page anchor navigation is acceptable if needed, but it should feel like section navigation, not page-mode switching.

## Implementation Scope for First Iteration

### In Scope

1. Replace the current intro iframe section with a native SAFE-Agent Hero and overview.
2. Restructure `/skillpecker` into vertical sections.
3. Keep only the scan console and malicious skill library as embedded business areas.
4. Redesign containers, spacing, framing, and section hierarchy to align with SAFE-Agent.
5. Maintain responsive behavior across desktop and mobile.

### Out of Scope

1. Rebuilding the full scan console natively.
2. Rebuilding the full sample library natively.
3. Backend API changes.
4. Product copy rewrite.

## Technical Design Notes

### Existing Situation

The current page is driven by top-level tabs and multiple iframe sources, including a full intro page. This causes duplicated hierarchy and visual competition.

### First-Stage Frontend Direction

The implementation should:

- Remove the intro tab and its iframe source from the page
- Replace the intro area with native React markup
- Keep the console and library embedded in separate native sections
- Reuse existing SAFE-Agent UI components where possible
- Reuse existing background and glass language already present in the homepage and shell

### Embedding Strategy

The iframe should become a business surface, not the page identity.

This means:

- Framing containers need stronger integration
- Section headings and context live outside the iframe
- Vertical spacing and transitions should reduce abrupt visual jumps
- The page must still handle iframe height updates and scrolling behavior safely

## Risks

1. The embedded content may still visually clash if the inner SkillPecker styling is too strong.
2. Removing tabs may require replacing some quick switching behavior with anchors or scroll-based access.
3. Responsive layout needs careful handling so the native Hero and overview remain valuable on smaller screens.

## Mitigations

1. Limit visible embedded surfaces to business-heavy areas only.
2. Use strong native section framing before each embedded area.
3. Preserve existing height synchronization and message handling logic unless a safer replacement is verified.
4. Validate desktop and mobile layouts explicitly.

## Acceptance Criteria

The first iteration is successful if all of the following are true:

1. `/skillpecker` no longer opens with an embedded SkillPecker homepage.
2. The page starts with a native SAFE-Agent Hero and overview area.
3. The existing descriptive copy remains intact.
4. The scan workbench and malicious skill library still function.
5. The page feels like a SAFE-Agent module rather than a nested external page.
6. Desktop and mobile layouts are both usable and visually coherent.

## Follow-Up Opportunities

After this first integration stage, future iterations may:

1. Add native recent-task summaries above the embedded console
2. Add native sample-library previews before full library entry
3. Gradually replace more embedded functionality with native SAFE-Agent components

## Review Notes

This spec intentionally keeps the implementation focused on presentation integration and incremental native-ization. It avoids expanding into a full product rewrite and preserves the selected direction confirmed by the user in conversation.
