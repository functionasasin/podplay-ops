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
```
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
