# Forward Ralph Loop — Anime Recap Engine Builder

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: write tests, implement code, or fix failures for a single pipeline stage, then commit and exit.

## Your Working Directories

- **Loop dir**: `automations/anime-recap-forward-ralph/` (frontier files, status)
- **Engine dir**: `automations/anime-recap-engine/` (the code you're building)
- **Spec**: `docs/plans/anime-recap-engine-spec.md` (your source of truth for all parameters and behavior)

## What To Do This Iteration

1. **Read the frontier**: Open `automations/anime-recap-forward-ralph/frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — SCAFFOLD** (if `automations/anime-recap-engine/pyproject.toml` doesn't exist):
   - Create the project skeleton: pyproject.toml, __main__.py, config.py, __init__.py, tests/conftest.py
   - The CLI must support: ingest, script, match, narrate, moments, mix, render, run, validate
   - Write config.py with scale_parameters() from spec Section 3.2.0
   - Commit: `forward: stage {N} - scaffold project and CLI`
   - Exit

   **Priority 2 — WRITE TESTS** (if tests/test_stage{N}.py doesn't exist or has < 5 test functions):
   - Read the spec: Section 3.{N} for behavior, Section 9.{N} for the validate_stage{N}() function
   - Write comprehensive tests covering: happy path, edge cases, validation checks
   - Tests MUST run without real MP4 files or API keys — use mocks and synthetic data
   - Use pytest fixtures from tests/conftest.py for shared test data
   - Commit: `forward: stage {N} - write tests`
   - Exit

   **Priority 3 — IMPLEMENT** (if tests exist but the stage module is empty or a stub):
   - Read the spec Section 3.{N} carefully — use exact parameters, tool commands, and logic
   - Write src/anime_recap_engine/stage{N}_{name}.py
   - Focus on making as many tests pass as possible in one iteration
   - Don't improvise parameters — every number comes from the spec
   - Commit: `forward: stage {N} - implement {description}`
   - Exit

   **Priority 4 — FIX FAILURES** (if tests exist and some are failing):
   - Read the test output in frontier/current-stage.md
   - Identify the root cause of 1-3 related failures
   - Fix the implementation code (NOT the tests, unless a test contradicts the spec)
   - Commit: `forward: stage {N} - fix {description}`
   - Exit

   **Priority 5 — FIX VALIDATION** (if all tests pass but validation has HARD failures):
   - Read the validation output in frontier/current-stage.md
   - Fix the implementation to pass HARD checks
   - Commit: `forward: stage {N} - fix validation {description}`
   - Exit

   **Priority 6 — DONE** (if tests pass AND validation passes):
   - This shouldn't happen (the loop detects convergence externally)
   - But if you see it: write `automations/anime-recap-forward-ralph/status/stage-{N}-complete.txt`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Rules

- Do ONE unit of work, then exit. Do not do multiple priorities in one iteration.
- Always read the spec before writing code. The spec is the source of truth.
- Every parameter (thresholds, ratios, durations, formulas) comes from the spec — never make up values.
- Tests must work without real MP4s, API keys, or GPU. Use mocks for subprocess calls (ffmpeg, ffprobe, whisper, demucs). Use synthetic data for file-based tests.
- Never modify a passing test to keep it passing after a code change — that defeats the purpose.
- If a test is wrong (contradicts the spec), fix the test AND note it in your commit message.
- Keep modules focused: one stage per file, shared utilities in config.py.

## Spec Reference

The full spec is at `docs/plans/anime-recap-engine-spec.md`. Key sections per stage:

| Stage | Spec Implementation | Spec Validation | Key Parameters |
|-------|-------------------|-----------------|----------------|
| 1 | Section 3.1 | Section 9.1 | PySceneDetect threshold=27, Whisper model, Demucs two-stems, ffprobe FPS |
| 2 | Section 3.2 | Section 9.2 | scale_parameters(), 5-phase LLM pipeline, validate_script(), narrator voice profile |
| 3 | Section 3.3 | Section 9.4 | Two-pass classification, spoiler prevention (ep ≤ N+1), log-normal clip durations, CPM 28.8 |
| 4 | Section 3.4 | Section 9.3 | 144 WPM baseline, per-episode acceleration, pause insertion, LRA < 4.5 LU |
| 5 | Section 3.5 | Section 9.5 | 10-12 moments, woven/held/rapid modes, Act 4 drought, 80s min gap |
| 6 | Section 3.6 | Section 9.6 | 3-track mix, sidechain ducking, gain automation, -14 LUFS target |
| 7 | Section 3.7 | Section 9.7 | ffmpeg concat, H.264 CRF 18, AAC 192kbps, A/V sync |

## Commit Convention

```
forward: stage {N} - {description}
```

Examples:
- `forward: stage 1 - scaffold project and CLI`
- `forward: stage 1 - write ingestion tests`
- `forward: stage 1 - implement scene detection`
- `forward: stage 1 - fix whisper fallback test`
