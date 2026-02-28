# Analysis Frontier — Daily Interview Practice

## Statistics
- Total aspects discovered: 16
- Analyzed: 16
- Pending: 0
- Convergence: 100% ✓ CONVERGED

## Pending Aspects (ordered by dependency)

### Wave 1: Interview Requirements Extraction
- [x] interview-anatomy — Break down every round of the Anthropic SWE interview: skills tested, format, evaluation criteria, examples
- [x] skill-taxonomy — Create complete taxonomy of discrete trainable skills across all interview rounds
- [x] current-level-diagnostic — Design 10-15 diagnostic exercises to assess current level across all skill categories
- [x] practice-session-formats — Design the different 30-minute session types (Code Kata, Spec Decomposition, Mini System Design, etc.)

### Wave 2: Curriculum Design (depends on Wave 1)
- [x] progression-map — Design 7-phase progression from diagnostic to interview-ready (~20 weeks)
- [x] weekly-templates — Design weekly session templates for each phase (which format on which day)
- [x] problem-bank-design — Design problem bank structure, sourcing, format; write example problems per category
- [x] progress-tracking-design — Design how OpenClaw logs sessions, tracks streaks, triggers phase advancement

### Wave 3: Curriculum Generation (depends on Wave 2)
- [x] phase-0-content — Generate complete Phase 0 (Diagnostic, Days 1-3) session content
- [x] phase-1-content — Generate Phase 1 (Foundations, Weeks 1-4) — 28 daily sessions
- [x] phase-2-content — Generate Phase 2 (Pattern Building, Weeks 5-8) — 28 daily sessions
- [x] phase-3-content — Generate Phase 3 (System Thinking, Weeks 9-12) — 28 daily sessions
- [x] phase-4-content — Generate Phase 4 (Integration, Weeks 13-16) — 28 daily sessions + mock interviews
- [x] phase-5-content — Generate Phase 5 (Sharpening, Weeks 17-20) — 28 daily sessions + full mocks
- [x] phase-6-template — Generate Phase 6 (Maintenance, ongoing) — repeating weekly template

### Wave 4: OpenClaw Integration & Output (depends on Wave 3)
- [x] practice-guide — Generate the complete OpenClaw practice guide entity at entities/projects/daily-interview-practice.md
- [x] openclaw-skill-prompt — Write the OpenClaw skill prompt for delivering daily sessions
- [x] convergence-review — Final review: is the curriculum complete, realistic, and actionable?

## Recently Analyzed
- [x] interview-anatomy — Detailed breakdown of all 5 rounds: OA (LRU Cache + Task DAG), Coding Round 1 (async web crawler), System Design (LLM inference API), Coding Round 2 (stack profiler), Hiring Manager. Cross-cutting skills identified: concurrency, edge cases, production quality, simplicity. Pass/fail criteria documented for each round.
- [x] skill-taxonomy — 50+ discrete skills catalogued across 8 categories (Python Fluency, Concurrency, Data Structures, Algorithms, System Design, HTTP/Networking, Under-Pressure Execution, Communication). Priority tiers assigned: 10 CRITICAL skills, ~15 HIGH. Multi-round multiplier table identifies highest-ROI training targets. 5-tier trainability framework maps each skill to training approach.
- [x] current-level-diagnostic — 15 diagnostic exercises across 3 days (Python/DS, Concurrency/Algos, Systems/Communication). Each exercise has 1-5 scoring rubric, target time, follow-up prompts, and OpenClaw delivery instructions. Level mapping: 15–75 pts → Beginner/Developing/Intermediate/Advanced/Interview-Ready. Per-category gap flags (CONCURRENCY-GAP, ASYNCIO-GAP, etc.) guide Phase 1 customization.
- [x] practice-session-formats — 9 session formats designed: Code Kata, Spec Decomposition, Mini System Design, Debug & Read, SQL Challenge, Mock Pressure Round, Review & Reflect, Concept Deep Dive, Behavioral Story Practice. Each has timing breakdown, OpenClaw delivery instructions, sample problem libraries, and phase-frequency table. Cross-format principles: Socratic coaching, "I don't know" handling, edge-case-mid-session drilling, "explain it to me" close.
- [x] weekly-templates — Fully specified day-by-day sessions for all 6 phases (20 individual weeks + Phase 6 maintenance). Each session has format, topic, and key skill. Phase 1: 4 Code Katas + 1 SD + 1 RR + 1 DR per week. Phase 2: 3 CK + 1 SQL + 1 MPR + 1 RR + rotating MS/DR. Phase 3: 2 CD + 2–3 MS + CK/SQL + MPR + RR. Phase 4: 2 MPR + SD + BS + CK/SQL + RR + MS. Phase 5: 3 MPR + 2 BS + targeted weak-area + RR + rest. Phase 6: 6-week skill rotation with monthly re-diagnostic + interview ramp-up protocol.
- [x] progress-tracking-design — Two-level entity structure: project entity (current state) + meeting entities (session logs per day). Meeting entity schema: phase/day/format/topic/key_skill/time_spent_min/self_assessment/verdict/gap_flags_triggered. Verdict: pass/conditional-pass/fail/not-applicable. Streak tracking with milestones at 7/14/30/50/100 days. Phase advancement: 3-of-4 MPR conditional-pass threshold + early advancement on 5-day 4+/5 self-assessment trend. Weekly Sunday summary format. Trend analysis signals: category drift, verdict rolling avg, time-to-complete slope, gap flag resolution. Commit convention: `bot: interview practice day NNN — FORMAT: topic-slug`. OpenClaw open/close protocol and full YAML schema for project entity fields.
- [x] phase-0-content — Full OpenClaw executable scripts for all 3 diagnostic days at analysis/curriculum/phase-0-diagnostic.md. Each exercise has verbatim prompt, 1-5 scoring rubric, follow-up questions, score-tiered feedback templates, and transition lines. Includes complete scoring + level determination logic, gap flag triggering (5 flags), level → starting phase table, slower pace note for score < 30, verbatim result message template, and delivery principles appendix.
- [x] phase-2-content — 28 fully-scripted daily sessions at analysis/curriculum/phase-2-patterns.md. Week 5: topological sort (Kahn's with cycle detection), asyncio event loop mental model, two-pointer, SQL aggregation + LIMIT, BFS maze solver MPR, rate limiter MS. Week 6: asyncio.gather, asyncio.Semaphore (the web crawler pattern), sliding window (fixed + variable), SQL HAVING with error rates, thread-safe rate limiter MPR, sequential-asyncio bug DR. Week 7: binary search on answer space, prefix sums + hashmap subarray counting, leaderboard SD, SQL window functions (running totals), heapq task scheduler MPR, message queue MS. Week 8: lazy deletion in heapq (mutable priorities), asyncio.Queue producer-consumer, config diff SD, p95 SQL with PERCENTILE_CONT, async web crawler MPR (Phase 2 exit benchmark), crawl dedup/normalization RR, topological sort silent cycle bug DR. Phase 2 exit gate: asyncio.Semaphore from memory, topo sort <12 min, pattern ID within 2 min, SQL window function correct, 2/4 mocks conditional-pass+. Pattern recognition trigger table included.
- [x] phase-1-content — 28 fully-scripted daily sessions at analysis/curriculum/phase-1-foundations.md. Week 1: DLL (insert/remove/sentinel) + threading (Lock, thread-safe counter/stack). Week 2: LRU Cache (OrderedDict version + edge cases + thread-safe wrapper + producer-consumer). Week 3: LRU from scratch (Part 1 DLL layer + Part 2 dict+DLL integration) + BFS canonical + thread-safe from-scratch LRU. Week 4: DFS recursive + 3-color cycle detection + URL parser spec + threading.Condition producer-consumer + Phase 1 exit assessment (LRU from scratch, 15-min target). Every session has: OpenClaw verbatim opening, kata/spec/code prompt, 10-min check-in, evaluation guide with pass/fail criteria and common bugs, Socratic feedback approach, mid-session edge case throws, key insight delivery, stretch question, and next-day preview. Phase 1 → Phase 2 gate criteria and slower pace protocol included.
- [x] phase-3-content — 28 fully-scripted daily sessions at analysis/curriculum/phase-3-systems.md. Week 9: autoregressive generation + KV cache mental model (CD), KV cache manager design (MS), async generator token streaming (CK), KV cache eviction policies (MS), LRU OA benchmark MPR, RR, PERCENTILE_DISC SQL. Week 10: continuous batching (CD), dynamic batching scheduler (MS), prefix caching (CD), PagedAttention/VRAM paging (MS), async crawler with timeout MPR, RR (CancelledError cleanup), fixed-window burst bug DR. Week 11: autoscaling signals — queue depth × token count (CD), inference queue design with starvation prevention (MS), asyncio.Queue+heapq priority (CK), streaming/backpressure (MS), mini in-memory DB MPR, RR (bisect trade-offs), cohort retention SQL. Week 12: priority aging (CD), full inference API end-to-end synthesis (MS), caching strategy taxonomy (MS), async token bucket (CK), self-selected exit MPR, Phase 3 5-question self-assessment RR, KV cache priority inversion DR. Phase 3 exit criteria: 5 key concepts unprompted, exit mock conditional-pass+, full oral gate.

## Discovered Aspects
(None yet)
