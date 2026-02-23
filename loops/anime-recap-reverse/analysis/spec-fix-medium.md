# Spec Fix: Medium-Priority Failures

## Summary

Fixed all 5 medium-priority failures identified in the spec-review that would reduce output quality. Added subtitle format handling (ASS/SSA/bitmap/multi-track), non-Japanese language mode, complete LLM prompt template, hook-to-body music crossfade ffmpeg command, and provider-agnostic TTS config with ElevenLabs and OpenAI implementations.

## Fixes Applied

### FAIL-E1: Subtitle Edge Cases

**Problem**: Section 3.1.2 only showed `ffmpeg -map 0:s:0` to extract subtitles. No handling for: ASS/SSA format (common in fansubs), multi-track subtitle selection (source language vs English), bitmap subtitles (PGS/VobSub can't be parsed as text), or Whisper quality validation after generation.

**Fix**: Added a 5-step subtitle handling decision tree:
1. **Probe** for embedded subtitle streams using `ffprobe -select_streams s`
2. **Select** best track by language priority (source language > "und" > other), preferring SRT over ASS
3. **Extract and normalize** — ffmpeg auto-converts ASS→SRT when output extension is .srt; bitmap subtitles (PGS/VobSub) fall through to Whisper
4. **Validate** extracted subtitles — `validate_subtitles()` checks: ≥100 cues, ≥30% temporal coverage, average cue length ≥5 chars (rejects signs-only tracks)
5. **Whisper fallback** with quality check — after generation, validate ≥50 segments/episode, no segment >30s, average 2-8s. Retry with `--model medium` on failure.

**Dependencies added**: `pysrt` (optional, for subtitle validation)

### FAIL-E4: Non-Japanese Language Handling

**Problem**: The entire pipeline assumed Japanese source audio with English narration. A developer building for English-dubbed anime, Chinese donghua, or Korean manhwa adaptations would have to figure out what changes across all 7 stages.

**Fix**: Added Section 3.1.2a (Language Mode Handling) with:
- **Pipeline impact matrix**: 6-row table mapping each stage to Japanese vs non-Japanese behavior. Key insight: most stages are language-agnostic (Demucs, scene detection, music mixing). Only transcription (`--language` flag), summarization (LLM reads source-language text), and anime dialogue moments change.
- **Same-language edge case**: When `anime.language == output.narration_language`, anime dialogue moments need stronger differentiation — lines must be more distinctive, can't overlap narrator content, consider audio effects (reverb, EQ) to distinguish character voice from narrator.
- **Character name handling**: Use official English localization names from subtitles/MAL, not romanized Japanese.

### FAIL-V3: Complete LLM Prompt Template

**Problem**: Section 3.2.5 had a `generate_act_script()` function with a brief inline prompt, but a developer implementing Phase 4 would need to assemble the full prompt from scattered sections (voice profile in 3.2.3, transition templates in 3.2.3, connector targets in 3.2.3, commentary density in 3.2.3). No single copy-paste-ready prompt existed.

**Fix**: Added a complete Phase 4 user prompt template (~100 lines) that combines all inputs into one document:
- Episode summaries section (filled per act)
- Word budget with ±5% bounds
- Anime dialogue slot placement rules (including act-specific: "ZERO slots in Act 4")
- Episode transition format (Template A vs B, with episode number thresholds)
- Connector frequency targets per 5 minutes (all 8 connectors + forbidden list)
- Commentary density mapped to act number
- Sentence length distribution targets with examples
- Continuity section (previous act's last 200 words)
- Output format specification with all marker types

The prompt is designed to be filled with `{variables}` and passed directly to the LLM. Each constraint section is self-contained so the LLM doesn't need external context.

### FAIL-V6: Hook-to-Body Music Crossfade

**Problem**: Section 3.6.1 specified a "60-90s overlap starting at ~3:30" between hook and body tracks but gave no ffmpeg command. A developer would have to research `afade`, `amix`, and `adelay` filter syntax independently.

**Fix**: Added two ffmpeg command approaches to Section 3.6.1:
1. **Three-step approach** (clearest): `afade=t=out` on hook (starts at 210s, 90s duration) → `adelay` + `afade=t=in` on body → `amix=inputs=2:normalize=0`
2. **Single-command alternative** (for pre-trimmed tracks): inline `afade` + `amix` filter chain

Both use `normalize=0` to prevent ffmpeg's automatic volume normalization (which would fight the gain automation in Section 3.6.4a). Output is `music_combined.wav` which feeds into the gain automation pipeline.

### FAIL-C1: TTS Config Expansion

**Problem**: The config schema (Section 5) had `tts_provider: string` as a single flat field. A developer couldn't configure voice-specific parameters (stability, similarity_boost, style for ElevenLabs; model, voice, speed for OpenAI) without reading the TTS API docs independently.

**Fix**:
1. **Expanded config.yaml**: Added `tts:` top-level section with `provider` field and nested `elevenlabs:` and `openai:` sub-configs. Each contains all provider-specific parameters with types, defaults, and descriptions.
2. **Refactored TTS generation code** (Section 3.4.4): Provider-agnostic dispatch pattern — `get_tts_generator(config)` returns a `generate_narration_segment(text, wpm)` function regardless of provider. Both ElevenLabs and OpenAI implementations read their parameters from the config, not hardcoded.
3. **Removed duplicate `tts_provider`** from the `tools:` section (now lives under `tts.provider`).

## Spec Implications

All 5 medium-priority failures are now resolved. The spec now handles:
1. Any subtitle format (SRT, ASS/SSA, bitmap fallback to Whisper) with quality validation
2. Non-Japanese source anime with clear pipeline adaptation rules and same-language edge case handling
3. A complete, copy-paste-ready LLM prompt template combining all constraints for script generation
4. Concrete ffmpeg commands for hook-to-body music crossfade
5. Provider-agnostic TTS configuration with full parameter control for ElevenLabs and OpenAI

With critical, high, and medium failures all resolved, the remaining low-priority items (missing Section 4 parameters, thumbnail generation, YouTube chapters) are nice-to-haves that don't block implementation.
