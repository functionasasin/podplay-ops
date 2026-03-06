#!/usr/bin/env bash
# Local loop runner for TaxKlaro forward loop
# Usage: cd apps/taxklaro/loops/forward && bash loop.sh [max_iterations]

set -euo pipefail

MAX_ITERATIONS="${1:-40}"
LOOP_NAME="taxklaro-forward"
SLEEP_BETWEEN=5
ITERATION=0
FAILURES=0

echo "=== Ralph Forward Loop: $LOOP_NAME ==="
echo "Max iterations: $MAX_ITERATIONS"
echo "Started: $(date)"
echo ""

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  # Check stop conditions
  if [ -f status/paused.txt ]; then
    echo "Loop paused. Remove status/paused.txt to resume."
    break
  fi
  if [ -f status/converged.txt ]; then
    echo "Loop converged!"
    cat status/converged.txt
    break
  fi

  ITERATION=$((ITERATION + 1))
  echo "--- $(date '+%H:%M:%S') | Iteration $ITERATION/$MAX_ITERATIONS ---"

  LOG="/tmp/ralph-${LOOP_NAME}-iter-${ITERATION}.log"

  if cat PROMPT.md | claude --print --dangerously-skip-permissions 2>&1 | tee "$LOG"; then
    FAILURES=0
  else
    EXIT_CODE=$?
    echo "WARNING: iteration $ITERATION exited with code $EXIT_CODE"
    FAILURES=$((FAILURES + 1))
    if [ $FAILURES -ge 3 ]; then
      echo "3 consecutive failures — stopping."
      break
    fi
  fi

  # Commit any uncommitted work
  cd "$(git rev-parse --show-toplevel)"
  git add -A
  git diff --cached --quiet || git commit -m "loop(taxklaro-forward): iteration $ITERATION"
  cd - > /dev/null

  sleep $SLEEP_BETWEEN
done

echo ""
echo "Done. Total iterations: $ITERATION"
echo "Finished: $(date)"
