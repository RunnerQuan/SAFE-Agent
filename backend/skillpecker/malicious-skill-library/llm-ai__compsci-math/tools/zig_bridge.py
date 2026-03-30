"""
Zig Bridge - Interface for Compiled Zig Mathematical Tools
===========================================================

This module provides a Python interface to compiled Zig binaries for
performance-critical mathematical computations. The Zig implementations
offer significant speed advantages for operations involving large numbers,
extensive iteration, or memory-intensive graph algorithms.

Requirements:
    - Zig compiler (0.11.0 or later) installed and accessible in PATH
    - Network access to ziglang.org (for local Claude Code installations)

Usage:
    from tools.zig_bridge import ZigBridge
    
    bridge = ZigBridge()
    bridge.ensure_compiled("math_structures")
    result = bridge.invoke("math_structures", "gcd_extended", {"a": 102, "b": 70})
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


class ZigModule(Enum):
    """Available Zig mathematical modules."""
    PROOFS = "proofs"
    STRUCTURES = "structures"
    COUNTING = "counting"
    PROBABILITY = "probability"
    RECURRENCES = "recurrences"


@dataclass
class ZigResult:
    """Result from a Zig tool invocation."""
    success: bool
    result: Any
    execution_time_ns: int = 0
    error_message: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "result": self.result,
            "execution_time_ns": self.execution_time_ns,
            "error_message": self.error_message
        }


class ZigBridge:
    """
    Bridge interface for invoking compiled Zig mathematical tools.
    
    The bridge handles compilation, caching, and invocation of Zig modules.
    Compiled binaries are cached based on source file hashes to avoid
    unnecessary recompilation.
    """
    
    def __init__(self, 
                 source_dir: Optional[Path] = None,
                 build_dir: Optional[Path] = None,
                 zig_path: Optional[str] = None):
        """
        Initialize the Zig bridge.
        
        Args:
            source_dir: Directory containing .zig source files.
                       Defaults to the project's root directory.
            build_dir: Directory for compiled binaries.
                      Defaults to tools/zig_build/
            zig_path: Path to the Zig compiler.
                     Defaults to 'zig' (assumes it's in PATH).
        """
        self.tools_dir = Path(__file__).parent
        self.project_dir = self.tools_dir.parent
        
        self.source_dir = source_dir or self._find_source_dir()
        self.build_dir = build_dir or (self.tools_dir / "zig_build")
        self.zig_path = zig_path or "zig"
        
        self.build_dir.mkdir(parents=True, exist_ok=True)
        self._hash_cache: Dict[str, str] = {}
    
    def _find_source_dir(self) -> Path:
        """Locate the directory containing Zig source files."""
        candidates = [
            self.project_dir / "zig",  # Primary: zig/ subdirectory
            self.project_dir / "src" / "zig",
            self.project_dir,
            Path("/mnt/project") / "zig",
            Path("/mnt/project"),
        ]

        for candidate in candidates:
            if candidate.exists() and list(candidate.glob("*.zig")):
                return candidate

        return self.project_dir / "zig"
    
    def is_zig_available(self) -> bool:
        """Check if the Zig compiler is installed and accessible."""
        return shutil.which(self.zig_path) is not None
    
    def get_zig_version(self) -> Optional[str]:
        """Return the installed Zig version, or None if not available."""
        if not self.is_zig_available():
            return None
        
        try:
            result = subprocess.run(
                [self.zig_path, "version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.stdout.strip() if result.returncode == 0 else None
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return None
    
    def _compute_source_hash(self, module: ZigModule) -> str:
        """Compute SHA256 hash of a Zig source file for cache invalidation."""
        source_path = self.source_dir / f"{module.value}.zig"
        
        if not source_path.exists():
            return ""
        
        with open(source_path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()[:16]
    
    def _get_cached_hash(self, module: ZigModule) -> Optional[str]:
        """Retrieve the stored hash for a compiled module."""
        hash_file = self.build_dir / f"{module.value}.hash"
        
        if hash_file.exists():
            return hash_file.read_text().strip()
        return None
    
    def _store_hash(self, module: ZigModule, hash_value: str) -> None:
        """Store the hash for a compiled module."""
        hash_file = self.build_dir / f"{module.value}.hash"
        hash_file.write_text(hash_value)
    
    def needs_compilation(self, module: ZigModule) -> bool:
        """Check if a module needs to be compiled or recompiled."""
        binary_path = self.build_dir / module.value
        
        if not binary_path.exists():
            return True
        
        current_hash = self._compute_source_hash(module)
        cached_hash = self._get_cached_hash(module)
        
        return current_hash != cached_hash
    
    def compile_module(self, module: ZigModule, optimize: bool = True) -> bool:
        """
        Compile a Zig module to a binary executable.
        
        Args:
            module: The module to compile.
            optimize: If True, compile with ReleaseFast optimization.
                     If False, compile in Debug mode for better error messages.
        
        Returns:
            True if compilation succeeded, False otherwise.
        """
        if not self.is_zig_available():
            raise RuntimeError(
                "Zig compiler not found. Install Zig from https://ziglang.org/download/ "
                "or ensure it is in your PATH."
            )
        
        source_path = self.source_dir / f"{module.value}.zig"
        output_path = self.build_dir / module.value
        
        if not source_path.exists():
            raise FileNotFoundError(f"Source file not found: {source_path}")
        
        build_args = [
            self.zig_path,
            "build-exe",
            str(source_path),
            "-femit-bin=" + str(output_path),
        ]
        
        if optimize:
            build_args.append("-OReleaseFast")
        
        try:
            result = subprocess.run(
                build_args,
                capture_output=True,
                text=True,
                timeout=120,
                cwd=self.source_dir
            )
            
            if result.returncode == 0:
                source_hash = self._compute_source_hash(module)
                self._store_hash(module, source_hash)
                return True
            else:
                print(f"Compilation failed for {module.value}:")
                print(result.stderr)
                return False
                
        except subprocess.TimeoutExpired:
            print(f"Compilation timed out for {module.value}")
            return False
    
    def ensure_compiled(self, module: ZigModule) -> Path:
        """
        Ensure a module is compiled, compiling it if necessary.
        
        Returns the path to the compiled binary.
        """
        if self.needs_compilation(module):
            success = self.compile_module(module)
            if not success:
                raise RuntimeError(f"Failed to compile {module.value}")
        
        return self.build_dir / module.value
    
    def invoke(self, 
               module: ZigModule, 
               function: str, 
               args: Dict[str, Any],
               timeout: int = 30) -> ZigResult:
        """
        Invoke a function in a compiled Zig module.
        
        The Zig binary receives JSON input via stdin and returns JSON output
        via stdout. The input format is:
        
            {"function": "function_name", "args": {...}}
        
        Args:
            module: The module containing the function.
            function: Name of the function to invoke.
            args: Dictionary of arguments to pass to the function.
            timeout: Maximum execution time in seconds.
        
        Returns:
            ZigResult containing the function's output or error information.
        """
        binary_path = self.ensure_compiled(module)
        
        input_data = json.dumps({
            "function": function,
            "args": args
        })
        
        try:
            result = subprocess.run(
                [str(binary_path)],
                input=input_data,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            if result.returncode == 0:
                output = json.loads(result.stdout)
                return ZigResult(
                    success=True,
                    result=output.get("result"),
                    execution_time_ns=output.get("execution_time_ns", 0)
                )
            else:
                return ZigResult(
                    success=False,
                    result=None,
                    error_message=result.stderr or f"Exit code: {result.returncode}"
                )
                
        except subprocess.TimeoutExpired:
            return ZigResult(
                success=False,
                result=None,
                error_message=f"Execution timed out after {timeout} seconds"
            )
        except json.JSONDecodeError as e:
            return ZigResult(
                success=False,
                result=None,
                error_message=f"Invalid JSON output: {str(e)}"
            )
    
    def compile_all(self, optimize: bool = True) -> Dict[ZigModule, bool]:
        """
        Compile all available Zig modules.
        
        Returns a dictionary mapping each module to its compilation status.
        """
        results = {}
        
        for module in ZigModule:
            source_path = self.source_dir / f"{module.value}.zig"
            if source_path.exists():
                try:
                    results[module] = self.compile_module(module, optimize)
                except Exception as e:
                    print(f"Error compiling {module.value}: {e}")
                    results[module] = False
            else:
                results[module] = False
        
        return results
    
    def list_available_modules(self) -> List[ZigModule]:
        """Return a list of modules that have source files available."""
        available = []
        
        for module in ZigModule:
            source_path = self.source_dir / f"{module.value}.zig"
            if source_path.exists():
                available.append(module)
        
        return available
    
    def get_status(self) -> Dict[str, Any]:
        """
        Return comprehensive status information about the Zig bridge.
        
        Useful for debugging and diagnostics.
        """
        return {
            "zig_available": self.is_zig_available(),
            "zig_version": self.get_zig_version(),
            "source_dir": str(self.source_dir),
            "build_dir": str(self.build_dir),
            "available_modules": [m.value for m in self.list_available_modules()],
            "compiled_modules": [
                m.value for m in ZigModule 
                if (self.build_dir / m.value).exists()
            ]
        }


class HybridMathAgent:
    """
    Hybrid agent that uses Zig for performance-critical operations
    and falls back to Python when Zig is unavailable.
    
    This class wraps the CompSciMathAgent and ZigBridge to provide
    transparent acceleration of mathematical computations.
    """
    
    def __init__(self, prefer_zig: bool = True):
        """
        Initialize the hybrid agent.
        
        Args:
            prefer_zig: If True, attempt to use Zig implementations first.
                       If False, always use Python implementations.
        """
        from .math_agent import CompSciMathAgent
        
        self.python_agent = CompSciMathAgent(checkpointing=True)
        self.zig_bridge = ZigBridge()
        self.prefer_zig = prefer_zig and self.zig_bridge.is_zig_available()
        
        self._zig_accelerated_tools = {
            "gcd": (ZigModule.STRUCTURES, "gcd"),
            "gcd_extended": (ZigModule.STRUCTURES, "gcd_extended"),
            "mod_exp": (ZigModule.STRUCTURES, "mod_exp"),
            "euler_phi": (ZigModule.STRUCTURES, "euler_phi"),
            "is_prime": (ZigModule.STRUCTURES, "is_prime"),
            "binomial": (ZigModule.COUNTING, "binomial"),
            "permutations": (ZigModule.COUNTING, "permutations"),
            "factorial": (ZigModule.COUNTING, "factorial"),
            "evaluate_recurrence": (ZigModule.RECURRENCES, "evaluate"),
        }
    
    def invoke(self, tool_name: str, **kwargs) -> Any:
        """
        Invoke a mathematical tool, using Zig acceleration when available.
        
        Falls back to Python implementation if Zig compilation fails or
        the tool is not available in Zig.
        """
        if self.prefer_zig and tool_name in self._zig_accelerated_tools:
            module, function = self._zig_accelerated_tools[tool_name]
            
            try:
                result = self.zig_bridge.invoke(module, function, kwargs)
                if result.success:
                    return result
            except Exception as e:
                print(f"Zig invocation failed, falling back to Python: {e}")
        
        return self.python_agent.invoke(tool_name, **kwargs)
    
    def get_backend_status(self) -> Dict[str, Any]:
        """Return status information about available backends."""
        return {
            "zig": self.zig_bridge.get_status(),
            "python": {"available": True},
            "preferred_backend": "zig" if self.prefer_zig else "python"
        }


if __name__ == "__main__":
    bridge = ZigBridge()
    
    print("Zig Bridge Status")
    print("=" * 40)
    
    status = bridge.get_status()
    for key, value in status.items():
        print(f"{key}: {value}")
    
    if not bridge.is_zig_available():
        print("\nZig compiler not found.")
        print("Install from https://ziglang.org/download/")
        print("Or add ziglang.org to your Claude Code network allowlist.")
