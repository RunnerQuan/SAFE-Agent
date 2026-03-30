# Complex GraphQL Queries

This reference provides advanced GraphQL queries for extracting complex data from GitHub.

## Repository Analytics

### Comprehensive Repository Stats

```bash
# Get detailed repository statistics
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      name
      stargazerCount
      forkCount
      watchers {
        totalCount
      }
      issues {
        totalCount
      }
      pullRequests {
        totalCount
      }
      releases {
        totalCount
      }
      diskUsage
      primaryLanguage {
        name
      }
      languages(first: 10) {
        edges {
          node {
            name
          }
          size
        }
        totalSize
      }
    }
  }
' -f owner=myorg -f repo=myrepo
```

### Contributor Activity Analysis

```bash
# Get top contributors with detailed stats
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100) {
              nodes {
                author {
                  name
                  email
                  user {
                    login
                  }
                }
                committedDate
                additions
                deletions
              }
            }
          }
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo | jq '
  .data.repository.defaultBranchRef.target.history.nodes |
  group_by(.author.user.login // .author.name) |
  map({
    author: .[0].author.user.login // .[0].author.name,
    commits: length,
    additions: map(.additions) | add,
    deletions: map(.deletions) | add
  }) |
  sort_by(.commits) |
  reverse
'
```

## Pull Request Analytics

### PR Lifecycle Metrics

```bash
# Analyze PR lifecycle times
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(last: 100, states: MERGED) {
        nodes {
          number
          title
          createdAt
          mergedAt
          author {
            login
          }
          timelineItems(first: 100, itemTypes: [READY_FOR_REVIEW_EVENT, REVIEW_REQUESTED_EVENT, PULL_REQUEST_REVIEW]) {
            nodes {
              __typename
              ... on ReadyForReviewEvent {
                createdAt
              }
              ... on ReviewRequestedEvent {
                createdAt
              }
              ... on PullRequestReview {
                createdAt
                state
              }
            }
          }
          commits {
            totalCount
          }
          changedFiles
          additions
          deletions
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo
```

### PR Review Patterns

```bash
# Analyze review patterns and reviewer load
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(last: 50, states: [OPEN, MERGED]) {
        nodes {
          number
          reviews(first: 20) {
            nodes {
              author {
                login
              }
              state
              createdAt
              comments {
                totalCount
              }
            }
          }
          reviewRequests(first: 10) {
            nodes {
              requestedReviewer {
                ... on User {
                  login
                }
                ... on Team {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo | jq '
  .data.repository.pullRequests.nodes |
  map(.reviews.nodes) |
  flatten |
  group_by(.author.login) |
  map({
    reviewer: .[0].author.login,
    total_reviews: length,
    approved: map(select(.state == "APPROVED")) | length,
    changes_requested: map(select(.state == "CHANGES_REQUESTED")) | length,
    avg_comments: (map(.comments.totalCount) | add) / length
  })
'
```

## Issue Analysis

### Issue Resolution Times

```bash
# Calculate issue resolution metrics
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      issues(last: 100, states: CLOSED) {
        nodes {
          number
          title
          createdAt
          closedAt
          labels(first: 10) {
            nodes {
              name
            }
          }
          timelineItems(first: 50, itemTypes: [ASSIGNED_EVENT, LABELED_EVENT, ISSUE_COMMENT]) {
            nodes {
              __typename
              ... on AssignedEvent {
                createdAt
                assignee {
                  ... on User {
                    login
                  }
                }
              }
              ... on LabeledEvent {
                createdAt
                label {
                  name
                }
              }
              ... on IssueComment {
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
  }
' -f owner=myorg -f repo=myrepo | jq '
  .data.repository.issues.nodes |
  map({
    number: .number,
    title: .title,
    resolution_time_hours: (((.closedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 3600 | floor),
    labels: [.labels.nodes[].name],
    first_response: (
      .timelineItems.nodes |
      map(select(.__typename == "IssueComment")) |
      first |
      .createdAt
    ),
    assignee_count: (
      .timelineItems.nodes |
      map(select(.__typename == "AssignedEvent")) |
      length
    )
  })
'
```

### Issue Dependencies

```bash
# Find linked issues and dependencies
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      issues(last: 50, states: OPEN) {
        nodes {
          number
          title
          bodyText
          timelineItems(first: 100, itemTypes: [CROSS_REFERENCED_EVENT]) {
            nodes {
              ... on CrossReferencedEvent {
                source {
                  ... on Issue {
                    number
                    title
                    state
                  }
                  ... on PullRequest {
                    number
                    title
                    state
                  }
                }
              }
            }
          }
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo
```

## Project and Milestone Tracking

### Project Progress

```bash
# Get project board status
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      projectsV2(first: 10) {
        nodes {
          title
          items(first: 100) {
            nodes {
              content {
                ... on Issue {
                  number
                  title
                  state
                }
                ... on PullRequest {
                  number
                  title
                  state
                }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo
```

## Team Performance Queries

### Team Contribution Analysis

```bash
# Analyze team contributions across repos
gh api graphql -f query='
  query($org: String!, $team: String!) {
    organization(login: $org) {
      team(slug: $team) {
        members(first: 50) {
          nodes {
            login
            contributionsCollection {
              totalCommitContributions
              totalPullRequestContributions
              totalPullRequestReviewContributions
              totalIssueContributions
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      }
    }
  }
' -f org=myorg -f team=myteam
```

## Code Review Quality Metrics

### Review Depth Analysis

```bash
# Analyze code review quality metrics
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(last: 30, states: MERGED) {
        nodes {
          number
          title
          reviews(first: 20) {
            nodes {
              author {
                login
              }
              state
              comments(first: 50) {
                nodes {
                  path
                  diffHunk
                  body
                }
                totalCount
              }
            }
          }
          reviewThreads(first: 50) {
            nodes {
              isResolved
              comments(first: 20) {
                nodes {
                  author {
                    login
                  }
                  body
                }
                totalCount
              }
            }
          }
        }
      }
    }
  }
' -f owner=myorg -f repo=myrepo | jq '
  .data.repository.pullRequests.nodes |
  map({
    pr_number: .number,
    review_quality: {
      total_reviews: .reviews.nodes | length,
      reviews_with_comments: (.reviews.nodes | map(select(.comments.totalCount > 0)) | length),
      total_review_comments: (.reviews.nodes | map(.comments.totalCount) | add),
      resolved_threads: (.reviewThreads.nodes | map(select(.isResolved)) | length),
      total_threads: .reviewThreads.nodes | length,
      avg_thread_length: (
        if (.reviewThreads.nodes | length) > 0 then
          (.reviewThreads.nodes | map(.comments.totalCount) | add) / (.reviewThreads.nodes | length)
        else 0 end
      )
    }
  })
'
```

## Usage Tips

1. **Pagination**: For queries returning many results, use cursor-based pagination:
   ```graphql
   pullRequests(first: 100, after: $cursor) {
     pageInfo {
       endCursor
       hasNextPage
     }
     nodes { ... }
   }
   ```

2. **Rate Limiting**: GraphQL queries consume API points based on complexity. Use the rateLimit field to monitor:
   ```graphql
   rateLimit {
     remaining
     resetAt
   }
   ```

3. **Field Aliases**: Use aliases to query the same field with different parameters:
   ```graphql
   openIssues: issues(states: OPEN) { totalCount }
   closedIssues: issues(states: CLOSED) { totalCount }
   ```

4. **Fragments**: Reuse common field selections:
   ```graphql
   fragment UserInfo on User {
     login
     name
     avatarUrl
   }
   ```