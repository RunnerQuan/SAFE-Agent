# ElevenLabs MCP Server Setup

Complete guide for configuring the official ElevenLabs MCP server to enable audio generation directly from Claude.

## Prerequisites

1. **ElevenLabs API Key**: Get from [elevenlabs.io](https://elevenlabs.io) (free tier: 10K credits/month)
2. **uv Package Manager**: Python package manager for running the MCP server

### Install uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or via pip
pip install uv
```

## Claude Desktop Configuration

### macOS/Linux

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `~/.config/Claude/claude_desktop_config.json` (Linux):

```json
{
  "mcpServers": {
    "ElevenLabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Windows

1. Enable **Developer Mode** in Claude Desktop: Settings > Developer > Enable Developer Mode
2. Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ElevenLabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Note**: If you get "spawn uvx ENOENT" error, use the absolute path to uvx:
```json
"command": "C:\\Users\\YourName\\.local\\bin\\uvx.exe"
```

## Claude Code Configuration

For Claude Code CLI, add to your MCP settings file or project configuration:

```json
{
  "mcpServers": {
    "ElevenLabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Configuration Options

### Output Modes

Set `ELEVENLABS_MCP_OUTPUT_MODE` environment variable:

| Mode | Behavior |
|------|----------|
| `files` (default) | Save to disk, return file paths |
| `resources` | Return base64-encoded content in response |
| `both` | Save to disk AND return as resources |

Example with output mode:
```json
{
  "mcpServers": {
    "ElevenLabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "your-api-key-here",
        "ELEVENLABS_MCP_OUTPUT_MODE": "files",
        "ELEVENLABS_MCP_BASE_PATH": "/path/to/audio/output"
      }
    }
  }
}
```

### Additional Environment Variables

| Variable | Purpose |
|----------|---------|
| `ELEVENLABS_MCP_BASE_PATH` | Base directory for file output |
| `ELEVENLABS_API_RESIDENCY` | Data residency region (enterprise only, default: "us") |

## Verification

After configuration, restart Claude and verify the MCP server is connected:

1. Look for ElevenLabs tools in the available tools list
2. Try a simple command: "List available ElevenLabs voices"
3. Test text-to-speech: "Generate speech saying 'Hello, this is a test'"

## Troubleshooting

### Log Locations

- **macOS**: `~/Library/Logs/Claude/mcp-server-elevenlabs.log`
- **Windows**: `%APPDATA%\Claude\logs\mcp-server-elevenlabs.log`
- **Linux**: `~/.local/share/Claude/logs/mcp-server-elevenlabs.log`

### Common Issues

| Problem | Solution |
|---------|----------|
| "spawn uvx ENOENT" | Use absolute path to uvx executable |
| Server not appearing | Restart Claude after config changes |
| API errors | Verify API key is valid and has credits |
| Timeout errors | Normal for large operations; reduce content size |
| Permission denied | Check file path permissions for output directory |

### Manual Testing

Test the MCP server directly:

```bash
# Install and run manually
pip install elevenlabs-mcp
python -m elevenlabs_mcp --api-key=YOUR_KEY --print
```

## Alternative Installation (From Source)

For development or custom modifications:

```bash
git clone https://github.com/elevenlabs/elevenlabs-mcp
cd elevenlabs-mcp
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your API key
./scripts/test.sh
```

## Security Notes

- Store API keys securely; never commit to version control
- Use environment variables or secrets management in production
- The MCP server runs locally and forwards requests to ElevenLabs cloud APIs
- All audio processing happens on ElevenLabs servers

## Resources

- [ElevenLabs MCP GitHub](https://github.com/elevenlabs/elevenlabs-mcp)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs/overview/intro)
- [Get API Key](https://elevenlabs.io/app/settings/api-keys)
