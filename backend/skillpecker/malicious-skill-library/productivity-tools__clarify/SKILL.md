---
persona: luna
use-case: macroflow
version: 1.0.26021.1
name: clarify
description: Refine user intent through questions and context gathering in MacroFlow.
---
persona: luna
use-case: macroflow

# Clarify Skill

## Overview

The Clarify phase gathers and refines requirements, eliminating ambiguities through targeted questions and analysis. It ensures truth-seeking by probing assumptions and validating inputs. For business problem/solution development, this phase iterates on neutral Markdown from raw notes, leveraging roles (e.g., Azure Integration Specialist, Mulesoft Specialist) for reviews, analysis sessions, and ADO MCP tracking, time-boxed to 32 hours.

## Purpose

- Gather detailed requirements from raw notes and customer inputs
- Identify and resolve ambiguities via role-based reviews (docs, code, industry updates)
- Validate stakeholder needs and assumptions
- Prepare neutral analysis Markdown for Plan phase

## Inputs

- Constitutional framework (principles, roles, constraints)
- Initial requirements (raw notes, business problems)
- Stakeholder feedback and existing assets (docs, code)

## Process

1. Determine mode: Ask if in requirements/specification mode (focus on gathering/refining specs) or solutioning mode (focus on architecture/planning). Set flag for tailored questions.
2. Gather initial inputs: Start with raw notes/customer requirements; use Grok-assisted probes for context.
3. Resolve ambiguities: Ask targeted questions (e.g., "What are the key constraints? Success criteria?"); iterate until clear, no time-boxing—keep lean.
4. Optional setup: Only if needed, prompt for repos/instances (Git URLs, ADO projects); automate via scripts if applicable.
5. Sync with ADO: Create/link work items only if tracking required for multi-instance forensics.

## Clarify Questions for Setup

- Mode: "Requirements/spec mode or solutioning mode? (Affects focus on specs vs. architecture.)"
- Core: "What are the main requirements/assumptions? Any constraints?"
- Setup (if needed): "Any Git repos or ADO instances to include? (Provide URLs/orgs.)"

## Outputs

- Refined requirements document (neutral analysis Markdown with Mermaid if needed)
- Clarified scope, boundaries, and resolved ambiguities
- Mode flag set; summary for handoff
- ADO work item links (if created)

## Grok Integration

Use Grok for probing questions and assumption validation. Temperature: 0.7 for exploratory dialogue. Luna sub-agents (e.g., @Clarify) orchestrate iterations and pulls.

## Next Phase

Proceed to Specify (if requirements mode) or Plan (if solutioning mode) with clean handoff summary. Add pivot option to switch modes mid-phase.

## Instructions
1. Ask targeted clarifying questions.
2. Gather context from workspace or web.
3. Use Grok X-insights for real-time data.
4. Resolve assumptions.

## Examples
- Input: Vague query.
- Output: Refined spec.

## Learned Patterns
- Parallel with Constitution.
