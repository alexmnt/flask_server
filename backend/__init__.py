from flask import Flask

from .config import STATIC_DIR, TEMPLATES_DIR, BaseConfig
from .assets import vite_css, vite_js
from .routes import register_blueprints


def create_app():
    app = Flask(
        __name__,
        template_folder=str(TEMPLATES_DIR),
        static_folder=str(STATIC_DIR),
        static_url_path="/static",
    )
    app.config.from_object(BaseConfig)
    app.jinja_env.globals["vite_css"] = vite_css
    app.jinja_env.globals["vite_js"] = vite_js

    @app.context_processor
    def inject_asset_env():
        return {"vite_dev": app.config.get("VITE_DEV", False)}

    register_blueprints(app)
    return app
