from flask import Blueprint, render_template

from backend.services.data import list_baselines, list_status_cards
from backend.services.time import utc_now

pages_bp = Blueprint("pages", __name__)

@pages_bp.get("/")
def index() -> str:
    return render_template(
        "pages/index.html",
        baselines=list_baselines(),
        status_cards=list_status_cards(),
    )


@pages_bp.get("/status")
def status() -> str:
    return render_template("pages/status.html")


@pages_bp.get("/placeholder/<slug>")
def placeholder(slug: str) -> str:
    title = slug.replace("-", " ").title()
    return render_template("pages/placeholder.html", title=title)


@pages_bp.get("/partials/last-sync")
def last_sync() -> str:
    timestamp = utc_now().strftime("%Y-%m-%d %H:%M:%S UTC")
    return render_template("partials/last_sync.html", last_sync=timestamp)


@pages_bp.get("/partials/baseline-rows")
def baseline_rows() -> str:
    return render_template("partials/baseline_rows.html", baselines=list_baselines())


@pages_bp.get("/partials/status-cards")
def status_cards() -> str:
    return render_template("partials/status_cards.html", status_cards=list_status_cards())
