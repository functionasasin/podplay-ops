# PodPlay Ops Wizard — Enum Display Labels

Canonical mapping of every Postgres enum value to its UI display label, badge color/class,
and filter option text. Used by all components that render enum values. Zero enum left unmapped.

**Implementation note**: Import this mapping via `src/lib/enum-labels.ts` — a TypeScript
module that re-exports typed record objects for each enum. Components destructure `{ label, className }`
from the relevant record.

---

## `service_tier`

**Used in**: TierBadge, dashboard filter, intake Step 1, settings pricing tiers, BOM grouping.

| DB Value | Display Label (short badge) | Display Label (full) | Badge className |
|---|---|---|---|
| `pro` | `PRO` | Pro | `bg-blue-100 text-blue-700 border-blue-200` |
| `autonomous` | `AUTO` | Autonomous | `bg-purple-100 text-purple-700 border-purple-200` |
| `autonomous_plus` | `A+` | Autonomous+ | `bg-indigo-100 text-indigo-700 border-indigo-200` |
| `pbk` | `PBK` | Pickleball Kingdom | `bg-orange-100 text-orange-700 border-orange-200` |

**Filter select options** (in dashboard filter bar):
- `""` → "All Tiers"
- `pro` → "Pro"
- `autonomous` → "Autonomous"
- `autonomous_plus` → "Autonomous+"
- `pbk` → "PBK"

**TypeScript**:
```ts
export const SERVICE_TIER_CONFIG: Record<ServiceTier, { label: string; fullLabel: string; className: string }> = {
  pro:            { label: 'PRO',  fullLabel: 'Pro',                className: 'bg-blue-100 text-blue-700 border-blue-200' },
  autonomous:     { label: 'AUTO', fullLabel: 'Autonomous',         className: 'bg-purple-100 text-purple-700 border-purple-200' },
  autonomous_plus:{ label: 'A+',   fullLabel: 'Autonomous+',        className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  pbk:            { label: 'PBK',  fullLabel: 'Pickleball Kingdom', className: 'bg-orange-100 text-orange-700 border-orange-200' },
}
```

---

## `project_status`

**Used in**: StatusCell (dashboard), project header, wizard stage progress bar, filter bar, data migration records.

| DB Value | Display Label | Dot color class | Meaning |
|---|---|---|---|
| `intake` | Intake | `bg-slate-400` | Stage 1 active — form in progress or complete |
| `procurement` | Procurement | `bg-yellow-400` | Stage 2 active — BOM and POs in progress |
| `deployment` | Deployment | `bg-blue-500` | Stage 3 active — 15-phase checklist active |
| `financial_close` | Financial Close | `bg-orange-400` | Stage 4 active — invoicing and P&L review |
| `completed` | Completed | `bg-green-500` | All done — final invoice paid, project closed |
| `cancelled` | Cancelled | `bg-red-400` | Cancelled at any stage |

**Filter select options** (in dashboard filter bar):
- `""` → "All Statuses"
- `intake` → "Intake"
- `procurement` → "Procurement"
- `deployment` → "Deployment"
- `financial_close` → "Financial Close"
- `completed` → "Completed"
- `cancelled` → "Cancelled"

**TypeScript**:
```ts
export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; dotColor: string }> = {
  intake:          { label: 'Intake',          dotColor: 'bg-slate-400' },
  procurement:     { label: 'Procurement',     dotColor: 'bg-yellow-400' },
  deployment:      { label: 'Deployment',      dotColor: 'bg-blue-500' },
  financial_close: { label: 'Financial Close', dotColor: 'bg-orange-400' },
  completed:       { label: 'Completed',       dotColor: 'bg-green-500' },
  cancelled:       { label: 'Cancelled',       dotColor: 'bg-red-400' },
}
```

---

## `deployment_status`

**Used in**: StatusCell sub-label (only when `project_status = 'deployment'`), deployment wizard header, CUSTOMER MASTER column.

| DB Value | Display Label | Meaning |
|---|---|---|
| `not_started` | Not started | Deployment stage not yet begun |
| `config` | Configuring | Hardware being configured in PodPlay NJ lab |
| `ready_to_ship` | Ready to ship | Configured, tested, packed — awaiting shipment |
| `shipped` | Shipped | Hardware shipped to venue |
| `installing` | Installing | On-site installation in progress |
| `qc` | QC | Quality check / end-to-end testing at venue |
| `completed` | Complete | Fully deployed, verified working, ready for handoff |

**TypeScript**:
```ts
export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentStatus, string> = {
  not_started:   'Not started',
  config:        'Configuring',
  ready_to_ship: 'Ready to ship',
  shipped:       'Shipped',
  installing:    'Installing',
  qc:            'QC',
  completed:     'Complete',
}
```

---

## `revenue_stage`

**Used in**: RevenueStageCell (dashboard), financials wizard step, revenue pipeline view, project header.

| DB Value | Display Label | Lucide icon | Icon className |
|---|---|---|---|
| `proposal` | Proposal | `FileText` | `text-slate-500` |
| `signed` | Signed | `PenLine` | `text-blue-500` |
| `deposit_invoiced` | Deposit sent | `Send` | `text-yellow-600` |
| `deposit_paid` | Deposit paid | `CheckCircle2` | `text-green-500` |
| `final_invoiced` | Final sent | `Send` | `text-orange-500` |
| `final_paid` | Final paid | `CheckCircle2` | `text-green-600` |

**TypeScript**:
```ts
export const REVENUE_STAGE_CONFIG: Record<RevenueStage, { label: string; icon: LucideIcon; className: string }> = {
  proposal:         { label: 'Proposal',     icon: FileText,    className: 'text-slate-500' },
  signed:           { label: 'Signed',       icon: PenLine,     className: 'text-blue-500' },
  deposit_invoiced: { label: 'Deposit sent', icon: Send,        className: 'text-yellow-600' },
  deposit_paid:     { label: 'Deposit paid', icon: CheckCircle2,className: 'text-green-500' },
  final_invoiced:   { label: 'Final sent',   icon: Send,        className: 'text-orange-500' },
  final_paid:       { label: 'Final paid',   icon: CheckCircle2,className: 'text-green-600' },
}
```

---

## `installer_type`

**Used in**: intake Step 4 (Installation Details), project detail panel, installer directory.

| DB Value | Display Label | Description shown in UI |
|---|---|---|
| `podplay_vetted` | PodPlay Vetted | Installer from PodPlay's vetted network (NY, CT, NJ) |
| `client_own` | Client's Own | Client's own installer — may need remote troubleshooting support |

**Radio button labels** (intake Step 4):
- `podplay_vetted` → "PodPlay Vetted Installer"
- `client_own` → "Client's Own Installer"

**TypeScript**:
```ts
export const INSTALLER_TYPE_LABELS: Record<InstallerType, string> = {
  podplay_vetted: "PodPlay Vetted",
  client_own:     "Client's Own",
}
```

---

## `isp_type`

**Used in**: intake Step 3 (ISP & Networking), ISP validation warning logic, deployment troubleshooting panel.

| DB Value | Display Label | Select option label |
|---|---|---|
| `fiber` | Fiber | Fiber (recommended) |
| `cable` | Cable | Cable |
| `dedicated` | Dedicated | Dedicated Circuit |
| `other` | Other | Other |

**Select options** (intake Step 3 `isp_type` field):
- `fiber` → "Fiber (recommended)"
- `cable` → "Cable"
- `dedicated` → "Dedicated Circuit"
- `other` → "Other"

**TypeScript**:
```ts
export const ISP_TYPE_LABELS: Record<IspType, string> = {
  fiber:     'Fiber',
  cable:     'Cable',
  dedicated: 'Dedicated',
  other:     'Other',
}

export const ISP_TYPE_SELECT_LABELS: Record<IspType, string> = {
  fiber:     'Fiber (recommended)',
  cable:     'Cable',
  dedicated: 'Dedicated Circuit',
  other:     'Other',
}
```

---

## `replay_service_version`

**Used in**: intake Step 2 (Venue Details toggle), deployment Phase 9 conditional logic banner, project detail panel.

| DB Value | Display Label | Description shown in UI |
|---|---|---|
| `v1` | V1 (Current) | Uses deploy.py + VPN, UDP — pixelation known issue |
| `v2` | V2 (April 2026) | GitHub deploy, TCP — pixelation resolved |

**Radio / select labels** (intake Step 2):
- `v1` → "V1 — Current (deploy.py + VPN)"
- `v2` → "V2 — April 2026 (GitHub deploy)"

**TypeScript**:
```ts
export const REPLAY_VERSION_LABELS: Record<ReplayServiceVersion, string> = {
  v1: 'V1 (Current)',
  v2: 'V2 (April 2026)',
}

export const REPLAY_VERSION_SELECT_LABELS: Record<ReplayServiceVersion, string> = {
  v1: 'V1 — Current (deploy.py + VPN)',
  v2: 'V2 — April 2026 (GitHub deploy)',
}
```

---

## `expense_category`

**Used in**: wizard Stage 4 expense form, expenses table, financial P&L summary rows, settings defaults.

| DB Value | Display Label |
|---|---|
| `airfare` | Airfare |
| `car` | Car Rental |
| `fuel` | Fuel |
| `lodging` | Lodging |
| `meals` | Meals |
| `misc_hardware` | Misc Hardware |
| `outbound_shipping` | Outbound Shipping |
| `professional_services` | Professional Services |
| `taxi` | Taxi / Rideshare |
| `train` | Train |
| `parking` | Parking |
| `other` | Other |

**Select options** displayed in alphabetical label order:
1. Airfare (`airfare`)
2. Car Rental (`car`)
3. Fuel (`fuel`)
4. Lodging (`lodging`)
5. Meals (`meals`)
6. Misc Hardware (`misc_hardware`)
7. Other (`other`)
8. Outbound Shipping (`outbound_shipping`)
9. Parking (`parking`)
10. Professional Services (`professional_services`)
11. Taxi / Rideshare (`taxi`)
12. Train (`train`)

**TypeScript**:
```ts
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  airfare:               'Airfare',
  car:                   'Car Rental',
  fuel:                  'Fuel',
  lodging:               'Lodging',
  meals:                 'Meals',
  misc_hardware:         'Misc Hardware',
  outbound_shipping:     'Outbound Shipping',
  professional_services: 'Professional Services',
  taxi:                  'Taxi / Rideshare',
  train:                 'Train',
  parking:               'Parking',
  other:                 'Other',
}
```

---

## `payment_method`

**Used in**: expense form, expense table column, financial reports.

| DB Value | Display Label |
|---|---|
| `podplay_card` | PodPlay Card (Ramp) |
| `ramp_reimburse` | Ramp Reimbursement |

**TypeScript**:
```ts
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  podplay_card:   'PodPlay Card (Ramp)',
  ramp_reimburse: 'Ramp Reimbursement',
}
```

---

## `invoice_status`

**Used in**: wizard Stage 4 invoice cards, financials view invoice table, overdue invoice badge, aging receivables.

| DB Value | Display Label | Badge className |
|---|---|---|
| `not_sent` | Not Sent | `bg-slate-100 text-slate-600 border-slate-200` |
| `sent` | Sent | `bg-yellow-100 text-yellow-700 border-yellow-200` |
| `paid` | Paid | `bg-green-100 text-green-700 border-green-200` |

**TypeScript**:
```ts
export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  not_sent: { label: 'Not Sent', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  sent:     { label: 'Sent',     className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  paid:     { label: 'Paid',     className: 'bg-green-100 text-green-700 border-green-200' },
}
```

---

## `bom_category`

**Used in**: BOM table group headers, BOM review step, inventory filter sidebar, hardware catalog settings.

| DB Value | Display Label | Sort order |
|---|---|---|
| `network_rack` | Network Rack | 1 |
| `replay_system` | Replay System | 2 |
| `displays` | Displays & Kiosks | 3 |
| `access_control` | Access Control | 4 |
| `surveillance` | Surveillance | 5 |
| `front_desk` | Front Desk | 6 |
| `cabling` | Cabling | 7 |
| `signage` | Signage | 8 |
| `infrastructure` | Infrastructure | 9 |
| `pingpod_specific` | PingPod Specific | 10 |

**Group header rendering**: BOM table groups items by category, renders category label as a sticky sub-header row.

**TypeScript**:
```ts
export const BOM_CATEGORY_CONFIG: Record<BomCategory, { label: string; sortOrder: number }> = {
  network_rack:     { label: 'Network Rack',      sortOrder: 1 },
  replay_system:    { label: 'Replay System',     sortOrder: 2 },
  displays:         { label: 'Displays & Kiosks', sortOrder: 3 },
  access_control:   { label: 'Access Control',    sortOrder: 4 },
  surveillance:     { label: 'Surveillance',      sortOrder: 5 },
  front_desk:       { label: 'Front Desk',        sortOrder: 6 },
  cabling:          { label: 'Cabling',           sortOrder: 7 },
  signage:          { label: 'Signage',           sortOrder: 8 },
  infrastructure:   { label: 'Infrastructure',    sortOrder: 9 },
  pingpod_specific: { label: 'PingPod Specific',  sortOrder: 10 },
}
```

---

## `inventory_movement_type`

**Used in**: inventory movement history table, inventory adjustment form, stock detail drawer.

| DB Value | Display Label | Direction indicator |
|---|---|---|
| `purchase_order_received` | PO Received | `+` (positive, green) |
| `project_allocated` | Allocated to Project | `-` (negative, amber) |
| `project_shipped` | Shipped to Project | `-` (negative, amber) |
| `adjustment_increase` | Manual Increase | `+` (positive, green) |
| `adjustment_decrease` | Manual Decrease | `-` (negative, red) |
| `return` | Returned to Stock | `+` (positive, green) |

**TypeScript**:
```ts
export const MOVEMENT_TYPE_CONFIG: Record<InventoryMovementType, { label: string; sign: '+' | '-'; colorClass: string }> = {
  purchase_order_received: { label: 'PO Received',          sign: '+', colorClass: 'text-green-600' },
  project_allocated:       { label: 'Allocated to Project', sign: '-', colorClass: 'text-amber-600' },
  project_shipped:         { label: 'Shipped to Project',   sign: '-', colorClass: 'text-amber-600' },
  adjustment_increase:     { label: 'Manual Increase',      sign: '+', colorClass: 'text-green-600' },
  adjustment_decrease:     { label: 'Manual Decrease',      sign: '-', colorClass: 'text-red-600' },
  return:                  { label: 'Returned to Stock',    sign: '+', colorClass: 'text-green-600' },
}
```

---

## `sign_status`

**Used in**: wizard Stage 2 Replay Signs section, replay signs fulfillment table.

| DB Value | Display Label | Badge className |
|---|---|---|
| `staged` | Staged | `bg-slate-100 text-slate-600 border-slate-200` |
| `shipped` | Shipped | `bg-yellow-100 text-yellow-700 border-yellow-200` |
| `delivered` | Delivered | `bg-blue-100 text-blue-700 border-blue-200` |
| `installed` | Installed | `bg-green-100 text-green-700 border-green-200` |

**TypeScript**:
```ts
export const SIGN_STATUS_CONFIG: Record<SignStatus, { label: string; className: string }> = {
  staged:    { label: 'Staged',    className: 'bg-slate-100 text-slate-600 border-slate-200' },
  shipped:   { label: 'Shipped',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  delivered: { label: 'Delivered', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  installed: { label: 'Installed', className: 'bg-green-100 text-green-700 border-green-200' },
}
```

---

## `cc_terminal_status`

**Used in**: wizard Stage 2 CC Terminal section, CC terminal ordering table.

| DB Value | Display Label | Badge className |
|---|---|---|
| `not_ordered` | Not Ordered | `bg-slate-100 text-slate-600 border-slate-200` |
| `ordered` | Ordered | `bg-yellow-100 text-yellow-700 border-yellow-200` |
| `delivered` | Delivered | `bg-blue-100 text-blue-700 border-blue-200` |
| `installed` | Installed | `bg-green-100 text-green-700 border-green-200` |

**TypeScript**:
```ts
export const CC_TERMINAL_STATUS_CONFIG: Record<CcTerminalStatus, { label: string; className: string }> = {
  not_ordered: { label: 'Not Ordered', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  ordered:     { label: 'Ordered',     className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  delivered:   { label: 'Delivered',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
  installed:   { label: 'Installed',   className: 'bg-green-100 text-green-700 border-green-200' },
}
```

---

## `mdm_provider`

**Used in**: device migration form (target MDM dropdown), migration detail panel.

| DB Value | Display Label |
|---|---|
| `mosyle` | Mosyle |
| `jamf` | Jamf |
| `other` | Other |

**Select options** (device migration form):
- `mosyle` → "Mosyle (current PodPlay default)"
- `jamf` → "Jamf"
- `other` → "Other"

**TypeScript**:
```ts
export const MDM_PROVIDER_LABELS: Record<MdmProvider, string> = {
  mosyle: 'Mosyle',
  jamf:   'Jamf',
  other:  'Other',
}

export const MDM_PROVIDER_SELECT_LABELS: Record<MdmProvider, string> = {
  mosyle: 'Mosyle (current PodPlay default)',
  jamf:   'Jamf',
  other:  'Other',
}
```

---

## `device_migration_status`

**Used in**: device migration list, migration event header, migration progress tracker.

| DB Value | Display Label | Badge className |
|---|---|---|
| `planning` | Planning | `bg-slate-100 text-slate-600 border-slate-200` |
| `released` | Released | `bg-yellow-100 text-yellow-700 border-yellow-200` |
| `enrolled` | Enrolled | `bg-blue-100 text-blue-700 border-blue-200` |
| `configured` | Configured | `bg-purple-100 text-purple-700 border-purple-200` |
| `completed` | Completed | `bg-green-100 text-green-700 border-green-200` |
| `cancelled` | Cancelled | `bg-red-100 text-red-700 border-red-200` |

**TypeScript**:
```ts
export const DEVICE_MIGRATION_STATUS_CONFIG: Record<DeviceMigrationStatus, { label: string; className: string }> = {
  planning:   { label: 'Planning',   className: 'bg-slate-100 text-slate-600 border-slate-200' },
  released:   { label: 'Released',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  enrolled:   { label: 'Enrolled',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
  configured: { label: 'Configured', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  completed:  { label: 'Completed',  className: 'bg-green-100 text-green-700 border-green-200' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-100 text-red-700 border-red-200' },
}
```

---

## `migration_device_type`

**Used in**: device migration item rows, per-device status column.

| DB Value | Display Label |
|---|---|
| `ipad` | iPad |
| `apple_tv` | Apple TV |
| `mac_mini` | Mac Mini |

**TypeScript**:
```ts
export const MIGRATION_DEVICE_TYPE_LABELS: Record<MigrationDeviceType, string> = {
  ipad:      'iPad',
  apple_tv:  'Apple TV',
  mac_mini:  'Mac Mini',
}
```

---

## `migration_device_status`

**Used in**: device migration item rows, per-device status badge.

| DB Value | Display Label | Badge className |
|---|---|---|
| `pending` | Pending | `bg-slate-100 text-slate-600 border-slate-200` |
| `released` | Released | `bg-yellow-100 text-yellow-700 border-yellow-200` |
| `enrolled` | Enrolled | `bg-blue-100 text-blue-700 border-blue-200` |
| `configured` | Configured | `bg-green-100 text-green-700 border-green-200` |

**TypeScript**:
```ts
export const MIGRATION_DEVICE_STATUS_CONFIG: Record<MigrationDeviceStatus, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-slate-100 text-slate-600 border-slate-200' },
  released:   { label: 'Released',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  enrolled:   { label: 'Enrolled',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
  configured: { label: 'Configured', className: 'bg-green-100 text-green-700 border-green-200' },
}
```

---

## `deployment_region`

**Used in**: intake Step 1 (venue country selection), international deployment warning banner, project detail panel.

| DB Value | Display Label |
|---|---|
| `us` | United States |
| `philippines` | Philippines |

**Select options** (intake Step 1 country / region field):
- `us` → "United States"
- `philippines` → "Philippines"

**TypeScript**:
```ts
export const DEPLOYMENT_REGION_LABELS: Record<DeploymentRegion, string> = {
  us:          'United States',
  philippines: 'Philippines',
}
```

---

## `video_standard`

**Used in**: international deployment panel (Philippines only), shown when `deployment_region = 'philippines'`.

| DB Value | Display Label |
|---|---|
| `ntsc` | NTSC (60Hz) |
| `pal` | PAL (50Hz) |

**TypeScript**:
```ts
export const VIDEO_STANDARD_LABELS: Record<VideoStandard, string> = {
  ntsc: 'NTSC (60Hz)',
  pal:  'PAL (50Hz)',
}
```

---

## `power_standard`

**Used in**: international deployment panel (Philippines only), shown when `deployment_region = 'philippines'`.

| DB Value | Display Label |
|---|---|
| `120v_60hz` | 120V / 60Hz (US) |
| `220v_60hz` | 220V / 60Hz (Philippines) |

**TypeScript**:
```ts
export const POWER_STANDARD_LABELS: Record<PowerStandard, string> = {
  '120v_60hz': '120V / 60Hz (US)',
  '220v_60hz': '220V / 60Hz (Philippines)',
}
```

---

## Consolidated TypeScript Module

**File**: `src/lib/enum-labels.ts`

This file exports all label maps above as a single module. Components import only what they need:

```ts
import {
  SERVICE_TIER_CONFIG,
  PROJECT_STATUS_CONFIG,
  DEPLOYMENT_STATUS_LABELS,
  REVENUE_STAGE_CONFIG,
  INSTALLER_TYPE_LABELS,
  ISP_TYPE_LABELS,
  ISP_TYPE_SELECT_LABELS,
  REPLAY_VERSION_LABELS,
  REPLAY_VERSION_SELECT_LABELS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  INVOICE_STATUS_CONFIG,
  BOM_CATEGORY_CONFIG,
  MOVEMENT_TYPE_CONFIG,
  SIGN_STATUS_CONFIG,
  CC_TERMINAL_STATUS_CONFIG,
  MDM_PROVIDER_LABELS,
  MDM_PROVIDER_SELECT_LABELS,
  DEVICE_MIGRATION_STATUS_CONFIG,
  MIGRATION_DEVICE_TYPE_LABELS,
  MIGRATION_DEVICE_STATUS_CONFIG,
  DEPLOYMENT_REGION_LABELS,
  VIDEO_STANDARD_LABELS,
  POWER_STANDARD_LABELS,
} from '@/lib/enum-labels'
```

All record keys are typed using the corresponding TypeScript union types from `src/types/database.ts`
(generated by `supabase gen types typescript`). No enum value is ever rendered raw in the UI — always
pass through the appropriate label map.

---

## Completeness Checklist

All 21 Postgres enum types are mapped:

- [x] `service_tier` — 4 values
- [x] `project_status` — 6 values
- [x] `deployment_status` — 7 values
- [x] `revenue_stage` — 6 values
- [x] `installer_type` — 2 values
- [x] `isp_type` — 4 values
- [x] `replay_service_version` — 2 values
- [x] `expense_category` — 12 values
- [x] `payment_method` — 2 values
- [x] `invoice_status` — 3 values
- [x] `bom_category` — 10 values
- [x] `inventory_movement_type` — 6 values
- [x] `sign_status` — 4 values
- [x] `cc_terminal_status` — 4 values
- [x] `mdm_provider` — 3 values
- [x] `device_migration_status` — 6 values
- [x] `migration_device_type` — 3 values
- [x] `migration_device_status` — 4 values
- [x] `deployment_region` — 2 values
- [x] `video_standard` — 2 values
- [x] `power_standard` — 2 values

**Total**: 94 enum values across 21 types. Zero unmapped.
