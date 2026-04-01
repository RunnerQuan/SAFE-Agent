from __future__ import annotations

from typing import Any

from .base import BaseOracle
from ..schemas import CandidateChain, OracleEvidence, PayloadVariant


class SSTIOracle(BaseOracle):
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
            "SSTI",
            ("template", "arguments_preview"),
        )
        if not sink_reached:
            sink_reached, hits = self._payload_in_sink_args(chain, payload, trace)
        marker_seen, marker_hits = self._marker_observed(payload, trace, state_after, runtime_events)
        verdict = sink_reached and marker_seen
        summary = (
            "Template sink reached and rendered probe output observed."
            if verdict
            else "No SSTI rendering evidence observed."
        )
        return OracleEvidence(
            verdict=verdict,
            oracle_name="SSTIOracle",
            summary=summary,
            raw_events=tuple(hits + marker_hits),
            details={"sink_reached": sink_reached, "marker_seen": marker_seen},
        )
