# Component Library — Philippine Freelance & Self-Employed Income Tax Optimizer

Every UI component needed to build the platform. Each component lists props, variants, states, and exact visual specifications. References design tokens from [design-system.md](design-system.md).

---

## 1. Button

### 1.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'link'` | No | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Size preset |
| `disabled` | `boolean` | No | `false` | Disabled state |
| `loading` | `boolean` | No | `false` | Loading spinner state |
| `iconLeft` | `ReactNode` | No | `undefined` | Icon before label |
| `iconRight` | `ReactNode` | No | `undefined` | Icon after label |
| `fullWidth` | `boolean` | No | `false` | 100% width |
| `type` | `'button' \| 'submit' \| 'reset'` | No | `'button'` | HTML type |

### 1.2 Variants

**Primary**
- Background: `brand-600` (`#1D4ED8`)
- Text: `neutral-0` (`#FFFFFF`)
- Border: none
- Hover: background `brand-700` (`#1E40AF`)
- Active/pressed: background `brand-800` (`#1E3A8A`), transform `scale(0.98)`
- Disabled: background `neutral-300` (`#D6D3D1`), text `neutral-500` (`#78716C`), cursor `not-allowed`
- Loading: background `brand-600`, spinner 16px white, text "Computing…" for compute button

**Secondary**
- Background: `neutral-0` (`#FFFFFF`)
- Text: `neutral-900` (`#1C1917`)
- Border: `1px solid neutral-300` (`#D6D3D1`)
- Hover: background `neutral-100` (`#F5F5F4`), border `neutral-400` (`#A8A29E`)
- Active: background `neutral-200` (`#E7E5E4`), transform `scale(0.98)`
- Disabled: background `neutral-50`, text `neutral-400`, border `neutral-200`, cursor `not-allowed`

**Ghost**
- Background: `transparent`
- Text: `brand-600` (`#1D4ED8`)
- Border: none
- Hover: background `brand-50` (`#EFF6FF`)
- Active: background `brand-100` (`#DBEAFE`)
- Disabled: text `neutral-400`, cursor `not-allowed`

**Danger**
- Background: `danger-600` (`#DC2626`)
- Text: `neutral-0` (`#FFFFFF`)
- Border: none
- Hover: background `danger-700` (`#B91C1C`)
- Active: transform `scale(0.98)`
- Disabled: background `neutral-300`, text `neutral-500`, cursor `not-allowed`

**Link**
- Background: `transparent`
- Text: `brand-600`, underline on hover
- Border: none
- Hover: text `brand-700`, text-decoration `underline`
- Active: text `brand-800`
- Disabled: text `neutral-400`, no underline

### 1.3 Sizes

| Size | Height | Padding (H × V) | Font Size | Icon Size |
|---|---|---|---|---|
| `sm` | `32px` | `12px × 6px` | `text-sm (14px)` | `icon-sm (16px)` |
| `md` | `40px` | `16px × 8px` | `text-base (16px)` | `icon-base (20px)` |
| `lg` | `48px` | `20px × 10px` | `text-lg (18px)` | `icon-base (20px)` |

### 1.4 Loading State

When `loading={true}`:
- Button disabled, cursor `wait`
- Label replaced by: `<Spinner size="16px" color="currentColor" /> {loadingLabel}`
- `loadingLabel` defaults to "Loading…" but is overridden by the parent component (e.g., compute button shows "Computing…")

---

## 2. Input Field

### 2.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | Yes | — | Visible label above input |
| `name` | `string` | Yes | — | HTML name and id |
| `type` | `'text' \| 'number' \| 'email' \| 'tel' \| 'password'` | No | `'text'` | Input type |
| `value` | `string \| number` | Yes | — | Controlled value |
| `onChange` | `(value: string) => void` | Yes | — | Change handler |
| `placeholder` | `string` | No | `''` | Placeholder text |
| `hint` | `string` | No | `undefined` | Helper text below input |
| `error` | `string` | No | `undefined` | Error message (shown in red below input) |
| `required` | `boolean` | No | `false` | Adds asterisk to label |
| `disabled` | `boolean` | No | `false` | Disabled state |
| `prefix` | `string` | No | `undefined` | Text prefix (e.g., `₱`) |
| `suffix` | `string` | No | `undefined` | Text suffix (e.g., `%`) |
| `iconLeft` | `ReactNode` | No | `undefined` | Icon inside input, left |
| `iconRight` | `ReactNode` | No | `undefined` | Icon inside input, right |
| `autoFormat` | `'peso' \| 'percent' \| 'none'` | No | `'none'` | Auto-formats value on blur |

### 2.2 States

| State | Border | Background | Text | Shadow |
|---|---|---|---|---|
| Default | `1px solid neutral-300` | `neutral-0` | `neutral-900` | `shadow-xs` |
| Focus | `2px solid brand-600` | `neutral-0` | `neutral-900` | `shadow-focus` |
| Error | `2px solid danger-600` | `danger-100` | `neutral-900` | `shadow-focus-danger` |
| Disabled | `1px solid neutral-200` | `neutral-100` | `neutral-500` | none |
| Read-only | `1px dashed neutral-300` | `neutral-50` | `neutral-700` | none |

### 2.3 Layout

- Input height: `40px` (size `md`)
- Internal padding: `12px horizontal, 10px vertical`
- Label: `text-sm (14px)`, weight `500`, color `neutral-900`, `margin-bottom: space-1.5 (6px)`
- Error message: `text-xs (12px)`, weight `400`, color `danger-600`, `margin-top: space-1 (4px)`, preceded by `ExclamationCircle` icon `12px`
- Hint text: `text-xs (12px)`, weight `400`, color `neutral-600`, `margin-top: space-1 (4px)`
- Peso prefix `₱`: displayed in JetBrains Mono, color `neutral-600`, inside a left-padded container

### 2.4 Auto-Format — Peso

When `autoFormat="peso"`:
- On focus: show raw number (e.g., `500000`)
- On blur: format with comma-separators (e.g., `500,000`)
- Precision: 2 decimal places for peso amounts, 0 for whole-peso inputs
- Negative values: disallowed — on blur, clamp to `0`

### 2.5 Auto-Format — Percent

When `autoFormat="percent"`:
- Display: append `%` suffix visually (not in value)
- On blur: clamp to `[0, 100]`
- Precision: up to 2 decimal places

---

## 3. Select / Dropdown

### 3.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | Yes | — | Visible label |
| `name` | `string` | Yes | — | HTML name |
| `value` | `string` | Yes | — | Currently selected value |
| `onChange` | `(value: string) => void` | Yes | — | Change handler |
| `options` | `{value: string, label: string, disabled?: boolean}[]` | Yes | — | Option list |
| `placeholder` | `string` | No | `'Select…'` | Placeholder option |
| `hint` | `string` | No | `undefined` | Helper text |
| `error` | `string` | No | `undefined` | Error message |
| `required` | `boolean` | No | `false` | Required indicator |
| `disabled` | `boolean` | No | `false` | Disabled state |

### 3.2 Visual

- Height: `40px`
- Border: same as Input states
- Right icon: `ChevronDown` 16px, color `neutral-500`
- Options panel: `neutral-0` background, `shadow-base`, `radius-md`, `z-dropdown`
- Option hover: background `neutral-100`
- Selected option: background `brand-50`, text `brand-700`, checkmark icon `16px brand-600` on right

---

## 4. Radio Group

Used for taxpayer type selection (Freelancer / Registered Professional / Sole Proprietor) and regime selection.

### 4.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | Yes | — | Group label |
| `name` | `string` | Yes | — | HTML radio group name |
| `value` | `string` | Yes | — | Selected value |
| `onChange` | `(value: string) => void` | Yes | — | Change handler |
| `options` | `{value: string, label: string, description?: string, badge?: string}[]` | Yes | — | Options |
| `orientation` | `'horizontal' \| 'vertical'` | No | `'vertical'` | Layout direction |
| `error` | `string` | No | `undefined` | Group-level error |

### 4.2 Visual — Card Radio (used for taxpayer type)

Each option renders as a selectable card:
- Width: fills column (responsive)
- Padding: `space-4 (16px)` all sides
- Border: `1px solid neutral-200` at rest; `2px solid brand-600` when selected
- Background: `neutral-0` at rest; `brand-50` when selected
- Radio circle: `20px` circle, `2px border neutral-400` at rest; `brand-600` fill with white center when selected
- Label: `text-base (16px)`, weight `600`, color `neutral-900`
- Description: `text-sm (14px)`, weight `400`, color `neutral-700`
- Badge (e.g., "Recommended"): pill shape, `brand-200` background, `brand-700` text, `text-xs (12px)`, `radius-full`, padding `2px 8px`

### 4.3 Visual — Inline Radio (used for yes/no fields)

Compact inline layout. Circle + label, no card border. Spacing between options: `space-6 (24px)`.

---

## 5. Checkbox

### 5.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | Yes | — | Visible label |
| `name` | `string` | Yes | — | HTML name |
| `checked` | `boolean` | Yes | — | Checked state |
| `onChange` | `(checked: boolean) => void` | Yes | — | Change handler |
| `description` | `string` | No | `undefined` | Sub-label text |
| `disabled` | `boolean` | No | `false` | Disabled state |
| `error` | `string` | No | `undefined` | Error message |

### 5.2 Visual

- Box: `18px × 18px`, `radius-sm (4px)`, border `2px solid neutral-400` at rest
- Checked: border `brand-600`, fill `brand-600`, white checkmark (SVG path)
- Hover: border `brand-500`
- Disabled: border `neutral-200`, fill `neutral-100`, checkmark `neutral-400`
- Label: `text-base (16px)`, weight `400`, `margin-left: space-3 (12px)`, inline with box
- Description: `text-sm (14px)`, `neutral-600`, below label, `margin-left: space-6 (24px)` (indented to align with label)

---

## 6. Toggle Switch

Used for boolean preferences (e.g., "I have CWT to claim", "I have quarterly payments to credit").

### 6.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | Yes | — | Label text |
| `checked` | `boolean` | Yes | — | Checked state |
| `onChange` | `(checked: boolean) => void` | Yes | — | Change handler |
| `description` | `string` | No | `undefined` | Sub-text |
| `disabled` | `boolean` | No | `false` | Disabled |

### 6.2 Visual

- Track: `44px × 24px`, `radius-full`
- Track OFF: background `neutral-300`
- Track ON: background `brand-600`
- Knob: `20px` circle, white, `shadow-sm`, positioned `2px` from track edge
- Knob OFF position: `left: 2px`
- Knob ON position: `left: 22px`
- Transition: `transition-fast (150ms)` for both track color and knob position
- Label: `text-base (16px)`, weight `500`, `margin-left: space-3`
- Description: `text-sm`, `neutral-600`

---

## 7. Card

### 7.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `variant` | `'default' \| 'outlined' \| 'elevated' \| 'flat'` | No | `'default'` | Visual style |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | No | `'md'` | Internal padding preset |
| `children` | `ReactNode` | Yes | — | Card content |

### 7.2 Variants

| Variant | Background | Border | Shadow | Radius |
|---|---|---|---|---|
| `default` | `neutral-0` | `1px solid neutral-200` | `shadow-sm` | `radius-lg (12px)` |
| `outlined` | `neutral-0` | `2px solid neutral-300` | none | `radius-lg (12px)` |
| `elevated` | `neutral-0` | none | `shadow-md` | `radius-lg (12px)` |
| `flat` | `neutral-50` | `1px solid neutral-200` | none | `radius-lg (12px)` |

### 7.3 Padding Presets

| Preset | Mobile | Desktop |
|---|---|---|
| `none` | `0px` | `0px` |
| `sm` | `12px` | `16px` |
| `md` | `16px` | `24px` |
| `lg` | `20px` | `32px` |

---

## 8. Alert / Callout

Used for WARN_* codes, error messages, info boxes, and success confirmations.

### 8.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | Yes | — | Color/icon scheme |
| `title` | `string` | No | `undefined` | Bold title line |
| `message` | `string \| ReactNode` | Yes | — | Body content |
| `dismissible` | `boolean` | No | `false` | Show close button |
| `onDismiss` | `() => void` | No | `undefined` | Close handler |

### 8.2 Visual

Each variant uses its semantic color tokens:

| Variant | Background | Left border | Icon | Text color |
|---|---|---|---|---|
| `info` | `info-100 (#E0F2FE)` | `4px solid info-600 (#0284C7)` | `InformationCircle`, `info-600` | `info-700 (#0369A1)` |
| `success` | `success-100 (#DCFCE7)` | `4px solid success-600 (#16A34A)` | `CheckCircle`, `success-600` | `success-700 (#15803D)` |
| `warning` | `warning-100 (#FEF3C7)` | `4px solid warning-600 (#D97706)` | `ExclamationTriangle`, `warning-600` | `warning-700 (#B45309)` |
| `danger` | `danger-100 (#FEF2F2)` | `4px solid danger-600 (#DC2626)` | `ExclamationCircle`, `danger-600` | `danger-700 (#B91C1C)` |

Layout: `radius-base (6px)`, padding `space-4 (16px)`, icon `20px` top-left, `margin-right: space-3`, title weight `600 text-sm`, message weight `400 text-sm`.

---

## 9. Tooltip

### 9.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | `string` | Yes | — | Tooltip text |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | No | `'top'` | Position |
| `children` | `ReactNode` | Yes | — | Trigger element |
| `maxWidth` | `number` | No | `280` | Max width in px |

### 9.2 Visual

- Background: `neutral-900 (#1C1917)`
- Text: `neutral-0 (#FFFFFF)`, `text-xs (12px)`, weight `400`
- Padding: `6px 10px`
- Radius: `radius-sm (4px)`
- Max width: `280px` (wraps longer text)
- Arrow: `6px` CSS triangle, same background color
- Z-index: `z-tooltip (600)`
- Show on: hover (after `400ms` delay) and focus
- Dismiss on: mouseleave, blur, `Escape` key
- Animation: `opacity 0 → 1` over `150ms`

---

## 10. Progress Stepper

Used for the tax wizard navigation (Step 1 of 4 → Step 4 of 4).

### 10.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `steps` | `{id: string, label: string}[]` | Yes | — | Step definitions |
| `currentStep` | `number` | Yes | — | 0-indexed active step |
| `completedSteps` | `number[]` | Yes | — | Array of completed step indices |

### 10.2 Visual — Desktop (horizontal)

- Container: full width, `padding-bottom: space-8`
- Each step: horizontal row of circle + label
- Connector line between steps: `1px` line, `neutral-300` (incomplete), `brand-600` (complete)
- Step circle diameter: `32px`, `radius-full`
- Incomplete step: `neutral-200` background, `neutral-600` text (step number)
- Active step: `brand-600` background, `neutral-0` text (step number), `shadow-focus` ring
- Completed step: `brand-600` background, white `CheckIcon` `16px`
- Step label: `text-sm (14px)`, below circle, `neutral-700` (incomplete), `brand-700` (active), `neutral-900` (complete)

### 10.3 Visual — Mobile (compact)

On screens < `640px`, show only "Step 2 of 4 — Income Details" as a single line above the form. No circles or labels for other steps.

- `step-counter` style: `text-sm`, weight `600`, `brand-600`
- Followed by `—` then current step label: weight `500`, `neutral-900`
- Below: `brand-300` progress bar (full width), height `4px`, `radius-full`, showing `(currentStep+1)/totalSteps * 100%` filled

---

## 11. Regime Comparison Table

The core output component of the results screen.

### 11.1 Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Regime           │ Tax Due          │ Savings vs Next  │ Status          │
├─────────────────────────────────────────────────────────────────────────┤
│ 8% Flat Rate     │ ₱ 60,000         │ ₱ 32,000 cheaper │ ✓ OPTIMAL       │
│ Graduated + OSD  │ ₱ 92,000         │                  │   Option        │
│ Graduated + Item.│ ₱ 108,000        │                  │   Option        │
│ Percentage Tax   │ ₱ 15,000         │ (additional, not an alternative)   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `pathA` | `RegimeResult \| null` | Yes | Graduated + Itemized result |
| `pathB` | `RegimeResult \| null` | Yes | Graduated + OSD result |
| `pathC` | `RegimeResult \| null` | Yes | 8% flat rate result (null if ineligible) |
| `optimalPath` | `'A' \| 'B' \| 'C'` | Yes | Which path to highlight |
| `percentageTax` | `number` | Yes | Annual PT obligation (0 if on 8%) |
| `onViewDetails` | `(path: 'A' \| 'B' \| 'C') => void` | Yes | Expand row for breakdown |

### 11.3 Visual States Per Row

**Optimal row**:
- Background: `regime-optimal-bg (#F0FDF4)`
- Border-left: `4px solid success-600 (#16A34A)`
- Tax due text: JetBrains Mono, `text-2xl (24px)`, `peso-savings (#059669)`
- Status badge: "Optimal" pill — `success-100` background, `success-700` text, `CheckCircle` icon

**Non-optimal eligible rows**:
- Background: `neutral-0`
- Border-left: `4px solid neutral-200`
- Tax due text: JetBrains Mono, `text-xl (20px)`, `neutral-700`
- Status badge: none (just "Option")

**Ineligible rows** (Path C when gross > ₱3M):
- Background: `neutral-100`
- Tax due cell: shows "Not available" in `neutral-500`, italic
- Tooltip on row: explains eligibility requirement

**Percentage Tax row** (informational, always shown):
- Background: `info-100 (#E0F2FE)`
- Label: "Percentage Tax (additional obligation)"
- Tooltip icon: explains it's an additional tax on top of income tax, not an alternative

---

## 12. Summary Card

Displays input summary at top of results page so user can verify before interpreting results.

### 12.1 Visual

- Card variant: `flat`
- Two-column grid (mobile: single column)
- Left column: input parameter label (e.g., "Gross Receipts")
- Right column: formatted value (e.g., "₱ 1,200,000.00")
- Separator: `1px solid neutral-200` between rows
- Edit button (ghost, `sm`): top-right of card, icon `PencilSquare`, label "Edit Inputs"

---

## 13. Badge / Chip

### 13.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `variant` | `'default' \| 'brand' \| 'success' \| 'warning' \| 'danger' \| 'info'` | No | `'default'` | Color scheme |
| `size` | `'sm' \| 'md'` | No | `'sm'` | Size |
| `label` | `string` | Yes | — | Badge text |
| `iconLeft` | `ReactNode` | No | `undefined` | Left icon |

### 13.2 Visual

| Variant | Background | Text | Border |
|---|---|---|---|
| `default` | `neutral-100` | `neutral-700` | `1px solid neutral-200` |
| `brand` | `brand-200 (#BFDBFE)` | `brand-700 (#1E40AF)` | none |
| `success` | `success-100 (#DCFCE7)` | `success-700 (#15803D)` | none |
| `warning` | `warning-100 (#FEF3C7)` | `warning-700 (#B45309)` | none |
| `danger` | `danger-100 (#FEF2F2)` | `danger-700 (#B91C1C)` | none |
| `info` | `info-100 (#E0F2FE)` | `info-700 (#0369A1)` | none |

Size `sm`: `text-xs (12px)`, height `20px`, padding `2px 8px`, `radius-full`
Size `md`: `text-sm (14px)`, height `24px`, padding `4px 10px`, `radius-full`

---

## 14. Modal

### 14.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `open` | `boolean` | Yes | — | Visibility state |
| `onClose` | `() => void` | Yes | — | Close handler |
| `title` | `string` | Yes | — | Modal heading |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | No | `'md'` | Width preset |
| `children` | `ReactNode` | Yes | — | Body content |
| `footer` | `ReactNode` | No | `undefined` | Footer content (usually buttons) |
| `closeOnBackdrop` | `boolean` | No | `true` | Close when backdrop clicked |

### 14.2 Visual

- Backdrop: `rgba(0,0,0,0.5)`, covers full viewport, `z-overlay`
- Dialog: `neutral-0`, `shadow-lg`, `radius-lg (12px)`, `z-modal`, centered horizontally and vertically
- Header: padding `space-6`, title `text-xl (20px)` weight `700`, `XMark` close button top-right
- Body: padding `space-6`, border-top `1px solid neutral-200`, max-height `70vh`, overflow-y `auto`
- Footer: padding `space-6`, border-top `1px solid neutral-200`, flex row, `justify-content: flex-end`, gap `space-3`

| Size | Width |
|---|---|
| `sm` | `400px` |
| `md` | `560px` |
| `lg` | `720px` |
| `xl` | `880px` |

Close on `Escape` key. Focus trap inside modal while open. On open, first focusable element receives focus.

---

## 15. Toast Notification

### 15.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | Yes | — | Color/icon |
| `message` | `string` | Yes | — | Toast text |
| `duration` | `number` | No | `4000` | Auto-dismiss ms (`0` = permanent) |
| `action` | `{label: string, onClick: () => void}` | No | `undefined` | Optional action button |

### 15.2 Visual

- Position: `fixed bottom-right`, `space-4` from edges, stacks upward
- Width: `320px` (mobile: `calc(100vw - 32px)`)
- Background: `neutral-900 (#1C1917)`
- Text: `neutral-0`, `text-sm (14px)`, weight `400`
- Icon: `20px`, color based on variant (white for all on dark bg)
- Close button: `XMark` `16px` white, top-right
- Border radius: `radius-md (8px)`
- Shadow: `shadow-xl`
- Animation in: slide-up + fade-in over `300ms`
- Animation out: fade-out over `150ms`
- Z-index: `z-toast (500)`
- Max stack: 3 toasts visible simultaneously; additional toasts queue

---

## 16. Data Table

Used in the CPA dashboard client list and computation history.

### 16.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `columns` | `Column[]` | Yes | — | Column definitions |
| `rows` | `Row[]` | Yes | — | Data rows |
| `loading` | `boolean` | No | `false` | Skeleton loading state |
| `emptyMessage` | `string` | No | `'No data found'` | Empty state text |
| `onRowClick` | `(row: Row) => void` | No | `undefined` | Row click handler |
| `sortBy` | `{column: string, direction: 'asc' \| 'desc'}` | No | `undefined` | Sort state |
| `onSort` | `(column: string) => void` | No | `undefined` | Sort handler |

### 16.2 Column Definition

```typescript
interface Column {
  key: string;             // Data key
  header: string;          // Column header text
  width?: string;          // CSS width (e.g., '200px', '25%')
  align?: 'left' | 'center' | 'right';  // Default: 'left'
  sortable?: boolean;      // Default: false
  render?: (value: unknown, row: Row) => ReactNode;  // Custom renderer
}
```

### 16.3 Visual

- Table: full width, `border-collapse: separate`, `border-spacing: 0`
- Header row: background `neutral-50`, height `40px`
- Header cell: `table-header` style (12px, 600 weight, uppercase, letter-spacing 0.05em, `neutral-700`), padding `12px 16px`
- Data row height: `52px`
- Data cell: `text-sm (14px)`, `neutral-900`, padding `12px 16px`
- Row hover: background `neutral-50`, cursor `pointer` if `onRowClick` present
- Outer border: `1px solid neutral-200`, `radius-lg`
- Row separator: `1px solid neutral-200` (between rows, not between columns)
- First/last column: no extra padding
- Skeleton state: 5 rows, each cell a gray shimmer block `height: 16px`, `radius-sm`

---

## 17. Pagination

### 17.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `currentPage` | `number` | Yes | — | 1-indexed current page |
| `totalPages` | `number` | Yes | — | Total page count |
| `onPageChange` | `(page: number) => void` | Yes | — | Page change handler |
| `totalItems` | `number` | Yes | — | Total item count for "Showing X of Y" |
| `itemsPerPage` | `number` | Yes | — | Items per page |

### 17.2 Visual

- Shows: `← Previous`, page number buttons, `Next →`
- Active page: `brand-600` background, white text, `radius-md`
- Inactive page: `neutral-0` background, `neutral-700` text, `1px solid neutral-200` border
- Max visible page buttons: 7 (with ellipsis `…` for gaps)
- "Showing 21–40 of 156 clients" text, `text-sm neutral-600`, left-aligned
- Pagination controls: right-aligned
- Mobile: only `← Previous` / `Next →` with "Page 3 of 8" text

---

## 18. Navigation Bar

### 18.1 Structure

- Height: `64px`
- Background: `neutral-0`
- Border-bottom: `1px solid neutral-200`
- Shadow: `shadow-sm` when user has scrolled (adds on `scrollY > 0`)
- Z-index: `z-sticky (200)`
- Logo: left side, SVG or PNG logo (`32px` height), links to `/`
- Nav links (desktop): center — "Calculator", "Filing Calendar", "How It Works"
- Auth area (desktop): right — "Log In" (ghost button `sm`) + "Sign Up Free" (primary button `sm`)
- Auth area (logged in): right — "Computations" link + user avatar menu (`32px` circle)
- Hamburger: `Bars3` icon, shown only on mobile (< `768px`), right side

### 18.2 Mobile Menu

- Full-width drawer sliding from top (not a sidebar)
- Background: `neutral-0`
- Each link: full-width, `48px` height, `text-base`, `neutral-900`, padding `0 space-4`, border-bottom `1px solid neutral-200`
- Close: `XMark` icon in hamburger position after opening
- Auth buttons: stacked at bottom of drawer, full width

---

## 19. Accordion

Used in FAQ sections on the landing page and "How it works" breakdowns.

### 19.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `items` | `{question: string, answer: string \| ReactNode}[]` | Yes | — | Accordion items |
| `allowMultiple` | `boolean` | No | `false` | Allow multiple open at once |

### 19.2 Visual

- Item border: `1px solid neutral-200`
- First item: `border-top` rounded `radius-md`
- Last item: `border-bottom` rounded `radius-md`
- Between items: no gap (shared border)
- Question row: height `56px` min, padding `16px 20px`, `text-base (16px)` weight `600`, `neutral-900`
- `ChevronDown` icon `20px neutral-500` right-side; rotates `180deg` when open
- Answer: `text-sm (14px)` weight `400`, `neutral-700`, padding `0 20px 16px 20px`
- Open animation: height `0 → auto` using CSS max-height transition `300ms ease-out`

---

## 20. Empty State

### 20.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `icon` | `ReactNode` | No | `ClipboardDocumentList` | Large icon |
| `title` | `string` | Yes | — | Primary message |
| `description` | `string` | No | `undefined` | Secondary message |
| `action` | `{label: string, onClick: () => void, variant?: ButtonVariant}` | No | `undefined` | CTA button |

### 20.2 Visual

- Container: centered vertically and horizontally, `padding: space-16 (64px) 0`
- Icon: `icon-xl (48px)`, color `neutral-400`
- Title: `text-xl (20px)`, weight `600`, `neutral-700`, `margin-top: space-4`
- Description: `text-base (16px)`, weight `400`, `neutral-500`, `margin-top: space-2`, max-width `360px`
- Action button: `margin-top: space-6`, default variant `primary` size `md`

---

## 21. Number Input with Auto-Computation Badge

Used in the wizard for fields that auto-trigger regime comparison (e.g., gross receipts field shows real-time regime recommendation as the user types).

### 21.1 Props

Extends Input component props plus:

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `liveResult` | `{label: string, value: string, variant: 'success' \| 'info' \| 'warning'}` | No | `undefined` | Real-time result shown below input |
| `debounceMs` | `number` | No | `500` | Debounce delay for live computation |

### 21.2 Visual

When `liveResult` is provided, a small result badge appears below the input (above the hint text):
- Background: variant-specific `*-100` color
- Text: `text-xs (12px)`, `*-700` color
- Icon: `calculator` icon `12px` same color
- Animation: fade-in over `200ms`
- Content example: `"₱ 60,000 tax due under 8% flat rate"`

---

## 22. File Upload (for BIR Form 2307 CSV)

### 22.1 Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `label` | `string` | Yes | — | Label |
| `accept` | `string` | No | `'.csv,.xlsx'` | Accepted file types |
| `onFile` | `(file: File) => void` | Yes | — | File selected handler |
| `hint` | `string` | No | `undefined` | Help text |
| `error` | `string` | No | `undefined` | Error message |
| `status` | `'idle' \| 'uploading' \| 'success' \| 'error'` | No | `'idle'` | Upload state |
| `maxSizeMb` | `number` | No | `5` | Max file size in MB |

### 22.2 Visual

- Drop zone: `neutral-50` background, `2px dashed neutral-300` border, `radius-lg (12px)`, min-height `120px`
- Center content: `ArrowUpTray` icon `32px neutral-400`, below it "Drop CSV or click to browse", `text-sm neutral-600`
- Hover/drag-over: border `brand-600`, background `brand-50`
- Uploading: progress bar inside zone, `brand-300` fill, "Parsing your 2307 data…"
- Success: `CheckCircle` `32px success-600`, filename displayed, "Remove" ghost button sm
- Error: zone border `danger-600`, error message below

---

## Cross-References

- Token values sourced from: [design-system.md](design-system.md)
- Component usage in screens: [../frontend/wizard-steps.md](../frontend/wizard-steps.md), [../frontend/results-views.md](../frontend/results-views.md)
- Copy (labels, placeholders, error messages): [../frontend/copy.md](../frontend/copy.md)
- Responsive behavior per component: [responsive.md](responsive.md)
- Accessibility requirements per component: [accessibility.md](accessibility.md)
