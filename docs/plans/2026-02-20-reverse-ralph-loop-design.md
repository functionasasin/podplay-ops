# Reverse Ralph Loop — Anime Recap Engine Spec Generator

> A ralph-style analysis loop that watches reference anime recap videos (JarAnime style) and outputs a complete software specification for a forward engine that can produce identical recap videos from any anime season, in any language.

**Status**: Approved
**Created**: 2026-02-20
**Related**: [[anime-highlight-generator]], [[anime-highlight-engine-spec]]
**Reference Video**: "The ENTIRE Story Of Parasyte: The Maxim In 75 Minutes" by JarAnime

---

## Table of Contents

1. [Overview](#overview)
2. [Reference Video Analysis](#reference-video-analysis)
3. [Loop Architecture](#loop-architecture)
4. [Frontier Seeding & Analysis Aspects](#frontier-seeding--analysis-aspects)
5. [Spec Output Format](#spec-output-format)
6. [Tools & Dependencies](#tools--dependencies)
7. [Practical Considerations](#practical-considerations)

---

## Overview

### What This Is

A **reverse ralph loop** that analyzes reference anime recap videos and outputs a complete **software specification** for a forward engine. The forward engine takes a folder of anime episodes and produces a JarAnime-style recap video.

### The Ralph Loop Pattern

Each iteration of the loop:
1. Reads a frontier of analysis aspects
2. Picks ONE aspect to analyze
3. Runs the appropriate tool (Whisper, ffmpeg, LLM reasoning)
4. Writes findings to the filesystem
5. Updates the frontier (marks done, adds newly-discovered aspects)
6. Commits and exits

The bash loop restarts Claude Code for each iteration. Convergence occurs when the frontier is exhausted and the generated spec passes self-review.

### Inputs & Outputs

**Input**: Reference video(s) — starting with JarAnime's Parasyte recap (75 min, English narration)

**Output**: A complete software spec at `docs/plans/anime-recap-engine-spec.md` that describes:
- Forward engine architecture (input folder of episodes + config → output video)
- All extracted formula parameters (pacing, scene selection, audio mix, script patterns)
- Config schema with language selection (narration TTS language)
- Quality validation criteria

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language support | Narration language only | Script content stays the same, TTS generates in target language |
| Anime dialogue | Include key moments | JarAnime lets emotional/funny lines play through — spec must describe when/why |
| Reference input | Start with one, design for many | Analyze Parasyte video deeply now, architecture supports adding more later |
| Execution model | Ralph loop (frontier-driven) | Matches existing monorepo patterns, atomic commits, resumable, emergent discovery |
| Output type | Software specification | Not config — a full spec that a developer/Claude session can implement |

---

## Reference Video Analysis

### Video: JarAnime — Parasyte: The Maxim (75 min)

**Format observations** (from downloaded video + auto-generated transcript):

- **Pure anime footage** as visuals — no face cam, no text overlays, no editing effects
- **Continuous English narration** over clips, conversational and personality-driven
- **Selective original audio** — key anime dialogue moments play through (narrator pauses)
- **Pop culture references** woven in naturally ("Stranger Things", "demogorgan")
- **Chronological episode-by-episode** coverage of the full 24-episode series
- **Structure**: Hook question → "Let's get into it" → Episode recaps → Reflection + outro

**Narration style**: Casual, engaged, personality-driven. The narrator invests emotionally ("When I tell you I stopped breathing"), makes pop culture connections, and addresses the viewer directly. Not a neutral Wikipedia recap — it's entertainment.

**Audio layers**: Narrator voice (primary), background music (ducked during narration), anime audio (selectively included for key moments).

---

## Loop Architecture

### Directory Structure (Monorepo Placement)

```
/monorepo
├── automations/
│   └── anime-recap-reverse-ralph/        # The loop lives here
│       ├── PROMPT.md                      # Loop prompt for Claude Code
│       ├── reverse-ralph.sh               # Bash loop runner
│       ├── input/
│       │   └── reference/
│       │       ├── jaranime-parasyte.mp4
│       │       └── jaranime-parasyte.en-orig.srt
│       ├── raw/                           # Tool output (JSON, WAV, frames)
│       │   ├── transcription.json         # Whisper word-level timestamps
│       │   ├── scenes.json                # PySceneDetect boundaries
│       │   ├── audio-levels.json          # LUFS/RMS volume envelope
│       │   ├── separated/                 # Demucs audio separation
│       │   └── frames/                    # Keyframes per scene
│       ├── analysis/                      # One .md per analyzed aspect
│       │   ├── narration-transcript.md
│       │   ├── script-structure.md
│       │   ├── hook-pattern.md
│       │   └── ...
│       ├── frontier/
│       │   ├── aspects.md                 # Analysis queue
│       │   └── analysis-log.md            # Iteration history
│       └── status/
│           └── converged.txt              # Stop signal
│
├── docs/plans/
│   └── anime-recap-engine-spec.md         # Final output: the software spec
│
├── entities/projects/
│   └── anime-highlight-generator.md       # Project entity (update status)
```

### Loop Runner

```bash
#!/bin/bash
# automations/anime-recap-reverse-ralph/reverse-ralph.sh
WORK_DIR="$(dirname "$0")"

while [ ! -f "$WORK_DIR/status/converged.txt" ]; do
    cd "$WORK_DIR" && claude-code < PROMPT.md
    sleep 5
done

echo "Reverse ralph converged. Spec at docs/plans/anime-recap-engine-spec.md"
```

### PROMPT.md (Loop Prompt)

Each iteration, Claude Code receives this prompt and:

1. **Reads the frontier** at `frontier/aspects.md`
2. **Picks the highest-priority unanalyzed aspect** (respecting dependency order)
3. **Runs the appropriate tool** for that aspect (Whisper, ffmpeg, Python, or LLM reasoning)
4. **Writes findings** to `analysis/{aspect-name}.md`
5. **Updates frontier** — marks aspect done, adds any newly-discovered aspects
6. **Checks convergence** — if frontier exhausted AND spec draft passes self-review, writes `status/converged.txt`
7. **Commits** with message `analyze: {aspect-name}` and exits

### One Iteration = One Aspect

| Iteration | Aspect | Tool | Output |
|-----------|--------|------|--------|
| 1 | `transcription` | Whisper large-v3 | `raw/transcription.json` + `analysis/narration-transcript.md` |
| 2 | `scene-detection` | PySceneDetect | `raw/scenes.json` + `analysis/scene-boundaries.md` |
| 3 | `audio-levels` | ffmpeg | `raw/audio-levels.json` + `analysis/audio-profile.md` |
| 4 | `audio-separation` | Demucs | `raw/separated/` + `analysis/audio-layers.md` |
| 5 | `script-structure` | LLM over transcript | `analysis/script-structure.md` |
| 6 | `hook-pattern` | LLM reasoning | `analysis/hook-pattern.md` |
| 7 | `transition-phrases` | LLM over transcript | `analysis/transition-phrases.md` |
| 8 | `pacing-metrics` | Python + LLM | `analysis/pacing-metrics.md` |
| 9 | `scene-type-distribution` | LLM over scenes + transcript | `analysis/scene-types.md` |
| 10 | `clip-duration-stats` | Python over scenes.json | `analysis/clip-durations.md` |
| 11 | `anime-dialogue-moments` | LLM over transcript (>> markers) | `analysis/dialogue-moments.md` |
| 12 | `narration-style` | LLM over transcript | `analysis/narration-style.md` |
| 13 | `music-patterns` | LLM + audio analysis | `analysis/music-patterns.md` |
| ... | (emergent aspects) | varies | ... |
| N-1 | `spec-draft` | LLM synthesis | `docs/plans/anime-recap-engine-spec.md` |
| N | `spec-review` | LLM self-review | converged or loops back |

---

## Frontier Seeding & Analysis Aspects

### Seed Frontier

```markdown
# Analysis Frontier

## Statistics
- Total aspects discovered: 15
- Analyzed: 0
- Pending: 15
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Raw Data Extraction (tools required)
- [ ] transcription — Whisper transcription of narration with word-level timestamps
- [ ] scene-detection — PySceneDetect scene boundaries + keyframe extraction
- [ ] audio-levels — RMS/LUFS volume envelope over time via ffmpeg
- [ ] audio-separation — Demucs to separate narration/music/anime audio tracks

### Wave 2: Pattern Analysis (LLM reasoning over raw data)
- [ ] script-structure — Identify sections (hook, context, arcs, climax, outro) with timestamps
- [ ] hook-pattern — How the video opens, rhetorical devices, what makes it engaging
- [ ] transition-phrases — Catalog all recurring connector language with timestamps
- [ ] pacing-metrics — WPM, pause timing, segment durations, breathing room patterns
- [ ] scene-type-distribution — Action/dialogue/reaction/emotional ratios
- [ ] clip-duration-stats — Statistical distribution of visual clip durations
- [ ] anime-dialogue-moments — When/why/how the narrator lets anime audio play through
- [ ] narration-style — Tone, personality, pop culture refs, commentary-vs-recap ratio
- [ ] music-patterns — Energy mapping to content, ducking curves, genre/mood

### Wave 3: Synthesis
- [ ] spec-draft — Synthesize all analysis into the complete software spec
- [ ] spec-review — Self-review spec for completeness and actionability

## Recently Analyzed
(empty)
```

### Emergent Discovery

Analyzing one aspect may reveal new aspects not in the seed. Examples:

| While Analyzing... | Might Discover... |
|---|---|
| `pacing-metrics` | `narration-breathing-room` — deliberate slow-downs for dramatic effect |
| `pacing-metrics` | `recap-vs-commentary-ratio` — time split between plot and personal reaction |
| `anime-dialogue-moments` | `audio-crossfade-technique` — how narration volume dips before anime plays |
| `anime-dialogue-moments` | `dialogue-selection-criteria` — which lines get chosen (emotional, funny, plot-critical) |
| `script-structure` | `episode-boundary-handling` — how transitions between episodes work |
| `scene-type-distribution` | `b-roll-usage` — non-plot establishing shots used as visual filler |
| `narration-style` | `viewer-address-patterns` — when/how the narrator talks directly to audience |

Discovered aspects get added to the frontier as new pending items. The loop processes them in subsequent iterations.

### Convergence Criteria

The loop converges when ALL of:
1. **Frontier exhausted** — all aspects analyzed or judged unnecessary
2. **Discovery rate collapses** — last 3+ iterations discovered 0 new aspects
3. **Spec passes self-review** — the `spec-review` iteration confirms the spec is complete enough to build the forward engine from

---

## Spec Output Format

The final output at `docs/plans/anime-recap-engine-spec.md`:

```markdown
# Anime Recap Engine — Software Specification
# Generated by Reverse Ralph Loop
# Source: JarAnime "The ENTIRE Story of Parasyte: The Maxim"

## 1. System Overview
- What the engine does (episodes folder + config → recap video)
- Target video style (JarAnime-style: narrated, personality-driven, chronological)

## 2. Input Contract
- episodes/          # Folder of MP4 episode files
- subtitles/         # SRT files (optional — engine can use Whisper)
- config.yaml        # Language, target duration, voice settings, quality

## 3. Pipeline Stages
For each stage: purpose, inputs, outputs, tools, parameters

### 3.1 Content Ingestion
### 3.2 Plot Analysis & Script Generation
### 3.3 Scene Selection & Matching
### 3.4 Narration Audio Generation (TTS in target language)
### 3.5 Anime Dialogue Moment Selection
### 3.6 Music Selection & Audio Mixing
### 3.7 Video Assembly & Render

## 4. The Formula (extracted parameters)
All quantified values from analysis:
- Pacing (WPM, pause timing, segment durations)
- Scene selection weights and type distribution
- Clip duration distribution (percentiles)
- Audio mix profile (ducking curves, levels, attack/release)
- Script patterns (hook templates, transition phrases, narration style guide)
- Anime dialogue moment criteria
- Commentary-to-recap ratio

## 5. Config Schema
Full YAML schema for config.yaml:
- language: target narration language
- target_duration: min/max minutes
- voice: TTS voice selection/cloning settings
- quality: draft/preview/final presets
- anime_dialogue: include/exclude

## 6. Output Contract
- Final video: format, resolution, codec, audio specs
- Intermediate artifacts: script, timeline, narration audio files

## 7. Quality Validation
- Tier system (timeline check → audio render → sample segments → full render)
- Metric thresholds for each tier

## 8. Tech Stack & Dependencies
- Required tools (FFmpeg, Whisper, PySceneDetect, MoviePy, Demucs)
- Python packages
- API keys (ElevenLabs/XTTS for TTS, Claude for script generation)
```

---

## Tools & Dependencies

### Tools Each Iteration May Invoke

| Aspect Type | Tool | Invocation | Notes |
|---|---|---|---|
| Transcription | Whisper large-v3 | `whisper` CLI or Python | Word-level timestamps, confidence scores |
| Scene detection | PySceneDetect | `scenedetect` CLI | Content-aware detection, configurable threshold |
| Audio analysis | ffmpeg | `ffmpeg -af loudnorm` | LUFS, RMS, spectrum data |
| Audio separation | Demucs | `demucs` CLI | Separate voice/music/sfx stems |
| Frame extraction | ffmpeg | `ffmpeg -vf select=...` | Keyframes at scene boundaries |
| Pacing calculation | Python | Inline script | WPM, timing stats from transcription.json |
| Pattern analysis | LLM reasoning | Claude reads analysis/ files | Structure, style, tone extraction |
| Spec writing | LLM synthesis | Claude reads all analysis/ | Final spec generation |

### Prerequisites

```bash
pip install openai-whisper scenedetect[opencv] moviepy demucs
# ffmpeg — already installed
# claude-code — already installed
```

---

## Practical Considerations

### Token Efficiency

Each iteration starts fresh (ralph loop pattern). The PROMPT.md tells Claude to read only:
1. The frontier file
2. The specific raw/analysis files needed for this iteration

Most iterations read 2-3 files total. Heavy raw data (JSON) stays in `raw/` and is processed into human-readable summaries in `analysis/`.

### Git History

Clean, atomic commits:
```
a1b2c3d converged: spec complete after 22 iterations
d4e5f6a analyze: spec-review (pass)
g7h8i9j analyze: spec-draft
k0l1m2n analyze: anime-dialogue-moments
o3p4q5r analyze: narration-style
...
s6t7u8v analyze: transcription
w9x0y1z init: seed frontier with 15 aspects
```

### Resumability

If the loop crashes at iteration 12, it restarts, reads the frontier, sees what's done, picks up the next undone aspect. All state is on the filesystem.

### Multi-Reference Support (Future)

When adding a second JarAnime video:
- New input in `input/reference/jaranime-jjk.mp4`
- Frontier gets new aspects: `cross-reference-pacing`, `style-consistency-check`
- Analysis files namespaced: `analysis/parasyte/`, `analysis/jjk/`, `analysis/cross-reference/`
- Spec becomes more robust by finding patterns that hold across multiple videos

### Relationship to Existing Docs

This design supersedes the reverse loop section of `docs/plans/anime-highlight-engine-spec.md`. The existing spec doc was a manual attempt at what this ralph loop automates. The forward loop section of that spec remains relevant as a starting point for what the reverse loop's output should describe.
