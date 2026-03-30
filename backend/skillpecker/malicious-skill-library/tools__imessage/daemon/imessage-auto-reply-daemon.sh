#!/bin/bash
#
# iMessage Auto Reply Daemon - Autonomous Agent Version
# Monitors for new messages from a specific contact and starts autonomous Claude Code sessions
# The agent can send multiple messages, check for new messages, and work autonomously
#
# Configuration via environment variables:
# - IMESSAGE_CONTACT_EMAIL: Email address of the contact to monitor (optional)
# - IMESSAGE_CONTACT_PHONE: Phone number of the contact to monitor (required)
# - IMESSAGE_CONTACT_NAME: Display name of the contact (required)
# - IMESSAGE_CHECK_INTERVAL: How often to check for new messages in seconds (default: 1)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TMP_DIR="${IMESSAGE_TMP_DIR:-$PROJECT_ROOT/tmp}"
PROCESSED_LOG="$TMP_DIR/processed_imessages.log"
CONVERSATION_ID_FILE="$TMP_DIR/imessage_claude_conversation_id.txt"
AGENT_PID_FILE="$TMP_DIR/imessage_agent.pid"
IMESSAGE_SKILL="$PROJECT_ROOT/.claude/skills/imessage"

# Configuration from environment variables
CONTACT_EMAIL="${IMESSAGE_CONTACT_EMAIL:-}"
CONTACT_PHONE="${IMESSAGE_CONTACT_PHONE:?Error: IMESSAGE_CONTACT_PHONE environment variable is required}"
CONTACT_NAME="${IMESSAGE_CONTACT_NAME:?Error: IMESSAGE_CONTACT_NAME environment variable is required}"
CHECK_INTERVAL="${IMESSAGE_CHECK_INTERVAL:-1}"

# Load environment variables if .env exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Create tmp directory if it doesn't exist
mkdir -p "$TMP_DIR"

# Create log file if it doesn't exist
touch "$PROCESSED_LOG"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Generate a unique ID for a message based on timestamp and text
generate_message_id() {
    local timestamp="$1"
    local text="$2"
    local sender="$3"
    echo -n "${sender}_${timestamp}_${text}" | md5
}

check_if_processed() {
    local message_id="$1"
    grep -q "^$message_id$" "$PROCESSED_LOG" 2>/dev/null
}

mark_as_processed() {
    local message_id="$1"
    echo "$message_id" >> "$PROCESSED_LOG"
}

is_monitored_chat() {
    local chat_name="$1"
    # Check if chat name contains contact identifiers
    if [ -n "$CONTACT_NAME" ] && echo "$chat_name" | grep -qi "$CONTACT_NAME"; then
        return 0
    elif [ -n "$CONTACT_PHONE" ] && echo "$chat_name" | grep -q "$CONTACT_PHONE"; then
        return 0
    elif [ -n "$CONTACT_EMAIL" ] && echo "$chat_name" | grep -q "$CONTACT_EMAIL"; then
        return 0
    fi
    return 1
}

is_group_chat() {
    local chat_identifier="$1"
    # Group chats start with "chat", 1-on-1 chats use phone numbers or email
    if [[ "$chat_identifier" =~ ^chat ]]; then
        return 0
    fi
    return 1
}

is_agent_running() {
    if [ -f "$AGENT_PID_FILE" ]; then
        local pid=$(cat "$AGENT_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            # PID file exists but process is dead, clean up
            rm "$AGENT_PID_FILE"
        fi
    fi
    return 1
}

start_autonomous_agent() {
    local initial_message="$1"
    local chat_identifier="$2"

    # Determine conversation type
    local conv_type="1-on-1"
    if is_group_chat "$chat_identifier"; then
        conv_type="group chat"
    fi

    log "Starting autonomous agent session ($conv_type)..."

    # Get recent conversation context
    local conversation=$("$IMESSAGE_SKILL/read-messages-db.sh" "$CONTACT_PHONE" --limit 10 2>&1)

    # Check if we have an existing conversation to resume
    local resume_flag=""
    if [ -f "$CONVERSATION_ID_FILE" ]; then
        local conv_id=$(cat "$CONVERSATION_ID_FILE")
        resume_flag="-r $conv_id"
        log "  Resuming conversation: $conv_id"
    else
        log "  Starting new conversation (will save ID for future resumes)"
    fi

    # Create autonomous agent prompt
    local agent_prompt="You are $CONTACT_NAME's personal iMessage assistant running in an autonomous agent session.

IMPORTANT CONTEXT:
- You are in a ${conv_type} conversation
- Chat identifier: ${chat_identifier}
- $CONTACT_NAME just sent: \"${initial_message}\"

AVAILABLE SKILLS:
1. send-imessage: Send messages to $CONTACT_NAME at any time
   - Usage: echo \"message\" | $IMESSAGE_SKILL/send-message.sh \"$CONTACT_PHONE\"
   - For group chats: echo \"message\" | $IMESSAGE_SKILL/send-to-chat.sh \"${chat_identifier}\"

2. check-new-imessages: Check if $CONTACT_NAME sent new messages
   - Usage: $IMESSAGE_SKILL/check-new-messages-db.sh \"$CONTACT_PHONE\"
   - Returns new messages from last hour, or empty if none

3. All other skills available in your Claude Code environment

RECENT CONVERSATION:
${conversation}

YOUR AUTONOMOUS AGENT WORKFLOW:

1. INITIAL ACKNOWLEDGMENT:
   - Send a quick confirmation that you received the message and are working on it
   - Only if the request requires work (don't confirm simple questions you can answer immediately)

2. UNDERSTAND THE REQUEST:
   - Look up relevant context using available skills
   - Determine what needs to be done

3. WORK AUTONOMOUSLY:
   - Break down the task into steps
   - Execute each step
   - Send progress updates for tasks taking >2-3 minutes
   - Check for new messages every 30-60 seconds during work
   - If $CONTACT_NAME sends new messages, read them and adjust your work accordingly

4. MONITOR FOR NEW MESSAGES:
   - Use check-new-imessages skill periodically to see if $CONTACT_NAME replied
   - If you see new messages:
     * Acknowledge them: \"Got your update!\"
     * Incorporate into your work
     * Adjust approach if needed

5. COMMUNICATE PROACTIVELY:
   - Ask clarifying questions if needed
   - Report errors or blockers immediately
   - Send updates for long-running tasks
   - Be conversational and helpful

6. COMPLETE THE TASK:
   - Send final summary when done
   - Include any relevant links, next steps, or information
   - The daemon will restart you when $CONTACT_NAME sends the next message

IMPORTANT GUIDELINES:
- Send MULTIPLE messages as you work (don't wait to send everything at once)
- Check for new messages EVERY 5 seconds during active work
- Be PROACTIVE in communication
- Work until the task is COMPLETE or you need more input from $CONTACT_NAME
- When done, simply exit (the daemon will restart you for the next message)

CONVERSATION CONTINUITY:
- This session maintains full conversation history via the -r flag
- You have context from all previous interactions
- $CONTACT_NAME doesn't need you to repeat things they already know

Remember: You're autonomous. Work independently, send multiple messages as you progress, check for replies, and complete tasks thoroughly. Don't just send one reply and stop - KEEP WORKING until the task is done."

    # Start the agent in the background
    (
        cd "$PROJECT_ROOT"
        claude $resume_flag --dangerously-skip-permissions -p "$agent_prompt" 2>&1 | tee -a "$TMP_DIR/imessage-agent.log"
    ) &

    # Save the agent PID
    echo $! > "$AGENT_PID_FILE"
    log "  Agent started with PID $(cat "$AGENT_PID_FILE")"
}

process_messages() {
    # Check for new messages from contact using database approach
    local messages_output=$("$IMESSAGE_SKILL/check-new-messages-db.sh" "$CONTACT_PHONE" 2>&1)

    # Check if there are any messages
    if [ -z "$messages_output" ]; then
        return
    fi

    # Check if an agent is already running
    if is_agent_running; then
        log "Agent is currently running (PID: $(cat "$AGENT_PID_FILE")), waiting for it to complete..."
        log "  (The running agent will check for new messages using check-new-imessages skill)"
        return
    fi

    # Parse messages output
    # Format is:
    # MSG_ID: <id>
    # ROWID: <rowid>
    # DATE: <date>
    # TEXT: <text>
    # FROM: <phone>
    # CHAT: <chat_identifier>
    # ---

    local message_id=""
    local rowid=""
    local date=""
    local text=""
    local chat_identifier=""

    while IFS= read -r line; do
        if [[ "$line" =~ ^MSG_ID:\ (.+)$ ]]; then
            message_id="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^ROWID:\ (.+)$ ]]; then
            rowid="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^DATE:\ (.+)$ ]]; then
            date="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^TEXT:\ (.+)$ ]]; then
            text="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^CHAT:\ (.+)$ ]]; then
            chat_identifier="${BASH_REMATCH[1]}"
        elif [[ "$line" == "---" ]] && [ -n "$message_id" ]; then
            # Check if already processed
            if check_if_processed "$message_id"; then
                log "  Message already processed, skipping: ${text:0:30}..."
            else
                # Mark as processed immediately (daemon won't process it again)
                mark_as_processed "$message_id"

                # Determine conversation type
                local conv_type="1-on-1"
                if is_group_chat "$chat_identifier"; then
                    conv_type="group chat"
                fi

                log "New message from $CONTACT_NAME ($conv_type):"
                log "  [$date] ${text:0:50}..."

                # Start autonomous agent session
                start_autonomous_agent "$text" "$chat_identifier"

                # Only process the first new message (agent will handle checking for more)
                return
            fi

            # Reset for next message
            message_id=""
            rowid=""
            date=""
            text=""
            chat_identifier=""
        fi
    done <<< "$messages_output"
}

# Main loop
log "iMessage Auto Reply Daemon (Autonomous Agent) started"
log "Monitoring for messages from $CONTACT_NAME"
log "  Phone: $CONTACT_PHONE"
if [ -n "$CONTACT_EMAIL" ]; then
    log "  Email: $CONTACT_EMAIL"
fi
log "Checking every $CHECK_INTERVAL second(s)..."
log "Processed messages log: $PROCESSED_LOG"
log "Conversation ID file: $CONVERSATION_ID_FILE"
if [ ! -f "$CONVERSATION_ID_FILE" ]; then
    log "⚠️  No conversation ID file found - will start fresh conversation"
    log "   After first message, save conversation ID to: $CONVERSATION_ID_FILE"
fi
log "Full log: $TMP_DIR/imessage-auto-reply.log"
log "Agent log: $TMP_DIR/imessage-agent.log"

while true; do
    process_messages 2>&1 | tee -a "$TMP_DIR/imessage-auto-reply.log"
    sleep "$CHECK_INTERVAL"
done
