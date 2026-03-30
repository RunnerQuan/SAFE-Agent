---
name: pydev-workflow
description: comprehensive 12-step project development workflow from initialization through deployment. use when starting a new project, continuing project development, or user mentions project steps, architecture planning, implementation planning, or references pydev-workflow steps 01-12.
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(git:*), Bash(pytest:*), Bash(alembic:*), Bash(npm:*)
---

# pydev-workflow: Project-Level Development Workflow

execute 12-step structured development process for complete project implementation.

## when to apply this skill

- user says "initialize pydev-workflow" or "start pydev-workflow"
- user says "continue pydev-workflow" or "resume project"
- user asks about project status, current step, or workflow progress
- user mentions specific step numbers (01-12) or step names (project-init, system-architecture, etc.)
- user requests architecture design, implementation planning, or deployment prep
- project has PROJECT_FOUNDATION.md, ARCHITECTURE.md, or IMPLEMENTATION_PLAN.md files

## workflow entry points

can start at any step based on context:

| entry point | trigger phrases | context signals |
|-------------|----------------|-----------------|
| step 01 | "initialize project", "start new project" | no PROJECT_FOUNDATION.md exists |
| step 02 | "design architecture", "define components" | PROJECT_FOUNDATION.md exists |
| step 03 | "define data models", "design schema" | ARCHITECTURE.md exists but no data models section |
| step 06 | "create implementation plan" | ARCHITECTURE.md complete |
| step 07 | "start implementation", "begin coding" | IMPLEMENTATION_PLAN.md exists |
| step 11 | "finalize docs", "write documentation" | implementation complete |
| any step | "continue workflow", "resume" | check existing docs for current step |

## core principles

### always read CLAUDE.md first
check project root for CLAUDE.md - contains project-specific best practices, patterns, and context.

### 80% certainty rule
- **above 80% certain**: execute autonomously, document decisions
- **below 80% certain**: stop, explain uncertainty, ask specific questions

### git requirements
- **email**: isa.lucia.sch@gmail.com
- **user**: luvisaisa
- **branch**: main
- **commit frequently**: after meaningful changes per commit triggers table

### documentation practices
- update existing files, do not create new ones without evaluation
- timestamp all documentation updates: `> Last updated: [YYYY-MM-DD]`
- use mermaid.js for all diagrams
- maintain DEV_LOG.md with implementation summaries
- comments always lowercase, no emojis

## 12-step workflow

### step 01: project initialization
**id**: `01-project-init`
**output**: `PROJECT_FOUNDATION.md`
**checkpoint**: approve foundation before design
**commit**: `docs: PROJECT_FOUNDATION.md - initial project definition`

establish goals, scope, constraints, high-level architecture.

**actions**:
1. read CLAUDE.md if exists
2. gather project requirements from user
3. define scope and constraints
4. create PROJECT_FOUNDATION.md with:
   - project overview
   - goals and objectives
   - scope boundaries
   - constraints and assumptions
   - high-level architecture vision
5. checkpoint with user for approval
6. commit foundation document
7. update DEV_LOG.md

### step 02: system architecture
**id**: `02-system-architecture`
**input**: `PROJECT_FOUNDATION.md`
**output**: `ARCHITECTURE.md`
**checkpoint**: approve component structure
**commit**: `docs: ARCHITECTURE.md - system architecture defined`

define components, boundaries, communication patterns.

**actions**:
1. read PROJECT_FOUNDATION.md
2. design component structure
3. define component responsibilities and boundaries
4. map communication patterns (sync/async, protocols)
5. identify shared infrastructure (logging, config, errors)
6. create architecture diagrams using mermaid.js
7. create ARCHITECTURE.md with component map section
8. checkpoint if uncertain (below 80%)
9. commit architecture document
10. update DEV_LOG.md

**use slash command**: `/architecture-sync` when updating existing ARCHITECTURE.md

### step 03: data models
**id**: `03-data-models`
**input**: `PROJECT_FOUNDATION.md`, `ARCHITECTURE.md`
**output**: update `ARCHITECTURE.md` with data models section
**checkpoint**: approve data structures
**commit**: `docs: ARCHITECTURE.md - data models added`

define entities, relationships, storage strategy.

**actions**:
1. read ARCHITECTURE.md
2. identify all entities from architecture
3. define entity attributes and types
4. map relationships (1:1, 1:N, N:M)
5. choose storage approach per entity
6. design indexes and query patterns
7. add data models section to ARCHITECTURE.md with:
   - entity relationship diagram (mermaid erDiagram)
   - entity definitions table
   - indexes and query patterns
8. checkpoint if uncertain
9. commit update
10. update DEV_LOG.md

**use slash command**: `/architecture-sync` after updating

### step 04: core logic design
**id**: `04-core-logic`
**input**: `PROJECT_FOUNDATION.md`, `ARCHITECTURE.md`
**output**: update `ARCHITECTURE.md` with core logic section
**checkpoint**: approve logic approach
**commit**: `docs: ARCHITECTURE.md - core logic added`

define algorithms, business rules, processing flows.

**actions**:
1. read ARCHITECTURE.md
2. identify core algorithms needed
3. define business rules and validation logic
4. design processing flows and state machines
5. create type system if applicable
6. define computed properties and derived data
7. add core logic section to ARCHITECTURE.md with:
   - processing flows (mermaid flowchart)
   - business rules table
   - algorithms with complexity
   - state machines if applicable (mermaid stateDiagram)
8. checkpoint if uncertain
9. commit update
10. update DEV_LOG.md

**use slash command**: `/architecture-sync` after updating

### step 05: interface design
**id**: `05-interfaces`
**input**: all previous ARCHITECTURE.md sections
**output**: update `ARCHITECTURE.md` with interfaces section
**checkpoint**: approve public interfaces
**commit**: `docs: ARCHITECTURE.md - interfaces added`

define apis, contracts, input/output shapes.

**actions**:
1. read ARCHITECTURE.md
2. define all public interfaces (apis, clis, events)
3. specify request/response shapes
4. define error responses and codes
5. document authentication/authorization
6. add interfaces section to ARCHITECTURE.md with:
   - api overview
   - endpoint definitions
   - request/response flow (mermaid sequenceDiagram)
   - event contracts if applicable
   - cli interface if applicable
7. checkpoint if uncertain
8. commit update
9. update DEV_LOG.md

**use slash commands**:
- `/api-docs` to generate api documentation
- `/architecture-sync` after updating

### step 06: implementation plan
**id**: `06-impl-plan`
**input**: all previous documents
**output**: `IMPLEMENTATION_PLAN.md`
**checkpoint**: approve build sequence
**commit**: `plan: IMPLEMENTATION_PLAN.md - implementation plan complete`

break designs into buildable units with sequence.

**actions**:
1. read all design documents
2. break system into implementation units
3. define dependencies between units
4. sequence units respecting dependencies
5. estimate complexity per unit (low/medium/high)
6. identify parallelizable work
7. create todo lists per unit using hierarchical format:
   - major task (feature/component level)
   - mid-level task (concrete deliverable)
   - minor task (specific action)
8. create IMPLEMENTATION_PLAN.md with:
   - overview (total units, estimated complexity, critical path)
   - implementation sequence
   - unit definitions with todos and acceptance criteria
   - risk register
9. checkpoint for approval
10. commit plan
11. update DEV_LOG.md

### step 07: implementation
**id**: `07-implementation`
**input**: `IMPLEMENTATION_PLAN.md`, all design docs
**output**: source code
**triggers**: `pydev-feature` skill for each unit
**checkpoint**: review at unit completion
**commit**: per mid-level task completion

build the system following the plan.

**actions**:
1. read IMPLEMENTATION_PLAN.md
2. for each unit in sequence:
   - invoke pydev-feature skill with unit todo
   - track progress against plan
   - commit after each mid-level task
   - push after each major task
   - update IMPLEMENTATION_PLAN.md progress
3. flag deviations from plan
4. update DEV_LOG.md after each unit

**use slash commands**:
- `/new-model` for creating sqlalchemy models
- `/new-endpoint` for creating api endpoints
- `/new-service` for creating service modules
- `/new-adapter` for creating data adapters
- `/new-component` for creating react/next.js components
- `/test` to run tests for implemented units
- `/verify` to run full verification suite
- `/checkpoint` when pausing for review

### step 08: test strategy
**id**: `08-test-strategy`
**input**: all design docs, implementation
**output**: `TEST_STRATEGY.md`
**checkpoint**: approve test approach
**commit**: `docs: TEST_STRATEGY.md - test strategy defined`

define testing approach and coverage targets.

**actions**:
1. read implementation and design docs
2. define test categories (unit, integration, e2e)
3. set coverage targets
4. identify critical paths requiring thorough testing
5. plan test data strategy
6. define test environments
7. create TEST_STRATEGY.md with:
   - coverage targets table
   - test categories (unit, integration, e2e)
   - test data strategy
   - ci integration approach
8. checkpoint if uncertain
9. commit strategy
10. update DEV_LOG.md

### step 09: test implementation
**id**: `09-test-impl`
**input**: `TEST_STRATEGY.md`, source code
**output**: test files
**triggers**: `pydev-feature` skill for test implementation
**checkpoint**: review coverage
**commit**: `test: [component] - [what was tested]`

write tests following strategy.

**actions**:
1. read TEST_STRATEGY.md
2. create test structure
3. write unit tests for critical paths first
4. write integration tests
5. run full suite, report coverage
6. fill coverage gaps
7. track progress with coverage reports
8. commit after test completion
9. update DEV_LOG.md

**use slash commands**:
- `/test-generate` to generate comprehensive test suites
- `/test-edge-cases` to analyze and generate edge case tests
- `/test` to run tests with coverage
- `/verify` to run full verification suite

### step 10: integration and refinement
**id**: `10-integration`
**input**: all implementation and tests
**output**: integrated system
**checkpoint**: approve integration
**commit**: `refactor: integration cleanup and verification`

connect components, verify system works end-to-end.

**actions**:
1. verify all components connect properly
2. run integration test suite
3. identify and fix integration gaps
4. performance check on critical paths
5. refactor for consistency
6. run full verification
7. commit cleanup
8. update DEV_LOG.md

**use slash commands**:
- `/test` for integration tests
- `/verify` for full verification suite
- `/refactor-plan` if major refactoring needed
- `/extract` to extract reusable code
- `/fix-lint`, `/fix-types`, `/fix-imports` for cleanup

### step 11: documentation
**id**: `11-documentation`
**input**: all previous outputs
**output**: updated `README.md`, consolidated docs
**checkpoint**: review docs
**commit**: `docs: README.md - documentation finalized`

finalize user and developer documentation.

**actions**:
1. write/update README.md with quick start
2. ensure ARCHITECTURE.md is complete and current
3. verify all mermaid diagrams render correctly
4. add inline code comments where helpful (lowercase, no emojis)
5. evaluate if additional docs needed (ask before creating)
6. create/update README.md with:
   - project description
   - quick start
   - architecture overview with mermaid diagram
   - development setup
   - testing instructions
   - documentation index
7. update DEV_LOG.md
8. commit documentation

**use slash commands**:
- `/document` to generate or update documentation
- `/api-docs` to generate api documentation
- `/architecture-sync` to sync architecture.md with codebase

### step 12: deployment prep
**id**: `12-deployment`
**input**: complete system
**output**: deployment config, ci/cd
**checkpoint**: approve deployment strategy
**commit**: `config: deployment configuration`

prepare for deployment.

**actions**:
1. create/update dockerfile if applicable
2. define environment variables
3. set up ci/cd pipeline
4. create deployment documentation
5. define rollback procedure
6. commit deployment config
7. update DEV_LOG.md
8. final project summary

## resuming workflow

when user says "continue workflow" or "resume":

1. check for existing documentation:
   ```bash
   ls -la PROJECT_FOUNDATION.md ARCHITECTURE.md IMPLEMENTATION_PLAN.md TEST_STRATEGY.md DEV_LOG.md
   ```

2. determine current step based on what exists:
   - PROJECT_FOUNDATION.md only → at step 02
   - ARCHITECTURE.md exists → check completeness (sections), proceed to next incomplete
   - IMPLEMENTATION_PLAN.md exists → at step 07 (implementation)
   - implementation complete but no TEST_STRATEGY.md → at step 08
   - TEST_STRATEGY.md exists → at step 09 or 10

3. read CLAUDE.md for current status if exists

4. read DEV_LOG.md for recent activity

5. report current status:
   ```
   [pydev-workflow STATUS]

   current step: [step number and name]
   completed: [list of completed steps]
   in progress: [current work]
   next: [what comes next]
   ```

6. ask user to confirm or adjust direction

## context-aware execution

analyze user messages for context clues:

| user input | skill action |
|------------|--------------|
| "design the api" | jump to step 05 (interface design) |
| "create implementation plan" | jump to step 06 |
| "start coding" | jump to step 07, invoke pydev-feature |
| "write tests" | jump to step 09 |
| "let's document this" | jump to step 11 |
| "continue where we left off" | resume from current step |
| "skip to [step name]" | jump to requested step |
| "go back to [step name]" | return to previous step |

## progress tracking format

```
[pydev-workflow PROGRESS]

✅ 01: project initialization - PROJECT_FOUNDATION.md created
✅ 02: system architecture - ARCHITECTURE.md with components
✅ 03: data models - added to ARCHITECTURE.md
✅ 04: core logic - added to ARCHITECTURE.md
🔄 05: interface design - in progress
⏸️  06: implementation plan - pending
⏸️  07: implementation - pending
⏸️  08: test strategy - pending
⏸️  09: test implementation - pending
⏸️  10: integration - pending
⏸️  11: documentation - pending
⏸️  12: deployment - pending
```

## integration with pydev-feature

during step 07 (implementation), invoke pydev-feature skill for each implementation unit:

```
[invoking pydev-feature for unit: [unit name]]

unit todo:
* major task: [goal]
   * mid-level task: [deliverable]
      * minor task: [action]

[pydev-feature will handle task-analysis through cleanup]
[returns when unit complete]

[updating IMPLEMENTATION_PLAN.md progress]
```

## file structure maintained

```
project/
├── CLAUDE.md                # best practices (read first)
├── DEV_LOG.md              # timestamped development log
├── PROJECT_FOUNDATION.md   # project definition
├── ARCHITECTURE.md         # system design with mermaid
├── IMPLEMENTATION_PLAN.md  # build sequence and todos
├── TEST_STRATEGY.md        # testing approach
├── README.md               # user-facing docs
├── src/                    # source code
└── tests/                  # test files
```

## quick reference

### git config
```bash
git config user.email "isa.lucia.sch@gmail.com"
git config user.name "luvisaisa"
```

### commit types
- `docs:` - documentation changes
- `plan:` - planning documents
- `feat:` - new feature implementation
- `fix:` - bug fix
- `test:` - test changes
- `refactor:` - code refactoring
- `config:` - configuration changes

### available slash commands
- core: `/verify`, `/checkpoint`, `/compact`
- scaffolding: `/new-model`, `/new-endpoint`, `/new-service`, `/new-adapter`, `/new-component`
- database: `/migration`, `/migrate-check`, `/seed`
- testing: `/test`, `/test-generate`, `/test-edge-cases`
- debug: `/debug`, `/explain`, `/find-usages`, `/trace`
- refactoring: `/extract`, `/rename-safe`, `/refactor-plan`
- documentation: `/document`, `/api-docs`, `/architecture-sync`
- git: `/commit`, `/changelog`, `/pr-prep`
- quick-fixes: `/fix-lint`, `/fix-imports`, `/fix-types`
