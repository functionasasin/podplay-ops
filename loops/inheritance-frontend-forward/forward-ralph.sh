#!/bin/bash
# Forward Ralph Loop — Inheritance Frontend (React + TypeScript)
# Runs Claude Code repeatedly to build one stage at a time.
#
# Usage:
#   ./forward-ralph.sh [stage_number]   # Build a specific stage (1-12)
#   ./forward-ralph.sh                  # Auto-detect lowest incomplete stage
#   ./forward-ralph.sh all              # Build all stages sequentially

set -uo pipefail

unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$WORK_DIR/app"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
CURRENT_STAGE_FILE="$WORK_DIR/frontier/current-stage.md"
MAX_ITERATIONS=${2:-40}
SLEEP_BETWEEN=5

# Dev order (sequential)
DEV_ORDER=(1 2 3 4 5 6 7 8 9 10 11 12)

# Stage names for display
declare -A STAGE_NAMES=(
    [1]="Project Scaffold"
    [2]="Types & Enums"
    [3]="Zod Schemas"
    [4]="WASM Bridge Mock"
    [5]="Shared Components"
    [6]="Wizard Steps 1-2"
    [7]="Wizard Step 3 (Family Tree)"
    [8]="Wizard Step 4 (Will & Dispositions)"
    [9]="Wizard Steps 5-6 (Donations + Review)"
    [10]="Results View"
    [11]="Validation Layer 3"
    [12]="Integration & Polish"
)

# Stage dependencies (space-separated upstream stage numbers)
declare -A STAGE_DEPS=(
    [1]=""
    [2]="1"
    [3]="2"
    [4]="2"
    [5]="1"
    [6]="3 5"
    [7]="3 5"
    [8]="7"
    [9]="7"
    [10]="4"
    [11]="6 7 8 9"
    [12]="1 2 3 4 5 6 7 8 9 10 11"
)

# Test filter patterns for vitest (file path substrings, pipe-separated → split to args)
declare -A STAGE_TEST_FILTERS=(
    [1]="smoke"
    [2]="types"
    [3]="schemas"
    [4]="wasm"
    [5]="shared"
    [6]="EstateStep|DecedentStep|WizardContainer"
    [7]="FamilyTreeStep|PersonCard|AdoptionSubForm|FiliationSection"
    [8]="WillStep|InstitutionsTab|LegaciesTab|DevisesTab|DisinheritancesTab|ShareSpecForm|HeirReferenceForm"
    [9]="DonationsStep|DonationCard|ReviewStep"
    [10]="results"
    [11]="validation|warning"
    [12]="integration|e2e"
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

    # No package.json = no tests possible (stage 1 hasn't run yet)
    if [ ! -f "$APP_DIR/package.json" ]; then
        echo "NO_TESTS"
        return
    fi

    # Check if node_modules exists
    if [ ! -d "$APP_DIR/node_modules" ]; then
        echo "MISSING_DEPS"
        return
    fi

    # Split pipe-separated filter into separate vitest positional args
    local -a filter_args
    IFS='|' read -ra filter_args <<< "$filter"

    local output
    output=$(cd "$APP_DIR" && npx vitest run --reporter=verbose --no-color "${filter_args[@]}" 2>&1) || true
    echo "$output"
}

tests_pass() {
    local test_output="$1"
    # Vitest outputs "Tests  X passed" on success
    echo "$test_output" | grep -q "FAIL" && return 1
    echo "$test_output" | grep -qE "Tests\s+[1-9][0-9]*\s+passed" || return 1
    return 0
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
        1)  spec_sections="- No spec needed — scaffold from tech stack requirements\n- Tech: Vite + React 18 + TypeScript + Tailwind CSS 4 + React Hook Form + Zod + Recharts + Vitest" ;;
        2)  spec_sections="- Types: synthesis/types.ts\n- 17 interfaces + 12 enums + utility functions" ;;
        3)  spec_sections="- Schemas: synthesis/schemas.ts\n- 7 superRefine constraints + all enum schemas" ;;
        4)  spec_sections="- Engine output: engine-output.md\n- Scenario mapping: scenario-field-mapping.md" ;;
        5)  spec_sections="- Shared components: shared-components.md\n- 5 Tier-1 components: MoneyInput, DateInput, FractionInput, PersonPicker, EnumSelect" ;;
        6)  spec_sections="- Wizard steps: synthesis/wizard-steps.md §1-2\n- Estate + Decedent steps" ;;
        7)  spec_sections="- Wizard steps: synthesis/wizard-steps.md §3\n- Family Tree — most complex step (11 relationship types)" ;;
        8)  spec_sections="- Wizard steps: synthesis/wizard-steps.md §4\n- Will & Dispositions — 4 sub-tabs" ;;
        9)  spec_sections="- Wizard steps: synthesis/wizard-steps.md §5-6\n- Donations + Review & Config" ;;
        10) spec_sections="- Results view: synthesis/results-view.md\n- 5 sections, 7 layout variants, Recharts pie chart" ;;
        11) spec_sections="- Validation: invalid-combinations.md\n- Conditional visibility: conditional-visibility.md\n- 13 pre-submission warnings" ;;
        12) spec_sections="- Full integration: synthesis/spec-summary.md\n- WASM bridge prep, export, e2e flow" ;;
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
        if [ "$test_output" != "NO_TESTS" ] && [ "$test_output" != "MISSING_DEPS" ] && tests_pass "$test_output"; then
            write_completion "$stage" "$test_output" "$iteration"
            return 0
        fi

        # Run Claude
        local iter_log="/tmp/forward-ralph-frontend-stage-${stage}-iter-${iteration}.log"
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
    while true; do
        STAGE=$(auto_detect_stage)
        if [ "$STAGE" = "-1" ]; then
            echo "All stages are already complete."
            exit 0
        fi
        echo "Auto-detected: Stage $STAGE (${STAGE_NAMES[$STAGE]})"
        run_stage "$STAGE" || exit 1
    done
else
    STAGE="$MODE"
    if [ -z "${STAGE_NAMES[$STAGE]+x}" ]; then
        echo "ERROR: Unknown stage '$STAGE'. Valid: 1 2 3 4 5 6 7 8 9 10 11 12 all"
        exit 1
    fi
    run_stage "$STAGE"
fi
