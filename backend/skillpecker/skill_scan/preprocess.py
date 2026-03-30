from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

from .detectors import run_rules, summarize_hits
from .models import Artifact, CodeBlock, CoverageGap, RuleHit, Span, to_plain_data

SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
    ".venv",
    "venv",
    "node_modules",
    "dist",
    "build",
    ".idea",
}

TEXT_EXTENSIONS = {
    ".md": "markdown",
    ".markdown": "markdown",
    ".py": "python",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".sql": "sql",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "config",
    ".ini": "config",
    ".cfg": "config",
    ".txt": "text",
}


def scan_skill(
    root: Path,
    *,
    max_file_bytes: int = 200_000,
    preview_lines: int = 50,
    max_code_blocks_per_file: int = 8,
) -> dict[str, Any]:
    root = root.resolve()
    artifacts: list[Artifact] = []
    rule_hits: list[RuleHit] = []
    coverage_gaps: list[CoverageGap] = []
    claims: list[str] = []
    observed_languages: set[str] = set()

    for file_path in iter_files(root):
        rel_path = file_path.relative_to(root).as_posix()
        size_bytes = file_path.stat().st_size
        kind = classify_path(file_path)
        role = infer_role(file_path)
        observed_languages.add(kind)

        text, binary, truncated = read_text(file_path, max_file_bytes=max_file_bytes)
        line_count = len(text.splitlines()) if text else 0
        digest = sha256_12(text.encode("utf-8", errors="replace") if text else b"")

        if binary:
            coverage_gaps.append(CoverageGap(path=rel_path, why="binary_or_undecodable"))
            artifacts.append(
                Artifact(
                    id=artifact_id(rel_path),
                    path=rel_path,
                    kind="binary",
                    role=role,
                    size_bytes=size_bytes,
                    line_count=0,
                    preview="",
                    truncated=False,
                    binary=True,
                    sha256_12=digest,
                )
            )
            continue

        preview = build_preview(text, preview_lines)
        code_block_payloads = extract_code_block_payloads(text, max_blocks=max_code_blocks_per_file) if kind == "markdown" else []
        code_blocks = [item["summary"] for item in code_block_payloads]
        file_hits = run_rules(rel_path, kind, text, source="file")
        block_hits = scan_code_block_payloads(rel_path, code_block_payloads)
        all_hits = file_hits + block_hits

        artifacts.append(
            Artifact(
                id=artifact_id(rel_path),
                path=rel_path,
                kind=kind,
                role=role,
                size_bytes=size_bytes,
                line_count=line_count,
                preview=preview,
                truncated=truncated,
                binary=False,
                sha256_12=digest,
                code_blocks=code_blocks,
                hit_count=len(all_hits),
            )
        )
        rule_hits.extend(all_hits)

        if truncated:
            coverage_gaps.append(CoverageGap(path=rel_path, why="truncated_large_text_file"))

        if file_path.name.lower() == "skill.md":
            claims.extend(extract_claim_candidates(text))

    severity_counts: dict[str, int] = {}
    for hit in rule_hits:
        severity_counts[hit.severity] = severity_counts.get(hit.severity, 0) + 1

    result = {
        "skill": {
            "root": str(root),
            "claims": dedupe_preserve_order(claims),
            "observed_kinds": sorted(observed_languages),
        },
        "artifacts": to_plain_data(artifacts),
        "rule_hits": to_plain_data(sorted(rule_hits, key=rule_sort_key)),
        "coverage_gaps": to_plain_data(coverage_gaps),
        "stats": {
            "artifact_count": len(artifacts),
            "rule_hit_count": len(rule_hits),
            "severity_counts": severity_counts,
            "rule_code_counts": summarize_hits(rule_hits),
        },
    }
    return result


def iter_files(root: Path):
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        yield path


def classify_path(path: Path) -> str:
    if path.name.lower() == "skill.md":
        return "markdown"
    return TEXT_EXTENSIONS.get(path.suffix.lower(), "text")


def infer_role(path: Path) -> str:
    name = path.name.lower()
    suffix = path.suffix.lower()
    if name == "skill.md":
        return "skill_definition"
    if suffix in {".sh", ".bash", ".zsh", ".py"}:
        return "script"
    if suffix in {".md", ".markdown", ".txt"}:
        return "documentation"
    if suffix in {".json", ".yaml", ".yml", ".toml", ".ini", ".cfg"}:
        return "configuration"
    return "supporting"


def read_text(path: Path, *, max_file_bytes: int) -> tuple[str, bool, bool]:
    raw = path.read_bytes()
    truncated = len(raw) > max_file_bytes
    raw = raw[:max_file_bytes]
    if b"\x00" in raw:
        return "", True, False
    try:
        return raw.decode("utf-8"), False, truncated
    except UnicodeDecodeError:
        try:
            return raw.decode("utf-8", errors="replace"), False, truncated
        except UnicodeDecodeError:
            return "", True, False


def sha256_12(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]


def build_preview(text: str, preview_lines: int) -> str:
    return "\n".join(text.splitlines()[:preview_lines]).strip()


def artifact_id(path: str) -> str:
    return f"art-{sha256_12(path.encode('utf-8'))}"


def extract_claim_candidates(text: str, limit: int = 12) -> list[str]:
    claims: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            claims.append(stripped.lstrip("# ").strip())
        elif stripped.startswith(("-", "*")):
            claims.append(stripped[1:].strip())
        elif stripped.lower().startswith(("purpose:", "goal:", "description:")):
            claims.append(stripped.split(":", 1)[1].strip())
        if len(claims) >= limit:
            break
    return claims


def extract_code_block_payloads(text: str, *, max_blocks: int) -> list[dict[str, str | int | CodeBlock]]:
    lines = text.splitlines()
    blocks: list[dict[str, str | int | CodeBlock]] = []
    in_block = False
    start_line = 0
    language = ""
    buffer: list[str] = []

    for line_no, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not in_block and stripped.startswith("```"):
            in_block = True
            language = stripped[3:].strip().lower() or "text"
            start_line = line_no + 1
            buffer = []
            continue
        if in_block and stripped.startswith("```"):
            end_line = line_no - 1
            content = "\n".join(buffer)
            blocks.append(
                {
                    "summary": CodeBlock(
                    language=normalize_code_block_language(language),
                    start_line=start_line,
                    end_line=max(start_line, end_line),
                    preview=build_preview(content, 30),
                    ),
                    "content": content,
                }
            )
            if len(blocks) >= max_blocks:
                return blocks
            in_block = False
            language = ""
            buffer = []
            continue
        if in_block:
            buffer.append(line)
    return blocks


def normalize_code_block_language(language: str) -> str:
    if language in {"python", "py"}:
        return "python"
    if language in {"bash", "sh", "shell", "zsh"}:
        return "shell"
    if language in {"sql"}:
        return "sql"
    if language in {"json"}:
        return "json"
    if language in {"yaml", "yml"}:
        return "yaml"
    return "text"


def scan_code_block_payloads(path: str, code_blocks: list[dict[str, str | int | CodeBlock]]) -> list[RuleHit]:
    hits: list[RuleHit] = []
    for block in code_blocks:
        summary = block["summary"]
        content = str(block["content"])
        if not content:
            continue
        hits.extend(
            run_rules(
                path=path,
                kind=summary.language,
                text=content,
                source="code_block",
                line_offset=summary.start_line - 1,
            )
        )
    return hits


def rule_sort_key(hit: RuleHit):
    severity_rank = {"critical": 0, "high": 1, "med": 2, "low": 3}
    return (severity_rank.get(hit.severity, 9), hit.path, hit.start_line, hit.code)


def dedupe_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def build_excerpt_bundle(
    root: Path,
    requests: list[dict[str, Any]],
    *,
    allowed_paths: set[str] | None = None,
    context_before: int = 4,
    context_after: int = 4,
) -> list[dict[str, Any]]:
    excerpts: list[dict[str, Any]] = []
    seen: set[tuple[str, int, int]] = set()
    for request in requests:
        path = request.get("path", "")
        start = max(1, int(request.get("s", 1)))
        end = max(start, int(request.get("e", start)))
        key = (path, start, end)
        if not path or key in seen:
            continue
        seen.add(key)
        if allowed_paths is not None and path not in allowed_paths:
            excerpts.append(
                {
                    "path": path,
                    "requested_span": {"s": start, "e": end},
                    "error": "path_not_indexed",
                }
            )
            continue
        abs_path = (root / path).resolve()
        try:
            abs_path.relative_to(root.resolve())
        except ValueError:
            excerpts.append(
                {
                    "path": path,
                    "requested_span": {"s": start, "e": end},
                    "error": "path_outside_root",
                }
            )
            continue
        if not abs_path.exists() or not abs_path.is_file():
            excerpts.append(
                {
                    "path": path,
                    "requested_span": {"s": start, "e": end},
                    "error": "missing_file",
                }
            )
            continue
        text, binary, _ = read_text(abs_path, max_file_bytes=250_000)
        if binary:
            excerpts.append(
                {
                    "path": path,
                    "requested_span": {"s": start, "e": end},
                    "error": "binary_file",
                }
            )
            continue
        lines = text.splitlines()
        from_line = max(1, start - context_before)
        to_line = min(len(lines), end + context_after)
        excerpt_lines = [
            {"line": line_no, "text": lines[line_no - 1]}
            for line_no in range(from_line, to_line + 1)
        ]
        excerpts.append(
            {
                "path": path,
                "requested_span": {"s": start, "e": end},
                "context_span": {"s": from_line, "e": to_line},
                "reason": request.get("reason") or request.get("why", ""),
                "lines": excerpt_lines,
            }
        )
    return excerpts
