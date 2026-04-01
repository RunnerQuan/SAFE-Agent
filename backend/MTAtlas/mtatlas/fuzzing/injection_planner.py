from __future__ import annotations

from ..schemas import CandidateChain, InjectionPlan, ValidPrompt
from ..utils.llm import LLMCall, LLMClient, LLMTask


class InjectionPlanner:
    """Chooses user-source or env-source injection from chain annotations."""

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client

    def plan(self, chain: CandidateChain, valid_prompt: ValidPrompt) -> list[InjectionPlan]:
        plans: list[InjectionPlan] = []
        for point in chain.ingress_points:
            rationale = point.rationale
            if self.llm_client is not None and point.channel == "env-source":
                rationale = self._llm_rationale(chain, valid_prompt, point.mode, point.field_name) or rationale
            plans.append(
                InjectionPlan(
                    channel=point.channel,
                    mode=point.mode,
                    entry_tool=point.tool_name,
                    entry_index=point.tool_index,
                    entry_field=point.field_name,
                    target_sink=chain.sink_tool,
                    carrier=point.carrier,
                    rationale=rationale,
                    propagation_path=tuple(chain.tools[point.tool_index :]),
                )
            )

        if plans:
            return self._dedupe(plans)

        entry_tool = chain.tools[0] if chain.tools else chain.sink_tool
        carrier = chain.carriers[0] if chain.carriers else "content"
        entry_field = (
            chain.key_dependency_site.source_field
            if chain.key_dependency_site is not None and chain.key_dependency_site.source_field
            else "content"
        )
        return [
            InjectionPlan(
                channel="user-source",
                mode="direct",
                entry_tool=entry_tool,
                entry_index=0,
                entry_field=entry_field,
                target_sink=chain.sink_tool,
                carrier=carrier,
                rationale="Fallback plan when no stronger ingress annotation is available.",
                propagation_path=tuple(chain.tools),
            )
        ]

    def _llm_rationale(
        self,
        chain: CandidateChain,
        valid_prompt: ValidPrompt,
        env_mode: str,
        entry_field: str,
    ) -> str:
        call = LLMCall(
            task=LLMTask.INJECTION_PLANNING,
            system_prompt=(
                "Briefly explain why the chosen environment-source injection boundary is plausible "
                "for this tool chain. Return one sentence only."
            ),
            user_prompt=(
                f"Chain: {list(chain.tools)}\n"
                f"Carriers: {list(chain.carriers)}\n"
                f"Dependency sites: {[site.evidence for site in chain.dependency_sites]}\n"
                f"Threat families: {list(chain.threat_families)}\n"
                f"Chosen env mode: {env_mode}\n"
                f"Entry field: {entry_field}\n"
                f"Valid prompt: {valid_prompt.prompt}"
            ),
            temperature=0.0,
        )
        try:
            return self.llm_client.complete(call).text.strip()
        except Exception:
            return ""

    def _dedupe(self, plans: list[InjectionPlan]) -> list[InjectionPlan]:
        deduped: list[InjectionPlan] = []
        seen: set[tuple[str, str, str, str]] = set()
        for plan in plans:
            key = (plan.channel, plan.mode, plan.entry_tool, plan.entry_field)
            if key in seen:
                continue
            seen.add(key)
            deduped.append(plan)
        return deduped
