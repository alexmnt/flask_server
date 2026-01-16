from flask import Blueprint, render_template

from backend.services.time import utc_now

pages_bp = Blueprint("pages", __name__)

BASELINES = [
    {
        "name": "Cloud foundation",
        "subtitle": "CIS aligned, high impact",
        "version": "v3.1",
        "scope": "62 workloads",
        "last_audit": "2024-12-19",
        "status": "active",
        "status_label": "Active",
        "owner": "Security team",
        "action_label": "Action 1",
        "action_variant": "primary",
    },
    {
        "name": "Data privacy",
        "subtitle": "PCI + SOC2 controls",
        "version": "v2.4",
        "scope": "18 systems",
        "last_audit": "2024-11-08",
        "status": "warning",
        "status_label": "Needs review",
        "owner": "GRC",
        "action_label": "Action 2",
        "action_variant": "warning",
    },
    {
        "name": "Endpoint hardening",
        "subtitle": "CIS level 1 desktops",
        "version": "v1.9",
        "scope": "300 endpoints",
        "last_audit": "2025-01-03",
        "status": "active",
        "status_label": "Active",
        "owner": "IT ops",
        "action_label": "Action 3",
        "action_variant": "primary",
    },
    {
        "name": "Third-party access",
        "subtitle": "Vendor onboarding checks",
        "version": "v1.3",
        "scope": "42 vendors",
        "last_audit": "2024-10-21",
        "status": "idle",
        "status_label": "Paused",
        "owner": "Vendor mgmt",
        "action_label": "Action 4",
        "action_variant": "neutral",
    },
]

STATUS_CARDS = [
    {
        "kicker": "Metric A",
        "value": "18",
        "badge": "OK",
        "tone": "active",
        "note": "Placeholder note A.",
    },
    {
        "kicker": "Metric B",
        "value": "4",
        "badge": "Warn",
        "tone": "warning",
        "note": "Placeholder note B.",
    },
    {
        "kicker": "Metric C",
        "value": "2",
        "badge": "Next",
        "tone": "idle",
        "note": "Placeholder note C.",
    },
    {
        "kicker": "Metric D",
        "value": "1",
        "badge": "New",
        "tone": "active",
        "note": "Placeholder note D.",
    },
]


@pages_bp.get("/")
def index():
    return render_template("pages/index.html", baselines=BASELINES, status_cards=STATUS_CARDS)


@pages_bp.get("/status")
def status():
    return render_template("pages/status.html")


@pages_bp.get("/placeholder/<slug>")
def placeholder(slug):
    title = slug.replace("-", " ").title()
    return render_template("pages/placeholder.html", title=title)


@pages_bp.get("/partials/last-sync")
def last_sync():
    timestamp = utc_now().strftime("%Y-%m-%d %H:%M:%S UTC")
    return render_template("partials/last_sync.html", last_sync=timestamp)


@pages_bp.get("/partials/baseline-rows")
def baseline_rows():
    return render_template("partials/baseline_rows.html", baselines=BASELINES)


@pages_bp.get("/partials/status-cards")
def status_cards():
    return render_template("partials/status_cards.html", status_cards=STATUS_CARDS)
