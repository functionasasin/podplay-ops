"""Configuration loading and season-length scaling parameters."""

from __future__ import annotations

import math
from pathlib import Path

import yaml


def scale_parameters(total_eps: int) -> dict:
    """Derive all season-length-dependent parameters.

    Reference: 24 episodes -> 75 min, 5 acts, 11 moments, 19 breathing events.
    Minimum: 12 episodes. Below this, the compression ratio inverts and
    scaling floors produce nonsensical parameters.
    """
    if total_eps < 12:
        raise ValueError(f"Minimum 12 episodes required, got {total_eps}")

    # Target duration scales linearly: ~3.1 min per episode
    target_min = max(30.0, total_eps * 3.1)

    # Act count: 3 acts minimum (12 eps), 5 for 24, 6 for 36
    act_count = max(3, min(6, math.ceil(total_eps / 5)))

    # Anime dialogue moment budget
    moment_count = max(5, round(total_eps / 2.2))

    # Breathing events: 1 per ~3.9 min (19/75 from reference)
    breathing_events = max(8, round(target_min / 3.9))

    # Word budget (hook and outro are fixed regardless of duration)
    total_words = round(target_min * 144)  # baseline WPM
    hook_words = 65   # structural invariant
    outro_words = 90  # structural invariant

    # Episode duration bounds
    avg_ep_min = (target_min - 1.1) / total_eps  # subtract hook+outro ~1.1 min
    min_ep_min = max(1.5, avg_ep_min * 0.5)
    max_ep_min = min(8.0, avg_ep_min * 2.0)

    return {
        "target_duration_min": target_min,
        "act_count": act_count,
        "moment_count": moment_count,
        "breathing_events": breathing_events,
        "total_words": total_words,
        "hook_words": hook_words,
        "outro_words": outro_words,
        "avg_episode_min": round(avg_ep_min, 1),
        "min_episode_min": round(min_ep_min, 1),
        "max_episode_min": round(max_ep_min, 1),
    }


def load_config(config_path: str | Path) -> dict:
    """Load and return the config.yaml as a dict."""
    with open(config_path) as f:
        return yaml.safe_load(f)
