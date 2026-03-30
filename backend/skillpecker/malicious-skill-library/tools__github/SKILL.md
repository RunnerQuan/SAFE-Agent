---
name: github
description: GitHub CLI (gh) tool for retrieving and analyzing GitHub data including pull requests, issues, code search, workflow runs, releases, and repository information. Use when needing to read GitHub PRs, view comments, check CI/CD status, search code across repos, analyze issues, inspect action logs, or query any GitHub data. Focuses on information retrieval and analysis rather than modifications.
allowed-tools: "Bash(gh repo list:*), Bash(gh repo view:*), Bash(gh pr list:*), Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr checks:*), Bash(gh issue list:*), Bash(gh run view:*), Bash(gh search:*)"
---

# GitHub CLI (gh) Skill

This skill provides comprehensive guidance for using the GitHub CLI (`gh`) tool to retrieve and analyze information from GitHub repositories, pull requests, issues, and workflows.

## Prerequisites

Ensure `gh` is installed and authenticated:

```bash
# Check if gh is installed
gh --version

# Authenticate with GitHub (if not already done)
gh auth login

# Check authentication status
gh auth status
```

## Repository Information

### Viewing Repository Details

```bash
# View repository info
gh repo view owner/repo

# View repository README
gh repo view owner/repo --web

# Get repository metadata as JSON
gh api repos/owner/repo

# Get specific fields
gh api repos/owner/repo --jq '.stargazers_count, .forks_count, .open_issues_count'

# List repositories for an organization
gh repo list orgname --limit 100

# Search repositories
gh search repos "language:go stars:>1000"
```

### Repository Statistics

```bash
# Get contributor statistics
gh api repos/owner/repo/contributors

# Get commit activity
gh api repos/owner/repo/stats/commit_activity

# Get code frequency
gh api repos/owner/repo/stats/code_frequency

# Get language breakdown
gh api repos/owner/repo/languages
```

## Pull Request Analysis

### Viewing PR Information

```bash
# List PRs with various filters
gh pr list
gh pr list --state all
gh pr list --state merged --limit 100
gh pr list --author username
gh pr list --label "bug"
gh pr list --search "fix memory leak"

# View detailed PR info
gh pr view 123
gh pr view 123 --comments  # Include all comments
gh pr view 123 --web       # Open in browser

# Get PR data as JSON for analysis
gh pr view 123 --json number,title,author,state,createdAt,closedAt,files

# View PR diff
gh pr diff 123
gh pr diff 123 --patch  # Get as patch format
```

### Analyzing PR Comments and Reviews

```bash
# Get all comments on a PR
gh api repos/owner/repo/issues/123/comments

# Get review comments (inline code comments)
gh api repos/owner/repo/pulls/123/comments

# Get PR reviews
gh api repos/owner/repo/pulls/123/reviews

# Get review comments with context
gh api repos/owner/repo/pulls/123/comments --jq '.[] | {path: .path, line: .line, body: .body}'

# Get conversation threads
gh pr view 123 --json comments --jq '.comments[].body'
```

### PR File Changes

```bash
# List files changed in a PR
gh pr view 123 --json files --jq '.files[].path'

# Get detailed file change info
gh api repos/owner/repo/pulls/123/files

# See additions/deletions per file
gh api repos/owner/repo/pulls/123/files --jq '.[] | "\(.filename): +\(.additions) -\(.deletions)"'

# Check if specific files were modified
gh pr view 123 --json files --jq '.files[].path | select(test(".*\\.go$"))'
```

## Issue Discovery and Analysis

### Searching and Listing Issues

```bash
# List issues with filters
gh issue list
gh issue list --state all
gh issue list --label "bug" --label "priority"
gh issue list --assignee @me
gh issue list --search "memory leak"
gh issue list --milestone "v2.0"

# Search issues across multiple repos
gh search issues "org:myorg memory leak"
gh search issues "is:open is:issue label:bug created:>2024-01-01"

# Get issue details
gh issue view 456
gh issue view 456 --comments
gh issue view 456 --json title,body,comments,labels,assignees
```

### Issue Analytics

```bash
# Count issues by label
gh issue list --label "bug" --json number --jq 'length'

# Get issue timeline
gh api repos/owner/repo/issues/456/timeline

# Find issues created in date range
gh issue list --search "created:2024-01-01..2024-01-31"

# Get issue participants
gh api repos/owner/repo/issues/456 --jq '.assignees[].login, .user.login'
```

## GitHub Actions and Workflow Analysis

### Viewing Workflow Runs

```bash
# List recent workflow runs
gh run list
gh run list --limit 50
gh run list --workflow "CI"
gh run list --status failure

# View specific run details
gh run view 12345
gh run view 12345 --json conclusion,status,displayTitle,startedAt

# Get run timing information
gh run view 12345 --json name,startedAt,updatedAt --jq '"\(.name) took \(((.updatedAt | fromdateiso8601) - (.startedAt | fromdateiso8601)) / 60 | floor) minutes"'
```

### Analyzing Workflow Logs

```bash
# View run logs
gh run view 12345 --log
gh run view 12345 --log-failed  # Only failed steps

# Get logs for specific job
gh run view 12345 --log --job 67890

# Search logs for patterns
gh run view 12345 --log | grep -i "error"
gh run view 12345 --log | grep -A 5 -B 5 "test failed"

# Download logs for offline analysis
gh run download 12345 --name logs
```

### Workflow Performance Analysis

```bash
# Get workflow run history
gh api repos/owner/repo/actions/workflows/ci.yml/runs

# Analyze success rate
gh run list --workflow "CI" --limit 100 --json conclusion | \
  jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})'

# Get average run duration
gh run list --workflow "CI" --status completed --limit 20 --json name,startedAt,updatedAt | \
  jq '[.[] | ((.updatedAt | fromdateiso8601) - (.startedAt | fromdateiso8601)) / 60] | add / length'

# Find flaky tests
gh run list --workflow "tests" --limit 50 --json conclusion,headSha | \
  jq 'group_by(.headSha) | map(select(length > 1) | {sha: .[0].headSha, results: map(.conclusion)})'
```

### Artifact Analysis

```bash
# List artifacts for a run
gh run view 12345 --json artifacts --jq '.artifacts[]'

# Download artifacts
gh run download 12345
gh run download 12345 --name "test-results"

# List artifacts for a repository
gh api repos/owner/repo/actions/artifacts

# Get artifact details
gh api repos/owner/repo/actions/artifacts/98765
```

## Code Search and Analysis

### Searching Code Across Repositories

```bash
# Search code in organization
gh search code "org:myorg function fetchUser"
gh search code "org:myorg extension:js console.log"

# Search with language filters
gh search code "org:myorg language:python import pandas"

# Search for specific patterns
gh search code "org:myorg TODO"
gh search code "org:myorg FIXME"
gh search code "org:myorg /api/v[0-9]+"

# Search in specific paths
gh search code "org:myorg path:src/ database connection"
```

### Code Navigation

```bash
# Get file contents
gh api repos/owner/repo/contents/path/to/file.js

# Get file contents at specific ref
gh api repos/owner/repo/contents/path/to/file.js?ref=feature-branch

# Browse directory structure
gh api repos/owner/repo/contents/src

# Get file history
gh api repos/owner/repo/commits?path=src/main.js
```

## Release Information

### Viewing Releases

```bash
# List all releases
gh release list
gh release list --exclude-drafts
gh release list --limit 10

# View specific release
gh release view v1.0.0
gh release view latest

# Get release data as JSON
gh api repos/owner/repo/releases/latest

# Get download statistics
gh api repos/owner/repo/releases --jq '.[] | {tag: .tag_name, downloads: [.assets[].download_count] | add}'
```

## Advanced Queries

### GraphQL Queries for Complex Data

```bash
# Get PR review turnaround time
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(last: 20, states: MERGED) {
        nodes {
          number
          createdAt
          mergedAt
          reviews(first: 1) {
            nodes {
              createdAt
            }
          }
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo

# Get issue response times
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      issues(last: 50, states: CLOSED) {
        nodes {
          number
          createdAt
          comments(first: 1) {
            nodes {
              createdAt
              author {
                login
              }
            }
          }
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo
```

### Batch Data Retrieval

```bash
# Get all PRs for analysis (handles pagination)
gh pr list --state all --limit 1000 --json number,title,createdAt,closedAt,author > prs.json

# Get all issues with labels
gh issue list --state all --limit 1000 --json number,title,labels,createdAt > issues.json

# Export workflow runs
gh run list --limit 200 --json displayTitle,conclusion,startedAt,updatedAt > runs.json
```

## Monitoring and Dashboards

### PR Review Queue

```bash
# Find PRs awaiting review
gh pr list --json number,title,author,createdAt,reviewDecision | \
  jq '.[] | select(.reviewDecision == null) | "PR #\(.number): \(.title) by @\(.author.login)"'

# PRs awaiting your review
gh search prs "is:open is:pr review-requested:@me"

# Recently updated PRs
gh pr list --sort updated --json number,title,updatedAt | \
  jq '.[] | "PR #\(.number): \(.title) (updated \(.updatedAt))"'
```

### Issue Triage

```bash
# Find unlabeled issues
gh issue list --json number,title,labels | \
  jq '.[] | select(.labels | length == 0) | "Issue #\(.number): \(.title)"'

# Stale issues (no activity in 30 days)
gh issue list --search "updated:<$(date -d '30 days ago' '+%Y-%m-%d')"

# High priority issues
gh issue list --label "priority:high" --label "bug"
```

## Best Practices

1. **Use JSON output for scripting**: Add `--json` flag for machine-readable output
2. **Leverage jq for data extraction**: Parse JSON responses for specific fields
3. **Use search syntax**: GitHub's search syntax is powerful for filtering
4. **Handle pagination**: Use `--limit` or `--paginate` for large datasets
5. **Cache API responses**: Use `gh api --cache 1h` for frequently accessed data

## Additional Resources

For more advanced topics:
- **Complex GraphQL Queries**: See [references/graphql-queries.md](references/graphql-queries.md)
- **Data Analysis Patterns**: See [references/data-analysis.md](references/data-analysis.md)
- **Monitoring Scripts**: See [references/monitoring.md](references/monitoring.md)
