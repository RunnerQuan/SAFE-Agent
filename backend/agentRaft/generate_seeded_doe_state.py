from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DATA_ROOT = ROOT / "data"
WORKSPACES_ROOT = DATA_ROOT / "workspaces"
STATE_PATH = DATA_ROOT / "agentraft-state.json"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def simplify_title(title: str) -> str:
    parts = [part.strip() for part in title.split("·")]
    if len(parts) >= 3:
        return parts[-1]
    return title.strip()


def extract_content_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        chunks: list[str] = []
        for item in content:
            if isinstance(item, str):
                chunks.append(item)
            elif isinstance(item, dict) and isinstance(item.get("content"), str):
                chunks.append(item["content"])
        return "\n".join(chunk for chunk in chunks if chunk).strip()
    return ""


def get_user_prompt(messages: list[dict[str, Any]]) -> str:
    for message in messages:
        if message.get("role") == "user":
            text = extract_content_text(message.get("content"))
            if text:
                return text
    return ""


def get_tool_sequence(messages: list[dict[str, Any]]) -> list[str]:
    sequence: list[str] = []
    for message in messages:
        for tool_call in message.get("tool_calls") or []:
            function_name = tool_call.get("function")
            if isinstance(function_name, str) and function_name.strip():
                sequence.append(function_name)
    return sequence


def get_transcript_preview(messages: list[dict[str, Any]]) -> list[dict[str, str]]:
    preview: list[dict[str, str]] = []
    for message in messages:
        text = extract_content_text(message.get("content"))
        if not text:
            continue
        preview.append({"role": str(message.get("role") or "unknown"), "text": text})
        if len(preview) >= 5:
            break
    return preview


def get_last_tool_output(messages: list[dict[str, Any]]) -> str | None:
    for message in reversed(messages):
        if message.get("role") == "tool":
            text = extract_content_text(message.get("content"))
            if text:
                return text
    return None


def build_logs(scan_id: str, title: str, tool_count: int, verdict: bool, started_at: str, finished_at: str) -> list[dict[str, str]]:
    from datetime import datetime, timedelta

    started = datetime.fromisoformat(started_at)
    finished = datetime.fromisoformat(finished_at)
    checkpoints = [
        started,
        started + (finished - started) * 0.35,
        started + (finished - started) * 0.7,
        finished - timedelta(seconds=10) if finished > started else finished,
    ]
    outcome = "检测到数据过度暴露。" if verdict else "未检测到数据过度暴露。"
    messages = [
        f"任务 {title} 已载入，准备解析 {tool_count} 个工具定义。",
        "AgentRaft DOE 流水线开始执行，正在提取用户任务与工具调用链。",
        "已完成真实样例字段映射，正在聚合 Allowed / Leaked 字段与结论。",
        f"任务完成。{outcome}",
    ]
    return [
        {
            "id": f"{scan_id}-log-{index + 1}",
            "timestamp": checkpoints[index].isoformat(),
            "level": "info",
            "message": messages[index],
        }
        for index in range(4)
    ]


def build_internal_input_sources(input_root: Path) -> tuple[int, list[dict[str, Any]], list[dict[str, Any]]]:
    merged_metadata = read_json(input_root / "metadata.json")
    input_sources: list[dict[str, Any]] = []
    for path in sorted(input_root.glob("*.json")):
        if path.name in {"metadata.json", "manifest.json"}:
            continue
        items = read_json(path)
        if isinstance(items, list):
            input_sources.append(
                {
                    "fileName": path.name,
                    "workspacePath": str(path),
                    "toolCount": len(items),
                    "functions": [item.get("func_signature") for item in items if isinstance(item, dict)],
                }
            )
    return len(merged_metadata) if isinstance(merged_metadata, list) else 0, merged_metadata, input_sources


def build_workspace_case(workspace_root: Path) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    input_root = workspace_root / "input"
    runs_root = workspace_root / "runs"
    manifest = read_json(input_root / "manifest.json")
    manifest["title"] = simplify_title(str(manifest.get("title") or manifest["scanId"]))
    evaluation = read_json(runs_root / "evaluation.json")
    judge_path = runs_root / "judge-result.json"
    judge = read_json(judge_path) if judge_path.exists() else None
    messages = evaluation.get("messages") or []

    tool_count, merged_metadata, input_sources = build_internal_input_sources(input_root)
    manifest["inputSources"] = input_sources
    manifest["toolCount"] = tool_count
    write_json(input_root / "manifest.json", manifest)

    verdict = bool(judge and judge.get("res", {}).get("data-overexposure"))
    allowed_fields = list(judge.get("res", {}).get("Allowed_Fields") or []) if judge else []
    leaked_fields = list(judge.get("res", {}).get("Leaked_Fields") or []) if judge else []
    analysis_reason = (
        str(judge.get("res", {}).get("analysis_reason") or "").strip()
        if judge
        else "该样例目录未包含 judgeRes.txt，按当前规则视为安全，不生成过曝判定。"
    )

    user_prompt = get_user_prompt(messages)
    tool_sequence = get_tool_sequence(messages)
    transcript_preview = get_transcript_preview(messages)
    last_tool_output = get_last_tool_output(messages)
    final_action = tool_sequence[-1] if tool_sequence else None
    severity = "high" if verdict and len(leaked_fields) >= 3 else "medium" if verdict else "low"
    scan_id = str(manifest["scanId"])
    report_id = str(manifest["reportId"])
    title = str(manifest["title"])

    evidence = {
        "verdict": verdict,
        "allowedFields": allowed_fields,
        "leakedFields": leaked_fields,
        "analysisReason": analysis_reason,
        "toolSequence": tool_sequence,
        "finalAction": final_action,
        "userPrompt": user_prompt,
        "transcriptPreview": transcript_preview,
        "lastToolOutput": last_tool_output,
        "workspace": {
            "inputRoot": str(input_root),
            "runsRoot": str(runs_root),
        },
    }

    findings = (
        [
            {
                "id": f"{scan_id}-finding-1",
                "severity": severity,
                "title": f"{manifest['userTaskId']} · 检测到数据过度暴露",
                "description": analysis_reason,
                "toolName": final_action or "unknown",
                "toolSignature": final_action or "unknown",
                "detectionInfo": f"工具调用链：{' -> '.join(tool_sequence)}" if tool_sequence else "未解析到工具调用链",
                "evidence": json.dumps(evidence, ensure_ascii=False, indent=2),
                "dataType": f"泄露字段 {len(leaked_fields)} 项",
                "source": tool_sequence[0] if tool_sequence else None,
                "sinks": [final_action] if final_action else [],
                "flowPath": tool_sequence,
            }
        ]
        if verdict
        else []
    )

    summary = {
        "totalFindings": len(findings),
        "exposureFindings": len(findings),
        "fuzzingFindings": 0,
        "doeToolCount": len(set(tool_sequence)),
        "chainToolCount": 0,
        "highRiskExposureCount": 1 if verdict and severity == "high" else 0,
        "highRiskChainCount": 0,
        "topRisks": [findings[0]["title"]] if findings else [],
    }

    overview_text = [
        f"样例分类：{manifest.get('category')}；模型：{manifest.get('pipelineName') or 'unknown'}；任务：{manifest.get('userTaskId') or scan_id}。",
        f"工具链共调用 {len(tool_sequence)} 次，涉及 {len(set(tool_sequence))} 个唯一工具。",
        f"判定结果：{'数据过度暴露' if verdict else '安全'}。{'存在 judge-result.json。' if judge else '未提供 judge-result.json，按规则视为安全。'}",
    ]

    recommendations = (
        [
            "对外发 sink 前增加字段级白名单，仅允许用户显式请求的数据进入最终动作。",
            "在 source 到 sink 之间增加结构化脱敏层，避免上下文中额外字段被复制到最终输出。",
            "对 send_message、send_email、post_comment_to_feed 等高影响动作增加二次确认。",
        ]
        if verdict
        else [
            "当前样例按现有规则视为安全，可继续沿用最小必要字段原则。",
            "建议继续为无 judge-result.json 的样例补充人工审核记录，减少安全结论歧义。",
        ]
    )

    detail = {
        "risk": "high" if verdict and severity == "high" else "medium" if verdict else "low",
        "overviewText": overview_text,
        "executiveSummary": [
            f"{title} 已完成 DOE 模板化结果生成。",
            analysis_reason,
            f"最终动作：{final_action or '无'}；Allowed 字段 {len(allowed_fields)} 项；Leaked 字段 {len(leaked_fields)} 项。",
        ],
        "exposure": {
            "findings": findings,
            "flowGraph": {
                "toolSequence": tool_sequence,
                "uniqueTools": sorted(set(tool_sequence)),
                "finalAction": final_action,
            },
            "overviewText": overview_text,
            "recommendations": recommendations,
            "raw": {
                "evaluation": evaluation,
                "judgeResult": judge,
            },
        },
        "recommendations": recommendations,
        "raw": {
            "category": manifest.get("category"),
            "inputFiles": input_sources,
            "evaluation": evaluation,
            "judgeResult": judge,
            "derived": {
                "hasJudgeResult": judge is not None,
                "verdict": verdict,
                "allowedFields": allowed_fields,
                "leakedFields": leaked_fields,
                "toolSequence": tool_sequence,
                "transcriptPreview": transcript_preview,
                "lastToolOutput": last_tool_output,
                "mergedToolCount": tool_count,
            },
        },
    }

    report_detail = {
        "id": report_id,
        "agentId": "agentraft-default",
        "agentName": "AgentRaft Data Over-Exposure",
        "title": title,
        "toolCount": tool_count,
        "scanId": scan_id,
        "createdAt": str(manifest["finishedAt"]),
        "types": ["exposure"],
        "risk": detail["risk"],
        "summary": {
            "totalFindings": summary["totalFindings"],
            "exposureFindings": summary["exposureFindings"],
            "fuzzingFindings": 0,
            "doeToolCount": summary["doeToolCount"],
            "chainToolCount": 0,
        },
        "overviewText": overview_text,
        "exposure": {
            "findings": findings,
            "flowGraph": detail["exposure"]["flowGraph"],
        },
        "recommendations": recommendations,
        "raw": deepcopy(detail["raw"]),
    }
    write_json(runs_root / "seeded-report.json", report_detail)

    scan = {
        "id": scan_id,
        "agentId": "agentraft-default",
        "agentName": "AgentRaft Data Over-Exposure",
        "title": title,
        "types": ["exposure"],
        "status": "succeeded",
        "createdAt": manifest["createdAt"],
        "startedAt": manifest["startedAt"],
        "finishedAt": manifest["finishedAt"],
        "durationMs": manifest["durationMs"],
        "params": {
            "taskName": title,
            "toolCount": tool_count,
            "selectedChecks": ["exposure"],
            "caseCategory": manifest.get("category"),
            "pipelineName": manifest.get("pipelineName"),
            "userTaskId": manifest.get("userTaskId"),
            "relatedInputs": [item["workspacePath"] for item in input_sources],
            "workspaceRoot": str(workspace_root),
        },
        "progress": {
            "stage": "done",
            "percent": 100,
            "message": "模板化 DOE 运行结果已生成。",
        },
        "reportId": report_id,
        "checks": {
            "exposure": {
                "type": "exposure",
                "enabled": True,
                "status": "succeeded",
                "label": "数据过度暴露检测",
                "scanId": scan_id,
                "reportId": report_id,
                "progress": {
                    "stage": "done",
                    "percent": 100,
                    "message": "模板化 DOE 运行结果已生成。",
                },
                "findingCount": len(findings),
                "risk": detail["risk"],
                "updatedAt": manifest["finishedAt"],
            },
            "fuzzing": {
                "type": "fuzzing",
                "enabled": False,
                "status": "skipped",
                "label": "组合式漏洞检测",
            },
        },
        "summary": summary,
        "detail": detail,
    }

    logs = build_logs(
        scan_id=scan_id,
        title=title,
        tool_count=tool_count,
        verdict=verdict,
        started_at=str(manifest["startedAt"]),
        finished_at=str(manifest["finishedAt"]),
    )
    return scan, report_detail, logs


def main() -> None:
    scans: list[dict[str, Any]] = []
    reports: list[dict[str, Any]] = []
    logs: dict[str, list[dict[str, Any]]] = {}

    workspace_dirs = sorted(
        path / "agentRaft"
        for path in WORKSPACES_ROOT.iterdir()
        if path.is_dir() and (path / "agentRaft" / "input" / "manifest.json").exists()
    )

    for workspace_root in workspace_dirs:
        scan, report, case_logs = build_workspace_case(workspace_root)
        scans.append(scan)
        reports.append(report)
        logs[scan["id"]] = case_logs

    state = {
        "agents": [],
        "scans": scans,
        "reportDetails": reports,
        "logs": logs,
    }
    write_json(STATE_PATH, state)
    print(f"Wrote {len(scans)} seeded DOE scans to {STATE_PATH}")


if __name__ == "__main__":
    main()
