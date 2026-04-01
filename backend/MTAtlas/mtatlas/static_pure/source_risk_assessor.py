from __future__ import annotations

import json
from typing import Any

from ..schemas import CandidateChain
from ..utils.llm import LLMCall, LLMClient, LLMTask, parse_json_response


SOURCE_RISK_SYSTEM_PROMPT = """You are the MTAtlas Source Risk Assessor.

You analyze a static candidate tool chain and decide whether it plausibly supports:
1. user-source injection risk, where malicious content can enter through user-controlled dialogue inputs
2. environment-source injection risk, where malicious content can enter through untrusted external content ingested by a tool

Rules:
- This is static analysis, not runtime validation.
- Report only potential risks that are semantically plausible.
- The boundary must be the earliest chain step where the untrusted data can enter and still plausibly propagate to the sink tool.
- If both user-source and environment-source are plausible, keep both.
- Do not claim exploitability or successful validation.

Return JSON with keys:
{
  "user_source_risk": {
    "supported": true,
    "earliest_tool": "...",
    "earliest_field": "...",
    "carrier": "...",
    "reason": "...",
    "confidence": "high|medium|low"
  },
  "environment_source_risk": {
    "supported": true,
    "earliest_tool": "...",
    "earliest_field_or_resource": "...",
    "carrier": "...",
    "reason": "...",
    "confidence": "high|medium|low"
  },
  "recommended_boundary": {
    "type": "user-source|environment-source|none",
    "tool": "...",
    "field_or_resource": "...",
    "reason": "..."
  }
}
"""


class SourceRiskAssessor:
    """Assesses potential user-source and environment-source risks for static chains."""

    USER_SOURCE_HINTS = {"content", "text", "body", "query", "url", "path", "template", "code", "command", "input", "prompt", "message"}
    ENV_SOURCE_EFFECTS = {"external_input", "email_read", "network_read", "file_read", "db_read", "db_execute"}

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client

    def assess(
        self,
        chains: list[CandidateChain],
        normalized_tools: dict[str, dict[str, Any]],
    ) -> list[dict[str, Any]]:
        assessments: list[dict[str, Any]] = []
        for index, chain in enumerate(chains, start=1):
            chain_id = f"chain_{index:03d}"
            chain_display = self._chain_display(chain)
            chain_display_with_mcp = self._chain_display_with_mcp(chain, normalized_tools)
            user_candidate = self._user_source_candidate(chain, normalized_tools)
            env_candidate = self._environment_source_candidate(chain, normalized_tools)
            llm_result = self._llm_assessment(chain, normalized_tools, user_candidate, env_candidate)
            assessment = {
                "chain_id": chain_id,
                "tools": list(chain.tools),
                "chain_display": chain_display,
                "chain_display_with_mcp": chain_display_with_mcp,
                "sink_tool": chain.sink_tool,
                "sink_type": chain.sink_type,
                "user_source_risk": llm_result.get("user_source_risk", user_candidate),
                "environment_source_risk": llm_result.get("environment_source_risk", env_candidate),
                "recommended_boundary": llm_result.get(
                    "recommended_boundary",
                    self._default_boundary(user_candidate, env_candidate),
                ),
            }
            assessments.append(assessment)
        return assessments

    def _llm_assessment(
        self,
        chain: CandidateChain,
        normalized_tools: dict[str, dict[str, Any]],
        user_candidate: dict[str, Any],
        env_candidate: dict[str, Any],
    ) -> dict[str, Any]:
        if self.llm_client is None:
            return {}

        chain_tools = [normalized_tools.get(tool_name, {"tool_name": tool_name}) for tool_name in chain.tools]
        call = LLMCall(
            task=LLMTask.SOURCE_RISK_ASSESSMENT,
            system_prompt=SOURCE_RISK_SYSTEM_PROMPT,
            user_prompt=(
                "Candidate chain: "
                + json.dumps(list(chain.tools), ensure_ascii=False)
                + "\n"
                + "Sink type: "
                + chain.sink_type
                + "\n"
                + "Dependency sites: "
                + json.dumps([site.evidence for site in chain.dependency_sites], ensure_ascii=False)
                + "\n"
                + "Tool metadata along chain: "
                + json.dumps(chain_tools, ensure_ascii=False)
                + "\n"
                + "Rule-derived user-source candidate: "
                + json.dumps(user_candidate, ensure_ascii=False)
                + "\n"
                + "Rule-derived environment-source candidate: "
                + json.dumps(env_candidate, ensure_ascii=False)
            ),
            temperature=0.0,
        )
        try:
            result = self.llm_client.complete(call)
        except Exception:
            return {}
        parsed = parse_json_response(result.text)
        return parsed if isinstance(parsed, dict) else {}

    def _user_source_candidate(self, chain: CandidateChain, normalized_tools: dict[str, dict[str, Any]]) -> dict[str, Any]:
        for tool_name in chain.tools:
            tool = normalized_tools.get(tool_name, {})
            for parameter in tool.get("input_params", ()):
                field_name = str(parameter.get("name", ""))
                carrier = self._carrier_from_field(field_name)
                if carrier in self.USER_SOURCE_HINTS or field_name:
                    confidence = "high" if carrier in self.USER_SOURCE_HINTS else "low"
                    return {
                        "supported": True,
                        "earliest_tool": tool_name,
                        "earliest_field": field_name,
                        "carrier": carrier or "input",
                        "reason": (
                            f"`{tool_name}` accepts user-controlled input through `{field_name}`, "
                            "which can plausibly enter the chain from dialogue."
                        ),
                        "confidence": confidence,
                    }
        return {
            "supported": False,
            "earliest_tool": "",
            "earliest_field": "",
            "carrier": "",
            "reason": "No clear user-controlled input field was found on this chain.",
            "confidence": "low",
        }

    def _environment_source_candidate(self, chain: CandidateChain, normalized_tools: dict[str, dict[str, Any]]) -> dict[str, Any]:
        for tool_name in chain.tools:
            tool = normalized_tools.get(tool_name, {})
            side_effects = set(tool.get("side_effects", ()))
            content_sources = list(tool.get("content_sources", ()))
            if side_effects & self.ENV_SOURCE_EFFECTS or content_sources:
                resource = content_sources[0] if content_sources else "external content"
                carrier = self._carrier_from_source(resource)
                return {
                    "supported": True,
                    "earliest_tool": tool_name,
                    "earliest_field_or_resource": resource,
                    "carrier": carrier,
                    "reason": (
                        f"`{tool_name}` appears to ingest untrusted external content from `{resource}`, "
                        "which can plausibly propagate toward the sink."
                    ),
                    "confidence": "high" if content_sources else "medium",
                }
        return {
            "supported": False,
            "earliest_tool": "",
            "earliest_field_or_resource": "",
            "carrier": "",
            "reason": "No clear external-content ingestion point was found on this chain.",
            "confidence": "low",
        }

    def _default_boundary(self, user_candidate: dict[str, Any], env_candidate: dict[str, Any]) -> dict[str, Any]:
        if env_candidate.get("supported"):
            return {
                "type": "environment-source",
                "tool": env_candidate.get("earliest_tool", ""),
                "field_or_resource": env_candidate.get("earliest_field_or_resource", ""),
                "reason": env_candidate.get("reason", ""),
            }
        if user_candidate.get("supported"):
            return {
                "type": "user-source",
                "tool": user_candidate.get("earliest_tool", ""),
                "field_or_resource": user_candidate.get("earliest_field", ""),
                "reason": user_candidate.get("reason", ""),
            }
        return {"type": "none", "tool": "", "field_or_resource": "", "reason": "No plausible ingress boundary found."}

    def _chain_display(self, chain: CandidateChain) -> str:
        return " -> ".join(chain.tools)

    def _chain_display_with_mcp(self, chain: CandidateChain, normalized_tools: dict[str, dict[str, Any]]) -> str:
        parts: list[str] = []
        for tool_name in chain.tools:
            mcp_name = normalized_tools.get(tool_name, {}).get("mcp_name", "Unknown MCP")
            parts.append(f"[{mcp_name}] {tool_name}")
        return " -> ".join(parts)

    def _carrier_from_field(self, field_name: str) -> str:
        lowered = field_name.lower()
        for token in ("content", "text", "body", "query", "url", "path", "template", "code", "command", "prompt", "message", "id"):
            if token in lowered:
                return token
        return lowered

    def _carrier_from_source(self, resource: str) -> str:
        lowered = resource.lower()
        if "email" in lowered:
            return "email_content"
        if "web" in lowered:
            return "web_content"
        if "file" in lowered:
            return "file_content"
        if "database" in lowered:
            return "database_record"
        if "index" in lowered:
            return "indexed_document"
        if "cache" in lowered:
            return "cached_content"
        return lowered
