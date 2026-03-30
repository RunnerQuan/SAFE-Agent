# Monitoring Scripts

This reference provides scripts and patterns for monitoring GitHub repositories, workflows, and team activity.

## Repository Monitoring

### Daily Repository Status Report

```bash
#!/bin/bash
# daily_status.sh - Generate daily repository status report

OWNER=$1
REPO=$2
DATE=$(date +%Y-%m-%d)

cat << EOF
# Daily Status Report for $OWNER/$REPO - $DATE

## 📊 Repository Stats
$(gh api repos/$OWNER/$REPO --jq '
  "- Stars: \(.stargazers_count)
- Forks: \(.forks_count)
- Open Issues: \(.open_issues_count)
- Watchers: \(.subscribers_count)"
')

## 🔄 Recent Activity (Last 24 hours)

### Pull Requests
$(gh pr list --repo $OWNER/$REPO --search "created:>=$(date -d '1 day ago' '+%Y-%m-%d')" --json number,title,author | jq -r '
  if length > 0 then
    "**New PRs**: \(length)\n" +
    (.[] | "- #\(.number): \(.title) by @\(.author.login)")
  else
    "No new pull requests"
  end
')

### Issues
$(gh issue list --repo $OWNER/$REPO --search "created:>=$(date -d '1 day ago' '+%Y-%m-%d')" --json number,title,author | jq -r '
  if length > 0 then
    "**New Issues**: \(length)\n" +
    (.[] | "- #\(.number): \(.title) by @\(.author.login)")
  else
    "No new issues"
  end
')

### Merged PRs
$(gh pr list --repo $OWNER/$REPO --state merged --search "merged:>=$(date -d '1 day ago' '+%Y-%m-%d')" --json number,title,author | jq -r '
  if length > 0 then
    "**Merged**: \(length)\n" +
    (.[] | "- #\(.number): \(.title) by @\(.author.login)")
  else
    "No PRs merged"
  end
')

## ⚠️ Attention Required

### Stale PRs (>7 days)
$(gh pr list --repo $OWNER/$REPO --json number,title,createdAt,author | jq -r '
  map(select((.createdAt | fromdateiso8601) < (now - 7*24*60*60))) |
  if length > 0 then
    "**Count**: \(length)\n" +
    (.[0:5] | map("- #\(.number): \(.title) (opened \((.createdAt | fromdateiso8601 | strftime("%Y-%m-%d"))))") | join("\n"))
  else
    "No stale PRs"
  end
')

### Failed Workflow Runs
$(gh run list --repo $OWNER/$REPO --status failure --limit 5 --json displayTitle,conclusion,startedAt,workflowName | jq -r '
  if length > 0 then
    "**Failed Runs**: \(length)\n" +
    (.[] | "- \(.workflowName): \(.displayTitle) at \(.startedAt)")
  else
    "All workflows passing"
  end
')

## 📈 Metrics Summary

$(gh api repos/$OWNER/$REPO/stats/participation --jq '
  "**Commit Activity (Last Week)**
- Total: \(.all[-1])
- Owner: \(.owner[-1])"
')

Generated at: $(date)
EOF
```

### PR Review Queue Monitor

```bash
#!/bin/bash
# pr_review_queue.sh - Monitor PRs awaiting review

OWNER=$1
REPO=$2

echo "# PR Review Queue for $OWNER/$REPO"
echo "Generated: $(date)"
echo

# PRs awaiting initial review
echo "## 🆕 Awaiting First Review"
gh pr list --repo $OWNER/$REPO --json number,title,author,createdAt,reviewRequests,reviews,isDraft | jq -r '
  map(select(.isDraft == false and (.reviews | length) == 0)) |
  sort_by(.createdAt) |
  if length > 0 then
    .[] | "- #\(.number): \(.title)
  Author: @\(.author.login)
  Created: \(.createdAt | fromdateiso8601 | strftime("%Y-%m-%d %H:%M"))
  Age: \((now - (.createdAt | fromdateiso8601)) / 86400 | floor) days
  Requested Reviewers: \((.reviewRequests | map(.login // .name) | join(", ")) // "none")\n"
  else
    "No PRs awaiting first review"
  end
'

echo
echo "## 🔄 Changes Requested"
gh pr list --repo $OWNER/$REPO --json number,title,author,reviews | jq -r '
  map(select(.reviews | map(select(.state == "CHANGES_REQUESTED")) | length > 0)) |
  if length > 0 then
    .[] | "- #\(.number): \(.title) by @\(.author.login)"
  else
    "No PRs with changes requested"
  end
'

echo
echo "## ✅ Approved but Not Merged"
gh pr list --repo $OWNER/$REPO --json number,title,author,reviews,mergeable | jq -r '
  map(select(
    (.reviews | map(select(.state == "APPROVED")) | length > 0) and
    .mergeable != "CONFLICTING"
  )) |
  if length > 0 then
    .[] | "- #\(.number): \(.title) by @\(.author.login)"
  else
    "No approved PRs awaiting merge"
  end
'

echo
echo "## 📊 Review Stats"
gh pr list --repo $OWNER/$REPO --state open --json reviews,author | jq -r '
  {
    total_open_prs: length,
    reviewed: map(select(.reviews | length > 0)) | length,
    unreviewed: map(select(.reviews | length == 0)) | length,
    review_rate: ((map(select(.reviews | length > 0)) | length) / length * 100)
  } |
  "- Total Open PRs: \(.total_open_prs)
- Reviewed: \(.reviewed) (\(.review_rate | floor)%)
- Awaiting Review: \(.unreviewed)"
'
```

## Workflow Monitoring

### CI/CD Health Monitor

```bash
#!/bin/bash
# ci_health_monitor.sh - Monitor CI/CD pipeline health

OWNER=$1
REPO=$2
WORKFLOW=${3:-"CI"}  # Default to "CI" workflow

echo "# CI/CD Health Report for $OWNER/$REPO"
echo "Workflow: $WORKFLOW"
echo "Generated: $(date)"
echo

# Recent run summary
echo "## 📊 Last 24 Hours"
gh run list --repo $OWNER/$REPO --workflow "$WORKFLOW" --limit 50 --json conclusion,createdAt | jq -r '
  map(select((.createdAt | fromdateiso8601) > (now - 24*60*60))) |
  group_by(.conclusion) |
  map({conclusion: .[0].conclusion, count: length}) |
  map("- \(.conclusion): \(.count)") |
  join("\n")
'

echo
echo "## 📈 Success Rate Trend (7 days)"
gh run list --repo $OWNER/$REPO --workflow "$WORKFLOW" --limit 200 --json conclusion,createdAt | jq -r '
  map(select((.createdAt | fromdateiso8601) > (now - 7*24*60*60))) |
  map({
    date: (.createdAt | split("T")[0]),
    success: (.conclusion == "success")
  }) |
  group_by(.date) |
  map({
    date: .[0].date,
    total: length,
    successful: map(select(.success)) | length,
    rate: ((map(select(.success)) | length) / length * 100)
  }) |
  sort_by(.date) |
  map("- \(.date): \(.successful)/\(.total) (\(.rate | floor)%)") |
  join("\n")
'

echo
echo "## ⏱️ Performance Metrics"
gh run list --repo $OWNER/$REPO --workflow "$WORKFLOW" --status completed --limit 20 --json startedAt,updatedAt,conclusion | jq -r '
  map(select(.conclusion == "success") | {
    duration: ((((.updatedAt | fromdateiso8601) - (.startedAt | fromdateiso8601)) / 60) | floor)
  }) |
  {
    avg: (map(.duration) | add / length),
    min: (map(.duration) | min),
    max: (map(.duration) | max),
    p50: (map(.duration) | sort | .[length/2]),
    p95: (map(.duration) | sort | .[length * 0.95 | floor])
  } |
  "Average Duration: \(.avg | floor) minutes
Min/Max: \(.min)/\(.max) minutes
P50/P95: \(.p50)/\(.p95) minutes"
'

echo
echo "## 🚨 Recent Failures"
gh run list --repo $OWNER/$REPO --workflow "$WORKFLOW" --status failure --limit 5 --json displayTitle,headBranch,actor,createdAt,html_url | jq -r '
  if length > 0 then
    .[] | "### \(.displayTitle)
- Branch: \(.headBranch)
- Actor: @\(.actor.login)
- Time: \(.createdAt)
- [View Run](\(.html_url))\n"
  else
    "No recent failures! 🎉"
  end
'
```

### Flaky Test Detector

```bash
#!/bin/bash
# flaky_test_detector.sh - Identify flaky tests from workflow runs

OWNER=$1
REPO=$2
WORKFLOW=${3:-"tests"}

echo "# Flaky Test Detection Report"
echo "Repository: $OWNER/$REPO"
echo "Analyzing last 100 runs of workflow: $WORKFLOW"
echo

# Get runs grouped by commit
FLAKY_COMMITS=$(gh run list --repo $OWNER/$REPO --workflow "$WORKFLOW" --limit 100 --json headSha,conclusion,displayTitle | jq -r '
  group_by(.headSha) |
  map(select(length > 1)) |
  map({
    sha: .[0].headSha,
    runs: length,
    conclusions: map(.conclusion) | unique,
    titles: map(.displayTitle) | unique,
    has_both: (map(.conclusion) | unique | contains(["success"]) and contains(["failure"]))
  }) |
  map(select(.has_both))
')

if [ "$(echo "$FLAKY_COMMITS" | jq 'length')" -gt 0 ]; then
  echo "## 🚨 Potentially Flaky Tests Detected"
  echo
  echo "$FLAKY_COMMITS" | jq -r '.[] |
    "### Commit: \(.sha[0:8])
- Runs: \(.runs)
- Results: \(.conclusions | join(", "))
- Test Suites: \(.titles | join(", "))\n"'

  echo "## 📊 Flakiness Analysis"
  # For each flaky commit, try to get logs
  echo "$FLAKY_COMMITS" | jq -r '.[0:3] | .[].sha' | while read sha; do
    echo "### Analyzing runs for commit ${sha:0:8}"

    # Get failed run for this commit
    FAILED_RUN=$(gh run list --repo $OWNER/$REPO --commit "$sha" --status failure --limit 1 --json databaseId --jq '.[0].databaseId')

    if [ ! -z "$FAILED_RUN" ]; then
      echo "Failed run ID: $FAILED_RUN"
      # Try to extract test failures from logs
      gh run view $FAILED_RUN --repo $OWNER/$REPO --log 2>/dev/null | grep -E "(FAIL:|Failed:|Error:|failed test)" | head -10 || echo "Could not extract failure details"
    fi
    echo
  done
else
  echo "✅ No flaky tests detected in recent runs!"
fi

echo
echo "## 📈 Overall Test Stability"
gh run list --repo $OWNER/$REPO --workflow "$WORKFLOW" --limit 100 --json conclusion | jq -r '
  group_by(.conclusion) |
  map({conclusion: .[0].conclusion, count: length}) |
  map("- \(.conclusion): \(.count) runs") |
  join("\n")
'
```

## Issue and PR Monitoring

### SLA Compliance Monitor

```bash
#!/bin/bash
# sla_monitor.sh - Monitor response time SLAs

OWNER=$1
REPO=$2
SLA_HOURS=${3:-24}  # Default 24 hour SLA

echo "# SLA Compliance Report"
echo "Repository: $OWNER/$REPO"
echo "SLA Target: $SLA_HOURS hours"
echo "Generated: $(date)"
echo

# Check recent issues for first response
echo "## 📋 Issue Response Times (Last 30 days)"

# Get issues created in last 30 days
ISSUES=$(gh issue list --repo $OWNER/$REPO --state all --search "created:>$(date -d '30 days ago' '+%Y-%m-%d')" --json number,title,createdAt,author --limit 100)

VIOLATIONS=0
TOTAL=0

echo "$ISSUES" | jq -r '.[] | .number' | while read issue_num; do
  TOTAL=$((TOTAL + 1))

  # Get first comment
  FIRST_RESPONSE=$(gh api repos/$OWNER/$REPO/issues/$issue_num/comments --jq '
    if length > 0 then
      .[0] | {
        at: .created_at,
        by: .user.login
      }
    else
      null
    end
  ' 2>/dev/null)

  if [ "$FIRST_RESPONSE" != "null" ] && [ ! -z "$FIRST_RESPONSE" ]; then
    ISSUE_DATA=$(echo "$ISSUES" | jq -r ".[] | select(.number == $issue_num)")
    CREATED=$(echo "$ISSUE_DATA" | jq -r '.createdAt')
    RESPONSE_AT=$(echo "$FIRST_RESPONSE" | jq -r '.at')
    RESPONDER=$(echo "$FIRST_RESPONSE" | jq -r '.by')

    # Calculate response time
    CREATED_TS=$(date -d "$CREATED" +%s)
    RESPONSE_TS=$(date -d "$RESPONSE_AT" +%s)
    HOURS=$(( (RESPONSE_TS - CREATED_TS) / 3600 ))

    if [ $HOURS -gt $SLA_HOURS ]; then
      VIOLATIONS=$((VIOLATIONS + 1))
      echo "❌ #$issue_num - Response time: ${HOURS}h (by @$RESPONDER)"
    fi
  else
    # No response yet
    ISSUE_DATA=$(echo "$ISSUES" | jq -r ".[] | select(.number == $issue_num)")
    CREATED=$(echo "$ISSUE_DATA" | jq -r '.createdAt')
    CREATED_TS=$(date -d "$CREATED" +%s)
    NOW_TS=$(date +%s)
    HOURS=$(( (NOW_TS - CREATED_TS) / 3600 ))

    if [ $HOURS -gt $SLA_HOURS ]; then
      VIOLATIONS=$((VIOLATIONS + 1))
      echo "⚠️ #$issue_num - No response for ${HOURS}h"
    fi
  fi
done

echo
echo "## 📊 Summary"
echo "- Total Issues: $TOTAL"
echo "- SLA Violations: $VIOLATIONS"
echo "- Compliance Rate: $(( (TOTAL - VIOLATIONS) * 100 / TOTAL ))%"
```

### Team Activity Dashboard

```bash
#!/bin/bash
# team_activity.sh - Monitor team activity and contributions

OWNER=$1
REPO=$2
DAYS=${3:-7}  # Default to last 7 days

echo "# Team Activity Report"
echo "Repository: $OWNER/$REPO"
echo "Period: Last $DAYS days"
echo "Generated: $(date)"
echo

# PR Activity
echo "## 🔄 Pull Request Activity"
gh pr list --repo $OWNER/$REPO --state all --search "created:>$(date -d "$DAYS days ago" '+%Y-%m-%d')" --json author,state,createdAt,reviews --limit 200 | jq -r '
  group_by(.author.login) |
  map({
    author: .[0].author.login,
    prs_created: length,
    prs_open: map(select(.state == "OPEN")) | length,
    prs_merged: map(select(.state == "MERGED")) | length
  }) |
  sort_by(.prs_created) |
  reverse |
  .[] | "### @\(.author)
- PRs Created: \(.prs_created)
- Still Open: \(.prs_open)
- Merged: \(.prs_merged)"
'

echo
echo "## 💬 Review Activity"
# Get reviews given in the last N days
echo "Gathering review data..."
gh api graphql --paginate -f query='
  query($owner: String!, $repo: String!, $since: DateTime!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(last: 100) {
        nodes {
          reviews(last: 100) {
            nodes {
              author {
                login
              }
              submittedAt
              state
            }
          }
        }
      }
    }
  }
' -f owner="$OWNER" -f repo="$REPO" -f since="$(date -d "$DAYS days ago" -Iseconds)" | jq -r '
  .data.repository.pullRequests.nodes |
  map(.reviews.nodes) |
  flatten |
  map(select(.submittedAt > $since)) |
  group_by(.author.login) |
  map({
    reviewer: .[0].author.login,
    total_reviews: length,
    approvals: map(select(.state == "APPROVED")) | length,
    changes_requested: map(select(.state == "CHANGES_REQUESTED")) | length
  }) |
  sort_by(.total_reviews) |
  reverse |
  .[] | "### @\(.reviewer)
- Reviews Given: \(.total_reviews)
- Approvals: \(.approvals)
- Changes Requested: \(.changes_requested)"
' --arg since "$(date -d "$DAYS days ago" -Iseconds)"

echo
echo "## 📝 Issue Activity"
gh issue list --repo $OWNER/$REPO --state all --search "updated:>$(date -d "$DAYS days ago" '+%Y-%m-%d')" --json author,assignees,comments --limit 200 | jq -r '
  # Issue creators
  group_by(.author.login) |
  map({author: .[0].author.login, count: length}) as $creators |

  # Issue assignees
  map(.assignees) | flatten | group_by(.login) |
  map({assignee: .[0].login, count: length}) as $assignees |

  "### Issues Created:" +
  ($creators | sort_by(.count) | reverse | map("\n- @\(.author): \(.count)") | join("")) +
  "\n\n### Issues Assigned To:" +
  ($assignees | sort_by(.count) | reverse | map("\n- @\(.assignee): \(.count)") | join(""))
'
```

## Automated Alerts

### Slack/Discord Webhook Notifier

```bash
#!/bin/bash
# alert_webhook.sh - Send alerts to Slack/Discord

WEBHOOK_URL=$1
OWNER=$2
REPO=$3

# Function to send webhook
send_alert() {
  local title=$1
  local description=$2
  local color=$3

  # Discord format
  curl -H "Content-Type: application/json" \
    -d "{
      \"embeds\": [{
        \"title\": \"$title\",
        \"description\": \"$description\",
        \"color\": $color,
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
      }]
    }" \
    "$WEBHOOK_URL"

  # For Slack, use:
  # curl -X POST -H 'Content-type: application/json' \
  #   --data "{\"text\":\"$title\n$description\"}" \
  #   "$WEBHOOK_URL"
}

# Check for critical issues
CRITICAL_ISSUES=$(gh issue list --repo $OWNER/$REPO --label "critical" --label "bug" --state open --json number,title | jq -r '
  if length > 0 then
    "Found \(length) critical issues:\n" +
    (.[] | "- #\(.number): \(.title)") | .[0:5]
  else
    null
  end
')

if [ ! -z "$CRITICAL_ISSUES" ] && [ "$CRITICAL_ISSUES" != "null" ]; then
  send_alert "⚠️ Critical Issues in $OWNER/$REPO" "$CRITICAL_ISSUES" 16711680  # Red
fi

# Check for stale PRs
STALE_PRS=$(gh pr list --repo $OWNER/$REPO --json number,title,createdAt | jq -r '
  map(select((.createdAt | fromdateiso8601) < (now - 14*24*60*60))) |
  if length > 3 then
    "Found \(length) PRs older than 14 days"
  else
    null
  end
')

if [ ! -z "$STALE_PRS" ] && [ "$STALE_PRS" != "null" ]; then
  send_alert "📚 Stale PRs in $OWNER/$REPO" "$STALE_PRS" 16776960  # Yellow
fi

# Check CI failures
FAILED_RUNS=$(gh run list --repo $OWNER/$REPO --workflow "CI" --status failure --limit 3 --json displayTitle,actor | jq -r '
  if length > 0 then
    "Recent CI failures:\n" +
    (.[] | "- \(.displayTitle) by @\(.actor.login)")
  else
    null
  end
')

if [ ! -z "$FAILED_RUNS" ] && [ "$FAILED_RUNS" != "null" ]; then
  send_alert "❌ CI Failures in $OWNER/$REPO" "$FAILED_RUNS" 16711680  # Red
fi
```

## Cron Setup Example

```bash
# Example crontab entries for automated monitoring

# Daily status report at 9 AM
0 9 * * * /path/to/daily_status.sh owner repo > /path/to/reports/daily_$(date +\%Y\%m\%d).md

# PR review queue check every 2 hours
0 */2 * * * /path/to/pr_review_queue.sh owner repo

# CI health check every hour
0 * * * * /path/to/ci_health_monitor.sh owner repo

# Weekly team activity report on Mondays
0 9 * * 1 /path/to/team_activity.sh owner repo 7

# Alert webhook every 30 minutes for critical issues
*/30 * * * * /path/to/alert_webhook.sh https://webhook.url owner repo
```