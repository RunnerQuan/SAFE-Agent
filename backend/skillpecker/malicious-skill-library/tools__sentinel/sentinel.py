#!/usr/bin/env python3
"""
Sentinel: File-Mediated Parallel Security Audit

Token-efficient security auditing through file-based state management.
Each auditor writes findings to files; synthesis reads only the outputs.
"""

import asyncio
import sys
import os
import argparse
from pathlib import Path
from datetime import datetime
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

console = Console()

# --- AUDIT DOMAIN DEFINITIONS ---
AUDIT_DOMAINS = {
    "auth": {
        "name": "Authentication & Authorization",
        "file": "01-authentication.md",
        "prompt": """You are a SECURITY AUDITOR specializing in Authentication & Authorization.

AUDIT SCOPE:
- JWT implementation (signing, validation, expiration, refresh)
- Session management (creation, storage, invalidation)
- Password handling (hashing, complexity, reset flows)
- Token revocation and blacklisting
- Role-based access control (RBAC)
- OAuth/SSO integration security
- Multi-factor authentication
- Session fixation and hijacking prevention

SEARCH PATTERNS:
- Files: **/auth*.py, **/session*.py, **/login*.py, **/token*.py
- Keywords: jwt, token, session, password, auth, login, SECRET_KEY, bcrypt, hash

OUTPUT FORMAT:
For each finding, use this structure:

## [SEVERITY] Finding Title

**Location:** `path/to/file.py:line`
**Category:** Authentication
**CWE:** CWE-XXX (if applicable)

### Description
What the issue is and why it matters.

### Evidence
```python
# Code showing the vulnerability
```

### Recommendation
How to fix it with code examples if helpful.

---

End with a summary table of all findings by severity.""",
    },
    "data": {
        "name": "Data Protection",
        "file": "02-data-protection.md",
        "prompt": """You are a SECURITY AUDITOR specializing in Data Protection.

AUDIT SCOPE:
- Encryption at rest (database fields, files, backups)
- Encryption in transit (TLS, certificate validation)
- Key management (generation, rotation, storage)
- PHI/PII handling (HIPAA, GDPR requirements)
- Data masking and redaction
- Secure deletion
- Database security (connection strings, parameterized queries)

SEARCH PATTERNS:
- Files: **/encrypt*.py, **/crypto*.py, **/db*.py, **/models.py
- Keywords: encrypt, decrypt, Fernet, AES, key, PHI, PII, redact, ENCRYPTION_KEY

OUTPUT FORMAT:
For each finding, use this structure:

## [SEVERITY] Finding Title

**Location:** `path/to/file.py:line`
**Category:** Data Protection
**CWE:** CWE-XXX (if applicable)

### Description
What the issue is and why it matters.

### Evidence
```python
# Code showing the vulnerability
```

### Recommendation
How to fix it with code examples if helpful.

---

End with a summary table of all findings by severity.""",
    },
    "api": {
        "name": "API Security",
        "file": "03-api-security.md",
        "prompt": """You are a SECURITY AUDITOR specializing in API Security.

AUDIT SCOPE:
- CORS configuration (allowed origins, credentials, methods)
- Rate limiting implementation
- Authentication middleware
- Security headers (CSP, HSTS, X-Frame-Options)
- Error handling (information leakage)
- HTTP method restrictions
- Request size limits
- API versioning security

SEARCH PATTERNS:
- Files: **/main.py, **/middleware*.py, **/endpoints/*.py, **/routes*.py
- Keywords: CORS, CORSMiddleware, rate_limit, @app., router, middleware, headers

OUTPUT FORMAT:
For each finding, use this structure:

## [SEVERITY] Finding Title

**Location:** `path/to/file.py:line`
**Category:** API Security
**CWE:** CWE-XXX (if applicable)

### Description
What the issue is and why it matters.

### Evidence
```python
# Code showing the vulnerability
```

### Recommendation
How to fix it with code examples if helpful.

---

End with a summary table of all findings by severity.""",
    },
    "input": {
        "name": "Input Validation",
        "file": "04-input-validation.md",
        "prompt": """You are a SECURITY AUDITOR specializing in Input Validation & Injection Prevention.

AUDIT SCOPE:
- SQL injection (parameterized queries, ORM usage)
- Command injection (subprocess, os.system, shell=True)
- Path traversal (file operations, user-controlled paths)
- XSS prevention (output encoding, template escaping)
- XML/XXE injection
- LDAP injection
- Pydantic validation (Field constraints, custom validators)
- Regex DoS (ReDoS)

SEARCH PATTERNS:
- Files: **/schemas.py, **/models/*.py, **/endpoints/*.py, **/services/*.py
- Keywords: subprocess, os.system, execute, query, f-string, format, open(, Path(

OUTPUT FORMAT:
For each finding, use this structure:

## [SEVERITY] Finding Title

**Location:** `path/to/file.py:line`
**Category:** Input Validation
**CWE:** CWE-XXX (if applicable)

### Description
What the issue is and why it matters.

### Evidence
```python
# Code showing the vulnerability
```

### Recommendation
How to fix it with code examples if helpful.

---

End with a summary table of all findings by severity.""",
    },
    "secrets": {
        "name": "Secrets Management",
        "file": "05-secrets-management.md",
        "prompt": """You are a SECURITY AUDITOR specializing in Secrets Management.

AUDIT SCOPE:
- Hardcoded secrets (API keys, passwords, tokens in code)
- Environment variable handling
- .env file security (gitignore, permissions)
- Secret rotation mechanisms
- Credential storage (plaintext vs encrypted)
- Default credentials
- Debug/test credentials in production code
- Secret exposure in logs or errors

SEARCH PATTERNS:
- Files: **/*.py, **/*.ts, **/*.tsx, **/.env*, **/config*.py
- Keywords: password, secret, api_key, token, credential, PRIVATE_KEY, AWS_, ANTHROPIC_

OUTPUT FORMAT:
For each finding, use this structure:

## [SEVERITY] Finding Title

**Location:** `path/to/file.py:line`
**Category:** Secrets Management
**CWE:** CWE-798 (Use of Hard-coded Credentials)

### Description
What the issue is and why it matters.

### Evidence
```python
# Code showing the vulnerability (REDACT actual secrets)
```

### Recommendation
How to fix it with code examples if helpful.

---

End with a summary table of all findings by severity.""",
    },
    "privacy": {
        "name": "Privacy Compliance",
        "file": "06-privacy-compliance.md",
        "prompt": """You are a SECURITY AUDITOR specializing in Privacy Compliance.

AUDIT SCOPE:
- Audit logging (what's logged, log integrity, access)
- Data retention policies (automatic deletion, archival)
- Consent management (opt-in, opt-out, withdrawal)
- Data subject rights (access, deletion, portability)
- Privacy by design (data minimization, purpose limitation)
- Third-party data sharing
- Cookie/tracking policies
- Breach notification readiness

SEARCH PATTERNS:
- Files: **/audit*.py, **/log*.py, **/consent*.py, **/retention*.py
- Keywords: audit, log, consent, retention, delete, purge, GDPR, HIPAA, privacy

OUTPUT FORMAT:
For each finding, use this structure:

## [SEVERITY] Finding Title

**Location:** `path/to/file.py:line`
**Category:** Privacy Compliance
**CWE:** CWE-XXX (if applicable)

### Description
What the issue is and why it matters.

### Evidence
```python
# Code showing the vulnerability
```

### Recommendation
How to fix it with code examples if helpful.

---

End with a summary table of all findings by severity.""",
    },
}

SYNTHESIS_PROMPT = """You are a SENIOR SECURITY ARCHITECT synthesizing findings from multiple domain auditors.

You will receive audit reports from 6 specialized auditors. Your job:

1. **Executive Summary** (200 words max)
   - Overall security posture assessment
   - Most critical findings
   - Key recommendations

2. **Consolidated Findings by Severity**
   - Group all CRITICAL findings first
   - Then HIGH, MEDIUM, LOW, INFO
   - Remove duplicates, merge related findings

3. **Risk Matrix**
   Create a table:
   | Finding | Severity | Likelihood | Impact | Priority |

4. **Remediation Roadmap**
   - Immediate actions (CRITICAL/HIGH)
   - Short-term fixes (MEDIUM)
   - Long-term improvements (LOW/INFO)

5. **Compliance Gaps**
   - HIPAA/healthcare compliance gaps
   - OWASP Top 10 coverage
   - Missing security controls

6. **Positive Findings**
   - What's done well
   - Existing security controls that work

Output as a well-structured markdown document suitable for stakeholder review."""


async def run_claude_agent(prompt: str, content: str, cwd: str = None) -> str:
    """Spawns a Claude Code agent via CLI.

    Uses stdin to pass prompts (avoids Windows 8,191 char cmd limit).
    """
    import shutil
    import platform

    full_prompt = f"{prompt}\n\n---\n\nTARGET DIRECTORY: {cwd or os.getcwd()}\n\n{content}"

    if platform.system() == "Windows":
        claude_cmd = shutil.which("claude.cmd") or shutil.which("claude.exe") or "claude.cmd"
    else:
        claude_cmd = shutil.which("claude") or "claude"

    # Use stdin instead of -p argument to avoid command-line length limits
    proc = await asyncio.create_subprocess_exec(
        claude_cmd, "--print",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd
    )
    stdout, stderr = await proc.communicate(input=full_prompt.encode())

    if proc.returncode != 0:
        error_msg = stderr.decode() if stderr else "Unknown error"
        return f"Error: {error_msg}"

    return stdout.decode().strip()


async def run_auditor(domain_key: str, domain: dict, target_dir: str, output_dir: Path) -> tuple:
    """Runs a single domain auditor and writes findings to file."""
    console.log(f"[bold blue]{domain['name']}[/] auditor deployed...")

    audit_instruction = f"""Audit the codebase at {target_dir} for {domain['name']} security issues.

Use glob, grep, and read tools to search the codebase thoroughly.
Write your findings in the specified format.
Be thorough but focus on real vulnerabilities, not theoretical concerns."""

    result = await run_claude_agent(domain["prompt"], audit_instruction, target_dir)

    # Write findings to file
    output_file = output_dir / domain["file"]
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"# {domain['name']} Security Audit\n\n")
        f.write(f"**Audited:** {timestamp}\n")
        f.write(f"**Target:** {target_dir}\n\n")
        f.write("---\n\n")
        f.write(result)

    console.log(f"[bold green]{domain['name']}[/] complete -> {output_file.name}")
    return (domain_key, domain["name"], output_file)


async def run_synthesis(output_dir: Path, target_dir: str) -> str:
    """Reads all audit files and synthesizes into final report."""
    console.log("[bold purple]Synthesis agent reading audit reports...[/]")

    # Read all audit files
    audit_content = []
    for md_file in sorted(output_dir.glob("0*.md")):
        with open(md_file, "r", encoding="utf-8") as f:
            content = f.read()
            audit_content.append(f"=== {md_file.name} ===\n\n{content}")

    all_audits = "\n\n".join(audit_content)

    synthesis_input = f"""Target: {target_dir}

AUDIT REPORTS:

{all_audits}"""

    result = await run_claude_agent(SYNTHESIS_PROMPT, synthesis_input, target_dir)

    # Write final report
    report_file = output_dir / "SECURITY-REPORT.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    with open(report_file, "w", encoding="utf-8") as f:
        f.write(f"# Security Audit Report\n\n")
        f.write(f"**Generated:** {timestamp}\n")
        f.write(f"**Target:** {target_dir}\n\n")
        f.write("---\n\n")
        f.write(result)

    console.log(f"[bold green]Synthesis complete -> {report_file.name}[/]")
    return result


async def main(
    target_dir: str,
    output_dir: str = None,
    domains: list = None,
    skip_synthesis: bool = False
):
    console.rule("[bold purple]Sentinel: Security Audit Protocol Initiated")

    # Resolve paths
    target_path = Path(target_dir).resolve()
    if not target_path.exists():
        console.print(f"[bold red]Error: Target directory does not exist: {target_path}[/]")
        sys.exit(1)

    output_path = Path(output_dir) if output_dir else Path("docs/security-audit")
    output_path.mkdir(parents=True, exist_ok=True)

    console.print(f"Target: [italic]{target_path}[/]")
    console.print(f"Output: [italic]{output_path}[/]")

    # Select domains
    if domains:
        selected = {k: v for k, v in AUDIT_DOMAINS.items() if k in domains}
    else:
        selected = AUDIT_DOMAINS

    console.print(f"Domains: {', '.join(selected.keys())}\n")

    # Phase 1: Parallel Auditors
    console.rule("[bold blue]Phase 1: Parallel Domain Auditors")
    console.log(f"[bold]Deploying {len(selected)} auditors in parallel...[/]")

    tasks = [
        run_auditor(key, domain, str(target_path), output_path)
        for key, domain in selected.items()
    ]
    results = await asyncio.gather(*tasks)

    # Summary table
    table = Table(title="Audit Files Generated")
    table.add_column("Domain", style="cyan")
    table.add_column("Output File", style="green")

    for key, name, filepath in results:
        table.add_row(name, str(filepath.name))

    console.print(table)

    # Phase 2: Synthesis
    if not skip_synthesis:
        console.rule("[bold purple]Phase 2: Synthesis")
        final_report = await run_synthesis(output_path, str(target_path))

        console.print(Panel(
            Markdown(final_report[:2000] + "\n\n...(truncated for display)"),
            title="[bold purple]Security Report Preview[/]",
            border_style="purple"
        ))

    # Final summary
    console.rule("[bold green]Audit Complete")
    console.print(f"\n[bold]Output directory:[/] {output_path}")
    console.print("[bold]Files generated:[/]")
    for f in sorted(output_path.glob("*.md")):
        size = f.stat().st_size
        console.print(f"  - {f.name} ({size:,} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Sentinel: File-Mediated Parallel Security Audit"
    )
    parser.add_argument(
        "target",
        nargs="?",
        default=".",
        help="Target directory to audit (default: current directory)"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output directory for audit files (default: docs/security-audit)"
    )
    parser.add_argument(
        "--domains", "-d",
        help="Comma-separated list of domains to audit (auth,data,api,input,secrets,privacy)"
    )
    parser.add_argument(
        "--no-synthesis",
        action="store_true",
        help="Skip synthesis phase (just run auditors)"
    )

    args = parser.parse_args()

    domains = args.domains.split(",") if args.domains else None

    asyncio.run(main(
        args.target,
        args.output,
        domains,
        args.no_synthesis
    ))
