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

## Section 2: Hardware Catalog

*(to be populated in `ship-seed-data` aspect)*

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
