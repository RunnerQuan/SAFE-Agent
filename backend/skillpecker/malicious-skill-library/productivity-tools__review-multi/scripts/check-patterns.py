#!/usr/bin/env python3
"""
Pattern compliance and anti-pattern detection for Claude Code skills.

Detects:
- Architecture pattern (workflow/task/reference/capabilities)
- Pattern compliance level
- 10 common anti-patterns
- Best practices gaps

Usage:
    python3 check-patterns.py <skill_path> [--json] [--detailed]

Examples:
    python3 check-patterns.py .claude/skills/my-skill
    python3 check-patterns.py /path/to/skill --detailed
    python3 check-patterns.py ./skill-name --json

Exit Codes:
    0: Analysis complete
    2: ERROR (exception occurred)
"""

import sys
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime


class PatternAnalyzer:
    """Analyzes Claude Code skill patterns and detects anti-patterns."""

    def __init__(self, skill_path: str, detailed: bool = False):
        """
        Initialize analyzer.

        Args:
            skill_path: Path to skill directory
            detailed: Enable detailed output
        """
        self.skill_path = Path(skill_path).resolve()
        self.detailed = detailed
        self.results = {
            'skill_path': str(self.skill_path),
            'skill_name': self.skill_path.name,
            'timestamp': datetime.now().isoformat(),
            'pattern_detected': None,
            'pattern_compliance': 0,
            'anti_patterns': [],
            'best_practices': {
                'validation_checklists': False,
                'examples_present': False,
                'consistent_structure': False,
                'quick_reference': False,
                'error_cases': False
            },
            'recommendations': []
        }

        # Check if skill directory exists
        if not self.skill_path.exists():
            raise FileNotFoundError(f"Skill directory not found: {self.skill_path}")

    def detect_architecture_pattern(self) -> str:
        """
        Detect skill architecture pattern.

        Returns:
            Pattern type: workflow|task|reference|capabilities|unknown
        """
        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            return "unknown"

        try:
            content = skill_md.read_text(encoding='utf-8')

            # Workflow indicators
            workflow_indicators = [
                r'### Step \d+:',  # Numbered steps
                r'## Prerequisites',
                r'## Post-Workflow',
                r'Workflow',
                r'sequential'
            ]

            # Task indicators
            task_indicators = [
                r'### Operation \d*:',  # Operations (may or may not be numbered)
                r'## Operations',
                r'independent operations',
                r'task-based'
            ]

            # Reference indicators
            reference_indicators = [
                r'## \w+ Patterns',  # Pattern sections
                r'design system',
                r'guidelines',
                r'reference',
                r'standards'
            ]

            # Capabilities indicators
            capabilities_indicators = [
                r'## Core Capabilities',
                r'## Capability \d+:',
                r'Integration Scenarios',
                r'capabilities-based'
            ]

            # Count matches
            workflow_count = sum(1 for pattern in workflow_indicators if re.search(pattern, content, re.IGNORECASE))
            task_count = sum(1 for pattern in task_indicators if re.search(pattern, content, re.IGNORECASE))
            reference_count = sum(1 for pattern in reference_indicators if re.search(pattern, content, re.IGNORECASE))
            capabilities_count = sum(1 for pattern in capabilities_indicators if re.search(pattern, content, re.IGNORECASE))

            # Determine pattern (highest count)
            counts = {
                'workflow': workflow_count,
                'task': task_count,
                'reference': reference_count,
                'capabilities': capabilities_count
            }

            max_count = max(counts.values())
            if max_count == 0:
                return "unknown"

            pattern = max(counts, key=counts.get)
            return pattern

        except Exception as e:
            print(f"Error detecting pattern: {e}", file=sys.stderr)
            return "unknown"

    def check_pattern_compliance(self, pattern: str) -> int:
        """
        Check pattern compliance (0-100%).

        Args:
            pattern: Detected pattern type

        Returns:
            Compliance percentage (0-100)
        """
        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            return 0

        try:
            content = skill_md.read_text(encoding='utf-8')
            compliance_score = 0
            checks = 0

            if pattern == "workflow":
                # Workflow pattern compliance checks
                checks = 5
                if re.search(r'## Prerequisites', content, re.IGNORECASE):
                    compliance_score += 20
                if re.search(r'### Step \d+:', content):
                    compliance_score += 20
                if re.search(r'## Post-Workflow', content, re.IGNORECASE):
                    compliance_score += 20
                if re.search(r'Integration', content, re.IGNORECASE):
                    compliance_score += 20
                if re.search(r'\*\*Purpose\*\*:', content):
                    compliance_score += 20

            elif pattern == "task":
                # Task pattern compliance checks
                checks = 5
                if re.search(r'## Operations', content, re.IGNORECASE):
                    compliance_score += 20
                if re.search(r'### Operation', content, re.IGNORECASE):
                    compliance_score += 20
                # Operations should not be numbered for pure task pattern
                numbered_ops = len(re.findall(r'### Operation \d+:', content))
                if numbered_ops == 0:
                    compliance_score += 20
                if re.search(r'\*\*Purpose\*\*:', content):
                    compliance_score += 20
                if re.search(r'\*\*Process\*\*:', content):
                    compliance_score += 20

            elif pattern == "reference":
                # Reference pattern compliance checks
                checks = 4
                # Should have categorical organization
                if len(re.findall(r'^## [A-Z]', content, re.MULTILINE)) >= 3:
                    compliance_score += 25
                # Should have quick reference
                if re.search(r'## Quick Reference', content, re.IGNORECASE):
                    compliance_score += 25
                # Should have examples
                if content.count('```') >= 6:  # At least 3 code blocks
                    compliance_score += 25
                # Should NOT have steps/operations
                if not re.search(r'### (Step|Operation) \d+:', content):
                    compliance_score += 25

            return compliance_score

        except Exception:
            return 0

    def detect_anti_patterns(self) -> List[Dict]:
        """
        Detect common anti-patterns.

        Returns:
            List of detected anti-patterns with severity
        """
        anti_patterns = []
        skill_md = self.skill_path / "SKILL.md"

        if not skill_md.exists():
            return anti_patterns

        try:
            content = skill_md.read_text(encoding='utf-8')
            line_count = content.count('\n')

            # AP1: Keyword Stuffing
            yaml_match = re.search(r'---\s*\n(.*?)\n---', content, re.DOTALL)
            if yaml_match:
                description = yaml_match.group(1)
                if 'description:' in description:
                    desc_line = [line for line in description.split('\n') if 'description:' in line][0]
                    # Check for repetitive words
                    words = desc_line.lower().split()
                    word_freq = {}
                    for word in words:
                        if len(word) > 4:
                            word_freq[word] = word_freq.get(word, 0) + 1
                    for word, count in word_freq.items():
                        if count >= 3:
                            anti_patterns.append({
                                'name': 'Keyword Stuffing',
                                'severity': 'Medium',
                                'evidence': f"Word '{word}' repeated {count} times in description",
                                'fix': 'Rewrite description with natural language'
                            })

            # AP2: Monolithic SKILL.md
            if line_count > 1500:
                refs_exist = (self.skill_path / "references").exists()
                if not refs_exist:
                    anti_patterns.append({
                        'name': 'Monolithic SKILL.md',
                        'severity': 'High',
                        'evidence': f'SKILL.md is {line_count} lines with no references/ directory',
                        'fix': 'Extract detailed content to references/ directory'
                    })

            # AP3: Inconsistent Structure
            # Check if steps/operations have consistent structure
            step_sections = re.findall(r'###.*?\n\n(.*?)(?=###|\Z)', content, re.DOTALL)
            if len(step_sections) >= 3:
                has_purpose = [bool(re.search(r'\*\*Purpose\*\*:', section)) for section in step_sections]
                has_process = [bool(re.search(r'\*\*Process\*\*:', section)) for section in step_sections]

                if has_purpose.count(True) > 0 and has_purpose.count(False) > 0:
                    anti_patterns.append({
                        'name': 'Inconsistent Structure',
                        'severity': 'Medium',
                        'evidence': 'Some sections have Purpose, others don\'t',
                        'fix': 'Standardize structure across all sections'
                    })

            # AP4: Vague Validation
            if 'Validation:' in content or 'Validation]]:' in content:
                # Check for vague checklist items
                vague_patterns = [
                    'everything works', 'looks good', 'seems fine',
                    'all good', 'complete', 'done'
                ]
                for vague in vague_patterns:
                    if re.search(rf'\[ \].*{vague}', content, re.IGNORECASE):
                        anti_patterns.append({
                            'name': 'Vague Validation',
                            'severity': 'Medium',
                            'evidence': f'Checklist item contains "{vague}" (not specific)',
                            'fix': 'Make validation criteria specific and measurable'
                        })
                        break

            # AP5: Missing Examples
            code_blocks = content.count('```')
            if code_blocks < 6:  # Less than 3 examples (open + close)
                anti_patterns.append({
                    'name': 'Missing Examples',
                    'severity': 'High',
                    'evidence': f'Only {code_blocks//2} code examples found (target: 5+)',
                    'fix': 'Add concrete examples after major concepts'
                })

            # AP7: No Quick Reference
            if not re.search(r'## Quick Reference', content, re.IGNORECASE):
                anti_patterns.append({
                    'name': 'No Quick Reference',
                    'severity': 'Low',
                    'evidence': 'No Quick Reference section found',
                    'fix': 'Add Quick Reference as final section'
                })

            # AP8: Placeholders in Production
            placeholders = re.findall(r'YOUR_\w+|<YOUR[^>]*>|\[PLACEHOLDER\]|\[YOUR[^\]]*\]', content)
            if placeholders:
                anti_patterns.append({
                    'name': 'Placeholders in Production',
                    'severity': 'High',
                    'evidence': f'Placeholders found: {", ".join(set(placeholders[:3]))}',
                    'fix': 'Replace placeholders with concrete realistic values'
                })

            # AP9: Ignoring Error Cases
            has_error_section = bool(re.search(r'(Common Mistakes|Troubleshooting|Error|Errors)', content, re.IGNORECASE))
            has_error_examples = bool(re.search(r'(error|fail|exception|issue)', content, re.IGNORECASE))

            if not has_error_section and not has_error_examples:
                anti_patterns.append({
                    'name': 'Ignoring Error Cases',
                    'severity': 'Medium',
                    'evidence': 'No error handling documentation found',
                    'fix': 'Add Common Mistakes section or error handling examples'
                })

        except Exception as e:
            print(f"Error detecting anti-patterns: {e}", file=sys.stderr)

        return anti_patterns

    def check_best_practices(self) -> Dict[str, bool]:
        """
        Check best practices adherence.

        Returns:
            Dictionary of practice: adherence
        """
        skill_md = self.skill_path / "SKILL.md"
        practices = self.results['best_practices']

        if not skill_md.exists():
            return practices

        try:
            content = skill_md.read_text(encoding='utf-8')

            # Check for validation checklists
            practices['validation_checklists'] = bool(re.search(r'- \[ \]', content))

            # Check for examples (at least 3 code blocks)
            code_blocks = content.count('```')
            practices['examples_present'] = code_blocks >= 6

            # Check for Quick Reference
            practices['quick_reference'] = bool(re.search(r'## Quick Reference', content, re.IGNORECASE))

            # Check for consistent structure (Purpose/Process in multiple sections)
            purpose_count = len(re.findall(r'\*\*Purpose\*\*:', content))
            process_count = len(re.findall(r'\*\*Process\*\*:', content))
            practices['consistent_structure'] = (purpose_count >= 3 and process_count >= 3)

            # Check for error case consideration
            practices['error_cases'] = bool(re.search(r'(Common Mistakes|Troubleshooting|Error)', content, re.IGNORECASE))

        except Exception as e:
            print(f"Error checking best practices: {e}", file=sys.stderr)

        return practices

    def generate_recommendations(self) -> List[str]:
        """
        Generate improvement recommendations.

        Returns:
            List of recommendations
        """
        recommendations = []

        # Based on anti-patterns
        for ap in self.results['anti_patterns']:
            recommendations.append(f"[{ap['severity']}] {ap['name']}: {ap['fix']}")

        # Based on best practices
        if not self.results['best_practices']['validation_checklists']:
            recommendations.append("[Medium] Add validation checklists with specific, measurable criteria")

        if not self.results['best_practices']['examples_present']:
            recommendations.append("[High] Add more examples (target: 5+)")

        if not self.results['best_practices']['quick_reference']:
            recommendations.append("[Low] Add Quick Reference section")

        if not self.results['best_practices']['error_cases']:
            recommendations.append("[Medium] Document error cases and recovery")

        return recommendations

    def generate_report(self, format_type: str = 'human') -> str:
        """
        Generate pattern analysis report.

        Args:
            format_type: 'json' or 'human'

        Returns:
            Report string
        """
        if format_type == 'json':
            return json.dumps(self.results, indent=2)

        # Human-readable format
        lines = []
        lines.append("=" * 60)
        lines.append("Pattern Analysis Report")
        lines.append("=" * 60)
        lines.append(f"Skill: {self.results['skill_name']}")
        lines.append(f"Path: {self.results['skill_path']}")
        lines.append(f"Date: {self.results['timestamp'][:10]}")
        lines.append("")

        # Pattern detection
        lines.append(f"Pattern Detected: {self.results['pattern_detected'].upper() if self.results['pattern_detected'] else 'UNKNOWN'}")
        if self.results['pattern_compliance'] > 0:
            lines.append(f"Pattern Compliance: {self.results['pattern_compliance']}%")
        lines.append("")

        # Anti-patterns
        if self.results['anti_patterns']:
            lines.append(f"Anti-Patterns Detected: {len(self.results['anti_patterns'])}")
            lines.append("-" * 60)
            for ap in self.results['anti_patterns']:
                lines.append(f"❌ {ap['name']} ({ap['severity']} severity)")
                lines.append(f"   Evidence: {ap['evidence']}")
                lines.append(f"   Fix: {ap['fix']}")
                lines.append("")
        else:
            lines.append("✅ No anti-patterns detected")
            lines.append("")

        # Best practices
        lines.append("Best Practices Adherence:")
        lines.append("-" * 60)
        for practice, adheres in self.results['best_practices'].items():
            symbol = "✅" if adheres else "❌"
            practice_name = practice.replace('_', ' ').title()
            lines.append(f"{symbol} {practice_name}: {'Yes' if adheres else 'No'}")
        lines.append("")

        # Recommendations
        if self.results['recommendations']:
            lines.append("Recommendations:")
            lines.append("-" * 60)
            for i, rec in enumerate(self.results['recommendations'], 1):
                lines.append(f"{i}. {rec}")
            lines.append("")
        else:
            lines.append("✅ No recommendations - excellent quality!")
            lines.append("")

        lines.append("=" * 60)

        return "\n".join(lines)

    def run_analysis(self) -> Dict:
        """
        Run complete pattern analysis.

        Returns:
            Results dictionary
        """
        # Detect pattern
        self.results['pattern_detected'] = self.detect_architecture_pattern()

        # Check pattern compliance
        self.results['pattern_compliance'] = self.check_pattern_compliance(self.results['pattern_detected'])

        # Detect anti-patterns
        self.results['anti_patterns'] = self.detect_anti_patterns()

        # Check best practices
        self.results['best_practices'] = self.check_best_practices()

        # Generate recommendations
        self.results['recommendations'] = self.generate_recommendations()

        return self.results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Analyze Claude Code skill patterns and detect anti-patterns',
        epilog='Detects architecture patterns, anti-patterns, and best practice gaps'
    )
    parser.add_argument('skill_path', help='Path to skill directory')
    parser.add_argument('--json', action='store_true',
                       help='Output JSON format')
    parser.add_argument('--detailed', action='store_true',
                       help='Enable detailed analysis')

    args = parser.parse_args()

    try:
        analyzer = PatternAnalyzer(args.skill_path, args.detailed)
        results = analyzer.run_analysis()

        # Generate and print report
        report = analyzer.generate_report('json' if args.json else 'human')
        print(report)

        sys.exit(0)

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
