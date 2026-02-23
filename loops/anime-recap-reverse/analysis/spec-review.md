# Spec Review

## Summary

The spec at `docs/plans/anime-recap-engine-spec.md` covers all 7 pipeline stages, captures 50+ quantitative parameters from the 13 analysis files, and provides concrete tool commands for 8 of 12 critical operations. However, it fails the "developer with no context" test on 5 critical items: scene classification has no tool/code, TTS generation has no API call, clip duration code hardcodes 30fps, visual clips aren't constrained to prevent spoilers, and OP/ED sequences aren't handled. Additionally, scaling from 24 to 12 episodes is under-specified, and several implementation details lack concrete commands (sidechain ducking, music swells, crossfade).

## Review Criteria

Evaluated against: "Could a developer with no context build the entire forward engine from this spec alone?"

## Results: 79 PASS, 36 FAIL

### Critical Failures (blocks implementation)

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| FAIL-V1 | Scene classification (Stage 3.3.1) lists type codes but provides no detection tool, library, or code | Section 3.3.1 | Add mediapipe face detection, cv2 motion estimation, or vision LLM classification with code snippet |
| FAIL-V2 | TTS generation says "tool-dependent" with no API call for any provider | Section 3.4 | Add concrete ElevenLabs and OpenAI TTS API examples with WPM control guidance |
| FAIL-E3 | Clip duration generator hardcodes `round(duration * 30)` — breaks for 24fps anime (most anime) | Section 3.3.3 | Use `config.fps` instead of literal 30; express 0.6s floor as time, not frames |
| FAIL-S6 | No spoiler prevention — scene selection matches by content type but doesn't constrain episode source | Section 3.3.2 | Add constraint: clips for episode N narration must come from episodes ≤ N+1 |
| FAIL-E7 | No OP/ED handling — scene detection will find 24 copies of same opening/ending footage | Missing | Add OP/ED detection and removal step before scene detection |

### High-Priority Failures (causes incorrect output)

| ID | Issue | Fix |
|----|-------|-----|
| FAIL-E2 | 12-episode scaling under-specified: act count, moment budget, breathing events, connector frequencies all need scaling rules | Add explicit scaling functions |
| FAIL-V4 | Sidechain ducking has no ffmpeg command | Add `sidechaincompress` filter chain or python audio automation code |
| FAIL-V5 | Music swell automation has no implementation | Add python gain automation function |
| FAIL-S4 | No script validation gate between Stage 2 and Stage 3 | Add inline Tier 1 validation before proceeding to audio/video |
| FAIL-S5 | No LLM retry/chunking strategy — single-pass 10,800-word generation will rarely work | Add per-act generation with constraint validation and retry loop |

### Medium Failures (reduces quality)

| ID | Issue | Fix |
|----|-------|-----|
| FAIL-E1 | Subtitle edge cases: no ASS/SSA support, no multi-track selection, no Whisper quality check | Add subtitle handling decision tree |
| FAIL-E4 | Non-Japanese anime not addressed — English/Chinese/Korean source dialogue changes extraction pipeline | Add language mode handling |
| FAIL-V3 | LLM script generation lacks complete prompt template | Add full prompt combining all inputs + constraints |
| FAIL-V6 | Hook-to-body music crossfade has no ffmpeg command | Add afade + amix filter chain |
| FAIL-C1 | No config for provider-specific TTS voice parameters | Expand tts config section |

### Low-Priority Failures (completeness)

| ID | Issue |
|----|-------|
| FAIL-P1-P13 | 13 parameters from analysis files missing in Section 4 summary table ("But" 74x, "Obviously/Of course" 13x, "Meanwhile" 9x, etc.) |
| FAIL-C2-C4 | Config gaps: subtitle preferences, music generation params, output filename pattern |
| FAIL-S1-S3 | Missing output stages: thumbnail generation, YouTube chapters, output captions |
| FAIL-E5-E6 | Edge cases: corrupt episodes, variable episode durations |
| FAIL-P6 | Per-minute RMS loudness arc not captured as reference data |

## Verdict

**SPEC DOES NOT PASS.** The 5 critical failures mean a developer cannot implement Stages 3 (scene classification), 4 (TTS), and 7 (render for 24fps sources) without additional research. The spoiler prevention gap (FAIL-S6) would produce visually broken output. The OP/ED gap (FAIL-E7) would pollute scene detection with duplicates.

Recommended fix-it aspects added to frontier: `spec-fix-critical`, `spec-fix-high`, `spec-fix-medium`.

## Spec Implications

After the fix-it aspects are completed, a second spec-review should verify all critical and high-priority failures are resolved before writing `status/converged.txt`.
