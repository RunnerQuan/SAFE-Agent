"""
Production Error Handling Patterns

Retry with exponential backoff, circuit breaker, and workflow checkpointing.
"""

import asyncio
import random
import time
import json
from functools import wraps
from typing import TypeVar, Callable, Any, Dict, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from dotenv import load_dotenv

load_dotenv()


# ============================================================================
# Retry with Exponential Backoff
# ============================================================================

T = TypeVar('T')


def with_retry(
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    retryable_exceptions: tuple = (Exception,),
    on_retry: Optional[Callable[[Exception, int], None]] = None,
):
    """
    Decorator for retry with exponential backoff and jitter.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential calculation
        retryable_exceptions: Tuple of exception types to retry
        on_retry: Optional callback when retry occurs

    Returns:
        Decorated async function with retry logic
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e

                    if attempt == max_retries:
                        print(f"Max retries ({max_retries}) exceeded")
                        raise

                    # Calculate delay with exponential backoff + jitter
                    delay = min(
                        base_delay * (exponential_base ** attempt),
                        max_delay
                    )
                    jitter = random.uniform(0, delay * 0.1)
                    total_delay = delay + jitter

                    if on_retry:
                        on_retry(e, attempt + 1)
                    else:
                        print(f"Attempt {attempt + 1} failed: {e}. Retrying in {total_delay:.2f}s...")

                    await asyncio.sleep(total_delay)

            raise last_exception

        return wrapper
    return decorator


# ============================================================================
# Circuit Breaker
# ============================================================================

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreaker:
    """
    Circuit breaker to prevent cascading failures.

    States:
    - CLOSED: Normal operation, requests flow through
    - OPEN: Too many failures, requests are rejected immediately
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    """

    failure_threshold: int = 5
    reset_timeout: float = 60.0
    half_open_max_calls: int = 3

    state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    failures: int = field(default=0, init=False)
    successes_in_half_open: int = field(default=0, init=False)
    last_failure_time: float = field(default=0, init=False)
    half_open_calls: int = field(default=0, init=False)

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Async function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments

        Returns:
            Function result

        Raises:
            CircuitOpenError: When circuit is open
        """
        # Check if circuit should transition from OPEN to HALF_OPEN
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.reset_timeout:
                print("Circuit transitioning to HALF_OPEN")
                self.state = CircuitState.HALF_OPEN
                self.half_open_calls = 0
                self.successes_in_half_open = 0
            else:
                remaining = self.reset_timeout - (time.time() - self.last_failure_time)
                raise CircuitOpenError(f"Circuit is OPEN. Retry after {remaining:.1f}s")

        # Limit calls in HALF_OPEN state
        if self.state == CircuitState.HALF_OPEN:
            if self.half_open_calls >= self.half_open_max_calls:
                raise CircuitOpenError("Circuit HALF_OPEN: max test calls reached")
            self.half_open_calls += 1

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self):
        """Handle successful call."""
        if self.state == CircuitState.HALF_OPEN:
            self.successes_in_half_open += 1
            if self.successes_in_half_open >= self.half_open_max_calls:
                print("Circuit recovered, transitioning to CLOSED")
                self.state = CircuitState.CLOSED
                self.failures = 0
        else:
            self.failures = 0

    def _on_failure(self):
        """Handle failed call."""
        self.failures += 1
        self.last_failure_time = time.time()

        if self.state == CircuitState.HALF_OPEN:
            print("Circuit reopening after HALF_OPEN failure")
            self.state = CircuitState.OPEN
        elif self.failures >= self.failure_threshold:
            print(f"Circuit OPEN after {self.failures} failures")
            self.state = CircuitState.OPEN

    def reset(self):
        """Manually reset the circuit breaker."""
        self.state = CircuitState.CLOSED
        self.failures = 0
        self.half_open_calls = 0
        self.successes_in_half_open = 0


class CircuitOpenError(Exception):
    """Raised when circuit breaker is open."""
    pass


# ============================================================================
# Workflow Checkpointing
# ============================================================================

@dataclass
class WorkflowCheckpoint:
    """Checkpoint state for workflow recovery."""

    workflow_id: str
    current_step: str
    completed_steps: List[str] = field(default_factory=list)
    intermediate_results: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_json(self) -> str:
        """Serialize checkpoint to JSON."""
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, data: str) -> 'WorkflowCheckpoint':
        """Deserialize checkpoint from JSON."""
        return cls(**json.loads(data))


class CheckpointManager:
    """
    Manage workflow checkpoints for recovery.

    In production, replace in-memory storage with:
    - Azure Blob Storage
    - Azure Cosmos DB
    - PostgreSQL (with LangGraph PostgresSaver)
    """

    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize checkpoint manager.

        Args:
            storage_path: Optional path for file-based storage
        """
        self.storage_path = storage_path
        self._checkpoints: Dict[str, WorkflowCheckpoint] = {}

    async def save(self, checkpoint: WorkflowCheckpoint) -> None:
        """
        Save checkpoint.

        Args:
            checkpoint: Checkpoint to save
        """
        self._checkpoints[checkpoint.workflow_id] = checkpoint
        print(f"Checkpoint saved: {checkpoint.workflow_id} at step '{checkpoint.current_step}'")

        # In production, persist to storage
        if self.storage_path:
            import os
            os.makedirs(self.storage_path, exist_ok=True)
            filepath = os.path.join(self.storage_path, f"{checkpoint.workflow_id}.json")
            with open(filepath, 'w') as f:
                f.write(checkpoint.to_json())

    async def load(self, workflow_id: str) -> Optional[WorkflowCheckpoint]:
        """
        Load checkpoint for recovery.

        Args:
            workflow_id: ID of workflow to load

        Returns:
            Checkpoint if found, None otherwise
        """
        # Check in-memory first
        if workflow_id in self._checkpoints:
            return self._checkpoints[workflow_id]

        # Check file storage
        if self.storage_path:
            import os
            filepath = os.path.join(self.storage_path, f"{workflow_id}.json")
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    return WorkflowCheckpoint.from_json(f.read())

        return None

    async def delete(self, workflow_id: str) -> None:
        """
        Delete checkpoint after successful completion.

        Args:
            workflow_id: ID of workflow to delete
        """
        if workflow_id in self._checkpoints:
            del self._checkpoints[workflow_id]
            print(f"Checkpoint deleted: {workflow_id}")

        if self.storage_path:
            import os
            filepath = os.path.join(self.storage_path, f"{workflow_id}.json")
            if os.path.exists(filepath):
                os.remove(filepath)

    async def list_checkpoints(self) -> List[str]:
        """
        List all checkpoint IDs.

        Returns:
            List of workflow IDs with checkpoints
        """
        ids = list(self._checkpoints.keys())

        if self.storage_path:
            import os
            if os.path.exists(self.storage_path):
                for f in os.listdir(self.storage_path):
                    if f.endswith('.json'):
                        ids.append(f[:-5])

        return list(set(ids))


class CheckpointedWorkflow:
    """
    Helper class for running workflows with automatic checkpointing.
    """

    def __init__(
        self,
        workflow_id: str,
        checkpoint_manager: Optional[CheckpointManager] = None,
    ):
        """
        Initialize checkpointed workflow.

        Args:
            workflow_id: Unique identifier for the workflow
            checkpoint_manager: Optional checkpoint manager (creates default if None)
        """
        self.workflow_id = workflow_id
        self.checkpoint_mgr = checkpoint_manager or CheckpointManager()
        self.completed_steps: List[str] = []
        self.results: Dict[str, Any] = {}

    async def initialize(self) -> bool:
        """
        Initialize workflow, checking for existing checkpoint.

        Returns:
            True if resumed from checkpoint, False if fresh start
        """
        existing = await self.checkpoint_mgr.load(self.workflow_id)
        if existing:
            print(f"Resuming from checkpoint: step '{existing.current_step}'")
            self.completed_steps = existing.completed_steps.copy()
            self.results = existing.intermediate_results.copy()
            return True
        return False

    async def run_step(
        self,
        step_name: str,
        step_func: Callable[..., Any],
        *args,
        **kwargs
    ) -> Any:
        """
        Run a workflow step with automatic checkpointing.

        Args:
            step_name: Name of the step
            step_func: Async function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments

        Returns:
            Step result
        """
        # Skip if already completed
        if step_name in self.completed_steps:
            print(f"Skipping completed step: {step_name}")
            return self.results.get(step_name)

        # Save checkpoint before step
        checkpoint = WorkflowCheckpoint(
            workflow_id=self.workflow_id,
            current_step=step_name,
            completed_steps=self.completed_steps.copy(),
            intermediate_results=self.results.copy(),
        )
        await self.checkpoint_mgr.save(checkpoint)

        # Execute step
        try:
            if asyncio.iscoroutinefunction(step_func):
                result = await step_func(*args, **kwargs)
            else:
                result = step_func(*args, **kwargs)

            self.results[step_name] = result
            self.completed_steps.append(step_name)
            print(f"Completed step: {step_name}")

            return result

        except Exception as e:
            print(f"Step '{step_name}' failed: {e}")
            print("Workflow paused. Can resume from checkpoint.")
            raise

    async def complete(self) -> None:
        """Mark workflow as complete and clean up checkpoint."""
        await self.checkpoint_mgr.delete(self.workflow_id)
        print(f"Workflow {self.workflow_id} completed successfully!")


if __name__ == "__main__":
    print("=" * 60)
    print("Error Handling Patterns - Test")
    print("=" * 60)

    async def test_error_handling():
        # Test retry decorator
        print("\n--- Testing Retry Pattern ---")

        attempt_count = 0

        @with_retry(max_retries=3, base_delay=0.5)
        async def flaky_operation():
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 3:
                raise ConnectionError(f"Simulated failure (attempt {attempt_count})")
            return "Success after retries!"

        try:
            result = await flaky_operation()
            print(f"[OK] Retry result: {result}")
        except Exception as e:
            print(f"[FAIL] {e}")

        # Test circuit breaker
        print("\n--- Testing Circuit Breaker ---")
        circuit = CircuitBreaker(failure_threshold=2, reset_timeout=2.0)

        async def always_fails():
            raise ValueError("Simulated failure")

        async def always_succeeds():
            return "Success!"

        # Trigger failures to open circuit
        for i in range(3):
            try:
                await circuit.call(always_fails)
            except ValueError:
                print(f"Failure {i + 1}, circuit state: {circuit.state.value}")
            except CircuitOpenError as e:
                print(f"[OK] Circuit open: {e}")

        print(f"Circuit state after failures: {circuit.state.value}")

        # Wait for reset and test recovery
        print("Waiting for circuit reset...")
        await asyncio.sleep(2.5)

        try:
            result = await circuit.call(always_succeeds)
            print(f"[OK] Circuit recovered: {result}")
        except CircuitOpenError as e:
            print(f"Circuit still open: {e}")

        # Test checkpointing
        print("\n--- Testing Checkpointing ---")
        checkpoint_mgr = CheckpointManager()

        workflow = CheckpointedWorkflow("test-workflow-001", checkpoint_mgr)
        await workflow.initialize()

        async def step1():
            return "Step 1 result"

        async def step2(prev_result):
            return f"Step 2 processed: {prev_result}"

        result1 = await workflow.run_step("step1", step1)
        result2 = await workflow.run_step("step2", step2, result1)

        print(f"[OK] Workflow results: {workflow.results}")

        await workflow.complete()

        print("\n" + "=" * 60)
        print("[SUCCESS] Error handling patterns working!")
        print("=" * 60)

    asyncio.run(test_error_handling())
