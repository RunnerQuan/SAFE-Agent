"""
CompSci Math Agent Tools
========================

Mathematical tools for Claude Code agents based on MIT's
Mathematics for Computer Science curriculum.

Domains:
- Proofs: Propositions, predicates, induction, verification
- Structures: Number theory, graphs, RSA, partial orders
- Counting: Asymptotics, combinatorics, generating functions
- Probability: Distributions, Bayes, random walks, bounds
- Recurrences: Divide-and-conquer, Master theorem, Akra-Bazzi

Backends:
- Python: Always available, full functionality
- Zig: Optional acceleration for local Claude Code with ziglang.org access
- Cyber: Optional scripting backend with Python-like syntax
"""

from .math_agent import (
    CompSciMathAgent,
    MathDomain,
    MathResult,
    ProofTools,
    StructureTools,
    CountingTools,
    ProbabilityTools,
    RecurrenceTools,
)

from .zig_bridge import (
    ZigBridge,
    ZigModule,
    ZigResult,
    HybridMathAgent,
)

from .cyber_bridge import (
    CyberBridge,
    CyberModule,
    CyberResult,
    HybridCyberAgent,
)

__all__ = [
    # Python agent
    'CompSciMathAgent',
    'MathDomain',
    'MathResult',
    'ProofTools',
    'StructureTools',
    'CountingTools',
    'ProbabilityTools',
    'RecurrenceTools',
    # Zig bridge
    'ZigBridge',
    'ZigModule',
    'ZigResult',
    'HybridMathAgent',
    # Cyber bridge
    'CyberBridge',
    'CyberModule',
    'CyberResult',
    'HybridCyberAgent',
]

__version__ = '1.2.0'
