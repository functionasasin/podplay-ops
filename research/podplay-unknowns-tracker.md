---
date: 2026-02-20
related: [[Pod Play]], [[Pod Play SEA]], [[Magpie]], [[Digital Wallet]], [[2026-03 NJ PodPlay Training]], [[Tela Park]]
tags: [podplay, unknowns, tracker, training-prep, deployment]
---

# PodPlay Unknowns Tracker

Single source of truth for every open question blocking the Philippines deployment. Check off items as they get resolved. Organized by what blocks what.

**Last updated:** 2026-03-04 (NJ Training Day 2)

---

## CRITICAL — Blocks First Venue Deployment

### Cloud Services: Shared or Separate?

Each of these needs a "shared with US" or "separate Asia instance" answer.

- [x] **PodPlay Admin Dashboard** — do we create venues in the existing US instance or get our own?
  > RESOLVED (Day 2): Deployed by PodPlay. Telepark's dashboard is already done. PodPlay handles this.
- [x] **PodPlay Backend/API** — same servers as US? Latency ~200-300ms from PH if US-hosted
  > RESOLVED (Day 2): Same PodPlay-managed service. They're working on overseas instances — Germany had an issue and they updated/pointed backend for overseas. Cosmos just coordinates with PodPlay team.
- [x] **Mosyle MDM** — shared PingPod Inc account or own instance? Who creates device groups for PH?
  > RESOLVED (Training Day 1-2): Own separate Mosyle instance. First club (Telepark) enrolled under PodPlay's Mosyle, then migrate later by releasing devices + factory reset + re-enroll under Cosmos Mosyle. Chad confirmed: "they will also have their own MDM because this is really like a subsidiary."
- [x] **Apple Business Manager** — "Managed by Pingpod Inc" enrollment works globally or need own?
  > RESOLVED (Training Day 1-2): Need own ABM. **CURRENT BLOCKER**: Need Apple ID first → then ABM → then can enroll Apple TVs and get VPP app licenses. Nico: "I think these are two things you guys should look into this week." Ilya originally set up PodPlay's ABM.
- [ ] **FreeDNS (podplaydns.com)** — same domain for Asian venues? Own credentials?
  > PARTIALLY RESOLVED (Nico pre-training call): Can use any DDNS provider. PodPlay uses Free Afraid DDNS. Still need to confirm if using same podplaydns.com domain or setting up own.
- [ ] **1Password** — own vault or shared access to existing?
  > UNRESOLVED. Nico showed his master accounts spreadsheet during training but didn't clarify vault access for Cosmos.
- [x] **Deployment Server (Jersey City)** — accessible remotely from PH? Local-network only?
  > RESOLVED (Day 2): They'll give us access. V2 most likely — V2 allows linking from admin dashboard, much easier than V1's VPN-into-lab process. Nico offered follow-up call in ~2 weeks to walk through V2 install.
- [x] **PodPlay App (iOS/tvOS)** — same binary worldwide or regional builds?
  > RESOLVED (Training Day 1-2): Each facility gets its own branded app. Telepark gets own app, Helios gets own app, PinkPod gets own app. Developers change color palette + logos, same core. "Think of it as Intel — Intel is in HP, Intel is in Lenovo, Intel is in Dell."
- [x] **App Store / TestFlight** — how does app get distributed to PH devices?
  > RESOLVED (Training Day 1-2): Apps distributed via VPP licenses through ABM → Mosyle MDM. Not on public App Store. Need ABM to get VPP licenses. Once VPP linked to ABM, it's a one-time setup — licenses persist in Apple account, can re-up whenever.
- [x] **Unifi Account (PingPodIT)** — shared or own account?
  > RESOLVED (Training Day 1): Nico will transfer ownership. "Moselle ABM and Unified I'm going to transfer ownership to you guys."

**Resolves at:** ~~NJ Training (Mar 2-10)~~ Mostly resolved. Remaining: FreeDNS details, 1Password access.

### Payment Routing — Client Side

Backend swap (Stripe → Magpie) is done. The app-side routing is not understood.

- [x] **How does the iPad app know to route to Magpie vs Stripe?** Based on venue config? User region? Hardcoded per build?
  > RESOLVED (Training): Per-facility app. Each facility has its own app + environment config with a specific location ID (CUSTOMERNAME). Payment routing is per-venue configuration.
- [x] **Per-venue or per-region payment config?** Can individual venues within a region use different providers?
  > RESOLVED (Training): Per-venue. Each venue has its own app, own dashboard, own configuration.
- [x] **If per-build, do we need a separate Asia binary?**
  > RESOLVED (Training): Yes — each facility gets its own binary. This is standard, not Asia-specific.

**Resolves at:** ~~NJ Training — ask engineering team~~ RESOLVED.

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

> Carlos noted (Training Day 1): "the only real question marks in my head right now are regarding the app, like how does it know that it's the PH site and throughout the magpie instead of Stripe, because I haven't been able to connect with those people yet." Payment integration is outside Nico's scope — [[Marcelo]] is the developer handling it.

**Resolves at:** Magpie sync + coordinate with Marcelo/PodPlay dev team. **STILL FULLY OPEN — biggest cluster of unknowns.**

### Deployment Server

- [x] **What does `deploy.py setup <AREA_NAME>` actually produce?** macOS installer? Config bundle?
  > RESOLVED (Nico pre-training call): Creates a package with all replay service code and data. Package gets copied to new Mac Mini and deployed there. V1: VPN into lab → deployment server → enter coefficients. V2: run locally from own GitHub, coefficients entered via dashboard.
- [x] **Can it be accessed remotely from PH over the internet?** Or local-network only?
  > RESOLVED (Day 2): They'll give us access. V2 most likely. V2 can run from dashboard — no VPN needed.
- [x] **Do we get source access to `deploy.py`?** Proprietary or shared with distributors?
  > RESOLVED (Day 2): Yes, they give us access. V2 will be via GitHub.
- [x] **Can we run our own deployment server in Asia?**
  > RESOLVED (Day 2): V2 eliminates the need — runs locally / from dashboard. No need for own deployment server.

**Resolves at:** ~~NJ Training — hands-on walkthrough with Stan~~ RESOLVED. Follow-up V2 walkthrough call in ~2 weeks with Nico.

### Port 4000 Data Flow

This is the Mac Mini ↔ PodPlay cloud connection. Architecturally critical.

- [x] **What data flows over port 4000?** Health checks? Clip uploads? Real-time booking data?
  > PARTIALLY RESOLVED (Nico pre-training call + Training): Health check endpoint at `ddns:4000/health`. Replay service data flows through port 4000. Clip uploads to Google Cloud. Still unclear if booking data also flows through this.
- [ ] **Synchronous or asynchronous?** If sync and latency-sensitive, US-hosted servers + PH venues = potential issues
  > Nico pre-training call: latency ~300-400ms from PH should be OK. They're working on overseas backend instances (Day 2). Not fully answered.
- [ ] **What happens if the connection drops?** Does the venue still function? Can users still book? Can replays still play?
- [x] **Bandwidth requirements per court?** How much upload bandwidth does a venue need?
  > RESOLVED (Nico pre-training call + Training Day 1): ~105 GB/week for 6-court site. 1 Gbps is ~10x margin even for 20 cameras. Bandwidth is not a concern; latency matters more.
- [ ] **Fallback if port 4000 is blocked by ISP?** VPN tunnel? Alternative port?
  > NOTE: CGNAT blocks port forwarding entirely (kills the whole system). Must have static IP. V2 replay service uses TCP (not UDP), which may help with some ISP issues.

**Resolves at:** Partially resolved. Connection-drop behavior and ISP fallback still open.

### PAL vs NTSC

- [ ] **Does changing camera video standard to PAL break the replay pipeline?** The Node.js replay service ingests camera streams — does it care about frame rate?
- [ ] **Camera encoding settings tied to NTSC?** H.264, 1080P, 30fps, 8192 Kb/s — are these NTSC assumptions?
- [x] **Can we just leave cameras on NTSC in PH?** IP cameras likely don't care about broadcast standards. PH is 60Hz grid (same as US) so 30fps should be fine for flicker
  > LIKELY YES (Nico pre-training call): PH is 60Hz like US. IP cameras don't care about broadcast standards. 30fps should work fine.
- [ ] **Is camera firmware region-locked?** Does selecting "Region: Philippines" during setup change behavior?
- [x] **What exact camera model is used?** Dahua confirmed but specific model/part number unknown
  > PARTIALLY RESOLVED (Training): Dahua confirmed. Nico mentioned "Davao companies" for sourcing. Still need exact model/part number — photograph during training.

**Resolves at:** Still need to test PAL vs NTSC during training. Ask Nico to change video standard and see if replay breaks.

### Power — 120V to 220V

PH is 220V/60Hz vs US 120V/60Hz. Same frequency, double the voltage.

- [x] **Mac Mini PSU** — likely universal (Apple typically 100-240V), but confirm specific model
  > RESOLVED (Day 2): Not a problem. Apple PSUs are universal 100-240V.
- [x] **Unifi UDM, Switch, PDU** — likely universal (Ubiquiti typically 100-240V), but confirm specific models
  > RESOLVED (Day 2 + Nico pre-training call): Just swap the power unit (PDU). PDU is the only hardware that differs for overseas. UDM and switches are universal.
- [x] **Cameras (Dahua)** — need spec sheet for exact model
  > RESOLVED (Day 2): Not a problem — just swap the power unit. Cameras likely universal but confirm with spec sheet when model is identified.
- [x] **POE chargers** — some are 120V-only. Need exact brand/model to check voltage rating
  > RESOLVED (Day 2): Just swap the power unit. POE injectors recognized by Unifi (not the cameras/iPads directly).

**Risk:** ~~Plugging 120V-only device into 220V = fried equipment.~~ Mitigated — just swap PDU.
**Resolves at:** ~~Get exact model numbers at NJ Training, then check voltage ratings~~ RESOLVED. Just need different PDU for 220V.

### Hardware Specs for Local Sourcing

Need exact part numbers to source everything locally in Philippines.

- [ ] **Camera exact model and part number**
  > Dahua confirmed. Need to photograph exact model during training.
- [ ] **Mac Mini exact specs** (year, chip, RAM, storage)
  > Nico mentioned "$32,100" price point. Need exact year/chip/RAM.
- [x] **Samsung SSD exact model and capacity**
  > PARTIALLY RESOLVED (Training): 1TB, 2TB, or 4TB depending on court count. Auto-calculated by Chad's BOM tool. Still need exact Samsung model number.
- [ ] **POE charger exact brand/model**
- [x] **All Unifi gear exact models** (UDM variant, switch model, PDU model)
  > PARTIALLY RESOLVED (Training): UDM Pro confirmed. 24-port or 48-port switch based on court count (algorithm in Chad's BOM sheet). PDU needs to be different for 220V.
- [ ] **Kisi controller/reader model** (if applicable)
  > NOTE (Training): Kisi used for autonomous clubs. May migrate to Unifi access control. Needed for Bridgetown PinkPod 24hr setup.
- [ ] **Full cable/connector list** (ethernet, HDMI, SFP, power)
  > Training noted: Cat6 cables, SFP cables for UDM-to-switch (1 Gbps sufficient for up to 20 cameras).
- [ ] **Brother label maker model** (minor)
- [x] **Bill of Materials (BOM) template** — get a sample from an actual past deployment
  > RESOLVED (Training Day 1): Chad showed his Google Sheets MRP tool that auto-generates BOM per club based on court count + tier (Basic, Basic+, Pro, Autonomous+). He'll duplicate it for Cosmos. Includes cost analysis, hardware line items, auto-selects switch size.

**Resolves at:** Partially resolved. Still need exact model numbers for camera, Mac Mini, POE, cables. **Photograph everything before leaving NJ.**

---

## HIGH — Blocks Independence

### ISP Configuration for Philippines

- [ ] **Confirm business plan with static IP available at Tela Park location** — CGNAT on consumer plans blocks port forwarding entirely
  > NOTE (Training Day 1): Ernesto mentioned needing two ISPs with two static IPs for redundancy (for autonomous/24hr venues). "I have Converge and PLDT." Two different providers for failover. 8-10K PHP/month for static IP.
- [ ] **PLDT Beyond Fiber confirmed as first choice** but not tested in practice yet
- [ ] **Document port 4000 forwarding procedure for PH ISP routers** (PLDT, Globe, Converge)

**Resolves at:** Tela Park site survey + ISP selection

### App Binary & Region

- [x] **Same app binary worldwide or separate regional builds?**
  > RESOLVED (Training): Each facility gets its own app. Not one global binary. Developers create per-facility branded app.
- [x] **How does `CUSTOMERNAME` config in Mosyle route to the correct backend/venue?**
  > RESOLVED (Training): Each app has a specific location ID from the developers. When installing via Mosyle, the P-List contains the location ID string. Developer tells you the ID when the facility's app/environment is ready.
- [x] **If global app, does it auto-detect region or is routing entirely config-driven?**
  > RESOLVED: N/A — no global app. Each facility has its own app binary.

**Resolves at:** ~~NJ Training~~ RESOLVED.

### Cross-Venue Credits

- [ ] **Are credits locked to one venue or usable across all PodPlay facilities?** Team wants cross-venue (the Digital Wallet vision)
- [ ] **Settlement mechanics across venue owners** — if user spends credits earned at Venue A at Venue B, how does Venue B get paid?

**Resolves at:** Ask Kim and padel partners — action item from 2026-02-19 meeting

---

## MEDIUM — Needed but Not Day-1 Blocking

### Merchant / Venue Owner Experience

- [ ] **What does merchant onboarding look like end-to-end?** Sign up → configure → go live
  > NOTE (Training): HubSpot tracks onboarding pipeline. Linear still used for dev tickets. Andy (project manager) manages onboarding status. Chad may duplicate his tracking sheet for Cosmos.
- [ ] **What does the merchant dashboard show?** Revenue, bookings, utilization, customer data?
  > NOTE (Training): Each location gets its own individual dashboard with its own URL. Shows courts, camera/kiosk names, replay service config. Built separately per facility by PodPlay developers.
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

- [x] **Region filtering** — does the app show all venues worldwide, or filter by country/region?
  > RESOLVED (Training): Each facility has its own app. No "global" app to filter. Users download the specific facility's app.
- [ ] **Venue visibility controls** — can a venue be hidden, invite-only, or soft-launched?
- [ ] **How does a new venue appear to users?** Automatically after setup, or manual go-live step?
  > NOTE (Training): Developers create the app/environment. Then devices get configured and app installed via Mosyle. Go-live seems to be a manual coordination step.
- [ ] **Multi-sport handling** — ping pong (Ping Pod) vs pickleball (Tela Park). Sport-specific filtering?
  > NOTE: N/A with per-facility apps. Each facility's app is its own thing.
- [ ] **Venue metadata** — what info does a venue listing show? Photos, hours, pricing, amenities?
- [ ] **Can venue owners control their listing?** Edit description, photos, hours?

### Operations & Ongoing Support

- [x] **Remote Mac Mini access** — SSH or screen-share after deployment for support?
  > RESOLVED (Nico pre-training call + Training): Screen share via Mosyle. SSH as fallback when screen is black. Nico keeps master accounts spreadsheet with IP, login, username, password, how-to-remote for each device.
- [x] **App updates** — pushed via Mosyle MDM, App Store, or manually?
  > RESOLVED (Training Day 1): Via Mosyle MDM. App lock turns off at 2am, device restarts, update pushes at 2:30am while at home screen. Auto-install update enabled. Never disrupt play.
- [ ] **Firmware updates** — cameras, Unifi, Mac Mini OS — who manages? Automatic or manual?
  > NOTE (Training): Nico turns auto-update off on Unifi devices. Updates done manually/carefully.
- [x] **Monitoring & alerting** — central dashboard showing all venues' health? Notification if Mac Mini goes offline?
  > RESOLVED (Nico pre-training call): Google Cloud alerting pings `ddns:4000/health` every 5 min. Checks: SSD storage (<80%), memory/swap, CPU load, rename service, link/SSD status. Alerts to Slack. Can set up own Google Cloud account for own locations.
- [ ] **Replay clip storage** — how long are clips kept? Auto-deleted? SSD space per court per day?
- [x] **Backup & recovery** — if Mac Mini dies, re-run deploy.py? Full reinstall?
  > RESOLVED (Nico pre-training call + Day 2): Re-run deploy.py (V1) or re-link from dashboard (V2). V2 makes this much simpler.
- [ ] **Scaling process** — adding courts to existing venue? New cameras + config update, or full re-deployment?
- [x] **Escalation path** — who to contact when things break? Stan? Chad? Support SLA?
  > RESOLVED (Training): 3 tiers. Tier 1: PH support team (basic troubleshooting — Ernesto has a team doing this already for ~700 courts). Tier 2: Nico (hardware/config issues). Tier 3: Patrick (developer — replay service code issues). Weekly call with Patrick for outstanding issues.

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

- [x] **Marco sync** — planned for week of 2026-02-23
  > RESOLVED: Marco is on the NJ training trip.
- [x] **Niko meeting** — pending confirmation, week of 2026-02-23
  > RESOLVED: Nico pre-training call happened 2026-02-25. In-person training happening now.
- [x] **Number of courts at Tela Park** — TBD
  > RESOLVED (Training): 8 courts (Pro tier — with replay, no autonomous for Telepark). 6 courts without replay/monitors initially, but BOM being prepared for 8.
- [ ] **Tela Park site survey** — needs to happen before NJ trip
- [ ] **Singapore EDB briefing** — schedule visit

---

## Resolution Map

| Resolution Path | What It Resolves | Timeline | Status |
|---|---|---|---|
| **NJ Training (Mar 2-10)** | Cloud services, deployment server, PAL/NTSC, power, hardware specs, port 4000, app binary, payment routing | ~80% of critical unknowns | **~60% resolved as of Day 2** |
| **Magpie sync** | Payment integration details, merchant dashboard, settlement | Before or just after NJ trip | **STILL OPEN — coordinate with Marcelo** |
| **Kim + venue partners** | Cross-venue vs venue-locked credits, settlement mechanics | This week | Open |
| **Tela Park site survey** | ISP availability, static IP, court count, physical layout | Before NJ trip | Partially done (court count resolved) |
| **Internal (team)** | Legal, EDB Singapore, pitch deck | Parallel workstream | Open |

---

## Current Blockers (Day 2)

1. **Apple ID → ABM setup** — can't enroll Apple TVs or get VPP app licenses without this. Marco working on it.
2. **Magpie integration details** — 8 questions fully open. Need to connect with Marcelo / PodPlay dev team.
3. **Hardware model numbers** — still need to photograph camera, Mac Mini, POE, cables before leaving NJ.
4. **PAL vs NTSC test** — ask Nico to change camera video standard and see if replay breaks.

---

## Meta-Question

> **Was PodPlay built for multi-region, or is it a US-only system being stretched?**

~~Signs point to US-only design being adapted.~~

**UPDATED (Day 2):** Increasingly clear this is a **per-facility franchise model** that works naturally for multi-region. Each facility gets its own app, own dashboard, own environment. The backend team is actively supporting overseas instances (Germany case). The main US-only friction points are: hardware sourcing (PDU voltage), ISP config (static IP requirements), and payment gateway (Magpie swap). The architecture itself is region-agnostic because it was always per-facility.

---

## Counts

| Priority | Total | Resolved | Remaining |
|---|---|---|---|
| Critical | 42 | 27 | 15 |
| High | 6 | 3 | 3 |
| Medium | 25 | 5 | 20 |
| Low | 10 | 3 | 7 |
| **Total** | **83** | **38** | **45** |

---

## Remaining Days Priority

**Day 3:** Hardware model numbers (photograph everything). PAL vs NTSC test. Kisi/autonomous walkthrough.
**Day 4:** V2 replay service hands-on. Google Cloud alerting setup. Camera calibration walkthrough.
**Day 5 (before leaving):** Magpie questions with Chad/dev team. Confirm all account access. Get troubleshooting SOPs.

---

*Cross-references: [[PodPlay US vs PH Differences]], [[PodPlay Asia Infrastructure Analysis]], [[Pod Play NJ Trip Question Brainstorm]], [[Magpie Payment Integration Brief]], [[PodPlay Philippine ISP Networking]]*
