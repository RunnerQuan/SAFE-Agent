# Extraction Design - Systematic Prompt Specification

This workflow guides the user through discovering and formalizing extraction rules using the Socratic method. The goal is to eliminate ambiguity that causes variance in AI extraction results.

**Philosophy**: We don't tell the user their rules - we help them discover what their rules actually are by exposing edge cases where intuition breaks down.

---

## Workflow Steps

<workflow>

<step n="1" goal="Gather concrete examples">
<action>
"Before we write any rules, show me 20-30 real examples of {extraction_type} from your actual source documents.

Don't filter or clean them - I need to see exactly what the AI will encounter, including:
- Simple cases
- Complex cases
- Ambiguous cases
- Edge cases

Just paste raw text examples. We'll analyze them together."

**WAIT FOR EXAMPLES. DO NOT PROCEED WITHOUT THEM.**

Once examples are provided, acknowledge and organize them:
- Number each example (1-30)
- Identify obvious patterns
- Note which look straightforward vs ambiguous
</action>
<template-output>example_catalog</template-output>
</step>

<step n="2" goal="Identify disagreements">
<action>
"Looking at your examples, I notice patterns. Let me point out where even YOU might disagree about how to extract:

**Compound items** (Example #3):
'Visual supports including timetable, cards, boards'
→ Is this 1 item or 3 items?
→ How do you decide?

**Nested structures** (Example #7):
'TA support (25hrs) and reading intervention (30 mins daily)'
→ Same provider, different activities. 1 or 2 items?

**Partial information** (Example #12):
'Speech therapy as recommended by SALT report'
→ Missing quantification. Extract as-is or skip?

**Bundled activities** (Example #15):
'Daily visual timetable, task cards, and now/next boards provided by teacher'
→ All same provider/frequency. 1 or 3?

For each case I highlighted, tell me:
- How many items would YOU extract?
- Why?

Your answers reveal your splitting rules - the logic that distinguishes one item from multiple."
</action>
<template-output>disagreement_analysis</template-output>
</step>

<step n="3" goal="Derive splitting rules from examples">
<action>
"Based on where you chose to split vs combine, I see a pattern emerging:

[Analyze user's responses and propose their implicit rule]

For example:
- When WHO differs → you split into separate items
- When WHAT differs but WHO/HOW OFTEN same → you split
- When HOW OFTEN differs but WHO/WHAT same → you split
- When ONLY wording differs (synonyms) → you combined

Is this accurate? Let's formalize your splitting rules:

**Proposed Rule:**
Extract as SEPARATE items when any of these differ:
1. WHO provides it (provider)
2. WHAT is provided (activity/resource)
3. HOW OFTEN it happens (frequency)
4. HOW LONG it lasts (duration)

Extract as ONE item when:
- All four aspects are identical
- Only phrasing varies (e.g., 'visual aids' vs 'visual supports')

Does this match your intuition? If not, what would you change?"
</action>
<template-output>splitting_rules</template-output>
</step>

<step n="4" goal="Test rules with edge cases">
<action>
"Now let's stress-test your rules with 10 edge cases that challenge the boundaries:

**Edge Case 1: Nested lists**
'Support including: 1:1 TA (25hrs), Reading (30 mins daily), SALT (weekly)'
→ Your rule says: Split into 3 items (different WHAT + HOW OFTEN)
→ Do you agree?

**Edge Case 2: Partial quantification**
'Visual timetable and task cards (both daily)'
→ Your rule says: Split into 2 items (different WHAT, same HOW OFTEN)
→ Do you agree?

**Edge Case 3: Shared provider, different contexts**
'TA support in class (20hrs) and TA support during transitions (5hrs)'
→ Your rule says: Split into 2 items (different WHAT - different contexts)
→ Do you agree?

**Edge Case 4: Bundled with umbrella term**
'Sensory breaks including fidget tools, movement breaks, and quiet space'
→ Your rule says: Split into 3 items (different WHAT)
→ Or 1 item ('sensory breaks' as umbrella)?
→ Which?

**Edge Case 5: Conditional provision**
'Reading support (30 mins daily) or comprehension support (as needed)'
→ Your rule says: ???
→ How do you handle 'OR' statements?

**Edge Case 6: Range values**
'TA support 15-20 hours per week'
→ Your rule says: 1 item with range in HOW LONG field
→ Do you agree?

**Edge Case 7: Multiple frequencies for same activity**
'SALT: weekly (term 1), fortnightly (term 2-3)'
→ Your rule says: Split into 2 items (different HOW OFTEN)
→ Or 1 item with variable frequency?

**Edge Case 8: Implied provider**
'Visual timetable, task cards, desk overlays (all daily)'
→ Provider not stated. Your rule says: ???
→ Extract with 'unspecified' provider? Skip? Combine?

**Edge Case 9: Overlapping activities**
'Literacy intervention including reading, writing, and spelling (3x weekly, 30 mins)'
→ Your rule says: Split into 3 items (different WHAT) OR 1 item (umbrella activity)?

**Edge Case 10: Maintenance vs active provision**
'Continue current SALT program (weekly) and annual review'
→ Your rule says: Split into 2 items (different WHAT)?
→ Or skip 'annual review' (not a provision)?

For each case where your rule doesn't clearly apply or gives unexpected results, let's refine the rule."
</action>
<template-output>edge_case_decisions</template-output>
</step>

<step n="5" goal="Build decision matrix">
<action>
"Let's create a decision matrix for all possible combinations of your splitting factors. This eliminates ambiguity by covering EVERY scenario.

Your factors: WHO, WHAT, HOW OFTEN, HOW LONG

Decision Matrix (16 combinations):

| WHO same? | WHAT same? | HOW OFTEN same? | HOW LONG same? | Decision | Rationale |
|-----------|------------|-----------------|----------------|----------|-----------|
| ✅ | ✅ | ✅ | ✅ | 1 item | Identical provision, only wording differs |
| ✅ | ✅ | ✅ | ❌ | ??? | Same activity/provider/frequency, different duration |
| ✅ | ✅ | ❌ | ✅ | SPLIT | Same activity/provider, different frequency |
| ✅ | ✅ | ❌ | ❌ | SPLIT | Same activity/provider, different schedule |
| ✅ | ❌ | ✅ | ✅ | SPLIT | Same provider, different activities |
| ✅ | ❌ | ✅ | ❌ | SPLIT | Same provider, different activities + duration |
| ✅ | ❌ | ❌ | ✅ | SPLIT | Same provider, different activities + frequency |
| ✅ | ❌ | ❌ | ❌ | SPLIT | Same provider, everything else differs |
| ❌ | ✅ | ✅ | ✅ | SPLIT | Different provider, same activity |
| ❌ | ✅ | ✅ | ❌ | SPLIT | Different provider, same activity, different duration |
| ❌ | ✅ | ❌ | ✅ | SPLIT | Different provider, same activity, different frequency |
| ❌ | ✅ | ❌ | ❌ | SPLIT | Different provider, same activity, different schedule |
| ❌ | ❌ | ✅ | ✅ | SPLIT | Different provider + activity |
| ❌ | ❌ | ✅ | ❌ | SPLIT | Different provider + activity, same frequency |
| ❌ | ❌ | ❌ | ✅ | SPLIT | Different provider + activity, same duration |
| ❌ | ❌ | ❌ | ❌ | SPLIT | Everything differs |

Fill in the ??? rows together. Which edge cases from Step 4 inform these decisions?

**Special cases to add:**
- What if WHO is unspecified/missing?
- What if HOW OFTEN is unspecified?
- What if WHAT is an umbrella term with nested items?
- What if statement uses 'OR' (alternatives)?

Define rules for these explicitly."
</action>
<template-output>decision_matrix</template-output>
</step>

<step n="6" goal="Create gold standard examples">
<action>
"Now let's create 20 gold standard examples with CORRECT expected output. These become your accuracy test (not just variance test).

For each example:
1. Input text (raw, as it appears in source)
2. Expected output (number of items + what each item should be)
3. Rationale (which rule/matrix cell applies)

**Gold Standard #1:**
Input: 'Visual supports including timetable, cards, boards, daily by teacher'
Expected: 1 provision
- WHO: Teacher
- WHAT: Visual supports (timetable, cards, boards are examples, not separate items)
- HOW OFTEN: Daily
- HOW LONG: (unspecified)
Rationale: Matrix row 1 - all factors identical, 'including' signals examples not separate items

**Gold Standard #2:**
Input: 'TA support (25hrs) and reading intervention (30 mins daily)'
Expected: 2 provisions
- Item 1: TA support, 25 hours (frequency unspecified), provider unspecified
- Item 2: Reading intervention, 30 mins daily, provider unspecified
Rationale: Matrix row 5 - WHO same (implied), WHAT differs → split

[Continue creating 18 more gold standards covering:]
- Simple cases (5 examples)
- Compound cases with 'and' (3 examples)
- Nested lists with 'including' (3 examples)
- Partial quantification (3 examples)
- Umbrella terms (2 examples)
- Conditional/alternative provisions (2 examples)
- Edge cases from Step 4 (2 examples)

These 20 gold standards become your automated accuracy test:
- Run extraction on these inputs
- Compare output to expected
- Calculate match rate
- Target: >95% exact match"
</action>
<template-output>gold_standard_examples</template-output>
</step>

<step n="7" goal="Define anti-patterns">
<action>
"What should the AI NOT extract? Defining anti-patterns prevents false positives.

**Anti-Pattern #1: Outcomes disguised as provisions**
Example: 'Will improve reading comprehension'
→ This is a GOAL, not a provision
→ Don't extract
→ Detection rule: Starts with 'will', 'should', 'aims to'

**Anti-Pattern #2: Needs disguised as provisions**
Example: 'Requires support with transitions'
→ This is a DIFFICULTY, not a provision
→ Don't extract
→ Detection rule: Starts with 'requires', 'needs', 'struggles with'

**Anti-Pattern #3: Aspirational statements**
Example: 'Would benefit from small group work'
→ This is a RECOMMENDATION, not committed provision
→ Don't extract
→ Detection rule: Contains 'would benefit', 'could use', 'might need'

**Anti-Pattern #4: Descriptive context**
Example: 'Due to auditory processing difficulties'
→ This is CONTEXT/RATIONALE, not provision
→ Don't extract
→ Detection rule: Starts with 'due to', 'because of'

**Anti-Pattern #5: Assessment results**
Example: 'Scored 85 on working memory test'
→ This is DATA, not provision
→ Don't extract
→ Detection rule: Contains numbers + test names

What other anti-patterns exist in your domain? Add 3-5 more with examples and detection rules.

Clear boundaries prevent extracting wrong things."
</action>
<template-output>anti_patterns</template-output>
</step>

<step n="8" goal="Formalize quantification requirements">
<action>
"For your extraction type, what makes an item 'complete'? Define required vs optional fields.

**Example for Provisions:**

Required fields:
- WHAT (activity/resource) - Must not be empty, must be specific
- WHO (provider) - Can be 'unspecified' if not stated, but field must exist
- HOW OFTEN (frequency) - Can be 'unspecified' if not stated, but field must exist
- HOW LONG (duration) - Can be 'unspecified' if not stated, but field must exist

Quality rules:
- WHAT: Cannot be vague ('appropriate support', 'as needed')
- HOW OFTEN: Must be quantified if stated (not 'regular', 'frequent')
- HOW LONG: Must be quantified if stated (not 'short', 'extended')
- WHO: Must be role-specific if stated (not 'staff', 'someone')

**Example for Needs:**

Required fields:
- AREA (domain of need - e.g., communication, social, sensory)
- DIFFICULTY (what the child struggles with)
- IMPACT (consequence of the difficulty)

Quality rules:
- DIFFICULTY: Must be observable/measurable (not 'sometimes', 'may')
- IMPACT: Must be specific consequence (not 'can affect', 'might impact')

Define validation schema:
```typescript
interface {ExtractionType} {
  // Define your schema
  field1: string;  // Must not be empty
  field2: string;  // Must not contain vague terms
  field3?: string; // Optional but if present, must be quantified
}

// Vague terms to reject
const VAGUE_TERMS = ['as needed', 'regular', 'appropriate', 'adequate', 'sufficient'];

// Validation rules
const VALIDATION_RULES = [
  'field1 must not be empty',
  'field2 must not contain VAGUE_TERMS',
  'if field3 present, must match quantification pattern (number + unit)'
];
```

This becomes your quality gate - extraction passes only if all items meet these requirements."
</action>
<template-output>quantification_requirements</template-output>
</step>

<step n="9" goal="Plan variance testing approach">
<action>
"How will you test if this works? Define concrete testing methodology.

**Variance Testing (Consistency):**

Purpose: Ensure extraction gives same results each time

Method:
1. Select 10 representative examples (mix of simple and complex)
2. Run extraction 5 times on SAME input (no prompt changes between runs)
3. For each input, compare 5 outputs:
   - Count: Did all 5 runs extract same NUMBER of items?
   - Content: Did all 5 runs extract same ITEMS (exact match)?
4. Calculate Coefficient of Variation (CV):
   - CV = (standard deviation / mean) × 100
   - Example: 5 runs extracted [3, 3, 4, 3, 3] items → mean=3.2, std=0.4, CV=12.5%
5. Target: CV < 5% for item counts

Interpretation:
- CV < 5%: Excellent (low variance)
- CV 5-10%: Acceptable (some variance)
- CV > 10%: Poor (high variance - revise specification)

**Accuracy Testing (Correctness):**

Purpose: Ensure extraction matches expected output

Method:
1. Use 20 gold standard examples from Step 6
2. Run extraction once on each
3. Compare actual output to expected output:
   - Exact match: Item count AND all fields match
   - Partial match: Item count matches, some fields differ
   - Miss: Item count differs OR fields significantly different
4. Calculate match rate:
   - Match rate = (exact matches / 20) × 100%
5. Target: > 95% exact match rate

Interpretation:
- > 95%: Excellent (specification is accurate)
- 90-95%: Good (minor tweaks needed)
- < 90%: Poor (revise splitting rules or examples)

**When to Iterate:**
- If variance test fails (CV > 5%): Look for ambiguities in specification
- If accuracy test fails (< 95%): Look for incorrect splitting rules or incomplete matrix

Don't ship extraction until BOTH tests pass."
</action>
<template-output>testing_strategy</template-output>
</step>

<step n="10" goal="Document validation strategy">
<action>
"How do you know the extraction is CORRECT (not just consistent)? Define validation layers.

**Validation Layer 1: Schema Validation (Automated)**
- Check all required fields present
- Check no fields are empty
- Check no vague terms used
- Implementation: TypeScript/Zod schema validation
- Timing: Immediate (during extraction)

**Validation Layer 2: Gold Standard Match (Automated)**
- Compare extraction to 20 gold standard examples
- Calculate exact match rate
- Implementation: Automated test suite
- Timing: After each prompt change

**Validation Layer 3: Anti-Pattern Detection (Automated)**
- Check extracted items against anti-pattern list
- Flag any items matching anti-pattern rules
- Implementation: Regex matching or keyword detection
- Timing: Immediate (during extraction)

**Validation Layer 4: Variance Threshold (Automated)**
- Run extraction 5 times on test set
- Calculate CV for each input
- Fail if any CV > 5%
- Implementation: Test script
- Timing: Before deployment

**Validation Layer 5: Human Spot-Check (Manual)**
- Sample 5-10 real extractions daily
- Compare to source documents
- Flag any obvious errors
- Implementation: Manual review process
- Timing: Ongoing after deployment

**Acceptance Criteria:**
- Layer 1: 100% pass rate (all items have required fields)
- Layer 2: > 95% exact match rate
- Layer 3: 0% anti-pattern matches
- Layer 4: All CVs < 5%
- Layer 5: < 5% error rate in spot checks

All five layers must pass before extraction is considered production-ready."
</action>
<template-output>validation_strategy</template-output>
</step>

<step n="11" goal="Generate formal specification">
<action>
"Now I'll compile everything into a formal specification document.

I'll use the template at template.md to structure the output.

The specification will include:

1. **Formal Definition** - What are we extracting? (from Step 3)
2. **Splitting Rules** - When to combine vs separate (from Step 3)
3. **Decision Matrix** - All 16+ combinations handled explicitly (from Step 5)
4. **Gold Standard Examples** - 20+ examples with expected output (from Step 6)
5. **Edge Case Handling** - How to handle each edge case (from Step 4)
6. **Anti-Patterns** - What NOT to extract (from Step 7)
7. **Quantification Requirements** - Required fields and quality rules (from Step 8)
8. **Validation Strategy** - 5 validation layers (from Step 10)
9. **Testing Plan** - Variance and accuracy testing (from Step 9)
10. **Expected Variance** - Target: CV < 5%

This specification is now ready to be implemented as an extraction prompt.

Save to: specs/extraction-spec-{extraction_type}-{date}.md"

[Use template.md to generate the actual document]
</action>
<template-output>final_specification</template-output>
</step>

<step n="12" goal="Close with next steps">
<output>
**✅ Extraction Design Complete!**

Created: `specs/extraction-spec-{extraction_type}-{date}.md`

**What We Accomplished:**
- Analyzed {N} real examples from your source documents
- Identified {M} edge cases where rules weren't clear
- Created formal decision matrix with all {X} combinations handled
- Generated 20 gold standard examples for accuracy testing
- Defined 5+ anti-patterns to prevent false positives
- Formalized quantification requirements (required fields, vague terms to avoid)
- Designed 5-layer validation strategy
- Established testing methodology (variance + accuracy)

**Your specification eliminates ambiguity at the source.**

**Next Steps:**
1. **Rewrite your extraction prompt** from this specification
   - Include decision matrix as comments/examples in prompt
   - Add gold standard examples to prompt
   - Explicitly handle edge cases

2. **Test variance** (measure consistency)
   - Run extraction 5 times on 10 test inputs
   - Calculate CV for each input
   - Target: All CVs < 5%

3. **Test accuracy** (measure correctness)
   - Run extraction on 20 gold standard examples
   - Compare actual output to expected output
   - Target: >95% exact match rate

4. **Iterate if needed**
   - If variance test fails → look for ambiguities in spec
   - If accuracy test fails → revise splitting rules
   - Update spec and retest

**Success Criteria Before Production:**
- ✅ Variance: CV < 5% on all test cases
- ✅ Accuracy: >95% gold standard match rate
- ✅ No "when in doubt" escape clauses in prompt
- ✅ All edge cases explicitly handled
- ✅ Anti-patterns prevent false positives

The specification eliminates the variance problem by making your implicit rules explicit.

Would you like help with:
- A) Rewriting your extraction prompt from this specification
- B) Setting up the variance/accuracy test framework
- C) Something else
</output>
</step>

</workflow>

---

## Important Notes

**This workflow is INTERACTIVE:**
- WAIT for user responses at each step
- NEVER assume or fill in their answers
- The user's examples and decisions are the specification - not your assumptions

**Work WITH the user, not FOR them:**
- You discover THEIR rules, not impose yours
- Expose edge cases, ask how THEY would handle them
- Make THEIR intuition explicit through decision matrices

**Concrete before abstract:**
- Always start with 20+ real examples
- Derive rules FROM examples, not top-down
- Test rules WITH examples (edge cases)
- Validate WITH examples (gold standards)

**No escape clauses:**
- Eliminate "when in doubt", "as needed", "if unclear"
- Every scenario must have explicit decision
- Decision matrix covers ALL combinations
- Edge cases handled individually

The goal is a specification SO precise that extraction variance drops below 5% CV.
