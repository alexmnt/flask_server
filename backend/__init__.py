from typing import Optional, Type

from flask import Flask

from .assets import vite_css, vite_js
from .config import STATIC_DIR, TEMPLATES_DIR, BaseConfig
from .routes import register_blueprints


def create_app(config_object: Optional[Type[BaseConfig]] = None) -> Flask:
    app = Flask(
        __name__,
        template_folder=str(TEMPLATES_DIR),
        static_folder=str(STATIC_DIR),
        static_url_path="/static",
    )
    app.config.from_object(config_object or BaseConfig)
    _register_template_globals(app)
    register_blueprints(app)
    return app


def _register_template_globals(app: Flask) -> None:
    app.jinja_env.globals["vite_css"] = vite_css
    app.jinja_env.globals["vite_js"] = vite_js

    @app.context_processor
    def inject_asset_env():
        return {"vite_dev": app.config.get("VITE_DEV", False)}
