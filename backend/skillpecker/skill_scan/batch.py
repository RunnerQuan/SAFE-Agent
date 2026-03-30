from __future__ import annotations

import logging
import traceback
from pathlib import Path
from typing import Any

from .output_views import batch_index_view, error_view, preprocess_view, write_json
from .orchestrator import SkillScanner, write_scan_outputs
from .preprocess import scan_skill

logger = logging.getLogger(__name__)


class BatchSkillScanner:
    def __init__(self, *, scanner: SkillScanner | None = None, preprocess_only: bool = False) -> None:
        self.scanner = scanner
        self.preprocess_only = preprocess_only

    def run(self, *, skills_root: Path, output_root: Path) -> dict[str, Any]:
        skills_root.mkdir(parents=True, exist_ok=True)
        output_root.mkdir(parents=True, exist_ok=True)

        skill_dirs = discover_skill_dirs(skills_root)
        logger.info(
            "Discovered skill directories: root=%s count=%d",
            skills_root,
            len(skill_dirs),
        )
        summary_items: list[dict[str, Any]] = []

        for skill_dir in skill_dirs:
            output_dir = output_root / skill_dir.name
            logger.info("Starting batch item: skill=%s path=%s", skill_dir.name, skill_dir)
            try:
                if self.preprocess_only:
                    preprocess = scan_skill(skill_dir)
                    write_preprocess_outputs(preprocess, output_dir)
                    remove_stale_full_scan_outputs(output_dir)
                    logger.info(
                        "Preprocess-only complete: skill=%s artifacts=%d rule_hits=%d output=%s",
                        skill_dir.name,
                        preprocess["stats"]["artifact_count"],
                        preprocess["stats"]["rule_hit_count"],
                        output_dir,
                    )
                    summary_items.append(
                        {
                            "name": skill_dir.name,
                            "path": str(skill_dir),
                            "status": "ok",
                            "output_dir": str(output_dir),
                            "artifact_count": preprocess["stats"]["artifact_count"],
                            "rule_hit_count": preprocess["stats"]["rule_hit_count"],
                            "verdict": None,
                        }
                    )
                    continue

                if self.scanner is None:
                    raise RuntimeError("BatchSkillScanner requires a SkillScanner when preprocess_only is false.")

                result = self.scanner.run(skill_dir)
                remove_stale_error_outputs(output_dir)
                write_scan_outputs(result, output_dir)
                logger.info(
                    "Batch item complete: skill=%s label=%s output=%s",
                    skill_dir.name,
                    result["judge"]["verdict"].get("label", "unknown"),
                    output_dir,
                )
                summary_items.append(
                    {
                        "name": skill_dir.name,
                        "path": str(skill_dir),
                        "status": "ok",
                        "output_dir": str(output_dir),
                        "artifact_count": result["preprocess"]["stats"]["artifact_count"],
                        "rule_hit_count": result["preprocess"]["stats"]["rule_hit_count"],
                        "verdict": result["judge"]["verdict"],
                    }
                )
            except Exception as exc:
                output_dir.mkdir(parents=True, exist_ok=True)
                logger.exception("Batch item failed: skill=%s error=%s", skill_dir.name, exc)
                error_payload = {
                    "name": skill_dir.name,
                    "path": str(skill_dir),
                    "status": "error",
                    "error": str(exc),
                    "traceback": traceback.format_exc(),
                }
                write_json(output_dir / "error.json", error_view(error_payload))
                write_json(output_dir / "error.raw.json", error_payload)
                summary_items.append(
                    {
                        "name": skill_dir.name,
                        "path": str(skill_dir),
                        "status": "error",
                        "output_dir": str(output_dir),
                        "error": str(exc),
                    }
                )

        summary = {
            "skills_root": str(skills_root),
            "output_root": str(output_root),
            "skill_count": len(skill_dirs),
            "scanned_count": sum(1 for item in summary_items if item["status"] == "ok"),
            "failed_count": sum(1 for item in summary_items if item["status"] == "error"),
            "skills": summary_items,
        }
        write_json(output_root / "index.json", batch_index_view(summary))
        write_json(output_root / "index.raw.json", summary)
        logger.info(
            "Batch run complete: root=%s scanned=%d failed=%d output=%s",
            skills_root,
            summary["scanned_count"],
            summary["failed_count"],
            output_root,
        )
        return summary


def discover_skill_dirs(skills_root: Path) -> list[Path]:
    return [
        path
        for path in sorted(skills_root.iterdir(), key=lambda item: item.name.lower())
        if path.is_dir() and not path.name.startswith(".")
    ]


def write_preprocess_outputs(preprocess: dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    payload = {"preprocess": preprocess}
    write_json(output_dir / "preprocess.json", preprocess_view(preprocess))
    write_json(output_dir / "preprocess.raw.json", preprocess)
    write_json(output_dir / "scan-result.json", {"预处理结果 (preprocess)": preprocess_view(preprocess)})
    write_json(output_dir / "scan-result.raw.json", payload)


def remove_stale_full_scan_outputs(output_dir: Path) -> None:
    for name in (
        "triage.json",
        "triage.raw.json",
        "security.json",
        "security.raw.json",
        "judge.json",
        "judge.raw.json",
        "error.json",
        "error.raw.json",
    ):
        path = output_dir / name
        if path.exists():
            path.unlink()


def remove_stale_error_outputs(output_dir: Path) -> None:
    for name in ("error.json", "error.raw.json"):
        path = output_dir / name
        if path.exists():
            path.unlink()
