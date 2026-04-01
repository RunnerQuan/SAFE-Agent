from __future__ import annotations

import ast
import textwrap
from dataclasses import dataclass
from typing import Iterable

from ..schemas import SinkSite, SinkToolRecord
from .sink_catalog import SINK_API_SPECS, SinkAPISpec


class SinkIdentifier:
    """Find sink_tools by scanning tool source against the fixed sink API catalog."""

    def identify(self, framework_artifact: dict) -> Iterable[SinkToolRecord]:
        records: list[SinkToolRecord] = []
        tool_source_map = framework_artifact.get("tool_source_map", {})

        for tool_name, source in tool_source_map.items():
            analyzer = _ToolSinkAnalyzer(tool_name, source)
            sites = analyzer.find_sink_sites()
            if not sites:
                continue
            sink_sites = tuple(
                SinkSite(
                    tool_name=tool_name,
                    sink_type=site["sink_type"],
                    api=site["resolved_call"],
                    sink_argument=site["sink_argument"],
                    evidence=(
                        f"{site['function']}:{site['resolved_call']}:"
                        f"{','.join(site['sources'])}:line{site['line']}"
                    ),
                )
                for site in sorted(
                    sites,
                    key=lambda item: (
                        item["line"],
                        item["resolved_call"],
                        item["sink_argument"],
                    ),
                )
            )
            sink_types = sorted({site["sink_type"] for site in sites})
            evidence = tuple(
                sorted(
                    f"{site['function']}:{site['resolved_call']}:"
                    f"{','.join(site['sources'])}:{site['sink_argument']}:line{site['line']}"
                    for site in sites
                )
            )
            records.append(
                SinkToolRecord(
                    tool_name=tool_name,
                    sink_types=tuple(sink_types),
                    effects=tuple(sorted({site["sink_type"] for site in sites})),
                    evidence=evidence,
                    threat_families=tuple(sorted({site["sink_type"] for site in sites})),
                    sink_sites=sink_sites,
                )
            )

        return sorted(records, key=lambda item: item.tool_name)


class _ToolSinkAnalyzer:
    def __init__(self, tool_name: str, source: str) -> None:
        self.tool_name = tool_name
        self.source = textwrap.dedent(source or "")
        self.module = self._parse_module(self.source)
        self.import_aliases = self._collect_import_aliases(self.module) if self.module else {}

    def find_sink_sites(self) -> list[dict]:
        if self.module is None:
            return []

        sites: list[dict] = []
        for node in ast.walk(self.module):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            state = _FunctionState(
                params=self._collect_params(node),
                taint_map={name: {name} for name in self._collect_params(node)},
                object_types={},
                sink_sites=[],
            )
            self._process_statements(node.body, state, function_name=node.name)
            sites.extend(state.sink_sites)
        return sites

    def _parse_module(self, source: str) -> ast.Module | None:
        if not source.strip():
            return None
        try:
            return ast.parse(source)
        except SyntaxError:
            return None

    def _collect_import_aliases(self, module: ast.Module) -> dict[str, str]:
        aliases: dict[str, str] = {}
        for node in module.body:
            if isinstance(node, ast.Import):
                for alias in node.names:
                    aliases[alias.asname or alias.name] = alias.name
            elif isinstance(node, ast.ImportFrom):
                module_name = node.module or ""
                for alias in node.names:
                    full_name = f"{module_name}.{alias.name}" if module_name else alias.name
                    aliases[alias.asname or alias.name] = full_name
        return aliases

    def _collect_params(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> list[str]:
        params = [arg.arg for arg in node.args.args if arg.arg not in {"self", "cls"}]
        params.extend(arg.arg for arg in node.args.kwonlyargs if arg.arg not in {"self", "cls"})
        if node.args.vararg and node.args.vararg.arg not in {"self", "cls"}:
            params.append(node.args.vararg.arg)
        if node.args.kwarg and node.args.kwarg.arg not in {"self", "cls"}:
            params.append(node.args.kwarg.arg)
        return params

    def _process_statements(self, statements: list[ast.stmt], state: "_FunctionState", function_name: str) -> None:
        for statement in statements:
            self._visit_sink_calls(statement, state, function_name)

            if isinstance(statement, ast.Assign):
                sources = self._expr_sources(statement.value, state)
                object_type = self._infer_object_type(statement.value, state)
                for target in statement.targets:
                    self._assign_target(target, sources, object_type, state)
            elif isinstance(statement, ast.AnnAssign):
                sources = self._expr_sources(statement.value, state) if statement.value else set()
                object_type = self._infer_object_type(statement.value, state) if statement.value else None
                self._assign_target(statement.target, sources, object_type, state)
            elif isinstance(statement, ast.AugAssign):
                sources = self._expr_sources(statement.value, state) | self._expr_sources(statement.target, state)
                self._assign_target(statement.target, sources, None, state)
            elif isinstance(statement, ast.If):
                left = state.copy()
                right = state.copy()
                self._process_statements(statement.body, left, function_name)
                self._process_statements(statement.orelse, right, function_name)
                state.merge(left)
                state.merge(right)
            elif isinstance(statement, (ast.For, ast.AsyncFor, ast.While, ast.With, ast.AsyncWith, ast.Try)):
                nested_blocks = []
                if hasattr(statement, "body"):
                    nested_blocks.append(statement.body)
                if hasattr(statement, "orelse"):
                    nested_blocks.append(statement.orelse)
                if isinstance(statement, ast.Try):
                    nested_blocks.extend(handler.body for handler in statement.handlers)
                    nested_blocks.append(statement.finalbody)
                branch_state = state.copy()
                for block in nested_blocks:
                    self._process_statements(block, branch_state, function_name)
                state.merge(branch_state)

    def _visit_sink_calls(self, statement: ast.stmt, state: "_FunctionState", function_name: str) -> None:
        for node in ast.walk(statement):
            if not isinstance(node, ast.Call):
                continue
            resolved_call = self._resolve_call_name(node.func, state)
            if not resolved_call:
                continue
            matched_spec = self._match_sink_spec(resolved_call)
            if matched_spec is None:
                continue
            argument_exprs = self._sink_argument_exprs(node, matched_spec)
            for arg_expr in argument_exprs:
                sources = sorted(self._expr_sources(arg_expr, state))
                if not sources:
                    continue
                state.sink_sites.append(
                    {
                        "function": function_name,
                        "sink_type": matched_spec.sink_type,
                        "resolved_call": resolved_call,
                        "sink_argument": self._render_expr(arg_expr),
                        "sources": sources,
                        "line": getattr(node, "lineno", -1),
                    }
                )

    def _assign_target(
        self,
        target: ast.expr,
        sources: set[str],
        object_type: str | None,
        state: "_FunctionState",
    ) -> None:
        for name in self._extract_target_names(target):
            if sources:
                state.taint_map[name] = set(sources)
            if object_type:
                state.object_types[name] = object_type

    def _extract_target_names(self, target: ast.expr) -> list[str]:
        if isinstance(target, ast.Name):
            return [target.id]
        if isinstance(target, (ast.Tuple, ast.List)):
            names: list[str] = []
            for element in target.elts:
                names.extend(self._extract_target_names(element))
            return names
        return []

    def _expr_sources(self, expr: ast.AST | None, state: "_FunctionState") -> set[str]:
        if expr is None:
            return set()
        if isinstance(expr, ast.Name):
            return set(state.taint_map.get(expr.id, set()))
        if isinstance(expr, ast.Constant):
            return set()
        if isinstance(expr, ast.Attribute):
            return self._expr_sources(expr.value, state)
        if isinstance(expr, ast.Subscript):
            return self._expr_sources(expr.value, state) | self._expr_sources(expr.slice, state)
        if isinstance(expr, ast.Call):
            sources = self._expr_sources(expr.func, state)
            for arg in expr.args:
                sources |= self._expr_sources(arg, state)
            for keyword in expr.keywords:
                sources |= self._expr_sources(keyword.value, state)
            return sources
        if isinstance(expr, ast.JoinedStr):
            sources = set()
            for value in expr.values:
                sources |= self._expr_sources(value, state)
            return sources
        if isinstance(expr, ast.FormattedValue):
            return self._expr_sources(expr.value, state)
        if isinstance(expr, ast.BinOp):
            return self._expr_sources(expr.left, state) | self._expr_sources(expr.right, state)
        if isinstance(expr, ast.UnaryOp):
            return self._expr_sources(expr.operand, state)
        if isinstance(expr, ast.BoolOp):
            sources = set()
            for value in expr.values:
                sources |= self._expr_sources(value, state)
            return sources
        if isinstance(expr, ast.Compare):
            sources = self._expr_sources(expr.left, state)
            for comparator in expr.comparators:
                sources |= self._expr_sources(comparator, state)
            return sources
        if isinstance(expr, (ast.List, ast.Tuple, ast.Set)):
            sources = set()
            for elt in expr.elts:
                sources |= self._expr_sources(elt, state)
            return sources
        if isinstance(expr, ast.Dict):
            sources = set()
            for key in expr.keys:
                sources |= self._expr_sources(key, state)
            for value in expr.values:
                sources |= self._expr_sources(value, state)
            return sources
        return set()

    def _infer_object_type(self, expr: ast.AST | None, state: "_FunctionState") -> str | None:
        if not isinstance(expr, ast.Call):
            return None
        return self._resolve_call_name(expr.func, state)

    def _resolve_call_name(self, func: ast.AST, state: "_FunctionState") -> str:
        if isinstance(func, ast.Name):
            return self.import_aliases.get(func.id, func.id)
        if isinstance(func, ast.Attribute):
            base = self._resolve_attribute_base(func.value, state)
            return f"{base}.{func.attr}" if base else func.attr
        return ""

    def _resolve_attribute_base(self, value: ast.AST, state: "_FunctionState") -> str:
        if isinstance(value, ast.Name):
            if value.id in state.object_types:
                return state.object_types[value.id]
            return self.import_aliases.get(value.id, value.id)
        if isinstance(value, ast.Attribute):
            base = self._resolve_attribute_base(value.value, state)
            return f"{base}.{value.attr}" if base else value.attr
        if isinstance(value, ast.Call):
            return self._resolve_call_name(value.func, state)
        return ""

    def _match_sink_spec(self, resolved_call: str) -> SinkAPISpec | None:
        for spec in SINK_API_SPECS:
            if self._matches_spec(resolved_call, spec):
                return spec
        return None

    def _matches_spec(self, resolved_call: str, spec: SinkAPISpec) -> bool:
        for method in spec.methods:
            if method.endswith("*"):
                prefix = method[:-1]
                if resolved_call.startswith(f"{spec.package}.{prefix}") or resolved_call.endswith(f".{prefix}"):
                    return True
                continue

            if spec.class_name:
                qualified = f"{spec.package}.{spec.class_name}.{method}"
                if resolved_call == qualified or resolved_call.endswith(f".{spec.class_name}.{method}"):
                    return True
            else:
                qualified = f"{spec.package}.{method}"
                if resolved_call == qualified or resolved_call.endswith(f".{method}"):
                    if method in {"eval", "exec"} and resolved_call not in {method, f"builtins.{method}"}:
                        continue
                    return True

            if method == "cursor.execute" and resolved_call.endswith("cursor.execute"):
                return True
            if method == "request.urlopen" and resolved_call.endswith("request.urlopen"):
                return True
        if resolved_call.endswith(".execute"):
            lower = resolved_call.lower()
            if any(token in lower for token in ("cursor.execute", "session.execute", "connection.execute")):
                return spec.sink_type == "SQLi"
        return False

    def _sink_argument_exprs(self, call: ast.Call, spec: SinkAPISpec) -> list[ast.AST]:
        candidates: list[ast.AST] = []
        if call.args:
            candidates.append(call.args[0])
        for keyword in call.keywords:
            if keyword.arg and keyword.arg.lower() in spec.keyword_hints:
                candidates.append(keyword.value)
        return candidates

    def _render_expr(self, expr: ast.AST) -> str:
        try:
            return ast.unparse(expr)
        except Exception:
            return expr.__class__.__name__


@dataclass
class _FunctionState:
    params: list[str]
    taint_map: dict[str, set[str]]
    object_types: dict[str, str]
    sink_sites: list[dict]

    def copy(self) -> "_FunctionState":
        return _FunctionState(
            params=list(self.params),
            taint_map={key: set(value) for key, value in self.taint_map.items()},
            object_types=dict(self.object_types),
            sink_sites=list(self.sink_sites),
        )

    def merge(self, other: "_FunctionState") -> None:
        for key, value in other.taint_map.items():
            self.taint_map.setdefault(key, set()).update(value)
        self.object_types.update(other.object_types)
        for site in other.sink_sites:
            if site not in self.sink_sites:
                self.sink_sites.append(site)
