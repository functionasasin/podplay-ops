# PodPlay Ops Wizard — Settings Page

**Aspect**: design-settings
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Routes**: `/settings/pricing`, `/settings/catalog`, `/settings/team`, `/settings/travel`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `settings`, `hardware_catalog`, `team_contacts`
**Logic reference**: `final-mega-spec/business-logic/cost-analysis.md`, `final-mega-spec/business-logic/financial-reporting.md`

---

## Overview

The Settings section provides the single place to configure all values that affect pricing calculations,
BOM generation, cost chains, financial reporting, and operational defaults. It consists of four sub-pages
accessed via a horizontal tab bar.

| Tab | Route | Settings Table Fields | Other Tables |
|-----|-------|-----------------------|-------------|
| Pricing | `/settings/pricing` | Tier fees, cost chain rates, labor, BOM thresholds, ISP thresholds, operational defaults | — |
| Catalog | `/settings/catalog` | — | `hardware_catalog` (full CRUD) |
| Team | `/settings/team` | `rent_per_year`, `indirect_salaries_per_year` | `team_contacts` (full CRUD) |
| Travel | `/settings/travel` | `lodging_per_day`, `airfare_default`, `hours_per_day` | — |

**MRP equivalent**: The MRP has no dedicated Settings sheet — these values are embedded as named ranges
and formula constants in the COST ANALYSIS, FINANCIALS, and INVOICING sheets. The webapp centralizes
them here.

---

## File Structure

```
src/
├── routes/_auth/settings/
│   ├── index.tsx            # /settings → redirect to /settings/pricing
│   ├── pricing.tsx          # /settings/pricing
│   ├── catalog.tsx          # /settings/catalog
│   ├── team.tsx             # /settings/team
│   └── travel.tsx           # /settings/travel
├── components/settings/
│   ├── SettingsLayout.tsx   # Shared layout: heading + horizontal tab bar
│   ├── PricingSettings.tsx  # Pricing sub-page content
│   ├── CatalogSettings.tsx  # Catalog sub-page content
│   ├── TeamSettings.tsx     # Team sub-page content
│   └── TravelSettings.tsx   # Travel sub-page content
└── services/
    ├── settingsService.ts   # getSettings(), updateSettings()
    └── catalogService.ts    # getCatalogItems(), createCatalogItem(), updateCatalogItem(), deleteCatalogItem()
```

---

## Settings Layout — `SettingsLayout.tsx`

Wraps all four sub-pages with a consistent heading and horizontal tab bar.

```
┌──────────────────────────────────────────────────────────────────┐
│  Settings                                                         │
│  [Pricing] [Catalog] [Team] [Travel]                             │
├──────────────────────────────────────────────────────────────────┤
│  <sub-page content>                                               │
└──────────────────────────────────────────────────────────────────┘
```

**File**: `src/components/settings/SettingsLayout.tsx`

```tsx
// src/components/settings/SettingsLayout.tsx
import { Link, useMatchRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Pricing', to: '/settings/pricing' },
  { label: 'Catalog', to: '/settings/catalog' },
  { label: 'Team',    to: '/settings/team' },
  { label: 'Travel',  to: '/settings/travel' },
] as const

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const matchRoute = useMatchRoute()
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <nav className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = matchRoute({ to: tab.to, fuzzy: false })
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div>{children}</div>
    </div>
  )
}
```

Each sub-page route wraps its component in `<SettingsLayout>`.

---

## Index Redirect — `settings/index.tsx`

```tsx
// src/routes/_auth/settings/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/settings/')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/pricing', replace: true })
  },
})
```

---

## Tab 1: Pricing — `/settings/pricing`

### Route Configuration

**File**: `src/routes/_auth/settings/pricing.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getSettings } from '@/services/settingsService'
import { PricingSettings } from '@/components/settings/PricingSettings'

export const Route = createFileRoute('/_auth/settings/pricing')({
  loader: async () => getSettings(),
  component: () => {
    const settings = Route.useLoaderData()
    return (
      <SettingsLayout>
        <PricingSettings settings={settings} />
      </SettingsLayout>
    )
  },
  pendingComponent: SettingsSkeleton,
  errorComponent: SettingsError,
})
```

### Layout

The pricing sub-page is organized into five collapsible card sections:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Service Tier Fees                                         [section] │
│  Pro: Venue $5,000  Per-court $2,500                                │
│  Autonomous: Venue $7,500  Per-court $2,500                         │
│  Autonomous+: Venue $7,500  Per-court $2,500                        │
│  PBK: Venue $0  Per-court $0  [warning: not configured]             │
├─────────────────────────────────────────────────────────────────────┤
│  Cost Chain Rates                                          [section] │
│  Shipping Rate 10%   Target Margin 10%   Sales Tax 10.25%           │
│  Deposit % 50%                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Labor & Invoicing                                         [section] │
│  Labor Rate $120/hr   Hours/day 10                                  │
├─────────────────────────────────────────────────────────────────────┤
│  BOM Sizing Thresholds (Advanced)                         [section] │
│  Switch 24-port max courts: 10   Switch 48-port max courts: 20      │
│  SSD 1TB max courts: 4   SSD 2TB max courts: 12                     │
│  NVR 4-bay max cameras: 4                                           │
├─────────────────────────────────────────────────────────────────────┤
│  Operational Defaults                                      [section] │
│  Replay service version: v1                                         │
│  PO number prefix: PO   CC terminal PIN: 07139                      │
│  Mac Mini local IP: 192.168.32.100   Replay port: 4000              │
│  DDNS domain: podplaydns.com                                        │
│  Labels per court: 5   Replay sign multiplier: 2                    │
│  VLAN IDs: Default 30  Replay 32  Surveillance 31  Access 33        │
│  ISP fiber Mbps/court: 12   Cable upload min Mbps: 60               │
└─────────────────────────────────────────────────────────────────────┘
                                              [Save Changes]
```

### Form Fields (complete)

All fields use a single `useForm<PricingFormValues>` with React Hook Form + Zod.

**Section 1: Service Tier Fees**

| Field label | Field name | DB column | Type | Default | Validation |
|-------------|-----------|-----------|------|---------|-----------|
| Pro — Venue Fee | `pro_venue_fee` | `settings.pro_venue_fee` | currency | $5,000.00 | `z.number().min(0)` |
| Pro — Per-Court Fee | `pro_court_fee` | `settings.pro_court_fee` | currency | $2,500.00 | `z.number().min(0)` |
| Autonomous — Venue Fee | `autonomous_venue_fee` | `settings.autonomous_venue_fee` | currency | $7,500.00 | `z.number().min(0)` |
| Autonomous — Per-Court Fee | `autonomous_court_fee` | `settings.autonomous_court_fee` | currency | $2,500.00 | `z.number().min(0)` |
| Autonomous+ — Venue Fee | `autonomous_plus_venue_fee` | `settings.autonomous_plus_venue_fee` | currency | $7,500.00 | `z.number().min(0)` |
| Autonomous+ — Per-Court Fee | `autonomous_plus_court_fee` | `settings.autonomous_plus_court_fee` | currency | $2,500.00 | `z.number().min(0)` |
| PBK — Venue Fee | `pbk_venue_fee` | `settings.pbk_venue_fee` | currency | $0.00 | `z.number().min(0)` |
| PBK — Per-Court Fee | `pbk_court_fee` | `settings.pbk_court_fee` | currency | $0.00 | `z.number().min(0)` |

**PBK unconfigured warning**: Displayed inline below the PBK fee inputs when both
`pbk_venue_fee === 0` AND `pbk_court_fee === 0`:

```tsx
// Inline warning (not blocking)
<div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
  <AlertTriangle className="h-4 w-4 shrink-0" />
  <span>
    PBK pricing is not configured. PBK projects will show $0 service fees until
    these values are set. Enter the Pickleball Kingdom venue fee and per-court fee
    from the PBK contract.
  </span>
</div>
```

**Section 2: Cost Chain Rates**

| Field label | Field name | DB column | Type | Default | Validation | Help text |
|-------------|-----------|-----------|------|---------|-----------|-----------|
| Shipping Rate | `shipping_rate` | `settings.shipping_rate` | percent | 10% | `z.number().min(0).max(1)` | Applied to BOM cost → landed cost. `landed = cost × (1 + rate)` |
| Target Margin | `target_margin` | `settings.target_margin` | percent | 10% | `z.number().min(0).max(0.99)` | Customer price markup. `price = landed / (1 − margin)` |
| Sales Tax Rate | `sales_tax_rate` | `settings.sales_tax_rate` | percent | 10.25% | `z.number().min(0).max(1)` | Applied to invoice subtotal. `tax = subtotal × rate` |
| Deposit Percentage | `deposit_pct` | `settings.deposit_pct` | percent | 50% | `z.number().min(0.01).max(0.99)` | First installment as % of invoice total |

Percent fields display with `%` suffix in the input. The stored value is the decimal
(e.g., `0.1025`), but the input shows `10.25` and multiplies by `0.01` on save.

```tsx
// Percent input pattern
<Controller
  name="sales_tax_rate"
  control={control}
  render={({ field }) => (
    <div className="relative">
      <Input
        type="number"
        step="0.01"
        min="0"
        max="100"
        value={field.value * 100}
        onChange={(e) => field.onChange(parseFloat(e.target.value) / 100)}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
    </div>
  )}
/>
```

**Section 3: Labor & Invoicing**

| Field label | Field name | DB column | Type | Default | Validation |
|-------------|-----------|-----------|------|---------|-----------|
| Labor Rate (per hour) | `labor_rate_per_hour` | `settings.labor_rate_per_hour` | currency | $120.00 | `z.number().min(0)` |
| Hours per Day | `hours_per_day` | `settings.hours_per_day` | integer | 10 | `z.number().int().min(1).max(24)` |

**Section 4: BOM Sizing Thresholds** (labeled "Advanced" with `<details>` disclosure)

| Field label | Field name | DB column | Type | Default | Validation | Description |
|-------------|-----------|-----------|------|---------|-----------|-------------|
| Switch 24-port: max courts | `switch_24_max_courts` | `settings.switch_24_max_courts` | integer | 10 | `z.number().int().min(1)` | Use USW-Pro-24-POE for court_count ≤ this |
| Switch 48-port: max courts | `switch_48_max_courts` | `settings.switch_48_max_courts` | integer | 20 | `z.number().int().min(1)` | Use USW-Pro-48-POE for court_count ≤ this |
| SSD 1TB: max courts | `ssd_1tb_max_courts` | `settings.ssd_1tb_max_courts` | integer | 4 | `z.number().int().min(1)` | Use Samsung T7 1TB for court_count ≤ this |
| SSD 2TB: max courts | `ssd_2tb_max_courts` | `settings.ssd_2tb_max_courts` | integer | 12 | `z.number().int().min(1)` | Use Samsung T7 2TB for court_count ≤ this; >this uses 4TB |
| NVR 4-bay: max cameras | `nvr_4bay_max_cameras` | `settings.nvr_4bay_max_cameras` | integer | 4 | `z.number().int().min(1)` | Use UNVR (4-bay) for security_camera_count ≤ this |

Cross-validation on submit: `switch_24_max_courts < switch_48_max_courts` and
`ssd_1tb_max_courts < ssd_2tb_max_courts`. If violated, show field-level error:
"Must be less than the 48-port threshold." / "Must be less than the 2TB threshold."

ISP Thresholds (in same Advanced section):

| Field label | Field name | DB column | Type | Default | Validation |
|-------------|-----------|-----------|------|---------|-----------|
| ISP fiber Mbps per court | `isp_fiber_mbps_per_court` | `settings.isp_fiber_mbps_per_court` | integer | 12 | `z.number().int().min(1)` |
| ISP cable upload min Mbps | `isp_cable_upload_min_mbps` | `settings.isp_cable_upload_min_mbps` | integer | 60 | `z.number().int().min(1)` |

**Section 5: Operational Defaults**

| Field label | Field name | DB column | Type | Default | Validation | Description |
|-------------|-----------|-----------|------|---------|-----------|-------------|
| Replay Service Version | `default_replay_service_version` | `settings.default_replay_service_version` | select | v1 | `z.enum(['v1','v2'])` | Default for new projects; switch to v2 at April 2026 launch |
| PO Number Prefix | `po_number_prefix` | `settings.po_number_prefix` | text | PO | `z.string().min(1).max(10)` | Produces: `{prefix}-{YYYY}-{NNN}` |
| CC Terminal PIN | `cc_terminal_pin` | `settings.cc_terminal_pin` | text | 07139 | `z.string().min(1).max(10)` | Displayed in Phase 15 checklist (BBPOS WisePOS E admin PIN) |
| Mac Mini Local IP | `mac_mini_local_ip` | `settings.mac_mini_local_ip` | text | 192.168.32.100 | `z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)` | Fixed IP on REPLAY VLAN; port-forward target for port 4000 |
| Replay Port | `replay_port` | `settings.replay_port` | integer | 4000 | `z.number().int().min(1).max(65535)` | TCP/UDP port for replay service; forwarded from ISP router |
| DDNS Domain | `ddns_domain` | `settings.ddns_domain` | text | podplaydns.com | `z.string().min(1)` | Base domain; full URL: `http://{subdomain}.{domain}:{port}` |
| Labels per Court | `label_sets_per_court` | `settings.label_sets_per_court` | integer | 5 | `z.number().int().min(1)` | Device labels printed at unboxing per court |
| Replay Sign Multiplier | `replay_sign_multiplier` | `settings.replay_sign_multiplier` | integer | 2 | `z.number().int().min(1)` | Replay signs = court_count × this value |
| Default VLAN: ID | `default_vlan_id` | `settings.default_vlan_id` | integer | 30 | `z.number().int().min(1).max(4094)` | Management / untagged traffic VLAN |
| REPLAY VLAN: ID | `replay_vlan_id` | `settings.replay_vlan_id` | integer | 32 | `z.number().int().min(1).max(4094)` | Replay system VLAN (Mac Mini + cameras) |
| SURVEILLANCE VLAN: ID | `surveillance_vlan_id` | `settings.surveillance_vlan_id` | integer | 31 | `z.number().int().min(1).max(4094)` | Security camera VLAN (Autonomous+ only) |
| ACCESS CONTROL VLAN: ID | `access_control_vlan_id` | `settings.access_control_vlan_id` | integer | 33 | `z.number().int().min(1).max(4094)` | Kisi access control VLAN (Autonomous/Autonomous+) |

### Zod Schema — PricingFormValues

```ts
// src/components/settings/PricingSettings.tsx
import { z } from 'zod'

const pricingFormSchema = z.object({
  // Service tier fees
  pro_venue_fee:               z.number().min(0),
  pro_court_fee:               z.number().min(0),
  autonomous_venue_fee:        z.number().min(0),
  autonomous_court_fee:        z.number().min(0),
  autonomous_plus_venue_fee:   z.number().min(0),
  autonomous_plus_court_fee:   z.number().min(0),
  pbk_venue_fee:               z.number().min(0),
  pbk_court_fee:               z.number().min(0),

  // Cost chain rates (stored as decimals: 0.10 = 10%)
  shipping_rate:               z.number().min(0).max(1),
  target_margin:               z.number().min(0).max(0.9999),
  sales_tax_rate:              z.number().min(0).max(1),
  deposit_pct:                 z.number().min(0.01).max(0.99),

  // Labor
  labor_rate_per_hour:         z.number().min(0),
  hours_per_day:               z.number().int().min(1).max(24),

  // BOM thresholds
  switch_24_max_courts:        z.number().int().min(1),
  switch_48_max_courts:        z.number().int().min(1),
  ssd_1tb_max_courts:          z.number().int().min(1),
  ssd_2tb_max_courts:          z.number().int().min(1),
  nvr_4bay_max_cameras:        z.number().int().min(1),

  // ISP thresholds
  isp_fiber_mbps_per_court:    z.number().int().min(1),
  isp_cable_upload_min_mbps:   z.number().int().min(1),

  // Operational defaults
  default_replay_service_version: z.enum(['v1', 'v2']),
  po_number_prefix:            z.string().min(1).max(10),
  cc_terminal_pin:             z.string().min(1).max(10),
  mac_mini_local_ip:           z.string().regex(
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    'Must be a valid IPv4 address'
  ),
  replay_port:                 z.number().int().min(1).max(65535),
  ddns_domain:                 z.string().min(1),
  label_sets_per_court:        z.number().int().min(1),
  replay_sign_multiplier:      z.number().int().min(1),
  default_vlan_id:             z.number().int().min(1).max(4094),
  replay_vlan_id:              z.number().int().min(1).max(4094),
  surveillance_vlan_id:        z.number().int().min(1).max(4094),
  access_control_vlan_id:      z.number().int().min(1).max(4094),
}).refine(
  (d) => d.switch_24_max_courts < d.switch_48_max_courts,
  {
    message: 'Must be less than the 48-port threshold',
    path: ['switch_24_max_courts'],
  }
).refine(
  (d) => d.ssd_1tb_max_courts < d.ssd_2tb_max_courts,
  {
    message: 'Must be less than the 2TB threshold',
    path: ['ssd_1tb_max_courts'],
  }
)

export type PricingFormValues = z.infer<typeof pricingFormSchema>
```

### Save Behavior

- Single "Save Changes" button at bottom of page; `type="submit"` on the `<form>`
- On submit: calls `updateSettings(values)` from `settingsService`
- On success: `toast.success('Settings saved')`; invalidates `settingsQuery` in React Query
- On error: `toast.error('Failed to save settings: ' + error.message)`
- Button shows `<Loader2 className="animate-spin" />` while saving; disabled during save
- Form does NOT auto-save; user must explicitly click Save

### Service Layer

**File**: `src/services/settingsService.ts`

```ts
import { supabase } from '@/lib/supabase'
import type { Settings } from '@/types/settings'

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}
```

---

## Tab 2: Catalog — `/settings/catalog`

### Route Configuration

**File**: `src/routes/_auth/settings/catalog.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getCatalogItems } from '@/services/catalogService'
import { CatalogSettings } from '@/components/settings/CatalogSettings'

const catalogSearchSchema = z.object({
  category: z.string().optional(),
  q:        z.string().optional(),
  inactive: z.boolean().default(false),
})

export const Route = createFileRoute('/_auth/settings/catalog')({
  validateSearch: (s) => catalogSearchSchema.parse(s),
  loader: async ({ search }) =>
    getCatalogItems({ category: search.category, q: search.q, includeInactive: search.inactive }),
  component: () => {
    const items = Route.useLoaderData()
    return (
      <SettingsLayout>
        <CatalogSettings items={items} />
      </SettingsLayout>
    )
  },
  pendingComponent: SettingsSkeleton,
  errorComponent: SettingsError,
})
```

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Hardware Catalog                             [+ Add Item]           │
│  [Search...] [Category: All ▾] [Show inactive: □]                    │
├─────────────────────────────────────────────────────────────────────┤
│  SKU          │ Name              │ Category  │ Vendor   │ Cost │ ⋮  │
│──────────────────────────────────────────────────────────────────── │
│  NET-UDM-SE   │ UniFi Dream Mac…  │ Network   │ UniFi    │ —    │ ⋮  │
│  REPLAY-MACM… │ Mac Mini 16GB …   │ Replay    │ Apple    │ —    │ ⋮  │
│  ...          │                   │           │          │      │    │
└──────────────────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Source | Display |
|--------|--------|---------|
| SKU | `hardware_catalog.sku` | Monospace text, truncated at 16 chars with tooltip |
| Name | `hardware_catalog.name` | Full name; truncated at 30 chars with tooltip showing full name |
| Category | `hardware_catalog.category` | Category badge (see badge colors below) |
| Vendor | `hardware_catalog.vendor` | Plain text |
| Unit Cost | `hardware_catalog.unit_cost` | `$xxx.xx` or `—` if NULL |
| Actions | — | `⋮` kebab menu: Edit, Deactivate (or Reactivate if inactive) |

**Category badge colors** (mapped from `bom_category` enum):

| bom_category value | Badge label | Badge color class |
|-------------------|-------------|-------------------|
| `network_rack` | Network | `bg-blue-100 text-blue-800` |
| `infrastructure` | Infra | `bg-gray-100 text-gray-800` |
| `replay_system` | Replay | `bg-purple-100 text-purple-800` |
| `displays` | Displays | `bg-green-100 text-green-800` |
| `access_control` | Access | `bg-orange-100 text-orange-800` |
| `surveillance` | Surveil. | `bg-red-100 text-red-800` |
| `front_desk` | Front Desk | `bg-teal-100 text-teal-800` |
| `pingpod_specific` | PingPod | `bg-yellow-100 text-yellow-800` |
| `signage` | Signage | `bg-indigo-100 text-indigo-800` |
| `misc` | Misc | `bg-slate-100 text-slate-800` |

**Inactive items**: Row has `opacity-50`; "Inactive" badge appended to name column.
Shown only when "Show inactive" checkbox is checked (default: hidden).

### Filters

- **Search** (`q`): filters on `name ILIKE '%q%' OR sku ILIKE '%q%'` — client-side filtering against loaded items (catalog is small, <60 items, no need for server-side)
- **Category** (`category`): dropdown with "All" + each `bom_category` enum value; filters to matching category
- **Show inactive** (`inactive`): boolean checkbox; when unchecked, `is_active = true` items only

### Add / Edit Item — Sheet Dialog

Clicking "+ Add Item" or "Edit" in the kebab menu opens a `<Sheet>` (right-side drawer, 480px width)
containing the item form.

**Sheet title**: "Add Hardware Item" (for new) / "Edit Hardware Item" (for edit)

**Form fields** (all inside the sheet):

| Field label | Field name | DB column | Type | Required | Validation |
|-------------|-----------|-----------|------|----------|-----------|
| SKU | `sku` | `hardware_catalog.sku` | text | Yes | `z.string().min(1).max(50).regex(/^[A-Z0-9\-]+$/, 'Uppercase letters, numbers, hyphens only')` |
| Name | `name` | `hardware_catalog.name` | text | Yes | `z.string().min(1).max(200)` |
| Model | `model` | `hardware_catalog.model` | text | No | `z.string().max(100).optional()` |
| Category | `category` | `hardware_catalog.category` | select | Yes | `z.enum(bom_category_values)` |
| Vendor | `vendor` | `hardware_catalog.vendor` | text | Yes | `z.string().min(1).max(100)` |
| Vendor URL | `vendor_url` | `hardware_catalog.vendor_url` | text | No | `z.string().url().optional().or(z.literal(''))` |
| Unit Cost | `unit_cost` | `hardware_catalog.unit_cost` | currency | No | `z.number().min(0).nullable()` |
| Notes | `notes` | `hardware_catalog.notes` | textarea | No | `z.string().max(500).optional()` |

**SKU field behavior** (new item only): SKU is editable. On existing items, SKU is shown read-only
with help text "SKU cannot be changed after creation — it is referenced by BOM templates and inventory."

**Category select options** (full list from `bom_category` enum):
- `network_rack` → "Network Rack"
- `infrastructure` → "Infrastructure"
- `replay_system` → "Replay System"
- `displays` → "Displays"
- `access_control` → "Access Control"
- `surveillance` → "Surveillance"
- `front_desk` → "Front Desk"
- `pingpod_specific` → "PingPod Specific"
- `signage` → "Signage"
- `misc` → "Misc"

**Sheet footer** (sticky at bottom of drawer):
- "Cancel" button: closes sheet, discards changes
- "Save Item" button: submits form; shows spinner while saving

**On save (new item)**:
1. Call `createCatalogItem(values)` → inserts row in `hardware_catalog`
2. On success: close sheet, `toast.success('Item added')`, reload table
3. On duplicate SKU error (Postgres unique violation): show field error on SKU: "This SKU already exists."

**On save (edit)**:
1. Call `updateCatalogItem(id, values)` → updates row
2. On success: close sheet, `toast.success('Item updated')`, reload table

### Deactivate / Reactivate

From kebab menu:
- "Deactivate": shows `<AlertDialog>` — "Deactivate [Name]? It will no longer appear in BOM selections but will remain in existing BOMs." — confirm button calls `deactivateCatalogItem(id)`
- "Reactivate": immediate call to `reactivateCatalogItem(id)`, no confirmation needed

### Service Layer

**File**: `src/services/catalogService.ts`

```ts
import { supabase } from '@/lib/supabase'
import type { HardwareCatalogItem } from '@/types/catalog'

export async function getCatalogItems(opts?: {
  category?: string
  q?: string
  includeInactive?: boolean
}): Promise<HardwareCatalogItem[]> {
  let query = supabase
    .from('hardware_catalog')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (!opts?.includeInactive) {
    query = query.eq('is_active', true)
  }
  if (opts?.category) {
    query = query.eq('category', opts.category)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createCatalogItem(
  item: Omit<HardwareCatalogItem, 'id' | 'created_at' | 'updated_at'>
): Promise<HardwareCatalogItem> {
  const { data, error } = await supabase
    .from('hardware_catalog')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCatalogItem(
  id: string,
  patch: Partial<Omit<HardwareCatalogItem, 'id' | 'sku' | 'created_at' | 'updated_at'>>
): Promise<HardwareCatalogItem> {
  const { data, error } = await supabase
    .from('hardware_catalog')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deactivateCatalogItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('hardware_catalog')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

export async function reactivateCatalogItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('hardware_catalog')
    .update({ is_active: true })
    .eq('id', id)
  if (error) throw error
}
```

---

## Tab 3: Team — `/settings/team`

### Route Configuration

**File**: `src/routes/_auth/settings/team.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getSettings } from '@/services/settingsService'
import { getTeamContacts } from '@/services/teamContactsService'
import { TeamSettings } from '@/components/settings/TeamSettings'

export const Route = createFileRoute('/_auth/settings/team')({
  loader: async () => {
    const [settings, contacts] = await Promise.all([
      getSettings(),
      getTeamContacts({ includeInactive: false }),
    ])
    return { settings, contacts }
  },
  component: () => {
    const { settings, contacts } = Route.useLoaderData()
    return (
      <SettingsLayout>
        <TeamSettings settings={settings} contacts={contacts} />
      </SettingsLayout>
    )
  },
  pendingComponent: SettingsSkeleton,
  errorComponent: SettingsError,
})
```

### Layout

The Team sub-page has two sections:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Section 1: HER / OpEx Configuration                                 │
│  These values feed into the Hardware Efficiency Ratio calculation.   │
│                                                                      │
│  Annual Rent            [$27,600.00         ]                        │
│  Indirect Salaries/yr   [$147,000.00        ]                        │
│                                             [Save OpEx Settings]    │
├──────────────────────────────────────────────────────────────────────┤
│  Section 2: Team Contacts                             [+ Add Contact] │
│  [Show inactive: □]                                                  │
│                                                                      │
│  Name          │ Role              │ Dept    │ Phone    │ Tier │ ⋮   │
│──────────────────────────────────────────────────────────────────── │
│  Andy Korz…    │ Project Manager…  │ PM      │ 917-937… │  —   │ ⋮   │
│  Nico          │ Hardware & Inst…  │ HW      │ —        │  2   │ ⋮   │
│  Chad          │ Head of Ops…      │ Ops     │ —        │  —   │ ⋮   │
│  Stan Wu       │ Config Special…   │ Config  │ —        │  2   │ ⋮   │
│  Agustin       │ App Readiness…    │ App     │ —        │  —   │ ⋮   │
│  CS Team       │ Customer Succ…    │ CS      │ —        │  —   │ ⋮   │
│  Patrick       │ Engineer/Dev…     │ Eng     │ —        │  3   │ ⋮   │
└──────────────────────────────────────────────────────────────────────┘
```

### Section 1: HER / OpEx Configuration

Two fields only; rendered as a small card with its own save button (separate from contacts).

| Field label | Field name | DB column | Type | Default | Validation | Help text |
|-------------|-----------|-----------|------|---------|-----------|-----------|
| Annual Rent | `rent_per_year` | `settings.rent_per_year` | currency | $27,600.00 | `z.number().min(0)` | NJ lab/office space allocated to hardware OpEx |
| Indirect Salaries (per year) | `indirect_salaries_per_year` | `settings.indirect_salaries_per_year` | currency | $147,000.00 | `z.number().min(0)` | Annual indirect salary pool allocated to hardware overhead |

**Note** displayed below the two inputs:
```
Individual salary allocations (Niko direct %, Chad indirect %) are entered in the
Monthly Close workflow on the Financials page, where they are snapshotted per period.
```

**Save**: "Save OpEx Settings" button calls `updateSettings({ rent_per_year, indirect_salaries_per_year })`.

**Zod schema** for this subsection:
```ts
const opexFormSchema = z.object({
  rent_per_year:              z.number().min(0),
  indirect_salaries_per_year: z.number().min(0),
})
```

### Section 2: Team Contacts

**Contacts table columns**:

| Column | Source | Display |
|--------|--------|---------|
| Name | `team_contacts.name` | Full name |
| Role | `team_contacts.role` | Truncated at 40 chars with tooltip |
| Dept | `team_contacts.department` | Department badge (see below) |
| Phone | `team_contacts.phone` | Phone number or `—` |
| Email | `team_contacts.email` | Email (truncated) or `—` |
| Contact Via | `team_contacts.contact_via` | Text or `—` |
| Support Tier | `team_contacts.support_tier` | Pill: Tier 1 (green), Tier 2 (amber), Tier 3 (red); blank if NULL |
| Actions | — | `⋮` kebab: Edit, Deactivate/Reactivate |

**Department badge values and colors** (from `team_contacts.department`):

| department value | Badge label | Badge class |
|-----------------|-------------|------------|
| `pm` | PM | `bg-blue-100 text-blue-800` |
| `hardware` | Hardware | `bg-purple-100 text-purple-800` |
| `operations` | Operations | `bg-gray-100 text-gray-800` |
| `config` | Config | `bg-orange-100 text-orange-800` |
| `app` | App | `bg-green-100 text-green-800` |
| `cs` | CS | `bg-teal-100 text-teal-800` |
| `engineering` | Engineering | `bg-red-100 text-red-800` |

**Support tier pill**:
```tsx
function SupportTierPill({ tier }: { tier: number | null }) {
  if (!tier) return <span className="text-muted-foreground">—</span>
  const map = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-amber-100 text-amber-800',
    3: 'bg-red-100 text-red-800',
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', map[tier])}>
      Tier {tier}
    </span>
  )
}
```

### Add / Edit Contact — Sheet Dialog

Sheet opens on "+ Add Contact" or "Edit" from kebab menu.

**Sheet title**: "Add Team Contact" / "Edit Team Contact"

**Form fields**:

| Field label | Field name | DB column | Type | Required | Validation |
|-------------|-----------|-----------|------|----------|-----------|
| Name | `name` | `team_contacts.name` | text | Yes | `z.string().min(1).max(100)` |
| Role | `role` | `team_contacts.role` | text | Yes | `z.string().min(1).max(200)` |
| Department | `department` | `team_contacts.department` | select | Yes | `z.enum(['pm','hardware','operations','config','app','cs','engineering'])` |
| Phone | `phone` | `team_contacts.phone` | text | No | `z.string().max(30).optional().nullable()` |
| Email | `email` | `team_contacts.email` | text (email) | No | `z.string().email().optional().nullable().or(z.literal(''))` |
| Contact Via | `contact_via` | `team_contacts.contact_via` | text | No | `z.string().max(100).optional().nullable()` — e.g., "Via Chad", "Slack #installs" |
| Support Tier | `support_tier` | `team_contacts.support_tier` | select | No | `z.number().int().min(1).max(3).nullable()` |
| Notes | `notes` | `team_contacts.notes` | textarea (4 rows) | No | `z.string().max(1000).optional().nullable()` |

**Department select options**:
- PM
- Hardware
- Operations
- Config
- App
- CS
- Engineering

**Support Tier select options**: None (null), Tier 1, Tier 2, Tier 3

**On save**: calls `createTeamContact(values)` or `updateTeamContact(id, values)`.
On success: close sheet, `toast.success('Contact saved')`, reload contacts list.

### Service Layer

**File**: `src/services/teamContactsService.ts`

```ts
import { supabase } from '@/lib/supabase'
import type { TeamContact } from '@/types/teamContact'

export async function getTeamContacts(opts?: {
  includeInactive?: boolean
}): Promise<TeamContact[]> {
  let query = supabase
    .from('team_contacts')
    .select('*')
    .order('department')
    .order('name')

  if (!opts?.includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createTeamContact(
  contact: Omit<TeamContact, 'id' | 'created_at' | 'updated_at'>
): Promise<TeamContact> {
  const { data, error } = await supabase
    .from('team_contacts')
    .insert(contact)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTeamContact(
  id: string,
  patch: Partial<Omit<TeamContact, 'id' | 'created_at' | 'updated_at'>>
): Promise<TeamContact> {
  const { data, error } = await supabase
    .from('team_contacts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deactivateTeamContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_contacts')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

export async function reactivateTeamContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_contacts')
    .update({ is_active: true })
    .eq('id', id)
  if (error) throw error
}
```

---

## Tab 4: Travel — `/settings/travel`

### Route Configuration

**File**: `src/routes/_auth/settings/travel.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getSettings } from '@/services/settingsService'
import { TravelSettings } from '@/components/settings/TravelSettings'

export const Route = createFileRoute('/_auth/settings/travel')({
  loader: async () => getSettings(),
  component: () => {
    const settings = Route.useLoaderData()
    return (
      <SettingsLayout>
        <TravelSettings settings={settings} />
      </SettingsLayout>
    )
  },
  pendingComponent: SettingsSkeleton,
  errorComponent: SettingsError,
})
```

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Travel Defaults                                                      │
│  These values pre-fill expense entries. You can override per-project.│
│                                                                      │
│  Lodging per night     [$250.00          ]                           │
│  Airfare (round trip)  [$1,800.00        ]                           │
│  Hours per day         [10               ]                           │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ When to use these defaults                                       │ │
│  │                                                                  │ │
│  │ Lodging: pre-fills the Amount field when adding a "Lodging"     │ │
│  │ expense in Stage 4 (Financials). Override per-project.          │ │
│  │                                                                  │ │
│  │ Airfare: pre-fills the Amount field for "Airfare" expenses.     │ │
│  │                                                                  │ │
│  │ Hours/day: used to estimate installation duration.              │ │
│  │ estimated_days = ceil(total_hours / hours_per_day)              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                    [Save Changes]    │
└──────────────────────────────────────────────────────────────────────┘
```

### Form Fields

| Field label | Field name | DB column | Type | Default | Validation |
|-------------|-----------|-----------|------|---------|-----------|
| Lodging per night | `lodging_per_day` | `settings.lodging_per_day` | currency | $250.00 | `z.number().min(0)` |
| Airfare (round trip) | `airfare_default` | `settings.airfare_default` | currency | $1,800.00 | `z.number().min(0)` |
| Hours per day | `hours_per_day` | `settings.hours_per_day` | integer | 10 | `z.number().int().min(1).max(24)` |

### Zod Schema

```ts
const travelFormSchema = z.object({
  lodging_per_day:   z.number().min(0),
  airfare_default:   z.number().min(0),
  hours_per_day:     z.number().int().min(1).max(24),
})
export type TravelFormValues = z.infer<typeof travelFormSchema>
```

### Save Behavior

Same pattern as Pricing tab: single "Save Changes" submit button; calls
`updateSettings({ lodging_per_day, airfare_default, hours_per_day })`;
`toast.success('Settings saved')` on success.

---

## Shared Skeleton / Error Components

**File**: `src/components/settings/SettingsSkeleton.tsx`

```tsx
export function SettingsSkeleton() {
  return (
    <SettingsLayout>
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-md bg-muted" />
        ))}
      </div>
    </SettingsLayout>
  )
}
```

**File**: `src/components/settings/SettingsError.tsx`

```tsx
export function SettingsError({ error }: { error: Error }) {
  return (
    <SettingsLayout>
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium">Failed to load settings</p>
        <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </SettingsLayout>
  )
}
```

---

## Complete File Creation List

These files must be created for the Settings section:

```
src/
├── routes/_auth/settings/
│   ├── index.tsx                    # Redirect to /settings/pricing
│   ├── pricing.tsx                  # /settings/pricing route
│   ├── catalog.tsx                  # /settings/catalog route
│   ├── team.tsx                     # /settings/team route
│   └── travel.tsx                   # /settings/travel route
├── components/settings/
│   ├── SettingsLayout.tsx           # Shared layout: heading + tab bar
│   ├── SettingsSkeleton.tsx         # Loading skeleton
│   ├── SettingsError.tsx            # Error boundary display
│   ├── PricingSettings.tsx          # Pricing sub-page component
│   ├── CatalogSettings.tsx          # Catalog sub-page component
│   ├── TeamSettings.tsx             # Team sub-page component
│   └── TravelSettings.tsx           # Travel sub-page component
├── services/
│   ├── settingsService.ts           # getSettings(), updateSettings()
│   ├── catalogService.ts            # getCatalogItems(), createCatalogItem(), updateCatalogItem(), deactivateCatalogItem(), reactivateCatalogItem()
│   └── teamContactsService.ts       # getTeamContacts(), createTeamContact(), updateTeamContact(), deactivateTeamContact(), reactivateTeamContact()
└── types/
    ├── settings.ts                  # Settings type (mirrors DB columns)
    ├── catalog.ts                   # HardwareCatalogItem type
    └── teamContact.ts               # TeamContact type
```

---

## TypeScript Types

**File**: `src/types/settings.ts`

```ts
export interface Settings {
  id: number
  updated_at: string

  // Pricing tiers
  pro_venue_fee: number
  pro_court_fee: number
  autonomous_venue_fee: number
  autonomous_court_fee: number
  autonomous_plus_venue_fee: number
  autonomous_plus_court_fee: number
  pbk_venue_fee: number
  pbk_court_fee: number

  // Cost chain
  shipping_rate: number
  target_margin: number
  sales_tax_rate: number
  deposit_pct: number

  // Labor
  labor_rate_per_hour: number
  hours_per_day: number

  // Travel
  lodging_per_day: number
  airfare_default: number

  // Team OpEx
  rent_per_year: number
  indirect_salaries_per_year: number

  // BOM thresholds
  switch_24_max_courts: number
  switch_48_max_courts: number
  ssd_1tb_max_courts: number
  ssd_2tb_max_courts: number
  nvr_4bay_max_cameras: number

  // ISP thresholds
  isp_fiber_mbps_per_court: number
  isp_cable_upload_min_mbps: number

  // Operational
  default_replay_service_version: 'v1' | 'v2'
  po_number_prefix: string
  mac_mini_local_ip: string
  replay_port: number
  ddns_domain: string
  cc_terminal_pin: string
  label_sets_per_court: number
  replay_sign_multiplier: number
  default_vlan_id: number
  replay_vlan_id: number
  surveillance_vlan_id: number
  access_control_vlan_id: number
}
```

**File**: `src/types/catalog.ts`

```ts
export type BomCategory =
  | 'network_rack'
  | 'infrastructure'
  | 'replay_system'
  | 'displays'
  | 'access_control'
  | 'surveillance'
  | 'front_desk'
  | 'pingpod_specific'
  | 'signage'
  | 'misc'

export interface HardwareCatalogItem {
  id: string
  created_at: string
  updated_at: string
  sku: string
  name: string
  model: string | null
  vendor: string
  vendor_url: string | null
  unit_cost: number | null
  category: BomCategory
  notes: string | null
  is_active: boolean
}
```

**File**: `src/types/teamContact.ts`

```ts
export type Department =
  | 'pm'
  | 'hardware'
  | 'operations'
  | 'config'
  | 'app'
  | 'cs'
  | 'engineering'

export interface TeamContact {
  id: string
  created_at: string
  updated_at: string
  slug: string
  name: string
  role: string
  department: Department
  phone: string | null
  email: string | null
  contact_via: string | null
  support_tier: 1 | 2 | 3 | null
  notes: string | null
  is_active: boolean
}
```

---

## MRP Cross-Reference

| Settings field | MRP equivalent | MRP sheet |
|---------------|----------------|-----------|
| `pro_venue_fee` ($5,000) | "Venue Fee" row for Pro | COST ANALYSIS |
| `pro_court_fee` ($2,500) | "Per Court Fee" row for Pro | COST ANALYSIS |
| `autonomous_venue_fee` ($7,500) | "Venue Fee" row for Autonomous | COST ANALYSIS |
| `sales_tax_rate` (10.25%) | Tax rate formula constant | INVOICING |
| `shipping_rate` (10%) | Shipping/freight % | COST ANALYSIS |
| `target_margin` (10%) | Margin/markup % | COST ANALYSIS |
| `deposit_pct` (50%) | Deposit % split | INVOICING |
| `labor_rate_per_hour` ($120) | Labor rate | EXPENSES/COST ANALYSIS |
| `lodging_per_day` ($250) | Lodging default | EXPENSES |
| `airfare_default` ($1,800) | Airfare default | EXPENSES |
| `rent_per_year` ($27,600) | Annual rent line | FINANCIALS |
| `indirect_salaries_per_year` ($147,000) | Indirect salaries pool | FINANCIALS |
| `cc_terminal_pin` (07139) | PIN note in hardware BOM | Hardware BOM notes |
| `replay_port` (4000) | Port 4000 reference | Config guide / deployment guide |
| `mac_mini_local_ip` (192.168.32.100) | Mac Mini IP assignment | Config guide Phase 4 |
| Team contacts (7 rows) | Key Contacts table | Deployment guide Appendix C |
