# Anthropic SWE Interview — Research Compilation

Source: Multiple interview experience reports, prep guides, and candidate accounts (2025-2026).

## Interview Loop Overview

The Anthropic SWE interview has 5 stages. Total process takes ~3-4 weeks (avg 19 days).

---

## Stage 1: Recruiter Screen (~30 min)

- Previous experience walkthrough
- Why Anthropic? Understanding of their value proposition
- Anthropic is a B Corp — know what that means
- What you're looking for career-wise

**Skills tested**: Communication, genuine interest in AI safety, self-awareness

---

## Stage 2: CodeSignal Assessment (~90 min)

**Format**: Take-home or live. 90-minute timed assessment on CodeSignal. General specification with a black-box evaluator. 4 progressive levels — spec gets more complicated at each level, code must pass all tests at one level to unlock the next.

**NOT LeetCode**. These are practical, progressive coding challenges.

### Example Problems Reported

**In-Memory Database (4 levels)**:
1. Basic SET/GET/DELETE operations
2. Filtered scans (query by prefix, range, etc.)
3. TTL with timestamps (keys expire, cleanup)
4. File compression/decompression (serialize state to disk)

**Bank Transaction System (4 levels)**:
1. Basic deposit/withdraw/balance
2. Multiple account types with different rules
3. Transaction history with filtering
4. Interest calculations, overdraft protection

### Key Skills Tested
- Python fluency (it's all Python)
- Clean, correct code written quickly
- Corner case handling (automated grading — edge cases matter)
- Iterative building: start minimal, add complexity
- Time management — candidates commonly run out of time
- Reading messy specs and extracting requirements

### Success Strategy
- "Get something passing. Then clean it up. Add edge cases. Submit often."
- Don't over-optimize early
- Read the FULL spec before coding
- Submit after each level passes — partial credit counts

---

## Stage 3: Hiring Manager Screen (~1 hour)

- Deep dive into background and motivations
- Passion for Anthropic and AI safety
- Career goals alignment
- Technical depth on past projects
- Usually friendly and collaborative

---

## Stage 4: Technical Interview Loop (4-5 rounds)

You interview for Research or Applied org. All interviewers from that org.

### Coding Rounds (2 rounds typically)

**Format**: Shared Python environment (CoderPad or similar). Live coding with interviewer.

**Key Skills**:
- Clean code under pressure
- Corner case handling
- SQL proficiency: window functions, joins, aggregation
- Real database scenarios (sampling from 100M+ rows, NULL handling, timezone logic)
- Prefix sum algorithms, two-pointer techniques
- Readable abstractions
- Willingness to say "I'm not sure, here's how I'd find out"

### System Design (1 round)

**Philosophy**: "Keep it real... build the most miniature possible version that would actually ship"

**Example Problems**:
- Distributed search system for 1B documents, 1M QPS — sharding, caching, LLM inference scaling
- Ride-sharing infrastructure — state tracking, immutable events
- Data warehouses for e-commerce — fact/dimension modeling
- API key storage with rotation and audit trails

**What They're Looking For**:
- Real throughput/latency numbers (p95 under 150ms targets)
- Clear ownership of data and dependencies via diagrams
- Failure mode identification with quick mitigation paths
- Trade-off documentation backed by concrete constraints
- Pragmatic, not academic solutions

### Behavioral / Culture Fit (1 round)

**Key Areas**:
- Real project stories (90 seconds each): decisions, not fluff
- Safety-first decisions in past projects
- Technical misjudgments that delayed a project
- Reliability vs velocity tradeoffs with concrete examples
- Understanding AI safety concerns beyond buzzwords
- Questions about safety telemetry and postmortem practices

---

## Stage 5: Reference Checks & Offer

2 reference checks required before offer.

---

## What Makes Someone Pass

### Technical Bar
- Python fluency is NON-NEGOTIABLE — stdlib, idioms, clean patterns
- Can decompose a messy spec into clean, buildable steps under time pressure
- System design thinking is pragmatic: what would you actually ship, not textbook answers
- Can write SQL that handles real-world messiness (NULLs, timezones, edge cases)
- Corner case thinking is automatic, not an afterthought

### Mindset Bar
- Genuine interest in what Anthropic is building (AI safety)
- Honest about what you don't know
- Clear, structured communication of technical decisions
- Build incrementally — ship something, then improve
- Safety-consciousness shows up in how you think about systems

### What Separates Pass from Fail
- **Pass**: Gets something working quickly, handles edge cases, communicates clearly, shows pragmatic design thinking
- **Fail**: Gets stuck on perfection, can't decompose messy specs, designs academic systems nobody would build, memorized patterns without understanding

---

## Preparation Recommendations (from successful candidates)

- **Daily practice**: 45-90 min — one timed problem, review optimal solution, document one lesson learned
- **System design**: ~10 focused hours total; practice by designing real systems you've used
- **Mindset**: Consistency over intensity. It's a skill you build, not a thing you cram.
- **Critical**: Get comfortable with messy specs and progressive complexity. This isn't about pattern matching — it's about thinking.
- **Red flags**: Over-optimizing early, pattern memorization without understanding, grinding without reflection
