# Adaptable Audit Checklist Template

## Customize for Your Marketplace

This checklist is a **template** that should be adapted to your specific marketplace's standards and requirements.

---

## Phase 1: Discover Marketplace Standards

### Documentation Discovery
- [ ] Located marketplace documentation (README.md, docs/, guidelines/)
- [ ] Identified marketplace-specific standards document
- [ ] Found example plugins for reference
- [ ] Understood validation tools and processes
- [ ] Noted marketplace naming conventions

### Pattern Recognition
- [ ] Description pattern: Standard or Enhanced (or marketplace-specific)
- [ ] Naming convention: kebab-case, snake_case, camelCase, etc.
- [ ] File organization requirements
- [ ] Size limits (if any)
- [ ] Required vs optional metadata fields

---

## Phase 2: Frontmatter Validation

### Required Fields (Per Marketplace)
- [ ] `name` field present and matches directory name
- [ ] `description` field present (length per marketplace standards)
- [ ] All marketplace-required fields present

### Naming Conventions (Per Marketplace)
- [ ] `name` follows marketplace naming convention
- [ ] Directory name matches `name` field exactly
- [ ] No prohibited characters in `name`

### Skills-Specific
- [ ] `allowed-tools` uses correct syntax (parentheses vs brackets)
- [ ] `user-invocable` (if present) follows marketplace format
- [ ] No forbidden fields per marketplace standards

### Commands-Specific
- [ ] `description` field present
- [ ] `disable-model-invocation` (if marketplace requires)
- [ ] `argument-hint` (if marketplace uses it)

### Agents-Specific
- [ ] `tools` list is explicit (never inherited from parent)
- [ ] Tools use marketplace-approved syntax
- [ ] Worker agents don't have AskUserQuestion (if marketplace forbids)
- [ ] No forbidden fields per marketplace standards

---

## Phase 3: Security Validation

### Permission Model (Per Marketplace)

**Bash Permissions (if marketplace requires restriction):**
- [ ] No unrestricted `Bash` tool specification
- [ ] Bash commands scoped with wildcards: `Bash(git:*)`
- [ ] Permissions match marketplace security model

**Tool Whitelists:**
- [ ] All Agents have explicit `tools` list (if marketplace requires)
- [ ] No Agent relies on inherited permissions (if marketplace forbids)
- [ ] Tools follow marketplace's least privilege model

**AskUserQuestion Restrictions:**
- [ ] Worker agents follow marketplace's AskUserQuestion policy
- [ ] Director/Coordinator agents (if marketplace has them) follow guidelines
- [ ] All other agents follow marketplace restrictions

**Forbidden Patterns (Check Marketplace Documentation):**
- [ ] No runtime permission flags in frontmatter (if marketplace forbids)
- [ ] No hardcoded paths to other Skills
- [ ] No bracket syntax (if marketplace requires parentheses)
- [ ] No relative paths across plugins (if marketplace forbids)

---

## Phase 4: Architecture Compliance

### Skills Size Limits (Per Marketplace)
- [ ] SKILL.md follows marketplace size limits
- [ ] If size exceeded, progressive disclosure implemented
- [ ] Heavy content moved to marketplace-approved locations

### Progressive Disclosure (Per Marketplace Standard)
- [ ] SKILL.md contains overview only (if marketplace prefers)
- [ ] Detailed examples in marketplace-approved directory
- [ ] Implementation guides properly located
- [ ] Templates in marketplace's asset location

### Commands Patterns (Per Marketplace)
- [ ] Commands follow marketplace's wrapper pattern
- [ ] Commands invoke Skills, don't implement workflows
- [ ] Commands have marketplace-required flags
- [ ] NO embedded logic in Commands (if marketplace forbids)

### Reference Links (Per Marketplace Convention)
- [ ] All references follow marketplace link convention
- [ ] No broken links to marketplace resources
- [ ] No deep linking between components (if marketplace forbids)

---

## Phase 5: Code Quality

### Content Quality
- [ ] No placeholder text: `{TEMPLATE}`, `{TODO}`
- [ ] No TODO comments without follow-up
- [ ] Examples are complete and functional
- [ ] Documentation is up-to-date

### Consistency
- [ ] Similar Skills follow marketplace patterns
- [ ] Terminology is consistent across codebase
- [ ] Formatting follows marketplace standards

---

## Phase 6: Validation Tools

### Marketplace-Specific Automated Checks
- [ ] Marketplace's validator passes with 0 errors
- [ ] All fixable issues resolved
- [ ] Marketplace-specific linters pass
- [ ] CI/CD pipeline passes (if applicable)

### Generic Validation (If No Marketplace Tool)
- [ ] Markdown linter passes
- [ ] YAML parser validates
- [ ] Links are valid
- [ ] File encoding is correct

### Manual Review
- [ ] Security-critical changes reviewed
- [ ] Breaking changes identified
- [ ] Migration guide provided (if needed)
- [ ] Marketplace compliance verified

---

## Severity Classification (Adapt to Your Marketplace)

### Critical (Fix Immediately)
- Breaks marketplace security requirements
- Missing marketplace-required fields
- Violates marketplace forbidden patterns
- Fails marketplace validation tools

### Major (Fix Within Sprint)
- Violates marketplace best practices
- Doesn't follow marketplace conventions
- Missing progressive disclosure (if marketplace requires)
- Inconsistent with marketplace patterns

### Minor (Fix When Convenient)
- Typos in descriptions
- Inconsistent formatting
- Missing optional metadata fields
- Suboptimal but functional implementations

---

## Customization Notes

### Add Your Marketplace-Specific Checks

```markdown
## [MARKETPLACE_NAME] Specific Requirements

### Custom Frontmatter
- [ ] Marketplace-specific field X present
- [ ] Field Y follows format: [FORMAT]

### Custom Architecture
- [ ] Directory structure: [MARKETPLACE_STRUCTURE]
- [ ] File naming: [MARKETPLACE_NAMING]
- [ ] Reference style: [MARKETPLACE_STYLE]

### Custom Security
- [ ] Permission model: [MARKETPLACE_MODEL]
- [ ] Required whitelists: [MARKETPLACE_LIST]
- [ ] Forbidden patterns: [MARKETPLACE_FORBIDDEN]

### Custom Validation
- [ ] Tool: [MARKETPLACE_VALIDATOR]
- [ ] Command: [VALIDATION_COMMAND]
- [ ] CI/CD: [CI_INTEGRATION]
```

---

## Quick Reference

### Validation Commands (Customize for Your Marketplace)

**Run Marketplace Validator:**
```bash
# Replace with your marketplace's validator
[MARKETPLACE_VALIDATOR] [PLUGIN_PATH]
```

**Auto-fix Issues:**
```bash
# If your marketplace provides auto-fix
[MARKETPLACE_VALIDATOR] --fix
```

**Check File Size:**
```bash
# Adapt to your marketplace's size requirements
wc -l [PLUGIN_DIR]/*/skills/*/SKILL.md | sort -nr | head -20
```

---

## Remember

**This checklist is a starting point.**

Your marketplace may have:
- Different required fields
- Different validation tools
- Different security models
- Different architectural patterns

**Always consult your marketplace's documentation** and customize this checklist accordingly.
