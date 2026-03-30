---
name: speckit.clarify
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec. Use after /speckit.specify to resolve ambiguities before research and evaluation.
---

# Speckit Clarify Command Executor

**This skill executes the official GitHub Speckit `/speckit.clarify` command.**

## Execution Protocol

When this skill is invoked, you MUST:

### 1. Load the Original Command File

Read and parse `.opencode/commands/speckit.clarify.md` from the current project directory.

### 2. Process OpenCode Command Syntax

The command file uses special syntax that MUST be processed before execution:

| Syntax | Action |
|--------|--------|
| `$ARGUMENTS` | Replace with user-provided arguments |
| `$1`, `$2`, etc. | Replace with positional arguments |
| `@filepath` | Read the file at `filepath` and insert its full contents |
| `!`command`` | Execute the shell command and insert its stdout |

### 3. Execute the Processed Instructions

After syntax processing, follow all instructions in the command file **exactly as written**, including:
- Running `.specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly`
- Loading and analyzing the current spec file
- Conducting the sequential questioning loop (one question at a time)
- Recording clarifications in the spec file
- Updating spec sections based on answers

### 4. Maintain Speckit Workflow Integrity

- Honor the `handoffs` defined in the command's YAML frontmatter
- **Next step is `/speckit.research`** (NOT /speckit.plan directly)
- Preserve all Speckit conventions

### 5. Handoff to Research Phase

After clarify is complete:
1. Update spec status to `clarified`
2. Inform user: "Clarification complete. Next: Market research phase."
3. Proceed to `/speckit.research`

## User Input

```text
$ARGUMENTS
```

## Fallback

If `.opencode/commands/speckit.clarify.md` does not exist, check for:
- `.opencode/command/speckit.clarify.md` (legacy path)

If no command file is found, report an error and suggest running `specify init` first.
