# Skill Taxonomy — Anthropic SWE Interview

Derived from `interview-anatomy.md` and `input/interview-research.md`.

Priority key: **CRITICAL** (appears in 3+ rounds or is an explicit pass/fail gate) → **HIGH** (appears in 2 rounds or commonly differentiates pass/fail) → **MEDIUM** (appears in 1 round or is supporting) → **LOW** (nice to have).

Trainability in 30-min sessions rated: **Yes** (concrete, can practice in isolation), **Partial** (requires ramp-up but doable in 30 min once fundamentals land), **No** (requires sustained hours or real systems exposure — build over weeks, not single sessions).

---

## Category 1: Python Fluency

The foundation everything else rests on. If Python feels like a foreign language, every other skill suffers.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| `collections` stdlib — OrderedDict, deque, defaultdict, Counter, heapq | Python Fluency | OA | CRITICAL | Yes |
| Idiomatic Python patterns — list/dict/set comprehensions, generators, context managers | Python Fluency | OA, Round 1 | CRITICAL | Yes |
| Clean naming and structure — readable variables, well-named classes, DRY abstractions | Python Fluency | OA, Round 1 | HIGH | Yes |
| Complexity analysis — O() notation in comments, being able to state best/worst/average | Python Fluency | OA | HIGH | Yes |
| Error handling — try/except, raising meaningful exceptions, not swallowing errors silently | Python Fluency | OA | HIGH | Yes |
| String manipulation — slicing, split/join, formatting, parsing | Python Fluency | All Coding Rounds | MEDIUM | Yes |
| File and I/O patterns — reading, writing, streaming line-by-line | Python Fluency | Round 1 (robots.txt parsing) | MEDIUM | Yes |
| Type annotations — basic use, when they add clarity vs clutter | Python Fluency | OA | LOW | Yes |
| Itertools and functools — when stdlib beats rolling your own | Python Fluency | OA, Round 1 | MEDIUM | Yes |
| Dataclasses and named tuples — when to use vs plain dict vs class | Python Fluency | OA | MEDIUM | Yes |

---

## Category 2: Concurrency (Python)

**This is the single most cross-cutting skill.** Every technical round touches it. If this isn't muscle memory, you will struggle.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| `asyncio` basics — event loop, `async def`, `await`, coroutines | Concurrency | OA, Round 1, Round 3 | CRITICAL | Yes — but needs reps |
| `asyncio` task management — `asyncio.gather`, `asyncio.wait_for`, `create_task` | Concurrency | Round 1 (timeout logic) | CRITICAL | Yes |
| `asyncio.Semaphore` — rate limiting concurrent requests | Concurrency | Round 1 | CRITICAL | Yes |
| `aiohttp` — async HTTP client patterns | Concurrency | Round 1 | HIGH | Yes |
| `threading.Lock` and `threading.RLock` — protecting shared mutable state | Concurrency | OA (thread-safe LRU) | CRITICAL | Yes |
| Thread safety design — knowing WHEN to lock, not just HOW to lock | Concurrency | OA | CRITICAL | Partial — needs deliberate practice |
| Atomic operations — what operations are GIL-protected vs need explicit locking | Concurrency | OA | HIGH | Partial |
| `threading.Thread` — spawning, joining, daemon threads | Concurrency | OA | HIGH | Yes |
| Producer-consumer patterns — queue-based coordination | Concurrency | OA, Round 3 | HIGH | Yes |
| Deadlock avoidance — ordering locks, avoiding circular waits | Concurrency | OA | MEDIUM | Partial |
| Async generators and async context managers | Concurrency | Round 1 | MEDIUM | Yes |
| `concurrent.futures` — ThreadPoolExecutor, ProcessPoolExecutor | Concurrency | OA, Round 1 | MEDIUM | Yes |

---

## Category 3: Data Structures (From Scratch)

The difference between "uses stdlib" and "understands the mechanism underneath." Tested explicitly in OA.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| Doubly linked list — implementation, pointer manipulation, eviction | Data Structures | OA (LRU Cache Phase 2) | CRITICAL | Yes — focused drills |
| Hash map — implementation from scratch, collision handling | Data Structures | OA (LRU Cache Phase 2) | CRITICAL | Yes |
| Stack — array-backed, linked-list-backed, knowing when each is better | Data Structures | Round 4 (profiler) | HIGH | Yes |
| Queue — deque-backed, ring buffer, priority queue with heapq | Data Structures | OA, Round 1 | HIGH | Yes |
| Binary tree — insertion, traversal (in/pre/post order) | Data Structures | (Implicit in graph) | MEDIUM | Yes |
| Graph (adjacency list) — directed, undirected, weighted | Data Structures | OA (Task DAG), Round 1 | HIGH | Yes |
| Min/Max heap — push/pop/heapify, when to use over sorted | Data Structures | OA | HIGH | Yes |
| Trie — prefix-based lookup | Data Structures | (Less likely but good to know) | LOW | Yes |
| LRU Cache — the full pattern: doubly linked list + hash map integration | Data Structures | OA | CRITICAL | Yes |

---

## Category 4: Algorithms & Problem-Solving

Pattern recognition is what separates fast solvers from slow ones. The goal is: see the problem, immediately feel what shape it is.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| BFS — level-order traversal, shortest path in unweighted graphs | Algorithmic Thinking | Round 1 (web crawler) | CRITICAL | Yes |
| DFS — recursive and iterative, backtracking, cycle detection | Algorithmic Thinking | OA (circular dep detection), Round 1 | CRITICAL | Yes |
| Topological sort — Kahn's algorithm, DFS-based, detecting cycles | Algorithmic Thinking | OA (Task DAG) | CRITICAL | Yes |
| Graph cycle detection — DFS with "in-progress" color marking | Algorithmic Thinking | OA | CRITICAL | Yes |
| Two-pointer technique — sorted arrays, palindromes, window problems | Algorithmic Thinking | (Implied as pattern) | HIGH | Yes |
| Sliding window — fixed and variable, substring problems | Algorithmic Thinking | (Implied) | HIGH | Yes |
| Binary search — standard, on answer-space, rotated array | Algorithmic Thinking | (Implied) | HIGH | Yes |
| Greedy algorithms — when local optimum = global optimum | Algorithmic Thinking | (Implied) | MEDIUM | Yes |
| Dynamic programming — recognizing overlapping subproblems, memoization | Algorithmic Thinking | (Less frequent at Anthropic) | MEDIUM | Partial |
| Diff/delta computation — comparing consecutive states, detecting changes | Algorithmic Thinking | Round 4 (stack profiler diffing) | HIGH | Yes |
| State machine design — clean transitions, no spaghetti | Algorithmic Thinking | OA (task status), Round 4 | HIGH | Yes |
| Problem decomposition — break a messy spec into ordered steps | Problem Decomposition | All rounds | CRITICAL | Partial — needs deliberate practice |
| Complexity analysis in the moment — state O() while writing, not after | Algorithmic Thinking | OA | HIGH | Yes |

---

## Category 5: Systems Thinking & Design

Two modes: (a) live design with an interviewer (System Design round) and (b) implicit design decisions embedded in coding rounds.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| LLM inference mechanics — how tokens are generated, KV cache, attention | System Design | Round 3 | CRITICAL | Partial — reading + discussion |
| Dynamic batching — continuous batching, batch flushing strategies | System Design | Round 3 | CRITICAL | Partial |
| KV cache management — memory pressure, eviction policies, prefix caching | System Design | Round 3 | CRITICAL | Partial |
| Autoscaling signals — queue depth vs raw utilization, token-weighted metrics | System Design | Round 3 | HIGH | Yes — conceptual discussion |
| Request queuing with priority — SLAs, priority queues, starvation prevention | System Design | Round 3 | HIGH | Yes |
| Streaming responses — SSE vs WebSocket, backpressure, token-by-token | System Design | Round 3 | HIGH | Yes |
| Caching strategies — write-through, write-back, cache invalidation | System Design | Round 3 | HIGH | Yes |
| Load balancing — round-robin, least connections, consistent hashing | System Design | Round 3 | MEDIUM | Yes |
| API design — REST vs gRPC vs streaming, request/response shape | System Design | Round 3 | MEDIUM | Yes |
| Rate limiting — token bucket, leaky bucket, sliding window | System Design | Round 1 (web crawler), Round 3 | HIGH | Yes |
| Distributed systems fundamentals — CAP theorem, eventual consistency | System Design | Round 3 (implied) | MEDIUM | Yes |
| GPU memory hierarchy — VRAM vs RAM, why it matters for inference | System Design | Round 3 | HIGH | Partial |
| vLLM / TGI / PagedAttention — conceptual knowledge, not implementation | System Design | Round 3 | HIGH | Partial — reading + discussion |
| Designing for failure — timeouts, retries, circuit breakers | System Design | Round 1, Round 3 | HIGH | Yes |
| Trade-off articulation — can name the trade-off, quantify it, defend a choice | System Design | All rounds | CRITICAL | Partial |

---

## Category 6: HTTP & Networking Patterns

Comes up in coding rounds, less in design. Mostly practical.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| HTTP fundamentals — methods, status codes, headers, redirects | HTTP & Networking | Round 1 | HIGH | Yes |
| URL parsing — absolute vs relative, urljoin, query strings | HTTP & Networking | Round 1 | HIGH | Yes |
| Redirect handling — 301 vs 302, infinite redirect loop detection | HTTP & Networking | Round 1 | HIGH | Yes |
| robots.txt — format, parsing, respecting crawl-delay | HTTP & Networking | Round 1 | MEDIUM | Yes |
| Timeout handling — request timeouts, connect timeouts, per-host limits | HTTP & Networking | Round 1 | HIGH | Yes |
| HTML parsing — BeautifulSoup basics, extracting links | HTTP & Networking | Round 1 | MEDIUM | Yes |

---

## Category 7: Under-Pressure Execution

This is a meta-skill: how you perform when stressed, watched, and tired.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| Start working before the spec is perfect — build incrementally | Under-Pressure Execution | All coding rounds | CRITICAL | Yes — simulated drills |
| Time-box planning — decide what to build in the first 5 minutes | Under-Pressure Execution | OA, Round 1, Round 4 | CRITICAL | Yes |
| Partial credit mindset — ship something working, then improve | Under-Pressure Execution | OA | HIGH | Yes |
| Fatigue management — staying sharp in hour 5 | Under-Pressure Execution | Round 4 | HIGH | Partial — build with consistency |
| Handling live edge cases — integrate without losing the thread | Under-Pressure Execution | Rounds 1, 4 | CRITICAL | Yes — deliberate edge case drills |
| Recovering from being stuck — unblock yourself, ask right question | Under-Pressure Execution | All coding rounds | HIGH | Partial |
| Timed problem execution — finish within target time consistently | Under-Pressure Execution | All rounds | CRITICAL | Yes — timed drills |

---

## Category 8: Communication & Behavioral

Not just "soft skills" — these are evaluated alongside technical output in every round.

| Skill | Category | Tested In | Priority | Trainable in 30-min sessions? |
|-------|----------|-----------|----------|-------------------------------|
| Thinking aloud — narrate your reasoning without going silent | Communication | Rounds 1, 2, 4, 5 | CRITICAL | Yes — deliberate practice |
| Explaining trade-offs — "I chose X over Y because..." | Communication | Rounds 1, 2, 3, 5 | CRITICAL | Yes |
| Defending decisions under pushback — hold position when right, update when wrong | Communication | Rounds 3, 5 | HIGH | Partial — needs reps |
| Admitting uncertainty — "I'm not sure, but I'd reason it this way..." | Communication | All rounds | HIGH | Yes |
| Structured past project narrative — STAR format, real specifics | Communication | Round 5 | HIGH | Yes |
| Debugging process articulation — isolate, hypothesize, instrument, verify | Communication | Round 5 | HIGH | Yes |
| Defaulting to simplicity — YAGNI mindset, can articulate why | Communication | OA, Round 3, Round 5 | HIGH | Yes |
| Asking clarifying questions — what to ask, when to ask it | Communication | All coding rounds | MEDIUM | Yes |

---

## Priority Summary — Skills by Rank

### CRITICAL (must have to pass)
These are pass/fail gates. Weakness here = rejection.

1. **Python concurrency** — asyncio, threading, locks, semaphores (all technical rounds)
2. **Problem decomposition under time pressure** (all rounds)
3. **Graph algorithms** — BFS, DFS, topological sort, cycle detection (OA, Round 1)
4. **LRU Cache / doubly linked list + hashmap from scratch** (OA — explicit problem)
5. **LLM inference mechanics** — KV cache, batching, autoscaling (Round 3)
6. **Thinking aloud while coding** (all coding rounds)
7. **Edge case handling without being prompted** (Rounds 1, 2, 4)
8. **Incremental building** — get something working, then improve (all coding rounds)
9. **Trade-off articulation** (Rounds 3, 5)
10. **Timed problem execution** — consistent delivery within target time (all rounds)

### HIGH (needed to pass confidently)
Present in 2+ rounds or strongly differentiates pass from fail.

- Python stdlib fluency (collections, itertools, etc.)
- Thread-safe design patterns (not just syntax)
- HTTP + URL handling patterns
- Dynamic batching / KV cache depth (Round 3 deep dives)
- Rate limiting patterns
- Streaming response design
- State machine design
- Defending decisions under pushback
- STAR stories with real specifics (Round 5)
- Structured debugging process (Round 5)

### MEDIUM (supporting skills)
Appear in one round or provide depth beyond pass threshold.

- Dynamic programming basics
- Distributed systems fundamentals
- Async generators / context managers
- Trie, balanced BST (less likely but possible)
- robots.txt parsing details

### LOW (nice to have, low ROI)
- Type annotations deep knowledge
- Advanced network protocols
- Process-level parallelism (multiprocessing)

---

## Skills Tested Across Multiple Rounds (Training Priority Multiplier)

| Skill | Rounds Tested | Multi-Round Weight |
|-------|--------------|-------------------|
| Python concurrency (asyncio + threading) | OA + Round 1 + Round 3 | 3x |
| Edge case handling without prompting | OA + Round 1 + Round 4 | 3x |
| Problem decomposition + incremental building | OA + Round 1 + Round 4 | 3x |
| Trade-off articulation and communication | Round 1 + Round 3 + Round 5 | 3x |
| Production code quality | OA + Round 1 + Round 2 | 3x |
| Default-to-simplicity mindset | OA + Round 3 + Round 5 | 3x |
| BFS/DFS graph traversal | OA + Round 1 | 2x |
| Rate limiting patterns | Round 1 + Round 3 | 2x |
| System design trade-offs | Round 3 + Round 5 | 2x |

---

## Trainability Summary

Skills are roughly sorted by trainability × priority — i.e., which skills to attack first for maximum ROI.

| Tier | Skills | Training Approach |
|------|--------|-------------------|
| **Tier 1: Daily katas** | asyncio, threading/locks, BFS/DFS, topological sort, doubly linked list, LRU cache | Repeated implementation drills — build from scratch daily until effortless |
| **Tier 2: Deliberate practice** | Problem decomposition, state machines, trade-off articulation, timed execution | Spec decomposition exercises and mock rounds with strict time limits |
| **Tier 3: Conceptual study + discussion** | LLM inference mechanics, vLLM/batching, KV cache, autoscaling signals | Reading + OpenClaw discussion prompts, then design exercises |
| **Tier 4: Behavioral reps** | Thinking aloud, STAR stories, defending decisions, admitting uncertainty | OpenClaw Socratic sessions — practice explaining and defending |
| **Tier 5: Supporting skills** | HTTP/URL patterns, robots.txt, HTML parsing, streaming responses | Woven into crawler-type exercises rather than standalone drills |
