---
name: sentinel
description: File-mediated parallel security audit for codebases. Launches domain-specific auditors that write findings to files, then synthesizes into consolidated report. Token-efficient through file state instead of context accumulation.
---

# Sentinel: Security Compliance & Privacy Audit Protocol

## When to Activate
Use this skill when the user requests:
- Security audit of a codebase
- Privacy/compliance review (HIPAA, GDPR, etc.)
- Vulnerability assessment
- Security posture evaluation
- User explicitly mentions "sentinel", "security audit", or "compliance review"

## Architecture
**File-Mediated Parallel Auditors**

### Why File-Mediated?
Traditional sequential audits accumulate context:
- Phase 1 findings passed to Phase 2
- Phase 2 findings passed to Phase 3
- Token usage grows O(n) with phases

Sentinel uses files as intermediate state:
- Each auditor writes findings to a file
- Auditors run in parallel (no dependencies)
- Synthesis reads only the output files
- Token usage stays O(1) per agent

### The Audit Domains

| Domain | File | Focus |
|--------|------|-------|
| Authentication | `01-authentication.md` | JWT, sessions, tokens, password handling |
| Data Protection | `02-data-protection.md` | Encryption at rest/transit, key management, PHI |
| API Security | `03-api-security.md` | CORS, rate limiting, middleware, headers |
| Input Validation | `04-input-validation.md` | Injection, sanitization, Pydantic validators |
| Secrets Management | `05-secrets-management.md` | Env vars, hardcoded secrets, key rotation |
| Privacy Compliance | `06-privacy-compliance.md` | Audit logs, data retention, consent |

### Execution Flow
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Auditor │ │ Data Auditor │ │ API Auditor  │  ... (6 parallel)
│ writes:      │ │ writes:      │ │ writes:      │
│ 01-auth.md   │ │ 02-data.md   │ │ 03-api.md    │
└──────────────┘ └──────────────┘ └──────────────┘
       │               │               │
       └───────────────┴───────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Synthesis Agent  │
              │ reads: *.md      │
              │ writes: REPORT   │
              └──────────────────┘
```

## Invocation

```bash
python3 .claude/skills/sentinel/sentinel.py [target_dir]
```

## Options

```bash
# Audit specific directory (default: current dir)
python3 .claude/skills/sentinel/sentinel.py ./api

# Custom output directory
python3 .claude/skills/sentinel/sentinel.py --output ./security-reports

# Specific domains only
python3 .claude/skills/sentinel/sentinel.py --domains auth,api,secrets

# Skip synthesis (just run auditors)
python3 .claude/skills/sentinel/sentinel.py --no-synthesis
```

## Output Structure

```
docs/security-audit/
├── 01-authentication.md      # JWT, sessions, password handling
├── 02-data-protection.md     # Encryption, PHI, key management
├── 03-api-security.md        # CORS, rate limiting, headers
├── 04-input-validation.md    # Injection vectors, sanitization
├── 05-secrets-management.md  # Env vars, hardcoded secrets
├── 06-privacy-compliance.md  # Audit logs, retention, consent
└── SECURITY-REPORT.md        # Consolidated findings with severity
```

## Finding Format

Each auditor produces findings in this format:

```markdown
## [SEVERITY] Finding Title

**Location:** `path/to/file.py:123`
**Category:** Authentication / Injection / etc.
**CWE:** CWE-XXX (if applicable)

### Description
What the vulnerability/issue is.

### Evidence
Code snippets or configuration showing the issue.

### Recommendation
How to fix it.

### References
- OWASP link
- Relevant documentation
```

## Severity Levels

| Level | Description |
|-------|-------------|
| CRITICAL | Exploitable now, data breach risk |
| HIGH | Significant vulnerability, needs immediate attention |
| MEDIUM | Security weakness, should fix soon |
| LOW | Minor issue or hardening opportunity |
| INFO | Observation, best practice suggestion |

## Token Efficiency

| Approach | Tokens per Agent | Total (6 domains) |
|----------|------------------|-------------------|
| Sequential | Accumulates | ~150k+ |
| File-mediated | ~25k fixed | ~150k parallel + 30k synthesis |

Key savings:
- Synthesis agent reads ~30KB of files instead of full audit context
- Each auditor starts fresh (no inherited context)
- Parallel execution = faster wall-clock time

## Requirements
- Claude Code CLI installed and authenticated (`claude` command available)
- Python packages: `rich`, `asyncio`

## Example Usage

```bash
# Full audit of current project
python3 .claude/skills/sentinel/sentinel.py .

# Audit only the API backend
python3 .claude/skills/sentinel/sentinel.py ./api --output ./api-security-audit

# Quick auth + secrets check
python3 .claude/skills/sentinel/sentinel.py --domains auth,secrets
```
