# Tasks Skill Installation

## Ruby Requirements

This skill requires Ruby 3.0 or later due to Google API gem dependencies.

### Check Your Ruby Version

```bash
ruby --version
```

If you see `ruby 2.x.x`, you need to upgrade or use rbenv to switch versions.

### Option 1: Using rbenv (Recommended)

If you have rbenv installed with Ruby 3.x available:

```bash
# Check available versions
rbenv versions

# If you have Ruby 3.x (e.g., 3.3.7), create a wrapper
# The tasks_manager.rb script will automatically use the correct Ruby version
```

### Option 2: System Ruby Upgrade

If you don't have rbenv or prefer system Ruby:

```bash
# macOS with Homebrew
brew install ruby

# Add to PATH in ~/.zshrc or ~/.bashrc:
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
```

## Required Gems

Install the required Google API gems:

```bash
# For Ruby 3.x
gem install google-apis-tasks_v1 googleauth --user-install

# Or if using rbenv
RBENV_VERSION=3.3.7 gem install google-apis-tasks_v1 googleauth --user-install
```

## Authentication Setup

The tasks skill shares authentication with other Google skills (email, calendar, drive, sheets, contacts):

1. **Credentials file**: `~/.claude/.google/client_secret.json`
2. **Token file**: `~/.claude/.google/token.json`

### Adding Tasks Scope to Existing Token

If you already have other Google skills set up but get authorization errors with tasks, you need to re-authorize with the tasks scope included.

**Important**: Delete the existing token to trigger re-authorization with all scopes:

```bash
# Remove existing token
rm ~/.claude/.google/token.json

# Run any Google skill operation to trigger re-authorization
# The script will request authorization for all scopes including tasks
~/.claude/skills/tasks/scripts/tasks_manager.rb --operation list_tasklists
```

The authorization URL will include all required scopes:
- `https://www.googleapis.com/auth/tasks` (Tasks)
- `https://www.googleapis.com/auth/drive` (Drive)
- `https://www.googleapis.com/auth/calendar` (Calendar)
- `https://www.googleapis.com/auth/contacts` (Contacts)
- `https://www.googleapis.com/auth/gmail.modify` (Gmail)

### First-Time Google Cloud Console Setup

If you don't have `client_secret.json` yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google Tasks API
   - (Also enable Calendar, Drive, Gmail, People APIs if using those skills)
4. Create OAuth 2.0 credentials:
   - Application type: Desktop app
   - Download credentials JSON
5. Save as `~/.claude/.google/client_secret.json`

### Authorization Flow

First time running any tasks operation (or after deleting token):

```bash
~/.claude/skills/tasks/scripts/tasks_manager.rb --operation list_tasklists
```

1. Script will display authorization URL
2. Visit URL in browser
3. Authorize the application (grant access to all requested scopes)
4. Copy authorization code from the page
5. Paste code into terminal when prompted
6. Token saved to `~/.claude/.google/token.json`

Future operations will use the saved token automatically.

## Testing Installation

### Test 1: Help Command

```bash
cd ~/.claude/skills/tasks
scripts/tasks_manager.rb --help
```

Should display usage information without errors.

### Test 2: List Task Lists

```bash
scripts/tasks_manager.rb --operation list_tasklists
```

Should either:
- Display your task lists (if authorized)
- OR prompt for authorization (first time)

### Test 3: List Tasks

```bash
scripts/tasks_manager.rb --operation list_tasks
```

Should display tasks from your default task list.

### Test 4: Create a Task

```bash
scripts/tasks_manager.rb --operation create_task --title "Test task from Claude"
```

Should create a new task and return its details.

## Troubleshooting

### "cannot load such file -- google/apis/tasks_v1"

**Problem**: Google Tasks API gem not installed

**Solution**:
```bash
gem install google-apis-tasks_v1 --user-install
```

### "Ruby version >= 3.0 required"

**Problem**: Using Ruby 2.x

**Solution**: Upgrade to Ruby 3.x or use rbenv:
```bash
rbenv install 3.3.7
rbenv local 3.3.7  # In skill directory
```

### "Credentials file not found"

**Problem**: Missing `~/.claude/.google/client_secret.json`

**Solution**: Follow "First-Time Google Cloud Console Setup" above

### "Token refresh failed" or "Authorization required"

**Problem**: Saved token expired, invalid, or missing required scopes

**Solution**: Delete token and re-authorize:
```bash
rm ~/.claude/.google/token.json
scripts/tasks_manager.rb --operation list_tasklists
# Follow authorization flow
```

### "undefined method 'chomp' for nil (NoMethodError)"

**Problem**: Script running in non-interactive mode but needs authorization

**Solution**: Run the authorization in an interactive terminal first:
```bash
# Open a regular terminal (not Claude Code)
cd ~/.claude/skills/tasks
scripts/tasks_manager.rb --operation list_tasklists
# Complete the authorization flow interactively
```

### "Task list not found"

**Problem**: Specified task list ID doesn't exist

**Solution**: First list your task lists to get valid IDs:
```bash
scripts/tasks_manager.rb --operation list_tasklists
```

## Ruby Version Detection

The script includes Ruby version detection. If you have rbenv installed with Ruby 3.x, the script will automatically attempt to use it.

To force a specific Ruby version:

```bash
RBENV_VERSION=3.3.7 scripts/tasks_manager.rb --operation list_tasklists
```

Or create a `.ruby-version` file in the skills/tasks directory:

```bash
echo "3.3.7" > ~/.claude/skills/tasks/.ruby-version
```

## Verification Checklist

- [ ] Ruby 3.0+ installed and accessible
- [ ] Google Tasks API gem installed (`google-apis-tasks_v1`)
- [ ] Googleauth gem installed
- [ ] Credentials file exists: `~/.claude/.google/client_secret.json`
- [ ] Tasks API enabled in Google Cloud Console
- [ ] Script help command works
- [ ] Authorization flow completed (or token exists with tasks scope)
- [ ] Can list task lists
- [ ] Can list tasks
- [ ] Can create a test task

## Scope Reference

The tasks skill requests the following OAuth scope:
- `https://www.googleapis.com/auth/tasks` - Full access to Google Tasks

Combined with other Google skills, the full scope list is:
- Tasks: `https://www.googleapis.com/auth/tasks`
- Drive: `https://www.googleapis.com/auth/drive`
- Calendar: `https://www.googleapis.com/auth/calendar`
- Contacts: `https://www.googleapis.com/auth/contacts`
- Gmail: `https://www.googleapis.com/auth/gmail.modify`

## Support

If you encounter issues not covered here, check:
1. Ruby version: `ruby --version` (must be >= 3.0)
2. Gem installation: `gem list | grep google-apis-tasks`
3. Credentials permissions: `ls -la ~/.claude/.google/`
4. Script permissions: `ls -la scripts/tasks_manager.rb` (should be executable)
5. Token scopes: Delete token and re-authorize if scopes are missing

For skill-specific help:
```bash
scripts/tasks_manager.rb --help
```
