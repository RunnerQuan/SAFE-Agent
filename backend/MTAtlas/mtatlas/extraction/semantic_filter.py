from __future__ import annotations

from typing import Iterable

from ..schemas import CandidateChain, ToolDefinition
from ..utils.llm import LLMCall, LLMClient, LLMTask, parse_json_response


class ChainSemanticFilter:
    """Uses an LLM to filter semantically implausible candidate chains."""

    def __init__(self, llm_client: LLMClient | None = None, max_llm_calls: int = 25) -> None:
        self.llm_client = llm_client
        self.max_llm_calls = max_llm_calls

    def filter(
        self,
        chains: Iterable[CandidateChain],
        tool_definitions: list[ToolDefinition | dict],
    ) -> tuple[list[CandidateChain], list[CandidateChain]]:
        tool_descriptions = self._tool_description_map(tool_definitions)
        accepted: list[CandidateChain] = []
        rejected: list[CandidateChain] = []
        llm_calls = 0

        for chain in chains:
            decision = self._rule_filter(chain)
            if decision is True:
                accepted.append(chain)
                continue
            if decision is False:
                rejected.append(chain)
                continue

            if self.llm_client is None or llm_calls >= self.max_llm_calls:
                accepted.append(chain)
                continue

            if self._llm_accepts(chain, tool_descriptions):
                accepted.append(chain)
            else:
                rejected.append(chain)
            llm_calls += 1

        return accepted, rejected

    def _rule_filter(self, chain: CandidateChain) -> bool | None:
        if not chain.tools:
            return False
        if len(chain.tools) > 4:
            return False
        if len(set(chain.tools)) <= max(1, len(chain.tools) // 2):
            return False
        if chain.tools[-1] != chain.sink_tool:
            return False
        if len(chain.tools) > 1 and not chain.dependency_sites:
            return False
        return None

    def _llm_accepts(self, chain: CandidateChain, tool_descriptions: dict[str, str]) -> bool:
        relevant_tools = {
            tool_name: tool_descriptions.get(tool_name, "")
            for tool_name in chain.tools
        }
        call = LLMCall(
            task=LLMTask.CHAIN_SEMANTIC_FILTER,
            system_prompt=(
                "You are evaluating whether a candidate tool chain is semantically "
                "plausible for an LLM agent. Respond in JSON with keys "
                '`{"accept": true|false, "reason": "...", "task": "..."}`. '
                "Accept only if the chain forms a coherent end-to-end workflow."
            ),
            user_prompt=(
                f"Chain: {list(chain.tools)}\n"
                f"Sink type: {chain.sink_type}\n"
                f"Dependency summary: {list(chain.dependency_summary)}\n"
                f"Dependency kinds: {list(chain.dependency_kinds)}\n"
                f"Dependency sites: {[site.evidence for site in chain.dependency_sites]}\n"
                f"Key dependency site: {chain.key_dependency_site.evidence if chain.key_dependency_site else ''}\n"
                f"Tool descriptions: {relevant_tools}"
            ),
            temperature=0.0,
        )
        try:
            result = self.llm_client.complete(call)
        except Exception:
            return True

        parsed = parse_json_response(result.text)
        if parsed is None:
            return "accept" in result.text.lower() and "false" not in result.text.lower()
        return bool(parsed.get("accept", True))

    def _tool_description_map(self, tool_definitions: list[ToolDefinition | dict]) -> dict[str, str]:
        description_map: dict[str, str] = {}
        for tool in tool_definitions:
            if isinstance(tool, ToolDefinition):
                description_map[tool.name] = tool.description
            else:
                name = tool.get("name")
                if name:
                    description_map[name] = tool.get("description", "")
        return description_map
