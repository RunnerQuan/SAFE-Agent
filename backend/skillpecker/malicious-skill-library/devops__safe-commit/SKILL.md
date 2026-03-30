---
name: safe-commit
description: Safely create git commits with an agent tag prefix (e.g. [ANTIGRAVITY], [CODEX], [CLAUDE]), security validation, and proper user config. Use when committing code changes, creating commits, or when user says "commit", "save changes", or "git commit".
allowed-tools:
  - Bash
  - Read
  - Grep
---

# Safe Git Commit

## Purpose

Ensures all git commits follow security best practices with automatic validation for sensitive data. Uses `--author` parameter to avoid modifying `.git/config`.

## When to Use

- User requests to commit changes
- After completing a feature or bug fix
- When user says "commit", "save changes", "create commit"

## Complete Commit Workflow

### Step 1: Review Changes (Codex MUST Do This First)

```bash
# Show all modified files
git status --short

# Review staged changes in detail
git diff --cached
```

**Codex MUST manually review the diff output and verify:**
- No actual project absolute paths (generic examples are OK)
- No internal/private domains or IPs
- No API keys or credentials
- No sensitive company/infrastructure information
- Context matters - use judgment based on project knowledge

### Step 2: Stage Files (Only Changed Files for This Task)

```bash
# Stage specific files modified in current task
git add file1.php
git add file2.tsx
```

**NEVER use:**
- `git add .` - Too broad
- `git add -A` - Stages everything
- `git add *` - Uncontrolled

### Step 3: Run Automated Validation

```bash
# Automated security checks
bash .claude/skills/safe-commit/scripts/validate.sh
```

Script checks for common patterns (but Codex's manual review in Step 1 is still required).

### Step 4: Create Commit

**Option A: Using Helper Script (Recommended)**

```bash
bash .claude/skills/safe-commit/scripts/commit.sh \
  "feat(feature): brief description" \
  "- Detailed change 1
- Detailed change 2
- Detailed change 3"
```

You can set the commit author name with `AGENT_NAME` (default: `Codex`) and commit tag with `AGENT_TAG` (default derived from `AGENT_NAME`, e.g. `AntiGravity` → `ANTIGRAVITY`):

```bash
AGENT_NAME=AntiGravity AGENT_TAG=ANTIGRAVITY bash .claude/skills/safe-commit/scripts/commit.sh \
  "docs(git): [ANTIGRAVITY] update safe-commit author/tag" \
  "- Allow configurable commit author via AGENT_NAME\n- Allow configurable commit tag via AGENT_TAG"
```

**Option B: Manual Commit**

```bash
USER_EMAIL=$(git config user.email)

git commit --author="AntiGravity <$USER_EMAIL>" -m "type(scope): [ANTIGRAVITY] description

- Change details

Co-Authored-By: AntiGravity <noreply@example.com>"
```

### Step 5: Verify Commit

```bash
# Check author and message
git log -1 --format='%an: %s'
# Expected: AntiGravity: [ANTIGRAVITY] type(scope): description
```

## Critical Security Rules

### Automated Validation (Script)

The `validate.sh` script performs basic pattern matching:
- API key/token patterns
- Absolute path patterns
- .env value patterns
- Database credential patterns

### Manual Validation (Codex MUST Review)

Before committing, Codex MUST manually review `git diff --cached` and check:

❌ **MUST NOT include**:
1. **API Keys/Tokens/Secrets**
   - AWS keys (AKIA..., aws_secret_access_key)
   - GitHub tokens (ghp_..., github_token)
   - JWT tokens, Bearer tokens
   - Third-party API keys (Stripe, SendGrid, etc.)
   - Encryption keys, private keys

2. **Absolute File Paths** (Context-dependent)
   - ✅ OK: Documentation examples using generic paths (`/home/username/...`)
   - ❌ REJECT: Actual project paths (`/root/liveserver2024/...`, `/var/www/official-en-aia/...`)
   - Check if path reveals sensitive infrastructure information

3. **Private Domains/Internal URLs** (Context-dependent)
   - ✅ OK: Public testing domains (e.g., `example.com`, `test.example.com`)
   - ❌ REJECT: Internal infrastructure (e.g., `internal-api.company.local`, `10.0.0.5`)
   - Check if domain reveals company/project private information

4. **.env File Values**
   - ✅ OK: Empty structure (`DB_HOST=`, `API_KEY=`)
   - ❌ REJECT: Any actual values (`DB_PASSWORD=secret123`)

5. **Database Credentials**
   - Any connection strings with passwords
   - Database URLs with credentials
   - Redis/Memcached auth tokens

6. **Other Sensitive Data**
   - Email addresses (except in git metadata)
   - Phone numbers
   - Physical addresses
   - Internal server IPs
   - Docker container paths revealing infrastructure

### Commit Requirements

✅ **MUST include**:
- `[$AGENT_TAG]` tag in description: `type(scope): [$AGENT_TAG] description`
- Conventional commit format maintained
- `Co-Authored-By: <AgentName> <noreply@example.com>` footer
- `--author="<AgentName> <email>"` parameter (does NOT modify `.git/config`)

## Commit Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `style` | CSS/formatting changes |
| `docs` | Documentation updates |
| `test` | Test additions |
| `chore` | Build process, dependencies |

## Example Usage

```bash
# Feature commit
git add app/Http/Controllers/NewsController.php resources/js/pages/news.tsx
bash .claude/skills/safe-commit/scripts/commit.sh \
  "feat(news): [$AGENT_TAG] add news listing page with filters" \
  "- Implement NewsController with pagination
- Create React news page component
- Add PostResource for data formatting"

# Bug fix commit
git add laravel/config/cache.php
bash .claude/skills/safe-commit/scripts/commit.sh \
  "fix(cache): [$AGENT_TAG] resolve response cache not clearing" \
  "- Update cache configuration
- Add cache clear to deployment workflow"
```

## Validation Script

The `validate.sh` script performs these checks:

### Phase 1: Regex-based Checks (Fast)
1. ✓ Staged changes exist
2. ✓ No API keys/tokens/secrets
3. ✓ No absolute file paths
4. ⚠ No private domains (warning only)
5. ✓ No .env variable values
6. ✓ No database credentials

### Phase 2: AI-powered Validation (Optional)

When enabled, uses Codex CLI for intelligent sensitive data detection:

**Environment Variables:**
| Variable | Values | Description |
|----------|--------|-------------|
| `USE_AI_VALIDATION` | `1` (default if codex installed), `0` | Enable/disable AI validation |
| `AI_VALIDATOR` | `codex` (default), `gemini`, `copilot` | Which AI tool to use |
| `MAX_DIFF_SIZE` | `51200` (default) | Max diff size in bytes for AI validation |

**Usage Examples:**
```bash
# Use Codex for AI validation (default)
USE_AI_VALIDATION=1 bash .claude/skills/safe-commit/scripts/validate.sh

# Use Gemini for AI validation
AI_VALIDATOR=gemini bash .claude/skills/safe-commit/scripts/validate.sh

# Use GitHub Copilot for AI validation
AI_VALIDATOR=copilot bash .claude/skills/safe-commit/scripts/validate.sh

# Disable AI validation (regex only, faster)
USE_AI_VALIDATION=0 bash .claude/skills/safe-commit/scripts/validate.sh

# Set max diff size for AI validation (default 50KB)
MAX_DIFF_SIZE=102400 bash .claude/skills/safe-commit/scripts/validate.sh
```

**AI Validation Features:**
- Uses `codex exec --sandbox read-only` for secure execution
- 60-second timeout to prevent hanging
- Automatic skip if diff exceeds MAX_DIFF_SIZE (saves API costs)
- Falls back to regex-only if Codex fails or times out

**Exit codes**:
- `0`: All checks passed
- `1`: Security violation found (commit blocked)

## Verification

After committing, verify:

```bash
# Check author name
git log -1 --format='%an'
# Expected: Codex (or $AGENT_NAME)

# Check commit message
git log -1 --format='%s'
# Expected: type(scope): [$AGENT_TAG] description

# View full commit
git log -1 --format='%B'
```

## Important Limitations

**This skill handles commits ONLY. Do NOT**:
- Push to remote (`git push`) - User must do manually
- Pull from remote (`git pull`) - User must do manually
- Merge branches (`git merge`) - User must do manually
- Rebase commits (`git rebase`) - User must do manually
- Modify `.git/config` - Use `--author` parameter instead

## Detailed Documentation

For more details, see:
- [reference.md](reference.md) - Examples, troubleshooting, advanced usage
- [scripts/validate.sh](scripts/validate.sh) - Security validation script
- [scripts/commit.sh](scripts/commit.sh) - Commit helper script
- `AGENTS.md` - Project-wide git commit policy

## Integration with AGENTS.md

This skill implements the Git Commit Policy defined in `AGENTS.md` (Git Commit Policy section).

## Success Criteria

✅ Commit created with `[$AGENT_TAG]` tag in description
✅ Author name matches `$AGENT_NAME` (default: `Codex`)
✅ Security validation passed
✅ Only relevant files staged
✅ Conventional commit format maintained (type at start)
✅ Co-Authored-By footer present
✅ `.git/config` NOT modified
