#!/usr/bin/env python3
"""
Debate Structurer for Inquiry Orchestration

Generates debate prompts and structures for Phase 3.
"""

import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Optional

from .phase_manager import load_inquiry, find_inquiry


ADVOCATE_PROMPT_TEMPLATE = """# Debate Advocate - {position_name}

## Role

You are **Advocate {advocate_id}** in the structured debate for **{title}**.

Your task is to argue strongly for **Position {position}**: {position_description}

## Rules of Engagement

1. **Argue your position convincingly** - Present the strongest case
2. **Use evidence from research** - Reference specific findings
3. **Acknowledge weaknesses** - Note where your position is vulnerable
4. **Stay within constraints** - Your arguments must respect stated constraints
5. **Be specific** - Avoid vague claims; provide concrete reasoning

## Core Question

{question}

## Your Position

**Position {position}**: {position_description}

You are arguing that this is the best approach because:
{position_rationale}

## Context

{context}

## Constraints to Respect

{constraints}

## Evidence Available

### Supporting Your Position
{supporting_evidence}

### Challenging Your Position
{challenging_evidence}

## Instructions

Structure your argument as follows:

```markdown
## Opening Statement

[2-3 paragraphs presenting your core argument]

## Key Arguments

### Argument 1: [Title]

**Claim**: [Clear statement]
**Reasoning**: [Logic behind the claim]
**Evidence**: [Supporting data from research]
**Constraint Alignment**: [How this respects constraints]

### Argument 2: [Title]

[Same structure]

### Argument 3: [Title]

[Same structure]

## Addressing Counter-Arguments

### Anticipated Objection 1: [Objection]

**Response**: [How you address this]

### Anticipated Objection 2: [Objection]

**Response**: [How you address this]

## Closing Statement

[Summary of why your position should prevail]

## Confidence Assessment

**Strength of Position**: [Strong/Moderate/Weak]
**Key Vulnerabilities**: [List main weaknesses]
```

## Important

- Do NOT be neutral - advocate strongly for your assigned position
- This is structured debate, not consensus-building
- Your arguments will be challenged by the opposing advocate
"""


DEBATE_TEMPLATE = """# Debate: {title}

**Inquiry**: {inquiry_id}
**Date**: {date}
**Phase**: 3 - Structured Debate

## Overview

This document records the structured debate on key decision points identified during synthesis. Each decision point features advocates arguing opposing positions, followed by resolution.

## Decision Points

{decision_points_content}

## Debate Summary

### Resolutions

| Decision Point | Resolution | Confidence | Dissent |
|----------------|------------|------------|---------|
{resolutions_table}

### Key Insights from Debate

1. [Insight from argumentation]
2. [Insight from argumentation]

### Remaining Uncertainties

- [Uncertainty not fully resolved]
- [Area requiring further investigation]

---
*Debate conducted on {date}*
*Source Inquiry: {inquiry_id}*
"""


DECISION_POINT_TEMPLATE = """
### Decision Point {num}: {topic}

**Question**: {question}

---

#### Position A: {position_a}

**Advocate**: Agent A

**Opening Statement**:
[Advocate A's opening]

**Key Arguments**:
1. [Argument 1]
2. [Argument 2]
3. [Argument 3]

**Evidence**:
- [Evidence point]

---

#### Position B: {position_b}

**Advocate**: Agent B

**Opening Statement**:
[Advocate B's opening]

**Key Arguments**:
1. [Argument 1]
2. [Argument 2]
3. [Argument 3]

**Evidence**:
- [Evidence point]

---

#### Rebuttal Round

**Agent A Response to Position B**:
[Response to B's arguments]

**Agent B Response to Position A**:
[Response to A's arguments]

---

#### Resolution

**Prevailing Position**: [A or B or Hybrid]

**Rationale**:
[Why this position was selected]

**Key Factors**:
- [Factor 1]
- [Factor 2]

**Confidence**: [High/Medium/Low]

**Dissenting View**:
[Note any valid points from the non-prevailing position to consider]
"""


def parse_synthesis_disagreements(synthesis_path: Path) -> list[dict]:
    """
    Parse SYNTHESIS.md to extract areas of disagreement for debate.

    Returns list of decision points with positions.
    """
    if not synthesis_path.exists():
        return []

    content = synthesis_path.read_text()
    decision_points = []

    # Look for "Areas of Disagreement" section
    disagreement_match = re.search(
        r'## Areas of Disagreement\s*\n(.*?)(?=\n## |\Z)',
        content,
        re.DOTALL
    )

    if disagreement_match:
        section = disagreement_match.group(1)
        # Parse table rows
        rows = re.findall(r'\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|', section)
        for i, row in enumerate(rows[1:], 1):  # Skip header
            if row[0].strip() and row[0].strip() != '---':
                decision_points.append({
                    "num": i,
                    "topic": row[0].strip(),
                    "position_a": row[1].strip(),
                    "position_b": row[2].strip(),
                })

    # Also look for "Key Decision Points" section
    decision_match = re.search(
        r'## Key Decision Points\s*\n(.*?)(?=\n## |\Z)',
        content,
        re.DOTALL
    )

    if decision_match:
        section = decision_match.group(1)
        # Parse decision point subsections
        decisions = re.findall(
            r'### Decision \d+:\s*([^\n]+)\s*\n.*?'
            r'\*\*Question\*\*:\s*([^\n]+)',
            section,
            re.DOTALL
        )
        for i, (topic, question) in enumerate(decisions, len(decision_points) + 1):
            if not any(dp["topic"] == topic.strip() for dp in decision_points):
                decision_points.append({
                    "num": i,
                    "topic": topic.strip(),
                    "question": question.strip(),
                    "position_a": "[Needs definition]",
                    "position_b": "[Needs definition]",
                })

    return decision_points


def generate_advocate_prompt(
    inquiry_path: Path,
    position: str,
    position_description: str,
    position_rationale: str = "",
    advocate_id: str = "A"
) -> str:
    """Generate a prompt for a debate advocate."""
    report = load_inquiry(inquiry_path)

    constraints = report.get("constraints", [])
    constraints_text = "\n".join(f"- {c}" for c in constraints) if constraints else "*None specified*"

    return ADVOCATE_PROMPT_TEMPLATE.format(
        position_name=f"Position {advocate_id}",
        advocate_id=advocate_id,
        title=report.get("title", "Untitled"),
        position=advocate_id,
        position_description=position_description,
        position_rationale=position_rationale or "See supporting evidence below",
        question=report.get("question", "No question specified"),
        context=report.get("context", "No context provided"),
        constraints=constraints_text,
        supporting_evidence="[Extract from synthesis]",
        challenging_evidence="[Extract from synthesis]"
    )


def create_debate_template(inquiry_path: Path) -> str:
    """Create a debate document template from synthesis."""
    report = load_inquiry(inquiry_path)
    synthesis_path = inquiry_path / "SYNTHESIS.md"
    decision_points = parse_synthesis_disagreements(synthesis_path)

    # Generate decision point sections
    decision_content = ""
    resolutions_rows = ""

    if decision_points:
        for dp in decision_points:
            decision_content += DECISION_POINT_TEMPLATE.format(
                num=dp["num"],
                topic=dp["topic"],
                question=dp.get("question", f"What is the best approach for {dp['topic']}?"),
                position_a=dp["position_a"],
                position_b=dp["position_b"]
            )
            resolutions_rows += f"| {dp['topic']} | | | |\n"
    else:
        decision_content = """
### Decision Point 1: [Topic]

**Question**: [What needs to be decided?]

[Complete structure for Position A and Position B]
"""
        resolutions_rows = "| [Topic] | | | |\n"

    return DEBATE_TEMPLATE.format(
        title=report.get("title", "Untitled"),
        inquiry_id=report.get("inquiry_id", "Unknown"),
        date=date.today().isoformat(),
        decision_points_content=decision_content,
        resolutions_table=resolutions_rows
    )


def main():
    """CLI interface for debate structuring."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate debate structure and prompts")
    parser.add_argument("inquiry", help="Inquiry ID or path")
    parser.add_argument("--output", choices=["template", "advocate", "analysis"],
                        default="template", help="What to generate")
    parser.add_argument("--position", help="Position for advocate prompt (A or B)")
    parser.add_argument("--position-desc", help="Position description")
    parser.add_argument("--write", action="store_true",
                        help="Write template to DEBATE.md")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    inquiry_path = find_inquiry(args.inquiry)
    if not inquiry_path:
        print(f"Error: Could not find inquiry '{args.inquiry}'", file=sys.stderr)
        sys.exit(1)

    try:
        if args.output == "template":
            template = create_debate_template(inquiry_path)
            if args.write:
                debate_file = inquiry_path / "DEBATE.md"
                debate_file.write_text(template)
                if args.json:
                    print(json.dumps({"success": True, "file": str(debate_file)}))
                else:
                    print(f"Template written to {debate_file}")
            else:
                if args.json:
                    print(json.dumps({"template": template}))
                else:
                    print(template)

        elif args.output == "advocate":
            if not args.position:
                print("Error: --position required for advocate prompt", file=sys.stderr)
                sys.exit(1)

            prompt = generate_advocate_prompt(
                inquiry_path,
                args.position,
                args.position_desc or f"Position {args.position}"
            )
            if args.json:
                print(json.dumps({"prompt": prompt}))
            else:
                print(prompt)

        elif args.output == "analysis":
            synthesis_path = inquiry_path / "SYNTHESIS.md"
            decision_points = parse_synthesis_disagreements(synthesis_path)
            if args.json:
                print(json.dumps({
                    "decision_points": decision_points,
                    "count": len(decision_points)
                }, indent=2))
            else:
                print(f"Found {len(decision_points)} decision points for debate:\n")
                for dp in decision_points:
                    print(f"  {dp['num']}. {dp['topic']}")
                    print(f"     Position A: {dp['position_a']}")
                    print(f"     Position B: {dp['position_b']}\n")

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
