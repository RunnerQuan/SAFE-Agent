# MATH_RECURRENCES - Part V: Recurrences

**Source**: MIT Mathematics for Computer Science (Lehman, Leighton, Meyer)  
**Chapter**: 21 | Towers of Hanoi, Merge Sort, Linear Recurrences, Divide-and-Conquer

---

## Overview

Recurrences describe sequences where each term depends on previous terms. They arise naturally in the analysis of recursive algorithms and are fundamental to understanding computational complexity. This module covers methods for solving recurrences including guess-and-verify, linear recurrence theory, and the Akra-Bazzi formula for divide-and-conquer algorithms.

---

## 1. Introduction to Recurrences

### 1.1 Definition

A **recurrence** defines a sequence {Tₙ} where:
- Initial terms are specified explicitly (base cases)
- Later terms are expressed as functions of earlier terms

**Example** (simple linear):
```
T₁ = 1
Tₙ = Tₙ₋₁ + 1    for n ≥ 2

Sequence: 1, 2, 3, 4, 5, ...
Solution: Tₙ = n
```

### 1.2 Why Solve Recurrences?

Solving a recurrence means finding a **closed-form expression** for Tₙ that:
- Allows direct computation of any term
- Reveals the asymptotic growth rate
- Facilitates comparison of algorithms

---

## 2. The Towers of Hanoi

### 2.1 Problem

Move n disks from one peg to another, following rules:
- Move only one disk at a time
- Never place larger disk on smaller

### 2.2 Recurrence

```
T₁ = 1
Tₙ = 2Tₙ₋₁ + 1    for n ≥ 2
```

**Derivation**: To move n disks from A to C:
1. Move n-1 disks from A to B (Tₙ₋₁ moves)
2. Move largest disk from A to C (1 move)
3. Move n-1 disks from B to C (Tₙ₋₁ moves)

### 2.3 Solution

```
Tₙ = 2ⁿ - 1
```

**Verification by induction**:
- Base: T₁ = 2¹ - 1 = 1 ✓
- Inductive: Tₙ = 2Tₙ₋₁ + 1 = 2(2ⁿ⁻¹ - 1) + 1 = 2ⁿ - 2 + 1 = 2ⁿ - 1 ✓

---

## 3. Guess-and-Verify Method

### 3.1 Process

1. Compute several terms of the sequence
2. Identify a pattern and guess the closed form
3. Prove the guess correct using induction

### 3.2 Upper Bound Trap

**Warning**: When proving upper bounds, ensure the inductive hypothesis is precise.

**Example** (incorrect):
```
Claim: Tₙ ≤ 2ⁿ for Towers of Hanoi

Attempt: Tₙ = 2Tₙ₋₁ + 1 ≤ 2(2ⁿ⁻¹) + 1 = 2ⁿ + 1

This exceeds the claimed bound!
```

**Solution**: Use stronger hypothesis Tₙ ≤ 2ⁿ - 1.

### 3.3 Common Patterns

```
Constant:     a, a, a, ...           → Tₙ = a
Linear:       a, a+d, a+2d, ...      → Tₙ = a + (n-1)d
Powers of 2:  1, 2, 4, 8, ...        → Tₙ = 2ⁿ⁻¹
Factorials:   1, 1, 2, 6, 24, ...    → Tₙ = (n-1)!
Fibonacci:    0, 1, 1, 2, 3, 5, ...  → Tₙ = (φⁿ - ψⁿ)/√5
```

---

## 4. Plug-and-Chug Method

### 4.1 Process

Repeatedly substitute the recurrence into itself until a pattern emerges.

### 4.2 Example: Towers of Hanoi

```
Tₙ = 2Tₙ₋₁ + 1
   = 2(2Tₙ₋₂ + 1) + 1
   = 4Tₙ₋₂ + 2 + 1
   = 4(2Tₙ₋₃ + 1) + 2 + 1
   = 8Tₙ₋₃ + 4 + 2 + 1
   ...
   = 2ᵏTₙ₋ₖ + 2ᵏ⁻¹ + 2ᵏ⁻² + ... + 2 + 1
   = 2ᵏTₙ₋ₖ + (2ᵏ - 1)

Setting k = n-1:
Tₙ = 2ⁿ⁻¹T₁ + (2ⁿ⁻¹ - 1)
   = 2ⁿ⁻¹ + 2ⁿ⁻¹ - 1
   = 2ⁿ - 1
```

---

## 5. Merge Sort Analysis

### 5.1 Algorithm

To sort n elements:
1. Divide array into two halves
2. Recursively sort each half
3. Merge the sorted halves

### 5.2 Recurrence

```
T(1) = 0
T(n) = 2T(n/2) + n - 1    for n > 1 (n a power of 2)
```

The term n - 1 represents comparisons during merge.

### 5.3 Solution

```
T(n) = n log₂ n - n + 1 = Θ(n log n)
```

**Verification**:
```
T(n) = 2T(n/2) + n - 1
     = 2[(n/2)log₂(n/2) - n/2 + 1] + n - 1
     = n(log₂ n - 1) - n + 2 + n - 1
     = n log₂ n - n + 1 ✓
```

---

## 6. Linear Recurrences

### 6.1 Definition

A **linear recurrence** has the form:
```
Tₙ = a₁Tₙ₋₁ + a₂Tₙ₋₂ + ... + aₖTₙ₋ₖ + f(n)
```

where aᵢ are constants and f(n) is a function of n.

**Homogeneous**: f(n) = 0
**Non-homogeneous**: f(n) ≠ 0

### 6.2 Characteristic Equation Method

For homogeneous linear recurrence:
```
Tₙ = a₁Tₙ₋₁ + a₂Tₙ₋₂ + ... + aₖTₙ₋ₖ
```

The **characteristic equation** is:
```
xᵏ = a₁xᵏ⁻¹ + a₂xᵏ⁻² + ... + aₖ
```

or equivalently:
```
xᵏ - a₁xᵏ⁻¹ - a₂xᵏ⁻² - ... - aₖ = 0
```

### 6.3 Solution from Roots

**Case 1: Distinct roots r₁, r₂, ..., rₖ**
```
Tₙ = c₁r₁ⁿ + c₂r₂ⁿ + ... + cₖrₖⁿ
```

**Case 2: Repeated root r with multiplicity m**
```
Contributes: (c₁ + c₂n + c₃n² + ... + cₘnᵐ⁻¹)rⁿ
```

Constants c₁, c₂, ... are determined by initial conditions.

### 6.4 Example: Fibonacci

```
Fₙ = Fₙ₋₁ + Fₙ₋₂,  F₀ = 0, F₁ = 1

Characteristic equation: x² = x + 1
Roots: φ = (1+√5)/2, ψ = (1-√5)/2

General solution: Fₙ = c₁φⁿ + c₂ψⁿ

From initial conditions:
c₁ = 1/√5, c₂ = -1/√5

Solution: Fₙ = (φⁿ - ψⁿ)/√5
```

Since |ψ| < 1, for large n: Fₙ ≈ φⁿ/√5

---

## 7. Divide-and-Conquer Recurrences

### 7.1 General Form

```
T(n) = aT(n/b) + f(n)
```

where:
- a = number of subproblems
- n/b = size of each subproblem
- f(n) = cost of dividing and combining

### 7.2 Master Theorem

For T(n) = aT(n/b) + f(n) where a ≥ 1, b > 1:

Let c = log_b(a). Then:

**Case 1**: If f(n) = O(n^(c-ε)) for some ε > 0:
```
T(n) = Θ(n^c)
```

**Case 2**: If f(n) = Θ(n^c):
```
T(n) = Θ(n^c log n)
```

**Case 3**: If f(n) = Ω(n^(c+ε)) for some ε > 0, and af(n/b) ≤ kf(n) for k < 1:
```
T(n) = Θ(f(n))
```

### 7.3 Master Theorem Examples

**Binary Search**: T(n) = T(n/2) + 1
- a=1, b=2, f(n)=1
- c = log₂(1) = 0
- f(n) = Θ(n⁰) = Θ(1)
- Case 2: T(n) = Θ(log n)

**Merge Sort**: T(n) = 2T(n/2) + n
- a=2, b=2, f(n)=n
- c = log₂(2) = 1
- f(n) = Θ(n¹)
- Case 2: T(n) = Θ(n log n)

**Karatsuba Multiplication**: T(n) = 3T(n/2) + n
- a=3, b=2, f(n)=n
- c = log₂(3) ≈ 1.58
- f(n) = O(n^(1.58-ε))
- Case 1: T(n) = Θ(n^(log₂ 3)) ≈ Θ(n^1.58)

---

## 8. Akra-Bazzi Formula

### 8.1 General Divide-and-Conquer

For recurrences of the form:
```
T(n) = Σᵢ aᵢT(n/bᵢ) + f(n)
```

where subproblems may have different sizes.

### 8.2 The Formula

Find p such that:
```
Σᵢ aᵢ/bᵢᵖ = 1
```

Then:
```
T(n) = Θ(nᵖ(1 + ∫₁ⁿ f(x)/x^(p+1) dx))
```

### 8.3 Example

T(n) = T(n/2) + T(n/3) + n

Find p: 1/2ᵖ + 1/3ᵖ = 1

Numerically: p ≈ 0.788

T(n) = Θ(n^0.788 · n^0.212) = Θ(n)

(Since ∫ n/x^(p+1) dx contributes Θ(n^(1-p)))

---

## 9. Rules of Thumb

### 9.1 Quick Growth Rate Estimates

For T(n) = aT(n/b) + n^d:

```
If a < b^d:  T(n) = Θ(n^d)           (f(n) dominates)
If a = b^d:  T(n) = Θ(n^d log n)      (balanced)
If a > b^d:  T(n) = Θ(n^(log_b a))    (recursion dominates)
```

### 9.2 Common Patterns

| Recurrence | Solution |
|------------|----------|
| T(n) = T(n-1) + 1 | Θ(n) |
| T(n) = T(n-1) + n | Θ(n²) |
| T(n) = 2T(n-1) | Θ(2ⁿ) |
| T(n) = T(n/2) + 1 | Θ(log n) |
| T(n) = T(n/2) + n | Θ(n) |
| T(n) = 2T(n/2) + 1 | Θ(n) |
| T(n) = 2T(n/2) + n | Θ(n log n) |
| T(n) = 2T(n/2) + n² | Θ(n²) |

---

## 10. Solving Non-Homogeneous Recurrences

### 10.1 Particular Solution Method

For Tₙ = aTₙ₋₁ + f(n):

1. Solve homogeneous part: Tₙ^(h) = c·aⁿ
2. Guess particular solution Tₙ^(p) based on f(n)
3. General solution: Tₙ = Tₙ^(h) + Tₙ^(p)

### 10.2 Guesses for Particular Solutions

| f(n) | Guess Tₙ^(p) |
|------|--------------|
| k (constant) | A |
| n | An + B |
| n² | An² + Bn + C |
| kⁿ (k ≠ a) | Akⁿ |
| kⁿ (k = a) | Ankⁿ |

---

## 11. Generating Functions for Recurrences

### 11.1 Approach

1. Define G(x) = Σₙ Tₙxⁿ
2. Manipulate recurrence to get equation in G(x)
3. Solve for G(x)
4. Extract coefficients (often via partial fractions)

### 11.2 Example: Fibonacci

```
Fₙ = Fₙ₋₁ + Fₙ₋₂, F₀ = 0, F₁ = 1

G(x) = x + xG(x) + x²G(x)
G(x) = x/(1 - x - x²)
G(x) = (1/√5)[1/(1-φx) - 1/(1-ψx)]

Fₙ = [xⁿ]G(x) = (φⁿ - ψⁿ)/√5
```

---

## Implementation Notes

The companion `.cy` and `.zig` files implement:
- Recurrence evaluation (with memoization)
- Linear recurrence solver via characteristic roots
- Master theorem classification and application
- Akra-Bazzi numerical p-finder
- Generating function coefficient extraction
- Common algorithm complexity analyzers

---

## Key Theorems Summary

| Method | Application |
|--------|-------------|
| Guess-and-Verify | Any recurrence (requires insight) |
| Characteristic Equation | Homogeneous linear recurrences |
| Master Theorem | T(n) = aT(n/b) + f(n) |
| Akra-Bazzi | General divide-and-conquer |

---

## References

- Chapter 21 of "Mathematics for Computer Science" by Lehman, Leighton, Meyer (MIT OpenCourseWare)
- Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License
