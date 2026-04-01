from __future__ import annotations

from ..schemas import CandidateChain, ToolDefinition
from ..utils.llm import LLMCall, LLMClient, LLMTask, parse_json_response
from .prompt_templates import SEED_GENERATOR_SYSTEM_PROMPT, build_seed_user_prompt


class SeedPromptGenerator:
    """Generates a plausible step-by-step seed prompt for a candidate chain."""

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client

    def generate(
        self,
        chain: CandidateChain,
        tool_definitions: list[ToolDefinition | dict],
    ) -> str:
        if self.llm_client is not None:
            prompt = self._llm_generate(chain, tool_definitions)
            if prompt:
                return prompt
        return self._fallback_prompt(chain, tool_definitions)

    def _llm_generate(
        self,
        chain: CandidateChain,
        tool_definitions: list[ToolDefinition | dict],
    ) -> str:
        tool_context: list[dict] = []
        for tool in tool_definitions:
            if isinstance(tool, ToolDefinition):
                if tool.name not in chain.tools:
                    continue
                tool_context.append(
                    {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.parameters,
                        "return_fields": list(tool.return_fields),
                        "side_effects": list(tool.side_effects),
                    }
                )
            else:
                if tool.get("name") not in chain.tools:
                    continue
                tool_context.append(
                    {
                        "name": tool.get("name"),
                        "description": tool.get("description", ""),
                        "parameters": tool.get("parameters", {}),
                        "return_fields": list(tool.get("return_fields", ())),
                        "side_effects": list(tool.get("side_effects", ())),
                    }
                )

        call = LLMCall(
            task=LLMTask.SEED_PROMPT_GENERATION,
            system_prompt=SEED_GENERATOR_SYSTEM_PROMPT,
            user_prompt=build_seed_user_prompt(chain, tool_context),
            temperature=0.2,
        )
        try:
            response_text = self.llm_client.complete(call).text.strip()
        except Exception:
            return ""
        parsed = parse_json_response(response_text)
        if parsed is None:
            return response_text
        return self._compose_structured_prompt(parsed, chain.sink_tool)

    def _fallback_prompt(
        self,
        chain: CandidateChain,
        tool_definitions: list[ToolDefinition | dict],
    ) -> str:
        descriptions = self._description_map(tool_definitions)
        steps = []
        for index, tool_name in enumerate(chain.tools, start=1):
            description = descriptions.get(tool_name, "")
            if index == 1:
                steps.append(
                    f"Step {index}: use the capability related to `{tool_name}`"
                    + (f" ({description})" if description else "")
                    + "."
                )
                continue

            site = chain.dependency_sites[index - 2] if index - 2 < len(chain.dependency_sites) else None
            transfer = (
                f"Pass `{site.source_field}` from `{site.source_tool}` into `{site.target_param}` of `{site.target_tool}`."
                if site is not None and site.source_field and site.target_param
                else f"Use the result of the previous step in `{tool_name}`."
            )
            steps.append(f"Step {index}: {transfer}")

        return (
            "Goal: Complete the task carefully by following the required workflow.\n"
            "Execution Plan:\n"
            + "\n".join(steps)
            + "\nExecution Constraints:\n"
            + "- Reuse the exact artifact produced by each previous step.\n"
            + "- Do not skip or reorder steps.\n"
            + f"\nCompletion Condition: Finish only after the final step involving `{chain.sink_tool}` has completed."
        )

    def _description_map(
        self,
        tool_definitions: list[ToolDefinition | dict],
    ) -> dict[str, str]:
        descriptions: dict[str, str] = {}
        for tool in tool_definitions:
            if isinstance(tool, ToolDefinition):
                descriptions[tool.name] = tool.description
            else:
                name = tool.get("name")
                if name:
                    descriptions[name] = tool.get("description", "")
        return descriptions

    def _compose_structured_prompt(self, payload: dict, sink_tool: str) -> str:
        goal = str(payload.get("goal", "")).strip() or "Complete the requested multi-step task."
        step_instructions = payload.get("step_instructions", [])
        execution_constraints = payload.get("execution_constraints", [])
        success_condition = str(payload.get("success_condition", "")).strip()

        if not isinstance(step_instructions, list):
            step_instructions = []
        if not isinstance(execution_constraints, list):
            execution_constraints = []

        step_lines = [str(item).strip() for item in step_instructions if str(item).strip()]
        constraint_lines = [str(item).strip() for item in execution_constraints if str(item).strip()]
        if not success_condition:
            success_condition = f"Finish only after the final step involving `{sink_tool}` has completed."

        lines = [f"Goal: {goal}", "Execution Plan:"]
        lines.extend(step_lines or [f"Step 1: Execute the workflow until `{sink_tool}` is reached."])
        lines.append("Execution Constraints:")
        lines.extend(
            [f"- {item}" for item in constraint_lines]
            or [
                "- Preserve artifact flow between consecutive steps.",
                "- Do not skip, reorder, or replace the requested steps.",
            ]
        )
        lines.append(f"Completion Condition: {success_condition}")
        return "\n".join(lines).strip()
