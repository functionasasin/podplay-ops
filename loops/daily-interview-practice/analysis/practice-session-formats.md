# Practice Session Formats — Daily Interview Practice

## Design Principles

Every format is built for Telegram delivery. The user types answers on their phone or laptop in a chat window — no IDE, no whiteboard, no running code required for most sessions. The goal is **thinking + communication**, not perfect syntax. OpenClaw reads the intent, not the compiler.

Formats are designed to hit two axes:
1. **Skill being built** (algorithm, concurrency, systems, communication)
2. **Mode of practice** (recall, apply, communicate, perform under pressure)

A good week mixes all four modes. A bad week is all recall, no performance.

---

## Format 1: Code Kata

**Purpose:** Build muscle memory for specific implementation patterns. The goal is to code the same thing multiple times until it's effortless — like playing scales.

**When to use:** Early phases (Foundation, Pattern Building). Daily in Weeks 1-8. Used for high-repetition skills: doubly linked list, BFS, asyncio semaphore, LRU cache.

**Duration:** 20–25 minutes total

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Warm-up context | 2 min | OpenClaw states the pattern, 1-sentence reminder of why it matters |
| The kata | 15 min | User types solution in chat — approach first, then code |
| OpenClaw review | 5 min | Feedback on correctness, idioms, edge cases |
| Key insight | 2 min | OpenClaw names the ONE thing to remember from this kata |
| Prep for next day | 1 min | "Tomorrow's kata will go one level harder" |

### How OpenClaw Delivers It

1. **Opening prompt** — Sets the kata with a concrete implementation request:
   > "Today's kata: implement a doubly linked list node class with `insert_after(node, value)` and `remove(node)`. No sentinel nodes. Walk me through your approach in 2 sentences, then write the code."

2. **Timing** — After 10 minutes: "Still going? Type what you have so far — we can work from there."

3. **Evaluation loop** — OpenClaw reads the answer and:
   - Confirms what's correct (1-2 lines)
   - Points to one specific bug or missing case (Socratic, not lecturing)
   - If answer is strong: adds a stretch question ("Now: what changes if we add sentinel head/tail nodes?")

4. **Key insight delivery** — Always ends with one memorable takeaway:
   > "Key insight: always update the *incoming* pointer before the *outgoing* one, or you'll lose your reference. That's the pointer manipulation order that trips people up."

### Sample Kata Library (by phase)

**Phase 1 katas (foundations):**
- Doubly linked list: Node class + insert/remove
- LRU Cache with OrderedDict (correctly handles update + move_to_end)
- LRU Cache from scratch (doubly linked list + dict)
- Thread-safe counter with Lock
- Thread-safe queue with Lock + condition variable
- BFS on an adjacency list graph
- DFS with cycle detection
- Topological sort (Kahn's)
- asyncio: fetch N URLs with semaphore rate limiting
- asyncio: timeout with asyncio.wait_for

**Phase 2 katas (patterns):**
- Two-pointer: find pair summing to target in sorted array
- Sliding window: max sum subarray of size K
- Binary search on answer space: smallest number that satisfies constraint
- DFS backtracking: generate all combinations
- Prefix sums: range sum queries
- Producer-consumer with asyncio.Queue
- Priority queue (heapq) task scheduler
- State machine for order lifecycle

---

## Format 2: Spec Decomposition

**Purpose:** Build the habit of breaking messy, ambiguous specs into clean implementation steps *before* touching code. This is what every interview round requires in the first 5 minutes.

**When to use:** Phases 1-4. Once per week minimum. Especially important for building the "plan first, code second" habit.

**Duration:** 20–25 minutes total

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Spec delivery | 1 min | OpenClaw delivers a deliberately vague or complex spec |
| Clarifying questions | 3 min | User asks clarifying questions (OpenClaw answers or says "assume what makes sense") |
| Decomposition | 12 min | User writes: sub-problems, edge cases, assumptions, ordered steps |
| OpenClaw review | 7 min | Discussion of what was missed, what assumptions matter, what order is right |
| Key insight | 2 min | OpenClaw highlights the decomposition move that matters most |

### How OpenClaw Delivers It

1. **Opening prompt** — Delivers a spec with intentional ambiguity. The messier, the better.
   > "Spec: build a function that takes a list of log lines and returns a summary of errors per service, grouped by hour. Log format is not guaranteed to be consistent. What questions do you have? Then give me your 5-step implementation plan."

2. **Clarifying phase** — OpenClaw plays the product manager. Answers specific questions but not meta questions ("what format should I return?" → "what would make sense for a caller consuming this?"). Forces the user to make decisions.

3. **Plan review** — OpenClaw doesn't grade the plan, it *extends* it:
   - "Good — you got the parsing step. What if the timestamp is missing from a log line?"
   - "You skipped error normalization — what if some services log 'ERROR' and some log 'error'?"
   - "Your step 3 does two things — could you split it?"

4. **Key insight** — Names the meta-skill being practiced:
   > "Key insight: the questions you ask before coding tell the interviewer more than the code itself. 'What should I do if the timestamp is malformed?' is a better signal than getting the answer right."

### Sample Spec Library

**Phase 1 specs (straightforward ambiguity):**
- URL domain extractor (from DIAG-11 — used as practice, not diagnostic)
- Log line parser that handles inconsistent formats
- Task queue with priority and retry logic (spec leaves retry policy unspecified)
- User session tracker: who's active right now? (Define "active" — that's the question)

**Phase 2 specs (higher complexity):**
- Leaderboard system: top N users by score, update in real time
- Rate limiter (spec says "fair" — you define fair)
- Cache with TTL eviction and LRU eviction — which wins?
- Diff two versions of a config file (what counts as a meaningful change?)

**Phase 4 specs (full interview complexity):**
- Job scheduler with dependencies (basically the OA Task Management System, presented fresh)
- Web crawler (just the spec, no hints — mirrors Round 1)
- Metrics aggregation system for a distributed service

---

## Format 3: Mini System Design

**Purpose:** Build system design intuition through small, focused 20-minute design discussions. Each session covers ONE component, not a full system. Depth over breadth.

**When to use:** Phases 2-5. Two to three times per week in Phase 3. Earlier phases use simpler components (cache, queue); later phases tackle inference-serving-level complexity.

**Duration:** 25–30 minutes total

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Problem statement | 1 min | OpenClaw frames the component and constraints |
| Initial design | 10 min | User describes their design in prose (no diagrams — text only via Telegram) |
| OpenClaw probing | 10 min | Socratic follow-up questions on weak spots |
| Alternative approach | 5 min | OpenClaw proposes an alternative — user compares |
| Key insight | 4 min | The trade-off that mattered most in this design |

### How OpenClaw Delivers It

1. **Problem statement** — Specific, not open-ended. Constrains the scope to 20 minutes.
   > "Design the queuing layer for an LLM inference API. Assume GPU servers exist. Your job: how do incoming requests get from the API endpoint to a GPU worker? What data structure? How do you handle priority? What happens if the queue is full? You have 10 minutes — go."

2. **Probing questions** — OpenClaw asks one question at a time, not a list. Waits for the answer before asking the next.
   > "You said priority queue — what's the priority key? Just user tier, or does request length factor in?"
   > (After answer) "Interesting. So a 1-token request from a free user waits behind a 10K-token request from premium — is that actually fair to your free-tier SLA?"

3. **Alternative proposal** — OpenClaw presents the "other" design:
   > "Here's an alternative: instead of a single priority queue, use separate queues per tier. Premium queue gets 80% of GPU cycles, standard gets 20%. What does your design handle better? What does this handle better?"

4. **Key insight** — Names the design tension that mattered:
   > "Key insight: the queue is where you implement your business logic (who waits, in what order). Token-weighted priority isn't just fair — it's the right signal because a 1K-token request will take 10x as long as a 100-token one on the same GPU."

### Sample Component Library

**Phase 2 components (familiar systems):**
- In-memory rate limiter (token bucket vs sliding window)
- LRU cache as a component (not code — design trade-offs)
- Message queue for task dispatch (sync vs async, ack/nack, dead letter)
- Simple load balancer (round-robin vs least connections vs consistent hashing)

**Phase 3 components (ML infra):**
- KV cache manager for LLM inference (when to evict, prefix caching)
- Dynamic batching scheduler (when to flush vs hold for more requests)
- GPU memory allocator for variable-length requests
- Autoscaling controller (what signal to use — and why queue-depth beats raw GPU util)
- Streaming response pipeline (token-by-token SSE, backpressure)

**Phase 4 components (integration complexity):**
- Full request lifecycle for an LLM API (from HTTP to token to response)
- Failure modes in a distributed crawler (retries, timeouts, queue persistence)
- Caching strategy for a multi-tier ML inference system

---

## Format 4: Debug & Read

**Purpose:** Build the ability to read unfamiliar code, find bugs, understand intent, and explain it — without the crutch of running it. This mirrors Round 4 (stack profiler) where you're reading an unfamiliar domain under fatigue.

**When to use:** Once per week (typically Sunday). Phases 1-5. Difficulty escalates from "obvious bugs" to "subtle correctness issues."

**Duration:** 20–25 minutes total

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Code delivery | 1 min | OpenClaw pastes a code snippet (10-30 lines) |
| Read & explain | 8 min | User explains what the code does in plain English |
| Bug finding | 8 min | User lists all bugs, incorrect assumptions, or missing cases |
| Fix discussion | 5 min | "How would you fix the critical bug?" |
| Key insight | 3 min | The class of bug this represents — what to watch for in the future |

### How OpenClaw Delivers It

1. **Code delivery** — Code is presented as a block in the chat. No hints about what's wrong.
   > "Read this code. Tell me what it does, then list everything wrong with it:
   > ```python
   > def process_samples(samples):
   >     active = set()
   >     events = []
   >     for sample in samples:
   >         current = set(sample)
   >         for fn in current - active:
   >             events.append(('enter', fn))
   >         for fn in active - current:
   >             events.append(('exit', fn))
   >         active = current
   >     return events
   > ```"

2. **Read & explain** — User describes intent in their own words. OpenClaw validates or corrects the interpretation.
   > User: "It's converting stack samples into enter/exit events by diffing consecutive samples."
   > OpenClaw: "Right. Keep that in mind — now where does the intent break down?"

3. **Bug finding** — OpenClaw gives hints only if stuck. First hint is directional ("think about recursive functions"). Second hint is specific ("what happens if foo appears twice in the same sample?").

4. **Key insight** — The class of bug named:
   > "Key insight: tracking by *name* instead of *position* is a category of bug you'll see in many diff algorithms. Whenever you're diffing two sequences, ask: am I identifying elements by value or by position? Sometimes they give different answers."

### Sample Code Library

**Phase 1 bugs (Python idioms and off-by-one):**
- `range(len(data))` antipattern with subtle off-by-one
- Counter that breaks on concurrent access (no lock)
- LRU cache that forgets to move_to_end on put (not just get)
- BFS that marks visited on dequeue instead of enqueue (allows duplicates in queue)

**Phase 2 bugs (algorithm correctness):**
- Stack profiler tracking by name instead of position (mirrors Round 4)
- Topological sort that doesn't detect cycles (queue empties, no cycle check)
- Rate limiter with the fixed-window burst problem (treated as bug, not design choice)
- Async code that's not actually concurrent (missing `asyncio.gather`, sequential awaits)

**Phase 4 bugs (production quality):**
- Thread-safe LRU where `get` doesn't update LRU order under lock (race condition)
- Redirect loop detector that compares URLs as strings (misses normalized duplicates)
- KV cache eviction that evicts the wrong request under memory pressure

---

## Format 5: SQL Challenge

**Purpose:** Build SQL fluency for analytical queries. Anthropic data infrastructure roles require window functions, complex joins, and aggregation. These are quick, focused practice problems.

**When to use:** Once per week (typically Thursday). Phases 2-4. Escalates from basic joins to window functions to nested CTEs.

**Duration:** 20 minutes total

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Schema delivery | 2 min | OpenClaw describes the tables (2-3 tables, brief schema) |
| Query challenge | 12 min | User writes the SQL query in the chat |
| OpenClaw review | 4 min | Correctness check, alternative approaches |
| Key insight | 2 min | The SQL pattern this problem illustrates |

### How OpenClaw Delivers It

1. **Schema delivery** — Short and concrete:
   > "Tables: `requests(id, user_id, service, latency_ms, created_at)` and `users(id, tier, country)`. Query: for each service, find the p95 latency in the last 7 days, broken down by user tier. Use a window function."

2. **No IDE** — User writes SQL in the chat. OpenClaw evaluates correctness semantically (doesn't run it, but knows SQL well).

3. **Review** — Points to one issue if present. If correct, shows an alternative approach (e.g., CTE vs subquery vs window function — when each is cleaner).

4. **Key insight** — Names the pattern:
   > "Key insight: `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)` is the standard p95 SQL pattern. Memorize it — p95/p99 latency questions are everywhere in backend interviews."

### Sample SQL Problem Library

**Phase 2 (foundations):**
- Find top N users by request count, last 30 days
- Services with more than X% error rate this week
- Users who haven't made a request in 14+ days (left join or NOT IN)
- Running total of requests per day per service (window function)

**Phase 3 (advanced):**
- p95/p99 latency per service per tier (PERCENTILE_CONT)
- Median session length by country (PERCENTILE_DISC)
- Active user cohort retention: who registered in week 1 and returned in week 4?
- Gap analysis: services that had 0 requests in any hour in the last 24h

---

## Format 6: Mock Pressure Round

**Purpose:** Simulate interview conditions. Full 30-minute problem, no AI assist, no looking things up, strict time. This is the highest-stress format — use it to build tolerance for performing under pressure.

**When to use:** Once per week (Friday). Phases 2-5. Problems escalate in complexity as phases progress.

**Duration:** 30 minutes hard stop

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Problem delivery | 1 min | OpenClaw delivers the full problem (spec, constraints, examples) |
| Planning | 5 min | User must type a plan before coding — OpenClaw waits |
| Implementation | 20 min | User codes in chat — OpenClaw does NOT help (timing only) |
| Final code submission | 2 min | User posts final answer |
| Debrief | 7 min | OpenClaw reviews, identifies what passed/failed interview bar |

### How OpenClaw Delivers It

1. **Problem delivery** — Full spec, intentionally realistic:
   > "Mock round begins now. Timer starts. You have 30 minutes.
   >
   > Problem: Implement a thread-safe rate limiter that limits users to N requests per sliding window of T seconds. Support operations: `allow(user_id) -> bool`. If the user is over the limit, return False. Should be correct under concurrent access from multiple threads.
   >
   > Constraints: up to 1000 concurrent users. Your solution should not require external dependencies. Write production-quality Python.
   >
   > Type your plan first. I'll wait 5 minutes. Then start coding."

2. **Timing** — OpenClaw checks in at 10 min remaining: "10 minutes left. Where are you?"

3. **Hard stop** — At 30 min: "Time. Post what you have."

4. **Debrief** — Structured evaluation:
   > "Here's what I see:
   > ✓ Correct sliding window logic (timestamps deque)
   > ✓ Per-user locking (good — global lock would serialize everything)
   > ✗ Missing: cleanup of old users' data (memory leak over time)
   > ✗ The lock acquire on every `allow()` call creates contention — discuss how you'd address that in a production system.
   >
   > Interview verdict: conditional pass. The logic is right, the production-quality issues would be caught in code review."

5. **Coaching note** — One actionable thing to improve:
   > "One thing to fix: always add cleanup. Ask 'what happens to memory as this runs for days?' That's the production-quality instinct they're testing."

### Problem Library (scaled by phase)

**Phase 2 problems:**
- Thread-safe rate limiter (sliding window)
- BFS maze solver with obstacles (find shortest path)
- Task scheduler with priorities (heap-based, no dependencies yet)

**Phase 3 problems:**
- LRU cache from scratch (the OA problem — timed, no hints)
- Async web crawler: BFS, dedup, rate limiting (no concurrency yet)
- Mini in-memory database: put/get/delete + list keys with prefix

**Phase 4 problems:**
- Full async web crawler with semaphore, redirect loop detection, timeout
- Task management system with DAG, topological sort, cascading cancel
- Stack profiler → trace events (the Round 4 problem, full version)

**Phase 5 problems:**
- Full mock OA problem (both LRU + Task System, 45 minutes each)

---

## Format 7: Review & Reflect

**Purpose:** Deliberate retrieval practice. The most underrated format. Looking back at yesterday's problem with fresh eyes, comparing your solution to the optimal one, naming the gap.

**When to use:** Once per week (Saturday). Phases 1-5. Always reviews the previous week's Mock Pressure Round.

**Duration:** 20 minutes

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Problem recall | 3 min | What was Friday's problem? What did you build? Any lingering doubts? |
| Optimal solution reveal | 5 min | OpenClaw walks through the optimal solution (or a better version of yours) |
| Gap analysis | 7 min | What specifically did you miss? Why? Was it a knowledge gap or an execution gap? |
| Pattern extraction | 3 min | What's the generalizable lesson? Name the pattern or principle. |
| Preview | 2 min | "Next week we go harder — here's what's coming" |

### How OpenClaw Delivers It

1. **Recall prompt** — Forces active retrieval before showing anything:
   > "Before I show you anything — describe Friday's rate limiter problem from memory. What was your approach? What did you struggle with?"

2. **Optimal solution** — Delivered in pieces, not all at once:
   > "Here's the key difference in the optimal solution: instead of a per-user lock dict, use a single `defaultdict(deque)` for timestamps, and lock at the user level with `user_locks = defaultdict(threading.Lock)`. See why?"

3. **Gap classification** — OpenClaw helps name whether the gap was:
   - **Knowledge gap**: "I didn't know defaultdict could help here"
   - **Execution gap**: "I knew the pattern but couldn't write it under pressure"
   - **Judgment gap**: "I knew it existed but didn't think of it in time"

   The fix for each is different. Knowledge gap → add it to the kata list. Execution gap → drill it more. Judgment gap → practice pattern recognition with more varied prompts.

4. **Pattern extraction** — Named explicitly:
   > "The pattern: per-resource locks with `defaultdict(Lock)` is a standard thread-safety pattern for shared-but-partitioned state. You'll use it again in any system where you want concurrency between users but isolation per user. Remember the name: per-key locking."

---

## Format 8: Concept Deep Dive

**Purpose:** Build conceptual knowledge for system design topics that can't be learned by coding. LLM inference mechanics, vLLM internals, KV cache behavior — these are read + discuss, not code.

**When to use:** Phases 2-3. Twice per week in Phase 3. Usually replaces SQL or Mini System Design on a given day.

**Duration:** 25 minutes

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Concept intro | 5 min | OpenClaw explains the concept in 3-5 sentences (high level) |
| Clarifying questions | 5 min | User asks questions — OpenClaw answers Socratically (asks back) |
| Application challenge | 10 min | "Given this concept, how would you use it to solve X?" |
| Explain it back | 5 min | "Explain this concept to me like I'm a senior engineer who's never worked on ML infra" |

### How OpenClaw Delivers It

1. **Concept intro** — Short, opinionated, concrete:
   > "Today: continuous batching in LLM inference. Old approach: batch requests, run them all, return results. Problem: if one request is 1K tokens and another is 100 tokens, you wait for the 1K one before starting anything new. Continuous batching: at every token generation step, check if any new requests can join the batch. The key insight: you don't have to wait for a request to *finish* to start a new one — you just need an open slot."

2. **Questions** — User asks what they don't understand. OpenClaw doesn't answer directly — it gives analogies or asks guiding questions.
   > User: "What does 'open slot' mean exactly?"
   > OpenClaw: "Think about a restaurant kitchen. Dishes finish at different times. Do you wait until everyone at the table finishes eating before seating new guests? Continuous batching is the maître d' seating new guests as soon as a seat opens."

3. **Application challenge** — Concrete design question using the concept:
   > "Now: you're designing the scheduler. A 10K-token request has been in the batch for 50 iterations. A new 100-token priority request comes in. How do you handle it? What are the trade-offs of (a) evicting the 10K request to add the 100-token one vs (b) just waiting?"

4. **Explain it back** — Forces synthesis:
   > "Now explain continuous batching to me as if I'm a senior backend engineer who's never worked on ML infra. One paragraph."

### Concept Library (Phase 3)

- KV cache in LLM inference (what it is, why VRAM matters)
- Continuous batching (vs iteration batching vs static batching)
- Prefix caching (identical system prompts → shared KV cache)
- PagedAttention / vLLM's approach to KV cache management
- Autoscaling signals (why queue-depth-weighted-by-tokens beats raw GPU util)
- Streaming responses: SSE vs WebSocket, token-by-token flushing
- GPU memory hierarchy: VRAM vs RAM, bandwidth vs capacity
- Attention mechanism overview: what grows with context length and why

---

## Format 9: Behavioral Story Practice

**Purpose:** Build the structured, specific, confident storytelling needed for the Hiring Manager round. STAR format, specific details, no vague platitudes.

**When to use:** Phases 4-5. Once per week. Also woven in as 5-minute warm-up in late-phase sessions.

**Duration:** 25 minutes

### Timing Breakdown

| Segment | Time | What happens |
|---------|------|-------------|
| Prompt delivery | 1 min | OpenClaw delivers a behavioral question |
| Unstructured answer | 5 min | User answers naturally |
| STAR structuring | 8 min | OpenClaw helps restructure the answer into STAR |
| Specificity drilling | 8 min | "What were the actual numbers? What exactly did you say? What did they say?" |
| Polished retell | 3 min | User delivers the story again, polished |

### Sample Question Library

- "Walk me through a time you had to make a significant technical decision with limited information."
- "Describe a production incident you owned. What was the root cause? How did you find it?"
- "Tell me about a time you pushed back on a product requirement. What happened?"
- "What's the hardest scaling challenge you've hit? What did you do?"
- "Give me an example of a technical decision you'd make differently now."
- "Describe a time you chose the simpler option over the 'correct' one. Was it the right call?"

### The Anthropic-Specific Coaching Points

Based on the hiring manager round analysis:
- **Choose simple** — If given a choice between simple/flexible and complex/powerful, default to simple and articulate why
- **Hold your position** — When OpenClaw pushes back, the user should defend their answer if it's right. Don't fold.
- **Real specifics** — Numbers, names, dates. "At some point" is never the right answer. "In Q3 2024, with 50ms p99 latency" is.

---

## Format Selection Guide

This table maps phases to formats so weekly templates (designed in the next aspect) have a menu to draw from.

| Format | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|--------|---------|---------|---------|---------|---------|---------|
| Code Kata | — | Daily | 4x/week | 2x/week | 2x/week | 1x/week |
| Spec Decomposition | — | 1x/week | 1x/week | 1x/week | 1x/week | 1x/week |
| Mini System Design | — | — | 1x/week | 3x/week | 1x/week | 1x/week |
| Debug & Read | — | 1x/week | 1x/week | 1x/week | 1x/week | 1x/week |
| SQL Challenge | — | — | 1x/week | 1x/week | 1x/week | — |
| Mock Pressure Round | — | — | 1x/week | 1x/week | 2x/week | 3x/week |
| Review & Reflect | — | 1x/week | 1x/week | 1x/week | 1x/week | 1x/week |
| Concept Deep Dive | — | — | 1x/week | 2x/week | — | — |
| Behavioral Story | — | — | — | — | 1x/week | 2x/week |
| **Diagnostic** | 5x | — | — | — | — | — |

---

## Cross-Format Principles

### OpenClaw Tone — Always Coach, Not Lecturer

In every format:
- **Ask before telling.** Before giving the answer, ask a guiding question.
- **Affirm the partial.** "You got the BFS structure right — what about the visited-on-enqueue vs visited-on-dequeue distinction?"
- **Name the meta-skill.** After every key insight, name what class of skill just got practiced.
- **End with forward momentum.** Every session ends with "tomorrow we..." or "next week's session will..."

### Handling "I Don't Know"

If the user says "I don't know" or goes silent:
1. First hint: directional (point to the category of solution, not the answer)
2. Second hint: structural (suggest the data structure or approach, not the code)
3. Third hint: explicit (just tell them — don't waste the session)
4. After telling: ask them to explain it back in their own words before moving on

Never end a session with the user feeling stupid. Always find something they got right.

### Edge Cases Come Up, Not Down

In Code Kata and Mock Pressure Round: if the user writes correct code, immediately throw an edge case. This builds the automatic edge-case-handling reflex. Don't wait until the end — do it mid-session.
> "Nice — that handles the standard case. What if `capacity = 0`? Does your LRU cache still behave?"

### The "Explain It To Me" Move

End every Code Kata and Debug & Read with:
> "In 2 sentences: what does this do and why?"

Forces synthesis. Builds the communication habit that Anthropic evaluates throughout every coding round.
