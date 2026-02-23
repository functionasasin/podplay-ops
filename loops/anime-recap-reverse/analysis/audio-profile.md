# Audio Profile Analysis

## Summary

The JarAnime Parasyte recap has an integrated loudness of **-25.36 LUFS** with a true peak of **-2.90 dBTP** and a loudness range of **6.00 LU**. The narrow LU range indicates remarkably consistent loudness throughout the 75-minute video — the audio is well-compressed for YouTube delivery. Per-minute RMS analysis reveals a subtle loudness arc: the opening 5 minutes are the loudest segment (-30.75 dB RMS), the middle 35-40 minutes are quietest (-36 to -37 dB RMS), and the final minutes return to moderate levels. Only 3 true silence regions were detected in the entire video, confirming near-continuous audio fill.

## Data

### EBU R128 Loudness (ffmpeg loudnorm)

| Metric | Value | Notes |
|--------|-------|-------|
| Integrated loudness | **-25.36 LUFS** | Above YouTube's -14 LUFS target; YouTube will normalize down ~11 dB |
| True peak | **-2.90 dBTP** | Close to 0; limited headroom |
| Loudness range (LRA) | **6.00 LU** | Very narrow — well-compressed audio |
| Threshold | -35.53 LUFS | Gate threshold for loudness calculation |
| Normalization type | Dynamic | ffmpeg applied dynamic normalization |
| Target offset | 1.33 dB | Small correction needed |

### Frame-Level RMS Statistics (97,248 frames at ~46ms intervals)

| Metric | Value |
|--------|-------|
| Total analysis frames | 97,248 |
| Non-silent frames (> -100 dB) | 97,214 (99.97%) |
| Duration | 4,516.1s (75.3 min) |
| Mean RMS | **-34.83 dB** |
| Median RMS | **-31.38 dB** |
| Standard deviation | 11.40 dB |
| Min RMS | -99.03 dB |
| Max RMS | -11.39 dB |
| P10 | -53.57 dB |
| P90 | -23.94 dB |

**Mean vs Median gap**: The 3.45 dB difference between mean (-34.83) and median (-31.38) indicates a left-skewed distribution — most of the audio sits at moderate-to-loud levels, with occasional quiet dips pulling the mean down.

### Per-Minute Loudness Trajectory

| Time | Minute | Avg RMS (dB) | Phase |
|------|--------|-------------|-------|
| 0:00-1:00 | 1 | -30.75 | **HOOK** — loudest minute |
| 1:00-2:00 | 2 | -29.55 | **HOOK** — peak loudness |
| 2:00-3:00 | 3 | -30.93 | Early episodes |
| 3:00-4:00 | 4 | -30.98 | Early episodes |
| 4:00-5:00 | 5 | -31.36 | Early episodes |
| 5:00-6:00 | 6 | -31.20 | Early episodes |
| 6:00-7:00 | 7 | -31.10 | Body |
| 7:00-8:00 | 8 | -32.84 | Body — settling |
| 8:00-9:00 | 9 | -33.62 | Body |
| 9:00-10:00 | 10 | -33.08 | Body |
| 10:00-11:00 | 11 | -35.36 | Body — quieter dip |
| 11:00-12:00 | 12 | -33.99 | Body |
| 12:00-13:00 | 13 | -34.71 | Body |
| 13:00-14:00 | 14 | -35.91 | Body |
| 14:00-15:00 | 15 | -34.29 | Body |
| 15:00-17:00 | 16-17 | -33.88 to -34.02 | Body — stable |
| 17:00-20:00 | 18-20 | -33.31 to -34.03 | Body |
| 20:00-23:00 | 21-23 | -33.76 to -35.63 | Body |
| 23:00-25:00 | 24-25 | -33.13 to -35.59 | Body |
| 25:00-30:00 | 26-30 | -34.60 to -36.13 | **MID-QUIETER** |
| 30:00-35:00 | 31-35 | -35.44 to -36.06 | **MID-QUIETER** |
| 35:00-38:00 | 36-38 | -36.45 to -37.26 | **QUIETEST PHASE** |
| 38:00-40:00 | 39-40 | -34.48 to -35.70 | Recovery |
| 40:00-45:00 | 41-45 | -35.86 to -36.98 | Quiet mid-section |
| 45:00-50:00 | 46-50 | -33.16 to -34.94 | **CLIMAX BUILD** — getting louder |
| 50:00-55:00 | 51-55 | -34.67 to -36.59 | Mixed |
| 55:00-60:00 | 56-60 | -34.72 to -36.22 | Mixed |
| 60:00-65:00 | 61-65 | -34.15 to -35.46 | Moderate |
| 65:00-70:00 | 66-70 | -35.20 to -37.08 | Moderate |
| 70:00-75:00 | 71-75 | -33.67 to -36.36 | **FINALE** — moderate, ending louder |

### Loudness Phases (Macro View)

| Phase | Time Range | Avg RMS Range | Description |
|-------|-----------|---------------|-------------|
| **Hook** | 0:00-6:00 | -29.55 to -31.36 | Loudest section — energetic opening |
| **Early Body** | 6:00-20:00 | -31.10 to -35.91 | Gradual loudness decrease as narration settles |
| **Mid-Quiet** | 20:00-40:00 | -33.13 to -37.26 | Quietest sustained section |
| **Late Body** | 40:00-65:00 | -33.16 to -36.98 | Mixed — oscillates between quiet and moderate |
| **Finale** | 65:00-75:00 | -33.67 to -37.08 | Moderate — ends on louder note (33.67) |

### Dynamic Range Per 5-Minute Segment

| Segment | Dynamic Range | Max dB | Min dB |
|---------|--------------|--------|--------|
| 0-5 min | 77.93 dB | -11.39 | -89.32 |
| 5-10 min | 81.98 dB | -12.65 | -94.63 |
| 10-15 min | 83.33 dB | -13.25 | -96.58 |
| 15-20 min | 82.71 dB | -15.44 | -98.15 |
| 20-25 min | 77.52 dB | -16.33 | -93.85 |
| 25-30 min | 81.79 dB | -16.58 | -98.37 |
| 30-35 min | 85.98 dB | -12.52 | -98.49 |
| 35-40 min | 79.00 dB | -16.93 | -95.93 |
| 40-45 min | 77.33 dB | -17.39 | -94.72 |
| 45-50 min | 78.92 dB | -17.20 | -96.12 |
| **50-55 min** | **54.70 dB** | **-15.33** | **-70.04** |
| 55-60 min | 77.19 dB | -17.52 | -94.71 |
| 60-65 min | 77.24 dB | -16.42 | -93.66 |
| 65-70 min | 81.41 dB | -17.33 | -98.74 |
| 70-75 min | 81.44 dB | -17.59 | -99.03 |

**Notable**: The 50-55 min segment has the smallest dynamic range (54.70 dB) and the highest minimum level (-70.04 dB), meaning this segment has the least quiet moments. This coincides with episodes 13-17 (the arc-merged section), likely featuring more continuous narration with less anime dialogue interruption.

### Silence Regions (threshold < -60 dB, min 0.5s)

Only **3 silence regions** detected in the entire video:

| Start | End | Duration | Context |
|-------|-----|----------|---------|
| 39:37 | 39:38 | 1.11s | Ep 10 — aligns with "Shinn, calm down" anime dialogue moment (see `narration-transcript.md`) |
| 66:04 | 66:05 | 0.56s | Ep 22 — near climactic anime dialogue cluster |
| 74:48 | 74:49 | 0.56s | Near video end — likely editing artifact or final beat |

The near-absence of silence confirms that the audio is a continuous, densely-packed mix of narration + background music + occasional anime audio, with virtually no dead air.

## Patterns

1. **Integrated loudness (-25.36 LUFS) is hot for YouTube**: YouTube targets -14 LUFS for normalization. The reference video is mixed ~11 dB louder than YouTube's target. After YouTube normalization, the effective loudness would be around -14 LUFS with true peak at about -14 dBTP. The forward engine should target **-14 to -16 LUFS** directly to avoid YouTube's normalization artifacts.

2. **Extremely narrow loudness range (6.0 LU)**: For reference, music typically has LRA of 5-12 LU, podcasts 5-8 LU, and movies 15-25 LU. This video's 6.0 LU is at the compressed end — consistent with heavy audio compression/limiting typical of YouTube content creators. The narration, music, and anime audio are all compressed into a narrow loudness band.

3. **The hook is 3-5 dB louder than body**: Minutes 1-2 average -30.15 dB RMS vs the body average of ~-35 dB. This ~5 dB boost makes the opening noticeably more energetic/punchy — grabbing attention before settling into a more sustainable listening level.

4. **U-shaped loudness arc**: Opening loud → gradual quiet → stabilize → ending moderate. This follows a classic engagement pattern: hook hard, settle for sustained listening, maintain moderate energy through finale.

5. **Near-zero true silence**: Only 3 detectable silence regions (total 2.23 seconds) across 75 minutes. The background music bed fills virtually all space between narration segments. This is a hallmark of the format — continuous audio presence maintains viewer engagement.

6. **Dynamic range is consistent (~78-82 dB) per segment**: Every 5-minute segment has similar dynamic range except 50-55 min (54.7 dB). The consistent dynamic range suggests a uniform mixing approach applied throughout, not segment-by-segment processing.

7. **Peak levels cluster around -12 to -17 dB**: The loudest moments in each 5-minute segment never exceed -11.39 dB (opening), and settle to -15 to -17 dB for the body. The opening has the hottest peaks — likely from the hook's anime clip and energetic narration.

## Spec Implications

### Audio Mixing Pipeline

- **Target integrated loudness**: -14 LUFS (YouTube standard) or -16 LUFS (conservative, avoids normalization clipping)
- **Target true peak**: -1.0 dBTP (industry standard for streaming)
- **Target loudness range**: 5-7 LU (match reference's compressed style)
- **Apply dynamic compression**: The reference uses heavy compression. The forward engine needs a limiter/compressor stage with:
  - Ratio: ~4:1 to 8:1
  - Attack: 5-10ms (fast enough to catch transients)
  - Release: 50-100ms
  - Threshold: Set to achieve target LRA

### Audio Layer Levels

Based on the reference's consistent ~-35 dB mean RMS with narration driving loudness:

- **Narration (primary)**: -12 to -16 dB peak, targeting -18 to -22 dB RMS
- **Background music**: Duck under narration by approximately 15-20 dB. Music RMS target: -35 to -40 dB when narration is active, -25 to -30 dB during anime dialogue moments
- **Anime dialogue**: Boost to narration level (-12 to -16 dB peak) during pass-through moments

### Loudness Automation (Per-Section)

| Section | Loudness Boost | Duration | Purpose |
|---------|---------------|----------|---------|
| Hook | +3 to +5 dB | First 2-5 minutes | Attention grab |
| Body | 0 dB (baseline) | 5 min to -5 min | Sustained listening |
| Climactic moments | +1 to +2 dB | Spot moments | Emphasis |
| Outro | 0 dB | Final 1-2 min | Natural close |

### Silence/Gap Management

- **Target gap duration**: < 0.5 seconds between narration segments
- **Background music must always fill gaps**: The reference has essentially zero silence
- **Anime dialogue moments**: Brief 0.5-1s gap allowed before/after anime audio, filled by music swell

### FFmpeg Processing Commands for Forward Engine

```bash
# Measure loudness of mixed output
ffmpeg -i output.mp4 -af loudnorm=print_format=json -f null - 2>&1

# Normalize to YouTube target (-14 LUFS)
ffmpeg -i output.mp4 -af loudnorm=I=-14:TP=-1.0:LRA=6:print_format=json output_normalized.mp4

# Two-pass loudnorm for best quality
# Pass 1: measure
ffmpeg -i output.mp4 -af loudnorm=I=-14:TP=-1.0:LRA=6:print_format=json -f null - 2>&1
# Pass 2: apply with measured values
ffmpeg -i output.mp4 -af loudnorm=I=-14:TP=-1.0:LRA=6:measured_I=-25.36:measured_TP=-2.90:measured_LRA=6.0:measured_thresh=-35.53:offset=1.33:linear=true output_normalized.mp4
```

### Cross-References

- The 3 silence regions at 39:37, 66:04, and 74:48 correlate with anime dialogue moments documented in `narration-transcript.md` (see "Shinn, calm down" at 39:41 and ep 22 dialogue cluster at 68:07-68:14)
- The hook's loudness boost (minutes 1-2) aligns with the fastest visual editing pace (31.4 cuts/min) documented in `scene-boundaries.md`
- The quietest audio phase (35-40 min) occurs during episodes 10-11, which are medium-length episodes in the middle of the compression curve
