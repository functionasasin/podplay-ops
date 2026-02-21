---
date: 2026-02-21
related: [[Pod Play]], [[Pod Play SEA]], [[Magpie]], [[Digital Wallet]], [[2026-03 NJ PodPlay Training]]
tags: [podplay, architecture, diagram, reference]
---

# Pod Play — Full System Diagram

High-level map of every component across cloud, US venues, and Asia (Philippines) deployment. Items marked `[?]` are unresolved unknowns.

---

## The Big Picture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     POD PLAY CLOUD                                            │
│                                  (US-hosted servers)                                          │
│                                                                                              │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────────────────────┐   │
│  │   ADMIN DASHBOARD    │   │    BOOKING API       │   │        PAYMENT GATEWAY           │   │
│  │                     │   │                     │   │                                  │   │
│  │ • Venue config      │   │ • User accounts     │   │  US: Stripe ──────────────────┐  │   │
│  │ • Court setup       │   │ • Reservations      │   │                               │  │   │
│  │ • Replay settings   │   │ • Credits/wallet    │   │  Asia: Magpie ─────────────┐  │  │   │
│  │ • Stripe/Magpie ID  │   │ • Merchant payouts  │   │   • GCash                  │  │  │   │
│  │ • User management   │   │   [?] latency for   │   │   • Credit cards            │  │  │   │
│  │                     │   │   PH ~200-300ms     │   │   • Digital wallet (future) │  │  │   │
│  │ [?] shared instance │   │   [?] regional      │   │                               │  │   │
│  │ or own for Asia?    │   │   instance?          │   │  [?] how does app know which │  │   │
│  └─────────────────────┘   └──────────┬──────────┘   │  gateway? venue config?       │  │   │
│                                       │              │  region? per-build?            │  │   │
│                                       │              └──────────────────────────────────┘   │
│                                       │                                                      │
│  ┌─────────────────────┐   ┌─────────┴─────────┐   ┌──────────────────────────────────┐   │
│  │   MOSYLE MDM         │   │   FREEDNS          │   │     DEPLOYMENT SERVER            │   │
│  │                     │   │                     │   │     (Jersey City, NJ)            │   │
│  │ • Device enrollment │   │ • podplaydns.com    │   │                                  │   │
│  │ • App push/config   │   │ • A records per     │   │ • deploy.py setup <AREA>         │   │
│  │ • iPad/Apple TV     │   │   venue             │   │ • Builds Mac Mini packages       │   │
│  │   groups            │   │ • TTL 60s           │   │ • Hosts logo/asset uploads       │   │
│  │                     │   │                     │   │                                  │   │
│  │ [?] shared PingPod  │   │ [?] same domain     │   │ [?] accessible remotely from PH? │   │
│  │ account or own?     │   │ for Asia venues?    │   │ [?] what does it produce?        │   │
│  └─────────────────────┘   └─────────────────────┘   │ [?] can we run our own in Asia?  │   │
│                                                       │ [?] proprietary or shared?       │   │
│  ┌─────────────────────┐   ┌─────────────────────┐   └──────────────────────────────────┘   │
│  │  APPLE BUSINESS MGR  │   │    APP STORE /       │                                        │
│  │                     │   │    TESTFLIGHT         │                                        │
│  │ • "Managed by       │   │                     │                                        │
│  │   Pingpod Inc"      │   │ • PodPlay iOS app    │                                        │
│  │ • Device enrollment │   │ • PodPlay tvOS app   │                                        │
│  │                     │   │                     │                                        │
│  │ [?] works globally  │   │ [?] same binary      │                                        │
│  │ or need own account │   │ worldwide or         │                                        │
│  │ for Asia?           │   │ regional builds?     │                                        │
│  └─────────────────────┘   └─────────────────────┘                                          │
│                                                                                              │
│  ┌─────────────────────┐   ┌─────────────────────┐                                          │
│  │    1PASSWORD         │   │  UNIFI ACCOUNT       │                                          │
│  │                     │   │  (PingPodIT)         │                                          │
│  │ • Service creds     │   │ • Remote UDM mgmt   │                                          │
│  │ • ISP logins        │   │ • Firmware updates   │                                          │
│  │ • FreeDNS creds     │   │                     │                                          │
│  │                     │   │ [?] shared or own    │                                          │
│  │ [?] shared or own   │   │ for Asia?            │                                          │
│  │ vault for Asia?     │   │                     │                                          │
│  └─────────────────────┘   └─────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                        │                                 │
                        │ Port 4000 (TCP/UDP)              │ Port 4000 (TCP/UDP)
                        │ via internet                     │ via internet
                        │                                 │
                        │ [?] what data flows?             │ [?] ~200-300ms latency
                        │ [?] sync or async?               │ from PH — is this OK?
                        │ [?] bandwidth per court?         │ [?] fallback if port
                        │ [?] what if connection drops?    │ 4000 blocked?
                        ▼                                 ▼
┌──────────────────────────────────┐    ┌──────────────────────────────────────────────────┐
│      US VENUE (On-Premises)       │    │      PH VENUE (On-Premises)                       │
│      e.g. PingPod NJ              │    │      e.g. Tela Park, Las Piñas                    │
│                                  │    │                                                    │
│  ┌────────────────────────────┐  │    │  ┌────────────────────────────────────────────┐   │
│  │      ISP ROUTER             │  │    │  │      ISP ROUTER                             │   │
│  │  Verizon / Optimum /        │  │    │  │  PLDT Beyond Fiber (recommended)            │   │
│  │  Spectrum / Google Fiber    │  │    │  │  Globe GFiber Biz / Converge FlexiBIZ       │   │
│  │                            │  │    │  │                                             │   │
│  │  Static IP or DMZ          │  │    │  │  MUST have business plan + static IP         │   │
│  │  → port 4000 forwarded     │  │    │  │  (residential plans use CGNAT — blocks       │   │
│  │                            │  │    │  │   all incoming connections)                   │   │
│  └────────────┬───────────────┘  │    │  │                                             │   │
│               │                  │    │  │  DMZ → UDM, or bridge mode                   │   │
│               ▼                  │    │  │  Port 4000 forwarded to UDM                  │   │
│  ┌────────────────────────────┐  │    │  └──────────────┬──────────────────────────────┘   │
│  │   UNIFI NETWORK STACK      │  │    │                 │                                  │
│  │                            │  │    │                 ▼                                  │
│  │  UDM-SE / Pro / Pro-Max    │  │    │  ┌────────────────────────────────────────────┐   │
│  │   (gateway/firewall)       │  │    │  │   UNIFI NETWORK STACK                       │   │
│  │        │                   │  │    │  │                                             │   │
│  │  USW-Pro-24-POE / 48-POE   │  │    │  │  UDM-SE / Pro / Pro-Max                     │   │
│  │   (PoE switch)             │  │    │  │   (gateway/firewall)                        │   │
│  │        │                   │  │    │  │        │                                    │   │
│  │  TrippLite RS-1215-RA      │  │    │  │  USW-Pro-24-POE / 48-POE                    │   │
│  │   (12-outlet PDU)          │  │    │  │   (PoE switch)                              │   │
│  │        │                   │  │    │  │        │                                    │   │
│  │  Patch Panels + SFP DAC    │  │    │  │  TrippLite RS-1215-RA (PDU)                 │   │
│  └────────┼───────────────────┘  │    │  │  Patch Panels + SFP DAC                     │   │
│           │                      │    │  │                                             │   │
│     ┌─────┴──────────────┐       │    │  │  [?] 220V/60Hz — all gear likely             │   │
│     │                    │       │    │  │  100-240V but confirm per model              │   │
│     ▼                    ▼       │    │  └────────┬────────────────────────────────────┘   │
│  ┌──────────────┐  ┌─────────┐  │    │            │                                       │
│  │ REPLAY VLAN  │  │OPTIONAL │  │    │      ┌─────┴───────────────┐                       │
│  │ 192.168.32.x │  │ VLANs   │  │    │      │                    │                       │
│  │              │  │         │  │    │      ▼                    ▼                       │
│  │              │  │ .31     │  │    │  ┌──────────────┐  ┌─────────────────┐             │
│  │              │  │ Surveil │  │    │  │ REPLAY VLAN  │  │ OPTIONAL VLANs  │             │
│  │              │  │         │  │    │  │ 192.168.32.x │  │                 │             │
│  │              │  │ .33     │  │    │  │              │  │ .31 Surveillance│             │
│  │              │  │ Access  │  │    │  │              │  │ .33 Access Ctrl │             │
│  │              │  │ Control │  │    │  │              │  │                 │             │
│  └──────┬───────┘  └─────────┘  │    │  └──────┬───────┘  └─────────────────┘             │
│         │                        │    │         │                                          │
│         ▼                        │    │         ▼                                          │
│  ┌─────────────────────────┐    │    │  ┌─────────────────────────────────────────┐       │
│  │      MAC MINI            │    │    │  │      MAC MINI                            │       │
│  │      192.168.32.100      │    │    │  │      192.168.32.100                      │       │
│  │                         │    │    │  │                                          │       │
│  │  • Node.js replay svc   │    │    │  │  • Node.js replay service                │       │
│  │  • Samsung T7 SSD        │    │    │  │  • Samsung T7 SSD (1/2/4 TB)             │       │
│  │    (clip storage)        │    │    │  │    (clip storage)                        │       │
│  │  • DDNS cron (5 min)     │    │    │  │  • DDNS cron (5 min)                     │       │
│  │  • cache/ folder         │    │    │  │  • cache/ folder                         │       │
│  │  • Full Disk Access:     │    │    │  │                                          │       │
│  │    Find, Node            │    │    │  │  [?] Mac Mini chip — M1? M2? M4?         │       │
│  │  • Port 4000 ←→ cloud    │    │    │  │  16GB RAM, 256GB SSD confirmed           │       │
│  │                         │    │    │  │  • Port 4000 ←→ cloud                    │       │
│  └─────────┬───────────────┘    │    │  └─────────┬────────────────────────────────┘       │
│            │                     │    │            │                                        │
│    ┌───────┼───────────┐         │    │    ┌───────┼───────────┐                            │
│    │       │           │         │    │    │       │           │                            │
│    ▼       ▼           ▼         │    │    ▼       ▼           ▼                            │
│  ┌─────┐ ┌──────┐ ┌────────┐   │    │  ┌─────┐ ┌──────┐ ┌────────┐                       │
│  │CAM  │ │iPad  │ │AppleTV │   │    │  │CAM  │ │iPad  │ │AppleTV │                       │
│  │     │ │      │ │        │   │    │  │     │ │      │ │        │                       │
│  │1 per│ │1 per │ │1 per   │   │    │  │1 per│ │1 per │ │1 per   │                       │
│  │court│ │court │ │court   │   │    │  │court│ │court │ │court   │                       │
│  │     │ │      │ │        │   │    │  │     │ │      │ │        │                       │
│  │Empir│ │PoE   │ │HDMI →  │   │    │  │Empir│ │PoE   │ │HDMI →  │                       │
│  │eTech│ │pwrd  │ │TV/     │   │    │  │eTech│ │pwrd  │ │TV/     │                       │
│  │IPC- │ │via   │ │Monitor │   │    │  │IPC- │ │via   │ │Monitor │                       │
│  │T54IR│ │switch│ │HIDEit  │   │    │  │T54IR│ │switch│ │HIDEit  │                       │
│  │-ZE  │ │      │ │mount   │   │    │  │-ZE  │ │      │ │mount   │                       │
│  └─────┘ └──────┘ └────────┘   │    │  └─────┘ └──────┘ └────────┘                       │
│                                  │    │                                                    │
│  OPTIONAL PER VENUE:             │    │  [?] Camera region: leave NTSC or switch to PAL?   │
│  ┌──────────────────────────┐   │    │  [?] Does PAL (25fps) break replay pipeline?        │
│  │ SURVEILLANCE              │   │    │  [?] Camera firmware region-locked?                 │
│  │ UNVR/UNVR-Pro (NVR)      │   │    │                                                    │
│  │ WD Purple 8TB HDs         │   │    │  OPTIONAL PER VENUE:                               │
│  │ G5 Turret Ultra /         │   │    │  ┌──────────────────────────────────────────────┐  │
│  │ G5 Dome cameras           │   │    │  │ SURVEILLANCE, ACCESS CONTROL, FRONT DESK     │  │
│  ├──────────────────────────┤   │    │  │ (same as US — source locally)                 │  │
│  │ ACCESS CONTROL            │   │    │  │                                              │  │
│  │ Kisi Controller Pro 2     │   │    │  │ [?] Kisi ships to PH?                        │  │
│  │ Kisi Reader Pro 2         │   │    │  │ [?] EmpireTech cameras available in PH?      │  │
│  ├──────────────────────────┤   │    │  │ [?] Flic buttons available in PH?             │  │
│  │ FRONT DESK                │   │    │  └──────────────────────────────────────────────┘  │
│  │ Anker C200 webcam         │   │    │                                                    │
│  │ 2D QR barcode scanner     │   │    │  DDNS: CUSTOMER.podplaydns.com → venue public IP   │
│  ├──────────────────────────┤   │    │  ISP: Business plan + static IP (mandatory)         │
│  │ PINGPOD-SPECIFIC          │   │    │                                                    │
│  │ UniFi U6-Plus Wi-Fi AP    │   │    │  220V/60Hz power (vs US 120V/60Hz)                 │
│  └──────────────────────────┘   │    │  PHP currency (vs USD)                              │
│                                  │    │  Magpie payments (vs Stripe)                        │
│  DDNS: CUSTOMER.podplaydns.com   │    │                                                    │
│  → venue public IP               │    └──────────────────────────────────────────────────────┘
└──────────────────────────────────┘
```

---

## Data Flow: How a Replay Works

```
User taps "Replay" on iPad
        │
        ▼
iPad → Mac Mini (192.168.32.100:4000, local VLAN)
        │
        ▼
Mac Mini reads clip from Samsung SSD cache
        │
        ▼
Mac Mini → Apple TV (same VLAN, local streaming)
        │
        ▼
Apple TV displays replay on court monitor

*** ALL LOCAL — no internet needed for replay playback ***
```

---

## Data Flow: How a Booking Works

```
User opens PodPlay app (phone or web)
        │
        ▼
App → PodPlay Booking API (cloud, US-hosted)
        │
        ├── US venue → Stripe payment redirect
        │                   │
        │                   ▼
        │              Stripe processes → webhook → PodPlay confirms booking
        │
        └── PH venue → Magpie payment redirect
                            │
                            ▼
                       Magpie processes (GCash / credit card)
                            │
                            ▼
                       Callback → PodPlay confirms booking
                            │
                            ▼
                       Credits stored in PodPlay (subsequent bookings skip gateway)
```

---

## Data Flow: Port 4000 (Mac Mini ↔ Cloud)

```
PodPlay Cloud Servers
        │
        │  Port 4000 (TCP/UDP) over internet
        │
        │  [?] WHAT FLOWS HERE:
        │  • Health checks (/health endpoint) — confirmed
        │  • Clip uploads? Booking sync? Real-time data?
        │  • [?] Sync or async?
        │  • [?] What happens if connection drops?
        │  • [?] Bandwidth per court?
        │
        ▼
Internet → ISP Router → UDM (port 4000 forwarded) → Mac Mini (192.168.32.100)

DDNS keeps it reachable:
  Mac Mini cron (every 5 min) → curl FreeDNS update
  → CUSTOMER.podplaydns.com resolves to venue's current public IP
```

---

## Data Flow: Device Management

```
Mosyle MDM (cloud)
        │
        ├──→ iPads: push app config, updates, device groups
        │      Config: <string>CUSTOMERNAME</string>
        │      [?] how does CUSTOMERNAME route to correct backend?
        │
        └──→ Apple TVs: push app config, updates, device groups

Apple Business Manager
        │
        └──→ Device enrollment during initial setup
             "This device is managed by Pingpod Inc"
             [?] works globally or needs own account for Asia?
```

---

## Data Flow: Venue Deployment

```
DEPLOYMENT SERVER (Jersey City)
        │
        │  [?] remote access from PH?
        │
        ▼
deploy.py setup <AREA_NAME>
        │
        │  [?] what does this produce?
        │  [?] macOS installer? config bundle?
        │
        ▼
Package URL generated
        │
        ▼
Mac Mini downloads package → install → restart
        │
        ▼
Node.js replay service starts
        │
        ├── Cameras begin writing to cache/ → SSD
        ├── DDNS cron starts updating FreeDNS
        ├── Port 4000 becomes reachable from cloud
        └── /health endpoint confirms all cameras connected
```

---

## Payment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      PODPLAY BOOKING API                          │
│                                                                  │
│   Booking created → payment required                             │
│        │                                                         │
│        ├── Check venue config                                    │
│        │   [?] or check user region?                             │
│        │   [?] or hardcoded per build?                           │
│        │                                                         │
│        ├── US VENUE ──→ Stripe Account ID ──→ Stripe redirect    │
│        │                                        │                │
│        │                                   Stripe webhook        │
│        │                                   → confirm booking     │
│        │                                                         │
│        └── PH VENUE ──→ Magpie ID ──→ Magpie redirect            │
│                                        │                         │
│                                   Magpie callback                │
│                                   → confirm booking              │
│                                   → store credits                │
│                                                                  │
│   CREDITS (subsequent bookings):                                 │
│   └── Bypass payment gateway entirely                            │
│       └── PodPlay deducts from stored credit balance             │
│           [?] cross-venue credits? venue-locked?                 │
│           [?] settlement across different venue owners?          │
│                                                                  │
│   DIGITAL WALLET (future — Magpie building):                     │
│   └── Wallet-to-wallet: ~1.5% fee                               │
│   └── Direct card: ~3.5% fee                                    │
│   └── [?] credit expiration?                                    │
│   └── [?] credit transfer between users?                        │
│   └── [?] multi-currency (PHP, SGD, etc.)?                      │
└──────────────────────────────────────────────────────────────────┘

MONEY FLOW (PH):
  Customer pays 100 PHP
    → ~10-15 PHP to Pod Play
    → ~85 PHP to court owner
    → 17% withholding tax applies
    → Settlement: manual withdrawal or auto-frequency to merchant bank
```

---

## Network Topology (Per Venue — PH)

```
INTERNET
    │
    ▼
ISP ROUTER (PLDT/Globe/Converge)
    │  Business plan + static public IP (mandatory)
    │  DMZ → UDM, or bridge mode
    │
    ▼
UDM-SE / Pro / Pro-Max (Unifi Gateway)
    │  Named: PL-{CUSTOMERNAME}
    │  Port 4000 forwarded → 192.168.32.100
    │
    ├── SFP DAC ──→ USW-Pro-24-POE / 48-POE (Switch)
    │                    │
    │                    ├── Port 1: Mac Mini ──→ REPLAY VLAN (.32)
    │                    ├── Ports 2-N: Cameras (1 per court) ──→ REPLAY VLAN (.32)
    │                    ├── Ports N+1: iPads (PoE powered, 1 per court) ──→ REPLAY VLAN (.32)
    │                    ├── Ports N+2: Apple TVs (1 per court) ──→ REPLAY VLAN (.32)
    │                    ├── [optional] NVR ──→ SURVEILLANCE VLAN (.31)
    │                    ├── [optional] G5 cameras ──→ SURVEILLANCE VLAN (.31)
    │                    ├── [optional] Kisi Reader ──→ ACCESS CONTROL VLAN (.33)
    │                    └── [optional] U6-Plus Wi-Fi AP
    │
    ├── Kisi Controller Pro 2 (if access control ordered)
    │
    └── TrippLite RS-1215-RA (PDU — powers everything in rack)

REPLAY VLAN (192.168.32.0/24):
    Gateway: 192.168.32.254
    Mac Mini: 192.168.32.100 (fixed)
    Cameras: DHCP → fixed IP assigned in Unifi
    iPads: DHCP
    Apple TVs: DHCP
    mDNS: enabled (for Apple TV discovery)
```

---

## People & Roles (Pod Play Side)

```
┌─────────────────────────────────────────────────────────────┐
│                     POD PLAY TEAM                            │
│                                                             │
│  ERNESTO (Chief Product Officer)                             │
│  └── Product decisions, cross-venue credits, business rules │
│  └── Merchant experience, venue discovery, legal            │
│                                                             │
│  NICO (Setup / Deployment)                                   │
│  └── Hardware setup, connectivity, physical install          │
│  └── Knows what's app vs what's a separate server           │
│  └── [?] may not have full app-level visibility             │
│                                                             │
│  MARCELLO (Developer, outsourced, Brazil-based)              │
│  └── Built the Magpie API integration                       │
│  └── Knows payment routing: how app hits Magpie vs Stripe   │
│  └── Showed Dominic the staging web app                     │
│                                                             │
│  STAN WU (Config Guide Author)                               │
│  └── Wrote the v1 config guide (Sept 2024)                  │
│  └── Hardware setup expert                                  │
│                                                             │
│  CHAD                                                        │
│  └── Escalation contact (with Stan)                         │
│                                                             │
│  AGUSTIN                                                     │
│  └── App readiness ("Ask Agustin if it is ready")           │
│                                                             │
│  + distributed developers worldwide                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MAGPIE (Partner)                          │
│                                                             │
│  DOMINIC                                                     │
│  └── Integration liaison                                    │
│  └── Showed staging app where Magpie replaces Stripe        │
│  └── Trying to get us a staging login                       │
│                                                             │
│  Magpie handles:                                            │
│  └── GCash + credit card processing (PH)                    │
│  └── Digital wallet development (free, sees platform value) │
│  └── PH regulatory license (partners in other SEA markets)  │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary of All Unknowns

| # | Unknown | Category | Blocking? |
|---|---------|----------|-----------|
| 1 | How does app route to Magpie vs Stripe? (venue config? region? per-build?) | Payment | CRITICAL |
| 2 | What data flows over port 4000? Sync or async? | Architecture | CRITICAL |
| 3 | What happens if port 4000 connection drops? | Architecture | CRITICAL |
| 4 | Bandwidth requirements per court? | Architecture | CRITICAL |
| 5 | Fallback if port 4000 blocked by ISP? | Architecture | CRITICAL |
| 6 | Deployment server accessible remotely from PH? | Deployment | CRITICAL |
| 7 | What does deploy.py produce? Can we run our own? | Deployment | CRITICAL |
| 8 | Does PAL (25fps) break the replay pipeline? | Video | CRITICAL |
| 9 | Camera firmware region-locked? | Video | CRITICAL |
| 10 | All hardware confirmed 220V compatible? | Power | CRITICAL |
| 11 | Admin Dashboard — shared US instance or own? | Cloud Services | CRITICAL |
| 12 | Mosyle MDM — shared or own instance? | Cloud Services | CRITICAL |
| 13 | Apple Business Manager — works globally? | Cloud Services | CRITICAL |
| 14 | FreeDNS — same domain for Asia? | Cloud Services | CRITICAL |
| 15 | Unifi Account — shared or own? | Cloud Services | CRITICAL |
| 16 | App binary — same worldwide or regional? | App | HIGH |
| 17 | How does CUSTOMERNAME config route to correct backend? | App | HIGH |
| 18 | Mac Mini chip (M1/M2/M4) and year? | Hardware | HIGH |
| 19 | Cross-venue credits or venue-locked? | Wallet | MEDIUM |
| 20 | Settlement across different venue owners? | Wallet | MEDIUM |
| 21 | Credit expiration, transfer, multi-currency? | Wallet | LOW |
| 22 | Brother label maker model? | Hardware | LOW |
| 23 | EmpireTech cameras available in PH? | Sourcing | MEDIUM |
| 24 | Flic buttons available in PH? | Sourcing | MEDIUM |
| 25 | Kisi ships to PH? | Sourcing | MEDIUM |

**Resolves at:** NJ Training Trip (March 2–10, 2026)
