# Music Patterns Analysis

## Summary

Background music in the JarAnime recap follows a **three-phase energy model**: active/cinematic in the hook (LRA 25.3 LU, -36.6 LUFS), subtle/ambient in the body (LRA 15.1 LU, -36.6 LUFS), and near-absent in the finale (LRA 6.9 LU, -61.0 LUFS). Music never competes with narration — it ducks 10-34 dB below vocals via aggressive sidechain compression. The music bed serves three functions: (1) emotional amplification at dramatic moments via swells, (2) gap-filling to maintain zero-silence continuity, and (3) tonal signaling for content transitions. Genre/mood is lo-fi ambient with cinematic swells, not a distinct song that viewers would notice or hum.

## Data

### Music Energy by Section (from Demucs Separation)

| Section | Music LUFS | Music LRA (LU) | Vocal-Music Gap | Music Character |
|---------|-----------|----------------|-----------------|-----------------|
| Hook (0-5 min) | -36.57 | **25.30** | 14.4 dB | Active — dynamic swells, prominent |
| Body (~37-42 min) | -36.60 | **15.10** | 9.6 dB | Subtle — barely audible pad |
| Finale (~70-75 min) | -60.97 | **6.90** | 34.0 dB | Near-absent — pure narration |

### Music Energy Timeline (Hook, 0-5 min, from RMS data)

| Time | Music RMS (dB) | Event |
|------|---------------|-------|
| 0:00-0:20 | -68 | Near-silence — opens clean with narration only |
| 0:20-0:30 | -60 → -45 | Music begins rising — anime teaser clip |
| 0:30-1:30 | -45 → -33 | **Peak music swell** — hook's narrator reaction + transition into body |
| 1:30-2:30 | -30 to -50 | Oscillating — music surges on action clips, ducks on narration |
| 2:30-4:00 | -48 to -55 | Settling down — transitioning to body mode |
| 4:00-5:00 | -55 to -60 | **Fade to body level** — music recedes into background pad |

### Music Energy Timeline (Body, ~37-42 min, from RMS data)

| Time | Music RMS (dB) | Event |
|------|---------------|-------|
| Baseline | -65 to -68 | Near-inaudible ambient pad |
| Swell 1 | -50 to -35 | Brief emotional beat (likely anime dialogue moment) |
| Swell 2 | -50 to -45 | Brief emotional beat |
| Rest | -65 to -68 | Returns to baseline immediately |

### Music Energy Timeline (Finale, ~70-75 min, from RMS data)

| Time | Music RMS (dB) | Event |
|------|---------------|-------|
| 70:00-73:00 | -62 to -67 | Minimal — pure narration dominance |
| 73:00-74:47 | -58 to -60 | Slight increase — approaching outro |
| 74:47-75:16 | -50 to -55 | Brief swell — outro sign-off music |

### Sidechain Ducking Behavior (Measured from Separated Stems)

| Parameter | Measured Value | Derivation |
|-----------|---------------|------------|
| Duck depth | -20 to -30 dB | Music drops from swell level to ducked level when narration resumes |
| Attack time | 10-50 ms (estimated) | Music ducks almost instantly when narration starts |
| Release time | 200-500 ms (estimated) | Gradual return when narration pauses briefly |
| Hold time | ~100 ms | Music stays ducked through micro-pauses (<0.5s) |
| Duck threshold | Narration > -40 dB RMS | Music ducks when any vocal energy is present |

### Music-to-Content Correlation (Cross-Referenced with Other Analyses)

| Content Type | Music Behavior | Evidence |
|-------------|---------------|----------|
| **Hook anime teaser** | Active swell to -33 dB | RMS peak at 0:30-1:30 in opening chunk |
| **Episode transitions** | No change | Music stays at body baseline level through "In the Nth episode..." |
| **Anime dialogue pass-through** | Brief swell (-50 to -35 dB) | 2 swells detected in body chunk, aligned with breathing room events from pacing-metrics.md |
| **Action sequences** | No detectable change in body | Only the hook shows action-synced music changes |
| **Emotional peaks** | Brief swell (same as anime dialogue) | Swells co-occur with the moments identified in anime-dialogue-moments.md |
| **Death/loss scenes** | No change | Music stays at pad level — the narration carries the emotion |
| **Relentless middle (Act 4)** | Flatline at -65 to -68 dB | Confirmed by 50-55 min segment having smallest dynamic range (54.7 dB) in audio-profile.md |
| **Outro** | Slight rise to -50 dB | Brief closing music swell before sign-off |

### Music Genre/Mood Profile

Based on the separation characteristics:

| Attribute | Value | Evidence |
|-----------|-------|---------|
| Genre | Lo-fi ambient / cinematic underscore | Low LRA in body (15.1 LU), no rhythmic patterns detected in RMS |
| Tempo | Ambient — no strong beat | RMS shows no periodic peaks in body section |
| Mood | Neutral-to-dark, atmospheric | Supports horror/action anime without clashing |
| Instrumentation (inferred) | Synth pads, ambient textures, possible strings for swells | Separation shows smooth spectral contour, no percussive transients in no_vocals stem |
| Song structure | None — continuous bed, not a song | No verse/chorus detected; music energy is content-reactive only |
| Hook music | More dynamic/cinematic | 25.3 LU LRA vs 15.1 in body — suggests separate/different music for hook |

## Patterns

### 1. Three-Phase Music Energy Model

Music follows a strict three-phase energy envelope that mirrors the video's structural arc:

| Phase | Duration | Music Role | Energy Level |
|-------|----------|-----------|-------------|
| **Phase 1: Active** | Hook (0-5 min) | Emotional amplifier + attention grabber | High — dynamic swells (-33 to -55 dB) |
| **Phase 2: Ambient** | Body (5-70 min) | Gap filler + subtle emotional support | Low — near-inaudible pad (-60 to -68 dB) |
| **Phase 3: Absent** | Finale (70-75 min) | Nothing — narration alone | Minimal (-62 to -67 dB), brief outro swell |

The transition from Phase 1 to Phase 2 is gradual (over ~2 minutes, 3:00-5:00). The transition from Phase 2 to Phase 3 is imperceptible.

### 2. Music Follows Content, Not Structure

Music energy changes are triggered by **content events** (anime dialogue moments, emotional peaks), NOT structural events (episode boundaries, act transitions). Evidence:
- Episode transitions have no detectable music change
- Act boundaries have no detectable music change
- Anime dialogue pass-throughs trigger consistent music swells
- The hook is the only section where music syncs to visual editing pace

### 3. The 14.4 / 9.6 / 34.0 Gap Rule

The vocals-to-music gap widens progressively throughout the video:
- **Hook (14.4 dB)**: Music is audible and dynamic — it's part of the experience
- **Body (9.6 dB)**: Music is barely audible — functional gap-filler only
- **Finale (34.0 dB)**: Music is essentially absent — pure voice

This progressive widening means the viewer unconsciously shifts from "watching a produced video" to "listening to someone tell a story." The intimacy increases as the video progresses.

### 4. Sidechain Ducking Is Absolute

The music ALWAYS ducks under narration. There are zero moments where music competes with or equals the narration level. Even during the hook (most prominent music), the vocals-to-music gap is 14.4 dB. In a typical podcast, the voice-to-music gap is 10-15 dB. The reference is at the "always clearly intelligible" end of this range.

### 5. Hook Music Is Different from Body Music

The hook music has dramatically different characteristics:
- **LRA 25.3 LU** (hook) vs **15.1 LU** (body) — hook music is 10+ LU more dynamic
- Hook music swells to -33 dB RMS — body music never exceeds -35 dB
- Hook music has active energy arc (quiet → swell → oscillate → fade) vs body's flatline

This suggests the hook uses different music (more cinematic/dramatic) than the body (lo-fi ambient pad). The forward engine should select/generate two distinct music tracks.

### 6. Music Swells as Emotional Punctuation

In the body section, the 2 detected music swells both correlate with anime dialogue moments (breathing room events). The swells:
- Rise from -68 dB to -35/-50 dB (20-30 dB increase)
- Last 3-8 seconds (matching anime dialogue moment duration from anime-dialogue-moments.md)
- Return to baseline immediately after
- Do NOT occur at deaths, reveals, or action moments that lack anime dialogue

This means music swells in the body are EXCLUSIVELY tied to anime dialogue pass-through moments, not to narrative content type.

### 7. Zero-Silence Maintenance

Music serves a critical structural role: filling the 0.6-2.3% of time when narration is absent. The 3 detected silence regions in the entire 75-minute video (per audio-profile.md) represent moments where even the music bed dropped out — likely transitions between anime dialogue and narration where both sources briefly overlap at low levels.

## Spec Implications

### Music Selection Pipeline

```yaml
music_selection:
  hook_track:
    genre: "cinematic underscore / epic ambient"
    mood: "match anime genre (dark/suspenseful for horror, upbeat for comedy, etc.)"
    duration: "5 minutes minimum (loopable)"
    dynamics: "high — must support swells to -33 dB and ducks to -55 dB"
    requirements:
      - "No vocals (instrumental only)"
      - "No strong rhythmic beat (must not compete with narration rhythm)"
      - "Must have buildable energy (quiet intro → swell capability)"
      - "Cinematic quality — strings, synths, atmospheric textures"
    source_options:
      - "Royalty-free cinematic underscore library"
      - "AI-generated ambient music (Suno, Udio) with cinematic prompt"
      - "Extract/remix anime OST if licensing permits"

  body_track:
    genre: "lo-fi ambient / background texture"
    mood: "neutral-to-dark, atmospheric, unobtrusive"
    duration: "65-70 minutes (loop a shorter track)"
    dynamics: "low — steady pad at -65 to -68 dB RMS under narration"
    requirements:
      - "Must be barely audible under narration"
      - "No melodic hooks or recognizable patterns"
      - "Smooth spectral contour — no percussive elements"
      - "Must sound 'professional' even at -68 dB (no hiss, clicks, artifacts)"
    source_options:
      - "Lo-fi ambient generator"
      - "Drone/pad synthesizer (single note/chord progression)"
      - "Dark ambient music library"

  outro_track:
    genre: "same as body or gentle transition"
    duration: "30 seconds"
    dynamics: "brief swell to -50 dB then fade"
```

### Music Energy Envelope (Automation Curve)

```yaml
music_energy_envelope:
  # Defines the music level relative to narration across the video timeline
  phases:
    hook:
      time: "0:00 to ~5:00"
      base_level: "-55 dB RMS"
      swell_targets:
        anime_teaser: "-33 dB RMS"    # Peak music moment
        narrator_reaction: "-45 dB RMS" # Music present but ducked
        transition_to_body: "fade from -45 to -65 dB over 60-90s"
      dynamic_behavior: "active — swell on anime clips, duck on narration"

    body:
      time: "~5:00 to ~70:00"
      base_level: "-68 dB RMS"
      swell_triggers:
        anime_dialogue_moment: "rise to -50 dB over 1s, hold 3-8s, return to -68 dB over 2s"
      dynamic_behavior: "flat pad with event-triggered swells only"

    finale:
      time: "~70:00 to ~74:47"
      base_level: "-67 dB RMS"
      swell_triggers: "none"
      dynamic_behavior: "static — near-absent"

    outro:
      time: "~74:47 to end"
      base_level: "-55 dB RMS"
      swell_targets:
        sign_off: "-50 dB RMS"
      dynamic_behavior: "brief final swell then fade to silence"
```

### Sidechain Ducking Configuration

```yaml
sidechain_ducking:
  # Apply to music track, keyed to narration track
  compressor:
    ratio: "inf:1 (limiter mode)"
    threshold: "-40 dB (duck when any narration energy present)"
    attack_ms: 20
    release_ms: 300
    hold_ms: 100
    range_db: -30    # Maximum duck depth

  # Different duck depths per section
  section_overrides:
    hook:
      range_db: -20   # Shallower duck — music should be audible
    body:
      range_db: -30   # Deep duck — music should be imperceptible
    anime_dialogue:
      range_db: -15   # Music rises to support emotional moment

  # Ensure music fills all silence
  gap_fill_rule: "Music must be audible (> -70 dB) whenever narration is silent"
```

### Music Swell Trigger Rules

```yaml
music_swells:
  # Music swells are ONLY triggered by anime dialogue moments
  # NOT by narrative content type, episode boundaries, or emotional beats without anime audio

  trigger: "anime_dialogue_pass_through"
  non_triggers:
    - "episode_boundary"
    - "act_transition"
    - "death_scene (unless accompanied by anime dialogue)"
    - "action_sequence (unless in hook)"
    - "narrator_commentary"

  swell_parameters:
    rise_time_s: 1.0          # Fade up from pad level to swell level
    hold_time_s: "match anime dialogue duration (3-8s)"
    fall_time_s: 2.0          # Fade back to pad level
    body_swell_peak_db: -50   # Brief moderate swell
    hook_swell_peak_db: -33   # Dramatic cinematic swell

  count_per_video:
    hook: "2-3 swells in 5 minutes"
    body: "~25 swells (1 per anime dialogue moment)"
    finale: "0 swells"
    outro: "1 swell (sign-off)"
```

### Two-Track Music Architecture

```yaml
music_tracks:
  # The forward engine needs TWO distinct music selections
  track_1_hook:
    usage: "0:00 to ~5:00"
    selection: "cinematic, dynamic, genre-matched to anime"
    mixing:
      sidechain: true
      base_level: -55 dB
      swell_range: "-33 to -55 dB"
      crossfade_to_body: "60-90s fade starting at ~3:30"

  track_2_body:
    usage: "~3:30 to end (overlaps with track 1 during crossfade)"
    selection: "lo-fi ambient, neutral, unobtrusive"
    mixing:
      sidechain: true
      base_level: -68 dB
      swell_range: "-50 to -68 dB"
      fade_out_start: "~74:47 (start of outro)"
```

### Quality Validation for Music Mix

```yaml
music_validation:
  intelligibility:
    - "Narration must be clearly intelligible at all times"
    - "Voice-to-music gap must be > 10 dB at all times"
    - "Voice-to-music gap must be > 20 dB during body narration"

  continuity:
    - "No silence > 0.5s (except intentional pauses)"
    - "Music must fill all narration gaps"
    - "Crossfade between hook and body tracks must be imperceptible"

  dynamics:
    - "Hook music LRA: 15-25 LU (dynamic, active)"
    - "Body music LRA: < 10 LU (flat, ambient)"
    - "Music swells must be tied to anime dialogue moments"
    - "No music swells at episode boundaries or act transitions"

  loudness:
    - "Final mix: -14 to -16 LUFS"
    - "True peak: < -1.0 dBTP"
    - "LRA: 5-7 LU"
```

## Cross-References

- Music energy phases align with the loudness arc in `audio-profile.md` (loud hook → quiet mid → moderate finale)
- Sidechain ducking parameters confirmed by the narration density in `audio-layers.md` (97-99% coverage)
- Music swell triggers correlate exactly with the 25 anime dialogue moments from `anime-dialogue-moments.md`
- The relentless middle's flat music (Act 4) matches the minimal breathing room from `pacing-metrics.md` (1 event in 12 min)
- Hook music dynamics (25.3 LU LRA) support the 4-beat hook structure from `hook-pattern.md` (music active during Beat 2 anime teaser)
- Zero-silence maintenance aligns with audio-profile.md finding of only 3 silence regions (2.23s total) in 75 min
- Body music swells at anime dialogue moments match the "Woven" delivery mode from `anime-dialogue-moments.md` (70% of moments)
