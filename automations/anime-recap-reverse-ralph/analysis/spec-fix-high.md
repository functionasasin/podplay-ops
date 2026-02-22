# Spec Fix: High-Priority Failures

## Summary

Fixed all 5 high-priority failures identified in the spec-review that would cause incorrect output. Added 12-episode scaling rules, ffmpeg sidechain ducking command, music swell automation code, script validation gate between Stage 2→3, and LLM per-act generation with retry/chunking strategy.

## Fixes Applied

### FAIL-E2: 12-Episode Scaling Under-Specified

**Problem**: The spec was calibrated entirely to 24-episode seasons. A developer building for a 12-episode anime would have to guess at: how many acts to use (5 is too many for 12 eps), how many anime dialogue moments (10-12 is too many for a 37-min video), breathing event spacing, and whether connector frequency targets still hold. The word budget calculator and episode duration formula work mathematically but produce unusual results for short seasons without guidance.

**Fix**: Added Section 3.2.0 (Season Length Scaling) with a comprehensive scaling table:
- **Act count**: `max(3, min(6, ceil(total_eps / 5)))` — 12 eps → 3 acts, 24 eps → 5 acts, 36 eps → 6 acts
- **Target duration**: `total_eps * 3.1` minutes (proven linear from reference), minimum 30 min
- **Anime dialogue moments**: `max(5, round(total_eps / 2.2))` — 12 eps → 5-6, 24 eps → 11
- **Breathing events**: Scale linearly with duration, targeting 1 per 3.9 min (19/75 from reference)
- **Connector frequencies**: Per-5-minute targets in Section 3.2.3 are already rate-based and scale naturally — added explicit note
- **Commentary ratio**: Stays at 4% regardless of season length — it's a density metric
- **Hook/outro**: Fixed at 36s/28s regardless of season length — these are structural invariants
- **Episode duration allocation**: Formula already handles variable `total_eps` — added validation that shortest episode is ≥ 1.5 min and longest ≤ 8 min

Also added a scaling validation function that verifies all derived parameters are within sane ranges.

### FAIL-V4: Sidechain Ducking — No FFmpeg Command

**Problem**: Section 3.6.3 specified all ducking parameters (ratio, threshold, attack, release, range) but gave no ffmpeg command. A developer would have to research ffmpeg's `sidechaincompress` filter syntax independently.

**Fix**: Added complete ffmpeg sidechain ducking command to Section 3.6.3:
- Uses `sidechaincompress` audio filter with narration as sidechain input
- Hook ducking: `-30dB` range with fast attack
- Body ducking: `-40dB` range (music nearly inaudible under narration)
- Anime dialogue pass-through: `-15dB` range (music still present)
- Three separate filter invocations for hook/body/finale phases, or a single Python-controlled gain automation approach

The command:
```bash
ffmpeg -i music.wav -i narration.wav \
  -filter_complex "[0:a][1:a]sidechaincompress=threshold=0.01:ratio=20:attack=20:release=300:level_sc=1:mix=1[ducked]" \
  -map "[ducked]" music_ducked.wav
```

Note: ffmpeg's `sidechaincompress` has limited range control. For the variable ducking depths (hook vs body vs anime dialogue), the recommended approach is Python-based gain automation (see FAIL-V5 fix) rather than a single static sidechain.

### FAIL-V5: Music Swell Automation — No Implementation

**Problem**: Section 3.6.4 specified that music swells trigger ONLY at anime dialogue moments, but provided no code to actually automate the gain changes. A developer would need to build gain automation from scratch.

**Fix**: Added a complete Python gain automation function:
- Takes the music audio array, anime dialogue moment timestamps, and phase boundaries (hook/body/finale)
- Applies phase-specific base levels (-55 dB hook, -68 dB body, -67 dB finale)
- At each anime dialogue moment: ramps up 1s before, holds for moment duration, fades down 2s after
- Hook swells target -33 dB, body swells target -50 dB
- Uses smooth cosine interpolation for natural-sounding gain curves
- Applies sidechain ducking on top of the gain envelope (narration takes priority)
- Returns the processed music audio ready for mixing

The function uses `numpy` + `scipy.signal` for audio processing, with `pydub` or raw WAV I/O for file handling.

### FAIL-S4: No Script Validation Gate Between Stage 2→3

**Problem**: If the LLM generates a script that violates constraints (wrong word count, missing hook beats, too many formal connectors, wrong commentary ratio), the error propagates through all downstream stages — wasting TTS credits, compute time, and rendering. There was no checkpoint between script generation and audio/video production.

**Fix**: Added Section 3.2.4 (Script Validation Gate) as a hard gate between Stage 2 and Stage 3. The gate runs all Tier 1 validation checks from Section 7 PLUS additional script-specific checks:
- **Word budget**: Total words within ±5% of target (hard fail >10%)
- **Per-episode words**: Each episode within 0.3x-2.0x of average
- **Hook structure**: All 4 beats present, 50-80 words
- **Outro structure**: Sign-off present, 70-110 words
- **Connector frequencies**: "So," within 20-30 per 75 min, zero "Nevertheless/Furthermore/Moreover"
- **Commentary ratio**: 3-5% (hard fail if <2% or >7%)
- **Anime dialogue slots**: 10-12 for 24 eps, correctly distributed (0 in Act 4)
- **Episode transitions**: Template A for eps 1-6, Template B for eps 7+
- **Sentence length distribution**: Mean 13-17 words, max 45

If any hard-fail check trips, the script is rejected and regenerated (up to 3 retries per act, per FAIL-S5 fix). Soft-fail warnings are logged but don't block.

### FAIL-S5: No LLM Retry/Chunking Strategy

**Problem**: The spec implied generating the entire 10,800-word narrator script in a single LLM call. No current LLM reliably produces 10,000+ coherent words in one pass while maintaining consistent voice, connector frequencies, pacing targets, and structural requirements. A developer would discover this immediately and have to design a chunking strategy from scratch.

**Fix**: Added Section 3.2.5 (LLM Generation Strategy) with a per-act generation pipeline:
1. **Phase 1 — Episode Summaries**: One LLM call per episode (24 calls, ~300 words each). Independent, parallelizable.
2. **Phase 2 — Arc Detection**: One call with all summaries concatenated (~7,200 words input). Outputs act boundaries and arc-merge candidates.
3. **Phase 3 — Hook + Outro**: Two independent calls, small output (~65 + ~90 words). Template-constrained.
4. **Phase 4 — Per-Act Script Generation**: One call per act (3-6 calls depending on season length). Each call receives:
   - The episode summaries for that act
   - The full narrator voice profile (system prompt)
   - Word budget for the act
   - Previous act's last 200 words (for continuity)
   - Anime dialogue slot budget for the act
   - Connector frequency targets
5. **Phase 5 — Stitch + Validate**: Concatenate all acts, run validation gate (FAIL-S4 fix). If validation fails on an act, regenerate just that act (up to 3 retries).

Each LLM call includes:
- **Temperature**: 0.7 (casual but not chaotic)
- **Max tokens**: act_word_budget * 1.5 (overshoot buffer, trimmed in validation)
- **Retry on failure**: Up to 3 attempts with increasing temperature (+0.05 per retry)
- **Context window management**: Each per-act call is ~4,000 words input + ~2,500 words output — well within any modern LLM's limits

Cost estimate: ~$2-4 per script generation (Claude Sonnet pricing at ~$3/M input, ~$15/M output).

## Spec Implications

All 5 high-priority failures are now resolved. A developer can:
1. Scale the engine to 12, 13, 24, or 36-episode seasons with predictable parameter adjustments
2. Apply sidechain ducking using ffmpeg or Python gain automation with exact parameter values
3. Automate music swells at anime dialogue moments with smooth gain envelopes
4. Validate the script before committing to expensive TTS and render passes
5. Generate scripts reliably using per-act LLM calls with constraint validation and retry logic

Remaining: spec-fix-medium for quality improvements (subtitle edge cases, non-Japanese handling, crossfade command, etc.).
