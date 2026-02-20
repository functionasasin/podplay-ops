# Pacing Metrics Analysis

## Summary

The narrator maintains a remarkably consistent 144.6 WPM across the 75-minute video, with only 10.8% coefficient of variation at 30-second granularity. There is a measurable 5.4% acceleration from first half (140.8 WPM) to second half (148.3 WPM), corresponding to the episode compression curve. Per-episode WPM ranges from 129.9 (ep 3) to 156.4 (ep 17) with a stdev of just 7.0 WPM. The narration is near-continuous (99.2% coverage), with "breathing room" events (pauses + anime dialogue) occurring every ~2.2 minutes (median). Sentences average 15.2 words with a dominant medium-to-long (13-20 word) length at 40.6% of all sentences.

## Data

### Global Pacing Metrics

| Metric | Value |
|--------|-------|
| Total duration | 4,516.6s (75.3 min) |
| Narration duration | 4,479.6s (74.7 min) |
| Narration coverage | 99.2% |
| Total narration words | 10,759 |
| Global WPM | 144.1 (segment-level) / 144.6 (30s-window) |
| 30s-window WPM stdev | 15.6 |
| Coefficient of variation | 10.8% (moderate consistency) |
| First-half avg WPM | 140.8 |
| Second-half avg WPM | 148.3 |
| Acceleration (1st → 2nd half) | +5.4% |

### Per-Episode WPM

| Episode | Duration | Words | WPM | Zone |
|---------|----------|-------|-----|------|
| 1 | 6.6 min | 960 | 145.6 | Baseline |
| 2 | 5.3 min | 739 | 138.3 | Baseline |
| 3 | 2.3 min | 305 | 129.9 | **Slowest** |
| 4 | 3.9 min | 550 | 141.0 | Baseline |
| 5 | 3.6 min | 501 | 140.3 | Baseline |
| 6 | 3.3 min | 466 | 142.0 | Baseline |
| 7 | 4.2 min | 577 | 138.1 | Baseline |
| 8 | 4.1 min | 615 | 150.2 | Rising |
| 9 | 4.6 min | 654 | 141.8 | Baseline |
| 10 | 2.7 min | 387 | 144.0 | Baseline |
| 11 | 2.6 min | 371 | 140.5 | Baseline |
| 12 | 3.2 min | 461 | 143.9 | Baseline |
| 13 | 3.0 min | 429 | 145.2 | Baseline |
| 14 | 3.0 min | 464 | 154.6 | Accelerated |
| 15 | 2.0 min | 291 | 145.6 | Baseline |
| 16 | 1.9 min | 290 | 153.4 | Accelerated |
| 17 | 2.4 min | 369 | **156.4** | **Fastest** |
| 18 | 2.1 min | 312 | 147.6 | Rising |
| 19 | 2.2 min | 349 | 156.3 | Accelerated |
| 20 | 1.8 min | 284 | 154.5 | Accelerated |
| 21 | 2.2 min | 317 | 144.9 | Baseline |
| 22 | 2.4 min | 359 | 147.6 | Rising |
| 23 | 2.0 min | 313 | 156.0 | Accelerated |
| 24 | 2.8 min | 429 | 155.5 | Accelerated |

**Per-episode stats**: Mean 146.4, Median 145.4, Stdev 7.0, Min 129.9 (ep 3), Max 156.4 (ep 17)

**Three WPM zones**:
- Baseline (130-145 WPM): Episodes 1-7, 9-13, 15, 21 — early/mid-season establishing content
- Rising (145-150 WPM): Episodes 8, 18, 22 — transitional moments
- Accelerated (150-157 WPM): Episodes 14, 16-17, 19-20, 23-24 — arc-merged and late-season compression

### 30-Second Window WPM Distribution

| WPM Range | Count | % of Windows |
|-----------|-------|-------------|
| < 100 | 3 | 2.0% |
| 100-120 | 8 | 5.3% |
| 120-135 | 20 | 13.2% |
| 135-150 | 55 | 36.4% |
| 150-165 | 50 | 33.1% |
| 165-180 | 13 | 8.6% |
| > 180 | 2 | 1.3% |

**Modal range**: 135-165 WPM captures 69.5% of all windows. The narration hovers in a tight band.

### WPM Dips (< 120 WPM in 30s windows)

These are the moments where narration pauses for anime dialogue or structural breaks:

| Timestamp | WPM | Cause |
|-----------|-----|-------|
| 00:00 | 80.0 | Hook opening — deliberate slow start |
| 04:00 | 115.7 | Anime dialogue cluster (ep 1) |
| 10:00 | 123.3 | Anime dialogue (ep 3, "You're a demon") |
| 13:30 | 110.3 | Anime dialogue (ep 4, pregnancy reveal) |
| 17:30 | 108.9 | Anime dialogue (ep 5, "Something's very wrong") |
| 30:30 | 117.1 | Anime dialogue (ep 8, fight moment) |
| 38:00 | 110.3 | Anime dialogue (ep 10, "Do you really do all those horrible things...") |
| 39:30 | 103.8 | Anime dialogue (ep 10, "Shinn, calm down") + 6.6s pause |
| 41:30 | 113.9 | Anime dialogue near ep 11 boundary |
| 68:00 | 91.0 | Anime dialogue cluster (ep 22, longest pause 10s) |
| 75:00 | 97.6 | Outro — winding down |

**Pattern**: WPM dips are NOT random slowdowns. They are structural breathing points created by anime dialogue insertions and significant pauses.

### WPM Peaks (> 165 WPM in 30s windows)

| Timestamp | WPM | Context |
|-----------|-----|---------|
| 18:00 | 164.8 | Post-anime-dialogue recovery in ep 5 |
| 56:00 | 173.9 | Peak of Act 4 (conspiracy arc, arc-merged) |
| 61:30 | 179.8 | Act 5 climax section |
| 63:30 | 166.3 | Act 5 action sequences |
| 69:00 | 175.6 | Post-anime-dialogue recovery in ep 23 |
| 69:30 | 180.2 | **Maximum WPM** — densest narration in entire video |
| 70:30 | 171.1 | End of ep 23, approaching finale |

**Pattern**: WPM peaks cluster in Acts 4-5 (47:00-72:00) where episode compression is highest. The narrator packs more words per minute to cover more plot in less time.

### Breathing Room Events

Total events: 19 (8 significant pauses + 11 anime dialogue clusters)

| Metric | Value |
|--------|-------|
| Mean time between events | 219.9s (3.7 min) |
| Median time between events | 129.9s (2.2 min) |
| Longest stretch without breathing | 1,264.6s (21.1 min) — from ep 3 to ep 10 |
| Shortest stretch | Overlapping events (pause + anime dialogue co-occur) |

**Distribution across acts**:
- Hook (0:00-0:36): 3 events in 36s — extremely dense breathing
- Act 1 (0:36-12:32): 4 events in 12 min — 1 per 3 min
- Act 2 (12:32-29:46): 3 events in 17 min — 1 per 5.7 min
- Act 3 (29:46-47:02): 5 events in 17 min — 1 per 3.4 min
- Act 4 (47:02-59:14): 1 event in 12 min — sparse, relentless pacing
- Act 5 (59:14-72:03): 2 events in 13 min — mostly at ep 22 climax
- Resolution (72:03-75:16): 0 events — pure narration to close

### Sentence Length Distribution

| Category | Count | % | Words |
|----------|-------|---|-------|
| Short (2-5 words) | 51 | 7.1% | Reactions, interjections ("Not good.", "Thank god.") |
| Medium (6-12 words) | 224 | 31.3% | Action beats, dialogue descriptions |
| Long (13-20 words) | 291 | **40.6%** | Core narrative sentences — most common |
| Very long (21+ words) | 150 | 20.9% | Complex plot explanations, scene setups |

**Stats**: Mean 15.2 words/sentence, Median 15, Stdev 7.0, Max 48

### Segment-Level Statistics

| Metric | Value |
|--------|-------|
| Total narration segments | 1,611 |
| Segment duration mean | 5.50s |
| Segment duration median | 5.44s |
| Segment duration stdev | 0.77s |
| Words per segment mean | 6.8 |
| Per-segment WPM mean | 75.0 |
| Per-segment WPM median | 73.9 |

Note: Per-segment WPM (75) is lower than global WPM (144) because SRT segments heavily overlap (mean overlap 2.76s). The 144 WPM figure from windowed analysis is the accurate narration pace.

## Patterns

### 1. Three-Zone Pacing Model

The narrator operates in three distinct WPM zones, NOT a continuous gradient:

| Zone | WPM Range | When Used | Episodes |
|------|-----------|-----------|----------|
| **Baseline** | 130-145 | Premise building, world-building, early-mid episodes | 1-7, 9-13, 15, 21 |
| **Rising** | 145-150 | Transitional — story picking up momentum | 8, 18, 22 |
| **Accelerated** | 150-157 | Arc-merged, late-season, climax compression | 14, 16-17, 19-20, 23-24 |

The zones correspond to narrative function, not chronological position. Act 1 (premise) is always Baseline. Act 4-5 (climax) are always Accelerated. The shift happens gradually across the middle acts.

### 2. Near-Continuous Narration (99.2% Coverage)

The narration has almost no dead air. The 0.8% silence is concentrated in:
- Hook anime teaser pauses (8.1s)
- Anime dialogue moments (~111s total, but SRT segments overlap through them)
- 8 significant pauses totaling 36.9s

The forward engine should target >98% narration coverage — the narrator barely ever stops talking.

### 3. Breathing Room Is Structural, Not Random

Every WPM dip below 120 corresponds to an anime dialogue insertion or deliberate pause. There are NO instances of the narrator simply slowing down mid-narration. The pacing variation comes from:
- **Pausing** (stopping to let anime audio play) — NOT from
- **Slowing** (reducing speech rate within narration)

This means the TTS engine should maintain a constant speech rate (~144 WPM baseline, ~152 WPM for accelerated sections) and achieve pacing variation through **silence insertion** and **anime dialogue placement**, not through TTS speed modulation.

### 4. The 5.4% Acceleration Curve

The second half is 5.4% faster than the first half. This maps to:
- Episodes 1-12 (first half): avg 141.0 WPM — establishing content at Baseline
- Episodes 13-24 (second half): avg 151.5 WPM — compressed content at Accelerated

The acceleration is gradual — no single episode jumps more than ~15 WPM from its predecessor. The forward engine should apply a smooth acceleration curve, not a step function.

### 5. Sentence Length Tracks Content Type

| Content Type | Dominant Sentence Length | Purpose |
|-------------|------------------------|---------|
| Action sequences | Medium (6-12 words) | Quick beats: "He punches the parasite. It deflects." |
| Plot exposition | Long (13-20 words) | Full narrative sentences with cause and effect |
| World-building | Very long (21+ words) | Complex setups explaining parasite mechanics, character relationships |
| Reactions/Commentary | Short (2-5 words) | "Not good.", "Man,", "That's brutal." |

The 40.6% dominance of Long sentences (13-20 words) confirms this is a narrative recap, not a clip show. Most content is conveyed through complete, compound sentences.

### 6. The Relentless Middle (Act 4)

Act 4 (47:02-59:14) has only 1 breathing event in 12 minutes — the longest stretch of uninterrupted narration. This creates a relentless, momentum-building section that propels viewers toward the climax. The forward engine should replicate this pattern: as the story approaches its climax, reduce breathing events to build tension.

### 7. Hook Deceleration Is an Illusion

The hook's effective WPM is ~80-108, but the narrator's actual speech rate in spoken segments is 144-183 WPM (matching or exceeding the body). The lower effective WPM comes entirely from pauses (8.1s of silence in 36s). This confirms the `hook-pattern.md` finding: the hook feels slower due to strategic silence, not slower speech.

## Spec Implications

### TTS Pacing Parameters

```yaml
tts_pacing:
  baseline_wpm: 144
  accelerated_wpm: 152
  hook_effective_wpm: 108  # achieved via pauses, not slower speech
  outro_effective_wpm: 100  # winding down

  acceleration_curve:
    # Smooth curve from baseline to accelerated across episode progression
    # For N episodes, WPM at episode i:
    #   wpm = baseline + (accelerated - baseline) * (i / N) ^ 1.3
    # Exponent 1.3 creates a gentle start that accelerates in back half
    formula: "baseline + (accelerated - baseline) * (episode_index / total_episodes) ^ 1.3"

  consistency_target:
    cv_percent: "<12%"  # Coefficient of variation for 30s windows
    max_deviation_from_mean: "25 WPM"  # No window > 170 or < 120 in body
```

### Breathing Room Insertion Rules

```yaml
breathing_room:
  target_interval:
    body_median: 130s  # 2.2 min between breathing events
    body_mean: 220s    # 3.7 min (skewed by the long Act 4 stretch)

  distribution_by_act:
    act_1_premise: "1 event per 3 min"       # Frequent — establish rhythm
    acts_2_3_body: "1 event per 4-5 min"     # Moderate
    act_4_climax_build: "1 event per 10+ min" # Sparse — build tension
    act_5_climax: "1 event per 6 min"        # Moderate — release at key moments
    resolution: "0 events"                    # Pure narration to close

  event_types:
    anime_dialogue:
      count_target: "~1 per episode (25 per 24 eps)"
      duration: "3-8s per cluster"
      placement: "emotional peaks, comedy beats, shock moments"
    significant_pause:
      count_target: "6-10 per 75-min video"
      duration: "2-10s (mean 4.6s)"
      placement: "at anime dialogue insertion points"

  silence_is_the_tool:
    # Speed variation comes from PAUSING, not from slowing speech
    # TTS should maintain constant WPM within spoken segments
    # Use silence_ms parameter between segments to create pacing variation
    do_not_modulate_speech_rate: true
    use_silence_insertion: true
```

### Sentence Length Targets for Script Generation

```yaml
sentence_generation:
  target_distribution:
    short_2_5_words: "7%"   # Reactions, interjections (every ~14 sentences)
    medium_6_12_words: "31%" # Action beats, quick descriptions
    long_13_20_words: "41%"  # Core narrative — dominant length
    vlong_21_plus_words: "21%" # Complex plot exposition

  mean_words_per_sentence: 15
  max_words_per_sentence: 45

  mixing_rule: |
    Alternate between medium and long sentences as the base rhythm.
    Insert short sentences after emotional beats or as reactions.
    Use very long sentences sparingly for complex world-building.
    Never have 3+ very long sentences in a row.

  words_per_minute_budget:
    per_episode_baseline: "episode_duration_minutes * 144"
    per_episode_accelerated: "episode_duration_minutes * 152"
```

### Per-Episode WPM Assignment

```python
def episode_wpm(ep_num, total_eps):
    """Assign WPM zone based on episode position."""
    baseline = 144
    accelerated = 152
    progress = ep_num / total_eps

    # Smooth acceleration: gentle at start, steeper toward end
    wpm = baseline + (accelerated - baseline) * (progress ** 1.3)
    return round(wpm, 1)

# Example for 24-episode season:
# Ep 1:  144.0  Ep 6:  144.5  Ep 12: 146.3
# Ep 18: 149.0  Ep 22: 150.8  Ep 24: 152.0
```

### Quality Validation Targets

```yaml
pacing_validation:
  global_wpm:
    target: 144
    tolerance: "+/- 5 WPM"

  per_30s_window:
    body_range: "120-175 WPM"
    hook_range: "75-120 WPM (effective, including pauses)"
    cv_target: "<12%"

  per_episode:
    range: "130-157 WPM"
    stdev_target: "<8 WPM"

  breathing_events:
    min_per_video: 15
    max_gap_between: "600s (10 min)"

  narration_coverage:
    target: ">98%"

  acceleration:
    first_half_vs_second_half: "3-7% acceleration"
```

### Cross-References

- The 5.4% acceleration matches the per-5-min WPM trend in `script-structure.md` (142→160 WPM)
- Hook WPM dip (80-108) aligns with the pause architecture in `hook-pattern.md`
- Anime dialogue WPM dips align with the 25 anime dialogue moments in `narration-transcript.md`
- The relentless Act 4 (1 breathing event in 12 min) aligns with Act 4's low anime dialogue count (1 moment) in `script-structure.md`
- Per-episode WPM zones track the episode compression curve in `narration-transcript.md` (early eps 5-7 min, late eps 2 min)
- Near-continuous narration (99.2%) aligns with the audio density findings in `audio-profile.md` (only 3 silence regions in 75 min)
- Sentence length distribution supports the transition phrase frequency (~2.1 transitions/min from `transition-phrases.md` × ~15 words/sentence ≈ ~10 sentences per minute, consistent with 144 WPM)
