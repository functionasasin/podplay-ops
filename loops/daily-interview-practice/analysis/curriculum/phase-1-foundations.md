# Phase 1: Foundations — OpenClaw Session Scripts

**Duration:** 4 weeks (28 days)
**Formats:** Code Kata (4x/week), Spec Decomposition (1x/week), Review & Reflect (1x/week), Debug & Read (1x/week)
**Target:** Core data structures and threading patterns become automatic — implemented from scratch without hesitation.

This file is the **executable curriculum** for Phase 1. OpenClaw reads this to know exactly what to say, ask, and evaluate on each of the 28 days. Every session is written as a complete OpenClaw script: opening message, exercise prompt, scoring rubric, evaluation guidance, key insight, and forward transition.

Phase 1 is about repetition and foundation-building. The same patterns (DLL, LRU, BFS, threading) appear across all 4 weeks with increasing difficulty. By Week 4, implementing an LRU cache from scratch should feel like writing a for loop.

---

## Phase 1 Opening Message

> OpenClaw sends this on Day 1 of Phase 1 (after completing Phase 0 diagnostic):

> **Phase 1: Foundations begins today.**
>
> For the next 4 weeks, we're building the mechanical bedrock. Doubly linked lists, LRU caches, BFS/DFS, threading with locks — these are the building blocks of everything Anthropic will test. By the end of Phase 1, you should be able to implement any of them from scratch without hesitation.
>
> The format: most days are Code Katas — small, focused, 20–25 minutes. One day per week is a Spec Decomposition (planning before coding). Saturday is always Review & Reflect (retrieval practice). Sunday is always Debug & Read (read unfamiliar code, find the bug).
>
> The rule: type your approach BEFORE your code. Two sentences on how you'll tackle it. Then code. This is the interview habit — build it now.
>
> Let's go. Day 1.

---

## WEEK 1: Doubly Linked List + Threading Basics

**This week's arc:** Pointer manipulation → sentinel nodes → thread safety with Lock → thread-safe stack. Foundation of the LRU cache from scratch that will appear in the OA.

---

### Day 1 (Mon) — Code Kata: DLL Node — insert_after + remove

**Format:** Code Kata | **Key skill:** Pointer manipulation order

---

**OpenClaw opening:**
> **Day 1 — Code Kata: Doubly Linked List**
>
> Today's pattern is the doubly linked list — the data structure underneath LRU cache. You'll implement it from scratch. This shows up directly in the Anthropic OA (LRU cache from scratch), so this is foundational.
>
> Kata: implement a `Node` class for a doubly linked list with:
> - `Node(value)` — stores value, `prev` and `next` default to `None`
> - `insert_after(node, new_node)` — inserts `new_node` after `node` in the list
> - `remove(node)` — removes `node` from the list (updates neighbors' pointers)
>
> No sentinel nodes today — just plain nodes.
>
> **Walk me through your approach in 2 sentences first, then write the code.**

**Target time:** 20 min total

**10-min check-in:**
> Still going? Type what you have so far — even pseudocode. We work from there.

**OpenClaw evaluation guide (internal):**
- **Strong answer:** `insert_after` correctly: sets new_node.prev = node, new_node.next = node.next, then updates node.next.prev (if exists), then node.next = new_node. Order matters — incoming pointers before outgoing.
- **Common bug:** Setting node.next = new_node before updating node.next.prev — loses the reference to the old neighbor.
- **`remove` strong answer:** node.prev.next = node.next, node.next.prev = node.prev, then optionally null out node.prev and node.next. Needs null checks at list boundaries.
- **Common bug:** Not handling when node is head (node.prev is None) or tail (node.next is None).

**OpenClaw feedback approach:**
- If insert_after has the pointer order wrong: "You set `node.next = new_node` first. What's the problem with that? Trace through it — after that line, can you still access the node that was originally after `node`?"
- If remove doesn't handle boundary nodes: "What happens if you call `remove` on the last node in the list? Trace through your code — `node.next.prev = ...` when `node.next` is None..."
- If both are correct: "Nice. Now: what's the edge case when you call `insert_after` on the last node in the list? Does your code handle it?"

**Key insight to deliver:**
> **Key insight:** When rearranging pointers in a linked list, always update the *incoming* pointer to a node before the *outgoing* pointer FROM that node. If you update outgoing first, you lose your reference to the neighbor. Think of it as: "save the address before you redirect the mail."

**Stretch question (if they finish fast):**
> What would change if you used sentinel (dummy) head and tail nodes? Where do they eliminate the boundary checks in your remove() code?

**Tomorrow preview:**
> Tomorrow: we add sentinel nodes and see exactly how they eliminate the edge cases you just handled manually.

---

### Day 2 (Tue) — Code Kata: DLL with Sentinel Nodes

**Format:** Code Kata | **Key skill:** Edge case elimination via sentinel pattern

---

**OpenClaw opening:**
> **Day 2 — Code Kata: DLL with Sentinel Nodes**
>
> Yesterday you handled boundary edge cases manually (checking for None before dereferencing). Today we eliminate those checks entirely with a cleaner design.
>
> Kata: implement a `DoublyLinkedList` class with sentinel head and tail nodes:
> - `__init__()` — creates a dummy `head` node and dummy `tail` node, links them: `head.next = tail`, `tail.prev = head`. They never hold real data.
> - `add_to_head(value)` — inserts a new node right after the sentinel head
> - `remove_tail()` — removes and returns the node just before the sentinel tail (the actual last element)
> - `remove(node)` — removes any given node
>
> **Two sentences on your approach, then code.**

**Target time:** 20 min total

**10-min check-in:**
> How's it going? Post what you have.

**OpenClaw evaluation guide (internal):**
- **Key insight to verify:** Because sentinel head/tail always exist, `node.prev` and `node.next` are never None for real nodes — sentinel absorbs the boundary case.
- **Strong remove():** Simply `node.prev.next = node.next; node.next.prev = node.prev` — no null checks needed. That's the payoff.
- **Strong add_to_head():** Create new node, link between head and head.next (the current first real node or tail). Order: set new_node.prev = self.head, new_node.next = self.head.next, then self.head.next.prev = new_node, then self.head.next = new_node.
- **remove_tail():** node = self.tail.prev; self.remove(node); return node. Handles empty list (tail.prev is head) — they should either check for this or leave it as a precondition.

**OpenClaw feedback approach:**
- If remove() still has null checks: "You're checking `if node.prev is not None` — but with sentinel nodes, is that check ever needed for a real node? Walk me through the list structure."
- If add_to_head pointer order is wrong: same teaching as Day 1 — "update incoming before outgoing."
- If they forget to set new_node.prev when inserting: "You linked new_node → head.next, but did you link head.next ← new_node?"

**Key insight to deliver:**
> **Key insight:** Sentinel nodes don't hold data — they exist to eliminate boundary conditions. With sentinel head and tail, every real node always has a non-None prev and next. Your `remove()` becomes 2 lines with no conditionals. This is why real implementations (including Python's OrderedDict) use them internally.

**Stretch question:**
> Can you spot where in your LRU cache (if you were building one) you'd call `add_to_head()` vs `remove_tail()`?

**Tomorrow preview:**
> Tomorrow we shift to threading — a Lock pattern that you'll use in every concurrent Python program.

---

### Day 3 (Wed) — Spec Decomposition: Log Line Parser

**Format:** Spec Decomposition | **Key skill:** Plan before code; ask clarifying questions

---

**OpenClaw opening:**
> **Day 3 — Spec Decomposition: Log Line Parser**
>
> Today's format is different — no code yet. Just planning. In every interview, the first 5 minutes are spec decomposition. This is what separates people who panic and code immediately from people who deliver clean solutions.
>
> Here's the spec:
>
> *"Build a function that takes a list of log lines and returns a summary of error counts per service, grouped by hour. The log format is not guaranteed to be consistent — you're working with real production logs."*
>
> **First: what questions do you have before you start coding? List them.**

**Target time:** 25 min total

**OpenClaw as product manager (answer clarifying questions):**
- "What's the log format?" → "Something like `2024-01-15 14:23:45 [ERROR] auth-service: connection refused`, but some lines might have different timestamp formats, missing fields, or extra metadata. Assume lines you can't parse should be counted in an error bucket."
- "What does 'per service' mean?" → "The service name is in the log — you define what 'service' means based on what you see."
- "What format should I return?" → "What would make sense for a caller consuming this? You decide and tell me."
- "What if there are no errors?" → "What would make sense? You decide."
- "Do I need to handle timezones?" → "Assume all timestamps are UTC."

**After clarifying questions (10 min):**
> Good. Now: give me your 5-step implementation plan. Not code — steps. In order. Each step should be one clear action.

**OpenClaw review guide (internal — what to look for in their plan):**
- **Step 1 should be:** Parse each line (handle failures gracefully — skip or count unparseable)
- **Step 2 should be:** Extract: timestamp (→ hour), service name, log level
- **Step 3 should be:** Filter for ERROR-level lines (or count all levels — they should state which)
- **Step 4 should be:** Aggregate by (service, hour) — what data structure? defaultdict(int) by (service, hour) key
- **Step 5 should be:** Return in appropriate format — they should define this

**Common gaps to probe:**
- Missing error handling for unparseable lines — "What happens to a line that's completely malformed?"
- Not defining the return format — "What does the caller get back? A dict? A list of tuples? You need to decide."
- Glossing over timestamp normalization — "You said 'group by hour' — how do you truncate a timestamp to its hour?"
- Missing case normalization — "Some services might log 'ERROR', some might log 'error'. Does your plan handle that?"

**OpenClaw extension questions:**
> Your plan says "parse each line." What if the regex doesn't match? What do you do with that line?
>
> You said "group by hour" — if a line says `14:23:45`, what's the hour key you're using?

**Key insight to deliver:**
> **Key insight:** The questions you ask before coding tell the interviewer more than the code itself. "What should I do if the timestamp is malformed?" reveals that you've thought about real data. "What format should I return?" reveals that you design for callers, not just for yourself. Ask the questions. Then decide and state your assumptions.

**Tomorrow preview:**
> Tomorrow: threading. We build a thread-safe counter using Python's `threading.Lock` — the pattern you'll use in every concurrent program.

---

### Day 4 (Thu) — Code Kata: Thread-Safe Counter with Lock

**Format:** Code Kata | **Key skill:** Critical section isolation with threading.Lock

---

**OpenClaw opening:**
> **Day 4 — Code Kata: Thread-Safe Counter**
>
> Today's pattern is the foundation of all concurrency in Python: the Lock. Every thread-safe data structure you'll build in this curriculum uses this pattern. Get it automatic.
>
> Kata: implement a `ThreadSafeCounter` class:
> - `__init__()` — initializes count to 0, creates a `threading.Lock`
> - `increment()` — increments count by 1, thread-safely
> - `decrement()` — decrements count by 1, thread-safely
> - `value()` — returns current count, thread-safely
>
> Bonus: test your intuition. If 10 threads each call `increment()` 100 times, what's the guaranteed final value without a lock? What's it with a lock?
>
> **Two sentences on approach, then code.**

**Target time:** 20 min total

**10-min check-in:**
> Where are you? Post what you have.

**OpenClaw evaluation guide (internal):**
- **Strong answer:** Uses `with self._lock:` (context manager) — not try/finally manually. The `with` statement is the right Python idiom.
- **`value()` must also hold the lock** — reads are not atomic. This is the most commonly missed thing.
- **Bonus:** Without lock: final value could be anything from 10 to 1000 (race conditions on read-modify-write). With lock: guaranteed 1000. They should reason through WHY: increment is a read + modify + write — three operations that can be interrupted.

**OpenClaw feedback approach:**
- If they don't lock `value()`: "You locked `increment()` and `decrement()` — what about `value()`? Can two threads read and get inconsistent results if you don't lock the read too?"
- If they use try/finally instead of `with`: "This works. Is there a more Pythonic pattern for lock acquisition that automatically handles exceptions?"
- If they answer the bonus incorrectly: "Walk me through what happens if two threads both read `count = 5` before either writes back. What do they each write? What's the final value?"

**Key insight to deliver:**
> **Key insight:** `with lock:` is the pattern — not manual acquire/release. The context manager guarantees the lock is released even if an exception is thrown inside the critical section. Also: reads need locks too. A variable read is not atomic in a concurrent environment — another thread can write between your read and your use of the value.

**Stretch question:**
> What's an `RLock` and when would you use it instead of `Lock`?

**Tomorrow preview:**
> Tomorrow: we build a thread-safe stack using the same Lock pattern — but with an edge case that will test your instincts.

---

### Day 5 (Fri) — Code Kata: Thread-Safe Stack

**Format:** Code Kata | **Key skill:** Lock-guarded state; empty-check edge case

---

**OpenClaw opening:**
> **Day 5 — Code Kata: Thread-Safe Stack**
>
> Building on yesterday's Lock pattern. Now we're guarding compound operations — the kind where you need to check a condition AND act on it atomically.
>
> Kata: implement a `ThreadSafeStack` class:
> - `push(item)` — pushes item onto the stack, thread-safely
> - `pop()` — removes and returns top item, thread-safely. Raise `IndexError` if empty.
> - `peek()` — returns top item without removing it, thread-safely. Raise `IndexError` if empty.
> - `is_empty()` — returns True if stack is empty
>
> The key question: does `peek()` need a lock? Think carefully before answering.
>
> **Two sentences on approach, then code.**

**Target time:** 25 min total

**10-min check-in:**
> Still going? Type what you have.

**OpenClaw evaluation guide (internal):**
- **`peek()` DOES need a lock:** Even though it's read-only, another thread could pop between the emptiness check and the actual read. The check-then-act pattern is a classic race condition.
- **`pop()` must lock the emptiness check AND the removal atomically:** Don't check `if not self._data:` outside the lock and then acquire the lock for the removal.
- **`is_empty()` also needs a lock** — same reasoning as `value()` on the counter.
- **Strong answer:** All four operations hold the lock for their entire duration. Empty checks happen inside the lock.

**OpenClaw feedback approach:**
- If they say `peek()` doesn't need a lock: "Imagine Thread A calls `peek()`, reads the length, it's > 0. Before it reads the top element, Thread B calls `pop()`. What does Thread A return? Is that a problem?"
- If they don't lock the empty check in `pop()`: "You check `if not self._data` before acquiring the lock. What if another thread pops the last element between your check and your lock acquisition?"
- Edge case throw mid-session: "What if two threads both call `pop()` at the same time on a stack with one element? Does your implementation raise IndexError for the second one, or does it crash trying to access index [-1] on an empty list?"

**Key insight to deliver:**
> **Key insight:** The most dangerous concurrency bug isn't forgetting to lock — it's locking the wrong *scope*. Check-then-act must be atomic. If you check `is_empty()` and then separately call `pop()`, another thread can empty the stack between those two operations. Lock the entire logical operation — not just the data access.

**Stretch question:**
> If `peek()` and `pop()` both hold a lock and are called from the same thread in sequence, is there a risk of deadlock? What if `pop()` internally calls `is_empty()`?

**Tomorrow preview:**
> Tomorrow is Review & Reflect — we look back at today's stack and find what we could have done better.

---

### Day 6 (Sat) — Review & Reflect: Thread-Safe Stack Deep Dive

**Format:** Review & Reflect | **Key skill:** Per-operation vs coarse-grained locking trade-off

---

**OpenClaw opening:**
> **Day 6 — Review & Reflect**
>
> Before I show you anything — describe yesterday's thread-safe stack from memory. What did you build? What was the trickiest part? Where were you unsure?

**After user recalls (2-3 min):**

> Good. Here's what I want to zoom in on: the locking granularity question.
>
> You locked each operation individually — that's coarse-grained locking. One lock for the whole stack. Let me show you the critical section for `pop()` in a strong implementation:
>
> ```python
> def pop(self):
>     with self._lock:
>         if not self._data:
>             raise IndexError("pop from empty stack")
>         return self._data.pop()
> ```
>
> Notice: the emptiness check is inside the lock. Not before it. The entire logical operation — check AND act — is atomic.
>
> **Now: does `peek()` really need its own lock, given that `pop()` already holds a lock when it modifies the stack?**

**After user answers:**
> The answer: yes, `peek()` needs a lock because it reads state, and another thread could be modifying that state concurrently — even if `pop()` has a lock, it only holds that lock while pop() is running. Between operations, the lock is released.
>
> **Gap analysis:** Was your empty-check inside or outside the lock? Knowledge gap or execution gap?

**Pattern extraction:**
> **Pattern: check-then-act must be atomic.** This shows up everywhere: LRU cache (check if key exists, then return or evict), BFS (check if node visited, then add to queue), rate limiter (check count, then increment). Every time you see a conditional followed by an action, ask: can another thread change the condition between my check and my action?

**Preview:**
> Next week: LRU cache with OrderedDict — we use everything from this week (DLL intuition + locking) to build the real thing.

---

### Day 7 (Sun) — Debug & Read: BFS with Wrong Visit Marking

**Format:** Debug & Read | **Key skill:** visited-on-enqueue vs visited-on-dequeue

---

**OpenClaw opening:**
> **Day 7 — Debug & Read**
>
> Read this BFS implementation. Tell me: (1) what it does, (2) what's wrong with it.
>
> ```python
> from collections import deque
>
> def bfs(graph, start, target):
>     queue = deque([start])
>     visited = set()
>     while queue:
>         node = queue.popleft()
>         visited.add(node)  # <-- marking visited HERE
>         if node == target:
>             return True
>         for neighbor in graph[node]:
>             if neighbor not in visited:
>                 queue.append(neighbor)
>     return False
> ```

**Target time:** 20 min total

**User explains intent (5 min):**
OpenClaw validates or corrects: "Right — it's BFS to find a target in a graph. Checking each node, adding unvisited neighbors."

**Bug finding guidance:**
- First hint (if stuck): "Think about what happens when a node has multiple paths leading to it."
- Second hint: "If node X is reachable from both A and B, and A enqueues X first — can B also enqueue X before X is dequeued and visited?"
- Third hint (explicit): "The bug: two different nodes can both add X to the queue because X isn't marked visited until it's *dequeued*. X gets processed twice — or more. In a cyclic graph, this is infinite loop territory."

**After bug is identified:**
> How would you fix it?

**Strong fix:** Move `visited.add(node)` to when the node is enqueued, not when it's dequeued:
```python
visited.add(start)  # mark before queueing
queue = deque([start])
...
for neighbor in graph[node]:
    if neighbor not in visited:
        visited.add(neighbor)  # mark BEFORE enqueue
        queue.append(neighbor)
```

**Key insight to deliver:**
> **Key insight:** Mark nodes visited *when you enqueue them*, not when you dequeue them. The queue can contain duplicates if you wait until dequeue. For a large graph with many paths to the same node, this isn't just inefficient — in cyclic graphs, it's an infinite loop. This is one of the most common BFS bugs in interview code.

**Preview:**
> Next week: we build the LRU cache. The DLL and locking patterns from this week are the foundation. Week 2 starts with OrderedDict — the easy version. Then we'll go from scratch.

---

## WEEK 2: LRU Cache (OrderedDict) + Producer-Consumer

**This week's arc:** LRU cache with stdlib (OrderedDict) → edge case (update path) → thread-safe wrapper → producer-consumer threading pattern. Building toward the from-scratch implementation in Week 3.

---

### Day 8 (Mon) — Code Kata: LRU Cache with OrderedDict

**Format:** Code Kata | **Key skill:** OrderedDict as O(1) ordered map

---

**OpenClaw opening:**
> **Day 8 — Code Kata: LRU Cache (OrderedDict version)**
>
> This week: LRU cache. Today's the "stdlib version" — using Python's `OrderedDict` which does the heavy lifting. Next week: from scratch with a real DLL.
>
> Kata: implement an `LRUCache` class:
> - `__init__(capacity)` — initializes with a fixed max capacity
> - `get(key)` → value or -1 — retrieves value, marks as recently used
> - `put(key, value)` — stores or updates value, marks as recently used, evicts LRU if over capacity
>
> Use `collections.OrderedDict`. Walk me through which OrderedDict methods you'll use and why, then code.
>
> **Two sentences on approach first.**

**Target time:** 25 min total

**10-min check-in:**
> Where are you? Post what you have.

**OpenClaw evaluation guide (internal):**
- **Key methods:** `move_to_end(key)` (marks as recently used), `popitem(last=False)` (evicts LRU — the first/oldest item).
- **`get()` must call `move_to_end`** — not just return the value. Most common miss.
- **`put()` for existing key:** must call `move_to_end` after updating the value — the update makes it recently used.
- **`put()` for new key:** add to dict, THEN check capacity and evict if needed. Order matters.
- **Strong pattern:**
  ```python
  def get(self, key):
      if key not in self.cache:
          return -1
      self.cache.move_to_end(key)
      return self.cache[key]

  def put(self, key, value):
      if key in self.cache:
          self.cache.move_to_end(key)
      self.cache[key] = value
      if len(self.cache) > self.capacity:
          self.cache.popitem(last=False)
  ```

**OpenClaw feedback approach:**
- If `get()` doesn't call `move_to_end`: "Your `get()` returns the value — but did you update the recency? What happens if this key is the LRU one and we do one more put?"
- If `put()` for existing key doesn't move to end: "If I `put()` a key that already exists with a new value, should that key now be the most recently used? Your implementation does/doesn't handle that."
- Edge case mid-session: "What happens if you call `put()` with `capacity = 1`, adding two different keys? Walk me through the eviction step."

**Key insight to deliver:**
> **Key insight:** `move_to_end(key)` is the LRU "touch" operation — it says "this key was just used." You need it in BOTH `get()` AND `put()` for existing keys. `popitem(last=False)` pops the oldest — the LRU item. This one method pair is why OrderedDict makes LRU elegant.

**Stretch question:**
> What's the time complexity of `get()` and `put()`? What makes OrderedDict O(1) for both?

**Tomorrow preview:**
> Tomorrow: the edge case in `put()` that almost everyone misses.

---

### Day 9 (Tue) — Code Kata: LRU Cache Edge Cases

**Format:** Code Kata | **Key skill:** Update ≠ insert — both need LRU update

---

**OpenClaw opening:**
> **Day 9 — LRU Cache Edge Cases**
>
> Yesterday's LRU is good. Today we stress-test it. No new implementation — instead, walk me through the behavior of your cache for each of these scenarios. If your implementation is wrong, explain how to fix it.
>
> Scenario 1: `LRUCache(2)`. `put(1, 'a')`. `put(2, 'b')`. `put(1, 'z')`. `put(3, 'c')`. What's in the cache after each operation? Which key gets evicted on the last put?
>
> Scenario 2: `LRUCache(2)`. `put(1, 'a')`. `get(1)`. `put(2, 'b')`. `put(3, 'c')`. Which key gets evicted?
>
> Scenario 3: `LRUCache(1)`. `put(1, 'a')`. `get(1)`. `put(1, 'b')`. `get(1)`. What does the last get return? Should it?
>
> Walk me through each scenario step by step. Tell me what your implementation does — and whether that's correct.

**Target time:** 20 min total

**OpenClaw evaluation (answer key internal):**
- **Scenario 1:** After put(1,'z'), key 1 moves to end (most recent). Cache is {2:'b', 1:'z'}. put(3,'c') evicts LRU = key 2. Final: {1:'z', 3:'c'}. **Common miss:** If put(1,'z') doesn't move_to_end, then key 1 appears to be LRU and gets evicted instead of key 2.
- **Scenario 2:** get(1) moves 1 to end. put(2,'b') → cache is {1:'a', 2:'b'}. put(3,'c') evicts LRU = key 1 (2 is more recent because it was just inserted). Wait — actually key 1 was most recently used via get(). So cache is {2:'b', 1:'a'} after get(1) reorders. Then put(2) → {1:'a', 2:'b'}. Then put(3) evicts LRU = 1. Final: {2:'b', 3:'c'}.
- **Scenario 3:** put(1,'a') → cache: {1:'a'}. get(1) → moves to end (same position). put(1,'b') → updates AND moves to end. get(1) → returns 'b'. Capacity never exceeded.

**Key insight to deliver:**
> **Key insight:** `put()` for an existing key has two effects: update the value AND mark as recently used. If you only update the value without calling `move_to_end`, the key keeps its old position in the ordering — and it might get incorrectly evicted. Test the update path every time you implement LRU.

**Stretch question:**
> What's a minimal test suite for an LRU cache? Name 5 test cases that together cover all edge cases.

**Tomorrow preview:**
> Tomorrow: task queue with priority and retry — your first spec decomposition with a genuinely underspecified problem.

---

### Day 10 (Wed) — Spec Decomposition: Task Queue with Priority and Retry

**Format:** Spec Decomposition | **Key skill:** Spec ambiguity; retry policy as a design decision

---

**OpenClaw opening:**
> **Day 10 — Spec Decomposition: Task Queue with Priority and Retry**
>
> Spec:
>
> *"Build a task queue that executes tasks in priority order. Tasks can fail and should be retried. Handle this correctly."*
>
> That's it. That's the whole spec. Real interview specs look like this.
>
> **First: what questions do you have? List every ambiguity you see.**

**OpenClaw as product manager:**
- "What's a task?" → "A callable — a function with some arguments. Assume it's just `task()` that either succeeds (returns a value) or fails (raises an exception)."
- "What's priority?" → "Higher number = higher priority. You define how ties are broken."
- "How many retries?" → "Good question. That's something you need to decide and propose — or ask me to constrain."
- "Retry immediately or with a delay?" → "You decide. What makes sense?"
- "What happens when a task permanently fails after max retries?" → "You decide. Dead letter queue? Log and drop? Raise?"
- "Is this concurrent? Multiple workers?" → "Single worker for now. We can add concurrency later."
- "How does the caller add tasks?" → "Good question — you design the API."

**After clarifying (8 min), ask for the plan:**
> Good questions. Now give me a 6-step implementation plan. Define your API in step 1.

**What a strong plan includes:**
1. API: `Queue.add(task, priority, max_retries=3)` — define the signature
2. Storage: priority queue of `(priority, task_fn, retry_count, max_retries)` tuples — `heapq` with negated priority (max-heap via min-heap inversion)
3. Execution: `pop()` highest-priority task, call `task()`, on success mark done, on exception increment retry count
4. Retry logic: if `retry_count < max_retries`, re-enqueue with same priority, incremented count
5. Failure handling: if `retry_count >= max_retries`, move to dead-letter or log
6. Return value / status: how does the caller know if a task succeeded or failed?

**OpenClaw probes:**
- "You said 'priority queue with heapq' — Python's heapq is a min-heap. How do you get max-priority-first behavior?"
- "You said re-enqueue with 'same priority' — what if a retry should have lower priority than a fresh task at the same level? Should exhausted tasks get deprioritized?"
- "Your step 5 says 'log and drop' — is that acceptable? What does the caller know?"

**Key insight to deliver:**
> **Key insight:** "Retry policy not specified" is not a blocker — it's a design opportunity. When you see underspecification, don't freeze: propose a sensible default ("max 3 retries with immediate re-enqueue") and state it explicitly. In a real interview, the interviewer wants to see you make a decision and own it, not wait for them to fill in every blank.

**Tomorrow preview:**
> Tomorrow: we add thread safety to the LRU cache you built on Monday. One Lock wraps the whole thing.

---

### Day 11 (Thu) — Code Kata: Thread-Safe LRU Cache (Coarse Lock)

**Format:** Code Kata | **Key skill:** Coarse-grained lock strategy; trade-offs

---

**OpenClaw opening:**
> **Day 11 — Code Kata: Thread-Safe LRU Cache**
>
> Take your OrderedDict LRU cache from Day 8 and make it thread-safe. The simplest correct approach: a single lock around the entire cache.
>
> Kata: add a `threading.Lock` to your LRU cache. Both `get()` and `put()` must be thread-safe. Then: discuss the trade-off — what does a single lock cost you?
>
> **Two sentences on approach, then code.**

**Target time:** 20 min total

**OpenClaw evaluation guide (internal):**
- **Correct approach:** `self._lock = threading.Lock()` in `__init__`. Both `get()` and `put()` use `with self._lock:`.
- **Common mistake:** Locking only `put()` but not `get()` — `move_to_end` inside `get()` modifies the OrderedDict, which is not thread-safe.
- **Trade-off discussion:** Single lock → only one thread can access the cache at a time. High contention means threads queue up waiting. For a high-throughput cache, this is a bottleneck. Solutions: read/write lock (RWLock) for read-heavy workloads, striping (multiple caches with consistent hashing), or lock-free cache eviction.

**OpenClaw feedback approach:**
- If `get()` is not locked: "Is `move_to_end` safe to call from multiple threads without a lock? What does it modify internally?"
- After correct implementation: "Good. Now tell me the trade-off. If 100 threads all call `get()` simultaneously on different keys, what happens?"
- If they suggest per-key locking: "Interesting — but what would per-key locking mean for the eviction step? If you're evicting the LRU item, which key's lock do you hold?"

**Key insight to deliver:**
> **Key insight:** A single lock on the whole cache is correct but potentially slow under high concurrency. It's also the *right first answer* — get correct before optimizing. In an interview, implement the coarse-grained lock first, then discuss how you'd scale it ("for production I'd explore RWLock or striping"). Never jump to the complex solution before the simple correct one.

**Stretch question:**
> What is Python's `threading.RLock`? When would you use it over `Lock`?

**Tomorrow preview:**
> Tomorrow: producer-consumer threading — a pattern you'll use again in async (asyncio.Queue) in Phase 2.

---

### Day 12 (Fri) — Code Kata: Producer-Consumer with Lock

**Format:** Code Kata | **Key skill:** Thread coordination; blocking on full buffer

---

**OpenClaw opening:**
> **Day 12 — Code Kata: Producer-Consumer**
>
> A classic concurrency pattern: one thread produces items, another consumes them, through a shared buffer with a max size.
>
> Kata: implement a `BoundedBuffer` class:
> - `__init__(max_size)` — initializes with empty list, a Lock, and a max size
> - `produce(item)` — adds item to buffer. If buffer is full, block (wait) until space is available.
> - `consume()` → item — removes and returns item from buffer. If empty, block (wait) until an item is available.
>
> The challenge: how do you wait without burning CPU in a busy loop? `threading.Condition` is your friend here. Or think through how to use `time.sleep` as a fallback (but explain why it's worse).
>
> **Two sentences on approach, then code.**

**Target time:** 25 min total

**10-min check-in:**
> Where are you?

**OpenClaw evaluation guide (internal):**
- **Strong approach:** `threading.Condition` wraps a `threading.Lock`. Condition provides `wait()` (releases the lock and sleeps) and `notify()` (wakes a waiting thread). Producer: `with self._cond: while len(self._buf) >= self._max: self._cond.wait(); self._buf.append(item); self._cond.notify()`. Consumer: `with self._cond: while not self._buf: self._cond.wait(); item = self._buf.pop(0); self._cond.notify(); return item`.
- **Busy-wait antipattern:** `while full: time.sleep(0.001)` — technically works, wastes CPU, and has a race condition between the check and the sleep if the lock isn't held.
- **Common miss:** Forgetting to call `notify()` after producing or consuming — the waiting thread never wakes up.
- **`while` not `if` on wait:** Always re-check the condition after waking — spurious wakeups are real.

**OpenClaw feedback approach:**
- If they use `time.sleep` polling: "This works, but what are you paying for those sleeps? And is there a race between checking `len(self._buf) >= self._max` and sleeping?"
- If they use Condition but forget `notify()`: "The producer adds an item — how does the sleeping consumer know to wake up?"
- If they use `if` instead of `while` around `wait()`: "Why `while` instead of `if`? What's a spurious wakeup?"

**Key insight to deliver:**
> **Key insight:** `Condition.wait()` atomically releases the lock and sleeps. `notify()` wakes one waiting thread. The `while condition: wait()` pattern (not `if`) handles spurious wakeups — a thread can wake up without being notified. This producer-consumer pattern with Condition is the threading equivalent of asyncio's `Queue.put/get` — you'll recognize the same semantics when you see it in async form in Phase 2.

**Tomorrow preview:**
> Tomorrow is Review & Reflect — we'll look at the LRU edge cases from this week and extract the key pattern.

---

### Day 13 (Sat) — Review & Reflect: LRU Cache Deep Dive

**Format:** Review & Reflect | **Key skill:** OrderedDict internals; update ≠ insert

---

**OpenClaw opening:**
> **Day 13 — Review & Reflect**
>
> Before I show you anything — from memory: what does `move_to_end` actually do internally? Why not just `del cache[key]` and then `cache[key] = value`?

**After user answers (2-3 min):**

> Let me show you the difference with a trace. `OrderedDict` maintains a doubly linked list internally (sound familiar?). `move_to_end(key)` does a pointer update on that internal DLL — O(1). Delete + reinsert would be: delete from DLL (O(1)) + delete from hash map (O(1)) + reinsert into DLL (O(1)) + reinsert into hash map (O(1)). Same total complexity — but four operations instead of one, and a brief moment where the key doesn't exist in the dict (which can cause issues under concurrency).
>
> The real reason to use `move_to_end`: it's expressive. It says what you mean — "move this to the most recent position" — not "delete and reinsert."

**Gap analysis:**
> Look back at your Day 9 scenarios. Did you get Scenario 1 right — where `put()` for an existing key updates AND moves to end? If not: knowledge gap (you didn't know `put` needed to move) or execution gap (you knew but forgot to do it)?

**Pattern extraction:**
> **Pattern: LRU = dict for O(1) lookup + ordered structure for O(1) recency tracking.** OrderedDict gives you both. From-scratch LRU needs you to bring your own ordered structure (the DLL from Week 1). Next week: you build the from-scratch version.

**Preview:**
> Week 3: LRU from scratch, BFS, and thread-safe LRU from scratch. It's the hardest week of Phase 1 — and it's exactly what the OA tests.

---

### Day 14 (Sun) — Debug & Read: LRU move_to_end Missing on Put

**Format:** Debug & Read | **Key skill:** Symmetry: both get and put update recency

---

**OpenClaw opening:**
> **Day 14 — Debug & Read**
>
> Read this LRU cache. Tell me: (1) what it does, (2) what's wrong with it, (3) what sequence of operations would expose the bug.
>
> ```python
> from collections import OrderedDict
>
> class LRUCache:
>     def __init__(self, capacity):
>         self.capacity = capacity
>         self.cache = OrderedDict()
>
>     def get(self, key):
>         if key not in self.cache:
>             return -1
>         self.cache.move_to_end(key)
>         return self.cache[key]
>
>     def put(self, key, value):
>         if key in self.cache:
>             self.cache[key] = value   # update value
>             # note: no move_to_end here
>         else:
>             self.cache[key] = value
>             if len(self.cache) > self.capacity:
>                 self.cache.popitem(last=False)
> ```

**Target time:** 20 min total

**Bug:** `put()` for an existing key updates the value but doesn't call `move_to_end(key)`. The key remains in its original position in the ordering — meaning a recently-updated key can be incorrectly evicted.

**Sequence that exposes the bug:**
```
LRUCache(2)
put(1, 'a')   # cache: {1: 'a'}
put(2, 'b')   # cache: {1: 'a', 2: 'b'} — 1 is LRU
put(1, 'z')   # updates 1, but 1 stays at front (LRU position!)
put(3, 'c')   # evicts LRU = 1 (WRONG — 1 was just updated, should be MRU)
get(1)        # returns -1 — but 1 was just updated! Bug exposed.
```

**Hints:**
- First: "Is the `put()` for existing key complete? Does it do everything it should?"
- Second: "After updating an existing key's value, what should happen to its recency?"

**Key insight to deliver:**
> **Key insight:** In an LRU cache, accessing OR updating a key marks it as recently used. `get()` and `put()` must both call `move_to_end()`. The asymmetry — updating without moving — is the most common bug in LRU implementations. When you review any LRU code, check: "Does the update path also update recency?"

**Preview:**
> Week 3 starts Monday with LRU from scratch — no OrderedDict. You'll build the DLL yourself, exactly as you did in Week 1.

---

## WEEK 3: LRU Cache from Scratch + BFS

**This week's arc:** Part 1 of from-scratch LRU (DLL layer) → Part 2 (tie to dict) → session tracker spec → BFS canonical → thread-safe from scratch. This week directly mirrors OA Problem 1.

---

### Day 15 (Mon) — Code Kata: LRU from Scratch Part 1 (DLL Layer)

**Format:** Code Kata | **Key skill:** DLL as recency-ordered storage

---

**OpenClaw opening:**
> **Day 15 — Code Kata: LRU from Scratch, Part 1**
>
> Today: build the internal DLL layer of an LRU cache. No dict yet — just the ordered structure. Tomorrow we tie it to a dict. Together they make the full from-scratch LRU.
>
> Kata: implement these internal methods for an LRU cache class:
> - `_Node(key, value)` — internal node with key, value, prev, next
> - `_add_to_head(node)` — inserts node as most recently used (right after sentinel head)
> - `_remove_node(node)` — removes node from wherever it is in the DLL
> - `_remove_tail()` → node — removes and returns the LRU node (right before sentinel tail)
>
> Use sentinel head and tail nodes (no null checks). Initialize them in `__init__`.
>
> **Approach in 2 sentences, then code.**

**Target time:** 25 min total

**10-min check-in:**
> How far are you?

**OpenClaw evaluation guide (internal):**
- **Sentinel setup:** `self.head = self._Node(0, 0); self.tail = self._Node(0, 0); self.head.next = self.tail; self.tail.prev = self.head`
- **_remove_node:** `node.prev.next = node.next; node.next.prev = node.prev` — 2 lines, no null checks (thanks to sentinels)
- **_add_to_head:** Insert after head. `node.prev = self.head; node.next = self.head.next; self.head.next.prev = node; self.head.next = node` — pointer order matters (incoming before outgoing)
- **_remove_tail:** `node = self.tail.prev; self._remove_node(node); return node`
- **Key: keys are stored in nodes too** — needed so when you evict the tail node, you know which dict key to delete

**OpenClaw feedback:**
- If they forget to store `key` in the node: "When you evict the tail node, how do you know which key to remove from the hash map? You need the key stored in the node."
- Pointer order wrong in _add_to_head: same teaching as Week 1 — "incoming before outgoing."
- If no sentinel nodes: "Walk me through _remove_node when the node is the last one in the list. Do you have a null check?"

**Key insight to deliver:**
> **Key insight:** The DLL stores nodes in recency order: head → [most recent] → ... → [least recent] → tail. `_add_to_head` = "just used." `_remove_tail` = "evict LRU." These four internal methods are the complete interface — the public `get()` and `put()` will be built entirely from calls to these.

**Stretch question:**
> How is this different from the Week 1 DLL implementation? What's new here and why?

**Tomorrow preview:**
> Tomorrow: Part 2 — we add the dict and wire it to these DLL methods. That's the complete from-scratch LRU.

---

### Day 16 (Tue) — Code Kata: LRU from Scratch Part 2 (Dict + DLL)

**Format:** Code Kata | **Key skill:** Two-structure coordination for O(1) get and put

---

**OpenClaw opening:**
> **Day 16 — Code Kata: LRU from Scratch, Part 2**
>
> Yesterday: the DLL layer. Today: add the dict and implement the public interface.
>
> Take your Part 1 implementation and add:
> - `self.cache = {}` — maps key → Node (for O(1) lookup)
> - `self.capacity` — int
> - `get(key)` → value or -1 — find node in dict, move to head, return value
> - `put(key, value)` — if key exists: update value + move to head. If new: create node + add to head + add to dict. If over capacity: remove tail node + remove its key from dict.
>
> **Two sentences on how the two structures coordinate, then code.**

**Target time:** 25 min total

**10-min check-in:**
> Post what you have.

**OpenClaw evaluation guide (internal):**
- **get():** `if key not in self.cache: return -1; node = self.cache[key]; self._remove_node(node); self._add_to_head(node); return node.value`
- **put() existing key:** `node = self.cache[key]; node.value = value; self._remove_node(node); self._add_to_head(node)`
- **put() new key:** `node = self._Node(key, value); self.cache[key] = node; self._add_to_head(node); if len(self.cache) > self.capacity: tail = self._remove_tail(); del self.cache[tail.key]`
- **Critical:** When removing the tail node, use `tail.key` to delete from the dict. This is why nodes store keys (from Day 15's insight).
- **Common bug:** Adding node to dict AFTER calling `_remove_tail()` — if capacity is 1, you just evicted the node you just added.

**OpenClaw feedback approach:**
- If they add to dict after remove_tail: "If capacity is 1 and you insert a new key, what order do these operations happen? If you add to cache[key] first, then remove_tail — which node do you remove?"
- If they forget to update `node.value` on existing key update: "If I call `put(1, 'new_value')` and key 1 exists — do you update the value in the node itself? Or just move it?"

**Key insight to deliver:**
> **Key insight:** Two data structures, one operation: `get()` and `put()` always touch both the dict (for O(1) lookup) and the DLL (for O(1) recency update). They're inseparable. When you evict from the DLL, you must delete from the dict. When you add to the dict, you must add to the DLL. If either gets out of sync, the cache is broken.

**Stretch question:**
> You've now built OrderedDict's core LRU logic yourself. What does OrderedDict give you beyond this that you'd need to add for a production implementation?

**Tomorrow preview:**
> Tomorrow: spec decomposition for a session tracker — then Thursday is BFS.

---

### Day 17 (Wed) — Spec Decomposition: User Session Tracker

**Format:** Spec Decomposition | **Key skill:** Definition clarification as design work

---

**OpenClaw opening:**
> **Day 17 — Spec Decomposition: User Session Tracker**
>
> Spec:
>
> *"Build a system to track which users are currently active. The system should know who's online right now."*
>
> That's it. Your first question should be obvious — but then it gets interesting.
>
> **What questions do you have?**

**OpenClaw as PM:**
- "What does 'active' mean?" → "Good question. What would make sense? Think about how a real system would detect activity."
- Push them to define it: "Active means 'sent a request in the last N minutes' — you define N and how it's configurable."
- "How is activity reported?" → "The system receives `heartbeat(user_id)` calls whenever a user does something."
- "How does the system know a user went offline?" → "It doesn't receive an explicit disconnect — users just stop sending heartbeats."
- "How many users?" → "Up to 100K concurrent users."
- "How often is 'who's online?' queried?" → "Very frequently — assume it's in a hot path."

**After clarifying, ask for 5-step plan:**
> Give me your implementation plan. Include the data structure choice and why.

**What a strong plan includes:**
1. Define "active": user is active if they've sent a heartbeat in the last T seconds (T = configurable, e.g., 30s)
2. Data structure: `dict{user_id: last_seen_timestamp}` — O(1) heartbeat update, O(1) check if a specific user is active
3. `heartbeat(user_id)` → updates `last_seen[user_id] = time.time()`
4. `is_active(user_id)` → `time.time() - last_seen.get(user_id, 0) < T`
5. `active_users()` → scan all entries and filter for recent — O(N) but discuss trade-offs
   - Alternative: maintain a separate sorted structure or use an LRU cache-like approach where TTL eviction removes stale users

**OpenClaw probes:**
- "Your `active_users()` is O(N) where N is all users ever seen. What happens after running for a year with 100K daily users?"
- "How would you design this to make `active_users()` O(|active|) instead of O(|all_time_users|)?"
- "Your `heartbeat()` is O(1) — but what about cleanup? If you never clean up old timestamps, what happens to memory?"

**Key insight to deliver:**
> **Key insight:** "Who's active?" sounds like a simple lookup — but defining "active" IS the design problem. The definition you pick determines your data structure, your time complexity, and your memory behavior. In an interview, if you define the term well, the implementation usually falls out naturally. If you skip the definition, you'll build the wrong thing.

**Tomorrow preview:**
> Tomorrow: BFS — the graph traversal pattern behind the web crawler in Round 1.

---

### Day 18 (Thu) — Code Kata: BFS on Adjacency List

**Format:** Code Kata | **Key skill:** BFS canonical implementation

---

**OpenClaw opening:**
> **Day 18 — Code Kata: BFS**
>
> Breadth-first search is everywhere in this interview: web crawler (graph of URLs), task dependency resolution, finding shortest paths. Today: canonical implementation.
>
> Kata: implement `bfs(graph, start)`:
> - `graph` is a dict: `{node: [neighbor1, neighbor2, ...]}`
> - Returns a list of all nodes reachable from `start`, in BFS order
> - Handles cycles (no revisiting)
>
> Bonus: modify it to return the shortest path from `start` to a target node.
>
> **Approach in 2 sentences — specifically: when do you mark nodes visited?**

**Target time:** 25 min total

**OpenClaw evaluation guide (internal):**
- **Correct visited-on-enqueue:**
  ```python
  from collections import deque
  def bfs(graph, start):
      visited = {start}
      queue = deque([start])
      result = []
      while queue:
          node = queue.popleft()
          result.append(node)
          for neighbor in graph[node]:
              if neighbor not in visited:
                  visited.add(neighbor)   # ENQUEUE
                  queue.append(neighbor)
      return result
  ```
- **Common bug:** `visited.add(node)` at top of while loop (after dequeue) — allows duplicates in queue
- **Shortest path bonus:** Track `parent = {start: None}`. When target found, backtrack through parent dict.

**OpenClaw feedback:**
- If they mark visited on dequeue: "Your code adds to visited when you dequeue. What happens on a graph where A→C and B→C? Can C end up in the queue twice? Walk me through it."
- If they use a list instead of deque: "You're using `queue.pop(0)` — what's the time complexity of that operation on a Python list? Hint: it's not O(1)."
- Edge case mid-session: "What if `start` is not a key in `graph`? What if the graph has no edges?"

**Key insight to deliver:**
> **Key insight:** BFS guarantees shortest paths in an unweighted graph because it explores all nodes at distance 1 before distance 2. Mark visited on enqueue (not dequeue) to prevent duplicates in the queue. Use `collections.deque` — `popleft()` is O(1), list `pop(0)` is O(N). These three things together are canonical BFS.

**Tomorrow preview:**
> Tomorrow: thread-safe LRU from scratch — combining everything from this week.

---

### Day 19 (Fri) — Code Kata: Thread-Safe LRU from Scratch

**Format:** Code Kata | **Key skill:** Lock placement in a two-structure design

---

**OpenClaw opening:**
> **Day 19 — Code Kata: Thread-Safe LRU from Scratch**
>
> The full integration. Take your from-scratch LRU (Day 16's DLL + dict implementation) and make it thread-safe.
>
> The question: where do you put the lock? You have two data structures (DLL and dict) that must stay in sync. Both must be updated atomically.
>
> Kata: add thread safety to your Part 2 LRU implementation. Then: tell me what `get()` does if you lock only the dict access but not the DLL operations.
>
> **Approach first: where does the lock go, and why?**

**Target time:** 25 min total

**10-min check-in:**
> Post what you have.

**OpenClaw evaluation guide (internal):**
- **Correct approach:** One lock (`self._lock = threading.Lock()`) that wraps the entire `get()` and `put()` body. Both the dict and DLL operations must be atomic together.
- **Why not separate locks:** If you have dict_lock and dll_lock separately, you can get a state where the dict has been updated but the DLL hasn't — another thread could see an inconsistent state mid-update.
- **What happens with dict-only lock:** Thread A calls `get(1)` — acquires dict lock, reads node from dict, releases dict lock, calls `_remove_node(node)`. Thread B simultaneously calls `put(1, 'new')` — acquires dict lock, updates dict, acquires dict lock (for delete on eviction)... but both threads are now manipulating the DLL concurrently without a lock. DLL becomes corrupted.

**OpenClaw feedback:**
- If they suggest separate dict and DLL locks: "If Thread A is mid-get (dict lookup done, DLL update not started) and Thread B calls put() and starts evicting — what state is the cache in?"
- If they try to lock individual DLL operations: Same answer — the DLL operations within a single `get()` must be atomic.
- After correct implementation: "Good. Now: you said `get()` can be called from multiple threads. If two threads both call `get()` for the same key that's the LRU item — does your implementation cause a problem? Trace through it."

**Key insight to deliver:**
> **Key insight:** When two data structures must stay synchronized (dict + DLL in LRU), they must be updated under a single lock. Separate locks for each structure give you isolated safety but not joint consistency. A reader can catch you mid-update and see a state where one structure has changed but the other hasn't — which is corrupted state.

**Tomorrow preview:**
> Tomorrow: Review & Reflect — we compare your from-scratch LRU to the OrderedDict version and understand what the stdlib abstracts away.

---

### Day 20 (Sat) — Review & Reflect: From-Scratch vs OrderedDict LRU

**Format:** Review & Reflect | **Key skill:** Appreciate stdlib; understand what's underneath

---

**OpenClaw opening:**
> **Day 20 — Review & Reflect**
>
> From memory: walk me through how `get(key)` works in your from-scratch LRU. What are the exact steps — in your DLL, in your dict?

**After user recalls (2-3 min):**

> Good. Let's compare:
>
> **OrderedDict LRU `get()`:**
> 1. `if key not in self.cache: return -1`
> 2. `self.cache.move_to_end(key)`
> 3. `return self.cache[key]`
>
> **From-scratch LRU `get()`:**
> 1. `if key not in self.cache: return -1`
> 2. `node = self.cache[key]`
> 3. `self._remove_node(node)`
> 4. `self._add_to_head(node)`
> 5. `return node.value`
>
> Steps 2-3 of OrderedDict are `move_to_end` — which is exactly your steps 2-4 (lookup + remove + re-add). The same operations. OrderedDict just names it better.

**Gap analysis:**
> Did your from-scratch implementation get step 3 right (remove before re-adding to head)? A common mistake is just `_add_to_head(node)` without removing first — which leaves the node in its old position AND at the head, corrupting the DLL.

**Pattern extraction:**
> **Pattern: stdlib abstracts the same operations you just built by hand.** When you understand what's underneath, you can explain WHY the stdlib works, fix it when it breaks, and implement it when you're told "no stdlib." That's the OA bar: "implement LRU without using OrderedDict."

**Preview:**
> Week 4: DFS + cycle detection + your Phase 1 exit assessment on Friday. The exit kata is LRU from scratch, thread-safe, in 15 minutes. That's your goal for this week.

---

### Day 21 (Sun) — Debug & Read: Thread-Safe LRU Race Condition on Read

**Format:** Debug & Read | **Key skill:** Race condition on read-modify-write paths

---

**OpenClaw opening:**
> **Day 21 — Debug & Read**
>
> Read this thread-safe LRU cache. What's wrong with it?
>
> ```python
> import threading
> from collections import OrderedDict
>
> class LRUCache:
>     def __init__(self, capacity):
>         self.capacity = capacity
>         self.cache = OrderedDict()
>         self._lock = threading.Lock()
>
>     def get(self, key):
>         if key not in self.cache:   # <-- outside lock
>             return -1
>         with self._lock:
>             self.cache.move_to_end(key)
>             return self.cache[key]
>
>     def put(self, key, value):
>         with self._lock:
>             if key in self.cache:
>                 self.cache.move_to_end(key)
>             self.cache[key] = value
>             if len(self.cache) > self.capacity:
>                 self.cache.popitem(last=False)
> ```

**Target time:** 20 min total

**Bugs:**
1. **Race condition in `get()`:** The `key not in self.cache` check is outside the lock. Another thread can evict the key between the check and the lock acquisition. Thread A: checks `key in cache` → True, doesn't return -1. Thread B: evicts that key via `put()`. Thread A: acquires lock, calls `move_to_end(key)` → KeyError. Program crashes.
2. **Entire get() critical section is wrong:** The check and the read should both be inside the lock.

**Hints:**
- First: "The lock acquisition in `get()` — where exactly does it happen relative to the check?"
- Second: "What can happen between `if key not in self.cache` and the `with self._lock:`?"

**Fix:**
```python
def get(self, key):
    with self._lock:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
```

**Key insight to deliver:**
> **Key insight:** Check-then-act must be atomic — this same principle from Day 6 applies to data structures too. A check-then-lock pattern (check outside lock, lock before acting) has a window where the check's result can become invalid. Lock first, check inside, act inside.

**Preview:**
> Week 4: DFS this week, then your Phase 1 exit assessment Friday. If you can implement thread-safe LRU from scratch in 15 minutes, you're ready for Phase 2.

---

## WEEK 4: DFS + Cycle Detection + Phase 1 Exit Assessment

**This week's arc:** DFS canonical → 3-color cycle detection → URL parser spec → threading.Condition deep dive → Phase 1 exit assessment (LRU from scratch, timed). By Friday, you either advance or do an extended Week 3 repeat.

---

### Day 22 (Mon) — Code Kata: DFS on Adjacency List

**Format:** Code Kata | **Key skill:** DFS canonical implementation

---

**OpenClaw opening:**
> **Day 22 — Code Kata: DFS**
>
> DFS — depth-first search. You'll use this for cycle detection, topological sort, and finding connected components. Today: the canonical implementation.
>
> Kata: implement `dfs(graph, start, target)`:
> - `graph` is a dict: `{node: [neighbor1, neighbor2, ...]}`
> - Returns the path from `start` to `target` as a list, or `None` if not reachable
> - Handles cycles
>
> Bonus: implement the iterative version (using an explicit stack instead of recursion).
>
> **Approach in 2 sentences — specifically: what data structure are you using and how do you handle cycles?**

**Target time:** 25 min total

**OpenClaw evaluation guide (internal):**
- **Recursive DFS with path tracking:**
  ```python
  def dfs(graph, start, target, visited=None, path=None):
      if visited is None: visited = set()
      if path is None: path = []
      visited.add(start)
      path.append(start)
      if start == target: return path[:]
      for neighbor in graph[start]:
          if neighbor not in visited:
              result = dfs(graph, neighbor, target, visited, path)
              if result: return result
      path.pop()
      return None
  ```
- **Mutable default argument bug:** `def dfs(graph, start, target, visited=set())` — this set persists across calls! Must use `None` default and initialize inside.
- **Iterative version:** Uses an explicit stack (list). `stack = [(start, [start])]`. Each element is `(node, path_so_far)`.

**OpenClaw feedback:**
- If they use mutable default argument: "You have `visited=set()` as a default parameter — what happens to that set between multiple calls to `dfs`?"
- If they don't backtrack the path: "If you find that the path through node X doesn't reach the target, do you remove X from the path before trying another branch?"
- If recursive version only, bonus question: "Now: can you implement this iteratively? What do you use instead of the call stack?"

**Key insight to deliver:**
> **Key insight:** DFS explores as deep as possible before backtracking. The recursive version uses Python's call stack; the iterative version makes the stack explicit. For cycle detection, DFS on an **undirected** graph uses a visited set. For **directed** graphs (detecting directed cycles), you need 3-color marking — that's tomorrow.

**Tomorrow preview:**
> Tomorrow: 3-color cycle detection. This is directly used in the OA Task Management System — detecting circular dependencies.

---

### Day 23 (Tue) — Code Kata: DFS Cycle Detection (3-Color Marking)

**Format:** Code Kata | **Key skill:** Cycle detection via recursion stack state

---

**OpenClaw opening:**
> **Day 23 — Code Kata: DFS Cycle Detection**
>
> Regular visited-set DFS doesn't detect cycles in directed graphs — it only prevents revisiting. 3-color marking does.
>
> The colors:
> - **WHITE (0):** Unvisited — haven't touched this node yet
> - **GRAY (1):** In-progress — currently being explored (on the recursion stack)
> - **BLACK (2):** Done — fully explored, no cycle found through this node
>
> A cycle exists if DFS reaches a GRAY node — meaning we're currently exploring it up the call stack.
>
> Kata: `has_cycle(graph)` → bool
> - Returns True if `graph` (directed, as adjacency dict) contains a directed cycle
> - Use 3-color DFS
>
> **Approach in 2 sentences, then code.**

**Target time:** 25 min total

**OpenClaw evaluation guide (internal):**
- **Strong implementation:**
  ```python
  def has_cycle(graph):
      WHITE, GRAY, BLACK = 0, 1, 2
      color = {node: WHITE for node in graph}

      def dfs(node):
          color[node] = GRAY
          for neighbor in graph[node]:
              if neighbor not in color:
                  color[neighbor] = WHITE  # add if not in graph
              if color[neighbor] == GRAY:
                  return True  # back edge = cycle
              if color[neighbor] == WHITE and dfs(neighbor):
                  return True
          color[node] = BLACK
          return False

      return any(dfs(node) for node in graph if color[node] == WHITE)
  ```
- **Key:** Set GRAY before recursing into neighbors. Set BLACK after all neighbors explored. Reach GRAY = found a back edge = cycle.
- **Common bug:** Not iterating from all unvisited nodes (handles disconnected graphs).

**OpenClaw feedback:**
- If they don't start DFS from all unvisited nodes: "What if the graph has two disconnected components and the cycle is in the second one? Does your code find it?"
- If they use visited set instead of 3-color: "Your visited set marks 'I've been here' — but it doesn't tell you if 'I'm currently on the call stack going through here right now.' How does 3-color capture that?"
- Edge case mid-session: "What about a self-loop — a node with an edge to itself? Does your implementation catch it?"

**Key insight to deliver:**
> **Key insight:** 3-color captures recursion stack state — something a plain visited set can't do. GRAY means "I'm currently exploring this path." If you reach a GRAY node, you've found a back edge — a cycle. This is directly used in topological sort (if there's a cycle, topo sort is impossible) and in the OA Task Management System (circular dependency detection).

**Stretch question:**
> How would you modify this to return the actual cycle (list of nodes in the cycle), not just True/False?

**Tomorrow preview:**
> Tomorrow: URL domain extractor spec — parsing messy real-world input.

---

### Day 24 (Wed) — Spec Decomposition: URL Domain Extractor

**Format:** Spec Decomposition | **Key skill:** Normalizing messy real-world input

---

**OpenClaw opening:**
> **Day 24 — Spec Decomposition: URL Domain Extractor**
>
> Spec:
>
> *"Build a function that takes a list of URLs and returns the unique domain names. Handle real-world input."*
>
> Real-world means: inconsistent. Your job is to define what "domain name" means and handle the mess.
>
> **What questions do you have? What ambiguities do you see?**

**OpenClaw as PM:**
- "What counts as a domain?" → "You define it. What would make 'http://www.google.com/path?q=1' and 'https://google.com' be the same domain?"
- "Strip www?" → "Good question — does www.google.com == google.com in your definition? You decide and defend it."
- "What about ports?" → "You tell me — is google.com:8080 the same domain as google.com?"
- "What if there's no scheme?" → "Like 'google.com/path'? Handle it or define a rule."
- "What if the URL is completely malformed?" → "What's the right behavior? Your call."
- "Case sensitivity?" → "Is Google.COM the same as google.com?"

**After clarifying, ask for 5-step plan:**

**What a strong plan includes:**
1. Define "domain" = hostname, lowercased, with www stripped (state assumption about www)
2. Parse each URL: handle scheme (http/https), no-scheme, edge cases
3. Normalization function: lowercase, strip www, strip port (or not — state choice)
4. Error handling: malformed URLs → skip or log, not crash
5. Collect into a set (deduplication), return sorted list or set

**OpenClaw probes:**
- "You said 'parse each URL' — are you using `urllib.parse.urlparse`? Or rolling your own regex? What are the trade-offs?"
- "Your normalization strips `www.` — what about `www2.`? `subdomain.`? Where do you draw the line?"
- "You said 'skip malformed URLs' — what counts as malformed? Can you give me 3 examples?"

**Key insight to deliver:**
> **Key insight:** URL normalization is a real engineering problem — real systems (web crawlers, CDNs, browser caches) spend significant effort on it. The canonical form of a URL must be defined explicitly and applied consistently. In the web crawler (Round 1), URL normalization is the difference between correctly deduplicating visits and revisiting the same page 10 times under different URLs.

**Tomorrow preview:**
> Tomorrow: threading.Condition — the coordination primitive that eliminates busy-waiting.

---

### Day 25 (Thu) — Code Kata: Producer-Consumer with threading.Condition

**Format:** Code Kata | **Key skill:** Condition variables; event-driven coordination

---

**OpenClaw opening:**
> **Day 25 — Code Kata: Producer-Consumer with threading.Condition**
>
> On Day 12 you built a producer-consumer with a Lock. Today: the right way with `threading.Condition`. The difference: `Condition.wait()` atomically releases the lock and sleeps — no busy-waiting, no spinning.
>
> Kata: implement a `BoundedQueue` class using `threading.Condition`:
> - `__init__(maxsize)` — sets up Condition, internal list, maxsize
> - `put(item)` — blocks if full, adds item, notifies waiting consumers
> - `get()` → item — blocks if empty, removes and returns item, notifies waiting producers
>
> The key: use `while condition: self._cond.wait()` (not `if`) inside the lock.
>
> **Approach in 2 sentences, explaining why `while` not `if` around wait().**

**Target time:** 25 min total

**10-min check-in:**
> Post what you have.

**OpenClaw evaluation guide (internal):**
- **Strong implementation:**
  ```python
  import threading

  class BoundedQueue:
      def __init__(self, maxsize):
          self._cond = threading.Condition()
          self._items = []
          self._maxsize = maxsize

      def put(self, item):
          with self._cond:
              while len(self._items) >= self._maxsize:
                  self._cond.wait()
              self._items.append(item)
              self._cond.notify_all()

      def get(self):
          with self._cond:
              while not self._items:
                  self._cond.wait()
              item = self._items.pop(0)
              self._cond.notify_all()
              return item
  ```
- **`while` vs `if`:** Spurious wakeups — a thread can wake up without being explicitly notified. Also, if multiple threads are waiting and only one item is added, all notified threads compete — only one gets the item, others must re-check and re-wait.
- **`notify()` vs `notify_all()`:** `notify()` wakes one — use when you know exactly one waiting thread should proceed. `notify_all()` wakes all — safer but more contention.

**OpenClaw feedback:**
- If they use `if` instead of `while`: "What happens if you use `if` and you're woken up spuriously? Or two consumers are waiting and only one item arrives?"
- If they don't call `notify` after put/get: "After adding an item, how does a sleeping consumer know to wake up?"
- If they don't use `with self._cond:` (context manager): "Does `Condition.wait()` work correctly if you don't hold the lock? What does it do atomically?"

**Key insight to deliver:**
> **Key insight:** `Condition.wait()` does two things atomically: releases the lock AND sleeps. When notified, it re-acquires the lock before your code continues. This is why you must be inside `with self._cond:` when you call `wait()`. The `while` loop around `wait()` handles spurious wakeups and competitive wakeups — the condition must be true for your thread, not just true for someone else.

**Tomorrow preview:**
> Tomorrow is the Phase 1 Exit Assessment. 15-minute target: thread-safe LRU cache from scratch (DLL + dict + Lock). This is exactly the OA bar.

---

### Day 26 (Fri) — Phase 1 Exit Assessment: LRU Cache from Scratch

**Format:** Code Kata (timed) | **Key skill:** Integration of all Phase 1 skills under time pressure

---

**OpenClaw opening:**
> **Day 26 — Phase 1 Exit Assessment**
>
> This is it. Everything from the past 4 weeks comes together in one problem.
>
> You have 15 minutes. Starting now.
>
> **Problem: implement a thread-safe LRU cache.**
> - `__init__(capacity)` — fixed capacity
> - `get(key)` → value or -1 — O(1), thread-safe
> - `put(key, value)` — O(1), thread-safe, evicts LRU when over capacity
>
> Requirements:
> - From scratch (no OrderedDict or similar — build your own DLL)
> - Thread-safe (works correctly from multiple threads)
> - Production quality (handle edge cases, no memory leaks)
>
> Type your DLL design in 2 sentences, then start coding.
>
> Timer starts now.

**At 10 minutes:**
> 5 minutes left. Post what you have if you're not done.

**At 15 minutes:**
> Time. Post your code. Let's evaluate it.

**OpenClaw evaluation guide (internal — pass criteria):**

**PASS criteria:**
- DLL with sentinel nodes implemented correctly (add_to_head, remove_node, remove_tail)
- Dict maps keys to nodes
- `get()`: dict lookup + remove + add_to_head + return value — all under one lock
- `put()`: update-and-move for existing keys; create + add_to_head + dict insert + evict-tail for new keys, all under one lock
- Lock wraps entire `get()` and entire `put()`
- Key stored in node (needed for dict deletion on eviction)

**CONDITIONAL PASS criteria (advance with note to target gap):**
- Correct logic but took 18-20 min (time gap only — logic was sound)
- Correct logic but forgot to lock `get()` reads (identified and fixed when probed)
- Correct lock but missing one edge case (capacity=0, or capacity=1 eviction order)

**FAIL criteria (repeat Week 3 pattern before Phase 2):**
- DLL operations incorrect (pointer manipulation errors that produce broken structure)
- Dict and DLL out of sync (inconsistent state possible)
- No locking, or locking only one of get/put
- Couldn't get started or produced < 50% of the implementation in 15 min

**OpenClaw debrief (after receiving code):**
> Here's what I see:
> [go through pass/fail criteria explicitly]
>
> **Interview verdict: [pass / conditional pass / fail]**
>
> [If pass:] You're ready for Phase 2. Next week: topological sort, asyncio, and the first Mock Pressure Rounds.
> [If conditional pass:] Close. [Name the specific gap]. Do one more targeted kata on that gap tomorrow, then we start Phase 2.
> [If fail:] Not yet — and that's useful data. Let's identify the specific gap and run another week. [Name the gap.]

---

### Day 27 (Sat) — Review & Reflect: Phase 1 Exit Assessment Debrief

**Format:** Review & Reflect | **Key skill:** Identifying knowledge vs execution gaps

---

**OpenClaw opening:**
> **Day 27 — Review & Reflect: Exit Assessment Debrief**
>
> Before anything: describe the LRU from scratch you wrote yesterday. Walk me through `get()` — what are the exact steps?

**After user recalls:**

> Let's draw the LRU operations together:
>
> **`get(key)`:**
> 1. Acquire lock
> 2. If key not in dict: release lock (via `with`), return -1
> 3. Get node from dict
> 4. Remove node from DLL
> 5. Add node to DLL head
> 6. Return node.value (lock releases on `with` exit)
>
> **`put(key, value)` (new key):**
> 1. Acquire lock
> 2. Create new Node(key, value)
> 3. Add to dict: `self.cache[key] = node`
> 4. Add to DLL head
> 5. If `len(self.cache) > capacity`: remove DLL tail node, delete its key from dict
> 6. Lock releases

**Gap analysis:**
> What slowed you down? Or what was wrong?
> - Forgot to store key in the Node? → Knowledge gap: add to kata list, target in first Phase 2 kata
> - Got the lock wrong (get unlocked)? → Execution gap: do 3 more thread-safety katas in Phase 2
> - Pointer manipulation incorrect in DLL? → Drill DLL operations before moving to Phase 2
> - Time only (correct but 18 min)? → Speed builds with reps — Phase 2 will get you there

**Pattern extraction:**
> **The meta-pattern of Phase 1:** Every data structure is a combination of (a) a lookup structure (dict/hash map) and (b) an ordering structure (DLL/heap/sorted list). The LRU uses dict + DLL. A priority queue uses dict + heap. A sorted map uses dict + balanced BST. Know the combination, and the implementation follows.

**Preview:**
> Sunday is Debug & Read. Then Phase 2 starts Monday — topological sort, asyncio, and your first timed Mock Pressure Round on Friday.

---

### Day 28 (Sun) — Debug & Read: DFS Without Cycle Handling

**Format:** Debug & Read | **Key skill:** Applying cycle detection to a broken implementation

---

**OpenClaw opening:**
> **Day 28 — Debug & Read: The Infinite DFS**
>
> Read this graph traversal code. What does it do? What breaks it?
>
> ```python
> def find_all_paths(graph, start, end):
>     """Find all paths from start to end in a directed graph."""
>     if start == end:
>         return [[end]]
>     paths = []
>     for neighbor in graph.get(start, []):
>         sub_paths = find_all_paths(graph, neighbor, end)
>         for path in sub_paths:
>             paths.append([start] + path)
>     return paths
>
> # Usage:
> graph = {
>     'A': ['B', 'C'],
>     'B': ['C', 'D'],
>     'C': ['A'],     # cycle: C → A
>     'D': ['end'],
>     'end': []
> }
> find_all_paths(graph, 'A', 'end')  # what happens?
> ```

**Target time:** 20 min total

**Bug:** No cycle detection. The graph has `C → A` which creates `A → C → A → C → ...`. The function recurses infinitely (or until stack overflow on a large cycle).

**After bug identified:**
> How would you fix it? Add cycle detection without breaking the "find all paths" semantics.

**Fix approach:** Pass a `visited` set (current path, not globally visited across calls) down through recursion:
```python
def find_all_paths(graph, start, end, visited=None):
    if visited is None: visited = set()
    if start in visited: return []  # cycle detected — this path is invalid
    if start == end: return [[end]]
    visited.add(start)
    paths = []
    for neighbor in graph.get(start, []):
        sub_paths = find_all_paths(graph, neighbor, end, visited | {start})
    ...
```
Note: use `visited | {start}` (new set per branch) not `visited.add(start)` globally — otherwise one branch's visits block other branches.

**Key insight to deliver:**
> **Key insight:** "Find all paths" and "cycle detection" are different problems. For "find all paths" you need per-branch visited sets (not a global visited set) — otherwise you block legitimate paths that go through the same node on different branches. For cycle detection you need 3-color marking. Know the difference and know which one you need.

**Phase 1 complete message:**
> **Phase 1: Foundations — Complete.**
>
> In the past 4 weeks you've built: doubly linked lists from scratch, LRU cache (OrderedDict + from-scratch + thread-safe), BFS with correct visited marking, DFS with 3-color cycle detection, threading with Lock and Condition, and producer-consumer. These are the foundation of everything that comes next.
>
> Phase 2 starts Monday. The pace accelerates — topological sort, asyncio, algorithm patterns, and your first timed Mock Pressure Rounds. You're ready.

---

## Appendix: Phase 1 Session Quick Reference

| Day | Week | Format | Topic | Key Skill |
|-----|------|--------|-------|-----------|
| 1 | 1 | CK | DLL Node: insert_after + remove | Pointer manipulation order |
| 2 | 1 | CK | DLL with sentinel nodes | Edge case elimination |
| 3 | 1 | SD | Log line parser spec | Plan before code |
| 4 | 1 | CK | Thread-safe counter with Lock | Critical section isolation |
| 5 | 1 | CK | Thread-safe stack | Check-then-act atomicity |
| 6 | 1 | RR | Thread-safe stack deep dive | Per-operation vs coarse locking |
| 7 | 1 | DR | BFS with dequeue visited marking | Visited-on-enqueue vs dequeue |
| 8 | 2 | CK | LRU Cache with OrderedDict | move_to_end pattern |
| 9 | 2 | CK | LRU Cache edge cases | Update ≠ insert; both update LRU |
| 10 | 2 | SD | Task queue with priority and retry | Retry policy design |
| 11 | 2 | CK | Thread-safe LRU (coarse lock) | Coarse-grained lock strategy |
| 12 | 2 | CK | Producer-consumer with Lock | Thread coordination |
| 13 | 2 | RR | LRU deep dive: move_to_end internals | OrderedDict implementation intuition |
| 14 | 2 | DR | LRU missing move_to_end on put | Symmetry: get and put both update |
| 15 | 3 | CK | LRU from scratch Part 1 (DLL layer) | DLL as recency-ordered storage |
| 16 | 3 | CK | LRU from scratch Part 2 (dict + DLL) | Two-structure coordination |
| 17 | 3 | SD | User session tracker | Defining "active" as design work |
| 18 | 3 | CK | BFS on adjacency list | BFS canonical: deque + visited-on-enqueue |
| 19 | 3 | CK | Thread-safe LRU from scratch | Lock wrapping two-structure design |
| 20 | 3 | RR | From-scratch vs OrderedDict LRU | Understand what stdlib abstracts |
| 21 | 3 | DR | Thread-safe LRU: get() without lock | Race on read-modify-write path |
| 22 | 4 | CK | DFS on adjacency list | DFS canonical; backtracking |
| 23 | 4 | CK | DFS 3-color cycle detection | Directed cycle via recursion stack |
| 24 | 4 | SD | URL domain extractor | Normalizing messy real-world input |
| 25 | 4 | CK | Producer-consumer with Condition | Event-driven coordination; why `while` |
| 26 | 4 | CK | **Phase 1 Exit Assessment** | Full integration under time pressure |
| 27 | 4 | RR | Exit assessment debrief | Knowledge vs execution gap identification |
| 28 | 4 | DR | DFS without cycle handling | Per-branch vs global visited |

---

## Phase 1 → Phase 2 Gate Criteria

OpenClaw evaluates Friday's exit assessment (Day 26) against these criteria:

**Advance to Phase 2 (Pass or Conditional Pass):**
- Thread-safe LRU from scratch completed in ≤ 18 minutes with correct DLL + dict + Lock logic
- OR: completed in ≤ 20 minutes with one identified gap that has a clear fix

**Stay at Phase 1 (Repeat Week 3 pattern with harder variants):**
- DLL operations incorrect (would produce corrupted list state)
- Dict and DLL out of sync (inconsistent state achievable)
- No lock or lock only one of get/put
- Time > 20 minutes or couldn't complete > 50% of implementation

**Slower pace note (from progression-map):**
If diagnostic score was < 30, Week 5 is a repeat of Week 3 with harder variants before advancing to standard Phase 2.
