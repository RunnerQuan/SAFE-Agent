# File Roles - Quick Reference

## Core Skill File

**`SKILL.md`**
- Main skill definition with YAML frontmatter (name, description)
- Instructions for the AI tutor on how to guide learners
- Defines the teaching approach (Socratic method, active learning)
- Startup flow: show AWS credentials → read progress → present options
- References to other files (modules, progress tracker, etc.)
- When invoked, this is what Claude reads to understand its role

## Reference Files (4 files)

**`references/MODULE_STRUCTURE.md`**
- Overview of all 15 modules with descriptions
- Dependency graph showing prerequisites
- Time estimates and learning paths (fast track, flexible, minimum viable)
- Helps users and AI understand how modules connect

**`references/stream-processing-progress-modular.md`**
- Progress tracker that gets updated as user completes modules
- Tracks: completed modules, current module, session log, notes
- Checkpoint assessment tracking
- Gets edited by AI during learning sessions

**`references/stream-processing-concepts.md`**
- Quick reference guide for stream processing concepts
- Definitions, comparisons, tables (batch vs stream, broker types, etc.)
- Used when user asks "what is X?" or needs concept clarification
- Static reference material (not edited during sessions)

**`references/aws-examples.md`**
- Supplemental AWS code examples and patterns
- Maps DDIA concepts to AWS services (Kafka → Kinesis, etc.)
- Extra examples beyond what's in modules
- Reference for additional hands-on practice

## Module Files (15 files in `references/modules/`)

**Purpose**: Each module is a complete 45-minute lesson

**Structure** (same for all 15):
- Core Concepts (10 min)
- Discussion Questions (10 min)
- Hands-On AWS Exercise (20 min)
- Checkpoint Quiz (5 min)

**When loaded**: AI loads specific module file when user selects it (progressive disclosure)

**Module topics**:
- M1-M2: Foundation (streams, producers/consumers)
- M3-M5: Messaging basics (backpressure, direct messaging, brokers)
- M6-M8: Partitioned logs (Kafka model, partitions, consumer patterns)
- M9-M11: Database integration (CDC, event sourcing, state)
- M12-M15: Stream processing (patterns, time, joins, fault tolerance)

## How Files Work Together

1. **User invokes skill** → Claude reads `SKILL.md`
2. **Show progress** → Claude reads `stream-processing-progress-modular.md`
3. **User selects module** → Claude reads specific module file (e.g., `modules/m07-partitions-ordering.md`)
4. **During learning** → Claude may reference `stream-processing-concepts.md` for definitions
5. **After completion** → Claude updates `stream-processing-progress-modular.md`
6. **For structure questions** → Claude references `MODULE_STRUCTURE.md`

## File Categories by Usage

**Always Read on Startup**:
- `SKILL.md` (defines behavior)
- `stream-processing-progress-modular.md` (current progress)

**Read on Demand**:
- `references/modules/m##-*.md` (one module at a time)
- `MODULE_STRUCTURE.md` (when showing available modules)
- `stream-processing-concepts.md` (when user asks for definitions)
- `aws-examples.md` (when user wants extra examples)

## Total: 20 Files

```
1  - SKILL.md (skill definition)
4  - Reference files (structure, progress, concepts, AWS examples)
15 - Module files (bite-sized lessons)
```

All files are required for the skill to function properly.
