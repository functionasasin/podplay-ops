#!/bin/bash
# Reverse Ralph Loop — GitHub Profile Audit
# Analyzes clsandoval's GitHub profile and produces a profile spec.
#
# Usage: cd loops/github-profile-reverse && ./reverse-ralph.sh [max_iterations]

# Don't use set -e — we want the loop to continue even if an iteration fails
set -uo pipefail

# Allow nested Claude Code sessions
unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
LOOP_NAME="github-profile-reverse"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
STATUS_FILE="$WORK_DIR/status/converged.txt"
PAUSED_FILE="$WORK_DIR/status/paused.txt"
MAX_ITERATIONS=${1:-25}
SLEEP_BETWEEN=5

cd "$WORK_DIR"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "ERROR: PROMPT.md not found at $PROMPT_FILE"
    exit 1
fi

if [ -f "$PAUSED_FILE" ]; then
    echo "Loop '$LOOP_NAME' is paused. Remove status/paused.txt to resume."
    exit 0
fi

if [ -f "$STATUS_FILE" ]; then
    echo "Loop '$LOOP_NAME' already converged."
    cat "$STATUS_FILE"
    exit 0
fi

mkdir -p status raw

iteration=0
failures=0

echo "=== Reverse Ralph Loop Starting: $LOOP_NAME ==="
echo "Working directory: $WORK_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

while [ ! -f "$STATUS_FILE" ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
    iteration=$((iteration + 1))
    echo "--- Iteration $iteration / $MAX_ITERATIONS ---"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"

    # Run Claude Code with the prompt
    # Timeout per iteration: 10 minutes (no heavy processing like video/audio)
    iter_log="/tmp/ralph-${LOOP_NAME}-iter-${iteration}.log"
    if timeout 600 bash -c 'unset CLAUDECODE; cat "$1" | stdbuf -oL claude --print --dangerously-skip-permissions' _ "$PROMPT_FILE" 2>&1 | stdbuf -oL tee "$iter_log"; then
        echo ""
        echo "Iteration $iteration completed successfully."
        failures=0
    else
        iter_exit=$?
        if [ "$iter_exit" -eq 124 ]; then
            echo "WARNING: Iteration $iteration timed out after 600s"
        else
            echo "WARNING: Iteration $iteration exited with code $iter_exit"
        fi
        failures=$((failures + 1))
        if [ "$failures" -ge 3 ]; then
            echo "ERROR: 3 consecutive failures. Stopping loop."
            break
        fi
    fi

    echo "Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
done

echo ""
echo "=== Loop Summary: $LOOP_NAME ==="
echo "Iterations run: $iteration"
echo "Failures: $failures"

if [ -f "$STATUS_FILE" ]; then
    echo "Status: CONVERGED"
    echo "Spec at: docs/plans/github-profile-spec.md"
    cat "$STATUS_FILE"
elif [ "$iteration" -ge "$MAX_ITERATIONS" ]; then
    echo "Status: STOPPED (max iterations reached)"
    echo "Check frontier/aspects.md for remaining work."
else
    echo "Status: STOPPED (failures)"
    echo "Check /tmp/ralph-${LOOP_NAME}-iter-*.log for details."
fi
