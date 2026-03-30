# Marketplace Customization Guide

## Adapting the Audit Process

This skill is designed to be **marketplace-agnostic** and adaptable to different plugin ecosystems. Follow this guide to customize your audit process for your specific marketplace.

---

## Step 1: Discover Your Marketplace's Standards

### Find the Documentation
Different marketplaces organize their documentation differently:

**Common Locations:**
```
- MARKETPLACE_README.md
- README.md (marketplace root)
- docs/ directory
- guidelines/ directory
- STANDARDS.md
- CONTRIBUTING.md
```

**What to Look For:**
- Naming conventions (kebab-case, camelCase, etc.)
- Description pattern requirements (Standard vs Enhanced)
- File organization standards
- Validation tools and commands
- Security requirements

### Identify Key Documents

**Standards Document:**
- Contains official marketplace standards
- Defines required vs optional fields
- Lists forbidden patterns
- Describes validation process

**Examples Directory:**
- Shows properly formatted plugins
- Demonstrates marketplace patterns
- Provides reference implementations

**Validation Tools:**
- Scripts to check compliance
- Automated linters or validators
- CI/CD integration guides

---

## Step 2: Customize the Audit Checklist

### Adapt to Your Marketplace

The base checklist is generic. Customize it for your marketplace:

```markdown
## Marketplace-Specific Requirements

### Your Marketplace's Standards
- [ ] Frontmatter follows YOUR_MARKETPLACE naming convention
- [ ] Descriptions use YOUR_MARKETPLACE pattern (Standard/Enhanced)
- [ ] Files organized per YOUR_MARKETPLACE structure
- [ ] Validation passes YOUR_MARKETPLACE's tools
- [ ] Security model follows YOUR_MARKETPLACE requirements
```

### Customization Template

```markdown
## [MARKETPLACE_NAME] Custom Checks

### Phase 1: Marketplace-Specific Frontmatter
- [ ] Required field X present
- [ ] Optional field Y follows format
- [ ] Description matches [MARKETPLACE_PATTERN]
- [ ] Name follows [NAMING_CONVENTION]

### Phase 2: Marketplace Architecture
- [ ] Directory structure matches [MARKETPLACE_STANDARD]
- [ ] File size limits per [SIZE_GUIDELINES]
- [ ] Reference links follow [LINK_CONVENTION]

### Phase 3: Marketplace Security
- [ ] Permissions follow [SECURITY_MODEL]
- [ ] Tool whitelists per [PERMISSION_STANDARD]
- [ ] No forbidden patterns from [FORBIDDEN_LIST]

### Phase 4: Marketplace Validation
- [ ] Passes [VALIDATION_TOOL_1]
- [ ] Passes [VALIDATION_TOOL_2]
- [ ] Meets [QUALITY_THRESHOLD]
```

---

## Step 3: Pattern Recognition

### Marketplace Pattern Types

**1. Description Patterns**

*Standard Pattern (Common):*
```yaml
description: "Provides/Creates/Implements {capability}. Use when {trigger}."
```

*Enhanced Pattern (Some Marketplaces):*
```yaml
description: "Provides {capability}. {MODAL} Use when {trigger}."
# Where MODAL is: MUST/SHOULD/PROACTIVELY
```

*Marketplace-Specific Pattern:*
```yaml
description: "[YOUR_PATTERN_TYPE] - {custom format}"
```

**2. Naming Conventions**

*Common Options:*
- kebab-case: `my-skill-name`
- snake_case: `my_skill_name`
- camelCase: `mySkillName`
- PascalCase: `MySkillName`

**3. File Organization**

*Skill Structure Variations:*
```
Option A (Common):
skills/
  skill-name/
    SKILL.md
    README.md (optional)
    references/
    examples/
    assets/

Option B:
components/
  skills/
    skill-name.md
    examples/
      skill-name/

Option C:
plugins/
  skill-name/
    index.md
    docs/
      reference.md
```

---

## Step 4: Validation Tools

### Marketplace-Specific Tools

**Common Validation Tools:**

1. **Generic Markdown Linters:**
   - `markdownlint`
   - `remark`
   - Custom regex checks

2. **Schema Validators:**
   - JSON Schema validation
   - YAML structure validation
   - Custom parser

3. **Plugin-Specific Validators:**
   - `marketplace-validator.py`
   - `plugin-lint.js`
   - `validate-plugins.sh`

**How to Integrate:**

```bash
# Run marketplace's validator
[VALIDATION_COMMAND]

# Custom validator
[YOUR_VALIDATOR] --strict

# Automated checks
[CI_TOOL] validate
```

---

## Step 5: Security Models

### Permission Systems Vary

**Model 1: Explicit Whitelisting (Common)**
```yaml
tools: [Read, Write, Bash(git:*)]
```

**Model 2: Implicit with Restrictions**
```yaml
# Tools allowed but with runtime checks
tools: [Read, Write, Bash]
```

**Model 3: Capability-Based**
```yaml
capabilities:
  - file-operations
  - git-integration
  - python-execution
```

**Adapt Security Review:**
- Identify your marketplace's security model
- Check for proper permission specifications
- Validate against marketplace security requirements
- Ensure no forbidden permission patterns

---

## Step 6: Common Marketplace Variations

### Variation 1: Size Limits

**Some Marketplaces Have Strict Limits:**
- SKILL.md: <100 lines (progressive disclosure required)
- SKILL.md: <500 lines (allowed but discouraged)
- SKILL.md: No limit (flexible)

**Adapt:** Check your marketplace's size requirements

### Variation 2: Reference Structure

**Progressive Disclosure Approaches:**
- Heavy use of `references/` directory
- Inline examples with collapse sections
- External documentation links
- Hybrid approach

**Adapt:** Follow your marketplace's documentation strategy

### Variation 3: Command Patterns

**Command Wrapper Styles:**
- Simple delegation: "Invoke X skill"
- Orchestration: Brief workflow description
- Full workflow: Detailed step-by-step
- Zero-retention: With disable-model-invocation

**Adapt:** Use your marketplace's preferred command style

---

## Quick Adaptation Checklist

### Before Auditing:

- [ ] Located marketplace documentation
- [ ] Identified naming conventions
- [ ] Understood description patterns
- [ ] Found validation tools
- [ ] Reviewed example plugins
- [ ] Noted size/organization requirements
- [ ] Understood security model
- [ ] Customized audit checklist

### During Audit:

- [ ] Apply marketplace-specific patterns
- [ ] Use marketplace validation tools
- [ ] Check marketplace-specific requirements
- [ ] Reference marketplace documentation
- [ ] Validate against marketplace standards

### After Audit:

- [ ] Report marketplace-specific issues
- [ ] Reference marketplace documentation
- [ ] Provide marketplace-compliant fixes
- [ ] Suggest marketplace-specific improvements

---

## Example: Adapting to Different Marketplaces

### Example 1: Claude Code Plugin Marketplace

**Documentation:** `/CLAUDE.md` in each plugin
**Pattern:** Enhanced (MUST/SHOULD/PROACTIVELY)
**Validator:** `toolkit.py`
**Size Limit:** <500 lines (progressive disclosure recommended)
**Security:** Explicit Bash whitelisting required

### Example 2: VS Code Extension Marketplace

**Documentation:** `README.md` with extension guidelines
**Pattern:** Standard with badges
**Validator:** `vsce validate`
**Size Limit:** No strict limit
**Security:** Marketplace permissions model

### Example 3: Custom Enterprise Marketplace

**Documentation:** Internal wiki/Confluence
**Pattern:** Enterprise-specific (may include org standards)
**Validator:** Custom internal tools
**Size Limit:** 200 lines max
**Security:** Corporate security model

---

## Key Principle

**The audit skill is a framework, not a prescription.**

Always adapt it to your marketplace's:
- Documentation standards
- Validation tools
- Security model
- Architectural patterns
- Quality requirements

Your marketplace's documentation is the source of truth, not hardcoded patterns.
