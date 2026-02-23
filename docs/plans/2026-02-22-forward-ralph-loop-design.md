# Forward Ralph Loop — Design Doc

> Builds the Anime Recap Engine stage-by-stage from the spec at `docs/plans/anime-recap-engine-spec.md`.
> Mirror image of the reverse ralph loop: spec → code instead of video → spec.

## Overview

A bash loop script that invokes Claude Code repeatedly, one unit of work per iteration, until each pipeline stage passes both its test suite and its validation function. Stages are built top-down following the dependency order from the spec (Section 9).

## Directory Structure

### Loop Orchestration

```
automations/anime-recap-forward-ralph/
├── forward-ralph.sh              # The loop script
├── PROMPT.md                     # Stage-agnostic prompt
├── frontier/
│   ├── stage-plan.md             # All stages, statuses, dependencies
│   └── current-stage.md          # Current stage context (test results, work log)
└── status/
    └── stage-{N}-complete.txt    # Per-stage convergence marker
```

### Engine Code (produced by the loop)

```
automations/anime-recap-engine/
├── pyproject.toml
├── src/anime_recap_engine/
│   ├── __main__.py               # CLI: anime-recap-engine {ingest|script|match|narrate|moments|mix|render|run}
│   ├── config.py                 # Config loading, scale_parameters(), validation helpers
│   ├── stage1_ingest.py          # Content Ingestion
│   ├── stage2_script.py          # Plot Analysis & Script Generation
│   ├── stage3_match.py           # Scene Selection & Matching
│   ├── stage4_narrate.py         # TTS Narration
│   ├── stage5_moments.py         # Anime Dialogue Moments
│   ├── stage6_mix.py             # Audio Mixing
│   └── stage7_render.py          # Video Assembly & Render
└── tests/
    ├── conftest.py               # Shared fixtures (mock manifest, synthetic script, etc.)
    ├── test_config.py            # scale_parameters, config loading
    ├── test_stage1.py
    ├── test_stage2.py
    ├── test_stage3.py
    ├── test_stage4.py
    ├── test_stage5.py
    ├── test_stage6.py
    └── test_stage7.py
```

## Loop Script (`forward-ralph.sh`)

### Usage

```bash
cd automations/anime-recap-forward-ralph

./forward-ralph.sh 1          # Build Stage 1 (Content Ingestion)
./forward-ralph.sh 2          # Build Stage 2 (Script Generation)
./forward-ralph.sh            # Auto-detect: pick lowest incomplete stage in dev order
./forward-ralph.sh all        # Run all stages sequentially until all complete
```

### Per-Iteration Flow

```
1. PRE-CHECK: Are upstream stages complete?
   - Read frontier/stage-plan.md for dependencies
   - e.g., Stage 3 requires status/stage-1-complete.txt AND status/stage-2-complete.txt
   - If upstream incomplete → exit with error

2. UPDATE FRONTIER: Write latest test/validation results to frontier/current-stage.md
   - If tests exist: run pytest, capture output
   - If validation module exists: run it, capture output
   - Write results to current-stage.md so Claude sees them

3. CHECK CONVERGENCE: If tests pass AND validation passes → write stage-N-complete.txt, stop

4. RUN CLAUDE: Pipe PROMPT.md into claude --print --dangerously-skip-permissions
   - Claude reads frontier/current-stage.md, does ONE unit of work, commits, exits

5. POST-ITERATION:
   - Log iteration result
   - Sleep, loop back to step 2
```

The key design decision: **the loop runs tests, not Claude**. This gives an objective convergence signal. Claude sees the test results via the frontier file at the start of each iteration.

### Convergence

A stage is complete when:
1. `pytest tests/test_stageN.py` exits 0 (all tests pass)
2. `python -m anime_recap_engine validate --stage N --work-dir ./test-work/` exits 0 (all HARD checks pass)

The loop writes `status/stage-N-complete.txt` with a summary:

```
COMPLETE
Stage: 1 (Content Ingestion)
Tests: 12/12 passed
Validation: 8/8 HARD checks passed, 1 SOFT warning
Iterations: 7
Timestamp: 2026-02-23T14:30:00
```

### Stage Sequencing

When a stage completes, the loop updates `frontier/stage-plan.md` and unblocks downstream stages. With `./forward-ralph.sh all`, it automatically advances to the next stage.

### Failure Handling

Same as reverse ralph:
- Per-iteration timeout: 30 minutes
- 3 consecutive failures → stop loop with error
- Iteration logs saved to `/tmp/forward-ralph-stage-{N}-iter-{I}.log`

## Prompt Design (`PROMPT.md`)

### Identity

The prompt tells Claude: "You are a development agent in a forward ralph loop. You build one pipeline stage at a time from a spec. Each iteration, you do ONE unit of work, commit, and exit."

### Context Sources

Claude reads these files at the start of each iteration:

| File | Purpose |
|------|---------|
| `frontier/current-stage.md` | Stage number, test results, validation output, work log |
| `docs/plans/anime-recap-engine-spec.md` | The full spec (Section 3.N for stage details, Section 9.N for validation) |
| Engine source code | Current state of implementation |
| Engine test code | Current state of tests |

### Work Priority (one per iteration)

Claude picks the highest-priority applicable action:

```
Priority 1: SCAFFOLD (if no pyproject.toml / __main__.py exists)
  → Create project skeleton, pyproject.toml, CLI entry point, config.py

Priority 2: WRITE TESTS (if tests/test_stageN.py doesn't exist or has < 5 tests)
  → Read spec Section 3.N + Section 9.N, write test file
  → Tests should cover: happy path, edge cases, validation checks
  → Use synthetic/mock data — tests must run WITHOUT real MP4s or API keys

Priority 3: IMPLEMENT (if tests exist but stage module is empty/missing)
  → Read spec Section 3.N, write the stage module
  → Focus on making the most tests pass in one iteration

Priority 4: FIX FAILURES (if tests exist and are failing)
  → Read the test output from frontier/current-stage.md
  → Fix the failing code (not the tests, unless a test is clearly wrong)
  → Target: fix 1-3 related failures per iteration

Priority 5: FIX VALIDATION (if tests pass but validation has HARD failures)
  → Read validation output from frontier/current-stage.md
  → Fix the issues

Priority 6: DONE (if tests pass and validation passes)
  → Write status/stage-N-complete.txt
  → Exit
```

### Commit Convention

Each iteration commits with: `forward: stage {N} - {description}`

Examples:
- `forward: stage 1 - scaffold project and CLI`
- `forward: stage 1 - write ingestion tests`
- `forward: stage 1 - implement scene detection`
- `forward: stage 1 - fix whisper fallback test`

### Constraints

- ONE unit of work per iteration, then exit
- Always commit before exiting (even partial progress)
- Never modify tests to make them pass (unless the test itself is wrong per the spec)
- Never skip tests or validation
- Read the spec for every implementation decision — don't improvise parameters

## Frontier Files

### `frontier/stage-plan.md`

```markdown
# Forward Ralph — Stage Plan

Dev order: 1 → 2 → 4 → 3 → 5 → 6 → 7

| Stage | Name              | Spec Section | Depends On | Status   |
|-------|-------------------|-------------|------------|----------|
| 1     | Content Ingestion | 3.1, 9.1   | —          | pending  |
| 2     | Script Generation | 3.2, 9.2   | 1          | blocked  |
| 4     | TTS Narration     | 3.4, 9.3   | 2          | blocked  |
| 3     | Scene Matching    | 3.3, 9.4   | 1, 2       | blocked  |
| 5     | Dialogue Moments  | 3.5, 9.5   | 1, 2       | blocked  |
| 6     | Audio Mixing      | 3.6, 9.6   | 4, 5       | blocked  |
| 7     | Video Assembly    | 3.7, 9.7   | 3, 6       | blocked  |

Status values: blocked | pending | active | complete
```

### `frontier/current-stage.md`

Updated by the loop script before each Claude iteration:

```markdown
# Current Stage: 1 (Content Ingestion)

## Spec Sections
- Implementation: Section 3.1 (Content Ingestion)
- Validation: Section 9.1 (Stage 1 validation)

## Test Results (updated by loop)
```
tests/test_stage1.py::test_scene_detection_json_output PASSED
tests/test_stage1.py::test_whisper_fallback FAILED - AssertionError
tests/test_stage1.py::test_manifest_assembly FAILED - KeyError: 'fps'
...
10 passed, 2 failed
```

## Validation Results (updated by loop)
Not yet run (tests must all pass first).

## Work Log
- iter 1: scaffolded project, CLI, config.py
- iter 2: wrote 12 tests for stage 1
- iter 3: implemented scene detection + FPS probing
- iter 4: implemented whisper/SRT transcription pipeline
```

## Test Strategy

Tests must run **without real MP4 files or API keys**. Each stage's tests use:

| Stage | Mock/Synthetic Input |
|-------|---------------------|
| 1 (Ingest) | Mock ffprobe/ffmpeg output, synthetic SRT file, mock Whisper JSON |
| 2 (Script) | Synthetic manifest.json with fake transcriptions |
| 3 (Match) | Synthetic script.md + mock scene classifications |
| 4 (TTS) | Mock TTS API responses (pre-recorded short audio bytes) |
| 5 (Moments) | Synthetic script slots + mock audio files (sine waves) |
| 6 (Mix) | Mock narration/moment/music WAV files (generated sine waves at known dB) |
| 7 (Render) | Short synthetic concat file + audio, verify ffmpeg command construction |

Integration tests that require real files are separate (`tests/integration/`) and NOT part of the convergence criteria. They're run manually with real anime episodes.

## Development Order Rationale

```
Stage 1 (Ingest)     — Foundation. Everything reads from manifest.json.
Stage 2 (Script)     — Depends only on transcriptions. Core creative output.
Stage 4 (TTS)        — Depends only on script text. Hear narration before visual work.
Stage 3 (Match)      — Depends on scenes + script. Most complex classification logic.
Stage 5 (Moments)    — Depends on script slots + vocal stems. Parallel-able with Stage 3.
Stage 6 (Mix)        — Depends on narration + moments + music. Audio integration.
Stage 7 (Render)     — Depends on everything. Final assembly. Simplest code.
```

Stage 4 before Stage 3: hearing the narration early catches script quality and TTS voice issues before investing in the expensive scene classification pipeline.
