# Forward Ralph Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the forward ralph loop — a bash script + prompt + frontier files that autonomously builds the anime recap engine stage-by-stage from the spec.

**Architecture:** Bash loop pipes PROMPT.md into `claude --print --dangerously-skip-permissions`. The loop runs tests externally after each iteration, writes results to a frontier file, and detects convergence when tests + validation both pass. Frontier files are the communication channel between the loop and Claude.

**Tech Stack:** Bash, Claude Code CLI, pytest, Python 3.10+

---

### Task 1: Create directory structure and frontier files

**Files:**
- Create: `automations/anime-recap-forward-ralph/frontier/stage-plan.md`
- Create: `automations/anime-recap-forward-ralph/frontier/current-stage.md`
- Create: `automations/anime-recap-forward-ralph/status/.gitkeep`

**Step 1: Create directories**

```bash
mkdir -p automations/anime-recap-forward-ralph/frontier
mkdir -p automations/anime-recap-forward-ralph/status
```

**Step 2: Write `frontier/stage-plan.md`**

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

**Step 3: Write `frontier/current-stage.md` (initial state)**

```markdown
# Current Stage: 1 (Content Ingestion)

## Spec Sections
- Implementation: Section 3.1 (Content Ingestion)
- Validation: Section 9.1 (Stage 1 validation)

## Test Results (updated by loop)
No tests exist yet.

## Validation Results (updated by loop)
Not yet run.

## Work Log
(no iterations yet)
```

**Step 4: Create .gitkeep**

```bash
touch automations/anime-recap-forward-ralph/status/.gitkeep
```

**Step 5: Commit**

```bash
git add automations/anime-recap-forward-ralph/
git commit -m "forward: scaffold frontier files and directory structure"
```

---

### Task 2: Create engine project skeleton

**Files:**
- Create: `automations/anime-recap-engine/pyproject.toml`
- Create: `automations/anime-recap-engine/src/anime_recap_engine/__init__.py`
- Create: `automations/anime-recap-engine/src/anime_recap_engine/__main__.py`
- Create: `automations/anime-recap-engine/tests/__init__.py`
- Create: `automations/anime-recap-engine/tests/conftest.py`

**Step 1: Write `pyproject.toml`**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "anime-recap-engine"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "pyyaml>=6.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
]

[project.scripts]
anime-recap-engine = "anime_recap_engine.__main__:main"

[tool.hatch.build.targets.wheel]
packages = ["src/anime_recap_engine"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

**Step 2: Write `__init__.py`**

```python
"""Anime Recap Engine — converts anime seasons into recap videos."""
```

**Step 3: Write `__main__.py`**

```python
"""CLI entry point for the Anime Recap Engine."""
import argparse
import sys


STAGES = {
    "ingest": 1,
    "script": 2,
    "match": 3,
    "narrate": 4,
    "moments": 5,
    "mix": 6,
    "render": 7,
    "run": 0,
    "validate": -1,
}


def main():
    parser = argparse.ArgumentParser(
        prog="anime-recap-engine",
        description="Convert an anime season into a recap video.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Per-stage commands
    for cmd in ["ingest", "script", "match", "narrate", "moments", "mix"]:
        sp = subparsers.add_parser(cmd)
        sp.add_argument("--config", required=True, help="Path to config.yaml")
        sp.add_argument("--work-dir", required=True, help="Path to work directory")

    # Ingest also needs --episodes
    subparsers.choices["ingest"].add_argument(
        "--episodes", required=True, help="Path to episodes directory"
    )

    # Render needs --output
    sp_render = subparsers.add_parser("render")
    sp_render.add_argument("--config", required=True)
    sp_render.add_argument("--work-dir", required=True)
    sp_render.add_argument("--output", required=True, help="Output file path")

    # Full pipeline
    sp_run = subparsers.add_parser("run")
    sp_run.add_argument("--episodes", required=True)
    sp_run.add_argument("--config", required=True)
    sp_run.add_argument("--output", required=True)

    # Validate
    sp_val = subparsers.add_parser("validate")
    sp_val.add_argument("--stage", type=int, required=True, help="Stage number to validate")
    sp_val.add_argument("--config", required=True)
    sp_val.add_argument("--work-dir", required=True)

    args = parser.parse_args()

    print(f"anime-recap-engine: {args.command} (not yet implemented)", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
```

**Step 4: Write `tests/__init__.py` and `tests/conftest.py`**

```python
# tests/__init__.py
```

```python
# tests/conftest.py
"""Shared test fixtures for the anime recap engine."""
import json
import os
import tempfile

import pytest


@pytest.fixture
def tmp_work_dir(tmp_path):
    """Create a temporary work directory with standard subdirs."""
    for d in ["episodes", "summaries", "narration/segments", "moments", "music"]:
        (tmp_path / d).mkdir(parents=True, exist_ok=True)
    return tmp_path


@pytest.fixture
def sample_config(tmp_path):
    """Write a minimal config.yaml and return its path."""
    import yaml

    config = {
        "anime": {
            "title": "Test Anime",
            "season": 1,
            "total_episodes": 12,
            "genre": "action",
            "language": "ja",
        },
        "output": {
            "target_duration_minutes": 37,
            "narration_language": "en",
            "voice": "male-casual",
            "quality": "1080p",
        },
        "pacing": {"baseline_wpm": 144, "accelerated_wpm": 152, "target_cpm": 28.8},
        "audio": {"target_lufs": -14.0, "target_true_peak": -1.0},
        "tts": {"provider": "elevenlabs"},
        "tools": {"scene_detect_threshold": 27, "whisper_model": "base"},
    }
    config_path = tmp_path / "config.yaml"
    config_path.write_text(yaml.dump(config))
    return str(config_path)
```

**Step 5: Verify skeleton works**

Run: `cd automations/anime-recap-engine && pip install -e ".[dev]" && pytest tests/ -v`
Expected: 0 tests collected (no test files with tests yet), exit 0 (no failures).

Run: `anime-recap-engine --help`
Expected: Shows usage with subcommands.

**Step 6: Commit**

```bash
git add automations/anime-recap-engine/
git commit -m "forward: scaffold engine project skeleton with CLI"
```

---

### Task 3: Write `forward-ralph.sh`

**Files:**
- Create: `automations/anime-recap-forward-ralph/forward-ralph.sh`

**Step 1: Write the loop script**

```bash
#!/bin/bash
# Forward Ralph Loop — Anime Recap Engine Builder
# Runs Claude Code repeatedly to build one pipeline stage at a time.
#
# Usage:
#   ./forward-ralph.sh [stage_number]   # Build a specific stage (1-7)
#   ./forward-ralph.sh                  # Auto-detect lowest incomplete stage
#   ./forward-ralph.sh all              # Build all stages sequentially

set -uo pipefail

unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$WORK_DIR/../.." && pwd)"
ENGINE_DIR="$REPO_ROOT/automations/anime-recap-engine"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
STAGE_PLAN="$WORK_DIR/frontier/stage-plan.md"
CURRENT_STAGE_FILE="$WORK_DIR/frontier/current-stage.md"
MAX_ITERATIONS=${2:-40}
SLEEP_BETWEEN=5

# Dev order (not numerical — Stage 4 before Stage 3)
DEV_ORDER=(1 2 4 3 5 6 7)

# Stage names for display
declare -A STAGE_NAMES=(
    [1]="Content Ingestion"
    [2]="Script Generation"
    [3]="Scene Matching"
    [4]="TTS Narration"
    [5]="Dialogue Moments"
    [6]="Audio Mixing"
    [7]="Video Assembly"
)

# Stage dependencies (space-separated upstream stage numbers)
declare -A STAGE_DEPS=(
    [1]=""
    [2]="1"
    [3]="1 2"
    [4]="2"
    [5]="1 2"
    [6]="4 5"
    [7]="3 6"
)

# Stage test files
declare -A STAGE_TESTS=(
    [1]="tests/test_stage1.py"
    [2]="tests/test_stage2.py"
    [3]="tests/test_stage3.py"
    [4]="tests/test_stage4.py"
    [5]="tests/test_stage5.py"
    [6]="tests/test_stage6.py"
    [7]="tests/test_stage7.py"
)

cd "$WORK_DIR"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: PROMPT.md not found at $PROMPT_FILE"
    exit 1
fi

# --- Helper functions ---

stage_complete() {
    [ -f "$WORK_DIR/status/stage-${1}-complete.txt" ]
}

check_dependencies() {
    local stage=$1
    local deps="${STAGE_DEPS[$stage]}"
    for dep in $deps; do
        if ! stage_complete "$dep"; then
            echo "ERROR: Stage $stage depends on Stage $dep, which is not complete."
            echo "Run: ./forward-ralph.sh $dep"
            return 1
        fi
    done
    return 0
}

auto_detect_stage() {
    for s in "${DEV_ORDER[@]}"; do
        if ! stage_complete "$s"; then
            echo "$s"
            return
        fi
    done
    echo "0"  # All complete
}

run_tests() {
    local stage=$1
    local test_file="${STAGE_TESTS[$stage]}"
    local test_path="$ENGINE_DIR/$test_file"

    if [ ! -f "$test_path" ]; then
        echo "NO_TESTS"
        return
    fi

    local output
    output=$(cd "$ENGINE_DIR" && python -m pytest "$test_file" -v --tb=short 2>&1) || true
    echo "$output"
}

run_validation() {
    local stage=$1
    # Only run validation if the validate command exists and is implemented
    local output
    output=$(cd "$ENGINE_DIR" && python -m anime_recap_engine validate \
        --stage "$stage" \
        --config "$REPO_ROOT/automations/anime-recap-forward-ralph/test-config.yaml" \
        --work-dir "$ENGINE_DIR/test-work/" 2>&1) || true
    echo "$output"
}

tests_pass() {
    local test_output="$1"
    echo "$test_output" | grep -qE "^(FAILED|ERROR)" && return 1
    echo "$test_output" | grep -q "passed" && return 0
    return 1  # No "passed" found
}

validation_passes() {
    local val_output="$1"
    echo "$val_output" | grep -q "HARD:" && return 1
    echo "$val_output" | grep -qE "(PASS|passed|OK)" && return 0
    return 1
}

update_frontier() {
    local stage=$1
    local test_output="$2"
    local val_output="$3"
    local iteration=$4

    cat > "$CURRENT_STAGE_FILE" << FRONTIER_EOF
# Current Stage: $stage (${STAGE_NAMES[$stage]})

## Spec Sections
- Implementation: Section 3.$stage
- Validation: Section 9.$stage (see spec for validate_stage${stage}())

## Test Results (updated by loop — iteration $iteration)
\`\`\`
$test_output
\`\`\`

## Validation Results (updated by loop — iteration $iteration)
\`\`\`
$val_output
\`\`\`

## Work Log
$(grep "^- iter" "$CURRENT_STAGE_FILE" 2>/dev/null || echo "(no iterations yet)")
FRONTIER_EOF
}

write_completion() {
    local stage=$1
    local test_output="$2"
    local iteration=$3

    local test_count
    test_count=$(echo "$test_output" | grep -oE "[0-9]+ passed" | head -1 || echo "unknown")

    cat > "$WORK_DIR/status/stage-${stage}-complete.txt" << COMPLETE_EOF
COMPLETE
Stage: $stage (${STAGE_NAMES[$stage]})
Tests: $test_count
Iterations: $iteration
Timestamp: $(date -Iseconds)
COMPLETE_EOF

    # Update stage-plan.md — mark this stage complete, unblock dependents
    sed -i "s/| $stage .*/| $stage     | ${STAGE_NAMES[$stage]} | 3.$stage, 9.$stage | ... | complete |/" "$STAGE_PLAN" 2>/dev/null || true

    echo "=== Stage $stage COMPLETE ==="
    cat "$WORK_DIR/status/stage-${stage}-complete.txt"
}

# --- Main logic ---

run_stage() {
    local stage=$1

    echo "=== Forward Ralph: Stage $stage (${STAGE_NAMES[$stage]}) ==="

    # Check dependencies
    if ! check_dependencies "$stage"; then
        exit 1
    fi

    # Already complete?
    if stage_complete "$stage"; then
        echo "Stage $stage is already complete."
        cat "$WORK_DIR/status/stage-${stage}-complete.txt"
        return 0
    fi

    local iteration=0
    local failures=0

    while [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
        iteration=$((iteration + 1))
        echo ""
        echo "--- Stage $stage, Iteration $iteration / $MAX_ITERATIONS ---"
        echo "$(date '+%Y-%m-%d %H:%M:%S')"

        # Step 2: Run tests and validation, update frontier
        local test_output
        test_output=$(run_tests "$stage")

        local val_output="Not yet run (tests must all pass first)."
        if [ "$test_output" != "NO_TESTS" ] && tests_pass "$test_output"; then
            val_output=$(run_validation "$stage")
        fi

        update_frontier "$stage" "$test_output" "$val_output" "$iteration"

        # Step 3: Check convergence
        if [ "$test_output" != "NO_TESTS" ] && tests_pass "$test_output"; then
            if validation_passes "$val_output"; then
                write_completion "$stage" "$test_output" "$iteration"
                return 0
            fi
        fi

        # Step 4: Run Claude
        local iter_log="/tmp/forward-ralph-stage-${stage}-iter-${iteration}.log"
        if timeout 1800 bash -c \
            'unset CLAUDECODE; cat "$1" | stdbuf -oL claude --print --dangerously-skip-permissions' \
            _ "$PROMPT_FILE" 2>&1 | stdbuf -oL tee "$iter_log"; then
            echo ""
            echo "Iteration $iteration completed successfully."
            failures=0
        else
            local iter_exit=$?
            if [ "$iter_exit" -eq 124 ]; then
                echo "WARNING: Iteration $iteration timed out after 1800s"
            else
                echo "WARNING: Iteration $iteration exited with code $iter_exit"
            fi
            failures=$((failures + 1))
            if [ "$failures" -ge 3 ]; then
                echo "ERROR: 3 consecutive failures. Stopping."
                return 1
            fi
        fi

        echo "Sleeping ${SLEEP_BETWEEN}s..."
        sleep "$SLEEP_BETWEEN"
    done

    echo "ERROR: Stage $stage did not converge in $MAX_ITERATIONS iterations."
    return 1
}

# --- Entry point ---

MODE="${1:-auto}"

if [ "$MODE" = "all" ]; then
    for s in "${DEV_ORDER[@]}"; do
        if ! stage_complete "$s"; then
            run_stage "$s" || exit 1
        fi
    done
    echo ""
    echo "=== All stages complete ==="
elif [ "$MODE" = "auto" ]; then
    STAGE=$(auto_detect_stage)
    if [ "$STAGE" = "0" ]; then
        echo "All stages are already complete."
        exit 0
    fi
    echo "Auto-detected: Stage $STAGE (${STAGE_NAMES[$STAGE]})"
    run_stage "$STAGE"
else
    STAGE="$MODE"
    if [ -z "${STAGE_NAMES[$STAGE]+x}" ]; then
        echo "ERROR: Unknown stage '$STAGE'. Valid: 1 2 3 4 5 6 7 all"
        exit 1
    fi
    run_stage "$STAGE"
fi
```

**Step 2: Make executable**

```bash
chmod +x automations/anime-recap-forward-ralph/forward-ralph.sh
```

**Step 3: Verify it runs (should fail gracefully — no PROMPT.md yet)**

Run: `cd automations/anime-recap-forward-ralph && ./forward-ralph.sh 1`
Expected: `ERROR: PROMPT.md not found` (we haven't written it yet)

**Step 4: Commit**

```bash
git add automations/anime-recap-forward-ralph/forward-ralph.sh
git commit -m "forward: add loop script with per-stage convergence detection"
```

---

### Task 4: Write `PROMPT.md`

**Files:**
- Create: `automations/anime-recap-forward-ralph/PROMPT.md`

**Step 1: Write the prompt**

```markdown
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
```

**Step 2: Commit**

```bash
git add automations/anime-recap-forward-ralph/PROMPT.md
git commit -m "forward: add PROMPT.md for development agent"
```

---

### Task 5: Verify end-to-end loop mechanics

**Files:**
- No new files. Verify existing files work together.

**Step 1: Dry-run the loop (will scaffold on first iteration, then fail on no tests — correct behavior)**

Run: `cd automations/anime-recap-forward-ralph && ./forward-ralph.sh 1`

Expected flow:
1. Loop checks dependencies for Stage 1 — none, passes
2. Loop runs tests — no test file exists, returns `NO_TESTS`
3. Loop can't check convergence (no tests) — doesn't converge
4. Loop pipes PROMPT.md into Claude — Claude reads frontier, sees Priority 1 (SCAFFOLD), creates project skeleton, commits, exits
5. Loop sleeps 5s, loops back
6. Next iteration: still no test file for stage 1 → Claude sees Priority 2, writes tests, commits, exits
7. Next iteration: tests exist and are failing → Claude sees Priority 3/4, implements + fixes
8. Eventually: tests pass → loop runs validation → validation passes → writes `status/stage-1-complete.txt` → stops

**Step 2: Verify the script exits cleanly when stage is already complete**

```bash
# Simulate completion
echo "COMPLETE" > automations/anime-recap-forward-ralph/status/stage-1-complete.txt
./forward-ralph.sh 1
# Expected: "Stage 1 is already complete."
rm automations/anime-recap-forward-ralph/status/stage-1-complete.txt
```

**Step 3: Verify dependency checking**

```bash
./forward-ralph.sh 3
# Expected: "ERROR: Stage 3 depends on Stage 1, which is not complete."
```

**Step 4: Commit any fixes from testing**

```bash
git add -A && git commit -m "forward: fix loop script issues from dry-run testing"
```

---

### Task 6: Final commit and push

**Step 1: Verify all files exist**

```bash
ls -la automations/anime-recap-forward-ralph/
ls -la automations/anime-recap-forward-ralph/frontier/
ls -la automations/anime-recap-engine/
ls -la automations/anime-recap-engine/src/anime_recap_engine/
ls -la automations/anime-recap-engine/tests/
```

**Step 2: Push**

```bash
git push origin feature/reverse-ralph-loop
```
