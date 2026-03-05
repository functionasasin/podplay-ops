#!/bin/bash
# Forward Ralph Loop — Inheritance Platform Layer Fix
# Implements 104 platform gaps from inheritance-platform-spec.md
# into the existing inheritance-frontend-forward/app/ codebase.
#
# Usage:
#   ./forward-ralph.sh [stage]    # Build a specific stage
#   ./forward-ralph.sh            # Auto-detect lowest incomplete stage
#   ./forward-ralph.sh all        # Build all stages sequentially

set -uo pipefail

unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
CURRENT_STAGE_FILE="$WORK_DIR/frontier/current-stage.md"
APP_DIR="$WORK_DIR/../inheritance-frontend-forward/app"
MAX_ITERATIONS=${2:-40}
SLEEP_BETWEEN=5

# ============================================================
# Stage definitions
# ============================================================

DEV_ORDER=(1 2 3 4 5 6 7 8)

declare -A STAGE_NAMES=(
    [1]="Foundation"
    [2]="Router + Auth"
    [3]="Routes + Navigation"
    [4]="Core Flows"
    [5]="Settings + Team"
    [6]="Design System"
    [7]="Responsive + Polish"
    [8]="Verification"
)

declare -A STAGE_DEPS=(
    [1]=""
    [2]="1"
    [3]="2"
    [4]="3"
    [5]="3"
    [6]="4"
    [7]="6"
    [8]="1 2 3 4 5 6 7"
)

# ============================================================
# Helper functions
# ============================================================

cd "$WORK_DIR"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: PROMPT.md not found at $PROMPT_FILE"
    exit 1
fi

stage_complete() {
    [ -f "$WORK_DIR/status/stage-${1}-complete.txt" ]
}

# Scan source files for stub/placeholder patterns.
# Returns 0 if clean, 1 if stubs found.
stub_scan() {
    local scan_dir="$APP_DIR/src"
    local results_file="$WORK_DIR/status/stub-scan.txt"

    mkdir -p "$WORK_DIR/status"

    if [ ! -d "$scan_dir" ]; then
        echo "STUB_SCAN: $scan_dir does not exist, skipping"
        return 0
    fi

    local scan_patterns='// TODO|// FIXME|// STUB|// PLACEHOLDER|// HACK|throw new Error\("not implemented"\)|console\.log\("TODO|return null;?\s*$|return <><\/>;|return <div\s*\/>'

    local stub_matches
    stub_matches=$(grep -rn --include='*.ts' --include='*.tsx' \
        --exclude='*test*' --exclude='*_test*' --exclude='*.test.*' --exclude='*spec.*' \
        -E "$scan_patterns" "$scan_dir" 2>/dev/null || true)

    if [ -n "$stub_matches" ]; then
        local match_count
        match_count=$(echo "$stub_matches" | wc -l)
        cat > "$results_file" << SCAN_EOF
FAIL — $match_count stub(s) found in production code
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
Timestamp: $(date -Iseconds)
SCAN_EOF
        echo "STUB_SCAN: PASS — clean"
        return 0
    fi
}

# Scan for orphaned components — exported but never imported by any route or parent.
orphan_scan() {
    local app_src="$APP_DIR/src"
    local orphans=0
    local results_file="$WORK_DIR/status/orphan-scan.txt"

    mkdir -p "$WORK_DIR/status"

    if [ ! -d "$app_src/components" ]; then
        echo "ORPHAN_SCAN: components directory does not exist, skipping"
        echo "PASS — components directory does not exist yet" > "$results_file"
        return 0
    fi

    local orphan_details=""

    for comp_file in $(find "$app_src/components" -name "*.tsx" -not -name "*.test.*" -not -path "*/ui/*" -not -path "*/__tests__/*"); do
        local exports
        exports=$(grep -oP 'export\s+(function|const)\s+\K\w+' "$comp_file" 2>/dev/null || true)
        for exp in $exports; do
            local importers
            importers=$(grep -rl "$exp" "$app_src/routes/" "$app_src/components/" 2>/dev/null | grep -v "$comp_file" | grep -v ".test." | head -1)
            if [ -z "$importers" ]; then
                orphan_details+="ORPHAN: $exp in $comp_file — not imported by any route or parent component"$'\n'
                orphans=$((orphans + 1))
            fi
        done
    done

    if [ "$orphans" -gt 0 ]; then
        cat > "$results_file" << ORPHAN_EOF
FAIL — $orphans orphaned component(s) found
Timestamp: $(date -Iseconds)

${orphan_details}
These must be imported by a route or parent component before convergence.
ORPHAN_EOF
        echo "ORPHAN_SCAN: FAIL ($orphans orphaned components)"
        echo "$orphan_details"
        return 1
    else
        cat > "$results_file" << ORPHAN_EOF
PASS — zero orphaned components
Timestamp: $(date -Iseconds)
ORPHAN_EOF
        echo "ORPHAN_SCAN: PASS"
        return 0
    fi
}

check_dependencies() {
    local stage=$1
    local deps="${STAGE_DEPS[$stage]:-}"
    for dep in $deps; do
        if ! stage_complete "$dep"; then
            echo "ERROR: Stage $stage depends on Stage $dep, which is not complete."
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

run_build_check() {
    if [ ! -f "$APP_DIR/package.json" ]; then
        echo "NO_BUILD"
        return
    fi
    if [ ! -d "$APP_DIR/node_modules" ]; then
        echo "MISSING_DEPS"
        return
    fi
    local output
    output=$(cd "$APP_DIR" && npx tsc --noEmit 2>&1) || true
    echo "$output"
}

build_passes() {
    local output="$1"
    # TypeScript check: no errors
    echo "$output" | grep -q "error TS" && return 1
    echo "$output" | grep -q "NO_BUILD" && return 1
    echo "$output" | grep -q "MISSING_DEPS" && return 1
    return 0
}

update_frontier() {
    local stage=$1
    local check_output="$2"
    local iteration=$3

    local existing_log
    existing_log=$(grep "^- iter" "$CURRENT_STAGE_FILE" 2>/dev/null || echo "(no iterations yet)")

    local stub_scan_status=""
    if [ -f "$WORK_DIR/status/stub-scan.txt" ]; then
        stub_scan_status=$(cat "$WORK_DIR/status/stub-scan.txt")
    fi

    local orphan_scan_status=""
    if [ -f "$WORK_DIR/status/orphan-scan.txt" ]; then
        orphan_scan_status=$(cat "$WORK_DIR/status/orphan-scan.txt")
    fi

    cat > "$CURRENT_STAGE_FILE" << FRONTIER_EOF
# Current Stage: $stage (${STAGE_NAMES[$stage]})

## Build Check Results (updated by loop — iteration $iteration)
\`\`\`
$check_output
\`\`\`

## Stub Scan Results
\`\`\`
${stub_scan_status:-Not yet run}
\`\`\`

## Orphan Scan Results
\`\`\`
${orphan_scan_status:-Not yet run}
\`\`\`

**IMPORTANT**: If the build check shows errors, fix them. If stub scan shows FAIL, replace stubs with real implementations. If orphan scan shows FAIL, wire components into their parent routes.

## Work Log
$existing_log
FRONTIER_EOF
}

write_completion() {
    local stage=$1
    local iteration=$2

    mkdir -p "$WORK_DIR/status"
    cat > "$WORK_DIR/status/stage-${stage}-complete.txt" << COMPLETE_EOF
COMPLETE
Stage: $stage (${STAGE_NAMES[$stage]})
Iterations: $iteration
Timestamp: $(date -Iseconds)
COMPLETE_EOF

    echo "=== Stage $stage COMPLETE ==="
    cat "$WORK_DIR/status/stage-${stage}-complete.txt"
}

# ============================================================
# Main logic
# ============================================================

run_stage() {
    local stage=$1

    echo "=== Forward Ralph: Stage $stage (${STAGE_NAMES[$stage]}) ==="

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

    while [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
        iteration=$((iteration + 1))
        echo ""
        echo "--- Stage $stage, Iteration $iteration / $MAX_ITERATIONS ---"
        echo "$(date '+%Y-%m-%d %H:%M:%S')"

        mkdir -p "$WORK_DIR/frontier"
        local check_output
        check_output=$(run_build_check)

        update_frontier "$stage" "$check_output" "$iteration"

        # For verification stage (8), check all scans
        if [ "$stage" -eq 8 ]; then
            if build_passes "$check_output"; then
                local scan_pass=true
                if ! stub_scan; then
                    scan_pass=false
                fi
                if ! orphan_scan; then
                    scan_pass=false
                fi
                if [ "$scan_pass" = true ]; then
                    write_completion "$stage" "$iteration"
                    return 0
                fi
            fi
        fi

        # For non-verification stages, check build after a few iterations
        if [ "$stage" -ne 8 ] && [ "$iteration" -gt 2 ]; then
            if build_passes "$check_output"; then
                consecutive_passes=$((consecutive_passes + 1))
                echo "Build passes ($consecutive_passes/2 consecutive)"
                if [ "$consecutive_passes" -ge 2 ]; then
                    write_completion "$stage" "$iteration"
                    return 0
                fi
                continue
            else
                consecutive_passes=0
            fi
        fi

        # Run Claude
        local iter_log="/tmp/forward-ralph-platform-stage-${stage}-iter-${iteration}.log"
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

# ============================================================
# Entry point
# ============================================================

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
