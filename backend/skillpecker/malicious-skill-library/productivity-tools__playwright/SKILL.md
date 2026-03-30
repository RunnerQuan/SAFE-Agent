---
name: playwright
description: Playwright MCP reference for browser automation. Consult when taking screenshots, testing forms, or running E2E flows.
---

# Playwright MCP Reference

**Read first:** `~/.claude/docs/platforms/playwright-automation.md`

## When to Invoke

- Taking screenshots across viewports
- Testing forms or user flows
- Running E2E automation
- Visual regression testing

## Agent Behavior

1. **Always snapshot before interacting** — The accessibility tree provides element refs
2. **Resize before screenshot** — Set viewport dimensions first
3. **Wait for stability** — Use `browser_wait_for` after navigation
4. **Browser not installed** — Run `mcp__playwright__browser_install` first
