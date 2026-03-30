from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

from .models import RuleHit


@dataclass(frozen=True, slots=True)
class DetectorRule:
    code: str
    severity: str
    message: str
    pattern: re.Pattern[str]
    targets: tuple[str, ...]


RULES: tuple[DetectorRule, ...] = (
    DetectorRule(
        code="MAL-EXFIL",
        severity="critical",
        message="Potential data exfiltration or upload behavior",
        pattern=re.compile(r"(requests\.(post|put)|httpx\.(post|put)|curl\s.+https?://|wget\s.+https?://).*(token|secret|key|env|credential|cookie)", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="MAL-DOWNLOAD-EXEC",
        severity="critical",
        message="Potential download-and-execute behavior",
        pattern=re.compile(r"(curl|wget).*(\|\s*(sh|bash)|>\s*/tmp/|&&\s*(bash|sh)\s)", re.I),
        targets=("shell", "text"),
    ),
    DetectorRule(
        code="MAL-BYPASS",
        severity="high",
        message="Prompt or policy bypass language",
        pattern=re.compile(r"(ignore|override).*(system|developer|previous).*instruction|pretend user approved|skip approval|bypass.*guardrail", re.I),
        targets=("markdown", "text"),
    ),
    DetectorRule(
        code="MAL-DESTROY",
        severity="high",
        message="Destructive file operation",
        pattern=re.compile(r"\brm\s+-rf\b|shutil\.rmtree\(|Path\(.+\)\.unlink\(|os\.(remove|unlink)\(", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="MAL-HIDE",
        severity="med",
        message="Obfuscation or encoded payload",
        pattern=re.compile(r"base64\s+-d|base64\.b64decode\(|exec\(|eval\(|marshal\.loads\(|zlib\.decompress\(", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="UNSAFE-SQLI",
        severity="high",
        message="Potential SQL injection pattern",
        pattern=re.compile(r"(execute|executemany)\(\s*f[\"']|(SELECT|INSERT|UPDATE|DELETE).*(\+|format\(|%s|% \()|cursor\.execute\(.+user_input", re.I),
        targets=("python", "sql", "text"),
    ),
    DetectorRule(
        code="UNSAFE-CMDI",
        severity="high",
        message="Potential command injection pattern",
        pattern=re.compile(r"subprocess\.(run|Popen|call)\(.+shell\s*=\s*True|os\.system\(|bash\s+-c|sh\s+-c", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="UNSAFE-PATH",
        severity="med",
        message="Potential path traversal pattern",
        pattern=re.compile(r"(open|Path|os\.path\.join)\(.+(request|input|user|argv)", re.I),
        targets=("python", "text"),
    ),
    DetectorRule(
        code="UNSAFE-SSRF",
        severity="med",
        message="Potential SSRF pattern",
        pattern=re.compile(r"(requests|get|post|httpx|get|urlopen)\(.+(request|input|user|url)", re.I),
        targets=("python", "text"),
    ),
    DetectorRule(
        code="UNSAFE-DESER",
        severity="high",
        message="Unsafe deserialization pattern",
        pattern=re.compile(r"yaml\.load\(|pickle\.loads?\(|marshal\.loads\(", re.I),
        targets=("python", "text"),
    ),
    DetectorRule(
        code="UNSAFE-TLS",
        severity="high",
        message="TLS verification disabled",
        pattern=re.compile(r"verify\s*=\s*False|ssl\._create_unverified_context|curl\s.+\s-k(\s|$)", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="UNSAFE-SECRET",
        severity="high",
        message="Hardcoded secret-like value",
        pattern=re.compile(r"(api[_-]?key|secret|token|password)\s*[:=]\s*[\"'][A-Za-z0-9_\-]{12,}[\"']", re.I),
        targets=("python", "json", "yaml", "text"),
    ),
    DetectorRule(
        code="UNSAFE-TOOL",
        severity="med",
        message="Tool use guidance without approval boundaries",
        pattern=re.compile(r"(always|must)\s+(run|execute|call)\s+(shell|terminal|command)|never ask for approval", re.I),
        targets=("markdown", "text"),
    ),
    DetectorRule(
        code="DESC-FALSE-SAFETY",
        severity="med",
        message="Potential false safety claim",
        pattern=re.compile(r"\b(safe|harmless|read-only|no side effects|will not access network)\b", re.I),
        targets=("markdown", "text"),
    ),
    DetectorRule(
        code="DESC-DANGEROUS-EXAMPLE",
        severity="high",
        message="Dangerous example or instruction language",
        pattern=re.compile(r"(example|recommended|best practice).*(shell\s*=\s*True|verify\s*=\s*False|curl.+\|\s*(sh|bash)|SELECT.+\+)", re.I),
        targets=("markdown", "text"),
    ),
    DetectorRule(
        code="FEAT-NETWORK",
        severity="low",
        message="Network access behavior",
        pattern=re.compile(r"requests\.|httpx\.|urllib\.|curl\s|wget\s|fetch\(", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="FEAT-SHELL",
        severity="low",
        message="Shell execution behavior",
        pattern=re.compile(r"subprocess\.|os\.system\(|bash\s+-c|sh\s+-c|powershell", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="FEAT-SQL",
        severity="low",
        message="SQL-related behavior",
        pattern=re.compile(r"\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|DROP TABLE)\b|cursor\.execute\(", re.I),
        targets=("python", "sql", "text"),
    ),
    DetectorRule(
        code="FEAT-FILE-WRITE",
        severity="low",
        message="File write behavior",
        pattern=re.compile(r"open\(.+['\"]w['\"]|write_text\(|write_bytes\(|tee\s|>\s*[A-Za-z0-9_./-]+", re.I),
        targets=("python", "shell", "text"),
    ),
    DetectorRule(
        code="FEAT-ENV-READ",
        severity="low",
        message="Environment or secret access behavior",
        pattern=re.compile(r"os\.environ|os\.getenv|getenv\(|\$[A-Z_]{2,}|process\.env", re.I),
        targets=("python", "shell", "text"),
    ),
)


def run_rules(path: str, kind: str, text: str, source: str = "file", line_offset: int = 0) -> list[RuleHit]:
    hits: list[RuleHit] = []
    lines = text.splitlines()
    seen: set[tuple[str, int, str]] = set()
    for index, line in enumerate(lines, start=1):
        line_no = index + line_offset
        for rule in RULES:
            if kind not in rule.targets:
                continue
            if kind == "markdown" and rule.code.startswith("UNSAFE-") and rule.code not in {"UNSAFE-TOOL"}:
                continue
            if rule.pattern.search(line):
                key = (rule.code, line_no, line.strip())
                if key in seen:
                    continue
                seen.add(key)
                hits.append(
                    RuleHit(
                        code=rule.code,
                        severity=rule.severity,
                        path=path,
                        start_line=line_no,
                        end_line=line_no,
                        message=rule.message,
                        excerpt=line.strip()[:240],
                        source=source,
                    )
                )
    return hits


def summarize_hits(hits: Iterable[RuleHit]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for hit in hits:
        counts[hit.code] = counts.get(hit.code, 0) + 1
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))
