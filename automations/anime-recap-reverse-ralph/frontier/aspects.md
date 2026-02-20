# Analysis Frontier

## Statistics
- Total aspects discovered: 15
- Analyzed: 9
- Pending: 6
- Convergence: 60.0%

## Pending Aspects (ordered by dependency)

### Wave 1: Raw Data Extraction (tools required)
- [x] transcription — Run Whisper on reference video narration; output word-level timestamps to raw/transcription.json and summary to analysis/narration-transcript.md
- [x] scene-detection — Run PySceneDetect on reference video; output scene boundaries to raw/scenes.json and summary to analysis/scene-boundaries.md
- [x] audio-levels — Run ffmpeg loudness analysis on reference video; output volume envelope to raw/audio-levels.json and summary to analysis/audio-profile.md
- [x] audio-separation — Run Demucs on reference audio; output separated stems to raw/separated/ and summary to analysis/audio-layers.md

### Wave 2: Pattern Analysis (LLM reasoning over raw data)
- [x] script-structure — Read transcript and identify sections (hook, context, arcs, climax, outro) with timestamps
- [x] hook-pattern — Analyze the opening 60 seconds: rhetorical devices, pacing, what makes it engaging
- [x] transition-phrases — Catalog all recurring connector/transition language with timestamps from transcript
- [x] pacing-metrics — Calculate WPM, pause timing, segment durations, breathing room patterns from transcription.json
- [x] scene-type-distribution — Classify scenes by type (action/dialogue/reaction/emotional/establishing) using scenes.json + transcript
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
- script-structure — 8-part macro structure: Hook (0.8%) → 5 narrative acts (94.8%) → Resolution (3.6%) → Outro (0.6%). Acts follow source anime's plot arc, not episode-sequential. 83% explicit episode markers, 17% arc-merged. 96% pure recap, 4% narrator commentary. WPM steady at 142-160 across body. 100% anime footage visuals. Full analysis at analysis/script-structure.md.
- hook-pattern — 4-beat structure (36s): Rhetorical Q (17.5s, 24 cuts/min) → Anime Teaser (11.4s, 31.6 cuts/min, 2 clips) → Narrator Reaction (5s, loudest moment at -26.1 dB) → Transition (2.3s). Effective WPM ~108 (25% slower than body due to 8.1s strategic pauses). Audio energy arc: moderate → dip (anime) → SPIKE (+5 dB) → settle. Visual rhythm: slow → fast → hold → burst. Contrast is core mechanism. Full analysis at analysis/hook-pattern.md.
- transition-phrases — 10 categories, ~160+ transition phrases cataloged. Dominant: "So," (25x, 0.33/min), "Unfortunately/Fortunately" (21x, 2:1 ratio), "Meanwhile" (9x, 1 per 8min), "Anyway/Anyways" (10x, narrator personality reset). Two episode boundary templates: Template A ("The Nth episode opens with...") for early eps, Template B ("In the Nth episode...") for later eps. Low formality register — 0 uses of "However/Nevertheless/Furthermore". "So-But-Unfortunately" micro-cycle engine drives narrative momentum. Full analysis at analysis/transition-phrases.md.
- pacing-metrics — Three-zone pacing model: Baseline (130-145 WPM, eps 1-13), Rising (145-150, transitional), Accelerated (150-157, eps 14-24). Global 144.6 WPM, CV 10.8%, 5.4% acceleration 1st→2nd half. Near-continuous narration (99.2% coverage). Breathing events every 2.2 min median (19 total: 8 pauses + 11 anime dialogue clusters). WPM variation comes from silence insertion, NOT speech rate changes. Sentences avg 15.2 words, 41% in 13-20 word range. Act 4 has longest uninterrupted stretch (12 min, 1 event). Full analysis at analysis/pacing-metrics.md.
- scene-type-distribution — 7-type visual taxonomy: CCU 31%, ACT 24%, DLG 15%, EST 13%, OBJ 7%, RXN 7%, FLS 3%. Duration is strongest type signal (sub-1s=action flash, 1-3s=standard, 5s+=anime dialogue holds). 85/8/4/1 functional rule: 85% narration illustration, 8% visual punctuation, 4% structural transitions, 1% anime dialogue pass-throughs. Anime dialogue has two modes: Held (30%, single 5-10s clip) and Woven (70%, standard editing continues). Flash cuts cluster in 2nd half. Narrator commentary has zero visual impact. Full analysis at analysis/scene-type-distribution.md.

## Discovered Aspects
(none yet — new aspects discovered during analysis will be added here then moved to Pending)
