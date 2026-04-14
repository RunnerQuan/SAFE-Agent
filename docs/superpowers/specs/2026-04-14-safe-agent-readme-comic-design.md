# SAFE-Agent README Comic Design

Date: 2026-04-14
Topic: SAFE-Agent project introduction comic images for GitHub README
Status: Draft for user review

## Goal

Create three comic-style PNG images for the SAFE-Agent GitHub README to explain the project's purpose, core detection modules, and platform architecture at a glance.

The images should help a first-time repository visitor quickly understand:

- what SAFE-Agent is
- what three security problems it targets
- how the three detection modules map to those problems
- how the frontend, proxy layer, and backend services fit together

## Source Context

The design is grounded in the current repository materials, primarily:

- `README.md`
- `frontend/package.json`
- `backend/skillpecker/`
- `backend/agentRaft/`
- `backend/MTAtlas/`

The README defines SAFE-Agent as an AI Agent security and compliance detection platform and presents three core modules:

- `SkillPecker`: 恶意技能检测
- `AgentRaft`: 数据过度暴露检测
- `MTAtlas`: 组合式漏洞检测

## Output Scope

Produce exactly three horizontal comic images in `16:9` ratio.

Final output directory:

- `docs/readme-assets/`

Planned filenames:

- `01-what-safe-agent-detects.png`
- `02-three-detection-modules.png`
- `03-platform-architecture.png`

## Visual Direction

### Style

- Comic style: `spyfamily`
- Tone: security audit, intelligence dossier, investigation room, mission dashboard
- Visual emphasis: characters plus information graphics
- Intended use: GitHub README display, not standalone poster art

### Language Rules

- Body copy should be Chinese
- Keep required product and module names in English where needed
- Preserve terms such as `SAFE-Agent`, `SkillPecker`, `AgentRaft`, `MTAtlas`, `Next.js`, `React`, `Tailwind`, `Python`

### Readability Rules

- Each image should contain one dominant title
- Each image should contain only `3-5` short information points
- Text density must stay low enough to remain readable inside GitHub README image scaling
- Avoid dense paragraphs and fine print

## Narrative Structure

The three images should form a clear progression:

1. Why SAFE-Agent exists
2. What the three detection modules do
3. How the platform architecture delivers those capabilities

This sequence is optimized for README scanning behavior: problem first, capabilities second, implementation structure third.

## Image Design

### Image 1

Filename:

- `01-what-safe-agent-detects.png`

Working title:

- `SAFE-Agent 在检测什么？`

Purpose:

- Introduce the platform in one screen
- Establish the three target risk categories
- Frame SAFE-Agent as an AI Agent security and compliance detection platform

Scene:

- Intelligence archive room or mission control wall
- Central dossier or large screen labeled `SAFE-Agent`
- Character presence supports the scene but does not dominate it

Information points:

- `恶意技能`
- `数据过度暴露`
- `组合式漏洞`
- `AI Agent 安全合规检测平台`

Visual composition:

- Left or center: character examining AI Agent risk dossiers
- Right: risk board with three highlighted risk categories
- Bottom or side: short platform定位收束语

Recommended caption style:

- Short labels, no long explanatory sentences
- Focus on classification and recognition rather than technical detail

### Image 2

Filename:

- `02-three-detection-modules.png`

Working title:

- `三大检测模块`

Purpose:

- Map each module directly to its detection responsibility
- Make the product structure legible in one pass

Scene:

- Mission board or split intelligence panels
- Three module cards aligned horizontally or triangularly
- Characters act as guides, not the primary subject

Required module mapping:

- `SkillPecker` ↔ `恶意技能检测`
- `AgentRaft` ↔ `数据过度暴露检测`
- `MTAtlas` ↔ `组合式漏洞检测`

Supporting information points:

- `多智能体评估`
- `Source-Sink 分析`
- `静态污点分析 + Fuzzing`

Visual composition:

- Three large module blocks
- Each block gets a short Chinese subtitle
- Each block includes one simplified mini-diagram or symbolic visual cue

Content rule:

- This image should not describe the modules as vague "collaboration"
- It should present them as three concrete detection capabilities

### Image 3

Filename:

- `03-platform-architecture.png`

Working title:

- `平台架构一图看懂`

Purpose:

- Explain how the UI, proxy layer, and backend services connect
- Show that the system is modular but unified

Scene:

- Operations console or control center
- Layered architecture board with clear vertical flow

Required architecture layers:

- Frontend: `Next.js`, `React`, `Tailwind`
- Middle layer: API proxy / routing / aggregation
- Backend: `SkillPecker`, `AgentRaft`, `MTAtlas`

Visual composition:

- Top layer: frontend technology stack
- Middle: proxy gateway
- Bottom: three Python detection services
- Flow lines should clearly connect top to bottom

Content rule:

- Emphasize "统一入口 + 模块化检测引擎 + 集中展示结果"
- Keep the architecture legible and simplified rather than code-level detailed

## Character Direction

Characters are present to maintain comic identity, but the page focus remains on system explanation.

Character rules:

- Use a restrained `spyfamily` aesthetic
- Avoid exaggerated action-combat framing
- Prefer dossier-reading, pointing, analyzing, or presenting gestures
- Characters should support trust, investigation, and professional intelligence vibes

## README Placement Plan

Recommended order inside `README.md`:

1. Insert Image 1 below the project introduction section
2. Insert Image 2 near the core capabilities section
3. Insert Image 3 near the architecture section

Each image can be paired with a short section heading for scanability.

## Non-Goals

- No dense tutorial-style explanation
- No full end-to-end usage guide inside the images
- No overly decorative action poster with weak technical content
- No bilingual body text unless explicitly requested later

## Acceptance Criteria

The design succeeds if:

- a new GitHub visitor can understand the project in under one minute
- the three module names are memorable and correctly mapped to their functions
- the architecture image communicates the frontend-proxy-backend layering clearly
- all three images feel visually consistent as one README set
- text remains readable after README embedding

## Implementation Notes

The implementation phase should produce:

- image prompts for all three images
- final PNG outputs in `docs/readme-assets/`
- optional README insertion snippet if needed after generation

## Self-Review

- No placeholder sections remain
- The module mapping is explicit and matches the user-approved wording
- Output path is explicit: `docs/readme-assets/`
- Scope is constrained to exactly three README images
