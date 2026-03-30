# Extraction Specification: {{extraction_type}}

**Created:** {{date}}
**Author:** {{user_name}}
**Source:** Systematic extraction design workflow

---

## Executive Summary

This specification formalizes the extraction rules for {{extraction_type}} to eliminate variance and achieve consistent, accurate results.

**Variance Target:** Coefficient of Variation (CV) < 5%
**Accuracy Target:** > 95% gold standard match rate

---

## 1. Formal Definition

### What Are We Extracting?

{{formal_definition}}

### Scope

**In Scope:**
{{in_scope_items}}

**Out of Scope:**
{{out_of_scope_items}}

---

## 2. Splitting Rules

### Core Principle

{{splitting_principle}}

### When to Extract as SEPARATE Items

{{when_to_split}}

### When to Extract as ONE Item

{{when_to_combine}}

### Factors Used in Decision

{{decision_factors}}

---

## 3. Decision Matrix

This matrix covers all possible combinations of decision factors, ensuring no ambiguity.

{{decision_matrix}}

### Special Cases

{{special_case_rules}}

---

## 4. Gold Standard Examples

These 20+ examples define correct extraction output for accuracy testing.

### Simple Cases

{{simple_examples}}

### Compound Cases

{{compound_examples}}

### Edge Cases

{{edge_case_examples}}

### Usage

Run extraction on these inputs and compare to expected output. Target: >95% exact match rate.

---

## 5. Edge Case Handling

Explicit rules for boundary conditions that challenge the core splitting logic.

{{edge_case_decisions}}

---

## 6. Anti-Patterns

**Do NOT extract these patterns** - they are not {{extraction_type}}.

{{anti_patterns}}

### Detection Rules

{{anti_pattern_detection}}

---

## 7. Quantification Requirements

### Required Fields

{{required_fields}}

### Optional Fields

{{optional_fields}}

### Quality Rules

{{quality_rules}}

### Vague Terms to Reject

{{vague_terms}}

### Validation Schema

```typescript
{{validation_schema}}
```

---

## 8. Validation Strategy

### Layer 1: Schema Validation (Automated)

{{schema_validation}}

### Layer 2: Gold Standard Match (Automated)

{{gold_standard_validation}}

### Layer 3: Anti-Pattern Detection (Automated)

{{anti_pattern_validation}}

### Layer 4: Variance Threshold (Automated)

{{variance_validation}}

### Layer 5: Human Spot-Check (Manual)

{{manual_validation}}

### Acceptance Criteria

{{acceptance_criteria}}

---

## 9. Testing Plan

### Variance Testing (Consistency)

**Purpose:** {{variance_purpose}}

**Method:**
{{variance_method}}

**Target:** {{variance_target}}

**Interpretation:**
{{variance_interpretation}}

### Accuracy Testing (Correctness)

**Purpose:** {{accuracy_purpose}}

**Method:**
{{accuracy_method}}

**Target:** {{accuracy_target}}

**Interpretation:**
{{accuracy_interpretation}}

### When to Iterate

{{iteration_criteria}}

---

## 10. Expected Variance

### Baseline (Before Specification)

**Baseline CV:** {{baseline_cv}}%
**Baseline Match Rate:** {{baseline_accuracy}}%
**Date Measured:** {{baseline_date}}

### After Specification

**Target CV:** < 5%
**Target Match Rate:** > 95%

### Improvement

**CV Improvement:** {{cv_improvement}}%
**Accuracy Improvement:** {{accuracy_improvement}}%

---

## 11. Implementation Notes

### Rewriting the Extraction Prompt

{{prompt_rewrite_guidance}}

### Key Changes from Original Prompt

{{changes_from_original}}

### Decision Matrix Integration

{{matrix_integration_guidance}}

### Gold Standard Examples in Prompt

{{examples_in_prompt_guidance}}

---

## 12. Testing Results

### Variance Test Results

{{variance_test_results}}

### Accuracy Test Results

{{accuracy_test_results}}

### Validation Layer Results

{{validation_results}}

---

## 13. References

- **Original prompt:** {{original_prompt_path}}
- **Test data:** {{test_data_path}}
- **Variance analysis:** {{variance_analysis_path}}
- **Gold standard examples:** {{gold_standards_path}}

---

## 14. Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| {{date}} | 1.0 | Initial specification | {{user_name}} |

---

## Appendix A: All Examples Analyzed

{{all_examples_catalog}}

---

## Appendix B: Disagreement Analysis

{{disagreement_analysis_details}}

---

## Appendix C: Complete Decision Matrix with Rationale

{{complete_matrix_with_rationale}}

---

**This specification eliminates ambiguity at the source, enabling low-variance, high-accuracy extraction.**
