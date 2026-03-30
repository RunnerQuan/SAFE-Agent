# Inquiry Orchestration Skill

Orchestrate multi-agent deliberation for INQ work items through all 4 phases: Research, Synthesis, Debate, and Consensus.

## Overview

The `/inquiry` skill is the main orchestrator for INQ (Inquiry) work items. It coordinates the complete deliberation lifecycle, from spawning independent research agents through to formalizing decisions and creating FEAT work items for implementation.

```
INQ Lifecycle:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Research   │───►│  Synthesis  │───►│   Debate    │───►│  Consensus  │
│  (Phase 1)  │    │  (Phase 2)  │    │  (Phase 3)  │    │  (Phase 4)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
research/agent-N.md  SYNTHESIS.md       DEBATE.md         CONSENSUS.md
                                                              + FEAT(s)
```

## Quick Start

### Start a New Inquiry

```bash
# Start from beginning (auto-detects current phase)
/inquiry INQ-001

# Or specify the path
/inquiry inquiries/INQ-001-authentication-strategy/
```

### Resume an Inquiry

The skill automatically detects the current phase and resumes:

```bash
# Will continue from wherever it left off
/inquiry INQ-001
```

### Jump to a Specific Phase

```bash
/inquiry INQ-001 --phase synthesis
/inquiry INQ-001 --phase debate
/inquiry INQ-001 --phase consensus
```

## Execution Modes

### ccmux Mode (Default)

When ccmux MCP tools are available, agents are spawned in isolated sessions:

```bash
/inquiry INQ-001
```

Benefits:
- Parallel agent execution
- Automatic output collection
- Real-time status monitoring
- Session cleanup after completion

### Manual Mode

When ccmux is unavailable or for testing:

```bash
/inquiry INQ-001 --mode manual
```

In manual mode:
1. Prompts are written to files
2. User manually runs each agent in separate Claude sessions
3. User saves outputs back to the respective files
4. User reruns `/inquiry` to continue to next phase

## Phases Explained

### Phase 1: Research

Multiple agents explore the problem space independently, preventing groupthink.

**Inputs:**
- `inquiry_report.json` - Metadata and constraints
- `QUESTION.md` - Problem statement and sub-questions

**Process:**
1. Invoke `/inquiry-prompts` to generate agent prompts
2. Spawn N agents (from `research_agents` field)
3. Each agent researches assigned questions independently
4. Invoke `/inquiry-collect` to gather outputs

**Outputs:**
- `research/agent-1.md` through `research/agent-N.md`
- `SUMMARY.md` (cross-agent analysis)

### Phase 2: Synthesis

A synthesis agent consolidates all research findings.

**Inputs:**
- All `research/agent-*.md` files
- `SUMMARY.md` from collector

**Process:**
1. Read all research reports
2. Identify common themes and patterns
3. Highlight areas of agreement and disagreement
4. Extract key decision points

**Outputs:**
- `SYNTHESIS.md` with consolidated findings

### Phase 3: Debate

Adversarial agents argue different perspectives on unresolved issues.

**Inputs:**
- `SYNTHESIS.md` with identified disagreements

**Process:**
1. For each decision point with divergent views
2. Assign advocate agents to each position
3. Structured argument/counter-argument rounds
4. Document resolutions with rationale

**Outputs:**
- `DEBATE.md` with structured arguments and resolutions

### Phase 4: Consensus

Formalize decisions and spawn implementation work.

**Inputs:**
- `DEBATE.md` with all resolutions

**Process:**
1. Create formal decision record
2. Document rejected alternatives
3. Define implementation approach
4. Spawn FEAT work item(s)

**Outputs:**
- `CONSENSUS.md` - Final decision document
- `FEAT-XXX` work item(s) for implementation

## Integration with Other Skills

| Skill | Integration Point |
|-------|-------------------|
| `/inquiry-prompts` | Phase 1 - Generates research agent prompts |
| `/inquiry-collect` | Phase 1 - Collects research outputs |
| `/work-item-creation` | Phase 4 - Creates FEAT work items |

## Directory Structure

After a complete inquiry:

```
inquiries/INQ-001-topic/
├── inquiry_report.json   # Metadata, status, phase history
├── QUESTION.md           # Problem statement
├── research/
│   ├── agent-1.md        # Research Agent 1 findings
│   ├── agent-2.md        # Research Agent 2 findings
│   └── agent-3.md        # Research Agent 3 findings
├── SUMMARY.md            # Cross-agent analysis (from collector)
├── SYNTHESIS.md          # Consolidated findings (Phase 2)
├── DEBATE.md             # Structured arguments (Phase 3)
├── CONSENSUS.md          # Final decisions (Phase 4)
└── comments.md           # Optional: Process notes
```

## Configuration

### inquiry_report.json

Key fields that affect orchestration:

| Field | Description | Default |
|-------|-------------|---------|
| `phase` | Current phase | `research` |
| `status` | Current status | Mirrors phase |
| `research_agents` | Number of agents for Phase 1 | 3 |
| `constraints` | Non-negotiable requirements | Required |

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--phase` | Force specific phase | Auto-detect |
| `--agents` | Override research_agents | From JSON |
| `--model` | Agent model (claude/gemini/codex) | claude |
| `--mode` | ccmux or manual | ccmux |
| `--timeout` | Timeout per phase (seconds) | 600 |

## Error Recovery

### Partial Research Completion

If some research agents don't complete:
1. Skill reports which agents completed vs timed out
2. Synthesis can proceed with partial data (with warning)
3. User can re-run research for missing agents

### Stalled Inquiry

If inquiry gets stuck:
```bash
# Check current state
cat inquiries/INQ-001-topic/inquiry_report.json | jq '.phase, .status'

# Force resume at current phase
/inquiry INQ-001 --phase $(jq -r '.phase' inquiry_report.json)

# Skip to next phase (if current phase artifacts exist)
/inquiry INQ-001 --phase synthesis  # Skip to synthesis
```

### Rollback

To restart a phase:
1. Delete the phase artifact (e.g., `rm SYNTHESIS.md`)
2. Update `inquiry_report.json` to previous phase
3. Re-run `/inquiry INQ-001`

## Examples

### Example 1: Architecture Decision

```bash
# Create inquiry
/work-item-creation INQ \
  --title "Database Selection for User Service" \
  --question "Which database should we use for the user service?" \
  --constraints "Must scale to 1M users" "Must support ACID" \
  --agents 3

# Run full deliberation
/inquiry INQ-002

# Output:
# Phase 1: Research - 3 agents analyze PostgreSQL, MongoDB, DynamoDB
# Phase 2: Synthesis - Consolidate findings on scalability, cost, complexity
# Phase 3: Debate - PostgreSQL vs DynamoDB for ACID + scale
# Phase 4: Consensus - PostgreSQL chosen, FEAT-025 created
```

### Example 2: Manual Mode Workflow

```bash
# Start in manual mode
/inquiry INQ-003 --mode manual

# Output shows:
# Generated prompts in research/ directory
# Run each prompt in separate Claude session
# Save outputs back to research/agent-N.md

# After manual research completion
/inquiry INQ-003  # Continues to synthesis

# After manual synthesis
/inquiry INQ-003  # Continues to debate

# After manual debate
/inquiry INQ-003  # Completes with consensus
```

### Example 3: Resume Interrupted Inquiry

```bash
# Session interrupted during debate
/inquiry INQ-001

# Output:
# Resuming INQ-001 at phase: debate
# Found existing artifacts:
#   - research/*.md ✓
#   - SUMMARY.md ✓
#   - SYNTHESIS.md ✓
# Continuing debate phase...
```

## Troubleshooting

### "ccmux tools not available"

The skill falls back to manual mode. To use ccmux:
1. Ensure ccmux MCP server is running
2. Verify ccmux tools appear in available tools
3. Restart Claude session if needed

### "No research agents completed"

Check:
1. Agent prompts were generated correctly
2. Agents had sufficient time (increase `--timeout`)
3. ccmux sessions are running (check with `ccmux_list_sessions`)

### "Cannot proceed to next phase"

Ensure required artifacts exist:
- Research → Synthesis: `research/agent-*.md` files
- Synthesis → Debate: `SYNTHESIS.md`
- Debate → Consensus: `DEBATE.md`

## Files

```
skills/inquiry/
├── SKILL.md          # Skill definition (agent instructions)
├── README.md         # This file (usage documentation)
└── scripts/
    ├── phase_manager.py       # Phase detection and transitions
    ├── synthesis_generator.py # Synthesis prompt generation
    ├── debate_structurer.py   # Debate format structuring
    └── consensus_builder.py   # Consensus document generation
```

## Related Documentation

- `docs/WORK-ITEM-TYPES.md` - INQ work item specification
- `skills/inquiry-prompts/README.md` - Research prompt generation
- `skills/inquiry-collector/README.md` - Research output collection
- `feature-management/schemas/inquiry-report.schema.json` - JSON schema
