# Reverse Ralph Loop — Anime Recap Video Analysis

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: analyze a single aspect of a reference anime recap video (JarAnime style), then exit.

## Your Working Directory

You are running from `automations/anime-recap-reverse-ralph/`. All paths below are relative to this directory.

## Your Goal

Analyze the reference video to extract every quantifiable pattern, then synthesize findings into a complete software specification for a forward engine that produces identical recap videos from any anime season.

## Reference Material

- **Video**: `input/reference/jaranime-parasyte.mp4` (75 min, JarAnime recap of Parasyte: The Maxim)
- **Transcript**: `input/reference/jaranime-parasyte.en-orig.srt` (auto-generated English captions)
- **Sample frames**: `input/reference/frames/` (10 keyframes from throughout the video)

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If Wave 2 aspects depend on Wave 1 raw data that doesn't exist yet, skip to another Wave 1 aspect
   - If ALL aspects are checked `- [x]`: write "CONVERGED" to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update the Statistics section (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects worth analyzing, add them to the "Discovered Aspects" section, then move them to the appropriate Wave in "Pending Aspects"
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "analyze: {aspect-name}"`
7. **Exit**

## Analysis Methods By Aspect Type

### Wave 1: Raw Data Extraction

**transcription**:
```bash
whisper input/reference/jaranime-parasyte.mp4 --model large-v3 --output_format json --output_dir raw/ --word_timestamps True
```
Then read the JSON output and write a summary to `analysis/narration-transcript.md` including:
- Total word count
- Total narration duration
- Sample segments from start, middle, and end
- Notable patterns observed

**scene-detection**:
```bash
scenedetect -i input/reference/jaranime-parasyte.mp4 detect-content -t 27 list-scenes -o raw/
```
Then process the CSV output into `raw/scenes.json` and write summary to `analysis/scene-boundaries.md` including:
- Total scene count
- Duration statistics (mean, median, min, max, std)
- Scenes per minute

**audio-levels**:
```bash
ffmpeg -i input/reference/jaranime-parasyte.mp4 -af astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=raw/audio-rms.txt -f null - 2>/dev/null
ffmpeg -i input/reference/jaranime-parasyte.mp4 -af loudnorm=print_format=json -f null - 2>&1 | grep -A 20 "Parsed_loudnorm"
```
Process into `raw/audio-levels.json` and write summary to `analysis/audio-profile.md`.

**audio-separation**:
```bash
demucs --two-stems=vocals input/reference/jaranime-parasyte.mp4 -o raw/separated/
```
Write summary to `analysis/audio-layers.md` describing what was separated and quality of separation.

### Wave 2: Pattern Analysis

For all Wave 2 aspects, read the relevant raw data files AND the transcript, reason about patterns, and write detailed findings to `analysis/{aspect-name}.md`.

Each analysis file MUST include:
- **Summary**: 2-3 sentence overview of findings
- **Data**: Specific numbers, timestamps, examples
- **Patterns**: What's consistent/repeatable
- **Spec Implications**: What this means for the forward engine specification

### Wave 3: Synthesis

**spec-draft**: Read EVERY file in `analysis/`. Synthesize into a complete software specification at `../../docs/plans/anime-recap-engine-spec.md` (relative to working dir). The spec must follow this structure:

1. System Overview
2. Input Contract (episodes folder + config.yaml)
3. Pipeline Stages (each with inputs, outputs, tools, parameters)
   - 3.1 Content Ingestion
   - 3.2 Plot Analysis & Script Generation
   - 3.3 Scene Selection & Matching
   - 3.4 Narration Audio Generation (TTS, language configurable)
   - 3.5 Anime Dialogue Moment Selection
   - 3.6 Music Selection & Audio Mixing
   - 3.7 Video Assembly & Render
4. The Formula (all extracted parameters with exact numbers)
5. Config Schema (YAML with language, duration, voice, quality)
6. Output Contract (video format, intermediate artifacts)
7. Quality Validation (tiered: timeline → audio → samples → full)
8. Tech Stack & Dependencies

**spec-review**: Read the generated spec and ask: "Could a developer with no context build the entire forward engine from this spec alone?" Check for:
- Missing parameters (are all numbers from analysis/ represented?)
- Vague instructions (does every stage have concrete tool commands?)
- Missing edge cases (what if episodes have no subtitles? what if the anime is 12 eps vs 24?)
- Config completeness (can the user control language, duration, quality?)

If the spec passes: write `status/converged.txt` with convergence summary.
If the spec fails: add specific fix-it aspects to the frontier and do NOT write converged.txt.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required raw data exists before starting a Wave 2 aspect. If `raw/transcription.json` doesn't exist yet, you cannot do `pacing-metrics`.
- Write findings in markdown. Include specific numbers, timestamps, and examples.
- When you discover a new aspect worth analyzing (something you didn't expect), add it to the frontier.
- Keep analysis files focused. One aspect = one file. Cross-reference other analysis files by filename.
- The final spec must be concrete enough that a fresh Claude Code session can implement the forward engine from it alone.
