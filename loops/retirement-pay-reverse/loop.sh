#!/bin/bash
# Reverse Ralph Loop — RA 7641 Retirement Pay Calculator
#
# Usage:
#   ./loop.sh          # Run one iteration (analyze next pending aspect)
#   ./loop.sh auto     # Run until convergence or max iterations
#   ./loop.sh N        # Run up to N iterations
#
# This loop produces a complete full-stack spec for the RA 7641 Retirement Pay
# Calculator: Rust engine, WASM bridge, React frontend, Supabase platform, Fly.io deployment.

set -uo pipefail

unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
FRONTIER_FILE="$WORK_DIR/frontier/aspects.md"
MAX_ITERATIONS=${1:-1}
SLEEP_BETWEEN=5

if [ "$MAX_ITERATIONS" = "auto" ]; then
    MAX_ITERATIONS=60
fi

cd "$WORK_DIR"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: PROMPT.md not found at $PROMPT_FILE"
    exit 1
fi

if [ ! -f "$FRONTIER_FILE" ]; then
    echo "ERROR: frontier/aspects.md not found at $FRONTIER_FILE"
    exit 1
fi

check_converged() {
    [ -f "$WORK_DIR/status/converged.txt" ]
}

count_pending() {
    grep -c '^\- \[ \]' "$FRONTIER_FILE" 2>/dev/null || echo 0
}

iteration=0
failures=0

while [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
    iteration=$((iteration + 1))

    if check_converged; then
        echo "=== CONVERGED ==="
        cat "$WORK_DIR/status/converged.txt"
        exit 0
    fi

    pending=$(count_pending)
    if [ "$pending" -eq 0 ]; then
        echo "All aspects checked. Convergence should be written by the agent."
    fi

    echo ""
    echo "=== Iteration $iteration / $MAX_ITERATIONS (${pending} aspects pending) ==="
    echo "$(date '+%Y-%m-%d %H:%M:%S')"

    iter_log="/tmp/retirement-pay-reverse-iter-${iteration}.log"
    if timeout 1800 bash -c \
        'unset CLAUDECODE; cat "$1" | stdbuf -oL claude --print --dangerously-skip-permissions' \
        _ "$PROMPT_FILE" 2>&1 | stdbuf -oL tee "$iter_log"; then
        echo ""
        echo "Iteration $iteration completed successfully."
        failures=0
    else
        iter_exit=$?
        if [ "$iter_exit" -eq 124 ]; then
            echo "WARNING: Iteration $iteration timed out after 1800s"
        else
            echo "WARNING: Iteration $iteration exited with code $iter_exit"
        fi
        failures=$((failures + 1))
        if [ "$failures" -ge 3 ]; then
            echo "ERROR: 3 consecutive failures. Stopping."
            exit 1
        fi
    fi

    if check_converged; then
        echo ""
        echo "=== CONVERGED after $iteration iterations ==="
        cat "$WORK_DIR/status/converged.txt"
        exit 0
    fi

    if [ "$iteration" -lt "$MAX_ITERATIONS" ]; then
        echo "Sleeping ${SLEEP_BETWEEN}s..."
        sleep "$SLEEP_BETWEEN"
    fi
done

echo ""
echo "=== Reached max iterations ($MAX_ITERATIONS) without convergence ==="
echo "Pending aspects: $(count_pending)"
exit 1
