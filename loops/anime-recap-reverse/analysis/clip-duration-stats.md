# Clip Duration Statistics

## Summary

The 2,171 clip durations follow a **log-normal distribution** with parameters mu=0.607 and sigma=0.502, yielding a median of 1.83s and mean of 2.08s. This is an exceptionally good fit — predicted percentiles match actuals within 0.1-7.7% across the entire range. The distribution is right-skewed (skewness 1.57) with a heavy tail (excess kurtosis 5.37), meaning most clips cluster between 1-3s with rare but intentional outliers up to 10.8s. Consecutive clip durations are nearly independent (autocorrelation 0.13 at lag-1, dropping to ~0 by lag-10), so the forward engine can sample independently from the log-normal rather than modeling sequential dependencies.

## Data

### Core Descriptive Statistics

| Metric | Value |
|--------|-------|
| N (total clips) | 2,171 |
| Mean | 2.080s |
| Median | 1.833s |
| Mode range | 1.0-1.2s (234 clips, highest 0.2s bin) |
| Min | 0.600s (18 frames) |
| Max | 10.800s (324 frames) |
| Range | 10.200s |
| Std Dev | 1.092s |
| CV (coefficient of variation) | 52.5% |
| Skewness | 1.573 (moderate right-skew) |
| Excess Kurtosis | 5.372 (heavy-tailed) |
| Mean/Median ratio | 1.135 (confirms right-skew) |

### Percentile Table (Full)

| Percentile | Duration | Interpretation |
|-----------|----------|---------------|
| P1 | 0.633s | Absolute floor — flash cuts |
| P5 | 0.767s | Fastest 5% — action flash cuts |
| P10 | 0.933s | Short action/reaction clips |
| P25 (Q1) | 1.300s | Bottom of "normal" range |
| P50 (median) | 1.833s | **Central tendency** — the "typical" clip |
| P75 (Q3) | 2.650s | Top of "normal" range |
| P90 | 3.500s | Extended beats — emphasis or transitions |
| P95 | 4.017s | Long clips — significant moments |
| P99 | 5.477s | Very long — anime dialogue or dramatic holds |
| P99.5 | 5.900s | Extreme — only 10 clips longer |

**Key insight**: The middle 50% of clips (IQR) spans only 1.300s to 2.650s — a 1.35s window. This is the "comfort zone" of the format.

### Distribution by 0.5s Bins (with cumulative %)

| Bin | Count | % | Cumulative % | Visual |
|-----|-------|---|-------------|--------|
| 0.5-1.0s | 251 | 11.6% | 11.6% | ########### |
| 1.0-1.5s | 501 | 23.1% | 34.6% | **####################### (peak)** |
| 1.5-2.0s | 455 | 21.0% | 55.6% | #################### |
| 2.0-2.5s | 335 | 15.4% | 71.0% | ############### |
| 2.5-3.0s | 229 | 10.5% | 81.6% | ########## |
| 3.0-3.5s | 176 | 8.1% | 89.7% | ######## |
| 3.5-4.0s | 109 | 5.0% | 94.7% | ##### |
| 4.0-4.5s | 42 | 1.9% | 96.6% | ## |
| 4.5-5.0s | 32 | 1.5% | 98.1% | # |
| 5.0+ | 41 | 1.9% | 100.0% | # |

**Rule of thumb**: 55.6% of clips are under 2s. 81.6% are under 3s. 98.1% are under 5s.

### Log-Normal Distribution Fit

The log-normal is an excellent generative model for clip durations:

| Parameter | Value |
|-----------|-------|
| mu (ln mean) | 0.6070 |
| sigma (ln stdev) | 0.5021 |
| ln(duration) skewness | 0.024 (near-zero — perfect symmetry in log space) |
| ln(duration) kurtosis | -0.463 (slightly platykurtic — lighter tails than Gaussian in log space) |
| Predicted median (e^mu) | 1.835s (actual: 1.833s, error: 0.1%) |
| Predicted mean (e^(mu+σ²/2)) | 2.082s (actual: 2.080s, error: 0.1%) |

**Predicted vs Actual Percentile Comparison**:

| Percentile | Actual | Predicted | Error |
|-----------|--------|-----------|-------|
| P5 | 0.767s | 0.803s | 4.7% |
| P10 | 0.933s | 0.964s | 3.3% |
| P25 | 1.300s | 1.308s | 0.6% |
| P50 | 1.833s | 1.835s | 0.1% |
| P75 | 2.650s | 2.574s | 2.9% |
| P90 | 3.500s | 3.493s | 0.2% |
| P95 | 4.017s | 4.191s | 4.4% |
| P99 | 5.477s | 5.900s | 7.7% |

The fit is within 5% for P5-P95, degrading slightly at extremes. The actual distribution has a slightly thinner right tail than pure log-normal predicts (actual P99 = 5.5s vs predicted 5.9s), consistent with an editor who avoids very long clips.

### IQR Outlier Analysis

| Metric | Value |
|--------|-------|
| Q1 | 1.300s |
| Q3 | 2.650s |
| IQR | 1.350s |
| Upper fence (Q3 + 1.5×IQR) | 4.675s |
| Lower fence | -0.725s (no lower outliers possible) |
| Outlier count | 58 clips (2.7%) |
| Outlier range | 4.700s to 10.800s |

These 58 outlier clips (>4.675s) are **intentional** — they correspond to:
- Anime dialogue pass-throughs (held shots during original audio)
- Emotional dramatic holds (death scenes, transformations)
- Structural boundaries (act/episode transitions)

Top outliers:
| Scene | Duration | Timestamp | Likely Purpose |
|-------|----------|-----------|---------------|
| #1411 | 10.800s | 49:00 | Kana's death emotional hold |
| #213 | 10.733s | 06:54 | Episode 1→2 transition |
| #2101 | 9.500s | 72:46 | Climactic resolution |
| #519 | 7.233s | 18:54 | Mother discovery |
| #1694 | 7.200s | 58:53 | Act 4→5 boundary |

### Temporal Trends (Video Quarters)

| Quarter | N | Mean | Median | Stdev | <1s clips | >5s clips |
|---------|---|------|--------|-------|-----------|-----------|
| Q1 (0-18.8m) | 516 | 2.189s | 1.900s | 1.196s | 52 (10.1%) | 16 (3.1%) |
| Q2 (18.8-37.6m) | 562 | 2.014s | 1.867s | 0.997s | 63 (11.2%) | 8 (1.4%) |
| Q3 (37.6-56.4m) | 548 | 2.058s | 1.833s | 1.046s | 54 (9.9%) | 6 (1.1%) |
| Q4 (56.4-75.3m) | 545 | 2.068s | 1.800s | 1.124s | 82 (15.0%) | 7 (1.3%) |

**Key findings**:
1. Q1 has the most >5s clips (16 vs 6-8 elsewhere) — early establishing shots and transitions
2. Q4 has 50% more sub-1s clips (15.0% vs ~10%) — flash cut acceleration in the climax
3. Mean and median are remarkably stable across quarters (2.01-2.19s mean, 1.80-1.90s median)
4. The format's pacing consistency is structural, not just a statistical average

### Clips-Per-Minute at 1-Minute Resolution

| Metric | Value |
|--------|-------|
| Mean CPM | 28.8 |
| Stdev CPM | 3.7 |
| CV (CPM) | 12.9% |
| Min CPM | 18 (minute 72 — near-end resolution) |
| Max CPM | 38 (minute 25 — peak action) |

**Notable anomalies** (>1.5σ from mean):

| Minute | CPM | Direction | Likely Cause |
|--------|-----|-----------|--------------|
| 2 | 35 | HIGH | Hook — rapid editing for attention |
| 4 | 35 | HIGH | Hook/early episode 1 action |
| 7 | 22 | LOW | Ep 1→2 transition (10.7s held shot at 6:54) |
| 10 | 22 | LOW | Ep 3 dialogue zone |
| 12 | 23 | LOW | Early exposition |
| 18 | 20 | LOW | Ep 5 mother arc (7.2s held shot) |
| 25 | 38 | HIGH | Peak combat — most cuts in entire video |
| 36 | 37 | HIGH | Transformation arc action |
| 56 | 23 | LOW | Act boundary, establishing shots |
| 68 | 35 | HIGH | Final battle acceleration |
| 72 | 18 | LOW | Resolution/denouement — slowest in video |

**Pattern**: LOW CPM minutes always correspond to held emotional/dialogue shots (>5s) or structural transitions. HIGH CPM minutes correspond to action sequences. The forward engine should modulate CPM based on narration content type.

### Autocorrelation Analysis

| Lag | Correlation | Interpretation |
|-----|-------------|---------------|
| 1 | 0.131 | Very weak positive — slight tendency for similar clips near each other |
| 2 | 0.065 | Negligible |
| 3 | 0.058 | Negligible |
| 5 | 0.055 | Negligible |
| 10 | 0.001 | Zero — fully independent |

**Conclusion**: Clip durations are essentially independent. The lag-1 correlation of 0.131 is statistically non-zero but practically negligible. This means the forward engine can sample clip durations independently from the log-normal distribution without needing a sequential model (no HMM, no Markov chain).

### Adjacent Clip Duration Differences

| Metric | Value |
|--------|-------|
| Mean absolute difference | 1.061s |
| Median absolute difference | 0.800s |
| Within ±0.25s | 17.6% |
| Within ±0.50s | 35.0% |
| Within ±1.00s | 58.9% |
| Within ±1.50s | 74.6% |
| Within ±2.00s | 86.4% |

Most consecutive clips differ by about 0.8s — enough variety to avoid monotony, but not jarring. The editor naturally varies clip length without dramatic jumps.

### Frame-Level Analysis (30fps)

- 156 unique frame counts across 2,171 clips
- No dominant "magic number" — clips are cut at content boundaries, not fixed intervals
- Most common single frame count: 35 frames (1.17s) with only 52 clips (2.4%)
- The top 20 frame counts span 26-60 frames (0.87-2.00s), each at 1.4-2.4%
- This confirms content-driven editing, not rhythmic/metronomic cutting

## Patterns

### 1. Log-Normal Is the Generative Model

The log-normal distribution with mu=0.607, sigma=0.502 reproduces the actual distribution within 5% at all standard percentiles. This is the single most important finding — it means clip duration generation requires just two parameters, not a lookup table or complex model.

### 2. The 1-3s Comfort Zone

55.6% of clips fall in 1.0-2.0s, and 81.6% fall in 0.5-3.0s. The format lives in this zone. Clips shorter than 1s or longer than 3s serve specific functions (flash cuts and holds, respectively) — they're the spice, not the meal.

### 3. Independence Simplifies Generation

With autocorrelation effectively zero by lag-2, the engine can draw each clip duration independently. No need to track "what the last clip was" to decide the next clip's length. The only modifier needed is the content-type adjustment (action clips shorter, dialogue clips longer).

### 4. Flash Cut Acceleration Is Real and Quantifiable

Sub-1s clips increase from 10.1% (Q1) to 15.0% (Q4) — a 49% increase. This matches the WPM acceleration (144→157) and pacing zone model from `pacing-metrics.md`. The forward engine should scale flash cut probability linearly across the video.

### 5. Outliers Are Functional, Not Noise

Every clip >4.675s serves a narrative purpose (anime dialogue, emotional hold, or structural transition). The engine should NOT generate random long clips — it should only produce them when the script explicitly calls for anime dialogue pass-through or dramatic hold.

### 6. CPM Stability Is a Format Signature

At 12.9% CV, the clips-per-minute rate is remarkably stable across the full 75 minutes. The format achieves consistent visual energy regardless of content type. Even LOW CPM minutes (18-23) are still faster than typical YouTube editing. This consistency should be a hard constraint in the forward engine.

### 7. No Rhythmic Editing

The 156 unique frame counts and flat frame-count distribution prove the editor cuts at content boundaries, not on a beat. The forward engine should NOT quantize clips to musical beats or fixed intervals.

## Spec Implications

### Clip Duration Generation

```yaml
clip_duration_generator:
  distribution: log-normal
  parameters:
    mu: 0.6070      # ln(duration) mean
    sigma: 0.5021   # ln(duration) stdev
  constraints:
    floor: 0.600    # 18 frames at 30fps — never shorter
    ceiling_normal: 4.675  # IQR upper fence — normal clips never longer
    ceiling_anime_dialogue: 10.0  # Held shots for anime dialogue only
    ceiling_dramatic_hold: 10.0   # Emotional peaks only

  # Pseudocode for generating one clip duration:
  # d = clip(exp(normal(mu, sigma)), floor, ceiling_normal)
  # if scene_type == "anime_dialogue_held": d = uniform(5.0, 10.0)
  # if scene_type == "dramatic_hold": d = uniform(5.0, 8.0)
  # if scene_type == "flash_cut": d = uniform(0.6, 1.0)
```

### Content-Type Duration Modifiers

```yaml
duration_modifiers:
  # Apply as multiplier to base log-normal sample
  action_combat: 0.85      # Shorter clips, more energy
  flash_impact: 0.50       # Minimum-range clips only
  character_closeup: 1.00  # Baseline — no modification
  dialogue_interaction: 1.10  # Slightly longer for conversation
  establishing_wide: 1.20  # Longer for scene-setting
  reaction_shot: 0.75      # Brief emotional beats
  anime_dialogue_held: null  # Override: 5-10s fixed
  anime_dialogue_woven: 1.00  # Standard duration, no hold
```

### Flash Cut Acceleration Curve

```yaml
flash_cut_probability:
  # Percentage of clips in each quarter that should be flash cuts (<1s)
  q1_first_quarter: 0.10   # 10.1% observed
  q2_second_quarter: 0.11  # 11.2% observed
  q3_third_quarter: 0.10   # 9.9% observed
  q4_fourth_quarter: 0.15  # 15.0% observed
  # Simplified linear model:
  # flash_pct = 0.10 + 0.05 * (position / total_duration)
```

### CPM Guardrails

```yaml
cpm_constraints:
  target_mean: 28.8
  target_stdev: 3.7
  hard_floor: 18      # Never below (minute 72 was lowest)
  hard_ceiling: 38     # Never above (minute 25 was highest)
  soft_range: [25, 33] # 1σ band — 68% of minutes should fall here

  # Per-minute validation:
  # After generating all clips for a minute, check CPM
  # If outside soft_range, redistribute clip durations
  # If outside hard_floor/hard_ceiling, regenerate
```

### Outlier Allocation Budget

```yaml
outlier_budget:
  # Per 75-minute video:
  total_clips_over_5s: 37    # 1.7% of 2,171 — the intentional long clips
  total_clips_over_8s: 3     # Only the most dramatic moments
  total_clips_over_10s: 2    # Maximum 2 per video

  # Allocation by purpose:
  anime_dialogue_held: 8-12  # ~30% of anime dialogue moments × 25 moments ≈ 8
  dramatic_holds: 10-15      # Emotional peaks, deaths, transformations
  structural_transitions: 8-10  # Episode/act boundaries

  # These should be planned from the script, not randomly generated
```

### Frame Alignment

```yaml
frame_alignment:
  fps: 30
  min_frames: 18     # 0.600s — hard minimum
  frame_quantize: true  # All durations must be multiples of 1/30s (0.0333s)
  # After generating log-normal duration, round to nearest frame boundary:
  # frames = max(18, round(duration * 30))
  # duration = frames / 30
```

## Cross-References

- Scene boundaries from `scene-boundaries.md`: The raw data source. Our fine-grained analysis confirms and extends their bucket distributions.
- Scene type from `scene-type-distribution.md`: Duration is the strongest type predictor. Sub-1s → action, 1-3s → workhorse, 5s+ → intentional.
- Pacing from `pacing-metrics.md`: Three-zone WPM model (baseline/rising/accelerated) parallels the flash-cut acceleration curve. Both accelerate in the same direction.
- Hook from `hook-pattern.md`: The hook's 31.4 cpm matches Q1's higher mean (2.19s) — more establishing shots are offset by rapid hook editing.
- Audio layers from `audio-layers.md`: The 14.4 dB vocal-music gap in the hook supports faster editing (cuts can happen on any frame without audio discontinuity).
- Script structure from `script-structure.md`: The 83% explicit episode markers create natural transition points where 5s+ establishing shots appear.
