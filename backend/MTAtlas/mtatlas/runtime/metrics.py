from __future__ import annotations

import time

from ..schemas import RunMetrics


class MetricsCollector:
    """Collects runtime, token, and ablation metrics."""

    def __init__(self) -> None:
        self.metrics = RunMetrics()
        self._started_at = time.time()

    def snapshot(self) -> RunMetrics:
        self.metrics.wall_time_seconds = time.time() - self._started_at
        return self.metrics

    def record_tool_call(self, count: int = 1) -> None:
        self.metrics.tool_calls += count

    def record_llm_usage(self, input_tokens: int, output_tokens: int) -> None:
        self.metrics.llm_calls += 1
        self.metrics.llm_input_tokens += input_tokens
        self.metrics.llm_output_tokens += output_tokens

    def record_vulnerability(self, elapsed_seconds: float) -> None:
        self.metrics.confirmed_vulnerabilities += 1
        if self.metrics.time_to_first_vulnerability_seconds is None:
            self.metrics.time_to_first_vulnerability_seconds = elapsed_seconds
