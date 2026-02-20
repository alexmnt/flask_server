from http import HTTPStatus

import json
from typing import Any

from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context

from backend.services.clippy import (
    AzureOpenAIRequestError,
    ClippyConfigurationError,
    load_config,
    stream_completion_tokens,
)
from backend.services.time import utc_now

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.get("/health")
def health():
    return jsonify(
        status="ok",
        server_time=utc_now().isoformat(),
    )


@api_bp.post("/echo")
def echo():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Invalid JSON payload."), HTTPStatus.BAD_REQUEST
    message = data.get("message", "")
    if not isinstance(message, str):
        return jsonify(error="Message must be a string."), HTTPStatus.BAD_REQUEST
    message = message.strip()
    max_len = current_app.config.get("MAX_ECHO_LENGTH", 200)
    if len(message) > max_len:
        return (
            jsonify(error=f"Message exceeds {max_len} characters."),
            HTTPStatus.BAD_REQUEST,
        )
    return jsonify(message=message, length=len(message))


@api_bp.post("/clippy/stream")
def clippy_stream():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Invalid JSON payload."), HTTPStatus.BAD_REQUEST

    message = data.get("message", "")
    if not isinstance(message, str):
        return jsonify(error="Message must be a string."), HTTPStatus.BAD_REQUEST

    cleaned = message.strip()
    if not cleaned:
        return jsonify(error="Message cannot be empty."), HTTPStatus.BAD_REQUEST

    if len(cleaned) > 2000:
        return jsonify(error="Message exceeds 2000 characters."), HTTPStatus.BAD_REQUEST

    try:
        clippy_config = load_config(current_app.config)
    except ClippyConfigurationError as exc:
        return jsonify(error=str(exc)), HTTPStatus.SERVICE_UNAVAILABLE

    def event_stream():
        try:
            yield _format_sse("status", {"state": "streaming"})
            for token in stream_completion_tokens(clippy_config, cleaned):
                yield _format_sse("token", {"value": token})
            yield _format_sse("done", {"ok": True})
        except AzureOpenAIRequestError as exc:
            yield _format_sse("error", {"message": str(exc)})
        except Exception:
            current_app.logger.exception("Unexpected Clippy stream failure")
            yield _format_sse("error", {"message": "Unexpected server error."})

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return Response(
        stream_with_context(event_stream()),
        mimetype="text/event-stream",
        headers=headers,
    )


def _format_sse(event: str, payload: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"
