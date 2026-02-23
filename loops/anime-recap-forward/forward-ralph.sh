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
    output=$(cd "$ENGINE_DIR" && python3 -m pytest "$test_file" -v --tb=short 2>&1) || true
    echo "$output"
}

run_validation() {
    local stage=$1
    local output
    output=$(cd "$ENGINE_DIR" && python3 -m anime_recap_engine validate \
        --stage "$stage" \
        --config "$REPO_ROOT/loops/anime-recap-forward/test-config.yaml" \
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

    # Preserve existing work log
    local existing_log
    existing_log=$(grep "^- iter" "$CURRENT_STAGE_FILE" 2>/dev/null || echo "(no iterations yet)")

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
$existing_log
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
