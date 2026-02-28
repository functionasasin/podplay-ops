# Phase 4: Integration — OpenClaw Session Scripts

**Duration:** 4 weeks (28 days), Weeks 13–16
**Formats:** Spec Decomposition (Mon), Mock Pressure Round (2x — Tue + Fri), Behavioral Story Practice (Wed), Code Kata or SQL (Thu), Review & Reflect (Sat), Mini System Design (Sun)
**Target:** End-to-end execution under time pressure. No AI assist. Behavioral stories locked in. By end of Phase 4, you complete a full async web crawler in 30 minutes while narrating your thinking.

This file is the **executable curriculum** for Phase 4. OpenClaw reads this to know exactly what to say, ask, and evaluate on each of the 28 days. Every session is a complete OpenClaw script: opening, problem, timing, evaluation guide, key insight, forward transition.

Phase 4 is where everything clicks — or doesn't. The sessions deliberately mirror real interview conditions. Less hand-holding than earlier phases. Tighter time pressure. Problems that require combining multiple skills from Phase 1, 2, and 3.

**Day numbering:** Days 1–28 within Phase 4. In the global practice log, these are days 88–115 (after 3 diagnostic + 28 Phase 1 + 28 Phase 2 + 28 Phase 3 days).

---

## Phase 4 Opening Message

> OpenClaw sends this on Day 1 of Phase 4:

> **Phase 4: Integration begins today.**
>
> Phases 1–3 built your toolkit. Phase 4 is where you learn to use it under fire.
>
> The format changes. Every Monday is a Spec Decomposition — a messy, underspecified problem where your job is to break it down BEFORE touching code. Every Tuesday and Friday is a Mock Pressure Round — 30 minutes, no AI, no search, I'm watching. Wednesday is behavioral: 3 stories, rehearsed until they're automatic. Thursday is a targeted kata on the specific skills the week's mocks will test.
>
> The bar shifts here too. "Works but messy" doesn't pass anymore. I'll evaluate for production quality: thread safety, error handling, edge cases, time complexity in comments. The same bar Anthropic's CodeSignal uses.
>
> Three rules for Phase 4:
> 1. **Talk while you code.** In a real interview, silence is failure. Narrate every decision.
> 2. **Plan before touching code.** You have 30 minutes. Spend 3–5 on the plan. It will save you.
> 3. **Edge cases come mid-session.** I'll throw them at you while you're coding. Don't stop — handle it in stride.
>
> Let's go. Day 1 — Web Crawler.

---

## WEEK 13: Web Crawler End-to-End + Behavioral Baseline

**This week's arc:** The web crawler is the Coding Round 1 problem. We build it in layers: BFS + dedup (Tuesday), add concurrency (Thursday), add redirect safety + URL normalization (Friday). By Sunday, you're designing the production-quality failure-handling version. Wednesday: your first behavioral story gets on paper.

---

### Day 1 (Mon) — Spec Decomposition: Web Crawler

**Format:** Spec Decomposition | **Key skill:** Decompose a real Round 1 spec without scaffolding

---

**OpenClaw opening:**
> **Day 1, Week 13 — Spec Decomposition: Web Crawler**
>
> Here's the spec. Your job: break it into an implementation plan. No coding yet — thinking only. You have 20 minutes to produce a written plan I'd be comfortable handing to a junior engineer.
>
> ---
>
> **The spec:**
>
> "We need a web crawler. Give it a starting URL and it crawls the web from there. It should collect all the URLs it finds. We don't want it to run forever — give it some way to bound how far it goes. It shouldn't visit the same page twice. We care about not hammering any one server too hard. Output: all the URLs visited."
>
> ---
>
> Before you plan: what clarifying questions would you ask? List them first. Then assume reasonable defaults for anything I don't answer, and write your plan.
>
> Go.

**Target time:** 20 min planning, 5 min debrief

**OpenClaw clarification responses (internal — answer if asked):**
- "What bounds the crawl?" → Depth limit D. Seed URL = depth 0. Pages linked from seed = depth 1. Pages linked from those = depth 2. Up to depth D.
- "What counts as the same page?" → URL string equality for now. (They should ask about normalization — good sign if they do.)
- "How do we not hammer servers?" → Rate limit: max K concurrent requests at any time.
- "What do we do with errors?" → Skip failed pages, log them if possible.
- "What about relative URLs?" → Good question — normalize to absolute before adding to queue.
- "What format is the output?" → Just a list of visited URL strings in BFS order.
- If they DON'T ask about normalization, URL format, or relative URLs → push at debrief: "What if I give you `http://example.com/page` and `https://example.com/page/` — same page?"

**Strong plan includes:**
1. BFS on a queue — why BFS and not DFS (BFS gives level-by-level = natural depth tracking)
2. Visited set — what gets added and when (before or after fetching?)
3. Depth tracking — how: tuple `(url, depth)` in the queue, or separate dict
4. Rate limiting — some mechanism (semaphore, sleep, token bucket)
5. URL normalization — at minimum: mention it as needed
6. Error handling — skip failed pages
7. async fetch — mention or defer until later (acceptable either way)

**Common gaps to probe:**
- If no mention of visited-on-enqueue vs visited-on-dequeue: "When do you add a URL to visited — before or after you fetch it? What breaks if you get it wrong?"
- If rate limiting is vague ("just slow it down"): "How do you implement that concretely? What's the data structure?"
- If no async/concurrency mentioned: "This plan is sequential — 1000 pages at 500ms per fetch = 8 minutes. Is that okay?"

**OpenClaw debrief:**
> Good. Let me tell you what I'm looking for in this decomposition, and what separates a "planning pass" from a "planning fail."
>
> **BFS vs DFS:** BFS is non-negotiable here because depth limit is natural in BFS — you process all depth-0 nodes, then all depth-1 nodes. With DFS you'd need extra bookkeeping.
>
> **Visited-on-enqueue:** Always mark visited when you ADD to the queue, not when you process. If you wait until processing, multiple nodes can enqueue the same URL before any of them processes it — you do duplicate work and potentially hit the same page 100 times.
>
> **URL normalization:** This is the edge case that kills otherwise correct implementations. `http://example.com/page`, `https://example.com/page`, `http://example.com/page/` — three strings, one page. Decide a canonical form (lowercase scheme, strip trailing slash, normalize http→https optional) and apply it before adding to visited.
>
> **Rate limiting:** A semaphore is the right tool — `asyncio.Semaphore(K)` limits concurrent fetches to K. Simple, correct, no busy-waiting.
>
> Tomorrow: you implement Part 1. BFS + dedup + depth. 30 minutes. No concurrency yet — that's Thursday.

---

### Day 2 (Tue) — Mock Pressure Round: Web Crawler Part 1

**Format:** Mock Pressure Round | **Key skill:** Foundation before adding complexity — BFS, dedup, depth

---

**OpenClaw opening:**
> **Day 2, Week 13 — Mock Pressure Round: Web Crawler Part 1**
>
> 30 minutes. Clock starts when you say "ready."
>
> ---
>
> **Problem: Web Crawler — Part 1**
>
> Implement a web crawler. You have access to this stub (do not implement it):
>
> ```python
> async def fetch_page(url: str) -> tuple[str, list[str]]:
>     """Returns (page_content, list_of_urls_found_on_page).
>     Raises aiohttp.ClientError on network failure."""
>     ...
> ```
>
> Implement:
> ```python
> async def crawl(seed_url: str, max_depth: int) -> list[str]:
>     """Crawl starting from seed_url up to max_depth levels deep.
>     Returns list of all successfully visited URLs in BFS order.
>     Do not visit the same URL twice.
>     seed_url is at depth 0."""
>     ...
> ```
>
> **For now:** sequential async only — `await fetch_page(url)` one at a time. No concurrency yet.
>
> Rules: no AI, no search. Talk through your approach for 2 minutes, then code.
>
> Say "ready" to start the clock.

**Target time:** 30 min

**Timer management (internal):**
- At 10 min: "Time check — 20 minutes left. Where are you?"
- At 20 min: "10 minutes left. If you don't have a working skeleton, prioritize correctness over completeness."
- At 30 min: "Time's up. Share what you have — even incomplete is fine."

**OpenClaw mid-session edge case (throw at ~15 min, while they're coding):**
> Quick edge case — don't stop coding, just tell me: what happens if `fetch_page` raises an exception? Does your crawler crash? What should it do?

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| BFS structure | `deque`, correct level-by-level | BFS but depth tracking off-by-one | DFS or no graph traversal |
| Visited set | Visited-on-enqueue, before adding to queue | Visited-on-dequeue (works, but inefficient) | No deduplication |
| Depth tracking | `(url, depth)` tuples in queue | Separate dict or level counter | Doesn't track depth |
| Error handling | try/except around fetch, skip + continue | try/except exists but swallows silently | No error handling |
| Return order | BFS order (or documented order) | Any order with comment | Random, no comment |
| async correctness | `async def crawl`, `await fetch_page` used correctly | Has async syntax but wouldn't actually run | Not async at all |

**Pass:** 5/6 criteria met with no correctness bugs.
**Conditional Pass:** 4/6 met OR 5/6 with a minor correctness bug you can identify.
**Fail:** < 4/6 OR visited-on-dequeue AND no error handling.

**Strong solution pattern:**
```python
async def crawl(seed_url: str, max_depth: int) -> list[str]:
    visited = {seed_url}
    queue = deque([(seed_url, 0)])
    result = []

    while queue:
        url, depth = queue.popleft()
        try:
            content, links = await fetch_page(url)
            result.append(url)
            if depth < max_depth:
                for link in links:
                    if link not in visited:
                        visited.add(link)
                        queue.append((link, depth + 1))
        except Exception:
            continue  # skip failed pages, log in production

    return result
```

**Key insight to deliver:**
> **Key insight:** Visited-on-enqueue vs visited-on-dequeue is the most common correctness bug in crawler implementations. If you mark visited when you dequeue (process), multiple nodes can enqueue the same URL before any of them runs — you fetch it 50 times. Mark visited when you ADD to the queue. The only exception: if a fetch fails, you might want to retry — but handle that explicitly, not by re-queueing silently.

**Tomorrow preview:**
> Tomorrow: first behavioral story. "Walk me through a significant technical decision you made with limited information." Start thinking about a real story from your experience.

---

### Day 3 (Wed) — Behavioral Story Practice: First STAR Story

**Format:** Behavioral Story Practice | **Key skill:** First STAR story — get it on paper, make it specific

---

**OpenClaw opening:**
> **Day 3, Week 13 — Behavioral: First Story**
>
> The Hiring Manager round at Anthropic is 45 minutes. They ask about past projects, debugging stories, trade-off decisions. The difference between a pass and a fail here is specificity. Vague stories fail. "We had a problem and I fixed it" fails. Specific, named, numbered, dated stories pass.
>
> **Today's question:**
>
> *"Walk me through a significant technical decision you made with limited information. What did you decide? How did you make the call? Was it right?"*
>
> Take 5 minutes to think about a real story from your experience. Then tell it to me. I'll listen, then ask follow-up questions.
>
> Go — 5 minutes of thinking, then start talking.

**Target time:** 25 min total (5 thinking + 10 story + 10 follow-up)

**OpenClaw listening guide (internal):**

After the story, probe for specificity with these follow-ups:
- If timeline is vague ("at some point"): "When was this? What year, what product stage?"
- If impact is vague ("it helped a lot"): "Give me a number. How much faster? How many users affected?"
- If the decision itself is fuzzy: "What were the two options you were choosing between? Say them explicitly."
- If alternatives aren't mentioned: "What was the other path you didn't take? What would have happened?"
- If the "wrong" or "uncertain" part is glossed over: "What information were you missing when you made the call? How did you handle that uncertainty?"

**STAR framework check (internal):**
- **S**ituation: context, stakes, timeline — should be 2–3 sentences max
- **T**ask: what specifically was YOUR role — not "we", "I"
- **A**ction: the decision itself, the reasoning, the alternatives considered
- **R**esult: specific outcome with numbers if possible + lesson learned

**Common failure modes:**
- Story is about team success, not personal decision → "Tell me more about YOUR specific contribution"
- No real uncertainty → "Where did you feel like you didn't have enough information?"
- Outcome is glossed over → "What specifically was better? Can you quantify it?"

**OpenClaw feedback:**
> [After story + follow-ups]
>
> Here's what works in your story: [name 1-2 strong elements].
>
> Here's what needs sharper: [name 1-2 gaps].
>
> For next time: **every story should have a number**. "Reduced latency by 40%" beats "made it faster." "Affected 3 services, ~2000 users" beats "significant impact." If you don't have a real number, estimate one — "I estimated it saved roughly X" is fine.
>
> **Restate the story in 90 seconds** with the fixes. Go.

**Key insight to deliver:**
> **Key insight:** In behavioral rounds, interviewers are pattern-matching to "will this person make good decisions in ambiguous situations?" Your story needs to show: (1) you gathered information under constraints, (2) you made a reasoned call with what you had, (3) you tracked the outcome and learned from it. That arc — gather, decide, learn — is the pattern they're listening for.

**Tomorrow preview:**
> Tomorrow: kata — adding asyncio.Semaphore concurrency to Tuesday's web crawler. You already have the BFS structure. The lift is simpler than it sounds.

---

### Day 4 (Thu) — Code Kata: Web Crawler + Concurrency

**Format:** Code Kata | **Key skill:** Incremental complexity; async lift with semaphore

---

**OpenClaw opening:**
> **Day 4, Week 13 — Code Kata: Async Web Crawler**
>
> Take Tuesday's sequential crawler and make it concurrent. The change should be minimal — one data structure added, one `async with` statement per fetch. If you're rewriting more than 10 lines, you're doing too much.
>
> **The constraint:** Maximum K concurrent fetches at any time. If K=5 and you have 100 URLs queued, only 5 fetch operations run simultaneously.
>
> Here's Tuesday's skeleton again for reference:
>
> ```python
> async def crawl(seed_url: str, max_depth: int, max_concurrent: int = 10) -> list[str]:
>     # Your job: make this concurrent using asyncio.Semaphore
>     # Sequential version:
>     # visited = {seed_url}
>     # queue = deque([(seed_url, 0)])
>     # result = []
>     # while queue:
>     #     url, depth = queue.popleft()
>     #     try:
>     #         content, links = await fetch_page(url)
>     #         result.append(url)
>     #         if depth < max_depth:
>     #             for link in links:
>     #                 if link not in visited:
>     #                     visited.add(link)
>     #                     queue.append((link, depth + 1))
>     #     except Exception:
>     #         continue
>     # return result
>     ...
> ```
>
> **Hint:** `asyncio.gather` + `asyncio.Semaphore`. You'll need to refactor from a while-loop BFS to launching concurrent tasks. 20 minutes.

**Target time:** 20 min kata + 5 min debrief

**10-minute check-in:**
> Check-in — 10 minutes in. Are you restructuring around `asyncio.gather`? If you're still in the `while queue:` pattern, that's okay for sequential — but concurrent requires launching tasks. Where are you stuck?

**OpenClaw mid-session edge case (at ~15 min):**
> While you're working — what happens to `visited` if two concurrent tasks both find the same new URL at exactly the same time? Is `visited.add(link)` safe in asyncio? (Hint: think about whether asyncio is multithreaded.)

**Expected answer on the edge case:** asyncio is single-threaded with cooperative multitasking. `visited.add(link)` is safe because there's no true parallel execution — context switches only happen at `await` points. The set is never modified from two coroutines simultaneously.

**Strong solution pattern:**
```python
async def crawl(seed_url: str, max_depth: int, max_concurrent: int = 10) -> list[str]:
    visited = {seed_url}
    result = []
    sem = asyncio.Semaphore(max_concurrent)

    async def fetch_with_limit(url: str, depth: int) -> list[tuple[str, int]]:
        async with sem:
            try:
                content, links = await fetch_page(url)
                result.append(url)
                if depth < max_depth:
                    new_links = []
                    for link in links:
                        if link not in visited:
                            visited.add(link)
                            new_links.append((link, depth + 1))
                    return new_links
            except Exception:
                return []
        return []

    current_level = [(seed_url, 0)]
    while current_level:
        next_links_nested = await asyncio.gather(
            *[fetch_with_limit(url, depth) for url, depth in current_level]
        )
        current_level = [item for sublist in next_links_nested for item in sublist]

    return result
```

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Semaphore created correctly | `asyncio.Semaphore(max_concurrent)` | Semaphore present but wrong scope | No semaphore |
| `async with sem:` around fetch | Inside the coroutine, wrapping fetch_page call | Around gather instead of per-fetch | Missing entirely |
| Concurrent launch | `asyncio.gather` | Loop of `create_task` | Sequential `await` |
| Thread-safety awareness | Mentions or knows asyncio is single-threaded | Adds unnecessary Lock | Confused about safety |

**Key insight to deliver:**
> **Key insight:** `asyncio.Semaphore` is the "max K workers" pattern. The semaphore goes INSIDE the coroutine — `async with sem:` wraps the actual fetch. If you put it outside (around the whole `gather` call), you block ALL fetches until the whole batch finishes — defeating the purpose. Inside = "at most K fetches running at once." Outside = "serialize the whole batch." Same structure you'll use for any concurrent resource limit.

**Tomorrow preview:**
> Tomorrow: Mock Pressure Round — Web Crawler Part 2. You'll add redirect loop detection and URL normalization. Read this once before bed: a redirect loop is when page A redirects to page B which redirects back to page A. Your current visited set doesn't catch this if redirects return new URLs. Think about how you'd detect it.

---

### Day 5 (Fri) — Mock Pressure Round: Web Crawler Part 2

**Format:** Mock Pressure Round | **Key skill:** Edge cases that appear in real Round 1

---

**OpenClaw opening:**
> **Day 5, Week 13 — Mock Pressure Round: Web Crawler Part 2**
>
> 30 minutes. This is the version you'll need to build in the real interview.
>
> Start with Tuesday's solution as your base. Add:
> 1. **URL normalization:** `http` and `https` of the same URL = same page. Trailing slash stripped. Lowercase scheme + host.
> 2. **Redirect loop detection:** `fetch_page` can now return a redirect target. If following redirects leads you back to a URL you've seen in this request chain, stop. Don't just rely on the global visited set — that misses loops that resolve to URLs you haven't seen globally yet.
> 3. **Concurrency:** Keep the `asyncio.Semaphore` from Thursday.
>
> Updated stub:
> ```python
> async def fetch_page(url: str) -> tuple[str, list[str], str | None]:
>     """Returns (content, outbound_links, redirect_url_or_None).
>     If redirect_url is not None, this page is a redirect — follow it.
>     Raises aiohttp.ClientError on failure."""
>     ...
> ```
>
> Say "ready" to start the clock.

**Target time:** 30 min

**Timer:**
- At 10 min: "20 left — do you have URL normalization working? That's the first thing to nail."
- At 20 min: "10 minutes — is redirect loop detection implemented? Or is it in your notes?"
- At 30 min: "Time."

**OpenClaw mid-session edge case (at ~18 min):**
> Mid-session question — what about relative URLs? If a page at `https://example.com/blog/post` has a link to `../about`, what URL does that become? How does your normalization handle it?

**Expected answer:** Absolute URL resolution. `../about` from `https://example.com/blog/post` = `https://example.com/about`. Python's `urllib.parse.urljoin(base_url, relative_url)` handles this. If they know this, strong signal. If not, hint: "Python's urllib.parse has a function for this."

**URL normalization approach:**
```python
from urllib.parse import urlparse, urlunparse, urljoin

def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    # lowercase scheme and host, strip trailing slash from path
    normalized = parsed._replace(
        scheme=parsed.scheme.lower(),
        netloc=parsed.netloc.lower(),
        path=parsed.path.rstrip('/') or '/'
    )
    return urlunparse(normalized)
```

**Redirect loop detection approach:**
```python
async def follow_redirects(url: str, max_hops: int = 10) -> tuple[str, list[str]] | None:
    seen_in_chain = set()
    current = url
    for _ in range(max_hops):
        if current in seen_in_chain:
            return None  # redirect loop
        seen_in_chain.add(current)
        content, links, redirect = await fetch_page(current)
        if redirect is None:
            return normalize_url(current), [normalize_url(l) for l in links]
        current = urljoin(current, redirect)
    return None  # too many redirects
```

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| URL normalization | Handles scheme case + trailing slash | One of two (scheme OR slash) | No normalization |
| Relative URL resolution | `urljoin` or equivalent | Mentions it but doesn't implement | Ignores relative URLs |
| Redirect loop detection | Per-request chain tracking, not just global visited | Global visited catches most loops (partial) | No redirect handling |
| Max redirect hops | Bounded (e.g., max 10) | Unbounded but acknowledged | Infinite loop risk |
| Concurrency | Semaphore in place | Mentioned but missing | Not concurrent |

**Pass:** 4/5 criteria met.
**Conditional Pass:** 3/5 OR normalization correct but redirect detection only uses global visited.
**Fail:** < 3/5 OR no normalization AND no redirect detection.

**Key insight to deliver:**
> **Key insight:** Redirect loops require **per-request chain tracking**, not just the global visited set. Here's why: imagine a redirect chain A→B→A that leads to URLs you've never crawled globally. The global visited set doesn't have A or B yet, so it doesn't catch the loop. You need a local `seen_in_chain` set per redirect chain, reset for each new original URL. URL normalization is what makes dedup actually work — without it, you'll crawl `http://example.com/` and `https://example.com` as two different pages.

**Tomorrow preview:**
> Tomorrow: review both crawler sessions. We'll debrief what slowed you down and what the minimal change from Part 1 to concurrent was.

---

### Day 6 (Sat) — Review & Reflect: Web Crawler Sessions

**Format:** Review & Reflect | **Key skill:** Incremental refactoring; redirect loop detection rationale

---

**OpenClaw opening:**
> **Day 6, Week 13 — Review & Reflect: Web Crawler**
>
> No new material. Today you reconstruct and reflect.
>
> Three questions — answer from memory, then I'll fill in anything you miss:
>
> **Q1:** What's the minimal diff between the sequential crawler (Day 2) and the concurrent version (Day 4)? If I asked you to explain it in 2 sentences to a colleague, what would you say?
>
> **Q2:** Why doesn't the global `visited` set alone catch redirect loops? Give me a concrete example where it fails.
>
> **Q3:** You normalized URLs before adding to `visited`. What breaks if you normalize AFTER adding (i.e., store the raw URL but normalize for dedup only)?

**Target time:** 15 min

**Expected answers (internal):**

**Q1:** Sequential → concurrent: add `asyncio.Semaphore(K)`, wrap `fetch_page` call in `async with sem:`, restructure from serial `while queue:` loop to batched `asyncio.gather` calls. The core BFS logic doesn't change.

**Q2 concrete failure example:** Page A redirects to B (new URL, never seen). B redirects back to A. Global visited doesn't have B yet when we first try to follow A→B. So we follow B→A, but now A IS in visited (global), so we stop there. Actually... this one might get caught. But what if: A→B→C→B (B redirects to C, C redirects back to B). We've never seen C globally, so we fetch C, get back to B which is in-chain. Per-request chain catches this. The global set might not if B appeared before C in a different request.

**Q3 problem:** If you store raw URLs in visited but normalize for comparison, the set becomes inconsistent. You might have `http://example.com/page/` in the set, but when you compare a new URL `https://example.com/page`, you normalize it and find `https://example.com/page` — but the stored entry is `http://example.com/page/`. Miss. Normalize before storing, compare normalized to normalized.

**OpenClaw debrief:**
> The pattern for this week: **build in layers**. Part 1 was BFS + dedup — clean and simple. Part 2 added concurrency as a small diff. Friday added two safety mechanisms (normalization + redirect detection) on top of a working base.
>
> In the real interview, Coding Round 1 works exactly this way. You build a working BFS crawler, then the interviewer says "now make it concurrent" — and they're watching whether you do it cleanly or rewrite everything. Clean diff = confident engineer.

---

### Day 7 (Sun) — Mini System Design: Distributed Crawler Failure Handling

**Format:** Mini System Design | **Key skill:** Production-quality thinking; retries, timeouts, queue persistence

---

**OpenClaw opening:**
> **Day 7, Week 13 — Mini System Design: Distributed Crawler Failure Layer**
>
> The crawler you've been building runs in memory on one machine. Now imagine it's a distributed system: 10 crawler workers, a shared URL queue, a results store. It runs for hours.
>
> Design the **failure-handling layer**. Specifically:
> 1. **Worker failure:** A crawler worker crashes mid-crawl. How do we not lose the URLs it was processing?
> 2. **Timeout handling:** Some pages hang for 30 seconds. How do we not get stuck?
> 3. **Persistent queue:** The whole system restarts. How do we resume without re-crawling?
>
> 20 minutes. Draw the components (describe them in text), explain the trade-offs.

**Target time:** 20 min design + 5 min debrief

**OpenClaw follow-up questions (Socratic — ask the ones they don't address):**
- "If a worker crashes before acking a URL, how does the queue know to retry it? What's the mechanism?"
  → Ack-based queue (like SQS or Redis RPOPLPUSH). Worker pops from processing set, acks on success, re-queues on timeout.
- "How do you timeout a fetch that hangs? What Python primitive handles that?"
  → `asyncio.wait_for(fetch_page(url), timeout=30.0)` raises `asyncio.TimeoutError`.
- "If you persist the queue to Redis and the Redis instance dies — now what?"
  → Acknowledge: that's the next failure layer. Redis replication or accept some loss. Tradeoff: complexity vs durability.
- "What prevents the same URL from being crawled by two workers simultaneously?"
  → RPOPLPUSH (atomic pop + move to processing set). Or distributed lock with TTL.

**Key insight to deliver:**
> **Key insight:** Failure handling in distributed systems is about **what you lose vs what you repeat**. At-least-once delivery (retry on failure) means some pages get crawled twice — acceptable. At-most-once (no retry) means you might miss pages — less acceptable for a crawler. The queue visibility timeout is the lever: if a worker doesn't ack within N seconds, the message re-appears for another worker. This is the pattern SQS, Kafka, and Redis RPOPLPUSH all implement in different ways.

---

## WEEK 14: Task Management System (OA-Style) + Behavioral Refinement

**This week's arc:** The Task Management System is OA Problem 2. It's a DAG problem requiring topological sort, cascading cancellation, and circular dependency detection. We build it the same way as the crawler: decompose Monday, implement Part 1 Tuesday, extend Thursday, full version Friday.

---

### Day 8 (Mon) — Spec Decomposition: Task Management System

**Format:** Spec Decomposition | **Key skill:** Decompose real OA spec without scaffolding

---

**OpenClaw opening:**
> **Day 8, Week 14 — Spec Decomposition: Task Management System**
>
> This is the spec for OA Problem 2. Your job: 20 minutes, break it into an implementation plan.
>
> ---
>
> **The spec:**
>
> "We need a task management system. Tasks can depend on other tasks — a task can't start until all its dependencies complete. Users can create tasks, add dependencies between tasks, and cancel tasks. When a task is cancelled, all tasks that depend on it (directly or transitively) should also be cancelled — but only if they haven't already completed. The system should reject a dependency that would create a cycle. Tasks can have one of these states: PENDING, RUNNING, COMPLETED, CANCELLED."
>
> ---
>
> Clarifying questions first. Then your plan.

**Target time:** 20 min planning + 5 min debrief

**OpenClaw clarification responses (internal):**
- "What's the data structure for tasks?" → Whatever makes sense. Each task has an ID, status, and a list of dependencies. You design the rest.
- "What does RUNNING mean exactly?" → A task someone has explicitly started. You don't auto-start tasks when dependencies complete — that's a separate trigger outside this system.
- "Can a COMPLETED task be cancelled?" → No. If a task is already COMPLETED, it ignores a cancel signal.
- "What about a task with no dependencies?" → Immediately eligible to run (status PENDING, can be moved to RUNNING immediately).
- "What if I add a dependency to a task that's already RUNNING or COMPLETED?" → Reject it. Dependencies must be set before the task starts.

**Strong plan includes:**
1. **Data model:** Task class with id, status (enum), dependencies (set of task IDs), dependents (set of task IDs — reverse edges)
2. **Cycle detection:** When adding dependency A→B, check if B already has a path to A (DFS or run Kahn's on subgraph)
3. **Cascading cancel:** When cancelling task X, BFS/DFS through `dependents` to find all transitively dependent tasks, set them to CANCELLED if not COMPLETED
4. **Valid state transitions:** PENDING→RUNNING only if all deps COMPLETED, RUNNING→COMPLETED, anything→CANCELLED (except COMPLETED)
5. **API design:** `create_task(id)`, `add_dependency(task_id, depends_on)`, `cancel_task(task_id)`, `complete_task(task_id)`, `get_status(task_id)`

**Common gaps to probe:**
- If they don't mention reverse edges (dependents): "How do you find which tasks to cancel when X is cancelled? If you only store forward edges (dependencies), what's the complexity of finding all dependents?"
- If cycle detection is vague ("check for cycles somehow"): "How specifically? Walk me through the algorithm."
- If cascading cancel is depth-first only: "Does order matter for cascading cancel? What if task B depends on A, and task C depends on B — when you cancel A, do you cancel B first, then C? Does it matter?"

**OpenClaw debrief:**
> Two subtleties most people miss on first decomposition:
>
> 1. **Reverse edges are critical.** Store both forward (dependencies) AND reverse (dependents) edges. Finding what to cascade-cancel becomes O(reachable nodes) with reverse edges — without them, you'd need to scan every task.
>
> 2. **Idempotency on cancel.** If task B is already CANCELLED, cancelling it again should be a no-op — not an error. Your cascade logic needs to handle `already-cancelled` state without exploding.
>
> Tomorrow: Part 1 — topological sort + dependency validation. No cascading cancel yet.

---

### Day 9 (Tue) — Mock Pressure Round: Task Management System Part 1

**Format:** Mock Pressure Round | **Key skill:** Kahn's algorithm under pressure with validation

---

**OpenClaw opening:**
> **Day 9, Week 14 — Mock Pressure Round: Task Management System Part 1**
>
> 30 minutes. Implement Part 1 of the Task Management System:
>
> ```python
> class TaskSystem:
>     def create_task(self, task_id: str) -> None:
>         """Create a new task with status PENDING."""
>         ...
>
>     def add_dependency(self, task_id: str, depends_on: str) -> None:
>         """task_id cannot start until depends_on is COMPLETED.
>         Raise ValueError if this would create a cycle.
>         Raise ValueError if either task doesn't exist.
>         Raise ValueError if task_id is not PENDING."""
>         ...
>
>     def get_status(self, task_id: str) -> str:
>         """Return current status: PENDING, RUNNING, COMPLETED, or CANCELLED."""
>         ...
>
>     def start_task(self, task_id: str) -> None:
>         """Move task from PENDING to RUNNING.
>         Raise ValueError if not all dependencies are COMPLETED."""
>         ...
>
>     def complete_task(self, task_id: str) -> None:
>         """Move task from RUNNING to COMPLETED."""
>         ...
> ```
>
> **For now:** no cancel, no cascade. Just the core state machine + cycle detection on `add_dependency`.
>
> Say "ready" to start.

**Target time:** 30 min

**Timer:**
- At 10 min: "20 left. Do you have the data model and `add_dependency` with cycle detection?"
- At 20 min: "10 left. Focus on correctness over features. Cycle detection must work."
- At 30 min: "Time."

**OpenClaw mid-session edge case (at ~18 min):**
> Mid-session: what if someone calls `add_dependency("A", "A")` — a task depending on itself? Does your cycle detection catch self-loops?

**Expected answer:** DFS from `depends_on` looking for `task_id` — a self-loop (A→A) means `depends_on == task_id`, which should be caught immediately before DFS.

**Strong cycle detection pattern:**
```python
def _has_path(self, from_id: str, to_id: str) -> bool:
    """Check if there's a path from from_id to to_id following dependency edges."""
    visited = set()
    stack = [from_id]
    while stack:
        node = stack.pop()
        if node == to_id:
            return True
        if node not in visited:
            visited.add(node)
            stack.extend(self.tasks[node].dependencies)
    return False

def add_dependency(self, task_id: str, depends_on: str) -> None:
    if task_id not in self.tasks or depends_on not in self.tasks:
        raise ValueError("Task does not exist")
    if self.tasks[task_id].status != "PENDING":
        raise ValueError("Cannot add dependency to non-PENDING task")
    if task_id == depends_on:
        raise ValueError("Self-dependency")
    # Adding task_id → depends_on. Would create cycle if depends_on → task_id already.
    if self._has_path(depends_on, task_id):
        raise ValueError("Cycle detected")
    self.tasks[task_id].dependencies.add(depends_on)
    self.tasks[depends_on].dependents.add(task_id)
```

**Evaluation criteria:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Data model | Task class/dict with status, deps, dependents | Has status + deps but no reverse edges | Only status, no dependency tracking |
| Cycle detection | Correct DFS/BFS from `depends_on` looking for `task_id` | Runs Kahn's on whole graph (correct but expensive) | No cycle detection |
| Self-loop | Caught before DFS | Caught by DFS (slower but works) | Not caught |
| start_task validation | Checks all deps COMPLETED | Checks deps exist but not status | No validation |
| State machine | PENDING→RUNNING, RUNNING→COMPLETED transitions clean | Works but no validation of current state | Free-form status assignment |

**Key insight to deliver:**
> **Key insight:** Cycle detection on a single `add_dependency` call is simpler than running Kahn's on the whole graph. You only need to check: "Does a path from `depends_on` to `task_id` already exist?" If yes, adding `task_id → depends_on` would create a cycle. That's a DFS from `depends_on` looking for `task_id`. O(V+E) per call — acceptable for a task management system where dependencies are set up-front.

**Tomorrow preview:**
> Tomorrow: behavioral story about a production incident you owned. Think of one now — root cause, debugging steps, resolution.

---

### Day 10 (Wed) — Behavioral Story Practice: Production Incident

**Format:** Behavioral Story Practice | **Key skill:** Second STAR story — debugging narrative

---

**OpenClaw opening:**
> **Day 10, Week 14 — Behavioral: Production Incident**
>
> Today's question:
>
> *"Describe a production incident you owned — start to finish. What broke? How did you find the root cause? What did you fix? What would you do differently?"*
>
> 5 minutes to think, then tell me the story. I'll ask follow-ups.

**Target time:** 25 min

**OpenClaw follow-up probes (internal):**
- If root cause identification is vague: "Walk me through the debugging process step by step. What did you check first? Why?"
- If their debugging was "I just looked at logs": "What specifically in the logs told you where to look? What were you searching for?"
- If fix is described vaguely: "What was the actual code change or config change? What did it look like?"
- If retrospective is weak: "What monitoring would have caught this before it hit production? Do you have that now?"
- If they say "we figured it out eventually": "How long did it take? What was the user impact during that time?"

**Specificity drill:**
> I want you to redo the debugging section with this constraint: tell me the EXACT order of what you checked, and WHY you checked each thing in that order. "I checked logs first because..." Not "we looked around."

**Key insight to deliver:**
> **Key insight:** Strong debugging stories follow a structured mental model: (1) isolate scope — is it one user or all users? One service or many? (2) rule out the most common causes first — config change? deployment? traffic spike? (3) follow the data — where does the request go? Where does it fail? The interviewer isn't evaluating your specific incident — they're evaluating whether you have a systematic debugging process. That's what they're hiring for.

---

### Day 11 (Thu) — Code Kata: Cascading Cancellation on a DAG

**Format:** Code Kata | **Key skill:** Cascading operations on a DAG; BFS for transitive reach

---

**OpenClaw opening:**
> **Day 11, Week 14 — Code Kata: Cascading Cancellation**
>
> Take Tuesday's TaskSystem and add `cancel_task`. The spec:
>
> ```python
> def cancel_task(self, task_id: str) -> list[str]:
>     """Cancel task_id and all tasks that transitively depend on it.
>     Rules:
>     - COMPLETED tasks are NOT cancelled (they're already done)
>     - CANCELLED tasks: already cancelled is a no-op (idempotent)
>     - Returns: list of task IDs that were newly cancelled (not already cancelled)
>     """
>     ...
> ```
>
> Example: A→B→C (C depends on B depends on A). `cancel_task("A")` should cancel A, B, and C (if none are COMPLETED).
>
> 20 minutes. Use BFS on the reverse edges (dependents).

**Target time:** 20 min kata + 5 min debrief

**10-minute check-in:**
> 10 min check — do you have a BFS traversal through `dependents`? Or are you doing DFS? Both work — but which did you choose and why?

**OpenClaw mid-session edge case (at ~15 min):**
> What if during your BFS, you encounter a task that's COMPLETED — do you still follow its dependents? Think carefully: task B is COMPLETED, but tasks C and D depend on B. If A is cancelled, should C and D be cancelled?

**Expected answer:** This is a subtlety. B being COMPLETED means B doesn't get cancelled. But C and D still depend on A (transitively via B). Since A is cancelled, C and D can never run — they should be cancelled. The BFS should continue through COMPLETED tasks (don't add them to the cancelled list, but DO continue traversing their dependents). Only stop when the traversal is exhausted, not when you hit a COMPLETED node.

**Strong solution:**
```python
def cancel_task(self, task_id: str) -> list[str]:
    if task_id not in self.tasks:
        raise ValueError("Task not found")

    newly_cancelled = []
    queue = deque([task_id])
    visited = set()

    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)

        task = self.tasks[current]
        if task.status != "COMPLETED" and task.status != "CANCELLED":
            task.status = "CANCELLED"
            newly_cancelled.append(current)
        # Always traverse dependents — even through COMPLETED tasks
        # because downstream tasks can never run if an ancestor is cancelled
        for dependent_id in task.dependents:
            queue.append(dependent_id)

    return newly_cancelled
```

**Key insight to deliver:**
> **Key insight:** The traversal continues through COMPLETED nodes — it just doesn't cancel them. Why? Because if task C depends on B (completed) and A (cancelled), C can never run. The cascading cancel must propagate all the way to the leaves of the dependency graph, regardless of whether intermediate nodes are completed. The BFS visits every reachable dependent; the status check only determines whether to mark it cancelled.

---

### Day 12 (Fri) — Mock Pressure Round: Task Management System Part 2

**Format:** Mock Pressure Round | **Key skill:** Full OA-quality version under 30-min pressure

---

**OpenClaw opening:**
> **Day 12, Week 14 — Mock Pressure Round: Task Management System Part 2**
>
> 30 minutes. Full OA-quality TaskSystem. All features:
>
> ```python
> class TaskSystem:
>     def create_task(self, task_id: str) -> None: ...
>     def add_dependency(self, task_id: str, depends_on: str) -> None: ...
>         # Raises ValueError on cycle, missing task, or non-PENDING task
>     def start_task(self, task_id: str) -> None: ...
>         # Raises ValueError if dependencies not all COMPLETED
>     def complete_task(self, task_id: str) -> None: ...
>     def cancel_task(self, task_id: str) -> list[str]: ...
>         # Returns list of newly cancelled task IDs (see Thursday's spec)
>     def get_status(self, task_id: str) -> str: ...
> ```
>
> Production quality bar: error handling, clean state transitions, correct edge cases (self-loops, already-cancelled idempotency, completed tasks not cancellable).
>
> Say "ready."

**Target time:** 30 min

**Timer:**
- At 10 min: "20 left. Where's your cycle detection? Is it written?"
- At 20 min: "10 left. Prioritize `cancel_task` over perfect error messages."
- At 30 min: "Time."

**OpenClaw mid-session edge case (at ~20 min):**
> What if someone calls `complete_task("X")` where X is in CANCELLED state? Should that raise an error or be a no-op?

**Expected answer:** Raise ValueError. CANCELLED→COMPLETED is not a valid transition. The system should reject it — a cancelled task cannot be completed.

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Cycle detection | Correct DFS, handles self-loops | Correct for simple cases, misses self-loops | Missing or incorrect |
| Cascading cancel | BFS through dependents, skips COMPLETED | BFS but stops at COMPLETED (misses downstream) | DFS with recursion risk OR missing |
| State machine | All invalid transitions raise ValueError | Most raise, some silently wrong | No validation |
| Idempotency | cancel on CANCELLED = no-op | cancel on CANCELLED = error (acceptable but verbose) | cancel on CANCELLED = crash |
| Dependents structure | Maintained correctly (add/remove on add_dependency) | Added but not bidirectional | Missing |

**Pass:** 4/5 criteria, no correctness bugs that would break normal use.
**Conditional Pass:** 3/5 OR cascade stops at COMPLETED (can explain the bug when pointed out).
**Fail:** Cycle detection broken OR cascade wildly wrong.

**Key insight to deliver:**
> **Key insight:** This problem has two graph algorithms: (1) DFS from `depends_on` to detect cycles on `add_dependency` — runs in the forward direction. (2) BFS from `task_id` through `dependents` for cascade cancel — runs in the reverse direction. You need BOTH directions in your data structure. If you only store `dependencies` (forward edges), cascade cancel is O(V × E) — you'd have to check every task to see if it depends on X. With `dependents` (reverse edges), cascade is O(reachable nodes). This is the same trade-off as maintaining a reverse index in a database.

---

### Day 13 (Sat) — Review & Reflect: Task Management System

**Format:** Review & Reflect | **Key skill:** Graph traversal choice; idempotency patterns

---

**OpenClaw opening:**
> **Day 13, Week 14 — Review & Reflect: Task System**
>
> Three questions from memory:
>
> **Q1:** Cycle detection: you're adding dependency `task_id → depends_on`. Which direction does your DFS go, and what are you looking for?
>
> **Q2:** Cascading cancel: BFS or DFS — which did you use, and does the choice matter for correctness? What about for order of cancellation?
>
> **Q3:** Why should cancel on an already-CANCELLED task be a no-op rather than an error?

**Target time:** 15 min

**Expected answers (internal):**

**Q1:** DFS goes FROM `depends_on` THROUGH `dependencies` (forward direction). You're looking for `task_id`. If `task_id` is reachable from `depends_on` via existing dependency edges, then adding `task_id → depends_on` would create a cycle. (Adding the edge goes from task to depends_on; a cycle would mean depends_on already reaches task.)

**Q2:** BFS vs DFS for cascading cancel — both are correct for reachability. Order difference: BFS cancels layer by layer (breadth-first = dependents one hop away first, then two hops, etc.). DFS cancels depth-first (goes deep before breadth). For a cancel operation, order doesn't matter for correctness — all reachable non-COMPLETED tasks should be cancelled. BFS is preferred because it's iterative (no recursion stack overflow risk on deep graphs) and the order is more predictable.

**Q3:** Idempotency is a system design principle: operations that have no additional effect when applied multiple times are safer to call repeatedly. Cancel is triggered by external events (user request, upstream cancel). The same event might fire twice (network retry, message queue at-least-once delivery). If cancel-on-CANCELLED raises an error, your retry logic breaks. No-op is the correct behavior for idempotent state transitions.

---

### Day 14 (Sun) — SQL Challenge: Time Gap Analysis

**Format:** SQL Challenge | **Key skill:** Time gap analysis; generate_series or CTE trick

---

**OpenClaw opening:**
> **Day 14, Week 14 — SQL Challenge: Time Gap Analysis**
>
> Schema:
> ```sql
> requests (service_id TEXT, hour TIMESTAMPTZ, request_count INTEGER)
> -- One row per service per hour. Missing rows = 0 requests that hour.
> ```
>
> **Challenge:** Find all (service_id, hour) pairs where a service had 0 requests in any hour of the last 24 hours. Note: missing rows represent 0 requests — they're not explicitly stored.
>
> **Hint:** You need to generate all expected hours, then LEFT JOIN to find which ones are missing.
>
> 20 minutes.

**Target time:** 20 min

**OpenClaw follow-up (at 10 min if stuck):**
> The trick: generate a series of all 24 hours × all service IDs, then LEFT JOIN to the actual requests table. Where the requests table has no match, that's a 0-request hour. PostgreSQL: `generate_series(start, end, interval)`. SQLite: recursive CTE.

**Strong solution (PostgreSQL):**
```sql
WITH hour_series AS (
    SELECT generate_series(
        NOW() - INTERVAL '23 hours',
        NOW(),
        INTERVAL '1 hour'
    )::TIMESTAMPTZ AS hour
),
all_service_hours AS (
    SELECT DISTINCT service_id, h.hour
    FROM (SELECT DISTINCT service_id FROM requests) s
    CROSS JOIN hour_series h
)
SELECT ash.service_id, ash.hour
FROM all_service_hours ash
LEFT JOIN requests r
    ON r.service_id = ash.service_id
    AND r.hour = ash.hour
WHERE r.request_count IS NULL
   OR r.request_count = 0
ORDER BY ash.service_id, ash.hour;
```

**Key insight to deliver:**
> **Key insight:** Missing-row queries require "generating what SHOULD exist, then finding what's absent." The pattern: (1) generate the full expected set (all services × all hours), (2) LEFT JOIN to actual data, (3) WHERE actual data IS NULL = the gaps. `generate_series` is PostgreSQL-specific but the pattern works in any SQL: recursive CTE for the time series, CROSS JOIN with the entity set, LEFT JOIN to find gaps. This pattern appears in retention analysis, uptime monitoring, and SLA reporting.

---

## WEEK 15: Stack Profiler + Combined Exercises

**This week's arc:** The stack profiler is Coding Round 2 — an unfamiliar domain, delivered when you're fatigued. The key is decomposing the problem carefully before touching code. The recursive function catch (track by position, not name) is the interview's twist. Build it in two parts: basic diff Tuesday, recursive handling Thursday.

---

### Day 15 (Mon) — Spec Decomposition: Stack Profiler → Trace Events

**Format:** Spec Decomposition | **Key skill:** Decompose Round 4 spec; domain unfamiliarity is the point

---

**OpenClaw opening:**
> **Day 15, Week 15 — Spec Decomposition: Stack Profiler**
>
> This is the spec for Coding Round 2 — the "unfamiliar domain" problem. You'll be tired when this comes in the real interview. Domain knowledge doesn't matter. Decomposition does.
>
> ---
>
> **The spec:**
>
> "We have a sampling profiler that captures stack traces at regular intervals. Each sample is a list of function names representing the call stack at that moment, from outermost to innermost. For example, at sample 1 the stack might be `[main, process_data, compute]` and at sample 2 it might be `[main, process_data, compute, sort]`.
>
> We want to convert these samples into trace events — specifically, function ENTER and EXIT events. An ENTER event means a function appeared on the stack that wasn't there in the previous sample. An EXIT event means a function was on the previous stack but isn't on the current one.
>
> Output: for each transition between consecutive samples, a list of (event_type, function_name) tuples in the order they should logically occur (exits before enters, deepest exits first, shallowest enters first)."
>
> ---
>
> Before you plan: what's not clear? What are your assumptions? Then write the plan.

**Target time:** 20 min planning + 5 min debrief

**OpenClaw clarification responses (internal):**
- "What order are exits/enters emitted?" → Exits first (innermost first), then enters (outermost first). Think of it as unwinding the stack then rewinding.
- "What if the entire stack changes?" → Treat it as: exit all functions from previous stack (innermost first), enter all functions in new stack (outermost first).
- "What about functions that appear in both stacks?" → No event for them — only the diff (what left, what arrived).
- "Can the same function appear multiple times in a stack?" → Yes, for recursive functions. This is the key challenge — save that for Thursday. For today's plan, assume no recursion.

**Strong plan includes:**
1. Compare consecutive pairs of samples (sliding window, pairs)
2. For each pair (prev, curr): compute set difference
   - `exits = set(prev) - set(curr)` (functions no longer in stack)
   - `enters = set(curr) - set(prev)` (functions newly in stack)
3. Ordering: exits in reverse order of their position in prev (deepest first), enters in order of their position in curr (shallowest first)
4. Output: EXIT events then ENTER events for each transition

**Common gaps to probe:**
- If they use set operations but ignore position: "You've found what exited and what entered, but in what order? If `[A, B, C]` transitions to `[A, B, D]`, the exit is C and the enter is D — order matters?"
- If they miss the ordering requirement: "Which exits first — the innermost function or the outermost? Think about what physically happens when a function call stack unwinds."
- If no thought about recursion: "What if the same function appears at positions 2 and 4 in the stack? When half the recursive calls exit, how do you know which one exited?"

**OpenClaw debrief:**
> The key insight about ordering: **exits unwind from innermost to outermost** (deepest position exits first, just like a real call stack). **Enters build from outermost to innermost** (shallowest position enters first — you enter the outer function before you enter the inner one). So for a transition from `[A, B, C]` to `[A, D, E]`: exit C (depth 2), exit B (depth 1), enter D (depth 1), enter E (depth 2).
>
> Tomorrow: implement the non-recursive version. Thursday: add recursive function handling — the interview's curveball.

---

### Day 16 (Tue) — Mock Pressure Round: Stack Profiler Part 1

**Format:** Mock Pressure Round | **Key skill:** Diff algorithm; set difference with position ordering

---

**OpenClaw opening:**
> **Day 16, Week 15 — Mock Pressure Round: Stack Profiler Part 1**
>
> 30 minutes. Implement the stack profiler converter for the non-recursive case.
>
> ```python
> from dataclasses import dataclass
> from typing import Literal
>
> @dataclass
> class TraceEvent:
>     event_type: Literal["ENTER", "EXIT"]
>     function_name: str
>
> def convert_samples(samples: list[list[str]]) -> list[TraceEvent]:
>     """Convert a list of stack samples to trace events.
>
>     Each sample is a call stack: [outermost, ..., innermost].
>     Between consecutive samples, emit:
>       - EXIT events for functions no longer in stack (innermost first)
>       - ENTER events for new functions (outermost first)
>
>     Assume: no recursive functions (each function name appears at most once per stack).
>
>     Example:
>       samples = [["main", "a", "b"], ["main", "a", "c"]]
>       → [TraceEvent("EXIT", "b"), TraceEvent("ENTER", "c")]
>     """
>     ...
> ```
>
> Say "ready."

**Target time:** 30 min

**Timer:**
- At 10 min: "20 left. Do you have the basic diff working? Test it mentally with the example."
- At 20 min: "10 left. Is your ordering correct — exits deepest-first, enters shallowest-first?"
- At 30 min: "Time."

**OpenClaw mid-session edge case (at ~15 min):**
> Edge case: what if `samples` is empty or has only one sample? What does your function return for `samples = []` and for `samples = [["main"]]`?

**Expected:** Empty list for both. No transitions = no events.

**Strong solution:**
```python
def convert_samples(samples: list[list[str]]) -> list[TraceEvent]:
    events = []

    for i in range(len(samples) - 1):
        prev = samples[i]
        curr = samples[i + 1]

        prev_set = set(prev)
        curr_set = set(curr)

        # Functions that exited — find their positions in prev, sort deepest first
        exits = prev_set - curr_set
        exit_events = sorted(
            [(prev.index(fn), fn) for fn in exits],
            key=lambda x: -x[0]  # highest index (deepest) first
        )

        # Functions that entered — find their positions in curr, sort shallowest first
        enters = curr_set - prev_set
        enter_events = sorted(
            [(curr.index(fn), fn) for fn in enters],
            key=lambda x: x[0]  # lowest index (shallowest) first
        )

        events.extend(TraceEvent("EXIT", fn) for _, fn in exit_events)
        events.extend(TraceEvent("ENTER", fn) for _, fn in enter_events)

    return events
```

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Consecutive pair comparison | Iterates pairs correctly | Off-by-one (misses last or first pair) | Compares all to first |
| Set difference | `set(prev) - set(curr)` for exits, vice versa for enters | Correct but verbose (loop comparison) | Missing or wrong |
| Exit order | Deepest (highest index) first | Any order (no crashes, wrong output) | Not ordered |
| Enter order | Shallowest (lowest index) first | Any order | Not ordered |
| Edge cases | Empty list, single sample handled | Crashes on empty | Crashes |

**Key insight to deliver:**
> **Key insight:** This is fundamentally a diff problem — like `git diff` but for stacks. Set difference gives you WHAT changed; position in the list gives you the ORDER. The ordering rule mirrors real execution: functions exit from the inside out (innermost unwinds first), and functions enter from the outside in (outer function is called before the inner one). If your ordering is wrong, the trace events are technically present but semantically incorrect — a profiler consuming them would reconstruct wrong timing trees.

---

### Day 17 (Wed) — Behavioral Story Practice: Simplicity Wins

**Format:** Behavioral Story Practice | **Key skill:** Third STAR story — simplicity-wins narrative (HM round key)

---

**OpenClaw opening:**
> **Day 17, Week 15 — Behavioral: Simplicity Wins**
>
> This is the story that matters most for the Hiring Manager round. The key moment from a real Anthropic HM interview: the candidate was presented two approaches and asked which to pick. The winning answer was the simpler one — "flexibility you don't need yet is just complexity you pay for now."
>
> **Today's question:**
>
> *"Tell me about a time you chose the simpler option over the technically more elegant or comprehensive one. Was it the right call? What would you do differently?"*
>
> 5 minutes to think. Then tell me.

**Target time:** 25 min

**OpenClaw follow-up probes (internal):**
- If the "simpler" option isn't clearly defined: "What were the two specific options? Name them both."
- If they can't articulate WHY they chose simple: "At the time, what was the argument for the more complex option? Why did you reject it?"
- If they regret the simple choice: "That's interesting — would you have been better served by the complex option? What specifically went wrong that complexity would have prevented?"
- If they say "simple is always right": "Is there a case where you'd go with the more complex option? What does that look like?"
- Push back if their answer is too confident: "Someone argues back: 'The simple approach won't scale when we have 10x the load.' How do you respond?"

**The key pushback to practice:**
> I'm going to push back on your story. "The more complex approach would have given us flexibility for the future — your simple choice is already causing pain as we grow. Was it really the right call?"
>
> Defend your decision. Don't cave. Or update your position — but with a clear reason.

**Key insight to deliver:**
> **Key insight:** "Flexibility you don't need yet is just complexity you pay for now." That exact line (or something like it) wins the Hiring Manager round. The interviewer is checking whether you default to complexity (impressive-sounding but risky) or simplicity (principled and maintainable). The right answer isn't "always simple" — it's "simple unless the complexity earns its keep with a specific, near-term requirement." Know your reasoning. Hold it under pushback. Update only if they give you new information, not just pressure.

---

### Day 18 (Thu) — Code Kata: Stack Profiler with Recursive Functions

**Format:** Code Kata | **Key skill:** Track by stack position, not function name — the key interview twist

---

**OpenClaw opening:**
> **Day 18, Week 15 — Code Kata: Recursive Stack Profiler**
>
> Tuesday's solution breaks on recursive functions. Here's why:
>
> ```
> prev = ["main", "fib", "fib"]   # fib called recursively
> curr = ["main", "fib"]           # one level of recursion returned
> ```
>
> With set difference: `set(prev) = {"main", "fib"}`, `set(curr) = {"main", "fib"}`. Diff = empty. But one `fib` call exited! You missed it.
>
> **The fix:** Track by stack position, not function name. Position 0 is always "outermost frame." Two functions with the same name at different positions are different calls.
>
> Modify `convert_samples` to handle recursive functions correctly.
>
> 20 minutes.

**Target time:** 20 min kata + 5 min debrief

**10-minute check-in:**
> Check-in — 10 min. What's your comparison strategy now? Are you comparing element-by-element by position, or using something else?

**Approach explanation:**
Instead of set operations, compare stacks position by position. Find the first position where they diverge — everything from there to end of prev is exits (deepest first), everything from there to end of curr is enters (shallowest first).

```
prev = ["main", "a", "b", "c"]
curr = ["main", "a", "d"]
              ^ diverge at index 2

exits: prev[2:] = ["b", "c"] → reversed → EXIT c, EXIT b
enters: curr[2:] = ["d"] → in order → ENTER d
```

**Strong solution:**
```python
def convert_samples(samples: list[list[str]]) -> list[TraceEvent]:
    events = []

    for i in range(len(samples) - 1):
        prev = samples[i]
        curr = samples[i + 1]

        # Find first divergence point
        diverge = 0
        while diverge < len(prev) and diverge < len(curr):
            if prev[diverge] != curr[diverge]:
                break
            diverge += 1

        # Exits: prev[diverge:] in reverse order (innermost first)
        for fn in reversed(prev[diverge:]):
            events.append(TraceEvent("EXIT", fn))

        # Enters: curr[diverge:] in order (outermost first)
        for fn in curr[diverge:]:
            events.append(TraceEvent("ENTER", fn))

    return events
```

**OpenClaw mid-session edge case (at ~15 min):**
> What if `prev = ["main", "fib", "fib", "fib"]` and `curr = ["main", "fib", "fib", "fib", "fib"]`? One more level of recursion added. Does your solution handle that?

**Expected:** Yes — diverge = 4 (both stacks agree on all 4 elements), prev[4:] = [] (no exits), curr[4:] = ["fib"] (one enter). Output: ENTER fib. Correct.

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Position-based comparison | Finds divergence point, slices from there | Position comparison but off-by-one | Still uses set operations |
| Recursive functions | Handles `["fib", "fib"]` correctly | Works for simple recursion, fails edge cases | Broken for recursion |
| Exit ordering | Reversed (innermost first) | Correct but reversed by sorting position | Not reversed |
| Enter ordering | In order (outermost first) | Correct order | Reversed |
| Edge: total stack change | Diverge at 0 → exit all of prev, enter all of curr | Correct but verbose | Crashes or wrong |

**Key insight to deliver:**
> **Key insight:** "Track by stack position, not function name" is the core insight of this problem. The same function can be at multiple positions (recursion) — those are different active stack frames with separate lifetimes. Once you realize comparison must be positional, the algorithm simplifies to: find the first mismatch, exit everything to the right of it (prev's tail, reversed), enter everything to the right of it (curr's tail, forward). This is O(n) and handles all cases including no-recursion, full-recursion, and partial-stack changes.

---

### Day 19 (Fri) — Mock Pressure Round: Stack Profiler Part 2

**Format:** Mock Pressure Round | **Key skill:** Round 4 complete simulation — recursive + fatigue

---

**OpenClaw opening:**
> **Day 19, Week 15 — Mock Pressure Round: Stack Profiler Part 2**
>
> 30 minutes. Full implementation — handles recursive functions.
>
> ```python
> def convert_samples(samples: list[list[str]]) -> list[TraceEvent]:
>     """Convert stack samples to trace events.
>
>     Rules:
>     - ENTER: function appeared in current stack, not in previous (by position)
>     - EXIT: function was in previous stack, not in current (by position)
>     - Recursive functions (same name at multiple positions) are separate calls
>     - Order: exits innermost-first, then enters outermost-first
>     - Emit events for each consecutive sample pair
>
>     Examples:
>       [["main", "a"], ["main", "a", "b"]] → [ENTER b]
>       [["main", "a", "b"], ["main", "a"]] → [EXIT b]
>       [["main", "a", "b", "b"], ["main", "a", "b"]] → [EXIT b]  # one recursive fib exited
>     """
>     ...
> ```
>
> Production quality: handle empty input, single sample, identical consecutive samples. No crashes on edge cases.
>
> Say "ready."

**Target time:** 30 min

**Timer:**
- At 10 min: "20 left — do you have the divergence point logic working?"
- At 20 min: "10 left — edge cases: empty list, identical consecutive samples."
- At 30 min: "Time."

**OpenClaw mid-session edge case (at ~18 min):**
> What if two consecutive samples are identical? `prev = ["main", "a"]`, `curr = ["main", "a"]`. What does your function return? What SHOULD it return?

**Expected:** Empty list. Diverge = len(both stacks), so prev[diverge:] = [], curr[diverge:] = []. No events. Correct.

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Position-based divergence | Correct for all cases | Correct except identical-stack edge case | Set-based (wrong for recursion) |
| Recursive handling | `["fib", "fib"]` handled correctly | Simple recursion correct, deep recursion untested | Broken |
| Exit ordering | Reversed from diverge point | Correct but relies on sort | Not reversed |
| Enter ordering | Forward from diverge point | Correct | Not in order |
| Edge cases | Empty, single, identical: all return [] | At least 2/3 handled | Crashes on any |
| Code quality | Clean, readable, comments on complexity | Works but dense | Unreadable |

**Pass:** 5/6 criteria.
**Conditional Pass:** 4/6 OR recursive handling correct but one edge case crashes.
**Fail:** Set-based approach (fails on recursion) OR crashes on empty input.

**Key insight to deliver:**
> **Key insight:** This problem is a lesson in reading the domain carefully. "Track by position" sounds subtle but once you see it, the algorithm is 10 lines. The difficulty isn't algorithmic complexity — it's recognizing that the set-based approach is wrong and understanding WHY. In a real interview, the interviewer gives you this problem specifically to see if you reason carefully about the domain before coding. The candidate who codes the set approach in 10 minutes and then has to rewrite it from scratch wastes 15 minutes. The candidate who spends 3 minutes thinking and gets position-based on the first try finishes with time to spare.

---

### Day 20 (Sat) — Review & Reflect: Stack Profiler

**Format:** Review & Reflect | **Key skill:** Kata → mock transfer; self-assessment of key insight timing

---

**OpenClaw opening:**
> **Day 20, Week 15 — Review & Reflect: Stack Profiler**
>
> Three questions:
>
> **Q1:** What was the key insight that unlocked the stack profiler problem? State it in one sentence.
>
> **Q2:** In Tuesday's first version (set-based), what's the specific input that proves it's wrong? Construct the example.
>
> **Q3:** Would you have caught the "track by position, not name" insight on your own in a real interview — without Thursday's kata? Be honest.

**Target time:** 15 min

**Expected answers (internal):**

**Q1:** "Track stack frames by position, not function name — the same function at two positions is two different calls."

**Q2:** `prev = ["main", "fib", "fib"]`, `curr = ["main", "fib"]`. Set diff = `set(prev) - set(curr) = {}` (both contain "main" and "fib"). Bug: one recursive `fib` call exited, but no EXIT event emitted.

**Q3:** This is a self-awareness question. Good answer: "Probably not on first pass — I'd likely start with set operations, hit the recursive test case, and then realize the fix. The kata short-circuited that." That's fine. The kata's job is to give you the insight before the interview so you don't discover it mid-problem.

**OpenClaw debrief:**
> The stack profiler is delivered as Round 4 — when you're most tired. The interviewers chose it deliberately: an unfamiliar domain where pattern-matching fails. You can't "recognize" it from LeetCode. The skill being tested is: can you reason carefully about a novel problem from first principles when you're fatigued?
>
> The preparation: domain decomposition (Monday), basic implementation (Tuesday), key insight delivered via targeted kata (Thursday), full implementation under pressure (Friday). That's the pattern for any "unfamiliar domain" problem. You can't know the domain in advance — but you can have a process for decomposing it.

---

### Day 21 (Sun) — Mini System Design: Multi-Tier ML Inference Caching

**Format:** Mini System Design | **Key skill:** Layered caching; where each layer wins

---

**OpenClaw opening:**
> **Day 21, Week 15 — Mini System Design: Multi-Tier Caching**
>
> Design the caching strategy for a multi-tier ML inference system with these layers:
>
> - **CDN** (edge, global, ~10ms latency to user)
> - **API Gateway cache** (regional, ~1ms latency)
> - **Model server KV cache** (VRAM, sub-millisecond)
>
> Questions to answer:
> 1. What kind of content does each layer cache? What makes something cacheable at each level?
> 2. What cache invalidation strategy applies at each layer? (TTL? Event-based? None?)
> 3. What request types can NEVER be cached, and why?
> 4. Describe a cache miss cascade — what happens when a request misses at CDN, then API gateway, then model server?
>
> 20 minutes.

**Target time:** 20 min design + 5 min debrief

**OpenClaw follow-up Socratic questions:**
- "What happens if a user asks the same question but with a slightly different phrasing? Is that a cache miss at the API gateway?"
  → Yes — exact string match only at gateway level. Semantic deduplication would require embedding similarity (very expensive). Generally: cache exact prompt+params only.
- "KV cache lives in VRAM — how does the CDN or gateway know whether a KV cache is available?"
  → It doesn't. The gateway routes to the model server. The model server checks its own KV cache. Different layers are decoupled.
- "What about streaming responses — can you cache a streaming response?"
  → Streaming means you're returning tokens as they're generated. You can cache the FINAL complete response (after generation finishes), then replay it as a "stream" for future identical requests. Or cache nothing and always generate. Trade-off: cache hit = fast fake stream; no cache = real stream with real latency.

**Key insight to deliver:**
> **Key insight:** Each caching layer caches a different thing. CDN: complete HTTP responses (only for deterministic, non-personalized requests). Gateway: prompt → complete response mapping (requires exact match, short TTL or event-based invalidation). KV cache: attention keys/values for a sequence (per-model-server, evicted on memory pressure). The hierarchy is: CDN saves network + compute, gateway saves model server load, KV cache saves attention recomputation. A request that's non-cacheable at the CDN (personalized) might still benefit from KV cache (if the user's conversation prefix is shared with other users via prefix caching).

---

## WEEK 16: Full Mock Simulation Week

**This week's arc:** No new concepts. Five mock rounds, each simulating a real interview segment. Tuesday and Friday mirror actual Round 1 conditions. Thursday mirrors the OA. Monday is the OA benchmark problem. Wednesday is behavioral under pushback. Saturday is a full week debrief. Sunday is a Phase 5 warm-up system design.

---

### Day 22 (Mon) — Mock Pressure Round: LRU Cache from Scratch

**Format:** Mock Pressure Round | **Key skill:** OA benchmark under Phase 4 time pressure

---

**OpenClaw opening:**
> **Day 22, Week 16 — Full Mock Week: LRU Cache from Scratch**
>
> This is the OA benchmark. You've done it before. You know what it looks like. Now do it in 30 minutes with no warm-up — because that's the OA.
>
> ```python
> class LRUCache:
>     def __init__(self, capacity: int):
>         """Initialize cache with given capacity."""
>         ...
>
>     def get(self, key: int) -> int:
>         """Return value if key exists, else -1. Updates recency."""
>         ...
>
>     def put(self, key: int, value: int) -> None:
>         """Insert or update key. If at capacity, evict least recently used."""
>         ...
> ```
>
> **Requirements:**
> - O(1) `get` and `put`
> - Thread-safe (use `threading.Lock`)
> - Doubly linked list + hash map (no OrderedDict)
> - Production quality: no memory leaks, correct eviction on both `get` and `put`
>
> Say "ready." 30 minutes. I'll tell you when 10 and 20 minutes are up.

**Target time:** 30 min

**Timer:**
- At 10 min: "20 left — do you have your DLL sentinel nodes set up? Is the `_add_to_head` / `_remove_node` implemented?"
- At 20 min: "10 left — is `put` handling the update-existing-key case? Does it move to head AND update value?"

**OpenClaw mid-session edge case (at ~20 min):**
> Edge case: `put(key=5, val=10)`, then `put(key=5, val=20)`. Does your `put` handle updating an existing key? Does it move the node to head even on update?

**Expected:** Yes — `put` to existing key must: update the value AND move to head (recency update). Same behavior as `get` for LRU tracking purposes.

**Evaluation criteria (production bar):**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| DLL with sentinels | Sentinel head and tail, no null checks in add/remove | Sentinels present but off-by-one in linking | No sentinels (edge case bugs) |
| O(1) operations | HashMap + DLL, both `get` and `put` O(1) | Correct but uses `list.remove()` (O(n)) | O(n) or incorrect |
| Thread safety | `threading.Lock`, acquired in BOTH `get` and `put` | Lock in `put` only | No thread safety |
| Update recency on get | `get` calls `_move_to_head` | `get` returns value but doesn't update order | `get` never updates order |
| Update recency on put | Existing key: update value + move to head | New key only: doesn't handle update | Missing update path |
| Eviction | Removes from tail (LRU end), removes from dict | Evicts from tail but dict not updated | Evicts nothing or wrong end |

**Pass:** 5/6 criteria.
**Conditional Pass:** 4/6, with the gap being a fixable bug (e.g., missing update-existing-key recency move).
**Fail:** O(n) operations OR no thread safety AND no plan to add it OR eviction broken.

**Key insight to deliver:**
> **Key insight:** The update-existing-key case is the most commonly missed correctness bug. When `put(key, val)` receives a key that already exists: you must (1) update the value in the existing node, (2) move it to head (recency update). If you only delete + re-insert, you still get correct behavior — but you create a new node, so old pointer in the map still works. Either approach is fine; inconsistency (updating value but not moving to head, or moving to head but not updating value) is the bug. Check BOTH paths explicitly.

---

### Day 23 (Tue) — Mock Pressure Round: Full Web Crawler

**Format:** Mock Pressure Round | **Key skill:** Round 1 complete simulation

---

**OpenClaw opening:**
> **Day 23, Week 16 — Full Mock Week: Web Crawler (Round 1 Simulation)**
>
> This is Round 1. I'm playing the interviewer. You're building a production web crawler from scratch. I'll ask you clarifying questions mid-session, throw edge cases, ask "why" — just like the real thing.
>
> **Starting spec (same as week 13, no extra hints):**
>
> "Build a web crawler. Start URL, crawl up to depth D, avoid revisiting URLs, limit concurrent fetches to K, handle redirects safely. Fetch stub provided: `async def fetch_page(url: str) -> tuple[str, list[str], str|None]`. Returns (content, links, redirect_or_None)."
>
> Plan out loud for 3 minutes, then start coding.
>
> Clock starts now.

**Target time:** 30 min

**OpenClaw interviewer behaviors (internal — deploy these mid-session):**
- At 8 min: "Why BFS and not DFS? Walk me through the trade-off."
- At 15 min: "What about robots.txt? Does your crawler respect it?" (They haven't implemented it — the point is their response: "Good catch — I'd add a robots.txt check before enqueuing URLs from a domain. I haven't implemented that yet. Want me to add it?")
- At 22 min: "A page takes 30 seconds to respond. Does your crawler hang?" (Should have `asyncio.wait_for` or similar)
- At 28 min: "What if the same normalized URL appears via two different paths before either fetch completes? Walk me through your deduplication."

**Evaluation (Round 1 bar):**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Core crawl | BFS, visited-on-enqueue, depth tracking | Works but visited-on-dequeue | No BFS |
| URL normalization | Handles http/https, trailing slash, relative URLs | 2/3 handled | No normalization |
| Concurrency | asyncio.Semaphore with correct placement | Semaphore present, wrong scope | Sequential only |
| Redirect handling | Per-request chain + max hops | Relies on global visited only | No redirect handling |
| Live edge cases | Responds to interviewer prompts without stopping | Addresses 2/3 prompts | Freezes or ignores |
| robots.txt awareness | Mentions it even if not implemented | N/A | Blank stare at mention |

**Pass:** 5/6 criteria.
**Conditional Pass:** 4/6 AND addresses robots.txt and timeout when prompted.
**Fail:** < 4/6 OR completely unable to handle live prompts.

**Key insight to deliver:**
> **Key insight:** Round 1 is less about writing perfect code and more about responding to live complexity. The interviewer adds requirements deliberately: "now add robots.txt," "what about 30-second timeouts" — they want to see how you handle changing scope mid-implementation. The skill: keep the working base, layer on the new requirement with minimal disruption, explain your approach. Interviewers have told candidates they passed even with a bug in their code because they demonstrated strong reasoning and adaptability.

---

### Day 24 (Wed) — Behavioral Story Practice: All Stories + Pushback

**Format:** Behavioral Story Practice | **Key skill:** Behavioral rehearsal + pushback handling

---

**OpenClaw opening:**
> **Day 24, Week 16 — Behavioral: Full Rehearsal**
>
> Three stories, back to back, no pause between them. Then I push back on one. Here are the three questions:
>
> 1. "Walk me through a significant technical decision you made with limited information."
> 2. "Describe a production incident you owned from start to finish."
> 3. "Tell me about a time you chose the simpler option over the technically comprehensive one."
>
> You have 90 seconds per story — tight, specific, on-point. Then I pick one and push back. Go.

**Target time:** 25 min (5 min × 3 stories + 10 min pushback drill)

**OpenClaw timing (internal):**
- After story 1 (90 sec target): if under 60 sec, "That was short — add the outcome. What specifically was better?" If over 2 min, "You went long — the target is 90 seconds. What's the 30-second version?"
- After all three: select the weakest story for pushback.

**Pushback scenarios (pick one based on the story):**
- On decision story: "Looking back, that turned out to be the wrong call — the more complex approach would have scaled better. Was it actually right to go simple?"
- On incident story: "Your team actually caught this before you did — you were the last to know the root cause. How does that change your story?"
- On simplicity story: "The simpler approach is now causing pain — customers are asking for the flexibility you deliberately didn't build. Was it worth it?"

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Story 1: specificity | Specific decision, named alternatives, outcome with number | Specific decision, vague outcome | Generic, no specifics |
| Story 2: debugging process | Step-by-step, ordered, clear root cause | Root cause clear, process vague | "We figured it out" |
| Story 3: simplicity rationale | Clear trade-off articulated, specific | Chose simple but can't fully explain why | "Simple is better" with no reasoning |
| Pushback response | Held position with logic OR updated with clear new info | Partially held, partially caved | Immediately caved with no logic |
| 90-sec discipline | All stories roughly 90 seconds | 1–2 go long, corrects when reminded | No sense of time |

**Key insight to deliver:**
> **Key insight:** Pushback in behavioral rounds is a test of calibration, not stubbornness. The right response to "was it actually right?" isn't always "yes" — sometimes the correct answer is "actually, in retrospect, I'd make a different call because X." What fails is: immediate capitulation with no reasoning ("you're right, I was wrong"), or stubborn refusal to consider the alternative ("it was definitely correct"). Show them you reason from evidence, not from ego or social pressure.

---

### Day 25 (Thu) — Mock Pressure Round: Task Management System Full

**Format:** Mock Pressure Round | **Key skill:** OA Problem 2 complete simulation

---

**OpenClaw opening:**
> **Day 25, Week 16 — Full Mock Week: Task Management System (OA Simulation)**
>
> 30 minutes. Full TaskSystem — all features from scratch. Production quality.
>
> ```python
> class TaskSystem:
>     # create_task, add_dependency (with cycle detection), start_task,
>     # complete_task, cancel_task (with cascade), get_status
>     # Full spec from Week 14 — no hints, no reference.
> ```
>
> I will ask you one clarifying question mid-session. Say "ready."

**Target time:** 30 min

**OpenClaw mid-session question (at ~15 min):**
> Clarifying question: if I call `cancel_task("X")` and X is already CANCELLED — what do you return? Empty list, an error, or the set of tasks that WOULD have been cancelled?

**Expected answer (best):** Empty list — X was already cancelled, nothing newly cancelled. Idempotent no-op.

**Timer:** Standard 10/20/30 marks.

**Evaluation (condensed — same criteria as Day 12 but faster evaluation):**

Pass bar: Cycle detection correct (including self-loops), cascade via BFS traversing through COMPLETED nodes, all state transitions validated, idempotency handled.

Conditional Pass: Cycle detection correct, cascade missing the "traverse-through-COMPLETED" subtlety but acknowledges the bug when pointed out.

Fail: Cycle detection broken OR cascade stops traversal at COMPLETED (cascades incorrectly).

**Key insight to deliver:**
> **Key insight:** Two weeks ago this problem was new. Today you built it in 30 minutes. That's Phase 4 working. The goal isn't "know TaskSystem by heart" — it's "can I apply DAG + BFS + state machine thinking to any problem that has this shape?" Next time they give you a DAG-with-cascade problem in an unfamiliar domain, you'll recognize the shape and execute.

---

### Day 26 (Fri) — Mock Pressure Round: Stack Profiler Full

**Format:** Mock Pressure Round | **Key skill:** Round 4 simulation under cumulative fatigue

---

**OpenClaw opening:**
> **Day 26, Week 16 — Full Mock Week: Stack Profiler (Round 4 Simulation)**
>
> Day 5 of the mock week. You're tired. That's the point — Round 4 comes after a full day of interviews.
>
> The unfamiliar domain framing: "We have a sampling profiler that captures stack snapshots at 10ms intervals. We want to convert these snapshots into a flame graph. Step 1: convert snapshots to trace events — ENTER/EXIT with correct ordering, handling recursive functions."
>
> Same implementation. Different framing. You need to recognize it.
>
> 30 minutes. No reference to earlier sessions. Implement it fresh.
>
> Say "ready."

**Target time:** 30 min

**OpenClaw interviewer behaviors:**
- At 5 min: "Before you code — what's the core algorithmic operation here? What are you diffing?"
- At 15 min: "What if the same function appears twice in the stack? Walk me through your approach."
- At 25 min: "What's the time complexity of your solution? Per transition?"

**Expected answers:**
- At 5 min: "I'm comparing consecutive stack snapshots. For each pair, I find which frames exited (in prev but not curr) and which entered (in curr but not prev), maintaining position-based identity."
- At 15 min: "Same function at two positions = two separate calls. I track by position, not name — find first divergence point, exit everything to the right of it reversed, enter everything to the right in order."
- At 25 min: "O(n) per transition where n is the stack depth. Finding divergence is O(min(prev, curr)). Slicing and reversing is O(n). Total for all transitions: O(S × N) where S is number of sample pairs and N is max stack depth."

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| Domain recognition | Recognizes as "position-based diff" within 3 min | Recognizes after 5-min prompt | Never recognizes, codes set-based |
| Core algorithm | Divergence point, correct slicing | Works for non-recursive, breaks on recursion | Set-based (fundamentally wrong) |
| Recursion | Handles `["fib", "fib"]` correctly | Mentions it but implementation wrong | Not handled |
| Complexity | O(n) per transition, can state it | Correct solution, can't state complexity | O(n²) or can't analyze |
| Fatigue resilience | Clean, focused, doesn't over-engineer | Minor sloppiness but recovers | Paralyzed or spiral |

**Pass:** 4/5 criteria.
**Conditional Pass:** 3/5 OR recognizes recursion issue but doesn't have time to fix fully.
**Fail:** Set-based approach AND doesn't recognize the recursion bug when shown the test case.

**Key insight to deliver:**
> **Key insight:** Round 4 is designed to test how you perform when your cognitive reserves are depleted. The domain is unfamiliar ON PURPOSE. The interviewers aren't testing your knowledge of profilers — they're testing your decomposition process under pressure. The candidates who pass Round 4 are the ones who slow down when they're tired (not speed up), take 3 extra minutes to decompose before touching code, and apply first-principles thinking rather than pattern-matching. Today you did it. That's the proof.

---

### Day 27 (Sat) — Review & Reflect: Full Mock Week Debrief

**Format:** Review & Reflect | **Key skill:** Phase 4 progress assessment; naming the pattern of failures

---

**OpenClaw opening:**
> **Day 27, Week 16 — Full Mock Week Debrief**
>
> Let's debrief the whole week. For each of the five mocks, I need a verdict and your key observation:
>
> **Rate each mock:**
> - **Pass:** Would satisfy Anthropic's bar
> - **Conditional Pass:** Core correct, one fixable bug or missed edge case
> - **Fail:** Core issue (wrong algorithm, missing key feature, broken on basic cases)
>
> **The five mocks:**
> 1. LRU Cache from scratch (Monday)
> 2. Full web crawler (Tuesday)
> 3. Task Management System (Thursday)
> 4. Stack profiler (Friday)
>
> Rate each. Then: is there a PATTERN to the failures? What broke consistently?

**Target time:** 20 min

**OpenClaw debrief logic (internal):**

Listen for self-assessment accuracy. Then layer on honest external assessment based on the week's actual performance.

**Pattern questions to ask based on common failure modes:**
- If LRU was the weakest: "Is it the DLL mechanics or the thread safety that keeps tripping you? Those need different practice."
- If behavioral was rough: "Were you caving to pushback or just slow on specifics? Caving = different fix than vague stories."
- If stack profiler struggled: "Did you recognize the position-based insight yourself, or did you need a prompt? That's the signal to watch."
- If all passed: "Great. Phase 5 starts soon. The bar shifts: 'conditional pass' isn't enough — it needs to be 'pass' consistently."

**Phase 4 gate check:**

**To advance to Phase 5:** At least 3 of 4 mocks rated "conditional pass" or better. Behavioral: all 3 stories with specific details, held position on at least one pushback.

**If gate not met:**
> "Not quite at the Phase 5 bar yet. Here's what we'll do: one more week at Phase 4 intensity. We'll repeat Week 15's pattern with harder variants of the sessions where you fell short. The goal: 3 consecutive mocks at conditional pass before advancing. You're close."

**If gate is met:**
> "Phase 5 starts Monday. The shift: 3 mocks per week instead of 2, behavioral becomes a full HM simulation, and the problems get harder — not different, just with less time and more live edge cases. You've earned it."

---

### Day 28 (Sun) — Mini System Design: Full Inference API (Phase 5 Warm-Up)

**Format:** Mini System Design | **Key skill:** End-to-end system design speed; Phase 5 warm-up

---

**OpenClaw opening:**
> **Day 28, Week 16 — Mini System Design: Full Inference API**
>
> Phase 5 warm-up. Design the complete LLM inference API in 30 minutes — HTTP to streaming token. Cover all four areas:
>
> 1. **Request ingestion:** HTTP endpoint, auth, validation, request normalization
> 2. **Queuing:** How requests wait, priority, what to do when queue is full
> 3. **GPU batching:** How requests batch, when to flush, KV cache interaction
> 4. **Streaming response:** How tokens get from GPU to client, backpressure
>
> I'll ask one follow-up after each area. Go.

**Target time:** 30 min (7 min per area + 2 min transitions)

**OpenClaw follow-up questions (Socratic — one per area):**

Area 1: "What does request normalization include? Give me a concrete example of something you normalize."
→ Trimming whitespace, normalizing Unicode, capping max tokens to server limit, validating temperature/top-p ranges.

Area 2: "Your queue is full. You have three options: reject with 429, put the request in a longer overflow queue, or drop the oldest request. Which do you pick and why?"
→ Best: reject with 429 + Retry-After header. Dropping oldest is terrible UX. Long overflow queue hides the problem. 429 with clear retry guidance is honest and gives clients the ability to backoff intelligently.

Area 3: "Continuous batching: a batch is generating tokens. A new high-priority request arrives. What happens?"
→ It joins the next batch iteration (continuous batching allows joining mid-generation). It doesn't preempt current requests — preemption would waste their KV cache. It waits one iteration, then joins.

Area 4: "A client connects for streaming but stops reading for 15 seconds — their TCP buffer fills up. What happens to the GPU?"
→ Backpressure: the GPU keeps generating tokens, but the send buffer fills up. Eventually `write()` blocks. If you have async sending, `asyncio.StreamWriter.write()` will buffer until the client catches up. You need to check `writer.transport.get_write_buffer_size()` and pause generation if the buffer is too large. Or use a timeout: if client doesn't drain in N seconds, close the connection and abort generation.

**Evaluation:**

| Criterion | Pass | Conditional Pass | Fail |
|-----------|------|-----------------|------|
| All 4 areas covered | Complete, connected | 3/4 areas with depth | 2 or fewer |
| Queuing strategy | 429 on full + Retry-After | Acknowledges trade-offs, picks one | "Just wait" with no detail |
| Batching + KV | Continuous batching, KV cache interaction | Batching correct, KV mentioned | Static batching only |
| Streaming backpressure | TCP buffer → backpressure → pause or timeout | Streaming described, backpressure vague | No streaming detail |
| Follow-up responses | Defends choices under follow-up | Partly defends | Caves immediately |

**Key insight to deliver:**
> **Key insight:** This system design has exactly one right answer for autoscaling: queue depth weighted by token count, not raw GPU utilization. And exactly one right answer for full-queue handling: 429 with Retry-After, not silent queuing or dropping. And exactly one right answer for batching: continuous batching, not static. These aren't opinions — they're the answers Anthropic's team built and knows to be correct. Knowing the "right" answers here, and being able to defend them, is what separates a "generic system design pass" from "this person understands LLM inference."

---

## Phase 4 Exit Assessment

**Administered by OpenClaw at end of Day 27 (or after the gate is met).**

### Phase 4 → Phase 5 Gate Criteria

**Mocks (must have all):**
- [ ] LRU Cache from scratch: Conditional Pass or better
- [ ] Web Crawler (full): Conditional Pass or better
- [ ] Task Management System (full): Conditional Pass or better
- [ ] Stack Profiler (full): Conditional Pass or better (3 of 4 minimum)

**Behavioral:**
- [ ] 3 STAR stories with specific numbers, names, outcomes
- [ ] Held position (or updated with clear logic) on at least one pushback
- [ ] All 3 delivered in ~90 seconds each

**System Design:**
- [ ] Can cover all 4 inference API areas (request → queue → batch → stream) without prompting
- [ ] Gives correct answer on full-queue handling (429 + Retry-After)
- [ ] Can explain continuous batching vs static batching without notes

**If all criteria met:**
> Phase 5 begins Monday. The format intensifies: 3 mocks per week, behavioral under full HM simulation, random problem selection for resilience. You've built all the skills. Phase 5 is about making them reliable under every condition.

**If gate not met:**
> One more week at Phase 4 intensity before Phase 5. We'll target specifically the criteria that didn't pass. Come back to this gate at end of next week.

---

## Phase 4 Key Skills Summary

By the end of Phase 4, these should be muscle memory:

| Skill | Evidence |
|-------|---------|
| Web crawler (full) | Built in < 30 min with concurrency, redirect safety, URL normalization |
| Task Management System | Built in < 30 min with cycle detection, cascade via BFS, idempotency |
| Stack profiler | Built in < 30 min with position-based tracking, recursion handled |
| LRU Cache from scratch | Built in < 30 min, thread-safe, production quality |
| Behavioral stories | 3 stories, specific, hold position on pushback |
| Inference API design | Cover all 4 areas unprompted, defend autoscaling signal choice |
| Live edge cases | Respond to mid-session curveballs without stopping the implementation |
| Plan before code | 3–5 minute plan on any new problem before touching code |
