# MATH_PROOFS - Part I: Proofs

**Source**: MIT Mathematics for Computer Science (Lehman, Leighton, Meyer)  
**Chapters**: 0-7 | Propositions, Predicates, Well Ordering, Logical Formulas, Induction, Recursion, Infinite Sets

---

## Overview

Proofs are the foundation of mathematical reasoning and computer science verification. This module translates formal proof structures into computational constructs, enabling programmatic verification of mathematical claims.

---

## 1. Propositions

A **proposition** is a statement that is either true or false.

**Examples**:
- "2 + 3 = 5" is a proposition (true)
- "1 + 1 = 3" is a proposition (false)
- "x + 1 = 2" is NOT a proposition until x is specified (it's a predicate)

**Logical Connectives**:

| Connective | Symbol | Name | Definition |
|------------|--------|------|------------|
| NOT | ¬P | Negation | True iff P is false |
| AND | P ∧ Q | Conjunction | True iff both P and Q are true |
| OR | P ∨ Q | Disjunction | True iff at least one is true |
| XOR | P ⊕ Q | Exclusive Or | True iff exactly one is true |
| IMPLIES | P → Q | Implication | False only when P is true and Q is false |
| IFF | P ↔ Q | Biconditional | True iff both have same truth value |

---

## 2. Predicates and Quantifiers

A **predicate** is a proposition whose truth depends on the value of variables.

**Universal Quantifier** (∀): "For all x, P(x) holds"  
**Existential Quantifier** (∃): "There exists an x such that P(x) holds"

**Negation Rules**:
```
¬(∀x. P(x)) ≡ ∃x. ¬P(x)
¬(∃x. P(x)) ≡ ∀x. ¬P(x)
```

---

## 3. Proof Methods

### 3.1 Direct Proof

To prove P → Q: Assume P is true, then derive Q.

```
Theorem: If n is even, then n² is even.
Proof:
  1. Assume n is even
  2. Then n = 2k for some integer k
  3. n² = (2k)² = 4k² = 2(2k²)
  4. Therefore n² is even ∎
```

### 3.2 Proof by Contrapositive

To prove P → Q, prove ¬Q → ¬P.

```
Theorem: If n² is even, then n is even.
Proof (contrapositive):
  1. Assume n is odd
  2. Then n = 2k + 1 for some integer k
  3. n² = (2k + 1)² = 4k² + 4k + 1 = 2(2k² + 2k) + 1
  4. Therefore n² is odd ∎
```

### 3.3 Proof by Contradiction

To prove P: Assume ¬P and derive a contradiction.

```
Theorem: √2 is irrational.
Proof:
  1. Assume √2 = a/b where a,b are integers with no common factors
  2. Then 2 = a²/b², so 2b² = a²
  3. Therefore a² is even, so a is even (a = 2c)
  4. 2b² = 4c², so b² = 2c²
  5. Therefore b is even
  6. Contradiction: a and b share factor 2 ∎
```

### 3.4 Proof by Cases

Prove P → Q by exhausting all cases of P.

---

## 4. The Well Ordering Principle

**Axiom**: Every nonempty set of nonnegative integers has a smallest element.

**Template for Well Ordering Proofs**:
1. Define the set C of counterexamples
2. Assume C is nonempty
3. By Well Ordering, C has a minimum element m
4. Derive a contradiction (often by finding a smaller counterexample)
5. Conclude C is empty

---

## 5. Mathematical Induction

### 5.1 Ordinary Induction

To prove P(n) for all n ≥ b:
1. **Base Case**: Prove P(b)
2. **Inductive Step**: Prove P(n) → P(n+1) for all n ≥ b

```
Theorem: 1 + 2 + ... + n = n(n+1)/2

Base Case (n=1): 1 = 1(2)/2 = 1 ✓

Inductive Step: Assume 1 + 2 + ... + k = k(k+1)/2
  Then 1 + 2 + ... + k + (k+1) 
     = k(k+1)/2 + (k+1)
     = (k+1)(k/2 + 1)
     = (k+1)(k+2)/2 ✓
```

### 5.2 Strong Induction

To prove P(n) for all n ≥ b:
1. **Base Case**: Prove P(b)
2. **Inductive Step**: Prove [P(b) ∧ P(b+1) ∧ ... ∧ P(n)] → P(n+1)

Strong induction is equivalent to ordinary induction but often more convenient.

---

## 6. Logical Formulas & SAT

### 6.1 Normal Forms

**Conjunctive Normal Form (CNF)**: AND of ORs
```
(A ∨ B) ∧ (¬A ∨ C) ∧ (B ∨ ¬C)
```

**Disjunctive Normal Form (DNF)**: OR of ANDs
```
(A ∧ B) ∨ (¬A ∧ C) ∨ (B ∧ ¬C)
```

### 6.2 SAT Problem

**Satisfiability (SAT)**: Given a propositional formula, determine if there exists an assignment of truth values that makes the formula true.

SAT is NP-complete and foundational to computational complexity theory.

---

## 7. Mathematical Data Types

### 7.1 Sets

```
A = {1, 2, 3}
B = {x | x > 0 and x is even}

Operations:
  A ∪ B   (union)
  A ∩ B   (intersection)
  A - B   (difference)
  A × B   (Cartesian product)
  𝒫(A)    (power set)
```

### 7.2 Sequences

Ordered lists: (a₁, a₂, ..., aₙ)

### 7.3 Functions

f: A → B maps each element of A to exactly one element of B.

**Properties**:
- **Injective (one-to-one)**: f(x) = f(y) implies x = y
- **Surjective (onto)**: Every element in B has a preimage
- **Bijective**: Both injective and surjective

### 7.4 Binary Relations

R ⊆ A × B is a relation from A to B.

**Properties**:
- **Reflexive**: ∀x. xRx
- **Symmetric**: xRy → yRx
- **Transitive**: xRy ∧ yRz → xRz
- **Antisymmetric**: xRy ∧ yRx → x = y

---

## 8. Recursive Data Types

### 8.1 Structural Induction

For recursively defined structures, prove properties by:
1. **Base Case**: Prove for base constructors
2. **Constructor Case**: Assume property holds for substructures, prove for constructed structure

### 8.2 Matched Brackets

A string of brackets is **matched** iff:
- Empty string is matched
- If s is matched, then [s] is matched
- If s and t are matched, then st is matched

---

## 9. Infinite Sets

### 9.1 Cardinality

Two sets have the same cardinality if there exists a bijection between them.

**Countable**: Same cardinality as ℕ (can be listed)
**Uncountable**: Larger cardinality than ℕ

### 9.2 Cantor's Theorem

|𝒫(A)| > |A| for any set A.

The power set of any set has strictly greater cardinality than the set itself.

### 9.3 The Halting Problem

There is no algorithm that can determine, for arbitrary program P and input I, whether P halts on I.

**Proof (by diagonalization)**:
Assume such a program H exists. Construct program D that:
- On input P: runs H(P, P), then loops forever if H says "halts", halts if H says "loops"
- D(D) leads to contradiction ∎

---

## Implementation Notes

The companion `.cy` and `.zig` files implement:
- Proposition types with logical operations
- Predicate evaluation with quantifier support
- Proof verification structures
- Set operations and cardinality comparisons
- Recursive data type construction
- SAT solver framework

---

## Key Theorems

| Theorem | Statement |
|---------|-----------|
| De Morgan's Laws | ¬(P ∧ Q) ≡ ¬P ∨ ¬Q |
| Double Negation | ¬¬P ≡ P |
| Implication | P → Q ≡ ¬P ∨ Q |
| Contrapositive | (P → Q) ≡ (¬Q → ¬P) |
| Distributivity | P ∧ (Q ∨ R) ≡ (P ∧ Q) ∨ (P ∧ R) |

---

## References

- Chapters 0-7 of "Mathematics for Computer Science" by Lehman, Leighton, Meyer (MIT OpenCourseWare)
- Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License
