# Spec Review — LinkedIn Profile

**Aspect**: spec-review (Wave 3)
**Reviewed**: 2026-02-23
**Source**: `../../docs/plans/linkedin-profile-spec.md` + all 10 prior analysis files
**Purpose**: Evaluate the complete spec against the "dangerous polymath builder" bar

---

## The "Dangerous Builder" Scorecard

| Criterion | Assessment | Verdict |
|-----------|------------|---------|
| Headline makes you want to click | "AI Agent Infrastructure Engineer" + "Deploying sports-tech franchise across Southeast Asia" in the same breath. Cognitive dissonance is immediate. Reader's mental model breaks — engineers don't distribute franchises. | **PASS** |
| About hooks in first 2 lines | "I build autonomous agent systems that run unattended in CI pipelines — then apply the same pipeline thinking to deploying a sports-tech franchise across the Philippines, Singapore, Thailand, and Indonesia." 277 chars — lands before desktop's ~300 char "See more" cutoff. Mobile truncation (~140 chars) still captures the agent systems opener. | **PASS** |
| Experience entries show range AND depth | 4 entries: franchise operator (Central Group, 4 countries, fintech), AI infrastructure (custom MCP, 36K LOC, FCIS), full-stack SaaS (Temporal.io, React 19, 3 apps), CV research (IEEE paper, Coral TPU, AlphaZero from scratch). Each has depth anchors that are verifiable or technically unfakeable. | **PASS** |
| VC would be impressed | Platform thesis visible across entries 2+3 (same architectural DNA, different domains). Central Group deal signals scale. 4-country SEA expansion signals ambition. Digital wallet + Magpie shows fintech awareness. | **PASS** |
| Senior engineer would be impressed | "Custom MCP tool server with scope-based credential gating — protocol-level implementation, not a FastMCP wrapper." 36K LOC with FCIS architecture. Temporal.io durable workflows in production. AlphaZero from scratch in PureBasic. These details can't be faked by someone who hasn't built them. | **PASS** |
| Business partner would be impressed | Master distribution rights across 4 countries. Central Group Thailand. Magpie fintech partnership. Revenue model architecture (70/30 splits, withholding tax, float economics). Hybrid cloud + on-premises venue deployment. This reads like someone who understands the real-world friction of operating a cross-border business. | **PASS** |
| Personality present, not generic | "The loop runs without me." / "Another built this profile." / "Bayesian reasoning matters more than fine-tuning — let's talk." / "The architecture is always the same. The domains keep changing." These are voice, not resume copy. Each line has a specific point of view that most people wouldn't write. | **PASS** |
| NOT generic LinkedIn slop | Zero buzzwords. No "passionate about," "results-driven," "cross-functional," "stakeholder." First person, present tense throughout. Every claim anchored to a specific thing that was built, not a process that was managed. | **PASS** |
| Stranger understands breadth + depth in 30 seconds | Headline (10 seconds): AI agent infra + SEA franchise = dissonance. About hook (10 seconds): CI pipelines + 4-country deployment = confirmation. Experience scroll (10 seconds): 4 entries across wildly different domains with named orgs = "this person is for real." | **PASS** |
| Forward motion signal present | "Right now I'm running ralph loops — autonomous CI agents... Another built this profile. The loop runs without me." This isn't past tense. It's happening now. The profile radiates "I'm building" not "I built." | **PASS** |

**Overall: 10/10 conditions met. PASS.**

---

## Section-by-Section Deep Review

### Headline (120 chars)

```
AI Agent Infrastructure Engineer | PyMC Labs · Nuts and Bolts AI | Deploying sports-tech franchise across Southeast Asia
```

**What works:**
- First 40 chars ("AI Agent Infrastructure Engineer") are the SEO payload — exactly what LinkedIn search indexes hardest
- Two named orgs in the middle create verifiable institutional anchors
- "Deploying sports-tech franchise across Southeast Asia" is the stop-scroll — creates cognitive dissonance against the tech identity
- 120 chars leaves 100 chars of buffer — no risk of truncation on any display

**The alternate headline** ("I build agent infrastructure that runs unattended. Also: franchise distribution across Southeast Asia.") is stronger on personality but weaker on SEO. Good to have as backup.

**Verdict: Ready to paste.**

---

### About Section (~1,730 chars)

**Block 1 — Hook (277 chars):** The strongest opening in the entire spec. "The architecture is always the same. The domains keep changing." is the thesis in 10 words. This sentence alone could be the entire About and still work.

**Block 2 — What I'm building now:** Names both orgs, both products, and the franchise with enough specificity that each claim is independently verifiable. "Custom MCP tool server I built at the protocol level" — this phrase alone will stop anyone building agent infrastructure. "Central Group Thailand" will stop anyone who knows Asia business.

**Block 3 — The thread:** States the universal pipeline pattern explicitly: detect → classify → route → execute → persist. Then applies it across three wildly different domains (license plates, game AI, knowledge graph). The IEEE citation is the academic depth anchor. The Telegram bot line is the personality layer. Dense but scannable.

**Block 4 — Receipts:** Specific, verifiable where possible, acknowledges private work through technical specificity rather than defensive parentheticals. "1,000+ commits across two production AI platforms" — no apology, just facts.

**Block 5 — Forward motion:** "The loop runs without me." — single most memorable sentence in the entire About. The recursive reference ("Another built this profile") is a genuine flex — it's literally true and demonstrates the concept in real time.

**Block 6 — CTA:** Three audience segments named directly. "Bayesian reasoning matters more than fine-tuning" is a minority conviction stated with confidence. "Let's talk" is peer-level — not "feel free to reach out" (subordinate), not "hire me" (desperate).

**Verdict: Ready to paste. The About section is the strongest part of the entire spec.**

---

### Experience Entries

**Entry ordering (Pod Play → PyMC Labs → Nuts and Bolts AI → Independent):** Correct. The ordering maximizes cognitive dissonance. A reader going top-to-bottom experiences: "franchise operator?" → "wait, custom MCP server for a Bayesian AI firm?" → "AND a full-stack SaaS with Temporal.io?" → "AND published IEEE research?" Each entry deepens the impression. The overlapping dates (2024/2025–present for entries 1-3) signal high output, not resume padding.

**Entry 1 — Pod Play SEA:** "Central Group (Thailand) — one of Asia's largest conglomerates" is the verification bait. "70/30 upcharge split, cross-venue credit ecosystem, per-country regulatory compliance" is operator language that signals someone who has done the actual work, not someone who read about it. Strong.

**Entry 2 — PyMC Labs:** "protocol-level implementation, not a FastMCP wrapper" — this one line distinguishes from 99% of MCP-related LinkedIn claims. The 420+ commits and 36K LOC are concrete. FCIS architecture callout signals design discipline.

**Entry 3 — Nuts and Bolts AI:** Temporal.io is the signal — it's a serious production choice that implies crash-resilient distributed workflows, not just a task queue. React 19 in production is bleeding-edge signal. "3-app product architecture" shows full-stack range.

**Entry 4 — Independent:** The origin story anchor. IEEE TENCON 2022 provides institutional credibility. "AlphaZero for Connect 4 from scratch in PureBasic" is the detail that makes engineers stop — PureBasic has no ML ecosystem, so implementing AlphaZero there means implementing the algorithm, not using a framework.

All entries under 2,000 char limit. All opening paragraphs fit within ~300 char "See more" preview. All use active verbs tied to specific outputs.

**Verdict: Ready to paste.**

---

### Featured Section

4 items: IEEE paper (hero) → LPRnet-keras → Slipstream → GitHub profile.

**IEEE paper as hero is the right call.** It's the most institutionally credible asset — peer-reviewed, international conference, ResearchGate generates a clean thumbnail. A VC, an engineer, and an operator all understand "published IEEE paper" as a signal.

**LPRnet-keras** — most-starred public repo, has README, connected to the paper. Tangible proof.

**Slipstream** — AI swim coaching shows range in an unexpected domain. The "builds for fun too" signal.

**GitHub profile** — activity graph and org affiliations visible. General evidence link.

**One note:** If the anime highlight generator or github-profile-reverse loop produces a compelling demo before the LinkedIn update, swap Slipstream for the newer/more impressive output. The spec acknowledges this ("Optional 5th item").

**Verdict: Ready to configure.**

---

### Skills (40 items, 5 tiers)

Top 3 pinned: AI Agent Infrastructure, Python, Machine Learning. Correct — balances niche identity (AI Agent Infrastructure) with broad searchability (Python, Machine Learning).

Tier 2 includes MCP, Temporal.io, Claude Agent SDK — these signal to the exact right people. Tier 4 includes Franchise Operations and Southeast Asia Market alongside Reinforcement Learning and YOLO — the cognitive dissonance shows up even in the skills list.

**Verdict: Ready to add.**

---

### Publications

IEEE TENCON 2022 paper properly listed with title, publisher, date, URL, and description. Cross-referenced in About section and Experience Entry 4.

**Verdict: Ready to add.**

---

### Execution Checklist

15 steps in correct dependency order. Custom URL first (propagation delay). Headline and About before Experience (highest impact sections first). Final review in incognito/logged-out to verify stranger rendering.

**Verdict: Complete and actionable.**

---

## Advisory Notes (Non-Blocking)

These are observations worth noting for the user, not spec fixes:

1. **Education section unaddressed.** The spec has no guidance on whether to add a university education entry. The career narrative references "university ML/CV coursework" in the 2021–2022 period. If a degree was completed, adding it would strengthen the IEEE paper context. If not, leaving it blank is fine — the paper speaks for itself. The user should decide.

2. **Next.js version verification.** The spec references "Next.js 16" in the Cheerful entry. Verify this matches the actual deployed version — overstating a framework version is the kind of detail an engineer would notice and it would undermine credibility.

3. **GitHub profile README dependency.** The spec recommends the GitHub profile as Featured item #4. If the github-profile-reverse loop hasn't completed a README yet, the GitHub profile link will show a bare activity graph without context. Consider delaying this Featured item until the README is ready, or swap its position with Slipstream.

4. **Company pages on LinkedIn.** If "Pod Play / Ping Pod," "PyMC Labs," and "Nuts and Bolts AI" have LinkedIn company pages, the experience entries will show their logos and link out. Verify these pages exist and look professional. If they don't exist, the entry will show a generic building icon, which is fine but less polished.

5. **Endorsements bootstrap.** The 40 skills will have zero endorsements initially. The top 3 (AI Agent Infrastructure, Python, Machine Learning) should be endorsed by colleagues/collaborators early to establish social proof. Not urgent but worth doing within the first week.

---

## Stress Tests

### Test 1: "Does this sound like a person, not a resume generator?"

Read the About section out loud. Does it sound like something a real person would say at a dinner table?

> "I build autonomous agent systems that run unattended in CI pipelines — then apply the same pipeline thinking to deploying a sports-tech franchise across the Philippines, Singapore, Thailand, and Indonesia."

Yes. This is dinner-table register. Direct, specific, no hedging.

> "The loop runs without me."

This is the kind of sentence a person says with a slight smile. Not a sentence an AI writes for a resume.

**Result: PASS — sounds human.**

### Test 2: "Could someone else write this profile with the same claims?"

The claims are specific enough that only someone who built these things could write them:
- "Custom MCP tool server with scope-based credential gating — protocol-level implementation, not a FastMCP wrapper" — requires knowing the difference between MCP protocol implementation and FastMCP wrapper
- "FCIS (Functional Core, Imperative Shell) architecture" — requires knowing this specific architectural pattern and having applied it
- "70/30 upcharge split, cross-venue credit ecosystem" — requires having designed the actual revenue model
- "AlphaZero from scratch in PureBasic" — requires knowing that PureBasic has no ML ecosystem

**Result: PASS — unfakeable specificity.**

### Test 3: "Would three different reader archetypes all be impressed?"

- **VC reading this profile:** Sees platform thesis (same architecture across multiple domains), SEA market expansion (Central Group, 4 countries), fintech (digital wallet, Magpie), team-scale production work (two orgs). Would take a meeting.
- **Senior engineer reading this profile:** Sees custom MCP server (frontier), 36K LOC (scale), Temporal.io (serious production), FCIS (design discipline), IEEE paper (rigor), AlphaZero from scratch (algorithmic depth). Would want to see the code.
- **Business partner reading this profile:** Sees Central Group deal (credibility), master distribution across 4 countries (scope), hybrid deployment (operational awareness), revenue model architecture (business acumen). Would trust this person to operate.

**Result: PASS — all three archetypes engaged.**

### Test 4: "Is anything missing that a stranger would expect to see?"

Potential gap: No mention of education/degree. But the IEEE paper and "university through independent work" framing in Entry 4 implies academic background without requiring a formal Education section. The builder archetype often omits education intentionally — it's a "my work speaks for itself" signal.

No other meaningful gaps. The narrative arc is complete: research origin → production engineering → franchise operations → autonomous systems. Every major project is represented. The through-line connects everything.

**Result: PASS — no critical gaps.**

### Test 5: "If I removed all company names, would the profile still be impressive?"

Without PyMC Labs, Nuts and Bolts AI, Central Group: "I build autonomous agent systems... custom MCP tool server at the protocol level... 36K lines of Python... Temporal.io durable workflows... franchise distribution across 4 countries... IEEE TENCON 2022..."

Yes. The specific technical claims and operational scope are impressive independent of institutional names. The org names add credibility but aren't load-bearing.

**Result: PASS — substance independent of names.**

---

## Final Verdict

**The spec PASSES the "dangerous polymath builder" bar.**

The cognitive dissonance is immediate (headline), sustained (about), and deepened (experience entries). The tone is builder confidence without corporate polish. Every claim is either publicly verifiable (IEEE paper, org names, public repos) or technically unfakeable (MCP protocol details, FCIS architecture, PureBasic AlphaZero). The profile radiates "I'm building things" not "I'm available." The through-line (detect → classify → route → execute → persist) prevents the range from looking scattered.

The five advisory notes above are minor and non-blocking. The spec is complete, actionable, and ready for the user to update every section of their LinkedIn profile in one sitting with zero ambiguity.

**Recommendation: Write convergence. This loop is done.**
