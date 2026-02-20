# Analysis Log

Tracks each iteration of the reverse ralph loop.

| Iteration | Timestamp | Aspect | Duration | New Aspects Discovered | Notes |
|-----------|-----------|--------|----------|----------------------|-------|
| 1 (dry run) | 2026-02-20 | transcription | ~2 min | 0 | Parsed existing SRT instead of running Whisper (no GPU). 1,636 segments, 10,916 narration words, 73.9 WPM. |
| 2 | 2026-02-20 | transcription | ~3 min | 0 | Finalized transcription analysis. Corrected WPM to 144.1 (was 73.9 from pre-dedup data). Added episode coverage map (24 eps, mean 3.1m/ep with compression curve), anime dialogue catalog (25 moments), pause analysis (8 pauses, avg 4.6s). No GPU → SRT fallback used. |
| 3 | 2026-02-20 | scene-detection | ~2 min | 0 | PySceneDetect at threshold 27. 2,171 scenes, 28.8 cuts/min, median 1.83s. 44% of shots in 1-2s range. |
| 4 | 2026-02-20 | audio-levels | ~8 min | 0 | Processed existing RMS data (97,248 frames) + ran ffmpeg loudnorm. -25.36 LUFS integrated, -2.90 dBTP true peak, 6.0 LU range. Hook 3-5 dB louder than body. Only 3 silence regions (2.23s total) in 75 min — near-continuous audio fill. U-shaped loudness arc: loud hook → quiet mid → moderate finale. |
| 5 | 2026-02-20 | audio-separation | ~20 min | 0 | Demucs htdemucs two-stem on 3x5-min CPU chunks (~6-8 min each). Three-layer audio: narration (-22 to -27 LUFS, LRA 3.6-4.1), music (-37 to -61 LUFS, LRA 6.9-25.3), anime dialogue (in vocals stem). Hook vocals 5 dB louder with dynamic music (25.3 LU range); body has subtle music pad (-65 to -68 dB RMS); end is narration-only. 97-99% narration density. Sidechain ducking spec: -20 to -30 dB reduction, 10-50ms attack, 200-500ms release. |
