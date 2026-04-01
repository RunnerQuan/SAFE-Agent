from __future__ import annotations

from typing import Any

from .base import BaseOracle
from ..schemas import CandidateChain, OracleEvidence, PayloadVariant


class SQLiOracle(BaseOracle):
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
            "SQLi",
            ("query", "arguments_preview"),
        )
        if not sink_reached:
            sink_reached, hits = self._payload_in_sink_args(chain, payload, trace)
        marker_seen, marker_hits = self._marker_observed(payload, trace, state_after, runtime_events)
        sql_keywords = ("syntax error", "row", "rows", "query", "select", "sqlite", "sql")
        keyword_hits = self._runtime_keyword_hits(runtime_events, "SQLi", sql_keywords)
        verdict = sink_reached and (marker_seen or bool(keyword_hits))
        summary = (
            "Database sink reached with payload-influenced query and observable probe effect."
            if verdict
            else "No SQLi evidence beyond payload placement."
        )
        return OracleEvidence(
            verdict=verdict,
            oracle_name="SQLiOracle",
            summary=summary,
            raw_events=tuple(hits + marker_hits + keyword_hits),
            details={"sink_reached": sink_reached, "marker_seen": marker_seen},
        )
