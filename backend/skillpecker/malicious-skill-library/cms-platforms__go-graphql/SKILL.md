---
name: go-graphql
description: Analyze Go GraphQL projects using gqlgen. Use when onboarding to Go GraphQL APIs, understanding schema design, analyzing resolver implementations, reviewing directive usage, examining dataloaders, identifying N+1 query patterns, and generating GraphQL API documentation.
context: fork
agent: graphql-architect
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Task
  - Write
  - WebFetch
  - WebSearch
---

## Purpose

Provide comprehensive analysis of Go GraphQL projects built with gqlgen to help developers quickly understand schema design, resolver patterns, and GraphQL-specific implementations. This skill leverages the graphql-architect agent for deep GraphQL analysis.

## When to Use

Use this skill when you need to:

- **Onboard to a gqlgen project** - Understand the full GraphQL API structure
- **Analyze schema design** - Review types, queries, mutations, subscriptions
- **Review resolver implementations** - Understand how queries are resolved
- **Examine directive usage** - Find custom directives and their handlers
- **Identify dataloaders** - Analyze batching and caching patterns
- **Detect N+1 problems** - Find potential performance issues
- **Document the GraphQL API** - Generate schema documentation
- **Understand federation** - Analyze Apollo Federation setup

## gqlgen Detection

### Identifying gqlgen Projects

Check for gqlgen markers:

```bash
# Check go.mod for gqlgen
grep "github.com/99designs/gqlgen" go.mod

# Find gqlgen config
find . -name "gqlgen.yml" -o -name "gqlgen.yaml" -o -name ".gqlgen.yml"

# Find generated files
find . -name "generated.go" -path "*/graph/*"
```

### gqlgen Project Structure

```
project/
├── graph/
│   ├── generated/           # Auto-generated code (DO NOT EDIT)
│   │   └── generated.go
│   ├── model/               # Generated and custom models
│   │   └── models_gen.go
│   ├── resolver.go          # Root resolver
│   ├── schema.resolvers.go  # Schema resolver implementations
│   └── schema.graphqls      # GraphQL schema definition
├── gqlgen.yml               # gqlgen configuration
└── server.go                # Server entry point
```

## Analysis Checklist

### 1. Schema Analysis

```bash
# Find all schema files
find . -name "*.graphqls" -o -name "*.graphql"

# Count types, queries, mutations
grep -c "^type " *.graphqls
grep -c "^input " *.graphqls
grep -c "^enum " *.graphqls
grep -c "^interface " *.graphqls

# Find Query type
grep -A 50 "^type Query" *.graphqls

# Find Mutation type
grep -A 50 "^type Mutation" *.graphqls

# Find Subscription type
grep -A 20 "^type Subscription" *.graphqls
```

### 2. Resolver Analysis

```bash
# Find resolver files
find . -name "*resolver*.go"

# Find resolver struct
grep -rn "type Resolver struct" --include="*.go"

# Find query resolvers
grep -rn "func.*QueryResolver" --include="*.go"

# Find mutation resolvers
grep -rn "func.*MutationResolver" --include="*.go"

# Find field resolvers
grep -rn "func.*Resolver\)" --include="*.go" | grep -v "Query\|Mutation"
```

### 3. Directive Analysis

```bash
# Find directive definitions in schema
grep -rn "^directive @" --include="*.graphqls"

# Find directive implementations
grep -rn "DirectiveRoot" --include="*.go"

# Common directives
grep -rn "@auth\|@hasRole\|@deprecated\|@cacheControl" --include="*.graphqls"
```

### 4. Dataloader Analysis

```bash
# Find dataloader implementations
grep -rn "dataloader\|DataLoader\|Loader" --include="*.go"

# Find batch functions
grep -rn "func.*Batch\|func.*Load" --include="*.go"

# Check for dataloaden usage
grep "github.com/vektah/dataloaden" go.mod
```

### 5. Model Analysis

```bash
# Find model definitions
find . -name "*model*.go" -o -name "*models*.go"

# Find custom scalars
grep -rn "MarshalGQL\|UnmarshalGQL" --include="*.go"

# Find model bindings in gqlgen.yml
grep -A 20 "models:" gqlgen.yml
```

### 6. Subscription Analysis

```bash
# Find subscription resolvers
grep -rn "func.*SubscriptionResolver" --include="*.go"

# Find channel usage in subscriptions
grep -rn "chan.*<-\|<-chan" --include="*resolver*.go"
```

### 7. Federation Analysis (if applicable)

```bash
# Check for federation
grep -rn "@key\|@external\|@requires\|@provides" --include="*.graphqls"

# Find entity resolvers
grep -rn "func.*EntityResolver\|func.*Entity\(" --include="*.go"

# Check federation config
grep "federation:" gqlgen.yml
```

## gqlgen Configuration Analysis

Key sections in `gqlgen.yml`:

```yaml
# Schema location
schema:
  - graph/*.graphqls

# Generated code output
exec:
  filename: graph/generated/generated.go
  package: generated

# Model generation
model:
  filename: graph/model/models_gen.go
  package: model

# Resolver configuration
resolver:
  layout: follow-schema  # or single-file
  dir: graph
  package: graph

# Model bindings (map GraphQL to Go types)
models:
  ID:
    model:
      - github.com/99designs/gqlgen/graphql.ID
  DateTime:
    model:
      - github.com/99designs/gqlgen/graphql.Time

# Federation v2
federation:
  filename: graph/federation.go
  package: graph
  version: 2
```

## Common Patterns

### Resolver Pattern

See `reference/resolver-patterns.md` for detailed patterns.

```go
// Query resolver
func (r *queryResolver) Users(ctx context.Context) ([]*model.User, error) {
    return r.UserService.List(ctx)
}

// Field resolver (for computed fields)
func (r *userResolver) FullName(ctx context.Context, obj *model.User) (string, error) {
    return obj.FirstName + " " + obj.LastName, nil
}
```

### Dataloader Pattern

See `reference/dataloader-patterns.md` for detailed patterns.

```go
// Batch function
func (r *Resolver) UserLoader(ctx context.Context, keys []string) ([]*model.User, []error) {
    users, err := r.UserService.GetByIDs(ctx, keys)
    // Map results to match key order...
}
```

### Directive Pattern

See `reference/directive-patterns.md` for detailed patterns.

```go
// Auth directive
func Auth(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
    user := auth.ForContext(ctx)
    if user == nil {
        return nil, errors.New("unauthorized")
    }
    return next(ctx)
}
```

## Output Format

Generate a GraphQL API onboarding report with:

### 1. Schema Overview
- Total types, queries, mutations, subscriptions
- Custom scalars and enums
- Interface and union types

### 2. Schema Diagram (Mermaid)

Generate `docs/graphql-schema.md` with schema visualization:

```markdown
# GraphQL Schema

## Type Relationships

\`\`\`mermaid
<!-- See reference/schema-diagram.mmd -->
\`\`\`

## Operations

| Type | Operation | Return Type | Description |
|------|-----------|-------------|-------------|
| Query | users | [User!]! | List all users |
| Query | user(id: ID!) | User | Get user by ID |
| Mutation | createUser | User! | Create new user |
```

### 3. Resolver Map
- Query resolvers and their implementations
- Mutation resolvers
- Field resolvers (computed fields)
- Subscription resolvers

### 4. Directive Reference
- Custom directives and their purposes
- Directive handlers and implementations

### 5. Dataloader Analysis
- Identified dataloaders
- Batch functions
- Potential N+1 issues

### 6. Key Files

Recommended reading order:
1. `gqlgen.yml` - Configuration
2. `graph/schema.graphqls` - Schema definition
3. `graph/resolver.go` - Root resolver
4. `graph/schema.resolvers.go` - Resolver implementations
5. `graph/model/` - Data models
6. Directive handlers (if any)
7. Dataloader implementations (if any)

## Performance Checklist

- [ ] Dataloaders used for relationship loading
- [ ] No N+1 queries in field resolvers
- [ ] Query complexity/depth limits configured
- [ ] Proper error handling in resolvers
- [ ] Context cancellation handled
- [ ] Subscriptions properly cleaned up
