---
type: project
name: Daily Interview Practice
status: active
started: 2026-02-28
current_phase: 0
current_day: 1
current_week: 0
streak: 0
longest_streak: 0
total_sessions: 0
last_session_date: null
estimated_weeks: 20
target: "Pass Anthropic SWE infrastructure interview loop"
tags: [interview-prep, daily-practice, swe-interview, openclaw-driven]

# Phase 0 diagnostic results (populated after Day 3)
diagnostic_score: null
diagnostic_level: null
diagnostic_start_phase: null
gap_flags: []

# Per-category baselines (populated after Phase 0 diagnostic)
category_baselines:
  python_fluency: null
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
    started: 2026-02-28
    completed: null
    verdict: null
---

# Daily Interview Practice

## The Goal

Pass the Anthropic SWE infrastructure interview — 5 rounds, 3 weeks — through 30 minutes of daily practice delivered via OpenClaw on Telegram.

The gap to close: you can code and leverage AI effectively, but raw problem-solving instincts aren't automatic yet. Concurrency patterns, data structure implementation from scratch, system design depth, and under-pressure execution all need to become muscle memory. Think of it like learning a language — daily immersion until it clicks.

---

## The North Star: What Anthropic Looks For

Five rounds, progressively harder, each testing overlapping skills:

**Round 1 — Online Assessment (90 min, 2 problems)**
Production-quality Python. Not "does it work" — "would you ship this." Thread safety, error handling, complexity analysis in comments.
- Problem 1: LRU Cache — first with OrderedDict, then from scratch (doubly linked list + hashmap, thread-safe)
- Problem 2: Task Management System — DAG with topological sort, cascading cancellation, circular dependency detection

**Round 2 — Coding Round 1**
Build something real with escalating complexity. Example: web crawler — BFS, depth control, dedup, rate limiting, robots.txt. Then make it concurrent (asyncio + semaphore). Live edge cases thrown mid-session: redirect loops, relative vs absolute URLs, pages that hang for 30 seconds.

**Round 3 — System Design (THE round)**
Design an LLM inference API. This is literally what Anthropic builds — they go deep. Key topics:
- Dynamic batching strategy: when to flush vs hold (latency/throughput trade-off)
- KV cache management: VRAM limits, eviction policies, PagedAttention
- Autoscaling signals: queue depth weighted by token count > raw GPU util (GPU util can look fine while latency tanks)
- Streaming responses: SSE vs WebSocket, backpressure, disconnect cleanup

**Round 4 — Coding Round 2**
Unfamiliar domain, fatigued. Example: convert stack sampling profiler output into trace events. Diff consecutive samples, detect function enters/exits. Catch: recursive functions — track by stack position, not function name.

**Round 5 — Hiring Manager (45 min)**
Past projects, debugging process, scaling challenges. Key moment: presented two approaches to a real team problem, asked which to pick. Winning answer: the simpler one. "Flexibility you don't need yet is just complexity you pay for now."

**Concurrency is EVERYWHERE.** OA: thread-safe LRU cache. Coding Round 1: asyncio web crawler with semaphore. System Design: concurrent GPU request management. If it's not muscle memory, you'll struggle in every round.

---

## How This Works

1. **You message OpenClaw** when you have 30 minutes. Any time, any day.
2. **OpenClaw reads this file** — checks `current_phase`, `current_day`, `streak`, `last_session_date`, and `gap_flags`.
3. **OpenClaw announces the session:**
   > "Day 23 — Phase 2, Week 6. You've got 8 days straight. Today: Code Kata — asyncio.Semaphore pattern."
4. **OpenClaw delivers the session** conversationally — asks questions, evaluates your answers, coaches Socratically. No lectures. No spoon-feeding.
5. **You work through it** — typing on your phone is fine. Most exercises are about thinking and explaining, not writing full code in an IDE.
6. **Session closes** — OpenClaw asks "How did that feel? 1-5?", "How long?", "Anything to note?". Assigns verdict. Gives key insight. Previews tomorrow.
7. **OpenClaw logs everything** — creates a meeting entity, updates this file, commits both.

**If you miss a day:** Streak resets. OpenClaw notes the gap without guilt. Keep going.

**If you say "I don't know":** OpenClaw does NOT give the answer. Asks a simpler version, asks about a related concept, walks backward from the answer shape. Socratic until you get there.

**Commit convention:** `bot: interview practice day NNN — FORMAT: topic-slug`

---

## Current Status

| Field | Value |
|-------|-------|
| Current Phase | 0 — Diagnostic |
| Day | 1 of 3 |
| Streak | 0 days |
| Total Sessions | 0 |
| Last Session | — |
| Diagnostic Score | — |
| Diagnostic Level | — |
| Active Gap Flags | None yet |
| Starting Phase | TBD after Day 3 |

---

## Today's Session

**Phase 0 · Day 1 — Python Fluency + Data Structures Diagnostic**

OpenClaw delivers this to start the session:

> **Day 1 of 3: Diagnostic.**
>
> Five exercises today — Python and data structures. No IDE, no looking things up. Just type what you know, the way you'd explain it to someone. Think aloud as you answer.
>
> I'll score each one and move on. No long explanations yet — that comes in Phase 1. Be honest: a lower score just means more runway.
>
> Ready? Let's go.

**Full session content:** `loops/daily-interview-practice/analysis/curriculum/phase-0-diagnostic.md` → Day 1 (DIAG-01 through DIAG-05)

**After this session:** Log Day 1 scores internally. Advance to Day 2. Do not disclose scores until Day 3 debrief.

---

## Phase Overview

### Phase 0: Diagnostic (Days 1–3)

Calibrate baseline before practicing the wrong things. Pure assessment — no teaching. OpenClaw scores 15 exercises across 6 categories and delivers a starting-phase recommendation.

- **Day 1:** Python fluency + data structures (DIAG-01–05)
- **Day 2:** Concurrency + algorithms (DIAG-06–10)
- **Day 3:** Systems + decomposition + communication (DIAG-11–15) + full debrief
- **Output:** Level, starting phase, top 3 gap flags

**Phase skip logic:**

| Diagnostic Score | Level | Start At |
|-----------------|-------|----------|
| 60–75 | Interview-Ready | Phase 4 (or 5 if systems strong) |
| 45–59 | Advanced | Phase 2 |
| 30–44 | Intermediate | Phase 1 (standard) |
| 15–29 | Developing | Phase 1 (slower: 6 weeks instead of 4) |
| < 15 | Beginner | Phase 1 (+ supplementary Python basics) |

---

### Phase 1: Foundations (Weeks 1–4)

Build the mechanical foundations until they're effortless. Not pattern recognition yet — just fluency. By end of Phase 1, implementing a doubly linked list from scratch should feel like writing a for loop.

**Skills:** Doubly linked list (node, insert_after, remove, sentinel nodes), LRU Cache (OrderedDict version → from scratch → thread-safe), threading.Lock / threading.RLock (with lock: pattern), BFS on adjacency list (deque, visited-on-enqueue), DFS with cycle detection (recursive, 3-color marking), thread-safe producer-consumer patterns.

**Weekly rhythm:** 4 Code Katas + 1 Spec Decomposition + 1 Review & Reflect + 1 Debug & Read.

**Exit gate:** LRU Cache from scratch (DLL + hashmap + thread-safe) in < 15 min without looking anything up. BFS and DFS written correctly on first attempt. threading.Lock usage automatic. Given a buggy DLL or BFS, find the bug in < 5 min.

**Maps to:** OA problems (LRU Cache + Task Management System).

---

### Phase 2: Pattern Building (Weeks 5–8)

Where intuition starts to develop. Trains pattern recognition — see a problem, feel its shape. By end, you should look at a problem and say "that's a sliding window" before reaching for code.

**Skills:** Topological sort (Kahn's, cycle detection), asyncio (event loop mental model, async/await, gather, Semaphore — the web crawler pattern), two-pointer, sliding window (fixed + variable), binary search (standard + on answer space), prefix sums, priority queue with heapq, SQL (JOINs, aggregation, window functions).

**Weekly rhythm:** 3 Code Katas + 1 SQL + 1 Mock Pressure Round + 1 Review & Reflect + rotating Mini System Design/Debug & Read.

**Exit gate:** asyncio.Semaphore pattern written without thinking. Topological sort (Kahn's + cycle detection) in < 12 min. Pattern identification (sliding window, two-pointer, BFS) within 2 min. SQL window function written correctly. 2/4 MPRs at conditional-pass or better.

**Maps to:** OA + Coding Round 1 (async web crawler).

---

### Phase 3: System Thinking (Weeks 9–12)

The make-or-break phase. The System Design round tests domain-specific LLM inference knowledge — interviewers build this for a living and will find the edges of your knowledge. Generic "load balancer + GPU servers" answers fail.

**Skills:** Autoregressive generation, KV cache (what's cached, why VRAM limits matter, eviction policies), continuous batching vs static batching, prefix caching, PagedAttention/vLLM, dynamic batching scheduler (flush trigger design: VRAM + time deadline + SLA), autoscaling signals (queue depth × token count beats raw GPU util), streaming (SSE vs WebSocket, backpressure), request queuing with priority + starvation prevention, caching strategy taxonomy, message queue patterns.

**Weekly rhythm:** 2 Concept Deep Dives + 2–3 Mini System Designs + 1 Code Kata/SQL + 1 Mock Pressure Round + 1 Review & Reflect.

**Exit gate:** Explain continuous batching without notes. Design inference queue layer in 20 min. Know the correct autoscaling signal and defend it. Name 3 vLLM concepts and explain why they matter. Discuss KV cache eviction trade-offs.

**Maps to:** System Design round (LLM inference API).

---

### Phase 4: Integration (Weeks 13–16)

Bring it all together. Full problems under time pressure, live edge cases thrown mid-session, behavioral storytelling. By end, completing an async web crawler in 30 min while talking through thinking.

**Skills:** Full web crawler (BFS → dedup → rate limiting → robots.txt → asyncio + semaphore → redirect loops → timeouts), Task Management System (full OA-quality), Stack profiler (position-based diff, recursive case), LRU from scratch (timed, production quality), 3–5 STAR behavioral stories (rehearsed, specific, confident), trade-off articulation under pushback.

**Weekly rhythm:** 2 Mock Pressure Rounds + 1 Spec Decomposition + 1 Behavioral Story Practice + 1 Code Kata/SQL + 1 Review & Reflect + 1 Mini System Design.

**Exit gate:** Web crawler (async, rate-limited, redirect-safe, robots.txt) in 30 min at conditional-pass or better (consistent). TMS (DAG, topo sort, cascading cancel) consistent conditional-pass or better. 3 behavioral stories rehearsed and specific. 3/4 mocks in Week 16 at conditional-pass or better.

**Maps to:** All rounds — OA, Coding Round 1, Coding Round 2, Hiring Manager.

---

### Phase 5: Sharpening (Weeks 17–20)

Remove inconsistency. Not learning new things — performing reliably. Every session is a mock round, behavioral drill, or targeted weak-area session. Raise the floor, not the ceiling.

**Skills:** Full mock OA (both problems, 90 min stamina), full mock Coding Round 1 (60 min, live edge cases), System Design mock (all 4 areas without prompting), Hiring Manager simulation, weak-area elimination, edge case drills, "explain it to me" communication, recovery from being stuck.

**Weekly rhythm:** 3 Mock Pressure Rounds + 2 Behavioral Story Practice + 1 targeted weak-area session + 1 Review & Reflect (optional rest on Sunday).

**Exit gate:** Full mock OA (both problems, 90 min): pass on both. Mock Coding Round 1 (30 min async crawler + live edge cases): pass. Mock System Design (30 min LLM inference): all 4 areas articulated without prompting. 3 behavioral stories delivered with specifics, held position on pushback. 4 consecutive days without a session below conditional-pass.

**Maps to:** Final preparation across all 5 rounds.

---

### Phase 6: Maintenance (Ongoing)

Skills decay. Phase 6 prevents that with a sustainable weekly cadence. Right mode for post-interview-ready or between interview loops.

**Weekly template:** Code Kata (skill rotation) + Mini System Design (random Phase 3 component) + Light Review + SQL or Debug & Read + Mock Pressure Round + Review & Reflect + Rest (mandatory Sunday).

**Monthly:** Mini diagnostic (5 exercises across 5 categories). If any category drops significantly from Phase 5 baseline, it gets an extra weekly session for the next month.

**Interview ramp-up protocol:** When an interview is confirmed (3 weeks out), shift to Phase 5 schedule for 2 weeks, then light review + behavioral only in the final week. Day before: rest.

---

## Session Format Reference

| Code | Format | Duration | What It Builds |
|------|--------|----------|----------------|
| CK | Code Kata | 25 min | Muscle memory for patterns — repetition until automatic |
| SD | Spec Decomposition | 25 min | Plan-before-code habit; ask clarifying questions reflex |
| MS | Mini System Design | 25–30 min | System component intuition; trade-off articulation |
| DR | Debug & Read | 20–25 min | Code reading speed; bug pattern recognition |
| SQL | SQL Challenge | 20 min | Analytical query fluency; window functions |
| MPR | Mock Pressure Round | 30 min | Under-pressure execution; time management; iterative build |
| RR | Review & Reflect | 20 min | Deliberate retrieval; gap identification; pattern solidification |
| CD | Concept Deep Dive | 25 min | ML infra knowledge depth; "why" not just "what" |
| BS | Behavioral Story Practice | 25 min | STAR stories; pushback handling; specificity |

**Cross-format coaching principles:**
- Socratic delivery — asks questions, doesn't give answers
- Edge cases thrown mid-session (like a real interviewer, not at the end)
- 3-tier hint system: simplify → related concept → backward from answer shape
- "Explain it to me" close on every CK and MPR: "In 2 sentences — what does this do and why?"
- Simplicity rewarded: "Is that complexity earning its keep?" when the user overengineers
- Gap flags surface when relevant: "Remember, this is your CONCURRENCY-GAP area — let's make sure this one lands."

---

## Verdict System

Every Mock Pressure Round gets an OpenClaw verdict:

| Verdict | Meaning |
|---------|---------|
| `pass` | All requirements met, edge cases handled, no major prompting needed |
| `conditional-pass` | Core requirements met, minor gaps; ready to advance but worth revisiting |
| `fail` | Significant gaps, couldn't complete without heavy hints, wrong approach |
| `not-applicable` | Review, Concept Deep Dive, Behavioral (pass/fail less meaningful) |

---

## Streak Milestones

| Milestone | OpenClaw Message |
|-----------|-----------------|
| Day 7 | "One week in. The daily habit is forming." |
| Day 14 | "Two weeks straight. That's discipline." |
| Day 30 | "30 sessions. You've done more practice than most people do in a year." |
| Day 50 | "Halfway through the core curriculum." |
| Day 100 | "100 sessions. If you're not ready by now, you will be soon." |
| Phase advance | "Phase N complete. You've earned Phase N+1." |

---

## Phase Advancement Logic

**Standard:** End of final week → OpenClaw runs phase exit assessment → "Advance" or "Extra week" (harder variants, same phase).

**Early:** 4–5/5 self-assessment across all categories for 5+ consecutive sessions → OpenClaw proposes early advance.

**Triggered review:** ≤2/5 for 3 consecutive sessions in same category → OpenClaw inserts one targeted session before advancing.

---

## Curriculum Files

All session content lives in `loops/daily-interview-practice/analysis/curriculum/`:

| File | Content |
|------|---------|
| `phase-0-diagnostic.md` | Days 1–3: full diagnostic scripts, scoring rubrics, level determination, gap flag logic |
| `phase-1-foundations.md` | Weeks 1–4: 28 daily sessions (DLL, LRU, BFS/DFS, threading) |
| `phase-2-patterns.md` | Weeks 5–8: 28 daily sessions (topo sort, asyncio, algorithms, SQL) |
| `phase-3-systems.md` | Weeks 9–12: 28 daily sessions (LLM infra, KV cache, batching, streaming) |
| `phase-4-integration.md` | Weeks 13–16: 28 daily sessions (full problems, behavioral, time pressure) |
| `phase-5-sharpening.md` | Weeks 17–20: 28 daily sessions (mock rounds, gap elimination) |
| `phase-6-maintenance.md` | Ongoing: 6-week rotation, monthly mini-diagnostic, interview ramp-up protocol |

**Session logs:** `entities/meetings/YYYY-MM-DD-interview-practice-day-NNN.md`

**OpenClaw skill prompt:** `loops/daily-interview-practice/analysis/openclaw-skill-prompt.md`

---

## OpenClaw Integration

### How to Read This File

`current_phase` and `current_day` are the single source of truth. Read them at session start. `current_day` is the day number within the current phase (resets to 1 on phase advance). For meeting entity filenames, use `total_sessions + 1` padded to 3 digits.

### Session Start Protocol

1. Read this file's frontmatter
2. Check `last_session_date` — note any gap without guilt-tripping; reset streak if gap > 1 day
3. Announce: `"Day {total_sessions+1} — Phase {N}, Week {W}. {streak}-day streak. Today: {FORMAT} — {topic}."`
4. Open the curriculum file for `current_phase`
5. Find the session matching `current_day` within that phase
6. Deliver conversationally

### Finding Today's Session

```
current_phase → curriculum file → day number within phase → session content
```

Phase 0: `phase-0-diagnostic.md`, days 1–3
Phase 1: `phase-1-foundations.md`, days 1–28 (Week 1 = days 1–7, Week 2 = days 8–14, etc.)
Phase 2: `phase-2-patterns.md`, days 1–28
Phase 3: `phase-3-systems.md`, days 1–28
Phase 4: `phase-4-integration.md`, days 1–28
Phase 5: `phase-5-sharpening.md`, days 1–28
Phase 6: `phase-6-maintenance.md`, 6-week rotation

### Session End Protocol

1. Ask: "How did that feel? 1-5?"
2. Ask: "How long did that take?"
3. Ask: "Anything to note?" (optional — skip if tired)
4. Assign internal verdict
5. Deliver coaching close: "The key insight today: [one sentence]. File that away — it'll show up again."
6. Preview: "Tomorrow: {FORMAT} — {topic-teaser}."
7. Write session meeting entity
8. Update this file: increment `current_day`, update `streak`, `total_sessions`, `last_session_date`
9. Commit: `bot: interview practice day NNN — FORMAT: topic-slug`

### Gap Flag Behavior

If `gap_flags` contains `CONCURRENCY-GAP`, `ASYNCIO-GAP`, `GRAPH-GAP`, `LLM-INFRA-GAP`, or `COMMUNICATION-GAP`, mention the relevant flag when delivering sessions in that skill area:

> "Remember, this is your CONCURRENCY-GAP area — let's make sure this one lands."

**Gap flag resolution:** After 3 sessions in that category with self-assessment ≥ 4/5, remove the flag from `gap_flags` in this file's frontmatter.

### Interview Ramp-Up

If user mentions a confirmed interview (3+ weeks out), activate ramp-up protocol from `phase-6-maintenance.md`: shift to Phase 5 schedule for 2 weeks, then light review + behavioral only in the final week. Day before: rest (tell the user to close the chat and sleep).

---

## Progress Log

*(OpenClaw appends a row here after each completed session)*

| Day | Date | Phase | Format | Topic | Self-Assessment | Verdict |
|-----|------|-------|--------|-------|----------------|---------|

---

## Weekly Summaries

*(OpenClaw appends these each Sunday)*

```
Week {N} summary:
- Sessions: N/7 (streak: N days)
- Best session: {topic} — {verdict}
- Toughest session: {topic} — {verdict}
- Self-assessment trend: up ↑ / stable → / down ↓ vs last week
- Next week focus: {the one thing to pay attention to}
```
