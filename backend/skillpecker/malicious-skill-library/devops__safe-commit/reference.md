# Safe Commit - Detailed Reference

This document contains detailed examples, troubleshooting, and advanced usage for the safe-commit skill.

## Conventional Commit Types

| Type | Usage | Example |
|------|-------|---------|
| `feat` | New feature | `feat(news): add news listing page` |
| `fix` | Bug fix | `fix(cache): resolve stale response cache` |
| `refactor` | Code restructuring | `refactor(api): extract shared logic to helper` |
| `style` | CSS/formatting | `style(button): update hover effects` |
| `docs` | Documentation | `docs(readme): add deployment instructions` |
| `test` | Tests | `test(auth): add login flow tests` |
| `chore` | Build/tools | `chore(deps): update Laravel to 12.1` |

## Detailed Examples

### Example 1: Feature Implementation

**Scenario**: Added news listing page with filters

**Files changed**:
- `laravel/app/Http/Controllers/NewsController.php`
- `laravel/resources/js/pages/news.tsx`
- `laravel/app/Http/Resources/PostResource.php`

**Command**:
```bash
bash .claude/skills/safe-commit/scripts/commit.sh \
  "feat(news): [ANTIGRAVITY] add news listing page with filters" \
  "- Implement NewsController with pagination and filtering
- Create React news page component with TypeScript types
- Add PostResource for data formatting
- Add route for /news endpoint"
```

**Manual equivalent**:
```bash
USER_EMAIL=$(git config user.email)
git add laravel/app/Http/Controllers/NewsController.php
git add laravel/resources/js/pages/news.tsx
git add laravel/app/Http/Resources/PostResource.php

bash .claude/skills/safe-commit/scripts/validate.sh

git commit --author="AntiGravity <$USER_EMAIL>" -m "feat(news): [ANTIGRAVITY] add news listing page with filters

- Implement NewsController with pagination and filtering
- Create React news page component with TypeScript types
- Add PostResource for data formatting
- Add route for /news endpoint

Co-Authored-By: AntiGravity <noreply@example.com>"
```

### Example 2: Bug Fix

**Scenario**: Fixed cache not clearing after build

**Files changed**:
- `laravel/resources/docs/test.md`
- `.claude/skills/laravel-frontend-deploy/Skill.md`

**Command**:
```bash
bash .claude/skills/safe-commit/scripts/commit.sh \
  "fix(deploy): [ANTIGRAVITY] add response cache clearing after build" \
  "- Update deployment documentation
- Add cache clearing step to deploy skill
- Document requirement in test.md"
```

### Example 3: Refactoring

**Scenario**: Extracted reusable Button component

**Files changed**:
- `laravel/resources/js/components/ui/Button.tsx` (new)
- `laravel/resources/js/pages/home.tsx`
- `laravel/resources/js/pages/about.tsx`

**Command**:
```bash
bash .claude/skills/safe-commit/scripts/commit.sh \
  "refactor(components): [ANTIGRAVITY] extract reusable Button component" \
  "- Create Button component with TypeScript interface
- Update home and about pages to use new Button
- Add variant props for primary/secondary styles"
```

### Example 4: Documentation Update

**Scenario**: Updated AGENTS.md with git commit policy

**Files changed**:
- `AGENTS.md`
- `.claude/skills/safe-commit/SKILL.md`

**Command**:
```bash
bash .claude/skills/safe-commit/scripts/commit.sh \
  "docs(git): [ANTIGRAVITY] add safe commit policy and skill" \
  "- Add Git Commit Policy section to AGENTS.md
- Create safe-commit skill with security validation
- Add Traditional Chinese language preference
- Remove absolute paths from examples"
```

## Security Validation Details

### What Gets Checked

The `validate.sh` script checks for:

1. **API Keys/Tokens** (CRITICAL)
   - Pattern: `api_key`, `secret`, `password`, `token` + `=` + alphanumeric value
   - Examples caught:
     ```
     API_KEY=sk-abc123xyz789
     SECRET_TOKEN=ghp_1234567890abcdef
     BEARER_TOKEN=eyJhbGciOiJIUzI1NiIs...
     ```

2. **Absolute Paths** (CRITICAL)
   - Pattern: `/root/`, `/home/`, `/var/`, `/usr/`, `C:\Users\`, etc.
   - Examples caught:
     ```
     const LOG_PATH = "/home/developer/project/storage/logs"
     LOG_DIR=/var/www/myapp/logs
     ```

3. **Private Domains/IPs** (WARNING)
   - Pattern: `localhost:`, `.local`, `.test`, `.dev`, `127.0.0.1`, private IPs
   - Examples caught:
     ```
     API_URL=https://internal-api.company.local
     DB_HOST=192.168.1.100
     ```
   - Note: This is a WARNING, not a failure (may be intentional)

4. **.env Values** (CRITICAL)
   - Pattern: Any `KEY=value` in `.env*` files
   - Only structure (empty values) is allowed:
     ```
     ✅ DB_HOST=
     ✅ DB_PASSWORD=
     ❌ DB_PASSWORD=MySecret123
     ```

5. **Database Credentials** (CRITICAL)
   - Pattern: `DB_PASSWORD`, `DATABASE_PASSWORD`, etc. with non-empty values
   - Examples caught:
     ```
     DB_PASSWORD=secret123
     MYSQL_ROOT_PASSWORD=rootpass
     ```

### Security Check Examples

**Pass Example**:
```diff
+ const UPLOAD_DIR = "public/uploads"
+ const API_URL = "https://api.example.com"
+ DB_HOST=
+ DB_DATABASE=
```

**Fail Example**:
```diff
+ const LOG_PATH = "/home/user/project/storage/logs"
+ const API_KEY = "sk-abc123xyz789"
+ DB_PASSWORD=MySecretPassword123
+ API_URL=https://internal.company.local
```

## Troubleshooting

### Problem: Security Validation Fails

**Symptom**:
```
✗ FAILED
Found potential API keys or tokens:
+ const API_KEY = "sk-abc123xyz789"
```

**Solution**:
1. Remove the sensitive data from your changes
2. If it's configuration, use environment variables
3. Update `.gitignore` to prevent future commits
4. Use `.env.example` for structure only

**Example Fix**:
```diff
# Before (REJECTED)
+ const API_KEY = "sk-abc123xyz789"

# After (ACCEPTED)
+ const API_KEY = process.env.VITE_API_KEY
```

### Problem: Author Name Wrong After Commit

**Symptom**:
```bash
git log -1 --format='%an'
# Shows: Your Name (not $AGENT_NAME)
```

**Cause**: Forgot to use `--author` parameter

**Solution**: Amend the commit (ONLY if not pushed):
```bash
USER_EMAIL=$(git config user.email)
git commit --amend --author="$AGENT_NAME <$USER_EMAIL>" --no-edit
```

### Problem: Missing [ANTIGRAVITY] Prefix

**Symptom**:
```bash
git log -1 --format='%s'
# Shows: feat(news): add page (missing [ANTIGRAVITY])
```

**Solution**: Amend the commit message:
```bash
git commit --amend -m "$(git log -1 --format='%s')

$(git log -1 --format='%b')"
```

### Problem: Committed Absolute Path by Mistake

**Symptom**: Already committed file with `/root/...` path

**Solution** (if not pushed):
```bash
# 1. Reset to previous commit (keep changes)
git reset HEAD~1

# 2. Fix the file (replace actual path with relative path)
sed -i 's|/actual/project/path|.|g' file.php

# 3. Re-stage and commit
git add file.php
AGENT_NAME=AntiGravity AGENT_TAG=ANTIGRAVITY bash .claude/skills/safe-commit/scripts/commit.sh "fix: [ANTIGRAVITY] remove absolute paths" "..."
```

### Problem: Need to Commit Multiple Unrelated Changes

**Recommendation**: Create separate commits for each logical change

**Example**:
```bash
# Commit 1: Feature
git add laravel/app/Http/Controllers/NewsController.php
git add laravel/resources/js/pages/news.tsx
bash .claude/skills/safe-commit/scripts/commit.sh \
  "feat(news): [ANTIGRAVITY] add news page" "..."

# Commit 2: Bug fix
git add laravel/app/Http/Controllers/HomeController.php
bash .claude/skills/safe-commit/scripts/commit.sh \
  "fix(home): [ANTIGRAVITY] resolve image loading issue" "..."
```

## Advanced Usage

### Using Scripts Directly

**Validate only** (without committing):
```bash
git add file1.php file2.tsx
bash .claude/skills/safe-commit/scripts/validate.sh
```

**Commit with multi-line body**:
```bash
bash .claude/skills/safe-commit/scripts/commit.sh \
  "feat(api): add user authentication endpoints" \
  "- Add POST /api/login endpoint
- Add POST /api/register endpoint
- Add POST /api/logout endpoint
- Implement JWT token generation
- Add user authentication middleware"
```

### Checking Git History

**View recent AntiGravity commits**:
```bash
git log --author="AntiGravity" --oneline -10
```

**View commits with [ANTIGRAVITY] prefix**:
```bash
git log --grep="\[ANTIGRAVITY\]" --oneline -10
```

**Show full commit details**:
```bash
git log -1 --format=fuller
```

### Pre-commit Validation Only

If you want to validate before deciding to commit:

```bash
# Stage your files
git add file1.php file2.tsx

# Run validation
bash .claude/skills/safe-commit/scripts/validate.sh

# If passed, commit manually or with script
```

## Integration with Other Tools

### With Laravel Frontend Deploy Skill

```bash
# 1. Make changes to React components
# 2. Build frontend
cd laravel
npm run build

# 3. Stage changes
git add resources/js/pages/news.tsx
git add public/build/assets/

# 4. Commit with safe-commit
bash .claude/skills/safe-commit/scripts/commit.sh \
  "feat(frontend): [ANTIGRAVITY] update news page UI" \
  "- Update news card styling
- Add loading skeleton
- Rebuild assets"

# 5. Deploy (clear cache)
docker exec php8.2 bash -c "cd /data/www/[project]/laravel && php artisan responsecache:clear"
```

### With Git Hooks

You can integrate `validate.sh` as a pre-commit hook:

```bash
# .git/hooks/pre-commit
#!/bin/bash
bash .claude/skills/safe-commit/scripts/validate.sh
```

## Best Practices

1. **Commit Frequently**: Small, focused commits are better than large ones
2. **Use Descriptive Scopes**: `feat(news)` not `feat(page)`
3. **Write Clear Bodies**: Explain what changed and why
4. **Review Diffs**: Always check `git diff --cached` before committing
5. **Validate Early**: Run `validate.sh` before writing commit message
6. **One Logical Change**: Each commit should represent one logical change
7. **Keep History Clean**: Don't commit debug code, console.logs, or commented code

## Common Patterns

### Pattern 1: Controller + Page + Resource

```bash
git add app/Http/Controllers/NewsController.php
git add resources/js/pages/news.tsx
git add app/Http/Resources/PostResource.php
bash .claude/skills/safe-commit/scripts/commit.sh \
  "feat(news): implement news listing feature" \
  "- Add NewsController with pagination
- Create React news page
- Add PostResource for data formatting"
```

### Pattern 2: Bug Fix + Test

```bash
git add app/Services/CacheService.php
git add tests/Unit/CacheServiceTest.php
bash .claude/skills/safe-commit/scripts/commit.sh \
  "fix(cache): prevent cache key collisions" \
  "- Add namespace prefix to cache keys
- Add test for key collision prevention"
```

### Pattern 3: Documentation Update

```bash
git add AGENTS.md
git add laravel/resources/docs/test.md
bash .claude/skills/safe-commit/scripts/commit.sh \
  "docs(workflow): update testing documentation" \
  "- Add deployment workflow to AGENTS.md
- Update test.md with new commands"
```

## Quick Reference

**Validate staged changes**:
```bash
bash .claude/skills/safe-commit/scripts/validate.sh
```

**Create commit**:
```bash
bash .claude/skills/safe-commit/scripts/commit.sh "type(scope): title" "- body"
```

**Verify commit**:
```bash
git log -1 --format='%an: %s'
# Expected: $AGENT_NAME: type(scope): [ANTIGRAVITY] title
```

**View commit history**:
```bash
git log --author="$AGENT_NAME" --oneline -10
```
