# PDF Export Patterns — Research Analysis

**Date:** 2026-02-28
**Aspect:** pdf-export-patterns
**Researched:** @react-pdf/renderer vs jsPDF vs pdfmake, react-pdf advanced features, PH legal document conventions

---

## 1. Library Comparison

### Candidates

| Library | Weekly DL | Stars | Paradigm | Complex Layouts | React-Native |
|---|---|---|---|---|---|
| **@react-pdf/renderer** | ~860K | 15,900 | JSX components | Excellent | Yes |
| **jsPDF** | ~2.6M | 30,400 | Imperative JS API | Hard | No |
| **pdfmake** | ~940K | 12,000 | Declarative JSON | Excellent | No |
| **pdfme** | — | — | Template + WYSIWYG | Good | No |

### @react-pdf/renderer (RECOMMENDED)

**Why it wins for this project:**
1. **React-native**: The frontend is already React 19. PDF components are regular React components — same mental model, same tooling.
2. **Complex layouts**: Full control over multi-column tables, nested sections, conditional rendering, all via JSX.
3. **Active maintenance**: v4.3.2 as of 2026-02, 860K weekly downloads, 15,900 stars.
4. **Dynamic data**: Template-driven from EngineOutput types — no manual DOM manipulation.
5. **Fixed headers/footers**: Built-in `fixed` prop renders an element on every page automatically.
6. **Page numbers**: Built-in `render={({ pageNumber, totalPages }) => ...}` API.
7. **Orphan/widow protection**: Built-in, configurable per component.

**Limitation**: React-only (not usable outside React apps — irrelevant here).

### jsPDF — Rejected

Imperative API makes complex multi-column tables painful. No JSX. Suited for simple one-page receipts, not multi-section legal reports.

```javascript
// jsPDF: manually position every element — fragile for variable-length content
doc.text('Heir Name', 10, 20);
doc.text('Net Share', 150, 20);
// ... must track y-position manually across page breaks — nightmare
```

### pdfmake — Rejected

JSON-driven, works well for structured data. However:
- Webpack font embedding issues in Vite
- JSON schema is less ergonomic than JSX for conditional layouts
- The 7 DistributionSection layout variants would require deeply nested JSON conditionals

### pdfme — Future consideration

Has a WYSIWYG designer that non-technical users (lawyers) could use to customize templates. Not recommended for v1 due to added complexity. Can layer on top of @react-pdf/renderer later for template customization.

---

## 2. Installation

```bash
npm install @react-pdf/renderer
# Current version: 4.3.2
```

**No additional Vite config needed** — @react-pdf/renderer v3+ works in browser without Node.js polyfills. It uses a browser-native PDF rendering pipeline.

**WASM note:** The project already uses `vite-plugin-wasm` for the inheritance engine. @react-pdf/renderer does NOT require WASM — no conflicts.

---

## 3. Font Registration

The browser app uses Inter Variable and Lora Variable (from `@fontsource-variable`). `@react-pdf/renderer` has its own renderer separate from the browser DOM — **it does NOT use browser fonts**. Fonts must be explicitly registered.

### For PH legal documents: Times New Roman

Philippine courts use Times New Roman 12pt by default. The PDF should use:
- **Times New Roman** (serif) for body text — standard court document font
- **Helvetica** (available as react-pdf built-in) for headers, labels, and UI chrome

```typescript
import { Font } from '@react-pdf/renderer';

// Register fonts from CDN or bundled assets
// Option A: Use react-pdf built-in fonts (no registration needed)
// Built-in: Helvetica, Helvetica-Bold, Times-Roman, Times-Bold, Courier

// Option B: Register custom fonts from URL (for firm branding use cases)
Font.register({
  family: 'TimesNewRoman',
  fonts: [
    { src: '/fonts/times-new-roman.ttf' },
    { src: '/fonts/times-new-roman-bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/times-new-roman-italic.ttf', fontStyle: 'italic' },
  ],
});

// For v1, use react-pdf built-in 'Times-Roman' — zero bundle size
// family: 'Times-Roman' is always available
```

**Recommendation for v1:** Use react-pdf built-in `Times-Roman` and `Helvetica` families. No registration needed. Add custom font support in v2 for firm branding.

---

## 4. Page Layout for Philippine Legal Reports

### A4 Page Dimensions

Philippine courts and BIR use **A4** paper (210mm × 297mm = 595.28pt × 841.89pt).

**Margins:** 1 inch (72pt) on all sides is the Philippine legal document standard.

```typescript
const styles = StyleSheet.create({
  page: {
    size: 'A4',
    paddingTop: 72,      // 1 inch
    paddingBottom: 72,   // 1 inch
    paddingLeft: 72,     // 1 inch
    paddingRight: 72,    // 1 inch
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
});
```

### Fixed Header (every page)

```tsx
const PageHeader = ({ firmProfile, decedentName, dod }: HeaderProps) => (
  <View fixed style={styles.header}>
    {/* Firm name top-left, case name top-right */}
    <View style={styles.headerRow}>
      <Text style={styles.firmName}>{firmProfile?.name ?? 'INHERITANCE REPORT'}</Text>
      <Text style={styles.caseRef}>Estate of {decedentName}</Text>
    </View>
    <View style={styles.headerDivider} />
  </View>
);
```

### Fixed Footer (every page)

```tsx
const PageFooter = ({ generatedAt }: FooterProps) => (
  <View fixed style={styles.footer}>
    <View style={styles.footerDivider} />
    <View style={styles.footerRow}>
      <Text style={styles.footerNote}>
        Generated {generatedAt} • For legal purposes only • Verify all computations
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  </View>
);
```

---

## 5. Document Structure for Inheritance Report

```
┌─────────────────────────────────────────────────────┐
│  FIXED HEADER (every page)                          │
│  [Firm Name]                    [Estate of: Name]   │
│  ─────────────────────────────────────────────────  │
├─────────────────────────────────────────────────────┤
│  PAGE 1:                                            │
│  SECTION 1: FIRM HEADER (first page only)           │
│    [Logo]  Firm Name                                │
│            Address | Phone | Email                  │
│            Prepared by: [counsel_name]              │
│            Date: [generation date]                  │
│  ─────────────────────────────────────────────────  │
│  SECTION 2: CASE SUMMARY                            │
│    Decedent: Juan dela Cruz                         │
│    Date of Death: January 15, 2025                 │
│    Net Distributable Estate: ₱12,500,000.00         │
│    Succession Type: Testate                         │
│    Scenario: T3 — Spouse + Legitimate Children      │
│  ─────────────────────────────────────────────────  │
│  SECTION 3: DISTRIBUTION SUMMARY TABLE             │
│    Heir | Category | Legal Basis | Net Share        │
│    ─────────────────────────────────────────────── │
│    Maria  Spouse    Art.887,896   ₱3,125,000.00    │
│    Pedro  Legit.    Art.887,889   ₱3,125,000.00    │
│    Ana    Legit.    Art.887,889   ₱3,125,000.00    │
│    ...                                              │
│  ─────────────────────────────────────────────────  │
├─────────────────────────────────────────────────────┤
│  PAGE 2+ (if needed):                               │
│  SECTION 4: PER-HEIR NARRATIVES                     │
│    [Maria Santos — Surviving Spouse]                │
│    Maria Santos is entitled to ... (full narrative) │
│    Legal Basis: Art. 887, Art. 896 NCC              │
│    Share Breakdown:                                 │
│      Legitime:      ₱3,125,000.00 (1/4 of estate)  │
│      Free Portion:  ₱0.00                          │
│      Total:         ₱3,125,000.00                   │
│    ─────────────────────────────────────────────── │
│  SECTION 5: COMPUTATION LOG (collapsible → expanded)│
│  SECTION 6: WARNINGS (if any)                      │
│  SECTION 7: DISCLAIMER                             │
├─────────────────────────────────────────────────────┤
│  FIXED FOOTER (every page)                          │
│  Generated 2026-02-28          Page 1 of 4          │
└─────────────────────────────────────────────────────┘
```

---

## 6. Table Rendering Patterns

### Basic Table (for distribution summary)

```tsx
const TableHeader = () => (
  <View style={styles.tableRow} fixed>  {/* fixed keeps header on each page if table spans pages */}
    <Text style={[styles.tableCell, styles.tableCellHeirName, styles.tableHeaderCell]}>Heir</Text>
    <Text style={[styles.tableCell, styles.tableCellCategory, styles.tableHeaderCell]}>Category</Text>
    <Text style={[styles.tableCell, styles.tableCellBasis, styles.tableHeaderCell]}>Legal Basis</Text>
    <Text style={[styles.tableCell, styles.tableCellAmount, styles.tableHeaderCell]}>Net Share</Text>
  </View>
);

const TableRow = ({ share }: { share: InheritanceShare }) => (
  <View style={styles.tableRow} wrap={false}>  {/* wrap=false: keep row on one page */}
    <Text style={[styles.tableCell, styles.tableCellHeirName]}>{share.heir_name}</Text>
    <Text style={[styles.tableCell, styles.tableCellCategory]}>{share.heir_category}</Text>
    <Text style={[styles.tableCell, styles.tableCellBasis]}>
      {share.legal_basis.join(', ')}
    </Text>
    <Text style={[styles.tableCell, styles.tableCellAmount]}>
      {formatPeso(share.net_from_estate)}
    </Text>
  </View>
);
```

### Table Styles

```typescript
const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
  },
  tableHeaderCell: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    padding: 6,
    fontSize: 10,
    fontFamily: 'Times-Roman',
  },
  tableCellHeirName: { flex: 3 },
  tableCellCategory: { flex: 2 },
  tableCellBasis: { flex: 3 },
  tableCellAmount: { flex: 2, textAlign: 'right' },
});
```

### Handling the 7 Layout Variants

The 7 layout variants from `getResultsLayout()` map to PDF sections as follows:

| Layout Variant | PDF Handling |
|---|---|
| `standard-distribution` | Single distribution table |
| `testate-with-dispositions` | Two sub-tables: "Compulsory Shares" + "Free Portion" with section headers |
| `mixed-succession` | Two sub-tables: "Testate Portion" + "Intestate Remainder" |
| `preterition-override` | Table + highlighted alert box ("Art. 854 — Preterition Applied") |
| `collateral-weighted` | Table with extra Blood Type + Units columns |
| `escheat` | Alert box only ("Estate Escheats to State — Art. 1011 NCC") |
| `no-compulsory-full-fp` | Info box + optional table |

**Implementation approach:** Pass `layout` variant as prop to `<DistributionTableSection layout={layout} shares={shares} />` and switch on variant inside.

---

## 7. Variable-Length Content Across Page Breaks

The inheritance report has variable-length content (narratives, computation log steps). Key patterns:

### 7a. Per-heir narrative sections

```tsx
// Each narrative is its own View — react-pdf will break between them
{output.narratives.map(narrative => (
  <View key={narrative.heir_id} style={styles.narrativeSection}>
    <Text style={styles.narrativeHeading}>{narrative.heir_name}</Text>
    <Text style={styles.narrativeBody}>{narrative.text}</Text>
    {/* Share breakdown sub-table */}
    <ShareBreakdown share={shareForHeir(narrative.heir_id)} />
  </View>
))}
```

Use `minPresenceAhead={50}` on section headings to prevent a lonely heading at page bottom:
```tsx
<Text style={styles.narrativeHeading} minPresenceAhead={50}>
  {narrative.heir_name}
</Text>
```

### 7b. Computation log

Log steps are short (one line each). Render as a simple list — react-pdf handles wrapping:
```tsx
{output.computation_log.steps.map((step, i) => (
  <View key={i} style={styles.logRow} wrap={false}>
    <Text style={styles.logStep}>{i + 1}.</Text>
    <Text style={styles.logDescription}>{step.description}</Text>
    <Text style={styles.logValue}>{step.value ?? ''}</Text>
  </View>
))}
```

### 7c. Orphan/widow protection

```typescript
// In StyleSheet:
narrativeBody: {
  orphans: 3,   // min 3 lines at page bottom
  widows: 3,    // min 3 lines at page top
  lineHeight: 1.6,
},
```

---

## 8. PDF Generation Architecture

### Component Tree

```
<InheritanceReportDocument>
  ├── <Document>
  │   └── <Page size="A4" style={pageStyle}>
  │       ├── <PageHeader fixed />           — firm name + case title every page
  │       ├── <FirmHeaderSection />          — logo, address (page 1 only)
  │       ├── <CaseSummarySection />         — decedent, DOD, estate value, scenario
  │       ├── <DistributionTableSection />   — switch on 7 layout variants
  │       ├── <NarrativesSection />          — one sub-section per heir
  │       ├── <ComputationLogSection />      — collapsible in UI → always expanded in PDF
  │       ├── <WarningsSection />            — shown only if warnings.length > 0
  │       ├── <DisclaimerSection />          — standard legal disclaimer
  │       └── <PageFooter fixed />           — generation date + page numbers
```

### Rendering Pattern

**Option A: Browser-download (recommended for v1)**
```typescript
import { pdf } from '@react-pdf/renderer';

async function downloadInheritancePDF(input: EngineInput, output: EngineOutput, firmProfile?: FirmProfile) {
  const doc = <InheritanceReportDocument input={input} output={output} firm={firmProfile} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `estate-${slugify(input.decedent.name)}-${input.decedent.date_of_death}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Option B: In-page preview (for review before download)**
```typescript
import { PDFViewer } from '@react-pdf/renderer';

// Renders PDF in an <iframe> in the browser
<PDFViewer width="100%" height="600px">
  <InheritanceReportDocument input={input} output={output} firm={firmProfile} />
</PDFViewer>
```

**Recommendation:** v1 uses Option A (download only). v2 adds Option B (in-page preview) with `PDFViewer` in a Dialog.

### Performance

@react-pdf/renderer renders in the browser's main thread. For the inheritance report:
- Typical heir count: 2–15
- Narrative text: ~200 words per heir
- Computation log: 10 steps
- Estimated render time: < 500ms for typical cases — acceptable

For large cases (20+ heirs), render in a Web Worker using `pdf().toBlob()` wrapped in a worker promise. Not needed for v1.

---

## 9. Monetary Value Formatting in PDF

Per PH legal document conventions:

```typescript
// Centavos to pesos — format as Philippine legal documents
function formatPeso(centavos: number): string {
  const pesos = centavos / 100;
  return `₱${pesos.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
// Output: ₱12,500,000.00

// For legal document tables, show in words for large amounts:
function pesoInWords(centavos: number): string {
  // Optional for section summaries
  // e.g., "TWELVE MILLION FIVE HUNDRED THOUSAND PESOS (₱12,500,000.00)"
}
```

**Note:** The ₱ symbol requires Unicode support. @react-pdf/renderer supports Unicode out of the box with built-in fonts. If using a custom font, ensure it includes the Peso sign (U+20B1) or fall back to "PHP " prefix.

---

## 10. NCC Article Citation Format in PDF

PH legal documents cite the New Civil Code as follows:

| Context | Format | Example |
|---|---|---|
| In-text citation | "Article [N], New Civil Code" | "Article 887, New Civil Code" |
| Short citation (tables) | "Art. [N], NCC" | "Art. 887, NCC" |
| Multiple articles | "Arts. [N] and [M], NCC" | "Arts. 887 and 889, NCC" |
| Regulation citation | "RR No. [X]-[Year]" | "RR No. 12-2018" |

**For HeirTable in PDF (short form):**
```typescript
// Format legal_basis[] for table cell:
function formatLegalBasisShort(basis: string[]): string {
  // Input: ["Art. 887 NCC", "Art. 889 NCC"]
  // Output: "Arts. 887, 889, NCC"
  const articles = basis.map(b => b.match(/Art\.\s*(\d+)/)?.[1]).filter(Boolean);
  if (articles.length === 0) return '';
  if (articles.length === 1) return `Art. ${articles[0]}, NCC`;
  return `Arts. ${articles.join(', ')}, NCC`;
}

// For narratives section (long form):
function formatLegalBasisLong(basis: string[]): string {
  return basis.map(b => {
    const articleNum = b.match(/Art\.\s*(\d+)/)?.[1];
    const description = NCC_ARTICLE_DESCRIPTIONS[articleNum ?? ''] ?? '';
    return description ? `Article ${articleNum} NCC (${description})` : b;
  }).join('; ');
}
```

---

## 11. Legal Disclaimer Section

Every PH legal document generated by software must include a disclaimer. Standard text:

```
DISCLAIMER: This report is generated by automated computation software
based on the provisions of the New Civil Code of the Philippines. The
computations herein are for informational purposes only and do not
constitute legal advice. The distributable shares shown are subject to
verification of all relevant facts, applicable tax obligations, and final
determination by a licensed Philippine attorney. All figures are in
Philippine Pesos (₱).

This report was prepared using data provided by the user and has not been
independently verified. [Firm Name] assumes no liability for any reliance
on this document without independent legal review.
```

---

## 12. Complete StyleSheet Reference

```typescript
import { StyleSheet } from '@react-pdf/renderer';

export const reportStyles = StyleSheet.create({
  // Page
  page: {
    size: 'A4',
    paddingTop: 90,       // fixed header height + margin
    paddingBottom: 72,    // fixed footer height + margin
    paddingLeft: 72,      // 1 inch
    paddingRight: 72,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },

  // Fixed header
  header: {
    position: 'absolute',
    top: 24,
    left: 72,
    right: 72,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  firmName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151' },
  caseRef: { fontSize: 9, fontFamily: 'Helvetica', color: '#6b7280' },
  headerDivider: { borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', marginTop: 4 },

  // Fixed footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 72,
    right: 72,
  },
  footerDivider: { borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', marginBottom: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerNote: { fontSize: 8, color: '#9ca3af' },
  pageNumber: { fontSize: 8, color: '#6b7280' },

  // Section titles
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Times-Bold',
    marginBottom: 8,
    marginTop: 20,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDivider: { borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', marginBottom: 12 },

  // Case summary block
  summaryBlock: {
    backgroundColor: '#f9fafb',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', marginBottom: 4 },
  summaryLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10, width: 160, color: '#374151' },
  summaryValue: { fontSize: 10, flex: 1, color: '#111827' },

  // Distribution table
  table: { width: '100%', marginBottom: 16 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeaderRow: { backgroundColor: '#f3f4f6' },
  tableCell: { padding: '4 6', fontSize: 10 },
  tableCellBold: { fontFamily: 'Helvetica-Bold', fontSize: 9, textTransform: 'uppercase' },
  colHeir:     { flex: 3 },
  colCategory: { flex: 2 },
  colBasis:    { flex: 3 },
  colAmount:   { flex: 2, textAlign: 'right' },
  colSubtype:  { flex: 2 },  // for collateral-weighted variant
  colUnits:    { flex: 1, textAlign: 'right' },  // for collateral-weighted variant

  // Total row
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#f9fafb',
    marginTop: 2,
  },
  totalLabel: { flex: 8, padding: '6 6', fontFamily: 'Helvetica-Bold', fontSize: 10 },
  totalAmount: { flex: 2, padding: '6 6', textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 10 },

  // Narrative
  narrativeSection: { marginBottom: 16 },
  narrativeHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#1d4ed8',
  },
  narrativeBody: {
    fontSize: 10,
    lineHeight: 1.6,
    orphans: 3,
    widows: 3,
    textAlign: 'justify',
  },
  narrativeBasis: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#6b7280',
    marginTop: 4,
  },

  // Share breakdown (under narrative)
  breakdownRow: {
    flexDirection: 'row',
    paddingLeft: 12,
    paddingTop: 2,
    paddingBottom: 2,
  },
  breakdownLabel: { flex: 3, fontSize: 9, color: '#6b7280' },
  breakdownValue: { flex: 1, textAlign: 'right', fontSize: 9, color: '#374151' },

  // Warning box
  warningBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 0.5,
    borderColor: '#fbbf24',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  warningTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#92400e' },
  warningBody:  { fontSize: 9, color: '#78350f', marginTop: 2 },

  // Computation log
  logRow: { flexDirection: 'row', paddingBottom: 3 },
  logStep: { width: 20, fontSize: 9, color: '#9ca3af' },
  logDescription: { flex: 4, fontSize: 9, color: '#374151' },
  logValue: { flex: 1, textAlign: 'right', fontSize: 9, color: '#1d4ed8' },

  // Disclaimer
  disclaimer: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.4,
    textAlign: 'justify',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
});
```

---

## 13. Sections Hidden in UI → Expanded in PDF

The UI uses collapsible accordions for NarrativePanel and ComputationLog. In the PDF, all content is always fully expanded — the user expects a complete document:

| UI Component | UI State | PDF State |
|---|---|---|
| NarrativePanel accordion | Collapsed by default | Always fully expanded |
| ComputationLog accordion | Collapsed by default | Always fully expanded |
| WarningsPanel | Hidden if no warnings | Omit section if empty |
| FirmHeaderSection | Not shown in UI | Shown on page 1 of PDF |
| DisclaimerSection | Not shown in UI | Always shown (last page) |

---

## 14. Summary: Recommended Implementation Plan for PDF Export

1. **Install:** `npm install @react-pdf/renderer`
2. **Create:** `src/pdf/InheritanceReportDocument.tsx` — root document component
3. **Create:** `src/pdf/styles.ts` — StyleSheet (from §12 above)
4. **Create:** `src/pdf/components/` — PageHeader, PageFooter, CaseSummary, DistributionTable, NarrativeSection, ComputationLog, WarningsSection, Disclaimer
5. **Wire up:** Add "Export PDF" button to `ActionsBar` → calls `downloadInheritancePDF(input, output, firmProfile?)`
6. **Handle 7 layouts:** Pass `layout` variant to DistributionTable, switch on it internally
7. **Font strategy:** Use built-in `Times-Roman` / `Helvetica` for v1

**Dependencies from other specs:**
- `spec-firm-branding` — provides `FirmProfile` data for PDF header (optional prop, PDF works without it)
- `spec-statute-citations-ui` — NCC article descriptions map reused in PDF narrative basis lines
- `spec-case-notes` — if notes are included in PDF, rendered as optional appendix section

---

*Sources consulted:*
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) — v4.3.2 stats
- [react-pdf.org/advanced](https://react-pdf.org/advanced) — fixed, page numbers, orphan/widow
- [LogRocket: Generating PDFs in React](https://blog.logrocket.com/generating-pdfs-react/)
- [npm-compare: @react-pdf/renderer vs jsPDF vs pdfmake](https://npm-compare.com/@react-pdf/renderer,jspdf,pdfmake,react-pdf)
- [DEV: Comparing open source PDF libraries 2025](https://dev.to/joyfill/comparing-open-source-pdf-libraries-2025-edition-401g)
- [Money Forward Dev Blog: Creating PDFs using React JS](https://global.moneyforward-dev.jp/2025/11/14/creating-pdfs-using-react-js/)
- [GitHub react-pdf Discussion #2127: Table header wrapping](https://github.com/diegomura/react-pdf/discussions/2127)
- [PhilippinesLegalForms.com](https://www.philippineslegalforms.com/) — PH legal document conventions
