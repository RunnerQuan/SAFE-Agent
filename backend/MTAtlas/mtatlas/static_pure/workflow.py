from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from ..extraction import ChainRepository, ChainSemanticFilter, DependencyGraphBuilder, SinkIdentifier
from ..runtime.artifact_store import ArtifactStore
from ..utils.llm import LLMClient
from .loader import StaticPureMetadataLoader
from .normalizer import MetadataToolNormalizer
from .source_risk_assessor import SourceRiskAssessor


@dataclass
class StaticPureWorkflow:
    """Static-only chain extraction and source-risk assessment workflow."""

    framework: str
    artifact_root: str = "MTAtlas/artifacts"
    llm_client: LLMClient | None = None
    semantic_filter_budget: int = 250
    max_candidate_chains: int = 100
    repository: ChainRepository = field(default_factory=ChainRepository)
    loader: StaticPureMetadataLoader = field(default_factory=StaticPureMetadataLoader)
    normalizer: MetadataToolNormalizer = field(default_factory=MetadataToolNormalizer)

    def __post_init__(self) -> None:
        self.artifacts = ArtifactStore(self.artifact_root)
        self.sink_identifier = SinkIdentifier()
        self.graph_builder = DependencyGraphBuilder()
        self.semantic_filter = ChainSemanticFilter(self.llm_client)
        self.source_risk_assessor = SourceRiskAssessor(self.llm_client)

    def run_from_path(self, input_path: str) -> dict[str, Any]:
        raw_tools = self.loader.load(input_path)
        return self.run(raw_tools, input_path=input_path)

    def run(self, raw_tools: list[dict[str, str]], input_path: str = "") -> dict[str, Any]:
        started = time.time()
        tool_definitions, tool_source_map, normalized_tools = self.normalizer.normalize(raw_tools)
        framework_artifact = self.repository.build_artifact(self.framework, tool_definitions, tool_source_map)
        self._attach_normalized_tool_metadata(framework_artifact, normalized_tools)

        sink_tools = list(self.sink_identifier.identify(framework_artifact))
        edges = list(self.graph_builder.build_edges(framework_artifact))
        candidate_chains = list(
            self.graph_builder.build_candidate_chains(sink_tools, edges, framework_artifact)
        )
        candidate_pool = candidate_chains[: self.semantic_filter_budget]
        accepted_chains, rejected_chains = self.semantic_filter.filter(candidate_pool, tool_definitions)
        source_risk_report = self.source_risk_assessor.assess(accepted_chains[: self.max_candidate_chains], normalized_tools)

        self.artifacts.write_json(
            f"{self.framework}/static_pure/normalized_tools.json",
            {"tools": [self._normalized_tool_payload(tool_name, normalized_tools[tool_name]) for tool_name in sorted(normalized_tools)]},
        )
        self.artifacts.write_json(
            f"{self.framework}/static_pure/sink_tools.json",
            {"sink_tools": [self._sink_tool_payload(item) for item in sink_tools]},
        )
        self.artifacts.write_json(
            f"{self.framework}/static_pure/dependency_edges.json",
            {"edges": [self._edge_payload(edge) for edge in edges]},
        )
        self.artifacts.write_json(
            f"{self.framework}/static_pure/candidate_chains.json",
            {"chains": self._chain_payloads(candidate_chains, normalized_tools)},
        )
        self.artifacts.write_json(
            f"{self.framework}/static_pure/filtered_candidate_chains.json",
            {
                "accepted": self._chain_payloads(accepted_chains, normalized_tools),
                "rejected": self._chain_payloads(rejected_chains, normalized_tools),
            },
        )
        self.artifacts.write_json(
            f"{self.framework}/static_pure/source_risk_report.json",
            {"chains": source_risk_report},
        )

        summary = {
            "mode": "static-pure",
            "framework": self.framework,
            "input_path": input_path,
            "tool_count": len(normalized_tools),
            "sink_tools": len(sink_tools),
            "dependency_edges": len(edges),
            "candidate_chain_count": len(candidate_chains),
            "accepted_chain_count": len(accepted_chains),
            "rejected_chain_count": len(rejected_chains),
            "chains": [item["chain_display"] for item in source_risk_report],
            "wall_time_seconds": time.time() - started,
        }
        self.artifacts.write_json(f"{self.framework}/static_pure/summary.json", summary)
        self.artifacts.write_text(f"{self.framework}/static_pure/report.md", self._report_markdown(summary, source_risk_report))
        return summary

    def _attach_normalized_tool_metadata(self, framework_artifact: dict[str, Any], normalized_tools: dict[str, dict[str, Any]]) -> None:
        for tool_name, tool_data in framework_artifact.get("tools", {}).items():
            extra = normalized_tools.get(tool_name, {})
            tool_data["mcp_name"] = extra.get("mcp_name", "")
            tool_data["input_params"] = extra.get("input_params", [])
            tool_data["injected_params"] = extra.get("injected_params", [])
            tool_data["return_shape"] = extra.get("return_shape", "unknown")
            tool_data["content_sources"] = extra.get("content_sources", ())

    def _normalized_tool_payload(self, tool_name: str, tool_record: dict[str, Any]) -> dict[str, Any]:
        return {
            "tool_name": tool_name,
            "mcp_name": tool_record.get("mcp_name", ""),
            "description": tool_record.get("description", ""),
            "input_params": list(tool_record.get("input_params", ())),
            "injected_params": list(tool_record.get("injected_params", ())),
            "return_shape": tool_record.get("return_shape", "unknown"),
            "return_fields": list(tool_record.get("return_fields", ())),
            "side_effects": list(tool_record.get("side_effects", ())),
            "content_sources": list(tool_record.get("content_sources", ())),
        }

    def _sink_tool_payload(self, sink_tool: Any) -> dict[str, Any]:
        return {
            "tool_name": sink_tool.tool_name,
            "sink_types": list(sink_tool.sink_types),
            "effects": list(sink_tool.effects),
            "evidence": list(sink_tool.evidence),
            "sink_sites": [site.__dict__ for site in sink_tool.sink_sites],
        }

    def _edge_payload(self, edge: Any) -> dict[str, Any]:
        return {
            "source_tool": edge.source_tool,
            "target_tool": edge.target_tool,
            "dependency_kind": edge.dependency_kind,
            "carrier": edge.carrier,
            "source_field": edge.source_field,
            "target_param": edge.target_param,
            "match_kind": edge.match_kind,
            "criteria": list(edge.criteria),
            "evidence": edge.evidence,
        }

    def _chain_payloads(self, chains: list[Any], normalized_tools: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
        payloads: list[dict[str, Any]] = []
        for index, chain in enumerate(chains, start=1):
            payloads.append(
                {
                    "chain_id": f"chain_{index:03d}",
                    "tools": list(chain.tools),
                    "chain_display": " -> ".join(chain.tools),
                    "mcp_sequence": [normalized_tools.get(tool_name, {}).get("mcp_name", "Unknown MCP") for tool_name in chain.tools],
                    "chain_display_with_mcp": " -> ".join(
                        f"[{normalized_tools.get(tool_name, {}).get('mcp_name', 'Unknown MCP')}] {tool_name}"
                        for tool_name in chain.tools
                    ),
                    "sink_tool": chain.sink_tool,
                    "sink_type": chain.sink_type,
                    "dependency_summary": list(chain.dependency_summary),
                    "dependency_kinds": list(chain.dependency_kinds),
                    "dependency_sites": [site.__dict__ for site in chain.dependency_sites],
                    "key_dependency_site": chain.key_dependency_site.__dict__ if chain.key_dependency_site else None,
                }
            )
        return payloads

    def _report_markdown(self, summary: dict[str, Any], source_risk_report: list[dict[str, Any]]) -> str:
        lines = [
            f"# MTAtlas Static-Pure Report ({summary['framework']})",
            "",
            f"- Tools: {summary['tool_count']}",
            f"- Sink tools: {summary['sink_tools']}",
            f"- Dependency edges: {summary['dependency_edges']}",
            f"- Candidate chains: {summary['candidate_chain_count']}",
            f"- Accepted chains: {summary['accepted_chain_count']}",
            "",
            "## Chains",
        ]
        if not source_risk_report:
            lines.append("")
            lines.append("No candidate chains were retained after filtering.")
            return "\n".join(lines)

        for item in source_risk_report:
            lines.extend(
                [
                    "",
                    f"### {item['chain_id']}",
                    f"- Chain: {item['chain_display']}",
                    f"- MCP Path: {item['chain_display_with_mcp']}",
                    f"- Sink: {item['sink_tool']} ({item['sink_type']})",
                    f"- User-source risk: {item['user_source_risk'].get('supported')} | {item['user_source_risk'].get('reason')}",
                    f"- Environment-source risk: {item['environment_source_risk'].get('supported')} | {item['environment_source_risk'].get('reason')}",
                ]
            )
        return "\n".join(lines)
