#!/usr/bin/env python3
import argparse
import datetime as dt
import glob
import json
import os
import sys

def _parse_date(value: str) -> dt.date:
    try:
        return dt.datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise argparse.ArgumentTypeError("date must be YYYY-MM-DD") from exc

def _iter_session_files(target_date: dt.date) -> list[str]:
    root = os.path.expanduser("~/.codex/sessions")
    path = os.path.join(root, target_date.strftime("%Y/%m/%d"), "*.jsonl")
    return sorted(glob.glob(path))

def _parse_timestamp(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return dt.datetime.fromtimestamp(value / 1000 if value > 1e12 else value, tz=dt.timezone.utc)
    if isinstance(value, str):
        try:
            return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None

def _normalize_token_info(data):
    if not isinstance(data, dict):
        return None
    if isinstance(data.get("total_token_usage"), dict):
        data = data["total_token_usage"]
    input_tokens = data.get("input_tokens") or data.get("prompt_tokens") or 0
    output_tokens = data.get("output_tokens") or data.get("completion_tokens") or 0
    cache_tokens = data.get("cached_input_tokens")
    if cache_tokens is None:
        cache_tokens = data.get("cache_creation_input_tokens") or 0
    reasoning_tokens = data.get("reasoning_output_tokens")
    if reasoning_tokens is None:
        reasoning_tokens = data.get("reasoning_tokens") or 0
    total = data.get("total_tokens")
    if total is None:
        total = data.get("total_token_usage")
    if total is None:
        total = input_tokens + output_tokens + cache_tokens + reasoning_tokens
    return {
        "total": total or 0,
        "input": input_tokens or 0,
        "output": output_tokens or 0,
        "cache": cache_tokens or 0,
        "reasoning": reasoning_tokens or 0,
    }

def _extract_token_usage(entry):
    token_count = entry.get("token_count")
    if token_count is not None:
        return _normalize_token_info(token_count)
    payload = entry.get("payload") or {}
    if entry.get("type") == "event_msg" and payload.get("type") == "token_count":
        info = payload.get("info") or {}
        return _normalize_token_info(info.get("total_token_usage") or {})
    return None

def _collect_usage(files: list[str]):
    total = 0
    input_tokens = 0
    output_tokens = 0
    cache_tokens = 0
    reasoning_tokens = 0
    min_ts = None
    max_ts = None

    for path in files:
        try:
            with open(path, "r", encoding="utf-8") as handle:
                lines = handle.read().splitlines()
        except OSError:
            continue
        if not lines:
            continue
        last_usage = None

        for line in lines:
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            usage = _extract_token_usage(entry)
            if usage is not None:
                last_usage = usage
            ts = entry.get("timestamp") or entry.get("created_at")
            parsed = _parse_timestamp(ts)
            if parsed is None:
                continue
            if min_ts is None or parsed < min_ts:
                min_ts = parsed
            if max_ts is None or parsed > max_ts:
                max_ts = parsed
        if last_usage is not None:
            total += last_usage["total"]
            input_tokens += last_usage["input"]
            output_tokens += last_usage["output"]
            cache_tokens += last_usage["cache"]
            reasoning_tokens += last_usage["reasoning"]

    return {
        "total": total,
        "input": input_tokens,
        "output": output_tokens,
        "cache": cache_tokens,
        "reasoning": reasoning_tokens,
        "min_ts": min_ts,
        "max_ts": max_ts,
    }

def _format_time_range(min_ts, max_ts, tzinfo):
    if min_ts is None or max_ts is None:
        return "unknown", "unknown", "+0000"
    min_local = min_ts.astimezone(tzinfo)
    max_local = max_ts.astimezone(tzinfo)
    tz_suffix = min_local.strftime("%z") or "+0000"
    return (
        min_local.strftime("%Y-%m-%d %H:%M:%S"),
        max_local.strftime("%Y-%m-%d %H:%M:%S"),
        tz_suffix,
    )

def main() -> int:
    parser = argparse.ArgumentParser(description="Summarize Codex CLI token usage for a date.")
    parser.add_argument("--date", type=_parse_date, help="Target date in YYYY-MM-DD.")
    args = parser.parse_args()

    target_date = args.date or dt.datetime.now().date()
    files = _iter_session_files(target_date)
    if not files:
        print("- 🤖 Codex CLI 消耗（自动统计）")
        print("  - ⏱️ 时间段: unknown–unknown (+0000)")
        print("  - 🧾 用量: 0 tokens")
        print("  - 🧠 Token: 输入 0 / 输出 0 / 缓存输入 0 / 推理 0")
        return 0

    usage = _collect_usage(files)
    tzinfo = dt.datetime.now().astimezone().tzinfo
    start, end, tz_suffix = _format_time_range(usage["min_ts"], usage["max_ts"], tzinfo)

    print("- 🤖 Codex CLI 消耗（自动统计）")
    print(f"  - ⏱️ 时间段: {start}–{end} ({tz_suffix})")
    print(f"  - 🧾 用量: {usage['total']} tokens")
    print(
        f"  - 🧠 Token: 输入 {usage['input']} / 输出 {usage['output']} / 缓存输入 {usage['cache']} / 推理 {usage['reasoning']}"
    )
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
