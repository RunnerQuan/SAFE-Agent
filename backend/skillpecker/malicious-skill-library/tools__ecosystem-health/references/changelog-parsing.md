# Changelog Parsing Reference

This document provides detailed guidance for parsing the Claude Code changelog.

## Accessing the Changelog

The changelog is stored in the docs-management canonical storage:

**Location:** `plugins/claude-ecosystem/skills/docs-management/canonical/raw-githubusercontent-com/anthropics/claude-code/refs/heads/main/CHANGELOG.md`

**Doc ID:** `raw-githubusercontent-com-anthropics-claude-code-refs-heads-main-CHANGELOG`

### Access via docs-management

```bash
# Get full changelog content
python plugins/claude-ecosystem/skills/docs-management/scripts/core/find_docs.py \
  content raw-githubusercontent-com-anthropics-claude-code-refs-heads-main-CHANGELOG
```

### Direct File Access

```bash
# Read directly if needed
cat plugins/claude-ecosystem/skills/docs-management/canonical/raw-githubusercontent-com/anthropics/claude-code/refs/heads/main/CHANGELOG.md
```

## Version Extraction

### Pattern

```text
Regex: ^##\s*\[?(\d+\.\d+\.\d+)\]?
```

This matches:

- `## 2.1.3` → version 2.1.3
- `## [2.1.3]` → version 2.1.3
- `## [2.1.0] - 2026-01-01` → version 2.1.0

### Parsing Algorithm

```text
1. Read changelog content
2. Split by lines
3. For each line:
   a. If matches version pattern:
      - Extract version number
      - Start new version entry
   b. Else if in version entry:
      - Append to current version's changes
4. Return list of (version, changes) tuples
```

### Example Output

```yaml
versions:
  - version: "2.1.3"
    changes:
      - "Fixed skill loading in certain edge cases"
      - "Improved hook timing for PreToolUse"
  - version: "2.1.0"
    changes:
      - "Added context: fork for skill execution"
      - "Unified SlashCommand tool into Skill tool"
      - "New agent hooks in frontmatter"
```

## Hash Calculation

Calculate SHA256 hash for drift detection:

```bash
# Using Python
python -c "import hashlib; print(hashlib.sha256(open('path/to/CHANGELOG.md', 'rb').read()).hexdigest())"

# Using shell
sha256sum path/to/CHANGELOG.md | cut -d' ' -f1
```

**Store as:** `sha256:<hash>`

## Extracting Changes Since Version

To find changes since a specific version:

```text
1. Parse all versions
2. Find index of target version
3. Return all entries from index 0 to target index (exclusive)
```

Example: Changes since v2.1.0

```text
All versions: [2.1.3, 2.1.2, 2.1.1, 2.1.0, 2.0.9, ...]
Target: 2.1.0 (index 3)
Return: [2.1.3, 2.1.2, 2.1.1] (indices 0-2)
```

## Error Handling

### Changelog Not Found

```text
If changelog file doesn't exist:
  1. Report: "Changelog not found in canonical storage"
  2. Suggest: "Run /scrape-docs to refresh documentation"
  3. Return empty version list
```

### Invalid Format

```text
If no versions found:
  1. Report: "No version entries found in changelog"
  2. Check for format changes
  3. Return empty version list
```

### Partial Parse

```text
If some entries fail to parse:
  1. Log warning for each failed entry
  2. Continue with successfully parsed entries
  3. Report count of skipped entries
```

## Best Practices

1. **Cache results** - Don't re-parse changelog multiple times in one session
2. **Use hash for drift** - Hash comparison is cheaper than full parse
3. **Parse on demand** - Only parse when hash indicates changes
4. **Limit history** - For `--since`, cap at reasonable history (e.g., last 20 versions)
