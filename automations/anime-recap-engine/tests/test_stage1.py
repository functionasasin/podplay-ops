"""Tests for Stage 1: Content Ingestion.

Spec references:
- Implementation: Section 3.1 (scene detection, transcription, audio separation, metadata)
- Validation: Section 9.1 (validate_stage1)

All tests use mocks for external tools (ffprobe, scenedetect, whisper, demucs, ffmpeg).
No real MP4 files or GPU required.
"""

import json
import os
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def episodes_dir(tmp_path):
    """Create a directory with 12 fake episode MP4 files."""
    ep_dir = tmp_path / "episodes"
    ep_dir.mkdir()
    for i in range(1, 13):
        (ep_dir / f"S01E{i:02d}.mp4").write_bytes(b"\x00" * 64)
    return ep_dir


@pytest.fixture
def short_episodes_dir(tmp_path):
    """Create a directory with only 5 episode files (below minimum)."""
    ep_dir = tmp_path / "episodes"
    ep_dir.mkdir()
    for i in range(1, 6):
        (ep_dir / f"S01E{i:02d}.mp4").write_bytes(b"\x00" * 64)
    return ep_dir


@pytest.fixture
def work_dir(tmp_path):
    """Create a clean work directory."""
    wd = tmp_path / "work"
    wd.mkdir()
    return wd


@pytest.fixture
def base_config():
    """Return a config dict matching the spec defaults."""
    return {
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
        "tools": {
            "scene_detect_threshold": 27,
            "whisper_model": "base",
        },
    }


def _make_ffprobe_fps_output(fps_str="24000/1001"):
    """Simulate ffprobe FPS detection output."""
    return MagicMock(
        stdout=fps_str + "\n",
        stderr="",
        returncode=0,
    )


def _make_ffprobe_duration_output(duration=1438.5):
    """Simulate ffprobe duration detection output."""
    return MagicMock(
        stdout=json.dumps({"format": {"duration": str(duration)}}),
        stderr="",
        returncode=0,
    )


def _make_ffprobe_subtitle_output(streams=None):
    """Simulate ffprobe subtitle stream detection output."""
    if streams is None:
        streams = []
    return MagicMock(
        stdout=json.dumps({"streams": streams}),
        stderr="",
        returncode=0,
    )


def _make_scenedetect_csv(num_scenes=80):
    """Generate synthetic scene detection CSV content."""
    lines = ["Scene Number,Start Frame,Start Timecode,Start Time (seconds),End Frame,End Timecode,End Time (seconds),Length (seconds)"]
    for i in range(1, num_scenes + 1):
        start = (i - 1) * 18.0
        end = i * 18.0
        lines.append(f"{i},{int(start * 23.976)},{start:.3f},{start:.3f},{int(end * 23.976)},{end:.3f},{end:.3f},18.000")
    return "\n".join(lines)


def _make_whisper_output(num_segments=120, episode_duration=1438.5):
    """Generate synthetic Whisper JSON output."""
    seg_duration = episode_duration / num_segments
    segments = []
    for i in range(num_segments):
        start = i * seg_duration
        end = (i + 1) * seg_duration
        segments.append({
            "id": i,
            "start": round(start, 2),
            "end": round(end, 2),
            "text": f"Dialogue line {i + 1} for this episode.",
        })
    return {"text": "Full transcript text...", "segments": segments}


# ---------------------------------------------------------------------------
# Test: Episode Discovery and Validation
# ---------------------------------------------------------------------------

class TestEpisodeDiscovery:
    """Tests for episode file discovery and naming validation."""

    def test_finds_all_episodes_sorted(self, episodes_dir):
        """Ingestion discovers all S01E{NN}.mp4 files in episode order."""
        from anime_recap_engine.stage1_ingest import discover_episodes

        eps = discover_episodes(str(episodes_dir))
        assert len(eps) == 12
        assert eps[0]["number"] == 1
        assert eps[-1]["number"] == 12

    def test_rejects_fewer_than_12_episodes(self, short_episodes_dir, work_dir, base_config):
        """Ingestion fails if fewer than 12 episodes are provided (spec minimum)."""
        from anime_recap_engine.stage1_ingest import ingest

        base_config["anime"]["total_episodes"] = 5
        with pytest.raises(ValueError, match="[Mm]inimum.*12"):
            ingest(str(short_episodes_dir), base_config, str(work_dir))

    def test_ignores_non_mp4_files(self, episodes_dir):
        """Only .mp4 files matching S01E{NN} pattern are discovered."""
        from anime_recap_engine.stage1_ingest import discover_episodes

        (episodes_dir / "readme.txt").write_text("not an episode")
        (episodes_dir / "thumbnail.jpg").write_bytes(b"\xff\xd8")
        eps = discover_episodes(str(episodes_dir))
        assert len(eps) == 12

    def test_sorts_lexicographically(self, tmp_path):
        """Episode ordering is by filename, not filesystem order."""
        from anime_recap_engine.stage1_ingest import discover_episodes

        ep_dir = tmp_path / "episodes"
        ep_dir.mkdir()
        # Create out of order
        for i in [12, 1, 7, 3]:
            (ep_dir / f"S01E{i:02d}.mp4").write_bytes(b"\x00")
        eps = discover_episodes(str(ep_dir))
        numbers = [e["number"] for e in eps]
        assert numbers == [1, 3, 7, 12]


# ---------------------------------------------------------------------------
# Test: FPS Detection
# ---------------------------------------------------------------------------

class TestFPSDetection:
    """Tests for per-episode FPS detection via ffprobe."""

    @patch("subprocess.run")
    def test_detects_23976_fps(self, mock_run):
        """Standard anime FPS 23.976 is correctly parsed from ffprobe."""
        from anime_recap_engine.stage1_ingest import detect_fps

        mock_run.return_value = _make_ffprobe_fps_output("24000/1001")
        fps = detect_fps("episode.mp4")
        assert abs(fps - 23.976) < 0.01

    @patch("subprocess.run")
    def test_detects_30fps(self, mock_run):
        """30fps content is correctly parsed."""
        from anime_recap_engine.stage1_ingest import detect_fps

        mock_run.return_value = _make_ffprobe_fps_output("30000/1001")
        fps = detect_fps("episode.mp4")
        assert abs(fps - 29.97) < 0.01

    @patch("subprocess.run")
    def test_detects_integer_fps(self, mock_run):
        """Integer FPS (e.g., 24) is correctly parsed."""
        from anime_recap_engine.stage1_ingest import detect_fps

        mock_run.return_value = _make_ffprobe_fps_output("24/1")
        fps = detect_fps("episode.mp4")
        assert fps == 24.0

    @patch("subprocess.run")
    def test_ffprobe_failure_raises(self, mock_run):
        """FPS detection raises on ffprobe failure."""
        from anime_recap_engine.stage1_ingest import detect_fps

        mock_run.return_value = MagicMock(stdout="", stderr="error", returncode=1)
        with pytest.raises(RuntimeError):
            detect_fps("episode.mp4")

    @patch("subprocess.run")
    def test_ffprobe_called_with_correct_args(self, mock_run):
        """ffprobe is called with the correct stream selection flags."""
        from anime_recap_engine.stage1_ingest import detect_fps

        mock_run.return_value = _make_ffprobe_fps_output("24000/1001")
        detect_fps("/path/to/ep.mp4")
        args = mock_run.call_args[0][0]
        assert "ffprobe" in args[0]
        assert "-select_streams" in args
        assert "v:0" in args
        assert "/path/to/ep.mp4" in args


# ---------------------------------------------------------------------------
# Test: Scene Detection
# ---------------------------------------------------------------------------

class TestSceneDetection:
    """Tests for PySceneDetect integration."""

    @patch("subprocess.run")
    def test_scene_detect_uses_threshold_27(self, mock_run, base_config):
        """Scene detection uses the spec threshold of 27."""
        from anime_recap_engine.stage1_ingest import run_scene_detection

        mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)
        run_scene_detection("episode.mp4", "/tmp/out", base_config)
        cmd_str = " ".join(str(a) for a in mock_run.call_args[0][0])
        assert "27" in cmd_str

    @patch("subprocess.run")
    def test_scene_detect_uses_detect_content(self, mock_run, base_config):
        """Scene detection uses detect-content method per spec."""
        from anime_recap_engine.stage1_ingest import run_scene_detection

        mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)
        run_scene_detection("episode.mp4", "/tmp/out", base_config)
        cmd_str = " ".join(str(a) for a in mock_run.call_args[0][0])
        assert "detect-content" in cmd_str

    def test_parse_scene_csv(self, tmp_path):
        """Scene CSV is correctly parsed to JSON with required fields."""
        from anime_recap_engine.stage1_ingest import parse_scene_csv

        csv_path = tmp_path / "scenes.csv"
        csv_path.write_text(_make_scenedetect_csv(80))

        scenes = parse_scene_csv(str(csv_path), fps=23.976, episode_num=1)
        assert len(scenes) == 80
        assert "start_time" in scenes[0]
        assert "end_time" in scenes[0]
        assert "duration" in scenes[0]
        assert scenes[0]["episode"] == 1

    def test_parse_scene_csv_includes_frame_count(self, tmp_path):
        """Parsed scenes include frame count at source FPS."""
        from anime_recap_engine.stage1_ingest import parse_scene_csv

        csv_path = tmp_path / "scenes.csv"
        csv_path.write_text(_make_scenedetect_csv(10))

        scenes = parse_scene_csv(str(csv_path), fps=23.976, episode_num=1)
        # Each scene should have a frame_count field
        for scene in scenes:
            assert "frame_count" in scene or "frames" in scene


# ---------------------------------------------------------------------------
# Test: Transcription (Subtitle Probe + Whisper Fallback)
# ---------------------------------------------------------------------------

class TestTranscription:
    """Tests for the subtitle probe → extract → validate → Whisper fallback pipeline."""

    @patch("subprocess.run")
    def test_probes_for_subtitle_streams(self, mock_run, base_config):
        """Transcription first probes for embedded subtitle streams."""
        from anime_recap_engine.stage1_ingest import get_transcription

        # ffprobe returns no subtitle streams, then whisper runs
        mock_run.side_effect = [
            _make_ffprobe_subtitle_output([]),  # subtitle probe
            _make_ffprobe_duration_output(1438.5),  # duration probe
            MagicMock(returncode=0),  # whisper
        ]

        get_transcription("ep.mp4", "/tmp/out", base_config)
        first_call_args = mock_run.call_args_list[0][0][0]
        assert "-select_streams" in first_call_args
        assert "s" in first_call_args

    @patch("subprocess.run")
    def test_falls_back_to_whisper_when_no_subs(self, mock_run, base_config, tmp_path):
        """When no subtitle streams found, Whisper is invoked."""
        from anime_recap_engine.stage1_ingest import get_transcription

        out_dir = str(tmp_path / "out")
        os.makedirs(out_dir, exist_ok=True)

        # Write a fake whisper output so the function can parse it
        whisper_out = tmp_path / "out" / "ep.json"
        whisper_out.write_text(json.dumps(_make_whisper_output()))

        mock_run.side_effect = [
            _make_ffprobe_subtitle_output([]),  # no subs
            _make_ffprobe_duration_output(1438.5),  # duration
            MagicMock(returncode=0),  # whisper
        ]

        result = get_transcription("ep.mp4", out_dir, base_config)
        # Whisper should have been called
        whisper_call = None
        for c in mock_run.call_args_list:
            args = c[0][0]
            if any("whisper" in str(a) for a in args):
                whisper_call = args
                break
        assert whisper_call is not None

    @patch("subprocess.run")
    def test_whisper_uses_source_language(self, mock_run, base_config, tmp_path):
        """Whisper is called with --language from config.anime.language."""
        from anime_recap_engine.stage1_ingest import get_transcription

        out_dir = str(tmp_path / "out")
        os.makedirs(out_dir, exist_ok=True)
        whisper_out = tmp_path / "out" / "ep.json"
        whisper_out.write_text(json.dumps(_make_whisper_output()))

        mock_run.side_effect = [
            _make_ffprobe_subtitle_output([]),  # no subs
            _make_ffprobe_duration_output(1438.5),
            MagicMock(returncode=0),  # whisper
        ]

        get_transcription("ep.mp4", out_dir, base_config)
        whisper_call = None
        for c in mock_run.call_args_list:
            args = c[0][0]
            if any("whisper" in str(a) for a in args):
                whisper_call = args
                break
        assert whisper_call is not None
        cmd_str = " ".join(str(a) for a in whisper_call)
        assert "ja" in cmd_str

    @patch("subprocess.run")
    def test_prefers_source_language_subtitle_track(self, mock_run, base_config, tmp_path):
        """When multiple subtitle streams exist, prefers source language match."""
        from anime_recap_engine.stage1_ingest import select_subtitle_track

        streams = [
            {"index": 2, "codec_name": "subrip", "tags": {"language": "eng"}},
            {"index": 3, "codec_name": "subrip", "tags": {"language": "jpn"}},
        ]
        selected = select_subtitle_track(streams, source_language="ja")
        # Should pick the Japanese track (index 3)
        assert selected["tags"]["language"] == "jpn"

    @patch("subprocess.run")
    def test_prefers_srt_over_ass_when_same_language(self, mock_run, base_config):
        """When tied on language, prefer SRT (subrip) over ASS for simpler parsing."""
        from anime_recap_engine.stage1_ingest import select_subtitle_track

        streams = [
            {"index": 2, "codec_name": "ass", "tags": {"language": "jpn"}},
            {"index": 3, "codec_name": "subrip", "tags": {"language": "jpn"}},
        ]
        selected = select_subtitle_track(streams, source_language="ja")
        assert selected["codec_name"] == "subrip"


# ---------------------------------------------------------------------------
# Test: Subtitle Validation
# ---------------------------------------------------------------------------

class TestSubtitleValidation:
    """Tests for the subtitle quality validation gate."""

    def test_valid_subtitles_pass(self, tmp_path):
        """Subtitles with ≥100 cues and ≥30% coverage pass validation."""
        from anime_recap_engine.stage1_ingest import validate_subtitles

        # Write a synthetic SRT file with 150 cues
        srt_lines = []
        for i in range(1, 151):
            start_s = (i - 1) * 8
            end_s = start_s + 5
            srt_lines.append(str(i))
            srt_lines.append(f"00:{start_s // 60:02d}:{start_s % 60:02d},000 --> 00:{end_s // 60:02d}:{end_s % 60:02d},000")
            srt_lines.append(f"This is dialogue line number {i} of the episode.")
            srt_lines.append("")

        srt_path = tmp_path / "subtitles.srt"
        srt_path.write_text("\n".join(srt_lines))

        assert validate_subtitles(str(srt_path), episode_duration_s=1438.5) is True

    def test_too_few_cues_fails(self, tmp_path):
        """Subtitles with fewer than 100 cues fail validation."""
        from anime_recap_engine.stage1_ingest import validate_subtitles

        srt_lines = []
        for i in range(1, 51):  # Only 50 cues
            start_s = (i - 1) * 10
            end_s = start_s + 5
            srt_lines.append(str(i))
            srt_lines.append(f"00:{start_s // 60:02d}:{start_s % 60:02d},000 --> 00:{end_s // 60:02d}:{end_s % 60:02d},000")
            srt_lines.append(f"Line {i}")
            srt_lines.append("")

        srt_path = tmp_path / "subtitles.srt"
        srt_path.write_text("\n".join(srt_lines))

        assert validate_subtitles(str(srt_path), episode_duration_s=1438.5) is False

    def test_low_coverage_fails(self, tmp_path):
        """Subtitles covering <30% of episode duration fail validation."""
        from anime_recap_engine.stage1_ingest import validate_subtitles

        # 100 cues but each only 1 second — covers ~100s of a 1438s episode = ~7%
        srt_lines = []
        for i in range(1, 101):
            start_s = (i - 1) * 14
            end_s = start_s + 1
            srt_lines.append(str(i))
            srt_lines.append(f"00:{start_s // 60:02d}:{start_s % 60:02d},000 --> 00:{end_s // 60:02d}:{end_s % 60:02d},000")
            srt_lines.append(f"Dialogue line {i} for testing coverage.")
            srt_lines.append("")

        srt_path = tmp_path / "subtitles.srt"
        srt_path.write_text("\n".join(srt_lines))

        assert validate_subtitles(str(srt_path), episode_duration_s=1438.5) is False

    def test_short_avg_cue_length_fails(self, tmp_path):
        """Subtitles with average cue <5 chars fail (likely signs-only track)."""
        from anime_recap_engine.stage1_ingest import validate_subtitles

        srt_lines = []
        for i in range(1, 120):
            start_s = (i - 1) * 8
            end_s = start_s + 5
            srt_lines.append(str(i))
            srt_lines.append(f"00:{start_s // 60:02d}:{start_s % 60:02d},000 --> 00:{end_s // 60:02d}:{end_s % 60:02d},000")
            srt_lines.append("Hi")  # avg <5 chars
            srt_lines.append("")

        srt_path = tmp_path / "subtitles.srt"
        srt_path.write_text("\n".join(srt_lines))

        assert validate_subtitles(str(srt_path), episode_duration_s=1438.5) is False


# ---------------------------------------------------------------------------
# Test: Whisper Quality Check
# ---------------------------------------------------------------------------

class TestWhisperValidation:
    """Tests for Whisper output quality validation."""

    def test_valid_whisper_output_passes(self):
        """Whisper output with sufficient segments and reasonable durations passes."""
        from anime_recap_engine.stage1_ingest import validate_whisper_output

        output = _make_whisper_output(num_segments=120, episode_duration=1438.5)
        assert validate_whisper_output(output, episode_duration_s=1438.5) is True

    def test_too_few_segments_fails(self):
        """Whisper output with <50 segments per 24-min episode fails."""
        from anime_recap_engine.stage1_ingest import validate_whisper_output

        output = _make_whisper_output(num_segments=30, episode_duration=1438.5)
        assert validate_whisper_output(output, episode_duration_s=1438.5) is False

    def test_long_segment_fails(self):
        """Whisper output with a segment >30 seconds indicates failed alignment."""
        from anime_recap_engine.stage1_ingest import validate_whisper_output

        output = _make_whisper_output(num_segments=120, episode_duration=1438.5)
        # Insert a 45-second segment
        output["segments"][50] = {
            "id": 50,
            "start": 500.0,
            "end": 545.0,
            "text": "This segment is way too long.",
        }
        assert validate_whisper_output(output, episode_duration_s=1438.5) is False


# ---------------------------------------------------------------------------
# Test: Audio Separation (Demucs)
# ---------------------------------------------------------------------------

class TestAudioSeparation:
    """Tests for Demucs audio stem separation."""

    @patch("subprocess.run")
    def test_demucs_called_with_two_stems(self, mock_run):
        """Demucs is called with --two-stems=vocals per spec."""
        from anime_recap_engine.stage1_ingest import run_audio_separation

        mock_run.return_value = MagicMock(returncode=0)
        run_audio_separation("episode.mp4", "/tmp/out")
        cmd = mock_run.call_args[0][0]
        cmd_str = " ".join(str(a) for a in cmd)
        assert "--two-stems" in cmd_str
        assert "vocals" in cmd_str

    @patch("subprocess.run")
    def test_demucs_output_paths(self, mock_run, tmp_path):
        """Audio separation produces vocals.wav and no_vocals.wav paths."""
        from anime_recap_engine.stage1_ingest import run_audio_separation

        mock_run.return_value = MagicMock(returncode=0)
        out_dir = str(tmp_path / "separated")
        os.makedirs(out_dir, exist_ok=True)

        paths = run_audio_separation("episode.mp4", out_dir)
        assert "vocals" in paths
        assert "no_vocals" in paths


# ---------------------------------------------------------------------------
# Test: OP/ED Detection
# ---------------------------------------------------------------------------

class TestOPEDDetection:
    """Tests for opening/ending sequence detection."""

    @patch("subprocess.run")
    def test_op_detected_in_first_3_minutes(self, mock_run):
        """OP region is detected within the first 3 minutes of the episode."""
        from anime_recap_engine.stage1_ingest import detect_op_ed

        mock_run.return_value = _make_ffprobe_duration_output(1438.5)
        result = detect_op_ed("episode.mp4", ep_num=2, total_eps=12)
        if result["op"] is not None:
            assert result["op"]["start"] < 180
            assert result["op"]["end"] <= 180

    @patch("subprocess.run")
    def test_ed_detected_in_last_3_minutes(self, mock_run):
        """ED region is detected within the last 3 minutes of the episode."""
        from anime_recap_engine.stage1_ingest import detect_op_ed

        mock_run.return_value = _make_ffprobe_duration_output(1438.5)
        result = detect_op_ed("episode.mp4", ep_num=2, total_eps=12)
        if result["ed"] is not None:
            assert result["ed"]["start"] >= 1438.5 - 180


# ---------------------------------------------------------------------------
# Test: Episode Manifest Assembly
# ---------------------------------------------------------------------------

class TestManifestAssembly:
    """Tests for the unified manifest.json creation."""

    def test_manifest_has_all_episodes(self, tmp_path):
        """Manifest contains entries for all discovered episodes."""
        from anime_recap_engine.stage1_ingest import build_manifest

        episodes_data = []
        for i in range(1, 13):
            episodes_data.append({
                "number": i,
                "fps": 23.976,
                "duration_s": 1438.5,
                "scenes": [{"start_time": j * 18.0, "end_time": (j + 1) * 18.0, "duration": 18.0, "episode": i} for j in range(80)],
                "transcription": [{"text": f"Line {j}", "start": j, "end": j + 1} for j in range(120)],
                "audio_stems": {
                    "vocals": f"work/episodes/{i:02d}/separated/vocals.wav",
                    "no_vocals": f"work/episodes/{i:02d}/separated/no_vocals.wav",
                },
                "op": {"start": 0.0, "end": 89.0},
                "ed": {"start": 1318.0, "end": 1438.5},
            })

        manifest = build_manifest(episodes_data)
        assert len(manifest["episodes"]) == 12
        assert manifest["episodes"][0]["number"] == 1
        assert manifest["episodes"][-1]["number"] == 12

    def test_manifest_includes_fps(self, tmp_path):
        """Each episode in manifest has fps field."""
        from anime_recap_engine.stage1_ingest import build_manifest

        episodes_data = [{
            "number": 1,
            "fps": 23.976,
            "duration_s": 1438.5,
            "scenes": [],
            "transcription": [],
            "audio_stems": {"vocals": "v.wav", "no_vocals": "nv.wav"},
            "op": None,
            "ed": None,
        }]
        manifest = build_manifest(episodes_data)
        assert manifest["episodes"][0]["fps"] == 23.976

    def test_manifest_marks_op_ed_scenes_as_skip(self, tmp_path):
        """Scenes within OP/ED regions are marked with skip=true."""
        from anime_recap_engine.stage1_ingest import build_manifest

        scenes = [
            {"start_time": 0.0, "end_time": 45.0, "duration": 45.0, "episode": 1},    # in OP
            {"start_time": 45.0, "end_time": 90.0, "duration": 45.0, "episode": 1},   # in OP
            {"start_time": 90.0, "end_time": 120.0, "duration": 30.0, "episode": 1},  # after OP
            {"start_time": 1320.0, "end_time": 1438.5, "duration": 118.5, "episode": 1},  # in ED
        ]

        episodes_data = [{
            "number": 1,
            "fps": 23.976,
            "duration_s": 1438.5,
            "scenes": scenes,
            "transcription": [{"text": f"Line {j}", "start": j, "end": j + 1} for j in range(120)],
            "audio_stems": {"vocals": "v.wav", "no_vocals": "nv.wav"},
            "op": {"start": 0.0, "end": 89.0},
            "ed": {"start": 1318.0, "end": 1438.5},
        }]

        manifest = build_manifest(episodes_data)
        ep_scenes = manifest["episodes"][0]["scenes"]
        # First two scenes are in OP region → skip=true
        assert ep_scenes[0].get("skip") is True
        assert ep_scenes[1].get("skip") is True
        # Third scene is after OP → not skipped
        assert ep_scenes[2].get("skip", False) is False
        # Last scene is in ED region → skip=true
        assert ep_scenes[3].get("skip") is True


# ---------------------------------------------------------------------------
# Test: Validation (Section 9.1)
# ---------------------------------------------------------------------------

class TestValidateStage1:
    """Tests for the validate_stage1() function per Section 9.1."""

    def _make_valid_manifest(self, work_dir, num_episodes=12):
        """Create a valid manifest.json and audio stem files in work_dir."""
        episodes = []
        for i in range(1, num_episodes + 1):
            ep_dir = Path(work_dir) / "episodes" / f"{i:02d}" / "separated"
            ep_dir.mkdir(parents=True, exist_ok=True)
            vocals_path = str(ep_dir / "vocals.wav")
            no_vocals_path = str(ep_dir / "no_vocals.wav")
            Path(vocals_path).write_bytes(b"\x00" * 16)
            Path(no_vocals_path).write_bytes(b"\x00" * 16)

            scenes = [
                {"start_time": j * 18.0, "end_time": (j + 1) * 18.0, "duration": 18.0, "episode": i, "skip": False}
                for j in range(80)
            ]
            transcription = [{"text": f"Line {j}", "start": j, "end": j + 1} for j in range(120)]

            episodes.append({
                "number": i,
                "fps": 23.976,
                "duration_s": 1438.5,
                "scenes": scenes,
                "transcription": transcription,
                "audio_stems": {"vocals": vocals_path, "no_vocals": no_vocals_path},
                "op": {"start": 0.0, "end": 89.0} if i > 1 else None,
                "ed": {"start": 1318.0, "end": 1438.5},
            })

        manifest_path = Path(work_dir) / "manifest.json"
        manifest_path.write_text(json.dumps({"episodes": episodes}))
        return {"episodes": episodes}

    def test_valid_manifest_passes(self, work_dir, base_config):
        """A fully valid manifest passes validation with no HARD issues."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir))
        passed, issues = validate_stage1(str(work_dir), base_config)
        hard_issues = [i for i in issues if i.startswith("HARD:")]
        assert passed is True
        assert len(hard_issues) == 0

    def test_missing_fps_is_hard_failure(self, work_dir, base_config):
        """Episode with missing FPS triggers HARD failure."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir))
        # Corrupt the manifest — remove fps from episode 3
        manifest_path = Path(work_dir) / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["episodes"][2]["fps"] = 0
        manifest_path.write_text(json.dumps(manifest))

        passed, issues = validate_stage1(str(work_dir), base_config)
        assert passed is False
        assert any("FPS" in i and "HARD" in i for i in issues)

    def test_too_few_scenes_is_hard_failure(self, work_dir, base_config):
        """Episode with fewer than 30 active scenes triggers HARD failure."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir))
        manifest_path = Path(work_dir) / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        # Reduce scenes to 20 for episode 1
        manifest["episodes"][0]["scenes"] = manifest["episodes"][0]["scenes"][:20]
        manifest_path.write_text(json.dumps(manifest))

        passed, issues = validate_stage1(str(work_dir), base_config)
        assert passed is False
        assert any("scenes" in i.lower() and "HARD" in i for i in issues)

    def test_too_few_transcript_segments_is_hard_failure(self, work_dir, base_config):
        """Episode with fewer than 50 transcript segments triggers HARD failure."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir))
        manifest_path = Path(work_dir) / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["episodes"][0]["transcription"] = manifest["episodes"][0]["transcription"][:30]
        manifest_path.write_text(json.dumps(manifest))

        passed, issues = validate_stage1(str(work_dir), base_config)
        assert passed is False
        assert any("transcript" in i.lower() and "HARD" in i for i in issues)

    def test_missing_audio_stems_is_hard_failure(self, work_dir, base_config):
        """Episode with missing audio stem files triggers HARD failure."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir))
        # Delete one of the vocals files
        manifest_path = Path(work_dir) / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        vocals_path = manifest["episodes"][0]["audio_stems"]["vocals"]
        os.remove(vocals_path)
        manifest_path.write_text(json.dumps(manifest))

        passed, issues = validate_stage1(str(work_dir), base_config)
        assert passed is False
        assert any("stem" in i.lower() and "HARD" in i for i in issues)

    def test_missing_op_on_episode_gt1_is_soft_warning(self, work_dir, base_config):
        """Episode >1 with no OP detected triggers SOFT warning (not HARD)."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir))
        manifest_path = Path(work_dir) / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["episodes"][2]["op"] = None  # Episode 3 missing OP
        manifest_path.write_text(json.dumps(manifest))

        passed, issues = validate_stage1(str(work_dir), base_config)
        # Should still pass (SOFT issue only)
        assert passed is True
        assert any("SOFT" in i and "OP" in i for i in issues)

    def test_missing_op_on_episode_1_is_ok(self, work_dir, base_config):
        """Episode 1 with no OP is acceptable (common for anime)."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir))
        manifest_path = Path(work_dir) / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["episodes"][0]["op"] = None  # Episode 1 missing OP (normal)
        manifest_path.write_text(json.dumps(manifest))

        passed, issues = validate_stage1(str(work_dir), base_config)
        assert passed is True
        # No OP warning for episode 1
        assert not any("Episode 1" in i and "OP" in i for i in issues)

    def test_fewer_than_12_episodes_is_hard_failure(self, work_dir, base_config):
        """Manifest with fewer than 12 episodes triggers HARD failure."""
        from anime_recap_engine.stage1_ingest import validate_stage1

        self._make_valid_manifest(str(work_dir), num_episodes=8)
        passed, issues = validate_stage1(str(work_dir), base_config)
        assert passed is False
        assert any("12" in i and "HARD" in i for i in issues)


# ---------------------------------------------------------------------------
# Test: Full Ingest Pipeline (integration with mocks)
# ---------------------------------------------------------------------------

class TestIngestPipeline:
    """Integration tests for the full ingest() function with all externals mocked."""

    @patch("anime_recap_engine.stage1_ingest.run_audio_separation")
    @patch("anime_recap_engine.stage1_ingest.get_transcription")
    @patch("anime_recap_engine.stage1_ingest.run_scene_detection")
    @patch("anime_recap_engine.stage1_ingest.detect_fps")
    @patch("anime_recap_engine.stage1_ingest.detect_op_ed")
    def test_ingest_creates_manifest(
        self, mock_oped, mock_fps, mock_scene, mock_trans, mock_audio,
        episodes_dir, work_dir, base_config,
    ):
        """Full ingest pipeline creates manifest.json in work directory."""
        from anime_recap_engine.stage1_ingest import ingest

        mock_fps.return_value = 23.976
        mock_scene.return_value = [
            {"start_time": j * 18.0, "end_time": (j + 1) * 18.0, "duration": 18.0}
            for j in range(80)
        ]
        mock_trans.return_value = [
            {"text": f"Line {j}", "start": j, "end": j + 1} for j in range(120)
        ]
        mock_audio.return_value = {
            "vocals": "vocals.wav",
            "no_vocals": "no_vocals.wav",
        }
        mock_oped.return_value = {
            "op": {"start": 0.0, "end": 89.0},
            "ed": {"start": 1318.0, "end": 1438.5},
            "duration": 1438.5,
        }

        ingest(str(episodes_dir), base_config, str(work_dir))

        manifest_path = Path(work_dir) / "manifest.json"
        assert manifest_path.exists()
        manifest = json.loads(manifest_path.read_text())
        assert len(manifest["episodes"]) == 12

    @patch("anime_recap_engine.stage1_ingest.run_audio_separation")
    @patch("anime_recap_engine.stage1_ingest.get_transcription")
    @patch("anime_recap_engine.stage1_ingest.run_scene_detection")
    @patch("anime_recap_engine.stage1_ingest.detect_fps")
    @patch("anime_recap_engine.stage1_ingest.detect_op_ed")
    def test_ingest_processes_each_episode(
        self, mock_oped, mock_fps, mock_scene, mock_trans, mock_audio,
        episodes_dir, work_dir, base_config,
    ):
        """Ingest calls scene detection, transcription, and audio separation for each episode."""
        from anime_recap_engine.stage1_ingest import ingest

        mock_fps.return_value = 23.976
        mock_scene.return_value = []
        mock_trans.return_value = []
        mock_audio.return_value = {"vocals": "v.wav", "no_vocals": "nv.wav"}
        mock_oped.return_value = {"op": None, "ed": None, "duration": 1438.5}

        ingest(str(episodes_dir), base_config, str(work_dir))

        assert mock_fps.call_count == 12
        assert mock_scene.call_count == 12
        assert mock_trans.call_count == 12
        assert mock_audio.call_count == 12

    @patch("anime_recap_engine.stage1_ingest.run_audio_separation")
    @patch("anime_recap_engine.stage1_ingest.get_transcription")
    @patch("anime_recap_engine.stage1_ingest.run_scene_detection")
    @patch("anime_recap_engine.stage1_ingest.detect_fps")
    @patch("anime_recap_engine.stage1_ingest.detect_op_ed")
    def test_ingest_writes_per_episode_outputs(
        self, mock_oped, mock_fps, mock_scene, mock_trans, mock_audio,
        episodes_dir, work_dir, base_config,
    ):
        """Ingest writes scenes.json and transcription.json per episode."""
        from anime_recap_engine.stage1_ingest import ingest

        mock_fps.return_value = 23.976
        mock_scene.return_value = [
            {"start_time": 0.0, "end_time": 18.0, "duration": 18.0}
        ]
        mock_trans.return_value = [
            {"text": "Line 1", "start": 0, "end": 1}
        ]
        mock_audio.return_value = {"vocals": "v.wav", "no_vocals": "nv.wav"}
        mock_oped.return_value = {"op": None, "ed": None, "duration": 1438.5}

        ingest(str(episodes_dir), base_config, str(work_dir))

        # Check that per-episode directories and files were created
        ep01_dir = Path(work_dir) / "episodes" / "01"
        assert ep01_dir.exists()
        assert (ep01_dir / "scenes.json").exists()
        assert (ep01_dir / "transcription.json").exists()
