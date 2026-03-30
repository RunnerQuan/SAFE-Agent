---
name: 000-install
description: Setup and validation skill for the project automation suite. Checks for required directories, CLI tools, and skill dependencies. Run this first in any new environment or to diagnose issues. Use when user says "install skills", "setup environment", "check dependencies", or "diagnose setup".
---

# Environment Setup & Validation

Bootstrap the project automation environment by checking and installing required dependencies.

---

## When to Use

- **First time setup** — New machine or environment
- **Troubleshooting** — Skills not working as expected
- **Validation** — Verify environment is correctly configured
- **Updates** — After updating skills, verify compatibility

---

## Setup Flow

### Step 1: Environment Detection

Detect current environment:

```bash
# Check OS
uname -s  # Darwin, Linux, Windows

# Check shell
echo $SHELL  # /bin/zsh, /bin/bash

# Check working directory
pwd
```

Display environment summary:

```
╔═══════════════════════════════════════════════════════════════╗
║ ENVIRONMENT SETUP                                             ║
╠═══════════════════════════════════════════════════════════════╣
║ OS: macOS (Darwin 24.1.0)                                     ║
║ Shell: zsh                                                    ║
║ Working Dir: /Users/user/projects/my-app                      ║
║ Home: /Users/user                                             ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 2: Check CLI Tools

Verify required CLI tools are installed:

| Tool | Command | Required For |
|------|---------|--------------|
| Claude CLI | `claude --version` | 003-execute-tasks (Claude provider) |
| Codex CLI | `codex --version` | 003-execute-tasks (Codex provider) |
| Node.js | `node --version` | Many project types |
| npm | `npm --version` | Package management |
| Git | `git --version` | Version control |
| Python | `python3 --version` | Script execution |

Display results:

```
CLI Tools:
  ✓ claude    v1.0.0
  ✓ node      v20.10.0
  ✓ npm       v10.2.3
  ✓ git       v2.43.0
  ✓ python3   v3.12.0
  ✗ codex     Not installed (optional)
```

**If Claude CLI not installed:**
```
⚠ Claude CLI is required but not installed.

Install with:
  npm install -g @anthropic-ai/claude-code

Or see: https://docs.anthropic.com/claude-code
```

### Step 3: Check Skills Directory

Verify skills are installed in `~/.claude/skills/`:

```bash
ls -la ~/.claude/skills/
```

Required skills:
| Skill | Directory | Status |
|-------|-----------|--------|
| 001-scope-project | `~/.claude/skills/001-scope-project/` | Required |
| 002-setup-project | `~/.claude/skills/002-setup-project/` | Required |
| 003-execute-tasks | `~/.claude/skills/003-execute-tasks/` | Required |

Display results:

```
Installed Skills:
  ✓ 001-scope-project
  ✓ 002-setup-project
  ✓ 003-execute-tasks
```

**If skills missing, offer to install:**
```json
{
  "questions": [{
    "question": "Some skills are missing. Install them now?",
    "header": "Install",
    "options": [
      {"label": "Yes, install all (Recommended)", "description": "Copy all skills to ~/.claude/skills/"},
      {"label": "No, skip", "description": "Continue without installing"}
    ],
    "multiSelect": false
  }]
}
```

### Step 4: Check Project Structure

If in a project directory, verify expected structure.

**All project files live under `.claude/`** — single source of truth:

```
Project Structure:
  ✓ .claude/                    Project metadata directory
  ✓ .claude/PRD.md              Requirements (from 001, if saved)
  ✓ .claude/ARCHITECTURE.md     Technical blueprint (from 002)
  ✓ .claude/DECISIONS.md        Architecture decisions
  ✓ .claude/ENV-SETUP.md        Environment requirements
  ✓ .claude/tasks.json          Task definitions
  ✓ .claude/CONTEXT.md          Current project state
  ✓ .claude/PROGRESS-NOTES.md   Progress log
  ✓ .claude/BLOCKERS.md         Blocked task tracking
  ✓ .claude/prompts/            Subagent prompt history (from 003)
```

### Step 5: Create Missing Directories

If user approves, create missing directories:

```bash
# Create .claude directory (all project files go here)
mkdir -p .claude

# Initialize empty files if needed
touch .claude/CONTEXT.md
touch .claude/PROGRESS-NOTES.md
touch .claude/BLOCKERS.md
```

### Step 6: Inventory External Services & API Keys

Check for existing API keys and service credentials in the environment:

```bash
# Check common environment variables
env | grep -iE "(SUPABASE|FIREBASE|STRIPE|OPENAI|ANTHROPIC|RESEND|SENDGRID|TWILIO|POSTGRES|DATABASE|API_KEY|SECRET)" 2>/dev/null
```

**Common Services to Check:**

| Service | Env Variables | Purpose |
|---------|--------------|---------|
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` | Backend/DB/Auth |
| Firebase | `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID` | Backend/DB/Auth |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Payments |
| OpenAI | `OPENAI_API_KEY` | AI/LLM |
| Anthropic | `ANTHROPIC_API_KEY` | AI/LLM |
| Resend | `RESEND_API_KEY` | Email |
| SendGrid | `SENDGRID_API_KEY` | Email |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | SMS/Voice |
| Vercel | `VERCEL_TOKEN` | Deployment |
| AWS | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Cloud services |
| Database | `DATABASE_URL`, `POSTGRES_URL` | Direct DB connection |

Display detected services:

```
External Services (from environment):
  ✓ Supabase         SUPABASE_URL, SUPABASE_ANON_KEY configured
  ✓ Stripe           STRIPE_SECRET_KEY configured
  ✓ OpenAI           OPENAI_API_KEY configured
  ✓ Anthropic        ANTHROPIC_API_KEY configured
  ✗ Firebase         Not detected
  ✗ Resend           Not detected
```

**Ask about additional services:**

```json
{
  "questions": [{
    "question": "Do you have accounts with any services not detected above?",
    "header": "Services",
    "options": [
      {"label": "Yes, I'll add them", "description": "I have API keys to add"},
      {"label": "No, this is complete", "description": "Detected services are all I use"},
      {"label": "I'm new to this", "description": "Help me understand what I might need"}
    ],
    "multiSelect": false
  }]
}
```

**Save service inventory to `~/.claude/services.json`:**

```json
{
  "detected": {
    "supabase": {
      "configured": true,
      "variables": ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    },
    "stripe": {
      "configured": true,
      "variables": ["STRIPE_SECRET_KEY"]
    },
    "openai": {
      "configured": true,
      "variables": ["OPENAI_API_KEY"]
    }
  },
  "available": ["supabase", "stripe", "openai", "anthropic"],
  "lastChecked": "2024-01-15T10:30:00Z"
}
```

**Create `.env.template` for new projects:**

Generate a template file at `~/.claude/env.template` with all configured services:

```bash
# ~/.claude/env.template
# Generated by /000-install — copy to project .env and fill in values

# ===================
# Backend / Database
# ===================
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# ===================
# Payments
# ===================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===================
# AI / LLM
# ===================
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# ===================
# Email
# ===================
# RESEND_API_KEY=re_...
# SENDGRID_API_KEY=SG...

# ===================
# Other
# ===================
# Add project-specific variables below
```

Only include sections for services the user has configured or indicated they'll use. Comment out services they don't have yet.

---

### Step 7: Inventory Aesthetic & Design Skills

Check for installed design/aesthetic skills that can influence project styling:

```bash
# Check for aesthetic skills
ls -d ~/.claude/skills/{brand-guidelines,vercel-react-best-practices,web-design-guidelines,canvas-design} 2>/dev/null
```

**Aesthetic Skills:**

| Skill | Purpose | Applies To |
|-------|---------|------------|
| `brand-guidelines` | Brand colors, typography, visual identity | Presentations, docs, UI styling |
| `vercel-react-best-practices` | React/Next.js performance patterns | React/Next.js projects |
| `web-design-guidelines` | UI/UX compliance review | Web interfaces |
| `canvas-design` | Visual art & design philosophy | Posters, graphics, PDFs |

Display detected skills:

```
Aesthetic Skills:
  ✓ brand-guidelines           Apply brand colors & typography
  ✓ vercel-react-best-practices  React/Next.js performance rules
  ✗ web-design-guidelines      Not installed
  ✓ canvas-design              Visual art creation
```

**Capture user preferences for detected skills:**

```json
{
  "questions": [{
    "question": "Which aesthetic skills should be available for projects?",
    "header": "Design Skills",
    "options": [
      {"label": "All detected (Recommended)", "description": "Enable all installed aesthetic skills"},
      {"label": "Select per-project", "description": "Choose skills during project scoping"},
      {"label": "None by default", "description": "Only enable when explicitly requested"}
    ],
    "multiSelect": false
  }]
}
```

**If "Select per-project" chosen**, skills are offered during `/001-scope-project` for each project.

Save preferences to `~/.claude/aesthetic-preferences.json`:

```json
{
  "defaultMode": "select-per-project",
  "installedSkills": [
    "brand-guidelines",
    "vercel-react-best-practices",
    "canvas-design"
  ],
  "skillDescriptions": {
    "brand-guidelines": "Brand colors, typography, visual identity",
    "vercel-react-best-practices": "React/Next.js performance optimization (45 rules)",
    "web-design-guidelines": "UI code review against web interface guidelines",
    "canvas-design": "Visual art & design philosophy creation"
  }
}
```

---

### Step 8: Validate Core Skill Configuration

Check each skill has required files:

```
Skill Validation:
  001-scope-project:
    ✓ SKILL.md exists
    ✓ Valid frontmatter
    ✓ references/prd-template.md exists
    ✓ references/question-phases.md exists

  002-setup-project:
    ✓ SKILL.md exists
    ✓ Valid frontmatter
    ✓ references/task-schema.md exists
    ✓ references/task-generation.md exists
    ✓ references/document-templates.md exists

  003-execute-tasks:
    ✓ SKILL.md exists
    ✓ Valid frontmatter
```

### Step 9: Test Subagent Execution

Verify Claude CLI can spawn subagents:

```bash
# Quick test
claude --model haiku -p "Say 'test passed' and nothing else" 2>&1
```

Expected output: `test passed`

If fails:
```
⚠ Claude CLI test failed.

Possible issues:
1. API key not configured - run: claude auth login
2. Network issues - check internet connection
3. Rate limiting - wait and retry
```

### Step 10: Summary Report

Display final setup summary:

```
╔═══════════════════════════════════════════════════════════════╗
║ SETUP COMPLETE                                                ║
╠═══════════════════════════════════════════════════════════════╣
║ Environment: Ready                                            ║
║ CLI Tools: 5/7 installed                                      ║
║ Core Skills: 3/3 installed                                    ║
║ Aesthetic Skills: 3/4 installed                               ║
║ External Services: 4 configured                               ║
║ Project Structure: Initialized                                ║
╠═══════════════════════════════════════════════════════════════╣
║ External Services (detected):                                 ║
║   ✓ Supabase    ✓ Stripe    ✓ OpenAI    ✓ Anthropic          ║
║   Template: ~/.claude/env.template                            ║
╠═══════════════════════════════════════════════════════════════╣
║ Aesthetic Skill Preferences:                                  ║
║   Mode: select-per-project                                    ║
║   • brand-guidelines ✓                                        ║
║   • vercel-react-best-practices ✓                             ║
║   • web-design-guidelines ✗                                   ║
║   • canvas-design ✓                                           ║
╠═══════════════════════════════════════════════════════════════╣
║ Optional CLI (not installed):                                 ║
║   • codex CLI - Install for Codex provider support            ║
╠═══════════════════════════════════════════════════════════════╣
║ Ready to use:                                                 ║
║   /001-scope-project  - Create a new PRD                      ║
║   /002-setup-project  - Generate project scaffold             ║
║   /003-execute-tasks  - Execute tasks (human-directed)        ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Installation Commands

### Install All Skills

Copy skills from source to `~/.claude/skills/`:

```bash
# From the skills repository
SKILLS_SOURCE="$HOME/Documents/claude-skills"

# Install each skill
for skill in 001-scope-project 002-setup-project 003-execute-tasks; do
  if [ -f "$SKILLS_SOURCE/$skill.skill" ]; then
    unzip -o "$SKILLS_SOURCE/$skill.skill" -d ~/.claude/skills/
  elif [ -d "$SKILLS_SOURCE/$skill" ]; then
    cp -r "$SKILLS_SOURCE/$skill" ~/.claude/skills/
  fi
done
```

### Install Single Skill

```bash
# From .skill file
unzip -o /path/to/003-execute-tasks.skill -d ~/.claude/skills/

# From directory
cp -r /path/to/003-execute-tasks ~/.claude/skills/
```

### Uninstall Skills

```bash
# Remove all project automation skills
rm -rf ~/.claude/skills/001-scope-project
rm -rf ~/.claude/skills/002-setup-project
rm -rf ~/.claude/skills/003-execute-tasks
```

---

## Troubleshooting

### "Skill not found" errors

```bash
# Verify skill location
ls ~/.claude/skills/

# Check SKILL.md exists
cat ~/.claude/skills/003-execute-tasks/SKILL.md | head -10
```

### Claude CLI hangs on complex prompts

Use temp file approach instead of inline prompts:
```bash
# Write prompt to file
cat > /tmp/prompt.txt << 'EOF'
Your complex prompt here
EOF

# Execute with file
claude --model sonnet -p "$(cat /tmp/prompt.txt)"
```

### Subagent not receiving configuration

When spawning subagents, configuration must be passed explicitly in the prompt. Subagents cannot see the parent's AskUserQuestion responses.

### Permission errors

```bash
# Check ~/.claude/skills permissions
chmod -R 755 ~/.claude/skills/
```

---

## Quick Reference

```bash
# Full environment check
/000-install

# Check specific component
/000-install --check cli
/000-install --check skills
/000-install --check project

# Install missing components
/000-install --fix

# Verbose output
/000-install --verbose
```
