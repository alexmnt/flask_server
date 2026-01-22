import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from flask import current_app, url_for
from markupsafe import Markup

logger = logging.getLogger(__name__)

@lru_cache(maxsize=4)
def _load_manifest(manifest_path: str, fallback_path: Optional[str] = None) -> dict[str, Any]:
    path = Path(manifest_path)
    if path.exists():
        return _read_manifest(path)
    if fallback_path:
        fallback = Path(fallback_path)
        if fallback.exists():
            return _read_manifest(fallback)
    return {}


def _read_manifest(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to load Vite manifest at %s: %s", path, exc)
        return {}


def _manifest() -> dict[str, Any]:
    return _load_manifest(
        current_app.config["VITE_MANIFEST_PATH"],
        current_app.config.get("VITE_MANIFEST_FALLBACK"),
    )


def vite_css(entrypoint: str) -> Markup:
    if current_app.config.get("VITE_DEV"):
        return Markup("")
    manifest = _manifest()
    entry = manifest.get(entrypoint)
    if not entry:
        return Markup("")
    tags = []
    for css_file in entry.get("css", []):
        href = url_for("static", filename=f"dist/{css_file}")
        tags.append(f'<link rel="stylesheet" href="{href}">')
    return Markup("\n".join(tags))


def vite_js(entrypoint: str) -> Markup:
    if current_app.config.get("VITE_DEV"):
        dev_server = current_app.config["VITE_DEV_SERVER"].rstrip("/")
        tags = [
            f'<script type="module" src="{dev_server}/@vite/client"></script>',
            f'<script type="module" src="{dev_server}/{entrypoint}"></script>',
        ]
        return Markup("\n".join(tags))
    manifest = _manifest()
    entry = manifest.get(entrypoint)
    if not entry:
        return Markup("")
    src = url_for("static", filename=f"dist/{entry['file']}")
    return Markup(f'<script type="module" src="{src}"></script>')
