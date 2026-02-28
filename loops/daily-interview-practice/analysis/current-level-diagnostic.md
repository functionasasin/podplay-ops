# Current-Level Diagnostic — Anthropic SWE Interview Prep

## Purpose

Before starting the curriculum, run 3 days of diagnostic sessions to establish your baseline across all skill categories. OpenClaw delivers 5 exercises per day, each 5–10 minutes. The goal is calibration, not teaching — save learning for Phase 1.

The diagnostic scores determine **which phase to start at**, not whether you're ready. There's no bad result. A lower score just means more runway.

---

## Delivery Format

OpenClaw asks each exercise conversationally. You respond in the chat — type your answer as you'd explain it to someone. No IDE required. Think aloud as you answer. OpenClaw gives brief feedback and moves on. You'll see your level at the end of Day 3.

**Each day:** ~35–45 min total
**Each exercise:** 5–10 min (OpenClaw will nudge if you go long)

---

## Scoring

Each exercise scored **1–5**:
- **1** — No functional understanding
- **2** — Vague or partially correct
- **3** — Working understanding with gaps
- **4** — Solid, handles most cases
- **5** — Interview-ready answer

15 exercises total × 5 points max = **75 points possible**

---

## Day 1: Python Fluency + Data Structures

*Exercises DIAG-01 through DIAG-05*

OpenClaw opening message:
> "Day 1 of your diagnostic. Five exercises today — Python basics and data structures. No IDE, no looking stuff up. Just type what you know. Ready? Let's go."

---

### DIAG-01: Collections Fluency

**OpenClaw prompt:**
> "Without running code — what does Python's `Counter` do, and when would you prefer it over a plain dict? Give me a quick example."

**Target time:** 5 min
**Difficulty:** 2/5
**Category:** Python Fluency

**Scoring rubric:**
- **1**: "I've heard of it but don't really know what it does"
- **2**: "It counts things" — correct direction but no example, no awareness of when to prefer it
- **3**: Explains Counter counts occurrences of items in an iterable; gives a real use case (word frequency, character count); knows it returns a dict-like object
- **4**: Knows Counter handles missing keys gracefully (returns 0 not KeyError); knows `most_common(n)`; can articulate the ergonomic win over `dict.get(k, 0) + 1` pattern
- **5**: All of 4 + mentions Counter arithmetic (c1 + c2 adds counts), knows when plain dict is still better (when you need arbitrary value types), might mention `Counter` is a subclass of dict

**What to look for:** Fluency of response. A 4-5 person answers immediately. A 1-2 person hesitates and hedges. Predicts overall Python comfort level.

**Follow-up (if score looks like 3 to confirm):** "Okay, what about `defaultdict`? When would you use that vs Counter?"

---

### DIAG-02: LRU Cache — First Implementation

**OpenClaw prompt:**
> "Implement an LRU cache. It should support `get(key)` and `put(key, value)` with a fixed capacity. When full, evict the least recently used item. Use whatever Python tools feel right. Walk me through your approach first, then write the code."

**Target time:** 10 min
**Difficulty:** 3/5
**Category:** Python Fluency + Data Structures

**Scoring rubric:**
- **1**: Can't get started — unclear on what LRU means or no approach
- **2**: Describes the concept but implementation is incorrect (e.g., using a list with linear search — O(n) per op)
- **3**: Reaches for `OrderedDict` or `dict` + manually maintained list; gets something working but may have subtle bugs (e.g., `move_to_end` on access but not on update)
- **4**: Clean `OrderedDict` solution — correct `move_to_end(key)` on both get and put, correct eviction with `popitem(last=False)`, handles edge cases (key exists → update)
- **5**: All of 4 + notes the O(1) complexity, mentions thread safety would require a lock, proactively handles capacity=0 or capacity=1 edge case

**What to look for:** Do they immediately reach for OrderedDict (Python fluency indicator)? Do they mention complexity? Do they handle "key exists on put" (update + move to end)?

**Follow-up (if they nailed it):** "Now walk me through how you'd implement this from scratch WITHOUT OrderedDict. What data structures would you need?"

---

### DIAG-03: Doubly Linked List — From Scratch

**OpenClaw prompt:**
> "Let's go lower level. Write me a `Node` class for a doubly linked list, and then write an `insert_after(node, new_val)` and `remove(node)` function. You're implementing the raw pointer manipulation."

**Target time:** 10 min
**Difficulty:** 3/5
**Category:** Data Structures (From Scratch)

**Scoring rubric:**
- **1**: Can't write the Node class, or doesn't understand what "doubly" means
- **2**: Writes a singly linked list or gets confused about prev/next pointer updates
- **3**: Correct Node class (val, prev, next); insert_after works but remove has a bug — e.g., doesn't update the surrounding nodes' pointers correctly, or doesn't handle head/tail edge cases
- **4**: Correct Node, correct insert_after (new_node.prev = node, new_node.next = node.next, then update node.next.prev and node.next), correct remove (update prev.next and next.prev); handles the case where removed node is at head or tail
- **5**: All of 4 + uses sentinel head/tail nodes to eliminate edge cases, or explicitly calls out why sentinel nodes simplify the logic. Clean naming. Would work as-is in the LRU cache implementation.

**What to look for:** Pointer manipulation comfort. This is the thing people freeze on under pressure. The common bug: updating `node.next = new_node` before setting `new_node.prev = node`, losing the reference.

**Follow-up:** "Why do we need a doubly linked list for LRU cache instead of a singly linked list?"

---

### DIAG-04: Edge Case Reflexes

**OpenClaw prompt:**
> "I have this function:
>
> ```python
> def merge_sorted(a: list, b: list) -> list:
>     result = []
>     i, j = 0, 0
>     while i < len(a) and j < len(b):
>         if a[i] <= b[j]:
>             result.append(a[i]); i += 1
>         else:
>             result.append(b[j]); j += 1
>     result.extend(a[i:])
>     result.extend(b[j:])
>     return result
> ```
>
> Don't fix it — just list every edge case you'd test. Go fast, list as many as you can."

**Target time:** 5 min
**Difficulty:** 2/5
**Category:** Edge Case Reflexes

**Scoring rubric:**
- **1**: Lists 1-2 trivial cases (e.g., "empty list")
- **2**: Lists 3-4 cases: empty a, empty b, duplicates, single element
- **3**: Lists 5-7 cases: all of 2 + a and b are the same list (aliasing), negative numbers, all-same values, a entirely less than b (no interleaving), a entirely greater than b
- **4**: Lists 8-10 cases: all of 3 + floats/strings/mixed types (what does `<=` do?), very large lists (memory?), a or b contains None (will crash), already-merged input, non-sorted input (function's contract — does it guarantee anything?)
- **5**: All of 4 + thinks about thread safety (is the list being mutated while iterating?), integer overflow in other languages (not Python, but shows systems thinking), performance edge (what if len(a) = 1 and len(b) = 1M — are we doing 1M unnecessary comparisons?)

**What to look for:** Speed and completeness. A 5-person rattles these off reflexively in 90 seconds. A 2-person needs to think hard for 3 minutes and still misses obvious ones. This is a skill that's mostly automatic or it isn't.

---

### DIAG-05: Code Quality Eye

**OpenClaw prompt:**
> "What's wrong with this code? List everything you'd change and why:
>
> ```python
> def do_thing(data, n, f=True):
>     x = []
>     for i in range(len(data)):
>         if data[i] > 0:
>             x.append(data[i] * 2)
>     if f == True:
>         return x[:n]
>     else:
>         return x
> ```
"

**Target time:** 5 min
**Difficulty:** 2/5
**Category:** Python Fluency + Code Quality

**Scoring rubric:**
- **1**: "Looks fine to me" or only notices one issue
- **2**: Notices 2-3 issues but can't explain why they matter
- **3**: Identifies: bad naming (do_thing, x, n, f, data), `range(len(data))` antipattern (use `for item in data`), `if f == True` should be `if f:`, possible to use list comprehension
- **4**: All of 3 + notes: `f` is a terrible boolean name (what does it mean?), `n` is undocumented (is it max results? index?), no type annotations, function does two things (filter+double AND maybe slice — single responsibility violation), should probably be two functions or have a clearer purpose
- **5**: All of 4 + notes: no docstring, what happens if `n > len(x)` (Python handles it fine, but documenting that assumption matters), what if `data` is None or empty, the doubling and filtering should probably be separate concerns — would you pass a `transform` function instead of hardcoding `* 2`?

**What to look for:** Production quality eye. Can they articulate the *why* behind each change, not just list cosmetic issues? A 4-5 person talks about maintainability and readability as first-class concerns.

---

## Day 2: Concurrency + Algorithms

*Exercises DIAG-06 through DIAG-10*

OpenClaw opening message:
> "Day 2. Concurrency and algorithms today. These are the highest-priority skills for the Anthropic interview. Be honest if something doesn't click — that's the point of this. Let's go."

---

### DIAG-06: Thread Safety Fundamentals

**OpenClaw prompt:**
> "Multiple threads are all running this code simultaneously:
>
> ```python
> counter = 0
> def increment():
>     global counter
>     counter += 1
> ```
>
> What's the problem? What does the final value of `counter` look like after 100 threads each call `increment()` once? How do you fix it?"

**Target time:** 6 min
**Difficulty:** 3/5
**Category:** Concurrency

**Scoring rubric:**
- **1**: "It should work fine?" — no understanding of race conditions
- **2**: Knows there's a problem ("race condition") but can't explain the mechanism
- **3**: Explains that `counter += 1` is not atomic — it's read-modify-write, and two threads can read the same value, both increment, write back, losing one increment. Final counter < 100. Knows to use a lock. May not know whether to use Lock or RLock.
- **4**: All of 3 + can write the fix with `threading.Lock`, knows `with lock:` context manager, explains when to use `RLock` vs `Lock` (RLock is reentrant — same thread can acquire multiple times). Mentions the GIL doesn't protect multi-step operations.
- **5**: All of 4 + knows Python's GIL protects individual bytecodes but NOT multi-bytecode operations like `+=`. Might mention `threading.local()` for thread-local state. Could mention `concurrent.futures` as an alternative. Knows when locks are not needed (read-only access, immutable data).

**What to look for:** Do they know the GIL doesn't save you? Can they write the fix without hesitating? This is the foundation of thread-safe LRU cache.

---

### DIAG-07: Asyncio Mental Model

**OpenClaw prompt:**
> "Explain `async def` and `await` to me like I understand Python but have never used asyncio. Then: what's an event loop? What's the difference between `asyncio.gather` and just calling two async functions in sequence?"

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Concurrency

**Scoring rubric:**
- **1**: Can't explain it — "it's like threading but different?"
- **2**: Has a vague sense ("it's for I/O bound tasks") but can't explain the mechanism or the difference between sequential vs gather
- **3**: Explains async as cooperative multitasking — a coroutine runs until it hits an `await`, yields control back to the event loop, which runs another coroutine. `gather` runs multiple coroutines concurrently (interleaved); sequential `await` waits for each to finish before starting the next.
- **4**: All of 3 + explains that asyncio is single-threaded (one thread, cooperative scheduling), so no GIL issues but also no true parallelism for CPU-bound work. Knows async is best for I/O-bound (network, disk) not CPU-bound. Can explain why `asyncio.gather([fetch(url) for url in urls])` is dramatically faster than sequential await for many URLs.
- **5**: All of 4 + mentions `create_task` vs `gather` (tasks are scheduled immediately, gather is slightly more structured). Knows `asyncio.wait_for` for timeouts. Understands that mixing sync and async code requires care (blocking calls in async context will block the event loop). Might mention `asyncio.run()` to start the event loop.

**What to look for:** Is their mental model correct (single-threaded, cooperative)? Can they articulate the performance win? If they confuse asyncio with threading, that's a major gap.

---

### DIAG-08: Semaphore for Rate Limiting

**OpenClaw prompt:**
> "I need to fetch 200 URLs concurrently, but I don't want to hammer the server — max 10 simultaneous requests at a time. Walk me through how you'd structure this with asyncio. Don't write it fully — sketch the approach and the key asyncio primitives you'd use."

**Target time:** 8 min
**Difficulty:** 4/5
**Category:** Concurrency

**Scoring rubric:**
- **1**: No idea where to start
- **2**: Mentions asyncio but doesn't know about Semaphore — proposes batching URLs into groups of 10 manually (works but crude)
- **3**: Knows `asyncio.Semaphore(10)` exists and that you `async with sem:` inside the fetch coroutine. Can sketch the structure with `asyncio.gather`. May need prompting on where exactly to put the semaphore.
- **4**: Can write the pattern: `sem = asyncio.Semaphore(10)`, `async def fetch(url): async with sem: ...`, `await asyncio.gather(*[fetch(url) for url in urls])`. Understands that Semaphore is what controls concurrency, not gather itself. Handles the case where you want to process results as they complete (not just wait for all).
- **5**: All of 4 + knows `asyncio.as_completed` for processing results as they arrive (vs waiting for all). Can discuss why batching manually is worse (if one batch item is slow, you wait for all 10 before starting the next 10 — semaphore doesn't have this problem). Mentions `aiohttp.ClientSession` for the actual HTTP. Considers per-host rate limiting vs global.

**What to look for:** This exact pattern appears in the web crawler round. If they can't describe it, that round will be painful. A 4-5 should be able to almost write it from memory.

---

### DIAG-09: BFS in Practice

**OpenClaw prompt:**
> "Walk me through BFS on a graph. Then solve this: given edges `[(0,1), (1,2), (0,2), (3,4)]` and a start node `0`, find all nodes reachable from 0. Write the code."

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Algorithms

**Scoring rubric:**
- **1**: Can't describe BFS or gets it confused with DFS
- **2**: Describes BFS correctly but can't write working code (bugs in loop termination, missing dedup, etc.)
- **3**: Writes working BFS — uses a queue (deque or list), visited set, correct termination. Code is functional but possibly uses `list.pop(0)` instead of deque (O(n) vs O(1) — suboptimal but not wrong).
- **4**: Uses `collections.deque`, proper visited set before enqueue (not just before process — prevents adding duplicates to queue), correct answer for the example (nodes 0, 1, 2 are reachable; 3 and 4 are not). Builds adjacency list correctly from edge list.
- **5**: All of 4 + states O(V+E) complexity upfront. Notes that this is undirected (should add edges in both directions). Handles edge cases: node not in graph, disconnected graph. Might note that BFS gives shortest path in unweighted graphs as a bonus property.

**What to look for:** Do they use deque? Do they add to visited on enqueue (not on dequeue)? The visited-on-enqueue vs visited-on-dequeue distinction matters for correctness with cycles.

**Follow-up (if they write DFS):** "That's DFS — can you switch to BFS? What's the one data structure change?"

---

### DIAG-10: Topological Sort

**OpenClaw prompt:**
> "What is topological sort and when would you use it? You don't need to write full code — sketch the algorithm in plain English or pseudocode. Then: how would you detect a cycle in the graph?"

**Target time:** 8 min
**Difficulty:** 4/5
**Category:** Algorithms

**Scoring rubric:**
- **1**: Never heard of it or can't explain what it is
- **2**: "It sorts things based on dependencies" — vague, no algorithm, no cycle detection
- **3**: Explains topological sort correctly (linear ordering of nodes where all dependencies come before dependents). Knows it applies to DAGs (directed acyclic graphs). Describes Kahn's algorithm OR DFS-based approach, but not both. Cycle detection is vague ("DFS and check for back edges").
- **4**: Can describe Kahn's algorithm clearly: (1) compute in-degree for each node, (2) add all 0-in-degree nodes to a queue, (3) process queue — for each node, reduce neighbors' in-degree, add to queue if in-degree hits 0. If queue empties before all nodes processed → cycle. Can also describe DFS approach with 3 colors (white/gray/black or unvisited/in-progress/done). Can say which use case favors each.
- **5**: All of 4 + knows both Kahn's (BFS-based, easier to detect cycle) and DFS-based (naturally gives reverse topological order, uses call stack). Can give examples: build systems (Makefile), package managers, task scheduling. Knows why topological sort is directly applicable to the Task Management System OA problem.

**What to look for:** This is directly tested in OA Problem 2. If they can't sketch it, that's a significant OA gap to address in Phase 1. The cycle detection part is what people forget — it's the last 8-minute addition that candidates miss under pressure.

---

## Day 3: Systems + Decomposition + Communication

*Exercises DIAG-11 through DIAG-15*

OpenClaw opening message:
> "Day 3 — last one. Systems thinking, problem decomposition, and communication. These are the skills that separate 'knows the algorithms' from 'passes the interview.' Honest answers only — I'm calibrating your starting point, not judging you."

---

### DIAG-11: Problem Decomposition

**OpenClaw prompt:**
> "Here's a messy spec: 'Build a function that takes a list of URLs and returns a list of unique base domains. Some URLs might have http, some https, some might just be domains, some might have ports. Deduplicate by domain (not full URL).'
>
> DON'T write code yet. Break this down: what are the sub-problems? What edge cases exist? What assumptions are you making? Give me a 5-step implementation plan."

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Problem Decomposition

**Scoring rubric:**
- **1**: Tries to immediately write code, or can't produce a structured plan
- **2**: Lists 2-3 vague steps without specifics ("parse the URL", "remove duplicates")
- **3**: Produces a reasonable plan: (1) parse each URL to extract scheme+host, (2) normalize (strip port if not needed? strip www?), (3) deduplicate using a set, (4) return sorted list. Mentions some edge cases (empty list, invalid URL, None input).
- **4**: All of 3 + explicitly calls out assumptions (e.g., "I'll strip www. and treat www.example.com as example.com — but I'll note that as an assumption because it might not be desired"). Uses Python's `urllib.parse.urlparse` as the tool. Separates the parsing step from the normalization step clearly. Handles ambiguous inputs ("is `example.com` a valid URL? I'll add https:// prefix if no scheme present").
- **5**: All of 4 + notices the spec says nothing about what to do with invalid URLs (skip? raise? return as-is?). Flags that "unique domains" is ambiguous — do we treat http://example.com and https://example.com as the same domain? Makes a decision and states it. Thinks about internationalized domain names (IDN) as a stretch case. Their plan could be handed to another engineer and implemented without ambiguity.

**What to look for:** This is what every interview requires before touching code. If they jump straight to implementation, that's a flag. The best answers surface assumptions the spec doesn't answer, which is exactly what Anthropic interviewers want to see.

---

### DIAG-12: Mini System Design — Rate Limiter

**OpenClaw prompt:**
> "Design a rate limiter. A user can make at most N requests per minute. When they exceed the limit, return a 429. What data structure do you use? Walk me through your design. What are the trade-offs of your approach vs. alternatives?"

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Systems Thinking

**Scoring rubric:**
- **1**: "Use a counter and reset it every minute" — no thought about edge cases or distributed scenario
- **2**: Describes a basic fixed-window counter (count per minute) but can't name the failure mode (burst at minute boundary: N requests at 11:59 + N requests at 12:00 = 2N requests in 2 seconds)
- **3**: Knows about fixed-window and its burst problem. Describes sliding window (keep a sorted list of timestamps, count those within the last 60 seconds). Knows sliding window is more accurate but more memory-intensive. Can implement it in code.
- **4**: Compares 3 approaches: (1) fixed window counter (fast, simple, burst problem), (2) sliding window log (accurate, O(N) memory per user), (3) token bucket / leaky bucket (smooth traffic, configurable burst). Chooses one and defends it. Knows that in a distributed system, the counter must be in Redis (not in-process).
- **5**: All of 4 + knows the Redis `ZADD`/`ZRANGEBYSCORE` pattern for sliding window in a distributed system. Discusses race conditions in the distributed case (compare-and-swap or Lua scripts for atomicity). Mentions that token bucket is used by Stripe/AWS. Knows that "1000 requests per minute" and "1000 requests per hour" require different strategies for burst tolerance.

**What to look for:** Rate limiting appears in BOTH the web crawler (Round 1) and system design (Round 3). Do they know multiple approaches and their trade-offs? A 3-5 person can compare at least two. The burst problem at the minute boundary is a test of whether they think about failure modes.

---

### DIAG-13: LLM Inference Mechanics

**OpenClaw prompt:**
> "What is a KV cache in the context of large language model inference? Why does it matter? You can be high-level — I want to know your mental model."

**Target time:** 6 min
**Difficulty:** 4/5
**Category:** Systems Thinking (ML Infra)

**Scoring rubric:**
- **1**: No idea what this is
- **2**: "It's some kind of cache for model outputs" — vague, doesn't understand what's being cached or why
- **3**: Understands that during autoregressive generation, each new token needs to attend to all previous tokens. The KV (key-value) projections for previous tokens can be cached so they don't need to be recomputed. This speeds up inference dramatically for long sequences. Memory increases linearly with context length.
- **4**: All of 3 + knows that KV cache lives in GPU VRAM, which is limited. Longer sequences = more VRAM per request. At some point, you run out of VRAM and have to either limit context length or evict requests. Knows this is why inference is harder to scale than training. May mention PagedAttention (vLLM's approach to managing KV cache more efficiently, like virtual memory paging).
- **5**: All of 4 + can discuss prefix caching (if two requests share the same system prompt, their KV cache for the prompt portion can be shared). Knows continuous batching (process multiple requests together, adding new requests as others finish tokens, to maximize GPU utilization). Has heard of vLLM/TGI and understands what problem they solve.

**What to look for:** Anthropic builds LLM inference infrastructure. The system design round goes DEEP here. A 1-2 on this exercise means Phase 3 (System Thinking) needs to cover this heavily. A 4-5 means they can probably skip or accelerate some of that content.

**OpenClaw note:** If they score 1-2, follow up with: "No worries — this is specialized knowledge. Do you know what 'autoregressive generation' means? Let's calibrate how much context you have."

---

### DIAG-14: Trade-Off Articulation

**OpenClaw prompt:**
> "You're building a cache for an API service. Two options:
>
> Option A: In-memory cache (dict). Fast. Lost on restart. Per-instance (bad for multiple replicas).
>
> Option B: Redis. ~1ms latency overhead. Persistent. Shared across replicas. More infra.
>
> Which do you pick for a service handling 10K req/sec with 5 replicas? Defend your choice."

**Target time:** 6 min
**Difficulty:** 3/5
**Category:** Communication + Systems Thinking

**Scoring rubric:**
- **1**: "It depends" without any substance, or picks one without reasoning
- **2**: Picks an answer but reasoning is vague ("Redis is better for production")
- **3**: Picks Redis and gives 1-2 solid reasons (shared across replicas, 5x cache efficiency; won't lose cache on every deploy). Acknowledges the latency overhead but says it's acceptable at 1ms. Gets to an answer.
- **4**: Structures the answer: first states the key constraint (5 replicas means in-memory cache is 5 separate caches — 5x memory, inconsistent hit rates). Then makes the call: Redis wins. Quantifies: 1ms overhead on 10K req/sec is acceptable if cache hit rate is high (e.g., saves 100ms DB calls). Notes that in-memory is fine for single-instance services or session-specific data.
- **5**: All of 4 + asks a clarifying question before committing (what's the cache TTL? what's the data being cached — session tokens vs API responses hit differently). Mentions that both could be right in different contexts — in-memory L1 cache + Redis L2 cache is common. Notes consistency concerns (cache invalidation: how do you invalidate across replicas?). Defaults to simplest option first and upgrades when needed.

**What to look for:** Can they commit to a decision? The Anthropic hiring manager round specifically tests whether a candidate folds under pushback. This question surfaces whether they can make and defend a principled technical choice.

**OpenClaw follow-up:** "I disagree. In-memory is simpler and 1ms latency at 10K req/sec is actually a big deal — that's 10 seconds of latency overhead per second in aggregate. Change your mind?"
(Correct response: push back — the aggregate framing is misleading. It's 1ms *per request*, not per-second aggregate. If that's their bottleneck, caching is wrong entirely.)

---

### DIAG-15: Communication Under Pressure

**OpenClaw prompt:**
> "Walk me through your debugging process when something is mysteriously slow in production. The service was fine yesterday, it's slow today, and you have no idea why. Go step by step — what do you do?"

**Target time:** 6 min
**Difficulty:** 2/5
**Category:** Communication + Behavioral

**Scoring rubric:**
- **1**: "I'd look at the logs" — no structure, stops there
- **2**: Lists 3-4 random things to check without a coherent framework
- **3**: Has a logical sequence: (1) establish baseline (how slow? latency? throughput? errors?), (2) check recent changes (what deployed yesterday?), (3) look at metrics (CPU, memory, DB query time, downstream services), (4) isolate the component (is it the service itself, the DB, or a dependency?). Gets to a hypothesis and tests it.
- **4**: All of 3 + articulates the *scientific method* framing: observe (what changed?), hypothesize (probably X because Y), test (can I reproduce it?), verify (roll back change A, does it fix it?). Mentions specific tools (APM traces, query explain plans, profiling endpoints). Knows to check downstream dependencies (maybe our service is fine, but the DB or Redis is slow). Doesn't jump to solutions before isolating the cause.
- **5**: All of 4 + mentions that "slow today, fine yesterday" almost always means a recent change OR a data growth threshold hit. Systematically eliminates hypotheses. Knows to look at percentiles (p99 latency, not just average — a slow query affecting 1% of requests might only show up in p99). Can articulate how they'd communicate status to their team while debugging. Shows structured thinking without panic.

**What to look for:** This is the Hiring Manager round question. A structured debugger who thinks aloud is what Anthropic wants. Do they have a framework? Can they articulate it clearly? Are they systematic or random?

---

## Scoring + Level Determination

### Score Calculation

After Day 3, OpenClaw tallies scores across all 15 exercises.

| Score Range | Level | Starting Phase |
|-------------|-------|----------------|
| 60–75 | Interview-Ready | Phase 4 (Integration) or jump to Phase 5 |
| 45–59 | Advanced | Phase 2 (Pattern Building) |
| 30–44 | Intermediate | Phase 1 (Foundations) — standard entry |
| 15–29 | Developing | Phase 1 (Foundations) — go slower |
| < 15 | Beginner | Phase 1 (Foundations) — supplementary Python basics first |

### Category Breakdown

Beyond the overall score, OpenClaw identifies per-category weak spots:

| Category | Exercises | Max Score | If < 9/15... |
|----------|-----------|-----------|--------------|
| Python Fluency | DIAG-01, 02, 05 | 15 | Prioritize Tier 1 katas in Phase 1 |
| Data Structures | DIAG-02, 03, 04 | 15 | Focus doubly-linked list drills weeks 1-2 |
| Concurrency | DIAG-06, 07, 08 | 15 | Front-load concurrency in Phase 1 |
| Algorithms | DIAG-09, 10 | 10 | Add extra BFS/DFS/toposort katas |
| Systems Thinking | DIAG-12, 13 | 10 | Phase 3 content needed badly |
| Communication | DIAG-11, 14, 15 | 15 | Weave communication practice into every session |

### Specific Skill Flags

OpenClaw notes the following specific flags if exercises score ≤ 2:

- **DIAG-06 ≤ 2** (thread safety): Flag "CONCURRENCY-GAP" — every Phase 1 session should include a concurrency warm-up
- **DIAG-07 ≤ 2** (asyncio): Flag "ASYNCIO-GAP" — add asyncio kata as first 5 minutes of Phase 1 sessions
- **DIAG-10 ≤ 2** (topological sort): Flag "GRAPH-GAP" — topological sort kata in Week 1 Day 1
- **DIAG-13 ≤ 2** (KV cache): Flag "LLM-INFRA-GAP" — Phase 3 must cover LLM inference mechanics from scratch
- **DIAG-14 ≤ 2** (trade-off articulation): Flag "COMMUNICATION-GAP" — every session must end with "explain your approach" prompt

---

## OpenClaw Delivery Instructions

### Day 1 Pacing
- Open with: Day 1 message above
- Deliver DIAG-01 → wait → evaluate → DIAG-02 → wait → evaluate, etc.
- After each exercise: brief feedback + score reveal (don't give the answer, just note what they got right/wrong in 1-2 sentences)
- End of Day 1: "3 exercises down, 10 to go. I'll ping you tomorrow for Day 2."

### Day 2 Pacing
- Open with: Day 2 message above
- Same rhythm
- After DIAG-10: "Halfway done. Day 3 tomorrow wraps it up with systems and communication."

### Day 3 Pacing
- Open with: Day 3 message above
- After DIAG-15: Run the scoring logic and deliver the level result
- Deliver the result: "Based on your diagnostic, your starting level is [LEVEL]. You'll begin at [Phase]. Your three biggest gaps to close are: [list top 3 lowest category scores]. We start Day 1 of Phase [N] tomorrow."

### Evaluation Guidance
OpenClaw should:
- Ask one follow-up question if the initial answer is borderline between two scores
- Give partial scores freely (3.5 is fine — round up for the aggregate)
- NOT give away the answer — give the score and a one-line hint about what was missing
- Move on even if the user wants to keep discussing — save the teaching for Phase 1

### Result Message Template
```
Diagnostic complete. Here's your breakdown:

Python Fluency: X/15
Data Structures: X/15
Concurrency: X/15
Algorithms: X/10
Systems Thinking: X/10
Communication: X/15
Total: X/75

Level: [Beginner / Developing / Intermediate / Advanced / Interview-Ready]
Starting Phase: [Phase N]

Top gaps to close:
1. [Lowest category] — this will be the main focus of Phase 1
2. [Second lowest] — woven into Weeks 2-4
3. [Third lowest] — addressed in Phase 2+

Day 1 of Phase [N] starts tomorrow. I'll ping you at [preferred time]. See you then.
```
