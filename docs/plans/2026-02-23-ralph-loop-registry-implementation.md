# Ralph Loop Registry — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generalize the ralph loop pattern into a registry-based system with GitHub Actions CI so any idea can go from brainstorm to autonomous 30-minute iteration cycles.

**Architecture:** New `loops/` top-level directory with a YAML registry. One GitHub Actions workflow discovers active loops and runs one iteration per cron trigger. A `brainstorm-ralph` skill produces loop artifacts during brainstorm sessions.

**Tech Stack:** Bash, GitHub Actions, YAML, Claude Code CLI, `yq` for YAML parsing

**Design doc:** `docs/plans/2026-02-23-ralph-loop-registry-design.md`

---

### Task 1: Create loops/ directory and registry

**Files:**
- Create: `loops/_registry.yaml`

**Step 1: Create the registry file**

```yaml
# Ralph Loop Registry
# CI reads this to discover which loops to run.
# Status: active | paused | converged

loops:
  anime-recap-reverse:
    description: "Analyze JarAnime Parasyte recap → software spec"
    type: reverse
    schedule: "*/30 * * * *"
    max_iterations: 40
    timeout_minutes: 30
    status: converged
    created: 2026-02-20
    converged_at: 2026-02-22

  anime-recap-forward:
    description: "Build anime recap engine from spec, stage by stage"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 50
    timeout_minutes: 30
    status: active
    created: 2026-02-22
```

Write this to `loops/_registry.yaml`.

**Step 2: Commit**

```bash
git add loops/_registry.yaml
git commit -m "loops: create registry with existing anime-recap loops"
```

---

### Task 2: Move anime-recap-reverse-ralph to loops/

**Files:**
- Move: `automations/anime-recap-reverse-ralph/` → `loops/anime-recap-reverse/`

**Step 1: Move the directory**

```bash
git mv automations/anime-recap-reverse-ralph loops/anime-recap-reverse
```

**Step 2: Update internal path references in PROMPT.md**

Open `loops/anime-recap-reverse/PROMPT.md`. Change line 7:
```
You are running from `automations/anime-recap-reverse-ralph/`.
```
to:
```
You are running from `loops/anime-recap-reverse/`.
```

Change line 92 (spec-draft path):
```
`../../docs/plans/anime-recap-engine-spec.md` (relative to working dir)
```
to:
```
`../../docs/plans/anime-recap-engine-spec.md` (relative to working dir — i.e. from loops/anime-recap-reverse/)
```
(The relative path `../../docs/plans/` is still correct from `loops/anime-recap-reverse/` since both `automations/` and `loops/` are at root level.)

**Step 3: Update loop.sh working directory comment**

Open `loops/anime-recap-reverse/reverse-ralph.sh`. Change line 5:
```
# Usage: cd automations/anime-recap-reverse-ralph && ./reverse-ralph.sh [max_iterations]
```
to:
```
# Usage: cd loops/anime-recap-reverse && ./reverse-ralph.sh [max_iterations]
```

**Step 4: Commit**

```bash
git add -A
git commit -m "loops: move anime-recap-reverse from automations/"
```

---

### Task 3: Move anime-recap-forward-ralph to loops/

**Files:**
- Move: `automations/anime-recap-forward-ralph/` → `loops/anime-recap-forward/`

**Step 1: Move the directory**

```bash
git mv automations/anime-recap-forward-ralph loops/anime-recap-forward
```

**Step 2: Update internal path references in PROMPT.md**

Open `loops/anime-recap-forward/PROMPT.md`. Find any path references to `automations/anime-recap-forward-ralph/` and update them to `loops/anime-recap-forward/`.

**Step 3: Update forward-ralph.sh**

Open `loops/anime-recap-forward/forward-ralph.sh`. Update:
- The usage comment at the top to reference `loops/anime-recap-forward`
- Any hardcoded path references to `automations/anime-recap-forward-ralph`
- Any references to `automations/anime-recap-engine` (the engine project stays in automations/, so these relative paths need updating from `../anime-recap-engine` to `../../automations/anime-recap-engine`)

**Step 4: Verify the engine path**

The forward loop references the engine at `automations/anime-recap-engine/`. From the new location `loops/anime-recap-forward/`, the relative path to the engine is `../../automations/anime-recap-engine/`. Verify all paths in `forward-ralph.sh` and `PROMPT.md` that reference the engine are updated.

**Step 5: Commit**

```bash
git add -A
git commit -m "loops: move anime-recap-forward from automations/"
```

---

### Task 4: Create standard loop.sh template

**Files:**
- Create: `loops/_template/loop.sh`
- Create: `loops/_template/PROMPT.md.example`
- Create: `loops/_template/frontier/aspects.md.example`

**Step 1: Create the template loop runner**

Write `loops/_template/loop.sh` — a generalized version of `reverse-ralph.sh` that reads config from the loop's own directory:

```bash
#!/bin/bash
# Ralph Loop — Standard Runner
# Runs Claude Code repeatedly until convergence.
#
# Usage: cd loops/<idea-name> && ./loop.sh [max_iterations]

set -uo pipefail

# Allow nested Claude Code sessions
unset CLAUDECODE 2>/dev/null || true

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
LOOP_NAME="$(basename "$WORK_DIR")"
PROMPT_FILE="$WORK_DIR/PROMPT.md"
CONVERGED_FILE="$WORK_DIR/status/converged.txt"
PAUSED_FILE="$WORK_DIR/status/paused.txt"
MAX_ITERATIONS=${1:-40}
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

if [ -f "$CONVERGED_FILE" ]; then
    echo "Loop '$LOOP_NAME' already converged."
    exit 0
fi

mkdir -p status

iteration=0
failures=0

echo "=== Ralph Loop Starting: $LOOP_NAME ==="
echo "Working directory: $WORK_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

while [ ! -f "$CONVERGED_FILE" ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; do
    iteration=$((iteration + 1))
    echo "--- Iteration $iteration / $MAX_ITERATIONS ---"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"

    iter_log="/tmp/ralph-${LOOP_NAME}-iter-${iteration}.log"
    if timeout 1800 bash -c 'unset CLAUDECODE; cat "$1" | stdbuf -oL claude --print --dangerously-skip-permissions' _ "$PROMPT_FILE" 2>&1 | stdbuf -oL tee "$iter_log"; then
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

if [ -f "$CONVERGED_FILE" ]; then
    echo "Status: CONVERGED"
    cat "$CONVERGED_FILE"
elif [ "$iteration" -ge "$MAX_ITERATIONS" ]; then
    echo "Status: STOPPED (max iterations reached)"
    echo "Check frontier/ for remaining work."
else
    echo "Status: STOPPED (failures)"
    echo "Check /tmp/ralph-${LOOP_NAME}-iter-*.log for details."
fi
```

Make it executable: `chmod +x loops/_template/loop.sh`

**Step 2: Create PROMPT.md example**

Write `loops/_template/PROMPT.md.example`:

```markdown
# [Idea Name] — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/<idea-name>/`. All paths below are relative to this directory.

## Your Goal

[Describe what this loop should explore/analyze/build]

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(<idea-name>): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: [Initial exploration]
[Describe tools and methods for initial data gathering]

### Wave 2: [Pattern analysis]
[Describe how to analyze patterns from Wave 1 data]

### Wave 3: [Synthesis]
[Describe how to synthesize findings into final output]

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect.
- Write findings in markdown with specific numbers and examples.
- Discover new aspects and add them to the frontier.
- Keep analysis files focused. One aspect = one file.
```

**Step 3: Create frontier example**

Write `loops/_template/frontier/aspects.md.example`:

```markdown
# Frontier — [Idea Name]

## Statistics
- Total aspects discovered: N
- Analyzed: 0
- Pending: N
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: [Initial Exploration]
- [ ] aspect-1 — Description of what to explore
- [ ] aspect-2 — Description of what to explore

### Wave 2: [Pattern Analysis]
Depends on Wave 1 raw data.
- [ ] aspect-3 — Description of pattern to analyze
- [ ] aspect-4 — Description of pattern to analyze

### Wave 3: [Synthesis]
Depends on all Wave 2 analysis.
- [ ] synthesis — Combine all findings into final output

## Recently Analyzed
(Empty — loop hasn't started yet)
```

**Step 4: Commit**

```bash
git add loops/_template/
git commit -m "loops: add standard template for new ralph loops"
```

---

### Task 5: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/ralph-loops.yml`

**Step 1: Create the workflow directory**

```bash
mkdir -p .github/workflows
```

**Step 2: Write the workflow**

Write `.github/workflows/ralph-loops.yml`:

```yaml
name: Ralph Loops

on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch:
    inputs:
      loop:
        description: "Run a specific loop name, or 'all' for all active loops"
        required: false
        default: "all"

jobs:
  discover:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.parse.outputs.matrix }}
      has_loops: ${{ steps.parse.outputs.has_loops }}
    steps:
      - uses: actions/checkout@v4

      - name: Install yq
        run: |
          sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
          sudo chmod +x /usr/local/bin/yq

      - name: Parse registry for active loops
        id: parse
        run: |
          FILTER="${{ github.event.inputs.loop || 'all' }}"

          if [ "$FILTER" = "all" ]; then
            # Get all loops with status 'active'
            LOOPS=$(yq -o=json '.loops | to_entries | map(select(.value.status == "active")) | map(.key)' loops/_registry.yaml)
          else
            # Run a specific loop (regardless of status, for manual override)
            LOOPS=$(echo "[\"$FILTER\"]" | yq -o=json)
          fi

          COUNT=$(echo "$LOOPS" | yq 'length')
          if [ "$COUNT" -eq 0 ]; then
            echo "No active loops found."
            echo "has_loops=false" >> "$GITHUB_OUTPUT"
            echo "matrix={\"loop\":[]}" >> "$GITHUB_OUTPUT"
          else
            echo "Active loops: $LOOPS"
            echo "has_loops=true" >> "$GITHUB_OUTPUT"
            echo "matrix={\"loop\":$(echo $LOOPS)}" >> "$GITHUB_OUTPUT"
          fi

  run-loop:
    needs: discover
    if: needs.discover.outputs.has_loops == 'true'
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.discover.outputs.matrix) }}
      fail-fast: false
    timeout-minutes: 35
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure git
        run: |
          git config user.name "ralph-loop[bot]"
          git config user.email "ralph-loop[bot]@users.noreply.github.com"

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Check loop status
        id: check
        run: |
          LOOP_DIR="loops/${{ matrix.loop }}"
          if [ -f "$LOOP_DIR/status/converged.txt" ]; then
            echo "Loop ${{ matrix.loop }} already converged. Skipping."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          elif [ -f "$LOOP_DIR/status/paused.txt" ]; then
            echo "Loop ${{ matrix.loop }} is paused. Skipping."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Run one iteration
        if: steps.check.outputs.skip != 'true'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd "loops/${{ matrix.loop }}"
          # Run one iteration — CI is the outer loop
          timeout 1800 bash -c '
            unset CLAUDECODE
            cat PROMPT.md | claude --print --dangerously-skip-permissions
          ' || {
            EXIT_CODE=$?
            if [ "$EXIT_CODE" -eq 124 ]; then
              echo "WARNING: Iteration timed out after 1800s"
            else
              echo "WARNING: Iteration exited with code $EXIT_CODE"
            fi
          }

      - name: Commit results
        if: steps.check.outputs.skip != 'true'
        run: |
          cd "loops/${{ matrix.loop }}"
          git add -A
          git diff --cached --quiet || git commit -m "loop(${{ matrix.loop }}): iteration"
          git pull --rebase origin "${{ github.ref_name }}" || true
          git push || echo "WARNING: Push failed, will retry next iteration"

      - name: Check convergence and notify
        if: steps.check.outputs.skip != 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          LOOP_DIR="loops/${{ matrix.loop }}"
          if [ -f "$LOOP_DIR/status/converged.txt" ]; then
            echo "Loop ${{ matrix.loop }} has converged!"

            # Count iterations from git log
            ITER_COUNT=$(git log --oneline --grep="loop(${{ matrix.loop }})" | wc -l)

            # Create GitHub issue
            gh issue create \
              --title "[ralph] ${{ matrix.loop }} converged ($ITER_COUNT iterations)" \
              --label "ralph-converged" \
              --body "$(cat <<ISSUEEOF
          ## Loop Converged

          **Loop:** ${{ matrix.loop }}
          **Iterations:** ~$ITER_COUNT
          **Output:** \`$LOOP_DIR/analysis/\`

          The frontier is exhausted. Review the results and decide next steps.

          ### Convergence Summary
          \`\`\`
          $(cat "$LOOP_DIR/status/converged.txt")
          \`\`\`
          ISSUEEOF
            )" || echo "WARNING: Could not create issue (label may not exist yet)"

            # Update registry
            yq -i ".loops[\"${{ matrix.loop }}\"].status = \"converged\" | .loops[\"${{ matrix.loop }}\"].converged_at = \"$(date -u +%Y-%m-%d)\"" loops/_registry.yaml
            git add loops/_registry.yaml
            git commit -m "loop(${{ matrix.loop }}): mark converged in registry"
            git push || true
          fi
```

**Step 3: Commit**

```bash
git add .github/workflows/ralph-loops.yml
git commit -m "ci: add ralph-loops workflow — cron every 30min, matrix per active loop"
```

---

### Task 6: Create brainstorm-ralph skill

**Files:**
- Create: `/home/clsandoval/.claude/skills/brainstorm-ralph/SKILL.md`

**Step 1: Create the skill directory**

```bash
mkdir -p /home/clsandoval/.claude/skills/brainstorm-ralph
```

**Step 2: Write the skill**

Write `/home/clsandoval/.claude/skills/brainstorm-ralph/SKILL.md`:

```markdown
---
name: brainstorm-ralph
description: |
  Brainstorm a tangential idea into a reverse ralph loop. Explores the idea through
  collaborative dialogue, then generates PROMPT.md, frontier/aspects.md, and loop.sh
  ready for autonomous CI execution. Use when the user wants to set up a new ralph loop
  for an idea. Triggers: "brainstorm ralph", "new ralph loop", "set up a loop for",
  "reverse ralph this idea", "cook this idea".
---

# Brainstorm Ralph — Idea to Autonomous Loop

## Overview

Turn a tangential idea into a fully configured reverse ralph loop that runs autonomously in GitHub Actions every 30 minutes. Same collaborative brainstorming process as the standard brainstorming skill, but the output is a loop directory instead of a design doc.

<HARD-GATE>
Do NOT generate loop artifacts until you have explored the idea through dialogue and the user has approved the approach. Every idea goes through the full brainstorming process regardless of perceived simplicity.
</HARD-GATE>

## Checklist

Complete these in order:

1. **Explore context** — read `loops/_registry.yaml` to see existing loops, check if the idea overlaps with anything active
2. **Ask clarifying questions** — one at a time, understand the idea's goal, what tools/methods apply, what convergence looks like
3. **Propose 2-3 frontier structures** — different ways to decompose the idea into waves of analysis, with your recommendation
4. **Draft the PROMPT.md** — present it section by section for user approval
5. **Draft frontier/aspects.md** — present the initial aspects for user approval
6. **Generate loop artifacts** — write all files to `loops/<idea-name>/`
7. **Update registry** — add entry to `loops/_registry.yaml` with `status: active`
8. **Commit and open PR** — branch, commit, push, open PR for review

## Process

### Understanding the Idea

Same process as standard brainstorming:
- Ask questions one at a time to refine the idea
- Prefer multiple choice when possible
- Focus on: purpose, tools/methods needed, what "done" looks like, convergence criteria

### Key Questions to Answer

Before generating artifacts, you must understand:
1. **Goal**: What does convergence produce? (spec, report, dataset, recommendations)
2. **Domain**: What tools or methods does this require? (web research, code analysis, data processing, API calls)
3. **Waves**: How does exploration decompose? (Wave 1: gather raw data, Wave 2: analyze patterns, Wave 3: synthesize)
4. **Aspects**: What are the initial Wave 1 aspects to explore?
5. **Convergence**: How do we know the loop is done? (all aspects checked, output artifact passes review)

### Generating Artifacts

After user approves the approach, generate:

**1. `loops/<idea-name>/PROMPT.md`**

Follow the pattern from `loops/_template/PROMPT.md.example` but fully customized:
- Specific goal description
- Concrete Wave 1 methods with tool commands
- Wave 2 analysis instructions referencing Wave 1 outputs
- Wave 3 synthesis with clear output format
- Rules section with idea-specific constraints

**2. `loops/<idea-name>/frontier/aspects.md`**

Initial frontier with:
- Statistics section (total/analyzed/pending/convergence)
- Wave 1 aspects (concrete, actionable)
- Wave 2 placeholder aspects (will be refined as Wave 1 completes)
- Wave 3 synthesis aspect

**3. `loops/<idea-name>/loop.sh`**

Copy from `loops/_template/loop.sh`. Only change the header comment to describe this specific loop.

**4. `loops/<idea-name>/frontier/analysis-log.md`**

Empty log table:
```markdown
# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
```

**5. Create directories**

```
loops/<idea-name>/
├── PROMPT.md
├── loop.sh (executable)
├── frontier/
│   ├── aspects.md
│   └── analysis-log.md
├── analysis/    (empty)
├── status/      (empty)
└── raw/         (empty)
```

### Registry Update

Add to `loops/_registry.yaml`:
```yaml
  <idea-name>:
    description: "<one-line description>"
    type: reverse
    schedule: "*/30 * * * *"
    max_iterations: 40
    timeout_minutes: 30
    status: active
    created: <today's date>
```

### Commit and PR

```bash
git checkout -b ralph/<idea-name>
git add loops/<idea-name>/ loops/_registry.yaml
git commit -m "loop(<idea-name>): scaffold reverse ralph loop"
git push -u origin ralph/<idea-name>
gh pr create --title "loop: <idea-name>" --body "..."
```

## Rules

- ONE question at a time during brainstorming
- Multiple choice preferred
- The PROMPT.md is the most critical artifact — it must be specific enough for Claude to work autonomously
- Aspects must be concrete and actionable, not vague
- Do NOT invoke writing-plans or any implementation skill — the loop IS the implementation
- The terminal state is: artifacts committed, PR opened, user reviews and merges

## Key Principles

- **YAGNI**: Start with minimal Wave 1 aspects. The loop discovers more as it goes.
- **Concrete methods**: Every Wave 1 aspect must specify exactly what tool/command to run or what research method to use.
- **Convergence clarity**: The PROMPT.md must make it unambiguous when the loop is done.
- **Autonomous operation**: Once merged, the loop runs without human intervention until converged.
```

**Step 3: Commit**

```bash
git add /home/clsandoval/.claude/skills/brainstorm-ralph/SKILL.md
git commit -m "skill: add brainstorm-ralph for idea-to-loop pipeline"
```

Note: Since this is a personal skill file outside the repo, commit it separately or just ensure it exists on disk. If `.claude/skills/` is not tracked in the monorepo, just write the file — it persists across sessions.

---

### Task 7: Verify the full system end-to-end

**Step 1: Verify directory structure**

```bash
ls -la loops/
# Expected: _registry.yaml, _template/, anime-recap-reverse/, anime-recap-forward/

ls -la loops/anime-recap-reverse/
# Expected: reverse-ralph.sh, PROMPT.md, frontier/, analysis/, status/, raw/, input/

ls -la loops/anime-recap-forward/
# Expected: forward-ralph.sh, PROMPT.md, frontier/, status/, test-config.yaml

ls -la loops/_template/
# Expected: loop.sh, PROMPT.md.example, frontier/

ls -la .github/workflows/
# Expected: ralph-loops.yml
```

**Step 2: Verify registry parses**

```bash
# Install yq if not present
pip install yq || sudo snap install yq

# List active loops
yq '.loops | to_entries | map(select(.value.status == "active")) | map(.key)' loops/_registry.yaml
# Expected: ["anime-recap-forward"]
```

**Step 3: Verify loop.sh is executable**

```bash
chmod +x loops/_template/loop.sh
chmod +x loops/anime-recap-reverse/reverse-ralph.sh
chmod +x loops/anime-recap-forward/forward-ralph.sh
```

**Step 4: Verify the old automations/ directory is clean**

```bash
ls automations/
# Expected: anime-recap-engine/, openclaw/, *.py scripts
# Should NOT contain: anime-recap-reverse-ralph/, anime-recap-forward-ralph/
```

**Step 5: Dry-run the workflow discovery locally**

```bash
# Simulate what the CI discover job does
yq -o=json '.loops | to_entries | map(select(.value.status == "active")) | map(.key)' loops/_registry.yaml
# Expected: ["anime-recap-forward"]
```

**Step 6: Commit any fixups**

```bash
git add -A
git diff --cached --quiet || git commit -m "loops: verification fixups"
```

---

### Task 8: Create the `ralph-converged` label on GitHub

**Step 1: Create the label**

```bash
gh label create "ralph-converged" --description "Auto-created when a ralph loop converges" --color "0E8A16"
```

**Step 2: Verify**

```bash
gh label list | grep ralph
# Expected: ralph-converged
```
