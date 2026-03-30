---
name: repo-map
description: Comprehensive reference for understanding any repo fast. All patterns for docs, code, configs, git, and conversation history. The complete playbook.
allowed-tools: Bash, Read, Grep, Glob
---

# Repo Map - Complete Understanding Playbook

Everything you need to understand a repository in minimal tokens.

## The 5 Dimensions of Repo Understanding

| Dimension | What | Skills |
|-----------|------|--------|
| **History** | What was I working on? | search-history |
| **Docs** | What should I know? | index-docs |
| **Code** | How does it work? | codebase-index |
| **Config** | How is it configured? | read-configs |
| **Git** | What's the current state? | (built-in) |

---

## 1. DOCUMENTATION PATTERNS

### Headings

| Level | Pattern | Command |
|-------|---------|---------|
| H1 | `# Title` | `grep -rn "^# " --include="*.md"` |
| H2 | `## Section` | `grep -rn "^## " --include="*.md"` |
| H3 | `### Subsection` | `grep -rn "^### " --include="*.md"` |
| H1+H2 | Combined | `grep -rn "^##\? " --include="*.md"` |
| H1+H2+H3 | All | `grep -rn "^###\?\? " --include="*.md"` |

### Markdown Elements

| Element | Command |
|---------|---------|
| Mermaid diagrams | `grep -rln "mermaid" --include="*.md"` |
| Code blocks | `grep -rn '^```[a-z]' --include="*.md"` |
| Code block languages | `grep -roh '^```[a-z]*' --include="*.md" \| sort \| uniq -c \| sort -rn` |
| Tables | `grep -rn "^|.*|" --include="*.md"` |
| Links | `grep -ron "\[.*\](.*)" --include="*.md"` |
| Images | `grep -ron "!\[.*\](.*)" --include="*.md"` |
| TODOs | `grep -rn "TODO\|FIXME\|XXX" --include="*.md"` |
| Checkboxes | `grep -rn "\[ \]\|\[x\]" --include="*.md"` |

### Key Doc Files

```bash
ls -la README.md CLAUDE.md CONTRIBUTING.md CHANGELOG.md LICENSE 2>/dev/null
ls -la docs/ doc/ documentation/ 2>/dev/null
```

---

## 2. CODE PATTERNS

### Entry Points

| Language | Pattern | Command |
|----------|---------|---------|
| Python | `if __name__` | `rg "if __name__" --type py -l` |
| Go | `func main()` | `rg "^func main" --type go -l` |
| Node | `module.exports` | `rg "module\.exports" --type js -l` |
| TypeScript | `export default` | `rg "^export default" --type ts -l` |

### API Routes

| Framework | Command |
|-----------|---------|
| FastAPI | `rg "@(app\|router)\.(get\|post\|put\|delete)" --type py -n` |
| Flask | `rg "@.*\.route\(" --type py -n` |
| Express | `rg "(app\|router)\.(get\|post\|put\|delete)\(" --type js -n` |
| Cloud Functions | `rg "functions_framework" --type py -n` |

### Definitions

| What | Command |
|------|---------|
| Python classes | `rg "^class " --type py -n` |
| Python functions | `rg "^def " --type py -n` |
| TS/JS classes | `rg "^(export )?class " --type ts -n` |
| TS interfaces | `rg "^(export )?interface " --type ts -n` |
| Go structs | `rg "^type .* struct" --type go -n` |

### Models & Schemas

| ORM/Framework | Command |
|---------------|---------|
| SQLAlchemy | `rg "class.*\(.*Base\)" --type py -n` |
| Pydantic | `rg "class.*BaseModel" --type py -n` |
| Django | `rg "models\.Model" --type py -n` |
| Prisma | `rg "^model " --glob "*.prisma"` |

### Imports & Dependencies

```bash
# Most used Python packages
rg "^(from\|import) " --type py | cut -d' ' -f2 | cut -d'.' -f1 | sort | uniq -c | sort -rn | head -20

# Most used JS/TS imports
rg "^import .* from" --type ts --type js | grep -oP "from ['\"].*?['\"]" | sort | uniq -c | sort -rn | head -20
```

### Decorators & Patterns

```bash
# Python decorators
rg "^@\w+" --type py | cut -d':' -f2 | sort | uniq -c | sort -rn | head -15

# Error classes
rg "class.*Exception|class.*Error\(" --type py -n
```

---

## 3. CONFIG PATTERNS

### Project Configs

| Type | Files | Command |
|------|-------|---------|
| Python | `pyproject.toml`, `setup.py` | `ls pyproject.toml setup.py 2>/dev/null` |
| Node | `package.json`, `tsconfig.json` | `ls package.json tsconfig*.json 2>/dev/null` |
| Go | `go.mod`, `go.sum` | `ls go.mod go.sum 2>/dev/null` |

### Environment

```bash
# Find env files
ls -la .env* env.* 2>/dev/null

# Env var names (NOT values)
grep -h "^[A-Z]" .env* 2>/dev/null | cut -d'=' -f1 | sort | uniq
```

### Cloud & CI/CD

```bash
# GCP
ls app.yaml cloudbuild.yaml *.tf 2>/dev/null

# GitHub Actions
ls .github/workflows/*.y*ml 2>/dev/null

# Docker
ls Dockerfile docker-compose*.yml 2>/dev/null
```

### Build Tools

```bash
ls Makefile BUILD.bazel *.bzl 2>/dev/null
```

---

## 4. GIT PATTERNS

```bash
# Current state
git status --short | head -20

# Current branch
git branch -v | grep "^\*"

# Recent commits
git log --oneline -10

# Changed files (staged)
git diff --cached --name-only

# Contributors
git shortlog -sn | head -10
```

---

## 5. CONVERSATION HISTORY

```bash
cd ~/.claude/services

# Recent sessions
python3 conversation-search.py --list-sessions | head -5

# Search for topic
python3 conversation-search.py "TOPIC" --max 3 --full

# Last exchanges
python3 conversation-search.py "." --session SESSION_ID --max 10 --full
```

---

## QUICK REFERENCE CARD

### Minimal Startup (30 sec)

```bash
# 1. Sessions
cd ~/.claude/services && python3 conversation-search.py --list-sessions | head -3

# 2. Doc headings
cd - && find . -name "*.md" -not -path "*/.git/*" | xargs grep -n "^# " 2>/dev/null | head -20

# 3. Entry points
rg "if __name__|^func main" --type py --type go -l 2>/dev/null | head -5

# 4. Git state
git status --short | head -10
```

### Full Startup (60 sec)

```bash
echo "=== HISTORY ===" && cd ~/.claude/services && python3 conversation-search.py --list-sessions | head -3
echo "=== DOCS ===" && cd - > /dev/null && find . -name "*.md" -not -path "*/.git/*" | xargs grep -n "^# " 2>/dev/null | head -20
echo "=== ENTRY POINTS ===" && rg "if __name__|^func main" --type py --type go -l 2>/dev/null | head -5
echo "=== CLASSES ===" && rg "^class " --type py -c 2>/dev/null | head -10
echo "=== CONFIGS ===" && ls pyproject.toml package.json app.yaml .env* 2>/dev/null
echo "=== GIT ===" && git status --short | head -10 && git branch -v | grep "^\*"
```

---

## Token Budget Guide

| Action | Tokens | When |
|--------|--------|------|
| List files | ~50 | Always |
| Grep headings | ~100-200 | Always |
| Count classes | ~50-100 | Always |
| Read one file | ~500-2000 | When needed |
| Full file content | ~2000+ | Rarely |

**Rule: Index everything, read selectively.**

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| startup | Master bootstrap sequence |
| post-compact | Context recovery |
| index-docs | Doc structure |
| codebase-index | Code architecture |
| read-configs | Config discovery |
| search-history | Conversation context |
