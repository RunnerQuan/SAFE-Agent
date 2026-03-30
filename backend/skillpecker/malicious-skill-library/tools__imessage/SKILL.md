---
name: imessage
description: Interact with Messages app - read conversations, send messages, and check for new messages using AppleScript and SQLite database access
---

# iMessage Management Skill

This skill provides comprehensive Messages app interaction capabilities through command-line tools.

## Available Tools

All tools are located in `.claude/skills/imessage/` and use either AppleScript or direct SQLite database access to interact with the Messages app.

### Database vs AppleScript Approach

- **Database tools** (`*-db.sh`): Read messages directly from the Messages SQLite database (`~/Library/Messages/chat.db`). More reliable and faster, supports full message history including sent messages with proper text extraction.
- **AppleScript tools** (original): Use AppleScript automation. Sending works reliably, but reading messages may have permission issues on some macOS systems.

**Recommended**: Use database tools for reading (`read-messages-db.sh`, `check-new-messages-db.sh`) and AppleScript for sending (`send-message.sh`, `send-to-chat.sh`).

### 1. Read Messages from Database (`read-messages-db.sh`) ⭐ RECOMMENDED

Read messages directly from the Messages SQLite database. This is the most reliable method for reading message history.

**Usage:**
```bash
# Read recent messages by phone number
.claude/skills/imessage/read-messages-db.sh "1234567890" --limit 10

# Read recent messages (all conversations)
.claude/skills/imessage/read-messages-db.sh --limit 20
```

**Features:**
- Reads both incoming and outgoing messages
- Extracts text from outgoing messages (stored in attributedBody)
- Fast and reliable
- Shows formatted timestamps
- No permission issues

### 2. Check New Messages from Database (`check-new-messages-db.sh`) ⭐ RECOMMENDED

Check for recent incoming messages from the database. Used by the iMessage auto-reply daemon.

**Usage:**
```bash
# Check recent messages from specific number
.claude/skills/imessage/check-new-messages-db.sh "1234567890"

# Check all recent incoming messages
.claude/skills/imessage/check-new-messages-db.sh
```

**Output Format:**
```
MSG_ID: <unique_hash>
ROWID: <message_id>
DATE: <readable_timestamp>
TEXT: <message_text>
FROM: <phone_number>
CHAT: <chat_identifier>
---
```

### 3. Send Message (`send-message.sh`) ⭐ RECOMMENDED

Send a message to a contact or phone number via AppleScript.

**Usage:**
```bash
# Send to contact name
.claude/skills/imessage/send-message.sh "John Doe" "Hey, how are you?"

# Send to phone number
.claude/skills/imessage/send-message.sh "+1234567890" "Message text here"

# Send with content from stdin
echo "Message content" | .claude/skills/imessage/send-message.sh "John Doe"
```

### 4. Send to Chat (`send-to-chat.sh`)

Send a message to a specific chat by chat identifier (useful for group chats).

**Usage:**
```bash
# Send to group chat
echo "Message text" | .claude/skills/imessage/send-to-chat.sh "chat123456789"

# Send directly
.claude/skills/imessage/send-to-chat.sh "chat123456789" "Message text"
```

### 5. Send File (`send-file.sh`)

Send images, documents, or other files via iMessage using AppleScript.

**Usage:**
```bash
# Send file to phone number
.claude/skills/imessage/send-file.sh "+1234567890" "/path/to/file.jpg"

# Send file to contact name
.claude/skills/imessage/send-file.sh "John Doe" "/Users/user/Desktop/image.png"
```

**Supported file types:**
- Images: JPG, PNG, HEIC, GIF
- Documents: PDF, DOCX, TXT
- Videos: MP4, MOV
- Any file type supported by iMessage

### 6. List Conversations (`list-conversations.sh`)

List recent conversations with contact names and message counts.

**Usage:**
```bash
# List all conversations
.claude/skills/imessage/list-conversations.sh

# List first N conversations
.claude/skills/imessage/list-conversations.sh --limit 10
```

### 7. Get Message Attachments (`get-message-attachments.sh`)

Retrieve and process attachments from received messages.

**Usage:**
```bash
# Get attachments from a specific message (use ROWID from check-new-messages-db.sh)
.claude/skills/imessage/get-message-attachments.sh <message_rowid>
```

**Output format:**
```
IMAGE|/path/to/output.jpg|image/jpeg|original.jpg|1024x768|125K
FILE|/path/to/file.pdf|application/pdf|document.pdf||2.3M
```

**Features:**
- Automatically converts HEIC images to JPEG
- Downscales large images to 1024px max dimension
- Saves processed images to `~/tmp/`
- Preserves original files for non-image attachments

## Workflow Guidelines

### When building iMessage automation:

1. **Reading Messages** (Database Approach - Recommended)
   - Use `read-messages-db.sh` with phone number to see conversation history
   - Displays both incoming and outgoing messages with proper text
   - Shows clear timestamps and message direction

2. **Sending Messages**
   - Verify the contact name or phone number format
   - Use `send-message.sh` for direct messages
   - Use `send-to-chat.sh` for group chats
   - Confirm the message was sent successfully

3. **Checking New Messages** (Database Approach - Recommended)
   - Use `check-new-messages-db.sh` to check for recent incoming messages
   - Filter by phone number for specific contacts
   - Parse output to track which messages have been processed
   - Used by the iMessage auto-reply daemon

4. **For Automated Daemons**
   - Use `check-new-messages-db.sh` to poll for new messages
   - Track processed messages using message IDs
   - Use `read-messages-db.sh` to get conversation context
   - Use `send-message.sh` or `send-to-chat.sh` to send replies

## Best Practices

- **Contact Names**: Use exact contact names as they appear in Messages
- **Phone Numbers**: Use full format with country code (e.g., +1234567890)
- **Message Privacy**: Be mindful of sensitive information in messages
- **User Confirmation**: Always confirm before sending messages
- **Error Handling**: Check for errors and inform the user
- **Quoting**: Always properly quote contact names and message content in bash commands

## Important Notes

- All scripts require macOS with the Messages app
- Messages app must be signed in to iMessage or SMS
- AppleScript support is built into macOS
- The Messages app does not need to be open for these tools to work
- Some operations may require Full Disk Access permission in System Preferences

## Troubleshooting

- If contacts aren't found, try using their phone number instead
- Check that Messages has proper permissions in System Preferences > Security & Privacy
- Ensure you're signed in to iMessage in the Messages app
- If sending fails, verify the recipient's contact information
