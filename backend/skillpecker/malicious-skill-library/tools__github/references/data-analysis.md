# Data Analysis Patterns

This reference provides patterns for analyzing GitHub data using the gh CLI combined with standard Unix tools and jq for JSON processing.

## PR Analysis Patterns

### PR Velocity Analysis

```bash
# Calculate PR merge velocity by week
gh pr list --state merged --limit 200 --json mergedAt,createdAt,number | jq '
  map({
    number: .number,
    created: (.createdAt | fromdateiso8601),
    merged: (.mergedAt | fromdateiso8601),
    week: (.mergedAt | fromdateiso8601 | strftime("%Y-W%V")),
    cycle_time_hours: (((.mergedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 3600)
  }) |
  group_by(.week) |
  map({
    week: .[0].week,
    count: length,
    avg_cycle_time_hours: (map(.cycle_time_hours) | add / length),
    min_cycle_time_hours: (map(.cycle_time_hours) | min),
    max_cycle_time_hours: (map(.cycle_time_hours) | max)
  }) |
  sort_by(.week)
'
```

### PR Size Distribution

```bash
# Analyze PR size distribution
gh pr list --state all --limit 500 --json additions,deletions,number,state | jq '
  map({
    number: .number,
    total_changes: (.additions + .deletions),
    size_category: (
      if (.additions + .deletions) < 10 then "XS"
      elif (.additions + .deletions) < 50 then "S"
      elif (.additions + .deletions) < 200 then "M"
      elif (.additions + .deletions) < 500 then "L"
      else "XL"
      end
    ),
    state: .state
  }) |
  group_by(.size_category) |
  map({
    size: .[0].size_category,
    count: length,
    merged: map(select(.state == "MERGED")) | length,
    closed: map(select(.state == "CLOSED")) | length,
    open: map(select(.state == "OPEN")) | length,
    merge_rate: ((map(select(.state == "MERGED")) | length) / length * 100)
  })
'
```

### Author Productivity Metrics

```bash
# Analyze author productivity
gh pr list --state all --limit 1000 --json author,createdAt,mergedAt,additions,deletions | jq '
  group_by(.author.login) |
  map({
    author: .[0].author.login,
    total_prs: length,
    merged_prs: map(select(.mergedAt != null)) | length,
    total_additions: map(.additions) | add,
    total_deletions: map(.deletions) | add,
    avg_pr_size: ((map(.additions + .deletions) | add) / length),
    merge_rate: ((map(select(.mergedAt != null)) | length) / length * 100),
    active_days: (map(.createdAt | split("T")[0]) | unique | length)
  }) |
  sort_by(.total_prs) |
  reverse
'
```

## Issue Analysis Patterns

### Issue Label Distribution

```bash
# Analyze issue distribution by labels
gh issue list --state all --limit 1000 --json labels,state,createdAt | jq '
  map(.labels[]) |
  group_by(.name) |
  map({
    label: .[0].name,
    count: length,
    color: .[0].color,
    description: .[0].description
  }) |
  sort_by(.count) |
  reverse
'
```

### Issue Resolution Patterns

```bash
# Analyze issue resolution patterns by month
gh issue list --state closed --limit 500 --json closedAt,createdAt,labels | jq '
  map({
    resolution_time_days: (((.closedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 86400),
    month: (.closedAt | fromdateiso8601 | strftime("%Y-%m")),
    labels: [.labels[].name],
    is_bug: ([.labels[].name] | contains(["bug"]))
  }) |
  group_by(.month) |
  map({
    month: .[0].month,
    total_closed: length,
    bugs_closed: map(select(.is_bug)) | length,
    avg_resolution_days: (map(.resolution_time_days) | add / length),
    median_resolution_days: (map(.resolution_time_days) | sort | .[length/2])
  }) |
  sort_by(.month)
'
```

### Issue Response Time Analysis

```bash
# Create a script to analyze first response times
cat > analyze_response_times.sh << 'EOF'
#!/bin/bash

# Get issues with comments
gh issue list --state all --limit 100 --json number,createdAt,author > issues.json

# For each issue, get first comment
jq -r '.[] | .number' issues.json | while read issue_num; do
  first_comment=$(gh api repos/:owner/:repo/issues/$issue_num/comments --jq '
    if length > 0 then
      {
        issue: $issue_num,
        first_comment_at: .[0].created_at,
        first_commenter: .[0].user.login
      }
    else empty end
  ' --arg issue_num "$issue_num" 2>/dev/null)

  if [ ! -z "$first_comment" ]; then
    echo "$first_comment"
  fi
done | jq -s '.' > issue_responses.json

# Combine and analyze
jq -s '
  .[0] as $issues |
  .[1] as $responses |
  $issues | map(. as $issue |
    ($responses | map(select(.issue == ($issue.number | tostring))) | .[0]) as $response |
    if $response then
      {
        number: .number,
        author: .author.login,
        created: (.createdAt | fromdateiso8601),
        first_response: ($response.first_comment_at | fromdateiso8601),
        response_time_hours: ((($response.first_comment_at | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 3600),
        first_responder: $response.first_commenter,
        self_response: (.author.login == $response.first_commenter)
      }
    else empty end
  ) |
  {
    total_with_responses: length,
    avg_response_hours: (map(.response_time_hours) | add / length),
    median_response_hours: (map(.response_time_hours) | sort | .[length/2]),
    self_responses: map(select(.self_response)) | length,
    responder_stats: group_by(.first_responder) | map({responder: .[0].first_responder, count: length}) | sort_by(.count) | reverse
  }
' issues.json issue_responses.json
EOF

chmod +x analyze_response_times.sh
```

## Workflow Analysis Patterns

### Workflow Success Rates

```bash
# Analyze workflow success rates over time
gh run list --limit 200 --workflow "CI" --json conclusion,createdAt,displayTitle | jq '
  map({
    date: (.createdAt | split("T")[0]),
    conclusion: .conclusion,
    is_success: (.conclusion == "success")
  }) |
  group_by(.date) |
  map({
    date: .[0].date,
    total_runs: length,
    successful: map(select(.is_success)) | length,
    failed: map(select(.conclusion == "failure")) | length,
    cancelled: map(select(.conclusion == "cancelled")) | length,
    success_rate: ((map(select(.is_success)) | length) / length * 100)
  }) |
  sort_by(.date)
'
```

### Workflow Duration Trends

```bash
# Track workflow duration trends
gh run list --limit 100 --workflow "CI" --json startedAt,updatedAt,conclusion,workflowName | jq '
  map(select(.conclusion == "success") | {
    workflow: .workflowName,
    duration_minutes: ((((.updatedAt | fromdateiso8601) - (.startedAt | fromdateiso8601)) / 60) | floor),
    date: (.startedAt | split("T")[0])
  }) |
  group_by(.date) |
  map({
    date: .[0].date,
    runs: length,
    avg_duration: (map(.duration_minutes) | add / length),
    min_duration: (map(.duration_minutes) | min),
    max_duration: (map(.duration_minutes) | max),
    p95_duration: (map(.duration_minutes) | sort | .[length * 0.95 | floor])
  }) |
  sort_by(.date) |
  reverse |
  .[0:30]
'
```

## Code Review Patterns

### Review Turnaround Analysis

```bash
# Create review turnaround analysis script
cat > review_turnaround.sh << 'EOF'
#!/bin/bash

# Get recent PRs with reviews
gh pr list --state all --limit 50 --json number,createdAt,author > prs.json

# For each PR, get first review
jq -r '.[] | .number' prs.json | while read pr_num; do
  first_review=$(gh api repos/:owner/:repo/pulls/$pr_num/reviews --jq '
    if length > 0 then
      {
        pr: $pr_num,
        first_review_at: (map(select(.state != "PENDING")) | .[0].submitted_at),
        first_reviewer: (map(select(.state != "PENDING")) | .[0].user.login),
        review_state: (map(select(.state != "PENDING")) | .[0].state)
      }
    else empty end
  ' --arg pr_num "$pr_num" 2>/dev/null)

  if [ ! -z "$first_review" ]; then
    echo "$first_review"
  fi
done | jq -s '.' > pr_reviews.json

# Analyze turnaround times
jq -s '
  .[0] as $prs |
  .[1] as $reviews |
  $prs | map(. as $pr |
    ($reviews | map(select(.pr == ($pr.number | tostring))) | .[0]) as $review |
    if $review and $review.first_review_at then
      {
        pr: .number,
        author: .author.login,
        created: (.createdAt | fromdateiso8601),
        first_review: ($review.first_review_at | fromdateiso8601),
        turnaround_hours: ((($review.first_review_at | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 3600),
        reviewer: $review.first_reviewer,
        review_type: $review.review_state
      }
    else empty end
  ) |
  {
    total_reviewed: length,
    avg_turnaround_hours: (map(.turnaround_hours) | add / length),
    median_turnaround_hours: (map(.turnaround_hours) | sort | .[length/2]),
    review_types: group_by(.review_type) | map({type: .[0].review_type, count: length}),
    top_reviewers: group_by(.reviewer) | map({reviewer: .[0].reviewer, count: length}) | sort_by(.count) | reverse | .[0:10]
  }
' prs.json pr_reviews.json
EOF

chmod +x review_turnaround.sh
```

## Repository Health Metrics

### Overall Health Score

```bash
# Calculate repository health metrics
cat > repo_health.sh << 'EOF'
#!/bin/bash

OWNER=$1
REPO=$2

# Gather metrics
echo "Gathering repository health metrics..."

# Basic stats
STATS=$(gh api repos/$OWNER/$REPO --jq '{
  stars: .stargazers_count,
  forks: .forks_count,
  open_issues: .open_issues_count,
  watchers: .subscribers_count
}')

# Recent activity
RECENT_COMMITS=$(gh api repos/$OWNER/$REPO/commits --jq 'length')
RECENT_PRS=$(gh pr list --repo $OWNER/$REPO --state all --limit 30 --json createdAt | jq '
  map(select((.createdAt | fromdateiso8601) > (now - 30*24*60*60))) | length
')
RECENT_ISSUES=$(gh issue list --repo $OWNER/$REPO --state all --limit 30 --json createdAt | jq '
  map(select((.createdAt | fromdateiso8601) > (now - 30*24*60*60))) | length
')

# PR metrics
PR_METRICS=$(gh pr list --repo $OWNER/$REPO --state all --limit 100 --json state,createdAt,closedAt | jq '
  {
    open_prs: map(select(.state == "OPEN")) | length,
    merge_rate: (map(select(.state == "MERGED")) | length) / length * 100,
    avg_pr_age_days: (
      map(select(.state == "OPEN") |
      ((now - (.createdAt | fromdateiso8601)) / 86400)) |
      if length > 0 then add / length else 0 end
    )
  }
')

# Issue metrics
ISSUE_METRICS=$(gh issue list --repo $OWNER/$REPO --state all --limit 100 --json state,createdAt,closedAt | jq '
  {
    open_issues: map(select(.state == "OPEN")) | length,
    close_rate: (map(select(.state == "CLOSED")) | length) / length * 100,
    avg_issue_age_days: (
      map(select(.state == "OPEN") |
      ((now - (.createdAt | fromdateiso8601)) / 86400)) |
      if length > 0 then add / length else 0 end
    )
  }
')

# Combine all metrics
echo "$STATS" | jq --argjson recent_commits "$RECENT_COMMITS" \
  --argjson recent_prs "$RECENT_PRS" \
  --argjson recent_issues "$RECENT_ISSUES" \
  --argjson pr_metrics "$PR_METRICS" \
  --argjson issue_metrics "$ISSUE_METRICS" '
  . + {
    recent_activity: {
      commits_30d: $recent_commits,
      prs_30d: $recent_prs,
      issues_30d: $recent_issues
    },
    pr_health: $pr_metrics,
    issue_health: $issue_metrics,
    health_score: (
      (if .stars > 100 then 10 else .stars / 10 end) +
      (if $recent_commits > 20 then 20 else $recent_commits end) +
      (if $pr_metrics.merge_rate > 80 then 20 else $pr_metrics.merge_rate / 4 end) +
      (if $pr_metrics.avg_pr_age_days < 7 then 20 else if $pr_metrics.avg_pr_age_days < 14 then 10 else 0 end end) +
      (if $issue_metrics.close_rate > 80 then 20 else $issue_metrics.close_rate / 4 end) +
      (if $issue_metrics.avg_issue_age_days < 30 then 10 else if $issue_metrics.avg_issue_age_days < 60 then 5 else 0 end end)
    )
  }
'
EOF

chmod +x repo_health.sh
# Usage: ./repo_health.sh owner repo
```

## Export and Visualization Prep

### CSV Export for Spreadsheets

```bash
# Export PR data to CSV
gh pr list --state all --limit 1000 --json number,title,author,createdAt,closedAt,additions,deletions,labels | jq -r '
  ["Number","Title","Author","Created","Closed","Additions","Deletions","Labels"] as $headers |
  $headers,
  (.[] | [
    .number,
    .title,
    .author.login,
    .createdAt,
    .closedAt // "still_open",
    .additions,
    .deletions,
    ([.labels[].name] | join(";"))
  ]) |
  @csv
' > pr_data.csv
```

### Time Series Data for Graphing

```bash
# Generate time series data for PR activity
gh pr list --state all --limit 500 --json createdAt,mergedAt,closedAt | jq -r '
  ["Date","Created","Merged","Closed"] as $headers |
  $headers,
  (
    map({created: (.createdAt | split("T")[0])}) |
    group_by(.created) |
    map({date: .[0].created, created: length}) as $created |

    map(select(.mergedAt) | {merged: (.mergedAt | split("T")[0])}) |
    group_by(.merged) |
    map({date: .[0].merged, merged: length}) as $merged |

    map(select(.closedAt) | {closed: (.closedAt | split("T")[0])}) |
    group_by(.closed) |
    map({date: .[0].closed, closed: length}) as $closed |

    (($created | map(.date)) + ($merged | map(.date)) + ($closed | map(.date))) | unique | sort |
    map(. as $date |
      {
        date: $date,
        created: (($created | map(select(.date == $date)) | .[0].created) // 0),
        merged: (($merged | map(select(.date == $date)) | .[0].merged) // 0),
        closed: (($closed | map(select(.date == $date)) | .[0].closed) // 0)
      }
    ) |
    map([.date, .created, .merged, .closed])
  ) |
  .[] |
  @csv
' > pr_time_series.csv
```