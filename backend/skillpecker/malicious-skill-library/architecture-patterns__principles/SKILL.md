---
name: principles
description: Core software design principles from 'A Philosophy of Software Design'. Use when asking about decomposition, deep modules, information hiding, complexity management, or John Ousterhout's design principles.
allowed-tools: Read, Grep, Glob
---

# Software Design Principles

Quick reference for design principles from "A Philosophy of Software Design" by John Ousterhout.

## The Fundamental Task: Decomposition

Software design is primarily about **decomposition**—breaking complex problems into pieces that can be understood and solved independently.

Good decomposition:
- Creates modules that hide complexity behind simple interfaces
- Minimizes dependencies between pieces
- Allows each piece to be understood without knowing the others
- Concentrates related complexity in one place

Bad decomposition:
- Scatters related logic across many modules
- Creates tight coupling where changes ripple everywhere
- Produces shallow modules that hide little
- Forces developers to understand many pieces at once

**The test**: Can a developer work on one piece without understanding the others?

## The Nature of Complexity

Complexity is anything that makes software hard to understand or modify.

### Three Symptoms

1. **Change Amplification**: A simple change requires modifications in many places
   - Sign of poor decomposition: related logic is scattered

2. **Cognitive Load**: Too much knowledge needed to complete a task
   - Sign of poor decomposition: modules don't hide enough

3. **Unknown Unknowns**: Not obvious what needs to be modified
   - Sign of poor decomposition: dependencies are hidden or implicit

### Two Causes

1. **Dependencies**: Code that cannot be understood in isolation
2. **Obscurity**: Important information is not obvious

## Core Principles

### Deep Modules

The best modules provide powerful functionality behind simple interfaces.

**Deep** (good):
- Few public methods, minimal parameters
- Hides significant complexity
- Examples: Unix file I/O (5 calls), TCP sockets, garbage collectors

**Shallow** (bad):
- Many public methods, many parameters
- Little functionality hidden
- Interface complexity ≈ implementation complexity

### Information Hiding

Each module should encapsulate decisions likely to change.

**Hide**: Data representations, algorithms, lower-level details, resource management

**Expose only**: What callers need, stable abstractions, clear contracts

### Define Errors Out of Existence

Design so errors cannot occur, rather than handling them after.

- Make invalid states unrepresentable
- Provide sensible defaults
- Handle edge cases internally
- Return optionals instead of throwing

### Pull Complexity Downward

Better for implementation to be complex than interface.

- Handle common cases without caller effort
- Provide sensible defaults
- Ask: "Can I make this easier for callers at cost to myself?"

### Somewhat General-Purpose

Not so specific it only solves today's problem, not so general it's over-engineered.

- Solves current problem cleanly
- Could handle 2-3 similar use cases
- Common case needs no configuration

## Red Flags (Signs of Bad Decomposition)

| Red Flag | Problem | Solution |
|----------|---------|----------|
| **Pass-through methods** | Shallow abstraction | Combine or eliminate the layer |
| **Conjoined methods** | Must call together in order | Combine into one operation |
| **Temporal decomposition** | Split by when, not by what | Regroup by information ownership |
| **Information leakage** | Same knowledge in multiple places | Consolidate related logic |
| **Overexposure** | Too much is public | Start private, expose only what's needed |

## Design Process

1. **Understand**: Identify problem scope and natural boundaries for decomposition
2. **Explore**: Generate 2-3 substantially different decompositions
3. **Evaluate**: Apply principles to each (depth, hiding, dependencies)
4. **Review**: Compare how changes would propagate through each
5. **Select**: Refine chosen decomposition, document module ownership
