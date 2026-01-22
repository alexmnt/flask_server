import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = BASE_DIR / "frontend" / "templates"
STATIC_DIR = BASE_DIR / "frontend" / "static"


class BaseConfig:
    JSON_SORT_KEYS = False
    VITE_DEV_SERVER = os.getenv("VITE_DEV_SERVER", "http://localhost:5173")
    VITE_DEV = os.getenv("VITE_DEV", "0").lower() in {"1", "true", "yes", "on"}
    VITE_MANIFEST_PATH = (STATIC_DIR / "dist" / ".vite" / "manifest.json").as_posix()
    VITE_MANIFEST_FALLBACK = (STATIC_DIR / "dist" / "manifest.json").as_posix()
    MAX_ECHO_LENGTH = int(os.getenv("MAX_ECHO_LENGTH", "200"))
