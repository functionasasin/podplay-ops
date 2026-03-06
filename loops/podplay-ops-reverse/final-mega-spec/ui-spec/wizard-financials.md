# PodPlay Ops Wizard — Stage 4: Financials Wizard

**Aspect**: design-wizard-financials
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Route**: `/projects/$projectId/financials`
**Route file**: `src/routes/_auth/projects/$projectId/financials/index.tsx`
**Component file**: `src/components/wizard/financials/FinancialsWizard.tsx`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `projects`, `invoices`, `expenses`, `monthly_opex_snapshots`, `settings`
**Logic reference**: `final-mega-spec/business-logic/invoicing-expenses.md`, `financial-reporting.md`

---

## Overview

The Financials Wizard is Stage 4 of the project lifecycle. It covers the billing and financial close workflow: marking the contract signed, sending and tracking two invoices (deposit + final), logging all project expenses, reviewing per-project P&L, setting go-live date, and completing project handoff.

**Entry**: Project transitions from `project_status = 'deployment'` to `project_status = 'financial_close'` when "Mark Deployment Complete" is clicked in Stage 3. The invoices table already has two rows (`deposit` and `final`) created at project inception with `status = 'not_sent'`.

**Exit**: Both invoices must be `status = 'paid'`. Clicking "Mark Project Complete" sets `project_status = 'completed'` and `revenue_stage = 'final_paid'`. The wizard enters read-only mode.

**Two modes**:
1. **Active mode** — `project_status = 'financial_close'`: all fields editable.
2. **Read-only mode** — `project_status = 'completed'` or `'cancelled'`: all forms locked, read-only display. Banner: "This project is completed. All financial data is locked." with "Unlock for editing" override button (soft — shows confirmation dialog before allowing edits; no DB-level lock).

---

## Route Configuration

**File**: `src/routes/_auth/projects/$projectId/financials/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getProject } from '@/services/projects'
import { getProjectInvoices, getProjectExpenses } from '@/services/invoicingService'
import { getSettings } from '@/services/settings'
import { getProjectBom } from '@/services/bom'
import { FinancialsWizard } from '@/components/wizard/financials/FinancialsWizard'

export const Route = createFileRoute('/_auth/projects/$projectId/financials/')({
  loader: async ({ params }) => {
    const [project, invoices, expenses, settings, bomItems] = await Promise.all([
      getProject(params.projectId),
      getProjectInvoices(params.projectId),
      getProjectExpenses(params.projectId),
      getSettings(),
      getProjectBom(params.projectId),
    ])
    return { project, invoices, expenses, settings, bomItems }
  },
  component: FinancialsWizardRoute,
  pendingComponent: FinancialsWizardSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
      <p className="text-destructive font-medium">Failed to load financials</p>
      <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  ),
})

function FinancialsWizardRoute() {
  const { project, invoices, expenses, settings, bomItems } = Route.useLoaderData()
  return (
    <FinancialsWizard
      project={project}
      invoices={invoices}
      expenses={expenses}
      settings={settings}
      bomItems={bomItems}
    />
  )
}
```

**Guard**: If `project.project_status === 'intake'` or `'procurement'` or `'deployment'`, redirect to the appropriate stage route with toast: "Complete deployment before accessing financials."

**Loader invalidation**: After any mutation (invoice status change, expense add/update/delete, project update), call `router.invalidate()` to re-run the loader and refresh data.

---

## Layout Structure

The Financials Wizard uses a **vertical tab layout** with four sections displayed in left-aligned tabs. Unlike the deployment wizard (which has a sidebar for phases), the financials wizard uses shadcn `Tabs` component in `orientation="vertical"` style on desktop, collapsing to horizontal tabs on mobile.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROJECT SHELL HEADER                                                    │
│  [← Projects]  Acme Pickleball (6 courts · Pro)  [revenue stage pill]   │
├─────────────────────────────────────────────────────────────────────────┤
│  STAGE TABS: [1 Intake ✓] [2 Procurement ✓] [3 Deployment ✓] [4 Fin →] │
├──────────────┬──────────────────────────────────────────────────────────┤
│  LEFT TABS   │  TAB CONTENT                                              │
│  (200px)     │                                                           │
│              │                                                           │
│  [Contract   │  ## Contract & Invoicing                                  │
│   & Invoic.] │                                                           │
│              │  Revenue Stage: [Deposit Paid] ← status pill              │
│  [Expenses]  │                                                           │
│              │  ┌─ DEPOSIT INVOICE ──────────────────────────────────┐  │
│  [P&L Review]│  │  Amount: $21,131   Status: PAID   Date paid: ...   │  │
│              │  └────────────────────────────────────────────────────┘  │
│  [Go-Live &  │                                                           │
│   Handoff]   │  ┌─ FINAL INVOICE ────────────────────────────────────┐  │
│              │  │  Amount: $21,131   Status: NOT SENT                 │  │
│              │  │  [Send Final Invoice]                               │  │
│              │  └────────────────────────────────────────────────────┘  │
│              │                                                           │
└──────────────┴──────────────────────────────────────────────────────────┘
```

**Tab labels** (left column):
1. "Contract & Invoicing" — icon: `FileText` (lucide)
2. "Expenses" — icon: `Receipt`
3. "P&L Review" — icon: `TrendingUp`
4. "Go-Live & Handoff" — icon: `CheckCircle2`

**Default active tab**: "Contract & Invoicing" on first entry. Tab selection is NOT persisted in URL (in-component state only, using `useState<string>`). Tab state resets on route navigation away and back (loader re-runs, component remounts).

**Top status bar** (inside wizard header, above tabs): Shows current `revenue_stage` as a colored pill, plus a compact horizontal progress indicator showing which billing milestones are complete:
```
Contract Signed [✓] → Deposit Invoiced [✓] → Deposit Paid [✓] → Go-Live Set [ ] → Final Invoiced [ ] → Final Paid [ ]
```
Each node: green circle with checkmark if done, gray circle if pending, blue circle if current next step.

---

## Tab 1: Contract & Invoicing

**File**: `src/components/wizard/financials/tabs/ContractInvoicingTab.tsx`

### 1.1 Section: Contract Signing

A card at the top of the tab. Shows contract signing status.

**If `revenue_stage === 'proposal'`** (contract not yet signed):

```
┌─ CONTRACT STATUS ─────────────────────────────────────────────┐
│  Status: Proposal Sent (awaiting signature)                    │
│                                                                │
│  Signed date:  [date picker — YYYY-MM-DD]                     │
│                                                                │
│  [Mark Contract Signed]                                        │
└────────────────────────────────────────────────────────────────┘
```

Fields:
- `signed_date`: Date picker (shadcn `<DatePicker>`). Default: today. Required before submit.
- Submit button: "Mark Contract Signed" — calls `markContractSigned(projectId, signedDate)`
- On success: toast "Contract marked as signed", `revenue_stage` advances to `'signed'`, tab refreshes
- On error: toast error with message

**If `revenue_stage !== 'proposal'`** (contract signed):

```
┌─ CONTRACT STATUS ─────────────────────────────────────────────┐
│  [✓] Contract Signed                                           │
│  Signed date: March 3, 2026                                    │
└────────────────────────────────────────────────────────────────┘
```

Read-only display. Shows `projects.signed_date` formatted as "Month D, YYYY".

---

### 1.2 Section: Deposit Invoice

A card showing the deposit invoice state. Four display states based on `invoices[0].status` where `invoice_type = 'deposit'`:

#### State A: `status = 'not_sent'` and BOM NOT approved (`hardware_subtotal = null`)

```
┌─ DEPOSIT INVOICE (50%) ───────────────────────────────────────┐
│  ⚠ BOM not yet approved                                        │
│  Invoice amounts will be calculated once the BOM is approved   │
│  in Stage 2 (Procurement).                                     │
│                                                                │
│  [→ Go to Procurement]  (link to procurement route)           │
└────────────────────────────────────────────────────────────────┘
```

No send button shown. Button "Go to Procurement" navigates to `/projects/$projectId/procurement`.

#### State B: `status = 'not_sent'` and BOM IS approved (`hardware_subtotal` not null)

```
┌─ DEPOSIT INVOICE (50%) ───────────────────────────────────────┐
│  Hardware subtotal:    $18,333.00                              │
│  Service fee:          $20,000.00    (Pro: $5,000 + 6×$2,500) │
│  Subtotal:             $38,333.00                              │
│  Sales tax (10.25%):    $3,929.13                              │
│  Invoice total:        $42,262.13                              │
│                                                                │
│  Deposit (50%):        $21,131.07   ← this invoice           │
│  Final (50%):          $21,131.06   ← due at go-live         │
│                                                                │
│  {if any BOM items have null unit_cost:}                       │
│  ⚠ 2 BOM items have unknown unit costs and are excluded       │
│    from invoice total.                                         │
│                                                                │
│  {if PBK tier and pbk_venue_fee=0:}                           │
│  ⚠ PBK pricing not configured — set PBK fees in Settings.    │
│                                                                │
│  {if revenue_stage !== 'signed':}                             │
│  ⚠ Contract must be signed before sending the deposit invoice │
│                                                                │
│  Send deposit invoice:                                         │
│  Invoice number:  [text input — from QuickBooks/billing sys]  │
│  Date sent:       [date picker — default today]               │
│  Deposit %:       [number input, default 50, range 1-99]      │
│                                                                │
│  [Send Deposit Invoice]   ← disabled if revenue_stage ≠ signed│
└────────────────────────────────────────────────────────────────┘
```

Fields for send form:
- `invoice_number`: text, required, max 50 chars. Label: "Invoice # (from billing system)"
- `date_sent`: date picker, default today, no future restriction
- `deposit_pct`: number input, 1–99, default 50. Step 1. Label: "Deposit %". Note: "Changing this also updates final invoice split."

Submit button "Send Deposit Invoice":
- Disabled if `revenue_stage !== 'signed'` (tooltip: "Mark contract signed first")
- Disabled if `invoice_number` is blank
- On click: calls `markDepositInvoiceSent(projectId, invoiceNumber, dateSent)`, which also updates `deposit_pct` if changed
- On success: toast "Deposit invoice marked as sent", tab refreshes
- On error: toast with error message

#### State C: `status = 'sent'`

```
┌─ DEPOSIT INVOICE (50%) ───────────────────────────────────────┐
│  [SENT] Invoice #INV-2026-004   Sent: March 3, 2026           │
│                                                                │
│  Deposit amount:  $21,131.07                                   │
│                                                                │
│  Mark as received:                                             │
│  Date paid:  [date picker — default today]                     │
│                                                                │
│  [Mark Deposit Paid]                                           │
└────────────────────────────────────────────────────────────────┘
```

`date_paid`: date picker, default today. No future restriction (allow backdating).

Submit "Mark Deposit Paid": calls `markDepositPaid(projectId, datePaid)`.
On success: toast "Deposit payment recorded", `revenue_stage` → `'deposit_paid'`.

#### State D: `status = 'paid'`

```
┌─ DEPOSIT INVOICE (50%) ───────────────────────────────────────┐
│  [✓ PAID]  Invoice #INV-2026-004                              │
│  Sent: March 3, 2026  |  Paid: March 5, 2026                  │
│  Amount: $21,131.07                                            │
└────────────────────────────────────────────────────────────────┘
```

Read-only. No actions.

---

### 1.3 Section: Final Invoice

A card below the deposit invoice card. Four display states based on `invoices[1].status` where `invoice_type = 'final'`:

#### State A: `status = 'not_sent'` and deposit NOT yet paid

```
┌─ FINAL INVOICE (50%) ─────────────────────────────────────────┐
│  Amount: $21,131.06                                            │
│                                                                │
│  ℹ Final invoice can be sent after:                           │
│    1. Deposit is paid                                          │
│    2. Go-live date is set (Tab 4: Go-Live & Handoff)          │
│                                                                │
│  [Send Final Invoice]  ← disabled, tooltip shows requirements │
└────────────────────────────────────────────────────────────────┘
```

"Send Final Invoice" button: disabled with tooltip: "Deposit must be paid and go-live date must be set."

#### State B: `status = 'not_sent'` and deposit IS paid but go_live_date is null

```
┌─ FINAL INVOICE (50%) ─────────────────────────────────────────┐
│  Amount: $21,131.06                                            │
│                                                                │
│  ⚠ Go-live date not set. Set the go-live date in              │
│    "Go-Live & Handoff" tab before sending final invoice.       │
│                                                                │
│  [→ Set Go-Live Date]  (switches to Go-Live tab)              │
│  [Send Final Invoice]  ← disabled                             │
└────────────────────────────────────────────────────────────────┘
```

"Set Go-Live Date" button: `onClick` switches active tab to "Go-Live & Handoff".

#### State C: `status = 'not_sent'` and deposit IS paid and go_live_date IS set

```
┌─ FINAL INVOICE (50%) ─────────────────────────────────────────┐
│  Hardware subtotal:    $18,333.00                              │
│  Service fee:          $20,000.00                              │
│  Subtotal:             $38,333.00                              │
│  Sales tax (10.25%):    $3,929.13                              │
│  Invoice total:        $42,262.13                              │
│  Final amount (50%):   $21,131.06   ← this invoice           │
│                                                                │
│  Go-live date: March 10, 2026  [✓]                            │
│                                                                │
│  Send final invoice:                                           │
│  Invoice number:  [text input]                                │
│  Date sent:       [date picker — default today]               │
│                                                                │
│  [Send Final Invoice]                                          │
└────────────────────────────────────────────────────────────────┘
```

Fields:
- `invoice_number`: text, required, max 50 chars
- `date_sent`: date picker, default today

Submit "Send Final Invoice": calls `markFinalInvoiceSent(projectId, invoiceNumber, dateSent)`.
On success: toast "Final invoice marked as sent", `revenue_stage` → `'final_invoiced'`.
On error from guard (go_live_date null): toast error "Set go-live date before sending final invoice."

#### State D: `status = 'sent'`

```
┌─ FINAL INVOICE (50%) ─────────────────────────────────────────┐
│  [SENT] Invoice #INV-2026-007   Sent: March 12, 2026          │
│  Final amount: $21,131.06                                      │
│                                                                │
│  Mark as received:                                             │
│  Date paid:  [date picker — default today]                     │
│                                                                │
│  [Mark Final Paid — Close Project]                             │
└────────────────────────────────────────────────────────────────┘
```

Submit "Mark Final Paid — Close Project": calls `markFinalPaid(projectId, datePaid)`.
Side effects: `revenue_stage` → `'final_paid'`, `project_status` → `'completed'`.
On success: toast "Project completed! Final payment recorded.", wizard enters read-only mode.

#### State E: `status = 'paid'`

```
┌─ FINAL INVOICE (50%) ─────────────────────────────────────────┐
│  [✓ PAID]  Invoice #INV-2026-007                              │
│  Sent: March 12, 2026  |  Paid: March 15, 2026               │
│  Amount: $21,131.06                                            │
│                                                                │
│  [✓] Project closed — all invoices paid.                      │
└────────────────────────────────────────────────────────────────┘
```

Read-only. No actions.

---

### 1.4 Invoice Tab — BOM Edit Warning

When `revenue_stage` is `'deposit_invoiced'` or later AND BOM items change (detected via route re-load when user navigates back from procurement tab), show a yellow warning banner at the top of the Contract & Invoicing tab:

```
⚠ Deposit invoice already sent — BOM changes after this point will NOT update the
  sent invoice. If costs changed significantly, create a change order in your billing
  system manually.
```

This is a soft warning only. No DB-level lock on BOM after invoicing.

---

### 1.5 Aging Receivables Display

Below the invoice cards, if any invoice is in `status = 'sent'`:

```
┌─ OUTSTANDING RECEIVABLES ─────────────────────────────────────┐
│  Deposit invoice: $21,131.07  sent March 3, 2026  (3 days)   │
│  Aging: [0-30 days] ← green badge                             │
└────────────────────────────────────────────────────────────────┘
```

Aging badge colors:
- 0–30 days: green (`bg-green-100 text-green-800`)
- 31–60 days: yellow (`bg-yellow-100 text-yellow-800`) + note "Follow up"
- 61–90 days: orange (`bg-orange-100 text-orange-800`) + note "Escalate"
- 90+ days: red (`bg-red-100 text-red-800`) + note "Overdue — contact Andy"

---

## Tab 2: Expenses

**File**: `src/components/wizard/financials/tabs/ExpensesTab.tsx`

### 2.1 Expense List

Header row:
```
Expenses                                      Total: $4,250.00
                                              [+ Add Expense]
```

Table with columns:
| Column | Field | Width | Notes |
|--------|-------|-------|-------|
| Date | `expense_date` | 100px | Format "Mar 5, 2026" |
| Category | `category` | 160px | Display label (see enum label map below) |
| Description | `description` | flex | Truncated to 60 chars, ellipsis |
| Payment | `payment_method` | 120px | "PodPlay Card" or "Ramp Reimburse" |
| Receipt | `receipt_url` | 60px | Paperclip icon if present, dash if missing |
| Amount | `amount` | 100px | Right-aligned, formatted as "$1,800.00" |
| Actions | — | 80px | Edit (pencil icon) + Delete (trash icon) |

**Sort**: By `expense_date` descending (most recent first). No user-facing sort controls.

**Empty state**: "No expenses logged yet. Click 'Add Expense' to add the first expense."

**Category totals footer row** (below table):
```
Labor (Professional Services):   $1,200.00
Travel (Airfare + Lodging + ...): $2,700.00
Shipping:                          $350.00
Other:                             $0.00
────────────────────────────────────────────
Total:                           $4,250.00
```

Travel subtotal groups: `airfare + car + fuel + lodging + meals + taxi + train + parking` combined into one "Travel" line.

---

### 2.2 Category Display Labels

| `expense_category` value | Display label |
|--------------------------|---------------|
| `airfare` | Airfare |
| `car` | Car Rental |
| `fuel` | Fuel |
| `lodging` | Lodging |
| `meals` | Meals |
| `misc_hardware` | Misc Hardware |
| `outbound_shipping` | Outbound Shipping |
| `professional_services` | Professional Services (Labor) |
| `taxi` | Taxi / Rideshare |
| `train` | Train |
| `parking` | Parking |
| `other` | Other |

---

### 2.3 Add Expense Form (Dialog)

Opened by "+ Add Expense" button or "Edit" action on existing row. Uses shadcn `<Dialog>` with `<Form>` (React Hook Form + Zod schema from `src/lib/schemas/expense.ts`).

**Dialog title**: "Add Expense" (new) or "Edit Expense" (edit).

Fields in order:

| Field | Component | Validation | Pre-fill logic |
|-------|-----------|------------|----------------|
| Date | `<DatePicker>` | Required, ≤ today + 1 day | Today |
| Category | `<Select>` (12 options) | Required | None (blank placeholder "Select category") |
| Amount | `<Input type="number" step="0.01">` | Required, > 0, ≤ 100000 | Pre-fill by category (see §2.4) |
| Payment method | `<RadioGroup>` (2 options) | Required | "PodPlay Card" |
| Description | `<Input type="text" maxLength={500}>` | Optional | Blank |
| Receipt URL | `<Input type="url">` | Optional, valid URL if filled | Blank |
| Notes | `<Textarea maxLength={1000}>` | Optional | Blank |

**Category → Amount pre-fill** (§2.4):
When category changes:
- `airfare` → set amount to `settings.airfare_default` ($1,800)
- `lodging` → set amount to `settings.lodging_per_day` ($250); note shown: "Multiply by nights on site"
- All others → clear amount to empty string (user enters actual)

**Payment method radio options**:
- "PodPlay Card (Ramp)" — value: `podplay_card` — default selected
- "Ramp Reimburse (personal card)" — value: `ramp_reimburse`

**Dialog footer**:
- "Cancel" button: closes dialog, discards changes
- "Save Expense" button: submits form; disabled during submission (shows spinner)

**Submit behavior** (new expense):
1. Validate with Zod schema
2. Call `addExpense(input)` from `invoicingService.ts`
3. On success: close dialog, toast "Expense added", invalidate route to refresh list
4. On error: show inline error below relevant field

**Submit behavior** (edit expense):
1. Validate with Zod schema
2. Call `updateExpense(id, updates)`
3. On success: close dialog, toast "Expense updated", invalidate route

---

### 2.5 Delete Expense

Clicking trash icon on a row shows a shadcn `<AlertDialog>`:

```
Delete Expense?

This will permanently delete this $1,800.00 Airfare expense from March 5, 2026.
This cannot be undone.

[Cancel]   [Delete]
```

On confirm: calls `deleteExpense(id)`.
On success: toast "Expense deleted", invalidate route.

Read-only mode: Edit and Delete icons are hidden. "This project is completed — expenses are locked." banner shown above table.

---

### 2.6 Log Installer Labor (Quick Action)

Below "+ Add Expense", a secondary action button:

```
[Log Installer Labor]
```

Visible only if `project.installer_hours` is set and no `professional_services` expense exists yet.

On click: calls `logInstallerLabor(projectId, project.installer_hours, settings, installer)` directly (no dialog — uses defaults).
- Creates expense: category=`professional_services`, amount=`installer_hours × rate`, payment_method=`podplay_card`, description=`"Installer labor: X hrs × $Y/hr"`, date=today
- On success: toast "Installer labor logged: $Z", list refreshes
- On failure: toast error

If `professional_services` expense already exists: button hidden, replaced by note "Installer labor already logged."

---

## Tab 3: P&L Review

**File**: `src/components/wizard/financials/tabs/PLReviewTab.tsx`

This tab is read-only computed display. All values are computed client-side via `computeProjectPnL()` from the loaded data.

### 3.1 P&L Summary Card

```
┌─ PROJECT P&L — Acme Pickleball (6 courts, Pro) ───────────────┐
│                                                                │
│  REVENUE                                                       │
│  Hardware sales:        $18,333.00                            │
│  Service fee:           $20,000.00                            │
│  Total revenue:         $38,333.00                            │
│                                                                │
│  COST OF GOODS SOLD                                            │
│  Hardware COGS:         $12,222.00  (sum of est_total_cost)   │
│                                                                │
│  GROSS PROFIT           $26,111.00       68.1% margin         │
│                                                                │
│  OPERATING EXPENSES                                            │
│  Labor (installer):      $1,200.00                            │
│  Travel:                 $2,350.00                            │
│  Shipping:                 $700.00                            │
│  Other:                      $0.00                            │
│  Total expenses:         $4,250.00                            │
│                                                                │
│  NET PROFIT              $21,861.00       57.0% margin        │
│                                                                │
│  Sales tax (10.25%):     $3,929.13  (informational)           │
└────────────────────────────────────────────────────────────────┘
```

Color coding:
- Positive net profit: green (`text-green-700`)
- Negative net profit: red (`text-red-700`)
- Gross margin % below 30%: orange warning icon next to value
- Net margin % below 15%: orange warning icon

If any BOM items have `null` `est_total_cost`, show inline warning:
"⚠ X BOM items have unknown unit costs — COGS may be understated."

---

### 3.2 Cash Flow Summary

Below the P&L card:

```
┌─ CASH FLOW ────────────────────────────────────────────────────┐
│  Total invoiced (incl. tax):  $42,262.13                       │
│  Total collected (incl. tax): $21,131.07                       │
│  Outstanding:                 $21,131.06                       │
│                                                                │
│  Revenue stage: [Deposit Paid]  ← colored pill                 │
└────────────────────────────────────────────────────────────────┘
```

Revenue stage pill colors (matching §10 of invoicing-expenses.md):
- `proposal`: gray `bg-gray-100 text-gray-700`
- `signed`: blue `bg-blue-100 text-blue-700`
- `deposit_invoiced`: yellow `bg-yellow-100 text-yellow-800`
- `deposit_paid`: green `bg-green-100 text-green-700`
- `final_invoiced`: orange `bg-orange-100 text-orange-800`
- `final_paid`: dark green `bg-green-200 text-green-900`

---

### 3.3 BOM Cost Breakdown (Collapsible)

A collapsed section "Show BOM Cost Detail" (chevron expand/collapse, shadcn `<Collapsible>`):

When expanded, shows a table of all BOM items:

| Item Name | Qty | Unit Cost | Total Cost | Customer Price | Margin |
|-----------|-----|-----------|------------|----------------|--------|
| Mac Mini M2 | 1 | $700.00 | $700.00 | $980.00 | 28.6% |
| ... | ... | ... | ... | ... | ... |

Items with null unit_cost shown as "—" with a warning icon.
Margin column: `(customer_price - est_total_cost) / customer_price × 100`, shown as percentage.
Items with negative margin: red text.

---

## Tab 4: Go-Live & Handoff

**File**: `src/components/wizard/financials/tabs/GoLiveHandoffTab.tsx`

### 4.1 Go-Live Date Section

```
┌─ GO-LIVE DATE ─────────────────────────────────────────────────┐
│  The go-live date is required before sending the final invoice. │
│                                                                │
│  Go-live date:  [date picker]                                  │
│                                                                │
│  [Save Go-Live Date]                                           │
└────────────────────────────────────────────────────────────────┘
```

If `project.go_live_date` is already set:
```
┌─ GO-LIVE DATE ─────────────────────────────────────────────────┐
│  [✓] Go-live: March 10, 2026                                  │
│                                                                │
│  [Change Date]  ← opens edit mode inline                       │
└────────────────────────────────────────────────────────────────┘
```

Field:
- `go_live_date`: date picker. Required. No restriction on past/future dates (allow backdating).

Submit "Save Go-Live Date":
- Calls `supabase.from('projects').update({ go_live_date: date }).eq('id', projectId)`
- On success: toast "Go-live date saved", invalidate route
- On success when `revenue_stage === 'deposit_paid'`: also show inline hint "Go-live date set — you can now send the final invoice."

---

### 4.2 Project Notes Section

```
┌─ HANDOFF NOTES ────────────────────────────────────────────────┐
│  Notes visible to the team (installer handoff, special config, │
│  follow-up items):                                             │
│                                                                │
│  [textarea — 10 rows]                                          │
│                                                                │
│  [Save Notes]                                                  │
└────────────────────────────────────────────────────────────────┘
```

Field: `project.notes` — textarea, max 5000 chars.

Submit "Save Notes": updates `projects.notes`.
On success: toast "Notes saved."

---

### 4.3 Project Completion Section

Shown only when both invoices have `status = 'paid'`.

```
┌─ PROJECT COMPLETE ─────────────────────────────────────────────┐
│  [✓] Deposit invoice paid                                      │
│  [✓] Final invoice paid                                        │
│  [✓] Go-live date set: March 10, 2026                         │
│                                                                │
│  All billing is complete. Mark this project as completed.      │
│                                                                │
│  [Mark Project Complete]                                       │
└────────────────────────────────────────────────────────────────┘
```

"Mark Project Complete" button:
- Shows `<AlertDialog>` confirmation:
  > "Mark Acme Pickleball as completed? This will close the project. Financial data will be locked (can be unlocked manually if needed)."
  > [Cancel] [Mark Complete]
- On confirm: calls `markFinalPaid()` (if final invoice not yet paid, it must be paid first — button disabled in that case), then updates `project_status = 'completed'`
- Actually: If final invoice is already paid (Status E state), this button instead just calls:
  ```typescript
  await supabase.from('projects').update({ project_status: 'completed' }).eq('id', projectId)
  ```
  (the `revenue_stage` was already set to `'final_paid'` by `markFinalPaid`)
- On success: toast "Project marked as completed!", wizard enters full read-only mode, stage tabs all show green checkmarks

**Guard**: Button disabled (grayed out, tooltip "Both invoices must be paid to close the project") if either invoice is not `'paid'`. Shows checklist of what is missing:
- [ ] Deposit invoice must be paid
- [ ] Final invoice must be paid

---

### 4.4 Read-Only Mode Banner

When `project_status === 'completed'`:

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Project completed on March 15, 2026. All data is locked.     │
│                                        [Unlock for editing]     │
└─────────────────────────────────────────────────────────────────┘
```

Banner: `bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center`

"Unlock for editing" button: opens `<AlertDialog>`:
> "Unlock this completed project for editing? Financial data will become editable. Re-lock by re-marking the project complete."
> [Cancel] [Unlock]

On confirm: sets local `isUnlocked = true` state (no DB write — unlock is UI-only, not persisted). All forms become editable. The "Mark Project Complete" button reappears. If user navigates away without re-locking, the project remains `status = 'completed'` in DB (no harm — unlock is transient UI state).

When `project_status === 'cancelled'`:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠ Project cancelled. Financial data is read-only.              │
└─────────────────────────────────────────────────────────────────┘
```

No unlock option for cancelled projects (they remain read-only permanently in this view).

---

## Component File Structure

```
src/components/wizard/financials/
├── FinancialsWizard.tsx                      # Main wizard component, tab container
├── tabs/
│   ├── ContractInvoicingTab.tsx              # Tab 1: Contract + deposit + final invoice
│   ├── ExpensesTab.tsx                       # Tab 2: Expense list + add/edit/delete
│   ├── PLReviewTab.tsx                       # Tab 3: Computed P&L display
│   └── GoLiveHandoffTab.tsx                  # Tab 4: Go-live date, notes, close project
├── components/
│   ├── InvoiceCard.tsx                       # Reusable invoice display card (deposit/final)
│   ├── ExpenseTable.tsx                      # Expense list table with sort/totals
│   ├── ExpenseDialog.tsx                     # Add/edit expense dialog (form + validation)
│   ├── PLSummaryCard.tsx                     # P&L computed display card
│   ├── CashFlowCard.tsx                      # Cash flow / receivables summary
│   ├── BomCostBreakdown.tsx                  # Collapsible BOM detail table
│   ├── RevenueStageProgress.tsx              # Horizontal milestone progress indicator
│   └── AgingReceivablesBadge.tsx             # Colored aging badge (0-30 days green, 31-60 days yellow, 61-90 days orange, 90+ days red)
└── schemas/
    └── (uses src/lib/schemas/expense.ts)     # Zod schema imported from shared lib
```

---

## FinancialsWizard Component

**File**: `src/components/wizard/financials/FinancialsWizard.tsx`

```tsx
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText, Receipt, TrendingUp, CheckCircle2 } from 'lucide-react'
import { ContractInvoicingTab } from './tabs/ContractInvoicingTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { PLReviewTab } from './tabs/PLReviewTab'
import { GoLiveHandoffTab } from './tabs/GoLiveHandoffTab'
import { RevenueStageProgress } from './components/RevenueStageProgress'
import { computeProjectPnL } from '@/services/invoicingService'
import type { Project, Invoice, Expense, ProjectBomItem, Settings } from '@/types'

interface FinancialsWizardProps {
  project: Project
  invoices: Invoice[]           // exactly 2 rows: deposit + final
  expenses: Expense[]
  settings: Settings
  bomItems: ProjectBomItem[]
}

export function FinancialsWizard({
  project, invoices, expenses, settings, bomItems
}: FinancialsWizardProps) {
  const [activeTab, setActiveTab] = useState('invoicing')
  const [isUnlocked, setIsUnlocked] = useState(false)

  const isReadOnly = (project.project_status === 'completed' || project.project_status === 'cancelled') && !isUnlocked

  const depositInvoice = invoices.find(i => i.invoice_type === 'deposit')!
  const finalInvoice = invoices.find(i => i.invoice_type === 'final')!
  const pnl = computeProjectPnL(project, bomItems, expenses, invoices, settings)

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Read-only banner */}
      {project.project_status === 'completed' && !isUnlocked && (
        <CompletedBanner project={project} onUnlock={() => setIsUnlocked(true)} />
      )}
      {project.project_status === 'cancelled' && (
        <CancelledBanner />
      )}

      {/* Revenue stage progress */}
      <RevenueStageProgress revenueStage={project.revenue_stage} />

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="invoicing">
            <FileText className="h-4 w-4 mr-2" />
            Contract & Invoicing
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Receipt className="h-4 w-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="pnl">
            <TrendingUp className="h-4 w-4 mr-2" />
            P&L Review
          </TabsTrigger>
          <TabsTrigger value="golive">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Go-Live & Handoff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoicing">
          <ContractInvoicingTab
            project={project}
            depositInvoice={depositInvoice}
            finalInvoice={finalInvoice}
            bomItems={bomItems}
            settings={settings}
            isReadOnly={isReadOnly}
            onGoToGoLive={() => setActiveTab('golive')}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab
            project={project}
            expenses={expenses}
            settings={settings}
            isReadOnly={isReadOnly}
          />
        </TabsContent>

        <TabsContent value="pnl">
          <PLReviewTab
            pnl={pnl}
            bomItems={bomItems}
            project={project}
          />
        </TabsContent>

        <TabsContent value="golive">
          <GoLiveHandoffTab
            project={project}
            depositInvoice={depositInvoice}
            finalInvoice={finalInvoice}
            isReadOnly={isReadOnly}
            onUnlockConfirm={() => setIsUnlocked(true)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Service Layer Functions

**File**: `src/services/invoicingService.ts` (additions to existing file)

All functions used in this wizard (complete signatures):

```typescript
// --- Read ---

// Fetch both invoices for a project (always returns 2 rows: deposit + final)
export async function getProjectInvoices(projectId: string): Promise<Invoice[]>

// Fetch all expenses for a project, ordered by expense_date DESC
export async function getProjectExpenses(projectId: string): Promise<Expense[]>

// --- Invoice mutations ---

// Mark contract as signed; advances revenue_stage → 'signed'
export async function markContractSigned(
  projectId: string,
  signedDate: string   // ISO 'YYYY-MM-DD'
): Promise<void>

// Mark deposit invoice sent; advances revenue_stage → 'deposit_invoiced'
// Throws if revenue_stage !== 'signed' or BOM not approved
export async function markDepositInvoiceSent(
  projectId: string,
  invoiceNumber: string,
  dateSent: string,         // ISO 'YYYY-MM-DD'
  depositPct?: number       // 0.01–0.99, default 0.50
): Promise<void>

// Mark deposit as paid; advances revenue_stage → 'deposit_paid'
export async function markDepositPaid(
  projectId: string,
  datePaid: string          // ISO 'YYYY-MM-DD'
): Promise<void>

// Mark final invoice sent; advances revenue_stage → 'final_invoiced'
// Throws if go_live_date not set or revenue_stage !== 'deposit_paid'
export async function markFinalInvoiceSent(
  projectId: string,
  invoiceNumber: string,
  dateSent: string          // ISO 'YYYY-MM-DD'
): Promise<void>

// Mark final invoice paid; advances revenue_stage → 'final_paid', project_status → 'completed'
export async function markFinalPaid(
  projectId: string,
  datePaid: string          // ISO 'YYYY-MM-DD'
): Promise<void>

// --- Expense mutations ---

// Create new expense row
export async function addExpense(input: CreateExpenseInput): Promise<Expense>

// Update existing expense row (partial update)
export async function updateExpense(
  id: string,
  updates: Partial<CreateExpenseInput>
): Promise<Expense>

// Delete expense row
export async function deleteExpense(id: string): Promise<void>

// Auto-create professional_services expense from installer hours
export async function logInstallerLabor(
  projectId: string,
  installerHours: number,
  settings: Settings,
  installer: Installer | null
): Promise<Expense>

// --- Client-side computed ---

// Compute full P&L from loaded data (pure function, no async)
export function computeProjectPnL(
  project: Project,
  bomItems: ProjectBomItem[],
  expenses: Expense[],
  invoices: Invoice[],
  settings: Settings
): ProjectPnL

// Aging bucket classification
export function getAgingBucket(dateSent: Date): AgingBucket

// Expense summary by category
export function summarizeExpensesByCategory(
  expenses: Expense[]
): Record<ExpenseCategory, number>
```

---

## Zod Schemas

**Invoice send form schema** (`src/lib/schemas/invoice.ts`):

```typescript
import { z } from 'zod'

export const sendInvoiceSchema = z.object({
  invoice_number: z
    .string()
    .min(1, 'Invoice number is required')
    .max(50, 'Invoice number must be 50 characters or less'),
  date_sent: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  deposit_pct: z
    .number()
    .min(1, 'Deposit % must be at least 1%')
    .max(99, 'Deposit % must be at most 99%')
    .optional()
    .default(50),
})

export type SendInvoiceFormValues = z.infer<typeof sendInvoiceSchema>

export const markPaidSchema = z.object({
  date_paid: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

export type MarkPaidFormValues = z.infer<typeof markPaidSchema>

export const contractSignedSchema = z.object({
  signed_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

export type ContractSignedFormValues = z.infer<typeof contractSignedSchema>
```

**Expense schema** (referenced from `src/lib/schemas/expense.ts` — spec'd in invoicing-expenses.md §15).

---

## Loading / Skeleton State

**File**: `src/components/wizard/financials/FinancialsWizardSkeleton.tsx`

```tsx
export function FinancialsWizardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Tab bar skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
      {/* Content skeleton */}
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
```

Uses shadcn `<Skeleton>` component (`src/components/ui/skeleton.tsx`).

---

## State Management Notes

- **No global state** — all data loaded from route loader, mutations invalidate route
- **Local tab state** — `activeTab` in `FinancialsWizard` useState
- **Local unlock state** — `isUnlocked` in `FinancialsWizard` useState (not persisted)
- **Optimistic updates**: NOT used — mutations await DB round-trip, then `router.invalidate()` triggers fresh load. Consistency with financial data is more important than perceived speed.
- **Form state**: each form dialog manages its own state via React Hook Form; forms reset when dialog closes (`<Dialog onOpenChange>` resets the form via `form.reset()`)

---

## Exit Condition: Project Complete

The wizard is "done" when:
1. `project.project_status === 'completed'`
2. `deposit.status === 'paid'`
3. `final.status === 'paid'`
4. `project.revenue_stage === 'final_paid'`

When this state is reached:
- The project shell stage tabs all show green checkmarks
- A "Project complete" green banner appears at the top of the financials wizard
- The dashboard listing shows the project with `status = 'completed'` pill
- No further wizard actions are available (read-only mode active)
