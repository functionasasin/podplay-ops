---
date: 2026-02-19
related: [[Pod Play]], [[Pod Play SEA]], [[Magpie]], [[Digital Wallet]], [[2026-03 NJ PodPlay Training]]
tags: [podplay, brainstorm, questions, training-prep, pre-trip]
---

# Pod Play NJ Trip — Complete Question Brainstorm

Everything we need to know before, during, and after the NJ training trip (March 2–10). Organized by category. The goal: walk in with zero ambiguity, leave with zero open questions.

---

## Current Understanding (What We Know)

### Revenue & Business
- 70/30 upcharge split (us/Pod Play) above $50 base price
- 17% Philippines withholding tax
- SEA distribution rights confirmed
- Franchise model: $100K country fee, $28K per store

### Payment
- Magpie handles GCash + credit card in Philippines (working, test booking done)
- US uses Stripe — won't work in Asia
- Magpie developing digital wallet for free (sees the platform potential)
- Money flow: ~10–15 pesos to Pod Play per 100-peso reservation, ~85 to court owner
- Settlement: manual withdrawal or auto-frequency to merchant bank account
- Credit system active per venue partner request; architecture supports direct booking too
- Wallet-to-wallet ~1.5% vs direct card ~3.5% per transaction

### Technical Architecture
- Hybrid: cloud backend (booking, accounts, payments) + on-premises per venue (replay stack)
- On-premises: Unifi network stack → Mac Mini (Node.js replay service) → cameras → iPads → Apple TVs
- Communication: Mac Mini ↔ PodPlay servers via port 4000 over internet
- DDNS via FreeDNS (podplaydns.com), cron job updates every 5 min
- Replay is local (Mac Mini → Apple TV on same VLAN) — no latency concern for playback
- Config guide v1 exists (Stan Wu, Sept 2024)

### Hardware (from Pod Play BOM — see [[podplay-hardware-bom]])
- **Network rack**: TrippLite 12-outlet PDU, UDM-SE/Pro/Pro-Max (firewall), USW-Pro-24-POE / USW-24-POE / USW-Pro-48-POE (switches), patch panels, SFP DAC cables, Cat6 patch cables (1'/3'/10') - FLAGGED
- **Replay system**: Mac Mini 16GB/256GB SSD, Samsung T7 external SSD (1TB/2TB/4TB by venue size), EmpireTech IPC-T54IR-ZE replay cameras (4MP varifocal, Dahua OEM), Flic buttons (scoring)
- **Displays**: Apple TV 4K + Ethernet, HIDEit mounts, Amazon Basics 3ft HDMI
- **Surveillance**: UNVR / UNVR-Pro (NVR), WD Purple 8TB HD, UniFi G5 Turret Ultra / G5 Dome cameras + junction boxes
- **Access control**: Kisi Controller Pro 2 + Kisi Reader Pro 2
- **Front desk**: Anker PowerConf C200 2K webcam, 2D QR barcode scanner
- **PingPod-specific**: UniFi U6-Plus Wi-Fi AP
- **Not in BOM**: Brother label maker (Q49 still open), PoE is built into UDM-SE / switches (no separate charger needed)

### What's In Progress
- Marcelo has payment instance, testing as "Cosmos" (merchant role)
- 3rd iteration of Stripe Payment Elements UI
- Tela Park (Las Piñas) identified as first venue — needs site survey
- Cross-venue vs venue-locked credits: unresolved, need Kim's input

---

## What's NOT Clear — The Gaps

### A. Venue Discovery & Region

1. **Region locking**: If I'm in the Philippines, do I see US venues in the app? Or is it filtered by region/country? How are venues scoped to a region? `→ Ernesto`
2. **How does a brand-new venue appear to users?** Automatically after setup? After a certain configuration threshold? (We control when it goes live, but what are the technical steps?) `→ Ernesto`

### B. Payment Integration

Magpie integration is done — Pod Play assigned a resource to integrate with Magpie's platform. Magpie ID is a drop-in replacement for Stripe Account ID. Payment UI is a redirect in both US and PH. Credits bypass the payment gateway for subsequent transactions. No refunds for now. Callback to Pod Play stores credits, Pod Play handles credit-to-booking.

**Remaining questions:**

3. **App-side payment routing**: Pod Play did the backend swap for PH, but how does the **app** know to route to Magpie vs Stripe? Is it based on the venue config, the user's region, or something else? How is this enforced on the client side? `→ Marcello`

### C. Merchant / Venue Owner Experience

We understand the player/user side somewhat, but the merchant side is vague.

4. **What does merchant onboarding look like end-to-end?** From signing up to first booking — what are all the steps? `→ Nico`
5. **What does the merchant dashboard show?** Revenue, bookings, utilization, customer data? `→ Nico`
6. **Can merchants set their own pricing?** Or is pricing controlled by the admin/distributor? `→ Nico`
7. **Can merchants set their own hours of operation?** Blackout dates? Holiday schedules? `→ Nico`
8. **Can merchants add their own products?** (Coaching, merch, food — per the digital wallet vision) `→ Nico`
9. **How does a merchant get paid?** What's the payout report look like? How do they reconcile? `→ Nico`
10. **Merchant permissions**: What can a merchant do vs. what can only a distributor/admin do? `→ Nico`
11. **Multi-location merchants**: Can one merchant own multiple venues under one account? `→ Nico`
12. **Merchant branding**: Can each venue have its own branding in the app, or is it all Pod Play branded? `→ Nico`
13. **Merchant notifications**: Do merchants get notified of new bookings, cancellations, issues? `→ Nico`

### D. Setup & Configuration — Philippines vs US Differences

The config guide is US-specific. What changes for Philippines?

14. **Camera region setting**: The config guide says "Region: United States" during camera setup. What happens if we select Philippines? Different firmware? Different encoding defaults? `→ Nico`
15. **ISP configuration for Philippines providers**: PLDT, Globe, Converge, Sky Fiber — the DMZ/port forwarding procedures will be different. Any tips from Pod Play on non-US ISPs? `→ Nico`
16. **Power standards**: US is 120V/60Hz, Philippines is 220V/60Hz. Do the Unifi equipment, Mac Mini, cameras, POE chargers all support 220V? Or do we need transformers? `→ Nico`
17. **Apple Business Manager**: Does the "Managed by Pingpod Inc" enrollment work in the Philippines? Or do we need our own Apple Business account for Asia? `→ Nico`
18. **Mosyle MDM**: Shared instance with US or separate instance for Asia? Who creates device groups for PH clients? `→ Nico`
19. **FreeDNS / DDNS**: Same podplaydns.com domain for Asian venues? Or separate DNS? `→ Nico`
20. **Deployment server**: The Jersey City server — can we access it remotely from the Philippines for `deploy.py`? Or do we need our own? `→ Nico`
21. **What does `deploy.py setup <AREA_NAME>` actually generate?** A macOS installer package? A config bundle? Can we inspect it? `→ Nico`
22. **Can we run our own deployment server in Asia?** Is deploy.py open-source or proprietary? `→ Nico`
23. **App binary**: Is the Pod Play iOS/tvOS app the same binary worldwide? Or are there regional builds? `→ Nico`
24. **App distribution**: Through App Store, TestFlight, or Mosyle? How does the customer ID in the Mosyle config route to the correct backend/venue? `→ Nico`

### E. Deployment & Ongoing Operations

After initial setup, how do we run this day-to-day?

25. **Remote Mac Mini access**: After deployment, can we SSH or screen-share into the Mac Mini remotely for support? `→ Nico`
26. **App updates**: How do app updates get pushed? Via Mosyle MDM, App Store, or manually? `→ Nico`
27. **Firmware updates**: Cameras, Unifi equipment, Mac Mini OS updates — who manages these? Automatic or manual? `→ Nico`
28. **Monitoring & alerting**: Is there a health monitoring dashboard? Does Pod Play get notified if a venue's Mac Mini goes offline? `→ Nico`
29. **Health check endpoint** (`/health` on port 4000) — is there a central dashboard that shows all venues' health status? Or do we have to check each one? `→ Nico`
30. **Replay clip storage**: How long are clips kept? Auto-deleted? How much SSD space per court per day? `→ Nico`
31. **Backup & recovery**: If the Mac Mini dies, what's the recovery process? Re-run deploy.py? Or full reinstall? `→ Nico`
32. **Scaling**: If a venue adds more courts later, what's the process? New cameras + update config? Or full re-deployment? `→ Nico`
33. **Escalation path**: When something breaks, who do we contact? Stan? Chad? Is there a support SLA? `→ Nico`

### F. Cross-Venue Credits & Digital Wallet

The wallet vision is big but the details are unresolved.

34. **Cross-venue credits**: If user loads credits at Venue A, can they spend at Venue B? How does settlement work across different venue owners? `→ Ernesto`
35. **Credit expiration**: Do credits expire? Configurable per venue or platform-wide? `→ Ernesto`
36. **Credit transfer**: Can users transfer credits to other users? `→ Ernesto`
37. **Refund to credits**: When a booking is cancelled, do credits go back to wallet automatically? `→ Ernesto`
38. **Credit visibility**: Can users see their credit balance in the app? Transaction history? `→ Ernesto`
39. **Merchant payout on credits**: When a user spends cross-venue credits, how does the merchant (court owner) get paid? Does Magpie handle the splitting? `→ Ernesto / Dominic`

### G. Legal & Compliance

40. **Terms of service**: Does Pod Play have standard ToS for the app? Do we need Philippines-specific terms? `→ Ernesto`
41. **Liability**: If equipment malfunctions (camera, replay, booking error), who's liable? Pod Play or distributor? `→ Ernesto`
42. **Insurance**: Is there venue insurance required? What does Pod Play recommend? `→ Ernesto`

### H. Hardware Specifics

BOM received from Pod Play — see [[podplay-hardware-bom]] for full list. Most questions answered:

43. ~~**Camera exact model and part number**~~ — **ANSWERED**: EmpireTech IPC-T54IR-ZE (4MP varifocal, Dahua OEM), white and black variants. Need to confirm Philippines sourcing availability. `→ Nico`
44. **Mac Mini exact specs** — **PARTIAL**: 16GB RAM, 256GB SSD confirmed. Still need: chip (M1? M2? M4?) and year. Important for local sourcing. `→ Nico`
45. ~~**Samsung SSD exact model and capacity**~~ — **ANSWERED**: Samsung T7 — 1TB (small club), 2TB (large club), 4TB (extra large club) `→ Nico`
46. ~~**POE charger exact brand/model**~~ — **ANSWERED**: No separate PoE charger needed. UDM-SE has built-in PoE; otherwise USW-Pro-24-POE or USW-24-POE switches provide PoE. `→ Nico`
47. ~~**All Unifi gear exact models**~~ — **ANSWERED**: UDM-SE/Pro/Pro-Max (firewall), USW-Pro-24-POE/USW-24-POE/USW-Pro-48-POE (switches), UNVR/UNVR-Pro (NVR), G5 Turret Ultra/G5 Dome/G5 Dome Ultra (cameras), U6-Plus (Wi-Fi AP) `→ Nico`
48. ~~**Kisi controller/reader model**~~ — **ANSWERED**: Kisi Controller Pro 2 + Kisi Reader Pro 2 `→ Nico`
49. **Brother label maker model** — Still unknown, not in BOM `→ Nico`
50. ~~**Bill of Materials (BOM) template**~~ — **ANSWERED**: Full BOM received, saved as [[podplay-hardware-bom]] `→ Nico`
51. ~~**Cables and connectors**~~ — **ANSWERED**: UACC-DAC-SFP10-0.5M (SFP), Cat6 1'/3'/10' (Monoprice), Amazon Basics 3ft HDMI `→ Nico`

### I. Port 4000 — What Actually Flows?

This is architecturally critical for understanding latency and reliability.

52. **What data flows over port 4000 between Mac Mini and Pod Play servers?** `→ Nico` - IMPORTANT
53. **Is it synchronous (real-time) or asynchronous (queue-based)?** `→ Nico`
54. **Is it just health checks and clip uploads? Or is there real-time booking data?** `→ Nico`
55. **What happens if the connection drops?** Does the venue still function? Can users still book? Can replays still play? `→ Nico`
56. **Bandwidth requirements**: How much upload bandwidth does a venue need? Per court? `→ Nico`
57. **Is there a fallback if port 4000 is blocked by ISP?** VPN tunnel? Alternative port? `→ Nico`

---

## Who to Route Questions To

Different people on the Pod Play side have different domains. Route questions accordingly:

| Person | Role | Knows About | Route These Questions |
|--------|------|-------------|----------------------|
| **Nico** | Setup / deployment | Hardware setup, connectivity, how things physically connect, what's owned by the app vs what's a separate server. Knows the basics of the app but may not have full visibility into all app-level features. | 14–33 (PH setup, operations), 43–51 (hardware), 52–57 (Port 4000) |
| **Marcello** | Developer (outsourced, Brazil-based) | Built the Magpie API integration. Showed Dominic a staging web app where Magpie replaces Stripe. Knows how payment routing works technically — how it hits Magpie instead of Stripe. | 3 (payment routing), technical integration questions |
| **Ernesto** | Chief Product Officer | Product-level decisions — cross-venue credits, business rules, feature scope, what the app supports and doesn't. | 34–42 (credits, legal), 1–2 (venue discovery), 4–13 (merchant experience) |
| **Dominic** | Magpie (partner side) | Magpie integration from their end. Showed the staging app screen. Trying to get us a login to understand the flow. | Magpie-specific: wallet architecture, settlement, API details |

**Notes:**
- Pod Play has developers all over the world (distributed team)
- Marcello specifically did the Magpie integration — he'd know the payment routing path
- Nico definitely knows setup but may not know everything app-side
- Dominic is trying to get us a staging login so we can see the Magpie flow ourselves

---

## Questions to Send Pod Play BEFORE the Trip

### Email 1: Venue & App Questions (Send Immediately)
- Questions 1–2 (Venue discovery, region locking) → Ernesto
- These help us understand the product from the venue perspective

### Email 2: Payment & Merchant Technical Questions (Send This Week)
- Question 3 (Payment routing) → Marcello
- Questions 4–13 (Merchant experience) → Ernesto
- Questions 34–39 (Cross-venue credits) → Ernesto
- These need engineering input — give them time to prepare

### Email 3: Infrastructure & Setup Questions (Send 1 Week Before Trip)
- Questions 14–24 (Philippines vs US setup differences) → Nico
- Questions 25–33 (Operations & deployment) → Nico
- Questions 44, 49 (Remaining hardware: Mac Mini chip/year, Brother label maker) → Nico
- Questions 52–57 (Port 4000 details) → Nico
- These are the hands-on training questions — they should prepare materials
- Note: Most hardware questions (43–51) resolved via BOM — see [[podplay-hardware-bom]]

### Things We Need to Resolve Internally (Before Trip)
- Cross-venue vs venue-locked credits → get answer from Kim and padel partners
- Tela Park site survey → send someone before the trip
- Magpie term sheet → structure this so we can discuss intelligently during training
- Pitch deck → have a draft ready showing payment capabilities

---

## What "Complete Picture" Looks Like

When all these questions are answered, we should be able to:

1. **Set up a venue from scratch in the Philippines** without any US support
2. **Onboard a new merchant** end-to-end (sign up → configure → go live)
3. **Process payments** through Magpie with the same reliability as Stripe in the US
4. **Explain to any venue owner** exactly how the system works, what they get, and what it costs
5. **Handle support issues** remotely without calling Stan or Chad
6. **Source all hardware locally** with exact part numbers
7. **Deploy the digital wallet** when ready, knowing exactly how credits flow through the system
8. **Scale to multiple venues** across Philippines and eventually other SEA markets
9. **Present to investors/partners** with a complete understanding of the technology stack

---

## Priority Matrix

| Priority | Category | Questions | Why |
|----------|----------|-----------|-----|
| **CRITICAL** | Payment routing | 3 | Blocks Magpie integration — the #1 technical risk |
| **CRITICAL** | PH vs US setup | 14–24 | Blocks first venue deployment — PAL/NTSC, power, MDM |
| ~~CRITICAL~~ **MOSTLY RESOLVED** | Hardware specs | 43–51 | BOM received. Remaining: Mac Mini chip/year (Q44), Brother label maker (Q49) |
| **CRITICAL** | Port 4000 | 52–57 | Determines if PH latency is a problem |
| **HIGH** | Venue discovery | 1–2 | Need to explain the product to venue partners |
| **HIGH** | Merchant experience | 4–13 | Need to onboard Tela Park |
| **MEDIUM** | Operations | 25–33 | Important but can learn during/after training |
| **MEDIUM** | Digital wallet | 34–39 | Important for strategy but not day-1 blocker |
| **LOW** | Legal/compliance | 40–42 | Important but separate workstream |
