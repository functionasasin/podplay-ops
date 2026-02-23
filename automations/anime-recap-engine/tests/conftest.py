"""Shared test fixtures for the anime recap engine."""
import pytest


@pytest.fixture
def tmp_work_dir(tmp_path):
    """Create a temporary work directory with standard subdirs."""
    for d in ["episodes", "summaries", "narration/segments", "moments", "music"]:
        (tmp_path / d).mkdir(parents=True, exist_ok=True)
    return tmp_path


@pytest.fixture
def sample_config(tmp_path):
    """Write a minimal config.yaml and return its path."""
    import yaml

    config = {
        "anime": {
            "title": "Test Anime",
            "season": 1,
            "total_episodes": 12,
            "genre": "action",
            "language": "ja",
        },
        "output": {
            "target_duration_minutes": 37,
            "narration_language": "en",
            "voice": "male-casual",
            "quality": "1080p",
        },
        "pacing": {"baseline_wpm": 144, "accelerated_wpm": 152, "target_cpm": 28.8},
        "audio": {"target_lufs": -14.0, "target_true_peak": -1.0},
        "tts": {"provider": "elevenlabs"},
        "tools": {"scene_detect_threshold": 27, "whisper_model": "base"},
    }
    config_path = tmp_path / "config.yaml"
    config_path.write_text(yaml.dump(config))
    return str(config_path)
