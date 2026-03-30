#!/usr/bin/env python3
"""
Orchestrate comprehensive skill reviews.

Coordinates automated validation, manual assessments, score aggregation,
and report generation for complete multi-dimensional reviews.

Usage:
    python3 review-runner.py <skill_path> [--mode comprehensive|fast|custom] [--output report.md]

Examples:
    python3 review-runner.py .claude/skills/my-skill
    python3 review-runner.py /path/to/skill --mode comprehensive --output review-report.md
    python3 review-runner.py ./skill --mode fast

Exit Codes:
    0: Review completed successfully
    1: Review completed with failures
    2: ERROR (exception occurred)
"""

import sys
import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List


class ReviewOrchestrator:
    """Orchestrates comprehensive skill reviews."""

    def __init__(self, skill_path: str, mode: str = 'comprehensive'):
        """
        Initialize orchestrator.

        Args:
            skill_path: Path to skill directory
            mode: Review mode (comprehensive/fast/custom)
        """
        self.skill_path = Path(skill_path).resolve()
        self.mode = mode
        self.scripts_dir = Path(__file__).parent
        self.results = {
            'skill_name': self.skill_path.name,
            'skill_path': str(self.skill_path),
            'review_date': datetime.now().strftime('%Y-%m-%d'),
            'review_mode': mode,
            'dimensions': {},
            'recommendations': [],
            'overall_score': 0.0,
            'grade': 'F',
            'readiness': 'Not Ready'
        }

        if not self.skill_path.exists():
            raise FileNotFoundError(f"Skill directory not found: {self.skill_path}")

    def run_structure_validation(self) -> Dict:
        """
        Run automated structure validation.

        Returns:
            Structure validation results
        """
        print("\n" + "="*60)
        print("Running Operation 1: Structure Review (Automated)")
        print("="*60 + "\n")

        script = self.scripts_dir / "validate-structure.py"

        try:
            result = subprocess.run(
                [sys.executable, str(script), str(self.skill_path), '--json'],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.stdout:
                data = json.loads(result.stdout)
                score = data.get('score', 0)

                # Print summary
                status = "✅ PASS" if result.returncode == 0 else "❌ FAIL"
                print(f"{status} - Structure Score: {score}/5")

                if data.get('issues'):
                    print(f"Issues found: {len(data['issues'])}")
                    for issue in data['issues'][:5]:  # Show first 5
                        print(f"  - {issue}")

                print(f"\nTime: ~5-10 minutes (automated)")

                return {
                    'score': score,
                    'issues': data.get('issues', []),
                    'status': 'pass' if result.returncode == 0 else 'fail'
                }

        except subprocess.TimeoutExpired:
            print("ERROR: Structure validation timed out")
        except json.JSONDecodeError:
            print(f"ERROR: Could not parse validation output")
        except Exception as e:
            print(f"ERROR: {e}")

        return {'score': 0, 'issues': ['Validation failed'], 'status': 'error'}

    def run_pattern_analysis(self) -> Dict:
        """
        Run pattern compliance check.

        Returns:
            Pattern analysis results
        """
        print("\n" + "="*60)
        print("Running Quality Review: Pattern Analysis (Automated)")
        print("="*60 + "\n")

        script = self.scripts_dir / "check-patterns.py"

        try:
            result = subprocess.run(
                [sys.executable, str(script), str(self.skill_path), '--json'],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.stdout:
                data = json.loads(result.stdout)

                # Print summary
                pattern = data.get('pattern_detected', 'unknown')
                print(f"Pattern Detected: {pattern.upper()}")

                if data.get('anti_patterns'):
                    print(f"\n❌ Anti-Patterns Found: {len(data['anti_patterns'])}")
                    for ap in data['anti_patterns'][:3]:  # Show first 3
                        print(f"  - {ap['name']} ({ap['severity']}): {ap['evidence']}")
                else:
                    print("\n✅ No anti-patterns detected")

                print(f"\nTime: ~10 minutes (automated)")

                return data

        except Exception as e:
            print(f"ERROR: {e}")

        return {'anti_patterns': [], 'best_practices': {}}

    def prompt_manual_review(self, dimension: str, operation_number: int) -> Dict:
        """
        Prompt user for manual review assessment.

        Args:
            dimension: Dimension name (content/quality/usability/integration)
            operation_number: Operation number (2-5)

        Returns:
            Manual review results
        """
        print("\n" + "="*60)
        print(f"Operation {operation_number}: {dimension.title()} Review (Manual)")
        print("="*60 + "\n")

        print(f"Please conduct {dimension} review manually following SKILL.md Operation {operation_number}.")
        print(f"Refer to references/{dimension}-review-guide.md for detailed guidance.")
        print("")

        # Prompt for score
        while True:
            try:
                score_input = input(f"Enter {dimension} score (1-5): ").strip()
                score = int(score_input)
                if 1 <= score <= 5:
                    break
                print("Score must be 1-5")
            except ValueError:
                print("Please enter a number 1-5")
            except KeyboardInterrupt:
                print("\nReview cancelled")
                sys.exit(1)

        # Prompt for issues (optional)
        print(f"\nAny issues found? (Enter issues one per line, empty line when done):")
        issues = []
        while True:
            try:
                issue = input("> ").strip()
                if not issue:
                    break
                issues.append(issue)
            except KeyboardInterrupt:
                print("\nReview cancelled")
                sys.exit(1)

        print(f"\n✅ {dimension.title()} Review Complete - Score: {score}/5")

        return {
            'score': score,
            'issues': issues,
            'status': 'complete'
        }

    def run_comprehensive_review(self) -> Dict:
        """
        Run comprehensive review (all 5 dimensions).

        Returns:
            Complete review results
        """
        print("\n" + "="*60)
        print("COMPREHENSIVE REVIEW MODE")
        print("="*60)
        print(f"Skill: {self.skill_path.name}")
        print(f"Estimated Time: 1.5-2.5 hours")
        print("")

        # Operation 1: Structure (automated)
        structure_results = self.run_structure_validation()
        self.results['dimensions']['structure'] = structure_results

        # Operation 2: Content (manual)
        content_results = self.prompt_manual_review('content', 2)
        self.results['dimensions']['content'] = content_results

        # Operation 3: Quality (mixed - already have pattern analysis)
        quality_results = self.prompt_manual_review('quality', 3)
        self.results['dimensions']['quality'] = quality_results

        # Operation 4: Usability (manual - most critical)
        print("\n⚠️  USABILITY REVIEW REQUIRES REAL TESTING")
        print("You must actually use the skill in a real scenario (not just read it)")
        print("See references/usability-review-guide.md for methodology\n")

        usability_results = self.prompt_manual_review('usability', 4)
        self.results['dimensions']['usability'] = usability_results

        # Operation 5: Integration (manual)
        integration_results = self.prompt_manual_review('integration', 5)
        self.results['dimensions']['integration'] = integration_results

        return self.results

    def run_fast_check(self) -> Dict:
        """
        Run fast check (automated only).

        Returns:
            Fast check results
        """
        print("\n" + "="*60)
        print("FAST CHECK MODE (Automated Only)")
        print("="*60)
        print(f"Skill: {self.skill_path.name}")
        print(f"Estimated Time: 5-10 minutes")
        print("")

        # Run structure validation only
        structure_results = self.run_structure_validation()
        self.results['dimensions']['structure'] = structure_results

        # Fast check = structure only
        if structure_results['score'] >= 4:
            print("\n✅ FAST CHECK PASSED")
            print("Structure validation successful - proceed with development")
        else:
            print("\n❌ FAST CHECK FAILED")
            print("Fix structural issues before continuing")

        return self.results

    def save_report(self, output_path: str) -> None:
        """
        Generate and save report.

        Args:
            output_path: Path to save report
        """
        # Save raw data as JSON
        data_path = Path(output_path).with_suffix('.json')
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2)

        print(f"\nReview data saved: {data_path}")

        # Generate formatted report if output is .md
        if output_path.endswith('.md'):
            report_script = self.scripts_dir / "generate-review-report.py"
            try:
                subprocess.run(
                    [sys.executable, str(report_script), str(data_path), '--output', output_path],
                    check=True
                )
                print(f"Formatted report saved: {output_path}")
            except Exception as e:
                print(f"Warning: Could not generate formatted report: {e}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Orchestrate comprehensive skill reviews',
        epilog='Coordinates validation, assessments, scoring, and reporting'
    )
    parser.add_argument('skill_path', help='Path to skill directory')
    parser.add_argument('--mode', choices=['comprehensive', 'fast', 'custom'],
                       default='comprehensive',
                       help='Review mode (default: comprehensive)')
    parser.add_argument('--output', '-o', help='Output report path (e.g., review-report.md)')

    args = parser.parse_args()

    try:
        orchestrator = ReviewOrchestrator(args.skill_path, args.mode)

        # Run review based on mode
        if args.mode == 'fast':
            results = orchestrator.run_fast_check()
        elif args.mode == 'comprehensive':
            results = orchestrator.run_comprehensive_review()
        else:
            print("Custom mode not yet implemented - use comprehensive")
            results = orchestrator.run_comprehensive_review()

        # Save report if output specified
        if args.output:
            orchestrator.save_report(args.output)

        # Print summary
        print("\n" + "="*60)
        print("REVIEW COMPLETE")
        print("="*60)

        if 'overall_score' in results and results['overall_score'] > 0:
            print(f"Overall Score: {results['overall_score']}/5.0")
            print(f"Grade: {results.get('grade', 'N/A')}")
            print(f"Status: {results.get('readiness', 'N/A')}")

        print("")

        # Exit code based on results
        if results.get('overall_score', 0) >= 4.0:
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Completed but failed quality threshold

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
