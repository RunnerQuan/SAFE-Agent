from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class PathsConfig:
    skills_dir: Path
    output_dir: Path


@dataclass(slots=True)
class LLMConfig:
    provider: str
    api_key: str
    api_key_env: str
    base_url: str
    model: str
    temperature: float
    request_timeout_seconds: int

    def resolve_api_key(self) -> str:
        if self.api_key:
            return self.api_key
        if self.api_key_env and os.getenv(self.api_key_env):
            return os.getenv(self.api_key_env, "")
        return os.getenv("OPENAI_API_KEY", "")


@dataclass(slots=True)
class ScanConfig:
    preprocess_only: bool
    max_context_rounds: int
    max_triage_artifacts: int
    max_triage_hits: int
    max_security_excerpts: int


@dataclass(slots=True)
class LoggingConfig:
    level: str
    console: bool
    file_enabled: bool
    filename: str


@dataclass(slots=True)
class WebConfig:
    scan_results_dir: Path
    malicious_library_dir: Path


@dataclass(slots=True)
class AppConfig:
    config_path: Path
    paths: PathsConfig
    llm: LLMConfig
    scan: ScanConfig
    logging: LoggingConfig
    web: WebConfig


def load_app_config(config_path: Path) -> AppConfig:
    resolved = config_path.resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"Config file does not exist: {resolved}")

    with resolved.open("rb") as handle:
        raw = tomllib.load(handle)

    base_dir = resolved.parent
    paths = raw.get("paths", {})
    llm = raw.get("llm", {})
    scan = raw.get("scan", {})
    logging_cfg = raw.get("logging", {})
    web = raw.get("web", {})

    return AppConfig(
        config_path=resolved,
        paths=PathsConfig(
            skills_dir=(base_dir / paths.get("skills_dir", "skills")).resolve(),
            output_dir=(base_dir / paths.get("output_dir", "scan-output")).resolve(),
        ),
        llm=LLMConfig(
            provider=str(llm.get("provider", "deepseek")),
            api_key=str(llm.get("api_key", "")),
            api_key_env=str(llm.get("api_key_env", "SKILL_SCAN_API_KEY")),
            base_url=str(llm.get("base_url", "")),
            model=str(llm.get("model", "deepseek-chat")),
            temperature=float(llm.get("temperature", 0.0)),
            request_timeout_seconds=int(llm.get("request_timeout_seconds", 120)),
        ),
        scan=ScanConfig(
            preprocess_only=bool(scan.get("preprocess_only", False)),
            max_context_rounds=int(scan.get("max_context_rounds", 1)),
            max_triage_artifacts=int(scan.get("max_triage_artifacts", 40)),
            max_triage_hits=int(scan.get("max_triage_hits", 80)),
            max_security_excerpts=int(scan.get("max_security_excerpts", 60)),
        ),
        logging=LoggingConfig(
            level=str(logging_cfg.get("level", "INFO")),
            console=bool(logging_cfg.get("console", True)),
            file_enabled=bool(logging_cfg.get("file", True)),
            filename=str(logging_cfg.get("filename", "run.log")),
        ),
        web=WebConfig(
            scan_results_dir=(base_dir / web.get("scan_results_dir", "scan-results")).resolve(),
            malicious_library_dir=(base_dir / web.get("malicious_library_dir", "malicious-skill-library")).resolve(),
        ),
    )
