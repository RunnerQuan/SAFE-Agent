//! ============================================================================
//! COUNTING.ZIG - CompSci Math Tools: Combinatorics and Asymptotics
//! ============================================================================
//! MIT Mathematics for Computer Science | Chapters 13-15
//! Tool implementations for factorials, binomials, sums, and generating functions
//! ============================================================================

const std = @import("std");
const math = std.math;
const Allocator = std.mem.Allocator;

// ============================================================================
// Factorials and Combinatorics
// ============================================================================

pub fn factorial(n: u64) u64 {
    if (n <= 1) return 1;
    var result: u64 = 1;
    var i: u64 = 2;
    while (i <= n) : (i += 1) {
        result *= i;
    }
    return result;
}

pub fn fallingFactorial(n: u64, k: u64) u64 {
    if (k == 0) return 1;
    if (k > n) return 0;
    var result: u64 = 1;
    var i: u64 = 0;
    while (i < k) : (i += 1) {
        result *= (n - i);
    }
    return result;
}

pub fn risingFactorial(n: u64, k: u64) u64 {
    if (k == 0) return 1;
    var result: u64 = 1;
    var i: u64 = 0;
    while (i < k) : (i += 1) {
        result *= (n + i);
    }
    return result;
}

pub fn permutations(n: u64, k: u64) u64 {
    return fallingFactorial(n, k);
}

pub fn binomial(n: u64, k_in: u64) u64 {
    if (k_in > n) return 0;
    if (k_in == 0 or k_in == n) return 1;

    var k = k_in;
    if (k > n - k) k = n - k;

    var result: u64 = 1;
    var i: u64 = 0;
    while (i < k) : (i += 1) {
        result = result * (n - i) / (i + 1);
    }
    return result;
}

pub fn multinomial(n: u64, rs: []const u64) u64 {
    var sum: u64 = 0;
    for (rs) |r| sum += r;
    if (sum != n) return 0;

    var result = factorial(n);
    for (rs) |r| {
        result /= factorial(r);
    }
    return result;
}

// ============================================================================
// Sum Formulas
// ============================================================================

pub fn arithmeticSum(n: u64) u64 {
    return n * (n + 1) / 2;
}

pub fn sumOfSquares(n: u64) u64 {
    return n * (n + 1) * (2 * n + 1) / 6;
}

pub fn sumOfCubes(n: u64) u64 {
    const s = arithmeticSum(n);
    return s * s;
}

pub fn geometricSum(x: f64, n: u64) f64 {
    if (x == 1.0) return @as(f64, @floatFromInt(n + 1));
    const n_float: f64 = @floatFromInt(n);
    return (math.pow(f64, x, n_float + 1.0) - 1.0) / (x - 1.0);
}

pub fn geometricSumInfinite(x: f64) ?f64 {
    if (@abs(x) >= 1.0) return null;
    return 1.0 / (1.0 - x);
}

pub fn harmonic(n: u64) f64 {
    var result: f64 = 0.0;
    var i: u64 = 1;
    while (i <= n) : (i += 1) {
        result += 1.0 / @as(f64, @floatFromInt(i));
    }
    return result;
}

pub const EULER_MASCHERONI: f64 = 0.5772156649;

pub fn harmonicApprox(n: u64) f64 {
    return @log(@as(f64, @floatFromInt(n))) + EULER_MASCHERONI;
}

// ============================================================================
// Asymptotic Analysis
// ============================================================================

pub const AsymptoticOrder = enum {
    less_than,
    equal,
    greater_than,
    incomparable,
};

pub fn compareGrowth(
    f: *const fn (f64) f64,
    g: *const fn (f64) f64,
    samples: usize,
) AsymptoticOrder {
    var ratios: [32]f64 = undefined;
    var ratio_count: usize = 0;
    var n: f64 = 1000.0;

    const actual_samples = @min(samples, 32);

    for (0..actual_samples) |_| {
        const f_n = f(n);
        const g_n = g(n);
        if (g_n != 0.0) {
            ratios[ratio_count] = f_n / g_n;
            ratio_count += 1;
        }
        n *= 2.0;
    }

    if (ratio_count < 2) return .incomparable;

    var decreasing = true;
    for (1..ratio_count) |i| {
        if (ratios[i] >= ratios[i - 1] * 0.9) {
            decreasing = false;
            break;
        }
    }
    if (decreasing and ratios[ratio_count - 1] < 0.01) return .less_than;

    var increasing = true;
    for (1..ratio_count) |i| {
        if (ratios[i] <= ratios[i - 1] * 1.1) {
            increasing = false;
            break;
        }
    }
    if (increasing and ratios[ratio_count - 1] > 100.0) return .greater_than;

    var avg: f64 = 0.0;
    for (ratios[0..ratio_count]) |r| avg += r;
    avg /= @as(f64, @floatFromInt(ratio_count));

    var variance: f64 = 0.0;
    for (ratios[0..ratio_count]) |r| {
        variance += (r - avg) * (r - avg);
    }
    variance /= @as(f64, @floatFromInt(ratio_count));

    if (variance < avg * avg * 0.1) return .equal;

    return .incomparable;
}

// ============================================================================
// Counting Rules
// ============================================================================

pub fn sumRule(size_a: u64, size_b: u64) u64 {
    return size_a + size_b;
}

pub fn productRule(size_a: u64, size_b: u64) u64 {
    return size_a * size_b;
}

pub fn divisionRule(size_a: u64, k: u64) u64 {
    return size_a / k;
}

pub fn sequencesWithRepetition(n: u64, k: u64) u64 {
    var result: u64 = 1;
    var i: u64 = 0;
    while (i < k) : (i += 1) {
        result *= n;
    }
    return result;
}

pub fn multisets(n: u64, k: u64) u64 {
    return binomial(n + k - 1, k);
}

// ============================================================================
// Pigeonhole Principle
// ============================================================================

pub fn pigeonholeMin(n: u64, k: u64) u64 {
    return (n + k - 1) / k;
}

pub fn pigeonholeCollisionGuaranteed(items: u64, containers: u64) bool {
    return items > containers;
}

// ============================================================================
// Inclusion-Exclusion
// ============================================================================

pub fn inclusionExclusion2(size_a: u64, size_b: u64, size_ab: u64) u64 {
    return size_a + size_b - size_ab;
}

pub fn inclusionExclusion3(
    size_a: u64,
    size_b: u64,
    size_c: u64,
    size_ab: u64,
    size_ac: u64,
    size_bc: u64,
    size_abc: u64,
) u64 {
    return size_a + size_b + size_c - size_ab - size_ac - size_bc + size_abc;
}

pub fn derangements(n: u64) u64 {
    if (n == 0) return 1;
    if (n == 1) return 0;

    var d_prev2: u64 = 1;
    var d_prev1: u64 = 0;

    var i: u64 = 2;
    while (i <= n) : (i += 1) {
        const d_curr = (i - 1) * (d_prev1 + d_prev2);
        d_prev2 = d_prev1;
        d_prev1 = d_curr;
    }

    return d_prev1;
}

// ============================================================================
// Binomial Identities
// ============================================================================

pub fn binomialSum(n: u64) u64 {
    return @as(u64, 1) << @intCast(n);
}

pub fn binomialAlternatingSum(n: u64) i64 {
    if (n == 0) return 1;
    return 0;
}

pub fn pascalIdentity(n: u64, k: u64) bool {
    if (k < 1 or k >= n) return true;
    return binomial(n, k) == binomial(n - 1, k - 1) + binomial(n - 1, k);
}

pub fn vandermonde(m: u64, n: u64, r: u64) u64 {
    var result: u64 = 0;
    var k: u64 = 0;
    while (k <= r) : (k += 1) {
        result += binomial(m, k) * binomial(n, r - k);
    }
    return result;
}

pub fn verifyVandermonde(m: u64, n: u64, r: u64) bool {
    return vandermonde(m, n, r) == binomial(m + n, r);
}

// ============================================================================
// Stirling's Approximation
// ============================================================================

pub const PI: f64 = 3.14159265358979323846;

pub fn stirling(n: u64) f64 {
    const nf: f64 = @floatFromInt(n);
    return @sqrt(2.0 * PI * nf) * math.pow(f64, nf / math.e, nf);
}

pub fn stirlingRatio(n: u64) f64 {
    return @as(f64, @floatFromInt(factorial(n))) / stirling(n);
}

// ============================================================================
// Fibonacci
// ============================================================================

pub fn fibonacci(n: u64) u64 {
    if (n == 0) return 0;
    if (n == 1) return 1;

    var prev2: u64 = 0;
    var prev1: u64 = 1;

    var i: u64 = 2;
    while (i <= n) : (i += 1) {
        const curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}

pub const PHI: f64 = 1.6180339887498949;
pub const PSI: f64 = -0.6180339887498949;

pub fn fibonacciBinet(n: u64) u64 {
    const nf: f64 = @floatFromInt(n);
    const result = (math.pow(f64, PHI, nf) - math.pow(f64, PSI, nf)) / @sqrt(5.0);
    return @intFromFloat(@round(result));
}

// ============================================================================
// Tests
// ============================================================================

test "factorial" {
    try std.testing.expect(factorial(0) == 1);
    try std.testing.expect(factorial(5) == 120);
    try std.testing.expect(factorial(10) == 3628800);
}

test "binomial" {
    try std.testing.expect(binomial(5, 0) == 1);
    try std.testing.expect(binomial(5, 2) == 10);
    try std.testing.expect(binomial(10, 3) == 120);
}

test "arithmetic sum" {
    try std.testing.expect(arithmeticSum(100) == 5050);
}

test "derangements" {
    try std.testing.expect(derangements(0) == 1);
    try std.testing.expect(derangements(4) == 9);
    try std.testing.expect(derangements(5) == 44);
}

test "fibonacci" {
    try std.testing.expect(fibonacci(10) == 55);
    try std.testing.expect(fibonacciBinet(10) == 55);
}

test "pascal identity" {
    try std.testing.expect(pascalIdentity(10, 4));
}

test "vandermonde identity" {
    try std.testing.expect(verifyVandermonde(5, 6, 4));
}
