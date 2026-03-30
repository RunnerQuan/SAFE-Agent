-- ============================================================================
-- RECURRENCES.CY - CompSci Math Tools: Recurrence Relations
-- ============================================================================
-- MIT Mathematics for Computer Science | Chapter 21
-- Tool implementations for Hanoi, Master Theorem, Akra-Bazzi, and linear recurrences
-- ============================================================================

use math

-- ============================================================================
-- Towers of Hanoi
-- ============================================================================

fn hanoi_closed(n int) -> int:
    return (1 << n) - 1

fn hanoi_iterative(n int) -> int:
    if n <= 0:
        return 0

    t := 1
    for 2..=n |_|:
        t = 2 * t + 1
    return t

fn verify_hanoi(n int) -> bool:
    return hanoi_closed(n) == hanoi_iterative(n)

-- ============================================================================
-- Merge Sort Recurrence
-- ============================================================================

fn merge_sort_comparisons(n int) -> int:
    if n <= 1:
        return 0

    t := []int{0, 0}
    size := 2

    while size <= n:
        prev := t[size / 2]
        curr := 2 * prev + size - 1

        while t.len() <= size:
            t += 0
        t[size] = curr
        size *= 2

    return t[n]

fn merge_sort_closed(n int) -> int:
    if n <= 1:
        return 0
    nf := as[float](n)
    log_n := math.log(nf) / math.log(2.0)
    return as[int](nf * log_n - nf + 1.0 + 0.5)

-- ============================================================================
-- Linear Recurrence
-- ============================================================================

type LinearRecurrence:
    coefficients   []float
    initial_values []float

fn LinearRecurrence :: @init(coeffs, initial []float) -> Self:
    return LinearRecurrence{coefficients=coeffs, initial_values=initial}

fn (&LinearRecurrence) order() -> int:
    return self.coefficients.len()

fn (&LinearRecurrence) eval(n int) -> float:
    k := self.order()

    if n < k:
        return self.initial_values[n]

    values := []float{}
    for self.initial_values |v|:
        values += v

    for k..=n |_|:
        new_val := 0.0
        for 0..k |i|:
            new_val += self.coefficients[i] * values[k - 1 - i]

        for 0..(k-1) |i|:
            values[i] = values[i + 1]
        values[k - 1] = new_val

    return values[k - 1]

-- ============================================================================
-- Fibonacci
-- ============================================================================

const PHI float = 1.6180339887498949
const PSI float = -0.6180339887498949
const SQRT5 float = 2.2360679774997896

fn fibonacci_binet(n int) -> int:
    nf := as[float](n)
    result := (math.pow(PHI, nf) - math.pow(PSI, nf)) / SQRT5
    return as[int](result + 0.5)

fn fibonacci(n int) -> int:
    if n <= 0:
        return 0
    if n == 1:
        return 1

    prev2 := 0
    prev1 := 1

    for 2..=n |_|:
        curr := prev1 + prev2
        prev2 = prev1
        prev1 = curr

    return prev1

fn fibonacci_recurrence() -> LinearRecurrence:
    return LinearRecurrence::@init(
        []float{1.0, 1.0},
        []float{0.0, 1.0}
    )

-- ============================================================================
-- Characteristic Roots
-- ============================================================================

type CharacteristicRoots enum:
    case distinct ^(float, float)
    case repeated float
    case complex ^(float, float)

fn solve_characteristic(a, b float) -> CharacteristicRoots:
    discriminant := a * a + 4.0 * b

    if discriminant > 0.0001:
        sqrt_d := math.sqrt(discriminant)
        r1 := (a + sqrt_d) / 2.0
        r2 := (a - sqrt_d) / 2.0
        return CharacteristicRoots.distinct(^(r1, r2))
    else discriminant < -0.0001:
        real_part := a / 2.0
        imag_part := math.sqrt(-discriminant) / 2.0
        return CharacteristicRoots.complex(^(real_part, imag_part))
    else:
        return CharacteristicRoots.repeated(a / 2.0)

fn eval_second_order(a, b, t0, t1 float, n int) -> float:
    if n == 0:
        return t0
    if n == 1:
        return t1

    roots := solve_characteristic(a, b)

    switch roots:
        case .distinct |pair|:
            r1, r2 := pair.*.0, pair.*.1
            c2 := (t1 - t0 * r1) / (r2 - r1)
            c1 := t0 - c2
            nf := as[float](n)
            return c1 * math.pow(r1, nf) + c2 * math.pow(r2, nf)

        case .repeated |r|:
            c1 := t0
            c2 := (t1 - t0 * r) / r
            nf := as[float](n)
            return (c1 + c2 * nf) * math.pow(r, nf)

        case .complex |_|:
            rec := LinearRecurrence::@init([]float{a, b}, []float{t0, t1})
            return rec.eval(n)

-- ============================================================================
-- Master Theorem
-- ============================================================================

type MasterCase enum:
    case one
    case two
    case three

type MasterTheorem:
    a int
    b int
    d float

fn MasterTheorem :: @init(a, b int, d float) -> Self:
    return MasterTheorem{a=a, b=b, d=d}

fn (&MasterTheorem) critical_exponent() -> float:
    return math.log(as[float](self.a)) / math.log(as[float](self.b))

fn (&MasterTheorem) classify() -> MasterCase:
    c := self.critical_exponent()

    if self.d < c - 0.0001:
        return MasterCase.one
    else self.d > c + 0.0001:
        return MasterCase.three
    else:
        return MasterCase.two

fn (&MasterTheorem) complexity_string() -> str:
    c := self.critical_exponent()

    switch self.classify():
        case .one:
            return 'Θ(n^%{c.fmt()})'
        case .two:
            return 'Θ(n^%{c.fmt()} log n)'
        case .three:
            return 'Θ(n^%{self.d.fmt()})'

fn master_binary_search() -> MasterTheorem:
    return MasterTheorem::@init(1, 2, 0.0)

fn master_merge_sort() -> MasterTheorem:
    return MasterTheorem::@init(2, 2, 1.0)

fn master_karatsuba() -> MasterTheorem:
    return MasterTheorem::@init(3, 2, 1.0)

fn master_strassen() -> MasterTheorem:
    return MasterTheorem::@init(7, 2, 2.0)

-- ============================================================================
-- Akra-Bazzi Method
-- ============================================================================

type AkraBazzi:
    terms []^(float, float)

fn AkraBazzi :: @init() -> Self:
    return AkraBazzi{terms=[]^(float, float){}}

fn (&AkraBazzi) add_term(a, b float):
    self.terms += ^(a, b)

fn (&AkraBazzi) sum_at_p(p float) -> float:
    result := 0.0
    for self.terms |term|:
        a, b := term.*.0, term.*.1
        result += a / math.pow(b, p)
    return result

fn (&AkraBazzi) find_p() -> float:
    if self.terms.len() == 0:
        return 0.0

    lo := -10.0
    hi := 10.0

    for 0..100 |_|:
        mid := (lo + hi) / 2.0
        sum := self.sum_at_p(mid)

        if math.abs(sum - 1.0) < 0.0000001:
            return mid

        if sum > 1.0:
            lo = mid
        else:
            hi = mid

    return (lo + hi) / 2.0

-- ============================================================================
-- Common Recurrence Patterns
-- ============================================================================

fn recurrence_linear(n int) -> int:
    return n

fn recurrence_quadratic(n int) -> int:
    return n * (n + 1) / 2

fn recurrence_exponential(n int) -> int:
    return 1 << n

fn recurrence_logarithmic(n int) -> int:
    if n <= 1:
        return 0
    count := 0
    m := n
    while m > 1:
        m /= 2
        count += 1
    return count

-- ============================================================================
-- Recurrence Verification
-- ============================================================================

fn verify_recurrence(
    recurrence fn(int) -> int,
    closed_form fn(int) -> int,
    start, end int
) -> bool:
    for start..=end |n|:
        if recurrence(n) != closed_form(n):
            return false
    return true

-- ============================================================================
-- Example Usage
-- ============================================================================

fn main():
    print('=== RECURRENCES.CY ===')

    print('Towers of Hanoi:')
    for 1..=10 |n|:
        print('  T(%{n}) = %{hanoi_closed(n)} (verified: %{verify_hanoi(n)})')

    print('Fibonacci:')
    fib := fibonacci_recurrence()
    for 0..=15 |n|:
        iter := fibonacci(n)
        binet := fibonacci_binet(n)
        gf := as[int](fib.eval(n))
        print('  F(%{n}) = %{iter} (Binet: %{binet}, GF: %{gf})')

    print('Master Theorem:')
    binary := master_binary_search()
    print('  Binary Search: c = %{binary.critical_exponent().fmt()}, %{binary.complexity_string()}')

    merge := master_merge_sort()
    print('  Merge Sort: c = %{merge.critical_exponent().fmt()}, %{merge.complexity_string()}')

    karatsuba := master_karatsuba()
    print('  Karatsuba: c = %{karatsuba.critical_exponent().fmt()}, %{karatsuba.complexity_string()}')

    print('Akra-Bazzi:')
    ab := AkraBazzi::@init()
    ab.add_term(1.0, 2.0)
    ab.add_term(1.0, 3.0)
    p := ab.find_p()
    print('  T(n) = T(n/2) + T(n/3) + n')
    print('  p ≈ %{p.fmt()}, verification: %{ab.sum_at_p(p).fmt()}')

    print('Common Patterns:')
    print('  T(n) = T(n-1) + 1:   T(10) = %{recurrence_linear(10)}')
    print('  T(n) = T(n-1) + n:   T(10) = %{recurrence_quadratic(10)}')
    print('  T(n) = 2T(n-1):      T(10) = %{recurrence_exponential(10)}')
    print('  T(n) = T(n/2) + 1:   T(16) = %{recurrence_logarithmic(16)}')
