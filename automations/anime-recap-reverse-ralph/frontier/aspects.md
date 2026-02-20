# Analysis Frontier

## Statistics
- Total aspects discovered: 15
- Analyzed: 4
- Pending: 11
- Convergence: 26.7%

## Pending Aspects (ordered by dependency)

### Wave 1: Raw Data Extraction (tools required)
- [x] transcription — Run Whisper on reference video narration; output word-level timestamps to raw/transcription.json and summary to analysis/narration-transcript.md
- [x] scene-detection — Run PySceneDetect on reference video; output scene boundaries to raw/scenes.json and summary to analysis/scene-boundaries.md
- [x] audio-levels — Run ffmpeg loudness analysis on reference video; output volume envelope to raw/audio-levels.json and summary to analysis/audio-profile.md
- [x] audio-separation — Run Demucs on reference audio; output separated stems to raw/separated/ and summary to analysis/audio-layers.md

### Wave 2: Pattern Analysis (LLM reasoning over raw data)
- [ ] script-structure — Read transcript and identify sections (hook, context, arcs, climax, outro) with timestamps
- [ ] hook-pattern — Analyze the opening 60 seconds: rhetorical devices, pacing, what makes it engaging
- [ ] transition-phrases — Catalog all recurring connector/transition language with timestamps from transcript
- [ ] pacing-metrics — Calculate WPM, pause timing, segment durations, breathing room patterns from transcription.json
- [ ] scene-type-distribution — Classify scenes by type (action/dialogue/reaction/emotional/establishing) using scenes.json + transcript
- [ ] clip-duration-stats — Calculate statistical distribution of visual clip durations from scenes.json
- [ ] anime-dialogue-moments — Identify all moments where anime audio plays through (>> markers in transcript), analyze criteria for selection
- [ ] narration-style — Analyze narrator tone, personality, pop culture references, commentary-vs-recap ratio, viewer address patterns
- [ ] music-patterns — Analyze music energy mapping to content type, ducking curves, genre/mood using audio analysis data

### Wave 3: Synthesis
- [ ] spec-draft — Read ALL analysis/ files and synthesize into complete software spec at docs/plans/anime-recap-engine-spec.md
- [ ] spec-review — Review generated spec for completeness: can a developer build the entire forward engine from this spec alone?

## Recently Analyzed
- transcription — Parsed SRT with overlap de-duplication into raw/transcription.json. 1,636 segments, 10,759 narration words, 144.1 WPM, 25 anime dialogue moments, 24 episode markers, 8 significant pauses. Full analysis at analysis/narration-transcript.md.
- scene-detection — PySceneDetect at threshold 27. 2,171 scenes, 28.8 cuts/min, median 1.83s shots, stdev 1.09s. Full analysis at analysis/scene-boundaries.md.
- audio-levels — EBU R128 loudnorm + frame-level RMS analysis. -25.36 LUFS integrated, -2.90 dBTP peak, 6.0 LU range (very compressed). Hook is 3-5 dB louder than body. Only 3 silence regions in 75 min. Full analysis at analysis/audio-profile.md.
- audio-separation — Demucs htdemucs two-stem separation on 3x5-min samples. Three-layer architecture: narration (-22 to -27 LUFS, 97-99% coverage), music (-37 to -61 LUFS, sidechain ducked), anime dialogue (pass-through in vocals stem). Hook has 14.4 dB vocal-music gap with dynamic music swells; body has 9.6 dB gap with subtle pad; end has 34 dB gap (music nearly absent). Full analysis at analysis/audio-layers.md.

## Discovered Aspects
(none yet — new aspects discovered during analysis will be added here then moved to Pending)
