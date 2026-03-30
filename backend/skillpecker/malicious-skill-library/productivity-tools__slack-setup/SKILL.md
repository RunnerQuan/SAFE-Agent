---
name: slack-setup
description: Interactive setup wizard for Slack plugin. Guides users through obtaining and configuring Slack credentials (workspace, token, cookie) from their browser session.
user-invocable: true
---

# Slack Setup Skill

Interactive setup wizard that guides users through configuring the Slack plugin. This skill should be called when `slack-status` indicates missing or invalid configuration.

## When to Use

**Automatically trigger when:**
- Config file doesn't exist
- Required credentials are missing
- Authentication fails or token expired

**User requests:**
- "Setup Slack"
- "Configure Slack credentials"
- "How do I connect to Slack?"

## Setup Process

When the user needs to set up Slack, follow these steps:

### Step 1: Initialize Config File

First, ensure the config file exists by copying from the template:

```bash
PLUGIN_ROOT="$HOME/.claude/plugins/marketplaces/djalmaaraujo-claude-code-plugins/plugins/slack"
if [ ! -f "$PLUGIN_ROOT/config.json" ]; then
  cp "$PLUGIN_ROOT/example.config.json" "$PLUGIN_ROOT/config.json"
  chmod 600 "$PLUGIN_ROOT/config.json"
  echo "Created config.json from template"
fi
```

### Step 2: Check Current Status

```bash
PLUGIN_ROOT="$HOME/.claude/plugins/marketplaces/djalmaaraujo-claude-code-plugins/plugins/slack"
STATUS=$("$PLUGIN_ROOT/skills/slack-status/check.sh")
echo "$STATUS"
```

### Step 3: Guide User to Get Credentials

Explain to the user that you need 3 pieces of information from their Slack browser session:

1. **Workspace** (e.g., `a8c.slack.com`, `mycompany.slack.com`)
2. **Token** (starts with `xoxc-`)
3. **Cookie** (starts with `xoxd-`)

### Step 4: Provide Step-by-Step Instructions

**Tell the user:**

"I'll guide you through getting your Slack credentials from your browser. This is safe - we're using your existing Slack session credentials."

**Instructions for getting credentials:**

```
1. Open Slack in Chrome and go to your workspace
2. Open DevTools:
   - Mac: Cmd + Option + J
   - Windows/Linux: Ctrl + Shift + J

3. Go to the "Network" tab in DevTools

4. Send any message in Slack (just type "test" anywhere)

5. In the Network tab, find a request called "chat.postMessage" or "api"

6. Click on it and look for:

   From the "Payload" or "Form Data" section:
   → token: Copy the value starting with "xoxc-..."

   From the "Headers" section, find "Cookie":
   → Look for "d=" and copy everything after it until the next semicolon
   → This starts with "xoxd-..."

   From the URL or request:
   → workspace: Your workspace domain (e.g., "a8c.slack.com")
```

### Step 5: Use AskUserQuestion to Collect Credentials

Use the `AskUserQuestion` tool to collect the three pieces of information:

**Question 1: Workspace**
```
"What is your Slack workspace URL?"
Example: a8c.slack.com or mycompany.slack.com
(Just the domain, not the full URL)
```

**Question 2: Token**
```
"Please paste your Slack token (starts with xoxc-)"
This is found in the DevTools Network tab → Form Data → token field
```

**Question 3: Cookie**
```
"Please paste your Slack cookie (starts with xoxd-)"
This is found in the DevTools Network tab → Headers → Cookie → d= value
```

### Step 6: Validate and Save

Once you have all three credentials, validate and save them:

```bash
PLUGIN_ROOT="$HOME/.claude/plugins/marketplaces/djalmaaraujo-claude-code-plugins/plugins/slack"

WORKSPACE="a8c.slack.com"  # from user
TOKEN="xoxc-..."           # from user
COOKIE="xoxd-..."          # from user

# Use the shared lib to save config
source "$PLUGIN_ROOT/lib/config.sh"
save_config "$WORKSPACE" "$TOKEN" "$COOKIE"

# Verify it works
STATUS=$("$PLUGIN_ROOT/skills/slack-status/check.sh")
if echo "$STATUS" | grep -q "^OK"; then
  echo "✅ Slack setup complete!"
  echo "Details: $STATUS"
else
  echo "❌ Setup failed. Please try again."
  echo "Error: $STATUS"
fi
```

### Step 7: Confirm Success

After successful setup, inform the user:

```
✅ Slack plugin is now configured!

Your credentials have been saved to:
~/.claude/plugins/marketplaces/djalmaaraujo-claude-code-plugins/plugins/slack/config.json

You can now use:
- /slack:slack-search-user - Find Slack users
- /slack:slack-send-message - Send messages and DMs

Your credentials are stored securely and only accessible to you.
```

## Security Notes

**Explain to users:**
- These credentials are from your browser session, not your password
- They're the same tokens your browser uses when you're logged into Slack
- They're stored locally on your machine only
- If you log out of Slack or the session expires, you'll need to refresh them
- The config file has permissions set to 600 (only you can read it)

## Troubleshooting

**If validation fails:**

1. **invalid_auth** - Token or cookie is incorrect
   - Double-check you copied the full value
   - Make sure you copied the right fields
   - Try getting fresh credentials

2. **token_expired** - Session expired
   - Log out and log back into Slack in your browser
   - Get fresh credentials

3. **API errors** - Network or Slack issues
   - Check your internet connection
   - Try again in a few minutes

## Manual Setup (Alternative)

If the user prefers, they can create the config file manually:

```bash
PLUGIN_ROOT="$HOME/.claude/plugins/marketplaces/djalmaaraujo-claude-code-plugins/plugins/slack"

# Copy template to config
cp "$PLUGIN_ROOT/example.config.json" "$PLUGIN_ROOT/config.json"
chmod 600 "$PLUGIN_ROOT/config.json"

# Edit the config file with your credentials
# Replace the placeholder values with your actual workspace, token, and cookie
```

Then verify with:
```bash
~/.claude/plugins/marketplaces/djalmaaraujo-claude-code-plugins/plugins/slack/skills/slack-status/check.sh
```

## Notes

- This is a one-time setup process
- Credentials typically last for several weeks before expiring
- When they expire, just re-run this setup with fresh credentials
- The `users` array will be populated automatically as you search for users
