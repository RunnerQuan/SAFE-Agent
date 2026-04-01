from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ToolDefinition:
    name: str
    description: str
    parameters: dict[str, Any]
    return_fields: tuple[str, ...] = ()
    side_effects: tuple[str, ...] = ()


@dataclass(frozen=True)
class SinkSite:
    tool_name: str
    sink_type: str
    api: str
    sink_argument: str
    evidence: str


@dataclass(frozen=True)
class SinkToolRecord:
    tool_name: str
    sink_types: tuple[str, ...]
    effects: tuple[str, ...]
    evidence: tuple[str, ...]
    threat_families: tuple[str, ...] = ()
    sink_sites: tuple[SinkSite, ...] = ()


@dataclass(frozen=True)
class DependencyEdge:
    source_tool: str
    target_tool: str
    dependency_kind: str
    carrier: str
    evidence: str
    source_field: str = ""
    target_param: str = ""
    match_kind: str = ""
    criteria: tuple[str, ...] = ()


@dataclass(frozen=True)
class DependencySite:
    source_tool: str
    source_field: str
    target_tool: str
    target_param: str
    dependency_kind: str
    carrier: str
    match_kind: str
    evidence: str


@dataclass(frozen=True)
class IngressPoint:
    channel: str
    tool_name: str
    tool_index: int
    field_name: str
    carrier: str
    mode: str
    rationale: str


@dataclass(frozen=True)
class CandidateChain:
    framework: str
    tools: tuple[str, ...]
    sink_tool: str
    sink_type: str
    dependency_summary: tuple[str, ...] = ()
    carriers: tuple[str, ...] = ()
    dependency_kinds: tuple[str, ...] = ()
    threat_families: tuple[str, ...] = ()
    dependency_sites: tuple[DependencySite, ...] = ()
    key_dependency_site: DependencySite | None = None
    ingress_points: tuple[IngressPoint, ...] = ()
    source: str = "static"


@dataclass(frozen=True)
class TraceEvent:
    step: int
    role: str
    tool_name: str | None = None
    arguments: Any = field(default_factory=dict)
    content: str = ""
    thinking: str = ""
    return_value: str = ""
    status: str | None = None
    exception_type: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class TraceAlignment:
    status: str
    matched_prefix: int
    failure_tool: str | None
    details: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class PromptConstraint:
    failure_type: str
    failure_point: int
    summary: str
    correct_prefix: tuple[str, ...] = ()
    missing_preconditions: tuple[str, ...] = ()
    binding_requirements: tuple[dict[str, Any], ...] = ()
    format_requirements: tuple[dict[str, Any], ...] = ()
    gate_instructions: tuple[str, ...] = ()
    disallowed_tools: tuple[str, ...] = ()
    local_edit_hint: str = ""
    instructions: tuple[str, ...] = ()
    satisfaction_checks: tuple[str, ...] = ()
    repair_window_start: int = 0
    repair_window_end: int = 0
    llm_rationale: str = ""


@dataclass(frozen=True)
class ValidPrompt:
    prompt: str
    chain: CandidateChain
    reachability_runs: int
    reachability_successes: int
    stable_successes: int
    sample_trace: tuple[dict[str, Any], ...] = ()
    seed_prompt: str = ""
    tps_iterations: tuple[dict[str, Any], ...] = ()


@dataclass(frozen=True)
class InjectionPlan:
    channel: str
    mode: str
    entry_tool: str
    entry_index: int
    entry_field: str
    target_sink: str
    carrier: str
    rationale: str
    propagation_path: tuple[str, ...] = ()


@dataclass(frozen=True)
class PayloadVariant:
    sink_type: str
    template_id: str
    payload: str
    transformation: str = "raw"
    marker: str = ""
    expected_signal: str = ""


@dataclass(frozen=True)
class OracleEvidence:
    verdict: bool
    oracle_name: str
    summary: str
    raw_events: tuple[str, ...] = ()
    details: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class PocRecord:
    chain: CandidateChain
    valid_prompt: str
    injection_plan: InjectionPlan
    payload: PayloadVariant
    evidence: OracleEvidence
    trace_path: str = ""


@dataclass
class RunMetrics:
    llm_calls: int = 0
    llm_input_tokens: int = 0
    llm_output_tokens: int = 0
    tool_calls: int = 0
    wall_time_seconds: float = 0.0
    time_to_first_vulnerability_seconds: float | None = None
    confirmed_vulnerabilities: int = 0
