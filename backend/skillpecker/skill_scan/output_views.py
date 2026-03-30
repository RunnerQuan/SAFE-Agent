from __future__ import annotations

import json
from pathlib import Path
from typing import Any


SEVERITY_LABELS = {
    "critical": "严重 (critical)",
    "high": "高 (high)",
    "med": "中 (med)",
    "low": "低 (low)",
}

CONFIDENCE_LABELS = {
    "high": "高 (high)",
    "med": "中 (med)",
    "low": "低 (low)",
}

CLASS_LABELS = {
    "malicious": "恶意/有害 (malicious)",
    "unsafe": "不安全/不可靠 (unsafe)",
    "description": "描述不可靠 (description)",
}

VERDICT_LABELS = {
    "malicious": "恶意 (malicious)",
    "unsafe": "不安全/不可靠 (unsafe)",
    "description_unreliable": "描述不可靠 (description_unreliable)",
    "mixed_risk": "混合风险 (mixed_risk)",
    "clean_with_reservations": "基本干净但有保留 (clean_with_reservations)",
    "insufficient_evidence": "证据不足 (insufficient_evidence)",
}

PRIMARY_CONCERN_LABELS = {
    "malicious": "恶意 (malicious)",
    "unsafe": "不安全/不可靠 (unsafe)",
    "description": "描述不可靠 (description)",
    "mixed": "混合问题 (mixed)",
    "none": "无明显主问题 (none)",
    "unknown": "未知 (unknown)",
}

PRIORITY_LABELS = {
    "high": "高 (high)",
    "med": "中 (med)",
    "low": "低 (low)",
}

CONCERN_TYPE_LABELS = {
    "malicious_candidate": "恶意候选 (malicious_candidate)",
    "unsafe_candidate": "不安全候选 (unsafe_candidate)",
    "description_gap": "描述缺口 (description_gap)",
}

NEXT_ACTION_LABELS = {
    "stop": "停止 (stop)",
    "rescan_targeted": "定向重扫 (rescan_targeted)",
    "rescan_broad": "扩大范围重扫 (rescan_broad)",
}

ARTIFACT_KIND_LABELS = {
    "markdown": "Markdown 文档 (markdown)",
    "python": "Python 脚本 (python)",
    "shell": "Shell 脚本 (shell)",
    "sql": "SQL 文件 (sql)",
    "json": "JSON 配置 (json)",
    "yaml": "YAML 配置 (yaml)",
    "config": "配置文件 (config)",
    "text": "文本文件 (text)",
    "binary": "二进制文件 (binary)",
}

ARTIFACT_ROLE_LABELS = {
    "skill_definition": "Skill 定义文件 (skill_definition)",
    "script": "脚本 (script)",
    "documentation": "文档 (documentation)",
    "configuration": "配置 (configuration)",
    "supporting": "辅助材料 (supporting)",
}

RULE_SOURCE_LABELS = {
    "file": "文件正文 (file)",
    "code_block": "文档代码块 (code_block)",
}

STATUS_LABELS = {
    "ok": "成功 (ok)",
    "error": "失败 (error)",
}


def label(value: Any, mapping: dict[str, str]) -> Any:
    if not isinstance(value, str):
        return value
    return mapping.get(value, value)


def span_view(span: dict[str, Any]) -> dict[str, Any]:
    return {
        "文件路径 (path)": span.get("path", ""),
        "起始行 (start_line)": span.get("s", 0),
        "结束行 (end_line)": span.get("e", 0),
        "说明 (why)": span.get("why", ""),
    }


def code_block_view(block: dict[str, Any]) -> dict[str, Any]:
    return {
        "语言 (language)": label(block.get("language", ""), ARTIFACT_KIND_LABELS),
        "起始行 (start_line)": block.get("start_line", 0),
        "结束行 (end_line)": block.get("end_line", 0),
        "预览 (preview)": block.get("preview", ""),
    }


def artifact_view(artifact: dict[str, Any]) -> dict[str, Any]:
    return {
        "制品ID (artifact_id)": artifact.get("id", ""),
        "文件路径 (path)": artifact.get("path", ""),
        "文件类型 (kind)": label(artifact.get("kind", ""), ARTIFACT_KIND_LABELS),
        "文件角色 (role)": label(artifact.get("role", ""), ARTIFACT_ROLE_LABELS),
        "大小字节 (size_bytes)": artifact.get("size_bytes", 0),
        "行数 (line_count)": artifact.get("line_count", 0),
        "预览 (preview)": artifact.get("preview", ""),
        "是否截断 (is_truncated)": artifact.get("truncated", False),
        "是否二进制 (is_binary)": artifact.get("binary", False),
        "内容摘要Hash (sha256_12)": artifact.get("sha256_12", ""),
        "代码块列表 (code_blocks)": [code_block_view(block) for block in artifact.get("code_blocks", [])],
        "规则命中数 (rule_hit_count)": artifact.get("hit_count", 0),
    }


def rule_hit_view(hit: dict[str, Any]) -> dict[str, Any]:
    return {
        "规则代码 (rule_code)": hit.get("code", ""),
        "严重级别 (severity)": label(hit.get("severity", ""), SEVERITY_LABELS),
        "文件路径 (path)": hit.get("path", ""),
        "起始行 (start_line)": hit.get("start_line", 0),
        "结束行 (end_line)": hit.get("end_line", 0),
        "规则说明 (message)": hit.get("message", ""),
        "命中片段 (excerpt)": hit.get("excerpt", ""),
        "来源 (source)": label(hit.get("source", ""), RULE_SOURCE_LABELS),
    }


def coverage_gap_view(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "文件路径 (path)": item.get("path", ""),
        "原因 (why)": item.get("why", ""),
    }


def preprocess_view(preprocess: dict[str, Any]) -> dict[str, Any]:
    skill = preprocess.get("skill", {})
    stats = preprocess.get("stats", {})
    return {
        "技能信息 (skill_info)": {
            "技能根目录 (skill_root)": skill.get("root", ""),
            "技能声明列表 (skill_claims)": skill.get("claims", []),
            "观察到的文件类型 (observed_kinds)": [
                label(item, ARTIFACT_KIND_LABELS) for item in skill.get("observed_kinds", [])
            ],
        },
        "文件制品列表 (artifacts)": [artifact_view(item) for item in preprocess.get("artifacts", [])],
        "规则命中列表 (rule_hits)": [rule_hit_view(item) for item in preprocess.get("rule_hits", [])],
        "覆盖缺口列表 (coverage_gaps)": [coverage_gap_view(item) for item in preprocess.get("coverage_gaps", [])],
        "统计信息 (statistics)": {
            "文件总数 (artifact_count)": stats.get("artifact_count", 0),
            "规则命中总数 (rule_hit_count)": stats.get("rule_hit_count", 0),
            "按严重级别统计 (severity_counts)": {
                label(key, SEVERITY_LABELS): value for key, value in stats.get("severity_counts", {}).items()
            },
            "按规则代码统计 (rule_code_counts)": stats.get("rule_code_counts", {}),
        },
    }


def triage_artifact_view(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "制品ID (artifact_id)": item.get("id", ""),
        "文件路径 (path)": item.get("path", ""),
        "文件类型 (kind)": label(item.get("kind", ""), ARTIFACT_KIND_LABELS),
        "文件角色 (role)": label(item.get("role", ""), ARTIFACT_ROLE_LABELS),
        "观察结果 (observations)": item.get("obs", []),
        "风险信号 (risk_signals)": item.get("signals", []),
        "证据位置 (evidence_spans)": [span_view(span) for span in item.get("spans", [])],
        "优先级 (priority)": label(item.get("priority", ""), PRIORITY_LABELS),
        "是否需要回源查看原文 (needs_raw_review)": item.get("raw", False),
    }


def triage_concern_view(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "关注点类型 (concern_type)": label(item.get("type", ""), CONCERN_TYPE_LABELS),
        "关联制品IDs (artifact_ids)": item.get("arts", []),
        "证据位置 (evidence_spans)": [span_view(span) for span in item.get("spans", [])],
        "原因说明 (why)": item.get("why", ""),
    }


def retrieval_request_view(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "文件路径 (path)": item.get("path", ""),
        "起始行 (start_line)": item.get("s", 0),
        "结束行 (end_line)": item.get("e", 0),
        "请求原因 (reason)": item.get("reason", ""),
    }


def triage_view(triage: dict[str, Any]) -> dict[str, Any]:
    skill = triage.get("skill", {})
    coverage = triage.get("coverage", {})
    return {
        "技能概览 (skill_overview)": {
            "技能声明列表 (skill_claims)": skill.get("claims", []),
            "观察到的行为 (observed_behaviors)": skill.get("obs", []),
            "高风险特征 (high_risk_features)": skill.get("high_risk_features", []),
        },
        "文件分析列表 (artifact_reviews)": [triage_artifact_view(item) for item in triage.get("arts", [])],
        "跨文件关注点 (cross_artifact_concerns)": [triage_concern_view(item) for item in triage.get("xconcerns", [])],
        "建议回源片段 (retrieval_requests)": [retrieval_request_view(item) for item in triage.get("retrieve", [])],
        "覆盖情况 (coverage)": {
            "文件总数 (total_artifacts)": coverage.get("total", 0),
            "已索引文件数 (indexed_artifacts)": coverage.get("indexed", 0),
            "覆盖缺口列表 (coverage_gaps)": [coverage_gap_view(item) for item in coverage.get("gaps", [])],
        },
    }


def finding_view(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "发现ID (finding_id)": item.get("id", ""),
        "风险类别 (category)": item.get("cat", ""),
        "问题性质 (finding_class)": label(item.get("class", ""), CLASS_LABELS),
        "严重级别 (severity)": label(item.get("severity", ""), SEVERITY_LABELS),
        "置信度 (confidence)": label(item.get("conf", ""), CONFIDENCE_LABELS),
        "摘要 (summary)": item.get("summary", ""),
        "关联制品IDs (artifact_ids)": item.get("arts", []),
        "证据位置 (evidence_spans)": [span_view(span) for span in item.get("spans", [])],
        "影响 (impact)": item.get("impact", ""),
        "修复建议 (remediation)": item.get("fix", ""),
    }


def security_view(security: dict[str, Any]) -> dict[str, Any]:
    coverage = security.get("coverage", {})
    return {
        "发现列表 (findings)": [finding_view(item) for item in security.get("findings", [])],
        "补充上下文请求 (additional_context_requests)": [
            retrieval_request_view(item) for item in security.get("ctx_requests", [])
        ],
        "覆盖情况 (coverage)": {
            "已审阅制品IDs (reviewed_artifact_ids)": coverage.get("reviewed_arts", []),
            "未解决高风险制品IDs (unresolved_high_risk_artifact_ids)": coverage.get(
                "unresolved_high_risk_arts", []
            ),
        },
    }


def judge_view(judge: dict[str, Any]) -> dict[str, Any]:
    verdict = judge.get("verdict", {})
    coverage = judge.get("coverage_audit", {})
    return {
        "最终裁决 (verdict)": {
            "裁决标签 (label)": label(verdict.get("label", ""), VERDICT_LABELS),
            "主要问题类型 (primary_concern)": label(verdict.get("primary_concern", ""), PRIMARY_CONCERN_LABELS),
            "问题类型列表 (issue_types)": [label(item, PRIMARY_CONCERN_LABELS) for item in verdict.get("issue_types", [])],
            "恶意风险分，越高越危险 (maliciousness_score)": verdict.get("maliciousness", 0),
            "实现风险分，越高越危险 (implementation_risk_score)": verdict.get("safety", 0),
            "描述可靠度分，越低越不可靠 (description_reliability_score)": verdict.get(
                "description_reliability", 0
            ),
            "覆盖度分，越高越完整 (coverage_score)": verdict.get("coverage", 0),
        },
        "主要发现 (top_findings)": [finding_view(item) for item in judge.get("top_findings", [])],
        "覆盖审计 (coverage_audit)": {
            "覆盖是否充分 (is_coverage_adequate)": coverage.get("adequate", False),
            "遗漏项 (missed_items)": [coverage_gap_view(item) for item in coverage.get("missed", [])],
            "是否需要重扫 (needs_rescan)": coverage.get("needs_rescan", False),
        },
        "下一步动作 (next_action)": label(judge.get("next_action", ""), NEXT_ACTION_LABELS),
    }


def scan_result_view(result: dict[str, Any]) -> dict[str, Any]:
    return {
        "预处理结果 (preprocess)": preprocess_view(result.get("preprocess", {})),
        "分诊结果 (triage)": triage_view(result.get("triage", {})),
        "安全分析结果 (security)": security_view(result.get("security", {})),
        "裁决结果 (judge)": judge_view(result.get("judge", {})),
    }


def batch_item_view(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "技能名称 (skill_name)": item.get("name", ""),
        "技能路径 (skill_path)": item.get("path", ""),
        "状态 (status)": label(item.get("status", ""), STATUS_LABELS),
        "输出目录 (output_dir)": item.get("output_dir", ""),
        "文件总数 (artifact_count)": item.get("artifact_count"),
        "规则命中总数 (rule_hit_count)": item.get("rule_hit_count"),
        "错误信息 (error)": item.get("error"),
        "裁决摘要 (verdict_summary)": judge_view({"verdict": item.get("verdict", {}), "top_findings": [], "coverage_audit": {}, "next_action": ""}).get(
            "最终裁决 (verdict)", {}
        )
        if item.get("verdict") is not None
        else None,
    }


def batch_index_view(summary: dict[str, Any]) -> dict[str, Any]:
    return {
        "技能根目录 (skills_root)": summary.get("skills_root", ""),
        "输出根目录 (output_root)": summary.get("output_root", ""),
        "技能总数 (skill_count)": summary.get("skill_count", 0),
        "成功扫描数量 (scanned_count)": summary.get("scanned_count", 0),
        "失败数量 (failed_count)": summary.get("failed_count", 0),
        "技能条目列表 (skills)": [batch_item_view(item) for item in summary.get("skills", [])],
    }


def error_view(error_payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "技能名称 (skill_name)": error_payload.get("name", ""),
        "技能路径 (skill_path)": error_payload.get("path", ""),
        "状态 (status)": label(error_payload.get("status", ""), STATUS_LABELS),
        "错误信息 (error)": error_payload.get("error", ""),
        "错误堆栈 (traceback)": error_payload.get("traceback", ""),
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
