#!/bin/bash
# Safe git commit script with [AGENT_TAG] prefix
# Usage: bash scripts/commit.sh "type(scope): description" "- detail1\n- detail2"

set -e

# Agent identity (configurable)
# Example:
#   AGENT_NAME=AntiGravity AGENT_TAG=ANTIGRAVITY \
#     bash .claude/skills/safe-commit/scripts/commit.sh "docs(git): [ANTIGRAVITY] ..." "..."
AGENT_NAME="${AGENT_NAME:-${CODEX_AGENT_NAME:-Codex}}"
AGENT_NOREPLY_EMAIL="${AGENT_NOREPLY_EMAIL:-noreply@example.com}"
AGENT_TAG="${AGENT_TAG:-${CODEX_AGENT_TAG:-}}"

if [ -z "$AGENT_TAG" ]; then
    case "$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]')" in
        codex) AGENT_TAG="CODEX" ;;
        "claude"|"claude code") AGENT_TAG="CLAUDE" ;;
        copilot) AGENT_TAG="COPILOT" ;;
        *)
            # Default: uppercase and strip non-alphanumeric (AntiGravity -> ANTIGRAVITY)
            AGENT_TAG="$(echo "$AGENT_NAME" | tr '[:lower:]' '[:upper:]' | tr -cd 'A-Z0-9')"
            ;;
    esac
fi

# Setup logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/commit_${TIMESTAMP}.log"

# Function to log and print
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log "=== Safe Commit Script Started ==="
log "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
log "Log file: $LOG_FILE"
log ""

# Check arguments
if [ $# -lt 1 ]; then
    log -e "${RED}Error: Commit message required${NC}"
    log "Usage: bash scripts/commit.sh \"type(scope): description\" \"- detail1\n- detail2\""
    log ""
    log "Example:"
    log "  bash scripts/commit.sh \"feat(news): add news page\" \"- Add NewsController\n- Create React component\""
    exit 1
fi

COMMIT_TITLE="$1"
COMMIT_BODY="${2:-}"

log "Commit title: $COMMIT_TITLE"
if [ -n "$COMMIT_BODY" ]; then
    log "Commit body provided: Yes"
else
    log "Commit body provided: No"
fi
log ""

# Validate commit title has type(scope) format
if ! echo "$COMMIT_TITLE" | grep -qE '^(feat|fix|refactor|style|docs|test|chore)\([a-z-]+\):'; then
    log -e "${YELLOW}Warning: Commit title should follow format: type(scope): [$AGENT_TAG] description${NC}"
    log "Valid types: feat, fix, refactor, style, docs, test, chore"
    log "Example: feat(news): [$AGENT_TAG] add news listing page"
    log ""
fi

# Check if expected [AGENT_TAG] tag is present in description
if ! echo "$COMMIT_TITLE" | grep -qF "[$AGENT_TAG]"; then
    log -e "${YELLOW}Warning: Commit title should include [$AGENT_TAG] tag in description${NC}"
    log "Example: feat(news): [$AGENT_TAG] add news listing page"
    log ""
fi

# Get user email
USER_EMAIL=$(git config user.email)
if [ -z "$USER_EMAIL" ]; then
    log -e "${RED}Error: Git user.email not configured${NC}"
    log "Please run: git config user.email \"your@email.com\""
    exit 1
fi

log -e "${BLUE}Committing as: $AGENT_NAME <$USER_EMAIL>${NC}"
log ""

# Run security validation
log "Running security validation..."
if ! bash "$(dirname "$0")/validate.sh" 2>&1 | tee -a "$LOG_FILE"; then
    log -e "${RED}Security validation failed. Commit aborted.${NC}"
    exit 1
fi

# Build commit message (title already contains [AGENT_TAG] tag)
COMMIT_MSG="$COMMIT_TITLE"

if [ -n "$COMMIT_BODY" ]; then
    COMMIT_MSG="$COMMIT_MSG

$COMMIT_BODY"
fi

COMMIT_MSG="$COMMIT_MSG

Co-Authored-By: $AGENT_NAME <$AGENT_NOREPLY_EMAIL>"

# Show commit message preview
log ""
log "Commit message:"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "$COMMIT_MSG"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log ""

# Create commit
log "Creating commit..."
if git commit --author="$AGENT_NAME <$USER_EMAIL>" -m "$COMMIT_MSG" 2>&1 | tee -a "$LOG_FILE"; then
    log ""
    log -e "${GREEN}✓ Commit created successfully${NC}"
    log ""

    # Show commit details
    log "Commit details:"
    git log -1 --format="%h - %an: %s" | tee -a "$LOG_FILE"
    log ""

    # Verify author name
    AUTHOR_NAME=$(git log -1 --format='%an')
    log "Verifying commit author..."
    log "  Author name: $AUTHOR_NAME"
    if [ "$AUTHOR_NAME" != "$AGENT_NAME" ]; then
        log -e "${RED}  Warning: Author name is '$AUTHOR_NAME', expected '$AGENT_NAME'${NC}"
    else
        log -e "${GREEN}  ✓ Author name correct${NC}"
    fi

    # Verify [AGENT_TAG] tag
    COMMIT_SUBJECT=$(git log -1 --format='%s')
    log "Verifying commit message..."
    log "  Subject: $COMMIT_SUBJECT"
    if ! echo "$COMMIT_SUBJECT" | grep -qF "[$AGENT_TAG]"; then
        log -e "${RED}  Warning: Commit message missing [$AGENT_TAG] tag${NC}"
    else
        log -e "${GREEN}  ✓ [$AGENT_TAG] tag present${NC}"
    fi

    log ""
    log -e "${GREEN}=== Commit Completed Successfully ===${NC}"

else
    log -e "${RED}✗ Commit failed${NC}"
    log "=== Commit Failed ==="
    exit 1
fi
