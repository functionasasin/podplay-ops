# Scene Boundaries Analysis

## Summary

The 75.3-minute JarAnime Parasyte recap contains **2,171 visual scenes** detected at a content-change threshold of 27, yielding an average of **28.8 cuts per minute**. The median shot duration is **1.83 seconds** with a tight standard deviation of 1.09s, meaning the video maintains a remarkably consistent rapid-fire editing pace throughout. This is significantly faster than typical YouTube video editing (8-15 cuts/min) and even faster than most action movie editing (20-25 cuts/min).

## Data

### Core Statistics

| Metric | Value |
|--------|-------|
| Total scenes | 2,171 |
| Total duration | 4,516.0s (75.3 min) |
| Scenes per minute | 28.8 |
| Mean shot duration | 2.08s |
| Median shot duration | 1.83s |
| Min shot duration | 0.60s |
| Max shot duration | 10.80s |
| Standard deviation | 1.09s |

### Duration Percentiles

| Percentile | Duration |
|-----------|----------|
| P10 | ~0.9s |
| P25 | ~1.2s |
| P50 (median) | ~1.8s |
| P75 | ~2.7s |
| P90 | ~3.5s |
| P95 | ~4.0s |
| P99 | ~5.5s |

### Duration Distribution

| Bucket | Count | Percentage | Visual |
|--------|-------|-----------|--------|
| < 0.5s | 0 | 0.0% | |
| 0.5-1s | 251 | 11.6% | ##### |
| 1-2s | 956 | 44.0% | ###################### |
| 2-3s | 564 | 26.0% | ############# |
| 3-5s | 359 | 16.5% | ######## |
| 5-10s | 39 | 1.8% | # |
| 10-20s | 2 | 0.1% | |
| 20s+ | 0 | 0.0% | |

**Key finding**: 81.6% of all clips are between 0.5-3 seconds. The "sweet spot" for this format is 1-2 seconds (44% of all shots).

### Pacing Over Time (5-Minute Segments)

| Time Range | Scenes | Avg Duration | Cuts/Min |
|-----------|--------|-------------|----------|
| 0-5 min | 157 | 1.92s | 31.4 |
| 5-10 min | 140 | 2.15s | 28.0 |
| 10-15 min | 119 | 2.52s | 23.8 |
| 15-20 min | 134 | 2.23s | 26.8 |
| 20-25 min | 140 | 2.15s | 28.0 |
| 25-30 min | 154 | 1.95s | 30.8 |
| 30-35 min | 149 | 2.01s | 29.8 |
| 35-40 min | 153 | 1.96s | 30.6 |
| 40-45 min | 150 | 2.00s | 30.0 |
| 45-50 min | 138 | 2.17s | 27.6 |
| 50-55 min | 153 | 1.96s | 30.6 |
| 55-60 min | 136 | 2.20s | 27.2 |
| 60-65 min | 149 | 2.02s | 29.8 |
| 65-70 min | 150 | 2.00s | 30.0 |
| 70-75 min | 141 | 2.12s | 28.2 |

**Pacing consistency**: The cuts/min rate ranges from 23.8 to 31.4, a variance of only ~25%. The video maintains a remarkably steady editing rhythm, not dramatically accelerating for action sequences or slowing for emotional beats (at this 5-minute granularity).

The opening 5 minutes have the fastest pace (31.4 cuts/min) — the hook uses rapid editing to grab attention. The 10-15 minute segment is the slowest (23.8 cuts/min), suggesting early exposition/context-setting uses slightly longer shots.

### Notable Extreme Scenes

**Longest scenes (5+ seconds):**

| Scene # | Duration | Timecode | Notes |
|---------|---------|----------|-------|
| 1411 | 10.8s | 49:00-49:11 | Likely an anime dialogue pass-through moment or dramatic pause |
| 213 | 10.7s | 06:54-07:05 | Early in video — could be a sustained establishing shot or dialogue |
| 2101 | 9.5s | 72:46-72:56 | Near end — possible climactic moment held for impact |
| 519 | 7.2s | 18:54-19:01 | |
| 1694 | 7.2s | 58:53-58:60 | |
| 831 | 6.6s | 29:24-29:31 | |
| 785 | 6.5s | 27:48-27:54 | |

These exceptionally long scenes (for this format) likely correspond to anime dialogue pass-through moments where the original anime audio plays, or key dramatic beats where holding the shot creates emotional impact.

**Shortest scenes (< 0.7s):**
7 scenes at exactly 0.600s (18 frames at 30fps) — these are likely flash cuts or rapid montage moments during action sequences.

## Patterns

1. **Extremely consistent pacing**: Unlike many video formats where editing speed varies dramatically, this recap maintains near-constant ~28-31 cuts/min throughout. The forward engine should target this rate consistently.

2. **1-2 second sweet spot**: Nearly half (44%) of all shots fall in the 1-2s range. The engine should generate clips with a median duration of ~1.8s.

3. **Tight duration ceiling**: Only 2 shots exceed 10 seconds in the entire 75-minute video. Shots over 5 seconds are rare (< 2%). The engine should rarely, if ever, use clips longer than 5 seconds.

4. **No sub-0.5s shots**: The minimum is 0.6s (18 frames). Even the fastest cuts have a floor, preventing strobe-like effects that could cause viewer discomfort.

5. **Opening hook is fastest**: The first 5 minutes use the most rapid editing (31.4 cuts/min, avg 1.92s). This grabs attention and sets the kinetic energy of the format.

6. **Long shots are rare but intentional**: The ~40 shots over 5 seconds are likely anime dialogue moments (see `narration-transcript.md` for `>>` markers) where the original audio/scene plays through uninterrupted.

## Spec Implications

### For the Video Assembly stage:

- **Target cut rate**: 28-31 cuts per minute (configurable, default 29)
- **Shot duration distribution**: Generate from a distribution with:
  - Minimum: 0.6s (18 frames at 30fps)
  - Median: 1.8s
  - Mean: 2.0s
  - Max (normal): 5.0s
  - Max (dialogue pass-through): 10-12s
  - Standard deviation: ~1.1s
- **Distribution model**: Log-normal or gamma distribution centered at 1.8s with right tail to 5s
- **Pacing modulation**: Opening segment (first 5 min) should be 10-15% faster than body; otherwise maintain consistent pace
- **Flash cuts**: Allow minimum 0.6s shots (18 frames) during high-intensity moments, but never shorter

### For Scene Selection:

- Need to select approximately **2,100-2,200 clips** for a 75-minute recap
- At 30fps, each scene boundary should align to clean frame boundaries
- Content-change threshold of 27 in PySceneDetect produced reasonable results for anime content

### For Anime Dialogue Moments:

- Long scenes (5-10s) are rare and intentional — use these sparingly (< 2% of total scenes) for original anime audio pass-through
- Cross-reference with `narration-transcript.md` to identify where `>>` markers (anime dialogue) align with long scenes

### Detection Parameters for Forward Engine:

- Tool: PySceneDetect with `detect-content` method
- Threshold: 27 (tuned for anime visual style with its high-contrast scene changes)
- Output: Scene list CSV for downstream processing
