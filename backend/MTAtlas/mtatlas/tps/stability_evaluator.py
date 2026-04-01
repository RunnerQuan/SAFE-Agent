from __future__ import annotations

from ..interfaces import BaseTargetAgent
from ..schemas import CandidateChain, ValidPrompt
from .trace_monitor import TraceMonitor


class StabilityEvaluator:
    """Measures reachability and 5/5 stability for TPS outputs."""

    def __init__(self, monitor: TraceMonitor) -> None:
        self.monitor = monitor

    def evaluate(
        self,
        agent: BaseTargetAgent,
        chain: CandidateChain,
        prompt: str,
        reachability_runs: int = 10,
        stable_runs: int = 5,
    ) -> ValidPrompt | None:
        reachability_successes = 0
        sample_trace: tuple[dict, ...] = ()

        for _ in range(reachability_runs):
            alignment, trace = self._run_once(agent, chain, prompt)
            if alignment.status == "SUCCESS":
                reachability_successes += 1
                if not sample_trace:
                    sample_trace = tuple(trace)

        stable_successes = 0
        for _ in range(stable_runs):
            alignment, trace = self._run_once(agent, chain, prompt)
            if alignment.status != "SUCCESS":
                break
            stable_successes += 1
            if not sample_trace:
                sample_trace = tuple(trace)

        if stable_successes != stable_runs:
            return None

        return ValidPrompt(
            prompt=prompt,
            chain=chain,
            reachability_runs=reachability_runs,
            reachability_successes=reachability_successes,
            stable_successes=stable_successes,
            sample_trace=sample_trace,
        )

    def _run_once(
        self,
        agent: BaseTargetAgent,
        chain: CandidateChain,
        prompt: str,
    ) -> tuple:
        agent.reset()
        agent.chat(prompt)
        raw_trace = agent.get_last_trace()
        trace = [self._trace_to_dict(event) for event in raw_trace]
        alignment = self.monitor.align(chain, trace)
        return alignment, trace

    def _trace_to_dict(self, event) -> dict:
        if hasattr(event, "__dict__"):
            return dict(event.__dict__)
        return dict(event)
