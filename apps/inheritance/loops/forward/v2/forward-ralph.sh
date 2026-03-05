#!/bin/bash
# Forward Ralph Loop — Philippine Inheritance Distribution Engine v2
# Multi-workspace runner: Rust engine + WASM bridge + React frontend in one loop.
#
# Usage:
#   ./forward-ralph.sh [stage]    # Build a specific stage (0-12, P2-1, P2-2, P3-1..P3-3, P4-1..P4-7, P5-1..P5-3)
#   ./forward-ralph.sh            # Auto-detect lowest incomplete stage
#   ./forward-ralph.sh all        # Build all stages sequentially

set -uo pipefail

unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
CURRENT_STAGE_FILE="$WORK_DIR/frontier/current-stage.md"
ENGINE_DIR="$WORK_DIR/engine"
FRONTEND_DIR="$WORK_DIR/frontend"
WASM_PKG_SRC="$ENGINE_DIR/pkg"
WASM_PKG_DST="$FRONTEND_DIR/src/wasm/pkg"
MAX_ITERATIONS=${2:-40}
SLEEP_BETWEEN=5

# Stage execution order (all phases, sequential)
DEV_ORDER=(
    # Phase 1: Engine Core (Rust)
    0 1 2 3 4 5 6 7 8 9 10 11 12
    # Phase 2: WASM Bridge
    P2-1 P2-2
    # Phase 3: Frontend Foundation
    P3-1 P3-2 P3-3
    # Phase 4: Frontend Components
    P4-1 P4-2 P4-3 P4-4 P4-5 P4-6 P4-7
    # Phase 5: UI Polish
    P5-1 P5-2 P5-3
)

# Human-readable stage names
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
    [11]="Integration Tests (E2E)"
    [12]="Fuzz Invariants (100 random)"
    [P2-1]="WASM Export"
    [P2-2]="WASM Build + Copy to Frontend"
    [P3-1]="Vite + React Scaffold"
    [P3-2]="TypeScript Types + Zod Schemas"
    [P3-3]="WASM Bridge (Real)"
    [P4-1]="Shared Form Components"
    [P4-2]="Wizard Shell + Estate + Decedent"
    [P4-3]="Family Tree Step"
    [P4-4]="Will Step"
    [P4-5]="Donations + Review"
    [P4-6]="Results View"
    [P4-7]="Validation + Integration"
    [P5-1]="Design System Setup"
    [P5-2]="Component Restyle"
    [P5-3]="Responsive + Polish"
)

# Dependencies (space-separated upstream stage IDs)
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
    [12]="11"
    [P2-1]="12"
    [P2-2]="P2-1"
    [P3-1]="P2-2"
    [P3-2]="P3-1"
    [P3-3]="P3-2 P2-2"
    [P4-1]="P3-3"
    [P4-2]="P4-1"
    [P4-3]="P4-2"
    [P4-4]="P4-3"
    [P4-5]="P4-4"
    [P4-6]="P4-5"
    [P4-7]="P4-6"
    [P5-1]="P4-7"
    [P5-2]="P5-1"
    [P5-3]="P5-2"
)

# Which workspace each stage runs in: "engine", "bridge", or "frontend"
declare -A STAGE_WORKSPACE=(
    [0]="engine"
    [1]="engine"
    [2]="engine"
    [3]="engine"
    [4]="engine"
    [5]="engine"
    [6]="engine"
    [7]="engine"
    [8]="engine"
    [9]="engine"
    [10]="engine"
    [11]="engine"
    [12]="engine"
    [P2-1]="engine"
    [P2-2]="bridge"
    [P3-1]="frontend"
    [P3-2]="frontend"
    [P3-3]="frontend"
    [P4-1]="frontend"
    [P4-2]="frontend"
    [P4-3]="frontend"
    [P4-4]="frontend"
    [P4-5]="frontend"
    [P4-6]="frontend"
    [P4-7]="frontend"
    [P5-1]="frontend"
    [P5-2]="frontend"
    [P5-3]="frontend"
)

# Test filter patterns
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
    [12]="fuzz_invariants"
    [P2-1]="wasm"
    [P2-2]="BRIDGE"
    [P3-1]="smoke"
    [P3-2]="schemas"
    [P3-3]="bridge"
    [P4-1]="shared"
    [P4-2]="wizard"
    [P4-3]="family"
    [P4-4]="will"
    [P4-5]="donation|review"
    [P4-6]="results"
    [P4-7]="integration|e2e"
    [P5-1]="."
    [P5-2]="."
    [P5-3]="."
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
    local deps="${STAGE_DEPS[$stage]:-}"
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
    echo "-1"
}

run_tests() {
    local stage=$1
    local workspace="${STAGE_WORKSPACE[$stage]:-engine}"
    local filter="${STAGE_TEST_FILTERS[$stage]:-}"

    case "$workspace" in
        engine)
            if [ ! -f "$ENGINE_DIR/Cargo.toml" ]; then
                echo "NO_TESTS"
                return
            fi
            local output
            if [ "$filter" = "integration" ]; then
                output=$(cd "$ENGINE_DIR" && cargo test --test integration 2>&1) || true
            elif [ "$filter" = "fuzz_invariants" ]; then
                output=$(cd "$ENGINE_DIR" && cargo test --test fuzz_invariants 2>&1) || true
            elif [ "$filter" = "wasm" ]; then
                # P2-1: verify wasm target compiles
                output=$(cd "$ENGINE_DIR" && cargo check --target wasm32-unknown-unknown --lib 2>&1) || true
                local native_output
                native_output=$(cd "$ENGINE_DIR" && cargo test 2>&1) || true
                output="$output"$'\n'"--- Native tests ---"$'\n'"$native_output"
            else
                output=$(cd "$ENGINE_DIR" && cargo test "$filter" 2>&1) || true
            fi
            echo "$output"
            ;;

        bridge)
            local output=""

            # Step 1: cargo check for wasm target
            if ! output+=$(cd "$ENGINE_DIR" && cargo check --target wasm32-unknown-unknown --lib 2>&1); then
                echo "$output"
                return
            fi
            output+=$'\n'

            # Step 2: wasm-pack build
            if command -v wasm-pack &>/dev/null; then
                if ! output+=$(cd "$ENGINE_DIR" && wasm-pack build --target web --out-dir pkg 2>&1); then
                    echo "$output"
                    return
                fi
                output+=$'\n'

                # Step 3: Verify artifacts
                if ls "$WASM_PKG_SRC"/*.wasm &>/dev/null 2>&1; then
                    output+="ARTIFACTS_PRESENT"$'\n'
                else
                    output+="ARTIFACTS_MISSING"$'\n'
                    echo "$output"
                    return
                fi

                # Step 4: Copy to frontend
                mkdir -p "$WASM_PKG_DST"
                if cp -r "$WASM_PKG_SRC"/* "$WASM_PKG_DST/" 2>&1; then
                    output+="COPIED_TO_FRONTEND"$'\n'
                else
                    output+="COPY_FAILED"$'\n'
                fi
            else
                output+="wasm-pack not installed. Install: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"$'\n'
            fi

            echo "$output"
            ;;

        frontend)
            if [ ! -f "$FRONTEND_DIR/package.json" ]; then
                echo "NO_TESTS"
                return
            fi
            if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
                echo "MISSING_DEPS"
                return
            fi
            local output
            if [ -n "$filter" ] && [ "$filter" != "." ]; then
                output=$(cd "$FRONTEND_DIR" && npx vitest run --reporter=verbose "$filter" 2>&1) || true
            else
                output=$(cd "$FRONTEND_DIR" && npx vitest run --reporter=verbose 2>&1) || true
            fi

            # Phase 5: also check CSS bundle size
            if [[ "$stage" == P5-* ]]; then
                local build_output
                build_output=$(cd "$FRONTEND_DIR" && npm run build 2>&1) || true
                output+=$'\n'"--- Build output ---"$'\n'"$build_output"$'\n'
                local css_size
                css_size=$(stat -c%s "$FRONTEND_DIR"/dist/assets/*.css 2>/dev/null || echo "0")
                output+="CSS_BUNDLE_SIZE=${css_size}"$'\n'
                if [ "$css_size" -gt 20000 ]; then
                    output+="CSS_SIZE_CHECK=PASS"$'\n'
                else
                    output+="CSS_SIZE_CHECK=FAIL (must be > 20KB, got ${css_size} bytes)"$'\n'
                fi
            fi

            echo "$output"
            ;;

        *)
            echo "ERROR: Unknown workspace '$workspace' for stage $stage"
            ;;
    esac
}

tests_pass() {
    local stage=$1
    local test_output="$2"
    local workspace="${STAGE_WORKSPACE[$stage]:-engine}"

    case "$workspace" in
        engine)
            echo "$test_output" | grep -qE "^error" && return 1
            echo "$test_output" | grep -q "FAILED" && return 1
            echo "$test_output" | grep -q "test result: ok" || return 1
            echo "$test_output" | grep -qE "[1-9][0-9]* passed" || return 1
            return 0
            ;;

        bridge)
            echo "$test_output" | grep -q "ARTIFACTS_PRESENT" || return 1
            echo "$test_output" | grep -q "COPIED_TO_FRONTEND" || return 1
            echo "$test_output" | grep -qE "^error" && return 1
            return 0
            ;;

        frontend)
            echo "$test_output" | grep -q "FAIL" && return 1
            # Phase 5: also require CSS size check pass
            if [[ "$stage" == P5-* ]]; then
                echo "$test_output" | grep -q "CSS_SIZE_CHECK=PASS" || return 1
            fi
            echo "$test_output" | grep -qiE "[1-9][0-9]* passed" && return 0
            return 1
            ;;
    esac
}

update_frontier() {
    local stage=$1
    local test_output="$2"
    local iteration=$3
    local workspace="${STAGE_WORKSPACE[$stage]:-engine}"

    # Determine phase label
    local phase_label
    case "$stage" in
        [0-9]|1[0-2]) phase_label="Phase 1: Engine Core" ;;
        P2-*)         phase_label="Phase 2: WASM Bridge" ;;
        P3-*)         phase_label="Phase 3: Frontend Foundation" ;;
        P4-*)         phase_label="Phase 4: Frontend Components" ;;
        P5-*)         phase_label="Phase 5: UI Polish" ;;
        *)            phase_label="Unknown" ;;
    esac

    # Preserve existing work log
    local existing_log
    existing_log=$(grep "^- iter" "$CURRENT_STAGE_FILE" 2>/dev/null || echo "(no iterations yet)")

    cat > "$CURRENT_STAGE_FILE" << FRONTIER_EOF
# Current Stage: $stage (${STAGE_NAMES[$stage]})

## $phase_label
## Workspace: $workspace

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

    mkdir -p "$WORK_DIR/status"
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

    echo "=== Forward Ralph v2: Stage $stage (${STAGE_NAMES[$stage]}) ==="

    if ! check_dependencies "$stage"; then
        exit 1
    fi

    if stage_complete "$stage"; then
        echo "Stage $stage is already complete."
        cat "$WORK_DIR/status/stage-${stage}-complete.txt"
        return 0
    fi

    local iteration=0
    local failures=0
    local consecutive_passes=0
    local required_passes=1
    # Stage 12 (fuzz) requires 4 consecutive passes
    if [ "$stage" = "12" ]; then
        required_passes=4
    fi

    while [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
        iteration=$((iteration + 1))
        echo ""
        echo "--- Stage $stage, Iteration $iteration / $MAX_ITERATIONS ---"
        echo "$(date '+%Y-%m-%d %H:%M:%S')"

        mkdir -p "$WORK_DIR/frontier"
        local test_output
        test_output=$(run_tests "$stage")

        update_frontier "$stage" "$test_output" "$iteration"

        if [ "$test_output" != "NO_TESTS" ] && [ "$test_output" != "MISSING_DEPS" ] && tests_pass "$stage" "$test_output"; then
            consecutive_passes=$((consecutive_passes + 1))
            echo "Tests pass ($consecutive_passes/$required_passes consecutive passes)"
            if [ "$consecutive_passes" -ge "$required_passes" ]; then
                write_completion "$stage" "$test_output" "$iteration"
                return 0
            fi
            continue
        else
            consecutive_passes=0
        fi

        local iter_log="/tmp/forward-ralph-v2-stage-${stage}-iter-${iteration}.log"
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
        echo "ERROR: Unknown stage '$STAGE'. Valid stages: ${DEV_ORDER[*]}"
        exit 1
    fi
    run_stage "$STAGE"
fi
