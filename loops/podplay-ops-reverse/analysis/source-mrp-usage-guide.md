# Analysis: source-mrp-usage-guide

**Aspect**: source-mrp-usage-guide
**Wave**: 1 — Source Acquisition & Domain Mapping
**Date**: 2026-03-06
**Source Status**: PARTIAL — `docs/PodPlay_MRP_Usage_Guide.pdf` NOT PRESENT in repo. Analysis derived from available substitute sources listed below.

---

## Substitute Sources Used

| Source | Path | Coverage |
|--------|------|----------|
| PodPlay Configuration Guide v1.0 | `research/podplay-config-guide-v1.md` | Full configuration workflow, camera settings, MDM, DDNS, networking |
| Hardware BOM | `research/podplay-hardware-bom.md` | Complete hardware catalog by category, vendors, notes |
| Design Document | `docs/plans/2026-03-06-podplay-ops-wizard-design.md` | Approved data model, pricing tiers, wizard flow, BOM generation logic |
| NJ Training Transcripts | `cosmos-podplay-setup-training.txt` through `-7.txt` | Workflow context, team roles, process observations |
| Unknowns Tracker | `research/podplay-unknowns-tracker.md` | Cloud services, MDM, ABM, deployment server resolutions |
| System Diagram | `research/podplay-system-diagram.md` | Component topology, cloud services, credentials |

## Known Gaps (from missing MRP Usage Guide PDF)

The following MRP-specific content is NOT available from substitute sources:
- All 24 Google Sheets tab names and column structures
- Apps Script functions (automation logic, triggers, tab creation)
- Exact spreadsheet formulas (INDIRECT, VLOOKUP chains)
- Customer onboarding workflow steps within the MRP
- Inventory tracking formulas (stock levels, reconciliation)
- Financial reporting structure (P&L formula, HER formula)
- Dropdown values and data validation lists
- Hardware catalog with unit costs (exact $ values)
- Vendor contact details with account numbers
- QA checklist content within the spreadsheet
- Invoice and expense tracking columns

These gaps are partially covered by the design document (approved data model) and will need to be filled either from the XLSX data itself or from Wave 2 design decisions.

---

## 1. Configuration Workflow (from Config Guide v1.0 by Stanley Wu)

### Pre-Configuration Checklist

Before unboxing:
1. Verify correct quantity of iPads, Apple TVs, UniFi equipment
2. Confirm PodPlay app is ready for customer (check with Agustin)
3. In Mosyle: create AppleTV and iPad device groups for the client
4. Create "Install App" group in Mosyle for both device types with custom config:
   ```xml
   <dict><key>id</key><string>CUSTOMERNAME</string></dict>
   ```
5. In customer admin dashboard: Settings > Venues > Enable "On-premises Replays Enabled"
   - On-premises API URL: `http://CUSTOMERNAME.podplaydns.com:4000`
   - On-premises Local API URL: `http://192.168.32.100:4000`

### Unboxing & Labeling

Label machine: Brother label maker (model unknown — open question from hardware BOM)

Label sequence per court number (C1, C2, C3...):
1. Unbox iPads → label box AND back of iPad with court number
2. Unbox Apple TVs → label box, Apple TV body, and remote with court number
3. Unbox PoE Chargers → label box and PoE charger with court number
4. Unbox Replay Cameras → apply label on top of camera housing
5. Unbox Mac Mini → label with court number
6. Keep all packaging materials intact for reuse for shipping

Label sets per court: 5 total (remote, iPad, camera, Apple TV, PoE)

### Networking Setup Sequence

1. Power on PDU (TrippLite 12 Outlet RS-1215-RA)
   - Plug in UDM, Switch, NVR, Mac Mini
   - Apply outlet label on PDU in UniFi

2. UDM setup:
   - Connect to internet via DHCP initially
   - Use UniFi app on phone, sign into PingPodIT account
   - Naming convention: `PL-{CUSTOMERNAME}`
   - Create local admin: username `admin`, password per internal credentials

3. Apply port labels to UDM (Mac Mini, Kisi Controller, Backup Internet, etc.)

4. Label PDU in UniFi with connected devices

5. Power on Switch:
   - Connect to UDM using SFP cable (UACC-DAC-SFP10-0.5M)
   - Apply label to UniFi switch (iPads, Cameras, Apple TVs, Kisi Reader)

6. Power on Mac Mini → connect to Port #1 on UDM

7. Configure UDM with static IP for testing:
   - Create REPLAY VLAN first (do NOT change default subnet yet — cameras locked to 192.168.1.108)
   - REPLAY VLAN settings:
     - Network Name: REPLAY
     - Host Address: 192.168.32.254
     - Netmask: /24
     - Gateway IP: 192.168.32.254
     - Broadcast IP: 192.168.32.255
     - VLAN ID: 32 (Manual)
     - Allow Internet Access: enabled
     - mDNS: enabled
     - DHCP Mode: DHCP Server
     - DHCP Range: 192.168.32.1 – 192.168.32.254

8. If Autonomous/Autonomous+ (surveillance + access control), create additional VLANs:
   - Surveillance VLAN: .31
   - Access Control VLAN: .33

9. Port forward port 4000 → 192.168.32.100 (Mac Mini)

10. After cameras configured: change default network to 192.168.30.1 subnet

### ISP Router Configuration

Priority order:
1. Static IP (preferred — $10–$20/month from ISP)
   - UniFi Settings > Internet > WAN1 > Advanced > Manual > Static IP
2. DMZ — add UniFi Gateway into ISP router DMZ
3. Port Forward — port 4000 (TCP/UDP) to UniFi Gateway IP (last resort, may not work)

Final step: On UniFi Gateway, port forward 4000 (UDP/TCP) to Mac Mini

Supported ISPs: Verizon, Optimum, Spectrum, Google Fiber, Backup ISP

### DDNS Setup (FreeDNS)

Service: FreeDNS at freedns.afraid.org (credentials in 1Password)
Domain: podplaydns.com (private, stealth)

Steps:
1. Go to Dynamic DNS > Add
2. Fill in:
   - Type: A
   - Subdomain: CustomerName (exact brand name, lowercase)
   - Domain: podplaydns.com (private) (stealth)
   - Destination: 10.10.10.10 (placeholder)
   - TTL: 60 seconds
   - Wildcard: unchecked
3. Go back to Dynamic DNS > click "quick cron example"
4. Copy cron line, modify:
   - Delete: `wget --no-check-certificate -O -`
   - Replace with: `curl`
   - Add quotes around URL

Before:
```
0,5,10,15,20,25,30,35,40,45,50,55 * * * * sleep 33 ; wget --no-check-certificate -O - https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY >> /tmp/freedns_CUSTOMER_podplaydns_com.log 2>&1 &
```

After:
```
0,5,10,15,20,25,30,35,40,45,50,55 * * * * sleep 33 ; curl "https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY" >> /tmp/freedns_CUSTOMER_podplaydns_com.log 2>&1 &
```

5. On Mac Mini Terminal:
   - `crontab -e`
   - Press `i` for insert mode
   - Paste modified cron
   - Press Esc, `:wq` to save
6. Wait 5 minutes, verify DDNS updated
7. Check log: `/tmp/freedns_CUSTOMERNAME_podplaydns_com.log`
8. Verify URL: `http://CUSTOMERNAME.podplaydns.com:4000`
   - Success response: `{"statusCode":404,"message":"Cannot GET /","error":"Not Found"}`

### Camera Configuration

WARNING: Configure ONE camera at a time — all cameras default to same IP 192.168.1.108

Steps per camera:
1. Plug 1 camera into switch
2. Navigate to 192.168.1.108 in browser
3. Initial values:
   - Region: United States
   - Language: English
   - Video Standard: NTSC
4. Date/time:
   - Date Format: YYYY-MM-DD
   - Time Zone: (venue location)
   - System Time: (current local time)
5. Credentials:
   - Username: admin
   - Password: (internal credentials)
   - Email: support@pingpod.com
6. Settings > Network Settings > Mode: DHCP
7. Assign camera to REPLAY VLAN (.32 subnet) in UniFi with fixed IP

#### Main Stream Encoding Settings

| Setting | Value |
|---------|-------|
| Compression | H.264 |
| Encoding Strategy | General |
| Resolution | 1920×1080 (1080P) |
| Frame Rate (FPS) | 30 |
| Bit Rate Type | VBR |
| Quality | 6 (Best) |
| Max Bit Rate | 8192 Kb/s |
| I Frame Interval | 90 |
| SVC | 1 (off) |
| Smooth Stream | 50 |
| Watermark | Off |

#### Sub Stream Encoding Settings

| Setting | Value |
|---------|-------|
| Compression | H.265 |
| Resolution | 704×480 (D1) |
| Frame Rate (FPS) | 30 |
| Bit Rate Type | CBR |
| Bit Rate | 512 Kb/s |
| I Frame Interval | 60 |
| Smooth Stream | 50 |

#### Overlay Settings
- Channel Title: OFF
- Time Title: OFF

#### Audio Settings

| Setting | Value |
|---------|-------|
| Audio Input Type | Mic |
| Enable (Main Stream) | On |
| Audio Encoding | G.711Mu |
| Sampling Rate | 8000 |
| Noise Filter | On |
| Microphone Volume | 50 |

### iPad Setup

1. Plug PoE adapters into switch, plug iPads into PoE adapters
2. Power on iPads; wait 5 seconds for internet connection
3. Begin iPad initial setup — should display "This device is managed by Pingpod Inc"
4. In Mosyle: assign iPads to client group, name: `iPad {Client} Court #`
5. Setup PodPlay app with correct court number
   - If app doesn't show customer's club: check "Install App" group configuration

### Apple TV Setup

1. Power on Apple TVs, connect HDMI to monitor
2. After Location Services: Remote Management screen should show "Pingpod Inc will automatically configure your AppleTV"
   - If not shown: go back to first screen and retry
   - If set up without Remote Management: use Apple Deployment Manager to re-add to Apple Business account
3. Should display "This device is managed by PingPod Inc"
4. In Mosyle: assign to client group, name: `AppleTV {Client} Court #`
5. Setup PodPlay app with correct court number

### Mac Mini Setup

1. Confirm client admin dashboard access with Settings capability
2. In Replay Service Configuration (RSC) sheet: add cameras with same names as in PodPlay dashboard (Venues)
3. Write down Mac Mini username and password in master accounts tab
4. Connect Samsung SSD to Mac Mini; erase drive per RSC sheet
5. Create cache folder in home folder (`Cmd+Shift+H`); create subfolders with same names as cameras
6. In UniFi: assign Mac Mini to REPLAY VLAN with fixed address 192.168.32.100
7. If clips folder not saving to SSD, create symlink:
   ```bash
   ln -s /Volumes/Replays/clips /Users/<HOMEFOLDER>/
   ```
8. Connect to Deployment Server in Jersey City; upload logo to assets folder in home folder
   - Logo name must match what's in RSC
9. Launch Upload Asset script
10. In Terminal:
    ```bash
    ./deploy.py setup <AREA_NAME>
    ```
11. Copy URL to notepad; connect back to client Mac Mini; download package
12. When first opening package: System Settings > Privacy & Security > Open Anyway
13. Add "Find" and "Node" to Full Disk Access
14. Restart Mac Mini
15. Verify video files writing to Samsung SSD in replays folder

#### .DS_Store Check
```bash
cd cache
ls -la
# If .DS_Store present:
rm .DS_Store
ls -la  # verify removed
```
WARNING: Do NOT open instant replay cache folder in Finder — recreates .DS_Store

### Testing & Verification

1. Add API URLs to admin dashboard:
   - `http://CUSTOMERNAME.podplaydns.com:4000`
   - `https://192.168.32.100:4000`
2. Check DDNS URL from phone (different network):
   - `http://CUSTOMERNAME.podplaydns.com:4000/health`
   - Shows camera connectivity and write status
   - Any error = replay service will fail for all courts
3. Create operations reservation on admin dashboard
4. Add several hundred free replays to user profile (avoid accidental charges)
5. Using iPad: initiate a replay → should display on Apple TV
6. If replay fails:
   - Restart Mac Mini first
   - Test direct: `http://CUSTOMERNAME.podplaydns.com:4000/instant-replay/COURTNAME`
   - Check "On-premises Replay" toggle in admin dashboard
7. If everything working:
   - Print BOM
   - Pack equipment
   - Count all items vs BOM (discrepancy: contact Stan or Chad)
   - Print new BOM and place inside box for customer
   - Tape box securely
   - Weigh package with scale
   - Print shipping label

---

## 2. Hardware Catalog (from research/podplay-hardware-bom.md)

### Network Rack

| Item | Model/Spec | Vendor | Notes |
|------|-----------|--------|-------|
| PDU | TrippLite 12 Outlet RS-1215-RA | Ingram | 1U power strip |
| UDM-SE | UniFi Dream Machine SE | UniFi | Firewall + console with built-in PoE |
| UDM-Pro | UniFi Dream Machine Pro | UniFi | Firewall + console, no PoE |
| UDM-Pro-Max | UniFi Dream Machine Pro Max | UniFi | Firewall + console, no PoE |
| USW-Pro-24-POE | UniFi Switch Pro 24 PoE | UniFi | 24 port PoE |
| USW-24-POE | UniFi Switch 24 PoE | UniFi | 24 port PoE |
| USW-Pro-48-POE | UniFi Switch Pro 48 PoE | UniFi | 48 port PoE |
| SFP Cable | UACC-DAC-SFP10-0.5M | UniFi | UDM ↔ switch ↔ NVR |
| Cat6 Patch 1' | Monoprice Cat6 1' | Amazon | Switch patch cable |
| Cat6 Patch 3' | Monoprice Cat6 3' | Amazon | Mac Mini and PDU |
| Cat6 Patch 10' | Monoprice Cat6 10' | Amazon | Kisi |
| Patch Panel 24 | iwillink 24 Patch Panel w/ Couplers | Amazon | 24 port with coupler keystones |
| Blank Patch Panel | UACC-Rack-Panel-Patch-Blank-24 | UniFi | |
| Patch Panel PassThru | Rapink 24 PassThru Patch Panel | Amazon | Pre-installed keystones |

### PingPod-Specific

| Item | Model | Vendor | Notes |
|------|-------|--------|-------|
| WiFi AP | UniFi U6-Plus | UniFi | For PingPod venues only |

### Front Desk Equipment

| Item | Model | Vendor | Notes |
|------|-------|--------|-------|
| Webcam | Anker PowerConf C200 2K Webcam | Amazon | Check-in photo |
| QR Scanner | 2D QR Barcode Scanner | Amazon | Check-in QR code scanning |
| CC Terminal | BBPOS WisePOS E | Square | PIN pad for card payments; PIN 07139 |

### Surveillance (Autonomous+)

| Item | Model | Vendor | Notes |
|------|-------|--------|-------|
| NVR 4-bay | UniFi UNVR | UniFi | Pickleball clubs |
| NVR 7-bay | UniFi UNVR-Pro | UniFi | Larger venues |
| Hard Drive | WD Purple 8TB HD | Amazon | For NVR storage |
| Security Camera (white) | UniFi G5 Turret Ultra White | UniFi | Pickleball clubs |
| Junction Box (white) | UACC-Camera-CJB-White | UniFi | Pickleball clubs |
| Security Camera (black) | UniFi G5 Turret Ultra Black | UniFi | PingPods |
| Junction Box (black) | UACC-Camera-CJB-Black | UniFi | PingPods |
| Dome Camera | UniFi G5 Dome | UniFi | 2K dome |
| Dome Camera (black) | UniFi G5 Dome Ultra | UniFi | Smaller, black — PingPods |

### Replay System

| Item | Model | Vendor | Notes |
|------|-------|--------|-------|
| Replay Server | Mac Mini 16GB 256 SSD | Apple Business | Chip/year TBC (M1/M2/M4) |
| Rack Shelf | Pyle 19-Inch 1U Vented Shelf | Amazon | Holds Mac Mini |
| SSD Small | Samsung T7 1TB | Amazon | Small club |
| SSD Medium | Samsung T7 2TB | Amazon | Large club |
| SSD Large | Samsung T7 4TB | Amazon | Extra large club |
| Replay Camera (white) | EmpireTech IPC-T54IR-ZE White | EmpireTech | 4MP varifocal (Dahua OEM) |
| Replay Camera (black) | EmpireTech IPC-T54IR-ZE Black | EmpireTech | 4MP varifocal (Dahua OEM) |
| Junction Box (white) | EmpireTech PFA130-E White | EmpireTech | |
| Junction Box (black) | EmpireTech PFA130-E Black | EmpireTech | |
| Score Button | Flic Button | Flic | Bluetooth scoring |
| Signage | Aluminum Printed Sign 6x8 | Fast Signs | Replay/score button labels |
| Hardware Kit | RC Fasteners | RC Fasteners | Bolts, nuts, screws, zip ties |

### Displays

| Item | Model | Vendor | Notes |
|------|-------|--------|-------|
| Apple TV | Apple TV 4K + Ethernet | Apple Business | Display output |
| Mount | HIDEit Mount | HIDEit | Apple TV wall/rack mount |
| HDMI Cable | Amazon Basics 3ft HDMI | Amazon | Per Apple TV |

### Access Control (Autonomous)

| Item | Model | Vendor | Notes |
|------|-------|--------|-------|
| Controller | Kisi Controller Pro 2 | Kisi | Access control controller |
| Reader | Kisi Reader Pro 2 | Kisi | Access control reader |

---

## 3. Pricing & Tier Structure (from Design Document)

### Tiers

| Tier | Description | Venue Fee | Per-Court Fee |
|------|-------------|-----------|---------------|
| Pro | Display + kiosk + replay camera | $5,000 | $2,500 |
| Autonomous | Pro + access control + security cameras | $7,500 | $2,500 |
| Autonomous+ | Autonomous + NVR with storage | $7,500 + surveillance | $2,500 |

Note: PBK (Pickleball Kingdom) is a custom pricing tier referenced in the frontier aspects but not in the design document. Needs clarification.

### Cost Chain Formula (from Design Document)

```
qty = qty_per_venue + (qty_per_court × court_count) + (qty_per_door × doors) + (qty_per_camera × cameras)
est_total_cost = qty × unit_cost
landed_cost = est_total_cost × (1 + shipping_rate)
customer_price = landed_cost / (1 - margin)
```

### Default Settings (from Design Document)

| Setting | Default Value |
|---------|--------------|
| Sales Tax Rate | 10.25% |
| Shipping Rate | 10% |
| Target Margin | 10% |
| Hourly Labor Rate | $120/hr |
| Pro Venue Fee | $5,000 |
| Pro Court Fee | $2,500 |
| Autonomous Venue Fee | $7,500 |
| Autonomous Court Fee | $2,500 |
| Lodging Per Day | $250 |
| Airfare Default | $1,800 |
| Hours Per Day | 10 |

---

## 4. Team & Roles (from Training Transcripts and Unknowns Tracker)

### Internal Team

| Person | Role | Contact |
|--------|------|---------|
| Andy Korzeniacki | PM / Customer Intake | 917-937-6896, andyk@podplay.app |
| Nico (Nico) | Hardware/Config/Installs Lead | Trainer at NJ facility |
| Chad | Ops / former installer | Manages installers, approves setups |
| Stan (Stanley Wu) | Config Specialist | Wrote Config Guide v1.0 |
| Agustin | App Readiness | Confirms PodPlay app ready per client |
| CS Team | Booking/Reservations | Uploads assets |
| Hamza | Configuration assistant (Nico's team) | 2x/week, Tue+Thu |

### Internal Credentials / Tools

- 1Password: Service credentials, ISP logins, FreeDNS, camera passwords
- UniFi Account: PingPodIT (Nico transferring ownership to Cosmos)
- Mosyle MDM: Separate instance for Cosmos (not shared with PingPod)
- Apple Business Manager: Separate account needed (Ilya set up original PodPlay ABM)
- Deployment Server: Jersey City NJ, V2 access being set up by Nico
- Master Accounts Tab: Mac Mini usernames, passwords, remote access details

---

## 5. Operational Workflow Observations (from Training Transcripts)

### Device Handling

- Config lab is in NJ (Jersey City area)
- Hardware is pre-configured before shipping to venue
- Goal: "factory line" approach where each person handles one device type
- Physical test: equipment plugged in, DDNS verified, replay tested BEFORE packing
- Packaging materials kept for RMA/return use

### Device Enrollment Issues

- Apple TV and iPad enrollment can fail randomly; factory reset and retry
- Enrollment errors sometimes caused by phone app blockers (turn off screen time, content restrictions)
- Apple TVs take longer than iPads to enroll
- UniFi: no device search feature in dashboard — relies on correct labeling to identify

### Installer Relationship

- Some venues use PodPlay's vetted installers (NY, CT, NJ)
- Some venues use club's own cheaper installer
- If club uses own installer and has issues: PodPlay ops must troubleshoot remotely
- UniFi labeling convention critical for remote troubleshooting

### Replay Service: V1 vs V2

**V1 (current)**:
- `deploy.py setup <AREA_NAME>` run on deployment server in Jersey City
- Creates package downloaded and deployed on Mac Mini
- Requires VPN into lab
- Uses UDP (pixelation known issue)

**V2 (coming ~April 2026)**:
- Run locally from own GitHub
- Configuration via admin dashboard (no VPN needed)
- Uses TCP (no pixelation)
- Nico offering walkthrough call ~2 weeks post-training

### MDM/ABM Workflow

- Mosyle MDM: Create client device groups BEFORE unboxing
- Apple Business Manager: Enroll devices into ABM; assign VPP licenses for apps
- Device naming in Mosyle: `iPad {Client} Court #` / `AppleTV {Client} Court #`
- First client (Telepark): enrolled under PodPlay's Mosyle; migrate later via release → factory reset → re-enroll

### Cloud Services Structure (from Unknowns Tracker — resolved)

- Admin Dashboard: Deployed by PodPlay; one per venue
- Backend/API: PodPlay-managed; overseas-optimized
- Mosyle MDM: Own Cosmos instance
- Apple Business Manager: Own Cosmos account needed
- UniFi: Nico transferring PingPodIT ownership to Cosmos
- Deployment Server: V2 access being arranged
- App Distribution: VPP licenses via ABM → Mosyle (not public App Store)

---

## 6. Expense Categories (from Design Document)

Expense types tracked per project:
- airfare
- car
- fuel
- lodging
- meals
- misc_hardware
- outbound_shipping
- professional_services
- taxi
- train
- parking
- other

Payment methods:
- podplay_card (company card)
- ramp_reimburse (personal card, Ramp reimbursement)

---

## 7. BOM Generation Quantities (from Design Document)

BOM template structure — per item, quantities are:
- `qty_per_venue`: integer — items that appear once per installation (e.g., 1 UDM, 1 Mac Mini)
- `qty_per_court`: integer — items per court (e.g., 1 iPad, 1 Apple TV, 1 replay camera)
- `qty_per_door`: integer — access control items per door (e.g., 1 Kisi reader per door)
- `qty_per_camera`: integer — surveillance items per security camera (e.g., junction box per camera)

Final qty formula:
```
qty = qty_per_venue + (qty_per_court × courts) + (qty_per_door × doors) + (qty_per_camera × sec_cameras)
```

---

## 8. Deployment Checklist Template Structure (from Design Document)

Template fields:
- phase: int 0–15
- step_number: int (global within phase)
- title: text
- description: text with tokens `{{CUSTOMER_NAME}}`, `{{COURT_COUNT}}`
- warnings: text[] (critical red warnings)

Phase seeding: On project creation, all template steps are copied into `deployment_checklist` with tokens replaced by actual project values.

---

## Summary: What This Analysis Covers vs. What's Missing

### Covered
- Full configuration workflow (networking, cameras, MDM, DDNS, Mac Mini, iPad, Apple TV, testing)
- Complete hardware catalog by category with vendors and models
- Pricing tier structure ($5K/$7.5K venue + $2.5K/court)
- Cost calculation chain (unit → landed → customer price)
- All default settings values
- Team roles and contacts
- Expense categories
- BOM generation formula
- Deployment checklist template structure
- Cloud services topology
- Replay service V1 vs V2 distinction

### Still Missing (needs MRP Usage Guide PDF or XLSX)
- All 24 sheet names and column structures
- Apps Script functions and automation triggers
- Exact hardware unit costs ($ values per item)
- Inventory stock level formulas and reconciliation logic
- Financial reporting formulas (P&L, HER exact calculations)
- Invoice tracking columns and workflow
- Customer onboarding form fields within the MRP
- PBK (Pickleball Kingdom) custom pricing details
- Dropdown/enum exact values in the spreadsheet
- Vendor contact details and account numbers
