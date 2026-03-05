#!/bin/bash
# Forward Ralph Loop — Inheritance WASM Integration
# Wires the real Rust inheritance engine (compiled to WASM) into the React frontend.
#
# Usage:
#   ./forward-ralph.sh [stage_number]   # Build a specific stage (1-5)
#   ./forward-ralph.sh                  # Auto-detect lowest incomplete stage
#   ./forward-ralph.sh all              # Build all stages sequentially

set -uo pipefail

unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_DIR="$(cd "$WORK_DIR/../.." && pwd)"
RUST_DIR="$MONO_DIR/loops/inheritance-rust-forward"
FRONTEND_DIR="$MONO_DIR/loops/inheritance-frontend-forward"
APP_DIR="$FRONTEND_DIR/app"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
CURRENT_STAGE_FILE="$WORK_DIR/frontier/current-stage.md"
MAX_ITERATIONS=${2:-30}
SLEEP_BETWEEN=5

# Dev order (sequential)
DEV_ORDER=(1 2 3 4 5)

# Stage names for display
declare -A STAGE_NAMES=(
    [1]="Rust WASM Export"
    [2]="wasm-pack Build"
    [3]="Frontend WASM Integration"
    [4]="Form Data Conformance"
    [5]="Scenario Coverage"
)

# Stage dependencies (space-separated upstream stage numbers)
declare -A STAGE_DEPS=(
    [1]=""
    [2]="1"
    [3]="2"
    [4]="3"
    [5]="4"
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
    local output

    case $stage in
        1)
            # Stage 1: cargo check for wasm32 target
            if [ ! -f "$RUST_DIR/Cargo.toml" ]; then
                echo "NO_RUST_DIR"
                return
            fi
            # Ensure target is installed
            rustup target add wasm32-unknown-unknown 2>/dev/null || true
            output=$(cd "$RUST_DIR" && cargo check --target wasm32-unknown-unknown --lib 2>&1) || true
            # Also verify existing tests still pass
            local test_output
            test_output=$(cd "$RUST_DIR" && cargo test --lib 2>&1) || true
            echo "$output"
            echo "---NATIVE_TESTS---"
            echo "$test_output"
            ;;
        2)
            # Stage 2: wasm-pack build produces valid artifacts
            if ! command -v wasm-pack &>/dev/null; then
                echo "WASM_PACK_NOT_INSTALLED"
                return
            fi
            output=$(cd "$RUST_DIR" && wasm-pack build --target web --out-dir pkg 2>&1) || true
            echo "$output"
            echo "---ARTIFACT_CHECK---"
            if [ -f "$RUST_DIR/pkg/inheritance_engine_bg.wasm" ] && \
               [ -f "$RUST_DIR/pkg/inheritance_engine.js" ] && \
               [ -f "$RUST_DIR/pkg/inheritance_engine.d.ts" ]; then
                echo "ARTIFACTS_PRESENT"
                # Copy to frontend
                mkdir -p "$APP_DIR/src/wasm/pkg"
                cp -r "$RUST_DIR/pkg/"* "$APP_DIR/src/wasm/pkg/"
                echo "COPIED_TO_FRONTEND"
            else
                echo "ARTIFACTS_MISSING"
            fi
            ;;
        3)
            # Stage 3: vitest wasm-live tests
            if [ ! -d "$APP_DIR/node_modules" ]; then
                echo "MISSING_DEPS"
                return
            fi
            output=$(cd "$APP_DIR" && npx vitest run --reporter=verbose --no-color wasm-live 2>&1) || true
            echo "$output"
            ;;
        4)
            # Stage 4: vitest conformance tests
            if [ ! -d "$APP_DIR/node_modules" ]; then
                echo "MISSING_DEPS"
                return
            fi
            output=$(cd "$APP_DIR" && npx vitest run --reporter=verbose --no-color conformance 2>&1) || true
            echo "$output"
            ;;
        5)
            # Stage 5: vitest scenario-coverage tests
            if [ ! -d "$APP_DIR/node_modules" ]; then
                echo "MISSING_DEPS"
                return
            fi
            output=$(cd "$APP_DIR" && npx vitest run --reporter=verbose --no-color scenario-coverage 2>&1) || true
            echo "$output"
            ;;
    esac
}

tests_pass() {
    local stage=$1
    local test_output="$2"

    case $stage in
        1)
            # Must NOT contain "error[E" and native tests must pass
            echo "$test_output" | grep -q "error\[E" && return 1
            echo "$test_output" | grep -q "could not compile" && return 1
            # Check native tests still pass
            echo "$test_output" | grep -q "test result: FAILED" && return 1
            return 0
            ;;
        2)
            # Must contain ARTIFACTS_PRESENT and COPIED_TO_FRONTEND
            echo "$test_output" | grep -q "ARTIFACTS_PRESENT" || return 1
            echo "$test_output" | grep -q "COPIED_TO_FRONTEND" || return 1
            echo "$test_output" | grep -q "error" && return 1
            return 0
            ;;
        3|4|5)
            # Standard vitest pass check
            echo "$test_output" | grep -q "FAIL" && return 1
            echo "$test_output" | grep -qE "Tests\s+[1-9][0-9]*\s+passed" || return 1
            return 0
            ;;
    esac
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
        1) spec_sections="- Rust engine: loops/inheritance-rust-forward/src/\n- Add wasm-bindgen dep, [lib] crate-type, wasm.rs with compute_json export" ;;
        2) spec_sections="- Build: wasm-pack build --target web\n- Copy pkg/ to frontend app/src/wasm/pkg/" ;;
        3) spec_sections="- Frontend: loops/inheritance-frontend-forward/app/src/wasm/bridge.ts\n- Replace mock with real WASM import, add Vite plugins" ;;
        4) spec_sections="- Form data: WizardContainer defaults → JSON → Rust serde\n- Fix type mismatches (string vs bool, string vs number)" ;;
        5) spec_sections="- Scenario vectors: T1-T15, I1-I15 representative cases\n- Validate per_heir_shares sum, scenario_code, narrative count" ;;
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

    local test_count="passed"
    if echo "$test_output" | grep -qoE "[0-9]+ passed"; then
        test_count=$(echo "$test_output" | grep -oE "[0-9]+ passed" | head -1)
    fi

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
        if [ "$test_output" != "NO_RUST_DIR" ] && \
           [ "$test_output" != "MISSING_DEPS" ] && \
           [ "$test_output" != "WASM_PACK_NOT_INSTALLED" ] && \
           tests_pass "$stage" "$test_output"; then
            write_completion "$stage" "$test_output" "$iteration"
            return 0
        fi

        # Run Claude
        local iter_log="/tmp/forward-ralph-wasm-stage-${stage}-iter-${iteration}.log"
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
        echo "ERROR: Unknown stage '$STAGE'. Valid: 1 2 3 4 5 all"
        exit 1
    fi
    run_stage "$STAGE"
fi
