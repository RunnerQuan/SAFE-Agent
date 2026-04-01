from __future__ import annotations

from ..schemas import CandidateChain, PromptConstraint
from ..utils.llm import LLMCall, LLMClient, LLMTask, parse_json_response
from .prompt_templates import PROMPT_SOLVER_SYSTEM_PROMPT, build_solver_user_prompt


class PromptSolver:
    """Applies local prompt edits instead of rewriting the whole prompt."""

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client

    def repair(
        self,
        chain: CandidateChain,
        prompt: str,
        constraint: PromptConstraint,
    ) -> str:
        prefix, focus, suffix = self._repair_window(prompt, constraint.failure_point)
        if self.llm_client is not None:
            repaired = self._llm_repair(chain, prefix, focus, suffix, constraint)
            if repaired and self._satisfies_constraint(repaired, constraint):
                return self._compose_prompt(prefix, repaired, suffix)
        repaired = self._fallback_repair(chain, focus, constraint)
        return self._compose_prompt(prefix, repaired, suffix)

    def _llm_repair(
        self,
        chain: CandidateChain,
        prefix: list[str],
        focus: list[str],
        suffix: list[str],
        constraint: PromptConstraint,
    ) -> list[str]:
        call = LLMCall(
            task=LLMTask.TPS_PROMPT_REPAIR,
            system_prompt=PROMPT_SOLVER_SYSTEM_PROMPT,
            user_prompt=build_solver_user_prompt(chain, prefix, focus, suffix, constraint),
            temperature=0.2,
        )
        try:
            result = self.llm_client.complete(call).text.strip()
        except Exception:
            return []
        parsed = parse_json_response(result)
        if parsed is None:
            return []
        patched_segment = parsed.get("patched_segment", [])
        if isinstance(patched_segment, str):
            patched_segment = [line.rstrip() for line in patched_segment.splitlines() if line.strip()]
        if not isinstance(patched_segment, list):
            return []
        cleaned = [str(line).rstrip() for line in patched_segment if str(line).strip()]
        return cleaned

    def _fallback_repair(
        self,
        chain: CandidateChain,
        focus: list[str],
        constraint: PromptConstraint,
    ) -> list[str]:
        guidance = [constraint.summary, constraint.local_edit_hint]
        guidance.extend(constraint.instructions)
        if constraint.binding_requirements:
            guidance.append(
                "Required bindings: "
                + "; ".join(
                    self._render_binding_requirement(requirement)
                    for requirement in constraint.binding_requirements
                )
            )
        if constraint.missing_preconditions:
            guidance.append(
                "Missing preconditions to satisfy first: " + ", ".join(constraint.missing_preconditions)
            )
        if constraint.format_requirements:
            guidance.append(
                "Format requirements: "
                + "; ".join(
                    self._render_format_requirement(requirement)
                    for requirement in constraint.format_requirements
                )
            )
        if constraint.gate_instructions:
            guidance.append(
                "Gate instructions: " + ", ".join(constraint.gate_instructions)
            )
        if constraint.disallowed_tools:
            guidance.append(
                "Avoid these detours: " + ", ".join(constraint.disallowed_tools)
            )
        if constraint.satisfaction_checks:
            guidance.append(
                "Satisfaction checks: " + "; ".join(constraint.satisfaction_checks)
            )

        patched = [line for line in focus if line.strip()]
        repair_lines = [f"- {item}" for item in guidance if item]
        trailer = f"- Continue until the sink tool `{chain.sink_tool}` is executed."
        if trailer not in repair_lines:
            repair_lines.append(trailer)
        if not patched:
            patched = ["Execution requirements:"]
        elif "Execution requirements:" not in patched:
            patched.append("Execution requirements:")
        patched.extend(line for line in repair_lines if line not in patched)
        return patched

    def _repair_window(self, prompt: str, failure_point: int) -> tuple[list[str], list[str], list[str]]:
        lines = [line.rstrip() for line in prompt.splitlines()]
        if not lines:
            return [], [], []

        step_markers = self._step_marker_indices(lines)
        target_step = max(1, failure_point + 1)
        if step_markers:
            start = step_markers.get(target_step)
            if start is not None:
                next_markers = [index for step_no, index in step_markers.items() if step_no > target_step]
                end = min(next_markers) if next_markers else len(lines)
                prefix = lines[:start]
                focus = lines[start:end]
                suffix = lines[end:]
                return prefix, focus, suffix

        failure_line = min(len(lines) - 1, max(0, failure_point + 2))
        start = max(0, failure_line - 1)
        end = min(len(lines), failure_line + 2)
        prefix = lines[:start]
        focus = lines[start:end]
        suffix = lines[end:]
        return prefix, focus, suffix

    def _compose_prompt(self, prefix: list[str], patched_segment: list[str], suffix: list[str]) -> str:
        lines = prefix + patched_segment + suffix
        return "\n".join(line for line in lines if line is not None).strip()

    def _step_marker_indices(self, lines: list[str]) -> dict[int, int]:
        markers: dict[int, int] = {}
        for index, line in enumerate(lines):
            stripped = line.strip()
            if not stripped.lower().startswith("step "):
                continue
            number_text = stripped[5:].split(":", 1)[0].strip()
            if not number_text.isdigit():
                continue
            markers[int(number_text)] = index
        return markers

    def _satisfies_constraint(self, patched_segment: list[str], constraint: PromptConstraint) -> bool:
        patched_text = "\n".join(patched_segment).lower()
        for precondition in constraint.missing_preconditions:
            if not self._contains_any_token(patched_text, precondition):
                return False
        for instruction in constraint.gate_instructions:
            if not self._contains_any_token(patched_text, instruction):
                return False
        for requirement in constraint.binding_requirements:
            target_param = str(requirement.get("target_param", "")).lower()
            artifact = str(requirement.get("artifact", "")).lower()
            if target_param and target_param not in patched_text:
                return False
            if artifact and artifact not in {"previous output", "output"} and artifact not in patched_text:
                return False
        for requirement in constraint.format_requirements:
            expected_format = str(requirement.get("expected_format", "")).lower()
            parameter = str(requirement.get("parameter", "")).lower()
            if parameter and parameter not in patched_text:
                return False
            if expected_format and not self._contains_any_token(patched_text, expected_format):
                return False
        return True

    def _contains_any_token(self, patched_text: str, phrase: str) -> bool:
        phrase = phrase.lower().strip()
        if not phrase:
            return True
        if phrase in patched_text:
            return True
        tokens = [token for token in phrase.replace("`", "").replace(",", " ").split() if len(token) > 3]
        return any(token in patched_text for token in tokens)

    def _render_binding_requirement(self, requirement: dict) -> str:
        from_tool = requirement.get("from_tool", "previous tool")
        artifact = requirement.get("artifact", "artifact")
        to_tool = requirement.get("to_tool", "next tool")
        target_param = requirement.get("target_param", "parameter")
        return f"use `{artifact}` from `{from_tool}` as `{target_param}` for `{to_tool}`"

    def _render_format_requirement(self, requirement: dict) -> str:
        tool = requirement.get("tool", "tool")
        parameter = requirement.get("parameter", "parameter")
        expected_format = requirement.get("expected_format", "required format")
        return f"`{tool}` must receive `{parameter}` in `{expected_format}` format"
