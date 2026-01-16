from flask import Blueprint, jsonify, request

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
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")
    return jsonify(message=message, length=len(message))
