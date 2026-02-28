# Phase 0: Diagnostic — OpenClaw Session Scripts

**Duration:** 3 days (~35–45 min per day)
**Output:** Baseline level, starting phase, top 3 gap flags
**Purpose:** Calibrate before practicing the wrong things. No teaching — pure assessment.

This file is the **executable curriculum** for Phase 0. OpenClaw reads this to know exactly what to say, ask, and evaluate on each of the 3 diagnostic days. Every exercise is written as a complete OpenClaw script: opening message, exercise prompt, scoring rubric, follow-up prompts, and transition lines.

The exercises are NOT teaching sessions. OpenClaw scores, gives one-line feedback, and moves on. Deep explanations come in Phase 1. The goal is an accurate baseline, not confidence.

---

## Day 1 Session: Python Fluency + Data Structures

**Exercises:** DIAG-01 through DIAG-05
**Categories:** Python Fluency, Data Structures, Edge Case Reflexes, Code Quality
**OpenClaw session target:** 35–45 min

---

### OPENING — OpenClaw sends this to start Day 1

> **Day 1 of 3: Diagnostic.**
>
> Five exercises today — Python and data structures. No IDE, no looking things up. Just type what you know, the way you'd explain it to someone. Think aloud as you answer.
>
> I'll score each one and move on. No long explanations yet — that comes in Phase 1. Be honest: a lower score just means more runway.
>
> Ready? Let's go.

---

### DIAG-01: Collections Fluency

**OpenClaw prompt:**
> What does Python's `Counter` do, and when would you prefer it over a plain dict? Give me a quick example — no running code needed.

**Target time:** 5 min
**Difficulty:** 2/5
**Category:** Python Fluency

**OpenClaw scoring rubric (internal — do not share with user):**
- **1** — "I've heard of it but don't really know" / blank
- **2** — "It counts things" — correct direction but no example, no awareness of when to prefer it
- **3** — Explains Counter counts occurrences of items in an iterable. Gives a use case (word frequency, char count). Knows it's dict-like.
- **4** — Score 3 + knows Counter handles missing keys as 0 (not KeyError), knows `most_common(n)`, can articulate ergonomic win over `dict.get(k, 0) + 1`
- **5** — Score 4 + Counter arithmetic (c1 + c2 adds counts), when plain dict is still better (arbitrary value types), knows Counter is a dict subclass

**OpenClaw follow-up (if answer looks like a borderline 3):**
> Okay, what about `defaultdict`? When would you use that vs Counter?

**OpenClaw feedback after scoring (1-2 sentences max):**
- Score 1-2: "Counter is a subclass of dict that counts occurrences — missing keys return 0 by default. We'll cover this properly in Phase 1."
- Score 3: "Good — you have the core concept. The gap: Counter arithmetic and the most_common() method. Moving on."
- Score 4-5: "Solid. You know Counter well."

**Transition:**
> Next: let's see how you implement an LRU cache.

---

### DIAG-02: LRU Cache — First Implementation

**OpenClaw prompt:**
> Implement an LRU cache. It supports `get(key)` and `put(key, value)` with a fixed capacity. When full, evict the least recently used item. Use whatever Python tools feel right.
>
> Walk me through your approach first (2 sentences), then write the code.

**Target time:** 10 min
**Difficulty:** 3/5
**Category:** Python Fluency + Data Structures

**OpenClaw timing:** At 8 minutes: "Still going? Type what you have so far — we can work from there."

**OpenClaw scoring rubric:**
- **1** — Can't get started / unclear on what LRU means / no approach
- **2** — Describes the concept but implementation incorrect (list with linear search — O(n) per op)
- **3** — Reaches for `OrderedDict` or dict + manually maintained list. Gets something working but may have subtle bugs (forgets `move_to_end` on update, not just on get)
- **4** — Clean `OrderedDict` solution: `move_to_end(key)` on both get AND put, `popitem(last=False)` for eviction, handles key-exists-on-put (update + move)
- **5** — Score 4 + states O(1) complexity, mentions thread safety would require a lock, handles capacity=0 or capacity=1 edge case proactively

**OpenClaw follow-up (if they nail it with OrderedDict):**
> Good. Now walk me through how you'd implement this WITHOUT OrderedDict — from scratch. What two data structures would you need?

**OpenClaw feedback:**
- Score 1-2: "The key insight: OrderedDict is Python's built-in LRU-friendly structure — move_to_end() on access, popitem(last=False) to evict. We'll build this from scratch in Phase 1."
- Score 3: "You've got the right instinct. The subtle bug most people hit: forgetting to move_to_end on PUT (not just GET). That counts as an update — the item is 'recently used'."
- Score 4-5: "Strong implementation. Good Python fluency signal."

**Transition:**
> Now let's go one level lower — raw pointer manipulation.

---

### DIAG-03: Doubly Linked List — From Scratch

**OpenClaw prompt:**
> Write a `Node` class for a doubly linked list. Then write:
> - `insert_after(node, new_val)` — inserts a new node immediately after the given node
> - `remove(node)` — removes the given node from the list
>
> Focus on the pointer updates. No sentinel nodes.

**Target time:** 10 min
**Difficulty:** 3/5
**Category:** Data Structures (From Scratch)

**OpenClaw timing:** At 8 minutes: "How's it going? Post what you have — the pointer logic is what we're assessing."

**OpenClaw scoring rubric:**
- **1** — Can't write the Node class, or doesn't understand "doubly"
- **2** — Writes singly linked list, or confuses prev/next direction in updates
- **3** — Correct Node class (val, prev, next). insert_after works. remove has at least one bug — doesn't update surrounding nodes' pointers correctly, or doesn't handle head/tail edge cases
- **4** — Correct Node. Correct insert_after: sets new_node.prev = node, new_node.next = node.next, then updates node.next.prev and node.next correctly. Correct remove: updates prev.next and next.prev. Handles removed node at head or tail.
- **5** — Score 4 + uses or explicitly mentions sentinel head/tail nodes as a simplification. Calls out pointer ordering: update incoming before outgoing or you lose your reference. Code would work as-is in an LRU cache.

**OpenClaw follow-up:**
> Why do we need a doubly linked list for LRU cache instead of a singly linked list?

**OpenClaw feedback:**
- Score 1-2: "The pointer manipulation order that trips people: set new_node.prev = node first, THEN update node.next. If you reverse it, you lose your reference to the rest of the list. We'll drill this in Phase 1 until it's automatic."
- Score 3: "Good instincts. The bug: when removing a node, you need to update BOTH neighbors — node.prev.next = node.next AND node.next.prev = node.prev. Both directions."
- Score 4-5: "Clean implementation. This is the foundation of the from-scratch LRU cache."

**Transition:**
> Almost done with Day 1. Two more — both fast.

---

### DIAG-04: Edge Case Reflexes

**OpenClaw prompt:**
> I have this function:
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
> Don't fix it — just list every edge case you'd test. Go fast, list as many as you can in 5 minutes.

**Target time:** 5 min
**Difficulty:** 2/5
**Category:** Edge Case Reflexes

**OpenClaw timing:** At 3 minutes: "Keep going — any more?"

**OpenClaw scoring rubric:**
- **1** — 1-2 trivial cases ("empty list")
- **2** — 3-4 cases: empty a, empty b, duplicates, single element
- **3** — 5-7 cases: Score 2 cases + a and b are the same list (aliasing), negative numbers, all-same values, a entirely less than b (no interleaving), a entirely greater than b
- **4** — 8-10 cases: Score 3 + floats/strings/mixed types (what does `<=` do?), very large lists (memory?), a or b contains None (crashes), already-merged input, non-sorted input (violates contract — does the function guarantee anything?)
- **5** — Score 4 + thread safety (list being mutated while iterating?), performance edge (len(a)=1, len(b)=1M — 1M unnecessary comparisons before reaching the extend), questions whether `<=` vs `<` matters for stability

**OpenClaw feedback:**
- Score 1-2: "Edge case generation is a speed-and-completeness skill. The target: 8+ cases in under 3 minutes, reflexively. You'll build this in Phase 1 by ending every code exercise with 'now list every edge case.'"
- Score 3-4: "Good coverage. The stretch cases: aliasing (a is b), None values, and performance edges when one list is dramatically shorter."
- Score 5: "Excellent instincts. This speed and coverage is what Anthropic interviewers want to see."

**Transition:**
> Last exercise of Day 1 — code review.

---

### DIAG-05: Code Quality Eye

**OpenClaw prompt:**
> What's wrong with this code? List everything you'd change and why:
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

**Target time:** 5 min
**Difficulty:** 2/5
**Category:** Python Fluency + Code Quality

**OpenClaw scoring rubric:**
- **1** — "Looks fine" or only one issue spotted
- **2** — 2-3 issues without explaining why they matter
- **3** — Identifies: bad naming (do_thing, x, n, f, data), `range(len(data))` antipattern (use `for item in data`), `if f == True` should be `if f:`, could use list comprehension
- **4** — Score 3 + `f` is a terrible boolean name (what does it mean?), `n` is undocumented (max results? index?), no type annotations, function does two things (filter+double AND maybe slice — single responsibility), probably should be two functions
- **5** — Score 4 + no docstring, what happens if `n > len(x)` (Python handles gracefully, but the assumption should be documented), what if data is None or empty, the doubling and filtering should probably be separate concerns — consider passing a transform function instead of hardcoding `* 2`

**OpenClaw feedback:**
- Score 1-2: "Production quality means naming everything clearly, avoiding antipatterns like range(len(data)), and making each function do one thing. This code fails all three. We'll build this eye in Phase 1."
- Score 3-4: "Good review. The single responsibility issue is the most important: this function filters, transforms, AND conditionally slices — those are three jobs."
- Score 5: "Strong code quality eye. You'd catch this in review before it shipped."

---

### DAY 1 CLOSE

**OpenClaw sends:**
> Day 1 done. That's 5 of 15 exercises — Python fluency and data structures.
>
> I'll ping you tomorrow for Day 2: concurrency and algorithms. These are the highest-priority skills for the Anthropic interview — don't skip.
>
> See you then.

**OpenClaw records Day 1 scores internally** (DIAG-01 through DIAG-05, each 1-5).

---

---

## Day 2 Session: Concurrency + Algorithms

**Exercises:** DIAG-06 through DIAG-10
**Categories:** Concurrency, Algorithms
**OpenClaw session target:** 40–45 min

---

### OPENING — OpenClaw sends this to start Day 2

> **Day 2 of 3: Diagnostic.**
>
> Concurrency and algorithms today. These map directly to the Anthropic interview — thread safety comes up in the online assessment, asyncio in Coding Round 1, and graph algorithms in both.
>
> Same rules: think aloud, no looking things up. Honest answers only.
>
> Let's go.

---

### DIAG-06: Thread Safety Fundamentals

**OpenClaw prompt:**
> Multiple threads are all running this code simultaneously:
>
> ```python
> counter = 0
> def increment():
>     global counter
>     counter += 1
> ```
>
> Three questions:
> 1. What's the problem?
> 2. What does the final value of `counter` look like after 100 threads each call `increment()` once?
> 3. How do you fix it?

**Target time:** 6 min
**Difficulty:** 3/5
**Category:** Concurrency

**OpenClaw scoring rubric:**
- **1** — "It should work fine?" / no understanding of race conditions
- **2** — Knows there's a problem ("race condition") but can't explain the mechanism
- **3** — Explains `counter += 1` is not atomic — read-modify-write. Two threads can read the same value, both increment, both write back, losing one increment. Final counter < 100. Knows to use a lock. May not know Lock vs RLock distinction.
- **4** — Score 3 + writes the fix with `threading.Lock`, uses `with lock:` context manager, explains Lock vs RLock (RLock is reentrant — same thread can acquire multiple times). Mentions GIL doesn't protect multi-step operations.
- **5** — Score 4 + knows Python's GIL protects individual bytecodes but NOT multi-bytecode operations like `+=`. Mentions `threading.local()` for thread-local state. Knows when locks are not needed (read-only access, immutable data). Could mention `concurrent.futures`.

**OpenClaw feedback:**
- Score 1-2: "The GIL doesn't save you here. `counter += 1` is three bytecodes: LOAD, ADD, STORE. Two threads can interleave between any of them. Fix: `threading.Lock` with `with lock:` context manager. This is the foundation of the OA thread-safe LRU cache."
- Score 3: "Good — you understand the race. The gap: knowing the exact fix (threading.Lock, `with lock:` pattern) cold, without hesitation. We'll drill the lock pattern in Phase 1."
- Score 4-5: "Strong. Thread safety fundamentals solid."

**Transition:**
> Next: asyncio. This is where people's mental models most often break.

---

### DIAG-07: Asyncio Mental Model

**OpenClaw prompt:**
> Explain `async def` and `await` to me like I understand Python but have never used asyncio. Then:
>
> 1. What's an event loop?
> 2. What's the difference between `asyncio.gather` and calling two async functions in sequence?

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Concurrency

**OpenClaw scoring rubric:**
- **1** — Can't explain it / "it's like threading but different?" with no substance
- **2** — Vague sense ("it's for I/O bound tasks") but can't explain mechanism or gather vs sequential difference
- **3** — Explains async as cooperative multitasking: a coroutine runs until it hits `await`, yields to event loop, which runs another. `gather` runs concurrently (interleaved); sequential `await` waits for each before starting next.
- **4** — Score 3 + asyncio is single-threaded (cooperative, not preemptive), no GIL issues but no true CPU parallelism. Best for I/O-bound, not CPU-bound. Can explain why `asyncio.gather([fetch(url) for url in urls])` is dramatically faster than sequential for many URLs.
- **5** — Score 4 + `create_task` vs `gather` (tasks are scheduled immediately). `asyncio.wait_for` for timeouts. Knows that blocking calls in async context will block the event loop. Mentions `asyncio.run()` to start the event loop.

**OpenClaw follow-up (if answer is 3 or borderline):**
> If asyncio is single-threaded, how does it handle 200 concurrent HTTP requests without blocking?

**OpenClaw feedback:**
- Score 1-2: "Key mental model: asyncio is single-threaded cooperative multitasking. One thread, one event loop. When you `await` something, you're saying 'I'm waiting for I/O — go run something else.' The event loop is the scheduler. gather() runs multiple coroutines concurrently on that one thread. We'll build this in Phase 1."
- Score 3: "Good mental model. The gap: being able to articulate WHY gather is faster (concurrent I/O waits, not sequential). Picture 200 HTTP requests: sequential = 200 * 500ms = 100s. Gather = ~500ms because waits overlap."
- Score 4-5: "Strong asyncio understanding."

**Transition:**
> Good. Now let's make it concrete — rate limiting with a semaphore.

---

### DIAG-08: Semaphore for Rate Limiting

**OpenClaw prompt:**
> I need to fetch 200 URLs concurrently, but I don't want to hammer the server — max 10 simultaneous requests at a time.
>
> Walk me through how you'd structure this with asyncio. Don't write it fully — sketch the approach and the key asyncio primitives you'd use.

**Target time:** 8 min
**Difficulty:** 4/5
**Category:** Concurrency

**OpenClaw scoring rubric:**
- **1** — No idea where to start
- **2** — Mentions asyncio but doesn't know Semaphore — proposes batching URLs into groups of 10 manually (works but crude)
- **3** — Knows `asyncio.Semaphore(10)` and that you `async with sem:` inside the fetch coroutine. Can sketch the structure with `asyncio.gather`. May need prompting on exact placement.
- **4** — Can write the full pattern: `sem = asyncio.Semaphore(10)`, `async def fetch(url): async with sem: ...`, `await asyncio.gather(*[fetch(url) for url in urls])`. Understands Semaphore controls concurrency, not gather itself. Handles "process as they complete" case.
- **5** — Score 4 + knows `asyncio.as_completed` for processing results as they arrive. Can explain why manual batching is worse than semaphore (slow batch item blocks rest of batch — semaphore doesn't have this problem). Mentions `aiohttp.ClientSession`. Considers per-host vs global rate limiting.

**OpenClaw follow-up (if they describe manual batching):**
> That works, but it has a problem. If one URL in your batch of 10 takes 30 seconds, what happens to the other 9 slots?

**OpenClaw feedback:**
- Score 1-2: "The pattern: `sem = asyncio.Semaphore(10)`, then inside your fetch coroutine: `async with sem: result = await fetch(url)`. The semaphore acts as a concurrency gate — only 10 coroutines hold the semaphore at once, the rest wait. This exact pattern is in Coding Round 1."
- Score 3: "You have the right instinct. The gap: knowing the pattern cold — sem = asyncio.Semaphore(N), async with sem: inside the fetch function, asyncio.gather for all URLs. We'll drill it."
- Score 4-5: "Excellent. This exact pattern is Coding Round 1. You're ready for it."

**Transition:**
> Good. Switching gears: graph algorithms.

---

### DIAG-09: BFS in Practice

**OpenClaw prompt:**
> Walk me through BFS on a graph in 2 sentences. Then write the code:
>
> Given edges `[(0,1), (1,2), (0,2), (3,4)]` and start node `0`, find all nodes reachable from 0. Show your work.

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Algorithms

**OpenClaw scoring rubric:**
- **1** — Can't describe BFS or confuses it with DFS in a way that shows no understanding
- **2** — Describes BFS correctly but code has bugs (loop termination, missing dedup, etc.)
- **3** — Working BFS — uses a queue (deque or list), visited set, correct termination. Code functional but possibly uses `list.pop(0)` instead of deque (O(n) vs O(1) — suboptimal but not wrong)
- **4** — Uses `collections.deque`. Adds to visited set on ENQUEUE (not dequeue) — prevents duplicates in queue. Builds adjacency list correctly from edge list. Correct answer: {0, 1, 2} reachable; 3 and 4 are not.
- **5** — Score 4 + states O(V+E) complexity. Notes undirected graph needs edges in both directions. Handles edge cases: node not in graph, disconnected graph. Notes BFS gives shortest path in unweighted graphs as a bonus property.

**OpenClaw follow-up (if they write DFS):**
> That's DFS — can you switch to BFS? What's the one data structure change?

**OpenClaw follow-up (if BFS but visited on dequeue):**
> What happens to your visited set logic if a node has many edges pointing to it? When should you mark it visited — on enqueue or dequeue?

**OpenClaw feedback:**
- Score 1-2: "BFS: use a queue (deque), start with [source]. Pop from front, add all unvisited neighbors, mark visited on enqueue. The two things people get wrong: using a stack instead of queue (that's DFS), and marking visited on dequeue instead of enqueue (allows duplicates in the queue). We'll drill this."
- Score 3: "Correct logic. The gap: deque instead of list.pop(0) for O(1) performance, and marking visited on enqueue not dequeue. These are the two canonical BFS bugs."
- Score 4-5: "Strong BFS implementation."

**Transition:**
> Last one for Day 2 — topological sort. This appears directly in the online assessment.

---

### DIAG-10: Topological Sort

**OpenClaw prompt:**
> Two questions:
>
> 1. What is topological sort and when would you use it? (Sketch the algorithm in pseudocode or plain English — no full code needed.)
>
> 2. How would you detect a cycle in the graph as part of your algorithm?

**Target time:** 8 min
**Difficulty:** 4/5
**Category:** Algorithms

**OpenClaw scoring rubric:**
- **1** — Never heard of it or can't explain what it is
- **2** — "It sorts things based on dependencies" — vague, no algorithm, no cycle detection
- **3** — Explains topological sort correctly (linear ordering where dependencies come before dependents). Knows it applies to DAGs. Describes Kahn's OR DFS-based approach, not both. Cycle detection is vague ("DFS and check for back edges").
- **4** — Can describe Kahn's algorithm: (1) compute in-degree for each node, (2) add 0-in-degree nodes to a queue, (3) process queue — for each node, reduce neighbors' in-degree, add to queue if it hits 0. If queue empties before all nodes processed → cycle detected. Can also describe DFS-based (3 colors: unvisited/in-progress/done). Can say which use case favors each.
- **5** — Score 4 + knows both Kahn's (BFS-based, easy cycle detection) and DFS-based (reverse topological order, uses call stack). Can give examples: build systems, package managers, task scheduling. Connects explicitly to the OA Task Management System problem.

**OpenClaw feedback:**
- Score 1-2: "Topological sort orders nodes in a directed acyclic graph (DAG) so that for every edge A→B, A comes before B. Kahn's algorithm: (1) compute in-degree for all nodes, (2) queue all with in-degree 0, (3) process queue — reduce neighbors' in-degree, queue them when they hit 0. If you process fewer nodes than exist → cycle detected. This is directly tested in OA Problem 2. We'll build it in Phase 1."
- Score 3: "You have the concept. The gap: knowing Kahn's algorithm cold (in-degree computation + queue), and the cycle detection trick (queue empties before all nodes processed). These details are what the OA tests."
- Score 4-5: "Excellent. This is the OA problem 2 algorithm. You're prepared."

---

### DAY 2 CLOSE

**OpenClaw sends:**
> Day 2 done. That's 10 of 15.
>
> Tomorrow: systems thinking, problem decomposition, and communication. These are the skills that separate 'knows the algorithms' from 'passes the interview.'
>
> Day 3 tomorrow. I'll ping you.

**OpenClaw records Day 2 scores** (DIAG-06 through DIAG-10, each 1-5).

---

---

## Day 3 Session: Systems + Decomposition + Communication

**Exercises:** DIAG-11 through DIAG-15
**Categories:** Problem Decomposition, Systems Thinking, ML Infra, Communication
**OpenClaw session target:** 35–45 min

---

### OPENING — OpenClaw sends this to start Day 3

> **Day 3 of 3: Diagnostic.**
>
> Last one. Systems thinking, problem decomposition, and communication today.
>
> These are what separate 'knows the algorithms' from 'passes the Anthropic interview.' Honest answers only — I'm calibrating your starting point, not judging you.
>
> Let's close this out.

---

### DIAG-11: Problem Decomposition

**OpenClaw prompt:**
> Here's a messy spec:
>
> *"Build a function that takes a list of URLs and returns a list of unique base domains. Some URLs might have http, some https, some might just be domains, some might have ports. Deduplicate by domain — not full URL."*
>
> DON'T write code yet.
>
> Give me: (1) your clarifying questions, (2) your assumptions, (3) a 5-step implementation plan.

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Problem Decomposition

**OpenClaw plays product manager during clarifying questions:**
- "Should www.example.com and example.com be treated as the same domain?" → "Make the call and state your assumption."
- "What format should the output be?" → "What would make sense for a caller consuming this?"
- "Should I handle invalid URLs?" → "What would you do with them? Decide and document it."

**OpenClaw scoring rubric:**
- **1** — Tries to immediately write code, or can't produce a structured plan
- **2** — 2-3 vague steps without specifics ("parse the URL", "remove duplicates")
- **3** — Reasonable plan: (1) parse each URL to extract host, (2) normalize (strip www?), (3) deduplicate with a set, (4) return sorted list. Mentions some edge cases (empty list, invalid URL, None input).
- **4** — Score 3 + explicitly calls out assumptions ("I'll strip www. — but noting that as an assumption"). Uses `urllib.parse.urlparse` as the tool. Separates parsing from normalization clearly. Handles ambiguous inputs ("is `example.com` valid? I'll add https:// if no scheme present").
- **5** — Score 4 + flags that the spec doesn't say what to do with invalid URLs (skip? raise? return as-is?). Flags that "unique domains" is ambiguous — does http://example.com == https://example.com? Makes a decision and states it. Their plan could be handed to another engineer without ambiguity.

**OpenClaw feedback:**
- Score 1-2: "The meta-skill here: before touching code, articulate (1) what you're assuming, (2) what the ambiguous cases are, (3) what your ordered steps are. Interviewers at Anthropic evaluate this planning phase as heavily as the code. We'll practice this every Tuesday in Phase 1."
- Score 3-4: "Good structure. The gap: making assumptions explicit and flagging when the spec is ambiguous (not just gaps you filled in, but ones that could go either way and the interviewer should decide)."
- Score 5: "This is the level of decomposition Anthropic wants to see. The questions you surfaced ARE the interview signal."

**Transition:**
> Good. Now a classic system design question — one that shows up in multiple interview rounds.

---

### DIAG-12: Mini System Design — Rate Limiter

**OpenClaw prompt:**
> Design a rate limiter. A user can make at most N requests per minute. When they exceed the limit, return 429.
>
> Three things:
> 1. What data structure do you use?
> 2. What are the trade-offs of your approach?
> 3. What's the burst problem — and does your design handle it?

**Target time:** 8 min
**Difficulty:** 3/5
**Category:** Systems Thinking

**OpenClaw scoring rubric:**
- **1** — "Use a counter and reset it every minute" — no awareness of burst problem or alternatives
- **2** — Describes fixed-window counter but can't name the failure mode
- **3** — Knows about fixed-window and its burst problem (N requests at 11:59 + N at 12:00 = 2N in 2 seconds). Describes sliding window (sorted timestamps, count within last 60 seconds). Knows sliding window is more accurate but more memory-intensive.
- **4** — Compares 3 approaches: (1) fixed window counter (fast, simple, burst problem), (2) sliding window log (accurate, O(N) memory per user), (3) token bucket / leaky bucket (smooth traffic, configurable burst). Chooses one and defends it. Knows distributed system requires Redis, not in-process.
- **5** — Score 4 + knows Redis `ZADD`/`ZRANGEBYSCORE` pattern for sliding window. Discusses race conditions in distributed case (compare-and-swap or Lua scripts for atomicity). Mentions token bucket is used by Stripe/AWS. Knows "1000 req/min" vs "1000 req/hr" require different burst tolerance strategies.

**OpenClaw feedback:**
- Score 1-2: "Rate limiting comes up in Coding Round 1 (web crawler) and System Design (Round 3). The critical insight: fixed-window has a burst problem — N requests at :59, N at :00, 2N in 2 seconds. Sliding window fixes this by counting requests in a rolling window. We'll design these properly in Phase 2."
- Score 3-4: "Good — you know the burst problem and the sliding window fix. The gap: being able to compare token bucket as a third approach, and knowing the distributed case requires Redis (in-process cache doesn't work with multiple replicas)."
- Score 5: "Comprehensive. You have the system design vocabulary Anthropic is looking for."

**Transition:**
> Now something more specialized — LLM inference.

---

### DIAG-13: LLM Inference Mechanics

**OpenClaw prompt:**
> What is a KV cache in the context of large language model inference? Why does it matter?
>
> High-level is fine — I want your mental model.

**Target time:** 6 min
**Difficulty:** 4/5
**Category:** Systems Thinking (ML Infra)

**OpenClaw scoring rubric:**
- **1** — No idea what this is
- **2** — "It's some kind of cache for model outputs" — vague, doesn't understand what's cached or why
- **3** — Understands that during autoregressive generation, each new token needs to attend to all previous tokens. KV (key-value) projections for previous tokens can be cached — don't recompute them. Speeds up inference dramatically for long sequences. Memory grows linearly with context length.
- **4** — Score 3 + KV cache lives in GPU VRAM which is limited. Longer sequences = more VRAM per request. At some point you run out — have to limit context length or evict requests. Knows this is why inference scaling is harder than training scaling. May mention PagedAttention (vLLM's approach to KV cache management, like virtual memory paging).
- **5** — Score 4 + can discuss prefix caching (two requests sharing the same system prompt → share KV cache for prompt portion). Knows continuous batching (process multiple requests together, add new ones as others finish, maximize GPU utilization). Has heard of vLLM/TGI and understands what problem they solve.

**OpenClaw handling for Score 1-2:**
> No worries — this is specialized knowledge. Do you know what 'autoregressive generation' means? Let's calibrate how much context you have.

(If they know autoregressive but not KV cache: score 2. If they know neither: score 1.)

**OpenClaw feedback:**
- Score 1-2: "Anthropic builds LLM inference infrastructure — the System Design round goes deep here. Starting from zero is fine; Phase 3 covers this from the ground up. For now: each token in autoregressive generation needs attention over all previous tokens. Caching the key-value projections from previous tokens avoids recomputing them — that's the KV cache. It lives in GPU memory."
- Score 3: "Good foundation. The gaps: KV cache is in GPU VRAM (limited resource), and that VRAM pressure is the core challenge in LLM inference scaling. We'll build on this in Phase 3."
- Score 4-5: "Strong LLM infra knowledge. Phase 3 will deepen this — you have the vocabulary to engage at a high level."

**Transition:**
> Two more. These test communication, not knowledge.

---

### DIAG-14: Trade-Off Articulation

**OpenClaw prompt:**
> You're building a cache for an API service. Two options:
>
> **Option A:** In-memory dict. Instant. Lost on restart. Per-instance (doesn't work with multiple replicas).
>
> **Option B:** Redis. ~1ms latency overhead. Persistent. Shared across replicas. More infra to manage.
>
> Which do you pick for a service handling 10K req/sec with 5 replicas? Defend your choice.

**Target time:** 6 min
**Difficulty:** 3/5
**Category:** Communication + Systems Thinking

**OpenClaw scoring rubric:**
- **1** — "It depends" without substance, or picks one without any reasoning
- **2** — Picks an answer but reasoning is vague ("Redis is better for production")
- **3** — Picks Redis, gives 1-2 solid reasons (shared across replicas = 5x more efficient, won't lose cache on every deploy). Acknowledges 1ms overhead but deems it acceptable. Gets to a decision.
- **4** — Structures the answer: states key constraint (5 replicas = 5 separate in-memory caches, 5x memory, inconsistent hit rates). Makes the call: Redis wins. Quantifies: 1ms overhead on 10K req/sec is acceptable if cache hit rate is high (saves 100ms+ DB calls). Notes in-memory is right for single-instance or session-specific data.
- **5** — Score 4 + asks a clarifying question before committing (what's the TTL? what's being cached?). Mentions both could be right — in-memory L1 + Redis L2 cache is common. Notes cache invalidation across replicas (how do you invalidate?). Defaults to simplest option first, upgrades when needed.

**OpenClaw follow-up (always deliver this for scores 3+):**
> I disagree. In-memory is simpler and 1ms at 10K req/sec is actually significant — that's 10 seconds of latency overhead per second in aggregate. Change your mind?

(Correct response: push back. The aggregate framing is misleading. It's 1ms per request — if 1ms is your bottleneck, caching is the wrong tool entirely. If 1ms is acceptable per request, it doesn't matter what the aggregate is.)

**OpenClaw scoring for the follow-up:**
- Folds and agrees: deduct 1 point from score (holding your position is part of the evaluation)
- Pushes back correctly: add 0.5 to score (cap at 5)
- Pushes back but incorrectly: neutral

**OpenClaw feedback:**
- Score 1-2: "Structure your trade-off answers in three parts: (1) name the key constraint (5 replicas = 5 caches, inconsistent), (2) name the winner, (3) acknowledge what you're trading away (1ms overhead, Redis infra). Get to a decision — interviewers want to see you commit."
- Score 3-4: "Good reasoning. The gap: not being shaken by pushback. When the interviewer challenges your decision, defend it if you're right. 'Aggregate latency' is a framing trick — it's still 1ms per request."
- Score 5: "Strong. This is exactly how the Hiring Manager round goes."

**Transition:**
> Last exercise. This one is conversational — just walk me through your thinking.

---

### DIAG-15: Communication Under Pressure

**OpenClaw prompt:**
> Walk me through your debugging process when something is mysteriously slow in production.
>
> The service was fine yesterday, it's slow today, you have no idea why. Go step by step — what do you do?

**Target time:** 6 min
**Difficulty:** 2/5
**Category:** Communication + Behavioral

**OpenClaw scoring rubric:**
- **1** — "I'd look at the logs" — no structure, stops there
- **2** — Lists 3-4 random things to check without coherent framework
- **3** — Logical sequence: (1) establish baseline (how slow? latency? throughput? errors?), (2) check recent changes (what deployed yesterday?), (3) check metrics (CPU, memory, DB query time, downstream services), (4) isolate the component (is it the service, the DB, or a dependency?). Gets to a hypothesis and tests it.
- **4** — Frames as scientific method: observe → hypothesize → test → verify. Mentions specific tools (APM traces, query explain plans, profiling endpoints). Checks downstream dependencies (maybe our service is fine, Redis is slow). Doesn't jump to solutions before isolating the cause.
- **5** — Score 4 + "slow today, fine yesterday" almost always means a recent change OR a data growth threshold. Systematically eliminates hypotheses. Looks at percentiles (p99, not just average — slow query affecting 1% only shows in p99). Articulates how they'd communicate status to the team while debugging. Structured without panic.

**OpenClaw follow-up (if score looks like 3, to calibrate):**
> What if you deploy a rollback and it's still slow?

**OpenClaw feedback:**
- Score 1-2: "Structured debugging has a shape: observe (what exactly is slow, by how much), hypothesize (what changed?), test (can I isolate the component?), verify (does fixing the hypothesis fix the problem?). Random log-diving without a framework is how you spend 6 hours on a 30-minute problem."
- Score 3-4: "Good structure. The gap: looking at percentiles, not averages (p99 catches slow queries affecting 1% of traffic that disappear in the mean). And checking downstream dependencies first, before assuming the bug is in your service."
- Score 5: "This is the Hiring Manager round answer. Structured, systematic, calm."

---

### DAY 3 CLOSE + SCORING

**OpenClaw runs the scoring logic (internal):**

Tally all 15 scores. Compute category totals:

| Category | Exercises | Max Score |
|----------|-----------|-----------|
| Python Fluency | DIAG-01, 02, 05 | 15 |
| Data Structures | DIAG-02, 03, 04 | 15 |
| Concurrency | DIAG-06, 07, 08 | 15 |
| Algorithms | DIAG-09, 10 | 10 |
| Systems Thinking | DIAG-12, 13 | 10 |
| Communication | DIAG-11, 14, 15 | 15 |
| **TOTAL** | | **75** |

Note: DIAG-02 counts for both Python Fluency AND Data Structures (split 7.5/7.5 for category scoring).

**Level determination:**

| Score Range | Level | Starting Phase |
|-------------|-------|----------------|
| 60–75 | Interview-Ready | Phase 4 (or Phase 5 if systems strong) |
| 45–59 | Advanced | Phase 2 |
| 30–44 | Intermediate | Phase 1 (standard pace) |
| 15–29 | Developing | Phase 1 (slower pace — 6 weeks instead of 4) |
| < 15 | Beginner | Phase 1 (add supplementary Python basics before Week 1) |

**Slower pace note:** Score < 30 → Phase 1 runs 6 weeks. Weekly templates repeat with harder variants rather than progressing to new patterns. Each kata runs twice before moving to the next.

**Gap flags (triggered if score ≤ 2 on specific exercise):**

| Exercise | Flag | What changes |
|----------|------|--------------|
| DIAG-06 ≤ 2 | CONCURRENCY-GAP | Every Phase 1 session starts with a 5-min concurrency warm-up |
| DIAG-07 ≤ 2 | ASYNCIO-GAP | Add asyncio kata as first 5 min of all Phase 1 sessions |
| DIAG-10 ≤ 2 | GRAPH-GAP | Topological sort kata on Week 1 Day 1 of Phase 1 |
| DIAG-13 ≤ 2 | LLM-INFRA-GAP | Phase 3 covers LLM inference mechanics from scratch |
| DIAG-14 ≤ 2 | COMMUNICATION-GAP | Every session ends with "explain your approach" prompt |

**OpenClaw sends the result:**

```
Diagnostic complete. Here's your breakdown:

Python Fluency:    [X]/15
Data Structures:   [X]/15
Concurrency:       [X]/15
Algorithms:        [X]/10
Systems Thinking:  [X]/10
Communication:     [X]/15
───────────────────────────
Total:             [X]/75

Level: [Beginner / Developing / Intermediate / Advanced / Interview-Ready]
Starting Phase: Phase [N]

Your three biggest gaps:
1. [Lowest category] — this will be the focus of Phase 1
2. [Second lowest] — woven into Weeks 2–4
3. [Third lowest] — addressed in Phase 2+

[If any gap flags triggered:]
Flags set:
• [CONCURRENCY-GAP / ASYNCIO-GAP / GRAPH-GAP / LLM-INFRA-GAP / COMMUNICATION-GAP]
These will customize how Phase 1 sessions are structured.

Day 1 of Phase [N] starts tomorrow.
I'll ping you then. Good work getting through the diagnostic.
```

**OpenClaw updates the project entity:**
- `current_phase: 1` (or appropriate phase)
- `current_day: 1`
- Appends diagnostic score summary to the Progress Log section
- Sets any gap flags as frontmatter tags
- Creates a meeting entity for the diagnostic period

---

## Appendix: Delivery Principles for Phase 0

1. **Move fast.** The diagnostic is 15 exercises in 3 days. Keep feedback to 1-2 sentences per exercise — no teaching yet.

2. **Score honestly.** A generous score leads to starting at the wrong phase and getting demoralized when the content is too hard. Better to start slightly before your level than slightly after.

3. **No shame.** If the user scores 1-2 on multiple exercises, normalize it: "These are gaps — that's the point of this. Phase 1 is built for exactly where you are."

4. **The follow-up questions are for calibration only.** Don't deliver more follow-ups than specified. One per exercise at most. The goal is accurate scoring, not teaching.

5. **DIAG-14's follow-up is always delivered.** Testing how the user responds to pushback is part of the assessment. Deliver it even if their initial answer was strong.

6. **Day 2 and Day 3 must happen on separate days.** Don't run all 15 in one session — the fatigue calibration is real. Round 4 of the interview (the profiler problem) happens when the candidate is tired. Spreading the diagnostic across 3 days gives a more accurate signal.
