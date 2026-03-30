---
name: compsci-math
description: Comprehensive computational mathematics toolkit for Claude Code agents. Provides tools for five core domains from MIT's Mathematics for Computer Science curriculum - Proofs (propositions, predicates, induction, verification), Structures (number theory, graphs, RSA, partial orders), Counting (asymptotics, combinatorics, generating functions), Probability (distributions, Bayes, random walks, bounds), and Recurrences (divide-and-conquer, Master theorem, Akra-Bazzi). Use when solving algorithm analysis, proving correctness, computing probabilities, analyzing complexity, or working with discrete mathematical structures. Implemented in Python with TypeScript tool definitions for Claude Code integration.
---

# CompSci Math Agent Tools

A Claude Code agent toolkit implementing the five core mathematical domains from MIT's "Mathematics for Computer Science" (Lehman, Leighton, Meyer).

## Quick Reference

| Domain | Primary Use Cases | Key Tools |
|--------|-------------------|-----------|
| Proofs | Logical verification, induction | `evaluate_proposition`, `verify_induction`, `check_proof` |
| Structures | Graph algorithms, cryptography | `gcd_extended`, `rsa_keygen`, `graph_analyze` |
| Counting | Complexity analysis, combinatorics | `asymptotic_compare`, `binomial`, `generating_func` |
| Probability | Risk assessment, distributions | `bayes_update`, `expected_value`, `chernoff_bound` |
| Recurrences | Algorithm complexity | `master_theorem`, `solve_recurrence`, `akra_bazzi` |

## Tool Invocation Pattern

All tools follow a consistent interface:

```python
from compsci_math import MathAgent

agent = MathAgent()
result = agent.invoke("tool_name", **parameters)
```

## Domain 1: Proofs (Chapters 0-7)

Core logical operations and proof verification. See `references/PROOFS.md` for full theory.

### Proposition Evaluation

Evaluate compound logical statements with all standard connectives.

```python
# Direct evaluation
agent.invoke("evaluate_proposition", 
    expression="(P AND Q) IMPLIES (P OR R)",
    assignments={"P": True, "Q": False, "R": True})

# Truth table generation
agent.invoke("truth_table", variables=["P", "Q"], expression="P IMPLIES Q")
```

### Induction Verification

Verify induction proofs with base case and inductive step checking.

```python
agent.invoke("verify_induction",
    property="sum(1..n) = n*(n+1)/2",
    base_case=1,
    domain="positive_integers")
```

### Predicate Quantifiers

Evaluate universal (∀) and existential (∃) quantifiers over finite domains.

```python
agent.invoke("for_all", predicate="x > 0", domain=range(1, 100))
agent.invoke("exists", predicate="x % 7 == 0", domain=range(1, 50))
```

## Domain 2: Structures (Chapters 8-12)

Number theory and graph structures. See `references/STRUCTURES.md` for full theory.

### Number Theory

```python
# Extended Euclidean Algorithm
agent.invoke("gcd_extended", a=102, b=70)  # Returns (gcd, s, t) where gcd = s*a + t*b

# Modular exponentiation
agent.invoke("mod_exp", base=3, exp=100, mod=17)

# Euler's totient
agent.invoke("euler_phi", n=60)
```

### RSA Operations

```python
# Key generation
keys = agent.invoke("rsa_keygen", bits=2048)

# Encryption/Decryption
cipher = agent.invoke("rsa_encrypt", message=42, public_key=keys["public"])
plain = agent.invoke("rsa_decrypt", cipher=cipher, private_key=keys["private"])
```

### Graph Analysis

```python
# Build and analyze graphs
agent.invoke("graph_create", vertices=5, edges=[(0,1), (1,2), (2,3), (3,4), (4,0)])
agent.invoke("topological_sort", dag=graph)
agent.invoke("is_bipartite", graph=graph)
agent.invoke("chromatic_number", graph=graph)
```

## Domain 3: Counting (Chapters 13-15)

Asymptotic analysis and combinatorics. See `references/COUNTING.md` for full theory.

### Asymptotic Comparison

```python
# Compare growth rates
agent.invoke("asymptotic_compare", f="n^2", g="n*log(n)")  # Returns "f = Ω(g)"

# Classify complexity
agent.invoke("complexity_class", expression="3n^2 + 5n*log(n) + 100")  # Returns "Θ(n²)"
```

### Combinatorics

```python
# Binomial coefficients
agent.invoke("binomial", n=52, k=5)  # C(52,5) = 2,598,960

# Multinomial
agent.invoke("multinomial", n=10, groups=[3, 3, 4])

# Permutations
agent.invoke("permutations", n=10, k=3)  # P(10,3) = 720

# Inclusion-Exclusion
agent.invoke("inclusion_exclusion", set_sizes=[100, 80, 60], intersections={...})
```

### Generating Functions

```python
# Extract coefficient
agent.invoke("gf_coefficient", 
    generating_function="x / (1 - x - x^2)",  # Fibonacci GF
    n=10)  # F_10 = 55

# Solve counting problem
agent.invoke("coin_change", denominations=[1, 5, 10, 25], target=100)
```

## Domain 4: Probability (Chapters 16-20)

Probability theory and distributions. See `references/PROBABILITY.md` for full theory.

### Bayesian Inference

```python
# Bayes' theorem
agent.invoke("bayes_update",
    prior=0.01,           # P(disease)
    likelihood=0.95,       # P(positive | disease)
    false_positive=0.05)   # P(positive | no disease)
```

### Distributions

```python
# Compute probabilities
agent.invoke("binomial_prob", n=10, k=3, p=0.5)
agent.invoke("poisson_prob", k=5, lambda_=3.2)
agent.invoke("geometric_prob", k=4, p=0.3)
```

### Expectation and Variance

```python
# Discrete random variable
agent.invoke("expected_value", distribution={(0, 0.2), (1, 0.5), (2, 0.3)})
agent.invoke("variance", distribution={(0, 0.2), (1, 0.5), (2, 0.3)})
```

### Probability Bounds

```python
# Markov's inequality
agent.invoke("markov_bound", expected_value=10, threshold=50)

# Chebyshev's inequality
agent.invoke("chebyshev_bound", variance=25, deviations=2)

# Chernoff bounds
agent.invoke("chernoff_bound", n=100, p=0.5, delta=0.1)
```

## Domain 5: Recurrences (Chapter 21)

Recurrence relations and algorithm analysis. See `references/RECURRENCES.md` for full theory.

### Master Theorem

```python
# Apply Master Theorem: T(n) = aT(n/b) + f(n)
agent.invoke("master_theorem", a=2, b=2, f="n")
# Returns: "Case 2: T(n) = Θ(n log n)"

agent.invoke("master_theorem", a=4, b=2, f="n")
# Returns: "Case 1: T(n) = Θ(n²)"
```

### Linear Recurrence Solver

```python
# Solve homogeneous linear recurrence
agent.invoke("solve_linear_recurrence",
    coefficients=[1, 1],     # T(n) = T(n-1) + T(n-2)
    initial_values=[0, 1])   # T(0)=0, T(1)=1 (Fibonacci)
# Returns closed form: "(φⁿ - ψⁿ)/√5"
```

### Akra-Bazzi Formula

```python
# General divide-and-conquer
agent.invoke("akra_bazzi",
    terms=[(1, 0.5), (1, 0.33)],  # T(n/2) + T(n/3)
    f="n")
# Returns p ≈ 0.788 and asymptotic solution
```

### Recurrence Evaluation

```python
# Compute terms with memoization
agent.invoke("evaluate_recurrence",
    recurrence="T(n) = 2*T(n-1) + 1",
    base_cases={1: 1},
    n=20)
```

## Implementation Files

The skill includes reference implementations in both Cyber and Zig:

| File | Language | Description |
|------|----------|-------------|
| `tools/math_proofs.py` | Python | Proof verification tools |
| `tools/math_structures.py` | Python | Number theory and graphs |
| `tools/math_counting.py` | Python | Combinatorics and asymptotics |
| `tools/math_probability.py` | Python | Probability computations |
| `tools/math_recurrences.py` | Python | Recurrence solvers |

## Agent Integration

For Claude Code integration, import the unified agent interface:

```python
from tools.math_agent import CompSciMathAgent

agent = CompSciMathAgent()

# Route to appropriate domain automatically
result = agent.query("What is the complexity of T(n) = 2T(n/2) + n?")
result = agent.query("Compute C(52, 5)")
result = agent.query("Apply Bayes' theorem with prior 0.01 and likelihood 0.95")
```

## Error Handling

All tools return structured results:

```python
{
    "success": bool,
    "result": <computed_value>,
    "explanation": str,          # Human-readable reasoning
    "latex": str,                # LaTeX representation
    "complexity": str,           # Time/space complexity of computation
    "references": [str]          # Relevant theorem citations
}
```

## Grace Hopper Integration

This toolkit supports the Praescientia prediction system's state checkpoint and rollback architecture. Mathematical computations produce immutable, hashable results suitable for blockchain-based consensus:

```python
from tools.math_agent import CompSciMathAgent

agent = CompSciMathAgent(checkpointing=True)
result = agent.invoke("master_theorem", a=2, b=2, f="n")

# Result includes hash for state verification
print(result.state_hash)  # SHA-256 of computation state
```

## Zig Acceleration (Local Claude Code)

For local Claude Code installations with network access to `ziglang.org`, the skill supports compiled Zig binaries for performance-critical operations. The Zig implementations offer significant speed advantages for large number operations, extensive iteration, and memory-intensive graph algorithms.

### Prerequisites

Zig acceleration requires adding `ziglang.org` to your Claude Code network allowlist. See the implementation plan documentation for configuration details.

### Installation

Run the Zig installation script to download and configure the compiler:

```bash
./scripts/install_zig.sh
```

### Using the Hybrid Agent

The `HybridMathAgent` automatically selects between Zig and Python backends based on availability:

```python
from tools.zig_bridge import HybridMathAgent

agent = HybridMathAgent(prefer_zig=True)

# Uses Zig when available, falls back to Python otherwise
result = agent.invoke("gcd_extended", a=102, b=70)

# Check backend status
print(agent.get_backend_status())
```

### Direct Zig Bridge Access

For fine-grained control over compilation and invocation:

```python
from tools.zig_bridge import ZigBridge, ZigModule

bridge = ZigBridge()

# Check Zig availability
if bridge.is_zig_available():
    # Compile a specific module
    bridge.compile_module(ZigModule.STRUCTURES, optimize=True)
    
    # Invoke a function
    result = bridge.invoke(
        ZigModule.STRUCTURES, 
        "gcd_extended", 
        {"a": 102, "b": 70}
    )
    print(result.result)
```

### Zig-Accelerated Tools

The following tools have Zig implementations available:

| Tool | Module | Typical Speedup |
|------|--------|-----------------|
| `gcd` | STRUCTURES | 5-10× |
| `gcd_extended` | STRUCTURES | 5-10× |
| `mod_exp` | STRUCTURES | 10-50× |
| `euler_phi` | STRUCTURES | 5-10× |
| `is_prime` | STRUCTURES | 10-100× |
| `binomial` | COUNTING | 3-5× |
| `permutations` | COUNTING | 3-5× |
| `evaluate_recurrence` | RECURRENCES | 10-50× |

### Fallback Behavior

When Zig is unavailable (hosted Claude Code environment), all operations transparently fall back to the Python implementations with no change to the API. Code written for the hybrid agent works in both environments.
