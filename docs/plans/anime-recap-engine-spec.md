# Anime Recap Engine — Software Specification

> Reverse-engineered from JarAnime's "Parasyte: The Maxim" 75-minute full-season recap.
> Every parameter is derived from quantitative analysis of the reference video.
> A developer with no context should be able to build the entire forward engine from this spec alone.

---

## 1. System Overview

The Anime Recap Engine converts a complete anime season (12-24 episodes) into a single long-form recap video in the JarAnime style: a narrator retells the entire story over a continuous stream of anime footage, punctuated by strategic anime dialogue pass-through moments and a subtle music bed.

**Core insight**: The narrator is not a critic or analyst — they are a friend who just binged the show and is excitedly retelling it to you. The entire system is designed around maintaining this illusion.

### Architecture

```
INPUT 1: episodes/*.mp4    INPUT 2: config.yaml
        │                          │
        └──────────┬───────────────┘
                   ▼
┌─── STAGE 1: Content Ingestion ───┐
│  Scene detection, transcription,  │
│  audio separation per episode     │
└──────────────┬───────────────────┘
               │
               ▼
┌─── STAGE 2: Plot Analysis & Script Generation ───┐
│  Episode summaries → narrative arc → acts →       │
│  narrator script with commentary + dialogue slots │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌─── STAGE 3: Scene Selection & Matching ───┐
│  Classify source scenes → match to script │
│  lines → build visual timeline            │
└──────────────┬───────────────────────────┘
               │
               ▼
┌─── STAGE 4: Narration Audio (TTS) ───┐
│  Script → TTS at 144 WPM baseline →  │
│  compress → insert pauses             │
└──────────────┬───────────────────────┘
               │
               ▼
┌─── STAGE 5: Anime Dialogue Moment Selection ───┐
│  Identify 10-12 moments → extract clips/audio → │
│  assign delivery mode (woven/held/rapid)         │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─── STAGE 6: Music Selection & Audio Mixing ───┐
│  Hook track + body track → sidechain duck →   │
│  swell at anime dialogue → final loudnorm     │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌─── STAGE 7: Video Assembly & Render ───┐
│  Merge visual timeline + audio →       │
│  ffmpeg render → quality validation    │
└──────────────────┬─────────────────────┘
                   │
                   ▼
           OUTPUT: recap.mp4
```

---

## 2. Input Contract

Exactly two inputs. Nothing else.

### Input 1: Episode MP4 Files

A directory of MP4 files — one per episode, named in order. Subtitles are either embedded in the MP4 or auto-generated via Whisper. No separate subtitle files.

```
episodes/
├── S01E01.mp4
├── S01E02.mp4
├── ...
└── S01E24.mp4
```

**Naming**: `S{season:02d}E{episode:02d}.mp4`. Files are sorted lexicographically to determine episode order.

**Format**: MP4 container. Any resolution/framerate — the pipeline detects source FPS from the files and adapts. Subtitles embedded as SRT/ASS streams are preferred; if absent, Whisper generates them.

### Input 2: config.yaml

A single YAML file containing every parameter the engine needs. See Section 5 for full schema.

```yaml
anime:
  title: "Parasyte: The Maxim"
  season: 1
  total_episodes: 24
  genre: "horror/sci-fi"
  language: "ja"          # Source language

output:
  target_duration_minutes: 75  # Target output length
  narration_language: "en"     # Narration language
  voice: "male-casual"         # TTS voice profile
  quality: "1080p"             # 720p | 1080p | 4k
```

### Invocation

```bash
anime-recap-engine --episodes ./episodes/ --config ./config.yaml --output ./recap.mp4
```

---

## 3. Pipeline Stages

### 3.1 Content Ingestion

**Input**: Episode MP4 files
**Output**: Per-episode scene lists, transcriptions, separated audio stems

#### 3.1.1 Scene Detection

```bash
# Run PySceneDetect per episode
scenedetect -i input/episodes/S01E01.mkv detect-content -t 27 list-scenes -o raw/episodes/01/
```

| Parameter | Value | Source |
|-----------|-------|--------|
| Tool | PySceneDetect | Reference analysis used this tool |
| Method | `detect-content` | Content-change detection |
| Threshold | 27 | Tuned for anime visual style (high-contrast scene changes) |
| Output | CSV per episode | Scene start/end timestamps + frame numbers |

**FPS detection** (run once before scene detection to determine source frame rate):

```bash
# Detect source FPS per episode
ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 input/episodes/S01E01.mp4
# Typical output: "24000/1001" (23.976fps) or "30000/1001" (29.97fps)
```

Store detected FPS in the episode manifest. Most anime is 23.976fps. The pipeline uses this value everywhere — scene detection, clip duration quantization (Section 3.3.3), and final render (Section 3.7).

**Post-processing**: Convert each CSV to JSON with:
- Scene index, start_time, end_time, duration
- Frame count (at source FPS — detected per-episode, NOT hardcoded)
- Episode number

#### 3.1.2 Transcription

For each episode, extract dialogue transcriptions:

```bash
# If subtitles are embedded:
ffmpeg -i input/episodes/S01E01.mkv -map 0:s:0 raw/episodes/01/subtitles.srt

# If no subtitles, run Whisper:
# GPU available:
whisper input/episodes/S01E01.mkv --model large-v3 --language ja --output_format json --output_dir raw/episodes/01/ --word_timestamps True
# CPU only:
whisper input/episodes/S01E01.mkv --model base --language ja --output_format json --output_dir raw/episodes/01/ --word_timestamps True
```

**Output per episode**: JSON with word-level timestamps, speaker segments

#### 3.1.3 Audio Separation

```bash
# Separate vocals (dialogue) from background (music + SFX) per episode
demucs --two-stems=vocals input/episodes/S01E01.mkv -o raw/episodes/01/separated/
```

**Output**: `vocals.wav` and `no_vocals.wav` per episode — needed for Stage 5 (anime dialogue extraction)

#### 3.1.4 Episode Metadata Assembly

Combine per-episode outputs into a unified manifest:

```json
{
  "episodes": [
    {
      "number": 1,
      "fps": 23.976,               // auto-detected via ffprobe
      "duration_s": 1438.5,
      "op": {"start": 0.0, "end": 89.0},   // detected OP region (null if none)
      "ed": {"start": 1318.0, "end": 1438.5}, // detected ED region (null if none)
      "scenes": [...],             // from PySceneDetect (OP/ED scenes marked skip:true)
      "transcription": [...],      // from Whisper or SRT
      "audio_stems": {
        "vocals": "raw/episodes/01/separated/vocals.wav",
        "no_vocals": "raw/episodes/01/separated/no_vocals.wav"
      }
    }
  ]
}
```

---

### 3.2 Plot Analysis & Script Generation

**Input**: Episode transcriptions, config.yaml
**Output**: Complete narrator script with timing annotations

This stage uses an LLM (Claude) to analyze the anime's plot and generate the narrator script.

#### 3.2.1 Episode Summarization

For each episode, prompt the LLM with the transcription:

```
Summarize episode {N} of {anime_title} in 200-400 words.
Include:
- Key plot events in chronological order
- Character introductions (full name + role descriptor on first appearance)
- Emotional peaks (deaths, transformations, reveals)
- Notable dialogue lines that are punchy/memorable (under 10 words)
- Relationship to previous episode (continuation vs new arc)
```

#### 3.2.2 Narrative Arc Detection

Prompt the LLM with all episode summaries:

```
Group these {N} episodes into 4-6 narrative acts based on plot structure.
Act boundaries occur at major shifts in:
- Protagonist's status (normal → threatened → transformed → fighting → resolved)
- Antagonist type (new threat class introduced)
- Stakes level (personal → community → societal)
- Setting (location changes)

Rules:
- Act 1 always covers episodes 1-2 (premise establishment)
- Final act always starts when the main conflict enters resolution
- Each act should contain 3-7 episodes
- Adjacent episodes sharing a continuous plotline without major character introductions can be arc-merged

Output: JSON with act boundaries, episode assignments, arc-merge candidates
```

#### 3.2.3 Script Generation

Generate the full narrator script using this prompt structure. The LLM must produce output matching these exact parameters:

**Macro Structure (8 parts)**:

| Section | % of Duration | % of Words | Content |
|---------|-------------|-----------|---------|
| Hook | 0.8% | ~65 words | 4-beat structure (see below) |
| Act 1: Premise | 15-16% | ~1,700 words | Extended coverage of eps 1-2 |
| Act 2: Escalation | 22-23% | ~2,400 words | Rising stakes, new threats |
| Act 3: Transformation | 22-23% | ~2,500 words | Character change, peak emotional content |
| Act 4: Conspiracy/Climax Build | 16-17% | ~1,900 words | Expanded scope, relentless pacing |
| Act 5: Climax | 17% | ~1,900 words | Final confrontations, payoff |
| Resolution | 3-4% | ~440 words | Season finale wrap-up |
| Outro | 0.6% | ~90 words | Reflection + CTA + sign-off |

**Hook Template (30-45 seconds, ~65 words)**:

```
Beat 1 — Rhetorical Question (15-20s, 35-45 words):
  "[Universal question about {anime_theme}]? Well, [bridge to anime].
   [Anime Title], the anime that [premise in one clause]."
  Requirements:
  - Universally relatable, not anime-specific
  - Escalating specificity (generic → personal)
  - Minimum 3 "you/your" instances
  - End with bridge word ("like this", "from this")

Beat 2 — Anime Teaser (8-12s):
  [ANIME_DIALOGUE_SLOT: 2 clips, context-free, visually striking]
  Narrator pauses. Select from first 4 episodes.

Beat 3 — Narrator Reaction (4-6s, 12-18 words):
  "Now that's a [noun]. I've got a good one for you today."

Beat 4 — Transition (2-4s, 5-8 words):
  "So, let's get [right] into it."
```

**Outro Template (25-35 seconds, ~90 words)**:

```
"And that's the entire story of [Anime Title].
 [1-2 sentences of personal reflection].
 [Channel plug / recommendation].
 And in the meantime, peace."
```

**Per-Episode Script Rules**:

| Rule | Parameter | Source |
|------|-----------|--------|
| Episode duration allocation | Compression curve (see formula below) | narration-transcript.md |
| WPM per episode | 144 baseline, accelerating to 152 | pacing-metrics.md |
| Episode transition template | Template A for eps 1-6, Template B for eps 7+ | transition-phrases.md |
| Arc merging | Drop per-episode markers when 3+ eps share plotline | script-structure.md |
| Commentary ratio | 96% recap : 4% commentary | narration-style.md |
| Anime dialogue slots | Mark with `[ANIME_DIALOGUE_SLOT]` | anime-dialogue-moments.md |

**Episode Duration Allocation Formula**:

```python
def episode_duration(ep_num, total_eps, total_body_duration):
    if ep_num <= 2:
        weight = 1.7    # Premise episodes get 1.7x average
    elif ep_num == total_eps:
        weight = 1.1    # Finale gets a bump
    elif ep_num <= total_eps * 0.3:
        weight = 1.2    # Early body
    elif ep_num <= total_eps * 0.7:
        weight = 0.9    # Mid body (may arc-merge)
    else:
        weight = 0.7    # Late body (compressed)
    avg_duration = total_body_duration / total_eps
    return avg_duration * weight
```

**Word Budget Calculator**:

```python
def word_budget(target_duration_minutes, wpm=144):
    total_words = target_duration_minutes * wpm
    hook_words = 65
    outro_words = 90
    body_words = total_words - hook_words - outro_words
    resolution_words = int(body_words * 0.035)
    main_body_words = body_words - resolution_words
    return {
        "total": total_words,        # 75 min → 10,800
        "hook": hook_words,          # 65
        "body": main_body_words,     # ~10,270
        "resolution": resolution_words, # ~374
        "outro": outro_words,        # 90
    }
```

**Narrator Voice Profile (LLM System Prompt)**:

```
You are retelling an anime to a friend. You just binged it and are excited.

Voice rules:
- Use contractions (he's, didn't, can't) — never formal conjugation
- React emotionally to plot events: genuine awe, frustration, humor
- Address the viewer as "you" occasionally (22 times per 75 min)
- Self-reference with "I" sparingly (30 times per 75 min)
- Talk TO characters occasionally: "Girl, lock it in", "Dude, why?"  (4 per video)

NEVER use: However, Nevertheless, Furthermore, Moreover, Consequently, Subsequently, Additionally
ALWAYS use: So, But, Unfortunately, Fortunately, Obviously, Of course, Anyway

Transition connector targets per 5 minutes:
  "So," causal: 1.7x
  "But" adversative: 4.9x (1 in 7 as sentence-starter)
  "Unfortunately": 0.9x
  "Fortunately": 0.5x
  "Obviously/Of course": 1.1x
  "Meanwhile": 0.6x (only for truly simultaneous plotlines)
  "Anyway/Anyways": 0.7x (after tangents, personality reset)
  Narrator interjections ("Man,", "Uh,", "Yeah."): 1.3x

Commentary placement:
- AFTER emotional peaks, not before
- AT episode transitions (1-2 sentences of reaction)
- NEVER mid-scene
- Withhold commentary at the 3 most powerful moments — silence is strongest
- Use the "Pronouncement Formula": [event sentence] + [2-8 word reaction]
  Example: "kills the parasite." + "Now that's a cold open."

Pop culture references: 1 per ~10 minutes. Mainstream only (movies, games, memes).
  Never reference competing recap channels. Never date the video with current events.

Episode transitions:
- Episodes 1-6: "The [ordinal] episode [opens/starts/begins] with [scene description]."
- Episodes 7+: "In the [ordinal] episode, [character] [action]."
- Finale: "In the season finale, [summary]."
- Arc-merged: No marker — continue narrating as continuous story

Sentence lengths:
- Short (2-5 words): 7% — reactions, interjections
- Medium (6-12 words): 31% — action beats
- Long (13-20 words): 41% — core narrative (dominant)
- Very long (21+ words): 21% — complex exposition
- Mean: 15 words/sentence. Max: 45. Never 3+ very-long in a row.

Tone mapping:
- Power-ups/fights: excited/hype (30% of commentary)
- Deaths/violence: dark humor (20%)
- Loss/emotional: empathetic (20%)
- Bad decisions/tropes: sarcastic (15%)
- Foreshadowing: conspiratorial (10%)
- Meta/fourth-wall: self-deprecating (5%)

Commentary density by section:
- Hook: 70%    | Act 1: 8%   | Acts 2-3: 4%
- Act 4: 2%    | Act 5: 4%   | Resolution: 10%  | Outro: 100%
```

**Script Output Format**:

```
[HOOK]
{hook text with [ANIME_DIALOGUE_SLOT: clip criteria] markers}

[ACT_1: episodes 1-2]
[EP_1]
{narration text...}
[ANIME_DIALOGUE_SLOT: "memorable line", ep=1, mode=woven, function=character_voice]
{narrator reaction...}
{continued narration...}
[/EP_1]
...

[OUTRO]
{outro text}
```

---

### 3.3 Scene Selection & Matching

**Input**: Script with timing annotations, per-episode scene manifests
**Output**: Visual timeline — ordered list of (source_episode, scene_index, start, end, duration)

#### 3.3.0 OP/ED Detection and Removal

Anime episodes contain opening (OP) and ending (ED) sequences — 60-90s of repeated footage with theme songs. These MUST be removed before scene classification and selection because:
1. They duplicate across all episodes (24 copies of the same footage pollutes the scene pool)
2. They contain credits/text overlays unusable in a recap
3. Their music would conflict with the recap's audio design

**Detection method (audio fingerprint matching)**:

```python
import subprocess, json, numpy as np

def detect_op_ed(episode_path: str, ep_num: int, total_eps: int) -> dict:
    """Detect OP/ED boundaries using audio fingerprinting + heuristics.

    Returns: {"op": {"start": float, "end": float} | None,
             "ed": {"start": float, "end": float} | None}
    """
    # Get episode duration
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", episode_path],
        capture_output=True, text=True
    )
    duration = float(json.loads(probe.stdout)["format"]["duration"])

    # Heuristic: OP is typically at 0:00-1:30 or 1:00-2:30 (after cold open)
    # ED is typically in last 2:00 of episode
    # Episode 1 often has no OP (or late OP after extended cold open)

    # Extract audio chromagram for first 3 min and last 3 min
    # Compare across episodes to find repeated segments
    op_region = {"start": 0, "end": min(180, duration * 0.15)}
    ed_region = {"start": max(0, duration - 180), "end": duration}

    return {"op": op_region, "ed": ed_region, "duration": duration}

def find_op_ed_by_cross_episode_matching(episode_paths: list[str]) -> list[dict]:
    """Compare audio across episodes to find the exact OP/ED boundaries.

    Strategy: Extract 10s audio hashes at 1s intervals from the first 3 min
    and last 3 min of each episode. Segments that match across 80%+ of
    episodes are OP/ED.
    """
    results = []
    for i, path in enumerate(episode_paths):
        # Step 1: Extract audio hashes (chromaprint)
        cmd = ["fpcalc", "-raw", "-length", "180", path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        # Step 2: Cross-correlate with other episodes
        # Step 3: High-correlation regions = OP/ED
        # (Implementation: use chromaprint fingerprints + cross-correlation)
        results.append(detect_op_ed(path, i + 1, len(episode_paths)))
    return results
```

**Simpler fallback** (if chromaprint is unavailable): Use duration heuristics — most anime OP is 89s, most ED is 90s. Skip first 90s and last 120s of each episode, then validate by checking if those regions have theme song audio (high music energy via Demucs vocals-vs-no_vocals ratio).

```bash
# Install chromaprint for fingerprinting
# apt install libchromaprint-tools  (provides fpcalc)
```

**After detection**: Mark OP/ED scenes in the episode manifest with `"skip": true`. All downstream stages (classification, selection, assembly) filter these scenes out.

#### 3.3.1 Source Scene Classification

Classify each source episode's scenes by visual content type:

| Type | Code | Detection Method |
|------|------|-----------------|
| Character Close-Up | CCU | Face detection (1 face, large in frame) |
| Action/Combat | ACT | High motion vectors, dark/intense palette |
| Dialogue/Interaction | DLG | 2+ faces in frame, conversation framing |
| Establishing/Wide | EST | No dominant face, wide composition |
| Object/Detail | OBJ | Close-up with no face, small subject |
| Reaction Shot | RXN | 1 face showing strong emotion (tears, shock) |
| Flash/Impact | FLS | Very bright/dark frame, motion blur, near-whiteout |

**Classification Pipeline (two-pass)**:

**Pass 1 — Heuristic pre-classification** (fast, runs on every scene):

```python
import cv2
import mediapipe as mp
import numpy as np

mp_face = mp.solutions.face_detection.FaceDetection(
    model_selection=1, min_detection_confidence=0.5
)

def classify_scene_heuristic(scene_frames: list[np.ndarray], prev_frame: np.ndarray | None):
    """
    scene_frames: list of BGR frames sampled from the scene (3 evenly spaced)
    prev_frame: last frame of the preceding scene (for motion estimation)
    Returns: (type_code, confidence)
    """
    mid = scene_frames[len(scene_frames) // 2]
    h, w = mid.shape[:2]
    rgb = cv2.cvtColor(mid, cv2.COLOR_BGR2RGB)

    # Face detection
    result = mp_face.process(rgb)
    faces = result.detections or []
    large_faces = [d for d in faces
                   if d.location_data.relative_bounding_box.width > 0.15]

    # Motion estimation (optical flow magnitude)
    motion = 0.0
    if prev_frame is not None:
        gray_cur = cv2.cvtColor(mid, cv2.COLOR_BGR2GRAY)
        gray_prev = cv2.cvtColor(
            cv2.resize(prev_frame, (w, h)), cv2.COLOR_BGR2GRAY
        )
        flow = cv2.calcOpticalFlowFarneback(
            gray_prev, gray_cur, None,
            pyr_scale=0.5, levels=3, winsize=15,
            iterations=3, poly_n=5, poly_sigma=1.2, flags=0
        )
        motion = np.mean(np.sqrt(flow[..., 0]**2 + flow[..., 1]**2))

    # Brightness analysis (flash detection)
    gray = cv2.cvtColor(mid, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    brightness_std = np.std(gray)

    # Classification rules
    if mean_brightness > 220 or mean_brightness < 15 or brightness_std < 20:
        return ("FLS", 0.85)
    if motion > 12.0:
        return ("ACT", 0.70)
    if len(large_faces) == 0:
        if motion < 2.0:
            return ("EST", 0.65)
        return ("OBJ", 0.55)
    if len(large_faces) >= 2:
        return ("DLG", 0.70)
    # Single face
    face_box = large_faces[0].location_data.relative_bounding_box
    face_area = face_box.width * face_box.height
    if face_area > 0.08:  # Large face = close-up
        return ("CCU", 0.75)
    return ("RXN", 0.50)  # Small single face = reaction
```

**Pass 2 — LLM refinement** (slow, runs on low-confidence scenes < 0.65):

```python
import anthropic, base64

client = anthropic.Anthropic()

def classify_scene_llm(frame_bytes: bytes, heuristic_type: str) -> str:
    """Refine classification using Claude's vision."""
    b64 = base64.standard_b64encode(frame_bytes).decode()
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=50,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64",
                    "media_type": "image/jpeg", "data": b64}},
                {"type": "text", "text": (
                    f"Classify this anime frame. Heuristic guess: {heuristic_type}. "
                    "Reply with exactly one code: CCU (character close-up), "
                    "ACT (action/combat), DLG (dialogue/interaction), "
                    "EST (establishing/wide), OBJ (object/detail), "
                    "RXN (reaction shot), FLS (flash/impact)."
                )}
            ]
        }]
    )
    code = response.content[0].text.strip().upper()[:3]
    return code if code in {"CCU","ACT","DLG","EST","OBJ","RXN","FLS"} else heuristic_type
```

**Cost control**: Pass 1 classifies ~95% of scenes with sufficient confidence. Pass 2 runs on the remaining ~5% (~100 scenes per episode, ~2,400 total for 24 eps). At ~$0.002/image with Sonnet, LLM refinement costs ~$5 total.

#### 3.3.2 Narration-to-Visual Matching

For each script segment, select clips matching this priority:

| Narration Content | Primary Clip Type | Secondary | Accent |
|------------------|-------------------|-----------|--------|
| Action/combat | ACT (60%) | CCU (20%) | FLS (10%), RXN (10%) |
| Character emotion | CCU (65%) | RXN (20%) | DLG (10%), OBJ (5%) |
| Plot exposition | CCU (30%) | EST (25%) | DLG (20%), OBJ (15%), ACT (10%) |
| Dialogue description | DLG (55%) | CCU (30%) | ACT (10%), OBJ (5%) |
| Transitions | EST (60%) | CCU (20%) | ACT (10%), DLG (10%) |
| Narrator commentary | **No change** — continue showing surrounding content clips |

**Spoiler prevention constraint**: When selecting clips for narration about episode N, the source pool is restricted to episodes ≤ N+1. This prevents showing future events (a character's death, a transformation, a reveal) before the narration reaches that point in the story.

```python
def get_eligible_scenes(current_episode: int, all_scenes: dict) -> list:
    """Return scenes eligible for use during narration of current_episode.

    Allows current episode and one episode ahead (for visual variety
    and because the narrator sometimes foreshadows by one episode).
    Never allows scenes from 2+ episodes ahead.
    """
    max_ep = current_episode + 1
    return [
        scene for ep_num, scenes in all_scenes.items()
        if ep_num <= max_ep
        for scene in scenes
    ]
```

**Hook exception**: The hook (Beat 2, anime teaser) may pull clips from episodes 1-4 only — these are early enough to be non-spoiling while visually striking.

**Validation**: After building the visual timeline, verify that no clip's source episode exceeds the narration's current episode + 1. Any violation is a hard failure — regenerate that segment.

#### 3.3.3 Clip Duration Generation

Generate each clip's duration from a log-normal distribution:

```python
import numpy as np

def generate_clip_duration(scene_type, video_progress, source_fps=None):
    """
    scene_type: one of CCU, ACT, DLG, EST, OBJ, RXN, FLS, ADP_held, ADP_woven
    video_progress: 0.0 to 1.0 (position in video)
    source_fps: source video frame rate (auto-detected per episode, typically 24 for anime)
    """
    # Auto-detect FPS if not provided
    if source_fps is None:
        source_fps = 24  # Most anime is 23.976/24fps

    # Base log-normal parameters (from reference analysis)
    mu = 0.6070
    sigma = 0.5021

    # Content-type modifiers
    modifiers = {
        "ACT": 0.85, "FLS": 0.50, "CCU": 1.00,
        "DLG": 1.10, "EST": 1.20, "RXN": 0.75,
        "OBJ": 1.00, "ADP_woven": 1.00,
    }

    if scene_type == "ADP_held":
        return np.random.uniform(5.0, 10.0)  # Fixed override

    # Generate base duration
    base = np.exp(np.random.normal(mu, sigma))
    modified = base * modifiers.get(scene_type, 1.0)

    # Flash cut acceleration: sub-1s clips increase from 10% to 15% across video
    if scene_type == "FLS":
        flash_boost = 0.10 + 0.05 * video_progress
        if np.random.random() < flash_boost:
            return max(0.6, np.random.uniform(0.6, 1.0))

    # Clamp to valid range (time-based, not frame-based)
    floor = 0.600   # Minimum clip duration in seconds
    ceiling = 4.675  # IQR upper fence in seconds
    duration = max(floor, min(ceiling, modified))

    # Quantize to frame boundaries at source FPS
    min_frames = max(1, round(floor * source_fps))  # 24fps → 14 frames, 30fps → 18 frames
    frames = max(min_frames, round(duration * source_fps))
    return frames / source_fps
```

#### 3.3.4 Scene Type Distribution Targets

| Type | Target % | Avg Duration |
|------|---------|-------------|
| Character Close-Up (CCU) | 30-35% | 2.0-2.2s |
| Action/Combat (ACT) | 22-26% | 1.4-1.7s |
| Dialogue/Interaction (DLG) | 13-17% | 2.1-2.4s |
| Establishing/Wide (EST) | 11-14% | 2.3-2.6s |
| Object/Detail (OBJ) | 6-9% | 2.0-2.3s |
| Reaction Shot (RXN) | 5-8% | 1.3-1.6s |
| Flash/Impact (FLS) | 3-5% | 0.6-0.9s |

#### 3.3.5 CPM Guardrails

| Metric | Target |
|--------|--------|
| Mean cuts per minute | 28.8 |
| Stdev | 3.7 |
| Soft range (1σ) | 25-33 CPM |
| Hard floor | 18 CPM |
| Hard ceiling | 38 CPM |
| Hook (first 5 min) | 31 CPM (10-15% above body) |
| Minute 72 (resolution) | 18-22 CPM (slowest, reflective) |

After generating clips for each minute, validate CPM. If outside soft range, redistribute clip durations. If outside hard bounds, regenerate.

---

### 3.4 Narration Audio Generation (TTS)

**Input**: Narrator script (text)
**Output**: Narration audio file (WAV/MP3) with per-segment timestamps

#### 3.4.1 TTS Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Baseline WPM | 144 | pacing-metrics.md |
| Accelerated WPM | 152 | pacing-metrics.md |
| Hook effective WPM | 108 (via pauses, not slower speech) | hook-pattern.md |
| Outro effective WPM | 100 | pacing-metrics.md |
| Voice register | Male, casual, conversational | narration-style.md |
| Compression ratio | 4:1 | audio-layers.md |
| Target LRA | < 4.5 LU | audio-layers.md |

#### 3.4.2 Per-Episode WPM Assignment

```python
def episode_wpm(ep_num, total_eps):
    baseline = 144
    accelerated = 152
    progress = ep_num / total_eps
    wpm = baseline + (accelerated - baseline) * (progress ** 1.3)
    return round(wpm, 1)
# Ep 1: 144.0 | Ep 12: 146.3 | Ep 18: 149.0 | Ep 24: 152.0
```

#### 3.4.3 Pause Insertion

Speed variation comes from PAUSING, not slower speech. The TTS engine maintains constant WPM within spoken segments.

| Pause Type | Duration | Count | Placement |
|-----------|----------|-------|-----------|
| Anime dialogue pause | 0.3-0.5s before, 0.5-2.0s after | ~25 per video | Before/after every anime dialogue slot |
| Significant pause | 2-10s (mean 4.6s) | 6-10 per video | At anime dialogue moments |
| Hook Beat 2 pause | 5.9s (2nd longest in video) | 1 | During anime teaser clips |

#### 3.4.4 TTS Generation

Generate narration audio per-segment (one `[EP_N]` block or structural section at a time). Each segment is generated separately to allow pause insertion and per-episode WPM control.

**Provider: ElevenLabs** (`eleven_multilingual_v2` model, best prosody control for casual narration):

```python
from elevenlabs import ElevenLabs

client = ElevenLabs(api_key="...")

def generate_narration_segment(text: str, target_wpm: float) -> bytes:
    """Generate a narration segment with WPM control via stability/speed settings."""
    # ElevenLabs speed parameter: 1.0 = normal. Map WPM to speed multiplier.
    # Reference: their default is ~150 WPM at speed=1.0
    speed = target_wpm / 150.0  # e.g., 144 WPM → 0.96, 152 WPM → 1.01

    audio = client.text_to_speech.convert(
        text=text,
        voice_id="<voice-id>",     # Use a cloned or pre-selected casual male voice
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
        voice_settings={
            "stability": 0.35,       # Low = more expressive/casual
            "similarity_boost": 0.75,
            "style": 0.4,            # Moderate style exaggeration
            "speed": speed,
        },
    )
    # audio is a generator of bytes
    return b"".join(audio)

# Usage per segment:
for segment in script_segments:
    wpm = episode_wpm(segment.episode, total_eps)
    audio_bytes = generate_narration_segment(segment.text, wpm)
    with open(f"raw/narration/{segment.id}.mp3", "wb") as f:
        f.write(audio_bytes)
```

**WPM verification**: After generation, validate actual WPM by dividing word count by audio duration. If >5% off target, regenerate with adjusted speed parameter.

**Segment concatenation**: After all segments are generated, concatenate with silence gaps:

```bash
# Build concat list with pauses between segments
# pause_N.wav files are generated silence (sox -n pause.wav trim 0 4.6)
ffmpeg -f concat -safe 0 -i narration_concat.txt -c:a pcm_s16le narration_raw.wav
```

#### 3.4.5 Narration Audio Processing

```bash
# 1. TTS audio is already generated per 3.4.4
# 2. Apply compression
ffmpeg -i narration_raw.wav -af "acompressor=ratio=4:attack=5:release=100:threshold=-20dB" narration_compressed.wav

# 3. Verify LRA
ffmpeg -i narration_compressed.wav -af loudnorm=print_format=json -f null - 2>&1
# LRA should be < 4.5 LU
```

---

### 3.5 Anime Dialogue Moment Selection

**Input**: Episode transcriptions, episode summaries, narrator script with `[ANIME_DIALOGUE_SLOT]` markers
**Output**: Ordered list of moments with extracted audio/video clips

#### 3.5.1 Moment Budget

| Season Length | Moments | Total Time Budget |
|-------------|---------|-----------------|
| 24 episodes | 10-12 | 2-3% of video duration |
| 12 episodes | 5-7 | 2-3% of video duration |

#### 3.5.2 Selection Criteria

A moment must meet at least ONE required criterion:

| Required Criteria | Description |
|------------------|-------------|
| Character-defining quote | Line that defines a character's identity or relationship |
| Emotional peak | Maximum emotional intensity (horror, shock, desperation) |
| Plot twist | Unexpected revelation that changes story direction |
| Character transformation | Protagonist power-up, breakdown, or fundamental change |
| Climactic action | Final battle or major confrontation |

Boosters (increase priority): short punchy line (<10 words), comedy potential, dramatic irony, universal reaction

Disqualifiers (never select): exposition-heavy lines, mid-conversation lines, lines redundant with narration

#### 3.5.3 Anime Line Constraints

| Metric | Target |
|--------|--------|
| Mean line length | 7.5 words |
| Max line length | 12 words |
| Shortest acceptable | 1 word ("Well,") |

#### 3.5.4 Temporal Distribution

| Act | Moments | Density |
|-----|---------|---------|
| Act 1 (Premise) | 1 | 1 per 10-12 min |
| Act 2 (Escalation) | 2-3 | 1 per 5-6 min |
| Act 3 (Transformation) | 3-5 | 1 per 3-4 min (peak) |
| Act 4 (Climax Build) | **0** | Intentional drought |
| Act 5 (Climax) | 1 | Rapid cluster for impact |
| Resolution | **0** | Narrator controls ending |

Spacing: min gap 80s, typical gap 300-400s, max gap 1200s (Act 4 drought)

#### 3.5.5 Delivery Modes

| Mode | % of Moments | Trigger | Visual | Duration |
|------|-------------|---------|--------|----------|
| **Woven** | 73% | Default. Standard moments | Standard clip pacing (28-30 CPM) | 8-12s |
| **Held** | 18% | Character-defining quotes | Single held shot (5-10s) | 12-16s |
| **Rapid Cluster** | 9% | Climactic multi-character action | Fast clips (30+ CPM) | 12-15s |

#### 3.5.6 Moment Construction Template

```
WOVEN (default):
  [Narrator setup: 1-2 sentences, 3-8s]
  [Pause: 0.3-0.5s]
  [Anime line: 1 line, 3-10 words, 2-5s]
  [Gap: 0.5-2.0s]
  [Narrator reaction: 1 sentence, personality-heavy, 2-4s]
  [Resume narration immediately]

HELD (character-defining):
  [Narrator setup: 1 sentence]
  [Pause: 0.5-1.0s]
  [Anime lines: 1-2 lines, 5-10s]
  [HOLD single clip showing speaking character]
  [Narrator reaction: 1 emphatic sentence]

RAPID CLUSTER (climax):
  [Narrator setup: 1 short sentence]
  [3-5 rapid anime lines from multiple characters, 5-8s]
  [Rapid visual editing at 30+ CPM]
  [Narrator visceral reaction]
```

#### 3.5.7 Narrator Reaction (mandatory after every moment)

| Type | When | Examples |
|------|------|---------|
| Personality injection | Most common | "Oh, yeah. That line's going to stick with me." |
| Audience surrogate | Tension/horror | "Not good." / "Damn, fellas." |
| Bridging explanation | Complex reveals | "Apparently, regardless of..." |

Delivery: +3 to +5 dB above standard narration, 150-180 WPM, maximum casual register

#### 3.5.8 Audio Extraction

```bash
# Extract anime dialogue audio clip (centered on selected line)
ffmpeg -i raw/episodes/03/separated/vocals.wav -ss 10:18 -t 6.0 -c copy moment_03_vocals.wav

# Preserve ambience at -10 dB
ffmpeg -i raw/episodes/03/separated/no_vocals.wav -ss 10:18 -t 6.0 -af "volume=-10dB" moment_03_ambience.wav

# Mix
ffmpeg -i moment_03_vocals.wav -i moment_03_ambience.wav -filter_complex amix=inputs=2 moment_03_final.wav

# Normalize to match narration LUFS
ffmpeg -i moment_03_final.wav -af loudnorm=I=-27:TP=-3:LRA=4 moment_03_normalized.wav
```

---

### 3.6 Music Selection & Audio Mixing

**Input**: Narration audio, anime dialogue clips, selected music tracks
**Output**: Final mixed audio track

#### 3.6.1 Two-Track Music Architecture

| Track | Usage | Genre | Requirements |
|-------|-------|-------|-------------|
| **Hook track** | 0:00 to ~5:00 | Cinematic underscore / epic ambient | Dynamic swells, no vocals, no strong beat, genre-matched to anime |
| **Body track** | ~3:30 to end | Lo-fi ambient / background texture | Barely audible pad, no melodic hooks, smooth spectral contour |

Crossfade: 60-90s overlap starting at ~3:30

#### 3.6.2 Music Energy Envelope

| Phase | Time | Base Level | Swell Targets | Behavior |
|-------|------|-----------|--------------|----------|
| Hook | 0:00-5:00 | -55 dB RMS | Anime teaser: -33 dB, Narrator reaction: -45 dB | Active — swell on clips, duck on narration |
| Body | 5:00-70:00 | -68 dB RMS | Anime dialogue: -50 dB (rise 1s, hold 3-8s, fall 2s) | Flat pad with event-triggered swells |
| Finale | 70:00-74:47 | -67 dB RMS | None | Static — near-absent |
| Outro | 74:47-end | -55 dB RMS | Sign-off: -50 dB | Brief swell then fade |

#### 3.6.3 Sidechain Ducking Configuration

Apply to music track, keyed to narration track:

| Parameter | Value |
|-----------|-------|
| Ratio | inf:1 (limiter mode) |
| Threshold | -40 dB (duck when narration present) |
| Attack | 20 ms |
| Release | 300 ms |
| Hold | 100 ms |
| Range (hook) | -20 dB (music audible) |
| Range (body) | -30 dB (music imperceptible) |
| Range (anime dialogue) | -15 dB (music supports moment) |

#### 3.6.4 Music Swell Triggers

Music swells are ONLY triggered by anime dialogue moments. NOT by:
- Episode boundaries
- Act transitions
- Death scenes (unless accompanied by anime dialogue)
- Action sequences (unless in hook)
- Narrator commentary

#### 3.6.5 Three-Track Mixing Model

```
Track 1: Narration (dominant)
  Target: -22 to -27 LUFS
  Processing: Compressed (LRA < 4.5 LU)

Track 2: Music (background)
  Target: Hook -36 LUFS, Body -36 to -61 LUFS
  Processing: Sidechain ducked under Track 1

Track 3: Anime Dialogue (pass-through)
  Target: Match narration level (-27 to -22 LUFS)
  Processing: Normalized to match Track 1
```

#### 3.6.6 Final Loudness Normalization

```bash
# Two-pass loudnorm for best quality
# Pass 1: measure
ffmpeg -i mixed.wav -af loudnorm=I=-14:TP=-1.0:LRA=6:print_format=json -f null - 2>&1

# Pass 2: apply with measured values
ffmpeg -i mixed.wav -af "loudnorm=I=-14:TP=-1.0:LRA=6:measured_I={val}:measured_TP={val}:measured_LRA={val}:measured_thresh={val}:offset={val}:linear=true" final_audio.wav
```

| Target | Value | Rationale |
|--------|-------|-----------|
| Integrated loudness | -14 LUFS | YouTube standard |
| True peak | -1.0 dBTP | Industry standard for streaming |
| Loudness range | 5-7 LU | Matches reference's compressed style |

---

### 3.7 Video Assembly & Render

**Input**: Visual timeline, final audio track
**Output**: Finished recap video

#### 3.7.1 Assembly Process

1. Build FFmpeg concat filter from visual timeline (source episode + scene timestamps + durations)
2. Merge visual track with final audio track
3. Render to output format

#### 3.7.2 Output Specification

| Parameter | Default | Options |
|-----------|---------|---------|
| Resolution | 1920x1080 | 1280x720, 1920x1080, 3840x2160 |
| Frame rate | Auto-detect from source | 23.976 (most anime), 29.97, 24, 30 |
| Video codec | H.264 (libx264) | H.265 (libx265) |
| Audio codec | AAC 192kbps | AAC 320kbps |
| Container | MP4 | MKV |
| CRF | 18 | 15-23 |

#### 3.7.3 FFmpeg Render Command

```bash
# Concat visual segments + merge audio
ffmpeg \
  -f concat -safe 0 -i visual_timeline.txt \
  -i final_audio.wav \
  -c:v libx264 -crf 18 -preset medium \
  -c:a aac -b:a 192k \
  -map 0:v -map 1:a \
  -movflags +faststart \
  output/recap.mp4
```

---

## 4. The Formula — All Extracted Parameters

### Pacing Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Narration WPM (baseline) | 144 | pacing-metrics.md |
| Narration WPM (accelerated) | 152 | pacing-metrics.md |
| WPM acceleration | +5.4% first→second half | pacing-metrics.md |
| WPM coefficient of variation | 10.8% | pacing-metrics.md |
| Narration coverage | 99.2% | pacing-metrics.md |
| Sentence mean length | 15.2 words | pacing-metrics.md |
| Breathing events (total) | 19 (8 pauses + 11 anime dialogue) | pacing-metrics.md |
| Breathing event interval (median) | 2.2 min | pacing-metrics.md |

### Visual Editing Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Total scenes (75 min) | 2,171 | scene-boundaries.md |
| Cuts per minute (mean) | 28.8 | scene-boundaries.md |
| CPM stdev | 3.7 | clip-duration-stats.md |
| Median clip duration | 1.83s | clip-duration-stats.md |
| Mean clip duration | 2.08s | clip-duration-stats.md |
| Min clip duration | 0.6s (18 frames) | scene-boundaries.md |
| Max clip (normal) | 4.675s | clip-duration-stats.md |
| Distribution | Log-normal (mu=0.607, sigma=0.502) | clip-duration-stats.md |
| Autocorrelation (lag-1) | 0.131 (independent sampling valid) | clip-duration-stats.md |
| Flash cut increase Q1→Q4 | 10.1% → 15.0% | clip-duration-stats.md |

### Audio Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Integrated loudness | -25.36 LUFS (reference) / -14 LUFS (target) | audio-profile.md |
| True peak | -2.90 dBTP (reference) / -1.0 dBTP (target) | audio-profile.md |
| Loudness range | 6.0 LU (reference) / 5-7 LU (target) | audio-profile.md |
| Narration LRA | 3.6-4.1 LU | audio-layers.md |
| Hook boost | +3 to +5 dB above body | audio-profile.md |
| Vocal-music gap (hook) | 14.4 dB | audio-layers.md |
| Vocal-music gap (body) | 9.6 dB | audio-layers.md |
| Vocal-music gap (finale) | 34.0 dB | audio-layers.md |
| Hook music LRA | 25.3 LU (dynamic) | audio-layers.md |
| Body music LRA | 15.1 LU (ambient) | audio-layers.md |
| Sidechain duck depth | -20 to -30 dB | audio-layers.md |
| Sidechain attack | 10-50 ms | audio-layers.md |
| Sidechain release | 200-500 ms | audio-layers.md |
| Silence regions in 75 min | 3 (2.23s total) | audio-profile.md |

### Script/Narrator Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Total words (75 min) | 10,759 narration + 140 anime dialogue | narration-transcript.md |
| Commentary ratio | 96% recap : 4% commentary | narration-style.md |
| Pop culture references | ~8 per 75 min (1 per 9.4 min) | narration-style.md |
| "So," frequency | 25 per 75 min (1 per 3 min) | transition-phrases.md |
| "Unfortunately/Fortunately" ratio | 2:1 (14:7) | transition-phrases.md |
| "Anyway" frequency | 10 per 75 min (1 per 7.5 min) | transition-phrases.md |
| Transition density | ~2.1 per minute | transition-phrases.md |
| Episode explicit markers | 83% | script-structure.md |
| Arc-merged episodes | 17% | script-structure.md |
| Anime dialogue moments | 25 segments → 11 moments | anime-dialogue-moments.md |
| Moment mean duration | 10.5s | anime-dialogue-moments.md |
| Moment mean gap | 6.6 min | anime-dialogue-moments.md |

### Structural Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Hook duration | 36s (0.8%) | script-structure.md |
| Outro duration | 28s (0.6%) | script-structure.md |
| Number of acts | 5 (+ hook + resolution + outro = 8 parts) | script-structure.md |
| Act 1 (Premise) | 15.8% | script-structure.md |
| Acts 2-3 (Rising) | 45.8% | script-structure.md |
| Acts 4-5 (Climax) | 33.2% | script-structure.md |
| Resolution | 3.6% | script-structure.md |
| Episode duration: early | 5.5 min/ep (1.7x avg) | script-structure.md |
| Episode duration: mid | 3.2 min/ep (1.0x avg) | script-structure.md |
| Episode duration: late | 2.1 min/ep (0.7x avg) | script-structure.md |
| Episode duration: finale | 2.7 min/ep (1.1x avg bump) | script-structure.md |

---

## 5. Config Schema

```yaml
# Full config.yaml schema with defaults

anime:
  title: string                    # Required: "Parasyte: The Maxim"
  season: integer                  # Required: 1
  total_episodes: integer          # Required: 24
  genre: string                    # Required: "horror/sci-fi" | "action" | "romance" | ...
  language: string                 # Required: "ja" (ISO 639-1)

output:
  target_duration_minutes: integer # Default: episodes * 3.1 (75 min for 24 eps)
  narration_language: string       # Default: "en"
  voice: string                    # Default: "male-casual" | "female-casual"
  quality: string                  # Default: "1080p" | "720p" | "4k"
  fps: integer                     # Default: auto-detect from source (most anime is 24)

pacing:
  baseline_wpm: integer            # Default: 144
  accelerated_wpm: integer         # Default: 152
  target_cpm: float                # Default: 28.8
  cpm_range: [integer, integer]    # Default: [18, 38]

audio:
  target_lufs: float               # Default: -14.0
  target_true_peak: float          # Default: -1.0
  target_lra: float                # Default: 6.0
  hook_boost_db: float             # Default: 4.0
  narration_lra_max: float         # Default: 4.5

music:
  hook_track: string               # Path to hook music file (or "auto" for generation)
  body_track: string               # Path to body music file (or "auto")
  hook_base_db: float              # Default: -55
  body_base_db: float              # Default: -68

anime_dialogue:
  moments_count: integer           # Default: auto (total_episodes / 2)
  act_4_moments: integer           # Default: 0 (intentional drought)
  held_mode_pct: float             # Default: 0.18
  rapid_cluster_count: integer     # Default: 1

narrator:
  commentary_ratio: float          # Default: 0.04 (4%)
  pop_culture_per_10min: float     # Default: 1.0
  character_address_max: integer   # Default: 4
  formal_connectors_max: integer   # Default: 2 ("However" only, never more)

tools:
  scene_detect_threshold: integer  # Default: 27
  whisper_model: string            # Default: "large-v3" (or "base" for CPU)
  demucs_model: string             # Default: "htdemucs"
  tts_provider: string             # "elevenlabs"
  llm_provider: string             # "claude" | "openai"
```

---

## 6. Output Contract

### Primary Output

```
recap.mp4                 # The finished recap video
```

### Intermediate Artifacts

```
raw/
├── episodes/
│   └── {01..24}/
│       ├── scenes.csv        # PySceneDetect output
│       ├── scenes.json       # Processed scene list
│       ├── transcription.json # Whisper or SRT output
│       └── separated/
│           ├── vocals.wav
│           └── no_vocals.wav
├── manifest.json             # Unified episode metadata
├── script.md                 # Generated narrator script
├── visual_timeline.json      # Ordered clip list
├── narration.wav             # TTS output (before mixing)
├── anime_dialogue/
│   └── moment_{01..12}.wav   # Extracted anime dialogue clips
├── music/
│   ├── hook_track.wav
│   └── body_track.wav
└── mixed_audio.wav           # Pre-normalization mix
```

### Metadata JSON

```json
{
  "duration_s": 4516.0,
  "total_clips": 2171,
  "total_words": 10800,
  "global_wpm": 144.1,
  "anime_dialogue_moments": 11,
  "acts": [...],
  "per_episode": [
    {"episode": 1, "start_s": 36, "end_s": 432, "wpm": 145.6, "words": 960}
  ]
}
```

---

## 7. Quality Validation

### Tier 1: Timeline Validation (fast, no render needed)

| Check | Target | Fail Condition |
|-------|--------|---------------|
| Total word count | ±5% of word budget | >10% deviation |
| Per-episode word count | Within compression curve | Any episode >2x or <0.3x average |
| Anime dialogue moment count | 10-12 for 24 eps | <8 or >15 |
| Act 4 moments | 0 | Any moments in Act 4 |
| Script has no formal connectors | 0 "Nevertheless/Furthermore/Moreover" | Any found |
| Hook follows 4-beat template | All 4 beats present | Missing beat |
| Outro has sign-off | Ends with catchphrase | Missing |

### Tier 2: Audio Validation (requires TTS + mix)

| Check | Target | Fail Condition |
|-------|--------|---------------|
| Global WPM | 144 ±5 | Outside 130-160 |
| Per-30s window WPM | 120-175 in body | Any window outside 100-190 |
| WPM CV | <12% | >15% |
| Narration coverage | >98% | <95% |
| Integrated loudness | -14 to -16 LUFS | Outside -12 to -18 |
| True peak | < -1.0 dBTP | > 0 dBTP |
| LRA | 5-7 LU | <3 or >10 |
| Voice-to-music gap | >10 dB always, >20 dB in body | <8 dB anywhere |
| No silence > 0.5s | (except anime dialogue pauses) | >1.0s silence in body |

### Tier 3: Sample Validation (spot-check rendered segments)

Render 3 sample segments (hook, mid-body, climax) and verify:

| Check | Method |
|-------|--------|
| Visual-narration alignment | Watch 30s sample — do clips match narration content? |
| Anime dialogue integration | Is the moment audible, properly ducked, with narrator reaction? |
| Music presence | Is music audible in hook, inaudible in body? |
| Pacing feel | Does it feel like "a friend retelling" vs "a robot reading"? |

### Tier 4: Full Validation (requires complete render)

Watch the entire video and check:
- Does the hook grab attention in the first 10 seconds?
- Does the narrator feel like a person, not an AI?
- Are anime dialogue moments properly motivated and impactful?
- Does Act 4 feel "relentless" (no breathing room)?
- Does the climax payoff (Act 5 rapid cluster) hit harder because of Act 4 drought?
- Does the outro feel conclusive?

---

## 8. Tech Stack & Dependencies

### Core Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10+ | Pipeline orchestration |
| FFmpeg | 6.0+ | Audio/video processing, rendering, loudness |
| PySceneDetect | 0.6+ | Scene boundary detection |
| Whisper (openai-whisper) | latest | Transcription (GPU: large-v3, CPU: base) |
| Demucs | latest | Audio source separation |

### Python Libraries

| Library | Purpose |
|---------|---------|
| numpy | Clip duration generation (log-normal sampling) |
| scipy | Statistical validation |
| json | Data interchange |
| subprocess | FFmpeg/tool invocation |

### AI/LLM

| Service | Purpose |
|---------|---------|
| Claude API (Anthropic) | Episode summarization, script generation, dialogue selection |
| ElevenLabs TTS | Narration audio generation (eleven_multilingual_v2 model) |

### Music Sources

| Option | Notes |
|--------|-------|
| Royalty-free library | Pre-selected cinematic (hook) + ambient (body) tracks |
| AI music generation | Suno / Udio with genre-matched prompts |
| Manual selection | User provides music files via config |

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores (FFmpeg encoding) |
| RAM | 8 GB | 16+ GB (Demucs, Whisper) |
| GPU | None (CPU fallback) | NVIDIA 8GB+ VRAM (Whisper large-v3, Demucs) |
| Storage | 50 GB | 100+ GB (24 episodes + intermediates) |
| Network | Required | Claude API, TTS API, optional music API |

### Estimated Processing Time

| Stage | CPU Only | With GPU |
|-------|---------|----------|
| Scene detection (24 eps) | ~30 min | ~10 min |
| Transcription (24 eps) | ~4 hours (base model) | ~30 min (large-v3) |
| Audio separation (24 eps) | ~3 hours | ~30 min |
| Script generation (LLM) | ~10 min | ~10 min |
| TTS generation | ~5 min | ~5 min |
| Music mixing | ~5 min | ~5 min |
| Video rendering | ~30 min | ~15 min |
| **Total** | **~5-6 hours** | **~1.5-2 hours** |
