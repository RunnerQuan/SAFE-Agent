# iMessage Auto-Reply Daemon

Autonomous agent daemon that monitors iMessages and automatically responds using Claude Code.

## Overview

This daemon monitors incoming iMessages from a specific contact and automatically starts autonomous Claude Code agent sessions to handle requests. The agent can:

- Send multiple messages as it works
- Check for follow-up messages every 30-60 seconds
- Use all available Claude Code skills and tools
- Maintain conversation continuity across sessions
- Work on complex multi-step tasks autonomously

## Requirements

- macOS with Messages app signed in to iMessage
- Claude Code installed and in PATH
- Full Disk Access permission for Terminal
- Environment variables configured (see Configuration below)

## Quick Start

### 1. Configure

Create a configuration file:

```bash
# Copy the example
cp ../examples/.env.example ~/.claude-imessage.env

# Edit with your details
nano ~/.claude-imessage.env
```

Required variables:
- `IMESSAGE_CONTACT_PHONE` - Phone number to monitor (e.g., "4155551234")
- `IMESSAGE_CONTACT_NAME` - Display name (e.g., "John Doe")

### 2. Run

```bash
# Load configuration
source ~/.claude-imessage.env

# Start daemon in background
nohup ./imessage-auto-reply-daemon.sh > /dev/null 2>&1 &

# Or run in foreground for testing
./imessage-auto-reply-daemon.sh
```

### 3. Monitor

```bash
# Check if running
ps aux | grep imessage-auto-reply-daemon

# View logs
tail -f ~/tmp/imessage/imessage-auto-reply.log
tail -f ~/tmp/imessage/imessage-agent.log

# Stop daemon
pkill -f imessage-auto-reply-daemon
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `IMESSAGE_CONTACT_PHONE` | **Yes** | - | Phone number to monitor (digits only) |
| `IMESSAGE_CONTACT_NAME` | **Yes** | - | Display name of contact |
| `IMESSAGE_CONTACT_EMAIL` | No | - | Email if they use iMessage email |
| `IMESSAGE_CHECK_INTERVAL` | No | 1 | Check interval in seconds |
| `IMESSAGE_TMP_DIR` | No | `./tmp` | Directory for logs and state files |

### Configuration File

Recommended setup:

```bash
# ~/.claude-imessage.env
export IMESSAGE_CONTACT_PHONE="4155551234"
export IMESSAGE_CONTACT_NAME="Alice Smith"
export IMESSAGE_CHECK_INTERVAL="1"
export IMESSAGE_TMP_DIR="$HOME/tmp/imessage"
```

Load before starting daemon:

```bash
source ~/.claude-imessage.env
./daemon/imessage-auto-reply-daemon.sh
```

## How It Works

### Message Detection

1. **Polls database**: Checks `~/Library/Messages/chat.db` every N seconds
2. **Filters by contact**: Only processes messages from configured phone/email
3. **Tracks processed**: Uses MD5 hash to avoid re-processing messages
4. **Detects both**: Handles 1-on-1 and group chat messages

### Agent Lifecycle

When a new message arrives:

1. **Check for running agent**: If already running, skip (agent will check for new messages)
2. **Load context**: Get last 10 messages for conversation history
3. **Resume or start**: Resume existing conversation ID or start new one
4. **Launch agent**: Start Claude Code with autonomous agent prompt
5. **Track PID**: Save process ID to prevent duplicate agents

### Autonomous Operation

The agent runs autonomously:

- **Sends acknowledgment**: Quick "working on it" message if needed
- **Works independently**: Breaks down tasks, executes steps
- **Checks for updates**: Polls for new messages every 30-60 seconds
- **Sends progress**: Updates user during long-running tasks
- **Completes fully**: Works until done or needs more input

### Conversation Continuity

- **First message**: Creates new conversation, logs conversation ID
- **Subsequent messages**: Resumes same conversation using `-r` flag
- **Full history**: All previous context available in each session
- **Persistent ID**: Save conversation ID to file for daemon restart persistence

## File Structure

```
~/tmp/imessage/
├── processed_imessages.log           # Processed message IDs
├── imessage_claude_conversation_id.txt  # Conversation ID for resume
├── imessage_agent.pid                # Current agent PID
├── imessage-auto-reply.log          # Daemon activity log
└── imessage-agent.log               # Agent session output
```

## Customization

### Agent Prompt

The agent's behavior is defined by the `agent_prompt` variable in the daemon script. You can customize:

- **Tone and style**: How Claude communicates
- **Available tools**: Which skills to mention
- **Task approach**: How to handle requests
- **Update frequency**: How often to send progress messages
- **Error handling**: What to do when stuck

Edit the `start_autonomous_agent()` function in `imessage-auto-reply-daemon.sh`.

### Monitoring Frequency

Adjust `IMESSAGE_CHECK_INTERVAL` to change how often the daemon checks for messages:

```bash
# Check every 5 seconds (less resource intensive)
export IMESSAGE_CHECK_INTERVAL="5"

# Check every second (most responsive)
export IMESSAGE_CHECK_INTERVAL="1"
```

### Multiple Contacts

Run multiple daemon instances with different configurations:

```bash
# Terminal 1 - Monitor Alice
export IMESSAGE_CONTACT_PHONE="4155551234"
export IMESSAGE_CONTACT_NAME="Alice"
export IMESSAGE_TMP_DIR="$HOME/tmp/imessage-alice"
./imessage-auto-reply-daemon.sh &

# Terminal 2 - Monitor Bob
export IMESSAGE_CONTACT_PHONE="4155555678"
export IMESSAGE_CONTACT_NAME="Bob"
export IMESSAGE_TMP_DIR="$HOME/tmp/imessage-bob"
./imessage-auto-reply-daemon.sh &
```

## Troubleshooting

### Daemon Not Starting

```bash
# Check environment variables
echo $IMESSAGE_CONTACT_PHONE
echo $IMESSAGE_CONTACT_NAME

# Verify Claude Code is available
which claude

# Test database access
ls -la ~/Library/Messages/chat.db
```

### No Messages Detected

```bash
# Test message detection manually
../skills/imessage/check-new-messages-db.sh "$IMESSAGE_CONTACT_PHONE"

# Check if messages exist
../skills/imessage/read-messages-db.sh "$IMESSAGE_CONTACT_PHONE" --limit 5

# Verify phone number format (digits only)
echo $IMESSAGE_CONTACT_PHONE
```

### Agent Not Responding

```bash
# Check agent logs
tail -50 ~/tmp/imessage/imessage-agent.log

# Check if agent is running
cat ~/tmp/imessage/imessage_agent.pid
ps -p $(cat ~/tmp/imessage/imessage_agent.pid)

# Kill stuck agent
pkill -f "claude.*imessage"
```

### Permission Errors

Grant Full Disk Access to Terminal:
1. System Preferences > Security & Privacy
2. Privacy tab > Full Disk Access
3. Add Terminal.app (click +, navigate to /Applications/Utilities/Terminal.app)
4. Restart Terminal

### Logs

Check logs for detailed information:

```bash
# Daemon activity (message detection, agent starts)
tail -f ~/tmp/imessage/imessage-auto-reply.log

# Agent output (Claude's work, tool calls)
tail -f ~/tmp/imessage/imessage-agent.log

# Processed messages (IDs of handled messages)
tail ~/tmp/imessage/processed_imessages.log

# Conversation ID (for resume)
cat ~/tmp/imessage/imessage_claude_conversation_id.txt
```

## Best Practices

### For Production Use

1. **Test first**: Run in foreground to verify behavior
2. **Monitor logs**: Watch for errors or unexpected behavior
3. **Set reasonable intervals**: 1-5 seconds is usually sufficient
4. **Use conversation resume**: Save conversation ID for continuity
5. **Review agent prompt**: Customize tone and capabilities
6. **Limit to trusted contacts**: Only monitor people you trust

### For Development

1. **Use test contact**: Create a test contact for development
2. **Watch logs in real-time**: `tail -f` both log files
3. **Clear processed log**: Delete to re-process messages
4. **Test edge cases**: Group chats, attachments, long messages
5. **Iterate on prompt**: Adjust agent behavior based on results

## Security Notes

- Daemon has full read access to iMessage database
- Agent can send messages on your behalf
- Logs may contain sensitive message content
- Environment variables contain contact information
- Only run in trusted environments
- Consider privacy implications for monitored contacts

## Integration with Claude Code

The agent has access to all Claude Code capabilities:

- **Skills**: Any skills installed in Claude Code
- **Tools**: File operations, git, bash commands
- **MCP Servers**: External tool integrations
- **Resources**: Project files, documentation
- **Hooks**: Custom automation triggers

Make sure desired skills are available before starting the daemon.

## Performance

- **CPU**: Minimal when idle (~0.1%)
- **Memory**: ~50MB for daemon, varies for agent sessions
- **Disk**: Logs grow over time, rotate periodically
- **Network**: Only when Claude API is called
- **Battery**: Negligible impact on laptops

## Limitations

- macOS only (requires Messages app)
- Single contact monitoring per daemon instance
- 1-second minimum check interval
- No support for read receipts or typing indicators
- Group chat detection is basic (by chat identifier format)

## Advanced Features

### Conversation Resume Persistence

To maintain conversation across daemon restarts:

```bash
# After first message, save conversation ID
echo "conv_abc123" > ~/tmp/imessage/imessage_claude_conversation_id.txt

# Daemon will automatically resume this conversation
# Even after restart, full history is maintained
```

### Custom Agent Capabilities

Modify the agent prompt to add custom capabilities:

```bash
# Example: Add calendar integration
agent_prompt="...
ADDITIONAL CAPABILITIES:
- Check your calendar using the calendar skill
- Create reminders and tasks
- Send emails via gmail skill
..."
```

### Daemon Management Script

Create a simple management script:

```bash
#!/bin/bash
# ~/bin/imessage-daemon

case "$1" in
  start)
    source ~/.claude-imessage.env
    nohup ~/Developer/claude-imessage/daemon/imessage-auto-reply-daemon.sh &
    ;;
  stop)
    pkill -f imessage-auto-reply-daemon
    ;;
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
  logs)
    tail -f ~/tmp/imessage/*.log
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs}"
    exit 1
    ;;
esac
```

## Support

- Main documentation: [../README.md](../README.md)
- Skill documentation: [../skills/imessage/SKILL.md](../skills/imessage/SKILL.md)
- GitHub Issues: https://github.com/dvdsgl/claude-imessage/issues
- Claude Code Docs: https://code.claude.com/docs
