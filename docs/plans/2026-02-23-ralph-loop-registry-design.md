# Ralph Loop Registry — Design Doc

**Date**: 2026-02-23
**Status**: Approved

## Problem

The ralph loop pattern (reverse ralph for analysis, forward ralph for building) is proven but currently anime-recap-specific and runs only locally. We want to generalize it so any tangential idea — software projects or research deep-dives — can go from brainstorm to autonomous CI execution.

## Goals

- Any idea can become a ralph loop running in GitHub Actions every 30 minutes
- Clean monorepo organization with loops as first-class citizens
- Brainstorm-to-loop pipeline: collaborative session produces loop artifacts, PR, and CI picks it up
- Convergence notification so you decide next steps (no auto-advance)

## Design

### 1. Monorepo Reorganization

New `loops/` top-level directory. Existing anime-recap loops move there. `automations/` retains non-loop things.

```
# AFTER
loops/                           # NEW top-level dir
├── _registry.yaml               # Loop registry
├── anime-recap-reverse/         # Moved + renamed from automations/
├── anime-recap-forward/         # Moved + renamed from automations/
└── (future ideas go here)

automations/                     # Stays, but leaner
├── anime-recap-engine/          # Built artifact (output of loops)
├── openclaw/                    # Telegram bot
└── *.py                         # One-off scripts
```

`anime-recap-engine/` stays in `automations/` because it's the **output** of the loops, not a loop itself.

### 2. Loop Directory Standard

Every loop follows the same structure:

```
loops/<idea-name>/
├── PROMPT.md              # Claude Code prompt (written during brainstorm)
├── loop.sh                # Bash loop runner (standardized, for local use)
├── frontier/
│   └── aspects.md         # What to explore (written during brainstorm)
├── analysis/              # Loop writes findings here
├── status/                # File-based state markers
│   ├── converged.txt      # Written by loop when done
│   └── paused.txt         # Drop this file to pause (CI skips it)
└── raw/                   # Optional: tool outputs, data files
```

**Conventions**:
- `status/converged.txt` present = loop is done, CI stops running it
- `status/paused.txt` present = manually paused, CI skips it
- No status files = active, CI runs it
- Each iteration = one Claude Code invocation, one atomic commit

### 3. Registry Format

`loops/_registry.yaml` — single file describing all loops:

```yaml
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
    current_stage: 2
```

**Rules**:
- Registry is the source of truth for CI — if it's not listed, it doesn't run
- `status` field updated by both humans (pause/resume) and the loop itself (converged)
- `schedule` allows per-loop cadence
- File markers in `status/` are ground truth; registry reflects them but CI checks both

### 4. GitHub Actions Workflow

One workflow: `.github/workflows/ralph-loops.yml`

```yaml
on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch:
    inputs:
      loop:
        description: "Run a specific loop (or 'all')"
        default: "all"

jobs:
  discover:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.parse.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
      - id: parse
        # Parse _registry.yaml, emit JSON array of active loops

  run-loop:
    needs: discover
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.discover.outputs.matrix) }}
      fail-fast: false
    timeout-minutes: 35
    steps:
      - uses: actions/checkout@v4
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      - name: Run one iteration
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd loops/${{ matrix.loop }}
          claude -p "$(cat PROMPT.md)" --allowedTools ...
      - name: Commit and push
        run: |
          git add loops/${{ matrix.loop }}/
          git commit -m "loop(${{ matrix.loop }}): iteration" || true
          git push
      - name: Check convergence
        if: always()
        run: |
          if [ -f loops/${{ matrix.loop }}/status/converged.txt ]; then
            # Update registry, create GitHub issue notification
          fi
```

**Key decisions**:
- **CI is the outer loop** — each cron trigger runs ONE iteration, not the full bash loop
- **Matrix strategy** — multiple active loops run concurrently
- **fail-fast: false** — one broken loop doesn't block others
- **loop.sh still works locally** — CI replaces the outer loop, but local execution is unchanged

### 5. brainstorm-ralph Skill

New skill, separate from existing brainstorming skill.

**Same process**: Clarify intent, explore approaches, one question at a time, propose 2-3 directions.

**Different output**: Instead of design doc → writing-plans, the terminal output is:
- `loops/<idea-name>/PROMPT.md` — tailored to the idea's domain and tools
- `loops/<idea-name>/frontier/aspects.md` — initial frontier with Wave 1 aspects
- `loops/<idea-name>/loop.sh` — from standard template
- Entry added to `loops/_registry.yaml` with `status: active`
- Branch + PR opened for review

**Flow**: brainstorm → generate artifacts → commit → PR → user merges → next cron trigger starts the loop.

### 6. Convergence Notification

When `status/converged.txt` appears, the CI workflow:

1. Creates a GitHub Issue tagged `ralph-converged`:
   ```
   Title: [ralph] <loop-name> converged (<N> iterations)
   Body:
     Loop: <loop-name>
     Iterations: <N>
     Output: loops/<loop-name>/analysis/

     The frontier is exhausted. Review the results and decide next steps.
   ```
2. Updates `_registry.yaml` to set `status: converged` and `converged_at`

GitHub Issues chosen for zero additional infra — links directly to code, supports discussion. OpenClaw/Telegram integration can be added later.

## Non-Goals

- Auto-advancing from reverse → forward loop (user decides next steps)
- CLI tooling (`ralph init`, `ralph status`) — can add later if loop creation becomes frequent
- Obsidian dashboard integration — can add later
- Modifying the existing brainstorming skill
