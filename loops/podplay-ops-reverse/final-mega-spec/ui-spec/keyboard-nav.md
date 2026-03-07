# PodPlay Ops Wizard — Keyboard Navigation Spec

**Aspect**: qa-keyboard-nav
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07

---

## Overview

This document specifies keyboard behavior for every interactive element in the PodPlay Ops Wizard. It covers Tab order within wizard forms, Enter/Escape key semantics, table row navigation, focus management after operations, and modal focus trapping.

All components use shadcn/radix primitives. Radix handles standard ARIA patterns (dialog focus trap, tabs roving tabindex, checkbox toggle). This spec defines the application-level behavior on top of those primitives.

---

## 1. Global Keyboard Behavior

### 1.1 Skip Link

A visually hidden "Skip to main content" anchor is rendered at the top of every authenticated page. It becomes visible on focus (`:focus-visible`). Clicking or pressing Enter moves focus to `<main id="main-content">`.

```tsx
// src/components/layout/SkipLink.tsx
<a
  href="#main-content"
  className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
>
  Skip to main content
</a>
```

### 1.2 Focus Ring

All focusable elements use Tailwind's `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. Mouse users do not see focus rings (`:focus-visible` only, not `:focus`). This is shadcn's default and must not be removed.

### 1.3 No Global Hotkeys

No application-level keyboard shortcuts (Ctrl+S, Ctrl+N, etc.) are defined. This is a single-user ops tool; global shortcuts add complexity without benefit. Exception: Escape always closes any open modal/dialog/dropdown regardless of where keyboard focus is.

---

## 2. Sidebar Navigation

The left sidebar (`src/components/layout/Sidebar.tsx`) contains nav items for: Dashboard, Inventory, Financials, Settings.

| Key | Behavior |
|-----|----------|
| Tab | Moves focus through sidebar items in DOM order |
| Enter / Space | Activates focused nav item (navigates to route) |
| Arrow Up / Down | No special behavior — standard Tab navigation only |

Active nav item has `aria-current="page"`. Each nav item is an `<a>` or `<Link>` element (not `<button>`), so Enter activates via standard anchor behavior.

On mobile (sidebar as drawer): when the drawer is open, focus is trapped inside the drawer. Escape closes the drawer and returns focus to the hamburger button.

---

## 3. Enter Key Behavior Reference

| Context | Enter behavior |
|---------|----------------|
| `<input type="text">` (single line) | Submits the form (implicit form submission) |
| `<input type="number">` | Submits the form (implicit form submission) |
| `<input type="email">` | Submits the form |
| `<input type="tel">` | Submits the form |
| `<textarea>` | Inserts newline — does NOT submit form |
| Radix `<Select>` trigger | Opens dropdown |
| Radix `<Select>` option (when open) | Selects option and closes dropdown |
| Radix `<Checkbox>` | Toggles checked state (same as Space) |
| Radix `<RadioGroupItem>` | Selects item |
| `<button>` | Activates button (same as click) |
| Focused table row (`<tr tabIndex={0}>`) | Navigates to item detail (dashboard rows) |
| Deployment phase sidebar button | Switches to that phase |
| Deployment checklist `<Checkbox>` | Toggles step completion |
| shadcn `<DatePicker>` trigger button | Opens calendar popover |
| Calendar day cell (inside open popover) | Selects date and closes calendar |
| Combobox trigger | Opens dropdown |
| Focused combobox option | Selects option |
| Dialog confirm/submit `<button>` | Submits dialog form |

### Implicit Form Submission Rule

All wizard step forms and dialog forms that contain at least one `<input>` (not textarea) support implicit form submission: pressing Enter while focus is on any text/number/email/tel input submits the form. This is standard HTML5 behavior and requires no special handling — the form's `onSubmit` handler fires. The form must have a single submit button (or `type="submit"`) for this to work correctly.

**Exception**: Forms with multiple buttons (e.g., "Back" + "Next") must ensure only "Next"/"Submit" is `type="submit"` and "Back" is `type="button"` to prevent accidental back navigation on Enter.

---

## 4. Escape Key Behavior Reference

| Context | Escape behavior |
|---------|-----------------|
| Any open Radix `<Dialog>` | Closes dialog without saving; focus returns to trigger |
| Open Radix `<Select>` dropdown | Closes dropdown; keeps previous value; focus returns to trigger |
| Open shadcn `<DatePicker>` calendar | Closes calendar; keeps previous value |
| Open Combobox dropdown | Closes dropdown; keeps previous value |
| Open mobile sidebar drawer | Closes drawer; focus returns to hamburger button |
| Inline note textarea (deployment checklist) | Collapses note panel; saves current text on blur before collapse |
| Wizard step form (no dialog open) | No action |
| Dashboard search input | Clears search text and re-focuses input (does NOT navigate away) |

---

## 5. Tabbed Interfaces

Procurement Wizard, Financials Wizard, and Settings page all use shadcn `<Tabs>` (Radix Tabs with `activationMode="automatic"`).

### Radix Tabs Keyboard Pattern

| Key | Behavior |
|-----|----------|
| Tab (when focus enters tab list) | Focuses the currently active tab trigger |
| Arrow Left / Right | Moves focus to previous/next tab trigger AND activates that tab |
| Home | Moves focus to first tab trigger and activates it |
| End | Moves focus to last tab trigger and activates it |
| Tab (when focus is on active tab trigger) | Moves focus into tab panel content (first focusable element) |
| Shift+Tab (from first element in tab panel) | Returns focus to the active tab trigger |

### Procurement Wizard Tabs (6 tabs)

Tab order within the tab list (left → right):
1. BOM
2. Inventory
3. Purchase Orders
4. Packing
5. CC Terminals (visible only if `has_front_desk = true`)
6. Replay Signs

### Financials Wizard Tabs (5 tabs)

Tab order within the tab list:
1. Contract
2. Invoicing
3. Expenses
4. P&L
5. Go-Live

### Settings Tabs (4 tabs)

Tab order within the tab list:
1. Pricing
2. Hardware Catalog
3. Team & OpEx
4. Travel & Defaults

---

## 6. Intake Wizard — Tab Order Per Step

The Intake Wizard uses a `<form>` per step rendered by React Hook Form. Tab order follows DOM order. All fields are rendered top-to-bottom as listed below.

### Step 1: Customer Info

Tab order:
1. `customer_name` — `<input type="text">`
2. `venue_name` — `<input type="text">`
3. `venue_address_line1` — `<input type="text">`
4. `venue_address_line2` — `<input type="text">`
5. `venue_city` — `<input type="text">`
6. `venue_state` — `<input type="text">`
7. `venue_country` — `<input type="text">`
8. `venue_zip` — `<input type="text">`
9. `contact_name` — `<input type="text">`
10. `contact_email` — `<input type="email">`
11. `contact_phone` — `<input type="tel">`
12. "Next: Configuration" — `<button type="submit">`

Enter on any text/email/tel input: submits Step 1 form (triggers validation, advances to Step 2 if valid).

### Step 2: Configuration

Tab order:
1. `tier` — Radix `<Select>` trigger
2. `court_count` — `<input type="number" min="1" max="50" step="1">`
3. `door_count` — `<input type="number" min="0" max="20" step="1">`
4. `security_camera_count` — `<input type="number" min="0" max="30" step="1">`
5. `has_nvr` — Radix `<Checkbox>`
6. `has_pingpod_wifi` — Radix `<Checkbox>` (rendered only when `tier = 'pbk'` or PingPod context)
7. `has_front_desk` — Radix `<Checkbox>`
8. "Next: ISP & Networking" — `<button type="submit">`

Arrow Up/Down on number inputs: increments/decrements by 1 (browser default). No special handling needed.

### Step 3: ISP & Networking

Tab order:
1. `isp_provider` — `<input type="text">`
2. `isp_type` — Radix `<RadioGroup>` (Arrow keys navigate within group; Tab exits group)
3. `has_static_ip` — Radix `<Checkbox>`
4. `has_backup_isp` — Radix `<Checkbox>`
5. `download_speed_mbps` — `<input type="number" min="1">`
6. `upload_speed_mbps` — `<input type="number" min="1">`
7. "Next: Scheduling" — `<button type="submit">`

RadioGroup (`isp_type`) keyboard:
- Tab enters the group and focuses the selected item (or first if none selected)
- Arrow Left/Right/Up/Down: moves selection within group
- Tab: exits group to next field (`has_static_ip`)
- Shift+Tab: exits group back to `isp_provider`

ISP validation warning banner (Starlink incompatibility): not focusable, informational only.

### Step 4: Scheduling & Installer

Tab order:
1. `scheduled_install_date` — shadcn DatePicker trigger button → calendar popover when open
2. `primary_installer_id` — shadcn Combobox (searchable Select)
3. `is_international` — Radix `<Checkbox>`
4. `venue_timezone` — Radix `<Select>` trigger (rendered when `is_international = true`)
5. "Next: Financial Details" — `<button type="submit">`

Combobox (`primary_installer_id`) keyboard:
- Enter/Space on trigger: opens dropdown
- Type characters: filters installer list
- Arrow Down/Up: navigate options
- Enter: select focused option
- Escape: close without selecting

### Step 5: Financial Details

Tab order:
1. `contract_value` — `<input type="number" min="0" step="0.01">`
2. `deposit_amount` — `<input type="number" min="0" step="0.01">`
3. `notes` — `<textarea rows="4">`
4. "Next: Review" — `<button type="submit">`

Enter on `contract_value` or `deposit_amount`: submits Step 5 form (advances to Step 6 if valid).
Enter inside `notes` textarea: inserts newline only.

### Step 6: Review

No form fields. The review step shows a read-only summary of all entered data.

Tab order:
1. Each "Edit" link (one per step section) — `<button type="button">` jumps back to that step
2. "Submit & Generate BOM" — `<button type="button">` (not `type="submit"` — this is the final action button; handler calls `handleSubmit`)

Enter on "Submit & Generate BOM": activates button (standard button Enter behavior).

---

## 7. Procurement Wizard — Keyboard Behavior Per Tab

### BOM Tab

BOM table rows are read-only (no row-level focus). Only interactive elements:
- Each row's "Edit" pencil `<IconButton>`: Tab-focusable, Enter/Space opens EditBomItemDialog
- "Add Custom Item" button: Tab-focusable, Enter/Space opens AddBomItemDialog

Tab order within BOM tab content:
1. "Add Custom Item" button
2. Edit buttons per row (top to bottom)

### Inventory Check Tab

Inventory check table is read-only. No interactive elements except:
- "View Inventory" link at bottom: Tab-focusable, Enter navigates to `/inventory`

### Purchase Orders Tab

Tab order:
1. "Create PO" button
2. Each PO row expand button (if PO list is collapsible)
3. Inside expanded PO: "Add Item" button, each item row's "Remove" button
4. "Mark PO Received" button per PO

### Packing Tab

Tab order:
1. Each packing checklist `<Checkbox>` (top to bottom, follows packing list order)
2. "Mark All Packed" button

Space or Enter on Checkbox: toggles packed state.

### CC Terminals Tab (conditional, `has_front_desk = true`)

Tab order:
1. `terminal_model` — `<Select>` or pre-filled read-only display
2. `ordered_date` — DatePicker
3. `delivered` — `<Checkbox>`
4. `installed` — `<Checkbox>`
5. "Save" button

### Replay Signs Tab

Tab order:
1. `outreach_sent` — `<Checkbox>`
2. `outreach_date` — DatePicker (rendered when `outreach_sent = true`)
3. `shipped` — `<Checkbox>`
4. `ship_date` — DatePicker (rendered when `shipped = true`)
5. `delivered` — `<Checkbox>`
6. `installed` — `<Checkbox>`
7. "Save" button

### Advance Button ("Mark Ready for Deployment")

Rendered at the bottom of the Procurement Wizard, outside the tab panels. Tab order: after the last element in the active tab panel, before sidebar/nav.

When disabled (exit conditions not met): `tabIndex={0}`, `aria-disabled="true"`, tooltip shown on focus describing which conditions are unmet. Do NOT use `disabled` attribute — use `aria-disabled` + click handler guard so the button remains focusable and the tooltip is accessible.

---

## 8. Deployment Wizard — Keyboard Behavior

### Phase Sidebar

The left panel lists 16 phase buttons (Phase 0–15). Each is a `<button type="button">`.

Tab order: each phase button in sequence (Phase 0 → Phase 15).

| Key | Behavior |
|-----|----------|
| Tab | Moves to next phase button |
| Shift+Tab | Moves to previous phase button |
| Enter / Space | Switches main panel to that phase |

No arrow key navigation within the phase list (it is a simple button list, not a listbox). `aria-current="true"` on the active phase button.

### Checklist Items

Each checklist step renders:
```
[Checkbox] [Step text label] [Notes button] [Auto-fill button (if applicable)]
```

All are inline within the phase detail panel.

Tab order within a phase panel: checkbox → notes button → auto-fill button, per step from top to bottom.

| Element | Key | Behavior |
|---------|-----|----------|
| Checklist `<Checkbox>` | Space | Toggles completion (optimistic update) |
| Checklist `<Checkbox>` | Enter | Toggles completion |
| "Notes" `<button>` | Enter / Space | Expands inline note textarea below step |
| Inline note `<textarea>` | Enter | Inserts newline |
| Inline note `<textarea>` | Escape | Collapses note panel; saves text |
| Inline note `<textarea>` | Tab | Moves focus to next element (blur saves note) |
| "Auto-fill" `<button>` | Enter / Space | Executes auto-fill action (populates token into adjacent field) |

### Status Advance Buttons

"Advance to [Next Status]" button at top of deployment page: Tab-focusable, Enter/Space opens confirmation dialog.

When disabled (phase completion conditions not met): `aria-disabled="true"`, tooltip on focus.

---

## 9. Financials Wizard — Keyboard Behavior Per Tab

### Contract Tab

Tab order:
1. `contract_signed_date` — DatePicker trigger
2. "Mark Contract Signed" — `<button type="submit">` (or `type="button"` if inline)

### Invoicing Tab

Tab order:
1. Deposit invoice row "Send Invoice" button → opens SendInvoiceDialog
2. Deposit invoice row "Mark Paid" button → opens MarkPaidDialog
3. Final invoice row "Send Invoice" button → opens SendInvoiceDialog
4. Final invoice row "Mark Paid" button → opens MarkPaidDialog

Invoice rows are NOT individually focusable (table rows are read-only; actions are via buttons within cells).

### Expenses Tab

Tab order:
1. "Add Expense" button → opens AddExpenseDialog
2. Each expense row "Delete" button (tab order: top to bottom)

Expense table rows are NOT focusable (read-only display).

### P&L Tab

No interactive elements. Fully read-only table. No focusable elements except the tab trigger itself.

### Go-Live Tab

Tab order:
1. `go_live_date` — DatePicker trigger
2. `handoff_notes` — `<textarea rows="4">` (Enter = newline)
3. "Mark Go-Live" — `<button type="button">`
4. "Mark Project Complete" — `<button type="button">` (renders after go-live is set)

---

## 10. Dashboard Table

The project list table (`DashboardPage`) has focusable rows.

Each `<tr>` element: `tabIndex={0}`, `role="row"`, `aria-label="{customer_name} — {venue_name}"`.

| Key | Behavior |
|-----|----------|
| Tab | Moves focus to next row |
| Shift+Tab | Moves focus to previous row |
| Enter | Navigates to project's current wizard stage (same as clicking the row) |
| Arrow Down | Moves focus to next row (same as Tab within table body) |
| Arrow Up | Moves focus to previous row |

Navigation destination on Enter: determined by `project_status`:
- `intake` → `/projects/$projectId/intake`
- `procurement` → `/projects/$projectId/procurement`
- `deployment` → `/projects/$projectId/deployment`
- `financial_close` → `/projects/$projectId/financials`
- `completed` → `/projects/$projectId/financials`
- `cancelled` → `/projects/$projectId/intake`

"New Project" button: Tab-focusable, comes before the table in Tab order (placed in page header). Enter/Space creates new project.

Filter controls (status filter, tier filter, search input): Tab-focusable, come before the table in Tab order.

Search input clear button (X icon): `aria-label="Clear search"`, Tab-focusable, Enter/Space clears search.

---

## 11. Inventory Page Table

Inventory table rows are NOT individually focusable. The table is a read-only stock display. Actions are accessed via buttons within the row.

Tab order within each row:
1. "Adjust" button (opens AdjustmentDialog)
2. "Set Threshold" button / inline threshold input

Tab order on the page:
1. "Add Item" button (top of page)
2. Category filter tabs
3. Search input
4. For each row: "Adjust" button, then threshold field/button

---

## 12. Global Financials Page

All tables are read-only (P&L summary, HER chart, monthly breakdown, per-project P&L table). No focusable table rows.

Interactive elements:
- Month/year filter Select
- "Export" button (if present)
- Per-project table rows: NOT focusable (view-only)
- Tab triggers (monthly/quarterly/annual toggle)

---

## 13. Settings Page

### Pricing Tab

Each pricing tier row has an "Edit" button. Tab order: "Edit" buttons top to bottom. Enter/Space on "Edit" opens EditPricingTierDialog.

### Hardware Catalog Tab

Tab order:
1. "Add Item" button
2. Category filter
3. Search input
4. Each row's "Edit" button (top to bottom)
5. Each row's "Archive" button

Table rows are NOT focusable. Actions via per-row buttons.

### Team & OpEx Tab

Tab order:
1. Each team member row's "Edit" button (opens EditTeamMemberDialog)
2. "Add Team Member" button

### Travel & Defaults Tab

All fields are inline-editable inputs:

Tab order follows DOM order (top to bottom):
1. `default_travel_cost_per_day` — `<input type="number">`
2. `default_hotel_cost_per_night` — `<input type="number">`
3. `default_flight_cost` — `<input type="number">`
4. `default_rental_car_cost_per_day` — `<input type="number">`
5. "Save Defaults" — `<button type="submit">`

---

## 14. Dialog / Modal Keyboard Behavior

All dialogs use shadcn `<Dialog>` (Radix Dialog). Radix handles focus trap and Escape automatically.

### On Open

Focus moves to the **first focusable element** inside the dialog. Each dialog's first focus target:

| Dialog | First Focus |
|--------|-------------|
| SendInvoiceDialog | `date_sent` date input |
| MarkPaidDialog | `date_paid` date input |
| AddExpenseDialog | `description` text input |
| EditExpenseDialog | `description` text input |
| AdjustmentDialog (inventory) | `quantity` number input |
| CreatePODialog | `vendor` text input |
| EditBomItemDialog | `unit_cost` number input |
| AddBomItemDialog | `name` text input (catalog search combobox) |
| AddHardwareCatalogItemDialog | `name` text input |
| EditHardwareCatalogItemDialog | `name` text input |
| EditPricingTierDialog | First price field (e.g., `base_price`) |
| EditTeamMemberDialog | `name` text input |
| AdvanceStatusConfirmDialog | "Confirm" button |
| DeleteConfirmDialog | "Cancel" button (safe default — destructive dialogs default focus to Cancel) |

### Focus on Close

On close (any method: Escape, cancel button, or confirm button), focus returns to the element that triggered the dialog open (the button that was clicked). Radix Dialog handles this automatically.

### Tab Within Dialog

Tab cycles through all focusable elements within the dialog only (focus trap). Order: form fields top-to-bottom, then Cancel button, then Confirm/Submit button.

Shift+Tab cycles backwards.

### Destructive Dialogs (Delete/Cancel operations)

For dialogs that perform irreversible actions (delete project, cancel PO, adjust stock downward, mark project cancelled), the default focus on open is the **Cancel** button, not the Confirm button. This prevents accidental confirmation via keyboard mashing.

Affected dialogs:
- DeleteProjectDialog → focus: "Cancel" button
- CancelPODialog → focus: "Cancel" button
- AdjustStockDownDialog (when quantity decreases) → focus on first input field (quantity), not Confirm, because user must enter a value first
- MarkProjectCancelledDialog → focus: "Keep Active" (Cancel) button
- ArchiveHardwareItemDialog → focus: "Cancel" button

---

## 15. Focus Management After Operations

### After Multi-Step Form Advance (Wizard)

After submitting a wizard step and advancing to the next step, focus moves to the **first field** of the new step. Implemented via `useEffect` watching the current step index + `ref.focus()` on the first input.

```tsx
// Pattern: IntakeWizard.tsx
const firstFieldRef = useRef<HTMLInputElement>(null)
useEffect(() => {
  if (firstFieldRef.current) {
    firstFieldRef.current.focus()
  }
}, [currentStep])
```

### After Dialog Close (Saved or Cancelled)

Radix Dialog automatically returns focus to the trigger element. No manual focus management needed.

### After Row Delete (Expense, PO item)

After deleting a row from a list:
- If the deleted row was not the last row: focus moves to the **Delete button of the next row** (same position in list)
- If the deleted row was the last row: focus moves to the **"Add" button** at the top of the list

Implemented in the `onSuccess` callback of the delete mutation.

### After Page Navigation

TanStack Router does not manage focus on route change. Each page's route component fires a `useEffect` on mount that calls `document.getElementById('main-content')?.focus()` to move focus to the main content area. The `<main id="main-content" tabIndex={-1}>` element receives focus programmatically (tabIndex=-1 means it can receive programmatic focus but is not in Tab order).

### After Search / Filter Change

After a search input changes and results re-render: focus stays on the search input (no focus movement). Screen reader live region announces result count: `aria-live="polite"` `aria-atomic="true"` region at top of results: "Showing {n} projects."

---

## 16. ARIA Live Regions

| Region | Location | `aria-live` | Content |
|--------|----------|-------------|---------|
| Search result count | Dashboard filter bar | `polite` | "Showing {n} projects" |
| Deployment checklist progress | Deployment wizard header | `polite` | "{n} of {total} steps complete" (updated on checkbox toggle) |
| Toast notifications | Sonner Toaster | (handled by Sonner — uses `role="status"`) | Toast message text |
| Inline validation errors | Each form field | `aria-live="polite"` on error span (React Hook Form sets `aria-describedby`) | Error message text |
| Auto-save indicator (notes) | Deployment checklist | `aria-live="polite"` | "Saving...", "Saved", "Failed to save" |

---

## 17. Number Input Arrow Key Behavior

shadcn does not override native `<input type="number">` behavior. Browser defaults apply:

| Key | Behavior |
|-----|----------|
| Arrow Up | Increment by `step` (default 1) |
| Arrow Down | Decrement by `step` (default 1) |
| Page Up | Increment by `step * 10` (Chrome/Firefox) |
| Page Down | Decrement by `step * 10` |
| Home | Jump to `min` value (if specified) |
| End | Jump to `max` value (if specified) |

Fields with specific `step` values:
- `contract_value`, `deposit_amount`, `unit_cost`, `landed_cost`: `step="0.01"`
- All count fields (`court_count`, `door_count`, `security_camera_count`, `quantity`): `step="1"`
- Speed fields (`download_speed_mbps`, `upload_speed_mbps`): `step="1"`
- Cost fields in Settings: `step="0.01"`

---

## 18. Disabled vs Aria-Disabled

For buttons that are conditionally disabled based on workflow state (e.g., "Advance to Procurement" when Step 6 is incomplete, "Mark Ready for Deployment" when exit conditions are not met):

- Use `aria-disabled="true"` + pointer-events/click guard — NOT `disabled` attribute
- This keeps the button in Tab order so the tooltip explaining why it is disabled is reachable by keyboard
- Tooltip is triggered on `:focus-visible` (not just hover) via `title` attribute OR a Radix Tooltip with `open` controlled by focus state

Pattern:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      aria-disabled={!canAdvance}
      onClick={canAdvance ? handleAdvance : undefined}
      className={cn(
        "...",
        !canAdvance && "opacity-50 cursor-not-allowed"
      )}
    >
      Advance to Procurement
    </button>
  </TooltipTrigger>
  {!canAdvance && (
    <TooltipContent>
      Complete all required fields before advancing
    </TooltipContent>
  )}
</Tooltip>
```

Exceptions — use `disabled` attribute (button intentionally unreachable):
- "Back" button on Step 1 of Intake (no previous step exists)
- Submit buttons inside loading state (to prevent double-submit): `disabled={isPending}`

---

## 19. Implementation File

**File**: `src/lib/keyboard-nav.ts`

Contains shared keyboard utilities:

```typescript
// Focus first focusable element in a container
export function focusFirst(container: HTMLElement): void {
  const selector = 'input, select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  const first = container.querySelector<HTMLElement>(selector)
  first?.focus()
}

// Move focus to main content area after navigation
export function focusMainContent(): void {
  const main = document.getElementById('main-content')
  if (main) main.focus()
}

// Handle row keyboard navigation (dashboard table)
export function handleRowKeyDown(
  e: React.KeyboardEvent<HTMLTableRowElement>,
  onActivate: () => void
): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    onActivate()
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const next = e.currentTarget.nextElementSibling as HTMLElement | null
    next?.focus()
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = e.currentTarget.previousElementSibling as HTMLElement | null
    prev?.focus()
  }
}
```
