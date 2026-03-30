---
name: use-case
description: Guide for implementing CQRS use cases in the Application layer. Use when creating Commands, Queries, Handlers, and their tests.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Use Case Implementation Guide

This Skill provides patterns for implementing CQRS use cases.

## When to Use

- Creating a new Command (write operation)
- Creating a new Query (read operation)
- Implementing Handler logic
- Writing integration tests for use cases

## CQRS Pattern

### Commands (Write Operations)

- Modify state
- May or may not return Output
- Input implements `Command` interface
- Handler implements `CommandHandler` interface

### Queries (Read Operations)

- Never modify state
- Always return Output
- Input implements `Query` interface
- Handler implements `QueryHandler` interface

## Directory Structure

```
src/{BoundedContext}/Application/{Aggregate}/{UseCase}/
├── Input.php       # Command or Query
├── Handler.php     # Business logic
└── Output.php      # Optional for Commands, required for Queries
```

## Input Pattern (Command)

```php
namespace Dairectiv\{Context}\Application\{Aggregate}\{UseCase};

use Dairectiv\SharedKernel\Application\Command\Command;

final readonly class Input implements Command
{
    public function __construct(
        public string $name,
        public string $description,
    ) {}
}
```

## Input Pattern (Query)

```php
namespace Dairectiv\{Context}\Application\{Aggregate}\{UseCase};

use Dairectiv\SharedKernel\Application\Query\Query;

final readonly class Input implements Query
{
    public function __construct(
        public string $id,
    ) {}
}
```

## Handler Pattern

```php
namespace Dairectiv\{Context}\Application\{Aggregate}\{UseCase};

use Dairectiv\SharedKernel\Application\Command\CommandHandler;

final readonly class Handler implements CommandHandler
{
    public function __construct(
        private {Aggregate}Repository $repository,
        // Other dependencies
    ) {}

    public function __invoke(Input $input): Output
    {
        // 1. Convert primitives to Value Objects
        $id = {Aggregate}Id::fromString($input->id);

        // 2. Fetch aggregate (if needed)
        $aggregate = $this->repository->get{Aggregate}ById($id);

        // 3. Execute domain logic
        $aggregate->doSomething($input->value);

        // 4. Persist changes
        $this->repository->save($aggregate);

        // 5. Return output
        return new Output($aggregate);
    }
}
```

## Output Pattern

```php
final readonly class Output
{
    public function __construct(
        public Rule $rule,
    ) {}
}
```

## PHPStan Rules (UseCaseRule)

The project enforces these conventions:

1. Handler must implement `QueryHandler` or `CommandHandler`
2. Input must be in same namespace as Handler
3. `__invoke` must have exactly one parameter named `input`
4. Input must implement `Command` or `Query` interface
5. QueryHandler must return an Output (not void)

## Testing Pattern

```php
#[Group('integration')]
#[Group('{bounded-context}')]
#[Group('use-case')]
final class {UseCase}Test extends IntegrationTestCase
{
    public function testItShouldExecuteUseCase(): void
    {
        // Arrange
        $existingEntity = $this->createEntity();

        // Act
        $output = $this->execute(new Input($existingEntity->id));

        // Assert - Domain Event
        self::assertDomainEventHasBeenDispatched({Event}::class);

        // Assert - Output
        self::assertInstanceOf(Output::class, $output);
        self::assertSame($expectedValue, $output->entity->value);

        // Assert - Persistence
        $persisted = $this->findEntity(Entity::class, ['id' => $id], strict: true);
        self::assertSame($expectedValue, $persisted->value);
    }

    public function testItShouldThrowWhenEntityNotFound(): void
    {
        $this->expectException({Entity}NotFoundException::class);

        $this->execute(new Input('non-existent-id'));
    }
}
```

### Using DataProviders

```php
/**
 * @return iterable<string, array{input: string, expected: string}>
 */
public static function provideTestCases(): iterable
{
    yield 'case one' => ['input' => 'value1', 'expected' => 'result1'];
    yield 'case two' => ['input' => 'value2', 'expected' => 'result2'];
}

#[DataProvider('provideTestCases')]
public function testItShouldHandleVariousCases(string $input, string $expected): void
{
    $output = $this->execute(new Input($input));

    self::assertSame($expected, $output->value);
    self::assertDomainEventHasBeenDispatched(Event::class);
}
```

## Calling Use Cases

### From Tests (IntegrationTestCase)

```php
// Command
$output = $this->execute(new DraftRuleInput($name, $description));

// Query
$output = $this->fetch(new GetRuleInput($id));
```

### From Controllers

```php
public function __construct(
    private CommandBus $commandBus,
    private QueryBus $queryBus,
) {}

public function create(Request $request): Response
{
    $output = $this->commandBus->execute(new DraftRuleInput(...));
    // ...
}

public function get(string $id): Response
{
    $output = $this->queryBus->fetch(new GetRuleInput($id));
    // ...
}
```

## Checklist

When creating a use case:
- [ ] Input class implements `Command` or `Query`
- [ ] Handler implements `CommandHandler` or `QueryHandler`
- [ ] Handler has single `__invoke(Input $input)` method
- [ ] All classes are `final readonly`
- [ ] All classes in same namespace
- [ ] Output required for Query, optional for Command

When testing:
- [ ] Test happy path with assertions on output and persistence
- [ ] Test exception cases (not found, already exists)
- [ ] Test edge cases with DataProviders
- [ ] Assert domain events
- [ ] Use proper test groups

## Reference Files

- `api/src/Authoring/Application/Rule/DraftRule/` - Command example
- `api/src/Authoring/Application/Rule/GetRule/` - Query example
- `api/tests/Integration/Authoring/Application/Rule/DraftRuleTest.php`
- `api/src/SharedKernel/Application/Command/Command.php`
- `api/src/SharedKernel/Application/Query/Query.php`