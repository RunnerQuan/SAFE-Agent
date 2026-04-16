from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any


class LLMResponseError(RuntimeError):
    """Raised when the model does not return parseable JSON."""


logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class ProviderProfile:
    name: str
    api_style: str
    default_base_url: str
    description: str


PROVIDER_PROFILES: dict[str, ProviderProfile] = {
    "deepseek": ProviderProfile(
        name="deepseek",
        api_style="openai_compatible",
        default_base_url="https://api.deepseek.com",
        description="DeepSeek OpenAI-compatible Chat Completions API",
    ),
    "moonshot": ProviderProfile(
        name="moonshot",
        api_style="openai_compatible",
        default_base_url="https://api.moonshot.cn/v1",
        description="Moonshot OpenAI-compatible API",
    ),
    "kimi": ProviderProfile(
        name="kimi",
        api_style="openai_compatible",
        default_base_url="https://api.moonshot.cn/v1",
        description="Kimi OpenAI-compatible API",
    ),
    "minimax": ProviderProfile(
        name="minimax",
        api_style="openai_compatible",
        default_base_url="https://api.minimaxi.com/v1",
        description="MiniMax OpenAI-compatible Chat Completions API",
    ),
    "siliconflow": ProviderProfile(
        name="siliconflow",
        api_style="openai_compatible",
        default_base_url="https://api.siliconflow.cn/v1",
        description="SiliconFlow OpenAI-compatible API",
    ),
    "dashscope": ProviderProfile(
        name="dashscope",
        api_style="openai_compatible",
        default_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        description="DashScope compatible-mode API for Qwen and other models",
    ),
    "glm": ProviderProfile(
        name="glm",
        api_style="openai_compatible",
        default_base_url="https://open.bigmodel.cn/api/paas/v4",
        description="Zhipu GLM OpenAI-compatible API",
    ),
}


class LLMClient:
    def __init__(
        self,
        *,
        provider: str,
        api_key: str,
        model: str,
        base_url: str | None = None,
        temperature: float = 0.0,
        request_timeout_seconds: int = 120,
    ) -> None:
        self.provider = provider.strip().lower()
        self.profile = get_provider_profile(self.provider)
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.request_timeout_seconds = request_timeout_seconds
        self.base_url = normalize_base_url(base_url or self.profile.default_base_url)
        self._client: Any | None = None

        if self.profile.api_style == "openai_compatible":
            try:
                from openai import OpenAI
            except ImportError as exc:
                raise RuntimeError("The openai package is required for OpenAI-compatible providers.") from exc
            self._client = OpenAI(api_key=api_key, base_url=self.base_url)

    def complete_json(
        self,
        system_prompt: str,
        user_payload: dict[str, Any],
        *,
        operation_name: str = "llm_call",
    ) -> dict[str, Any]:
        payload_text = json.dumps(user_payload, ensure_ascii=False)
        logger.info(
            "Starting LLM call: op=%s provider=%s model=%s payload_chars=%d",
            operation_name,
            self.provider,
            self.model,
            len(payload_text),
        )

        if self.profile.api_style == "openai_compatible":
            content = self._complete_openai_compatible(system_prompt, payload_text)
        elif self.profile.api_style == "anthropic_messages":
            content = self._complete_anthropic(system_prompt, payload_text)
        elif self.profile.api_style == "gemini_generate_content":
            content = self._complete_gemini(system_prompt, payload_text)
        else:
            raise RuntimeError(f"Unsupported provider api_style: {self.profile.api_style}")

        logger.info(
            "Completed LLM call: op=%s provider=%s response_chars=%d",
            operation_name,
            self.provider,
            len(content),
        )
        return parse_json_response(content)

    def _complete_openai_compatible(self, system_prompt: str, payload_text: str) -> str:
        assert self._client is not None
        request_kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload_text},
            ],
            "temperature": self.temperature,
            "stream": False,
        }

        # GLM supports OpenAI-style JSON mode and defaults to plain text output.
        # Force json_object here so judge/triage/security all return valid JSON.
        if self.provider == "glm":
            request_kwargs["response_format"] = {"type": "json_object"}

        response = self._client.chat.completions.create(
            **request_kwargs,
        )
        return response.choices[0].message.content or ""

    def _complete_anthropic(self, system_prompt: str, payload_text: str) -> str:
        url = f"{self.base_url}/v1/messages"
        response = http_post_json(
            url=url,
            headers={
                "content-type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
            },
            payload={
                "model": self.model,
                "system": system_prompt,
                "max_tokens": 4096,
                "temperature": self.temperature,
                "messages": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": payload_text}],
                    }
                ],
            },
            timeout=self.request_timeout_seconds,
        )
        content_blocks = response.get("content", [])
        texts = [
            item.get("text", "")
            for item in content_blocks
            if isinstance(item, dict) and item.get("type") == "text"
        ]
        return "\n".join(part for part in texts if part).strip()

    def _complete_gemini(self, system_prompt: str, payload_text: str) -> str:
        quoted_model = urllib.parse.quote(self.model, safe="")
        quoted_key = urllib.parse.quote(self.api_key, safe="")
        url = f"{self.base_url}/v1beta/models/{quoted_model}:generateContent?key={quoted_key}"
        response = http_post_json(
            url=url,
            headers={"content-type": "application/json"},
            payload={
                "system_instruction": {
                    "parts": [{"text": system_prompt}],
                },
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": payload_text}],
                    }
                ],
                "generationConfig": {
                    "temperature": self.temperature,
                    "responseMimeType": "application/json",
                },
            },
            timeout=self.request_timeout_seconds,
        )
        candidates = response.get("candidates", [])
        texts: list[str] = []
        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue
            content = candidate.get("content", {})
            parts = content.get("parts", []) if isinstance(content, dict) else []
            for part in parts:
                if isinstance(part, dict) and part.get("text"):
                    texts.append(str(part["text"]))
        return "\n".join(texts).strip()


def get_provider_profile(provider: str) -> ProviderProfile:
    key = provider.strip().lower()
    if key not in PROVIDER_PROFILES:
        supported = ", ".join(sorted(PROVIDER_PROFILES))
        raise ValueError(f"Unsupported llm.provider '{provider}'. Supported providers: {supported}")
    return PROVIDER_PROFILES[key]


def list_supported_providers() -> list[str]:
    return sorted(PROVIDER_PROFILES)


def normalize_base_url(base_url: str) -> str:
    return base_url.rstrip("/")


def http_post_json(
    *,
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    timeout: int,
) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(url=url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"LLM provider request failed: status={exc.code} url={url} body={error_body[:800]}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"LLM provider request failed: url={url} error={exc.reason}") from exc

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"LLM provider returned non-JSON response: {raw[:800]}") from exc
    if not isinstance(parsed, dict):
        raise RuntimeError(f"LLM provider returned invalid JSON object: {raw[:800]}")
    return parsed


def parse_json_response(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise LLMResponseError(f"Model did not return JSON. Raw response: {content[:600]}")
        candidate = text[start : end + 1]
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError as exc:
            raise LLMResponseError(f"Model returned invalid JSON. Raw response: {content[:600]}") from exc

    if not isinstance(parsed, dict):
        raise LLMResponseError(f"Expected JSON object. Raw response: {content[:600]}")
    return parsed
