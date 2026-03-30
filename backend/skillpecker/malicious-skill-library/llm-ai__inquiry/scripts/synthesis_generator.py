#!/usr/bin/env python3
"""
Synthesis Generator for Inquiry Orchestration

Generates synthesis prompts and documents for Phase 2.
"""

import json
import sys
from datetime import date
from pathlib import Path
from typing import Optional

from .phase_manager import load_inquiry, find_inquiry


SYNTHESIS_PROMPT_TEMPLATE = """# Synthesis Agent - Consolidate Research Findings

## Task

You are the Synthesis Agent for **{title}**.

Your task is to consolidate all independent research reports into a unified synthesis document. This synthesis will inform the debate phase where key decisions will be made.

## Core Question

{question}

## Context

{context}

## Constraints

The following constraints MUST be satisfied by any proposed solution:

{constraints}

## Research Reports

{research_reports}

## Summary Analysis

{summary_content}

## Instructions

1. **Identify Common Themes**: What patterns emerge across multiple agents?
2. **Note Areas of Agreement**: Where do agents converge on similar conclusions?
3. **Highlight Disagreements**: Where do agents have conflicting views?
4. **Extract Decision Points**: What key decisions need to be made?
5. **Consolidate Evidence**: Gather the strongest evidence from all reports
6. **Prepare for Debate**: Frame questions that need adversarial analysis

## Output Format

Create `SYNTHESIS.md` with the following structure:

```markdown
# Synthesis: {title}

## Executive Summary
[2-3 paragraph overview of consolidated findings]

## Common Themes

### Theme 1: [Name]
[Description with supporting agents]

### Theme 2: [Name]
[Description with supporting agents]

## Areas of Agreement

| Topic | Consensus View | Supporting Agents | Confidence |
|-------|----------------|-------------------|------------|
| ... | ... | ... | High/Medium/Low |

## Areas of Disagreement

| Topic | Position A | Position B | Agents A | Agents B |
|-------|------------|------------|----------|----------|
| ... | ... | ... | 1,2 | 3 |

## Key Decision Points

### Decision 1: [Topic]
**Question**: [What needs to be decided?]
**Options**:
- Option A: [Description]
- Option B: [Description]
**Implications**: [Why this matters]

## Consolidated Evidence

### For [Topic/Approach]
- [Evidence 1 - Agent N]
- [Evidence 2 - Agent N]

### Against [Topic/Approach]
- [Evidence 1 - Agent N]

## Questions for Debate

1. [Question arising from disagreement]
2. [Question requiring deeper analysis]
3. [Question about trade-offs]

## Research Quality Assessment

| Agent | Thoroughness | Evidence Quality | Unique Insights |
|-------|--------------|------------------|-----------------|
| 1 | High/Medium/Low | ... | ... |

## Synthesis Confidence

**Overall Confidence**: [High/Medium/Low]
**Areas of Uncertainty**: [List areas needing more exploration]

---
*Synthesized from {agent_count} research reports on {date}*
```

## Important Notes

- Be objective in presenting all perspectives
- Do not favor any position; that's for the debate phase
- Flag any areas where research was insufficient
- Note if any constraints are potentially in conflict
"""


def load_research_reports(inquiry_path: Path) -> list[dict]:
    """Load all research reports from the research/ directory."""
    research_dir = inquiry_path / "research"
    reports = []

    if not research_dir.exists():
        return reports

    for report_file in sorted(research_dir.glob("agent-*.md")):
        agent_num = report_file.stem.replace("agent-", "")
        content = report_file.read_text()
        reports.append({
            "agent_number": agent_num,
            "filename": report_file.name,
            "content": content
        })

    return reports


def load_summary(inquiry_path: Path) -> str:
    """Load the SUMMARY.md file if it exists."""
    summary_file = inquiry_path / "SUMMARY.md"
    if summary_file.exists():
        return summary_file.read_text()
    return "*No summary available - will be generated during synthesis*"


def format_constraints(constraints: list[str]) -> str:
    """Format constraints as a bulleted list."""
    if not constraints:
        return "*No constraints specified*"
    return "\n".join(f"- {c}" for c in constraints)


def format_research_reports(reports: list[dict]) -> str:
    """Format research reports for inclusion in prompt."""
    if not reports:
        return "*No research reports found*"

    formatted = []
    for report in reports:
        formatted.append(f"""
### Agent {report['agent_number']} Report

```markdown
{report['content'][:5000]}
{"[... truncated ...]" if len(report['content']) > 5000 else ""}
```
""")

    return "\n".join(formatted)


def generate_synthesis_prompt(inquiry_path: Path) -> str:
    """Generate the synthesis phase prompt."""
    report = load_inquiry(inquiry_path)
    research_reports = load_research_reports(inquiry_path)
    summary = load_summary(inquiry_path)

    return SYNTHESIS_PROMPT_TEMPLATE.format(
        title=report.get("title", "Untitled Inquiry"),
        question=report.get("question", "No question specified"),
        context=report.get("context", "No context provided"),
        constraints=format_constraints(report.get("constraints", [])),
        research_reports=format_research_reports(research_reports),
        summary_content=summary,
        agent_count=len(research_reports),
        date=date.today().isoformat()
    )


def create_synthesis_template(inquiry_path: Path) -> str:
    """Create an empty synthesis template for manual completion."""
    report = load_inquiry(inquiry_path)
    research_reports = load_research_reports(inquiry_path)

    agents_table = ""
    for r in research_reports:
        agents_table += f"| {r['agent_number']} | | | |\n"

    return f"""# Synthesis: {report.get('title', 'Untitled')}

## Executive Summary

[Provide 2-3 paragraph overview of consolidated findings]

## Common Themes

### Theme 1: [Name]

[Description with supporting agents]

### Theme 2: [Name]

[Description with supporting agents]

## Areas of Agreement

| Topic | Consensus View | Supporting Agents | Confidence |
|-------|----------------|-------------------|------------|
| | | | |

## Areas of Disagreement

| Topic | Position A | Position B | Agents A | Agents B |
|-------|------------|------------|----------|----------|
| | | | | |

## Key Decision Points

### Decision 1: [Topic]

**Question**: [What needs to be decided?]

**Options**:
- Option A: [Description]
- Option B: [Description]

**Implications**: [Why this matters]

## Consolidated Evidence

### For [Topic/Approach]

- [Evidence 1 - Source]
- [Evidence 2 - Source]

### Against [Topic/Approach]

- [Evidence 1 - Source]

## Questions for Debate

1. [Question arising from disagreement]
2. [Question requiring deeper analysis]
3. [Question about trade-offs]

## Research Quality Assessment

| Agent | Thoroughness | Evidence Quality | Unique Insights |
|-------|--------------|------------------|-----------------|
{agents_table}

## Synthesis Confidence

**Overall Confidence**: [High/Medium/Low]

**Areas of Uncertainty**:
- [Area 1]
- [Area 2]

---
*Synthesized from {len(research_reports)} research reports on {date.today().isoformat()}*
*Source Inquiry: {report.get('inquiry_id', 'Unknown')}*
"""


def main():
    """CLI interface for synthesis generation."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate synthesis prompts and templates")
    parser.add_argument("inquiry", help="Inquiry ID or path")
    parser.add_argument("--output", choices=["prompt", "template", "both"],
                        default="prompt", help="What to generate")
    parser.add_argument("--write", action="store_true",
                        help="Write template to SYNTHESIS.md (only with --output template)")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    inquiry_path = find_inquiry(args.inquiry)
    if not inquiry_path:
        print(f"Error: Could not find inquiry '{args.inquiry}'", file=sys.stderr)
        sys.exit(1)

    try:
        if args.output == "prompt":
            prompt = generate_synthesis_prompt(inquiry_path)
            if args.json:
                print(json.dumps({"prompt": prompt}))
            else:
                print(prompt)

        elif args.output == "template":
            template = create_synthesis_template(inquiry_path)
            if args.write:
                synthesis_file = inquiry_path / "SYNTHESIS.md"
                synthesis_file.write_text(template)
                if args.json:
                    print(json.dumps({"success": True, "file": str(synthesis_file)}))
                else:
                    print(f"Template written to {synthesis_file}")
            else:
                if args.json:
                    print(json.dumps({"template": template}))
                else:
                    print(template)

        elif args.output == "both":
            prompt = generate_synthesis_prompt(inquiry_path)
            template = create_synthesis_template(inquiry_path)
            if args.json:
                print(json.dumps({"prompt": prompt, "template": template}))
            else:
                print("=== SYNTHESIS PROMPT ===\n")
                print(prompt)
                print("\n=== SYNTHESIS TEMPLATE ===\n")
                print(template)

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
