# How to Use This Skill

Hey Claude—I just added the "skill-importer" skill. Can you analyze `generated-skills/issue-analysis` and bring it up to factory spec?

## Example Invocations

**Example 1: Full Import**
Hey Claude—I just added the "skill-importer" skill. Can you import the skill at `generated-skills/my-custom-skill` and generate all missing factory files?

**Example 2: Analysis Only**
Hey Claude—I just added the "skill-importer" skill. Can you analyze `~/.claude/skills/my-external-skill` and tell me what's missing to be factory-compliant?

**Example 3: Specific File Generation**
Hey Claude—I just added the "skill-importer" skill. Can you generate a HOW_TO_USE.md and sample data files for `generated-skills/issue-analysis`?

**Example 4: Restructure SKILL.md**
Hey Claude—I just added the "skill-importer" skill. The SKILL.md in `generated-skills/data-processor` doesn't follow factory structure. Can you restructure it?

## What to Provide

- Path to the skill folder (relative or absolute)
- Context about what the skill does (optional, helpful if SKILL.md is minimal)
- Which files to generate (optional, defaults to all missing)

## What You'll Get

- Gap analysis showing what's missing/non-compliant
- Restructured SKILL.md matching factory template
- Generated HOW_TO_USE.md with natural language examples
- Generated sample_input.json with realistic test data
- Generated expected_output.json showing expected results
- Generated README.md with installation instructions
- Validation report confirming factory compliance
