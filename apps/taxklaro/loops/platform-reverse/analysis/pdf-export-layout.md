# PDF Export Layout — TaxKlaro

**Wave:** 5 (Component Wiring + UI)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** action-trigger-map, component-wiring-map, computation-management, visual-verification-checklist

---

## Summary

PDF export uses `@react-pdf/renderer` running entirely client-side (no server, no Playwright). The component is lazy-loaded via dynamic import inside `handleExportPdf` to avoid adding ~500KB to the initial bundle.

**Stack adaptation note:** The original spec used Playwright + Handlebars (server-side). This is DISCARDED. Client-side `@react-pdf/renderer` matches the inheritance app pattern.

**Scope decision:** One export type: `TaxComputationDocument`. This is a comprehensive SUMMARY export (taxpayer profile, regime comparison, credits, filing instructions). The 4 form-prefill variants (FORM_1701_PREFILL, FORM_1701A_PREFILL, FORM_1701Q_PREFILL, CWT_SCHEDULE) from the original spec are deferred to v2 — they require rendering BIR form facsimiles with precise field positioning that is impractical in react-pdf without significant additional work.

---

## 1. File Structure

```
src/components/pdf/
├── TaxComputationDocument.tsx     # Root document component (dynamically imported)
├── PdfHeader.tsx                  # TaxKlaro/firm branding header
├── PdfFooter.tsx                  # Page number + disclaimer footer
├── PdfDisclaimerBox.tsx           # Red-bordered disclaimer on page 1
├── PdfTaxpayerProfile.tsx         # Section 1: taxpayer profile table
├── PdfRegimeComparison.tsx        # Section 2: 3-path comparison table
├── PdfRecommendedCallout.tsx      # Section 3: recommended path highlight
├── PdfCreditsBreakdown.tsx        # Section 4: CWT + quarterly credits table
├── PdfBalanceRow.tsx              # Section 5: balance payable or overpayment
├── PdfPenaltySummary.tsx          # Section 6: penalty rows (conditional)
├── PdfManualReviewFlags.tsx       # Section 7: MRF advisory boxes (conditional)
├── PdfQuarterlyBreakdown.tsx      # Section 8: quarterly payment schedule (conditional)
├── PdfCwtSchedule.tsx             # Section 9: Form 2307 entries table (conditional)
├── PdfFilingInstructions.tsx      # Section 10: numbered action checklist + deadlines
└── styles.ts                      # Shared StyleSheet constants
```

**Dynamic import trigger** (already in action-trigger-map §2.5):
```typescript
const { pdf } = await import('@react-pdf/renderer');
const { TaxComputationDocument } = await import('@/components/pdf/TaxComputationDocument');
```

---

## 2. TaxComputationDocument — Root Component

**File:** `src/components/pdf/TaxComputationDocument.tsx`

```typescript
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './styles';
import { PdfHeader } from './PdfHeader';
import { PdfFooter } from './PdfFooter';
import { PdfDisclaimerBox } from './PdfDisclaimerBox';
import { PdfTaxpayerProfile } from './PdfTaxpayerProfile';
import { PdfRegimeComparison } from './PdfRegimeComparison';
import { PdfRecommendedCallout } from './PdfRecommendedCallout';
import { PdfCreditsBreakdown } from './PdfCreditsBreakdown';
import { PdfBalanceRow } from './PdfBalanceRow';
import { PdfPenaltySummary } from './PdfPenaltySummary';
import { PdfManualReviewFlags } from './PdfManualReviewFlags';
import { PdfQuarterlyBreakdown } from './PdfQuarterlyBreakdown';
import { PdfCwtSchedule } from './PdfCwtSchedule';
import { PdfFilingInstructions } from './PdfFilingInstructions';
import type { TaxComputationResult } from '@/types/engine-output';
import type { TaxpayerInput } from '@/types/engine-input';
import type { UserProfile } from '@/types/common';

interface TaxComputationDocumentProps {
  input: TaxpayerInput;
  output: TaxComputationResult;
  profile: UserProfile | null;   // null for anonymous exports
  generatedAt: string;           // ISO timestamp, formatted in footer
}

export function TaxComputationDocument({
  input,
  output,
  profile,
  generatedAt,
}: TaxComputationDocumentProps) {
  const isQuarterly = input.filingPeriod !== 'ANNUAL';
  const isCompensationOnly = input.taxpayerType === 'COMPENSATION_ONLY';
  const hasMrf = output.manualReviewFlags.length > 0;
  const hasPenalties = output.penaltyResult.applies;
  const hasCwtEntries = input.cwt2307Entries.length > 0;
  const hasQuarterlyPayments = (input.priorQuarterlyPayments?.length ?? 0) > 0;

  return (
    <Document
      title={`Tax Computation — ${input.taxYear}`}
      author="TaxKlaro"
      subject="Philippine Income Tax Computation Summary"
      creator="TaxKlaro (taxklaro.ph)"
    >
      <Page size="A4" style={styles.page}>
        <PdfHeader profile={profile} taxYear={input.taxYear} filingPeriod={input.filingPeriod} />
        <PdfDisclaimerBox />
        <PdfTaxpayerProfile input={input} output={output} />
        {!isCompensationOnly && (
          <PdfRegimeComparison output={output} input={input} />
        )}
        {!isCompensationOnly && (
          <PdfRecommendedCallout output={output} />
        )}
        <PdfCreditsBreakdown input={input} output={output} />
        <PdfBalanceRow output={output} />
        {hasPenalties && <PdfPenaltySummary output={output} />}
        {hasMrf && <PdfManualReviewFlags flags={output.manualReviewFlags} />}
        {isQuarterly && hasQuarterlyPayments && (
          <PdfQuarterlyBreakdown input={input} output={output} />
        )}
        {hasCwtEntries && <PdfCwtSchedule entries={input.cwt2307Entries} output={output} />}
        <PdfFilingInstructions input={input} output={output} />
        <PdfFooter generatedAt={generatedAt} profile={profile} />
      </Page>
    </Document>
  );
}
```

**Conditional section visibility** (matches results-views.md §1.2):

| Section | Shown When |
|---------|-----------|
| PdfRegimeComparison | `taxpayerType !== 'COMPENSATION_ONLY'` |
| PdfRecommendedCallout | `taxpayerType !== 'COMPENSATION_ONLY'` |
| PdfPenaltySummary | `output.penaltyResult.applies === true` |
| PdfManualReviewFlags | `output.manualReviewFlags.length > 0` |
| PdfQuarterlyBreakdown | `filingPeriod !== 'ANNUAL'` AND prior quarterly payments exist |
| PdfCwtSchedule | `input.cwt2307Entries.length > 0` |

---

## 3. Shared Styles (styles.ts)

**File:** `src/components/pdf/styles.ts`

```typescript
import { StyleSheet, Font } from '@react-pdf/renderer';

// Register Inter font (use Google Fonts CDN URL — react-pdf fetches at render time)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff', fontWeight: 700 },
  ],
});

// Color palette (matches TaxKlaro design system)
export const COLORS = {
  primary: '#1D4ED8',       // brand blue — TaxKlaro primary
  primaryLight: '#EFF6FF',  // blue-50
  success: '#16A34A',       // green-600 — balance refundable, savings
  successLight: '#F0FDF4',  // green-50
  warning: '#D97706',       // amber-600 — warnings
  warningLight: '#FFFBEB',  // amber-50
  error: '#DC2626',         // red-600 — balance payable
  errorLight: '#FEF2F2',    // red-50
  gray900: '#111827',       // text primary
  gray700: '#374151',       // text secondary
  gray500: '#6B7280',       // text muted
  gray300: '#D1D5DB',       // border light
  gray200: '#E5E7EB',       // border very light
  gray100: '#F3F4F6',       // background stripe
  white: '#FFFFFF',
  disclaimer: '#FFF5F5',    // disclaimer box background
  disclaimerBorder: '#FC8181', // disclaimer box border (red-300)
};

export const styles = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: COLORS.gray900,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerLogo: { height: 24, width: 'auto' },
  headerTitle: { fontSize: 11, fontWeight: 700, color: COLORS.gray900, textAlign: 'right' },
  headerSubtitle: { fontSize: 8, color: COLORS.gray500, textAlign: 'right' },

  // Footer (fixed at bottom)
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 4,
  },
  footerText: { fontSize: 7, color: COLORS.gray500 },
  footerDisclaimer: { fontSize: 7, color: COLORS.error, textAlign: 'right', flex: 1, marginLeft: 8 },

  // Section
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.gray900,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray300,
  },

  // Table
  table: { width: '100%' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200 },
  tableRowAlt: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200 },
  tableRowTotal: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.gray900, backgroundColor: COLORS.gray100 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: COLORS.primary },
  tableCell: { padding: '4pt 6pt', fontSize: 8.5, color: COLORS.gray700 },
  tableCellHeader: { padding: '4pt 6pt', fontSize: 8.5, fontWeight: 700, color: COLORS.white },
  tableCellRight: { padding: '4pt 6pt', fontSize: 8.5, color: COLORS.gray700, textAlign: 'right' },
  tableCellTotalLabel: { padding: '4pt 6pt', fontSize: 8.5, fontWeight: 700, color: COLORS.gray900 },
  tableCellTotalValue: { padding: '4pt 6pt', fontSize: 8.5, fontWeight: 700, color: COLORS.gray900, textAlign: 'right' },

  // Recommendation callout
  recommendationBox: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
    padding: '8pt 10pt',
    marginBottom: 12,
  },
  recommendationLabel: { fontSize: 8, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', marginBottom: 2 },
  recommendationTitle: { fontSize: 11, fontWeight: 700, color: COLORS.gray900, marginBottom: 4 },
  recommendationSavings: { fontSize: 8.5, color: COLORS.success },

  // Disclaimer box
  disclaimerBox: {
    backgroundColor: COLORS.disclaimer,
    borderWidth: 1,
    borderColor: COLORS.disclaimerBorder,
    borderRadius: 4,
    padding: '8pt 10pt',
    marginBottom: 12,
  },
  disclaimerTitle: { fontSize: 9, fontWeight: 700, color: COLORS.error, marginBottom: 4 },
  disclaimerText: { fontSize: 7.5, color: COLORS.gray700, lineHeight: 1.5 },

  // MRF advisory box
  mrfBox: {
    backgroundColor: COLORS.warningLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    padding: '6pt 8pt',
    marginBottom: 6,
  },
  mrfCode: { fontSize: 7.5, fontWeight: 700, color: COLORS.warning, marginBottom: 2 },
  mrfTitle: { fontSize: 8.5, fontWeight: 700, color: COLORS.gray900, marginBottom: 2 },
  mrfText: { fontSize: 8, color: COLORS.gray700, lineHeight: 1.4 },

  // Filing instructions
  instructionItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
  instructionNumber: { fontSize: 8.5, fontWeight: 700, color: COLORS.primary, width: 16, flexShrink: 0 },
  instructionText: { fontSize: 8.5, color: COLORS.gray700, flex: 1, lineHeight: 1.4 },

  // Balance row
  balancePayable: { fontSize: 11, fontWeight: 700, color: COLORS.error },
  balanceRefundable: { fontSize: 11, fontWeight: 700, color: COLORS.success },
  balanceZero: { fontSize: 11, fontWeight: 700, color: COLORS.gray700 },
});
```

**Critical:** `Font.register()` is called at module load time. Fonts are fetched over network during PDF generation. For offline/production environments, fonts can alternatively be bundled as `data:` URIs or served from the same origin.

---

## 4. PdfHeader

**File:** `src/components/pdf/PdfHeader.tsx`

```typescript
import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from './styles';

interface PdfHeaderProps {
  profile: UserProfile | null;
  taxYear: number;
  filingPeriod: FilingPeriod;
}

export function PdfHeader({ profile, taxYear, filingPeriod }: PdfHeaderProps) {
  const filingLabel = {
    ANNUAL: 'Annual',
    Q1: 'Q1 (Jan–Mar)',
    Q2: 'Q2 (Jan–Jun)',
    Q3: 'Q3 (Jan–Sep)',
  }[filingPeriod] ?? filingPeriod;

  // Firm branding: use firm logo + name if profile.firmLogoUrl is set; else TaxKlaro wordmark
  const hasFirmLogo = profile?.firmLogoUrl != null;

  return (
    <View style={styles.header} fixed>
      <View>
        {hasFirmLogo ? (
          <Image src={profile!.firmLogoUrl!} style={styles.headerLogo} />
        ) : (
          <Text style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8' }}>TaxKlaro</Text>
        )}
        {hasFirmLogo && profile!.firmName && (
          <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>{profile!.firmName}</Text>
        )}
      </View>
      <View>
        <Text style={styles.headerTitle}>Tax Computation Summary</Text>
        <Text style={styles.headerSubtitle}>Tax Year {taxYear} — {filingLabel}</Text>
      </View>
    </View>
  );
}
```

**Branding rules:**
- If `profile.firmLogoUrl` is set: display firm logo (max height 24pt in PDF units) + firm name below it.
- If no firm logo: display "TaxKlaro" wordmark in primary blue (#1D4ED8), bold, 14pt.
- This implements the "white-label for ENTERPRISE" pattern: ENTERPRISE users with a firm logo get their branding; PRO/FREE get TaxKlaro branding.
- `fixed` prop on the View makes the header repeat on every page in react-pdf.

---

## 5. PdfFooter

**File:** `src/components/pdf/PdfFooter.tsx`

```typescript
import { View, Text } from '@react-pdf/renderer';
import { styles } from './styles';

interface PdfFooterProps {
  generatedAt: string;  // ISO timestamp
  profile: UserProfile | null;
}

export function PdfFooter({ generatedAt, profile }: PdfFooterProps) {
  const dateStr = new Date(generatedAt).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
  });
  const timeStr = new Date(generatedAt).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila',
  });
  const poweredBy = profile?.firmName ? 'Powered by TaxKlaro' : 'Generated by TaxKlaro';

  return (
    <View style={styles.footer} fixed>
      {/* Left: page number */}
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      } />
      {/* Center: generated by */}
      <Text style={{ ...styles.footerText, flex: 1, textAlign: 'center' }}>
        {`${poweredBy} on ${dateStr} at ${timeStr} PHT`}
      </Text>
      {/* Right: disclaimer */}
      <Text style={styles.footerDisclaimer}>
        FOR REFERENCE ONLY. Not a BIR-accepted filing.
      </Text>
    </View>
  );
}
```

**Notes:**
- `fixed` prop makes the footer repeat on every page.
- `render` prop on `<Text>` is the react-pdf pattern for dynamic page numbers.
- `en-PH` locale with `Asia/Manila` timezone produces Philippine-formatted dates.

---

## 6. PdfDisclaimerBox

**File:** `src/components/pdf/PdfDisclaimerBox.tsx`

```typescript
import { View, Text } from '@react-pdf/renderer';
import { styles } from './styles';

export function PdfDisclaimerBox() {
  return (
    <View style={styles.disclaimerBox}>
      <Text style={styles.disclaimerTitle}>Important Notice</Text>
      <Text style={styles.disclaimerText}>
        This document is generated by TaxKlaro and is intended for reference and
        planning purposes only. It does not constitute official tax advice or a
        substitute for consultation with a licensed Certified Public Accountant (CPA)
        or tax professional. TaxKlaro makes no representations or warranties about the
        accuracy, completeness, or fitness for a specific purpose of this document.
        The user is solely responsible for verifying all figures against original
        source documents and for all filings submitted to the Bureau of Internal
        Revenue (BIR). This document does not constitute a BIR-accepted tax return
        and must not be submitted to the BIR as a filing.
      </Text>
    </View>
  );
}
```

---

## 7. PdfTaxpayerProfile

**File:** `src/components/pdf/PdfTaxpayerProfile.tsx`

Renders Section 1 — taxpayer profile as a 2-column label/value table.

```typescript
// Props
interface PdfTaxpayerProfileProps {
  input: TaxpayerInput;
  output: TaxComputationResult;
}
```

**Rows to render:**

| Label | Source | Format |
|-------|--------|--------|
| Tax Year | `input.taxYear` | "2025" |
| Filing Period | `input.filingPeriod` | "Annual (BIR Form 1701/1701A)" / "Q1 (BIR Form 1701Q)" / "Q2 (BIR Form 1701Q)" / "Q3 (BIR Form 1701Q)" |
| Taxpayer Type | `input.taxpayerType` | "Purely Self-Employed / Professional" (PURELY_SE) / "Mixed Income (Compensation + Business)" (MIXED_INCOME) / "Compensation Only" (COMPENSATION_ONLY) |
| VAT Registered | `input.isVatRegistered` | "Yes" / "No" |
| BMBE Registered | `input.isBmbeRegistered` | "Yes" / "No" |
| Gross Receipts / Sales | `input.grossReceipts` | "₱1,200,000.00" |
| COGS | `input.costOfGoodsSold` | "₱0.00" — show even if zero |
| Non-Operating Income | `input.nonOperatingIncome` | "₱0.00" — show even if zero |
| Taxable Compensation | `input.taxableCompensation` | Shown only if `taxpayerType === 'MIXED_INCOME'` |
| EOPT Taxpayer Tier | `output.eoptTier` | "MICRO (gross receipts below ₱3M)" / "SMALL (₱3M–₱20M)" / "MEDIUM/LARGE" |

**Layout:** Two-column table (label column 40%, value column 60%). Alternating row background (#F3F4F6 on even rows). Section title: "Taxpayer Profile".

---

## 8. PdfRegimeComparison

**File:** `src/components/pdf/PdfRegimeComparison.tsx`

Renders Section 2 — 3-path comparison table. Shown only when `taxpayerType !== 'COMPENSATION_ONLY'`.

```typescript
interface PdfRegimeComparisonProps {
  output: TaxComputationResult;
  input: TaxpayerInput;
}
```

**Table structure:** 4 columns — Row Label | Path A | Path B | Path C

| Row | Path A: Graduated + Itemized | Path B: Graduated + OSD (40%) | Path C: 8% Flat Rate |
|-----|------------------------------|-------------------------------|---------------------|
| **Header** | "Graduated + Itemized" | "Graduated + OSD (40%)" | "8% Flat Rate" |
| Gross Receipts | `₱{input.grossReceipts}` | same | same |
| Less: Deductions | `₱{output.pathA.totalItemizedDeductions}` "Itemized" | `₱{output.pathB.osdAmount}` "40% OSD" | "N/A — 8% on gross" |
| Net Taxable Income | `₱{output.pathA.netTaxableIncome}` | `₱{output.pathB.netTaxableIncome}` | `₱{output.pathC?.netTaxableIncome ?? '—'}` |
| Income Tax Due | `₱{output.pathA.incomeTaxDue}` | `₱{output.pathB.incomeTaxDue}` | `₱{output.pathC?.totalIncomeTax ?? 'INELIGIBLE'}` |
| Percentage Tax | `-₱{output.pathA.percentageTaxDue ?? 0}` | same | "Waived" |
| **Total Tax Burden** | **`₱{pathABurden}`** | **`₱{pathBBurden}`** | **`₱{pathCBurden ?? 'INELIGIBLE'}`** |

**Column header styling:**
- Recommended path column: blue header (`#1D4ED8` background, white text).
- Other paths: dark gray header (`#374151`).
- Ineligible path (Path C when not eligible): gray header, all cells show "—" or ineligibility reason.

**Ineligibility handling:** If `output.pathC?.eligible === false`, the Path C column header shows the reason in 7pt italic:
- VAT registered: "Ineligible — VAT Registered"
- Gross receipts > ₱3M: "Ineligible — Exceeds ₱3M Threshold"
- Mixed income with employee: "Ineligible — Mixed Income Earner" (different rule)

**Savings footnote** (below table, if recommended path is defined and not locked):
```
"Recommended: Path {X} saves ₱{savings_vs_next_best} vs. next best option"
```
Rendered as a small text below the table in primary blue, 8pt.

---

## 9. PdfRecommendedCallout

**File:** `src/components/pdf/PdfRecommendedCallout.tsx`

Renders the highlighted recommendation box using `styles.recommendationBox`.

```typescript
interface PdfRecommendedCalloutProps {
  output: TaxComputationResult;
}
```

**Content:**
```
RECOMMENDED
[Path X: Graduated + Itemized Deductions / Graduated + OSD / 8% Flat Rate]

Saves ₱{savings_vs_next_best} vs. next best option
Saves ₱{savings_vs_worst} vs. highest-tax option
Total tax burden: ₱{recommended_total_burden}
```

**If user elected a path (optimizer mode off / regime locked):**
- Box title: "ELECTED PATH" in amber instead of blue
- Extra line: "TaxKlaro recommends Path {Y} which would save ₱{savings} — see comparison above."
- Box uses warningLight background + warning border

---

## 10. PdfCreditsBreakdown

**File:** `src/components/pdf/PdfCreditsBreakdown.tsx`

Renders Section 4 — credits and balance computation. Always shown.

**Table rows:**

| Label | Source | Format |
|-------|--------|--------|
| Income Tax Due (recommended path) | `output.balanceResult.incomeTaxDue` | `₱{amount}` |
| Less: Creditable Withholding Tax (Form 2307) | `output.cwtCredits.itCwtTotal` | `-₱{amount}` |
| Less: Prior Year Excess CWT | `output.balanceResult.priorYearExcessCwt` | `-₱{amount}` (shown only if > 0) |
| Less: Prior Quarterly Payments | `output.quarterlyAggregates.totalQuarterlyItPaid` | `-₱{amount}` (shown only if > 0) |
| Less: Other Credits | `output.balanceResult.otherCredits` | `-₱{amount}` (shown only if > 0) |
| **Total Credits** | `output.balanceResult.totalItCredits` | **`₱{amount}`** (bold, underlined) |

Section title: "Tax Credits Summary"

---

## 11. PdfBalanceRow

**File:** `src/components/pdf/PdfBalanceRow.tsx`

Renders the final balance line — the most important number in the document.

```typescript
interface PdfBalanceRowProps {
  output: TaxComputationResult;
}
```

**Logic:**
- If `output.balanceResult.balance > 0`: "Balance Payable: ₱{amount}" in `styles.balancePayable` (red, 11pt bold)
- If `output.balanceResult.balance < 0`: "Overpayment (To Be Refunded or Credited): ₱{Math.abs(amount)}" in `styles.balanceRefundable` (green, 11pt bold)
- If `output.balanceResult.balance === 0`: "Tax Due: ₱0.00 — Fully Covered by Credits" in `styles.balanceZero` (gray, 11pt bold)

Displayed in a full-width bordered box:
- Balance payable: red border (`#DC2626`), light red background (`#FEF2F2`)
- Overpayment: green border (`#16A34A`), light green background (`#F0FDF4`)
- Zero: gray border, gray background

Note: If `output.penaltyResult.applies === true`, add a second line:
```
Plus Penalties: ₱{output.penaltyResult.totalPenalties}
Total Amount Payable: ₱{balance + totalPenalties}
```
in a smaller font (9pt) below the main balance line, within the same box.

---

## 12. PdfPenaltySummary

**File:** `src/components/pdf/PdfPenaltySummary.tsx`

Rendered only when `output.penaltyResult.applies === true`.

**Table rows:**

| Penalty Component | Amount |
|-------------------|--------|
| Surcharge (25% or 50%) | `₱{output.penaltyResult.surcharge}` |
| Interest (20% per annum, prorated) | `₱{output.penaltyResult.interest}` |
| Compromise Penalty | `₱{output.penaltyResult.compromisePenalty}` |
| **Total Penalties** | **`₱{output.penaltyResult.totalPenalties}`** |

Note below table: "Penalties computed based on {daysLate} days late filing as of {filingDate}. Computed per BIR Revenue Regulations 21-2018."

Section title: "Late Filing Penalties"

---

## 13. PdfManualReviewFlags

**File:** `src/components/pdf/PdfManualReviewFlags.tsx`

Rendered only when `output.manualReviewFlags.length > 0`.

Each flag renders as an amber left-bordered advisory box using `styles.mrfBox`:

```typescript
output.manualReviewFlags.map(flag => (
  <View key={flag.code} style={styles.mrfBox}>
    <Text style={styles.mrfCode}>{flag.code}</Text>
    <Text style={styles.mrfTitle}>{flag.title}</Text>
    <Text style={styles.mrfText}>{flag.description}</Text>
    {flag.actionRequired && (
      <Text style={{ ...styles.mrfText, fontWeight: 700, marginTop: 2 }}>
        Action Required: {flag.actionRequired}
      </Text>
    )}
  </View>
))
```

Section title: "Manual Review Required"

---

## 14. PdfQuarterlyBreakdown

**File:** `src/components/pdf/PdfQuarterlyBreakdown.tsx`

Rendered only for quarterly filings (`filingPeriod !== 'ANNUAL'`) when prior quarterly payments exist.

**Table:** Lists prior quarterly payments already made:

| Quarter | Period | Income Tax Paid | Notes |
|---------|--------|----------------|-------|
| Q1 | Jan 1 – Mar 31 | `₱{q1Amount}` | "Per 1701Q filed {date}" |
| Q2 | Jan 1 – Jun 30 | `₱{q2Amount}` | "Per 1701Q filed {date}" |

**Below table:** "Total Prior Quarterly Payments: ₱{total}" in bold.

Section title: "Prior Quarterly Payments"

---

## 15. PdfCwtSchedule

**File:** `src/components/pdf/PdfCwtSchedule.tsx`

Rendered only when `input.cwt2307Entries.length > 0`.

**Table columns:**

| # | Payor Name | Payor TIN | ATC Code | Period | Income Payment | Tax Withheld |
|---|-----------|----------|----------|--------|---------------|-------------|
| {n} | {payorName} | {payorTin} | {atcCode} | {periodFrom} to {periodTo} | ₱{incomePayment} | ₱{taxWithheld} |

Column widths: `#` = 4%, `Payor Name` = 24%, `Payor TIN` = 14%, `ATC` = 8%, `Period` = 16%, `Income Payment` = 17%, `Tax Withheld` = 17%.

**Total row:** "Total CWT Available for Credit: ₱{output.cwtCredits.itCwtTotal}" in bold.

**Note below table (8pt italic):** "Source: BIR Form 2307 (Certificate of Creditable Tax Withheld at Source). Verify all entries against original Form 2307 certificates. Figures shown here are as entered by the taxpayer and have not been verified by TaxKlaro."

Section title: "Form 2307 CWT Entries"

---

## 16. PdfFilingInstructions

**File:** `src/components/pdf/PdfFilingInstructions.tsx`

Renders numbered filing checklist + deadlines table. Always shown.

```typescript
interface PdfFilingInstructionsProps {
  input: TaxpayerInput;
  output: TaxComputationResult;
}
```

**Instructions logic** (matches professional-features.md §2.3.4):

If `output.regimeComparison.recommendedPath === 'PATH_C'` AND `input.filingPeriod === 'ANNUAL'`:
1. File BIR Form 1701A (Annual ITR — 8% Flat Rate Election) on or before April 15, {taxYear + 1}.
2. Signify 8% election in BIR Form 1701A Part IV, Item 50.
3. Pay balance due of ₱{balancePayable} via BIR's Authorized Agent Banks or GCash/Maya/online banking.
4. Attach all Form 2307 certificates from payors to your return.
5. If filing via eBIRForms: Use eBIRForms v7.9.4 or later.
6. If filing via eAFS: Upload Form 1701A and attachments within 15 calendar days after the filing deadline.

If `recommendedPath === 'PATH_A'` or `'PATH_B'` AND `filingPeriod === 'ANNUAL'`:
1. File BIR Form 1701 (Annual ITR — Graduated Rate) on or before April 15, {taxYear + 1}.
2. If electing OSD: Mark Item 43 "Optional Standard Deduction" in BIR Form 1701.
3. If using itemized deductions: Attach Schedule 1 (Itemized Deductions) to your return.
4. Pay balance due of ₱{balancePayable} on or before April 15, {taxYear + 1}.
5. Attach all Form 2307 certificates from payors.
6. If filing via eBIRForms: Use eBIRForms v7.9.4 or later.

If `filingPeriod === 'Q1'`:
1. File BIR Form 1701Q for Q1 (January 1 – March 31) on or before May 15, {taxYear}.
2. Use cumulative method: income and deductions for the full period January 1 to March 31.
3. Pay balance due of ₱{balancePayable} on or before May 15, {taxYear}.

If `filingPeriod === 'Q2'`:
1. File BIR Form 1701Q for Q2 (January 1 – June 30) on or before August 15, {taxYear}.
2. Deduct Q1 payment of ₱{q1Payment} already made. Balance due is ₱{balancePayable}.

If `filingPeriod === 'Q3'`:
1. File BIR Form 1701Q for Q3 (January 1 – September 30) on or before November 15, {taxYear}.
2. Deduct prior quarterly payments (Q1 + Q2) totaling ₱{totalPriorQuarterly}. Balance due is ₱{balancePayable}.

**Percentage Tax reminder** (shown if `output.ptResult.ptApplies === true` AND `recommendedPath !== 'PATH_C'`):

> "As a non-VAT registered taxpayer with gross receipts below ₱3,000,000, you are also required to file quarterly Percentage Tax returns (BIR Form 2551Q) at 3% of gross receipts. Your estimated quarterly percentage tax for this period is ₱{output.ptResult.ptDue}. Deadlines: Q1 — April 25, Q2 — July 25, Q3 — October 25, Q4 — January 25 of the following year."

**Deadlines table:**

| Form | Description | Deadline |
|------|-------------|----------|
| 1701A or 1701 | Annual ITR for AY{taxYear} | April 15, {taxYear + 1} |
| 1701Q (Q1) | Quarterly ITR, Q1 | May 15, {taxYear} |
| 1701Q (Q2) | Quarterly ITR, Q2 | August 15, {taxYear} |
| 1701Q (Q3) | Quarterly ITR, Q3 | November 15, {taxYear} |
| 2551Q (Q1) | Percentage Tax, Q1 | April 25, {taxYear} |
| 2551Q (Q2) | Percentage Tax, Q2 | July 25, {taxYear} |
| 2551Q (Q3) | Percentage Tax, Q3 | October 25, {taxYear} |
| 2551Q (Q4) | Percentage Tax, Q4 | January 25, {taxYear + 1} |

Section title: "Filing Instructions & Deadlines"

---

## 17. Filename Convention

**Pattern:** `tax-computation-{taxpayerName}-{taxYear}.pdf`

**Derivation** (from action-trigger-map §2.5):
```typescript
const taxpayerName = profile?.fullName
  ? profile.fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  : 'anonymous';
const taxYear = String(input.taxYear);
const filename = `tax-computation-${taxpayerName}-${taxYear}.pdf`;
```

**Examples:**
- `tax-computation-maria-santos-2025.pdf`
- `tax-computation-anonymous-2025.pdf`
- `tax-computation-juan-dela-cruz-2024.pdf`

---

## 18. Premium Gating

PDF export requires `org.plan === 'PRO'` or `org.plan === 'ENTERPRISE'`. The Export PDF button in `ActionsBar` is:
- Grayed out (`disabled`) + tooltip "Upgrade to PRO to export PDF" for FREE plan
- Fully functional for PRO and ENTERPRISE plans

Firm logo branding in PDF header (`PdfHeader`) requires a firm logo uploaded in Settings. The logo is stored at `firmLogoUrl` in `user_profiles`. Upload is available to all plans in Settings. WHITE-LABEL (logo instead of TaxKlaro branding) is available to any plan that has set a firm logo — it is NOT restricted to ENTERPRISE in the client-side implementation (unlike the original server-side spec which restricted white-label to ENTERPRISE).

---

## 19. Package Dependency

Add to `package.json`:
```json
{
  "@react-pdf/renderer": "^3.4.4"
}
```

**Vite config note:** `@react-pdf/renderer` uses top-level await internally. Add to `vite.config.ts`:
```typescript
optimizeDeps: {
  exclude: ['@react-pdf/renderer'],
},
```

This prevents Vite from trying to pre-bundle the package, which would fail due to top-level await. The dynamic import in `handleExportPdf` already prevents eager loading.

**Production build risk:** `@react-pdf/renderer` v3.x contains top-level await in its dependencies. Confirm `vite-plugin-top-level-await` is in the Vite config. The production-build-verification aspect covers this check explicitly.

---

## 20. Visual Verification Checklist (PDF components)

PDF components use `@react-pdf/renderer` primitives (`View`, `Text`, `Image`, `Page`, `Document`) — NOT HTML/Tailwind. The normal "3+ Tailwind classes" rule does NOT apply. Instead, verify:

- Every `View` has a `style` prop (not bare `<View>`)
- Every `Text` has either a `style` prop or inherits from parent `View` style
- The root `Page` uses `styles.page`
- Header and footer use `fixed` prop for repeat on each page
- Colors are from `COLORS` constants (not hardcoded hex strings in components)

The forward loop's Phase 6 visual scan must exclude `src/components/pdf/**` from the Tailwind class count check.

---

## 21. Test Coverage

Unit tests for PDF components are NOT required (react-pdf is notoriously hard to test). Instead:

**Integration test** in `src/__tests__/pdf.test.ts`:
```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { TaxComputationDocument } from '@/components/pdf/TaxComputationDocument';
import { sampleInput, sampleOutput } from './fixtures/tax-computation';

test('TaxComputationDocument renders to PDF buffer', async () => {
  const buffer = await renderToBuffer(
    <TaxComputationDocument
      input={sampleInput}
      output={sampleOutput}
      profile={null}
      generatedAt={new Date().toISOString()}
    />
  );
  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer.byteLength).toBeGreaterThan(1000);  // non-trivial PDF
  // PDF starts with %PDF header
  expect(buffer.toString('utf-8', 0, 4)).toBe('%PDF');
});
```

**Note on vitest setup:** `@react-pdf/renderer` uses node canvas under the hood for test environments. Add to `vitest.config.ts`:
```typescript
server: {
  deps: {
    inline: ['@react-pdf/renderer'],
  },
},
```

---

## Cross-References

- **Action trigger:** `action-trigger-map.md §2.5` — `handleExportPdf()` with dynamic import, loading toast, blob URL download
- **Component wiring:** `component-wiring-map.md` — `TaxComputationDocument` wired to `handleExportPdf` in `/computations/$compId` route
- **Premium gating:** `computation-management.md` — `canExportPdf = org.plan === 'PRO' || 'ENTERPRISE'`
- **Firm logo upload:** `supabase-migrations.md §004` — `firm-logos` storage bucket, `user_profiles.firm_logo_url`
- **Toast messages:** `toast-catalog.md` — "Preparing PDF..." loading + "PDF downloaded!" success + "PDF export failed" error
- **Production risks:** `production-build-verification.md` — `@react-pdf/renderer` + `vite-plugin-top-level-await` interaction
