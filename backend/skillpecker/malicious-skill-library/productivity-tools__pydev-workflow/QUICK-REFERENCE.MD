# pydev-workflow: Quick Reference

> Single-page cheat sheet for rapid lookup

---

## Workflow Triggers

| Action | Phrase |
|--------|--------|
| Start new project | `Initialize pydev-workflow for [project name]` |
| Resume project | `Continue pydev-workflow. Read CLAUDE.md first.` |
| Check status | `Read CLAUDE.md and show current status` |
| Start feature | `Run pydev-feature for [TODO]` |
| Jump to step | `Continue pydev-workflow at step [XX]` |

---

## Workflow Steps

| Step | ID | Output |
|------|----|--------|
| 01 | project-init | PROJECT_FOUNDATION.md, CLAUDE.md, DEV_LOG.md |
| 02 | system-architecture | ARCHITECTURE.md |
| 03 | data-models | Data model definitions |
| 04 | core-logic | Core business logic |
| 05 | interfaces | API/interface definitions |
| 06 | impl-plan | IMPLEMENTATION_PLAN.md |
| 07 | implementation | Source code (triggers pydev-feature) |
| 08 | test-strategy | TEST_STRATEGY.md |
| 09 | test-impl | Test files |
| 10 | integration | Integrated system |
| 11 | documentation | README.md, docs |
| 12 | deployment | Deploy config |

---

## pydev-feature Steps

| Step | Purpose |
|------|---------|
| 01 | Task Analysis |
| 02 | Feature Design |
| 03 | Implementation |
| 04 | Testing |
| 05 | Integration |
| 06 | Cleanup & Docs |

---

## 80% Certainty Rule

| Certainty | Action |
|-----------|--------|
| ≥ 80% | Execute autonomously, document decisions |
| < 80% | Stop, explain uncertainty, ask specific questions |

---

## Git Config

```bash
git config user.email "isa.lucia.sch@gmail.com"
git config user.name "luvisaisa"
```

---

## Commit Types

| Type | Use For |
|------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `test:` | Test changes |
| `refactor:` | Code restructuring |
| `docs:` | Documentation |
| `config:` | Configuration |
| `plan:` | Planning documents |

**Format**: `<type>: <component> - <short description>`

---

## TODO Hierarchy

| Level | Scope | Commit Trigger |
|-------|-------|----------------|
| Major Task | Feature/component | After all mid-level complete |
| Mid-level Task | Concrete deliverable | After completion |
| Minor Task | Specific action | Part of mid-level commit |

---

## Documentation Rules

| Rule | Description |
|------|-------------|
| Consolidate | Update existing files, don't create new ones |
| Diagrams | Use Mermaid.js for all visuals |
| Timestamps | All doc changes must be timestamped |
| Dev log | Log all implementations in DEV_LOG.md |
| Comments | Always lowercase, no emojis |

---

## Core Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Best practices, read first always |
| `PROJECT_FOUNDATION.md` | Project definition and scope |
| `ARCHITECTURE.md` | System design, component map |
| `IMPLEMENTATION_PLAN.md` | Build sequence, progress tracking |
| `DEV_LOG.md` | Timestamped development history |
| `TEST_STRATEGY.md` | Testing approach and coverage |
| `README.md` | User-facing documentation |

---

## Common Commands

| Command | Description |
|---------|-------------|
| `/verify` | Run tests, types, lint |
| `/commit` | Generate commit message |
| `/checkpoint` | Force progress checkpoint |
| `/test [target]` | Run tests with coverage |
| `/debug [issue]` | Structured debugging |

---

## Quick Checks

```bash
# verify before commit
pytest --tb=short && mypy . && ruff check .

# check what's changed
git diff --stat

# check workflow status
cat CLAUDE.md | head -50
```

---

## Emergency Commands

| Situation | Command |
|-----------|---------|
| Undo last commit | `git reset --soft HEAD~1` |
| Stash current work | `git stash push -m "WIP: description"` |
| Restore stash | `git stash pop` |
| Discard all changes | `git checkout -- .` |
| Check recent commits | `git log --oneline -10` |
