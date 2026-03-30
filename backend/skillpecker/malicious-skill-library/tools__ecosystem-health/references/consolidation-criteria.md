# Agent Consolidation Criteria Reference

This reference provides analysis criteria, grouping rules, and scoring for agent consolidation audits.

## Purpose

Agents can proliferate in a codebase. This reference helps identify:

- Which agents are truly specialized vs generic
- Which agents could be consolidated
- What would break if an agent is changed/removed

## Configuration Field Grouping

Agents are grouped by these fields for consolidation analysis:

| Field | Weight | Grouping Rule | Rationale |
| ----- | ------ | ------------- | --------- |
| `tools` | HIGH | Exact match required | Different tool access = different capabilities |
| `model` | HIGH | Exact match required | Different models = different cost/capability tradeoffs |
| `permissionMode` | MEDIUM | Exact match preferred | Affects security posture |
| `skills` | CRITICAL | Different = different purpose | Auto-load guarantee cannot be replicated |
| `color` | LOW | Ignored for grouping | Purely cosmetic |
| `description` | LOW | Semantic similarity check | May indicate similar purpose |

### The `skills:` Auto-Load Guarantee

**CRITICAL:** The `skills:` field provides an auto-load guarantee that CANNOT be replicated via Task tool:

- Skill loads AUTOMATICALLY when agent starts
- No prompt required, no Claude decision needed
- Consistent, reliable domain knowledge

Task tool limitations:

- Cannot specify `skills:` parameter
- Must describe skill content in prompt (token bloat)
- Claude must decide to invoke Skill tool (not guaranteed)

**Therefore:** Agents with different `skills:` fields are NOT consolidation candidates unless their skills can be merged.

## Consolidation Candidate Criteria

A group is a **consolidation candidate** when ALL of:

1. 3+ agents share identical `tools`, `model`, `permissionMode`
2. Different `skills:` fields point to related domains
3. Skills could potentially be combined into one meta-skill
4. No domain-specific references prevent consolidation

## Non-Consolidation Indicators

Do NOT recommend consolidation when:

| Indicator | Reason |
| --------- | ------ |
| `skills:` provides critical domain knowledge | Auto-load guarantee essential |
| Description indicates specialized use case | Purpose-built for specific task |
| Agent used by domain-specific command | Breaking change risk too high |
| Agent chains to other specialized agents | Orchestration complexity |

## Reference Search Patterns

### Component Types to Search

| Component | Location Pattern | Search Regex |
| --------- | ---------------- | ------------ |
| Commands | `commands/*.md` | `Task.*{agent-name}` or `subagent_type.*{agent-name}` |
| Skills | `skills/*/SKILL.md` | `{agent-name}` in delegation sections |
| Memory | `.claude/memory/*.md` | `{agent-name}` agent reference |
| Other Agents | `agents/*.md` | `{agent-name}` in chaining patterns |

### Reference Count Thresholds

| Count | Consolidation Risk |
| ----- | ------------------ |
| 0 | LOW - Agent may be unused |
| 1-2 | LOW - Limited blast radius |
| 3-5 | MEDIUM - Multiple dependencies |
| 6+ | HIGH - Widely used, avoid changes |

## Scoring Rubric

### Configuration Similarity Score (0-100)

```text
START with 0 points

IF tools match exactly:
  ADD 30 points
ELSE IF tools overlap > 80%:
  ADD 15 points

IF model matches:
  ADD 25 points

IF permissionMode matches:
  ADD 15 points

IF skills relate to same domain:
  ADD 20 points
ELSE:
  ADD 0 points (different skills = different purpose)

IF description semantic similarity > 70%:
  ADD 10 points
```

### Consolidation Recommendation Thresholds

| Score | Recommendation | Action |
| ----- | -------------- | ------ |
| 85-100 | CONSOLIDATE | Strong candidate for merging |
| 70-84 | REVIEW | May consolidate with skill refactoring |
| 50-69 | UNLIKELY | Keep separate unless skills merge |
| 0-49 | NO ACTION | Different purposes, keep separate |

### Reference Impact Score

```text
FOR each agent:
  impact_score = (command_refs * 3) + (skill_refs * 2) + (memory_refs * 1) + (agent_refs * 2)

IF impact_score >= 10:
  "HIGH IMPACT - Consolidation requires careful migration"
ELSE IF impact_score >= 5:
  "MEDIUM IMPACT - Update references during consolidation"
ELSE:
  "LOW IMPACT - Safe to consolidate"
```

## Output Formats

### JSON Output (for tracking/recovery)

```json
{
  "analysis_date": "YYYY-MM-DDTHH:MM:SSZ",
  "scope": "plugin:<name> | project | user",
  "agents_analyzed": N,
  "groups": [
    {
      "id": "group-identifier",
      "config": {
        "tools": "tool list (normalized)",
        "model": "opus | sonnet | haiku | inherit",
        "permissionMode": "default | plan | acceptEdits | bypassPermissions"
      },
      "members": ["agent-1", "agent-2"],
      "skills_used": ["skill-1", "skill-2"],
      "consolidation_candidate": true | false,
      "consolidation_score": N,
      "reason": "explanation"
    }
  ],
  "recommendations": [
    {
      "type": "consolidate | review | no_action",
      "group": "group-id",
      "reason": "explanation",
      "impact_score": N
    }
  ],
  "status": "analyzed | tracking | executing"
}
```

### Markdown Output (for human review)

```markdown
# Agent Consolidation Analysis

## Summary
- **Scope:** [scope]
- **Agents Analyzed:** [N]
- **Groups Found:** [N]
- **Consolidation Candidates:** [N]

## Configuration Groups

### Group: [group-id] ([N] agents)

**Configuration:**
- Tools: [tool list]
- Model: [model]
- Permission Mode: [mode]

**Members:**
| Agent | Skills | References | Impact |
| ----- | ------ | ---------- | ------ |
| agent-1 | skill-1 | 3 | MEDIUM |

**Consolidation:** [YES/NO/REVIEW]
**Score:** [N]/100
**Reason:** [explanation]

## Recommendations

1. **[TYPE]** - [group-id]
   - Reason: [explanation]
   - Impact: [LOW/MEDIUM/HIGH]
   - Action: [specific steps]
```

## Usage

The `agent-consolidation-analyst` agent loads this reference via the `ecosystem-health` skill (or directly) and applies these criteria during audits.

**Workflow:**

1. Agent discovers agents in scope
2. Agent parses YAML frontmatter for each
3. Agent groups by configuration using rules above
4. Agent calculates consolidation scores
5. Agent searches for references
6. Agent generates recommendations
7. Agent writes dual output (JSON + Markdown)

## Related

- `ecosystem-health` skill - Parent skill providing audit orchestration
- `subagent-development` skill - Agent configuration knowledge
- `/audit-agent-consolidation` command - Orchestrates consolidation audits

---

**Last Updated:** 2026-01-10
**Model:** claude-opus-4-5-20251101
