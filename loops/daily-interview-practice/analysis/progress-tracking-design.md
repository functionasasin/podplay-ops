# Progress Tracking Design — Daily Interview Practice

Synthesized from `progression-map.md`, `weekly-templates.md`, `practice-session-formats.md`, and `gateway.yaml`.

## Overview

Progress tracking serves three goals:
1. **Continuity** — OpenClaw always knows where the user is (phase, day, streak) without asking
2. **Momentum** — Visible streaks and milestones make it rewarding to show up consistently
3. **Adaptation** — Self-assessment trends surface gaps and drive phase advancement / targeted sessions

The tracking is entirely within the monorepo. No external database. OpenClaw reads and writes entity files directly.

---

## Two-Level Entity Structure

Progress is captured at two levels:

### Level 1: Project Entity (current state + running metadata)
**File:** `entities/projects/daily-interview-practice.md`

This is the single source of truth for current state. OpenClaw reads this at the start of every session and updates it at the end. It contains:
- Current phase, day, streak
- Total sessions completed
- Today's session content (what OpenClaw delivers)
- Phase advancement status
- Per-category score baselines from Phase 0 diagnostic
- Active diagnostic flags (CONCURRENCY-GAP, etc.)
- Streak metadata (current streak, longest streak, last session date)

### Level 2: Meeting Entities (session logs)
**Directory:** `entities/meetings/`

One file per completed practice session. OpenClaw creates these after the user completes a session. They are the raw log — detailed, searchable, and used for trend analysis.

---

## Session Log Entity Schema

**Filename:** `entities/meetings/YYYY-MM-DD-interview-practice-day-NNN.md`

**Frontmatter:**
```yaml
---
type: meeting
name: "Interview Practice — Day NNN: {session-topic}"
date: YYYY-MM-DD
tags: [interview-practice, phase-{N}, {format-code}]
phase: N
day: NNN
format: "{format-code}"   # CK, SD, MS, DR, SQL, MPR, RR, CD, BS
topic: "{topic-string}"   # e.g., "LRU Cache from scratch Part 1"
key_skill: "{skill}"      # e.g., "DLL as recency-ordered storage"
time_spent_min: N
self_assessment: N        # 1–5 integer
verdict: "{verdict}"      # pass | conditional-pass | fail | not-applicable
gap_flags_triggered: []   # e.g., [CONCURRENCY-GAP] if this session targeted a flagged gap
notes: "{free text}"      # User's own reflection, optional
---
```

**Body:**
```markdown
## Session Summary

**Format:** {Full format name}
**Topic:** {Topic}
**Key Skill:** {Key skill}
**Verdict:** {Verdict} — {brief reason}

## What Went Well

{User's response or OpenClaw summary}

## What Was Missing / Edge Cases Missed

{OpenClaw's coaching notes — what the user didn't cover spontaneously}

## Key Insight for Next Time

{The one thing to remember — OpenClaw distills this}

## OpenClaw Coaching Notes

{What hints were given, how the user responded to pushback, any "I don't know" moments and how they were resolved}
```

---

## Verdict Definitions

OpenClaw assigns one of four verdicts at the end of every session:

| Verdict | Meaning | Self-Assessment Range |
|---------|---------|----------------------|
| `pass` | All requirements met, edge cases handled, no major prompting needed | 4–5 |
| `conditional-pass` | Core requirements met, minor gaps; ready to advance but worth revisiting | 3 |
| `fail` | Significant gaps, could not complete without heavy hints, wrong approach | 1–2 |
| `not-applicable` | Review & Reflect, Concept Deep Dive, Behavioral sessions (pass/fail less meaningful) | Any |

**Phase advancement requires:** 3 of 4 Mock Pressure Rounds in Week 16 rated `conditional-pass` or better. Individual sessions do not block advancement — trends do.

---

## What OpenClaw Captures Per Session

At session end, OpenClaw asks:
1. "How did that feel? 1-5?" — captures `self_assessment`
2. "How long did that take you?" — captures `time_spent_min`
3. "Anything you want to note?" — captures `notes` (optional, skip if tired)

OpenClaw also logs internally (no user input required):
- Its own `verdict` based on the session exchange
- Which hints were given (inferred from session conversation)
- Whether `gap_flags_triggered` (did this session relate to a flagged gap area)

---

## Project Entity Update Protocol

After every session, OpenClaw updates `entities/projects/daily-interview-practice.md`:

```
current_day: N+1
streak: streak+1 (or reset to 1 if gap > 1 day)
total_sessions: total_sessions+1
last_session_date: YYYY-MM-DD
```

Phase advancement triggers an additional update:
```
current_phase: N+1
current_day: 1   # reset within new phase
```

The project entity also maintains a **running score table** — per-category self-assessment averages over the last 7 sessions. This is how OpenClaw detects "this category is trending down."

---

## Streak Tracking

**Streak definition:** consecutive calendar days with at least one completed session.

**Rules:**
- Miss one day → streak resets to 0 at next session start
- Session counts only after verdict logged (not mid-session)
- Two sessions in one day count as one (streak += 1, not 2)
- Streak shown at every session open: "Day 42 — 🔥 14-day streak. Let's go."

**Streak milestones** (OpenClaw celebrates these):

| Milestone | Message |
|-----------|---------|
| Day 7 | "One week in. The daily habit is forming." |
| Day 14 | "Two weeks straight. That's discipline." |
| Day 30 | "30 sessions. You've done more practice than most people do in a year." |
| Day 50 | "Halfway through the core curriculum." |
| Day 100 | "100 sessions. If you're not ready by now, you will be soon." |
| Phase advance | "Phase {N} complete. You've earned Phase {N+1}." |

---

## Phase Advancement Logic

Phase advancement is semi-automatic — OpenClaw proposes it, user confirms.

### Standard Advancement
At the end of the final week of each phase (Week 4 for Phase 1, Week 8 for Phase 2, etc.), OpenClaw runs the **phase exit assessment** defined in `progression-map.md` and declares one of:
- **"Advance"** → move to next phase; update `current_phase` in project entity
- **"Extra week"** → stay in current phase; OpenClaw schedules a repeat week with harder variants

### Early Advancement
If self-assessment trend shows 4–5/5 across all categories for 5+ consecutive sessions, OpenClaw can propose early advancement:
> "You're consistently scoring high. Want to move to Phase {N+1} early? We can always come back."

### Triggered Review
If self-assessment drops to ≤ 2/5 for 3+ consecutive sessions in the same category, OpenClaw flags:
> "Your {category} sessions have been rough lately. Let's do a targeted day before moving on."
Then inserts one extra targeted session from that category's problem bank.

---

## Weekly Summary Format

Every Sunday (or at next session start if Sunday is missed), OpenClaw generates a weekly summary. This is delivered conversationally, not as a report — short and punchy.

**Format:**
```
Week {N} summary:
- Sessions: {N}/7 (streak: {N} days)
- Best session: {topic} — {verdict}
- Toughest session: {topic} — {verdict}
- Self-assessment trend: {up ↑ / stable → / down ↓} vs last week
- Next week focus: {the one thing to pay attention to}
```

OpenClaw appends a machine-readable version to the project entity's `weekly_summaries` list for future trend analysis.

---

## Progress Data Schema in Project Entity

The project entity maintains these running fields:

```yaml
# Current state
current_phase: 0
current_day: 1
streak: 0
longest_streak: 0
total_sessions: 0
last_session_date: null

# Phase 0 diagnostic results (populated after Day 3)
diagnostic_score: null
diagnostic_level: null  # Beginner | Developing | Intermediate | Advanced | Interview-Ready
diagnostic_start_phase: null
gap_flags: []  # [CONCURRENCY-GAP, ASYNCIO-GAP, GRAPH-GAP, LLM-INFRA-GAP, COMMUNICATION-GAP]

# Per-category baselines (populated after Phase 0 diagnostic)
category_baselines:
  python_fluency: null      # 1–5 score from diagnostic
  concurrency: null
  data_structures: null
  algorithms: null
  system_design: null
  sql: null
  communication: null

# Rolling 7-session per-category averages (updated each session)
category_rolling_avg:
  python_fluency: null
  concurrency: null
  data_structures: null
  algorithms: null
  system_design: null
  sql: null
  communication: null

# Weekly summaries (appended each Sunday)
weekly_summaries: []

# Phase advancement log
phase_log:
  - phase: 0
    started: YYYY-MM-DD
    completed: null
    verdict: null
```

---

## Trend Analysis: Reading the Logs

For the convergence-review agent (or a future forward-ralph that monitors practice), here's how to read the session logs to assess progress:

### Signal: Category drift
- Read all meeting entities with `tags: [interview-practice]`
- Group by `format` and `phase`
- Compute per-category `self_assessment` average over last 14 sessions
- Compare to `category_baselines` in project entity
- If any category has dropped > 1.0 from baseline: flag for targeted review

### Signal: Verdict trend
- Filter sessions where `format: MPR`
- Compute 4-session rolling average of verdicts (pass=5, conditional-pass=3, fail=1, na=null)
- Below 3.0 average → flag for phase hold
- Above 4.0 average → flag for potential early advancement

### Signal: Time-to-complete trend
- Filter by specific problem type (e.g., `topic: "LRU Cache from scratch"`)
- Plot `time_spent_min` over sessions
- If time is decreasing toward target: fluency building
- If time is flat or increasing after 3+ reps: approach problem, not practice problem

### Signal: Gap flag resolution
- Find sessions with `gap_flags_triggered: [CONCURRENCY-GAP]` (or other flag)
- Check if `self_assessment` in those sessions has improved over last 5 flagged sessions
- If average ≥ 4/5 for last 3 flagged sessions: gap is resolved, remove from active flags in project entity

---

## OpenClaw Behavior: Session Opening

At the start of each session, OpenClaw:

1. Reads `entities/projects/daily-interview-practice.md`
2. Checks `last_session_date` — did the user miss any days? If yes, note the gap but don't guilt-trip. Streak resets.
3. Announces current state:
   > "Day 23 — Phase 2, Week 6. You've got 8 days straight. Today: Code Kata — asyncio.Semaphore pattern."
4. Delivers the session content from `analysis/curriculum/phase-{N}-*.md` corresponding to today's day number
5. After session: logs the session meeting entity, updates project entity, commits both

---

## OpenClaw Behavior: Session Closing

After every session:

1. Ask "How did that feel? 1-5?"
2. Ask "How long?" (optional prompt: "Rough estimate is fine")
3. Ask "Anything to note?" (optional)
4. Assign internal verdict
5. Deliver coaching close:
   > "The key insight today: [one sentence]. File that away — it'll show up again."
6. Preview next session:
   > "Tomorrow: Spec Decomposition — a messy log aggregator spec with no schema."
7. Write session meeting entity
8. Update project entity
9. Commit: `bot: interview practice day NNN — {format}: {topic}`

---

## Commit Convention

All practice-related commits by OpenClaw follow this format:

```
bot: interview practice day NNN — {FORMAT}: {topic-slug}
```

Examples:
```
bot: interview practice day 001 — DIAG: python-fluency
bot: interview practice day 014 — MPR: thread-safe-rate-limiter
bot: interview practice day 042 — CK: asyncio-semaphore-pattern
```

This makes it easy to grep the git log for practice history, count sessions, or extract a specific problem's trajectory.

---

## Phase 6 Maintenance Tracking

In Phase 6, tracking relaxes slightly:
- No per-day required verdict (sessions are maintenance, not evaluation)
- Monthly diagnostic re-assessment still captured with full rubric
- Streak still tracked (same rules)
- Weekly summary format stays the same
- When interview ramp-up protocol activates (3 weeks before interview), tracking shifts back to Phase 5 intensity — verdict required for every MPR, verdicts feed advancement logic

---

## Summary: What OpenClaw Needs to Do

| Event | Action |
|-------|--------|
| Start of session | Read project entity → announce phase/day/streak → deliver session content |
| End of session | Ask 3 questions → assign verdict → write meeting entity → update project entity → commit |
| Phase exit week | Run phase exit assessment → advance or hold → update project entity |
| Sunday | Generate weekly summary → append to project entity → commit |
| Monthly (Phase 6) | Deliver 5-exercise mini-diagnostic → compare to baselines → adjust next month's sessions |
| Streak milestone | Celebrate in-message (no separate entity needed) |
| Gap flag trigger | Note in session entity → check trend after 3 flagged sessions → remove flag if resolved |
| Interview confirmed | Activate ramp-up protocol → shift to Phase 5 schedule → update project entity |
