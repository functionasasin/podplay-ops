# Analysis: model-network-reference

**Aspect**: model-network-reference
**Wave**: 2 — Data Model Extraction
**Date**: 2026-03-06
**Source**: `analysis/source-deployment-guide.md` → Phase 4 (Networking Setup), Appendix C (Network Reference), Phase 5 (ISP Config), Phase 0 Step 5 (ISP speed requirements)

---

## Scope

This aspect covers all network configuration reference data for PodPlay deployments:
- VLAN architecture (4 VLANs: Default/Management, REPLAY, SURVEILLANCE, ACCESS CONTROL)
- Fixed IP assignments (Mac Mini, camera factory default, gateway addresses)
- Port 4000 (critical — all replay service communication)
- ISP bandwidth requirements by court count
- Backup ISP rules for Autonomous/24hr venues
- Internal LAN bandwidth guidance

This produces two new reference/seed tables:
1. `network_vlans` — VLAN configuration reference (4 rows)
2. `isp_bandwidth_requirements` — court count → minimum ISP speeds (5 rows)

---

## VLAN Architecture

Source: Deployment guide Phase 4 (Steps 42–44), Appendix C.

### Four VLANs

| VLAN Name | VLAN ID | Final Subnet | Gateway IP | DHCP Range | mDNS | Tier Requirement |
|-----------|---------|-------------|------------|------------|------|-----------------|
| Default (Management) | untagged | 192.168.30.0/24 | 192.168.30.1 | DHCP server | No | All tiers |
| REPLAY | 32 | 192.168.32.0/24 | 192.168.32.254 | 192.168.32.1–192.168.32.254 | **Yes** | All tiers |
| SURVEILLANCE | 31 | 192.168.31.0/24 | 192.168.31.254 | DHCP server | No | Autonomous+ only |
| ACCESS CONTROL | 33 | 192.168.33.0/24 | 192.168.33.254 | DHCP server | No | Autonomous and Autonomous+ |

**Notes**:
- **Default VLAN transition**: Initially configured as 192.168.1.1 subnet for camera initial setup (cameras factory-default to 192.168.1.108). After ALL cameras are configured and moved to REPLAY VLAN, the Default network is changed to 192.168.30.1 (Step 58: "After ALL cameras configured, change default network to 192.168.30.1 subnet"). The 192.168.1.x address is only transient.
- **REPLAY gateway**: Explicitly specified as 192.168.32.254 (Step 42 exact settings table).
- **SURVEILLANCE and ACCESS CONTROL gateways**: Not explicitly stated in guide. Convention used: .254 per subnet (matching REPLAY pattern). To be confirmed with Nico.
- **mDNS on REPLAY**: Required for Apple TV discovery — iPad and Apple TV must communicate over mDNS for replay delivery. Explicitly specified in Step 42 settings.
- **All VLANs allow internet access**: UniFi "Allow Internet Access: Yes" specified for REPLAY (Step 42). Assumed for all VLANs.
- **REPLAY VLAN ID = 32**: Manual assignment. Must not conflict with existing VLAN IDs at venue.

### REPLAY VLAN Exact Settings (from Step 42)

| Setting | Value |
|---------|-------|
| Network Name | REPLAY |
| Host Address | 192.168.32.254 |
| Netmask | /24 |
| Gateway IP | 192.168.32.254 |
| Broadcast IP | 192.168.32.255 |
| VLAN ID | 32 (Manual) |
| Allow Internet Access | Yes |
| mDNS | Yes |
| DHCP Mode | DHCP Server |
| DHCP Range Start | 192.168.32.1 |
| DHCP Range End | 192.168.32.254 |

---

## Fixed IP Assignments

Source: Deployment guide Phase 4 (Step 71), Phase 6 (Step 54), Appendix C.

| Device | IP Address | VLAN | Assignment Method | Notes |
|--------|------------|------|-------------------|-------|
| Mac Mini (replay server) | 192.168.32.100 | REPLAY (32) | Fixed (manual in UniFi) | ALWAYS this IP. Static assignment ensures port 4000 forwarding target is stable. |
| REPLAY VLAN Gateway | 192.168.32.254 | REPLAY (32) | UDM gateway config | Gateway address also used as host address on UDM for REPLAY network. |
| Camera (factory default) | 192.168.1.108 | Default (initial) | Factory reset IP | All cameras default to this IP. Configure ONE AT A TIME — each shares this IP before DHCP assignment. After each camera is configured to DHCP mode, UniFi assigns it to REPLAY VLAN with a DHCP-assigned fixed IP. |
| Cameras (post-config) | 192.168.32.x | REPLAY (32) | DHCP + fixed in UniFi | Each camera gets a fixed IP in REPLAY subnet. Exact IPs assigned per-venue. Naming matches camera names in RSC sheet and admin dashboard. |

**Source steps**:
- Mac Mini fixed IP: Phase 8 Step 71 — "In UniFi, assign Mac Mini to REPLAY VLAN with fixed address 192.168.32.100"
- Camera initial IP: Phase 6 Step 49 — "Navigate to 192.168.1.108 in browser"
- Camera VLAN assignment: Phase 6 Step 54 — "In UniFi, assign camera to REPLAY VLAN (.32 subnet) with fixed IP"

---

## Port 4000

Source: Deployment guide Steps 45, 46, 47, 113, 114; Appendix C; Appendix F Q4.

| Setting | Value |
|---------|-------|
| Port number | 4000 |
| Protocol | TCP/UDP (both) |
| Direction | Inbound (external → Mac Mini) |
| Destination | 192.168.32.100 (Mac Mini fixed IP) |
| Purpose | ALL replay service communication — cloud sync, client app traffic, health checks |

**Why port 4000 is critical**:
> "Port 4000 is critical — all replay service communication flows through it. If blocked, the entire system fails." — Step 45 warning

**Port forward chain** (most to least preferred):
1. ISP provides static IP → UDM configured with static WAN → UDM port forwards 4000 → Mac Mini (192.168.32.100)
2. ISP router DMZ → puts UDM IP in DMZ → UDM port forwards 4000 → Mac Mini
3. ISP router port forward → forwards 4000 to UDM WAN IP → UDM port forwards 4000 → Mac Mini

**Validation approach**: From cellular network (not venue WiFi), hit `http://CUSTOMERNAME.podplaydns.com:4000/health` — any JSON response confirms Mac Mini is reachable externally.

**Known incompatibilities**:
- Starlink: CGNAT, no port forwarding, port 4000 always blocked — NOT compatible
- Philippines residential ISPs: CGNAT blocks all incoming — MUST use business plan with static IP

**Protocol details by service version**:
- V1 replay service: UDP over port 4000. Known pixelation issue due to UDP packet loss.
- V2 replay service (~April 2026): TCP over port 4000. Fixes pixelation. Same port, different protocol.

**Key URLs using port 4000**:
- External: `http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000`
- Local fallback: `http://192.168.32.100:4000`
- Health endpoint: `http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health`
- Instant replay endpoint: `http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/instant-replay/{{COURT_NAME}}`

---

## ISP Bandwidth Requirements by Court Count

Source: Deployment guide Phase 0 Step 5 (exact table), Appendix C.

| Courts | Fiber (symmetric) | Cable (upload) | Dedicated (symmetric) |
|--------|------------------|----------------|----------------------|
| 1–4 | 50–100 Mbps | 60 Mbps upload | 30/30 Mbps |
| 5–11 | 150 Mbps | Highest possible upload | 50/50 Mbps |
| 12–19 | 200 Mbps | Highest possible upload | 50/50 Mbps |
| 20–24 | 300 Mbps | Highest possible upload | 100/100 Mbps |
| 25+ | 400 Mbps | Highest possible upload | 150/150 Mbps |

**Notes**:
- Fiber is symmetrical (equal up/down). The "50–100/100 Mbps" for 1–4 courts means any fiber plan 50/50 to 100/100 is acceptable; minimum is 50 Mbps symmetric.
- Cable upload is the binding constraint (asymmetric). Download speed on cable is not specified as a requirement.
- "Highest possible upload" for cable (5+ courts) means: order the highest upload tier available from the ISP. Cable upload speeds vary too widely by ISP to specify a fixed number.
- Dedicated circuit = symmetric by definition; same value for up and down.
- Internal LAN: 1 Gbps (standard switch ports) sufficient for up to ~20 replay cameras. SFP+ (10 Gbps) on UDM/switch is available but unnecessary for most deployments.

---

## Backup ISP Requirements

Source: Deployment guide Appendix C "Backup Internet" section; Phase 5 Step 47.

**When required**: Autonomous venues operating 24/7 — require two ISPs from different backbone providers.

**Rules**:
- Must be from different backbone providers (if one backbone fails, the other should stay up)
- Each ISP must have a static IP
- UDM supports WAN failover — secondary WAN configured on UDM WAN2 port

**US examples**:
- Verizon + Spectrum (fiber + cable = different backbones)
- Verizon + Google Fiber
- Any two ISPs that don't share infrastructure

**Philippines examples** (from international deployment analysis):
- PLDT + Converge (different backbones — recommended)
- Do NOT pair PLDT + Globe (may share backbone segments)

**Trigger in projects table**: `has_backup_isp = true` + `isp_provider_backup TEXT` (ISP name for second provider).

---

## Database Tables

### Table: `network_vlans`

Reference table with one row per VLAN. Seed data is static — 4 rows for the 4 PodPlay VLANs.

```sql
CREATE TABLE network_vlans (
  id                   TEXT        PRIMARY KEY,
  -- 'default', 'replay', 'surveillance', 'access_control'

  display_name         TEXT        NOT NULL,
  -- 'Default (Management)', 'REPLAY', 'SURVEILLANCE', 'ACCESS CONTROL'

  vlan_id              INTEGER,
  -- VLAN tag. NULL for Default (untagged). 32=REPLAY, 31=SURVEILLANCE, 33=ACCESS_CONTROL.
  -- UniFi uses "Manual" VLAN ID entry.

  subnet               TEXT        NOT NULL,
  -- CIDR: '192.168.30.0/24', '192.168.32.0/24', '192.168.31.0/24', '192.168.33.0/24'

  gateway_ip           TEXT        NOT NULL,
  -- UDM gateway IP for this VLAN. REPLAY: 192.168.32.254 (explicit). Others: .254 by convention.

  dhcp_start           TEXT,
  -- DHCP pool start. '192.168.32.1' for REPLAY. NULL if not DHCP server (edge case).

  dhcp_end             TEXT,
  -- DHCP pool end. '192.168.32.254' for REPLAY. NULL if not DHCP server.

  mdns_enabled         BOOLEAN     NOT NULL DEFAULT false,
  -- TRUE only for REPLAY. mDNS required for Apple TV <-> iPad discovery.

  allows_internet      BOOLEAN     NOT NULL DEFAULT true,
  -- All VLANs allow internet access. Explicit UniFi setting.

  required_for_tiers   TEXT[],
  -- NULL = all tiers. ['autonomous_plus'] = SURVEILLANCE only. ['autonomous','autonomous_plus'] = ACCESS CONTROL.

  is_conditional       BOOLEAN     NOT NULL DEFAULT false,
  -- FALSE = always create. TRUE = only create if tier requires it.

  notes                TEXT,
  -- Deployment notes for the wizard checklist.

  sort_order           INTEGER     NOT NULL DEFAULT 0,
  -- Display order in UI: 1=Default, 2=REPLAY, 3=SURVEILLANCE, 4=ACCESS CONTROL

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — read-only reference/seed data for all authenticated users.
ALTER TABLE network_vlans ENABLE ROW LEVEL SECURITY;
CREATE POLICY network_vlans_read ON network_vlans
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE for non-admin users.
```

**Indexes**: None beyond PK — table has 4 rows, full scan is fine.

---

### Table: `isp_bandwidth_requirements`

Reference table with one row per court count range. Used to validate ISP speed inputs during intake wizard.

```sql
CREATE TABLE isp_bandwidth_requirements (
  id                      SERIAL      PRIMARY KEY,

  court_min               INTEGER     NOT NULL,
  -- Lower bound of court count range (inclusive). 1, 5, 12, 20, 25.

  court_max               INTEGER,
  -- Upper bound (inclusive). NULL = no upper limit (25+ courts).

  fiber_mbps              INTEGER     NOT NULL,
  -- Minimum symmetric Mbps for fiber. Fiber is symmetrical (equal up/down).
  -- Row 1 (1–4 courts): 50 (range 50–100 acceptable, 50 is minimum).

  cable_upload_mbps       INTEGER,
  -- Minimum upload Mbps for cable ISP. NULL = "highest possible upload" (no fixed minimum).
  -- Only row 1 (1–4 courts) has a specific value: 60 Mbps upload.

  cable_note              TEXT,
  -- Human-readable note for cable: '60 Mbps upload minimum' or 'Highest possible upload'.

  dedicated_mbps          INTEGER     NOT NULL,
  -- Minimum symmetric Mbps for dedicated circuit (equal up/down).

  sort_order              INTEGER     NOT NULL DEFAULT 0,
  -- Row display order (1–5).

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — read-only reference/seed data.
ALTER TABLE isp_bandwidth_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY isp_bandwidth_read ON isp_bandwidth_requirements
  FOR SELECT TO authenticated USING (true);
```

**Indexes**: None beyond PK — 5 rows, full scan is fine.

---

## Seed Data

### Seed: `network_vlans`

```sql
INSERT INTO network_vlans
  (id, display_name, vlan_id, subnet, gateway_ip, dhcp_start, dhcp_end,
   mdns_enabled, allows_internet, required_for_tiers, is_conditional, notes, sort_order)
VALUES
  (
    'default',
    'Default (Management)',
    NULL,
    '192.168.30.0/24',
    '192.168.30.1',
    '192.168.30.2',
    '192.168.30.254',
    false,
    true,
    NULL,
    false,
    'Management VLAN for UDM, Mac Mini admin interface, ISP modem. NOTE: During Phase 6 camera configuration, the Default network temporarily uses 192.168.1.1 (cameras factory-default to 192.168.1.108). After all cameras are configured and moved to REPLAY VLAN, change Default network to 192.168.30.1 (Step 58).',
    1
  ),
  (
    'replay',
    'REPLAY',
    32,
    '192.168.32.0/24',
    '192.168.32.254',
    '192.168.32.1',
    '192.168.32.254',
    true,
    true,
    NULL,
    false,
    'Primary operating VLAN. Carries all PodPlay traffic: Mac Mini (fixed 192.168.32.100), replay cameras (DHCP-fixed), iPads, Apple TVs. mDNS REQUIRED for Apple TV discovery. Port 4000 forwarded to 192.168.32.100. All tiers use this VLAN.',
    2
  ),
  (
    'surveillance',
    'SURVEILLANCE',
    31,
    '192.168.31.0/24',
    '192.168.31.254',
    '192.168.31.1',
    '192.168.31.254',
    false,
    true,
    ARRAY['autonomous_plus'],
    true,
    'Surveillance-only VLAN for UniFi NVR and security cameras. Autonomous+ tier only. Create only if security_camera_count > 0 and has_nvr = true. Gateway .254 follows REPLAY VLAN convention (not explicitly documented — confirm with Nico).',
    3
  ),
  (
    'access_control',
    'ACCESS CONTROL',
    33,
    '192.168.33.0/24',
    '192.168.33.254',
    '192.168.33.1',
    '192.168.33.254',
    false,
    true,
    ARRAY['autonomous', 'autonomous_plus'],
    true,
    'Access control VLAN for Kisi Controller Pro 2 or UniFi Access hub and door readers. Autonomous and Autonomous+ tiers. Create only if door_count > 0. Gateway .254 follows REPLAY VLAN convention.',
    4
  );
```

### Seed: `isp_bandwidth_requirements`

```sql
INSERT INTO isp_bandwidth_requirements
  (court_min, court_max, fiber_mbps, cable_upload_mbps, cable_note, dedicated_mbps, sort_order)
VALUES
  (1,  4,    50,  60,   '60 Mbps upload minimum',   30,  1),
  -- Fiber: 50–100 Mbps symmetric range acceptable (50 is minimum; 100 preferred)
  -- Cable: 60 Mbps upload is the minimum (only row with a specific cable upload requirement)
  -- Dedicated: 30/30 Mbps symmetric

  (5,  11,  150, NULL, 'Highest possible upload',   50,  2),
  -- Fiber: 150/150 Mbps symmetric
  -- Cable: no fixed minimum — order the highest upload tier available
  -- Dedicated: 50/50 Mbps symmetric

  (12, 19,  200, NULL, 'Highest possible upload',   50,  3),
  -- Fiber: 200/200 Mbps symmetric
  -- Cable: highest possible upload
  -- Dedicated: 50/50 Mbps symmetric

  (20, 24,  300, NULL, 'Highest possible upload',  100,  4),
  -- Fiber: 300/300 Mbps symmetric
  -- Cable: highest possible upload
  -- Dedicated: 100/100 Mbps symmetric

  (25, NULL, 400, NULL, 'Highest possible upload', 150,  5);
  -- Fiber: 400/400 Mbps symmetric (25+ courts, no upper bound)
  -- Cable: highest possible upload
  -- Dedicated: 150/150 Mbps symmetric
```

---

## ISP Validation Logic (for Wave 3 / logic-isp-validation)

The `isp_bandwidth_requirements` table drives validation in the intake wizard:

```typescript
// Lookup the row for the project's court count
SELECT * FROM isp_bandwidth_requirements
WHERE court_min <= $court_count
  AND (court_max IS NULL OR court_max >= $court_count)
LIMIT 1;

// Validation rules:
// 1. If isp_type = 'fiber': internet_upload_mbps >= fiber_mbps
// 2. If isp_type = 'cable': cable_upload_mbps IS NULL (no fixed minimum — show cable_note) OR internet_upload_mbps >= cable_upload_mbps
// 3. If isp_type = 'dedicated': internet_upload_mbps >= dedicated_mbps AND internet_download_mbps >= dedicated_mbps
// 4. If isp_provider ILIKE '%starlink%': BLOCKING error regardless of speed
```

---

## Migration Order Update

```
-- New additions (no foreign key dependencies to other tables):
26. network_vlans              (reference table — insert after deployment_regions)
27. INSERT seed data for network_vlans
28. isp_bandwidth_requirements (reference table)
29. INSERT seed data for isp_bandwidth_requirements
```

---

## Known Gaps

| Gap | Impact | Resolution |
|-----|--------|-----------|
| SURVEILLANCE VLAN gateway IP not explicitly documented | Could be .1 or .254 | Confirm with Nico during setup; assumed .254 to match REPLAY convention |
| ACCESS CONTROL VLAN gateway IP not explicitly documented | Same as above | Same resolution |
| SURVEILLANCE VLAN DHCP range not explicitly specified | Assumed standard /24 range | Confirm with Nico |
| Camera fixed IP assignments (per-court IPs in REPLAY VLAN) | Not stored in reference table — venue-specific | Stored in `deployment_checklist_items` notes per project; not normalized |
| Internal LAN bandwidth limit (20 cameras on 1 Gbps) | No enforcement in app | Document as informational note in Phase 4 checklist step |
