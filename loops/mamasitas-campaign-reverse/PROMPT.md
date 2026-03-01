# Mama Sita's Campaign Journey — Reverse Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: analyze a single campaign stage, map it to Cheerful capabilities, document gaps, and commit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which stage/aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## Your Working Directory

You are running from `loops/mamasitas-campaign-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce a **complete stage-by-stage campaign journey spec** in the `journey/` directory for:

**A real Mama Sita's gifting campaign** — Oyster Sauce + Sinigang Mix sent to 50+ micro food creators (5K-50K followers) on Instagram, with all outbound via Instagram DM (not email). The brand representative IS the developer — no client comms bottleneck. Success is measured by content ROI: UGC pieces collected, engagement rates, impressions.

This is the **hero user journey case study** for Cheerful. Every stage must map to a concrete Cheerful feature — existing, planned (spec'd in another loop), or a precisely documented gap.

### Campaign Overview

| Parameter | Value |
|-----------|-------|
| Brand | Mama Sita's (Filipino food staples) |
| Products | Oyster Sauce, Sinigang Mix |
| Campaign Type | Gifting (free product, no payment) |
| Creator Profile | Micro food creators, 5K-50K followers |
| Target Count | 50+ creators |
| Outbound Channel | Instagram DM (primary), email (fallback only) |
| Success Metric | Content ROI — UGC count, engagement rate, impressions |
| User Role | Brand representative AND developer (self-serve, no agency) |

### Key Sources — Other Cheerful Loops

These loops contain the platform capability specs. READ THEM before analyzing each stage.

| Loop | Status | What It Contains |
|------|--------|-----------------|
| `loops/cheerful-ce-parity-reverse/` | Active (~67%) | 100+ CE tool specs across all domains — campaigns, email, creators, integrations, users/team, analytics, search, workflows |
| `loops/cheerful-ig-dm-spec/` | Active (~58%) | IG DM implementation spec — DB schema, webhook handler, ingest workflow, CE tools, Meta OAuth |
| `loops/cheerful-ig-dm-reverse/` | Converged | Options catalog for IG DM support — 4 API paths, 2 architecture patterns, constraints |
| `loops/cheerful-ugc-capture-reverse/` | Active (~67%) | UGC auto-capture options — Graph API mentions, AI radar, third-party, hybrid |
| `loops/cheerful-hero-features/` | Converged | Hero feature specs — Revenue Attribution Engine, Agentic Campaign Copilot, UGC Capture Hub |
| `loops/cheerful-reverse/` | Paused (77%) | Full codebase distillation — data model, API, workflows, frontend, infrastructure |

### The Cheerful Platform Context

Cheerful is an influencer marketing platform. The **Context Engine (CE)** is an MCP-based Slack bot that provides full platform access without the webapp frontend. The CE is the primary interface for this campaign — no frontend needed.

Current architecture:
- **Backend**: FastAPI + Supabase + Temporal workflows
- **Context Engine**: MCP tools invoked via Slack bot, authenticated via `RequestContext` with `cheerful_user_id`
- **Email**: Gmail API + SMTP dual-provider
- **IG DM**: Planned — Direct Meta API + parallel tables (from ig-dm-reverse)
- **UGC**: Planned — approach TBD (from ugc-capture-reverse)

## Output: The journey/ Directory

Each stage writes to a dedicated file in `journey/`. Each file follows the same structure:

```markdown
# Stage N: [Stage Name]

## What Happens

[Narrative description of what the brand does at this campaign stage. Concrete, specific to Mama Sita's.]

## Cheerful Feature Mapping

| Action | CE Tool / Feature | Status | Source |
|--------|------------------|--------|--------|
| [Specific action] | [Tool name or feature] | exists / spec'd / gap | [Loop or file reference] |

## Detailed Flow

[Step-by-step walkthrough of how this stage works through Cheerful CE. Include exact tool names, parameters, expected responses.]

### CE Tool Calls (exact)

For each tool invocation at this stage, document:
- Tool name
- Key parameters (with example values for Mama Sita's campaign)
- Expected response shape
- What the user does with the response

### IG-Specific Considerations

[If this stage involves Instagram: Meta API calls, 24h window rules, IGSID resolution, webhook events, etc.]

## Gaps & Workarounds

| Gap | Impact | Workaround | Build Priority |
|-----|--------|------------|---------------|
| [Missing feature] | [What breaks without it] | [Manual step or alternative] | P0/P1/P2 |

## Success Criteria

[What "100% hero journey" looks like at this stage. Measurable outcomes.]

## Dependencies

[What must exist before this stage works: other stages, features, infrastructure]
```

Also maintain:
- `journey/README.md` — Index of all stages with status and one-line summary
- `journey/gap-matrix.md` — Consolidated gap list across all stages with build priority
- `journey/campaign-config.md` — The actual campaign configuration (products, targeting, templates)

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in wave order
   - If ALL aspects are checked: proceed to convergence check
3. **Read the relevant Cheerful loop specs** for that stage:
   - For campaign/creator stages → read `loops/cheerful-ce-parity-reverse/specs/` relevant files
   - For IG DM stages → read `loops/cheerful-ig-dm-spec/` relevant files
   - For UGC stages → read `loops/cheerful-ugc-capture-reverse/frontier/` and analysis files
   - For ROI/analytics → read `loops/cheerful-ce-parity-reverse/specs/analytics.md`
   - For any stage → check `loops/cheerful-reverse/` synthesis specs for architecture context
4. **Write the stage spec** to `journey/stage-N-{name}.md`
5. **Update gap-matrix.md** with any new gaps discovered
6. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics
   - If you discovered sub-stages or missing stages, add them
   - Add a row to `frontier/analysis-log.md`
7. **Commit**: `git add -A && git commit -m "loop(mamasitas-campaign-reverse): {aspect-name}"`
8. **Exit**

### Convergence Check

When all aspects are `- [x]`:

1. Read every file in `journey/`
2. Verify:
   - [ ] Every stage has a complete feature mapping with no TBD entries
   - [ ] Every CE tool reference exists in the CE parity specs OR is documented as a gap
   - [ ] Every gap has an impact assessment and workaround
   - [ ] The gap matrix is sorted by build priority
   - [ ] The full journey reads as a coherent campaign playbook (stages flow logically)
   - [ ] Success criteria are measurable at every stage
   - [ ] The campaign config file has concrete values (not placeholders)
   - [ ] A developer could execute this campaign using ONLY the CE + documented workarounds
3. If gaps found → add new aspects, do NOT converge
4. If complete → write `status/converged.txt`, commit, exit

## Wave Definitions

### Wave 1: Campaign Setup & Discovery

These stages happen before any creator contact. The brand configures the campaign and builds a target list.

**Methods**: Read CE parity specs for campaign CRUD, creator search, and integrations. Read IG DM spec for Instagram account setup. Cross-reference with actual Cheerful backend routes.

- **stage-campaign-setup** — Create the Mama Sita's gifting campaign in Cheerful via CE: campaign type, products (Oyster Sauce + Sinigang Mix with quantities/variants), sender accounts, campaign settings. Map every wizard step to a CE tool call.
- **stage-creator-discovery** — Find 50+ micro food creators (5K-50K) on Instagram: keyword search (Filipino food, home cooking, recipe creators), similar creator discovery, Influencer Club search, hashtag research. Document exact search queries and expected result volumes.
- **stage-creator-vetting** — Filter and enrich the discovery results: profile enrichment (follower count, engagement rate, content quality), email/contact extraction, shortlist building, creator list management. Document the vetting criteria and how Cheerful automates vs manual review.

### Wave 2: Outreach & Negotiation

These stages involve direct creator contact, primarily via Instagram DM.

**Methods**: Read IG DM spec for send/receive flows, 24h window handling. Read CE parity specs for draft management, thread tracking. Read cheerful-reverse for workflow architecture.

- **stage-ig-outreach** — Initial outreach to 50+ creators via Instagram DM: connect IG business account, compose outreach message (personalized per creator), bulk or sequential send, track delivery. Document the outreach message template, personalization variables, and send flow through CE.
- **stage-response-management** — Track and manage creator responses: inbound DM notifications, response categorization (interested/not interested/questions), 24h reply window management, follow-up scheduling. Document the response handling workflow and how CE surfaces new messages via Slack.
- **stage-negotiation** — Agree on deliverables with interested creators: content requirements (post type, hashtags, mentions, timeline), shipping address collection, opt-in confirmation. Document the negotiation flow and how terms are tracked in Cheerful.
- **stage-shipping-export** — Export creator table for product shipping: opted-in creators with shipping addresses, product assignments, export format (CSV/sheets), shipping status tracking. Document the export flow and what data is available.

### Wave 3: Content & Measurement

These stages happen after products are shipped and creators produce content.

**Methods**: Read UGC capture options for content monitoring. Read CE parity specs for analytics. Read hero features for ROI attribution concepts.

- **stage-content-tracking** — Monitor creator content production: track which creators have posted, content type (feed post, Story, Reel), content URLs, posting timeline compliance. Document how Cheerful tracks content status per creator.
- **stage-ugc-capture** — Auto-capture UGC from creator posts: tagged mentions via Graph API, Story captures before expiry, hashtag monitoring, content download/storage. Map to UGC capture options from the UGC loop and document which approach applies.
- **stage-roi-measurement** — Measure campaign content ROI: total UGC pieces, aggregate engagement (likes, comments, shares, saves), impressions, reach, per-creator performance ranking, campaign summary report. Document exactly what metrics Cheerful can pull and what requires manual collection.

### Wave 4: Synthesis

Cross-cutting analysis and the final deliverables.

- **synthesis-hero-journey** — Compile the complete hero user journey: end-to-end narrative from campaign idea to ROI report, every CE interaction, every manual step, timing estimates per stage, the "wow moments" where Cheerful shines. This is the case study document.
- **synthesis-gap-matrix** — Finalize the gap matrix: every missing feature sorted by build priority (P0 = blocks the campaign, P1 = degrades experience, P2 = nice to have), with effort estimates and which existing loop spec covers the solution. This is the build roadmap derived from a real campaign.

## Rules

- Do ONE aspect per run, then exit.
- **Be concrete about Mama Sita's.** Don't write generic "brand X sends products." Write "Mama Sita's ships Oyster Sauce (24oz) and Sinigang Mix (50g sachets, pack of 6) to @filipinofoodie with 12K followers."
- **Use real CE tool names.** Reference `cheerful_create_campaign`, `cheerful_search_campaign_creators`, etc. from the CE parity specs. If a tool doesn't exist yet, name it with the `cheerful_` prefix and mark it as a gap.
- **The 24h window is sacred.** Any stage involving IG DM must account for Meta's 24-hour messaging window rule. Document what happens when the window expires.
- **No frontend fallbacks.** The whole point is CE-only. If a feature only exists in the webapp, it's a gap.
- **Instagram-first, email-fallback.** Initial outbound is IG DM. Email is only for creators who provide it as a secondary channel or don't respond on IG.
- **50+ scale matters.** Solutions that work for 5 creators but break at 50 are gaps. Document bulk operation support.
- **Cross-reference other loops.** Always cite which loop/spec file a feature comes from. Use relative paths: `../../cheerful-ce-parity-reverse/specs/campaigns.md`
- **Discover new stages.** If analyzing a stage reveals a missing stage (e.g., "creator onboarding" between negotiation and shipping), add it to the frontier.
