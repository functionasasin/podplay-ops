#!/bin/bash
# Forward Ralph Loop — Fullstack Rust-WASM Template
# Multi-workspace runner: Rust engine + WASM bridge + React frontend in one loop.
#
# Usage:
#   ./forward-ralph.sh [stage]    # Build a specific stage
#   ./forward-ralph.sh            # Auto-detect lowest incomplete stage
#   ./forward-ralph.sh all        # Build all stages sequentially
#
# Customize: Update DEV_ORDER, STAGE_NAMES, STAGE_DEPS, STAGE_TEST_FILTERS,
# and STAGE_WORKSPACE for your product's stages.

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

# ============================================================
# CUSTOMIZE BELOW: Define your product's stages
# ============================================================

# Stage execution order
DEV_ORDER=(
    # Phase 1: Engine Core
    0
    # 1 2 3 ...  (add your pipeline stages)
    # Phase 2: WASM Bridge
    # P2-1 P2-2
    # Phase 3: Frontend Foundation
    # P3-1 P3-2 P3-3
    # Phase 4: Frontend Components
    # P4-1 P4-2 ...
    # Phase 5: UI Polish
    # P5-1 P5-2 P5-3
)

# Human-readable stage names
declare -A STAGE_NAMES=(
    [0]="Scaffold + Types"
    # [1]="Pipeline Step 1"
    # [P2-1]="WASM Export"
    # [P2-2]="WASM Build + Copy"
    # [P3-1]="Vite + React Scaffold"
    # [P3-2]="Types + Schemas"
    # [P3-3]="WASM Bridge (Real)"
    # [P4-1]="Shared Components"
    # [P5-1]="Design System Setup"
    # [P5-2]="Component Restyle"
    # [P5-3]="Responsive + Polish"
)

# Dependencies (space-separated upstream stage IDs)
declare -A STAGE_DEPS=(
    [0]=""
    # [1]="0"
    # [P2-1]="<last-engine-stage>"
    # [P2-2]="P2-1"
    # [P3-1]="P2-2"
    # [P3-2]="P3-1"
    # [P3-3]="P3-2 P2-2"
    # [P4-1]="P3-3"
    # [P5-1]="<last-P4-stage>"
    # [P5-2]="P5-1"
    # [P5-3]="P5-2"
)

# Which workspace each stage runs in: "engine" or "frontend" or "bridge"
declare -A STAGE_WORKSPACE=(
    [0]="engine"
    # [1]="engine"
    # [P2-1]="engine"
    # [P2-2]="bridge"    # Special: builds WASM and copies to frontend
    # [P3-1]="frontend"
    # [P3-2]="frontend"
    # [P3-3]="frontend"
    # [P4-1]="frontend"
    # [P5-1]="frontend"
    # [P5-2]="frontend"
    # [P5-3]="frontend"
)

# Test filter patterns
declare -A STAGE_TEST_FILTERS=(
    [0]="types"
    # Engine stages: cargo test filter (e.g., "step1", "step2")
    # Frontend stages: vitest filter pattern (e.g., "shared", "wizard")
    # Bridge stages: use "BRIDGE" sentinel (handled specially)
)

# ============================================================
# END CUSTOMIZATION
# ============================================================

cd "$WORK_DIR"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: PROMPT.md not found at $PROMPT_FILE"
    exit 1
fi

# --- Helper functions ---

stage_complete() {
    [ -f "$WORK_DIR/status/stage-${1}-complete.txt" ]
}

# Scan source files for stub/placeholder patterns that indicate incomplete implementations.
# Returns 0 if clean, 1 if stubs found. Writes results to status/stub-scan.txt.
stub_scan() {
    local stage=$1
    local workspace="${STAGE_WORKSPACE[$stage]:-engine}"
    local scan_dir=""
    local scan_patterns=""
    local results_file="$WORK_DIR/status/stub-scan.txt"

    mkdir -p "$WORK_DIR/status"

    case "$workspace" in
        engine|bridge)
            scan_dir="$ENGINE_DIR/src"
            # Rust stub patterns
            scan_patterns='todo!\(\)|unimplemented!\(\)|panic!\("not implemented"\)|// TODO|// FIXME|// STUB|// PLACEHOLDER|// HACK|/\* TODO'
            ;;
        frontend)
            scan_dir="$FRONTEND_DIR/src"
            # TypeScript/React stub patterns
            scan_patterns='// TODO|// FIXME|// STUB|// PLACEHOLDER|// HACK|throw new Error\("not implemented"\)|console\.log\("TODO|return null;?\s*$|return <><\/>;|return <div\s*\/>'
            ;;
        *)
            echo "STUB_SCAN: unknown workspace $workspace, skipping"
            return 0
            ;;
    esac

    if [ ! -d "$scan_dir" ]; then
        echo "STUB_SCAN: $scan_dir does not exist yet, skipping"
        return 0
    fi

    # Exclude test files from the scan
    local stub_matches
    stub_matches=$(grep -rn --include='*.rs' --include='*.ts' --include='*.tsx' \
        --exclude='*test*' --exclude='*_test*' --exclude='*.test.*' --exclude='*spec.*' \
        -E "$scan_patterns" "$scan_dir" 2>/dev/null || true)

    if [ -n "$stub_matches" ]; then
        local match_count
        match_count=$(echo "$stub_matches" | wc -l)
        cat > "$results_file" << SCAN_EOF
FAIL — $match_count stub(s) found in production code
Stage: $stage (${STAGE_NAMES[$stage]})
Timestamp: $(date -Iseconds)

Matches:
$stub_matches

These must be replaced with full implementations before the stage can converge.
SCAN_EOF
        echo "STUB_SCAN: FAIL — $match_count stub(s) found:"
        echo "$stub_matches"
        return 1
    else
        cat > "$results_file" << SCAN_EOF
PASS — zero stubs in production code
Stage: $stage (${STAGE_NAMES[$stage]})
Timestamp: $(date -Iseconds)
SCAN_EOF
        echo "STUB_SCAN: PASS — clean"
        return 0
    fi
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
    echo "-1"  # All complete
}

run_tests() {
    local stage=$1
    local workspace="${STAGE_WORKSPACE[$stage]:-engine}"
    local filter="${STAGE_TEST_FILTERS[$stage]:-}"

    case "$workspace" in
        engine)
            # Rust tests
            if [ ! -f "$ENGINE_DIR/Cargo.toml" ]; then
                echo "NO_TESTS"
                return
            fi
            local output
            if [[ "$filter" == *"integration"* ]]; then
                output=$(cd "$ENGINE_DIR" && cargo test --test integration 2>&1) || true
            elif [[ "$filter" == *"fuzz"* ]]; then
                output=$(cd "$ENGINE_DIR" && cargo test --test fuzz_invariants 2>&1) || true
            else
                output=$(cd "$ENGINE_DIR" && cargo test "$filter" 2>&1) || true
            fi
            echo "$output"
            ;;

        bridge)
            # WASM bridge: build + verify + copy
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
                if [ -f "$WASM_PKG_SRC/inheritance_engine_bg.wasm" ] || ls "$WASM_PKG_SRC"/*.wasm &>/dev/null 2>&1; then
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
                output+="wasm-pack not installed. Install with: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"$'\n'
            fi

            echo "$output"
            ;;

        frontend)
            # Frontend tests (vitest)
            if [ ! -f "$FRONTEND_DIR/package.json" ]; then
                echo "NO_TESTS"
                return
            fi
            if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
                echo "MISSING_DEPS"
                return
            fi
            local output
            if [ -n "$filter" ]; then
                output=$(cd "$FRONTEND_DIR" && npx vitest run --reporter=verbose "$filter" 2>&1) || true
            else
                output=$(cd "$FRONTEND_DIR" && npx vitest run --reporter=verbose 2>&1) || true
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
            # Rust: must have "test result: ok" and at least 1 passed
            echo "$test_output" | grep -qE "^error" && return 1
            echo "$test_output" | grep -q "FAILED" && return 1
            echo "$test_output" | grep -q "test result: ok" || return 1
            echo "$test_output" | grep -qE "[1-9][0-9]* passed" || return 1
            return 0
            ;;

        bridge)
            # WASM bridge: must have ARTIFACTS_PRESENT and COPIED_TO_FRONTEND
            echo "$test_output" | grep -q "ARTIFACTS_PRESENT" || return 1
            echo "$test_output" | grep -q "COPIED_TO_FRONTEND" || return 1
            echo "$test_output" | grep -qE "^error" && return 1
            return 0
            ;;

        frontend)
            # Vitest: must not have "FAIL" and must have passed tests
            echo "$test_output" | grep -q "FAIL" && return 1
            echo "$test_output" | grep -qiE "Tests\s+[1-9][0-9]*\s+passed" && return 0
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

    # Preserve existing work log
    local existing_log
    existing_log=$(grep "^- iter" "$CURRENT_STAGE_FILE" 2>/dev/null || echo "(no iterations yet)")

    # Include stub scan results if they exist
    local stub_scan_status=""
    if [ -f "$WORK_DIR/status/stub-scan.txt" ]; then
        stub_scan_status=$(cat "$WORK_DIR/status/stub-scan.txt")
    fi

    cat > "$CURRENT_STAGE_FILE" << FRONTIER_EOF
# Current Stage: $stage (${STAGE_NAMES[$stage]})

## Workspace: $workspace
## Phase: $(echo "$stage" | grep -oP 'P\d+' || echo "1 (Engine)")

## Test Results (updated by loop — iteration $iteration)
\`\`\`
$test_output
\`\`\`

## Stub Scan Results
\`\`\`
${stub_scan_status:-Not yet run}
\`\`\`

**IMPORTANT**: If the stub scan shows FAIL, your priority is to REPLACE the listed stubs with full implementations from the spec. Do not just remove TODO comments — implement the actual feature logic.

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
    local consecutive_passes=0
    # Fuzz stages need 4 consecutive passes; everything else needs 1
    local required_passes=1
    if [[ "$stage" == *"fuzz"* ]] || [[ "${STAGE_NAMES[$stage]:-}" == *"Fuzz"* ]]; then
        required_passes=4
    fi

    while [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
        iteration=$((iteration + 1))
        echo ""
        echo "--- Stage $stage, Iteration $iteration / $MAX_ITERATIONS ---"
        echo "$(date '+%Y-%m-%d %H:%M:%S')"

        # Run tests and update frontier
        mkdir -p "$WORK_DIR/frontier"
        local test_output
        test_output=$(run_tests "$stage")

        update_frontier "$stage" "$test_output" "$iteration"

        # Check convergence
        if [ "$test_output" != "NO_TESTS" ] && [ "$test_output" != "MISSING_DEPS" ] && tests_pass "$stage" "$test_output"; then
            consecutive_passes=$((consecutive_passes + 1))
            echo "Tests pass ($consecutive_passes/$required_passes consecutive passes)"
            if [ "$consecutive_passes" -ge "$required_passes" ]; then
                # HARD GATE: Stub scan must pass before declaring stage complete
                if stub_scan "$stage"; then
                    write_completion "$stage" "$test_output" "$iteration"
                    return 0
                else
                    echo "Tests pass but stubs remain — not converged. Running Claude to replace stubs."
                    consecutive_passes=0
                    # Fall through to invoke Claude to fix the stubs
                fi
            fi
            # For multi-pass stages, re-test without invoking Claude
            continue
        else
            consecutive_passes=0
        fi

        # Run Claude
        local iter_log="/tmp/forward-ralph-$(basename "$WORK_DIR")-stage-${stage}-iter-${iteration}.log"
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
