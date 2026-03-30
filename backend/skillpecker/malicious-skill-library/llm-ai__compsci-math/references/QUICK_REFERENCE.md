# CompSci Math Agent - Quick Reference Card

## Tool Invocation

```python
from tools import CompSciMathAgent
agent = CompSciMathAgent(checkpointing=True)
result = agent.invoke("tool_name", **params)
```

---

## DOMAIN 1: PROOFS (Chapters 0-7)

| Tool | Signature | Example |
|------|-----------|---------|
| `evaluate_proposition` | `(expression, assignments)` | `("P AND Q", {"P": True, "Q": False})` |
| `truth_table` | `(variables, expression)` | `(["P", "Q"], "P IMPLIES Q")` |
| `for_all` | `(predicate, domain)` | `(lambda x: x > 0, [1,2,3])` |
| `exists` | `(predicate, domain)` | `(lambda x: x % 2 == 0, [1,2,3])` |

**Key Operators**: `AND (∧)`, `OR (∨)`, `NOT (¬)`, `IMPLIES (→)`, `IFF (↔)`, `XOR (⊕)`

---

## DOMAIN 2: STRUCTURES (Chapters 8-12)

| Tool | Signature | Returns |
|------|-----------|---------|
| `gcd` | `(a, b)` | GCD value |
| `gcd_extended` | `(a, b)` | `{gcd, s, t}` where `gcd = s*a + t*b` |
| `mod_exp` | `(base, exp, mod)` | `base^exp mod mod` |
| `euler_phi` | `(n)` | φ(n) count of coprimes |
| `is_prime` | `(n)` | Boolean |
| `rsa_keygen` | `(p, q)` | `{public_key, private_key}` |
| `rsa_encrypt` | `(message, n, e)` | Ciphertext |
| `rsa_decrypt` | `(cipher, n, d)` | Plaintext |

**Key Formulas**:
- Bézout: `gcd(a,b) = sa + tb`
- Euler's Theorem: `a^φ(n) ≡ 1 (mod n)` when `gcd(a,n) = 1`
- RSA: Encrypt `c = m^e mod n`, Decrypt `m = c^d mod n`

---

## DOMAIN 3: COUNTING (Chapters 13-15)

| Tool | Signature | Formula |
|------|-----------|---------|
| `binomial` | `(n, k)` | `n! / (k!(n-k)!)` |
| `permutations` | `(n, k)` | `n! / (n-k)!` |
| `multinomial` | `(n, groups)` | `n! / (r₁!r₂!...rₘ!)` |
| `stirling_approx` | `(n)` | `√(2πn)(n/e)^n` |
| `asymptotic_compare` | `(f, g)` | Relationship: O, Ω, Θ, o, ω |
| `inclusion_exclusion` | `(sets, intersections)` | `|A₁ ∪ ... ∪ Aₙ|` |

**Growth Order**: `1 < log n < √n < n < n log n < n² < 2ⁿ < n!`

---

## DOMAIN 4: PROBABILITY (Chapters 16-20)

| Tool | Signature | Description |
|------|-----------|-------------|
| `bayes_update` | `(prior, likelihood, false_positive)` | P(A\|B) |
| `binomial_prob` | `(n, k, p)` | P(X=k) for X~Bin(n,p) |
| `poisson_prob` | `(k, lambda_)` | P(X=k) for X~Pois(λ) |
| `geometric_prob` | `(k, p)` | P(X=k) for trials until success |
| `expected_value` | `(distribution)` | E[X] = Σ x·P(X=x) |
| `variance` | `(distribution)` | Var(X) = E[X²] - E[X]² |
| `markov_bound` | `(expected, threshold)` | P(X≥c) ≤ E[X]/c |
| `chebyshev_bound` | `(mean, variance, threshold)` | P(\|X-μ\|≥kσ) ≤ 1/k² |
| `chernoff_bound` | `(n, p, delta)` | Exponential tail bounds |

**Key Formulas**:
- Bayes: `P(A|B) = P(B|A)·P(A) / P(B)`
- Linearity: `E[X+Y] = E[X] + E[Y]` (always!)

---

## DOMAIN 5: RECURRENCES (Chapter 21)

| Tool | Signature | Solves |
|------|-----------|--------|
| `master_theorem` | `(a, b, f_complexity)` | T(n) = aT(n/b) + f(n) |
| `solve_linear_recurrence` | `(coefficients, initial_values)` | T(n) = c₁T(n-1) + ... |
| `akra_bazzi` | `(terms, f_degree)` | T(n) = Σ aᵢT(n/bᵢ) + f(n) |
| `evaluate_recurrence` | `(recurrence, base_cases, n)` | Compute T(n) |

**Master Theorem** (T(n) = aT(n/b) + f(n), c = log_b(a)):
- Case 1: f(n) = O(n^(c-ε)) → **T(n) = Θ(n^c)**
- Case 2: f(n) = Θ(n^c) → **T(n) = Θ(n^c log n)**
- Case 3: f(n) = Ω(n^(c+ε)) → **T(n) = Θ(f(n))**

**Common Results**:
| Algorithm | Recurrence | Solution |
|-----------|------------|----------|
| Binary Search | T(n) = T(n/2) + 1 | Θ(log n) |
| Merge Sort | T(n) = 2T(n/2) + n | Θ(n log n) |
| Karatsuba | T(n) = 3T(n/2) + n | Θ(n^1.58) |

---

## State Checkpointing (Praescientia Integration)

```python
agent = CompSciMathAgent(checkpointing=True)

# Each tool call creates a checkpoint
result = agent.invoke("binomial", n=52, k=5)
print(result.state_hash)  # SHA-256 hash for verification

# Rollback to previous state
agent.rollback(checkpoint_hash)
```

---

## Natural Language Queries

```python
agent.query("What is C(52, 5)?")
agent.query("Apply Master Theorem to T(n) = 2T(n/2) + n")
agent.query("Compute GCD(102, 70)")
agent.query("Apply Bayes with prior 0.01 and likelihood 0.95")
```

---

**Reference**: MIT Mathematics for Computer Science (Lehman, Leighton, Meyer)
