# Analysis: model-international-deployment

**Aspect**: model-international-deployment
**Wave**: 2 — Data Model Extraction
**Date**: 2026-03-06
**Source**: `analysis/source-deployment-guide.md` → Appendix F (Open Questions: Asia Deployment), ISP Config section, Philippines ISP Requirements section

---

## Scope

This aspect covers the data model additions required to support international deployments, specifically the Asia (Philippines) context for the Cosmos entity (PodPlay's franchise/partner in the Philippines operating as a separate legal entity, not a sub-org). The primary deployment variant is a standard PodPlay pickleball venue but with region-specific ISP, power, video standard, and vendor constraints.

---

## Cosmos Entity Context

- **Entity**: Cosmos (Philippines-based franchisee/partner)
- **Relationship to PodPlay**: Separate legal entity — NOT a sub-org of PodPlay
- **MDM**: Needs its own Mosyle instance (cannot be under PodPlay's Mosyle account)
- **Apple Business Manager**: Needs its own ABM org (devices can be transferred from PodPlay ABM via factory-reset-and-re-enroll flow — see `model-device-migration`)
- **UniFi Account**: Ownership transfer planned — first club under PodPlay, future clubs under Cosmos
- **FreeDNS Domain**: Open question — whether to use same `podplaydns.com` domain or a separate domain for Asia venues
- **Admin Dashboard**: Open question — shared instance or own Cosmos instance
- **App Binary**: White-labeled per facility; each facility gets its own app via VPP (not App Store); LOCATION_ID from dev team (Agustin)

---

## Region-Specific Requirements

### Internet Service Providers

#### United States
| ISP Type | Supported Providers |
|----------|---------------------|
| Fiber | Verizon, Optimum, Spectrum, Google Fiber |
| Cable | Verizon, Optimum, Spectrum |
| 5G | Any carrier offering static IP |
| Dedicated | Any business-grade circuit with static IP |

**Notes**:
- Residential plans typically support port forwarding (acceptable)
- CGNAT on residential plans can block port 4000 — verify with ISP
- Starlink: NOT COMPATIBLE (CGNAT, no port forwarding, blocks port 4000)

#### Philippines
| ISP | Plan Required | Plan Name |
|-----|---------------|-----------|
| PLDT | Business plan + static IP mandatory | PLDT Beyond Fiber |
| Globe | Business plan + static IP mandatory | Globe GFiber Biz |
| Converge | Business plan + static IP mandatory | Converge FlexiBIZ |

**Critical rules for Philippines**:
- Residential plans use CGNAT which blocks ALL incoming connections — port 4000 unusable
- Business plan + static IP is NON-NEGOTIABLE for any Philippines deployment
- Dual ISP required for Autonomous / 24-hour venues: PLDT + Converge (different backbones)
- Do NOT pair PLDT + Globe (may share backbone)

### Power Standards

| Region | Voltage | Frequency | Compatibility Status |
|--------|---------|-----------|---------------------|
| United States | 120V | 60Hz | All PodPlay hardware designed for |
| Philippines | 220V | 60Hz | OPEN QUESTION: must verify all hardware is 220V/60Hz compatible |

**Open Question #3 from Appendix F**: Are EmpireTech cameras, Flic buttons, Mac Mini, UDM, and all switches confirmed 220V/60Hz compatible? Priority: CRITICAL. To be resolved during NJ Training (March 2–10, 2026).

**Note**: Many modern power supplies are universal (100–240V, 50–60Hz). However, this must be verified per-SKU before any Philippines deployment proceeds. The deployment wizard must surface a warning for international deployments until this is confirmed.

### Video Standards

| Region | Standard | Camera Impact |
|--------|----------|---------------|
| United States | NTSC | Default — used in all US deployments |
| Philippines | PAL (standard) but NTSC also used | OPEN QUESTION |

**Open Question #1 from Appendix F**: Does changing the Mac Mini / camera video standard from NTSC to PAL break the replay pipeline? Priority: CRITICAL.

**Open Question #2 from Appendix F**: Are EmpireTech camera firmware files region-locked? Priority: CRITICAL.

**Current default**: Mac Mini is configured with `Video Standard: NTSC` during Phase 5 (Step 50). For Philippines deployments, this setting may need to change to PAL — but impact on replay pipeline is unknown.

### Vendor Availability (Philippines)

| Vendor/Product | US Status | Philippines Status |
|----------------|-----------|-------------------|
| EmpireTech cameras | Available (Amazon, AliExpress) | OPEN QUESTION — may need local sourcing or import |
| Flic buttons | Available (flic.io ships globally) | OPEN QUESTION — shipping to Philippines unconfirmed |
| Kisi access control | Available (ships to US) | OPEN QUESTION — Kisi ships to Philippines unconfirmed |
| UniFi (Ubiquiti) | Available | Generally available internationally |
| Apple iPads / Apple TVs | Available | Available via Apple PH |
| Mac Mini | Available | Available via Apple PH |
| Brother label machine | Available | Available |
| Samsung SSD | Available | Available |

---

## Database Model

### New Enum: `deployment_region`

```sql
CREATE TYPE deployment_region AS ENUM (
  'us',          -- United States (default)
  'philippines'  -- Philippines (Asia deployment via Cosmos entity)
);
```

**Design note**: Only two values needed currently. The enum is extensible if PodPlay expands to other international markets. Adding a new region requires a migration (`ALTER TYPE deployment_region ADD VALUE 'new_region'`).

### New Enum: `video_standard`

```sql
CREATE TYPE video_standard AS ENUM (
  'ntsc',  -- 60Hz video (US default)
  'pal'    -- 50Hz video (Asia/Europe — open question for Philippines)
);
```

### New Enum: `power_standard`

```sql
CREATE TYPE power_standard AS ENUM (
  '120v_60hz',  -- US standard
  '220v_60hz'   -- Philippines (same frequency, different voltage)
);
```

### Fields Added to `projects` Table

The `projects` table gains these fields to support international context:

```sql
-- International deployment fields (append to projects table)
deployment_region         deployment_region    NOT NULL DEFAULT 'us',
video_standard            video_standard       NOT NULL DEFAULT 'ntsc',
power_standard            power_standard       NOT NULL DEFAULT '120v_60hz',
isp_provider              TEXT,                -- e.g. 'PLDT Beyond Fiber', 'Verizon Fios'
isp_provider_backup       TEXT,                -- Second ISP for autonomous/24hr venues
isp_has_static_ip         BOOLEAN              NOT NULL DEFAULT false,
isp_has_backup_static_ip  BOOLEAN              NOT NULL DEFAULT false,
cosmos_entity             BOOLEAN              NOT NULL DEFAULT false,
-- ^ true = Cosmos franchise deployment; triggers international validation warnings
```

**Source**: `analysis/source-deployment-guide.md` → "Philippines ISP Requirements" section + Appendix F.

### New Table: `deployment_regions`

Reference table with region-specific ISP requirements, warnings, and supported providers. Used to drive wizard validation and contextual warnings.

```sql
CREATE TABLE deployment_regions (
  id              TEXT PRIMARY KEY,        -- 'us', 'philippines'
  display_name    TEXT        NOT NULL,    -- 'United States', 'Philippines'
  power_standard  power_standard NOT NULL,
  video_standard  video_standard NOT NULL,

  -- ISP requirements
  requires_business_plan  BOOLEAN  NOT NULL DEFAULT false,
  requires_static_ip      BOOLEAN  NOT NULL DEFAULT false,
  requires_dual_isp       TEXT,            -- NULL = not required; otherwise: 'autonomous' = required for autonomous tier
  starlink_blocked        BOOLEAN  NOT NULL DEFAULT false,

  -- Supported ISPs (JSON array of {name, plan_name} objects)
  supported_isps          JSONB    NOT NULL DEFAULT '[]',

  -- Human-readable warnings shown in wizard
  isp_warning             TEXT,            -- Shown if isp_has_static_ip = false
  power_warning           TEXT,            -- Shown until power_standard confirmed compatible
  video_warning           TEXT,            -- Shown until video_standard confirmed

  -- Open questions (NULL = resolved)
  open_questions          JSONB    NOT NULL DEFAULT '[]',
  -- ^ Array of {id, question, category, priority, status: 'open'|'answered', resolution}

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER deployment_regions_updated_at
  BEFORE UPDATE ON deployment_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Indexes**:
```sql
-- No additional indexes needed — table has <10 rows, id is PK
```

**RLS**: No RLS needed — this is reference/seed data, read-only for all authenticated users.

```sql
ALTER TABLE deployment_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY deployment_regions_read ON deployment_regions
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE for non-admin users — managed via migrations
```

---

## Seed Data for `deployment_regions`

### United States

```sql
INSERT INTO deployment_regions (
  id, display_name, power_standard, video_standard,
  requires_business_plan, requires_static_ip, requires_dual_isp, starlink_blocked,
  supported_isps,
  isp_warning, power_warning, video_warning,
  open_questions
) VALUES (
  'us',
  'United States',
  '120v_60hz',
  'ntsc',
  false,
  false,
  'autonomous',
  true,
  '[
    {"name": "Verizon", "plan_name": "Fios Business"},
    {"name": "Optimum", "plan_name": "Business Internet"},
    {"name": "Spectrum", "plan_name": "Business Internet"},
    {"name": "Google Fiber", "plan_name": "Fiber Business"}
  ]',
  'ISP must support port 4000 forwarding or static IP with DMZ. Starlink is NOT compatible (CGNAT blocks port 4000).',
  NULL,
  NULL,
  '[]'
);
```

### Philippines

```sql
INSERT INTO deployment_regions (
  id, display_name, power_standard, video_standard,
  requires_business_plan, requires_static_ip, requires_dual_isp, starlink_blocked,
  supported_isps,
  isp_warning, power_warning, video_warning,
  open_questions
) VALUES (
  'philippines',
  'Philippines',
  '220v_60hz',
  'ntsc',
  -- NOTE: video_standard set to ntsc pending resolution of open question #1
  true,
  true,
  'autonomous',
  true,
  '[
    {"name": "PLDT", "plan_name": "PLDT Beyond Fiber (Business)"},
    {"name": "Globe", "plan_name": "Globe GFiber Biz"},
    {"name": "Converge", "plan_name": "Converge FlexiBIZ"}
  ]',
  'Philippines deployments REQUIRE a business plan with static IP. Residential plans use CGNAT which blocks port 4000. Dual ISP required for Autonomous/24hr venues — use PLDT + Converge (different backbones). Do NOT pair PLDT + Globe.',
  'WARNING: Power standard is 220V/60Hz. Verify all hardware SKUs are 220V/60Hz compatible before shipping. Check: EmpireTech cameras, Flic buttons, Mac Mini, UDM, all switches.',
  'WARNING: Video standard for Philippines is TBD. Changing Mac Mini video standard from NTSC to PAL may break the replay pipeline (open question, unresolved). Deploying as NTSC until resolved.',
  '[
    {"id": 1, "question": "PAL vs NTSC — does changing video standard break replay pipeline?", "category": "Video", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 2, "question": "Camera firmware region-locked?", "category": "Video", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 3, "question": "All hardware confirmed 220V/60Hz compatible?", "category": "Power", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 5, "question": "Fallback if port 4000 blocked by ISP?", "category": "Architecture", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 6, "question": "Deployment server accessible remotely from Philippines?", "category": "Deployment", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 7, "question": "What does deploy.py produce? Can Cosmos run own deployment server?", "category": "Deployment", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 8, "question": "Admin Dashboard — shared PodPlay instance or own Cosmos instance?", "category": "Accounts", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 12, "question": "FreeDNS — same podplaydns.com domain for Asia venues?", "category": "Accounts", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 15, "question": "Mac Mini chip (M1/M2/M4) and year?", "category": "Hardware", "priority": "HIGH", "status": "open", "resolution": null},
    {"id": 16, "question": "EmpireTech cameras available in Philippines?", "category": "Sourcing", "priority": "MEDIUM", "status": "open", "resolution": null},
    {"id": 17, "question": "Flic buttons available in Philippines?", "category": "Sourcing", "priority": "MEDIUM", "status": "open", "resolution": null},
    {"id": 18, "question": "Kisi ships to Philippines?", "category": "Sourcing", "priority": "MEDIUM", "status": "open", "resolution": null}
  ]'
);
```

**Note on ANSWERED items (not seeded as open questions — resolution baked into model)**:
- Q4: Port 4000 = V1 UDP, V2 TCP; carries replays + cloud sync → documented in `logic-replay-service-version`
- Q9: Mosyle — Cosmos needs own instance (not sub-org) → documented in `model-device-migration`
- Q10: Apple ABM — Cosmos needs own ABM; devices release from PodPlay ABM → factory reset → re-enroll → documented in `model-device-migration`
- Q11: UniFi Account — first club under PodPlay, future under Cosmos → project-level tracking field
- Q13: App binary white-labeled per facility, VPP distribution → `model-deployment-checklist` Phase 10
- Q14: LOCATION_ID in P-List routes app to backend → `model-deployment-checklist` Phase 10 step 94

---

## Wizard Validation Logic (for Wave 3)

When `deployment_region = 'philippines'`:

1. **ISP gate**: Block advancement past Stage 1 (Intake) until `isp_has_static_ip = true`. Show warning:
   > "Philippines deployments require a business ISP plan with static IP. Residential CGNAT will block port 4000. Select PLDT Beyond Fiber, Globe GFiber Biz, or Converge FlexiBIZ with static IP addon."

2. **Dual ISP gate for Autonomous**: If `tier IN ('autonomous', 'autonomous_plus')` and `isp_provider_backup IS NULL`, show non-blocking warning:
   > "Autonomous venues operating 24/7 require two ISPs from different providers. PLDT + Converge recommended. Do NOT pair PLDT + Globe (shared backbone)."

3. **Power standard warning**: On project creation for Philippines, show inline warning:
   > "WARNING: 220V/60Hz compatibility for all hardware SKUs is unconfirmed. Resolve open question #3 before ordering hardware."

4. **Video standard warning**: On project creation for Philippines, show inline warning:
   > "WARNING: PAL vs NTSC for Philippines replay pipeline is unresolved (Appendix F, Q1). Defaulting to NTSC. Verify with Stan/Patrick before final config."

5. **Vendor availability flags**: In the BOM review step (Stage 2), for Philippines projects, annotate each hardware item with availability status:
   - EmpireTech cameras: flag `sourcing_status = 'unconfirmed_philippines'`
   - Flic buttons: flag `sourcing_status = 'unconfirmed_philippines'`
   - Kisi access control: flag `sourcing_status = 'unconfirmed_philippines'`
   - UniFi, Apple devices: flag `sourcing_status = 'available'`

---

## Migration Order Update

The `deployment_regions` table must be created BEFORE `projects` (since `projects.deployment_region` references the enum, not a FK — but seed data should be inserted early):

```
Updated migration order (additions only):
1a.  CREATE TYPE deployment_region
1b.  CREATE TYPE video_standard
1c.  CREATE TYPE power_standard
-- (Existing tables in order...)
6.   projects  -- now includes deployment_region, video_standard, power_standard columns
...
22.  deployment_regions  -- reference/seed table; no foreign keys to other tables
23.  INSERT seed data for deployment_regions
```

---

## Known Gaps

| Gap | Impact | Resolution |
|-----|--------|-----------|
| PAL vs NTSC replay impact | Cannot finalize `video_standard` default for Philippines | Resolve Q1 during NJ Training (March 2–10, 2026) |
| 220V/60Hz hardware compatibility | Cannot confirm BOM for Philippines | Resolve Q3 per-SKU during NJ Training |
| EmpireTech/Flic/Kisi Philippines availability | BOM may need alternate sourcing | Resolve Q16/Q17/Q18 during NJ Training |
| deploy.py availability for Cosmos | If Cosmos cannot access Jersey City server, replay service deployment blocked | Resolve Q6/Q7 during NJ Training |
| FreeDNS domain for Asia | DDNS setup may differ | Resolve Q12 — may need separate subdomain or parallel FreeDNS account |
| Admin Dashboard sharing | If Cosmos needs own instance, provisioning process differs | Resolve Q8 — product/infra decision |
