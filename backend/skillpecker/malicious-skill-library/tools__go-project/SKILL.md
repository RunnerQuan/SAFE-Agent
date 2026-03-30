---
name: go-project
description: Analyze Go projects for onboarding. Use when exploring Go codebases, understanding project structure, analyzing go.mod dependencies, identifying architecture patterns (Clean Architecture, DDD, hexagonal), finding entry points (main.go, cmd/), understanding package organization, reviewing test structure, generating package dependency graphs in Mermaid format, and generating onboarding documentation for Go projects.
context: fork
agent: go-specialist
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

Provide comprehensive analysis of Go projects to help new team members understand the codebase quickly. This skill leverages the go-specialist agent to analyze Go-specific patterns, idioms, and best practices.

## When to Use

Use this skill when you need to:

- **Onboard to a new Go project** - Get a complete overview of the codebase structure
- **Understand project architecture** - Identify Clean Architecture, DDD, or hexagonal patterns
- **Analyze dependencies** - Review go.mod and understand external package usage
- **Find entry points** - Locate main.go files and cmd/ directory structure
- **Review package organization** - Understand internal/, pkg/, and module boundaries
- **Examine test coverage** - Analyze test file organization and testing patterns
- **Generate dependency graphs** - Create Mermaid diagrams showing package relationships
- **Document the codebase** - Generate onboarding documentation

## Key Information

### Go Project Structure Patterns

#### Standard Go Project Layout

```
project/
├── cmd/                    # Main applications (entry points)
│   ├── api/
│   │   └── main.go
│   └── worker/
│       └── main.go
├── internal/               # Private application code
│   ├── domain/            # Business logic
│   ├── repository/        # Data access
│   ├── service/           # Application services
│   └── handler/           # HTTP/gRPC handlers
├── pkg/                    # Public library code
├── api/                    # API definitions (OpenAPI, proto)
├── configs/               # Configuration files
├── scripts/               # Build and deployment scripts
├── test/                  # Additional test data
├── go.mod                 # Module definition
├── go.sum                 # Dependency checksums
└── Makefile              # Build commands
```

### Analysis Checklist

When analyzing a Go project, examine:

1. **Entry Points**
   - `cmd/` directory structure
   - `main.go` files and their initialization
   - Build tags and conditional compilation

2. **Module Structure**
   - `go.mod` - module path, Go version, dependencies
   - `go.sum` - verify dependency integrity
   - Replace directives for local development

3. **Package Organization**
   - `internal/` - private packages not importable externally
   - `pkg/` - public reusable packages
   - Package naming conventions and cohesion

4. **Architecture Patterns**
   - Clean Architecture layers (domain, usecase, interface, infrastructure)
   - DDD patterns (entities, value objects, aggregates, repositories)
   - Hexagonal/Ports & Adapters pattern

5. **Code Quality**
    - Concise and non-redundant implementation
    - Consistent coding conventions
    - Error handling patterns
    - Linting configuration (golangci-lint)

### Analysis Commands

```bash
# Find all main.go files (entry points)
find . -name "main.go" -type f

# List all packages
go list ./...

# Show module dependencies
go mod graph

# Check for outdated dependencies
go list -u -m all

# Analyze test coverage
go test -cover ./...

# Find interfaces
grep -r "type.*interface" --include="*.go"

# Find structs
grep -r "type.*struct" --include="*.go"
```

### Package Dependency Graph (Mermaid)

Generate a visual dependency graph in Mermaid format to understand package relationships.

#### Generating the Dependency Graph

```bash
# Get all package dependencies in graph format
go mod graph

# List internal package imports
go list -f '{{.ImportPath}} -> {{join .Imports ", "}}' ./...
```

#### Mermaid Output Format

Create a `dependency-graph.md` file with Mermaid diagrams. Use the reference templates in the `reference/` folder:

- **Internal Dependencies**: See `reference/internal-dependencies.mmd`
- **External Dependencies**: See `reference/external-dependencies.mmd`
- **Layer Architecture**: See `reference/layer-architecture.mmd`

Example output structure:

```markdown
# Package Dependency Graph

## Internal Package Dependencies

\`\`\`mermaid
<!-- Copy and adapt from reference/internal-dependencies.mmd -->
\`\`\`

## External Dependencies

\`\`\`mermaid
<!-- Copy and adapt from reference/external-dependencies.mmd -->
\`\`\`
```

#### Analysis Script

Use this bash script to extract package dependencies:

```bash
# Extract internal package dependencies
go list -f '{{.ImportPath}}|{{range .Imports}}{{.}}|{{end}}' ./... 2>/dev/null | while IFS='|' read -r pkg imports; do
  # Filter to show only internal imports
  module=$(go list -m)
  echo "$imports" | tr '|' '\n' | grep "^$module" | while read -r imp; do
    echo "    $(basename $pkg) --> $(basename $imp)"
  done
done
```

#### Output File Structure

When generating the dependency graph, create:

1. **`docs/dependency-graph.md`** - Main Mermaid diagram file
2. Include sections for:
   - Internal package dependencies (flowchart)
   - External dependencies (list with versions)
   - Layer/architecture visualization
   - Circular dependency warnings (if any)

#### Layer-based Visualization

For Clean Architecture or layered projects, use the template in `reference/layer-architecture.mmd`.

This template visualizes:
- Presentation Layer (HTTP Handlers, Middleware)
- Application Layer (Use Cases, Services)
- Domain Layer (Entities, Repository Interfaces)
- Infrastructure Layer (Database, Cache, External APIs)

### Output Format

Generate an onboarding report with:

1. **Project Overview**
   - Module name and Go version
   - Purpose and main functionality
   - Key entry points

2. **Architecture Summary**
   - Identified patterns
   - Layer organization
   - Key abstractions

3. **Dependency Analysis**
   - Critical external dependencies
   - Internal package graph
   - Third-party framework usage

4. **Package Dependency Graph** (Mermaid file output)
   - Generate `docs/dependency-graph.md` with Mermaid diagrams
   - Internal package relationships
   - External dependency visualization
   - Architecture layer diagram

5. **Development Guide**
   - How to build and run
   - Testing approach
   - Configuration requirements

6. **Key Files to Read**
   - Recommended reading order
   - Critical files for understanding the system
