# Content Review Guide

## Purpose

This guide provides detailed guidance for conducting Content Review (Operation 2), assessing section completeness, content clarity, example quality, and documentation comprehensiveness.

## Overview

Content Review evaluates the **substance and quality** of skill documentation. It ensures skills provide clear, complete, well-explained guidance with concrete examples.

**Automation**: 40% automated (section detection, example counting), 60% manual assessment

**Time**: 15-30 minutes (requires manual review)

**Focus Areas**:
1. Section Completeness - Are all necessary sections present?
2. Content Clarity - Is content understandable and well-organized?
3. Example Quality - Are examples helpful, concrete, executable?
4. Documentation Completeness - Is all necessary information provided?
5. Explanation Depth - Appropriate detail without verbosity?

## The 5 Core Sections

Every skill should include these 5 core sections (names may vary slightly):

### 1. Overview / Introduction

**Purpose**: Explain what the skill does and why it's valuable

**Content**:
- 2-4 paragraphs
- Purpose statement
- Key features or capabilities
- Value proposition
- Brief scope description

**Length**: 50-150 lines typical

**Example (Good)**:
```markdown
## Overview

development-workflow provides a complete end-to-end process for developing Claude Code skills from concept to production. It orchestrates five component skills (skill-researcher, planning-architect, task-development, prompt-builder, todo-management) into a cohesive workflow that ensures systematic, research-driven, high-quality skill development.

**Purpose**: Systematic skill development using proven best practices

**Pattern**: Workflow-based (5-step sequential process with one optional step)

**Key Benefit**: Transforms ad-hoc skill building into a repeatable, quality-assured process
```

**Why Good**: Clear purpose, explains what it does, states value, concise

### 2. When to Use

**Purpose**: Help Claude discover when to invoke the skill

**Content**:
- 5-9 specific scenarios
- Concrete use cases
- Embeds trigger keywords naturally

**Format**: Bullet list or scenario descriptions

**Example (Good)**:
```markdown
## When to Use

Use review-multi when:
- Reviewing new skills before production
- Validating skill quality
- Identifying improvement opportunities
- Quality assurance for skill ecosystem
- Pre-release validation
- Continuous improvement cycles
- Ensuring production readiness
```

**Why Good**: 7 scenarios, concrete, trigger keywords embedded

### 3. Main Content

**Purpose**: Core skill documentation (workflow steps OR operations OR reference material OR capabilities)

**Content**: Varies by skill pattern
- **Workflow**: Sequential steps with dependencies
- **Task**: Independent operations
- **Reference**: Organized by topic/category
- **Capabilities**: Integrated features

**Length**: 60-80% of SKILL.md content

**Quality Criteria**:
- Consistent structure across all steps/operations
- Clear process for each
- Validation criteria provided
- Examples included
- Time estimates (for workflows/tasks)

### 4. Best Practices

**Purpose**: Actionable guidance for effective skill use

**Content**:
- 5-9 practices
- Specific, actionable advice
- Learned from experience
- Rationale provided

**Format**: Numbered list or subsections

**Example (Good)**:
```markdown
## Best Practices

### 1. Self-Review First
**Practice**: Run Fast Check mode before requesting comprehensive review

**Rationale**: Automated checks catch 70% of structural issues in 5-10 minutes

**Application**: Always run `validate-structure.py` before detailed review
```

**Why Good**: Specific practice, explains why, shows how to apply

### 5. Quick Reference

**Purpose**: High-density information for rapid lookup

**Content**:
- Summary tables
- Command cheat sheets
- Key formulas or patterns
- Lookups and shortcuts

**Format**: Tables, lists, code blocks

**Location**: Last section (easy to find)

**Example (Good)**:
```markdown
## Quick Reference

| Operation | Focus | Automation | Time |
|-----------|-------|------------|------|
| Structure | YAML, files | 95% | 5-10m |
| Content | Completeness | 40% | 15-30m |
```

**Why Good**: High-density, scannable, useful for quick lookup

## Optional But Valuable Sections

### Prerequisites

**When to Include**: If skill requires setup, dependencies, or prerequisites

**Content**:
- Required skills
- External dependencies
- Configuration needs
- Time allocation

### Common Mistakes

**When to Include**: When there are common pitfalls to avoid

**Content**:
- 4-8 mistakes
- Format: Symptom, Cause, Fix, Prevention
- Actionable fixes

### Troubleshooting

**When to Include**: When common issues arise

**Content**:
- Problem/solution pairs
- Error messages and fixes
- Diagnostic guidance

### Examples

**When to Include**: When dedicated examples section adds value

**Content**:
- Comprehensive examples
- Multiple scenarios
- Before/after comparisons

## Content Clarity Assessment

### Criteria for Clear Content

1. **Understandable**: Can target audience comprehend without confusion?
2. **Well-Organized**: Logical flow, good information architecture
3. **Appropriate Level**: Not too technical, not too basic for audience
4. **Concise**: No unnecessary verbosity, gets to the point
5. **Scannable**: Headers, lists, tables make content easy to scan

### Red Flags for Unclear Content

- Long paragraphs (>8 lines) without breaks
- No headers or subheaders for >300 lines
- Technical jargon without explanation
- Circular explanations (A explained using B, B explained using A)
- Inconsistent terminology (same concept, different names)
- Missing context (assumes knowledge not provided)

### Improving Content Clarity

**Problem**: Long dense paragraphs

**Fix**: Break into shorter paragraphs, add headers, use lists

**Problem**: Technical jargon

**Fix**: Define terms, provide examples, link to references

**Problem**: Poor organization

**Fix**: Restructure with clear headers, logical flow, table of contents if needed

## Example Quality Assessment

### High-Quality Examples

**Characteristics**:
1. **Concrete**: Real values, not placeholders
2. **Executable**: Can copy-paste and run
3. **Annotated**: Comments explain what's happening
4. **Realistic**: Actual use cases, not contrived
5. **Complete**: No missing pieces

**Example (Excellent)**:
```markdown
**Example**: Validate JSON file structure

```bash
python3 scripts/validate-structure.py .claude/skills/todo-management

# Output:
# ✅ Structure Score: 4/5 (Good)
# Issues: 1 warning (missing Quick Reference)
```

**Explanation**: This validates the todo-management skill structure, checking YAML, files, and naming. The score of 4/5 indicates good structure with minor improvement (add Quick Reference).
```

**Why Excellent**:
- Concrete command (not "python script.py YOUR_SKILL")
- Executable (can copy-paste)
- Shows expected output
- Explains what's happening
- Realistic scenario

### Low-Quality Examples

**Example (Poor)**:
```markdown
**Example**:

```bash
python script.py [YOUR_SKILL_PATH]
```

Run the script on your skill.
```

**Why Poor**:
- Placeholder (YOUR_SKILL_PATH - not concrete)
- Not executable (script.py doesn't exist)
- No output shown
- No explanation of what it does
- Generic, not helpful

### Example Quantity Guidelines

**Target**: 5+ examples minimum

**Distribution**:
- At least 1 example per major concept
- 1-2 examples per workflow step / operation
- Edge case examples (if applicable)

**Scoring**:
- 10+ examples: Excellent
- 5-9 examples: Good
- 3-4 examples: Acceptable
- 1-2 examples: Poor
- 0 examples: Failing

## Documentation Completeness

### Completeness Checklist

- [ ] **Purpose explained**: Why does this skill exist?
- [ ] **Usage documented**: How do you use it?
- [ ] **Prerequisites listed**: What do you need first?
- [ ] **Process detailed**: Step-by-step guidance provided?
- [ ] **Outputs defined**: What do you get?
- [ ] **Validation criteria**: How do you know success?
- [ ] **Edge cases covered**: What about unusual scenarios?
- [ ] **Integration explained**: How does it work with others?
- [ ] **Troubleshooting provided**: What if something goes wrong?

### Common Gaps

**Gap 1: Missing Error Handling**
- Symptom: Only happy path documented
- Impact: Users don't know what to do when errors occur
- Fix: Add error scenarios, recovery guidance

**Gap 2: Undefined Outputs**
- Symptom: Process documented but outputs not specified
- Impact: Users don't know what to expect
- Fix: Explicitly state outputs for each step/operation

**Gap 3: No Edge Cases**
- Symptom: Typical scenarios only
- Impact: Users confused when atypical situations arise
- Fix: Document edge cases, unusual scenarios

**Gap 4: Assumed Knowledge**
- Symptom: Content assumes prerequisite knowledge not documented
- Impact: Some users can't follow instructions
- Fix: Explain prerequisite concepts or link to resources

## Explanation Depth Balance

### Too Brief (Insufficient Detail)

**Symptoms**:
- Instructions are incomplete
- Steps skip important details
- Concepts mentioned but not explained
- Users left with questions

**Example (Too Brief)**:
```markdown
1. Set up the configuration
2. Run the process
3. Validate results
```

**Fix**: Add details
```markdown
1. **Set up the configuration**
   - Edit config.yml
   - Set api_key parameter to your API key
   - Set timeout to 30 (seconds)

2. **Run the process**
   ```bash
   python run-process.py --config config.yml
   ```
   This connects to API, processes data, generates report

3. **Validate results**
   - Check results/ directory for output.json
   - Verify status field = "success"
   - Review data array has >0 items
```

### Too Verbose (Unnecessary Length)

**Symptoms**:
- Repetitive explanations
- Overly detailed for simple concepts
- Tangential information
- Padded content

**Example (Too Verbose)**:
```markdown
The YAML frontmatter is a special metadata section that appears at the top of the SKILL.md file. YAML stands for "YAML Ain't Markup Language" and it's a human-readable data serialization format. The frontmatter is delimited by three hyphens (---) at the beginning and end. It's used in many static site generators and is also used in Claude Code skills to provide metadata about the skill. The metadata includes information like the skill's name, description, and other optional fields...
```

**Fix**: Be concise
```markdown
YAML frontmatter provides skill metadata between --- delimiters. It includes the skill's name and description, plus optional fields.
```

### Just Right (Balanced Detail)

**Characteristics**:
- Sufficient for understanding
- No unnecessary fluff
- Details where needed
- Concise where possible
- Examples illustrate complex concepts

---

## Content Review Checklist

Complete checklist for Content Review (Operation 2):

### Section Completeness
- [ ] Overview/Introduction present
- [ ] When to Use present (5+ scenarios)
- [ ] Main content present and complete
- [ ] Best Practices present
- [ ] Quick Reference present
- [ ] Optional sections add value (if present)

### Content Clarity
- [ ] Content understandable (target audience)
- [ ] Logical organization
- [ ] Clear explanations (not confusing)
- [ ] Appropriate technical level
- [ ] Scannable structure (headers, lists)

### Example Quality
- [ ] 5+ examples present
- [ ] Examples concrete (real values)
- [ ] Examples executable (copy-paste ready)
- [ ] Examples help understanding
- [ ] Examples realistic (actual use cases)

### Documentation Completeness
- [ ] All necessary information present
- [ ] No unexplained gaps
- [ ] Sufficient detail provided
- [ ] Edge cases covered (if applicable)
- [ ] Error handling documented (if applicable)

### Explanation Depth
- [ ] Not too brief (sufficient detail)
- [ ] Not too verbose (concise)
- [ ] Balanced for complexity
- [ ] Details where needed, brief where possible

### Calculate Score
- [ ] Count checks passed (8-10 = 5, 6-7 = 4, 4-5 = 3, 2-3 = 2, 0-1 = 1)
- [ ] Apply rubric (see scoring-rubric.md)
- [ ] Assign score 1-5
- [ ] Document rationale and evidence

---

## Examples: Content Review in Action

### Example 1: Excellent Content (Score 5)

**Skill**: skill-researcher

**Assessment**:
- ✅ All 5 core sections + Prerequisites + Common Mistakes
- ✅ When to Use: 8 scenarios
- ✅ Main content: 5 operations comprehensively documented
- ✅ Examples: 12+ examples, all concrete and executable
- ✅ Exceptional clarity: 9/10
- ✅ Perfect depth balance
- ✅ Complete documentation, no gaps
- ✅ Edge cases and error handling covered

**Score**: 5/5 (Excellent)

**Rationale**: All criteria met, exceptional quality, comprehensive, clear

---

### Example 2: Good Content (Score 4)

**Skill**: prompt-builder

**Assessment**:
- ✅ All 5 core sections present
- ⚠️ Common Mistakes section missing (optional but valuable)
- ✅ When to Use: 7 scenarios
- ✅ Main content: 5-step workflow clear and complete
- ✅ Examples: 8 examples, all concrete
- ✅ Good clarity: 8/10
- ✅ Good depth balance
- ⚠️ Minor gap: Error handling not covered
- ⚠️ Could use 1-2 edge case examples

**Score**: 4/5 (Good)

**Rationale**: Meets all critical criteria, minor gaps, production-ready

**Recommendations**:
1. Add Common Mistakes section
2. Include error handling examples
3. Add 1-2 edge case scenarios

---

### Example 3: Acceptable Content (Score 3)

**Hypothetical Skill**: data-processor

**Assessment**:
- ⚠️ 4 of 5 core sections (missing Quick Reference)
- ⚠️ When to Use: 4 scenarios (below target of 5)
- ✅ Main content: Present but some steps unclear
- ⚠️ Examples: 4 examples, 2 are abstract placeholders
- ⚠️ Clarity: 6/10 (some confusion in Step 2)
- ⚠️ Depth unbalanced (too brief in places, verbose in others)
- ⚠️ Documentation gaps: outputs not defined, edge cases not covered

**Score**: 3/5 (Acceptable)

**Rationale**: Usable but needs improvements - unclear sections, sparse examples, gaps

**Recommendations**:
1. Add Quick Reference section
2. Add 1-2 more scenarios to When to Use
3. Clarify Step 2 with diagram or example
4. Replace placeholder examples with concrete ones
5. Define outputs for each step
6. Cover edge cases

---

## Manual Assessment Techniques

### Assessing Clarity

**Method**: Read as if you're the target user

**Questions to Ask**:
1. Can I understand this without prior knowledge?
2. Is the flow logical?
3. Are terms explained?
4. Can I follow the instructions?
5. Is anything confusing or ambiguous?

**Rating Scale**:
- 9-10: Crystal clear, zero confusion
- 7-8: Clear, minimal confusion
- 5-6: Somewhat clear, some confusion
- 3-4: Unclear, significant confusion
- 1-2: Very unclear, extremely confusing

**Document Evidence**: Note specific sections that are clear/unclear

### Assessing Completeness

**Method**: Check if all questions are answered

**Questions**:
- What does this skill do? (Purpose)
- When should I use it? (Scenarios)
- How do I use it? (Process/workflow)
- What do I need first? (Prerequisites)
- What do I get? (Outputs)
- How do I know it worked? (Validation)
- What if something goes wrong? (Error handling)
- How does it integrate? (If applicable)

**Rating**:
- All questions answered with sufficient detail: Excellent
- Most questions answered: Good
- Some gaps: Acceptable
- Many gaps: Poor

### Assessing Example Quality

**Method**: Try to execute examples

**Checks**:
1. **Concrete**: Real values or easy-to-replace placeholders?
2. **Executable**: Can you copy-paste and run?
3. **Annotated**: Comments or explanations provided?
4. **Helpful**: Does it demonstrate the concept?
5. **Realistic**: Actual use case or contrived?

**Example Evaluation**:

**Example A**:
```bash
python validate-structure.py .claude/skills/todo-management
```
**Evaluation**: ✅ Concrete, ✅ Executable, ⚠️ Not annotated, ✅ Helpful, ✅ Realistic
**Score**: 4/5

**Example B**:
```bash
python script.py [YOUR_SKILL_PATH]  # Replace with your skill
```
**Evaluation**: ❌ Placeholder, ❌ Not executable as-is, ✅ Annotated, ⚠️ Somewhat helpful, ❌ Generic
**Score**: 2/5

---

## Section-by-Section Review Guide

### Reviewing Overview Section

**Check**:
- [ ] Purpose clearly stated
- [ ] Key features listed
- [ ] Value proposition evident
- [ ] Scope appropriate (not too broad/narrow)
- [ ] 2-4 paragraphs (not too brief/verbose)

**Common Issues**:
- Too generic ("This skill helps with X")
- Too verbose (unnecessary background)
- Missing value proposition (why use this?)

### Reviewing When to Use Section

**Check**:
- [ ] 5+ scenarios listed
- [ ] Scenarios concrete (not abstract)
- [ ] Trigger keywords embedded naturally
- [ ] Covers main use cases
- [ ] Helps skill discovery

**Common Issues**:
- Too few scenarios (<5)
- Too generic ("Use when you need X")
- Missing key use cases
- No trigger keywords

### Reviewing Main Content

**For Workflow Skills**:
- [ ] All steps present and complete
- [ ] Consistent structure across steps
- [ ] Each step has: Purpose, Process, Validation
- [ ] Dependencies between steps clear
- [ ] Integration points documented

**For Task Skills**:
- [ ] All operations present and complete
- [ ] Consistent structure across operations
- [ ] Each operation has: Purpose, Process, Validation
- [ ] Operations independence clear

**For Reference Skills**:
- [ ] Organized by topic/category
- [ ] Comprehensive coverage
- [ ] Easy to navigate
- [ ] Quick Reference included

### Reviewing Best Practices

**Check**:
- [ ] 5-9 practices listed
- [ ] Practices actionable (specific, not vague)
- [ ] Rationale provided (why this practice)
- [ ] Application guidance (how to apply)

**Common Issues**:
- Vague practices ("Do good work")
- No rationale (why is this a best practice?)
- Not actionable (can't apply it)

### Reviewing Quick Reference

**Check**:
- [ ] Last section (easy to find)
- [ ] High-density information
- [ ] Tables or lists (scannable)
- [ ] Useful for rapid lookup
- [ ] Includes key commands/formulas/patterns

**Common Issues**:
- Missing entirely
- Too verbose (not "quick")
- Not useful (rehashes content vs distills)

---

## Content Review Scoring Examples

### Score 5: Excellent Content

**Characteristics**:
- All 10 validation checks pass
- Exceptional clarity (9-10/10)
- Comprehensive coverage
- 10+ excellent examples
- Perfect depth balance
- No gaps

**Example Skill**: skill-researcher
- All sections including optional ones
- Crystal clear instructions
- 12+ concrete examples
- Comprehensive without verbosity

---

### Score 4: Good Content

**Characteristics**:
- 8-9 validation checks pass
- Good clarity (7-8/10)
- Good coverage with minor gaps
- 5-9 good examples
- Good depth balance
- Minor gaps acceptable

**Example Skill**: prompt-builder
- All core sections
- Clear instructions
- 8 examples
- Minor gap: no error handling
- Good overall quality

---

### Score 3: Acceptable Content

**Characteristics**:
- 6-7 validation checks pass
- Acceptable clarity (5-6/10)
- Some sections weak
- 3-4 examples
- Depth unbalanced
- Noticeable gaps

**Issues**:
- 1 core section missing
- Some confusion in explanations
- Sparse examples
- Some gaps in coverage

---

### Score 2: Needs Work

**Characteristics**:
- 4-5 validation checks pass
- Poor clarity (3-4/10)
- Multiple sections incomplete
- 1-2 examples (very sparse)
- Major depth problems
- Significant gaps

---

### Score 1: Poor Content

**Characteristics**:
- ≤3 validation checks pass
- Very unclear (1-2/10)
- Missing core sections
- No examples or only abstract ones
- Severely incomplete

---

## Improving Content Quality

### Improvement Strategy 1: Add Missing Sections

If missing core sections:
1. Identify which of 5 core sections missing
2. Add missing sections following patterns
3. Use examples from other skills as templates

### Improvement Strategy 2: Enhance Examples

If examples sparse or low quality:
1. Add examples (target: 5+)
2. Make concrete (replace placeholders)
3. Add annotations (explain what's happening)
4. Use realistic scenarios

### Improvement Strategy 3: Improve Clarity

If content unclear:
1. Break long paragraphs
2. Add headers/subheaders
3. Use lists and tables
4. Define technical terms
5. Add diagrams if helpful

### Improvement Strategy 4: Fill Gaps

If documentation incomplete:
1. List unanswered questions
2. Add content answering each
3. Cover edge cases
4. Document error scenarios

---

## Conclusion

Content Review assesses the **substance and quality** of skill documentation. Focus on:

1. **Section Completeness**: All 5 core sections present
2. **Clarity**: Understandable, well-organized, appropriate level
3. **Examples**: 5+ concrete, executable, helpful examples
4. **Completeness**: No major gaps, all questions answered
5. **Depth**: Balanced (sufficient detail, not verbose)

**Target**: Score ≥4 for production readiness

**For scoring details**, see `scoring-rubric.md` Dimension 2.
**For patterns**, see `development-workflow/references/common-patterns.md`.
