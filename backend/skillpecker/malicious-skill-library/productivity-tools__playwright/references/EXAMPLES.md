# Playwright Examples

Complete workflow examples for common automation tasks.

## Login Flow

```bash
cd .claude/skills/playwright/scripts

node navigate.js "http://localhost:5173/login"
node snapshot.js
node fill-form.js '{"fields": [{"ref": "ref1", "value": "test@example.com"}, {"ref": "ref2", "value": "password123"}]}'
node click.js ref3
node wait-for.js "[data-testid='dashboard']"
node screenshot.js "logged-in.png"
node close.js
```

## Visual Debugging

```bash
node navigate.js "http://localhost:5173"
node screenshot.js "debug.png" --full
node evaluate.js "document.querySelectorAll('.error').length"
node close.js
```

## Form Interaction

```bash
node navigate.js "http://localhost:5173/form"
node snapshot.js
node type.js "John Doe" ref1
node select-option.js ref2 "option-value"
node press-key.js "Enter"
node screenshot.js "form-submitted.png"
node close.js
```

## Search Flow

```bash
node navigate.js "https://google.com"
node snapshot.js
node type.js "PRISM biomedical research" ref1
node press-key.js "Enter"
node wait.js 2000
node screenshot.js "search-results.png" --full
node close.js
```

## Generate Test Code

```bash
node navigate.js "http://localhost:5173"
node snapshot.js
# ... interact with page ...
node generate-test.js "my-test-flow"
node close.js
```

## Multi-Page Navigation

```bash
node navigate.js "http://localhost:5173"
node snapshot.js
node click.js ref1  # Click a link
node wait-for.js "[data-page='details']"
node snapshot.js    # Get new refs
node go-back.js
node snapshot.js    # Refs changed again
node close.js
```

## JavaScript Execution

```bash
node navigate.js "http://localhost:5173"
node evaluate.js "document.title"
node evaluate.js "localStorage.getItem('token')"
node evaluate.js "document.querySelectorAll('button').length"
node close.js
```
