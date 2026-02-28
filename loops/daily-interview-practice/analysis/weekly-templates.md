# Weekly Session Templates — Daily Interview Practice

Synthesized from `progression-map.md` and `practice-session-formats.md`.

## How to Read These Templates

Each row is one day. Format codes:
- **CK** = Code Kata
- **SD** = Spec Decomposition
- **MS** = Mini System Design
- **DR** = Debug & Read
- **SQL** = SQL Challenge
- **MPR** = Mock Pressure Round
- **RR** = Review & Reflect
- **CD** = Concept Deep Dive
- **BS** = Behavioral Story Practice

The **Topic** column is what OpenClaw delivers that day — specific enough to generate the actual content when the curriculum content phase runs later.

The **Key Skill** column is the one thing the session builds or reinforces.

Session lengths: most fit in 25–30 minutes. Phase 5 Fri mocks are 45 min (OA simulation).

---

## Phase 1: Foundations (Weeks 1–4)

**Rhythm:** 4 Code Katas, 1 Spec Decomposition, 1 Review & Reflect, 1 Debug & Read per week.
**Progression:** Each week introduces 1–2 new patterns. Katas from earlier weeks reappear as warm-up variations.

### Week 1 — Doubly Linked List + Threading Basics

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | DLL Node: `insert_after(node, value)` and `remove(node)`, no sentinel nodes | Pointer manipulation order |
| Tue | CK | DLL with sentinel head/tail nodes: how they eliminate edge cases | Edge case elimination via sentinel pattern |
| Wed | SD | Log line parser: inconsistent format, return error-count-per-service summary | Plan before code; ask clarifying questions |
| Thu | CK | Thread-safe counter: `threading.Lock`, `with lock:` pattern, increment from 10 threads | Critical section isolation |
| Fri | CK | Thread-safe stack: list + Lock, `push`/`pop`/`peek`, what if empty? | Lock-guarded state; empty-check edge case |
| Sat | RR | Review Fri's thread-safe stack: minimal critical section? What if `peek` is also locked? | Per-operation vs coarse-grained locking |
| Sun | DR | BFS that marks `visited` on dequeue instead of enqueue — find the bug and explain why it matters | Visited-on-enqueue vs visited-on-dequeue |

### Week 2 — LRU Cache (OrderedDict) + Producer-Consumer

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | LRU Cache with `collections.OrderedDict`: `get` + `put` + capacity eviction | OrderedDict as O(1) ordered map |
| Tue | CK | LRU Cache edge cases: `put` to existing key must `move_to_end` — verify your update path | Update ≠ insert: both need LRU update |
| Wed | SD | Task queue with priority and retry: retry policy not specified — your job to ask and decide | Spec ambiguity; retry policy design |
| Thu | CK | Thread-safe LRU Cache: wrap OrderedDict version with a single `threading.Lock` | Coarse-grained lock strategy; trade-offs |
| Fri | CK | Producer-consumer: 2 threads, shared list as buffer, Lock + size limit + blocking on full | Thread coordination, busy-wait avoidance |
| Sat | RR | Review Week 2 LRU: what does `move_to_end` actually do internally? Why not just delete + reinsert? | OrderedDict implementation intuition |
| Sun | DR | LRU cache that calls `move_to_end` on `get` but not on `put` — find the stale-key eviction bug | Symmetry: both get and put update recency |

### Week 3 — LRU Cache from Scratch + BFS

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | LRU from scratch Part 1: DLL node + `_add_to_head(node)` + `_remove_node(node)` internal methods | DLL as the recency-ordered storage |
| Tue | CK | LRU from scratch Part 2: tie DLL to `dict{key: node}` for O(1) `get` + O(1) `put` | Two-structure coordination: dict for lookup, DLL for order |
| Wed | SD | User session tracker: define "active", track who's online right now, handle stale sessions | Definition clarification as design work |
| Thu | CK | BFS on adjacency list: `deque`, visited-on-enqueue, level-by-level output | BFS canonical implementation |
| Fri | CK | Thread-safe LRU from scratch: add `threading.Lock` to your Part 1 + 2 implementation | Lock placement in a two-structure design |
| Sat | RR | Compare this week's from-scratch LRU to Week 1's OrderedDict version: what does OD abstract away? | Appreciate stdlib; understand what's underneath |
| Sun | DR | Thread-safe LRU where `get()` reads without the lock — identify the race condition, explain the fix | Race condition on read-modify-write paths |

### Week 4 — DFS + Cycle Detection + Phase 1 Exit Assessment

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | DFS on adjacency list: recursive, mark visited, return path to target | DFS canonical implementation |
| Tue | CK | DFS cycle detection: 3-color marking (white=unvisited, gray=in-progress, black=done) | Cycle detection via recursion stack state |
| Wed | SD | URL domain extractor: inconsistent formats (http, https, no-scheme, trailing slash) — plan the parsing | Normalizing messy real-world input |
| Thu | CK | Producer-consumer with `threading.Condition`: `wait()` + `notify()`, why this beats busy-waiting | Condition variables; event-driven coordination |
| Fri | CK | **Phase 1 Exit Assessment**: LRU Cache from scratch (DLL + dict + thread-safe), 15-minute target | Integration of all Phase 1 skills under time pressure |
| Sat | RR | Review Fri's exit kata: what slowed you down? Draw the DLL operations. Name the gap. | Identify knowledge vs execution gaps |
| Sun | DR | DFS that doesn't handle cycles: infinite recursion on a graph with a cycle — fix it with 3-color | Applying cycle detection to a broken implementation |

**Phase 1 → Phase 2 gate:** OpenClaw evaluates the Friday exit assessment. If LRU takes > 20 min or has correctness bugs, one more week at Phase 1 (repeat Week 3 pattern with harder variants) before advancing.

---

## Phase 2: Pattern Building (Weeks 5–8)

**Rhythm:** 4 Code Katas (Mon/Tue/Wed), 1 SQL Challenge (Thu), 1 Mock Pressure Round (Fri), 1 Review & Reflect (Sat), 1 Mini System Design or Debug & Read (Sun — alternates weekly).
**Progression:** Week 5 = topological sort + asyncio basics; Week 6 = asyncio.Semaphore + algorithm patterns; Week 7 = binary search variants + prefix sums; Week 8 = heapq + async Queue + mock intensification.

### Week 5 — Topological Sort + asyncio Fundamentals

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | Topological sort: Kahn's algorithm — build in-degree map, BFS from 0-in-degree nodes, detect remaining cycles | Kahn's algorithm; cycle = nodes with remaining in-degree |
| Tue | CK | asyncio: `async def`, `await`, sequential fetches with `aiohttp` stub — understand event loop mental model | Event loop: one thread, cooperative multitasking |
| Wed | CK | Two-pointer: find pair summing to target in sorted array; then: find all pairs (no duplicates in output) | Two-pointer pattern; sorted array invariant |
| Thu | SQL | Top N users by request count in last 30 days: `GROUP BY`, `ORDER BY`, `LIMIT` | Aggregation + ordering |
| Fri | MPR | BFS maze solver: find shortest path, grid with obstacles, return path not just length | BFS on 2D grid; BFS guarantees shortest path |
| Sat | RR | Review Friday's maze: why BFS not DFS for shortest path? What changes if the maze is weighted? | BFS vs DFS choice rationale |
| Sun | MS | Design an in-memory rate limiter: token bucket vs sliding window — pick one, defend it | Rate limiter trade-offs; algorithm selection |

### Week 6 — asyncio.Semaphore + Sliding Window + Two-Pointer

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | asyncio: fetch N URLs concurrently with `asyncio.gather(*[fetch(url) for url in urls])` | Concurrent vs sequential async; gather pattern |
| Tue | CK | asyncio.Semaphore: limit to K concurrent fetches — `async with sem:` inside each coroutine | Semaphore as concurrency limiter |
| Wed | CK | Sliding window: max sum subarray of size K (fixed); then max sum subarray with sum ≤ S (variable) | Fixed vs variable sliding window |
| Thu | SQL | Services with error rate > X% this week: `GROUP BY service`, `HAVING` clause with computed ratio | HAVING with computed aggregates |
| Fri | MPR | Thread-safe sliding-window rate limiter: `allow(user_id)` → bool, per-user lock, concurrent threads | Per-key locking pattern under time pressure |
| Sat | RR | Review rate limiter: global lock vs per-user lock — throughput difference. Did you handle timestamp cleanup? | Memory leak prevention; per-key locking trade-off |
| Sun | DR | Async code that's not actually concurrent: `await fetch(url1)` then `await fetch(url2)` in sequence — spot and fix | Sequential awaits vs gather; the most common asyncio mistake |

### Week 7 — Binary Search Variants + Prefix Sums + State Machines

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | Binary search: standard (find target in sorted array); then on answer space (find smallest K where `f(K)` is true) | Binary search on values vs binary search on answer space |
| Tue | CK | Prefix sums: precompute `prefix[i] = sum(arr[:i])`; answer range sum queries `[l, r]` in O(1) | Precomputation for repeated queries |
| Wed | SD | Leaderboard system: top N users by score, real-time updates, ties handled fairly — spec is vague on ties | Handle ambiguity in "fairness"; design before coding |
| Thu | SQL | Running total of requests per day per service: `SUM(count) OVER (PARTITION BY service ORDER BY day)` | Window functions: running total pattern |
| Fri | MPR | Task scheduler with priorities: heap-based, tasks have priority + arrival time, implement `add_task` + `get_next` | `heapq` under pressure; tuple comparison for priority |
| Sat | RR | Review task scheduler: `heapq.heappush((priority, task))` vs `queue.PriorityQueue` — when to use which? | stdlib selection; heapq tuple ordering |
| Sun | MS | Design a message queue for task dispatch: ack/nack semantics, dead letter queue, at-least-once delivery | Message queue fundamentals |

### Week 8 — heapq + asyncio.Queue + Mock Intensification

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | Priority queue with `heapq`: push min-heap, support decrease-key via lazy deletion (mark invalidated entries) | Lazy deletion pattern for mutable priorities |
| Tue | CK | Producer-consumer with `asyncio.Queue`: producer `await q.put(item)`, consumer `await q.get()` + `q.task_done()` | Async producer-consumer; backpressure via maxsize |
| Wed | SD | Diff two config file versions: what counts as a meaningful change? (comment vs value vs structure) | Domain-specific equality definition |
| Thu | SQL | p95 latency per service per tier: `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)` with `PARTITION BY` | Percentile window functions; the p95 pattern |
| Fri | MPR | Async web crawler: BFS + visited set dedup + asyncio.Semaphore rate limiting (no robots.txt yet) | Building on Week 6 semaphore kata — now in a real problem |
| Sat | RR | Review crawler: was dedup correct (normalize URLs before dedup)? Did semaphore prevent thundering herd? | URL normalization; semaphore placement matters |
| Sun | DR | Topological sort that doesn't detect cycles: processes partial graph, returns incomplete order — identify the check | Cycle detection: verify no remaining non-zero in-degree nodes |

**Phase 2 → Phase 3 gate:** OpenClaw evaluates Week 8 Friday mock. Criteria: asyncio.Semaphore pattern correct, BFS with dedup implemented, at least one edge case (empty graph, self-loops) handled. If not met, one more week at Phase 2 with harder variants before advancing.

---

## Phase 3: System Thinking (Weeks 9–12)

**Rhythm:** 2 Concept Deep Dives, 2–3 Mini System Designs, 1 Code Kata or SQL, 1 Mock Pressure Round, 1 Review & Reflect per week.
**Progression:** Week 9 = LLM inference basics; Week 10 = batching + prefix caching + GPU; Week 11 = autoscaling + queuing + streaming; Week 12 = full-stack synthesis.

### Week 9 — LLM Inference Mechanics + KV Cache + Async Generators

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CD | Autoregressive generation: token-by-token, why KV cache exists, what grows with context length | Mental model: each token depends on all previous |
| Tue | MS | Design a KV cache for LLM inference: what's stored, why VRAM is the limit, what eviction means | KV cache as VRAM resource; eviction = lost context |
| Wed | CK | asyncio: async generator with `yield` inside `async def` — produce tokens one at a time as they're ready | Async generator pattern for streaming |
| Thu | MS | KV cache eviction policies: LRU vs shortest-remaining-generation vs preemption vs abort — compare | Eviction trade-offs; preemption cost |
| Fri | MPR | LRU Cache from scratch: DLL + dict + thread-safe, OA-quality, 30-min target | Integration under pressure; OA benchmark problem |
| Sat | RR | Review LRU mock: production quality? Memory leak risk? Thread safety on both get and put? | Production-quality bar; symmetry check |
| Sun | SQL | Median session length by country: `PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY duration_s)` | PERCENTILE_DISC vs PERCENTILE_CONT difference |

### Week 10 — Continuous Batching + Prefix Caching + GPU Memory

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CD | Continuous batching vs iteration batching vs static batching: the seating-guests analogy | Continuous batching: join batch mid-generation |
| Tue | MS | Design a dynamic batching scheduler: when to flush vs hold for more requests (latency/throughput dial) | Flush trigger: time, size, or memory pressure |
| Wed | CD | Prefix caching: identical system prompts → compute KV once, reuse across all requests | Prefix caching as shared computation |
| Thu | MS | PagedAttention / vLLM: paging KV cache like virtual memory — why it solves VRAM fragmentation | Fragmentation problem; paging as solution |
| Fri | MPR | Async web crawler with concurrency: BFS + dedup + asyncio.Semaphore (harder variant — add timeout per request) | `asyncio.wait_for` timeout; handle TimeoutError |
| Sat | RR | Review crawler: did timeout handling clean up correctly? What about partially-fetched pages? | Resource cleanup in async context managers |
| Sun | DR | Rate limiter with fixed-window burst: correct at most times, but allows 2x rate at window boundary — identify and fix | Fixed vs sliding window; the burst problem |

### Week 11 — Autoscaling Signals + Request Queuing + Streaming

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CD | Autoscaling signals: raw GPU util vs queue-depth-weighted-by-tokens — why util looks fine while latency tanks | Queue depth × token count as the leading signal |
| Tue | MS | Design the queuing layer for an LLM inference API: data structure, priority key, full-queue behavior | Priority queue with token-weighted keys |
| Wed | CK | asyncio.Queue with priority: producer assigns priority, consumer uses `heapq` on items from queue | Priority queue in async context |
| Thu | MS | Streaming responses: SSE vs WebSocket for token-by-token delivery; backpressure when client is slow | SSE simplicity; backpressure = slow client problem |
| Fri | MPR | Mini in-memory database: `put(key, val)`, `get(key)`, `delete(key)`, `list_prefix(prefix)` — thread-safe | Prefix scan; sorted dict or trie under pressure |
| Sat | RR | Review in-memory DB: how did you handle prefix scan? `sorted()` + bisect? Trie? Compare complexity. | Data structure selection; trade-off articulation |
| Sun | SQL | Cohort retention: users who registered in Week 1 and made a request in Week 4 — self-join or CTE | Cohort analysis pattern; date windowing |

### Week 12 — Full Inference Stack Synthesis + Rate Limiting + Caching Strategies

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CD | Request queuing with priority: SLA tiers, starvation prevention, token-weighted priority keys | Starvation vs fairness; priority aging |
| Tue | MS | Full inference API: HTTP → queue → GPU batch → streaming response — draw the full path in prose | End-to-end system thinking; every hop matters |
| Wed | MS | Caching strategies: write-through vs write-back vs write-around, TTL, invalidation — when to use each | Cache consistency trade-offs |
| Thu | CK | Token bucket rate limiter with asyncio: `async def allow(user_id)` — async-safe, no threading required | Async-safe state (no thread safety needed in single event loop) |
| Fri | MPR | Choice mock: LRU from scratch OR async crawler with full features — pick your weaker one | Self-assessment; targeted practice |
| Sat | RR | Review mock + Phase 3 reflection: what can you explain without notes? What still needs a prompt? | Meta-assessment before Phase 4 |
| Sun | DR | KV cache eviction that selects the wrong request under memory pressure: off-by-one in priority comparison | Priority queue eviction logic; comparison operator bugs |

**Phase 3 → Phase 4 gate:** OpenClaw runs a 10-minute oral assessment (conversational): "Explain continuous batching to me. Now: design the autoscaling controller. What signal do you use and why?" If either answer requires prompting beyond one clarifying question, one more targeted week at Phase 3 before advancing.

---

## Phase 4: Integration (Weeks 13–16)

**Rhythm:** 2 Mock Pressure Rounds (Tue + Fri), 1 Spec Decomposition (Mon), 1 Behavioral Story Practice (Wed), 1 Code Kata or SQL (Thu), 1 Review & Reflect (Sat), 1 Mini System Design (Sun).
**Progression:** Week 13 = web crawler end-to-end; Week 14 = Task Management System; Week 15 = stack profiler; Week 16 = full mock simulation.

### Week 13 — Web Crawler End-to-End + Behavioral Baseline

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | SD | Web crawler spec: crawl a domain up to depth D, respect rate limits, avoid loops — no hints | Decompose real Round 1 spec without scaffolding |
| Tue | MPR | Web crawler Part 1: BFS + dedup + depth control (no concurrency yet) | Foundation before adding complexity |
| Wed | BS | "Walk me through a significant technical decision you made with limited information" | First STAR story; get it on paper |
| Thu | CK | Web crawler: add asyncio.Semaphore for concurrency (build on Tue's version) | Incremental complexity; async lift |
| Fri | MPR | Web crawler Part 2: add redirect loop detection + URL normalization (http vs https, trailing slash) | Edge cases that appear in real Round 1 |
| Sat | RR | Review both crawlers: what's the minimal change to make Part 1 concurrent? What makes redirect loops hard? | Incremental refactoring; redirect loop detection |
| Sun | MS | Design the failure-handling layer of a distributed crawler: retries, timeouts, queue persistence | Production-quality thinking for web crawlers |

### Week 14 — Task Management System (OA-Style) + Behavioral Refinement

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | SD | Task Management System spec: tasks with dependencies, create/cancel/complete — no hints | Decompose real OA spec without scaffolding |
| Tue | MPR | Task Management System Part 1: topological sort + dependency validation (reject invalid states) | Kahn's under pressure with validation |
| Wed | BS | "Describe a production incident you owned. What was the root cause? How did you debug it?" | Second STAR story; debugging narrative |
| Thu | CK | Task Management System: add cascading cancellation — cancel a task → cancel all transitive dependents (BFS) | Cascading operations on a DAG |
| Fri | MPR | Task Management System Part 2: add circular dependency detection — return an error, don't crash or loop | Full OA-quality version under 30-min pressure |
| Sat | RR | Review Task System: was cascade via BFS or DFS? Why does order matter? Did you handle `already-cancelled` state? | Graph traversal choice; idempotency |
| Sun | SQL | Gap analysis: find services with 0 requests in any hour of the last 24h (generate hour series, left join) | Time gap analysis; generate_series or CTE trick |

### Week 15 — Stack Profiler + Combined Exercises

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | SD | Stack profiler → trace events spec: convert sampled stack frames into function enter/exit events — no hints | Decompose Round 4 spec; domain unfamiliarity is the point |
| Tue | MPR | Stack profiler Part 1: diff consecutive samples, emit basic enter/exit events (no recursion handling) | Diff algorithm; set difference |
| Wed | BS | "Tell me about a time you chose the simpler option over the technically correct one. Was it right?" | Third STAR story; simplicity-wins narrative (HM round key) |
| Thu | CK | Stack profiler: handle recursive functions — track by stack position, not function name | The key bug: same function at two positions = two different calls |
| Fri | MPR | Stack profiler Part 2: full version — recursive functions, function appearing at multiple stack positions | Round 4 complete simulation |
| Sat | RR | Review stack profiler: what was the key insight? Would you have caught the recursion bug without the kata? | Kata → mock transfer; self-assessment |
| Sun | MS | Caching strategy for a multi-tier ML inference system (CDN → gateway cache → model cache) | Layered caching; where each layer wins |

### Week 16 — Full Mock Simulation Week

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | MPR | LRU Cache from scratch: DLL + dict + thread-safe, OA-quality — 30-min hard target | OA benchmark under Phase 4 time pressure |
| Tue | MPR | Full web crawler: async, dedup, rate limiting, robots.txt, redirect loop detection — 30 min | Round 1 complete simulation |
| Wed | BS | All 3 stories back-to-back, then OpenClaw pushes back on one — hold your position | Behavioral rehearsal + pushback handling |
| Thu | MPR | Task Management System: full version — DAG, topo sort, cascading cancel, cycle detection — 30 min | OA Problem 2 complete simulation |
| Fri | MPR | Stack profiler: full version with recursive handling — simulate Round 4 fatigue conditions | Round 4 simulation under cumulative fatigue |
| Sat | RR | Full week debrief: which mocks passed? Conditional pass? Failed? Name the pattern of failures. | Phase 4 progress assessment |
| Sun | MS | Full inference API design from scratch: HTTP to streaming token (30 min — Phase 5 warm-up) | End-to-end system design speed |

**Phase 4 → Phase 5 gate:** At least 3 of Week 16's 5 mocks rated "conditional pass" or better by OpenClaw. Behavioral: 3 stories with specific details, held position on at least one pushback. If not met, repeat Week 15 with harder variants.

---

## Phase 5: Sharpening (Weeks 17–20)

**Rhythm:** 3 Mock Pressure Rounds (Mon + Thu + Fri), 2 Behavioral Story Practices (Tue + occasional Wed), 1 targeted weak-area session (Wed), 1 Review & Reflect (Sat), optional rest (Sun).
**Progression:** Week 17 = hardest problems + weakest area; Week 18 = full OA simulation; Week 19 = Coding Round 1 + System Design mock; Week 20 = complete full loop simulation.

### Week 17 — Hardest Problems + Weak Area Targeting

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | MPR | Hardest problem in lowest self-assessment category (OpenClaw selects based on diagnostic flags + session history) | Raise the floor, not the ceiling |
| Tue | BS | Full Hiring Manager simulation: 3 questions in sequence, no pause between, OpenClaw plays interviewer | Sustained behavioral performance |
| Wed | CK or CD | Target weakest skill from Week 16 debrief (OpenClaw selects) | Gap elimination |
| Thu | MPR | Surprise problem: OpenClaw picks randomly from Phase 3–4 problem bank — no preview | Resilience under uncertainty |
| Fri | MPR | Full OA simulation Problem 1: LRU Cache from scratch (thread-safe) — 45-minute target | Sustained output at OA time scale |
| Sat | RR | Full week debrief: trend analysis — is the same gap showing up across mocks? Name it. | Meta-pattern recognition |
| Sun | Rest | Mandatory — Phase 5 is high intensity | Recovery |

### Week 18 — Full OA Simulation + Behavioral Refinement

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | MPR | Full OA Problem 1 (LRU from scratch, thread-safe): 45-minute simulation, production-quality bar | OA Problem 1 benchmark |
| Tue | BS | Refine weakest story: add specific numbers, dates, names — "at some point" is never right | Specificity drilling |
| Wed | CK | Targeted gap from Week 17 debrief (OpenClaw selects; skip if no gap remains → take rest day) | Gap elimination or recovery |
| Thu | MPR | Full OA Problem 2 (Task Management System: DAG + topo sort + cascading cancel + cycle detection): 45-min | OA Problem 2 benchmark |
| Fri | RR | Debrief both OA problems: would they pass as production code? Thread safety complete? Memory leak risk? | Production-quality self-evaluation |
| Sat | BS | All 3 stories delivered back-to-back without notes (25 min) — then identify which story is weakest | Story fluency assessment |
| Sun | Rest | Mandatory | Recovery |

### Week 19 — Coding Round 1 + System Design Mock

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | MPR | Full web crawler simulation: async, dedup, rate limiting, robots.txt, redirect loops + OpenClaw throws 3 live edge cases mid-session | Round 1 simulation with live interruptions |
| Tue | BS | HM simulation: "You're given two approaches to a real problem. Which do you pick and why?" — OpenClaw presents both | Pick simple; defend it; don't fold |
| Wed | MS | Full LLM inference API: articulate all 4 areas (batching, KV cache, autoscaling, streaming) without being prompted — OpenClaw only asks follow-ups | System design fluency without scaffolding |
| Thu | MPR | Stack profiler full simulation: present it as an "unfamiliar domain" problem — simulate Round 4 fatigue | Round 4 simulation under fatigue |
| Fri | RR | Debrief all this week's sessions: what required a prompt that shouldn't have? Name the last remaining gaps. | Final gap identification |
| Sat | CD | Weak LLM infra concept: whichever area from Wed's design needed the most prompting | Targeted depth-building |
| Sun | Rest | Mandatory | Recovery |

### Week 20 — Complete Mock Loop (The Final Week)

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | MPR | OA simulation: both problems back-to-back (90-min total: 45 min LRU + 45 min Task System) | Full OA stamina |
| Tue | MPR | Coding Round 1 simulation: full web crawler, 60 min, OpenClaw plays interviewer — throws edge cases, asks "why" | Round 1 live simulation |
| Wed | MS | System Design mock: LLM inference API, 45 min, OpenClaw plays Anthropic interviewer — goes deep on autoscaling + batching | Round 3 live simulation |
| Thu | BS | Hiring Manager simulation: full 45-min format, all question types, pushback on at least one answer | Round 5 live simulation |
| Fri | RR | Full mock loop debrief: rate each simulated round pass/fail/conditional. What's the trajectory? | Interview-readiness assessment |
| Sat | CK or Rest | One targeted kata if a gap remains; otherwise rest — do not force a session if exhausted | Discretionary |
| Sun | Rest | Mandatory — you're done Phase 5 | Recovery + celebrate |

**Phase 5 exit / interview-ready signal:**
- Full OA (Week 20 Mon): both problems complete in 90 min, production quality
- Coding Round 1 (Week 20 Tue): web crawler passes, edge cases handled with prompts only
- System Design (Week 20 Wed): all 4 areas covered unprompted, defended autoscaling choice under pushback
- Behavioral (Week 20 Thu): 3 stories with specifics, held position on pushback
- Overall: 4 consecutive sessions rated "conditional pass" or better going into Week 20

---

## Phase 6: Maintenance (Ongoing, Week 21+)

**Rhythm:** 2 Code Katas (Mon + alternating Wed), 1 Mini System Design (Tue), 1 Mock Pressure Round (Fri), 1 Review & Reflect (Sat), 1 SQL or Debug & Read (Thu, alternating), 1 rest (Sun).

Phase 6 uses a **6-week skill rotation** so no skill goes unpracticed for more than 6 weeks. OpenClaw tracks the rotation and selects sessions accordingly.

### Repeating Weekly Template (Phase 6)

| Day | Format | Topic | Key Skill |
|-----|--------|-------|-----------|
| Mon | CK | Rotation (see 6-week table below) | Skill from current rotation week |
| Tue | MS | Random Phase 3 component from library (OpenClaw picks) | LLM infra mental models stay fresh |
| Wed | DR or Light Review | Alternates: Debug & Read one week, review a past weak session the next | Unfamiliar code reading; retrieval practice |
| Thu | SQL or BS | Alternates weekly: SQL Challenge one week, Behavioral Story Practice the next | SQL fluency + behavioral readiness |
| Fri | MPR | Random problem from any phase (OpenClaw selects from full problem bank) | Broad problem-solving range |
| Sat | RR | Review Friday's mock: gap or mastery? | Continuous calibration |
| Sun | Rest | Mandatory | Recovery |

### 6-Week Skill Rotation (Monday Katas)

| Rotation Week | Monday Topic |
|--------------|-------------|
| R1 | DLL + LRU Cache from scratch (the OA foundation) |
| R2 | asyncio.Semaphore concurrency pattern (the crawler foundation) |
| R3 | Topological sort + cascading operations on DAGs |
| R4 | BFS/DFS variants + cycle detection |
| R5 | Binary search on answer space + prefix sums |
| R6 | Thread-safe patterns: per-key locking, producer-consumer |

After R6, restart at R1 with harder variants or timed targets.

### Monthly Diagnostic Re-Assessment

On the first Sunday of each month, OpenClaw runs a 5-exercise mini-diagnostic (one per category). If any category's score drops more than 1 point from Phase 5 baseline, that skill gets an extra session each week for the following month (swap Wednesday rest or adjust Thu/Sun).

### Interview Ramp-Up Protocol

When an actual interview is confirmed:
- **3 weeks out:** Shift to Phase 5 schedule (high-intensity mock week)
- **2 weeks out:** Continue Phase 5 schedule, add behavioral rehearsal on Sat instead of RR
- **1 week out:** Light review only (Debug & Read, Review & Reflect) + behavioral polish — no new problems
- **Day before:** Rest. No practice. Behavioral stories review only if helpful.

---

## Cross-Phase Session Selection Logic

When OpenClaw selects a session for a given day, it uses this priority:

1. **Phase schedule** — Is today's format determined by the phase? (e.g., Phase 5 Fri = MPR always)
2. **Diagnostic flags** — If CONCURRENCY-GAP was flagged in Phase 0, concurrency topics get first pick when multiple options are available
3. **Self-assessment trend** — If the last 3 sessions in a category were rated < 3/5, that category gets priority
4. **Streak continuity** — Never schedule the same format 3 days in a row (variety prevents staleness)
5. **Random within constraints** — When all constraints are met, randomize to build resilience to surprise

### The Non-Negotiables (Every Phase)

| Rule | Rationale |
|------|-----------|
| Friday = Mock Pressure Round (Phases 2–5) | End-of-week performance check; highest stakes slot |
| Saturday = Review & Reflect | Retrieval practice always follows performance; never skip |
| Phase 5 Sunday = Rest | High-intensity phases require recovery to consolidate |
| "Explain it to me" closes every CK and MPR | Communication habit is built through repetition, not osmosis |
| OpenClaw throws one edge case mid-session on CK + MPR | Edge-case reflex built in context, not as a separate drill |
