-- ============================================================================
-- PROBABILITY.CY - CompSci Math Tools: Probability and Random Variables
-- ============================================================================
-- MIT Mathematics for Computer Science | Chapters 16-20
-- Tool implementations for distributions, expectation, variance, and bounds
-- ============================================================================

use math

-- ============================================================================
-- Probability Rules
-- ============================================================================

fn complement(p float) -> float:
    return 1.0 - p

fn union(p_a, p_b, p_ab float) -> float:
    return p_a + p_b - p_ab

fn union_bound(probs []float) -> float:
    sum := 0.0
    for probs |p|:
        sum += p
    return if sum > 1.0: 1.0 else: sum

-- ============================================================================
-- Conditional Probability
-- ============================================================================

fn conditional(p_ab, p_b float) -> ?float:
    if p_b == 0.0:
        return none
    return p_ab / p_b

fn joint(p_a, p_b_given_a float) -> float:
    return p_a * p_b_given_a

fn bayes(p_b_given_a, p_a, p_b float) -> ?float:
    if p_b == 0.0:
        return none
    return p_b_given_a * p_a / p_b

fn total_probability(p_b_given_a, p_a []float) -> float:
    if p_b_given_a.len() != p_a.len():
        return 0.0

    result := 0.0
    for 0..p_a.len() |i|:
        result += p_b_given_a[i] * p_a[i]
    return result

fn bayes_extended(j int, p_b_given_a, p_a []float) -> ?float:
    if j < 0 or j >= p_a.len():
        return none

    p_b := total_probability(p_b_given_a, p_a)
    if p_b == 0.0:
        return none

    return p_b_given_a[j] * p_a[j] / p_b

-- ============================================================================
-- Independence
-- ============================================================================

fn are_independent(p_a, p_b, p_ab float) -> bool:
    expected := p_a * p_b
    return math.abs(p_ab - expected) < 1e-10

-- ============================================================================
-- Distributions
-- ============================================================================

type Distribution:
    values []float
    probs  []float

fn Distribution :: @init(vals, ps []float) -> Self:
    return Distribution{values=vals, probs=ps}

fn (&Distribution) is_valid() -> bool:
    if self.values.len() != self.probs.len():
        return false

    sum := 0.0
    for self.probs |p|:
        if p < 0.0:
            return false
        sum += p

    return math.abs(sum - 1.0) < 1e-10

fn (&Distribution) pmf(x float) -> float:
    for 0..self.values.len() |i|:
        if math.abs(self.values[i] - x) < 1e-10:
            return self.probs[i]
    return 0.0

fn (&Distribution) cdf(x float) -> float:
    result := 0.0
    for 0..self.values.len() |i|:
        if self.values[i] <= x:
            result += self.probs[i]
    return result

fn (&Distribution) expectation() -> float:
    result := 0.0
    for 0..self.values.len() |i|:
        result += self.values[i] * self.probs[i]
    return result

fn (&Distribution) expectation_squared() -> float:
    result := 0.0
    for 0..self.values.len() |i|:
        result += self.values[i] * self.values[i] * self.probs[i]
    return result

fn (&Distribution) variance() -> float:
    e_x := self.expectation()
    e_x2 := self.expectation_squared()
    return e_x2 - e_x * e_x

fn (&Distribution) std_dev() -> float:
    return math.sqrt(self.variance())

-- ============================================================================
-- Common Distributions
-- ============================================================================

fn bernoulli(p float) -> Distribution:
    return Distribution{
        values=[]float{0.0, 1.0},
        probs=[]float{1.0 - p, p}
    }

fn binomial_pmf(n, k int, p float) -> float:
    if k < 0 or k > n:
        return 0.0

    c := 1.0
    for 0..k |i|:
        c *= as[float](n - i) / as[float](i + 1)

    return c * math.pow(p, as[float](k)) * math.pow(1.0 - p, as[float](n - k))

fn binomial_dist(n int, p float) -> Distribution:
    values := []float{}
    probs := []float{}

    for 0..=n |k|:
        values += as[float](k)
        probs += binomial_pmf(n, k, p)

    return Distribution{values=values, probs=probs}

fn geometric_pmf(k int, p float) -> float:
    if k < 1:
        return 0.0
    return math.pow(1.0 - p, as[float](k - 1)) * p

fn poisson_pmf(k int, lambda float) -> float:
    if k < 0:
        return 0.0

    result := math.exp(-lambda)
    for 1..=k |i|:
        result *= lambda / as[float](i)

    return result

fn poisson_dist(lambda float, max_k int) -> Distribution:
    values := []float{}
    probs := []float{}

    for 0..=max_k |k|:
        values += as[float](k)
        probs += poisson_pmf(k, lambda)

    return Distribution{values=values, probs=probs}

fn uniform_dist(n int) -> Distribution:
    values := []float{}
    probs := []float{}
    p := 1.0 / as[float](n)

    for 1..=n |k|:
        values += as[float](k)
        probs += p

    return Distribution{values=values, probs=probs}

-- ============================================================================
-- Distribution Statistics
-- ============================================================================

fn bernoulli_mean(p float) -> float:
    return p

fn bernoulli_variance(p float) -> float:
    return p * (1.0 - p)

fn binomial_mean(n int, p float) -> float:
    return as[float](n) * p

fn binomial_variance(n int, p float) -> float:
    return as[float](n) * p * (1.0 - p)

fn geometric_mean(p float) -> float:
    return 1.0 / p

fn geometric_variance(p float) -> float:
    return (1.0 - p) / (p * p)

fn poisson_mean(lambda float) -> float:
    return lambda

fn poisson_variance(lambda float) -> float:
    return lambda

fn uniform_mean(n int) -> float:
    return as[float](n + 1) / 2.0

fn uniform_variance(n int) -> float:
    nf := as[float](n)
    return (nf * nf - 1.0) / 12.0

-- ============================================================================
-- Probability Bounds
-- ============================================================================

fn markov_bound(e_x, c float) -> ?float:
    if c <= 0.0:
        return none
    bound := e_x / c
    return if bound > 1.0: 1.0 else: bound

fn chebyshev_bound(k float) -> ?float:
    if k <= 0.0:
        return none
    bound := 1.0 / (k * k)
    return if bound > 1.0: 1.0 else: bound

fn chebyshev_bound_abs(var_x, c float) -> ?float:
    if c <= 0.0:
        return none
    bound := var_x / (c * c)
    return if bound > 1.0: 1.0 else: bound

fn chernoff_upper(mu, delta float) -> float:
    if delta <= 0.0 or delta >= 1.0:
        return 1.0
    return math.exp(-delta * delta * mu / 3.0)

fn chernoff_lower(mu, delta float) -> float:
    if delta <= 0.0 or delta >= 1.0:
        return 1.0
    return math.exp(-delta * delta * mu / 2.0)

-- ============================================================================
-- Birthday Problem
-- ============================================================================

fn birthday_no_collision(n, d int) -> float:
    if n > d:
        return 0.0

    result := 1.0
    for 0..n |i|:
        result *= as[float](d - i) / as[float](d)
    return result

fn birthday_collision(n, d int) -> float:
    return 1.0 - birthday_no_collision(n, d)

fn birthday_threshold(d int) -> int:
    return as[int](1.2 * math.sqrt(as[float](d)))

-- ============================================================================
-- Random Walks
-- ============================================================================

fn gamblers_ruin_fair(n, target int) -> float:
    if n >= target:
        return 0.0
    if n <= 0:
        return 1.0
    return 1.0 - as[float](n) / as[float](target)

fn gamblers_ruin_biased(n, target int, p float) -> float:
    if p == 0.5:
        return gamblers_ruin_fair(n, target)
    if n >= target:
        return 0.0
    if n <= 0:
        return 1.0

    q := (1.0 - p) / p
    q_n := math.pow(q, as[float](n))
    q_t := math.pow(q, as[float](target))

    return (q_n - q_t) / (1.0 - q_t)

-- ============================================================================
-- Example Usage
-- ============================================================================

fn main():
    print('=== PROBABILITY.CY ===')

    print('Basic Probability:')
    print('  P(A) = 0.3, P(complement) = %{complement(0.3).fmt()}')

    cond := conditional(0.2, 0.5)
    if cond |c|:
        print('  P(A|B) where P(A∩B)=0.2, P(B)=0.5: %{c.fmt()}')

    b := bayes(0.9, 0.01, 0.099)
    if b |p|:
        print('  Bayes theorem: P(D|+) = %{p.fmt()}')

    print('Distributions:')
    binom := binomial_dist(10, 0.3)
    print('  Binomial(10, 0.3): E[X] = %{binom.expectation().fmt()}, Var = %{binom.variance().fmt()}')

    print('Probability Bounds:')
    markov := markov_bound(10.0, 50.0)
    if markov |m|:
        print('  Markov: P(X ≥ 50) ≤ %{m.fmt()} when E[X] = 10')

    cheb := chebyshev_bound(2.0)
    if cheb |c|:
        print('  Chebyshev: P(|X-μ| ≥ 2σ) ≤ %{c.fmt()}')

    print('Birthday Problem (365 days):')
    for []int{10, 23, 30, 50} |n|:
        p := birthday_collision(n, 365)
        print('  n=%{n}: P(collision) = %{p.fmt()}')
