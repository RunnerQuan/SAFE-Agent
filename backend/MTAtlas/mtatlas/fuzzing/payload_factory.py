from __future__ import annotations

import uuid

from ..schemas import CandidateChain, PayloadVariant


class PayloadFactory:
    """Builds sink-specific payload probes."""

    def generate(self, chain: CandidateChain) -> list[PayloadVariant]:
        marker = f"CF_{chain.sink_type}_{uuid.uuid4().hex[:8]}"
        sink_type = chain.sink_type.upper()

        if sink_type == "CMDI":
            return [
                PayloadVariant(
                    sink_type="CMDi",
                    template_id="cmd_echo_marker",
                    payload=f"echo '{marker}'",
                    marker=marker,
                    expected_signal=marker,
                )
            ]
        if sink_type == "CODEI":
            return [
                PayloadVariant(
                    sink_type="CODEi",
                    template_id="python_print_marker",
                    payload=f"print('{marker}')",
                    marker=marker,
                    expected_signal=marker,
                )
            ]
        if sink_type == "SSRF":
            return [
                PayloadVariant(
                    sink_type="SSRF",
                    template_id="loopback_url",
                    payload=f"http://127.0.0.1/{marker.lower()}",
                    marker=marker,
                    expected_signal="127.0.0.1",
                )
            ]
        if sink_type == "SQLI":
            return [
                PayloadVariant(
                    sink_type="SQLi",
                    template_id="tautology_probe",
                    payload=f"' OR '1'='1' -- {marker}",
                    marker=marker,
                    expected_signal=marker,
                )
            ]
        if sink_type == "SSTI":
            return [
                PayloadVariant(
                    sink_type="SSTI",
                    template_id="jinja_literal_marker",
                    payload=f"{{{{ '{marker}' }}}}",
                    marker=marker,
                    expected_signal=marker,
                )
            ]

        return [
            PayloadVariant(
                sink_type=chain.sink_type,
                template_id="generic_marker",
                payload=marker,
                marker=marker,
                expected_signal=marker,
            )
        ]
