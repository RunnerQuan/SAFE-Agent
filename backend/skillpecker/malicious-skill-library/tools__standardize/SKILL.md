---
name: standardize
description: Apply a convention or pattern consistently across a codebase scope
argument-hint: <CONVENTION> in <SCOPE>
---

# Standardize: $ARGUMENTS

Apply a documented convention or pattern consistently across a specified scope in the codebase.

**Example invocations**:

- `/standardize error handling in src/graph/`
- `/standardize repository pattern in taxonomy domain`
- `/standardize gRPC-style exceptions across all services`
- `/standardize type hints in src/core/ai_suggestions/`

## When to Use This Skill

Use `/standardize` when you need to:

- Migrate from an old pattern to a new one (e.g., legacy exceptions → gRPC-style errors)
- Apply a documented convention that's inconsistently followed
- Enforce consistency after a pattern was established
- Clean up technical debt from pattern drift

**Not for**: One-off fixes (use `/bug-fix`) or new features (use `/implement`).

## Workflow

### Phase 0: Workspace Setup

Before starting standardization, determine where to work.

#### 0.1 Check Current State

```bash
git status
git branch --show-current
```

#### 0.2 Ask About Worktree

Use `AskUserQuestion`:

```
Where should I apply this standardization?

**Option A: New worktree** (Recommended for large scopes)
- Creates isolated workspace
- Safe for sweeping changes across many files
- Allows multiple agents to work simultaneously

**Option B: Current worktree**
- Simpler, no setup overhead
- Good for small, contained scopes
```

#### 0.3 Set Up Workspace

**If new worktree**:
```bash
# Create branch and worktree
git worktree add ../cernel-backend-standardize-<convention> -b refactor/standardize-<convention>

# Copy environment files (required - these are gitignored)
cp .env* ../cernel-backend-standardize-<convention>/

# Copy local Claude settings if they exist
cp -r .claude/settings.local.json ../cernel-backend-standardize-<convention>/.claude/ 2>/dev/null || true

# Navigate to worktree
cd ../cernel-backend-standardize-<convention>

# Install dependencies (venv is gitignored, so must be recreated)
uv sync --all-packages
```

**If current worktree**:
```bash
git checkout -b refactor/standardize-<convention>
```

### Phase 1: Parse Input

Extract from `$ARGUMENTS`:

- **Convention**: What pattern/convention to apply
- **Scope**: Where to apply it (directory, domain, or "all")

If unclear, use `AskUserQuestion` to clarify:

- Which specific convention? (reference CLAUDE.md section if applicable)
- What's the target scope?
- Are there any exclusions?

### Phase 2: Understand the Convention

#### 2.1 Find the Canonical Definition

Look for the convention in:

1. `CLAUDE.md` - Main project conventions
2. Domain-specific `CLAUDE.md` files (e.g., `src/graph/CLAUDE.md`)
3. Existing exemplary implementations

```
Use Task tool with Explore agent:

Find the canonical definition and examples of [CONVENTION]:
1. Search CLAUDE.md files for documentation
2. Find 2-3 existing implementations that follow the pattern correctly
3. Identify the key characteristics that define "correct" usage
```

#### 2.2 If Pattern Has Variants

If there are multiple valid approaches to the convention, identify and present them:

```markdown
## Pattern Variants for [Convention]

### Option A: [Name]
- **Approach**: [Description]
- **Pros**: [Benefits]
- **Cons**: [Drawbacks]

### Option B: [Name]
- **Approach**: [Description]
- **Pros**: [Benefits]
- **Cons**: [Drawbacks]

Which approach should we use?
```

Use `AskUserQuestion` to get a decision before proceeding.

**Example from error handling**:

- Option A: Keep domain exceptions pure, map at API boundary (cleaner separation)
- Option B: Make domain exceptions inherit from gRPC errors (automatic HTTP mapping)

#### 2.3 Validate Architectural Fit

Before applying broadly, validate the pattern belongs at this layer:

- **Layer appropriateness**: Does this pattern belong in domain, API, or infrastructure?
- **Coupling concerns**: Are we coupling things that should be separate?
- **Dependency direction**: Does this respect the dependency flow (all dependencies flow inward to core)?

If uncertain, discuss with the user:

```markdown
## Architectural Consideration

The proposed pattern would [describe what it does].

This means [layer X] would now depend on [layer Y].

Is this the right architectural choice, or should we keep these concerns separate?
```

#### 2.4 Document the Target State

Summarize what "correct" looks like:

````markdown
## Convention: [Name]

### Correct Pattern
[Description of how it should be done]

### Example (from codebase)
`path/to/exemplary/file.py:123`
```python
# Correct implementation
[code snippet]
````

### Anti-pattern (what we're fixing)

```python
# Incorrect/legacy implementation
[code snippet]
```

### Key Indicators

- [What to search for to find violations]
- [Patterns that indicate old/wrong usage]

```

### Phase 3: Find Violations

#### 3.1 Search for Anti-patterns

Use targeted searches to find code that doesn't follow the convention:

```

Use Task tool with Explore agent:

Find all violations of [CONVENTION] in \[SCOPE\]:

1. Search for anti-pattern indicators
2. Check each file for old/inconsistent usage
3. Categorize findings by file/module
4. Note the specific changes needed for each

````

#### 3.2 Categorize Findings

Group violations by:
- **Simple**: Direct replacement, low risk
- **Complex**: Requires refactoring, affects multiple files
- **Uncertain**: Needs human judgment

```markdown
## Violations Found

### Simple (direct replacement)
| File | Line | Current | Should Be |
|------|------|---------|-----------|
| `path/file.py` | 45 | `raise OldException()` | `raise NewException()` |

### Complex (requires refactoring)
- `path/complex.py`: [Description of what needs changing]

### Uncertain (needs review)
- `path/edge_case.py`: [Why this is unclear]
````

### Phase 4: Breaking Change Risk Assessment

**CRITICAL**: Before applying changes, evaluate impact on external consumers.

#### 4.1 Identify API Contract Changes

Check if the standardization will change:

- **HTTP status codes**: Will error responses return different status codes?
- **Error response structure**: Will field names or format change?
- **Error codes/messages**: Do consumers key off specific error strings?

#### 4.2 Categorize Risk Level

| Risk Level | Criteria                                  | Action                             |
| ---------- | ----------------------------------------- | ---------------------------------- |
| **LOW**    | Internal-only code, no API exposure       | Proceed normally                   |
| **MEDIUM** | API changes but same status codes         | Note in plan, proceed with caution |
| **HIGH**   | Status codes change, error format changes | Explicit user approval required    |

#### 4.3 Present Breaking Changes

If HIGH RISK changes are identified:

```markdown
## ⚠️ Breaking Change Warning

The following changes may break existing API integrations:

| Scenario | Before | After | Risk |
|----------|--------|-------|------|
| Metric not found | HTTP 500 | HTTP 404 | Customers checking `status == 500` will break |
| Duplicate metric | HTTP 500 | HTTP 409 | Customers checking `status == 500` will break |

### Options
1. **Proceed anyway**: Accept the breaking change (may require customer communication)
2. **Maintain backwards compatibility**: Keep old behavior, add new pattern alongside
3. **Scope reduction**: Exclude high-risk endpoints from this standardization

Which approach should we take?
```

Use `AskUserQuestion` to get explicit approval for breaking changes.

### Phase 5: Present Plan and Get Approval

**CRITICAL**: Get explicit approval before making changes.

Present:

1. Summary of convention being applied
2. Number of files affected
3. Categorized list of changes
4. Any uncertain cases that need human decision

```markdown
## Standardization Plan: [Convention] in [Scope]

### Summary
- **Files affected**: [N]
- **Simple changes**: [N]
- **Complex changes**: [N]
- **Uncertain cases**: [N]

### Changes Preview
[Show representative examples of each category]

### Uncertain Cases
[List any that need human decision]

---

Should I proceed with these changes?
- Yes, apply all changes
- Yes, but skip uncertain cases
- Let me review the uncertain cases first
- No, let's adjust the scope
```

Use `AskUserQuestion` to get approval and handle uncertain cases.

### Phase 6: Apply Changes

#### 6.1 Apply Simple Changes First

For each simple change:

1. Make the edit
2. Verify syntax is correct
3. Move to next

#### 6.2 Apply Complex Changes

For each complex change:

1. Read the full context
2. Apply the refactoring
3. Check for ripple effects (imports, callers)
4. Update related code if needed

#### 6.3 Handle Edge Cases

For uncertain cases (if user approved):

1. Apply conservatively
2. Add TODO comment if truly ambiguous
3. Note in summary for manual review

### Phase 7: Verification

#### 7.1 Run Linting

```bash
task lint
```

Fix any issues introduced by the changes.

#### 7.2 Run Tests

```bash
task test
```

If tests fail:

1. Identify if failure is due to our changes
2. Fix the issue
3. Re-run tests

#### 7.3 Verify Consistency

Quick check that no violations remain in scope:

```
Search for anti-pattern indicators in [SCOPE]
Confirm all have been addressed
```

### Phase 8: Summary

Provide a complete summary:

```markdown
## Standardization Complete: [Convention] in [Scope]

### Changes Made
- **Files modified**: [N]
- **Simple replacements**: [N]
- **Complex refactors**: [N]
- **Skipped (uncertain)**: [N]

### Files Changed
- `path/to/file1.py`: [Brief description]
- `path/to/file2.py`: [Brief description]
- ...

### Verification
- Linting: ✅ Passing
- Tests: ✅ Passing
- No remaining violations in scope

### Notes
- [Any edge cases or follow-up items]
- [Files that might need manual review]
```

### Phase 9: Pull Request

After verification passes, offer to create a PR.

#### 9.1 Ask About PR Creation

Use `AskUserQuestion`:

```
Standardization complete and verified. Would you like me to open a Pull Request?

- Yes, create PR targeting main/master
- Yes, but target a different branch
- No, I'll handle the PR myself
```

#### 9.2 Create the PR

If approved, create the PR:

```bash
git add -A
git commit -m "refactor: standardize <convention> in <scope>

Applied <convention> consistently across <N> files.
No functional changes - pattern consistency only."

git push -u origin <branch-name>

gh pr create --title "refactor: standardize <convention> in <scope>" --body "## Summary
<1-2 sentences explaining what convention was applied and where>

## Problem
<Why this standardization was needed - inconsistency, tech debt, etc.>

## Solution
<The pattern/convention that was applied - 2-4 bullet points>
- Before: <old pattern>
- After: <new pattern>

## Changes
- **Files modified**: <N>
- **Simple replacements**: <N>
- **Complex refactors**: <N>

### Files Changed
- \`path/to/file1.py\`: <what changed>
- \`path/to/file2.py\`: <what changed>

## Testing
- All existing tests pass
- No functional changes - pattern consistency only

## Notes for Reviewers
<optional - any edge cases, files skipped, follow-up work needed>"
```

Claude PR review will automatically add deeper analysis after the PR is created.

#### 9.3 Clean Up Worktree (If Applicable)

If working in a separate worktree, inform the user:

```
PR created: <link>

Note: You're in worktree `../cernel-backend-standardize-<convention>`.
To return to main workspace: cd ../cernel_backend
To remove worktree later: git worktree remove ../cernel-backend-standardize-<convention>
```

#### 9.4 Remaining Work

If there are items outside the original scope:

```markdown
### Remaining Work (if any)
- [Items outside scope that also need updating]
- [Related conventions that might benefit from standardization]
```

## Common Conventions to Standardize

### Error Handling (gRPC-style)

**Target**: Use `NotFoundError`, `InvalidArgumentError`, etc. from `cernel.core.errors`
**Anti-pattern**: Custom exceptions, `HTTPException` in services, bare `Exception`
**Scope**: Usually by domain or layer

### Repository Pattern

**Target**: Repository interface in core, implementation in graph
**Anti-pattern**: Direct query calls, business logic in repositories
**Scope**: By domain

### Type Hints

**Target**: Full type hints on all function signatures
**Anti-pattern**: Missing hints, `Any` without justification
**Scope**: By module

### Logging

**Target**: Structured logging with `structlog`
**Anti-pattern**: Print statements, standard library `logging`
**Scope**: Entire codebase

### Docstrings

**Target**: Google-style docstrings on public APIs
**Anti-pattern**: Missing docstrings, incorrect format
**Scope**: By module

## Guidelines

### Be Systematic

- Don't skip files in scope
- Apply the same transformation consistently
- Track progress through the scope

### Be Conservative

- When in doubt, ask
- Don't change code you don't understand
- Preserve behavior while changing implementation

### Verify Thoroughly

- Run tests after each batch of changes
- Check for ripple effects
- Confirm no regressions

### Document Edge Cases

- Note any files that couldn't be standardized
- Explain why certain code was left unchanged
- Suggest follow-up work if needed

## Begin

1. Parse: **$ARGUMENTS**
2. Identify the convention and scope
3. If unclear, ask clarifying questions
4. Find the canonical pattern definition
5. Search for violations

**Start by understanding exactly what convention to apply and where.**
