#!/usr/bin/env python3
"""
迁移脚本：为 legacy 任务填充 summary 数据
解决轻量模式下 summary 显示"0个工具"的问题

用法: python scripts/migrate-scan-summaries.py
"""

import json
import os
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).parent.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
DATA_ROOT_AGENTRAFT = PROJECT_ROOT / "backend" / "agentRaft" / "data"
DATA_ROOT_MTATLAS = PROJECT_ROOT / "backend" / "MTAtlas" / "data"
REPORT_DETAILS_AR = DATA_ROOT_AGENTRAFT / "report-details"
REPORT_DETAILS_MT = DATA_ROOT_MTATLAS / "report-details"


def load_json(file_path: Path) -> dict:
    """加载 JSON 文件"""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(file_path: Path, data: dict) -> None:
    """保存 JSON 文件"""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_report_detail_from_file(report_id: str, base_dir: Path) -> dict | None:
    """从单独的文件中读取报告详情"""
    file_path = base_dir / f"{report_id}.json"
    if file_path.exists():
        return load_json(file_path)
    return None


def build_summary_from_report(report: dict) -> dict:
    """从报告详情构建 summary 对象"""
    report_type = report.get("types", [])
    is_exposure = "exposure" in report_type
    is_fuzzing = "fuzzing" in report_type

    exposure_findings = []
    fuzzing_findings = []

    if "exposure" in report:
        exposure_findings = report["exposure"].get("findings", [])
    if "fuzzing" in report:
        fuzzing_findings = report["fuzzing"].get("findings", [])

    high_risk_exposure = len([f for f in exposure_findings if f.get("severity") == "high"])
    high_risk_chain = len([f for f in fuzzing_findings if f.get("severity") == "high"])
    top_risks = (
        [f.get("title") for f in exposure_findings if f.get("severity") == "high"]
        + [f.get("title") for f in fuzzing_findings if f.get("severity") == "high"]
    )[:2]

    return {
        "totalFindings": report.get("summary", {}).get("totalFindings", len(exposure_findings) + len(fuzzing_findings)),
        "exposureFindings": len(exposure_findings) if is_exposure else 0,
        "fuzzingFindings": len(fuzzing_findings) if is_fuzzing else 0,
        "doeToolCount": report.get("summary", {}).get("doeToolCount", len(exposure_findings)),
        "chainToolCount": report.get("summary", {}).get("chainToolCount", len(fuzzing_findings)),
        "highRiskExposureCount": high_risk_exposure,
        "highRiskChainCount": high_risk_chain,
        "topRisks": top_risks,
    }


def migrate_state(state: dict, state_file: Path, report_details_dir: Path) -> tuple[int, int]:
    """迁移单个状态文件，返回更新的扫描数量和已有 summary 的数量"""
    scans = state.get("scans", [])
    report_detail_index = state.get("reportDetailIndex", [])

    # 建立 scanId -> reportDetailIndex 的映射
    report_index_map = {r["scanId"]: r for r in report_detail_index}

    updated_count = 0
    already_has_summary = 0

    for scan in scans:
        # 检查是否已有 summary
        if scan.get("summary"):
            already_has_summary += 1
            continue

        scan_id = scan.get("id")
        report_id = scan.get("reportId")

        # 优先从 reportId 查找
        report = None
        if report_id:
            # 先在 reportDetailIndex 中查找
            if report_id in report_index_map:
                # 从单独文件读取完整报告
                report = get_report_detail_from_file(report_id, report_details_dir)

        # 如果没找到，尝试通过 scanId 查找
        if not report and scan_id in report_index_map:
            idx = report_index_map[scan_id]
            report = get_report_detail_from_file(idx.get("id", scan_id), report_details_dir)

        # 如果找到报告，构建 summary
        if report:
            scan["summary"] = build_summary_from_report(report)
            updated_count += 1
            print(f"  Updated scan {scan_id[:20]}... with summary: {scan['summary']['totalFindings']} findings")
        else:
            print(f"  Warning: No report found for scan {scan_id[:20]}...")

    # 保存更新后的状态
    save_json(state_file, state)
    return updated_count, already_has_summary


def main():
    print("=" * 60)
    print("Legacy Scan Summary Migration")
    print("=" * 60)
    print()

    total_updated = 0
    total_existing = 0

    # 迁移 AgentRaft 状态
    ar_state_file = DATA_ROOT_AGENTRAFT / "agentraft-state.json"
    if ar_state_file.exists():
        print(f"Processing AgentRaft state: {ar_state_file}")
        state = load_json(ar_state_file)
        updated, existing = migrate_state(state, ar_state_file, REPORT_DETAILS_AR)
        total_updated += updated
        total_existing += existing
        print(f"  Updated: {updated}, Already had summary: {existing}")
        print()
    else:
        print(f"AgentRaft state file not found: {ar_state_file}")
        print()

    # 迁移 MTAtlas 状态
    mt_state_file = DATA_ROOT_MTATLAS / "mtatlas-state.json"
    if mt_state_file.exists():
        print(f"Processing MTAtlas state: {mt_state_file}")
        state = load_json(mt_state_file)
        updated, existing = migrate_state(state, mt_state_file, REPORT_DETAILS_MT)
        total_updated += updated
        total_existing += existing
        print(f"  Updated: {updated}, Already had summary: {existing}")
        print()
    else:
        print(f"MTAtlas state file not found: {mt_state_file}")
        print()

    print("=" * 60)
    print(f"Migration complete!")
    print(f"  Total updated: {total_updated}")
    print(f"  Already had summary: {total_existing}")
    print("=" * 60)


if __name__ == "__main__":
    main()
