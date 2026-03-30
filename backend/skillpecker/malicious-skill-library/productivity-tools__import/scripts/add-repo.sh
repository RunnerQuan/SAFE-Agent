#!/usr/bin/env bash
# Add a repository as a submodule with update=none
# Usage: add-repo.sh <url> [name]

set -euo pipefail

URL="$1"
NAME="${2:-}"

# Extract repo name from URL if not provided
if [ -z "$NAME" ]; then
    NAME=$(basename "$URL" .git)
fi

# Detect default branch
echo "Detecting default branch for $NAME..."
DEFAULT_BRANCH=$(git ls-remote --symref "$URL" HEAD 2>/dev/null | grep "ref:" | sed 's/.*refs\/heads\/\([^[:space:]]*\).*/\1/')

if [ -z "$DEFAULT_BRANCH" ]; then
    # Fallback: try common branch names
    for branch in main master develop; do
        if git ls-remote --exit-code --heads "$URL" "$branch" &>/dev/null; then
            DEFAULT_BRANCH="$branch"
            break
        fi
    done
fi

if [ -z "$DEFAULT_BRANCH" ]; then
    echo "❌ Could not detect default branch for $URL"
    exit 1
fi

echo "Using branch: $DEFAULT_BRANCH"

# Determine submodule path
SUBMODULE_PATH="repos/$NAME"

# Check if already exists
if [ -d "$SUBMODULE_PATH" ]; then
    echo "⚠️  $SUBMODULE_PATH already exists, skipping"
    exit 0
fi

# Add submodule
echo "Adding submodule..."
git submodule add -b "$DEFAULT_BRANCH" "$URL" "$SUBMODULE_PATH"

# Configure update = none
git config -f .gitmodules "submodule.$SUBMODULE_PATH.update" none

echo "✅ Added $NAME (branch: $DEFAULT_BRANCH, update: none)"
