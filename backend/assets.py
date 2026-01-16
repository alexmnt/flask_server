import json
from functools import lru_cache
from pathlib import Path

from flask import current_app, url_for
from markupsafe import Markup


@lru_cache(maxsize=4)
def _load_manifest(manifest_path, fallback_path=None):
    path = Path(manifest_path)
    if path.exists():
        return json.loads(path.read_text())
    if fallback_path:
        fallback = Path(fallback_path)
        if fallback.exists():
            return json.loads(fallback.read_text())
    return {}


def _manifest():
    return _load_manifest(
        current_app.config["VITE_MANIFEST_PATH"],
        current_app.config.get("VITE_MANIFEST_FALLBACK"),
    )


def vite_css(entrypoint):
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


def vite_js(entrypoint):
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
