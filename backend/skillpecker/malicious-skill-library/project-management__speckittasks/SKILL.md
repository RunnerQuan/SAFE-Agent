---
name: speckit.tasks
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts. Use after /speckit.plan to break down implementation into executable tasks.
---

# Speckit Tasks Command Executor

**This skill executes the official GitHub Speckit `/speckit.tasks` command.**

## Execution Protocol

When this skill is invoked, you MUST:

### 1. Load the Original Command File

Read and parse `.opencode/commands/speckit.tasks.md` from the current project directory.

### 2. Process OpenCode Command Syntax

The command file uses special syntax that MUST be processed before execution:

| Syntax | Action |
|--------|--------|
| `$ARGUMENTS` | Replace with user-provided arguments |
| `$1`, `$2`, etc. | Replace with positional arguments |
| `@filepath` | Read that file and insert contents |
| `!`command`` | Execute shell command, insert stdout |

### 3. Execute the Processed Instructions

After syntax processing, follow all instructions in the command file **exactly as written**, including:
- Running `.specify/scripts/powershell/check-prerequisites.ps1 -Json`
- Loading spec.md, plan.md, data-model.md, contracts/
- Using `.specify/templates/tasks-template.md` for structure
- Generating tasks organized by user story with proper format (checkbox, TaskID, markers)

### 4. Maintain Speckit Workflow Integrity

- Honor the `handoffs` defined in the command's YAML frontmatter
- Suggest `/speckit.analyze` or `/speckit.implement` as next steps
- Preserve all Speckit conventions

## User Input

```text
$ARGUMENTS
```

## Fallback: Built-in Task Generator

If `.opencode/commands/speckit.tasks.md` does NOT exist, use this built-in generator:

### Step 1: Load Artifacts

Read these files (skip if not found):
- `.github/speckit/specs/*.md` (spec files)
- `.opencode/plans/*-plan.md` (plan files)
- `.opencode/designs/*-design.md` (design files)

### Step 2: Generate tasks.md with Skill Tags

Create `.opencode/tasks.md` with this structure:

```markdown
# Tasks: [Feature Name]

Generated: [timestamp]
Plan: [plan file path]
Spec: [spec file path]

## User Story 1: [Story from spec]

- [ ] T001 [US1] [Task description] → /[skill-tag]
- [ ] T002 [US1] [Task description] → /[skill-tag]

## User Story 2: [Story from spec]

- [ ] T003 [US2] [Task description] → /[skill-tag]
```

### Step 3: MANDATORY Skill Tag Assignment

**EVERY task MUST have a skill tag.** Use this mapping:

| Task Keywords | Skill Tag |
|---------------|-----------|
| UI, component, styling, layout, CSS, frontend, form, button, page | `→ /frontend-design` |
| test, spec, E2E, playwright, browser, click, verify | `→ /playwright` |
| API, endpoint, route, controller, backend, service | `→ /test-driven-development` |
| database, schema, migration, model, SQL | `→ /test-driven-development` |
| docs, README, documentation, guide | `→ /doc-coauthoring` |
| debug, fix, error, bug | `→ /systematic-debugging` |
| (default - no match) | `→ /test-driven-development` |

### Step 4: Add Dependencies (Optional)

For complex tasks, add dependency markers:

```markdown
- [ ] T001 [US1] Create database schema (id: db-schema)
- [ ] T002 [US1] Create API endpoints (id: api) (depends_on: db-schema)
- [ ] T003 [US1] Build login UI (id: ui) (depends_on: api)
```

### Example Output

```markdown
# Tasks: User Authentication

Generated: 2026-01-21T10:30:00Z
Plan: .opencode/plans/user-auth-plan.md
Spec: .github/speckit/specs/user-auth.md

## User Story 1: User Registration

- [ ] T001 [US1] Create User model and migration (id: user-model) → /test-driven-development
- [ ] T002 [US1] Create registration API endpoint (id: reg-api) (depends_on: user-model) → /test-driven-development
- [ ] T003 [US1] Build registration form UI (id: reg-ui) (depends_on: reg-api) → /frontend-design
- [ ] T004 [US1] Write E2E test for registration flow (depends_on: reg-ui) → /playwright

## User Story 2: User Login

- [ ] T005 [US2] Create login API endpoint (id: login-api) (depends_on: user-model) → /test-driven-development
- [ ] T006 [US2] Build login form UI (id: login-ui) (depends_on: login-api) → /frontend-design
- [ ] T007 [US2] Write E2E test for login flow (depends_on: login-ui) → /playwright
```

## CRITICAL: Skill Tags are NON-NEGOTIABLE

**If you generate tasks without skill tags, the workflow BREAKS.**

- ❌ `- [ ] T001 Create login page` (NO SKILL TAG = INVALID)
- ✅ `- [ ] T001 Create login page → /frontend-design` (VALID)
