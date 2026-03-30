# gqlgen Directive Patterns

## Schema Definition

### Auth Directive

```graphql
# schema.graphqls

directive @auth on FIELD_DEFINITION
directive @hasRole(role: Role!) on FIELD_DEFINITION

enum Role {
  ADMIN
  USER
  GUEST
}

type Query {
  me: User! @auth
  users: [User!]! @auth @hasRole(role: ADMIN)
  publicPosts: [Post!]!
}
```

### Validation Directive

```graphql
directive @validate(
  min: Int
  max: Int
  pattern: String
) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION

input CreateUserInput {
  email: String! @validate(pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
  name: String! @validate(min: 2, max: 100)
  age: Int @validate(min: 0, max: 150)
}
```

### Caching Directive

```graphql
directive @cacheControl(
  maxAge: Int
  scope: CacheControlScope
) on FIELD_DEFINITION | OBJECT

enum CacheControlScope {
  PUBLIC
  PRIVATE
}

type User @cacheControl(maxAge: 300) {
  id: ID!
  email: String! @cacheControl(maxAge: 0, scope: PRIVATE)
  name: String!
}
```

## gqlgen Configuration

```yaml
# gqlgen.yml

directives:
  auth:
    # Skip implementation - handled in server.go
  hasRole:
    # Skip implementation - handled in server.go
  validate:
    # Skip implementation
  cacheControl:
    # Skip implementation
```

## Directive Implementation

### Server Setup

```go
// server.go
package main

import (
    "myapp/graph"
    "myapp/graph/generated"
    "myapp/internal/auth"
    "github.com/99designs/gqlgen/graphql/handler"
)

func main() {
    resolver := graph.NewResolver(/* dependencies */)

    config := generated.Config{
        Resolvers: resolver,
        Directives: generated.DirectiveRoot{
            Auth:      auth.AuthDirective,
            HasRole:   auth.HasRoleDirective,
            Validate:  validation.ValidateDirective,
        },
    }

    srv := handler.NewDefaultServer(generated.NewExecutableSchema(config))
    // ...
}
```

### Auth Directive Implementation

```go
// internal/auth/directives.go
package auth

import (
    "context"
    "errors"

    "github.com/99designs/gqlgen/graphql"
)

func AuthDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
    user := ForContext(ctx)
    if user == nil {
        return nil, errors.New("unauthorized: authentication required")
    }
    return next(ctx)
}
```

### HasRole Directive Implementation

```go
func HasRoleDirective(ctx context.Context, obj interface{}, next graphql.Resolver, role model.Role) (interface{}, error) {
    user := ForContext(ctx)
    if user == nil {
        return nil, errors.New("unauthorized: authentication required")
    }

    // Check if user has required role
    hasRole := false
    for _, r := range user.Roles {
        if r == role {
            hasRole = true
            break
        }
    }

    if !hasRole {
        return nil, fmt.Errorf("forbidden: requires role %s", role)
    }

    return next(ctx)
}
```

### Validation Directive Implementation

```go
// internal/validation/directives.go
package validation

import (
    "context"
    "fmt"
    "regexp"

    "github.com/99designs/gqlgen/graphql"
)

func ValidateDirective(ctx context.Context, obj interface{}, next graphql.Resolver, min *int, max *int, pattern *string) (interface{}, error) {
    // Get the field value
    val, err := next(ctx)
    if err != nil {
        return nil, err
    }

    // String validation
    if str, ok := val.(string); ok {
        if min != nil && len(str) < *min {
            return nil, fmt.Errorf("value must be at least %d characters", *min)
        }
        if max != nil && len(str) > *max {
            return nil, fmt.Errorf("value must be at most %d characters", *max)
        }
        if pattern != nil {
            matched, _ := regexp.MatchString(*pattern, str)
            if !matched {
                return nil, fmt.Errorf("value does not match required pattern")
            }
        }
    }

    // Int validation
    if num, ok := val.(int); ok {
        if min != nil && num < *min {
            return nil, fmt.Errorf("value must be at least %d", *min)
        }
        if max != nil && num > *max {
            return nil, fmt.Errorf("value must be at most %d", *max)
        }
    }

    return val, nil
}
```

### Cache Control Directive

```go
func CacheControlDirective(ctx context.Context, obj interface{}, next graphql.Resolver, maxAge int, scope *model.CacheControlScope) (interface{}, error) {
    // Set cache hints on context
    graphql.GetFieldContext(ctx).SetCacheHint(graphql.CacheHint{
        MaxAge: maxAge,
        Scope:  string(*scope),
    })

    return next(ctx)
}
```

## Field-Level Authorization

```go
// Directive that checks ownership
func IsOwnerDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
    user := auth.ForContext(ctx)
    if user == nil {
        return nil, errors.New("unauthorized")
    }

    // Check if the object belongs to the user
    if owned, ok := obj.(interface{ GetOwnerID() string }); ok {
        if owned.GetOwnerID() != user.ID {
            return nil, errors.New("forbidden: not the owner")
        }
    }

    return next(ctx)
}
```

## Key Detection Patterns

```bash
# Find directive definitions in schema
grep -rn "^directive @" --include="*.graphqls"

# Find directive usage in schema
grep -rn "@auth\|@hasRole\|@validate\|@cache" --include="*.graphqls"

# Find directive implementations
grep -rn "DirectiveRoot\|Directives:" --include="*.go" --include="*.yml"

# Find directive handlers
grep -rn "func.*Directive.*graphql.Resolver" --include="*.go"

# Find config in gqlgen.yml
grep -A 10 "directives:" gqlgen.yml
```
