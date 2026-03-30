---
name: taskwarrior-issue-tracking
description: Use Taskwarrior v3 as a CLI issue tracker for agent workflows, including task creation, triage, status updates, and completion. Use when organizing local/offline issue tracking without Git integration or running a shared Taskwarrior workflow for multiple agents.
---

# Taskwarrior Issue Tracking

## Overview

Use Taskwarrior v3 as a lightweight, offline-capable issue tracker for agents. Treat each issue as a Taskwarrior task with project/tag metadata and explicit status transitions. Follow the workflow to keep work moving until all assigned tasks are finished.

## Workflow

1) Identify the current project and list available work
- Use a consistent project naming convention based on the `origin` remote: `project:repo:<host>/<owner>/<repo>` (e.g., `project:repo:github.com/peter-jerry-ye/skills`)
- If the repo has no remote yet, fall back to a home-relative path: `project:path:Documents/cakes/skills`
- List available tasks: `task project:repo:github.com/peter-jerry-ye/skills` (pending by default)

2) Pick a task and claim it
- `task <id> modify +agent-codex`

3) Plan the work before execution
- Create dependency tasks instead of arrow plans.
- Example:
  - `task add project:repo:github.com/peter-jerry-ye/skills +ready "Step 1: gather context"`
  - `task add project:repo:github.com/peter-jerry-ye/skills +ready "Step 2: edit SKILL.md"`
  - `task add project:repo:github.com/peter-jerry-ye/skills +ready "Step 3: sanity check"`
  - `task <id-step3> modify depends:<id-step2>`
  - `task <id-step2> modify depends:<id-step1>`
- Include routine jobs as dependency tasks that block the final deliverable (e.g., lint/format/build/test).
- Make the final deliverable depend on all routine jobs and prerequisite steps.
- Example routine-job chain:
  - `task add project:repo:github.com/peter-jerry-ye/skills "Run cargo fmt"`
  - `task add project:repo:github.com/peter-jerry-ye/skills "Run cargo clippy"`
  - `task add project:repo:github.com/peter-jerry-ye/skills "Implement feature X"`
  - `task <id-feature> modify depends:<id-fmt>,<id-clippy>`

4) Create new tasks as needed
- `task add project:repo:github.com/peter-jerry-ye/skills "Fix parser crash"`

5) Work notes and updates
- `task <id> annotate "Found reproduction case"`
- `task <id> modify priority:H due:2025-01-15`
- If blocked, use dependencies (see "Blocked Work")

6) Complete work
- `task <id> done`
- Add a closing note first if needed: `task <id> annotate "Merged fix and verified"`

7) Follow-ups
- Create follow-up tasks for deferred work instead of leaving comments in Git.

8) Continue until all assigned tasks are finished
- Do not stop while tasks you own are blocked by unmet dependencies.
- When assigned a task, work through and complete its dependencies so it becomes unblocked, then complete the task itself.

## Command Mapping

- Find work: `task project:repo:<host>/<owner>/<repo> +ready`
- Show task details: `task <id> info`
- Claim work: `task <id> modify +agent-<name>`
- Blocked work: add dependencies and use `task blocked` / `task blocking` reports
- Close work: `task <id> done` (completed)

## Conventions

- **Statuses**: rely on Taskwarrior built-ins (`pending`, `waiting`, `completed`), avoid custom status tags.
- **Blocked work**: represent blockers with `depends:` and query with `task blocked` / `task blocking`.
- **Ownership**: encode agent identity in tags, e.g. `+agent-codex`, `+agent-alice`.
- **Project scope**: use `project:repo:<host>/<owner>/<repo>` and fall back to `project:path:<home-relative>` when no remote exists.
- **Linking**: include relevant file paths or IDs in annotations.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create tasks for anything that needs follow-up
   - `task add project:repo:<host>/<owner>/<repo> +ready "Follow-up: <short title>"`
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update blocked items
   - `task <id> done`
   - Add dependencies for blocked tasks and annotate the blocker
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Blocked Work

- Use dependencies instead of custom status tags.
- Example:
  - `task <id-blocked> modify depends:<id-blocker>`
  - `task blocked` to list blocked tasks
  - `task blocking` to list blocker tasks

## Work Until Finished

- Keep working until all tasks you own are `done` or have explicit dependencies with a blocker task created.
- If a task depends on another, split it into a new task and block the current one with a clear annotation.
