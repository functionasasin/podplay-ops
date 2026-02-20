#!/bin/bash
# Reverse Ralph Loop — Anime Recap Video Analysis
# Runs Claude Code repeatedly until analysis converges into a software spec.
#
# Usage: cd automations/anime-recap-reverse-ralph && ./reverse-ralph.sh

set -euo pipefail

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
STATUS_FILE="$WORK_DIR/status/converged.txt"
MAX_ITERATIONS=40
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

    # Run Claude Code with the prompt
    cat "$PROMPT_FILE" | claude --print 2>&1 | tee "/tmp/reverse-ralph-iter-${iteration}.log"

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
