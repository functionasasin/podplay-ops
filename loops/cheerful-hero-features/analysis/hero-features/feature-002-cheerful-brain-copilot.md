# Feature 002: Agentic Campaign Copilot ("Cheerful Brain")

**One-line pitch:** The first influencer platform where you say "launch outreach to 50 fitness creators in NYC under 100K followers" and it executes — autonomously, from your own Gmail.

**Wave:** 3 — Hero Feature Card
**Date:** 2026-02-28
**Priority:** CRITICAL — Biggest underexploited competitive moat in Cheerful's architecture

---

## Problem It Solves

Cheerful has the most powerful AI infrastructure of any influencer marketing platform — Temporal durable workflows, Claude claude-opus-4-6 intelligence, MCP tools with full data access, and a Slack-native context engine. But **all of it is internal**. Users cannot trigger autonomous campaign actions, ask natural language questions about their campaigns, or delegate any task to the AI without developer involvement.

Meanwhile, competitors are winning enterprise deals on the basis of named AI copilots:
- GRIN launched "Gia" (May 2025): autonomously sends outreach, creates affiliate links, processes gifting orders, promotes creators to performance tiers
- Upfluence launched "Jace": saves 20+ hours/week on outreach and relationship management
- Linqia launched "Marco AI": trend detection → outreach → execution autonomously; 25% faster brief-to-review

Cheerful's Temporal + Claude architecture is categorically more powerful than any of these implementations. The gap is not capability — it's surface area.

### Evidence from Research

- **60.2% of brands** actively use AI in their influencer strategy; 66.4% report improved campaign outcomes ([Influencer Marketing Hub 2025](https://influencermarketinghub.com))
- **79% of brands** are actively moving toward autonomous agents (Wave 2b market-trends.md)
- "Organizations that run marketing like a control room overseeing Agentic-AI workflows will outperform those running it like a relay race" (Gartner 2026 Marketing Trends, market-trends.md)
- Agentic systems document **65% reduction in campaign launch times** (Stormy.ai 2025)
- GRIN Gia + Linqia Marco are live products with documented client wins — Cheerful has no user-facing answer
- Cheerful's existing Context Engine (Slack bot, Claude claude-opus-4-6, MCP tools) is already more capable than competitors' copilots — it just isn't user-facing (`spec-context-engine.md`)

---

## How It Works in Cheerful

### Integration with Existing Spec

This feature is primarily a surface-area change, not an architectural build. Cheerful's agentic infrastructure already exists:

**Existing (from spec):**
- `spec-context-engine.md`: Claude claude-opus-4-6 + MCP tools with access to all campaign data, creator records, email threads, analytics — fully operational as internal Slack bot
- `spec-workflows.md`: Temporal workflows already handle: campaign association, creator extraction, flag detection, reply classification, post tracking, bulk draft editing
- `BulkDraftEditWorkflow` (`spec-workflows.md`): natural language instruction → batch update across all drafts in a campaign — already built
- 3 automation levels: Manual / Semi / Full — the agentic execution engine already exists
- `spec-backend-api.md`: 110+ API endpoints covering every campaign action the copilot would need to invoke
- `spec-user-stories.md` §US-12.x: Slack context engine already handles ad-hoc queries about campaigns

**What to build:**

**Phase 1 — Web-UI Copilot Surface:**
1. "Cheerful Brain" chat panel — always-accessible sidebar or command palette in the web app
2. Natural language query routing to the existing MCP-tooled Claude instance (same as Slack bot, different surface)
3. Read-only queries first: "How many creators have we contacted this week?", "Which campaign has the best reply rate?", "Show me creators who haven't replied in 7 days"
4. Status awareness: copilot knows which campaigns are active, which creators are in each stage, pending payments, content due dates

**Phase 2 — Agentic Action Execution:**
1. Write actions exposed via existing API endpoints:
   - "Draft outreach emails for all fitness creators in Campaign X" → trigger `BulkDraftCreateWorkflow`
   - "Set all unanswered creators from 10+ days ago to follow-up ready" → batch status update
   - "Launch a new gifting campaign for [product]" → trigger campaign wizard prefill + draft generation
   - "Generate a performance report for last month's campaigns" → trigger `ClientPerformanceSummary`
2. Confirmation pattern: Cheerful Brain proposes action → user approves → Temporal workflow executes
3. Full Automation mode: with user permission, skip confirmation for approved action categories

**Phase 3 — Proactive Intelligence:**
1. Campaign health alerts: "Campaign X reply rate dropped 20% — recommend pausing pending drafts"
2. Creator recommendations: "3 creators in your roster have posted brand-adjacent content this week — consider inviting to new campaign"
3. Anomaly detection: unusual opt-out spike, creator rate negotiation below/above historical average
4. Weekly briefing: automated Monday campaign status summary pushed to user + Slack

**Phase 4 — Brand Voice Learning:**
1. Copilot learns from user feedback on AI-drafted emails over time (which edits users consistently make)
2. "Rules for LLM" (`spec-user-stories.md §US-2.10`) exposed as copilot preferences: "Never mention discounts in first email", "Always reference the creator's most recent post"
3. Per-brand style profiles that accumulate and become impossible to recreate elsewhere

**API/infrastructure additions needed:**
- Copilot chat session persistence (conversation history)
- Action approval queue (proposed action → approve/reject → execute)
- Brand voice preference store (accumulated edits + rules)
- Push notification layer for proactive alerts

---

## Stickiness Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Workflow Frequency** | 5/5 | Daily or multiple-times-daily for ops teams. Campaign monitoring, quick status queries, draft batch operations — this becomes the primary interface for all campaign work. |
| **Integration Depth** | 5/5 | Connects discovery, outreach, campaign management, analytics, team collaboration, payments — literally the coordination layer across every other workflow. |
| **Data Accumulation** | 5/5 | Brand voice learning accumulates over every interaction. Preferred communication style, creator relationship context, historical performance patterns — all compound. After 12 months, the copilot knows this brand's influencer strategy better than any new platform ever could. |
| **Team Dependency** | 4/5 | Ops manager uses it daily; brand manager uses it for reporting; eventually entire team. Requires team-wide habit formation which takes time but creates deep dependency. |
| **Switching Pain** | 4/5 | Accumulated brand voice preferences + historical context + workflow automation rules cannot be migrated. New platform starts from scratch with no institutional memory. |

**STICKINESS SCORE: 23/25**

---

## Competitive Landscape

| Platform | AI Copilot | Architecture | User-Facing? | Key Capability Gap |
|----------|-----------|-------------|-------------|-------------------|
| **GRIN Gia** | Named copilot | Traditional API + LLM layer | ✅ Yes | Shallow vs. Temporal; limited to GRIN's own workflow steps |
| **Upfluence Jace** | Named copilot | LLM recommendation layer | ✅ Yes | No agentic execution; mostly recommendation engine |
| **Linqia Marco** | Agentic AI | Enterprise-only, not self-serve | ❌ Managed service | Not available to self-serve customers |
| **CreatorIQ** | AI insights | Campaign prediction + BenchmarkIQ | ⚡ Partial | Read-only analytics; no autonomous execution |
| **Cheerful (current)** | Context Engine | Temporal + Claude + MCP | ❌ Internal only | Best infrastructure, zero user surface |
| **Cheerful (with this feature)** | Cheerful Brain | Temporal + Claude + MCP | ✅ Full | **Only agentic copilot with durable Temporal execution + brand's own Gmail delivery** |

**How Cheerful does it better:**
- **Temporal durability**: GRIN Gia executes actions as single API calls — if something fails, it's gone. Cheerful Brain's actions are Temporal workflows — durable, resumable, observable, retryable. This is a fundamental architectural advantage.
- **Gmail-native execution**: When Cheerful Brain sends outreach, it sends from the brand's own Gmail domain. GRIN Gia sends from GRIN's servers. Reply-rate advantage is concrete and measurable.
- **True campaign context**: Cheerful Brain has access to the full email thread history, creator engagement data, and campaign state via MCP tools. Competitors' copilots answer questions about their own platform data only.
- **Natural language → batch operation**: `BulkDraftEditWorkflow` already demonstrates this — Cheerful Brain extends it across every workflow.

---

## Workflow Integration Map

```
User (web UI or Slack)
         │
         ▼ "Launch outreach to 50 NYC fitness creators under 100K followers"
  Cheerful Brain (Claude claude-opus-4-6 + MCP)
         │
         ├──► [MCP: search_creators] → Apify discovery for matching profiles
         ├──► [MCP: create_campaign] → creates campaign with user's specified params
         ├──► [MCP: generate_drafts] → AI-drafted outreach per creator
         │
         ▼ "Here's my plan: 47 creators found, 47 drafts ready. Approve to send?"
  User approves
         │
         ▼ [existing: BulkDraftSendWorkflow via Temporal]
  Emails sent from brand Gmail → exactly-once delivery guaranteed
         │
         ▼ Proactive alert (3 days later)
  Cheerful Brain: "14 creators replied (30% rate). 5 expressed interest. Want me to move them to negotiation?"
```

Connected workflows:
- **Discovery**: copilot can initiate creator searches and add results to campaigns
- **Outreach**: copilot drafts, edits, and sends emails via existing Temporal workflows
- **Campaign Management**: copilot updates campaign states, manages creator pipeline
- **Analytics**: copilot generates on-demand reports from existing dashboard data
- **Payments (Feature 001)**: copilot can initiate contract generation and payment requests

---

## Dependency Chain

**What makes this feature stickier when combined with:**

1. **Feature 001 (Creator Payment Hub)**: Copilot can handle end-to-end: "Generate a contract for this creator at their negotiated rate and send for signature" → Cheerful Brain executes the entire payment workflow autonomously.
2. **Feature 003 (Revenue Attribution)**: Copilot answers questions like "Which creators drove the most revenue last month?" with real data, not just reply counts.
3. **Feature 004 (Creator Relationship Intelligence)**: Copilot has context on creator history when drafting outreach — "I see we've worked with this creator twice before; here's a draft that references our previous collaboration."
4. **Feature 006 (Creator Performance Index)**: Copilot proactively suggests which creators to re-invite based on their performance index.

**Built vs. Enhanced:**
- Web UI chat surface: **Build from scratch** (Slack bot is internal-only today)
- LLM query routing: **Enhance** existing Context Engine architecture
- Action execution: **Enhance** existing Temporal workflows + API
- Brand voice learning: **Build** (new persistence layer on top of existing rules system)
- Proactive alerts: **Build** new alerting triggers on existing workflow state events

---

*Sources: `analysis/categories/ai-automation.md` · `analysis/campaigns/market-trends.md` §Trend 4 · `analysis/competitors/grin.md` · `analysis/competitors/upfluence.md` · `analysis/competitors/linqia.md` · `analysis/synthesis/competitor-matrix.md` §8 · `spec-context-engine.md` · `spec-workflows.md`*
