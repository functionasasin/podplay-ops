#!/bin/bash
# Forward Ralph Loop — Inheritance Distribution Engine (Rust)
# Runs Claude Code repeatedly to build one pipeline stage at a time.
#
# Usage:
#   ./forward-ralph.sh [stage_number]   # Build a specific stage (0-11)
#   ./forward-ralph.sh                  # Auto-detect lowest incomplete stage
#   ./forward-ralph.sh all              # Build all stages sequentially

set -uo pipefail

unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
STAGE_PLAN="$WORK_DIR/frontier/stage-plan.md"
CURRENT_STAGE_FILE="$WORK_DIR/frontier/current-stage.md"
MAX_ITERATIONS=${2:-40}
SLEEP_BETWEEN=5

# Dev order (sequential pipeline)
DEV_ORDER=(0 1 2 3 4 5 6 7 8 9 10 11)

# Stage names for display
declare -A STAGE_NAMES=(
    [0]="Scaffold + Types + Fractions"
    [1]="Classify Heirs"
    [2]="Build Lines"
    [3]="Succession Type + Scenario"
    [4]="Compute Estate Base"
    [5]="Compute Legitimes + FP"
    [6]="Testate Validation"
    [7]="Distribute Estate"
    [8]="Collation Adjustment"
    [9]="Vacancy Resolution"
    [10]="Finalize + Narrate"
    [11]="Integration (End-to-End)"
)

# Stage dependencies (space-separated upstream stage numbers)
declare -A STAGE_DEPS=(
    [0]=""
    [1]="0"
    [2]="1"
    [3]="1"
    [4]="0"
    [5]="3"
    [6]="5"
    [7]="2 5 6"
    [8]="4 7"
    [9]="7"
    [10]="7 8 9"
    [11]="0 1 2 3 4 5 6 7 8 9 10"
)

# Test filter patterns for cargo test
declare -A STAGE_TEST_FILTERS=(
    [0]="fraction"
    [1]="step1"
    [2]="step2"
    [3]="step3"
    [4]="step4"
    [5]="step5"
    [6]="step6"
    [7]="step7"
    [8]="step8"
    [9]="step9"
    [10]="step10"
    [11]="integration"
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
    echo "-1"  # All complete
}

run_tests() {
    local stage=$1
    local filter="${STAGE_TEST_FILTERS[$stage]}"

    # No Cargo.toml = no tests possible (stage 0 hasn't run yet)
    if [ ! -f "$WORK_DIR/Cargo.toml" ]; then
        echo "NO_TESTS"
        return
    fi

    local output
    if [ "$stage" -eq 11 ]; then
        # Integration tests are in tests/ directory
        output=$(cd "$WORK_DIR" && cargo test --test integration 2>&1) || true
    else
        output=$(cd "$WORK_DIR" && cargo test "$filter" 2>&1) || true
    fi
    echo "$output"
}

tests_pass() {
    local test_output="$1"
    echo "$test_output" | grep -qE "^error" && return 1
    echo "$test_output" | grep -q "FAILED" && return 1
    echo "$test_output" | grep -q "test result: ok" && return 0
    return 1  # No "ok" found
}

update_frontier() {
    local stage=$1
    local test_output="$2"
    local iteration=$3

    # Preserve existing work log
    local existing_log
    existing_log=$(grep "^- iter" "$CURRENT_STAGE_FILE" 2>/dev/null || echo "(no iterations yet)")

    local spec_sections=""
    case $stage in
        0)  spec_sections="- Data Model: §3 (all types)\n- Implementation Notes: §15 (language-agnostic, BigInt fractions, determinism)" ;;
        1)  spec_sections="- Heir Classification: §4\n- Eligibility Gate: §4.3\n- Filiation Proof: §4.4" ;;
        2)  spec_sections="- Representation: §5\n- Build Lines Algorithm: §5.3" ;;
        3)  spec_sections="- Scenario Codes: §3.7\n- Mixed Succession Detection: §2.4" ;;
        4)  spec_sections="- Collation: §8.1-8.3 (which donations are collatable)" ;;
        5)  spec_sections="- Legitime Fraction Table: §6\n- FP Pipeline: §2.3\n- Cap Rule: §6.6" ;;
        6)  spec_sections="- Testate Validation: §9 (preterition, disinheritance, underprovision, inofficiousness)" ;;
        7)  spec_sections="- Intestate Distribution: §7\n- Mixed Succession: §7.5" ;;
        8)  spec_sections="- Collation Adjustment: §8.4-8.7 (impute donations against shares)" ;;
        9)  spec_sections="- Vacancy Resolution: §10 (substitution, representation, accretion, intestate fallback)" ;;
        10) spec_sections="- Narrative Templates: §11\n- Rounding: §12" ;;
        11) spec_sections="- Test Vectors: §14 (23 vectors)\n- Invariants: §14.2 (10 invariants)\n- Edge Cases: §13" ;;
    esac

    cat > "$CURRENT_STAGE_FILE" << FRONTIER_EOF
# Current Stage: $stage (${STAGE_NAMES[$stage]})

## Spec Sections
$(echo -e "$spec_sections")

## Test Results (updated by loop — iteration $iteration)
\`\`\`
$test_output
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

        # Run tests and update frontier
        local test_output
        test_output=$(run_tests "$stage")

        update_frontier "$stage" "$test_output" "$iteration"

        # Check convergence
        if [ "$test_output" != "NO_TESTS" ] && tests_pass "$test_output"; then
            write_completion "$stage" "$test_output" "$iteration"
            return 0
        fi

        # Run Claude
        local iter_log="/tmp/forward-ralph-inheritance-stage-${stage}-iter-${iteration}.log"
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
    if [ "$STAGE" = "-1" ]; then
        echo "All stages are already complete."
        exit 0
    fi
    echo "Auto-detected: Stage $STAGE (${STAGE_NAMES[$STAGE]})"
    run_stage "$STAGE"
else
    STAGE="$MODE"
    if [ -z "${STAGE_NAMES[$STAGE]+x}" ]; then
        echo "ERROR: Unknown stage '$STAGE'. Valid: 0 1 2 3 4 5 6 7 8 9 10 11 all"
        exit 1
    fi
    run_stage "$STAGE"
fi
