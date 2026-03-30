# Component Discovery Reference

This document provides detailed guidance for detecting new, renamed, or deprecated Claude Code extensibility components across all 6 tiers.

---

## ⚠️ MANDATORY: Delegation to docs-management

**ALL component discovery MUST delegate to `docs-management` for authoritative data.**

### Why Delegation is Required

Component details change with every Claude Code release:

- New components are added (e.g., rules, LSP servers)
- Components are renamed or merged
- File patterns and configuration formats evolve
- Documentation pages are restructured

**Hardcoding component lists leads to drift and false negatives in discovery.**

### Discovery Source Priority

| Priority | Source | Use For |
| -------- | ------ | ------- |
| 1 | `docs-management` skill | Official component definitions, file patterns, doc sources |
| 2 | `claude-code-guide` agent | Live verification, recent changes, undocumented features |
| 3 | CHANGELOG | New features, deprecations, renames |
| 4 | This reference | Discovery algorithms, comparison logic (NOT component lists) |

### What This Reference Provides (Static)

- **Tier structure** (1-6) - design decision, rarely changes
- **Discovery algorithms** - comparison and detection logic
- **Search patterns** - regex for changelog parsing
- **Verification checklists** - process guidance

### What MUST Be Queried at Runtime (Dynamic)

| Data | Query docs-management for |
| ---- | ------------------------- |
| Component types per tier | `plugins-reference.md plugin components` |
| File patterns | `{component} configuration file location` |
| Doc source mappings | `{component} documentation` |
| Current component count | Count results from tier queries |

**NEVER hardcode:** File patterns, doc source names, component lists, feature names

---

## Component Overview

The ecosystem-health skill tracks components across **6 tiers**:

| Tier | Name | Audit Type | Query docs-management for |
| ---- | ---- | ---------- | ------------------------- |
| 1 | Core Configuration | Mixed | `settings.md`, `iam.md`, `memory.md` |
| 2 | Plugin Components | Automated | `plugins-reference.md`, `skills.md`, `hooks.md` |
| 3 | Environment & CLI | Documentation | `settings.md environment`, `cli-reference.md` |
| 4 | Authentication & Access | Mixed | `iam.md authentication` |
| 5 | Session & Runtime | Mixed | `cli-reference.md session`, `security.md` |
| 6 | Integration | Documentation | `third-party-integrations.md`, `setup.md`, `common-workflows.md` |

**Note:** Component counts are determined at runtime by querying docs-management. The structure above is stable; the component counts may change with releases.

### Audit Types

| Type | Description | Has `/audit-*` Command? |
| ---- | ----------- | ----------------------- |
| `automated` | Full audit via command | Yes |
| `manual` | Requires human review | No |
| `documentation` | Tracks doc coverage only | No |

---

## Tier 1: Core Configuration

Configuration at user, project, and enterprise levels.

**DELEGATE:** Query docs-management for current component list and file patterns.

### Discovery Queries for Tier 1

```text
# Query docs-management skill for authoritative data:
"settings.md user configuration"       → user_settings component
"settings.md project configuration"    → project_settings component
"iam.md managed settings enterprise"   → managed_settings component
"memory.md CLAUDE.md imports"          → memory_system component
```

### Expected Components (verify via docs-management)

| Component | Query Pattern | Audit Type |
| --------- | ------------- | ---------- |
| user_settings | `settings.md user` | manual |
| project_settings | `settings.md project` | automated |
| managed_settings | `iam.md managed` | manual |
| memory_system | `memory.md` | automated |

**Note:** File patterns should be extracted from docs-management results, not hardcoded.

---

## Tier 2: Plugin Components

Components that can be packaged in Claude Code plugins.

**DELEGATE:** Query docs-management for current component list, file patterns, and audit commands.

### Discovery Queries for Tier 2

```text
# Query docs-management skill for authoritative data:
"plugins-reference.md plugin components"     → Full component list
"skills.md YAML frontmatter"                 → skills component
"sub-agents.md agent configuration"          → agents component
"slash-commands.md command configuration"    → commands component
"hooks.md hook events configuration"         → hooks component
"mcp.md MCP servers tools"                   → mcp component
"memory.md CLAUDE.md imports"                → memory component
"plugins-reference.md plugin manifest"       → plugins component
"settings.md settings.json configuration"    → settings component
"plugins-reference.md output styles"         → output_styles component
"terminal-config.md status line"             → statuslines component
"memory.md modular rules"                    → rules component
"plugins-reference.md LSP servers"           → lsp component
```

### Expected Components (verify via docs-management)

| Component | Query Pattern | Audit Command |
| --------- | ------------- | ------------- |
| skills | `skills.md` | `/audit-skills` |
| agents | `sub-agents.md` | `/audit-agents` |
| commands | `slash-commands.md` | `/audit-commands` |
| hooks | `hooks.md` | `/audit-hooks` |
| mcp | `mcp.md` | `/audit-mcp` |
| memory | `memory.md` | `/audit-memory` |
| plugins | `plugins-reference.md plugin` | `/audit-plugins` |
| settings | `settings.md` | `/audit-settings` |
| output_styles | `plugins-reference.md output` | `/audit-output-styles` |
| statuslines | `terminal-config.md` | `/audit-statuslines` |
| rules | `memory.md rules` | `/audit-rules` |
| lsp | `plugins-reference.md LSP` | `/audit-lsp` |

**Note:** File patterns and doc sources should be extracted from docs-management results.

---

## Tier 3: Environment & CLI

Environment variables, CLI flags, and permission modes.

> **⚠️ HIGH STALENESS RISK - MANDATORY DELEGATION**

These change frequently with releases. **NEVER hardcode lists.**

### Discovery Queries for Tier 3

```text
# DELEGATE to docs-management - query at runtime:
"settings.md environment variables"    → environment_variables component
"cli-reference.md flags options"       → cli_flags component
"iam.md permission modes"              → permission_modes component
```

### Expected Components (verify via docs-management)

| Component | Query Pattern | Audit Type |
| --------- | ------------- | ---------- |
| environment_variables | `settings.md environment` | documentation |
| cli_flags | `cli-reference.md` | documentation |
| permission_modes | `iam.md permission modes` | documentation |

### Detection Patterns for Changelog Parsing

```regex
# Environment variable detection (pattern only, not exhaustive list)
ANTHROPIC_[A-Z_]+
CLAUDE_CODE_[A-Z_]+
DISABLE_[A-Z_]+

# CLI flag detection (pattern only)
--[a-z][a-z-]+

# Permission mode mentions (pattern only)
permission mode|defaultMode|acceptEdits|plan mode|dontAsk
```

**Note:** Use patterns for changelog detection. Query docs-management for authoritative lists.

---

## Tier 4: Authentication & Access

Authentication methods and access control.

> **⚠️ HIGH STALENESS RISK - MANDATORY DELEGATION**

New authentication providers and methods are added frequently. **NEVER hardcode lists.**

### Discovery Queries for Tier 4

```text
# DELEGATE to docs-management - query at runtime:
"iam.md authentication methods"        → authentication_methods component
"iam.md configuring permissions"       → permission_rules component
"iam.md credential management"         → credential_management component
```

### Expected Components (verify via docs-management)

| Component | Query Pattern | Audit Type |
| --------- | ------------- | ---------- |
| authentication_methods | `iam.md authentication` | documentation |
| permission_rules | `iam.md permissions` | manual |
| credential_management | `iam.md credential` | documentation |

### Detection Patterns for Changelog Parsing

```regex
# Authentication method mentions (pattern only, not exhaustive)
Amazon Bedrock|Google Vertex|Microsoft Foundry
Claude Console|Claude for Teams|Claude for Enterprise
OAuth|SSO|SAML|API key

# Permission patterns (pattern only)
"allow"|"deny"|"ask"|additionalDirectories|defaultMode
```

**Note:** Use patterns for changelog detection. Query docs-management for authoritative provider/method lists.

---

## Tier 5: Session & Runtime

Session features and sandbox configuration.

**DELEGATE:** Query docs-management for current session features and sandbox options.

### Discovery Queries for Tier 5

```text
# DELEGATE to docs-management - query at runtime:
"cli-reference.md session features"    → session_features component
"security.md sandbox configuration"    → sandbox_configuration component
```

### Expected Components (verify via docs-management)

| Component | Query Pattern | Audit Type |
| --------- | ------------- | ---------- |
| session_features | `cli-reference.md session` | documentation |
| sandbox_configuration | `security.md sandbox` | manual |

### Detection Patterns for Changelog Parsing

```regex
# Session features (pattern only)
--resume|--continue|--fork-session|checkpoints|/compact|/clear

# Sandbox settings (pattern only)
sandboxedBash\.[a-zA-Z]+|sandbox.*enabled|network.*isolation
```

**Note:** Use patterns for changelog detection. Query docs-management for authoritative feature lists.

---

## Tier 6: Integration

IDE integrations, cloud providers, and CI/CD platforms.

> **⚠️ HIGH STALENESS RISK - MANDATORY DELEGATION**

New integrations are added frequently. **NEVER hardcode lists.**

### Discovery Queries for Tier 6

```text
# DELEGATE to docs-management - query at runtime:
"third-party-integrations.md IDE"      → ide_integrations component
"setup.md cloud providers"             → cloud_providers component
"common-workflows.md CI/CD"            → cicd_integrations component
```

### Expected Components (verify via docs-management)

| Component | Query Pattern | Audit Type |
| --------- | ------------- | ---------- |
| ide_integrations | `third-party-integrations.md` | documentation |
| cloud_providers | `setup.md cloud` | documentation |
| cicd_integrations | `common-workflows.md` | documentation |

### Detection Patterns for Changelog Parsing

```regex
# IDE integrations (pattern only, not exhaustive)
VS Code|JetBrains|Rider|IntelliJ|Chrome|browser

# Cloud providers (pattern only)
Bedrock|Vertex AI|Microsoft Foundry|Azure AI

# CI/CD platforms (pattern only)
GitHub Actions|GitLab CI|CI/CD|headless
```

**Note:** Use patterns for changelog detection. Query docs-management for authoritative integration lists.

---

## Discovery Sources

### Primary Source: docs-management Skill

**MANDATORY:** All component discovery queries MUST go through docs-management.

```text
# Example discovery queries:
docs-management: "plugins-reference.md plugin component types"
docs-management: "settings.md configuration hierarchy"
docs-management: "iam.md authentication methods"
```

### Secondary Source: claude-code-guide Agent

**Use for:** Live verification, recent changes, undocumented features.

```text
# Spawn for live web verification:
Task tool: claude-code-guide agent
Prompt: "WebFetch https://code.claude.com/docs/en/claude_code_docs_map.md
        then fetch relevant pages about {topic}. Return key findings with URLs."
```

### Doc Pages by Tier (Query via docs-management)

| Tier | Primary Docs | Query Pattern |
| ---- | ------------ | ------------- |
| 1 | settings.md, iam.md, memory.md | `{doc} configuration` |
| 2 | plugins-reference.md, skills.md, hooks.md | `{doc} {component}` |
| 3 | settings.md, cli-reference.md, iam.md | `{doc} environment\|flags\|modes` |
| 4 | iam.md | `iam.md authentication\|permissions\|credential` |
| 5 | cli-reference.md, security.md | `{doc} session\|sandbox` |
| 6 | third-party-integrations.md, setup.md, common-workflows.md | `{doc} {integration}` |

### Changelog

**Doc ID:** `raw-githubusercontent-com-anthropics-claude-code-refs-heads-main-CHANGELOG`

Query via docs-management, then parse for component-related entries using patterns below.

---

## Search Patterns

### New Feature Detection

```regex
# "Added support for" patterns
Added support for (.+)
Added (.+) support
Introduced (.+)
New feature: (.+)

# File location patterns
\.claude/([a-z-]+)/
\.claude/([a-z-]+)\.json
\.([a-z-]+)\.json

# Configuration patterns
\[([a-z-]+)\] section in
([a-z-]+)\.json configuration

# Environment variable patterns
new.*environment variable
CLAUDE_CODE_[A-Z_]+ env var
Added ANTHROPIC_[A-Z_]+

# CLI flag patterns
new.*flag
--[a-z-]+ flag

# Authentication patterns
new.*authentication
OAuth|SSO support

# Integration patterns
VS Code|JetBrains integration
GitHub Actions|GitLab CI/CD
```

### Deprecation Detection

```regex
# Deprecation patterns
Deprecated (.+)
Removed support for (.+)
Removed (.+) feature
No longer supported: (.+)
Replaced (.+) with (.+)

# Migration patterns
Migrate from (.+) to (.+)
Renamed (.+) to (.+)
```

### Rename Detection

```regex
# Explicit renames
Renamed (.+) to (.+)
(.+) is now called (.+)
(.+) → (.+)

# Feature consolidation
Merged (.+) into (.+)
Combined (.+) and (.+)
Unified (.+)
```

---

## Comparison Algorithm

### Step 1: Query docs-management for Current State

```text
# DELEGATE - query docs-management for authoritative component list:
1. Query docs-management for each tier's primary docs
2. Extract component names, file patterns, configuration structures
3. Build current component inventory from docs-management results
4. Map components to appropriate tier based on doc source
```

### Step 2: Extract from Changelog

```text
For each changelog entry since last check:
  1. Match against new feature patterns
  2. Match against deprecation patterns
  3. Match against rename patterns
  4. Extract affected component names
  5. Determine affected tier(s)
```

### Step 3: Compare Current vs Previously Tracked

```text
For each component from docs-management:
  1. Check if in tracking file → KNOWN
  2. If not in tracking file → NEW (needs tracking)
  3. If similar but different name → POTENTIAL RENAME

For each component in tracking file:
  1. Check if still in docs-management results → CURRENT
  2. If not found and changelog mentions deprecation → DEPRECATED
  3. If not found, no deprecation mention → Query claude-code-guide for verification
```

**Note:** The "tracked list" is what's in `.claude/ecosystem-health.yaml`. The "current state" comes from docs-management queries.

---

## Evidence Collection

When reporting findings, include:

1. **Source**: Which document or changelog version
2. **Evidence**: Exact quote or pattern that matched
3. **Tier**: Which tier the component belongs to
4. **Audit Type**: automated, manual, or documentation
5. **Recommendation**: Suggested action (add tracking, rename, deprecate)

---

## Update Tracking File

When discover mode runs, update `.claude/ecosystem-health.yaml`:

```yaml
last_discovery:
  date: "YYYY-MM-DD"
  docs_scanned:
    - "code-claude-com-docs-en-plugins-reference"
    - "code-claude-com-docs-en-settings"
    - "code-claude-com-docs-en-iam"
    - "code-claude-com-docs-en-cli-reference"
    # ... other docs
  changelog_version: "X.Y.Z"
  components_detected: 27
  gaps_found: 0
  notes: "All extensibility components across 6 tiers are tracked."
```

---

## When Gaps Are Found

### For NEW components (Tier 2 - Automated)

1. Create audit command: `commands/audit-{component}.md`
2. Create auditor agent: `agents/{component}-auditor.md`
3. Add to tracking template: `assets/tracking-template.yaml`
4. Add keywords to: `references/change-categories.md`

### For NEW components (Tiers 1, 3-6 - Non-Automated)

1. Add to tracking template with appropriate `audit_type`
2. Add keywords to: `references/change-categories.md`
3. Document tracking approach (manual review or doc coverage)

### For RENAMED components

1. Update tracking key in all files
2. Rename audit command if exists
3. Update documentation references
4. Add migration note

### For DEPRECATED components

1. Mark as deprecated in tracking (don't remove immediately)
2. Add migration guidance
3. Plan removal in future version
4. Warn users during audits

---

## Verification Checklist

Before reporting discovery results:

- [ ] **Queried docs-management** for each tier's primary docs
- [ ] **Built component inventory** from docs-management results (not hardcoded lists)
- [ ] Parsed changelog for relevant entries
- [ ] Compared docs-management results against tracking file
- [ ] **Used claude-code-guide** for any ambiguous findings (live verification)
- [ ] Collected evidence with source attribution (doc_id or changelog version)
- [ ] Categorized findings by tier and audit type
- [ ] Provided actionable recommendations
- [ ] Updated last_discovery timestamp

---

## Example Discovery Session (Expanded)

```text
=== Step 1: Query docs-management for Current State ===

[Query] docs-management: "settings.md user configuration"
[Result] user_settings component - file patterns: ~/.claude.json, ~/.claude/settings.json

[Query] docs-management: "settings.md project configuration"
[Result] project_settings component - file patterns: .claude/settings.json

[Query] docs-management: "iam.md managed settings"
[Result] managed_settings component - OS-specific paths

[Query] docs-management: "memory.md CLAUDE.md"
[Result] memory_system component - file patterns: CLAUDE.md, .claude/memory/*.md

[Query] docs-management: "plugins-reference.md plugin components"
[Result] skills, agents, commands, hooks, mcp, memory, plugins, settings,
         output_styles, statuslines, rules, lsp

... (continue for all tiers)

=== Step 2: Compare Against Tracking File ===

Tracking file: .claude/ecosystem-health.yaml (schema v2.1)

Tier 1 (Core Configuration):
  - user_settings: In tracking file ✓
  - project_settings: In tracking file ✓
  - managed_settings: In tracking file ✓
  - memory_system: In tracking file ✓

Tier 2 (Plugin Components):
  - skills: In tracking file ✓
  - agents: In tracking file ✓
  ... (all 12 components verified)

Tier 3-6: (components verified against docs-management results)

=== Step 3: Parse Changelog for Changes ===

[Query] docs-management: CHANGELOG
[Result] Latest version: X.Y.Z

New features since last check:
  - (none detected)

Deprecations since last check:
  - (none detected)

=== Summary ===
docs-management queries: 14
Tiers scanned: 6/6
Components in tracking file: 27
Components from docs-management: 27
Gaps: 0

✓ Component tracking is up to date across all tiers!
```

**Note:** Specific counts (environment variables, CLI flags, etc.) are NOT tracked as
hardcoded numbers. The discovery process queries docs-management and compares component
types, not individual feature counts within each component.
