-- ============================================================================
-- PROOFS.CY - CompSci Math Tools: Logic and Proofs
-- ============================================================================
-- MIT Mathematics for Computer Science | Chapters 0-7
-- Tool implementations for propositions, predicates, and proof verification
-- ============================================================================

use math

-- ============================================================================
-- Propositions
-- ============================================================================

type Proposition:
    value bool
    name  str

fn Proposition :: @init(v bool, n str) -> Self:
    return Proposition{value=v, name=n}

fn (&Proposition) eval() -> bool:
    return self.value

fn (&Proposition) to_str() -> str:
    return '%{self.name}: %{self.value}'

fn prop_not(p Proposition) -> Proposition:
    return Proposition{value=not p.value, name='¬(%{p.name})'}

fn prop_and(p, q Proposition) -> Proposition:
    return Proposition{value=p.value and q.value, name='(%{p.name} ∧ %{q.name})'}

fn prop_or(p, q Proposition) -> Proposition:
    return Proposition{value=p.value or q.value, name='(%{p.name} ∨ %{q.name})'}

fn prop_xor(p, q Proposition) -> Proposition:
    val := (p.value and not q.value) or (not p.value and q.value)
    return Proposition{value=val, name='(%{p.name} ⊕ %{q.name})'}

fn prop_implies(p, q Proposition) -> Proposition:
    val := not p.value or q.value
    return Proposition{value=val, name='(%{p.name} → %{q.name})'}

fn prop_iff(p, q Proposition) -> Proposition:
    val := p.value == q.value
    return Proposition{value=val, name='(%{p.name} ↔ %{q.name})'}

-- ============================================================================
-- Quantifiers
-- ============================================================================

type Predicate[T Any]:
    test fn(T) -> bool
    name str

fn Predicate[T] :: @init(t fn(T) -> bool, n str) -> Self:
    return Predicate[T]{test=t, name=n}

fn (&Predicate[T]) evaluate(x T) -> bool:
    return self.test(x)

fn for_all[T Any](pred Predicate[T], domain []T) -> bool:
    for domain |x|:
        if not pred.test(x):
            return false
    return true

fn exists[T Any](pred Predicate[T], domain []T) -> bool:
    for domain |x|:
        if pred.test(x):
            return true
    return false

fn exists_unique[T Any](pred Predicate[T], domain []T) -> bool:
    count := 0
    for domain |x|:
        if pred.test(x):
            count += 1
            if count > 1:
                return false
    return count == 1

-- ============================================================================
-- Logical Laws
-- ============================================================================

fn de_morgan_and(p, q Proposition) -> bool:
    lhs := prop_not(prop_and(p, q))
    rhs := prop_or(prop_not(p), prop_not(q))
    return lhs.value == rhs.value

fn de_morgan_or(p, q Proposition) -> bool:
    lhs := prop_not(prop_or(p, q))
    rhs := prop_and(prop_not(p), prop_not(q))
    return lhs.value == rhs.value

fn contrapositive(p, q Proposition) -> bool:
    lhs := prop_implies(p, q)
    rhs := prop_implies(prop_not(q), prop_not(p))
    return lhs.value == rhs.value

fn double_negation(p Proposition) -> bool:
    return prop_not(prop_not(p)).value == p.value

-- ============================================================================
-- Truth Table Generation
-- ============================================================================

type TruthTableRow:
    inputs []bool
    output bool

fn generate_truth_table(num_vars int, eval_fn fn([]bool) -> bool) -> []TruthTableRow:
    num_rows := 1 << num_vars
    rows := []TruthTableRow{}

    for 0..num_rows |i|:
        inputs := []bool{}
        for 0..num_vars |j|:
            bit := (i >> (num_vars - 1 - j)) & 1
            inputs += bit == 1

        rows += TruthTableRow{inputs=inputs, output=eval_fn(inputs)}

    return rows

-- ============================================================================
-- Well Ordering Principle
-- ============================================================================

fn well_ordering_min(set []int) -> ?int:
    if set.len() == 0:
        return none
    min_val := set[0]
    for set |x|:
        if x < min_val:
            min_val = x
    return min_val

fn find_counterexample(prop fn(int) -> bool, bound int) -> ?int:
    counterexamples := []int{}
    for 0..bound |n|:
        if not prop(n):
            counterexamples += n
    return well_ordering_min(counterexamples)

-- ============================================================================
-- Induction Framework
-- ============================================================================

type InductionProof:
    base_case   int
    property    fn(int) -> bool
    base_holds  bool
    step_holds  bool

fn InductionProof :: @init(base int, prop fn(int) -> bool) -> Self:
    return InductionProof{
        base_case=base,
        property=prop,
        base_holds=false,
        step_holds=false
    }

fn (&InductionProof) verify_base() -> bool:
    self.base_holds = self.property(self.base_case)
    return self.base_holds

fn (&InductionProof) verify_step_up_to(n int) -> bool:
    for self.base_case..n |k|:
        if self.property(k) and not self.property(k + 1):
            self.step_holds = false
            return false
    self.step_holds = true
    return true

fn (&InductionProof) is_valid() -> bool:
    return self.base_holds and self.step_holds

-- ============================================================================
-- Sets
-- ============================================================================

type Set[T Any]:
    elements []T

fn Set[T] :: @init() -> Self:
    return Set[T]{elements=[]T{}}

fn Set[T] :: from_slice(elems []T) -> Self:
    return Set[T]{elements=elems}

fn (&Set[T]) add(x T):
    if not self.contains(x):
        self.elements += x

fn (&Set[T]) contains(x T) -> bool:
    for self.elements |e|:
        if e == x:
            return true
    return false

fn (&Set[T]) size() -> int:
    return self.elements.len()

fn set_union[T Any](a, b Set[T]) -> Set[T]:
    result := Set[T]::@init()
    for a.elements |e|:
        result.add(e)
    for b.elements |e|:
        result.add(e)
    return result

fn set_intersection[T Any](a, b Set[T]) -> Set[T]:
    result := Set[T]::@init()
    for a.elements |e|:
        if b.contains(e):
            result.add(e)
    return result

fn is_subset[T Any](a, b Set[T]) -> bool:
    for a.elements |e|:
        if not b.contains(e):
            return false
    return true

-- ============================================================================
-- Relations
-- ============================================================================

type Relation[T Any]:
    pairs []^(T, T)

fn Relation[T] :: @init() -> Self:
    return Relation[T]{pairs=[]^(T, T){}}

fn (&Relation[T]) add_pair(a, b T):
    self.pairs += ^(a, b)

fn (&Relation[T]) has_pair(a, b T) -> bool:
    for self.pairs |p|:
        if p.*.0 == a and p.*.1 == b:
            return true
    return false

fn is_reflexive[T Any](r Relation[T], domain []T) -> bool:
    for domain |x|:
        if not r.has_pair(x, x):
            return false
    return true

fn is_symmetric[T Any](r Relation[T]) -> bool:
    for r.pairs |p|:
        if not r.has_pair(p.*.1, p.*.0):
            return false
    return true

fn is_transitive[T Any](r Relation[T]) -> bool:
    for r.pairs |p1|:
        for r.pairs |p2|:
            if p1.*.1 == p2.*.0:
                if not r.has_pair(p1.*.0, p2.*.1):
                    return false
    return true

fn is_equivalence[T Any](r Relation[T], domain []T) -> bool:
    return is_reflexive(r, domain) and is_symmetric(r) and is_transitive(r)

-- ============================================================================
-- SAT Solver
-- ============================================================================

type Literal:
    variable int
    negated  bool

type Clause:
    literals []Literal

type CNFFormula:
    clauses  []Clause
    num_vars int

fn CNFFormula :: @init(n int) -> Self:
    return CNFFormula{clauses=[]Clause{}, num_vars=n}

fn (&CNFFormula) add_clause(lits []Literal):
    self.clauses += Clause{literals=lits}

fn (&Clause) evaluate(assignment []bool) -> bool:
    for self.literals |lit|:
        val := assignment[lit.variable]
        if lit.negated:
            val = not val
        if val:
            return true
    return false

fn (&CNFFormula) evaluate(assignment []bool) -> bool:
    for self.clauses |clause|:
        if not clause.evaluate(assignment):
            return false
    return true

fn (&CNFFormula) solve() -> ?[]bool:
    total := 1 << self.num_vars
    for 0..total |i|:
        assignment := []bool{}
        for 0..self.num_vars |j|:
            assignment += ((i >> j) & 1) == 1
        if self.evaluate(assignment):
            return assignment
    return none

-- ============================================================================
-- Matched Brackets
-- ============================================================================

fn is_matched(s str) -> bool:
    depth := 0
    for 0..s.len() |i|:
        c := s[i]
        if c == 0x5B:  -- '['
            depth += 1
        if c == 0x5D:  -- ']'
            depth -= 1
            if depth < 0:
                return false
    return depth == 0

-- ============================================================================
-- Example Usage
-- ============================================================================

fn main():
    print('=== PROOFS.CY ===')

    p := Proposition::@init(true, 'P')
    q := Proposition::@init(false, 'Q')

    print('Propositions:')
    print('  %{p.to_str()}')
    print('  %{q.to_str()}')
    print('  %{prop_and(p, q).to_str()}')
    print('  %{prop_or(p, q).to_str()}')
    print('  %{prop_implies(p, q).to_str()}')

    print('De Morgan Laws:')
    print('  ¬(P ∧ Q) ≡ ¬P ∨ ¬Q: %{de_morgan_and(p, q)}')
    print('  ¬(P ∨ Q) ≡ ¬P ∧ ¬Q: %{de_morgan_or(p, q)}')
    print('  Contrapositive holds: %{contrapositive(p, q)}')

    print('Matched brackets:')
    print('  "[[]]": %{is_matched("[[]]")}')
    print('  "[][]": %{is_matched("[][]")}')
    print('  "[[]": %{is_matched("[[]")}')
