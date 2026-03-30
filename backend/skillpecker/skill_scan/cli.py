from __future__ import annotations

import json
import logging
from pathlib import Path

from .agents import AgentRunner
from .batch import BatchSkillScanner, discover_skill_dirs
from .config import load_app_config
from .llm import LLMClient, get_provider_profile
from .logging_utils import setup_logging
from .orchestrator import ScanSettings, SkillScanner

logger = logging.getLogger(__name__)


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    config = load_app_config(project_root / "scan_config.toml")
    config.paths.skills_dir.mkdir(parents=True, exist_ok=True)
    config.paths.output_dir.mkdir(parents=True, exist_ok=True)
    log_path = setup_logging(
        output_dir=config.paths.output_dir,
        level=config.logging.level,
        console=config.logging.console,
        file_enabled=config.logging.file_enabled,
        filename=config.logging.filename,
    )
    logger.info("Loaded config: path=%s", config.config_path)
    logger.info(
        "Resolved paths: skills_dir=%s output_dir=%s preprocess_only=%s",
        config.paths.skills_dir,
        config.paths.output_dir,
        config.scan.preprocess_only,
    )
    if log_path is not None:
        logger.info("File logging enabled: path=%s", log_path)
    skill_dirs = discover_skill_dirs(config.paths.skills_dir)
    scanner = build_scanner(config) if skill_dirs else None
    batch = BatchSkillScanner(scanner=scanner, preprocess_only=config.scan.preprocess_only)
    result = batch.run(
        skills_root=config.paths.skills_dir,
        output_root=config.paths.output_dir,
    )

    print(
        json.dumps(
            {
                "skills_root": str(config.paths.skills_dir),
                "output_root": str(config.paths.output_dir),
                "skill_count": result["skill_count"],
                "scanned_count": result["scanned_count"],
                "failed_count": result["failed_count"],
                "log_file": str(log_path) if log_path is not None else None,
            },
            ensure_ascii=False,
        )
    )
    return 0


def build_scanner(config) -> SkillScanner | None:
    if config.scan.preprocess_only:
        logger.info("Running in preprocess-only mode; LLM client will not be created.")
        return None

    api_key = config.llm.resolve_api_key()
    if not api_key:
        logger.error("Missing API key for full scan mode.")
        raise SystemExit(
            f"Missing API key. Set it in {config.config_path.name}, {config.llm.api_key_env}, or OPENAI_API_KEY."
        )

    logger.info(
        "Creating LLM client: provider=%s api_style=%s base_url=%s model=%s",
        config.llm.provider,
        get_provider_profile(config.llm.provider).api_style,
        config.llm.base_url or get_provider_profile(config.llm.provider).default_base_url,
        config.llm.model,
    )
    client = LLMClient(
        provider=config.llm.provider,
        api_key=api_key,
        base_url=config.llm.base_url or None,
        model=config.llm.model,
        temperature=config.llm.temperature,
        request_timeout_seconds=config.llm.request_timeout_seconds,
    )
    return SkillScanner(
        agents=AgentRunner(client=client),
        settings=ScanSettings(
            max_context_rounds=config.scan.max_context_rounds,
            max_triage_artifacts=config.scan.max_triage_artifacts,
            max_triage_hits=config.scan.max_triage_hits,
            max_security_excerpts=config.scan.max_security_excerpts,
        ),
    )
