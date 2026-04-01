from __future__ import annotations

import json
from pathlib import Path


class ArtifactStore:
    """Persists prompts, payloads, traces, and oracle evidence."""

    def __init__(self, root: str = "artifacts") -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def write_json(self, relative_path: str, payload: dict) -> Path:
        output_path = self.root / relative_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
        return output_path

    def write_text(self, relative_path: str, payload: str) -> Path:
        output_path = self.root / relative_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(payload)
        return output_path
