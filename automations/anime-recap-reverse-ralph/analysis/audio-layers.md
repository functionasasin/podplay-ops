# Audio Layers Analysis (Demucs Separation)

## Summary

The reference video's audio was separated into vocals (narration + anime dialogue) and no_vocals (music + SFX) using Demucs htdemucs model across three 5-minute samples (opening, middle, end). The separation reveals a **three-layer audio architecture**: (1) dominant narration at -22 to -27 LUFS, (2) background music bed at -37 to -61 LUFS depending on section, and (3) occasional anime dialogue moments that appear in the vocals stem. Narration occupies 97.7-99.4% of all time with virtually zero dead air. The vocals-to-music loudness gap varies dramatically by section: 14.4 dB at the hook (music is prominent), 9.6 dB in the body (music tighter under voice), and 34.0 dB at the end (music nearly absent).

## Data

### Separation Method

| Parameter | Value |
|-----------|-------|
| Tool | Demucs (htdemucs model) |
| Mode | Two-stem (vocals / no_vocals) |
| Output format | MP3 320kbps |
| Sampling strategy | 3 x 5-minute chunks from 75-minute video |
| Chunks | chunk-00 (0:00-5:00), chunk-mid (~37:30-42:30), chunk-end (~69:44-75:00) |

### Vocal Stem Loudness (Narration + Anime Dialogue)

| Chunk | LUFS | True Peak (dBTP) | LRA (LU) | Narration % | Silence Gaps | Total Silence |
|-------|------|-------------------|-----------|-------------|--------------|---------------|
| Opening (0-5 min) | **-22.15** | -3.98 | 3.80 | **99.4%** | 3 | 1.77s |
| Middle (~37-42 min) | **-27.03** | -9.30 | 3.60 | **97.7%** | 8 | 6.83s |
| End (~70-75 min) | **-26.95** | -7.36 | 4.10 | **98.7%** | 7 | 4.18s |

### Non-Vocal Stem Loudness (Music + SFX)

| Chunk | LUFS | True Peak (dBTP) | LRA (LU) |
|-------|------|-------------------|-----------|
| Opening (0-5 min) | **-36.57** | -9.10 | **25.30** |
| Middle (~37-42 min) | **-36.60** | -16.54 | **15.10** |
| End (~70-75 min) | **-60.97** | -29.13 | **6.90** |

### Vocals-to-Music Gap

| Chunk | Vocal LUFS | Music LUFS | Gap (dB) | Interpretation |
|-------|-----------|------------|----------|----------------|
| Opening | -22.15 | -36.57 | **14.4** | Music is audible and prominent alongside narration |
| Middle | -27.03 | -36.60 | **9.6** | Music is close to narration level — voice still dominates |
| End | -26.95 | -60.97 | **34.0** | Music is nearly inaudible — pure narration zone |

### Music Energy Patterns (Frame-Level RMS)

**Opening chunk (0-5 min)**: Music energy is highly variable (LRA 25.3 LU). Several distinct peaks visible in the RMS data:
- 0:00-0:20: Very quiet (-68 dB) — opens with narration only or quiet ambience
- 0:20-1:30: Music ramps up (-60 → -33 dB) — hook music kicks in
- 1:30-4:00: Oscillating pattern (-30 to -50 dB) — music swells during anime clip moments, ducks during narration
- 4:00-5:00: Music drops significantly (-48 to -55 dB) — settling into body mode

**Middle chunk (~37-42 min)**: Music energy is low and steady (LRA 15.1 LU).
- Background levels hover at -65 to -68 dB RMS (barely audible)
- Two brief music swells to -35 to -50 dB (likely anime dialogue moments or emotional beats)
- Dominant pattern: near-silence background pad, consistent narration

**End chunk (~70-75 min)**: Music energy is very low and flat (LRA 6.9 LU).
- Steady -62 to -67 dB through most of the section
- Slight increase in final 2 minutes (-58 to -60 dB) — possible outro music
- One brief swell near the very end (~-50 dB at 316s)

### Narration Silence Analysis (Vocal Stem, -35 dB threshold, >0.5s)

| Chunk | Gaps | Mean Gap Duration | Max Gap Duration | Distribution |
|-------|------|-------------------|------------------|-------------|
| Opening | 3 | 0.59s | 0.61s | Very uniform — all ~0.6s |
| Middle | 8 | 0.85s | 1.52s | More varied — includes 1.2-1.5s pauses for anime dialogue |
| End | 7 | 0.60s | 0.71s | Uniform — tight narration pacing |

## Patterns

### 1. Three-Layer Audio Architecture

The reference video has exactly three audio layers:
1. **Narration** (primary): Male voiceover, heavily compressed (LRA 3.6-4.1 LU), present 97-99% of runtime
2. **Background music**: Lo-fi/ambient bed, ducked heavily under narration (14-34 dB below voice), with dynamic swells at emotional/action moments
3. **Anime dialogue pass-throughs**: Original Japanese audio played through during key moments — these appear in the vocals stem mixed with brief narration pauses

### 2. Hook Has Distinctly Different Audio Mix

The opening 5 minutes have a fundamentally different audio balance:
- Vocals are **5 dB louder** (-22.15 vs -27 LUFS)
- Music is **equally loud** in absolute terms (-36.57 LUFS) but has **far more dynamic range** (25.3 vs 15.1 LU)
- The gap is wider (14.4 dB) yet music *feels* more present because of the high dynamic range — dramatic swells punch through

### 3. Music Serves as Emotional Amplifier, Not Filler

The music energy data shows music is NOT a constant background pad. Instead:
- **Opening**: Music actively rises and falls with content (action scenes get music swells to -30 dB, narration segments duck to -55 dB)
- **Body**: Music recedes to near-inaudible (-65 to -68 dB) — becomes subtle texture only
- **End**: Music is essentially absent — pure narration dominance for the conclusion
- **Exceptions**: Brief music peaks occur at anime dialogue moments (emotional beats)

### 4. Narration Density Is Extreme

At 97.7-99.4% coverage, the narrator barely pauses:
- Opening: Only 1.77s of silence in 300s (0.6%)
- Middle: 6.83s of silence in 300s (2.3%) — the "breathiest" section
- End: 4.18s of silence in 316s (1.3%)
- Extrapolated to full 75 min: approximately 60-90 seconds of total silence

### 5. Vocal Compression Is Uniform

The tight LRA (3.6-4.1 LU) across all three samples confirms the narration is processed through a compressor/limiter with very consistent settings. The voice maintains the same perceived loudness throughout, regardless of emotional intensity in the content.

### 6. Music Ducking Curve

From the RMS data, the music ducking behavior follows a pattern:
- **During narration**: Music at -60 to -68 dB RMS (inaudible or barely audible)
- **During brief pauses** (0.5-1.5s): Music stays ducked
- **During anime dialogue moments**: Music may swell to -35 to -50 dB (becomes a noticeable bed)
- **During hook action clips**: Music peaks to -30 to -33 dB (prominent, cinematic)

## Spec Implications

### Audio Mixing Architecture

The forward engine needs a **3-track mixing model**:
1. **Narration track** (TTS output): Apply compression (ratio 4:1, attack 5ms, release 100ms) to achieve LRA < 4.5 LU
2. **Music track** (selected/generated): Apply sidechain ducking keyed to narration
3. **Anime dialogue track** (extracted from source): Route through during selected pass-through moments

### Sidechain Ducking Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Duck ratio | -20 to -30 dB | Music drops 20-30 dB below baseline when narration is active |
| Attack | 10-50ms | Fast duck when narration starts |
| Release | 200-500ms | Gradual return when narration pauses |
| Hold | 100ms | Prevent pumping on brief pauses |
| Threshold | Keyed to narration RMS level | Duck when narration > -40 dB |

### Per-Section Music Energy Targets

| Section | Music Level (relative to narration) | Music LRA | Behavior |
|---------|-------------------------------------|-----------|----------|
| Hook (0-5 min) | -14 dB below narration | High (20+ LU) | Active swells synced to visual action |
| Body (5 min to -5 min) | -25 to -30 dB below narration | Low (< 10 LU) | Subtle background pad, barely audible |
| Anime dialogue moments | -10 to -15 dB below narration | Medium | Brief swell to support emotional beat |
| Outro (final 2-3 min) | -30+ dB below narration | Very low | Nearly silent; narration-only zone |

### Audio Rendering Pipeline

```
1. Generate narration audio (TTS) → compress to LRA < 4.5 LU
2. Select/generate background music → match content mood
3. Extract anime dialogue moments from source
4. Create 3-track timeline:
   - Track 1: Narration (dominant, -22 to -27 LUFS)
   - Track 2: Music (ducked under narration, sidechain compressed)
   - Track 3: Anime dialogue (pass-through at narration level)
5. Apply section-specific music energy envelope:
   - Hook: Music active, +5 dB boost to narration
   - Body: Music subtle, baseline narration level
   - Outro: Music nearly silent
6. Final mix → loudnorm to -14 LUFS, -1.0 dBTP, LRA 5-7 LU
```

### Quality Validation

After mixing, verify:
- Integrated loudness: -14 to -16 LUFS
- True peak: < -1.0 dBTP
- LRA: 5-7 LU (match reference's compressed style)
- Narration intelligibility: Vocal stem should be > 10 dB above music at all times
- No dead air > 0.5s (except intentional anime dialogue pauses)

### Cross-References

- Loudness phases correlate with `audio-profile.md` per-minute trajectory (hook loud, mid quiet, end moderate)
- The 97-99% narration density aligns with `narration-transcript.md` finding of 10,759 words in 75 minutes (~144 WPM sustained)
- Music swells in opening correlate with the fastest visual editing pace (31.4 cuts/min) per `scene-boundaries.md`
- The music duck-and-swell pattern suggests music changes are **visually triggered** — action scenes get louder music, dialogue scenes get quieter music

### Raw Data

See `raw/audio-separation.json` for full structured data including per-chunk loudness metrics.
Separated stems stored in `raw/separated/chunks/htdemucs/{chunk-00,chunk-mid,chunk-end}/{vocals,no_vocals}.mp3`.
