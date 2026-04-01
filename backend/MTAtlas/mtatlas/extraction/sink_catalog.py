from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SinkAPISpec:
    package: str
    class_name: str | None
    methods: tuple[str, ...]
    sink_type: str
    keyword_hints: tuple[str, ...]


SINK_API_SPECS: tuple[SinkAPISpec, ...] = (
    SinkAPISpec(
        "subprocess",
        None,
        ("run", "call", "check_call", "Popen", "getoutput"),
        "CMDi",
        ("args", "command", "cmd"),
    ),
    SinkAPISpec(
        "os",
        None,
        ("system", "popen", "exec*", "spawn*"),
        "CMDi",
        ("command", "cmd", "args"),
    ),
    SinkAPISpec("builtins", None, ("eval", "exec"), "CODEi", ("code", "source", "expression")),
    SinkAPISpec("urllib", None, ("request.urlopen",), "SSRF", ("url", "uri")),
    SinkAPISpec("requests", None, ("get", "post", "request"), "SSRF", ("url", "uri")),
    SinkAPISpec("requests", "Session", ("get", "post", "request"), "SSRF", ("url", "uri")),
    SinkAPISpec("httpx", "AsyncClient", ("get", "post", "request"), "SSRF", ("url", "uri")),
    SinkAPISpec("aiohttp", "ClientSession", ("get", "post", "request"), "SSRF", ("url", "uri")),
    SinkAPISpec("urllib3", "PoolManager", ("urlopen", "request"), "SSRF", ("url", "uri")),
    SinkAPISpec("urllib3", None, ("request",), "SSRF", ("url", "uri")),
    SinkAPISpec("jinja2", "Environment", ("from_string",), "SSTI", ("template", "source", "string")),
    SinkAPISpec("flask", "Function", ("render_template_string",), "SSTI", ("template", "source", "string")),
    SinkAPISpec("sqlite3", "Cursor", ("execute",), "SQLi", ("query", "sql", "statement")),
    SinkAPISpec("sqlalchemy", "Session", ("execute",), "SQLi", ("query", "sql", "statement")),
    SinkAPISpec("sqlalchemy", "Connection", ("execute",), "SQLi", ("query", "sql", "statement")),
    SinkAPISpec("django", None, ("cursor.execute",), "SQLi", ("query", "sql", "statement")),
)
