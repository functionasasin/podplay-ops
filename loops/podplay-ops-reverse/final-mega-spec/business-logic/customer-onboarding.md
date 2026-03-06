# Business Logic: Customer Onboarding

**Aspect**: logic-customer-onboarding
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: "Form Responses" tab (intake fields), "CUSTOMER MASTER" tab (lifecycle fields), per-customer "Status" tabs (deployment checklist), "COST ANALYSIS" sheet, BOM templates
**Design Reference**: `final-mega-spec/data-model/schema.md` — `projects`, `project_bom_items`, `deployment_checklist_items`, `replay_signs`, `cc_terminals` tables

---

## Overview

Customer onboarding is the complete workflow from first customer contact through project creation, BOM generation, checklist seeding, and SOW delivery. In the MRP, Andy Korzeniacki fills in the "Form Responses" tab which triggers (manually or via Apps Script) row creation in "CUSTOMER MASTER", a new per-customer "Status" tab, and a cost analysis sheet. The webapp replaces this with a 6-step wizard (Stage 1) that performs all of these operations atomically on submission.

**Trigger**: Ops user clicks "New Project" from the dashboard.
**End state**: Project exists in DB with status=`intake`, BOM auto-generated, deployment checklist seeded, replay sign record created, CC terminal record created (if has_front_desk), revenue_stage=`proposal`.

---

## Step 1: Customer & Venue Information

**MRP Source**: "Form Responses" tab, columns 1–7

### Form Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `customer_name` | text | required, 1–200 chars, trimmed | Business/club name. e.g., "Telepark Pickleball Club" |
| `venue_name` | text | required, 1–200 chars, trimmed | Location name. Default: same as customer_name for single-venue clients. e.g., "Telepark - Jersey City" |
| `venue_address_line1` | text | optional | Street address |
| `venue_address_line2` | text | optional | Suite, unit, floor, or building designation |
| `venue_city` | text | required | City name |
| `venue_state` | text | required | State/province code (e.g., "NJ", "CA") |
| `venue_zip` | text | optional | Postal code |
| `venue_country` | enum: 'US' \| 'PH' | required, default 'US' | 'PH' triggers Philippines ISP/power validation rules |
| `contact_name` | text | required, 1–200 chars | Primary contact at venue (owner or ops manager) |
| `contact_email` | email | required, valid email format | Used for SOW delivery and correspondence |
| `contact_phone` | text | optional | e.g., "+1 (555) 123-4567" — no format enforcement |

### Validation Rules

1. `customer_name` must not duplicate an existing project's `customer_name` + `venue_name` combination. If a match exists, show: "A project already exists for this customer/venue. Open existing project instead?" (warning, not blocking — operator may be creating a second venue for the same customer).
2. `venue_country = 'PH'` shows a banner: "Philippines deployment — additional ISP requirements apply. See Step 3."
3. `venue_name` is pre-filled with the value of `customer_name` and synced as the operator types, unless manually overridden.

---

## Step 2: Service Configuration

**MRP Source**: "Form Responses" tab, columns 8–16

### Form Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `tier` | enum: pro \| autonomous \| autonomous_plus \| pbk | required | Drives BOM template selection and base pricing |
| `court_count` | integer | required, 1–50 | Number of pickleball courts |
| `door_count` | integer | required for autonomous/autonomous_plus, default 0, min 0 | Number of access-controlled doors; drives Kisi reader qty |
| `security_camera_count` | integer | required for autonomous_plus, default 0, min 0 | Number of UniFi G5 surveillance cameras; drives NVR sizing |
| `has_nvr` | boolean | auto-derived | true when tier = 'autonomous_plus'; stored explicitly |
| `has_pingpod_wifi` | boolean | default false | True for PingPod venues needing UniFi U6-Plus WiFi AP |
| `has_front_desk` | boolean | default false | True if venue needs CC terminal + QR scanner + webcam |
| `replay_service_version` | enum: v1 \| v2 | default 'v1' | V2 expected ~April 2026; changes Phase 9 checklist steps |

### Derived Values (computed client-side, not user-entered)

```typescript
// replay_sign_count — computed, stored as GENERATED ALWAYS in DB
replay_sign_count = court_count * 2

// has_nvr — derived from tier
has_nvr = tier === 'autonomous_plus'
```

### Conditional Field Display Rules

| Condition | Fields Shown |
|-----------|-------------|
| tier = 'pro' | court_count only; door_count hidden (0), security_camera_count hidden (0) |
| tier = 'autonomous' | court_count + door_count; security_camera_count hidden (0), has_nvr hidden |
| tier = 'autonomous_plus' | court_count + door_count + security_camera_count |
| tier = 'pbk' | court_count only (same as 'pro' — PBK is a pricing variant, not a capability variant) |
| always | has_pingpod_wifi, has_front_desk checkboxes |

### Validation Rules

1. `door_count >= 1` required when tier is 'autonomous' or 'autonomous_plus'. Show error: "Autonomous tier requires at least 1 access-controlled door."
2. `security_camera_count >= 1` required when tier is 'autonomous_plus'. Show error: "Autonomous+ tier requires at least 1 security camera."
3. `door_count > 0` when tier is 'pro' or 'pbk': show warning "Doors only apply to Autonomous/Autonomous+ tiers. Setting ignored." and force door_count to 0 on submission.
4. `court_count > 24`: show info banner "Large venue: 48-port switch and 7-bay NVR (if Autonomous+) will be selected automatically."

### Summary Preview (shown at bottom of Step 2)

```
Tier: Autonomous+
Courts: 8 | Doors: 4 | Security Cameras: 12
Replay Signs: 16 (auto)
Front Desk Equipment: Yes | PingPod WiFi: No
```

---

## Step 3: ISP & Networking

**MRP Source**: "Form Responses" tab, columns 17–22

### Form Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `isp_provider` | text | optional | e.g., "Verizon", "Optimum", "Spectrum", "Google Fiber", "PLDT", "Globe", "Converge" |
| `isp_type` | enum: fiber \| cable \| dedicated \| other | optional | Connection type |
| `has_static_ip` | boolean | default false | Whether ISP provides static IP ($10–$20/month extra) |
| `has_backup_isp` | boolean | default false | Second ISP for 24/7 autonomous venues |
| `internet_download_mbps` | integer | optional, min 0 | Actual or committed download speed |
| `internet_upload_mbps` | integer | optional, min 0 | Actual or committed upload speed — UPLOAD is the constraint |
| `starlink_warning_acknowledged` | boolean | default false | Must be true before proceed if provider = 'Starlink' |

### ISP Validation Logic

Run on field change AND on step submission.

#### Starlink Detection (BLOCKING ERROR)

```typescript
function validateISP(isp_provider: string, isp_type: string, starlink_acknowledged: boolean): ValidationResult {
  const isStarlink = isp_provider?.toLowerCase().includes('starlink')

  if (isStarlink && !starlink_acknowledged) {
    return {
      severity: 'error',
      field: 'isp_provider',
      message: 'Starlink uses CGNAT which blocks port 4000 — NOT compatible with PodPlay replay service. ' +
               'The venue MUST use a different ISP. Check this box only if the customer understands and accepts ' +
               'that replay will not function.',
      requiresAcknowledgement: true
    }
  }
  return { severity: 'ok' }
}
```

#### Speed Adequacy Validation (WARNING, not blocking)

```typescript
// Speed thresholds by court_count — from isp_bandwidth_requirements seed data
const speedThresholds = [
  { min_courts: 1,  max_courts: 4,  fiber_min: 50,  cable_upload_min: 60,  dedicated_min: 30  },
  { min_courts: 5,  max_courts: 11, fiber_min: 150, cable_upload_min: null, dedicated_min: 50  },
  { min_courts: 12, max_courts: 19, fiber_min: 200, cable_upload_min: null, dedicated_min: 50  },
  { min_courts: 20, max_courts: 24, fiber_min: 300, cable_upload_min: null, dedicated_min: 100 },
  { min_courts: 25, max_courts: 50, fiber_min: 400, cable_upload_min: null, dedicated_min: 150 },
]

function validateSpeed(court_count: number, isp_type: string, upload_mbps: number): ValidationResult {
  const band = speedThresholds.find(t => court_count >= t.min_courts && court_count <= t.max_courts)
  if (!band || !upload_mbps) return { severity: 'ok' }

  if (isp_type === 'fiber' && upload_mbps < band.fiber_min) {
    return { severity: 'warning', message: `${court_count} courts requires ${band.fiber_min} Mbps symmetric fiber. Current: ${upload_mbps} Mbps upload.` }
  }
  if (isp_type === 'cable' && band.cable_upload_min && upload_mbps < band.cable_upload_min) {
    return { severity: 'warning', message: `${court_count} courts on cable requires at least ${band.cable_upload_min} Mbps upload. Current: ${upload_mbps} Mbps.` }
  }
  if (isp_type === 'dedicated' && upload_mbps < band.dedicated_min) {
    return { severity: 'warning', message: `${court_count} courts on dedicated circuit requires ${band.dedicated_min} Mbps. Current: ${upload_mbps} Mbps.` }
  }
  return { severity: 'ok' }
}
```

#### Philippines ISP Validation

When `venue_country = 'PH'`:
- Show warning: "Philippines deployment requires a BUSINESS ISP plan with static IP. Residential plans use CGNAT and will block port 4000."
- Show info: "Supported ISPs: PLDT Beyond Fiber, Globe GFiber Business, Converge FlexiBIZ. Do NOT use PLDT + Globe together (shared backbone — use PLDT + Converge for backup)."
- `has_static_ip = false` → BLOCKING error: "Static IP is mandatory for Philippines deployments. Contact the ISP to add a static IP plan."
- `has_backup_isp = false` and tier is 'autonomous' or 'autonomous_plus' → WARNING: "Autonomous venues in Philippines require dual ISP. Backup ISP not set."

#### Backup ISP Requirement (WARNING)

When tier is 'autonomous' or 'autonomous_plus' and `has_backup_isp = false`:
- Show warning: "24/7 autonomous venues are recommended to have a backup ISP for failover."

---

## Step 4: Installation Details

**MRP Source**: "CUSTOMER MASTER" tab — installer, dates columns

### Form Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `installer_id` | UUID FK \| null | optional | Selected from installers table dropdown |
| `installer_type` | enum: podplay_vetted \| client_own | optional | If client_own, ops must plan for remote troubleshooting |
| `kickoff_call_date` | date | optional | Date of initial call with Andy |
| `signed_date` | date | optional | Date SOW/contract was signed |
| `installation_start_date` | date | optional | On-site install window start |
| `installation_end_date` | date | optional | On-site install window end |
| `notes` | text | optional, max 2000 chars | Customer-facing notes for SOW |
| `internal_notes` | text | optional, max 2000 chars | Internal ops notes |

### Installer Selection Logic

```typescript
// Filter installers by venue_state using GIN index on regions array
// Query: SELECT * FROM installers WHERE $1 = ANY(regions) AND is_active = true
// If no match for venue_state, show all active installers
async function suggestInstallers(venue_state: string): Promise<Installer[]> {
  const { data } = await supabase
    .from('installers')
    .select('*')
    .contains('regions', [venue_state])
    .eq('is_active', true)
    .order('name')
  return data ?? []
}
```

If `installer_id` is set and `installer_type` is not set, auto-derive:
- Installer found in installers table → `installer_type = installer.installer_type`

### Validation Rules

1. `installation_end_date >= installation_start_date` — error if end is before start.
2. `signed_date` set + `installation_start_date` not set → info: "Consider setting installation dates now that the contract is signed."
3. `installer_type = 'client_own'` → show info banner: "Client's own installer — PodPlay ops will need to troubleshoot remotely if issues arise. Ensure detailed labeling instructions are sent."

---

## Step 5: Credentials & Infrastructure

**MRP Source**: "MASTER ACCOUNTS" tab

### Form Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `ddns_subdomain` | text | optional, pattern: `^[a-z0-9-]+$`, max 63 chars | FreeDNS subdomain under podplaydns.com. e.g., "telepark". Full URL: http://telepark.podplaydns.com:4000 |
| `unifi_site_name` | text | optional, pattern: `^PL-[A-Z0-9-]+$`, max 50 chars | UniFi network site name. Format: PL-{CUSTOMERNAME}. e.g., "PL-TELEPARK" |
| `mac_mini_username` | text | optional | macOS login username on replay server |
| `mac_mini_password` | text | optional | macOS login password (plain text per MRP convention) |
| `location_id` | text | optional | PodPlay venue ID from dev team (Agustin). Used in MDM P-List config |
| `rack_size_u` | integer | optional, min 7, max 42 | Rack enclosure size in rack units |

### Auto-Suggestion Logic

```typescript
// Auto-suggest DDNS subdomain from customer_name
function suggestDdnsSubdomain(customer_name: string): string {
  return customer_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '')       // trim leading/trailing hyphens
    .substring(0, 63)
}
// e.g., "Telepark Pickleball Club" → "telepark-pickleball-club"
// Operator should shorten: "telepark"

// Auto-suggest UniFi site name from customer_name
function suggestUnifiSiteName(customer_name: string): string {
  const slug = customer_name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 46)
  return `PL-${slug}`
}
// e.g., "Telepark Pickleball Club" → "PL-TELEPARK-PICKLEBALL-CLUB"
// Operator should shorten: "PL-TELEPARK"
```

### Derived URL Preview (shown inline)

```
DDNS URL:        http://telepark.podplaydns.com:4000
Local URL:       http://192.168.32.100:4000
Health check:    http://telepark.podplaydns.com:4000/health
```

### Validation Rules

1. `ddns_subdomain` uniqueness: query `projects` table for existing `ddns_subdomain` match (excluding current project). If duplicate: "Subdomain 'telepark' is already in use by project 'Telepark Pickleball Club'. Choose a different subdomain."
2. `ddns_subdomain` pattern: `^[a-z0-9-]+$` — error if contains uppercase, spaces, or special chars.
3. `unifi_site_name` pattern: must start with "PL-" — auto-prefix if not present.
4. All credentials fields are optional at intake — they can be filled during Stage 3 deployment checklist. Show info: "Credentials can be added later during deployment configuration."

---

## Step 6: Review & Submit

A full read-only summary of all entered data, grouped by section.

### Cost Analysis Preview

Shown before submission. Uses the BOM generation algorithm (see `logic-bom-generation.md`) with current tier/court/door/camera inputs.

```typescript
// Compute preview totals from bom_templates × quantities
interface CostPreview {
  hardware_subtotal: number    // sum(qty × unit_cost) for all BOM items
  shipping_cost: number        // hardware_subtotal × shipping_rate (default 10%)
  landed_cost: number          // hardware_subtotal × (1 + shipping_rate)
  margin_amount: number        // landed_cost × margin / (1 - margin)
  hardware_revenue: number     // landed_cost / (1 - margin)
  service_fee: number          // tier_venue_fee + (tier_court_fee × court_count)
  total_contract_value: number // hardware_revenue + service_fee
  sales_tax: number            // total_contract_value × tax_rate (default 10.25%)
  invoice_total: number        // total_contract_value + sales_tax
}
```

Concrete example — 6-court Autonomous+ with 4 doors and 8 security cameras:
```
Hardware subtotal:  $35,200  (illustrative; actual from BOM template × unit costs)
Shipping (10%):     $3,520
Landed cost:        $38,720
Customer price:     $43,022  (÷ 0.90 margin)
Service fee:        $22,500  ($7,500 venue + $2,500 × 6 courts)
Contract value:     $65,522
Sales tax (10.25%): $6,716
Invoice total:      $72,238
```

### Validation Before Submit

Run full validation pass across all 5 steps:
1. All required fields present
2. No blocking ISP errors (unacknowledged Starlink)
3. Philippines static IP gate passed
4. DDNS subdomain uniqueness confirmed
5. End date >= start date

If any blocking error: highlight the step tab with a red indicator, show error list at top of review step. User must go back and fix.

### Submit Button Label

"Create Project" (not "Submit" — reinforces the action being taken).

---

## Submission: Atomic DB Operations

On "Create Project" click, the following operations execute in a **single Supabase transaction** (via RPC function or sequential client-side operations with error rollback):

### Operation 1: Insert projects row

```typescript
const projectId = crypto.randomUUID()

await supabase.from('projects').insert({
  id: projectId,
  customer_name,
  venue_name,
  venue_address_line1,
  venue_address_line2,
  venue_city,
  venue_state,
  venue_zip,
  venue_country,
  contact_name,
  contact_email,
  contact_phone,
  tier,
  court_count,
  door_count,
  security_camera_count,
  has_nvr: tier === 'autonomous_plus',
  has_pingpod_wifi,
  has_front_desk,
  isp_provider,
  isp_type,
  has_static_ip,
  has_backup_isp,
  internet_download_mbps,
  internet_upload_mbps,
  starlink_warning_acknowledged,
  rack_size_u,
  ddns_subdomain: ddns_subdomain || null,
  unifi_site_name: unifi_site_name || null,
  mac_mini_username: mac_mini_username || null,
  mac_mini_password: mac_mini_password || null,
  location_id: location_id || null,
  replay_api_url: ddns_subdomain ? `http://${ddns_subdomain}.podplaydns.com:4000` : null,
  replay_local_url: 'http://192.168.32.100:4000',
  replay_service_version,
  installer_id: installer_id || null,
  installer_type: installer_type || null,
  kickoff_call_date: kickoff_call_date || null,
  signed_date: signed_date || null,
  installation_start_date: installation_start_date || null,
  installation_end_date: installation_end_date || null,
  notes: notes || null,
  internal_notes: internal_notes || null,
  // Status fields — always start here
  project_status: 'intake',
  deployment_status: 'not_started',
  revenue_stage: 'proposal',
})
```

### Operation 2: Generate BOM (project_bom_items)

Auto-generate BOM from `bom_templates` for the project's tier.

```typescript
// Full algorithm in logic-bom-generation.md
// Summary:
// 1. Query bom_templates WHERE applicable_tiers @> ARRAY[tier] AND is_active = true
// 2. For each template row, compute qty:
//    qty = (row.qty_per_venue) + (row.qty_per_court × court_count)
//          + (row.qty_per_door × door_count) + (row.qty_per_camera × security_camera_count)
// 3. Apply conditional overrides (switch size, SSD size, NVR size — from settings)
// 4. Skip rows where qty = 0
// 5. Insert all rows into project_bom_items

await generateBOM(supabase, projectId, {
  tier, court_count, door_count, security_camera_count, has_pingpod_wifi, has_front_desk
})
```

### Operation 3: Seed Deployment Checklist (deployment_checklist_items)

```typescript
// Full algorithm in logic-deployment-tracking.md
// Summary:
// 1. Query deployment_checklist_templates
//    WHERE (applicable_tiers IS NULL OR applicable_tiers @> ARRAY[tier])
//      AND (is_v2_only = false OR (is_v2_only = true AND replay_service_version = 'v2'))
// 2. For each template, replace tokens:
//    {{CUSTOMER_NAME}} → customer_name
//    {{COURT_COUNT}} → court_count.toString()
//    {{DDNS_SUBDOMAIN}} → ddns_subdomain ?? '[SET IN STEP 5]'
//    {{UNIFI_SITE_NAME}} → unifi_site_name ?? '[SET IN STEP 5]'
//    {{MAC_MINI_USERNAME}} → mac_mini_username ?? '[SET IN STEP 5]'
//    {{LOCATION_ID}} → location_id ?? '[GET FROM AGUSTIN]'
// 3. Bulk insert ~121 rows into deployment_checklist_items

await seedChecklist(supabase, projectId, {
  tier, replay_service_version,
  customer_name, court_count, ddns_subdomain, unifi_site_name, mac_mini_username, location_id
})
```

**Token placeholder behavior**: If a token field (e.g., ddns_subdomain) is not filled at intake, the placeholder text `[SET IN STEP 5]` is inserted into the checklist step description. The ops user must update it during Stage 3. When the project's `ddns_subdomain` is later updated, the checklist items are NOT retroactively updated — ops updates manually or via "Re-sync tokens" action in Stage 3.

### Operation 4: Create Replay Signs Record

Always created for every project (all tiers need replay signs).

```typescript
// idempotent — checks for existing record first
async function ensureReplaySignRecord(supabase, projectId: string, court_count: number) {
  const existing = await supabase
    .from('replay_signs')
    .select('id')
    .eq('project_id', projectId)
    .single()

  if (existing.data) return  // already exists

  await supabase.from('replay_signs').insert({
    project_id: projectId,
    qty: court_count * 2,      // 2 signs per court
    status: 'staged',
    // All other fields NULL — filled during Stage 2 procurement
  })
}
```

### Operation 5: Create CC Terminal Record (conditional)

Only created when `has_front_desk = true`.

```typescript
async function ensureFrontDeskRecords(supabase, projectId: string, has_front_desk: boolean) {
  if (!has_front_desk) return

  const existing = await supabase
    .from('cc_terminals')
    .select('id')
    .eq('project_id', projectId)
    .single()

  if (existing.data) return  // already exists

  await supabase.from('cc_terminals').insert({
    project_id: projectId,
    qty: 1,                      // Default: 1 terminal per venue
    status: 'not_ordered',
    unit_cost: 249.00,           // BBPOS WisePOS E unit cost
    // stripe_order_id, delivery_date, installed_date — filled during Stage 2
  })
}
```

### Error Handling

If any DB operation fails:
1. Roll back all operations (delete project row if checklist/BOM insert fails).
2. Show error toast: "Failed to create project. Please try again. [Error detail for ops user]"
3. Form state is preserved — user does not lose their entries.
4. Log error to console (Supabase error object).

No retry loop — one attempt only. If it fails, user clicks "Create Project" again.

---

## Post-Submit: Navigation

On successful submission:
```
Navigate to: /projects/{projectId}/intake
```

This opens the project's Stage 1 view (intake summary), which shows:
- Read-only project details with "Edit" button
- Cost analysis preview (BOM totals)
- "Advance to Procurement" button (Stage 2)

The "Advance to Procurement" button transitions `project_status` from `intake` to `procurement`.

---

## State Machine: Project Creation → Intake Complete

```
[New Project button clicked]
    ↓
[6-step wizard form]
    ↓ (submit)
[project created, project_status = 'intake', revenue_stage = 'proposal']
    ↓
[Intake view: cost analysis, edit options]
    ↓ (operator reviews, optionally sends SOW)
[SOW sent to customer]
    ↓ (customer signs)
[signed_date set, revenue_stage = 'signed']
    ↓ (operator clicks "Advance to Procurement")
[project_status = 'procurement']
```

### Status Transition Guards

| From | To | Guard Condition |
|------|-----|----------------|
| (new) | intake | Form submitted successfully |
| intake | procurement | No guard — operator can advance at any time; BOM already generated |
| intake | cancelled | Operator explicitly cancels; requires confirmation dialog |

### Revenue Stage Transitions (within intake)

| From | To | Trigger |
|------|-----|---------|
| proposal | signed | `signed_date` field is set (date picker) |
| signed | deposit_invoiced | Deposit invoice created in Stage 4 (financial_close) |

Note: `deposit_invoiced` and later stages are only reachable in Stage 4, not Stage 1.

---

## SOW Generation

The webapp generates a Statement of Work summary for email to the customer. This is a read-only view (not a PDF generator in V1 — ops copies/pastes into email or Google Doc).

### SOW Content

```
STATEMENT OF WORK

Customer: {customer_name}
Venue: {venue_name}
Address: {venue_address_line1}, {venue_city}, {venue_state} {venue_zip}
Date: {kickoff_call_date or today}

SERVICE TIER: {tier_display_name}
Courts: {court_count}
{if autonomous/autonomous_plus: Doors: {door_count}}
{if autonomous_plus: Security Cameras: {security_camera_count}}
{if has_front_desk: Front Desk Equipment: Included}

PRICING SUMMARY:
  Service Fee:            ${service_fee}
    Venue Fee:            ${tier_venue_fee}
    Per-Court Fee:        ${tier_court_fee} × {court_count} courts
  Hardware (estimated):   ${hardware_revenue}
  ─────────────────────────────────────────
  Subtotal:               ${total_contract_value}
  Sales Tax ({tax_rate}%): ${sales_tax}
  Total:                  ${invoice_total}

PAYMENT TERMS:
  Deposit (50%):          ${deposit_amount} — due upon signing
  Final Payment (50%):    ${final_amount} — due upon go-live

INSTALLATION:
  Installer: {installer_name or '(not yet assigned)'}
  Estimated Timeline: {installation_start_date} – {installation_end_date or '(not yet scheduled)'}

NOTES:
  {notes}
```

### Service Fee Calculation (for SOW)

```typescript
// From settings table
const settings = await getSettings()

const tierFees = {
  pro:             { venue: settings.pro_venue_fee,             court: settings.pro_court_fee },
  autonomous:      { venue: settings.autonomous_venue_fee,      court: settings.autonomous_court_fee },
  autonomous_plus: { venue: settings.autonomous_plus_venue_fee, court: settings.autonomous_plus_court_fee },
  pbk:             { venue: settings.pbk_venue_fee,             court: settings.pbk_court_fee },
}

const fees = tierFees[tier]
const service_fee = fees.venue + (fees.court * court_count)

// Deposit
const deposit_pct = settings.deposit_percentage / 100  // default 0.50
const total_contract_value = hardware_revenue + service_fee
const deposit_amount = total_contract_value * deposit_pct
const final_amount = total_contract_value - deposit_amount
```

---

## Editing an Existing Project (Post-Intake)

Operators can edit project fields after creation via the "Edit" button on the intake view. Edit rules:

| Field Group | Editable After Create? | Restrictions |
|------------|----------------------|--------------|
| Customer/Venue info | Always | None |
| tier | Yes, but WARN | "Changing tier will regenerate the BOM — existing BOM edits will be lost. Continue?" |
| court_count | Yes, but WARN | Same BOM regeneration warning |
| door_count | Yes, but WARN | Same BOM regeneration warning |
| security_camera_count | Yes, but WARN | Same BOM regeneration warning |
| has_front_desk | Yes | If newly true: creates CC terminal record. If newly false: does NOT delete existing CC terminal record — shows warning "CC terminal record exists. Delete manually if not needed." |
| ISP fields | Always | No side effects |
| Installer / dates | Always | None |
| Credentials (DDNS etc.) | Always | Changing `ddns_subdomain` updates `replay_api_url` automatically but does NOT update checklist item text — shows info: "Update checklist step descriptions manually or use Re-sync Tokens." |
| project_status | Via wizard "Advance" buttons only | Not a raw edit field |
| revenue_stage | Via invoicing workflow only | Not a raw edit field |

### BOM Regeneration on Tier/Court/Door/Camera Change

```typescript
async function regenerateBOM(
  supabase,
  projectId: string,
  { tier, court_count, door_count, security_camera_count, has_pingpod_wifi, has_front_desk }
) {
  // 1. Delete existing auto-generated BOM items (is_manual = false)
  await supabase
    .from('project_bom_items')
    .delete()
    .eq('project_id', projectId)
    .eq('is_manual', false)

  // 2. Re-run BOM generation
  await generateBOM(supabase, projectId, { tier, court_count, door_count, security_camera_count, has_pingpod_wifi, has_front_desk })
}
```

Items marked `is_manual = true` (manually added by operator) are preserved across regeneration.

---

## Complete Example: 6-Court Autonomous+ Onboarding

### Input

```
Step 1: Customer & Venue
  customer_name:       "Apex Pickleball"
  venue_name:          "Apex - Chicago North"
  venue_city:          "Chicago"
  venue_state:         "IL"
  venue_country:       "US"
  contact_name:        "Maria Rodriguez"
  contact_email:       "maria@apexpickleball.com"
  contact_phone:       "+1 (312) 555-0192"

Step 2: Configuration
  tier:                autonomous_plus
  court_count:         6
  door_count:          3
  security_camera_count: 8
  has_front_desk:      true
  has_pingpod_wifi:    false
  replay_service_version: v1

Step 3: ISP
  isp_provider:        "Comcast Business"
  isp_type:            cable
  has_static_ip:       true
  has_backup_isp:      false
  internet_download_mbps: 500
  internet_upload_mbps:   35
  → WARNING: "5-11 courts on cable — aim for highest possible upload speed. 35 Mbps upload may be marginal."

Step 4: Installation
  installer_id:        [selected: Joe Martinez, NY/NJ region]
  installer_type:      podplay_vetted
  kickoff_call_date:   2026-03-10
  installation_start_date: 2026-04-14
  installation_end_date:   2026-04-16

Step 5: Credentials
  ddns_subdomain:      "apex-chicago"
  unifi_site_name:     "PL-APEX-CHICAGO"
  mac_mini_username:   "apexadmin"
  mac_mini_password:   (set at config time)
  location_id:         (pending — get from Agustin)
```

### DB Operations on Submit

1. **projects row created**:
   - id: `proj_abc123`
   - project_status: `intake`
   - deployment_status: `not_started`
   - revenue_stage: `proposal`
   - replay_sign_count: 12 (6 × 2, GENERATED)
   - replay_api_url: `http://apex-chicago.podplaydns.com:4000`
   - has_nvr: true

2. **BOM generated**: ~47 items (exact counts from BOM templates × qty formulas)
   - 6× iPad + 6× Apple TV + 6× replay camera + 6× Flic button
   - 3× Kisi Reader + 1× Kisi Controller
   - 8× UniFi G5 Turret + 8× junction box
   - 1× NVR-Pro (7-bay, court_count 6 > threshold 4) + 2× WD Purple 8TB HDD (qty = ceiling(security_camera_count / 4))
   - 1× Mac Mini + 1× Samsung T7 2TB SSD (6 courts, 2–10 range)
   - 1× USW-Pro-48-PoE (6 courts > 12 breakpoint? No — 6 < 12, use 24-port)
   - 1× front desk: BBPOS WisePOS E + QR Scanner + Webcam

3. **Deployment checklist seeded**: 121 steps, tokens substituted:
   - `{{CUSTOMER_NAME}}` → "Apex Pickleball"
   - `{{COURT_COUNT}}` → "6"
   - `{{DDNS_SUBDOMAIN}}` → "apex-chicago"
   - `{{UNIFI_SITE_NAME}}` → "PL-APEX-CHICAGO"
   - `{{MAC_MINI_USERNAME}}` → "apexadmin"
   - `{{LOCATION_ID}}` → "[GET FROM AGUSTIN]" (not yet known)

4. **replay_signs record created**:
   - qty: 12 (6 × 2)
   - status: `staged`

5. **cc_terminals record created** (has_front_desk = true):
   - qty: 1
   - unit_cost: $249.00
   - status: `not_ordered`

### Cost Preview Shown on Review Step

```
Hardware cost:        $41,850  (sum of qty × unit_cost from BOM items — exact from catalog)
Shipping (10%):       $4,185
Landed cost:          $46,035
Hardware revenue:     $51,150  (÷ 0.90)
Service fee:          $22,500  ($7,500 + $2,500×6)
Contract value:       $73,650
Sales tax (10.25%):   $7,549
Invoice total:        $81,199
Deposit (50%):        $40,599
Final payment:        $40,600
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| court_count = 1 | BOM generates minimum quantities (1 replay camera, 1 iPad, 1 Apple TV, 1 PoE adapter, 1 iPad case, 1 HDMI cable, 2 Flic buttons, 1 junction box). replay_sign_count = 2. |
| tier = pbk, court_count = 10 | PBK pricing used for service_fee. BOM same as Pro tier (Pro template). |
| has_front_desk = false initially, set to true in edit | CC terminal record created. BOM not regenerated — front desk hardware items already in Pro BOM template (they are always present in templates; qty forced to 0 when has_front_desk=false via conditional qty override). |
| door_count = 0 on autonomous tier | Wizard shows error on Step 2 — cannot submit. |
| ddns_subdomain already taken | Uniqueness error shown on Step 5 before user can proceed. |
| Starlink ISP, acknowledged | Project creates but shows permanent red warning banner in project header: "ISP: Starlink — replay service will not function (CGNAT blocks port 4000)." |
| location_id empty at intake | Checklist step for MDM P-List config (Phase 1, Step 16) shows `[GET FROM AGUSTIN]` as placeholder. Phase 1 cannot be completed until operator fills location_id on the project and manually updates the step description. |
| Philippines, missing static IP | Hard blocking error on Step 3 — cannot advance. Shows: "Static IP is mandatory for Philippines. Contact ISP before proceeding." |
| venue_country = PH, has_backup_isp = false, tier = autonomous | Warning shown on Step 3. Project can still submit (not blocking) but warning persists on project intake view. |
