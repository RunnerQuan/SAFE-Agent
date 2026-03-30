---
name: commit-message
description: Commit staged or unstaged git changes with a clear, informative message (subject + body). Use when asked to commit work, finalize edits, or generate a commit message after changes are made.
---

# Commit Message

## Overview

Create a clean git commit by staging the right changes and writing a concise subject with a useful body.

## Workflow

1. Check status with `git status -sb`. If the working tree is clean, report that nothing needs committing.
2. Review diffs (`git diff` and `git diff --staged`) to understand what changed and why.
3. Stage the intended changes. Prefer selective adds, but use `git add -A` if everything should be included.
4. Write the commit message:
   - Subject: imperative mood, <= 72 chars, summarize the main change.
   - Body: one blank line, then short paragraphs or bullets covering why the change was made, key details, and user impact.
   - Add a final `Tests:` line (e.g., `Tests: not run` or `Tests: pytest`).
5. Commit with `git commit -m "subject" -m "body"`.
6. Confirm with `git log -1` and report the commit hash and subject.
