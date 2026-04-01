from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from ..interfaces import BaseTargetAgent
from .workflow import MTAtlasWorkflow


@dataclass
class ExperimentRunner:
    """Batch runner for multi-app evaluation and ablation studies."""

    workflow_factory: Callable[[BaseTargetAgent, str], MTAtlasWorkflow]

    def run_framework(self, framework: str, agent: BaseTargetAgent) -> dict:
        workflow = self.workflow_factory(agent, framework)
        return workflow.run()
