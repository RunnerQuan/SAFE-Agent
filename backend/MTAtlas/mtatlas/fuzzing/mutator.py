from __future__ import annotations

import base64

from ..schemas import PayloadVariant
from ..utils.llm import LLMCall, LLMClient, LLMTask, parse_json_response


class PayloadMutator:
    """Mutates payload form while preserving sink-specific syntax."""

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client

    def mutate(self, payload: PayloadVariant) -> list[PayloadVariant]:
        variants = [payload]
        sink_type = payload.sink_type.upper()

        if sink_type == "CMDI":
            variants.extend(self._mutate_cmdi(payload))
        elif sink_type == "CODEI":
            variants.extend(self._mutate_codei(payload))
        elif sink_type == "SSRF":
            variants.extend(self._mutate_ssrf(payload))
        elif sink_type == "SQLI":
            variants.extend(self._mutate_sqli(payload))
        elif sink_type == "SSTI":
            variants.extend(self._mutate_ssti(payload))
        else:
            variants.append(
                PayloadVariant(
                    sink_type=payload.sink_type,
                    template_id=payload.template_id,
                    payload=payload.payload,
                    transformation="identity",
                    marker=payload.marker,
                    expected_signal=payload.expected_signal,
                )
            )

        if self.llm_client is not None:
            variants.extend(self._llm_mutations(payload))

        deduped: list[PayloadVariant] = []
        seen: set[str] = set()
        for variant in variants:
            if variant.payload in seen:
                continue
            seen.add(variant.payload)
            deduped.append(variant)
        return deduped

    def _mutate_cmdi(self, payload: PayloadVariant) -> list[PayloadVariant]:
        encoded = base64.b64encode(payload.marker.encode()).decode()
        return [
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"printf %s '{payload.marker}'",
                transformation="printf",
                marker=payload.marker,
                expected_signal=payload.expected_signal,
            ),
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"printf %s {encoded} | base64 -d",
                transformation="base64_decode",
                marker=payload.marker,
                expected_signal=payload.expected_signal,
            ),
        ]

    def _mutate_codei(self, payload: PayloadVariant) -> list[PayloadVariant]:
        encoded = base64.b64encode(payload.marker.encode()).decode()
        return [
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"print('{payload.marker[:4]}' + '{payload.marker[4:]}')",
                transformation="string_concat",
                marker=payload.marker,
                expected_signal=payload.expected_signal,
            ),
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=(
                    "import base64\n"
                    f"print(base64.b64decode('{encoded}').decode())"
                ),
                transformation="base64_decode",
                marker=payload.marker,
                expected_signal=payload.expected_signal,
            ),
        ]

    def _mutate_ssrf(self, payload: PayloadVariant) -> list[PayloadVariant]:
        path = payload.payload.split("/", 3)[-1]
        return [
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"http://2130706433/{path}",
                transformation="decimal_loopback",
                marker=payload.marker,
                expected_signal="2130706433",
            ),
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"http://localhost/{path}",
                transformation="localhost_alias",
                marker=payload.marker,
                expected_signal="localhost",
            ),
        ]

    def _mutate_sqli(self, payload: PayloadVariant) -> list[PayloadVariant]:
        marker = payload.marker
        return [
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"' OR 1=1 /* {marker} */",
                transformation="comment_style",
                marker=marker,
                expected_signal=payload.expected_signal,
            ),
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"' OR '1' LIKE '1' -- {marker}",
                transformation="tautology_variant",
                marker=marker,
                expected_signal=payload.expected_signal,
            ),
        ]

    def _mutate_ssti(self, payload: PayloadVariant) -> list[PayloadVariant]:
        marker = payload.marker
        return [
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"{{{{ '{marker[:4]}' ~ '{marker[4:]}' }}}}",
                transformation="concat_operator",
                marker=marker,
                expected_signal=payload.expected_signal,
            ),
            PayloadVariant(
                sink_type=payload.sink_type,
                template_id=payload.template_id,
                payload=f"{{{{ ('{marker}') }}}}",
                transformation="grouped_literal",
                marker=marker,
                expected_signal=payload.expected_signal,
            ),
        ]

    def _llm_mutations(self, payload: PayloadVariant) -> list[PayloadVariant]:
        call = LLMCall(
            task=LLMTask.PAYLOAD_MUTATION,
            system_prompt=(
                "Generate up to two alternate payload strings that preserve the same "
                "effect but vary the surface form. Return JSON with key `payloads`."
            ),
            user_prompt=(
                f"Sink type: {payload.sink_type}\n"
                f"Original payload: {payload.payload}\n"
                f"Marker: {payload.marker}"
            ),
            temperature=0.2,
        )
        try:
            result = self.llm_client.complete(call).text
        except Exception:
            return []
        parsed = parse_json_response(result)
        if parsed is None:
            return []
        payloads = parsed.get("payloads", [])
        if not isinstance(payloads, list):
            return []
        variants = []
        for text in payloads[:2]:
            if not isinstance(text, str) or not text.strip():
                continue
            variants.append(
                PayloadVariant(
                    sink_type=payload.sink_type,
                    template_id=payload.template_id,
                    payload=text.strip(),
                    transformation="llm_mutation",
                    marker=payload.marker,
                    expected_signal=payload.expected_signal,
                )
            )
        return variants
