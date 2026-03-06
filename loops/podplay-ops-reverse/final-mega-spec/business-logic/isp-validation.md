# Business Logic: ISP Validation

**Aspect**: logic-isp-validation
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**Sources**:
- `analysis/source-deployment-guide.md` — Phase 0 Steps 4–6, Phase 5 Steps 46–47, Appendix C (Backup Internet section)
- `analysis/source-mrp-usage-guide.md` — Section 1 ISP Router Configuration, ISP Speed Table
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `projects` table (`isp_type`, `court_count`, `is_autonomous`)

---

## Overview

ISP validation runs at two points in the wizard:

1. **Stage 1 Intake (Phase 0)** — when the ops person fills in ISP details during customer onboarding.
   Immediately flags incompatible ISP types and surfaces speed requirements based on court count.

2. **Stage 3 Deployment, Phase 5** — when configuring the ISP router on-site.
   Shows the priority-ordered config method checklist and repeats any unresolved warnings.

Validation is **advisory** (warnings, not hard blocks) except for Starlink, which shows a hard error
banner. The ops person can proceed with a warning but the warning text is stored in `projects.internal_notes`.

---

## 1. Starlink Incompatibility — Hard Error

**Trigger**: `project.isp_type === 'starlink'`

**Rule**: Starlink uses Carrier-Grade NAT (CGNAT) which blocks all inbound connections.
Port 4000, which carries all replay service communication, cannot be forwarded through CGNAT.
The PodPlay system is fundamentally incompatible with Starlink.

**UI behavior**:
- Show a red error banner in Stage 1 intake (ISP field) and in Stage 3 Phase 5 header
- Banner text: "Starlink is NOT compatible with PodPlay. CGNAT blocks port 4000 which is required for all replay service communication. The venue must use a different ISP (fiber, cable, or dedicated circuit)."
- The ISP field must be changed to a different value before the form can be submitted.
- This is the only hard block in ISP validation — all other checks are soft warnings.

**Source**: Deployment Guide Step 4: "PodPlay systems are NOT compatible with Starlink (CGNAT blocks port 4000)"

---

## 2. ISP Type Enum

```typescript
type IspType =
  | 'fiber'        // Symmetrical fiber — preferred
  | 'cable'        // Cable (asymmetric) — acceptable
  | 'dedicated'    // Dedicated circuit (symmetrical) — acceptable
  | 'fiveg'        // 5G fixed wireless — warn, not recommended
  | 'starlink'     // Starlink — hard error
  | 'other'        // Other — warn, prompt for details
```

**Preference order displayed in UI**: fiber > dedicated > cable > 5G > other > starlink (blocked)

**Warning for `fiveg` and `other`**:
"5G / unknown ISP types may use CGNAT which can block port 4000. Confirm with the ISP that port forwarding
or a static IP is available before proceeding."

---

## 3. Minimum Internet Speed Requirements by Court Count

Speed requirements apply at intake time. The system computes the **required tier** from `court_count`,
then compares against the entered upload/download speeds if the ops person fills them in.

### Speed Requirement Table

| Court Count | Fiber (symmetric) | Cable (upload minimum) | Dedicated (symmetric) |
|-------------|-------------------|------------------------|-----------------------|
| 1–4         | 50/100 Mbps       | 60 Mbps upload         | 30/30 Mbps            |
| 5–11        | 150/150 Mbps      | Highest possible upload| 50/50 Mbps            |
| 12–19       | 200/200 Mbps      | Highest possible upload| 50/50 Mbps            |
| 20–24       | 300/300 Mbps      | Highest possible upload| 100/100 Mbps          |
| 25+         | 400/400 Mbps      | Highest possible upload| 150/150 Mbps          |

**Source**: Deployment Guide Step 5 (exact values); Hardware Installation Guide ISP Speed Table (confirms same values for 1–30 courts)

### Speed Requirement Lookup Function

```typescript
interface IspSpeedRequirement {
  courtRange: string;           // e.g. "1–4"
  fiberMinDown: number;         // Mbps
  fiberMinUp: number;           // Mbps
  cableMinUp: number | null;    // null = "highest possible"
  dedicatedMinDown: number;     // Mbps
  dedicatedMinUp: number;       // Mbps
}

const ISP_SPEED_TABLE: IspSpeedRequirement[] = [
  { courtRange: '1–4',   fiberMinDown: 100, fiberMinUp: 50,  cableMinUp: 60,   dedicatedMinDown: 30,  dedicatedMinUp: 30  },
  { courtRange: '5–11',  fiberMinDown: 150, fiberMinUp: 150, cableMinUp: null, dedicatedMinDown: 50,  dedicatedMinUp: 50  },
  { courtRange: '12–19', fiberMinDown: 200, fiberMinUp: 200, cableMinUp: null, dedicatedMinDown: 50,  dedicatedMinUp: 50  },
  { courtRange: '20–24', fiberMinDown: 300, fiberMinUp: 300, cableMinUp: null, dedicatedMinDown: 100, dedicatedMinUp: 100 },
  { courtRange: '25+',   fiberMinDown: 400, fiberMinUp: 400, cableMinUp: null, dedicatedMinDown: 150, dedicatedMinUp: 150 },
];

function getIspSpeedRequirement(courtCount: number): IspSpeedRequirement {
  if (courtCount <= 4)  return ISP_SPEED_TABLE[0];
  if (courtCount <= 11) return ISP_SPEED_TABLE[1];
  if (courtCount <= 19) return ISP_SPEED_TABLE[2];
  if (courtCount <= 24) return ISP_SPEED_TABLE[3];
  return ISP_SPEED_TABLE[4];
}
```

### Speed Warning Logic

Speed fields in the Stage 1 intake form are **optional**. If entered, validation runs on blur:

```typescript
function validateIspSpeed(
  courtCount: number,
  ispType: IspType,
  uploadMbps: number | null,
  downloadMbps: number | null
): string | null {
  const req = getIspSpeedRequirement(courtCount);

  if (ispType === 'fiber') {
    if (uploadMbps !== null && uploadMbps < req.fiberMinUp) {
      return `Upload speed ${uploadMbps} Mbps is below the ${req.fiberMinUp} Mbps minimum for fiber with ${courtCount} courts.`;
    }
    if (downloadMbps !== null && downloadMbps < req.fiberMinDown) {
      return `Download speed ${downloadMbps} Mbps is below the ${req.fiberMinDown} Mbps minimum for fiber with ${courtCount} courts.`;
    }
  }

  if (ispType === 'cable') {
    if (req.cableMinUp !== null && uploadMbps !== null && uploadMbps < req.cableMinUp) {
      return `Upload speed ${uploadMbps} Mbps is below the ${req.cableMinUp} Mbps minimum for cable with ${courtCount} courts.`;
    }
    if (req.cableMinUp === null) {
      // "highest possible" — show informational note, not error
      return null;
    }
  }

  if (ispType === 'dedicated') {
    if (uploadMbps !== null && uploadMbps < req.dedicatedMinUp) {
      return `Upload speed ${uploadMbps} Mbps is below the ${req.dedicatedMinUp} Mbps symmetric minimum for a dedicated circuit with ${courtCount} courts.`;
    }
  }

  return null;
}
```

**UI**: Speed warning appears as a yellow inline warning below the speed fields, not a blocking error.
The ops person can proceed.

---

## 4. ISP Configuration Method — Priority Order

Displayed in Stage 3 Phase 5 as a radio selection with explanatory text. The chosen method
is stored in `projects.isp_config_method`.

### Enum

```typescript
type IspConfigMethod =
  | 'static_ip'     // 1st choice — order static IP from ISP
  | 'dmz'           // 2nd choice — put UDM in ISP router DMZ
  | 'port_forward'  // 3rd choice (last resort) — forward port 4000 through ISP router
```

### Priority Display in UI

| Priority | Method | Description | Notes |
|----------|--------|-------------|-------|
| 1 (Best) | Static IP | Order static IP from ISP (~$10–20/mo). In UniFi: Settings → Internet → WAN1 → Advanced → Manual → enter static IP details. | Most reliable. Recommended for all new deployments. |
| 2 | DMZ | Place the UDM's WAN IP into the ISP router's DMZ. All inbound traffic forwarded to UDM. | Works when ISP won't provide static IP but allows DMZ config. |
| 3 (Last resort) | Port Forward | Forward port 4000 TCP/UDP from ISP router to UDM's IP. | ISP-dependent — not all ISP routers support this. May not work with CGNAT. |

**Source**: Deployment Guide Step 46, source-mrp-usage-guide ISP Router Configuration section.

### Regardless of Method: Always Required

After the ISP-level config, a second port forward is always required on the UDM itself:
- Forward port 4000 TCP/UDP → 192.168.32.100 (Mac Mini fixed IP on REPLAY VLAN)
- This step is Phase 4 Step 45 in the deployment checklist (not Phase 5)

**Warning text for port_forward method**:
"Port forwarding through the ISP router is the last resort. Confirm with the ISP that their router
supports port forwarding and does not use CGNAT. If CGNAT is in use, port forwarding will not work
and you must request a static IP or use DMZ."

---

## 5. Static IP Requirement — Philippines Venues

**Trigger**: `project.country === 'PH'` (Philippines)

**Rule**: Philippines residential ISPs use CGNAT. All Philippines deployments **must** use a
business plan with a static IP — this is a hard requirement, not advisory.

**Validated ISPs for Philippines**:

| ISP | Plan Name | Notes |
|-----|-----------|-------|
| PLDT | Beyond Fiber Business | Must be business tier |
| Globe | GFiber Biz | Must be business tier |
| Converge | FlexiBIZ | Must be business tier |

**Warning shown when `country === 'PH'` and `isp_type !== 'fiber'` or `isp_config_method !== 'static_ip'`**:
"Philippines deployments require a business plan with a dedicated static IP. Residential plans use
CGNAT which blocks all inbound connections. Supported ISPs: PLDT Beyond Fiber, Globe GFiber Biz,
Converge FlexiBIZ. Do NOT use residential plans."

**Source**: Deployment Guide Phase 5, Step 47: "Philippines: MUST have business plan + static IP.
Residential plans use CGNAT which blocks all incoming connections."

---

## 6. Dual ISP / Backup Internet Requirement — Autonomous 24/7 Venues

**Trigger**: `project.tier IN ('autonomous', 'autonomous_plus')` AND `project.is_24_7 === true`

**Rule**: Autonomous venues that operate 24/7 must have two separate ISPs from different providers.
The two ISPs must NOT share the same backbone — if one goes down due to a regional outage, the
other must remain up.

### Dual ISP Validation

```typescript
interface DualIspWarning {
  type: 'missing_backup' | 'same_backbone';
  message: string;
}

function validateDualIsp(project: Project): DualIspWarning | null {
  if (!['autonomous', 'autonomous_plus'].includes(project.tier)) return null;
  if (!project.is_24_7) return null;

  if (!project.backup_isp_provider) {
    return {
      type: 'missing_backup',
      message: 'Autonomous 24/7 venues require a backup ISP from a different provider. ' +
        'Configure secondary WAN on the UDM (WAN2 port). Example pairs: ' +
        'Verizon + Spectrum (US), PLDT + Converge (Philippines).',
    };
  }

  if (project.primary_isp_provider === project.backup_isp_provider) {
    return {
      type: 'same_backbone',
      message: `Primary and backup ISP are the same provider (${project.primary_isp_provider}). ` +
        'Use two ISPs from different backbone providers — if one goes down, the other may too if ' +
        'they share infrastructure.',
    };
  }

  return null;
}
```

### Backbone Risk Examples

| Country | Safe Pair (different backbone) | Risky Pair (same backbone) |
|---------|-------------------------------|---------------------------|
| US      | Verizon + Spectrum            | Spectrum + Charter (same company) |
| PH      | PLDT + Converge               | PLDT + Globe (both may use same cable landing) |

**UDM WAN Failover Configuration**:
- Primary WAN: WAN1 port on UDM
- Backup WAN: WAN2 port on UDM (UDM-SE and UDM-Pro support dual WAN)
- Configure in UniFi: Settings → Internet → WAN2 → set failover mode

**Source**: Deployment Guide Appendix C: "Autonomous venues operating 24/7 must have two ISPs from
different providers, each with a static IP... Do NOT use two ISPs that share the same backbone."

---

## 7. Database Fields for ISP Validation

These fields are stored on the `projects` table (appended to schema if not already present):

```sql
-- ISP fields (add to projects table)
isp_type           TEXT CHECK (isp_type IN ('fiber', 'cable', 'dedicated', 'fiveg', 'starlink', 'other')),
isp_config_method  TEXT CHECK (isp_config_method IN ('static_ip', 'dmz', 'port_forward')),
isp_upload_mbps    INTEGER,          -- optional, entered during intake
isp_download_mbps  INTEGER,          -- optional, entered during intake
primary_isp_provider TEXT,           -- ISP company name (free text)
backup_isp_provider  TEXT,           -- second ISP for autonomous 24/7 venues (nullable)
is_24_7            BOOLEAN NOT NULL DEFAULT false,
country            TEXT NOT NULL DEFAULT 'US',  -- 'US' or 'PH' or ISO 3166-1 alpha-2
```

---

## 8. Validation Execution Points

### Point 1: Stage 1 Intake — ISP Step (Step 4 of 6)

Fields shown:
- ISP Type (radio: fiber / cable / dedicated / 5G / other / Starlink)
- Upload speed (optional, number, Mbps)
- Download speed (optional, number, Mbps)
- ISP Provider name (text, required for PH venues)
- Country (select, US default)
- Is 24/7 operation? (checkbox, shown only for autonomous/autonomous+ tiers)
- Backup ISP provider (text, shown when is_24_7 + autonomous)

Validation fires:
1. On `isp_type` change: check Starlink (hard error), 5G/other (soft warning)
2. On speed blur: `validateIspSpeed()` → soft warning
3. On `country === 'PH'`: show Philippines business plan requirement
4. On `is_24_7 + tier` combination: show dual ISP requirement
5. On form submit: all validations re-run; Starlink blocks submission

### Point 2: Stage 3 Deployment — Phase 5 (ISP Router Configuration)

Shown inline at the top of Phase 5 before the step checklist:
- ISP type badge (color-coded: green=fiber, yellow=cable/dedicated, red=starlink)
- Required speed for this court count (from speed table)
- Config method selection (radio, pre-populated from intake or defaulting to static_ip)
- Philippines warning banner (if country === 'PH')
- Dual ISP reminder (if autonomous + is_24_7, with WAN2 config note)

The Phase 5 checklist steps are:
1. Configure ISP router using selected method (static IP, DMZ, or port forward)
2. Verify port 4000 is reachable from cellular network
3. Confirm DDNS resolves correctly (`http://CUSTOMERNAME.podplaydns.com:4000/health`)

---

## 9. Supported US ISPs (Informational)

Displayed as autocomplete suggestions in the ISP Provider name field for US venues:

- Verizon Fios
- Optimum
- Spectrum
- Google Fiber
- AT&T Fiber
- Comcast / Xfinity
- Cox
- Frontier

**Source**: Deployment Guide Phase 5 Step 47: "Verizon, Optimum, Spectrum, Google Fiber" listed as confirmed working ISPs.

---

## 10. Complete Validation Summary

| Check | Trigger | Type | Action |
|-------|---------|------|--------|
| Starlink blocked | `isp_type === 'starlink'` | Hard error | Block form submission; red banner |
| 5G / other ISP | `isp_type IN ('fiveg', 'other')` | Warning | Yellow banner; CGNAT risk note |
| Upload speed too low | `uploadMbps < req.fiberMinUp` (or cable/dedicated) | Warning | Inline field warning |
| Download speed too low | `downloadMbps < req.fiberMinDown` (or dedicated) | Warning | Inline field warning |
| Philippines non-business | `country === 'PH' AND (isp_type !== 'fiber' OR method !== 'static_ip')` | Warning | Yellow banner; business plan required |
| Dual ISP missing | `is_24_7 AND tier in (autonomous, autonomous_plus) AND !backup_isp_provider` | Warning | Yellow banner; WAN2 config note |
| Same backbone | `primary_isp_provider === backup_isp_provider` | Warning | Yellow banner; backbone risk note |
| Port forward last resort | `isp_config_method === 'port_forward'` | Warning | Yellow banner; CGNAT caveat |

---

## 11. Service Layer

File: `src/services/ispValidation.ts`

```typescript
// Pure validation functions (no Supabase calls)

export function validateIspType(ispType: IspType): IspValidationError | null
export function validateIspSpeed(courtCount: number, ispType: IspType, uploadMbps: number | null, downloadMbps: number | null): string | null
export function getIspSpeedRequirement(courtCount: number): IspSpeedRequirement
export function validatePhilippinesIsp(country: string, ispType: IspType, ispConfigMethod: IspConfigMethod | null): string | null
export function validateDualIsp(tier: Tier, is24_7: boolean, primaryProvider: string | null, backupProvider: string | null): DualIspWarning | null

// Aggregate: run all checks, return list of warnings + errors
export function runAllIspValidations(project: Partial<Project>): IspValidationResult

interface IspValidationResult {
  hasHardError: boolean;    // true if Starlink — blocks submission
  errors: string[];         // hard errors (Starlink only for now)
  warnings: string[];       // soft warnings (speed, backup ISP, PH, port forward)
}
```

No Supabase calls in this service — all validation is pure client-side logic against project fields.
Project ISP fields are saved to Supabase via the standard `updateProject()` call in
`src/services/projects.ts` when the intake form is submitted.
