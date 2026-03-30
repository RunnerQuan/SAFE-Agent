# Scoring Rubric

## Purpose

This comprehensive scoring rubric provides detailed criteria for objective, consistent assessment across all 5 review dimensions. Use this rubric to ensure evidence-based scoring, reduce subjectivity, and maintain consistency across reviews and reviewers.

## How to Use This Rubric

### General Principles

1. **Evidence-Based Scoring**: Base scores on observable criteria, not opinion or feeling
2. **Multiple Criteria**: Each score level has specific criteria - multiple criteria must be met
3. **Concrete Examples**: Reference actual examples when justifying scores
4. **Edge Case Guidance**: When between scores, refer to specific criteria that tips the balance
5. **Document Rationale**: Note which criteria were met/not met for transparency
6. **Consistency Over Time**: Use same standards across all reviews

### Scoring Process

1. Read dimension rubric completely before scoring
2. Review skill against each score level's criteria (start at 5, work down)
3. Identify which level's criteria best match the skill
4. Document evidence for the score (which criteria met/not met)
5. If between two scores, review edge case guidance
6. Assign score and note rationale

### When In Doubt

- **Between 5 and 4**: Does it exceed standards or just meet them? Exceeding = 5, Meeting = 4
- **Between 4 and 3**: Are issues critical or minor? Critical = 3, Minor = 4
- **Between 3 and 2**: Is it usable with concerns or not production-ready? Usable = 3, Not ready = 2
- **Between 2 and 1**: Significant issues or fundamentally flawed? Significant = 2, Flawed = 1

## Dimension 1: Structure Review Rubric

### Score 5 - Excellent (Exceeds Standards)

**Criteria** (All must be met):
- ✅ YAML frontmatter present, valid syntax, no errors
- ✅ `name` field perfect kebab-case format (^[a-z][a-z0-9]*(-[a-z0-9]+)*$)
- ✅ `description` includes 7+ trigger keywords, naturally embedded, contextual
- ✅ SKILL.md exists, well-formatted
- ✅ README.md present and comprehensive
- ✅ File naming perfect (SKILL.md, README.md uppercase; references/ files lowercase-hyphen)
- ✅ Directory structure exemplary (references/ and/or scripts/ well-organized if present)
- ✅ SKILL.md <1,000 lines (excellent progressive disclosure)
- ✅ references/ files 300-600 lines each (ideal size range)
- ✅ No monolithic files, exemplary organization

**Example**: development-workflow
- Perfect YAML with 13+ keywords
- Impeccable file structure
- 1,027 lines (just over 1K but has 2 comprehensive references)
- README complete
- Exemplary organization

**Edge Cases**:
- SKILL.md 1,000-1,200 lines but has extensive references: Still score 5 if progressive disclosure maintained
- Missing README if truly optional (simple skill): Score 5 if everything else perfect

---

### Score 4 - Good (Meets Standards)

**Criteria** (8-9 of 10 checks pass):
- ✅ YAML frontmatter valid
- ✅ `name` field correct kebab-case
- ✅ `description` includes 5-6 trigger keywords (meets minimum)
- ✅ SKILL.md exists
- ⚠️ README.md missing OR minimal
- ✅ File naming correct
- ✅ Directory structure correct
- ✅ SKILL.md 1,000-1,200 lines (good but approaching limit)
- ✅ references/ files present and reasonable size
- ✅ Progressive disclosure maintained

**Example**: todo-management
- Valid YAML with 8 keywords
- Good file structure
- 569 lines (excellent size)
- README present
- 1 minor issue: No Quick Reference section (non-critical)

**Non-Critical Issues** (allow for score 4):
- README missing but skill is simple
- SKILL.md 1,000-1,200 lines (still acceptable)
- 1-2 references/ files slightly over 800 lines
- Minor YAML formatting (extra whitespace)

---

### Score 3 - Acceptable (Minor Improvements Needed)

**Criteria** (6-7 of 10 checks pass):
- ✅ YAML frontmatter present but minor syntax issues
- ⚠️ `name` field mostly correct (minor deviation)
- ⚠️ `description` includes 3-4 trigger keywords (below target)
- ✅ SKILL.md exists
- ❌ README.md missing
- ⚠️ File naming mostly correct (1-2 incorrect names)
- ✅ Directory structure present
- ⚠️ SKILL.md 1,200-1,500 lines (acceptable but large)
- ⚠️ references/ files present but some >800 lines
- ⚠️ Progressive disclosure needs improvement

**Example Scenario**:
- YAML valid but only 4 trigger keywords
- name: "my-skill" (correct)
- No README.md
- SKILL.md 1,350 lines (large but not monolithic)
- One reference file is 950 lines (too large)
- Directory structure fine

**Critical Issues** (prevent score 4):
- 3-4 checks failing
- README missing and skill is complex
- SKILL.md approaching 1,500 lines without good progressive disclosure
- Multiple file naming issues

---

### Score 2 - Needs Work (Notable Issues)

**Criteria** (4-5 of 10 checks pass):
- ⚠️ YAML frontmatter present but syntax errors
- ❌ `name` field incorrect format (CamelCase, spaces, etc.)
- ❌ `description` includes <3 trigger keywords or keyword stuffing
- ✅ SKILL.md exists
- ❌ README.md missing
- ❌ File naming conventions violated (multiple files)
- ⚠️ Directory structure present but disorganized
- ❌ SKILL.md >1,500 lines (monolithic)
- ❌ No references/ directory despite SKILL.md size
- ❌ Progressive disclosure absent

**Example Scenario**:
- YAML has syntax error (missing closing ---)
- name: "MySkill" (wrong case)
- description: only 2 keywords
- SKILL.md exists but 1,800 lines
- No README
- references/ has "MyGuide.md" (wrong case)
- No scripts/ directory
- Monolithic structure

**Multiple Critical Issues** (trigger score 2):
- 5-6 checks failing
- YAML syntax errors
- Wrong name format
- Monolithic SKILL.md without references
- Multiple naming violations

---

### Score 1 - Poor (Significant Problems)

**Criteria** (≤3 of 10 checks pass):
- ❌ YAML frontmatter missing or severely malformed
- ❌ `name` field missing or completely wrong
- ❌ `description` missing or no trigger keywords
- ⚠️ SKILL.md exists but severely flawed
- ❌ README.md missing
- ❌ File naming conventions completely ignored
- ❌ Directory structure absent or chaotic
- ❌ SKILL.md >2,000 lines (severely monolithic)
- ❌ No progressive disclosure at all
- ❌ Fundamentally flawed organization

**Example Scenario**:
- No YAML frontmatter
- SKILL.md 2,500 lines, no sections
- Files: "Skill.md", "my guide.md" (spaces), "script.txt"
- No directory structure
- No README
- Fundamentally broken structure

**Fundamentally Flawed** (score 1):
- 7+ checks failing
- Missing critical components (YAML, proper file names)
- Chaotic organization
- Not following any conventions

---

## Dimension 2: Content Review Rubric

### Score 5 - Excellent (Exceeds Standards)

**Criteria**:
- ✅ All 5 core sections present (Overview, When to Use, Main Content, Best Practices, Quick Reference)
- ✅ Optional sections add value (Prerequisites, Common Mistakes, Troubleshooting, Examples)
- ✅ When to Use has 7+ scenarios, comprehensive coverage
- ✅ Main content exceptionally clear, well-organized, comprehensive
- ✅ 10+ code/command examples, all concrete and executable
- ✅ Examples demonstrate key concepts perfectly
- ✅ Content clarity exceptional (9-10/10)
- ✅ Perfect depth balance (detailed but concise)
- ✅ Documentation completeness exemplary
- ✅ No gaps, edge cases covered

**Example**: skill-researcher
- All 5 core sections + Prerequisites + Common Mistakes
- 8 scenarios in When to Use
- 5 operations comprehensively documented
- 12+ examples throughout
- Exceptional clarity
- Comprehensive coverage

---

### Score 4 - Good (Meets Standards)

**Criteria** (8-9 of 10 checks):
- ✅ All 5 core sections present
- ⚠️ Optional sections mostly absent (1 present)
- ✅ When to Use has 5-6 scenarios (meets minimum)
- ✅ Main content clear and well-organized
- ✅ 5-9 examples, all concrete
- ✅ Examples help understanding
- ✅ Content clarity good (7-8/10)
- ✅ Good depth balance
- ⚠️ Documentation complete with minor gaps
- ⚠️ Some edge cases not covered

**Example**: prompt-builder
- All 5 core sections
- 6 best practices (good)
- 7 scenarios
- 8 examples (good quantity)
- Clear content
- Minor gap: No error handling examples

**Minor Issues** (still score 4):
- 1-2 optional sections missing
- 5-6 scenarios (minimum)
- Minor clarity issues
- Small documentation gaps

---

### Score 3 - Acceptable (Minor Improvements Needed)

**Criteria** (6-7 of 10 checks):
- ✅ 4 of 5 core sections present (1 missing)
- ❌ No optional sections
- ⚠️ When to Use has 3-4 scenarios (below target)
- ⚠️ Main content present but some sections weak
- ⚠️ 3-4 examples (below target)
- ⚠️ Examples somewhat helpful but could be better
- ⚠️ Content clarity acceptable (5-6/10) - some confusion
- ⚠️ Depth unbalanced (too brief in places, verbose in others)
- ⚠️ Documentation gaps noticeable
- ⚠️ Edge cases not covered

**Example Scenario**:
- Missing Quick Reference (core section)
- 4 scenarios in When to Use
- 4 examples total (sparse)
- Some sections unclear
- Notable gaps in documentation

---

### Score 2 - Needs Work (Notable Issues)

**Criteria** (4-5 of 10 checks):
- ⚠️ 3 of 5 core sections present (2 missing)
- ❌ No optional sections
- ❌ When to Use has <3 scenarios
- ❌ Main content incomplete or poorly organized
- ❌ 1-2 examples (very sparse)
- ❌ Examples not helpful or abstract
- ❌ Content clarity poor (3-4/10) - confusing
- ❌ Depth problems (too brief OR too verbose)
- ❌ Major documentation gaps
- ❌ Edge cases completely ignored

**Example Scenario**:
- Missing When to Use AND Quick Reference
- 2 scenarios listed
- Only 2 examples, both abstract ("YOUR_VALUE")
- Content confusing, poor organization
- Major gaps in coverage

---

### Score 1 - Poor (Significant Problems)

**Criteria** (≤3 of 10 checks):
- ❌ ≤2 of 5 core sections present
- ❌ No optional sections
- ❌ No When to Use section
- ❌ Main content severely incomplete/absent
- ❌ No examples or only 1 abstract example
- ❌ Content extremely unclear (1-2/10)
- ❌ No coherent organization
- ❌ Documentation severely incomplete
- ❌ Major gaps throughout

---

## Dimension 3: Quality Review Rubric

### Score 5 - Excellent (Exceeds Standards)

**Criteria**:
- ✅ Architecture pattern perfectly implemented
- ✅ Exemplary consistency across all sections
- ✅ Validation checklists specific, measurable, comprehensive
- ✅ Best practices section highly actionable
- ✅ Trigger keywords natural, contextual (7+ keywords)
- ✅ Perfect progressive disclosure (<1,000 lines + references)
- ✅ All examples complete, no placeholders
- ✅ Error cases documented with recovery guidance
- ✅ Dependencies clearly documented with integration examples
- ✅ Scripts exemplary (if present): docstrings, error handling, tests
- ✅ No anti-patterns detected

**Example**: development-workflow
- Workflow pattern perfectly implemented
- Consistent 5-step structure
- Specific validation checklists
- 13+ natural keywords
- Comprehensive error guidance
- Exemplary quality

---

### Score 4 - Good (Meets Standards)

**Criteria** (8-9 of 10 checks):
- ✅ Architecture pattern correctly implemented
- ✅ Good consistency
- ✅ Validation checklists specific
- ✅ Best practices actionable
- ✅ Trigger keywords natural (5-6 keywords)
- ✅ Progressive disclosure maintained
- ✅ Examples complete
- ⚠️ Error cases limited (only happy path)
- ✅ Dependencies documented
- ✅ Scripts good (if present)
- ⚠️ 1 minor anti-pattern detected

**Minor Issues** (score 4):
- Limited error handling (not critical)
- 1 non-critical anti-pattern
- Minor consistency deviations

---

### Score 3 - Acceptable (Minor Improvements Needed)

**Criteria** (6-7 of 10 checks):
- ✅ Architecture pattern mostly correct
- ⚠️ Some consistency issues
- ⚠️ Validation checklists present but some vague
- ⚠️ Best practices present but not all actionable
- ⚠️ Trigger keywords somewhat natural (4-5 keywords)
- ⚠️ Progressive disclosure needs improvement
- ⚠️ Some examples incomplete
- ❌ No error case documentation
- ⚠️ Dependencies mentioned but not detailed
- ⚠️ Scripts adequate but missing some documentation
- ⚠️ 2-3 anti-patterns detected

**Issues** (score 3):
- 2-3 anti-patterns
- Consistency problems
- Limited documentation

---

### Score 2 - Needs Work (Notable Issues)

**Criteria** (4-5 of 10 checks):
- ⚠️ Architecture pattern partially correct
- ❌ Significant consistency problems
- ❌ Validation checklists vague ("everything works")
- ❌ Best practices not actionable
- ❌ Keyword stuffing or too few keywords (<3)
- ❌ No progressive disclosure (monolithic)
- ❌ Examples have placeholders ("YOUR_VALUE")
- ❌ No error handling
- ❌ Dependencies unclear
- ❌ Scripts poor or missing documentation
- ❌ 4-5 anti-patterns detected

---

### Score 1 - Poor (Significant Problems)

**Criteria** (≤3 of 10 checks):
- ❌ Architecture pattern incorrect or absent
- ❌ No consistency
- ❌ No validation checklists or completely vague
- ❌ No best practices or not actionable
- ❌ Severe keyword issues
- ❌ Severely monolithic (>2,000 lines, no references)
- ❌ No examples or all placeholders
- ❌ No error consideration
- ❌ Dependencies completely unclear
- ❌ Scripts absent or severely flawed
- ❌ 6+ anti-patterns detected

---

## Dimension 4: Usability Review Rubric

### Score 5 - Excellent (Exceeds Standards)

**Criteria** (All 8 checks pass):
- ✅ Real-world scenario test: Complete success, smooth experience
- ✅ Navigation excellent: Information extremely easy to find
- ✅ Instructions crystal clear: Zero confusion
- ✅ Examples extremely helpful: Demonstrate all key concepts perfectly
- ✅ Skill perfectly achieves stated purpose
- ✅ Learning curve minimal for complexity
- ✅ Error messages (if applicable): Clear, actionable, helpful
- ✅ User satisfaction very high: Would definitely use again and recommend

**Example**: skill-researcher
- Scenario test successful in 45 min
- Easy navigation with Quick Reference
- Clear instructions
- Excellent examples
- Achieved purpose perfectly
- Learning curve reasonable (10-15 min)
- Very satisfying experience

---

### Score 4 - Good (Meets Standards)

**Criteria** (6-7 of 8 checks pass):
- ✅ Real-world scenario test: Success with minor friction
- ✅ Navigation good: Information easy to find
- ✅ Instructions clear: Minimal confusion
- ⚠️ Examples helpful but could be better
- ✅ Skill achieves stated purpose
- ✅ Learning curve reasonable
- ⚠️ Error messages adequate (if applicable)
- ✅ User satisfaction good: Would use again

**Minor Friction** (score 4):
- One section slightly unclear
- One concept needs better explanation
- Minor navigation issue

---

### Score 3 - Acceptable (Minor Improvements Needed)

**Criteria** (4-5 of 8 checks pass):
- ⚠️ Real-world scenario test: Partial success or significant friction
- ⚠️ Navigation acceptable: Some difficulty finding information
- ⚠️ Instructions somewhat clear: Some confusion
- ⚠️ Examples somewhat helpful
- ⚠️ Skill mostly achieves purpose
- ⚠️ Learning curve acceptable but steep
- ⚠️ Error messages unclear (if applicable)
- ⚠️ User satisfaction moderate: Might use again

---

### Score 2 - Needs Work (Notable Issues)

**Criteria** (2-3 of 8 checks pass):
- ❌ Real-world scenario test: Failure or very difficult
- ❌ Navigation poor: Hard to find information
- ❌ Instructions unclear: Significant confusion
- ❌ Examples not helpful
- ❌ Skill partially achieves purpose
- ❌ Learning curve too steep
- ❌ Error messages unhelpful
- ❌ User satisfaction low: Frustrating

---

### Score 1 - Poor (Significant Problems)

**Criteria** (≤1 check passes):
- ❌ Real-world scenario test: Complete failure
- ❌ Navigation terrible: Cannot find information
- ❌ Instructions very unclear: Extremely confusing
- ❌ Examples absent or not helpful
- ❌ Skill does not achieve purpose
- ❌ Learning curve prohibitively steep
- ❌ Error messages absent or misleading
- ❌ User satisfaction very low: Would not use

---

## Dimension 5: Integration Review Rubric

### Score 5 - Excellent (Exceeds Standards)

**Criteria** (All 9 applicable checks pass):
- ✅ Dependencies perfectly documented
- ✅ YAML dependencies field correct (if used)
- ✅ Data flow exceptionally clear (for workflows)
- ✅ Integration points crystal clear
- ✅ Component skills referenced correctly
- ✅ All cross-references valid
- ✅ Integration examples comprehensive
- ✅ Composition pattern perfectly documented (if workflow)
- ✅ Complementary skills mentioned

**Example**: development-workflow
- All 5 component skills documented
- Data flow diagram present
- Integration method clear for each step
- Perfect cross-references
- Composition pattern (sequential) documented

---

### Score 4 - Good (Meets Standards)

**Criteria** (7-8 of 9 checks pass):
- ✅ Dependencies documented
- ✅ YAML field correct (if used)
- ✅ Data flow clear (for workflows)
- ✅ Integration points clear
- ✅ Component skills referenced correctly
- ✅ Cross-references valid
- ⚠️ Integration examples limited
- ✅ Composition pattern documented (if workflow)
- ⚠️ Complementary skills not mentioned

---

### Score 3 - Acceptable (Minor Improvements Needed)

**Criteria** (5-6 of 9 checks pass):
- ⚠️ Dependencies mentioned but not detailed
- ⚠️ YAML field missing (if should be used)
- ⚠️ Data flow somewhat unclear (for workflows)
- ⚠️ Integration points somewhat clear
- ✅ Component skills referenced
- ⚠️ Some cross-references broken
- ❌ No integration examples
- ⚠️ Composition pattern mentioned but not detailed
- ❌ Complementary skills not mentioned

---

### Score 2 - Needs Work (Notable Issues)

**Criteria** (3-4 of 9 checks pass):
- ❌ Dependencies poorly documented
- ❌ YAML field incorrect or missing
- ❌ Data flow unclear (for workflows)
- ❌ Integration points unclear
- ⚠️ Component skills referenced but inaccurately
- ❌ Multiple broken cross-references
- ❌ No integration examples
- ❌ Composition pattern not documented
- ❌ No complementary skills

---

### Score 1 - Poor (Significant Problems)

**Criteria** (≤2 of 9 checks pass):
- ❌ Dependencies not documented
- ❌ YAML field wrong or missing
- ❌ Data flow completely unclear
- ❌ Integration points completely unclear
- ❌ Component skills incorrectly referenced
- ❌ All cross-references broken
- ❌ No integration guidance
- ❌ No composition documentation
- ❌ Integration completely unclear

---

## Overall Score Calculation

### Weighted Average Formula

```
Overall = (Structure × 0.20) + (Content × 0.25) + (Quality × 0.25) +
          (Usability × 0.15) + (Integration × 0.15)
```

### Weight Rationale

**Content & Quality (25% each - 50% total)**:
- Core skill value
- What the skill does and how well
- Most important for effectiveness

**Structure (20%)**:
- Foundation and organization
- Affects discoverability and maintenance
- Important but supporting

**Usability & Integration (15% each - 30% total)**:
- User experience and composition
- Important for adoption and ecosystem
- Supporting but valuable

### Calculation Examples

**Example 1**: High Quality Skill
- Structure: 5, Content: 4, Quality: 4, Usability: 3, Integration: 4
- Overall = (5×0.20) + (4×0.25) + (4×0.25) + (3×0.15) + (4×0.15)
- Overall = 1.0 + 1.0 + 1.0 + 0.45 + 0.6 = **4.05**
- **Grade: B+ (Ready with minor improvements)**

**Example 2**: Excellent Skill
- Structure: 5, Content: 5, Quality: 5, Usability: 4, Integration: 4
- Overall = (5×0.20) + (5×0.25) + (5×0.25) + (4×0.15) + (4×0.15)
- Overall = 1.0 + 1.25 + 1.25 + 0.6 + 0.6 = **4.70**
- **Grade: A (Production Ready)**

**Example 3**: Needs Improvement
- Structure: 4, Content: 3, Quality: 2, Usability: 3, Integration: 3
- Overall = (4×0.20) + (3×0.25) + (2×0.25) + (3×0.15) + (3×0.15)
- Overall = 0.8 + 0.75 + 0.5 + 0.45 + 0.45 = **2.95**
- **Grade: C (Needs improvements before production)**

---

## Grade Mapping

### Grade A: 4.5-5.0 (Excellent - Production Ready)

**Meaning**: High quality skill that exceeds standards

**Characteristics**:
- Multiple dimensions scored 5
- No dimensions below 4
- Exemplary in most areas
- Can serve as example for others

**Decision**: ✅ Ship with confidence - ready for production

**Example**: Skill with scores (5,5,5,4,4) = 4.7

---

### Grade B+: 4.0-4.4 (Good - Ready with Minor Improvements)

**Meaning**: Solid quality that meets standards

**Characteristics**:
- Most dimensions scored 4-5
- Perhaps one dimension at 3
- Standard expected quality
- Minor improvements possible

**Decision**: ✅ Ship - note improvements for next iteration

**Example**: Skill with scores (4,4,4,3,4) = 3.95 rounds to 4.0

---

### Grade B-: 3.5-3.9 (Acceptable - Needs Improvements)

**Meaning**: Usable but not optimal

**Characteristics**:
- Mix of 3s and 4s
- Some notable issues
- Works but has concerns
- Improvements recommended before production

**Decision**: ⚠️ Hold - fix identified issues first

**Example**: Skill with scores (4,3,3,3,4) = 3.35

---

### Grade C: 2.5-3.4 (Poor - Not Ready)

**Meaning**: Significant quality issues

**Characteristics**:
- Multiple dimensions at 2-3
- Notable problems
- Not production-ready
- Substantial work needed

**Decision**: ❌ Don't ship - rework required

---

### Grade D: 1.5-2.4 (Very Poor - Not Ready)

**Meaning**: Major quality problems

**Characteristics**:
- Multiple dimensions at 1-2
- Major issues throughout
- Significant rework needed

**Decision**: ❌ Don't ship - extensive improvements required

---

### Grade F: 1.0-1.4 (Failing - Not Viable)

**Meaning**: Fundamentally flawed

**Characteristics**:
- Most dimensions at 1
- Severe problems
- Not viable in current state

**Decision**: ❌ Don't ship - start over or abandon

---

## Production Readiness Assessment

### Ready to Ship (≥4.5)

**Criteria**: Overall score 4.5 or higher

**Meaning**:
- High quality, ready for production
- Can deploy with confidence
- Minor improvements optional
- Set bar for quality standards

**Risk Level**: Low - ship it

**Next Steps**:
- Deploy to production
- Monitor usage
- Gather feedback for future iterations

---

### Ready with Improvements (4.0-4.4)

**Criteria**: Overall score 4.0-4.4

**Meaning**:
- Good quality, meets standards
- Can deploy with noted improvements
- Address improvements in next iteration
- Standard expected quality

**Risk Level**: Low-Medium - ship with notes

**Next Steps**:
- Deploy to production
- Document noted improvements
- Plan improvements for next iteration
- Monitor for issues

---

### Needs Improvements (3.5-3.9)

**Criteria**: Overall score 3.5-3.9

**Meaning**:
- Acceptable but not optimal
- Fix issues before production
- Some risk if deployed as-is
- Improvements recommended

**Risk Level**: Medium - hold and improve

**Next Steps**:
- Identify critical issues
- Fix critical issues before deploying
- Re-review after fixes
- Target score ≥4.0

---

### Not Ready (<3.5)

**Criteria**: Overall score below 3.5

**Meaning**:
- Significant quality issues
- Not production-ready
- Substantial rework needed
- High risk if deployed

**Risk Level**: High - don't ship

**Next Steps**:
- Comprehensive improvement plan
- Address all dimensions below 3
- Major rework required
- Re-review when substantially improved
- Target score ≥4.0

---

## Scoring Consistency Guide

### Tips for Consistent Scoring

1. **Use the Rubric**: Always refer to specific criteria, don't score from memory
2. **Document Evidence**: Note which criteria were met/not met
3. **Multiple Reviews**: When possible, have 2-3 reviewers score independently, then calibrate
4. **Self-Calibration**: Periodically review past scores to ensure consistency
5. **Edge Cases**: When uncertain, discuss with team or refer to examples
6. **Be Objective**: Score what IS, not what you wish it was
7. **Consistent Standards**: Apply same standards across all skills

### Avoiding Common Biases

**Halo Effect**: One excellent dimension inflates others
- **Fix**: Score each dimension independently before viewing others

**Severity Bias**: Being too harsh or too lenient
- **Fix**: Use rubric criteria, not personal feeling

**Recency Bias**: Recent skills scored differently than earlier ones
- **Fix**: Review rubric before each scoring session

**Anchoring**: First impression affects subsequent scoring
- **Fix**: Review all criteria before deciding score

### Multiple Reviewer Calibration

When using multiple reviewers:

1. **Independent Scoring**: Each reviewer scores independently first
2. **Compare Scores**: Share scores and identify discrepancies
3. **Discuss Differences**: When scores differ by 2+, discuss which criteria were met/not met
4. **Reference Rubric**: Use rubric to resolve disagreements
5. **Document Resolution**: Note final consensus score and rationale
6. **Track Variance**: Monitor inter-rater reliability over time

**Target**: Reviewers should be within 1 point on most dimensions

### Common Scoring Mistakes

**Mistake 1: Too Lenient** (Everyone gets 4-5)
- **Problem**: No differentiation, inflated scores
- **Fix**: Be critical, use full range (1-5), expect perfection for 5

**Mistake 2: Too Harsh** (No one above 3)
- **Problem**: Demotivating, unrealistic standards
- **Fix**: Score 4 = "meets standards" (not "perfect")

**Mistake 3: Inconsistent Application**
- **Problem**: Same issue scored differently across skills
- **Fix**: Document scoring decisions, review for patterns

**Mistake 4: Subjective Judgment**
- **Problem**: "Feels like a 3" without evidence
- **Fix**: Always cite specific rubric criteria

**Mistake 5: Ignoring Rubric**
- **Problem**: Scoring from opinion
- **Fix**: Print rubric, check off criteria explicitly

---

## Rubric Version History

**v1.0** (Current)
- Initial comprehensive rubric
- 5 dimensions with detailed criteria
- Weighted scoring system
- Production readiness thresholds
- Consistency guidance

---

**For more information on review process, see SKILL.md main documentation.**
