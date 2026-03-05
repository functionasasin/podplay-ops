---
type: project
name: Cheerful
status: active
people: [[Chris]], [[Paul]], [[Paolo]], [[Derick]], [[Josh]]
businesses: [[Nuts and Bolts]]
related: [[Mama Sitas]], [[cheerful-brand-first-strategy]]
tags: [influencer-marketing, ai, saas, platform]
---

# Cheerful

AI-powered influencer outreach and campaign management platform, built and operated by [[Nuts and Bolts]].

## What It Does

- Creator discovery and outreach automation
- Campaign management for influencer marketing
- Context engine with 7 tools (expanding toward full parity)
- AI-assisted messaging and creator matching

## Current State (2026-03)

- Platform is live and serving agency clients
- Team reduced to [[Chris]], [[Paul]], [[Paolo]], and me after [[Derick]] and [[Josh]] were fired
- Paul and Chris handle client calls and push features directly using AI-assisted coding
- I'm the primary engineer — contracted/freelance, not consulted on team decisions

## Strategic Loops

Deep autonomous research and spec work running in parallel:

| Loop | Status | What It Produces |
|------|--------|-----------------|
| `cheerful-reverse` | Converged | Complete platform rebuild spec |
| `cheerful-hero-features` | Converged | 6 hero features ranked by stickiness (22 platforms analyzed) |
| `cheerful-ig-dm-spec` | 40% | File-level IG DM implementation spec (SQL, Pydantic, TypeScript) |
| `cheerful-ig-dm-reverse` | Converged | Every viable IG DM approach with tradeoffs |
| `cheerful-ugc-capture-reverse` | 50% | UGC capture research (shares webhook infra with IG DM) |
| `cheerful-ce-parity-reverse` | 0% | Context engine going from 7 tools to full parity |

## Hero Features (from stickiness analysis)

1. **Creator Payment Hub** (#1, 25/25 stickiness) — Top competitive gap. Cheerful doesn't have it.
2. **Creator Relationship Intelligence Hub** (#4, 22/25) — Brands need to remember who they've worked with.
3. **Always-On UGC Capture** (#5, 21/25) — Brands want to see, save, and reuse actual content.
4. **Cross-Campaign Creator Performance Index** (#6, 20/25) — Who performed well last time?

## Key Strategic Direction

See [[cheerful-brand-first-strategy]] — the thesis is to move from serving agencies (Layer 2 tool) to replacing them (Layer 1 platform serving brands directly). The [[Mama Sitas]] campaign is the brand-side proof-of-concept.
