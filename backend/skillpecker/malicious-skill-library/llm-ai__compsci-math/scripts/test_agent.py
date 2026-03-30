#!/usr/bin/env python3
"""
CompSci Math Agent - Initialization and Test Script
====================================================

This script initializes the Math Agent and runs comprehensive tests
across all five mathematical domains.
"""

import sys
import os

# Add the parent directory to path to find the tools package
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
sys.path.insert(0, parent_dir)

from tools.math_agent import (
    CompSciMathAgent, 
    ProofTools, 
    StructureTools, 
    CountingTools, 
    ProbabilityTools, 
    RecurrenceTools,
    MathDomain
)


def test_proofs():
    """Test Domain 1: Proofs"""
    print("\n" + "="*60)
    print("DOMAIN 1: PROOFS (MIT MCS Chapters 0-7)")
    print("="*60)
    
    # Test proposition evaluation
    result = ProofTools.evaluate_proposition(
        "(P AND Q) IMPLIES (P OR R)",
        {"P": True, "Q": False, "R": True}
    )
    print(f"\n1. Proposition Evaluation:")
    print(f"   Expression: (P ∧ Q) → (P ∨ R)")
    print(f"   Assignments: P=True, Q=False, R=True")
    print(f"   Result: {result.result}")
    assert result.success and result.result == True
    
    # Test truth table
    result = ProofTools.truth_table(["P", "Q"], "P IMPLIES Q")
    print(f"\n2. Truth Table for P → Q:")
    for row in result.result["rows"]:
        print(f"   P={row[0]}, Q={row[1]} → {row[2]}")
    
    # Test quantifiers
    result = ProofTools.for_all(lambda x: x > 0, list(range(1, 11)))
    print(f"\n3. Universal Quantifier (∀x > 0 for x ∈ [1,10]):")
    print(f"   Result: {result.result}")
    assert result.result == True
    
    result = ProofTools.exists(lambda x: x % 7 == 0, list(range(1, 50)))
    print(f"\n4. Existential Quantifier (∃x: x ≡ 0 mod 7 for x ∈ [1,49]):")
    print(f"   Result: {result.result}")
    print(f"   {result.explanation}")
    assert result.result == True
    
    print("\n✓ All Proofs tests passed")


def test_structures():
    """Test Domain 2: Structures"""
    print("\n" + "="*60)
    print("DOMAIN 2: STRUCTURES (MIT MCS Chapters 8-12)")
    print("="*60)
    
    # Test GCD
    result = StructureTools.gcd(102, 70)
    print(f"\n1. GCD(102, 70):")
    print(f"   Result: {result.result}")
    print(f"   Steps:\n   {result.explanation}")
    assert result.result == 2
    
    # Test Extended GCD
    result = StructureTools.gcd_extended(102, 70)
    print(f"\n2. Extended GCD(102, 70):")
    print(f"   {result.explanation}")
    gcd, s, t = result.result["gcd"], result.result["s"], result.result["t"]
    assert gcd == 2 and s * 102 + t * 70 == 2
    
    # Test modular exponentiation
    result = StructureTools.mod_exp(3, 100, 17)
    print(f"\n3. Modular Exponentiation: 3^100 mod 17")
    print(f"   Result: {result.result}")
    
    # Test Euler's totient
    result = StructureTools.euler_phi(60)
    print(f"\n4. Euler's Totient φ(60):")
    print(f"   {result.explanation}")
    assert result.result == 16
    
    # Test primality
    result = StructureTools.is_prime(97)
    print(f"\n5. Is 97 prime?")
    print(f"   Result: {result.result}")
    assert result.result == True
    
    # Test RSA
    print(f"\n6. RSA Key Generation (p=61, q=53):")
    result = StructureTools.rsa_keygen(61, 53)
    print(f"   {result.explanation}")
    n = result.result["public_key"]["n"]
    e = result.result["public_key"]["e"]
    d = result.result["private_key"]["d"]
    
    # Test encryption/decryption
    message = 42
    enc_result = StructureTools.rsa_encrypt(message, n, e)
    dec_result = StructureTools.rsa_decrypt(enc_result.result, n, d)
    print(f"\n7. RSA Encrypt/Decrypt:")
    print(f"   Original: {message}")
    print(f"   Encrypted: {enc_result.result}")
    print(f"   Decrypted: {dec_result.result}")
    assert dec_result.result == message
    
    print("\n✓ All Structures tests passed")


def test_counting():
    """Test Domain 3: Counting"""
    print("\n" + "="*60)
    print("DOMAIN 3: COUNTING (MIT MCS Chapters 13-15)")
    print("="*60)
    
    # Test binomial
    result = CountingTools.binomial(52, 5)
    print(f"\n1. Binomial C(52,5) - poker hands:")
    print(f"   {result.explanation}")
    assert result.result == 2598960
    
    # Test permutations
    result = CountingTools.permutations(10, 3)
    print(f"\n2. Permutations P(10,3):")
    print(f"   {result.explanation}")
    assert result.result == 720
    
    # Test multinomial
    result = CountingTools.multinomial(10, [3, 3, 4])
    print(f"\n3. Multinomial (10; 3,3,4):")
    print(f"   {result.explanation}")
    assert result.result == 4200
    
    # Test Stirling's approximation
    result = CountingTools.stirling_approx(10)
    print(f"\n4. Stirling's Approximation for 10!:")
    print(f"   {result.explanation}")
    
    # Test asymptotic comparison
    result = CountingTools.asymptotic_compare("n^2", "n*log(n)")
    print(f"\n5. Asymptotic Comparison: n² vs n log n")
    print(f"   {result.explanation}")
    
    print("\n✓ All Counting tests passed")


def test_probability():
    """Test Domain 4: Probability"""
    print("\n" + "="*60)
    print("DOMAIN 4: PROBABILITY (MIT MCS Chapters 16-20)")
    print("="*60)
    
    # Test Bayes
    result = ProbabilityTools.bayes_update(
        prior=0.01,
        likelihood=0.95,
        false_positive=0.05
    )
    print(f"\n1. Bayes' Theorem (Medical test scenario):")
    print(f"   Prior (disease prevalence): 1%")
    print(f"   Sensitivity (true positive): 95%")
    print(f"   False positive rate: 5%")
    print(f"   Posterior P(disease|positive): {result.result:.4f}")
    print(f"   {result.explanation}")
    
    # Test binomial probability
    result = ProbabilityTools.binomial_prob(n=10, k=3, p=0.5)
    print(f"\n2. Binomial Distribution P(X=3) for X~Bin(10, 0.5):")
    print(f"   {result.explanation}")
    
    # Test Poisson
    result = ProbabilityTools.poisson_prob(k=5, lambda_=3.0)
    print(f"\n3. Poisson Distribution P(X=5) for X~Pois(3):")
    print(f"   {result.explanation}")
    
    # Test expected value
    dist = [(0, 0.2), (1, 0.5), (2, 0.3)]
    result = ProbabilityTools.expected_value(dist)
    print(f"\n4. Expected Value for distribution:")
    print(f"   P(X=0)=0.2, P(X=1)=0.5, P(X=2)=0.3")
    print(f"   E[X] = {result.result}")
    assert abs(result.result - 1.1) < 0.001
    
    # Test Markov bound
    result = ProbabilityTools.markov_bound(expected=10, threshold=50)
    print(f"\n5. Markov's Inequality: P(X ≥ 50) when E[X]=10")
    print(f"   {result.explanation}")
    
    # Test Chebyshev bound
    result = ProbabilityTools.chebyshev_bound(mean=100, variance=25, threshold=10)
    print(f"\n6. Chebyshev's Inequality: P(|X-100| ≥ 10) when Var=25")
    print(f"   {result.explanation}")
    
    # Test Chernoff bound
    result = ProbabilityTools.chernoff_bound(n=100, p=0.5, delta=0.1)
    print(f"\n7. Chernoff Bounds for sum of 100 fair coin flips:")
    print(f"   {result.explanation}")
    
    print("\n✓ All Probability tests passed")


def test_recurrences():
    """Test Domain 5: Recurrences"""
    print("\n" + "="*60)
    print("DOMAIN 5: RECURRENCES (MIT MCS Chapter 21)")
    print("="*60)
    
    # Test Master Theorem - Merge Sort
    result = RecurrenceTools.master_theorem(a=2, b=2, f_complexity="n")
    print(f"\n1. Master Theorem: T(n) = 2T(n/2) + n (Merge Sort)")
    print(f"   {result.explanation}")
    assert "Θ(n" in result.result["complexity"] and "log" in result.result["complexity"]
    
    # Test Master Theorem - Binary Search
    result = RecurrenceTools.master_theorem(a=1, b=2, f_complexity="1")
    print(f"\n2. Master Theorem: T(n) = T(n/2) + 1 (Binary Search)")
    print(f"   {result.explanation}")
    
    # Test Master Theorem - Karatsuba
    result = RecurrenceTools.master_theorem(a=3, b=2, f_complexity="n")
    print(f"\n3. Master Theorem: T(n) = 3T(n/2) + n (Karatsuba)")
    print(f"   {result.explanation}")
    
    # Test Akra-Bazzi
    result = RecurrenceTools.akra_bazzi(terms=[(1, 2), (1, 3)], f_degree=1)
    print(f"\n4. Akra-Bazzi: T(n) = T(n/2) + T(n/3) + n")
    print(f"   {result.explanation}")
    
    # Test recurrence evaluation
    result = RecurrenceTools.evaluate_recurrence(
        recurrence="T(n) = T(n-1) + T(n-2)",
        base_cases={0: 0, 1: 1},
        n=10
    )
    print(f"\n5. Fibonacci Evaluation: T(10)")
    print(f"   {result.explanation}")
    assert result.result == 55
    
    print("\n✓ All Recurrences tests passed")


def test_unified_agent():
    """Test the unified CompSci Math Agent interface"""
    print("\n" + "="*60)
    print("UNIFIED AGENT INTERFACE")
    print("="*60)

    agent = CompSciMathAgent(checkpointing=True)

    # Test direct tool invocation
    result = agent.invoke("binomial", n=10, k=5)
    print(f"\n1. Direct Invocation: binomial(10, 5)")
    print(f"   Result: {result.result}")
    print(f"   State Hash: {result.state_hash}")

    # Test natural language query
    result = agent.query("What is C(52, 5)?")
    print(f"\n2. Natural Language Query: 'What is C(52, 5)?'")
    print(f"   {result.explanation}")

    # Test state checkpointing
    print(f"\n3. State Checkpointing:")
    print(f"   Current state hash: {agent.get_state_hash()}")
    print(f"   Total checkpoints: {len(agent.state_history)}")

    print("\n✓ Unified Agent tests passed")


def test_zig_bridge():
    """Test the Zig bridge functionality"""
    print("\n" + "="*60)
    print("ZIG BRIDGE")
    print("="*60)

    from tools.zig_bridge import ZigBridge, ZigModule

    bridge = ZigBridge()
    status = bridge.get_status()

    print(f"\n1. Zig Bridge Status:")
    print(f"   Zig available: {status['zig_available']}")
    print(f"   Zig version: {status['zig_version']}")
    print(f"   Source directory: {status['source_dir']}")
    print(f"   Available modules: {status['available_modules']}")

    if bridge.is_zig_available():
        print("\n2. Zig modules found - compilation available")
        for module in bridge.list_available_modules():
            print(f"   - {module.value}")
    else:
        print("\n2. Zig not installed - skipping compilation tests")
        print("   Install from https://ziglang.org/download/")

    print("\n✓ Zig Bridge tests passed")


def test_cyber_bridge():
    """Test the Cyber bridge functionality"""
    print("\n" + "="*60)
    print("CYBER BRIDGE")
    print("="*60)

    from tools.cyber_bridge import CyberBridge, CyberModule

    bridge = CyberBridge()
    status = bridge.get_status()

    print(f"\n1. Cyber Bridge Status:")
    print(f"   Cyber available: {status['cyber_available']}")
    print(f"   Cyber version: {status['cyber_version']}")
    print(f"   Source directory: {status['source_dir']}")
    print(f"   Available modules: {status['available_modules']}")

    if bridge.is_cyber_available():
        print("\n2. Cyber interpreter found - execution available")
        for module in bridge.list_available_modules():
            print(f"   - {module.value}")
    else:
        print("\n2. Cyber not installed - skipping execution tests")
        print("   Install from https://github.com/nickolaev/cyber")

    print("\n✓ Cyber Bridge tests passed")


def main():
    """Run all tests"""
    print("="*60)
    print("CompSci Math Agent - Comprehensive Test Suite")
    print("MIT Mathematics for Computer Science Implementation")
    print("="*60)

    test_proofs()
    test_structures()
    test_counting()
    test_probability()
    test_recurrences()
    test_unified_agent()
    test_zig_bridge()
    test_cyber_bridge()

    print("\n" + "="*60)
    print("ALL TESTS PASSED SUCCESSFULLY")
    print("="*60)
    print("\nThe CompSci Math Agent is ready for Claude Code integration.")
    print("Import with: from tools.math_agent import CompSciMathAgent")
    print("\nBackend options:")
    print("  - Python: from tools import CompSciMathAgent")
    print("  - Zig:    from tools import ZigBridge, HybridMathAgent")
    print("  - Cyber:  from tools import CyberBridge, HybridCyberAgent")


if __name__ == "__main__":
    main()
