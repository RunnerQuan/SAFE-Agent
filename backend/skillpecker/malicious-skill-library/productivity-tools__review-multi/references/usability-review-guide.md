# Usability Review Guide

## Purpose

This guide provides detailed guidance for conducting Usability Review (Operation 4), evaluating ease of use, learnability, real-world effectiveness, and user satisfaction through scenario-based testing.

## Overview

Usability Review tests skills in **real-world scenarios** to assess actual user experience. Unlike other reviews that examine documentation, usability review requires actually using the skill.

**Automation**: 10% automated (basic checks), 90% manual testing

**Time**: 30-60 minutes (requires actual usage)

**Based on**: ISO 9241-11 usability dimensions (Effectiveness, Efficiency, Satisfaction)

**Key Principle**: You must actually use the skill, not just read it

## The 5 Usability Dimensions

### 1. Effectiveness

**Definition**: Can users accomplish their goals using this skill?

**Assessment Questions**:
- Does the skill achieve its stated purpose?
- Can users complete intended tasks?
- Are outputs useful and correct?
- Does it deliver promised value?

**Measurement**:
- Task completion rate (success/partial/failure)
- Goal achievement (did it solve the problem?)
- Output quality (useful and correct?)

**Scoring**:
- Always achieves purpose: Excellent (5)
- Usually achieves purpose: Good (4)
- Sometimes achieves purpose: Acceptable (3)
- Rarely achieves purpose: Poor (2)
- Doesn't achieve purpose: Failing (1)

---

### 2. Efficiency

**Definition**: How much time/effort required to accomplish goals?

**Assessment Questions**:
- How long to complete tasks?
- Is time reasonable for complexity?
- How many steps required?
- Are there unnecessary complications?

**Measurement**:
- Time to complete task vs expected
- Number of steps vs optimal
- Friction points encountered

**Scoring**:
- Very efficient (faster than expected): Excellent
- Efficient (as expected): Good
- Moderately efficient (slower than expected): Acceptable
- Inefficient (significantly slower): Poor

---

### 3. Satisfaction

**Definition**: Is the experience pleasant and satisfying?

**Assessment Questions**:
- Would you use this skill again?
- Would you recommend it to others?
- Was experience frustrating or smooth?
- Did you enjoy using it?

**Measurement**:
- Would-use-again rating
- Would-recommend rating
- Frustration level
- Overall satisfaction (1-10 scale)

**Scoring**:
- Very satisfying (9-10/10): Excellent
- Satisfying (7-8/10): Good
- Moderately satisfying (5-6/10): Acceptable
- Unsatisfying (3-4/10): Poor
- Very unsatisfying (1-2/10): Failing

---

### 4. Learnability

**Definition**: How easy is it to learn to use the skill?

**Assessment Questions**:
- How long to understand the skill?
- How long to use it effectively?
- Is learning curve appropriate for complexity?
- Are first-time users supported?

**Measurement**:
- Time to understand (reading)
- Time to first successful use
- Learning curve assessment

**Scoring**:
- Very easy to learn (<10 min): Excellent
- Easy to learn (10-20 min): Good
- Moderate learning (20-40 min): Acceptable
- Difficult to learn (40-60 min): Poor
- Very difficult (>60 min): Failing

**Note**: Adjust for skill complexity (complex skills can have longer learning curves)

---

### 5. Memorability

**Definition**: How easy to remember after period of non-use?

**Assessment Questions**:
- Can you use it again after a week without re-reading everything?
- Is Quick Reference sufficient for refresh?
- Are key concepts memorable?

**Measurement**:
- Time to refresh (with Quick Reference)
- How much re-reading required

**Scoring**:
- Very memorable (Quick Reference sufficient): Excellent
- Memorable (brief scan needed): Good
- Moderately memorable (partial re-read): Acceptable
- Hard to remember (full re-read): Poor

---

## Scenario-Based Testing Methodology

### 1. Select Appropriate Scenario

**Source**: "When to Use" section

**Selection Criteria**:
- Represents primary use case
- Typical user scenario
- Can be completed in reasonable time (30-90 min)

**Example**: For skill-researcher, select: "Research GitHub API integration patterns"

### 2. Prepare for Test

**Setup**:
- Load the skill
- Read through once (simulate first-time user)
- Note time to understand
- Prepare any prerequisites

**Baseline**: Note your starting knowledge level and expectations

### 3. Execute Scenario

**Process**:
- Actually follow the skill's instructions
- Use it as a real user would
- Complete the intended task
- Note friction points, confusion, errors

**Documentation**:
- Record what went smoothly
- Note where you got stuck
- Document any confusion
- Track time spent

### 4. Assess Results

**Questions**:
- Did you complete the task successfully?
- Did skill help or hinder?
- Was output useful?
- Would you use this skill again?

**Evidence**: Specific examples of good/bad user experience

### 5. Score Usability

**Calculate**:
- Effectiveness: Did it work? (success/partial/failure)
- Efficiency: Time reasonable?
- Satisfaction: 1-10 scale
- Learnability: Time to understand and use
- Memorability: Could you use again easily?

**Overall**: Average or holistic assessment based on 5 dimensions

---

## Usability Testing Checklist

### Pre-Test Preparation
- [ ] Scenario selected from "When to Use"
- [ ] Scenario is realistic and completable
- [ ] Prerequisites prepared
- [ ] Time allocated (30-90 min for test)

### During Testing
- [ ] Actually use the skill (not just read)
- [ ] Follow instructions as written
- [ ] Note time to understand
- [ ] Note time to first use
- [ ] Document friction points
- [ ] Record confusion or errors
- [ ] Complete the task
- [ ] Document overall experience

### Post-Test Assessment
- [ ] Task completion: Success/Partial/Failure
- [ ] Time assessment: Reasonable vs expected
- [ ] Satisfaction rating: 1-10 scale
- [ ] Learning curve: Appropriate for complexity
- [ ] Would use again: Yes/No with rationale
- [ ] Specific improvements identified

### Scoring
- [ ] Assess 8-point validation checklist (from SKILL.md)
- [ ] Count checks passed
- [ ] Apply rubric (8 pass = 5, 6-7 = 4, 4-5 = 3, 2-3 = 2, ≤1 = 1)
- [ ] Assign score 1-5
- [ ] Document evidence and rationale

---

## Common Usability Issues

### Issue 1: Navigation Difficulty

**Symptom**: Hard to find information, jumping around document

**Causes**:
- Poor organization
- Missing table of contents (long skills)
- Unclear headings
- No Quick Reference

**Fix**:
- Improve section organization
- Add table of contents if >1,000 lines
- Make headings descriptive
- Add Quick Reference

### Issue 2: Unclear Instructions

**Symptom**: Confusion about what to do, users get stuck

**Causes**:
- Steps too high-level
- Missing details
- Assumed knowledge
- Technical jargon unexplained

**Fix**:
- Add detail to steps
- Explain prerequisites
- Define technical terms
- Add examples to clarify

### Issue 3: Confusing Examples

**Symptom**: Examples don't help understanding

**Causes**:
- Abstract examples (not concrete)
- Placeholders ("YOUR_VALUE")
- No explanation
- Unrealistic scenarios

**Fix**:
- Make examples concrete
- Replace placeholders
- Add explanations
- Use realistic scenarios

### Issue 4: Steep Learning Curve

**Symptom**: Takes too long to understand and use

**Causes**:
- Complex concepts not explained
- No progressive guidance (beginner → advanced)
- Too much information at once
- Missing prerequisites

**Fix**:
- Explain complex concepts
- Add Quick Start for beginners
- Progressive disclosure (basics in SKILL.md, advanced in references/)
- Document prerequisites clearly

### Issue 5: Skill Doesn't Achieve Purpose

**Symptom**: Using skill doesn't accomplish stated goal

**Causes**:
- Purpose mismatch (says one thing, does another)
- Incomplete implementation
- Missing critical steps
- Poor design

**Fix**:
- Align purpose with actual functionality
- Complete implementation
- Add missing steps
- Redesign if necessary

---

## Real-World Testing Examples

### Example 1: Skill-Researcher Usability Test

**Scenario**: Research GitHub API integration patterns

**Test Process**:
1. **Understand** (10 min): Read SKILL.md, understand 5 operations
2. **Execute** (45 min):
   - Operation 2: Web Search (15 min) - Found best practices
   - Operation 3: GitHub Repository (20 min) - Found code examples
   - Operation 5: Synthesize (10 min) - Created synthesis

3. **Assess Results**:
   - ✅ Success: Found 5 sources, created synthesis
   - ✅ Time reasonable: 45 min (expected 60 min range)
   - ✅ Smooth experience: Clear instructions, helpful examples

**Findings**:
- Navigation: Easy (Quick Reference table helpful)
- Instructions: Clear and actionable
- Examples: Demonstrated concepts well
- Effectiveness: Achieved goal
- Learning curve: 10-15 min (reasonable)
- Satisfaction: 9/10 (would use again)

**Usability Score**: 5/5 (Excellent)

**Minor Improvement**: Explain credibility scoring concept (first-time users might be unsure)

---

### Example 2: Todo-Management Usability Test

**Scenario**: Track task progress for skill development

**Test Process**:
1. **Understand** (8 min): Read SKILL.md, understand operations
2. **Execute** (20 min):
   - Operation 1: Initialize (5 min) - Created task list
   - Operation 2: Start Task (2 min) - Marked task in progress
   - Operation 3: Complete Task (2 min) - Marked complete
   - Operation 4: Report Progress (2 min) - Generated report
   - Ongoing use (9 min) - Tracked 5 tasks

3. **Assess Results**:
   - ✅ Success: Tracked tasks effectively
   - ✅ Time efficient: 20 min (very fast)
   - ✅ Smooth: Very easy to use

**Findings**:
- Navigation: Good (operations clearly separated)
- Instructions: Clear (simple, actionable)
- Examples: Helpful
- Effectiveness: Fully achieved purpose
- Learning curve: <10 min (very easy)
- Satisfaction: 9/10

**Usability Score**: 5/5 (Excellent)

**Note**: Very easy to use, intuitive operations

---

## Usability Assessment Template

Use this template when conducting usability reviews:

```markdown
Usability Review: [Skill Name]
===============================

Scenario: [What you're trying to accomplish]
Date: [Test date]

TEST EXECUTION
--------------

1. Understanding Phase
   - Time: [X minutes]
   - Clarity: [Clear/Somewhat clear/Unclear]
   - Notes: [Any confusion or questions]

2. Execution Phase
   - Time: [X minutes]
   - Steps followed: [List steps actually followed]
   - Friction points: [Where did you get stuck?]
   - Errors encountered: [Any errors?]
   - Result: [Success/Partial/Failure]

3. Assessment
   - Task completion: [Success/Partial/Failure]
   - Time reasonable: [Yes/No - expected vs actual]
   - Experience: [Smooth/Acceptable/Frustrating]

DIMENSION SCORES
----------------

Navigation: [X/10]
- Can find information: [Easy/Moderate/Difficult]
- Organization: [Logical/Acceptable/Confusing]
- Quick Reference helpful: [Yes/No/N/A]

Instruction Clarity: [X/10]
- Instructions clear: [Yes/Mostly/No]
- Steps actionable: [Yes/Mostly/No]
- Examples helpful: [Yes/Somewhat/No]

Effectiveness: [X/10]
- Achieved purpose: [Yes/Partially/No]
- Delivered value: [Yes/Somewhat/No]
- Would use again: [Yes/Maybe/No]

Learning Curve: [X/10]
- Time to understand: [X minutes]
- Time to use effectively: [X minutes]
- Curve appropriate: [Yes/No]

User Satisfaction: [X/10]
- Overall rating: [1-10]
- Would recommend: [Yes/Maybe/No]
- Experience quality: [Excellent/Good/Poor]

USABILITY SCORE
---------------

Validation Checklist: [X/8 checks passed]
- [ ] Tested in real scenario
- [ ] Can find information easily
- [ ] Instructions clear
- [ ] Examples helpful
- [ ] Achieves stated purpose
- [ ] Learning curve reasonable
- [ ] Error messages helpful (if applicable)
- [ ] Overall satisfaction high

Score: [1-5]/5
Grade: [Excellent/Good/Acceptable/Poor]

RECOMMENDATIONS
---------------

1. [Specific improvement with priority]
2. [Another improvement]
3. [...]

EVIDENCE
--------

[Specific examples of good/bad UX, screenshots if helpful, quotes from experience]
```

---

## Tips for Effective Usability Testing

### Tip 1: Actually Use It

**Don't**: Just read the documentation and imagine using it

**Do**: Follow the instructions step-by-step in a real scenario

**Why**: Real usage reveals issues documentation review misses

### Tip 2: Take Notes During Testing

**Record**:
- Time stamps (start, end, friction points)
- Confusion moments (where did you get stuck?)
- Errors encountered (what went wrong?)
- Smooth experiences (what worked well?)

**Why**: Memory fades; contemporaneous notes are accurate

### Tip 3: Test as Target User

**Approach**: Adopt the mindset of the target user

**Considerations**:
- What's their knowledge level?
- What are they trying to accomplish?
- What constraints do they have?

**Why**: Tests should reflect actual user experience, not expert review

### Tip 4: Complete the Full Scenario

**Don't**: Stop at first issue

**Do**: Complete the entire task even if you encounter problems

**Why**: Full scenario reveals compound issues and overall effectiveness

### Tip 5: Document Specific Evidence

**Vague**: "It was confusing"

**Specific**: "Step 3 says 'configure the system' but doesn't explain which config file or what settings to change"

**Why**: Specific evidence enables actionable improvements

---

## Usability Scoring Guide

### Score 5: Excellent Usability

**Criteria** (All 8 checks pass):
- ✅ Real scenario: Complete success
- ✅ Navigation: Extremely easy
- ✅ Instructions: Crystal clear
- ✅ Examples: Very helpful
- ✅ Achieves purpose: Perfectly
- ✅ Learning curve: Minimal
- ✅ Error messages: Clear and actionable (if applicable)
- ✅ Satisfaction: Very high (9-10/10)

**User Experience**: Smooth, pleasant, efficient, would definitely use again

**Example**: skill-researcher (scenario test successful in 45 min, clear navigation, helpful examples, very satisfying)

---

### Score 4: Good Usability

**Criteria** (6-7 of 8 checks pass):
- ✅ Real scenario: Success with minor friction
- ✅ Navigation: Easy
- ✅ Instructions: Clear
- ⚠️ Examples: Helpful but could be better
- ✅ Achieves purpose: Yes
- ✅ Learning curve: Reasonable
- ⚠️ Error messages: Adequate
- ✅ Satisfaction: Good (7-8/10)

**User Experience**: Generally smooth with minor issues, would use again

---

### Score 3: Acceptable Usability

**Criteria** (4-5 of 8 checks pass):
- ⚠️ Real scenario: Partial success or significant friction
- ⚠️ Navigation: Some difficulty
- ⚠️ Instructions: Somewhat clear, some confusion
- ⚠️ Examples: Somewhat helpful
- ⚠️ Achieves purpose: Mostly
- ⚠️ Learning curve: Acceptable but steep
- ⚠️ Error messages: Unclear
- ⚠️ Satisfaction: Moderate (5-6/10)

**User Experience**: Works but frustrating in places, might use again

---

### Score 2: Poor Usability

**Criteria** (2-3 of 8 checks pass):
- ❌ Real scenario: Failure or very difficult
- ❌ Navigation: Difficult
- ❌ Instructions: Unclear, confusing
- ❌ Examples: Not helpful
- ⚠️ Achieves purpose: Partially
- ❌ Learning curve: Too steep
- ❌ Error messages: Unhelpful
- ❌ Satisfaction: Low (3-4/10)

**User Experience**: Frustrating, confusing, would not use again

---

### Score 1: Failing Usability

**Criteria** (≤1 check passes):
- ❌ Real scenario: Complete failure
- ❌ Navigation: Cannot find information
- ❌ Instructions: Very unclear
- ❌ Examples: Absent or not helpful
- ❌ Doesn't achieve purpose
- ❌ Learning curve: Prohibitive
- ❌ Error messages: Absent or misleading
- ❌ Satisfaction: Very low (1-2/10)

**User Experience**: Unusable, would avoid

---

## Testing Different Skill Patterns

### Testing Workflow Skills

**Scenario**: Complete the full workflow

**Process**:
1. Follow Step 1 through to completion
2. Use outputs from Step 1 as inputs to Step 2
3. Continue through all steps
4. Complete workflow and achieve goal

**Assess**:
- Can you complete each step?
- Are step outputs clear?
- Do outputs flow correctly to next step?
- Is integration smooth?

### Testing Task Skills

**Scenario**: Use 2-3 different operations

**Process**:
1. Select relevant operations
2. Execute each operation independently
3. Verify they work standalone
4. Assess if operations are truly independent

**Assess**:
- Can you use operations independently?
- Are instructions clear for each?
- Do you need to read entire skill or just the operation?

### Testing Reference Skills

**Scenario**: Look up information, apply guidance

**Process**:
1. Try to find specific information
2. Apply the guidance/patterns
3. Check if reference helped

**Assess**:
- Can you find information quickly?
- Is guidance applicable?
- Are examples useful?
- Is navigation easy?

---

## Common Usability Problems and Fixes

### Problem 1: Can't Find Information

**Symptom**: Searching through document for specific info

**Assessment**: Navigation score low

**Fixes**:
- Add table of contents (if >1,000 lines)
- Improve section headers (more descriptive)
- Add Quick Reference
- Better organization

**Priority**: High (affects efficiency)

### Problem 2: Instructions Unclear

**Symptom**: Getting stuck, not knowing what to do

**Assessment**: Instruction clarity low, effectiveness reduced

**Fixes**:
- Add detail to steps
- Provide examples
- Explain prerequisites
- Define technical terms

**Priority**: Critical (blocks usage)

### Problem 3: Steep Learning Curve

**Symptom**: Taking too long to understand

**Assessment**: Learnability low

**Fixes**:
- Add Quick Start section
- Simplify explanations
- Add beginner-friendly examples
- Progressive complexity (basic → advanced)

**Priority**: Medium (affects adoption)

### Problem 4: Examples Don't Help

**Symptom**: Reading examples but still confused

**Assessment**: Example quality low, instruction clarity low

**Fixes**:
- Make examples more concrete
- Add annotations (explain what's happening)
- Use realistic scenarios
- Show expected outputs

**Priority**: High (affects understanding)

### Problem 5: Skill Doesn't Work As Expected

**Symptom**: Following instructions but not achieving goal

**Assessment**: Effectiveness low

**Fixes**:
- Review instructions for accuracy
- Add missing steps
- Clarify ambiguous guidance
- Test instructions yourself

**Priority**: Critical (fundamental issue)

---

## Usability Improvement Strategies

### Improvement 1: Add Quick Start

For skills with learning curve >15 min:

```markdown
## Quick Start

New to [skill-name]? Start here:

1. [Simplest scenario in 3-5 steps]
2. [Expected outcome]
3. [What to do next]

For complete guide, see [Main Content] below.
```

**Impact**: Reduces learning curve by 30-50%

### Improvement 2: Add Visual Aids

For complex processes:
- Flow diagrams (ASCII or mermaid)
- Data flow diagrams
- Architecture diagrams
- Process flowcharts

**Example**:
```
Step 1 → Step 2 → Step 3
  ↓        ↓        ↓
Output  Output  Output
```

**Impact**: Improves understanding by 40%

### Improvement 3: Add Progress Indicators

For long workflows:
```markdown
### Step 3 of 5: [Action]

**Progress**: ■■■□□ 60% Complete
```

**Impact**: Reduces frustration, sets expectations

### Improvement 4: Improve Error Guidance

When users encounter errors:
```markdown
**Common Error**: [Error message or symptom]

**Cause**: [Why this happens]

**Fix**:
1. [Step to resolve]
2. [Another step]

**Prevent**: [How to avoid in future]
```

**Impact**: Reduces support needs by 50%

---

## Usability Review Examples

### Example 1: Excellent Usability (Score 5)

**Skill**: todo-management

**Test**:
- Scenario: Track 5 tasks for skill development
- Time: 8 min to understand, 20 min to use
- Result: Complete success
- Experience: Very smooth

**Assessment**:
- ✅ Navigation excellent (clear operations)
- ✅ Instructions very clear
- ✅ Examples helpful
- ✅ Achieved purpose perfectly
- ✅ Learning curve minimal
- ✅ Satisfaction very high (9/10)

**Evidence**: "Operations were self-explanatory, examples showed exactly what to do, completed task faster than expected"

**Score**: 5/5 (Excellent)

---

### Example 2: Good Usability (Score 4)

**Hypothetical Skill**: data-exporter

**Test**:
- Scenario: Export data to CSV format
- Time: 15 min to understand, 30 min to use
- Result: Success with minor friction
- Experience: Generally smooth

**Assessment**:
- ✅ Navigation good
- ✅ Instructions mostly clear
- ⚠️ One example was abstract ("YOUR_FILE")
- ✅ Achieved purpose
- ✅ Learning curve reasonable (15 min)
- ⚠️ Minor confusion in Step 2 (recovered)
- ✅ Satisfaction good (8/10)

**Evidence**: "Mostly smooth, but Step 2's example had placeholder - had to guess the correct value. Otherwise worked well."

**Score**: 4/5 (Good)

**Improvement**: Replace placeholder example with concrete value

---

## Conclusion

Usability Review validates skills work **in practice**, not just on paper:

1. **Test in real scenarios** - Actually use the skill
2. **Assess 5 dimensions** - Effectiveness, efficiency, satisfaction, learnability, memorability
3. **Document evidence** - Specific examples of UX
4. **Identify improvements** - Concrete, actionable fixes

**Target**: Score ≥4 for production readiness (good user experience, effective, satisfying)

**Required**: Real-world testing (90% manual) - cannot skip or automate

**For scoring details**, see `scoring-rubric.md` Dimension 4.
**For checklist**, see SKILL.md Operation 4.
