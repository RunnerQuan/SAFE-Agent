from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any

try:
    import tiktoken  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    tiktoken = None

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional dependency
    load_dotenv = None

try:
    from openai import AzureOpenAI, OpenAI
except Exception:  # pragma: no cover - optional dependency
    AzureOpenAI = None
    OpenAI = None

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = PROJECT_ROOT / ".env"
if load_dotenv is not None:
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH, override=False)
    else:  # pragma: no cover - fallback to default discovery
        load_dotenv(override=False)


class LLMTask(str, Enum):
    SEED_PROMPT_GENERATION = "seed_prompt_generation"
    TOOL_BACKWARD_ANALYSIS = "tool_backward_analysis"
    CHAIN_SEMANTIC_FILTER = "chain_semantic_filter"
    SOURCE_RISK_ASSESSMENT = "source_risk_assessment"
    TPS_CONSTRAINT_GENERATION = "tps_constraint_generation"
    TPS_PROMPT_REPAIR = "tps_prompt_repair"
    INJECTION_PLANNING = "injection_planning"
    ENV_CONTENT_GENERATION = "env_content_generation"
    PAYLOAD_MUTATION = "payload_mutation"
    FALSE_POSITIVE_REVIEW = "false_positive_review"


@dataclass(frozen=True)
class LLMCall:
    task: LLMTask
    system_prompt: str
    user_prompt: str
    temperature: float = 0.0


@dataclass(frozen=True)
class LLMResult:
    text: str
    input_tokens: int
    output_tokens: int
    latency_seconds: float


@dataclass(frozen=True)
class LLMConfig:
    provider: str
    model: str
    api_key: str
    base_url: str = ""
    azure_endpoint: str = ""
    api_version: str = "2024-02-01"
    max_output_tokens: int = 8192


class LLMClient:
    """Thin LLM boundary with task-level accounting."""

    def complete(self, call: LLMCall) -> LLMResult:
        raise NotImplementedError


class NullLLMClient(LLMClient):
    """Explicit no-op client used when a module should stay deterministic."""

    def complete(self, call: LLMCall) -> LLMResult:
        raise RuntimeError(f"No LLM client configured for task: {call.task.value}")


class QueryLLMClient(LLMClient):
    """Standalone OpenAI/Azure OpenAI client with light accounting."""

    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self.history: list[dict[str, Any]] = []
        self.client = self._build_client(config)

    def complete(self, call: LLMCall) -> LLMResult:
        started = time.time()
        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": call.system_prompt},
                {"role": "user", "content": call.user_prompt},
            ],
            temperature=call.temperature,
            max_tokens=self.config.max_output_tokens,
        )
        text = response.choices[0].message.content or ""
        latency = time.time() - started
        result = LLMResult(
            text=text,
            input_tokens=self._count_tokens(call.system_prompt) + self._count_tokens(call.user_prompt),
            output_tokens=self._count_tokens(text),
            latency_seconds=latency,
        )
        self.history.append(
            {
                "task": call.task.value,
                "latency_seconds": latency,
                "input_tokens": result.input_tokens,
                "output_tokens": result.output_tokens,
                "provider": self.config.provider,
                "model": self.config.model,
            }
        )
        return result

    def _build_client(self, config: LLMConfig) -> Any:
        if config.provider == "azure":
            if AzureOpenAI is None:
                raise RuntimeError("openai package with AzureOpenAI support is unavailable.")
            return AzureOpenAI(
                api_key=config.api_key,
                api_version=config.api_version,
                azure_endpoint=config.azure_endpoint,
            )
        if OpenAI is None:
            raise RuntimeError("openai package is unavailable.")
        client_kwargs: dict[str, Any] = {"api_key": config.api_key}
        if config.base_url:
            client_kwargs["base_url"] = config.base_url
        return OpenAI(**client_kwargs)

    def _count_tokens(self, text: str) -> int:
        if not text:
            return 0
        if tiktoken is None:
            return max(1, len(text) // 4)
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
        except Exception:  # pragma: no cover - defensive fallback
            return max(1, len(text) // 4)
        return len(encoding.encode(text))


def build_llm_client_from_env() -> LLMClient | None:
    """Build a standalone MTAtlas LLM client from local env configuration."""

    azure_api_key = _env("MTATLAS_AZURE_API_KEY")
    azure_endpoint = _env("MTATLAS_AZURE_ENDPOINT")
    azure_model = _env("MTATLAS_AZURE_MODEL")
    if azure_api_key and azure_endpoint and azure_model:
        return QueryLLMClient(
            LLMConfig(
                provider="azure",
                model=azure_model,
                api_key=azure_api_key,
                azure_endpoint=azure_endpoint,
                api_version=_env("MTATLAS_AZURE_API_VERSION", "2024-02-01"),
                max_output_tokens=_env_int("MTATLAS_MAX_OUTPUT_TOKENS", 8192),
            )
        )

    openai_api_key = _env("MTATLAS_OPENAI_API_KEY") or _env("OPENAI_API_KEY")
    openai_model = _env("MTATLAS_OPENAI_MODEL") or _env("OPENAI_MODEL")
    if openai_api_key and openai_model:
        return QueryLLMClient(
            LLMConfig(
                provider="openai",
                model=openai_model,
                api_key=openai_api_key,
                base_url=_env("MTATLAS_OPENAI_BASE_URL") or _env("OPENAI_BASE_URL"),
                max_output_tokens=_env_int("MTATLAS_MAX_OUTPUT_TOKENS", 8192),
            )
        )

    return None


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _env_int(name: str, default: int) -> int:
    value = _env(name)
    if not value:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def parse_json_response(text: str) -> dict[str, Any] | None:
    """Best-effort JSON parser for structured LLM outputs."""

    text = text.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
