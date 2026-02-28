# Problem Bank Design — Daily Interview Practice

Synthesized from `skill-taxonomy.md`, `progression-map.md`, and `weekly-templates.md`.

## Design Philosophy

Problems in this bank mirror Anthropic's interview style, NOT LeetCode:

- **Messy specs, not clean ones** — real interviewers give ambiguous requirements verbally
- **Progressive complexity** — start simple, add constraints mid-session (like interviewers actually do)
- **Practical system components** — caches, crawlers, profilers, task managers; not abstract puzzles
- **Real engineering judgment** — the "right" answer involves trade-offs, not just algorithmic cleverness
- **Conversational delivery** — written for OpenClaw to ask via Telegram; no IDE required for most

Problems are designed to build intuition (WHY this approach), not just pattern matching (WHAT approach).

---

## Organization

Problems are tagged along 4 dimensions:

| Dimension | Values |
|-----------|--------|
| `category` | data-structures, graph-algorithms, threading, asyncio, algorithm-patterns, system-design, sql, spec-decomposition, debug-and-read, behavioral |
| `difficulty` | 1 (warm-up) → 5 (interview-hard) |
| `phase` | 1–6 (which phase this problem is appropriate for) |
| `format` | CK, SD, MPR, MS, DR, SQL, BS, CD, RR |

---

## Problem Format

Every problem in the bank follows this structure:

```
---
id: PB-XXX
title: [Short descriptive title]
category: [category tag]
difficulty: [1-5]
phase: [1-6]
format: [session format code]
time_target: [N min]
skills: [comma-separated skills from taxonomy]
---

## The Prompt
[Exactly what OpenClaw says to deliver this problem. Conversational, first-person from the bot.]

## Hints
[3 Socratic hints, ordered from least to most revealing. OpenClaw offers these only if asked.]

## Solution
[The actual answer — code, design, or written. Full and correct.]

## Key Insight
[The one-sentence "why" — the intuition this problem is meant to build or reinforce.]

## Follow-up Questions
[Edge cases or variations OpenClaw should throw mid-session or after initial solution.]

## Scoring Guide (for MPR format)
[Optional: what a pass / conditional pass / needs work looks like]
```

---

## Problem Count by Phase

| Phase | Sessions | Problems Needed | Notes |
|-------|----------|-----------------|-------|
| Phase 0 | 3 sessions (diagnostic) | 15 problems | Already designed in `current-level-diagnostic.md` |
| Phase 1 | 28 sessions | 35–40 problems | Katas repeat with variation; some reuse with higher constraints |
| Phase 2 | 28 sessions | 35–40 problems | More distinct patterns; SQL and mini-mocks add variety |
| Phase 3 | 28 sessions | 25–30 problems | Sessions are longer; fewer distinct problems needed |
| Phase 4 | 28 sessions | 20–25 problems | Full complexity problems; reuse Phase 1–3 under time pressure |
| Phase 5 | 28 sessions | 15–20 problems | Mostly mocks using Phase 1–4 problems; few new ones |
| Phase 6 | Ongoing | 15–20 rotating | Drawn from Phase 2–5 problem bank; new ones added monthly |
| **Total** | **~143 sessions** | **~170–200 problems** | Includes ~30% overlap/reuse across phases |

The curriculum content phases (Wave 3) will draw from this bank. The bank itself is seeded here with at least 2 fully-written example problems per category.

---

## Category 1: Data Structures from Scratch

**Purpose:** Build mechanical fluency with pointer manipulation and implementation details until building these feels like writing a for loop.

**Phase range:** Phase 1 (primarily), reused in Phase 4 under time pressure

**Volume needed:** ~30 problems (high repetition with variation is intentional)

---

### PB-001 — Circular Buffer

```
---
id: PB-001
title: Circular Buffer
category: data-structures
difficulty: 2
phase: 1
format: CK
time_target: 20 min
skills: data structures, Python fluency
---
```

**The Prompt:**

> Let's build something that shows up everywhere in systems: a circular buffer (also called a ring buffer). The constraint is fixed capacity — when it's full and you add something, the oldest item gets overwritten.
>
> Build a `CircularBuffer` class with:
> - `push(item)` — add to the buffer; if full, overwrite oldest
> - `pop()` — remove and return oldest item; raise if empty
> - `peek()` — return oldest item without removing; raise if empty
> - `is_full()` and `is_empty()` booleans
>
> Target capacity: set at construction time. No resizing.
>
> What's your first step?

**Hints:**

1. "Think about how to track 'oldest' and 'newest' without shifting elements. Two index pointers are enough."
2. "Your `head` pointer marks where to read next. Your `tail` marks where to write next. What happens to them when they reach the end of the array?"
3. "Full vs empty is ambiguous with just two pointers if `head == tail`. A third piece of state resolves this cleanly — what would you track?"

**Solution:**

```python
class CircularBuffer:
    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._buf = [None] * capacity
        self._capacity = capacity
        self._head = 0   # next read position
        self._tail = 0   # next write position
        self._size = 0

    def push(self, item) -> None:
        self._buf[self._tail] = item
        self._tail = (self._tail + 1) % self._capacity
        if self._size < self._capacity:
            self._size += 1
        else:
            # overwrite: advance head past the overwritten slot
            self._head = (self._head + 1) % self._capacity

    def pop(self):
        if self.is_empty():
            raise IndexError("pop from empty buffer")
        item = self._buf[self._head]
        self._buf[self._head] = None  # allow GC
        self._head = (self._head + 1) % self._capacity
        self._size -= 1
        return item

    def peek(self):
        if self.is_empty():
            raise IndexError("peek at empty buffer")
        return self._buf[self._head]

    def is_full(self) -> bool:
        return self._size == self._capacity

    def is_empty(self) -> bool:
        return self._size == 0
```

**Key Insight:** The modulo operation `(index + 1) % capacity` is how you "wrap around" without conditionals. Once you see this, all ring-buffer problems feel the same. The `_size` counter is cleaner than using a sentinel or wasting one slot to distinguish full vs empty.

**Follow-up Questions:**

- "What's the time complexity of each operation? Why is this O(1)?"
- "How would you make this thread-safe? What's the minimum locking needed?"
- "Where would you use this over a `deque`? Think about log streaming, audio buffers, profiler sample buffers."
- "What if you wanted `push` to block instead of overwrite when full? What would you change?"

---

### PB-002 — LRU Cache from Scratch (DLL + HashMap)

```
---
id: PB-002
title: LRU Cache from Scratch
category: data-structures
difficulty: 4
phase: 1
format: MPR
time_target: 25 min
skills: doubly linked list, hash map, LRU cache
---
```

**The Prompt:**

> This is the big one. We're building an LRU Cache from scratch — no `OrderedDict`, no `functools.lru_cache`. Just a doubly linked list and a dictionary.
>
> Requirements:
> - `get(key)` → returns value if found; -1 if not. Accessing a key makes it "most recently used."
> - `put(key, value)` → inserts or updates. If over capacity, evict the least recently used.
> - Both operations must be O(1).
>
> Take a minute to sketch the data structure before writing any code. What do you need and why?

**Hints:**

1. "You need O(1) lookup — that's a hash map. You need O(1) eviction of LRU and O(1) promotion of recently used — that's where the doubly linked list comes in. What does the hash map store?"
2. "The map stores key → node (a pointer into the list). The list stays ordered by recency. Head = MRU, tail = LRU. What does each node need to store?"
3. "Sentinel nodes for head and tail eliminate all the edge cases around empty list / single element. Add them to your `__init__` before writing `get` or `put`."

**Solution:**

```python
class Node:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.map = {}  # key → Node
        # Sentinels: head (MRU side), tail (LRU side)
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev

    def _insert_at_head(self, node: Node) -> None:
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)
        self._insert_at_head(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.map:
            self._remove(self.map[key])
        node = Node(key, value)
        self.map[key] = node
        self._insert_at_head(node)
        if len(self.map) > self.cap:
            # Evict LRU: the node just before tail
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.key]
```

**Key Insight:** The hash map stores pointers to nodes; the doubly linked list provides ordering. Sentinels make `_remove` and `_insert_at_head` unconditional — no "if head is None" checks anywhere. This is the pattern: use sentinels to eliminate edge cases.

**Follow-up Questions:**

- "How would you add thread safety? Coarse lock vs per-key lock — what's the trade-off?"
- "What if `get` needs to return a TTL-expired value as a miss? How do you extend this?"
- "Can you walk me through what happens on `put` when key already exists? Trace through the pointer changes."
- "Why do we delete `self.map[lru.key]` and not `self.map[node.key]` during eviction?"

---

## Category 2: Graph Algorithms

**Purpose:** Build intuition for graph traversal patterns. The goal: see a dependency/relationship problem and immediately think "graph."

**Phase range:** Phase 1 (BFS/DFS), Phase 2 (topological sort, advanced)

**Volume needed:** ~20 problems

---

### PB-003 — Package Dependency Installer

```
---
id: PB-003
title: Package Dependency Installer
category: graph-algorithms
difficulty: 3
phase: 1
format: CK
time_target: 20 min
skills: topological sort, cycle detection, DFS
---
```

**The Prompt:**

> You're building a package manager. Each package has a list of dependencies that must be installed first.
>
> Given a dictionary like:
> ```python
> packages = {
>     "app": ["requests", "sqlalchemy"],
>     "requests": ["urllib3", "certifi"],
>     "sqlalchemy": ["greenlet"],
>     "urllib3": [],
>     "certifi": [],
>     "greenlet": [],
> }
> ```
>
> Write `install_order(packages)` that returns a valid installation order (dependencies before dependents).
>
> Edge case: if there's a circular dependency, raise `ValueError` naming the cycle.
>
> Start by telling me: what's the graph here and what are we actually computing?

**Hints:**

1. "This is topological sort. Packages are nodes, dependencies are directed edges (dependency → dependent). You need to visit all dependencies before their dependents."
2. "DFS-based topological sort: for each node, recursively visit all its dependencies before adding itself to the result. Use a 'visiting' set (in-progress) and a 'visited' set (complete) to detect cycles."
3. "A cycle exists when you encounter a node that's currently 'in-progress' in your DFS. To report the cycle, you need to track the current DFS path — a stack or list works."

**Solution:**

```python
def install_order(packages: dict[str, list[str]]) -> list[str]:
    VISITING, VISITED = 1, 2
    state = {}
    result = []

    def dfs(pkg, path):
        if state.get(pkg) == VISITED:
            return
        if state.get(pkg) == VISITING:
            cycle_start = path.index(pkg)
            cycle = path[cycle_start:] + [pkg]
            raise ValueError(f"Circular dependency: {' -> '.join(cycle)}")
        state[pkg] = VISITING
        path.append(pkg)
        for dep in packages.get(pkg, []):
            dfs(dep, path)
        path.pop()
        state[pkg] = VISITED
        result.append(pkg)

    for pkg in packages:
        dfs(pkg, [])

    return result
```

**Key Insight:** The two-state (VISITING / VISITED) coloring is what makes DFS cycle detection O(n+e) — a single pass. Without it, you'd need to re-traverse. This exact pattern (with slightly different names) shows up in the Anthropic OA task management problem.

**Follow-up Questions:**

- "What's the time complexity? What's n and e here?"
- "The problem says 'raise ValueError naming the cycle.' How would you extend this to list all cycles, not just the first one?"
- "What if packages can have optional dependencies (install if present, skip if not)? What changes?"
- "If you wanted to parallelize installation — install all packages with no pending deps simultaneously — how would you adapt this? (Hint: Kahn's algorithm)"

---

### PB-004 — Reachability Reporter

```
---
id: PB-004
title: Reachability Reporter
category: graph-algorithms
difficulty: 2
phase: 1
format: CK
time_target: 15 min
skills: BFS, adjacency list, graph traversal
---
```

**The Prompt:**

> You're building a system health dashboard. Services call each other in a microservices mesh. Given the call graph (who calls whom), you need to answer: "If service X goes down, which other services are impacted?"
>
> A service is "impacted" if it directly or indirectly calls X (i.e., it can reach X through the call graph).
>
> Given:
> ```python
> calls = {
>     "frontend": ["auth", "search"],
>     "auth": ["user-db"],
>     "search": ["index", "auth"],
>     "index": ["storage"],
>     "user-db": [],
>     "storage": [],
>     "metrics": ["user-db"],
> }
> ```
>
> Write `impacted_by(calls, failed_service)` that returns all services impacted if `failed_service` goes down.
>
> Before coding: what's the direction of your traversal here, and why?

**Hints:**

1. "You want services that *call* X, not services X calls. So you need to traverse the graph *backwards* — build a reverse adjacency list (who is called by whom), then BFS/DFS from X in that reversed graph."
2. "Build `callers = defaultdict(list)` where `callers[service]` lists everyone who calls that service. Then BFS from `failed_service` in `callers`."
3. "Don't forget: BFS needs a visited set to avoid infinite loops if the graph has cycles (it can — circular call dependencies happen in bad systems)."

**Solution:**

```python
from collections import defaultdict, deque

def impacted_by(calls: dict[str, list[str]], failed: str) -> set[str]:
    # Build reverse graph: callee -> callers
    callers = defaultdict(list)
    for svc, deps in calls.items():
        for dep in deps:
            callers[dep].append(svc)

    # BFS from failed service in reverse graph
    impacted = set()
    queue = deque([failed])
    visited = {failed}
    while queue:
        svc = queue.popleft()
        for caller in callers[svc]:
            if caller not in visited:
                visited.add(caller)
                impacted.add(caller)
                queue.append(caller)
    return impacted
```

**Key Insight:** "Reverse the graph, then traverse forward" is the canonical pattern for "who depends on X" problems. It recurs in build systems, spreadsheet recalculation, and live-update propagation.

**Follow-up Questions:**

- "What if you want to return impacted services ordered by how many hops they are from the failed service?"
- "Services can also be impacted if they call something that calls X (transitive). Does your current solution handle that? Walk me through an example."
- "If `metrics` also calls `search`, what does the impacted set look like for `storage` going down?"

---

## Category 3: Concurrency — Threading

**Purpose:** Build thread-safety instincts. Not just "lock around the thing" but knowing *what* needs locking and why.

**Phase range:** Phase 1 (basics), Phase 2 (patterns), Phase 4 (under pressure)

**Volume needed:** ~20 problems

---

### PB-005 — Thread-Safe Connection Pool

```
---
id: PB-005
title: Thread-Safe Connection Pool
category: threading
difficulty: 3
phase: 2
format: CK
time_target: 25 min
skills: threading.Lock, threading.Condition, thread-safe design, producer-consumer
---
```

**The Prompt:**

> Database connections are expensive to create. Connection pools reuse them. Let's build one.
>
> Requirements:
> - Fixed pool size (set at construction)
> - `acquire()` — returns a connection; blocks if none available
> - `release(conn)` — returns a connection to the pool
> - `size()` — number of connections currently available
>
> For this exercise, a "connection" is just an integer ID (1, 2, 3...). Production would be a real DB connection.
>
> What do you need to synchronize here, and why?

**Hints:**

1. "You need a data structure to hold available connections and you need to block `acquire()` when it's empty — that's more than just a `Lock`. What stdlib primitive is designed for 'wait until condition is true'?"
2. "`threading.Condition` wraps a Lock and adds `wait()` (release lock, sleep until notified) and `notify()` (wake one waiter). That's exactly what `acquire()` needs when the pool is empty."
3. "Your `release()` must hold the condition, return the connection to the pool, then `notify()` to wake any waiting `acquire()` call. Order matters: add before notify."

**Solution:**

```python
import threading

class ConnectionPool:
    def __init__(self, size: int):
        self._pool = list(range(1, size + 1))  # conn IDs
        self._condition = threading.Condition()

    def acquire(self) -> int:
        with self._condition:
            while not self._pool:
                self._condition.wait()
            return self._pool.pop()

    def release(self, conn: int) -> None:
        with self._condition:
            self._pool.append(conn)
            self._condition.notify()

    def size(self) -> int:
        with self._condition:
            return len(self._pool)
```

**Key Insight:** `threading.Condition` is the right tool when a thread needs to *wait for state to change*, not just *wait for a lock to release*. The `while not self._pool: wait()` pattern (not `if`) is essential — a thread can be woken spuriously and must re-check the condition.

**Follow-up Questions:**

- "Why `while not self._pool` instead of `if not self._pool`? What's a spurious wakeup?"
- "What if we want `acquire()` to time out after N seconds instead of blocking forever?"
- "What happens if a caller acquires a connection but never releases it? How would you add a timeout-based forced return?"
- "Would `queue.Queue` work here instead? What would it look like? What would you lose?"

---

### PB-006 — Metrics Aggregator

```
---
id: PB-006
title: Thread-Safe Metrics Aggregator
category: threading
difficulty: 4
phase: 2
format: SD
time_target: 20 min
skills: threading.Lock, thread-safe design, state machines, producer-consumer
---
```

**The Prompt:**

> We need a metrics system. Multiple worker threads emit counter events like `("requests_served", 1)` or `("bytes_written", 4096)`. A separate background thread reads and reports aggregated totals every 10 seconds, then resets the counters.
>
> Sketch the design before any code. Tell me:
> 1. What data structure holds the metrics?
> 2. What needs to be thread-safe and why?
> 3. What's the risk during the "read + reset" operation?
>
> Then implement it.

**Hints:**

1. "The counters are a `defaultdict(int)` or `dict`. Incrementing from multiple threads without a lock gives you race conditions — two threads can both read the old value and write the same incremented value, losing one increment."
2. "The 'read + reset' operation must be atomic from the perspective of workers — you don't want a worker to increment a counter between the reporter reading it and resetting it. How do you ensure read+reset looks atomic?"
3. "One approach: hold the lock for the entire read+reset operation (snapshot the data, clear the dict, release). Another: swap the dict — atomically replace the shared dict with a fresh one, then process the old one outside the lock."

**Solution:**

```python
import threading
from collections import defaultdict

class MetricsAggregator:
    def __init__(self):
        self._counters = defaultdict(int)
        self._lock = threading.Lock()

    def increment(self, metric: str, value: int = 1) -> None:
        with self._lock:
            self._counters[metric] += value

    def flush(self) -> dict[str, int]:
        """Read all metrics and reset. Returns the snapshot."""
        with self._lock:
            snapshot = dict(self._counters)
            self._counters.clear()
        return snapshot
```

**Key Insight:** `flush()` holding the lock for both read and clear is the correct approach here because the lock duration is tiny (dict copy + clear is O(n), near-instant). The alternative (swap the whole dict reference) is more advanced and only pays off when the flush itself is expensive.

**Follow-up Questions:**

- "Workers increment very frequently. Is a global lock a bottleneck? What would you do at scale?"
- "What if you want to track not just counters but also *histograms* (distribution of values)? What changes?"
- "The background reporter calls `flush()` every 10 seconds in a daemon thread. How do you start that thread and ensure it doesn't prevent clean shutdown?"
- "Walk me through the race condition that happens if you do `snapshot = dict(self._counters); self._counters.clear()` *without* the lock."

---

## Category 4: Concurrency — Asyncio

**Purpose:** Make asyncio muscle memory. The patterns here (semaphore, gather, timeout, queue) are tested directly in Coding Round 1.

**Phase range:** Phase 2 (fundamentals), Phase 3 (advanced), Phase 4 (under pressure)

**Volume needed:** ~20 problems

---

### PB-007 — Async URL Fetcher with Rate Limiting

```
---
id: PB-007
title: Async URL Fetcher with Rate Limiting
category: asyncio
difficulty: 3
phase: 2
format: CK
time_target: 25 min
skills: asyncio, asyncio.Semaphore, aiohttp, timeout handling, error handling
---
```

**The Prompt:**

> You have a list of URLs to fetch. Fetching them one-by-one is too slow. Fetching all at once might get you rate-limited or overwhelm the target server. You need to fetch them concurrently, but with a cap on simultaneous requests.
>
> Write `fetch_all(urls, max_concurrent)` that:
> - Fetches all URLs concurrently but with at most `max_concurrent` in flight at once
> - Times out individual requests after 10 seconds
> - Returns a dict of `{url: content}` for successes and `{url: None}` for failures/timeouts
>
> You can assume `aiohttp.ClientSession` is available for HTTP. How would you structure this?

**Hints:**

1. "For the concurrency cap, `asyncio.Semaphore(max_concurrent)` is exactly right. The pattern: `async with sem: result = await fetch(url)`. What does this guarantee?"
2. "For timeouts, `asyncio.wait_for(coroutine, timeout=10)` wraps any coroutine with a deadline. Catch `asyncio.TimeoutError` to handle it."
3. "Use `asyncio.gather(*tasks, return_exceptions=True)` to run all tasks and collect results even if some fail. This way a single timeout doesn't abort everything."

**Solution:**

```python
import asyncio
import aiohttp

async def fetch_all(urls: list[str], max_concurrent: int) -> dict[str, str | None]:
    sem = asyncio.Semaphore(max_concurrent)
    results = {}

    async def fetch_one(session, url):
        async with sem:
            try:
                async with asyncio.timeout(10):
                    async with session.get(url) as resp:
                        results[url] = await resp.text()
            except Exception:
                results[url] = None

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        await asyncio.gather(*tasks)

    return results
```

**Key Insight:** `asyncio.Semaphore` provides the "at most N concurrent" guarantee without threads or manual counting. The key property: `async with sem` acquires (decrementing the counter) and auto-releases on exit, even on exception. This is the exact pattern in the Anthropic Coding Round 1 web crawler.

**Follow-up Questions:**

- "What happens if `aiohttp.ClientSession()` raises an exception? Is your `results` dict in a good state?"
- "You're using `asyncio.timeout(10)` — is this available in all Python versions? What's the older equivalent?"
- "What if you want per-domain rate limiting (max 2 concurrent to the same domain, not global)? How does the semaphore structure change?"
- "What if `fetch_one` takes 11 seconds — is the semaphore slot released before the 11th second or only after? Why does this matter?"

---

### PB-008 — Two-Stage Async Pipeline

```
---
id: PB-008
title: Two-Stage Async Pipeline with Backpressure
category: asyncio
difficulty: 4
phase: 3
format: CK
time_target: 30 min
skills: asyncio, asyncio.Queue, async generators, backpressure, producer-consumer
---
```

**The Prompt:**

> You're building an ETL pipeline. Stage 1 fetches records from an API (slow network, fast to request). Stage 2 processes each record (fast to process, but CPU-bound). Stage 2 is slower than Stage 1.
>
> If you connect them naively, Stage 1 will produce records faster than Stage 2 can consume them, filling memory unboundedly.
>
> Build a pipeline with:
> - `producer(queue)` — fetches items and puts them into the queue
> - `consumer(queue, results)` — takes items from the queue and processes them
> - `run_pipeline(n_consumers)` — runs the pipeline with `n_consumers` consumer tasks
> - Backpressure: `queue` has a `maxsize` — producer blocks when full
>
> For this exercise: producing = yielding integers 1–20 with a 0.01s delay. Processing = squaring the number with a 0.05s delay.

**Hints:**

1. "`asyncio.Queue(maxsize=N)` with `await queue.put(item)` blocks automatically when full — that's your backpressure mechanism. `await queue.get()` blocks when empty."
2. "Run N consumers in parallel with `asyncio.gather(*[consumer(q, results) for _ in range(n)])`. Consumers loop until they get a sentinel value (like `None`) signaling no more work."
3. "After the producer finishes, send N sentinel `None` values — one per consumer — so each consumer knows to stop. Why N and not 1?"

**Solution:**

```python
import asyncio

async def producer(queue: asyncio.Queue) -> None:
    for i in range(1, 21):
        await asyncio.sleep(0.01)  # simulate fetch latency
        await queue.put(i)
    # Signal each consumer to stop (one sentinel per consumer)
    # run_pipeline sends sentinels; producer just puts items

async def consumer(queue: asyncio.Queue, results: list) -> None:
    while True:
        item = await queue.get()
        if item is None:  # sentinel
            queue.task_done()
            break
        await asyncio.sleep(0.05)  # simulate processing
        results.append(item * item)
        queue.task_done()

async def run_pipeline(n_consumers: int) -> list:
    queue = asyncio.Queue(maxsize=5)  # backpressure: max 5 buffered
    results = []

    async def producer_with_sentinels():
        await producer(queue)
        for _ in range(n_consumers):
            await queue.put(None)  # one sentinel per consumer

    producer_task = asyncio.create_task(producer_with_sentinels())
    consumer_tasks = [
        asyncio.create_task(consumer(queue, results))
        for _ in range(n_consumers)
    ]
    await asyncio.gather(producer_task, *consumer_tasks)
    return sorted(results)
```

**Key Insight:** `asyncio.Queue(maxsize=N)` is the idiomatic backpressure mechanism in asyncio — the producer blocks when the queue is full, allowing consumers to catch up. The sentinel pattern (`None` value, one per consumer) is the clean shutdown mechanism.

**Follow-up Questions:**

- "Why do we need N sentinels (one per consumer) instead of 1?"
- "What if a consumer crashes mid-processing? How would you handle that without losing the item?"
- "The producer is slower than optimal because it waits on `queue.put`. How could you measure queue depth to know if consumers are keeping up?"
- "How would you add a timeout: if a consumer hasn't processed anything in 30 seconds, consider it hung and restart it?"

---

## Category 5: Algorithm Patterns

**Purpose:** Pattern recognition over memorization. The goal is for the user to see a problem and immediately feel "that's sliding window" — not to recall a named algorithm.

**Phase range:** Phase 2 (core patterns), Phase 4 (under pressure)

**Volume needed:** ~25 problems

---

### PB-009 — Event Burst Detector

```
---
id: PB-009
title: Event Burst Detector
category: algorithm-patterns
difficulty: 2
phase: 2
format: CK
time_target: 15 min
skills: sliding window, two-pointer
---
```

**The Prompt:**

> Your monitoring system logs events with timestamps. You want to detect "bursts" — windows of time where many events happen close together.
>
> Given a sorted list of event timestamps (integers, seconds since epoch), write `max_events_in_window(timestamps, window_seconds)` that returns the maximum number of events in any window of `window_seconds` duration.
>
> Example: `[1, 2, 4, 7, 8, 9, 10, 15]`, window=5 → answer is 4 (events at 7,8,9,10 all fit in the 5-second window `[7,12)`).
>
> Before coding: what algorithmic approach does this suggest?

**Hints:**

1. "This is a sliding window problem — you want the window of fixed duration (not fixed count) with the most events inside it. Two pointers: `left` is the start of the window, `right` scans forward."
2. "For each `right`, advance `left` until `timestamps[right] - timestamps[left] <= window_seconds`. The window size at that point is `right - left + 1`."
3. "You don't need to move left one step at a time — you can binary search for the leftmost valid position. But two-pointer is O(n) and simpler. Which do you prefer and why?"

**Solution:**

```python
def max_events_in_window(timestamps: list[int], window: int) -> int:
    if not timestamps:
        return 0
    left = 0
    best = 0
    for right in range(len(timestamps)):
        # shrink window from left until it fits
        while timestamps[right] - timestamps[left] > window:
            left += 1
        best = max(best, right - left + 1)
    return best
```

**Key Insight:** Sliding window with two pointers works when the window condition is monotonic — making the window bigger only makes it worse (or the same), never better. Here: adding timestamps to the left makes the window *wider*, which may violate the size constraint.

**Follow-up Questions:**

- "What if the timestamps aren't sorted? What's your first step?"
- "What if you want to return the *time range* of the best window, not just the count?"
- "What if 'window' is defined by count, not duration (max events in any span of exactly N events)? That's simpler — do you still need two pointers?"

---

### PB-010 — Config Version Bisect

```
---
id: PB-010
title: Config Version Bisect
category: algorithm-patterns
difficulty: 3
phase: 2
format: CK
time_target: 15 min
skills: binary search, binary search on answer space
---
```

**The Prompt:**

> You're debugging a production regression. Your system has config versions 1 through N. Somewhere in the range, a config change broke something. Versions before the breakage are "good," all versions after (including the bad one) are "bad."
>
> You have a function `is_broken(version)` that tells you if a given version has the bug (returns True/False). Finding the first broken version will tell you what changed.
>
> Write `find_first_broken(n, is_broken)` that returns the first broken version using O(log n) calls to `is_broken`.
>
> Walk me through your reasoning before coding.

**Hints:**

1. "This is binary search on answer space. The property you're searching for is 'first True in a sequence of [False, False, ..., True, True, True].' Binary search works because the sequence is monotonically non-decreasing once you hit True."
2. "Start with `lo=1, hi=n`. Check the midpoint. If `is_broken(mid)` is True, the first broken version is `mid` or earlier — set `hi = mid`. If False, it's later — set `lo = mid + 1`."
3. "Loop until `lo == hi`, then return `lo`. This finds the leftmost True without stepping past it."

**Solution:**

```python
def find_first_broken(n: int, is_broken) -> int:
    lo, hi = 1, n
    while lo < hi:
        mid = (lo + hi) // 2
        if is_broken(mid):
            hi = mid       # could be mid or earlier
        else:
            lo = mid + 1   # definitely after mid
    return lo  # lo == hi: first broken version
```

**Key Insight:** Binary search works on any monotonic boolean sequence, not just sorted arrays. The key template: `lo=first_possible, hi=last_possible`, check midpoint, collapse the range that can't contain the answer. This solves "first X that satisfies condition" in O(log n) without scanning.

**Follow-up Questions:**

- "What if *all* versions are good? What does your function return?"
- "What if the first version is already broken? Walk through your loop."
- "Where else does binary search on answer space apply? Think: 'find the minimum capacity C such that the system handles load L.'"

---

## Category 6: System Design (Mini)

**Purpose:** Build system design fluency through short, focused component designs. Full system design (45-min rounds) comes in Phase 4–5; these build the vocabulary and component library.

**Phase range:** Phase 2 (basic components), Phase 3 (ML infra components), Phase 4–5 (full systems)

**Volume needed:** ~20 problems

---

### PB-011 — Token Bucket Rate Limiter

```
---
id: PB-011
title: Token Bucket Rate Limiter Design
category: system-design
difficulty: 3
phase: 2
format: MS
time_target: 20 min
skills: rate limiting, system design, API design, caching strategies
---
```

**The Prompt:**

> You're designing a rate limiter for an API. Requirements:
> - Each user can make at most 100 requests per minute
> - Bursting is allowed: if a user hasn't made requests recently, they can "spend" accumulated allowance
> - Limit applies per user_id
> - This will run across multiple API server instances (so state must be shared)
>
> Walk me through your design. What algorithm would you use? Where does the state live? What's the failure mode if the state store goes down?

**Hints:**

1. "Token bucket: each user has a bucket that refills at rate R tokens/sec (e.g., 100/60 ≈ 1.67/sec). Each request costs 1 token. Bucket has max capacity 100. If bucket is empty, reject. If bucket has tokens, consume one and allow. How do you compute 'how many tokens refilled since last request'?"
2. "Token count = min(capacity, prev_tokens + (now - last_request_time) * rate). This is lazy refill — you don't need a background process; you compute the refill at request time."
3. "For shared state across servers: Redis with `GET`, compute new count, `SET` with TTL. The read-compute-write must be atomic — use a Lua script or `WATCH`/`MULTI`/`EXEC`. If Redis is down, fail open (allow) or fail closed (reject) — which do you choose and why?"

**Solution (Design, not code):**

```
State per user: (token_count, last_refill_time)  ← stored in Redis
Key: f"rate_limit:{user_id}"
Format: JSON or two fields (tokens, timestamp)

On each request:
  1. GET current (tokens, last_ts) from Redis
  2. elapsed = now - last_ts
  3. new_tokens = min(capacity, tokens + elapsed * rate)
  4. if new_tokens < 1: reject (429)
  5. SET (new_tokens - 1, now) atomically
  6. Allow request

Atomicity: Use Redis Lua script to avoid TOCTOU race between GET and SET.

Failure mode if Redis is down:
- Fail open: allow all requests (availability > rate limiting)
- Better for user experience in most cases, except under attack

Trade-off vs sliding window counter:
- Token bucket: allows bursts (better UX, closer to human usage patterns)
- Sliding window: no bursting, more predictable server load, harder to implement correctly
```

**Key Insight:** "Lazy refill" (compute tokens at request time, not on a timer) is the key insight — you don't need a background process sweeping through user states. State only updates when a user makes a request.

**Follow-up Questions:**

- "What's the TOCTOU race condition if two servers handle the same user's requests simultaneously?"
- "Your Redis key has a TTL. What TTL would you set, and what's the worst-case behavior if the key expires while a user is active?"
- "Sliding window counter is another approach. When would you choose it over token bucket?"
- "How would you handle the case where the rate limit needs to be different per user tier (free: 10/min, paid: 100/min, enterprise: 1000/min)?"

---

### PB-012 — LLM Inference Queue Design

```
---
id: PB-012
title: LLM Inference Request Queue
category: system-design
difficulty: 5
phase: 3
format: MS
time_target: 25 min
skills: LLM inference mechanics, dynamic batching, KV cache management, request queuing with priority, autoscaling signals
---
```

**The Prompt:**

> You're designing the request queuing layer for an LLM inference server. Requests come in with:
> - `prompt_tokens` (input length)
> - `max_new_tokens` (requested output length)
> - `priority` (1=low, 2=normal, 3=high/SLA-bound)
>
> The GPU has a fixed VRAM budget. You need to decide:
> 1. What data structure holds the queue?
> 2. When do you form a batch and send it to the GPU?
> 3. What do you do when VRAM pressure is high?
> 4. What metric tells you the system is overloaded?
>
> Walk me through your design, starting with the queue structure.

**Hints:**

1. "Priority queue with three tiers: `heapq` with (priority, arrival_time, request). Within a priority tier, FIFO by arrival_time. Priority 3 items always ahead of 2, which are ahead of 1."
2. "Batch flushing strategy: hold for up to T milliseconds or until batch reaches B token budget (not just B requests — requests have variable length). Dynamic batching: flush early if a new request won't fit in the remaining token budget."
3. "VRAM pressure: when KV cache is nearly full, you can (a) pause new requests from being scheduled, (b) preempt running low-priority requests and free their KV cache, or (c) abort them. Preemption is gentler but complex."

**Solution (Design discussion):**

```
Queue structure:
  - Three priority tiers: lists or heaps sorted by arrival_time within tier
  - Total: max_heap on (priority, -arrival_time) works simply

Batch formation:
  - Accumulate requests until batch_timeout (e.g., 50ms) OR token_budget_full
  - token budget: sum of (prompt_tokens + max_new_tokens) × estimated_kv_size
  - Never batch across a memory cliff: if adding request X would exceed VRAM, flush without X

KV cache pressure handling:
  1. Reserve headroom: if KV cache >85% full, stop admitting new requests to GPU
  2. Preemption: evict lowest-priority in-flight request, saving its KV state to CPU RAM if feasible
  3. Abort: if CPU RAM is also full, abort lowest-priority request with retriable error

Autoscaling signal:
  - Queue depth weighted by token count > raw GPU utilization
  - Why: GPU util can be 80% while latency tanks because the queue is building up
  - Better signal: P99 time-in-queue for high-priority requests
  - Scale out when: P99 queue time > SLA threshold for N consecutive minutes
```

**Key Insight:** Autoscaling on raw GPU utilization is wrong because utilization can look fine while latency is exploding (the queue is growing, but the GPU is busy). Queue depth weighted by token count (not just request count) is a leading indicator of latency degradation.

**Follow-up Questions:**

- "You're batching by token budget. What's the minimum useful batch size? What if no two requests arrive within the batch timeout?"
- "Continuous batching (adding new requests to an in-progress GPU iteration) vs iteration batching — what's the difference, and why does Anthropic likely use continuous batching?"
- "How does prefix caching affect your queue design? If two requests share the first 1000 tokens, what should happen?"
- "If a high-priority request arrives when VRAM is full and all queued requests are low-priority, what do you do?"

---

## Category 7: SQL Challenges

**Purpose:** SQL window functions, aggregation, and complex joins are tested in passing. These are also practical skills in data-heavy infra roles.

**Phase range:** Phase 2 (basics), Phase 3 (advanced)

**Volume needed:** ~15 problems

---

### PB-013 — Weekly User Retention

```
---
id: PB-013
title: Weekly User Retention
category: sql
difficulty: 3
phase: 2
format: SQL
time_target: 15 min
skills: SQL, window functions, aggregation, date arithmetic
---
```

**The Prompt:**

> You have two tables:
>
> ```sql
> users(user_id, signup_date)
> activity(user_id, activity_date)
> ```
>
> Write a query that computes Week 1 retention: the percentage of users who signed up in a given week who also had at least one activity event in the week following their signup week.
>
> Return: `signup_week`, `signed_up_count`, `retained_count`, `retention_pct` (rounded to 2 decimal places).

**Hints:**

1. "First, figure out the signup week for each user: `DATE_TRUNC('week', signup_date)`. Then find their first activity in the following week: activity between signup_date+7 and signup_date+14 (exclusive)."
2. "Use a LEFT JOIN from users to activity filtered to the retention window. If no match, the user is not retained. COUNT(activity.user_id) counts retained, COUNT(users.user_id) counts all."
3. "Group by `DATE_TRUNC('week', signup_date)`. `ROUND(100.0 * retained / signed_up, 2)` gives the percentage — the `100.0` forces float division."

**Solution:**

```sql
SELECT
    DATE_TRUNC('week', u.signup_date) AS signup_week,
    COUNT(DISTINCT u.user_id)         AS signed_up_count,
    COUNT(DISTINCT a.user_id)         AS retained_count,
    ROUND(
        100.0 * COUNT(DISTINCT a.user_id) / COUNT(DISTINCT u.user_id),
        2
    )                                 AS retention_pct
FROM users u
LEFT JOIN activity a
    ON a.user_id = u.user_id
    AND a.activity_date >= u.signup_date + INTERVAL '7 days'
    AND a.activity_date <  u.signup_date + INTERVAL '14 days'
GROUP BY DATE_TRUNC('week', u.signup_date)
ORDER BY signup_week;
```

**Key Insight:** The LEFT JOIN with the date-range condition on the activity table is the core pattern for cohort retention queries. The `DISTINCT` on `a.user_id` in the numerator ensures users with multiple activities are counted once.

**Follow-up Questions:**

- "What if you want Week 2 retention (active in weeks 2 AND 3 after signup)? How does the query change?"
- "What if `activity_date` has multiple rows per day per user (multiple events)? Does your query still work?"
- "How would you compute rolling 7-day active users (count of distinct users with any activity in the prior 7 days, for each day)? What window function helps here?"

---

### PB-014 — Conversion Funnel

```
---
id: PB-014
title: Event Funnel Analysis
category: sql
difficulty: 4
phase: 3
format: SQL
time_target: 20 min
skills: SQL, window functions, CTEs, aggregation
---
```

**The Prompt:**

> You have a product with a 3-step funnel: `signup → profile_complete → first_purchase`. Events are logged in:
>
> ```sql
> events(user_id, event_type, event_time)
> ```
>
> `event_type` can be: `'signup'`, `'profile_complete'`, `'first_purchase'`
>
> Write a query that computes funnel conversion: for each step, how many users completed it, and what percentage dropped off before the next step?
>
> The rule: steps must happen in order (can't complete profile before signing up). Return: step_name, users_reached, drop_off_pct_to_next.

**Hints:**

1. "Find the timestamp of each event per user using conditional aggregation or a self-join. `MIN(CASE WHEN event_type = 'signup' THEN event_time END)` gives signup_time for each user."
2. "A user reached 'profile_complete' if they have a profile_complete event AFTER their signup event. Similarly for first_purchase after profile_complete. Use CTEs to build user-level milestones."
3. "For drop-off: `(users_at_step_N - users_at_step_N+1) / users_at_step_N` gives the drop-off rate. Present as a summary table with UNION or by computing all three steps as one query."

**Solution:**

```sql
WITH user_steps AS (
    SELECT
        user_id,
        MIN(CASE WHEN event_type = 'signup'           THEN event_time END) AS signup_time,
        MIN(CASE WHEN event_type = 'profile_complete' THEN event_time END) AS profile_time,
        MIN(CASE WHEN event_type = 'first_purchase'   THEN event_time END) AS purchase_time
    FROM events
    GROUP BY user_id
),
funnel AS (
    SELECT
        COUNT(*) FILTER (WHERE signup_time IS NOT NULL)                          AS signed_up,
        COUNT(*) FILTER (WHERE profile_time > signup_time)                       AS profile_completed,
        COUNT(*) FILTER (WHERE purchase_time > profile_time AND profile_time > signup_time) AS purchased
    FROM user_steps
)
SELECT 'signup'           AS step, signed_up        AS users_reached,
       ROUND(100.0 * (signed_up - profile_completed) / signed_up, 1) AS drop_off_pct
FROM funnel
UNION ALL
SELECT 'profile_complete', profile_completed,
       ROUND(100.0 * (profile_completed - purchased) / NULLIF(profile_completed, 0), 1)
FROM funnel
UNION ALL
SELECT 'first_purchase',   purchased, NULL
FROM funnel;
```

**Key Insight:** Conditional aggregation (`MIN(CASE WHEN ... END)`) is the cleanest way to pivot event rows into user-level milestone columns. It avoids multiple self-joins and runs in a single pass.

**Follow-up Questions:**

- "What if a user signs up twice (duplicate `signup` events)? How does your query handle it?"
- "What if you want time-to-complete each step (median time from signup to profile_complete)? What window function or approach would you use?"
- "How would you compute the funnel separately for users acquired through different channels (add a `channel` column to the users table)?"

---

## Category 8: Spec Decomposition

**Purpose:** Train the habit of planning before coding. Anthropic interviewers give messy verbal specs. The correct first move is to decompose, not code.

**Phase range:** Phase 1 (simple specs), Phase 2 (ambiguous specs), Phase 4 (complex, high-pressure)

**Volume needed:** ~15 problems

---

### PB-015 — Notification Service

```
---
id: PB-015
title: Notification Service Spec Decomposition
category: spec-decomposition
difficulty: 2
phase: 1
format: SD
time_target: 20 min
skills: problem decomposition, spec clarification, asking clarifying questions
---
```

**The Prompt:**

> Here's a product spec from a PM (verbatim): "We need to notify users about things that happen in the system. Some things are urgent, some aren't. We don't want to spam people. It should work with email and Slack."
>
> That's it. That's the spec.
>
> Before writing any code, give me:
> 1. The 5 most important clarifying questions you'd ask
> 2. Your assumptions (what you'll assume if you can't ask)
> 3. A 5-step implementation plan based on those assumptions

**Hints:**

1. "The most critical ambiguities: (a) what triggers a notification, (b) how is priority determined, (c) what prevents spam (dedup? rate limiting? user preferences?), (d) are notifications transactional (must deliver, retry on failure?)"
2. "Your assumptions shape the architecture. If notifications are best-effort (no retry), it's simpler than transactional (at-least-once delivery with dead letter queue)."
3. "A good decomposition: (1) define the data model (event type, recipient, channel, priority), (2) triggering mechanism (who calls the notification service), (3) routing logic (which channel for which priority), (4) dedup/throttle logic, (5) delivery + retry."

**Solution (sample decomposition):**

```
Clarifying questions I'd ask:
1. What events trigger notifications? (User-defined alerts? System events? Both?)
2. Who decides which events are urgent vs non-urgent? (Hard-coded per event type? Configurable per user?)
3. What counts as "spam"? Same event twice? Same type within N minutes? Per user or globally?
4. What happens if delivery fails? Must we retry? Is there a dead-letter queue?
5. Is user preference stored (some users want only email, not Slack)?

Assumptions (since I can't ask):
- Priority is hard-coded per event type (high = Slack + email, low = email only)
- Spam prevention = no duplicate notifications for the same event_id
- Delivery is best-effort: one retry, then drop and log

5-step plan:
1. Data model: Notification(event_id, event_type, recipient_id, priority, channels, payload, status)
2. API: POST /notify accepts event_id + type + recipient — idempotent on event_id
3. Routing: priority → channel selection (Slack for high, email for low/high)
4. Dedup: check if event_id already processed before sending; skip if yes
5. Delivery: send to each channel; retry once on failure; update status
```

**Key Insight:** A good decomposition doesn't solve all ambiguity — it makes the ambiguity explicit and forces a decision. The interviewer values the questions as much as the plan. Stating your assumptions clearly shows professional judgment.

**Follow-up Questions:**

- "Your dedup check on `event_id` — where does that state live? What if the service has multiple instances?"
- "User A prefers only email. How does your data model store that, and how does step 3 use it?"
- "What if the system needs to send 10,000 notifications at once (batch event)? What breaks in your design?"

---

### PB-016 — Access Control Decomposition

```
---
id: PB-016
title: Access Control System Decomposition
category: spec-decomposition
difficulty: 3
phase: 2
format: SD
time_target: 25 min
skills: problem decomposition, data modeling, algorithm selection, spec clarification
---
```

**The Prompt:**

> Here's the spec: "Users belong to teams. Teams belong to organizations. Resources (documents, folders) can be shared with users, teams, or organizations. Someone with access to a folder implicitly has access to its contents unless explicitly denied. Admins can see everything."
>
> Before coding, decompose this into a design:
> 1. What's the data model?
> 2. How does the `can_access(user_id, resource_id)` function work algorithmically?
> 3. What's the worst-case complexity and is it acceptable?
> 4. What edge cases are mentioned in the spec that you need to handle?

**Hints:**

1. "Three entity types (users, teams, orgs), three grant levels (user, team, org), two resource types (document, folder), explicit deny. Your data model needs to represent grants at each level and folder hierarchy."
2. "The algorithm for `can_access`: check explicit deny first (deny beats allow). Then check direct grants on resource. Then check grants via team membership. Then check org-level grants. Then check parent folder grants recursively."
3. "Deny check must happen before any allow check. 'Explicit deny' means user-level deny beats org-level allow. This is the hardest edge case — many implementations get this wrong."

**Solution (design):**

```
Data model:
  - users(user_id, org_id)
  - teams(team_id, org_id)
  - team_memberships(user_id, team_id)
  - resources(resource_id, type, parent_id, org_id)  # parent_id for folder hierarchy
  - access_grants(resource_id, grantee_type, grantee_id, access_type)
    # grantee_type: 'user' | 'team' | 'org'
    # access_type: 'allow' | 'deny'

can_access(user_id, resource_id):
  1. Collect user's team_ids and org_id
  2. Walk up resource hierarchy (resource → parent folder → ... → root)
  3. At each level: check for explicit deny on (user_id, team_ids, org_id)
     - If any deny found: return False immediately
  4. At each level: check for explicit allow on same grantee set
     - If allow found: return True
  5. If no grant anywhere up the hierarchy: return False

Edge cases:
  - Deny at child level must not be overridden by allow at parent
  - Admin role: short-circuit at step 0 (check is_admin(user_id))
  - Circular parent_id (bug guard: max depth or visited set)
  - Resource not found: return False (not an error — unauthorized users shouldn't know it exists)

Complexity:
  - O(D × G) where D = folder depth, G = grants per level
  - Typically D < 10, G < 100 → acceptable
  - Can cache the grant lookup with Redis (TTL = short, invalidate on grant change)
```

**Key Insight:** Explicit deny beats allow — this must be checked first at every level. Many access control implementations forget this and can be bypassed by having both an allow at org level and a deny at user level (the allow wins incorrectly if you check allows first).

**Follow-up Questions:**

- "Your algorithm walks up the resource hierarchy. What if a deeply nested resource is accessed 1000 times per second? What caching strategy would you use?"
- "What if we add 'read-only' and 'write' access levels, not just allow/deny? How does the grant schema change?"
- "How do you handle: a user is denied at the folder level, but has an explicit allow on a specific document inside that folder? Which wins?"

---

## Category 9: Debug & Read

**Purpose:** Build code reading speed and bug-spotting instincts. Interviewers expect you to find bugs in unfamiliar code without running it.

**Phase range:** Phase 1 onward (all phases)

**Volume needed:** ~15 problems

---

### PB-017 — Buggy Concurrent Cache

```
---
id: PB-017
title: Buggy Concurrent Cache
category: debug-and-read
difficulty: 3
phase: 1
format: DR
time_target: 15 min
skills: threading, lock design, critical section analysis
---
```

**The Prompt:**

> Read this code carefully. It has a concurrency bug that will manifest under load — not always, but reliably. Find it and explain why it causes a problem.
>
> ```python
> import threading
>
> class Cache:
>     def __init__(self):
>         self._data = {}
>         self._lock = threading.Lock()
>
>     def get_or_compute(self, key, compute_fn):
>         if key in self._data:
>             return self._data[key]
>         with self._lock:
>             result = compute_fn(key)
>             self._data[key] = result
>         return result
>
>     def invalidate(self, key):
>         with self._lock:
>             self._data.pop(key, None)
> ```
>
> What's wrong? Describe the exact failure scenario with two threads.

**Hints:**

1. "The `if key in self._data` check happens outside the lock. Is it safe to read `self._data` without holding the lock?"
2. "Two threads can both pass the `if key in self._data` check at the same time — one holds the lock but the other is waiting. When the second thread gets the lock, it will call `compute_fn` again even though the result was already computed. Is that the bug, or is there something worse?"
3. "There's also a TOCTOU race: Thread A checks (key not in cache → True), Thread B invalidates the key, Thread A gets lock and computes. That's fine. But what about: Thread A checks (key IS in cache → True), Thread B invalidates the key, Thread A returns stale value — all without a lock? The read itself is the bug."

**Solution:**

```
Bug: The check `if key in self._data` is a TOCTOU race.

Two failure scenarios:

1. Stale read: Thread A reads self._data[key] without the lock. Between the check
   and the return, Thread B calls invalidate() and removes the key. Thread A returns
   a value that was just invalidated.

2. Double compute: Thread A and Thread B both check `if key in self._data` and both
   see False (key not in cache). Both enter get_or_compute. Thread A acquires the lock,
   computes, stores result, releases lock. Thread B acquires the lock, computes AGAIN,
   overwrites result. If compute_fn has side effects (database write, API call), this
   causes duplicate execution.

Fix 1 (correct but coarse-grained — lock everything):
def get_or_compute(self, key, compute_fn):
    with self._lock:
        if key not in self._data:
            self._data[key] = compute_fn(key)
        return self._data[key]

Fix 2 (double-checked locking — only avoids duplicate compute if compute is idempotent):
def get_or_compute(self, key, compute_fn):
    if key in self._data:   # fast path without lock (still racy for stale read)
        return self._data[key]
    with self._lock:
        if key not in self._data:   # re-check under lock
            self._data[key] = compute_fn(key)
        return self._data[key]

Fix 1 is simpler and correct. Fix 2 is only safe if you can tolerate a brief stale read
on the fast path (often acceptable for read-heavy caches where compute is expensive).
```

**Key Insight:** Reads of shared mutable state also need lock protection unless you're using a data structure with atomic reads (Python's GIL makes `dict` reads somewhat safe for simple lookups, but this is an implementation detail you can't rely on). The correct default: if anything writes to it concurrently, hold the lock to read too.

**Follow-up Questions:**

- "Python's GIL means `dict` lookups are actually thread-safe at the bytecode level. Does that make the original code safe? Why or why not?"
- "In Fix 2 (double-checked locking), explain why re-checking `if key not in self._data` under the lock is necessary."

---

## Category 10: Behavioral

**Purpose:** The Hiring Manager round is 45 minutes of past project discussion. These sessions build the habit of structured, specific storytelling.

**Phase range:** Phase 4 (drafting), Phase 5 (refining under pressure)

**Volume needed:** ~10 sessions (not a large problem bank — these are personalized)

---

### PB-018 — The Simplicity Choice

```
---
id: PB-018
title: Behavioral — The Simplicity Choice
category: behavioral
difficulty: 3
phase: 4
format: BS
time_target: 15 min
skills: behavioral storytelling, trade-off articulation, defaulting to simplicity
---
```

**The Prompt:**

> The Anthropic Hiring Manager round has a defining moment: you're presented with two approaches to a real problem and asked which to pick. The winning answer is always the simpler one — and you must defend why.
>
> Let's practice. Tell me about a time you chose a simpler solution when a more complex one seemed "better." What was the trade-off? How did it play out?
>
> If you don't have a specific story, let's build one: describe a technical decision you made recently and we'll find the simplicity angle together.

**Hints:**

1. "The STAR structure: Situation (1-2 sentences, set the stakes), Task (what you needed to solve), Action (what you chose and why NOT the complex option), Result (what happened — ideally quantified)."
2. "The key line in this story: 'I chose [simpler option] over [complex option] because [the flexibility/power of the complex option] wasn't solving a real problem we had yet.' That's the Anthropic mindset."
3. "Specifics matter more than narrative polish. Real numbers (saved 2 weeks of engineering, reduced failure rate from 3% to 0.2%) stick. Vague ('it worked out well') doesn't."

**Key Insight:** Anthropic specifically values "flexibility you don't need yet is just complexity you pay for now." Your story should show that you *recognized* the temptation toward complexity and *chose* against it deliberately — not that you stumbled into a simple solution.

**Follow-up Questions (OpenClaw pushback):**

- "What if the complex solution would have been needed 6 months later? Were you short-sighted?"
- "How did you convince the team that the simpler solution was better? Did anyone push back?"
- "If you had to redo that decision knowing what you know now, would you make the same call?"

---

### PB-019 — Debugging Process

```
---
id: PB-019
title: Behavioral — Debugging Under Uncertainty
category: behavioral
difficulty: 3
phase: 4
format: BS
time_target: 15 min
skills: behavioral storytelling, debugging process articulation, structured thinking
---
```

**The Prompt:**

> Hiring managers at infra companies care deeply about how you debug systems in production — because that's most of the job. Tell me about a time you debugged a hard production issue — one where the root cause wasn't obvious and you had to systematically work through hypotheses.
>
> Structure your answer: what was the failure? What was your initial hypothesis? How did you narrow it down? What was the actual cause? What did you change?

**Hints:**

1. "A good debugging story has: (1) the symptom (P99 latency spiked, error rate went to 5%), (2) initial (wrong) hypothesis and why you ruled it out, (3) the thing that narrowed it down (a metric, a log line, a timing), (4) the root cause (surprising is better — shows real debugging), (5) the fix and prevention."
2. "The Anthropic way to debug, based on the Hiring Manager round guidance: isolate → hypothesize → instrument → verify. Name these steps in your story."
3. "Avoid: 'I looked at the logs and found the bug.' Show your reasoning process, including what you ruled OUT. That's the interesting part."

**Key Insight:** A debugging story that includes dead ends (hypotheses you tried and ruled out) is more credible and more impressive than a clean straight line to the answer. Real debugging involves wrong turns.

**Follow-up Questions:**

- "What would you have done differently if you couldn't reproduce the issue locally?"
- "How did you communicate the issue to stakeholders while you were still investigating?"
- "After you fixed it, what did you change to prevent the same issue from happening again?"

---

## Summary

| Category | Problems Sketched | Total Needed | Phase Range |
|----------|------------------|--------------|-------------|
| Data Structures | 2 full examples | ~30 | 1–4 |
| Graph Algorithms | 2 full examples | ~20 | 1–4 |
| Threading | 2 full examples | ~20 | 1–4 |
| Asyncio | 2 full examples | ~20 | 2–4 |
| Algorithm Patterns | 2 full examples | ~25 | 2–4 |
| System Design | 2 full examples | ~20 | 2–5 |
| SQL | 2 full examples | ~15 | 2–3 |
| Spec Decomposition | 2 full examples | ~15 | 1–4 |
| Debug & Read | 1 full example | ~15 | 1–5 |
| Behavioral | 2 full examples | ~10 | 4–5 |
| **Total** | **19 full examples** | **~190** | |

The 19 fully-written problems here seed each category. Wave 3 curriculum generation (phase-X-content aspects) will expand each category to its target volume, drawing from this format and philosophy.

---

## Problem Sourcing Principles

1. **No named LeetCode problems** — problems are inspired by real systems Anthropic builds or uses, not algorithm competitions
2. **Conversational phrasing** — "Here's a product spec from a PM" not "Given array A of size N"
3. **Progressive complexity** — every problem has a 3-hint ladder and follow-up questions that escalate
4. **The WHY is explicit** — every Key Insight section explains the intuition, not just the technique
5. **Anthropic style markers** — messy specs, production constraints, trade-off discussions, "explain your thinking" close
6. **OpenClaw-deliverable** — can be read naturally over Telegram; no IDE required for the initial exploration
