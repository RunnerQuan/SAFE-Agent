# Integration Review Guide

## Purpose

This guide provides detailed guidance for conducting Integration Review (Operation 5), assessing dependency documentation, data flow clarity, component integration, and composition patterns.

## Overview

Integration Review evaluates how skills **work with other skills** and the broader ecosystem. It's especially important for workflow skills that compose multiple component skills.

**Automation**: 30% automated (dependency checking, cross-reference validation), 70% manual assessment

**Time**: 15-25 minutes (mostly manual)

**Applies Primarily To**:
- Workflow skills (compose other skills)
- Skills with dependencies (require other skills)
- Skills in skill ecosystem (reference other skills)

**Less Relevant For**:
- Standalone skills with no dependencies
- Simple single-purpose skills
- Reference/guidelines skills

## Dependency Documentation Assessment

### Types of Dependencies

**1. Required Dependencies**
- Skill MUST have these to function
- Should be in YAML `dependencies` field
- Must be documented in Prerequisites

**Example**:
```yaml
---
name: advanced-workflow
description: ...
dependencies:
  - skill-researcher
  - planning-architect
---
```

**2. Optional Dependencies**
- Skill can use these but not required
- Enhanced functionality with them
- Documented in content

**Example**: "Optional: Use testing-validator for validation"

**3. Complementary Skills**
- Related skills that work well together
- Often mentioned in integration notes
- Suggest for related workflows

**Example**: "Complementary: Use review-multi after development-workflow"

### Dependency Documentation Checklist

- [ ] Required dependencies in YAML `dependencies` field (if any)
- [ ] Required dependencies explained in Prerequisites section
- [ ] Optional dependencies mentioned in content
- [ ] Complementary skills noted (Integration Notes or Best Practices)
- [ ] Dependency versions specified (if version-sensitive)
- [ ] Clear what each dependency provides
- [ ] Installation/setup guidance for dependencies
- [ ] Fallback if dependency unavailable (if applicable)

---

## Data Flow Assessment (Workflow Skills)

### What is Data Flow?

**Definition**: How data/artifacts move between steps/skills in a workflow

**Components**:
- **Inputs**: What a step needs to start
- **Outputs**: What a step produces
- **Flow**: How outputs become inputs to next step

### Data Flow Documentation Standards

**For Each Workflow Step**:
```markdown
### Step N: [Action]

**Inputs**: [What you need from previous step]
- artifact-name.md from Step N-1
- configuration from Prerequisites

**Outputs**: [What this step produces]
- result-artifact.md: Description of artifact
- Updated state or configuration

[Step process...]
```

**Data Flow Diagram** (recommended for complex workflows):
```
Step 1 → output1.md → Step 2 → output2.md → Step 3
                         ↓
                    side-effect or state
```

### Data Flow Checklist

- [ ] Inputs documented for each step
- [ ] Outputs documented for each step
- [ ] Data flow between steps explained
- [ ] Artifacts named and described
- [ ] Flow diagram present (if complex)
- [ ] Users understand how data moves
- [ ] No missing links in flow
- [ ] State changes documented (if applicable)

### Examples: Good Data Flow Documentation

**Example 1**: development-workflow

```markdown
## Integration Notes

### Data Flow

```
skill-researcher
    ↓
research-synthesis.md → planning-architect
                            ↓
                    skill-architecture-plan.md → task-development
                                                      ↓
                                              task-breakdown.md → prompt-builder
                                                                      ↓
                                                          prompts-collection.md
```

### Skill Outputs

Each skill produces outputs consumed by the next:

1. **skill-researcher** → `research-synthesis.md`
   - Patterns, best practices, key findings

2. **planning-architect** → `skill-architecture-plan.md`
   - Structure, YAML frontmatter, progressive disclosure plan

[...]
```

**Why Excellent**:
- Clear diagram showing flow
- Each step's output named and described
- Users understand how artifacts connect
- Visual + textual explanation

---

## Component Integration Assessment

### Integration Methods

**Method 1: Guided Execution**
- Workflow instructs user to execute component skill
- User follows component skill, returns to workflow
- Workflow continues with outputs

**Example**:
```markdown
### Step 1: Research Domain

**Component Skill**: skill-researcher

**Integration**: Use skill-researcher for this step

**Process**:
1. Load skill-researcher
2. Follow Operation 5 (Synthesize Research)
3. Return here with research-synthesis.md

[Continue with outputs...]
```

**Method 2: Reference Integration**
- Skill points to another skill for guidance
- User consults other skill, applies here

**Example**:
```markdown
For detailed prompt engineering principles, see prompt-builder skill.

Apply those principles when creating prompts for [this use case]:
[Application guidance]
```

**Method 3: Template Integration**
- Component skill generates templates
- This skill uses those templates

**Example**:
```markdown
Use planning-architect to generate skill-architecture-plan.md, then use that plan as template for [this workflow step]
```

### Integration Quality Criteria

- [ ] Integration method clearly stated
- [ ] When to use component skill explained
- [ ] How to use component skill documented
- [ ] What to bring back from component skill specified
- [ ] Integration examples provided
- [ ] Smooth hand-off between skills

---

## Composition Patterns (Workflow Skills)

### Pattern 1: Sequential Pipeline

**Structure**: A → B → C (each step depends on previous)

**Characteristics**:
- Linear dependencies
- Each step requires previous outputs
- No parallelization

**Validation**:
- [ ] Dependencies clearly documented
- [ ] Output-to-input flow explained
- [ ] Sequential nature emphasized

**Example**: development-workflow (research → plan → tasks → prompts → tracking)

---

### Pattern 2: Parallel Fan-Out/Fan-In

**Structure**: A → (B + C) → D (parallel operations, then merge)

**Characteristics**:
- Independent parallel work
- Fan-out point documented
- Fan-in/merge point documented

**Validation**:
- [ ] Parallel operations identified
- [ ] Independence documented
- [ ] Merge process explained

---

### Pattern 3: Conditional Branching

**Structure**: A → [decision] → B or C

**Characteristics**:
- Decision point documented
- Conditional paths explained
- Criteria for choosing path

**Validation**:
- [ ] Decision criteria clear
- [ ] Each path documented
- [ ] Rejoining point explained (if applicable)

**Example**: development-workflow Step 3 optional (if complex → include, if simple → skip)

---

### Pattern 4: Iterative Loop

**Structure**: A → B → [check] → repeat or continue

**Characteristics**:
- Loop condition documented
- Exit criteria clear
- Iteration purpose explained

**Validation**:
- [ ] Loop condition documented
- [ ] Exit criteria clear
- [ ] Maximum iterations noted (if applicable)

---

## Cross-Reference Validation

### Internal References

**Types**:
- References to references/ files: `references/guide-name.md`
- References to scripts/ files: `scripts/script-name.py`
- References to sections: `## Section Name` or `### Subsection`

**Validation**:
- [ ] File references point to existing files
- [ ] Paths are correct (relative or absolute as appropriate)
- [ ] Section references match actual section names
- [ ] Links work (no broken links)

### External Skill References

**Types**:
- Required dependencies (must have)
- Optional dependencies (enhanced with)
- Complementary skills (work well with)

**Validation**:
- [ ] Skill names correct (match actual skill names)
- [ ] Skill references accurate (skill does what's claimed)
- [ ] Integration guidance provided
- [ ] Skills actually exist in ecosystem

---

## Integration Review Checklist

Complete checklist for Integration Review (Operation 5):

### Dependency Documentation
- [ ] Required dependencies documented
- [ ] YAML `dependencies` field used (if required dependencies exist)
- [ ] Optional dependencies mentioned
- [ ] Complementary skills noted
- [ ] Clear what each dependency provides

### Data Flow (Workflow Skills)
- [ ] Inputs documented for each step
- [ ] Outputs documented for each step
- [ ] Data flow explained or diagrammed
- [ ] Artifact names and descriptions provided
- [ ] Users understand how data moves

### Component Integration
- [ ] Integration method documented (guided/reference/template)
- [ ] Integration points clear
- [ ] Integration examples provided
- [ ] Hand-off process smooth

### Cross-References
- [ ] Internal references valid (files exist)
- [ ] External skill references correct
- [ ] Section references accurate
- [ ] No broken links

### Composition Pattern (Workflow Skills)
- [ ] Pattern identified (sequential/parallel/conditional/iterative)
- [ ] Pattern correctly implemented
- [ ] Orchestration details provided
- [ ] Diagram or visualization (if helpful)

### Calculate Score
- [ ] Count applicable checks passed (9 for workflow skills, 4-5 for simple skills)
- [ ] Apply rubric
- [ ] Assign score 1-5
- [ ] Document rationale

---

## Integration Scoring Examples

### Score 5: Excellent Integration

**Skill**: development-workflow (Workflow skill)

**Assessment**:
- ✅ Dependencies: 5 component skills perfectly documented
- ✅ Data flow: Diagram + detailed explanation
- ✅ Integration: Method documented for each step
- ✅ Cross-references: All valid
- ✅ Composition: Sequential pipeline, well-documented
- ✅ Complementary skills: 3 mentioned

**Score**: 5/5 (Excellent)

**Rationale**: Perfect integration documentation, exemplary for workflow skill

---

### Score 4: Good Integration

**Hypothetical Workflow Skill**: api-workflow

**Assessment**:
- ✅ Dependencies: 3 component skills documented
- ✅ Data flow: Explained in text (no diagram)
- ✅ Integration: Clear for each step
- ✅ Cross-references: All valid
- ✅ Composition: Sequential, documented
- ⚠️ Complementary skills: Not mentioned

**Score**: 4/5 (Good)

**Improvement**: Add diagram, mention complementary skills

---

### Score 3: Acceptable Integration

**Hypothetical Skill**: simple-helper (Standalone task skill)

**Assessment**:
- N/A Dependencies: None (standalone)
- N/A Data flow: Not applicable (task skill)
- N/A Integration: Not applicable
- ✅ Cross-references: Valid
- N/A Composition: Not applicable
- ⚠️ Complementary skills: Mentioned but not detailed

**Score**: 3/5 (Acceptable)

**Note**: For standalone task skill, many checks N/A, score based on applicable checks

**Improvement**: Provide more detail on complementary skills

---

## When Integration Review is Critical

### Workflow Skills (High Importance)

Workflow skills MUST have excellent integration:
- Document all component skills
- Explain data flow clearly
- Provide integration examples
- Diagram composition pattern

**Target Score**: ≥4 (workflows with poor integration are confusing)

### Skills with Dependencies (Medium Importance)

Skills requiring other skills must document:
- What dependencies needed
- Why needed
- How to use together

**Target Score**: ≥4

### Standalone Skills (Low Importance)

Simple standalone skills:
- May have few applicable checks
- Focus on cross-references valid
- Mention complementary if relevant

**Target Score**: ≥3 (many checks N/A)

---

## Conclusion

Integration Review ensures skills work well in the **ecosystem**:

1. **Dependencies**: Clearly documented
2. **Data Flow**: Explained for workflows
3. **Integration**: Clear connection points
4. **Cross-References**: Valid links
5. **Composition**: Patterns documented

**Most Critical For**: Workflow skills composing other skills

**Target**: Score ≥4 for workflow skills, ≥3 for standalone

**For scoring details**, see `scoring-rubric.md` Dimension 5.
