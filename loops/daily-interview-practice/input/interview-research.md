# Anthropic SWE Interview — Research Compilation

Sources: First-hand candidate account (infrastructure SWE, passed, got offer) + multiple interview experience reports, prep guides (2025-2026).

## Interview Loop Overview

Anthropic infrastructure SWE. Five rounds, three weeks. The bar is high — production-quality code, concurrency in basically every round, and system design deeply specific to what Anthropic actually builds.

---

## Round 1: Online Assessment (90 min, 2 problems)

### Problem 1: LRU Cache

Sounds easy. It's not. They wanted **production quality**: thread safety, error handling, complexity analysis in comments.

- **Phase 1**: Implement with `OrderedDict` — clean, Pythonic
- **Phase 2**: Now implement it from scratch with a **doubly linked list + hashmap**
- The pointer updates on eviction are where people lose time
- This tests: can you go from "I know the stdlib shortcut" to "I understand the underlying data structure"

### Problem 2: Task Management System

Priorities, worker assignment, dependencies, **cascading cancellation**.

- Used a **DAG with topological sort** for dependencies
- Nearly forgot **circular dependency detection** — added it with 8 minutes left
- This tests: can you model real-world complexity as a graph problem under time pressure

### Key Takeaways
- Production quality matters — not just "does it work" but "would you ship this"
- Thread safety is expected, not bonus
- Time pressure is real — 90 minutes for 2 complex problems
- Know your data structures cold, both the stdlib shortcuts AND the manual implementations

---

## Round 2: Coding Round 1 — Web Crawler

BFS from a start URL, crawl to a depth, extract links, build a site map.

### Requirements
- Rate limit yourself
- Dedup visited URLs
- Respect robots.txt

### How It Escalated
- Started single-threaded
- Interviewer immediately asked to make it **concurrent** → `asyncio` with a semaphore
- robots.txt parsing became a whole thing
- Edge cases thrown continuously:
  - **Redirect loops**
  - **Relative vs absolute URLs**
  - **Pages that hang for 30 seconds** (timeout logic)
  - Most handled, but janky timeout logic was noticed

### What This Tests
- Can you write concurrent Python (asyncio, semaphores, task groups)
- Can you handle an interviewer throwing edge cases at you in real-time
- Do you think about failure modes (timeouts, infinite loops, malformed input)
- Can you iterate on a design while someone watches

---

## Round 3: System Design — LLM Inference API

**THIS IS THE ROUND.** If you only prepare for one thing at Anthropic, make it this. This is literally what they build, so they go DEEP.

### The Problem
Design an inference API for serving large language models:
- Variable-length requests
- GPU memory management across concurrent requests
- Request queuing with priority
- Streaming responses

### Key Discussion Areas

**Batching Strategy** (main discussion):
- How to dynamically group requests of similar length to maximize GPU utilization
- When to flush a batch vs hold for one more request
- Trade-off: latency (flush now) vs throughput (wait for fuller batch)

**KV Cache Management**:
- How to manage key-value cache across concurrent requests
- Memory pressure → which requests to evict/preempt
- Cache sharing opportunities across similar requests

**Autoscaling**:
- Candidate argued: **queue depth weighted by estimated token count** is better than raw GPU utilization as a scaling signal
- Why: GPU util can look fine while latency is tanking (because the queue is backing up with long requests)
- Interviewer liked this insight

### What This Tests
- Do you understand how LLM inference actually works (not just API calls)
- Can you reason about GPU memory, batching, and scheduling trade-offs
- Do you have real intuition for when metrics lie (GPU util vs actual user experience)
- Pragmatic design vs academic design

### Preparation Advice
- Read up on inference serving (vLLM, TGI, Triton Inference Server)
- Understand continuous batching, PagedAttention, KV cache management
- Know GPU memory hierarchy and how transformer inference uses it
- Think about real numbers: what's a reasonable batch size, what's p95 latency target

---

## Round 4: Coding Round 2 — Stack Profiler → Trace Events

Converting stack sampling profiler output into trace events.

### The Problem
- You get periodic call stack snapshots (samples)
- Reconstruct when each function started and stopped
- Diff consecutive samples to detect enters and exits

### The Catch
- **Recursive functions**: same function appears multiple times in one stack
- Must track by **position in the stack**, not by function name
- This is a subtle but critical distinction

### How It Went
- Got through main implementation
- Could feel there was a follow-up that was never reached
- Weakest round — fatigue was a factor (5th hour of interviews)

### What This Tests
- Can you work with unfamiliar problem domains (profiler internals)
- Careful reasoning about data representation
- Handling recursive/edge cases correctly
- Performance under fatigue

---

## Round 5: Hiring Manager (45 min)

Infra team lead. More conversational than technical.

### Topics
- Past projects deep dive
- Debugging process — how do you approach unknown problems
- Scaling challenges you've faced

### The Key Moment
Described two approaches to a real problem on their team. Asked which one to pick.

- Candidate chose the simpler one: *"Flexibility you don't need yet is just complexity you pay for now"*
- Interviewer pushed back but seemed satisfied
- This tests: can you defend technical decisions under pushback, and do you default to simplicity

---

## Cross-Cutting Themes

### Concurrency Is Everywhere
Shows up in basically every round:
- Online assessment: thread-safe LRU cache
- Coding round 1: asyncio web crawler with semaphore
- System design: concurrent GPU request management
- **If you're not comfortable with concurrency in Python, you will struggle**

### Production Quality Expected
Not "does it work" but "would you deploy this":
- Error handling
- Thread safety
- Complexity analysis
- Clean abstractions
- Edge case handling

### They Test What They Actually Build
The system design round is about LLM inference serving — their core product. They're not asking generic "design Twitter" questions. They go deep because they live it.

### Edge Case Thinking Must Be Automatic
Interviewers don't ask "what about edge cases?" — they throw them at you and watch if you catch them or break.

### Simplicity Is a Strength
"Flexibility you don't need yet is just complexity you pay for now" — this philosophy resonates at Anthropic.

---

## Skill Priority Matrix (Based on This Account)

| Skill | Priority | Appears In |
|-------|----------|------------|
| Python concurrency (asyncio, threading, locks) | CRITICAL | Rounds 1, 2, 3 |
| Data structures from scratch (linked lists, hash maps, trees) | CRITICAL | Round 1 |
| Graph algorithms (DAG, topological sort, BFS/DFS) | HIGH | Rounds 1, 2 |
| System design for ML infrastructure | CRITICAL | Round 3 |
| GPU/inference serving knowledge | HIGH | Round 3 |
| Edge case handling under pressure | HIGH | Rounds 1, 2, 4 |
| Production-quality coding patterns | HIGH | Round 1 |
| Time management under pressure | HIGH | All rounds |
| Defending technical decisions | MEDIUM | Round 5 |
| Unfamiliar problem domain reasoning | MEDIUM | Round 4 |
| Batch processing / scheduling theory | MEDIUM | Round 3 |
| Network protocols (HTTP, redirects, robots.txt) | MEDIUM | Round 2 |

---

## What Makes Someone Pass (Synthesized)

### Technical Bar
- Python fluency is NON-NEGOTIABLE — stdlib, idioms, clean patterns
- Concurrency must be second nature — asyncio, threading, locks, semaphores
- Can implement data structures from scratch, not just use stdlib wrappers
- Can decompose messy specs into buildable steps under time pressure
- System design thinking is pragmatic: what would you actually ship
- Edge case thinking is automatic, not an afterthought
- Know how LLM inference works at the systems level

### Mindset Bar
- Default to simplicity: "flexibility you don't need yet is just complexity you pay for now"
- Honest about what you don't know
- Build incrementally — get something working, then improve
- Can iterate on a design while being watched and questioned
- Comfortable with fatigue and pressure across multiple hours

### What Separates Pass from Fail
- **Pass**: Gets something working quickly, handles edge cases as they come, communicates trade-offs clearly, shows deep understanding of practical systems, defends decisions under pushback
- **Fail**: Gets stuck on perfection, can't handle edge cases thrown in real-time, designs academic systems, memorized patterns without real understanding, crumbles under pushback or fatigue

---

## Preparation Recommendations

- **Concurrency first**: Get asyncio, threading, and locks into muscle memory
- **Data structures from scratch**: Implement linked lists, hash maps, trees, graphs without stdlib help
- **LLM inference**: Read about vLLM, continuous batching, PagedAttention, KV cache management
- **Practice under pressure**: Timed problems, no AI help, someone watching
- **Edge case drills**: Practice having someone throw edge cases at you while you code
- **System design**: Design real infra systems (inference serving, crawlers, task schedulers) — not "design Instagram"
- **Daily practice**: 30-60 min, consistent, reflective. Quality over quantity.
