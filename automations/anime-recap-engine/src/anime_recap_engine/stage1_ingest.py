"""Stage 1: Content Ingestion — scene detection, transcription, audio separation."""

import csv
import json
import os
import re
import subprocess
from pathlib import Path


# ISO 639-1 → common 639-2/B codes used by ffprobe/ffmpeg
_LANG_MAP = {
    "ja": ["jpn", "ja"],
    "en": ["eng", "en"],
    "ko": ["kor", "ko"],
    "zh": ["zho", "chi", "zh"],
    "fr": ["fre", "fra", "fr"],
    "de": ["ger", "deu", "de"],
    "es": ["spa", "es"],
    "pt": ["por", "pt"],
    "it": ["ita", "it"],
    "ru": ["rus", "ru"],
}


def discover_episodes(episodes_dir: str) -> list[dict]:
    """Discover and sort episode MP4 files in a directory.

    Returns a list of dicts with 'number' and 'path' keys, sorted by episode number.
    Only matches files named S{NN}E{NN}.mp4.
    """
    ep_dir = Path(episodes_dir)
    pattern = re.compile(r"S\d{2}E(\d{2})\.mp4$", re.IGNORECASE)
    episodes = []
    for f in sorted(ep_dir.iterdir()):
        m = pattern.match(f.name)
        if m:
            episodes.append({
                "number": int(m.group(1)),
                "path": str(f),
            })
    return sorted(episodes, key=lambda e: e["number"])


def detect_fps(episode_path: str) -> float:
    """Detect source FPS via ffprobe. Returns float FPS value.

    Raises RuntimeError if ffprobe fails.
    """
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=r_frame_rate",
            "-of", "csv=p=0",
            episode_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed for {episode_path}: {result.stderr}")
    fps_str = result.stdout.strip()
    if "/" in fps_str:
        num, den = fps_str.split("/")
        return int(num) / int(den)
    return float(fps_str)


def run_scene_detection(episode_path: str, output_dir: str, config: dict) -> list[dict]:
    """Run PySceneDetect on an episode, return parsed scene list."""
    threshold = config.get("tools", {}).get("scene_detect_threshold", 27)
    os.makedirs(output_dir, exist_ok=True)
    subprocess.run(
        [
            "scenedetect", "-i", episode_path,
            "detect-content", "-t", str(threshold),
            "list-scenes", "-o", output_dir,
        ],
        capture_output=True,
        text=True,
    )
    # Find the CSV output written by scenedetect
    csv_files = list(Path(output_dir).glob("*-Scenes.csv"))
    if not csv_files:
        csv_files = list(Path(output_dir).glob("*.csv"))
    if csv_files:
        return parse_scene_csv(str(csv_files[0]), fps=23.976, episode_num=0)
    return []


def parse_scene_csv(csv_path: str, fps: float, episode_num: int) -> list[dict]:
    """Parse PySceneDetect CSV into structured scene list.

    Each scene has: start_time, end_time, duration, episode, frame_count.
    """
    scenes = []
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            start_time = float(row["Start Time (seconds)"])
            end_time = float(row["End Time (seconds)"])
            duration = float(row["Length (seconds)"])
            start_frame = int(row["Start Frame"])
            end_frame = int(row["End Frame"])
            scenes.append({
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "episode": episode_num,
                "frame_count": end_frame - start_frame,
            })
    return scenes


def select_subtitle_track(streams: list[dict], source_language: str) -> dict | None:
    """Select the best subtitle track from available streams.

    Priority: source language match > 'und' > other.
    Tiebreaker: prefer SRT (subrip) over ASS for simpler parsing.
    """
    if not streams:
        return None

    target_codes = _LANG_MAP.get(source_language, [source_language])

    def score(stream):
        lang = stream.get("tags", {}).get("language", "und")
        codec = stream.get("codec_name", "")
        lang_score = 0
        if lang in target_codes:
            lang_score = 2
        elif lang == "und":
            lang_score = 1
        codec_score = 1 if codec == "subrip" else 0
        return (lang_score, codec_score)

    return max(streams, key=score)


def _get_episode_duration(episode_path: str) -> float:
    """Get episode duration in seconds via ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "json",
            episode_path,
        ],
        capture_output=True,
        text=True,
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


def get_transcription(episode_path: str, output_dir: str, config: dict) -> list[dict]:
    """Get transcription via embedded subtitles or Whisper fallback.

    Decision tree per spec Section 3.1.2:
    1. Probe for subtitle streams
    2. If found: select best track, extract, validate
    3. If validation passes: use subtitles
    4. Otherwise: fall back to Whisper
    """
    os.makedirs(output_dir, exist_ok=True)

    # Step 1: Probe for embedded subtitle streams
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "s",
            "-show_entries", "stream=index,codec_name:stream_tags=language",
            "-of", "json",
            episode_path,
        ],
        capture_output=True,
        text=True,
    )
    probe_data = json.loads(result.stdout)
    streams = probe_data.get("streams", [])

    source_lang = config.get("anime", {}).get("language", "ja")

    if streams:
        # Filter to text-based subtitle formats (not bitmap PGS/VobSub)
        text_streams = [
            s for s in streams
            if s.get("codec_name") in ("subrip", "ass", "ssa", "srt")
        ]
        if text_streams:
            track = select_subtitle_track(text_streams, source_lang)
            if track:
                srt_path = os.path.join(output_dir, "subtitles.srt")
                subprocess.run(
                    [
                        "ffmpeg", "-i", episode_path,
                        "-map", f"0:{track['index']}",
                        srt_path,
                    ],
                    capture_output=True,
                    text=True,
                )
                duration = _get_episode_duration(episode_path)
                if os.path.exists(srt_path) and validate_subtitles(srt_path, duration):
                    return _parse_srt_to_segments(srt_path)

    # Fallback: run Whisper
    duration = _get_episode_duration(episode_path)
    whisper_model = config.get("tools", {}).get("whisper_model", "base")
    subprocess.run(
        [
            "whisper", episode_path,
            "--model", whisper_model,
            "--language", source_lang,
            "--output_format", "json",
            "--output_dir", output_dir,
            "--word_timestamps", "True",
        ],
        capture_output=True,
        text=True,
    )

    # Read whisper output (named after input file stem)
    input_stem = Path(episode_path).stem
    whisper_json = os.path.join(output_dir, f"{input_stem}.json")
    if os.path.exists(whisper_json):
        with open(whisper_json) as f:
            whisper_data = json.load(f)
        return whisper_data.get("segments", [])

    return []


def _parse_srt_to_segments(srt_path: str) -> list[dict]:
    """Parse an SRT file into a list of segment dicts."""
    import pysrt
    subs = pysrt.open(srt_path)
    segments = []
    for i, sub in enumerate(subs):
        segments.append({
            "id": i,
            "start": sub.start.ordinal / 1000.0,
            "end": sub.end.ordinal / 1000.0,
            "text": sub.text,
        })
    return segments


def validate_subtitles(srt_path: str, episode_duration_s: float) -> bool:
    """Validate subtitle quality per spec Section 3.1.2.

    Checks: >= 100 cues, >= 30% temporal coverage, avg cue length >= 5 chars.
    """
    import pysrt
    subs = pysrt.open(srt_path)

    if len(subs) < 100:
        return False

    total_sub_time = sum(
        (s.end.ordinal - s.start.ordinal) / 1000.0 for s in subs
    )
    coverage = total_sub_time / episode_duration_s
    if coverage < 0.30:
        return False

    text_lengths = [len(s.text.strip()) for s in subs]
    avg_length = sum(text_lengths) / len(text_lengths)
    if avg_length < 5:
        return False

    return True


def validate_whisper_output(output: dict, episode_duration_s: float) -> bool:
    """Validate Whisper output quality.

    Checks: >= 50 segments, no segment > 30 seconds.
    """
    segments = output.get("segments", [])

    if len(segments) < 50:
        return False

    for seg in segments:
        duration = seg["end"] - seg["start"]
        if duration > 30:
            return False

    return True


def run_audio_separation(episode_path: str, output_dir: str) -> dict:
    """Run Demucs audio separation with two-stems mode.

    Returns dict with 'vocals' and 'no_vocals' output paths.
    """
    os.makedirs(output_dir, exist_ok=True)
    subprocess.run(
        [
            "demucs", "--two-stems=vocals",
            episode_path,
            "-o", output_dir,
        ],
        capture_output=True,
        text=True,
    )
    input_stem = Path(episode_path).stem
    return {
        "vocals": os.path.join(output_dir, "htdemucs", input_stem, "vocals.wav"),
        "no_vocals": os.path.join(output_dir, "htdemucs", input_stem, "no_vocals.wav"),
    }


def detect_op_ed(episode_path: str, ep_num: int, total_eps: int) -> dict:
    """Detect OP/ED regions using duration-based heuristics.

    Standard anime: OP ~90s in first 3 min, ED ~120s at end.
    Episode 1 often lacks a standard OP.
    """
    duration = _get_episode_duration(episode_path)

    # OP: ~90s starting near beginning (episodes > 1 typically have OP)
    op = None
    if ep_num > 1:
        op = {"start": 0.0, "end": 90.0}

    # ED: ~120s at end of episode
    ed = {"start": duration - 120.0, "end": duration}

    return {"op": op, "ed": ed, "duration": duration}


def build_manifest(episodes_data: list[dict]) -> dict:
    """Assemble unified manifest from per-episode data.

    Marks scenes overlapping OP/ED regions as skip=true.
    """
    episodes = []
    for ep in episodes_data:
        op = ep.get("op")
        ed = ep.get("ed")

        scenes = []
        for scene in ep.get("scenes", []):
            s = dict(scene)
            skip = False
            if op and scene["start_time"] < op["end"] and scene["end_time"] > op["start"]:
                skip = True
            if ed and scene["start_time"] < ed["end"] and scene["end_time"] > ed["start"]:
                skip = True
            s["skip"] = skip
            scenes.append(s)

        episodes.append({
            "number": ep["number"],
            "fps": ep["fps"],
            "duration_s": ep.get("duration_s", 0),
            "scenes": scenes,
            "transcription": ep.get("transcription", []),
            "audio_stems": ep.get("audio_stems", {}),
            "op": op,
            "ed": ed,
        })

    return {"episodes": episodes}


def validate_stage1(work_dir: str, config: dict) -> tuple[bool, list[str]]:
    """Validate Stage 1 output per spec Section 9.1.

    Returns (passed, issues) where passed is False if any HARD issues exist.
    """
    manifest_path = os.path.join(work_dir, "manifest.json")
    with open(manifest_path) as f:
        manifest = json.load(f)

    issues = []

    n = len(manifest["episodes"])
    if n < 12:
        issues.append(f"HARD: Only {n} episodes, minimum 12")

    for ep in manifest["episodes"]:
        num = ep["number"]

        if not ep.get("fps") or ep["fps"] <= 0:
            issues.append(f"HARD: Episode {num} missing FPS")

        active_scenes = [s for s in ep["scenes"] if not s.get("skip")]
        if len(active_scenes) < 30:
            issues.append(f"HARD: Episode {num} has only {len(active_scenes)} active scenes")

        if len(ep["transcription"]) < 50:
            issues.append(f"HARD: Episode {num} has only {len(ep['transcription'])} transcript segments")

        for stem in ["vocals", "no_vocals"]:
            path = ep["audio_stems"][stem]
            if not os.path.exists(path):
                issues.append(f"HARD: Episode {num} missing {stem} stem at {path}")

        if ep.get("op") is None and num > 1:
            issues.append(f"SOFT: Episode {num} has no OP detected")

    passed = not any(i.startswith("HARD:") for i in issues)
    return passed, issues


def ingest(episodes_dir: str, config: dict, work_dir: str) -> dict:
    """Run the full Stage 1 ingestion pipeline.

    Discovers episodes, runs scene detection, transcription, audio separation,
    and OP/ED detection for each. Writes manifest.json and per-episode outputs.
    """
    episodes = discover_episodes(episodes_dir)

    if len(episodes) < 12:
        raise ValueError(f"Minimum 12 episodes required, got {len(episodes)}")

    total_eps = len(episodes)
    episodes_data = []

    for ep in episodes:
        ep_num = ep["number"]
        ep_path = ep["path"]
        ep_dir = os.path.join(work_dir, "episodes", f"{ep_num:02d}")
        os.makedirs(ep_dir, exist_ok=True)

        fps = detect_fps(ep_path)
        scenes = run_scene_detection(ep_path, ep_dir, config)
        transcription = get_transcription(ep_path, ep_dir, config)
        audio_stems = run_audio_separation(ep_path, os.path.join(ep_dir, "separated"))
        oped = detect_op_ed(ep_path, ep_num, total_eps)

        # Write per-episode outputs
        with open(os.path.join(ep_dir, "scenes.json"), "w") as f:
            json.dump(scenes, f)
        with open(os.path.join(ep_dir, "transcription.json"), "w") as f:
            json.dump(transcription, f)

        episodes_data.append({
            "number": ep_num,
            "fps": fps,
            "duration_s": oped.get("duration", 0),
            "scenes": scenes,
            "transcription": transcription,
            "audio_stems": audio_stems,
            "op": oped.get("op"),
            "ed": oped.get("ed"),
        })

    manifest = build_manifest(episodes_data)
    manifest_path = os.path.join(work_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    return manifest
