# Phase 5: Sharpening — OpenClaw Session Scripts

**Duration:** 4 weeks (28 days), Weeks 17–20
**Formats:** Mock Pressure Round (3x — Mon + Thu + Fri), Behavioral Story Practice (Tue, occasionally Wed), Concept Deep Dive or Code Kata (Wed, targeted), Review & Reflect (Sat), Rest (Sun mandatory)
**Target:** Consistent "pass" on full mocks, zero-help system design, behavioral fluency under pushback. Raise the floor, not the ceiling.

This file is the **executable curriculum** for Phase 5. Phase 5 does not teach new skills — it eliminates inconsistency. Every session is either a mock round, behavioral drill, or a targeted session on whichever gap is still visible in self-assessment trends. OpenClaw identifies the gaps from Phase 4 Week 16 debrief and pursues them relentlessly.

**The shift in tone:** OpenClaw becomes more demanding here. Less explanation, more expectation. The coaching wheels come off. If you know the pattern, you should be able to execute it. If you can't, that's the data — and we fix it.

**Day numbering:** Days 1–28 within Phase 5. In the global practice log, these are days 116–143 (after 3 diagnostic + 28 Phase 1 + 28 Phase 2 + 28 Phase 3 + 28 Phase 4 days).

**45-minute sessions:** Phase 5 Friday OA simulations run 45 minutes (one OA problem at full scale). This is intentional — the actual OA is 90 minutes for 2 problems, so a single 45-minute session is the right unit. Everything else stays at 30 minutes.

---

## Phase 5 Opening Message

> OpenClaw sends this on Day 1 of Phase 5:

> **Phase 5: Sharpening begins today.**
>
> Phase 4 was about learning to execute under pressure. Phase 5 is about making that execution *reliable*.
>
> Here's what I know from your Phase 4 data: you have the patterns. What's left is the gap between "I know how to do this" and "I do it correctly, every time, without prompting." That gap is what Phase 5 closes.
>
> The schedule is intense: 3 mock rounds per week. Behavioral simulations. Targeted gap work. One rest day — Sunday, mandatory. The goal is not to add anything new. The goal is to reach the point where you're not hoping you get a good problem — you're ready for any problem.
>
> A few things change in Phase 5:
> 1. **The bar shifts.** "Conditional pass" was acceptable in Phase 4. In Phase 5, I'm evaluating against the actual interview standard: would this code get shipped? Would this system design survive pushback from an Anthropic engineer who builds inference systems for a living?
> 2. **I throw edge cases harder.** In Phase 4 I telegraphed them. In Phase 5, I drop them mid-sentence. Handle it in stride.
> 3. **No hints on patterns.** If I ask "what data structure?" I expect an answer in 10 seconds, not a minute of thinking out loud. The thinking already happened in Phases 1–4.
>
> Week 17: hardest problems + weakest area. Week 18: full OA simulation. Week 19: Round 1 + System Design mock. Week 20: the complete loop.
>
> Let's find out what you've got. Day 1 — let's see your worst category.

---

## WEEK 17: Hardest Problems + Weak Area Targeting

**This week's arc:** OpenClaw identifies your lowest self-assessment category from Phase 4's Week 16 debrief and leads with the hardest problem in that category. Thursday is a surprise. Friday is the OA Part 1 benchmark. Saturday reviews the trend. Sunday: rest. This week is deliberately uncomfortable. That's the point.

**Weak area selection logic (internal, OpenClaw reads from Week 16 debrief):**
- Check which category had the most "fail" or "conditional-pass" verdicts in Phase 4 Weeks 15–16
- Categories: Graph Algorithms, Thread Safety, asyncio Concurrency, System Design, Stack / Profiler Problems, Behavioral
- Default weak area for this script: **Thread Safety** (most common gap at this stage — adjust based on actual data)
- Fallback: if multiple categories tied, pick the one that appeared in the most failed Phase 4 mocks

---

### Day 1 (Mon) — Mock Pressure Round: Hardest Problem in Weakest Category

**Format:** Mock Pressure Round | **Key skill:** Raise the floor in the lowest-performing area

---

**OpenClaw opening:**
> **Day 1, Week 17 — Mock Pressure Round: Targeted**
>
> Based on your Phase 4 data, your weakest category is **[WEAK_CATEGORY]**. We're starting there — not as punishment, but because that's where the work is.
>
> 30 minutes. No AI. No search. Plan for 3 minutes, then code.
>
> ---
>
> **Problem: Thread-Safe Cache with TTL (default weak area = thread safety)**
>
> Implement a cache with time-to-live expiration:
>
> ```python
> import time
>
> class TTLCache:
>     def __init__(self, ttl_seconds: float):
>         """All entries expire ttl_seconds after they're set."""
>         ...
>
>     def set(self, key: str, value: any) -> None:
>         """Store key→value. Overwrites existing key."""
>         ...
>
>     def get(self, key: str) -> any:
>         """Return value if key exists and hasn't expired. Return None otherwise.
>         Expired entries should be cleaned up lazily."""
>         ...
>
>     def delete(self, key: str) -> bool:
>         """Delete key if it exists. Return True if deleted, False if not found."""
>         ...
> ```
>
> Requirements:
> - Thread-safe: `set`, `get`, `delete` called from multiple threads concurrently
> - Lazy expiration: remove stale entries on `get`, not on a background thread
> - `get` on an expired key returns `None` and removes the entry
> - `time.time()` is your clock
>
> Say "ready" to start the clock.

**Target time:** 30 min

**Timer management (internal):**
- At 10 min: "Check in — do you have the data structure settled? What are you storing besides key→value?"
- At 20 min: "10 minutes. If `get` isn't handling expiry yet, that's your priority."
- At 30 min: "Time. Share what you have."

**OpenClaw mid-session edge case (throw at ~18 min):**
> Quick one: two threads call `get(key)` at the exact same time. The key is expired. What happens? Does the entry get deleted twice? Is that a problem?

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Thread safety | `threading.Lock` on all read-modify-write paths | Lock on set/delete but not get's expiry removal | No lock |
| Expiry check | Correct: `time.time() > stored_expiry` | Off-by-one direction | No expiry check |
| Lazy cleanup | Removes expired entry inside `get()` | Returns None but doesn't remove | Eager cleanup attempt that breaks thread safety |
| Double-delete | `get` handles case where key already removed between check and delete | Not considered | Race condition that crashes |
| Code quality | Clean, readable, correct variable names | Minor naming issues | Confusing structure |

**OpenClaw debrief:**
> Let me tell you what separates the thread-safe TTL cache from a naive implementation.
>
> The subtle bug: in `get`, you check if the key is expired, then delete it, then return None. But between the expiry check and the delete, another thread's `get` might have already deleted it. So `del self._store[key]` will raise `KeyError`. The fix: use `self._store.pop(key, None)` — atomic from the dict's perspective, doesn't raise on missing.
>
> More subtly: should the lock cover the *entire* `get` body including the expiry check? Yes. If you release the lock between "check expiry" and "read value," another thread's `set` could update the value and extend the TTL — you'd return the old value and incorrectly delete the new entry.
>
> The key insight: read-check-act is a 3-step operation. It must be atomic. The lock wraps all three.
>
> Tomorrow: behavioral simulation. Full Hiring Manager format. Then Thursday is a surprise.

---

### Day 2 (Tue) — Behavioral Story Practice: Full HM Simulation

**Format:** Behavioral Story Practice | **Key skill:** Sustained behavioral performance under sequential pressure

---

**OpenClaw opening:**
> **Day 2, Week 17 — Behavioral: Hiring Manager Simulation**
>
> Full simulation. I'll ask 3 questions in sequence with no pause between them — just like the actual HM round. After each answer, I may push back. Hold your position if you're right. Update it if my pushback is valid.
>
> No notes. Answer from memory. You have 25 minutes total.
>
> Ready?
>
> ---
>
> **Question 1:** Walk me through a significant technical project you owned from start to finish. What made it significant, and what would you do differently?

**Target time:** 7–8 min per question (OpenClaw manages pacing)

**OpenClaw follow-up after Q1:**
> You said [THEIR KEY DECISION]. I'd push back: couldn't you have just [SIMPLER ALTERNATIVE]? Why did you go with the more complex approach?
>
> *(Internally: they should defend with specific constraints or context. If they immediately capitulate, note it. Good response: "The simpler approach would have worked except for [specific constraint] — here's why that mattered." Capitulation response: "Yeah, you're right, we probably over-engineered it.")*

**Question 2:**
> Tell me about a production incident you personally owned. How did you diagnose it, and what was the root cause?

**OpenClaw follow-up after Q2:**
> How long did the incident last? How many users were affected? Be specific.
>
> *(Internally: they should have specific numbers. "Some users" or "a while" → push harder. Good: "About 3 hours, affecting ~15% of API traffic in the EU region.")*

**Question 3:**
> You're working on a new feature and you identify two possible implementation approaches: one is elegant but takes 3x longer to implement, one is simple but has a known limitation you'd need to document. Which do you pick, and how do you make that call?

**OpenClaw follow-up after Q3:**
> Your manager says: the elegant version will be easier to extend later. Stick with the simple one at your own risk. What do you do?
>
> *(Internally: they should hold position or update with a specific reason, not just defer to authority. The Hiring Manager round literally tests this — the winning answer from the interview brief was "the simpler one." They should defend the simple choice.)*

**OpenClaw debrief:**
> Here's what I observed. [Deliver specific feedback on: specificity of numbers, whether they held position on at least one pushback, whether the stories had a clear arc — problem/decision/outcome.]
>
> The pattern that fails HM rounds: answers that sound good but have no specifics. "We had scaling issues" is not a story. "We were hitting 8,000 requests/second with a MongoDB query that was doing a full collection scan every 30 seconds — 3 minutes of debugging in Datadog showed us the explain plan" — that's a story.
>
> Tomorrow: targeted weak-area kata. Thursday: surprise mock.

---

### Day 3 (Wed) — Code Kata or Concept Deep Dive: Weakest Skill Target

**Format:** Code Kata (if algorithmic gap) or Concept Deep Dive (if system design gap) | **Key skill:** Gap elimination

---

**OpenClaw opening:**
> **Day 3, Week 17 — Targeted Session**
>
> Based on your Phase 4 debrief, today targets: **[WEAK_SKILL_FROM_WEEK_16_DEBRIEF]**
>
> *(OpenClaw selects from these based on actual gap data:)*

**Option A — if CONCURRENCY gap remains:**
> **Kata: asyncio Producer-Consumer with Backpressure**
>
> Without looking anything up: implement an async producer-consumer where the producer slows down when the queue is full.
>
> ```python
> import asyncio
>
> async def producer(queue: asyncio.Queue, items: list[str]) -> None:
>     """Put all items into queue. If queue is full, wait."""
>     ...
>
> async def consumer(queue: asyncio.Queue, results: list[str]) -> None:
>     """Process items until queue is empty and producer is done."""
>     ...
>
> async def main():
>     queue = asyncio.Queue(maxsize=5)  # bounded
>     results = []
>     await asyncio.gather(
>         producer(queue, ["item1", "item2", ..., "item20"]),
>         consumer(queue, results)
>     )
>     return results
> ```
>
> You have 20 minutes. Talk through `queue.task_done()` and `queue.join()` — when does `consumer` know to stop?

**Option B — if GRAPH ALGORITHMS gap remains:**
> **Kata: Topological Sort with Node Weights**
>
> You have a task dependency graph where each task has a duration. Find the critical path — the longest dependency chain by total duration.
>
> ```python
> def critical_path(tasks: dict[str, int], deps: dict[str, list[str]]) -> tuple[int, list[str]]:
>     """
>     tasks: {task_name: duration_seconds}
>     deps: {task_name: [tasks_that_must_finish_first]}
>     Returns: (total_critical_duration, [tasks_in_critical_path_order])
>     """
>     ...
> ```
>
> Example: tasks = {"A": 3, "B": 2, "C": 5, "D": 1}, deps = {"C": ["A", "B"], "D": ["C"]}
> Critical path: A → C → D (3 + 5 + 1 = 9). B is not on the critical path.
>
> You have 20 minutes. This requires topological order + DP on the DAG.

**Option C — if LLM INFRA gap remains:**
> **Concept Deep Dive: KV Cache Eviction Under Preemption**
>
> I'll ask you questions. Answer in your own words — no notes.
>
> - When a new request arrives and VRAM is full, what are the four strategies for making space?
> - What's the cost of "abort and restart" vs "preempt and swap to CPU RAM"?
> - If you're using LRU eviction on KV cache slots, what's the worst-case request pattern that causes maximum thrashing?
> - vLLM uses reference counting on pages. A page is freed when its ref count hits zero. What holds a reference — the sequence, the block table, or both?
> - Design a simple free-list allocator for KV cache pages in 10 lines of Python pseudocode.

**Target time:** 20–25 min

**OpenClaw debrief:** Specific to the option delivered — key insight, what to remember, what to do if this comes up in an interview.

> Tomorrow is a surprise mock. No preview. That's the point.

---

### Day 4 (Thu) — Mock Pressure Round: Surprise

**Format:** Mock Pressure Round | **Key skill:** Resilience under uncertainty — the Phase 3-4 bank, no preview

---

**OpenClaw opening:**
> **Day 4, Week 17 — Surprise Mock**
>
> No preview. 30 minutes. Here's today's problem.
>
> ---
>
> **Problem: Connection Pool**
>
> Implement a thread-safe connection pool:
>
> ```python
> class ConnectionPool:
>     def __init__(self, max_connections: int, connect_fn: callable):
>         """
>         max_connections: maximum total connections (in-use + idle)
>         connect_fn: a callable that returns a new connection object
>         """
>         ...
>
>     def acquire(self) -> object:
>         """Return an available connection. If none available and below max,
>         create a new one. If at max, BLOCK until one is returned."""
>         ...
>
>     def release(self, conn: object) -> None:
>         """Return a connection to the pool for reuse."""
>         ...
>
>     def close_all(self) -> None:
>         """Close all connections and prevent new acquires."""
>         ...
> ```
>
> This is used by 20 threads concurrently. `acquire()` must block (not busy-wait) when all connections are in use.
>
> Say "ready" to start the clock.

**Target time:** 30 min

**Timer management (internal):**
- At 8 min: "Check in: what synchronization primitive handles the blocking requirement?"
- At 20 min: "10 minutes. Is `close_all` handled? What if a thread calls `acquire` after `close_all`?"
- At 30 min: "Time."

**OpenClaw mid-session edge case (throw at ~15 min):**
> Side question while you code: what happens if `connect_fn()` raises an exception — connection to the DB fails? Should `acquire` propagate that exception? Should it retry? What should the pool count be after a failed `connect_fn`?

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Blocking acquire | `threading.Semaphore` or `threading.Condition` — no busy-wait | Semaphore with correct count | `while True: try to get... sleep(0.01)` |
| Thread safety | Lock on all state-modifying operations | Lock on acquire/release | No lock |
| Failed connect_fn | Doesn't corrupt pool count (Semaphore.release not called on failure) | Not handled | Pool count permanently wrong |
| close_all | Sets closed flag, existing waiters unblocked or raise | Sets flag only | Not implemented |
| Connection reuse | `release` puts back into idle pool before releasing Semaphore | Returns to pool correctly | Creates new connection on every acquire |

**OpenClaw debrief:**
> The key here is `threading.Semaphore(max_connections)`. The semaphore count represents available permits — start at `max_connections`. `acquire()` calls `sem.acquire()` (blocks if 0). `release()` calls `sem.release()`. The idle pool (a list) and the semaphore are separate: you might have 0 idle connections but Semaphore > 0 (meaning: create a new one).
>
> The failed-connect-fn bug: if you call `sem.acquire()` first, then `connect_fn()` raises, you've consumed a slot you never used. Fix: call `connect_fn()` inside a try/except, and only consume the semaphore slot on success — or release it on failure.
>
> Tomorrow: OA Problem 1 simulation. 45 minutes. LRU Cache from scratch — production quality. This is the full OA time scale.

---

### Day 5 (Fri) — Mock Pressure Round: OA Problem 1 Simulation (45 min)

**Format:** Mock Pressure Round (extended) | **Key skill:** Sustained output at full OA time scale; production-quality LRU from scratch

---

**OpenClaw opening:**
> **Day 5, Week 17 — OA Problem 1 Simulation: 45 Minutes**
>
> This is the real OA format. 45 minutes, one problem. Production quality expected: thread safety, error handling, complexity comments, clean code. This is literally what Anthropic sends candidates.
>
> No AI. No search. I'll check in at 15 and 30 minutes.
>
> ---
>
> **Problem: LRU Cache — Production Quality**
>
> Implement an LRU (Least Recently Used) cache. Requirements:
>
> - `get(key: str) -> Optional[Any]`: return value if present and not expired; return None otherwise
> - `put(key: str, value: Any) -> None`: insert or update key. If at capacity, evict the least recently used entry first.
> - `delete(key: str) -> bool`: remove key if present; return True if deleted, False if not found.
> - `size() -> int`: return current number of entries.
> - Thread-safe: all methods callable from multiple threads concurrently.
> - O(1) average time complexity for get and put.
>
> Do NOT use `collections.OrderedDict`. Implement the underlying doubly linked list yourself.
>
> Add a brief comment to each method noting its time complexity.
>
> Say "ready" to start the 45-minute clock.

**Target time:** 45 min

**Timer management (internal):**
- At 15 min: "15 minutes in. Where are you? I expect the DLL layer (insert/remove) to be working."
- At 30 min: "30 minutes. DLL + dict should be integrated. Thread safety should be in. If you're not there, prioritize correctness over completeness — a working `get` + `put` with correct eviction is better than a broken full implementation."
- At 40 min: "5 minutes. Wrap up. Make sure `delete` and `size` are there even if rough."
- At 45 min: "Time."

**OpenClaw mid-session edge cases (throw at ~25 min):**
> Quick one while you code — don't stop: `put` is called with a key that already exists. Does your implementation update the value AND move it to MRU position? Check both paths: update-existing and insert-new.

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| DLL implementation | Sentinel head/tail, correct insert/remove with pointer updates | Works but no sentinel (edge cases possible) | DLL broken |
| O(1) get | Hash map lookup + DLL move to head | Correct but O(n) | Missing hash map |
| O(1) put | Hash map insert + DLL add, evict tail — correct when key exists too | Correct for new key, broken for existing | O(n) or incorrect eviction |
| Thread safety | Single lock wrapping all operations | Lock on some operations | No lock |
| Update-existing-key | Both value updated AND moved to MRU | Only one of the two | Neither |
| delete | Removes from both dict and DLL | Removes from dict only (DLL leak) | Not implemented |
| Complexity comments | Present and correct | Present but wrong | Missing |
| Code quality | Production-ready, readable | Minor issues | Confusing |

**OpenClaw debrief:**
> Production-quality LRU from scratch is the highest-signal problem in the OA. Let me tell you what Anthropic is actually evaluating:
>
> **The sentinel node pattern.** Without sentinel head/tail nodes, every insert and remove has 4–6 edge cases (empty list, single element, insert at head, insert at tail). With sentinels, they all collapse to the same 4-pointer update. An interviewer reading your code can instantly tell whether you know this.
>
> **The update-existing-key symmetry.** `put` has two code paths: insert new, or update existing. Update requires: update the value in the existing node AND move it to the MRU position. This is the bug that kills otherwise-correct implementations. Both paths end with: the key's node is at the MRU position.
>
> **Thread safety scope.** A single lock on the entire cache is correct here. Don't try to get clever with read-write locks unless you know the exact semantics — the overhead isn't worth the complexity.
>
> Tomorrow: debrief week. Sunday: rest (mandatory).

---

### Day 6 (Sat) — Review & Reflect: Week 17 Trend Analysis

**Format:** Review & Reflect | **Key skill:** Meta-pattern recognition across 3 mocks

---

**OpenClaw opening:**
> **Day 6, Week 17 — Review: Trend Analysis**
>
> Three mocks this week. Let's look at the pattern.
>
> For each of Monday's, Thursday's, and Friday's mocks, tell me:
> 1. What was your verdict? (Pass / Conditional Pass / Fail)
> 2. What was the specific thing that wasn't right?
> 3. Is the same gap showing up across more than one mock?
>
> I'll ask, you answer. 20 minutes.

**OpenClaw prompts (sequential):**
> Monday (TTL Cache): what verdict would you give yourself and why?

*(Wait for answer, then:)*
> Thursday (Connection Pool): same question.

*(Wait for answer, then:)*
> Friday (LRU from scratch): same question. And be honest — production quality means it would ship as-is. Would yours?

*(After all three, deliver:)*
> Here's the pattern I'm looking for: if the same gap appears in 2 out of 3 mocks, that's not bad luck. That's a structural gap. Name it. What is the one thing, if you fixed it, that would move all three mocks from conditional-pass to pass?

**OpenClaw close:**
> Good. Write that gap down. Wednesday next week is your chance to close it.
>
> Tomorrow: rest. Mandatory. Phase 5 is high intensity and recovery is part of training.

---

### Day 7 (Sun) — Rest

> **Day 7, Week 17 — Rest**
>
> No session today. Phase 5 is designed with recovery built in. The rest days are not optional.
>
> See you Monday.

---

## WEEK 18: Full OA Simulation + Behavioral Refinement

**This week's arc:** Monday is the full OA Problem 1 again — 45 minutes, no shortcuts. Thursday is OA Problem 2 (Task Management System) — also 45 minutes. These are the two problems that appeared in the actual Anthropic OA. Tuesday refines your weakest behavioral story. Wednesday targets whatever gap Week 17 identified. Friday is a debrief of both OA simulations. Saturday: all 3 behavioral stories back-to-back from memory.

---

### Day 8 (Mon) — Mock Pressure Round: Full OA Problem 1 (45 min)

**Format:** Mock Pressure Round (extended) | **Key skill:** OA Problem 1 benchmark — LRU from scratch at full time scale

---

**OpenClaw opening:**
> **Day 8, Week 18 — OA Problem 1 Simulation**
>
> Same problem as last Friday, fresh. No shortcuts because you've done it before — this time I want production quality AND I want to see you talk through your approach for 3 minutes before touching code.
>
> 45 minutes.
>
> ---
>
> **Problem: LRU Cache — Production Quality** *(same as Week 17 Day 5)*
>
> *(Identical problem statement — repetition is the point)*
>
> New requirement this week: before you code, spend exactly 3 minutes talking through your approach. Explain: data structures, complexity targets, thread safety plan, edge cases you anticipate. Then code.
>
> Say "ready" to start.

**Target time:** 45 min (3 min planning + 42 min coding)

**Timer management (internal):**
- At 3 min: "Good — now code."
- At 20 min: "20 minutes. DLL layer done?"
- At 35 min: "10 minutes. Lock in place?"
- At 45 min: "Time."

**OpenClaw mid-session edge case (throw at ~30 min, harder this week):**
> While you're building: what if capacity is 0? Should `put` raise immediately? And: what if two threads call `put` with the same key at the same time? Both see it doesn't exist, both try to insert — what does your lock guarantee?

**Evaluation criteria:**
Same as Week 17 Day 5, but the bar is strictly "pass" — conditional pass this week means retry.

**OpenClaw debrief:**
> How did this compare to Friday? Faster? Slower? Cleaner?
>
> The 3-minute upfront plan is not wasted time. The interviewers at Anthropic watch that planning phase. They're checking: do you see the shape of the problem before you touch code? A candidate who codes immediately often backtracks at minute 25. A candidate who plans for 3 minutes usually has a clean final implementation.
>
> Specifically: did your plan name "sentinel nodes" and "two structures: dict + DLL"? If yes — you have the right shape. If you got there by fumbling mid-code, that's what the plan practice is for.

---

### Day 9 (Tue) — Behavioral Story Practice: Specificity Drilling

**Format:** Behavioral Story Practice | **Key skill:** Specificity — remove all vague language

---

**OpenClaw opening:**
> **Day 9, Week 18 — Behavioral: Specificity Drilling**
>
> Based on last week's HM simulation, your weakest story is **[WEAKEST_STORY_FROM_WEEK_17]**.
>
> We're going to deliver it 3 times. Each time, I'll identify the vaguest phrase and push you to replace it with a specific.
>
> Round 1: tell the story naturally.

**OpenClaw between rounds:**
> Round 1 complete. The vaguest phrase: "[QUOTE_VAGUE_PHRASE]". What's the specific? Number, date, system name, user count — something concrete.
>
> Round 2: tell it again with that specific included.

*(After Round 2:)*
> Better. Now: "[SECOND_VAGUE_PHRASE]" — same problem. Round 3 with both specifics.

**Vague phrases to listen for (internal, OpenClaw flags these):**
- "at some point" → when exactly? what day/sprint/quarter?
- "some users" → how many? what percentage?
- "faster" → how much faster? what was the before/after metric?
- "we decided" → who decided? was it you? was it a discussion?
- "it worked out" → what was the outcome? was it measured?
- "complex problem" → what made it complex? what specifically was hard?

**OpenClaw close:**
> Story 3 is noticeably stronger. Here's the rule: every STAR story needs at least 2 concrete specifics — one in the Situation/Task, one in the Result. Numbers, dates, names, systems. Not "a production issue" — "the auth service was returning 503s for 18 minutes."
>
> Tomorrow: targeted gap session. Thursday: OA Problem 2.

---

### Day 10 (Wed) — Targeted Gap Session

**Format:** Code Kata or Concept Deep Dive | **Key skill:** Close the structural gap identified in Week 17

---

**OpenClaw opening:**
> **Day 10, Week 18 — Gap Target: [GAP_FROM_WEEK_17_RR]**
>
> Last Saturday you named a gap. Today we close it.

**Option A — Thread safety structural gap (most common at this stage):**
> **Kata: Lock Ordering and Deadlock Prevention**
>
> You have two resources, each guarded by its own lock. A `transfer(from_account, to_account, amount)` function needs to acquire both locks. How do you prevent deadlock?
>
> ```python
> class Account:
>     def __init__(self, balance: float):
>         self.balance = balance
>         self.lock = threading.Lock()
>
> def transfer(src: Account, dst: Account, amount: float) -> bool:
>     """Transfer amount from src to dst. Thread-safe. No deadlock.
>     Return False if src has insufficient funds."""
>     ...
> ```
>
> There are 10 threads calling `transfer` in random directions. Explain the deadlock scenario, then fix it. 20 minutes.

**Option B — asyncio mental model gap:**
> **Kata: asyncio.Semaphore + asyncio.gather + Exception Handling**
>
> Implement a batch URL fetcher: fetch all URLs concurrently (max 5 at once), collect results, handle individual failures gracefully (failed URL → error string, not crash):
>
> ```python
> async def fetch_all(urls: list[str], max_concurrent: int = 5) -> list[str | Exception]:
>     """Return list where each element is either the page content or the exception.
>     Never raises — all exceptions are captured per-URL."""
>     ...
> ```
>
> The key: `asyncio.gather(*coros, return_exceptions=True)`. Know when to use it. 20 minutes.

**Option C — System design depth gap:**
> **Concept Deep Dive: Autoscaling — The Interview Answer**
>
> I'm going to ask you the exact question from the System Design round. Answer without notes. Then I'll push back, and you'll defend.
>
> "You're running an LLM inference service. GPU utilization looks fine — 70%. But your p99 latency is 30 seconds. What's happening, and what metric should you actually be scaling on?"
>
> Answer. Then I push back: "But GPU util is the standard metric. Everyone uses GPU util. Why do you think you're smarter than the industry?"

**Target time:** 20–25 min

---

### Day 11 (Thu) — Mock Pressure Round: Full OA Problem 2 (45 min)

**Format:** Mock Pressure Round (extended) | **Key skill:** OA Problem 2 benchmark — Task Management System at full time scale

---

**OpenClaw opening:**
> **Day 11, Week 18 — OA Problem 2 Simulation: 45 Minutes**
>
> The second OA problem. Task Management System with dependencies, cascading cancellation, and cycle detection. This is the full OA Problem 2 — the one that trips people on cascading and cycle semantics.
>
> 3 minutes to plan, then code. 45 minutes total.
>
> ---
>
> **Problem: Task Management System — Production Quality**
>
> Implement a task management system where tasks can have dependencies:
>
> ```python
> class TaskManager:
>     def create_task(self, task_id: str, dependencies: list[str]) -> None:
>         """Create task. Raises ValueError if any dependency doesn't exist
>         or if adding this task would create a circular dependency."""
>         ...
>
>     def complete_task(self, task_id: str) -> None:
>         """Mark task as COMPLETE. Raises ValueError if dependencies aren't all COMPLETE."""
>         ...
>
>     def cancel_task(self, task_id: str) -> list[str]:
>         """Cancel task and all tasks that depend on it (transitively).
>         Returns list of all cancelled task IDs (including the original).
>         Already-cancelled tasks are skipped silently."""
>         ...
>
>     def get_status(self, task_id: str) -> str:
>         """Returns 'PENDING', 'COMPLETE', or 'CANCELLED'. Raises KeyError if not found."""
>         ...
>
>     def get_ready_tasks(self) -> list[str]:
>         """Return all PENDING tasks whose dependencies are all COMPLETE."""
>         ...
> ```
>
> States: PENDING → COMPLETE or CANCELLED. CANCELLED and COMPLETE are terminal.
>
> Add time complexity comments for `create_task` and `cancel_task`.
>
> Say "ready" to start.

**Target time:** 45 min (3 min planning + 42 min coding)

**Timer management (internal):**
- At 3 min: "Planning done — code."
- At 15 min: "Where are you? `create_task` done?"
- At 30 min: "15 minutes. `cancel_task` with cascading implemented?"
- At 45 min: "Time."

**OpenClaw mid-session edge case (throw at ~25 min):**
> While you code: `cancel_task("A")`. Task B depends on A, Task C depends on B. But C is already CANCELLED from a previous call. Your cascade reaches C — what happens? Should it error? Re-cancel? Skip silently?

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Cycle detection | DFS with gray/black coloring OR reverse build check in `create_task` | Detects cycles but O(V²) | No cycle detection |
| Cascading cancel | BFS/DFS through reverse-dependency edges | BFS through forward edges (wrong direction) | Only cancels direct dependents |
| Already-cancelled idempotency | `if status != 'CANCELLED': cancel` | Cancels and adds to result even if already cancelled | Crashes on already-cancelled |
| complete_task validation | Checks all dependencies are COMPLETE | Checks some dependencies | No validation |
| get_ready_tasks | Correct: PENDING + all deps COMPLETE | Correct but O(n²) | Missing |
| Data structures | Adjacency list + reverse adjacency list for both forward/backward traversal | Only forward edges (makes cancel harder) | No graph representation |

**OpenClaw debrief:**
> The TMS has two graph traversal directions you need to keep track of: forward edges (A → B means "B depends on A") and reverse edges (A → B means "A's cancellation should reach B"). Most implementations only build the forward graph and then struggle with cascade.
>
> Build both: `deps[task_id] = [task_ids_this_depends_on]` and `dependents[task_id] = [tasks_that_depend_on_this]`. Cascade uses `dependents`. Dependency validation uses `deps`.
>
> The cycle detection in `create_task` is the classic DFS with gray/black state. If you reach a gray node during DFS, you found a cycle.
>
> Tomorrow is a debrief day, not a mock. Saturday: all 3 behavioral stories from memory.

---

### Day 12 (Fri) — Review & Reflect: OA Simulation Debrief

**Format:** Review & Reflect | **Key skill:** Production-quality self-evaluation against real OA bar

---

**OpenClaw opening:**
> **Day 12, Week 18 — OA Debrief: Both Problems**
>
> You've now done both OA problems at full scale (45 min each). Let's evaluate them honestly — not "did it work" but "would it ship."
>
> For each problem, I'll ask:
> - Would this pass the Anthropic OA bar? (Strict yes/no — conditional doesn't count here)
> - What specifically would a code reviewer flag?
> - What would you add given 5 more minutes?
>
> LRU Cache first.

**OpenClaw prompts:**
> For your LRU Cache: imagine a senior Anthropic engineer is reviewing it. What's the first thing they'd comment on?

*(Wait, then:)*
> Was thread safety complete? Both `get` and `put` and `delete` all under the lock? What about `size`?

*(Then:)*
> Task Management System: same question — what would they flag?

*(Then:)*
> The cascade in `cancel_task`: did your BFS use the reverse-dependency graph? Or were you traversing forward and getting lucky?

*(Close with:)*
> Here's my assessment of where you stand on the OA: [HONEST ASSESSMENT]. The OA is pass/fail. If both problems need to be production-quality in 90 minutes total, and each of yours took 45 minutes with [gap noted], that's [on track / not yet there].
>
> The honest version of interview prep: if both problems are at conditional-pass now, they'll likely be at pass after 2 more weeks of this. If either is at fail, we need a different plan for next week.

---

### Day 13 (Sat) — Behavioral Story Practice: All 3 Stories Without Notes

**Format:** Behavioral Story Practice | **Key skill:** Story fluency — deliver all 3 from memory in 25 minutes

---

**OpenClaw opening:**
> **Day 13, Week 18 — Behavioral: Full Story Run**
>
> All 3 stories. Back-to-back. No notes. I'll time you at 25 minutes total — average 7–8 minutes per story, because that's the actual HM round format.
>
> After all three, you'll tell me which one was weakest and why.
>
> Story 1 — go.

**OpenClaw between stories:**
> *(No pause — immediately after S1 ends:)* Story 2.
>
> *(No pause after S2:)* Story 3.

**OpenClaw after all three:**
> Which was weakest?
>
> *(Listen to their answer, then:)*
>
> I agree / I'd actually say [DIFFERENT STORY] was weaker because [SPECIFIC REASON — vagueness, missing outcome, unclear decision].
>
> Here's the test: could I retell your stories based on what you just told me? If yes — they're specific enough. If not — there's still work to do.

---

### Day 14 (Sun) — Rest

> **Day 14, Week 18 — Rest**
>
> Tomorrow is Round 1 simulation with live edge cases. Be rested.

---

## WEEK 19: Coding Round 1 + System Design Mock

**This week's arc:** The two highest-stakes interview rounds, simulated at full length. Monday is the async web crawler simulation with OpenClaw playing a live interviewer and throwing edge cases mid-session. Wednesday is the LLM inference API system design — 30 minutes, all 4 areas, no prompting. Thursday is the stack profiler problem simulating Round 4 fatigue conditions. Friday is a gap debrief. Saturday: deep-dive on whichever system design area needed the most prompting Wednesday.

---

### Day 15 (Mon) — Mock Pressure Round: Full Web Crawler Simulation (Round 1)

**Format:** Mock Pressure Round | **Key skill:** Round 1 simulation with live interruptions — async crawler, all features

---

**OpenClaw opening:**
> **Day 15, Week 19 — Round 1 Simulation: Web Crawler**
>
> This is the Coding Round 1 interview. I'm playing the Anthropic interviewer. You have 30 minutes. I'll ask why questions, throw edge cases, and escalate complexity mid-session — just like the real thing.
>
> The same rules as the real interview: talk while you code. I want to hear your thinking.
>
> ---
>
> "Let's build a web crawler. Start with the basics: given a seed URL and a max depth, crawl the web from there. Don't visit the same URL twice. How would you build it?"
>
> *(This is the opening — not a formal problem statement. They should ask clarifying questions.)*

**Timer management (internal):**
- At 5 min: "Looks like you're getting started. Before you go too far — how are you handling depth tracking?"
- At 15 min: "Good. Now let's make it concurrent. I want max K pages fetched at once."
- At 22 min: "Edge case: what if a page redirects to a URL you've already visited? How does your visited set handle that?"
- At 28 min: "One more: what if the page takes 30 seconds to respond? Does your crawler hang?"
- At 30 min: "Time. Walk me through what you built."

**Live edge cases (throw these in order as session progresses):**
1. At ~12 min (after basic BFS is in place): "What if I give you a relative URL like `/about` instead of `https://example.com/about`? How do you normalize it?"
2. At ~18 min (after semaphore added): "What's your semaphore limit set to? Why that number? What happens if it's 1? What happens if it's 1000?"
3. At ~23 min: "What if two URLs resolve to the same page — `http://example.com` and `https://example.com`? Are they the same? How do you decide?"
4. At ~27 min: "robots.txt — do you know what that is? Should your crawler respect it? How would you add that?"

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| BFS foundation | Correct, depth tracking via tuple `(url, depth)` | Correct BFS, awkward depth tracking | DFS or no graph traversal |
| Visited-on-enqueue | Yes | Visited-on-dequeue (mentioned the bug, explained it) | Visited-on-dequeue without awareness |
| asyncio.Semaphore | Correct `async with sem:` inside fetch coroutine | Semaphore placed incorrectly (outside gather) | No rate limiting |
| Relative URL handling | `urllib.parse.urljoin(base_url, relative_url)` | Mentioned but not implemented | Not addressed |
| Timeout handling | `asyncio.wait_for(fetch_page(url), timeout=N)` | Mentioned timeouts but not implemented | Not addressed |
| Communication | Narrates decisions continuously | Narrates occasionally | Silent |
| Clarifying questions | Asked at least 2 good clarifying questions | Asked 1 | No clarifying questions |

**OpenClaw debrief:**
> Here's the breakdown from a Round 1 perspective.
>
> **The escalation test:** Round 1 deliberately escalates. The interviewer starts simple and adds requirements as you go. The question is not "can you build a crawler?" but "can you build incrementally, cleanly, without having to throw away what you built?" Did adding the semaphore require rewriting your BFS? It shouldn't — the semaphore goes inside the fetch coroutine, orthogonal to the BFS logic.
>
> **The edge cases:** relative URLs and timeout handling are the two most common places candidates get stuck in Round 1. `urllib.parse.urljoin(base, relative)` is the tool for relative URLs. `asyncio.wait_for(coro, timeout=N)` + handling `asyncio.TimeoutError` is the tool for timeouts.
>
> **The robots.txt question:** The interviewer isn't asking you to implement it. They're checking whether you know it exists and can reason about where it fits. "Yes — you fetch `{domain}/robots.txt` first, parse the `Disallow` rules, and filter URLs before enqueuing" is a complete answer.

---

### Day 16 (Tue) — Behavioral Story Practice: HM Decision Scenario

**Format:** Behavioral Story Practice | **Key skill:** Pick simple, defend it, don't fold under managerial pressure

---

**OpenClaw opening:**
> **Day 16, Week 19 — Behavioral: Two-Approach Scenario**
>
> The Hiring Manager round has a signature question: present two approaches, pick one, defend it. From the actual interview: the winning answer was the simpler one. "Flexibility you don't need yet is just complexity you pay for now."
>
> Here's today's scenario:
>
> ---
>
> "You're building a new API endpoint that fans out to 3 internal services. You have two options:
>
> Option A: Sequential calls. Simple, debuggable, latency = sum of all 3 service latencies.
>
> Option B: Concurrent calls with asyncio.gather. More complex, latency = max of the 3 latencies, but harder to reason about errors.
>
> Which do you pick, and why?"

**OpenClaw after their answer:**
> *(If they picked Option A — the simpler choice:)*
> Your tech lead says: Option B is what everyone expects in a high-performance system. Why are you choosing the slower option?
>
> *(If they picked Option B — the complex choice:)*
> Your tech lead says: Option B is clever but your team has 3 junior engineers who've never used asyncio. Is this really the right call?

**What OpenClaw is evaluating (internal):**
- Did they pick based on the actual constraints (what are the latency requirements? what's the team's asyncio comfort?) or did they just say "concurrent is always better"?
- When pushed back on, do they hold the position with a reason or immediately defer?
- Strong answer for Option A: "Sequential is correct unless the combined latency breaches an SLA. What's our p99 target? If the three services each take 50ms, sequential is 150ms total — probably fine. I'd pick concurrent only when the SLA requires it."
- Strong answer for Option B: "I'd pick concurrent but add a try/except around each gather result individually — not a single try/except around gather itself — so one service failure doesn't fail everything."

**OpenClaw close:**
> The "right" answer here is: Option A unless you have a specific latency constraint that forces Option B. "Simpler unless there's a reason to be complex" is the Anthropic engineering philosophy. When you chose [their choice], did you establish that constraint first? That's the differentiator.

---

### Day 17 (Wed) — Mini System Design: Full LLM Inference API (No Scaffolding)

**Format:** Mini System Design | **Key skill:** System design fluency without prompting — all 4 areas unprompted

---

**OpenClaw opening:**
> **Day 17, Week 19 — System Design: LLM Inference API**
>
> This is the System Design round simulation. I'm going to ask you one question and then listen. I want to hear you cover all 4 key areas without me prompting you: request handling, batching strategy, KV cache management, and autoscaling.
>
> You have 30 minutes.
>
> ---
>
> "Design an LLM inference API. We serve multiple models, thousands of requests per second, variable-length inputs and outputs. Go."

**OpenClaw behavior (internal — minimal prompting):**
- Let them talk for at least 5 minutes before any response.
- If they haven't mentioned batching by minute 8: "What happens when 100 requests arrive simultaneously?"
- If they haven't mentioned KV cache by minute 12: "Walk me through what happens on the GPU for a single request."
- If they haven't mentioned autoscaling by minute 18: "Your traffic doubles at 9am every day. How does your system respond?"
- If they haven't mentioned streaming by minute 22: "The user is waiting for a response. When do they start seeing tokens?"

**Deep-dive questions (deliver after they've covered the area, go deeper):**
- Batching: "You said dynamic batching. What's your flush trigger? Give me the exact condition."
- KV cache: "VRAM fills up mid-inference. What do you do? Compare LRU eviction vs preemption."
- Autoscaling: "Your GPU util is at 70% but your p99 latency is 45 seconds. Scale up or not? Why?"
- Streaming: "Client disconnects mid-stream. What happens to the inference job? Does it keep running?"

**Evaluation criteria:**

| Area | Pass | Conditional Pass | Fail |
|------|------|-----------------|------|
| Batching | Dynamic batching, flush trigger (time + size + memory), continuous batching concept | Dynamic batching mentioned, flush trigger vague | Static batching or no batching concept |
| KV cache | What's cached, VRAM limit, eviction policy (LRU or preemption), PagedAttention optional | KV cache mentioned, VRAM constraint not addressed | No KV cache mention |
| Autoscaling | Queue depth × token count as primary signal, not raw GPU util | "Scale on queue depth" without token weighting | Raw GPU util only |
| Streaming | SSE or WebSocket, token-by-token flush, backpressure/disconnect handling | SSE mentioned, backpressure not addressed | No streaming concept |
| Unprompted coverage | All 4 areas covered without prompts | 3 areas without prompts | 2 or fewer without prompts |

**OpenClaw debrief:**
> The System Design round is the highest-signal round in the Anthropic loop. Here's what "passing" looks like vs "conditional pass":
>
> **Pass:** All 4 areas surface without prompting. When pushed deeper, the answers are correct and specific. The autoscaling answer mentions token count, not just queue depth. The KV cache answer distinguishes preemption from abort.
>
> **Conditional pass:** Right ideas but needed prompting to get there. Or: right ideas but couldn't defend under pushback.
>
> **Fail:** Generic load balancer + GPU scaling answer. No domain-specific knowledge of how LLM inference differs from a regular web service.
>
> The key insight they test hardest: "GPU utilization can look healthy (70%) while your latency tanks because long requests are stuck behind short ones. The right signal is queue depth weighted by token count — that's a leading indicator, not a lagging one."

---

### Day 18 (Thu) — Mock Pressure Round: Stack Profiler (Round 4 Fatigue Simulation)

**Format:** Mock Pressure Round | **Key skill:** Round 4 simulation under accumulated fatigue — unfamiliar domain, full version

---

**OpenClaw opening:**
> **Day 18, Week 19 — Round 4 Simulation: Stack Profiler**
>
> Round 4 is the last coding round. By this point in the actual interview loop, you've done the OA, Coding Round 1, and System Design. You're tired. Round 4 is designed with unfamiliar domain as an additional variable.
>
> This simulates that. 30 minutes. Unfamiliar domain. Recursive edge case built in.
>
> ---
>
> **Problem: Stack Sampling Profiler → Trace Events**
>
> A sampling profiler takes a snapshot of the call stack every N milliseconds. You receive samples in order:
>
> ```python
> # Each sample is a list of function names, outermost to innermost
> samples = [
>     ["main", "process", "compute"],   # t=0
>     ["main", "process", "compute"],   # t=1
>     ["main", "process", "render"],    # t=2
>     ["main", "cleanup"],              # t=3
>     [],                               # t=4 (program ended)
> ]
> ```
>
> Convert this into trace events:
>
> ```python
> def to_trace_events(samples: list[list[str]]) -> list[dict]:
>     """
>     Each event: {"fn": name, "event": "enter"|"exit", "sample": sample_index}
>
>     enter: function appeared at this position but wasn't at this position in previous sample
>     exit: function was at this position in previous sample but isn't now
>
>     Position matters: "compute" at index 2 is a different call than "compute" at index 1.
>     """
>     ...
> ```
>
> Example output for the samples above:
> - t=0: enter main(0), enter process(1), enter compute(2)
> - t=1: (no change)
> - t=2: exit compute(2), enter render(2)
> - t=3: exit render(2), exit process(1), enter cleanup(1)
> - t=4: exit cleanup(1), exit main(0)
>
> The key: compare by **position**, not by name. A function called recursively appears at two different positions — that's two separate call entries.
>
> Say "ready."

**Target time:** 30 min

**Timer management (internal):**
- At 10 min: "How are you representing the diff between consecutive samples?"
- At 20 min: "10 minutes. Handle the final empty sample? That's exits for everything remaining."
- At 30 min: "Time."

**OpenClaw mid-session edge case (throw at ~18 min):**
> What about recursive functions? `["main", "recurse", "recurse"]` — `recurse` appears at positions 1 and 2. They're two separate stack frames. If position 1 exits but position 2 stays, you emit one exit event for position 1. Does your approach handle this? (Hint: if you're comparing by name, it doesn't.)

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Position-based comparison | Compares `sample[i]` vs `prev[i]` for each position i | Name-based set diff, handles recursion as afterthought | Name-based set diff, broken on recursion |
| Divergence point | Finds where samples first differ, emits exits from bottom up, enters from divergence down | Correct logic but produces events in wrong order | No ordering |
| Final empty sample | Emits exits for all remaining frames | Handles empty sample with special case that's inconsistent | Crashes or misses exits |
| Events correct | All events present, in correct order | Missing some exits or enters | Fundamentally wrong |
| Edge cases | Handles empty samples, identical consecutive samples, recursion | Handles recursion only | Handles nothing |

**OpenClaw debrief:**
> The position-based approach is the key insight. Compare `prev[i]` vs `curr[i]` for each index position. The divergence point is where they first differ — everything at that position and deeper in `prev` is an exit (bottom to top order), everything at that position and deeper in `curr` is an enter (top to bottom order).
>
> ```python
> # Find divergence
> i = 0
> while i < len(prev) and i < len(curr) and prev[i] == curr[i]:
>     i += 1
> # divergence_point = i
> # exits: prev[len(prev)-1 .. i] (bottom up)
> # enters: curr[i .. len(curr)-1] (top down)
> ```
>
> This handles recursion automatically because it compares positions, not names. `recurse` at position 1 and `recurse` at position 2 are never equal to each other under position comparison.

---

### Day 19 (Fri) — Review & Reflect: Final Gap Identification

**Format:** Review & Reflect | **Key skill:** Name the last remaining gaps before Week 20's full loop

---

**OpenClaw opening:**
> **Day 19, Week 19 — Debrief: What Still Needs Prompting?**
>
> This week you did Round 1 simulation (crawler), System Design mock (LLM inference), and Round 4 simulation (stack profiler). That's 3 of the 5 interview rounds.
>
> For each: what required a prompt from me that shouldn't have?
>
> I'll ask about each. Be honest — this is not the time for optimistic self-assessment. Week 20 is the full loop. I need to know where the gaps are NOW.

**OpenClaw sequential prompts:**
> Web Crawler: was there anything in the live edge cases that caught you flat-footed? (Relative URLs? Timeout? robots.txt?)

*(Wait, then:)*
> System Design: which of the 4 areas (batching, KV cache, autoscaling, streaming) required prompting from me? If none — good. If any — that's your Saturday target.

*(Wait, then:)*
> Stack Profiler: did you get the position-based insight before my mid-session hint, or after?

*(After all three, deliver:)*
> Here's my read on your Week 20 readiness: [HONEST ASSESSMENT].
>
> The remaining gaps you named — those are Saturday's work. The rest: trust the training.

---

### Day 20 (Sat) — Concept Deep Dive: Weakest System Design Area

**Format:** Concept Deep Dive | **Key skill:** Targeted depth-building on the system design area that needed prompting

---

**OpenClaw opening:**
> **Day 20, Week 19 — Deep Dive: [WEAKEST_AREA_FROM_WEDNESDAY]**
>
> *(OpenClaw selects from these based on Friday's debrief:)*

**Option A — Batching deep dive:**
> Let's go deeper on dynamic batching. No notes. I'll ask questions.
>
> - Explain continuous batching. Why does it matter that a request can *join* a batch mid-inference?
> - Your flush trigger: you said you'd flush on size or time. Give me the exact pseudocode for the scheduler loop.
> - What if a request has a 10,000-token context and another has a 100-token context? They arrive at the same time. Do you batch them together? What's the trade-off?
> - A batch is running. A new high-priority request arrives. How do you handle it?

**Option B — KV cache deep dive:**
> Let's go deeper on KV cache management.
>
> - Walk me through what physically happens when a KV cache page fills up in vLLM.
> - PagedAttention uses a block table. What does the block table contain? Who owns it?
> - Prefix caching: two requests with the same 2000-token system prompt arrive simultaneously. What happens on the first request? What happens on the second?
> - A request finishes generation. When is its KV cache freed? What does "freed" mean in PagedAttention terms?

**Option C — Autoscaling deep dive:**
> Let's go deeper on autoscaling signals.
>
> - You said "queue depth weighted by token count." Give me the exact formula. What are the units?
> - What's the lag between the signal exceeding threshold and new GPU capacity being available? How do you handle that lag?
> - Predictive vs reactive scaling: you know traffic spikes at 9am every day. How does your autoscaler use that?
> - A GPU node is underutilized — 30% GPU util, nearly empty queue. When do you scale it down? What are you risking?

**Target time:** 25 min

**OpenClaw close:**
> Tomorrow: rest. Monday: the full loop. You'll do OA Problem 1, OA Problem 2 back-to-back (90 min total), then Round 1, System Design, and HM each in their own session Tue–Thu. This is as close to the real thing as we can get. Be rested.

---

### Day 21 (Sun) — Rest

> **Day 21, Week 19 — Rest**
>
> Mandatory. Week 20 is the final simulation. Be ready.

---

## WEEK 20: Complete Mock Loop (The Final Week)

**This week's arc:** One round per day, as close to real interview conditions as possible. Monday is the full OA (both problems, 90 minutes back-to-back). Tuesday is Coding Round 1 (web crawler, 60 minutes, live interviewer). Wednesday is System Design (LLM inference, 45 minutes). Thursday is the Hiring Manager (full 45-minute format). Friday is a complete debrief: rate each simulated round pass/fail, assess trajectory.

**Tone note:** Phase 5 Week 20 is the moment of truth. OpenClaw's tone shifts to formal interviewer mode for Mon–Thu — less coaching, more evaluation. This is intentional. The candidate needs to experience the assessment dynamic before the real thing.

---

### Day 22 (Mon) — Mock OA: Both Problems Back-to-Back (90 min)

**Format:** Mock Pressure Round (extended) | **Key skill:** Full OA stamina — 90 minutes, two problems, production quality

---

**OpenClaw opening:**
> **Day 22, Week 20 — Full OA Simulation**
>
> This is the closest to the real OA we can do without CodeSignal. 90 minutes. Two problems in sequence. No AI. No search. Production quality expected: thread safety, complexity comments, error handling.
>
> I won't interrupt between problems. When you finish Problem 1, say "done" and I'll start the clock for Problem 2. The 90 minutes is total — manage your time across both.
>
> **Problem 1: LRU Cache** (aim for 40–45 minutes)
>
> *(Identical to Week 18 Day 8 — repetition is the point)*
>
> - DLL + hashmap, no OrderedDict
> - Thread-safe: get, put, delete, size
> - O(1) get and put
> - Complexity comments
> - Production quality
>
> Say "ready" to start the 90-minute clock.

**At "done" for Problem 1:**
> Good. Problem 2 starts now. Time remaining shown at 45-minute mark.

> **Problem 2: Task Management System** (remaining time)
>
> *(Identical to Week 18 Day 11)*
>
> - create_task, complete_task, cancel_task (cascading), get_status, get_ready_tasks
> - Cycle detection in create_task
> - Thread-safe (add this requirement: two threads calling cancel_task on related tasks concurrently)
> - Complexity comments

**Timer management (internal):**
- At 45 min total: "45 minutes elapsed. If you're still on Problem 1, you have the remaining time for Problem 2."
- At 75 min: "15 minutes total remaining."
- At 90 min: "Time."

**OpenClaw debrief:**
> Here's my read on the OA simulation: [VERDICT — Pass / Conditional Pass / Fail for each problem].
>
> For an actual Anthropic OA pass: both problems complete in 90 minutes, production quality, thread-safe, complexity annotated.
>
> The stamina test: Problem 2 is harder when you're already mentally tired from Problem 1. That's deliberate. The real OA does this. If your Problem 2 is significantly weaker than Problem 1, that's a stamina gap — you can address it by making Problem 1 automatic (< 35 minutes) so you have more gas for Problem 2.
>
> Tomorrow: Round 1.

---

### Day 23 (Tue) — Mock Round 1: Full Web Crawler Simulation (60 min)

**Format:** Mock Pressure Round (extended) | **Key skill:** Round 1 live simulation — interviewer mode, edge cases, escalation

---

**OpenClaw opening:**
> **Day 23, Week 20 — Coding Round 1 Simulation**
>
> I'm playing the Anthropic interviewer. 60 minutes. This is a live interview — I'll ask clarifying questions, request escalations, and throw unexpected edge cases.
>
> Unlike the practice sessions, I'm not going to explain what I'm looking for after each edge case. I'm evaluating. We debrief Friday.
>
> "Let's build a web crawler. Start simple."

*(From here, OpenClaw plays full interviewer — escalating in real-time without telegraphing what's coming)*

**Interviewer script (internal, OpenClaw uses judgment on timing):**

Phase 1 (~min 0–15): Basic implementation
- "How are you avoiding infinite loops?"
- "What's your data structure for the BFS?"
- "When do you mark something as visited?"

Phase 2 (~min 15–30): Concurrency escalation
- "This is crawling sequentially. 1000 pages at 500ms each — 8 minutes. Let's make it concurrent."
- "How many concurrent fetches? How do you control that?"
- (After semaphore is added:) "What if the semaphore limit is 1? What if it's unlimited?"

Phase 3 (~min 30–45): Edge cases
- "What if a page returns a redirect? HTTP 301 to a URL we've already visited?"
- "What if a relative URL like `/contact` shows up in the link list?"
- "What's the behavior for `asyncio.TimeoutError`? Does the URL get retried?"

Phase 4 (~min 45–55): Production quality
- "I want to add robots.txt support. Where does it fit in your architecture?"
- "How do you know when the crawler is done? What terminates the BFS?"
- "Talk me through the error handling. Where can this fail silently?"

**OpenClaw evaluation (deferred to Friday debrief):**
*(No immediate feedback — full interviewer mode)*

---

### Day 24 (Wed) — Mini System Design: Full LLM Inference API Mock (45 min)

**Format:** Mini System Design (full mock) | **Key skill:** Round 3 live simulation — unprompted coverage, defending under pushback

---

**OpenClaw opening:**
> **Day 24, Week 20 — System Design Round Simulation**
>
> This is the System Design round. I'm the interviewer. 45 minutes. I'll go deep on whatever you say — this is literally what Anthropic builds, so I know the domain.
>
> No prompts from me on what to cover. If you miss an area, that's data.
>
> "Design an LLM inference API. We need to serve multiple models, thousands of concurrent requests, variable-length inputs and outputs. Token-by-token streaming is required. Go."

**Interviewer script (internal — deep dive, not scaffolding):**

After they introduce batching:
> "You said dynamic batching. What's your exact flush condition? Give me the pseudocode for the scheduler loop."

After they introduce KV cache:
> "VRAM fills up mid-inference on a long request. Walk me through what happens. Exactly."
> "Compare LRU eviction with preemption. When do you choose one over the other?"

After they introduce autoscaling:
> "GPU utilization is at 70%. Latency is at 30 seconds. Do you scale up?"
> *(If they say no:)* "Why not? Your users are waiting 30 seconds."
> *(If they say yes:)* "But GPU util is healthy. Why add cost?"
> *(Expected answer: GPU util is a lagging indicator — scale on queue depth × token count)*

After they introduce streaming:
> "Client disconnects mid-stream. What happens to the inference? Does it keep running?"
> "How does backpressure work when a client's connection is slow?"

**OpenClaw evaluation (deferred to Friday debrief):**
*(No immediate feedback)*

---

### Day 25 (Thu) — Behavioral: Hiring Manager Simulation (45 min)

**Format:** Behavioral Story Practice | **Key skill:** Round 5 live simulation — full 45-minute format

---

**OpenClaw opening:**
> **Day 25, Week 20 — Hiring Manager Simulation**
>
> This is the HM round. 45 minutes. All question types. I'll push back on at least one answer.
>
> I'm looking for: specific stories (numbers, dates, names), clear decision rationale, and the ability to hold position when you're right.
>
> Let's start.
>
> **Question 1:** Tell me about a technical project you're proud of. What decisions did you make, and what was the outcome?

*(After Q1 + pushback:)*
> **Question 2:** Walk me through a time you disagreed with a technical direction your team was taking. What did you do?

*(After Q2:)*
> **Question 3:** You're given two ways to solve a production problem: a quick fix that introduces technical debt, or a clean solution that takes twice as long. How do you decide?

*(After Q3 + pushback — the key HM question:)*
> **Question 4:** What's the hardest debugging problem you've had to solve? How did you approach it?

*(After Q4:)*
> **Question 5:** What are you most excited to work on at Anthropic, and why?

**OpenClaw pushback moment (use on at least one answer where candidate hedged):**
> That's interesting, but [CHALLENGE THEIR CHOICE]. If [simpler alternative], why didn't you just do that?
>
> *(They should defend with reasoning — not fold)*

**OpenClaw evaluation (deferred to Friday debrief):**
*(No immediate feedback — stay in interviewer mode)*

---

### Day 26 (Fri) — Review & Reflect: Full Loop Debrief

**Format:** Review & Reflect | **Key skill:** Interview-readiness assessment — rate each round, identify trajectory

---

**OpenClaw opening:**
> **Day 26, Week 20 — Full Loop Debrief**
>
> This week you simulated the OA, Coding Round 1, System Design, and Hiring Manager. That's 4 of 5 rounds (Round 2 was covered in Phase 4; Round 4 stack profiler was Thursday of last week).
>
> Let's go round by round. For each, I'll give my verdict and you give yours. Then we discuss the delta.

**For each round:**
> **[ROUND NAME]:** My assessment: [PASS / CONDITIONAL PASS / FAIL].
>
> *(Wait for their self-assessment, then:)*
>
> Here's the specific thing I would have flagged: [SPECIFIC FEEDBACK].

**After all rounds:**
> Here's the overall picture. Interview-ready signal requires:
> - OA: both problems production-quality in 90 minutes ✓/✗
> - Round 1 (crawler): async, dedup, rate-limited, handles edge cases with prompts only ✓/✗
> - Round 3 (system design): all 4 areas unprompted, defended autoscaling ✓/✗
> - Round 5 (HM): 3 stories with specifics, held at least one position ✓/✗
>
> If 4/4 are ✓ or conditional-✓: **You're interview-ready. Phase 5 complete. Proceed to Phase 6 maintenance cadence until an interview is confirmed, then activate the ramp-up protocol.**
>
> If 3/4 are ✓: **One more targeted week — repeat the weakest round simulation + Friday debrief before declaring interview-ready.**
>
> If 2/4 or fewer: **Extend Phase 5 by 2 weeks. Repeat Weeks 19–20 with the gap areas as primary focus.**

---

### Day 27 (Sat) — Code Kata or Rest: Discretionary

**Format:** Code Kata (if gap remains) or Rest | **Key skill:** Discretionary — only if there's a targeted gap to close

---

**OpenClaw opening:**
> **Day 27, Week 20 — Optional Session**
>
> If Friday's debrief identified one remaining gap: do 20 minutes on that specific thing. Not a full mock — a targeted kata or concept review.
>
> If no gap or you're exhausted: rest. Do not force a session. Fatigued practice does not help.
>
> Your call.

*(If they do a session: OpenClaw delivers a short targeted kata from the relevant category — 15–20 min max, no timer pressure, coach mode)*

*(If they rest: "Good. See you for Phase 6.")*

---

### Day 28 (Sun) — Rest

> **Day 28, Week 20 — Rest**
>
> You've completed Phase 5.
>
> If your Week 20 debrief gave you 4/4 ✓ or ✓-conditional: you're interview-ready. Activate Phase 6 maintenance.
>
> If your debrief said "extend Phase 5": repeat Weeks 19–20 with the weak rounds as primary focus. That's not failure — that's the process working.
>
> Either way: rest today.

---

## Phase 5 Exit Criteria

OpenClaw uses this checklist at the end of Week 20 to determine interview-readiness:

### Must Pass (Hard Requirements)

| Criterion | What Passes |
|-----------|-------------|
| OA Problem 1 (LRU) | Complete in < 45 min, production quality: DLL + dict + thread-safe + complexity comments |
| OA Problem 2 (TMS) | Complete in < 45 min, production quality: cycle detection + cascading cancel + state validation |
| OA Total Stamina | Both problems complete within 90 minutes total |
| Round 1 (Web Crawler) | async BFS + dedup + semaphore + URL normalization + timeout handling; edge cases handled with ≤ 1 follow-up prompt per edge case |
| Round 3 (System Design) | All 4 areas (batching, KV cache, autoscaling, streaming) surfaced without prompting; autoscaling signal correctly identified as queue depth × token count |
| Round 5 (HM) | 3 STAR stories with ≥ 2 concrete specifics each; held position on ≥ 1 pushback with reasoning |

### Strong Signal (Should Pass)

| Criterion | What Strong Signal Looks Like |
|-----------|------------------------------|
| Verdict trajectory | 4 consecutive sessions rated conditional-pass or better going into Week 20 |
| Communication | Narrates decisions throughout coding sessions without prompting |
| Edge case reflexes | Catches ≥ 1 edge case mid-implementation before OpenClaw prompts |
| Simplicity default | When asked to choose between approaches, defaults to simpler unless given specific reason to choose complex |

### Phase 5 → Phase 6 (or Interview) Transition

- **Interview confirmed:** Activate the Interview Ramp-Up Protocol (defined in `analysis/weekly-templates.md`): 3 weeks out → Phase 5 schedule; 2 weeks out → Phase 5 + behavioral; 1 week out → light review only; day before → rest.
- **No interview yet:** Transition to Phase 6 maintenance cadence. Return to Phase 5 when interview confirmed.
- **Phase 5 extended:** Repeat Weeks 19–20 with weakest round as Monday mock. Reassess after 2 weeks.

---

## Problem Bank Reference (Phase 5 Surprise Mocks)

OpenClaw uses this table when selecting Thursday "surprise" problems in Weeks 17–19:

| Week | Thursday Problem | Category | Difficulty |
|------|-----------------|----------|------------|
| 17 | Connection Pool | Thread Safety | Hard |
| 18 | (no Thursday mock — debrief day) | — | — |
| 19 | Stack Profiler full | Algorithm / Domain | Hard |

**Backup surprise problems (for extended Phase 5 weeks):**

| Problem | Category | Key Insight |
|---------|----------|-------------|
| Async rate limiter with sliding window, per-user, reset on idle | asyncio + Thread Safety | Per-user asyncio lock; `asyncio.Lock` not `threading.Lock` |
| Graph shortest path with variable edge weights (Dijkstra) | Graph Algorithms | Dijkstra vs BFS for weighted graphs; heapq as priority queue |
| Circular buffer (fixed-size queue, overwrite oldest) | Data Structures | Head + tail pointers modulo capacity; overwrite semantics |
| Trie for autocomplete: insert + search + prefix_search | Data Structures | Trie node as dict; prefix scan is DFS from prefix node |
| Token streaming with backpressure: producer yields, consumer signals slow | asyncio | `asyncio.Condition` for backpressure; slow consumer detection |
| Distributed lock with expiry (simulate with dict + timestamps) | Thread Safety | Check-and-set atomicity; lease expiry prevents deadlock |
