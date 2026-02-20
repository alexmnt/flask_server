from __future__ import annotations

import json
import socket
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class AzureOpenAIConfig:
    endpoint: str
    api_key: str
    deployment: str
    api_version: str
    max_tokens: int
    temperature: float
    system_prompt: str


class ClippyConfigurationError(RuntimeError):
    """Raised when required Azure OpenAI settings are not present."""


@dataclass(frozen=True)
class AzureOpenAIRequestError(RuntimeError):
    message: str
    status_code: int

    def __str__(self) -> str:
        return self.message


def load_config(app_config: dict[str, Any]) -> AzureOpenAIConfig:
    endpoint = str(app_config.get("AZURE_OPENAI_ENDPOINT", "")).rstrip("/")
    api_key = str(app_config.get("AZURE_OPENAI_API_KEY", ""))
    deployment = str(app_config.get("AZURE_OPENAI_DEPLOYMENT", ""))
    api_version = str(app_config.get("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"))
    max_tokens = int(app_config.get("AZURE_OPENAI_MAX_TOKENS", 450))
    temperature = float(app_config.get("AZURE_OPENAI_TEMPERATURE", 0.65))
    system_prompt = str(app_config.get("AZURE_OPENAI_SYSTEM_PROMPT", "")).strip()

    missing = []
    if not endpoint:
        missing.append("AZURE_OPENAI_ENDPOINT")
    if not api_key:
        missing.append("AZURE_OPENAI_API_KEY")
    if not deployment:
        missing.append("AZURE_OPENAI_DEPLOYMENT")

    if missing:
        names = ", ".join(missing)
        raise ClippyConfigurationError(f"Missing Azure OpenAI config: {names}")

    return AzureOpenAIConfig(
        endpoint=endpoint,
        api_key=api_key,
        deployment=deployment,
        api_version=api_version,
        max_tokens=max_tokens,
        temperature=temperature,
        system_prompt=system_prompt
        or "You are Clippy, a practical desktop assistant. Be concise and actionable.",
    )


def stream_completion_tokens(config: AzureOpenAIConfig, user_message: str) -> Iterable[str]:
    url = (
        f"{config.endpoint}/openai/deployments/{config.deployment}/chat/completions"
        f"?api-version={config.api_version}"
    )
    payload = {
        "messages": [
            {"role": "system", "content": config.system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "stream": True,
    }
    body = json.dumps(payload).encode("utf-8")
    request = Request(
        url=url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "api-key": config.api_key,
        },
    )

    try:
        with urlopen(request, timeout=90) as response:
            for raw_line in response:
                line = raw_line.decode("utf-8", errors="ignore").strip()
                if not line or not line.startswith("data:"):
                    continue

                chunk = line[5:].strip()
                if chunk == "[DONE]":
                    break

                try:
                    parsed = json.loads(chunk)
                except json.JSONDecodeError:
                    continue

                choices = parsed.get("choices")
                if not isinstance(choices, list) or not choices:
                    continue

                choice = choices[0]
                if not isinstance(choice, dict):
                    continue

                delta = choice.get("delta")
                if not isinstance(delta, dict):
                    continue

                content = delta.get("content")
                if isinstance(content, str) and content:
                    yield content
    except HTTPError as exc:
        status_code = int(exc.code) if exc.code else int(HTTPStatus.BAD_GATEWAY)
        message = _read_error_message(exc)
        raise AzureOpenAIRequestError(
            message or f"Azure OpenAI request failed with status {status_code}.",
            status_code=status_code,
        ) from exc
    except (URLError, TimeoutError, socket.timeout) as exc:
        raise AzureOpenAIRequestError(
            "Unable to reach Azure OpenAI. Check network and endpoint settings.",
            status_code=int(HTTPStatus.BAD_GATEWAY),
        ) from exc


def _read_error_message(error: HTTPError) -> str:
    try:
        payload = error.read().decode("utf-8", errors="ignore")
    except Exception:
        return ""
    if not payload:
        return ""

    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError:
        return payload.strip()[:400]

    if not isinstance(parsed, dict):
        return payload.strip()[:400]

    error_obj = parsed.get("error")
    if isinstance(error_obj, dict):
        message = error_obj.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()

    message = parsed.get("message")
    if isinstance(message, str) and message.strip():
        return message.strip()

    return payload.strip()[:400]
