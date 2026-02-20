---
date: 2026-02-20
related: [[Pod Play]], [[Pod Play SEA]], [[Magpie]], [[Digital Wallet]], [[2026-03 NJ PodPlay Training]], [[Tela Park]]
tags: [podplay, unknowns, tracker, training-prep, deployment]
---

# PodPlay Unknowns Tracker

Single source of truth for every open question blocking the Philippines deployment. Check off items as they get resolved. Organized by what blocks what.

**Last updated:** 2026-02-20

---

## CRITICAL — Blocks First Venue Deployment

### Cloud Services: Shared or Separate?

Each of these needs a "shared with US" or "separate Asia instance" answer.

- [ ] **PodPlay Admin Dashboard** — do we create venues in the existing US instance or get our own?
- [ ] **PodPlay Backend/API** — same servers as US? Latency ~200-300ms from PH if US-hosted
- [ ] **Mosyle MDM** — shared PingPod Inc account or own instance? Who creates device groups for PH?
- [ ] **Apple Business Manager** — "Managed by Pingpod Inc" enrollment works globally or need own?
- [ ] **FreeDNS (podplaydns.com)** — same domain for Asian venues? Own credentials?
- [ ] **1Password** — own vault or shared access to existing?
- [ ] **Deployment Server (Jersey City)** — accessible remotely from PH? Local-network only?
- [ ] **PodPlay App (iOS/tvOS)** — same binary worldwide or regional builds?
- [ ] **App Store / TestFlight** — how does app get distributed to PH devices?
- [ ] **Unifi Account (PingPodIT)** — shared or own account?

**Resolves at:** NJ Training (Mar 2-10)

### Payment Routing — Client Side

Backend swap (Stripe → Magpie) is done. The app-side routing is not understood.

- [ ] **How does the iPad app know to route to Magpie vs Stripe?** Based on venue config? User region? Hardcoded per build?
- [ ] **Per-venue or per-region payment config?** Can individual venues within a region use different providers?
- [ ] **If per-build, do we need a separate Asia binary?**

**Resolves at:** NJ Training — ask engineering team

### Magpie Integration Details

Magpie integration is working (test booking done) but we don't understand the internals.

- [ ] **What identifier goes in the Stripe Account ID field?** Magpie merchant ID? Something else?
- [ ] **iPad SDK routing mechanism** — different SDK? Same app detecting region? Config-driven?
- [ ] **Booking/charge flow** — does PodPlay backend call Magpie API directly? iPad calls Magpie? GCash redirect flow?
- [ ] **Webhook/callback structure** — does Magpie send payment confirmation webhooks like Stripe?
- [ ] **Refund handling** — GCash is one-way (no refunds). When PodPlay backend triggers refund, what happens? Credits instead?
- [ ] **Test/sandbox mode** — does Magpie have one? Or are we running live transactions during venue testing?
- [ ] **Per-venue vs shared merchant account** — each venue gets its own Magpie account? Or all share one with internal tagging?
- [ ] **Self-service onboarding** — do we coordinate with Magpie each time we add a venue? Or is there a self-service flow?

**Resolves at:** Magpie sync + NJ Training

### Deployment Server

- [ ] **What does `deploy.py setup <AREA_NAME>` actually produce?** macOS installer? Config bundle?
- [ ] **Can it be accessed remotely from PH over the internet?** Or local-network only?
- [ ] **Do we get source access to `deploy.py`?** Proprietary or shared with distributors?
- [ ] **Can we run our own deployment server in Asia?**

**Resolves at:** NJ Training — hands-on walkthrough with Stan

### Port 4000 Data Flow

This is the Mac Mini ↔ PodPlay cloud connection. Architecturally critical.

- [ ] **What data flows over port 4000?** Health checks? Clip uploads? Real-time booking data?
- [ ] **Synchronous or asynchronous?** If sync and latency-sensitive, US-hosted servers + PH venues = potential issues
- [ ] **What happens if the connection drops?** Does the venue still function? Can users still book? Can replays still play?
- [ ] **Bandwidth requirements per court?** How much upload bandwidth does a venue need?
- [ ] **Fallback if port 4000 is blocked by ISP?** VPN tunnel? Alternative port?

**Resolves at:** NJ Training

### PAL vs NTSC

- [ ] **Does changing camera video standard to PAL break the replay pipeline?** The Node.js replay service ingests camera streams — does it care about frame rate?
- [ ] **Camera encoding settings tied to NTSC?** H.264, 1080P, 30fps, 8192 Kb/s — are these NTSC assumptions?
- [ ] **Can we just leave cameras on NTSC in PH?** IP cameras likely don't care about broadcast standards. PH is 60Hz grid (same as US) so 30fps should be fine for flicker
- [ ] **Is camera firmware region-locked?** Does selecting "Region: Philippines" during setup change behavior?
- [ ] **What exact camera model is used?** Dahua confirmed but specific model/part number unknown

**Resolves at:** NJ Training — test changing video standard, see if replay breaks

### Power — 120V to 220V

PH is 220V/60Hz vs US 120V/60Hz. Same frequency, double the voltage.

- [ ] **Mac Mini PSU** — likely universal (Apple typically 100-240V), but confirm specific model
- [ ] **Unifi UDM, Switch, PDU** — likely universal (Ubiquiti typically 100-240V), but confirm specific models
- [ ] **Cameras (Dahua)** — need spec sheet for exact model
- [ ] **POE chargers** — some are 120V-only. Need exact brand/model to check voltage rating

**Risk:** Plugging 120V-only device into 220V = fried equipment.
**Resolves at:** Get exact model numbers at NJ Training, then check voltage ratings

### Hardware Specs for Local Sourcing

Need exact part numbers to source everything locally in Philippines.

- [ ] **Camera exact model and part number**
- [ ] **Mac Mini exact specs** (year, chip, RAM, storage)
- [ ] **Samsung SSD exact model and capacity**
- [ ] **POE charger exact brand/model**
- [ ] **All Unifi gear exact models** (UDM variant, switch model, PDU model)
- [ ] **Kisi controller/reader model** (if applicable)
- [ ] **Full cable/connector list** (ethernet, HDMI, SFP, power)
- [ ] **Brother label maker model** (minor)
- [ ] **Bill of Materials (BOM) template** — get a sample from an actual past deployment

**Resolves at:** NJ Training — photograph everything, get part numbers from Stan

---

## HIGH — Blocks Independence

### ISP Configuration for Philippines

- [ ] **Confirm business plan with static IP available at Tela Park location** — CGNAT on consumer plans blocks port forwarding entirely
- [ ] **PLDT Beyond Fiber confirmed as first choice** but not tested in practice yet
- [ ] **Document port 4000 forwarding procedure for PH ISP routers** (PLDT, Globe, Converge)

**Resolves at:** Tela Park site survey + ISP selection

### App Binary & Region

- [ ] **Same app binary worldwide or separate regional builds?**
- [ ] **How does `CUSTOMERNAME` config in Mosyle route to the correct backend/venue?**
- [ ] **If global app, does it auto-detect region or is routing entirely config-driven?**

**Resolves at:** NJ Training

### Cross-Venue Credits

- [ ] **Are credits locked to one venue or usable across all PodPlay facilities?** Team wants cross-venue (the Digital Wallet vision)
- [ ] **Settlement mechanics across venue owners** — if user spends credits earned at Venue A at Venue B, how does Venue B get paid?

**Resolves at:** Ask Kim and padel partners — action item from 2026-02-19 meeting

---

## MEDIUM — Needed but Not Day-1 Blocking

### Merchant / Venue Owner Experience

- [ ] **What does merchant onboarding look like end-to-end?** Sign up → configure → go live
- [ ] **What does the merchant dashboard show?** Revenue, bookings, utilization, customer data?
- [ ] **Can merchants set their own pricing?** Or admin/distributor-controlled?
- [ ] **Can merchants set their own hours of operation?** Blackout dates? Holiday schedules?
- [ ] **Can merchants add their own products?** (Coaching, merch, food — per digital wallet vision)
- [ ] **How does a merchant get paid?** What's the payout report look like?
- [ ] **Merchant permissions** — what can a merchant do vs only distributor/admin?
- [ ] **Multi-location merchants** — one account for multiple venues?
- [ ] **Merchant notifications** — notified of new bookings, cancellations, issues?

### Magpie's Own Dashboard

- [ ] **Does Magpie provide a per-merchant portal?** Transaction history, settlement tracking, analytics?
- [ ] **If so, does it overlap with or complement the PodPlay admin dashboard?**
- [ ] **What do venue owners log into to see their payment data?** PodPlay admin? Magpie portal? Both?

### Venue Discovery & Product

- [ ] **Region filtering** — does the app show all venues worldwide, or filter by country/region?
- [ ] **Venue visibility controls** — can a venue be hidden, invite-only, or soft-launched?
- [ ] **How does a new venue appear to users?** Automatically after setup, or manual go-live step?
- [ ] **Multi-sport handling** — ping pong (Ping Pod) vs pickleball (Tela Park). Sport-specific filtering?
- [ ] **Venue metadata** — what info does a venue listing show? Photos, hours, pricing, amenities?
- [ ] **Can venue owners control their listing?** Edit description, photos, hours?

### Operations & Ongoing Support

- [ ] **Remote Mac Mini access** — SSH or screen-share after deployment for support?
- [ ] **App updates** — pushed via Mosyle MDM, App Store, or manually?
- [ ] **Firmware updates** — cameras, Unifi, Mac Mini OS — who manages? Automatic or manual?
- [ ] **Monitoring & alerting** — central dashboard showing all venues' health? Notification if Mac Mini goes offline?
- [ ] **Replay clip storage** — how long are clips kept? Auto-deleted? SSD space per court per day?
- [ ] **Backup & recovery** — if Mac Mini dies, re-run deploy.py? Full reinstall?
- [ ] **Scaling process** — adding courts to existing venue? New cameras + config update, or full re-deployment?
- [ ] **Escalation path** — who to contact when things break? Stan? Chad? Support SLA?

---

## LOW — Parallel Workstreams

### Legal & Compliance

- [ ] **Finalize legal agreements** — urgently needed
- [ ] **Follow up with Cutie on legal completion**
- [ ] **Terms of service** — Philippines-specific terms needed?
- [ ] **Liability** — equipment malfunction responsibility: Pod Play or distributor?

### Digital Wallet Future Questions

- [ ] **Credit expiration** — do credits expire? Configurable?
- [ ] **Credit transfer** — can users send credits to other users?
- [ ] **Minimum load amount**
- [ ] **Multi-currency** — pesos loaded in PH usable at SGD venue in Singapore?
- [ ] **Merchant payout on cross-venue credits** — splitting mechanics with Magpie

### Meetings & Syncs TBD

- [ ] **Marco sync** — planned for week of 2026-02-23
- [ ] **Niko meeting** — pending confirmation, week of 2026-02-23
- [ ] **Number of courts at Tela Park** — TBD
- [ ] **Tela Park site survey** — needs to happen before NJ trip
- [ ] **Singapore EDB briefing** — schedule visit

---

## Resolution Map

| Resolution Path | What It Resolves | Timeline |
|---|---|---|
| **NJ Training (Mar 2-10)** | Cloud services, deployment server, PAL/NTSC, power, hardware specs, port 4000, app binary, payment routing | ~80% of critical unknowns |
| **Magpie sync** | Payment integration details, merchant dashboard, settlement | Before or just after NJ trip |
| **Kim + venue partners** | Cross-venue vs venue-locked credits, settlement mechanics | This week |
| **Tela Park site survey** | ISP availability, static IP, court count, physical layout | Before NJ trip |
| **Internal (team)** | Legal, EDB Singapore, pitch deck | Parallel workstream |

---

## Meta-Question

> **Was PodPlay built for multi-region, or is it a US-only system being stretched?**

Signs point to US-only design being adapted:
- Config guide only documents US ISPs
- Camera setup defaults to "Region: United States"
- Stripe is the only documented payment gateway
- Device enrollment says "Managed by Pingpod Inc"
- Deployment server is physically in Jersey City

The Magpie integration shows Pod Play engineering is willing to support regional differences, but the **depth** of that support (just a payment swap? or full multi-region architecture?) is the key unknown that colors every other question on this list.

---

## Counts

| Priority | Total | Resolved |
|---|---|---|
| Critical | 42 | 0 |
| High | 6 | 0 |
| Medium | 25 | 0 |
| Low | 10 | 0 |
| **Total** | **83** | **0** |

---

*Cross-references: [[PodPlay US vs PH Differences]], [[PodPlay Asia Infrastructure Analysis]], [[Pod Play NJ Trip Question Brainstorm]], [[Magpie Payment Integration Brief]], [[PodPlay Philippine ISP Networking]]*
