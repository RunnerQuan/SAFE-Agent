//! ============================================================================
//! PROBABILITY.ZIG - CompSci Math Tools: Probability and Random Variables
//! ============================================================================
//! MIT Mathematics for Computer Science | Chapters 16-20
//! Tool implementations for distributions, expectation, variance, and bounds
//! ============================================================================

const std = @import("std");
const math = std.math;
const Allocator = std.mem.Allocator;

// ============================================================================
// Probability Rules
// ============================================================================

pub fn probComplement(p_a: f64) f64 {
    return 1.0 - p_a;
}

pub fn probUnion(p_a: f64, p_b: f64, p_ab: f64) f64 {
    return p_a + p_b - p_ab;
}

pub fn probDifference(p_a: f64, p_ab: f64) f64 {
    return p_a - p_ab;
}

pub fn unionBound(probs: []const f64) f64 {
    var sum: f64 = 0.0;
    for (probs) |p| sum += p;
    return @min(sum, 1.0);
}

// ============================================================================
// Conditional Probability
// ============================================================================

pub fn conditionalProb(p_ab: f64, p_b: f64) ?f64 {
    if (p_b == 0.0) return null;
    return p_ab / p_b;
}

pub fn productRule(p_a: f64, p_b_given_a: f64) f64 {
    return p_a * p_b_given_a;
}

pub fn bayesTheorem(p_b_given_a: f64, p_a: f64, p_b: f64) ?f64 {
    if (p_b == 0.0) return null;
    return p_b_given_a * p_a / p_b;
}

pub fn totalProbability(
    p_a_given_bi: []const f64,
    p_bi: []const f64,
) f64 {
    var sum: f64 = 0.0;
    const n = @min(p_a_given_bi.len, p_bi.len);
    for (0..n) |i| {
        sum += p_a_given_bi[i] * p_bi[i];
    }
    return sum;
}

// ============================================================================
// Independence
// ============================================================================

pub fn areIndependent(p_a: f64, p_b: f64, p_ab: f64, epsilon: f64) bool {
    return @abs(p_ab - p_a * p_b) < epsilon;
}

// ============================================================================
// Bernoulli Distribution
// ============================================================================

pub const Bernoulli = struct {
    p: f64,

    pub fn init(p: f64) Bernoulli {
        return .{ .p = @min(@max(p, 0.0), 1.0) };
    }

    pub fn prob(self: Bernoulli, k: u64) f64 {
        return switch (k) {
            0 => 1.0 - self.p,
            1 => self.p,
            else => 0.0,
        };
    }

    pub fn expectation(self: Bernoulli) f64 {
        return self.p;
    }

    pub fn variance(self: Bernoulli) f64 {
        return self.p * (1.0 - self.p);
    }
};

// ============================================================================
// Binomial Distribution
// ============================================================================

pub const Binomial = struct {
    n: u64,
    p: f64,

    pub fn init(n: u64, p: f64) Binomial {
        return .{ .n = n, .p = @min(@max(p, 0.0), 1.0) };
    }

    pub fn prob(self: Binomial, k: u64) f64 {
        if (k > self.n) return 0.0;

        const n_choose_k = binomialCoeff(self.n, k);
        const p_k = math.pow(f64, self.p, @as(f64, @floatFromInt(k)));
        const q_nk = math.pow(f64, 1.0 - self.p, @as(f64, @floatFromInt(self.n - k)));

        return @as(f64, @floatFromInt(n_choose_k)) * p_k * q_nk;
    }

    pub fn expectation(self: Binomial) f64 {
        return @as(f64, @floatFromInt(self.n)) * self.p;
    }

    pub fn variance(self: Binomial) f64 {
        return @as(f64, @floatFromInt(self.n)) * self.p * (1.0 - self.p);
    }
};

// ============================================================================
// Geometric Distribution
// ============================================================================

pub const Geometric = struct {
    p: f64,

    pub fn init(p: f64) Geometric {
        return .{ .p = @min(@max(p, 0.001), 1.0) };
    }

    pub fn prob(self: Geometric, k: u64) f64 {
        if (k == 0) return 0.0;
        const q_k1 = math.pow(f64, 1.0 - self.p, @as(f64, @floatFromInt(k - 1)));
        return q_k1 * self.p;
    }

    pub fn expectation(self: Geometric) f64 {
        return 1.0 / self.p;
    }

    pub fn variance(self: Geometric) f64 {
        return (1.0 - self.p) / (self.p * self.p);
    }
};

// ============================================================================
// Poisson Distribution
// ============================================================================

pub const Poisson = struct {
    lambda: f64,

    pub fn init(lambda: f64) Poisson {
        return .{ .lambda = @max(lambda, 0.0) };
    }

    pub fn prob(self: Poisson, k: u64) f64 {
        const exp_neg_lambda = @exp(-self.lambda);
        const lambda_k = math.pow(f64, self.lambda, @as(f64, @floatFromInt(k)));
        const k_fact = factorial(k);
        return exp_neg_lambda * lambda_k / @as(f64, @floatFromInt(k_fact));
    }

    pub fn expectation(self: Poisson) f64 {
        return self.lambda;
    }

    pub fn variance(self: Poisson) f64 {
        return self.lambda;
    }
};

// ============================================================================
// Uniform Discrete Distribution
// ============================================================================

pub const UniformDiscrete = struct {
    n: u64,

    pub fn init(n: u64) UniformDiscrete {
        return .{ .n = @max(n, 1) };
    }

    pub fn prob(self: UniformDiscrete, k: u64) f64 {
        if (k < 1 or k > self.n) return 0.0;
        return 1.0 / @as(f64, @floatFromInt(self.n));
    }

    pub fn expectation(self: UniformDiscrete) f64 {
        return @as(f64, @floatFromInt(self.n + 1)) / 2.0;
    }

    pub fn variance(self: UniformDiscrete) f64 {
        const n_f: f64 = @floatFromInt(self.n);
        return (n_f * n_f - 1.0) / 12.0;
    }
};

// ============================================================================
// Expectation and Variance
// ============================================================================

pub fn expectation(values: []const f64, probs: []const f64) f64 {
    var sum: f64 = 0.0;
    const n = @min(values.len, probs.len);
    for (0..n) |i| {
        sum += values[i] * probs[i];
    }
    return sum;
}

pub fn expectationSquared(values: []const f64, probs: []const f64) f64 {
    var sum: f64 = 0.0;
    const n = @min(values.len, probs.len);
    for (0..n) |i| {
        sum += values[i] * values[i] * probs[i];
    }
    return sum;
}

pub fn variance(values: []const f64, probs: []const f64) f64 {
    const e_x = expectation(values, probs);
    const e_x2 = expectationSquared(values, probs);
    return e_x2 - e_x * e_x;
}

pub fn standardDeviation(values: []const f64, probs: []const f64) f64 {
    return @sqrt(variance(values, probs));
}

// ============================================================================
// Probability Bounds
// ============================================================================

pub fn markovBound(e_x: f64, c: f64) f64 {
    if (c <= 0.0) return 1.0;
    return @min(e_x / c, 1.0);
}

pub fn chebyshevBound(k: f64) f64 {
    if (k <= 0.0) return 1.0;
    return @min(1.0 / (k * k), 1.0);
}

pub fn chebyshevBoundAlt(sigma_sq: f64, c: f64) f64 {
    if (c <= 0.0) return 1.0;
    return @min(sigma_sq / (c * c), 1.0);
}

pub fn chernoffUpperTail(delta: f64, mu: f64) f64 {
    if (delta <= 0.0 or delta >= 1.0) return 1.0;
    return @exp(-delta * delta * mu / 3.0);
}

pub fn chernoffLowerTail(delta: f64, mu: f64) f64 {
    if (delta <= 0.0 or delta >= 1.0) return 1.0;
    return @exp(-delta * delta * mu / 2.0);
}

// ============================================================================
// Random Walks
// ============================================================================

pub fn gamblersRuinFair(n: u64, t: u64) f64 {
    if (t == 0) return 1.0;
    return 1.0 - @as(f64, @floatFromInt(n)) / @as(f64, @floatFromInt(t));
}

pub fn gamblersRuinBiased(n: u64, t: u64, p: f64) f64 {
    if (p == 0.5) return gamblersRuinFair(n, t);
    if (p >= 1.0) return 0.0;
    if (p <= 0.0) return 1.0;

    const q = (1.0 - p) / p;
    const n_f: f64 = @floatFromInt(n);
    const t_f: f64 = @floatFromInt(t);

    const q_n = math.pow(f64, q, n_f);
    const q_t = math.pow(f64, q, t_f);

    if (@abs(q_t - 1.0) < 1e-10) return 1.0 - n_f / t_f;

    return (q_n - q_t) / (1.0 - q_t);
}

// ============================================================================
// Birthday Paradox
// ============================================================================

pub fn birthdayNoCollision(n: u64, d: u64) f64 {
    if (n > d) return 0.0;

    var prob_no_collision: f64 = 1.0;
    const d_f: f64 = @floatFromInt(d);
    var i: u64 = 0;
    while (i < n) : (i += 1) {
        prob_no_collision *= (d_f - @as(f64, @floatFromInt(i))) / d_f;
    }
    return prob_no_collision;
}

pub fn birthdayCollision(n: u64, d: u64) f64 {
    return 1.0 - birthdayNoCollision(n, d);
}

pub fn birthdayCollisionApprox(n: u64, d: u64) f64 {
    const n_f: f64 = @floatFromInt(n);
    const d_f: f64 = @floatFromInt(d);
    return 1.0 - @exp(-n_f * n_f / (2.0 * d_f));
}

pub fn birthday50PercentThreshold(d: u64) u64 {
    const d_f: f64 = @floatFromInt(d);
    return @intFromFloat(@ceil(1.2 * @sqrt(d_f)));
}

// ============================================================================
// Helper Functions
// ============================================================================

fn factorial(n: u64) u64 {
    if (n <= 1) return 1;
    var result: u64 = 1;
    var i: u64 = 2;
    while (i <= n) : (i += 1) {
        result *= i;
    }
    return result;
}

fn binomialCoeff(n: u64, k_in: u64) u64 {
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

// ============================================================================
// Tests
// ============================================================================

test "bernoulli distribution" {
    const b = Bernoulli.init(0.3);
    try std.testing.expectApproxEqAbs(b.prob(0), 0.7, 0.001);
    try std.testing.expectApproxEqAbs(b.prob(1), 0.3, 0.001);
    try std.testing.expectApproxEqAbs(b.expectation(), 0.3, 0.001);
}

test "binomial distribution" {
    const b = Binomial.init(10, 0.5);
    try std.testing.expectApproxEqAbs(b.expectation(), 5.0, 0.001);
    try std.testing.expectApproxEqAbs(b.variance(), 2.5, 0.001);
}

test "geometric distribution" {
    const g = Geometric.init(0.25);
    try std.testing.expectApproxEqAbs(g.expectation(), 4.0, 0.001);
}

test "probability bounds" {
    try std.testing.expectApproxEqAbs(markovBound(10.0, 20.0), 0.5, 0.001);
    try std.testing.expectApproxEqAbs(chebyshevBound(2.0), 0.25, 0.001);
}

test "birthday paradox" {
    try std.testing.expect(birthdayCollision(23, 365) > 0.5);
    try std.testing.expect(birthdayCollision(22, 365) < 0.5);
}

test "bayes theorem" {
    const result = bayesTheorem(0.9, 0.01, 0.05).?;
    try std.testing.expectApproxEqAbs(result, 0.18, 0.01);
}
