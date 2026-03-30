#!/usr/bin/env python3
"""
Generate formatted review reports from review data.

Compiles findings from multiple dimensions, calculates weighted scores,
maps to grades, assesses production readiness, and generates formatted reports.

Usage:
    python3 generate-review-report.py <review_data.json> [--output report.md] [--format md|json]

Examples:
    python3 generate-review-report.py review_data.json
    python3 generate-review-report.py data.json --output my-report.md
    python3 generate-review-report.py data.json --format json

Exit Codes:
    0: Report generated successfully
    2: ERROR (exception occurred)
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple


class ReportGenerator:
    """Generates formatted review reports."""

    def __init__(self, review_data: Dict):
        """
        Initialize report generator.

        Args:
            review_data: Review data dictionary with dimension scores
        """
        self.data = review_data
        self.overall_score = 0.0
        self.grade = 'F'
        self.readiness = 'Not Ready'

        # Validate data structure
        required_fields = ['skill_name', 'dimensions']
        for field in required_fields:
            if field not in self.data:
                raise ValueError(f"Missing required field: {field}")

    def calculate_overall_score(self) -> float:
        """
        Calculate weighted overall score.

        Returns:
            Overall score (1.0-5.0)
        """
        dimensions = self.data['dimensions']

        # Weights
        weights = {
            'structure': 0.20,
            'content': 0.25,
            'quality': 0.25,
            'usability': 0.15,
            'integration': 0.15
        }

        overall = 0.0
        for dim_name, weight in weights.items():
            if dim_name in dimensions:
                score = dimensions[dim_name].get('score', 3)
                overall += score * weight

        return round(overall, 1)

    def map_to_grade(self, score: float) -> str:
        """
        Map overall score to letter grade.

        Args:
            score: Overall score (1.0-5.0)

        Returns:
            Grade (A/B+/B-/C/D/F)
        """
        if score >= 4.5:
            return 'A'
        elif score >= 4.0:
            return 'B+'
        elif score >= 3.5:
            return 'B-'
        elif score >= 2.5:
            return 'C'
        elif score >= 1.5:
            return 'D'
        else:
            return 'F'

    def assess_readiness(self, score: float) -> Tuple[str, str]:
        """
        Assess production readiness.

        Args:
            score: Overall score

        Returns:
            Tuple of (readiness_status, recommendation)
        """
        if score >= 4.5:
            return '✅ Production Ready', 'Deploy with confidence - high quality'
        elif score >= 4.0:
            return '✅ Ready (minor improvements)', 'Deploy - note improvements for next iteration'
        elif score >= 3.5:
            return '⚠️ Needs Improvements', 'Hold - fix identified issues before deploying'
        else:
            return '❌ Not Ready', 'Do not deploy - significant rework required'

    def prioritize_recommendations(self, recommendations: List[Dict]) -> List[Dict]:
        """
        Sort recommendations by priority.

        Args:
            recommendations: List of recommendation dicts

        Returns:
            Sorted list (Critical → High → Medium → Low)
        """
        priority_order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}

        return sorted(recommendations,
                     key=lambda x: priority_order.get(x.get('priority', 'Medium'), 2))

    def generate_markdown_report(self) -> str:
        """
        Generate markdown formatted report.

        Returns:
            Markdown report string
        """
        lines = []

        # Header
        skill_name = self.data.get('skill_name', 'Unknown Skill')
        lines.append(f"# {skill_name} - Comprehensive Review Report")
        lines.append("")
        lines.append(f"**Review Date**: {self.data.get('review_date', datetime.now().strftime('%Y-%m-%d'))}")
        lines.append(f"**Reviewer**: {self.data.get('reviewer', 'Claude Code')}")
        lines.append(f"**Review Mode**: {self.data.get('review_mode', 'Comprehensive')}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Executive Summary
        lines.append("## Executive Summary")
        lines.append("")
        lines.append(f"**Overall Score**: {self.overall_score}/5.0")
        lines.append(f"**Grade**: {self.grade}")
        lines.append(f"**Production Readiness**: {self.readiness}")
        lines.append("")

        quick_assessment = self.data.get('quick_assessment', 'Quality assessment complete.')
        lines.append(f"**Quick Assessment**: {quick_assessment}")
        lines.append("")

        recommendation = self.data.get('recommendation', 'See detailed findings below.')
        lines.append(f"**Recommendation**: {recommendation}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Dimension Scores Table
        lines.append("## Dimension Scores")
        lines.append("")
        lines.append("| Dimension | Score | Status |")
        lines.append("|-----------|-------|--------|")

        dimensions = self.data.get('dimensions', {})
        for dim_name in ['structure', 'content', 'quality', 'usability', 'integration']:
            if dim_name in dimensions:
                dim = dimensions[dim_name]
                score = dim.get('score', 0)
                status = '✅' if score >= 4 else '⚠️' if score >= 3 else '❌'
                lines.append(f"| {dim_name.title()} | {score}/5 | {status} |")
        lines.append("")

        # Weighted calculation
        lines.append("**Weighted Calculation**:")
        lines.append("```")
        lines.append("Overall = (Structure × 0.20) + (Content × 0.25) + (Quality × 0.25) +")
        lines.append("          (Usability × 0.15) + (Integration × 0.15)")

        if all(dim in dimensions for dim in ['structure', 'content', 'quality', 'usability', 'integration']):
            s = dimensions['structure']['score']
            c = dimensions['content']['score']
            q = dimensions['quality']['score']
            u = dimensions['usability']['score']
            i = dimensions['integration']['score']
            lines.append(f"        = ({s}×0.20) + ({c}×0.25) + ({q}×0.25) + ({u}×0.15) + ({i}×0.15)")
            calc = (s*0.20 + c*0.25 + q*0.25 + u*0.15 + i*0.15)
            lines.append(f"        = {calc:.1f}")

        lines.append("```")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Dimension Details
        for dim_name in ['structure', 'content', 'quality', 'usability', 'integration']:
            if dim_name in dimensions:
                dim = dimensions[dim_name]
                lines.append(f"## Dimension: {dim_name.title()} Review")
                lines.append("")
                lines.append(f"**Score**: {dim.get('score', 0)}/5")
                lines.append("")

                if 'issues' in dim and dim['issues']:
                    lines.append("**Issues**:")
                    for issue in dim['issues']:
                        lines.append(f"- {issue}")
                    lines.append("")

                if 'strengths' in dim and dim['strengths']:
                    lines.append("**Strengths**:")
                    for strength in dim['strengths']:
                        lines.append(f"- {strength}")
                    lines.append("")

                lines.append("---")
                lines.append("")

        # Recommendations
        recommendations = self.data.get('recommendations', [])
        if recommendations:
            sorted_recs = self.prioritize_recommendations(recommendations)

            lines.append("## Improvement Recommendations")
            lines.append("")

            for rec in sorted_recs:
                priority = rec.get('priority', 'Medium')
                title = rec.get('title', 'Improvement')
                lines.append(f"### [{priority}] {title}")
                lines.append("")

                if 'dimension' in rec:
                    lines.append(f"**Dimension**: {rec['dimension']}")
                if 'issue' in rec:
                    lines.append(f"**Issue**: {rec['issue']}")
                if 'impact' in rec:
                    lines.append(f"**Impact**: {rec['impact']}")
                if 'fix' in rec:
                    lines.append(f"**Fix**: {rec['fix']}")
                if 'effort' in rec:
                    lines.append(f"**Effort**: {rec['effort']}")

                lines.append("")

            lines.append("---")
            lines.append("")

        # Strengths Summary
        strengths = self.data.get('strengths_summary', [])
        if strengths:
            lines.append("## Strengths Summary")
            lines.append("")
            for i, strength in enumerate(strengths, 1):
                lines.append(f"{i}. {strength}")
            lines.append("")
            lines.append("---")
            lines.append("")

        # Production Readiness
        lines.append("## Production Readiness Assessment")
        lines.append("")
        lines.append(f"**Overall Assessment**: {self.readiness}")
        lines.append("")

        reasoning = self.data.get('readiness_reasoning', f'Based on overall score of {self.overall_score}/5.0')
        lines.append(f"**Reasoning**: {reasoning}")
        lines.append("")

        risk_level = 'Low' if self.overall_score >= 4.5 else 'Low-Medium' if self.overall_score >= 4.0 else 'Medium' if self.overall_score >= 3.5 else 'High'
        lines.append(f"**Risk Level**: {risk_level}")
        lines.append("")

        # Next steps
        next_steps = self.data.get('next_steps', [])
        if next_steps:
            lines.append("## Next Steps")
            lines.append("")
            for i, step in enumerate(next_steps, 1):
                lines.append(f"{i}. {step}")
            lines.append("")

        # Footer
        lines.append("---")
        lines.append("")
        lines.append(f"**Report Generated**: {datetime.now().isoformat()}")
        lines.append("**Tool**: review-multi v1.0")

        return "\n".join(lines)

    def run(self, output_format: str = 'markdown') -> str:
        """
        Run report generation.

        Args:
            output_format: 'markdown' or 'json'

        Returns:
            Report string
        """
        # Calculate overall score
        self.overall_score = self.calculate_overall_score()

        # Map to grade
        self.grade = self.map_to_grade(self.overall_score)

        # Assess readiness
        self.readiness, recommendation = self.assess_readiness(self.overall_score)

        # Store in data
        self.data['overall_score'] = self.overall_score
        self.data['grade'] = self.grade
        self.data['readiness'] = self.readiness
        if 'recommendation' not in self.data:
            self.data['recommendation'] = recommendation

        # Generate report
        if output_format == 'json':
            return json.dumps(self.data, indent=2)
        else:
            return self.generate_markdown_report()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Generate formatted review report from review data',
        epilog='Compiles findings, calculates scores, generates professional reports'
    )
    parser.add_argument('review_data', help='Path to review data JSON file')
    parser.add_argument('--output', '-o', help='Output file path (default: stdout)')
    parser.add_argument('--format', choices=['md', 'json'], default='md',
                       help='Output format: md (markdown) or json')

    args = parser.parse_args()

    try:
        # Load review data
        with open(args.review_data, 'r', encoding='utf-8') as f:
            review_data = json.load(f)

        # Generate report
        generator = ReportGenerator(review_data)
        report = generator.run(output_format='markdown' if args.format == 'md' else 'json')

        # Output
        if args.output:
            output_path = Path(args.output)
            output_path.write_text(report, encoding='utf-8')
            print(f"Report generated: {output_path}")
        else:
            print(report)

        sys.exit(0)

    except FileNotFoundError:
        print(f"ERROR: Review data file not found: {args.review_data}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in review data: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
