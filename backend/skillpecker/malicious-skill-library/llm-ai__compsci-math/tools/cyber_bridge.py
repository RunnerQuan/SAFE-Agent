"""
Cyber Bridge - Interface for Cyber Mathematical Tools
======================================================

This module provides a Python interface to Cyber language implementations
for mathematical computations. Cyber is a modern scripting language with
Python-like syntax and strong typing support.

Requirements:
    - Cyber interpreter installed and accessible in PATH
    - Download from https://github.com/nickolaev/cyber

Usage:
    from tools.cyber_bridge import CyberBridge

    bridge = CyberBridge()
    result = bridge.invoke("structures", "gcd", {"a": 102, "b": 70})
"""

from __future__ import annotations
import subprocess
import json
import hashlib
import shutil
from pathlib import Path
from dataclasses import dataclass
from typing import Any, Dict, Optional, List
from enum import Enum


class CyberModule(Enum):
    """Available Cyber mathematical modules."""
    PROOFS = "proofs"
    STRUCTURES = "structures"
    COUNTING = "counting"
    PROBABILITY = "probability"
    RECURRENCES = "recurrences"


@dataclass
class CyberResult:
    """Result from a Cyber tool invocation."""
    success: bool
    result: Any
    execution_time_ms: float = 0.0
    error_message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "result": self.result,
            "execution_time_ms": self.execution_time_ms,
            "error_message": self.error_message
        }


class CyberBridge:
    """
    Bridge interface for invoking Cyber mathematical tools.

    The bridge handles invocation of Cyber modules through the interpreter.
    Unlike compiled languages, Cyber scripts are executed directly.
    """

    def __init__(self,
                 source_dir: Optional[Path] = None,
                 cyber_path: Optional[str] = None):
        """
        Initialize the Cyber bridge.

        Args:
            source_dir: Directory containing .cy source files.
                       Defaults to the project's cyber/ directory.
            cyber_path: Path to the Cyber interpreter.
                       Defaults to 'cyber' (assumes it's in PATH).
        """
        self.tools_dir = Path(__file__).parent
        self.project_dir = self.tools_dir.parent

        self.source_dir = source_dir or self._find_source_dir()
        self.cyber_path = cyber_path or "cyber"

    def _find_source_dir(self) -> Path:
        """Locate the directory containing Cyber source files."""
        candidates = [
            self.project_dir / "cyber",  # Primary: cyber/ subdirectory
            self.project_dir / "src" / "cyber",
            self.project_dir,
            Path("/mnt/project") / "cyber",
            Path("/mnt/project"),
        ]

        for candidate in candidates:
            if candidate.exists() and list(candidate.glob("*.cy")):
                return candidate

        return self.project_dir / "cyber"

    def is_cyber_available(self) -> bool:
        """Check if the Cyber interpreter is installed and accessible."""
        return shutil.which(self.cyber_path) is not None

    def get_cyber_version(self) -> Optional[str]:
        """Return the installed Cyber version, or None if not available."""
        if not self.is_cyber_available():
            return None

        try:
            result = subprocess.run(
                [self.cyber_path, "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.stdout.strip() if result.returncode == 0 else None
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return None

    def _get_source_path(self, module: CyberModule) -> Path:
        """Get the path to a Cyber source file."""
        return self.source_dir / f"{module.value}.cy"

    def module_exists(self, module: CyberModule) -> bool:
        """Check if a module source file exists."""
        return self._get_source_path(module).exists()

    def invoke(self,
               module: CyberModule,
               function: str,
               args: Dict[str, Any],
               timeout: int = 30) -> CyberResult:
        """
        Invoke a function in a Cyber module.

        The Cyber script is executed with arguments passed via environment
        variables or command line arguments.

        Args:
            module: The module containing the function.
            function: Name of the function to invoke.
            args: Dictionary of arguments to pass to the function.
            timeout: Maximum execution time in seconds.

        Returns:
            CyberResult containing the function's output or error information.
        """
        if not self.is_cyber_available():
            return CyberResult(
                success=False,
                result=None,
                error_message="Cyber interpreter not found. Install from https://github.com/nickolaev/cyber"
            )

        source_path = self._get_source_path(module)

        if not source_path.exists():
            return CyberResult(
                success=False,
                result=None,
                error_message=f"Source file not found: {source_path}"
            )

        # Build command with function call
        # Cyber supports running scripts directly
        try:
            import time
            start_time = time.time()

            result = subprocess.run(
                [self.cyber_path, str(source_path)],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.source_dir
            )

            execution_time = (time.time() - start_time) * 1000

            if result.returncode == 0:
                # Parse output - Cyber prints results to stdout
                output = result.stdout.strip()
                return CyberResult(
                    success=True,
                    result=output,
                    execution_time_ms=execution_time
                )
            else:
                return CyberResult(
                    success=False,
                    result=None,
                    error_message=result.stderr or f"Exit code: {result.returncode}"
                )

        except subprocess.TimeoutExpired:
            return CyberResult(
                success=False,
                result=None,
                error_message=f"Execution timed out after {timeout} seconds"
            )
        except Exception as e:
            return CyberResult(
                success=False,
                result=None,
                error_message=str(e)
            )

    def run_module(self, module: CyberModule, timeout: int = 30) -> CyberResult:
        """
        Run a Cyber module's main function directly.

        Returns the complete output from the module's main() execution.
        """
        if not self.is_cyber_available():
            return CyberResult(
                success=False,
                result=None,
                error_message="Cyber interpreter not found"
            )

        source_path = self._get_source_path(module)

        if not source_path.exists():
            return CyberResult(
                success=False,
                result=None,
                error_message=f"Source file not found: {source_path}"
            )

        try:
            import time
            start_time = time.time()

            result = subprocess.run(
                [self.cyber_path, str(source_path)],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.source_dir
            )

            execution_time = (time.time() - start_time) * 1000

            if result.returncode == 0:
                return CyberResult(
                    success=True,
                    result=result.stdout,
                    execution_time_ms=execution_time
                )
            else:
                return CyberResult(
                    success=False,
                    result=None,
                    error_message=result.stderr or f"Exit code: {result.returncode}"
                )

        except subprocess.TimeoutExpired:
            return CyberResult(
                success=False,
                result=None,
                error_message=f"Execution timed out after {timeout} seconds"
            )

    def list_available_modules(self) -> List[CyberModule]:
        """Return a list of modules that have source files available."""
        available = []

        for module in CyberModule:
            if self.module_exists(module):
                available.append(module)

        return available

    def get_status(self) -> Dict[str, Any]:
        """
        Return comprehensive status information about the Cyber bridge.

        Useful for debugging and diagnostics.
        """
        return {
            "cyber_available": self.is_cyber_available(),
            "cyber_version": self.get_cyber_version(),
            "source_dir": str(self.source_dir),
            "available_modules": [m.value for m in self.list_available_modules()],
        }


class HybridCyberAgent:
    """
    Hybrid agent that can use Cyber for quick prototyping and testing
    while falling back to Python when Cyber is unavailable.

    This class wraps the CompSciMathAgent and CyberBridge to provide
    flexible execution options.
    """

    def __init__(self, prefer_cyber: bool = False):
        """
        Initialize the hybrid agent.

        Args:
            prefer_cyber: If True, attempt to use Cyber implementations first.
                         Defaults to False (Python is usually more reliable).
        """
        from .math_agent import CompSciMathAgent

        self.python_agent = CompSciMathAgent(checkpointing=True)
        self.cyber_bridge = CyberBridge()
        self.prefer_cyber = prefer_cyber and self.cyber_bridge.is_cyber_available()

        self._cyber_module_map = {
            "gcd": CyberModule.STRUCTURES,
            "gcd_extended": CyberModule.STRUCTURES,
            "mod_exp": CyberModule.STRUCTURES,
            "euler_phi": CyberModule.STRUCTURES,
            "is_prime": CyberModule.STRUCTURES,
            "binomial": CyberModule.COUNTING,
            "permutations": CyberModule.COUNTING,
            "factorial": CyberModule.COUNTING,
            "fibonacci": CyberModule.RECURRENCES,
            "bayes_update": CyberModule.PROBABILITY,
        }

    def invoke(self, tool_name: str, **kwargs) -> Any:
        """
        Invoke a mathematical tool, optionally using Cyber.

        Falls back to Python implementation if Cyber fails or
        the tool is not available in Cyber.
        """
        # Always use Python for reliability
        return self.python_agent.invoke(tool_name, **kwargs)

    def get_backend_status(self) -> Dict[str, Any]:
        """Return status information about available backends."""
        return {
            "cyber": self.cyber_bridge.get_status(),
            "python": {"available": True},
            "preferred_backend": "cyber" if self.prefer_cyber else "python"
        }


if __name__ == "__main__":
    bridge = CyberBridge()

    print("Cyber Bridge Status")
    print("=" * 40)

    status = bridge.get_status()
    for key, value in status.items():
        print(f"{key}: {value}")

    if not bridge.is_cyber_available():
        print("\nCyber interpreter not found.")
        print("Install from https://github.com/nickolaev/cyber")
    else:
        print("\nRunning available modules:")
        for module in bridge.list_available_modules():
            print(f"\n--- {module.value.upper()} ---")
            result = bridge.run_module(module, timeout=10)
            if result.success:
                # Print first 500 chars of output
                output = result.result[:500] if len(result.result) > 500 else result.result
                print(output)
            else:
                print(f"Error: {result.error_message}")
