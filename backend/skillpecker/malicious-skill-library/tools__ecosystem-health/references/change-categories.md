# Change Categories Reference

This document defines how changelog entries map to component types across all 6 tiers of Claude Code extensibility.

**Schema v2.2** adds **severity classification** to determine validation method (targeted vs full audit).

---

## MANDATORY: docs-management Delegation for Keywords

> **CRITICAL:** This reference follows the anti-duplication principle. **Keyword lists MUST be queried from docs-management at runtime.**

### Why Delegation?

Keyword lists for changelog categorization change frequently:

- New CLI flags added each release
- New environment variables introduced
- New authentication methods supported
- Terminology evolves (e.g., "slash commands" → "skills")

**Hardcoding keywords here causes staleness drift.**

### How to Get Current Keywords

For each component, query docs-management with the pattern shown in **Keyword Source**.

```text
# Example: Get current CLI flag keywords
Query docs-management: "cli-reference.md CLI flags options"

# Example: Get current environment variable keywords
Query docs-management: "settings.md environment variables ANTHROPIC CLAUDE_CODE"

# Example: Get current authentication method keywords
Query docs-management: "iam.md authentication methods providers"
```

The example keywords shown below are **illustrative only** - always query docs-management for the current authoritative list.

---

## Change Severity Classification (v2.2)

Schema v2.2 classifies changelog changes by severity to determine the appropriate validation method.

### Severity Levels

| Change Type | Severity | Validation Method | Rationale |
| ----------- | -------- | ----------------- | --------- |
| `feature` | Minor | `keyword_check` | New capability - verify skill documents it |
| `deprecation` | Minor | `keyword_check` | Sunset notice - verify skill warns about it |
| `bugfix` | N/A | None | Implementation fix - no skill update needed |
| `behavior_change` | **Major** | `full_audit` | Breaking change - comprehensive review required |
| `security` | **Major** | `full_audit` | Security impact - cannot rely on keywords alone |

### Validation Method Details

#### keyword_check (Targeted Validation)

For **minor** severity changes. Uses grep-based verification.

**Required Fields:**

```yaml
validation:
  method: "keyword_check"
  target_skill: "<skill-name>"        # Required: which skill to check
  keywords:                            # Required: list of keywords/patterns
    - "exact keyword"
    - "regex.*pattern"
  required_matches: 1                  # Optional: default 1
```

**Token Cost:** ~100-500 tokens

#### full_audit (Complete Review)

For **major** severity changes. Spawns full auditor agent.

**Required Fields:**

```yaml
validation:
  method: "full_audit"
  target_skill: "<skill-name>"        # Required: primary skill affected
  audit_command: "/audit-<type>"      # Required: which audit to run
  reason: "<explanation>"              # Optional: why full audit needed
```

**Token Cost:** ~3,000-8,000 tokens

#### manual (Human Review)

For changes that cannot be programmatically validated.

**Required Fields:**

```yaml
validation:
  method: "manual"
  target_skill: "<skill-name>"        # Required: primary skill affected
  review_notes: "<guidance>"          # Optional: what to check
```

**Token Cost:** N/A (human time)

### Severity Detection Heuristics

When parsing changelog entries, detect severity using these patterns:

| Pattern | Detected Severity | Detected Type |
| ------- | ----------------- | ------------- |
| "BREAKING:", "breaking change" | Major | `behavior_change` |
| "SECURITY:", "CVE-", "vulnerability" | Major | `security` |
| "DEPRECATED:", "deprecating", "will be removed" | Minor | `deprecation` |
| "Fixed:", "Bug fix:", "resolved issue" | N/A | `bugfix` |
| "Added:", "New:", "now supports" | Minor | `feature` |

### Validation Spec Requirements by Type

| Change Type | validation.method | validation.keywords | validation.audit_command |
| ----------- | ----------------- | ------------------- | ------------------------ |
| `feature` | `keyword_check` | **Required** | - |
| `deprecation` | `keyword_check` | **Required** | - |
| `bugfix` | - | - | - |
| `behavior_change` | `full_audit` | - | **Required** |
| `security` | `full_audit` | - | **Required** |

---

## Overview

The ecosystem-health skill tracks **27 component types** across **6 tiers**. Each changelog entry is categorized based on keywords that indicate which component types are affected.

### Tier Summary

| Tier | Category | Components | Audit Type |
| ---- | -------- | ---------- | ---------- |
| 1 | Core Configuration | 4 | Mixed |
| 2 | Plugin Components | 12 | Automated |
| 3 | Environment & CLI | 3 | Documentation |
| 4 | Authentication & Access | 3 | Mixed |
| 5 | Session & Runtime | 2 | Mixed |
| 6 | Integration | 3 | Documentation |

---

## Tier 1: Core Configuration (4 Components)

### User Settings

**Keyword Source:** Query docs-management for: `settings.md user configuration global`

**Example Keywords (not exhaustive):** user settings, ~/.claude.json, global settings, user preferences

**Audit Type:** `manual`

**Related Skill:** `settings-management`

**Example Changelog Entries:**

- "User settings now support custom model aliases"
- "Added ~/.claude/settings.json as alternative to ~/.claude.json"
- "User preferences persist across sessions"

---

### Project Settings

**Keyword Source:** Query docs-management for: `settings.md project configuration local`

**Example Keywords (not exhaustive):** project settings, .claude/settings.json, settings.local.json, workspace settings

**Audit Type:** `automated`

**Audit Command:** `/audit-settings`

**Related Skill:** `settings-management`

**Example Changelog Entries:**

- "Project settings now support settings.local.json for local overrides"
- "Added detection/warnings for unreachable permission rules"
- "Improved project settings merge behavior"

---

### Managed Settings

**Keyword Source:** Query docs-management for: `iam.md managed settings enterprise`

**Example Keywords (not exhaustive):** managed settings, enterprise settings, managed-settings.json, MDM, enterprise policy

**Audit Type:** `manual`

**Related Skill:** `settings-management`

**Example Changelog Entries:**

- "Added managed settings for enterprise deployment"
- "Deprecated Windows managed settings path"
- "Managed settings now support policy enforcement"

---

### Memory System

**Keyword Source:** Query docs-management for: `memory.md CLAUDE.md imports`

**Example Keywords (not exhaustive):** memory, CLAUDE.md, @import, memory hierarchy, .claude/memory/

**Audit Type:** `automated`

**Audit Command:** `/audit-memory`

**Related Skill:** `memory-management`

**Example Changelog Entries:**

- "Added nested @import support in CLAUDE.md"
- "Memory hierarchy now supports enterprise level"
- "Improved memory loading performance"

---

## Tier 2: Plugin Components (12 Components)

### Skills

**Keyword Source:** Query docs-management for: `skills.md YAML frontmatter allowed-tools`

**Example Keywords (not exhaustive):** skills, SKILL.md, allowed-tools, skill description, skill hot-reload

**Audit Type:** `automated`

**Audit Command:** `/audit-skills`

**Related Skill:** `skill-development`

**Example Changelog Entries:**

- "Added `context: fork` option for skill execution"
- "Skills can now auto-load other skills via `skills` field"
- "Automatic skill hot-reload"
- "YAML-style lists in frontmatter allowed-tools"

---

### Agents (Subagents)

**Keyword Source:** Query docs-management for: `sub-agents.md Task tool agent configuration`

**Example Keywords (not exhaustive):** subagents, sub-agents, Task tool, agent model, agent_type

**Audit Type:** `automated`

**Audit Command:** `/audit-agents`

**Related Skill:** `subagent-development`

**Example Changelog Entries:**

- "Agents can now specify `permissionMode`"
- "Added `color` property for agent UI"
- "Added `agent` field in skills to specify agent type"
- "agent_type field in SessionStart hook input"

---

### Commands (Slash Commands)

**Keyword Source:** Query docs-management for: `slash-commands.md Skill tool command`

**Example Keywords (not exhaustive):** commands, slash commands, Skill tool, command description

**Audit Type:** `automated`

**Audit Command:** `/audit-commands`

**Related Skill:** `command-development`

**Example Changelog Entries:**

- "Merged slash commands and skills"
- "Commands now support `allowed-tools` frontmatter"
- "Improved command argument parsing"

---

### Hooks

**Keyword Source:** Query docs-management for: `hooks.md hook events matchers`

**Example Keywords (not exhaustive):** hooks, PreToolUse, PostToolUse, UserPromptSubmit, SessionStart, hook matchers

**Audit Type:** `automated`

**Audit Command:** `/audit-hooks`

**Related Skill:** `hook-management`

**Example Changelog Entries:**

- "Added `SubagentStop` hook event"
- "Hooks support in agent/skill/command frontmatter"
- "once: true config for hooks"
- "PreToolUse hooks allow updatedInput with ask decision"
- "Hook execution timeout changed to 10 minutes"

---

### MCP (Model Context Protocol)

**Keyword Source:** Query docs-management for: `mcp.md MCP servers tools`

**Example Keywords (not exhaustive):** MCP, model context protocol, MCP servers, .mcp.json

**Audit Type:** `automated`

**Audit Command:** `/audit-mcp`

**Related Skill:** `mcp-integration`

**Example Changelog Entries:**

- "Added support for remote MCP servers"
- "Improved MCP tool permission handling"
- "MCP tools now support streaming"

---

### Memory (Plugin Component)

**Keyword Source:** Query docs-management for: `memory.md CLAUDE.md imports`

**Example Keywords (not exhaustive):** memory, CLAUDE.md, @import, memory hierarchy

**Audit Type:** `automated`

**Audit Command:** `/audit-memory`

**Related Skill:** `memory-management`

**Example Changelog Entries:**

- "Added nested @import support in CLAUDE.md"
- "Memory hierarchy now supports enterprise level"
- "Improved memory loading performance"

---

### Plugins

**Keyword Source:** Query docs-management for: `plugins-reference.md plugin manifest`

**Example Keywords (not exhaustive):** plugins, plugin marketplace, plugin manifest, plugin.json

**Audit Type:** `automated`

**Audit Command:** `/audit-plugins`

**Related Skill:** `plugin-development`

**Example Changelog Entries:**

- "Plugins can now define output styles"
- "Prompt and agent hook types from plugins"
- "Improved plugin caching"

---

### Settings (Plugin Component)

**Keyword Source:** Query docs-management for: `settings.md settings.json configuration`

**Example Keywords (not exhaustive):** settings, configuration, settings.json, settings hierarchy

**Audit Type:** `automated`

**Audit Command:** `/audit-settings`

**Related Skill:** `settings-management`

**Example Changelog Entries:**

- "Added `permissionRules` to settings"
- "respectGitignore in settings.json"
- "language setting for Claude response language"

---

### Output Styles

**Keyword Source:** Query docs-management for: `plugins-reference.md output styles`

**Example Keywords (not exhaustive):** output, styles, output-style, formatting, response format

**Audit Type:** `automated`

**Audit Command:** `/audit-output-styles`

**Related Skill:** `output-customization`

**Example Changelog Entries:**

- "Added custom output style support"
- "Output styles can now be scoped to skills"
- "Improved output style inheritance"

---

### Statuslines

**Keyword Source:** Query docs-management for: `terminal-config.md status line`

**Example Keywords (not exhaustive):** statusline, status line, terminal status, statusline.sh

**Audit Type:** `automated`

**Audit Command:** `/audit-statuslines`

**Related Skill:** `status-line-customization`

**Example Changelog Entries:**

- "Added custom statusline script support"
- "Statusline now shows model information"
- "Improved statusline color handling"

---

### Rules

**Keyword Source:** Query docs-management for: `memory.md modular rules .claude/rules`

**Example Keywords (not exhaustive):** rules, .claude/rules/, path-specific rules, glob patterns, modular rules

**Audit Type:** `automated`

**Audit Command:** `/audit-rules`

**Related Skill:** `memory-management` (rules are covered within memory management)

**Example Changelog Entries:**

- "Added support for `.claude/rules/`"
- "Rules now support glob patterns for path matching"
- "Improved rule file loading and precedence"

---

### LSP (Language Server Protocol)

**Keyword Source:** Query docs-management for: `plugins-reference.md LSP servers`

**Example Keywords (not exhaustive):** LSP, language server, .lsp.json, lspServers, code intelligence

**Audit Type:** `automated`

**Audit Command:** `/audit-lsp`

**Related Skill:** `plugin-development` (LSP servers are a plugin component)

**Example Changelog Entries:**

- "Added LSP server support in plugins"
- "LSP servers can now be configured via .lsp.json"
- "Improved LSP tool integration"

---

## Tier 3: Environment & CLI (3 Components)

> **DELEGATE:** Components in this tier change frequently. Query docs-management for current lists.

### Environment Variables

**Keyword Source:** Query docs-management for: `settings.md environment variables`

**Detection Patterns:** `ANTHROPIC_[A-Z_]+`, `CLAUDE_CODE_[A-Z_]+`, `DISABLE_[A-Z_]+`

**Example Keywords (not exhaustive):** environment variables, env var, environment

**Audit Type:** `documentation`

**Doc Source:** `settings.md#environment-variables`

**Example Changelog Entries:**

- "Added CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS env var"
- "New environment variable for proxy configuration"
- "ANTHROPIC_MODEL now supports aliases"

---

### CLI Flags

**Keyword Source:** Query docs-management for: `cli-reference.md flags options`

**Detection Pattern:** `--[a-z][a-z-]+` (matches CLI flag format)

**Example Keywords (not exhaustive):** CLI, command line, flags

**Audit Type:** `documentation`

**Doc Source:** `cli-reference.md`

**Example Changelog Entries:**

- "Added --fallback-model flag for automatic failover"
- "New --permission-mode flag for startup permission"
- "Improved --resume with session forking"

---

### Permission Modes

**Keyword Source:** Query docs-management for: `iam.md permission modes`

**Example Keywords (not exhaustive):** permission mode, defaultMode

**Audit Type:** `documentation`

**Doc Source:** `iam.md#permission-modes`

**Example Changelog Entries:**

- "Added acceptEdits permission mode"
- "Permission modes can be set via CLI flag"
- "Improved permission mode inheritance"

---

## Tier 4: Authentication & Access (3 Components)

> **DELEGATE:** Authentication methods and providers change frequently. Query docs-management for current lists.

### Authentication Methods

**Keyword Source:** Query docs-management for: `iam.md authentication methods`

**Example Keywords (not exhaustive):** authentication, login, auth, OAuth, SSO, API key

**Audit Type:** `documentation`

**Doc Source:** `iam.md#authentication-methods`

**Example Changelog Entries:**

- "Added Microsoft Foundry authentication support"
- "Improved OAuth token refresh handling"
- "SSO now supports additional providers"

---

### Permission Rules

**Keyword Source:** Query docs-management for: `iam.md configuring permissions`

**Example Keywords (not exhaustive):** permission rules, allow, deny, ask, permissions

**Audit Type:** `manual`

**Doc Source:** `iam.md#configuring-permissions`

**Example Changelog Entries:**

- "Added detection/warnings for unreachable permission rules"
- "Permission rules now support regex patterns"
- "Improved permission rule evaluation order"

---

### Credential Management

**Keyword Source:** Query docs-management for: `iam.md credential management`

**Example Keywords (not exhaustive):** credentials, keychain, apiKeyHelper, token storage

**Audit Type:** `documentation`

**Doc Source:** `iam.md#credential-management`

**Example Changelog Entries:**

- "Added keychain integration for credential storage"
- "apiKeyHelper now supports custom commands"
- "Improved credential caching"

---

## Tier 5: Session & Runtime (2 Components)

### Session Features

**Keyword Source:** Query docs-management for: `cli-reference.md session features`

**Example Keywords (not exhaustive):** session, --resume, --continue, checkpoints, /compact

**Audit Type:** `documentation`

**Doc Source:** `cli-reference.md`

**Example Changelog Entries:**

- "Added session forking with --fork-session"
- "Checkpoints now support manual creation"
- "Improved /compact compression ratio"

---

### Sandbox Configuration

**Keyword Source:** Query docs-management for: `security.md sandbox configuration`

**Example Keywords (not exhaustive):** sandbox, sandboxedBash, isolation, network isolation

**Audit Type:** `manual`

**Doc Source:** `security.md`

**Example Changelog Entries:**

- "Added sandboxedBash.excludedCommands setting"
- "Sandbox now supports network isolation"
- "Improved sandbox escape detection"

---

## Tier 6: Integration (3 Components)

> **DELEGATE:** Integrations added frequently. Query docs-management for current lists.

### IDE Integrations

**Keyword Source:** Query docs-management for: `third-party-integrations.md IDE`

**Example Keywords (not exhaustive):** VS Code, JetBrains, Chrome, IDE, extension

**Audit Type:** `documentation`

**Doc Source:** `third-party-integrations.md`

**Example Changelog Entries:**

- "Added VS Code extension integration"
- "JetBrains plugin now supports all IDEs"
- "Chrome extension for web-based Claude"

---

### Cloud Providers

**Keyword Source:** Query docs-management for: `setup.md cloud providers`

**Example Keywords (not exhaustive):** Bedrock, Vertex AI, Microsoft Foundry, cloud, provider

**Audit Type:** `documentation`

**Doc Source:** `setup.md`

**Example Changelog Entries:**

- "Added Microsoft Foundry as model provider"
- "Improved Bedrock authentication flow"
- "Vertex AI now supports all Claude models"

---

### CI/CD Integrations

**Keyword Source:** Query docs-management for: `common-workflows.md CI/CD`

**Example Keywords (not exhaustive):** CI/CD, GitHub Actions, GitLab CI, headless, automation

**Audit Type:** `documentation`

**Doc Source:** `common-workflows.md`

**Example Changelog Entries:**

- "Added GitHub Actions workflow templates"
- "Improved headless mode for CI environments"
- "GitLab CI/CD integration guide"

---

## Multi-Category Entries

Some changelog entries affect multiple categories across different tiers. Example:

> "Merged slash commands and skills"

This affects:

- **skills** (Tier 2 - Skill tool now handles both)
- **commands** (Tier 2 - SlashCommand deprecated)

> "Added Microsoft Foundry as model provider"

This affects:

- **authentication_methods** (Tier 4 - New auth method)
- **cloud_providers** (Tier 6 - New provider)

**Handling:** List all affected categories in `pending_updates.affects[]`.

---

## Category Detection Algorithm

> **IMPORTANT:** This algorithm uses docs-management for keyword lookup, not hardcoded lists.

```text
For each changelog entry:
  1. Convert to lowercase
  2. For each category in all 6 tiers:
     a. Query docs-management for current keywords for that category
     b. Check if any keyword is in entry
     c. If match, add category to affects list
  3. Check detection patterns (regex) for Tier 3 components:
     - ANTHROPIC_[A-Z_]+, CLAUDE_CODE_[A-Z_]+, DISABLE_[A-Z_]+ → environment_variables
     - --[a-z][a-z-]+ → cli_flags
  4. If no matches, categorize as "general"
  5. Determine affected tiers
  6. Return list of affected categories with tier info
```

### Caching Strategy

To avoid excessive docs-management queries during batch changelog processing:

1. Query docs-management ONCE per component at start of categorization run
2. Cache keywords in memory for the duration of the run
3. Use cached keywords for all changelog entries
4. Discard cache after run completes (ensures freshness next time)

---

## Prioritization

When multiple categories are affected, prioritize by:

1. **Breaking changes** - Highest priority
2. **New required fields** - High priority
3. **Deprecations** - Medium priority
4. **New features** - Lower priority
5. **Bug fixes** - Lowest priority

---

## Update Impact Scoring

Score updates by potential impact:

| Impact Level | Score | Description |
| ------------ | ----- | ----------- |
| Critical | 5 | Breaking change, must update |
| High | 4 | Deprecation, should update soon |
| Medium | 3 | New feature affects existing patterns |
| Low | 2 | Enhancement, update when convenient |
| Minimal | 1 | Bug fix, no action needed |

### Impact-to-Severity Mapping (v2.2)

| Impact Level | Severity | Validation Method |
| ------------ | -------- | ----------------- |
| Critical | Major | `full_audit` |
| High | Minor | `keyword_check` |
| Medium | Minor | `keyword_check` |
| Low | Minor | `keyword_check` |
| Minimal | N/A | None |

---

## Audit Type Implications

| Audit Type | Can Audit? | Tracking Method |
| ---------- | ---------- | --------------- |
| `automated` | Yes (`/audit-*`) | Pass rate, component count |
| `manual` | Partial | Human review tracking |
| `documentation` | No | Doc coverage tracking |

For `documentation` type components (Tiers 3, 6), the ecosystem-health skill tracks:

- Whether the doc source exists and is current
- Last documentation review date
- Feature coverage completeness

---

## Example Categorization

**Changelog entry:**

> "Skills can now use `context: fork` to run in isolated sub-agent context"

**Categorization (v2.2 with validation spec):**

```yaml
id: "2.1.0-003"
description: "Skills can now use context: fork for isolated execution"
type: feature               # Maps to MINOR severity
since_version: "2.1.0"
components:
  - skills                  # Tier 2
  - commands                # Tier 2 - commands can use skills
tiers_affected: [2]
keywords_matched:
  - "skills"
  - "context"
impact: medium              # New feature, optional to adopt

# v2.2: Validation spec (REQUIRED for type: feature)
validation:
  method: "keyword_check"
  target_skill: "skill-development"
  keywords:
    - "context: fork"
    - "context.*fork"
    - "isolated.*context"
  required_matches: 1
```

**Changelog entry:**

> "SECURITY: Fixed permission bypass in wildcard matching"

**Categorization (v2.2 with validation spec):**

```yaml
id: "2.1.7-005"
description: "SECURITY: Fixed permission bypass in wildcard matching"
type: security              # Maps to MAJOR severity
since_version: "2.1.7"
components:
  - permissions             # Tier 4
  - settings                # Tier 1
tiers_affected: [1, 4]
keywords_matched:
  - "SECURITY"
  - "permission"
  - "wildcard"
impact: critical            # Security fix, must verify

# v2.2: Validation spec (REQUIRED for type: security)
validation:
  method: "full_audit"
  target_skill: "permission-management"
  audit_command: "/audit-settings"
  reason: "Security fix - targeted validation insufficient for security changes"
```

**Changelog entry:**

> "Added Microsoft Foundry authentication support"

**Categorization (v2.2 with validation spec):**

```yaml
id: "2.1.0-007"
description: "Added Microsoft Foundry authentication support"
type: feature               # Maps to MINOR severity
since_version: "2.1.0"
components:
  - authentication_methods  # Tier 4
  - cloud_providers         # Tier 6
tiers_affected: [4, 6]
keywords_matched:
  - "Microsoft Foundry"
  - "authentication"
impact: medium              # New feature, expands platform support

# v2.2: Validation spec (REQUIRED for type: feature)
validation:
  method: "keyword_check"
  target_skill: "settings-management"
  keywords:
    - "Microsoft Foundry"
    - "Foundry"
    - "foundry.*authentication"
  required_matches: 1
```

**Changelog entry:**

> "Fixed issue where hooks would timeout on Windows"

**Categorization (v2.2 - NO validation needed):**

```yaml
id: "2.1.8-012"
description: "Fixed issue where hooks would timeout on Windows"
type: bugfix                # NO validation needed
since_version: "2.1.8"
components:
  - hooks                   # Tier 2
tiers_affected: [2]
keywords_matched:
  - "hooks"
  - "timeout"
impact: minimal             # Bug fix, no skill update needed

# v2.2: NO validation spec needed for bugfixes
# Bugfixes are implementation details, not documented features
```
