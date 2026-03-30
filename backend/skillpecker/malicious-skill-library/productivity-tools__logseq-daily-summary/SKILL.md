---
name: logseq-daily-summary
description: Create and append a <=300 Chinese-character daily summary into LogSeq journals. Use when the user asks to summarize today’s LogSeq journal, analyze a specific day’s journal, or write a daily summary back into LogSeq.
---

# Logseq Daily Summary

## Overview
Summarize a LogSeq daily journal (today by default, or a specified log) and append a concise <=300 Chinese-character paragraph back into that day’s journal page.

## Workflow (LogSeq journal -> usage stats -> summary -> write back)

1) Determine the target journal page.
- If the user specifies a log/date/page name, use that.
- Otherwise use today’s date based on local time. Use `list_pages` (include journals) and find a page whose title starts with `YYYY-MM-DD`. LogSeq journal titles may be `YYYY-MM-DD DayName` (English), `YYYY-MM-DD 星期X` (Chinese), or just `YYYY-MM-DD`.
- If multiple pages match, prefer the one marked `[journal]`, then the one with the longest non-empty content (via `get_page_content`), then the English weekday variant.
- If no page matches the date, use `search` to confirm. If still missing, ask the user for the exact page name before creating a new page.

2) Read the journal content.
- Use `get_page_content` to fetch the page content.
- If the page does not exist, create it (via `create_page` or `update_page`) and note it was empty before summarizing.

3) Collect today's Codex CLI usage stats and append a usage block.
- Use the fixed script: `scripts/codex_usage_stats.py`.
- Example: `python3 /Users/wushitao/.codex/skills/logseq-daily-summary/scripts/codex_usage_stats.py --date YYYY-MM-DD`.
- The script reads `~/.codex/sessions/YYYY/MM/DD/*.jsonl`, aggregates the last `token_count.total_token_usage` per session file, and extracts the local time range for the day (min/max timestamps).
- Append the script output as its own LogSeq block before the summary block, using the exact format below (no leading "- "):
```
🤖 Codex CLI 消耗（自动统计）
  ⏱️ 时间段: YYYY-MM-DD HH:MM:SS–HH:MM:SS (+0800)
  🧾 用量: N tokens
  🧠 Token: 输入 A / 输出 B / 缓存输入 C / 推理 D
```

4) Write the summary.
- Produce a single paragraph in Chinese, 300 characters or fewer (do not count the usage block).
- Focus on “what I was thinking about / investigating today,” derived from the journal content.
- Avoid lists in the summary paragraph; keep it clean and readable.

5) Append to the same journal page.
- Use `update_page` to append the usage block (if not already present), then use a second `update_page` call to append the summary block `今日总结: ...` (no leading "- ").
- Ensure the usage block and summary block are separate top-level blocks and never nested, and do not prefix lines with "- ".
- Do not overwrite existing content.

## Output rules
- Summary length: <=300 Chinese characters (usage block not counted).
- One paragraph only.
- Keep it faithful to the journal content; no fabrication.
- Always include the Codex CLI usage block in the required format (from the fixed script).
- Usage block and summary block must be separate top-level blocks.

## Tools
Use MCP LogSeq tools:
- `search` or `list_pages` to locate the journal page
- `get_page_content` to read
- `update_page` to append the summary
- `create_page` only if necessary
