---
date: 2026-02-20
related: [[Pod Play]], [[Pod Play SEA]], [[Magpie]], [[2026-03 NJ PodPlay Training]]
tags: [podplay, infrastructure, philippines, comparison, training-prep]
---

# PodPlay US vs Philippines — What's Different

Quick reference of every infrastructure difference between a US venue and a PH venue. Organized by confidence level: what's resolved, what's known-different but unresolved, and what's completely unknown.

---

## RESOLVED — We Know What's Different and How to Handle It

| Area | US Setup | PH Setup | Status |
|------|----------|----------|--------|
| **Payment gateway** | Stripe | [[Magpie]] (GCash + credit cards) | ✅ Magpie integrated. Pod Play swapped Stripe Account ID for Magpie ID on backend. Test booking done ("Cosmos" merchant) |
| **Payment UI** | Stripe redirect | Magpie redirect | ✅ Same pattern — redirect-based in both regions |
| **Refunds** | Stripe refunds to original payment method | No refunds (e-wallet one-way limitation in PH) | ✅ Known constraint. Credits used instead |
| **Tax** | US tax structure | 17% Philippine withholding tax | ✅ Known. Magpie said they'll build whatever tax logic we specify |
| **Transaction fees** | Stripe rates | Wallet-to-wallet ~1.5%, direct card ~3.5% | ✅ Known |
| **Money flow** | Stripe → Pod Play → venue owner | ~10-15 pesos to Pod Play per 100-peso reservation, ~85 to court owner | ✅ Understood |
| **Timezone** | US timezone (per venue) | Asia/Manila (UTC+8) | ✅ Just a config value in camera setup and dashboard |
| **ISP providers** | Verizon, Optimum, Spectrum, Google Fiber | PLDT, Globe, Converge, Sky Fiber | ✅ PH ISP research done (see [[PodPlay Philippine ISP Networking]]) |
| **ISP recommendation** | Varies by region | PLDT Beyond Fiber (free static IP, best documented) | ✅ Researched. Converge FlexiBIZ Peak second choice |
| **Hardware sourcing** | Shipped from Pod Play (Jersey City) | Source everything locally in Philippines | ✅ Known — but need exact model numbers (see UNKNOWN section) |
| **Pricing currency** | USD | PHP | ✅ Upcharge model: $50 base + whatever we set above that |

---

## KNOWN DIFFERENT — But Not Yet Confirmed How to Handle

These are things we **know** will be different, but we don't have confirmation yet on whether the system supports the change or what exactly to do.

### 1. Video Standard: NTSC → PAL (CRITICAL)

- **US**: Cameras configured with `Video Standard: NTSC`, 30fps
- **PH**: Philippines uses PAL standard (25fps)
- **Unknown**: Does changing to PAL break the replay pipeline on the Mac Mini? The Node.js replay service ingests camera streams — does it care about frame rate?
- **Unknown**: Are the camera encoding settings (H.264, 1080P, 30fps, 8192 Kb/s) hardcoded to NTSC assumptions?
- **Unknown**: Can we just leave it on NTSC even in PH? Cameras may not care about broadcast standards
- **Risk**: If PAL means 25fps but the replay service expects 30fps, instant replays could break
- **When to resolve**: NJ training trip

### 2. Camera Region Setting

- **US**: Camera initial setup → `Region: United States`
- **PH**: What happens if we select `Philippines`? Different firmware? Different encoding defaults?
- **Unknown**: Is this just a cosmetic label or does it change camera behavior?
- **Unknown**: Is the camera firmware region-locked?
- **When to resolve**: NJ training trip — ask Stan

### 3. Power Standard

- **US**: 120V/60Hz
- **PH**: 220V/60Hz (same frequency, double the voltage)
- **Unknown**: Do all these components support 220V natively?
  - Mac Mini — likely yes (Apple uses universal PSUs)
  - Unifi UDM, Switch, PDU — likely yes (Ubiquiti typically 100-240V)
  - Cameras (Dahua?) — need to check spec sheet
  - POE chargers — **need to confirm**, some are 120V-only
- **Risk**: Plugging a 120V-only device into 220V = fried equipment
- **When to resolve**: Get exact model numbers at NJ training, then check voltage ratings

### 4. ISP Router Configuration Procedures

- **US**: Config guide documents Verizon, Optimum, Spectrum, Google Fiber DMZ/port-forward steps
- **PH**: Need PLDT, Globe, Converge procedures for port 4000 forwarding
- **Status**: PH ISP research is done (router admin IPs, CGNAT status, static IP availability) but **not tested in practice yet**
- **Risk**: CGNAT on consumer plans blocks port forwarding entirely — must use business plan with static IP
- **When to resolve**: During Tela Park site survey / ISP selection

### 5. App Payment Routing (Client-Side)

- **Backend**: Pod Play swapped Stripe for Magpie on the backend — done
- **Unknown**: How does the **app** (on iPad) know to route to Magpie vs Stripe? Is it:
  - Based on venue config in the admin dashboard?
  - Based on the user's region/device locale?
  - Hardcoded per app build?
- **Risk**: If it's per-app-build, we'd need a separate Asia binary
- **When to resolve**: NJ training trip — ask engineering team

---

## UNKNOWN — Don't Know If It's Different or How It Works

These are infrastructure components where we don't know if US and PH share the same instance, need separate instances, or if the system even supports multi-region at all.

### Cloud Services — Shared or Separate?

| Service | What It Does | Shared with US? | Own Instance? | Risk If Wrong |
|---------|-------------|-----------------|---------------|---------------|
| **PodPlay Admin Dashboard** | Venue/court config, replay settings, user management | ❓ Unknown | ❓ Unknown | Can't configure venues |
| **PodPlay Backend/API** | Booking engine, user accounts, reservations | ❓ Unknown | ❓ Unknown | Latency if US-hosted (~200-300ms from PH) |
| **Mosyle MDM** | Remote management of iPads and Apple TVs | ❓ Unknown | ❓ Unknown | Can't enroll or manage devices |
| **Apple Business Manager** | Device enrollment ("Managed by Pingpod Inc") | ❓ Unknown | ❓ Unknown | iPads/Apple TVs won't auto-configure during setup |
| **FreeDNS (podplaydns.com)** | DDNS for Mac Mini reachability | ❓ Unknown | ❓ Unknown | Mac Mini unreachable from cloud |
| **1Password** | Shared credentials | ❓ Unknown | ❓ Unknown | Locked out of service accounts |
| **Deployment Server (Jersey City)** | Builds per-client software via `deploy.py` | ❓ Unknown | ❓ Unknown | Can't create Mac Mini install packages |
| **PodPlay App (iOS/tvOS)** | Customer-facing app on iPads and Apple TVs | ❓ Unknown | ❓ Unknown | App may not work in PH if region-locked |
| **App Store / TestFlight** | App distribution | ❓ Unknown | ❓ Unknown | Can't install app on venue devices |
| **Unifi Account (PingPodIT)** | UDM setup and management | ❓ Unknown | ❓ Unknown | Can't configure networking |

### Deployment Server Access

- **US**: Installer connects to deployment server in Jersey City, runs `deploy.py setup <AREA_NAME>`, downloads a package
- **PH**: Can this be done remotely over the internet from Manila? Or is it local-network only?
- **Unknown**: What does `deploy.py` actually produce? macOS installer? Config bundle?
- **Unknown**: Is `deploy.py` proprietary or do we get source access?
- **Unknown**: Can we run our own deployment server in Asia?

### Port 4000 — What Actually Flows?

- This is the Mac Mini ↔ PodPlay cloud connection
- **Unknown**: Is it synchronous (real-time) or asynchronous (queue-based)?
- **Unknown**: Just health checks + clip uploads? Or real-time booking data?
- **Unknown**: What happens if the connection drops? Does the venue still function?
- **Unknown**: Bandwidth requirements per court?
- **Impact**: If it's latency-sensitive synchronous traffic, US-hosted servers + PH venues = potential issues. If async, no problem.

### App Binary & Distribution

- **Unknown**: Same app binary worldwide or separate regional builds?
- **Unknown**: How does the customer ID config in Mosyle (`<string>CUSTOMERNAME</string>`) route to the correct backend?
- **Unknown**: If there's one global app, does it auto-detect region? Or does the config determine everything?

---

## SAME — Should Be Identical in Both Regions

| Component | Notes |
|-----------|-------|
| **On-premises network architecture** | Same Unifi stack, same VLAN (192.168.32.x), same port 4000 forwarding |
| **Mac Mini replay service** | Same Node.js service, same SSD storage, same cache folder structure |
| **DDNS cron job** | Same FreeDNS update pattern (curl every 5 min) |
| **Device labeling** | Same court numbering (C1, C2...), same labeling process |
| **Replay flow** | Same local path: Camera → Mac Mini → Apple TV (all on VLAN, no internet needed) |
| **Admin dashboard configuration** | Same on-premises API URL format, same venue/court setup |
| **Testing procedure** | Same `/health` endpoint, same operations reservation test, same replay test |

---

## What to Prioritize at NJ Training

Based on the gaps above, here's what's most urgent to resolve during the March 2-10 trip:

### Day 1 Priorities (Blocks Everything Else)

1. **Payment routing on client side** — how does the app know Magpie vs Stripe?
2. **Deployment server** — can we access remotely? What does it produce? Can we run our own?
3. **Account access** — which accounts are shared, which need separate instances?

### Day 2-3 Priorities (Blocks First Venue)

4. **PAL vs NTSC** — test changing video standard, see if replay breaks
5. **Camera model + region setting** — get exact model, test PH region setting
6. **Power voltage** — confirm all hardware specs support 220V
7. **Port 4000 data flow** — understand what's sync vs async

### Before Leaving (Blocks Independence)

8. **Hardware BOM with exact model numbers** — so we can source locally
9. **deploy.py walkthrough** — understand the full package creation flow
10. **Escalation contacts and support process** — who to call when things break

---

## Open Question: Is There a "Region" Concept at All?

The biggest meta-question is whether PodPlay was built with multi-region in mind or if it's a US-only system being stretched internationally. Signs point to **US-only design being adapted**:

- Config guide only documents US ISPs
- Camera setup defaults to "Region: United States"
- Stripe is the only documented payment gateway
- "Managed by Pingpod Inc" on device enrollment
- Deployment server is physically in Jersey City

The Magpie integration suggests Pod Play engineering is willing to support regional differences, but the depth of that support (just payment swap? or full multi-region architecture?) is the key unknown.
