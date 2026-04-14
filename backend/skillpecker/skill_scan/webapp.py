from __future__ import annotations

import json
import logging
import math
import os
import re
import shutil
import threading
import zipfile
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Annotated, Any
from uuid import uuid4

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .batch import BatchSkillScanner, discover_skill_dirs
from .cli import build_scanner
from .config import AppConfig, apply_task_llm_override, load_app_config
from .llm import get_provider_profile

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
FAVICON_PATH = FRONTEND_ROOT / "favicon.svg"
API_PREFIX = "/api"
URL_RE = re.compile(r"https?://[^\s)>\]]+")
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*(?:\n|$)", re.DOTALL)
SEARCH_NORMALIZE_RE = re.compile(r"[-_]+")

executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="skill-scan-web")
job_lock = threading.Lock()
job_runtime_llm_lock = threading.Lock()
library_search_cache_lock = threading.Lock()
library_entry_cache_lock = threading.Lock()
library_search_cache: dict[str, tuple[tuple[int, ...], str]] = {}
library_entry_cache: dict[tuple[str, bool, bool], tuple[tuple[int, ...], dict[str, Any]]] = {}
job_runtime_llm_overrides: dict[str, dict[str, str]] = {}


def load_config() -> AppConfig:
    return load_app_config(PROJECT_ROOT / "scan_config.toml")


def jobs_root_for(config: AppConfig) -> Path:
    return config.web.scan_results_dir / "jobs"


def library_root_for(config: AppConfig) -> Path:
    return config.web.malicious_library_dir


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_runtime_llm_override(*, provider: str, model: str, api_key: str) -> dict[str, str]:
    normalized_provider = provider.strip().lower()
    normalized_model = model.strip()
    normalized_api_key = api_key.strip()

    missing_fields: list[str] = []
    if not normalized_provider:
        missing_fields.append("provider")
    if not normalized_model:
        missing_fields.append("model")
    if not normalized_api_key:
        missing_fields.append("API key")
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing scan configuration: {', '.join(missing_fields)}.",
        )

    try:
        get_provider_profile(normalized_provider)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "provider": normalized_provider,
        "model": normalized_model,
        "api_key": normalized_api_key,
    }


def set_job_runtime_llm_override(job_id: str, override: dict[str, str]) -> None:
    with job_runtime_llm_lock:
        job_runtime_llm_overrides[job_id] = override


def pop_job_runtime_llm_override(job_id: str) -> dict[str, str] | None:
    with job_runtime_llm_lock:
        return job_runtime_llm_overrides.pop(job_id, None)


def sanitize_name(value: str, fallback: str = "skill") -> str:
    cleaned = "".join(char if char.isalnum() or char in {"-", "_"} else "-" for char in value.strip())
    cleaned = cleaned.strip("-_")
    return cleaned or fallback


def make_job_id() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return f"job-{timestamp}-{uuid4().hex[:6]}"


def ensure_relative_path(raw_path: str) -> PurePosixPath:
    normalized = raw_path.replace("\\", "/").strip("/")
    pure = PurePosixPath(normalized)
    if not normalized or pure.is_absolute() or ".." in pure.parts:
        raise HTTPException(status_code=400, detail=f"Invalid relative path: {raw_path}")
    return pure


def allocate_dir_name(root: Path, preferred_name: str) -> str:
    base = sanitize_name(preferred_name)
    candidate = base
    index = 2
    while (root / candidate).exists():
        candidate = f"{base}-{index}"
        index += 1
    return candidate


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_json_optional(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return read_json(path)


def read_text_optional(path: Path) -> str | None:
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8", errors="ignore")


def unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    items: list[str] = []
    for value in values:
        cleaned = value.strip()
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        items.append(cleaned)
    return items


def normalize_search_text(value: str) -> str:
    return SEARCH_NORMALIZE_RE.sub(" ", value).casefold().strip()


def extract_business_category(skill_id: str) -> str:
    text = str(skill_id or "").strip()
    if not text or "__" not in text:
        return ""
    category = text.split("__", 1)[0].strip()
    if not category:
        return ""
    if category.casefold() == "unknown":
        return "unknown"
    return category


def file_mtime_ns(path: Path) -> int:
    if not path.exists():
        return -1
    return path.stat().st_mtime_ns


def library_search_signature(skill_root: Path) -> tuple[int, ...]:
    return tuple(
        file_mtime_ns(skill_root / filename)
        for filename in ("library.json", "metadata.json", "_meta.json", "SKILL.md", "skill.md")
    )


def library_entry_signature(skill_root: Path, *, include_preview: bool, include_scan_result: bool) -> tuple[int, ...]:
    files = ["library.json", "metadata.json", "_meta.json", "SKILL.md", "skill.md"]
    if include_scan_result:
        files.extend(["judge.raw.json", "scan-result.raw.json"])
    return tuple(file_mtime_ns(skill_root / filename) for filename in files)


def find_skill_roots(root: Path) -> list[Path]:
    candidates: list[Path] = []
    for skill_file in sorted(root.rglob("*"), key=lambda item: len(item.parts)):
        if not skill_file.is_file() or skill_file.name.lower() != "skill.md":
            continue
        candidate = skill_file.parent
        if any(candidate.is_relative_to(existing) for existing in candidates):
            continue
        candidates = [existing for existing in candidates if not existing.is_relative_to(candidate)]
        candidates.append(candidate)

    if candidates:
        return candidates
    if (root / "SKILL.md").exists():
        return [root]
    return [path for path in sorted(root.iterdir()) if path.is_dir() and not path.name.startswith(".")]


def copy_skill_tree(source: Path, destination_root: Path, preferred_name: str) -> str:
    target_name = allocate_dir_name(destination_root, preferred_name)
    shutil.copytree(source, destination_root / target_name)
    return target_name


async def save_upload_file(upload: UploadFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as handle:
        while chunk := await upload.read(1024 * 1024):
            handle.write(chunk)
    await upload.close()


async def ingest_archives(archives: list[UploadFile], staging_root: Path, skills_root: Path) -> list[str]:
    imported: list[str] = []
    if not archives:
        return imported

    archive_root = staging_root / "archives"
    extract_root = staging_root / "archive-extracted"
    archive_root.mkdir(parents=True, exist_ok=True)
    extract_root.mkdir(parents=True, exist_ok=True)

    for upload in archives:
        filename = upload.filename or "skill.zip"
        if not filename.lower().endswith(".zip"):
            raise HTTPException(status_code=400, detail=f"Unsupported archive type: {filename}")

        archive_name = sanitize_name(Path(filename).stem, "skill-archive")
        archive_path = archive_root / f"{archive_name}.zip"
        await save_upload_file(upload, archive_path)

        archive_extract_dir = extract_root / archive_name
        archive_extract_dir.mkdir(parents=True, exist_ok=True)

        try:
            with zipfile.ZipFile(archive_path) as zipped:
                for member in zipped.infolist():
                    if member.is_dir():
                        continue
                    relative_path = ensure_relative_path(member.filename)
                    target_path = archive_extract_dir / Path(*relative_path.parts)
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    with zipped.open(member, "r") as source, target_path.open("wb") as target:
                        shutil.copyfileobj(source, target)
        except zipfile.BadZipFile as exc:
            raise HTTPException(status_code=400, detail=f"Invalid zip archive: {filename}") from exc

        skill_roots = find_skill_roots(archive_extract_dir)
        if not skill_roots:
            raise HTTPException(status_code=400, detail=f"No skill package found inside archive: {filename}")

        for skill_root in skill_roots:
            imported.append(copy_skill_tree(skill_root, skills_root, skill_root.name or archive_name))

    return imported


async def ingest_directory_files(
    files: list[UploadFile],
    relative_paths: list[str],
    staging_root: Path,
    skills_root: Path,
) -> list[str]:
    imported: list[str] = []
    if not files:
        return imported
    if len(files) != len(relative_paths):
        raise HTTPException(status_code=400, detail="Directory upload metadata is incomplete.")

    directory_root = staging_root / "directory-upload"
    directory_root.mkdir(parents=True, exist_ok=True)

    for upload, relative_path in zip(files, relative_paths):
        pure_path = ensure_relative_path(relative_path)
        target_path = directory_root / Path(*pure_path.parts)
        await save_upload_file(upload, target_path)

    skill_roots = find_skill_roots(directory_root)
    if not skill_roots:
        raise HTTPException(status_code=400, detail="No skill package found in uploaded directory files.")

    for skill_root in skill_roots:
        imported.append(copy_skill_tree(skill_root, skills_root, skill_root.name))

    return imported


def read_job_metadata(job_id: str) -> dict[str, Any]:
    config = load_config()
    metadata_path = jobs_root_for(config) / job_id / "job.json"
    if not metadata_path.exists():
        raise HTTPException(status_code=404, detail="Scan job not found.")
    return read_json(metadata_path)


def write_job_metadata(job_root: Path, payload: dict[str, Any]) -> None:
    job_root.mkdir(parents=True, exist_ok=True)
    (job_root / "job.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def update_job_metadata(job_id: str, **changes: Any) -> dict[str, Any]:
    config = load_config()
    job_root = jobs_root_for(config) / job_id
    with job_lock:
        payload = read_json(job_root / "job.json")
        payload.update(changes)
        write_job_metadata(job_root, payload)
    return payload


def list_job_records() -> list[tuple[str, dict[str, Any]]]:
    config = load_config()
    jobs_root = jobs_root_for(config)
    if not jobs_root.exists():
        return []
    records: list[tuple[str, dict[str, Any]]] = []
    for metadata_path in jobs_root.glob("*/job.json"):
        job_id = metadata_path.parent.name
        try:
            records.append((job_id, read_json(metadata_path)))
        except json.JSONDecodeError:
            continue
    records.sort(key=lambda item: item[1].get("created_at", ""), reverse=True)
    return records


def build_queue_positions(records: list[tuple[str, dict[str, Any]]]) -> dict[str, int]:
    active = [
        (job_id, metadata)
        for job_id, metadata in records
        if metadata.get("status") in {"running", "queued"}
    ]
    active.sort(key=lambda item: (0 if item[1].get("status") == "running" else 1, item[1].get("created_at", "")))
    return {job_id: index + 1 for index, (job_id, _) in enumerate(active)}


def build_summary_excerpt(summary: dict[str, Any]) -> dict[str, Any]:
    label_counts: dict[str, int] = {}
    for item in summary.get("skills", []):
        verdict = item.get("verdict") or {}
        label = verdict.get("label")
        if not label:
            continue
        label_counts[label] = label_counts.get(label, 0) + 1
    return {
        "skillCount": summary.get("skill_count", 0),
        "scannedCount": summary.get("scanned_count", 0),
        "failedCount": summary.get("failed_count", 0),
        "labelCounts": label_counts,
    }


def summarize_job(job_id: str, metadata: dict[str, Any], *, queue_positions: dict[str, int]) -> dict[str, Any]:
    return {
        "id": job_id,
        "status": metadata.get("status", "unknown"),
        "createdAt": metadata.get("created_at"),
        "startedAt": metadata.get("started_at"),
        "finishedAt": metadata.get("finished_at"),
        "scanMode": metadata.get("scan_mode"),
        "skillNames": metadata.get("skill_names", []),
        "skillCount": metadata.get("skill_count", 0),
        "error": metadata.get("error"),
        "queuePosition": queue_positions.get(job_id),
        "summaryExcerpt": metadata.get("summary_excerpt"),
        "logFile": metadata.get("log_file"),
        "llmConfig": metadata.get("llm_config"),
    }


def build_scans_payload() -> dict[str, Any]:
    records = list_job_records()
    queue_positions = build_queue_positions(records)
    jobs = [summarize_job(job_id, metadata, queue_positions=queue_positions) for job_id, metadata in records]
    return {
        "jobs": jobs,
        "queue": {
            "running": sum(1 for item in jobs if item["status"] == "running"),
            "queued": sum(1 for item in jobs if item["status"] == "queued"),
            "completed": sum(1 for item in jobs if item["status"] == "completed"),
            "failed": sum(1 for item in jobs if item["status"] == "failed"),
        },
    }


def build_job_payload(job_id: str) -> dict[str, Any]:
    records = list_job_records()
    queue_positions = build_queue_positions(records)
    metadata = next((item for current_id, item in records if current_id == job_id), None)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Scan job not found.")

    payload: dict[str, Any] = {"job": summarize_job(job_id, metadata, queue_positions=queue_positions)}
    output_root = Path(metadata["output_root"])
    index_path = output_root / "index.raw.json"
    if index_path.exists():
        payload["summary"] = read_json(index_path)
    return payload


def build_skill_payload(job_id: str, skill_name: str) -> dict[str, Any]:
    metadata = read_job_metadata(job_id)
    skill_root = Path(metadata["output_root"]) / skill_name
    if not skill_root.exists():
        raise HTTPException(status_code=404, detail="Skill result not found.")

    error_path = skill_root / "error.raw.json"
    if error_path.exists():
        return {
            "jobId": job_id,
            "skillName": skill_name,
            "status": "error",
            "error": read_json(error_path),
        }

    result_path = skill_root / "scan-result.raw.json"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Skill result file not found.")

    return {
        "jobId": job_id,
        "skillName": skill_name,
        "status": "ok",
        "result": read_json(result_path),
    }


def attach_job_file_handler(output_root: Path, *, level: str, filename: str) -> tuple[Path, logging.Handler]:
    output_root.mkdir(parents=True, exist_ok=True)
    log_path = output_root / filename
    log_level = getattr(logging, level.upper(), logging.INFO)
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler = logging.FileHandler(log_path, encoding="utf-8")
    handler.setLevel(log_level)
    handler.setFormatter(formatter)
    logging.getLogger().addHandler(handler)
    return log_path, handler


def run_scan_job(job_id: str) -> None:
    metadata = read_job_metadata(job_id)
    skills_root = Path(metadata["skills_root"])
    output_root = Path(metadata["output_root"])
    runtime_llm_override = pop_job_runtime_llm_override(job_id)

    update_job_metadata(job_id, status="running", started_at=now_iso())
    log_path: Path | None = None
    log_handler: logging.Handler | None = None

    try:
        app_config = load_config()
        if runtime_llm_override is None:
            raise RuntimeError("Missing runtime scan configuration for this job.")
        app_config = replace(
            app_config,
            paths=replace(app_config.paths, skills_dir=skills_root, output_dir=output_root),
        )
        app_config = apply_task_llm_override(
            app_config,
            provider=runtime_llm_override["provider"],
            model=runtime_llm_override["model"],
            api_key=runtime_llm_override["api_key"],
        )
        logging.getLogger().setLevel(getattr(logging, app_config.logging.level.upper(), logging.INFO))
        if app_config.logging.file_enabled:
            log_path, log_handler = attach_job_file_handler(
                app_config.paths.output_dir,
                level=app_config.logging.level,
                filename=app_config.logging.filename,
            )
        skill_dirs = discover_skill_dirs(skills_root)
        scanner = build_scanner(app_config) if skill_dirs else None
        batch = BatchSkillScanner(scanner=scanner, preprocess_only=app_config.scan.preprocess_only)
        summary = batch.run(skills_root=skills_root, output_root=output_root)

        update_job_metadata(
            job_id,
            status="completed",
            finished_at=now_iso(),
            log_file=str(log_path) if log_path is not None else None,
            summary_excerpt=build_summary_excerpt(summary),
        )
    except Exception as exc:
        update_job_metadata(
            job_id,
            status="failed",
            finished_at=now_iso(),
            error=str(exc),
            log_file=str(log_path) if log_path is not None else None,
        )
    finally:
        if log_handler is not None:
            root = logging.getLogger()
            root.removeHandler(log_handler)
            log_handler.close()


def find_first_file(root: Path, names: set[str]) -> Path | None:
    candidates = [path for path in root.rglob("*") if path.is_file() and path.name.lower() in names]
    return sorted(candidates, key=lambda item: (len(item.parts), item.name.lower()))[0] if candidates else None


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text

    frontmatter: dict[str, str] = {}
    for raw_line in match.group(1).splitlines():
        line = raw_line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip("'\"")
    return frontmatter, text[match.end() :]


def load_searchable_library_names(skill_root: Path) -> list[str]:
    cache_key = str(skill_root)
    signature = library_search_signature(skill_root)
    with library_search_cache_lock:
        cached = library_search_cache.get(cache_key)
        if cached and cached[0] == signature:
            return cached[1].split("\n") if cached[1] else []

    values = [skill_root.name]
    for filename in ("library.json", "metadata.json", "_meta.json"):
        payload = read_json_optional(skill_root / filename)
        if not payload:
            continue
        values.extend(
            [
                str(payload.get("name", "")),
                str(payload.get("slug", "")),
                str(payload.get("ownerId", "")),
            ]
        )

    skill_doc = find_first_file(skill_root, {"skill.md"})
    if skill_doc and skill_doc.exists():
        snippet = skill_doc.read_text(encoding="utf-8", errors="ignore")[:2048]
        frontmatter, _ = parse_frontmatter(snippet)
        values.extend([frontmatter.get("name", ""), frontmatter.get("description", "")])

    unique_values = unique_strings(values)
    with library_search_cache_lock:
        library_search_cache[cache_key] = (signature, "\n".join(unique_values))
    return unique_values


def extract_skill_doc_info(skill_root: Path, *, include_preview: bool = False) -> dict[str, Any]:
    skill_doc = find_first_file(skill_root, {"skill.md"})
    if skill_doc is None:
        return {"skillDoc": None, "hasSkillDoc": False, "name": "", "description": "", "urls": [], "preview": ""}

    text = read_text_optional(skill_doc) or ""
    frontmatter, body = parse_frontmatter(text)
    lines = [line.strip() for line in body.splitlines()]
    description = ""
    for line in lines:
        if not line or line.startswith("#") or line == "---":
            continue
        description = line
        break

    urls = unique_strings(
        [
            frontmatter.get("homepage", ""),
            frontmatter.get("url", ""),
            *URL_RE.findall(text),
        ]
    )
    return {
        "skillDoc": str(skill_doc),
        "hasSkillDoc": True,
        "name": frontmatter.get("name", ""),
        "description": frontmatter.get("description") or description,
        "urls": urls,
        "preview": text if include_preview else "",
    }


def extract_library_scan_data(skill_root: Path, *, include_scan_result: bool) -> dict[str, Any]:
    judge_path = find_first_file(skill_root, {"judge.raw.json"})
    result_path = find_first_file(skill_root, {"scan-result.raw.json"})
    judge = read_json_optional(judge_path) if judge_path else None
    result = read_json_optional(result_path) if include_scan_result and result_path else None
    if result is None and result_path and judge is None:
        result = read_json_optional(result_path)

    verdict = None
    if judge and isinstance(judge.get("verdict"), dict):
        verdict = judge["verdict"]
    elif result and isinstance(result.get("judge"), dict):
        verdict = result["judge"].get("verdict")

    findings: list[dict[str, Any]] = []
    if judge and isinstance(judge.get("top_findings"), list):
        findings = judge.get("top_findings", [])
    elif result and isinstance(result.get("judge"), dict):
        findings = result["judge"].get("top_findings") or []
    elif result and isinstance(result.get("security"), dict):
        findings = result["security"].get("findings") or []

    excel_records = []
    if result and isinstance(result.get("excel_import"), dict):
        excel_records = result["excel_import"].get("records") or []

    decision_levels = unique_strings(
        [
            *[
                record.get("classification", {}).get("decision_level", "")
                for record in excel_records
                if isinstance(record, dict)
            ],
            *[finding.get("decision_level", "") for finding in findings if isinstance(finding, dict)],
        ]
    )

    decision_rank = {"MALICIOUS": 0, "SUSPICIOUS": 1, "OVERREACH": 2, "SAFE": 3}
    primary_decision_level = ""
    if decision_levels:
        primary_decision_level = sorted(
            decision_levels,
            key=lambda value: (decision_rank.get(str(value).upper(), 99), str(value)),
        )[0]

    categories = unique_strings(
        [
            *(verdict.get("issue_types", []) if isinstance(verdict, dict) else []),
            verdict.get("primary_concern", "") if isinstance(verdict, dict) else "",
            *[finding.get("cat", "") for finding in findings if isinstance(finding, dict)],
            *[finding.get("class", "") for finding in findings if isinstance(finding, dict)],
        ]
    )
    categories = [item for item in categories if item and item != "none"]

    return {
        "judgePath": str(judge_path) if judge_path else None,
        "scanResultPath": str(result_path) if result_path else None,
        "resultAvailable": result is not None or judge is not None,
        "verdict": verdict,
        "judge": judge,
        "scanResult": result if include_scan_result else None,
        "findingCount": len(findings),
        "categories": categories,
        "decisionLevels": decision_levels,
        "primaryDecisionLevel": primary_decision_level,
    }


def load_library_entry(skill_root: Path, *, include_preview: bool = False, include_scan_result: bool = False) -> dict[str, Any]:
    cache_key = (str(skill_root), include_preview, include_scan_result)
    signature = library_entry_signature(skill_root, include_preview=include_preview, include_scan_result=include_scan_result)
    with library_entry_cache_lock:
        cached = library_entry_cache.get(cache_key)
        if cached and cached[0] == signature:
            return cached[1].copy()

    info: dict[str, Any] = {}
    for filename in ("library.json", "metadata.json", "_meta.json"):
        payload = read_json_optional(skill_root / filename)
        if payload:
            info.update(payload)

    doc_info = extract_skill_doc_info(skill_root, include_preview=include_preview)
    scan_data = extract_library_scan_data(skill_root, include_scan_result=include_scan_result)

    url = (
        info.get("url")
        or info.get("homepage")
        or info.get("repo")
        or (doc_info["urls"][0] if doc_info["urls"] else "")
    )
    description = (
        info.get("function")
        or info.get("description")
        or info.get("summary")
        or doc_info["description"]
    )

    entry = {
        "id": skill_root.name,
        "name": info.get("name") or doc_info["name"] or skill_root.name,
        "businessCategory": extract_business_category(skill_root.name),
        "slug": info.get("slug", ""),
        "version": info.get("version", ""),
        "ownerId": info.get("ownerId", ""),
        "publishedAt": info.get("publishedAt"),
        "url": url,
        "description": description,
        "skillPath": str(skill_root),
        "scanResultPath": scan_data["scanResultPath"],
        "judgePath": scan_data["judgePath"],
        "resultAvailable": scan_data["resultAvailable"],
        "verdict": scan_data["verdict"],
        "categories": scan_data["categories"],
        "findingCount": scan_data["findingCount"],
        "decisionLevels": scan_data["decisionLevels"],
        "primaryDecisionLevel": scan_data["primaryDecisionLevel"],
        "hasSkillDoc": doc_info["hasSkillDoc"],
        "docPreview": doc_info["preview"],
        "scanResult": scan_data["scanResult"],
        "judge": scan_data["judge"],
    }
    with library_entry_cache_lock:
        library_entry_cache[cache_key] = (signature, entry.copy())
    return entry


def iter_library_dirs(root: Path) -> list[Path]:
    return sorted(
        [path for path in root.iterdir() if path.is_dir() and not path.name.startswith(".")],
        key=lambda path: path.name.casefold(),
    )


def matches_library_query(skill_root: Path, normalized_query: str) -> bool:
    if not normalized_query:
        return True
    return any(
        normalized_query in value.casefold() or normalized_query in normalize_search_text(value)
        for value in load_searchable_library_names(skill_root)
    )


def normalize_decision_levels(values: str) -> list[str]:
    return unique_strings([item.strip().upper() for item in str(values or "").split(",") if item.strip()])


def matches_library_decision_levels(skill_root: Path, decision_levels: list[str]) -> bool:
    if not decision_levels:
        return True
    entry = load_library_entry(skill_root, include_preview=False, include_scan_result=False)
    available = {str(value or "").upper() for value in entry.get("decisionLevels", []) if str(value or "").strip()}
    primary = str(entry.get("primaryDecisionLevel") or "").upper()
    if primary:
        available.add(primary)
    return any(level in available for level in decision_levels)


def build_library_payload(*, page: int, page_size: int, query: str, decision_levels: str = "") -> dict[str, Any]:
    config = load_config()
    root = library_root_for(config)
    root.mkdir(parents=True, exist_ok=True)
    normalized_query = normalize_search_text(query)
    normalized_decision_levels = normalize_decision_levels(decision_levels)
    library_dirs = iter_library_dirs(root)
    if normalized_query:
        library_dirs = [path for path in library_dirs if matches_library_query(path, normalized_query)]
    if normalized_decision_levels:
        library_dirs = [path for path in library_dirs if matches_library_decision_levels(path, normalized_decision_levels)]

    total = len(library_dirs)
    total_pages = max(1, math.ceil(total / page_size)) if total else 0
    current_page = min(page, total_pages) if total_pages else 1
    start = (current_page - 1) * page_size
    page_dirs = library_dirs[start : start + page_size]
    entries = [load_library_entry(path, include_preview=False, include_scan_result=False) for path in page_dirs]

    return {
        "root": str(root),
        "count": total,
        "page": current_page,
        "pageSize": page_size,
        "totalPages": total_pages,
        "query": query,
        "decisionLevels": normalized_decision_levels,
        "items": [
            {
                "id": item["id"],
                "name": item["name"],
                "businessCategory": item["businessCategory"],
                "slug": item["slug"],
                "version": item["version"],
                "ownerId": item["ownerId"],
                "publishedAt": item["publishedAt"],
                "url": item["url"],
                "description": item["description"],
                "skillPath": item["skillPath"],
                "resultAvailable": item["resultAvailable"],
                "verdict": item["verdict"],
                "categories": item["categories"],
                "findingCount": item["findingCount"],
                "decisionLevels": item["decisionLevels"],
                "primaryDecisionLevel": item["primaryDecisionLevel"],
                "hasSkillDoc": item["hasSkillDoc"],
            }
            for item in entries
        ],
    }


def build_library_detail(skill_id: str) -> dict[str, Any]:
    config = load_config()
    skill_root = library_root_for(config) / skill_id
    if not skill_root.exists():
        raise HTTPException(status_code=404, detail="Malicious skill not found.")
    item = load_library_entry(skill_root, include_preview=True, include_scan_result=True)
    return {
        "item": {
            "id": item["id"],
            "name": item["name"],
            "businessCategory": item["businessCategory"],
            "slug": item["slug"],
            "version": item["version"],
            "ownerId": item["ownerId"],
            "publishedAt": item["publishedAt"],
            "url": item["url"],
            "description": item["description"],
            "skillPath": item["skillPath"],
            "resultAvailable": item["resultAvailable"],
            "verdict": item["verdict"],
            "categories": item["categories"],
            "findingCount": item["findingCount"],
            "docPreview": item["docPreview"],
            "decisionLevels": item["decisionLevels"],
            "primaryDecisionLevel": item["primaryDecisionLevel"],
            "hasSkillDoc": item["hasSkillDoc"],
        },
        "scanResult": item["scanResult"],
        "judge": item["judge"],
    }


def create_app() -> FastAPI:
    app = FastAPI(title="SAFE-Agent SkillPecker Backend", version="0.2.0")

    if FRONTEND_ROOT.exists():
        app.mount("/static", StaticFiles(directory=str(FRONTEND_ROOT)), name="static")

        @app.get("/", include_in_schema=False)
        async def index() -> FileResponse:
            return FileResponse(FRONTEND_ROOT / "index.html")

        @app.get("/favicon.ico", include_in_schema=False)
        async def favicon() -> FileResponse:
            return FileResponse(FAVICON_PATH, media_type="image/svg+xml")

    @app.get(f"{API_PREFIX}/health")
    async def health() -> dict[str, Any]:
        config = load_config()
        return {
            "status": "ok",
            "scanMode": "preprocess-only" if config.scan.preprocess_only else "full-scan",
            "scanResultsRoot": str(config.web.scan_results_dir),
            "maliciousLibraryRoot": str(config.web.malicious_library_dir),
        }

    @app.get(f"{API_PREFIX}/scans")
    async def scans() -> dict[str, Any]:
        return build_scans_payload()

    @app.post(f"{API_PREFIX}/scans")
    async def create_scan(
        archives: Annotated[list[UploadFile] | None, File()] = None,
        files: Annotated[list[UploadFile] | None, File()] = None,
        relative_paths: Annotated[list[str] | None, Form()] = None,
        llm_provider: Annotated[str | None, Form()] = None,
        llm_model: Annotated[str | None, Form()] = None,
        llm_api_key: Annotated[str | None, Form()] = None,
    ) -> dict[str, Any]:
        archive_items = archives or []
        file_items = files or []
        relative_path_items = relative_paths or []
        if not archive_items and not file_items:
            raise HTTPException(status_code=400, detail="Upload at least one zip package or one skill directory.")
        runtime_llm_override = normalize_runtime_llm_override(
            provider=llm_provider or "",
            model=llm_model or "",
            api_key=llm_api_key or "",
        )

        config = load_config()
        jobs_root = jobs_root_for(config)
        jobs_root.mkdir(parents=True, exist_ok=True)

        job_id = make_job_id()
        job_root = jobs_root / job_id
        staging_root = job_root / "staging"
        skills_root = job_root / "skills"
        output_root = job_root / "output"
        for path in (staging_root, skills_root, output_root):
            path.mkdir(parents=True, exist_ok=True)

        metadata = {
            "id": job_id,
            "status": "queued",
            "created_at": now_iso(),
            "started_at": None,
            "finished_at": None,
            "scan_mode": "preprocess-only" if config.scan.preprocess_only else "full-scan",
            "skills_root": str(skills_root),
            "output_root": str(output_root),
            "skill_count": 0,
            "skill_names": [],
            "error": None,
            "log_file": None,
            "summary_excerpt": None,
            "upload_summary": None,
            "llm_config": {
                "provider": runtime_llm_override["provider"],
                "model": runtime_llm_override["model"],
            },
        }
        write_job_metadata(job_root, metadata)
        set_job_runtime_llm_override(job_id, runtime_llm_override)

        try:
            imported_archives = await ingest_archives(archive_items, staging_root, skills_root)
            imported_directories = await ingest_directory_files(file_items, relative_path_items, staging_root, skills_root)
            skill_dirs = discover_skill_dirs(skills_root)
            if not skill_dirs:
                raise HTTPException(status_code=400, detail="No valid skill directories were found after upload.")

            update_job_metadata(
                job_id,
                skill_count=len(skill_dirs),
                skill_names=[path.name for path in skill_dirs],
                upload_summary={
                    "archiveCount": len(imported_archives),
                    "directoryCount": len(imported_directories),
                },
            )
        except Exception:
            pop_job_runtime_llm_override(job_id)
            shutil.rmtree(job_root, ignore_errors=True)
            raise

        executor.submit(run_scan_job, job_id)
        return build_job_payload(job_id)

    @app.get(f"{API_PREFIX}/scans/{{job_id}}")
    async def scan_status(job_id: str) -> dict[str, Any]:
        return build_job_payload(job_id)

    @app.get(f"{API_PREFIX}/scans/{{job_id}}/skills/{{skill_name}}")
    async def skill_result(job_id: str, skill_name: str) -> dict[str, Any]:
        return build_skill_payload(job_id, skill_name)

    @app.get(f"{API_PREFIX}/library")
    async def library_index(
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        query: str = Query(""),
        decision_levels: str = Query(""),
    ) -> dict[str, Any]:
        return build_library_payload(page=page, page_size=page_size, query=query, decision_levels=decision_levels)

    @app.get(f"{API_PREFIX}/library/{{skill_id}}")
    async def library_detail(skill_id: str) -> dict[str, Any]:
        return build_library_detail(skill_id)

    return app


app = create_app()


def main() -> None:
    host = os.getenv("SKILLPECKER_HOST", "127.0.0.1")
    port = int(os.getenv("SKILLPECKER_PORT", "8010"))
    uvicorn.run("skill_scan.webapp:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
