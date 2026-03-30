from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .llm import LLMClient
from .prompts import JUDGE_SYSTEM_PROMPT, SECURITY_SYSTEM_PROMPT, TRIAGE_SYSTEM_PROMPT


@dataclass(slots=True)
class AgentRunner:
    client: LLMClient

    def run_triage(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.client.complete_json(TRIAGE_SYSTEM_PROMPT, payload, operation_name="triage")
        require_keys(result, {"skill", "arts", "xconcerns", "retrieve", "coverage"}, "triage")
        return result

    def run_security(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.client.complete_json(SECURITY_SYSTEM_PROMPT, payload, operation_name="security")
        require_keys(result, {"findings", "ctx_requests", "coverage"}, "security")
        return result

    def run_judge(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.client.complete_json(JUDGE_SYSTEM_PROMPT, payload, operation_name="judge")
        require_keys(result, {"verdict", "top_findings", "coverage_audit", "next_action"}, "judge")
        return result


def require_keys(value: dict[str, Any], keys: set[str], name: str) -> None:
    missing = [key for key in keys if key not in value]
    if missing:
        raise ValueError(f"{name} output is missing keys: {', '.join(sorted(missing))}")
