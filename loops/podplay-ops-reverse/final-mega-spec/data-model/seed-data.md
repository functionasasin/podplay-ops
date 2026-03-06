# PodPlay Ops Wizard — Seed Data

Complete seed data for all static/reference tables.
This file provides the exact rows to INSERT after running migrations.

**Sources**:
- `analysis/source-deployment-guide.md` (Venue Deployment Guide phases 0–15, appendices)
- `analysis/source-hardware-guide.md` (Hardware Installation Guide)
- `final-mega-spec/data-model/schema.md` (table structures)

---

## Section 1: Deployment Checklist Templates

Table: `deployment_checklist_templates`

All 16 phases (Phase 0–15) decomposed into individual checkable steps.
Token placeholders: `{{CUSTOMER_NAME}}`, `{{COURT_COUNT}}`, `{{DDNS_SUBDOMAIN}}`,
`{{UNIFI_SITE_NAME}}`, `{{MAC_MINI_USERNAME}}`, `{{LOCATION_ID}}`.

`sort_order` = `phase * 100 + step_number` (e.g., Phase 4 Step 3 = sort_order 403).

`applicable_tiers` = NULL means all tiers. Values: `pro`, `autonomous`, `autonomous_plus`, `pbk`.

---

### Phase 0: Pre-Purchase & Planning

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Schedule kickoff call with Andy | Call Andy Korzeniacki at 917-937-6896 (andyk@podplay.app) to schedule kickoff. Review venue layout, tier selection, and ISP situation. | NULL | NULL | NULL | false |
| 2 | Determine installation tier | Select tier: **Pro** = display + kiosk + replay camera per court + network rack. **Autonomous** = Pro + access control (Kisi) + security cameras. **Autonomous+** = Autonomous + NVR with hard drives. **PBK** = Pickleball Kingdom custom pricing. Tier drives all BOM quantities and deployment steps. | NULL | NULL | NULL | false |
| 3 | Determine court count | Confirm number of pickleball courts: {{COURT_COUNT}}. This drives internet speed requirement, switch size, SSD size, and rack size (7–12U). | NULL | ["COURT_COUNT"] | NULL | false |
| 4 | Confirm ISP type | Confirm ISP provider and connection type. Fiber (symmetrical) preferred. Cable acceptable (upload speed is the constraint). Dedicated circuit acceptable. | ["WARNING: PodPlay systems are NOT compatible with Starlink. Starlink uses CGNAT which blocks port 4000 — the entire replay system fails."] | NULL | NULL | false |
| 5 | Confirm internet speed meets requirements | Verify ISP speed meets the court count minimum: 1–4 courts: Fiber 50–100/100 Mbps, Cable 60 Mbps upload, Dedicated 30/30. 5–11 courts: Fiber 150/150, Cable highest possible upload, Dedicated 50/50. 12–19 courts: Fiber 200/200, Cable highest possible, Dedicated 50/50. 20–24 courts: Fiber 300/300, Cable highest possible, Dedicated 100/100. 25+ courts: Fiber 400/400, Cable highest possible, Dedicated 150/150. | NULL | ["COURT_COUNT"] | NULL | false |
| 6 | Confirm static IP or port forward capability | ISP must provide static IP (preferred, $10–20/mo extra) OR venue must be able to port forward port 4000 through the ISP router. If ISP blocks all inbound ports (CGNAT), the system cannot work. | ["WARNING: If ISP cannot provide static IP or port forward capability, the system will not function."] | NULL | NULL | false |
| 7 | Determine mount types | Confirm TV mount type, iPad kiosk mount type, and camera mount accessories per venue layout. Measure ceiling height and baseline distances to determine camera mount height (see Phase 12 for height table). | NULL | NULL | NULL | false |
| 8 | Calculate Cat6 cable requirements | Calculate Cat6 quantity: courts × avg_distance_ft × 3 drops + door_count × avg_distance_ft × 1 drop + security_camera_count × avg_distance_ft. Leave 12 feet coiled at each replay camera. Leave 3 feet minimum coiled at each display/kiosk. Max run: 100m (328 ft); beyond requires intermediate switch. | NULL | ["COURT_COUNT"] | NULL | false |

---

### Phase 1: Pre-Configuration (PodPlay Office)

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Create iPad device group in Mosyle | In Mosyle MDM → Devices → Groups → Create new group for client iPads. Name: "{{CUSTOMER_NAME}} iPads" | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 2 | Create Apple TV device group in Mosyle | In Mosyle MDM → Devices → Groups → Create new group for client Apple TVs. Name: "{{CUSTOMER_NAME}} Apple TVs" | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 3 | Create Install App group in Mosyle with P-List | In Mosyle → Profiles → Install App → Create new profile for both iPads and Apple TVs. Add P-List configuration: `<dict><key>id</key><string>{{LOCATION_ID}}</string></dict>`. The LOCATION_ID must be confirmed with Agustin (app readiness) before this step. | ["WARNING: LOCATION_ID must come from the PodPlay development team (Agustin). Confirm it is ready before configuring."] | ["CUSTOMER_NAME", "LOCATION_ID"] | NULL | false |
| 4 | Enable on-premises replays in admin dashboard | In client's PodPlay admin dashboard → Settings → Venues → Select location → Enable "On-premises Replays Enabled" toggle. | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 5 | Note DDNS and local replay URLs | Record the two replay API URLs for later use in Phase 13 (Testing): API URL: `http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000` and Local URL: `http://192.168.32.100:4000`. These will be entered into the admin dashboard during Testing & Verification. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 6 | Verify hardware quantities against BOM | Count all items on hand: iPads, Apple TVs, UniFi equipment (UDM, switch, PDU), Mac Mini, cameras, Flic buttons, PoE adapters, kiosk cases, HDMI cables. Verify quantities match the BOM for {{COURT_COUNT}} courts. | NULL | ["COURT_COUNT"] | NULL | false |
| 7 | Confirm PodPlay app is ready for customer | Ask Agustin that the PodPlay kiosk app binary is ready and available in Apple Business Manager (VPP) for this specific venue. Do not proceed with iPad setup until confirmed. | ["WARNING: App must be available in VPP (not App Store). Apps are white-labeled per facility."] | ["CUSTOMER_NAME"] | NULL | false |

---

### Phase 2: Unboxing & Labeling

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Unbox UniFi network equipment | Unbox UDM (gateway), switch, PDU (TrippLite RS-1215-RA), and NVR (Autonomous+ only). Keep all packaging materials intact — they are reused for shipping the completed rack to the venue. | NULL | NULL | NULL | false |
| 2 | Label courts with Brother label machine | Using the Brother label machine, create court labels: C1, C2, C3, C4... through C{{COURT_COUNT}}. These labels go on all devices associated with each court. | NULL | ["COURT_COUNT"] | NULL | false |
| 3 | Unbox and label iPads | Unbox each iPad. Label the box AND the back of each iPad with its court number (C1, C2, etc.). | NULL | NULL | NULL | false |
| 4 | Unbox and label Apple TVs | Unbox each Apple TV. Label the box, the Apple TV unit itself, and the remote with the court number (C1, C2, etc.). | NULL | NULL | NULL | false |
| 5 | Unbox and label PoE chargers | Unbox each PoE adapter. Label the box and the charger with the court number (C1, C2, etc.). | NULL | NULL | NULL | false |
| 6 | Unbox and label replay cameras | Unbox each replay camera. Place label on top of the camera housing with the court number (C1, C2, etc.). | NULL | NULL | NULL | false |
| 7 | Unbox and label Mac Mini | Unbox the Mac Mini. Label with the location name: {{CUSTOMER_NAME}}. | NULL | ["CUSTOMER_NAME"] | NULL | false |

---

### Phase 3: Network Rack Assembly

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Install UPS at bottom of rack | Place UPS at the bottom of the rack enclosure. Connect the internal UPS battery first before installing anything else. The UPS must be connected before any devices are powered. | ["WARNING: Connect internal UPS battery BEFORE installing any equipment above it."] | NULL | NULL | false |
| 2 | Install PDU on back of rack | Mount the TrippLite RS-1215-RA 12-outlet PDU on the back of the rack to conserve front rack units. | NULL | NULL | NULL | false |
| 3 | Mount Mac Mini shelf | Install a 2U rack shelf at the top position of the rack for the Mac Mini. The Mac Mini sits on this shelf and needs breathing room above — do not install anything directly above that blocks airflow. | ["WARNING: Mac Mini needs breathing room — overheating is a known failure mode. Do NOT install flush against other equipment."] | NULL | NULL | false |
| 4 | Install patch panel | Install 24-port patch panel with inline couplers (or punch-down keystones if capable). This goes below the Mac Mini shelf. | NULL | NULL | NULL | false |
| 5 | Arrange and mount all rack components in order | Mount devices top-to-bottom: (1) Mac Mini on 2U shelf at top, (2) ISP Modem if rack-mountable, (3) UDM gateway (UDM-SE / Pro / Pro-Max), (4) Patch Panel 24-port, (5) Switch (USW-Pro-24-POE or 48-POE, size varies by court count), (6) NVR (Autonomous+ only: UNVR or UNVR-Pro), (7) UPS at bottom. PDU on back. | NULL | NULL | NULL | false |
| 6 | Connect all devices to PDU → UPS → 20A circuit | All rack devices plug into PDU outlets. PDU plugs into UPS. UPS plugs into a dedicated 20A circuit at the venue. Apply outlet labels on PDU to identify which device is on which outlet. | ["WARNING: Requires dedicated 20A circuit. Do not share with other venue loads."] | NULL | NULL | false |

---

### Phase 4: Networking Setup (UniFi)

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Power on rack devices | Power on PDU. Plug in and power on: UDM, Switch, NVR (Autonomous+ only), Mac Mini. | NULL | NULL | NULL | false |
| 2 | Sign into PingPodIT UniFi account | Using UniFi app on phone, sign into the PingPodIT account to adopt the UDM. | NULL | NULL | NULL | false |
| 3 | Configure UDM site name | Set up UDM site with naming scheme: `PL-{{CUSTOMER_NAME}}` (e.g., PL-TELEPARK). This becomes the UniFi site name visible in the PingPodIT account. | NULL | ["CUSTOMER_NAME", "UNIFI_SITE_NAME"] | NULL | false |
| 4 | Create local admin account on UDM | On UDM: Settings → Admins → Create local admin account. Username: `admin`. Password: use internal credentials (stored in master accounts). | NULL | NULL | NULL | false |
| 5 | Apply port labels to UDM | In UniFi, apply labels to all UDM ports identifying connected devices: Mac Mini, Kisi Controller (Autonomous), Backup Internet (Autonomous 24/7), etc. | NULL | NULL | NULL | false |
| 6 | Label PDU in UniFi | In UniFi, label the PDU with connected device names (UDM, Switch, Mac Mini, NVR, etc.) for remote power management reference. | NULL | NULL | NULL | false |
| 7 | Connect switch to UDM via SFP DAC cable | Connect the USW-Pro switch to the UDM using the UACC-DAC-SFP10-0.5M SFP DAC cable. Apply labels to switch ports identifying connected devices (iPads, cameras, Apple TVs, Kisi readers, etc.). | NULL | NULL | NULL | false |
| 8 | Connect Mac Mini to UDM Port 1 | Power on Mac Mini. Connect Mac Mini via ethernet to Port #1 on the UDM. | NULL | NULL | NULL | false |
| 9 | Create REPLAY VLAN (VLAN 32) | In UniFi → Settings → Networks → Create new network: Name=REPLAY, Host Address=192.168.32.254, Netmask=/24, Gateway=192.168.32.254, Broadcast=192.168.32.255, VLAN ID=32 (Manual), Allow Internet Access=Yes, mDNS=Yes (required for Apple TV discovery), DHCP Mode=DHCP Server, DHCP Range=192.168.32.1–192.168.32.254. NOTE: Do NOT change the default network yet — cameras need 192.168.1.1 subnet during initial configuration (cameras default to 192.168.1.108). | ["WARNING: Do NOT change the default network to 192.168.30.x yet — cameras must be configured first on 192.168.1.x. Change default network only after ALL cameras are configured (Phase 6, Step 8)."] | NULL | NULL | false |
| 10 | Create SURVEILLANCE VLAN (VLAN 31) | In UniFi → Settings → Networks → Create new network: Name=SURVEILLANCE, Subnet=192.168.31.x, VLAN ID=31. This VLAN isolates the NVR and security cameras. | NULL | NULL | ["autonomous_plus"] | false |
| 11 | Create ACCESS CONTROL VLAN (VLAN 33) | In UniFi → Settings → Networks → Create new network: Name=ACCESS CONTROL, Subnet=192.168.33.x, VLAN ID=33. This VLAN isolates Kisi controllers and door readers. | NULL | NULL | ["autonomous", "autonomous_plus"] | false |
| 12 | Configure port 4000 port forward on UDM | In UniFi → Settings → Firewall & Security → Port Forwarding → Add rule: Name=Replay Service, Protocol=TCP/UDP, External Port=4000, Forward IP=192.168.32.100, Internal Port=4000. This forwards all replay service traffic from internet to Mac Mini. | ["WARNING: Port 4000 is critical — ALL replay service communication (cloud sync, instant replay, health checks) flows through it. If blocked, the entire system fails."] | NULL | NULL | false |

---

### Phase 5: ISP Router Configuration

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Configure ISP router for external access | Configure ISP router using preferred method in priority order: (1) BEST — Static IP: Order static IP from ISP ($10–20/mo). On UDM → Settings → Internet → WAN1 → Advanced → Manual → enter static IP. (2) DMZ: Put UDM's WAN IP into the ISP router's DMZ. (3) LAST RESORT — Port Forward: Forward port 4000 TCP/UDP to UDM WAN IP on the ISP router (ISP-dependent). Supported ISPs: US: Verizon, Optimum, Spectrum, Google Fiber. Philippines: PLDT Beyond Fiber, Globe GFiber Biz, Converge FlexiBIZ. | ["WARNING: Philippines venues MUST have a business plan + static IP. Residential plans use CGNAT which blocks ALL incoming connections — system will not function.", "WARNING: Autonomous 24/7 venues require two ISPs from different providers/backbones (e.g., PLDT + Converge or Verizon + Spectrum). Configure secondary WAN on UDM for failover."] | NULL | NULL | false |
| 2 | Verify UDM port forward is active | Confirm on UDM that port 4000 TCP/UDP forwards to 192.168.32.100 (Mac Mini). This is in addition to any ISP router port forward configured in Step 1. | NULL | NULL | NULL | false |

---

### Phase 6: Camera Configuration

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Plug in first camera to switch | Plug ONE camera into the switch. Do NOT plug in multiple cameras at once — all cameras share the factory default IP 192.168.1.108, causing IP conflicts. | ["WARNING: Configure ONE camera at a time. All cameras ship with default IP 192.168.1.108. Plugging in multiple cameras simultaneously causes IP conflicts and the browser interface will be unreachable."] | NULL | NULL | false |
| 2 | Open camera web interface | In browser, navigate to `192.168.1.108`. The EmpireTech camera web interface should load. | NULL | NULL | NULL | false |
| 3 | Set initial region/language/video standard | Set: Region=United States, Language=English, Video Standard=NTSC. (Asia deployments: verify NTSC vs PAL before changing — open question for Philippines.) | NULL | NULL | NULL | false |
| 4 | Set date and time | Set date format=YYYY-MM-DD. Set correct time zone and local time. | NULL | NULL | NULL | false |
| 5 | Set camera credentials | Set credentials: username=`admin`, password=per internal credentials, email=`support@pingpod.com`. | NULL | NULL | NULL | false |
| 6 | Set network to DHCP | Settings → Network Settings → Change mode to DHCP. Camera will get a DHCP IP from the switch. | NULL | NULL | NULL | false |
| 7 | Assign camera to REPLAY VLAN with fixed IP | In UniFi → Clients → find camera by MAC → assign to REPLAY VLAN (192.168.32.x subnet) → set fixed IP. Each camera gets a sequential fixed IP on the REPLAY VLAN. | NULL | NULL | NULL | false |
| 8 | Configure main stream encoding | Settings → Encoding → Main Stream: Compression=H.264, Resolution=1920×1080 (1080P), Frame Rate=30 FPS, Bit Rate Type=VBR, Quality=6 (Best), Max Bit Rate=8192 Kb/s, I Frame Interval=90, SVC=1 (off), Smooth Stream=50, Watermark=Off. | NULL | NULL | NULL | false |
| 9 | Configure sub stream encoding | Settings → Encoding → Sub Stream: Compression=H.265, Resolution=704×480 (D1), Frame Rate=30 FPS, Bit Rate Type=CBR, Bit Rate=512 Kb/s, I Frame Interval=60, Smooth Stream=50. | NULL | NULL | NULL | false |
| 10 | Disable overlay (channel title and time) | Settings → Overlay: Turn OFF Channel Title. Turn OFF Time Title. Both must be disabled to prevent burned-in text on replay footage. | NULL | NULL | NULL | false |
| 11 | Configure audio | Settings → Audio: Input=Microphone, Enable on main stream=Yes, Encoding=G.711Mu, Sampling Rate=8000 Hz, Noise Filter=On, Volume=50. | NULL | NULL | NULL | false |
| 12 | Repeat for remaining cameras | Repeat steps 1–11 for each remaining camera, one at a time. Confirm each camera gets its unique fixed IP on the REPLAY VLAN before unplugging and plugging in the next. | NULL | ["COURT_COUNT"] | NULL | false |
| 13 | Change default network to management subnet | After ALL cameras are configured: in UniFi → Settings → Networks → Default network → change host address to 192.168.30.1 subnet. This is safe to do now since cameras are on REPLAY VLAN (192.168.32.x). | ["WARNING: Only change the default network AFTER all cameras are fully configured. Changing it earlier will break the 192.168.1.x subnet needed to access cameras at their factory default IP."] | NULL | NULL | false |

---

### Phase 7: DDNS Setup (FreeDNS)

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Create FreeDNS A record | Go to freedns.afraid.org → Dynamic DNS → click [add]. Create record: Type=A, Subdomain={{DDNS_SUBDOMAIN}}, Domain=podplaydns.com (private/stealth), Destination=10.10.10.10 (placeholder — will be auto-updated by cron), TTL=60 seconds, Wildcard=Unchecked. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 2 | Get cron update URL | On FreeDNS → Dynamic DNS → click "quick cron example" for the new record. Copy the cron line shown. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 3 | Install DDNS cron on Mac Mini | In the copied cron line: replace `wget` with `curl`, add quotes around the URL. Final format: `0,5,10,15,20,25,30,35,40,45,50,55 * * * * sleep 33 ; curl "https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY" >> /tmp/freedns_{{DDNS_SUBDOMAIN}}_podplaydns_com.log 2>&1 &`. On Mac Mini terminal: `crontab -e` → press `i` (insert mode) → paste line → press Esc → type `:wq` → Enter. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 4 | Verify DDNS update | Wait 5 minutes. Verify the FreeDNS record updated to the venue's real public IP (not 10.10.10.10). | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 5 | Check DDNS cron log | On Mac Mini, check: `cat /tmp/freedns_{{DDNS_SUBDOMAIN}}_podplaydns_com.log`. Should show successful update responses. If empty or errors, verify cron was saved correctly with `crontab -l`. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |

---

### Phase 8: Mac Mini Setup

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Confirm admin dashboard access | Log into client's PodPlay admin dashboard and confirm settings access (Venues, On-premises Replays toggle). | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 2 | Add cameras to Replay Service Configuration | In the Replay Service Configuration (RSC) sheet, add all cameras with the same names as configured in the admin dashboard. Camera names must match exactly (case-sensitive) — used as folder names in the cache directory. | NULL | ["CUSTOMER_NAME", "COURT_COUNT"] | NULL | false |
| 3 | Record Mac Mini credentials | Write down Mac Mini macOS username and password in the master accounts tab. Username: {{MAC_MINI_USERNAME}}. | NULL | ["MAC_MINI_USERNAME"] | NULL | false |
| 4 | Connect and erase Samsung SSD | Connect Samsung T7 SSD (1TB / 2TB / 4TB depending on court count) to Mac Mini USB-C. In Disk Utility: erase drive per the RSC sheet instructions, format as APFS or ExFAT as specified. | NULL | NULL | NULL | false |
| 5 | Create cache folder with court subfolders | On Mac Mini, open home folder (Cmd+Shift+H). Create a folder named `cache`. Inside `cache`, create one subfolder per court named exactly matching each camera name from the RSC sheet. These subfolders are used for instant replay processing. | ["WARNING: NEVER open the cache folder in Finder once the replay service is running — Finder creates a .DS_Store file in the folder which breaks replay processing."] | ["COURT_COUNT"] | NULL | false |
| 6 | Assign Mac Mini to REPLAY VLAN with fixed IP | In UniFi → Clients → find Mac Mini by MAC address → assign to REPLAY VLAN (VLAN 32) → set fixed IP to exactly `192.168.32.100`. This address is hardcoded in the replay service and port forward rules. | ["WARNING: Mac Mini MUST be assigned IP 192.168.32.100 on REPLAY VLAN 32. This is a hardcoded address used by the replay service, port forward rules, and admin dashboard."] | NULL | NULL | false |
| 7 | Create SSD symlink if needed | If video clips do not automatically save to the Samsung SSD, create a symlink: `ln -s /Volumes/Replays/clips /Users/{{MAC_MINI_USERNAME}}/` This ensures the replay service writes to the SSD rather than the internal drive. | NULL | ["MAC_MINI_USERNAME"] | NULL | false |
| 8 | Remove .DS_Store from cache folder | In Mac Mini terminal: `cd cache && rm .DS_Store`. Run this after creating the cache folder to remove any .DS_Store files Finder may have created. | ["WARNING: NEVER open the cache folder in Finder after this point. Finder recreates .DS_Store which breaks replay processing. Always use terminal to access the cache folder."] | NULL | NULL | false |

---

### Phase 9: Replay Service Deployment (V1)

`is_v2_only = false` for all steps in this phase.
NOTE: V2 replay service (expected ~April 2026) will replace steps 1–6 with GitHub deploy + dashboard config.
V2 uses TCP (fixing V1 pixelation known issue). When V2 is available, these steps are replaced.

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Connect to Jersey City Deployment Server | Connect to the PodPlay deployment server in Jersey City via VPN. Credentials stored in internal credentials store. | NULL | NULL | NULL | false |
| 2 | Upload venue logo to assets folder | Upload the venue/club logo image file to the assets folder in the home folder on the deployment server. | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 3 | Verify logo name matches RSC | Confirm the logo filename matches exactly the name specified in the Replay Service Configuration (RSC) sheet. | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 4 | Run Upload Asset script | In deployment server terminal, launch the Upload Asset script to register the logo with the replay service. | NULL | NULL | NULL | false |
| 5 | Create deployment package | In deployment server terminal, run: `./deploy.py setup {{CUSTOMER_NAME}}`. This generates a download URL for the configured replay service package. | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 6 | Copy generated URL | Copy the generated download URL from the terminal output to a notepad. This URL is used to download the package onto the Mac Mini. | NULL | NULL | NULL | false |
| 7 | Download package on Mac Mini | On Mac Mini, open browser or terminal. Download the package from the URL copied in Step 6. | NULL | NULL | NULL | false |
| 8 | Grant privacy/security permissions | First open: System Settings → Privacy & Security → scroll down → Open Anyway (for the downloaded package). Add "Find" and "Node" to Full Disk Access list in System Settings → Privacy & Security → Full Disk Access. | NULL | NULL | NULL | false |
| 9 | Restart Mac Mini | Restart the Mac Mini. This ensures all privacy permissions take effect and the replay service starts clean. | NULL | NULL | NULL | false |
| 10 | Verify video files writing to SSD | After restart, confirm that video files are being written to the Samsung SSD by checking the `/Volumes/Replays/clips` directory or the symlinked clips folder. | NULL | NULL | NULL | false |

---

### Phase 10: iPad Setup

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Connect PoE adapters to switch | Plug each PoE adapter into the switch. Connect each iPad to its corresponding PoE adapter using Lightning or USB-C cable. NOTE: UniFi detects the PoE injector, not the iPad itself. If you move a PoE injector to a different port, UniFi will show the injector on the new port. | NULL | NULL | NULL | false |
| 2 | Power on iPads in court-number order | Power on iPads strictly in court-number order: C1 first, then C2, then C3, etc. Wait for each iPad to boot before powering on the next. | ["WARNING: Mosyle enrolls iPads in the order they are powered on. If powered on out of order, device-to-court mapping in Mosyle will be WRONG. Filter by enrolled date in Mosyle to verify order after enrollment."] | ["COURT_COUNT"] | NULL | false |
| 3 | Confirm managed device screen | After each iPad connects to internet (wait ~5 seconds), the screen should display "This device is managed by Pingpod Inc". If the managed screen does not appear: go back to the first setup screen and retry. If still not showing after retry: use Apple Deployment Manager to re-add the device. ~80% of devices enroll successfully on first attempt. Factory reset and retry if needed. | NULL | NULL | NULL | false |
| 4 | Turn off auto-lock during configuration | On each iPad, go to Settings → Display & Brightness → Auto-Lock → set to Never. MDM commands cannot reach a sleeping iPad — keep displays on throughout configuration. | ["WARNING: MDM commands cannot be sent to sleeping iPads. Auto-lock MUST be off during all configuration steps."] | NULL | NULL | false |
| 5 | Assign iPads to client group in Mosyle | In Mosyle, assign each newly enrolled iPad to the client's iPad device group. Name each device: `iPad {{CUSTOMER_NAME}} Court #` (e.g., "iPad TELEPARK Court 1"). | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 6 | Create VPP app install profile in Mosyle | In Mosyle → Profiles → Install App → Create new profile. Installation source: VPP (NEVER App Store — apps are custom/white-labeled per facility). Verify sufficient VPP licenses available in Apple Business Manager. | ["WARNING: NEVER install the PodPlay app from the App Store. Apps are white-labeled per facility and ONLY available via VPP licenses in Apple Business Manager."] | NULL | NULL | false |
| 7 | Add P-List config with Location ID | In the Install App profile, click Add App → search for client's PodPlay kiosk app. Add P-List configuration: `<dict><key>id</key><string>{{LOCATION_ID}}</string></dict>`. The LOCATION_ID routes the app to the correct backend/venue. | NULL | ["LOCATION_ID", "CUSTOMER_NAME"] | NULL | false |
| 8 | Configure app update settings | Enable Auto App Install Update setting. Set auto-update behavior to "do not update automatically" to avoid disrupting play during operating hours. Updates are pushed during the 2:00–3:00 AM maintenance window. | NULL | NULL | NULL | false |
| 9 | Verify app shows correct venue | On each iPad, confirm the PodPlay app displays the customer's club name. If app shows wrong club or does not load: check the "Install App" group in Mosyle — P-List config must have the correct LOCATION_ID string. | NULL | ["CUSTOMER_NAME", "LOCATION_ID"] | NULL | false |
| 10 | Enable App Lock (Guided Access) | In Mosyle, enable App Lock for all client iPads. This locks the device to the PodPlay app — users cannot exit to the home screen or other apps. | NULL | NULL | NULL | false |
| 11 | Schedule App Lock maintenance window | Set App Lock schedule: OFF from 2:00 AM to 3:00 AM daily. During this window: app lock disengages, device restarts, MDM pushes pending updates. MDM commands (app updates, config pushes) are sent at ~2:30 AM. App lock re-engages at 3:00 AM. For initial setup only: keep App Lock at 24/7 until all configuration and testing is complete. | ["WARNING: NEVER send a Shutdown command from Mosyle — only Restart. A shutdown requires physical on-site access to power the iPad back on."] | NULL | NULL | false |

---

### Phase 11: Apple TV Setup

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Power on Apple TVs and connect to switch | Power on each Apple TV. Connect via ethernet to the switch (REPLAY VLAN port). | NULL | NULL | NULL | false |
| 2 | Connect HDMI to TV | Connect Apple TV HDMI output to HDMI 1 input on the 65" display. Use Amazon Basics 3ft HDMI cable. | NULL | NULL | NULL | false |
| 3 | Confirm Remote Management screen | After Location Services screen, the Apple TV should display: "Pingpod Inc will automatically configure your AppleTV". If the Remote Management screen does not appear: go all the way back to the first setup screen and retry. If the Apple TV was set up without Remote Management: use Apple Deployment Manager to re-add the device. | NULL | NULL | NULL | false |
| 4 | Assign Apple TVs to client group in Mosyle | In Mosyle, assign each newly enrolled Apple TV to the client's Apple TV device group. Name each device: `AppleTV {{CUSTOMER_NAME}} Court #` (e.g., "AppleTV TELEPARK Court 1"). | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 5 | Verify app shows client venue | On each Apple TV, confirm the PodPlay display app shows the client's venue/club name. If app shows wrong club: check the "Install App" group in Mosyle — P-List config must have correct LOCATION_ID. | NULL | ["CUSTOMER_NAME", "LOCATION_ID"] | NULL | false |

---

### Phase 12: Physical Installation (On-Site)

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Mount replay cameras at correct height | Mount EmpireTech IPC-T54IR-ZE replay cameras at specified height based on distance from baseline: 21'–26' from baseline → 12' AFF. 16'–20' (ideal) → 11' AFF. 12'–15' → 10' AFF. 9'–11' → 9' AFF. Under 9' → 8' AFF. Mount 16–20 feet behind baseline (ideal). | NULL | ["COURT_COUNT"] | NULL | false |
| 2 | Leave cable slack at camera | Leave 12 feet of Cat6 cable coiled at each camera location. This allows future repositioning without cable shortage. | NULL | NULL | NULL | false |
| 3 | Align opposing cameras | Opposing cameras (one each end of court) must be mounted at the exact same height AFF. Misaligned cameras produce distorted replay angles. | NULL | NULL | NULL | false |
| 4 | Maintain court separation | Mount each camera at least 2 feet from the adjacent court's baseline to avoid interference with neighboring court replay footage. | NULL | NULL | NULL | false |
| 5 | Mount 65" TV display | Mount 65" TV at 8'9" AFF, centered on court, aligned with net (spectator side). Use VESA 400×300 mount (included with TV order). Hide ethernet cable, outlet, and Apple TV unit behind the TV. | NULL | NULL | NULL | false |
| 6 | Mount iPad kiosk | Mount iPad kiosk case at 4'8" AFF, center court. Hide PoE adapter behind wall (drywall venues) or behind TV (concrete/masonry venues). Keep the kiosk case keys — hand them to the customer at go-live. | NULL | NULL | NULL | false |
| 7 | Mount and label Flic buttons | Mount 2 Flic buttons per court on fence/wall behind baseline: one left side, one right side. Label each button with court number and side using Sharpie (e.g., C1-L, C1-R). Pre-pair buttons with their corresponding iPad (same court number). Button actions: Single press=score, Double press=undo, Long press=get replay. Battery: CR2032 coin cell. Yellow blink=low battery. Factory reset: remove battery → wait 5s → reinsert → hold top+bottom 10s until red blink. | ["WARNING: App Lock MUST be turned OFF before pairing Flic buttons. If App Lock is on during pairing, you will see 'Bluetooth Pairing Failed' / 'Verification Failed'. Turn off App Lock for the location in Mosyle, pair all buttons, then re-enable App Lock."] | ["COURT_COUNT"] | NULL | false |
| 8 | Install Kisi Controller | Install Kisi Controller Pro 2 at the venue. Mount in secure location with power and ethernet access to ACCESS CONTROL VLAN (192.168.33.x). | NULL | NULL | ["autonomous", "autonomous_plus"] | false |
| 9 | Install door readers | Install Kisi door readers at all access-controlled doors. Wire each reader back to the Kisi Controller. | NULL | NULL | ["autonomous", "autonomous_plus"] | false |
| 10 | Wire door locks | Wire door locks: mag lock for glass doors (fail-safe — unlocks on power loss). Electric strike for panic bar doors (fail-secure — stays locked on power loss). NOTE: UniFi Door Hub output is 12V DC at up to 1A. Higher amperage locks or fire code requirements need a separate power supply. | NULL | NULL | ["autonomous", "autonomous_plus"] | false |

---

### Phase 13: Testing & Verification

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Add API URLs to admin dashboard | In client's PodPlay admin dashboard → Settings → Venues → Select location. Add both URLs: API URL=`http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000`, Local URL=`http://192.168.32.100:4000`. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 2 | Verify DDNS from external network | From a phone on cellular (NOT connected to venue WiFi), verify DDNS health endpoint responds: `curl http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health`. Success = any JSON response (even a 404 JSON means Mac Mini is reachable). The health endpoint shows: camera status, SSD usage %, rename service status, CPU/memory. If no response: (A) Restart Mac Mini first. (B) Verify port 4000 forward on ISP router → UDM → Mac Mini IP 192.168.32.100. (C) Verify "On-premises Replay" toggle is enabled in dashboard. | ["WARNING: Test MUST be done from cellular/external network — not from venue WiFi. Testing from venue WiFi bypasses the ISP router and will give a false positive."] | ["DDNS_SUBDOMAIN"] | NULL | false |
| 3 | Test RTSP camera streams | Use VLC media player to test each camera's RTSP stream. Verify video quality matches encoding settings (1080P, 30fps). | NULL | ["COURT_COUNT"] | NULL | false |
| 4 | Create test reservation | In PodPlay admin dashboard, create an operations reservation (free, for testing) on a court. | NULL | ["CUSTOMER_NAME"] | NULL | false |
| 5 | Add free replay credits | On the ops person's user profile in the admin dashboard, add free replay credits to avoid being charged during testing. | NULL | NULL | NULL | false |
| 6 | Test instant replay end-to-end | On an iPad, initiate a replay request. Verify: (A) Replay processing appears on Mac Mini. (B) Instant replay video appears on the Apple TV in the same court. If replay doesn't work: restart Mac Mini → test replay stream directly: `http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/instant-replay/COURTNAME`. | NULL | ["DDNS_SUBDOMAIN", "COURT_COUNT"] | NULL | false |
| 7 | Test Flic button actions | With App Lock OFF, test each Flic button: Single press → score increments on iPad. Double press → score decrements. Long press → replay initiated. On iPad, open configuration menu (long-press logo in corner) → verify left and right buttons appear in button assignment section → press each button → indicator turns green with button event logged. If button event shows but scoring doesn't update: restart iPad to re-sync Firebase connection. | ["WARNING: App Lock must be OFF during button testing."] | ["COURT_COUNT"] | NULL | false |
| 8 | Re-enable App Lock | After all testing is complete, re-enable App Lock for all iPads in Mosyle. Confirm 2:00–3:00 AM maintenance window is configured. | NULL | NULL | NULL | false |

---

### Phase 14: Health Monitoring Setup

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Set up Google Cloud uptime check | In Google Cloud Platform (can use own GCP account): Monitoring → Uptime Checks → Create check. Target URL: `http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health`. Frequency: every 5 minutes. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 2 | Configure health check alerts | Set up GCP alerting policy: Alert if health check fails for 2 consecutive checks. Checks monitored: SSD storage < 80%, memory/swap normal, CPU load normal, rename service running, network link status up. | NULL | ["DDNS_SUBDOMAIN"] | NULL | false |
| 3 | Route alerts to Slack | Configure GCP alert notifications to send to Slack channel (or configurable webhook destination). Reference: Nico monitors ~70 live locations with this same setup. | NULL | ["CUSTOMER_NAME"] | NULL | false |

---

### Phase 15: Packaging & Shipping

| step_number | title | description | warnings | auto_fill_tokens | applicable_tiers | is_v2_only |
|-------------|-------|-------------|----------|------------------|------------------|------------|
| 1 | Print Bill of Materials | Print the final BOM from the ops system for {{CUSTOMER_NAME}} ({{COURT_COUNT}} courts). | NULL | ["CUSTOMER_NAME", "COURT_COUNT"] | NULL | false |
| 2 | Count all items against BOM | Physically count all items in the shipping box against the printed BOM. If any mismatch: contact Stan or Chad before sealing. | ["WARNING: Item count must match BOM exactly before sealing. Contact Stan or Chad immediately if any discrepancy."] | NULL | NULL | false |
| 3 | Place BOM inside box | Print a second copy of the BOM. Place it inside the shipping box so the venue can verify receipt. | NULL | NULL | NULL | false |
| 4 | Seal and tape box | Securely tape box closed. Use excess tape — box will be shipped via freight or parcel carrier. | NULL | NULL | NULL | false |
| 5 | Weigh package | Weigh the sealed package using the office scale. Record weight for shipping label. | NULL | NULL | NULL | false |
| 6 | Print and apply shipping label | Print shipping label with venue address. Apply to outside of box. Retain tracking number in project record. | NULL | ["CUSTOMER_NAME"] | NULL | false |

---

### SQL INSERT: deployment_checklist_templates (121 rows)

```sql
-- ============================================================
-- Seed Data: deployment_checklist_templates
-- 16 phases (0–15), 121 total steps
-- Sort order: phase × 100 + step_number
-- applicable_tiers NULL = all tiers
-- is_v2_only = false for all current rows (V2 not yet launched)
-- ============================================================
INSERT INTO deployment_checklist_templates
  (phase, phase_name, step_number, title, description, warnings, auto_fill_tokens, applicable_tiers, is_v2_only, sort_order)
VALUES

-- ============================================================
-- Phase 0: Pre-Purchase & Planning (8 steps)
-- ============================================================
(0,'Phase 0: Pre-Purchase & Planning',1,
 'Schedule kickoff call with Andy',
 'Call Andy Korzeniacki at 917-937-6896 (andyk@podplay.app) to schedule kickoff. Review venue layout, tier selection, and ISP situation.',
 NULL,NULL,NULL,false,1),

(0,'Phase 0: Pre-Purchase & Planning',2,
 'Determine installation tier',
 'Select tier: Pro = display + kiosk + replay camera per court + network rack. Autonomous = Pro + access control (Kisi) + security cameras. Autonomous+ = Autonomous + NVR with hard drives. PBK = Pickleball Kingdom custom pricing. Tier drives all BOM quantities and deployment steps.',
 NULL,NULL,NULL,false,2),

(0,'Phase 0: Pre-Purchase & Planning',3,
 'Determine court count',
 'Confirm number of pickleball courts: {{COURT_COUNT}}. This drives internet speed requirement, switch size, SSD size, and rack size (7–12U).',
 NULL,ARRAY['COURT_COUNT'],NULL,false,3),

(0,'Phase 0: Pre-Purchase & Planning',4,
 'Confirm ISP type',
 'Confirm ISP provider and connection type. Fiber (symmetrical) preferred. Cable acceptable (upload speed is the constraint). Dedicated circuit acceptable.',
 ARRAY['WARNING: PodPlay systems are NOT compatible with Starlink. Starlink uses CGNAT which blocks port 4000 — the entire replay system fails.'],
 NULL,NULL,false,4),

(0,'Phase 0: Pre-Purchase & Planning',5,
 'Confirm internet speed meets requirements',
 'Verify ISP speed meets the court count minimum: 1–4 courts: Fiber 50–100/100 Mbps, Cable 60 Mbps upload, Dedicated 30/30. 5–11 courts: Fiber 150/150, Cable highest possible upload, Dedicated 50/50. 12–19 courts: Fiber 200/200, Cable highest possible, Dedicated 50/50. 20–24 courts: Fiber 300/300, Cable highest possible, Dedicated 100/100. 25+ courts: Fiber 400/400, Cable highest possible, Dedicated 150/150.',
 NULL,ARRAY['COURT_COUNT'],NULL,false,5),

(0,'Phase 0: Pre-Purchase & Planning',6,
 'Confirm static IP or port forward capability',
 'ISP must provide static IP (preferred, $10–20/mo extra) OR venue must be able to port forward port 4000 through the ISP router. If ISP blocks all inbound ports (CGNAT), the system cannot work.',
 ARRAY['WARNING: If ISP cannot provide static IP or port forward capability, the system will not function.'],
 NULL,NULL,false,6),

(0,'Phase 0: Pre-Purchase & Planning',7,
 'Determine mount types',
 'Confirm TV mount type, iPad kiosk mount type, and camera mount accessories per venue layout. Measure ceiling height and baseline distances to determine camera mount height (see Phase 12 for height table).',
 NULL,NULL,NULL,false,7),

(0,'Phase 0: Pre-Purchase & Planning',8,
 'Calculate Cat6 cable requirements',
 'Calculate Cat6 quantity: courts x avg_distance_ft x 3 drops + door_count x avg_distance_ft x 1 drop + security_camera_count x avg_distance_ft. Leave 12 feet coiled at each replay camera. Leave 3 feet minimum coiled at each display/kiosk. Max run: 100m (328 ft); beyond requires intermediate switch.',
 NULL,ARRAY['COURT_COUNT'],NULL,false,8),

-- ============================================================
-- Phase 1: Pre-Configuration (PodPlay Office) (7 steps)
-- ============================================================
(1,'Phase 1: Pre-Configuration (PodPlay Office)',1,
 'Create iPad device group in Mosyle',
 'In Mosyle MDM → Devices → Groups → Create new group for client iPads. Name: "{{CUSTOMER_NAME}} iPads"',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,101),

(1,'Phase 1: Pre-Configuration (PodPlay Office)',2,
 'Create Apple TV device group in Mosyle',
 'In Mosyle MDM → Devices → Groups → Create new group for client Apple TVs. Name: "{{CUSTOMER_NAME}} Apple TVs"',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,102),

(1,'Phase 1: Pre-Configuration (PodPlay Office)',3,
 'Create Install App group in Mosyle with P-List',
 'In Mosyle → Profiles → Install App → Create new profile for both iPads and Apple TVs. Add P-List configuration: <dict><key>id</key><string>{{LOCATION_ID}}</string></dict>. The LOCATION_ID must be confirmed with Agustin (app readiness) before this step.',
 ARRAY['WARNING: LOCATION_ID must come from the PodPlay development team (Agustin). Confirm it is ready before configuring.'],
 ARRAY['CUSTOMER_NAME','LOCATION_ID'],NULL,false,103),

(1,'Phase 1: Pre-Configuration (PodPlay Office)',4,
 'Enable on-premises replays in admin dashboard',
 'In client''s PodPlay admin dashboard → Settings → Venues → Select location → Enable "On-premises Replays Enabled" toggle.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,104),

(1,'Phase 1: Pre-Configuration (PodPlay Office)',5,
 'Note DDNS and local replay URLs',
 'Record the two replay API URLs for later use in Phase 13 (Testing): API URL: http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000 and Local URL: http://192.168.32.100:4000. These will be entered into the admin dashboard during Testing & Verification.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,105),

(1,'Phase 1: Pre-Configuration (PodPlay Office)',6,
 'Verify hardware quantities against BOM',
 'Count all items on hand: iPads, Apple TVs, UniFi equipment (UDM, switch, PDU), Mac Mini, cameras, Flic buttons, PoE adapters, kiosk cases, HDMI cables. Verify quantities match the BOM for {{COURT_COUNT}} courts.',
 NULL,ARRAY['COURT_COUNT'],NULL,false,106),

(1,'Phase 1: Pre-Configuration (PodPlay Office)',7,
 'Confirm PodPlay app is ready for customer',
 'Ask Agustin that the PodPlay kiosk app binary is ready and available in Apple Business Manager (VPP) for this specific venue. Do not proceed with iPad setup until confirmed.',
 ARRAY['WARNING: App must be available in VPP (not App Store). Apps are white-labeled per facility.'],
 ARRAY['CUSTOMER_NAME'],NULL,false,107),

-- ============================================================
-- Phase 2: Unboxing & Labeling (7 steps)
-- ============================================================
(2,'Phase 2: Unboxing & Labeling',1,
 'Unbox UniFi network equipment',
 'Unbox UDM (gateway), switch, PDU (TrippLite RS-1215-RA), and NVR (Autonomous+ only). Keep all packaging materials intact — they are reused for shipping the completed rack to the venue.',
 NULL,NULL,NULL,false,201),

(2,'Phase 2: Unboxing & Labeling',2,
 'Label courts with Brother label machine',
 'Using the Brother label machine, create court labels: C1, C2, C3, C4... through C{{COURT_COUNT}}. These labels go on all devices associated with each court.',
 NULL,ARRAY['COURT_COUNT'],NULL,false,202),

(2,'Phase 2: Unboxing & Labeling',3,
 'Unbox and label iPads',
 'Unbox each iPad. Label the box AND the back of each iPad with its court number (C1, C2, etc.).',
 NULL,NULL,NULL,false,203),

(2,'Phase 2: Unboxing & Labeling',4,
 'Unbox and label Apple TVs',
 'Unbox each Apple TV. Label the box, the Apple TV unit itself, and the remote with the court number (C1, C2, etc.).',
 NULL,NULL,NULL,false,204),

(2,'Phase 2: Unboxing & Labeling',5,
 'Unbox and label PoE chargers',
 'Unbox each PoE adapter. Label the box and the charger with the court number (C1, C2, etc.).',
 NULL,NULL,NULL,false,205),

(2,'Phase 2: Unboxing & Labeling',6,
 'Unbox and label replay cameras',
 'Unbox each replay camera. Place label on top of the camera housing with the court number (C1, C2, etc.).',
 NULL,NULL,NULL,false,206),

(2,'Phase 2: Unboxing & Labeling',7,
 'Unbox and label Mac Mini',
 'Unbox the Mac Mini. Label with the location name: {{CUSTOMER_NAME}}.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,207),

-- ============================================================
-- Phase 3: Network Rack Assembly (6 steps)
-- ============================================================
(3,'Phase 3: Network Rack Assembly',1,
 'Install UPS at bottom of rack',
 'Place UPS at the bottom of the rack enclosure. Connect the internal UPS battery first before installing anything else. The UPS must be connected before any devices are powered.',
 ARRAY['WARNING: Connect internal UPS battery BEFORE installing any equipment above it.'],
 NULL,NULL,false,301),

(3,'Phase 3: Network Rack Assembly',2,
 'Install PDU on back of rack',
 'Mount the TrippLite RS-1215-RA 12-outlet PDU on the back of the rack to conserve front rack units.',
 NULL,NULL,NULL,false,302),

(3,'Phase 3: Network Rack Assembly',3,
 'Mount Mac Mini shelf',
 'Install a 2U rack shelf at the top position of the rack for the Mac Mini. The Mac Mini sits on this shelf and needs breathing room above — do not install anything directly above that blocks airflow.',
 ARRAY['WARNING: Mac Mini needs breathing room — overheating is a known failure mode. Do NOT install flush against other equipment.'],
 NULL,NULL,false,303),

(3,'Phase 3: Network Rack Assembly',4,
 'Install patch panel',
 'Install 24-port patch panel with inline couplers (or punch-down keystones if capable). This goes below the Mac Mini shelf.',
 NULL,NULL,NULL,false,304),

(3,'Phase 3: Network Rack Assembly',5,
 'Arrange and mount all rack components in order',
 'Mount devices top-to-bottom: (1) Mac Mini on 2U shelf at top, (2) ISP Modem if rack-mountable, (3) UDM gateway (UDM-SE / Pro / Pro-Max), (4) Patch Panel 24-port, (5) Switch (USW-Pro-24-POE or 48-POE, size varies by court count), (6) NVR (Autonomous+ only: UNVR or UNVR-Pro), (7) UPS at bottom. PDU on back.',
 NULL,NULL,NULL,false,305),

(3,'Phase 3: Network Rack Assembly',6,
 'Connect all devices to PDU → UPS → 20A circuit',
 'All rack devices plug into PDU outlets. PDU plugs into UPS. UPS plugs into a dedicated 20A circuit at the venue. Apply outlet labels on PDU to identify which device is on which outlet.',
 ARRAY['WARNING: Requires dedicated 20A circuit. Do not share with other venue loads.'],
 NULL,NULL,false,306),

-- ============================================================
-- Phase 4: Networking Setup (UniFi) (12 steps)
-- ============================================================
(4,'Phase 4: Networking Setup (UniFi)',1,
 'Power on rack devices',
 'Power on PDU. Plug in and power on: UDM, Switch, NVR (Autonomous+ only), Mac Mini.',
 NULL,NULL,NULL,false,401),

(4,'Phase 4: Networking Setup (UniFi)',2,
 'Sign into PingPodIT UniFi account',
 'Using UniFi app on phone, sign into the PingPodIT account to adopt the UDM.',
 NULL,NULL,NULL,false,402),

(4,'Phase 4: Networking Setup (UniFi)',3,
 'Configure UDM site name',
 'Set up UDM site with naming scheme: PL-{{CUSTOMER_NAME}} (e.g., PL-TELEPARK). This becomes the UniFi site name visible in the PingPodIT account.',
 NULL,ARRAY['CUSTOMER_NAME','UNIFI_SITE_NAME'],NULL,false,403),

(4,'Phase 4: Networking Setup (UniFi)',4,
 'Create local admin account on UDM',
 'On UDM: Settings → Admins → Create local admin account. Username: admin. Password: use internal credentials (stored in master accounts).',
 NULL,NULL,NULL,false,404),

(4,'Phase 4: Networking Setup (UniFi)',5,
 'Apply port labels to UDM',
 'In UniFi, apply labels to all UDM ports identifying connected devices: Mac Mini, Kisi Controller (Autonomous), Backup Internet (Autonomous 24/7), etc.',
 NULL,NULL,NULL,false,405),

(4,'Phase 4: Networking Setup (UniFi)',6,
 'Label PDU in UniFi',
 'In UniFi, label the PDU with connected device names (UDM, Switch, Mac Mini, NVR, etc.) for remote power management reference.',
 NULL,NULL,NULL,false,406),

(4,'Phase 4: Networking Setup (UniFi)',7,
 'Connect switch to UDM via SFP DAC cable',
 'Connect the USW-Pro switch to the UDM using the UACC-DAC-SFP10-0.5M SFP DAC cable. Apply labels to switch ports identifying connected devices (iPads, cameras, Apple TVs, Kisi readers, etc.).',
 NULL,NULL,NULL,false,407),

(4,'Phase 4: Networking Setup (UniFi)',8,
 'Connect Mac Mini to UDM Port 1',
 'Power on Mac Mini. Connect Mac Mini via ethernet to Port #1 on the UDM.',
 NULL,NULL,NULL,false,408),

(4,'Phase 4: Networking Setup (UniFi)',9,
 'Create REPLAY VLAN (VLAN 32)',
 'In UniFi → Settings → Networks → Create new network: Name=REPLAY, Host Address=192.168.32.254, Netmask=/24, Gateway=192.168.32.254, Broadcast=192.168.32.255, VLAN ID=32 (Manual), Allow Internet Access=Yes, mDNS=Yes (required for Apple TV discovery), DHCP Mode=DHCP Server, DHCP Range=192.168.32.1–192.168.32.254. NOTE: Do NOT change the default network yet — cameras need 192.168.1.x subnet during initial configuration (cameras default to 192.168.1.108).',
 ARRAY['WARNING: Do NOT change the default network to 192.168.30.x yet — cameras must be configured first on 192.168.1.x. Change default network only after ALL cameras are configured (Phase 6, Step 13).'],
 NULL,NULL,false,409),

(4,'Phase 4: Networking Setup (UniFi)',10,
 'Create SURVEILLANCE VLAN (VLAN 31)',
 'In UniFi → Settings → Networks → Create new network: Name=SURVEILLANCE, Subnet=192.168.31.x, VLAN ID=31. This VLAN isolates the NVR and security cameras.',
 NULL,NULL,ARRAY['autonomous_plus']::service_tier[],false,410),

(4,'Phase 4: Networking Setup (UniFi)',11,
 'Create ACCESS CONTROL VLAN (VLAN 33)',
 'In UniFi → Settings → Networks → Create new network: Name=ACCESS CONTROL, Subnet=192.168.33.x, VLAN ID=33. This VLAN isolates Kisi controllers and door readers.',
 NULL,NULL,ARRAY['autonomous','autonomous_plus']::service_tier[],false,411),

(4,'Phase 4: Networking Setup (UniFi)',12,
 'Configure port 4000 port forward on UDM',
 'In UniFi → Settings → Firewall & Security → Port Forwarding → Add rule: Name=Replay Service, Protocol=TCP/UDP, External Port=4000, Forward IP=192.168.32.100, Internal Port=4000. This forwards all replay service traffic from internet to Mac Mini.',
 ARRAY['WARNING: Port 4000 is critical — ALL replay service communication (cloud sync, instant replay, health checks) flows through it. If blocked, the entire system fails.'],
 NULL,NULL,false,412),

-- ============================================================
-- Phase 5: ISP Router Configuration (2 steps)
-- ============================================================
(5,'Phase 5: ISP Router Configuration',1,
 'Configure ISP router for external access',
 'Configure ISP router using preferred method in priority order: (1) BEST — Static IP: Order static IP from ISP ($10–20/mo). On UDM → Settings → Internet → WAN1 → Advanced → Manual → enter static IP. (2) DMZ: Put UDM WAN IP into the ISP router DMZ. (3) LAST RESORT — Port Forward: Forward port 4000 TCP/UDP to UDM WAN IP on the ISP router (ISP-dependent). Supported ISPs: US: Verizon, Optimum, Spectrum, Google Fiber. Philippines: PLDT Beyond Fiber, Globe GFiber Biz, Converge FlexiBIZ.',
 ARRAY['WARNING: Philippines venues MUST have a business plan + static IP. Residential plans use CGNAT which blocks ALL incoming connections — system will not function.',
       'WARNING: Autonomous 24/7 venues require two ISPs from different providers/backbones (e.g., PLDT + Converge or Verizon + Spectrum). Configure secondary WAN on UDM for failover.'],
 NULL,NULL,false,501),

(5,'Phase 5: ISP Router Configuration',2,
 'Verify UDM port forward is active',
 'Confirm on UDM that port 4000 TCP/UDP forwards to 192.168.32.100 (Mac Mini). This is in addition to any ISP router port forward configured in Step 1.',
 NULL,NULL,NULL,false,502),

-- ============================================================
-- Phase 6: Camera Configuration (13 steps)
-- ============================================================
(6,'Phase 6: Camera Configuration',1,
 'Plug in first camera to switch',
 'Plug ONE camera into the switch. Do NOT plug in multiple cameras at once — all cameras share the factory default IP 192.168.1.108, causing IP conflicts.',
 ARRAY['WARNING: Configure ONE camera at a time. All cameras ship with default IP 192.168.1.108. Plugging in multiple cameras simultaneously causes IP conflicts and the browser interface will be unreachable.'],
 NULL,NULL,false,601),

(6,'Phase 6: Camera Configuration',2,
 'Open camera web interface',
 'In browser, navigate to 192.168.1.108. The EmpireTech camera web interface should load.',
 NULL,NULL,NULL,false,602),

(6,'Phase 6: Camera Configuration',3,
 'Set initial region/language/video standard',
 'Set: Region=United States, Language=English, Video Standard=NTSC. (Asia deployments: verify NTSC vs PAL before changing — open question for Philippines.)',
 NULL,NULL,NULL,false,603),

(6,'Phase 6: Camera Configuration',4,
 'Set date and time',
 'Set date format=YYYY-MM-DD. Set correct time zone and local time.',
 NULL,NULL,NULL,false,604),

(6,'Phase 6: Camera Configuration',5,
 'Set camera credentials',
 'Set credentials: username=admin, password=per internal credentials, email=support@pingpod.com.',
 NULL,NULL,NULL,false,605),

(6,'Phase 6: Camera Configuration',6,
 'Set network to DHCP',
 'Settings → Network Settings → Change mode to DHCP. Camera will get a DHCP IP from the switch.',
 NULL,NULL,NULL,false,606),

(6,'Phase 6: Camera Configuration',7,
 'Assign camera to REPLAY VLAN with fixed IP',
 'In UniFi → Clients → find camera by MAC → assign to REPLAY VLAN (192.168.32.x subnet) → set fixed IP. Each camera gets a sequential fixed IP on the REPLAY VLAN.',
 NULL,NULL,NULL,false,607),

(6,'Phase 6: Camera Configuration',8,
 'Configure main stream encoding',
 'Settings → Encoding → Main Stream: Compression=H.264, Resolution=1920x1080 (1080P), Frame Rate=30 FPS, Bit Rate Type=VBR, Quality=6 (Best), Max Bit Rate=8192 Kb/s, I Frame Interval=90, SVC=1 (off), Smooth Stream=50, Watermark=Off.',
 NULL,NULL,NULL,false,608),

(6,'Phase 6: Camera Configuration',9,
 'Configure sub stream encoding',
 'Settings → Encoding → Sub Stream: Compression=H.265, Resolution=704x480 (D1), Frame Rate=30 FPS, Bit Rate Type=CBR, Bit Rate=512 Kb/s, I Frame Interval=60, Smooth Stream=50.',
 NULL,NULL,NULL,false,609),

(6,'Phase 6: Camera Configuration',10,
 'Disable overlay (channel title and time)',
 'Settings → Overlay: Turn OFF Channel Title. Turn OFF Time Title. Both must be disabled to prevent burned-in text on replay footage.',
 NULL,NULL,NULL,false,610),

(6,'Phase 6: Camera Configuration',11,
 'Configure audio',
 'Settings → Audio: Input=Microphone, Enable on main stream=Yes, Encoding=G.711Mu, Sampling Rate=8000 Hz, Noise Filter=On, Volume=50.',
 NULL,NULL,NULL,false,611),

(6,'Phase 6: Camera Configuration',12,
 'Repeat for remaining cameras',
 'Repeat steps 1–11 for each remaining camera, one at a time. Confirm each camera gets its unique fixed IP on the REPLAY VLAN before unplugging and plugging in the next.',
 NULL,ARRAY['COURT_COUNT'],NULL,false,612),

(6,'Phase 6: Camera Configuration',13,
 'Change default network to management subnet',
 'After ALL cameras are configured: in UniFi → Settings → Networks → Default network → change host address to 192.168.30.1 subnet. This is safe to do now since cameras are on REPLAY VLAN (192.168.32.x).',
 ARRAY['WARNING: Only change the default network AFTER all cameras are fully configured. Changing it earlier will break the 192.168.1.x subnet needed to access cameras at their factory default IP.'],
 NULL,NULL,false,613),

-- ============================================================
-- Phase 7: DDNS Setup (FreeDNS) (5 steps)
-- ============================================================
(7,'Phase 7: DDNS Setup (FreeDNS)',1,
 'Create FreeDNS A record',
 'Go to freedns.afraid.org → Dynamic DNS → click [add]. Create record: Type=A, Subdomain={{DDNS_SUBDOMAIN}}, Domain=podplaydns.com (private/stealth), Destination=10.10.10.10 (placeholder — will be auto-updated by cron), TTL=60 seconds, Wildcard=Unchecked.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,701),

(7,'Phase 7: DDNS Setup (FreeDNS)',2,
 'Get cron update URL',
 'On FreeDNS → Dynamic DNS → click "quick cron example" for the new record. Copy the cron line shown.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,702),

(7,'Phase 7: DDNS Setup (FreeDNS)',3,
 'Install DDNS cron on Mac Mini',
 'In the copied cron line: replace wget with curl, add quotes around the URL. Final format: 0,5,10,15,20,25,30,35,40,45,50,55 * * * * sleep 33 ; curl "https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY" >> /tmp/freedns_{{DDNS_SUBDOMAIN}}_podplaydns_com.log 2>&1 &. On Mac Mini terminal: crontab -e → press i (insert mode) → paste line → press Esc → type :wq → Enter.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,703),

(7,'Phase 7: DDNS Setup (FreeDNS)',4,
 'Verify DDNS update',
 'Wait 5 minutes. Verify the FreeDNS record updated to the venue''s real public IP (not 10.10.10.10).',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,704),

(7,'Phase 7: DDNS Setup (FreeDNS)',5,
 'Check DDNS cron log',
 'On Mac Mini, check: cat /tmp/freedns_{{DDNS_SUBDOMAIN}}_podplaydns_com.log. Should show successful update responses. If empty or errors, verify cron was saved correctly with crontab -l.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,705),

-- ============================================================
-- Phase 8: Mac Mini Setup (8 steps)
-- ============================================================
(8,'Phase 8: Mac Mini Setup',1,
 'Confirm admin dashboard access',
 'Log into client''s PodPlay admin dashboard and confirm settings access (Venues, On-premises Replays toggle).',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,801),

(8,'Phase 8: Mac Mini Setup',2,
 'Add cameras to Replay Service Configuration',
 'In the Replay Service Configuration (RSC) sheet, add all cameras with the same names as configured in the admin dashboard. Camera names must match exactly (case-sensitive) — used as folder names in the cache directory.',
 NULL,ARRAY['CUSTOMER_NAME','COURT_COUNT'],NULL,false,802),

(8,'Phase 8: Mac Mini Setup',3,
 'Record Mac Mini credentials',
 'Write down Mac Mini macOS username and password in the master accounts tab. Username: {{MAC_MINI_USERNAME}}.',
 NULL,ARRAY['MAC_MINI_USERNAME'],NULL,false,803),

(8,'Phase 8: Mac Mini Setup',4,
 'Connect and erase Samsung SSD',
 'Connect Samsung T7 SSD (1TB / 2TB / 4TB depending on court count) to Mac Mini USB-C. In Disk Utility: erase drive per the RSC sheet instructions, format as APFS or ExFAT as specified.',
 NULL,NULL,NULL,false,804),

(8,'Phase 8: Mac Mini Setup',5,
 'Create cache folder with court subfolders',
 'On Mac Mini, open home folder (Cmd+Shift+H). Create a folder named cache. Inside cache, create one subfolder per court named exactly matching each camera name from the RSC sheet. These subfolders are used for instant replay processing.',
 ARRAY['WARNING: NEVER open the cache folder in Finder once the replay service is running — Finder creates a .DS_Store file in the folder which breaks replay processing.'],
 ARRAY['COURT_COUNT'],NULL,false,805),

(8,'Phase 8: Mac Mini Setup',6,
 'Assign Mac Mini to REPLAY VLAN with fixed IP',
 'In UniFi → Clients → find Mac Mini by MAC address → assign to REPLAY VLAN (VLAN 32) → set fixed IP to exactly 192.168.32.100. This address is hardcoded in the replay service and port forward rules.',
 ARRAY['WARNING: Mac Mini MUST be assigned IP 192.168.32.100 on REPLAY VLAN 32. This is a hardcoded address used by the replay service, port forward rules, and admin dashboard.'],
 NULL,NULL,false,806),

(8,'Phase 8: Mac Mini Setup',7,
 'Create SSD symlink if needed',
 'If video clips do not automatically save to the Samsung SSD, create a symlink: ln -s /Volumes/Replays/clips /Users/{{MAC_MINI_USERNAME}}/ — this ensures the replay service writes to the SSD rather than the internal drive.',
 NULL,ARRAY['MAC_MINI_USERNAME'],NULL,false,807),

(8,'Phase 8: Mac Mini Setup',8,
 'Remove .DS_Store from cache folder',
 'In Mac Mini terminal: cd cache && rm .DS_Store. Run this after creating the cache folder to remove any .DS_Store files Finder may have created.',
 ARRAY['WARNING: NEVER open the cache folder in Finder after this point. Finder recreates .DS_Store which breaks replay processing. Always use terminal to access the cache folder.'],
 NULL,NULL,false,808),

-- ============================================================
-- Phase 9: Replay Service Deployment (V1) (10 steps)
-- NOTE: V2 (~April 2026) replaces steps 1–6 with GitHub deploy + dashboard config
-- All current steps are is_v2_only=false; add V2 steps with is_v2_only=true when V2 launches
-- ============================================================
(9,'Phase 9: Replay Service Deployment (V1)',1,
 'Connect to Jersey City Deployment Server',
 'Connect to the PodPlay deployment server in Jersey City via VPN. Credentials stored in internal credentials store.',
 NULL,NULL,NULL,false,901),

(9,'Phase 9: Replay Service Deployment (V1)',2,
 'Upload venue logo to assets folder',
 'Upload the venue/club logo image file to the assets folder in the home folder on the deployment server.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,902),

(9,'Phase 9: Replay Service Deployment (V1)',3,
 'Verify logo name matches RSC',
 'Confirm the logo filename matches exactly the name specified in the Replay Service Configuration (RSC) sheet.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,903),

(9,'Phase 9: Replay Service Deployment (V1)',4,
 'Run Upload Asset script',
 'In deployment server terminal, launch the Upload Asset script to register the logo with the replay service.',
 NULL,NULL,NULL,false,904),

(9,'Phase 9: Replay Service Deployment (V1)',5,
 'Create deployment package',
 'In deployment server terminal, run: ./deploy.py setup {{CUSTOMER_NAME}}. This generates a download URL for the configured replay service package.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,905),

(9,'Phase 9: Replay Service Deployment (V1)',6,
 'Copy generated URL',
 'Copy the generated download URL from the terminal output to a notepad. This URL is used to download the package onto the Mac Mini.',
 NULL,NULL,NULL,false,906),

(9,'Phase 9: Replay Service Deployment (V1)',7,
 'Download package on Mac Mini',
 'On Mac Mini, open browser or terminal. Download the package from the URL copied in Step 6.',
 NULL,NULL,NULL,false,907),

(9,'Phase 9: Replay Service Deployment (V1)',8,
 'Grant privacy/security permissions',
 'First open: System Settings → Privacy & Security → scroll down → Open Anyway (for the downloaded package). Add "Find" and "Node" to Full Disk Access list in System Settings → Privacy & Security → Full Disk Access.',
 NULL,NULL,NULL,false,908),

(9,'Phase 9: Replay Service Deployment (V1)',9,
 'Restart Mac Mini',
 'Restart the Mac Mini. This ensures all privacy permissions take effect and the replay service starts clean.',
 NULL,NULL,NULL,false,909),

(9,'Phase 9: Replay Service Deployment (V1)',10,
 'Verify video files writing to SSD',
 'After restart, confirm that video files are being written to the Samsung SSD by checking the /Volumes/Replays/clips directory or the symlinked clips folder.',
 NULL,NULL,NULL,false,910),

-- ============================================================
-- Phase 10: iPad Setup (11 steps)
-- ============================================================
(10,'Phase 10: iPad Setup',1,
 'Connect PoE adapters to switch',
 'Plug each PoE adapter into the switch. Connect each iPad to its corresponding PoE adapter using Lightning or USB-C cable. NOTE: UniFi detects the PoE injector, not the iPad itself. If you move a PoE injector to a different port, UniFi will show the injector on the new port.',
 NULL,NULL,NULL,false,1001),

(10,'Phase 10: iPad Setup',2,
 'Power on iPads in court-number order',
 'Power on iPads strictly in court-number order: C1 first, then C2, then C3, etc. Wait for each iPad to boot before powering on the next.',
 ARRAY['WARNING: Mosyle enrolls iPads in the order they are powered on. If powered on out of order, device-to-court mapping in Mosyle will be WRONG. Filter by enrolled date in Mosyle to verify order after enrollment.'],
 ARRAY['COURT_COUNT'],NULL,false,1002),

(10,'Phase 10: iPad Setup',3,
 'Confirm managed device screen',
 'After each iPad connects to internet (wait ~5 seconds), the screen should display "This device is managed by Pingpod Inc". If the managed screen does not appear: go back to the first setup screen and retry. If still not showing after retry: use Apple Deployment Manager to re-add the device. ~80% of devices enroll successfully on first attempt. Factory reset and retry if needed.',
 NULL,NULL,NULL,false,1003),

(10,'Phase 10: iPad Setup',4,
 'Turn off auto-lock during configuration',
 'On each iPad, go to Settings → Display & Brightness → Auto-Lock → set to Never. MDM commands cannot reach a sleeping iPad — keep displays on throughout configuration.',
 ARRAY['WARNING: MDM commands cannot be sent to sleeping iPads. Auto-lock MUST be off during all configuration steps.'],
 NULL,NULL,false,1004),

(10,'Phase 10: iPad Setup',5,
 'Assign iPads to client group in Mosyle',
 'In Mosyle, assign each newly enrolled iPad to the client''s iPad device group. Name each device: iPad {{CUSTOMER_NAME}} Court # (e.g., "iPad TELEPARK Court 1").',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,1005),

(10,'Phase 10: iPad Setup',6,
 'Create VPP app install profile in Mosyle',
 'In Mosyle → Profiles → Install App → Create new profile. Installation source: VPP (NEVER App Store — apps are custom/white-labeled per facility). Verify sufficient VPP licenses available in Apple Business Manager.',
 ARRAY['WARNING: NEVER install the PodPlay app from the App Store. Apps are white-labeled per facility and ONLY available via VPP licenses in Apple Business Manager.'],
 NULL,NULL,false,1006),

(10,'Phase 10: iPad Setup',7,
 'Add P-List config with Location ID',
 'In the Install App profile, click Add App → search for client''s PodPlay kiosk app. Add P-List configuration: <dict><key>id</key><string>{{LOCATION_ID}}</string></dict>. The LOCATION_ID routes the app to the correct backend/venue.',
 NULL,ARRAY['LOCATION_ID','CUSTOMER_NAME'],NULL,false,1007),

(10,'Phase 10: iPad Setup',8,
 'Configure app update settings',
 'Enable Auto App Install Update setting. Set auto-update behavior to "do not update automatically" to avoid disrupting play during operating hours. Updates are pushed during the 2:00–3:00 AM maintenance window.',
 NULL,NULL,NULL,false,1008),

(10,'Phase 10: iPad Setup',9,
 'Verify app shows correct venue',
 'On each iPad, confirm the PodPlay app displays the customer''s club name. If app shows wrong club or does not load: check the "Install App" group in Mosyle — P-List config must have the correct LOCATION_ID string.',
 NULL,ARRAY['CUSTOMER_NAME','LOCATION_ID'],NULL,false,1009),

(10,'Phase 10: iPad Setup',10,
 'Enable App Lock (Guided Access)',
 'In Mosyle, enable App Lock for all client iPads. This locks the device to the PodPlay app — users cannot exit to the home screen or other apps.',
 NULL,NULL,NULL,false,1010),

(10,'Phase 10: iPad Setup',11,
 'Schedule App Lock maintenance window',
 'Set App Lock schedule: OFF from 2:00 AM to 3:00 AM daily. During this window: app lock disengages, device restarts, MDM pushes pending updates. MDM commands (app updates, config pushes) are sent at ~2:30 AM. App lock re-engages at 3:00 AM. For initial setup only: keep App Lock at 24/7 until all configuration and testing is complete.',
 ARRAY['WARNING: NEVER send a Shutdown command from Mosyle — only Restart. A shutdown requires physical on-site access to power the iPad back on.'],
 NULL,NULL,false,1011),

-- ============================================================
-- Phase 11: Apple TV Setup (5 steps)
-- ============================================================
(11,'Phase 11: Apple TV Setup',1,
 'Power on Apple TVs and connect to switch',
 'Power on each Apple TV. Connect via ethernet to the switch (REPLAY VLAN port).',
 NULL,NULL,NULL,false,1101),

(11,'Phase 11: Apple TV Setup',2,
 'Connect HDMI to TV',
 'Connect Apple TV HDMI output to HDMI 1 input on the 65" display. Use Amazon Basics 3ft HDMI cable.',
 NULL,NULL,NULL,false,1102),

(11,'Phase 11: Apple TV Setup',3,
 'Confirm Remote Management screen',
 'After Location Services screen, the Apple TV should display: "Pingpod Inc will automatically configure your AppleTV". If the Remote Management screen does not appear: go all the way back to the first setup screen and retry. If the Apple TV was set up without Remote Management: use Apple Deployment Manager to re-add the device.',
 NULL,NULL,NULL,false,1103),

(11,'Phase 11: Apple TV Setup',4,
 'Assign Apple TVs to client group in Mosyle',
 'In Mosyle, assign each newly enrolled Apple TV to the client''s Apple TV device group. Name each device: AppleTV {{CUSTOMER_NAME}} Court # (e.g., "AppleTV TELEPARK Court 1").',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,1104),

(11,'Phase 11: Apple TV Setup',5,
 'Verify app shows client venue',
 'On each Apple TV, confirm the PodPlay display app shows the client''s venue/club name. If app shows wrong club: check the "Install App" group in Mosyle — P-List config must have correct LOCATION_ID.',
 NULL,ARRAY['CUSTOMER_NAME','LOCATION_ID'],NULL,false,1105),

-- ============================================================
-- Phase 12: Physical Installation (On-Site) (10 steps)
-- ============================================================
(12,'Phase 12: Physical Installation (On-Site)',1,
 'Mount replay cameras at correct height',
 'Mount EmpireTech IPC-T54IR-ZE replay cameras at specified height based on distance from baseline: 21–26 ft from baseline = 12 ft AFF. 16–20 ft (ideal) = 11 ft AFF. 12–15 ft = 10 ft AFF. 9–11 ft = 9 ft AFF. Under 9 ft = 8 ft AFF. Mount 16–20 feet behind baseline (ideal).',
 NULL,ARRAY['COURT_COUNT'],NULL,false,1201),

(12,'Phase 12: Physical Installation (On-Site)',2,
 'Leave cable slack at camera',
 'Leave 12 feet of Cat6 cable coiled at each camera location. This allows future repositioning without cable shortage.',
 NULL,NULL,NULL,false,1202),

(12,'Phase 12: Physical Installation (On-Site)',3,
 'Align opposing cameras',
 'Opposing cameras (one each end of court) must be mounted at the exact same height AFF. Misaligned cameras produce distorted replay angles.',
 NULL,NULL,NULL,false,1203),

(12,'Phase 12: Physical Installation (On-Site)',4,
 'Maintain court separation',
 'Mount each camera at least 2 feet from the adjacent court''s baseline to avoid interference with neighboring court replay footage.',
 NULL,NULL,NULL,false,1204),

(12,'Phase 12: Physical Installation (On-Site)',5,
 'Mount 65" TV display',
 'Mount 65" TV at 8 ft 9 in AFF, centered on court, aligned with net (spectator side). Use VESA 400x300 mount (included with TV order). Hide ethernet cable, outlet, and Apple TV unit behind the TV.',
 NULL,NULL,NULL,false,1205),

(12,'Phase 12: Physical Installation (On-Site)',6,
 'Mount iPad kiosk',
 'Mount iPad kiosk case at 4 ft 8 in AFF, center court. Hide PoE adapter behind wall (drywall venues) or behind TV (concrete/masonry venues). Keep the kiosk case keys — hand them to the customer at go-live.',
 NULL,NULL,NULL,false,1206),

(12,'Phase 12: Physical Installation (On-Site)',7,
 'Mount and label Flic buttons',
 'Mount 2 Flic buttons per court on fence/wall behind baseline: one left side, one right side. Label each button with court number and side using Sharpie (e.g., C1-L, C1-R). Pre-pair buttons with their corresponding iPad (same court number). Button actions: Single press=score, Double press=undo, Long press=get replay. Battery: CR2032 coin cell. Yellow blink=low battery.',
 ARRAY['WARNING: App Lock MUST be turned OFF before pairing Flic buttons. If App Lock is on during pairing, you will see ''Bluetooth Pairing Failed'' / ''Verification Failed''. Turn off App Lock for the location in Mosyle, pair all buttons, then re-enable App Lock.'],
 ARRAY['COURT_COUNT'],NULL,false,1207),

(12,'Phase 12: Physical Installation (On-Site)',8,
 'Install Kisi Controller',
 'Install Kisi Controller Pro 2 at the venue. Mount in secure location with power and ethernet access to ACCESS CONTROL VLAN (192.168.33.x).',
 NULL,NULL,ARRAY['autonomous','autonomous_plus']::service_tier[],false,1208),

(12,'Phase 12: Physical Installation (On-Site)',9,
 'Install door readers',
 'Install Kisi door readers at all access-controlled doors. Wire each reader back to the Kisi Controller.',
 NULL,NULL,ARRAY['autonomous','autonomous_plus']::service_tier[],false,1209),

(12,'Phase 12: Physical Installation (On-Site)',10,
 'Wire door locks',
 'Wire door locks: mag lock for glass doors (fail-safe — unlocks on power loss). Electric strike for panic bar doors (fail-secure — stays locked on power loss). NOTE: UniFi Door Hub output is 12V DC at up to 1A. Higher amperage locks or fire code requirements need a separate power supply.',
 NULL,NULL,ARRAY['autonomous','autonomous_plus']::service_tier[],false,1210),

-- ============================================================
-- Phase 13: Testing & Verification (8 steps)
-- ============================================================
(13,'Phase 13: Testing & Verification',1,
 'Add API URLs to admin dashboard',
 'In client''s PodPlay admin dashboard → Settings → Venues → Select location. Add both URLs: API URL=http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000, Local URL=http://192.168.32.100:4000.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,1301),

(13,'Phase 13: Testing & Verification',2,
 'Verify DDNS from external network',
 'From a phone on cellular (NOT connected to venue WiFi), verify DDNS health endpoint responds: curl http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health. Success = any JSON response (even a 404 JSON means Mac Mini is reachable). The health endpoint shows: camera status, SSD usage %, rename service status, CPU/memory. If no response: (A) Restart Mac Mini first. (B) Verify port 4000 forward on ISP router → UDM → Mac Mini IP 192.168.32.100. (C) Verify "On-premises Replay" toggle is enabled in dashboard.',
 ARRAY['WARNING: Test MUST be done from cellular/external network — not from venue WiFi. Testing from venue WiFi bypasses the ISP router and will give a false positive.'],
 ARRAY['DDNS_SUBDOMAIN'],NULL,false,1302),

(13,'Phase 13: Testing & Verification',3,
 'Test RTSP camera streams',
 'Use VLC media player to test each camera''s RTSP stream. Verify video quality matches encoding settings (1080P, 30fps).',
 NULL,ARRAY['COURT_COUNT'],NULL,false,1303),

(13,'Phase 13: Testing & Verification',4,
 'Create test reservation',
 'In PodPlay admin dashboard, create an operations reservation (free, for testing) on a court.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,1304),

(13,'Phase 13: Testing & Verification',5,
 'Add free replay credits',
 'On the ops person''s user profile in the admin dashboard, add free replay credits to avoid being charged during testing.',
 NULL,NULL,NULL,false,1305),

(13,'Phase 13: Testing & Verification',6,
 'Test instant replay end-to-end',
 'On an iPad, initiate a replay request. Verify: (A) Replay processing appears on Mac Mini. (B) Instant replay video appears on the Apple TV in the same court. If replay doesn''t work: restart Mac Mini → test replay stream directly: http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/instant-replay/COURTNAME.',
 NULL,ARRAY['DDNS_SUBDOMAIN','COURT_COUNT'],NULL,false,1306),

(13,'Phase 13: Testing & Verification',7,
 'Test Flic button actions',
 'With App Lock OFF, test each Flic button: Single press → score increments on iPad. Double press → score decrements. Long press → replay initiated. On iPad, open configuration menu (long-press logo in corner) → verify left and right buttons appear in button assignment section → press each button → indicator turns green. If button event shows but scoring doesn''t update: restart iPad to re-sync Firebase connection.',
 ARRAY['WARNING: App Lock must be OFF during button testing.'],
 ARRAY['COURT_COUNT'],NULL,false,1307),

(13,'Phase 13: Testing & Verification',8,
 'Re-enable App Lock',
 'After all testing is complete, re-enable App Lock for all iPads in Mosyle. Confirm 2:00–3:00 AM maintenance window is configured.',
 NULL,NULL,NULL,false,1308),

-- ============================================================
-- Phase 14: Health Monitoring Setup (3 steps)
-- ============================================================
(14,'Phase 14: Health Monitoring Setup',1,
 'Set up Google Cloud uptime check',
 'In Google Cloud Platform (can use own GCP account): Monitoring → Uptime Checks → Create check. Target URL: http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health. Frequency: every 5 minutes.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,1401),

(14,'Phase 14: Health Monitoring Setup',2,
 'Configure health check alerts',
 'Set up GCP alerting policy: Alert if health check fails for 2 consecutive checks. Checks monitored: SSD storage < 80%, memory/swap normal, CPU load normal, rename service running, network link status up.',
 NULL,ARRAY['DDNS_SUBDOMAIN'],NULL,false,1402),

(14,'Phase 14: Health Monitoring Setup',3,
 'Route alerts to Slack',
 'Configure GCP alert notifications to send to Slack channel (or configurable webhook destination). Reference: Nico monitors ~70 live locations with this same setup.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,1403),

-- ============================================================
-- Phase 15: Packaging & Shipping (6 steps)
-- ============================================================
(15,'Phase 15: Packaging & Shipping',1,
 'Print Bill of Materials',
 'Print the final BOM from the ops system for {{CUSTOMER_NAME}} ({{COURT_COUNT}} courts).',
 NULL,ARRAY['CUSTOMER_NAME','COURT_COUNT'],NULL,false,1501),

(15,'Phase 15: Packaging & Shipping',2,
 'Count all items against BOM',
 'Physically count all items in the shipping box against the printed BOM. If any mismatch: contact Stan or Chad before sealing.',
 ARRAY['WARNING: Item count must match BOM exactly before sealing. Contact Stan or Chad immediately if any discrepancy.'],
 NULL,NULL,false,1502),

(15,'Phase 15: Packaging & Shipping',3,
 'Place BOM inside box',
 'Print a second copy of the BOM. Place it inside the shipping box so the venue can verify receipt.',
 NULL,NULL,NULL,false,1503),

(15,'Phase 15: Packaging & Shipping',4,
 'Seal and tape box',
 'Securely tape box closed. Use excess tape — box will be shipped via freight or parcel carrier.',
 NULL,NULL,NULL,false,1504),

(15,'Phase 15: Packaging & Shipping',5,
 'Weigh package',
 'Weigh the sealed package using the office scale. Record weight for shipping label.',
 NULL,NULL,NULL,false,1505),

(15,'Phase 15: Packaging & Shipping',6,
 'Print and apply shipping label',
 'Print shipping label with venue address. Apply to outside of box. Retain tracking number in project record.',
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,1506);
```

---

## Section 2: Hardware Catalog

Table: `hardware_catalog`

All hardware items PodPlay orders, ships, or drop-ships. 47 items across 8 categories.

**Unit cost notes**: Costs derived from 2026 market pricing (XLSX not available). Costs marked
`NULL` in schema are unknown without XLSX; concrete estimates provided here for BOM cost analysis.
The `ship-seed-data` aspect should reconcile against XLSX once available.

**Drop-shipped items** (TV, TV mount, rack enclosure, UPS): shipped directly to venue by vendor,
not staged at PodPlay NJ lab. Still tracked in BOM for cost analysis.

```sql
INSERT INTO hardware_catalog (sku, name, model, vendor, unit_cost, category, notes, is_active)
VALUES

  -- =========================================================================
  -- NETWORK RACK
  -- =========================================================================
  ('NET-UDM-SE',
   'UniFi UDM-SE Gateway',
   'UDM-SE',
   'UniFi',
   379.00,
   'network_rack',
   'Firewall/gateway with built-in PoE switch. Default for most venues. Built-in PoE eliminates need for separate injector on UDM ports.',
   true),

  ('NET-UDM-PRO',
   'UniFi UDM-Pro Gateway',
   'UDM-Pro',
   'UniFi',
   379.00,
   'network_rack',
   'Firewall/gateway, no built-in PoE. Alternative to UDM-SE for venues where PoE on gateway ports is not needed.',
   true),

  ('NET-UDM-PRO-MAX',
   'UniFi UDM-Pro-Max Gateway',
   'UDM-Pro-Max',
   'UniFi',
   599.00,
   'network_rack',
   'High-performance gateway with 2.5G ports. For large venues (12+ courts) with high throughput needs.',
   true),

  ('NET-USW-PRO-24-POE',
   'UniFi USW-Pro-24-POE Switch',
   'USW-Pro-24-POE',
   'UniFi',
   249.00,
   'network_rack',
   '24-port PoE+ switch. Default for venues up to 8 courts (24 ports accommodate 3 drops/court + uplink + Mac Mini + spares). SFP+ uplink to UDM.',
   true),

  ('NET-USW-24-POE',
   'UniFi USW-24-POE Switch',
   'USW-24-POE',
   'UniFi',
   189.00,
   'network_rack',
   '24-port PoE switch, lower power budget than Pro-24-POE. Alternative for cost-sensitive smaller venues.',
   true),

  ('NET-USW-PRO-48-POE',
   'UniFi USW-Pro-48-POE Switch',
   'USW-Pro-48-POE',
   'UniFi',
   519.00,
   'network_rack',
   '48-port PoE+ switch. For venues 9+ courts where 24-port is insufficient. Large clubs may require two switches.',
   true),

  ('NET-SFP-DAC',
   'UniFi SFP+ DAC Cable 0.5m',
   'UACC-DAC-SFP10-0.5M',
   'UniFi',
   12.00,
   'network_rack',
   'SFP+ Direct Attach Copper cable. Connects UDM ↔ switch (and switch ↔ NVR on Autonomous+). 0.5m length fits within rack.',
   true),

  ('NET-PATCH-1FT',
   'Monoprice Cat6 1ft Patch Cable',
   NULL,
   'Amazon',
   3.00,
   'network_rack',
   'Short patch cable for switch port-to-patch-panel connections within rack. Ordered in bulk; 3 per court for display/kiosk/camera drops.',
   true),

  ('NET-PATCH-3FT',
   'Monoprice Cat6 3ft Patch Cable',
   NULL,
   'Amazon',
   5.00,
   'network_rack',
   'Standard patch cable for UDM, Mac Mini, and inter-rack connections. ~6 per venue for rack equipment.',
   true),

  ('NET-PATCH-10FT',
   'Monoprice Cat6 10ft Patch Cable',
   NULL,
   'Amazon',
   8.00,
   'network_rack',
   'Longer patch cable for Kisi Controller connection (ACCESS CONTROL VLAN port on switch to Kisi Controller). Autonomous/Autonomous+ only.',
   true),

  ('NET-PDU',
   'TrippLite 12-Outlet Rack PDU',
   'RS-1215-RA',
   'Ingram',
   45.00,
   'network_rack',
   '12-outlet 1U rack PDU. Mounts on back of rack to conserve front rack units. All rack devices → PDU → UPS → dedicated 20A circuit.',
   true),

  ('NET-PATCH-PANEL-24',
   'iwillink 24-Port Patch Panel with Couplers',
   NULL,
   'Amazon',
   30.00,
   'network_rack',
   '24-port patch panel with pre-installed inline coupler keystones. Default for field terminations. Punch-down keystones preferred if capable.',
   true),

  -- =========================================================================
  -- INFRASTRUCTURE
  -- =========================================================================
  ('INFRA-UPS',
   'APC 1500VA Rack-Mount UPS',
   'SMT1500RM2U',
   'Various',
   250.00,
   'infrastructure',
   '2U rack-mount UPS. Always at bottom of rack. Connect internal UPS battery BEFORE installing any equipment above. Drop-shipped to venue.',
   true),

  ('INFRA-RACK',
   '12U Network Rack Enclosure',
   NULL,
   'Various',
   180.00,
   'infrastructure',
   'Open or closed rack enclosure, 7–12U depending on court count and tier. Drop-shipped to venue. Exact model selected by ops based on venue IT room.',
   true),

  ('INFRA-RACK-SHELF',
   'Pyle 19-Inch 1U Vented Rack Shelf',
   NULL,
   'Amazon',
   20.00,
   'infrastructure',
   '1U vented rack shelf for Mac Mini at top of rack. Provides 2U space with breathing room above. Mac Mini overheating is a known failure mode.',
   true),

  -- =========================================================================
  -- REPLAY SYSTEM
  -- =========================================================================
  ('REPLAY-MACMINI',
   'Mac Mini 16GB 256GB',
   NULL,
   'Apple Business',
   700.00,
   'replay_system',
   'Replay server. Mac Mini (M4 or current chip at time of order). Assigned fixed IP 192.168.32.100 on REPLAY VLAN 32. Labeled with venue name.',
   true),

  ('REPLAY-SSD-1TB',
   'Samsung T7 1TB External SSD',
   'MU-PC1T0T',
   'Amazon',
   90.00,
   'replay_system',
   'External SSD for replay video storage. Use for venues with 1–4 courts. Connected to Mac Mini via USB-C.',
   true),

  ('REPLAY-SSD-2TB',
   'Samsung T7 2TB External SSD',
   'MU-PC2T0T',
   'Amazon',
   160.00,
   'replay_system',
   'External SSD for replay video storage. Use for venues with 5–8 courts. Connected to Mac Mini via USB-C.',
   true),

  ('REPLAY-SSD-4TB',
   'Samsung T7 4TB External SSD',
   'MU-PC4T0T',
   'Amazon',
   310.00,
   'replay_system',
   'External SSD for replay video storage. Use for venues with 9+ courts. Connected to Mac Mini via USB-C.',
   true),

  ('REPLAY-CAMERA-WHITE',
   'EmpireTech Replay Camera White',
   'IPC-T54IR-ZE',
   'EmpireTech',
   120.00,
   'replay_system',
   '4MP varifocal turret IP camera (Dahua OEM). White housing for light-colored courts. Default for pickleball clubs. 1 per court, mounted behind baseline.',
   true),

  ('REPLAY-CAMERA-BLACK',
   'EmpireTech Replay Camera Black',
   'IPC-T54IR-ZE',
   'EmpireTech',
   120.00,
   'replay_system',
   '4MP varifocal turret IP camera (Dahua OEM). Black housing for darker court environments. Alternative to white; same model, different color.',
   true),

  ('REPLAY-CAMERA-JB-WHITE',
   'EmpireTech Replay Camera Junction Box White',
   'PFA130-E',
   'EmpireTech',
   15.00,
   'replay_system',
   'Junction box for EmpireTech IPC-T54IR-ZE replay camera. White. Use when mounting on column, ceiling, or pole (provides 3/4" threaded conduit opening).',
   true),

  ('REPLAY-CAMERA-JB-BLACK',
   'EmpireTech Replay Camera Junction Box Black',
   'PFA130-E',
   'EmpireTech',
   15.00,
   'replay_system',
   'Junction box for EmpireTech IPC-T54IR-ZE replay camera. Black. For darker environments. Same specs as white junction box.',
   true),

  ('REPLAY-FLIC',
   'Flic Button',
   NULL,
   'Flic',
   35.00,
   'replay_system',
   'Bluetooth scoring and replay button. 2 per court (left + right baseline positions). Mounted on acrylic sign on fence/wall. Battery: CR2032 coin cell. Single press=score, double=undo, long=replay.',
   true),

  ('REPLAY-SIGN',
   'Aluminum Printed Sign 6x8',
   NULL,
   'Fast Signs',
   25.00,
   'replay_system',
   'Printed 6"×8" aluminum sign for Flic button mounting. 1 per court. Affixed to fence/wall behind baseline. Labeled "Court X Left/Right".',
   true),

  ('REPLAY-HW-KIT',
   'Sign Mounting Hardware Kit',
   NULL,
   'RC Fasteners',
   15.00,
   'replay_system',
   'Bolts, nuts, screws, and zip ties for aluminum sign and junction box mounting. 1 kit per venue covers all courts.',
   true),

  -- =========================================================================
  -- DISPLAYS
  -- =========================================================================
  ('DISPLAY-TV-65',
   '65" TV Display',
   NULL,
   'Various',
   500.00,
   'displays',
   '65" LED/QLED TV for court display. VESA 400×300 compatible. Drop-shipped to venue. Mounted at 8''9" AFF, center court, net-side. HDMI 1 used for Apple TV.',
   true),

  ('DISPLAY-TV-MOUNT',
   'VESA 400x300 TV Tilt Wall Mount',
   NULL,
   'Various',
   30.00,
   'displays',
   'VESA 400×300 tilt wall mount for 65" TV. Included with TV order; drop-shipped. Surface options: drywall (lag/toggle bolts), concrete (Tapcon), column (Unistrut), ceiling (beam clamps).',
   true),

  ('DISPLAY-APPLETV',
   'Apple TV 4K with Ethernet',
   NULL,
   'Apple Business',
   130.00,
   'displays',
   'Apple TV 4K with built-in Ethernet port. Enrolled in Mosyle MDM under client Apple TV group. Connects to TV HDMI 1 via 3ft HDMI cable.',
   true),

  ('DISPLAY-HDMI-3FT',
   'Amazon Basics 3ft HDMI Cable',
   NULL,
   'Amazon',
   7.00,
   'displays',
   '3ft HDMI cable connecting Apple TV output to TV HDMI 1 port. 1 per court.',
   true),

  ('DISPLAY-ATV-MOUNT',
   'HIDEit Apple TV Wall Mount',
   NULL,
   'HIDEit',
   25.00,
   'displays',
   'Wall/column mount for Apple TV. Mount behind TV on wall. NOT on column with double-sided adhesive — heat from TV causes adhesive failure and Apple TV falls.',
   true),

  ('DISPLAY-IPAD',
   'iPad 64GB WiFi+Cellular',
   NULL,
   'Apple Business',
   600.00,
   'displays',
   'iPad kiosk. 10th gen (A2696) or current model at time of order. Enrolled in Mosyle MDM. PoE-powered. App Lock enabled. Powered on in strict court-number order for correct MDM enrollment.',
   true),

  ('DISPLAY-IPAD-POE',
   'iPad PoE Adapter',
   NULL,
   'PoE Texas',
   40.00,
   'displays',
   'PoE-to-USB-C adapter powering iPad from Cat6 drop. Ethernet in, USB-C out to iPad. Hidden behind drywall wall or behind TV for concrete/masonry venues.',
   true),

  ('DISPLAY-IPAD-CASE',
   'iPad Kiosk Case with Lock',
   NULL,
   'CTA Digital',
   80.00,
   'displays',
   'Lockable kiosk enclosure for iPad. Mounted at 4''8" AFF, center court. Mounting surface options: fence (VESA bracket), drywall, concrete, column, floor kiosk. Hand keys to customer at go-live.',
   true),

  -- =========================================================================
  -- ACCESS CONTROL (Autonomous and Autonomous+ tiers only)
  -- =========================================================================
  ('AC-KISI-CONTROLLER',
   'Kisi Controller Pro 2',
   'Controller Pro 2',
   'Kisi',
   299.00,
   'access_control',
   '1 per venue. Manages all Kisi door readers at the venue. Mounted in secure location with power and Ethernet to ACCESS CONTROL VLAN (192.168.33.x).',
   true),

  ('AC-KISI-READER',
   'Kisi Reader Pro 2',
   'Reader Pro 2',
   'Kisi',
   179.00,
   'access_control',
   '1 per access-controlled door. Connects back to Kisi Controller. Door lock types: mag lock for glass doors (fail-safe), electric strike for panic bar doors (fail-secure).',
   true),

  -- =========================================================================
  -- SURVEILLANCE (Autonomous and Autonomous+ tiers)
  -- =========================================================================
  ('SURV-UNVR',
   'UniFi UNVR 4-Bay NVR',
   'UNVR',
   'UniFi',
   279.00,
   'surveillance',
   '4-bay NVR for local surveillance recording. Default for Autonomous+. Rack-mounted below switch. Connects to UDM via SFP DAC cable. Supports up to 4 WD Purple 8TB drives.',
   true),

  ('SURV-UNVR-PRO',
   'UniFi UNVR-Pro 7-Bay NVR',
   'UNVR-Pro',
   'UniFi',
   499.00,
   'surveillance',
   '7-bay NVR for larger surveillance deployments. Use instead of UNVR when venue has 5+ security cameras. Supports up to 7 WD Purple 8TB drives.',
   true),

  ('SURV-HDD',
   'WD Purple 8TB Surveillance Hard Drive',
   'WD8PURZ',
   'Amazon',
   140.00,
   'surveillance',
   'Surveillance-grade HDD rated for 24/7 operation. 4 drives fill UNVR (4-bay); 7 drives fill UNVR-Pro (7-bay). Pre-installed in NVR before shipping.',
   true),

  ('SURV-CAMERA-WHITE',
   'UniFi G5 Turret Ultra Security Camera White',
   'UVC-G5-Turret-Ultra',
   'UniFi',
   109.00,
   'surveillance',
   'UniFi G5 Turret Ultra 4K security camera. White housing. Default for pickleball clubs. PoE-powered. Connects to SURVEILLANCE VLAN (VLAN 31) on Autonomous+.',
   true),

  ('SURV-CAMERA-BLACK',
   'UniFi G5 Turret Ultra Security Camera Black',
   'UVC-G5-Turret-Ultra',
   'UniFi',
   109.00,
   'surveillance',
   'UniFi G5 Turret Ultra 4K security camera. Black housing. For PingPod venues with dark court environments. Same model as white variant.',
   true),

  ('SURV-CAMERA-JB-WHITE',
   'UniFi Security Camera Junction Box White',
   'UACC-Camera-CJB-White',
   'UniFi',
   12.00,
   'surveillance',
   'White junction box for UniFi G5 security cameras. For pickleball club deployments. 1 per camera.',
   true),

  ('SURV-CAMERA-JB-BLACK',
   'UniFi Security Camera Junction Box Black',
   'UACC-Camera-CJB-Black',
   'UniFi',
   12.00,
   'surveillance',
   'Black junction box for UniFi G5 security cameras. For PingPod deployments. 1 per camera.',
   true),

  -- =========================================================================
  -- FRONT DESK (conditional: projects.has_front_desk = true)
  -- =========================================================================
  ('FD-CC-TERMINAL',
   'BBPOS WisePOS E Credit Card Terminal',
   'WisePOS E',
   'Stripe',
   249.00,
   'front_desk',
   'Stripe-integrated credit card terminal. Admin PIN: 07139. Ordered separately via CC Form workflow (not standard BOM). 1 per venue when has_front_desk = true.',
   true),

  ('FD-QR-SCANNER',
   '2D QR Code Barcode Scanner',
   NULL,
   'Amazon',
   40.00,
   'front_desk',
   'USB QR code scanner for member check-in at front desk. 1 per venue when has_front_desk = true.',
   true),

  ('FD-WEBCAM',
   'Anker PowerConf C200 2K Webcam',
   'C200',
   'Amazon',
   46.00,
   'front_desk',
   '2K USB webcam for front desk check-in photo capture. 1 per venue when has_front_desk = true.',
   true),

  -- =========================================================================
  -- PINGPOD SPECIFIC (conditional: projects.has_pingpod_wifi = true)
  -- =========================================================================
  ('PP-WIFI-AP',
   'UniFi U6-Plus WiFi Access Point',
   'U6-Plus',
   'UniFi',
   99.00,
   'pingpod_specific',
   'WiFi AP for PingPod venues requiring wireless connectivity. Not used for standard pickleball clubs. 1 per venue when has_pingpod_wifi = true.',
   true);
```

### Hardware Catalog Statistics

| Category | Item Count | Notes |
|----------|-----------|-------|
| network_rack | 12 | UDM variants + switch variants + cables + PDU + patch panel |
| infrastructure | 3 | UPS, rack enclosure, rack shelf (all drop-shipped or variable) |
| replay_system | 11 | Mac Mini, SSD variants, cameras, junction boxes, Flic, signs, hardware kit |
| displays | 8 | TV, mount, Apple TV, HDMI, ATV mount, iPad, PoE adapter, kiosk case |
| access_control | 2 | Kisi controller + reader |
| surveillance | 7 | UNVR, UNVR-Pro, HDD, G5 cameras (white + black), junction boxes |
| front_desk | 3 | CC terminal, QR scanner, webcam |
| pingpod_specific | 1 | WiFi AP |
| **TOTAL** | **47** | |

### Alternative Items (not in default BOM templates, operator selects if needed)

| SKU | When to Use |
|-----|-------------|
| NET-UDM-PRO | Venues needing non-PoE gateway (unusual) |
| NET-UDM-PRO-MAX | Large venues 12+ courts with high throughput |
| NET-USW-24-POE | Cost-sensitive small venues as alternative to Pro-24-POE |
| NET-USW-PRO-48-POE | Venues 9+ courts where 24-port insufficient |
| REPLAY-SSD-2TB | Manually override for 5–8 court venues |
| REPLAY-SSD-4TB | Manually override for 9+ court venues |
| REPLAY-CAMERA-BLACK | When venue prefers black hardware |
| REPLAY-CAMERA-JB-BLACK | When using black cameras |
| SURV-UNVR-PRO | Override when venue has 5+ security cameras |
| SURV-CAMERA-BLACK | PingPod venues |
| SURV-CAMERA-JB-BLACK | PingPod venues |

---

## Section 6: BOM Templates

Table: `bom_templates`

One row per (tier, hardware_catalog_id) pair. Each row specifies how many of that item
appear in a BOM generated for that tier. The final quantity formula (computed client-side):

```
qty = qty_per_venue
    + (qty_per_court × project.court_count)
    + (qty_per_door × project.door_count)
    + (qty_per_camera × project.security_camera_count)
```

**Template coverage**: 4 tiers (pro, autonomous, autonomous_plus, pbk).
- `pro`: Core replay + display system only
- `autonomous`: Pro + Kisi access control + G5 security cameras (no NVR)
- `autonomous_plus`: Autonomous + NVR + hard drives
- `pbk`: Identical hardware to Pro; custom pricing handled in settings (pbk_venue_fee, pbk_court_fee)

**Conditional items NOT in templates** (added programmatically at BOM generation):
- Front desk items (FD-*): added when `project.has_front_desk = true`; always qty 1/venue
- PingPod WiFi (PP-WIFI-AP): added when `project.has_pingpod_wifi = true`; always qty 1/venue
- These require a separate BOM generation code path since bom_templates only supports tier-based filtering

```sql
-- =============================================================================
-- PRO TIER BOM TEMPLATE
-- =============================================================================
-- Scope: Display + kiosk + replay camera per court + network rack
-- Per-court drops: 3 Cat6 (display, kiosk, camera) + 1 outlet
-- =============================================================================

INSERT INTO bom_templates (tier, hardware_catalog_id, qty_per_venue, qty_per_court, qty_per_door, qty_per_camera, sort_order)

-- Network Rack
SELECT 'pro', id, 1, 0, 0, 0, 100 FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 110 FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
-- NOTE: Default 24-port switch. Operator must manually swap to NET-USW-PRO-48-POE
-- for venues with 9+ courts (24 ports fills at: 3 drops/court × 8 courts = 24 ports).
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 120 FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 130 FROM hardware_catalog WHERE sku = 'NET-PDU'
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 140 FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
UNION ALL
SELECT 'pro', id, 0, 3, 0, 0, 150 FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
-- 3 short patch cables per court: one for display drop, one for kiosk drop, one for camera drop
-- at the switch side of the patch panel
UNION ALL
SELECT 'pro', id, 6, 0, 0, 0, 160 FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'
-- 6 per venue: Mac Mini × 1, UDM WAN × 1, UDM LAN × 1, Mac Mini USB adapter × 1, spare × 2

-- Infrastructure
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 200 FROM hardware_catalog WHERE sku = 'INFRA-UPS'
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 210 FROM hardware_catalog WHERE sku = 'INFRA-RACK'
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 220 FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'

-- Replay System
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 300 FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 310 FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
-- NOTE: Default 1TB SSD. Operator must manually swap:
--   → REPLAY-SSD-2TB for 5–8 court venues
--   → REPLAY-SSD-4TB for 9+ court venues
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 320 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
-- 1 replay camera per court. Operator swaps to REPLAY-CAMERA-BLACK for dark environments.
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 330 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
-- 1 junction box per camera (for column/ceiling/pole mounts). Matches camera color.
UNION ALL
SELECT 'pro', id, 0, 2, 0, 0, 340 FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
-- 2 Flic buttons per court (left baseline + right baseline)
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 350 FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
-- 1 aluminum sign per court for Flic button mounting
UNION ALL
SELECT 'pro', id, 1, 0, 0, 0, 360 FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'
-- 1 hardware kit per venue for all sign and junction box mounting

-- Displays
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 400 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 410 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 420 FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 430 FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 440 FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 450 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 460 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
UNION ALL
SELECT 'pro', id, 0, 1, 0, 0, 470 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE';


-- =============================================================================
-- AUTONOMOUS TIER BOM TEMPLATE
-- =============================================================================
-- Scope: Pro + Kisi access control (per door) + UniFi G5 security cameras (per camera, no NVR)
-- Security cameras connect to the existing switch on SURVEILLANCE VLAN (VLAN 31).
-- No local video recording in Autonomous tier — cameras are cloud-managed via UniFi.
-- =============================================================================

INSERT INTO bom_templates (tier, hardware_catalog_id, qty_per_venue, qty_per_court, qty_per_door, qty_per_camera, sort_order)

-- Network Rack (identical to Pro)
SELECT 'autonomous', id, 1, 0, 0, 0, 100 FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 110 FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 120 FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 130 FROM hardware_catalog WHERE sku = 'NET-PDU'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 140 FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
UNION ALL
SELECT 'autonomous', id, 0, 3, 0, 0, 150 FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
UNION ALL
SELECT 'autonomous', id, 6, 0, 0, 0, 160 FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'
UNION ALL
SELECT 'autonomous', id, 2, 0, 0, 0, 165 FROM hardware_catalog WHERE sku = 'NET-PATCH-10FT'
-- 2 × 10ft patch cables for Kisi Controller connection (ACCESS CONTROL VLAN port → Kisi)

-- Infrastructure (identical to Pro)
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 200 FROM hardware_catalog WHERE sku = 'INFRA-UPS'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 210 FROM hardware_catalog WHERE sku = 'INFRA-RACK'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 220 FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'

-- Replay System (identical to Pro)
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 300 FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 310 FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 320 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 330 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
UNION ALL
SELECT 'autonomous', id, 0, 2, 0, 0, 340 FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 350 FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 360 FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'

-- Displays (identical to Pro)
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 400 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 410 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 420 FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 430 FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 440 FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 450 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 460 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
UNION ALL
SELECT 'autonomous', id, 0, 1, 0, 0, 470 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE'

-- Access Control (Autonomous addition)
UNION ALL
SELECT 'autonomous', id, 1, 0, 0, 0, 500 FROM hardware_catalog WHERE sku = 'AC-KISI-CONTROLLER'
-- 1 Kisi Controller Pro 2 per venue (manages all door readers)
UNION ALL
SELECT 'autonomous', id, 0, 0, 1, 0, 510 FROM hardware_catalog WHERE sku = 'AC-KISI-READER'
-- 1 Kisi Reader Pro 2 per access-controlled door

-- Surveillance (Autonomous addition — cameras without NVR)
UNION ALL
SELECT 'autonomous', id, 0, 0, 0, 1, 600 FROM hardware_catalog WHERE sku = 'SURV-CAMERA-WHITE'
-- 1 UniFi G5 Turret Ultra per security camera. Connects to switch on SURVEILLANCE VLAN.
UNION ALL
SELECT 'autonomous', id, 0, 0, 0, 1, 610 FROM hardware_catalog WHERE sku = 'SURV-CAMERA-JB-WHITE';
-- 1 junction box per security camera


-- =============================================================================
-- AUTONOMOUS+ TIER BOM TEMPLATE
-- =============================================================================
-- Scope: Autonomous + NVR (UNVR) + WD Purple 8TB hard drives for local recording
-- NVR connects to switch via SFP DAC cable on SURVEILLANCE VLAN (VLAN 31).
-- =============================================================================

INSERT INTO bom_templates (tier, hardware_catalog_id, qty_per_venue, qty_per_court, qty_per_door, qty_per_camera, sort_order)

-- Network Rack (identical to Autonomous — note extra SFP DAC for NVR link added below)
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 100 FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 110 FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
UNION ALL
SELECT 'autonomous_plus', id, 2, 0, 0, 0, 120 FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
-- 2 SFP DAC cables for Autonomous+: (1) UDM ↔ switch, (2) switch ↔ UNVR
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 130 FROM hardware_catalog WHERE sku = 'NET-PDU'
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 140 FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
UNION ALL
SELECT 'autonomous_plus', id, 0, 3, 0, 0, 150 FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
UNION ALL
SELECT 'autonomous_plus', id, 6, 0, 0, 0, 160 FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'
UNION ALL
SELECT 'autonomous_plus', id, 2, 0, 0, 0, 165 FROM hardware_catalog WHERE sku = 'NET-PATCH-10FT'

-- Infrastructure (identical to Autonomous)
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 200 FROM hardware_catalog WHERE sku = 'INFRA-UPS'
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 210 FROM hardware_catalog WHERE sku = 'INFRA-RACK'
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 220 FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'

-- Replay System (identical to Autonomous)
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 300 FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 310 FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 320 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 330 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
UNION ALL
SELECT 'autonomous_plus', id, 0, 2, 0, 0, 340 FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 350 FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 360 FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'

-- Displays (identical to Autonomous)
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 400 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 410 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 420 FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 430 FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 440 FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 450 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 460 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
UNION ALL
SELECT 'autonomous_plus', id, 0, 1, 0, 0, 470 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE'

-- Access Control (identical to Autonomous)
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 500 FROM hardware_catalog WHERE sku = 'AC-KISI-CONTROLLER'
UNION ALL
SELECT 'autonomous_plus', id, 0, 0, 1, 0, 510 FROM hardware_catalog WHERE sku = 'AC-KISI-READER'

-- Surveillance (Autonomous+ additions: G5 cameras + NVR + drives)
UNION ALL
SELECT 'autonomous_plus', id, 0, 0, 0, 1, 600 FROM hardware_catalog WHERE sku = 'SURV-CAMERA-WHITE'
UNION ALL
SELECT 'autonomous_plus', id, 0, 0, 0, 1, 610 FROM hardware_catalog WHERE sku = 'SURV-CAMERA-JB-WHITE'
UNION ALL
SELECT 'autonomous_plus', id, 1, 0, 0, 0, 620 FROM hardware_catalog WHERE sku = 'SURV-UNVR'
-- Default: UNVR (4-bay). Operator swaps to SURV-UNVR-PRO for 5+ security cameras.
UNION ALL
SELECT 'autonomous_plus', id, 4, 0, 0, 0, 630 FROM hardware_catalog WHERE sku = 'SURV-HDD';
-- 4 WD Purple 8TB drives fills all bays of UNVR (4-bay).
-- Operator changes to 7 when using SURV-UNVR-PRO (7-bay).


-- =============================================================================
-- PBK TIER BOM TEMPLATE (Pickleball Kingdom)
-- =============================================================================
-- Scope: Identical hardware to Pro tier. Custom pricing handled via settings
-- (pbk_venue_fee, pbk_court_fee). No structural hardware differences from Pro.
-- =============================================================================

INSERT INTO bom_templates (tier, hardware_catalog_id, qty_per_venue, qty_per_court, qty_per_door, qty_per_camera, sort_order)

-- Network Rack (identical to Pro)
SELECT 'pbk', id, 1, 0, 0, 0, 100 FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 110 FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 120 FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 130 FROM hardware_catalog WHERE sku = 'NET-PDU'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 140 FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
UNION ALL
SELECT 'pbk', id, 0, 3, 0, 0, 150 FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
UNION ALL
SELECT 'pbk', id, 6, 0, 0, 0, 160 FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'

-- Infrastructure (identical to Pro)
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 200 FROM hardware_catalog WHERE sku = 'INFRA-UPS'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 210 FROM hardware_catalog WHERE sku = 'INFRA-RACK'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 220 FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'

-- Replay System (identical to Pro)
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 300 FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 310 FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 320 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 330 FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
UNION ALL
SELECT 'pbk', id, 0, 2, 0, 0, 340 FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 350 FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
UNION ALL
SELECT 'pbk', id, 1, 0, 0, 0, 360 FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'

-- Displays (identical to Pro)
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 400 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 410 FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 420 FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 430 FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 440 FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 450 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 460 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
UNION ALL
SELECT 'pbk', id, 0, 1, 0, 0, 470 FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE';
```

### BOM Template Statistics

| Tier | Total Line Items | Per-Venue Items | Per-Court Items | Per-Door Items | Per-Camera Items |
|------|-----------------|----------------|----------------|---------------|-----------------|
| pro | 24 | 14 | 10 (some qty > 1) | 0 | 0 |
| autonomous | 27 | 17 | 10 (some qty > 1) | 1 | 2 |
| autonomous_plus | 29 | 19 | 10 (some qty > 1) | 1 | 2 |
| pbk | 24 | 14 | 10 (some qty > 1) | 0 | 0 |

### Example BOM Generation — 4-Court Pro Venue

| Item | qty_per_venue | qty_per_court × 4 | Final Qty | Unit Cost | Total Cost |
|------|-------------|-------------------|-----------|-----------|------------|
| NET-UDM-SE | 1 | 0 | 1 | $379 | $379 |
| NET-USW-PRO-24-POE | 1 | 0 | 1 | $249 | $249 |
| NET-SFP-DAC | 1 | 0 | 1 | $12 | $12 |
| NET-PDU | 1 | 0 | 1 | $45 | $45 |
| NET-PATCH-PANEL-24 | 1 | 0 | 1 | $30 | $30 |
| NET-PATCH-1FT | 0 | 3 × 4 | 12 | $3 | $36 |
| NET-PATCH-3FT | 6 | 0 | 6 | $5 | $30 |
| INFRA-UPS | 1 | 0 | 1 | $250 | $250 |
| INFRA-RACK | 1 | 0 | 1 | $180 | $180 |
| INFRA-RACK-SHELF | 1 | 0 | 1 | $20 | $20 |
| REPLAY-MACMINI | 1 | 0 | 1 | $700 | $700 |
| REPLAY-SSD-1TB | 1 | 0 | 1 | $90 | $90 |
| REPLAY-CAMERA-WHITE | 0 | 1 × 4 | 4 | $120 | $480 |
| REPLAY-CAMERA-JB-WHITE | 0 | 1 × 4 | 4 | $15 | $60 |
| REPLAY-FLIC | 0 | 2 × 4 | 8 | $35 | $280 |
| REPLAY-SIGN | 0 | 1 × 4 | 4 | $25 | $100 |
| REPLAY-HW-KIT | 1 | 0 | 1 | $15 | $15 |
| DISPLAY-TV-65 | 0 | 1 × 4 | 4 | $500 | $2,000 |
| DISPLAY-TV-MOUNT | 0 | 1 × 4 | 4 | $30 | $120 |
| DISPLAY-APPLETV | 0 | 1 × 4 | 4 | $130 | $520 |
| DISPLAY-HDMI-3FT | 0 | 1 × 4 | 4 | $7 | $28 |
| DISPLAY-ATV-MOUNT | 0 | 1 × 4 | 4 | $25 | $100 |
| DISPLAY-IPAD | 0 | 1 × 4 | 4 | $600 | $2,400 |
| DISPLAY-IPAD-POE | 0 | 1 × 4 | 4 | $40 | $160 |
| DISPLAY-IPAD-CASE | 0 | 1 × 4 | 4 | $80 | $320 |
| **TOTAL** | | | | | **$8,604** |

Cost chain for 4-court Pro:
```
est_total_cost = $8,604
landed_cost    = $8,604 × 1.10 = $9,464
customer_price = $9,464 / 0.90 = $10,516
service_fees   = $5,000 (venue) + ($2,500 × 4 courts) = $15,000
invoice_subtotal = $10,516 + $15,000 = $25,516
sales_tax      = $25,516 × 0.1025 = $2,615
invoice_total  = $25,516 + $2,615 = $28,131
```

### BOM Generation Code Pseudocode

```typescript
// Called on project creation or manual BOM regeneration
async function generateBOM(project: Project, settings: Settings): Promise<void> {
  // Step 1: Get tier template rows
  const templates = await supabase
    .from('bom_templates')
    .select('*, hardware_catalog(*)')
    .eq('tier', project.tier);

  // Step 2: Calculate qty for each template row
  const bomItems = templates.data.map(t => ({
    project_id: project.id,
    hardware_catalog_id: t.hardware_catalog_id,
    qty: t.qty_per_venue
       + (t.qty_per_court * project.court_count)
       + (t.qty_per_door * project.door_count)
       + (t.qty_per_camera * project.security_camera_count),
    unit_cost: t.hardware_catalog.unit_cost,
    shipping_rate: settings.shipping_rate,
    margin: settings.target_margin,
  })).filter(item => item.qty > 0);

  // Step 3: Add conditional items (not tier-based)
  if (project.has_front_desk) {
    const frontDeskSkus = ['FD-CC-TERMINAL', 'FD-QR-SCANNER', 'FD-WEBCAM'];
    for (const sku of frontDeskSkus) {
      const item = await supabase.from('hardware_catalog').select().eq('sku', sku).single();
      bomItems.push({ project_id: project.id, hardware_catalog_id: item.data.id, qty: 1,
        unit_cost: item.data.unit_cost, shipping_rate: settings.shipping_rate, margin: settings.target_margin });
    }
  }
  if (project.has_pingpod_wifi) {
    const ap = await supabase.from('hardware_catalog').select().eq('sku', 'PP-WIFI-AP').single();
    bomItems.push({ project_id: project.id, hardware_catalog_id: ap.data.id, qty: 1,
      unit_cost: ap.data.unit_cost, shipping_rate: settings.shipping_rate, margin: settings.target_margin });
  }

  // Step 4: Delete existing BOM rows (for regeneration) then insert
  await supabase.from('project_bom_items').delete().eq('project_id', project.id);
  await supabase.from('project_bom_items').insert(bomItems);
}
```

### Operator Override Scenarios

| Scenario | Action Required |
|----------|----------------|
| 9+ court venue | Swap NET-USW-PRO-24-POE → NET-USW-PRO-48-POE (or add second 24-POE) |
| 5–8 court venue | Swap REPLAY-SSD-1TB → REPLAY-SSD-2TB |
| 9+ court venue | Swap REPLAY-SSD-1TB → REPLAY-SSD-4TB |
| Black camera preference | Swap REPLAY-CAMERA-WHITE → REPLAY-CAMERA-BLACK + JB-BLACK |
| 5+ security cameras | Swap SURV-UNVR → SURV-UNVR-PRO; change SURV-HDD qty 4 → 7 |
| PingPod venue | Use PBK or Pro template; manually add PP-WIFI-AP via has_pingpod_wifi flag |
| No junction box needed | Remove REPLAY-CAMERA-JB-WHITE (drywall mount: camera routes cable directly into wall) |

---

## Section 3: Pricing Tier Defaults

*(to be populated in `model-settings` aspect)*

---

## Section 4: VLAN Reference Data

*(to be populated in `model-network-reference` aspect)*

---

## Section 5: Troubleshooting Reference Pairs

*(to be populated in `ship-seed-data` aspect)*

---

## Checklist Template Statistics

| Phase | Phase Name | Step Count | Has Conditional Steps | Has Warnings |
|-------|------------|------------|----------------------|--------------|
| 0 | Pre-Purchase & Planning | 8 | Yes (step 4 Starlink warning) | Yes |
| 1 | Pre-Configuration (PodPlay Office) | 7 | No | Yes |
| 2 | Unboxing & Labeling | 7 | No | No |
| 3 | Network Rack Assembly | 6 | No | Yes |
| 4 | Networking Setup (UniFi) | 12 | Yes (steps 10, 11: tier) | Yes |
| 5 | ISP Router Configuration | 2 | No | Yes |
| 6 | Camera Configuration | 13 | No | Yes |
| 7 | DDNS Setup (FreeDNS) | 5 | No | No |
| 8 | Mac Mini Setup | 8 | No | Yes |
| 9 | Replay Service Deployment (V1) | 10 | No | No |
| 10 | iPad Setup | 11 | No | Yes |
| 11 | Apple TV Setup | 5 | No | No |
| 12 | Physical Installation (On-Site) | 10 | Yes (steps 8–10: autonomous) | Yes |
| 13 | Testing & Verification | 8 | No | Yes |
| 14 | Health Monitoring Setup | 3 | No | No |
| 15 | Packaging & Shipping | 6 | No | Yes |
| **TOTAL** | | **121** | | |

---

## Token Reference

All tokens used in step descriptions and warnings:

| Token | Source Field | Example Value |
|-------|-------------|---------------|
| `{{CUSTOMER_NAME}}` | `projects.customer_name` | TELEPARK |
| `{{COURT_COUNT}}` | `projects.court_count` | 6 |
| `{{DDNS_SUBDOMAIN}}` | `projects.ddns_subdomain` | telepark |
| `{{UNIFI_SITE_NAME}}` | `projects.unifi_site_name` | PL-TELEPARK |
| `{{MAC_MINI_USERNAME}}` | `projects.mac_mini_username` | nico |
| `{{LOCATION_ID}}` | `projects.location_id` (from dev team) | loc_abc123 |

Token substitution happens at checklist instantiation time (when project enters Stage 3 / deployment).
The `deployment_checklist_items` table stores the resolved descriptions with tokens replaced.

---

## Conditional Step Applicability

Steps with non-NULL `applicable_tiers`:

| Phase | Step | applicable_tiers | Reason |
|-------|------|-----------------|--------|
| 4 | 10 (SURVEILLANCE VLAN) | autonomous_plus | Only Autonomous+ includes NVR + surveillance cameras |
| 4 | 11 (ACCESS CONTROL VLAN) | autonomous, autonomous_plus | Autonomous and Autonomous+ include Kisi access control |
| 12 | 8 (Install Kisi Controller) | autonomous, autonomous_plus | Same as above |
| 12 | 9 (Install door readers) | autonomous, autonomous_plus | Same as above |
| 12 | 10 (Wire door locks) | autonomous, autonomous_plus | Same as above |

Steps where `is_v2_only = true`: None of the current 121 steps are V2-only.
Steps that ARE V1-only (Phase 9): All 10 steps. When V2 launches (~April 2026), Phase 9 will be replaced
with a new phase using GitHub deploy and dashboard config. The `is_v2_only` flag is reserved
for steps that should ONLY appear for V2 projects.

---

## Section 2: Troubleshooting Tips

**Aspect**: model-support-tiers
**Date**: 2026-03-06
**Source**: Venue Deployment Guide, Appendix A + Appendix D

Table: `troubleshooting_tips` — 16 rows

Support tiers: 1=On-site/remote ops, 2=Config specialist (Nico-level), 3=Engineer/developer (Patrick-level)
Severity values: 'info', 'warning', 'critical'
phase_number: matches deployment phase (0–15); NULL = globally applicable

```sql
INSERT INTO troubleshooting_tips
  (phase_number, issue, solution, support_tier, severity, sort_order)
VALUES
  -- Phase 3: Rack Assembly
  (3,
   'Mac Mini overheating',
   'Mac Mini needs breathing room in rack. Do not install flush against other equipment. Leave at least 1U of clearance above and below the Mac Mini shelf.',
   1, 'warning', 1),

  -- Phase 5: ISP Router Configuration
  (5,
   'Port 4000 unreachable from outside network',
   'Verify the full forwarding chain: (1) ISP router forwards port 4000 → UDM IP, OR UDM IP is in ISP DMZ, OR ISP has issued a static IP. (2) UDM forwards port 4000 TCP/UDP → 192.168.32.100 (Mac Mini). (3) Mac Mini is on REPLAY VLAN at 192.168.32.100. Test from cellular network: http://CUSTOMERNAME.podplaydns.com:4000/health',
   2, 'critical', 1),

  -- Phase 6: Camera Configuration
  (6,
   'Camera image is warped or distorted',
   'Lens distortion coefficients need adjustment. Set all coefficients to zero first to get the raw uncorrected image. Calibrate coefficients after physical installation when final camera position and angle are confirmed.',
   2, 'warning', 1),

  -- Phase 7: DDNS Setup
  (7,
   'DDNS not updating — CUSTOMERNAME.podplaydns.com resolves to wrong IP',
   'Check the cron job on Mac Mini: run `crontab -l` to verify the FreeDNS cron entry exists. Check the update log: `cat /tmp/freedns_CUSTOMERNAME_podplaydns_com.log` for errors. If cron is missing, re-run `crontab -e` and re-paste the curl command from FreeDNS quick cron example.',
   2, 'warning', 1),

  -- Phase 8: Mac Mini Setup
  (8,
   'Mac Mini black screen (crash — screen share unresponsive)',
   'Screen sharing will not work if the screen is black (GPU crash). SSH into Mac Mini instead: `ssh USERNAME@192.168.32.100` (from REPLAY VLAN) or `ssh USERNAME@CUSTOMERNAME.podplaydns.com` (via DDNS). Once connected, run `sudo reboot` to restart.',
   1, 'warning', 1),

  (8,
   '.DS_Store file in cache folder breaking replay processing',
   'Run in Mac Mini terminal: `cd ~/cache && rm .DS_Store`. CRITICAL: Never open the cache folder in macOS Finder — Finder automatically recreates .DS_Store which corrupts the rename service. Always navigate to the cache folder via terminal only.',
   1, 'warning', 2),

  -- Phase 9: Replay Service Deployment
  (9,
   'Replays not generating for a specific time window',
   'The rename service may have failed during that window. Files need timestamps (e.g., filename 0225 = 2:25 AM). Check rename service status via the health endpoint: http://CUSTOMERNAME.podplaydns.com:4000/health — look for rename_service field. Restart the replay service if rename_service shows as down.',
   2, 'warning', 1),

  (9,
   'Replay video is pixelated or has visual artifacts',
   'V1 replay service uses UDP transport — pixelation is a known architectural limitation. The fix is to deploy V2 (TCP-based) when it launches ~April 2026. Contact the developer (Patrick) to discuss V2 migration timeline. For V1, ensure upload bandwidth meets the speed table requirements for court count.',
   3, 'info', 2),

  -- Phase 10: iPad Setup
  (10,
   'PodPlay app on iPad does not show the customer''s club name',
   'Check the Mosyle "Install App" group for this customer. The P-List configuration must have the correct LOCATION_ID string: <dict><key>id</key><string>LOCATION_ID</string></dict>. Confirm the LOCATION_ID value with Agustin (app readiness team). If P-List is wrong, update in Mosyle and force-reinstall the app.',
   2, 'warning', 1),

  (10,
   'iPad not receiving MDM commands from Mosyle',
   'iPad may be asleep with auto-lock enabled. During configuration: go to iPad Settings → Display & Brightness → Auto-Lock → Never. For deployed iPads, MDM commands are sent during the 2:00–3:00 AM App Lock off window when the device restarts. Schedule commands for ~2:30 AM.',
   1, 'warning', 2),

  (10,
   'iPads enrolled in wrong court order in Mosyle',
   'Mosyle assigns device names in the order iPads are powered on. If powered on out of order, court-to-device mapping will be wrong. In Mosyle, filter by enrolled date to see the actual enrollment order. To fix: either rename devices manually in Mosyle, or factory reset and re-enroll in correct court-number order (C1 first, then C2, etc.).',
   1, 'warning', 3),

  -- Phase 12: Physical Installation
  (12,
   'Flic buttons won''t pair to iPad (''Bluetooth Pairing Failed'' / ''Verification Failed'')',
   'App Lock MUST be completely off before pairing Flic buttons. In Mosyle, go to this location''s App Lock settings and turn it off entirely. On the iPad, exit Guided Access if active. Then retry the Flic pairing process in the PodPlay app. Re-enable App Lock after all buttons are successfully paired.',
   1, 'warning', 1),

  (12,
   'Flic button is unresponsive (no LED, no action)',
   'Replace the CR2032 coin cell battery. Yellow LED blink = low battery warning. If new battery does not fix it: factory reset the button. Remove battery, wait 5 seconds, reinsert battery, then hold both the top and bottom of the button simultaneously for 10 seconds until the LED blinks red. Re-pair to iPad after reset.',
   1, 'info', 2),

  (12,
   'PoE adapter intermittent connection drops',
   'Cable runs must be clean, straight, and under 100 meters total length. PoE adapters are very sensitive to cable quality. Do not bunch or coil excess cable tightly. If drops continue, re-terminate the RJ45 connectors — a bad crimp is the most common cause. Test with a cable tester if available.',
   1, 'warning', 3),

  -- Phase 13: Testing & Verification
  (13,
   'Button paired but scoring not updating on display',
   'Restart the iPad to re-sync the Firebase real-time connection. Single press should increment score; double press should undo; long press should trigger replay. If scoring still fails after restart, check Firebase service status at status.firebase.google.com. If Firebase is operational, open the iPad configuration menu (long-press logo in corner) and verify both button assignments show green on press.',
   1, 'warning', 1);
```

**Row count**: 16 rows
**Phase distribution**:
- Phase 3: 1 row (Tier 1)
- Phase 5: 1 row (Tier 2)
- Phase 6: 1 row (Tier 2)
- Phase 7: 1 row (Tier 2)
- Phase 8: 2 rows (Tier 1)
- Phase 9: 2 rows (Tier 2, Tier 3)
- Phase 10: 3 rows (Tier 2, Tier 1, Tier 1)
- Phase 12: 3 rows (Tier 1, Tier 1, Tier 1)
- Phase 13: 1 row (Tier 1)

**Tier distribution**: Tier 1=10, Tier 2=5, Tier 3=1
**Severity distribution**: critical=1, warning=12, info=3
