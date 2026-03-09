# PodPlay Forward Loop — QA Findings

> Manual QA pass on 2026-03-09. Captures gaps, logic issues, and QOL misses from the forward loop.
> Goal: (1) feed into a follow-up forward loop, (2) document patterns to prevent in future passes.

## Categories

- **LOGIC** — Wrong calculation, bad state, incorrect data flow
- **WIRING** — Route/component exists but not connected or renders wrong thing
- **QOL** — Minor UX friction, missing polish, inconsistent patterns
- **MISSING** — Feature/view described in spec but not implemented
- **DATA** — Seed data issues, schema mismatches, missing defaults

---

## Findings

### F01 — No UI to manage installers
- **Category**: MISSING
- **Location**: Settings pages, `InstallerSelectionStep.tsx`
- **Expected**: A Settings > Installers page (similar to Settings > Team) where users can add/edit/deactivate installers. The `installers` table exists in `00002_core_tables.sql` with fields: name, company, email, phone, installer_type, regions, certifications, rate_per_hour, is_active, notes.
- **Actual**: No route or component exists to manage installers. The intake wizard's InstallerSelectionStep queries `installers` table but it's always empty, showing "No installers found." with no way to add one.
- **Notes**: This is a blocker for completing the intake wizard. Need: (1) Settings route `/settings/installers`, (2) CRUD component like TeamSettings, (3) Seed data for default installers. The `team_contacts` pattern can be reused almost 1:1.

### F02 — Remove Pickleball Kingdom (PBK) service tier
- **Category**: QOL
- **Location**: `TierSelectionStep.tsx`, `PricingSettings.tsx`, `bom-generation.ts`, `enum-labels.ts`, `types.ts`, `VlanReferencePanel.tsx`, + tests
- **Expected**: Only 3 tiers: Pro, Autonomous, Autonomous+
- **Actual**: PBK was a 4th tier with identical hardware to Pro but custom pricing. Not relevant to current use.
- **Status**: FIXED — removed `pbk` from ServiceTier type, all UI components, BOM templates, pricing settings, and tests. DB enum still has it (migration needed separately).

### F03 — ISP info step should have finite PH ISP list
- **Category**: QOL
- **Location**: ISP info step in intake wizard
- **Expected**: Since there's a finite set of ISPs in the Philippines, the ISP selection should be a curated dropdown (e.g., PLDT, Globe, Converge, Sky) rather than a freeform input.
- **Actual**: Likely a generic text input. Needs a reverse pass to enumerate PH ISPs, then a forward pass to implement as a searchable dropdown.
- **Notes**: Good candidate for a mini reverse+forward loop. Finite domain = easy to enumerate.

### F04 — Clicking existing project resets to step 1
- **Category**: WIRING
- **Location**: Project detail / intake route (`routes/_auth/projects/$projectId/intake.tsx`)
- **Expected**: Opening an existing project should resume at the current wizard step (or show a summary/overview).
- **Actual**: Always starts at step 1 of the wizard, losing context of where the project actually is.
- **Notes**: Wizard state likely not persisted to DB or not read back on load.

### F05 — Procurement tabs use wrong column name `qty` instead of `quantity`
- **Category**: LOGIC
- **Location**: `InventoryCheckPanel.tsx`, `PoCreateForm.tsx`, `PackingList.tsx`
- **Expected**: All procurement components should query `quantity` column from `project_bom_items`.
- **Actual**: Three components selected `qty` (non-existent column) instead of `quantity`. This caused Supabase to return null/undefined for the quantity, making the BOM appear empty in Inventory Check, PO creation, and Packing List — even though BOM Review (which correctly uses `quantity`) shows items.
- **Status**: FIXED — updated all three files to use `quantity` column name.

### F06 — Inventory table has no seed data
- **Category**: DATA
- **Location**: `/inventory` route, `inventory` table
- **Expected**: The `inventory` table should have one row per `hardware_catalog` item (all 47 SKUs) with `quantity_on_hand = 0` as a starting state. This lets users see the full catalog and start tracking stock.
- **Actual**: `inventory` table is empty. Shows "Inventory not set up yet" empty state. No seed migration populates it — `00006_seed_hardware.sql` seeds `hardware_catalog` but not `inventory`.
- **Notes**: Need a seed migration that inserts one `inventory` row per active catalog item. Alternatively, the inventory page could auto-initialize from the catalog on first load.

### F07 — No manual inventory adjustment UI
- **Category**: MISSING
- **Location**: `/inventory` page, Procurement > Inventory Check tab
- **Expected**: Ability to manually add/subtract inventory for any SKU (e.g., +5 received, -2 damaged). Both the main Inventory page and the Procurement Inventory Check tab should have inline +/- controls or an "Adjust" action per row.
- **Actual**: Inventory page is read-only (just displays quantities). Inventory Check tab is also read-only (shows needed vs on-hand delta but no way to adjust).
- **Notes**: The DB schema already has `inventory_movements` table with `adjustment_increase`/`adjustment_decrease` movement types, and enum labels are defined. Just needs UI: per-row adjust button → modal with qty + reason → inserts movement + updates `inventory.quantity_on_hand`.

### F08 — Dropdowns should be searchable/filterable
- **Category**: QOL
- **Location**: App-wide — all `<select>` elements
- **Expected**: Any dropdown with more than ~5 options should support type-to-search filtering (combobox pattern). Key offenders: SKU swap dropdown in BOM Review (47 items), installer selection, ISP selection, catalog item pickers.
- **Actual**: All dropdowns are plain `<select>` elements with no search. Scrolling through 47 SKUs is painful.
- **Notes**: Use a combobox component (e.g., cmdk, Radix Combobox, or shadcn Command). This is a cross-cutting QOL improvement — could be a reusable `<SearchableSelect>` component used everywhere.

### F09 — Seed team contacts with core team
- **Category**: DATA
- **Location**: Settings > Team Contacts
- **Expected**: Seed data should include the core team: Niko, Chad, Andy, Ernesto, Carlos, Marco. These are the only contacts needed right now.
- **Actual**: Team contacts table is empty (or has wrong/extra people). Needs seed migration or manual entry.
- **Notes**: Forward loop should seed these 6 contacts with correct roles/departments.

### F10 — No "Advance to Deployment" button in procurement
- **Category**: MISSING
- **Location**: Procurement page (`routes/_auth/projects/$projectId/procurement.tsx`)
- **Expected**: An "Advance to Deployment" button (with confirmation dialog D-09) at the bottom of the procurement page that updates `project_status` to `deployment` and seeds the deployment checklist.
- **Actual**: No button exists. The confirmation dialog (`advanceToDeploymentDialog`), toast messages, and validation text are all defined in code but never wired to a UI element. No way to move a project forward from procurement.
- **Notes**: Same pattern likely missing for other phase transitions (deployment → financial_close, etc.). The entire phase advancement flow may be unwired.

### F11 — No UI to manage vendors
- **Category**: MISSING
- **Location**: Settings pages
- **Expected**: A Settings > Vendors page to add/edit vendor records (e.g., Ubiquiti, Amazon, Apple, etc.). Vendors are referenced by hardware catalog items but there's no CRUD UI to manage them.
- **Actual**: Vendor is just a text field on catalog items. No dedicated vendor management.
- **Notes**: Could be a standalone entity with name, contact info, lead times, URLs — then referenced by catalog items via FK. Similar pattern to Team Contacts / Installers settings pages.

### F12 — Recurring fees tracking
- **Category**: MISSING
- **Location**: Project Financials, Global Financials
- **Expected**: Support for arbitrary recurring fees per project (e.g., monthly Replay license, Starlink, cloud hosting, support retainer). Some fees are standard templates, some are ad-hoc per project. Each fee needs: label, amount, frequency (monthly/quarterly/annual), start date, optional end date. Payment status should be tracked per billing period (paid/unpaid). UI should live in both (a) a new "Recurring Fees" tab in project Financials, and (b) a global overview across all active projects showing outstanding fees.
- **Actual**: No recurring fee concept exists. Financial model is one-time only (deposit + final invoice + expenses).
- **Notes**: Schema: `recurring_fees` table (project_id, label, amount, frequency, start_date, end_date, is_active) + `recurring_fee_payments` table (fee_id, period_start, period_end, status, paid_date, payment_method). The P&L summary and HER calculation should incorporate recurring revenue once implemented.

### F13 — No "Advance to Financial Close" button in deployment
- **Category**: MISSING
- **Location**: Deployment page (`routes/_auth/projects/$projectId/deployment.tsx`)
- **Expected**: An "Advance to Financial Close" button at the bottom of the deployment page.
- **Actual**: Button was missing. No way to move project from deployment to financial close stage.
- **Status**: FIXED — added button with confirmation dialog and navigation to financials page.

---

## Patterns to Watch in Future Loops

<!-- After QA, we'll distill recurring failure modes here -->
