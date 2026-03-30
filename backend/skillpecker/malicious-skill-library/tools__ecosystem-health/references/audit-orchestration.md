# Audit Orchestration Reference

This document provides detailed guidance for orchestrating audits efficiently.

**Schema v2.2** introduces **tiered validation** - minor changes (features) use targeted validation, major changes (security, behavior) require full audits.

## Available Audit Commands

| Component | Command | Smart Mode |
| --------- | ------- | ---------- |
| skills | `/audit-skills` | `--smart` |
| agents | `/audit-agents` | `--smart` |
| commands | `/audit-commands` | `--smart` |
| hooks | `/audit-hooks` | `--smart` |
| mcp | `/audit-mcp` | N/A |
| memory | `/audit-memory` | N/A |
| plugins | `/audit-plugins` | `--smart` |
| settings | `/audit-settings` | N/A |
| output-styles | `/audit-output-styles` | `--smart` |
| statuslines | `/audit-statuslines` | `--smart` |
| rules | `/audit-rules` | `--force` |
| lsp | `/audit-lsp` | `--force` |

## Severity-Based Validation Routing (v2.2)

Schema v2.2 routes changelog changes through different validation paths based on severity.

### Change Severity Classification

| Change Type | Severity | Validation Path |
| ----------- | -------- | --------------- |
| `feature` | Minor | Targeted validation (keyword check) |
| `deprecation` | Minor | Targeted validation (keyword check) |
| `bugfix` | N/A | No validation needed |
| `behavior_change` | **Major** | **Full audit required** |
| `security` | **Major** | **Full audit required** |

### Validation Routing Decision Tree

```text
Changelog change detected
         │
         ▼
   ┌─────────────┐
   │ Change Type │
   └─────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 bugfix    other
    │         │
    ▼         ▼
 (skip)  ┌─────────────────┐
         │ Severity Check  │
         └─────────────────┘
               │
          ┌────┴────┐
          ▼         ▼
       MINOR     MAJOR
          │         │
          ▼         ▼
    ┌──────────┐ ┌───────────────┐
    │ Targeted │ │  Full Audit   │
    │Validation│ │   Required    │
    └──────────┘ └───────────────┘
          │              │
          ▼              ▼
    keyword_check   audit_command
```

### Targeted Validation (Tier 1)

For **minor changes** (feature, deprecation):

**Process:**

1. Load validation spec from `granular_changelog[version].changes[id].validation`
2. Extract `keywords` array and `target_skill`
3. Run grep against target skill files
4. Capture evidence (file, line, match text)
5. Calculate confidence based on match count

**Token Cost:** ~100-500 tokens per change

**Confidence Thresholds:**

| Match Count | Confidence | Recommendation |
| ----------- | ---------- | -------------- |
| 0 | FAILED | Cannot validate - run full audit |
| 1 | Medium | Acceptable with explicit confirmation |
| 2+ | High | Auto-confirmable |

**Example Validation Spec:**

```yaml
validation:
  method: "keyword_check"
  target_skill: "hook-management"
  keywords:
    - "additionalContext"
    - "PreToolUse.*additionalContext"  # Regex supported
  required_matches: 1
```

### Full Audit (Tier 2)

For **major changes** (behavior_change, security):

**Process:**

1. Load validation spec - `method: full_audit`
2. Identify required audit command from `audit_command` field
3. Present warning that targeted validation is insufficient
4. Execute full audit command (e.g., `/audit-settings`)
5. Update tracking with audit results

**Token Cost:** ~3,000-8,000 tokens per audit

**Example Validation Spec:**

```yaml
validation:
  method: "full_audit"
  target_skill: "permission-management"
  audit_command: "/audit-settings"
  reason: "Security fix - targeted validation insufficient"
```

### Periodic Review (Tier 3)

Independent of change severity, components become stale after 90 days:

**Trigger:** `days_since(last_audit) > 90`

**Action:** Full audit regardless of pending changes

**Rationale:** Drift detection, best practices alignment

## Priority System

### Priority 1: Never Audited

Components that have never been audited are highest priority.

**Detection:** `component_coverage[type].last_audit == null`

**Rationale:** Unknown state is highest risk.

### Priority 2: Affected by Changelog

Components affected by recent Claude Code changes.

**Detection:** `pending_updates[].affects contains type`

**Rationale:** Known changes may require updates.

### Priority 3: Stale (>90 days)

Components not audited in over 90 days.

**Detection:** `days_since(component_coverage[type].last_audit) > 90`

**Rationale:** May have drifted from best practices.

### Priority 4: Recent but Low Pass Rate

Components audited recently but with low pass rate.

**Detection:** `component_coverage[type].pass_rate < 0.8`

**Rationale:** Known issues need resolution.

## Batching Strategy

### Batch Size

**Recommended:** 3 audits per batch

**Rationale:**

- Limits token usage per batch
- Allows user to stop early if needed
- Provides natural checkpoints

### Batch Composition

**Best practice:** Mix priority levels per batch.

Example batch composition:

```text
Batch 1: [hooks (P1), skills (P2), agents (P3)]
Batch 2: [mcp (P3), commands (P2), memory (P1)]
Batch 3: [plugins (P3), settings (P3), output-styles (P3)]
```

### Progress Reporting

After each batch:

```text
Batch 1/3 Complete
==================
✓ hooks: PASS (12/12 passed)
✓ skills: PASS WITH WARNINGS (43/45 passed)
✗ agents: NEEDS ATTENTION (24/26 passed)

Continue with Batch 2? [Y/n]
```

## Token Estimation

### Per-Component Estimates

| Component | Typical Token Usage | With Smart Mode |
| --------- | ------------------- | --------------- |
| skills | ~8,000 | ~3,000 |
| agents | ~5,000 | ~2,000 |
| commands | ~6,000 | ~2,500 |
| hooks | ~3,000 | ~1,500 |
| mcp | ~2,000 | N/A |
| memory | ~2,500 | N/A |
| plugins | ~4,000 | ~1,500 |
| settings | ~1,500 | N/A |
| output-styles | ~2,000 | ~800 |
| statuslines | ~1,500 | ~600 |
| rules | ~2,000 | ~800 |
| lsp | ~1,500 | ~600 |

### Total Estimates

| Strategy | Estimated Tokens |
| -------- | ---------------- |
| Full audit (all 12) | ~40,000 - 55,000 |
| Smart audit (stale only) | ~12,000 - 25,000 |
| Targeted audit (1-3) | ~5,000 - 15,000 |

### Tiered Validation Estimates (v2.2)

| Validation Type | Per-Change Cost | Notes |
| --------------- | --------------- | ----- |
| Targeted (keyword) | ~100 - 500 | Grep + evidence capture |
| Full audit | ~3,000 - 8,000 | Complete component audit |

**Savings Comparison:**

| Scenario | Full Audits Only | Tiered Validation | Savings |
| -------- | ---------------- | ----------------- | ------- |
| 3 minor changes | ~15,000 | ~600 | 96% |
| 2 minor + 1 major | ~18,000 | ~4,600 | 74% |
| Periodic review (5 components) | ~40,000 | ~8,000 | 80% |

## Smart Mode Behavior

Commands with `--smart` flag only audit:

1. Components modified since last audit
2. Components never audited
3. Components with previous failures

This dramatically reduces token usage.

### Smart Mode Detection

```bash
# Check if command supports --smart
grep -l "smart" plugins/claude-ecosystem/commands/audit-*.md
```

## Tracking File Updates

### Full Audit Updates

After each full audit:

```yaml
component_coverage:
  [type]:
    last_audit: "YYYY-MM-DD"  # Today's date
    components_audited: N      # From audit output
    pass_rate: 0.XX           # Passed / Total
```

### Targeted Validation Updates (v2.2)

After each targeted validation:

```yaml
component_coverage:
  [type]:
    # Full audit tracking (unchanged)
    last_audit: "YYYY-MM-DD"
    audit_version: "X.Y.Z"
    components_audited: N
    pass_rate: 0.XX

    # Validation tracking (NEW in v2.2)
    last_validation: "YYYY-MM-DD"      # Today's date
    validation_version: "X.Y.Z"         # Claude Code version validated against
    validations_performed: N            # Count of keyword checks
    validations_passed: N               # Count that passed
    validation_confidence: "high"       # high | medium | low

    # Pending changes tracking (NEW in v2.2)
    pending_major_changes: []           # IDs requiring full audit
    pending_minor_changes: []           # IDs needing targeted validation
```

### Change Validation Result Updates

After validating individual changes:

```yaml
granular_changelog:
  "X.Y.Z":
    changes:
      - id: "X.Y.Z-NNN"
        # ... existing fields ...
        validation_result:
          validated: true                # true | false
          validated_date: "YYYY-MM-DD"
          evidence:
            - file: "path/to/file.md"
              line: 142
              match: "matched text snippet"
          confidence: "high"             # high | medium | low
```

### Parsing Audit Output

Most audit commands output:

```text
Audit Summary
=============
Total: 45
Passed: 43
Failed: 2
Pass Rate: 95.6%
```

Extract these values to update tracking file.

## Error Handling

### Audit Command Fails

```text
1. Log error with command and error message
2. Set component status to "error"
3. Continue with remaining audits
4. Report failures at end
```

### Partial Audit

```text
If audit times out or is interrupted:
1. Save partial results
2. Set status to "partial"
3. Recommend re-running
```

### Recovery

```text
If previous batch failed:
1. Check tracking file for last successful
2. Resume from failed component
3. Option to restart entire audit
```

## User Interaction Points

### Before Starting

```text
Audit Plan
==========
Priority 1 (never audited): hooks, memory
Priority 2 (changelog affected): skills, commands
Priority 3 (stale >90 days): agents, plugins

Estimated tokens: ~25,000
Estimated time: 5-10 minutes

Proceed? [Y/n/customize]
```

### After Each Batch

```text
Batch complete. Options:
[1] Continue to next batch
[2] Stop here (progress saved)
[3] Re-run failed audits
[4] View detailed results
```

### On Completion

```text
Audit Complete
==============
Components audited: 10/10
Overall pass rate: 94%
Token usage: ~28,000

Recommendations:
1. Fix 2 failing agents (see agents-audit.md)
2. Apply pending update: context fork
3. Schedule next audit: 2026-04-10
```

## Audit Log Integration

Read from existing audit logs:

```bash
# Find latest audit logs
ls -la .claude/audit/

# Structure
.claude/audit/
├── skills-audit.md
├── agents-audit.md
├── commands-audit.md
└── audit-summary.md
```

### Extracting Data

```text
From skills-audit.md:
- Last audit date (from header)
- Component count (from summary)
- Pass rate (from summary)
- Individual results (from table)
```

## Optimization Tips

1. **Start with --smart** - Always use smart mode first
2. **Target by changelog** - Audit what changed
3. **Batch by token cost** - Mix expensive and cheap audits
4. **Cache results** - Don't re-audit unchanged components
5. **Use tracking file** - Skip recently-audited components

### Tiered Validation Optimization (v2.2)

6. **Use targeted validation for minor changes** - 96% token savings
7. **Reserve full audits for major changes** - Security/behavior changes warrant cost
8. **Batch minor validations** - Process multiple keyword checks together
9. **Track confidence levels** - High confidence = auto-confirm, medium = explicit confirm
10. **Don't over-validate** - Bugfixes need no validation

### Validation Workflow Order

**Optimal processing order for pending changes:**

1. **Skip bugfixes** - No validation needed
2. **Batch minor changes** - Run all targeted validations first (~100-500 tokens each)
3. **Review failed validations** - Escalate to full audit if keywords not found
4. **Process major changes** - One at a time with user confirmation
5. **Update tracking** - Record validation results and pending lists

### Confidence-Based Automation

**When to auto-confirm (high confidence):**

- 2+ keyword matches found
- Keywords match in expected skill location
- No conflicting information

**When to require explicit confirmation (medium confidence):**

- Single keyword match
- Match in unexpected location
- Recent related changes in same area

**When to escalate to full audit (failed):**

- Zero keyword matches
- Keywords found but in wrong context
- User requests deeper verification
