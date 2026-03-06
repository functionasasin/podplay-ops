# Analysis: source-deployment-guide
**Source**: `docs/podplay-venue-deployment-guide.pdf` (25 pages)
**Date**: 2026-03-06
**Aspect**: source-deployment-guide

---

## Document Overview

- **Title**: PodPlay Venue Deployment Guide — Complete Step-by-Step Hardware & Software Configuration
- **Version**: 1.0, March 2026
- **Classification**: CONFIDENTIAL — Internal Use Only
- **Sources cited**: Config Guide v1 (Stan Wu), Nico Training Call (2026-02-25), Hardware Installation Guide (Andy), System Diagram, Asia Infrastructure Analysis

Total phases: 16 (Phase 0–15) + 6 Appendices (A–F)
Total numbered steps: 129 (steps 1–129)

---

## Phase 0: Pre-Purchase & Planning (Steps 1–8)

**Step 1**: Schedule kickoff call with Andy Korzeniacki (917-937-6896, andyk@podplay.app)

**Step 2**: Determine tier:
- Pro = display + kiosk + replay camera
- Autonomous = Pro + access control + security cameras

**Step 3**: Determine court count — sets:
- Internet speed requirement
- Switch size
- SSD size
- Rack size (7–12U)

**Step 4**: Confirm ISP — fiber preferred (symmetrical), cable acceptable
- **WARNING**: PodPlay systems are NOT compatible with Starlink (CGNAT blocks port 4000)

**Step 5**: Confirm internet speed per court count:

| Courts | Fiber | Cable | Dedicated |
|--------|-------|-------|-----------|
| 1–4 | 50–100/100 Mbps | 60 Mbps upload | 30/30 |
| 5–11 | 150/150 Mbps | Highest possible upload | 50/50 |
| 12–19 | 200/200 Mbps | Highest possible upload | 50/50 |
| 20–24 | 300/300 Mbps | Highest possible upload | 100/100 |
| 25+ | 400/400 Mbps | Highest possible upload | 150/150 |

**Step 6**: Confirm static IP from ISP — or ability to port forward 4000 through ISP router

**Step 7**: Determine TV mount type, iPad mount type, camera mount accessories per venue layout

**Step 8**: Calculate Cat6 requirements:
- Formula: `courts × avg_distance × 3_drops + doors + security_cameras`
- Pro tier: 3 Cat6 drops + 1 duplex outlet per court
- Autonomous tier: add 1 Cat6 per door reader + 1 per security camera

---

## Phase 1: Pre-Configuration (PodPlay Office) (Steps 9–16)

### Mosyle MDM Setup
**Step 9**: Create iPad device group for client in Mosyle
**Step 10**: Create Apple TV device group for client in Mosyle
**Step 11**: Create "Install App" group for both iPads and Apple TVs with custom config:
```xml
<dict><key>id</key><string>CUSTOMERNAME</string></dict>
```

### Admin Dashboard
**Step 12**: In client's PodPlay admin dashboard → Settings → Venues → Select location
**Step 13**: Enable "On-premises Replays Enabled"
**Step 14**: Note URL format (filled in later during testing):
- API URL: `http://CUSTOMERNAME.podplaydns.com:4000`
- Local URL: `http://192.168.32.100:4000`

### Hardware Verification
**Step 15**: Verify correct quantity of iPads, Apple TVs, UniFi equipment per BOM
**Step 16**: Confirm PodPlay app is ready for the customer (ask Agustin)

---

## Phase 2: Unboxing & Labeling (Steps 17–23)

**NOTE**: Keep all packaging materials intact for reuse/shipping.

**Step 17**: Unbox UniFi equipment (UDM, Switch, PDU, NVR if applicable)
**Step 18**: Using Brother label machine, create labels: C1, C2, C3, C4...
**Step 19**: Unbox iPads — label box + back of iPad with court number
**Step 20**: Unbox Apple TVs — label box, Apple TV unit, and remote with court number
**Step 21**: Unbox PoE chargers — label box and charger with court number
**Step 22**: Unbox replay cameras — label on top of camera housing with court number
**Step 23**: Unbox Mac Mini — label with location name

---

## Phase 3: Network Rack Assembly (Steps 24–29)

**Step 24**: Install UPS at bottom of rack (connect internal battery first)
**Step 25**: Install PDU (can mount on back of rack to save space)
**Step 26**: Mount shelf for Mac Mini (2U space reserved)
**Step 27**: Install patch panel with inline couplers (or punch-down keystones if capable)

**Step 28**: Rack order top-to-bottom:

| Position | Component | Notes |
|----------|-----------|-------|
| Top | Mac Mini | 2U shelf |
| 2 | ISP Modem | If rack-mountable |
| 3 | Gateway (UDM) | UDM-SE / Pro / Pro-Max |
| 4 | Patch Panel | 24-port with couplers |
| 5 | Switch | USW-Pro-24/48-POE (size varies by court count) |
| 6 | NVR | Autonomous+ only (UNVR / UNVR-Pro) |
| 7 | UPS | Battery must be connected before starting |
| Back | PDU | TrippLite RS-1215-RA (12 outlet) |

**Step 29**: All devices plug into PDU → PDU into UPS → UPS into dedicated 20A circuit
- **WARNING**: Mac Mini needs breathing room — do not install too close to other equipment (overheating risk)

---

## Phase 4: Networking Setup (UniFi) (Steps 30–45)

### Power On & UDM Initial Setup
**Step 30**: Power on PDU; plug in UDM, Switch, NVR, Mac Mini
**Step 31**: Apply outlet labels on PDU
**Step 32**: Using UniFi app on phone, sign into PingPodIT account
**Step 33**: Set up UDM with naming scheme: `PL-{CUSTOMERNAME}`
**Step 34**: Create local admin account: username `admin`, password per internal credentials
**Step 35**: Apply port labels to UDM (Mac Mini, Kisi Controller, Backup Internet, etc.)
**Step 36**: Label PDU in UniFi with connected devices

### Switch Setup
**Step 37**: Power on switch
**Step 38**: Connect switch to UDM using SFP DAC cable
**Step 39**: Apply labels to switch ports (iPads, Cameras, Apple TVs, Kisi Reader, etc.)

### Mac Mini Connection
**Step 40**: Power on Mac Mini
**Step 41**: Connect to Port #1 on UDM

### VLAN Configuration
**NOTE**: Do NOT change the default network yet — need 192.168.1.1 subnet for initial camera configuration (cameras default to 192.168.1.108).

**Step 42**: Create REPLAY VLAN with exact settings:

| Setting | Value |
|---------|-------|
| Network Name | REPLAY |
| Host Address | 192.168.32.254 |
| Netmask | /24 |
| Gateway IP | 192.168.32.254 |
| Broadcast IP | 192.168.32.255 |
| VLAN ID | 32 (Manual) |
| Allow Internet Access | Yes |
| mDNS | Yes (required for Apple TV discovery) |
| DHCP Mode | DHCP Server |
| DHCP Range | 192.168.32.1 – 192.168.32.254 |

**Step 43**: If Surveillance ordered → create SURVEILLANCE VLAN (subnet .31)
**Step 44**: If Access Control ordered → create ACCESS CONTROL VLAN (subnet .33)

### Port Forwarding
**Step 45**: Port forward port 4000 (TCP/UDP) to 192.168.32.100 (Mac Mini)
- **WARNING**: Port 4000 is critical — all replay service communication flows through it. If blocked, the entire system fails.

---

## Phase 5: ISP Router Configuration (Steps 46–47)

**Step 46**: Configure ISP router using one of these methods (in preference order):

| Priority | Method | Details |
|----------|--------|---------|
| 1 (Best) | Static IP | Order from ISP ($10–20/mo). UDM → Settings → Internet → WAN1 → Advanced → Manual → Static IP |
| 2 | DMZ | Put UDM's IP into ISP router's DMZ |
| 3 (Last resort) | Port Forward | Forward port 4000 TCP/UDP to UDM IP (ISP-dependent) |

**Step 47**: Final step (most important): On UDM, port forward port 4000 TCP/UDP → Mac Mini (192.168.32.100)

Supported ISPs:
- US: Verizon, Optimum, Spectrum, Google Fiber
- Philippines: PLDT Beyond Fiber, Globe GFiber Biz, Converge FlexiBIZ
- **WARNING**: Philippines: MUST have business plan + static IP. Residential plans use CGNAT which blocks all incoming connections.

---

## Phase 6: Camera Configuration (Steps 48–58)

**NOTE**: Plug ONE camera at a time — all cameras share default IP 192.168.1.108.

**Step 48**: Plug camera into switch
**Step 49**: Navigate to 192.168.1.108 in browser
**Step 50**: Set initial values:
- Region: United States
- Language: English
- Video Standard: NTSC

**Step 51**: Set date/time: Format YYYY-MM-DD, correct time zone and local time
**Step 52**: Set credentials: username `admin`, password per internal creds, email `support@pingpod.com`
**Step 53**: Settings → Network Settings → set mode to DHCP
**Step 54**: In UniFi, assign camera to REPLAY VLAN (.32 subnet) with fixed IP
**Step 55**: Repeat for each camera (one at a time)

**Camera Encoding — Main Stream**:

| Setting | Value |
|---------|-------|
| Compression | H.264 |
| Resolution | 1920×1080 (1080P) |
| Frame Rate | 30 FPS |
| Bit Rate Type | VBR |
| Quality | 6 (Best) |
| Max Bit Rate | 8192 Kb/s |
| I Frame Interval | 90 |
| SVC | 1 (off) |
| Smooth Stream | 50 |
| Watermark | Off |

**Camera Encoding — Sub Stream**:

| Setting | Value |
|---------|-------|
| Compression | H.265 |
| Resolution | 704×480 (D1) |
| Frame Rate | 30 FPS |
| Bit Rate Type | CBR |
| Bit Rate | 512 Kb/s |
| I Frame Interval | 60 |
| Smooth Stream | 50 |

**Step 56**: Overlay: Turn OFF Channel Title and Time Title
**Step 57**: Audio: Mic input, enabled on main stream, G.711Mu, 8000 sampling, noise filter on, volume 50
**Step 58**: After ALL cameras configured, change default network to 192.168.30.1 subnet

---

## Phase 7: DDNS Setup (Steps 59–65)

**Step 59**: On FreeDNS (freedns.afraid.org) → Dynamic DNS → click [add]

**Step 60**: Create A record:

| Field | Value |
|-------|-------|
| Type | A |
| Subdomain | CUSTOMERNAME |
| Domain | podplaydns.com (private/stealth) |
| Destination | 10.10.10.10 (placeholder) |
| TTL | 60 seconds |
| Wildcard | Unchecked |

**Step 61**: Go to Dynamic DNS → click "quick cron example"

**Step 62**: Copy the cron line, modify — replace wget with curl, add quotes around URL:
```
0,5,10,...,55 * * * * sleep 33 ; curl "https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY" >> /tmp/freedns_CUSTOMER_podplaydns_com.log 2>&1 &
```

**Step 63**: On Mac Mini terminal: `crontab -e` → `i` (insert) → paste → Esc → `:wq`

**Step 64**: Wait 5 minutes, verify DDNS updated with correct IP

**Step 65**: Check log: `/tmp/freedns_CUSTOMERNAME_podplaydns_com.log`

---

## Phase 8: Mac Mini Setup (Steps 66–73)

**Step 66**: Confirm access to client's PodPlay admin dashboard with settings access
**Step 67**: In Replay Service Configuration (RSC) sheet, add cameras with same names as in dashboard
**Step 68**: Write down Mac Mini username/password in master accounts tab
**Step 69**: Connect Samsung SSD to Mac Mini, erase drive per RSC sheet

**Step 70**: Create cache folder in home folder (Cmd+Shift+H):
- Create subfolders matching camera names (used for instant replays)

**Step 71**: In UniFi, assign Mac Mini to REPLAY VLAN with fixed address `192.168.32.100`

**Step 72**: If clips folder doesn't save to SSD, create symlink:
```bash
ln -s /Volumes/Replays/clips /Users/<HOMEFOLDER>/
```

**Step 73**: Remove .DS_Store from cache folder:
```bash
cd cache && rm .DS_Store
```
- **WARNING**: NEVER open the cache folder in Finder — it recreates .DS_Store which breaks replay processing.

---

## Phase 9: Replay Service Deployment (V1) (Steps 74–84)

**NOTE**: V2 replay service (coming ~April 2026) will eliminate steps 74–79 — deploy directly from GitHub, config via dashboard instead of Google Doc. V2 switches from UDP to TCP, fixing pixelation issues seen at some clubs with V1.

**Step 74**: Connect to Deployment Server in Jersey City (VPN required)
**Step 75**: Upload venue logo to assets folder in home folder
**Step 76**: Ensure logo name matches RSC
**Step 77**: Launch Upload Asset script
**Step 78**: In terminal, create the package:
```bash
./deploy.py setup <AREA_NAME>
```
**Step 79**: Copy generated URL to notepad
**Step 80**: Connect back to client's Mac Mini, download the package
**Step 81**: First open: System Settings → Privacy & Security → scroll down → Open Anyway
**Step 82**: Add "Find" and "Node" to Full Disk Access
**Step 83**: Restart Mac Mini
**Step 84**: Verify video files are writing to Samsung SSD

---

## Phase 10: iPad Setup (Steps 85–99)

**Step 85**: Plug PoE adapters into switch, connect iPads to PoE adapters
**NOTE**: UniFi detects the PoE injector, not the iPad itself. If you move a PoE injector to a different port, UniFi will show the injector on the new port.

**Step 86**: Power on iPads in court-number order (C1 first, then C2, etc.)
- **WARNING**: Enrollment order in Mosyle matches power-on order. If you power on out of order, device-to-court mapping will be wrong. Filter by enrolled date in Mosyle to verify.

**Step 87**: Wait ~5 seconds for internet connection
**Step 88**: Begin iPad setup — should display "This device is managed by Pingpod Inc"
**Step 89**: If managed screen doesn't appear: go back to first screen and retry
- If still not showing: use Apple Deployment Manager to re-add device
- ~80% of devices enroll successfully on first attempt. Factory reset and retry if needed.

**Step 90**: Turn off auto-lock on each iPad during configuration (MDM commands cannot reach a sleeping iPad)
**Step 91**: In Mosyle, assign iPads to client's group, name: `iPad {Client} Court #`

### App Installation (VPP)
**Step 92**: In Mosyle → Profiles → Install App → create new profile
- Installation source: VPP (never App Store) — apps are custom/white-labeled per facility
- Verify you have enough VPP licenses in Apple Business Manager

**Step 93**: Click Add App → search for client's PodPlay kiosk app
**Step 94**: Add P-List configuration with location ID:
```xml
<dict><key>id</key><string>LOCATION_ID</string></dict>
```
- The LOCATION_ID comes from the PodPlay development team — confirm it's ready before configuring

**Step 95**: Enable Auto App Install Update — but set to do not update automatically to avoid disrupting play
**Step 96**: Set up PodPlay app with correct court number
**Step 97**: If app doesn't show customer's club: check "Install App" group for correct P-List config

### App Lock
**Step 98**: In Mosyle, enable App Lock for all iPads — locks device to PodPlay app so users can't exit
**Step 99**: Schedule App Lock OFF window: 2:00 AM – 3:00 AM
- During this window: app lock disengages, device restarts, MDM sends pending updates
- At ~2:30 AM: scheduled commands (app updates, config pushes) are sent to the device
- App lock re-engages at 3:00 AM — device is ready for next day

**NOTE**: For initial setup, keep App Lock at 24/7 until all configuration and testing is complete.
**WARNING**: NEVER send a shutdown from Mosyle — only restart. Shutdown requires physical on-site access to power back on.
**NOTE**: iPads can run on WiFi instead of PoE — some locations do this (e.g. portable setups). PoE adapters are fragile — cable runs must be clean, not bunched up.

---

## Phase 11: Apple TV Setup (Steps 92–98)

**NOTE**: Step numbers 92–98 in PDF overlap with iPad numbering — these are Phase 11 steps.

**Step 92b**: Power on Apple TVs, plug into switch
**Step 93b**: Connect HDMI to HDMI 1 on TV
**Step 94b**: After Location Services, Remote Management screen should appear: "Pingpod Inc will automatically configure your AppleTV"
**Step 95b**: If no Remote Management screen: go all the way back to first screen, retry
- If set up without Remote Management: use Apple Deployment Manager to re-add

**Step 96b**: In Mosyle, assign to client's group, name: `AppleTV {Client} Court #`
**Step 97b**: Set up PodPlay app with correct court number
**Step 98b**: If app doesn't show client name: check "Install App" group in Mosyle

---

## Phase 12: Physical Installation (On-Site) (Steps 99–112)

### Replay Cameras
**Step 99**: Mount 16–20 feet behind baseline at 11' AFF (ideal)
**Step 100**: Leave 12 feet of cable coiled at camera location
**Step 101**: Opposing cameras must be at same height
**Step 102**: At least 2 feet from adjacent court's baseline

Camera height by distance from baseline:

| Distance from Baseline | Height AFF |
|------------------------|------------|
| 21'–26' | 12' |
| 16'–20' (ideal) | 11' |
| 12'–15' | 10' |
| 9'–11' | 9' |
| < 9' | 8' |

### TV Displays
**Step 103**: Mount 65" display at 8'9" AFF, center court, aligned with net (spectator side)
**Step 103a**: VESA 400×300 mount (included). Hide ethernet, outlet, Apple TV behind TV.

### iPad Kiosks
**Step 105**: Mount kiosk at 4'8" AFF, center court
**Step 106**: Hide PoE adapter (behind wall for drywall, behind TV for concrete)
**Step 107**: Keep case keys for the customer

### Bluetooth Buttons (Flic)
**Step 108**: Mount on fence/wall behind baseline, 2 per court (left + right)
**Step 108a**: Pre-paired with iPads per court assignment
- Label each button with court number and side (e.g. C1-L, C1-R) using Sharpie

Button actions:
- Single press = score
- Double press = undo
- Long press = replay

Battery: CR2032 coin cell. Yellow blink = low battery.
Factory reset: Remove battery → wait 5 seconds → reinsert → hold top + bottom for 10 seconds until red blink.

**WARNING**: App Lock MUST be OFF to pair buttons. If App Lock is on, pairing will show 'Bluetooth Pairing Failed' / 'Verification Failed'. Turn off App Lock for the location in Mosyle before pairing.

### Access Control (Autonomous tier only)
**Step 110**: Install Kisi Controller Pro 2 or UniFi Access hub
**Step 111**: Install readers at doors
**Step 112**: Wire locks:
- Mag lock for glass doors (fail-safe)
- Electric strike for panic bars (fail-secure)
- UniFi Door Hub output: 12V DC at up to 1A. Higher amperage or fire code = separate power supply.

---

## Phase 13: Testing & Verification (Steps 113–118)

**Step 113**: Add API URLs to admin dashboard:
- `http://CUSTOMERNAME.podplaydns.com:4000`
- `http://192.168.32.100:4000`

**Step 114**: From a different network (phone on cellular), verify DDNS:
```
http://CUSTOMERNAME.podplaydns.com:4000/health
```
- Success = JSON response (even a 404 JSON means Mac Mini is reachable)
- Health check shows: camera status, SSD usage, rename service, CPU/memory

**Step 115**: Test RTSP streams with VLC
**Step 116**: Create an operations reservation on admin dashboard
**Step 117**: Give yourself free replays on your user profile (avoid charges)
**Step 118**: On iPad, initiate a replay — instant replay should appear on Apple TV

If Replay Doesn't Work:
- A. Restart Mac Mini first
- B. Test instant replay stream directly: `http://CUSTOMERNAME.podplaydns.com:4000/instant-replay/COURTNAME`
- C. Verify "On-premises Replay" toggle is enabled in dashboard

### Bluetooth Button Testing
- Single press = score
- Double press = undo score
- Long press = get replay
- D. Open configuration menu on iPad (long-press logo in corner)
  - Verify left and right buttons appear in the button assignment section
  - Press each button — indicator should turn green with a button event logged
  - If button event shows but scoring doesn't work: restart iPad to re-sync Firebase connection
  - If no button appears: button may not be paired, battery may be dead, or needs factory reset

---

## Phase 14: Health Monitoring Setup (Steps 119–123)

**Step 119**: Set up Google Cloud alerting for the venue (can use own GCP account)
**Step 120**: Health check endpoint: `http://CUSTOMERNAME.podplaydns.com:4000/health`
**Step 121**: GCP pings every 5 minutes
**Step 122**: Checks: SSD storage < 80%, memory/swap, CPU load, rename service, link status
**Step 123**: Alerts sent to Slack (configurable destination)

**NOTE**: Nico monitors ~70 live locations this way. Set up the same for all Asia venues.

---

## Phase 15: Packaging & Shipping (Steps 124–129)

**Step 124**: Print Bill of Materials (BOM)
**Step 125**: Count all items against BOM — if mismatch, contact Stan or Chad
**Step 126**: Print new BOM, place inside box
**Step 127**: Securely tape box closed (excess tape is fine)
**Step 128**: Weigh package with scale
**Step 129**: Print shipping label

---

## Appendix A: Troubleshooting — 14 Known Issue/Solution Pairs

| Issue | Solution |
|-------|----------|
| Mac Mini black screen (crash) | SSH in and restart. Screen share won't work if screen is black. |
| Mac Mini overheating | Needs breathing room in rack — don't install flush against other equipment. |
| Replays not generating for a time window | Rename service may have failed — files need timestamps (e.g. 0225). Check rename service status via /health. |
| PoE adapter intermittent issues | Cable runs must be clean, not bunched up, under 100m. Very sensitive to cable quality — re-terminate if needed. |
| iPad buttons won't pair | App lock must be OFF during pairing. Exit Guided Access first, then pair. |
| Camera image warped | Coefficients need adjustment. Start at zero for raw image, calibrate after physical install. |
| DDNS not updating | Check cron: `crontab -l` on Mac Mini. Check log at `/tmp/freedns_*.log` |
| Port 4000 unreachable from outside | Verify: ISP router forwarding → UDM forwarding → Mac Mini on .32.100. Test from cellular network. |
| .DS_Store in cache folder | `cd cache && rm .DS_Store` — NEVER open cache folder in Finder. |
| App doesn't show customer club | Check Mosyle "Install App" group — P-List config must have correct LOCATION_ID string. |
| Replay video pixelated | V1 replay service uses UDP — pixelation is a known issue. Deploy V2 (TCP) to fix. Contact developer (Patrick). |
| Button paired but score not updating | Restart iPad to re-sync Firebase connection. If still failing, check Firebase service status. |
| Flic button won't pair | App Lock MUST be off. Turn off App Lock for location in Mosyle, then retry pairing on iPad. |
| Flic button unresponsive | Replace CR2032 battery. If still dead: factory reset (remove battery 5s, reinsert, hold top+bottom 10s until red blink). |
| iPad not receiving MDM commands | iPad may be asleep with auto-lock on. Turn off auto-lock during configuration. For deployed iPads, commands sent during 2–3 AM App Lock off window. |
| iPad enrollment out of order | Filter by enrolled date in Mosyle. iPads enroll in the order they are powered on — always power on in court-number order. |

Note: PDF lists 16 rows (including iPad MDM commands and enrollment order issues).

---

## Appendix B: Hardware BOM

### Network Rack

| Item | Source |
|------|--------|
| TrippLite 12 Outlet RS-1215-RA (PDU) | Ingram |
| UniFi UDM-SE / Pro / Pro-Max (Gateway) | UniFi |
| UniFi USW-Pro-24-POE or 48-POE (Switch) | UniFi |
| UACC-DAC-SFP10-0.5M (SFP cable) | UniFi |
| Patch Panel w/ Couplers (24-port) | Amazon |
| Monoprice Cat6 patch cables (1', 3', 10') | Amazon |

### Replay System (Per Court)

| Item | Source |
|------|--------|
| Mac Mini 16GB 256GB SSD | Apple Business |
| Samsung T7 SSD (1TB / 2TB / 4TB) | Amazon |
| EmpireTech IPC-T54IR-ZE (replay camera) | EmpireTech |
| EmpireTech PFA130-E (junction box) | EmpireTech |
| Flic Button (2 per court) | Flic |

### Display System (Per Court)

| Item | Source |
|------|--------|
| 65" TV (VESA 400×300) | Drop-shipped |
| Apple TV 4K + Ethernet | Apple Business |
| HIDEit Mount (Apple TV) | HIDEit |
| iPad + PoE Adapter | Apple / Supplier |
| iPad Kiosk Case | Supplier |
| Amazon Basics 3ft HDMI | Amazon |

---

## Appendix C: Network Reference

### VLAN Architecture

| VLAN ID | Subnet | Purpose |
|---------|--------|---------|
| Default | 192.168.30.x (after camera config) | Management |
| 32 | 192.168.32.x | REPLAY — Mac Mini, cameras, iPads, Apple TVs |
| 31 | 192.168.31.x | SURVEILLANCE — NVR + security cameras (optional) |
| 33 | 192.168.33.x | ACCESS CONTROL — Kisi / UniFi Access (optional) |

### Key IP Addresses

| Device | IP Address | Notes |
|--------|------------|-------|
| Mac Mini | 192.168.32.100 (fixed) | Always this IP on REPLAY VLAN |
| REPLAY Gateway | 192.168.32.254 | UDM gateway for VLAN 32 |
| Camera default | 192.168.1.108 | Factory default — changed to DHCP during config |
| DDNS | CUSTOMER.podplaydns.com | Resolves to venue's public IP via FreeDNS |

### Internal Bandwidth

1 Gbps (standard switch ports) sufficient for up to ~20 replay cameras. SFP+ (10 Gbps) available on UDM/switch but unnecessary for most deployments.

### Backup Internet (Autonomous / 24hr Venues)

Autonomous venues operating 24/7 must have two ISPs from different providers, each with a static IP:
- Example: PLDT + Converge (Philippines) or Verizon + Spectrum (US)
- Do NOT use two ISPs that share the same backbone — if one goes down, the other likely will too
- UDM supports WAN failover — configure secondary WAN on UDM

### Critical Ports

| Port | Protocol | Direction | Purpose |
|------|----------|-----------|---------|
| 4000 | TCP/UDP | Inbound → Mac Mini | Replay service — ALL cloud communication |

### Key Contacts

| Person | Role | Contact |
|--------|------|---------|
| Andy Korzeniacki | Project Manager — specs, kickoff, camera positions | 917-937-6896 / andyk@podplay.app |
| Nico | Hardware, replay service, installs | Via Chad |
| Chad | Head of operations — account decisions, credentials | — |
| Stan Wu | Config guide author, hardware expert | — |
| Agustin | App readiness | — |
| CS Team | Booking / credits questions | — |

---

## Appendix D: Support Escalation Tiers

| Tier | Handled By | Examples |
|------|------------|---------|
| Tier 1 | On-site staff / remote monitoring team | Device restart, app lock toggle, button battery replacement, basic connectivity checks |
| Tier 2 | Configuration specialist (Nico-level) | VLAN changes, camera re-config, Mosyle profile issues, DDNS troubleshooting, replay service restart |
| Tier 3 | Engineer / Developer (Patrick-level) | Replay service code bugs, video encoding issues (pixelation, stream corruption), port 4000 architecture issues, firmware-level camera problems |

Notes:
- Most day-to-day issues are Tier 1
- Tier 3 issues are rare — weekly developer call is used to review outstanding issues

---

## Appendix E: Device Migration (ABM Transfer)

Steps when transferring devices from one Apple Business Manager org to another:

1. Original org releases devices from their ABM
2. Released devices are factory reset automatically (all MDM profiles removed)
3. New org adds devices to their ABM (serial number or Apple Configurator)
4. New org links ABM to their MDM (Mosyle/Jamf)
5. Power on devices — should auto-enroll into new MDM
6. Re-apply all configurations: naming, app installation, App Lock, profiles

**NOTE**: Mac Mini must also be re-enrolled. The replay service and camera configs are unaffected by MDM migration — only Apple device management changes.

**MDM Options**:
- Mosyle: cheaper, Apple-only, current PodPlay choice
- Jamf: premier, Apple-only, works directly with Apple, more configuration options
- If considering Android devices, neither works — evaluate cross-platform MDMs.

---

## Appendix F: Open Questions (Asia Deployment)

Resolve during NJ Training (March 2–10, 2026):

| # | Question | Category | Priority |
|---|----------|----------|----------|
| 1 | PAL vs NTSC — does changing video standard break replay pipeline? | Video | CRITICAL |
| 2 | Camera firmware region-locked? | Video | CRITICAL |
| 3 | All hardware confirmed 220V/60Hz compatible? | Power | CRITICAL |
| 4 | What data flows over port 4000? V1=UDP, V2=TCP. Replays + cloud sync. | Architecture | ANSWERED |
| 5 | Fallback if port 4000 blocked by ISP? | Architecture | CRITICAL |
| 6 | Deployment server accessible remotely from PH? | Deployment | CRITICAL |
| 7 | What does deploy.py produce? Can we run our own? | Deployment | CRITICAL |
| 8 | Admin Dashboard — shared instance or own? | Accounts | CRITICAL |
| 9 | Mosyle — own instance needed. Cosmos is separate entity, not sub-org. | Accounts | ANSWERED |
| 10 | Apple Business Manager — own ABM needed. Can release devices from PodPlay ABM → factory reset → re-enroll. | Accounts | ANSWERED |
| 11 | UniFi Account — transfer ownership planned. First club under PodPlay, future under Cosmos. | Accounts | ANSWERED |
| 12 | FreeDNS — same domain for Asia venues? | Accounts | CRITICAL |
| 13 | App binary — white-labeled per facility. Each facility gets own app via VPP, not App Store. | App | ANSWERED |
| 14 | LOCATION_ID in P-List config routes app to correct backend. Dev team (Agustin) creates per facility. | App | ANSWERED |
| 15 | Mac Mini chip (M1/M2/M4) and year? | Hardware | HIGH |
| 16 | EmpireTech cameras available in Philippines? | Sourcing | MEDIUM |
| 17 | Flic buttons available in Philippines? | Sourcing | MEDIUM |
| 18 | Kisi ships to Philippines? | Sourcing | MEDIUM |

---

## Key Values Extracted (for Seed Data)

### VLAN IDs and Subnets
- Default/Management: 192.168.30.x
- REPLAY: VLAN 32, 192.168.32.x, gateway 192.168.32.254, DHCP 192.168.32.1–254
- SURVEILLANCE: VLAN 31, 192.168.31.x
- ACCESS CONTROL: VLAN 33, 192.168.33.x

### Fixed IP Addresses
- Mac Mini: always 192.168.32.100
- Camera factory default: 192.168.1.108
- REPLAY gateway: 192.168.32.254

### Critical Port
- Port 4000, TCP/UDP, inbound to Mac Mini

### Camera Encoding (Exact Values)
**Main stream**: H.264, 1920×1080, 30FPS, VBR, Quality 6, Max 8192 Kb/s, I-Frame 90, SVC off, Smooth 50, Watermark off
**Sub stream**: H.265, 704×480, 30FPS, CBR, 512 Kb/s, I-Frame 60, Smooth 50
**Overlay**: Channel Title OFF, Time Title OFF
**Audio**: Mic input, main stream enabled, G.711Mu, 8000 Hz, noise filter on, volume 50

### App Lock Window
- OFF: 2:00 AM – 3:00 AM daily
- Commands sent: ~2:30 AM

### UDM Naming Scheme
- `PL-{CUSTOMERNAME}`

### Mosyle Device Naming
- iPad: `iPad {Client} Court #`
- Apple TV: `AppleTV {Client} Court #`

### DDNS
- Domain: podplaydns.com (FreeDNS)
- URL pattern: `http://CUSTOMERNAME.podplaydns.com:4000`
- Local fallback: `http://192.168.32.100:4000`
- Health endpoint: `http://CUSTOMERNAME.podplaydns.com:4000/health`
- Replay endpoint: `http://CUSTOMERNAME.podplaydns.com:4000/instant-replay/COURTNAME`

### Flic Button
- Battery: CR2032
- Low battery indicator: Yellow blink
- Factory reset: Remove battery 5s, reinsert, hold top+bottom 10s until red blink
- Actions: Single=score, Double=undo, Long=replay

### Rack
- UPS at bottom, PDU on back
- Mac Mini: 2U shelf, top of rack
- NVR only in Autonomous+
- Required circuit: dedicated 20A

### ISP Config Priority
1. Static IP (best, $10–20/mo)
2. DMZ
3. Port forward (last resort)

### V1 vs V2 Replay Service
- V1: UDP, pixelation known issue, Jersey City deployment server, deploy.py, Google Doc config
- V2: TCP, ~April 2026, GitHub deploy, dashboard config, eliminates steps 74–79

### Internet Speed Table (per court count)
- 1–4 courts: Fiber 50–100/100, Cable 60 Mbps upload, Dedicated 30/30
- 5–11 courts: Fiber 150/150, Cable highest possible, Dedicated 50/50
- 12–19 courts: Fiber 200/200, Cable highest possible, Dedicated 50/50
- 20–24 courts: Fiber 300/300, Cable highest possible, Dedicated 100/100
- 25+ courts: Fiber 400/400, Cable highest possible, Dedicated 150/150

### Philippines ISP Requirements
- Must be business plan + static IP
- Supported ISPs: PLDT Beyond Fiber, Globe GFiber Biz, Converge FlexiBIZ
- Dual ISP required for autonomous/24hr venues, different backbone providers

### Cat6 Cable Formula
- Courts: `court_count × avg_distance × 3`
- Doors: `door_count × avg_distance × 1`
- Cameras: `camera_count × avg_distance`
- Total = sum of all three
- Leave 12' coiled at replay camera location
- Leave 6' minimum coiled at replay camera (from hardware guide)
- Leave 3' minimum coiled at display/kiosk
- Max run: 100m; beyond requires intermediate switch

### Rack Components (Full List from Hardware Guide)
| Position | Component | Notes |
|----------|-----------|-------|
| Top | Mac Mini | 2U shelf |
| 2 | ISP Modem | If rack-mountable |
| 3 | Gateway (UDM) | — |
| 4 | Patch Panel | — |
| 5 | Switch | Size varies by courts; large clubs may have two |
| 6 | NVR | Autonomous+ only |
| 7 | UPS | Battery connected before start |
| Back | PDU | TrippLite RS-1215-RA |

### Front Desk Equipment
- BBPOS WisePOS E (Stripe CC terminal), Admin PIN: 07139
- QR Code Scanner
- Web Cam
- Computers: not included, any Windows/Mac works, desktops recommended

### Contacts (Full)
- Andy Korzeniacki: PM, 917-937-6896, andyk@podplay.app
- Nico: hardware/replay/installs (contact via Chad)
- Chad: head of ops, account decisions, credentials
- Stan Wu: config guide author, hardware expert
- Agustin: app readiness
- CS Team: booking / credits

### Installer Count Monitored
- Nico monitors ~70 live locations via GCP health monitoring

---

## Workflow Sequences Identified

### Complete Phase-by-Phase Workflow
0. Pre-Purchase: tier, courts, ISP, cable math, mount decisions
1. Pre-Config (office): Mosyle groups, admin dashboard enable, hardware verify
2. Unboxing: label everything by court number
3. Rack Assembly: UPS → PDU → shelf → patch → switch → NVR → order
4. UniFi Setup: UDM naming, VLANs (32/31/33), port 4000 forward
5. ISP Config: static IP (preferred) or DMZ or port forward
6. Camera Config: one at a time on 192.168.1.108, encoding settings, then DHCP
7. DDNS: FreeDNS A record, cron on Mac Mini
8. Mac Mini: SSD, cache folders, fixed IP 192.168.32.100, symlink
9. Replay Service: Jersey City server, deploy.py, privacy permissions, verify SSD write
10. iPad Setup: PoE → power on in order → Mosyle → VPP → App Lock 2-3AM window
11. Apple TV: power on → remote management → Mosyle → app
12. Physical Install: camera heights, TV at 8'9", iPad at 4'8", buttons 2/court, access control
13. Testing: DDNS health check from cellular, RTSP, replay test, button test
14. Health Monitoring: GCP alerting, 5-min pings
15. Shipping: BOM count, box, weigh, label

### Token Replacement Needed in Checklist
- `{{CUSTOMER_NAME}}` → venue brand name (used in DDNS, Mosyle groups, UDM name, URL)
- `{{COURT_COUNT}}` → number of courts
- `{{LOCATION_ID}}` → from Agustin/dev team for P-List config

---

## Conditional Steps (Tier-Dependent)

| Step | Condition |
|------|-----------|
| SURVEILLANCE VLAN (step 43) | Autonomous+ only |
| ACCESS CONTROL VLAN (step 44) | Autonomous tier |
| NVR in rack (step 28) | Autonomous+ only |
| Access control install (steps 110–112) | Autonomous tier |
| Backup ISP / dual WAN | Autonomous / 24hr venues |
