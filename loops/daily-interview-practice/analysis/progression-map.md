# Progression Map — Daily Interview Practice

Synthesized from `interview-anatomy.md`, `skill-taxonomy.md`, `current-level-diagnostic.md`, and `practice-session-formats.md`.

## Overview

Seven phases, roughly 20 weeks (5 months) of active practice at 30 min/day. Phase 0 is the diagnostic — it determines where you actually start. The "standard path" assumes starting from Intermediate (score 30–44 on diagnostic). Advanced learners enter at Phase 2; Interview-Ready learners at Phase 4.

The phases are designed to mirror how the interview rounds build on each other:
- OA problems require Phase 1 + 2 foundations (data structures, graphs, threading)
- Coding Round 1 (web crawler) requires Phase 2 async fluency
- System Design requires Phase 3 ML infra mental models
- Coding Round 2 (profiler) requires Phase 4 composure + unfamiliar domain handling
- Hiring Manager requires Phase 4–5 behavioral reps

```
Phase 0: Diagnostic (Days 1–3)
     ↓
Phase 1: Foundations (Weeks 1–4)  ← entry for Intermediate/Developing
     ↓
Phase 2: Pattern Building (Weeks 5–8)  ← entry for Advanced
     ↓
Phase 3: System Thinking (Weeks 9–12)
     ↓
Phase 4: Integration (Weeks 13–16)  ← entry for Interview-Ready
     ↓
Phase 5: Sharpening (Weeks 17–20)
     ↓
Phase 6: Maintenance (Ongoing)
```

---

## Phase 0: Diagnostic

**Duration:** 3 days
**Format:** Diagnostic (see `current-level-diagnostic.md`)
**Session length:** 35–45 min (slightly over target, worth it once)

### Purpose

Calibrate baseline before practicing the wrong things. No teaching — pure assessment. OpenClaw scores each of the 15 exercises across 6 categories and delivers a starting-phase recommendation.

### Entry Criteria

- Has a Telegram conversation with OpenClaw started
- Understands the purpose: calibration, not judgment

### Exit Criteria

- All 15 diagnostic exercises completed
- Scores tallied, level determined, top 3 gaps identified
- Starting phase confirmed

### What OpenClaw Delivers

Day 1: DIAG-01–05 (Python fluency, data structures)
Day 2: DIAG-06–10 (concurrency, algorithms)
Day 3: DIAG-11–15 (decomposition, systems, communication)
End of Day 3: Full score breakdown + starting phase recommendation

### Phase Skip Logic

| Diagnostic Score | Level | Start At |
|-----------------|-------|----------|
| 60–75 | Interview-Ready | Phase 4 (or Phase 5 if strong in systems) |
| 45–59 | Advanced | Phase 2 |
| 30–44 | Intermediate | Phase 1 (standard pace) |
| 15–29 | Developing | Phase 1 (slower pace — see note below) |
| < 15 | Beginner | Phase 1 (add supplementary Python basics) |

**Slower pace note:** If score is < 30, Phase 1 takes 6 weeks instead of 4. Each weekly template repeats with harder variants rather than progressing to new patterns.

---

## Phase 1: Foundations

**Duration:** 4 weeks (28 days)
**Primary format:** Code Kata (daily) + weekly anchors
**Target:** Tier 1 skills become automatic through repetition

### Purpose

Build the mechanical foundations until they're effortless. Not pattern recognition yet — just fluency. By end of Phase 1, implementing a doubly linked list from scratch should feel like writing a for loop.

This phase corresponds to what's tested in the **OA** — the two hardest problems (LRU Cache from scratch + Task Management System DAG) require everything built here.

### Skills Developed

**Primary (daily katas):**
- Doubly linked list: node, insert_after, remove, sentinel nodes
- Hash map mechanics: why O(1) amortized, collision handling conceptually
- LRU Cache: OrderedDict version → from-scratch version → thread-safe version
- `threading.Lock` and `threading.RLock`: when to use each, `with lock:` pattern
- BFS on adjacency list: deque, visited-on-enqueue, correct termination
- DFS with cycle detection: recursive + iterative, 3-color marking
- Thread-safe patterns: per-key locking, lock ordering to avoid deadlock

**Secondary (weekly anchors):**
- Spec decomposition habit: plan before code (Spec Decomposition, 1x/week)
- Code reading: find the bug in unfamiliar code (Debug & Read, 1x/week)
- Retrieval practice: review last week's mock problem (Review & Reflect, 1x/week)

**Not in Phase 1 (saved for Phase 2+):**
- asyncio (threading first — mental model must be solid before adding async)
- Topological sort (comes in Week 5 — graph intuition builds first)
- System design components (Phase 3)
- SQL (Phase 2)
- Mock pressure rounds (Phase 2 — need pattern fluency first)

### Weekly Session Mix

| Day | Format | Focus |
|-----|--------|-------|
| Mon | Code Kata | New pattern (e.g., doubly linked list) |
| Tue | Code Kata | Variation on Monday's pattern (e.g., DLL with sentinel nodes) |
| Wed | Spec Decomposition | Break messy spec into implementation plan |
| Thu | Code Kata | New pattern (e.g., threading.Lock) |
| Fri | Code Kata | Review + harder variant of Thursday |
| Sat | Review & Reflect | Review Wed's spec or Fri's kata with optimal solution |
| Sun | Debug & Read | Read unfamiliar code, find bugs |

*Katas rotate through all Phase 1 skills across 4 weeks — each pattern appears 3–4 times.*

### Progression Within Phase 1

**Weeks 1–2:** DLL, hash map, LRU Cache (OrderedDict), threading basics
**Week 3:** LRU Cache from scratch (DLL + dict), thread-safe LRU, BFS
**Week 4:** DFS + cycle detection, thread-safe patterns (producer-consumer), review round

### Entry Criteria

- Can write basic Python (loops, classes, dicts, lists)
- Knows what a linked list is conceptually
- Completed Phase 0 diagnostic

### Exit Criteria (must feel easy before advancing)

- LRU Cache from scratch (DLL + hashmap, thread-safe) implemented in < 15 min without looking anything up
- BFS and DFS on an adjacency list written correctly on first attempt
- `threading.Lock` usage is automatic — no need to think about it
- Given a buggy DLL or BFS implementation, can find the bug in < 5 min
- Spec decomposition: can write a 5-step plan for a messy spec before touching code

### Phase 1 → Phase 2 Gate

OpenClaw delivers a Phase 1 exit assessment (end of Week 4): Code Kata + mini spec decomposition. If the kata takes > 20 min or the spec plan is missing key steps, OpenClaw flags: "Do another week at Phase 1 before advancing."

---

## Phase 2: Pattern Building

**Duration:** 4 weeks (28 days)
**Primary formats:** Code Kata (4x/week) + SQL Challenge + Mini System Design + Mock Pressure Round starts
**Target:** Pattern recognition kicks in — see a problem, feel its shape

### Purpose

This is where intuition starts to develop. Phase 1 built the mechanical skills. Phase 2 trains pattern *recognition* — seeing a problem and knowing which tool to reach for. By end of Phase 2, the user should be able to look at a problem and say "that's a sliding window" before reaching for code.

This phase bridges toward **Coding Round 1** (web crawler) — the asyncio patterns built here are the exact skills needed there.

### Skills Developed

**Primary (katas + design):**
- Topological sort: Kahn's algorithm, cycle detection (critical for OA Problem 2)
- asyncio: event loop mental model, `async def`/`await`, `asyncio.gather`
- asyncio.Semaphore: rate limiting concurrent requests (the web crawler pattern)
- Two-pointer technique: sorted arrays, paired conditions
- Sliding window: fixed and variable size, string/subarray problems
- Binary search: standard + on answer space + rotated arrays
- Prefix sums: range queries without recomputation
- State machine design: clean transitions, enum-based status
- Priority queue with heapq: push/pop, custom priorities

**Secondary:**
- SQL: JOINs, aggregation, GROUP BY, basic window functions (SQL Challenge, 1x/week)
- System design basics: rate limiter, LRU cache as component, load balancing (Mini System Design, 1x/week)
- Mock Pressure Rounds start (1x/week, Phase 2-level problems)

### Weekly Session Mix

| Day | Format | Focus |
|-----|--------|-------|
| Mon | Code Kata | New pattern (e.g., topological sort) |
| Tue | Code Kata | asyncio-specific kata |
| Wed | Spec Decomposition | More complex ambiguous spec |
| Thu | SQL Challenge | Joins → window functions progression |
| Fri | Mock Pressure Round | 30-min timed problem (Phase 2 level) |
| Sat | Review & Reflect | Review Friday's mock |
| Sun | Mini System Design OR Debug & Read | Alternates weekly |

### Progression Within Phase 2

**Week 5:** Topological sort, asyncio fundamentals
**Week 6:** asyncio.Semaphore, sliding window, two-pointer
**Week 7:** Binary search variants, prefix sums, state machines
**Week 8:** Priority queue, heapq patterns, SQL window functions, mock round intensification

### Entry Criteria

- Phase 1 exit criteria met (LRU from scratch < 15 min, BFS/DFS automatic)
- Comfortable with `threading.Lock`
- Can decompose a spec into ordered steps

### Exit Criteria (must feel easy before advancing)

- asyncio Semaphore pattern: `sem = asyncio.Semaphore(N); async with sem: fetch(url)` written without thinking
- Topological sort (Kahn's): correct cycle detection, implemented in < 12 min
- Given a problem, can identify the pattern (sliding window, two-pointer, BFS) within 2 min
- SQL window function query (running total, rank within group) written correctly
- Passes at least 2 out of 4 Mock Pressure Rounds with "conditional pass" or better

### Entry for Advanced learners (diagnostic score 45–59)

Advanced learners skip Phase 1 and enter here. OpenClaw delivers a compressed Phase 1 review week (Week 5 is review, then Week 6 onward as normal Phase 2). If review exposes major gaps, drops back to targeted Phase 1 katas before advancing.

---

## Phase 3: System Thinking

**Duration:** 4 weeks (28 days)
**Primary formats:** Concept Deep Dive (2x/week) + Mini System Design (3x/week)
**Target:** LLM inference mental model fully formed; system design components feel natural

### Purpose

**This is the make-or-break phase.** The System Design round tests domain-specific knowledge about LLM inference serving. The interviewers build this for a living and will find the edges of your knowledge. Generic "load balancer + GPU servers" answers fail. Phase 3 builds real depth.

**Secondary goal:** Advanced asyncio patterns, concurrency in distributed systems context.

### Skills Developed

**Primary (concept deep dives + design exercises):**
- LLM inference mechanics: autoregressive generation, attention mechanism, why context length matters
- KV cache: what's being cached, why VRAM limits matter, eviction policies
- Continuous batching: how it differs from iteration batching and static batching
- Prefix caching: shared system prompts → shared KV cache
- PagedAttention (vLLM): paging KV cache like virtual memory — why it solves fragmentation
- Dynamic batching scheduler: when to flush vs hold (latency/throughput trade-off)
- Autoscaling signals: **queue depth weighted by token count** > raw GPU util (the key insight)
- GPU memory hierarchy: VRAM vs RAM, bandwidth vs capacity
- Streaming responses: SSE vs WebSocket, token-by-token flushing, backpressure
- Request queuing with priority: SLA-based, starvation prevention, token-weighted priority
- Caching strategies: write-through, write-back, TTL, invalidation
- Message queue patterns: ack/nack, dead letter, exactly-once vs at-least-once

**Secondary:**
- Advanced async: async generators, async context managers, `asyncio.Queue` for producer-consumer
- Rate limiting patterns: token bucket vs sliding window vs leaky bucket
- Mock Pressure Rounds continue (Phase 3 level problems — LRU from scratch, async crawler without concurrency)

### Weekly Session Mix

| Day | Format | Focus |
|-----|--------|-------|
| Mon | Concept Deep Dive | ML infra concept (e.g., continuous batching) |
| Tue | Mini System Design | Design a component using Monday's concept |
| Wed | Code Kata | Advanced async pattern OR Concept Deep Dive #2 |
| Thu | Mini System Design | Different component (e.g., KV cache eviction) |
| Fri | Mock Pressure Round | Phase 3 level (LRU from scratch, async crawler) |
| Sat | Review & Reflect | Review Friday's mock |
| Sun | SQL Challenge OR Debug & Read | Alternates |

### Progression Within Phase 3

**Week 9:** LLM inference mechanics (KV cache, autoregressive generation), async generators
**Week 10:** Continuous batching, prefix caching, GPU memory, vLLM conceptual model
**Week 11:** Autoscaling signals, request queuing, streaming responses, backpressure
**Week 12:** Full inference stack synthesis (design entire inference API), rate limiting, caching strategies

### Entry Criteria

- asyncio is muscle memory (semaphore pattern automatic)
- Can solve Pattern Building (Phase 2) algorithmic problems
- Mini System Design basics: knows what a cache is, can compare approaches

### Exit Criteria (must feel easy before advancing)

- Can explain continuous batching vs iteration batching without notes
- Can design the queuing layer for an LLM inference API (data structure, priority logic, memory pressure handling) in 20 minutes
- Knows what the "right" autoscaling signal is and can defend it vs raw GPU util
- Can name 3 vLLM-specific concepts and explain why they matter (PagedAttention, continuous batching, prefix caching)
- Can discuss KV cache eviction trade-offs (LRU vs shortest-remaining, preemption vs abort)

---

## Phase 4: Integration

**Duration:** 4 weeks (28 days)
**Primary formats:** Mock Pressure Round (2x/week) + Behavioral Story Practice (1x/week) + combined exercises
**Target:** End-to-end execution under time pressure; no AI assist; behavioral stories locked in

### Purpose

Bring it all together. Phase 4 simulates the actual interview conditions: full problems under time pressure, live edge cases thrown mid-session, behavioral storytelling. By end of Phase 4, the user should be able to complete a web crawler (async, dedup, rate limiting, robots.txt) in 30 minutes while talking through their thinking.

### Skills Developed

**Primary:**
- Full web crawler: BFS → dedup → rate limiting → robots.txt → asyncio + semaphore → redirect loops → timeouts (Coding Round 1)
- Task Management System: DAG → topological sort → cascading cancellation → circular dependency (OA Problem 2)
- Stack profiler → trace events: diff consecutive samples, track by position not name (Coding Round 2)
- LRU Cache from scratch: the full OA-quality version with thread safety (timed)
- Trade-off articulation under pushback: hold position when right, update when wrong
- Behavioral stories: 3–5 STAR stories with specific details, rehearsed and confident

**Secondary:**
- Combined spec → design → implementation flow (30 min end-to-end)
- SQL (advanced joins, CTEs, complex aggregations)
- Fatigue resilience: sessions after a full day (simulate late-round conditions)

### Weekly Session Mix

| Day | Format | Focus |
|-----|--------|-------|
| Mon | Spec Decomposition | Full-complexity spec (mirrors OA/Round 1 style) |
| Tue | Mock Pressure Round | Full 30-min timed problem |
| Wed | Behavioral Story Practice | One STAR story, refined |
| Thu | Code Kata OR SQL | Target weak area from diagnostic |
| Fri | Mock Pressure Round | Second mock this week (harder variant) |
| Sat | Review & Reflect | Review both mocks, name the gaps |
| Sun | Mini System Design | Integration-level component |

### Progression Within Phase 4

**Week 13:** Full web crawler (progressive complexity), behavioral story baseline
**Week 14:** Task Management System (OA-style), behavioral story refinement
**Week 15:** Stack profiler problem, combined exercises (spec + code)
**Week 16:** Full mock simulation week — 4 full 30-min mocks, evaluate pass/fail on each

### Entry Criteria

- Phase 3 exit criteria met
- Can pass Phase 3 Mock Pressure Rounds with conditional pass or better
- At least one behavioral story drafted (even rough)

### Exit Criteria (must feel easy before advancing)

- Web crawler (async, rate-limited, redirect-loop-safe, robots.txt) in 30 min: consistent "conditional pass" or better
- Task Management System (DAG, topo sort, cascading cancel): consistent "conditional pass" or better
- 3 behavioral stories rehearsed and specific enough to deliver confidently
- Mock verdict on Week 16: at least 3 of 4 mocks rated "conditional pass" or better

### Entry for Interview-Ready learners (diagnostic score 60–75)

Skip directly here (or to Phase 5 if Phase 4 exit criteria are already met). OpenClaw delivers a Phase 3 compressed review in Week 13 (LLM inference concepts only), then jumps to Phase 4 Week 14 style sessions.

---

## Phase 5: Sharpening

**Duration:** 4 weeks (28 days)
**Primary formats:** Mock Pressure Round (3x/week) + Behavioral Story Practice (2x/week)
**Target:** Consistent "interview pass" on full mocks; confidence under pressure

### Purpose

Remove inconsistency. Phase 5 is about performing reliably, not learning new things. Every session is either a mock round, a behavioral drill, or a targeted weak-area session based on self-assessment trends. The goal is to raise the floor — not the ceiling.

### Skills Developed

**Primary:**
- Full mock OA (both problems, 45 min each — simulates the 90-min OA)
- Full mock Coding Round (60 min, live edge cases from OpenClaw)
- System design mock: LLM inference API, full 45-min discussion
- Behavioral mock: Hiring Manager simulation
- Weak-area elimination: lowest self-assessment scores get extra targeted sessions

**Secondary:**
- Edge case drills: throw unusual inputs at problems that are "passing" to find remaining holes
- "Explain it to me" practice: communicate complex implementations simply
- Recovery drills: deliberately stuck, practice unblocking strategies

### Weekly Session Mix

| Day | Format | Focus |
|-----|--------|-------|
| Mon | Mock Pressure Round | Hardest problem in weakest category |
| Tue | Behavioral Story Practice | Full Hiring Manager simulation |
| Wed | Concept Deep Dive OR Code Kata | Target weakest skill area |
| Thu | Mock Pressure Round | Random — surprises build resilience |
| Fri | Mock Pressure Round | Full OA simulation (one problem, 45 min) |
| Sat | Review & Reflect | Full week review — name the trend |
| Sun | Rest OR light Debug & Read | Optional |

### Progression Within Phase 5

**Week 17:** Hardest algorithmic problems (timed full-spec variants of OA-style problems)
**Week 18:** Full mock OA (both problems), behavioral refinement
**Week 19:** Full mock Coding Round 1 (web crawler, live edge cases), System Design mock
**Week 20:** Complete full mock loop (OA + Coding + System Design in one week), debrief

### Entry Criteria

- Phase 4 exit criteria met (3/4 mocks at conditional pass or better)
- Behavioral stories rehearsed and specific
- No known gaps in fundamental patterns

### Exit Criteria (interview-ready signal)

- Full mock OA (both problems, 90 min): "pass" on both
- Mock Coding Round 1 (30 min async crawler with live edge cases): "pass"
- Mock System Design (LLM inference, 30 min): can articulate all 4 key areas (batching, KV cache, autoscaling, streaming) without prompting
- Behavioral: 3 stories delivered with specifics, held position on pushback
- Overall: 4 consecutive days without a session rated below "conditional pass"

---

## Phase 6: Maintenance (Ongoing)

**Duration:** Indefinite (post-interview-ready or between interview loops)
**Primary format:** Mixed — 2x katas, 1x system design, 1x mock, 1x behavioral, 2x light
**Target:** Keep skills sharp without burning out

### Purpose

Skills decay. Phase 6 prevents that with a sustainable weekly cadence. Also the right mode for someone who has completed Phase 5 but hasn't secured an interview yet, or who wants to maintain readiness while doing other things.

### Weekly Template (Repeating)

| Day | Format | Focus |
|-----|--------|-------|
| Mon | Code Kata | Rotation through all Tier 1 skills (cycle every 6 weeks) |
| Tue | Mini System Design | Random component from Phase 3 library |
| Wed | Light Review | Revisit a past session, fill a gap |
| Thu | SQL Challenge OR Debug & Read | Alternates weekly |
| Fri | Mock Pressure Round | Randomly selected from all phases' problem banks |
| Sat | Review & Reflect | Review Friday, note any gaps |
| Sun | Rest | Mandatory |

### Monthly Diagnostic Re-Assessment

On the first Sunday of each month, OpenClaw delivers a mini diagnostic (5 exercises across the 6 categories). If any category drops significantly from the Phase 5 baseline, that category gets an extra weekly session for the next month.

### Interview Ramp-Up Protocol

When an actual interview is confirmed (3 weeks out), shift to Phase 5 schedule for 2 weeks, then light review + behavioral only in the final week.

---

## Timeline Summary

| Phase | Duration | Cumulative Weeks | Focus |
|-------|----------|-----------------|-------|
| Phase 0 | 3 days | Days 1–3 | Diagnostic |
| Phase 1 | 4 weeks | Weeks 1–4 | Foundations (DLL, LRU, BFS/DFS, threading) |
| Phase 2 | 4 weeks | Weeks 5–8 | Pattern Building (topo sort, asyncio, algorithms) |
| Phase 3 | 4 weeks | Weeks 9–12 | System Thinking (LLM infra, batching, KV cache) |
| Phase 4 | 4 weeks | Weeks 13–16 | Integration (full problems, behavioral, time pressure) |
| Phase 5 | 4 weeks | Weeks 17–20 | Sharpening (mock rounds, consistency, eliminating gaps) |
| Phase 6 | Ongoing | Week 21+ | Maintenance |

**Total to interview-ready:** ~20 weeks (~5 months) at 30 min/day
**Adjusted for real life** (rest days, travel, off days): 6–7 months
**Accelerated path** (Advanced diagnostic): ~14–16 weeks (skip Phase 1)
**Interview-Ready path** (top diagnostic): ~8–10 weeks (skip Phases 1–3)

---

## Cross-Phase Principles

### Concurrency Is Always There
Every phase weaves in concurrency. Even in Phase 1 (threading), Phase 2 (asyncio), Phase 3 (distributed concurrency concepts), Phase 4 (concurrent implementations), Phase 5 (mocks with concurrent requirements). The goal: it stops being "the concurrency thing" and becomes automatic.

### Edge Cases Come Up, Not Down
OpenClaw throws edge cases mid-session throughout all phases. Not saved for the end. This builds the reflex that interviewers are looking for: handling edge cases as they arise, not after the interviewer prompts.

### The "Explain It To Me" Close
Every Code Kata and Mock Pressure Round ends with: "In 2 sentences: what does this do and why?" Builds the communication habit that Anthropic evaluates in every coding round.

### Simplicity As Default
From Phase 1 onward, OpenClaw actively rewards simple solutions. If the user reaches for complexity, OpenClaw asks: "Is that complexity earning its keep?" This internalizes the "flexibility you don't need yet is just complexity you pay for now" mindset from the Hiring Manager round.

### Diagnostic Flags Drive Phase 1 Customization
If Phase 0 flagged CONCURRENCY-GAP, ASYNCIO-GAP, GRAPH-GAP, LLM-INFRA-GAP, or COMMUNICATION-GAP, those gaps get extra attention in the relevant phases. OpenClaw tracks the flag and mentions it when relevant:
> "Remember, this is your flagged CONCURRENCY-GAP area — let's make sure this one lands."
