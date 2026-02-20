# Reverse Ralph Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a ralph-style analysis loop that watches a JarAnime reference video and outputs a complete software specification for an anime recap engine.

**Architecture:** A bash loop invokes Claude Code repeatedly. Each iteration reads a frontier of analysis aspects, picks one, runs the appropriate tool (Whisper/ffmpeg/PySceneDetect/LLM reasoning), writes findings to the filesystem, updates the frontier, commits, and exits. The loop converges when all aspects are analyzed and the output spec passes self-review.

**Tech Stack:** Bash (loop runner), Claude Code (analysis agent), Whisper (transcription), PySceneDetect (scene detection), ffmpeg (audio analysis), Demucs (audio separation), Python (data processing)

**Design Doc:** `docs/plans/2026-02-20-reverse-ralph-loop-design.md`

---

## Task 1: Create directory structure

**Files:**
- Create: `automations/anime-recap-reverse-ralph/`
- Create: subdirectories: `input/reference/`, `raw/`, `raw/frames/`, `raw/separated/`, `analysis/`, `frontier/`, `status/`

**Step 1: Create all directories**

```bash
mkdir -p automations/anime-recap-reverse-ralph/{input/reference,raw/{frames,separated},analysis,frontier,status}
```

**Step 2: Verify structure**

```bash
find automations/anime-recap-reverse-ralph -type d | sort
```

Expected:
```
automations/anime-recap-reverse-ralph
automations/anime-recap-reverse-ralph/analysis
automations/anime-recap-reverse-ralph/frontier
automations/anime-recap-reverse-ralph/input
automations/anime-recap-reverse-ralph/input/reference
automations/anime-recap-reverse-ralph/raw
automations/anime-recap-reverse-ralph/raw/frames
automations/anime-recap-reverse-ralph/raw/separated
automations/anime-recap-reverse-ralph/status
```

**Step 3: Add .gitkeep files to empty dirs**

```bash
for dir in raw raw/frames raw/separated analysis status; do
  touch "automations/anime-recap-reverse-ralph/$dir/.gitkeep"
done
```

**Step 4: Commit**

```bash
git add automations/anime-recap-reverse-ralph/
git commit -m "scaffold: anime recap reverse ralph loop directory structure"
```

---

## Task 2: Move reference files into input/

The reference video and transcript are already downloaded at `research/anime-recap-analysis/`. Move copies into the automation's input directory.

**Files:**
- Copy: `research/anime-recap-analysis/jaranime-parasyte.mp4` → `automations/anime-recap-reverse-ralph/input/reference/`
- Copy: `research/anime-recap-analysis/jaranime-parasyte.en-orig.srt` → `automations/anime-recap-reverse-ralph/input/reference/`
- Copy: `research/anime-recap-analysis/frames/` → `automations/anime-recap-reverse-ralph/input/reference/frames/`

**Step 1: Copy files**

```bash
cp research/anime-recap-analysis/jaranime-parasyte.mp4 automations/anime-recap-reverse-ralph/input/reference/
cp research/anime-recap-analysis/jaranime-parasyte.en-orig.srt automations/anime-recap-reverse-ralph/input/reference/
cp -r research/anime-recap-analysis/frames automations/anime-recap-reverse-ralph/input/reference/
```

**Step 2: Add .gitignore for large video file**

Create `automations/anime-recap-reverse-ralph/input/reference/.gitignore`:
```
*.mp4
```

We track the transcript and frames in git but not the 172MB video file.

**Step 3: Verify**

```bash
ls -lh automations/anime-recap-reverse-ralph/input/reference/
```

Expected: `.gitignore`, `jaranime-parasyte.en-orig.srt`, `jaranime-parasyte.mp4`, `frames/`

**Step 4: Commit**

```bash
git add automations/anime-recap-reverse-ralph/input/
git commit -m "input: add reference transcript and frames for reverse ralph analysis"
```

---

## Task 3: Write the seed frontier

**Files:**
- Create: `automations/anime-recap-reverse-ralph/frontier/aspects.md`
- Create: `automations/anime-recap-reverse-ralph/frontier/analysis-log.md`

**Step 1: Write frontier/aspects.md**

```markdown
# Analysis Frontier

## Statistics
- Total aspects discovered: 15
- Analyzed: 0
- Pending: 15
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Raw Data Extraction (tools required)
- [ ] transcription — Run Whisper on reference video narration; output word-level timestamps to raw/transcription.json and summary to analysis/narration-transcript.md
- [ ] scene-detection — Run PySceneDetect on reference video; output scene boundaries to raw/scenes.json and summary to analysis/scene-boundaries.md
- [ ] audio-levels — Run ffmpeg loudness analysis on reference video; output volume envelope to raw/audio-levels.json and summary to analysis/audio-profile.md
- [ ] audio-separation — Run Demucs on reference audio; output separated stems to raw/separated/ and summary to analysis/audio-layers.md

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
(none yet)

## Discovered Aspects
(none yet — new aspects discovered during analysis will be added here then moved to Pending)
```

**Step 2: Write frontier/analysis-log.md**

```markdown
# Analysis Log

Tracks each iteration of the reverse ralph loop.

| Iteration | Timestamp | Aspect | Duration | New Aspects Discovered | Notes |
|-----------|-----------|--------|----------|----------------------|-------|
| (loop not started) | | | | | |
```

**Step 3: Commit**

```bash
git add automations/anime-recap-reverse-ralph/frontier/
git commit -m "frontier: seed analysis frontier with 15 aspects for reverse ralph loop"
```

---

## Task 4: Write the PROMPT.md

This is the most critical file — it's what Claude Code receives on each iteration of the loop. It must be completely self-contained since each iteration starts with a fresh context.

**Files:**
- Create: `automations/anime-recap-reverse-ralph/PROMPT.md`

**Step 1: Write PROMPT.md**

```markdown
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
```

**Step 2: Review PROMPT.md for completeness**

Read back the file and verify:
- All 15 seed aspects have analysis instructions
- Wave dependency ordering is clear
- Convergence condition is explicit
- File paths are all correct relative to the working directory

**Step 3: Commit**

```bash
git add automations/anime-recap-reverse-ralph/PROMPT.md
git commit -m "prompt: add loop prompt for reverse ralph analysis agent"
```

---

## Task 5: Write the bash loop runner

**Files:**
- Create: `automations/anime-recap-reverse-ralph/reverse-ralph.sh`

**Step 1: Write reverse-ralph.sh**

```bash
#!/bin/bash
# Reverse Ralph Loop — Anime Recap Video Analysis
# Runs Claude Code repeatedly until analysis converges into a software spec.
#
# Usage: cd automations/anime-recap-reverse-ralph && ./reverse-ralph.sh

set -euo pipefail

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
STATUS_FILE="$WORK_DIR/status/converged.txt"
MAX_ITERATIONS=40
SLEEP_BETWEEN=5

cd "$WORK_DIR"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: PROMPT.md not found at $PROMPT_FILE"
    exit 1
fi

iteration=0

echo "=== Reverse Ralph Loop Starting ==="
echo "Working directory: $WORK_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

while [ ! -f "$STATUS_FILE" ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
    iteration=$((iteration + 1))
    echo "--- Iteration $iteration / $MAX_ITERATIONS ---"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"

    # Run Claude Code with the prompt
    cat "$PROMPT_FILE" | claude --print 2>&1 | tee "/tmp/reverse-ralph-iter-${iteration}.log"

    echo ""
    echo "Iteration $iteration complete. Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
done

if [ -f "$STATUS_FILE" ]; then
    echo ""
    echo "=== CONVERGED after $iteration iterations ==="
    echo "Spec at: docs/plans/anime-recap-engine-spec.md"
    cat "$STATUS_FILE"
else
    echo ""
    echo "=== STOPPED: Max iterations ($MAX_ITERATIONS) reached without convergence ==="
    echo "Check frontier/aspects.md for remaining work."
fi
```

**Step 2: Make executable**

```bash
chmod +x automations/anime-recap-reverse-ralph/reverse-ralph.sh
```

**Step 3: Commit**

```bash
git add automations/anime-recap-reverse-ralph/reverse-ralph.sh
git commit -m "runner: add bash loop runner for reverse ralph analysis"
```

---

## Task 6: Install dependencies

**Step 1: Install Python packages**

```bash
pip install openai-whisper scenedetect[opencv] demucs
```

Note: `moviepy` is not needed for the reverse loop (only for the forward engine). `ffmpeg` is already installed.

**Step 2: Verify installations**

```bash
whisper --help | head -3
scenedetect version
python -c "import demucs; print('demucs OK')"
ffmpeg -version | head -1
```

All should succeed without errors.

**Step 3: No commit needed** (pip packages are not tracked in git)

---

## Task 7: Add .gitignore for large generated files

**Files:**
- Create: `automations/anime-recap-reverse-ralph/.gitignore`

**Step 1: Write .gitignore**

```gitignore
# Large binary outputs from analysis tools
raw/separated/
raw/*.wav
raw/*.mp3

# Whisper model cache
raw/*.pt

# Temporary logs
/tmp/reverse-ralph-iter-*.log
```

We DO want to track in git:
- `raw/transcription.json` (text, small)
- `raw/scenes.json` (text, small)
- `raw/audio-levels.json` (text, small)
- `raw/frames/` (already tracked from input)
- All `analysis/*.md` files
- `frontier/*.md` files
- `status/converged.txt`

**Step 2: Commit**

```bash
git add automations/anime-recap-reverse-ralph/.gitignore
git commit -m "config: add .gitignore for reverse ralph large generated files"
```

---

## Task 8: Update project entity status

**Files:**
- Modify: `entities/projects/anime-highlight-generator.md` — update status from `idea` to `active`

**Step 1: Update frontmatter**

Change `status: idea` to `status: active` in the frontmatter.

**Step 2: Add note about reverse ralph loop**

Add a section at the bottom:

```markdown
## Current Work

**2026-02-20**: Reverse ralph loop built in `automations/anime-recap-reverse-ralph/`. Analyzing JarAnime's Parasyte recap (75 min) to extract the formula and generate a forward engine spec. See `docs/plans/2026-02-20-reverse-ralph-loop-design.md`.
```

**Step 3: Commit**

```bash
git add entities/projects/anime-highlight-generator.md
git commit -m "entity: update anime highlight generator to active status"
```

---

## Task 9: Dry run — execute one manual iteration

Before running the full loop, manually verify the first iteration works.

**Step 1: Navigate to working directory**

```bash
cd automations/anime-recap-reverse-ralph
```

**Step 2: Run Claude Code with the prompt once**

```bash
cat PROMPT.md | claude --print 2>&1 | head -100
```

**Step 3: Verify outputs**

Check that:
- `frontier/aspects.md` has one aspect marked `- [x]`
- A new file exists in `analysis/`
- `frontier/analysis-log.md` has a new row
- A git commit was created with message `analyze: {aspect-name}`

```bash
git log --oneline -3
ls analysis/
head -30 frontier/aspects.md
```

**Step 4: If anything failed**, fix the PROMPT.md and retry. Common issues:
- Wrong file paths in prompt
- Tool not installed correctly
- Claude misinterpreting the frontier format

---

## Task 10: Run the full loop

**Step 1: Start the loop**

```bash
cd automations/anime-recap-reverse-ralph
./reverse-ralph.sh
```

This will run unattended. Expected behavior:
- Iterations 1-4: Wave 1 raw data extraction (slow — Whisper and Demucs take minutes)
- Iterations 5-13: Wave 2 pattern analysis (fast — LLM reasoning)
- Iterations 14+: Wave 3 synthesis + any discovered aspects
- Convergence expected around iteration 18-25

**Step 2: Monitor progress**

In another terminal:
```bash
watch -n 10 'head -10 automations/anime-recap-reverse-ralph/frontier/aspects.md'
```

**Step 3: Verify convergence**

```bash
cat automations/anime-recap-reverse-ralph/status/converged.txt
cat docs/plans/anime-recap-engine-spec.md | head -50
git log --oneline -25
```

---

## Summary

| Task | What | Commit Message |
|------|------|---------------|
| 1 | Directory structure | `scaffold: anime recap reverse ralph loop directory structure` |
| 2 | Reference files | `input: add reference transcript and frames for reverse ralph analysis` |
| 3 | Seed frontier | `frontier: seed analysis frontier with 15 aspects for reverse ralph loop` |
| 4 | PROMPT.md | `prompt: add loop prompt for reverse ralph analysis agent` |
| 5 | Bash runner | `runner: add bash loop runner for reverse ralph analysis` |
| 6 | Install deps | (no commit) |
| 7 | .gitignore | `config: add .gitignore for reverse ralph large generated files` |
| 8 | Entity update | `entity: update anime highlight generator to active status` |
| 9 | Dry run | (verify only) |
| 10 | Full loop | (automated commits by the loop itself) |

Tasks 1-8 are setup (human/agent executes). Tasks 9-10 are the loop running autonomously.
