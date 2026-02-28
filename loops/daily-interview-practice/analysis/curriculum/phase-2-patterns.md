# Phase 2: Pattern Building — OpenClaw Session Scripts

**Duration:** 4 weeks (28 days), Weeks 5–8
**Formats:** Code Kata (3x/week), SQL Challenge (1x/week), Mock Pressure Round (1x/week), Review & Reflect (1x/week), Mini System Design or Debug & Read (1x/week, alternating)
**Target:** Pattern recognition kicks in — see a problem, feel its shape. asyncio becomes muscle memory.

This file is the **executable curriculum** for Phase 2. OpenClaw reads this to know exactly what to say, ask, and evaluate on each of the 28 days. Every session is written as a complete OpenClaw script: opening message, exercise prompt, scoring rubric, evaluation guidance, key insight, and forward transition.

Phase 2 bridges from mechanical fluency (Phase 1) to pattern recognition. The patterns introduced here — topological sort, asyncio, two-pointer, sliding window, binary search, prefix sums, heapq — are the ones that unlock the Anthropic interview problems. The asyncio.Semaphore pattern from Week 6 is the exact skill tested in Coding Round 1 (async web crawler).

**Day numbering:** Days 1–28 within Phase 2. In the global practice log, these are days 32–59 (after 3 diagnostic days + 28 Phase 1 days).

---

## Phase 2 Opening Message

> OpenClaw sends this on Day 1 of Phase 2:

> **Phase 2: Pattern Building begins today.**
>
> You built the mechanical bedrock in Phase 1. Now we train pattern recognition — looking at a problem and feeling its shape before writing a line of code. By end of Phase 2, you should be able to identify "that's a topological sort" or "that's a sliding window" within 2 minutes of reading a problem.
>
> New this phase: SQL challenges (Thursdays), Mock Pressure Rounds (Fridays — timed, no help), and the asyncio patterns you need for Coding Round 1 (the async web crawler). Concurrency threads through everything, as always.
>
> The format shift: Fridays are now hard-stop 30-minute mocks. When time's up, we evaluate what you submitted. Partial credit counts. Getting something working in 30 minutes beats getting something perfect in 45.
>
> Let's go. Day 1.

---

## WEEK 5: Topological Sort + asyncio Fundamentals

**This week's arc:** Kahn's topological sort (essential for the OA Task Management System) → asyncio event loop mental model → two-pointer pattern. Three new pattern families in one week — absorb the shape of each.

---

### Day 1 (Mon) — Code Kata: Topological Sort with Kahn's Algorithm

**Format:** Code Kata | **Key skill:** Kahn's algorithm; cycle = nodes with remaining in-degree

---

**OpenClaw opening:**
> **Day 2, Week 5 — Code Kata: Topological Sort**
>
> This week's first pattern is topological sort — the algorithm behind "run B only after A finishes." You'll need this in the Anthropic OA (Task Management System with dependencies). It's also the foundation of every build system, package manager, and CI/CD pipeline.
>
> Kata: implement `topological_sort(graph)` where `graph` is a dict of `node → list of neighbors` (directed edges meaning "this node must come before those neighbors"):
>
> ```python
> graph = {
>     'A': ['C'],
>     'B': ['C', 'D'],
>     'C': ['E'],
>     'D': ['F'],
>     'E': [],
>     'F': []
> }
> ```
>
> Return a list of nodes in a valid topological order (nodes with no prerequisites come first). If the graph has a cycle, raise a `ValueError`.
>
> Use Kahn's algorithm: compute in-degrees, start a queue with zero-in-degree nodes, process queue.
>
> **Two sentences on your approach, then code.**

**Target time:** 25 min total

**10-min check-in:**
> How's it going? Share what you have — even the in-degree computation step counts.

**OpenClaw evaluation guide (internal):**
- **Strong answer — Step 1:** Build in-degree dict: `in_degree = {node: 0 for node in graph}`, then `for node in graph: for neighbor in graph[node]: in_degree[neighbor] += 1`. Careful: all nodes must be initialized, including those with no incoming edges.
- **Strong answer — Step 2:** Initialize queue with all zero-in-degree nodes: `queue = deque(n for n, deg in in_degree.items() if deg == 0)`.
- **Strong answer — Step 3:** Process queue: pop node, append to result, decrement in_degree of all its neighbors, add any new zero-in-degree neighbors to queue.
- **Strong answer — Cycle detection:** `if len(result) != len(graph): raise ValueError("Cycle detected")`. This is the key check — nodes in a cycle never reach in_degree 0.
- **Common bug 1:** Forgetting to initialize in_degree for nodes that appear as neighbors but not as keys in graph dict (nodes with no outgoing edges). Fix: iterate both `graph.keys()` and all neighbor lists when initializing.
- **Common bug 2:** Not detecting cycles — returning a partial result when there's a cycle. The `len(result) != len(graph)` check is mandatory.
- **Common bug 3:** Using a list as the queue (O(n) popleft) instead of `collections.deque` (O(1) popleft). Flag this — it matters at scale.

**OpenClaw feedback approach:**
- If in_degree initialization misses neighbor-only nodes: "Your in_degree dict — does it have an entry for every node in the graph, including nodes that appear only as neighbors (not as keys)? Trace through with node 'E' in the example — is it in your in_degree dict when you initialize?"
- If cycle detection is missing: "What happens if I give you a graph with a cycle — say `{'A': ['B'], 'B': ['A']}`? Trace through your code. What does it return?"
- If using a list for queue: "You're using `queue.pop(0)` — what's the time complexity of that? What would you use instead?"
- If all correct: "Nice. Now: what's the time complexity of your solution? O(what)?"

**Key insight to deliver:**
> **Key insight:** Kahn's algorithm is a BFS over the dependency graph, peeling off nodes with no remaining prerequisites one layer at a time. The magic is in the cycle detection: if any nodes remain with non-zero in-degree after the BFS completes, they're stuck in a cycle — they're waiting on each other. Always check `len(result) != len(graph)` at the end. This is the same check you'll need in the OA's Task Management System.

**Stretch question (if they finish fast):**
> Can you modify this to return the topological order as layers? (All nodes with in-degree 0 in Layer 1, their freed nodes in Layer 2, etc.) This is the "parallel execution" view — which tasks can run simultaneously?

**Tomorrow preview:**
> Tomorrow: asyncio. The event loop mental model — the key to understanding everything concurrent in Python for the web crawler round.

---

### Day 2 (Tue) — Code Kata: asyncio Event Loop Mental Model

**Format:** Code Kata | **Key skill:** Event loop: one thread, cooperative multitasking

---

**OpenClaw opening:**
> **Day 2, Week 5 — Code Kata: asyncio Basics**
>
> Today we build the mental model that everything async builds on. asyncio is NOT multithreading — it's one thread that switches tasks voluntarily at `await` points. This distinction matters for everything you build in Phase 2.
>
> Kata: write these three async functions and predict the output before running:
>
> ```python
> import asyncio
>
> async def task_a():
>     print("A: start")
>     await asyncio.sleep(1)
>     print("A: done")
>
> async def task_b():
>     print("B: start")
>     await asyncio.sleep(0.5)
>     print("B: done")
>
> async def main():
>     # Version 1: sequential awaits
>     await task_a()
>     await task_b()
>
>     # Version 2: concurrent via gather
>     await asyncio.gather(task_a(), task_b())
> ```
>
> **Before you write any code: predict what Version 1 prints and in what order. Then predict Version 2. Then implement and verify.**
>
> After that, write an `async def fetch(url: str) -> str` function that simulates a 1-second network call using `asyncio.sleep(1)` and returns `f"fetched:{url}"`. Then write `fetch_all(urls: list[str]) -> list[str]` that fetches sequentially and another that fetches concurrently. Time both.

**Target time:** 25 min total

**10-min check-in:**
> What did you predict for Version 1 vs Version 2? Walk me through your reasoning before we verify.

**OpenClaw evaluation guide (internal):**
- **Version 1 prediction (correct):** A:start → (1s wait) → A:done → B:start → (0.5s wait) → B:done. Total ~1.5s.
- **Version 2 prediction (correct):** A:start → B:start → (0.5s) → B:done → (0.5s more) → A:done. Total ~1.0s. Both start immediately, B finishes first because shorter sleep.
- **Key understanding:** `await asyncio.sleep(N)` yields control back to the event loop — it doesn't block the thread. Other coroutines can run during the sleep.
- **Strong sequential fetch_all:** `[await fetch(url) for url in urls]` or `for url in urls: results.append(await fetch(url))`. Timing: N seconds for N URLs.
- **Strong concurrent fetch_all:** `await asyncio.gather(*[fetch(url) for url in urls])`. Timing: ~1 second regardless of N (they all start together).
- **Common confusion:** Thinking `async def` makes a function automatically run concurrently. It doesn't — you need `gather` or `create_task`. `async def` just means "this function can yield control."
- **Common bug:** Writing `asyncio.gather(fetch(url) for url in urls)` (generator, not unpacked). Must be `*[...]` or `*list(...)`.

**OpenClaw feedback approach:**
- If Version 1 prediction wrong: "You predicted they'd interleave in Version 1 — but there's no gather. Walk me through what `await task_a()` means. When does `await task_b()` start?"
- If Version 2 prediction wrong: "A and B both call `asyncio.sleep` — at what point does B get to run while A is sleeping?"
- If gather syntax wrong (generator not unpacked): "Does `asyncio.gather(gen)` work? Check what gather expects — it takes coroutines as positional arguments, not a generator. How do you unpack a list into positional args?"
- If both correct: "Now the key question: why does your sequential fetch_all take N seconds but concurrent takes ~1 second? What's actually happening at the CPU level?"

**Key insight to deliver:**
> **Key insight:** asyncio is cooperative multitasking — one thread, but it switches between tasks at every `await`. `await asyncio.sleep(1)` means "I'm waiting for 1 second, someone else can run." `asyncio.gather()` launches multiple coroutines and interleaves them at their `await` points. The mental model: think of a cook juggling multiple dishes — one chef, but tasks in parallel because each dish has idle time (waiting for water to boil, oven to heat). The event loop is the cook. `await` is "this dish needs 10 more minutes, I'll start the next one."

**Stretch question:**
> If you call `asyncio.gather(task_a(), task_b())` — when do the coroutines start running? Before the `await`? Or only after? What does `asyncio.create_task()` do differently?

**Tomorrow preview:**
> Tomorrow: two-pointer pattern. A completely different pattern — but one you'll recognize again and again in array problems. Sorted array + two moving indices = two-pointer.

---

### Day 3 (Wed) — Code Kata: Two-Pointer Pattern

**Format:** Code Kata | **Key skill:** Two-pointer pattern; sorted array invariant

---

**OpenClaw opening:**
> **Day 3, Week 5 — Code Kata: Two-Pointer**
>
> Two-pointer is one of the cleanest patterns in algorithmic interviews. Once you see it, you see it everywhere. It only applies when: (1) the array is sorted, or (2) you can sort it without losing information.
>
> Kata Part 1: Given a sorted integer array `nums` and a `target` integer, find ONE pair of indices `(i, j)` where `nums[i] + nums[j] == target` and `i != j`. Return the pair, or `None` if no pair exists. O(n) time.
>
> Kata Part 2: Extend it — find ALL unique pairs that sum to `target`. A pair `(a, b)` and `(b, a)` are the same. No duplicates in output.
>
> Start with Part 1. When you have it, I'll give you Part 2.
>
> **Two sentences on your approach, then code.**

**Target time:** 25 min total

**10-min check-in:**
> Part 1 done? Share it, then tackle Part 2. Not done? Share what you have.

**OpenClaw evaluation guide (internal):**
- **Strong Part 1:** `left = 0, right = len(nums) - 1`. While `left < right`: if `nums[left] + nums[right] == target`: return `(left, right)`. Elif sum < target: `left += 1`. Else: `right -= 1`. Return `None`.
- **Strong Part 2:** Same two-pointer loop, but when a pair is found: `results.append((nums[left], nums[right]))`. Then `left += 1; right -= 1`. Then skip duplicates: `while left < right and nums[left] == nums[left-1]: left += 1`. Same for right.
- **Common bug Part 1:** Returning `(nums[left], nums[right])` (values) when asked for indices `(i, j)`. Read the problem carefully.
- **Common bug Part 2:** Not skipping duplicates — returning `(1,5)` twice from `[1, 1, 3, 5, 5]` when target is 6.
- **Common misconception:** Trying to use a hashmap (O(n) but needs sorted to dedup). Two-pointer is cleaner and also O(n).
- **Why sorted matters:** When sum is too small, moving left pointer right always increases sum (because array is sorted). When sum is too large, moving right pointer left always decreases sum. This monotonic property is the invariant.

**OpenClaw feedback approach:**
- If using hashmap instead of two-pointer: "That works for Part 1, but can you do it with two pointers instead? When the sum is too small, which pointer moves and why?"
- If Part 2 has duplicates: "Give your Part 2 the array `[1, 1, 5, 5]` with target 6. What does it output? What should it output?"
- If pointer logic reversed (left++ when too big): "If `nums[left] + nums[right] > target`, which pointer moves? Moving `left` right increases the sum — does that help?"
- If all correct: "Now: what's the time complexity? And why can't you use two-pointer on an unsorted array?"

**Key insight to deliver:**
> **Key insight:** Two-pointer works because the sorted array gives you a monotonic property: moving left pointer right increases the sum, moving right pointer left decreases it. This turns a naive O(n²) double-loop into O(n). The pattern recognition trigger is: "sorted array" + "find a pair/combination satisfying a condition." When you see those two, reach for two-pointer before anything else.

**Stretch question:**
> What if the array isn't sorted but you're allowed to sort it? Does sorting first change your answer (assuming you return values, not indices)?

**Tomorrow preview:**
> Tomorrow: SQL. First SQL challenge — aggregation, GROUP BY, and ORDER BY. These show up in behavioral interviews ("tell me about a time you analyzed data") and sometimes in coding rounds.

---

### Day 4 (Thu) — SQL Challenge: Top N Users by Activity

**Format:** SQL Challenge | **Key skill:** Aggregation + ordering + LIMIT

---

**OpenClaw opening:**
> **Day 4, Week 5 — SQL Challenge: Top N Users**
>
> SQL shows up at Anthropic in behavioral conversations and sometimes in technical screens. The first few SQL sessions will build up from basics. Today: GROUP BY, aggregation, ORDER BY.
>
> Here's the schema:
>
> ```sql
> CREATE TABLE requests (
>   id         BIGINT PRIMARY KEY,
>   user_id    BIGINT NOT NULL,
>   endpoint   VARCHAR(255),
>   status     INT,
>   created_at TIMESTAMP NOT NULL
> );
> ```
>
> **The query:** Find the top 10 users by total request count in the last 30 days. Return `user_id` and `request_count`, sorted by request_count descending.
>
> Write the query, then explain what each clause does.

**Target time:** 20 min total

**Hints (deliver one at a time if stuck after 5 min):**
1. You need to count requests per user — that's an aggregation. Which function counts rows?
2. To filter by date, you need a `WHERE` clause before you group.
3. To get the top N, you need `ORDER BY ... DESC LIMIT N` after the `GROUP BY`.

**Complete solution:**
```sql
SELECT
    user_id,
    COUNT(*) AS request_count
FROM requests
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY request_count DESC
LIMIT 10;
```

**Teaching points:**
- `WHERE` filters rows BEFORE aggregation. `HAVING` filters AFTER aggregation. Always apply date filters in `WHERE` — far more efficient (can use index).
- `COUNT(*)` counts rows. `COUNT(column)` counts non-NULL values. Usually `COUNT(*)` is what you want.
- `ORDER BY request_count DESC` — you can reference the alias in ORDER BY (but NOT in WHERE or GROUP BY in most databases).
- `LIMIT` without `ORDER BY` is meaningless — results are non-deterministic. Always pair them.
- Common mistake: putting `LIMIT` before `ORDER BY`. SQL evaluates in logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.

**Stretch question:**
> How would you modify this to only count requests with status 200 (successful requests)? Two ways: WHERE or COUNT with a CASE expression. Which would you use and why?

**Tomorrow preview:**
> Tomorrow is your first Mock Pressure Round: 30-minute timed BFS problem. Timer starts when I send the prompt. No help until time's up.

---

### Day 5 (Fri) — Mock Pressure Round: BFS Maze Solver

**Format:** Mock Pressure Round | **Key skill:** BFS on 2D grid; BFS guarantees shortest path

---

**OpenClaw opening:**
> **Mock Pressure Round — 30 minutes. Timer starts now.**
>
> Here's the problem:
>
> You're given a 2D grid where `0` = open cell and `1` = wall. Find the shortest path from the top-left corner `(0, 0)` to the bottom-right corner `(rows-1, cols-1)`. Movement is 4-directional (up, down, left, right). Walls cannot be entered.
>
> Return the path as a list of `(row, col)` tuples from start to end, inclusive. If no path exists, return `None`.
>
> Example:
> ```
> grid = [
>   [0, 0, 1, 0],
>   [1, 0, 1, 0],
>   [1, 0, 0, 0],
>   [0, 1, 1, 0]
> ]
> # Shortest path: [(0,0), (0,1), (1,1), (2,1), (2,2), (2,3), (3,3)]
> ```
>
> Two sentences on approach. Then code. Clock is running.

**Target time:** 30 min hard stop

**At 15 min — OpenClaw throws an edge case:**
> Quick check while you're working: what happens if `grid[0][0] == 1` (start is a wall)? Or if `grid[rows-1][cols-1] == 1` (end is a wall)? Handle those.

**At 25 min — if not done:**
> 5 minutes left. If you haven't reconstructed the path yet, make sure BFS itself works first and submit that. Partial credit: working BFS that returns True/False is better than broken path reconstruction.

**OpenClaw evaluation rubric:**
- **Pass:** BFS with deque, visited set (mark on enqueue, not dequeue), bounds checking, correct path reconstruction (track parent dict or path list), handles no-path case (return None), handles start/end wall edge cases.
- **Conditional pass:** BFS correct and finds shortest distance/True, but path reconstruction is missing or broken. OR: visited marked on dequeue instead of enqueue (still correct, just less efficient — note but don't fail).
- **Fail:** DFS instead of BFS (won't find shortest path), bounds checking broken (IndexError), or can't get BFS working at all.

**Path reconstruction approach (if they ask for hint):**
> Track a `parent` dict: when you visit a cell, record `parent[cell] = cell_you_came_from`. At the end, walk back from the destination using parent pointers and reverse the path.

**OpenClaw debrief (after time's up):**
> Time. Share what you have.
>
> Self-assessment: Pass / Conditional pass / Fail?
>
> Questions to discuss:
> - Why BFS and not DFS for shortest path?
> - Where did you mark cells as visited — on enqueue or dequeue? Does it matter for correctness? For efficiency?
> - How did you reconstruct the path?

**Key insight to deliver:**
> **Key insight:** BFS explores cells layer by layer — all cells 1 hop away, then all cells 2 hops away, etc. The first time BFS reaches the destination, it's guaranteed to have taken the shortest path. DFS doesn't have this property — it might reach the destination via a long winding path before trying the short one. Rule: shortest path on unweighted graph → BFS. Also: mark visited on ENQUEUE, not dequeue — otherwise you'll add the same cell to the queue dozens of times from different neighbors, causing exponential blowup on grid problems.

**Tomorrow preview:**
> Tomorrow: Review & Reflect on today's maze. We'll extract the key patterns and make sure BFS is locked in.

---

### Day 6 (Sat) — Review & Reflect: BFS Maze Solver

**Format:** Review & Reflect | **Key skill:** BFS vs DFS choice rationale; path reconstruction

---

**OpenClaw opening:**
> **Review & Reflect — yesterday's BFS maze**
>
> Time to consolidate. No looking at yesterday's code yet — retrieval from memory is the learning. Answer these questions first, then we'll compare to what you actually wrote.

**Retrieval questions (OpenClaw asks in sequence, waits for answer before next):**

1. > Without looking: write the core BFS loop structure. Just the loop — how do you process each cell, what goes into the queue, when do you stop?

2. > Why does BFS guarantee shortest path on this grid problem, but DFS doesn't? Give me the one-sentence intuition.

3. > You had to reconstruct the path, not just return True/False. How did you track which cell you came from? What data structure did you use?

4. > What happens if you mark cells as visited on dequeue instead of enqueue? Give me a concrete example where it causes a problem.

**What to look for:**
- BFS loop: `while queue: cell = queue.popleft(); check if done; for each neighbor: if not visited and not wall: mark visited, add to queue with parent`
- BFS/DFS intuition: "BFS explores by distance — nearest cells first, so the first time you reach the destination, it's the shortest route"
- Path reconstruction: `parent = {}` dict mapping each cell to the cell it was reached from; walk back from destination to start using parent chain, then reverse
- Visited-on-dequeue bug: cell (2,3) might be added to the queue from 3 different neighbors before it's dequeued; with visited-on-dequeue, all 3 insertions succeed, causing the same cell to be processed 3 times — O(n²) or worse instead of O(n)

**Key pattern name:**
> **Pattern:** BFS on grid — the template is always: `queue = deque([(start, [start])])` (or with parent dict), `visited = {start}`, `while queue: cell, path = queue.popleft(); if cell == end: return path; for neighbor in neighbors(cell): if neighbor not in visited: visited.add(neighbor); queue.append((neighbor, path + [neighbor]))`.

**Self-assessment close:**
> Score yourself on yesterday's mock: 1 (didn't work), 2 (worked but slow/bugs), 3 (BFS correct, no path reconstruction), 4 (BFS + path, missed edge cases), 5 (everything including edge cases, clean code). Log it.

**Tomorrow preview:**
> Tomorrow: Mini System Design. Design an in-memory rate limiter — one of the most common system design warm-ups. Token bucket vs sliding window: you'll pick one and defend it.

---

### Day 7 (Sun) — Mini System Design: In-Memory Rate Limiter

**Format:** Mini System Design | **Key skill:** Rate limiter trade-offs; algorithm selection

---

**OpenClaw opening:**
> **Mini System Design — In-Memory Rate Limiter**
>
> Design challenge: build an in-memory rate limiter for a web API. The API receives requests, and your rate limiter decides: allow this request or reject it.
>
> Requirements (intentionally minimal):
> - Multiple users, each with their own rate limit
> - The limit is: max N requests per T seconds
> - Thread-safe: multiple threads call your rate limiter concurrently
>
> **First question:** Before designing, what clarifying questions would you ask? List them.

**Target time:** 25 min total

**OpenClaw as product manager (answer clarifying questions):**
- "Is the limit the same for all users?" → "Yes, for now — same N and T for everyone."
- "What happens when a user hits the limit — hard reject or queue?" → "Hard reject. Return False immediately."
- "Do I need to persist this across server restarts?" → "No, in-memory only."
- "What's the scale — 100 users or 10 million?" → "Design for up to 100,000 users."
- "Is time tracking per-user or global?" → "Per-user."

**After clarifying questions (~5 min):**
> Good. Now: there are two main approaches to sliding-window rate limiting. Talk me through token bucket vs sliding window log. What are the trade-offs?

**Follow-up questions OpenClaw asks progressively:**
1. > You chose [algorithm]. Show me the data structure you'd use for each user. What exactly does each user's record look like?
2. > Walk me through `allow(user_id)` step by step. Exactly what happens on each call?
3. > How do you prevent memory leaks? If a user hasn't made a request in 24 hours, what happens to their record?
4. > You said it's thread-safe — how specifically? Global lock or per-user lock? What are the throughput implications of each?

**Key components a strong answer covers:**
- **Token bucket:** Each user has a token counter (max N) and last_refill_time. On each call: compute elapsed time, add tokens (at rate N/T), cap at N, decrement one token, return True. Or return False if no tokens. Pro: allows bursts up to N. Con: slightly complex refill math.
- **Sliding window log:** Each user has a deque of timestamps of their requests. On each call: remove timestamps older than T seconds (left side of deque), check if len < N, if so: append current timestamp, return True. Else False. Pro: exact sliding window, simple logic. Con: stores every timestamp (memory scales with request count).
- **Fixed window (simplest, worst):** Each user has count + window_start. Reset count when new window starts. Pro: O(1) memory per user. Con: allows 2x burst at window boundary.
- **Memory leak prevention:** Either a background cleanup task, or lazy cleanup on each `allow()` call (remove stale entries before checking).
- **Lock strategy:** Per-user lock (better throughput, users don't block each other) vs global lock (simpler, but all users block each other).

**What a weak answer looks like:**
- Jumps to a global lock immediately without discussing per-user locks
- Doesn't mention memory leak risk from stale user records
- Confuses sliding window with fixed window (doesn't know what happens at window boundary)
- Can't compare token bucket vs sliding window meaningfully

**Key insight to deliver:**
> **Key insight:** The fixed-window rate limiter has a notorious bug: if a user makes N requests at 11:59:59 and N more at 12:00:01, they've made 2N requests in 2 seconds — but the limiter allowed all 2N because each request was in a "valid" window. The sliding window log solves this but uses more memory. Token bucket is the practical middle ground: bounded memory, allows bursts, accurate limiting. Know all three, be able to explain why fixed window fails.

**Tomorrow preview:**
> Tomorrow: the web crawler asyncio pattern. `asyncio.gather()` — launching multiple coroutines concurrently in one line. This is the core of Coding Round 1.

---

## WEEK 6: asyncio.Semaphore + Sliding Window + Two-Pointer

**This week's arc:** `asyncio.gather` for concurrency → `asyncio.Semaphore` for rate limiting → sliding window algorithm → SQL with HAVING → thread-safe rate limiter mock → debug the most common asyncio mistake. Week 6 is where asyncio becomes automatic.

---

### Day 8 (Mon) — Code Kata: asyncio.gather for Concurrent Fetches

**Format:** Code Kata | **Key skill:** Concurrent vs sequential async; gather pattern

---

**OpenClaw opening:**
> **Day 8, Week 6 — Code Kata: asyncio.gather**
>
> Tuesday you built the asyncio mental model — one event loop, cooperative switching at `await` points. Today we use that to actually fetch concurrently.
>
> Setup: you have a stub `async def fetch(url: str) -> str` that simulates a 1-second network request. You need to fetch a list of URLs.
>
> Kata Part 1: implement `fetch_sequentially(urls: list[str]) -> list[str]`. Time it for 5 URLs.
>
> Kata Part 2: implement `fetch_concurrently(urls: list[str]) -> list[str]` using `asyncio.gather`. Time it for the same 5 URLs. The result order must match input URL order.
>
> Then answer: what's the theoretical speedup for N URLs? When does the speedup stop scaling?
>
> **Two sentences on approach, then code.**

**Target time:** 25 min total

**10-min check-in:**
> Part 1 done? Share it. Then move to Part 2.

**OpenClaw evaluation guide (internal):**
- **Strong Part 1:** `results = []; for url in urls: results.append(await fetch(url)); return results`. Time: N seconds for N URLs. This is correct but deliberately slow.
- **Strong Part 2:** `return await asyncio.gather(*[fetch(url) for url in urls])`. The `*` unpacking is essential — gather takes coroutines as positional args, not a list. Time: ~1 second regardless of N (all fetch concurrently).
- **Key guarantee:** `asyncio.gather()` preserves order — results list corresponds 1:1 to input coroutines, even if they finish out of order. This is why it's better than `asyncio.create_task` + collecting results manually.
- **Speedup answer:** Theoretical speedup is N× for N URLs (all 1-second fetches run simultaneously → ~1 second total). But: speedup stops scaling when the bottleneck becomes something other than network I/O latency (CPU parsing, memory, or the number of open sockets/file descriptors the OS allows).
- **Common bug:** `asyncio.gather([fetch(url) for url in urls])` — missing the `*`. This passes a list object as the first argument, which is wrong. Gather expects `gather(coro1, coro2, coro3)` not `gather([coro1, coro2, coro3])`.
- **Common confusion:** Thinking the `async def fetch()` function starts executing when called. It doesn't — calling `fetch(url)` returns a coroutine object without running anything. Execution starts when it's awaited or passed to gather/create_task.

**OpenClaw feedback approach:**
- If gather missing `*`: "You wrote `asyncio.gather([...])` — but gather takes coroutines as positional arguments, not a list. What's the Python syntax for unpacking a list into positional args?"
- If result order uncertain: "Does `asyncio.gather` guarantee results come back in the same order as the input coroutines? Yes — even if `fetch('url3')` finishes before `fetch('url1')`, result[0] is always the result of the first coroutine."
- If speedup reasoning is vague: "You said 'it's faster.' How much faster, exactly? What's the time for 1000 URLs with sequential vs gather?"
- If all correct: "Now: what if one of the fetches raises an exception? What does gather do by default? What if you want the others to still succeed?"

**Key insight to deliver:**
> **Key insight:** `asyncio.gather(*coroutines)` starts all coroutines simultaneously on the event loop and waits for all of them to complete. It's the "launch parallel jobs" primitive. The `*` is not optional — gather takes positional arguments, not a list. And it preserves result order regardless of completion order. Memorize this pattern: `results = await asyncio.gather(*[process(item) for item in items])`. You'll use it in the web crawler, the async queue, and everywhere else in async Python.

**Stretch question:**
> What does `asyncio.gather(..., return_exceptions=True)` do? When would you want that over the default behavior?

**Tomorrow preview:**
> Tomorrow: asyncio.Semaphore. What happens when you have 1000 URLs but only want 10 running at a time? That's the Semaphore — and it's the exact pattern in Coding Round 1 (web crawler rate limiting).

---

### Day 9 (Tue) — Code Kata: asyncio.Semaphore for Rate Limiting

**Format:** Code Kata | **Key skill:** Semaphore as concurrency limiter

---

**OpenClaw opening:**
> **Day 9, Week 6 — Code Kata: asyncio.Semaphore**
>
> Yesterday you fetched N URLs with gather — all of them concurrently. But what if you have 1000 URLs and you don't want to hammer the server with 1000 simultaneous requests? That's what a Semaphore is for: limit concurrency to at most K.
>
> Kata: implement `fetch_with_limit(urls: list[str], max_concurrent: int) -> list[str]` using `asyncio.Semaphore`. Use the same stub `async def fetch(url) -> str`.
>
> The pattern: create a Semaphore with the limit, then wrap each fetch call with `async with sem:`. Use gather to launch all of them.
>
> Then answer: where exactly does the Semaphore limit concurrency? Is it limiting how many coroutines gather starts, or how many actually run simultaneously?
>
> **Two sentences on approach, then code.**

**Target time:** 20 min total (shorter — the gather foundation is fresh)

**10-min check-in:**
> How's it going? Share what you have.

**OpenClaw evaluation guide (internal):**
- **Strong answer:**
  ```python
  async def fetch_with_limit(urls, max_concurrent):
      sem = asyncio.Semaphore(max_concurrent)

      async def bounded_fetch(url):
          async with sem:
              return await fetch(url)

      return await asyncio.gather(*[bounded_fetch(url) for url in urls])
  ```
- **Key insight to verify:** The Semaphore doesn't limit how many coroutines gather starts — it limits how many run simultaneously. All 1000 coroutines are "started" by gather, but only `max_concurrent` of them can be inside `async with sem` at a time. The rest wait at `await sem.acquire()`.
- **Common placement bug:** Putting the Semaphore acquisition OUTSIDE the inner function, like wrapping gather itself with `async with sem`. This would prevent any concurrency at all — only one fetch at a time.
- **Common bug:** Creating the semaphore inside the inner function (a new semaphore per call defeats the purpose).
- **Alternative pattern (also correct):** `asyncio.BoundedSemaphore` — raises if releases exceed acquires. Slightly safer. Good to mention.

**OpenClaw feedback approach:**
- If Semaphore created inside inner function: "You're creating a new Semaphore inside `bounded_fetch` — so every fetch call gets its own semaphore. Does that limit anything?"
- If Semaphore wraps gather instead of individual fetches: "If you do `async with sem: await asyncio.gather(...)` — how many fetches can run at once? Did you intend that?"
- If all correct: "Where exactly does the coroutine block — at `async with sem:` (which calls `await sem.acquire()`) or inside the `fetch` call? Does it matter?"
- If confused about gather still launching all: "Does gather wait until a slot is free before creating each coroutine? Or does it create all of them immediately and let them wait for the semaphore themselves?"

**Key insight to deliver:**
> **Key insight:** `asyncio.Semaphore(K)` allows at most K coroutines inside `async with sem:` at any time. The rest block at `async with sem:` until one exits (at which point the semaphore "releases" and one waiting coroutine can proceed). This is the exact pattern the web crawler needs: gather launches all coroutines for all URLs, but only K actually fetch pages simultaneously. Memorize this wrapper: `async def bounded(url): async with sem: return await fetch(url)`. You'll write this from memory in the Coding Round 1 mock.

**Stretch question:**
> What's the difference between `asyncio.Semaphore` and `threading.Semaphore`? Can you use `threading.Semaphore` in asyncio code? What happens if you try?

**Tomorrow preview:**
> Tomorrow: sliding window. A different domain — array algorithms — but the same pattern recognition mindset. When you see "subarray with X property," sliding window.

---

### Day 10 (Wed) — Code Kata: Sliding Window

**Format:** Code Kata | **Key skill:** Fixed vs variable sliding window

---

**OpenClaw opening:**
> **Day 10, Week 6 — Code Kata: Sliding Window**
>
> Sliding window is the pattern for subarray/substring problems with a contiguous constraint. Fixed-size window = straightforward. Variable-size window = expand right until invalid, shrink left until valid again.
>
> Kata Part 1 (fixed window): Given an integer array `nums` and integer `k`, return the maximum sum of any contiguous subarray of length exactly `k`. O(n) — no nested loops.
>
> Example: `nums = [2, 1, 5, 1, 3, 2], k = 3` → answer is `9` (subarray `[5,1,3]`).
>
> Kata Part 2 (variable window): Given a non-negative integer array `nums` and integer `target`, return the length of the shortest subarray whose sum is ≥ target. Return 0 if no such subarray exists.
>
> Example: `nums = [2, 3, 1, 2, 4, 3], target = 7` → answer is `2` (subarray `[4,3]`).
>
> **Two sentences on each, then code. Start with Part 1.**

**Target time:** 25 min total

**10-min check-in:**
> Part 1 done? Share it. Then Part 2.

**OpenClaw evaluation guide (internal):**
- **Strong Part 1:**
  1. Initialize window sum for first k elements.
  2. Slide: add `nums[i]`, subtract `nums[i-k]`, update max.
  3. O(n) — constant-time window updates.
  - Common mistake: recomputing the sum from scratch each step (O(n*k)).
- **Strong Part 2 (variable window — two-pointer style):**
  ```python
  left = 0
  current_sum = 0
  min_len = float('inf')
  for right in range(len(nums)):
      current_sum += nums[right]
      while current_sum >= target:
          min_len = min(min_len, right - left + 1)
          current_sum -= nums[left]
          left += 1
  return 0 if min_len == float('inf') else min_len
  ```
  O(n) — each element enters and exits the window at most once.
- **Common Part 2 bug:** Using a for loop for both left and right → O(n²).
- **Common Part 2 bug:** `right - left` instead of `right - left + 1` for length (off-by-one).
- **Key distinction:** Fixed window: slide rigidly, window size never changes. Variable window: right pointer always moves forward, left pointer moves forward only when window is invalid. Both are O(n).

**OpenClaw feedback approach:**
- If Part 1 recomputes sum from scratch: "You're calling `sum(nums[i:i+k])` inside the loop — that's O(k) per step, O(n*k) total. How do you update the sum in O(1) when the window slides?"
- If Part 2 uses nested for loops: "That works but it's O(n²). For sliding window, the right pointer should only ever move forward. How does the left pointer know when to move?"
- If off-by-one in Part 2 length: "Your answer for `[4,3]` is length... what? Count the elements. Is your formula `right - left` or `right - left + 1`?"
- If all correct: "Why does Part 2 work? Each element enters the window exactly once (when right passes it) and leaves at most once (when left passes it). What's the total number of operations?"

**Key insight to deliver:**
> **Key insight:** Sliding window is a two-pointer technique where the pointers define the window boundaries. Fixed window = both pointers move at the same rate. Variable window = right pointer always advances, left pointer advances when the window is invalid. The O(n) key: each element enters the window exactly once and exits at most once — total of 2n operations regardless of how many times the window shrinks. Pattern trigger: "contiguous subarray/substring" + "maximize/minimize length" + "sum/count constraint."

**Stretch question:**
> Can you solve this with sliding window: "Find the length of the longest substring with at most K distinct characters"? What's the window invariant?

**Tomorrow preview:**
> Tomorrow: SQL. HAVING clause — filtering on aggregated results. The query that answers "which services are broken?"

---

### Day 11 (Thu) — SQL Challenge: Error Rate by Service

**Format:** SQL Challenge | **Key skill:** HAVING with computed aggregates

---

**OpenClaw opening:**
> **Day 11, Week 6 — SQL Challenge: Error Rate**
>
> Schema:
>
> ```sql
> CREATE TABLE api_requests (
>   id          BIGINT PRIMARY KEY,
>   service     VARCHAR(100) NOT NULL,
>   status_code INT NOT NULL,
>   latency_ms  FLOAT,
>   created_at  TIMESTAMP NOT NULL
> );
> ```
>
> **The query:** Find all services where the HTTP 5xx error rate exceeds 5% this week. "Error" means status_code >= 500. Return: `service`, `total_requests`, `error_count`, `error_rate_pct` (as a percentage, e.g. 7.3 not 0.073). Only return services with error rate > 5%.
>
> Write the query. Then explain why you can't use a WHERE clause to filter the error rate.

**Target time:** 20 min total

**Hints (deliver one at a time if stuck after 5 min):**
1. You need to aggregate per service, but also filter on the aggregated result — that's a HAVING clause, not WHERE.
2. To count only errors: `COUNT(CASE WHEN status_code >= 500 THEN 1 END)` counts only rows where the CASE is non-NULL.
3. The error rate is `error_count / total * 100.0`. Use 100.0 not 100 to force float division.

**Complete solution:**
```sql
SELECT
    service,
    COUNT(*) AS total_requests,
    COUNT(CASE WHEN status_code >= 500 THEN 1 END) AS error_count,
    100.0 * COUNT(CASE WHEN status_code >= 500 THEN 1 END) / COUNT(*) AS error_rate_pct
FROM api_requests
WHERE created_at >= DATE_TRUNC('week', NOW())
GROUP BY service
HAVING 100.0 * COUNT(CASE WHEN status_code >= 500 THEN 1 END) / COUNT(*) > 5;
```

**Alternative using SUM with CASE:**
```sql
HAVING 100.0 * SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) / COUNT(*) > 5
```

**Teaching points:**
- **WHERE vs HAVING:** WHERE filters rows before aggregation. HAVING filters after aggregation. You can't write `WHERE error_rate > 5` because `error_rate` doesn't exist yet at WHERE evaluation time — it's an aggregate computed in SELECT.
- **Alias in HAVING:** Most databases (Postgres, MySQL) don't allow SELECT aliases in HAVING — you must repeat the expression. Some (BigQuery, SQL Server) allow it. Know the rule, repeat the expression to be safe.
- **`DATE_TRUNC('week', NOW())`:** Truncates to the start of the current week (Monday in Postgres). Alternative: `NOW() - INTERVAL '7 days'` for rolling 7 days. Know the difference.
- **Division trap:** `integer / integer` in SQL is integer division. `100 * 1 / 3 = 33` not `33.3`. Always cast to float: `100.0 * ...` or `CAST(count AS FLOAT)`.

**Stretch question:**
> How would you add a column showing the p50 latency only for the error requests? What if you wanted to compare p50 latency of errors vs p50 latency of successes side by side?

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round. You'll build a thread-safe sliding-window rate limiter under 30-minute pressure. This combines today's sliding window pattern with Phase 1's threading.Lock skills.

---

### Day 12 (Fri) — Mock Pressure Round: Thread-Safe Sliding Window Rate Limiter

**Format:** Mock Pressure Round | **Key skill:** Per-key locking under time pressure

---

**OpenClaw opening:**
> **Mock Pressure Round — 30 minutes. Timer starts now.**
>
> Build a thread-safe, per-user, sliding-window rate limiter.
>
> ```python
> class RateLimiter:
>     def __init__(self, max_requests: int, window_seconds: int):
>         ...
>
>     def allow(self, user_id: str) -> bool:
>         """Returns True if the request is allowed, False if rate limited."""
>         ...
> ```
>
> Requirements:
> - Each user has their own independent sliding window
> - Sliding window: a user can make at most `max_requests` requests in any rolling window of `window_seconds` seconds
> - Thread-safe: multiple threads may call `allow()` concurrently for different users AND for the same user
> - Memory-efficient: don't store request history forever
>
> Two sentences on approach. Then code. Clock is running.

**Target time:** 30 min hard stop

**At 15 min — OpenClaw throws an edge case:**
> Quick question while you're working: what happens if two threads call `allow('user123')` at the exact same millisecond? Walk me through your code — is there a race condition?

**At 25 min:**
> 5 minutes left. If memory cleanup isn't done, submit what you have and note it as a known gap.

**OpenClaw evaluation rubric:**
- **Pass:** Per-user data structure (dict of user_id → deque of timestamps OR lock), per-user lock (not global), correct sliding window logic (filter timestamps older than window_seconds, check len < max_requests before appending), old timestamp cleanup (deque + popleft while expired). Thread-safe with per-user granularity.
- **Conditional pass:** Global lock instead of per-user lock (works, but all users block each other — note this is a scalability issue), OR correct per-user logic with minor cleanup bug, OR missing old timestamp cleanup (memory leak but functionally correct short-term).
- **Fail:** No locking at all, or locking wrong (lock doesn't cover the read-modify-write cycle), or sliding window logic broken (always allows, or never allows, or uses fixed window instead of sliding).

**Strong solution structure:**
```python
import threading
import time
from collections import defaultdict, deque

class RateLimiter:
    def __init__(self, max_requests, window_seconds):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._user_locks = defaultdict(threading.Lock)
        self._user_requests = defaultdict(deque)  # user_id -> deque of timestamps

    def allow(self, user_id):
        with self._user_locks[user_id]:
            now = time.time()
            window_start = now - self.window_seconds
            requests = self._user_requests[user_id]
            # Clean up old timestamps
            while requests and requests[0] < window_start:
                requests.popleft()
            if len(requests) < self.max_requests:
                requests.append(now)
                return True
            return False
```

**OpenClaw debrief:**
> Time. Share what you have.
>
> Self-assessment: Pass / Conditional pass / Fail?
>
> Questions:
> - Global lock vs per-user lock — what's the throughput difference if you have 10,000 active users?
> - What memory leak exists if you never clean up stale user entries (users who haven't made a request in hours)?

**Key insight to deliver:**
> **Key insight:** Per-user locking is the scalable choice. With a global lock, user A's request blocks user B's request — every call serializes through one lock. With per-user locks, user A and user B proceed in parallel. The defaultdict(threading.Lock) pattern is the clean way to lazily create per-key locks. Note: the lock dict itself isn't protected from concurrent writes (two threads might both check `if user_id not in self._user_locks` simultaneously) — but defaultdict handles this gracefully in CPython due to the GIL. In production, you'd use a more careful initialization pattern.

**Tomorrow preview:**
> Tomorrow: Review & Reflect on today's rate limiter. We'll extract the locking pattern and compare it to Sunday's system design discussion.

---

### Day 13 (Sat) — Review & Reflect: Thread-Safe Rate Limiter

**Format:** Review & Reflect | **Key skill:** Per-key locking trade-off; memory leak prevention

---

**OpenClaw opening:**
> **Review & Reflect — yesterday's rate limiter**
>
> Before looking at yesterday's code, answer from memory.

**Retrieval questions (OpenClaw asks in sequence):**

1. > Draw the data structure your rate limiter used for each user. What type is it? What does it contain?

2. > Where was the lock in your implementation? Per-user or global? If you used global: can you explain the per-user version now? If you used per-user: can you explain when global would be preferable?

3. > Describe the sliding window logic in 3 sentences: how do you check if a request is allowed, and how do you clean up old timestamps?

4. > What's the memory leak this rate limiter has (aside from old timestamps within a user's deque)? Hint: what happens to users who stop making requests entirely?

**What to look for:**
- Data structure: dict of user_id → deque of timestamps (float timestamps from time.time())
- Lock: per-user lock from `defaultdict(threading.Lock)`. Global lock works but serializes all users.
- Sliding window logic: filter deque (pop from left while oldest timestamp < now - window_seconds), check len < max_requests, if yes: append current timestamp and return True. Else False.
- Second memory leak: inactive users accumulate in the dicts permanently. Fix: background cleanup task (scan for users with no requests in last N hours and delete their entry), or TTL-based eviction, or WeakValueDictionary pattern.

**Key pattern name:**
> **Pattern:** Lazy per-key locking with `defaultdict(threading.Lock)`. Used whenever you need per-key thread safety without knowing the keys in advance: rate limiters, per-user caches, per-connection state.

**Self-assessment close:**
> Compare yesterday's mock to Sunday's design conversation. Did your implementation match what you designed? What did you get right? What slipped?

**Tomorrow preview:**
> Tomorrow: Debug & Read. You'll read code that looks async but isn't actually concurrent. The most common asyncio mistake.

---

### Day 14 (Sun) — Debug & Read: Sequential asyncio Disguised as Concurrent

**Format:** Debug & Read | **Key skill:** Sequential awaits vs asyncio.gather; the most common asyncio mistake

---

**OpenClaw opening:**
> **Debug & Read — sequential asyncio**
>
> Read this code. What does it do, and how long does it take?

**Code to read:**
```python
import asyncio
import time

async def fetch(url: str) -> str:
    """Simulates a 1-second network request."""
    await asyncio.sleep(1)
    return f"fetched:{url}"

async def fetch_all(urls: list[str]) -> list[str]:
    results = []
    for url in urls:
        result = await fetch(url)
        results.append(result)
    return results

async def main():
    urls = ["http://a.com", "http://b.com", "http://c.com",
            "http://d.com", "http://e.com"]
    start = time.time()
    results = await fetch_all(urls)
    elapsed = time.time() - start
    print(f"Fetched {len(results)} URLs in {elapsed:.1f}s")

asyncio.run(main())
```

**Discovery questions (OpenClaw asks in sequence, waits for answer):**

1. > Before we run this: how long does this take? Make a prediction.

2. > Now the key question: is this actually concurrent? Does `fetch_all` run all fetches in parallel, or one at a time?

3. > The function is `async def`. The calls use `await`. But is `await` alone sufficient for concurrency?

4. > How would you fix `fetch_all` to actually be concurrent? Write the corrected version.

**The bug:**
`fetch_all` awaits each URL sequentially inside a `for` loop. `await fetch(url)` doesn't yield to the event loop until `fetch(url)` completes — it blocks the current coroutine until each fetch is done before starting the next. Total time: 5 seconds for 5 URLs.

The code **looks async** because it uses `async def` and `await`, but it doesn't use `asyncio.gather` or `asyncio.create_task` — so there's no actual concurrency.

**The fix:**
```python
async def fetch_all(urls: list[str]) -> list[str]:
    return await asyncio.gather(*[fetch(url) for url in urls])
```
Time: ~1 second for 5 URLs (all fetch simultaneously).

**What to look for in their answer:**
- They predict 5 seconds (correct), not 1 second (wrong)
- They identify the `for url in urls: await fetch(url)` pattern as the issue
- They know the fix is `asyncio.gather(*[fetch(url) for url in urls])`
- They explain WHY: `await` in a loop means "wait for this one to finish, then start the next" — gather is needed to launch multiple coroutines concurrently

**Key insight to deliver:**
> **Key insight:** `async def` and `await` don't automatically mean concurrent. They mean "this code CAN participate in cooperative multitasking." Actual concurrency requires either `asyncio.gather()` (run multiple coroutines simultaneously) or `asyncio.create_task()` (schedule a coroutine on the event loop without waiting for it). This is the #1 asyncio mistake in production code — developers think they're writing concurrent async code and aren't. Always ask: "Are my awaits inside a loop? If so, I need gather."

**Tomorrow preview:**
> Tomorrow: binary search. Not just on arrays — on answer spaces. The pattern that unlocks "find the minimum X such that condition(X) is true."

---

## WEEK 7: Binary Search Variants + Prefix Sums + Heapq

**This week's arc:** Binary search on values → binary search on answer space → prefix sums for range queries → SQL window functions → priority queue with heapq → Message Queue system design. Algorithmic intuition week.

---

### Day 15 (Mon) — Code Kata: Binary Search Variants

**Format:** Code Kata | **Key skill:** Binary search on values vs binary search on answer space

---

**OpenClaw opening:**
> **Day 15, Week 7 — Code Kata: Binary Search**
>
> Binary search has two very different applications. Standard: find a value in a sorted array. Advanced: find the minimum (or maximum) value in an answer space where you can check if a candidate answer works.
>
> Kata Part 1 (standard): Given a sorted integer array `nums` and a `target`, return the index where target is found. If not found, return -1. O(log n).
>
> Kata Part 2 (answer space): You have a sorted list of pile sizes `piles`. A worker can eat K bananas per hour. Eating from a pile stops when the pile is empty (a pile of 5 eaten at rate 3 takes 2 hours: ceil(5/3)). Given H total hours, find the minimum eating speed K such that the worker can finish all piles in H hours. (H >= len(piles) guaranteed.)
>
> Example: `piles = [3, 6, 7, 11], H = 8` → `K = 4` (at speed 4: ceil(3/4)=1, ceil(6/4)=2, ceil(7/4)=2, ceil(11/4)=3 hours, total=8).
>
> **Two sentences on each, then code. Start with Part 1.**

**Target time:** 25 min total

**10-min check-in:**
> Part 1 done? Share it. Move to Part 2.

**OpenClaw evaluation guide (internal):**
- **Strong Part 1:**
  ```python
  def binary_search(nums, target):
      lo, hi = 0, len(nums) - 1
      while lo <= hi:
          mid = lo + (hi - lo) // 2  # Avoid integer overflow
          if nums[mid] == target:
              return mid
          elif nums[mid] < target:
              lo = mid + 1
          else:
              hi = mid - 1
      return -1
  ```
  Note: `(lo + hi) // 2` can overflow in languages with fixed-size integers (not Python, but the habit matters).
- **Strong Part 2:**
  ```python
  import math
  def min_eating_speed(piles, H):
      def can_finish(k):
          return sum(math.ceil(p / k) for p in piles) <= H

      lo, hi = 1, max(piles)  # K must be at least 1, at most max pile
      while lo < hi:
          mid = lo + (hi - lo) // 2
          if can_finish(mid):
              hi = mid  # mid works, try smaller
          else:
              lo = mid + 1  # mid too slow, need bigger
      return lo
  ```
- **Answer space logic:** The answer space is `[1, max(piles)]`. We're looking for the minimum K where `can_finish(K)` is True. When we find a K that works, we try smaller (hi = mid). When it doesn't work, we need bigger (lo = mid + 1). This is "find the leftmost True" binary search.
- **Common bug:** Using `while lo < hi` vs `while lo <= hi` — the termination condition depends on whether you're doing "find exact value" (lo <= hi) or "find boundary" (lo < hi). For answer space, `lo < hi` is standard.
- **Common bug:** `lo + hi // 2` (operator precedence) instead of `(lo + hi) // 2`.
- **Common mistake:** Setting `hi = max(piles) + 1` (off by one) — the answer is AT MOST max(piles) (eating the largest pile in 1 hour).

**OpenClaw feedback approach:**
- If Part 2 uses linear search instead of binary search: "Your can_finish function is O(n). How would you use binary search on the answer space — the range of possible K values — instead of checking every K?"
- If binary search direction wrong (hi = mid + 1 when it works): "You found a K that works — does that mean you should search higher or lower? You want the MINIMUM K, so search lower."
- If termination condition off: "When `lo == hi`, what is your loop doing? Does it handle this correctly, or should the loop stop?"
- If all correct: "What's the time complexity? O(n log m) where n = number of piles and m = max pile size. Can you see why?"

**Key insight to deliver:**
> **Key insight:** Binary search on answer space is the advanced form. Instead of "find X in sorted array," it's "find the boundary between possible and impossible." The pattern: define an answer space `[lo, hi]`, define `can_do(mid)` → bool, binary search the boundary. When `can_do(mid)` is True and you want the minimum, set `hi = mid` (mid might be the answer, but maybe smaller works too). When False, set `lo = mid + 1` (mid definitely doesn't work). The answer is `lo` when the loop ends. Pattern trigger: "find minimum/maximum X such that condition holds."

**Stretch question:**
> Can you modify Part 2 to find the MAXIMUM eating speed K such that the worker takes MORE than H hours? (The opposite boundary.) What changes in the binary search?

**Tomorrow preview:**
> Tomorrow: prefix sums. Precomputation that turns O(n) range-sum queries into O(1). Also: the trick for counting subarrays with a specific sum.

---

### Day 16 (Tue) — Code Kata: Prefix Sums + Range Queries

**Format:** Code Kata | **Key skill:** Precomputation for O(1) range queries

---

**OpenClaw opening:**
> **Day 16, Week 7 — Code Kata: Prefix Sums**
>
> Prefix sums are a precomputation trick: spend O(n) upfront to answer range-sum queries in O(1). Essential when the same array is queried many times.
>
> Kata Part 1: Given an integer array `arr`, precompute a prefix sum array. Then implement `range_sum(l, r)` that returns the sum of `arr[l..r]` (inclusive, 0-indexed) in O(1). No recomputation allowed.
>
> Example: `arr = [3, -1, 2, 5, -4, 7]` → `range_sum(1, 4)` returns `(-1 + 2 + 5 + -4) = 2`.
>
> Kata Part 2: Given `arr` and a target `k`, count the number of contiguous subarrays whose sum equals exactly `k`. O(n) — not O(n²).
>
> Example: `arr = [1, 2, 3], k = 3` → answer is `2` (subarrays `[1,2]` and `[3]`).
>
> **Two sentences on Part 1, then code. I'll give you Part 2 when you're ready.**

**Target time:** 25 min total

**10-min check-in:**
> Part 1 done? Share it. Move to Part 2.

**OpenClaw evaluation guide (internal):**
- **Strong Part 1:**
  ```python
  class RangeSum:
      def __init__(self, arr):
          self.prefix = [0] * (len(arr) + 1)  # prefix[i] = sum(arr[:i])
          for i, val in enumerate(arr):
              self.prefix[i+1] = self.prefix[i] + val

      def range_sum(self, l, r):
          return self.prefix[r+1] - self.prefix[l]
  ```
  Formula: `sum(arr[l..r]) = prefix[r+1] - prefix[l]`. Off-by-one careful: prefix has length n+1, prefix[0]=0.
- **Strong Part 2 (prefix sum + hashmap):**
  ```python
  def count_subarrays(arr, k):
      count = 0
      current_sum = 0
      seen = {0: 1}  # prefix_sum -> count of times seen
      for val in arr:
          current_sum += val
          # We want count of times (current_sum - k) appeared as prefix
          count += seen.get(current_sum - k, 0)
          seen[current_sum] = seen.get(current_sum, 0) + 1
      return count
  ```
  Key insight: if `prefix[j] - prefix[i] == k`, then the subarray `arr[i..j-1]` has sum k. So for each j, count how many previous prefix sums equal `prefix[j] - k`.
- **Common Part 1 bug:** `prefix[r] - prefix[l]` (off by one — should be `prefix[r+1] - prefix[l]`).
- **Common Part 2 mistake:** Trying to use a nested loop (O(n²)). The hashmap approach avoids this.
- **Common Part 2 bug:** Not initializing `seen = {0: 1}`. The zero accounts for subarrays starting at index 0.

**OpenClaw feedback approach:**
- If range_sum formula wrong: "Check your formula: `arr = [3,-1,2,5,-4,7]`, what is `prefix` if prefix[i] = sum of first i elements? Then what's `sum(arr[1..4])`? Trace through."
- If Part 2 uses nested loop: "That's O(n²). The key insight: you want to count subarrays ending at position j with sum k. That's equivalent to counting how many positions i < j have `prefix[j] - prefix[i] == k`. How would a hashmap help you find those counts in O(1)?"
- If `seen = {}` (missing initial `{0: 1}`): "What about the subarray from index 0 to j? Your seen dict needs to account for prefix_sum 0 being 'seen once' before we start. Why?"
- If all correct: "Excellent. This pattern — prefix sum + hashmap for counting subarrays — appears surprisingly often. What's a similar problem it would solve: count subarrays with sum divisible by k?"

**Key insight to deliver:**
> **Key insight:** `prefix[j] - prefix[i] == k` means the subarray `arr[i..j-1]` has sum k. Rewritten: `prefix[i] == prefix[j] - k`. So for each index j, you need to count how many previous prefix sums equal `prefix[j] - k`. That's a hashmap lookup — O(1) per index, O(n) total. The initialization `seen = {0: 1}` handles subarrays starting at index 0 (where i=0, prefix[0]=0, so we've "seen" 0 once before starting).

**Stretch question:**
> Can you extend Part 1 to support a `range_update(l, r, delta)` operation that adds delta to all elements in the range? What data structure replaces the prefix sum array for this?

**Tomorrow preview:**
> Tomorrow: Spec Decomposition — designing a leaderboard system. The spec is intentionally vague about "fairness" for ties. Your job is to ask the right questions first.

---

### Day 17 (Wed) — Spec Decomposition: Leaderboard System

**Format:** Spec Decomposition | **Key skill:** Handle ambiguity in "fairness"; design before coding

---

**OpenClaw opening:**
> **Day 17, Week 7 — Spec Decomposition: Leaderboard**
>
> Here's the spec:
>
> *"Build a leaderboard for a game. Players accumulate points throughout a match. We need to show the top N players at any time. Scores can update frequently. Ties should be handled fairly."*
>
> **First: what questions do you have before you write a line of code? List every question you'd ask. Don't start designing yet.**

**Target time:** 25 min total

**OpenClaw as product manager (answer clarifying questions):**
- "What does 'fairly' mean for ties?" → "Great question — that's what I need you to decide and propose. Tell me two options and which you recommend."
- "How many players?" → "Up to 100,000 in a match."
- "How often do scores update?" → "Up to 100 updates per second per match."
- "How often is the leaderboard queried?" → "Every 5 seconds for display."
- "What is N?" → "Top 10."
- "Is the leaderboard real-time or ok with 1-second delay?" → "1-second lag is fine."
- "Do we need persistence?" → "No, in-memory per match. Match ends, data gone."
- "What's in the leaderboard entry?" → "player_id and rank. Optional: score."

**After clarifying questions (~8 min):**
> Good. You found that "fairly" is ambiguous. Give me two definitions of fair tie-breaking, then recommend one and say why.

**Expected options:**
- Same rank (dense ranking): tied players share a rank, no rank is skipped. e.g., two players at 100 points are both rank 1, next player is rank 2.
- First-to-score (time-based): among tied players, whoever reached that score first gets the better rank.
- Random (shuffle ties): randomly order tied players. Feels fair but non-deterministic.

**After recommending (~12 min):**
> Now: give me your 5-step implementation plan. Focus on data structure choices for (1) updating a score and (2) querying the top N. What's the complexity of each operation?

**OpenClaw review guide (what to look for in their plan):**
- Data structure discussion: sorted list (O(n) update, O(1) query), heap (O(log n) update, O(n) for top N), dict + sort-on-query (O(1) update, O(n log n) query — fine if query is rare), balanced BST / sortedcontainers.SortedList (O(log n) update, O(N) top-N query)
- Given 100 updates/sec and 1-second query lag: dict + sort-on-query (every 5 seconds) is reasonable. SortedList is cleaner if updates are frequent.
- Tie-breaking in data structure: if using sort, the sort key is `(-score, timestamp_of_score)` for first-to-score.
- Thread safety: if concurrent updates, need a lock around the update + query path (or use a queue and single-writer pattern).

**Common gaps to probe:**
- Not defining tie-breaking concretely — "you said 'fair' but didn't specify what the sort key is"
- Choosing heap without thinking about "update score" (heapq doesn't support efficient update — lazy deletion needed)
- Not considering the 1-second lag allowance — that changes the data structure choice significantly

**Key insight to deliver:**
> **Key insight:** "Fairly" is a product requirement disguised as a technical constraint. Never assume what it means — ask and then propose. The spec also hides a critical scale question: 100 updates/sec sounds like a lot, but with a 5-second query interval, you can batch. A dict + sort-on-query (O(n log n) every 5 seconds) might be simpler and good enough, while a SortedList (O(log n) per update) adds complexity you might not need. Always match complexity to the actual access pattern, not to the worst theoretical case.

**Tomorrow preview:**
> Tomorrow: SQL window functions. Running totals with SUM() OVER. The query that answers "how many total requests have we served since January 1st?"

---

### Day 18 (Thu) — SQL Challenge: Window Functions — Running Totals

**Format:** SQL Challenge | **Key skill:** Window functions: SUM() OVER with PARTITION BY and ORDER BY

---

**OpenClaw opening:**
> **Day 18, Week 7 — SQL Challenge: Running Totals with Window Functions**
>
> Schema:
>
> ```sql
> CREATE TABLE daily_requests (
>   service       VARCHAR(100) NOT NULL,
>   day           DATE NOT NULL,
>   request_count INT NOT NULL,
>   PRIMARY KEY (service, day)
> );
> ```
>
> **The query:** For each service, compute the running total of requests from the earliest available data up to each day. Return all rows with columns: `service`, `day`, `request_count`, `running_total`.
>
> Example input:
> ```
> service | day        | request_count
> --------+------------+--------------
> auth    | 2026-01-01 | 1000
> auth    | 2026-01-02 | 1200
> auth    | 2026-01-03 | 900
> api     | 2026-01-01 | 5000
> api     | 2026-01-02 | 4800
> ```
>
> Expected output:
> ```
> auth | 2026-01-01 | 1000 | 1000
> auth | 2026-01-02 | 1200 | 2200
> auth | 2026-01-03 |  900 | 3100
> api  | 2026-01-01 | 5000 | 5000
> api  | 2026-01-02 | 4800 | 9800
> ```
>
> Write the query. Then explain what each part of the window function does.

**Target time:** 20 min total

**Hints (deliver one at a time if stuck after 5 min):**
1. Window functions use the `OVER` clause. The form is: `AGGREGATE(col) OVER (PARTITION BY ... ORDER BY ...)`.
2. `PARTITION BY service` means the running total resets per service (like GROUP BY but without collapsing rows).
3. `ORDER BY day` inside the OVER clause defines the order in which rows are accumulated.

**Complete solution:**
```sql
SELECT
    service,
    day,
    request_count,
    SUM(request_count) OVER (
        PARTITION BY service
        ORDER BY day
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM daily_requests
ORDER BY service, day;
```

**Simpler version (ROWS clause is often the default for ORDER BY):**
```sql
SELECT
    service,
    day,
    request_count,
    SUM(request_count) OVER (PARTITION BY service ORDER BY day) AS running_total
FROM daily_requests
ORDER BY service, day;
```

**Teaching points:**
- **Window function anatomy:** `FUNCTION() OVER (PARTITION BY ... ORDER BY ... ROWS/RANGE BETWEEN ...)`. The partition is like GROUP BY but doesn't collapse rows. The ORDER BY defines the frame order. ROWS BETWEEN defines which rows are included in each calculation.
- **`UNBOUNDED PRECEDING AND CURRENT ROW`:** Include all rows from the start of the partition up to the current row. This is the default when you have an ORDER BY in the OVER clause (for most databases) — but being explicit is clearer.
- **Window functions vs GROUP BY:** GROUP BY produces one row per group. Window functions produce one row per original row, with an additional computed column. They don't collapse rows.
- **Common other window functions:** `ROW_NUMBER() OVER (ORDER BY score DESC)` for ranking, `LAG(col)` / `LEAD(col)` for accessing previous/next rows, `RANK()` / `DENSE_RANK()` for rank with ties.

**Stretch question:**
> How would you modify this to show the running total for only the last 7 days (rolling 7-day window instead of from the beginning)? What changes in the ROWS BETWEEN clause?

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round — priority queue with heapq. You'll implement a task scheduler under 30-minute pressure. The pattern is: tuple comparison in heapq.

---

### Day 19 (Fri) — Mock Pressure Round: Priority Task Scheduler

**Format:** Mock Pressure Round | **Key skill:** heapq under pressure; tuple comparison for priority

---

**OpenClaw opening:**
> **Mock Pressure Round — 30 minutes. Timer starts now.**
>
> Implement a priority task scheduler:
>
> ```python
> class TaskScheduler:
>     def add_task(self, task_id: str, priority: int, description: str) -> None:
>         """Adds a task. Lower priority number = higher priority (like a hospital triage)."""
>         ...
>
>     def get_next(self) -> dict:
>         """Removes and returns the highest-priority task as a dict with keys:
>         task_id, priority, description. Raises ValueError if empty."""
>         ...
>
>     def peek(self) -> dict:
>         """Returns (without removing) the highest-priority task. Raises ValueError if empty."""
>         ...
>
>     def is_empty(self) -> bool:
>         ...
> ```
>
> **Requirement:** Tasks with equal priority must be returned in FIFO order (the order they were added).
>
> Two sentences on approach. Then code. Clock is running.

**Target time:** 30 min hard stop

**At 15 min — OpenClaw throws an edge case:**
> Quick check: what if you add two tasks both with priority 1? Which one does `get_next()` return first? Walk me through your heap structure.

**OpenClaw evaluation rubric:**
- **Pass:** Uses `heapq` (min-heap), stores tuples `(priority, insertion_order, task_id, description)` with a counter for insertion order (ensures FIFO for equal priorities), all three methods correct, raises ValueError when empty.
- **Conditional pass:** Correct heapq usage but no FIFO tiebreaker (might sort by task_id string or other arbitrary secondary key instead of insertion order), OR get_next correct but peek returns wrong format.
- **Fail:** Uses a list and sort (O(n log n) per add instead of O(log n)), or uses max-heap accidentally (negates priority without explaining), or can't implement heapq API correctly.

**Strong solution structure:**
```python
import heapq

class TaskScheduler:
    def __init__(self):
        self._heap = []
        self._counter = 0  # Insertion order tiebreaker

    def add_task(self, task_id, priority, description):
        entry = (priority, self._counter, task_id, description)
        self._counter += 1
        heapq.heappush(self._heap, entry)

    def get_next(self):
        if not self._heap:
            raise ValueError("Scheduler is empty")
        priority, _, task_id, description = heapq.heappop(self._heap)
        return {"task_id": task_id, "priority": priority, "description": description}

    def peek(self):
        if not self._heap:
            raise ValueError("Scheduler is empty")
        priority, _, task_id, description = self._heap[0]
        return {"task_id": task_id, "priority": priority, "description": description}

    def is_empty(self):
        return len(self._heap) == 0
```

**OpenClaw debrief:**
> Time. Share what you have.
>
> Self-assessment: Pass / Conditional pass / Fail?
>
> Questions:
> - Why `(priority, counter, ...)` instead of just `(priority, task_id, ...)`? What breaks if task_id is a dict or non-comparable object?
> - What's the time complexity of add_task, get_next, and peek?
> - When would you use `queue.PriorityQueue` over raw heapq?

**Key insight to deliver:**
> **Key insight:** Python's `heapq` is a min-heap of tuples — it compares tuples element by element. `(1, 0, "task_a")` beats `(1, 1, "task_b")` because the counters break the tie in insertion order. The insertion counter is CRITICAL for equal-priority FIFO behavior — without it, Python will try to compare task_id strings (or crash if task_id is non-comparable). Always use a counter as the second tuple element when equal-priority order matters. `queue.PriorityQueue` wraps heapq with thread safety — use it when multiple threads enqueue/dequeue, use raw heapq in single-threaded or asyncio contexts.

**Tomorrow preview:**
> Tomorrow: Review & Reflect on the task scheduler. heapq tuple structure, stdlib selection, and the lazy deletion pattern for when priorities change.

---

### Day 20 (Sat) — Review & Reflect: Priority Queue with heapq

**Format:** Review & Reflect | **Key skill:** heapq tuple ordering; heapq vs PriorityQueue

---

**OpenClaw opening:**
> **Review & Reflect — yesterday's task scheduler**
>
> From memory, before looking at any code.

**Retrieval questions (OpenClaw asks in sequence):**

1. > Write out what your heap entries looked like. What was the tuple structure? Why that structure?

2. > Why did you need an insertion counter? What happens without it if two tasks have the same priority — specifically, what does Python do when comparing tuples and the first elements are equal?

3. > Python's `heapq` is a min-heap. If you wanted a max-heap (highest priority number = most important), what's the cleanest way to do it?

4. > `heapq` vs `queue.PriorityQueue` — give me one reason to use each.

**What to look for:**
- Tuple structure: `(priority, counter, task_id, description)` — priority first for sorting, counter second for FIFO tiebreaking, then the data
- Without counter: Python tries to compare the next tuple element (task_id). If task_ids are strings this might work but gives wrong ordering. If task_ids are dicts/custom objects without `__lt__`, it raises `TypeError`. The counter solves this cleanly.
- Max-heap: negate the priority value: `(-priority, counter, ...)`. This is the standard Python pattern since heapq only supports min-heap.
- heapq: faster, simpler, use in single-threaded or asyncio code. `queue.PriorityQueue`: thread-safe wrapper around heapq, use when multiple threads enqueue/dequeue.

**Key pattern name:**
> **Pattern:** Heap with tiebreaker counter. Tuple structure: `(sort_key, counter, *data)`. Used whenever you need a priority queue with stable ordering for equal priorities.

**Bonus: lazy deletion pattern (if time allows):**
> One more concept: what if you needed to support `update_priority(task_id, new_priority)`? heapq doesn't support this natively. The solution is "lazy deletion" — add a new entry with the updated priority and mark the old entry as invalid. On `get_next()`, skip invalid entries. Walk me through how you'd implement this.

**Tomorrow preview:**
> Tomorrow: Mini System Design — message queue. Producers push tasks, consumers pull them. The key concepts: ack/nack, dead letter queue, at-least-once delivery.

---

### Day 21 (Sun) — Mini System Design: Message Queue for Task Dispatch

**Format:** Mini System Design | **Key skill:** Message queue fundamentals: ack/nack, dead letter queue, at-least-once delivery

---

**OpenClaw opening:**
> **Mini System Design — Message Queue for Task Dispatch**
>
> Design a message queue for async task dispatch. Producers push tasks into the queue; consumers pull tasks, process them, and acknowledge success. The system must ensure tasks are processed at-least-once — a consumer crash should not cause a task to be lost.
>
> Start with clarifying questions.

**Target time:** 25 min total

**OpenClaw as product manager (answer clarifying questions):**
- "How many producers and consumers?" → "Multiple of each — N producers, M consumers."
- "What if a consumer crashes mid-processing?" → "The task must be re-queued and retried. That's the at-least-once guarantee."
- "What if a task fails permanently?" → "After 3 failures, it goes to a dead letter queue for manual inspection."
- "Do messages need to be ordered?" → "No strict ordering needed."
- "What's the message size?" → "Small — JSON payloads, a few KB each."
- "Is this distributed or single-machine?" → "Single machine first, then we'll discuss how it'd change distributed."

**After clarifying questions (~5 min):**
> Walk me through the ack/nack mechanism. What exactly happens between "consumer picks up a task" and "task is permanently removed from the queue"?

**Follow-up questions OpenClaw asks progressively:**

1. > What's an "in-flight" message? How long does it stay in-flight? What happens when the in-flight timer expires?
2. > A consumer successfully processes a task. It calls `ack()`. What happens in your queue's data structures?
3. > A consumer fails partway through. It calls `nack()` (or crashes without calling anything). What happens?
4. > After 3 failures, a task goes to the DLQ. How does the queue know it's the 3rd failure? Where is that count stored?
5. > If this were distributed (multiple queue nodes), what changes about the ack mechanism?

**Key components a strong answer covers:**
- **In-flight tracking:** When a consumer picks up a task, move it from "ready" state to "in-flight" state. Associate a timestamp and consumer ID. The task stays in-flight until ack (delete it) or timeout (return to ready state).
- **Ack:** Permanently delete from the queue. Task is done.
- **Nack / timeout:** Return task to ready queue. Increment failure count.
- **DLQ:** Separate queue for tasks that failed N times. Consumer or human inspects and retries manually.
- **Failure count:** Stored per message in the queue's metadata. Persists across retries.
- **In-flight timeout:** Heartbeat or TTL per message. If consumer doesn't ack within T seconds, assume crash and return to ready.

**What a weak answer looks like:**
- Doesn't know what "at-least-once" means vs "exactly-once"
- Treats the queue as simple FIFO with no state tracking — doesn't account for consumer crashes
- Can't explain what happens between `get_task()` and `ack_task()`
- Never mentions in-flight state

**Key insight to deliver:**
> **Key insight:** The key challenge in "at-least-once" delivery is the gap between "consumer received the task" and "consumer acknowledged success." During this gap, the queue must keep the task reserved (in-flight) so no other consumer picks it up, but not delete it (in case the consumer crashes). The in-flight timeout is the failsafe: if no ack arrives within T seconds, assume the consumer died and return the task to the ready queue. This is why "at-least-once" is achievable but "exactly-once" is hard — you can always re-deliver, but you can't always know whether the original delivery was processed.

**Tomorrow preview:**
> Tomorrow: advanced heapq — lazy deletion for mutable priorities. The pattern when you need to update a priority after adding to the heap.

---

## WEEK 8: heapq Advanced + asyncio.Queue + Mock Intensification

**This week's arc:** Lazy deletion in heapq → asyncio.Queue producer-consumer → config diff spec decomposition → p95 latency SQL → async web crawler mock (the Round 1 warm-up) → dedup/normalization review → topological sort debug. Week 8 is the Phase 2 climax — the Friday mock is the Phase 2 exit benchmark.

---

### Day 22 (Mon) — Code Kata: Lazy Deletion in heapq

**Format:** Code Kata | **Key skill:** Lazy deletion pattern for mutable priorities

---

**OpenClaw opening:**
> **Day 22, Week 8 — Code Kata: Mutable Priority Queue**
>
> Standard heapq doesn't support `update_priority(item, new_priority)` efficiently. If you need to change priorities after adding items, the clean solution is lazy deletion.
>
> Kata: implement a `MutablePriorityQueue` with:
> - `push(item, priority)` — adds item with given priority
> - `pop()` → `(item, priority)` — removes and returns the lowest-priority item
> - `update_priority(item, new_priority)` — changes the priority of an existing item
>
> Constraint: `pop()` must return the item with the current lowest priority, even if that item's priority was recently updated.
>
> **Two sentences on your approach (hint: lazy deletion), then code.**

**Target time:** 25 min total

**10-min check-in:**
> Share what you have. How are you tracking which entries are "stale"?

**OpenClaw evaluation guide (internal):**
- **Strong answer:**
  ```python
  import heapq

  class MutablePriorityQueue:
      def __init__(self):
          self._heap = []
          self._entry_map = {}  # item -> [priority, counter, item] (the heap entry)
          self._counter = 0
          self._REMOVED = object()  # Sentinel for invalid entries

      def push(self, item, priority):
          if item in self._entry_map:
              # Invalidate old entry
              self._entry_map[item][-1] = self._REMOVED
          entry = [priority, self._counter, item]
          self._counter += 1
          self._entry_map[item] = entry
          heapq.heappush(self._heap, entry)

      def pop(self):
          while self._heap:
              priority, _, item = heapq.heappop(self._heap)
              if item is not self._REMOVED:
                  del self._entry_map[item]
                  return item, priority
          raise KeyError("pop from empty queue")

      def update_priority(self, item, new_priority):
          if item not in self._entry_map:
              raise KeyError(f"Item {item} not in queue")
          self.push(item, new_priority)  # push handles invalidation
  ```
- **Key mechanism:** The `_entry_map` maps each item to its current heap entry (a list). When updating, we mutate the existing list by setting `entry[-1] = self._REMOVED`. Since the heap holds a reference to the same list object, popping that entry will find the sentinel and skip it. This works because Python's heapq heap contains references to the same list objects (not copies).
- **Common bug:** Using tuples instead of lists for heap entries. Tuples are immutable — you can't do `entry[-1] = self._REMOVED`. Must use lists.
- **Common bug:** Not deleting from `_entry_map` when popping successfully (memory leak).
- **Common confusion:** Why not just remove the old entry from the heap? That would require finding it (O(n)) and then re-heapifying (O(n)). Lazy deletion avoids this — O(log n) push, O(log n) pop amortized.

**OpenClaw feedback approach:**
- If using tuples: "You're using tuples in your heap — but you need to mark an old entry as invalid by mutating it. Can you mutate a tuple? What would you use instead?"
- If not using sentinel: "How does pop() know an entry is stale? It needs to distinguish 'this is the current entry for item X' from 'this is an old entry for item X that was superseded.' What marker would you use?"
- If not using `_entry_map`: "When `update_priority` is called, how do you find the old heap entry to invalidate it? Without a map, you'd have to scan the whole heap."
- If all correct: "What's the amortized time complexity of `pop()` if you've done many `update_priority` calls? Hint: each push adds one stale entry, and each pop removes one — real or stale."

**Key insight to deliver:**
> **Key insight:** Lazy deletion is the practical solution to "I need to change a priority in a heap." Instead of trying to find and remove the old entry (O(n) to find, O(n) to heapify), you mark it as invalid and add a new entry. Stale entries accumulate but get cleaned up naturally by `pop()`. The _entry_map is the bridge: it lets you find and invalidate an item's old heap entry in O(1). Lists (not tuples) are required because you need to mutate the entry in-place. This pattern appears in Dijkstra's algorithm and any scheduler that supports priority changes.

**Stretch question:**
> What's the worst-case space cost of lazy deletion? If you push the same item N times without popping, how many entries are in the heap? Is this a problem in practice?

**Tomorrow preview:**
> Tomorrow: asyncio.Queue producer-consumer. The async version of the threading.Condition pattern from Phase 1.

---

### Day 23 (Tue) — Code Kata: asyncio.Queue Producer-Consumer

**Format:** Code Kata | **Key skill:** Async producer-consumer; backpressure via maxsize; q.task_done()

---

**OpenClaw opening:**
> **Day 23, Week 8 — Code Kata: asyncio.Queue**
>
> In Phase 1, you built producer-consumer with `threading.Condition`. Today: the asyncio equivalent with `asyncio.Queue`. Same pattern, no locks needed — the event loop handles synchronization.
>
> Kata: implement an async producer-consumer system:
>
> - Producer: generates 10 items (numbered 0–9), puts each into the queue with a small delay (`asyncio.sleep(0.1)`)
> - Consumer: there are 3 consumer coroutines, each pulls from the queue and "processes" items (simulate with `asyncio.sleep(0.05)`)
> - The queue has a maximum capacity of 5 items (producer blocks when full)
> - Main: run producer + 3 consumers concurrently, wait until ALL items are processed
>
> Key methods to use: `await q.put(item)`, `await q.get()`, `q.task_done()`, `await q.join()`.
>
> **Two sentences on approach, then code.**

**Target time:** 25 min total

**10-min check-in:**
> Share what you have. Key question: where does `q.task_done()` go and why?

**OpenClaw evaluation guide (internal):**
- **Strong answer:**
  ```python
  import asyncio

  async def producer(q):
      for i in range(10):
          await asyncio.sleep(0.1)
          await q.put(i)
          print(f"Produced: {i}")

  async def consumer(q, consumer_id):
      while True:
          item = await q.get()
          await asyncio.sleep(0.05)  # Process
          print(f"Consumer {consumer_id} processed: {item}")
          q.task_done()

  async def main():
      q = asyncio.Queue(maxsize=5)
      # Create consumers as tasks so they run concurrently
      consumers = [asyncio.create_task(consumer(q, i)) for i in range(3)]
      # Run producer (it will eventually finish)
      await producer(q)
      # Wait until all items are processed
      await q.join()
      # Cancel consumer tasks (they loop forever)
      for c in consumers:
          c.cancel()

  asyncio.run(main())
  ```
- **`q.task_done()` placement:** Must be called AFTER the item is fully processed, not immediately after `q.get()`. `q.join()` waits until the count of `task_done()` calls equals the total number of items that have been put into the queue.
- **`asyncio.create_task` vs `await`:** Consumers must be created with `create_task` (or gathered), not awaited directly — otherwise main() waits for consumer 0 to finish before starting consumer 1.
- **Consumer cancellation:** Consumers loop forever (`while True`) waiting for items. After `q.join()`, you must cancel them or the program hangs.
- **Backpressure:** `asyncio.Queue(maxsize=5)` blocks the producer at `await q.put()` when the queue is full — natural backpressure. Producer automatically slows down to match consumer throughput.
- **Common bug:** Calling `q.task_done()` before processing is complete (or not at all). `q.join()` would complete prematurely or never complete.
- **Common bug:** Not using `asyncio.create_task` for consumers — starting them with `await` makes them sequential.

**OpenClaw feedback approach:**
- If consumers started with `await` instead of `create_task`: "You're awaiting consumer 0 before starting consumer 1. Are all three consumers running concurrently? What does `asyncio.create_task` do differently from `await`?"
- If `task_done()` in wrong place: "Where does `task_done()` go relative to processing? If you call it before `asyncio.sleep(0.05)`, what does `q.join()` think has happened?"
- If no consumer cancellation: "Your consumers loop forever with `while True`. After `q.join()`, are they still running? How do you stop them?"
- If all correct: "What's the difference between `asyncio.Queue.join()` and `asyncio.gather`-waiting on all consumers? Which is cleaner here?"

**Key insight to deliver:**
> **Key insight:** `asyncio.Queue` is the asyncio producer-consumer primitive. No locks — the event loop ensures only one coroutine runs at a time, so queue operations are naturally safe. The `task_done()/join()` protocol is the completion signal: put N items, call `task_done()` N times, `join()` waits for the count to balance. The maxsize creates backpressure: a full queue blocks the producer, naturally pacing production to match consumption. This is the pattern for processing pipelines in async code (the web crawler uses it implicitly when you limit concurrency with Semaphore).

**Stretch question:**
> How would you modify this so consumers can signal they've had an error (and the item should be retried)? What queue operation would you use?

**Tomorrow preview:**
> Tomorrow: Spec Decomposition — diffing two config files. The spec is about "meaningful changes" — you need to define what meaningful means before you can build anything.

---

### Day 24 (Wed) — Spec Decomposition: Config File Diff Tool

**Format:** Spec Decomposition | **Key skill:** Domain-specific equality definition; recursive comparison

---

**OpenClaw opening:**
> **Day 24, Week 8 — Spec Decomposition: Config Diff Tool**
>
> Here's the spec:
>
> *"Build a tool that takes two versions of a YAML configuration file and shows what meaningfully changed between them. We're not interested in formatting or comments — only actual configuration values."*
>
> **What questions do you have before you start? List every ambiguity in this spec.**

**Target time:** 25 min total

**OpenClaw as product manager (answer clarifying questions):**
- "What counts as 'meaningful'?" → "You tell me — propose a definition. Think about: changed values, added keys, removed keys. What about type changes (string '5' vs integer 5)? You decide and defend it."
- "How deeply nested can configs be?" → "Arbitrarily nested. Could be 5+ levels deep."
- "What if a key is renamed?" → "Treat as remove + add. Too complex to detect renames automatically."
- "What format is the output?" → "Structured — whatever makes sense for a caller. Propose one."
- "Do we need to handle YAML lists?" → "Yes, simple lists. A changed list (any element changed) = a changed value."
- "What's the interface — function, CLI, class?" → "A function: `diff_configs(old: dict, new: dict) -> dict`."
- "What's in the return dict?" → "Your choice — propose one."

**After clarifying questions (~8 min), push for definition:**
> Before planning, you need to decide: what is `meaningful_change`? A string '5' vs integer 5 — is that meaningful? An empty list vs None? Propose your definition and I'll agree with it.

**Expected approach — recommend:**
- Type-strict equality: `'5' != 5` (a type change is always meaningful in a config)
- List comparison: element-by-element, same type, same values in same order = equal
- Nested dict: recurse — if any nested key changed, the parent path shows a change
- Comments/whitespace: handled by YAML parser (both files parse to dicts — no comment access)

**After definition (~12 min):**
> Give me a 5-step implementation plan. Focus on the recursive comparison structure.

**OpenClaw review guide (what to look for):**
- **Step 1:** Parse YAML to dict — the YAML library handles comments, whitespace, formatting (not our problem)
- **Step 2:** Write `compare(old, new, path='')` — recursive function that returns a list of changes
- **Step 3:** For each key in union of both dicts:
  - Key in old only → REMOVED
  - Key in new only → ADDED
  - Key in both, value changed → check type: if both dicts → recurse. If not → CHANGED.
  - Key in both, value same → skip
- **Step 4:** Return structure — something like `[{"type": "added"|"removed"|"changed", "path": "db.password", "old": ..., "new": ...}]`
- **Step 5:** Sort output by path for consistent ordering

**Common gaps to probe:**
- Not handling the case where a key exists in both but changes from a dict to a scalar (or vice versa) — type change is not just about terminal values
- Not building the path string correctly for nested keys (should be "database.password" not just "password")
- Proposing to return a flat dict of path→value instead of typed change events (less expressive)

**Key insight to deliver:**
> **Key insight:** Before you can diff two things, you need a definition of equality. "Meaningful change" is product logic, not technical logic. Getting that definition wrong means your tool produces false positives (flags non-changes) or false negatives (misses real changes). The recursive structure is the implementation — but the contract for what counts as "same" or "different" is the design. Always establish the definition before coding. This is exactly what Anthropic interviews test: can you extract the implicit assumptions from a vague spec?

**Tomorrow preview:**
> Tomorrow: SQL — percentile window functions. p95 latency: the query that separates good-enough monitoring from real SRE work.

---

### Day 25 (Thu) — SQL Challenge: p95 Latency with Window Functions

**Format:** SQL Challenge | **Key skill:** PERCENTILE_CONT / PERCENTILE_DISC; the p95 pattern

---

**OpenClaw opening:**
> **Day 25, Week 8 — SQL Challenge: p95 Latency**
>
> Schema:
>
> ```sql
> CREATE TABLE request_logs (
>   id          BIGINT PRIMARY KEY,
>   service     VARCHAR(100) NOT NULL,
>   tier        VARCHAR(50) NOT NULL,  -- 'free', 'pro', 'enterprise'
>   latency_ms  FLOAT NOT NULL,
>   created_at  TIMESTAMP NOT NULL
> );
> ```
>
> **The query:** For each `service` + `tier` combination, compute the p50 and p95 latency for requests in the last 24 hours. Return: `service`, `tier`, `p50_ms`, `p95_ms`, `sample_count`. Only include combinations with at least 100 samples.
>
> Explain the difference between `PERCENTILE_CONT` and `PERCENTILE_DISC` and say which you'd choose here.

**Target time:** 20 min total

**Hints (deliver one at a time if stuck after 5 min):**
1. Percentile functions in SQL use `PERCENTILE_CONT(fraction) WITHIN GROUP (ORDER BY col)` — this is an "ordered set aggregate," not a window function. It goes inside GROUP BY queries, not OVER.
2. For p95: fraction = 0.95. For p50 (median): fraction = 0.5.
3. `HAVING COUNT(*) >= 100` filters groups with insufficient data.

**Complete solution:**
```sql
SELECT
    service,
    tier,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_ms,
    COUNT(*) AS sample_count
FROM request_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY service, tier
HAVING COUNT(*) >= 100
ORDER BY service, tier;
```

**Teaching points:**
- **PERCENTILE_CONT vs PERCENTILE_DISC:**
  - `PERCENTILE_CONT(0.95)`: continuous interpolation — if the 95th percentile falls between two data points, it interpolates. e.g., `[1, 2, 3, 4, 5]` at 0.95 → interpolates between 4 and 5 = 4.8.
  - `PERCENTILE_DISC(0.95)`: discrete — returns the actual data point at or above the 95th percentile. e.g., same array → returns 5 (first actual value at/above 95%).
  - **For latency SLOs:** `PERCENTILE_DISC` is usually preferred — it returns an actual observed latency, not a hypothetical interpolated value. SLOs care about "what did real requests experience?"
- **This is an ordered-set aggregate, not a window function:** No `OVER` clause. It collapses rows like GROUP BY, computing a percentile per group.
- **Why p95 matters:** p50 (median) is the "typical" experience. p95 is the "tail" — 95% of users are faster than this, 5% are not. p99 is even worse tail. Monitor p50 for typical performance, p95/p99 for SLO compliance.
- **`HAVING COUNT(*) >= 100`:** Percentile calculations on < 100 samples are often too noisy to be meaningful. This is good defensive practice.

**Stretch question:**
> How would you compare each service's p95 latency to its SLA target, where SLA targets are stored in a separate table `service_slas (service, tier, sla_ms)`? What join or subquery would you use?

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round — async web crawler. BFS + visited set + asyncio.Semaphore. This is the Phase 2 exit benchmark. The exact pattern from Coding Round 1.

---

### Day 26 (Fri) — Mock Pressure Round: Async Web Crawler

**Format:** Mock Pressure Round | **Key skill:** BFS + dedup + asyncio.Semaphore in a real problem

---

**OpenClaw opening:**
> **Mock Pressure Round — 30 minutes. Timer starts now.**
>
> Build an async web crawler. Here's the interface:
>
> ```python
> async def fetch_links(url: str) -> list[str]:
>     """Stub: fetches a page and returns all link URLs found on it.
>     Simulates a 0.5-second network request."""
>     await asyncio.sleep(0.5)
>     # In your tests, define what each URL returns as links
>     ...
>
> async def crawl(seed_url: str, max_depth: int, max_concurrent: int) -> set[str]:
>     """Crawl starting from seed_url up to max_depth levels deep.
>     Never visit the same URL twice.
>     At most max_concurrent requests running simultaneously.
>     Returns the set of all discovered URLs (including seed)."""
>     ...
> ```
>
> Requirements:
> - BFS traversal (level by level — depth 0 = seed, depth 1 = seed's links, etc.)
> - No URL visited twice
> - Concurrency limited to `max_concurrent` simultaneous requests
> - Return all URLs discovered (not just ones at max depth)
>
> Two sentences on approach. Then code. Clock is running.

**Target time:** 30 min hard stop

**At 15 min — OpenClaw throws an edge case:**
> Quick question: what if `fetch_links` returns a URL that's already in your visited set? Does your BFS add it to the next level's queue or skip it? Trace through your code right now.

**At 25 min:**
> 5 minutes left. If you have BFS + dedup working but semaphore isn't integrated, submit what you have and note it. Partial working > non-working full.

**OpenClaw evaluation rubric:**
- **Pass:** BFS with deque, visited set (mark URL before crawling to avoid re-queuing), asyncio.Semaphore wrapping `fetch_links` calls (using `asyncio.gather` with semaphore-bounded coroutines), correct depth tracking, returns all discovered URLs.
- **Conditional pass:** BFS + dedup correct, but semaphore missing or incorrectly placed (e.g., limiting all of gather instead of individual fetches). OR: DFS instead of BFS (still correct in some sense, but misses "up to max_depth" semantics cleanly). OR: asyncio.Semaphore used but visited set race (should be fine in asyncio due to single-threaded event loop, but must verify).
- **Fail:** Not using asyncio at all, or BFS not implemented (just iterating links), or dedup missing (infinite loop risk on circular links).

**Strong solution structure:**
```python
import asyncio
from collections import deque

async def crawl(seed_url, max_depth, max_concurrent):
    visited = {seed_url}
    sem = asyncio.Semaphore(max_concurrent)
    queue = deque([(seed_url, 0)])  # (url, depth)

    async def bounded_fetch(url):
        async with sem:
            return await fetch_links(url)

    while queue:
        # Process all URLs at current depth level together
        current_level = []
        current_depth = queue[0][1]  # peek at depth
        while queue and queue[0][1] == current_depth:
            url, depth = queue.popleft()
            current_level.append((url, depth))

        if current_depth >= max_depth:
            break

        # Fetch all current level URLs concurrently
        link_lists = await asyncio.gather(
            *[bounded_fetch(url) for url, _ in current_level]
        )

        for links in link_lists:
            for link in links:
                if link not in visited:
                    visited.add(link)
                    queue.append((link, current_depth + 1))

    return visited
```

**OpenClaw debrief:**
> Time. Share what you have.
>
> Self-assessment: Pass / Conditional pass / Fail?
>
> Questions:
> - Where in your code did the Semaphore go? Inside the gather, around individual fetches, or around the whole gather?
> - Is your visited set safe to read/write from multiple coroutines? (In asyncio: yes, because the event loop is single-threaded — no true concurrency on set mutations. In threading: no — you'd need a lock.)
> - How would you add URL normalization before dedup? e.g., "http://example.com" and "http://example.com/" are the same page.

**Key insight to deliver:**
> **Key insight:** This is a condensed version of Coding Round 1. BFS for level-by-level crawling (depth control is natural with BFS), visited set for dedup (mark BEFORE crawling to prevent re-queuing), asyncio.Semaphore inside `bounded_fetch` (limits concurrent requests, not gather launches). The asyncio.Semaphore must wrap the individual fetch, not the whole gather — otherwise you'd process one URL at a time. In asyncio, single-threaded execution means the visited set doesn't need a lock (unlike threading). This is a key async advantage: many shared-state safety issues don't exist.

**Tomorrow preview:**
> Tomorrow: Review & Reflect on the crawler. URL normalization, Semaphore placement, and the dedup safety question.

---

### Day 27 (Sat) — Review & Reflect: Async Web Crawler

**Format:** Review & Reflect | **Key skill:** URL normalization; Semaphore placement; asyncio single-thread safety

---

**OpenClaw opening:**
> **Review & Reflect — yesterday's async crawler**
>
> This was the Phase 2 exit assessment. Let's consolidate everything it tested.

**Retrieval questions (OpenClaw asks in sequence):**

1. > Without looking: write the core BFS loop skeleton. Include: the queue, the visited set, the depth tracking, the gather call. Just the structure, not every line.

2. > The Semaphore: where did you put it relative to the gather call? Explain why it needs to be inside the per-URL coroutine, not around the whole gather.

3. > In asyncio: is the visited set safe to access from multiple coroutines without a lock? Why or why not? Would the answer be different if you used threading instead of asyncio?

4. > URL normalization: give me two examples of URLs that should be treated as the same URL during dedup, but that string comparison would treat as different.

**What to look for:**
- BFS loop: `queue = deque([(seed, 0)]); visited = {seed}; while queue: url, depth = queue.popleft(); links = await fetch(url); for link in links: if link not in visited: visited.add(link); queue.append((link, depth+1))`
- Semaphore placement: must be inside per-URL coroutine (`async with sem: await fetch(url)`). If around whole gather, only one gather "slot" at a time — completely defeats concurrency.
- asyncio thread safety: single event loop = single thread = no true interleaving. Between two `await` points, no other coroutine runs. Visited set mutations (`.add`, `in`) are effectively atomic. In threading: multiple threads truly run simultaneously → need a lock.
- URL normalization examples: `http://example.com` vs `http://example.com/` (trailing slash), `HTTP://Example.com` vs `http://example.com` (scheme/hostname case insensitivity), `http://example.com?a=1&b=2` vs `http://example.com?b=2&a=1` (query param order)

**Key pattern name:**
> **Pattern:** Async BFS crawler with Semaphore rate limiting. Template: `sem = Semaphore(K); async def bounded(url): async with sem: return await fetch(url); results = await gather(*[bounded(url) for url in batch]); update visited and queue from results`.

**Phase 2 exit reflection:**
> Look back at your last 4 Friday mocks. What verdict did you give each? Is there a pattern — same type of error across mocks? Name it.

**Tomorrow preview:**
> Tomorrow: Debug & Read. A topological sort with a silent cycle bug. If you don't catch it in the code review, it ships as a silent correctness error.

---

### Day 28 (Sun) — Debug & Read: Silent Cycle Bug in Topological Sort

**Format:** Debug & Read | **Key skill:** Cycle detection: verify no remaining non-zero in-degree nodes

---

**OpenClaw opening:**
> **Debug & Read — silent topological sort bug**
>
> Read this code carefully. What does it do?

**Code to read:**
```python
from collections import deque

def topological_sort(graph: dict) -> list:
    """
    Perform topological sort on a directed graph.

    Args:
        graph: dict mapping node -> list of neighbor nodes
               (edges represent "this node must come before those nodes")

    Returns:
        List of nodes in valid topological order.
    """
    # Compute in-degree for each node
    in_degree = {node: 0 for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            if neighbor in in_degree:
                in_degree[neighbor] += 1
            else:
                in_degree[neighbor] = 1

    # Start with all nodes that have no prerequisites
    queue = deque(node for node, deg in in_degree.items() if deg == 0)
    result = []

    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return result  # ← What's wrong here?
```

**Discovery questions (OpenClaw asks in sequence, waits for answer):**

1. > Walk me through this code with a simple example: `graph = {'A': ['B'], 'B': ['C'], 'C': []}`. What does `topological_sort` return? Is that correct?

2. > Now try this input: `graph = {'A': ['B'], 'B': ['C'], 'C': ['A']}` (a cycle). Trace through the code. What does it return?

3. > Is that return value correct for a cyclic graph? What should the function do instead?

4. > What is the minimum change needed to fix this bug?

**The bug:**
On a cyclic graph (`A → B → C → A`), the function returns an incomplete list (e.g., `[]` or a partial result) without raising an error. The nodes in the cycle never reach in-degree 0 — they're stuck waiting on each other — so they're never added to the queue or result. The function silently returns a partial ordering, and the caller has no way to know the graph had a cycle.

**Trace through cyclic example:**
- in_degree: `{'A': 1, 'B': 1, 'C': 1}` (every node has one incoming edge)
- Initial queue: empty (no node has in_degree 0)
- While loop: immediately exits (queue empty)
- Returns `[]` — no error raised!

**The fix:**
```python
    if len(result) != len(in_degree):
        raise ValueError(f"Graph has a cycle. Processed {len(result)} of {len(in_degree)} nodes.")
    return result
```

Add this after the while loop, before the return statement. If not all nodes were processed, some are stuck in a cycle.

**What to look for in their answer:**
- They correctly trace the cyclic example and find that queue starts empty → loop never runs → returns `[]`
- They identify this as a silent failure (wrong, but no exception raised)
- They know the fix: `if len(result) != len(graph): raise ValueError`
- Bonus: they note that the correct node count to check is `len(in_degree)` (which includes all nodes, even those not in graph.keys()) — or `len(graph)` if the graph dict contains all nodes as keys

**Key insight to deliver:**
> **Key insight:** Kahn's algorithm has a built-in cycle detector hiding in plain sight: if you process fewer nodes than the total, some nodes are stuck in a cycle. Nodes in a cycle never reach in-degree 0 — they're all waiting on each other. Always add this check: `if len(result) != len(graph): raise ValueError("Cycle detected")`. Without it, your topological sort silently fails on invalid input, which is much worse than a loud failure. This exact check is what the Anthropic OA Task Management System requires.

**Phase 2 closing:**
> That's Day 28 — end of Phase 2. Before your next session, look back at your Phase 2 mock verdicts. Did you hit the Phase 2 exit criteria?
>
> **Phase 2 → Phase 3 gate:**
> - asyncio.Semaphore pattern written from memory without looking it up ✓/✗
> - Topological sort (Kahn's): correct cycle detection, implemented in < 12 min ✓/✗
> - Given a problem, can identify the pattern within 2 min ✓/✗
> - SQL window function query written correctly ✓/✗
> - At least 2 of 4 Friday mocks: "conditional pass" or better ✓/✗
>
> If 4 of 5 are checked: Phase 3 starts next session. If not: one more week of Phase 2 variants. OpenClaw will evaluate and confirm.

---

## Phase 2 Closing Note

**What Phase 2 built:**
- Topological sort (Kahn's) → Task Management System in OA
- asyncio event loop + gather + Semaphore → Web crawler in Coding Round 1
- Two-pointer, sliding window → algorithmic pattern recognition
- Binary search on answer space → flexible problem-solving
- Prefix sums + hashmap → subarray problems in O(n)
- heapq with lazy deletion → priority-based systems
- asyncio.Queue → async pipelines
- SQL: aggregation, HAVING, window functions, percentiles
- Spec decomposition: defining equality, extracting implicit requirements
- Debug & Read: catching silent failures before they ship

**Pattern recognition trigger words learned this phase:**
| Trigger | Pattern |
|---------|---------|
| "dependency order" / "prerequisites" | Topological sort |
| "concurrent requests" / "rate limit" | asyncio + Semaphore |
| "sorted array" + "pair with property" | Two-pointer |
| "contiguous subarray" + "constraint" | Sliding window |
| "minimum X such that condition(X)" | Binary search on answer space |
| "repeated range sum queries" | Prefix sums |
| "priority queue" + "mutable priorities" | heapq + lazy deletion |
| "cumulative" / "running total" in SQL | Window function with ORDER BY |
| "percentile" / "p95" in SQL | PERCENTILE_CONT/DISC |
