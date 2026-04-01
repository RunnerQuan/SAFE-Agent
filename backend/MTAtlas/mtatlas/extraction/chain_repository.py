from __future__ import annotations

import ast
import textwrap
from typing import Any

from ..schemas import ToolDefinition


class ChainRepository:
    """Builds normalized extraction input from the current target agent."""

    def build_artifact(
        self,
        framework: str,
        tool_definitions: list[ToolDefinition | dict[str, Any]],
        tool_source_map: dict[str, str],
    ) -> dict[str, Any]:
        normalized_tools = {}
        for tool in tool_definitions:
            normalized = self._normalize_tool_definition(tool)
            name = normalized["name"]
            if not name:
                continue
            source = tool_source_map.get(name, "")
            parameters = normalized["parameters"] or {}
            param_fields = self._parameter_fields(parameters)
            return_fields = normalized["return_fields"] or self._infer_return_fields(
                name,
                normalized["description"],
                param_fields,
                source,
            )
            side_effects = normalized["side_effects"] or self._infer_side_effects(
                name,
                normalized["description"],
                source,
            )
            normalized_tools[name] = {
                "name": name,
                "description": normalized["description"],
                "parameters": parameters,
                "required": tuple(parameters.get("required", ())),
                "param_fields": param_fields,
                "return_fields": return_fields,
                "side_effects": side_effects,
            }

        return {
            "framework": framework,
            "tool_definitions": tool_definitions,
            "tool_source_map": tool_source_map,
            "tools": normalized_tools,
        }

    def _normalize_tool_definition(self, tool: ToolDefinition | dict[str, Any]) -> dict[str, Any]:
        if isinstance(tool, ToolDefinition):
            return {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
                "return_fields": tuple(tool.return_fields),
                "side_effects": tuple(tool.side_effects),
            }
        return {
            "name": tool.get("name"),
            "description": tool.get("description", ""),
            "parameters": tool.get("parameters", {}) or {},
            "return_fields": tuple(tool.get("return_fields", ())),
            "side_effects": tuple(tool.get("side_effects", ())),
        }

    def _parameter_fields(self, parameters: dict[str, Any]) -> tuple[str, ...]:
        properties = parameters.get("properties", {}) or {}
        return tuple(sorted(str(name) for name in properties.keys()))

    def _infer_return_fields(
        self,
        tool_name: str,
        description: str,
        param_fields: tuple[str, ...],
        source: str,
    ) -> tuple[str, ...]:
        inferred: set[str] = set()
        module = self._parse_module(source)
        if module is not None:
            for node in ast.walk(module):
                if not isinstance(node, ast.Return):
                    continue
                inferred.update(self._return_fields_from_expr(node.value))

        text = f"{tool_name} {description}".lower()
        if any(token in text for token in ("url", "link", "uri")):
            inferred.add("url")
        if any(token in text for token in ("path", "file", "filename")):
            inferred.add("file_path")
        if any(token in text for token in ("read", "fetch", "load", "download", "content", "text")):
            inferred.add("content")
        if any(token in text for token in ("query", "search", "lookup")):
            inferred.add("query_result")
        if any(token in text for token in ("shell", "terminal", "command", "python", "repl", "stdout")):
            inferred.add("stdout")
        if any(token in text for token in ("template", "render")):
            inferred.add("rendered_output")

        # If the tool mostly echoes user-provided data, keep the param names as candidate return fields.
        for field_name in param_fields:
            if field_name in {"content", "text", "url", "path", "file_path", "query", "template", "code", "cmd"}:
                inferred.add(field_name)

        return tuple(sorted(inferred))

    def _infer_side_effects(
        self,
        tool_name: str,
        description: str,
        source: str,
    ) -> tuple[str, ...]:
        lowered = f"{tool_name} {description}\n{textwrap.dedent(source or '')}".lower()
        effects: set[str] = set()

        if any(token in lowered for token in ("requests.", "httpx.", "aiohttp.", "urllib", "download", "web", "search", "browse", "fetch")):
            effects.add("network_read")
        if any(token in lowered for token in ("subprocess.", "os.system", "os.popen", "shelltool", "shell tool")):
            effects.add("shell_execute")
        if any(token in lowered for token in ("eval(", "exec(", "pythonrepl", "python repl", "python_repl")):
            effects.add("code_execute")
        if any(token in lowered for token in ("jinja", "render_template_string", "from_string")):
            effects.add("template_render")
        if any(token in lowered for token in ("sqlite", "sqlalchemy", "cursor.execute", "select", "insert", "update", "delete")):
            effects.add("db_execute")
        if any(token in lowered for token in ("insert", "update", "delete", "create record", "write db", "save record")):
            effects.add("db_write")
        if any(token in lowered for token in ("select", "query", "fetch row", "read db", "load record")):
            effects.add("db_read")
        if any(token in lowered for token in ("open(", "read_text", ".read(", "load file", "read file")):
            effects.add("file_read")
        if any(token in lowered for token in ("write_text", "write_bytes", ".write(", "save file", "write file", "append file")):
            effects.add("file_write")
        if any(token in lowered for token in ("index", "vectorstore", "faiss", "chroma", "embedding store")):
            effects.add("index_store")
        if any(token in lowered for token in ("cache", "memoize")):
            effects.add("cache_store")

        # Reads from external resources are plausible env-source ingress points.
        if any(effect in effects for effect in ("network_read", "file_read", "db_execute")):
            effects.add("external_input")
        if any(effect in effects for effect in ("file_write", "index_store", "cache_store")):
            effects.add("persistent_write")

        return tuple(sorted(effects))

    def _parse_module(self, source: str) -> ast.Module | None:
        if not source.strip():
            return None
        try:
            return ast.parse(textwrap.dedent(source))
        except SyntaxError:
            return None

    def _return_fields_from_expr(self, expr: ast.AST | None) -> set[str]:
        if expr is None:
            return set()
        if isinstance(expr, ast.Dict):
            fields = set()
            for key in expr.keys:
                if isinstance(key, ast.Constant) and isinstance(key.value, str):
                    fields.add(key.value)
            return fields
        if isinstance(expr, ast.Name):
            return {expr.id}
        if isinstance(expr, ast.Attribute):
            return {expr.attr}
        if isinstance(expr, ast.Call):
            callee = self._callee_name(expr.func)
            if callee.endswith(".get") or callee.endswith(".post") or callee.endswith(".request") or "urlopen" in callee:
                return {"response", "content", "text", "url"}
            if "open" in callee:
                return {"file_path", "content"}
            if "execute" in callee:
                return {"result", "rows"}
            return {callee.split(".")[-1]} if callee else set()
        if isinstance(expr, ast.Constant) and isinstance(expr.value, str):
            return {"content"}
        return set()

    def _callee_name(self, func: ast.AST) -> str:
        if isinstance(func, ast.Name):
            return func.id
        if isinstance(func, ast.Attribute):
            base = self._callee_name(func.value)
            return f"{base}.{func.attr}" if base else func.attr
        return ""
