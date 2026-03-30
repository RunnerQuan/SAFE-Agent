-- ============================================================================
-- STRUCTURES.CY - CompSci Math Tools: Number Theory and Graphs
-- ============================================================================
-- MIT Mathematics for Computer Science | Chapters 8-12
-- Tool implementations for GCD, primes, modular arithmetic, RSA, and graphs
-- ============================================================================

use math

-- ============================================================================
-- Divisibility and GCD
-- ============================================================================

fn divides(a, b int) -> bool:
    if a == 0:
        return b == 0
    return b % a == 0

fn gcd(a, b int) -> int:
    a_abs := if a < 0: -a else: a
    b_abs := if b < 0: -b else: b
    while b_abs != 0:
        temp := b_abs
        b_abs = a_abs % b_abs
        a_abs = temp
    return a_abs

fn lcm(a, b int) -> int:
    if a == 0 or b == 0:
        return 0
    result := (a / gcd(a, b)) * b
    return if result < 0: -result else: result

type ExtGCDResult:
    gcd int
    s   int
    t   int

fn extended_gcd(a, b int) -> ExtGCDResult:
    if b == 0:
        return ExtGCDResult{gcd=a, s=1, t=0}

    old_r, r := a, b
    old_s, s := 1, 0
    old_t, t := 0, 1

    while r != 0:
        q := old_r / r
        old_r, r = r, old_r - q * r
        old_s, s = s, old_s - q * s
        old_t, t = t, old_t - q * t

    return ExtGCDResult{gcd=old_r, s=old_s, t=old_t}

-- ============================================================================
-- Prime Numbers
-- ============================================================================

fn is_prime(n int) -> bool:
    if n < 2:
        return false
    if n == 2:
        return true
    if n % 2 == 0:
        return false
    i := 3
    while i * i <= n:
        if n % i == 0:
            return false
        i += 2
    return true

fn sieve_of_eratosthenes(n int) -> []int:
    if n < 2:
        return []int{}

    is_prime_arr := []bool{}
    for 0..=n |_|:
        is_prime_arr += true

    is_prime_arr[0] = false
    is_prime_arr[1] = false

    i := 2
    while i * i <= n:
        if is_prime_arr[i]:
            j := i * i
            while j <= n:
                is_prime_arr[j] = false
                j += i
        i += 1

    primes := []int{}
    for 0..=n |k|:
        if is_prime_arr[k]:
            primes += k
    return primes

type PrimeFactor:
    prime    int
    exponent int

fn prime_factorization(n int) -> []PrimeFactor:
    factors := []PrimeFactor{}
    if n <= 1:
        return factors

    d := 2
    while d * d <= n:
        exp := 0
        while n % d == 0:
            exp += 1
            n /= d
        if exp > 0:
            factors += PrimeFactor{prime=d, exponent=exp}
        d += 1

    if n > 1:
        factors += PrimeFactor{prime=n, exponent=1}

    return factors

-- ============================================================================
-- Modular Arithmetic
-- ============================================================================

fn mod_pos(a, n int) -> int:
    result := a % n
    if result < 0:
        result += n
    return result

fn mod_add(a, b, n int) -> int:
    return mod_pos(mod_pos(a, n) + mod_pos(b, n), n)

fn mod_sub(a, b, n int) -> int:
    return mod_pos(mod_pos(a, n) - mod_pos(b, n), n)

fn mod_mul(a, b, n int) -> int:
    return mod_pos(mod_pos(a, n) * mod_pos(b, n), n)

fn mod_pow(base, exp, n int) -> int:
    if n == 1:
        return 0

    result := 1
    base = mod_pos(base, n)

    while exp > 0:
        if exp % 2 == 1:
            result = mod_mul(result, base, n)
        exp /= 2
        base = mod_mul(base, base, n)

    return result

fn mod_inverse(a, n int) -> ?int:
    ext := extended_gcd(a, n)
    if ext.gcd != 1:
        return none
    return mod_pos(ext.s, n)

-- ============================================================================
-- Euler's Totient
-- ============================================================================

fn euler_phi(n int) -> int:
    if n <= 0:
        return 0
    if n == 1:
        return 1

    result := n
    factors := prime_factorization(n)

    for factors |f|:
        result = result / f.prime * (f.prime - 1)

    return result

fn verify_euler_theorem(a, n int) -> bool:
    if gcd(a, n) != 1:
        return false
    phi_n := euler_phi(n)
    return mod_pow(a, phi_n, n) == 1

fn verify_fermat_little(a, p int) -> bool:
    if not is_prime(p):
        return false
    if a % p == 0:
        return false
    return mod_pow(a, p - 1, p) == 1

-- ============================================================================
-- RSA Cryptography
-- ============================================================================

type RSAPublicKey:
    n int
    e int

type RSAPrivateKey:
    d int

type RSAKeyPair:
    public_key  RSAPublicKey
    private_key RSAPrivateKey

fn rsa_generate_keys(p, q, e int) -> ?RSAKeyPair:
    if not is_prime(p) or not is_prime(q):
        return none
    if p == q:
        return none

    n := p * q
    phi_n := (p - 1) * (q - 1)

    if gcd(e, phi_n) != 1:
        return none

    d := mod_inverse(e, phi_n)?

    return RSAKeyPair{
        public_key=RSAPublicKey{n=n, e=e},
        private_key=RSAPrivateKey{d=d}
    }

fn rsa_encrypt(message int, key RSAPublicKey) -> int:
    return mod_pow(message, key.e, key.n)

fn rsa_decrypt(ciphertext int, pub_key RSAPublicKey, priv_key RSAPrivateKey) -> int:
    return mod_pow(ciphertext, priv_key.d, pub_key.n)

-- ============================================================================
-- Graphs
-- ============================================================================

type Graph:
    num_vertices int
    adj_list     [][]int

fn Graph :: @init(n int) -> Self:
    adj := [][]int{}
    for 0..n |_|:
        adj += []int{}
    return Graph{num_vertices=n, adj_list=adj}

fn (&Graph) add_edge(u, v int):
    if u >= 0 and u < self.num_vertices and v >= 0 and v < self.num_vertices:
        if not self.has_edge(u, v):
            self.adj_list[u] += v
            self.adj_list[v] += u

fn (&Graph) has_edge(u, v int) -> bool:
    if u < 0 or u >= self.num_vertices:
        return false
    for self.adj_list[u] |w|:
        if w == v:
            return true
    return false

fn (&Graph) degree(v int) -> int:
    if v < 0 or v >= self.num_vertices:
        return 0
    return self.adj_list[v].len()

fn (&Graph) num_edges() -> int:
    total := 0
    for 0..self.num_vertices |v|:
        total += self.degree(v)
    return total / 2

fn (&Graph) bfs(start int) -> []int:
    visited := []bool{}
    for 0..self.num_vertices |_|:
        visited += false

    result := []int{}
    queue := []int{start}
    visited[start] = true

    while queue.len() > 0:
        u := queue[0]
        queue = queue.remove(0)
        result += u

        for self.adj_list[u] |v|:
            if not visited[v]:
                visited[v] = true
                queue += v

    return result

fn (&Graph) is_connected() -> bool:
    if self.num_vertices == 0:
        return true
    reachable := self.bfs(0)
    return reachable.len() == self.num_vertices

fn (&Graph) is_tree() -> bool:
    return self.is_connected() and self.num_edges() == self.num_vertices - 1

fn (&Graph) greedy_coloring() -> []int:
    colors := []int{}
    for 0..self.num_vertices |_|:
        colors += -1

    for 0..self.num_vertices |v|:
        used := []bool{}
        for 0..self.num_vertices |_|:
            used += false

        for self.adj_list[v] |u|:
            if colors[u] != -1:
                used[colors[u]] = true

        c := 0
        while c < self.num_vertices and used[c]:
            c += 1
        colors[v] = c

    return colors

-- ============================================================================
-- Example Usage
-- ============================================================================

fn main():
    print('=== STRUCTURES.CY ===')

    print('Number Theory:')
    print('  gcd(48, 18) = %{gcd(48, 18)}')
    print('  lcm(12, 18) = %{lcm(12, 18)}')

    ext := extended_gcd(48, 18)
    print('  Extended GCD(48, 18): gcd=%{ext.gcd}, s=%{ext.s}, t=%{ext.t}')

    print('Primes:')
    print('  is_prime(17): %{is_prime(17)}')
    print('  is_prime(18): %{is_prime(18)}')

    print('Modular Arithmetic:')
    print('  3^7 mod 11 = %{mod_pow(3, 7, 11)}')
    inv := mod_inverse(3, 11)
    if inv |v|:
        print('  3^(-1) mod 11 = %{v}')

    print('RSA Encryption:')
    keys := rsa_generate_keys(61, 53, 17)
    if keys |k|:
        msg := 42
        cipher := rsa_encrypt(msg, k.public_key)
        decrypted := rsa_decrypt(cipher, k.public_key, k.private_key)
        print('  Message: %{msg}')
        print('  Encrypted: %{cipher}')
        print('  Decrypted: %{decrypted}')
