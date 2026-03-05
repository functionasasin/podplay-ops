# Inheritance Sub-Monorepo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move all inheritance-related code, loops, and specs into `apps/inheritance/` and create a CI workflow for forward ralph loops.

**Architecture:** Big bang migration — `git mv` everything into the new structure, update all PROMPT.md path references, create a local registry, and add a GitHub Actions workflow. No transitional state.

**Tech Stack:** Bash (git mv), YAML (registry + workflow), Markdown (PROMPT.md rewrites)

---

### Task 1: Create directory scaffold

**Files:**
- Create: `apps/inheritance/engine/.gitkeep`
- Create: `apps/inheritance/frontend/.gitkeep`
- Create: `apps/inheritance/specs/.gitkeep`
- Create: `apps/inheritance/loops/reverse/.gitkeep`
- Create: `apps/inheritance/loops/forward/.gitkeep`

**Step 1: Create the directory tree**

```bash
mkdir -p apps/inheritance/{engine,frontend,specs}
mkdir -p apps/inheritance/loops/{reverse,forward}
```

**Step 2: Commit scaffold**

```bash
# Add .gitkeep files so empty dirs are tracked
touch apps/inheritance/engine/.gitkeep
touch apps/inheritance/frontend/.gitkeep
touch apps/inheritance/specs/.gitkeep
git add apps/
git commit -m "scaffold: apps/inheritance/ directory structure"
```

---

### Task 2: Move engine code

**Step 1: Move Rust engine from forward loop to shared engine dir**

```bash
cd /home/clsandoval/cs/monorepo
# Move code files (not loop config)
git mv loops/inheritance-rust-forward/Cargo.toml apps/inheritance/engine/
git mv loops/inheritance-rust-forward/Cargo.lock apps/inheritance/engine/
git mv loops/inheritance-rust-forward/src apps/inheritance/engine/
git mv loops/inheritance-rust-forward/pkg apps/inheritance/engine/
git mv loops/inheritance-rust-forward/tests apps/inheritance/engine/
git mv loops/inheritance-rust-forward/examples apps/inheritance/engine/
git mv loops/inheritance-rust-forward/BUGS.md apps/inheritance/engine/
```

**Step 2: Remove the .gitkeep**

```bash
rm apps/inheritance/engine/.gitkeep
```

**Step 3: Verify engine builds**

```bash
cd apps/inheritance/engine
cargo check 2>&1 | tail -5
```

Expected: Compilation success (or warnings only — no errors from the move itself).

**Step 4: Commit**

```bash
cd /home/clsandoval/cs/monorepo
git add -A
git commit -m "move: inheritance engine code to apps/inheritance/engine/"
```

---

### Task 3: Move frontend code

**Step 1: Move React app from forward loop to shared frontend dir**

```bash
cd /home/clsandoval/cs/monorepo
git mv loops/inheritance-frontend-forward/app/* apps/inheritance/frontend/
# Also move hidden files if any
git mv loops/inheritance-frontend-forward/app/.* apps/inheritance/frontend/ 2>/dev/null || true
```

**Step 2: Remove the .gitkeep**

```bash
rm apps/inheritance/frontend/.gitkeep
```

**Step 3: Commit**

```bash
git add -A
git commit -m "move: inheritance frontend code to apps/inheritance/frontend/"
```

---

### Task 4: Move spec documents

**Step 1: Move all inheritance/estate-tax specs**

```bash
cd /home/clsandoval/cs/monorepo
git mv docs/plans/inheritance-engine-spec.md apps/inheritance/specs/
git mv docs/plans/inheritance-platform-spec.md apps/inheritance/specs/
git mv docs/plans/inheritance-premium-spec.md apps/inheritance/specs/
git mv docs/plans/2026-02-24-inheritance-frontend-design.md apps/inheritance/specs/inheritance-frontend-design.md
git mv docs/plans/estate-tax-engine-spec.md apps/inheritance/specs/
git mv loops/inheritance-v2-reverse/docs/plans/inheritance-v2-spec.md apps/inheritance/specs/
```

**Step 2: Remove the .gitkeep**

```bash
rm apps/inheritance/specs/.gitkeep
```

**Step 3: Commit**

```bash
git add -A
git commit -m "move: inheritance specs to apps/inheritance/specs/"
```

---

### Task 5: Move reverse loops

**Step 1: Move all 6 converged reverse loops**

```bash
cd /home/clsandoval/cs/monorepo
git mv loops/inheritance-reverse apps/inheritance/loops/reverse/core
git mv loops/estate-tax-reverse apps/inheritance/loops/reverse/estate-tax
git mv loops/inheritance-frontend-reverse apps/inheritance/loops/reverse/frontend
git mv loops/inheritance-premium-reverse apps/inheritance/loops/reverse/premium
git mv loops/inheritance-platform-reverse apps/inheritance/loops/reverse/platform
git mv loops/inheritance-v2-reverse apps/inheritance/loops/reverse/v2
```

**Step 2: Remove .gitkeep files**

```bash
rm -f apps/inheritance/loops/reverse/.gitkeep
```

**Step 3: Commit**

```bash
git add -A
git commit -m "move: inheritance reverse loops to apps/inheritance/loops/reverse/"
```

---

### Task 6: Move forward loop configs

Each forward loop dir moves, but the code dirs (src/, app/) were already moved in Tasks 2-3. What remains is loop config: PROMPT.md, frontier/, status/, analysis/, raw/, and shell scripts.

**Step 1: Move inheritance-rust-forward (remaining loop config)**

```bash
cd /home/clsandoval/cs/monorepo
# target/ is a build artifact dir — exclude from git if present
git mv loops/inheritance-rust-forward apps/inheritance/loops/forward/engine
```

Note: The code files were already moved out in Task 2, so only PROMPT.md, frontier/, status/, analysis/, raw/, forward-ralph.sh, and target/ remain.

**Step 2: Move inheritance-frontend-forward (remaining loop config)**

```bash
git mv loops/inheritance-frontend-forward apps/inheritance/loops/forward/frontend
```

The app/ dir was emptied in Task 3. The remaining contents are PROMPT.md, frontier/, status/, analysis/, raw/, forward-ralph.sh.

**Step 3: Move remaining forward loops (these are loop-config-only already)**

```bash
git mv loops/inheritance-ui-forward apps/inheritance/loops/forward/ui
git mv loops/inheritance-wasm-forward apps/inheritance/loops/forward/wasm
git mv loops/inheritance-v2-forward apps/inheritance/loops/forward/v2
git mv loops/inheritance-premium-forward apps/inheritance/loops/forward/premium
git mv loops/inheritance-platform-forward apps/inheritance/loops/forward/platform
```

**Step 4: Clean up empty app/ dir from frontend forward if it remains**

```bash
rmdir apps/inheritance/loops/forward/frontend/app 2>/dev/null || true
```

**Step 5: Remove .gitkeep files**

```bash
rm -f apps/inheritance/loops/forward/.gitkeep
```

**Step 6: Commit**

```bash
git add -A
git commit -m "move: inheritance forward loops to apps/inheritance/loops/forward/"
```

---

### Task 7: Update forward loop PROMPT.md files — engine

**Files:**
- Modify: `apps/inheritance/loops/forward/engine/PROMPT.md`

**Step 1: Read the current PROMPT.md**

Read `apps/inheritance/loops/forward/engine/PROMPT.md` fully.

**Step 2: Find-and-replace all path references**

Apply these replacements:
- `loops/inheritance-rust-forward/` → `apps/inheritance/engine/`
- `docs/plans/inheritance-engine-spec.md` → `apps/inheritance/specs/inheritance-engine-spec.md`

The "Loop + Engine dir" line should now say:
```
- **Engine dir**: `apps/inheritance/engine/` (Rust crate)
- **Loop dir**: `apps/inheritance/loops/forward/engine/` (frontier, status)
```

**Step 3: Commit**

```bash
git add apps/inheritance/loops/forward/engine/PROMPT.md
git commit -m "update: engine forward loop paths for sub-monorepo"
```

---

### Task 8: Update forward loop PROMPT.md files — frontend

**Files:**
- Modify: `apps/inheritance/loops/forward/frontend/PROMPT.md`

**Step 1: Read the current PROMPT.md**

Read `apps/inheritance/loops/forward/frontend/PROMPT.md` fully.

**Step 2: Find-and-replace all path references**

Apply these replacements:
- `loops/inheritance-frontend-forward/app/` → `apps/inheritance/frontend/`
- `loops/inheritance-frontend-forward/` → `apps/inheritance/loops/forward/frontend/`
- `loops/inheritance-frontend-reverse/analysis/synthesis/` → `apps/inheritance/loops/reverse/frontend/analysis/synthesis/`
- `loops/inheritance-frontend-reverse/analysis/` → `apps/inheritance/loops/reverse/frontend/analysis/`

**Step 3: Commit**

```bash
git add apps/inheritance/loops/forward/frontend/PROMPT.md
git commit -m "update: frontend forward loop paths for sub-monorepo"
```

---

### Task 9: Update forward loop PROMPT.md files — v2

**Files:**
- Modify: `apps/inheritance/loops/forward/v2/PROMPT.md`

**Step 1: Read the current PROMPT.md**

Read `apps/inheritance/loops/forward/v2/PROMPT.md` fully.

**Step 2: Find-and-replace all path references**

Apply these replacements:
- `loops/inheritance-v2-forward/engine/` → `apps/inheritance/engine/`
- `loops/inheritance-v2-forward/frontend/` → `apps/inheritance/frontend/`
- `loops/inheritance-v2-forward/` → `apps/inheritance/loops/forward/v2/`
- `docs/plans/inheritance-v2-spec.md` → `apps/inheritance/specs/inheritance-v2-spec.md`

**Step 3: Commit**

```bash
git add apps/inheritance/loops/forward/v2/PROMPT.md
git commit -m "update: v2 forward loop paths for sub-monorepo"
```

---

### Task 10: Update forward loop PROMPT.md files — ui, wasm, premium, platform

**Files:**
- Modify: `apps/inheritance/loops/forward/ui/PROMPT.md`
- Modify: `apps/inheritance/loops/forward/wasm/PROMPT.md`
- Modify: `apps/inheritance/loops/forward/premium/PROMPT.md`
- Modify: `apps/inheritance/loops/forward/platform/PROMPT.md`

**Step 1: Read each PROMPT.md**

Read all four files. For each one, identify all path references to `loops/` or `docs/plans/`.

**Step 2: Apply path rewrites**

Common replacements across all:
- `loops/inheritance-rust-forward/` → `apps/inheritance/engine/`
- `loops/inheritance-frontend-forward/app/` → `apps/inheritance/frontend/`
- `loops/inheritance-frontend-forward/` → `apps/inheritance/loops/forward/frontend/`
- `docs/plans/inheritance-engine-spec.md` → `apps/inheritance/specs/inheritance-engine-spec.md`
- `docs/plans/inheritance-platform-spec.md` → `apps/inheritance/specs/inheritance-platform-spec.md`
- `docs/plans/inheritance-premium-spec.md` → `apps/inheritance/specs/inheritance-premium-spec.md`
- `docs/plans/estate-tax-engine-spec.md` → `apps/inheritance/specs/estate-tax-engine-spec.md`
- `loops/inheritance-<name>-forward/` → `apps/inheritance/loops/forward/<name>/`
- `loops/inheritance-<name>-reverse/` → `apps/inheritance/loops/reverse/<name>/`

Each loop may reference different specs — read carefully and only change paths that actually exist in the file.

**Step 3: Commit all four together**

```bash
git add apps/inheritance/loops/forward/ui/PROMPT.md
git add apps/inheritance/loops/forward/wasm/PROMPT.md
git add apps/inheritance/loops/forward/premium/PROMPT.md
git add apps/inheritance/loops/forward/platform/PROMPT.md
git commit -m "update: ui/wasm/premium/platform forward loop paths for sub-monorepo"
```

---

### Task 11: Create inheritance loop registry

**Files:**
- Create: `apps/inheritance/loops/_registry.yaml`

**Step 1: Create the inheritance-only registry**

Extract all inheritance and estate-tax entries from `loops/_registry.yaml` into a new file. Update the `description` fields if they reference old paths. The registry structure is identical — just scoped to inheritance loops.

```yaml
# Inheritance Loop Registry
# CI reads this to discover which forward loops to run.
# Status: active | paused | converged

loops:
  # === Reverse (all converged) ===
  reverse/core:
    description: "Extract PH succession/inheritance rules → per-heir distribution engine spec"
    type: reverse
    status: converged
    created: 2026-02-23
    converged_at: "2026-02-23"
  reverse/estate-tax:
    description: "Extract PH estate tax rules (TRAIN + pre-TRAIN + amnesty) → deterministic computation engine spec"
    type: reverse
    status: converged
    created: 2026-02-23
    converged_at: "2026-02-25"
  reverse/frontend:
    description: "Analyze Rust inheritance engine → implementation-ready React + TypeScript frontend spec"
    type: reverse
    status: converged
    created: 2026-02-24
    converged_at: "2026-02-25"
  reverse/premium:
    description: "Research and specify all premium features for PH inheritance professional platform"
    type: reverse
    status: converged
    created: 2026-02-28
    converged_at: "2026-03-01"
  reverse/platform:
    description: "Audit inheritance app platform layer → modernization spec with Navy+Gold aesthetic"
    type: reverse
    status: converged
    created: 2026-03-03
    converged_at: "2026-03-04"
  reverse/v2:
    description: "Full-stack inheritance platform rebuild mega-spec"
    type: reverse
    status: converged
    created: 2026-03-04
    converged_at: "2026-03-04"

  # === Forward (active) ===
  forward/engine:
    description: "Build PH inheritance distribution engine in Rust, 12-stage TDD pipeline"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 50
    timeout_minutes: 30
    status: active
    created: 2026-02-24
  forward/frontend:
    description: "Build PH inheritance wizard frontend (React + TypeScript), 12-stage TDD"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 50
    timeout_minutes: 30
    status: active
    created: 2026-02-25
  forward/ui:
    description: "Redesign inheritance calculator with shadcn/ui, Navy + Gold aesthetic"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 50
    timeout_minutes: 30
    status: active
    created: 2026-02-28
  forward/wasm:
    description: "Wire real Rust WASM engine into frontend, fixing type conformance"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 30
    timeout_minutes: 30
    status: active
    created: 2026-02-28
  forward/v2:
    description: "Implementation phase of v2 mega-spec"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 50
    timeout_minutes: 30
    status: active
    created: 2026-02-28
  forward/premium:
    description: "Build 23 premium features (auth, PDF, CRM, tax integration, multi-seat)"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 50
    timeout_minutes: 30
    status: active
    created: 2026-03-02
  forward/platform:
    description: "Fix 104 platform-layer gaps (auth, routes, nav, design)"
    type: forward
    schedule: "*/30 * * * *"
    max_iterations: 50
    timeout_minutes: 30
    status: active
    created: 2026-03-04
```

**Step 2: Commit**

```bash
git add apps/inheritance/loops/_registry.yaml
git commit -m "add: inheritance loop registry"
```

---

### Task 12: Remove inheritance entries from global registry

**Files:**
- Modify: `loops/_registry.yaml`

**Step 1: Read the current global registry**

Read `loops/_registry.yaml`.

**Step 2: Remove these entries**

Delete the following keys from the `loops:` map:
- `estate-tax-reverse`
- `inheritance-reverse`
- `inheritance-rust-forward`
- `inheritance-frontend-reverse`
- `inheritance-frontend-forward`
- `inheritance-ui-forward`
- `inheritance-wasm-forward`
- `inheritance-v2-reverse`
- `inheritance-premium-reverse`
- `inheritance-premium-forward`
- `inheritance-platform-reverse`
- `inheritance-platform-forward`

Leave all non-inheritance entries untouched.

**Step 3: Commit**

```bash
git add loops/_registry.yaml
git commit -m "cleanup: remove inheritance entries from global loop registry"
```

---

### Task 13: Create CI workflow

**Files:**
- Create: `.github/workflows/inheritance.yml`

**Step 1: Write the workflow**

Model it on `ralph-loops.yml` but adapted for forward loops with build tool dependencies.

```yaml
name: Inheritance Forward Loops

on:
  schedule:
    - cron: "0 6,18 * * *"   # 6am + 6pm UTC (2pm + 2am Manila)
  workflow_dispatch:
    inputs:
      loop:
        description: "Run a specific loop (e.g. forward/engine), or 'all' for all active"
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

      - name: Parse registry for active forward loops
        id: parse
        run: |
          FILTER="${{ github.event.inputs.loop || 'all' }}"
          REGISTRY="apps/inheritance/loops/_registry.yaml"

          if [ "$FILTER" = "all" ]; then
            LOOPS=$(yq -o=json '.loops | to_entries | map(select(.value.status == "active" and .value.type == "forward")) | map(.key)' "$REGISTRY")
          else
            LOOPS=$(echo "[\"$FILTER\"]" | yq -o=json)
          fi

          COUNT=$(echo "$LOOPS" | yq 'length')
          if [ "$COUNT" -eq 0 ]; then
            echo "No active forward loops found."
            echo "has_loops=false" >> "$GITHUB_OUTPUT"
            echo "matrix={\"loop\":[]}" >> "$GITHUB_OUTPUT"
          else
            echo "Active forward loops: $LOOPS"
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
    timeout-minutes: 360
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GH_PAT }}

      - name: Configure git
        run: |
          git config user.name "ralph-loop[bot]"
          git config user.email "ralph-loop[bot]@users.noreply.github.com"

      - name: Install Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown

      - name: Install wasm-pack
        run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Check loop status
        id: check
        run: |
          LOOP_DIR="apps/inheritance/loops/${{ matrix.loop }}"
          if [ -f "$LOOP_DIR/status/converged.txt" ]; then
            echo "Loop ${{ matrix.loop }} already converged. Skipping."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          elif [ -f "$LOOP_DIR/status/paused.txt" ]; then
            echo "Loop ${{ matrix.loop }} is paused. Skipping."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Run until convergence (6-hour window)
        if: steps.check.outputs.skip != 'true'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd "apps/inheritance/loops/${{ matrix.loop }}"
          FAILURES=0
          ITERATION=0

          while true; do
            if [ -f status/converged.txt ]; then
              echo "Loop converged after $ITERATION iterations."
              break
            fi

            ITERATION=$((ITERATION + 1))
            echo "--- $(date '+%H:%M:%S') | Iteration $ITERATION ---"

            if bash -c '
              unset CLAUDECODE
              cat PROMPT.md | claude --print --dangerously-skip-permissions
            '; then
              FAILURES=0
            else
              EXIT_CODE=$?
              echo "WARNING: iteration $ITERATION exited with code $EXIT_CODE"
              FAILURES=$((FAILURES + 1))
              [ $FAILURES -ge 3 ] && echo "3 consecutive failures — stopping." && break
            fi

            # Push any local commits
            git add -A
            git diff --cached --quiet || git commit -m "loop(${{ matrix.loop }}): iteration"
            if git log origin/${{ github.ref_name }}..HEAD --oneline | grep -q .; then
              git pull --rebase origin "${{ github.ref_name }}" || true
              git push || echo "WARNING: Push failed"
            fi

            sleep 5
          done

          echo "Done. Total iterations: $ITERATION"

      - name: Check convergence and notify
        if: steps.check.outputs.skip != 'true'
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
        run: |
          LOOP_DIR="apps/inheritance/loops/${{ matrix.loop }}"
          if [ -f "$LOOP_DIR/status/converged.txt" ]; then
            echo "Loop ${{ matrix.loop }} has converged!"

            ITER_COUNT=$(git log --oneline --grep="loop(${{ matrix.loop }})" | wc -l)

            gh issue create \
              --title "[ralph] inheritance/${{ matrix.loop }} converged ($ITER_COUNT iterations)" \
              --label "ralph-converged" \
              --body "$(cat <<ISSUEEOF
          ## Loop Converged

          **Loop:** inheritance/${{ matrix.loop }}
          **Iterations:** ~$ITER_COUNT
          **Output:** \`$LOOP_DIR/analysis/\`

          The frontier is exhausted. Review the results and decide next steps.

          ### Convergence Summary
          \`\`\`
          $(cat "$LOOP_DIR/status/converged.txt")
          \`\`\`
          ISSUEEOF
            )" || echo "WARNING: Could not create issue"

            # Update local registry
            yq -i ".loops[\"${{ matrix.loop }}\"].status = \"converged\" | .loops[\"${{ matrix.loop }}\"].converged_at = \"$(date -u +%Y-%m-%d)\"" apps/inheritance/loops/_registry.yaml
            git add apps/inheritance/loops/_registry.yaml
            git commit -m "loop(inheritance/${{ matrix.loop }}): mark converged in registry"
            git push || true
          fi
```

**Step 2: Commit**

```bash
git add .github/workflows/inheritance.yml
git commit -m "ci: add inheritance forward loops workflow (6-hour schedule)"
```

---

### Task 14: Verify and clean up

**Step 1: Verify no inheritance loops remain in old locations**

```bash
ls loops/ | grep -E 'inherit|estate'
```

Expected: No output (all moved).

**Step 2: Verify new structure**

```bash
find apps/inheritance -maxdepth 3 -type d | sort
```

Expected: The full directory tree from the design doc.

**Step 3: Verify registry consistency**

```bash
# Global registry should have no inheritance entries
grep -c 'inheritance' loops/_registry.yaml
grep -c 'estate-tax' loops/_registry.yaml
```

Expected: 0 for both.

```bash
# Local registry should have 13 entries
yq '.loops | length' apps/inheritance/loops/_registry.yaml
```

Expected: 13

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git diff --cached --quiet || git commit -m "cleanup: inheritance sub-monorepo migration finalized"
```
