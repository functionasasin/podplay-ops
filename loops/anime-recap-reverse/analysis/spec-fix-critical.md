# Spec Fix: Critical Failures

## Summary

Fixed all 5 critical failures identified in the spec-review that would block a developer from implementing the forward engine. Added concrete code for scene classification, TTS API examples, FPS generalization, spoiler prevention, and OP/ED detection.

## Fixes Applied

### FAIL-V1: Scene Classification — No Tool/Code

**Problem**: Section 3.3.1 listed 7 scene type codes with English descriptions but gave no detection method, library, or code. A developer would have to research and build scene classification from scratch.

**Fix**: Added a two-pass classification pipeline:
- **Pass 1 (heuristic)**: mediapipe face detection + OpenCV optical flow + brightness analysis. Runs on every scene, classifies ~95% with sufficient confidence (≥0.65). Rules: FLS = extreme brightness, ACT = high motion, EST = no faces + low motion, DLG = 2+ faces, CCU = single large face, RXN = single small face, OBJ = no faces + moderate motion.
- **Pass 2 (LLM refinement)**: Claude Sonnet vision API for the ~5% of scenes with confidence < 0.65. Costs ~$5 total for a 24-episode season.

**Dependencies added**: `mediapipe`, `opencv-python`, `anthropic` (already in stack)

### FAIL-V2: TTS Generation — No API Call

**Problem**: Section 3.4.4 said "Generate TTS audio (tool-dependent)" — a developer couldn't implement narration generation without knowing which API to call or how to control WPM.

**Fix**: Added complete ElevenLabs API example:
- **ElevenLabs**: `eleven_multilingual_v2` model with speed parameter mapped from target WPM. Stability=0.35 for casual expressiveness. Per-segment generation for pause control.
- **WPM verification**: After generation, validate actual WPM by dividing word count by audio duration. Regenerate if >5% off target.
- **Segment concatenation**: ffmpeg concat with generated silence files for pause insertion.

Renumbered subsequent section 3.4.4 → 3.4.5.

### FAIL-E3: Clip Duration Hardcodes 30fps

**Problem**: `generate_clip_duration()` had `round(duration * 30)` and `max(18, ...)` — hardcoding 30fps. Most anime is 23.976fps, so frame quantization was wrong and the minimum clip would be 0.6s at 30fps but 0.75s at 24fps (or vice versa).

**Fix**:
- Added `source_fps` parameter to `generate_clip_duration()`, defaulting to 24 (most anime)
- Floor and ceiling are now time-based (0.6s, 4.675s), not frame-based
- Frame quantization uses `round(duration * source_fps)` with dynamic min_frames
- Added `ffprobe` FPS detection command in Stage 1 (Section 3.1.1)
- Updated config schema: `fps` default changed from "30" to "auto-detect from source"
- Updated render spec: frame rate is auto-detect, not hardcoded 30

### FAIL-S6: No Spoiler Prevention

**Problem**: Scene selection matched by content type without constraining which episode a clip could come from. Narrating episode 3 could show a clip from episode 20 — visually spoiling deaths, transformations, and reveals.

**Fix**: Added `get_eligible_scenes()` function with constraint: clips for episode N narration must come from episodes ≤ N+1. One episode lookahead allowed for visual variety and mild foreshadowing. Hook exception: clips from episodes 1-4 only. Post-build validation: any violation is a hard failure requiring segment regeneration.

### FAIL-E7: No OP/ED Handling

**Problem**: Scene detection would find 24 copies of the same opening/ending footage (each OP is ~89s, each ED is ~90s), polluting the scene pool with ~48 minutes of unusable credit sequences and duplicate theme song visuals.

**Fix**: Added Section 3.3.0 (OP/ED Detection and Removal) with:
- **Audio fingerprint matching**: `chromaprint`/`fpcalc` to cross-correlate audio across episodes and find repeated segments
- **Heuristic fallback**: Duration-based detection (first 90s = OP, last 120s = ED) validated by Demucs music energy ratio
- **Integration**: OP/ED scenes marked `skip: true` in episode manifest, filtered by all downstream stages
- Updated episode metadata schema to include `op`, `ed`, `fps`, and `duration_s` fields

## Spec Implications

All 5 critical failures are now resolved. A developer can:
1. Classify scenes using mediapipe + OpenCV (fast) with Claude vision fallback (accurate)
2. Generate narration audio using ElevenLabs or OpenAI TTS with WPM control
3. Handle any source FPS (24, 23.976, 30, 29.97) without hardcoding
4. Prevent visual spoilers via episode source constraints
5. Remove OP/ED sequences before scene processing

Remaining: spec-fix-high and spec-fix-medium for non-blocking improvements.
