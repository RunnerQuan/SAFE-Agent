#!/usr/bin/env python3
"""
Initialize standard project structure for non-developer Python automation projects.

Usage:
    python init_structure.py [project_root]

If project_root is not provided, uses current directory.
"""

import sys
import os
import subprocess
from pathlib import Path


def create_directory_structure(project_root: Path) -> None:
    """Create the standard project directory structure."""

    directories = [
        "docs/knowledge-base",  # Domain knowledge, setup guides, API docs
        "docs/plans",           # Implementation plans (PLN-XXX-YYYY-MM-DD-name.md)
        "docs/architecture",    # Component descriptions (how things work)
        "src",                  # Source code
        "tests",                # Test files
    ]

    print("Creating project directory structure...")

    for directory in directories:
        dir_path = project_root / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✓ {directory}/")

    # Create .gitignore from template
    gitignore_path = project_root / ".gitignore"
    if not gitignore_path.exists():
        print("Creating .gitignore from template...")
        template_path = Path(__file__).parent.parent / "assets" / "gitignore-python.template"
        if template_path.exists():
            gitignore_path.write_text(template_path.read_text())
            print("  ✓ .gitignore (from template)")
        else:
            gitignore_path.touch()
            print("  ✓ .gitignore (empty - template not found)")

    # Initialize git if not already initialized
    git_dir = project_root / ".git"
    if not git_dir.exists():
        print("Initializing git repository...")
        os.chdir(project_root)
        subprocess.run(['git', 'init'], check=True)
        print("  ✓ git repository initialized")


def print_structure_info() -> None:
    """Print information about the created structure."""
    print("\n" + "="*60)
    print("✅ Project structure created successfully!")
    print("="*60)
    print("\nDirectory structure:")
    print("├── docs/")
    print("│   ├── knowledge-base/  # Domain knowledge, setup guides, API docs")
    print("│   ├── plans/           # Implementation plans (PLN-XXX-YYYY-MM-DD-name.md)")
    print("│   └── architecture/    # Component descriptions (how things work)")
    print("├── src/                 # Source code")
    print("├── tests/               # Test files")
    print("└── .gitignore")
    print()


def main():
    # Get project root from argument or use current directory
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1]).resolve()
    else:
        project_root = Path.cwd()

    print(f"Project root: {project_root}\n")

    # Create structure
    create_directory_structure(project_root)

    # Print success message
    print_structure_info()


if __name__ == "__main__":
    main()
