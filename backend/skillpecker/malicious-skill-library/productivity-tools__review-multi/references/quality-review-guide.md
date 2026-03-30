# Quality Review Guide

## Purpose

This guide provides detailed guidance for conducting Quality Review (Operation 3), evaluating pattern compliance, best practices adherence, anti-pattern detection, and code/script quality.

## Overview

Quality Review assesses how well a skill follows **established patterns and standards**. It validates architectural correctness, best practices adherence, and detects common anti-patterns that degrade quality.

**Automation**: 50% automated (pattern detection, anti-pattern checking), 50% manual assessment

**Time**: 20-40 minutes (mixed automated + manual)

**Focus Areas**:
1. Architecture Pattern Compliance - Is the pattern correctly implemented?
2. Documentation Pattern Adherence - Do sections follow conventions?
3. Best Practices - Are quality practices followed?
4. Anti-Pattern Detection - Are there quality issues to avoid?
5. Code Quality - Are scripts well-written? (if applicable)

## The 4 Architecture Patterns

### Pattern 1: Workflow-Based

**Characteristics**:
- Sequential steps with dependencies
- Each step builds on previous outputs
- Clear beginning and end
- Prerequisites and Post-Workflow sections
- Integration notes explain connections

**Structure**:
```markdown
## Prerequisites
[Setup requirements]

## [Skill Name] Workflow

### Step 1: [Action]
[Step content with Purpose, Process, Outputs, Validation]

### Step 2: [Next Action]
[Builds on Step 1 outputs]

### Step N: [Final Action]
[Final step]

## Post-Workflow
[What to do after]
```

**Validation**:
- [ ] Steps numbered sequentially
- [ ] Dependencies between steps documented
- [ ] Each step has consistent structure
- [ ] Integration notes explain step connections

**Examples**: medirecords-integration, deployment-guide, development-workflow

---

### Pattern 2: Task-Based

**Characteristics**:
- Independent operations without order
- Each operation stands alone
- No prerequisites for order
- Users select operations they need

**Structure**:
```markdown
## Operations

### Operation 1: [Action]
[Operation content]

### Operation 2: [Different Action]
[Independent of Operation 1]
```

**Validation**:
- [ ] Operations not numbered (no sequence implied)
- [ ] Each operation self-contained
- [ ] No dependencies between operations
- [ ] "When to Use This Operation" for each

**Examples**: railway-troubleshooting, todo-management, skill-researcher, review-multi

---

### Pattern 3: Reference/Guidelines

**Characteristics**:
- Standards, patterns, design systems
- Organized by topic/category
- Heavy on examples and guidance
- Quick Reference essential

**Structure**:
```markdown
## [Category 1]
[Guidelines and standards]

### [Subtopic 1.1]
[Detailed guidance]

## [Category 2]
[More guidelines]

## Quick Reference
[Lookup table/cheat sheet]
```

**Validation**:
- [ ] No "steps" or "operations"
- [ ] Organized by topic
- [ ] Comprehensive coverage
- [ ] Examples throughout

**Examples**: botanical-design, modal-patterns, common-patterns.md

---

### Pattern 4: Capabilities-Based

**Characteristics**:
- Multiple related features
- Features often used together
- Integration between capabilities
- Multiple entry points

**Structure**:
```markdown
## Core Capabilities
[Overview of integrated features]

## Capability 1: [Feature]
[How to use]

## Capability 2: [Feature]
[How to use]

## Integration Scenarios
[How capabilities work together]
```

**Validation**:
- [ ] Capabilities described individually
- [ ] Integration scenarios provided
- [ ] Multiple usage paths documented
- [ ] Composition examples included

**Examples**: Complex skills combining multiple independent but related features

---

## Documentation Pattern Standards

### The 5 Core Sections Pattern

Every skill should include (pattern names may vary):

1. **Overview/Introduction**
2. **When to Use** (5+ scenarios)
3. **Main Content** (workflow steps OR operations OR reference material OR capabilities)
4. **Best Practices** (5-9 practices)
5. **Quick Reference** (summary, cheat sheet, lookup)

### Consistent Step/Operation Structure

**For Workflow Steps**:
```markdown
### Step N: [Action Verb] [Object]

**Purpose**: [Why this step exists]

**Process**:
1. [Sub-action 1]
2. [Sub-action 2]

**Inputs**: [What you need] (optional)
**Outputs**: [What you get] (optional)

**Validation**:
- [ ] Check 1
- [ ] Check 2

**Example**:
[Concrete example]
```

**For Task Operations**:
```markdown
### Operation: [Action Name]

**Purpose**: [Why this operation exists]

**When to Use This Operation**:
- Scenario 1
- Scenario 2

**Process**:
1. [Step 1]
2. [Step 2]

**Validation**:
- [ ] Check 1

**Example**:
[Concrete example]
```

### Section Order Pattern

Recommended order:
1. YAML Frontmatter
2. Title (h1)
3. Overview (h2)
4. When to Use (h2)
5. Prerequisites (h2) - optional
6. Main Content (h2)
7. Post-Workflow / Next Steps (h2) - optional for workflows
8. Best Practices (h2)
9. Common Mistakes (h2) - optional
10. Troubleshooting (h2) - optional
11. Quick Reference (h2) - last section

**Rationale**: Flows from overview → usage → content → guidance → reference

---

## Best Practices Checklist

### Practice 1: Validation Checklists

**Standard**: Include validation checklists in each step/operation and at skill end

**Format**:
```markdown
**Validation**:
- [ ] Specific measurable check
- [ ] Another objective check
```

**Quality Criteria**:
- Specific (not vague)
- Measurable (can verify yes/no)
- Objective (not subjective)
- Actionable (clear what to check)

**Good Checklist Items**:
- ✅ "YAML frontmatter validates without errors"
- ✅ "Minimum 5 trigger keywords in description"
- ✅ "All 3 operations have complete structure"

**Bad Checklist Items**:
- ❌ "Everything looks good" (not specific)
- ❌ "Skill is high quality" (not measurable)
- ❌ "Documentation complete" (not objective)

### Practice 2: Examples Throughout

**Standard**: Include examples after major concepts (target: 5-10 per skill)

**Format**:
```markdown
**Example**:
```language
[code/command]
```

**Explanation**: [What this does]
```

**Guidelines**:
- Concrete values (not placeholders)
- Executable (copy-paste ready)
- Annotated (comments or explanations)

### Practice 3: Consistent Structure

**Standard**: Use same structure across all steps/operations

**Why**: Consistency enables pattern recognition, easier to parse

**Check**:
- [ ] All steps/operations follow same format
- [ ] Same subsections in each (Purpose, Process, Validation)
- [ ] Heading levels consistent

### Practice 4: Clear Error Handling

**Standard**: Document error scenarios and recovery

**Content**:
- Common errors and causes
- Error messages and meanings
- Recovery/fix guidance
- Prevention tips

**Location**: Common Mistakes section or within steps

### Practice 5: Progressive Disclosure

**Standard**: SKILL.md overview, references/ details

**Guidelines**:
- SKILL.md <1,200 lines ideal
- Move detailed content to references/
- Point to references for deep dives

---

## The 10 Anti-Patterns

Reference: `development-workflow/references/common-patterns.md` - Anti-Patterns section

### Anti-Pattern 1: Keyword Stuffing

**Description**: Unnatural trigger keyword lists in YAML description

**Detection**:
- Description reads like keyword list
- Same word repeated 3+ times
- No context or natural sentences

**Example**:
```yaml
# Bad
description: Skills, skill building, skill creation, skill development, skill workflow, skill patterns, skills skills skills.
```

**Fix**: Natural language with embedded keywords
```yaml
# Good
description: Comprehensive workflow for skill development from research through planning to implementation.
```

### Anti-Pattern 2: Monolithic SKILL.md

**Description**: Single large file (>1,500 lines) with no progressive disclosure

**Detection**:
- SKILL.md >1,500 lines
- No references/ directory
- All detailed content in one file

**Impact**: Loads too much content, poor user experience

**Fix**: Extract detailed content to references/, keep overview in SKILL.md

### Anti-Pattern 3: Inconsistent Structure

**Description**: Each step/operation has different structure

**Detection**:
- Step 1 has Purpose, Step 2 doesn't
- Different subsections across sections
- No pattern to structure

**Impact**: Hard to parse, confusing

**Fix**: Standardize structure across all steps/operations

### Anti-Pattern 4: Vague Validation

**Description**: Validation criteria not specific or measurable

**Detection**:
- Checklist items like "Everything works"
- Subjective criteria ("Looks good")
- Can't objectively verify

**Impact**: Can't validate completion, unreliable

**Fix**: Make validation specific and measurable

### Anti-Pattern 5: Missing Examples

**Description**: Long explanations with no concrete examples

**Detection**:
- <3 examples total
- Abstract explanations only
- No code/command samples

**Impact**: Hard to understand, can't apply

**Fix**: Add concrete examples after each major concept

### Anti-Pattern 6: Unclear Dependencies

**Description**: Skill references other skills but doesn't explain how

**Detection**:
- Mentions other skills without integration guidance
- No YAML dependencies field when needed
- Unclear when/how to use other skills

**Impact**: Users don't know integration points

**Fix**: Document dependencies in YAML and explain integration

### Anti-Pattern 7: No Quick Reference

**Description**: Skill ends without summary/lookup section

**Detection**:
- No Quick Reference section
- No summary table/cheat sheet
- Last section is detailed content

**Impact**: Hard to refresh memory, requires re-reading

**Fix**: Add Quick Reference as final section

### Anti-Pattern 8: Placeholders in Production

**Description**: Examples have placeholder values like "YOUR_VALUE_HERE"

**Detection**:
- Examples with [PLACEHOLDER]
- Generic values that don't work
- "Replace this" instructions

**Impact**: Examples not executable, forces guesswork

**Fix**: Use realistic concrete values with brief note on what to change

### Anti-Pattern 9: Ignoring Error Cases

**Description**: Only documenting happy path

**Detection**:
- No error handling documentation
- No Common Mistakes section
- No troubleshooting guidance

**Impact**: Users stuck when errors occur

**Fix**: Add error scenarios, recovery guidance, Common Mistakes section

### Anti-Pattern 10: Over-Engineering Simple Skills

**Description**: Creating complex structure for simple skill

**Detection**:
- Simple skill (<300 lines) with references/, scripts/, examples/
- Unnecessary automation
- Complexity not justified

**Impact**: Maintenance overhead, unnecessary

**Fix**: Keep simple skills simple - just SKILL.md if sufficient

---

## Code Quality Assessment (Scripts)

### When Scripts Present

If skill includes scripts/ directory with automation tools, assess code quality:

### Module-Level Documentation

**Check**:
- [ ] Module docstring at top
- [ ] Usage examples in docstring
- [ ] Purpose clearly stated

**Example (Good)**:
```python
#!/usr/bin/env python3
"""
Automated structure validation for Claude Code skills.

Validates:
- YAML frontmatter
- File structure
- Naming conventions

Usage:
    python validate-structure.py <skill_path> [--json]
"""
```

### Function Documentation

**Check**:
- [ ] All functions have docstrings
- [ ] Parameters documented
- [ ] Return values documented
- [ ] Exceptions documented (if raised)

**Example (Good)**:
```python
def validate_yaml_frontmatter(self) -> Tuple[bool, List[str]]:
    """
    Validate YAML frontmatter syntax and fields.

    Returns:
        Tuple of (passed, issues_list)
    """
```

### Error Handling

**Check**:
- [ ] Try/except blocks for risky operations
- [ ] Clear error messages
- [ ] Graceful failure (doesn't crash)
- [ ] Exit codes meaningful

### CLI Interface

**Check**:
- [ ] argparse or similar for arguments
- [ ] --help flag works
- [ ] Usage examples provided
- [ ] Exit codes documented

---

## Quality Review Checklist

Complete checklist for Quality Review (Operation 3):

### Architecture Pattern
- [ ] Pattern type identified (workflow/task/reference/capabilities)
- [ ] Pattern correctly implemented
- [ ] Pattern consistent throughout
- [ ] Pattern choice appropriate for skill type

### Documentation Patterns
- [ ] 5 core sections present
- [ ] Section order follows standard
- [ ] Consistent structure across steps/operations
- [ ] Headers at appropriate levels (h2, h3)

### Best Practices
- [ ] Validation checklists present
- [ ] Validation criteria specific and measurable
- [ ] Examples throughout (5+ total)
- [ ] Quick Reference present
- [ ] Error cases considered
- [ ] Best Practices section actionable

### Anti-Patterns
- [ ] No keyword stuffing (natural keywords)
- [ ] No monolithic SKILL.md (progressive disclosure)
- [ ] No inconsistent structure
- [ ] No vague validation
- [ ] No missing examples
- [ ] No placeholder examples in production
- [ ] No ignored error cases
- [ ] No over-engineering
- [ ] No unclear dependencies
- [ ] No missing Quick Reference

### Code Quality (if scripts present)
- [ ] Module docstrings present
- [ ] Function docstrings present
- [ ] Error handling implemented
- [ ] CLI interface clear
- [ ] Code style consistent

### Calculate Score
- [ ] Count checks passed
- [ ] Apply rubric (10 pass = 5, 8-9 = 4, 6-7 = 3, 4-5 = 2, ≤3 = 1)
- [ ] Assign score 1-5
- [ ] Document evidence

---

## Using check-patterns.py

### Basic Usage

```bash
python3 scripts/check-patterns.py /path/to/skill
```

**Output**: Pattern compliance report, anti-patterns detected

### Detailed Mode

```bash
python3 scripts/check-patterns.py /path/to/skill --detailed
```

**Output**: Verbose analysis with specific pattern requirements

### JSON Mode

```bash
python3 scripts/check-patterns.py /path/to/skill --json
```

**Output**: JSON format for programmatic processing

---

## Pattern Detection Methods

### Detecting Workflow Pattern

**Indicators**:
- Steps numbered sequentially (Step 1, Step 2, etc.)
- Prerequisites section present
- Post-Workflow section present
- Integration notes explain connections
- Steps reference previous step outputs

**Validation**:
- [ ] Sequential numbering
- [ ] Dependencies documented
- [ ] Integration clear

### Detecting Task Pattern

**Indicators**:
- Operations not numbered
- Each operation independent
- "When to Use This Operation" for each
- No sequential dependencies
- Operations can be done in any order

**Validation**:
- [ ] Operations independent
- [ ] No sequence numbers
- [ ] Each operation complete

### Detecting Reference Pattern

**Indicators**:
- No steps or operations
- Organized by topic/category
- Standards and guidelines focus
- Pattern library or design system

**Validation**:
- [ ] Topic-based organization
- [ ] Comprehensive coverage
- [ ] Standards clearly stated

### Detecting Capabilities Pattern

**Indicators**:
- Multiple features/capabilities listed
- Integration scenarios provided
- "Core Capabilities" section
- Features work together
- Common workflows documented

**Validation**:
- [ ] Capabilities listed
- [ ] Integration documented
- [ ] Usage paths clear

---

## Anti-Pattern Detection Methods

### Detection Process

For each anti-pattern:
1. **Check indicators**: Does evidence of pattern exist?
2. **Assess severity**: How bad is it?
3. **Document evidence**: What specifically indicates this pattern?
4. **Provide fix**: How to resolve?

### Anti-Pattern Detection Checklist

Run through each anti-pattern:

**AP1: Keyword Stuffing**
- Check: Description readability, word repetition
- Severity: Medium (affects discoverability)
- Fix: Rewrite description naturally

**AP2: Monolithic SKILL.md**
- Check: SKILL.md line count, references/ existence
- Severity: High (violates progressive disclosure)
- Fix: Extract content to references/

**AP3: Inconsistent Structure**
- Check: Step/operation structure comparison
- Severity: Medium (affects usability)
- Fix: Standardize structure

**AP4: Vague Validation**
- Check: Validation checklist specificity
- Severity: Medium (reduces reliability)
- Fix: Make criteria specific and measurable

**AP5: Missing Examples**
- Check: Example count (<3 is issue)
- Severity: High (affects understanding)
- Fix: Add concrete examples

**AP6: Unclear Dependencies**
- Check: Dependency documentation
- Severity: Medium (affects integration)
- Fix: Document dependencies clearly

**AP7: No Quick Reference**
- Check: Quick Reference section existence
- Severity: Low (nice to have)
- Fix: Add Quick Reference section

**AP8: Placeholders in Production**
- Check: Examples for "YOUR_" or "[PLACEHOLDER]"
- Severity: High (examples not usable)
- Fix: Replace with concrete realistic values

**AP9: Ignoring Error Cases**
- Check: Error handling documentation
- Severity: Medium (users stuck on errors)
- Fix: Add error scenarios and recovery

**AP10: Over-Engineering**
- Check: Complexity vs skill simplicity
- Severity: Low-Medium (maintenance burden)
- Fix: Simplify structure

---

## Quality Review Scoring Examples

### Score 5: Exemplary Quality

**Characteristics**:
- Pattern perfectly implemented
- All best practices followed
- No anti-patterns detected
- Exceptional organization
- Scripts excellent (if present)

**Example**: development-workflow
- Workflow pattern perfect
- All best practices present
- Zero anti-patterns
- Exemplary code quality

---

### Score 4: High Quality

**Characteristics**:
- Pattern correctly implemented
- Most best practices followed
- 1 minor anti-pattern (low severity)
- Good organization
- Scripts good (if present)

**Example**: workflow-skill-creator
- Workflow pattern correct
- Best practices mostly followed
- 1 anti-pattern: limited error handling
- Good overall quality

---

### Score 3: Acceptable Quality

**Characteristics**:
- Pattern mostly correct
- Some best practices missing
- 2-3 anti-patterns (medium severity)
- Acceptable organization
- Scripts adequate (if present)

**Issues to Address**:
- Improve pattern compliance
- Add missing best practices
- Fix detected anti-patterns

---

### Score 2: Quality Issues

**Characteristics**:
- Pattern partially correct
- Many best practices missing
- 4-5 anti-patterns detected
- Organization problems
- Scripts poor (if present)

**Not Production-Ready**: Significant improvements required

---

### Score 1: Poor Quality

**Characteristics**:
- Pattern incorrect or absent
- Best practices not followed
- 6+ anti-patterns detected
- Severe organization problems
- Scripts severely flawed (if present)

**Not Viable**: Extensive rework required

---

## Improvement Strategies

### Improving Pattern Compliance

1. **Identify pattern type** (what should it be?)
2. **Compare to pattern template** (see common-patterns.md)
3. **Align structure** to match pattern requirements
4. **Validate consistency** throughout skill

### Adding Missing Best Practices

1. **Review best practices list** (validation checklists, examples, Quick Reference)
2. **Identify gaps** (which practices missing?)
3. **Add systematically** (validation checklists → examples → Quick Reference)
4. **Validate addition** (practice correctly implemented?)

### Fixing Anti-Patterns

**For each anti-pattern detected**:

1. **Understand why it's an anti-pattern** (read rationale)
2. **Assess severity** in this context
3. **Apply recommended fix**
4. **Validate fix** (anti-pattern no longer present)

**Prioritize**: High severity anti-patterns first (monolithic, missing examples, placeholders)

---

## Quality Review Examples

### Example 1: Pattern Compliance Check

**Skill**: todo-management

**Analysis**:
```
Pattern Detection:
- Type: Task-based
- Evidence: 8 operations, not numbered, independent
- Compliance: ✅ Correct

Pattern Implementation:
- Operations independent: ✅ Yes
- No sequence numbers: ✅ Correct
- Each operation complete: ✅ Yes
- "When to Use This Operation": ⚠️ Not present (minor)

Pattern Compliance Score: 9/10 (Excellent)
Minor improvement: Add "When to Use This Operation" to each
```

### Example 2: Anti-Pattern Detection

**Hypothetical Skill**: data-formatter

**Analysis**:
```
Anti-Pattern Scan:

✅ AP1: Keyword Stuffing - NOT detected
✅ AP2: Monolithic SKILL.md - NOT detected (980 lines, has references/)
✅ AP3: Inconsistent Structure - NOT detected
✅ AP4: Vague Validation - NOT detected
❌ AP5: Missing Examples - DETECTED (only 2 examples)
✅ AP6: Unclear Dependencies - NOT detected
❌ AP7: No Quick Reference - DETECTED (missing section)
✅ AP8: Placeholders - NOT detected
❌ AP9: Ignoring Error Cases - DETECTED (no error handling)
✅ AP10: Over-Engineering - NOT detected

Anti-Patterns Found: 3 (AP5, AP7, AP9)
Severity: Medium (affects usability and completeness)

Recommendations:
1. Add 3-5 more concrete examples
2. Add Quick Reference section (summary table)
3. Add error handling examples and Common Mistakes section
```

---

## Conclusion

Quality Review ensures skills follow **established patterns and standards**:

1. **Pattern Compliance**: Correct architecture pattern implementation
2. **Best Practices**: Validation checklists, examples, consistency
3. **Anti-Pattern Avoidance**: No common quality issues
4. **Code Quality**: Well-documented, error-handled scripts

**Target**: Score ≥4 for production readiness (no critical anti-patterns, follows patterns)

**For scoring details**, see `scoring-rubric.md` Dimension 3.
**For pattern templates**, see `development-workflow/references/common-patterns.md`.
**For automation**, use `scripts/check-patterns.py`.
