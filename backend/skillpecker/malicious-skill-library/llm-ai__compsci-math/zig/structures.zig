//! ============================================================================
//! STRUCTURES.ZIG - CompSci Math Tools: Number Theory and Graphs
//! ============================================================================
//! MIT Mathematics for Computer Science | Chapters 8-12
//! Tool implementations for GCD, primes, modular arithmetic, RSA, and graphs
//! ============================================================================

const std = @import("std");
const math = std.math;
const Allocator = std.mem.Allocator;

// ============================================================================
// Divisibility and GCD
// ============================================================================

pub fn divides(a: i64, b: i64) bool {
    if (a == 0) return b == 0;
    return @mod(b, a) == 0;
}

pub fn gcd(a_in: i64, b_in: i64) i64 {
    var a = if (a_in < 0) -a_in else a_in;
    var b = if (b_in < 0) -b_in else b_in;

    while (b != 0) {
        const temp = b;
        b = @mod(a, b);
        a = temp;
    }
    return a;
}

pub fn lcm(a: i64, b: i64) i64 {
    if (a == 0 or b == 0) return 0;
    const g = gcd(a, b);
    var result = @divTrunc(a, g) * b;
    if (result < 0) result = -result;
    return result;
}

pub const ExtGCDResult = struct {
    gcd_val: i64,
    s: i64,
    t: i64,
};

pub fn extendedGcd(a: i64, b: i64) ExtGCDResult {
    if (b == 0) {
        return .{ .gcd_val = a, .s = 1, .t = 0 };
    }

    var old_r: i64 = a;
    var r: i64 = b;
    var old_s: i64 = 1;
    var s: i64 = 0;
    var old_t: i64 = 0;
    var t: i64 = 1;

    while (r != 0) {
        const q = @divTrunc(old_r, r);
        const temp_r = r;
        r = old_r - q * r;
        old_r = temp_r;

        const temp_s = s;
        s = old_s - q * s;
        old_s = temp_s;

        const temp_t = t;
        t = old_t - q * t;
        old_t = temp_t;
    }

    return .{ .gcd_val = old_r, .s = old_s, .t = old_t };
}

// ============================================================================
// Prime Numbers
// ============================================================================

pub fn isPrime(n: i64) bool {
    if (n < 2) return false;
    if (n == 2) return true;
    if (@mod(n, 2) == 0) return false;

    var i: i64 = 3;
    while (i * i <= n) : (i += 2) {
        if (@mod(n, i) == 0) return false;
    }
    return true;
}

pub fn sieveOfEratosthenes(allocator: Allocator, n: usize) ![]u64 {
    if (n < 2) return &[_]u64{};

    var is_prime_arr = try allocator.alloc(bool, n + 1);
    defer allocator.free(is_prime_arr);

    @memset(is_prime_arr, true);
    is_prime_arr[0] = false;
    is_prime_arr[1] = false;

    var i: usize = 2;
    while (i * i <= n) : (i += 1) {
        if (is_prime_arr[i]) {
            var j = i * i;
            while (j <= n) : (j += i) {
                is_prime_arr[j] = false;
            }
        }
    }

    var count: usize = 0;
    for (is_prime_arr) |p| {
        if (p) count += 1;
    }

    var primes = try allocator.alloc(u64, count);
    var idx: usize = 0;
    for (is_prime_arr, 0..) |p, k| {
        if (p) {
            primes[idx] = @intCast(k);
            idx += 1;
        }
    }

    return primes;
}

pub const PrimeFactor = struct {
    prime: i64,
    exponent: i64,
};

pub fn primeFactorization(allocator: Allocator, n_in: i64) ![]PrimeFactor {
    var factors = std.ArrayList(PrimeFactor).init(allocator);
    errdefer factors.deinit();

    if (n_in <= 1) return factors.toOwnedSlice();

    var n = n_in;
    var d: i64 = 2;

    while (d * d <= n) : (d += 1) {
        var exp: i64 = 0;
        while (@mod(n, d) == 0) {
            exp += 1;
            n = @divTrunc(n, d);
        }
        if (exp > 0) {
            try factors.append(.{ .prime = d, .exponent = exp });
        }
    }

    if (n > 1) {
        try factors.append(.{ .prime = n, .exponent = 1 });
    }

    return factors.toOwnedSlice();
}

// ============================================================================
// Modular Arithmetic
// ============================================================================

pub fn modPos(a: i64, n: i64) i64 {
    var result = @mod(a, n);
    if (result < 0) result += n;
    return result;
}

pub fn modAdd(a: i64, b: i64, n: i64) i64 {
    return modPos(modPos(a, n) + modPos(b, n), n);
}

pub fn modSub(a: i64, b: i64, n: i64) i64 {
    return modPos(modPos(a, n) - modPos(b, n), n);
}

pub fn modMul(a: i64, b: i64, n: i64) i64 {
    return modPos(modPos(a, n) * modPos(b, n), n);
}

pub fn modPow(base_in: i64, exp_in: i64, n: i64) i64 {
    if (n == 1) return 0;

    var result: i64 = 1;
    var base = modPos(base_in, n);
    var exp = exp_in;

    while (exp > 0) {
        if (@mod(exp, 2) == 1) {
            result = modMul(result, base, n);
        }
        exp = @divTrunc(exp, 2);
        base = modMul(base, base, n);
    }

    return result;
}

pub fn modInverse(a: i64, n: i64) ?i64 {
    const ext = extendedGcd(a, n);
    if (ext.gcd_val != 1) return null;
    return modPos(ext.s, n);
}

// ============================================================================
// Euler's Totient
// ============================================================================

pub fn eulerPhi(n: i64) !i64 {
    if (n <= 0) return 0;
    if (n == 1) return 1;

    var result = n;
    const allocator = std.heap.page_allocator;
    const factors = try primeFactorization(allocator, n);
    defer allocator.free(factors);

    for (factors) |f| {
        result = @divTrunc(result, f.prime) * (f.prime - 1);
    }

    return result;
}

pub fn verifyEulerTheorem(a: i64, n: i64) !bool {
    if (gcd(a, n) != 1) return false;
    const phi_n = try eulerPhi(n);
    return modPow(a, phi_n, n) == 1;
}

pub fn verifyFermatLittle(a: i64, p: i64) bool {
    if (!isPrime(p)) return false;
    if (@mod(a, p) == 0) return false;
    return modPow(a, p - 1, p) == 1;
}

// ============================================================================
// RSA Cryptography
// ============================================================================

pub const RSAPublicKey = struct {
    n: i64,
    e: i64,
};

pub const RSAPrivateKey = struct {
    d: i64,
};

pub const RSAKeyPair = struct {
    public_key: RSAPublicKey,
    private_key: RSAPrivateKey,
};

pub fn rsaGenerateKeys(p: i64, q: i64, e: i64) ?RSAKeyPair {
    if (!isPrime(p) or !isPrime(q)) return null;
    if (p == q) return null;

    const n = p * q;
    const phi_n = (p - 1) * (q - 1);

    if (gcd(e, phi_n) != 1) return null;

    const d = modInverse(e, phi_n) orelse return null;

    return .{
        .public_key = .{ .n = n, .e = e },
        .private_key = .{ .d = d },
    };
}

pub fn rsaEncrypt(message: i64, key: RSAPublicKey) i64 {
    return modPow(message, key.e, key.n);
}

pub fn rsaDecrypt(ciphertext: i64, pub_key: RSAPublicKey, priv_key: RSAPrivateKey) i64 {
    return modPow(ciphertext, priv_key.d, pub_key.n);
}

// ============================================================================
// Graphs
// ============================================================================

pub const Graph = struct {
    num_vertices: usize,
    adj_list: []std.ArrayList(usize),
    allocator: Allocator,

    pub fn init(allocator: Allocator, n: usize) !Graph {
        var adj = try allocator.alloc(std.ArrayList(usize), n);
        for (adj) |*list| {
            list.* = std.ArrayList(usize).init(allocator);
        }
        return .{
            .num_vertices = n,
            .adj_list = adj,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Graph) void {
        for (self.adj_list) |*list| {
            list.deinit();
        }
        self.allocator.free(self.adj_list);
    }

    pub fn addEdge(self: *Graph, u: usize, v: usize) !void {
        if (u < self.num_vertices and v < self.num_vertices) {
            if (!self.hasEdge(u, v)) {
                try self.adj_list[u].append(v);
                try self.adj_list[v].append(u);
            }
        }
    }

    pub fn hasEdge(self: Graph, u: usize, v: usize) bool {
        if (u >= self.num_vertices) return false;
        for (self.adj_list[u].items) |w| {
            if (w == v) return true;
        }
        return false;
    }

    pub fn degree(self: Graph, v: usize) usize {
        if (v >= self.num_vertices) return 0;
        return self.adj_list[v].items.len;
    }

    pub fn numEdges(self: Graph) usize {
        var total: usize = 0;
        for (0..self.num_vertices) |v| {
            total += self.degree(v);
        }
        return total / 2;
    }

    pub fn isConnected(self: Graph) !bool {
        if (self.num_vertices == 0) return true;
        const reachable = try self.bfs(0);
        defer self.allocator.free(reachable);
        return reachable.len == self.num_vertices;
    }

    pub fn bfs(self: Graph, start: usize) ![]usize {
        var visited = try self.allocator.alloc(bool, self.num_vertices);
        defer self.allocator.free(visited);
        @memset(visited, false);

        var result = std.ArrayList(usize).init(self.allocator);
        errdefer result.deinit();

        var queue = std.ArrayList(usize).init(self.allocator);
        defer queue.deinit();

        try queue.append(start);
        visited[start] = true;

        while (queue.items.len > 0) {
            const u = queue.orderedRemove(0);
            try result.append(u);

            for (self.adj_list[u].items) |v| {
                if (!visited[v]) {
                    visited[v] = true;
                    try queue.append(v);
                }
            }
        }

        return result.toOwnedSlice();
    }

    pub fn isTree(self: Graph) !bool {
        return try self.isConnected() and self.numEdges() == self.num_vertices - 1;
    }
};

pub fn greedyColoring(allocator: Allocator, graph: Graph) ![]i32 {
    var colors = try allocator.alloc(i32, graph.num_vertices);
    @memset(colors, -1);

    for (0..graph.num_vertices) |v| {
        var used = try allocator.alloc(bool, graph.num_vertices);
        defer allocator.free(used);
        @memset(used, false);

        for (graph.adj_list[v].items) |u| {
            if (colors[u] >= 0) {
                used[@intCast(colors[u])] = true;
            }
        }

        var c: i32 = 0;
        while (c < @as(i32, @intCast(graph.num_vertices)) and used[@intCast(c)]) {
            c += 1;
        }
        colors[v] = c;
    }

    return colors;
}

// ============================================================================
// Tests
// ============================================================================

test "gcd and lcm" {
    try std.testing.expect(gcd(48, 18) == 6);
    try std.testing.expect(lcm(12, 18) == 36);
}

test "extended gcd" {
    const result = extendedGcd(48, 18);
    try std.testing.expect(result.gcd_val == 6);
    try std.testing.expect(result.s * 48 + result.t * 18 == 6);
}

test "is prime" {
    try std.testing.expect(isPrime(17));
    try std.testing.expect(!isPrime(18));
    try std.testing.expect(isPrime(2));
}

test "modular arithmetic" {
    try std.testing.expect(modPow(3, 7, 11) == 9);
    try std.testing.expect(modInverse(3, 11).? == 4);
}

test "rsa" {
    const keys = rsaGenerateKeys(61, 53, 17).?;
    const message: i64 = 42;
    const cipher = rsaEncrypt(message, keys.public_key);
    const decrypted = rsaDecrypt(cipher, keys.public_key, keys.private_key);
    try std.testing.expect(decrypted == message);
}
