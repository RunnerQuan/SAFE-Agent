-- ============================================================================
-- COUNTING.CY - CompSci Math Tools: Combinatorics and Asymptotics
-- ============================================================================
-- MIT Mathematics for Computer Science | Chapters 13-15
-- Tool implementations for factorials, binomials, sums, and generating functions
-- ============================================================================

use math

-- ============================================================================
-- Factorials and Combinatorics
-- ============================================================================

fn factorial(n int) -> int:
    if n <= 1:
        return 1
    result := 1
    for 2..=n |i|:
        result *= i
    return result

fn falling_factorial(n, k int) -> int:
    if k <= 0:
        return 1
    if k > n:
        return 0
    result := 1
    for 0..k |i|:
        result *= (n - i)
    return result

fn rising_factorial(n, k int) -> int:
    if k <= 0:
        return 1
    result := 1
    for 0..k |i|:
        result *= (n + i)
    return result

fn permutations(n, k int) -> int:
    return falling_factorial(n, k)

fn binomial(n, k int) -> int:
    if k < 0 or k > n:
        return 0
    if k == 0 or k == n:
        return 1
    if k > n - k:
        k = n - k
    result := 1
    for 0..k |i|:
        result = result * (n - i) / (i + 1)
    return result

fn multinomial(n int, rs []int) -> int:
    sum := 0
    for rs |r|:
        sum += r
    if sum != n:
        return 0

    result := factorial(n)
    for rs |r|:
        result /= factorial(r)
    return result

-- ============================================================================
-- Sum Formulas
-- ============================================================================

fn arithmetic_sum(n int) -> int:
    return n * (n + 1) / 2

fn sum_of_squares(n int) -> int:
    return n * (n + 1) * (2 * n + 1) / 6

fn sum_of_cubes(n int) -> int:
    s := arithmetic_sum(n)
    return s * s

fn geometric_sum(x float, n int) -> float:
    if x == 1.0:
        return as[float](n + 1)
    return (math.pow(x, as[float](n + 1)) - 1.0) / (x - 1.0)

fn geometric_sum_infinite(x float) -> ?float:
    if math.abs(x) >= 1.0:
        return none
    return 1.0 / (1.0 - x)

fn harmonic(n int) -> float:
    result := 0.0
    for 1..=n |i|:
        result += 1.0 / as[float](i)
    return result

const EULER_MASCHERONI float = 0.5772156649

fn harmonic_approx(n int) -> float:
    return math.log(as[float](n)) + EULER_MASCHERONI

-- ============================================================================
-- Asymptotic Analysis
-- ============================================================================

type AsymptoticOrder enum:
    case less_than
    case equal
    case greater_than
    case incomparable

fn compare_growth(f, g fn(float) -> float, samples int) -> AsymptoticOrder:
    ratios := []float{}
    n := 1000.0

    for 0..samples |_|:
        f_n := f(n)
        g_n := g(n)
        if g_n != 0.0:
            ratios += f_n / g_n
        n *= 2.0

    if ratios.len() < 2:
        return AsymptoticOrder.incomparable

    decreasing := true
    for 1..ratios.len() |i|:
        if ratios[i] >= ratios[i-1] * 0.9:
            decreasing = false
            break
    if decreasing and ratios[ratios.len()-1] < 0.01:
        return AsymptoticOrder.less_than

    increasing := true
    for 1..ratios.len() |i|:
        if ratios[i] <= ratios[i-1] * 1.1:
            increasing = false
            break
    if increasing and ratios[ratios.len()-1] > 100.0:
        return AsymptoticOrder.greater_than

    variance := 0.0
    avg := 0.0
    for ratios |r|:
        avg += r
    avg /= as[float](ratios.len())
    for ratios |r|:
        variance += (r - avg) * (r - avg)
    variance /= as[float](ratios.len())

    if variance < avg * avg * 0.1:
        return AsymptoticOrder.equal

    return AsymptoticOrder.incomparable

-- ============================================================================
-- Counting Rules
-- ============================================================================

fn sum_rule(size_a, size_b int) -> int:
    return size_a + size_b

fn product_rule(size_a, size_b int) -> int:
    return size_a * size_b

fn division_rule(size_a, k int) -> int:
    return size_a / k

fn sequences_with_repetition(n, k int) -> int:
    result := 1
    for 0..k |_|:
        result *= n
    return result

fn multisets(n, k int) -> int:
    return binomial(n + k - 1, k)

-- ============================================================================
-- Pigeonhole Principle
-- ============================================================================

fn pigeonhole_min(n, k int) -> int:
    return (n + k - 1) / k

fn pigeonhole_collision_guaranteed(items, containers int) -> bool:
    return items > containers

-- ============================================================================
-- Inclusion-Exclusion
-- ============================================================================

fn inclusion_exclusion_2(size_a, size_b, size_ab int) -> int:
    return size_a + size_b - size_ab

fn inclusion_exclusion_3(
    size_a, size_b, size_c int,
    size_ab, size_ac, size_bc int,
    size_abc int
) -> int:
    return size_a + size_b + size_c - size_ab - size_ac - size_bc + size_abc

fn derangements(n int) -> int:
    if n == 0:
        return 1
    if n == 1:
        return 0

    d_prev2 := 1
    d_prev1 := 0

    for 2..=n |i|:
        d_curr := (i - 1) * (d_prev1 + d_prev2)
        d_prev2 = d_prev1
        d_prev1 = d_curr

    return d_prev1

-- ============================================================================
-- Binomial Identities
-- ============================================================================

fn binomial_sum(n int) -> int:
    return 1 << n

fn binomial_alternating_sum(n int) -> int:
    if n == 0:
        return 1
    return 0

fn pascal_identity(n, k int) -> bool:
    if k < 1 or k >= n:
        return true
    return binomial(n, k) == binomial(n-1, k-1) + binomial(n-1, k)

fn vandermonde(m, n, r int) -> int:
    result := 0
    for 0..=r |k|:
        result += binomial(m, k) * binomial(n, r - k)
    return result

fn verify_vandermonde(m, n, r int) -> bool:
    return vandermonde(m, n, r) == binomial(m + n, r)

-- ============================================================================
-- Stirling's Approximation
-- ============================================================================

const PI float = 3.14159265358979323846

fn stirling(n int) -> float:
    nf := as[float](n)
    return math.sqrt(2.0 * PI * nf) * math.pow(nf / math.e, nf)

fn stirling_ratio(n int) -> float:
    return as[float](factorial(n)) / stirling(n)

-- ============================================================================
-- Fibonacci
-- ============================================================================

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

const PHI float = 1.6180339887498949
const PSI float = -0.6180339887498949

fn fibonacci_binet(n int) -> int:
    nf := as[float](n)
    result := (math.pow(PHI, nf) - math.pow(PSI, nf)) / math.sqrt(5.0)
    return as[int](result + 0.5)

-- ============================================================================
-- Generating Functions
-- ============================================================================

type Polynomial:
    coeffs []float

fn Polynomial :: @init(cs []float) -> Self:
    return Polynomial{coeffs=cs}

fn Polynomial :: zero() -> Self:
    return Polynomial{coeffs=[]float{}}

fn (&Polynomial) degree() -> int:
    return self.coeffs.len() - 1

fn (&Polynomial) coeff(k int) -> float:
    if k < 0 or k >= self.coeffs.len():
        return 0.0
    return self.coeffs[k]

fn (&Polynomial) eval(x float) -> float:
    result := 0.0
    x_pow := 1.0
    for self.coeffs |c|:
        result += c * x_pow
        x_pow *= x
    return result

fn poly_add(p, q Polynomial) -> Polynomial:
    max_len := p.coeffs.len()
    if q.coeffs.len() > max_len:
        max_len = q.coeffs.len()

    result := []float{}
    for 0..max_len |i|:
        result += p.coeff(i) + q.coeff(i)
    return Polynomial{coeffs=result}

fn poly_mul(p, q Polynomial) -> Polynomial:
    if p.coeffs.len() == 0 or q.coeffs.len() == 0:
        return Polynomial::zero()

    result_len := p.coeffs.len() + q.coeffs.len() - 1
    result := []float{}
    for 0..result_len |_|:
        result += 0.0

    for 0..p.coeffs.len() |i|:
        for 0..q.coeffs.len() |j|:
            result[i + j] += p.coeffs[i] * q.coeffs[j]

    return Polynomial{coeffs=result}

-- ============================================================================
-- Example Usage
-- ============================================================================

fn main():
    print('=== COUNTING.CY ===')

    print('Combinatorics:')
    print('  10! = %{factorial(10)}')
    print('  P(10,3) = %{permutations(10, 3)}')
    print('  C(10,3) = %{binomial(10, 3)}')

    print('Sum Formulas:')
    print('  1+2+...+100 = %{arithmetic_sum(100)}')
    print('  1²+2²+...+10² = %{sum_of_squares(10)}')
    print('  H_10 = %{harmonic(10).fmt()}')

    print('Counting:')
    print('  3-digit binary strings: %{sequences_with_repetition(2, 3)}')
    print('  Derangements of 5: %{derangements(5)}')

    print('Binomial Identities:')
    print('  Pascal C(10,4) verified: %{pascal_identity(10, 4)}')
    print('  Vandermonde verified: %{verify_vandermonde(5, 6, 4)}')

    print('Fibonacci:')
    for 0..=10 |i|:
        print('  F_%{i} = %{fibonacci(i)} (Binet: %{fibonacci_binet(i)})')
