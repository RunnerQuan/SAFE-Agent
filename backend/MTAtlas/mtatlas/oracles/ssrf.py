from __future__ import annotations

from typing import Any

from .base import BaseOracle
from ..schemas import CandidateChain, OracleEvidence, PayloadVariant


class SSRFOracle(BaseOracle):
    def evaluate(
        self,
        chain: CandidateChain,
        payload: PayloadVariant,
        trace: list[dict[str, Any]],
        state_before: dict[str, Any],
        state_after: dict[str, Any],
        runtime_events: list[dict[str, Any]],
    ) -> OracleEvidence:
        sink_reached, hits = self._payload_in_runtime_field(
            payload,
            runtime_events,
            "SSRF",
            ("destination", "arguments_preview"),
        )
        if not sink_reached:
            sink_reached, hits = self._payload_in_sink_args(chain, payload, trace)
        internal_target, target_hits = self._internal_target_observed(payload, trace, runtime_events)
        verdict = sink_reached and internal_target
        summary = (
            "Network sink reached with an internal or designated probe target."
            if verdict
            else "No payload-influenced internal SSRF target observed."
        )
        return OracleEvidence(
            verdict=verdict,
            oracle_name="SSRFOracle",
            summary=summary,
            raw_events=tuple(hits + target_hits),
            details={"sink_reached": sink_reached, "internal_target": internal_target},
        )
