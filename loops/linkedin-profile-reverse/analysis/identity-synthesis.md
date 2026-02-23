# Identity Synthesis — LinkedIn Profile

**Aspect**: identity-synthesis (Wave 2)
**Analyzed**: 2026-02-23
**Source files**: ALL Wave 1 analysis (reference-profile-scan, monorepo-project-inventory, cheerful-analysis, decision-orchestrator-analysis, github-profile-cross-ref, linkedin-format-research) + ALL Wave 2 (reference-formula-extraction, career-narrative-arc, experience-entry-design) + input/publications.md
**Purpose**: Final synthesis — headline drafts, complete About section draft, Featured section recommendations, skills list, tone calibration. This is the input to the Wave 3 spec.

---

## Headline — Final Candidates

**Constraints**: 220 chars max. First 100 chars matter most for search and narrow display. Must include: primary identity keyword, institutional anchors, disorienting element.

### Option A: Builder Identity + Institutional Anchors + Disorientation (RECOMMENDED)

> AI Agent Infrastructure Engineer | PyMC Labs · Nuts and Bolts AI | Deploying sports-tech franchise across Southeast Asia

**Character count**: 120 chars
**Why this works**:
- First 40 chars ("AI Agent Infrastructure Engineer") are the SEO payload — captures the primary searchable identity
- Middle section names both orgs (credibility anchors, verifiable)
- Final section is the disorienting detail that makes the reader click
- Pipes (|) provide clean visual separation
- Fits comfortably in narrow display contexts (first 100 chars: "AI Agent Infrastructure Engineer | PyMC Labs · Nuts and Bolts AI")

### Option B: Direct Statement (Karpathy-style)

> I build agent infrastructure that runs unattended. Also: franchise distribution across Southeast Asia. | PyMC Labs · Nuts and Bolts AI

**Character count**: 133 chars
**Why this works**:
- Opens with what the person *does*, not what they *are* — mirrors Karpathy's "I like to train deep neural nets"
- "Runs unattended" is technically specific and memorable
- "Also:" is a deliberate voice move — casual pivot that amplifies the dissonance
- More personality than Option A, slightly less SEO-optimized

### Option C: Range-Forward

> Building AI orchestration platforms and deploying franchise networks across Southeast Asia | PyMC Labs · Nuts and Bolts AI · Ping Pod

**Character count**: 134 chars
**Why this works**:
- Leads with the two parallel activities in one breath — "building" + "deploying"
- Names three organizations (maximum credibility density)
- Slightly more operator-friendly than A or B

### Option D: Keyword-Dense (SEO-first)

> AI Infrastructure Engineer · Full-Stack · Probabilistic ML | PyMC Labs | Southeast Asia Franchise Operator

**Character count**: 107 chars
**Why this works**:
- Maximum keyword density for LinkedIn search: "AI Infrastructure," "Full-Stack," "Probabilistic ML," "Southeast Asia"
- Clean pipe separation
- "Franchise Operator" at the end is the disorientation
- Least personality, most discoverability

### Verdict

**Option A is the primary recommendation.** It balances SEO ("AI Agent Infrastructure Engineer"), credibility (both org names), and stop-scroll ("sports-tech franchise across Southeast Asia"). It works in both narrow display (search results) and full display (profile page).

**Option B is the backup if the user wants more voice.** It trades some search optimization for personality. Best for someone who is already discoverable through other channels and wants the profile to *feel* like them.

---

## About Section — Complete Draft

**Constraints**: 2,600 chars max. Optimal range: 1,800–2,200. First ~300 chars visible on desktop before "See more." First ~140–200 chars visible on mobile. The hook must stand alone.

### The Hook (Lines 1-2)

Must create cognitive dissonance in ≤300 chars. Must work as a standalone statement if the reader never clicks "See more."

**Primary hook** (277 chars):

> I build autonomous agent systems that run unattended in CI pipelines — then apply the same pipeline thinking to deploying a sports-tech franchise across the Philippines, Singapore, Thailand, and Indonesia. The architecture is always the same. The domains keep changing.

**Why this works**:
- Opens with technical identity ("autonomous agent systems") — establishes the builder
- "run unattended in CI pipelines" is specific enough to signal real depth (not a chatbot)
- The pivot to "deploying a sports-tech franchise across [4 countries]" is the disorientation
- "The architecture is always the same. The domains keep changing." is the through-line thesis in two sentences
- Mobile truncation (~140 chars) captures: "I build autonomous agent systems that run unattended in CI pipelines — then apply the same pipeline thinking to deploying a sports-tech f..."  — enough to hook

### Block 2: What I'm Building Now (Present Tense)

> At PyMC Labs, I'm core engineer on Decision Orchestrator — a Discord-based organizational OS where database-driven workflows route to Claude agents through a custom MCP tool server I built at the protocol level. At Nuts and Bolts AI, I built Cheerful: a full-stack influencer marketing platform running on Temporal.io durable workflows, React 19, and AI-personalized email drafting at scale. In parallel, I hold master distribution rights for Pod Play and Ping Pod across Southeast Asia — structuring franchise deals with partners including Central Group Thailand.

**Why this works**:
- Names both orgs and both products with enough specificity to be verifiable
- "Custom MCP tool server I built at the protocol level" — verification bait for agent infrastructure people
- "Temporal.io durable workflows" — verification bait for production engineers
- "Central Group Thailand" — verification bait for business/investor readers
- Present tense throughout ("I'm core engineer," "I hold master distribution rights") — forward motion

### Block 3: The Thread

> The pattern across everything I build is the same: detect the input, classify it, route to the right workflow, execute autonomously, persist the result. I've applied this to edge-cloud license plate recognition (IEEE TENCON 2022, co-author — detection on YOLO, recognition on custom CNN, inference on Google Coral TPU), game strategy AI (AlphaZero from scratch, MCTS + neural network value heads), and a personal knowledge graph managed by a Telegram bot that auto-commits entities to git.

**Why this works**:
- States the through-line explicitly: detect → classify → route → execute → persist
- Names the IEEE paper (academic credibility, verifiable)
- Names the Coral TPU (hardware credibility, rare)
- AlphaZero "from scratch" (algorithmic depth, not library usage)
- The knowledge graph + Telegram bot line is the personality layer — shows the life-OS mindset

### Block 4: Proof / Receipts

> Some numbers: 1,000+ commits across two production AI platforms (private orgs; references available). 36K lines of Python in one codebase, FCIS architecture. Custom MCP server with scope-based credential gating. Digital wallet with GCash + credit card support built on Stripe + Magpie fintech partnership. IEEE co-author, TENCON 2022.

**Why this works**:
- Specific, verifiable where possible
- "(private orgs; references available)" acknowledges the visibility gap without apologizing
- Each fact is a different kind of proof: code scale, architecture choice, protocol depth, fintech, academic publication

### Block 5: Forward Motion

> Right now, I'm running ralph loops — autonomous CI agents that analyze reference material, generate specs, and build toward convergence every 30 minutes. One is building a video engine. Another built this profile. The loop runs without me.

**Why this works**:
- Shows the person is actively building, not having built
- "Another built this profile" is a recursive flex — the ralph loop analyzing LinkedIn produced this text
- "The loop runs without me" is the most memorable sentence in the entire About

### Block 6: CTA

> If you build agent infrastructure, operate in Southeast Asia, or think Bayesian reasoning matters more than fine-tuning — let's talk.

**Why this works**:
- Names three audience segments directly (builders, operators, Bayesian thinkers)
- "Bayesian reasoning matters more than fine-tuning" is a minority conviction stated with confidence
- "Let's talk" not "feel free to reach out" — direct, peer-level

### Full About Section — Assembled

```
I build autonomous agent systems that run unattended in CI pipelines — then apply the same pipeline thinking to deploying a sports-tech franchise across the Philippines, Singapore, Thailand, and Indonesia. The architecture is always the same. The domains keep changing.

At PyMC Labs, I'm core engineer on Decision Orchestrator — a Discord-based organizational OS where database-driven workflows route to Claude agents through a custom MCP tool server I built at the protocol level. At Nuts and Bolts AI, I built Cheerful: a full-stack influencer marketing platform running on Temporal.io durable workflows, React 19, and AI-personalized email drafting at scale. In parallel, I hold master distribution rights for Pod Play and Ping Pod across Southeast Asia — structuring franchise deals with partners including Central Group Thailand.

The pattern across everything I build is the same: detect the input, classify it, route to the right workflow, execute autonomously, persist the result. I've applied this to edge-cloud license plate recognition (IEEE TENCON 2022, co-author — detection on YOLO, recognition on custom CNN, inference on Google Coral TPU), game strategy AI (AlphaZero from scratch, MCTS + neural network value heads), and a personal knowledge graph managed by a Telegram bot that auto-commits entities to git.

Some numbers: 1,000+ commits across two production AI platforms (private orgs; references available). 36K lines of Python in one codebase, FCIS architecture. Custom MCP server with scope-based credential gating. Digital wallet built on Stripe + Magpie fintech partnership. IEEE co-author, TENCON 2022.

Right now, I'm running ralph loops — autonomous CI agents that analyze reference material, generate specs, and build toward convergence every 30 minutes. One is building a video engine. Another built this profile. The loop runs without me.

If you build agent infrastructure, operate in Southeast Asia, or think Bayesian reasoning matters more than fine-tuning — let's talk.
```

**Character count**: ~1,730 chars (well under 2,600 limit — room for adjustment without bloat)

---

## Featured Section — Recommendations

**Constraints**: 4-6 items, thumbnail-driven, first item is the "hero." Appears above Experience on the profile — prime real estate.

### Recommended Featured Items (in order)

| # | Item | Type | URL | Why |
|---|------|------|-----|-----|
| 1 | IEEE TENCON 2022 Paper | External link | https://www.researchgate.net/publication/366589541 | **Hero item.** Peer-reviewed, institutional, verifiable. ResearchGate shows thumbnail + abstract. Academic credibility is the rarest credential in a builder profile. |
| 2 | LPRnet-keras GitHub Repo | External link | https://github.com/clsandoval/LPRnet-keras | Most-starred public repo (4 stars). Has a README. Connected to the IEEE paper. Tangible proof of the CV pipeline work. |
| 3 | Slipstream (AI Swim Coach) | External link | https://github.com/clsandoval/slipstream | Shows range — AI applied to physical training. Weird, specific, memorable. Has design docs. The "this person builds for fun too" signal. |
| 4 | GitHub Profile | External link | https://github.com/clsandoval | Activity graph, org affiliations (nuts-and-bolts-ai, pymc-labs visible). The "general evidence" link. Should be featured AFTER the profile README is written (github-profile-reverse loop). |
| 5 | Monorepo (optional, when README exists) | External link | https://github.com/clsandoval/monorepo | Only feature if/when it has a public README that explains the system. Without a README, it's confusing. With one, it's the most impressive single artifact. |

### What NOT to feature

- Company website links (Pod Play, Ping Pod) — they're someone else's product page, not clsandoval's work
- Empty or README-less repos — they signal incompleteness
- LinkedIn articles (unless one is written post-profile-update)
- Generic "portfolio" sites

### Hero Item Decision

The IEEE paper is the hero because:
1. It's the most institutionally credible artifact (peer-reviewed, international conference)
2. It connects to the origin story (CV pipeline → edge deployment → the whole arc begins here)
3. ResearchGate provides a professional-looking thumbnail automatically
4. A VC, an engineer, and a business operator all understand "published IEEE paper" as a signal

If the user prefers a more builder-forward hero, swap positions 1 and 3 (lead with Slipstream for personality, paper second for credibility).

---

## Skills List — Ordered by Impressiveness

**Constraints**: Up to 50 skills, 80 chars per skill. Top 3 get most visibility (shown by default). Skills function as a keyword bank for LinkedIn search.

### Tier 1: Top 3 (most visible — choose for maximum stop-scroll + SEO)

1. **AI Agent Infrastructure** — the primary identity, highly searchable
2. **Python** — universal search keyword, earned (36K LOC in one codebase)
3. **Machine Learning** — broad search keyword, backed by IEEE paper + production ML

### Tier 2: Technical Depth Signals (positions 4-12)

4. MCP (Model Context Protocol)
5. Temporal.io
6. Claude Agent SDK
7. Computer Vision
8. Probabilistic Programming
9. FastAPI
10. React / Next.js
11. Bayesian Statistics
12. TypeScript

### Tier 3: Infrastructure + Production (positions 13-20)

13. Supabase / PostgreSQL
14. Discord.py
15. LangChain / Langfuse
16. Docker / Fly.io
17. GitHub Actions / CI/CD
18. SQLAlchemy
19. Edge Computing / Google Coral TPU
20. FFmpeg / Video Processing

### Tier 4: Domain Skills (positions 21-30)

21. Franchise Operations
22. Fintech / Payment Systems
23. Southeast Asia Market
24. Reinforcement Learning
25. YOLO / Object Detection
26. Keras / TensorFlow
27. PyMC
28. Business Development
29. MCTS (Monte Carlo Tree Search)
30. Technical Writing

### Tier 5: Supporting Skills (positions 31-40)

31. Slack Bot Development
32. Telegram Bot Development
33. OAuth / Authentication
34. Stripe Integration
35. Data Pipeline Architecture
36. Knowledge Graph Design
37. Obsidian / PKM Systems
38. PureBasic
39. Tailwind CSS / shadcn/ui
40. Zustand / TanStack Query

### Skills List Rationale

- **Top 3 optimized for search**: "AI Agent Infrastructure" is the niche identity; "Python" and "Machine Learning" are the broadest search terms that are still earned
- **Tier 2 is the "if you know, you know" layer**: MCP, Temporal.io, Claude Agent SDK — these signal to the exact people who matter (other agent infrastructure builders)
- **Tier 3 is production credibility**: Supabase, Docker, CI/CD — boring but necessary to signal "I ship things"
- **Tier 4 is the range proof**: Franchise Operations + Fintech + Southeast Asia alongside Reinforcement Learning + Object Detection — this is where the cognitive dissonance shows up in the skills list
- **Tier 5 is keyword density**: catches niche searches without cluttering the top

---

## Tone Calibration

### The Spectrum

```
CORPORATE ←————————————————————→ UNHINGED BUILDER
"Results-driven                    "I vibe-coded an
professional with                  OS in 30 minutes
10+ years of                       and it runs my
experience..."                     entire company"
```

### Target Position: Builder Confidence, Dinner Table Register

```
CORPORATE ←——————————[X]—————→ UNHINGED BUILDER
                      ↑
              "Explaining your work
               to a technical founder
               you just met at dinner.
               Direct. Specific. Not
               trying to impress —
               the work does that."
```

### What This Tone Sounds Like

**YES**:
- "I built a custom MCP tool server at the protocol level — not a FastMCP wrapper."
- "The loop runs without me."
- "Master distribution rights across 4 countries."
- "The architecture is always the same. The domains keep changing."

**NO**:
- "I am passionate about leveraging AI to drive impact across diverse verticals."
- "Seasoned engineer with expertise spanning multiple domains."
- "I've had the privilege of working with world-class teams."
- "Let me tell you about my journey..." (narrative LinkedIn influencer voice)

### Voice Rules

1. **First person, present tense**: "I build" not "He builds" or "I built"
2. **Specificity over adjectives**: "36K LOC" not "large-scale codebase"
3. **Name things**: "Temporal.io durable workflows" not "advanced workflow orchestration"
4. **One sentence for conviction, not paragraphs**: "Bayesian reasoning matters more than fine-tuning" — drop it and move on
5. **Humor is fine, irony is fine, self-deprecation is not**: "Another built this profile" is humor. "I know this sounds scattered" is apology. Never apologize for range.
6. **Don't sell**: The profile radiates "I'm building things" not "I'm available" or "let me help you." The CTA is "let's talk" — peer-level, not service-provider.

---

## Profile Photo / Banner Recommendations

### Photo

No specific photo recommendation from analysis (this is a content-driven synthesis, not a visual one). General principles from reference profiles:

- Technical builders tend to use candid or slightly informal photos — not studio headshots
- The photo should match the tone: smart, direct, not corporate
- If in doubt, a high-quality candid from a conference or workspace > a LinkedIn photographer studio shot

### Banner

Options:
1. **Code screenshot** — a ralph loop running, or a terminal with CI output. Visceral, on-brand.
2. **Southeast Asia context** — venue photo, Manila skyline, or Ping Pod table. Shows the operator identity.
3. **Abstract/minimal** — dark background with a single line of code or a diagram. Clean.
4. **Leave default** — some reference profiles (Karpathy) don't use banners at all. Anti-polish as signal.

**Recommendation**: Option 1 (code screenshot) or Option 4 (leave it). The code screenshot is the most on-brand for the builder archetype. Leaving it default is the anti-LinkedIn signal that works if the content is strong enough (it is).

---

## Custom URL

**Target**: `linkedin.com/in/clsandoval`

If `clsandoval` is taken:
- `linkedin.com/in/clsandovalai`
- `linkedin.com/in/carlsandoval` (if applicable)

Keep it short, memorable, real-name-based.

---

## Cross-Reference: How Everything Connects

| Profile Element | Source Analysis | Key Decision |
|----------------|----------------|--------------|
| Headline | reference-formula-extraction | Option A: "AI Agent Infrastructure Engineer \| PyMC Labs · Nuts and Bolts AI \| Deploying sports-tech franchise across Southeast Asia" |
| About hook (first 300 chars) | reference-formula-extraction + career-narrative-arc | "I build autonomous agent systems that run unattended in CI pipelines — then apply the same pipeline thinking to deploying a sports-tech franchise across [4 countries]." |
| About thread | career-narrative-arc | "detect → classify → route → execute → persist" as universal architecture |
| About forward motion | monorepo-project-inventory | Ralph loops as concrete present-tense example |
| Experience order | experience-entry-design | Pod Play SEA → PyMC Labs → Nuts and Bolts AI → Independent ML/CV |
| Experience framing | reference-formula-extraction + experience-entry-design | Active verbs, specific outputs, no processes, ownership explicit |
| Featured hero | linkedin-format-research + github-profile-cross-ref | IEEE TENCON 2022 paper (most institutionally credible, verifiable) |
| Skills top 3 | linkedin-format-research | AI Agent Infrastructure, Python, Machine Learning |
| Tone | reference-profile-scan + reference-formula-extraction | Builder confidence, dinner table register, no corporate language |
| Conviction statement | reference-formula-extraction | "Bayesian reasoning matters more than fine-tuning" |
| Disorienting detail | reference-formula-extraction + career-narrative-arc | Technical builder + SEA franchise operator in the same profile |

---

## The "Dangerous Builder" Final Check

| Condition | Evidence | Status |
|-----------|----------|--------|
| Cognitive dissonance in first 10 seconds | Headline: AI agent infrastructure + SEA franchise in same line | PASS |
| Verifiable depth in ≥2 domains | IEEE paper + 36K LOC + Central Group deal | PASS |
| Hook in first 300 chars of About | "I build autonomous agent systems...deploying a sports-tech franchise across [4 countries]" | PASS |
| Philosophical conviction with shipped proof | "Bayesian reasoning > fine-tuning" + PyMC Labs affiliation + MCP server | PASS |
| Forward motion signal | "The loop runs without me" + ralph loops description | PASS |
| Range without domain dump | 3 lead domains (agents, SEA ops, probabilistic ML), rest implied by experience entries | PASS |
| Tone: builder, not corporate | First person, present tense, specific nouns, no adjectives | PASS |
| NOT looking for work | "I'm building things" energy throughout, CTA is peer-level "let's talk" | PASS |
| Technical specificity as proof | "Custom MCP server with scope-based credential gating" / "FCIS architecture" / "Temporal.io durable workflows" | PASS |
| Would stop a VC, a senior engineer, AND a business partner | VC: sees platform thesis + SEA market. Engineer: sees MCP + 36K LOC. Operator: sees Central Group + 4-country franchise | PASS |

All conditions met. Ready for Wave 3 spec synthesis.
