from dataclasses import dataclass


@dataclass(frozen=True)
class Baseline:
    name: str
    subtitle: str
    version: str
    scope: str
    last_audit: str
    status: str
    status_label: str
    owner: str
    action_label: str
    action_variant: str


@dataclass(frozen=True)
class StatusCard:
    kicker: str
    value: str
    badge: str
    tone: str
    note: str


_BASELINES = (
    Baseline(
        name="Cloud foundation",
        subtitle="CIS aligned, high impact",
        version="v3.1",
        scope="62 workloads",
        last_audit="2024-12-19",
        status="active",
        status_label="Active",
        owner="Security team",
        action_label="Action 1",
        action_variant="primary",
    ),
    Baseline(
        name="Data privacy",
        subtitle="PCI + SOC2 controls",
        version="v2.4",
        scope="18 systems",
        last_audit="2024-11-08",
        status="warning",
        status_label="Needs review",
        owner="GRC",
        action_label="Action 2",
        action_variant="warning",
    ),
    Baseline(
        name="Endpoint hardening",
        subtitle="CIS level 1 desktops",
        version="v1.9",
        scope="300 endpoints",
        last_audit="2025-01-03",
        status="active",
        status_label="Active",
        owner="IT ops",
        action_label="Action 3",
        action_variant="primary",
    ),
    Baseline(
        name="Third-party access",
        subtitle="Vendor onboarding checks",
        version="v1.3",
        scope="42 vendors",
        last_audit="2024-10-21",
        status="idle",
        status_label="Paused",
        owner="Vendor mgmt",
        action_label="Action 4",
        action_variant="neutral",
    ),
)

_STATUS_CARDS = (
    StatusCard(
        kicker="Metric A",
        value="18",
        badge="OK",
        tone="active",
        note="Placeholder note A.",
    ),
    StatusCard(
        kicker="Metric B",
        value="4",
        badge="Warn",
        tone="warning",
        note="Placeholder note B.",
    ),
    StatusCard(
        kicker="Metric C",
        value="2",
        badge="Next",
        tone="idle",
        note="Placeholder note C.",
    ),
    StatusCard(
        kicker="Metric D",
        value="1",
        badge="New",
        tone="active",
        note="Placeholder note D.",
    ),
)


def list_baselines() -> list[Baseline]:
    return list(_BASELINES)


def list_status_cards() -> list[StatusCard]:
    return list(_STATUS_CARDS)
