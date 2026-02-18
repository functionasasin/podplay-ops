---
source: Analysis of PodPlay Configuration Guide v1.0
date: 2026-02-18
related: [[Pod Play]], [[Pod Play SEA]], [[Magpie]], [[2026-03 NJ PodPlay Training]]
tags: [podplay, infrastructure, asia, architecture, training-prep]
---

# PodPlay Asia Infrastructure Analysis

Architectural breakdown of every piece of PodPlay infrastructure, classified by whether it's shared with PodPlay US or deployed locally per venue. Created to prepare for the [[2026-03 NJ PodPlay Training]] trip.

---

## System Architecture Overview

PodPlay is a **hybrid system** — a cloud backend handles bookings/accounts/payments, while each venue has a local on-premises stack that handles instant replay recording and playback. The two communicate over port 4000 via the internet.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD (PodPlay Backend)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Admin Dash    │  │ Booking API  │  │ Payment Gateway  │  │
│  │ (Venues,     │  │ (Users,      │  │ (Stripe US /     │  │
│  │  Settings)   │  │  Reservations)│  │  Magpie Asia?)  │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────┘  │
│                           │                                  │
│  ┌──────────────┐         │                                  │
│  │ Mosyle MDM   │         │ Port 4000                        │
│  │ (Device Mgmt)│         │                                  │
│  └──────────────┘         │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ Internet
┌───────────────────────────┼──────────────────────────────────┐
│                 ON-PREMISES (Per Venue)                       │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Unifi Network Stack                     │   │
│  │  UDM Gateway ─── Switch ─── PDU                      │   │
│  │      │              │                                 │   │
│  │      │         ┌────┴────────────────┐                │   │
│  │      │         │    REPLAY VLAN      │                │   │
│  │      │         │    (192.168.32.x)   │                │   │
│  │      │         │                     │                │   │
│  │  Port 4000     │  ┌─────────────┐    │                │   │
│  │  forwarded ────┼─▶│  Mac Mini   │    │                │   │
│  │                │  │  .32.100    │    │                │   │
│  │                │  │  - Node.js  │    │                │   │
│  │                │  │  - Replay   │    │                │   │
│  │                │  │    Service  │    │                │   │
│  │                │  │  - Samsung  │    │                │   │
│  │                │  │    SSD      │    │                │   │
│  │                │  └─────────────┘    │                │   │
│  │                │                     │                │   │
│  │                │  ┌─────────────┐    │                │   │
│  │                │  │  Cameras    │    │                │   │
│  │                │  │  (Dahua?)   │    │                │   │
│  │                │  │  1 per court│    │                │   │
│  │                │  └─────────────┘    │                │   │
│  │                └─────────────────────┘                │   │
│  │                                                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐             │   │
│  │  │  iPads   │  │ Apple TVs│  │  NVR   │             │   │
│  │  │ (1/court)│  │ (1/court)│  │        │             │   │
│  │  │ POE pwrd │  │ HDMI→TV  │  │        │             │   │
│  │  └──────────┘  └──────────┘  └────────┘             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  DDNS: CUSTOMER.podplaydns.com → venue public IP             │
│  (Updated via cron on Mac Mini every 5 min)                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Infrastructure Component Breakdown

### SHARED / CLOUD (Controlled by PodPlay US)

| Component | What It Does | Asia Question |
|---|---|---|
| **PodPlay Admin Dashboard** | Venue config, court setup, user management, replay settings, Stripe config | Do we get our own instance or create venues within the existing one? Who hosts it? |
| **PodPlay Backend/API** | Booking engine, user accounts, reservation management | Same servers as US? Latency for Asia? Regional instance needed? |
| **Mosyle MDM** | Remote device management for iPads and Apple TVs, pushes app configs and updates | Own instance or shared PingPod Inc account? Who creates device groups for Asian clients? |
| **Apple Business Manager** | Device enrollment — shows "managed by Pingpod Inc" during setup | Need own Apple Business account for Asia? Or does PingPod enrollment work globally? |
| **FreeDNS (podplaydns.com)** | Dynamic DNS so each venue's Mac Mini is reachable by hostname | Same domain for Asia? Own credentials? Or separate DNS solution? |
| **1Password** | Shared credentials vault for all service accounts | Own vault or shared access? |
| **Deployment Server (Jersey City)** | Builds per-client software packages via `deploy.py`, hosts assets | Can this be accessed remotely from PH? Do we need our own? What does it actually generate? |
| **PodPlay App (iOS/tvOS)** | The customer-facing app on iPads and Apple TVs | Same binary worldwide? Or separate Asia build? How does customer ID config route to correct backend? |
| **Stripe** | Payment processing for US venues | **NOT usable in Asia.** Need [[Magpie]] or alternative. See Payment section below. |

### LOCAL / PER-VENUE (Deployed On-Site)

| Component | What It Does | Asia Consideration |
|---|---|---|
| **Unifi Dream Machine (UDM)** | Gateway/router/firewall, VLAN management | Source locally. Need PingPodIT Unifi account or own? |
| **Unifi Switch** | Network switch for all venue devices | Source locally |
| **Unifi PDU** | Power distribution unit, labeled outlets | Source locally |
| **Unifi NVR** | Network video recorder (if surveillance ordered) | Source locally |
| **Mac Mini** | Runs replay service (Node.js), stores clips on SSD | Source locally. Exact specs needed. |
| **Samsung SSD** | External storage for replay video clips | Source locally. Exact model needed. |
| **Cameras (Dahua?)** | One per court, records to Mac Mini for instant replay | **PAL vs NTSC issue.** Philippines/Asia uses PAL. Confirm compatibility. Exact model needed. Firmware region-locked? |
| **iPads** | One per court, customer-facing booking/replay interface | Source locally. POE charger model needed. |
| **Apple TVs** | One per court, displays instant replays on TV | Source locally |
| **POE Chargers** | Powers iPads via ethernet | Exact brand/model needed |
| **Brother Label Machine** | Labels for courts, ports, PDU outlets | Source locally |
| **Kisi Controller/Reader** | Access control (if ordered) | Source locally |

---

## Critical Asia-Specific Issues

### 1. Payment Integration (HIGHEST PRIORITY)

Stripe is the US payment gateway. It won't work for Philippines deployments. Current status:
- [[Magpie]] has working GCash + credit card integration for Philippines
- Magpie's regulatory license is Philippines-only but they have counterpart partners in other Asian markets
- The admin dashboard has a "Stripe Account ID" field — **need to understand if payment gateway is configurable or hardcoded**

**Questions for Magpie / payments team:**
- What API endpoints does PodPlay call for payment processing?
- Is the payment integration a pluggable module, or is Stripe deeply wired in?
- Does Magpie need to implement the same API contract as Stripe, or is there an abstraction layer?
- What does PodPlay need from a payment provider? (charge, refund, webhook for confirmation?)
- Can venue-level payment config point to different gateways per region?
- How do the cross-facility credits ([[Digital Wallet]]) interact with the payment gateway?

**Questions for PodPlay during training:**
- Show me exactly where in the codebase/config payment processing is triggered
- Is there a payment provider abstraction, or is it Stripe SDK calls throughout?
- What would it take to support a second payment provider?
- Can the admin dashboard Stripe Account ID field be repurposed for another provider?

### 2. Video Standard (PAL vs NTSC)

The config guide specifies **NTSC** (US standard). Most Asian countries including the Philippines use **PAL**.
- Does the replay service on the Mac Mini care about the video standard?
- Does changing to PAL affect frame rate (25fps PAL vs 30fps NTSC)?
- If frame rate changes, does that break the instant replay processing pipeline?
- Are the camera encoding settings (H.264, 1080P, 30fps, 8192 Kb/s) tied to NTSC?

### 3. Deployment Server Access

The guide says "connect to the Deployment server in Jersey City" during Mac Mini setup. This is a critical dependency.
- Can the deployment server be reached remotely from the Philippines?
- What does `deploy.py setup <AREA_NAME>` actually generate? A macOS installer package?
- Is the deploy script proprietary or shared with distributors?
- Is there source code access, or is it a black box?
- Can we run our own deployment server in Asia for faster turnaround?

### 4. ISP Compatibility

The guide only documents US ISPs (Verizon, Optimum, Spectrum, Google Fiber). Philippines ISPs:
- **PLDT** (most common fiber)
- **Globe** (fiber and LTE)
- **Converge** (fiber)
- **Sky Fiber**

Need to document DMZ/port forwarding procedures for these ISPs. The core requirement is simple (port 4000 forwarded to UDM, then to Mac Mini), but ISP router admin interfaces vary.

### 5. Latency

If the PodPlay backend is US-hosted:
- Booking/account operations: ~200-300ms latency from PH to US — probably acceptable
- Instant replay: **Local only** (Mac Mini to Apple TV on same VLAN) — no latency issue
- Mac Mini ↔ PodPlay servers (port 4000): What traffic goes over this? Just health checks and clip uploads? Or real-time data?

**Key question:** What exactly does the port 4000 communication carry? If it's just health checks and async clip uploads, latency is fine. If it's synchronous and part of the replay flow, there could be issues.

---

## Account Access Matrix

Confirm during training which accounts are shared vs. need separate instances:

| Account / Service | Shared with US? | Own Instance? | Status | Notes |
|---|---|---|---|---|
| Mosyle (MDM) | ? | ? | ❓ Ask | Device management for iPads & Apple TVs |
| FreeDNS (podplaydns.com) | ? | ? | ❓ Ask | DDNS for Mac Mini reachability |
| 1Password | ? | ? | ❓ Ask | Shared credentials |
| PingPodIT Unifi Account | ? | ? | ❓ Ask | UDM setup and management |
| PodPlay Admin Dashboard | ? | ? | ❓ Ask | Venue/court/replay configuration |
| Apple Business Manager | ? | ? | ❓ Ask | Device enrollment |
| Deployment Server | ? | ? | ❓ Ask | Package building |
| Stripe / Payment Gateway | Shared | Own (Magpie) | ✅ Known | Asia uses [[Magpie]], not Stripe |
| App Store / TestFlight | ? | ? | ❓ Ask | How app gets distributed |

---

## Questions Prioritized for Training

### Must Answer (Blocking for Asia Deployment)

1. **Payment abstraction**: Is the payment gateway pluggable? What API contract does a provider need to implement?
2. **Deployment server**: Can it be accessed remotely? Do we need our own? What does it produce?
3. **PAL compatibility**: Does changing video standard to PAL break anything in the replay pipeline?
4. **Account access**: Which accounts do we share, which do we need our own instances of?
5. **Hardware specs**: Exact model numbers for cameras, Mac Mini, SSD, POE chargers, all Unifi gear
6. **Port 4000 traffic**: What data flows between Mac Mini and PodPlay servers? Sync or async?

### Should Answer (Important for Operations)

7. **App distribution**: Same binary for all regions? How does customer ID config route correctly?
8. **Remote Mac Mini access**: SSH/screen sharing after deployment for support?
9. **App updates**: Pushed via Mosyle or App Store?
10. **Backend latency**: Any plans for regional server infrastructure?
11. **Camera firmware**: Region-locked? Specific version required?
12. **ISP documentation**: Any tips for non-US ISP router configuration?

### Nice to Have (Operational Efficiency)

13. **Installer training**: Can we train our own installers using the config guide?
14. **BOM template**: Get a sample Bill of Materials template
15. **Escalation path**: Who do we contact when something breaks?
16. **Software licensing**: What's the licensing model for Asia?

---

## What to Tell the Magpie/Payments Team

Before or right after the NJ trip, the payments team needs to understand:

1. **PodPlay uses Stripe in the US** — we need to understand the exact API surface (endpoints, webhooks, data model)
2. **Question**: Does Magpie's existing integration already cover what PodPlay needs? Or is there additional work?
3. **The admin dashboard has a Stripe Account ID field** — can this be configured per-venue to point to Magpie instead?
4. **Refund flow**: PodPlay likely expects refund capability — Magpie has the one-way e-wallet limitation in PH
5. **Cross-facility credits**: The [[Digital Wallet]] concept may need to work across the payment integration
6. **Webhooks**: PodPlay almost certainly uses Stripe webhooks for payment confirmation — Magpie needs to support equivalent callbacks

Get the PodPlay team to share (or walk through during training):
- Their Stripe integration code / API calls
- The webhook events they listen for
- The payment data model (what gets stored, how it ties to bookings)
- Whether there's any payment provider abstraction layer
