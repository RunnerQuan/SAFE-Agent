---
name: golang
description: >
  Go best practices, idiomatic patterns, and Test-Driven Development (TDD).
  Trigger: When writing Go code, designing Go packages, implementing TDD in Go, or reviewing Go code quality.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing new Go code or packages"
    - "Implementing TDD in Go projects"
    - "Reviewing Go code quality"
    - "Designing Go interfaces or error handling"
---

## When to Use

- Writing new Go code or packages
- Refactoring existing Go code
- Implementing TDD workflow in Go
- Reviewing Go code for best practices
- Designing package structure and APIs

## Project Structure

```
project/
├── cmd/                    # Application entrypoints
│   └── myapp/
│       └── main.go
├── internal/               # Private application code
│   ├── domain/
│   ├── service/
│   └── repository/
├── pkg/                    # Public reusable packages
├── api/                    # API definitions (OpenAPI, proto)
├── configs/                # Configuration files
├── scripts/                # Build/deploy scripts
├── go.mod
├── go.sum
└── Makefile
```

## Critical Patterns

### 1. Error Handling

```go
// GOOD: Wrap errors with context
func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}

// GOOD: Define sentinel errors
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
)

// GOOD: Check for specific errors
if errors.Is(err, ErrNotFound) {
    // handle not found
}
```

### 2. Interface Design

```go
// GOOD: Small, focused interfaces (accept interfaces, return structs)
type Reader interface {
    Read(ctx context.Context, id string) (*Entity, error)
}

type Writer interface {
    Write(ctx context.Context, entity *Entity) error
}

// Compose when needed
type ReadWriter interface {
    Reader
    Writer
}

// GOOD: Define interfaces where they're used, not where implemented
// In service package:
type userRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

type UserService struct {
    repo userRepository // lowercase = private, defined here
}
```

### 3. Constructor Pattern

```go
// GOOD: Functional options for complex constructors
type Server struct {
    addr    string
    timeout time.Duration
    logger  Logger
}

type Option func(*Server)

func WithTimeout(d time.Duration) Option {
    return func(s *Server) {
        s.timeout = d
    }
}

func WithLogger(l Logger) Option {
    return func(s *Server) {
        s.logger = l
    }
}

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{
        addr:    addr,
        timeout: 30 * time.Second, // default
        logger:  noopLogger{},     // default
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Usage
server := NewServer(":8080", WithTimeout(time.Minute), WithLogger(myLogger))
```

### 4. Context Usage

```go
// GOOD: Context as first parameter
func (s *Service) DoSomething(ctx context.Context, input Input) error {
    // Check for cancellation
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
    }
    
    // Pass context to downstream calls
    return s.repo.Save(ctx, input)
}

// BAD: Don't store context in structs
type Service struct {
    ctx context.Context // NEVER do this
}
```

## TDD Workflow

### Red-Green-Refactor Cycle

```
1. RED:    Write a failing test first
2. GREEN:  Write minimal code to pass
3. REFACTOR: Improve code, keep tests green
```

### Test Structure (AAA Pattern)

```go
func TestUserService_GetUser(t *testing.T) {
    // Arrange
    repo := &mockUserRepository{
        user: &User{ID: "123", Name: "John"},
    }
    svc := NewUserService(repo)
    
    // Act
    user, err := svc.GetUser(context.Background(), "123")
    
    // Assert
    require.NoError(t, err)
    assert.Equal(t, "John", user.Name)
}
```

### Table-Driven Tests

```go
func TestCalculate(t *testing.T) {
    tests := []struct {
        name     string
        input    int
        expected int
        wantErr  bool
    }{
        {
            name:     "positive number",
            input:    5,
            expected: 25,
            wantErr:  false,
        },
        {
            name:     "zero",
            input:    0,
            expected: 0,
            wantErr:  false,
        },
        {
            name:    "negative number",
            input:   -1,
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Calculate(tt.input)
            
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            
            require.NoError(t, err)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

### Test Doubles

```go
// Mock for testing
type mockRepository struct {
    findFn func(ctx context.Context, id string) (*Entity, error)
    saveFn func(ctx context.Context, e *Entity) error
}

func (m *mockRepository) Find(ctx context.Context, id string) (*Entity, error) {
    if m.findFn != nil {
        return m.findFn(ctx, id)
    }
    return nil, nil
}

// Usage in test
repo := &mockRepository{
    findFn: func(ctx context.Context, id string) (*Entity, error) {
        return &Entity{ID: id}, nil
    },
}
```

### Testing HTTP Handlers

```go
func TestHandler_GetUser(t *testing.T) {
    // Arrange
    svc := &mockUserService{
        user: &User{ID: "123", Name: "John"},
    }
    handler := NewHandler(svc)
    
    req := httptest.NewRequest(http.MethodGet, "/users/123", nil)
    rec := httptest.NewRecorder()
    
    // Act
    handler.GetUser(rec, req)
    
    // Assert
    assert.Equal(t, http.StatusOK, rec.Code)
    
    var response User
    err := json.NewDecoder(rec.Body).Decode(&response)
    require.NoError(t, err)
    assert.Equal(t, "John", response.Name)
}
```

## Code Style

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Package | lowercase, single word | `user`, `order` |
| Interface | -er suffix for single method | `Reader`, `Writer` |
| Exported | PascalCase | `GetUser`, `UserService` |
| Unexported | camelCase | `getUserByID`, `userRepo` |
| Acronyms | Consistent case | `HTTPServer`, `userID` |
| Test files | `_test.go` suffix | `user_test.go` |

### Documentation

```go
// Package user provides user management functionality.
package user

// User represents a system user with authentication credentials.
type User struct {
    ID    string
    Email string
}

// GetByID retrieves a user by their unique identifier.
// It returns ErrNotFound if no user exists with the given ID.
func (s *Service) GetByID(ctx context.Context, id string) (*User, error) {
    // ...
}
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| `interface{}` / `any` overuse | Loses type safety | Use generics or specific types |
| Naked returns | Hard to read | Use explicit returns |
| `init()` functions | Hidden side effects | Use explicit initialization |
| Global state | Hard to test | Use dependency injection |
| Panic for errors | Crashes program | Return errors instead |
| Ignoring errors | Silent failures | Always handle or wrap errors |

## Commands

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run tests verbose
go test -v ./...

# Run specific test
go test -run TestUserService_GetUser ./...

# Run benchmarks
go test -bench=. ./...

# Lint code
golangci-lint run

# Format code
gofmt -w .
goimports -w .

# Vet code
go vet ./...

# Generate mocks (with mockgen)
mockgen -source=repository.go -destination=mock_repository.go -package=user

# Build
go build -o bin/myapp ./cmd/myapp

# Tidy dependencies
go mod tidy
```

## Useful Test Assertions (testify)

```go
import (
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// assert - continues on failure
assert.Equal(t, expected, actual)
assert.NotNil(t, value)
assert.True(t, condition)
assert.Contains(t, slice, element)
assert.Empty(t, collection)

// require - stops on failure
require.NoError(t, err)
require.NotNil(t, value)
```

## Resources

- **Style Guide**: [Effective Go](https://go.dev/doc/effective_go)
- **Code Review**: [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
- **Project Layout**: [Standard Go Project Layout](https://github.com/golang-standards/project-layout)
