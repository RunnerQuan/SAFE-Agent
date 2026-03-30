# Common Anti-Patterns and Fixes

## Marketplace-Agnostic Framework

These anti-patterns are **common across many plugin marketplaces**. Always adapt fixes to your marketplace's specific standards and requirements.

---

## Critical Security Anti-Patterns

### 1. Unrestricted Permission Specifications

**WRONG (Most Marketplaces):**
```yaml
tools: [Read, Write, Edit, Bash]
```

**Why Dangerous:**
- Agent can execute ANY shell command
- Risk of destructive operations
- Violates least privilege principle

**CORRECT (Most Marketplaces):**
```yaml
tools: [
  Read, Write, Edit,
  Bash(git:*),
  Bash(python:*),
  Bash([MARKETPLACE_PACKAGE_MANAGER]:*)
]
```

**Adaptation:** Your marketplace may have specific permission requirements. Check your marketplace's security model.

---

### 2. Inherited Agent Permissions

**WRONG (Most Marketplaces):**
```yaml
# No explicit tools list - relies on inheritance
tools: [Read, Write, Edit]  # Implicit - may inherit more
```

**Why Dangerous:**
- Cannot predict what agent can do
- May inherit dangerous permissions
- Violates explicit allowlist principle

**CORRECT (Most Marketplaces):**
```yaml
tools: [Read, Write, Edit, Bash(git:*)]
```

**Adaptation:** If your marketplace allows inheritance, check if it's documented and approved.

---

## Command Anti-Patterns

### 3. Commands with Embedded Logic

**WRONG (Most Marketplaces):**
```yaml
---
description: "Build the application"
disable-model-invocation: true
---

# Build Command

This command will:
1. Check if package.json exists
2. Install dependencies
3. Run tests
4. Build the application
5. Deploy to staging

Steps:
1. First, check if [MARKETPLACE_RUNTIME] is installed...
```

**Why Wrong:**
- Command is 20+ lines with workflow
- Contains implementation details
- Should delegate to Skill

**CORRECT (Most Marketplaces):**
```yaml
---
description: "Build the application using marketplace best practices."
disable-model-invocation: true  # If marketplace requires zero-token retention
---

Invoke the `[MARKETPLACE_BUILD_SKILL]` skill with "$ARGUMENTS"
```

**Adaptation:** Your marketplace may have specific command patterns or may not require disable-model-invocation.

---

### 4. Missing Zero-Token Retention

**WRONG (If Marketplace Requires):**
```yaml
---
description: "Deploy the application"
---

Invoke the `[SKILL_NAME]` skill
```

**Why Wrong:**
- Command definition loaded into context
- Burns tokens unnecessarily
- No semantic discovery benefit

**CORRECT (If Marketplace Requires):**
```yaml
---
description: "Deploy the application."
disable-model-invocation: true  # If marketplace mandates it
---

Invoke the `[SKILL_NAME]` skill
```

**Adaptation:** Only applies if your marketplace requires zero-token retention for commands.

---

## Skill Anti-Patterns

### 5. Missing Progressive Disclosure

**WRONG (If Marketplace Has Size Limits):**
```markdown
# SKILL.md (600+ lines)

## Overview
...

## Detailed Framework 1
[200 lines of examples]

## Detailed Framework 2
[200 lines of examples]

## Detailed Framework 3
[200 lines of examples]
```

**Why Wrong:**
- SKILL.md too large for context
- Hard to scan quickly
- Burdens AI with unnecessary content

**CORRECT (If Marketplace Requires Progressive Disclosure):**
```markdown
# SKILL.md (80 lines)

## Overview
...

## Core Frameworks
- Framework 1: brief summary
- Framework 2: brief summary
- Framework 3: brief summary

## Reference Resources
- **See:** references/frameworks.md - Complete framework examples
- **See:** references/implementation.md - Detailed guides
```

**Adaptation:** Check your marketplace's size limits and progressive disclosure requirements.

---

### 6. Deep Linking Between Skills

**WRONG (Most Marketplaces):**
```markdown
See `../other-skill/SKILL.md` for details
See `../../../common/script.sh`
```

**Why Wrong:**
- Breaks skill portability
- Hardcoded filesystem paths
- Cannot move Skills independently

**CORRECT (Most Marketplaces):**
```markdown
See: references/other-skill.md
Delegate to the code-analyzer skill
```

**Adaptation:** If your marketplace has a specific way to reference other skills, use that pattern.

---

### 7. Incorrect Tool Syntax

**WRONG (Most Marketplaces):**
```yaml
allowed-tools: [Bash(python, npm)]
```

**Why Wrong:**
- Not valid syntax for many marketplaces
- Misinterpreted by parser
- Causes validation errors

**CORRECT (Most Marketplaces):**
```yaml
allowed-tools: [
  Bash(python:*),
  Bash(npm:*)
]
```

**Adaptation:** Some marketplaces may have different tool syntax. Check your marketplace's requirements.

---

## Naming Anti-Patterns

### 8. Inconsistent Naming

**WRONG (Most Marketplaces):**
```yaml
name: "mySkill"  # CamelCase
name: "My Skill"  # Space
name: "my_skill"  # Underscore
```

**CORRECT (Check Your Marketplace):**
```yaml
name: "[MARKETPLACE_NAMING_CONVENTION]"
```

**Common Conventions:**
- kebab-case: `my-skill-name`
- snake_case: `my_skill_name`
- camelCase: `mySkillName`

**Adaptation:** Always use your marketplace's naming convention.

---

### 9. Mismatched Directory Names

**WRONG (Most Marketplaces):**
```
skills/
  my-skill/  # Directory
    name: "my_skill"  # Frontmatter
```

**CORRECT (Most Marketplaces):**
```
skills/
  my-skill/
    name: "my-skill"  # Matches directory
```

**Adaptation:** Directory name should match frontmatter name per your marketplace's convention.

---

## Description Anti-Patterns

### 10. Inconsistent Description Patterns

**WRONG (If Marketplace Uses Enhanced Pattern):**
```yaml
description: "Validates plugin quality. Use when you need validation."
```

**Why Wrong:**
- If marketplace uses Enhanced pattern, missing MODAL word
- Doesn't follow marketplace convention

**CORRECT (If Marketplace Uses Enhanced Pattern):**
```yaml
description: "Validates plugin quality. MUST Use when validating plugins."
```

**Adaptation:** Some marketplaces use Standard pattern, others Enhanced (MUST/SHOULD/PROACTIVELY). Check your marketplace.

---

### 11. Poor Description Quality

**WRONG (Most Marketplaces):**
```yaml
description: "This skill does things."
description: "A skill for validation purposes."
description: "Helps with validation and other stuff."
```

**CORRECT (Most Marketplaces):**
```yaml
description: "Validates [PLUGIN_TYPE] compliance with [MARKETPLACE] standards. Use when auditing or refactoring plugins."
```

**Adaptation:** Descriptions should be specific, actionable, and discoverable per your marketplace's guidelines.

---

## Permission Anti-Patterns

### 12. Runtime Permission Flags in Frontmatter

**WRONG (Most Marketplaces):**
```yaml
---
name: my-skill
description: "Does things"
[RUNTIME_FLAG]: acceptEdits  # Runtime flag, not metadata!
---
```

**Why Wrong:**
- Runtime permission flags are configuration
- Should never be in plugin metadata
- Causes parsing errors

**CORRECT (Most Marketplaces):**
```yaml
---
name: my-skill
description: "Does things"
---
```

**Adaptation:** Runtime flags are configured separately. Your marketplace may have different runtime configuration methods.

**Note:** Common runtime flags that should NOT be in frontmatter:
- permissionMode
- accepteditor
- DontAsk

---

### 13. Overly Broad External Access

**WRONG (If Marketplace Restricts External Access):**
```yaml
tools: [Read, Write, Edit, WebFetch]
```

**Why Dangerous:**
- WebFetch allows unrestricted external access
- Can access any URL
- Security risk

**CORRECT (If Marketplace Allows WebFetch):**
```yaml
# Only if absolutely necessary
tools: [Read, WebFetch]
```

**Adaptation:** Your marketplace may restrict external network access entirely.

---

## Validation Anti-Patterns

### 14. Ignoring Marketplace Warnings

**WRONG:**
```bash
# Run validator, see warnings, ignore them
[MARKETPLACE_VALIDATOR]
# Continue without fixing warnings
```

**CORRECT:**
```bash
# Fix all issues
[MARKETPLACE_VALIDATOR] --fix
# Re-validate
[MARKETPLACE_VALIDATOR]
```

**Adaptation:** Your marketplace's validator may have different fix options.

---

### 15. Not Running Validation

**WRONG:**
```bash
# Skip validation entirely
git commit -m "Update plugin"
```

**CORRECT:**
```bash
# Always validate before commit
[MARKETPLACE_VALIDATOR]
git add .
git commit -m "Update plugin"
```

**Adaptation:** Your marketplace may have CI/CD integration or different validation requirements.

---

## Quick Reference: Fix Priority

### Immediate Fix (Critical Security)
1. Unrestricted permission specifications
2. Missing marketplace-required flags
3. Hardcoded paths between Skills

### Fix This Sprint (Major)
1. SKILL.md exceeds marketplace size limits
2. Commands with embedded logic
3. Missing progressive disclosure (if required)

### Fix Eventually (Minor)
1. Typos in descriptions
2. Formatting inconsistencies
3. Missing optional metadata

---

## Adapting to Your Marketplace

### Pattern Adaptation Matrix

| Marketplace Type | Description Pattern | Size Limit | Permissions | Commands |
|------------------|-------------------|------------|-------------|----------|
| **Marketplace A** | Enhanced (MUST/SHOULD) | <500 lines | Explicit whitelists | Zero-token retention |
| **Marketplace B** | Standard | <100 lines | Capability-based | Simple wrappers |
| **Marketplace C** | Custom | No limit | Implicit + checks | Full workflow |
| **Your Marketplace** | [CHECK_DOCS] | [CHECK_DOCS] | [CHECK_DOCS] | [CHECK_DOCS] |

**Always check your marketplace's documentation** for specific requirements.

---

## Key Principle

**These patterns are common but not universal.**

Your marketplace may:
- Allow some patterns listed as "wrong"
- Require additional patterns not listed
- Have different naming conventions
- Use different validation tools

**The source of truth is your marketplace's documentation, not this list.**
