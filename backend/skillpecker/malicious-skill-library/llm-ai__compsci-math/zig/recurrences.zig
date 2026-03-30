//! ============================================================================
//! RECURRENCES.ZIG - CompSci Math Tools: Recurrence Relations
//! ============================================================================
//! MIT Mathematics for Computer Science | Chapter 21
//! Tool implementations for Hanoi, Master Theorem, Akra-Bazzi, and linear recurrences
//! ============================================================================

const std = @import("std");
const math = std.math;
const Allocator = std.mem.Allocator;

// ============================================================================
// Towers of Hanoi
// ============================================================================

pub fn hanoiClosed(n: u64) u64 {
    if (n == 0) return 0;
    return (@as(u64, 1) << @intCast(n)) - 1;
}

pub fn hanoiIterative(n: u64) u64 {
    if (n == 0) return 0;
    var t: u64 = 1;
    var i: u64 = 2;
    while (i <= n) : (i += 1) {
        t = 2 * t + 1;
    }
    return t;
}

pub fn verifyHanoi(n: u64) bool {
    return hanoiClosed(n) == hanoiIterative(n);
}

// ============================================================================
// Merge Sort Recurrence
// ============================================================================

pub fn mergeSortComparisons(allocator: Allocator, n: usize) !u64 {
    if (n <= 1) return 0;

    var t = try allocator.alloc(u64, n + 1);
    defer allocator.free(t);

    @memset(t, 0);
    t[1] = 0;

    var size: usize = 2;
    while (size <= n) : (size *= 2) {
        t[size] = 2 * t[size / 2] + @as(u64, @intCast(size)) - 1;
    }

    return t[n];
}

pub fn mergeSortClosed(n: u64) u64 {
    if (n <= 1) return 0;
    const nf: f64 = @floatFromInt(n);
    const log_n = @log2(nf);
    return @intFromFloat(@round(nf * log_n - nf + 1.0));
}

// ============================================================================
// Linear Recurrence
// ============================================================================

pub const LinearRecurrence = struct {
    coefficients: []const f64,
    initial_values: []const f64,

    pub fn init(coeffs: []const f64, initial: []const f64) LinearRecurrence {
        return .{ .coefficients = coeffs, .initial_values = initial };
    }

    pub fn order(self: LinearRecurrence) usize {
        return self.coefficients.len;
    }

    pub fn eval(self: LinearRecurrence, allocator: Allocator, n: usize) !f64 {
        const k = self.order();

        if (n < k) return self.initial_values[n];

        var values = try allocator.alloc(f64, k);
        defer allocator.free(values);

        for (values, self.initial_values) |*v, iv| {
            v.* = iv;
        }

        var i: usize = k;
        while (i <= n) : (i += 1) {
            var new_val: f64 = 0.0;
            for (0..k) |j| {
                new_val += self.coefficients[j] * values[k - 1 - j];
            }

            for (0..(k - 1)) |j| {
                values[j] = values[j + 1];
            }
            values[k - 1] = new_val;
        }

        return values[k - 1];
    }
};

// ============================================================================
// Fibonacci
// ============================================================================

pub const PHI: f64 = 1.6180339887498949;
pub const PSI: f64 = -0.6180339887498949;
pub const SQRT5: f64 = 2.2360679774997896;

pub fn fibonacciBinet(n: u64) u64 {
    const nf: f64 = @floatFromInt(n);
    const result = (math.pow(f64, PHI, nf) - math.pow(f64, PSI, nf)) / SQRT5;
    return @intFromFloat(@round(result));
}

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

// ============================================================================
// Characteristic Roots
// ============================================================================

pub const CharacteristicRoots = union(enum) {
    distinct: struct { r1: f64, r2: f64 },
    repeated: f64,
    complex: struct { real: f64, imag: f64 },
};

pub fn solveCharacteristic(a: f64, b: f64) CharacteristicRoots {
    const discriminant = a * a + 4.0 * b;

    if (discriminant > 0.0001) {
        const sqrt_d = @sqrt(discriminant);
        return .{ .distinct = .{
            .r1 = (a + sqrt_d) / 2.0,
            .r2 = (a - sqrt_d) / 2.0,
        } };
    } else if (discriminant < -0.0001) {
        return .{ .complex = .{
            .real = a / 2.0,
            .imag = @sqrt(-discriminant) / 2.0,
        } };
    } else {
        return .{ .repeated = a / 2.0 };
    }
}

pub fn evalSecondOrder(a: f64, b: f64, t0: f64, t1: f64, n: u64) f64 {
    if (n == 0) return t0;
    if (n == 1) return t1;

    const roots = solveCharacteristic(a, b);
    const nf: f64 = @floatFromInt(n);

    switch (roots) {
        .distinct => |d| {
            const c2 = (t1 - t0 * d.r1) / (d.r2 - d.r1);
            const c1 = t0 - c2;
            return c1 * math.pow(f64, d.r1, nf) + c2 * math.pow(f64, d.r2, nf);
        },
        .repeated => |r| {
            const c1 = t0;
            const c2 = (t1 - t0 * r) / r;
            return (c1 + c2 * nf) * math.pow(f64, r, nf);
        },
        .complex => {
            var prev2 = t0;
            var prev1 = t1;
            var i: u64 = 2;
            while (i <= n) : (i += 1) {
                const curr = a * prev1 + b * prev2;
                prev2 = prev1;
                prev1 = curr;
            }
            return prev1;
        },
    }
}

// ============================================================================
// Master Theorem
// ============================================================================

pub const MasterCase = enum {
    one,
    two,
    three,
};

pub const MasterTheorem = struct {
    a: u64,
    b: u64,
    d: f64,

    pub fn init(a: u64, b: u64, d: f64) MasterTheorem {
        return .{ .a = a, .b = b, .d = d };
    }

    pub fn criticalExponent(self: MasterTheorem) f64 {
        const a_f: f64 = @floatFromInt(self.a);
        const b_f: f64 = @floatFromInt(self.b);
        return @log(a_f) / @log(b_f);
    }

    pub fn classify(self: MasterTheorem) MasterCase {
        const c = self.criticalExponent();

        if (self.d < c - 0.0001) return .one;
        if (self.d > c + 0.0001) return .three;
        return .two;
    }
};

pub fn masterBinarySearch() MasterTheorem {
    return MasterTheorem.init(1, 2, 0.0);
}

pub fn masterMergeSort() MasterTheorem {
    return MasterTheorem.init(2, 2, 1.0);
}

pub fn masterKaratsuba() MasterTheorem {
    return MasterTheorem.init(3, 2, 1.0);
}

pub fn masterStrassen() MasterTheorem {
    return MasterTheorem.init(7, 2, 2.0);
}

// ============================================================================
// Akra-Bazzi Method
// ============================================================================

pub const AkraBazziTerm = struct {
    a: f64,
    b: f64,
};

pub const AkraBazzi = struct {
    terms: std.ArrayList(AkraBazziTerm),

    pub fn init(allocator: Allocator) AkraBazzi {
        return .{ .terms = std.ArrayList(AkraBazziTerm).init(allocator) };
    }

    pub fn deinit(self: *AkraBazzi) void {
        self.terms.deinit();
    }

    pub fn addTerm(self: *AkraBazzi, a: f64, b: f64) !void {
        try self.terms.append(.{ .a = a, .b = b });
    }

    pub fn sumAtP(self: AkraBazzi, p: f64) f64 {
        var result: f64 = 0.0;
        for (self.terms.items) |term| {
            result += term.a / math.pow(f64, term.b, p);
        }
        return result;
    }

    pub fn findP(self: AkraBazzi) f64 {
        if (self.terms.items.len == 0) return 0.0;

        var lo: f64 = -10.0;
        var hi: f64 = 10.0;

        for (0..100) |_| {
            const mid = (lo + hi) / 2.0;
            const sum = self.sumAtP(mid);

            if (@abs(sum - 1.0) < 0.0000001) return mid;

            if (sum > 1.0) {
                lo = mid;
            } else {
                hi = mid;
            }
        }

        return (lo + hi) / 2.0;
    }
};

// ============================================================================
// Common Recurrence Patterns
// ============================================================================

pub fn recurrenceLinear(n: u64) u64 {
    return n;
}

pub fn recurrenceQuadratic(n: u64) u64 {
    return n * (n + 1) / 2;
}

pub fn recurrenceExponential(n: u64) u64 {
    return @as(u64, 1) << @intCast(n);
}

pub fn recurrenceLogarithmic(n: u64) u64 {
    if (n <= 1) return 0;
    var count: u64 = 0;
    var m = n;
    while (m > 1) {
        m /= 2;
        count += 1;
    }
    return count;
}

// ============================================================================
// Non-Homogeneous Recurrence
// ============================================================================

pub fn evalNonHomogeneous(
    a: f64,
    f: *const fn (u64) f64,
    t0: f64,
    n: u64,
) f64 {
    if (n == 0) return t0;

    var t = t0;
    var i: u64 = 1;
    while (i <= n) : (i += 1) {
        t = a * t + f(i);
    }
    return t;
}

// ============================================================================
// Recurrence Verification
// ============================================================================

pub fn verifyRecurrence(
    recurrence: *const fn (u64) u64,
    closedForm: *const fn (u64) u64,
    start: u64,
    end: u64,
) bool {
    var n = start;
    while (n <= end) : (n += 1) {
        if (recurrence(n) != closedForm(n)) return false;
    }
    return true;
}

// ============================================================================
// Tests
// ============================================================================

test "towers of hanoi" {
    try std.testing.expect(hanoiClosed(1) == 1);
    try std.testing.expect(hanoiClosed(3) == 7);
    try std.testing.expect(hanoiClosed(10) == 1023);
    try std.testing.expect(verifyHanoi(10));
}

test "fibonacci" {
    try std.testing.expect(fibonacci(0) == 0);
    try std.testing.expect(fibonacci(1) == 1);
    try std.testing.expect(fibonacci(10) == 55);
    try std.testing.expect(fibonacciBinet(10) == 55);
}

test "master theorem classification" {
    const binary = masterBinarySearch();
    try std.testing.expect(binary.classify() == .two);

    const merge = masterMergeSort();
    try std.testing.expect(merge.classify() == .two);

    const karatsuba = masterKaratsuba();
    try std.testing.expect(karatsuba.classify() == .one);
}

test "common recurrences" {
    try std.testing.expect(recurrenceLinear(100) == 100);
    try std.testing.expect(recurrenceQuadratic(10) == 55);
    try std.testing.expect(recurrenceExponential(10) == 1024);
    try std.testing.expect(recurrenceLogarithmic(16) == 4);
}

test "characteristic roots" {
    const fib_roots = solveCharacteristic(1.0, 1.0);
    switch (fib_roots) {
        .distinct => |d| {
            try std.testing.expectApproxEqAbs(d.r1, PHI, 0.001);
            try std.testing.expectApproxEqAbs(d.r2, PSI, 0.001);
        },
        else => try std.testing.expect(false),
    }
}

test "akra-bazzi" {
    const allocator = std.testing.allocator;
    var ab = AkraBazzi.init(allocator);
    defer ab.deinit();

    try ab.addTerm(1.0, 2.0);
    try ab.addTerm(1.0, 3.0);

    const p = ab.findP();
    const sum = ab.sumAtP(p);
    try std.testing.expectApproxEqAbs(sum, 1.0, 0.001);
}
