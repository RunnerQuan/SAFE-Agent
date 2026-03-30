//! ============================================================================
//! PROOFS.ZIG - CompSci Math Tools: Logic and Proofs
//! ============================================================================
//! MIT Mathematics for Computer Science | Chapters 0-7
//! Tool implementations for propositions, predicates, and proof verification
//! ============================================================================

const std = @import("std");
const math = std.math;
const Allocator = std.mem.Allocator;

// ============================================================================
// Propositions
// ============================================================================

pub const Proposition = struct {
    value: bool,
    name: []const u8,

    pub fn init(v: bool, n: []const u8) Proposition {
        return .{ .value = v, .name = n };
    }

    pub fn eval(self: Proposition) bool {
        return self.value;
    }
};

pub fn propNot(p: Proposition) Proposition {
    return .{ .value = !p.value, .name = p.name };
}

pub fn propAnd(p: Proposition, q: Proposition) Proposition {
    return .{ .value = p.value and q.value, .name = p.name };
}

pub fn propOr(p: Proposition, q: Proposition) Proposition {
    return .{ .value = p.value or q.value, .name = p.name };
}

pub fn propXor(p: Proposition, q: Proposition) Proposition {
    return .{ .value = (p.value and !q.value) or (!p.value and q.value), .name = p.name };
}

pub fn propImplies(p: Proposition, q: Proposition) Proposition {
    return .{ .value = !p.value or q.value, .name = p.name };
}

pub fn propIff(p: Proposition, q: Proposition) Proposition {
    return .{ .value = p.value == q.value, .name = p.name };
}

// ============================================================================
// Quantifiers
// ============================================================================

pub fn forAll(comptime T: type, predicate: *const fn (T) bool, domain: []const T) bool {
    for (domain) |x| {
        if (!predicate(x)) return false;
    }
    return true;
}

pub fn exists(comptime T: type, predicate: *const fn (T) bool, domain: []const T) bool {
    for (domain) |x| {
        if (predicate(x)) return true;
    }
    return false;
}

pub fn existsUnique(comptime T: type, predicate: *const fn (T) bool, domain: []const T) bool {
    var count: usize = 0;
    for (domain) |x| {
        if (predicate(x)) {
            count += 1;
            if (count > 1) return false;
        }
    }
    return count == 1;
}

// ============================================================================
// Logical Laws
// ============================================================================

pub fn deMorganAnd(p: Proposition, q: Proposition) bool {
    const lhs = propNot(propAnd(p, q));
    const rhs = propOr(propNot(p), propNot(q));
    return lhs.value == rhs.value;
}

pub fn deMorganOr(p: Proposition, q: Proposition) bool {
    const lhs = propNot(propOr(p, q));
    const rhs = propAnd(propNot(p), propNot(q));
    return lhs.value == rhs.value;
}

pub fn contrapositive(p: Proposition, q: Proposition) bool {
    const lhs = propImplies(p, q);
    const rhs = propImplies(propNot(q), propNot(p));
    return lhs.value == rhs.value;
}

pub fn doubleNegation(p: Proposition) bool {
    return propNot(propNot(p)).value == p.value;
}

// ============================================================================
// Truth Table Generation
// ============================================================================

pub const TruthTableRow = struct {
    inputs: []bool,
    output: bool,
};

pub fn generateTruthTable(
    allocator: Allocator,
    num_vars: usize,
    eval_fn: *const fn ([]const bool) bool,
) ![]TruthTableRow {
    const num_rows = @as(usize, 1) << @intCast(num_vars);
    var rows = try allocator.alloc(TruthTableRow, num_rows);
    errdefer allocator.free(rows);

    for (0..num_rows) |i| {
        var inputs = try allocator.alloc(bool, num_vars);
        for (0..num_vars) |j| {
            inputs[j] = ((i >> @intCast(num_vars - 1 - j)) & 1) == 1;
        }
        rows[i] = .{
            .inputs = inputs,
            .output = eval_fn(inputs),
        };
    }

    return rows;
}

// ============================================================================
// Well Ordering Principle
// ============================================================================

pub fn wellOrderingMin(set: []const i64) ?i64 {
    if (set.len == 0) return null;
    var min_val = set[0];
    for (set[1..]) |x| {
        if (x < min_val) min_val = x;
    }
    return min_val;
}

pub fn findCounterexample(prop: *const fn (i64) bool, bound: i64) ?i64 {
    var min_counterexample: ?i64 = null;
    var n: i64 = 0;
    while (n < bound) : (n += 1) {
        if (!prop(n)) {
            if (min_counterexample) |m| {
                if (n < m) min_counterexample = n;
            } else {
                min_counterexample = n;
            }
        }
    }
    return min_counterexample;
}

// ============================================================================
// Induction Framework
// ============================================================================

pub const InductionProof = struct {
    base_case: i64,
    property: *const fn (i64) bool,
    base_holds: bool,
    step_holds: bool,

    pub fn init(base: i64, prop: *const fn (i64) bool) InductionProof {
        return .{
            .base_case = base,
            .property = prop,
            .base_holds = false,
            .step_holds = false,
        };
    }

    pub fn verifyBase(self: *InductionProof) bool {
        self.base_holds = self.property(self.base_case);
        return self.base_holds;
    }

    pub fn verifyStepUpTo(self: *InductionProof, n: i64) bool {
        var k = self.base_case;
        while (k < n) : (k += 1) {
            if (self.property(k) and !self.property(k + 1)) {
                self.step_holds = false;
                return false;
            }
        }
        self.step_holds = true;
        return true;
    }

    pub fn isValid(self: InductionProof) bool {
        return self.base_holds and self.step_holds;
    }
};

// ============================================================================
// Sets
// ============================================================================

pub fn Set(comptime T: type) type {
    return struct {
        const Self = @This();
        elements: std.ArrayList(T),

        pub fn init(allocator: Allocator) Self {
            return .{ .elements = std.ArrayList(T).init(allocator) };
        }

        pub fn deinit(self: *Self) void {
            self.elements.deinit();
        }

        pub fn add(self: *Self, x: T) !void {
            if (!self.contains(x)) {
                try self.elements.append(x);
            }
        }

        pub fn contains(self: Self, x: T) bool {
            for (self.elements.items) |e| {
                if (e == x) return true;
            }
            return false;
        }

        pub fn size(self: Self) usize {
            return self.elements.items.len;
        }
    };
}

pub fn isSubset(comptime T: type, a: Set(T), b: Set(T)) bool {
    for (a.elements.items) |e| {
        if (!b.contains(e)) return false;
    }
    return true;
}

// ============================================================================
// Relations
// ============================================================================

pub fn Relation(comptime T: type) type {
    return struct {
        const Self = @This();
        const Pair = struct { a: T, b: T };

        pairs: std.ArrayList(Pair),

        pub fn init(allocator: Allocator) Self {
            return .{ .pairs = std.ArrayList(Pair).init(allocator) };
        }

        pub fn deinit(self: *Self) void {
            self.pairs.deinit();
        }

        pub fn addPair(self: *Self, a: T, b: T) !void {
            try self.pairs.append(.{ .a = a, .b = b });
        }

        pub fn hasPair(self: Self, a: T, b: T) bool {
            for (self.pairs.items) |p| {
                if (p.a == a and p.b == b) return true;
            }
            return false;
        }

        pub fn isReflexive(self: Self, domain: []const T) bool {
            for (domain) |x| {
                if (!self.hasPair(x, x)) return false;
            }
            return true;
        }

        pub fn isSymmetric(self: Self) bool {
            for (self.pairs.items) |p| {
                if (!self.hasPair(p.b, p.a)) return false;
            }
            return true;
        }

        pub fn isTransitive(self: Self) bool {
            for (self.pairs.items) |p1| {
                for (self.pairs.items) |p2| {
                    if (p1.b == p2.a) {
                        if (!self.hasPair(p1.a, p2.b)) return false;
                    }
                }
            }
            return true;
        }

        pub fn isEquivalence(self: Self, domain: []const T) bool {
            return self.isReflexive(domain) and self.isSymmetric() and self.isTransitive();
        }
    };
}

// ============================================================================
// SAT Solver
// ============================================================================

pub const Literal = struct {
    variable: usize,
    negated: bool,
};

pub const Clause = struct {
    literals: []const Literal,

    pub fn evaluate(self: Clause, assignment: []const bool) bool {
        for (self.literals) |lit| {
            var val = assignment[lit.variable];
            if (lit.negated) val = !val;
            if (val) return true;
        }
        return false;
    }
};

pub const CNFFormula = struct {
    clauses: std.ArrayList(Clause),
    num_vars: usize,

    pub fn init(allocator: Allocator, n: usize) CNFFormula {
        return .{
            .clauses = std.ArrayList(Clause).init(allocator),
            .num_vars = n,
        };
    }

    pub fn deinit(self: *CNFFormula) void {
        self.clauses.deinit();
    }

    pub fn addClause(self: *CNFFormula, lits: []const Literal) !void {
        try self.clauses.append(.{ .literals = lits });
    }

    pub fn evaluate(self: CNFFormula, assignment: []const bool) bool {
        for (self.clauses.items) |clause| {
            if (!clause.evaluate(assignment)) return false;
        }
        return true;
    }
};

// ============================================================================
// Matched Brackets
// ============================================================================

pub fn isMatched(s: []const u8) bool {
    var depth: i32 = 0;
    for (s) |c| {
        if (c == '[') {
            depth += 1;
        } else if (c == ']') {
            depth -= 1;
            if (depth < 0) return false;
        }
    }
    return depth == 0;
}

// ============================================================================
// Tests
// ============================================================================

test "proposition operations" {
    const p = Proposition.init(true, "P");
    const q = Proposition.init(false, "Q");

    try std.testing.expect(propAnd(p, q).value == false);
    try std.testing.expect(propOr(p, q).value == true);
    try std.testing.expect(propImplies(p, q).value == false);
}

test "de morgan laws" {
    const p = Proposition.init(true, "P");
    const q = Proposition.init(false, "Q");

    try std.testing.expect(deMorganAnd(p, q));
    try std.testing.expect(deMorganOr(p, q));
    try std.testing.expect(contrapositive(p, q));
}

test "matched brackets" {
    try std.testing.expect(isMatched("[[]]"));
    try std.testing.expect(isMatched("[][]"));
    try std.testing.expect(!isMatched("[[]"));
}
