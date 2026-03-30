from __future__ import annotations

from dataclasses import asdict, dataclass, field, is_dataclass
from typing import Any


@dataclass(slots=True)
class Span:
    path: str
    s: int
    e: int
    why: str


@dataclass(slots=True)
class RuleHit:
    code: str
    severity: str
    path: str
    start_line: int
    end_line: int
    message: str
    excerpt: str
    source: str = "file"


@dataclass(slots=True)
class CodeBlock:
    language: str
    start_line: int
    end_line: int
    preview: str


@dataclass(slots=True)
class Artifact:
    id: str
    path: str
    kind: str
    role: str
    size_bytes: int
    line_count: int
    preview: str
    truncated: bool = False
    binary: bool = False
    sha256_12: str = ""
    code_blocks: list[CodeBlock] = field(default_factory=list)
    hit_count: int = 0


@dataclass(slots=True)
class CoverageGap:
    path: str
    why: str


def to_plain_data(value: Any) -> Any:
    if is_dataclass(value):
        return {key: to_plain_data(val) for key, val in asdict(value).items()}
    if isinstance(value, dict):
        return {key: to_plain_data(val) for key, val in value.items()}
    if isinstance(value, list):
        return [to_plain_data(item) for item in value]
    return value
