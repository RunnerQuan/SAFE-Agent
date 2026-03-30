---
name: os-tk-plan-review
description: Review a project/refactor plan with fresh eyes using a separate model. Use after /os-tk-plan.
---

# /os-tk-plan-review

## Inputs
- Plan text (from `$ARGUMENTS`)
- Optional `--file <path>`
- Optional `--approve <plan-id>` to approve a plan (no review)
- Optional `--reject <plan-id>` to reject a plan (no review)
- Optional `--pending <plan-id>` to mark plan pending (no review)
- Optional `--validate-plan <plan-id>` to require approved plan status

## Resolve skill dir
```bash
SKILL_DIR=".pi/skills/os-tk-plan-review"
if [[ ! -d "$SKILL_DIR" ]]; then SKILL_DIR="pi/skills/os-tk-plan-review"; fi
```

## Parse arguments
- Use `$ARGUMENTS` for plan text unless `--file` is provided
- If `--approve/--reject/--pending` is provided: run approval and STOP
- If `--validate-plan` is provided: validate approval status before review

## Approval actions (NEW)
If any of these flags are present, run approval and STOP:
- `--approve <plan-id>`
- `--reject <plan-id>`
- `--pending <plan-id>`

Run:
```bash
bash "$SKILL_DIR/scripts/approve-plan.sh" --plan-id <plan-id> --approve|--reject|--pending
```

## Validate plan approval (NEW)
If `--validate-plan <plan-id>` is provided, check approval status:
```bash
bash "pi/skills/os-tk-proposal/scripts/check-approved-plan.sh" --validate-plan --plan-id <plan-id>
```

If validation fails, STOP with error.

## Load plan
- If `--file` provided, use `read` to load that file.
- Else use the latest plan from conversation; if missing, ask user to paste the plan.

## Fresh-eyes review (subagent)
Invoke the review subagent via the **pi-async-subagents** tool `subagent`:
```
subagent({
  "agent": "os-tk-plan-reviewer",
  "task": "Review this project plan with fresh eyes. Be concise. Plan:\n<PLAN_TEXT>",
  "agentScope":"both",
  "async": false
})
```

## Output
- Return reviewer output verbatim.
- Do not rewrite the plan here.

## Approval workflow (summary)
1. Create plan with `/os-tk-plan`
2. Approve plan with `/os-tk-plan-review --approve <plan-id>`
3. Create proposal with `/os-tk-proposal --require-plan` (checks approved plan)

## Approvals file
- `.os-tk/plan-approvals.json`
- Schema: `{ "approvals": { "planId": { "status", "reviewedBy", "reviewedAt", "updatedAt" } } }`
- Status values: `approved`, `pending`, `rejected`
