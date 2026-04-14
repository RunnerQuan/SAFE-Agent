from __future__ import annotations

import unittest
from pathlib import Path

from fastapi import HTTPException

from skill_scan.config import (
    AppConfig,
    LLMConfig,
    LoggingConfig,
    PathsConfig,
    ScanConfig,
    WebConfig,
    apply_task_llm_override,
)
from skill_scan.webapp import normalize_runtime_llm_override


def make_config() -> AppConfig:
    return AppConfig(
        config_path=Path("/tmp/scan_config.toml"),
        paths=PathsConfig(
            skills_dir=Path("/tmp/skills"),
            output_dir=Path("/tmp/output"),
        ),
        llm=LLMConfig(
            provider="deepseek",
            api_key="existing-secret",
            api_key_env="SKILL_SCAN_API_KEY",
            base_url="https://api.deepseek.com",
            model="deepseek-chat",
            temperature=0.0,
            request_timeout_seconds=120,
        ),
        scan=ScanConfig(
            preprocess_only=False,
            max_context_rounds=1,
            max_triage_artifacts=40,
            max_triage_hits=80,
            max_security_excerpts=60,
        ),
        logging=LoggingConfig(
            level="INFO",
            console=True,
            file_enabled=True,
            filename="run.log",
        ),
        web=WebConfig(
            scan_results_dir=Path("/tmp/results"),
            malicious_library_dir=Path("/tmp/library"),
        ),
    )


class NormalizeRuntimeLLMOverrideTests(unittest.TestCase):
    def test_normalize_runtime_llm_override_trims_and_normalizes_values(self) -> None:
        override = normalize_runtime_llm_override(provider=" OpenAI ", model=" gpt-4.1-mini ", api_key=" sk-test ")

        self.assertEqual(
            override,
            {
                "provider": "openai",
                "model": "gpt-4.1-mini",
                "api_key": "sk-test",
            },
        )

    def test_normalize_runtime_llm_override_rejects_missing_fields(self) -> None:
        with self.assertRaises(HTTPException) as context:
            normalize_runtime_llm_override(provider="openai", model="gpt-4.1", api_key=" ")

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("API key", str(context.exception.detail))


class ApplyTaskLLMOverrideTests(unittest.TestCase):
    def test_apply_task_llm_override_returns_config_with_runtime_values(self) -> None:
        config = make_config()

        updated = apply_task_llm_override(
            config,
            provider="openai",
            model="gpt-4.1-mini",
            api_key="sk-runtime",
        )

        self.assertEqual(updated.llm.provider, "openai")
        self.assertEqual(updated.llm.model, "gpt-4.1-mini")
        self.assertEqual(updated.llm.api_key, "sk-runtime")
        self.assertEqual(updated.llm.base_url, config.llm.base_url)
        self.assertEqual(updated.paths.skills_dir, config.paths.skills_dir)
        self.assertEqual(updated.paths.output_dir, config.paths.output_dir)
        self.assertEqual(config.llm.provider, "deepseek")
        self.assertEqual(config.llm.model, "deepseek-chat")
        self.assertEqual(config.llm.api_key, "existing-secret")


if __name__ == "__main__":
    unittest.main()
