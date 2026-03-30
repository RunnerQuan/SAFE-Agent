# MATH_STRUCTURES - Part II: Structures

**Source**: MIT Mathematics for Computer Science (Lehman, Leighton, Meyer)  
**Chapters**: 8-12 | Number Theory, Directed Graphs, Partial Orders, Networks, Simple Graphs, Planar Graphs

---

## Overview

Mathematical structures provide the foundational frameworks for organizing data, modeling relationships, and designing algorithms. This module covers number theory (encryption, divisibility), graph theory (networks, routing), and relational structures (ordering, equivalence).

---

## 1. Number Theory

### 1.1 Divisibility

**Definition**: a divides b (written a | b) iff b = ka for some integer k.

**Properties**:
```
a | b and b | c  →  a | c     (transitivity)
a | b and a | c  →  a | (b + c)
a | b            →  a | bc
```

### 1.2 Greatest Common Divisor (GCD)

**Definition**: gcd(a, b) is the largest integer dividing both a and b.

**Euclidean Algorithm**:
```
gcd(a, b) = gcd(b, a mod b)    when b ≠ 0
gcd(a, 0) = a

Example: gcd(102, 70)
  gcd(102, 70) = gcd(70, 32)
               = gcd(32, 6)
               = gcd(6, 2)
               = gcd(2, 0)
               = 2
```

**Bézout's Identity**: For any integers a, b, there exist integers s, t such that:
```
gcd(a, b) = sa + tb
```

**Extended Euclidean Algorithm** computes s and t along with gcd(a, b).

### 1.3 Prime Numbers

**Definition**: A prime p > 1 has only divisors 1 and p.

**Fundamental Theorem of Arithmetic**: Every integer n > 1 has a unique prime factorization:
```
n = p₁^e₁ · p₂^e₂ · ... · pₖ^eₖ
```

**Prime Number Theorem**: π(n) ~ n / ln(n), where π(n) counts primes ≤ n.

### 1.4 Modular Arithmetic

**Definition**: a ≡ b (mod n) iff n | (a - b)

**Properties** (in ℤₙ):
```
(a + b) mod n = ((a mod n) + (b mod n)) mod n
(a · b) mod n = ((a mod n) · (b mod n)) mod n
aᵏ mod n     = (a mod n)ᵏ mod n
```

### 1.5 Euler's Theorem

**Euler's Totient Function**: φ(n) = count of integers in {1, ..., n} coprime to n.

**Formulas**:
```
φ(p)   = p - 1                    (p prime)
φ(pᵏ)  = pᵏ - pᵏ⁻¹               (p prime)
φ(mn)  = φ(m)φ(n)                 (when gcd(m,n) = 1)
```

**Euler's Theorem**: If gcd(a, n) = 1, then:
```
a^φ(n) ≡ 1 (mod n)
```

**Fermat's Little Theorem** (special case): If p is prime and gcd(a, p) = 1:
```
aᵖ⁻¹ ≡ 1 (mod p)
```

### 1.6 RSA Encryption

**Key Generation**:
1. Choose large primes p, q
2. Compute n = pq
3. Compute φ(n) = (p-1)(q-1)
4. Choose e with gcd(e, φ(n)) = 1
5. Compute d ≡ e⁻¹ (mod φ(n))
6. Public key: (n, e), Private key: d

**Encryption/Decryption**:
```
Encrypt: c = mᵉ mod n
Decrypt: m = cᵈ mod n
```

---

## 2. Directed Graphs (Digraphs)

### 2.1 Definitions

**Directed Graph**: G = (V, E) where E ⊆ V × V

**Terminology**:
- **In-degree**: Number of edges entering a vertex
- **Out-degree**: Number of edges leaving a vertex
- **Walk**: Sequence of vertices v₀, v₁, ..., vₖ with edges (vᵢ, vᵢ₊₁)
- **Path**: Walk with no repeated vertices
- **Cycle**: Walk with v₀ = vₖ and no other repeats

### 2.2 Adjacency Matrix

For graph G with n vertices:
```
A[i,j] = 1  if edge (i,j) exists
A[i,j] = 0  otherwise

Aᵏ[i,j] = number of walks of length k from i to j
```

### 2.3 Walk Relations

**Positive Walk Relation**: G⁺ where (u,v) ∈ G⁺ iff there's a positive-length walk from u to v.

**Reflexive Walk Relation**: G* = G⁺ ∪ {(v,v) : v ∈ V}

---

## 3. Directed Acyclic Graphs (DAGs)

### 3.1 Definition

A **DAG** is a directed graph with no directed cycles.

### 3.2 Topological Ordering

A **topological sort** arranges vertices v₁, v₂, ..., vₙ such that:
```
For every edge (vᵢ, vⱼ): i < j
```

**Theorem**: A directed graph has a topological ordering iff it is a DAG.

### 3.3 Scheduling

**Critical Path Method**: For task scheduling with dependencies:
- Model as DAG where edge (u,v) means "u must precede v"
- Longest path = minimum completion time

---

## 4. Partial Orders

### 4.1 Definitions

A **partial order** (poset) is a binary relation R that is:
- **Reflexive**: a R a
- **Antisymmetric**: a R b ∧ b R a → a = b
- **Transitive**: a R b ∧ b R c → a R c

**Examples**: ≤ on integers, ⊆ on sets, divides on positive integers

### 4.2 Terminology

- **Comparable**: a and b are comparable if a R b or b R a
- **Chain**: Totally ordered subset (all pairs comparable)
- **Antichain**: Subset with no comparable pairs
- **Minimal/Maximal**: No smaller/larger elements in the order

### 4.3 Linear Extensions

A **linear order** (total order) is a partial order where all elements are comparable.

A **linear extension** of a partial order P is a total order consistent with P.

**Dilworth's Theorem**: In any partial order, the minimum number of chains needed to cover all elements equals the maximum antichain size.

---

## 5. Simple Graphs

### 5.1 Definitions

**Simple Graph**: G = (V, E) where E contains unordered pairs of distinct vertices.

**Terminology**:
- **Degree**: deg(v) = number of edges incident to v
- **Neighbor**: u is a neighbor of v if {u,v} ∈ E
- **Complete Graph**: Kₙ has all possible edges
- **Bipartite**: V = L ∪ R with all edges between L and R

### 5.2 Handshaking Lemma

```
Σᵥ deg(v) = 2|E|
```

The sum of all degrees equals twice the number of edges.

**Corollary**: The number of odd-degree vertices is even.

### 5.3 Graph Isomorphism

Graphs G₁ = (V₁, E₁) and G₂ = (V₂, E₂) are **isomorphic** if there exists a bijection f: V₁ → V₂ such that:
```
{u, v} ∈ E₁  iff  {f(u), f(v)} ∈ E₂
```

### 5.4 Connectivity

- **Connected**: Path exists between any two vertices
- **Connected Component**: Maximal connected subgraph
- **Cut Vertex**: Removal disconnects the graph
- **Cut Edge (Bridge)**: Removal disconnects the graph

### 5.5 Bipartite Graphs

**Theorem**: A graph is bipartite iff it contains no odd-length cycles.

### 5.6 Matchings

A **matching** M is a set of edges with no shared vertices.

A **perfect matching** covers all vertices.

**Hall's Theorem**: A bipartite graph G = (L ∪ R, E) has a matching covering L iff:
```
For all S ⊆ L: |N(S)| ≥ |S|
```
where N(S) is the set of neighbors of S.

### 5.7 Graph Coloring

A **k-coloring** assigns colors 1, ..., k to vertices so adjacent vertices have different colors.

**Chromatic Number**: χ(G) = minimum k for which G is k-colorable.

**Bounds**:
```
χ(G) ≥ ω(G)           (clique number)
χ(G) ≤ Δ(G) + 1       (max degree bound)
```

---

## 6. Trees

### 6.1 Definitions

A **tree** is a connected acyclic graph.

**Equivalent characterizations** for a graph G with n vertices:
- G is connected and has n-1 edges
- G is acyclic and has n-1 edges
- G is connected, and removing any edge disconnects it
- G is acyclic, and adding any edge creates a cycle
- There is a unique path between any two vertices

### 6.2 Spanning Trees

A **spanning tree** of G is a subgraph that is a tree containing all vertices.

**Theorem**: Every connected graph has a spanning tree.

---

## 7. Planar Graphs

### 7.1 Definition

A graph is **planar** if it can be drawn in the plane with no edge crossings.

### 7.2 Euler's Formula

For a connected planar graph with v vertices, e edges, and f faces:
```
v - e + f = 2
```

### 7.3 Bounds on Planar Graphs

For a connected planar graph with v ≥ 3:
```
e ≤ 3v - 6
```

If additionally the graph has no triangles:
```
e ≤ 2v - 4
```

### 7.4 Non-Planar Graphs

**Kuratowski's Theorem**: G is planar iff it contains no subdivision of K₅ or K₃,₃.

**Corollary**: K₅ and K₃,₃ are not planar.

### 7.5 Graph Coloring for Planar Graphs

**Four Color Theorem**: Every planar graph is 4-colorable.

**Five Color Theorem**: Every planar graph is 5-colorable (easier proof).

---

## 8. Communication Networks

### 8.1 Network Metrics

- **Diameter**: Maximum shortest path between any two nodes
- **Congestion**: Maximum edge load under routing scheme
- **Switch Count**: Number of internal nodes
- **Latency**: Time for a message to traverse the network

### 8.2 Network Topologies

**Complete Binary Tree**:
- Depth d: 2^(d+1) - 1 nodes
- Diameter: 2d

**2-D Array** (n × n):
- n² nodes, 2n(n-1) edges
- Diameter: 2(n-1)

**Butterfly Network**:
- (n+1)2ⁿ nodes for n inputs
- Diameter: 2n
- Excellent for permutation routing

**Beneš Network**:
- Back-to-back butterfly networks
- Can route any permutation without congestion

---

## Implementation Notes

The companion `.cy` and `.zig` files implement:
- GCD and Extended Euclidean Algorithm
- Modular arithmetic operations
- RSA key generation and encryption
- Graph representations (adjacency list, matrix)
- Topological sort for DAGs
- Matching algorithms
- Graph coloring heuristics
- Planarity testing

---

## References

- Chapters 8-12 of "Mathematics for Computer Science" by Lehman, Leighton, Meyer (MIT OpenCourseWare)
- Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License
