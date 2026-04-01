from __future__ import annotations

import ast
import textwrap
from typing import Any

from ..schemas import ToolDefinition


class MetadataToolNormalizer:
    """Converts fixed static-pure tool metadata into MTAtlas extraction inputs."""

    def normalize(
        self,
        raw_tools: list[dict[str, str]],
    ) -> tuple[list[ToolDefinition], dict[str, str], dict[str, dict[str, Any]]]:
        tool_definitions: list[ToolDefinition] = []
        tool_source_map: dict[str, str] = {}
        normalized_records: dict[str, dict[str, Any]] = {}

        for raw_tool in raw_tools:
            tool_name = self._tool_name(raw_tool["func_signature"])
            source = textwrap.dedent(raw_tool["code"]).strip("\n")
            description = raw_tool["description"]
            mcp_name = raw_tool["MCP"]
            function_node = self._find_function_node(source, tool_name)
            input_params, injected_params, parameter_schema = self._extract_parameters(function_node)
            return_shape = self._infer_return_shape(function_node, source)
            return_fields = self._infer_return_fields(tool_name, description, input_params, function_node, source)
            side_effects = self._infer_side_effects(tool_name, description, source)
            content_sources = self._infer_content_sources(tool_name, description, side_effects, source)

            tool_definitions.append(
                ToolDefinition(
                    name=tool_name,
                    description=description,
                    parameters=parameter_schema,
                    return_fields=tuple(return_fields),
                    side_effects=tuple(side_effects),
                )
            )
            tool_source_map[tool_name] = source
            normalized_records[tool_name] = {
                "tool_name": tool_name,
                "mcp_name": mcp_name,
                "description": description,
                "source_code": source,
                "input_params": input_params,
                "injected_params": injected_params,
                "return_shape": return_shape,
                "return_fields": tuple(return_fields),
                "side_effects": tuple(side_effects),
                "content_sources": tuple(content_sources),
            }

        return tool_definitions, tool_source_map, normalized_records

    def _tool_name(self, func_signature: str) -> str:
        signature = func_signature.strip()
        if "(" in signature:
            signature = signature.split("(", 1)[0].strip()
        return signature

    def _find_function_node(self, source: str, expected_name: str) -> ast.FunctionDef | ast.AsyncFunctionDef | None:
        try:
            module = ast.parse(source)
        except SyntaxError:
            return None
        for node in module.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == expected_name:
                return node
        for node in module.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                return node
        return None

    def _extract_parameters(
        self,
        node: ast.FunctionDef | ast.AsyncFunctionDef | None,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
        if node is None:
            return [], [], {"type": "object", "properties": {}, "required": []}

        input_params: list[dict[str, Any]] = []
        injected_params: list[dict[str, Any]] = []
        properties: dict[str, Any] = {}
        required: list[str] = []

        positional = list(node.args.args)
        positional_defaults = [None] * (len(positional) - len(node.args.defaults)) + list(node.args.defaults)
        for arg, default in zip(positional, positional_defaults):
            if arg.arg in {"self", "cls"}:
                continue
            record = self._parameter_record(arg, default)
            if record["kind"] == "depends_injection":
                injected_params.append(record)
                continue
            input_params.append(record)
            properties[arg.arg] = {"type": self._json_type(record["type"])}
            if record["required"]:
                required.append(arg.arg)

        for arg, default in zip(node.args.kwonlyargs, node.args.kw_defaults):
            if arg.arg in {"self", "cls"}:
                continue
            record = self._parameter_record(arg, default)
            if record["kind"] == "depends_injection":
                injected_params.append(record)
                continue
            input_params.append(record)
            properties[arg.arg] = {"type": self._json_type(record["type"])}
            if record["required"]:
                required.append(arg.arg)

        return input_params, injected_params, {"type": "object", "properties": properties, "required": required}

    def _parameter_record(self, arg: ast.arg, default: ast.AST | None) -> dict[str, Any]:
        annotation_text = self._annotation_text(arg.annotation)
        kind = "depends_injection" if self._is_injected(annotation_text, default) else "user_input"
        return {
            "name": arg.arg,
            "type": annotation_text or "Any",
            "kind": kind,
            "required": default is None and kind == "user_input",
        }

    def _annotation_text(self, annotation: ast.AST | None) -> str:
        if annotation is None:
            return ""
        try:
            return ast.unparse(annotation)
        except Exception:
            return ""

    def _is_injected(self, annotation_text: str, default: ast.AST | None) -> bool:
        lowered = annotation_text.lower()
        if "depends(" in lowered or "annotated[" in lowered and "depends" in lowered:
            return True
        if isinstance(default, ast.Call):
            callee = self._callee_name(default.func).lower()
            if callee.endswith("depends"):
                return True
        return False

    def _json_type(self, annotation_text: str) -> str:
        lowered = annotation_text.lower()
        if "int" in lowered:
            return "integer"
        if "float" in lowered:
            return "number"
        if "bool" in lowered:
            return "boolean"
        if "list" in lowered or "tuple" in lowered or "sequence" in lowered:
            return "array"
        if "dict" in lowered or "mapping" in lowered:
            return "object"
        return "string"

    def _infer_return_shape(
        self,
        node: ast.FunctionDef | ast.AsyncFunctionDef | None,
        source: str,
    ) -> str:
        if node is not None:
            annotation = self._annotation_text(node.returns).lower()
            if "str" in annotation:
                return "text"
            if "dict" in annotation or "mapping" in annotation:
                return "object"
            if "list" in annotation or "tuple" in annotation:
                return "list"
            if "path" in annotation:
                return "path"
        lowered = source.lower()
        if "return {" in lowered:
            return "object"
        if "return [" in lowered or "return (" in lowered:
            return "list"
        return "text"

    def _infer_return_fields(
        self,
        tool_name: str,
        description: str,
        input_params: list[dict[str, Any]],
        node: ast.FunctionDef | ast.AsyncFunctionDef | None,
        source: str,
    ) -> list[str]:
        inferred: set[str] = set()
        if node is not None:
            for statement in ast.walk(node):
                if not isinstance(statement, ast.Return):
                    continue
                inferred.update(self._return_fields_from_expr(statement.value))

        lowered = f"{tool_name} {description} {source}".lower()
        if any(token in lowered for token in ("email", "subject", "body", "recipient", "sender", "message")):
            inferred.update({"content", "email_content", "body"})
        if any(token in lowered for token in ("url", "link", "href", "uri")):
            inferred.add("url")
        if any(token in lowered for token in ("path", "file", "filename")):
            inferred.add("file_path")
        if any(token in lowered for token in ("content", "text", "html", "markdown", "document")):
            inferred.add("content")
        if any(token in lowered for token in ("query result", "rows", "record", "search result")):
            inferred.add("result")
        for param in input_params:
            if param["name"] in {"content", "text", "body", "url", "path", "file_path", "query", "template", "code", "command"}:
                inferred.add(param["name"])
        return sorted(inferred or {"content"})

    def _infer_side_effects(self, tool_name: str, description: str, source: str) -> list[str]:
        lowered = f"{tool_name} {description}\n{source}".lower()
        effects: set[str] = set()
        if any(token in lowered for token in ("email", "mailbox", "messages", "inbox")):
            effects.add("email_read")
        if any(token in lowered for token in ("requests.", "httpx.", "aiohttp.", "urllib", "download", "web", "browse", "fetch")):
            effects.add("network_read")
        if any(token in lowered for token in ("subprocess.", "os.system", "os.popen", "shell")):
            effects.add("shell_execute")
        if any(token in lowered for token in ("eval(", "exec(", "pythonrepl", "python repl", "python_repl")):
            effects.add("code_execute")
        if any(token in lowered for token in ("jinja", "render_template_string", "from_string")):
            effects.add("template_render")
        if any(token in lowered for token in ("sqlite", "sqlalchemy", "cursor.execute", "select", "insert", "update", "delete")):
            effects.add("db_execute")
        if any(token in lowered for token in ("insert", "update", "delete", "create record", "save record", "write db")):
            effects.add("db_write")
        if any(token in lowered for token in ("select", "query", "fetch row", "load record", "read db")):
            effects.add("db_read")
        if any(token in lowered for token in ("open(", "read_text", ".read(", "load file", "read file")):
            effects.add("file_read")
        if any(token in lowered for token in ("write_text", "write_bytes", ".write(", "save file", "write file", "append file")):
            effects.add("file_write")
        if any(token in lowered for token in ("index", "vectorstore", "faiss", "chroma", "embedding store", "retrieve")):
            effects.add("index_store")
        if any(token in lowered for token in ("cache", "memoize")):
            effects.add("cache_store")

        if effects & {"email_read", "network_read", "file_read", "db_read", "db_execute"}:
            effects.add("external_input")
        if effects & {"file_write", "db_write", "index_store", "cache_store"}:
            effects.add("persistent_write")
        return sorted(effects)

    def _infer_content_sources(
        self,
        tool_name: str,
        description: str,
        side_effects: list[str],
        source: str,
    ) -> list[str]:
        lowered = f"{tool_name} {description}\n{source}".lower()
        sources: set[str] = set()
        if "email_read" in side_effects or any(token in lowered for token in ("email", "mailbox", "inbox", "messages")):
            sources.add("email_store")
        if "network_read" in side_effects:
            sources.add("web_content")
        if "file_read" in side_effects:
            sources.add("file_content")
        if "db_read" in side_effects or "db_execute" in side_effects:
            sources.add("database_record")
        if "index_store" in side_effects:
            sources.add("indexed_document")
        if "cache_store" in side_effects:
            sources.add("cached_content")
        return sorted(sources)

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
        if isinstance(expr, ast.JoinedStr):
            return {"content", "text"}
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
