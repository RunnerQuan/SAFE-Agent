---
name: github-copilot
description: Consult other AI models via GitHub Copilot CLI for second opinions, thorough analysis, or alternative perspectives. Supports Gemini 3 Pro Preview (gemini), Claude Opus 4.5 (opus), Claude Sonnet 4.5 (sonnet) and GPT-5.1-Codex-Max (codex). Use when user explicitly requests, when needing detailed analysis, when requiring additional help with an especially complex task, or when seeking alternative model perspectives.
---

# GitHub Copilot CLI Integration

Invoke other AI models via GitHub Copilot CLI to obtain alternative perspectives and analysis. This skill acts as a transparent conduit: it passes context and prompts to the specified model via copilot CLI, then inserts the verbatim response into the conversation.

## Core Function

This skill does NOT perform analysis itself. It:

1. Formats relevant context and the user's request into a prompt
2. Invokes `copilot` CLI with the specified model
3. Captures the complete response
4. Returns the response verbatim for integration into the conversation

## Available Models

- **gemini-3-pro-preview** (default) - Shortcuts: "gemini"
- **gpt-5.1-codex-max** - Shortcuts: "codex"
- **claude-opus-4.5** - Shortcuts: "opus"
- **claude-sonnet-4.5** - Shortcuts: "sonnet"

Default to `gemini-3-pro-preview` unless user specifies otherwise.

Note: Copilot may take longer to respond. Use appropriate timeout values (up to 23 minutes is acceptable).

## Model Selection

- **Default**: Always use `gemini-3-pro-preview`
- **User specifies a model**: Map shortcuts to full model names (gemini → gemini-3-pro-preview, codex → gpt-5.1-codex-max, opus → claude-opus-4.5, sonnet → claude-sonnet-4.5)

## Command Invocation

Execute copilot in the current working directory using this pattern:

```bash
copilot --model MODEL_NAME --allow-all-paths --allow-all-tools --log-level none -p "PROMPT_TEXT" 2>/dev/null
```

Required flags:

- `--allow-all-paths` - Allow access to all paths
- `--allow-all-tools` - Allow all tool usage
- `--log-level none` - Suppress log output

The command runs in the current working directory, providing copilot with the same context as Claude.

## Prompt Construction

Construct prompts that provide:

1. **Sufficient context** - Include relevant conversation history, code snippets, or file contents
2. **Clear request** - State what analysis or output is needed
3. **Specific details** - Include constraints, requirements, or preferences

Keep prompts focused and relevant. Include only necessary context.

## Response Handling

1. Execute the copilot command
2. Capture the complete output
3. Return the response in **EXACTLY** this format with no additions or modifications:

```md
---
copilot-model: $MODEL
prompt: $PROMPT
---

$RESPONSE
```

Where:

- `$MODEL` = the actual model name used (e.g., "gemini-3-pro-preview")
- `$PROMPT` = the exact prompt sent to copilot
- `$RESPONSE` = the complete verbatim output from copilot

**CRITICAL**: Do not add any text before or after this code block. Do not editorialize, summarise, or modify the response in any way.

## Example Usage Patterns

### User requests alternative perspective

User: "Can you get a second opinion on this approach?"
→ Invoke copilot with gemini-3-pro-preview, including relevant context

### User requests specific model

User: "What does GPT-5.1 think about this code?"
→ Invoke copilot with gpt-5.1, including the code and question

### Thorough analysis needed

Task requires detailed investigation
→ Consider invoking gemini-3-pro-preview for comprehensive analysis

## Output Format Example

```md
---
copilot-model: gemini-3-pro-preview
prompt: Explain shallow vs deep copy in Python
---

A shallow copy creates a new object but references the same nested objects...
[complete response]
```

## Important Notes

- This skill is a conduit, not an analyst
- Do not interpret, summarise, or modify responses
- Include sufficient context in prompts for meaningful responses
- The response quality depends entirely on the prompt quality
