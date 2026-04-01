from __future__ import annotations

from ..interfaces import BaseTargetAgent
from ..schemas import InjectionPlan, PayloadVariant


class EnvironmentInjector:
    """Applies environment-source payloads through adapter hooks."""

    def inject(
        self,
        agent: BaseTargetAgent,
        plan: InjectionPlan,
        payload: PayloadVariant,
    ) -> None:
        agent.prepare_environment_injection(plan, payload)
