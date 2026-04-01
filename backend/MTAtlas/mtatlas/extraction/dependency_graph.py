from __future__ import annotations

from collections import defaultdict
from typing import Any, Iterable

from ..schemas import CandidateChain, DependencyEdge, DependencySite, IngressPoint, SinkToolRecord


class DependencyGraphBuilder:
    """Construct static dependency edges, then enumerate chains ending at each sink tool."""

    FIELD_ALIASES = {
        "url": {"url", "uri", "link", "href", "endpoint"},
        "file_path": {"file_path", "path", "filepath", "filename", "file", "output_path", "input_path"},
        "content": {"content", "text", "body", "html", "markdown", "document", "payload", "data"},
        "query": {"query", "sql", "statement", "condition"},
        "template": {"template", "template_string", "render_input"},
        "command": {"command", "cmd", "args", "shell_command"},
        "code": {"code", "source", "expression", "script", "python_code"},
        "result": {"result", "response", "rows", "output", "stdout", "rendered_output", "query_result"},
    }

    DIRECT_CARRIER_BY_FIELD = {
        "url": "url",
        "file_path": "file_path",
        "content": "content",
        "query": "query",
        "template": "template",
        "command": "command",
        "code": "code",
        "result": "result",
    }

    def __init__(self, max_chain_length: int = 4) -> None:
        self.max_chain_length = max_chain_length

    def build_edges(self, framework_artifact: dict) -> list[DependencyEdge]:
        tools = framework_artifact.get("tools", {})
        edge_map: dict[tuple[str, str, str, str, str, str], DependencyEdge] = {}

        for source_name, source_tool in tools.items():
            for target_name, target_tool in tools.items():
                if source_name == target_name:
                    continue
                for edge in self._build_direct_edges(source_tool, target_tool):
                    key = (
                        edge.source_tool,
                        edge.target_tool,
                        edge.dependency_kind,
                        edge.carrier,
                        edge.source_field,
                        edge.target_param,
                    )
                    edge_map[key] = edge
                for edge in self._build_indirect_edges(source_tool, target_tool):
                    key = (
                        edge.source_tool,
                        edge.target_tool,
                        edge.dependency_kind,
                        edge.carrier,
                        edge.source_field,
                        edge.target_param,
                    )
                    edge_map[key] = edge

        return sorted(
            edge_map.values(),
            key=lambda item: (
                item.target_tool,
                item.source_tool,
                item.dependency_kind,
                item.carrier,
                item.source_field,
                item.target_param,
            ),
        )

    def build_candidate_chains(
        self,
        sink_tools: Iterable[SinkToolRecord],
        edges: Iterable[DependencyEdge],
        framework_artifact: dict,
    ) -> list[CandidateChain]:
        tools = framework_artifact.get("tools", {})
        edge_lookup = self._edge_lookup(edges)
        predecessor_map = self._predecessor_map(edges)
        candidates: list[CandidateChain] = []
        seen: set[tuple[tuple[str, ...], str, tuple[str, ...]]] = set()

        for sink_record in sink_tools:
            tool_paths = self._enumerate_backward_paths(
                sink_record.tool_name,
                predecessor_map,
                self.max_chain_length,
            )
            if not tool_paths:
                tool_paths = [(sink_record.tool_name,)]

            for tool_path in tool_paths:
                dependency_sites = self._chain_dependency_sites(tool_path, edge_lookup)
                dependency_summary = tuple(site.evidence for site in dependency_sites)
                carriers = tuple(site.carrier for site in dependency_sites)
                dependency_kinds = tuple(site.dependency_kind for site in dependency_sites)
                key_dependency_site = dependency_sites[-1] if dependency_sites else None
                ingress_points = self._infer_ingress_points(tool_path, dependency_sites, tools)

                for sink_type in sink_record.sink_types or ("UNKNOWN",):
                    key = (
                        tool_path,
                        sink_type,
                        tuple(site.evidence for site in dependency_sites),
                    )
                    if key in seen:
                        continue
                    seen.add(key)
                    candidates.append(
                        CandidateChain(
                            framework=framework_artifact.get("framework", ""),
                            tools=tool_path,
                            sink_tool=sink_record.tool_name,
                            sink_type=sink_type,
                            dependency_summary=dependency_summary,
                            carriers=carriers,
                            dependency_kinds=dependency_kinds,
                            threat_families=sink_record.threat_families,
                            dependency_sites=dependency_sites,
                            key_dependency_site=key_dependency_site,
                            ingress_points=ingress_points,
                            source="static_dependency_analysis",
                        )
                    )

        return sorted(
            candidates,
            key=lambda item: (item.sink_tool, len(item.tools), item.tools),
        )

    def _build_direct_edges(self, source_tool: dict[str, Any], target_tool: dict[str, Any]) -> list[DependencyEdge]:
        edges: list[DependencyEdge] = []
        source_name = source_tool.get("name", "")
        target_name = target_tool.get("name", "")

        for source_field in source_tool.get("return_fields", ()):
            for target_param in target_tool.get("param_fields", ()):
                relation = self._field_relation(source_field, target_param)
                if relation is None:
                    continue
                canonical = self._canonical_field(target_param) or self._canonical_field(source_field) or "content"
                edges.append(
                    DependencyEdge(
                        source_tool=source_name,
                        target_tool=target_name,
                        dependency_kind="direct",
                        carrier=self.DIRECT_CARRIER_BY_FIELD.get(canonical, canonical),
                        source_field=source_field,
                        target_param=target_param,
                        match_kind=relation,
                        evidence=(
                            f"{source_name}.{source_field} has a {relation} match with "
                            f"{target_name}.{target_param}"
                        ),
                        criteria=("field_equivalence" if relation == "equivalence" else "field_containment",),
                    )
                )
        return edges

    def _build_indirect_edges(self, source_tool: dict[str, Any], target_tool: dict[str, Any]) -> list[DependencyEdge]:
        edges: list[DependencyEdge] = []
        source_effects = set(source_tool.get("side_effects", ()))
        target_effects = set(target_tool.get("side_effects", ()))
        target_fields = tuple(target_tool.get("param_fields", ()))
        source_name = source_tool.get("name", "")
        target_name = target_tool.get("name", "")

        if "persistent_write" in source_effects or "file_write" in source_effects:
            if (
                "file_read" in target_effects
                or "shell_execute" in target_effects
                or "code_execute" in target_effects
                or self._first_matching_field(target_fields, {"file_path"}) is not None
            ):
                target_param = self._first_matching_field(target_fields, {"file_path"}) or ""
                edges.append(
                    DependencyEdge(
                        source_tool=source_name,
                        target_tool=target_name,
                        dependency_kind="indirect",
                        carrier="file",
                        source_field="persisted_file",
                        target_param=target_param,
                        match_kind="persist-read",
                        evidence=(
                            f"{source_name} can persist file-backed content that {target_name} "
                            "can later read or execute."
                        ),
                        criteria=("persistent_file_dependency",),
                    )
                )

        if "db_write" in source_effects and ("db_read" in target_effects or "db_execute" in target_effects):
            target_param = self._first_matching_field(target_fields, {"query"}) or ""
            edges.append(
                DependencyEdge(
                    source_tool=source_name,
                    target_tool=target_name,
                    dependency_kind="indirect",
                    carrier="db",
                    source_field="persisted_record",
                    target_param=target_param,
                    match_kind="persist-read",
                    evidence=(
                        f"{source_name} can persist database content that {target_name} can later query."
                    ),
                    criteria=("persistent_db_dependency",),
                )
            )

        if "index_store" in source_effects and ("external_input" in target_effects or "network_read" in target_effects):
            target_param = self._first_matching_field(target_fields, {"query", "content"}) or ""
            edges.append(
                DependencyEdge(
                    source_tool=source_name,
                    target_tool=target_name,
                    dependency_kind="indirect",
                    carrier="index",
                    source_field="indexed_content",
                    target_param=target_param,
                    match_kind="persist-read",
                    evidence=(
                        f"{source_name} can store indexed content that {target_name} may retrieve later."
                    ),
                    criteria=("persistent_index_dependency",),
                )
            )

        if "cache_store" in source_effects and "external_input" in target_effects:
            target_param = self._first_matching_field(target_fields, {"content", "query"}) or ""
            edges.append(
                DependencyEdge(
                    source_tool=source_name,
                    target_tool=target_name,
                    dependency_kind="indirect",
                    carrier="cache",
                    source_field="cached_content",
                    target_param=target_param,
                    match_kind="persist-read",
                    evidence=(
                        f"{source_name} can cache content that {target_name} may later consume."
                    ),
                    criteria=("persistent_cache_dependency",),
                )
            )

        return edges

    def _field_relation(self, source_field: str, target_param: str) -> str | None:
        source_canonical = self._canonical_field(source_field)
        target_canonical = self._canonical_field(target_param)
        if not source_canonical or not target_canonical:
            return None
        if source_canonical == target_canonical:
            return "equivalence"

        source_parts = self._field_parts(source_field)
        target_parts = self._field_parts(target_param)
        if source_canonical in target_parts or target_canonical in source_parts:
            return "containment"
        if set(source_parts) & set(target_parts):
            return "containment"
        return None

    def _canonical_field(self, field_name: str) -> str:
        lowered = field_name.lower()
        for canonical, aliases in self.FIELD_ALIASES.items():
            if lowered == canonical or lowered in aliases:
                return canonical
            if lowered.endswith(f".{canonical}") or any(lowered.endswith(f".{alias}") for alias in aliases):
                return canonical
        return ""

    def _field_parts(self, field_name: str) -> list[str]:
        normalized = field_name.replace("[", ".").replace("]", "").replace("/", ".")
        return [part for part in normalized.lower().split(".") if part]

    def _edge_lookup(
        self,
        edges: Iterable[DependencyEdge],
    ) -> dict[tuple[str, str], list[DependencyEdge]]:
        lookup: dict[tuple[str, str], list[DependencyEdge]] = defaultdict(list)
        for edge in edges:
            lookup[(edge.source_tool, edge.target_tool)].append(edge)
        return lookup

    def _predecessor_map(
        self,
        edges: Iterable[DependencyEdge],
    ) -> dict[str, list[str]]:
        predecessors: dict[str, set[str]] = defaultdict(set)
        for edge in edges:
            predecessors[edge.target_tool].add(edge.source_tool)
        return {tool: sorted(values) for tool, values in predecessors.items()}

    def _enumerate_backward_paths(
        self,
        sink_tool: str,
        predecessor_map: dict[str, list[str]],
        max_chain_length: int,
    ) -> list[tuple[str, ...]]:
        discovered: set[tuple[str, ...]] = set()

        def dfs(current_tool: str, reversed_path: tuple[str, ...]) -> None:
            if len(reversed_path) >= max_chain_length:
                discovered.add(tuple(reversed(reversed_path)))
                return

            predecessors = predecessor_map.get(current_tool, [])
            if not predecessors:
                discovered.add(tuple(reversed(reversed_path)))
                return

            advanced = False
            for predecessor in predecessors:
                if predecessor in reversed_path:
                    continue
                advanced = True
                dfs(predecessor, reversed_path + (predecessor,))
            if not advanced:
                discovered.add(tuple(reversed(reversed_path)))

        dfs(sink_tool, (sink_tool,))
        return sorted(discovered, key=lambda item: (len(item), item))

    def _chain_dependency_sites(
        self,
        tool_path: tuple[str, ...],
        edge_lookup: dict[tuple[str, str], list[DependencyEdge]],
    ) -> tuple[DependencySite, ...]:
        sites: list[DependencySite] = []
        for source_tool, target_tool in zip(tool_path, tool_path[1:]):
            candidates = edge_lookup.get((source_tool, target_tool), [])
            if not candidates:
                continue
            edge = self._select_best_edge(candidates)
            sites.append(
                DependencySite(
                    source_tool=edge.source_tool,
                    source_field=edge.source_field,
                    target_tool=edge.target_tool,
                    target_param=edge.target_param,
                    dependency_kind=edge.dependency_kind,
                    carrier=edge.carrier,
                    match_kind=edge.match_kind,
                    evidence=edge.evidence,
                )
            )
        return tuple(sites)

    def _select_best_edge(self, candidates: list[DependencyEdge]) -> DependencyEdge:
        def score(edge: DependencyEdge) -> tuple[int, int, int]:
            kind_score = 0 if edge.dependency_kind == "direct" else 1
            match_score = 0 if edge.match_kind == "equivalence" else 1
            missing_param_penalty = 0 if edge.target_param else 1
            return (kind_score, match_score, missing_param_penalty)

        return sorted(
            candidates,
            key=lambda edge: score(edge),
        )[0]

    def _infer_ingress_points(
        self,
        tool_path: tuple[str, ...],
        dependency_sites: tuple[DependencySite, ...],
        tools: dict[str, dict[str, Any]],
    ) -> tuple[IngressPoint, ...]:
        if not tool_path:
            return ()

        first_tool_name = tool_path[0]
        first_tool = tools.get(first_tool_name, {})
        first_fields = tuple(first_tool.get("param_fields", ()))
        first_effects = set(first_tool.get("side_effects", ()))
        ingress_points: list[IngressPoint] = []

        user_field = self._first_matching_field(
            first_fields,
            {"content", "url", "file_path", "query", "template", "command", "code"},
        )
        if user_field is not None:
            ingress_points.append(
                IngressPoint(
                    channel="user-source",
                    tool_name=first_tool_name,
                    tool_index=0,
                    field_name=user_field,
                    carrier=self._canonical_field(user_field) or "content",
                    mode="direct",
                    rationale=(
                        f"The first tool `{first_tool_name}` directly accepts user-controllable "
                        f"input through `{user_field}`."
                    ),
                )
            )

        if "external_input" in first_effects or "network_read" in first_effects or "file_read" in first_effects or "db_read" in first_effects:
            mode = "resource-based" if any(site.dependency_kind == "indirect" for site in dependency_sites[:1]) else "return-based"
            field_name = dependency_sites[0].source_field if dependency_sites else (user_field or "content")
            ingress_points.append(
                IngressPoint(
                    channel="env-source",
                    tool_name=first_tool_name,
                    tool_index=0,
                    field_name=field_name,
                    carrier=dependency_sites[0].carrier if dependency_sites else "content",
                    mode=mode,
                    rationale=(
                        f"The first tool `{first_tool_name}` ingests external content that can "
                        "propagate downstream."
                    ),
                )
            )

        deduped: list[IngressPoint] = []
        seen: set[tuple[str, str, str]] = set()
        for point in ingress_points:
            key = (point.channel, point.tool_name, point.field_name)
            if key in seen:
                continue
            seen.add(key)
            deduped.append(point)
        return tuple(deduped)

    def _first_matching_field(self, fields: Iterable[str], allowed_canonicals: set[str]) -> str | None:
        for field_name in fields:
            canonical = self._canonical_field(field_name)
            if canonical in allowed_canonicals:
                return field_name
        return None
