# PodPlay On-Premises Venue Setup — Brief for Magpie

**Date:** February 18, 2026
**From:** Pod Play SEA Distribution Team
**To:** Magpie Team
**Re:** How PodPlay venues are physically set up — the on-premises environment your integration runs in

---

## Why This Matters to You

Your payment integration with PodPlay is already working (GCash + credit cards). But as we deploy venues in the Philippines, you need to understand the **physical hardware and network environment** at each venue so you can:

1. Know how the iPads (where customers pay) connect to the internet
2. Understand the network topology in case payment issues arise
3. Know who configures what during venue setup
4. Be aware of any on-premises config that touches your integration

This is based on PodPlay's official hardware configuration guide (v1.0, Sept 2024).

---

## 1. What Gets Installed at Each Venue

Every PodPlay venue has this hardware stack, per court:

```
PER COURT                              SHARED (1 per venue)
──────────                             ─────────────────────

┌──────────────┐                       ┌──────────────────┐
│    Camera    │  Records gameplay     │   Mac Mini       │
│  (1 per ct)  │                       │   - Replay svc   │
└──────────────┘                       │   - Samsung SSD  │
                                       └──────────────────┘
┌──────────────┐
│    iPad      │  Customer-facing      ┌──────────────────┐
│  (1 per ct)  │  app — THIS IS WHERE  │   UDM Gateway    │
│  POE-powered │  PAYMENT HAPPENS      │   (router/fw)    │
└──────────────┘                       └──────────────────┘

┌──────────────┐                       ┌──────────────────┐
│  Apple TV    │  Displays instant     │   Unifi Switch   │
│  (1 per ct)  │  replays on TV        │   (network)      │
│  HDMI → TV   │                       └──────────────────┘
└──────────────┘
                                       ┌──────────────────┐
                                       │   PDU            │
                                       │   (power dist)   │
                                       └──────────────────┘
```

**Key for Magpie:** The iPads are where your payment integration lives. Customers use the PodPlay app on these iPads to browse courts, book, and pay.

---

## 2. Network Architecture

All devices sit behind a Unifi Dream Machine (UDM) gateway. The network is segmented into VLANs:

```
                          INTERNET
                             │
                      ┌──────▼──────┐
                      │  ISP Router │
                      │  (PLDT,     │
                      │   Globe,    │
                      │   Converge) │
                      └──────┬──────┘
                             │  Port 4000 forwarded
                      ┌──────▼──────┐
                      │    UDM      │  Unifi Dream Machine
                      │  Gateway    │  (router + firewall)
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │   Unifi     │
                      │   Switch    │
                      └──────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐     │     ┌────────▼────────┐
     │  DEFAULT VLAN  │     │     │  REPLAY VLAN    │
     │  192.168.30.x  │     │     │  192.168.32.x   │
     │                │     │     │                 │
     │  • iPads ◄─────┼─ PAYMENT  │  • Mac Mini     │
     │  • Apple TVs   │  TRAFFIC  │    (.32.100)    │
     │  • NVR         │  GOES     │  • Cameras      │
     │                │  THROUGH  │                 │
     └────────────────┘  HERE     └─────────────────┘
```

### What this means for payment flow:

```
┌───────────┐     WiFi/POE      ┌───────────┐     Internet     ┌───────────┐
│           │    Ethernet        │           │                  │           │
│   iPad    │ ──────────────►   │    UDM    │ ─────────────►  │  PodPlay  │
│  PodPlay  │                   │  Gateway  │                  │  Backend  │
│   App     │ ◄──────────────   │           │ ◄─────────────   │ + Magpie  │
│           │                   │           │                  │           │
└───────────┘                   └───────────┘                  └───────────┘

iPad sends payment request → UDM routes to internet → PodPlay backend
→ Magpie processes payment → response back same path
```

**iPads connect to the internet through the UDM.** If there's a payment timeout or failure at a venue, the first thing to check is the UDM's internet connection, not your backend.

---

## 3. iPad Setup & App Configuration

This is the most relevant section for Magpie — it's how the devices running your payment integration get configured.

### How iPads are provisioned:

1. iPads are managed via **Mosyle** (MDM — mobile device management)
2. Each iPad is enrolled under "Pingpod Inc" in Apple Business Manager
3. During setup, iPads display "This device is managed by Pingpod Inc"
4. Mosyle pushes the **PodPlay app** to each iPad automatically

### How the PodPlay app knows which venue it belongs to:

Mosyle pushes a **custom app configuration** per client:

```xml
<dict>
  <key>id</key>
  <string>CUSTOMERNAME</string>
</dict>
```

This `CUSTOMERNAME` string is what tells the PodPlay app which venue/backend to connect to. **This is likely the same identifier that determines which payment configuration (i.e., your Magpie merchant account) gets used.**

### iPad naming convention:

```
iPad {ClientName} Court {Number}
```

Example: `iPad Manila Court 1`, `iPad Manila Court 2`

### iPads are POE-powered:

iPads are connected via **POE (Power over Ethernet) adapters** plugged into the Unifi switch. They get power and network from the same cable — no WiFi involved.

---

## 4. Admin Dashboard — Where Payment Config Lives

Before any hardware is set up, the venue is configured in PodPlay's **admin dashboard**. This is where your integration gets tied to a specific venue:

```
┌─────────────────────────────────────────────────────────────┐
│                  PODPLAY ADMIN DASHBOARD                     │
│                                                             │
│  Settings > Venues > [Venue Name]                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  Venue Name:          [Manila PingPod          ]    │    │
│  │  Location:            [Manila, Philippines     ]    │    │
│  │                                                     │    │
│  │  ── Payment ──────────────────────────────────      │    │
│  │  Stripe Account ID:   [acct_xxxxxx           ]     │◄── Your Magpie
│  │                                                     │    merchant ID or
│  │  ── Replays ──────────────────────────────────      │    equivalent goes
│  │  On-premises Replays: [✅ Enabled            ]     │    here (or in a
│  │  API URL:             [http://customer.podplay]     │    similar field)
│  │  Local API URL:       [http://192.168.32.100 ]     │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  This is configured BEFORE hardware is shipped/installed.   │
│  The Mosyle app config (CUSTOMERNAME) maps to this venue.   │
└─────────────────────────────────────────────────────────────┘
```

### How venue config connects to payment:

```
Admin Dashboard                    Mosyle MDM                    iPad
─────────────────                  ──────────                    ────

┌─────────────────┐  matches    ┌─────────────────┐  pushed   ┌────────────┐
│ Venue:          │ ─────────► │ App Config:      │ ───────► │ PodPlay    │
│ "Manila"        │  venue ID   │ id: "Manila"     │  to iPad  │ App knows  │
│                 │             │                  │           │ it's the   │
│ Payment:        │             └─────────────────┘           │ "Manila"   │
│ Magpie ID: xxx  │                                           │ venue      │
│                 │◄──────────────────────────────────────────│            │
│ Replay URLs:    │     App fetches venue config               │ Payment    │
│ http://...      │     (including payment provider)           │ goes thru  │
└─────────────────┘                                           │ Magpie     │
                                                              └────────────┘
```

---

## 5. The On-Premises Replay System (Not Payment-Related, But Context)

Each venue has a local replay system that runs independently of payments. You don't need to worry about this, but it helps to know it exists:

- A **Mac Mini** at each venue runs a Node.js replay service on port 4000
- **Cameras** (one per court) stream video to the Mac Mini over a local VLAN (192.168.32.x)
- Clips are stored on a **Samsung SSD** attached to the Mac Mini
- When a customer requests an **instant replay**, the Mac Mini serves it to the Apple TV on the same network
- The Mac Mini is reachable externally via **DDNS** (`CUSTOMER.podplaydns.com:4000`)

```
Camera ──► Mac Mini ──► Apple TV (instant replay on TV)
              │
              ▼
         Samsung SSD (clip storage)
              │
              ▼
         PodPlay Cloud (async upload for later viewing)
```

**Port 4000 is for the replay service, not payments.** Payments go through the normal internet path from the iPad to PodPlay's cloud backend to Magpie.

---

## 6. Full Setup Sequence (What Happens When We Deploy a Venue)

Here's the order of operations, with your touchpoints highlighted:

```
SETUP PHASE                               MAGPIE TOUCHPOINT?
───────────                               ──────────────────

1. Create venue in Admin Dashboard ────── ✅ Payment config set here
   (name, location, payment ID,              (Magpie merchant ID)
    replay URLs)

2. Configure Mosyle device groups ──────  ❌ No
   (iPad + AppleTV groups for client)

3. Set app config in Mosyle ────────────  ⚠️ Indirect — the CUSTOMERNAME
   (customer ID pushed to devices)            maps to the venue where your
                                              payment config lives

4. Hardware: Network setup ─────────────  ❌ No
   (UDM, switch, VLANs)

5. Hardware: Camera setup ──────────────  ❌ No

6. Hardware: Mac Mini setup ────────────  ❌ No
   (replay service, SSD, DDNS)

7. Hardware: iPad setup ────────────────  ⚠️ Indirect — these are the
   (POE, Mosyle enrollment, app install)      devices running PodPlay app
                                              where customers pay via Magpie

8. Hardware: Apple TV setup ────────────  ❌ No

9. Testing: Make a booking ─────────────  ✅ Payment test — verify Magpie
   via iPad, trigger replay,                  charges work from this venue
   verify everything works

10. Ship equipment to venue ────────────  ❌ No
```

---

## 7. Questions for Magpie

Now that you understand the venue environment, here's what we need from you:

### Venue Setup

| # | Question |
|---|---|
| 1 | What **credential or ID** do we enter in the admin dashboard per venue? (merchant ID, API key, etc.) |
| 2 | Do you need to **create/register** anything on your side per venue before we configure it? |
| 3 | Is venue onboarding something we can do **self-service**, or does it require Magpie to provision? |

### Device & Network

| # | Question |
|---|---|
| 4 | Does the Magpie SDK/integration on the iPad have any **specific network requirements**? (ports, domains to whitelist, certificate pinning, etc.) |
| 5 | If the venue's internet goes down temporarily, does your SDK **queue payments** and retry, or does it fail immediately? |
| 6 | Are there any **timeout settings** we should configure on the UDM/network for payment traffic? |

### Testing & Troubleshooting

| # | Question |
|---|---|
| 7 | What's the **test/sandbox mode** process for verifying payments work at a new venue before going live? |
| 8 | What **logs or diagnostics** are available if a payment fails at a venue? (on the iPad, on your dashboard, etc.) |
| 9 | Is there a **health check endpoint** we can hit from the venue network to verify Magpie connectivity? |
| 10 | Who do we contact for **venue-level payment issues** during and after deployment? |

### Multi-Venue Scale

| # | Question |
|---|---|
| 11 | As we deploy multiple venues, is there a **parent account / dashboard** where we can see all venues' payment status? |
| 12 | Can we **bulk-create** venue merchant accounts, or is it one at a time? |
| 13 | Are there any **per-venue costs** on Magpie's side we should factor into the deployment BOM? |

---

## 8. Venue Deployment Checklist — Magpie Items

For each new venue deployment, here's what involves Magpie:

- [ ] **Before setup:** Magpie merchant account/ID created for the venue
- [ ] **Admin dashboard:** Payment credential entered in venue settings
- [ ] **After iPad setup:** Test payment from each iPad to verify Magpie connectivity
- [ ] **Before shipping:** Confirm test transaction appears in Magpie dashboard
- [ ] **After on-site install:** Verify payment works on live network (different ISP/IP than test environment)
