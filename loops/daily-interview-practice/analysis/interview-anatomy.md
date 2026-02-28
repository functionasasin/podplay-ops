# Interview Anatomy — Anthropic SWE (Infrastructure)

## Overview

Five rounds across three weeks. The bar is explicitly production quality — not "does it pass test cases" but "would you ship this." Concurrency is a thread that runs through every technical round. The system design round is domain-specific to LLM inference serving, which Anthropic builds internally, so they probe deeply.

---

## Round 1: Online Assessment (90 min, 2 problems)

### Format
- Timed, unmonitored (take-home style but with a hard clock)
- Two problems, 45 minutes each if split evenly — but in practice the second problem takes longer
- Production-quality code expected in the submission: thread safety, error handling, complexity analysis in comments
- Language: Python (expected)

### Problem 1: LRU Cache (Two-Phase)

**Phase 1**: Implement using `collections.OrderedDict` — clean, idiomatic Python
**Phase 2**: Re-implement from scratch using a doubly linked list + hashmap

Skills tested:
- Can you go from "I know the stdlib shortcut" to "I understand the underlying mechanism"
- Manual pointer manipulation under time pressure (doubly linked list eviction is where people lose time)
- Thread safety: locks around every mutation — `threading.RLock` preferred
- Complexity analysis: O(1) get/put — state this explicitly in comments

Pass/fail distinction:
- **Pass**: Implements both phases correctly, handles edge cases (capacity 0, single element), adds thread safety without being asked, writes clean code with clear variable names
- **Fail**: Only does Phase 1, skips thread safety, pointer bugs in Phase 2, no time complexity comments

### Problem 2: Task Management System

**Core**: Tasks with priorities, worker assignment, dependencies, cascading cancellation

Skills tested:
- Modeling real-world complexity as a graph (DAG for dependencies)
- Topological sort for ordering execution
- Circular dependency detection (DFS with "in-progress" state marking)
- Cascading cancellation logic (DFS/BFS from cancelled node)
- Clean state machine for task status

Critical detail: Circular dependency detection was added with 8 minutes left — this is a real edge case that can be forgotten under pressure

Pass/fail distinction:
- **Pass**: Full DAG implementation, topological sort, circular dependency detection, cascading cancellation, clean abstractions
- **Fail**: Misses circular dependencies, no cascading cancellation, spaghetti state management

### Cross-Cutting OA Requirements
- Thread safety is assumed, not bonus
- Error handling for all edge cases
- Complexity analysis in comments
- Production-quality code quality (naming, structure, abstractions)
- Time management: 45 min per problem is tight for the scope

---

## Round 2: Coding Round 1 — Web Crawler (Live Coding, ~60 min)

### Format
- Live coding, interviewer watching and asking questions in real time
- Starts simple, escalates via interviewer-driven complexity additions
- Edge cases thrown at you continuously — no "what about edge cases" prompt, they just describe a scenario and watch if you handle it

### The Build

**Stage 1**: BFS web crawler
- Start URL → extract links → crawl to depth N → build site map
- Deduplication of visited URLs
- Rate limiting (simple — don't hammer the server)

**Stage 2**: Add robots.txt
- Parse robots.txt before crawling a domain
- robots.txt parsing becomes its own sub-problem

**Stage 3**: Make it concurrent
- Interviewer: "Now make it faster"
- Expected: `asyncio` with a semaphore to limit concurrency
- `asyncio.Semaphore`, `async def`, `aiohttp` — the full async pattern

### Edge Cases Thrown Live
- **Redirect loops**: A → B → A — infinite loop without cycle detection in the redirect chain
- **Relative vs absolute URLs**: `href="/about"` vs `href="https://example.com/about"` — requires URL joining logic
- **Pages that hang for 30 seconds**: Need timeout logic on HTTP requests — `asyncio.wait_for()` or `aiohttp` timeout
- **Janky timeout logic was noticed**: Partial credit, but sloppy implementation was flagged

Pass/fail distinction:
- **Pass**: Concurrent implementation with semaphore, handles redirect loops, correct URL joining, reasonable timeout handling, explains trade-offs when asked
- **Fail**: Can't transition to async, no dedup, breaks on edge cases, can't explain decisions

Skills tested:
- asyncio fluency (not just "knows it exists" but writes it under pressure)
- Iterative design (start working, then improve — don't over-architect upfront)
- Edge case handling is automatic, not prompted
- Communication: explain decisions while coding

---

## Round 3: System Design — LLM Inference API (~60 min)

### Format
- Whiteboard/diagramming + deep discussion
- No "correct answer" — they're probing depth of understanding
- Interviewer has domain expertise (they build this) — they will find the edges of your knowledge

### The Problem
Design an inference API for serving large language models:
- Variable-length requests (short prompts vs long prompts → very different compute profiles)
- GPU memory management across concurrent requests
- Request queuing with priority (premium users, latency SLAs)
- Streaming responses (token-by-token output as they're generated)

### Key Discussion Areas

**Batching Strategy** (primary focus):
- Dynamic batching: group requests of similar length to maximize GPU utilization
- When to flush a batch vs hold and wait for more: latency vs throughput trade-off
- Continuous batching (iteration-level batching): don't wait for the whole batch to finish — add new requests as tokens complete
- Max batch wait time as a tunable parameter

**KV Cache Management**:
- Key-value cache per request in GPU VRAM — scales with sequence length
- Memory pressure: if VRAM fills up, must preempt or evict a request
- Eviction policy: which request to pause/evict? (shortest remaining work? LRU?)
- Cache sharing: prefix caching for requests with identical system prompts

**Autoscaling Signal** (the "insight" the interviewer liked):
- Wrong signal: raw GPU utilization — can look fine at 85% while latency is tanking
- Right signal: **queue depth weighted by estimated token count**
- Why: a queue of 10 short requests is very different from a queue of 10 long requests
- Token-weighted queue depth predicts actual latency impact better

**Streaming Responses**:
- Server-sent events (SSE) or WebSocket
- Token-by-token flush vs buffered — token-by-token is expected for interactive feel
- Backpressure: what if client is slow to consume?

Pass/fail distinction:
- **Pass**: Knows continuous batching, understands KV cache pressure, proposes token-weighted autoscaling signal, can discuss trade-offs quantitatively, knows vLLM/TGI at a conceptual level
- **Fail**: Generic "load balancer in front of GPU servers" design, doesn't know what a KV cache is, can't discuss batch scheduling, treats inference like stateless HTTP

Reference tools/systems to know:
- vLLM (PagedAttention, continuous batching)
- TGI (Hugging Face text generation inference)
- Triton Inference Server
- The mechanics of transformer inference: attention heads, KV cache growth with context length

---

## Round 4: Coding Round 2 — Stack Profiler → Trace Events (Live Coding, ~60 min)

### Format
- Unfamiliar problem domain — this is intentional
- Fatigue is a real factor (5th hour of interviews)
- You're not expected to know profiler internals — you're expected to reason carefully

### The Problem
Convert stack sampling profiler output into trace events:
- Input: periodic call stack snapshots (samples), each a list of function names
- Output: trace events: function_enter(name, time), function_exit(name, time)
- Algorithm: diff consecutive samples to detect enters/exits

### The Critical Catch
- **Recursive functions**: `foo` → `bar` → `foo` — `foo` appears twice in the stack
- You **cannot** track by function name — you must track by **stack position**
- `bar` entered when the stack at position 1 changes from something else to `bar`
- This is a subtle but critical distinction that many candidates miss

### What It Tests
- Can you work carefully in an unfamiliar domain without prior knowledge
- Precise reasoning about data representation (list of frames vs. set of function names)
- Recursive/edge case handling
- Performance under fatigue (this is hour 5)

Pass/fail distinction:
- **Pass**: Gets main implementation working, recognizes recursive case, tracks by position, handles empty stack edge cases
- **Fail**: Tracks by function name, breaks on recursion, can't get main algorithm right under fatigue

---

## Round 5: Hiring Manager (45 min)

### Format
- Conversational, not technical
- Infra team lead — they care about fit, judgment, and how you think
- Past projects, debugging stories, scaling challenges

### Key Evaluation Moments

**Past project deep dive**:
- Walk through a real system you built
- Expected: describe complexity, trade-offs made, what you'd do differently
- They're probing: did you actually build it, or just watch someone else?

**Debugging process**:
- How do you approach a completely unknown bug in production?
- Expected: structured approach (isolate, hypothesize, instrument, verify), not random trial and error
- Show that you work systematically under pressure

**Scaling challenges**:
- What's a real scaling challenge you've hit?
- Expected: real numbers, real decisions, real trade-offs

**The Key Moment — Technical Decision Under Pushback**:
- Two approaches presented: simple vs. flexible/complex
- Candidate chose simple: *"Flexibility you don't need yet is just complexity you pay for now"*
- Interviewer pushed back — candidate held the position
- **This is the test**: Can you defend a principled technical decision under social pressure?

Pass/fail distinction:
- **Pass**: Real stories with specific details, structured debugging approach, defaults to simplicity and can defend it, honest about uncertainty
- **Fail**: Vague stories, no specific details, changes answer when pushed back, "it depends" without substance

---

## Cross-Cutting Skills (Tested Across Multiple Rounds)

These are the **highest priority** skills — they appear everywhere:

| Skill | Appears In | Why It Matters |
|-------|-----------|----------------|
| Python concurrency (asyncio, threading, locks, semaphores) | OA, Round 1, Round 3 | Every technical round touches it |
| Edge case handling — automatic, not prompted | OA, Round 1, Round 2, Round 4 | Interviewers throw edge cases, they don't ask |
| Production-quality code patterns | OA, Round 1, Round 2 | Bar is "would you ship this" |
| Problem decomposition under time pressure | OA, Round 1, Round 2, Round 4 | Start working before spec is perfect |
| Clear communication while coding | Round 1, Round 2, Round 4, Round 5 | Thinking aloud is part of the eval |
| Default to simplicity with principled reasoning | OA, Round 3, Round 5 | Anthropic culture: YAGNI, pragmatism |

---

## What Separates Pass from Fail — Summary

### Technical
| Dimension | Pass | Fail |
|-----------|------|------|
| Data structures | Implements from scratch, knows when to use stdlib shortcuts | Only uses stdlib, can't explain internals |
| Concurrency | Writes asyncio/threading confidently under pressure | Knows it exists, can't write it live |
| Edge cases | Handles them as they come up, automatically | Needs to be told, then breaks |
| System design | Pragmatic, knows real systems (vLLM, etc.), discusses trade-offs with numbers | Academic, generic, can't discuss depth |
| Code quality | Clean, named well, handles errors, thread-safe by default | "Works" but production-unshippable |
| Time management | Gets something working fast, iterates | Overthinks upfront, runs out of time |

### Behavioral
| Dimension | Pass | Fail |
|-----------|------|------|
| Under pressure | Keeps building, communicates what's happening | Freezes, gets silent |
| Pushback | Holds position if right, updates if wrong | Folds immediately or gets defensive |
| Uncertainty | Admits it, reasons toward answer | Bluffs or shuts down |
| Complexity | Defaults to simple | Defaults to complex/flexible "just in case" |

---

## Interview Timeline

- Week 1: Online Assessment (90 min, take-home-ish)
- Week 2: Coding Round 1 + System Design (two separate sessions)
- Week 3: Coding Round 2 + Hiring Manager (two separate sessions)

Total time investment for candidate on interview day(s): ~5 hours of active interviewing spread over 3 weeks.
