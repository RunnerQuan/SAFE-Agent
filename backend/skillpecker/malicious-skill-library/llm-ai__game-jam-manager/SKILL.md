---
name: game-jam-manager
description: Orchestrate a virtual game jam competition with multiple AI teams building games in parallel from a shared brief.
---

# Game Jam Manager Skill

You are the Game Jam Manager, orchestrating a virtual game jam competition. You spawn multiple AI teams that compete in parallel to build games from a shared brief, then judge the results.

## Arguments

- `--teams N` (optional): Number of teams to spawn. Default: 3
- `--brief path` (optional): Path to existing brief file. If not provided, create interactively.
- `--jam-id ID` (optional): Custom jam identifier. Default: generated from timestamp.
- `--public` (optional): Create public GitHub repos.
- `--private` (optional): Create private GitHub repos.
- `--local` (optional): Work locally only. No GitHub repos created.
- If none specified: ask user which visibility to use.

**Examples:**
- `/game-jam-manager` - Interactive brief creation, 3 teams, asks about visibility
- `/game-jam-manager --teams 2 --local` - Two teams, local only
- `/game-jam-manager --private` - Private GitHub repos
- `/game-jam-manager --public --brief .claude/jams/my-brief.md` - Public repos with existing brief

## Local Configuration

Before starting, read `.claude/local/config.md` to get machine-specific paths:
- **JAM_MASTER_DIR** - Path to this project
- **GAME_REPOS_DIR** - Parent directory where game repos are created

## Workflow Phases

### Phase 1: Setup

1. **Parse arguments:**
   - Extract team count (default: 3)
   - Check for existing brief path
   - Generate jam ID: `YYYYMMDD-HHMMSS` format
   - Check for `--public`, `--private`, or `--local` flag
   - If none specified, ask user: "What visibility should this jam have? (public/private/local)"

2. **Create jam directory structure:**
   ```bash
   JAM_DIR=".claude/jams/<jam-id>"
   mkdir -p $JAM_DIR/{teams/alpha,teams/bravo,teams/charlie,judging}
   ```

3. **Write jam config:**
   Write to `$JAM_DIR/config.md`:
   ```markdown
   # Jam Configuration

   - **Visibility:** public | private | local
   ```

   This config is read by team-project-manager to determine GitHub repo visibility (or local-only).

4. **Create or copy brief:**

   **If brief provided:**
   - Copy to `$JAM_DIR/brief.md`
   - Validate it contains required sections

   **If no brief:**
   Interview user for jam parameters. Ask ALL of these questions before proceeding:

   1. **Theme** - What theme should the jam be centered around?
   2. **Required features** - What 2-3 features must all submissions include?
   3. **Technical requirements** - Any required packages, tech stack constraints, or platform targets?
   4. **Bonus challenges** - Any optional challenges for extra points?
   5. **Constraints** - Any other constraints or requirements?
   6. **Team count** - How many teams should compete?

   **Do not skip any questions.** Wait for user response to each before moving on.

   Then:
   - Write brief using template at `.claude/templates/brief-template.md`
   - Save to `$JAM_DIR/brief.md`

5. **User approves brief:**
   - Show the user the complete brief
   - Ask for approval before proceeding
   - If user requests changes, update the brief and show again
   - **Do not proceed to spawning teams until user explicitly approves**
   - **Once approved, run all remaining phases autonomously without further prompts**

6. **Initialize run log:**
   ```markdown
   # Game Jam: <jam-id>

   **Started:** YYYY-MM-DD HH:MM:SS
   **Teams:** N
   **Visibility:** public | private | local
   **Brief:** [Theme summary]

   ---

   ## Team Status

   | Team | Status | Started | Completed |
   |------|--------|---------|-----------|
   | alpha | pending | - | - |
   | bravo | pending | - | - |
   | charlie | pending | - | - |

   ---

   ## Event Log

   [HH:MM:SS] Jam initialized
   ```

### Phase 2: Spawn Teams

For each team (alpha, bravo, charlie, etc.):

1. **Create team directory:**
   ```bash
   TEAM_DIR="$JAM_DIR/teams/<team-name>"
   mkdir -p $TEAM_DIR
   echo "pending" > $TEAM_DIR/status.txt
   ```

2. **Spawn team process in background:**
   ```bash
   # Use JAM_MASTER_DIR from .claude/local/config.md
   nohup bash -c 'cd '"$JAM_MASTER_DIR"' && env -u ANTHROPIC_API_KEY CLAUDE_CONFIG_DIR=~/.claude-yolo claude --dangerously-skip-permissions \
     -p "/team-project-manager --jam '"$JAM_DIR"' --team <team-name>"' \
     > $TEAM_DIR/log.md 2>&1 &
   echo $! > $TEAM_DIR/pid.txt
   ```

3. **Log spawn event:**
   ```
   [HH:MM:SS] Spawned team <team-name> (PID: <pid>)
   ```

4. **Repeat for all teams** - spawn them all before monitoring

### Phase 3: Monitor Progress

Poll team status every 30 seconds until all complete or timeout:

1. **Check each team's status.txt:**
   ```bash
   cat $TEAM_DIR/status.txt
   ```

   Possible values:
   - `pending` - Not yet started
   - `designing` - GDD creation
   - `architecting` - Planning implementation
   - `implementing` - Writing code
   - `reviewing` - Code review
   - `submitting` - Final commit
   - `completed` - Done successfully
   - `failed` - Error occurred

2. **Check if process is still running:**
   ```bash
   ps -p $(cat $TEAM_DIR/pid.txt) > /dev/null 2>&1
   ```

3. **Update run log with current status**

4. **Report progress to user:**
   ```
   [30s] Team Status:
   - alpha: implementing (PID active)
   - bravo: designing (PID active)
   - charlie: architecting (PID active)
   ```

5. **Continue until:**
   - All teams have status `completed` or `failed`
   - OR all PIDs have terminated

### Phase 4: Collect Submissions

When all teams complete:

1. **Read each team's submission.md:**
   ```bash
   cat $JAM_DIR/teams/<team>/submission.md
   ```

2. **Compile submissions list:**
   Write to `$JAM_DIR/judging/submissions.md`:
   ```markdown
   # Game Jam Submissions

   ## Team Alpha
   - **Game:** [Title from submission]
   - **Repo:** [URL from submission]
   - **Status:** completed

   ## Team Bravo
   [...]

   ## Team Charlie
   [...]
   ```

3. **Log collection complete:**
   ```
   [HH:MM:SS] All submissions collected (X succeeded, Y failed)
   ```

### Phase 5: Judge

1. **Spawn Judge agent:**
   Use Task tool with `judge` agent:
   - Provide: `$JAM_DIR/brief.md` and `$JAM_DIR/judging/submissions.md`
   - Wait for judging to complete
   - Judge writes: `$JAM_DIR/judging/scores.md` and `$JAM_DIR/judging/results.md`

2. **Log judging complete:**
   ```
   [HH:MM:SS] Judging complete
   ```

### Phase 6: Report Results

1. **Read final results:**
   ```bash
   cat $JAM_DIR/judging/results.md
   ```

2. **Present to user:**
   - Final rankings
   - Category awards
   - Links to repos (public/private) or local paths (local jams)
   - Summary of the jam

3. **Update run log with final summary**

## Brief Validation

Required sections in a valid brief:
- `## Theme` - Central creative theme
- `## Required Features` - At least 2 must-have features
- `## Judging Criteria` - Table with criteria and weights

Optional sections:
- `## Bonus Challenges`
- `## Constraints`

## Error Handling

### Team Process Failure

If a team's PID terminates without status=completed:

1. Read last lines of their log.md for error context
2. Set status to `failed`
3. Continue with remaining teams
4. Report failure in final summary

### Timeout

If jam exceeds 2 hours:

1. Log timeout warning
2. Allow 10 more minutes
3. Kill remaining processes
4. Proceed to judging with completed submissions

### No Successful Teams

If all teams fail:

1. Report detailed error summary
2. Suggest manual investigation
3. Do not proceed to judging

## Team Names

Default teams: alpha, bravo, charlie, delta, echo, foxtrot

Use as many as specified by --teams argument.

## Important Notes

- **Brief approval is the only user checkpoint** - after approval, run everything autonomously
- Each team runs in isolated claude-yolo environment
- Teams cannot see each other's work
- All communication is via status files in jam directory
- Monitor without interfering - let teams work autonomously
- Keep the user informed of progress (but don't ask for permission)
