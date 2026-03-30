---
name: speckit.checklist
description: Generate a custom checklist for the current feature based on user requirements. Checklists are "unit tests for requirements" - they validate quality, clarity, and completeness of requirements in a given domain.
---

# Speckit Checklist Command Executor

**This skill executes the official GitHub Speckit `/speckit.checklist` command.**

## Execution Protocol

When this skill is invoked, you MUST:

### 1. Load the Original Command File

Read and parse `.opencode/commands/speckit.checklist.md` from the current project directory.

### 2. Process OpenCode Command Syntax

The command file uses special syntax that MUST be processed before execution:

| Syntax | Action |
|--------|--------|
| `$ARGUMENTS` | Replace with user-provided arguments (checklist domain/focus) |
| `$1`, `$2`, etc. | Replace with positional arguments |
| `@filepath` | Read the file at `filepath` and insert its full contents |
| `!`command`` | Execute the shell command and insert its stdout |

### 3. Execute the Processed Instructions

After syntax processing, follow all instructions in the command file **exactly as written**, including:
- Running `.specify/scripts/powershell/check-prerequisites.ps1 -Json`
- Asking up to 3 clarifying questions about checklist focus
- Loading spec.md, plan.md, tasks.md for context
- Creating checklist in `FEATURE_DIR/checklists/` directory
- Using `.specify/templates/checklist-template.md` for format

### 4. Critical Concept: Unit Tests for Requirements

Checklists test **requirements quality**, NOT implementation:
- ✅ "Are requirements defined for [scenario]?"
- ✅ "Is [vague term] quantified with specific criteria?"
- ❌ NOT "Verify the button works correctly"
- ❌ NOT "Test error handling"

## User Input

```text
$ARGUMENTS
```

## Fallback

If `.opencode/commands/speckit.checklist.md` does not exist, check for:
- `.opencode/command/speckit.checklist.md` (legacy path)

If no command file is found, report an error and suggest running `specify init` first.
