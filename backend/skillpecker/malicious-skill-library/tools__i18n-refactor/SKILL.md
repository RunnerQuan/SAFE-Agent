---
name: i18n-refactor
description: Automated workflow to refactor Angular components for i18n with namespaced JSON. It extracts strings, updates HTML/TS files, injects TranslateService, and generates nested en/tc translation objects.
version: 1.1.0
---

# Angular i18n Refactoring Skill (Namespaced)

Use this skill to systematically refactor Angular components for internationalization (ngx-translate) using a **nested JSON structure (Namespaces)**.

## workflow

### 1. Scan and Extract

- Analyze the user-selected HTML file.
- Determine the **Namespace** based on the component name (e.g., `UserProfileComponent` -> `USER_PROFILE`).
- Identify all hardcoded text nodes and static attributes (specifically `placeholder`, `title`, `alt`, `aria-label`).
- Generate keys nested under the namespace in `UPPER_SNAKE_CASE` (e.g., Namespace: `USER_PROFILE`, Key: `SUBMIT_BTN`).

### 2. Template Refactoring (HTML)

- Replace text content with the pipe syntax using dot notation: `{{ 'NAMESPACE.KEY' | translate }}`.
  - _Example_: `{{ 'USER_PROFILE.SUBMIT_BTN' | translate }}`
- Replace attributes with bound syntax: `[placeholder]="'NAMESPACE.KEY' | translate"`.

### 3. Component Dependency Injection (TS)

- Locate the corresponding `.ts` file.
- **Check Imports**: Ensure `import { TranslateService } from '@ngx-translate/core';` exists.
- **Check Injection**: Verify if `TranslateService` is injected.
  - If missing, add: `private translate = inject(TranslateService);` (Use constructor injection for older Angular versions).

### 4. Translation Generation (JSON)

- Locate `src/assets/i18n/en.json` and `src/assets/i18n/tc.json`.
- **Structure**: Create or update the JSON with **nested objects**, not flat keys.
  Example Structure:
  "USER_PROFILE": {
  "SUBMIT_BTN": "Submit",
  "CANCEL_BTN": "Cancel"
  }
- **English (en.json)**: Add the nested keys with original text.
- **Traditional Chinese (tc.json)**: Auto-translate text to Traditional Chinese (Hong Kong style, zh-HK) and maintain the same nested structure.

### 5. Final Reporting

- Output a markdown table summary of the changes:

| Key ID                    | English (en.json) | Chinese (tc.json) |
| :------------------------ | :---------------- | :---------------- |
| `USER_PROFILE.SUBMIT_BTN` | "Submit"          | "提交"            |

## Guidelines

- **Strictly maintain JSON nesting**. Do not create keys like `"USER_PROFILE.SUBMIT_BTN": "..."`. It must be `"USER_PROFILE": { "SUBMIT_BTN": "..." }`.
- Prioritize "Hong Kong" terminology for `tc.json` (e.g., use "登入" for Login, not "登錄").
- If the translation files are not in context, ask the user for their location.
