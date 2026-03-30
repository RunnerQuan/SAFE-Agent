#!/usr/bin/env python3
"""
Phase Manager for Inquiry Orchestration

Handles phase detection, validation, and transitions for INQ work items.
"""

import json
import sys
from datetime import date
from pathlib import Path
from typing import Optional

# Phase order and requirements
PHASES = ["research", "synthesis", "debate", "consensus", "completed"]

PHASE_ARTIFACTS = {
    "research": {"required": [], "produces": ["research/"]},
    "synthesis": {"required": ["research/"], "produces": ["SYNTHESIS.md"]},
    "debate": {"required": ["SYNTHESIS.md"], "produces": ["DEBATE.md"]},
    "consensus": {"required": ["DEBATE.md"], "produces": ["CONSENSUS.md"]},
    "completed": {"required": ["CONSENSUS.md"], "produces": []},
}


def load_inquiry(inquiry_path: Path) -> dict:
    """Load inquiry_report.json from the inquiry directory."""
    report_file = inquiry_path / "inquiry_report.json"
    if not report_file.exists():
        raise FileNotFoundError(f"inquiry_report.json not found at {report_file}")

    with open(report_file) as f:
        return json.load(f)


def save_inquiry(inquiry_path: Path, data: dict) -> None:
    """Save inquiry_report.json to the inquiry directory."""
    report_file = inquiry_path / "inquiry_report.json"
    data["updated_date"] = date.today().isoformat()

    with open(report_file, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def detect_phase(inquiry_path: Path, report: dict) -> str:
    """
    Detect the current phase based on existing artifacts.

    Returns the phase that should be executed next.
    """
    current_phase = report.get("phase", "research")
    status = report.get("status", "new")

    # If new, start with research
    if status == "new":
        return "research"

    # If completed or cancelled, no phase to execute
    if status in ["completed", "cancelled"]:
        return status

    # Check artifact-based detection
    # If we have CONSENSUS.md, we're done
    if (inquiry_path / "CONSENSUS.md").exists():
        return "completed"

    # If we have DEBATE.md, proceed to consensus
    if (inquiry_path / "DEBATE.md").exists():
        return "consensus"

    # If we have SYNTHESIS.md, proceed to debate
    if (inquiry_path / "SYNTHESIS.md").exists():
        return "debate"

    # If we have research outputs, proceed to synthesis
    research_dir = inquiry_path / "research"
    if research_dir.exists():
        research_files = list(research_dir.glob("agent-*.md"))
        if research_files:
            return "synthesis"

    # Default to research
    return "research"


def validate_phase_requirements(inquiry_path: Path, phase: str) -> tuple[bool, list[str]]:
    """
    Validate that all requirements for a phase are met.

    Returns (is_valid, list_of_missing_artifacts).
    """
    requirements = PHASE_ARTIFACTS.get(phase, {}).get("required", [])
    missing = []

    for req in requirements:
        if req.endswith("/"):
            # Directory requirement
            dir_path = inquiry_path / req.rstrip("/")
            if not dir_path.exists() or not list(dir_path.glob("agent-*.md")):
                missing.append(req)
        else:
            # File requirement
            if not (inquiry_path / req).exists():
                missing.append(req)

    return len(missing) == 0, missing


def transition_phase(inquiry_path: Path, from_phase: str, to_phase: str, notes: str = "") -> dict:
    """
    Transition the inquiry from one phase to another.

    Updates inquiry_report.json with new phase and history.
    """
    report = load_inquiry(inquiry_path)

    # Update phase and status
    report["phase"] = to_phase
    report["status"] = to_phase

    # Add to phase history
    if "phase_history" not in report:
        report["phase_history"] = []

    report["phase_history"].append({
        "phase": to_phase,
        "entered_date": date.today().isoformat(),
        "notes": notes or f"Transitioned from {from_phase}"
    })

    save_inquiry(inquiry_path, report)
    return report


def get_next_phase(current_phase: str) -> Optional[str]:
    """Get the next phase in the sequence."""
    try:
        idx = PHASES.index(current_phase)
        if idx < len(PHASES) - 1:
            return PHASES[idx + 1]
    except ValueError:
        pass
    return None


def get_research_agent_count(inquiry_path: Path) -> int:
    """Get the number of research agents configured."""
    report = load_inquiry(inquiry_path)
    return report.get("research_agents", 3)


def count_completed_research(inquiry_path: Path) -> tuple[int, int]:
    """
    Count completed research reports.

    Returns (completed_count, expected_count).
    """
    expected = get_research_agent_count(inquiry_path)
    research_dir = inquiry_path / "research"

    if not research_dir.exists():
        return 0, expected

    completed = len(list(research_dir.glob("agent-*.md")))
    return completed, expected


def get_phase_status(inquiry_path: Path) -> dict:
    """
    Get comprehensive status of the inquiry.

    Returns dict with phase info, artifacts, and readiness.
    """
    report = load_inquiry(inquiry_path)
    detected_phase = detect_phase(inquiry_path, report)
    is_valid, missing = validate_phase_requirements(inquiry_path, detected_phase)
    completed_research, expected_research = count_completed_research(inquiry_path)

    return {
        "inquiry_id": report.get("inquiry_id"),
        "title": report.get("title"),
        "recorded_phase": report.get("phase"),
        "detected_phase": detected_phase,
        "phase_match": report.get("phase") == detected_phase,
        "requirements_met": is_valid,
        "missing_artifacts": missing,
        "research_agents": {
            "completed": completed_research,
            "expected": expected_research,
            "all_complete": completed_research >= expected_research
        },
        "artifacts": {
            "research/": (inquiry_path / "research").exists(),
            "SUMMARY.md": (inquiry_path / "SUMMARY.md").exists(),
            "SYNTHESIS.md": (inquiry_path / "SYNTHESIS.md").exists(),
            "DEBATE.md": (inquiry_path / "DEBATE.md").exists(),
            "CONSENSUS.md": (inquiry_path / "CONSENSUS.md").exists(),
        }
    }


def find_inquiry(identifier: str, search_paths: Optional[list[str]] = None) -> Optional[Path]:
    """
    Find an inquiry directory by ID or path.

    Searches in:
    1. Direct path if provided
    2. feature-management/inquiries/
    3. inquiries/
    4. Current directory
    """
    # Direct path
    direct = Path(identifier)
    if direct.exists() and (direct / "inquiry_report.json").exists():
        return direct

    # Search paths
    if search_paths is None:
        search_paths = [
            "feature-management/inquiries",
            "inquiries",
            "."
        ]

    for base in search_paths:
        base_path = Path(base)
        if not base_path.exists():
            continue

        # Try exact match
        exact = base_path / identifier
        if exact.exists() and (exact / "inquiry_report.json").exists():
            return exact

        # Try prefix match (INQ-001 matches INQ-001-topic-name)
        for subdir in base_path.iterdir():
            if subdir.is_dir() and subdir.name.startswith(identifier):
                if (subdir / "inquiry_report.json").exists():
                    return subdir

    return None


def main():
    """CLI interface for phase management."""
    import argparse

    parser = argparse.ArgumentParser(description="Inquiry Phase Manager")
    parser.add_argument("inquiry", help="Inquiry ID or path")
    parser.add_argument("--action", choices=["detect", "status", "transition", "validate"],
                        default="status", help="Action to perform")
    parser.add_argument("--to-phase", help="Target phase for transition")
    parser.add_argument("--notes", help="Notes for phase transition")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    # Find inquiry
    inquiry_path = find_inquiry(args.inquiry)
    if not inquiry_path:
        print(f"Error: Could not find inquiry '{args.inquiry}'", file=sys.stderr)
        sys.exit(1)

    try:
        if args.action == "detect":
            report = load_inquiry(inquiry_path)
            phase = detect_phase(inquiry_path, report)
            if args.json:
                print(json.dumps({"phase": phase}))
            else:
                print(phase)

        elif args.action == "status":
            status = get_phase_status(inquiry_path)
            if args.json:
                print(json.dumps(status, indent=2))
            else:
                print(f"Inquiry: {status['inquiry_id']} - {status['title']}")
                print(f"Recorded Phase: {status['recorded_phase']}")
                print(f"Detected Phase: {status['detected_phase']}")
                print(f"Requirements Met: {status['requirements_met']}")
                if status['missing_artifacts']:
                    print(f"Missing: {', '.join(status['missing_artifacts'])}")
                print(f"Research: {status['research_agents']['completed']}/{status['research_agents']['expected']}")
                print("\nArtifacts:")
                for artifact, exists in status['artifacts'].items():
                    mark = "✓" if exists else "✗"
                    print(f"  {mark} {artifact}")

        elif args.action == "validate":
            report = load_inquiry(inquiry_path)
            phase = args.to_phase or detect_phase(inquiry_path, report)
            is_valid, missing = validate_phase_requirements(inquiry_path, phase)
            if args.json:
                print(json.dumps({"valid": is_valid, "missing": missing, "phase": phase}))
            else:
                if is_valid:
                    print(f"Phase '{phase}' requirements met")
                else:
                    print(f"Phase '{phase}' missing: {', '.join(missing)}")
            sys.exit(0 if is_valid else 1)

        elif args.action == "transition":
            if not args.to_phase:
                print("Error: --to-phase required for transition", file=sys.stderr)
                sys.exit(1)

            report = load_inquiry(inquiry_path)
            from_phase = report.get("phase", "research")

            # Validate transition
            is_valid, missing = validate_phase_requirements(inquiry_path, args.to_phase)
            if not is_valid:
                print(f"Error: Cannot transition to '{args.to_phase}', missing: {', '.join(missing)}",
                      file=sys.stderr)
                sys.exit(1)

            new_report = transition_phase(inquiry_path, from_phase, args.to_phase, args.notes)
            if args.json:
                print(json.dumps({"success": True, "from": from_phase, "to": args.to_phase}))
            else:
                print(f"Transitioned from '{from_phase}' to '{args.to_phase}'")

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in inquiry_report.json: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
