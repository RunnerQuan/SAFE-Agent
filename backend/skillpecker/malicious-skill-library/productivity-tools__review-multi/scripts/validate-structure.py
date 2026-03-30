#!/usr/bin/env python3
"""
Automated structure validation for Claude Code skills.

Validates:
- YAML frontmatter (syntax, required fields, format)
- File structure (required/optional files, directories)
- Naming conventions (kebab-case, descriptive)
- Progressive disclosure (file sizes, organization)

Usage:
    python3 validate-structure.py <skill_path> [--json] [--verbose]

Examples:
    python3 validate-structure.py .claude/skills/my-skill
    python3 validate-structure.py /path/to/skill --json
    python3 validate-structure.py ./skill-name --verbose

Exit Codes:
    0: PASS (score >= 4)
    1: FAIL (score < 4)
    2: ERROR (exception occurred)
"""

import sys
import os
import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime

try:
    import yaml
except ImportError:
    print("Error: PyYAML not installed. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(2)


class SkillValidator:
    """Validates Claude Code skill structure against standards."""

    def __init__(self, skill_path: str, verbose: bool = False):
        """
        Initialize validator.

        Args:
            skill_path: Path to skill directory
            verbose: Enable verbose output
        """
        self.skill_path = Path(skill_path).resolve()
        self.verbose = verbose
        self.results = {
            'skill_path': str(self.skill_path),
            'skill_name': self.skill_path.name,
            'timestamp': datetime.now().isoformat(),
            'checks': {},
            'issues': [],
            'score': 0,
            'grade': 'F',
            'status': 'FAIL'
        }

        # Check if skill directory exists
        if not self.skill_path.exists():
            raise FileNotFoundError(f"Skill directory not found: {self.skill_path}")
        if not self.skill_path.is_dir():
            raise NotADirectoryError(f"Path is not a directory: {self.skill_path}")

    def log(self, message: str) -> None:
        """Log message if verbose mode enabled."""
        if self.verbose:
            print(f"[DEBUG] {message}", file=sys.stderr)

    def validate_yaml_frontmatter(self) -> Tuple[bool, List[str]]:
        """
        Validate YAML frontmatter syntax and required fields.

        Returns:
            Tuple of (passed, issues_list)
        """
        self.log("Validating YAML frontmatter...")
        issues = []

        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            issues.append("CRITICAL: SKILL.md not found")
            return False, issues

        try:
            # Extract YAML frontmatter
            yaml_data = extract_yaml_frontmatter(skill_md)

            if not yaml_data:
                issues.append("CRITICAL: No YAML frontmatter found (must be between --- markers)")
                return False, issues

            # Check required fields
            if 'name' not in yaml_data:
                issues.append("CRITICAL: 'name' field missing in YAML frontmatter")
            else:
                # Validate name format (kebab-case)
                name = yaml_data['name']
                if not re.match(r'^[a-z][a-z0-9]*(-[a-z0-9]+)*$', name):
                    issues.append(f"ERROR: 'name' field not in kebab-case format: '{name}' (should be lowercase-hyphen-case)")

            if 'description' not in yaml_data:
                issues.append("CRITICAL: 'description' field missing in YAML frontmatter")
            else:
                # Count trigger keywords
                description = yaml_data['description']
                keyword_count = count_keywords(description)

                if keyword_count < 3:
                    issues.append(f"ERROR: Only {keyword_count} trigger keywords detected in description (target: 5+)")
                elif keyword_count < 5:
                    issues.append(f"WARNING: Only {keyword_count} trigger keywords in description (target: 5+)")
                elif self.verbose:
                    self.log(f"Trigger keywords: {keyword_count} found (good)")

            # Check for keyword stuffing
            if 'description' in yaml_data:
                desc = yaml_data['description']
                words = desc.split()
                if len(words) < 15:
                    issues.append("WARNING: Description very short (<15 words), may need more context")

                # Check for unnatural repetition
                word_freq = {}
                for word in words:
                    word_lower = word.lower().strip('.,!?;:')
                    if len(word_lower) > 3:
                        word_freq[word_lower] = word_freq.get(word_lower, 0) + 1

                for word, count in word_freq.items():
                    if count >= 3:
                        issues.append(f"WARNING: Word '{word}' repeated {count} times (possible keyword stuffing)")

        except yaml.YAMLError as e:
            issues.append(f"CRITICAL: YAML syntax error: {e}")
            return False, issues
        except Exception as e:
            issues.append(f"ERROR: Failed to parse YAML: {e}")
            return False, issues

        # Determine pass/fail
        critical_issues = [i for i in issues if i.startswith("CRITICAL")]
        passed = len(critical_issues) == 0

        return passed, issues

    def validate_file_structure(self) -> Tuple[bool, List[str]]:
        """
        Validate file structure and organization.

        Returns:
            Tuple of (passed, issues_list)
        """
        self.log("Validating file structure...")
        issues = []

        # Check SKILL.md
        if not (self.skill_path / "SKILL.md").exists():
            issues.append("CRITICAL: SKILL.md not found")

        # Check README.md (recommended but optional)
        if not (self.skill_path / "README.md").exists():
            issues.append("WARNING: README.md not found (recommended)")

        # Check directories
        references_dir = self.skill_path / "references"
        scripts_dir = self.skill_path / "scripts"

        if references_dir.exists():
            if not references_dir.is_dir():
                issues.append("ERROR: 'references' exists but is not a directory")
            else:
                # Count files in references
                ref_files = list(references_dir.glob("*.md"))
                if len(ref_files) == 0:
                    issues.append("WARNING: 'references/' directory exists but is empty")
                elif self.verbose:
                    self.log(f"Found {len(ref_files)} reference files")

        if scripts_dir.exists():
            if not scripts_dir.is_dir():
                issues.append("ERROR: 'scripts' exists but is not a directory")
            else:
                # Count files in scripts
                script_files = list(scripts_dir.glob("*"))
                script_files = [f for f in script_files if f.is_file()]
                if len(script_files) == 0:
                    issues.append("WARNING: 'scripts/' directory exists but is empty")
                elif self.verbose:
                    self.log(f"Found {len(script_files)} script files")

        # Check for stray files in root
        root_files = [f for f in self.skill_path.glob("*") if f.is_file()]
        expected_root = {"SKILL.md", "README.md", ".gitignore"}
        unexpected = [f.name for f in root_files if f.name not in expected_root]

        if unexpected:
            issues.append(f"WARNING: Unexpected files in root: {', '.join(unexpected)}")

        # Determine pass/fail
        critical_issues = [i for i in issues if i.startswith("CRITICAL")]
        passed = len(critical_issues) == 0

        return passed, issues

    def validate_naming_conventions(self) -> Tuple[bool, List[str]]:
        """
        Validate naming conventions for all files.

        Returns:
            Tuple of (passed, issues_list)
        """
        self.log("Validating naming conventions...")
        issues = []

        # Check SKILL.md (must be uppercase)
        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            # Already caught in file_structure check
            pass
        elif skill_md.name != "SKILL.md":
            issues.append(f"ERROR: Main file should be 'SKILL.md' not '{skill_md.name}'")

        # Check README.md (must be uppercase)
        readme = self.skill_path / "README.md"
        if readme.exists() and readme.name != "README.md":
            issues.append(f"ERROR: README should be 'README.md' not '{readme.name}'")

        # Check references/ files (lowercase-hyphen-case.md)
        references_dir = self.skill_path / "references"
        if references_dir.exists() and references_dir.is_dir():
            for ref_file in references_dir.glob("*.md"):
                name = ref_file.stem  # filename without extension
                if not re.match(r'^[a-z][a-z0-9]*(-[a-z0-9]+)*$', name):
                    issues.append(f"ERROR: Reference file '{ref_file.name}' not in kebab-case (should be lowercase-hyphen-case.md)")

        # Check scripts/ files (lowercase-hyphen-case.py/.sh)
        scripts_dir = self.skill_path / "scripts"
        if scripts_dir.exists() and scripts_dir.is_dir():
            for script_file in scripts_dir.glob("*"):
                if not script_file.is_file():
                    continue

                name = script_file.stem
                ext = script_file.suffix

                if ext not in ['.py', '.sh', '.js', '']:
                    issues.append(f"WARNING: Script '{script_file.name}' has unusual extension (expected .py or .sh)")

                if not re.match(r'^[a-z][a-z0-9]*(-[a-z0-9]+)*$', name):
                    issues.append(f"ERROR: Script '{script_file.name}' not in kebab-case (should be lowercase-hyphen-case)")

        # Determine pass/fail
        error_issues = [i for i in issues if i.startswith("ERROR")]
        passed = len(error_issues) == 0

        return passed, issues

    def validate_progressive_disclosure(self) -> Tuple[bool, List[str]]:
        """
        Check progressive disclosure compliance (file sizes).

        Returns:
            Tuple of (passed, issues_list)
        """
        self.log("Validating progressive disclosure...")
        issues = []

        # Check SKILL.md size
        skill_md = self.skill_path / "SKILL.md"
        if skill_md.exists():
            line_count = count_lines(skill_md)

            if line_count > 1500:
                issues.append(f"ERROR: SKILL.md is {line_count} lines (recommended <1,500, should have references/ for details)")
            elif line_count > 1200:
                issues.append(f"WARNING: SKILL.md is {line_count} lines (recommended <1,200, consider moving content to references/)")
            elif self.verbose:
                self.log(f"SKILL.md: {line_count} lines (good)")

        # Check references/ file sizes
        references_dir = self.skill_path / "references"
        if references_dir.exists() and references_dir.is_dir():
            for ref_file in references_dir.glob("*.md"):
                line_count = count_lines(ref_file)

                if line_count > 1000:
                    issues.append(f"WARNING: {ref_file.name} is {line_count} lines (recommended 300-800 lines per reference)")
                elif line_count < 200:
                    issues.append(f"INFO: {ref_file.name} is {line_count} lines (consider consolidating if very small)")
                elif self.verbose:
                    self.log(f"{ref_file.name}: {line_count} lines (good)")

        # Check if SKILL.md is large but no references/
        if skill_md.exists():
            line_count = count_lines(skill_md)
            if line_count > 1000 and not (self.skill_path / "references").exists():
                issues.append(f"WARNING: SKILL.md is {line_count} lines but no references/ directory (consider progressive disclosure)")

        # Check scripts/ for docstrings (basic check)
        scripts_dir = self.skill_path / "scripts"
        if scripts_dir.exists() and scripts_dir.is_dir():
            for script_file in scripts_dir.glob("*.py"):
                try:
                    content = script_file.read_text(encoding='utf-8')
                    # Check for module docstring
                    if not re.search(r'^"""[\s\S]*?"""', content, re.MULTILINE):
                        issues.append(f"INFO: {script_file.name} missing module docstring")
                except Exception:
                    pass

        # Determine pass/fail (only errors fail, warnings are OK)
        error_issues = [i for i in issues if i.startswith("ERROR")]
        passed = len(error_issues) == 0

        return passed, issues

    def calculate_score(self) -> int:
        """
        Calculate overall structure score (1-5).

        Returns:
            Score (1-5)
        """
        self.log("Calculating score...")

        # Count passed checks
        passed_count = sum(1 for result in self.results['checks'].values() if result['passed'])
        total_checks = len(self.results['checks'])

        # Count issues by severity
        critical_count = len([i for i in self.results['issues'] if 'CRITICAL' in i])
        error_count = len([i for i in self.results['issues'] if i.startswith('ERROR')])

        # Apply rubric
        if critical_count > 0:
            # Any critical issue = fail
            if critical_count >= 3:
                score = 1
            else:
                score = 2
        elif error_count >= 4:
            score = 2
        elif error_count >= 2:
            score = 3
        elif error_count == 1 or passed_count < total_checks:
            score = 4
        else:
            # All checks passed, no errors
            score = 5

        return score

    def map_score_to_grade(self, score: int) -> Tuple[str, str]:
        """
        Map score to grade and status.

        Args:
            score: Score (1-5)

        Returns:
            Tuple of (grade, status)
        """
        if score == 5:
            return 'A', 'PASS'
        elif score == 4:
            return 'B', 'PASS'
        elif score == 3:
            return 'C', 'PASS'
        elif score == 2:
            return 'D', 'FAIL'
        else:
            return 'F', 'FAIL'

    def generate_report(self, format_type: str = 'human') -> str:
        """
        Generate validation report.

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
        lines.append("Structure Validation Report")
        lines.append("=" * 60)
        lines.append(f"Skill: {self.results['skill_name']}")
        lines.append(f"Path: {self.results['skill_path']}")
        lines.append(f"Date: {self.results['timestamp'][:10]}")
        lines.append("")

        # Overall result
        status_symbol = "✅" if self.results['status'] == 'PASS' else "❌"
        lines.append(f"{status_symbol} Overall: {self.results['status']} - Score: {self.results['score']}/5 (Grade {self.results['grade']})")
        lines.append("")

        # Check results
        lines.append("Check Results:")
        lines.append("-" * 60)
        for check_name, check_result in self.results['checks'].items():
            symbol = "✅" if check_result['passed'] else "❌"
            lines.append(f"{symbol} {check_name}: {'PASS' if check_result['passed'] else 'FAIL'}")
            if check_result['issues']:
                for issue in check_result['issues']:
                    severity = "ERROR" if "ERROR" in issue or "CRITICAL" in issue else "WARNING" if "WARNING" in issue else "INFO"
                    lines.append(f"   [{severity}] {issue}")
        lines.append("")

        # Issues summary
        critical = [i for i in self.results['issues'] if 'CRITICAL' in i]
        errors = [i for i in self.results['issues'] if i.startswith('ERROR')]
        warnings = [i for i in self.results['issues'] if i.startswith('WARNING')]

        if self.results['issues']:
            lines.append("Issues Summary:")
            lines.append(f"- Critical: {len(critical)}")
            lines.append(f"- Errors: {len(errors)}")
            lines.append(f"- Warnings: {len(warnings)}")
            lines.append("")

        # Recommendations
        if self.results['score'] < 5:
            lines.append("Recommendations:")
            if critical:
                lines.append("- Fix critical issues first (prevent functionality)")
            if errors:
                lines.append("- Address errors for production readiness")
            if warnings:
                lines.append("- Consider addressing warnings for best practices")
            lines.append("")
        else:
            lines.append("✅ Excellent structure - no issues found!")
            lines.append("")

        lines.append("=" * 60)

        return "\n".join(lines)

    def run_all_checks(self) -> Dict:
        """
        Run all validation checks and generate results.

        Returns:
            Results dictionary
        """
        checks = [
            ('YAML Frontmatter', self.validate_yaml_frontmatter),
            ('File Structure', self.validate_file_structure),
            ('Naming Conventions', self.validate_naming_conventions),
            ('Progressive Disclosure', self.validate_progressive_disclosure),
        ]

        for check_name, check_func in checks:
            self.log(f"Running check: {check_name}")
            passed, issues = check_func()

            self.results['checks'][check_name] = {
                'passed': passed,
                'issues': issues
            }

            # Add issues to global issues list
            self.results['issues'].extend(issues)

        # Calculate score
        self.results['score'] = self.calculate_score()
        self.results['grade'], self.results['status'] = self.map_score_to_grade(self.results['score'])

        return self.results


# Helper functions

def extract_yaml_frontmatter(md_file: Path) -> Optional[Dict]:
    """
    Extract YAML frontmatter from markdown file.

    Args:
        md_file: Path to markdown file

    Returns:
        Dictionary of YAML data or None if not found
    """
    try:
        content = md_file.read_text(encoding='utf-8')

        # Look for YAML frontmatter between --- markers
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if not match:
            return None

        yaml_str = match.group(1)
        yaml_data = yaml.safe_load(yaml_str)

        return yaml_data
    except Exception as e:
        raise Exception(f"Failed to extract YAML: {e}")


def count_lines(file_path: Path) -> int:
    """
    Count lines in file.

    Args:
        file_path: Path to file

    Returns:
        Number of lines
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def count_keywords(text: str) -> int:
    """
    Count potential trigger keywords in description.

    Simple heuristic: count unique words >3 characters, excluding common words.

    Args:
        text: Description text

    Returns:
        Estimated keyword count
    """
    common_words = {
        'the', 'and', 'for', 'with', 'from', 'that', 'this', 'when', 'where',
        'what', 'which', 'when', 'how', 'use', 'uses', 'using', 'used',
        'are', 'is', 'be', 'been', 'have', 'has', 'had', 'will', 'would',
        'can', 'could', 'should', 'may', 'might', 'must', 'shall'
    }

    # Split into words
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())

    # Filter: length >3, not common, unique
    keywords = set()
    for word in words:
        if len(word) > 3 and word not in common_words:
            keywords.add(word)

    return len(keywords)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Validate Claude Code skill structure',
        epilog='Exit codes: 0 (pass, score>=4), 1 (fail, score<4), 2 (error)'
    )
    parser.add_argument('skill_path', help='Path to skill directory')
    parser.add_argument('--json', action='store_true',
                       help='Output JSON format')
    parser.add_argument('--verbose', action='store_true',
                       help='Enable verbose output')

    args = parser.parse_args()

    try:
        validator = SkillValidator(args.skill_path, args.verbose)
        results = validator.run_all_checks()

        # Generate and print report
        report = validator.generate_report('json' if args.json else 'human')
        print(report)

        # Exit with appropriate code
        exit_code = 0 if results['score'] >= 4 else 1
        sys.exit(exit_code)

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
