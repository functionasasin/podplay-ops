# Anime Highlight Engine - Technical Specification

> Automated video engine to create anime recap/highlight videos with AI narration, validated against reference content (jaranime style).

**Status**: Planning
**Created**: 2026-01-21
**Related**: [[anime-highlight-generator]]

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Phase 1: Reference Analysis (Reverse Loop)](#phase-1-reference-analysis-reverse-loop)
4. [Phase 2: Video Generation (Forward Loop)](#phase-2-video-generation-forward-loop)
5. [Phase 3: Comparison & Validation](#phase-3-comparison--validation)
6. [Data Schemas](#data-schemas)
7. [Pipeline Orchestration](#pipeline-orchestration)
8. [Open Questions](#open-questions)

---

## Overview

### Inputs
- **Source Content**: 10 MP4 anime episodes (~24 min each, ~4 hours total)
- **Subtitles**: SRT or ASS files with timestamped dialogue
- **Reference Videos**: 1-3 jaranime videos for style extraction

### Outputs
- **Primary**: 30-60 minute highlight/recap video
- **Secondary**: Comparison report against reference style

### Core Approach

Two-phase "ralph loop":

1. **Reverse Loop** - Analyze jaranime videos → extract quantifiable "formula"
2. **Forward Loop** - Apply formula to source anime → generate highlight video
3. **Validation Loop** - Compare generated output against formula → iterate

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REVERSE LOOP                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Jaranime   │───▶│   Feature    │───▶│    Video     │          │
│  │    Videos    │    │  Extraction  │    │   Formula    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FORWARD LOOP                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    Anime     │───▶│  Generation  │───▶│   Output     │          │
│  │   Episodes   │    │   Pipeline   │    │    Video     │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       VALIDATION LOOP                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Output     │───▶│  Comparison  │───▶│    Score     │          │
│  │   Features   │    │    Engine    │    │   Report     │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Reference Analysis (Reverse Loop)

Extract the "formula" from jaranime reference videos.

### 1.1 Input Processing

#### Video Ingestion
- Load reference video files (MP4/MKV)
- Extract metadata: duration, resolution, framerate, bitrate
- Validate file integrity

#### Audio Extraction
- Separate audio track from video
- Output: WAV/MP3 file for analysis
- Preserve original for reference

### 1.2 Transcription & Script Analysis

#### Speech-to-Text
- **Tool**: Whisper (large-v3)
- **Output**: Word-level timestamps with confidence scores
- **Format**:
  ```
  {
    "segments": [
      {
        "start": 0.0,
        "end": 2.5,
        "text": "What if I told you...",
        "words": [
          {"word": "What", "start": 0.0, "end": 0.3, "confidence": 0.98},
          ...
        ]
      }
    ]
  }
  ```

#### Script Structure Extraction
- **Hook Detection**: Identify opening segment (first 30-60 seconds)
  - Common patterns: rhetorical question, bold claim, mystery setup
  - Extract hook templates
- **Section Boundaries**: Detect transitions between major segments
  - Markers: music changes, silence gaps, transition phrases
  - Typical structure: Hook → Context → Arc 1 → Arc 2 → ... → Climax → Outro
- **Transition Phrases**: Catalog recurring connector language
  - "But little did he know..."
  - "And that's when everything changed..."
  - "Meanwhile..."
- **Callback Patterns**: Identify references to earlier content
  - Foreshadowing phrases
  - "Remember when..." constructions

#### Pacing Metrics
| Metric | How to Calculate | Expected Range |
|--------|------------------|----------------|
| Words per minute (WPM) | total_words / duration_minutes | 120-160 WPM |
| Words per segment | words / segment_count | 50-200 words |
| Pause duration | gaps between speech segments | 0.5-3.0 sec |
| Pause frequency | pauses_per_minute | 2-6 per min |
| Segment duration | average segment length | 15-45 sec |

### 1.3 Scene Analysis

#### Scene Detection
- **Tool**: PySceneDetect (ContentDetector)
- **Threshold**: Tune to match reference cut frequency
- **Output**: List of (start_time, end_time) for each scene

#### Clip Duration Analysis
- Extract duration of each clip/scene
- Build histogram of clip lengths
- Calculate statistics:
  - Mean clip duration
  - Median clip duration
  - Standard deviation
  - Min/max range
  - Percentile distribution (P10, P25, P50, P75, P90)

#### Scene Classification
Classify each scene into categories:

| Category | Detection Method |
|----------|------------------|
| Action | High motion (frame diff), loud audio |
| Dialogue | Moderate motion, speech detected |
| Reaction | Low motion, face detection, short duration |
| Establishing | Low motion, no speech, scene opener |
| Transition | Very short, often with effects |
| Emotional Peak | Slow motion, music swell, key dialogue |

- **Output**: Distribution of scene types (% action, % dialogue, etc.)

#### Visual Motion Analysis
- Calculate frame-to-frame difference (optical flow or simple diff)
- Map motion intensity over time
- Correlate with scene boundaries

### 1.4 Audio Profile Analysis

#### Track Separation
- Separate narration from background music (where possible)
- **Tools**: Demucs, Spleeter, or similar source separation
- May not be perfect - extract what's usable

#### Volume Envelope
- Calculate RMS (root mean square) levels over time
- Window size: 100-500ms
- **Output**: Time series of volume levels

#### Narration vs Music Ratio
- When narration active: measure music volume relative to voice
- Typical ratio: music at -12dB to -18dB below voice
- Extract ducking curve shape (attack, sustain, release)

#### Music Analysis
- Detect music segments (when no narration)
- Classify energy level: low/medium/high
- Map music energy to content (action scenes = high energy)
- Identify music transition points

#### Audio Ducking Pattern
```
Narration starts:
  └─▶ Music ducks to -15dB over 200ms

Narration continues:
  └─▶ Music holds at -15dB

Narration ends:
  └─▶ Music returns to 0dB over 500ms
```

Extract these timing parameters from reference.

### 1.5 Output: Video Formula Model

Consolidate all extracted features into a structured formula:

```yaml
video_formula:
  metadata:
    source_videos: ["jaranime_video_1.mp4", "jaranime_video_2.mp4"]
    extraction_date: "2026-01-21"
    total_analyzed_duration: "2:15:00"

  structure:
    target_duration:
      min: 1800  # 30 minutes
      max: 3600  # 60 minutes

    sections:
      - name: "hook"
        duration: [15, 45]  # seconds
        position: "start"
        characteristics: ["rhetorical_question", "bold_claim", "mystery"]

      - name: "context"
        duration: [60, 180]
        position: "after_hook"
        characteristics: ["world_building", "character_intro"]

      - name: "arc_recap"
        duration: [300, 600]
        position: "body"
        repeat: true
        characteristics: ["plot_progression", "key_moments"]

      - name: "climax"
        duration: [120, 300]
        position: "near_end"
        characteristics: ["emotional_peak", "revelation"]

      - name: "outro"
        duration: [30, 90]
        position: "end"
        characteristics: ["reflection", "call_to_action"]

  pacing:
    narration:
      words_per_minute:
        target: 145
        range: [130, 160]
      segment_duration:
        mean: 28.5
        std: 12.3
      pause_between_segments:
        mean: 1.2
        range: [0.5, 3.0]

    clips:
      duration_distribution:
        p10: 1.5
        p25: 2.8
        p50: 4.2  # median
        p75: 6.1
        p90: 9.5
      clips_per_minute: 8.5

  scene_selection:
    type_distribution:
      action: 0.25
      dialogue: 0.35
      reaction: 0.20
      emotional: 0.15
      establishing: 0.05

    selection_criteria:
      - "Key plot points (as identified from subtitles)"
      - "Character introductions"
      - "Emotional peaks (music + dialogue indicators)"
      - "Action sequences (high motion)"
      - "Iconic/memorable moments"

  audio:
    music_to_voice_ratio: -15  # dB when narration active
    ducking:
      attack_ms: 200
      release_ms: 500
    music_energy_mapping:
      action_scenes: "high"
      dialogue_scenes: "low"
      emotional_scenes: "medium_swelling"

  script_patterns:
    hook_templates:
      - "What if I told you that [shocking fact]?"
      - "[Character] was about to discover something that would change everything."
      - "In a world where [premise], one [character] would [action]."

    transition_phrases:
      - "But that was only the beginning."
      - "Little did they know..."
      - "Meanwhile, [other character]..."
      - "And just when things couldn't get worse..."
      - "This is where things get interesting."

    callback_patterns:
      - "Remember earlier when [reference]? Well..."
      - "This connects back to [earlier point]."
```

---

## Phase 2: Video Generation (Forward Loop)

Apply the extracted formula to generate a new highlight video.

### 2.1 Source Content Ingestion

#### Episode Loading
- Load all 10 MP4 episode files
- Extract and validate:
  - Duration
  - Resolution (ensure consistency or plan for scaling)
  - Frame rate
  - Audio format

#### Subtitle Processing
- Parse SRT/ASS subtitle files
- Normalize to common format:
  ```
  {
    "episode": 1,
    "subtitles": [
      {
        "index": 1,
        "start": "00:01:23,456",
        "end": "00:01:26,789",
        "start_seconds": 83.456,
        "end_seconds": 86.789,
        "text": "I won't let you get away with this!",
        "speaker": null  # optional, if ASS includes style info
      }
    ]
  }
  ```
- Handle multi-line subtitles
- Strip formatting tags (italics, colors, etc.) for text analysis
- Preserve timing with millisecond precision

#### Content Indexing
- Create master timeline combining all episodes
- Map: `global_timestamp → (episode, local_timestamp)`
- Index all subtitle text for search

### 2.2 Scene Detection & Segmentation

#### Scene Boundary Detection
- Run PySceneDetect on each episode
- Parameters tuned to match reference clip frequency
- Output per episode:
  ```
  {
    "episode": 1,
    "scenes": [
      {"start": 0.0, "end": 45.2, "duration": 45.2},
      {"start": 45.2, "end": 52.8, "duration": 7.6},
      ...
    ]
  }
  ```

#### Scene Enrichment
For each detected scene, compute:

| Attribute | Method |
|-----------|--------|
| `dialogue` | Subtitles overlapping this scene |
| `motion_score` | Average frame diff (0-1) |
| `audio_energy` | RMS of audio in scene |
| `has_speech` | VAD (voice activity detection) |
| `scene_type` | Classification based on above |

#### Scene Database
Build searchable index of all scenes:
```
scenes_db = [
  {
    "id": "ep01_scene_042",
    "episode": 1,
    "start": 1023.5,
    "end": 1031.2,
    "duration": 7.7,
    "dialogue": "I won't give up. Not now, not ever!",
    "motion_score": 0.72,
    "audio_energy": 0.85,
    "scene_type": "emotional",
    "keywords": ["determination", "resolve", "climax"]
  },
  ...
]
```

### 2.3 Script Generation

#### Plot Summarization
- Input: All subtitles concatenated with episode markers
- Process with LLM:
  - Episode-by-episode summary (2-3 paragraphs each)
  - Key plot points identification
  - Character arc tracking
  - Emotional peaks identification
- Output: Structured plot summary

#### Highlight Script Generation
- Input:
  - Plot summary
  - Video formula (structure, pacing, patterns)
  - Script templates from reference
- LLM Prompt Strategy:
  ```
  You are writing a narration script for an anime recap video.

  Target duration: {formula.target_duration} minutes
  Pacing: {formula.pacing.words_per_minute} WPM

  Structure your script as:
  1. HOOK (15-45 sec): {formula.hook_templates}
  2. CONTEXT (1-3 min): Introduce world and characters
  3. ARC RECAPS: Cover each major arc
  4. CLIMAX (2-5 min): The emotional peak
  5. OUTRO (30-90 sec): Reflection and wrap-up

  Use these transition phrases: {formula.transition_phrases}

  Plot Summary:
  {plot_summary}

  Write the full narration script with section markers.
  ```

#### Script Segmentation
- Break script into timed segments
- Each segment includes:
  ```
  {
    "segment_id": 1,
    "section": "hook",
    "text": "What if I told you that the fate of humanity...",
    "word_count": 45,
    "estimated_duration": 18.5,  # based on target WPM
    "scene_hints": ["opening battle", "protagonist introduction"],
    "mood": "mysterious"
  }
  ```

### 2.4 Scene-to-Script Matching

#### Matching Strategy
For each script segment, find appropriate source scenes:

1. **Keyword Matching**
   - Extract keywords from script segment
   - Search scene database for dialogue matches
   - Score by relevance

2. **Semantic Matching**
   - Embed script segment and scene dialogues
   - Find nearest neighbors by cosine similarity

3. **Mood Matching**
   - Match script mood to scene classification
   - "Action" script → action scenes
   - "Emotional" script → emotional scenes

4. **Temporal Constraints**
   - Prefer scenes from relevant episodes
   - Maintain rough chronological order
   - Avoid reusing scenes

#### Selection Algorithm
```
For each script_segment:
  1. Query scene_db with keywords → candidate_scenes
  2. Filter by scene_type matching segment mood
  3. Score candidates:
     - relevance_score (keyword/semantic match)
     - quality_score (motion, audio energy)
     - freshness_score (penalize already-used scenes)
  4. Select top N scenes to fill segment duration
  5. Mark selected scenes as used
```

#### Clip Trimming
- Selected scenes may be too long
- Trim to target duration from formula distribution
- Prefer trimming from edges, preserve key moments
- Ensure cuts happen at natural boundaries (scene changes, pauses)

### 2.5 Narration Audio Generation

#### TTS Selection
- **Primary**: ElevenLabs (highest quality)
- **Fallback**: XTTS v2 (open source, local)
- **Voice**: Clone from reference or select matching preset

#### Generation Parameters
- Speaking rate: Match formula WPM
- Stability: 0.5-0.7 (some variation, not robotic)
- Similarity boost: 0.7-0.8 (consistent voice)
- Style: Engaging, narrative tone

#### Per-Segment Generation
- Generate audio for each script segment separately
- Easier to adjust timing and regenerate sections
- Output: WAV files per segment

#### Quality Checks
- Verify no obvious artifacts
- Check duration matches expected (within 10%)
- Validate pronunciation of character names (may need phonetic hints)

### 2.6 Music Selection & Processing

#### Music Source Options
1. **Anime OST** (if available, copyright considerations)
2. **Royalty-free library** (Epidemic Sound, Artlist)
3. **AI-generated** (Suno, Udio)

#### Music Mapping
- Based on formula's music_energy_mapping:
  - Opening: Medium energy, building
  - Action recaps: High energy
  - Dialogue/emotional: Low-medium, subtle
  - Climax: Building to peak
  - Outro: Reflective, resolving

#### Track Preparation
- Cut/loop tracks to needed durations
- Ensure seamless loops where needed
- Export stems if available (easier ducking)

### 2.7 Video Assembly

#### Timeline Construction
Using MoviePy:

1. **Create base timeline**
   ```
   For each script_segment in order:
     - Add narration audio
     - Add matched video clips
     - Align clips to narration timing
   ```

2. **Video Clip Processing**
   - Load clip from source episode
   - Trim to exact timestamps
   - Apply any scaling (if resolution mismatch)
   - Optional: speed adjustment for timing

3. **Transitions**
   - Default: Hard cut (most common in reference)
   - Occasional: Cross-dissolve (500ms) at section boundaries
   - Avoid: Fancy transitions (wipes, etc.) - not typical of style

4. **Audio Layering**
   ```
   Track 1: Music bed (continuous)
   Track 2: Narration (segmented)
   Track 3: Source audio (optional, low volume under narration)
   ```

5. **Audio Ducking**
   - Apply envelope to music track
   - When narration active:
     - Duck music by formula.audio.music_to_voice_ratio dB
     - Attack: formula.audio.ducking.attack_ms
     - Release: formula.audio.ducking.release_ms

#### Assembly Pseudocode
```
timeline = Timeline()

for segment in script_segments:
    # Add narration
    narration = AudioClip(segment.audio_file)
    timeline.add_audio(narration, track="narration")

    # Add video clips
    for clip_ref in segment.matched_clips:
        video = load_video(clip_ref.episode, clip_ref.start, clip_ref.end)
        video = video.resize(target_resolution)
        timeline.add_video(video)

    # Add transition if section boundary
    if segment.is_section_end:
        timeline.add_transition("crossfade", duration=0.5)

# Add music with ducking
music = prepare_music_bed(timeline.duration)
ducked_music = apply_ducking(music, timeline.get_track("narration"))
timeline.add_audio(ducked_music, track="music")

# Render
timeline.render("output.mp4", fps=24, codec="h264")
```

### 2.8 Render & Export

#### Render Settings
| Parameter | Value |
|-----------|-------|
| Resolution | 1920x1080 (or match source) |
| Frame rate | 24fps (standard anime) |
| Video codec | H.264 |
| Video bitrate | 8-15 Mbps |
| Audio codec | AAC |
| Audio bitrate | 192-320 kbps |
| Audio channels | Stereo |

#### Output Files
- `output_final.mp4` - Complete rendered video
- `output_draft.mp4` - Lower quality preview (faster render)
- `timeline.json` - Edit decision list for adjustments
- `segments/` - Individual segment renders (for partial re-render)

---

## Phase 3: Comparison & Validation

Compare generated output against the formula to measure quality.

### 3.1 Feature Extraction (Generated Video)

Run the same extraction pipeline from Phase 1 on the generated video:

- Transcribe narration (Whisper)
- Detect scenes (PySceneDetect)
- Analyze audio levels
- Calculate all metrics

### 3.2 Metric Comparison

#### Structural Metrics

| Metric | Formula Target | Generated | Score |
|--------|---------------|-----------|-------|
| Total duration | 30-60 min | ? | ✓/✗ |
| Clip count | ~N | ? | % match |
| Scene type distribution | {action: 25%, ...} | ? | KL divergence |

#### Pacing Metrics

| Metric | Formula Target | Generated | Score |
|--------|---------------|-----------|-------|
| WPM | 145 ± 15 | ? | % deviation |
| Mean clip duration | 4.2s ± 1.5 | ? | % deviation |
| Clips per minute | 8.5 ± 2 | ? | % deviation |
| Pause duration | 1.2s ± 0.5 | ? | % deviation |

#### Distribution Comparison
For clip durations and other distributions:
- Compare histograms visually
- Calculate KL divergence or Wasserstein distance
- Flag if significantly different from formula

### 3.3 Structural Analysis (LLM-Assisted)

#### Script Structure Validation
Prompt LLM to analyze generated script:
```
Analyze this narration script and identify:
1. Does it have a clear hook in the first 30-60 seconds?
2. Are there clear section transitions?
3. Does it use engaging transition phrases?
4. Is there a climactic moment near the end?
5. Does the pacing feel natural or rushed/dragging?

Rate each aspect 1-5 and explain.
```

#### Content Coverage Validation
```
Given this plot summary and this narration script:
1. What key plot points are covered?
2. What key plot points are MISSING?
3. Are any parts overemphasized or underemphasized?
4. Is the emotional arc preserved?
```

### 3.4 Audio Quality Validation

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Narration clarity | SNR measurement | > 20dB |
| Music ducking | Volume envelope analysis | Duck depth within 2dB of target |
| Ducking timing | Onset/offset detection | Within 100ms of target |
| Overall loudness | LUFS measurement | -14 to -16 LUFS |
| Clipping | Peak detection | No samples at max |

### 3.5 Scoring & Report Generation

#### Category Scores (0-100)

```
Structure Score:
  - Duration within range: +30 or 0
  - Section markers present: +20 per section (max 5)
  - Hook quality: +10

Pacing Score:
  - WPM within range: 0-25 (linear scale)
  - Clip duration distribution: 0-25 (KL divergence)
  - Pause patterns: 0-25
  - Clips per minute: 0-25

Scene Selection Score:
  - Type distribution match: 0-40
  - Content coverage: 0-40
  - No repeated scenes: +20 or 0

Audio Score:
  - Music/voice ratio: 0-25
  - Ducking timing: 0-25
  - Overall quality (LUFS, no clipping): 0-50

Overall Score: weighted average
```

#### Report Output

```markdown
# Validation Report

**Generated**: output_v1.mp4
**Date**: 2026-01-21
**Formula Version**: v1.0

## Summary

| Category | Score | Status |
|----------|-------|--------|
| Structure | 85/100 | ✓ Good |
| Pacing | 72/100 | ⚠ Needs work |
| Scene Selection | 78/100 | ✓ Good |
| Audio | 91/100 | ✓ Excellent |
| **Overall** | **81/100** | ✓ Good |

## Detailed Findings

### Structure
- ✓ Duration: 42:15 (within 30-60 min target)
- ✓ Hook present: Strong opening question
- ⚠ Missing clear transition at 18:30
- ✓ Climax identified at 38:00

### Pacing
- ✓ WPM: 148 (target: 145)
- ⚠ Mean clip duration: 5.8s (target: 4.2s) - clips too long
- ⚠ Clips per minute: 6.2 (target: 8.5) - need more cuts
- ✓ Pause duration: 1.1s (target: 1.2s)

### Scene Selection
- Action: 22% (target: 25%) ✓
- Dialogue: 38% (target: 35%) ✓
- Reaction: 18% (target: 20%) ✓
- Emotional: 12% (target: 15%) ⚠
- ⚠ Missing coverage: Episode 7 climax underrepresented

### Audio
- ✓ Music duck: -14.5dB (target: -15dB)
- ✓ Duck attack: 190ms (target: 200ms)
- ✓ LUFS: -15.2 (target: -14 to -16)
- ✓ No clipping detected

## Recommendations

1. **Shorten clips**: Average clip duration is 1.6s over target. Consider:
   - Tighter trims on dialogue scenes
   - More frequent cuts during action sequences

2. **Add emotional scenes**: Currently 3% under target. Scenes to consider:
   - Episode 7: 18:30-19:45 (reunion scene)
   - Episode 9: 22:10-23:30 (sacrifice moment)

3. **Add transition at 18:30**: Gap between Arc 2 and Arc 3 feels abrupt.
   Use phrase like "But that was only the beginning..."

## Next Steps

- [ ] Re-run generation with clip duration bias -1.5s
- [ ] Add episode 7 and 9 emotional scenes to required list
- [ ] Insert transition phrase at 18:30
- [ ] Re-validate
```

### 3.6 Iteration Loop

Based on validation report:

1. **Automated adjustments**
   - Adjust clip duration bias
   - Modify scene selection weights
   - Re-run generation

2. **Manual review triggers**
   - If score < 70: Flag for manual review
   - If specific scenes missing: Add to required list
   - If structure broken: Review script generation prompt

3. **Convergence**
   - Target: Overall score > 80
   - Max iterations: 3-5 before manual intervention
   - Track score progression across iterations

---

## Data Schemas

### Episode Metadata
```typescript
interface EpisodeMetadata {
  episode_number: number;
  file_path: string;
  duration_seconds: number;
  resolution: [number, number];
  frame_rate: number;
  subtitle_file: string;
}
```

### Subtitle Entry
```typescript
interface SubtitleEntry {
  index: number;
  start_seconds: number;
  end_seconds: number;
  text: string;
  speaker?: string;
}
```

### Scene
```typescript
interface Scene {
  id: string;
  episode: number;
  start: number;
  end: number;
  duration: number;
  dialogue: string[];
  motion_score: number;
  audio_energy: number;
  scene_type: 'action' | 'dialogue' | 'reaction' | 'emotional' | 'establishing';
  keywords: string[];
  used: boolean;
}
```

### Script Segment
```typescript
interface ScriptSegment {
  segment_id: number;
  section: 'hook' | 'context' | 'arc' | 'climax' | 'outro';
  text: string;
  word_count: number;
  estimated_duration: number;
  scene_hints: string[];
  mood: string;
  matched_scenes: Scene[];
  narration_audio_path?: string;
}
```

### Video Formula
```typescript
interface VideoFormula {
  metadata: {
    source_videos: string[];
    extraction_date: string;
  };
  structure: {
    target_duration: { min: number; max: number };
    sections: SectionDefinition[];
  };
  pacing: {
    narration: {
      words_per_minute: { target: number; range: [number, number] };
      segment_duration: { mean: number; std: number };
      pause_between_segments: { mean: number; range: [number, number] };
    };
    clips: {
      duration_distribution: { p10: number; p25: number; p50: number; p75: number; p90: number };
      clips_per_minute: number;
    };
  };
  scene_selection: {
    type_distribution: Record<string, number>;
    selection_criteria: string[];
  };
  audio: {
    music_to_voice_ratio: number;
    ducking: { attack_ms: number; release_ms: number };
  };
  script_patterns: {
    hook_templates: string[];
    transition_phrases: string[];
  };
}
```

### Validation Report
```typescript
interface ValidationReport {
  generated_video: string;
  formula_version: string;
  timestamp: string;
  scores: {
    structure: number;
    pacing: number;
    scene_selection: number;
    audio: number;
    overall: number;
  };
  metrics: {
    duration: number;
    wpm: number;
    mean_clip_duration: number;
    clips_per_minute: number;
    scene_type_distribution: Record<string, number>;
  };
  issues: ValidationIssue[];
  recommendations: string[];
}
```

---

## Pipeline Orchestration

### Directory Structure
```
anime-highlight-engine/
├── config/
│   └── formula_v1.yaml         # Extracted formula
├── input/
│   ├── episodes/               # Source MP4 files
│   │   ├── episode_01.mp4
│   │   └── ...
│   ├── subtitles/              # SRT/ASS files
│   │   ├── episode_01.srt
│   │   └── ...
│   └── reference/              # Jaranime videos
│       └── jaranime_ref_01.mp4
├── intermediate/
│   ├── scenes/                 # Detected scenes
│   ├── transcripts/            # Whisper output
│   ├── narration/              # TTS audio files
│   └── music/                  # Prepared music tracks
├── output/
│   ├── drafts/                 # Work-in-progress renders
│   ├── final/                  # Final output videos
│   └── reports/                # Validation reports
└── logs/                       # Pipeline execution logs
```

### Execution Phases

```
Phase 0: Setup
├── Validate input files exist
├── Check dependencies (ffmpeg, moviepy, whisper, etc.)
└── Initialize output directories

Phase 1: Reference Analysis (run once)
├── Ingest reference video
├── Extract transcription
├── Analyze scenes
├── Analyze audio
├── Generate formula
└── Save formula.yaml

Phase 2: Source Processing (run once per source)
├── Load episodes
├── Parse subtitles
├── Detect scenes
├── Classify scenes
├── Build scene database
└── Save scenes.json

Phase 3: Script Generation
├── Summarize plot from subtitles
├── Generate narration script
├── Segment script
├── Match scenes to segments
└── Save script.json

Phase 4: Audio Production
├── Generate TTS for each segment
├── Prepare music tracks
├── Pre-render audio mix (for timing validation)
└── Save narration/*.wav

Phase 5: Video Assembly
├── Build timeline
├── Load and trim clips
├── Compose video track
├── Mix audio (narration + music + ducking)
├── Render draft
└── Save output/drafts/draft_v{N}.mp4

Phase 6: Validation
├── Extract features from draft
├── Compare to formula
├── Generate validation report
├── Save output/reports/report_v{N}.md
└── Determine if iteration needed

Phase 7: Iteration (if needed)
├── Adjust parameters based on report
├── Re-run Phase 3-6
└── Repeat until score > threshold or max iterations
```

### CLI Interface (conceptual)

```bash
# Extract formula from reference
./highlight-engine analyze --input reference/jaranime_01.mp4 --output config/formula.yaml

# Process source anime
./highlight-engine ingest --episodes episodes/ --subtitles subtitles/ --output intermediate/

# Generate highlight video
./highlight-engine generate --formula config/formula.yaml --scenes intermediate/scenes.json --output output/

# Validate output
./highlight-engine validate --video output/draft_v1.mp4 --formula config/formula.yaml --output reports/

# Full pipeline
./highlight-engine run --reference reference/ --episodes episodes/ --subtitles subtitles/
```

---

## Open Questions

### Technical
1. **Scene detection sensitivity** - How to tune PySceneDetect threshold to match jaranime cut frequency?
2. **Semantic matching** - What embedding model works best for anime dialogue?
3. **TTS voice selection** - Clone from reference narration or use preset?
4. **Music sourcing** - OST (copyright risk) vs generated (quality risk)?

### Creative
1. **Multiple episodes vs single** - One video for all 10 episodes, or per-episode highlights?
2. **Spoiler handling** - How to order content if covering multiple episodes?
3. **Character name pronunciation** - How to handle Japanese names in TTS?

### Quality
1. **Minimum viable score** - What overall score is "good enough"?
2. **Human review triggers** - When should automation stop and flag for human?
3. **A/B testing** - How to validate with real viewer preferences?

---

## Appendix: Tool References

| Tool | Purpose | Documentation |
|------|---------|---------------|
| MoviePy | Video editing | https://zulko.github.io/moviepy/ |
| PySceneDetect | Scene detection | https://scenedetect.com/ |
| Whisper | Speech-to-text | https://github.com/openai/whisper |
| ElevenLabs | TTS | https://elevenlabs.io/docs |
| XTTS | TTS (local) | https://github.com/coqui-ai/TTS |
| Demucs | Audio separation | https://github.com/facebookresearch/demucs |
| FFmpeg | Video processing | https://ffmpeg.org/documentation.html |
