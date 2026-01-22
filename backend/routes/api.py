from http import HTTPStatus

from flask import Blueprint, current_app, jsonify, request

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
