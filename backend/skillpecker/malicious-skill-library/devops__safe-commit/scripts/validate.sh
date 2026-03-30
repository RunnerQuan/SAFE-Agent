#!/bin/bash
# Security validation script for git commits
# Usage: bash scripts/validate.sh
#
# Environment variables:
#   USE_AI_VALIDATION=1      - Enable AI-powered validation using Codex (default: 1 if codex available)
#   USE_AI_VALIDATION=0      - Use regex-only validation (faster, no API calls)
#   AI_VALIDATOR=codex       - Use Codex CLI for AI validation (default)
#   AI_VALIDATOR=gemini      - Use Gemini CLI for AI validation
#   AI_VALIDATOR=copilot     - Use GitHub Copilot CLI for AI validation

set -e

# Setup logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/validate_${TIMESTAMP}.log"

# Function to log and print
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if codex is available
CODEX_AVAILABLE=0
if command -v codex &> /dev/null; then
    CODEX_AVAILABLE=1
fi

# Determine if AI validation should be used
# Default: use AI if codex is available, unless explicitly disabled
if [ -z "$USE_AI_VALIDATION" ]; then
    USE_AI_VALIDATION=$CODEX_AVAILABLE
fi

# Default AI validator is codex
AI_VALIDATOR=${AI_VALIDATOR:-codex}

log "🔍 Running security validation on staged changes..."
log "Log file: $LOG_FILE"
log "AI Validation: $([ "$USE_AI_VALIDATION" = "1" ] && echo "enabled ($AI_VALIDATOR)" || echo "disabled (regex only)")"
log ""

# Check if there are staged changes
if ! git diff --cached --quiet; then
    log "✓ Found staged changes"
else
    log -e "${RED}✗ No staged changes found${NC}"
    log "Please stage files with: git add <files>"
    exit 1
fi

log ""
log "Checking for sensitive data patterns..."

# 1. Check for API keys, tokens, secrets (only in actual added lines, skip documentation examples)
echo -n "  - API keys/tokens/secrets... " | tee -a "$LOG_FILE"
if git diff --cached | grep -E '^\+[^+]' | grep -v -E '^\+\s{2,}' | grep -qiE '(api[_-]?key|secret|password|token|auth[_-]?token|private[_-]?key|access[_-]?key|bearer[_ ]|jwt[_ ]).*[=:].*[a-zA-Z0-9]{8,}'; then
    echo -e "${RED}FAILED${NC}" | tee -a "$LOG_FILE"
    log -e "${RED}    Found potential API keys or tokens:${NC}"
    git diff --cached | grep -E '^\+[^+]' | grep -v -E '^\+\s{2,}' | grep -iE '(api[_-]?key|secret|password|token|auth[_-]?token|private[_-]?key|access[_-]?key)' | head -5 | tee -a "$LOG_FILE"
    exit 1
else
    echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
fi

# 2. Check for absolute paths (only in actual code, skip markdown/documentation/examples)
echo -n "  - Absolute file paths... " | tee -a "$LOG_FILE"
# Skip lines that are:
# - Starting with +#, +-, +*, +space (documentation/comments)
# - In .md files
# - Containing "e.g." or "(e.g." (examples in documentation)
# - Containing "/username/" or "placeholder" (generic examples)
if git diff --cached | grep -E '^\+[^+#\-\* ]' | grep -v '\.md' | grep -v 'e\.g\.' | grep -v '/username/' | grep -v 'placeholder' | grep -qE '/(root|home|var|usr|opt)/|C:\\(Users|Program|Windows)\\'; then
    echo -e "${RED}FAILED${NC}" | tee -a "$LOG_FILE"
    log -e "${RED}    Found absolute paths in actual code:${NC}"
    git diff --cached | grep -E '^\+[^+#\-\* ]' | grep -v '\.md' | grep -v 'e\.g\.' | grep -v '/username/' | grep -v 'placeholder' | grep -E '/(root|home|var|usr|opt)/|C:\\(Users|Program|Windows)\\' | head -5 | tee -a "$LOG_FILE"
    exit 1
else
    echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
fi

# 3. Check for private domains
echo -n "  - Private domains/IPs... " | tee -a "$LOG_FILE"
if git diff --cached | grep -qE '\+.*(localhost:[0-9]+|\.local|\.test|\.dev|127\.0\.0\.1|0\.0\.0\.0|internal\.|private\.|192\.168\.|10\.[0-9]+\.)'; then
    echo -e "${YELLOW}WARNING${NC}" | tee -a "$LOG_FILE"
    log -e "${YELLOW}    Found potential private domains/IPs:${NC}"
    git diff --cached | grep -E '\+.*(localhost:[0-9]+|\.local|\.test|\.dev|127\.0\.0\.1|0\.0\.0\.0|internal\.|private\.)' | head -3 | tee -a "$LOG_FILE"
    log -e "${YELLOW}    Please verify these are not sensitive${NC}"
    # Don't exit, just warn
else
    echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
fi

# 4. Check for .env file values
echo -n "  - .env variable values... " | tee -a "$LOG_FILE"
if git diff --cached -- '*.env*' | grep -qE '^\+[A-Z_]+=.+'; then
    echo -e "${RED}FAILED${NC}" | tee -a "$LOG_FILE"
    log -e "${RED}    Found .env variable values:${NC}"
    git diff --cached -- '*.env*' | grep -E '^\+[A-Z_]+=' | head -5 | tee -a "$LOG_FILE"
    log -e "${RED}    Only .env structure (keys without values) should be committed${NC}"
    exit 1
else
    echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
fi

# 5. Check for database credentials (only in actual code, skip documentation)
echo -n "  - Database credentials... " | tee -a "$LOG_FILE"
if git diff --cached | grep -E '^\+[^+#\-\* ]' | grep -v '\.md' | grep -qiE '(DB_PASSWORD|DATABASE_PASSWORD|MYSQL_PASSWORD|POSTGRES_PASSWORD).*=.*[^ ]'; then
    echo -e "${RED}FAILED${NC}" | tee -a "$LOG_FILE"
    log -e "${RED}    Found database credentials in actual code:${NC}"
    git diff --cached | grep -E '^\+[^+#\-\* ]' | grep -v '\.md' | grep -iE 'DB_PASSWORD|DATABASE_PASSWORD' | head -3 | tee -a "$LOG_FILE"
    exit 1
else
    echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
fi

log ""
log -e "${GREEN}✓ Regex-based security checks passed!${NC}"

# ============================================================================
# AI-Powered Validation (Optional - uses Codex CLI)
# ============================================================================

if [ "$USE_AI_VALIDATION" = "1" ]; then
    log ""
    log -e "${BLUE}🤖 Running AI-powered validation...${NC}"

    # Create temp file for diff content
    DIFF_FILE=$(mktemp)
    git diff --cached > "$DIFF_FILE"
    DIFF_SIZE=$(wc -c < "$DIFF_FILE")

    # Skip AI validation if diff is too large (> 50KB) to avoid excessive API costs
    MAX_DIFF_SIZE=${MAX_DIFF_SIZE:-51200}

    if [ "$DIFF_SIZE" -gt "$MAX_DIFF_SIZE" ]; then
        log -e "${YELLOW}    Diff size ($DIFF_SIZE bytes) exceeds limit ($MAX_DIFF_SIZE bytes)${NC}"
        log -e "${YELLOW}    Skipping AI validation to save API costs${NC}"
        rm -f "$DIFF_FILE"
    elif [ "$AI_VALIDATOR" = "codex" ]; then
        # Use Codex CLI for AI validation
        echo -n "  - AI sensitive data scan (codex)... " | tee -a "$LOG_FILE"

        AI_PROMPT="You are a security auditor reviewing a git diff for sensitive information before commit.

Analyze this git diff and check for:
1. API keys, tokens, secrets, passwords (real values, not placeholders)
2. Absolute file paths that reveal server infrastructure (e.g., /root/..., /home/user/..., /var/www/...)
3. Internal/private domain names or IP addresses
4. Database credentials or connection strings with passwords
5. Personal information (emails, phone numbers, addresses)
6. Cloud credentials (AWS keys, GCP keys, Azure keys)

IMPORTANT: Documentation examples with placeholder paths like '/home/username/...' are OK.
Only flag REAL sensitive data that would be a security risk if committed.

Respond with EXACTLY one of these formats:
- If SAFE: 'SAFE: No sensitive data found'
- If ISSUES: 'ISSUES: [brief description of what was found]'

Do NOT output anything else. Be concise."

        # Run codex exec with the diff as context
        AI_RESULT_FILE=$(mktemp)

        # Use codex exec in read-only sandbox mode
        if timeout 60 codex exec \
            --sandbox read-only \
            -o "$AI_RESULT_FILE" \
            "$AI_PROMPT

Here is the git diff to analyze:

$(cat "$DIFF_FILE")" 2>> "$LOG_FILE"; then

            AI_RESULT=$(cat "$AI_RESULT_FILE" 2>/dev/null || echo "ERROR: Could not read result")

            if echo "$AI_RESULT" | grep -qi "^SAFE:"; then
                echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
                log "    AI: $AI_RESULT"
            elif echo "$AI_RESULT" | grep -qi "^ISSUES:"; then
                echo -e "${RED}FAILED${NC}" | tee -a "$LOG_FILE"
                log -e "${RED}    AI found issues:${NC}"
                log "    $AI_RESULT"
                rm -f "$DIFF_FILE" "$AI_RESULT_FILE"
                exit 1
            else
                # Unexpected response, treat as warning
                echo -e "${YELLOW}WARNING${NC}" | tee -a "$LOG_FILE"
                log -e "${YELLOW}    AI response unclear, please review manually:${NC}"
                log "    $AI_RESULT"
            fi
        else
            echo -e "${YELLOW}SKIPPED${NC}" | tee -a "$LOG_FILE"
            log -e "${YELLOW}    Codex validation timed out or failed${NC}"
            log -e "${YELLOW}    Continuing with regex-only validation${NC}"
        fi

        rm -f "$AI_RESULT_FILE"
        rm -f "$DIFF_FILE"

    elif [ "$AI_VALIDATOR" = "gemini" ]; then
        # Use Gemini CLI for AI validation
        echo -n "  - AI sensitive data scan (gemini)... " | tee -a "$LOG_FILE"

        if ! command -v gemini &> /dev/null; then
            echo -e "${YELLOW}SKIPPED${NC}" | tee -a "$LOG_FILE"
            log -e "${YELLOW}    Gemini CLI not installed${NC}"
            rm -f "$DIFF_FILE"
        else
            AI_RESULT_FILE=$(mktemp)

            if timeout 60 gemini exec \
                -o "$AI_RESULT_FILE" \
                "$AI_PROMPT

Here is the git diff to analyze:

$(cat "$DIFF_FILE")" 2>> "$LOG_FILE"; then

                AI_RESULT=$(cat "$AI_RESULT_FILE" 2>/dev/null || echo "ERROR: Could not read result")

                if echo "$AI_RESULT" | grep -qi "^SAFE:"; then
                    echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
                    log "    AI: $AI_RESULT"
                elif echo "$AI_RESULT" | grep -qi "^ISSUES:"; then
                    echo -e "${RED}FAILED${NC}" | tee -a "$LOG_FILE"
                    log -e "${RED}    AI found issues:${NC}"
                    log "    $AI_RESULT"
                    rm -f "$DIFF_FILE" "$AI_RESULT_FILE"
                    exit 1
                else
                    echo -e "${YELLOW}WARNING${NC}" | tee -a "$LOG_FILE"
                    log -e "${YELLOW}    AI response unclear, please review manually:${NC}"
                    log "    $AI_RESULT"
                fi
            else
                echo -e "${YELLOW}SKIPPED${NC}" | tee -a "$LOG_FILE"
                log -e "${YELLOW}    Gemini validation timed out or failed${NC}"
                log -e "${YELLOW}    Continuing with regex-only validation${NC}"
            fi

            rm -f "$AI_RESULT_FILE"
            rm -f "$DIFF_FILE"
        fi

    elif [ "$AI_VALIDATOR" = "copilot" ]; then
        # Use GitHub Copilot CLI for AI validation
        echo -n "  - AI sensitive data scan (copilot)... " | tee -a "$LOG_FILE"

        if ! command -v gh &> /dev/null || ! gh copilot --version &> /dev/null 2>&1; then
            echo -e "${YELLOW}SKIPPED${NC}" | tee -a "$LOG_FILE"
            log -e "${YELLOW}    GitHub Copilot CLI not installed (requires gh copilot extension)${NC}"
            rm -f "$DIFF_FILE"
        else
            AI_RESULT_FILE=$(mktemp)

            if timeout 60 gh copilot suggest \
                -t shell \
                "$AI_PROMPT

Here is the git diff to analyze:

$(cat "$DIFF_FILE")" > "$AI_RESULT_FILE" 2>> "$LOG_FILE"; then

                AI_RESULT=$(cat "$AI_RESULT_FILE" 2>/dev/null || echo "ERROR: Could not read result")

                if echo "$AI_RESULT" | grep -qi "^SAFE:"; then
                    echo -e "${GREEN}OK${NC}" | tee -a "$LOG_FILE"
                    log "    AI: $AI_RESULT"
                elif echo "$AI_RESULT" | grep -qi "^ISSUES:"; then
                    echo -e "${RED}FAILED${NC}" | tee -a "$LOG_FILE"
                    log -e "${RED}    AI found issues:${NC}"
                    log "    $AI_RESULT"
                    rm -f "$DIFF_FILE" "$AI_RESULT_FILE"
                    exit 1
                else
                    echo -e "${YELLOW}WARNING${NC}" | tee -a "$LOG_FILE"
                    log -e "${YELLOW}    AI response unclear, please review manually:${NC}"
                    log "    $AI_RESULT"
                fi
            else
                echo -e "${YELLOW}SKIPPED${NC}" | tee -a "$LOG_FILE"
                log -e "${YELLOW}    Copilot validation timed out or failed${NC}"
                log -e "${YELLOW}    Continuing with regex-only validation${NC}"
            fi

            rm -f "$AI_RESULT_FILE"
            rm -f "$DIFF_FILE"
        fi

    else
        log -e "${YELLOW}    Unknown AI_VALIDATOR: $AI_VALIDATOR${NC}"
        rm -f "$DIFF_FILE"
    fi
else
    log ""
    log -e "${YELLOW}ℹ AI validation disabled (set USE_AI_VALIDATION=1 to enable)${NC}"
fi

log ""
log -e "${GREEN}✓ All security checks passed!${NC}"
log ""
log "Staged files:"
git diff --cached --name-only | sed 's/^/  - /' | tee -a "$LOG_FILE"

exit 0
