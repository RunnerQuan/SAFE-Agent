# Review Report Template

## Purpose

This template provides a standard format for comprehensive review reports, ensuring consistency and completeness across all skill reviews.

## Report Structure

```markdown
# [Skill Name] - Comprehensive Review Report

**Review Date**: [YYYY-MM-DD]
**Reviewer**: [Name or "Claude Code"]
**Review Mode**: Comprehensive | Fast Check | Custom
**Skill Version**: [Version if applicable]

---

## Executive Summary

**Overall Score**: [X.X]/5.0
**Grade**: [A/B/C/D/F]
**Production Readiness**: ✅ Ready | ⚠️ Needs Improvements | ❌ Not Ready

**Quick Assessment**: [1-2 sentence summary of overall quality]

**Recommendation**: [Deploy/Hold for improvements/Rework required]

---

## Dimension Scores

| Dimension | Score | Grade | Status |
|-----------|-------|-------|--------|
| Structure | [X]/5 | [Level] | [✅/⚠️/❌] |
| Content | [X]/5 | [Level] | [✅/⚠️/❌] |
| Quality | [X]/5 | [Level] | [✅/⚠️/❌] |
| Usability | [X]/5 | [Level] | [✅/⚠️/❌] |
| Integration | [X]/5 | [Level] | [✅/⚠️/❌] |

**Weighted Calculation**:
```
Overall = (Structure × 0.20) + (Content × 0.25) + (Quality × 0.25) +
          (Usability × 0.15) + (Integration × 0.15)
        = ([S] × 0.20) + ([C] × 0.25) + ([Q] × 0.25) + ([U] × 0.15) + ([I] × 0.15)
        = [X.XX]
```

---

## Dimension 1: Structure Review

**Score**: [X]/5 - [Excellent/Good/Acceptable/Needs Work/Poor]

**Validation Checklist Results**: [X]/10 checks passed

**Checks**:
- [✅/❌] YAML frontmatter present and valid
- [✅/❌] `name` field in kebab-case
- [✅/❌] `description` includes 5+ keywords
- [✅/❌] SKILL.md exists
- [✅/❌] File naming conventions followed
- [✅/❌] Directory structure correct
- [✅/❌] SKILL.md size appropriate (<1,500 lines)
- [✅/❌] References organized
- [✅/❌] Progressive disclosure maintained
- [✅/❌] README.md present

**Issues Found**:
- [List issues with severity: CRITICAL/ERROR/WARNING/INFO]

**Strengths**:
- [What's good about structure]

**Improvements Needed**:
1. [Specific improvement with priority]
2. [Another improvement]

---

## Dimension 2: Content Review

**Score**: [X]/5 - [Level]

**Validation Checklist Results**: [X]/10 checks passed

**Section Completeness**: [X]/10
- [✅/⚠️/❌] Overview present
- [✅/⚠️/❌] When to Use (5+ scenarios)
- [✅/⚠️/❌] Main content complete
- [✅/⚠️/❌] Best Practices present
- [✅/⚠️/❌] Quick Reference present

**Example Quality**: [X]/10
- Count: [X] examples ([Above/Meets/Below] target of 5+)
- Concrete: [Yes/Mostly/No]
- Executable: [Yes/Mostly/No]
- Helpful: [Yes/Mostly/No]

**Content Clarity**: [X]/10
- Organization: [Logical/Acceptable/Confusing]
- Explanations: [Clear/Acceptable/Unclear]
- Technical level: [Appropriate/Too technical/Too basic]

**Documentation Completeness**: [X]/10
- Gaps identified: [None/Minor/Significant]
- Edge cases: [Covered/Partially/Not covered]

**Issues Found**:
- [List content issues]

**Strengths**:
- [What's good about content]

**Improvements Needed**:
1. [Specific improvement]
2. [Another improvement]

---

## Dimension 3: Quality Review

**Score**: [X]/5 - [Level]

**Validation Checklist Results**: [X]/10 checks passed

**Pattern Compliance**:
- Pattern Type: [Workflow/Task/Reference/Capabilities]
- Implementation: [Correct/Mostly correct/Incorrect]
- Consistency: [High/Medium/Low]

**Anti-Patterns Detected**: [X] anti-patterns found
- [List detected anti-patterns with severity]

**Best Practices Adherence**: [X]/10
- Validation checklists: [Present and specific/Present but vague/Absent]
- Examples throughout: [Yes, X examples/Sparse/None]
- Consistent structure: [Yes/Mostly/No]
- Error cases: [Covered/Limited/Ignored]

**Code Quality** (if scripts present): [X]/10
- Documentation: [Excellent/Good/Poor]
- Error handling: [Present/Limited/Absent]
- CLI interface: [Clear/Acceptable/Unclear]

**Issues Found**:
- [List quality issues]

**Strengths**:
- [Pattern correctness, quality highlights]

**Improvements Needed**:
1. [Fix anti-patterns]
2. [Add best practices]

---

## Dimension 4: Usability Review

**Score**: [X]/5 - [Level]

**Validation Checklist Results**: [X]/8 checks passed

**Scenario Test**:
- Scenario: [What you tested]
- Result: [Success/Partial/Failure]
- Time: [Actual vs Expected]
- Experience: [Smooth/Acceptable/Frustrating]

**Navigation**: [X]/10
- Can find information: [Easily/Moderately/Difficulty]
- Organization: [Logical/Acceptable/Confusing]
- Quick Reference: [Very helpful/Helpful/Not helpful/Absent]

**Instruction Clarity**: [X]/10
- Instructions: [Clear/Somewhat clear/Unclear]
- Steps actionable: [Yes/Mostly/No]
- Examples helpful: [Very/Somewhat/Not really]

**Effectiveness**: [X]/10
- Achieved purpose: [Yes/Partially/No]
- Delivered value: [Yes/Somewhat/No]
- Would use again: [Definitely/Maybe/No]

**Learning Curve**: [X]/10
- Time to understand: [X min]
- Time to use effectively: [X min]
- Appropriate for complexity: [Yes/No]

**User Satisfaction**: [X]/10
- Overall rating: [1-10]
- Would recommend: [Yes/Maybe/No]

**Issues Found**:
- [Usability problems encountered]

**Strengths**:
- [What worked well in actual usage]

**Improvements Needed**:
1. [Usability improvements]

---

## Dimension 5: Integration Review

**Score**: [X]/5 - [Level]

**Validation Checklist Results**: [X]/9 checks passed (applicable ones)

**Dependency Documentation**:
- Required dependencies: [Listed and explained/Listed only/Not documented]
- Optional dependencies: [Mentioned/Not mentioned]
- Complementary skills: [Mentioned/Not mentioned]
- YAML field: [Used correctly/Not used/Used incorrectly]

**Data Flow** (if workflow):
- Inputs/Outputs documented: [Yes/Partially/No]
- Flow explained: [Clear/Somewhat/Unclear]
- Diagram present: [Yes/No]
- Artifacts described: [Yes/Partially/No]

**Component Integration** (if workflow):
- Integration method: [Documented/Partially/Not documented]
- Integration examples: [Provided/Limited/Absent]
- Hand-off process: [Clear/Acceptable/Unclear]

**Cross-References**:
- Internal references: [All valid/Mostly valid/Some broken]
- External references: [All correct/Mostly correct/Incorrect]

**Composition Pattern** (if workflow):
- Pattern: [Sequential/Parallel/Conditional/Iterative/Hierarchical]
- Implementation: [Correct/Mostly/Incorrect]
- Orchestration: [Well-documented/Adequate/Poor]

**Issues Found**:
- [Integration issues]

**Strengths**:
- [Integration highlights]

**Improvements Needed**:
1. [Integration improvements]

---

## Improvement Recommendations

### Priority Classification

**Critical** (Must fix before production):
- [List critical issues that block deployment]

**High** (Should fix before production):
- [List important issues that affect quality]

**Medium** (Fix in next iteration):
- [List moderate issues that improve quality]

**Low** (Nice to have):
- [List minor enhancements]

### Specific Recommendations

**Recommendation 1**: [Title]
- **Priority**: [Critical/High/Medium/Low]
- **Dimension**: [Which dimension this affects]
- **Issue**: [Specific problem]
- **Impact**: [Why this matters]
- **Fix**: [Specific action to take]
- **Effort**: [Estimated time to fix]

[Repeat for each recommendation]

---

## Strengths Summary

**What This Skill Does Well**:
1. [Strength 1]
2. [Strength 2]
3. [Strength 3]

**Exemplary Aspects** (Can serve as examples):
- [Aspect that exceeds standards]

---

## Production Readiness Assessment

**Overall Assessment**: [Ready/Ready with improvements/Not ready]

**Reasoning**:
[Based on overall score, explain readiness decision]

**Risk Level**: [Low/Medium/High]
- Low: Score ≥4.5, can deploy confidently
- Medium: Score 3.5-4.4, deployable with noted improvements
- High: Score <3.5, should not deploy without fixes

**Deployment Recommendation**:
- ✅ **Deploy**: [If score ≥4.5]
- ⚠️ **Deploy with caution**: [If score 4.0-4.4, list must-fix items]
- ⚠️ **Hold for improvements**: [If score 3.5-3.9, list critical fixes]
- ❌ **Do not deploy**: [If score <3.5, requires significant rework]

---

## Next Steps

1. [Immediate action based on score]
2. [Follow-up action]
3. [Tracking/monitoring plan]

---

## Appendix: Detailed Findings

### Structure Details
[Detailed automated report from validate-structure.py]

### Quality Details
[Detailed pattern analysis from check-patterns.py]

### Usability Test Notes
[Detailed scenario test documentation]

---

**Report Generated**: [Timestamp]
**Tool**: review-multi v1.0
```

---

## Example Complete Report

```markdown
# skill-researcher - Comprehensive Review Report

**Review Date**: 2025-11-06
**Reviewer**: Claude Code
**Review Mode**: Comprehensive
**Skill Version**: 1.0.0

---

## Executive Summary

**Overall Score**: 4.6/5.0
**Grade**: A
**Production Readiness**: ✅ Ready - High quality, deploy with confidence

**Quick Assessment**: Excellent comprehensive research skill with clear operations, strong usability, and good integration. Minor improvement opportunity in error handling documentation.

**Recommendation**: Deploy to production - exemplary quality

---

## Dimension Scores

| Dimension | Score | Grade | Status |
|-----------|-------|-------|--------|
| Structure | 5/5 | Excellent | ✅ |
| Content | 5/5 | Excellent | ✅ |
| Quality | 4/5 | Good | ✅ |
| Usability | 5/5 | Excellent | ✅ |
| Integration | 4/5 | Good | ✅ |

**Weighted Calculation**:
```
Overall = (5 × 0.20) + (5 × 0.25) + (4 × 0.25) + (5 × 0.15) + (4 × 0.15)
        = 1.0 + 1.25 + 1.0 + 0.75 + 0.6
        = 4.6
```

---

[... rest of detailed report following template ...]

---

## Improvement Recommendations

### Medium Priority

**Recommendation 1**: Add Error Handling Examples
- **Dimension**: Quality, Content
- **Issue**: Web search and GitHub operations documented only for happy path
- **Impact**: Users unsure what to do when API rate limits hit or searches fail
- **Fix**: Add "Common Issues" subsection to Operations 1 and 3 with error scenarios
- **Effort**: 20-30 minutes

### Low Priority

**Recommendation 2**: Add Table of Contents
- **Dimension**: Usability
- **Issue**: SKILL.md is 935 lines, navigation could be easier
- **Impact**: Minor - Quick Reference helps but TOC would improve navigation
- **Fix**: Add table of contents after Overview section
- **Effort**: 10 minutes

---

## Strengths Summary

**What This Skill Does Well**:
1. Comprehensive 5-operation research framework (Web, GitHub, MCP, Docs, Synthesis)
2. Excellent structure and organization (perfect progressive disclosure)
3. Strong usability (tested successfully in 45 min, highly effective)
4. Good integration (complementary skills mentioned, clear operation independence)
5. Quality examples throughout (12+ concrete, executable examples)

**Exemplary Aspects**:
- Multi-source research approach (can serve as example)
- Synthesis operation (unique and valuable)

---

## Production Readiness Assessment

**Overall Assessment**: Ready - High quality, deploy with confidence

**Reasoning**: Score of 4.6/5.0 (Grade A) indicates exemplary quality across all dimensions. Minor improvement opportunity in error handling does not block production deployment.

**Risk Level**: Low - can deploy confidently

**Deployment Recommendation**: ✅ **Deploy** - Production ready, note error handling improvement for next iteration

---

## Next Steps

1. **Deploy to production** - Skill is ready
2. **Document noted improvement** (error handling) - Address in v1.1
3. **Monitor usage** - Gather user feedback
4. **Plan v1.1** - Incorporate error handling examples and any user feedback

---

**Report Generated**: 2025-11-06T12:00:00
**Tool**: review-multi v1.0
```

---

## Using This Template

### Step 1: Copy Template

Copy the template structure above to start your review report.

### Step 2: Fill Executive Summary

Complete executive summary after finishing all dimension reviews:
- Overall score (calculated from weighted average)
- Grade (mapped from score)
- Production readiness (based on thresholds)
- Quick assessment (1-2 sentences)
- Recommendation (deploy/hold/rework)

### Step 3: Complete Dimension Reviews

For each of the 5 dimensions:
1. Conduct the review (follow operation in SKILL.md)
2. Complete validation checklist
3. Calculate score using rubric
4. Document: checks passed, issues, strengths, improvements

### Step 4: Aggregate Recommendations

Compile all improvements from 5 dimensions:
1. List all recommended improvements
2. Classify priority (Critical/High/Medium/Low)
3. Estimate effort for each
4. Order by priority

### Step 5: Assess Production Readiness

Based on overall score:
- ≥4.5: Ready (deploy)
- 4.0-4.4: Ready with improvements (deploy, note improvements)
- 3.5-3.9: Needs improvements (hold, fix first)
- <3.5: Not ready (rework)

Document reasoning and risk level.

### Step 6: Define Next Steps

Based on readiness assessment:
- If ready: Deploy, monitor, plan next iteration
- If needs improvements: Fix critical issues, re-review
- If not ready: Comprehensive rework plan

---

## Report Formats

### Comprehensive Report (Full Template)

**When**: Pre-production review, major updates, quality certification

**Length**: 3-5 pages

**Includes**: All dimensions, detailed findings, full recommendations

### Summary Report (Abbreviated)

**When**: Quick check, iterative development, progress tracking

**Length**: 1 page

**Includes**: Executive summary, dimension scores, top 3 recommendations

### Fast Check Report (Automated)

**When**: During development, continuous validation

**Length**: 1/2 page

**Includes**: Structure validation results, pass/fail, critical issues only

---

## Tips for Writing Review Reports

### Be Specific

**Vague**: "Content could be improved"

**Specific**: "Add 3-5 more examples to Operations 2 and 4 (currently only 2 examples each, target is 5+)"

### Be Evidence-Based

**Unsubstantiated**: "Usability is poor"

**Evidence-Based**: "Usability score 2/5: Scenario test failed after 60 min due to unclear Step 3 instructions - users don't know which config file to edit"

### Prioritize Improvements

Not all improvements are equal:
- **Critical**: Blocks deployment, must fix
- **High**: Affects quality, should fix
- **Medium**: Nice to have, fix in iteration
- **Low**: Optional enhancements

### Balance Criticism with Strengths

Every review should note:
- What's working well (strengths)
- What needs improvement (issues)
- How to improve (specific fixes)

**Ratio**: Aim for balanced feedback (not all negative, not all positive)

---

## Conclusion

Review reports should be:
- **Objective**: Evidence-based, not opinion
- **Specific**: Concrete issues and fixes
- **Actionable**: Clear next steps
- **Balanced**: Strengths and improvements
- **Consistent**: Follow template, use rubric

**Use this template** for all comprehensive reviews to ensure consistency and completeness.
