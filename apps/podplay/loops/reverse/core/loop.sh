#!/usr/bin/env bash
set -euo pipefail

LOOP_DIR="$(cd "$(dirname "$0")" && pwd)"
MAX_ITERATIONS="${1:-50}"
SLEEP_BETWEEN=5
CONSECUTIVE_FAILURES=0
MAX_FAILURES=3

cd "$LOOP_DIR/../../../.."  # monorepo root

echo "=== PodPlay Reverse Loop ==="
echo "Loop dir: $LOOP_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo "--- Iteration $i / $MAX_ITERATIONS ---"

  # Check convergence
  if [ -f "$LOOP_DIR/status/converged.txt" ]; then
    echo "CONVERGED! Exiting."
    exit 0
  fi

  # Check pause
  if [ -f "$LOOP_DIR/status/paused.txt" ]; then
    echo "PAUSED. Exiting."
    exit 0
  fi

  # Run one iteration
  if cat "$LOOP_DIR/PROMPT.md" | claude --print --dangerously-skip-permissions 2>&1; then
    CONSECUTIVE_FAILURES=0
    echo "Iteration $i complete."
  else
    CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
    echo "Iteration $i FAILED ($CONSECUTIVE_FAILURES consecutive failures)"
    if [ "$CONSECUTIVE_FAILURES" -ge "$MAX_FAILURES" ]; then
      echo "Max consecutive failures reached. Stopping."
      exit 1
    fi
  fi

  # Push commits
  git push origin main 2>/dev/null || true

  sleep "$SLEEP_BETWEEN"
done

echo "Max iterations reached without convergence."
exit 0
