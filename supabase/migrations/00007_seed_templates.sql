-- Migration 00007: Seed Templates
-- Creates deployment_checklist_templates table and seeds:
--   - deployment_checklist_templates: 121 rows, phases 0–15
--   - bom_templates: 4 tiers (pro, autonomous, autonomous_plus, pbk)
--   - settings: confirm default values (row already seeded in 00002)
-- All inserts use ON CONFLICT DO NOTHING for idempotency.

-- ============================================================
-- Table: deployment_checklist_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS deployment_checklist_templates (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  phase            INTEGER     NOT NULL,
  phase_name       TEXT        NOT NULL,
  step_number      INTEGER     NOT NULL,
  title            TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  warnings         TEXT[],
  auto_fill_tokens TEXT[],
  applicable_tiers service_tier[],
  is_v2_only       BOOLEAN     NOT NULL DEFAULT false,
  sort_order       INTEGER     NOT NULL,

  CONSTRAINT deployment_checklist_templates_phase_step_unique UNIQUE (phase, step_number)
);

ALTER TABLE deployment_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access deployment_checklist_templates"
  ON deployment_checklist_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add unique constraint to bom_templates for idempotent inserts
ALTER TABLE bom_templates
  ADD CONSTRAINT bom_templates_tier_item_unique UNIQUE (tier, item_id);

-- ============================================================
-- Seed: deployment_checklist_templates (121 rows, phases 0–15)
-- sort_order = phase × 100 + step_number  (Phase 0 is exception: sort = step_number)
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
 'In UniFi, apply labels to all UDM ports identifying connected devices. Port 1: Mac Mini. SFP: USW-Pro Switch. Port 9 (Autonomous 24/7): Backup Internet. Port 10 (Autonomous/Autonomous+): Kisi Controller. Label any additional occupied ports with connected device names.',
 NULL,NULL,NULL,false,405),

(4,'Phase 4: Networking Setup (UniFi)',6,
 'Label PDU in UniFi',
 'In UniFi, label each PDU outlet with the connected device name for remote power management. Typical layout: Outlet 1 = UDM, Outlet 2 = USW-Pro Switch, Outlet 3 = Mac Mini, Outlet 4 = NVR (Autonomous+ only). Label all occupied outlets.',
 NULL,NULL,NULL,false,406),

(4,'Phase 4: Networking Setup (UniFi)',7,
 'Connect switch to UDM via SFP DAC cable',
 'Connect the USW-Pro switch to the UDM using the UACC-DAC-SFP10-0.5M SFP DAC cable. Apply labels to switch ports identifying connected devices. Typical port assignments: Ports 1-N = Replay cameras (one per court), Ports N+1 = Apple TVs (one per court), Ports N+2 = iPads via PoE adapter (one per court), Autonomous ports = Kisi Controller and door readers. Label each occupied port with the court number or device name.',
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
 'Go to freedns.afraid.org → Dynamic DNS → click the "Add" button. Create record: Type=A, Subdomain={{DDNS_SUBDOMAIN}}, Domain=podplaydns.com (private/stealth), Destination=10.10.10.10 (temporary IP — the DDNS cron job on the Mac Mini will overwrite this with the venue''s real public IP automatically), TTL=60 seconds, Wildcard=Unchecked.',
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
-- NOTE: V2 (~April 2026) will replace steps 1–6 with GitHub deploy + dashboard config.
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
 NULL,ARRAY['CUSTOMER_NAME'],NULL,false,1506)

ON CONFLICT (phase, step_number) DO NOTHING;


-- ============================================================
-- Seed: bom_templates — PRO TIER
-- qty_per_court items use quantity_rule {"scale_by": "court_count"}
-- qty_per_venue items use default_quantity only, quantity_rule null
-- ============================================================

-- Network Rack (Pro)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PDU'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 3, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 6, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Infrastructure (Pro)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-UPS'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Replay System (Pro)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, false
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 2, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Displays (Pro)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pro'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE'
ON CONFLICT (tier, item_id) DO NOTHING;


-- ============================================================
-- Seed: bom_templates — AUTONOMOUS TIER
-- Identical to Pro + NET-PATCH-10FT, Kisi access control,
-- UniFi G5 security cameras (no NVR in Autonomous tier)
-- ============================================================

-- Network Rack (Autonomous)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PDU'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 3, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 6, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 2, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-10FT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Infrastructure (Autonomous — identical to Pro)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-UPS'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Replay System (Autonomous — identical to Pro)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, false
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 2, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Displays (Autonomous — identical to Pro)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Access Control (Autonomous addition)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'AC-KISI-CONTROLLER'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "door_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'AC-KISI-READER'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Surveillance cameras without NVR (Autonomous addition)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "security_camera_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'SURV-CAMERA-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous'::service_tier, id, 1, '{"scale_by": "security_camera_count"}'::jsonb, false
  FROM hardware_catalog WHERE sku = 'SURV-CAMERA-JB-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;


-- ============================================================
-- Seed: bom_templates — AUTONOMOUS+ TIER
-- Autonomous + NVR (UNVR) + 4x WD Purple 8TB HDDs
-- Uses 2 SFP DAC cables: (1) UDM↔switch, (2) switch↔UNVR
-- ============================================================

-- Network Rack (Autonomous+)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 2, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PDU'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 3, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 6, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 2, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-10FT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Infrastructure (Autonomous+)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-UPS'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Replay System (Autonomous+)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, false
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 2, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Displays (Autonomous+)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Access Control (Autonomous+)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'AC-KISI-CONTROLLER'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "door_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'AC-KISI-READER'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Surveillance with NVR (Autonomous+ additions)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "security_camera_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'SURV-CAMERA-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, '{"scale_by": "security_camera_count"}'::jsonb, false
  FROM hardware_catalog WHERE sku = 'SURV-CAMERA-JB-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'SURV-UNVR'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'autonomous_plus'::service_tier, id, 4, NULL, true
  FROM hardware_catalog WHERE sku = 'SURV-HDD'
ON CONFLICT (tier, item_id) DO NOTHING;


-- ============================================================
-- Seed: bom_templates — PBK TIER
-- Identical hardware to Pro. Custom pricing via settings.
-- ============================================================

-- Network Rack (PBK)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-UDM-SE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-USW-PRO-24-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-SFP-DAC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PDU'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-PANEL-24'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 3, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-1FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 6, NULL, true
  FROM hardware_catalog WHERE sku = 'NET-PATCH-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Infrastructure (PBK)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-UPS'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'INFRA-RACK-SHELF'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Replay System (PBK)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-MACMINI'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SSD-1TB'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, false
  FROM hardware_catalog WHERE sku = 'REPLAY-CAMERA-JB-WHITE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 2, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-FLIC'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'REPLAY-SIGN'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, NULL, true
  FROM hardware_catalog WHERE sku = 'REPLAY-HW-KIT'
ON CONFLICT (tier, item_id) DO NOTHING;

-- Displays (PBK)
INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-65'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-TV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-APPLETV'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-HDMI-3FT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-ATV-MOUNT'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-POE'
ON CONFLICT (tier, item_id) DO NOTHING;

INSERT INTO bom_templates (tier, item_id, default_quantity, quantity_rule, is_required)
SELECT 'pbk'::service_tier, id, 1, '{"scale_by": "court_count"}'::jsonb, true
  FROM hardware_catalog WHERE sku = 'DISPLAY-IPAD-CASE'
ON CONFLICT (tier, item_id) DO NOTHING;


-- ============================================================
-- Seed: settings (update row seeded in 00002 with spec values)
-- Row already exists with id='default'; use ON CONFLICT DO NOTHING
-- since all values are already set as column defaults.
-- ============================================================
INSERT INTO settings (
  id,
  pro_venue_fee, pro_court_fee,
  autonomous_venue_fee, autonomous_court_fee,
  pbk_venue_fee, pbk_court_fee,
  sales_tax_rate, shipping_rate, target_margin,
  labor_rate_per_hour, hours_per_day,
  lodging_per_day, airfare_default,
  annual_rent, annual_indirect_salaries
) VALUES (
  'default',
  5000.00, 2500.00,
  7500.00, 2500.00,
  0.00, 0.00,
  0.1025, 0.10, 0.10,
  120.00, 10,
  250.00, 1800.00,
  27600.00, 147000.00
) ON CONFLICT (id) DO NOTHING;
