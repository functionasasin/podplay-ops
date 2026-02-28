---
type: project
name: Daily Interview Practice
status: active
started: 2026-02-28
current_phase: 0
current_day: 0
current_week: 0
streak: 0
longest_streak: 0
total_sessions: 0
estimated_weeks: 20
target: "Pass Anthropic-level SWE interview loop"
tags: [interview-prep, daily-practice, swe-interview, openclaw-driven]
---

# Daily Interview Practice

## The Goal

Go from "can code and leverage AI, but lacks raw problem-solving instincts" to "can confidently pass an Anthropic-level SWE interview" — through 30 minutes of daily practice, delivered via OpenClaw.

This is like learning a language. No shortcuts. Just 30 minutes every day until the instincts are automatic.

## How This Works

1. **OpenClaw reminds you daily** to start your practice session
2. **You talk to OpenClaw for 30 minutes** — it delivers today's exercise, you work through it conversationally
3. **OpenClaw logs completion** — updates this file and creates a meeting entity for the session
4. **The curriculum progresses automatically** — each day builds on the last
5. **A reverse ralph loop** (`loops/daily-interview-practice/`) generated this curriculum and can regenerate/update it

## Current Status

- **Phase**: 0 — Diagnostic (not yet started)
- **Day**: 0 / ~143 total
- **Streak**: 0 days
- **Next session**: Phase 0, Day 1 — Python Fluency Diagnostic

## Timeline Estimate

| Phase | Focus | Weeks | Sessions |
|-------|-------|-------|----------|
| 0 | Diagnostic | <1 | 3 |
| 1 | Foundations — Python fluency, basic DS&A | 4 | 28 |
| 2 | Pattern Building — algorithmic patterns, SQL | 4 | 28 |
| 3 | System Thinking — design, scaling, trade-offs | 4 | 28 |
| 4 | Integration — combined exercises, mock interviews | 4 | 28 |
| 5 | Sharpening — full mocks, weak-area targeting | 4 | 28 |
| 6 | Maintenance — ongoing mixed practice | ∞ | ∞ |

**Total to interview-ready: ~20 weeks (5 months) at 30 min/day.**
With rest days and life happening, realistically **6-7 months**.

## Session Types

| Type | Duration | What You Do |
|------|----------|-------------|
| Code Kata | 15-20 min | Solve a focused coding exercise, then review the optimal approach |
| Spec Decomposition | 20 min | Break a messy/vague spec into implementation steps (thinking, not coding) |
| Mini System Design | 20 min | Design a system component, explain trade-offs |
| Debug & Read | 15 min | Read unfamiliar code, find the bug, explain what it does |
| SQL Challenge | 15 min | Progressively harder SQL query challenge |
| Mock Pressure Round | 30 min | Full timed problem simulating interview conditions — no AI help |
| Review & Reflect | 10 min | Review yesterday's problem, identify what you missed, extract the pattern |

## Phase Details

### Phase 0: Diagnostic (Days 1-3)

Before the curriculum starts, we figure out where you are. Three diagnostic sessions covering all skill areas. Based on your results, the curriculum adjusts — you might skip ahead in areas where you're strong and spend more time where you need it.

- **Day 1**: Python fluency + data structures diagnostic
- **Day 2**: Problem decomposition + algorithmic thinking diagnostic
- **Day 3**: System design + SQL diagnostic

### Phase 1: Foundations (Weeks 1-4)

Build the base. Daily code katas focused on Python fluency and fundamental data structures. This is the "scales and exercises" phase — not glamorous, but everything builds on this.

**Focus areas**: Python stdlib mastery, list/dict/set operations, string manipulation, basic recursion, sorting/searching, hash maps, stacks/queues

**Weekly pattern**: Mon-Wed code katas (progressive), Thu spec decomposition, Fri mock pressure, Sat review, Sun debug & read

### Phase 2: Pattern Building (Weeks 5-8)

Start recognizing patterns. The goal isn't to memorize — it's to develop intuition for WHEN to use each approach. Each session teaches the "why" behind the pattern.

**Focus areas**: Two-pointer, sliding window, BFS/DFS, dynamic programming basics, greedy algorithms, prefix sums, binary search variations, SQL window functions and complex joins

**Weekly pattern**: Mon-Tue code katas (new pattern + harder variant), Wed SQL challenge, Thu spec decomposition, Fri mock pressure, Sat review, Sun debug & read

### Phase 3: System Thinking (Weeks 9-12)

System design isn't about memorizing architectures — it's about developing intuition for trade-offs. Every session is a mini design discussion: "how would you build X?" with follow-up questions that force you to think about failure modes, scaling, and real numbers.

**Focus areas**: API design, caching, database design, sharding, load balancing, message queues, CAP theorem in practice, latency budgets, failure mode analysis

**Weekly pattern**: Mon-Tue mini system design, Wed code kata, Thu spec decomposition (system-level), Fri mock pressure, Sat review, Sun design case study

### Phase 4: Integration (Weeks 13-16)

Put it all together. Combined exercises that mirror the actual interview: messy specs you decompose and then implement, design discussions that require concrete code, and full mock CodeSignal-style challenges with progressive levels.

**Focus areas**: Multi-step implementation from spec, CodeSignal-style progressive problems, combined code + design, behavioral prep (STAR stories)

**Weekly pattern**: Mon spec→code, Tue system design, Wed progressive challenge, Thu behavioral prep, Fri full mock round, Sat review, Sun debug & read

### Phase 5: Sharpening (Weeks 17-20)

The hardest problems. Full mock interview rounds. Targeted practice on your weak areas (based on self-assessment trends). This phase builds confidence through competence.

**Focus areas**: Hardest problems in each category, full mock rounds, weak-area targeting, communication under pressure, "explain your approach" practice

**Weekly pattern**: Mon-Tue targeted weak-area practice, Wed hard code kata, Thu system design, Fri full mock round, Sat review + self-assessment, Sun rest or catch-up

### Phase 6: Maintenance (Ongoing)

Stay sharp. Mixed sessions across all categories. Monthly re-diagnostic. Ramp up intensity before an actual interview.

---

## OpenClaw Instructions

When the user wants to do their daily interview practice:

1. **Read this file** to determine current phase, day, and session type
2. **Look up today's session** in the curriculum files at `loops/daily-interview-practice/analysis/curriculum/`
3. **Deliver the session conversationally**:
   - Present the exercise
   - Let the user think and respond
   - Guide with hints if stuck (Socratic — don't give answers)
   - Evaluate their response
   - Share the key insight / optimal approach
   - Ask "what would you do differently next time?"
4. **Log completion**:
   - Update `current_day` and `streak` in this file's frontmatter
   - Create a meeting entity: `entities/meetings/YYYY-MM-DD-interview-practice.md` with tags: [interview-practice]
   - Include: phase, session type, topic, self-assessment score (ask user 1-5), notes
5. **Advance the curriculum**: increment day, check if phase transition is needed

### Daily Reminder

Send a Telegram message at the user's preferred time:
> "Interview practice time — 30 min. Today: [session type] — [topic]. Ready when you are."

### If the user says "skip today"

Log it. Don't guilt trip. Reset streak. Move on.

### If the user says "I don't know" during an exercise

Don't give the answer. Instead:
1. Simplify the problem — "What if we only had 10 items instead of 10,000?"
2. Ask about related concepts — "What data structure lets you look up by key in O(1)?"
3. Walk backward from the answer — "The optimal solution uses X. Why might that work here?"

### Tone

Coach, not lecturer. You're a practice partner, not a professor. Be direct, encouraging, and honest. If the answer is wrong, say so — then help them find the right one.

---

## Progress Log

| Date | Phase | Day | Type | Topic | Score | Streak | Notes |
|------|-------|-----|------|-------|-------|--------|-------|

<!-- OpenClaw appends rows here after each session -->
