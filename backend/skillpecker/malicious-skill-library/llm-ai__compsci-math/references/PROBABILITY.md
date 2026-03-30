# MATH_PROBABILITY - Part IV: Probability

**Source**: MIT Mathematics for Computer Science (Lehman, Leighton, Meyer)  
**Chapters**: 16-20 | Events and Probability Spaces, Conditional Probability, Random Variables, Deviation, Random Walks

---

## Overview

Probability theory provides the mathematical foundation for reasoning about uncertainty. This module covers probability spaces, conditional probability, random variables, expectation, variance, and the analysis of random processes. Applications include randomized algorithms, statistical analysis, and stochastic modeling.

---

## 1. Probability Spaces

### 1.1 Sample Space and Events

**Sample Space** (Ω): Set of all possible outcomes.

**Event**: A subset of the sample space.

**Probability Function**: P: Events → [0,1] satisfying:
- P(Ω) = 1
- P(∅) = 0
- For disjoint events A, B: P(A ∪ B) = P(A) + P(B)

### 1.2 Discrete Probability

For countable Ω with outcome probabilities {pω}:
```
P(A) = Σ_{ω ∈ A} pω
```

**Uniform Distribution**: Each outcome equally likely.
```
P(A) = |A|/|Ω|
```

### 1.3 Four-Step Method for Probability Problems

1. **Find the sample space**: Identify all possible outcomes
2. **Define events of interest**: Specify the set of favorable outcomes
3. **Determine outcome probabilities**: Often uniform
4. **Compute event probabilities**: Sum over favorable outcomes

---

## 2. Probability Rules

### 2.1 Complement Rule

```
P(Ā) = 1 - P(A)
```

### 2.2 Union Rule

```
P(A ∪ B) = P(A) + P(B) - P(A ∩ B)
```

### 2.3 Difference Rule

```
P(A - B) = P(A) - P(A ∩ B)
```

### 2.4 Monotonicity

```
A ⊆ B  →  P(A) ≤ P(B)
```

### 2.5 Union Bound (Boole's Inequality)

```
P(A₁ ∪ A₂ ∪ ... ∪ Aₙ) ≤ P(A₁) + P(A₂) + ... + P(Aₙ)
```

---

## 3. Conditional Probability

### 3.1 Definition

The probability of A given that B occurred:
```
P(A | B) = P(A ∩ B) / P(B)    when P(B) > 0
```

### 3.2 Product Rule

```
P(A ∩ B) = P(A) · P(B | A) = P(B) · P(A | B)
```

**Chain Rule** (generalized):
```
P(A₁ ∩ A₂ ∩ ... ∩ Aₙ) = P(A₁) · P(A₂|A₁) · P(A₃|A₁∩A₂) · ... · P(Aₙ|A₁∩...∩Aₙ₋₁)
```

### 3.3 Law of Total Probability

If B₁, B₂, ..., Bₙ partition Ω (mutually exclusive, exhaustive):
```
P(A) = Σᵢ P(A | Bᵢ) · P(Bᵢ)
```

### 3.4 Bayes' Theorem

```
P(A | B) = P(B | A) · P(A) / P(B)
```

**Extended form** (with partition {Aᵢ}):
```
P(Aⱼ | B) = P(B | Aⱼ) · P(Aⱼ) / Σᵢ P(B | Aᵢ) · P(Aᵢ)
```

### 3.5 Monty Hall Problem

Behind 3 doors: 1 car, 2 goats. You choose a door, host opens another (always showing a goat), offers switch.

**Strategy**: Always switch! P(win | switch) = 2/3, P(win | stay) = 1/3.

---

## 4. Independence

### 4.1 Definition

Events A and B are **independent** iff:
```
P(A ∩ B) = P(A) · P(B)
```

Equivalently (when P(B) > 0):
```
P(A | B) = P(A)
```

### 4.2 Mutual Independence

Events A₁, A₂, ..., Aₙ are **mutually independent** iff for every subset S:
```
P(∩_{i ∈ S} Aᵢ) = Π_{i ∈ S} P(Aᵢ)
```

**Note**: Pairwise independence does not imply mutual independence.

### 4.3 Independence vs. Disjointness

**Warning**: Disjoint events (A ∩ B = ∅) are NOT independent (unless one has probability 0).

---

## 5. Random Variables

### 5.1 Definition

A **random variable** R is a function R: Ω → ℝ mapping outcomes to real numbers.

**Notation**: P(R = x) = P({ω ∈ Ω : R(ω) = x})

### 5.2 Indicator Random Variables

For event A, the **indicator** Iₐ:
```
Iₐ(ω) = 1 if ω ∈ A
Iₐ(ω) = 0 if ω ∉ A

E[Iₐ] = P(A)
```

### 5.3 Independence of Random Variables

R₁ and R₂ are **independent** iff for all x₁, x₂:
```
P(R₁ = x₁ ∧ R₂ = x₂) = P(R₁ = x₁) · P(R₂ = x₂)
```

---

## 6. Distribution Functions

### 6.1 Probability Distribution Function (PDF)

```
f_R(x) = P(R = x)
```

### 6.2 Cumulative Distribution Function (CDF)

```
F_R(x) = P(R ≤ x) = Σ_{y ≤ x} f_R(y)
```

### 6.3 Common Distributions

**Bernoulli**: Single trial with success probability p.
```
P(X = 1) = p,  P(X = 0) = 1-p
E[X] = p,  Var(X) = p(1-p)
```

**Binomial**: n independent trials, each with success probability p.
```
P(X = k) = C(n,k) pᵏ(1-p)ⁿ⁻ᵏ
E[X] = np,  Var(X) = np(1-p)
```

**Geometric**: Number of trials until first success.
```
P(X = k) = (1-p)ᵏ⁻¹p    for k = 1, 2, 3, ...
E[X] = 1/p,  Var(X) = (1-p)/p²
```

**Poisson**: Rare events with rate λ.
```
P(X = k) = e⁻λ λᵏ/k!    for k = 0, 1, 2, ...
E[X] = λ,  Var(X) = λ
```

**Uniform**: Equally likely values in {1, ..., n}.
```
P(X = k) = 1/n    for k = 1, ..., n
E[X] = (n+1)/2,  Var(X) = (n²-1)/12
```

---

## 7. Expectation

### 7.1 Definition

```
E[R] = Σ_x x · P(R = x) = Σ_x x · f_R(x)
```

### 7.2 Linearity of Expectation

For ANY random variables R₁, R₂, ... (not necessarily independent):
```
E[R₁ + R₂ + ... + Rₙ] = E[R₁] + E[R₂] + ... + E[Rₙ]
E[cR] = c · E[R]
```

### 7.3 Product of Independent Variables

If R₁, R₂ are independent:
```
E[R₁ · R₂] = E[R₁] · E[R₂]
```

### 7.4 Expectation of Functions

```
E[g(R)] = Σ_x g(x) · P(R = x)
```

### 7.5 Law of Total Expectation

```
E[X] = Σᵢ E[X | Aᵢ] · P(Aᵢ)
```

---

## 8. Deviation from the Mean

### 8.1 Variance

```
Var(R) = E[(R - E[R])²] = E[R²] - (E[R])²
```

### 8.2 Standard Deviation

```
σ_R = √Var(R)
```

### 8.3 Properties of Variance

```
Var(cR) = c² Var(R)
Var(R + c) = Var(R)
```

For INDEPENDENT R₁, R₂:
```
Var(R₁ + R₂) = Var(R₁) + Var(R₂)
```

### 8.4 Covariance

```
Cov(R, S) = E[(R - E[R])(S - E[S])] = E[RS] - E[R]E[S]

Var(R + S) = Var(R) + Var(S) + 2Cov(R,S)
```

---

## 9. Probability Bounds

### 9.1 Markov's Inequality

For nonnegative R and c > 0:
```
P(R ≥ c) ≤ E[R] / c
```

### 9.2 Chebyshev's Inequality

For any R with mean μ and variance σ²:
```
P(|R - μ| ≥ kσ) ≤ 1/k²
```

Equivalently:
```
P(|R - μ| ≥ c) ≤ σ²/c²
```

### 9.3 Chernoff Bounds

For sum S = X₁ + X₂ + ... + Xₙ of independent Bernoulli variables with E[S] = μ:

**Upper tail**:
```
P(S ≥ (1 + δ)μ) ≤ e^(-δ²μ/3)    for 0 < δ < 1
```

**Lower tail**:
```
P(S ≤ (1 - δ)μ) ≤ e^(-δ²μ/2)    for 0 < δ < 1
```

---

## 10. Random Walks

### 10.1 Gambler's Ruin

Starting with n dollars, betting 1 dollar per round, fair game (p = 0.5).

**Probability of ruin** (reaching 0 before reaching T):
```
P(ruin) = 1 - n/T
```

For biased game (win prob p ≠ 0.5):
```
P(ruin) = (qⁿ - qᵀ)/(1 - qᵀ)    where q = (1-p)/p
```

### 10.2 Random Walks on Graphs

**Definition**: Start at vertex v, at each step move to a random neighbor.

**Stationary Distribution** π: Probability distribution satisfying π = πP where P is the transition matrix.

For connected, aperiodic graphs, the walk converges to the stationary distribution.

### 10.3 Cover Time

Expected time to visit all vertices in a random walk.

For n-vertex graph: Cover time ≤ 4n³ (general bound).

### 10.4 Hitting Time

**Hitting time** h(u,v): Expected steps to reach v starting from u.

**Commute time**: h(u,v) + h(v,u)

---

## 11. Birthday Paradox

### 11.1 Problem

With n people, what's the probability that at least two share a birthday (365 days)?

### 11.2 Analysis

```
P(no collision) = (1 - 1/365)(1 - 2/365)...(1 - (n-1)/365)

P(collision) ≈ 1 - e^(-n²/730)
```

For P(collision) > 0.5: n ≈ 23

### 11.3 Generalization

With d days and n people:
```
P(collision) ≈ 1 - e^(-n²/2d)

50% threshold: n ≈ 1.2√d
```

---

## 12. Simpson's Paradox

A phenomenon where a trend appears in different groups of data but disappears or reverses when the groups are combined.

**Example**: Treatment A appears better than B in every subgroup, but B appears better overall. This occurs due to confounding variables in group allocation.

---

## Implementation Notes

The companion `.cy` and `.zig` files implement:
- Probability space definitions and operations
- Conditional probability calculations
- Random variable simulation
- Distribution functions (PDF, CDF)
- Expectation and variance computation
- Markov, Chebyshev, and Chernoff bounds
- Random walk simulation
- Monte Carlo estimation

---

## Key Formulas Summary

| Concept | Formula |
|---------|---------|
| Conditional Probability | P(A\|B) = P(A∩B)/P(B) |
| Bayes' Theorem | P(A\|B) = P(B\|A)P(A)/P(B) |
| Expectation | E[R] = Σx·P(R=x) |
| Variance | Var(R) = E[R²] - E[R]² |
| Markov | P(R≥c) ≤ E[R]/c |
| Chebyshev | P(\|R-μ\|≥kσ) ≤ 1/k² |

---

## References

- Chapters 16-20 of "Mathematics for Computer Science" by Lehman, Leighton, Meyer (MIT OpenCourseWare)
- Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License
