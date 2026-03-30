"""
CompSci Math Agent - Unified Interface
=======================================
MIT Mathematics for Computer Science Agent Tools
Supports: Proofs, Structures, Counting, Probability, Recurrences

Designed for Claude Code integration with state checkpointing
for Praescientia prediction market oracle compatibility.
"""

from __future__ import annotations
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from enum import Enum
import math
from functools import lru_cache


class MathDomain(Enum):
    """Five core domains from MIT Mathematics for Computer Science."""
    PROOFS = "proofs"
    STRUCTURES = "structures"
    COUNTING = "counting"
    PROBABILITY = "probability"
    RECURRENCES = "recurrences"


@dataclass
class MathResult:
    """Structured result from mathematical computation."""
    success: bool
    result: Any
    explanation: str = ""
    latex: str = ""
    complexity: str = ""
    references: List[str] = field(default_factory=list)
    state_hash: str = ""
    domain: MathDomain = MathDomain.PROOFS
    
    def __post_init__(self):
        if not self.state_hash:
            self.state_hash = self._compute_hash()
    
    def _compute_hash(self) -> str:
        """Compute SHA-256 hash for state verification."""
        content = json.dumps({
            "success": self.success,
            "result": str(self.result),
            "domain": self.domain.value
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "result": self.result,
            "explanation": self.explanation,
            "latex": self.latex,
            "complexity": self.complexity,
            "references": self.references,
            "state_hash": self.state_hash,
            "domain": self.domain.value
        }


# =============================================================================
# DOMAIN 1: PROOFS - Propositions, Predicates, Induction
# =============================================================================

class ProofTools:
    """Tools for logical proofs and verification."""
    
    @staticmethod
    def evaluate_proposition(expression: str, assignments: Dict[str, bool]) -> MathResult:
        """
        Evaluate a propositional logic expression.
        
        Operators: AND, OR, NOT, IMPLIES, IFF, XOR
        """
        # Normalize expression
        expr = expression.upper()
        expr = expr.replace("∧", " AND ").replace("∨", " OR ")
        expr = expr.replace("¬", " NOT ").replace("→", " IMPLIES ")
        expr = expr.replace("↔", " IFF ").replace("⊕", " XOR ")
        
        # Create evaluation context
        context = {k.upper(): v for k, v in assignments.items()}
        
        def eval_impl(a: bool, b: bool) -> bool:
            return (not a) or b
        
        def eval_iff(a: bool, b: bool) -> bool:
            return a == b
        
        def eval_xor(a: bool, b: bool) -> bool:
            return a != b
        
        # Parse and evaluate (simplified recursive descent)
        try:
            # Replace operators with Python equivalents
            py_expr = expr
            py_expr = py_expr.replace(" AND ", " and ")
            py_expr = py_expr.replace(" OR ", " or ")
            py_expr = py_expr.replace(" NOT ", " not ")
            
            # Handle IMPLIES and IFF with function calls
            # This is a simplified evaluator - production would use proper parser
            for var, val in context.items():
                py_expr = py_expr.replace(var, str(val))
            
            # For simple expressions without IMPLIES/IFF/XOR
            if "IMPLIES" not in expr and "IFF" not in expr and "XOR" not in expr:
                result = eval(py_expr)
                return MathResult(
                    success=True,
                    result=result,
                    explanation=f"Expression '{expression}' evaluates to {result}",
                    latex=f"\\text{{{expression}}} = \\text{{{result}}}",
                    domain=MathDomain.PROOFS,
                    references=["MIT MCS Ch. 1: Propositions"]
                )
            
            # For complex expressions, use manual parsing
            result = ProofTools._parse_expression(expression, assignments)
            return MathResult(
                success=True,
                result=result,
                explanation=f"Expression '{expression}' evaluates to {result}",
                latex=f"\\text{{{expression}}} = \\text{{{result}}}",
                domain=MathDomain.PROOFS,
                references=["MIT MCS Ch. 1: Propositions"]
            )
            
        except Exception as e:
            return MathResult(
                success=False,
                result=None,
                explanation=f"Evaluation error: {str(e)}",
                domain=MathDomain.PROOFS
            )
    
    @staticmethod
    def _parse_expression(expr: str, assignments: Dict[str, bool]) -> bool:
        """Recursive descent parser for propositional logic."""
        expr = expr.strip()
        context = {k.upper(): v for k, v in assignments.items()}
        
        # Check for simple variable
        if expr.upper() in context:
            return context[expr.upper()]
        
        # Check for NOT
        if expr.upper().startswith("NOT "):
            return not ProofTools._parse_expression(expr[4:], assignments)
        
        # Find main connective (lowest precedence first)
        # Precedence: IFF < IMPLIES < OR < AND < NOT
        paren_depth = 0
        for op, py_op in [("IFF", "=="), ("IMPLIES", "=>"), ("OR", "or"), 
                          ("AND", "and"), ("XOR", "!=")]:
            for i in range(len(expr)):
                if expr[i] == '(':
                    paren_depth += 1
                elif expr[i] == ')':
                    paren_depth -= 1
                elif paren_depth == 0 and expr[i:].upper().startswith(f" {op} "):
                    left = expr[:i]
                    right = expr[i + len(op) + 2:]
                    left_val = ProofTools._parse_expression(left, assignments)
                    right_val = ProofTools._parse_expression(right, assignments)
                    
                    if op == "AND":
                        return left_val and right_val
                    elif op == "OR":
                        return left_val or right_val
                    elif op == "IMPLIES":
                        return (not left_val) or right_val
                    elif op == "IFF":
                        return left_val == right_val
                    elif op == "XOR":
                        return left_val != right_val
        
        # Handle parentheses
        if expr.startswith("(") and expr.endswith(")"):
            return ProofTools._parse_expression(expr[1:-1], assignments)
        
        raise ValueError(f"Cannot parse expression: {expr}")
    
    @staticmethod
    def truth_table(variables: List[str], expression: str) -> MathResult:
        """Generate truth table for a propositional expression."""
        n = len(variables)
        rows = []
        
        for i in range(2 ** n):
            assignments = {}
            for j, var in enumerate(variables):
                assignments[var] = bool((i >> (n - 1 - j)) & 1)
            
            result = ProofTools.evaluate_proposition(expression, assignments)
            if result.success:
                row = [assignments[v] for v in variables] + [result.result]
                rows.append(row)
        
        # Format as table
        header = variables + [expression]
        table = {"header": header, "rows": rows}
        
        return MathResult(
            success=True,
            result=table,
            explanation=f"Truth table for {expression} with {n} variables",
            domain=MathDomain.PROOFS,
            references=["MIT MCS Ch. 1: Truth Tables"]
        )
    
    @staticmethod
    def for_all(predicate: Callable[[Any], bool], domain: List[Any]) -> MathResult:
        """Universal quantifier: ∀x ∈ domain. P(x)"""
        for x in domain:
            if not predicate(x):
                return MathResult(
                    success=True,
                    result=False,
                    explanation=f"Counterexample found: x = {x}",
                    latex=f"\\exists x = {x} : \\neg P(x)",
                    domain=MathDomain.PROOFS,
                    references=["MIT MCS Ch. 2: Quantifiers"]
                )
        
        return MathResult(
            success=True,
            result=True,
            explanation=f"Property holds for all {len(domain)} elements",
            latex=f"\\forall x \\in D : P(x)",
            domain=MathDomain.PROOFS,
            references=["MIT MCS Ch. 2: Quantifiers"]
        )
    
    @staticmethod
    def exists(predicate: Callable[[Any], bool], domain: List[Any]) -> MathResult:
        """Existential quantifier: ∃x ∈ domain. P(x)"""
        for x in domain:
            if predicate(x):
                return MathResult(
                    success=True,
                    result=True,
                    explanation=f"Witness found: x = {x}",
                    latex=f"\\exists x = {x} : P(x)",
                    domain=MathDomain.PROOFS,
                    references=["MIT MCS Ch. 2: Quantifiers"]
                )
        
        return MathResult(
            success=True,
            result=False,
            explanation=f"No element satisfies the predicate",
            latex=f"\\neg\\exists x \\in D : P(x)",
            domain=MathDomain.PROOFS,
            references=["MIT MCS Ch. 2: Quantifiers"]
        )


# =============================================================================
# DOMAIN 2: STRUCTURES - Number Theory, Graphs
# =============================================================================

class StructureTools:
    """Tools for number theory and graph structures."""
    
    @staticmethod
    def gcd(a: int, b: int) -> MathResult:
        """Compute GCD using Euclidean algorithm."""
        original_a, original_b = a, b
        steps = []
        
        while b != 0:
            steps.append(f"gcd({a}, {b}) = gcd({b}, {a % b})")
            a, b = b, a % b
        
        return MathResult(
            success=True,
            result=a,
            explanation="\n".join(steps),
            latex=f"\\gcd({original_a}, {original_b}) = {a}",
            complexity="O(log(min(a,b)))",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: Euclidean Algorithm"]
        )
    
    @staticmethod
    def gcd_extended(a: int, b: int) -> MathResult:
        """
        Extended Euclidean Algorithm.
        Returns (gcd, s, t) where gcd = s*a + t*b (Bézout's identity).
        """
        original_a, original_b = a, b
        
        if b == 0:
            return MathResult(
                success=True,
                result={"gcd": a, "s": 1, "t": 0},
                explanation=f"Base case: gcd({a}, 0) = {a}",
                latex=f"{a} = 1 \\cdot {a} + 0 \\cdot 0",
                domain=MathDomain.STRUCTURES,
                references=["MIT MCS Ch. 8: Bézout's Identity"]
            )
        
        # Recursive extended Euclidean
        def ext_gcd(a: int, b: int) -> Tuple[int, int, int]:
            if b == 0:
                return a, 1, 0
            g, s, t = ext_gcd(b, a % b)
            return g, t, s - (a // b) * t
        
        g, s, t = ext_gcd(a, b)
        
        return MathResult(
            success=True,
            result={"gcd": g, "s": s, "t": t},
            explanation=f"gcd({original_a}, {original_b}) = {g} = {s}×{original_a} + {t}×{original_b}",
            latex=f"\\gcd({original_a}, {original_b}) = {g} = {s} \\cdot {original_a} + {t} \\cdot {original_b}",
            complexity="O(log(min(a,b)))",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: Extended Euclidean Algorithm"]
        )
    
    @staticmethod
    def mod_exp(base: int, exp: int, mod: int) -> MathResult:
        """
        Modular exponentiation: base^exp mod mod.
        Uses fast exponentiation (square-and-multiply).
        """
        if mod == 1:
            return MathResult(success=True, result=0, domain=MathDomain.STRUCTURES)
        
        result = 1
        base = base % mod
        
        while exp > 0:
            if exp % 2 == 1:
                result = (result * base) % mod
            exp = exp >> 1
            base = (base * base) % mod
        
        return MathResult(
            success=True,
            result=result,
            explanation=f"Computed using square-and-multiply algorithm",
            latex=f"{base}^{{{exp}}} \\equiv {result} \\pmod{{{mod}}}",
            complexity="O(log(exp))",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: Modular Arithmetic"]
        )
    
    @staticmethod
    def euler_phi(n: int) -> MathResult:
        """
        Euler's totient function φ(n).
        Count of integers in [1,n] coprime to n.
        """
        if n < 1:
            return MathResult(
                success=False,
                result=None,
                explanation="n must be positive",
                domain=MathDomain.STRUCTURES
            )
        
        result = n
        p = 2
        temp_n = n
        factors = []
        
        while p * p <= temp_n:
            if temp_n % p == 0:
                factors.append(p)
                while temp_n % p == 0:
                    temp_n //= p
                result -= result // p
            p += 1
        
        if temp_n > 1:
            factors.append(temp_n)
            result -= result // temp_n
        
        return MathResult(
            success=True,
            result=result,
            explanation=f"φ({n}) = {result}, prime factors: {factors}",
            latex=f"\\phi({n}) = {result}",
            complexity="O(√n)",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: Euler's Totient Function"]
        )
    
    @staticmethod
    def is_prime(n: int) -> MathResult:
        """Primality test using trial division."""
        if n < 2:
            return MathResult(success=True, result=False, domain=MathDomain.STRUCTURES)
        if n == 2:
            return MathResult(success=True, result=True, domain=MathDomain.STRUCTURES)
        if n % 2 == 0:
            return MathResult(success=True, result=False, domain=MathDomain.STRUCTURES)
        
        for i in range(3, int(n**0.5) + 1, 2):
            if n % i == 0:
                return MathResult(
                    success=True,
                    result=False,
                    explanation=f"{n} = {i} × {n//i}",
                    domain=MathDomain.STRUCTURES
                )
        
        return MathResult(
            success=True,
            result=True,
            explanation=f"{n} is prime",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: Prime Numbers"]
        )
    
    @staticmethod
    def rsa_keygen(p: int, q: int) -> MathResult:
        """
        RSA key generation from two primes.
        
        Returns public key (n, e) and private key d.
        """
        n = p * q
        phi_n = (p - 1) * (q - 1)
        
        # Choose e coprime to φ(n), commonly 65537
        e = 65537
        if math.gcd(e, phi_n) != 1:
            # Find alternative e
            e = 3
            while math.gcd(e, phi_n) != 1:
                e += 2
        
        # Compute d = e^(-1) mod φ(n)
        def mod_inverse(a: int, m: int) -> int:
            g, x, _ = StructureTools.gcd_extended(a, m).result.values()
            if g != 1:
                raise ValueError("Modular inverse doesn't exist")
            return x % m
        
        result = StructureTools.gcd_extended(e, phi_n)
        d = result.result["s"] % phi_n
        
        return MathResult(
            success=True,
            result={
                "public_key": {"n": n, "e": e},
                "private_key": {"d": d},
                "phi_n": phi_n
            },
            explanation=f"n = {p}×{q} = {n}, φ(n) = {phi_n}, e = {e}, d = {d}",
            latex=f"n = {n}, e = {e}, d \\equiv e^{{-1}} \\pmod{{\\phi(n)}}",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: RSA Encryption"]
        )
    
    @staticmethod
    def rsa_encrypt(message: int, n: int, e: int) -> MathResult:
        """RSA encryption: c = m^e mod n"""
        result = StructureTools.mod_exp(message, e, n)
        cipher = result.result
        
        return MathResult(
            success=True,
            result=cipher,
            explanation=f"Encrypted {message} → {cipher}",
            latex=f"c = {message}^{{{e}}} \\equiv {cipher} \\pmod{{{n}}}",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: RSA Encryption"]
        )
    
    @staticmethod
    def rsa_decrypt(cipher: int, n: int, d: int) -> MathResult:
        """RSA decryption: m = c^d mod n"""
        result = StructureTools.mod_exp(cipher, d, n)
        message = result.result
        
        return MathResult(
            success=True,
            result=message,
            explanation=f"Decrypted {cipher} → {message}",
            latex=f"m = {cipher}^{{{d}}} \\equiv {message} \\pmod{{{n}}}",
            domain=MathDomain.STRUCTURES,
            references=["MIT MCS Ch. 8: RSA Decryption"]
        )


# =============================================================================
# DOMAIN 3: COUNTING - Asymptotics, Combinatorics
# =============================================================================

class CountingTools:
    """Tools for counting, asymptotics, and combinatorics."""
    
    @staticmethod
    @lru_cache(maxsize=1000)
    def factorial(n: int) -> int:
        """Compute n! with memoization."""
        if n < 0:
            raise ValueError("Factorial undefined for negative numbers")
        if n <= 1:
            return 1
        return n * CountingTools.factorial(n - 1)
    
    @staticmethod
    def binomial(n: int, k: int) -> MathResult:
        """
        Binomial coefficient C(n,k) = n! / (k!(n-k)!)
        """
        if k < 0 or k > n:
            return MathResult(
                success=True,
                result=0,
                explanation=f"C({n},{k}) = 0 (k out of range)",
                domain=MathDomain.COUNTING
            )
        
        # Use multiplicative formula for efficiency
        if k > n - k:
            k = n - k
        
        result = 1
        for i in range(k):
            result = result * (n - i) // (i + 1)
        
        return MathResult(
            success=True,
            result=result,
            explanation=f"C({n},{k}) = {n}! / ({k}! × {n-k}!) = {result}",
            latex=f"\\binom{{{n}}}{{{k}}} = {result}",
            complexity="O(min(k, n-k))",
            domain=MathDomain.COUNTING,
            references=["MIT MCS Ch. 14: Binomial Coefficients"]
        )
    
    @staticmethod
    def permutations(n: int, k: int) -> MathResult:
        """
        Permutations P(n,k) = n! / (n-k)!
        """
        if k < 0 or k > n:
            return MathResult(
                success=True,
                result=0,
                explanation=f"P({n},{k}) = 0 (k out of range)",
                domain=MathDomain.COUNTING
            )
        
        result = 1
        for i in range(k):
            result *= (n - i)
        
        return MathResult(
            success=True,
            result=result,
            explanation=f"P({n},{k}) = {n}!/({n-k})! = {result}",
            latex=f"P({n},{k}) = {result}",
            domain=MathDomain.COUNTING,
            references=["MIT MCS Ch. 14: Permutations"]
        )
    
    @staticmethod
    def multinomial(n: int, groups: List[int]) -> MathResult:
        """
        Multinomial coefficient: n! / (r₁! × r₂! × ... × rₘ!)
        """
        if sum(groups) != n:
            return MathResult(
                success=False,
                result=None,
                explanation=f"Group sizes must sum to n",
                domain=MathDomain.COUNTING
            )
        
        result = CountingTools.factorial(n)
        for r in groups:
            result //= CountingTools.factorial(r)
        
        groups_str = ", ".join(map(str, groups))
        
        return MathResult(
            success=True,
            result=result,
            explanation=f"({n}; {groups_str}) = {result}",
            latex=f"\\binom{{{n}}}{{{groups_str}}} = {result}",
            domain=MathDomain.COUNTING,
            references=["MIT MCS Ch. 14: Multinomial Theorem"]
        )
    
    @staticmethod
    def stirling_approx(n: int) -> MathResult:
        """
        Stirling's approximation: n! ≈ √(2πn)(n/e)^n
        """
        if n < 0:
            return MathResult(
                success=False,
                result=None,
                explanation="n must be non-negative",
                domain=MathDomain.COUNTING
            )
        
        import math
        approx = math.sqrt(2 * math.pi * n) * (n / math.e) ** n
        
        if n <= 20:
            exact = CountingTools.factorial(n)
            error = abs(exact - approx) / exact * 100
            explanation = f"n! = {exact}, Stirling ≈ {approx:.2f}, error = {error:.2f}%"
        else:
            explanation = f"Stirling approximation for {n}! ≈ {approx:.2e}"
        
        return MathResult(
            success=True,
            result=approx,
            explanation=explanation,
            latex=f"n! \\approx \\sqrt{{2\\pi n}}\\left(\\frac{{n}}{{e}}\\right)^n",
            domain=MathDomain.COUNTING,
            references=["MIT MCS Ch. 14: Stirling's Approximation"]
        )
    
    @staticmethod
    def asymptotic_compare(f: str, g: str) -> MathResult:
        """
        Compare asymptotic growth rates of two functions.
        Returns relationship: O, Ω, Θ, o, or ω.
        """
        # Common growth rate patterns
        growth_order = [
            ("1", 0),
            ("log(log(n))", 0.5),
            ("log(n)", 1),
            ("sqrt(n)", 1.5),
            ("n", 2),
            ("n*log(n)", 2.5),
            ("n^2", 3),
            ("n^3", 4),
            ("2^n", 5),
            ("n!", 6),
            ("n^n", 7)
        ]
        
        def get_order(expr: str) -> float:
            expr = expr.lower().replace(" ", "")
            for pattern, order in growth_order:
                if pattern in expr:
                    return order
            # Try to parse polynomial
            if "^" in expr:
                try:
                    power = float(expr.split("^")[1])
                    return 2 + power - 1  # n^k maps to appropriate position
                except:
                    pass
            return 2  # Default to linear
        
        f_order = get_order(f)
        g_order = get_order(g)
        
        if abs(f_order - g_order) < 0.01:
            relation = "Θ"
            explanation = f"{f} = Θ({g}) - same growth rate"
        elif f_order < g_order:
            relation = "o"
            explanation = f"{f} = o({g}) - f grows slower than g"
        else:
            relation = "ω"
            explanation = f"{f} = ω({g}) - f grows faster than g"
        
        return MathResult(
            success=True,
            result=relation,
            explanation=explanation,
            latex=f"f(n) = {relation}(g(n))",
            domain=MathDomain.COUNTING,
            references=["MIT MCS Ch. 13: Asymptotic Notation"]
        )
    
    @staticmethod
    def inclusion_exclusion(sets: List[int], intersections: Dict[str, int]) -> MathResult:
        """
        Inclusion-Exclusion principle for union of sets.
        
        Args:
            sets: List of |A₁|, |A₂|, ..., |Aₙ|
            intersections: Dict mapping "i,j" to |Aᵢ ∩ Aⱼ|, "i,j,k" to |Aᵢ ∩ Aⱼ ∩ Aₖ|, etc.
        """
        n = len(sets)
        result = sum(sets)  # Add individual sets
        
        # Subtract pairwise intersections
        sign = -1
        for key, value in sorted(intersections.items(), key=lambda x: len(x[0])):
            indices = key.split(",")
            if len(indices) % 2 == 0:
                result -= value
            else:
                result += value
        
        return MathResult(
            success=True,
            result=result,
            explanation=f"|A₁ ∪ A₂ ∪ ... ∪ Aₙ| = {result}",
            latex=f"|\\bigcup_{{i=1}}^{{{n}}} A_i| = {result}",
            domain=MathDomain.COUNTING,
            references=["MIT MCS Ch. 14: Inclusion-Exclusion"]
        )


# =============================================================================
# DOMAIN 4: PROBABILITY - Distributions, Bayes, Random Variables
# =============================================================================

class ProbabilityTools:
    """Tools for probability computations."""
    
    @staticmethod
    def bayes_update(prior: float, likelihood: float, 
                     false_positive: float) -> MathResult:
        """
        Apply Bayes' theorem.
        
        P(A|B) = P(B|A) × P(A) / P(B)
        
        Args:
            prior: P(A) - prior probability
            likelihood: P(B|A) - probability of evidence given hypothesis
            false_positive: P(B|¬A) - probability of evidence given NOT hypothesis
        """
        # P(B) = P(B|A)P(A) + P(B|¬A)P(¬A)
        p_evidence = likelihood * prior + false_positive * (1 - prior)
        
        # P(A|B) = P(B|A)P(A) / P(B)
        posterior = (likelihood * prior) / p_evidence
        
        return MathResult(
            success=True,
            result=posterior,
            explanation=f"Prior: {prior:.4f} → Posterior: {posterior:.4f} (update factor: {posterior/prior:.2f}×)",
            latex=f"P(A|B) = \\frac{{P(B|A) \\cdot P(A)}}{{P(B)}} = {posterior:.4f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 17: Bayes' Theorem"]
        )
    
    @staticmethod
    def binomial_prob(n: int, k: int, p: float) -> MathResult:
        """
        Binomial distribution probability P(X = k).
        X ~ Binomial(n, p)
        """
        coeff = CountingTools.binomial(n, k).result
        prob = coeff * (p ** k) * ((1 - p) ** (n - k))
        
        expected = n * p
        variance = n * p * (1 - p)
        
        return MathResult(
            success=True,
            result=prob,
            explanation=f"P(X={k}) = {prob:.6f}, E[X] = {expected}, Var(X) = {variance:.4f}",
            latex=f"P(X={k}) = \\binom{{{n}}}{{{k}}} p^{{{k}}} (1-p)^{{{n-k}}} = {prob:.6f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 18: Binomial Distribution"]
        )
    
    @staticmethod
    def poisson_prob(k: int, lambda_: float) -> MathResult:
        """
        Poisson distribution probability P(X = k).
        X ~ Poisson(λ)
        """
        prob = (lambda_ ** k) * math.exp(-lambda_) / CountingTools.factorial(k)
        
        return MathResult(
            success=True,
            result=prob,
            explanation=f"P(X={k}) = {prob:.6f}, E[X] = Var(X) = {lambda_}",
            latex=f"P(X={k}) = \\frac{{\\lambda^{{{k}}} e^{{-\\lambda}}}}{{{k}!}} = {prob:.6f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 18: Poisson Distribution"]
        )
    
    @staticmethod
    def geometric_prob(k: int, p: float) -> MathResult:
        """
        Geometric distribution probability P(X = k).
        X = number of trials until first success.
        """
        prob = ((1 - p) ** (k - 1)) * p
        expected = 1 / p
        variance = (1 - p) / (p ** 2)
        
        return MathResult(
            success=True,
            result=prob,
            explanation=f"P(X={k}) = {prob:.6f}, E[X] = {expected:.4f}, Var(X) = {variance:.4f}",
            latex=f"P(X={k}) = (1-p)^{{{k-1}}} p = {prob:.6f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 18: Geometric Distribution"]
        )
    
    @staticmethod
    def expected_value(distribution: List[Tuple[float, float]]) -> MathResult:
        """
        Compute expected value E[X] for discrete distribution.
        
        Args:
            distribution: List of (value, probability) tuples
        """
        expected = sum(x * p for x, p in distribution)
        
        # Verify probabilities sum to 1
        total_prob = sum(p for _, p in distribution)
        if abs(total_prob - 1.0) > 0.001:
            return MathResult(
                success=False,
                result=None,
                explanation=f"Probabilities sum to {total_prob}, not 1",
                domain=MathDomain.PROBABILITY
            )
        
        return MathResult(
            success=True,
            result=expected,
            explanation=f"E[X] = Σ x·P(X=x) = {expected:.6f}",
            latex=f"E[X] = {expected:.4f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 19: Expectation"]
        )
    
    @staticmethod
    def variance(distribution: List[Tuple[float, float]]) -> MathResult:
        """
        Compute variance Var(X) = E[X²] - E[X]².
        """
        expected = sum(x * p for x, p in distribution)
        expected_sq = sum((x ** 2) * p for x, p in distribution)
        var = expected_sq - expected ** 2
        
        return MathResult(
            success=True,
            result=var,
            explanation=f"Var(X) = E[X²] - E[X]² = {expected_sq:.4f} - {expected:.4f}² = {var:.6f}",
            latex=f"\\text{{Var}}(X) = {var:.4f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 19: Variance"]
        )
    
    @staticmethod
    def markov_bound(expected: float, threshold: float) -> MathResult:
        """
        Markov's inequality: P(X ≥ c) ≤ E[X]/c for X ≥ 0.
        """
        if threshold <= 0:
            return MathResult(
                success=False,
                result=None,
                explanation="Threshold must be positive",
                domain=MathDomain.PROBABILITY
            )
        
        bound = expected / threshold
        
        return MathResult(
            success=True,
            result=min(bound, 1.0),
            explanation=f"P(X ≥ {threshold}) ≤ {expected}/{threshold} = {bound:.4f}",
            latex=f"P(X \\geq {threshold}) \\leq \\frac{{E[X]}}{{{threshold}}} = {bound:.4f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 19: Markov's Inequality"]
        )
    
    @staticmethod
    def chebyshev_bound(mean: float, variance: float, 
                        threshold: float) -> MathResult:
        """
        Chebyshev's inequality: P(|X - μ| ≥ kσ) ≤ 1/k².
        """
        std_dev = math.sqrt(variance)
        k = threshold / std_dev
        bound = 1 / (k ** 2) if k > 0 else 1.0
        
        return MathResult(
            success=True,
            result=min(bound, 1.0),
            explanation=f"P(|X - {mean}| ≥ {threshold}) ≤ 1/{k:.2f}² = {bound:.4f}",
            latex=f"P(|X - \\mu| \\geq {threshold}) \\leq \\frac{{1}}{{k^2}} = {bound:.4f}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 19: Chebyshev's Inequality"]
        )
    
    @staticmethod
    def chernoff_bound(n: int, p: float, delta: float) -> MathResult:
        """
        Chernoff bound for sum of independent Bernoulli trials.
        
        P(S ≥ (1+δ)μ) ≤ e^(-δ²μ/3)
        P(S ≤ (1-δ)μ) ≤ e^(-δ²μ/2)
        """
        mu = n * p
        upper_bound = math.exp(-delta**2 * mu / 3)
        lower_bound = math.exp(-delta**2 * mu / 2)
        
        return MathResult(
            success=True,
            result={"upper_tail": upper_bound, "lower_tail": lower_bound},
            explanation=f"μ = {mu}, δ = {delta}\n"
                       f"P(S ≥ {(1+delta)*mu:.2f}) ≤ {upper_bound:.6f}\n"
                       f"P(S ≤ {(1-delta)*mu:.2f}) ≤ {lower_bound:.6f}",
            latex=f"P(S \\geq (1+\\delta)\\mu) \\leq e^{{-\\delta^2\\mu/3}}",
            domain=MathDomain.PROBABILITY,
            references=["MIT MCS Ch. 19: Chernoff Bounds"]
        )


# =============================================================================
# DOMAIN 5: RECURRENCES - Divide-and-Conquer Analysis
# =============================================================================

class RecurrenceTools:
    """Tools for solving and analyzing recurrence relations."""
    
    @staticmethod
    def master_theorem(a: int, b: int, f_complexity: str) -> MathResult:
        """
        Apply Master Theorem for T(n) = aT(n/b) + f(n).
        
        Let c = log_b(a). Then:
        - Case 1: f(n) = O(n^(c-ε)) → T(n) = Θ(n^c)
        - Case 2: f(n) = Θ(n^c) → T(n) = Θ(n^c log n)
        - Case 3: f(n) = Ω(n^(c+ε)) → T(n) = Θ(f(n))
        """
        c = math.log(a) / math.log(b)
        
        # Parse f_complexity to determine case
        f_complexity = f_complexity.lower().replace(" ", "")
        
        # Extract polynomial degree from f
        f_degree = 0
        if "n^" in f_complexity:
            try:
                f_degree = float(f_complexity.split("^")[1].split(")")[0])
            except:
                f_degree = 1
        elif "n*log" in f_complexity or "nlog" in f_complexity:
            f_degree = 1  # n log n case
        elif "n" in f_complexity:
            f_degree = 1
        elif f_complexity in ["1", "o(1)", "θ(1)"]:
            f_degree = 0
        
        epsilon = 0.01  # Tolerance for comparison
        
        if f_degree < c - epsilon:
            case = 1
            result = f"Θ(n^{c:.2f})"
            explanation = f"Case 1: f(n) = O(n^{f_degree}) is polynomially smaller than n^{c:.2f}"
        elif abs(f_degree - c) <= epsilon:
            case = 2
            result = f"Θ(n^{c:.2f} log n)"
            explanation = f"Case 2: f(n) = Θ(n^{c:.2f}), same as n^(log_b(a))"
        else:
            case = 3
            result = f"Θ({f_complexity})"
            explanation = f"Case 3: f(n) = Ω(n^{f_degree}) is polynomially larger than n^{c:.2f}"
        
        return MathResult(
            success=True,
            result={"case": case, "complexity": result, "c": c},
            explanation=f"T(n) = {a}T(n/{b}) + {f_complexity}\n"
                       f"c = log_{b}({a}) = {c:.4f}\n"
                       f"{explanation}\n"
                       f"Solution: T(n) = {result}",
            latex=f"T(n) = {result}",
            complexity=result,
            domain=MathDomain.RECURRENCES,
            references=["MIT MCS Ch. 21: Master Theorem"]
        )
    
    @staticmethod
    def solve_linear_recurrence(coefficients: List[float], 
                                initial_values: List[float]) -> MathResult:
        """
        Solve homogeneous linear recurrence using characteristic equation.

        T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k)

        Args:
            coefficients: [c₁, c₂, ..., cₖ]
            initial_values: [T(0), T(1), ..., T(k-1)]
        """
        k = len(coefficients)

        # Handle order-1 recurrence: T(n) = c₁T(n-1)
        if k == 1:
            r = coefficients[0]
            return MathResult(
                success=True,
                result={"roots": [r], "closed_form": f"T(n) = T(0) × {r}ⁿ"},
                explanation=f"Order-1 recurrence with root r = {r}\nClosed form: T(n) = {initial_values[0]} × {r}ⁿ",
                latex=f"T(n) = {initial_values[0]} \\cdot {r}^n",
                domain=MathDomain.RECURRENCES,
                references=["MIT MCS Ch. 21: Linear Recurrences"]
            )

        # Handle order-2 recurrence: T(n) = c₁T(n-1) + c₂T(n-2)
        if k == 2:
            c1, c2 = coefficients
            # Characteristic equation: x² - c₁x - c₂ = 0
            discriminant = c1 * c1 + 4 * c2

            if discriminant > 0:
                sqrt_d = math.sqrt(discriminant)
                r1 = (c1 + sqrt_d) / 2
                r2 = (c1 - sqrt_d) / 2
                roots = [r1, r2]

                # Special case: Fibonacci
                if coefficients == [1, 1]:
                    phi = (1 + math.sqrt(5)) / 2
                    psi = (1 - math.sqrt(5)) / 2
                    closed_form = f"(φⁿ - ψⁿ)/√5 where φ = {phi:.4f}, ψ = {psi:.4f}"
                else:
                    closed_form = f"T(n) = A×{r1:.4f}ⁿ + B×{r2:.4f}ⁿ"
            elif discriminant == 0:
                r = c1 / 2
                roots = [r, r]
                closed_form = f"T(n) = (A + Bn)×{r:.4f}ⁿ (repeated root)"
            else:
                # Complex roots
                real_part = c1 / 2
                imag_part = math.sqrt(-discriminant) / 2
                roots = [complex(real_part, imag_part), complex(real_part, -imag_part)]
                magnitude = math.sqrt(real_part**2 + imag_part**2)
                closed_form = f"T(n) = {magnitude:.4f}ⁿ × (A cos(nθ) + B sin(nθ))"

            return MathResult(
                success=True,
                result={"roots": roots, "closed_form": closed_form},
                explanation=f"Characteristic equation: x² - {c1}x - {c2} = 0\n"
                           f"Discriminant: {discriminant}\n"
                           f"Roots: {roots}\n"
                           f"Closed form: {closed_form}",
                latex=closed_form,
                domain=MathDomain.RECURRENCES,
                references=["MIT MCS Ch. 21: Linear Recurrences"]
            )

        # For order > 2, provide iterative evaluation (no numpy dependency)
        # Computing closed form for higher orders requires polynomial root finding
        return MathResult(
            success=True,
            result={
                "order": k,
                "coefficients": coefficients,
                "initial_values": initial_values,
                "closed_form": None,
                "note": "Use evaluate_recurrence() for specific values"
            },
            explanation=f"Order-{k} recurrence: T(n) = {' + '.join(f'{c}T(n-{i+1})' for i, c in enumerate(coefficients))}\n"
                       f"Initial values: {initial_values}\n"
                       f"Closed-form solution requires polynomial root finding.\n"
                       f"Use evaluate_recurrence() to compute specific values iteratively.",
            domain=MathDomain.RECURRENCES,
            references=["MIT MCS Ch. 21: Linear Recurrences"]
        )
    
    @staticmethod
    def akra_bazzi(terms: List[Tuple[float, float]], f_degree: float) -> MathResult:
        """
        Apply Akra-Bazzi formula for T(n) = Σ aᵢT(n/bᵢ) + f(n).
        
        Find p such that Σ aᵢ/bᵢᵖ = 1.
        Then T(n) = Θ(nᵖ(1 + ∫₁ⁿ f(x)/x^(p+1) dx))
        
        Args:
            terms: List of (aᵢ, bᵢ) tuples
            f_degree: Degree d if f(n) = Θ(n^d)
        """
        # Binary search for p
        def sum_equation(p: float) -> float:
            return sum(a / (b ** p) for a, b in terms)
        
        # Find p using binary search
        low, high = -10.0, 10.0
        for _ in range(100):
            mid = (low + high) / 2
            s = sum_equation(mid)
            if abs(s - 1.0) < 1e-10:
                break
            if s > 1:
                low = mid
            else:
                high = mid
        
        p = mid
        
        # Determine complexity
        if f_degree < p:
            complexity = f"Θ(n^{p:.4f})"
        elif abs(f_degree - p) < 0.01:
            complexity = f"Θ(n^{p:.4f} log n)"
        else:
            complexity = f"Θ(n^{f_degree})"
        
        terms_str = " + ".join(f"{a}T(n/{b})" for a, b in terms)
        
        return MathResult(
            success=True,
            result={"p": p, "complexity": complexity},
            explanation=f"T(n) = {terms_str} + Θ(n^{f_degree})\n"
                       f"Found p ≈ {p:.4f} such that Σ aᵢ/bᵢᵖ = 1\n"
                       f"Solution: T(n) = {complexity}",
            latex=f"T(n) = {complexity}",
            complexity=complexity,
            domain=MathDomain.RECURRENCES,
            references=["MIT MCS Ch. 21: Akra-Bazzi Formula"]
        )
    
    @staticmethod
    def evaluate_recurrence(recurrence: str, base_cases: Dict[int, int], 
                           n: int) -> MathResult:
        """
        Evaluate recurrence relation at specific n using memoization.
        """
        memo = dict(base_cases)
        
        # Very simple parser for common recurrence patterns
        # Handles: T(n) = aT(n-k) + f(n) or T(n) = aT(n/b) + f(n)
        
        def T(val: int) -> int:
            if val in memo:
                return memo[val]
            if val <= 0:
                return base_cases.get(0, 0)
            
            # Parse recurrence (simplified)
            rec = recurrence.lower().replace(" ", "")
            
            if "t(n-1)" in rec and "t(n-2)" in rec:
                # Fibonacci-like
                result = T(val - 1) + T(val - 2)
            elif "2*t(n-1)" in rec:
                # Exponential
                result = 2 * T(val - 1) + (1 if "+1" in rec else 0)
            elif "t(n-1)" in rec:
                # Linear
                result = T(val - 1) + (val if "+n" in rec else 1)
            elif "t(n/2)" in rec:
                # Divide by 2
                result = T(val // 2) + (val if "+n" in rec else 1)
            elif "2*t(n/2)" in rec:
                # Merge sort pattern
                result = 2 * T(val // 2) + val
            else:
                result = T(val - 1) + 1  # Default linear
            
            memo[val] = result
            return result
        
        result = T(n)
        
        return MathResult(
            success=True,
            result=result,
            explanation=f"T({n}) = {result} (computed with memoization)",
            domain=MathDomain.RECURRENCES,
            references=["MIT MCS Ch. 21: Recurrence Evaluation"]
        )


# =============================================================================
# UNIFIED AGENT INTERFACE
# =============================================================================

class CompSciMathAgent:
    """
    Unified agent interface for all CompSci Math tools.
    
    Provides automatic domain routing and state checkpointing
    for Praescientia prediction market integration.
    """
    
    def __init__(self, checkpointing: bool = False):
        self.checkpointing = checkpointing
        self.state_history: List[MathResult] = []
        
        # Tool registry
        self.tools = {
            # Proofs
            "evaluate_proposition": ProofTools.evaluate_proposition,
            "truth_table": ProofTools.truth_table,
            "for_all": ProofTools.for_all,
            "exists": ProofTools.exists,
            
            # Structures
            "gcd": StructureTools.gcd,
            "gcd_extended": StructureTools.gcd_extended,
            "mod_exp": StructureTools.mod_exp,
            "euler_phi": StructureTools.euler_phi,
            "is_prime": StructureTools.is_prime,
            "rsa_keygen": StructureTools.rsa_keygen,
            "rsa_encrypt": StructureTools.rsa_encrypt,
            "rsa_decrypt": StructureTools.rsa_decrypt,
            
            # Counting
            "binomial": CountingTools.binomial,
            "permutations": CountingTools.permutations,
            "multinomial": CountingTools.multinomial,
            "stirling_approx": CountingTools.stirling_approx,
            "asymptotic_compare": CountingTools.asymptotic_compare,
            "inclusion_exclusion": CountingTools.inclusion_exclusion,
            
            # Probability
            "bayes_update": ProbabilityTools.bayes_update,
            "binomial_prob": ProbabilityTools.binomial_prob,
            "poisson_prob": ProbabilityTools.poisson_prob,
            "geometric_prob": ProbabilityTools.geometric_prob,
            "expected_value": ProbabilityTools.expected_value,
            "variance": ProbabilityTools.variance,
            "markov_bound": ProbabilityTools.markov_bound,
            "chebyshev_bound": ProbabilityTools.chebyshev_bound,
            "chernoff_bound": ProbabilityTools.chernoff_bound,
            
            # Recurrences
            "master_theorem": RecurrenceTools.master_theorem,
            "solve_linear_recurrence": RecurrenceTools.solve_linear_recurrence,
            "akra_bazzi": RecurrenceTools.akra_bazzi,
            "evaluate_recurrence": RecurrenceTools.evaluate_recurrence,
        }
    
    def invoke(self, tool_name: str, **kwargs) -> MathResult:
        """Invoke a mathematical tool by name."""
        if tool_name not in self.tools:
            return MathResult(
                success=False,
                result=None,
                explanation=f"Unknown tool: {tool_name}. Available: {list(self.tools.keys())}"
            )
        
        result = self.tools[tool_name](**kwargs)
        
        if self.checkpointing:
            self.state_history.append(result)
        
        return result
    
    def query(self, natural_language: str) -> MathResult:
        """
        Process natural language mathematical query.
        Routes to appropriate tool based on content analysis.
        """
        query = natural_language.lower()
        
        # Route based on keywords
        if any(kw in query for kw in ["complexity", "t(n)", "recurrence", "master", "divide"]):
            # Recurrence domain
            if "master" in query:
                # Parse T(n) = aT(n/b) + f(n) pattern
                return self._parse_master_theorem(natural_language)
            
        elif any(kw in query for kw in ["probability", "bayes", "expected", "variance", "distribution"]):
            # Probability domain
            if "bayes" in query:
                return self._parse_bayes(natural_language)
        
        elif any(kw in query for kw in ["binomial", "c(", "choose", "combination", "permutation"]):
            # Counting domain
            return self._parse_combinatorics(natural_language)
        
        elif any(kw in query for kw in ["gcd", "prime", "modular", "rsa", "euler"]):
            # Structures domain
            return self._parse_number_theory(natural_language)
        
        elif any(kw in query for kw in ["proposition", "implies", "for all", "exists", "proof"]):
            # Proofs domain
            return self._parse_logic(natural_language)
        
        return MathResult(
            success=False,
            result=None,
            explanation=f"Could not parse query: {natural_language}. Try being more specific."
        )
    
    def _parse_master_theorem(self, query: str) -> MathResult:
        """Extract Master Theorem parameters from query."""
        import re
        
        # Try to match T(n) = aT(n/b) + f(n) pattern
        pattern = r"t\(n\)\s*=\s*(\d+)\s*t\(n/(\d+)\)\s*\+\s*(.+)"
        match = re.search(pattern, query.lower())
        
        if match:
            a = int(match.group(1))
            b = int(match.group(2))
            f = match.group(3).strip()
            return self.invoke("master_theorem", a=a, b=b, f_complexity=f)
        
        return MathResult(
            success=False,
            result=None,
            explanation="Could not parse Master Theorem parameters. Format: T(n) = aT(n/b) + f(n)"
        )
    
    def _parse_combinatorics(self, query: str) -> MathResult:
        """Extract combinatorics parameters from query."""
        import re
        
        # Match C(n,k) or "n choose k"
        pattern = r"c\((\d+),\s*(\d+)\)|(\d+)\s*choose\s*(\d+)"
        match = re.search(pattern, query.lower())
        
        if match:
            if match.group(1):
                n, k = int(match.group(1)), int(match.group(2))
            else:
                n, k = int(match.group(3)), int(match.group(4))
            return self.invoke("binomial", n=n, k=k)
        
        return MathResult(
            success=False,
            result=None,
            explanation="Could not parse combinatorics query. Format: C(n,k) or 'n choose k'"
        )
    
    def _parse_bayes(self, query: str) -> MathResult:
        """Extract Bayes parameters from query."""
        import re
        
        # Match prior and likelihood values
        prior_match = re.search(r"prior\s*[=:]?\s*([\d.]+)", query.lower())
        likelihood_match = re.search(r"likelihood\s*[=:]?\s*([\d.]+)", query.lower())
        
        if prior_match and likelihood_match:
            prior = float(prior_match.group(1))
            likelihood = float(likelihood_match.group(1))
            false_positive = 0.05  # Default
            
            fp_match = re.search(r"false.?positive\s*[=:]?\s*([\d.]+)", query.lower())
            if fp_match:
                false_positive = float(fp_match.group(1))
            
            return self.invoke("bayes_update", 
                             prior=prior, 
                             likelihood=likelihood,
                             false_positive=false_positive)
        
        return MathResult(
            success=False,
            result=None,
            explanation="Could not parse Bayes parameters. Specify prior and likelihood."
        )
    
    def _parse_number_theory(self, query: str) -> MathResult:
        """Extract number theory parameters from query."""
        import re
        
        # Match GCD query
        gcd_match = re.search(r"gcd\((\d+),\s*(\d+)\)", query.lower())
        if gcd_match:
            a, b = int(gcd_match.group(1)), int(gcd_match.group(2))
            return self.invoke("gcd_extended", a=a, b=b)
        
        return MathResult(
            success=False,
            result=None,
            explanation="Could not parse number theory query."
        )
    
    def _parse_logic(self, query: str) -> MathResult:
        """Extract logic/proof parameters from query."""
        return MathResult(
            success=False,
            result=None,
            explanation="Logic query parsing requires explicit proposition format."
        )
    
    def rollback(self, checkpoint_hash: str) -> bool:
        """
        Rollback state to a previous checkpoint.
        
        For Praescientia integration - allows state restoration
        when prediction errors are detected.
        """
        for i, result in enumerate(self.state_history):
            if result.state_hash == checkpoint_hash:
                self.state_history = self.state_history[:i+1]
                return True
        return False
    
    def get_state_hash(self) -> str:
        """Get current state hash for checkpointing."""
        if not self.state_history:
            return hashlib.sha256(b"initial").hexdigest()[:16]
        return self.state_history[-1].state_hash


# =============================================================================
# MAIN - Demonstration
# =============================================================================

if __name__ == "__main__":
    agent = CompSciMathAgent(checkpointing=True)
    
    print("=" * 60)
    print("CompSci Math Agent - MIT Mathematics for Computer Science")
    print("=" * 60)
    
    # Domain 1: Proofs
    print("\n--- PROOFS ---")
    result = agent.invoke("evaluate_proposition",
                         expression="(P AND Q) IMPLIES (P OR R)",
                         assignments={"P": True, "Q": False, "R": True})
    print(f"Proposition: {result.explanation}")
    
    # Domain 2: Structures
    print("\n--- STRUCTURES ---")
    result = agent.invoke("gcd_extended", a=102, b=70)
    print(f"Extended GCD: {result.explanation}")
    
    result = agent.invoke("euler_phi", n=60)
    print(f"Euler's Totient: {result.explanation}")
    
    # Domain 3: Counting
    print("\n--- COUNTING ---")
    result = agent.invoke("binomial", n=52, k=5)
    print(f"Binomial: {result.explanation}")
    
    result = agent.invoke("asymptotic_compare", f="n^2", g="n*log(n)")
    print(f"Asymptotic: {result.explanation}")
    
    # Domain 4: Probability
    print("\n--- PROBABILITY ---")
    result = agent.invoke("bayes_update", prior=0.01, likelihood=0.95, false_positive=0.05)
    print(f"Bayes: {result.explanation}")
    
    result = agent.invoke("chernoff_bound", n=100, p=0.5, delta=0.1)
    print(f"Chernoff: {result.explanation}")
    
    # Domain 5: Recurrences
    print("\n--- RECURRENCES ---")
    result = agent.invoke("master_theorem", a=2, b=2, f_complexity="n")
    print(f"Master Theorem: {result.explanation}")
    
    result = agent.invoke("akra_bazzi", terms=[(1, 2), (1, 3)], f_degree=1)
    print(f"Akra-Bazzi: {result.explanation}")
    
    # Natural language query
    print("\n--- NATURAL LANGUAGE ---")
    result = agent.query("What is C(52, 5)?")
    print(f"Query result: {result.explanation}")
    
    print("\n" + "=" * 60)
    print(f"State hash: {agent.get_state_hash()}")
    print(f"Checkpoints: {len(agent.state_history)}")
