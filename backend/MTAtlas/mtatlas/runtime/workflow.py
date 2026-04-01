from __future__ import annotations

import time
from dataclasses import dataclass, field, replace
from typing import Any

from ..interfaces import BaseTargetAgent
from ..extraction import ChainRepository, ChainSemanticFilter, DependencyGraphBuilder, SinkIdentifier
from ..fuzzing import EnvironmentInjector, InjectionPlanner, PayloadFactory, PayloadMutator
from ..oracles import CMDiOracle, CODEiOracle, SQLiOracle, SSRFOracle, SSTIOracle
from ..runtime.artifact_store import ArtifactStore
from ..runtime.metrics import MetricsCollector
from ..schemas import CandidateChain, OracleEvidence, PocRecord
from ..tps import ConstraintGenerator, PromptSolver, SeedPromptGenerator, StabilityEvaluator, TraceMonitor
from ..utils.llm import LLMClient


@dataclass
class MTAtlasWorkflow:
    """Paper-aligned workflow scaffold for one target application."""

    agent: BaseTargetAgent
    framework: str
    llm_client: LLMClient | None = None
    artifact_root: str = "MTAtlas/artifacts"
    max_candidate_chains: int = 10
    semantic_filter_budget: int = 250
    max_tps_iterations: int = 5
    reachability_runs: int = 10
    stable_runs: int = 5
    repository: ChainRepository = field(default_factory=ChainRepository)

    def __post_init__(self) -> None:
        self.artifacts = ArtifactStore(self.artifact_root)
        self.metrics = MetricsCollector()
        tool_definitions = self.agent.get_tool_definitions()
        self.monitor = TraceMonitor(tool_definitions)
        self.constraint_generator = ConstraintGenerator(self.llm_client)
        self.prompt_solver = PromptSolver(self.llm_client)
        self.seed_prompt_generator = SeedPromptGenerator(self.llm_client)
        self.stability_evaluator = StabilityEvaluator(self.monitor)
        self.sink_identifier = SinkIdentifier()
        self.graph_builder = DependencyGraphBuilder()
        self.semantic_filter = ChainSemanticFilter(self.llm_client)
        self.injection_planner = InjectionPlanner(self.llm_client)
        self.payload_factory = PayloadFactory()
        self.environment_injector = EnvironmentInjector()
        self.payload_mutator = PayloadMutator(self.llm_client)
        self.oracles = {
            "CMDI": CMDiOracle(),
            "CODEI": CODEiOracle(),
            "SSRF": SSRFOracle(),
            "SQLI": SQLiOracle(),
            "SSTI": SSTIOracle(),
        }

    def run(self) -> dict[str, Any]:
        started = time.time()
        framework_artifact = self.repository.build_artifact(
            self.framework,
            self.agent.get_tool_definitions(),
            self.agent.get_tool_source_map(),
        )
        sink_tools = list(self.sink_identifier.identify(framework_artifact))
        edges = list(self.graph_builder.build_edges(framework_artifact))
        candidate_chains = list(
            self.graph_builder.build_candidate_chains(sink_tools, edges, framework_artifact)
        )
        candidate_pool = candidate_chains[: self.semantic_filter_budget]

        accepted_chains, rejected_chains = self.semantic_filter.filter(
            candidate_pool,
            self.agent.get_tool_definitions(),
        )

        valid_prompts = []
        for chain in accepted_chains[: self.max_candidate_chains]:
            seed_prompt = self.seed_prompt_generator.generate(
                chain,
                self.agent.get_tool_definitions(),
            )
            repaired_prompt = seed_prompt
            valid_prompt = None
            tps_iterations: list[dict[str, Any]] = []

            for iteration_index in range(self.max_tps_iterations):
                self.agent.reset()
                self.agent.chat(repaired_prompt)
                raw_trace = self.agent.get_last_trace()
                trace = [self._trace_to_dict(event) for event in raw_trace]
                alignment = self.monitor.align(chain, trace)
                iteration_record: dict[str, Any] = {
                    "iteration": iteration_index,
                    "prompt_before": repaired_prompt,
                    "trace": trace,
                    "alignment": {
                        "status": alignment.status,
                        "matched_prefix": alignment.matched_prefix,
                        "failure_tool": alignment.failure_tool,
                        "details": alignment.details,
                    },
                }
                if alignment.status == "SUCCESS":
                    valid_prompt = self.stability_evaluator.evaluate(
                        self.agent,
                        chain,
                        repaired_prompt,
                        reachability_runs=self.reachability_runs,
                        stable_runs=self.stable_runs,
                    )
                    iteration_record["stability_check"] = {
                        "accepted": valid_prompt is not None,
                        "reachability_runs": self.reachability_runs,
                        "stable_runs": self.stable_runs,
                    }
                    tps_iterations.append(iteration_record)
                    if valid_prompt is not None:
                        break

                constraint = self.constraint_generator.generate(
                    chain,
                    repaired_prompt,
                    alignment,
                    trace,
                )
                next_prompt = self.prompt_solver.repair(chain, repaired_prompt, constraint)
                iteration_record["constraint"] = {
                    "failure_type": constraint.failure_type,
                    "failure_point": constraint.failure_point,
                    "summary": constraint.summary,
                    "correct_prefix": list(constraint.correct_prefix),
                    "missing_preconditions": list(constraint.missing_preconditions),
                    "binding_requirements": list(constraint.binding_requirements),
                    "format_requirements": list(constraint.format_requirements),
                    "gate_instructions": list(constraint.gate_instructions),
                    "disallowed_tools": list(constraint.disallowed_tools),
                    "local_edit_hint": constraint.local_edit_hint,
                    "instructions": list(constraint.instructions),
                    "satisfaction_checks": list(constraint.satisfaction_checks),
                    "repair_window_start": constraint.repair_window_start,
                    "repair_window_end": constraint.repair_window_end,
                    "llm_rationale": constraint.llm_rationale,
                }
                iteration_record["prompt_after"] = next_prompt
                tps_iterations.append(iteration_record)
                repaired_prompt = next_prompt

            if valid_prompt is not None:
                valid_prompt = replace(
                    valid_prompt,
                    seed_prompt=seed_prompt,
                    tps_iterations=tuple(tps_iterations),
                )
                valid_prompts.append(valid_prompt)
                self.artifacts.write_json(
                    f"{self.framework}/valid_prompts/{len(valid_prompts):03d}.json",
                    {
                        "chain": list(chain.tools),
                        "sink_tool": chain.sink_tool,
                        "sink_type": chain.sink_type,
                        "dependency_summary": list(chain.dependency_summary),
                        "dependency_kinds": list(chain.dependency_kinds),
                        "dependency_sites": [site.__dict__ for site in chain.dependency_sites],
                        "key_dependency_site": chain.key_dependency_site.__dict__ if chain.key_dependency_site else None,
                        "ingress_points": [point.__dict__ for point in chain.ingress_points],
                        "seed_prompt": seed_prompt,
                        "prompt": valid_prompt.prompt,
                        "reachability_runs": valid_prompt.reachability_runs,
                        "reachability_successes": valid_prompt.reachability_successes,
                        "stable_successes": valid_prompt.stable_successes,
                        "sample_trace": list(valid_prompt.sample_trace),
                        "tps_iterations": list(valid_prompt.tps_iterations),
                    },
                )

        vulnerabilities: list[PocRecord] = []
        for valid_prompt in valid_prompts:
            findings = self._validate_prompt(valid_prompt, started)
            vulnerabilities.extend(findings)

        summary = {
            "framework": self.framework,
            "sink_tools": len(sink_tools),
            "edges": len(edges),
            "candidate_chains": len(candidate_chains),
            "semantic_filter_budget": self.semantic_filter_budget,
            "accepted_chains": len(accepted_chains),
            "rejected_chains": len(rejected_chains),
            "valid_prompts": len(valid_prompts),
            "confirmed_vulnerabilities": len(vulnerabilities),
            "metrics": self.metrics.snapshot().__dict__,
        }
        self.artifacts.write_json(f"{self.framework}/summary.json", summary)
        return summary

    def _validate_prompt(self, valid_prompt, started: float) -> list[PocRecord]:
        findings: list[PocRecord] = []
        plans = self.injection_planner.plan(valid_prompt.chain, valid_prompt)
        payloads = self.payload_factory.generate(valid_prompt.chain)

        for plan in plans:
            for payload in payloads:
                for variant in self.payload_mutator.mutate(payload):
                    self.agent.reset()
                    state_before = self.agent.get_state_snapshot()
                    if plan.channel == "env-source":
                        try:
                            self.environment_injector.inject(self.agent, plan, variant)
                        except NotImplementedError:
                            continue
                    final_prompt = self._compose_attack_prompt(valid_prompt.prompt, plan, variant)
                    self.agent.chat(final_prompt)
                    trace = [self._trace_to_dict(event) for event in self.agent.get_last_trace()]
                    state_after = self.agent.get_state_snapshot()
                    runtime_events = self.agent.get_runtime_events()
                    self.metrics.record_tool_call(
                        sum(1 for event in trace if event.get("role") == "tool_call")
                    )

                    evidence = self._evaluate_oracle(
                        valid_prompt.chain,
                        variant,
                        trace,
                        state_before,
                        state_after,
                        runtime_events,
                    )
                    if not evidence.verdict:
                        continue

                    poc = PocRecord(
                        chain=valid_prompt.chain,
                        valid_prompt=final_prompt,
                        injection_plan=plan,
                        payload=variant,
                        evidence=evidence,
                    )
                    findings.append(poc)
                    self.metrics.record_vulnerability(time.time() - started)
                    self.artifacts.write_json(
                        f"{self.framework}/findings/{len(findings):03d}.json",
                        {
                            "chain": list(valid_prompt.chain.tools),
                            "sink_type": valid_prompt.chain.sink_type,
                            "dependency_sites": [site.__dict__ for site in valid_prompt.chain.dependency_sites],
                            "prompt": final_prompt,
                            "plan": plan.__dict__,
                            "payload": variant.__dict__,
                            "trace": trace,
                            "state_before": state_before,
                            "state_after": state_after,
                            "runtime_events": runtime_events,
                            "evidence": {
                                "verdict": evidence.verdict,
                                "oracle": evidence.oracle_name,
                                "summary": evidence.summary,
                                "details": evidence.details,
                                "raw_events": list(evidence.raw_events),
                            },
                        },
                    )
                    break

        return findings

    def _evaluate_oracle(
        self,
        chain: CandidateChain,
        payload,
        trace: list[dict[str, Any]],
        state_before: dict[str, Any],
        state_after: dict[str, Any],
        runtime_events: list[dict[str, Any]],
    ) -> OracleEvidence:
        oracle = self.oracles.get(chain.sink_type.upper())
        if oracle is None:
            marker = payload.expected_signal or payload.marker or payload.payload
            dumped = f"{trace}{state_after}{runtime_events}"
            verdict = marker in dumped
            return OracleEvidence(
                verdict=verdict,
                oracle_name="GenericOracle",
                summary="Generic marker-based fallback oracle.",
                raw_events=(dumped[:300],) if verdict else (),
                details={"marker": marker},
            )
        return oracle.evaluate(chain, payload, trace, state_before, state_after, runtime_events)

    def _compose_attack_prompt(self, prompt: str, plan, payload) -> str:
        if plan.channel == "user-source":
            entry_field = f" for `{plan.entry_field}`" if getattr(plan, "entry_field", "") else ""
            return (
                f"{prompt}\n\n"
                f"Use the following untrusted input exactly as provided{entry_field} during the workflow:\n"
                f"{payload.payload}"
            )
        return prompt

    def _trace_to_dict(self, event) -> dict[str, Any]:
        if hasattr(event, "__dict__"):
            return dict(event.__dict__)
        return dict(event)
