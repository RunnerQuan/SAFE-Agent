# Playwright Troubleshooting

## Browser Issues

### Browser won't launch
```bash
cd .claude/skills/playwright/scripts
npm run install-browsers
```

### Scripts hanging
Browser opens in non-headless mode. Check for popups/dialogs blocking execution.

## Ref Issues

### "Ref not found" error
Run `snapshot.js` again. Refs expire after:
- Page navigation
- DOM changes
- Form submissions

### Refs don't match expected elements
The accessibility tree may differ from visual layout. Use `snapshot.js` output to find correct refs.

## State Issues

### Clear all state
```bash
node close.js
```

Or manually delete:
```bash
rm .claude/skills/playwright/scripts/.browser-state.json
rm .claude/skills/playwright/scripts/.element-refs.json
rm .claude/skills/playwright/scripts/.storage-state.json
```

### Browser closed unexpectedly
State files may be stale. Run `close.js` then start fresh.

## Output Issues

### JSON parse errors
Scripts output JSON. Ensure you're not mixing output streams.

### Screenshots not saving
Check write permissions and that path exists. Screenshots save to project root by default.

## Keyboard Keys Reference

Common keys for `press-key.js`:
- Navigation: `Enter`, `Tab`, `Escape`
- Editing: `Backspace`, `Delete`
- Arrows: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
- Page: `Home`, `End`, `PageUp`, `PageDown`
- Combos: `Control+a`, `Control+c`, `Control+v`
