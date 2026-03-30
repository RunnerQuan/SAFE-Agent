#!/usr/bin/env bash
# Find all git repositories under a directory and list their remote URLs
# Usage: find-repos.sh [path] [max-depth]
# Example: find-repos.sh ~/workspace
# Example: find-repos.sh ~ 4

set -euo pipefail

SEARCH_PATH="${1:-$HOME}"
MAX_DEPTH="${2:-5}"

# Expand ~ if present
SEARCH_PATH="${SEARCH_PATH/#\~/$HOME}"

echo "Scanning $SEARCH_PATH for git repositories (max depth: $MAX_DEPTH)..."
echo ""

count=0
find "$SEARCH_PATH" -maxdepth "$MAX_DEPTH" -type d -name .git -prune 2>/dev/null | sort | while read -r gitdir; do
    repo_path=$(dirname "$gitdir")
    repo_name=$(basename "$repo_path")

    # Get the origin remote URL
    url=$(git -C "$repo_path" remote get-url origin 2>/dev/null || echo "")

    if [ -n "$url" ]; then
        # Get the current branch
        branch=$(git -C "$repo_path" symbolic-ref --short HEAD 2>/dev/null || echo "detached")

        echo "$repo_name"
        echo "  Path: $repo_path"
        echo "  URL: $url"
        echo "  Branch: $branch"
        echo ""
        count=$((count + 1))
    fi
done

echo "---"
echo "Found repositories with remotes. Review the list above and tell me which to include."
