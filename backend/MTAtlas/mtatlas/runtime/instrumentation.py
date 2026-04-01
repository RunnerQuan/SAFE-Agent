from __future__ import annotations

import builtins
import importlib
from contextlib import AbstractContextManager
from functools import wraps
from typing import Any, Callable


class SinkRuntimeRecorder(AbstractContextManager["SinkRuntimeRecorder"]):
    """Records runtime sink-API activity by monkeypatching common libraries."""

    def __init__(self, event_sink: list[dict[str, Any]]) -> None:
        self.event_sink = event_sink
        self._patches: list[tuple[Any, str, Any]] = []

    def __enter__(self) -> "SinkRuntimeRecorder":
        self._patch_common_sinks()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        while self._patches:
            owner, attr_name, original = self._patches.pop()
            setattr(owner, attr_name, original)

    def _patch_common_sinks(self) -> None:
        self._patch_subprocess()
        self._patch_os()
        self._patch_requests_family()
        self._patch_urllib()
        self._patch_sqlite()
        self._patch_sqlalchemy()
        self._patch_jinja_and_flask()
        self._patch_builtins()

    def _patch_subprocess(self) -> None:
        subprocess = self._import_optional("subprocess")
        if subprocess is None:
            return
        self._install_wrapper(subprocess, "run", self._command_wrapper("subprocess.run"))
        self._install_wrapper(subprocess, "call", self._command_wrapper("subprocess.call"))
        self._install_wrapper(subprocess, "check_call", self._command_wrapper("subprocess.check_call"))
        self._install_wrapper(subprocess, "getoutput", self._command_wrapper("subprocess.getoutput"))
        self._install_wrapper(subprocess, "Popen", self._command_wrapper("subprocess.Popen"))

    def _patch_os(self) -> None:
        import os

        self._install_wrapper(os, "system", self._command_wrapper("os.system"))
        self._install_wrapper(os, "popen", self._command_wrapper("os.popen"))
        for attr_name in (
            "execv",
            "execve",
            "execl",
            "execlp",
            "execvp",
            "spawnv",
            "spawnve",
            "spawnvp",
        ):
            self._install_wrapper(os, attr_name, self._command_wrapper(f"os.{attr_name}"))

    def _patch_requests_family(self) -> None:
        requests = self._import_optional("requests")
        if requests is None:
            return
        for attr_name in ("get", "post", "request"):
            self._install_wrapper(requests, attr_name, self._request_wrapper(f"requests.{attr_name}"))
        session = getattr(requests, "Session", None)
        if session is not None:
            for attr_name in ("get", "post", "request"):
                self._install_wrapper(session, attr_name, self._request_wrapper(f"requests.Session.{attr_name}"))

        httpx = self._import_optional("httpx")
        if httpx is not None:
            client = getattr(httpx, "AsyncClient", None)
            if client is not None:
                for attr_name in ("get", "post", "request"):
                    self._install_wrapper(client, attr_name, self._request_wrapper(f"httpx.AsyncClient.{attr_name}"))

        aiohttp = self._import_optional("aiohttp")
        if aiohttp is not None:
            client_session = getattr(aiohttp, "ClientSession", None)
            if client_session is not None:
                for attr_name in ("get", "post", "request"):
                    self._install_wrapper(client_session, attr_name, self._request_wrapper(f"aiohttp.ClientSession.{attr_name}"))

        urllib3 = self._import_optional("urllib3")
        if urllib3 is not None:
            pool = getattr(urllib3, "PoolManager", None)
            if pool is not None:
                for attr_name in ("urlopen", "request"):
                    self._install_wrapper(pool, attr_name, self._request_wrapper(f"urllib3.PoolManager.{attr_name}"))
            self._install_wrapper(urllib3, "request", self._request_wrapper("urllib3.request"))

    def _patch_urllib(self) -> None:
        urllib_request = self._import_optional("urllib.request")
        if urllib_request is None:
            return
        self._install_wrapper(urllib_request, "urlopen", self._request_wrapper("urllib.request.urlopen"))

    def _patch_builtins(self) -> None:
        self._install_wrapper(builtins, "eval", self._code_wrapper("builtins.eval"))
        self._install_wrapper(builtins, "exec", self._code_wrapper("builtins.exec"))

    def _patch_sqlite(self) -> None:
        sqlite3 = self._import_optional("sqlite3")
        if sqlite3 is None:
            return
        cursor_cls = getattr(sqlite3, "Cursor", None)
        if cursor_cls is not None:
            self._install_wrapper(cursor_cls, "execute", self._query_wrapper("sqlite3.Cursor.execute"))

    def _patch_sqlalchemy(self) -> None:
        orm = self._import_optional("sqlalchemy.orm")
        if orm is not None:
            session_cls = getattr(orm, "Session", None)
            if session_cls is not None:
                self._install_wrapper(session_cls, "execute", self._query_wrapper("sqlalchemy.Session.execute"))
        engine = self._import_optional("sqlalchemy.engine")
        if engine is not None:
            connection_cls = getattr(engine, "Connection", None)
            if connection_cls is not None:
                self._install_wrapper(connection_cls, "execute", self._query_wrapper("sqlalchemy.Connection.execute"))

    def _patch_jinja_and_flask(self) -> None:
        jinja2 = self._import_optional("jinja2")
        if jinja2 is not None:
            environment_cls = getattr(jinja2, "Environment", None)
            if environment_cls is not None:
                self._install_wrapper(environment_cls, "from_string", self._template_wrapper("jinja2.Environment.from_string"))

        flask = self._import_optional("flask")
        if flask is not None:
            self._install_wrapper(flask, "render_template_string", self._render_template_string_wrapper("flask.render_template_string"))

    def _install_wrapper(
        self,
        owner: Any,
        attr_name: str,
        wrapper_builder: Callable[[Callable[..., Any]], Callable[..., Any]],
    ) -> None:
        if owner is None or not hasattr(owner, attr_name):
            return
        try:
            original = getattr(owner, attr_name)
        except Exception:
            return
        if not callable(original):
            return
        try:
            wrapped = wrapper_builder(original)
            setattr(owner, attr_name, wrapped)
            self._patches.append((owner, attr_name, original))
        except Exception:
            return

    def _command_wrapper(self, api_name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def builder(original: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(original)
            def wrapped(*args, **kwargs):
                command = self._extract_command(args, kwargs)
                event = {
                    "event": "sink_api_call",
                    "sink_type": "CMDi",
                    "api": api_name,
                    "command": command,
                    "arguments_preview": self._preview({"args": args, "kwargs": kwargs}),
                }
                try:
                    result = original(*args, **kwargs)
                    event["status"] = "success"
                    event["result_preview"] = self._preview(result)
                    return result
                except Exception as exc:
                    event["status"] = "failed"
                    event["exception_type"] = type(exc).__name__
                    event["result_preview"] = self._preview(exc)
                    raise
                finally:
                    self.event_sink.append(event)

            return wrapped

        return builder

    def _request_wrapper(self, api_name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def builder(original: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(original)
            def wrapped(*args, **kwargs):
                destination = self._extract_destination(args, kwargs)
                event = {
                    "event": "sink_api_call",
                    "sink_type": "SSRF",
                    "api": api_name,
                    "destination": destination,
                    "arguments_preview": self._preview({"args": args, "kwargs": kwargs}),
                }
                try:
                    result = original(*args, **kwargs)
                    event["status"] = "success"
                    event["result_preview"] = self._preview(result)
                    return result
                except Exception as exc:
                    event["status"] = "failed"
                    event["exception_type"] = type(exc).__name__
                    event["result_preview"] = self._preview(exc)
                    raise
                finally:
                    self.event_sink.append(event)

            return wrapped

        return builder

    def _code_wrapper(self, api_name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def builder(original: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(original)
            def wrapped(*args, **kwargs):
                code = self._extract_first_payload(args, kwargs)
                event = {
                    "event": "sink_api_call",
                    "sink_type": "CODEi",
                    "api": api_name,
                    "code": code,
                    "arguments_preview": self._preview({"args": args, "kwargs": kwargs}),
                }
                try:
                    result = original(*args, **kwargs)
                    event["status"] = "success"
                    event["result_preview"] = self._preview(result)
                    return result
                except Exception as exc:
                    event["status"] = "failed"
                    event["exception_type"] = type(exc).__name__
                    event["result_preview"] = self._preview(exc)
                    raise
                finally:
                    self.event_sink.append(event)

            return wrapped

        return builder

    def _query_wrapper(self, api_name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def builder(original: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(original)
            def wrapped(*args, **kwargs):
                query = self._extract_query(args, kwargs)
                event = {
                    "event": "sink_api_call",
                    "sink_type": "SQLi",
                    "api": api_name,
                    "query": query,
                    "arguments_preview": self._preview({"args": args, "kwargs": kwargs}),
                }
                try:
                    result = original(*args, **kwargs)
                    event["status"] = "success"
                    event["result_preview"] = self._preview(result)
                    return result
                except Exception as exc:
                    event["status"] = "failed"
                    event["exception_type"] = type(exc).__name__
                    event["result_preview"] = self._preview(exc)
                    raise
                finally:
                    self.event_sink.append(event)

            return wrapped

        return builder

    def _template_wrapper(self, api_name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def builder(original: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(original)
            def wrapped(*args, **kwargs):
                template_source = self._extract_first_payload(args, kwargs)
                event = {
                    "event": "sink_api_call",
                    "sink_type": "SSTI",
                    "api": api_name,
                    "template": template_source,
                    "arguments_preview": self._preview({"args": args, "kwargs": kwargs}),
                    "status": "success",
                }
                template_obj = original(*args, **kwargs)
                self.event_sink.append(event)
                render = getattr(template_obj, "render", None)
                if callable(render):
                    template_obj.render = self._wrap_render(template_obj.render, template_source)
                return template_obj

            return wrapped

        return builder

    def _render_template_string_wrapper(self, api_name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def builder(original: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(original)
            def wrapped(*args, **kwargs):
                template_source = self._extract_first_payload(args, kwargs)
                event = {
                    "event": "sink_api_call",
                    "sink_type": "SSTI",
                    "api": api_name,
                    "template": template_source,
                    "arguments_preview": self._preview({"args": args, "kwargs": kwargs}),
                }
                try:
                    result = original(*args, **kwargs)
                    event["status"] = "success"
                    event["rendered_output"] = self._preview(result)
                    return result
                except Exception as exc:
                    event["status"] = "failed"
                    event["exception_type"] = type(exc).__name__
                    event["result_preview"] = self._preview(exc)
                    raise
                finally:
                    self.event_sink.append(event)

            return wrapped

        return builder

    def _wrap_render(self, original: Callable[..., Any], template_source: str) -> Callable[..., Any]:
        @wraps(original)
        def wrapped(*args, **kwargs):
            event = {
                "event": "template_render",
                "sink_type": "SSTI",
                "api": "template.render",
                "template": template_source,
                "arguments_preview": self._preview({"args": args, "kwargs": kwargs}),
            }
            try:
                result = original(*args, **kwargs)
                event["status"] = "success"
                event["rendered_output"] = self._preview(result)
                return result
            except Exception as exc:
                event["status"] = "failed"
                event["exception_type"] = type(exc).__name__
                event["result_preview"] = self._preview(exc)
                raise
            finally:
                self.event_sink.append(event)

        return wrapped

    def _extract_command(self, args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
        if "args" in kwargs:
            return self._preview(kwargs["args"])
        if args:
            return self._preview(args[0])
        return ""

    def _extract_destination(self, args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
        if "url" in kwargs:
            return str(kwargs["url"])
        if len(args) >= 2 and isinstance(args[1], str):
            return args[1]
        if args and isinstance(args[0], str):
            return args[0]
        return self._preview(args[0]) if args else ""

    def _extract_query(self, args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
        if "statement" in kwargs:
            return str(kwargs["statement"])
        if "query" in kwargs:
            return str(kwargs["query"])
        if len(args) >= 2 and isinstance(args[1], str):
            return args[1]
        if args and isinstance(args[0], str):
            return args[0]
        return ""

    def _extract_first_payload(self, args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
        if kwargs:
            first_value = next(iter(kwargs.values()))
            return self._preview(first_value)
        if args:
            if len(args) >= 2 and not isinstance(args[0], str):
                return self._preview(args[1])
            return self._preview(args[0])
        return ""

    def _preview(self, value: Any, limit: int = 300) -> str:
        text = value if isinstance(value, str) else repr(value)
        return text[:limit]

    def _import_optional(self, module_name: str) -> Any | None:
        try:
            return importlib.import_module(module_name)
        except Exception:
            return None
