# PodPlay Ops Wizard — Validation Error Messages

**Aspect**: qa-validation-error-messages
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07
**Source**: Derived from wizard-intake.md, wizard-procurement.md, wizard-deployment.md, wizard-financials.md, inventory-view.md, settings-view.md

---

## Overview

This file specifies the **exact text** of every validation error message, form-level error, field-level error, guard tooltip, and API failure toast in the PodPlay Ops Wizard. Every entry maps to a specific Zod schema rule, guard condition, or service call.

**Conventions**:
- Field-level errors: appear below the input field in `text-destructive text-sm` (shadcn default)
- Form-level errors: appear in a `<Alert variant="destructive">` above the submit button
- Toast success: `toast.success('...')` — green, bottom-right, 3s
- Toast error: `toast.error('...')` — red, bottom-right, 5s
- Guard tooltips: on `<Tooltip>` wrapping disabled button
- Inline errors: red text directly in component, not a toast

---

## 1. Wizard Intake — Stage 1

### 1.1 Step 1: Venue & Contact

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `customer_name` | `.min(1)` | `Customer name is required` |
| `customer_name` | `.max(200)` | `Customer name must be 200 characters or less` |
| `venue_name` | `.min(1)` | `Venue name is required` |
| `venue_name` | `.max(200)` | `Venue name must be 200 characters or less` |
| `venue_address_line1` | `.max(200)` | `Address line 1 must be 200 characters or less` |
| `venue_address_line2` | `.max(200)` | `Address line 2 must be 200 characters or less` |
| `venue_city` | `.min(1)` | `City is required` |
| `venue_city` | `.max(100)` | `City must be 100 characters or less` |
| `venue_state` | `.min(1)` | `State is required` |
| `venue_state` | `.max(50)` | `State must be 50 characters or less` |
| `venue_zip` | `.max(20)` | `ZIP code must be 20 characters or less` |
| `venue_country` | `.enum(['US','PH'])` | `Country must be US or PH` |
| `contact_name` | `.min(1)` | `Contact name is required` |
| `contact_name` | `.max(200)` | `Contact name must be 200 characters or less` |
| `contact_email` | `.email()` | `Enter a valid email address` |
| `contact_phone` | `.max(50)` | `Phone number must be 50 characters or less` |

### 1.2 Step 2: Configuration

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `tier` | `.enum(...)` required | `Service tier is required` |
| `court_count` | `.min(1)` | `At least 1 court required` |
| `court_count` | `.max(50)` | `Maximum 50 courts` |
| `court_count` | `.int()` | `Court count must be a whole number` |
| `door_count` | `.int().min(0)` | `Door count must be 0 or more` |
| `security_camera_count` | `.int().min(0)` | `Camera count must be 0 or more` |
| `door_count` (cross-field) | `tier in ('autonomous','autonomous_plus') && door_count < 1` | `Autonomous tier requires at least 1 access-controlled door` |
| `security_camera_count` (cross-field) | `tier === 'autonomous_plus' && security_camera_count < 1` | `Autonomous+ tier requires at least 1 security camera` |

### 1.3 Step 3: Network & ISP

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `isp_provider` | `.max(200)` | `ISP provider name must be 200 characters or less` |
| `internet_download_mbps` | `.min(0)` | `Download speed must be 0 or more` |
| `internet_upload_mbps` | `.min(0)` | `Upload speed must be 0 or more` |
| `rack_size_u` | `.min(7)` | `Rack size must be at least 7U` |
| `rack_size_u` | `.max(42)` | `Rack size must be 42U or less` |

**ISP Cross-Validation (useIspValidation hook)** — inline warnings/errors shown in `IspWarningBanner`:

| Condition | Severity | Message |
|-----------|----------|---------|
| `isp_type === 'other'` and Starlink detected via provider name | Hard error (blocks Continue) | `Starlink is not compatible with PodPlay Replay. A different ISP is required for replay to work.` |
| `starlink_warning_acknowledged === false` when Starlink detected | Hard error | `Acknowledge the Starlink incompatibility warning to continue.` |
| Upload speed < recommended for court count (fiber) | Warning (yellow) | `Upload speed may be insufficient. Recommended: {n} Mbps for {court_count} courts on fiber.` |
| Upload speed < recommended for court count (cable) | Warning (yellow) | `Upload speed may be insufficient for cable. Minimum recommended: {isp_cable_upload_min_mbps} Mbps upload.` |
| `venue_country === 'PH' && !has_static_ip` | Hard error (disables Continue button) | `Static IP is mandatory for Philippines deployments. Enable 'Static IP' above.` |
| `is_24_7 && tier in ('autonomous','autonomous_plus') && !has_backup_isp` | Warning (yellow) | `Autonomous 24/7 venues require a backup ISP. Configure a second WAN connection.` |
| `isp_type === '' || isp_type not set` | Info | `ISP type not specified — speed recommendations cannot be calculated.` |

**Philippines-specific hard block** (shown as error below `has_static_ip` field):
> `Static IP is mandatory for Philippines deployments. Enable 'Static IP' above.`

The Continue button on Step 3 is disabled with no tooltip when this error is active.

### 1.4 Step 4: Timeline & Installer

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `notes` | `.max(2000)` | `Notes must be 2000 characters or less` |
| `internal_notes` | `.max(2000)` | `Internal notes must be 2000 characters or less` |
| `installation_end_date` (cross-field) | `end_date < start_date` | `End date must be on or after start date` |

### 1.5 Step 5: System IDs

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `ddns_subdomain` | `.max(63)` | `DDNS subdomain must be 63 characters or less` |
| `ddns_subdomain` | `.regex(/^[a-z0-9-]+$/)` | `DDNS subdomain may only contain lowercase letters, numbers, and hyphens` |
| `ddns_subdomain` | uniqueness check (async) | `This subdomain is already in use. Choose a different subdomain.` |
| `unifi_site_name` | `.max(50)` | `UniFi site name must be 50 characters or less` |
| `mac_mini_username` | `.max(100)` | `Mac Mini username must be 100 characters or less` |
| `mac_mini_password` | `.max(200)` | `Mac Mini password must be 200 characters or less` |
| `location_id` | `.max(200)` | `Location ID must be 200 characters or less` |

**Auto-fill token validations** (shown inline when token field is filled during deployment but surfaced as warnings in Step 5):

| Token | Validation | Error Message |
|-------|-----------|---------------|
| `DDNS_SUBDOMAIN` | `/^[a-z0-9-]+$/` | `Only lowercase letters, numbers, and hyphens allowed` |
| `UNIFI_SITE_NAME` | `.max(64)` | `UniFi site name must be 64 characters or less` |
| `MAC_MINI_USERNAME` | `/^[a-z][a-z0-9_-]*$/` | `Must start with a letter; only lowercase letters, numbers, underscores, hyphens` |
| `LOCATION_ID` | `.max(64)` | `Location ID must be 64 characters or less` |

### 1.6 Step 6: Review — Blocking Validation Checklist

Displayed as a list of blocking issues below the project summary. Each unmet check shows in `text-destructive`. The "Create Project" button is disabled until all checks pass.

| Check | Message shown in checklist |
|-------|---------------------------|
| `!customer_name` | `Customer name is required` |
| `!venue_name` | `Venue name is required` |
| `!contact_email` or invalid email | `Valid contact email is required` |
| `!tier` | `Service tier must be selected` |
| `court_count < 1` | `At least 1 court required` |
| `tier in ('autonomous','autonomous_plus') && door_count < 1` | `Autonomous tier requires at least 1 door` |
| `tier === 'autonomous_plus' && security_camera_count < 1` | `Autonomous+ requires at least 1 security camera` |
| `ddns_subdomain` uniqueness check fails | `DDNS subdomain is already taken — choose another` |
| `installation_end_date < installation_start_date` | `Installation end date must be on or after start date` |

**Section label** (above the list): `Resolve the following issues before creating the project:`

### 1.7 Intake Toast Messages

| Action | Outcome | Toast Text |
|--------|---------|-----------|
| Step auto-save (between steps) | Success | *(silent — no toast)* |
| Create Project (Step 6 submit) | Success | `Project created successfully` |
| Create Project (Step 6 submit) | Error | `Failed to save project: {err.message}` |
| Advance to Procurement | Success | *(navigates to procurement tab — no toast)* |
| Advance to Procurement | Error | `Failed to advance stage` |

---

## 2. Wizard Procurement — Stage 2

### 2.1 BOM Item Inline Edit

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `qty` | `.int().min(0)` | `Quantity must be 0 or more` |
| `qty` | `.max(999)` | `Quantity must be 999 or less` |
| `qty` | `.int()` | `Quantity must be a whole number` |
| `unit_cost` | `.min(0)` | `Cost must be 0 or more` |
| `unit_cost` | `.max(100000)` | `Cost must be $100,000 or less` |
| `shipping_rate` | `.min(0)` | `Shipping rate must be 0% or more` |
| `shipping_rate` | `.max(1)` | `Shipping rate must be 100% or less` |
| `margin` | `.min(0)` | `Margin must be 0% or more` |
| `margin` | `.max(0.99)` | `Margin must be less than 100%` |

**Optimistic rollback error**: Shown inline in row on save failure:
> `Failed to save — changes reverted`

**Add custom item — duplicate detection** (Postgres unique violation on BOM):
> `Item already in BOM — edit the existing row instead`

### 2.2 BOM Regenerate Confirmation

Dialog body text:
> `Regenerating the BOM will discard all manual edits (quantities, cost overrides, custom items) and reset to the auto-generated values. This cannot be undone.`

Guard tooltip (when `allocated = true` on any BOM item):
> `Cannot regenerate: some items are already allocated in inventory. Release allocations first.`

### 2.3 Remove BOM Item Confirmation

Dialog body text:
> `Remove {item_name} from BOM? This cannot be undone.`

### 2.4 New Purchase Order Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `vendor` | `.min(1)` | `Vendor is required` |
| `order_date` | `.date()` required | `Order date is required` |
| `expected_date` | must be >= order_date if set | `Expected date must be on or after order date` |
| Line item `qty_ordered` | `.int().min(1)` | `Quantity must be at least 1` |
| Line item `unit_cost` | `.min(0.01)` | `Cost must be greater than $0` |
| Line item `hardware_catalog_id` | `.uuid()` | `Select an item` |
| `items` array | `.min(1)` | `Add at least one item` |

**Form-level error** shown in Alert above submit when items array is empty:
> `Add at least one line item before creating the purchase order.`

### 2.5 Receiving Flow

| Condition | Message |
|-----------|---------|
| `qty_received_now > remaining` | `Cannot receive {qty}: would exceed ordered quantity of {po_item.qty_ordered}` |
| `qty_received_now < 0` | `Quantity received must be 0 or more` |
| `qty_received_now` is not integer | `Quantity received must be a whole number` |

### 2.6 CC Terminal Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `qty` | `.int().min(1)` | `Quantity must be at least 1` |
| `qty` | `.max(10)` | `Quantity must be 10 or less` |
| `cost_per_unit` | `.min(0)` | `Cost must be 0 or more` |
| `cost_per_unit` | `.max(10000)` | `Cost must be $10,000 or less` |
| `stripe_order_id` | `.max(100)` | `Order ID must be 100 characters or less` |
| `notes` | `.max(1000)` | `Notes must be 1000 characters or less` |
| `order_date` | `.date()` format | `Date must be a valid date (YYYY-MM-DD)` |
| `expected_date` | `.date()` format | `Date must be a valid date (YYYY-MM-DD)` |
| `delivered_date` | `.date()` format | `Date must be a valid date (YYYY-MM-DD)` |
| `installed_date` | `.date()` format | `Date must be a valid date (YYYY-MM-DD)` |

### 2.7 Replay Signs Status Transition Guards

Guard tooltips on disabled action buttons:

| Current Status | Button | Guard Condition | Tooltip |
|----------------|--------|-----------------|---------|
| `staged` | "Mark Shipped" | `outreach_date` not set | `Set outreach date before marking as shipped` |
| `shipped` | "Mark Delivered" | `shipped_date` not set | `Shipped date must be set before marking as delivered` |
| `delivered` | "Mark Installed" | `delivered_date` not set | `Delivered date must be set before marking as installed` |

### 2.8 Replay Signs Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `qty` | `.int().min(1)` | `Quantity must be at least 1` |
| `qty` | `.max(200)` | `Quantity must be 200 or less` |
| `vendor_order_id` | `.max(100)` | `Order ID must be 100 characters or less` |
| `tracking_number` | `.max(100)` | `Tracking number must be 100 characters or less` |
| `notes` | `.max(1000)` | `Notes must be 1000 characters or less` |

### 2.9 Advance to Deployment Confirmation

Dialog body text:
> `Advance this project to Stage 3: Deployment? The deployment checklist will be seeded from the template. This cannot be reversed.`

Guard tooltip (when exit conditions not met):
> `Complete all procurement steps before advancing to deployment.`

Specific missing item messages shown in checklist below the button:
- `BOM must be reviewed and quantities confirmed`
- `All PO items must be received or on order`
- `Packing list must be confirmed`
- `CC terminal must be ordered (if applicable)`
- `Replay signs outreach must be initiated`

### 2.10 Procurement Toast Messages

| Action | Outcome | Toast Text |
|--------|---------|-----------|
| BOM item save | Success | *(silent — optimistic update)* |
| BOM item save | Error | `Failed to save — changes reverted` |
| Regenerate BOM | Success | `BOM regenerated from template` |
| Regenerate BOM | Error | `Failed to regenerate BOM: {error.message}` |
| Create PO | Success | `Purchase order {po_number} created` |
| Create PO | Error | `Failed to create purchase order: {error.message}` |
| Receive items | Success | `Items received and added to inventory` |
| Receive items | Error | `Failed to record receipt: {error.message}` |
| Save CC terminal | Success | `CC terminal record saved` |
| Save CC terminal | Error | `Failed to save CC terminal: {error.message}` |
| Save replay signs | Success | `Replay signs record saved` |
| Save replay signs | Error | `Failed to save replay signs: {error.message}` |
| Advance to deployment | Success | *(navigates — no toast)* |
| Advance to deployment | Error | `Failed to advance to deployment: {error.message}` |

---

## 3. Wizard Deployment — Stage 3

### 3.1 Entry Guard

Guard shown as full-width alert banner when project `project_status` is still `'procurement'`:
> `Procurement must be complete before deployment. [Go to Procurement →]`

### 3.2 Mark Ready to Ship

No form fields — simple confirmation button. Guard tooltip when not all pre-ship phases complete:
> `Complete all pre-shipping checklist phases before marking ready to ship.`

Toast (success): `Marked as Ready to Ship`

### 3.3 Mark Shipped Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `tracking_number` | `.min(1)` | `Tracking number is required` |
| `tracking_number` | `.max(100)` | `Tracking number must be 100 characters or less` |
| `carrier` | `.enum(...)` optional | *(no error — optional field)* |
| `notes` | `.max(500)` | `Notes must be 500 characters or less` |

Toast (success): `Marked as Shipped — tracking: {tracking_number}`
Toast (error): `Failed to mark as shipped: {error.message}`

### 3.4 Mark Installing Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `installation_start_date` | `.min(1)` | `Start date is required` |
| `installer_name` | `.max(100)` | `Installer name must be 100 characters or less` |
| `notes` | `.max(500)` | `Notes must be 500 characters or less` |

Toast (success): `Installation started — Phase 12 unlocked.`
Toast (error): `Failed to start installation: {error.message}`

### 3.5 Mark QC Complete / Go-Live

Form field:
- `go_live_date` — required, no future restriction. Error if missing: `Go-live date is required`

Toast (success): `Deployment complete! Stage 4 (Financials) is now unlocked.`
Toast (error): `Failed to mark deployment complete: {error.message}`

### 3.6 Flag Issue / Require Rework Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `reason` | `.min(1)` | `Reason is required` |
| `reason` | `.max(500)` | `Reason must be 500 characters or less` |

Toast (success): `Issue flagged — project status updated`
Toast (error): `Failed to flag issue: {error.message}`

### 3.7 Bulk Complete (Mark All)

Toast (success): `{X} steps marked complete.`
Toast (error): `Failed to bulk complete steps: {error.message}`

### 3.8 Checklist Checkbox Toggle

**Optimistic update with rollback:**
- On error: `toast.error('Failed to save — please try again.')`
- Visual: checkbox reverts to previous state

### 3.9 Step Note Auto-Save

No toast on success (silent save). On error, shown as inline red text below the textarea:
> `Failed to save note.`

### 3.10 Status Advance (from Modal)

Inline error inside modal (not a toast):
> `Failed to update status — {error.message}. Please try again.`

### 3.11 ISP Configuration Validation (Phase 5)

Shown as inline banners in Phase 5 panel:

| Condition | Severity | Message |
|-----------|----------|---------|
| Upload speed meets requirement | Green | `Upload speed: {actual} Mbps — meets {required} Mbps requirement` |
| Upload speed below requirement | Red | `Upload speed insufficient. Required: {required} Mbps for {court_count} courts ({isp_type}). Actual: {actual} Mbps.` |
| Starlink detected | Red | `Starlink detected — not compatible with PodPlay Replay. A different ISP is required.` |
| Backup ISP missing (24/7 Autonomous) | Yellow | `Autonomous 24/7: backup ISP required. Configure WAN2 on UDM.` |
| Philippines + no static IP | Red | `Static IP mandatory for Philippines deployments.` |

---

## 4. Wizard Financials — Stage 4

### 4.1 Contract Signed Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `signed_date` | `.regex(/^\d{4}-\d{2}-\d{2}$/)` | `Date must be a valid date (YYYY-MM-DD)` |
| `signed_date` | required | `Contract signed date is required` |

Guard: "Send Deposit Invoice" button disabled with banner:
> `Contract must be signed before sending the deposit invoice`

Toast (success): `Contract date saved`
Toast (error): `Failed to save contract date: {error.message}`

### 4.2 Send Deposit Invoice Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `invoice_number` | `.min(1)` | `Invoice number is required` |
| `invoice_number` | `.max(50)` | `Invoice number must be 50 characters or less` |
| `invoice_date` | `.regex(/^\d{4}-\d{2}-\d{2}$/)` | `Date must be YYYY-MM-DD` |
| `deposit_pct` | `.min(1)` | `Deposit % must be at least 1%` |
| `deposit_pct` | `.max(99)` | `Deposit % must be at most 99%` |

Toast (success): `Deposit invoice sent`
Toast (error): `{error.message}` *(from service call)*

### 4.3 Send Final Invoice Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `invoice_number` | `.min(1)` | `Invoice number is required` |
| `invoice_number` | `.max(50)` | `Invoice number must be 50 characters or less` |
| `invoice_date` | `.regex(/^\d{4}-\d{2}-\d{2}$/)` | `Date must be YYYY-MM-DD` |

Guard: "Send Final Invoice" button disabled with tooltip:
> `Deposit must be paid and go-live date must be set.`

Guard toast (when go_live_date is null and user somehow bypasses tooltip):
> `Set go-live date before sending final invoice.`

Toast (success): `Final invoice sent`
Toast (error): `{error.message}`

### 4.4 Mark Invoice Paid Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `paid_date` | `.regex(/^\d{4}-\d{2}-\d{2}$/)` | `Date must be YYYY-MM-DD` |
| `paid_date` | required | `Payment date is required` |

Toast (success): `Invoice marked as paid`
Toast (error): `Failed to mark invoice as paid: {error.message}`

### 4.5 Expense Add/Edit Dialog

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `date` | required | `Date is required` |
| `date` | `<= today + 1 day` | `Date cannot be more than 1 day in the future` |
| `category` | required (no blank option) | `Category is required` |
| `amount` | `> 0` | `Amount must be greater than $0` |
| `amount` | `<= 100000` | `Amount must be $100,000 or less` |
| `payment_method` | required | `Payment method is required` |

Toast (success — add): `Expense added`
Toast (success — edit): `Expense updated`
Toast (error — add): `Failed to add expense: {error.message}`
Toast (error — edit): `Failed to update expense: {error.message}`

### 4.6 Delete Expense Confirmation

Dialog body text:
> `Delete this expense? This cannot be undone.`

Toast (success): `Expense deleted`
Toast (error): `Failed to delete expense: {error.message}`

### 4.7 Go-Live Date Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `go_live_date` | required | `Go-live date is required` |

Toast (success): `Go-live date saved`
Toast (error): `Failed to save go-live date: {error.message}`

### 4.8 Mark Project Complete

Guard: "Mark Project Complete" button disabled with tooltip:
> `Both invoices must be paid to close the project`

Checklist shown below button when guard is active:
- `[ ] Deposit invoice must be paid`
- `[ ] Final invoice must be paid`

Confirmation dialog body text:
> `Mark this project as complete and close the financials? This cannot be undone.`

Toast (success): `Project completed and closed`
Toast (error): `Failed to complete project: {error.message}`

---

## 5. Inventory View

### 5.1 Stock Adjustment Dialog

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `movement_type` | required | `Adjustment type is required` |
| `qty` | `.int().min(1)` | `Quantity must be at least 1` |
| `qty` | `.int()` | `Quantity must be a whole number` |
| `reason` | `.min(1)` | `Reason is required` |
| `reason` | `.max(500)` | `Reason must be 500 characters or less` |

Toast (success): `Stock adjusted successfully`
Toast (error): `Failed to adjust stock: {error.message}`

### 5.2 New Purchase Order from Inventory

Same as Procurement §2.4, plus:

Toast (success): `PO {po_number} created`
Toast (error): `Failed to create PO: {error.message}`

### 5.3 Reorder Threshold Inline Edit

| Condition | Error Message |
|-----------|---------------|
| Value is not an integer | `Must be a whole number` |
| Value < 0 | `Threshold must be 0 or more` |

Saved silently (no toast on success). On error, inline red text:
> `Failed to save threshold`

### 5.4 Reconciliation

Toast (success): `Reconciliation complete — {n} discrepancies found`
Toast (error): `Failed to run reconciliation: {error.message}`

Footer note (static, not a validation error):
> `Discrepancies must be resolved by posting a manual adjustment. Contact ops if you cannot explain a discrepancy.`

---

## 6. Settings View

### 6.1 Pricing & Rates Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `pro_venue_fee` | `.min(0)` | `Fee must be 0 or more` |
| `pro_court_fee` | `.min(0)` | `Fee must be 0 or more` |
| `autonomous_venue_fee` | `.min(0)` | `Fee must be 0 or more` |
| `autonomous_court_fee` | `.min(0)` | `Fee must be 0 or more` |
| `autonomous_plus_venue_fee` | `.min(0)` | `Fee must be 0 or more` |
| `autonomous_plus_court_fee` | `.min(0)` | `Fee must be 0 or more` |
| `pbk_venue_fee` | `.min(0)` | `Fee must be 0 or more` |
| `pbk_court_fee` | `.min(0)` | `Fee must be 0 or more` |
| `shipping_rate` | `.min(0)` | `Rate must be 0% or more` |
| `shipping_rate` | `.max(1)` | `Rate must be 100% or less` |
| `target_margin` | `.min(0)` | `Margin must be 0% or more` |
| `target_margin` | `.max(0.9999)` | `Margin must be less than 100%` |
| `sales_tax_rate` | `.min(0)` | `Tax rate must be 0% or more` |
| `sales_tax_rate` | `.max(1)` | `Tax rate must be 100% or less` |
| `deposit_pct` | `.min(0.01)` | `Deposit must be at least 1%` |
| `deposit_pct` | `.max(0.99)` | `Deposit must be less than 100%` |
| `labor_rate_per_hour` | `.min(0)` | `Labor rate must be 0 or more` |
| `hours_per_day` | `.int().min(1)` | `Must be at least 1 hour` |
| `hours_per_day` | `.max(24)` | `Must be 24 hours or less` |

### 6.2 Hardware Threshold Cross-Validation

| Rule | Field | Error Message |
|------|-------|---------------|
| `switch_24_max_courts >= switch_48_max_courts` | `switch_24_max_courts` | `Must be less than the 48-port threshold` |
| `ssd_1tb_max_courts >= ssd_2tb_max_courts` | `ssd_1tb_max_courts` | `Must be less than the 2TB threshold` |

### 6.3 Hardware Threshold Fields

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `switch_24_max_courts` | `.int().min(1)` | `Must be at least 1` |
| `switch_48_max_courts` | `.int().min(1)` | `Must be at least 1` |
| `ssd_1tb_max_courts` | `.int().min(1)` | `Must be at least 1` |
| `ssd_2tb_max_courts` | `.int().min(1)` | `Must be at least 1` |
| `nvr_4bay_max_cameras` | `.int().min(1)` | `Must be at least 1` |

### 6.4 ISP Speed Settings

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `isp_fiber_mbps_per_court` | `.int().min(1)` | `Must be at least 1 Mbps` |
| `isp_cable_upload_min_mbps` | `.int().min(1)` | `Must be at least 1 Mbps` |

### 6.5 System Settings Fields

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `po_number_prefix` | `.min(1)` | `PO prefix is required` |
| `po_number_prefix` | `.max(10)` | `PO prefix must be 10 characters or less` |
| `cc_terminal_pin` | `.min(1)` | `CC terminal PIN is required` |
| `cc_terminal_pin` | `.max(10)` | `PIN must be 10 characters or less` |
| `mac_mini_local_ip` | `.regex(/^\d{1,3}...)` | `Must be a valid IPv4 address` |
| `replay_port` | `.int().min(1)` | `Port must be at least 1` |
| `replay_port` | `.max(65535)` | `Port must be 65535 or less` |
| `ddns_domain` | `.min(1)` | `DDNS domain is required` |
| `label_sets_per_court` | `.int().min(1)` | `Must be at least 1` |
| `replay_sign_multiplier` | `.int().min(1)` | `Must be at least 1` |
| `default_vlan_id` | `.int().min(1)` | `VLAN ID must be at least 1` |
| `default_vlan_id` | `.max(4094)` | `VLAN ID must be 4094 or less` |
| `replay_vlan_id` | `.int().min(1)` | `VLAN ID must be at least 1` |
| `replay_vlan_id` | `.max(4094)` | `VLAN ID must be 4094 or less` |
| `surveillance_vlan_id` | `.int().min(1)` | `VLAN ID must be at least 1` |
| `surveillance_vlan_id` | `.max(4094)` | `VLAN ID must be 4094 or less` |
| `access_control_vlan_id` | `.int().min(1)` | `VLAN ID must be at least 1` |
| `access_control_vlan_id` | `.max(4094)` | `VLAN ID must be 4094 or less` |

### 6.6 Hardware Catalog Item Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `sku` | `.min(1)` | `SKU is required` |
| `sku` | `.max(50)` | `SKU must be 50 characters or less` |
| `sku` | `.regex(/^[A-Z0-9\-]+$/)` | `Uppercase letters, numbers, hyphens only` |
| `sku` | DB unique violation | `This SKU already exists.` |
| `name` | `.min(1)` | `Name is required` |
| `name` | `.max(200)` | `Name must be 200 characters or less` |
| `model` | `.max(100)` | `Model must be 100 characters or less` |
| `category` | `.enum(...)` required | `Category is required` |
| `vendor` | `.min(1)` | `Vendor is required` |
| `vendor` | `.max(100)` | `Vendor must be 100 characters or less` |
| `vendor_url` | `.url()` | `Enter a valid URL (e.g., https://example.com)` |
| `unit_cost` | `.min(0)` | `Cost must be 0 or more` |
| `notes` | `.max(500)` | `Notes must be 500 characters or less` |

Help text on SKU field (informational, not an error):
> `SKU cannot be changed after creation — it is referenced by BOM templates and inventory.`

### 6.7 OpEx Settings Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `rent_per_year` | `.min(0)` | `Rent must be 0 or more` |
| `indirect_salaries_per_year` | `.min(0)` | `Indirect salaries must be 0 or more` |

### 6.8 Travel Defaults Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `lodging_per_day` | `.min(0)` | `Lodging rate must be 0 or more` |
| `airfare_default` | `.min(0)` | `Airfare must be 0 or more` |
| `hours_per_day` | `.int().min(1)` | `Must be at least 1 hour` |
| `hours_per_day` | `.max(24)` | `Must be 24 hours or less` |

### 6.9 Team Contacts Form

| Field | Zod Rule | Error Message |
|-------|----------|---------------|
| `name` | `.min(1)` | `Name is required` |
| `name` | `.max(100)` | `Name must be 100 characters or less` |
| `role` | `.min(1)` | `Role is required` |
| `role` | `.max(200)` | `Role must be 200 characters or less` |
| `department` | `.enum(...)` required | `Department is required` |
| `phone` | `.max(30)` | `Phone must be 30 characters or less` |
| `email` | `.email()` | `Enter a valid email address` |
| `contact_via` | `.max(100)` | `Contact via must be 100 characters or less` |
| `support_tier` | `.min(1).max(3)` | `Support tier must be 1, 2, or 3` |
| `notes` | `.max(1000)` | `Notes must be 1000 characters or less` |

### 6.10 Settings Toast Messages

| Action | Outcome | Toast Text |
|--------|---------|-----------|
| Save pricing settings | Success | `Settings saved` |
| Save pricing settings | Error | `Failed to save settings: {error.message}` |
| Add catalog item | Success | `Item added to catalog` |
| Add catalog item | Error | `Failed to add item: {error.message}` |
| Edit catalog item | Success | `Item updated` |
| Edit catalog item | Error | `Failed to update item: {error.message}` |
| Deactivate catalog item | Success | `Item deactivated` |
| Deactivate catalog item | Error | `Failed to deactivate item: {error.message}` |
| Save OpEx settings | Success | `Settings saved` |
| Save OpEx settings | Error | `Failed to save settings: {error.message}` |
| Save travel settings | Success | `Settings saved` |
| Save travel settings | Error | `Failed to save settings: {error.message}` |
| Add contact | Success | `Contact added` |
| Add contact | Error | `Failed to add contact: {error.message}` |
| Edit contact | Success | `Contact updated` |
| Edit contact | Error | `Failed to update contact: {error.message}` |
| Delete contact | Success | `Contact deleted` |
| Delete contact | Error | `Failed to delete contact: {error.message}` |

### 6.11 Delete Catalog Item Confirmation

Dialog body text:
> `Deactivate {item_name}? It will no longer appear in BOM generation or PO creation. Existing inventory and BOM references are preserved.`

Confirm button text: `Deactivate`
Cancel button text: `Cancel`

---

## 7. Global / Cross-Cutting Error States

### 7.1 Route Load Errors (errorComponent)

All routes render an error component when the route loader throws. Standard error display:

```
Something went wrong
{error.message}
```

Component: `<ErrorState>` from `src/components/ui/ErrorState.tsx`

### 7.2 Auth / Session Errors

| Condition | Toast Text |
|-----------|-----------|
| Session expired mid-operation | `Session expired — please sign in again` |
| Unauthorized (RLS rejection) | `You do not have permission to perform this action` |
| Network timeout | `Request timed out — check your connection and try again` |

### 7.3 Supabase Generic Errors

When a service call fails and no specific error message is available:
> `An unexpected error occurred. Please try again.`

---

## 8. Implementation Notes

### Error Message Placement

```
<FormField
  ...
  render={({ field }) => (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />   {/* renders error.message from Zod */}
    </FormItem>
  )}
/>
```

`<FormMessage>` uses shadcn default: `text-sm font-medium text-destructive`.

### Field-Level vs Form-Level Errors

- **Field-level**: Rendered by `<FormMessage />` below the input. Set by Zod schema or `.setError()`.
- **Form-level**: Rendered as `<Alert variant="destructive">` above the submit button when a cross-field refine fails and is not attached to a specific field (use `path: []` in `ctx.addIssue`).
- **Toast errors**: API/network failures that happen after successful local validation.

### Toast Duration

| Severity | Duration |
|----------|---------|
| Success | 3 seconds |
| Error | 5 seconds |
| Warning | 4 seconds |

Toast position: bottom-right (`sonner` default).

### Disabled Button Tooltips

All disabled buttons use `<Tooltip>` from shadcn/radix wrapping the button:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0}>  {/* span needed — disabled button swallows hover */}
      <Button disabled>Action</Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>
    <p>{disabledReason}</p>
  </TooltipContent>
</Tooltip>
```

Tooltip delay: 300ms (shadcn default).
