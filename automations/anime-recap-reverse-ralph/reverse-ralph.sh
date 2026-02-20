#!/bin/bash
# Reverse Ralph Loop — Anime Recap Video Analysis
# Runs Claude Code repeatedly until analysis converges into a software spec.
#
# Usage: cd automations/anime-recap-reverse-ralph && ./reverse-ralph.sh [max_iterations]

# Don't use set -e — we want the loop to continue even if an iteration fails
set -uo pipefail

# Allow nested Claude Code sessions
unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
STATUS_FILE="$WORK_DIR/status/converged.txt"
MAX_ITERATIONS=${1:-40}
SLEEP_BETWEEN=5

cd "$WORK_DIR"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: PROMPT.md not found at $PROMPT_FILE"
    exit 1
fi

iteration=0
failures=0

echo "=== Reverse Ralph Loop Starting ==="
echo "Working directory: $WORK_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

while [ ! -f "$STATUS_FILE" ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
    iteration=$((iteration + 1))
    echo "--- Iteration $iteration / $MAX_ITERATIONS ---"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"

    # Run Claude Code with the prompt (bypass permissions for autonomous operation)
    # Timeout per iteration: 30 minutes (audio analysis on 75-min video needs ~15 min)
    # Use stdbuf to disable buffering so tee shows output in real time
    iter_log="/tmp/reverse-ralph-iter-${iteration}.log"
    if timeout 1800 bash -c 'unset CLAUDECODE; cat "$1" | stdbuf -oL claude --print --dangerously-skip-permissions' _ "$PROMPT_FILE" 2>&1 | stdbuf -oL tee "$iter_log"; then
        echo ""
        echo "Iteration $iteration completed successfully."
    else
        iter_exit=$?
        if [ "$iter_exit" -eq 124 ]; then
            echo "WARNING: Iteration $iteration timed out after 1800s"
        else
            echo "WARNING: Iteration $iteration exited with code $iter_exit"
        fi
        failures=$((failures + 1))
        # If 3 consecutive failures, something is fundamentally broken
        if [ "$failures" -ge 3 ]; then
            echo "ERROR: 3 consecutive failures. Stopping loop."
            break
        fi
    fi

    echo "Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
done

echo ""
echo "=== Loop Summary ==="
echo "Iterations run: $iteration"
echo "Failures: $failures"

if [ -f "$STATUS_FILE" ]; then
    echo "Status: CONVERGED"
    echo "Spec at: docs/plans/anime-recap-engine-spec.md"
    cat "$STATUS_FILE"
elif [ "$iteration" -ge "$MAX_ITERATIONS" ]; then
    echo "Status: STOPPED (max iterations reached)"
    echo "Check frontier/aspects.md for remaining work."
else
    echo "Status: STOPPED (failures)"
    echo "Check /tmp/reverse-ralph-iter-*.log for details."
fi
