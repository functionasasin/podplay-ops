# Phase 3: System Thinking — OpenClaw Session Scripts

**Duration:** 4 weeks (28 days), Weeks 9–12
**Formats:** Concept Deep Dive (2x/week), Mini System Design (2–3x/week), Code Kata (1x/week or alternating), Mock Pressure Round (1x/week), Review & Reflect (1x/week), SQL or Debug & Read (1x/week, alternating)
**Target:** LLM inference mental model fully formed; system design components feel natural; can articulate continuous batching, KV cache, autoscaling signals, and streaming without notes.

This file is the **executable curriculum** for Phase 3. OpenClaw reads this to know exactly what to say, ask, and evaluate on each of the 28 days. Every session is written as a complete OpenClaw script: opening message, exercise prompt, evaluation guidance, key insight, and forward transition.

Phase 3 is where the System Design round is won or lost. The interviewers build LLM inference serving for a living. Generic answers fail. This phase builds genuine depth: not just "what is KV cache" but "why does KV cache eviction policy choice affect p99 latency" and "why is queue-depth-weighted-by-tokens a better autoscaling signal than GPU utilization."

**Day numbering:** Days 1–28 within Phase 3. In the global practice log, these are days 60–87 (after 3 diagnostic + 28 Phase 1 + 28 Phase 2 days).

---

## Phase 3 Opening Message

> OpenClaw sends this on Day 1 of Phase 3:

> **Phase 3: System Thinking begins today.**
>
> This is the make-or-break phase. The System Design round at Anthropic isn't a generic "design Twitter" interview — it's a deep dive into LLM inference serving, the exact thing they build. Interviewers will probe until they find the edge of your knowledge.
>
> Your goal for the next 4 weeks: build a genuine mental model of how LLM inference works, from autoregressive generation to KV cache to batching to autoscaling. Not bullet points to memorize — an actual intuition you can reason from when pushed.
>
> The format shifts this phase: 2 Concept Deep Dives and 2–3 Mini System Designs per week. Less coding, more thinking and talking. You'll still have one Mock Pressure Round (Friday) and one Review & Reflect (Saturday), but most sessions are discussion-based.
>
> The rule for this phase: **never say something you can't defend.** If I push back on your design, tell me why you chose it — not just what you chose. "I chose X because Y, and the tradeoff is Z" is the answer Anthropic is listening for.
>
> Let's go. Day 1.

---

## WEEK 9: LLM Inference Mechanics + KV Cache + Async Generators

**This week's arc:** What actually happens inside an LLM when it generates text → why KV cache exists and what it stores → how to design a KV cache component → eviction policy trade-offs. The conceptual backbone of the entire System Design round.

---

### Day 1 (Mon) — Concept Deep Dive: Autoregressive Generation + Why KV Cache Exists

**Format:** Concept Deep Dive | **Key skill:** Mental model: each token depends on all previous

---

**OpenClaw opening:**
> **Day 1, Week 9 — Concept Deep Dive: Autoregressive Generation**
>
> Before we can design LLM inference systems, you need to understand what's actually happening when a model generates text. This is the foundation that everything else builds on.
>
> Here's the concept — read this carefully:
>
> When an LLM generates text, it works **one token at a time**. To generate token N, the model must look at ALL previous tokens (1 through N-1) through an attention mechanism. The attention mechanism computes a score between every pair of tokens — "how much should token 7 influence token 23?" — and uses those scores to compute a weighted combination of token representations.
>
> Here's the expensive part: **this attention computation involves matrix multiplications over all previous tokens**. Without any optimization, generating token 1000 requires looking at all 999 previous tokens, generating token 1001 requires looking at all 1000 previous tokens — it gets slower the longer the sequence gets.
>
> The KV cache is the fix. At each attention layer, the model computes "keys" and "values" for each token. These don't change once computed — token 5's keys and values at layer 3 are the same regardless of what tokens come after. So instead of recomputing them every time, you **cache them**. Generating token 1001 only needs to compute the K/V for token 1000, not all 1000 previous ones.
>
> What does this cost? **VRAM.** The KV cache for a long conversation takes up GPU memory. For a 70B parameter model, a single 10K-token context can take several GB of VRAM. And VRAM is the scarce resource in inference serving.
>
> Now — questions. What's not clear? Ask me anything about this before we move to the application challenge.

**Target time:** 25 min total

**OpenClaw Q&A approach (internal):**
- If user asks "what are keys and values exactly?": "Think of attention like a search engine. The query is the current token asking 'who's relevant to me?' The keys are like search index entries — what each token advertises about itself. The values are what you retrieve when you match. The actual math doesn't matter for the interview — what matters is that K/V is what gets cached, and it lives in VRAM."
- If user asks "why VRAM specifically vs RAM?": "The GPU needs to access these values at every attention layer during generation. VRAM bandwidth is ~900GB/s; PCIe to system RAM is ~60GB/s. Accessing KV from RAM would make generation 15x slower. The whole point of GPU inference is keeping everything on-chip."
- If user seems to understand: proceed to application challenge.

**Application challenge (10 min):**
> Good. Now think through this scenario:
>
> You're serving 100 concurrent users having conversations. Some conversations are 100 tokens, some are 5000 tokens. You have a fixed amount of VRAM for KV cache storage.
>
> 1. What grows as a conversation gets longer? (What exactly uses more VRAM?)
> 2. Why does a 5000-token conversation "cost" 50x more VRAM than a 100-token one?
> 3. What happens if a new user request arrives but there's no VRAM left for their KV cache?
>
> Answer all three. Take 5 minutes.

**OpenClaw evaluation guide (internal):**
- **Q1 strong answer:** Each new token adds a new row to the KV cache for every layer. If the model has 32 attention layers, each new token adds 32 K/V pairs to the cache.
- **Q2 strong answer:** Linear relationship — 5000 tokens × 32 layers × (K size + V size per token). VRAM usage grows linearly with context length.
- **Q3 strong answer:** You either (a) evict someone else's KV cache (losing their context), (b) reject the new request, or (c) offload to CPU RAM (slow). This is the eviction problem — tomorrow's session.
- **Common gap:** Not connecting "context length" to "VRAM usage" directly. Push with: "A 10K-token request uses how much more VRAM than a 1K-token request?"

**Explain it back:**
> "Explain autoregressive generation and why KV cache exists to me in 3 sentences — as if I'm a backend engineer who's never worked on ML."

**Key insight to deliver:**
> **Key insight:** KV cache converts "recompute everything for each new token" into "store once, reuse forever." The cost is VRAM — and VRAM is the scarce resource that constrains everything in LLM inference. Once you understand this, every design decision in inference serving makes sense: batching, eviction, prioritization, autoscaling — they're all managing the VRAM bottleneck.

**Tomorrow preview:**
> Tomorrow: you design the KV cache component. What data structure holds it? How do you know when to evict? What does eviction actually mean for the user?

---

### Day 2 (Tue) — Mini System Design: Design a KV Cache Manager

**Format:** Mini System Design | **Key skill:** KV cache as VRAM resource; eviction = lost context

---

**OpenClaw opening:**
> **Day 2, Week 9 — Mini System Design: KV Cache Manager**
>
> Yesterday you understood what KV cache is and why VRAM is the limit. Today you design the component that manages it.
>
> **Design challenge:** You're building a KV cache manager for an LLM inference server. Requirements:
>
> - Multiple requests are running concurrently, each with a KV cache that grows by 1 slot per generated token
> - Total VRAM budget for KV cache: 80GB (fixed)
> - Each token's KV cache entry takes a fixed size (let's say 1MB for simplicity)
> - New requests arrive constantly; sometimes you don't have room for their initial cache
>
> Design the KV cache manager. Answer these questions:
> 1. What data structure tracks which requests have how much VRAM allocated?
> 2. When a new request arrives and VRAM is full, how do you decide what to evict (if anything)?
> 3. What does "evicting" a request's KV cache mean for that request? What are the options?
>
> You have 10 minutes. Go.

**Target time:** 25 min

**10-min check-in:**
> What's your data structure for tracking allocations? Walk me through it.

**OpenClaw probing questions (internal — ask one at a time):**
1. "You chose LRU eviction — what are you using as the 'last used' timestamp? Is it the last token generated, the last user message, or the arrival time?"
2. "When you evict a request's KV cache — you said the request is paused — where does the partially-generated response go? Can it resume?"
3. "What if the request being evicted is 80% done generating a 10K-token response? Is evicting it different from evicting a 5-token response that just started?"
4. "Who decides when to evict — the KV cache manager proactively, or only when a new request arrives?"

**OpenClaw evaluation guide (internal):**
- **Strong data structure:** A dict mapping request_id → allocated_blocks (or slot count), plus some ordering mechanism (LRU queue or priority queue) for eviction decisions.
- **Strong eviction thinking:** At minimum, knows that eviction = losing the KV state, which means the request either (a) aborts and returns an error, (b) gets recomputed from scratch (slow — reprocesses all prompt tokens), or (c) is offloaded to CPU RAM as a slower-but-not-lost option.
- **Key distinction to probe:** Evicting a request mid-generation vs evicting a completed request's cache (which might be kept for conversation continuation). Completed caches aren't generating anything, so evicting them is "cheaper" in user experience terms.
- **Common gap:** Not thinking about what happens *to the request* when its KV cache is evicted. Push with: "You evicted Request 5's KV cache. Request 5 is mid-sentence. What does the user experience?"

**Alternative design to present:**
> "Here's a different approach: instead of LRU, use **shortest-remaining-generation** eviction — evict the request that's furthest from completion (most tokens left to generate). The idea: finish requests that are almost done rather than wasting their work. What does your design handle better? What does this approach handle better?"

**Key insight to deliver:**
> **Key insight:** Eviction policy choice directly affects user experience in ways that LRU doesn't capture. LRU evicts the oldest-accessed request, which might be a request that's 99% done generating. Shortest-remaining eviction is fairer to nearly-complete requests but requires tracking generation progress. The right choice depends on your SLA: do you care more about average latency (LRU is fine) or tail latency for nearly-complete requests (shortest-remaining is better)? There's no universal answer — the interview question is whether you can articulate the trade-off.

**Tomorrow preview:**
> Tomorrow: code kata — async generators in Python. These are how LLM inference servers stream tokens to clients: generating one at a time, yielding each as it's ready.

---

### Day 3 (Wed) — Code Kata: Async Generator for Token Streaming

**Format:** Code Kata | **Key skill:** Async generator pattern for streaming

---

**OpenClaw opening:**
> **Day 3, Week 9 — Code Kata: Async Generator**
>
> LLM inference servers stream tokens to clients one at a time as they're generated. In Python, the pattern for this is an async generator. Today you'll implement one.
>
> Kata: implement an `async def generate_tokens(prompt: str)` function that simulates token-by-token generation:
>
> ```python
> async def generate_tokens(prompt: str):
>     # Simulate token generation: split prompt into words, yield each with a delay
>     # Use `yield` (not `return`) inside an `async def` — this makes it an async generator
>     # Between each token, do an async sleep of 0.1 seconds to simulate GPU compute
>     # After all tokens, yield a final sentinel: None (signals end of stream)
>     pass
>
> async def stream_response(prompt: str):
>     # Consume the async generator and collect tokens until None
>     # Print each token as it arrives (don't wait for all of them)
>     pass
> ```
>
> Then: implement `stream_multiple(prompts: list[str])` that runs multiple `stream_response` calls concurrently with `asyncio.gather`.
>
> **Two sentences on your approach, then code.**

**Target time:** 25 min

**10-min check-in:**
> Got the async generator working? Show me what you have — even if stream_multiple isn't done.

**OpenClaw evaluation guide (internal):**
- **Strong async generator:**
  ```python
  async def generate_tokens(prompt: str):
      for word in prompt.split():
          await asyncio.sleep(0.1)
          yield word
      yield None
  ```
- **Strong consumer:**
  ```python
  async def stream_response(prompt: str):
      async for token in generate_tokens(prompt):
          if token is None:
              break
          print(token, end=' ', flush=True)
  ```
- **Key pattern:** `async for token in generator()` — this is the consumption pattern. Not `await generator()` (that's wrong for generators). Not `list(generator())` (that doesn't work on async generators).
- **Common bug 1:** Using `return` instead of `yield` inside the async def — that makes it a coroutine, not a generator.
- **Common bug 2:** Trying to use a regular `for` loop over an async generator — must use `async for`.
- **Common bug 3:** Not awaiting the sleep: `asyncio.sleep(0.1)` without `await` — this creates a coroutine object but doesn't actually sleep.

**OpenClaw feedback approach:**
- If they use `return` instead of `yield`: "You wrote `return` — that makes the function return a coroutine, not a stream. What keyword produces a generator? And then — what does adding `async` to that function do?"
- If they use `for` instead of `async for`: "Can a regular `for` loop consume an async generator? What's the consuming syntax for async iteration?"
- If it's correct: "Nice. Now: in the real inference server, you wouldn't yield `None` as a sentinel — you'd use `StopAsyncIteration`. But more importantly: what happens if the client disconnects mid-stream? How would you detect that and stop generation?"

**Key insight to deliver:**
> **Key insight:** Async generators are the natural Python primitive for token streaming. `async def` + `yield` = a function that produces values over time without blocking the event loop between yields. The consumer uses `async for` to pull items. This is exactly how production LLM inference servers work: generate one token, yield it to the HTTP response stream, `await` the next GPU step, yield the next token. The async generator is the bridge between "slow GPU computation" and "fast client streaming."

**Stretch question:**
> What would you need to change to make this a Server-Sent Events (SSE) endpoint in a web framework like FastAPI? (Don't code it — just explain the pieces.)

**Tomorrow preview:**
> Tomorrow: back to system design — KV cache eviction policies. You'll compare LRU, shortest-remaining, preemption, and abort. These are the choices you'll need to articulate in the System Design round.

---

### Day 4 (Thu) — Mini System Design: KV Cache Eviction Policies

**Format:** Mini System Design | **Key skill:** Eviction trade-offs; preemption cost

---

**OpenClaw opening:**
> **Day 4, Week 9 — Mini System Design: KV Cache Eviction Policies**
>
> On Tuesday you designed the KV cache manager. Today you go deep on the hardest part of that design: eviction policy.
>
> When VRAM is full and a new request arrives, what do you do? You have four main options:
>
> **Option A — Reject:** Turn away the new request. Simple. Safe. Bad user experience.
> **Option B — Abort a running request:** Pick a request currently generating, kill it, free its KV cache, start the new request. The aborted request gets an error.
> **Option C — Preempt and recompute later:** Pause a running request, offload its KV cache to CPU RAM (slow but doesn't lose it), free the VRAM, resume the request later by swapping its KV cache back in.
> **Option D — Evict a completed conversation's cache:** If you're caching KV for multi-turn conversations (so the next message doesn't recompute the whole history), evict one of those completed caches. This only helps if you keep post-conversation caches.
>
> **Design challenge:** For a production LLM API with SLA tiers (premium users = <1s first token, standard users = <5s), which eviction strategy do you use? When? Defend your answer.
>
> 10 minutes. Go.

**Target time:** 25 min

**OpenClaw probing questions (internal — ask one at a time):**
1. "You said preemption over abort — what's the cost of preemption? Moving 8GB of KV cache from VRAM to CPU RAM over PCIe... how long does that take?"
2. "If you reject at the API level, what HTTP status do you return? And what should the client do in response?"
3. "Your tier-based strategy — premium users never get aborted, standard users can be preempted. What happens if all running requests are premium and a standard user's request fills the queue?"
4. "How do you decide *which* running request to preempt? The newest one? The one using the most VRAM? The one closest to completion?"

**OpenClaw evaluation guide (internal):**
- **Strong answer framework:** Tier-based cascading: first evict post-conversation caches (free VRAM, no active user impact), then preempt/abort lowest-tier active requests if needed, then reject if all active requests are premium.
- **Preemption cost awareness:** PCIe bandwidth is ~60GB/s. A 4GB KV cache takes ~70ms to offload. That's acceptable if you then serve a request — but it's a real cost. Naive implementations that preempt constantly will have poor throughput.
- **Key correctness point:** Preemption vs abort trade-off: preemption preserves the request (can resume) but costs bandwidth; abort is faster but harms the user. For premium users, always preempt. For standard users, abort may be acceptable.
- **Common gap:** Not thinking about what "preemption" actually costs in time and bandwidth. Probe with: "Preemption sounds free — you're not losing work. What's the hidden cost?"

**Alternative to present:**
> "Some systems take a simpler approach: never evict running requests. Instead, implement strict request admission control — if there's no VRAM for a new request's max possible KV cache, put it in a queue. Don't start execution until you can guarantee it runs to completion. How does this compare to your preemption strategy?"

**Key insight to deliver:**
> **Key insight:** Eviction policy is where you implement your SLA guarantees. LRU evicts based on access time — which has nothing to do with user tier or completion progress. Production systems need tier-aware, progress-aware eviction. The deeper insight: preemption isn't free — offloading KV cache to CPU RAM has real latency cost. Systems like vLLM implement sophisticated preemption with pause/resume support specifically because abort is too punishing for long-running requests.

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round — LRU cache from scratch. This is the OA benchmark problem. 30 minutes, no help, production quality. Let's see where you are.

---

### Day 5 (Fri) — Mock Pressure Round: LRU Cache from Scratch (OA Benchmark)

**Format:** Mock Pressure Round | **Key skill:** Integration under pressure; OA benchmark problem

---

**OpenClaw opening:**
> **Day 5, Week 9 — Mock Pressure Round: LRU Cache from Scratch**
>
> Timer starts now. 30 minutes.
>
> **Problem:** Implement a thread-safe LRU Cache from scratch. Do NOT use `collections.OrderedDict` — build the underlying data structure yourself.
>
> Requirements:
> - `LRUCache(capacity: int)` — initialize with max capacity
> - `get(key: int) -> int` — return the value if key exists, else -1; updates recency
> - `put(key: int, value: int)` — insert or update key; if at capacity, evict the least recently used entry first; updates recency for existing keys
> - Thread-safe: multiple threads can call `get` and `put` concurrently
>
> Implementation constraints:
> - `get` and `put` must both be O(1) average
> - Must use a doubly linked list internally for the LRU ordering
> - Must handle the edge cases: `capacity = 1`, `put` to an existing key, `get` on a missing key
>
> **Type your plan first (data structures + the 3–4 key operations). I'll wait 5 minutes. Then start coding.**

**5-min planning check-in:**
> Time. What's your plan? (Data structure + key operations in 4 sentences or less.)

**10-min check-in:**
> 10 minutes left. Where are you? Post what you have.

**Hard stop:**
> Time. Post your final answer — complete or not.

**OpenClaw debrief (internal evaluation):**

**Pass criteria:**
- DLL with sentinel head/tail implemented correctly (`add_to_head`, `remove_node`, `remove_tail`)
- Dict mapping key → node for O(1) lookup
- `get`: check dict, move node to head, return value
- `put`: if key exists → update value + move to head; if at capacity → remove tail + delete from dict; add new node to head + add to dict
- Thread safety: `threading.Lock` wrapping both `get` and `put`

**Common bugs to flag:**
- `put` on existing key that doesn't move the node to head (updates value but not recency)
- `put` at capacity that doesn't delete the evicted key from the dict (memory leak)
- `remove_node` that doesn't correctly rewire both `.prev` and `.next` pointers
- Lock not covering both dict update AND DLL update atomically

**Verdict template:**
> Here's what I see:
> ✓ / ✗ DLL implementation (add_to_head, remove_node, remove_tail)
> ✓ / ✗ Dict + DLL coordination (O(1) lookup + O(1) eviction)
> ✓ / ✗ Put-to-existing-key updates recency (not just value)
> ✓ / ✗ Eviction removes from dict AND DLL atomically
> ✓ / ✗ Thread safety: lock covers both operations
>
> Interview verdict: [pass / conditional pass / fail]
>
> **Conditional pass:** Core logic correct, one production-quality issue (e.g., lock scope too narrow, or missing dict cleanup on eviction).
> **Fail:** DLL not correctly implemented, or O(1) invariant broken, or thread safety missing entirely.

**Coaching note:**
> One thing to engrave: `put` to an existing key must do TWO things — update the value AND move to head. Forgetting the "move to head" part is the most common bug. It gives wrong eviction order under load.

**Tomorrow preview:**
> Tomorrow: Review & Reflect on today's LRU. We'll compare your solution to the reference, name the gaps, and turn each gap into a targeted kata.

---

### Day 6 (Sat) — Review & Reflect: LRU Cache Mock Debrief

**Format:** Review & Reflect | **Key skill:** Production-quality bar; symmetry check

---

**OpenClaw opening:**
> **Day 6, Week 9 — Review & Reflect: LRU Cache**
>
> Before I show you anything — describe yesterday's LRU problem from memory. What was your approach? What data structures did you use? Where did you get stuck?
>
> *(Wait for user response)*

**After recall:**
> Now let's compare. Here's the reference solution outline:
>
> ```python
> class Node:
>     def __init__(self, key=0, val=0):
>         self.key = key
>         self.val = val
>         self.prev = self.next = None
>
> class LRUCache:
>     def __init__(self, capacity):
>         self.cap = capacity
>         self.cache = {}  # key → Node
>         self.head = Node()  # sentinel
>         self.tail = Node()  # sentinel
>         self.head.next = self.tail
>         self.tail.prev = self.head
>         self.lock = threading.Lock()
>
>     def _add_to_head(self, node):
>         node.next = self.head.next
>         node.prev = self.head
>         self.head.next.prev = node
>         self.head.next = node
>
>     def _remove_node(self, node):
>         node.prev.next = node.next
>         node.next.prev = node.prev
>
>     def get(self, key):
>         with self.lock:
>             if key not in self.cache:
>                 return -1
>             node = self.cache[key]
>             self._remove_node(node)
>             self._add_to_head(node)
>             return node.val
>
>     def put(self, key, val):
>         with self.lock:
>             if key in self.cache:
>                 node = self.cache[key]
>                 node.val = val
>                 self._remove_node(node)
>                 self._add_to_head(node)
>             else:
>                 if len(self.cache) == self.cap:
>                     lru = self.tail.prev  # node before sentinel tail
>                     self._remove_node(lru)
>                     del self.cache[lru.key]
>                 node = Node(key, val)
>                 self.cache[key] = node
>                 self._add_to_head(node)
> ```

**Gap analysis questions:**
> 1. Did your DLL store the key in the node? (It needs to, so eviction can remove from the dict.) If not — what would happen when you evicted the tail node and tried to delete from the dict?
> 2. Was your lock scope correct? Did `get` lock around the dict read + the DLL move, atomically? What race condition exists if you lock only the dict operation?
> 3. Did `put` for an existing key move the node to head? Trace through your code — what happened?

**Gap classification:**
> Name your top gap from yesterday:
> - **Knowledge gap:** "I didn't know nodes need to store the key for eviction"
> - **Execution gap:** "I knew the design but couldn't write `_remove_node` correctly under pressure"
> - **Judgment gap:** "I knew lock scope mattered but chose wrong under time pressure"

**Key insight to deliver:**
> **Key insight:** The DLL node must store the key — not just the value. This is the symmetry property: to evict the tail, you need to find and delete it from the dict, which requires knowing its key. If you only store the value in the node, eviction breaks. Whenever you have two data structures (here: dict + DLL) that must stay in sync, every operation must update both, atomically under lock.

**Next week preview:**
> Next week: continuous batching, prefix caching, and PagedAttention — the three vLLM concepts that interviewers specifically probe. We're building the depth that turns "okay" into "impressive."

---

### Day 7 (Sun) — SQL Challenge: Median Session Length by Country

**Format:** SQL Challenge | **Key skill:** PERCENTILE_DISC vs PERCENTILE_CONT

---

**OpenClaw opening:**
> **Day 7, Week 9 — SQL Challenge: Median Session Length**
>
> Tables:
>
> ```
> sessions(id, user_id, country, duration_seconds, started_at)
> users(id, country, tier)
> ```
>
> **Query:** Find the median session length (in seconds) for each country, for sessions in the last 30 days. Order by median descending.
>
> Two notes:
> 1. For the median of an even-numbered set, return the lower of the two middle values (PERCENTILE_DISC, not PERCENTILE_CONT).
> 2. Only include countries with at least 100 sessions in the time window.
>
> Write the SQL. You have 12 minutes.

**Target time:** 20 min

**OpenClaw evaluation:**
- **Strong answer:**
  ```sql
  SELECT
      country,
      PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY duration_seconds) AS median_duration_s
  FROM sessions
  WHERE started_at >= NOW() - INTERVAL '30 days'
  GROUP BY country
  HAVING COUNT(*) >= 100
  ORDER BY median_duration_s DESC;
  ```
- **Common mistake 1:** Using `PERCENTILE_CONT` (returns interpolated float for even sets) instead of `PERCENTILE_DISC` (returns an actual value from the data). The problem says "lower of two middle values" → that's PERCENTILE_DISC.
- **Common mistake 2:** Forgetting `HAVING COUNT(*) >= 100` — this filters countries with insufficient data.
- **Common mistake 3:** Using `AVG` for median — AVG is the mean, not the median. These diverge when data is skewed.

**Key insight to deliver:**
> **Key insight:** `PERCENTILE_DISC` picks an actual data point (the discrete value at the percentile). `PERCENTILE_CONT` interpolates between data points (useful for continuous distributions like time, but not when you want a real value from your data). Median session duration should be PERCENTILE_DISC — you want a real session value, not an interpolated 4.7 seconds. Memorize the syntax: `PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY column)`.

**Tomorrow preview:**
> Tomorrow: continuous batching — the most important concept for the System Design round. We go deep.

---

## WEEK 10: Continuous Batching + Prefix Caching + GPU Memory

**This week's arc:** Why old-style batching wastes GPU → continuous batching as the solution → prefix caching for shared system prompts → PagedAttention as the memory fragmentation fix. By the end of this week, you should be able to explain the full vLLM design.

---

### Day 8 (Mon) — Concept Deep Dive: Continuous Batching

**Format:** Concept Deep Dive | **Key skill:** Continuous batching: join batch mid-generation

---

**OpenClaw opening:**
> **Day 8, Week 10 — Concept Deep Dive: Continuous Batching**
>
> Today's concept is the most important one for the System Design round. If you understand continuous batching deeply, you'll be able to hold your own with an interviewer who builds LLM inference for a living.
>
> **The problem with naive batching:**
>
> Old approach (static batching): wait until you have a full batch of N requests, run them all together, return results. The GPU efficiently processes all N in parallel. But here's the problem: what if Request 1 needs 50 tokens and Request 2 needs 500 tokens? You have to wait for Request 2 to finish before you can start any new requests — even though Request 1 finished 450 tokens ago. You're paying GPU cycles waiting for the slowest request.
>
> **Iteration batching (better, but not great):**
> At each token generation step, process all requests in the current batch together. When a request finishes, it leaves the batch. New requests join at the next step. Slightly better — but requests still have to wait for the current step to finish before joining.
>
> **Continuous batching (the modern approach — vLLM, TGI, etc.):**
> The key insight: at every single generation step, check if any slots are available in the batch. A request finishing and a new request joining can happen within the same step. Think of it like a restaurant where a table opens and new guests are seated before the dessert from the previous table is even cleared — there's no "close the kitchen between seatings."
>
> The practical result: GPU utilization goes from ~40% (static batching) to ~90%+ (continuous batching) because there's almost never idle GPU time waiting for slow requests to finish.
>
> Questions before the application challenge?

**OpenClaw Q&A approach (internal):**
- "What determines 'batch capacity'?": "Memory bandwidth and VRAM. The batch size is limited by how many KV caches you can fit simultaneously — each concurrent request needs its own KV cache in VRAM."
- "Can a request join mid-sentence?": "Yes — in continuous batching, 'joining the batch' means 'starting to generate tokens alongside other requests.' There's no concept of a request waiting for a round-robin slot."
- "How is this implemented?": "The scheduler maintains a 'ready to run' queue. At each forward pass, it fills available GPU memory with as many requests as possible. When a request finishes (outputs EOS token), its VRAM is freed and immediately allocated to the next queued request."

**Application challenge (10 min):**
> Scenario: your inference server uses static batching with batch size 16. Request 1 needs 2000 tokens (a long summarization), Requests 2–16 each need 50 tokens (short Q&A). With static batching:
>
> 1. How many tokens of GPU time are wasted per "batch round"?
> 2. With continuous batching instead, Requests 2–16 finish after 50 steps — what happens at step 51?
> 3. Why does continuous batching require the scheduler to know how much VRAM each request will need *before* starting it?
>
> Answer all three.

**OpenClaw evaluation guide (internal):**
- **Q1:** (2000 - 50) × 15 = 28,500 token-generation slots wasted waiting for Request 1. The 15 fast requests sit idle for 1950 steps.
- **Q2:** At step 51, 15 requests have finished. Their VRAM slots are freed. The scheduler immediately fills those 15 slots with 15 queued requests. Request 1 continues generating alongside the new batch.
- **Q3:** The scheduler must pre-allocate VRAM for each request's KV cache. If it starts a 10K-token request but only has VRAM for 5K tokens, it'll run out of memory mid-generation. This is why variable-length requests are hard — you need to estimate or cap the max output length.

**Key insight to deliver:**
> **Key insight:** Continuous batching decouples "this request finished" from "now we can start new requests." In static batching, the batch is a unit — everyone waits for everyone. In continuous batching, each request is independent: finish when you finish, new requests join the GPU continuously. The constraint that makes this hard: each request needs a KV cache slot allocated upfront, so the scheduler must track VRAM like a memory allocator — not just "how many requests" but "how many token-slots of VRAM are available."

**Tomorrow preview:**
> Tomorrow: you design the scheduler. When does it flush the batch? When does it hold for more requests? This is the latency/throughput dial that interviewers love to probe.

---

### Day 9 (Tue) — Mini System Design: Dynamic Batching Scheduler

**Format:** Mini System Design | **Key skill:** Flush trigger: time, size, or memory pressure

---

**OpenClaw opening:**
> **Day 9, Week 10 — Mini System Design: Dynamic Batching Scheduler**
>
> You understand continuous batching now. Today you design the scheduler that controls it.
>
> **Design challenge:** Build the batching scheduler for an LLM inference API.
>
> Context:
> - Requests arrive with variable token counts (input prompt + max output tokens)
> - The GPU can run a batch of up to N concurrent requests (N depends on VRAM)
> - Requests waiting to run sit in a queue
> - The scheduler decides: when to start a new batch step, which requests to include, when to "flush" (force a forward pass even if the batch isn't full)
>
> Specifically: **when do you flush?** Design the flush trigger logic. What signals tell you to stop waiting for more requests and run the GPU forward pass now?
>
> 10 minutes. Go.

**Target time:** 25 min

**OpenClaw probing questions (internal — ask one at a time):**
1. "You said 'flush when batch is full' — how do you define 'full'? By request count, or by VRAM usage?"
2. "What if the batch never fills? A low-traffic period at 3am — do you just never run? What's the second trigger?"
3. "You have a time-based trigger (flush every 50ms max). A premium user sends a request at t=1ms, and you're waiting to flush at t=50ms. Do you wait?"
4. "If you flush too eagerly (every 1ms), what's the cost? If you flush too lazily (every 500ms), what's the cost?"

**OpenClaw evaluation guide (internal):**
- **Strong flush trigger:** Three triggers in priority order: (1) VRAM usage hits threshold (memory-pressure flush), (2) time-based deadline (max latency guarantee — flush after T ms regardless), (3) batch is "full enough" (count-based, but secondary to VRAM).
- **Key insight about VRAM-based flush:** Flushing when VRAM is "full" is smarter than flushing when request count is full — because a 10K-token request occupies 100x more VRAM than a 100-token one. Count-based batching gives unfair GPU utilization.
- **Latency vs throughput dial:** More aggressive flush (earlier trigger) = lower latency, lower throughput. More patient flush = higher throughput, higher latency. The right setting depends on SLA.
- **Common gap:** Not thinking about the time-based deadline trigger. Probe with: "What if requests trickle in one every 200ms? How does a count-based flush help?"

**Alternative to present:**
> "Some systems use a token-budget flush instead: flush when the sum of all queued input tokens exceeds T. This way, each batch does a similar amount of compute regardless of how many requests are in it. How does this compare to your VRAM-based flush?"

**Key insight to deliver:**
> **Key insight:** The batching scheduler has two competing objectives: maximize throughput (fill the GPU completely before flushing) and minimize latency (don't make users wait). The right flush trigger is a combination: (1) VRAM-based capacity trigger (flush when memory is near full), (2) time-based deadline (flush after at most X ms, regardless), (3) SLA-tier override (premium requests bypass the wait). The time-based trigger is the one people forget — without it, low-traffic periods have unbounded latency.

**Tomorrow preview:**
> Tomorrow: prefix caching — when identical system prompts let you reuse KV cache computation across requests.

---

### Day 10 (Wed) — Concept Deep Dive: Prefix Caching

**Format:** Concept Deep Dive | **Key skill:** Prefix caching as shared computation

---

**OpenClaw opening:**
> **Day 10, Week 10 — Concept Deep Dive: Prefix Caching**
>
> Today's concept is one of the highest-value optimizations in production LLM serving — and it's often underestimated in interviews.
>
> **The scenario:** You're running a customer service bot. Every single request starts with the same system prompt — let's say it's 500 tokens: "You are a helpful assistant for Acme Corp. Your guidelines are: [500 tokens of instructions]."
>
> Without prefix caching: every single request computes the KV cache for those 500 tokens from scratch. If you're serving 1000 requests per second, you're computing the same 500-token KV cache 1000 times per second. Enormous waste.
>
> **Prefix caching:** If two requests share a common token prefix (e.g., the same system prompt), you compute the KV cache for that prefix exactly once, cache it, and share it across all requests with that prefix. Request 1 generates the 500-token KV cache. Requests 2 through 1000 just point to the cached version and only compute the KV for their unique tokens.
>
> **What this requires:**
> 1. A way to identify requests with the same prefix (hash the prefix tokens)
> 2. The KV cache must be stored in a way that supports sharing (read-only shared pages vs per-request pages)
> 3. The prefix cache must be separate from the per-request KV cache (prefix cache is long-lived; per-request KV cache is ephemeral)
>
> Questions?

**OpenClaw Q&A approach (internal):**
- "What if the system prompt changes?": "You'd hash the new prompt, get a cache miss, and compute it. The old cached prefix would be evicted eventually (it's just another cache entry). You'd want TTL-based expiry or reference counting to know when a prefix cache entry is no longer needed."
- "Is the prefix cache in VRAM too?": "Yes — it has to be, for performance reasons. This means the prefix cache competes with per-request KV cache for VRAM. You need to size it appropriately. Some systems keep a fixed portion of VRAM as prefix cache."
- "What's the savings?": "In production chatbot settings, prefix caching can eliminate 60-80% of TTFT (time to first token) computation, since the prompt often dominates the request."

**Application challenge (10 min):**
> Scenario: your inference server serves two products:
> - Product A: customer service chatbot, 500-token system prompt, highly consistent across requests
> - Product B: creative writing tool, no system prompt, every request is unique
>
> 1. How does prefix caching help Product A? What metric improves most?
> 2. How does prefix caching help Product B? (Hint: think multi-turn conversation)
> 3. If you have 10GB of VRAM dedicated to prefix caching, how do you evict prefix cache entries to make room for new ones?

**OpenClaw evaluation guide (internal):**
- **Q1:** Product A: dramatic improvement to TTFT (time to first token) — the 500-token system prompt KV cache is served from cache, so generation starts almost immediately instead of after 500 token forward passes. Also reduces compute cost proportionally.
- **Q2:** Product B: multi-turn conversations also benefit — turn 1's tokens are the "prefix" for turn 2. After turn 1, its KV cache is stored. Turn 2 only needs to compute KV for the new tokens. As the conversation grows, each new turn only pays for its own tokens, not the entire history.
- **Q3:** LRU on prefix cache entries (evict the prefix that hasn't been used most recently). But this requires reference counting — don't evict a prefix that's currently being used by active requests.

**Key insight to deliver:**
> **Key insight:** Prefix caching is shared memory for common computation. It's most powerful when request distributions are "lumpy" — most requests share a few common prefixes (like system prompts). The key implementation challenge: the prefix cache must support concurrent read access (many requests reading the same cache entry simultaneously) and careful eviction (never evict while in-use). This is why vLLM's PagedAttention (tomorrow's concept) is so powerful — it makes prefix cache sharing efficient without copying.

**Tomorrow preview:**
> Tomorrow: PagedAttention — vLLM's answer to KV cache memory fragmentation. Think virtual memory for GPU.

---

### Day 11 (Thu) — Mini System Design: PagedAttention and VRAM Fragmentation

**Format:** Mini System Design | **Key skill:** Fragmentation problem; paging as solution

---

**OpenClaw opening:**
> **Day 11, Week 10 — Mini System Design: PagedAttention**
>
> Today's design challenge requires understanding PagedAttention — vLLM's most important innovation. Let me give you the concept, then you'll work through the design implications.
>
> **The problem:** In naive KV cache management, each request gets a contiguous block of VRAM allocated upfront (for its max possible output length). This causes two problems:
> 1. **Internal fragmentation:** You reserve 10K token slots for a request, but it only generates 500 tokens. 9,500 slots are wasted (allocated but unused).
> 2. **External fragmentation:** After many requests finish, free VRAM is scattered in non-contiguous chunks. A new large request might need 8GB contiguous, but you only have 8GB in 100 non-contiguous pieces.
>
> **PagedAttention's solution:** Borrow from OS virtual memory paging.
>
> Instead of contiguous allocation, divide VRAM into fixed-size "pages" (e.g., 16 KV slots each). Each request's KV cache is stored across multiple non-contiguous pages, tracked via a "page table" (a mapping from logical position to physical VRAM page). A request that generates 500 tokens only uses 32 pages (⌈500/16⌉), not a 10K reservation.
>
> **Design challenge:** You're implementing the page allocator for a KV cache using this model.
> - VRAM = 80GB, page size = 16 KV slots × 2MB per slot = 32MB per page → 2,500 pages total
> - Requests arrive with max output token estimates
> - Pages are allocated on-demand (one page at a time as generation proceeds, not all upfront)
>
> Design: how do you track which pages are free? How do you handle a request that needs a new page but there are none free? How do you support prefix sharing (same prefix → same physical pages shared by multiple requests)?
>
> 10 minutes. Go.

**Target time:** 25 min

**OpenClaw probing questions (internal — ask one at a time):**
1. "You said 'free list of page IDs' — what's the data structure for fast allocation? O(1) allocation is important at high throughput."
2. "A request is mid-generation and needs its 33rd page, but there are none free. What options do you have? Abort, preempt, or wait?"
3. "For prefix sharing: if two requests share the first 500 tokens (32 pages), those 32 pages are shared. When Request 1 finishes — can you free those shared pages? What reference count do you need?"
4. "On-demand allocation means a request's page table grows as it generates. At what granularity does the scheduler check if there are enough free pages to continue — every token? Every page boundary?"

**OpenClaw evaluation guide (internal):**
- **Strong free list:** Stack or queue of free page IDs. O(1) pop to allocate a page. O(1) push to free a page. Never needs to search.
- **Strong "no pages" handling:** Preempt another request (pause it, reclaim its non-shared pages), or queue the new page request (the current request pauses at the page boundary until a page frees up).
- **Prefix sharing:** Reference counting per page. Page only goes back to the free list when ref_count = 0. Requests using a shared prefix page increment the refcount; when a request finishes, it decrements refcount of all its pages, freeing only those that reach 0.
- **Granularity:** Check at each page boundary (every 16 tokens). If no page is available, the request suspends at that boundary until one frees up. This is the "pause at page boundary" approach — much cleaner than preempting mid-token.

**Alternative to present:**
> "The simpler alternative: pre-allocate all pages a request might need upfront (pessimistic allocation). Reject requests that would exceed available pages. No fragmentation, no on-demand complexity. What does your design handle better?"

**Key insight to deliver:**
> **Key insight:** PagedAttention is OS virtual memory applied to GPU VRAM. The insight that makes it work: KV cache positions are logically sequential but don't need to be physically contiguous. A page table translates "KV position 517" to "physical VRAM page 43, offset 5" — just like virtual memory translates virtual address to physical address. This eliminates fragmentation AND enables zero-copy prefix sharing (multiple requests point to the same physical pages without copying). vLLM's throughput improvement (up to 24x over naive serving) comes almost entirely from this.

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round — async web crawler with timeout handling. You've been building toward this for 6 weeks. Let's see it under pressure.

---

### Day 12 (Fri) — Mock Pressure Round: Async Web Crawler with Timeouts

**Format:** Mock Pressure Round | **Key skill:** `asyncio.wait_for` timeout; handle TimeoutError

---

**OpenClaw opening:**
> **Day 12, Week 10 — Mock Pressure Round: Async Web Crawler with Timeouts**
>
> Timer starts now. 30 minutes.
>
> **Problem:** Implement an async web crawler.
>
> Requirements:
> - `crawl(start_url: str, max_depth: int, max_concurrent: int) -> set[str]` — returns all URLs discovered
> - BFS traversal starting from `start_url`, up to `max_depth` levels deep
> - Dedup: never fetch the same URL twice
> - Concurrency: use `asyncio.Semaphore` to limit to `max_concurrent` simultaneous fetches
> - Timeout: each individual URL fetch times out after 5 seconds; timed-out URLs are skipped (not retried)
> - `fetch_url(url: str) -> list[str]` is provided — it's an async function that returns a list of URLs found on that page (or raises `asyncio.TimeoutError` if slow)
>
> Write production-quality Python. Handle edge cases.
>
> **Type your plan first. I'll wait 5 minutes.**

**5-min planning check-in:**
> Time. Plan?

**10-min check-in:**
> 10 minutes left. Where are you?

**Hard stop:**
> Time. Post what you have.

**OpenClaw debrief (internal evaluation):**

**Pass criteria:**
- BFS with deque, visited-on-enqueue
- `asyncio.Semaphore(max_concurrent)` wrapping each `fetch_url` call
- `asyncio.wait_for(fetch_url(url), timeout=5.0)` with `try/except asyncio.TimeoutError: continue`
- `asyncio.gather` or task-based concurrency (not sequential `await` in a loop)
- Correct BFS depth tracking (don't go past max_depth)

**Common bugs to flag:**
- Using `await fetch_url(url)` in a for loop without `asyncio.gather` — sequential, not concurrent
- Not handling `TimeoutError` — letting it propagate crashes the entire crawl
- Dedup on dequeue instead of enqueue — allows duplicate URLs in queue (exponential blowup on dense graphs)
- Not using semaphore correctly — semaphore inside `gather` vs outside (inside is correct)

**Verdict template:**
> ✓ / ✗ BFS with visited-on-enqueue
> ✓ / ✗ asyncio.Semaphore for concurrency limiting
> ✓ / ✗ asyncio.wait_for for timeout
> ✓ / ✗ TimeoutError caught and request skipped
> ✓ / ✗ Concurrent fetching (gather or tasks, not sequential)
> ✓ / ✗ Depth control correct
>
> Interview verdict: [pass / conditional pass / fail]

**Coaching note:**
> The timeout pattern: `asyncio.wait_for(coro, timeout=N)` wraps any coroutine in a deadline. Always wrap it in try/except TimeoutError. This pattern appears in ANY production async code — get it automatic.

**Tomorrow preview:**
> Tomorrow: Review & Reflect on the crawler. We'll focus on timeout cleanup — what happens to resources when a fetch is cancelled mid-flight?

---

### Day 13 (Sat) — Review & Reflect: Async Crawler + Timeout Resource Cleanup

**Format:** Review & Reflect | **Key skill:** Resource cleanup in async context managers

---

**OpenClaw opening:**
> **Day 13, Week 10 — Review & Reflect: Async Crawler**
>
> From memory: describe your crawler implementation. What was the concurrency structure? How did you handle timeouts?

**After recall:**
> Good. Let's focus on one thing: what happens when `asyncio.wait_for` times out?
>
> When you call `asyncio.wait_for(fetch_url(url), timeout=5.0)` and the timeout fires, Python cancels the underlying `fetch_url` coroutine by throwing `asyncio.CancelledError` inside it at the next `await` point. If `fetch_url` opens a connection and is awaiting a response, the connection is cancelled.
>
> The question: what if `fetch_url` has cleanup to do? For example:
> ```python
> async def fetch_url(url):
>     conn = await open_connection(url)
>     try:
>         data = await conn.read()
>         return parse_links(data)
>     finally:
>         await conn.close()  # Does this run on cancellation?
> ```
>
> Does the `finally` block run when `asyncio.CancelledError` is raised? Answer before I tell you.

**Discussion:**
> Yes — `finally` blocks run even on cancellation. `CancelledError` is an exception and Python's exception handling runs `finally` before propagating. This is why async context managers (`async with`) are the right pattern — they guarantee cleanup.
>
> The problem: if your cleanup also awaits something (`await conn.close()`), that await can run fine. But if the cleanup raises another exception, the `CancelledError` is swallowed. Production async code must be careful here.

**Gap analysis:**
> In your crawler, did you:
> 1. Use `try/except asyncio.TimeoutError` correctly (or just bare `except Exception`)?
> 2. Think about what `fetch_url`'s resource cleanup looks like?
> 3. Use `async with asyncio.timeout(5)` (Python 3.11+) instead of `wait_for` — do you know this alternative?

**Key insight to deliver:**
> **Key insight:** Timeout + cleanup is the hardest part of async code. `asyncio.wait_for` cancels the underlying coroutine cleanly, but the cancelled coroutine must cooperate — its `finally` blocks run, but they must not raise. The safe pattern: always use `async with resource:` rather than manual open/close, and make sure `__aexit__` handles `CancelledError` gracefully. In the interview, you'll get credit just for knowing this is a concern.

**Next week preview:**
> Next week: autoscaling signals (the key insight that wins the System Design interview), request queuing design, streaming responses, and a mock in-memory database. We're building toward the full inference stack synthesis in Week 12.

---

### Day 14 (Sun) — Debug & Read: Fixed-Window Rate Limiter Burst Bug

**Format:** Debug & Read | **Key skill:** Fixed vs sliding window; the burst problem

---

**OpenClaw opening:**
> **Day 14, Week 10 — Debug & Read: Rate Limiter Burst Bug**
>
> Read this rate limiter. Tell me what it does, then list everything wrong with it:
>
> ```python
> import time
> from collections import defaultdict
>
> class RateLimiter:
>     def __init__(self, max_requests: int, window_seconds: int):
>         self.max_requests = max_requests
>         self.window_seconds = window_seconds
>         self.counts = defaultdict(int)
>         self.windows = defaultdict(float)
>
>     def allow(self, user_id: str) -> bool:
>         now = time.time()
>         window_start = self.windows[user_id]
>
>         if now - window_start >= self.window_seconds:
>             # New window
>             self.windows[user_id] = now
>             self.counts[user_id] = 1
>             return True
>
>         if self.counts[user_id] < self.max_requests:
>             self.counts[user_id] += 1
>             return True
>
>         return False
> ```

**Read & explain (8 min):**
> What does this code do? Walk me through the logic.

**Bug finding (8 min):**
> Now: where does this break? Hint — think about what happens at the boundary between windows.

**OpenClaw hint progression:**
1. First hint (if stuck): "Imagine the window is 60 seconds and max_requests is 10. What if a user sends 10 requests at t=59s? Then sends 10 more requests at t=61s?"
2. Second hint: "Both batches are allowed. That's 20 requests in a 2-second span. The 60-second window is supposed to prevent this."

**Bug explanation:**
> The fixed-window burst problem: with max=10 per 60 seconds, a user can send 10 requests at t=59s (end of window 1) and 10 requests at t=61s (start of window 2). That's 20 requests in 2 seconds — 2x the rate limit.
>
> Fix: use a sliding window (store timestamps of each request, count only those within the last N seconds), or use a token bucket approach.

**Key insight to deliver:**
> **Key insight:** Fixed-window rate limiting is simple but has a well-known burst vulnerability at window boundaries. Sliding-window limiting (storing timestamps and counting recent requests) is 2x more CPU/memory intensive but correct. In interviews, always acknowledge the burst problem when a fixed-window design comes up — it signals you know the real-world failure modes.

---

## WEEK 11: Autoscaling Signals + Request Queuing + Streaming

**This week's arc:** The most important single insight for the System Design round — what signal to use for autoscaling → designing the actual queuing layer → implementing streaming responses with backpressure → mock in-memory database.

---

### Day 15 (Mon) — Concept Deep Dive: Autoscaling Signals

**Format:** Concept Deep Dive | **Key skill:** Queue depth × token count as the leading signal

---

**OpenClaw opening:**
> **Day 15, Week 11 — Concept Deep Dive: Autoscaling Signals**
>
> This is the single most important concept for the Anthropic System Design round. Pay attention.
>
> **The naive approach:** Scale GPU servers based on GPU utilization. If GPU util > 80%, add more servers. This seems obvious. It's wrong for LLM inference.
>
> **Why GPU util is a lagging, misleading signal:**
>
> Imagine this scenario: you have 4 GPU servers. Each is running at 95% GPU utilization — they're busy. But they're all working on long 10K-token requests that will take 30 more seconds to finish. Meanwhile, your request queue has 500 new requests waiting. Your autoscaler sees "GPU util = 95% — all good, no need to scale." But your users are waiting 30+ seconds for their requests to even START. Latency is terrible. GPU util looks fine.
>
> **The right signal: queue depth weighted by token count.**
>
> Specifically: `sum(input_tokens + max_output_tokens for each request in queue)`. This tells you: "how much compute work is waiting?" not "are my current GPUs busy?"
>
> When this weighted queue depth exceeds a threshold (e.g., more than 1 GPU-minute worth of work), scale up — even if current GPU util is 100%. The goal is to keep latency low, not just keep GPUs busy.
>
> **Secondary signal: time in queue (p99 wait time).** If the 99th percentile wait time in your queue exceeds your SLA target, scale up immediately regardless of other signals.
>
> Questions?

**OpenClaw Q&A approach (internal):**
- "How do you know max_output_tokens?": "You often don't — requests specify a max, not a guaranteed output length. You use the specified max as the worst case for planning. Some systems use historical averages or ML-predicted output lengths."
- "What's the scale-down signal?": "Reverse: when weighted queue depth drops below a low-water mark AND queue wait time is near-zero, scale down. But scale-down has inertia — you want to avoid thrashing (scale up, then down, then up). Add a cooldown period."
- "Why not scale on p99 latency of completed requests?": "That's a lagging signal — the request is already done by the time you measure it. Queue depth tells you what's about to happen, not what just happened. Leading > lagging."

**Application challenge (10 min):**
> Your inference server has this state:
> - 3 GPU servers, each processing a batch
> - Queue: 200 requests waiting, average (input + max_output) = 2000 tokens each
> - Current GPU util: 97%
> - Each GPU can process approximately 100K tokens/minute
>
> 1. What is the weighted queue depth in "GPU-minutes"?
> 2. If you use raw GPU util as your autoscaling signal, do you scale up? What does your autoscaler do?
> 3. If you use weighted queue depth, what's your decision?
> 4. What's the p99 wait time if you DON'T scale up?

**OpenClaw evaluation guide (internal):**
- **Q1:** 200 requests × 2000 tokens = 400K tokens in queue. 3 GPUs × 100K tokens/min = 300K tokens/min capacity. Queue depth = 400K / 300K = 1.33 GPU-minutes.
- **Q2:** GPU util = 97% — autoscaler says "busy, scale up." But this is coincidental — the util could look high even if the queue was empty (all 3 GPUs working on 3 requests). Raw util doesn't tell you if the queue is backing up.
- **Q3:** Weighted queue depth = 1.33 GPU-minutes. If your SLA requires <30s wait time, you need to clear the queue in 0.5 GPU-minutes worth of new capacity. Scale up by 1–2 GPUs.
- **Q4:** 400K tokens / 300K tokens per minute = 1.33 minutes = ~80 seconds average wait. P99 is worse — probably 3–5 minutes for the unluckiest requests.

**Key insight to deliver:**
> **Key insight:** GPU utilization is a measure of current efficiency, not future demand. For latency-sensitive systems, you need **leading indicators** (queue depth) not lagging ones (GPU util). The "weighted by token count" part is critical: a queue of 100 10K-token requests represents 10x more work than a queue of 100 100-token requests. A token-count-naive signal would treat them identically. This is the answer Anthropic interviewers are looking for when they ask "what signal do you use for autoscaling?"

**Tomorrow preview:**
> Tomorrow: you design the actual queuing layer. What data structure? How is priority assigned? What happens when the queue is full?

---

### Day 16 (Tue) — Mini System Design: LLM Inference Request Queue

**Format:** Mini System Design | **Key skill:** Priority queue with token-weighted keys

---

**OpenClaw opening:**
> **Day 16, Week 11 — Mini System Design: Inference Request Queue**
>
> You know the autoscaling signal. Now design the queue it's monitoring.
>
> **Design challenge:** Design the queuing layer for an LLM inference API.
>
> Context:
> - Requests arrive via HTTP from users
> - GPU workers pull requests from the queue to execute
> - Two SLA tiers: premium (guaranteed <1s TTFT) and standard (<5s TTFT)
> - Requests have variable token counts (input prompt + max output tokens)
> - The queue can become "full" if GPU workers can't keep up with arrival rate
>
> Design:
> 1. What data structure backs the queue? How is a request represented?
> 2. How is priority determined? What's the priority key?
> 3. What happens when the queue is full (i.e., you'd violate the TTFT SLA for a new request even with 0 queue wait)?
> 4. How do you prevent premium users from starving standard users indefinitely?
>
> 10 minutes. Go.

**Target time:** 25 min

**OpenClaw probing questions (internal — ask one at a time):**
1. "Your priority key is just 'tier' (premium = high, standard = low). What happens if 1000 premium users arrive before a standard user? How long does the standard user wait?"
2. "You mentioned token-weighted priority — a 100-token premium request has higher priority than a 10K-token premium request? Is that the right call?"
3. "Queue is 'full' — you said reject with 503. What information do you include in the 503 response to help clients retry intelligently?"
4. "How does the autoscaling controller read this queue? What metric does it read, and how often?"

**OpenClaw evaluation guide (internal):**
- **Data structure:** Priority queue (min-heap or sorted structure). Each entry: `(priority_key, arrival_time, request_id, token_count, tier, payload)`.
- **Priority key design:** Tier-based with age factor. Premium gets a base priority, standard gets a lower base, but both get incremented over time (priority aging — prevents starvation). A request that's been waiting 30 seconds at standard tier should eventually beat a freshly-arrived standard tier request.
- **Token-weighted priority:** Debatable. Lower token count = faster to complete = prioritize it first? Or first-come-first-served within tier? The interview answer is: articulate the trade-off and pick one with a reason.
- **Full queue handling:** 503 with `Retry-After: N` header (estimated N seconds to next available slot). Don't return 429 — 429 implies "you're rate-limited," but the issue is server capacity, not user behavior. 503 = service unavailable.
- **Starvation prevention:** Priority aging (add a time-based bonus to priority for requests that have been waiting a long time). Some systems use two separate queues (one per tier, weighted round-robin between them).

**Alternative to present:**
> "Instead of a single priority queue, use two queues: one for premium, one for standard. Workers pull from premium queue first; if premium queue is empty, pull from standard. Weight it 80/20: 8 GPU slots per step go to premium, 2 go to standard (even when premium backlog exists). What does this handle better than your design?"

**Key insight to deliver:**
> **Key insight:** A naive priority queue gives premium users absolute priority — which means standard users can starve indefinitely during peak load. The fix is priority aging: as a request waits, its priority score increases. After waiting long enough, even a standard request beats a freshly-arrived premium one. This is the production fairness mechanism. The interview expects you to identify the starvation problem and propose a solution — not just say "priority queue."

**Tomorrow preview:**
> Tomorrow: code kata — asyncio.Queue with priority. Implementing the priority queue in an async context, because GPU workers consume from the queue asynchronously.

---

### Day 17 (Wed) — Code Kata: asyncio.Queue with Priority

**Format:** Code Kata | **Key skill:** Priority queue in async context

---

**OpenClaw opening:**
> **Day 17, Week 11 — Code Kata: asyncio.Queue with Priority**
>
> You designed the inference queue. Now implement it in Python with asyncio — because the GPU workers consuming from it are async coroutines.
>
> Kata: implement a `PriorityRequestQueue` using `asyncio` primitives:
>
> ```python
> import asyncio
> import heapq
>
> class PriorityRequestQueue:
>     def __init__(self):
>         # Internal: a list used as a min-heap via heapq
>         # Priority entries: (priority, arrival_seq, request_id, payload)
>         # Lower priority number = higher priority (min-heap)
>         # arrival_seq breaks ties (earlier arrival = higher priority within same tier)
>         self._heap = []
>         self._counter = 0  # monotonically increasing sequence number
>         self._not_empty = asyncio.Condition()
>
>     async def put(self, priority: int, request_id: str, payload: dict):
>         """Add a request to the queue."""
>         pass
>
>     async def get(self) -> tuple[str, dict]:
>         """Wait for and return (request_id, payload) of highest-priority request."""
>         pass
>
>     def qsize(self) -> int:
>         """Return current queue size."""
>         pass
> ```
>
> Use `asyncio.Condition` for coordination: `put` notifies waiting `get` calls.
>
> **Two sentences on your approach, then code.**

**Target time:** 25 min

**10-min check-in:**
> Got `put` working? Show me what you have.

**OpenClaw evaluation guide (internal):**
- **Strong `put`:**
  ```python
  async def put(self, priority: int, request_id: str, payload: dict):
      async with self._not_empty:
          heapq.heappush(self._heap, (priority, self._counter, request_id, payload))
          self._counter += 1
          self._not_empty.notify()
  ```
- **Strong `get`:**
  ```python
  async def get(self) -> tuple[str, dict]:
      async with self._not_empty:
          while not self._heap:
              await self._not_empty.wait()
          priority, seq, request_id, payload = heapq.heappop(self._heap)
          return request_id, payload
  ```
- **Key pattern:** `asyncio.Condition` for async producer-consumer. `notify()` wakes one waiter. `wait()` releases the lock and suspends until notified. The `while not self._heap` loop guards against spurious wakeups.
- **Common bug 1:** Using `threading.Condition` instead of `asyncio.Condition` — you can't `await` on a threading.Condition.
- **Common bug 2:** Not using `async with self._not_empty` in `get` — condition must be acquired before wait.
- **Common bug 3:** Using `if` instead of `while` before `self._not_empty.wait()` — spurious wakeup protection requires `while`.
- **The sequence number:** Essential for tie-breaking within the same priority tier. Without it, `heapq` compares the payload dict, which fails if it contains non-comparable types.

**OpenClaw feedback approach:**
- If they use `threading.Condition`: "Can you await on a threading.Condition? What happens if you try? What asyncio primitive provides the same semantics?"
- If they use `if` not `while`: "You're using `if not self._heap: await wait()`. Why is `while` safer? What's a 'spurious wakeup'?"
- If sequence number missing: "What happens if two requests arrive with the same priority and payload is a dict? Can heapq compare dicts?"

**Key insight to deliver:**
> **Key insight:** Priority queue + asyncio = combine heapq (for O(log n) priority ordering) with asyncio.Condition (for blocking wait/notify). The sequence counter is not optional — it ensures FIFO ordering within the same priority tier and prevents heapq from trying to compare arbitrary payload objects. This is the pattern for any priority-based async producer-consumer system.

**Stretch question:**
> How would you add priority aging to this implementation? (Requests that have been waiting more than 30 seconds get their priority bumped up by 1 tier.)

**Tomorrow preview:**
> Tomorrow: streaming responses — SSE vs WebSocket for token-by-token delivery, and the backpressure problem.

---

### Day 18 (Thu) — Mini System Design: Streaming Responses + Backpressure

**Format:** Mini System Design | **Key skill:** SSE simplicity; backpressure = slow client problem

---

**OpenClaw opening:**
> **Day 18, Week 11 — Mini System Design: Streaming Responses**
>
> The last major component of the inference API: how do you send tokens to the client one at a time as they're generated?
>
> **Context:** LLM inference generates one token every ~50ms. For a 500-token response, that's 25 seconds of generation. You don't want to make the user wait 25 seconds for the full response — you want to stream each token as it's ready.
>
> Two options:
> - **Server-Sent Events (SSE):** HTTP connection stays open, server sends `data: <token>\n\n` lines as it generates them. Client just reads the stream. Simple, HTTP-native, one-directional.
> - **WebSocket:** Bidirectional. More complex. Allows client to send messages back (e.g., "cancel this request").
>
> **Design challenge:**
> 1. Which streaming protocol do you use for token-by-token delivery? Why?
> 2. What happens if the client is slow — it can't read tokens as fast as the GPU generates them? (This is the backpressure problem.)
> 3. What happens if the client disconnects mid-stream? How does the server detect this and stop generation?
>
> 10 minutes. Go.

**Target time:** 25 min

**OpenClaw probing questions (internal — ask one at a time):**
1. "You chose SSE — when would you choose WebSocket instead? Is there a feature of the LLM API that SSE can't support?"
2. "Your backpressure solution: you said 'buffer tokens server-side.' How big is that buffer? What happens when the buffer fills up?"
3. "Client disconnects mid-stream — you said detect via TCP connection close. How long does it take a server to notice a TCP connection was closed by the client?"
4. "If generation is stopped when the client disconnects, what happens to the KV cache for that request? Is it still using VRAM?"

**OpenClaw evaluation guide (internal):**
- **SSE vs WebSocket:** SSE is right for LLM inference because the communication is one-directional (server → client). WebSocket adds complexity for no gain unless you need client-initiated cancellation or multi-turn within a single connection. In practice, most LLM APIs use SSE (OpenAI API, Anthropic API).
- **Backpressure:** The server-side write buffer fills up when the client can't read fast enough. The OS TCP stack buffers some, but eventually backpressure propagates up to the application. In asyncio, writing to a slow connection will make `await writer.write(token)` block (or fill the write buffer). The correct behavior: if the client buffer is full for more than T seconds, abort the stream and free the GPU.
- **Disconnect detection:** TCP close is detected when the server tries to write to the socket and gets a broken pipe error (`BrokenPipeError` or `ConnectionResetError`). In asyncio: handle `asyncio.IncompleteReadError` or check `writer.is_closing()`. It's not instantaneous — TCP keepalives may take 30+ seconds without explicit probing.
- **KV cache cleanup on disconnect:** This is the critical production issue. If you don't detect the disconnect and free the KV cache, you're wasting VRAM on a request no one will receive. Production systems: the streaming coroutine must catch disconnect and trigger cleanup (remove from scheduler, free VRAM pages).

**Alternative to present:**
> "Some systems buffer the full response server-side and send it in one shot when complete. No streaming, no backpressure problem. What do you give up? What do you gain?"

**Key insight to deliver:**
> **Key insight:** Streaming adds value (fast first token, progressive display) but creates two new problems: backpressure (slow clients block server resources) and disconnect cleanup (disconnected clients waste GPU). The production solution: write to the HTTP stream non-blocking, detect slow/disconnected clients via write errors, and immediately trigger KV cache cleanup on disconnect. The cleanup path is the one that's almost always missing in naive implementations — and it's exactly what an Anthropic interviewer will probe.

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round — mini in-memory database with prefix scan. A classic interview problem that tests data structure selection under pressure.

---

### Day 19 (Fri) — Mock Pressure Round: Mini In-Memory Database

**Format:** Mock Pressure Round | **Key skill:** Prefix scan; sorted dict or trie under pressure

---

**OpenClaw opening:**
> **Day 19, Week 11 — Mock Pressure Round: Mini In-Memory Database**
>
> Timer starts. 30 minutes.
>
> **Problem:** Implement a thread-safe in-memory key-value store.
>
> Requirements:
> - `put(key: str, value: str) -> None` — set or update key
> - `get(key: str) -> str | None` — retrieve value, or None if not present
> - `delete(key: str) -> bool` — remove key, return True if it existed
> - `list_prefix(prefix: str) -> list[str]` — return all keys that start with `prefix`, in lexicographic order
> - Thread-safe: all operations must be correct under concurrent access
>
> Constraints:
> - Optimize for `list_prefix` performance — it will be called frequently
> - Up to 1 million keys
> - Keys are strings, up to 256 characters
>
> **Type your plan (data structure decision + why) first. I'll wait 5 minutes.**

**5-min planning check-in:**
> Plan?

**10-min check-in:**
> 10 minutes left. Where are you?

**Hard stop:**
> Time. Post what you have.

**OpenClaw debrief (internal evaluation):**

**Approach A — Sorted list + bisect (reasonable):**
```python
import bisect, threading

class KVStore:
    def __init__(self):
        self._keys = []  # sorted list of keys
        self._data = {}  # key → value
        self._lock = threading.RLock()

    def put(self, key, value):
        with self._lock:
            if key not in self._data:
                bisect.insort(self._keys, key)
            self._data[key] = value

    def get(self, key):
        with self._lock:
            return self._data.get(key)

    def delete(self, key):
        with self._lock:
            if key in self._data:
                idx = bisect.bisect_left(self._keys, key)
                self._keys.pop(idx)
                del self._data[key]
                return True
            return False

    def list_prefix(self, prefix):
        with self._lock:
            lo = bisect.bisect_left(self._keys, prefix)
            hi = bisect.bisect_left(self._keys, prefix[:-1] + chr(ord(prefix[-1]) + 1))
            return self._keys[lo:hi]
```

**Approach B — Plain dict (common but fails for prefix):**
- `list_prefix` requires O(n) scan — acceptable for small N, but violates the "optimize for list_prefix" constraint.

**Pass criteria:**
- Any approach where `list_prefix` is better than O(n) — sorted + bisect is enough
- Thread safety: single RLock covering all operations (RLock because `list_prefix` might call `get` internally in complex implementations)
- `delete` correctly removes from both data dict and the sorted key structure
- `list_prefix` returns lexicographic order (sorted list approach gives this for free)

**Common bugs:**
- Using regular `threading.Lock` then accidentally calling a method inside another locked method — deadlock risk (use RLock instead)
- `list_prefix` boundary calculation off-by-one (the upper bound prefix calculation is tricky)
- Not initializing the sorted key structure or keeping it in sync with the dict

**Verdict template:**
> ✓ / ✗ Core get/put/delete correct
> ✓ / ✗ Thread safety (RLock or Lock with no re-entrant calls)
> ✓ / ✗ list_prefix returns correct results in sorted order
> ✓ / ✗ list_prefix better than O(n) (uses bisect or sorted structure)
> ✓ / ✗ delete removes from both dict and key structure
>
> Interview verdict: [pass / conditional pass / fail]

**Coaching note:**
> The `list_prefix` boundary: for prefix "foo", you want all keys from "foo" to "fop" (exclusive). The trick: `chr(ord(prefix[-1]) + 1)` increments the last character. This is the standard sorted-scan prefix trick — memorize it.

**Tomorrow preview:**
> Tomorrow: Review & Reflect — we'll compare approaches (sorted list vs trie vs dict scan) and understand the complexity trade-offs.

---

### Day 20 (Sat) — Review & Reflect: In-Memory DB Data Structure Trade-offs

**Format:** Review & Reflect | **Key skill:** Data structure selection; trade-off articulation

---

**OpenClaw opening:**
> **Day 20, Week 11 — Review & Reflect: In-Memory DB**
>
> From memory: what data structure did you use? Why? What was your `list_prefix` approach?

**After recall:**
> Let's compare three approaches:
>
> **Option 1: Plain dict + O(n) prefix scan**
> - `put`/`get`/`delete`: O(1) average
> - `list_prefix`: O(n) — scan all keys
> - Simple. Bad at scale. Violates the "optimize for list_prefix" constraint.
>
> **Option 2: Sorted list + bisect**
> - `put`: O(log n) bisect + O(n) insert (list insert is O(n) due to shifting) — bad at high write volume
> - `get`/`delete`: O(log n)
> - `list_prefix`: O(log n + k) where k = results — excellent
> - Right for read-heavy workloads. Bad for write-heavy.
>
> **Option 3: Trie (prefix tree)**
> - `put`/`get`/`delete`: O(key_length)
> - `list_prefix`: O(prefix_length + k) — excellent
> - Better than sorted list for write-heavy + prefix-heavy workloads
> - More complex to implement correctly under time pressure

**Gap analysis:**
> 1. Did you correctly identify this as a "optimize for list_prefix" problem and choose accordingly?
> 2. Did your prefix boundary calculation work for edge cases? (prefix = "", prefix = "z", prefix = single char)
> 3. Was your lock coarse-grained (one RLock) or fine-grained (per-key)? For 1M keys with high concurrency, which would you want?

**Key insight to deliver:**
> **Key insight:** Data structure selection is about knowing *which operation to optimize for*. The spec said "optimize for list_prefix" — that's the signal to use sorted + bisect or a trie, not a plain dict. In interviews, always identify the expensive operation first and let it drive your data structure choice. Then articulate the trade-off: "I chose sorted list because list_prefix is frequent. The downside: O(n) insert on put. For a write-heavy workload, I'd use a trie instead."

**Next week preview:**
> Next week: the full inference stack synthesis. You'll design the entire LLM inference API end-to-end in one session — from HTTP to GPU to streaming response. This is the exam for everything you've learned in Phase 3.

---

### Day 21 (Sun) — SQL Challenge: Cohort Retention Analysis

**Format:** SQL Challenge | **Key skill:** Cohort analysis pattern; date windowing

---

**OpenClaw opening:**
> **Day 21, Week 11 — SQL Challenge: Cohort Retention**
>
> Tables:
>
> ```
> users(id, registered_at)
> requests(id, user_id, created_at, service)
> ```
>
> **Query:** Find all users who registered in the first week of January 2025 (Jan 1–7) AND made at least one request during the fourth week of January 2025 (Jan 22–28). Return their user IDs.
>
> Then extend: count how many such retained users there are per day-of-registration (i.e., of the users who registered on Jan 1, how many were retained? Jan 2? etc.).
>
> Write both queries. 12 minutes.

**Target time:** 20 min

**OpenClaw evaluation:**
- **Query 1:**
  ```sql
  SELECT DISTINCT u.id
  FROM users u
  JOIN requests r ON r.user_id = u.id
  WHERE u.registered_at >= '2025-01-01'
    AND u.registered_at < '2025-01-08'
    AND r.created_at >= '2025-01-22'
    AND r.created_at < '2025-01-29';
  ```
- **Query 2:**
  ```sql
  SELECT
      DATE(u.registered_at) AS registration_date,
      COUNT(DISTINCT u.id) AS retained_users
  FROM users u
  JOIN requests r ON r.user_id = u.id
  WHERE u.registered_at >= '2025-01-01'
    AND u.registered_at < '2025-01-08'
    AND r.created_at >= '2025-01-22'
    AND r.created_at < '2025-01-29'
  GROUP BY DATE(u.registered_at)
  ORDER BY registration_date;
  ```
- **Common mistakes:** Not using `DISTINCT` in `COUNT` (counting requests, not users), using `BETWEEN` with timestamps (inclusive upper bound issue), forgetting the date-truncation for grouping.

**Key insight to deliver:**
> **Key insight:** Cohort retention is a fundamental analytics pattern: "of users who did X in period 1, how many also did Y in period 2?" The SQL structure is always: join the cohort table (users registered in window) with the activity table (requests in retention window), then count distinct users. Always use `DISTINCT` in your count — one user who made 10 requests in week 4 should count once, not 10.

---

## WEEK 12: Full Inference Stack Synthesis + Rate Limiting + Caching Strategies

**This week's arc:** From components to complete system — this week you synthesize everything from Weeks 9–11 into a full LLM inference API design. Then: caching strategy taxonomy, async rate limiting, and the Phase 3 exit assessment.

---

### Day 22 (Mon) — Concept Deep Dive: Request Queuing with Priority + Starvation Prevention

**Format:** Concept Deep Dive | **Key skill:** Starvation vs fairness; priority aging

---

**OpenClaw opening:**
> **Day 22, Week 12 — Concept Deep Dive: Priority Queuing + Starvation**
>
> You've designed a priority queue for the inference API. Today: the failure mode of priority queuing and how to fix it.
>
> **The starvation problem:**
>
> Naive priority queuing: premium requests always beat standard requests. In theory, this guarantees premium SLAs. In practice, during peak load, standard users can wait indefinitely — if there's a constant stream of premium requests, the standard queue never drains.
>
> **Three approaches to starvation prevention:**
>
> **1. Priority aging (most common):** Every N seconds, bump the priority of waiting requests by one tier. A standard request waiting 60 seconds becomes effectively a premium request. Ensures eventual service for all requests. The aging rate is tunable — aggressive aging = more fairness, less SLA guarantee for premium.
>
> **2. Weighted fair queuing:** Two queues (premium + standard). GPU workers pull from premium queue first, but for every 4 premium requests, pull 1 standard request. Even under peak premium load, standard queue drains at 20% of capacity. Predictable minimum throughput for each tier.
>
> **3. Admission control (alternative):** Don't queue requests that can't be served within SLA. If the queue is too long, return 503 immediately rather than queuing indefinitely. No starvation — but users get errors instead of slow service. Different trade-off.
>
> **The SLA tiers in practice:**
> Premium users have a TTFT SLA of <1s. If a premium request arrives and the queue will take >500ms to clear, the SLA is already at risk. The scheduler needs to reserve capacity for premium requests — never let the premium queue grow beyond ~500ms of estimated wait time.
>
> Questions?

**Application challenge (10 min):**
> You're designing priority aging for the inference API:
> - Standard requests age to premium priority after 45 seconds of waiting
> - Your GPU fleet processes 200K tokens/minute
> - A large burst of 500 premium requests arrives (average 1K tokens each), then stops
>
> 1. How long does the premium burst take to clear?
> 2. During the burst, how long do standard users wait?
> 3. What happens to standard requests that arrived during the burst and haven't aged yet when the burst clears?

**OpenClaw evaluation:**
- **Q1:** 500 requests × 1K tokens = 500K tokens. At 200K tokens/min = 2.5 minutes to clear the premium burst.
- **Q2:** Standard users wait at least 2.5 minutes (the full burst duration). If they arrived at the start of the burst, they're 2.5 minutes into their 45-second aging window — they'll have aged to premium by the time the burst clears (2.5 min > 45 sec). So they'll jump the queue before later premium arrivals.
- **Q3:** Any standard request that waited more than 45 seconds has aged to premium priority and will be served next (before the next premium arrival). This is priority aging working correctly.

**Key insight to deliver:**
> **Key insight:** Priority aging is the minimum necessary addition to any tiered priority queue. Without it, starvation is guaranteed under load. With it, you get a tunable fairness dial: aging rate determines how quickly standard users can "catch up" to premium priority. The right aging rate depends on your SLA difference — if premium SLA is 10x tighter than standard, aging should be slow (standard requests shouldn't easily become "premium"). If SLAs are similar, aging can be fast.

**Tomorrow preview:**
> Tomorrow: the synthesis session. You'll design the complete inference API from HTTP request to streamed response. Everything from Weeks 9–11 comes together.

---

### Day 23 (Tue) — Mini System Design: Full LLM Inference API — End-to-End

**Format:** Mini System Design | **Key skill:** End-to-end system thinking; every hop matters

---

**OpenClaw opening:**
> **Day 23, Week 12 — Mini System Design: Full Inference API**
>
> This is the Phase 3 synthesis session. Design the complete LLM inference API — from HTTP request arriving to streaming tokens back to the client.
>
> **System constraints:**
> - 100K requests per minute at peak
> - Two tiers: premium (<1s TTFT) and standard (<5s TTFT)
> - Variable request lengths (100 to 10K output tokens)
> - Fleet of GPU servers (treat as a pool of workers)
> - Streaming responses (token-by-token SSE)
>
> **Describe the full request lifecycle:**
> 1. HTTP request arrives → what happens?
> 2. How does it reach the GPU?
> 3. How does the GPU generate tokens?
> 4. How do tokens reach the client?
> 5. What happens when VRAM fills up?
> 6. How does the fleet scale?
>
> You have 10 minutes. Go.

**Target time:** 30 min (this is the capstone design for Phase 3)

**OpenClaw probing questions (internal — go deep on each):**
1. "Between the HTTP layer and the GPU — what's in there? What does the scheduler actually do step by step?"
2. "You mentioned KV cache — where is it? Who allocates VRAM pages? What happens when a request needs its 33rd page and VRAM is full?"
3. "Your autoscaling signal — what metric triggers a scale-up event? How quickly can a new GPU server join the fleet?"
4. "A premium user's connection drops mid-stream. Walk me through exactly what happens in your system — every component that's affected."
5. "What's your weakest component? What would you redesign if you had more time?"

**OpenClaw evaluation guide (internal):**

**Full system components that should be mentioned:**
1. **API Gateway / Load Balancer:** Receives HTTP, authenticates, determines tier from API key, rate-limits per user, routes to scheduler
2. **Request Scheduler:** Accepts request, adds to priority queue (with priority aging), decides which GPU batch to add it to (using continuous batching)
3. **VRAM / KV Cache Manager:** PagedAttention-style page allocator. Allocates pages on-demand as request generates tokens.
4. **GPU Workers:** Execute forward passes, feed batches to GPU. Write generated tokens to per-request token buffers.
5. **Streaming Layer:** SSE endpoint per request. Reads from token buffer, writes to HTTP response stream. Detects client disconnect, triggers cleanup.
6. **Autoscaling Controller:** Reads weighted queue depth (sum of token counts). Scale up when > threshold. Scale down with cooldown.

**Depth check questions:**
- KV cache eviction under memory pressure: preempt lower-tier requests or reject new ones?
- Prefix caching: are shared system prompts cached across requests? What's the hit rate in this scenario?
- Disconnect handling: when client disconnects, who tells the GPU to stop generating?

**Key insight to deliver:**
> **Key insight:** A complete LLM inference API is 5–6 distinct components, each with non-trivial design. The interview is checking whether you can hold the full picture in your head: HTTP layer (routing + auth), scheduling layer (priority + batching), memory management layer (KV cache + paging), compute layer (GPU workers + batching), streaming layer (SSE + backpressure), and scaling layer (controller + signal). Missing any one of these is a gap. The Anthropic interview goes deep on 2–3 of them — you need to be able to go deep on any.

**Tomorrow preview:**
> Tomorrow: caching strategies — write-through, write-back, write-around, TTL, invalidation. These appear in system design interviews broadly, not just inference.

---

### Day 24 (Wed) — Mini System Design: Caching Strategies Taxonomy

**Format:** Mini System Design | **Key skill:** Cache consistency trade-offs

---

**OpenClaw opening:**
> **Day 24, Week 12 — Mini System Design: Caching Strategies**
>
> Caching is everywhere. Today we build the mental model for the full taxonomy of caching strategies — then apply it to a specific scenario.
>
> **The three write policies:**
>
> **Write-through:** Write to cache AND database simultaneously. Cache is always consistent with DB. Reads are fast. Writes are as slow as the database (no write speedup). Use when: read-heavy, consistency matters more than write performance.
>
> **Write-back (write-behind):** Write to cache only, mark as "dirty." Flush to database asynchronously (on eviction, on schedule, or on explicit sync). Writes are fast. Reads are fast. Risk: cache failure = data loss for dirty entries. Use when: write-heavy, data loss on crash is tolerable, or you can guarantee flush-before-evict.
>
> **Write-around:** Bypass cache on write, write directly to database. On next read, fetch from database and populate cache. Use when: write-once-read-rarely patterns — no point polluting cache with data that won't be read again.
>
> **TTL (Time To Live):** All cache entries expire after N seconds. After expiry, next read is a cache miss → repopulate from DB. Simple consistency model. Use when: data changes on a predictable schedule and staleness is acceptable for TTL window.
>
> **Invalidation:** When data changes in DB, explicitly remove (or update) the cache entry. Keeps cache consistent. Requires coordination: the writer must know to invalidate the cache. Use when: cache and DB must agree and you can afford the coordination cost.
>
> **Design challenge:** You're designing the caching layer for these three scenarios. Pick the right strategy for each and defend it:
>
> 1. User profile data (name, email, tier) — reads on every API request, updates rarely (once a week average)
> 2. Realtime request count per user (for rate limiting) — updates on every request, must be accurate (can't allow 2x rate limit)
> 3. ML model weights (hundreds of GB, loaded once per GPU server startup)
>
> 10 minutes. Go.

**Target time:** 25 min

**OpenClaw evaluation guide (internal):**
- **Scenario 1 (user profile):** Write-through + TTL. Reads are frequent → must be in cache. Updates are rare → write-through is fine (tolerable write cost). TTL of 1 hour prevents stale tier info after an upgrade. Explicit invalidation on profile update is also correct.
- **Scenario 2 (rate limit counter):** No cache — this must be in a fast distributed store (Redis), not a cache-aside of a database. If you cache: write-through with immediate invalidation. Any staleness allows rate limit bypass. The right answer is recognizing that "realtime accuracy" constraints often mean "don't cache this" or "cache IS the source of truth."
- **Scenario 3 (model weights):** Write-around (load from object storage or model registry directly into GPU VRAM). No need for a cache layer between storage and GPU — you load directly. The "cache" in this case is the VRAM itself. TTL doesn't apply; you never evict model weights mid-serving.

**Key insight to deliver:**
> **Key insight:** Caching strategy selection is about answering three questions: (1) How often does the underlying data change? (2) How much does staleness hurt? (3) What's the read/write ratio? Write-through is the safe default. Write-back is for write-heavy. Write-around is for write-once data. TTL is for "acceptable staleness" scenarios. Explicit invalidation is for "must be consistent" with control over the invalidation path.

**Tomorrow preview:**
> Tomorrow: code kata — async token bucket rate limiter. Implement the rate limiter for the inference API's user-level rate limiting layer.

---

### Day 25 (Thu) — Code Kata: Async Token Bucket Rate Limiter

**Format:** Code Kata | **Key skill:** Async-safe state (no thread safety needed in single event loop)

---

**OpenClaw opening:**
> **Day 25, Week 12 — Code Kata: Async Token Bucket Rate Limiter**
>
> The token bucket is one of the three classic rate limiting algorithms (along with sliding window and leaky bucket). Today you implement it in pure asyncio — no threading, because the event loop handles concurrency.
>
> **Token bucket algorithm:**
> - Each user has a "bucket" that holds up to `capacity` tokens
> - Tokens refill at `rate` tokens per second (continuously, not in discrete ticks)
> - Each request consumes 1 token (or N tokens for expensive requests)
> - If the bucket is empty, the request is rejected (returns False)
>
> Kata: implement `AsyncTokenBucketLimiter`:
>
> ```python
> import asyncio
> import time
>
> class AsyncTokenBucketLimiter:
>     def __init__(self, rate: float, capacity: float):
>         """
>         rate: tokens added per second (e.g., 10.0 = 10 req/s sustained)
>         capacity: max tokens in bucket (e.g., 20.0 = burst of 20)
>         """
>         self._rate = rate
>         self._capacity = capacity
>         self._buckets: dict[str, tuple[float, float]] = {}
>         # key → (current_tokens, last_refill_time)
>         # No lock needed — single asyncio event loop
>
>     async def allow(self, user_id: str, cost: float = 1.0) -> bool:
>         """Return True if request is allowed, False if rate limited."""
>         pass
>
>     def _refill(self, tokens: float, last_time: float) -> tuple[float, float]:
>         """Compute new token count after time-based refill."""
>         pass
> ```
>
> Key point: no `threading.Lock` — asyncio is single-threaded. Two calls to `allow` for the same user CAN'T race because the event loop is cooperative. A lock would be incorrect (and cause a deadlock if both tasks try to acquire).
>
> **Two sentences on your approach, then code.**

**Target time:** 25 min

**10-min check-in:**
> Got `_refill` working? Show me the calculation.

**OpenClaw evaluation guide (internal):**
- **Strong `_refill`:**
  ```python
  def _refill(self, tokens: float, last_time: float) -> tuple[float, float]:
      now = time.monotonic()
      elapsed = now - last_time
      new_tokens = min(self._capacity, tokens + elapsed * self._rate)
      return new_tokens, now
  ```
- **Strong `allow`:**
  ```python
  async def allow(self, user_id: str, cost: float = 1.0) -> bool:
      if user_id not in self._buckets:
          self._buckets[user_id] = (self._capacity, time.monotonic())
      tokens, last_time = self._buckets[user_id]
      tokens, last_time = self._refill(tokens, last_time)
      if tokens >= cost:
          self._buckets[user_id] = (tokens - cost, last_time)
          return True
      else:
          self._buckets[user_id] = (tokens, last_time)  # update refill time even on reject
          return False
  ```
- **Common bug 1:** Using `time.time()` instead of `time.monotonic()` — monotonic clock is immune to system clock adjustments (NTP, DST). Always use `time.monotonic()` for elapsed time calculations.
- **Common bug 2:** Adding `threading.Lock` — unnecessary and wrong in pure asyncio. The event loop guarantees that between two `await` points, no other coroutine runs. Since `allow` has no `await`, it's fully atomic.
- **Common bug 3:** Not capping `new_tokens` at `capacity` — tokens accumulate infinitely without the `min()` cap.
- **Common bug 4:** Not updating the bucket on rejection — if you don't store the refilled token count on rejection, the next call won't benefit from the time that passed.

**OpenClaw feedback approach:**
- If they add a lock: "Why did you add a Lock? Who's competing with this code? Can two coroutines run simultaneously in a single event loop thread?"
- If they use `time.time()`: "What happens to your rate limiter when the system clock is adjusted backward by NTP? Does a user suddenly get infinite tokens?"
- If tokens don't cap: "What happens after a user is idle for an hour? How many tokens have they accumulated?"

**Key insight to deliver:**
> **Key insight:** Asyncio code is single-threaded — between any two `await` points, you have exclusive access to shared state. No locks needed. This is the fundamental advantage of cooperative multitasking: you opt in to yielding control (at `await`), so non-awaited code is always atomic. The token bucket implementation has no `await`, so it's automatically thread-safe in the asyncio sense. The moment you start mixing `threading` into asyncio code without care, you break this guarantee.

**Stretch question:**
> How would you add memory cleanup — remove buckets for users who haven't made a request in 24 hours?

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round — your choice of LRU from scratch OR async crawler. Pick your weaker one. This is the Phase 3 final assessment.

---

### Day 26 (Fri) — Mock Pressure Round: Self-Selected Phase 3 Exit Assessment

**Format:** Mock Pressure Round | **Key skill:** Self-assessment; targeted practice

---

**OpenClaw opening:**
> **Day 26, Week 12 — Mock Pressure Round: Phase 3 Exit Assessment**
>
> Timer starts. 30 minutes.
>
> First: which problem do you want — LRU Cache from scratch OR async web crawler with full features (BFS + dedup + asyncio.Semaphore + timeout + redirect loop detection)?
>
> Pick your **weaker** one — the one you're less confident about. This is the self-assessment.

*(If they choose LRU — use the Week 9 LRU mock problem. If they choose crawler — use the below:)*

**Crawler variant (if chosen):**
> **Problem:** Implement an async web crawler with the following features:
> - `crawl(start_url, max_depth, max_concurrent) -> set[str]` — returns all discovered URLs
> - BFS traversal, visited-on-enqueue dedup (normalize URLs before comparing)
> - `asyncio.Semaphore(max_concurrent)` rate limiting
> - Per-URL timeout of 5 seconds (`asyncio.wait_for`)
> - Redirect loop detection: if URL redirects to an already-visited URL, skip it
>
> `fetch_url(url: str) -> tuple[list[str], str | None]` is provided — returns `(links_found, redirect_to)`. `redirect_to` is None if no redirect.
>
> **Type your plan first.**

**OpenClaw debrief:**
*(Use the relevant debrief from Week 9 Day 5 for LRU, or below for crawler)*

**Crawler debrief:**
> ✓ / ✗ BFS with deque, visited-on-enqueue
> ✓ / ✗ URL normalization before dedup
> ✓ / ✗ asyncio.Semaphore usage correct
> ✓ / ✗ asyncio.wait_for with TimeoutError handling
> ✓ / ✗ Redirect loop detection (visited check on redirect destination)
> ✓ / ✗ Depth control
>
> Interview verdict: [pass / conditional pass / fail]

**Coaching note:**
> URL normalization matters more than it seems: `http://example.com/foo`, `http://example.com/foo/`, and `HTTP://Example.com/foo` are the same URL. Naive string comparison misses this and causes duplicate fetches. Always normalize: lowercase scheme + host, strip trailing slash, sort query params.

**Tomorrow preview:**
> Tomorrow: Review & Reflect + Phase 3 overall reflection. What can you explain without notes? What still needs a prompt?

---

### Day 27 (Sat) — Review & Reflect: Mock Debrief + Phase 3 Meta-Assessment

**Format:** Review & Reflect | **Key skill:** Meta-assessment before Phase 4

---

**OpenClaw opening:**
> **Day 27, Week 12 — Review & Reflect: Phase 3 Wrap-Up**
>
> Two parts today. First: debrief yesterday's mock. Then: Phase 3 self-assessment.
>
> **Part 1 — Mock debrief:**
> From memory: describe your solution. What passed? What didn't?

**After recall — Part 2: Phase 3 Self-Assessment:**
> Now answer these questions honestly. For each: can you explain it WITHOUT looking at notes?
>
> 1. What is continuous batching, and how does it differ from static batching? (Answer in 3 sentences.)
> 2. What's the right autoscaling signal for an LLM inference API? Why not raw GPU utilization?
> 3. What is PagedAttention and why does it improve throughput?
> 4. What does prefix caching cache, and what's the constraint on when it helps?
> 5. What's the starvation problem in priority queuing, and what are two ways to prevent it?
>
> Answer all five from memory. Go.

**OpenClaw evaluation (internal):**
- **Strong answers:** Should be able to answer all 5 without notes after Weeks 9–11.
- **If they struggle on any:** Note which concepts need more drilling. OpenClaw response: "You got [X, Y] strong. [Z] needs more reps — we'll revisit it in Phase 4's warm-up before the full mock week."
- **Verdict:** Can they explain all 5 unprompted? → Phase 3 exit criteria met. Need prompting on 2+? → One more targeted week before Phase 4.

**Phase 3 → Phase 4 Gate Check:**
> *OpenClaw internally evaluates: did the user need more than one clarifying prompt on any of the 5 questions above? Did the Phase 3 exit mock (Fri) result in "conditional pass" or better?*
>
> *If YES to both: move to Phase 4.*
> *If NO: one more targeted week — revisit the weakest concepts with extra Mini System Design sessions. Repeat the exit assessment.*

**Key insight to deliver:**
> **Key insight:** The System Design round at Anthropic is testing whether you have a genuine mental model, not a memorized list. If you can answer "why" (why continuous batching helps throughput, why queue depth beats GPU util), you can handle any follow-up question the interviewer throws. If you're reciting bullet points without the "why," the first probing question will expose it. The goal of Phase 3 is the "why" — not the terminology.

**Tomorrow preview:**
> Tomorrow: Debug & Read — a KV cache eviction bug. Last session of Phase 3, then Phase 4 begins.

---

### Day 28 (Sun) — Debug & Read: KV Cache Eviction Priority Bug

**Format:** Debug & Read | **Key skill:** Priority queue eviction logic; comparison operator bugs

---

**OpenClaw opening:**
> **Day 28, Week 12 — Debug & Read: KV Cache Eviction Bug**
>
> Read this KV cache eviction code. Tell me what it does, then list everything wrong with it:
>
> ```python
> import heapq
> import time
>
> class KVCacheManager:
>     def __init__(self, max_vram_gb: float):
>         self.max_vram = max_vram_gb * 1024  # MB
>         self.used_vram = 0
>         self.requests = {}  # request_id → (allocated_mb, tier, started_at)
>         # Priority queue for eviction: (priority_score, request_id)
>         # Lower score = evict first
>         self._eviction_heap = []
>
>     def allocate(self, request_id: str, size_mb: float, tier: str) -> bool:
>         if self.used_vram + size_mb <= self.max_vram:
>             self.requests[request_id] = (size_mb, tier, time.time())
>             self.used_vram += size_mb
>             # Priority: premium=2, standard=1 (evict standard first)
>             priority = 2 if tier == 'premium' else 1
>             heapq.heappush(self._eviction_heap, (priority, request_id))
>             return True
>
>         # Need to evict
>         while self.used_vram + size_mb > self.max_vram:
>             if not self._eviction_heap:
>                 return False
>             _, evict_id = heapq.heappop(self._eviction_heap)
>             if evict_id in self.requests:
>                 evicted_size, _, _ = self.requests.pop(evict_id)
>                 self.used_vram -= evicted_size
>
>         self.requests[request_id] = (size_mb, tier, time.time())
>         self.used_vram += size_mb
>         priority = 2 if tier == 'premium' else 1
>         heapq.heappush(self._eviction_heap, (priority, request_id))
>         return True
>
>     def free(self, request_id: str):
>         if request_id in self.requests:
>             size_mb, _, _ = self.requests.pop(request_id)
>             self.used_vram -= size_mb
>             # Note: eviction_heap entry is left behind (lazy deletion)
> ```

**Read & explain (8 min):**
> What does this code do? Walk me through allocate().

**Bug finding (8 min):**
> Now: what's wrong? List every bug you find.

**OpenClaw hint progression:**
1. First hint: "Look at the priority score assignment. Which score gets evicted first by heapq? Which score does premium get?"
2. Second hint: "heapq is a MIN-heap. It pops the LOWEST value first. Which tier did you intend to evict first?"

**Bugs to find:**
1. **Critical bug:** Priority is backwards. `heapq` is a min-heap — it pops the **lowest** value first. Premium gets priority=2 (higher number), standard gets priority=1 (lower number). So **premium requests are evicted first** — the opposite of the intent. Fix: `priority = 1 if tier == 'premium' else 2` (lower number = evict later). Or: use negative priorities (premium = -2, standard = -1, evict the one closest to zero).

2. **Bug 2:** Lazy deletion is used for `free()` but no lazy deletion check in the eviction loop. When evicting, the code checks `if evict_id in self.requests` — this handles stale entries from `free()`. But: if a request was freed AND re-allocated under the same ID (unlikely but possible), the stale heap entry would evict the new allocation. Not catastrophic but worth noting.

3. **Bug 3:** After eviction, the new request is added to the heap AFTER the while loop. If `used_vram + size_mb > max_vram` is never true (enough space already), the new request is added correctly. But the new request isn't added inside the while loop's body — this is actually correct. Just worth tracing.

4. **Bug 4 (subtle):** `used_vram` can go slightly negative if concurrent calls to `free()` overlap (though this code isn't thread-safe at all — no lock). Not async/thread-safe.

**Key insight to deliver:**
> **Key insight:** "Evict first" in a min-heap means "lowest value first." When you assign numeric priorities, lower number = evicted sooner. This is backwards from intuition ("premium = high priority" makes people assign premium a high number, but high number = evicted later in a min-heap). Always trace through: which operation does the heap expose first? For eviction, you WANT the heap to expose the least-important request first — so least-important gets the lowest priority number. This off-by-one in priority semantics is a production bug that would cause premium users to be evicted preferentially.

**Phase 3 closing message:**
> **Phase 3 complete.**
>
> You've built the LLM inference mental model: autoregressive generation → KV cache → continuous batching → prefix caching → PagedAttention → autoscaling signals → request queuing → streaming. You've designed the full stack and identified the subtle failure modes.
>
> Phase 4 begins tomorrow. Integration: full problems under time pressure, behavioral stories, and the actual interview scenarios end-to-end. The training wheels are coming off.

---

## Phase 3 Exit Criteria Reference

Before OpenClaw advances to Phase 4, the following must be true:

| Criterion | Target |
|-----------|--------|
| Can explain continuous batching vs iteration batching unprompted | Yes |
| Can design the queuing layer (data structure, priority key, starvation prevention) in 20 minutes | Yes |
| Knows the right autoscaling signal and can defend it vs raw GPU util | Yes |
| Can name all 4 vLLM-specific concepts: continuous batching, prefix caching, PagedAttention, KV cache | Yes |
| Can discuss KV cache eviction trade-offs (LRU vs shortest-remaining, preemption vs abort) | Yes |
| Phase 3 exit mock (Day 26): conditional pass or better | Yes |
| Phase 3 self-assessment (Day 27): answers 4/5 questions unprompted | Yes |

If the user doesn't meet all criteria, OpenClaw schedules a targeted extension week covering the specific gaps before advancing to Phase 4.

---

## Phase 3 Problem Bank Summary

| Day | Format | Problem | Key Skill |
|-----|--------|---------|-----------|
| 1 | CD | Autoregressive generation + KV cache mental model | Why VRAM is the limit |
| 2 | MS | KV cache manager design | Eviction = lost context |
| 3 | CK | Async generator for token streaming | `yield` in `async def` |
| 4 | MS | KV cache eviction policies | LRU vs shortest-remaining vs preempt |
| 5 | MPR | LRU cache from scratch (OA benchmark) | DLL + dict + thread-safe |
| 6 | RR | LRU mock debrief | Production quality; node stores key |
| 7 | SQL | Median session length (PERCENTILE_DISC) | DISC vs CONT difference |
| 8 | CD | Continuous batching | Join batch mid-generation |
| 9 | MS | Dynamic batching scheduler | Flush trigger design |
| 10 | CD | Prefix caching | Shared KV for shared prefixes |
| 11 | MS | PagedAttention / VRAM paging | Fragmentation → paging solution |
| 12 | MPR | Async crawler with timeout | asyncio.wait_for pattern |
| 13 | RR | Crawler debrief — timeout cleanup | CancelledError + finally |
| 14 | DR | Fixed-window rate limiter burst bug | Sliding window vs fixed window |
| 15 | CD | Autoscaling signals | Queue depth × token count |
| 16 | MS | Inference request queue design | Priority + starvation prevention |
| 17 | CK | asyncio.Queue with priority | Condition + heapq pattern |
| 18 | MS | Streaming responses + backpressure | SSE; slow client problem |
| 19 | MPR | Mini in-memory database with prefix scan | bisect + sorted key list |
| 20 | RR | KV store data structure trade-offs | Sorted list vs trie vs dict |
| 21 | SQL | Cohort retention analysis | Self-join or JOIN + date window |
| 22 | CD | Priority queuing + starvation | Priority aging mechanisms |
| 23 | MS | Full inference API end-to-end synthesis | All components + every hop |
| 24 | MS | Caching strategies taxonomy | Write-through vs back vs around |
| 25 | CK | Async token bucket rate limiter | Async-safe state; monotonic clock |
| 26 | MPR | Self-selected: LRU or crawler (weaker one) | Phase 3 exit benchmark |
| 27 | RR | Mock debrief + Phase 3 self-assessment | 5-question oral gate |
| 28 | DR | KV cache eviction priority bug (min-heap semantics) | Priority inversion bug |
