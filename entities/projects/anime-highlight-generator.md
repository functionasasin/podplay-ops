---
type: project
name: Anime Highlight Generator
status: idea
tags: [video, ai, automation, content-creation]
created: 2026-01-21
---

# Anime Highlight Generator

Automated video engine to create long-form (30-60 min) anime recap/highlight videos with natural AI narration, modeled after channels like jaranime.

## Concept

Use a **two-phase agentic loop** ("ralph loop") approach:

1. **Reverse Loop (Analysis)** - Deconstruct reference videos to extract the "formula"
2. **Forward Loop (Generation)** - Apply the formula to create new videos

## Target Output Format

- **Length**: 30-60 minutes
- **Style**: Recap/highlight narrative
- **Narration**: AI voice that sounds natural (not obviously synthetic)
- **Structure**: Hook → Context → Scene-by-scene recap → Emotional peaks → Conclusion

---

## Phase 1: Reverse Ralph Loop (Video Analysis)

Analyze existing reference videos to extract:

### 1.1 Script Pattern Extraction
- [ ] Transcribe narration from reference videos
- [ ] Identify script structure (intro hooks, transitions, callbacks)
- [ ] Extract pacing patterns (words per minute, pause timing)
- [ ] Catalog common phrases/narrative techniques
- [ ] Map narration timing to visual content

### 1.2 Visual Pattern Extraction
- [ ] Scene segmentation and classification
- [ ] Identify which scenes get selected (action, dialogue, emotional)
- [ ] Extract clip duration patterns (how long each clip runs)
- [ ] Analyze visual transitions and effects
- [ ] Map scene importance scoring heuristics

### 1.3 Audio Pattern Extraction
- [ ] Background music selection patterns
- [ ] Music-to-narration volume ratios
- [ ] Sound effect placement
- [ ] Audio ducking patterns

### 1.4 Output: Video Formula Model
```
{
  script_template: structured prompt for narration generation,
  scene_selection_criteria: what makes a scene "highlight-worthy",
  pacing_model: timing relationships between elements,
  audio_mix_profile: levels and transitions
}
```

---

## Phase 2: Forward Ralph Loop (Video Generation)

Given a source anime, generate a complete highlight video:

### 2.1 Content Ingestion
- [ ] Ingest full anime episodes/season
- [ ] Extract subtitles/dialogue
- [ ] Scene detection and segmentation
- [ ] Character recognition (optional)

### 2.2 Script Generation
- [ ] Summarize plot from subtitles
- [ ] Generate recap script using extracted formula
- [ ] Apply pacing model to script
- [ ] Generate narration audio (natural-sounding TTS)

### 2.3 Scene Selection & Assembly
- [ ] Score scenes using extracted criteria
- [ ] Select clips to match script segments
- [ ] Apply timing model for clip durations
- [ ] Assemble rough cut

### 2.4 Audio Production
- [ ] Layer narration track
- [ ] Select/generate background music
- [ ] Apply audio mix profile
- [ ] Final audio mastering

### 2.5 Final Render
- [ ] Apply visual transitions
- [ ] Add any text overlays/effects
- [ ] Render final video
- [ ] Quality check loop

---

## Tech Stack (TBD)

| Component | Options to Evaluate |
|-----------|---------------------|
| Video Processing | FFmpeg, MoviePy, OpenCV |
| Transcription | Whisper, AssemblyAI |
| Scene Detection | PySceneDetect, TransNetV2 |
| LLM (Script) | Claude, GPT-4 |
| TTS (Narration) | ElevenLabs, Tortoise-TTS, XTTS |
| Music | Suno, licensed library |
| Orchestration | Python + agentic loop |

---

## Key Challenges

1. **Natural TTS** - 30-60 min of narration that doesn't sound robotic
2. **Scene Selection** - Automatically picking the "right" moments
3. **Pacing** - Matching narration to visuals naturally
4. **Copyright** - Fair use considerations for anime clips
5. **Scale** - Processing hours of source content efficiently

---

## Next Steps

1. Find/download a reference jaranime video to analyze
2. Build transcription + scene detection pipeline
3. Manual analysis of 1-2 videos to validate automated extraction
4. Prototype script generation with Claude
5. Evaluate TTS options for natural long-form narration

---

## References

- jaranime YouTube channel (target style)
- [[ralph-loop-pattern]] - agentic loop methodology
