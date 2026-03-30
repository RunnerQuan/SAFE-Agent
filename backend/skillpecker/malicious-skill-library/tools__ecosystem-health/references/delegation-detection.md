# Delegation Detection Reference

This reference provides detection patterns and scoring criteria for auditing docs-management delegation compliance.

## Purpose

Skills and memory files that reference Claude Code features (hooks, settings, frontmatter fields, etc.) should delegate to `docs-management` at runtime rather than hardcoding values that may become stale.

## MANDATORY: Self-Compliance Verification

> **Documentation Verification:** This file defines patterns for detecting Claude Code volatile data.
> The pattern definitions themselves (hook events, YAML fields, settings keys) may become stale
> as Claude Code evolves. Verify current patterns via `docs-management` skill before flagging violations.

**Verification Checkpoint:**

- [ ] Did I invoke `docs-management` to verify current hook events?
- [ ] Are YAML frontmatter field definitions current?
- [ ] Are settings key patterns current?
- [ ] Did I check `hook-management` skill for authoritative event types?

## Detection Patterns

### HIGH Risk - Hardcoded Claude Code Data

These patterns indicate hardcoded Claude Code information that should be delegated:

| Pattern | Regex | Risk | Example |
| ------- | ----- | ---- | ------- |
| Hook event types | `\b(PreToolUse\|PostToolUse\|SessionStart\|SessionStop\|Notification\|Stop)\b` | HIGH | `PreToolUse` in prose |
| YAML frontmatter fields (skills) | `\b(allowed-tools\|argument-hint\|model\|color\|permissionMode)\b` when not in frontmatter | HIGH | "The `allowed-tools` field..." |
| Skill/Command context field | `\bcontext:\s*(fork\|main)\b` when not in frontmatter | HIGH | `context: fork` in prose |
| Hook once field | `\bonce:\s*(true\|false)\b` when not in frontmatter | HIGH | `once: true` in prose |
| Settings keys | `\bCLAUDE_HOOK_[A-Z_]+\b` | MEDIUM-HIGH | `CLAUDE_HOOK_LOG_LEVEL` |
| Settings fields | `\b(apiChoice\|sandboxMode\|tengu_use_file_checkpoints)\b` | MEDIUM-HIGH | "Set `sandboxMode` to..." |

### HIGH Risk - Hardcoded Validation Rules

Audit frameworks and reference files should delegate validation criteria to docs-management, not hardcode rules that become stale.

| Pattern | Regex | Risk | Example |
| ------- | ----- | ---- | ------- |
| Hardcoded MUST rules | `\bMUST\s+(be\|start\|end\|have\|use\|contain)\b` | HIGH | "Paths MUST start with `./`" |
| Hardcoded format regex | `\^\[.*\]\+\$` or `\^\[.*\]\*\$` | HIGH | `^[a-z0-9]+(-[a-z0-9]+)*$` |
| Hardcoded NOT allowed rules | `\b(NOT\|NEVER)\s+(allowed\|permitted\|supported)\b` | HIGH | "Absolute paths NOT allowed" |
| Hardcoded directory structures | `^```text\n.*├──.*\n.*└──` | MEDIUM-HIGH | Tree diagrams showing structure |

### MEDIUM Risk - Volatile Information

| Pattern | Regex | Risk | Example |
| ------- | ----- | ---- | ------- |
| GitHub issue references | `#\d{4,5}` | MEDIUM | `#10437`, `#15326` |
| Model names with versions | `\b(Opus 4\.5\|Sonnet 4\.5\|Haiku 4\.5\|claude-opus-4-5)\b` | MEDIUM | "Opus 4.5 supports..." |
| Token limits | `\b\d+K?\s*tokens?\b` | MEDIUM | "25K tokens", "context window" |
| Internal paths | `[A-Z]:\\.*\\claude\\` | MEDIUM | `D:\tmp\claude\tasks\` |
| Hardcoded valid/invalid examples | `✅.*\|.*❌` or `(Correct\|Incorrect) Structure:` | MEDIUM | "✅ valid, ❌ invalid" example lists |
| Hook additionalContext | `\badditionalContext\b` in prose | MEDIUM | "additionalContext return value" |

### Compliance Patterns

Files are COMPLIANT when they include delegation mechanisms:

| Pattern | Regex | Description |
| ------- | ----- | ----------- |
| Verification note | `>\s*\*\*Documentation Verification:\*\*` | Blockquote verification note |
| MANDATORY section | `##\s*MANDATORY:` or `## 🚨.*MANDATORY` | Required delegation section |
| Query pattern table | `\|\s*Topic\s*\|\s*Query` followed by `docs-management` | Keyword registry table |
| Skill reference | `invoke\s+(the\s+)?\S+-management\s+skill` | Direct skill delegation |
| Issue verification | `claude-code-issue-researcher` | GitHub issue lookup delegation |
| Query-based validation | `Verification Query:.*".*"` | Uses docs-management query instead of hardcoded rule |
| Explicit delegation instruction | `DO NOT hardcode` or `Query docs-management` | Explicit delegation guidance |
| Required queries section | `Required Queries Before Flagging:` | Lists queries to run before validation |

### Context Modifiers

Some patterns have reduced risk when appearing in explanatory contexts:

| Context Pattern | Risk Modifier | Example |
| --------------- | ------------- | ------- |
| "The X event/field..." | -1 severity level | "The `PreToolUse` event fires when..." |
| "X is used for..." | -1 severity level | "`allowed-tools` is used for restricting..." |
| Inline code (`` `X` ``) | -1 severity level | "Configure the `color` field" |
| Definition context | -1 severity level | "Definition: `PreToolUse` - fires before tool use" |

**Application:**

- HIGH risk pattern in explanatory context → MEDIUM
- MEDIUM risk pattern in explanatory context → LOW (no deduction)

### Exempt Patterns

These patterns are ACCEPTABLE and should NOT be flagged:

| Pattern | Context | Reason |
| ------- | ------- | ------ |
| Event names in `hooks.json` | Configuration files | Specification - must be concrete |
| `allowed-tools` in YAML frontmatter | Document header | Self-specification |
| `tools` in YAML frontmatter | Agent definition | Self-specification |
| Repository env vars | `OFFICIAL_DOCS_DEV_ROOT`, etc. | Not Claude Code data |
| Code examples in lessons | `plugins/tac/lessons/` | Instructional content |
| Agent/skill self-definition | Frontmatter of the file itself | Self-referential |
| Tracking files | `.yaml`, `.json` config | Data storage |
| Scoring tables with Verification Query | `\| Criterion \| Deduction \|` tables with Verification Query column | Using query-based validation |
| Query keyword tables | `\| Topic \| Query` tables | Keyword registry for docs-management |
| Inline code field references | `` `field-name` `` in prose | Documentation reference, not hardcoded rule |

## Exemption Detection

### File-Level Exemptions

| File Pattern | Reason |
| ------------ | ------ |
| `hooks.json` | Hook configuration specification |
| `hooks/*.{py,sh,ps1}` | Hook implementations |
| `*.yaml`, `*.json` (not SKILL.md) | Configuration/data files |
| `plugins/tac/lessons/` | Educational content |
| `canonical/` | Scraped documentation cache |

### Content-Level Exemptions

When checking for hardcoded patterns, SKIP:

1. **YAML frontmatter block** - The `---` delimited header is self-specification
2. **Code blocks** - Content in triple-backtick blocks may be examples
3. **Version History sections** - Historical records are exempt
4. **Last Updated sections** - Metadata is exempt
5. **Inline code patterns** - Field names in backticks (`` `allowed-tools` ``) are documentation references

## Scoring Rubric

### Categories (100 points total)

| Category | Points | Criteria |
| -------- | ------ | -------- |
| Delegation Notes | 30 | Has verification/delegation notes pointing to docs-management |
| Query Patterns | 25 | Uses keyword registry / query patterns instead of hardcoded values |
| Skill References | 20 | References appropriate `*-management` skills for delegation |
| Staleness Warnings | 15 | Has verification warnings where hardcoded data appears |
| Exempt Classification | 10 | Correctly handles exempt patterns (doesn't over-flag) |

### Scoring Logic

```text
START with 100 points

FOR each HIGH risk pattern found without delegation:
  DEDUCT 15 points

FOR each MEDIUM risk pattern found without delegation:
  DEDUCT 8 points

IF no MANDATORY section AND file has hardcoded data:
  DEDUCT 20 points

IF no verification notes AND file has hardcoded data:
  DEDUCT 15 points

IF file is in exempt category:
  RETURN 100 (EXEMPT)

MINIMUM score: 0
```

### Thresholds

| Score | Classification | Action |
| ----- | -------------- | ------ |
| 85-100 | COMPLIANT (PASS) | No action needed |
| 70-84 | PARTIALLY COMPLIANT (PASS WITH WARNINGS) | Add verification notes |
| 0-69 | NON-COMPLIANT (FAIL) | Add MANDATORY delegation section |

## Audit Output Format

### JSON Output (Recovery/Aggregation)

```json
{
  "file_path": "plugins/claude-ecosystem/skills/hook-management/SKILL.md",
  "audit_date": "2026-01-10T18:50:00Z",
  "classification": "COMPLIANT",
  "score": 95,
  "findings": {
    "high_risk_patterns": [],
    "medium_risk_patterns": [
      {"pattern": "#12891", "line": 45, "has_delegation": true}
    ],
    "compliance_patterns_found": [
      "verification_note",
      "mandatory_section",
      "skill_reference"
    ],
    "exempt_patterns": []
  },
  "recommendations": []
}
```

### Markdown Output (Human Review)

```markdown
## Audit: hook-management/SKILL.md

**Classification:** ✅ COMPLIANT
**Score:** 95/100
**Date:** 2026-01-10

### Findings

**High Risk Patterns:** None

**Medium Risk Patterns:**
- Line 45: `#12891` (GitHub issue) - ✅ Has delegation note

**Compliance Patterns Found:**
- ✅ Verification note present
- ✅ MANDATORY section present
- ✅ Skill reference to docs-management

### Recommendations
None - file is compliant.
```

## Usage

The `docs-delegation-auditor` agent loads this reference via the `ecosystem-health` skill and applies these patterns during audits.

**Workflow:**

1. Agent invokes `ecosystem-health` skill
2. Skill provides access to this reference
3. Agent reads target file
4. Agent applies detection patterns
5. Agent calculates score using rubric
6. Agent writes dual output (JSON + Markdown)

## Related

- `ecosystem-health` skill - Parent skill providing audit orchestration
- `docs-management` skill - Target of delegation
- `/audit-docs-delegation` command - Orchestrates audits

---

**Last Updated:** 2026-01-17
**Model:** claude-opus-4-5-20251101
