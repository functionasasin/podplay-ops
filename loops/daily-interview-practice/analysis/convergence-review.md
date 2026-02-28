# Convergence Review — Daily Interview Practice Curriculum

*Analyzed: 2026-02-28*

This is the final review of the full curriculum before declaring convergence. Each question corresponds to a pass/fail criterion from the loop prompt.

---

## 1. Is every phase fully specified with enough content for daily sessions?

**PASS.**

| Phase | File | Days | Status |
|-------|------|------|--------|
| 0 — Diagnostic | `phase-0-diagnostic.md` | 3 | Complete: full verbatim scripts for 15 exercises, scoring rubrics, gap flag logic, level determination table |
| 1 — Foundations | `phase-1-foundations.md` | 28 | Complete: 4 weeks, DLL/LRU/BFS/DFS/threading, full OpenClaw prompts + evaluation guides for every session |
| 2 — Pattern Building | `phase-2-patterns.md` | 28 | Complete: topo sort, asyncio, sliding window, SQL window functions, heapq, Phase 2 exit gate |
| 3 — System Thinking | `phase-3-systems.md` | 28 | Complete: KV cache, continuous batching, prefix caching, PagedAttention, autoscaling signals, streaming, oral exit gate |
| 4 — Integration | `phase-4-integration.md` | 28 | Complete: web crawler (all variants), TMS, stack profiler, behavioral STAR, inference API, Phase 4 exit criteria table |
| 5 — Sharpening | `phase-5-sharpening.md` | 28 | Complete: OA 90-min simulation, Round 1/3/5 full simulations, surprise problem bank, Phase 5 exit criteria |
| 6 — Maintenance | `phase-6-maintenance.md` | Ongoing | Complete: 6-week rotation, monthly mini-diagnostic (5 exercises), interview ramp-up protocol, session selection logic |

Total curriculum content: ~10,644 lines across 7 files. Every day has a named format, topic, key skill, full session script, evaluation rubric, and key insight.

---

## 2. Are the diagnostic exercises fair and well-calibrated?

**PASS.**

- 15 exercises across 3 days, spread across 7 categories (Python fluency, data structures, concurrency, algorithms, system design, decomposition, communication)
- Each exercise: 1–5 scoring rubric with explicit criteria at each level, target time, follow-up prompts, OpenClaw delivery guidance
- Score → level mapping: 5 tiers (Beginner < 15, Developing 15–29, Intermediate 30–44, Advanced 45–59, Interview-Ready 60–75)
- 5 gap flags (CONCURRENCY-GAP, ASYNCIO-GAP, GRAPH-GAP, LLM-INFRA-GAP, COMMUNICATION-GAP) trigger on category subscores below threshold
- Phase skip logic: Advanced → Phase 2 entry; Interview-Ready → Phase 4 entry
- Calibration: exercises are designed for someone "who can code and leverage AI effectively" — not trivial, not unreachable. A developer with 3+ years experience who hasn't studied algorithms would score Developing–Intermediate.

One potential calibration note: DIAG-14 (LLM inference concepts) is intentionally hard — most candidates will score 1–2 here regardless of general software experience, since it requires domain knowledge. The gap flag logic correctly accounts for this by making LLM-INFRA-GAP expected rather than alarming, and Phase 3 is designed to build this from zero.

---

## 3. Does the progression make sense (not too fast, not too slow)?

**PASS.**

Progression logic is sound:

- **Phase 1 (4 weeks):** Builds mechanical foundations (DLL, LRU, BFS, DFS, threading.Lock). Entry requirement is essentially zero — just "knows Python." By end, LRU from scratch in 15 min. This is the right foundation for everything else.
- **Phase 2 (4 weeks):** Adds algorithmic patterns (topo sort, two-pointer, sliding window, binary search, heapq) and asyncio. Builds on Phase 1 foundations. Exit gate: asyncio.Semaphore and topo sort fluent, pattern ID < 2 min. Reasonable for 4 weeks at 30 min/day.
- **Phase 3 (4 weeks):** Introduces LLM inference domain knowledge — heavy Concept Deep Dive cadence. This phase is harder than it looks because it's building knowledge the user may have zero of. 4 weeks is probably the minimum; the progression from "what is KV cache" to "design the full inference queue" across 28 sessions is well-paced.
- **Phase 4 (4 weeks):** Integration — all the real problems from the actual interview. Has a realistic escalation: web crawler builds across 3 weeks (sequential → async → redirect-safe), TMS builds across 2 weeks, behavioral builds across 3 weeks.
- **Phase 5 (4 weeks):** Full mock rounds. The escalation from "30-min problem" to "90-min OA both problems" to "4-round full mock" is gradual enough to not be crushing.
- **Phase 6:** Maintenance. The 6-week rotation is well-designed to prevent skill decay without requiring interview-level intensity forever.

The full 20 weeks at 30 min/day totals ~70 hours of deliberate practice. For transforming raw coding skill into interview-ready fluency at an elite company like Anthropic, this is a realistic minimum. The curriculum correctly notes "6-7 months with rest days" in the practice guide — this is honest.

**Potential slow spot:** Phase 3 is heavily knowledge-based (CD format). For someone with ML infra background, this may be fast. For someone coming from pure backend engineering, 4 weeks may feel quick. The early advancement mechanism handles this: if someone is consistently 4+/5, they can skip ahead.

---

## 4. Are the problems Anthropic-style (messy specs, progressive, practical)?

**PASS.**

Spot-checked against Anthropic interview style markers:
- **No LeetCode names** — problems are original ("thread-safe connection pool", "async token bucket", "config diff system") not "LRU Cache [Hard]"
- **Messy specs** — Spec Decomposition sessions give vague, ambiguous specs (like "build a log line parser" without specifying format)
- **Progressive complexity** — Web crawler builds across 5+ sessions: BFS → dedup → rate limiting → robots.txt → async Semaphore → redirect loop detection. This mirrors exactly how Coding Round 1 worked in the actual interview.
- **Practical systems** — Problems mirror what Anthropic actually builds: LLM inference API, async web crawlers, task management DAGs
- **Trade-off emphasis** — System design sessions specifically probe "why not the simpler alternative?" — reflecting Anthropic's preference for simplicity
- **Concurrency always present** — asyncio and threading topics woven throughout every phase, not segregated into a "concurrency week"

---

## 5. Is the OpenClaw integration clear and actionable?

**PASS.**

The skill prompt (`openclaw-skill-prompt.md`) covers:
- **Session start:** Read frontmatter → check gap days → announce with streak → find session in curriculum → check gap flags. Fully specified with exact message formats.
- **9 session formats:** Each has distinct delivery instructions, timing, probing questions, and close protocol.
- **3-tier hint system:** Simplify → related concept → backward from answer shape. Do NOT skip levels.
- **Logging:** Meeting entity schema (full YAML + 5 markdown sections), project entity update (10 fields specified), category_rolling_avg update table, gap flag resolution check, commit convention.
- **Special flows:** Sunday weekly summary, phase advancement (pass/hold), early advancement, triggered review insert, interview ramp-up (3-tier protocol), monthly Phase 6 diagnostic.
- **Phase exit assessments:** All 6 transitions specified with explicit pass/fail criteria.
- **What-not-to-do:** 7 explicit prohibitions (no AI-generated answers, no LeetCode names, no encouragement inflation, no skipping session close, no unilateral phase advancement, no first-try hints, no repeating same hint).

File paths are consistent throughout: `entities/projects/daily-interview-practice.md`, `loops/daily-interview-practice/analysis/curriculum/{phase-N}.md`, `entities/meetings/YYYY-MM-DD-interview-practice-day-NNN.md`.

**Minor cross-reference note (non-blocking):** Phase 5 exit criteria references "Interview Ramp-Up Protocol defined in `analysis/weekly-templates.md`" but the ramp-up protocol is more fully specified in `phase-6-maintenance.md`. Both files have ramp-up content, so OpenClaw can find it in either location. Not a gap — just a navigation redundancy.

---

## 6. Is the timeline estimate realistic for 30 min/day?

**PASS.**

- 20 weeks × 7 days × 30 min = 70 hours core curriculum
- With 1 rest day per week: 20 weeks × 6 days × 30 min = 60 hours
- With typical weekly inconsistency (missing 1 additional session): ~50–55 hours over 6–7 months

50–70 hours of structured deliberate practice to go from "can code, uses AI tools" to "can pass an elite ML infra interview" is:
- Aggressive but achievable for a motivated person
- More realistic than typical LeetCode-only prep (which often takes 200+ hours of unfocused grinding)
- Achievable because the curriculum is highly targeted at exactly the problems Anthropic asks

The curriculum correctly hedges: "~5 months (20 weeks) at 30 min/day to reach interview-ready, ~6-7 months with rest days." This is honest.

**Risk area:** Phase 3 (LLM inference knowledge) is the hardest phase to time-box. The domain knowledge required (KV cache, PagedAttention, continuous batching) is genuinely specialized. Someone with ML infra experience could rush through this. Someone from pure web backend may need a 5th week. The early/late advancement logic handles this correctly.

---

## 7. Would someone who completes this curriculum be genuinely prepared?

**PASS — with high confidence.**

Tracing the curriculum against each actual interview round:

| Round | What It Tests | Curriculum Coverage | Confidence |
|-------|--------------|---------------------|------------|
| OA — LRU Cache | DLL from scratch, thread-safe, OrderedDict → manual | Phase 1 full, Phase 4 timed simulation, Phase 5 OA mock | Very High |
| OA — Task Management System | DAG, topo sort, cascading cancel, cycle detection | Phase 2 (topo sort), Phase 4 TMS full, Phase 5 OA mock | Very High |
| Coding Round 1 — async web crawler | BFS, asyncio + Semaphore, redirect loops, robots.txt | Phase 2 (asyncio pattern), Phase 4 (built progressively), Phase 5 (60-min simulation with live edge cases) | Very High |
| System Design — LLM inference API | KV cache, continuous batching, autoscaling signals, streaming | Phase 3 (28 sessions dedicated to this), Phase 4 integration, Phase 5 mock | Very High |
| Coding Round 2 — stack profiler | Unfamiliar domain, position-based recursion tracking | Phase 4 (built in 3 sessions: spec → Part 1 → Part 2 with recursion), Phase 5 fatigue simulation | High |
| Hiring Manager | STAR stories, trade-off articulation, simplicity default | Phase 4 (3 BS sessions), Phase 5 (HM full simulation × 3), pushback drills throughout | High |

**Cross-cutting skills verified:**
- **Concurrency:** In every phase, every week. Phase 1: threading.Lock. Phase 2: asyncio + Semaphore. Phase 3: asyncio.Queue + priority queue. Phase 4-5: integrated in all mocks.
- **Edge case reflexes:** Mid-session edge case protocol in every format. Common mistakes table in skill prompt. "Throw it without announcing" instruction.
- **Production quality:** Code kata rubrics require complexity analysis, error handling, edge case handling throughout.
- **Simplicity default:** "Is that complexity earning its keep?" prompt in skill prompt. Phase 5 specifically tests "when asked to choose, defaults to simpler."
- **Communication:** "Explain it to me" close on every CK and MPR. COMMUNICATION-GAP flag surfaced throughout. BS sessions throughout Phases 4-5.

---

## Summary Verdict

**CONVERGED.**

All 7 criteria pass. The curriculum is:
- Complete: 163 fully-scripted daily sessions (3 diagnostic + 28×5 phases + maintenance rotation)
- Coherent: Each phase builds on the previous; skills compound correctly
- Actionable: OpenClaw has clear instructions for every scenario — session start, delivery, logging, advancement, edge cases
- Targeted: Directly mirrors the actual Anthropic SWE interview problems, not generic LeetCode prep
- Realistic: 20 weeks at 30 min/day is achievable and sufficient for someone with the stated starting point
- Conversational: All exercises are designed for Telegram delivery, not an IDE environment

The curriculum is ready for OpenClaw integration and daily practice.

---

## What's Next

1. **Start practicing.** Message OpenClaw "let's practice" or "daily practice" to trigger the first session.
2. **Run the diagnostic.** Phase 0 (3 sessions) calibrates starting level and gap flags.
3. **Trust the process.** 30 minutes, every day. Consistency beats intensity.

The interview is the north star. Everything in this curriculum points directly at it.
