import json
import re
from openai import OpenAI
from config import LLM_PROVIDER_CONFIG


def call_llm(
    prompt: str,
    provider: str,
    model: str,
    system_prompt: str = "You are a helpful assistant."
) -> dict:
    """
    Unified LLM call interface.

    Args:
        prompt (str): User prompt.
        provider (str): LLM provider, one of {"gpt", "deepseek", "qwen"}.
        model (str): Concrete model name (e.g., "gpt-4.1", "qwen-plus").
        system_prompt (str): Optional system prompt.

    Returns:
        dict: {
            "content": str,
            "usage": {
                "prompt_tokens": int,
                "completion_tokens": int,
                "total_tokens": int
            }
        }
    """
    if provider not in LLM_PROVIDER_CONFIG:
        raise ValueError(f"Unsupported provider: {provider}")

    cfg = LLM_PROVIDER_CONFIG[provider]

    try:
        client = OpenAI(
            api_key=cfg["api_key"],
            base_url=cfg["base_url"]
        )

        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ]
        )

        content = completion.choices[0].message.content

        usage_raw = getattr(completion, "usage", None)
        usage = {
            "prompt_tokens": getattr(usage_raw, "prompt_tokens", 0),
            "completion_tokens": getattr(usage_raw, "completion_tokens", 0),
            "total_tokens": getattr(usage_raw, "total_tokens", 0)
        } if usage_raw else {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }

        print(content)
        return {"content": content, "usage": usage}

    except Exception as e:
        print(f"[LLM Error][{provider}:{model}] {e}")
        return {
            "content": "",
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        }




def extract_json_from_output(llm_output: str):
    match = re.search(r'\{.*\}', llm_output, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM output.")
    json_str = match.group(0).strip()
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        json_str_fixed = re.sub(r',\s*([}\]])', r'\1', json_str)
        try:
            return json.loads(json_str_fixed)
        except Exception:
            raise ValueError(f"Failed to parse JSON from LLM output.\n"
                             f"Original output:\n{llm_output}\n\nError: {e}")
