---
date: 2026-02-21
related: [[Pod Play]], [[Pod Play SEA]], [[Nico]], [[2026-03 NJ PodPlay Training]]
tags: [podplay, meeting-prep, nico]
---

# Nico Meeting Prep — Monday Feb 23, 2026

**Format:** Video call, ~1 hour
**Context:** First meeting with Nico. He handles setup/deployment at Pod Play — exact role scope TBD. We're deploying Pod Play in the Philippines (first venue: Tela Park, Las Piñas) and heading to NJ for training March 2-10.

**Goal:** Get clarity on the 3 critical blockers for Philippines deployment, plus a quick probe on payment routing.

---

## Pre-Call Message (send by Sunday)

> Hi Nico — looking forward to connecting Monday.
>
> To make the most of our time, here are the main things I'm hoping to cover:
>
> **1. Deployment independence** — Can we deploy venues from the Philippines, or do we need the Jersey City/US server? What does deploy.py produce, and can we run our own instance?
>
> **2. Connectivity & port 4000** — What data flows between Mac Mini and cloud? What happens if the connection drops? Any bandwidth requirements per court?
>
> **3. Non-US deployment** — Any gotchas/common problems you've seen for non-US deployments?
>
> Happy to adjust based on what you think is most useful to cover. See you Monday!

---

## Call Agenda

### Minutes 0-5: Intro & context

- Quick intro — who you are, what you're doing in SEA
- Ask Nico about his role — what does he own at Pod Play?
- *This tells you how much of your question list he can actually answer*

### Minutes 5-25: Deployment & venue config

Primary questions:
- What does `deploy.py setup <AREA_NAME>` actually produce? A macOS installer package? A config bundle?
- Can we access the Jersey City deployment server remotely from the Philippines?
- Can we run our own deployment server in Asia? Is deploy.py proprietary or shared?

Payment routing probe:
- **How does the app know to route to Magpie vs Stripe?** Is it a venue config setting, user region, or per-build?
- *If he doesn't know, note it and ask who does — likely confirms it's Marcello's domain*

Cloud services — shared or own for Asia?
- Mosyle MDM instance
- Apple Business Manager enrollment
- FreeDNS / podplaydns.com domain
- Unifi account (PingPodIT)

### Minutes 25-40: Port 4000 / connectivity

- What data flows over port 4000 between Mac Mini and Pod Play servers?
- Is it synchronous (real-time) or asynchronous (queue-based)?
- Is it just health checks and clip uploads, or real-time booking data too?
- What happens if the connection drops? Does the venue still function? Can users still book? Can replays still play?
- Bandwidth requirements per court
- Is there a fallback if port 4000 is blocked by a Philippine ISP?

### Minutes 40-50: Non-US deployment gotchas

- Open-ended: "What gotchas have you seen for non-US deployments?"
- Let him surface what he knows — don't lead with assumptions
- If he doesn't mention these, ask as follow-ups:
  - Power: 220V/60Hz vs 120V/60Hz — all gear compatible?
  - Video: PAL vs NTSC — does camera region setting matter for the replay pipeline?
  - Camera firmware: region-locked?

### Minutes 50-55: NJ training prep

- What should we prioritize during the March 2-10 trip?
- Who should we make sure to talk to while we're there?
- Anything we should bring or prepare?

### Minutes 55-60: Next steps

- Best way to reach him for follow-up questions?
- Will he be at NJ during our training dates?
- Any docs or resources he can share beforehand?

---

## What Success Looks Like

After this call, you should know:

1. **Can we deploy independently?** — Whether we need the NJ server or can run our own, and what deploy.py actually does
2. **Will the architecture work from PH?** — What flows over port 4000, whether PH latency/ISP issues are a problem, and what happens when connectivity drops
3. **Are there PH-specific blockers?** — Power, video standards, or other gotchas that would delay first venue deployment
4. **Payment routing (bonus)** — Whether Nico knows how Magpie vs Stripe routing works, or who to ask

---

## Questions to Save for Later

These are important but not critical for Monday. Save for NJ training or follow-up calls:

- Mac Mini exact chip (M1/M2/M4) and year (Q44)
- Brother label maker model (Q49)
- Remote Mac Mini access after deployment (Q25)
- App update push mechanism (Q26)
- Firmware update management (Q27)
- Monitoring/alerting dashboard (Q28-29)
- Replay clip storage duration and SSD usage (Q30)
- Backup & recovery process (Q31)
- Scaling process for adding courts (Q32)
- Escalation path and support SLA (Q33)
- App binary — same worldwide or regional? (Q23)
- App distribution method (Q24)

---

## Reference

Full question list: [[podplay-nj-trip-question-brainstorm]]
System diagram: [[podplay-system-diagram]]
Hardware BOM: [[podplay-hardware-bom]]
