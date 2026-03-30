# MATH_COUNTING - Part III: Counting

**Source**: MIT Mathematics for Computer Science (Lehman, Leighton, Meyer)  
**Chapters**: 13-15 | Sums and Asymptotics, Cardinality Rules, Generating Functions

---

## Overview

Counting provides the foundation for analyzing algorithms, computing probabilities, and solving optimization problems. This module covers techniques for evaluating sums, asymptotic analysis for growth rates, counting principles for combinatorics, and generating functions as an algebraic tool for sequence manipulation.

---

## 1. Sums

### 1.1 Arithmetic Series

```
1 + 2 + 3 + ... + n = n(n+1)/2 = Θ(n²)

Σᵢ₌₁ⁿ i = n(n+1)/2
```

### 1.2 Geometric Series

```
1 + x + x² + ... + xⁿ = (xⁿ⁺¹ - 1)/(x - 1)    for x ≠ 1

Σᵢ₌₀ⁿ xⁱ = (xⁿ⁺¹ - 1)/(x - 1)

Infinite series (|x| < 1):
Σᵢ₌₀^∞ xⁱ = 1/(1 - x)
```

### 1.3 Powers of Integers

```
Σᵢ₌₁ⁿ i² = n(n+1)(2n+1)/6

Σᵢ₌₁ⁿ i³ = [n(n+1)/2]² = (Σᵢ₌₁ⁿ i)²
```

### 1.4 Harmonic Series

```
Hₙ = 1 + 1/2 + 1/3 + ... + 1/n = Σᵢ₌₁ⁿ 1/i

Hₙ = ln(n) + γ + O(1/n)

where γ ≈ 0.5772 (Euler-Mascheroni constant)
```

### 1.5 Integration Bounds

For monotonic f:
```
∫₀ⁿ f(x)dx ≤ Σᵢ₌₁ⁿ f(i) ≤ f(1) + ∫₁ⁿ f(x)dx    (decreasing f)

∫₁ⁿ f(x)dx ≤ Σᵢ₌₁ⁿ f(i) ≤ f(n) + ∫₁ⁿ f(x)dx    (increasing f)
```

---

## 2. Asymptotic Notation

### 2.1 Big-O Notation

**Definition**: f = O(g) iff there exist constants c > 0 and n₀ such that:
```
f(n) ≤ c · g(n)    for all n ≥ n₀
```

**Interpretation**: f grows no faster than g.

### 2.2 Big-Omega Notation

**Definition**: f = Ω(g) iff there exist constants c > 0 and n₀ such that:
```
f(n) ≥ c · g(n)    for all n ≥ n₀
```

**Interpretation**: f grows at least as fast as g.

### 2.3 Big-Theta Notation

**Definition**: f = Θ(g) iff f = O(g) and f = Ω(g).

**Interpretation**: f and g grow at the same rate.

### 2.4 Little-o and Little-omega

```
f = o(g)  iff  lim(n→∞) f(n)/g(n) = 0
f = ω(g)  iff  lim(n→∞) f(n)/g(n) = ∞
```

### 2.5 Asymptotic Equivalence

```
f ~ g  iff  lim(n→∞) f(n)/g(n) = 1
```

### 2.6 Common Growth Rates

```
1 < log n < √n < n < n log n < n² < n³ < 2ⁿ < n! < nⁿ
```

---

## 3. Cardinality Rules

### 3.1 Sum Rule (Addition Principle)

If A and B are disjoint finite sets:
```
|A ∪ B| = |A| + |B|
```

For multiple disjoint sets:
```
|A₁ ∪ A₂ ∪ ... ∪ Aₙ| = |A₁| + |A₂| + ... + |Aₙ|
```

### 3.2 Product Rule (Multiplication Principle)

For a two-stage process where stage 1 has m outcomes and stage 2 has n outcomes:
```
|A × B| = |A| · |B|
```

**Example**: Passwords with 8 lowercase letters and 2 digits:
```
26⁸ × 10² = 20,882,706,457,600
```

### 3.3 Generalized Product Rule

If a procedure has k stages, with nᵢ choices at stage i:
```
Total outcomes = n₁ · n₂ · ... · nₖ
```

### 3.4 Division Rule

If f: A → B is k-to-1 (exactly k elements of A map to each element of B):
```
|A| = k · |B|
```

### 3.5 Bijection Rule

If there is a bijection f: A → B:
```
|A| = |B|
```

---

## 4. Counting Sequences and Subsets

### 4.1 Permutations

**Permutations of n objects**: n! ways to arrange n distinct objects.

**k-permutations of n objects**: 
```
P(n,k) = n!/(n-k)! = n(n-1)(n-2)...(n-k+1)
```

### 4.2 Combinations

**Choosing k objects from n** (order doesn't matter):
```
C(n,k) = (n choose k) = n!/(k!(n-k)!)
```

**Properties**:
```
(n choose k) = (n choose n-k)                    (symmetry)
(n choose k) = (n-1 choose k-1) + (n-1 choose k) (Pascal's Identity)
Σₖ₌₀ⁿ (n choose k) = 2ⁿ                          (binomial sum)
```

### 4.3 Binomial Theorem

```
(x + y)ⁿ = Σₖ₌₀ⁿ (n choose k) xᵏyⁿ⁻ᵏ
```

### 4.4 Multinomial Theorem

```
(x₁ + x₂ + ... + xₘ)ⁿ = Σ (n choose r₁,r₂,...,rₘ) x₁^r₁ x₂^r₂ ... xₘ^rₘ
```

where the sum is over all (r₁,...,rₘ) with Σrᵢ = n, and:
```
(n choose r₁,r₂,...,rₘ) = n!/(r₁! r₂! ... rₘ!)
```

### 4.5 Counting with Repetition

**Sequences with repetition** (k items from n types): nᵏ

**Multisets** (k items from n types, order doesn't matter):
```
((n choose k)) = (n+k-1 choose k) = (n+k-1)!/(k!(n-1)!)
```

---

## 5. Pigeonhole Principle

### 5.1 Basic Form

If n+1 pigeons are placed in n pigeonholes, at least one hole has ≥2 pigeons.

### 5.2 Generalized Form

If n objects are placed in k boxes, at least one box contains ≥ ⌈n/k⌉ objects.

### 5.3 Applications

**Example**: Among any 13 people, at least 2 share a birth month.

**Example**: In any sequence of n²+1 distinct numbers, there exists a monotonic subsequence of length n+1.

---

## 6. Inclusion-Exclusion Principle

### 6.1 Two Sets

```
|A ∪ B| = |A| + |B| - |A ∩ B|
```

### 6.2 Three Sets

```
|A ∪ B ∪ C| = |A| + |B| + |C| - |A ∩ B| - |A ∩ C| - |B ∩ C| + |A ∩ B ∩ C|
```

### 6.3 General Form

```
|A₁ ∪ A₂ ∪ ... ∪ Aₙ| = Σᵢ|Aᵢ| - Σᵢ<ⱼ|Aᵢ ∩ Aⱼ| + Σᵢ<ⱼ<ₖ|Aᵢ ∩ Aⱼ ∩ Aₖ| - ... + (-1)ⁿ⁺¹|A₁ ∩ ... ∩ Aₙ|
```

### 6.4 Counting Derangements

A **derangement** is a permutation with no fixed points.

The number of derangements of n objects:
```
Dₙ = n! Σₖ₌₀ⁿ (-1)ᵏ/k! ≈ n!/e
```

---

## 7. Combinatorial Proofs

### 7.1 Double Counting

Prove identity by counting the same set two different ways.

**Example (Pascal's Identity)**:
```
(n choose k) = (n-1 choose k-1) + (n-1 choose k)
```

Count k-subsets of {1,...,n}:
- Subsets containing element n: must choose k-1 from remaining n-1 → (n-1 choose k-1)
- Subsets not containing n: choose all k from n-1 → (n-1 choose k)

### 7.2 Bijective Proof

Establish identity by exhibiting an explicit bijection.

---

## 8. Generating Functions

### 8.1 Definition

The **ordinary generating function** (OGF) for sequence ⟨a₀, a₁, a₂, ...⟩ is:
```
G(x) = Σₙ₌₀^∞ aₙxⁿ = a₀ + a₁x + a₂x² + ...
```

### 8.2 Common Generating Functions

```
1/(1-x)   = 1 + x + x² + x³ + ...         (sequence: 1,1,1,1,...)
1/(1-x)²  = 1 + 2x + 3x² + 4x³ + ...      (sequence: 1,2,3,4,...)
1/(1-2x)  = 1 + 2x + 4x² + 8x³ + ...      (sequence: 1,2,4,8,...)
eˣ        = 1 + x + x²/2! + x³/3! + ...   (sequence: 1/n!)
```

### 8.3 Operations on Generating Functions

If G(x) generates ⟨aₙ⟩:

| Operation | Result | Generated Sequence |
|-----------|--------|-------------------|
| cG(x) | Σcaₙxⁿ | ⟨ca₀, ca₁, ca₂, ...⟩ |
| xᵐG(x) | Σaₙxⁿ⁺ᵐ | ⟨0,...,0, a₀, a₁, ...⟩ (m zeros) |
| G'(x) | Σnaₙxⁿ⁻¹ | ⟨a₁, 2a₂, 3a₃, ...⟩ |
| G(x) + H(x) | Σ(aₙ+bₙ)xⁿ | ⟨a₀+b₀, a₁+b₁, ...⟩ |
| G(x)·H(x) | Σcₙxⁿ | ⟨c₀, c₁, ...⟩ where cₙ = Σₖaₖbₙ₋ₖ |

### 8.4 Solving Recurrences

**Example**: Fibonacci sequence Fₙ = Fₙ₋₁ + Fₙ₋₂, F₀ = 0, F₁ = 1

Let G(x) = Σ Fₙxⁿ. Then:
```
G(x) = xG(x) + x²G(x) + x
G(x)(1 - x - x²) = x
G(x) = x/(1 - x - x²)
```

Using partial fractions:
```
G(x) = (1/√5)[1/(1-φx) - 1/(1-ψx)]

where φ = (1+√5)/2, ψ = (1-√5)/2

Fₙ = (φⁿ - ψⁿ)/√5
```

### 8.5 Counting with Generating Functions

**Problem**: Count ways to make n cents using pennies, nickels, and dimes.

```
G(x) = 1/((1-x)(1-x⁵)(1-x¹⁰))

Coefficient of xⁿ gives the answer.
```

---

## 9. Products

### 9.1 Factorials

```
n! = Π_{i=1}^n i = 1 · 2 · 3 · ... · n
```

**Stirling's Approximation**:
```
n! ~ √(2πn)(n/e)ⁿ

ln(n!) = n ln(n) - n + O(ln n)
```

### 9.2 Rising and Falling Factorials

```
n^(k) = n(n+1)(n+2)...(n+k-1)     (rising factorial)
(n)_k = n(n-1)(n-2)...(n-k+1)     (falling factorial)
```

---

## Implementation Notes

The companion `.cy` and `.zig` files implement:
- Sum evaluation functions (arithmetic, geometric, harmonic)
- Asymptotic comparison utilities
- Combinatorial functions (factorial, binomial, multinomial)
- Generating function arithmetic
- Recurrence solving via generating functions
- Inclusion-exclusion calculator

---

## Key Formulas Summary

| Name | Formula |
|------|---------|
| Arithmetic sum | Σᵢ = n(n+1)/2 |
| Geometric sum | Σxⁱ = (xⁿ⁺¹-1)/(x-1) |
| Binomial coefficient | C(n,k) = n!/(k!(n-k)!) |
| Binomial theorem | (x+y)ⁿ = Σ C(n,k)xᵏyⁿ⁻ᵏ |
| Inclusion-Exclusion | \|A∪B\| = \|A\| + \|B\| - \|A∩B\| |
| Stirling's | n! ~ √(2πn)(n/e)ⁿ |

---

## References

- Chapters 13-15 of "Mathematics for Computer Science" by Lehman, Leighton, Meyer (MIT OpenCourseWare)
- Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License
