/**
 * CompSci Math Agent - Claude Code Tool Definitions
 * =================================================
 * MIT Mathematics for Computer Science Agent Tools
 * 
 * These tool definitions can be imported into Claude Code for
 * mathematical reasoning and algorithm analysis.
 */

import { z } from 'zod';

// =============================================================================
// SHARED TYPES
// =============================================================================

export const MathDomain = z.enum([
  'proofs',
  'structures', 
  'counting',
  'probability',
  'recurrences'
]);

export const MathResultSchema = z.object({
  success: z.boolean(),
  result: z.any(),
  explanation: z.string(),
  latex: z.string().optional(),
  complexity: z.string().optional(),
  references: z.array(z.string()).default([]),
  state_hash: z.string(),
  domain: MathDomain
});

export type MathResult = z.infer<typeof MathResultSchema>;

// =============================================================================
// DOMAIN 1: PROOFS TOOLS
// =============================================================================

export const evaluatePropositionTool = {
  name: 'evaluate_proposition',
  description: `Evaluate a propositional logic expression with given variable assignments.
    
Supports logical connectives: AND, OR, NOT, IMPLIES, IFF, XOR
Can also use symbols: ∧ (AND), ∨ (OR), ¬ (NOT), → (IMPLIES), ↔ (IFF), ⊕ (XOR)

Examples:
- "(P AND Q) IMPLIES (P OR R)" with P=true, Q=false, R=true
- "NOT (A AND B)" with A=true, B=false

From MIT MCS Chapters 0-1: Propositions and Logical Connectives`,
  
  inputSchema: z.object({
    expression: z.string().describe('Propositional logic expression'),
    assignments: z.record(z.string(), z.boolean()).describe('Variable name to boolean value mapping')
  }),
  
  outputSchema: MathResultSchema
};

export const truthTableTool = {
  name: 'truth_table',
  description: `Generate a complete truth table for a propositional expression.
    
Lists all possible combinations of truth values for the given variables
and computes the expression's value for each combination.

From MIT MCS Chapter 1: Truth Tables`,
  
  inputSchema: z.object({
    variables: z.array(z.string()).describe('List of variable names'),
    expression: z.string().describe('Propositional logic expression')
  }),
  
  outputSchema: MathResultSchema
};

export const forAllTool = {
  name: 'for_all',
  description: `Universal quantifier: Check if ∀x ∈ domain. P(x) holds.
    
Returns true if the predicate is satisfied by all elements in the domain.
If false, provides a counterexample.

From MIT MCS Chapter 2: Predicates and Quantifiers`,
  
  inputSchema: z.object({
    predicate: z.string().describe('Predicate expression as string (e.g., "x > 0")'),
    domain: z.array(z.number()).describe('Finite domain to check')
  }),
  
  outputSchema: MathResultSchema
};

export const existsTool = {
  name: 'exists',
  description: `Existential quantifier: Check if ∃x ∈ domain. P(x) holds.
    
Returns true if at least one element in the domain satisfies the predicate.
If true, provides a witness.

From MIT MCS Chapter 2: Predicates and Quantifiers`,
  
  inputSchema: z.object({
    predicate: z.string().describe('Predicate expression as string'),
    domain: z.array(z.number()).describe('Finite domain to search')
  }),
  
  outputSchema: MathResultSchema
};

// =============================================================================
// DOMAIN 2: STRUCTURES TOOLS
// =============================================================================

export const gcdTool = {
  name: 'gcd',
  description: `Compute GCD using the Euclidean algorithm.
    
Shows step-by-step computation of greatest common divisor.
Time complexity: O(log(min(a,b)))

From MIT MCS Chapter 8: Number Theory`,
  
  inputSchema: z.object({
    a: z.number().int().positive().describe('First positive integer'),
    b: z.number().int().nonnegative().describe('Second non-negative integer')
  }),
  
  outputSchema: MathResultSchema
};

export const gcdExtendedTool = {
  name: 'gcd_extended',
  description: `Extended Euclidean Algorithm.
    
Returns (gcd, s, t) where gcd(a,b) = s*a + t*b (Bézout's identity).
Essential for computing modular multiplicative inverses.

From MIT MCS Chapter 8: Bézout's Identity`,
  
  inputSchema: z.object({
    a: z.number().int().describe('First integer'),
    b: z.number().int().describe('Second integer')
  }),
  
  outputSchema: MathResultSchema
};

export const modExpTool = {
  name: 'mod_exp',
  description: `Modular exponentiation: base^exp mod mod.
    
Uses fast exponentiation (square-and-multiply) for O(log exp) complexity.
Essential for RSA encryption and other cryptographic operations.

From MIT MCS Chapter 8: Modular Arithmetic`,
  
  inputSchema: z.object({
    base: z.number().int().describe('Base value'),
    exp: z.number().int().nonnegative().describe('Exponent (non-negative)'),
    mod: z.number().int().positive().describe('Modulus (positive)')
  }),
  
  outputSchema: MathResultSchema
};

export const eulerPhiTool = {
  name: 'euler_phi',
  description: `Euler's totient function φ(n).
    
Counts integers in [1,n] that are coprime to n.
Key formulas: φ(p) = p-1 for prime p, φ(mn) = φ(m)φ(n) when gcd(m,n)=1

From MIT MCS Chapter 8: Euler's Theorem`,
  
  inputSchema: z.object({
    n: z.number().int().positive().describe('Positive integer')
  }),
  
  outputSchema: MathResultSchema
};

export const isPrimeTool = {
  name: 'is_prime',
  description: `Primality test using trial division.
    
Tests if n is prime by checking divisibility up to √n.
Time complexity: O(√n)

From MIT MCS Chapter 8: Prime Numbers`,
  
  inputSchema: z.object({
    n: z.number().int().describe('Integer to test')
  }),
  
  outputSchema: MathResultSchema
};

export const rsaKeygenTool = {
  name: 'rsa_keygen',
  description: `RSA key generation from two primes.
    
Given primes p and q:
1. Compute n = pq
2. Compute φ(n) = (p-1)(q-1)
3. Choose e coprime to φ(n)
4. Compute d ≡ e⁻¹ (mod φ(n))

Returns public key (n, e) and private key d.

From MIT MCS Chapter 8: RSA Encryption`,
  
  inputSchema: z.object({
    p: z.number().int().positive().describe('First prime'),
    q: z.number().int().positive().describe('Second prime')
  }),
  
  outputSchema: MathResultSchema
};

export const rsaEncryptTool = {
  name: 'rsa_encrypt',
  description: `RSA encryption: c = m^e mod n
    
Encrypts message m using public key (n, e).

From MIT MCS Chapter 8: RSA Encryption`,
  
  inputSchema: z.object({
    message: z.number().int().nonnegative().describe('Message as integer (must be < n)'),
    n: z.number().int().positive().describe('RSA modulus'),
    e: z.number().int().positive().describe('Public exponent')
  }),
  
  outputSchema: MathResultSchema
};

export const rsaDecryptTool = {
  name: 'rsa_decrypt',
  description: `RSA decryption: m = c^d mod n
    
Decrypts ciphertext c using private key d.

From MIT MCS Chapter 8: RSA Decryption`,
  
  inputSchema: z.object({
    cipher: z.number().int().nonnegative().describe('Ciphertext'),
    n: z.number().int().positive().describe('RSA modulus'),
    d: z.number().int().positive().describe('Private exponent')
  }),
  
  outputSchema: MathResultSchema
};

// =============================================================================
// DOMAIN 3: COUNTING TOOLS
// =============================================================================

export const binomialTool = {
  name: 'binomial',
  description: `Binomial coefficient C(n,k) = n! / (k!(n-k)!)
    
Number of ways to choose k items from n distinct items.
Also written as (n choose k) or "n choose k".

Properties:
- C(n,k) = C(n, n-k) (symmetry)
- C(n,k) = C(n-1,k-1) + C(n-1,k) (Pascal's identity)

From MIT MCS Chapter 14: Binomial Coefficients`,
  
  inputSchema: z.object({
    n: z.number().int().nonnegative().describe('Total items'),
    k: z.number().int().nonnegative().describe('Items to choose')
  }),
  
  outputSchema: MathResultSchema
};

export const permutationsTool = {
  name: 'permutations',
  description: `Permutations P(n,k) = n! / (n-k)!
    
Number of ways to arrange k items from n distinct items (order matters).

From MIT MCS Chapter 14: Permutations`,
  
  inputSchema: z.object({
    n: z.number().int().nonnegative().describe('Total items'),
    k: z.number().int().nonnegative().describe('Items to arrange')
  }),
  
  outputSchema: MathResultSchema
};

export const multinomialTool = {
  name: 'multinomial',
  description: `Multinomial coefficient: n! / (r₁! × r₂! × ... × rₘ!)
    
Number of ways to partition n items into groups of sizes r₁, r₂, ..., rₘ.
Note: sum of groups must equal n.

From MIT MCS Chapter 14: Multinomial Theorem`,
  
  inputSchema: z.object({
    n: z.number().int().nonnegative().describe('Total items'),
    groups: z.array(z.number().int().nonnegative()).describe('Size of each group')
  }),
  
  outputSchema: MathResultSchema
};

export const asymptoticCompareTool = {
  name: 'asymptotic_compare',
  description: `Compare asymptotic growth rates of two functions.
    
Returns relationship: O, Ω, Θ, o, or ω.

Common growth order: 1 < log n < √n < n < n log n < n² < n³ < 2ⁿ < n! < nⁿ

From MIT MCS Chapter 13: Asymptotic Notation`,
  
  inputSchema: z.object({
    f: z.string().describe('First function (e.g., "n^2", "n*log(n)")'),
    g: z.string().describe('Second function')
  }),
  
  outputSchema: MathResultSchema
};

export const inclusionExclusionTool = {
  name: 'inclusion_exclusion',
  description: `Inclusion-Exclusion principle for computing |A₁ ∪ A₂ ∪ ... ∪ Aₙ|.
    
Formula: Σ|Aᵢ| - Σ|Aᵢ∩Aⱼ| + Σ|Aᵢ∩Aⱼ∩Aₖ| - ...

From MIT MCS Chapter 14: Inclusion-Exclusion`,
  
  inputSchema: z.object({
    sets: z.array(z.number().int().nonnegative()).describe('Sizes of individual sets'),
    intersections: z.record(z.string(), z.number().int().nonnegative())
      .describe('Map of "i,j" or "i,j,k" to intersection size')
  }),
  
  outputSchema: MathResultSchema
};

// =============================================================================
// DOMAIN 4: PROBABILITY TOOLS
// =============================================================================

export const bayesUpdateTool = {
  name: 'bayes_update',
  description: `Apply Bayes' theorem to update probability given evidence.
    
P(A|B) = P(B|A) × P(A) / P(B)

Args:
- prior: P(A) - prior probability of hypothesis
- likelihood: P(B|A) - probability of evidence given hypothesis is true
- false_positive: P(B|¬A) - probability of evidence given hypothesis is false

From MIT MCS Chapter 17: Bayes' Theorem`,
  
  inputSchema: z.object({
    prior: z.number().min(0).max(1).describe('Prior probability P(A)'),
    likelihood: z.number().min(0).max(1).describe('Likelihood P(B|A)'),
    false_positive: z.number().min(0).max(1).describe('False positive rate P(B|¬A)')
  }),
  
  outputSchema: MathResultSchema
};

export const binomialProbTool = {
  name: 'binomial_prob',
  description: `Binomial distribution probability P(X = k) for X ~ Binomial(n, p).
    
P(X=k) = C(n,k) × p^k × (1-p)^(n-k)

Also returns E[X] = np and Var(X) = np(1-p).

From MIT MCS Chapter 18: Binomial Distribution`,
  
  inputSchema: z.object({
    n: z.number().int().nonnegative().describe('Number of trials'),
    k: z.number().int().nonnegative().describe('Number of successes'),
    p: z.number().min(0).max(1).describe('Success probability per trial')
  }),
  
  outputSchema: MathResultSchema
};

export const poissonProbTool = {
  name: 'poisson_prob',
  description: `Poisson distribution probability P(X = k) for X ~ Poisson(λ).
    
P(X=k) = e^(-λ) × λ^k / k!

E[X] = Var(X) = λ

From MIT MCS Chapter 18: Poisson Distribution`,
  
  inputSchema: z.object({
    k: z.number().int().nonnegative().describe('Number of events'),
    lambda_: z.number().positive().describe('Rate parameter λ')
  }),
  
  outputSchema: MathResultSchema
};

export const expectedValueTool = {
  name: 'expected_value',
  description: `Compute expected value E[X] for discrete distribution.
    
E[X] = Σ x × P(X=x)

From MIT MCS Chapter 19: Expectation`,
  
  inputSchema: z.object({
    distribution: z.array(z.tuple([z.number(), z.number()]))
      .describe('Array of [value, probability] pairs')
  }),
  
  outputSchema: MathResultSchema
};

export const varianceTool = {
  name: 'variance',
  description: `Compute variance Var(X) = E[X²] - E[X]² for discrete distribution.
    
From MIT MCS Chapter 19: Variance`,
  
  inputSchema: z.object({
    distribution: z.array(z.tuple([z.number(), z.number()]))
      .describe('Array of [value, probability] pairs')
  }),
  
  outputSchema: MathResultSchema
};

export const markovBoundTool = {
  name: 'markov_bound',
  description: `Markov's inequality: P(X ≥ c) ≤ E[X]/c for X ≥ 0.
    
Provides upper bound on tail probability using only expected value.

From MIT MCS Chapter 19: Markov's Inequality`,
  
  inputSchema: z.object({
    expected_value: z.number().nonnegative().describe('E[X]'),
    threshold: z.number().positive().describe('Threshold c')
  }),
  
  outputSchema: MathResultSchema
};

export const chebyshevBoundTool = {
  name: 'chebyshev_bound',
  description: `Chebyshev's inequality: P(|X - μ| ≥ kσ) ≤ 1/k².
    
Provides bound on deviation from mean using variance.

From MIT MCS Chapter 19: Chebyshev's Inequality`,
  
  inputSchema: z.object({
    mean: z.number().describe('Mean μ'),
    variance: z.number().nonnegative().describe('Variance σ²'),
    threshold: z.number().positive().describe('Deviation threshold')
  }),
  
  outputSchema: MathResultSchema
};

export const chernoffBoundTool = {
  name: 'chernoff_bound',
  description: `Chernoff bounds for sum of independent Bernoulli trials.
    
For S = X₁ + X₂ + ... + Xₙ with E[S] = μ:
- Upper tail: P(S ≥ (1+δ)μ) ≤ e^(-δ²μ/3)
- Lower tail: P(S ≤ (1-δ)μ) ≤ e^(-δ²μ/2)

From MIT MCS Chapter 19: Chernoff Bounds`,
  
  inputSchema: z.object({
    n: z.number().int().positive().describe('Number of trials'),
    p: z.number().min(0).max(1).describe('Success probability'),
    delta: z.number().min(0).max(1).describe('Relative deviation δ')
  }),
  
  outputSchema: MathResultSchema
};

// =============================================================================
// DOMAIN 5: RECURRENCES TOOLS
// =============================================================================

export const masterTheoremTool = {
  name: 'master_theorem',
  description: `Apply Master Theorem for T(n) = aT(n/b) + f(n).
    
Let c = log_b(a). Then:
- Case 1: f(n) = O(n^(c-ε)) → T(n) = Θ(n^c)
- Case 2: f(n) = Θ(n^c) → T(n) = Θ(n^c log n)
- Case 3: f(n) = Ω(n^(c+ε)) → T(n) = Θ(f(n))

Common examples:
- Binary Search: a=1, b=2, f=1 → Θ(log n)
- Merge Sort: a=2, b=2, f=n → Θ(n log n)
- Karatsuba: a=3, b=2, f=n → Θ(n^1.58)

From MIT MCS Chapter 21: Master Theorem`,
  
  inputSchema: z.object({
    a: z.number().int().positive().describe('Number of subproblems'),
    b: z.number().positive().min(1).describe('Factor by which problem size shrinks'),
    f_complexity: z.string().describe('Work done outside recursion (e.g., "n", "n^2", "1")')
  }),
  
  outputSchema: MathResultSchema
};

export const solveLinearRecurrenceTool = {
  name: 'solve_linear_recurrence',
  description: `Solve homogeneous linear recurrence using characteristic equation.
    
For T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k):
1. Form characteristic equation x^k - c₁x^(k-1) - ... - cₖ = 0
2. Find roots r₁, r₂, ..., rₖ
3. General solution: T(n) = Σ cᵢrᵢⁿ

Example: Fibonacci T(n) = T(n-1) + T(n-2) gives T(n) = (φⁿ - ψⁿ)/√5

From MIT MCS Chapter 21: Linear Recurrences`,
  
  inputSchema: z.object({
    coefficients: z.array(z.number()).describe('Coefficients [c₁, c₂, ..., cₖ]'),
    initial_values: z.array(z.number()).describe('Initial values [T(0), T(1), ..., T(k-1)]')
  }),
  
  outputSchema: MathResultSchema
};

export const akraBazziTool = {
  name: 'akra_bazzi',
  description: `Apply Akra-Bazzi formula for general divide-and-conquer.
    
For T(n) = Σ aᵢT(n/bᵢ) + f(n):
1. Find p such that Σ aᵢ/bᵢᵖ = 1
2. Then T(n) = Θ(nᵖ(1 + ∫₁ⁿ f(x)/x^(p+1) dx))

Generalizes Master Theorem to different subproblem sizes.

From MIT MCS Chapter 21: Akra-Bazzi Formula`,
  
  inputSchema: z.object({
    terms: z.array(z.tuple([z.number(), z.number()]))
      .describe('Array of [aᵢ, bᵢ] pairs for each recursive term'),
    f_degree: z.number().describe('Degree d if f(n) = Θ(n^d)')
  }),
  
  outputSchema: MathResultSchema
};

export const evaluateRecurrenceTool = {
  name: 'evaluate_recurrence',
  description: `Evaluate recurrence relation at specific n using memoization.
    
Supports common patterns:
- T(n) = T(n-1) + c (linear)
- T(n) = T(n-1) + T(n-2) (Fibonacci-like)
- T(n) = 2T(n-1) + c (exponential)
- T(n) = 2T(n/2) + n (divide-and-conquer)

From MIT MCS Chapter 21: Recurrence Evaluation`,
  
  inputSchema: z.object({
    recurrence: z.string().describe('Recurrence formula (e.g., "T(n) = 2*T(n-1) + 1")'),
    base_cases: z.record(z.string(), z.number()).describe('Base cases {n: value}'),
    n: z.number().int().nonnegative().describe('Value to compute')
  }),
  
  outputSchema: MathResultSchema
};

// =============================================================================
// TOOL REGISTRY
// =============================================================================

export const mathTools = {
  // Proofs
  evaluate_proposition: evaluatePropositionTool,
  truth_table: truthTableTool,
  for_all: forAllTool,
  exists: existsTool,
  
  // Structures
  gcd: gcdTool,
  gcd_extended: gcdExtendedTool,
  mod_exp: modExpTool,
  euler_phi: eulerPhiTool,
  is_prime: isPrimeTool,
  rsa_keygen: rsaKeygenTool,
  rsa_encrypt: rsaEncryptTool,
  rsa_decrypt: rsaDecryptTool,
  
  // Counting
  binomial: binomialTool,
  permutations: permutationsTool,
  multinomial: multinomialTool,
  asymptotic_compare: asymptoticCompareTool,
  inclusion_exclusion: inclusionExclusionTool,
  
  // Probability
  bayes_update: bayesUpdateTool,
  binomial_prob: binomialProbTool,
  poisson_prob: poissonProbTool,
  expected_value: expectedValueTool,
  variance: varianceTool,
  markov_bound: markovBoundTool,
  chebyshev_bound: chebyshevBoundTool,
  chernoff_bound: chernoffBoundTool,
  
  // Recurrences
  master_theorem: masterTheoremTool,
  solve_linear_recurrence: solveLinearRecurrenceTool,
  akra_bazzi: akraBazziTool,
  evaluate_recurrence: evaluateRecurrenceTool,
};

export default mathTools;
