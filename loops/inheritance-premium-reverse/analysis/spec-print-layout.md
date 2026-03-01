# Feature Spec: Print-Optimized Layout

**Aspect:** spec-print-layout
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** legal-doc-formatting, codebase-audit
**Depends on:** none (purely frontend CSS + minimal JS)

---

## 1. Overview

The print layout feature enables a PH estate lawyer to produce a clean, professional A4 printout of the inheritance distribution results directly from the browser (`Ctrl+P` / `⌘+P`) — or via a **Print** button in `ActionsBar`. This is achieved entirely through `@media print` CSS rules with a thin JavaScript assist for accordion state management.

**Why a PH estate lawyer needs this:**
- Not every client meeting has a laptop — a printed handout of the distribution is the fastest deliverable
- Some law firms have restricted IT environments where installing a PDF generator is not allowed; browser-print-to-PDF is universally available
- The printed output must look like a formal legal document, not a browser screenshot with colored nav buttons
- When the lawyer prints from Chrome/Edge, the browser's built-in "Save as PDF" produces a PDF that can be emailed immediately
- Zero dependency: no new npm packages, no Supabase, no auth — just CSS

**Print vs. PDF Export (spec-pdf-export):**
| Dimension | Print Layout | PDF Export |
|---|---|---|
| Output mechanism | Browser `window.print()` | `@react-pdf/renderer` download |
| Font control | Browser default + CSS override | Fully controlled |
| Page breaks | CSS `page-break-*` (browser-dependent) | Exact, reliable |
| Firm header | CSS-rendered (DOM elements) | React-PDF components |
| Offline | Yes | Yes (client-side) |
| Ideal use case | Quick client handout | Filed legal document |

Both features are needed. The print layout is the **zero-friction quick path**; PDF export is the **archival-grade path**.

---

## 2. Data Model

No database tables or Supabase integration required. This feature is entirely:
- **CSS**: `@media print` rules in a dedicated `src/styles/print.css` (imported in `main.tsx`)
- **JS**: A `usePrintExpand` custom hook that expands accordions before printing and restores state after

No new `EngineInput` / `EngineOutput` fields are needed. The data already rendered in `ResultsView` is the print content.

---

## 3. UI Design

### 3.1 Print Button Addition (ActionsBar)

A **Print** button is added to `ActionsBar` next to the existing actions. On click, it:
1. Calls `expandAllForPrint()` — programmatically opens all closed accordions
2. Calls `window.print()`
3. On `afterprint` event — restores accordion state

```
┌─────────────────────────────────────────────────────────────┐
│  [✏ Edit Input]  [↓ Export JSON]  [◻ Copy Narratives]       │
│  [🖨 Print]      [↓ Export PDF]  [🔗 Share Link]            │
└─────────────────────────────────────────────────────────────┘
```

The Print button appears before Export PDF (simpler action first).

### 3.2 Printed Page Layout (A4)

```
┌─────────────────── A4 Page (210mm × 297mm) ───────────────────┐
│  Left: 38mm │ Top: 30mm │ Right: 25mm │ Bottom: 25mm           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [FIRM LOGO if set]   SANTOS & REYES LAW OFFICES        │  │
│  │                       Attorneys and Counselors at Law    │  │
│  │                       4F Salcedo Tower, Makati City      │  │
│  │  ─────────────────────────────────────────────────────  │  │
│  │  INHERITANCE DISTRIBUTION ANALYSIS REPORT               │  │
│  │  Estate of: JUAN DELA CRUZ  |  Date of Death: 2025-11-15│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Scenario badge]  Intestate Succession  |  Total: ₱2,500,000  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  II. DISTRIBUTION TABLE                                          │
│  ┌──────────────┬──────────────┬─────────────┬───────────────┐ │
│  │ Heir         │ Category     │  Net Share  │ Legal Basis   │ │
│  ├──────────────┼──────────────┼─────────────┼───────────────┤ │
│  │ Maria C.     │ Leg. Child   │ ₱1,250,000  │ Art. 887, NCC │ │
│  │ Pedro C.     │ Leg. Child   │ ₱1,250,000  │ Art. 887, NCC │ │
│  └──────────────┴──────────────┴─────────────┴───────────────┘ │
│                                                                  │
│  III. PER-HEIR NARRATIVES                                        │
│  [Accordion expanded — full narrative text for each heir]        │
│                                                                  │
│  IV. COMPUTATION LOG                                             │
│  [Accordion expanded — all pipeline steps listed]                │
│                                                                  │
│  V. WARNINGS                                                     │
│  [Warning alert cards if any]                                    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  This is a computation aid only and does not constitute legal    │
│  advice. Prepared by: Atty. Santos | IBP Roll No. 123456        │
│  Generated: March 1, 2026 at 2:30 PM (PHT)                     │
│                                                                  │
│                    Page 1 of 3                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Hidden Elements in Print

| Element | CSS Rule | Reason |
|---|---|---|
| `ActionsBar` (`[data-testid="actions-bar"]`) | `display: none` | Buttons not meaningful on paper |
| Recharts `PieChart` SVG | `display: none` | Vector charts print poorly on many browsers; distribution table is sufficient |
| Wizard navigation (if visible) | `display: none` | Not in results view but safe to target |
| Browser scrollbars | `overflow: hidden` | Automatic in print mode |
| Tooltips / hover states | `display: none` | N/A in print |
| shadcn Accordion trigger chevron icon | `display: none` | Chevron is irrelevant when all content is expanded |

### 3.4 Forced Elements in Print

| Element | Behavior |
|---|---|
| NarrativePanel accordion (`[data-testid="narrative-panel"]`) | All `AccordionContent` forced visible |
| ComputationLog accordion (`[data-testid="computation-log"]`) | `AccordionContent` forced visible |
| DistributionSection | Full table, no truncation |
| WarningsPanel | Always show if present |
| `ResultsHeader` | Add decedent name + DOD (see § 3.5) |

### 3.5 Print-Only Header Block

A `div.print-header` is added to `ResultsView` — hidden in screen view (`hidden print:block`). In print, it renders:

```
INHERITANCE DISTRIBUTION ANALYSIS REPORT
Estate of: JUAN SANTOS DELA CRUZ
Date of Death: November 15, 2025

[If firmProfile present:]
Santos & Reyes Law Offices
Attorneys and Counselors at Law
4F Salcedo Tower, Legaspi Village, Makati City, Philippines 1229
Tel: +63-2-8888-9999 | info@santosreyes.law
Prepared by: Atty. Maria G. Santos | IBP Roll No. 123456
Generated: March 1, 2026 at 2:30 PM (PHT)
────────────────────────────────────────────────────
```

This block uses `data-print-only` and is `display: none` on screen, `display: block` in `@media print`.

---

## 4. Implementation

### 4.1 File Structure

```
src/
├── styles/
│   └── print.css          ← NEW: @media print rules
├── hooks/
│   └── usePrintExpand.ts  ← NEW: accordion expand/restore hook
├── components/results/
│   ├── ResultsView.tsx     ← MODIFIED: add print-header div, print button
│   ├── ActionsBar.tsx      ← MODIFIED: add Print button
│   └── PrintHeader.tsx     ← NEW: screen-hidden, print-visible header block
└── main.tsx               ← MODIFIED: import print.css
```

### 4.2 CSS — `src/styles/print.css`

```css
@media print {
  /* ── Page Setup ─────────────────────────────────────────── */
  @page {
    size: A4;
    margin: 30mm 25mm 25mm 38mm;
  }

  @page :first {
    margin-top: 20mm; /* tighter top margin on first page (firm header takes space) */
  }

  /* Page X of Y in footer */
  @page {
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 9pt;
      font-family: 'Times New Roman', Times, serif;
      color: #555;
    }
  }

  /* ── Global Overrides ───────────────────────────────────── */
  html, body {
    font-family: 'Times New Roman', Times, serif !important;
    font-size: 12pt !important;
    color: #000 !important;
    background: #fff !important;
  }

  /* Remove max-width constraint — use full A4 printable width */
  .max-w-3xl,
  .max-w-2xl,
  .max-w-4xl {
    max-width: none !important;
    width: 100% !important;
  }

  /* Remove padding on outer container */
  main, #root > div {
    padding: 0 !important;
  }

  /* ── Hidden Elements ─────────────────────────────────────── */
  [data-testid="actions-bar"],
  [data-print-hide],
  .recharts-wrapper,           /* Recharts pie chart */
  .recharts-responsive-container {
    display: none !important;
  }

  /* Accordion trigger chevron icon (Radix AccordionTrigger svg) */
  [data-radix-collection-item] svg.lucide-chevron-down,
  [data-radix-collection-item] svg.lucide-chevron-up {
    display: none !important;
  }

  /* ── Force Accordions Open ──────────────────────────────── */
  /*
   * Radix Accordion content: when data-state="closed", content is
   * hidden via inline style height:0 and overflow:hidden.
   * We override both to force print visibility.
   */
  [data-radix-accordion-content] {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
    animation: none !important;
  }

  /* AccordionItem borders */
  [data-radix-accordion-item] {
    border-bottom: 1px solid #e0e0e0 !important;
    page-break-inside: avoid;
  }

  /* ── Print-Only Elements ─────────────────────────────────── */
  [data-print-only] {
    display: block !important;
  }

  /* ── Typography ─────────────────────────────────────────── */
  h1, h2, h3 {
    font-family: 'Times New Roman', Times, serif !important;
    color: #000 !important;
  }

  /* Section headings printed in document-style */
  h2 {
    font-size: 13pt !important;
    font-weight: bold !important;
    text-transform: uppercase;
    border-bottom: 1px solid #000;
    padding-bottom: 2pt;
    margin-top: 12pt !important;
    margin-bottom: 6pt !important;
  }

  /* ── Distribution Table ─────────────────────────────────── */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 11pt !important;
  }

  th, td {
    border: 1px solid #999 !important;
    padding: 4pt 6pt !important;
    text-align: left !important;
  }

  th {
    background-color: #f0f0f0 !important;
    font-weight: bold !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Avoid row break in the middle of a row */
  tr {
    page-break-inside: avoid;
  }

  /* ── Badges / Colored Elements ──────────────────────────── */
  /* Convert colored badges to plain text in print */
  [data-testid="scenario-badge"],
  .badge {
    border: 1px solid #999 !important;
    background: none !important;
    color: #000 !important;
    padding: 1pt 4pt !important;
    font-size: 10pt !important;
    font-family: 'Courier New', monospace !important;
  }

  /* CategoryBadge pills — plain text in print */
  .category-badge {
    border: 1px solid #ccc !important;
    background: none !important;
    color: #000 !important;
  }

  /* ── Alert Boxes ────────────────────────────────────────── */
  [role="alert"] {
    border: 1px solid #999 !important;
    background: none !important;
    color: #000 !important;
    padding: 6pt !important;
    margin-bottom: 6pt !important;
  }

  /* ── Page Breaks ────────────────────────────────────────── */
  [data-testid="results-header"] {
    page-break-after: avoid;
  }

  [data-testid="distribution-section"] {
    page-break-inside: avoid;
  }

  [data-testid="narrative-panel"] {
    page-break-before: auto;
  }

  /* Each narrative accordion item avoids internal page break */
  [data-testid^="narrative-item-"] {
    page-break-inside: avoid;
  }

  [data-testid="warnings-panel"] {
    page-break-before: auto;
    page-break-inside: avoid;
  }

  [data-testid="computation-log"] {
    page-break-before: auto;
  }

  /* ── Print Header Block ─────────────────────────────────── */
  [data-print-only="print-header"] {
    font-family: 'Times New Roman', Times, serif !important;
    font-size: 12pt !important;
    margin-bottom: 16pt !important;
    border-bottom: 2px solid #000;
    padding-bottom: 10pt;
  }

  [data-print-only="print-header"] .report-title {
    font-size: 14pt !important;
    font-weight: bold !important;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin-bottom: 4pt;
  }

  [data-print-only="print-header"] .estate-of {
    text-align: center;
    font-size: 13pt !important;
    font-weight: bold !important;
    margin-bottom: 2pt;
  }

  [data-print-only="print-header"] .firm-info {
    margin-top: 8pt;
    font-size: 10pt !important;
    color: #333 !important;
  }

  /* ── Spacing ─────────────────────────────────────────── */
  .space-y-8 > * + * {
    margin-top: 16pt !important;
  }

  .space-y-4 > * + * {
    margin-top: 8pt !important;
  }
}
```

### 4.3 Hook — `src/hooks/usePrintExpand.ts`

The `@media print` CSS override for Radix Accordion uses `!important` to force `height: auto` on closed accordion content. However, Radix applies inline styles that CSS `!important` may not fully override in all browsers. The `usePrintExpand` hook guarantees correctness across browsers:

```typescript
/**
 * usePrintExpand
 *
 * Expands all Radix Accordion items before printing and restores
 * their original state after the print dialog closes.
 *
 * Works by temporarily adding data-state="open" to all closed
 * AccordionContent elements and removing the inline height style.
 */
export function usePrintExpand() {
  const handlePrint = () => {
    // Collect all closed accordion content elements
    const closedContent = document.querySelectorAll<HTMLElement>(
      '[data-radix-accordion-content][data-state="closed"]'
    );

    // Save original inline styles for restoration
    const savedStyles: { el: HTMLElement; style: string }[] = [];
    closedContent.forEach((el) => {
      savedStyles.push({ el, style: el.getAttribute('style') ?? '' });
      // Force open: override inline height:0 and display:none
      el.style.cssText = 'height: auto !important; overflow: visible !important;';
      el.setAttribute('data-state', 'open');
    });

    const afterPrint = () => {
      // Restore original state
      savedStyles.forEach(({ el, style }) => {
        el.style.cssText = style;
        el.setAttribute('data-state', 'closed');
      });
      window.removeEventListener('afterprint', afterPrint);
    };

    window.addEventListener('afterprint', afterPrint);
    window.print();
  };

  return { handlePrint };
}
```

### 4.4 Component — `src/components/results/PrintHeader.tsx`

```typescript
/**
 * PrintHeader — screen-hidden, print-visible document header block.
 * Rendered inside ResultsView, only appears in @media print.
 */
import type { EngineInput } from '../../types';
import type { FirmProfile } from '../firm/types';
import { formatPHDate } from '../../utils/date';

interface PrintHeaderProps {
  input: EngineInput;
  firmProfile?: FirmProfile | null;
  generatedAt: string; // ISO 8601
}

export function PrintHeader({ input, firmProfile, generatedAt }: PrintHeaderProps) {
  const decedentName = input.decedent.name ?? 'Unknown Decedent';
  const dod = input.decedent.date_of_death
    ? formatPHDate(input.decedent.date_of_death)  // e.g., "November 15, 2025"
    : 'Unknown';

  return (
    <div
      data-print-only="print-header"
      className="hidden print:block"
    >
      {firmProfile && (
        <div className="firm-info text-right mb-2">
          <div className="font-bold">{firmProfile.firm_name}</div>
          <div>Attorneys and Counselors at Law</div>
          <div>{firmProfile.firm_address}</div>
          {firmProfile.firm_phone && <div>Tel: {firmProfile.firm_phone}</div>}
          {firmProfile.firm_email && <div>{firmProfile.firm_email}</div>}
        </div>
      )}

      <div className="report-title">
        Inheritance Distribution Analysis Report
      </div>

      <div className="estate-of">
        Estate of: {decedentName.toUpperCase()}
      </div>

      <div className="text-center text-sm">
        Date of Death: {dod}
      </div>

      {firmProfile && (
        <div className="firm-info mt-3 text-xs text-gray-600">
          <span>Prepared by: {firmProfile.counsel_name}</span>
          {firmProfile.ibp_roll_no && (
            <span> | IBP Roll No. {firmProfile.ibp_roll_no}</span>
          )}
          {firmProfile.ptr_no && (
            <span> | PTR No. {firmProfile.ptr_no}</span>
          )}
          {firmProfile.mcle_compliance_no && (
            <span> | MCLE No. {firmProfile.mcle_compliance_no}</span>
          )}
          <div className="mt-1">Generated: {generatedAt}</div>
        </div>
      )}

      {!firmProfile && (
        <div className="firm-info mt-2 text-xs text-gray-500">
          Generated: {generatedAt}
        </div>
      )}
    </div>
  );
}
```

### 4.5 ResultsView Modifications

```diff
// ResultsView.tsx
+ import { PrintHeader } from './PrintHeader';
+ import { useFirmProfile } from '../../hooks/useFirmProfile'; // from spec-firm-branding

  export function ResultsView({ input, output, onEditInput }: ResultsViewProps) {
+   const { firmProfile } = useFirmProfile(); // reads from localStorage or Supabase
+   const generatedAt = new Date().toLocaleString('en-PH', {
+     timeZone: 'Asia/Manila',
+     dateStyle: 'long',
+     timeStyle: 'short',
+   });

    return (
      <div data-testid="results-view" className="space-y-8">
+       <PrintHeader
+         input={input}
+         firmProfile={firmProfile}
+         generatedAt={`${generatedAt} (PHT)`}
+       />

        <ResultsHeader ... />
        ...
      </div>
    );
  }
```

### 4.6 ActionsBar Modification

```diff
// ActionsBar.tsx
+ import { Printer } from 'lucide-react';
+ import { usePrintExpand } from '../../hooks/usePrintExpand';

  export function ActionsBar({ input, output, onEditInput }: ActionsBarProps) {
+   const { handlePrint } = usePrintExpand();

    return (
      <div data-testid="actions-bar">
        <Separator className="mb-4" />
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" onClick={onEditInput}>
            <Pencil className="size-4" /> Edit Input
          </Button>
+         <Button variant="outline" onClick={handlePrint}>
+           <Printer className="size-4" /> Print
+         </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" /> Export JSON
          </Button>
          <Button variant="outline" onClick={handleCopyNarratives}>
            <Copy className="size-4" /> Copy Narratives
          </Button>
        </div>
      </div>
    );
  }
```

### 4.7 main.tsx Import

```diff
// main.tsx
  import './index.css';
+ import './styles/print.css';
```

---

## 5. Integration Points

| Feature | Integration |
|---|---|
| **spec-firm-branding** | `PrintHeader` reads `FirmProfile` (counsel name, IBP roll, PTR, MCLE). When `firmProfile` is null, header shows only the report title and generation date |
| **spec-pdf-export** | Print layout is the quick path; PDF export is the formal path. Both share the same section structure but PDF uses `@react-pdf/renderer` for pixel-perfect output. `PrintHeader` component and `PDFHeader` component share the same data interface |
| **spec-decedent-header** | `decedent.name` and `date_of_death` from `EngineInput` are rendered in `PrintHeader`. These are the same fields that `spec-decedent-header` adds to `ResultsHeader` for screen view |
| **spec-statute-citations-ui** | Expanded article citations in distribution table are automatically included in print (table is fully visible) |
| **spec-share-breakdown-panel** | If implemented, the per-heir breakdown rows are included in the printed table |
| **spec-case-notes** | Case notes are not included in the print layout by default. A `data-print-hide` attribute can be added to the notes section to explicitly exclude, or a print-include checkbox can be added |

---

## 6. Edge Cases

### 6.1 Accordion State in Different Browsers

| Browser | Radix inline style override behavior |
|---|---|
| Chrome 120+ | `!important` on `height` overrides inline style; CSS approach works |
| Firefox 121+ | `!important` does NOT override inline styles; JS hook required |
| Safari 17+ | Mixed behavior; JS hook required for reliability |
| Edge (Chromium) | Same as Chrome |

**Decision:** Always use the JS hook (`usePrintExpand`) as the primary mechanism. CSS `!important` rules in `print.css` are a fallback layer for Chrome-only scenarios. Never rely solely on CSS.

### 6.2 Recharts PieChart in Print

The Recharts `PieChart` renders as SVG. Print browsers often render SVGs with incorrect dimensions (page overflow, cut off). **The pie chart is hidden in print** (`display: none !important` on `.recharts-wrapper`). The distribution table alone is sufficient for a printed report — it contains all the numbers.

A "Chart excluded from print — see distribution table above" notice can be added adjacent to the chart with `data-print-only` styling.

### 6.3 Very Long Heir Lists

If there are many heirs, the distribution table may span multiple pages. Rules:
- `tr { page-break-inside: avoid }` prevents a row from splitting across pages
- The table header (`<thead>`) uses `display: table-header-group` which repeats on each page in most browsers
- Maximum practical heir count before pagination: ~25 rows per page at 11pt

### 6.4 Preterition / Escheat Special Cases

- **IntestateByPreterition**: The red Alert banner renders in print — border overrides make it visible as a plain bordered box
- **Escheat (I15)**: Only the Alert renders (no table); this prints correctly as a single-page notice

### 6.5 No Firm Profile Set

When the lawyer hasn't configured a firm profile, the `PrintHeader` renders:
```
INHERITANCE DISTRIBUTION ANALYSIS REPORT
Estate of: JUAN SANTOS DELA CRUZ
Date of Death: November 15, 2025
Generated: March 1, 2026 at 2:30 PM (PHT)
────────────────────────────────────────
```
No firm name, no attorney credentials. The report is still usable but prompts the lawyer to configure branding.

### 6.6 Mobile Print

On mobile (iOS Safari, Android Chrome):
- `window.print()` opens the native share sheet / print dialog
- The `@page` rules may be ignored on mobile; full-width layout is used instead
- The `usePrintExpand` hook still works correctly
- **Recommendation:** Print is primarily a desktop feature. Mobile users should use Export PDF instead. Add tooltip: "For best results, print from a desktop browser."

### 6.7 Computation Log — Long Step Lists

The 10-step pipeline log expands to approximately 1 full page. The `page-break-before: auto` rule allows a page break before the computation log, so it starts fresh on a new page when it would otherwise overflow.

### 6.8 `@page` Margin Box Browser Support

The `@bottom-center { content: counter(page) }` syntax is supported in:
- Chrome 100+: YES
- Firefox: NO (Firefox does not support `@page` margin boxes)
- Safari 16+: YES

For Firefox, the fallback is the browser's built-in "Page X of Y" footer in the print dialog (which most lawyers will have enabled). No custom fix needed — document this as a known Firefox limitation.

---

## 7. Dependencies

| Dependency | Status | Notes |
|---|---|---|
| Tailwind CSS v4 | Already installed | `print:` variant prefix works out of the box |
| Radix UI Accordion | Already installed | Need JS hook for print expansion |
| `spec-firm-branding` | Optional (soft) | `FirmProfile` data enriches the print header, but is not required |
| No new npm packages | — | Zero new dependencies |

This feature can be built **before or independently** of all other Wave 2 features. It does not depend on auth, Supabase, or any other spec.

---

## 8. Acceptance Criteria

### Functional
- [ ] **Print button** appears in `ActionsBar` between "Edit Input" and "Export JSON"
- [ ] Clicking Print expands all Accordion sections, opens browser print dialog, then restores state
- [ ] `Ctrl+P` from results page (without clicking Print button) also produces a clean output via CSS alone (accordions may not be expanded — note this caveat in UI, or add `onbeforeprint` event listener in `main.tsx`)
- [ ] All three Accordion-based sections print expanded: NarrativePanel, ComputationLog, and any per-heir breakdown panels
- [ ] Recharts PieChart is hidden from print output
- [ ] `ActionsBar` buttons are hidden from print output

### Layout
- [ ] Page uses A4 dimensions (visible in Chrome "Save as PDF" — page is labeled "A4")
- [ ] Left margin is visibly wider than right margin (38mm vs 25mm) — classic legal document look
- [ ] Font changes to Times New Roman in print (visible in print preview)
- [ ] `PrintHeader` block appears at top of first printed page with: report title, decedent name, date of death, and firm details if configured
- [ ] `PrintHeader` is **not visible** on the screen view (hidden by Tailwind `hidden` class)

### Content
- [ ] Distribution table renders all heir rows with Name, Category, Net Share, and Legal Basis columns
- [ ] All per-heir narratives are visible and expanded in print
- [ ] All computation log steps are visible and expanded in print
- [ ] Warnings (ManualFlags) are printed if any exist
- [ ] Monetary values display as `₱X,XXX,XXX.XX` (no currency conversion or truncation)

### Page Numbers
- [ ] Chrome/Safari: "Page X of Y" appears in footer of each printed page via `@page` margin box
- [ ] Firefox: browser's native page number footer is acceptable

### Firm Profile (if spec-firm-branding is built)
- [ ] When firm profile is configured: firm name, address, counsel name, IBP roll no., PTR no., MCLE compliance no. appear in the print header
- [ ] When no firm profile: only report title, decedent name, and generation timestamp appear

### No Regression
- [ ] Screen display of `ResultsView` is unaffected by the print CSS (hidden elements remain visible, accordions remain interactive)
- [ ] Existing Export JSON and Copy Narratives actions continue to work
- [ ] Accordion expand/restore cycle leaves app state identical to before print was triggered

---

## 9. Implementation Notes

### Tailwind v4 Print Variant

Tailwind v4 supports `@media print` via the `print:` prefix. The `PrintHeader` component uses:
```tsx
<div className="hidden print:block">
```
This compiles to:
```css
.hidden { display: none }
@media print { .print\:block { display: block } }
```
No special configuration needed for Tailwind v4.

### `onbeforeprint` Global Listener

For the `Ctrl+P` case (user presses print directly, bypassing the Print button), add a global listener in `main.tsx`:
```typescript
window.addEventListener('beforeprint', () => {
  document.querySelectorAll<HTMLElement>(
    '[data-radix-accordion-content][data-state="closed"]'
  ).forEach((el) => {
    el.style.cssText = 'height: auto !important; overflow: visible !important;';
    el.setAttribute('data-state', 'open');
    el.setAttribute('data-was-closed', 'true'); // mark for restoration
  });
});

window.addEventListener('afterprint', () => {
  document.querySelectorAll<HTMLElement>('[data-was-closed="true"]').forEach((el) => {
    el.removeAttribute('style');
    el.setAttribute('data-state', 'closed');
    el.removeAttribute('data-was-closed');
  });
});
```
This covers the `Ctrl+P` case without requiring the Print button to be clicked first.

### Print CSS File Location

`src/styles/print.css` is imported in `main.tsx` globally. It applies only within `@media print` blocks, so there is zero risk of it affecting the screen layout.

### Testing Print Output

Manual test in Chrome:
1. Navigate to results view after computation
2. Open Chrome DevTools → Rendering → Emulate CSS media: `print`
3. Verify hidden elements disappear, accordions appear expanded, font changes to serif
4. Or: Click Print → "Save as PDF" → inspect the resulting PDF

Automated test: Use `vitest` + `@testing-library/react` to verify:
- `PrintHeader` renders with `data-print-only` attribute
- `ActionsBar` renders `[data-testid="print-button"]`
- `usePrintExpand` hook calls `window.print()` and registers `afterprint` listener
