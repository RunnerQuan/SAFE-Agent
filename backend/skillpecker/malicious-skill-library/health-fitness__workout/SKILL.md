---
name: workout
description: Generate today's workout based on program and recent history. Use when user wants their workout for today.
allowed-tools:
  - Read
  - Glob
  - Write
---

# Generate Today's Workout

## Current Context
- Today: !`date +"%A, %B %d, %Y"`
- Active adjustments: !`cat adjustments.md 2>/dev/null | grep -v "^#" | grep -v "^$" | grep -v "^\|.*\|.*\|.*\|$" | head -5 || echo "None"`
- Recent workouts: !`ls -1t workouts/ 2>/dev/null | head -5 || echo "No workouts logged yet"`

## Instructions

1. Read `program.md` to understand the current training program and determine what day/workout is next
2. Read the most recent 3-5 files in `workouts/` to see:
   - What was done recently (to determine rotation)
   - Any flagged issues or pain points
   - Recent performance to inform loading
3. Check `prs.md` for current bests
4. Check `adjustments.md` for any active flags that should modify the workout

If no plan exists in `program.md`, inform the user they need to run `/plan` first.

## Output Format

```markdown
## [Workout Name] - [Date]

### Warm-up
- [warm-up movements]

### Skill Block (if applicable)
| Exercise | Sets x Time | Notes |
|----------|-------------|-------|

### Main Work
| Exercise | Sets x Reps | Target Progression | Rest | Notes |
|----------|-------------|-------------------|------|-------|

### Accessories/Finisher
| Exercise | Sets x Reps | Notes |
|----------|-------------|-------|
```

Include any modifications based on active adjustments or recent flags.

After outputting the workout, remind the user to run `/log` when done.
