# gqlgen Resolver Patterns

## Basic Structure

### Root Resolver

```go
// graph/resolver.go
package graph

import "myapp/internal/service"

// Resolver is the root resolver
type Resolver struct {
    UserService    *service.UserService
    PostService    *service.PostService
    // Add other services...
}

// NewResolver creates a new resolver with dependencies
func NewResolver(
    userSvc *service.UserService,
    postSvc *service.PostService,
) *Resolver {
    return &Resolver{
        UserService: userSvc,
        PostService: postSvc,
    }
}
```

### Query Resolver

```go
// graph/schema.resolvers.go

// Users is the resolver for the users query
func (r *queryResolver) Users(ctx context.Context, first *int, after *string) (*model.UserConnection, error) {
    limit := 10
    if first != nil {
        limit = *first
    }

    users, err := r.UserService.List(ctx, limit, after)
    if err != nil {
        return nil, fmt.Errorf("failed to list users: %w", err)
    }

    return users, nil
}

// User is the resolver for the user query
func (r *queryResolver) User(ctx context.Context, id string) (*model.User, error) {
    user, err := r.UserService.GetByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("user not found: %w", err)
    }
    return user, nil
}
```

### Mutation Resolver

```go
// CreateUser is the resolver for the createUser mutation
func (r *mutationResolver) CreateUser(ctx context.Context, input model.CreateUserInput) (*model.User, error) {
    // Validation
    if input.Email == "" {
        return nil, errors.New("email is required")
    }

    user, err := r.UserService.Create(ctx, &service.CreateUserParams{
        Email:     input.Email,
        FirstName: input.FirstName,
        LastName:  input.LastName,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }

    return user, nil
}
```

### Field Resolver

```go
// Posts is the resolver for the User.posts field
func (r *userResolver) Posts(ctx context.Context, obj *model.User) ([]*model.Post, error) {
    // Using dataloader to avoid N+1
    return r.PostLoader.Load(ctx, obj.ID)
}

// FullName is the resolver for a computed field
func (r *userResolver) FullName(ctx context.Context, obj *model.User) (string, error) {
    return fmt.Sprintf("%s %s", obj.FirstName, obj.LastName), nil
}
```

### Subscription Resolver

```go
// MessageAdded is the resolver for the messageAdded subscription
func (r *subscriptionResolver) MessageAdded(ctx context.Context, roomID string) (<-chan *model.Message, error) {
    // Create channel for this subscription
    ch := make(chan *model.Message, 1)

    // Subscribe to messages
    r.PubSub.Subscribe(ctx, roomID, func(msg *model.Message) {
        select {
        case ch <- msg:
        case <-ctx.Done():
            return
        }
    })

    // Cleanup on context cancellation
    go func() {
        <-ctx.Done()
        close(ch)
    }()

    return ch, nil
}
```

## Error Handling

```go
import "github.com/vektah/gqlparser/v2/gqlerror"

// Return formatted GraphQL error
func (r *queryResolver) User(ctx context.Context, id string) (*model.User, error) {
    user, err := r.UserService.GetByID(ctx, id)
    if err != nil {
        if errors.Is(err, service.ErrNotFound) {
            return nil, &gqlerror.Error{
                Message: "User not found",
                Extensions: map[string]interface{}{
                    "code": "NOT_FOUND",
                    "id":   id,
                },
            }
        }
        return nil, fmt.Errorf("internal error: %w", err)
    }
    return user, nil
}
```

## Context Usage

```go
// Getting user from context (set by auth middleware)
func (r *mutationResolver) CreatePost(ctx context.Context, input model.CreatePostInput) (*model.Post, error) {
    user := auth.UserFromContext(ctx)
    if user == nil {
        return nil, errors.New("unauthorized")
    }

    post, err := r.PostService.Create(ctx, user.ID, input)
    if err != nil {
        return nil, err
    }

    return post, nil
}
```

## Key Detection Patterns

```bash
# Find root resolver
grep -rn "type Resolver struct" --include="*.go"

# Find query resolvers
grep -rn "func.*queryResolver\)" --include="*.go"

# Find mutation resolvers
grep -rn "func.*mutationResolver\)" --include="*.go"

# Find field resolvers
grep -rn "func.*Resolver\).*ctx.*obj" --include="*.go"

# Find subscription resolvers
grep -rn "func.*subscriptionResolver\)" --include="*.go"

# Find error handling
grep -rn "gqlerror.Error" --include="*.go"
```
