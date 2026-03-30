# Extraction Design Validation Checklist

Use this checklist to verify the extraction specification is complete and ready for implementation.

---

## Specification Completeness

### Core Definition
- [ ] Formal definition provided (what ARE we extracting?)
- [ ] Scope clearly defined (in scope vs out of scope)
- [ ] Extraction type identified (provisions, needs, outcomes, etc.)

### Splitting Rules
- [ ] Splitting rules explicitly defined (when to combine vs separate)
- [ ] Decision factors identified (WHO, WHAT, HOW OFTEN, etc.)
- [ ] Core principle articulated clearly

### Decision Matrix
- [ ] Decision matrix complete (all 16+ combinations addressed)
- [ ] No cells marked "???" or "unclear"
- [ ] Special cases explicitly handled
- [ ] Matrix covers edge cases from Step 4

### Examples
- [ ] 20+ gold standard examples with rationale
- [ ] Examples cover simple cases (5+)
- [ ] Examples cover compound cases (5+)
- [ ] Examples cover edge cases (5+)
- [ ] Each example has expected output defined
- [ ] Each example has rationale explaining which rule applies

### Edge Cases
- [ ] Edge cases identified and handled (10+)
- [ ] Each edge case has explicit decision rule
- [ ] Edge cases integrated into decision matrix
- [ ] No edge cases left as "depends" or "case by case"

### Anti-Patterns
- [ ] Anti-patterns defined (what NOT to extract)
- [ ] 5+ anti-pattern examples provided
- [ ] Detection rules for each anti-pattern
- [ ] Anti-patterns cover false positives specific to domain

### Quantification
- [ ] Required fields explicitly listed
- [ ] Optional fields explicitly listed
- [ ] Quality rules defined (no vague terms, etc.)
- [ ] Vague terms list provided
- [ ] Validation schema defined

### No Escape Clauses
- [ ] No "when in doubt" phrases
- [ ] No "as appropriate" or "as needed" fallbacks
- [ ] No "if unclear" contingencies
- [ ] Every scenario has deterministic decision

---

## Quality Gates

### Variance Testing
- [ ] Variance test plan defined (CV < 5% target)
- [ ] Test methodology documented (5 runs on 10 inputs)
- [ ] Baseline variance measured (before specification)
- [ ] Expected improvement calculated
- [ ] Interpretation criteria defined

### Accuracy Testing
- [ ] Accuracy test plan defined (>95% gold standard match)
- [ ] Test methodology documented
- [ ] Gold standard examples ready to use
- [ ] Match rate calculation method defined
- [ ] Interpretation criteria defined

### Validation Strategy
- [ ] 5 validation layers defined
- [ ] Acceptance criteria for each layer
- [ ] Automated validation feasible
- [ ] Manual validation process defined

---

## Prompt Implementation

### Rewriting Guidance
- [ ] Original prompt reviewed for ambiguities
- [ ] New prompt structure planned
- [ ] Decision matrix integration planned
- [ ] Examples to include in prompt identified
- [ ] Edge case handling in prompt planned
- [ ] Anti-patterns documented in prompt planned

### Prompt Quality
- [ ] Prompt includes concrete examples (not just rules)
- [ ] Prompt references decision matrix
- [ ] Prompt explicitly handles top 5 edge cases
- [ ] Prompt lists anti-patterns to avoid
- [ ] Prompt defines required output format

---

## Testing Evidence

### Pre-Implementation
- [ ] Baseline variance measured (CV before spec)
- [ ] Baseline accuracy measured (match rate before spec)
- [ ] Problem examples documented (where original prompt failed)

### Post-Implementation
- [ ] Variance test completed (5+ runs)
- [ ] Actual CV measured
- [ ] Gold standard match rate calculated
- [ ] Both metrics meet targets OR iteration plan defined

### Results Documentation
- [ ] Test results recorded in specification
- [ ] Improvement metrics calculated
- [ ] Problem areas identified (if targets not met)
- [ ] Iteration plan created (if needed)

---

## Documentation

### Specification Document
- [ ] Specification saved to specs/ directory
- [ ] Filename follows convention: extraction-spec-{type}-{date}.md
- [ ] All template sections completed
- [ ] No placeholder text remaining ({{variables}})

### Supporting Files
- [ ] Original prompt preserved for comparison
- [ ] Test data examples saved
- [ ] Test results documented
- [ ] Improvement metrics recorded

### Traceability
- [ ] References to source documents
- [ ] Links to related specifications
- [ ] Version history table
- [ ] Author and date recorded

---

## Pass Criteria

**Minimum requirements to consider specification complete:**

1. ✅ All "Specification Completeness" items checked
2. ✅ All "Quality Gates" items checked
3. ✅ All "Prompt Implementation" items checked
4. ✅ All "Documentation" items checked
5. ✅ Zero escape clauses ("when in doubt", etc.)
6. ✅ Decision matrix has zero ambiguous cells

**Testing can begin when:**
- All specification completeness items checked
- Prompt rewritten from specification
- Test framework ready (variance + accuracy)

**Specification approved when:**
- Variance test passes (CV < 5%)
- Accuracy test passes (>95% match)
- All validation layers pass
- Human spot-check confirms quality

---

## Common Issues

### Issue: High Variance (CV > 5%)

**Diagnosis:**
- Check decision matrix for ambiguous cells
- Review edge cases - are they all handled?
- Look for escape clauses in prompt
- Check if examples contradict rules

**Fix:**
- Refine decision matrix
- Add more explicit edge case handling
- Remove any "when in doubt" language
- Ensure examples align with rules

### Issue: Low Accuracy (< 95% match)

**Diagnosis:**
- Compare failed cases to decision matrix
- Check if splitting rules correct
- Review gold standards - are they actually correct?
- Look for systematic errors (all of one type)

**Fix:**
- Revise splitting rules based on failures
- Update decision matrix
- Correct gold standards if needed
- Add failed cases as new examples

### Issue: False Positives (extracting wrong things)

**Diagnosis:**
- Check which anti-patterns were extracted
- Review anti-pattern detection rules
- Check if scope definition too broad

**Fix:**
- Add more anti-patterns
- Strengthen detection rules
- Narrow scope definition
- Add negative examples to prompt

---

## Notes

This checklist ensures the specification is:
- **Complete**: All scenarios covered
- **Unambiguous**: No unclear decision points
- **Testable**: Can measure variance and accuracy
- **Implementable**: Can be translated to extraction prompt

Follow the checklist in order. Do not skip sections.

**Philosophy:** If you can't check a box, the specification isn't done.
