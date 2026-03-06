---
type: meeting
date: 2026-02-25
attendees: [[Ridge]], [[Cobalt]], [[Ember]], [[Cedar]]
projects: [[Pod Play SEA]], [[Ping Pod Asia Franchise]]
businesses: [[Pod Play]], [[Ping Pod]]
tags: [podplay, training, infrastructure, replay-service, hardware]
---

# Ridge — PodPlay Training & Infrastructure Overview

Pre-training call with [[Ridge]] (PodPlay hardware/replay service lead) ahead of the [[2026-03 NJ PodPlay Training]] trip. [[Cobalt]] and [[Ember]] also on the call — they previously helped set up the Mandaluyong site.

## Key Topics Discussed

### 1. Replay Service Architecture (Current — V1)

- Each site has a **Mac Mini** running the replay service on a local VLAN (192.168.32.x)
- Cameras stream via **RTSP** — Mac Mini pulls these streams for replays and instant replays
- Each minute, one video file is written per camera; files get renamed with timestamps (e.g., `0225` for today's date)
- If files don't get renamed, replays for that time window won't generate — the **rename service** was built recently to fix this
- Mac Mini uploads clips to **Google Cloud** (the cloud provider for everything)
- All replay service data flows through **port 4000** — this is an absolute must; port 4000 traffic must reach the UDM
- **CGNAT** (e.g., Starlink) blocks port forwarding entirely — kills the whole system
- Configuration currently lives in a **Google Doc** — area names, server hosts, ports, usernames, passwords, cloud buckets, camera coefficients, RTSP streams

### 2. V2 Replay Service (Coming Soon)

- In **final stages of testing** — probably a month or so out
- Currently: must screen share into deployment server, run `deploy.py` to create a package, copy to Mac Mini, deploy
- V2: will be able to run locally from your own GitHub — much easier install
- Configuration will move from the Google Doc into the **PodPlay dashboard** itself
- Migration from V1 to V2 is straightforward — Ridge will show how
- **Recommendation**: set up current site on V1, then migrate once V2 is ready

### 3. deploy.py Process

- `deploy.py` lives on the deployment server, creates a package with all replay service code and data
- Package gets copied to the new Mac Mini and deployed there
- Current process is tedious: VPN into lab → deployment server → enter new coefficients
- V2 eliminates the need for this — coefficients entered via dashboard
- Ridge offered to help run `deploy.py` for initial setups before V2 is ready

### 4. Camera Calibration & Coefficients

- On initial setup, leave all coefficients at **zero** to get the raw camera image
- Coefficients adjust for lens distortion — values change as cameras are calibrated
- If the baseline image is warped, coefficients need to be adjusted to even it out
- Each redeployment requires entering new coefficients into the deployment server (V1) or dashboard (V2)
- Following camera position specs is **extremely important** to avoid calibration issues

### 5. Health Check & Monitoring

- DDNS set up for each club (e.g., `areaname.podplaydns.com`)
- Health check endpoint: `ddns:4000/health` — returns JSON with system status
- Google Cloud alerting pings the health URL every 5 minutes
- Checks: system storage (SSD < 80%), memory/swap, CPU load, rename service status, link/SSD status
- Alerts sent to **Slack** when errors detected (can also configure other destinations)
- Ridge has ~70 live locations monitored this way
- **Recommendation**: set up Google Cloud alerting for our own locations — Ridge will show how

### 6. Hardware & Network

- **UniFi** for networking — already familiar with this (Basalt knows it)
- All equipment on the **32 VLAN** (192.168.32.x) — keep it consistent
- Mac Mini IP always **192.168.32.100**
- Mac Minis prone to overheating if installed too close to other equipment — needs breathing room
- If Mac Mini crashes: screen share shows black screen → SSH in and restart
- **Gigabit internet** recommended, though the service can handle slower
- 6-court site uses ~105 Gbps/week upload
- Bandwidth isn't a major concern; **latency** could matter since servers are in New York/New Jersey
- Ridge doesn't foresee latency issues for Philippines (estimated 300-400ms should be OK)
- **PDU** is the only hardware component that differs for overseas (voltage differences)

### 7. iPads & Mosyle MDM

- iPads managed via **Mosyle** (MDM platform) — ordered through Apple, auto-enroll on power-on
- Mosyle features: device naming, grouping by location, app restriction (only PodPlay app), wallpaper, OS update blocking, remote restart
- **Never send a shutdown** from Mosyle — only restart (shutdown requires someone on-site to turn back on)
- App lock: recommended on, but buttons can't be paired with app lock active — source of confusion
- iPads can run on **Wi-Fi** instead of PoE — some locations do this successfully (e.g., portable setups)
- PoE adapters are **fragile** — cable runs must be clean, not bunched up
- App updates can be scheduled through Mosyle; newer iPads handle this better
- Separate Mosyle account may be needed for our installs to avoid device enrollment confusion
- Over 500 devices currently in PodPlay's Mosyle

### 8. Dashboard & Site Setup

- Each location gets its own **individual dashboard** with its own URL (not reskinned — separately built by PodPlay developers)
- Dashboard shows courts, camera/kiosk names, replay service config (API URL, local URL)
- Booking, court management all through the dashboard
- Franchisees (like Pickleball Kingdom) get their own; independent locations also get their own

### 9. Payment Integration (Philippines)

- **Stripe doesn't work in the Philippines** — alternative payment integration already in progress
- [[Ember]] confirmed the developers know about the region-specific payment requirement
- As long as the app detects the region and uses the correct payment provider, it should work with the same App Store build
- Ridge confirmed this is **outside his scope** but developers are handling it
- [[Coral]] is the developer working on payment integration

### 10. Credentials & Account Access

- Need credentials for: **UniFi**, **Mosyle**, **deployment server**, **Google Cloud** (for alerting)
- Google Cloud alerting: can set up our own account — don't need PodPlay's
- DDNS: PodPlay uses **Free Afraid DDNS** — free to use a different provider, just needs DDNS capability
- Account setup decisions (shared vs. separate) need to go through **Granite** (head of operations)

### 11. Mandaluyong Site (Existing)

- [[Cobalt]] and [[Ember]] handled the setup at the Mandaluyong location
- They were "securing the dynamic list setup" and "deployment at LOC"
- Apple TV also part of the setup
- Current PodPlay app build installed — managed through Mosyle

## People & Roles Clarified

| Person | Role |
|--------|------|
| [[Ridge]] | Hardware, replay service, installs — works under [[Granite]] |
| [[Falcon]] | PodPlay project manager — handles specs, kickoff calls with installers, will send install document |
| [[Granite]] | Head of operations — decisions on account setup and credentials |
| [[Ember]] | Developer — aware of Philippines payment integration needs |
| [[Coral]] | Developer — working on payment integration |
| CS team | Customer success — handles booking/credits questions, routes to right developer |

## Next Steps

- [ ] Falcon to send comprehensive install document with camera positions, specs, hardware placement
- [ ] Falcon to schedule kickoff call with Cedar (as installer)
- [ ] Granite to decide on account setup (shared vs. separate for Mosyle, UniFi, etc.)
- [ ] Ridge to walk through hardware setup in person during NJ visit (Tuesday–Friday)
- [ ] Ridge to share SOPs and troubleshooting docs for common issues
- [ ] Ridge to show Google Cloud alerting setup
- [ ] Set up with CS team for booking/credits questions
- [ ] Test RTSP streams with VLC during setup
- [ ] Confirm Philippines latency is acceptable once site is live

## Logistics

- Cedar and [[Basalt]] visiting NJ, staying at **Hampton Inn Newark Harrison Riverwalk**
- In-person training Tuesday through Friday
- PodPlay office hit by snowstorm — inventory pushed back, boxes everywhere
- V2 replay service in final testing — timing is good for learning both versions
