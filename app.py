import os

from backend import create_app

app = create_app()


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5000"))
    debug_env = os.getenv("FLASK_DEBUG", "0").lower() in {"1", "true", "yes", "on"}
    debug = debug_env or app.config.get("VITE_DEV", False)
    app.run(host=host, port=port, debug=debug)
