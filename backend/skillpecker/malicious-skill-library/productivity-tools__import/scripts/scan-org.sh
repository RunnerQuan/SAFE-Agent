#!/usr/bin/env bash
# Scan a GitHub org/user for repositories
# Usage: scan-org.sh <org> [github-host]
# Example: scan-org.sh my-org
# Example: scan-org.sh my-org github.mycompany.com

set -euo pipefail

ORG="$1"
HOST="${2:-github.com}"

echo "Scanning $HOST/$ORG for repositories..."

if [ "$HOST" = "github.com" ]; then
    # Use gh CLI for github.com
    if ! command -v gh &>/dev/null; then
        echo "❌ gh CLI not found. Install with: brew install gh"
        exit 1
    fi

    gh repo list "$ORG" --limit 200 --json name,url,defaultBranchRef --jq '.[] | "\(.url) \(.defaultBranchRef.name // "main")"'
else
    # For GitHub Enterprise, use the API directly
    if ! command -v gh &>/dev/null; then
        echo "❌ gh CLI not found. Install with: brew install gh"
        exit 1
    fi

    GH_HOST="$HOST" gh api "/orgs/$ORG/repos?per_page=100" --paginate --jq '.[] | "https://'"$HOST"'/\(.full_name).git \(.default_branch)"'
fi
