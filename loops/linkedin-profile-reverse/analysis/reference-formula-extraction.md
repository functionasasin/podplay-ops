# Reference Formula Extraction — Builder-Polymath LinkedIn Profiles

**Aspect**: reference-formula-extraction (Wave 2)
**Analyzed**: 2026-02-23
**Source**: analysis/reference-profile-scan.md + cross-reference with all Wave 1 files
**Purpose**: Extract the structural formula that makes builder-polymath profiles stop-scroll; map to clsandoval's specific situation

---

## The Core Insight: "Impressive" vs "Dangerous"

The fundamental difference is cognitive dissonance.

**Impressive**: You list credentials → the reader nods and continues scrolling. They've seen this before.

**Dangerous**: The reader encounters a combination that doesn't fit any pre-existing mental model. They pause. "Wait — this person does AI infrastructure AND runs a franchise across Southeast Asia AND published computer vision research AND builds autonomous CI pipelines?" The disorientation is the hook.

The "dangerous" profile doesn't need to be longer. It needs to be *disorienting*. And that disorientation comes from one thing: verifiable range. Not claimed range. Range with receipts.

For clsandoval specifically: **the disorienting element is the combination of deep technical builder (36K LOC, custom MCP server, IEEE paper) and regional operator (Central Group deal, 4-country franchise distribution, fintech partnerships)**. An engineer doesn't usually run master franchise negotiations with Asia's largest conglomerates. An operator doesn't usually build production AI orchestration systems from scratch. That combination is the stop-scroll.

---

## The Seven-Pattern Formula

From analysis of Levels, Hotz, Karpathy, Balaji, Lavingia, Graham, Collison, and Welsh:

### Pattern 1: The Work IS the About Section

**What this means**: The most compelling profiles don't describe the work — they *are* the work. The headline isn't "AI Engineer with expertise in..." — it's "I like to train deep neural nets on large datasets" (Karpathy). The product is the description.

**The failure mode**: Third-person framing. "Experienced professional who..." Anyone can write that. The builder profile writes from inside the work.

**Application to clsandoval**: Don't describe AI engineering. Describe what gets built at 2am. "I build the infrastructure that makes AI agents actually work — then I deploy it in Discord, Telegram, and production SaaS, and run a franchise distribution across Southeast Asia on the side."

---

### Pattern 2: Credentials as Launching Pad, Not Destination

**What this means**: The best profiles use past credentials as context for where they're going, not trophies for where they've been. Balaji writes "Formerly CTO of Coinbase." The word "formerly" is doing enormous work — it says: that chapter is closed, I've moved on to bigger problems.

**The failure mode**: The trophy case. "10 years of experience at [impressive company]." This reads as peaked, not launching.

**Application to clsandoval**: "Published IEEE, PyMC Labs, Nuts and Bolts AI" are not pinnacles — they're chapters in a larger story. The profile shouldn't end with PyMC Labs; it should use it as evidence of a worldview (probabilistic reasoning, agent infrastructure) that continues forward.

---

### Pattern 3: The Five-Word Story

**What this means**: Every great profile has at least one specific, checkable fact that creates a narrative arc in 5 words or less.
- "12 startups in 12 months" (Levels)
- "First person to jailbreak iPhone" (Hotz)
- "Lead instructor, CS231n" (Karpathy)
- "Second employee at Pinterest, 19" (Lavingia)

These function as narrative bait. You can't read them without wanting to know more. They're not claims — they're verifiable facts that imply a whole story.

**The failure mode**: Generic scale metrics. "Grew a team" or "improved efficiency by 20%" — unmemorable, unverifiable, ubiquitous.

**Application to clsandoval**: Several candidates exist.
- "Custom MCP server running in production for a Bayesian AI firm" (verifiable, unusual)
- "Master franchise rights across 4 Southeast Asian countries" (verifiable, unusual combination for a builder)
- "CI pipeline that runs every 30 minutes — not tests, AI agents building new systems" (visceral, specific, implies the whole ralph loop system)
- "Co-authored IEEE paper. Then built the agent infrastructure to automate the research pipeline." (arc narrative)

Pick 1-2 of these for the About section hook.

---

### Pattern 4: Range Without Inventory

**What this means**: Polymaths don't list every domain. They pick the 3-4 domains that form a coherent story, then let the range speak through one disorienting detail. Graham is programmer + painter + essayist — the painter part is the hook, not the third credential in a list. Hotz is hacker → autonomous vehicles → AI infrastructure — each pivot is described as "I found the next locked box."

**The failure mode**: The domain dump. "Interested in ML, fintech, gaming, probabilistic programming, computer vision, Southeast Asia, and life automation." This reads as someone who doesn't know what they are.

**Application to clsandoval**: Three domains max in the headline and About. The rest shows in experience entries and skills.

Recommended triad:
1. **Agent infrastructure** (the through-line — applies to every cluster)
2. **Southeast Asia operations** (the disorienting element — creates cognitive dissonance)
3. **Probabilistic AI / Bayesian reasoning** (the differentiator — rare in the LLM space)

The CV, game AI, life-OS work gets implied by the pattern, not listed.

---

### Pattern 5: Philosophical Conviction

**What this means**: Great profiles hold a minority position and build from it.
- Hotz: "AI infrastructure should be simpler than anyone thinks. tinygrad: <1000 lines."
- Levels: "One person can build a $1M/year company without investors or employees."
- Lavingia: "No meetings, no deadlines, no full-time employees."
- Graham: "Lisp is the right tool."

Having an opinion that most people don't share — and having built something to back it up — is the deepest form of LinkedIn credibility.

**The failure mode**: Generic statements. "I believe in the power of technology to change the world." This is content that could appear in 10 million profiles.

**Application to clsandoval**: What's the minority position?

Candidates:
- "The interface to any team or system should be a conversation, not an app." (reflected in: Decision Orchestrator via Discord, OpenClaw via Telegram, Cheerful via Slack — all three use chat interfaces over building dedicated UIs)
- "The CI pipeline is the developer, not the tool." (reflected in: ralph loops — CI runs Claude Code, which writes and commits code autonomously)
- "Bayesian reasoning is more useful in agent systems than transformer fine-tuning." (the probabilistic worldview applied to agents)

The first two are strongest because they're backed by shipped code.

---

### Pattern 6: Shipped Product > Claimed Expertise

**What this means**: No adjectives. The live link is more convincing than any skill claim. "I built Nomad List, you can use it right now" beats "expert in community-building and product development."

**The failure mode**: Skills-first framing. "Proficient in: Python, React, FastAPI, LangChain, etc."

**Application to clsandoval**: The challenge is that the best work is in private repos. The substitutes:
- Named org + role + specific metrics ("420 commits in PyMC Labs codebase")
- Technical specificity that signals you couldn't write this without having done it ("custom MCP server with scope-based credential gating" — you can't fake that phrasing)
- IEEE publication (public, verifiable, institutional)
- Pod Play / Ping Pod / Magpie partnership (verifiable business operations)

Technical specificity IS the proof when the code is private.

---

### Pattern 7: Anti-Polish as Authenticity Signal

**What this means**: Corporate polish is itself a credibility negative for the builder archetype. The profiles that work don't sound edited. They sound like a smart person talking about what they do. Graham's essays are plain HTML. Karpathy's headline is a personal preference statement. Hotz used LinkedIn being anti-LinkedIn as on-brand content.

**The failure mode**: Over-editing. "Dynamic, results-driven technologist with a passion for innovation and a track record of..." — the more polished, the less trustworthy.

**Application to clsandoval**: The tone should sound like something you'd say explaining your work to a technical founder at a dinner table. Not formal. Not cringe-casual. Not optimized. Direct.

---

## How Polymaths Avoid Looking Scattered

Three tactics from the reference profiles:

### Tactic 1: The Through-Line Pattern
Every domain gets described as an expression of the same underlying obsession. Hotz doesn't just "do computers" — he "finds the locked box and figures out how to open it." Graham doesn't list painter + programmer + essayist — he's someone who "likes to understand things completely, then explain them simply."

For clsandoval: the through-line from the GitHub cross-ref analysis is **spec-first, pipeline-thinking, agent-native**. Every domain — CV, game AI, franchise ops, Bayesian inference, email automation — is an instance of the same pattern: detect input → analyze → route → execute. The range becomes a proof of a pattern, not evidence of distraction.

### Tactic 2: Depth Anchors Per Domain
Each domain mentioned needs one verifiable depth signal. You can list 5 domains if each has a "you can look this up" anchor.
- Agent infrastructure: 36K LOC codebase, custom MCP server
- CV/ML: IEEE TENCON 2022 co-author
- SEA ops: Central Group Thailand deal, master franchise across 4 countries
- Probabilistic AI: PyMC Labs affiliation

Without the depth anchor, a domain mention reads as "interested in X." With it, it reads as "operates in X."

### Tactic 3: Hierarchy of Mention
Lead domains get full prose sentences. Supporting domains get a single clause. Tertiary signals live in experience entries or skills only.

**Lead** (2-3 sentences each): Agent infrastructure, SEA operations
**Supporting** (1 clause): Probabilistic/Bayesian worldview, CV foundation
**Tertiary** (experience bullets only): Game AI, life-OS, academic research

---

## About Section Formula — Structural Template

Optimized for:
- ~300 char mobile hook
- ~300 char desktop hook
- 2,200-2,400 char full section (not using every character)
- "Dangerous builder" tone

### Block 1: The Hook (lines 1-2, ≤300 chars total, must work standalone)

The hook must be the disorienting element. The thing that creates cognitive dissonance. For clsandoval, the tension between "deep technical builder" and "regional franchise operator" is the hook.

**Formula**: [surprising builder claim] + [the disorienting element]

**Candidate hooks**:

Option A (technical hook, then business dissonance):
> "I build autonomous agent systems that run unattended in CI — then apply the same thinking to running a franchise distribution network across Southeast Asia."

Option B (direct range statement):
> "Engineer by training. I build production AI agent infrastructure for PyMC Labs and Nuts and Bolts AI. I'm also the master distributor for a sports-tech franchise across the Philippines, Singapore, Thailand, and Indonesia."

Option C (the pipeline observation):
> "I've noticed I build the same thing in every domain: a pipeline that detects input, routes it intelligently, and executes autonomously. I've built this for license plate recognition, game strategy AI, email automation, and team orchestration. Right now I'm building it for an entire life."

Option A is the sharpest for the "dangerous" persona — it establishes the technical identity first, then drops the disorienting pivot. Option B is more direct but less memorable.

---

### Block 2: What I'm Building Now (2-3 sentences, present tense)

Names the two private org projects + the SEA business. Specific enough to be verifiable.

> At PyMC Labs, I'm core engineer on Decision Orchestrator — a Discord-based organizational OS where database-driven workflows route to Claude agents with a custom MCP tool server. At Nuts and Bolts AI, I built Cheerful: a full-stack influencer marketing platform on Temporal.io durable workflows and React 19. In parallel, I'm deploying the first Ping Pod venues in the Philippines and structuring master franchise deals for Thailand and Singapore.

---

### Block 3: The Range / The Thread (2-3 sentences)

Names the pattern that contains all the domains without listing every domain.

> The common thread is always the same architecture: specify the problem completely, build the pipeline agent-by-agent, run it until convergence. I've applied this to computer vision (IEEE TENCON 2022, edge inference on Google Coral TPU), game AI (AlphaZero from scratch, Dota 2 strategy coaching), and my own life (an entity knowledge graph running on git, managed by a Telegram bot that commits back to the repo).

---

### Block 4: Proof / Receipts (bullet list, 3-5 items)

Specific, checkable facts. No adjectives.

```
- Custom MCP server with scope-based credential gating — not FastMCP, protocol-level
- Master franchise rights for Pod Play + Ping Pod across Philippines, Singapore, Thailand, Indonesia
- Co-authored IEEE paper on edge-cloud license plate recognition (TENCON 2022)
- 1,000+ commits across two production AI platforms (private org; available on request)
- Probabilistic programming ecosystem: PyMC Labs affiliation, Bayesian ML applied to decision systems
```

---

### Block 5: Forward Motion (1-2 sentences)

Shows the person is still building, not having built. Signals what's next.

> Currently running ralph loops — autonomous CI agents that analyze reference material, generate specs, then build toward convergence — for both this LinkedIn profile and a video engine I'm shipping. The loop runs every 30 minutes without me.

---

### Block 6: CTA (1 sentence, direct)

Not "feel free to reach out." Something with a personality.

> If you're building agent infrastructure, expanding into Southeast Asia, or want to understand why Bayesian reasoning matters more than fine-tuning — find me.

---

## Headline Formula

**Constraint**: 220 chars max. First 100 chars are most critical for search and narrow display.

**Structure for polymaths**: [Primary identity] | [Secondary signal] | [Disorienting detail]

The pipe (|) pattern from Justin Welsh works well because it allows multiple keyword clusters while remaining readable.

**Priority order for clsandoval**:
1. "AI Agent Infrastructure" — the primary technical identity (high search value)
2. "PyMC Labs / Nuts and Bolts AI" — the institutional anchors (credibility, recognition)
3. "Southeast Asia" — the disorienting element (makes you click)
4. Optional: "Bayesian" or "Probabilistic ML" — the differentiator

**Draft headlines** (each under 220 chars):

Option A (identity-first):
> AI Agent Infrastructure Engineer | Building autonomous systems at PyMC Labs + Nuts and Bolts AI | Deploying sports-tech franchise across Southeast Asia

(149 chars — leaves room)

Option B (range-first):
> Building AI orchestration platforms and deploying franchise networks across Southeast Asia | PyMC Labs · Nuts and Bolts AI · Ping Pod

(132 chars)

Option C (Karpathy-style direct statement):
> I build agent infrastructure that runs unattended. Also: master franchise distribution across Southeast Asia. | PyMC Labs · Nuts and Bolts AI

(142 chars)

Option D (keyword-dense for SEO):
> AI Infrastructure Engineer · Full-Stack · Probabilistic ML | PyMC Labs | Southeast Asia Operator | Autonomous Systems

(118 chars — most search-optimized but less personality)

**Verdict**: Option A or C for "dangerous builder" energy. Option D if search visibility is the priority. The range disorientation (builder + SEA operator in the same headline) is what makes any of them stop-scroll.

---

## The "Dangerous" Checklist for clsandoval

After synthesizing all reference profiles and clsandoval's Wave 1 data, these are the conditions a "dangerous" profile must satisfy:

| Condition | clsandoval's evidence | Profile status |
|-----------|----------------------|----------------|
| One fact that creates cognitive dissonance | Builder who runs SEA franchise | ✓ Use this |
| Verifiable depth in ≥2 domains | 36K LOC + IEEE paper + Central Group deal | ✓ All verifiable |
| Live product or link the reader can immediately access | LPRnet-keras (public), IEEE paper (public) | Partial — private work limits this |
| Philosophical conviction with shipped proof | "Agent everywhere" / "spec-first" | ✓ Backed by ralph loops + DO + Cheerful |
| Tone that sounds like a person, not a resume | Must be applied in writing | In progress |
| Forward motion signal | Ralph loops running now | ✓ Real-time CI agents |
| No domain dump | Keep to 3 lead domains | Must enforce in writing |

**The one gap**: The best private work can't be linked. The solution is technical specificity over links — phrasing like "custom MCP server with scope-based credential gating" signals depth that you can't fake without having built it.

---

## What NOT to Do (Anti-Pattern Checklist)

- Do NOT use: "passionate," "results-driven," "cross-functional," "stakeholder," "leverage," "synergy"
- Do NOT lead with: years of experience, educational background, a job title that exists at every company
- Do NOT list: every technology you've ever touched in the About section
- Do NOT write: in third person
- Do NOT use: adjectives to describe yourself ("innovative builder," "seasoned engineer")
- Do NOT hide: the Southeast Asia business. It's the most disorienting credential.
- Do NOT apologize: for the range. The range is the point.
- Do NOT make it look like you're available for work. You're building things.

---

## Key Principle: Verification Bait

The "dangerous" profile makes the reader want to verify claims. Specific, named, checkable:
- "PyMC Labs" → reader can look up the org (real, recognized, 2K GitHub followers)
- "IEEE TENCON 2022" → reader can find the paper
- "Central Group (Thailand)" → reader can verify (one of Asia's largest conglomerates)
- "Temporal.io durable workflows" → reader who knows Temporal knows this is not beginner territory
- "Custom MCP server, not FastMCP" → reader deep in agent infrastructure knows exactly what this means

Each verifiable detail builds compounding credibility. The reader who verifies 3 of these comes away feeling like they've discovered someone impressive, not been sold to.

---

## Summary: The Formula

1. **Hook** = the disorienting combination (agent infrastructure + SEA franchise operator)
2. **Thread** = the pattern that contains all domains (spec-first, pipeline-thinking, agent-native)
3. **Proof** = specific, named, verifiable facts (PyMC Labs, IEEE TENCON, Central Group, Temporal.io)
4. **Tone** = direct builder confidence — the kind of voice that sounds like explaining your work at a dinner table, not presenting to a committee
5. **Forward** = present tense, active, still building (ralph loops running right now)
6. **Range limit** = 3 lead domains (agents, SEA ops, probabilistic ML), rest implied
