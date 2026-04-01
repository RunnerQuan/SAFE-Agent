from __future__ import annotations

import json
from pathlib import Path


class StaticPureMetadataLoader:
    """Loads tool metadata for static-pure analysis."""

    REQUIRED_FIELDS = ("func_signature", "description", "MCP", "code")

    def load(self, path: str) -> list[dict]:
        input_path = Path(path)
        payload = json.loads(input_path.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            if isinstance(payload.get("tools"), list):
                payload = payload["tools"]
            else:
                raise ValueError("Static-pure input must be a list or a dict with a `tools` list.")
        if not isinstance(payload, list):
            raise ValueError("Static-pure input must be a list of tool metadata objects.")

        normalized: list[dict] = []
        for index, item in enumerate(payload):
            if not isinstance(item, dict):
                raise ValueError(f"Tool entry #{index} is not a JSON object.")
            missing = [field for field in self.REQUIRED_FIELDS if field not in item]
            if missing:
                raise ValueError(f"Tool entry #{index} is missing required fields: {missing}")
            normalized.append(
                {
                    "func_signature": str(item["func_signature"]).strip(),
                    "description": str(item["description"]).strip(),
                    "MCP": str(item["MCP"]).strip(),
                    "code": str(item["code"]),
                }
            )
        return normalized
