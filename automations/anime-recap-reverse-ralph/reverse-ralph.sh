#!/bin/bash
# Reverse Ralph Loop — Anime Recap Video Analysis
# Runs Claude Code repeatedly until analysis converges into a software spec.
#
# Usage: cd automations/anime-recap-reverse-ralph && ./reverse-ralph.sh

set -euo pipefail

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

echo "=== Reverse Ralph Loop Starting ==="
echo "Working directory: $WORK_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

while [ ! -f "$STATUS_FILE" ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
    iteration=$((iteration + 1))
    echo "--- Iteration $iteration / $MAX_ITERATIONS ---"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"

    # Run Claude Code with the prompt (bypass permissions for autonomous operation)
    # Timeout per iteration: 10 minutes for tool-heavy tasks, most finish in 2-5 min
    timeout 600 bash -c 'unset CLAUDECODE; cat "$1" | claude --print --dangerously-skip-permissions' _ "$PROMPT_FILE" 2>&1 | tee "/tmp/reverse-ralph-iter-${iteration}.log"
    iter_exit=$?
    if [ "$iter_exit" -eq 124 ]; then
        echo "WARNING: Iteration $iteration timed out after 600s"
    fi

    echo ""
    echo "Iteration $iteration complete. Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
done

if [ -f "$STATUS_FILE" ]; then
    echo ""
    echo "=== CONVERGED after $iteration iterations ==="
    echo "Spec at: docs/plans/anime-recap-engine-spec.md"
    cat "$STATUS_FILE"
else
    echo ""
    echo "=== STOPPED: Max iterations ($MAX_ITERATIONS) reached without convergence ==="
    echo "Check frontier/aspects.md for remaining work."
fi
