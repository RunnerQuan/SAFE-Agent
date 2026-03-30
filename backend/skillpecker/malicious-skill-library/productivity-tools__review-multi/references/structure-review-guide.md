# Structure Review Guide

## Purpose

This guide provides detailed guidance for conducting Structure Review (Operation 1), including YAML frontmatter validation, file structure compliance, naming conventions, and progressive disclosure assessment.

## Overview

Structure Review is the **foundation** of skill quality assessment. It validates:
- YAML frontmatter syntax and required fields
- File organization and directory structure
- Naming conventions across all files
- Progressive disclosure compliance

**Automation**: 95% automated via `scripts/validate-structure.py`

**Time**: 5-10 minutes (mostly automated)

**When to Run**: Always first - catches 70% of issues quickly before detailed review

## YAML Frontmatter Validation

### Required Fields

Every SKILL.md must have YAML frontmatter with two required fields:

```yaml
---
name: skill-name-here
description: Skill description here...
---
```

### `name` Field Requirements

**Format**: kebab-case (lowercase-hyphen-case)

**Regex**: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`

**Valid Examples**:
- `skill-builder-generic`
- `todo-management`
- `review-multi`
- `api-client`

**Invalid Examples**:
- `SkillBuilder` (CamelCase - not kebab-case)
- `skill_builder` (snake_case - should be hyphen)
- `skill.builder` (dots - should be hyphen)
- `Skill-Builder` (starts with uppercase - should be all lowercase)
- `skill--builder` (double hyphen - should be single)

### `description` Field Requirements

**Content**: 1-3 sentences describing what the skill does and when to use it

**Trigger Keywords**: Include 5+ keywords that help Claude discover the skill

**Format**: Natural language (not keyword stuffing)

**Structure Pattern**:
```
[What it does]. [Pattern/Structure]. Use when [trigger scenarios].
```

**Good Example**:
```yaml
description: Comprehensive multi-dimensional skill reviews across structure, content, quality, usability, and integration. Task-based operations with automated validation, manual assessment, scoring rubrics, and improvement recommendations. Use when reviewing skills, ensuring quality, validating production readiness, identifying improvements, or conducting quality assurance.
```

**Why Good**:
- 15+ trigger keywords naturally embedded
- Clear what it does
- Explains pattern (task-based operations)
- Contextual triggers (when to use)
- Natural language (not keyword stuffing)

**Bad Example**:
```yaml
description: Skill for review. Keywords: review, skill, quality, validate, check, score, assess.
```

**Why Bad**:
- Too brief (no context)
- Keyword list (not natural language)
- Doesn't explain what it does
- No "Use when" guidance

### Optional Fields

```yaml
---
name: skill-name
description: Description here...
pattern: workflow | task | reference | capabilities
dependencies:
  - other-skill-name
  - another-skill
version: 1.0.0
---
```

**When to Include**:
- `pattern`: Helpful for classification, optional
- `dependencies`: Required if skill needs other skills
- `version`: Useful for evolving skills

### YAML Syntax Validation

**Common Syntax Errors**:

1. **Missing Closing Delimiter**:
   ```yaml
   ---
   name: my-skill
   description: This is my skill
   [Missing ---]
   ```
   **Fix**: Add closing `---`

2. **Invalid Characters**:
   ```yaml
   ---
   name: my-skill
   description: Description with "unescaped quotes"
   ---
   ```
   **Fix**: Escape quotes or use single quotes

3. **Incorrect Indentation**:
   ```yaml
   ---
   dependencies:
   - skill-one
     - skill-two  # Wrong indentation
   ---
   ```
   **Fix**: Align list items

4. **Trailing Commas** (JSON-style in YAML):
   ```yaml
   ---
   name: my-skill,  # Comma not needed in YAML
   ---
   ```
   **Fix**: Remove trailing comma

### Automation

Run automated validation:
```bash
python3 scripts/validate-structure.py /path/to/skill --verbose
```

The script will:
- Parse YAML frontmatter
- Validate required fields
- Check name format (kebab-case regex)
- Count trigger keywords
- Report issues with severity

---

## File Structure Validation

### Required Files

**SKILL.md** (Required):
- Main entry point for skill
- Must be named exactly "SKILL.md" (uppercase)
- Contains YAML frontmatter + skill content

**README.md** (Recommended):
- Documentation for skill
- Must be named exactly "README.md" (uppercase)
- Recommended but optional for simple skills

### Optional Directories

**references/** (Optional):
- Contains detailed reference guides
- Loaded on-demand (progressive disclosure)
- Each file is a topic-specific deep dive

**scripts/** (Optional):
- Contains automation tools
- Python scripts (.py) or shell scripts (.sh)
- Loaded when automation needed

**examples/** (Rare):
- Example files for testing
- Sample data, config files, etc.
- Only if needed for skill functionality

### Standard Directory Layout

**Minimal** (Simple Skills):
```
skill-name/
└── SKILL.md
```

**Standard** (Most Skills):
```
skill-name/
├── SKILL.md
├── references/
│   ├── topic1-guide.md
│   └── topic2-reference.md
└── README.md
```

**Complete** (Complex Skills):
```
skill-name/
├── SKILL.md
├── references/
│   ├── guide1.md
│   ├── guide2.md
│   ├── patterns.md
│   └── troubleshooting.md
├── scripts/
│   ├── script1.py
│   ├── script2.py
│   └── helper.py
└── README.md
```

### File Structure Checks

1. **SKILL.md exists**: Critical - must be present
2. **README.md exists**: Recommended - should be present unless very simple
3. **references/ organized**: If present, should contain .md files, not empty
4. **scripts/ organized**: If present, should contain executable files, not empty
5. **No stray files**: Root should only have SKILL.md, README.md, maybe .gitignore

---

## Naming Conventions

### Root Files

**SKILL.md**: Must be exactly "SKILL.md" (all uppercase)
**README.md**: Must be exactly "README.md" (all uppercase)

**Rationale**: Standardization, easy to find, convention across all skills

### references/ Files

**Format**: `[topic]-[type].md`

**Requirements**:
- Lowercase
- Hyphen-separated (kebab-case)
- Descriptive topic name
- Type suffix optional but recommended

**Examples**:
- `validation-patterns.md` (topic: validation, type: patterns)
- `api-reference.md` (topic: api, type: reference)
- `troubleshooting-guide.md` (topic: troubleshooting, type: guide)
- `scoring-rubric.md` (topic: scoring, type: rubric)

**Common Type Suffixes**:
- `-guide.md`: Comprehensive guide
- `-patterns.md`: Pattern library
- `-examples.md`: Example collection
- `-reference.md`: API/lookup reference
- `-rubric.md`: Scoring/evaluation rubric

### scripts/ Files

**Format**: `[action-verb]-[object].[ext]`

**Requirements**:
- Lowercase
- Hyphen-separated (kebab-case)
- Action verb + object naming
- Appropriate extension (.py, .sh, .js)

**Examples**:
- `validate-structure.py` (action: validate, object: structure)
- `check-patterns.py` (action: check, object: patterns)
- `generate-report.py` (action: generate, object: report)
- `update-todos.py` (action: update, object: todos)

**Bad Examples**:
- `ValidationScript.py` (CamelCase - should be kebab-case)
- `check_patterns.py` (snake_case - should be kebab-case for filenames)
- `script.py` (not descriptive - should be action-verb-object)

---

## Progressive Disclosure Validation

### SKILL.md Size Guidelines

**Target**: <1,000 lines ideal, <1,200 acceptable, <1,500 maximum

**Rationale**:
- Claude Code loads SKILL.md completely
- Larger files increase context usage
- Progressive disclosure: SKILL.md overview, references/ details

**Scoring**:
- <1,000 lines: Excellent
- 1,000-1,200 lines: Good (if has references/)
- 1,200-1,500 lines: Acceptable (should have references/)
- >1,500 lines: Poor (monolithic, violates progressive disclosure)

**Exception**: 1,000-1,200 lines OK if references/ contains substantial detailed content

### references/ File Size Guidelines

**Target**: 300-800 lines per file

**Rationale**:
- Loaded on-demand (not all at once)
- Each file should be focused topic
- Too small (<200): Consider consolidating
- Too large (>1,000): Consider splitting

**Scoring**:
- 300-600 lines: Excellent (ideal focused size)
- 200-800 lines: Good (acceptable range)
- 100-200 lines: Acceptable (might be too brief)
- >1,000 lines: Poor (too large, consider splitting)

### Progressive Disclosure Compliance

**When SKILL.md >1,000 lines**:
- Should have references/ directory
- Detailed content should be in references/
- SKILL.md should overview, references/ should deep dive

**Red Flag**: SKILL.md >1,500 lines with no references/ = monolithic anti-pattern

**Green Flag**: SKILL.md ~1,000 lines + 3-5 references/ files 400-600 lines each = excellent progressive disclosure

---

## Validation Checklist

Use this checklist when conducting Structure Review:

### YAML Frontmatter
- [ ] YAML frontmatter present between --- markers
- [ ] No YAML syntax errors
- [ ] `name` field present and kebab-case format
- [ ] `description` field present
- [ ] Description includes 5+ trigger keywords
- [ ] Trigger keywords natural (not keyword stuffing)
- [ ] Optional fields used correctly (if present)

### File Structure
- [ ] SKILL.md exists
- [ ] SKILL.md named correctly (uppercase)
- [ ] README.md exists (or reasonable to omit)
- [ ] README.md named correctly if present (uppercase)
- [ ] references/ directory organized (if present)
- [ ] scripts/ directory organized (if present)
- [ ] No unexpected files in root

### Naming Conventions
- [ ] SKILL.md is "SKILL.md" (exact, uppercase)
- [ ] README.md is "README.md" (exact, uppercase) if present
- [ ] All references/ files in kebab-case
- [ ] All scripts/ files in kebab-case
- [ ] Descriptive naming (action-verb-object for scripts)

### Progressive Disclosure
- [ ] SKILL.md size appropriate (<1,500 lines)
- [ ] SKILL.md <1,200 lines OR has references/ for details
- [ ] references/ files 300-800 lines each (if present)
- [ ] No monolithic files (>1,000 lines without references/)
- [ ] scripts/ have module docstrings (if Python)

---

## Common Structure Issues

### Issue 1: Invalid YAML Frontmatter

**Symptom**: Script reports YAML syntax error

**Common Causes**:
- Missing closing ---
- Invalid characters (unescaped quotes)
- Wrong indentation
- Trailing commas (JSON-style)

**Fix**: Validate YAML syntax, check for common errors

**Example Fix**:
```yaml
# Before (broken)
---
name: my-skill
description: This has "unescaped quotes"
---

# After (fixed)
---
name: my-skill
description: This has 'escaped quotes' or "properly escaped\" quotes"
---
```

### Issue 2: Wrong Name Format

**Symptom**: Name not in kebab-case

**Common Causes**:
- CamelCase: `MySkill`
- snake_case: `my_skill`
- spaces: `my skill`
- dots: `my.skill`

**Fix**: Convert to kebab-case (lowercase-hyphen-case)

**Example Fix**:
```yaml
# Before (wrong)
name: MySkill

# After (correct)
name: my-skill
```

### Issue 3: Too Few Trigger Keywords

**Symptom**: Description has <5 keywords

**Cause**: Description too brief or generic

**Fix**: Expand description to include more context and trigger scenarios

**Example Fix**:
```yaml
# Before (only 2-3 keywords)
description: Skill for building skills. Use for skill creation.

# After (10+ keywords)
description: Comprehensive workflow for skill development from research through planning to implementation. Orchestrates research, planning, task breakdown, prompt creation, and progress tracking. Use when creating new skills, building workflows, or improving development processes.
```

### Issue 4: Monolithic SKILL.md

**Symptom**: SKILL.md >1,500 lines with no references/

**Cause**: All content in single file

**Fix**: Extract detailed content to references/, keep overview in SKILL.md

**Example Fix**:
```
Before:
skill-name/
└── SKILL.md (2,000 lines)

After:
skill-name/
├── SKILL.md (800 lines - overview + essentials)
└── references/
    ├── detailed-guide.md (600 lines)
    ├── advanced-topics.md (400 lines)
    └── examples.md (200 lines)
```

### Issue 5: Wrong File Naming

**Symptom**: Files not in kebab-case

**Common Causes**:
- CamelCase: `MyGuide.md`
- snake_case: `my_guide.md`
- spaces: `my guide.md`

**Fix**: Rename to kebab-case

**Example Fix**:
```bash
# Rename files to kebab-case
mv references/MyGuide.md references/my-guide.md
mv references/API_Reference.md references/api-reference.md
mv scripts/CheckPatterns.py scripts/check-patterns.py
```

### Issue 6: Missing README

**Symptom**: No README.md in skill directory

**Impact**: Lower documentation score, harder for users to understand skill

**Fix**: Create README.md with overview, usage, structure explanation

**When Acceptable to Omit**: Very simple skills (<300 lines total, single file)

---

## Using validate-structure.py

### Basic Usage

```bash
python3 scripts/validate-structure.py /path/to/skill
```

**Output**: Human-readable report with score, issues, recommendations

### Verbose Mode

```bash
python3 scripts/validate-structure.py /path/to/skill --verbose
```

**Output**: Includes debug information, detailed check results

### JSON Mode

```bash
python3 scripts/validate-structure.py /path/to/skill --json
```

**Output**: JSON format for programmatic processing

**JSON Structure**:
```json
{
  "skill_path": "/path/to/skill",
  "skill_name": "skill-name",
  "timestamp": "2025-11-06T11:30:00",
  "checks": {
    "YAML Frontmatter": {
      "passed": true,
      "issues": []
    },
    "File Structure": {
      "passed": true,
      "issues": ["WARNING: README.md not found"]
    }
  },
  "issues": ["WARNING: README.md not found"],
  "score": 4,
  "grade": "B",
  "status": "PASS"
}
```

### Interpreting Results

**Score 5 (Grade A)**:
- All checks passed
- No issues found
- Exemplary structure
- Ready to proceed with content/quality review

**Score 4 (Grade B)**:
- Most checks passed
- 1-2 minor issues (warnings)
- Good structure
- Can proceed with noted concerns

**Score 3 (Grade C)**:
- Some checks passed
- 3-4 issues (some critical)
- Acceptable but needs improvements
- Fix critical issues before proceeding

**Score 2 (Grade D)**:
- Few checks passed
- 5-6 issues (multiple critical)
- Not production-ready
- Fix all critical issues

**Score 1 (Grade F)**:
- Most checks failed
- 7+ issues (fundamentally flawed)
- Significant rework required
- Address all issues

### Exit Codes

- **0**: PASS (score ≥4) - Structure acceptable, proceed
- **1**: FAIL (score <4) - Fix issues before proceeding
- **2**: ERROR - Exception occurred (script error, file not found, etc.)

---

## Manual Structure Review (Beyond Automation)

While `validate-structure.py` handles 95% of checks, some aspects require manual assessment:

### Organization Quality

**Automated**: Detects if references/ exists
**Manual**: Assesses if references/ are well-organized by topic

**Check**:
- Are reference files grouped logically?
- Are file names descriptive?
- Is organization intuitive?

### Content Distribution

**Automated**: Checks line counts
**Manual**: Assesses if content is in right place

**Check**:
- Is SKILL.md appropriate overview level?
- Are detailed guides in references/?
- Is content well-distributed?

### Script Quality

**Automated**: Checks for module docstrings
**Manual**: Assesses script documentation quality

**Check**:
- Are scripts well-commented?
- Do functions have docstrings?
- Is CLI interface clear?
- Is error handling present?

---

## Structure Review Checklist

Complete checklist for Structure Review (Operation 1):

### Run Automation
- [ ] Run `validate-structure.py` on skill
- [ ] Review automated report
- [ ] Note score and issues

### YAML Frontmatter (Automated + Manual)
- [ ] YAML present and valid syntax
- [ ] `name` in kebab-case
- [ ] `description` has 5+ keywords
- [ ] Keywords natural (not stuffing)
- [ ] Optional fields used correctly

### File Structure (Automated + Manual)
- [ ] SKILL.md exists
- [ ] README.md present (or reasonably omitted)
- [ ] references/ organized (if present)
- [ ] scripts/ organized (if present)
- [ ] No stray files

### Naming (Automated + Manual)
- [ ] SKILL.md uppercase
- [ ] README.md uppercase (if present)
- [ ] references/ files kebab-case
- [ ] scripts/ files kebab-case
- [ ] Names descriptive

### Progressive Disclosure (Automated + Manual)
- [ ] SKILL.md <1,500 lines
- [ ] SKILL.md <1,200 or has references/
- [ ] references/ files 300-800 lines
- [ ] Content well-distributed
- [ ] No monolithic files

### Calculate Score
- [ ] Count passing checks (should be automated)
- [ ] Apply rubric (see scoring-rubric.md)
- [ ] Assign score 1-5
- [ ] Document rationale

---

## Examples: Structure Review in Action

### Example 1: Excellent Structure (Score 5)

**Skill**: development-workflow

**Checks**:
- ✅ YAML valid, 13+ keywords, natural
- ✅ SKILL.md exists, 1,027 lines (good)
- ✅ README.md exists, comprehensive
- ✅ references/ present with 2 files (workflow-examples.md 1,620 lines, common-patterns.md 1,212 lines)
- ✅ All naming conventions followed
- ✅ Perfect progressive disclosure

**Issues**: None

**Score**: 5/5 (Excellent)

**Rationale**: Perfect compliance, exemplary organization, can serve as example

---

### Example 2: Good Structure (Score 4)

**Skill**: todo-management

**Checks**:
- ✅ YAML valid, 8 keywords
- ✅ SKILL.md exists, 569 lines (excellent)
- ✅ README.md exists
- ✅ references/ present with 3 files
- ✅ scripts/ present with 1 file
- ✅ Naming conventions followed
- ⚠️ Missing Quick Reference section in SKILL.md (non-critical)

**Issues**: 1 warning (missing Quick Reference)

**Score**: 4/5 (Good)

**Rationale**: Meets all critical criteria, 1 minor issue, production-ready

---

### Example 3: Acceptable Structure (Score 3)

**Hypothetical Skill**: api-wrapper

**Checks**:
- ✅ YAML valid, 4 keywords (below target)
- ✅ SKILL.md exists, 1,350 lines (large)
- ❌ README.md missing
- ✅ references/ present with 1 file (950 lines - too large)
- ⚠️ Naming mostly correct (1 file CamelCase)
- ⚠️ Progressive disclosure needs improvement

**Issues**: 4 issues (3 warnings, 1 error)

**Score**: 3/5 (Acceptable)

**Rationale**: Usable but needs improvements - fix naming, add README, improve progressive disclosure

---

## Conclusion

Structure Review is **critical first step** in skill quality assessment:

- **Fast**: 5-10 minutes automated
- **Effective**: Catches 70% of common issues
- **Foundational**: Must pass before detailed review
- **Automated**: 95% automated via validate-structure.py

**Always run Structure Review first** before investing time in Content, Quality, Usability, or Integration reviews.

**For scoring details**, see `scoring-rubric.md`.
**For using the automation**, see scripts/validate-structure.py with --help flag.
