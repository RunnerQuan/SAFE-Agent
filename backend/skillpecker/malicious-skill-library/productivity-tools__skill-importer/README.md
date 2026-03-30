# Skill Importer

Upgrade externally-built Claude Skills to factory specification.

## Overview

When you build skills outside the factory workflow (or receive skills from elsewhere), they may be missing required files or have non-standard structure. This skill analyzes what's there and generates what's missing.

## Installation

### Option 1: Already part of claude-toolkit plugin
If you installed the claude-toolkit plugin, this skill is already available.

### Option 2: Manual installation
```bash
# Copy to your project
cp -r .claude/skills/skill-importer ~/.claude/skills/

# Or copy to a specific project
cp -r .claude/skills/skill-importer /path/to/project/.claude/skills/
```

## Usage

```
"Import the skill at generated-skills/my-skill"
"Analyze generated-skills/my-skill and show gaps"
"Bring ~/.claude/skills/external-skill up to factory spec"
```

## What Gets Checked

| Item | Required | Description |
|------|----------|-------------|
| YAML frontmatter | Yes | `name` and `description` fields |
| Kebab-case name | Yes | e.g., `issue-analysis` not `IssueAnalysis` |
| SKILL.md structure | Yes | Standard sections (Capabilities, Input, Output, etc.) |
| HOW_TO_USE.md | Yes | Natural language invocation examples |
| sample_input.json | Yes | Test input data |
| expected_output.json | Yes | Expected results |
| README.md | Recommended | Installation guide |

## What Gets Generated

- **Restructured SKILL.md**: Standard factory template with all sections
- **HOW_TO_USE.md**: Example invocations based on skill purpose
- **sample_input.json**: Minimal realistic test input
- **expected_output.json**: Expected output structure
- **README.md**: Installation and overview

## Factory Template

Skills are restructured to match:

```markdown
---
name: skill-name
description: One-line description
---

# Human Title

Brief intro.

## Capabilities
## Input Requirements
## Output Formats
## How to Use
## Scripts (if Python)
## Best Practices
## Limitations
```

## Related

- **skills-guide agent**: Interactive guide for building new skills from scratch
- **SKILLS_FACTORY_PROMPT.md**: Full factory template reference
