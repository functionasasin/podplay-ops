# Analysis Frontier — Daily Interview Practice

## Statistics
- Total aspects discovered: 16
- Analyzed: 7
- Pending: 9
- Convergence: 44%

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
- [ ] progress-tracking-design — Design how OpenClaw logs sessions, tracks streaks, triggers phase advancement

### Wave 3: Curriculum Generation (depends on Wave 2)
- [ ] phase-0-content — Generate complete Phase 0 (Diagnostic, Days 1-3) session content
- [ ] phase-1-content — Generate Phase 1 (Foundations, Weeks 1-4) — 28 daily sessions
- [ ] phase-2-content — Generate Phase 2 (Pattern Building, Weeks 5-8) — 28 daily sessions
- [ ] phase-3-content — Generate Phase 3 (System Thinking, Weeks 9-12) — 28 daily sessions
- [ ] phase-4-content — Generate Phase 4 (Integration, Weeks 13-16) — 28 daily sessions + mock interviews
- [ ] phase-5-content — Generate Phase 5 (Sharpening, Weeks 17-20) — 28 daily sessions + full mocks
- [ ] phase-6-template — Generate Phase 6 (Maintenance, ongoing) — repeating weekly template

### Wave 4: OpenClaw Integration & Output (depends on Wave 3)
- [ ] practice-guide — Generate the complete OpenClaw practice guide entity at entities/projects/daily-interview-practice.md
- [ ] openclaw-skill-prompt — Write the OpenClaw skill prompt for delivering daily sessions
- [ ] convergence-review — Final review: is the curriculum complete, realistic, and actionable?

## Recently Analyzed
- [x] interview-anatomy — Detailed breakdown of all 5 rounds: OA (LRU Cache + Task DAG), Coding Round 1 (async web crawler), System Design (LLM inference API), Coding Round 2 (stack profiler), Hiring Manager. Cross-cutting skills identified: concurrency, edge cases, production quality, simplicity. Pass/fail criteria documented for each round.
- [x] skill-taxonomy — 50+ discrete skills catalogued across 8 categories (Python Fluency, Concurrency, Data Structures, Algorithms, System Design, HTTP/Networking, Under-Pressure Execution, Communication). Priority tiers assigned: 10 CRITICAL skills, ~15 HIGH. Multi-round multiplier table identifies highest-ROI training targets. 5-tier trainability framework maps each skill to training approach.
- [x] current-level-diagnostic — 15 diagnostic exercises across 3 days (Python/DS, Concurrency/Algos, Systems/Communication). Each exercise has 1-5 scoring rubric, target time, follow-up prompts, and OpenClaw delivery instructions. Level mapping: 15–75 pts → Beginner/Developing/Intermediate/Advanced/Interview-Ready. Per-category gap flags (CONCURRENCY-GAP, ASYNCIO-GAP, etc.) guide Phase 1 customization.
- [x] practice-session-formats — 9 session formats designed: Code Kata, Spec Decomposition, Mini System Design, Debug & Read, SQL Challenge, Mock Pressure Round, Review & Reflect, Concept Deep Dive, Behavioral Story Practice. Each has timing breakdown, OpenClaw delivery instructions, sample problem libraries, and phase-frequency table. Cross-format principles: Socratic coaching, "I don't know" handling, edge-case-mid-session drilling, "explain it to me" close.
- [x] weekly-templates — Fully specified day-by-day sessions for all 6 phases (20 individual weeks + Phase 6 maintenance). Each session has format, topic, and key skill. Phase 1: 4 Code Katas + 1 SD + 1 RR + 1 DR per week. Phase 2: 3 CK + 1 SQL + 1 MPR + 1 RR + rotating MS/DR. Phase 3: 2 CD + 2–3 MS + CK/SQL + MPR + RR. Phase 4: 2 MPR + SD + BS + CK/SQL + RR + MS. Phase 5: 3 MPR + 2 BS + targeted weak-area + RR + rest. Phase 6: 6-week skill rotation with monthly re-diagnostic + interview ramp-up protocol.

## Discovered Aspects
(None yet)
