# Analysis: model-tier-variants

**Aspect**: model-tier-variants
**Wave**: 2 — Data Model Extraction
**Date**: 2026-03-06
**Sources**: source-hardware-guide.md, source-pricing-model.md, source-mrp-usage-guide.md,
research/podplay-hardware-bom.md, final-mega-spec/data-model/schema.md (existing),
final-mega-spec/data-model/seed-data.md (existing)

---

## Overview

Three variant concerns are documented here:

1. **PBK tier** — Pickleball Kingdom custom pricing tier (hardware = Pro, pricing = custom)
2. **PingPod-specific hardware** — WiFi AP (confirmed), audio/speakers (unconfirmed), Bluetooth buttons (standard, not PingPod-specific)
3. **Front desk hardware** — Webcam, QR scanner, CC terminal (fully documented; integration clarified)

---

## 1. PBK Tier (Pickleball Kingdom)

### Definition

PBK is a **custom pricing arrangement** with Pickleball Kingdom, a large pickleball franchise operator.
The hardware package is **identical to Pro tier** (display + kiosk + replay camera + network rack per court).
The only difference is the customer-facing service fee structure: both `venue_fee` and `court_fee` are custom values
negotiated with PBK, different from standard Pro pricing ($5,000 + $2,500/court).

**Exact PBK fee values**: unknown — not available from any current source. Requires XLSX (`source-mrp-sheets`)
or direct input from Kim Lapus. Stored as `settings.pbk_venue_fee` and `settings.pbk_court_fee`, both defaulting
to `0.00`. Must be configured by ops admin before any PBK project can be correctly priced.

### Hardware Configuration

PBK uses the **same hardware as Pro tier** — 24 BOM template rows. No access control, no NVR, no surveillance cameras.
Confirmed by analysis-log entry for model-bom-templates: "pbk=24 rows" (same as Pro).

BOM template for PBK is a verbatim copy of Pro template rows with `tier = 'pbk'`. No additional hardware items
are PBK-specific.

### BOM Template Rows for PBK

Same as Pro template (tier = 'pbk'):

| Category | SKU | qty_per_venue | qty_per_court | qty_per_door | qty_per_camera |
|----------|-----|--------------|---------------|-------------|----------------|
| network_rack | NET-UDM-SE | 1 | 0 | 0 | 0 |
| network_rack | NET-SW24-POE | 1 | 0 | 0 | 0 |
| network_rack | NET-PDU | 1 | 0 | 0 | 0 |
| network_rack | NET-SFP-DAC | 1 | 0 | 0 | 0 |
| network_rack | NET-PATCH-1FT | 0 | 3 | 0 | 0 |
| network_rack | NET-PATCH-3FT | 3 | 0 | 0 | 0 |
| network_rack | NET-PATCH-PANEL | 1 | 0 | 0 | 0 |
| infrastructure | INFRA-UPS | 1 | 0 | 0 | 0 |
| infrastructure | INFRA-RACK | 1 | 0 | 0 | 0 |
| infrastructure | INFRA-RACK-SHELF | 1 | 0 | 0 | 0 |
| replay_system | REPLAY-MACMINI | 1 | 0 | 0 | 0 |
| replay_system | REPLAY-SSD-1TB | CONDITIONAL | — | — | — |
| replay_system | REPLAY-SSD-2TB | CONDITIONAL | — | — | — |
| replay_system | REPLAY-SSD-4TB | CONDITIONAL | — | — | — |
| replay_system | REPLAY-CAM-WHITE | 0 | 1 | 0 | 0 |
| replay_system | REPLAY-JB-WHITE | 0 | 1 | 0 | 0 |
| replay_system | REPLAY-BTN | 0 | 2 | 0 | 0 |
| replay_system | REPLAY-HW-KIT | 1 | 0 | 0 | 0 |
| displays | DISP-TV-65 | 0 | 1 | 0 | 0 |
| displays | DISP-TV-MOUNT | 0 | 1 | 0 | 0 |
| displays | DISP-ATV | 0 | 1 | 0 | 0 |
| displays | DISP-ATV-MOUNT | 0 | 1 | 0 | 0 |
| displays | DISP-HDMI | 0 | 1 | 0 | 0 |
| displays | DISP-IPAD | 0 | 1 | 0 | 0 |
| displays | DISP-IPAD-POE | 0 | 1 | 0 | 0 |
| displays | DISP-IPAD-CASE | 0 | 1 | 0 | 0 |
| signage | SIGN-REPLAY | 0 | 2 | 0 | 0 |

SSD, switch, and NVR sizing rules apply identically to PBK as to Pro (court-count-driven).
Front desk items (`DESK-*`) apply only when `project.has_front_desk = true`, same as all other tiers.

### Pricing Calculation for PBK

```typescript
function getServiceFee(project: Project, settings: Settings): number {
  if (project.tier === 'pro') {
    return settings.pro_venue_fee + project.court_count * settings.pro_court_fee;
    // Default: $5,000 + courts × $2,500
  }
  if (project.tier === 'autonomous' || project.tier === 'autonomous_plus') {
    return settings.autonomous_venue_fee + project.court_count * settings.autonomous_court_fee;
    // Default: $7,500 + courts × $2,500
  }
  if (project.tier === 'pbk') {
    return settings.pbk_venue_fee + project.court_count * settings.pbk_court_fee;
    // Default: $0 + courts × $0 (must be configured before use)
  }
  return 0;
}
```

### Checklist Template for PBK

PBK follows the **same checklist as Pro tier**. Access control phases (Kisi) do NOT apply to PBK.
Surveillance phases do NOT apply to PBK. NVR phases do NOT apply to PBK.

The `applicable_tiers` column in `deployment_checklist_templates` correctly excludes PBK from
access control and surveillance steps. Steps scoped to `['autonomous', 'autonomous_plus']` do not
show for PBK projects.

**Correction to schema.md comment** (line 1134):
The example comment `-- Example: Kisi steps only apply to ['autonomous', 'autonomous_plus', 'pbk']`
is WRONG. PBK has no access control. The correct example is `['autonomous', 'autonomous_plus']`.
This has been corrected in schema.md.

### UI Treatment for PBK

**Intake form**: PBK appears as a selectable tier option in the "Service Tier" dropdown.
Label: `"PBK (Pickleball Kingdom)"`. Selecting PBK shows the same fields as Pro
(no door_count, no security_camera_count fields — those are hidden for PBK).

**Admin warning**: If `settings.pbk_venue_fee === 0 && settings.pbk_court_fee === 0`,
the wizard shows a yellow warning banner on the cost analysis step:
> "PBK pricing has not been configured. Go to Settings → Pricing to enter the Pickleball Kingdom
> venue fee and per-court fee before finalizing this project's pricing."

This warning does NOT block project creation — it only blocks invoice generation (Stage 4).

### Database Model Impact

No new tables needed for PBK. All PBK-specific behavior is handled by:
- `service_tier.pbk` enum value (already defined)
- `settings.pbk_venue_fee` and `settings.pbk_court_fee` (already in schema, default 0.00)
- `bom_templates` rows with `tier = 'pbk'` (same rows as Pro, separate tier value)
- Fee calculation in service layer (getServiceFee function above)

---

## 2. PingPod-Specific Hardware

### Confirmed: UniFi U6-Plus WiFi Access Point

**Trigger**: `project.has_pingpod_wifi = true`

**Hardware item**:
| SKU | Name | Model | Vendor | qty_per_venue |
|-----|------|-------|--------|--------------|
| PING-WIFI-AP | UniFi WiFi 6 Access Point | U6-Plus | UniFi | 1 |

**Source**: `research/podplay-hardware-bom.md` section "PingPod Specific": `UniFi U6-Plus | UniFi | Wi-Fi access point for PingPods`

**Why PingPod venues need WiFi AP**: PingPod venues (table tennis / indoor sports with PingPod branding)
require an in-venue WiFi network for guest/player connectivity. Pickleball-only venues typically rely
on venue-provided WiFi and do not need PodPlay to supply a WiFi AP. The distinction is operational:
PingPod venues want PodPlay to manage the full network including WiFi; pickleball clubs typically manage
their own guest WiFi.

**BOM handling**: When `has_pingpod_wifi = true`, the `addPingPodItems()` function in the BOM generator
inserts one `PING-WIFI-AP` row into `project_bom_items` with `qty = 1`. This is independent of tier and
court count.

### Unconfirmed: Audio / Speakers

**Claim**: The frontier aspect description mentions "PingPod-specific hardware (audio, speakers, Bluetooth)"
as items to document.

**Evidence from sources**: NO audio or speaker hardware appears in any available source:
- `research/podplay-hardware-bom.md` — no audio/speaker items listed
- `docs/podplay-hardware-installation-guide.md` — no speaker hardware listed
- `analysis/source-deployment-guide.md` — camera audio settings (mic input on EmpireTech camera for
  video recording), but no external speakers
- `research/podplay-config-guide-v1.md` — no speaker hardware mentioned

**Assessment**: The EmpireTech IPC-T54IR-ZE replay camera has an audio input (Mic type, G.711Mu encoding,
8000 Hz sample rate, Noise Filter On, Microphone Volume 50) configured during Phase 6 (Camera Setup).
This is built-in camera microphone input for video recording — NOT external speakers or a separate
audio system.

**No audio hardware category or BOM items should be added** based on current sources.
The frontier description may have been speculative. If PingPod venues require a speaker system
(e.g., for court announcements or background music), this would require source confirmation.

**Flagged gap**: If the XLSX contains an "Audio" or "Speaker" hardware category, add items to
`hardware_catalog` with `bom_category = 'pingpod_specific'` and create a `has_pingpod_audio` flag
on the projects table. Until confirmed, no action.

### Bluetooth Buttons (Flic) — Standard, Not PingPod-Specific

Flic Score Buttons (`REPLAY-BTN`) are **standard across all tiers** (Pro, Autonomous, Autonomous+, PBK).
Two per court, pre-paired at factory to the court's iPad. Labeled "Court N Left" / "Court N Right".

Actions:
- Single press: Score point
- Double press: Undo score
- Long press: Request instant replay

The frontier description listed "Bluetooth" under PingPod-specific. This is incorrect — Flic buttons
are universal and appear in all tier BOM templates. The `REPLAY-BTN` qty_per_court = 2 for all tiers.

Troubleshooting: If button fails to pair:
1. Exit Guided Access / App Lock mode (return to home screen)
2. If still failing: factory reset the button per manufacturer manual

This is documented as a troubleshooting pair in `troubleshooting_tips` table (from Appendix A).

### Black vs. White Hardware Variants

PingPod venues use **black** hardware variants; pickleball clubs use **white**:

| Category | White (Pickleball clubs) | Black (PingPod venues) |
|----------|--------------------------|------------------------|
| Replay camera | REPLAY-CAM-WHITE (IPC-T54IR-ZE White) | REPLAY-CAM-BLACK (IPC-T54IR-ZE Black) |
| Replay camera junction box | REPLAY-JB-WHITE (PFA130-E White) | REPLAY-JB-BLACK (PFA130-E Black) |
| Security camera | SURV-CAM-G5-WHITE (G5 Turret Ultra White) | SURV-CAM-G5-BLACK (G5 Turret Ultra Black) |
| Security camera junction box | SURV-JB-WHITE (UACC-Camera-CJB-White) | SURV-JB-BLACK (UACC-Camera-CJB-Black) |
| Dome camera | SURV-CAM-DOME (G5 Dome) | SURV-CAM-DOME-BLK (G5 Dome Ultra) |

**Color selection mechanism**: No separate tier or flag controls this — it is handled by the ops person
selecting the appropriate BOM items during procurement review (Stage 2). The BOM template defaults to
white variants. If `has_pingpod_wifi = true`, the UI can suggest swapping white items to black equivalents
via a warning message in the BOM review step:
> "This is a PingPod venue. Consider switching camera variants to black (REPLAY-CAM-BLACK, SURV-CAM-G5-BLACK)."

This is a UI hint only — the ops person makes the final call. No automated swap.

### `has_pingpod_wifi` Flag

Defined on `projects` table:
```sql
has_pingpod_wifi  BOOLEAN  NOT NULL DEFAULT false
```

- `true` triggers `PING-WIFI-AP` BOM item (qty 1)
- `true` triggers black hardware variant suggestion in BOM review
- Appears in intake form Step 3 (Project Parameters) as a checkbox: "PingPod venue (requires WiFi AP)"
- Independent of tier: any tier can be a PingPod venue (though most PingPod venues are Pro tier)

---

## 3. Front Desk Hardware

### Item Catalog

Three items in `bom_category = 'front_desk'`:

| SKU | Name | Model | Vendor | Unit Cost | Ordered Via |
|-----|------|-------|--------|-----------|-------------|
| DESK-CC-TERMINAL | BBPOS WisePOS E CC Terminal | BBPOS WisePOS E | Square / Stripe | unknown | Stripe dashboard (NOT via PO) |
| DESK-QR-SCANNER | 2D QR Barcode Scanner | Generic 2D QR Scanner | Amazon | unknown | Standard PO |
| FD-WEBCAM | Anker PowerConf C200 2K Webcam | PowerConf C200 | Amazon | $46.00 | Standard PO |

**Note on CC Terminal procurement**: The BBPOS WisePOS E is ordered through Stripe's hardware dashboard,
NOT through PodPlay's standard Amazon/Ingram PO flow. It is tracked separately in the `cc_terminals` table.
It appears in the BOM for cost tracking and invoicing purposes only.

**Admin PIN**: `07139` — stored in `settings.cc_terminal_pin`. Displayed during Phase 15 (Handoff & Training)
when configuring the terminal on-site.

**Computer**: The hardware guide notes "NOT included — any Windows or Mac, desktop recommended."
No SKU exists for a computer in the hardware catalog. PodPlay does not supply or track the front desk computer.

### Trigger

`project.has_front_desk = true` (set during intake form, Step 3).

When set, the system automatically adds the three front desk BOM items AND creates a `cc_terminals` row
upon entry into Stage 2 (Procurement):

```typescript
async function ensureFrontDeskRecords(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project.has_front_desk) return;

  // Add DESK-* BOM items to project_bom_items (qty = 1 each)
  await ensureBomItem(projectId, 'DESK-CC-TERMINAL', 1);
  await ensureBomItem(projectId, 'DESK-QR-SCANNER', 1);
  await ensureBomItem(projectId, 'FD-WEBCAM', 1);

  // Create cc_terminals tracking row if not already present
  const existing = await supabase
    .from('cc_terminals')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!existing.data) {
    await supabase.from('cc_terminals').insert({
      project_id: projectId,
      qty: 1,
      status: 'not_ordered',
    });
  }
}
```

### cc_terminals Table (existing — clarified)

Already defined in schema.md. Key points:

- One row per project (not per terminal)
- `qty`: always 1 for standard venues; edge case: 2 for very large front desks (rare)
- Status progression: `not_ordered → ordered → delivered → installed`
- `cost_per_unit × qty` feeds into Stage 4 P&L review as a "Front Desk" line item
- Admin PIN `07139` is surfaced in Phase 15 checklist step, not stored on this table

### Applicable Tiers

Front desk equipment applies to **any tier** when `has_front_desk = true`. There is no tier restriction.
Typical use: pickleball clubs with a staffed front desk. Less common for Autonomous venues (those tend to
be unmanned, card-only entry).

---

## 4. Data Model Changes Required

### Schema Fix (schema.md)

**Fix comment on line 1134** — incorrect example claiming PBK uses Kisi steps:

```sql
-- Old (wrong):
-- Example: Kisi steps only apply to ['autonomous', 'autonomous_plus', 'pbk']

-- Correct:
-- Example: Kisi steps only apply to ['autonomous', 'autonomous_plus']
-- Note: PBK tier has no access control; it follows Pro checklist
```

No new tables required. No new enum values required. No new columns required.

All tier variant behavior is fully covered by existing schema as documented above.

---

## 5. Known Gaps

| Gap | Impact | Resolution |
|-----|--------|-----------|
| PBK venue fee and per-court fee exact values | PBK projects priced at $0 until manually configured | Requires XLSX or Kim Lapus direct input |
| PingPod audio/speaker hardware | If audio system exists, no BOM items spec'd for it | Requires XLSX or on-site confirmation |
| DESK-CC-TERMINAL unit cost | CC terminal cost unknown | Requires Stripe pricing or XLSX |
| DESK-QR-SCANNER unit cost | QR scanner cost unknown | Requires Amazon listing or XLSX |
| Whether PBK has distinct hardware vs Pro | Assumed identical; may differ | Requires XLSX PBK BOM tab |
