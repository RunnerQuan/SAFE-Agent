from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from .schemas import InjectionPlan, PayloadVariant, ToolDefinition, TraceEvent


class BaseTargetAgent(ABC):
    """Extended target-agent interface for MTAtlas."""

    @abstractmethod
    def get_tool_definitions(self) -> list[ToolDefinition | dict[str, Any]]:
        """Return tool metadata used for prompting and dependency analysis."""

    @abstractmethod
    def get_tool_source_map(self) -> dict[str, str]:
        """Return tool source code keyed by tool name."""

    @abstractmethod
    def reset(self) -> None:
        """Reset the target agent and its environment."""

    @abstractmethod
    def chat(self, user_prompt: str) -> str:
        """Execute a prompt against the target agent."""

    @abstractmethod
    def get_last_trace(self) -> list[TraceEvent | dict[str, Any]]:
        """Return the last execution trace."""

    @abstractmethod
    def get_state_snapshot(self) -> dict[str, Any]:
        """Return the current observable environment state."""

    def prepare_environment_injection(
        self, plan: InjectionPlan, payload: PayloadVariant
    ) -> None:
        """Optional hook for env-source injection."""
        raise NotImplementedError("Environment injection is adapter-specific.")

    def get_runtime_events(self) -> list[dict[str, Any]]:
        """Optional hook for sink-specific runtime instrumentation."""
        return []
