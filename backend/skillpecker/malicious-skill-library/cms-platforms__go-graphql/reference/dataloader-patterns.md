# gqlgen Dataloader Patterns

## Overview

Dataloaders solve the N+1 query problem by batching and caching database calls within a single request.

## Basic Setup with dataloaden

### Generate Dataloader

```bash
# Install dataloaden
go install github.com/vektah/dataloaden@latest

# Generate loader for User type
dataloaden UserLoader string *myapp/graph/model.User
```

### Generated Loader Interface

```go
// userloader_gen.go (generated)
type UserLoader struct {
    // ...
}

func (l *UserLoader) Load(key string) (*model.User, error)
func (l *UserLoader) LoadAll(keys []string) ([]*model.User, []error)
func (l *UserLoader) Prime(key string, value *model.User)
func (l *UserLoader) Clear(key string)
```

## Implementation Pattern

### Loader Factory

```go
// graph/dataloader/loaders.go
package dataloader

import (
    "context"
    "time"

    "github.com/vikstrous/dataloadgen"
    "myapp/graph/model"
    "myapp/internal/repository"
)

type Loaders struct {
    UserLoader *dataloadgen.Loader[string, *model.User]
    PostLoader *dataloadgen.Loader[string, *model.Post]
}

func NewLoaders(userRepo *repository.UserRepository, postRepo *repository.PostRepository) *Loaders {
    return &Loaders{
        UserLoader: dataloadgen.NewLoader(
            func(ctx context.Context, keys []string) ([]*model.User, []error) {
                return userRepo.GetByIDs(ctx, keys)
            },
            dataloadgen.WithWait(2*time.Millisecond),
        ),
        PostLoader: dataloadgen.NewLoader(
            func(ctx context.Context, keys []string) ([]*model.Post, []error) {
                return postRepo.GetByIDs(ctx, keys)
            },
            dataloadgen.WithWait(2*time.Millisecond),
        ),
    }
}
```

### Batch Function

```go
// Batch function must return results in the same order as keys
func (r *UserRepository) GetByIDs(ctx context.Context, ids []string) ([]*model.User, []error) {
    // Fetch all users in a single query
    users, err := r.db.User.Query().
        Where(user.IDIn(ids...)).
        All(ctx)
    if err != nil {
        errors := make([]error, len(ids))
        for i := range errors {
            errors[i] = err
        }
        return nil, errors
    }

    // Map results to match key order
    userMap := make(map[string]*model.User)
    for _, u := range users {
        userMap[u.ID] = u
    }

    // Return in order of input keys
    result := make([]*model.User, len(ids))
    errs := make([]error, len(ids))
    for i, id := range ids {
        if u, ok := userMap[id]; ok {
            result[i] = u
        } else {
            errs[i] = fmt.Errorf("user %s not found", id)
        }
    }

    return result, errs
}
```

### Middleware Integration

```go
// Inject loaders into context via middleware
func DataloaderMiddleware(loaders *dataloader.Loaders) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx := context.WithValue(r.Context(), loadersKey, loaders)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

// Helper to get loaders from context
func For(ctx context.Context) *Loaders {
    return ctx.Value(loadersKey).(*Loaders)
}
```

### Using in Resolver

```go
// graph/schema.resolvers.go

// Author is the resolver for the Post.author field
func (r *postResolver) Author(ctx context.Context, obj *model.Post) (*model.User, error) {
    // This will batch multiple author loads into a single query
    return dataloader.For(ctx).UserLoader.Load(ctx, obj.AuthorID)
}

// Comments resolver with dataloader
func (r *postResolver) Comments(ctx context.Context, obj *model.Post) ([]*model.Comment, error) {
    return dataloader.For(ctx).CommentsByPostLoader.Load(ctx, obj.ID)
}
```

## Slice Dataloader (One-to-Many)

```go
// For relationships that return slices
type PostsByAuthorLoader struct {
    // ...
}

func NewPostsByAuthorLoader(repo *repository.PostRepository) *PostsByAuthorLoader {
    return &PostsByAuthorLoader{
        fetch: func(ctx context.Context, authorIDs []string) ([][]*model.Post, []error) {
            posts, err := repo.GetByAuthorIDs(ctx, authorIDs)
            if err != nil {
                // Return error for all keys
            }

            // Group posts by author ID
            postsByAuthor := make(map[string][]*model.Post)
            for _, p := range posts {
                postsByAuthor[p.AuthorID] = append(postsByAuthor[p.AuthorID], p)
            }

            // Return in order of input keys
            result := make([][]*model.Post, len(authorIDs))
            for i, id := range authorIDs {
                result[i] = postsByAuthor[id]
            }
            return result, nil
        },
    }
}
```

## Key Detection Patterns

```bash
# Find dataloader usage
grep -rn "dataloader\|dataloaden\|dataloadgen" --include="*.go"

# Find batch functions
grep -rn "func.*\[\]string.*\[\]\*model" --include="*.go"

# Find loader initialization
grep -rn "NewLoader\|\.Load(" --include="*.go"

# Find context injection
grep -rn "WithValue.*loader\|loadersKey" --include="*.go"

# Check for N+1 patterns (potential issues)
grep -rn "func.*Resolver\).*ctx.*obj" --include="*.go" | grep -v "Load("
```

## N+1 Detection

Signs of N+1 problems:
- Field resolver making direct database calls without dataloader
- `for` loops with database queries inside
- Multiple SQL queries for loading related entities

```go
// BAD: N+1 problem
func (r *postResolver) Author(ctx context.Context, obj *model.Post) (*model.User, error) {
    return r.UserService.GetByID(ctx, obj.AuthorID) // Called N times!
}

// GOOD: Using dataloader
func (r *postResolver) Author(ctx context.Context, obj *model.Post) (*model.User, error) {
    return dataloader.For(ctx).UserLoader.Load(ctx, obj.AuthorID) // Batched!
}
```
