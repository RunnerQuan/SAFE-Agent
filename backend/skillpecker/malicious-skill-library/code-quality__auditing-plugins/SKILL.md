---
name: auditing-plugins
description: "Comprehensive plugin auditing for compliance with marketplace best practices. MUST Use when validating, refactoring, or improving plugin quality. Do not use for creating new plugins, scaffolding components, or development tasks."
allowed-tools: [Read, Grep, Glob, Bash]
---

# Plugin Audit Protocol



### 2. Issue Detection & Classification

**Critical Issues (Fix Immediately):**
- Unrestricted Bash permissions in Agents
- Missing `disable-model-invocation` in Commands (if marketplace requires)
- Hardcoded paths between Skills (no deep linking)
- Missing frontmatter fields (name, description)

**Major Issues (Fix Soon):**
- SKILL.md files exceeding marketplace size limits without progressive disclosure
- Commands with embedded logic (not simple wrappers)
- Inconsistent naming conventions
- Missing reference links

**Minor Issues (Fix When Convenient):**
- Typos in descriptions
- Inconsistent formatting
- Missing optional metadata fields

### 3. Audit Process

1. **Discover Marketplace Guidelines**
   - Read marketplace README or documentation
   - Identify specific standards and patterns
   - Understand validation requirements
   - Note marketplace-specific naming conventions

2. **Scan Frontmatter**
   - Validate name, description fields
   - Check tool permissions and whitelists
   - Verify frontmatter structure per marketplace standards

3. **Analyze Architecture**
   - Identify Skills without progressive disclosure
   - Check for deep linking between Skills
   - Verify Command wrapper patterns
   - Compare against marketplace patterns

4. **Security Review**
   - Scan for unrestricted permissions
   - Validate tool usage per marketplace security model
   - Check for forbidden patterns in marketplace docs

5. **Compliance Check**
   - Run marketplace's validation tools
   - Review all validation errors and warnings
   - Prioritize fixes by severity
   - Cross-reference with marketplace checklist

## Audit Methodology

### Step 1: Marketplace Discovery
Before auditing, gather marketplace context:

```
1. Read: MARKETPLACE_README.md or docs/ directory
2. Identify: Marketplace-specific standards document
3. Note: Naming conventions and patterns
4. Understand: Validation tools and processes
5. Check: Example plugins for reference
```

### Step 2: Pattern Recognition
Adapt your audit to marketplace conventions:

- **Description Patterns:** Some marketplaces use Standard pattern, others Enhanced
- **File Organization:** Check if marketplace has specific directory structure requirements
- **Validation Tools:** Identify and use marketplace-specific validators
- **Size Limits:** Note SKILL.md line count limits per marketplace standards

### Step 3: Comprehensive Scan
Apply marketplace-validated standards:

```
1. Frontmatter validation (name, description, required fields)
2. Permission model validation (per marketplace security model)
3. Architecture compliance (progressive disclosure, wrapper patterns)
4. Reference integrity (all links valid)
5. Marketplace-specific requirements
```

### Step 4: Issue Prioritization
Classify issues by marketplace impact:

- **Critical:** Breaks marketplace requirements or security
- **Major:** Violates marketplace best practices
- **Minor:** Cosmetic or style issues

## Output Format

**For Each Issue:**
```
## [SEVERITY] Issue Name
**Location:** file_path
**Description:** What is wrong
**Marketplace Impact:** How this affects marketplace compliance
**Fix:** Specific steps to resolve
**Reference:** Marketplace documentation section
```

**Summary:**
```
## Audit Summary
- Total Issues: N
- Critical: N
- Major: N
- Minor: N
- Files Audited: N
- Marketplace Guidelines Applied: [list]
- Validation Tools Used: [list]
```

## Reference Resources

- **See:** [checklist.md](references/checklist.md) - Adaptable validation checklist template
- **See:** [patterns.md](references/patterns.md) - Common anti-patterns and fixes
- **See:** [marketplace-customization.md](references/marketplace-customization.md) - How to adapt to different marketplaces
- **See:** [security.md](references/security.md) - Security best practices
- **See:** [compliance.md](references/compliance.md) - Compliance framework

## Marketplace Adaptation

Each marketplace may have unique requirements:

- **Documentation Location:** Some put guidelines in README.md, others in docs/ directory
- **Validation Tools:** Different marketplaces use different validators
- **Patterns:** Some require Standard descriptions, others Enhanced
- **File Organization:** Directory structure may vary
- **Size Limits:** SKILL.md limits may differ

Always adapt your audit process to the specific marketplace you're working with.
