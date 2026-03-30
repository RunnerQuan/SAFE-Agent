from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .agents import AgentRunner
from .output_views import judge_view, preprocess_view, scan_result_view, security_view, triage_view, write_json
from .preprocess import build_excerpt_bundle, scan_skill

SEVERITY_RANK = {"critical": 0, "high": 1, "med": 2, "low": 3}
logger = logging.getLogger(__name__)


@dataclass(slots=True)
class ScanSettings:
    max_triage_artifacts: int = 40
    max_triage_hits: int = 80
    max_security_excerpts: int = 60
    max_context_rounds: int = 1
    excerpt_context_before: int = 5
    excerpt_context_after: int = 5


class SkillScanner:
    def __init__(self, agents: AgentRunner, settings: ScanSettings | None = None) -> None:
        self.agents = agents
        self.settings = settings or ScanSettings()

    def run(self, root: Path) -> dict[str, Any]:
        started = time.perf_counter()
        logger.info("Scanning skill: path=%s", root)

        preprocess_started = time.perf_counter()
        preprocess = scan_skill(root)
        logger.info(
            "Preprocess complete: skill=%s artifacts=%d rule_hits=%d coverage_gaps=%d elapsed=%.2fs",
            root.name,
            preprocess["stats"]["artifact_count"],
            preprocess["stats"]["rule_hit_count"],
            len(preprocess["coverage_gaps"]),
            time.perf_counter() - preprocess_started,
        )
        logger.debug(
            "Preprocess rule code counts: skill=%s counts=%s",
            root.name,
            preprocess["stats"].get("rule_code_counts", {}),
        )

        triage_payload = self._build_triage_payload(preprocess)
        logger.info(
            "Starting triage: skill=%s artifacts_in_payload=%d rule_hits_in_payload=%d",
            root.name,
            len(triage_payload["artifacts"]),
            len(triage_payload["rule_hits"]),
        )
        triage_started = time.perf_counter()
        triage = self.agents.run_triage(triage_payload)
        logger.info(
            "Triage complete: skill=%s arts=%d concerns=%d retrieve=%d elapsed=%.2fs",
            root.name,
            len(triage.get("arts", [])),
            len(triage.get("xconcerns", [])),
            len(triage.get("retrieve", [])),
            time.perf_counter() - triage_started,
        )

        security_started = time.perf_counter()
        security = self._run_security(root=root, preprocess=preprocess, triage=triage)
        logger.info(
            "Security complete: skill=%s findings=%d unresolved=%d elapsed=%.2fs",
            root.name,
            len(security.get("findings", [])),
            len(security.get("coverage", {}).get("unresolved_high_risk_arts", [])),
            time.perf_counter() - security_started,
        )

        judge_payload = self._build_judge_payload(preprocess=preprocess, triage=triage, security=security)
        logger.info("Starting judge: skill=%s", root.name)
        judge_started = time.perf_counter()
        judge = self.agents.run_judge(judge_payload)
        logger.info(
            "Judge complete: skill=%s label=%s coverage=%s elapsed=%.2fs",
            root.name,
            judge.get("verdict", {}).get("label", "unknown"),
            judge.get("verdict", {}).get("coverage", "unknown"),
            time.perf_counter() - judge_started,
        )
        logger.debug(
            "Judge top findings: skill=%s findings=%s",
            root.name,
            judge.get("top_findings", []),
        )
        logger.info("Skill scan finished: skill=%s elapsed=%.2fs", root.name, time.perf_counter() - started)

        return {
            "preprocess": preprocess,
            "triage": triage,
            "security": security,
            "judge": judge,
        }

    def _build_triage_payload(self, preprocess: dict[str, Any]) -> dict[str, Any]:
        artifacts = sorted(preprocess["artifacts"], key=self._artifact_priority_key)
        trimmed_artifacts = []
        for artifact in artifacts[: self.settings.max_triage_artifacts]:
            trimmed_artifacts.append(
                {
                    "id": artifact["id"],
                    "path": artifact["path"],
                    "kind": artifact["kind"],
                    "role": artifact["role"],
                    "size_bytes": artifact["size_bytes"],
                    "line_count": artifact["line_count"],
                    "hit_count": artifact["hit_count"],
                    "truncated": artifact["truncated"],
                    "binary": artifact["binary"],
                    "preview": artifact["preview"][:1800],
                    "code_blocks": [
                        {
                            "language": block["language"],
                            "start_line": block["start_line"],
                            "end_line": block["end_line"],
                            "preview": block["preview"][:600],
                        }
                        for block in artifact.get("code_blocks", [])[:4]
                    ],
                }
            )

        rule_hits = [
            {
                "code": hit["code"],
                "severity": hit["severity"],
                "path": hit["path"],
                "start_line": hit["start_line"],
                "end_line": hit["end_line"],
                "message": hit["message"],
                "excerpt": hit["excerpt"],
                "source": hit["source"],
            }
            for hit in sorted(preprocess["rule_hits"], key=self._rule_hit_key)[: self.settings.max_triage_hits]
        ]

        return {
            "skill": preprocess["skill"],
            "stats": preprocess["stats"],
            "coverage_gaps": preprocess["coverage_gaps"],
            "artifacts": trimmed_artifacts,
            "rule_hits": rule_hits,
            "note": "Build a loss-aware index and retrieval plan. Do not give a final verdict.",
        }

    def _run_security(self, *, root: Path, preprocess: dict[str, Any], triage: dict[str, Any]) -> dict[str, Any]:
        allowed_paths = {artifact["path"] for artifact in preprocess["artifacts"]}
        excerpt_requests = self._initial_excerpt_requests(preprocess, triage)
        logger.info(
            "Preparing security review: skill=%s initial_excerpt_requests=%d",
            root.name,
            len(excerpt_requests),
        )
        logger.debug(
            "Initial excerpt requests: skill=%s requests=%s",
            root.name,
            excerpt_requests[:10],
        )
        excerpts = build_excerpt_bundle(
            root,
            excerpt_requests[: self.settings.max_security_excerpts],
            allowed_paths=allowed_paths,
            context_before=self.settings.excerpt_context_before,
            context_after=self.settings.excerpt_context_after,
        )
        logger.info(
            "Built raw excerpts: skill=%s excerpts=%d",
            root.name,
            len(excerpts),
        )
        payload = self._build_security_payload(preprocess=preprocess, triage=triage, excerpts=excerpts)
        security = self.agents.run_security(payload)

        for round_index in range(self.settings.max_context_rounds):
            ctx_requests = security.get("ctx_requests", [])
            if not ctx_requests:
                break
            logger.info(
                "Security requested more context: skill=%s round=%d requests=%d",
                root.name,
                round_index + 1,
                len(ctx_requests),
            )
            extra = build_excerpt_bundle(
                root,
                ctx_requests[: self.settings.max_security_excerpts],
                allowed_paths=allowed_paths,
                context_before=self.settings.excerpt_context_before,
                context_after=self.settings.excerpt_context_after,
            )
            if not extra:
                logger.info(
                    "No additional excerpts resolved: skill=%s round=%d",
                    root.name,
                    round_index + 1,
                )
                break
            excerpts = dedupe_excerpts(excerpts + extra)
            logger.info(
                "Re-running security with expanded context: skill=%s round=%d excerpts=%d",
                root.name,
                round_index + 1,
                len(excerpts),
            )
            payload = self._build_security_payload(preprocess=preprocess, triage=triage, excerpts=excerpts)
            security = self.agents.run_security(payload)

        return security

    def _build_security_payload(
        self,
        *,
        preprocess: dict[str, Any],
        triage: dict[str, Any],
        excerpts: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return {
            "skill": preprocess["skill"],
            "stats": preprocess["stats"],
            "triage": triage,
            "rule_hits": [
                {
                    "code": hit["code"],
                    "severity": hit["severity"],
                    "path": hit["path"],
                    "start_line": hit["start_line"],
                    "end_line": hit["end_line"],
                    "message": hit["message"],
                    "excerpt": hit["excerpt"],
                    "source": hit["source"],
                }
                for hit in sorted(preprocess["rule_hits"], key=self._rule_hit_key)[: self.settings.max_triage_hits]
            ],
            "raw_excerpts": excerpts,
            "note": "Return only JSON. Request more context instead of guessing.",
        }

    def _build_judge_payload(
        self,
        *,
        preprocess: dict[str, Any],
        triage: dict[str, Any],
        security: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "skill": preprocess["skill"],
            "stats": preprocess["stats"],
            "coverage_gaps": preprocess["coverage_gaps"],
            "triage": triage,
            "security": security,
            "note": "Do not invent new evidence. Refuse clean verdicts when coverage is incomplete.",
        }

    def _initial_excerpt_requests(self, preprocess: dict[str, Any], triage: dict[str, Any]) -> list[dict[str, Any]]:
        requests: list[dict[str, Any]] = []

        for item in triage.get("retrieve", []):
            if item.get("path"):
                requests.append(item)

        for concern in triage.get("xconcerns", []):
            for span in concern.get("spans", []):
                if span.get("path"):
                    requests.append(
                        {
                            "path": span["path"],
                            "s": span.get("s", 1),
                            "e": span.get("e", span.get("s", 1)),
                            "reason": concern.get("why", ""),
                        }
                    )

        for hit in sorted(preprocess["rule_hits"], key=self._rule_hit_key):
            if hit["severity"] in {"critical", "high"}:
                requests.append(
                    {
                        "path": hit["path"],
                        "s": hit["start_line"],
                        "e": hit["end_line"],
                        "reason": hit["code"],
                    }
                )

        return dedupe_requests(requests)

    def _artifact_priority_key(self, artifact: dict[str, Any]):
        role_rank = {
            "skill_definition": 0,
            "script": 1,
            "documentation": 2,
            "configuration": 3,
            "supporting": 4,
        }
        return (
            0 if artifact["path"].lower().endswith("skill.md") else 1,
            0 if artifact["hit_count"] else 1,
            role_rank.get(artifact["role"], 9),
            0 if artifact["truncated"] else 1,
            artifact["path"],
        )

    def _rule_hit_key(self, hit: dict[str, Any]):
        return (
            SEVERITY_RANK.get(hit["severity"], 9),
            hit["path"],
            hit["start_line"],
            hit["code"],
        )


def dedupe_requests(requests: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, int, int]] = set()
    result: list[dict[str, Any]] = []
    for item in requests:
        path = item.get("path", "")
        start = max(1, int(item.get("s", 1)))
        end = max(start, int(item.get("e", start)))
        key = (path, start, end)
        if not path or key in seen:
            continue
        seen.add(key)
        result.append({"path": path, "s": start, "e": end, "reason": item.get("reason", "")})
    return result


def dedupe_excerpts(excerpts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for item in excerpts:
        key = json.dumps(item, sort_keys=True, ensure_ascii=False)
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def write_scan_outputs(result: dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    raw_views = {
        "preprocess": result["preprocess"],
        "triage": result["triage"],
        "security": result["security"],
        "judge": result["judge"],
    }
    readable_views = {
        "preprocess": preprocess_view(result["preprocess"]),
        "triage": triage_view(result["triage"]),
        "security": security_view(result["security"]),
        "judge": judge_view(result["judge"]),
    }
    for name, payload in readable_views.items():
        write_json(output_dir / f"{name}.json", payload)
    for name, payload in raw_views.items():
        write_json(output_dir / f"{name}.raw.json", payload)
    write_json(output_dir / "scan-result.json", scan_result_view(result))
    write_json(output_dir / "scan-result.raw.json", result)
