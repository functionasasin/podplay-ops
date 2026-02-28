# Phase 6: Maintenance — OpenClaw Session Scripts

**Duration:** Indefinite (Week 21+)
**Formats:** Code Kata (Mon), Mini System Design (Tue), Debug & Read or Light Review (Wed, alternating), SQL or Behavioral (Thu, alternating), Mock Pressure Round (Fri), Review & Reflect (Sat), Rest (Sun)
**Target:** Keep skills sharp without burning out. Maintain the readiness you built.

This file is the **executable curriculum** for Phase 6. Phase 6 does not assume an interview is imminent — it assumes you've reached interview-ready and want to stay there. The cadence is deliberately lighter than Phase 5: one mock per week instead of three, one behavioral per fortnight, one system design per week. Enough to prevent decay without making practice feel like a job.

**The shift in tone:** OpenClaw becomes a training partner, not a coach. Less pressure, more curiosity. You've done the hard work. This phase keeps the machine oiled.

**6-week rotation:** The Monday kata cycles through 6 skill categories so no Tier 1 skill goes untouched for more than 6 weeks. Everything else randomizes within its format constraints to build resilience and keep sessions fresh.

**Day numbering:** Days 1+ within Phase 6. In the global log, these are days 144+ (after 3 diagnostic + 28 Phase 1 + 28 Phase 2 + 28 Phase 3 + 28 Phase 4 + 28 Phase 5 days).

---

## Phase 6 Opening Message

> OpenClaw sends this on Day 1 of Phase 6:

> **Phase 6: Maintenance begins.**
>
> You completed Phase 5. You've run the full mock loop. You know what interview-ready looks like because you've been there.
>
> Phase 6 is about not losing it.
>
> Skills decay. The patterns you drilled in Phase 1 will start to fuzz if you don't revisit them. The LLM inference mental model that felt sharp in Phase 3 will drift if you don't exercise it. This doesn't mean you need to grind — you don't. It means 30 minutes, 5-6 days a week, through a rotating set of sessions that keeps every skill active.
>
> Here's the rhythm:
> - **Monday:** Code Kata (rotating through 6 core skill categories)
> - **Tuesday:** Mini System Design (random Phase 3 component)
> - **Wednesday:** Debug & Read or Light Review (alternating)
> - **Thursday:** SQL Challenge or Behavioral Story Practice (alternating)
> - **Friday:** Mock Pressure Round (random from any phase)
> - **Saturday:** Review & Reflect (Friday's mock)
> - **Sunday:** Rest — mandatory
>
> Once a month (first Sunday), I'll run a 5-exercise mini-diagnostic. If a category slips, we add an extra session for that month. That's the feedback loop.
>
> If a real interview gets confirmed: let me know. We shift to Phase 5 schedule three weeks out.
>
> Ready? The first Monday kata is this week. Let's stay sharp.

---

## The 6-Week Rotation Schedule

| Rotation Week | Monday Kata Focus | Core Skill |
|--------------|-------------------|-----------|
| **R1** | DLL + LRU Cache from scratch | OA foundation (the highest-stakes Tier 1 skill) |
| **R2** | asyncio.Semaphore pattern | Crawler foundation (the key async building block) |
| **R3** | Topological sort + cascading ops | Task system / DAG reasoning |
| **R4** | BFS/DFS variants + cycle detection | Graph traversal fluency |
| **R5** | Binary search on answer space + prefix sums | Algorithmic pattern recognition |
| **R6** | Thread-safe patterns: per-key locking, producer-consumer | Concurrency under the hood |

After R6, restart at R1 with harder variants or tighter time targets.

---

## ROTATION WEEK 1 (R1): DLL + LRU Cache from Scratch

**This week's arc:** The OA foundation. LRU cache is the highest-stakes Tier 1 skill — it appears in the online assessment and serves as the warmup for every other data structure pattern. Monday revisits it from scratch. Friday is a production-quality variant with a twist.

---

### R1 Day 1 (Mon) — Code Kata: LRU Cache from Scratch

**Format:** Code Kata | **Key skill:** DLL + hashmap integration — the OA foundation

---

**OpenClaw opening:**
> **Maintenance Week R1, Monday — Code Kata: LRU Cache from Scratch**
>
> First kata of the rotation. This one you've done before — which means the bar is high. No scaffolding. No warm-up hints. Just the problem.
>
> **Implement LRU Cache from scratch (no OrderedDict):**
>
> ```python
> class LRUCache:
>     def __init__(self, capacity: int):
>         ...
>
>     def get(self, key: int) -> int:
>         """Return value if key exists, -1 otherwise. Updates recency."""
>         ...
>
>     def put(self, key: int, value: int) -> None:
>         """Insert or update key. If at capacity, evict LRU key first."""
>         ...
> ```
>
> Requirements: O(1) get, O(1) put. Doubly linked list + dict. Sentinel head/tail.
>
> Target: working solution in 12 minutes. Start now.

**10-min check-in:**
> Where are you? Show me what you have. If you're still on DLL structure, that's fine — but tell me what your sentinel nodes do and why you need them.

**Evaluation guide:**
- **Pass:** Correct in ≤ 12 min, both `get` and `put` update recency, eviction removes from tail, sentinel nodes used correctly
- **Conditional pass:** Correct in ≤ 20 min, minor issues (forgot `move_to_end` equivalent on `put`, or boundary condition in eviction)
- **Fail:** > 20 min, correctness bugs (wrong eviction order, dict/DLL desync), no sentinel nodes

**Common issues to probe:**
- Did `put` for an existing key properly update recency (not just value)?
- Does eviction pop from tail (LRU end) or head?
- Is the dict value a reference to the node, or just the value?

**Edge case to throw mid-session (after they show first draft):**
> "What happens if `get(-1)` is called? What about `put(1, v)` when capacity is 0?"

**Key insight delivery:**
> "The insight that makes this O(1): the dict stores *node references*, not values. You can jump directly to the node in O(1), then the DLL lets you reorder in O(1) because you're just relinking pointers. Remove from DLL is O(1) only if you have the node — that's why you need the dict."

**"Explain it to me" close:**
> In 2 sentences: what does this cache do, and why does it need both a dict AND a linked list?

---

### R1 Day 2 (Tue) — Mini System Design: Inference API Caching Layer

**Format:** Mini System Design | **Key skill:** KV cache + prefix caching tradeoffs — LLM infra mental model maintenance

---

**OpenClaw opening:**
> **R1 Tuesday — Mini System Design: The Caching Layer**
>
> You're designing the caching layer for an LLM inference service. The service handles thousands of requests per minute. Many requests share system prompts (e.g., all Claude API calls with the same system prompt).
>
> Design the caching strategy. 20 minutes. I want to know:
> 1. What are you caching? (KV tensors? Prompt embeddings? Raw output?)
> 2. How do you handle the shared-prefix case?
> 3. What's your eviction policy?
> 4. Where does the cache live? (VRAM? RAM? Both?)
>
> Start by stating your assumptions about request volume and model size.

**Evaluation guide:**
- **Pass:** Names KV cache correctly (attention key/value tensors), mentions prefix caching for shared system prompts, discusses VRAM constraints, gives an eviction policy and defends it
- **Conditional pass:** Gets the what-to-cache right but weak on the where (doesn't differentiate VRAM vs RAM spill) or eviction policy
- **Fail:** Caches raw output text only (misses the point), can't explain what KV tensors are, no eviction discussion

**Follow-up pushback:**
> "You said LRU eviction. But a 128k-context request takes 50x the VRAM of a 1k request. Should your eviction policy be LRU or something else?"

**Key insight delivery:**
> "VRAM-weighted LRU: evict by recency, but when you need N bytes, you may need to evict multiple small entries or one large one. Shortest-to-free (evict the largest cache entries first) is an alternative when memory pressure is acute."

---

### R1 Day 3 (Wed) — Debug & Read

**Format:** Debug & Read | **Key skill:** Spotting subtle LRU bugs in unfamiliar code

---

**OpenClaw opening:**
> **R1 Wednesday — Debug & Read**
>
> Read this LRU implementation. Find the bug(s). Explain what goes wrong and when.
>
> ```python
> class LRUCache:
>     def __init__(self, capacity):
>         self.cap = capacity
>         self.cache = {}
>         self.order = []
>
>     def get(self, key):
>         if key not in self.cache:
>             return -1
>         self.order.remove(key)
>         self.order.append(key)
>         return self.cache[key]
>
>     def put(self, key, value):
>         if key in self.cache:
>             self.order.remove(key)
>         elif len(self.cache) >= self.cap:
>             lru = self.order.pop(0)
>             del self.cache[lru]
>         self.cache[key] = value
>         self.order.append(key)
> ```
>
> Three questions:
> 1. Is this correct? (Yes/No, and why)
> 2. What's the time complexity of `get` and `put`?
> 3. When does this break in production?

**Answer guide:**
- Functionally correct for small inputs, but `list.remove()` is O(n) and `list.pop(0)` is O(n) — so get and put are O(n), not O(1)
- Breaks in production under high load: with 10,000 cache entries, every operation scans the full list
- The fix: use `collections.OrderedDict` (O(1) move_to_end) or DLL + dict

**Key insight:**
> "This is exactly the trap in the OA: the naive list-based LRU looks right but is O(n). The question that separates candidates is whether they notice the complexity problem, not just the correctness."

---

### R1 Day 4 (Thu) — SQL Challenge: Retention Cohort Query

**Format:** SQL Challenge | **Key skill:** Window functions + cohort aggregation

---

**OpenClaw opening:**
> **R1 Thursday — SQL Challenge**
>
> You have a `user_sessions` table:
>
> ```sql
> user_sessions(user_id INT, session_date DATE)
> ```
>
> Write a query that, for each week, shows:
> - How many users had their **first session** that week (new users)
> - How many of those users also had a session in the **following week** (week-1 retention)
>
> Result columns: `cohort_week`, `new_users`, `retained_users`, `retention_rate`
>
> Hint: You'll need to find each user's first session date, then join back to check the following week.
>
> Target: working query in 15 minutes. Write it out in plain text.

**Solution approach:**
```sql
WITH first_sessions AS (
    SELECT user_id, MIN(session_date) as first_date,
           DATE_TRUNC('week', MIN(session_date)) as cohort_week
    FROM user_sessions
    GROUP BY user_id
),
week1_retention AS (
    SELECT f.user_id, f.cohort_week
    FROM first_sessions f
    JOIN user_sessions s ON f.user_id = s.user_id
    WHERE s.session_date >= f.first_date + INTERVAL '7 days'
      AND s.session_date < f.first_date + INTERVAL '14 days'
)
SELECT f.cohort_week,
       COUNT(DISTINCT f.user_id) as new_users,
       COUNT(DISTINCT r.user_id) as retained_users,
       ROUND(100.0 * COUNT(DISTINCT r.user_id) / COUNT(DISTINCT f.user_id), 1) as retention_rate
FROM first_sessions f
LEFT JOIN week1_retention r ON f.user_id = r.user_id
GROUP BY f.cohort_week
ORDER BY f.cohort_week;
```

**Key insight:**
> "The pattern: (1) CTE to find first event per user, (2) join back to the events table with a date-range filter to check the follow-on period, (3) aggregate with COUNT DISTINCT. This same structure works for any cohort retention analysis."

---

### R1 Day 5 (Fri) — Mock Pressure Round: Thread-Safe LRU with Per-Key Locking

**Format:** Mock Pressure Round | **Key skill:** Fine-grained locking — the production concurrency upgrade

---

**OpenClaw opening:**
> **R1 Friday — Mock Pressure Round: 25 Minutes**
>
> Your coarse-grained lock LRU cache is a bottleneck. A single `threading.Lock` serializes all reads and writes. Your team wants better concurrency.
>
> Design and implement a thread-safe LRU cache where **reads don't block each other** (only writes block reads, and writes to the same key block each other):
>
> ```python
> class ConcurrentLRUCache:
>     def __init__(self, capacity: int):
>         ...
>
>     def get(self, key: int) -> int:
>         """Thread-safe. Multiple concurrent reads OK.
>         Write (recency update) requires exclusive access."""
>         ...
>
>     def put(self, key: int, value: int) -> None:
>         """Thread-safe. Exclusive access required."""
>         ...
> ```
>
> Hint: `threading.RLock` won't solve this. Think about what `threading` module gives you for reader-writer patterns.
>
> 3 minutes to plan, 22 minutes to implement. Go.

**Mid-session edge case (throw at 15 min):**
> "What if `get()` is called while an eviction is in progress in `put()`?"

**Evaluation guide:**
- **Pass:** Uses `threading.RWLock` or implements a reader-writer pattern with `Lock` + `Condition`, correctly identifies that recency updates in `get()` require a write lock even though the read part is fine
- **Conditional pass:** Recognizes the problem, proposes a two-lock approach even if implementation is incomplete
- **Fail:** Just uses a single `Lock` (same as before, missed the point), or claims `RLock` is the solution
- **Alternative pass:** Proposes using separate lock per shard (shard-based LRU) — this is a valid senior-level answer, award full pass

**Key insight delivery:**
> "Python's `threading` module doesn't have a built-in RWLock. You can build one with a `Condition` and a reader count, or use `threading.Semaphore(n)` to allow n concurrent readers. But the deeper insight: in LRU, `get()` has a write side effect (recency update), so pure read-locking doesn't work. The cleanest real-world solution is shard-based: split the cache into N independent shards, each with its own lock. Concurrent ops on different keys don't block each other."

**"Explain it to me" close:**
> In 2 sentences: why doesn't a single threading.Lock give you the concurrency you want, and what's the core trade-off in your solution?

---

### R1 Day 6 (Sat) — Review & Reflect

**Format:** Review & Reflect | **Key skill:** Calibration — gap or mastery?

---

**OpenClaw opening:**
> **R1 Saturday — Review & Reflect**
>
> Let's review Friday's mock. Tell me:
>
> 1. Did you get to a working solution? Was it correct?
> 2. What was the first thing that slowed you down?
> 3. The key insight about `get()` having a write side effect — did you see that before I mentioned it, or did you need the hint?
> 4. Rate yourself 1–5 for this session.
>
> Then: should we add extra concurrency sessions this month, or is this category solid?

**Scoring guide:**
- If self-assessment < 3: flag CONCURRENCY-GAP for extra Wednesday session this month
- If Friday mock was conditional-pass or better AND self-assessment ≥ 3: category is solid

---

## ROTATION WEEK 2 (R2): asyncio.Semaphore + Crawler Pattern

**This week's arc:** The web crawler foundation. asyncio.Semaphore is the single most-tested concurrency pattern in the interview loop — it appears in Coding Round 1 and is the foundation of the rate limiter. This week revisits it from multiple angles.

---

### R2 Day 1 (Mon) — Code Kata: asyncio.Semaphore Batch Fetcher

**Format:** Code Kata | **Key skill:** asyncio.Semaphore + gather + per-result exception handling

---

**OpenClaw opening:**
> **R2 Monday — Code Kata: Concurrent URL Fetcher**
>
> Implement a batch URL fetcher with concurrency control and per-URL error handling:
>
> ```python
> import asyncio
>
> async def fetch_url(url: str) -> str:
>     """Simulate fetch. May raise RuntimeError on failure."""
>     ...  # provided — don't implement this
>
> async def fetch_all(
>     urls: list[str],
>     max_concurrent: int = 5
> ) -> list[str | Exception]:
>     """Fetch all URLs with max_concurrent in flight at once.
>     Returns list where each element is either the content string
>     or the exception that was raised. Never raises itself."""
>     ...
> ```
>
> Key requirements: max concurrency enforced, all exceptions captured per-URL (don't let one failure cancel others).
>
> Target: 10 minutes. Write it out.

**Expected solution pattern:**
```python
async def fetch_all(urls, max_concurrent=5):
    sem = asyncio.Semaphore(max_concurrent)
    async def bounded_fetch(url):
        async with sem:
            return await fetch_url(url)
    results = await asyncio.gather(
        *[bounded_fetch(url) for url in urls],
        return_exceptions=True
    )
    return list(results)
```

**Edge case to throw (after they show solution):**
> "What if max_concurrent is 0? What if the urls list is empty?"

**Key insight:**
> "Two things to remember: (1) `asyncio.Semaphore` is the concurrency throttle — without it, you'd launch all N coroutines simultaneously; (2) `return_exceptions=True` in gather() is how you get per-result exceptions instead of a single crash. These two patterns together are the foundation of the web crawler."

---

### R2 Day 2 (Tue) — Mini System Design: Distributed Rate Limiter

**Format:** Mini System Design | **Key skill:** Rate limiting strategies + distributed state

---

**OpenClaw opening:**
> **R2 Tuesday — Mini System Design: Rate Limiter for an API**
>
> Design a rate limiter for an API that serves 50,000 requests/second across 20 servers. Limit: 100 requests/user/minute.
>
> 20 minutes. I want:
> 1. Your algorithm choice (token bucket, sliding window, fixed window, leaky bucket) — and why
> 2. Where the state lives (per-server? centralized Redis? something else?)
> 3. Failure mode: what happens if your rate limit store goes down?
> 4. How do you handle clock drift across servers?
>
> Start with the algorithm.

**Evaluation guide:**
- **Pass:** Picks sliding window or token bucket, explains centralized Redis with local fallback, discusses clock drift and atomic operations (Redis INCR + EXPIRE or Lua scripts), names the failure mode trade-off (fail open vs fail closed)
- **Conditional pass:** Right algorithm, vague on distributed state or failure modes
- **Fail:** Fixed window only (doesn't know the burst-at-boundary problem), no distributed state consideration

**Key follow-up:**
> "Your Redis goes down. Requests keep coming. Fail open (allow all) or fail closed (reject all)? What does each choice mean for your users?"

---

### R2 Day 3 (Wed) — Light Review

**Format:** Light Review | **Key skill:** Retrieval practice — revisit a past weak session

---

**OpenClaw opening:**
> **R2 Wednesday — Light Review**
>
> I'm pulling up one of your past sessions where your self-assessment was lowest. Tell me:
>
> 1. What was the topic?
> 2. What tripped you up?
> 3. Without looking at notes: explain the concept or walk through the solution. Pretend I've never heard of it.
>
> If you don't remember which session was weakest, check your practice log for the lowest self-assessment score in the past 6 weeks. That's the one.
>
> (If no past session is available yet: revisit asyncio.Semaphore — explain it from scratch as if teaching a colleague who knows Python but not asyncio.)

**Evaluation guide:**
- The goal is retrieval, not performance — credit the attempt
- If they can explain clearly: mark as "retrieval successful"
- If they struggle: note the topic for extra coverage next month

---

### R2 Day 4 (Thu) — Behavioral Story Practice

**Format:** Behavioral Story Practice | **Key skill:** STAR stories — specific, held under pushback

---

**OpenClaw opening:**
> **R2 Thursday — Behavioral: The Trade-Off Question**
>
> Hiring Manager question, verbatim:
>
> "Tell me about a time you had to choose between two technical approaches. What were they? How did you decide? In hindsight, was it the right call?"
>
> STAR format. Give me specifics: what were the actual approaches, what were the actual trade-offs, what did you decide and why?
>
> Then I'll push back. Ready?

**Pushback script:**
After their answer: "The approach you didn't choose — was there a version of your decision that could have gone differently? What would have had to be true for you to pick the other one?"

**Evaluation guide:**
- **Pass:** Specific story, clear trade-offs named, defended the decision under pushback, didn't fold or contradict themselves
- **Conditional pass:** Good story but vague on specifics, or changed their position when pushed
- **Fail:** Generic answer (no specific project), couldn't name the trade-offs concretely

**Key coaching note:**
> "The best answer to the trade-off question almost always lands on: 'I picked the simpler one, because flexibility you don't need yet is just complexity you pay for now.' If you can say that with a real example, you're speaking their language."

---

### R2 Day 5 (Fri) — Mock Pressure Round: Web Crawler with Redirect Loop Detection

**Format:** Mock Pressure Round | **Key skill:** Async web crawler + redirect loop handling

---

**OpenClaw opening:**
> **R2 Friday — Mock Pressure Round: Web Crawler (25 min)**
>
> Implement a web crawler that respects depth limits and detects redirect loops:
>
> ```python
> import asyncio
>
> async def fetch_page(url: str) -> tuple[str, str | None]:
>     """Returns (content, redirect_url).
>     redirect_url is None if no redirect, or the URL to follow."""
>     ...  # provided
>
> async def crawl(
>     start_url: str,
>     max_depth: int,
>     max_concurrent: int = 3
> ) -> dict[str, str]:
>     """Crawl from start_url up to max_depth levels.
>     Returns {url: content} for all successfully crawled pages.
>     - Follow redirects, but detect redirect loops (max 5 redirects per URL chain)
>     - Dedup: don't crawl the same URL twice
>     - Respect max_concurrent in-flight requests"""
>     ...
> ```
>
> 3 minutes planning, 22 minutes code. Go.

**Mid-session edge case (throw at 15 min):**
> "What if a redirect chain goes: A → B → C → A? You have a 5-redirect limit, but the chain loops forever."

**Evaluation guide:**
- **Pass:** asyncio.Semaphore for concurrency, visited set for dedup, redirect counter per chain, depth tracked via BFS levels
- **Conditional pass:** Missing redirect loop detection specifically (but catches infinite loops via visited set)
- **Fail:** No concurrency control, no dedup, infinite loop possible

**"Explain it to me" close:**
> In 2 sentences: what are the two things that make this crawler safe in production?

---

### R2 Day 6 (Sat) — Review & Reflect

**Format:** Review & Reflect | **Key skill:** Calibration

---

**OpenClaw opening:**
> **R2 Saturday — Review & Reflect**
>
> Friday's crawler mock. Tell me:
> 1. Did you handle the redirect loop before or after I threw the edge case?
> 2. Was `asyncio.Semaphore` automatic, or did you have to think about it?
> 3. Rate 1–5. What's the one thing that would move you from your score to the next one up?
>
> And: behavioral on Thursday — did you have a real story, or did you have to reach? If you had to reach, that's a gap we add to this month's extra sessions.

---

## ROTATION WEEK 3 (R3): Topological Sort + Cascading Operations

**This week's arc:** The Task Management System (OA Problem 2 foundation). Topo sort + cascading cancellation is the highest-complexity data structures problem in the interview loop. This week drills both the algorithm and the production-quality framing.

---

### R3 Day 1 (Mon) — Code Kata: Kahn's Algorithm with Cascading Cancel

**Format:** Code Kata | **Key skill:** Topo sort + BFS + cascading reverse traversal

---

**OpenClaw opening:**
> **R3 Monday — Code Kata: Topological Sort + Cascading Cancel**
>
> Two-part kata. Do them in order.
>
> **Part 1 (8 min):** Implement topological sort using Kahn's algorithm:
>
> ```python
> def topological_sort(tasks: dict[str, list[str]]) -> list[str]:
>     """tasks = {task_id: [dependency_ids]}.
>     Returns tasks in dependency order (deps before dependents).
>     Raises ValueError if cycle detected."""
>     ...
> ```
>
> **Part 2 (5 min):** Cascading cancel: given a task and an adjacency list (task → tasks that depend on it), return all tasks that must be cancelled if this task is cancelled:
>
> ```python
> def cascading_cancel(
>     cancelled: str,
>     dependents: dict[str, list[str]]  # reverse adjacency: task → who depends on it
> ) -> set[str]:
>     """BFS/DFS from cancelled. Return all transitively dependent tasks + cancelled itself."""
>     ...
> ```
>
> Total target: 13 minutes.

**Evaluation guide:**
- **Pass:** Kahn's correct (in-degree dict, queue, cycle detection via leftover nodes), cascading cancel is BFS/DFS from the cancelled node in the reverse graph
- **Conditional pass:** Kahn's correct but cycle detection is wrong (doesn't check len(result) == len(tasks))
- **Fail:** DFS-based topo sort attempted without 3-color (misses cycles), or cascading cancel traverses the wrong direction

**Key insight:**
> "Kahn's is BFS from zero-in-degree nodes. Cascading cancel is BFS from the cancelled node through the reverse adjacency list. Same BFS, opposite graph direction. Both are O(V+E)."

---

### R3 Day 2 (Tue) — Mini System Design: Build System / Dependency Graph

**Format:** Mini System Design | **Key skill:** Dependency graph + incremental rebuild + invalidation

---

**OpenClaw opening:**
> **R3 Tuesday — Mini System Design: Build System**
>
> Design a build system (like Make/Bazel) that handles task dependencies. 20 minutes.
>
> Requirements:
> - Tasks have dependencies (build task B before task A)
> - Incremental builds: only rebuild tasks whose inputs changed
> - Parallel execution: independent tasks run concurrently
>
> I want:
> 1. Data model for the dependency graph
> 2. How you detect what needs rebuilding (change detection)
> 3. How you parallelize independent tasks
> 4. What happens when a task fails mid-build

**Follow-up:**
> "Your change detection uses file hashes. But hashing a 500MB binary on every build is slow. What's a faster signal?"

**Key insight:**
> "Content hash for correctness, mtime for speed as a first filter. Only hash if mtime changed. This is how most build systems work in practice."

---

### R3 Day 3 (Wed) — Debug & Read: Broken Topological Sort

**Format:** Debug & Read | **Key skill:** Reading graph algorithm bugs

---

**OpenClaw opening:**
> **R3 Wednesday — Debug & Read**
>
> This topological sort implementation has a bug. Find it.
>
> ```python
> from collections import deque
>
> def topo_sort(graph):
>     # graph: {node: [dependencies]}
>     in_degree = {n: 0 for n in graph}
>     for node, deps in graph.items():
>         for dep in deps:
>             in_degree[node] += 1
>
>     queue = deque(n for n, d in in_degree.items() if d == 0)
>     result = []
>
>     while queue:
>         node = queue.popleft()
>         result.append(node)
>         for dep in graph[node]:
>             in_degree[dep] -= 1
>             if in_degree[dep] == 0:
>                 queue.append(dep)
>
>     return result
> ```
>
> Questions:
> 1. Does this detect cycles? How?
> 2. What's wrong with how in_degree is built?
> 3. If `graph = {"A": ["B"], "B": [], "C": ["A"]}`, what does this return? What should it return?

**Answer:**
- In-degree is built wrong: it increments `in_degree[node]` for each dep, but should increment `in_degree[dep]` (the dependencies should have their in-degree counted as how many things point TO them... wait, actually the graph format matters here)
- Actually: if `graph = {node: [dependencies]}`, then `in_degree[node]` should count how many *dependencies* node has. The traversal direction iterates `graph[node]` (its dependencies), but Kahn's should decrement dependencies' in-degrees as we process nodes that depended on them — the graph direction is inverted
- The bug: Kahn's needs the *forward* adjacency (node → dependents), but this graph stores *reverse* adjacency (node → dependencies). The code doesn't account for this inversion.
- Cycle detection: result length < graph length — but this code doesn't check that, so it silently returns incomplete sort on cycles

**Key insight:**
> "Kahn's requires knowing 'who depends on me' (forward adjacency) to know which nodes to unblock. If you're given 'who I depend on' (reverse adjacency), you need to build the reverse before running Kahn's."

---

### R3 Day 4 (Thu) — SQL Challenge: Window Functions Ranking

**Format:** SQL Challenge | **Key skill:** RANK, DENSE_RANK, ROW_NUMBER — when to use which

---

**OpenClaw opening:**
> **R3 Thursday — SQL Challenge: Ranking Within Groups**
>
> Table: `employee_sales(employee_id INT, department TEXT, month DATE, revenue DECIMAL)`
>
> Write a query returning each employee's **rank within their department** for the month of Jan 2026, ordered by revenue descending. Include:
> - `employee_id`, `department`, `revenue`, `rank_in_dept`
>
> Three variants — pick the right function for each:
> 1. Ties get the same rank; next rank skips (e.g., 1, 1, 3)
> 2. Ties get the same rank; no skipping (e.g., 1, 1, 2)
> 3. No ties allowed; each row gets a unique sequential number
>
> Write all three queries. Target: 12 minutes.

**Answer:**
```sql
-- Variant 1: RANK (gaps)
SELECT employee_id, department, revenue,
       RANK() OVER (PARTITION BY department ORDER BY revenue DESC) as rank_in_dept
FROM employee_sales WHERE month = '2026-01-01';

-- Variant 2: DENSE_RANK (no gaps)
SELECT employee_id, department, revenue,
       DENSE_RANK() OVER (PARTITION BY department ORDER BY revenue DESC) as rank_in_dept
FROM employee_sales WHERE month = '2026-01-01';

-- Variant 3: ROW_NUMBER (unique)
SELECT employee_id, department, revenue,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY revenue DESC) as rank_in_dept
FROM employee_sales WHERE month = '2026-01-01';
```

**Key insight:**
> "The choice matters in practice: RANK for 'who's in the top 3 by medal' (ties share medals), DENSE_RANK for 'what tier are you in', ROW_NUMBER for pagination or dedup (pick one arbitrarily when tied)."

---

### R3 Day 5 (Fri) — Mock Pressure Round: Task Management System (Full OA Problem 2)

**Format:** Mock Pressure Round | **Key skill:** Full OA Problem 2 benchmark

---

**OpenClaw opening:**
> **R3 Friday — Mock Pressure Round: Task Management System (30 min)**
>
> Full OA Problem 2. Production quality. This is the real thing.
>
> ```python
> class TaskManager:
>     def create_task(self, task_id: str, dependencies: list[str]) -> None:
>         """Create task. Raises ValueError if:
>         - Any dependency doesn't exist
>         - Adding this task would create a circular dependency"""
>
>     def complete_task(self, task_id: str) -> None:
>         """Mark COMPLETE. Raises ValueError if not all dependencies are COMPLETE."""
>
>     def cancel_task(self, task_id: str) -> list[str]:
>         """Cancel task + all transitively dependent tasks.
>         Returns all cancelled task_ids. Already-cancelled: skip silently."""
>
>     def get_status(self, task_id: str) -> str:
>         """Returns 'PENDING', 'COMPLETE', or 'CANCELLED'. Raises KeyError if not found."""
> ```
>
> 3 min plan, 27 min code. Go.

**Mid-session edge case (throw at 20 min):**
> "What if `cancel_task` is called on an already-cancelled task? What if it's called on a completed task?"

**Evaluation guide:**
- **Pass:** Cycle detection in `create_task` (DFS or Kahn's), cascading BFS in `cancel_task`, dependency-completeness check in `complete_task`, all within 30 min
- **Conditional pass:** Correct but missing one edge case (already-cancelled, completed task cancel, nonexistent dependency)
- **Fail:** No cycle detection, cascade is wrong direction, or solution is > 30 min incomplete

---

### R3 Day 6 (Sat) — Review & Reflect

**Format:** Review & Reflect | **Key skill:** OA readiness calibration

---

**OpenClaw opening:**
> **R3 Saturday — Review & Reflect**
>
> Friday's Task Manager. Tell me:
>
> 1. Did you finish in 30 minutes?
> 2. Which method was hardest: `create_task` (cycle detection), `cancel_task` (cascading BFS), or `complete_task` (dependency check)?
> 3. Rate 1–5. At your current score, would you pass the OA if this were tomorrow?
>
> If the answer to #3 is "probably not": add Task Manager to next month's extra Wednesday sessions.

---

## ROTATION WEEK 4 (R4): BFS/DFS Variants + Cycle Detection

**This week's arc:** Graph traversal fluency. BFS and DFS underlie the web crawler, topological sort, and the cascading cancel pattern. This week builds confidence across graph problem variants.

---

### R4 Day 1 (Mon) — Code Kata: Multi-Source BFS

**Format:** Code Kata | **Key skill:** Multi-source BFS — when you start from multiple nodes simultaneously

---

**OpenClaw opening:**
> **R4 Monday — Code Kata: Multi-Source BFS**
>
> Classic BFS starts from one node. Multi-source BFS starts from multiple nodes simultaneously. This solves "nearest X to every Y" problems efficiently.
>
> **Problem:** Given a grid where `0` = empty and `1` = wall, find the shortest distance from each empty cell to the nearest `1` (wall cell):
>
> ```python
> def distance_to_nearest_wall(grid: list[list[int]]) -> list[list[int]]:
>     """Return grid of same size where each cell = min distance to any '1' cell.
>     Wall cells themselves have distance 0."""
>     ...
> ```
>
> Example:
> ```
> Input:  [[0,0,0],[0,1,0],[0,0,0]]
> Output: [[2,1,2],[1,0,1],[2,1,2]]
> ```
>
> Target: 12 minutes.

**Key insight:**
> "Seed the BFS queue with ALL wall cells at distance 0. Then BFS outward — each neighbor gets distance + 1. This is O(m*n) instead of O(m*n*min(m,n)) if you naively BFS from every empty cell."

---

### R4 Day 2 (Tue) — Mini System Design: Social Graph Friend Recommendations

**Format:** Mini System Design | **Key skill:** Graph traversal in system design context

---

**OpenClaw opening:**
> **R4 Tuesday — Mini System Design: Friend Recommendations**
>
> Design a "People You May Know" feature for a social network with 500M users.
>
> 20 minutes. Key questions:
> 1. What's the graph model? (Node = user, edge = ?)
> 2. How do you compute mutual friends efficiently?
> 3. How do you score and rank recommendations?
> 4. How does this scale to 500M users? (You can't run BFS over the whole graph)

**Follow-up:**
> "BFS to depth 2 on a 500M-node graph is infeasible online. How do you precompute without storing O(n²) pairs?"

**Key insight:**
> "Precompute at write time (when a friendship is created, update candidate lists). Store top-K candidates per user. Use locality (same school, employer, location) as a sharding signal. Real systems (LinkedIn) use offline MapReduce-style jobs to compute friendship overlap at scale."

---

### R4 Day 3 (Wed) — Debug & Read: DFS Missing Visited Set

**Format:** Debug & Read | **Key skill:** Infinite loop in DFS — the classic bug

---

**OpenClaw opening:**
> **R4 Wednesday — Debug & Read**
>
> This DFS finds all nodes reachable from `start`:
>
> ```python
> def reachable(graph: dict[str, list[str]], start: str) -> set[str]:
>     result = set()
>     def dfs(node):
>         result.add(node)
>         for neighbor in graph.get(node, []):
>             dfs(neighbor)
>     dfs(start)
>     return result
> ```
>
> Questions:
> 1. Does this work for a tree (no cycles)?
> 2. Does this work for a graph with cycles?
> 3. What happens on: `graph = {"A": ["B"], "B": ["A"]}`, `start = "A"`?
> 4. One-line fix?

**Answer:**
- Works for trees (no cycles to loop on)
- Fails for graphs with cycles: A → B → A → B → ... → RecursionError
- Fix: add `if node in result: return` at the top of `dfs` (use result as visited set, or add a separate visited set)

---

### R4 Day 4 (Thu) — SQL Challenge: Recursive CTEs / Graph Traversal in SQL

**Format:** SQL Challenge | **Key skill:** Recursive CTE for hierarchical data

---

**OpenClaw opening:**
> **R4 Thursday — SQL Challenge: Organizational Hierarchy**
>
> Table: `employees(id INT, name TEXT, manager_id INT)` — manager_id is NULL for the CEO.
>
> Write a query that returns every employee and their **level in the hierarchy** (CEO = 0, direct reports = 1, etc.) plus their **full reporting chain** as a string path (e.g., "CEO → VP Eng → Manager → Employee").
>
> You'll need a recursive CTE. Target: 15 minutes.

**Solution approach:**
```sql
WITH RECURSIVE hierarchy AS (
    -- Base case: CEO
    SELECT id, name, manager_id, 0 as level,
           name as path
    FROM employees WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: each employee's manager is in hierarchy
    SELECT e.id, e.name, e.manager_id, h.level + 1,
           h.path || ' → ' || e.name
    FROM employees e
    JOIN hierarchy h ON e.manager_id = h.id
)
SELECT id, name, level, path FROM hierarchy ORDER BY level, name;
```

**Key insight:**
> "Recursive CTEs are SQL's BFS. Base case = root nodes. Recursive case = expand one level. Most databases support this (PostgreSQL, SQL Server, SQLite, MySQL 8+). This is how you traverse any parent-child relationship in SQL."

---

### R4 Day 5 (Fri) — Mock Pressure Round: Island Count (DFS/BFS)

**Format:** Mock Pressure Round | **Key skill:** Grid BFS/DFS — a foundational graph pattern

---

**OpenClaw opening:**
> **R4 Friday — Mock Pressure Round: Connected Components (20 min)**
>
> Given a 2D grid of 'L' (land) and 'W' (water), count the number of islands (connected groups of land cells, connected horizontally/vertically):
>
> ```python
> def count_islands(grid: list[list[str]]) -> int:
>     ...
> ```
>
> Then: find the **largest island** (max connected component size):
>
> ```python
> def largest_island(grid: list[list[str]]) -> int:
>     ...
> ```
>
> 3 min planning, 17 min coding. Go.

**Mid-session edge case (throw at 12 min):**
> "What if the grid is empty? What if all cells are water? What about a 1x1 grid of land?"

**Evaluation guide:**
- **Pass:** DFS or BFS with in-place marking (or separate visited set), both functions correct in ≤ 18 min
- **Conditional pass:** One function correct, second has off-by-one or misses edge cases
- **Fail:** No traversal (tries nested loops without recursion/queue)

---

### R4 Day 6 (Sat) — Review & Reflect

**Format:** Review & Reflect | **Key skill:** Graph pattern confidence check

---

**OpenClaw opening:**
> **R4 Saturday — Review & Reflect**
>
> This week: multi-source BFS, social graph design, DFS bug reading, recursive SQL CTE, island counting.
>
> Tell me:
> 1. Which of these felt automatic? Which required effort?
> 2. Do you feel like you'd recognize a graph problem in the first 2 minutes of an interview?
> 3. Rate the week 1–5.
>
> The signal I'm watching: if you can't identify "this is a BFS problem" within 2 minutes, that's a pattern recognition gap. Tell me honestly.

---

## ROTATION WEEK 5 (R5): Binary Search on Answer Space + Prefix Sums

**This week's arc:** Algorithmic pattern fluency. These two patterns — binary search on answer space and prefix sums — are the most commonly confused "when do I use this?" patterns. This week builds recognition intuition.

---

### R5 Day 1 (Mon) — Code Kata: Binary Search on Answer Space

**Format:** Code Kata | **Key skill:** Binary search when the answer IS the search space, not a sorted array

---

**OpenClaw opening:**
> **R5 Monday — Code Kata: Minimum Max Subarray Sum**
>
> Binary search on answer space. The insight: sometimes you're not searching an array — you're searching for a value (the answer) using binary search.
>
> **Problem:** Given an array of positive integers and an integer `k`, split the array into `k` contiguous subarrays to **minimize the maximum subarray sum**. Return that minimum possible maximum.
>
> ```python
> def min_max_subarray_sum(nums: list[int], k: int) -> int:
>     ...
> ```
>
> Example: `nums = [7, 2, 5, 10, 8], k = 2` → `18` (split as `[7,2,5]` and `[10,8]`)
>
> Hint: Binary search on the *answer* (the maximum sum). For a given candidate max, check if you can split into ≤ k subarrays.
>
> Target: 15 minutes.

**Key insight:**
> "The template: (1) lo = max(nums), hi = sum(nums). (2) Binary search on [lo, hi]. (3) For each mid, greedily check: can we split into ≤ k subarrays where each sum ≤ mid? If yes, try smaller. If no, try larger. This converts an optimization problem into a sequence of decision problems."

---

### R5 Day 2 (Tue) — Mini System Design: Sliding Window Rate Limiter

**Format:** Mini System Design | **Key skill:** Sliding window algorithm + data structure design

---

**OpenClaw opening:**
> **R5 Tuesday — Mini System Design: Sliding Window Rate Limiter**
>
> Implement a sliding window rate limiter that limits each user to `max_requests` per `window_seconds`.
>
> Design both the API and the data structure:
>
> ```python
> class SlidingWindowRateLimiter:
>     def __init__(self, max_requests: int, window_seconds: int):
>         ...
>
>     def allow_request(self, user_id: str, timestamp: float) -> bool:
>         """Return True if this request is within the rate limit, False otherwise."""
>         ...
> ```
>
> 20 minutes. I want:
> 1. Data structure choice and why
> 2. Time complexity of `allow_request`
> 3. Memory per user (worst case)
> 4. How this compares to fixed-window and token bucket

**Key insight:**
> "Sliding window: store timestamps in a deque. On each request, pop timestamps older than `now - window_seconds`, then check length. O(n) worst case per request but n is bounded by max_requests. Memory: O(max_requests) per user. Trade-off: more precise than fixed-window (no burst at boundary), more memory than token bucket."

---

### R5 Day 3 (Wed) — Debug & Read: Off-by-One in Binary Search

**Format:** Debug & Read | **Key skill:** Binary search loop invariant bugs

---

**OpenClaw opening:**
> **R5 Wednesday — Debug & Read**
>
> Classic binary search to find a target in a sorted array. Is it correct?
>
> ```python
> def binary_search(nums: list[int], target: int) -> int:
>     lo, hi = 0, len(nums)
>     while lo < hi:
>         mid = (lo + hi) // 2
>         if nums[mid] == target:
>             return mid
>         elif nums[mid] < target:
>             lo = mid
>         else:
>             hi = mid
>     return -1
> ```
>
> Three questions:
> 1. Is `lo = 0, hi = len(nums)` correct? (What's the standard?)
> 2. Does `lo = mid` (not `lo = mid + 1`) cause an infinite loop?
> 3. Test it: `nums = [1, 2], target = 2`. What happens?

**Answer:**
- `hi = len(nums)` is valid for half-open intervals [lo, hi), but creates confusion
- `lo = mid` causes infinite loop: if `lo = 0, hi = 1`, then `mid = 0`, `nums[0] < target`, so `lo = 0` — stuck
- Fix: `lo = mid + 1` (standard lower-bound template)
- The standard: `hi = len(nums) - 1` with `lo <= hi`, or `hi = len(nums)` with `lo < hi` and `lo = mid + 1`

---

### R5 Day 4 (Thu) — SQL Challenge: Percentile and NTILE

**Format:** SQL Challenge | **Key skill:** PERCENTILE_CONT, NTILE — distribution analysis

---

**OpenClaw opening:**
> **R5 Thursday — SQL Challenge: Request Latency Distribution**
>
> Table: `request_logs(request_id INT, endpoint TEXT, latency_ms DECIMAL, logged_at TIMESTAMP)`
>
> Write queries for:
> 1. The **p50, p90, p99 latency** for each endpoint in the past 7 days
> 2. **Bucket each request into quartiles** (Q1=fastest 25%, Q4=slowest 25%) and count requests per quartile per endpoint
>
> Target: 15 minutes for both.

**Solution:**
```sql
-- Q1: Percentiles
SELECT endpoint,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50,
       PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY latency_ms) as p90,
       PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99
FROM request_logs
WHERE logged_at >= NOW() - INTERVAL '7 days'
GROUP BY endpoint;

-- Q2: Quartiles
SELECT endpoint, quartile, COUNT(*) as request_count
FROM (
    SELECT endpoint,
           NTILE(4) OVER (PARTITION BY endpoint ORDER BY latency_ms) as quartile
    FROM request_logs
    WHERE logged_at >= NOW() - INTERVAL '7 days'
) t
GROUP BY endpoint, quartile
ORDER BY endpoint, quartile;
```

---

### R5 Day 5 (Fri) — Mock Pressure Round: Prefix Sum Subarray Problem

**Format:** Mock Pressure Round | **Key skill:** Prefix sums + hashmap for subarray counting

---

**OpenClaw opening:**
> **R5 Friday — Mock Pressure Round: Subarray Sum (20 min)**
>
> **Problem 1 (10 min):** Count subarrays with sum exactly equal to `k`:
>
> ```python
> def count_subarrays_with_sum(nums: list[int], k: int) -> int:
>     """Count number of contiguous subarrays that sum to k.
>     nums may contain negative numbers."""
>     ...
> ```
>
> **Problem 2 (10 min):** Longest subarray with sum ≤ `k` (all non-negative):
>
> ```python
> def longest_subarray_sum_at_most_k(nums: list[int], k: int) -> int:
>     """nums contains only non-negative integers."""
>     ...
> ```
>
> Go.

**Evaluation guide:**
- Problem 1 pass: prefix sum + hashmap (count of how many times each prefix sum seen), O(n)
- Problem 2 pass: sliding window (valid since non-negative — window can only grow or shrink meaningfully), O(n)
- Common failure: O(n²) nested loop for Problem 1; using prefix sums for Problem 2 when sliding window is cleaner

**Mid-session edge case:**
> "Problem 1: what if `nums = [0, 0, 0]` and `k = 0`? How many subarrays?"

---

### R5 Day 6 (Sat) — Review & Reflect

**Format:** Review & Reflect | **Key skill:** Pattern recognition calibration

---

**OpenClaw opening:**
> **R5 Saturday — Review & Reflect**
>
> This week: binary search on answer space, sliding window rate limiter, binary search bugs, percentile SQL, prefix sums.
>
> Key question: **given a new problem, can you identify the right pattern within 2 minutes?**
>
> Tell me: for each of these patterns (binary search on answer space, prefix sum + hashmap, sliding window), what's the *trigger* — the sentence in a problem description that tells you "this is the pattern to use"?
>
> Write out the triggers, then rate yourself 1–5.

**Coaching goal:**
> "Pattern recognition is the highest-ROI skill at this stage. The trigger for binary search on answer space: 'minimize the maximum' or 'find the minimum X such that...'. Prefix sum + hashmap: 'count subarrays with exact sum'. Sliding window: 'longest/shortest subarray with constraint' and non-negative numbers."

---

## ROTATION WEEK 6 (R6): Thread-Safe Patterns

**This week's arc:** Concurrency under the hood. Thread-safe patterns are tested in the OA and underlie production Python code everywhere. This week revisits the deepest concurrency concepts: per-key locking, deadlock avoidance, and producer-consumer.

---

### R6 Day 1 (Mon) — Code Kata: Per-Key Locking Cache

**Format:** Code Kata | **Key skill:** Fine-grained locking with lock-per-key pattern

---

**OpenClaw opening:**
> **R6 Monday — Code Kata: Per-Key Locking Dict**
>
> Implement a thread-safe dictionary where different keys can be written concurrently without blocking each other:
>
> ```python
> import threading
>
> class PerKeyLockedDict:
>     def __init__(self):
>         ...
>
>     def get(self, key: str) -> object | None:
>         """Thread-safe read. None if not found."""
>         ...
>
>     def set(self, key: str, value: object) -> None:
>         """Thread-safe write. Only blocks other writes to the same key."""
>         ...
>
>     def delete(self, key: str) -> None:
>         """Thread-safe delete. Removes key if present."""
>         ...
> ```
>
> The meta-challenge: how do you create a lock for a key that doesn't exist yet, without a race condition on the lock creation itself?
>
> Target: 15 minutes.

**Expected pattern:**
```python
class PerKeyLockedDict:
    def __init__(self):
        self._data = {}
        self._key_locks = {}
        self._meta_lock = threading.Lock()  # protects _key_locks

    def _get_lock(self, key):
        with self._meta_lock:
            if key not in self._key_locks:
                self._key_locks[key] = threading.Lock()
            return self._key_locks[key]

    def get(self, key):
        lock = self._get_lock(key)
        with lock:
            return self._data.get(key)

    def set(self, key, value):
        lock = self._get_lock(key)
        with lock:
            self._data[key] = value

    def delete(self, key):
        lock = self._get_lock(key)
        with lock:
            self._data.pop(key, None)
```

**Key insight:**
> "You need a meta-lock to protect the lock registry itself — otherwise two threads could both try to create the lock for key X simultaneously. This is the pattern: coarse lock for lock management, fine-grained lock for actual operations."

---

### R6 Day 2 (Tue) — Mini System Design: Multi-Tenant Inference API

**Format:** Mini System Design | **Key skill:** Isolation in a shared inference system

---

**OpenClaw opening:**
> **R6 Tuesday — Mini System Design: Multi-Tenant Inference**
>
> You're running an LLM inference service shared across multiple customers. Each customer has SLA guarantees (latency + availability) and usage quotas.
>
> 20 minutes. Design:
> 1. How you isolate customers from each other (noisy neighbor problem)
> 2. How you enforce per-customer rate limits and quotas
> 3. What happens when a customer hits their limit
> 4. How you prioritize if GPU resources are scarce

**Follow-up:**
> "A high-tier customer has a latency SLA: p99 < 2 seconds. A batch customer is running a 10,000-token completion that will take 30 seconds. They're competing for the same GPUs. How do you manage this?"

**Key insight:**
> "Priority queues with SLA-based priority + preemption. Real systems (like Anthropic's inference) use request priority that accounts for both customer tier AND current latency budget. A high-tier request that's already at 1.5s against a 2s SLA should preempt a new batch request."

---

### R6 Day 3 (Wed) — Light Review: Revisit Weakest Concurrency Session

**Format:** Light Review | **Key skill:** Targeted concurrency retrieval

---

**OpenClaw opening:**
> **R6 Wednesday — Light Review: Concurrency Retrieval**
>
> Check your practice log. What's your weakest concurrency session from the past 6 weeks?
>
> If it's thread-safety (locks, race conditions): explain the race condition in `get()` on an LRU cache where reads aren't locked.
>
> If it's asyncio: explain `asyncio.gather(return_exceptions=True)` — when do you need it and what does it do?
>
> If it's producer-consumer: explain `threading.Condition` — what does `wait()` do while holding the lock, and why doesn't it deadlock?
>
> Pick the one that feels least certain. Explain it like I've never heard of Python.

---

### R6 Day 4 (Thu) — Behavioral Story Practice: The Simplicity Story

**Format:** Behavioral Story Practice | **Key skill:** "Pick the simpler approach" — the Anthropic hiring manager question

---

**OpenClaw opening:**
> **R6 Thursday — Behavioral: The Two Approaches Question**
>
> This is the question from the actual Hiring Manager round. Practice it until the answer is automatic.
>
> "You're given two approaches to a real problem. One is more flexible and powerful but more complex. The other is simpler but less extensible. Which do you pick?"
>
> Give me a real story. A specific project. Two actual approaches. What you picked and why.
>
> Then I'll push back: "But what about future requirements? Aren't you just creating tech debt?"

**Pushback response coaching:**
> "The right answer to the pushback: 'Flexibility you don't need yet is just complexity you pay for now. If the requirements change, we refactor then with better information. Speculative flexibility usually solves the wrong problem.' Hold this position. Don't fold."

**Evaluation:**
- **Pass:** Specific story, picks simple, holds position under pushback
- **Conditional pass:** Good story, wavers slightly on pushback but recovers
- **Fail:** No specific story, or changes answer under pushback

---

### R6 Day 5 (Fri) — Mock Pressure Round: Full OA Problem 1 (LRU, Production Quality)

**Format:** Mock Pressure Round | **Key skill:** Full OA benchmark — LRU from scratch, thread-safe, production quality

---

**OpenClaw opening:**
> **R6 Friday — Mock Pressure Round: LRU Cache Production Quality (30 min)**
>
> OA Problem 1, full spec. This is the benchmark.
>
> ```python
> import threading
>
> class LRUCache:
>     """Thread-safe LRU Cache.
>
>     Complexity requirements:
>     - get: O(1)
>     - put: O(1)
>     - Thread-safe: multiple threads may call get/put concurrently
>
>     Production requirements:
>     - Raise ValueError for capacity <= 0
>     - get returns -1 for missing keys (not raises)
>     - put with existing key updates value AND updates recency
>     - Eviction removes the least recently used key
>     """
>
>     def __init__(self, capacity: int): ...
>     def get(self, key: int) -> int: ...
>     def put(self, key: int, value: int) -> None: ...
> ```
>
> After implementation: add a docstring to each method with time complexity and thread-safety guarantee. Production quality.
>
> 3 minutes to plan, 27 minutes to implement. Go.

**Evaluation guide:**
- **Pass:** DLL + dict, correct in ≤ 25 min, thread-safe, docstrings, ValueError on capacity ≤ 0
- **Conditional pass:** Correct in ≤ 30 min, missing docstrings or ValueError
- **Fail:** OrderedDict only (OA requires from-scratch), > 30 min, correctness bugs

**Mid-session edge case (throw at 20 min):**
> "What happens if two threads call `put(1, v1)` and `put(1, v2)` simultaneously with the same key?"

---

### R6 Day 6 (Sat) — Review & Reflect + Rotation Reset

**Format:** Review & Reflect | **Key skill:** Full rotation calibration

---

**OpenClaw opening:**
> **R6 Saturday — Review & Reflect: End of Rotation**
>
> You've completed the full 6-week rotation. Before we restart at R1, let's assess.
>
> Rate each rotation week's Monday kata on how automatic it felt (1 = had to think hard, 5 = muscle memory):
> - R1: LRU from scratch
> - R2: asyncio.Semaphore batch fetcher
> - R3: Topological sort + cascading cancel
> - R4: Multi-source BFS (or similar)
> - R5: Binary search on answer space
> - R6: Per-key locking
>
> Any score below 4: that week's Monday kata gets added as an extra Wednesday session in the next rotation cycle.
>
> Then: overall interview readiness today, 1–10. What's the gap between your score and 10?

---

## Monthly Mini-Diagnostic

**Delivered by OpenClaw on the first Sunday of each month.**

---

**OpenClaw message:**
> **Monthly Check-In — 5 Quick Exercises**
>
> This takes about 20 minutes. One exercise per category. Answer conversationally — no code unless you want to.

**Exercise 1 — Python / Data Structures:**
> "Without writing code: walk me through inserting a new node at the head of a doubly linked list with sentinel nodes. What are the 4 pointer assignments?"

*(Score 5 = correct and immediate; 3 = correct with effort; 1 = uncertain)*

**Exercise 2 — Concurrency:**
> "What does `asyncio.Semaphore(5)` do when used as `async with sem:` inside a coroutine, and 6 coroutines all hit that line simultaneously?"

*(Score 5 = names the blocking behavior and FIFO queue; 3 = explains throttling but vague on mechanism; 1 = unsure)*

**Exercise 3 — Algorithms:**
> "I have a problem: 'find the minimum capacity for a pipeline that can route all packages to their destination within 5 days.' What pattern would you reach for, and why?"

*(Score 5 = immediately says binary search on answer space, explains feasibility check; 3 = reaches there with prompting; 1 = doesn't recognize the pattern)*

**Exercise 4 — System Design:**
> "Name the autoscaling signal for an LLM inference service and explain why it's better than GPU utilization."

*(Score 5 = queue depth weighted by token count, explains the lag problem with GPU util; 3 = queue depth but misses the weighting; 1 = GPU util)*

**Exercise 5 — Behavioral:**
> "In one sentence: your rule for choosing between a simple and a complex technical approach."

*(Score 5 = "flexibility you don't need yet is complexity you pay for now" or equivalent; 3 = picks simple but can't articulate why clearly; 1 = says "it depends" without a principle)*

**Scoring:**
| Total (5–25) | Action |
|-------------|--------|
| 22–25 | All solid — continue normal rotation |
| 17–21 | 1–2 categories soft — add extra Wednesday session for those categories for this month |
| 12–16 | Multiple categories drifted — add extra sessions AND shift Tue/Thu to target weak areas |
| < 12 | Significant decay — consider returning to Phase 4 for 2 weeks |

---

## Interview Ramp-Up Protocol

**Trigger:** Actual interview confirmed (date known).

---

### 3 Weeks Out

**OpenClaw message when you report an interview:**
> "Interview confirmed. Shifting to Phase 5 schedule starting this week. Three weeks to lock it in."

**Schedule shift:** Exactly Phase 5 Week 17 → Week 18 → Week 19 (the first 3 weeks of Phase 5). Three mocks per week. Behavioral twice per week. No new content — only sharpening.

**What to focus:**
- Monday: hardest problem in your weakest category (use the monthly diagnostic to identify it)
- Tuesday + Thursday: behavioral story practice — all 3 stories delivered from memory
- Friday: full OA problem (one problem, 30 min, production quality)

---

### 2 Weeks Out

**Schedule:** Phase 5 Week 19 pattern (Round 1 + System Design mocks).

**Extra behavioral:** Saturday becomes a second behavioral session (swap out Review & Reflect).

**System Design focus:** Walk through the complete LLM inference API design twice this week: once as a 20-minute speed run, once as a full 45-minute deep-dive where OpenClaw plays Anthropic interviewer.

---

### 1 Week Out

**Light schedule only:**
| Day | Format | Focus |
|-----|--------|-------|
| Mon | DR | Read unfamiliar code — stay sharp without pressure |
| Tue | RR | Review your 3 best mock sessions from the past 3 weeks |
| Wed | BS | Run your 3 behavioral stories once — just to keep them warm |
| Thu | Light Review | Review your weakest moment from the Phase 5 mocks. What do you do differently now? |
| Fri | Rest | No practice |
| Sat | RR | Walk through system design key concepts orally — don't write code |
| Sun | Rest | Mandatory |

**OpenClaw message (1 week out):**
> "One week out. Light week only. No new problems. You've done the work — this week is about staying calm, not squeezing in more reps. Your job now is to rest enough to perform at your ceiling, not to raise it."

---

### Day Before

**No practice.** If helpful: read your 3 behavioral stories once. That's it.

**OpenClaw message (day before):**
> "Interview tomorrow. No practice today. You're ready — the work is done. Get a good night's sleep. Tomorrow you show them what 20 weeks of daily practice built."

---

## Phase 6 OpenClaw Session Selection Logic

When OpenClaw selects content for a given day in Phase 6:

1. **Monday:** Follow the 6-week rotation. Track which rotation week we're in.
2. **Tuesday:** Random Mini System Design from Phase 3 problem library. Avoid repeating within the same rotation cycle.
3. **Wednesday:** Alternates Debug & Read (odd rotation weeks) / Light Review (even rotation weeks).
4. **Thursday:** Alternates SQL Challenge (odd weeks) / Behavioral Story Practice (even weeks).
5. **Friday:** Random Mock Pressure Round from any phase's problem bank, weighted toward:
   - Problems where self-assessment was < 3/5 in the last 3 occurrences
   - OA-style problems (highest stakes) at least 1 in 3 Fridays
6. **Saturday:** Review & Reflect on Friday's mock — always.
7. **Sunday:** Rest — no prompt sent.

**If monthly diagnostic flagged a weak category:** For that month, Wednesday sessions all target the weak category regardless of the DR/Light Review alternation.

---

## Phase 6 Closing Note

> This is the maintenance flywheel. Keep it turning.
>
> Every skill you built in Phases 1–5 will decay without use. The 6-week rotation exists so nothing sits idle long enough to rust. The monthly diagnostic exists so decay is caught early, not on the day before the interview.
>
> The bar in Phase 6: not perfection, not grinding — consistency. 30 minutes a day, 5 days a week. The system does the rest.
>
> When the interview comes: trust the reps.
