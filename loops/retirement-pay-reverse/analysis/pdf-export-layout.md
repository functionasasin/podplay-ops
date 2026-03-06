# Analysis: PDF Export Layout — RA 7641 Retirement Pay Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** pdf-export-layout
**Date:** 2026-03-06
**Sources:** results-view.md, batch-upload-ui.md, nlrc-worksheet-ui.md, action-trigger-map.md,
             design-system.md, typescript-types.md, nlrc-worksheet-generator.md

---

## Overview

The app exports four distinct PDF document types using `@react-pdf/renderer`:

| Document | Component | Trigger | Output file |
|---|---|---|---|
| Single computation | `RetirementPayPdfDocument` | `usePdfExport()` hook | `retirement-pay-{name}.pdf` |
| Batch summary | `BatchSummaryPdfDocument` | `exportSummaryPdf()` fn | `batch-summary-{date}.pdf` |
| NLRC worksheet (single) | `NlrcWorksheetPdfDocument` | `handleDownloadPdf()` in `NlrcWorksheetPage` | `nlrc-worksheet-{name}.pdf` |
| NLRC worksheet (batch) | `NlrcBatchPdfDocument` | `exportNlrcBatchPdf()` fn | `nlrc-batch-{batchName}-{date}.pdf` |

All use `@react-pdf/renderer` primitives: `Document`, `Page`, `View`, `Text`, `StyleSheet`.
No HTML or Tailwind inside PDF components — only `@react-pdf/renderer` style objects.

---

## Package and Installation

```
npm install @react-pdf/renderer
```

```typescript
// PDF generation pattern used everywhere:
import { pdf } from "@react-pdf/renderer";

async function generateAndDownload(
  component: React.ReactElement,
  filename: string,
): Promise<void> {
  const blob = await pdf(component).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

File location for this utility:
`apps/retirement-pay/frontend/src/lib/pdfDownload.ts`

```typescript
// apps/retirement-pay/frontend/src/lib/pdfDownload.ts
import { pdf } from "@react-pdf/renderer";
import type React from "react";

export async function generateAndDownloadPdf(
  component: React.ReactElement,
  filename: string,
): Promise<void> {
  const blob = await pdf(component).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

## Shared PDF Utilities

### Money Formatting (PDF)

```typescript
// apps/retirement-pay/frontend/src/lib/pdfFormat.ts
// Separate from lib/format.ts because PDF components cannot use Intl browser API
// (some PDF rendering environments do not have full Intl support)

export function formatMoneyCentavosPdf(centavos: number): string {
  const pesos = centavos / 100;
  const formatted = pesos.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `PHP ${formatted}`;
}

export function formatDatePdf(isoDate: string): string {
  // "2024-03-15" → "March 15, 2024"
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${months[month - 1]} ${day}, ${year}`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "-").toLowerCase().replace(/-+/g, "-");
}
```

---

## PDF Document 1: Single Computation — `RetirementPayPdfDocument`

### File
`apps/retirement-pay/frontend/src/components/pdf/RetirementPayPdfDocument.tsx`

### Paper Size and Margins
- **Paper**: Letter (8.5" × 11")
- **Orientation**: Portrait
- **Margins**: top 54pt (0.75"), bottom 54pt, left 72pt (1.0"), right 72pt
- **Font**: Helvetica (built-in, no external font load required)
- **Font size**: 10pt body, 8pt captions, 12pt section headings, 16pt document title

### Trigger (wired in `usePdfExport` hook)

```typescript
// apps/retirement-pay/frontend/src/hooks/usePdfExport.ts

import { useState } from "react";
import { generateAndDownloadPdf } from "@/lib/pdfDownload";
import { sanitizeFilename } from "@/lib/pdfFormat";
import { RetirementPayPdfDocument } from "@/components/pdf/RetirementPayPdfDocument";
import type { RetirementOutput } from "@/types/retirement";

export function usePdfExport(output: RetirementOutput) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = async () => {
    setIsExporting(true);
    try {
      const filename = `retirement-pay-${sanitizeFilename(output.employeeName)}.pdf`;
      await generateAndDownloadPdf(
        <RetirementPayPdfDocument output={output} />,
        filename,
      );
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPdf, isExporting };
}
```

### StyleSheet

```typescript
import { StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#111827",             // gray-900
    paddingTop: 54,
    paddingBottom: 54,
    paddingLeft: 72,
    paddingRight: 72,
  },

  // ── Document header ──────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1.5pt solid #111827",
  },
  appName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  appTagline: {
    fontSize: 8,
    color: "#6B7280",             // gray-500
    marginTop: 2,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  docSubtitle: {
    fontSize: 8,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 2,
  },

  // ── Employee info banner ──────────────────────────────────
  employeeBanner: {
    backgroundColor: "#F9FAFB",   // gray-50
    border: "1pt solid #E5E7EB",  // gray-200
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  employeeName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  employeeCompany: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 3,
  },
  eligibilityBadge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: "#16A34A",   // green-600
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  eligibilityBadgeIneligible: {
    backgroundColor: "#DC2626",   // red-600
  },

  // ── Section heading ───────────────────────────────────────
  sectionHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#374151",             // gray-700
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "0.75pt solid #D1D5DB",  // gray-300
  },

  // ── Key-value info rows ───────────────────────────────────
  kvRow: {
    flexDirection: "row",
    paddingVertical: 2.5,
    borderBottom: "0.5pt solid #F3F4F6",  // gray-100
  },
  kvLabel: {
    width: "40%",
    fontSize: 9,
    color: "#6B7280",
  },
  kvValue: {
    width: "60%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },

  // ── Breakdown table ───────────────────────────────────────
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: "0.5pt solid #F3F4F6",
  },
  tableRowHighlight: {
    backgroundColor: "#ECFDF5",   // green-50
    borderTop: "1pt solid #D1FAE5",
    paddingVertical: 4,
  },
  tableRowAmber: {
    backgroundColor: "#FFFBEB",   // amber-50
    paddingVertical: 4,
  },
  tableRowGray: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 3,
  },
  tableLabel: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
  },
  tableLabelBold: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  tableAmount: {
    width: 100,
    fontSize: 9,
    fontFamily: "Helvetica",
    textAlign: "right",
    color: "#374151",
  },
  tableAmountBold: {
    width: 100,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#065F46",             // green-800
  },
  tableAmountStrike: {
    width: 100,
    fontSize: 9,
    textAlign: "right",
    color: "#9CA3AF",             // gray-400
    textDecoration: "line-through",
  },
  tableAmountAmber: {
    width: 100,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#92400E",             // amber-800
  },
  tableIndent: {
    paddingLeft: 12,
  },

  // ── Highlight box (underpayment callout) ──────────────────
  highlightBox: {
    backgroundColor: "#FEF3C7",   // amber-100
    border: "1pt solid #FCD34D",  // amber-300
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  highlightLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400E",
  },
  highlightAmount: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#92400E",
  },

  // ── Tax treatment alert ───────────────────────────────────
  taxAlertExempt: {
    backgroundColor: "#ECFDF5",
    border: "1pt solid #6EE7B7",  // green-300
    borderRadius: 4,
    padding: 8,
    marginVertical: 6,
  },
  taxAlertTaxable: {
    backgroundColor: "#FEF2F2",
    border: "1pt solid #FCA5A5",  // red-300
    borderRadius: 4,
    padding: 8,
    marginVertical: 6,
  },
  taxAlertLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  taxAlertBody: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.5,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 28,
    left: 72,
    right: 72,
    borderTop: "0.5pt solid #E5E7EB",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#9CA3AF",
  },
  disclaimer: {
    fontSize: 7,
    color: "#9CA3AF",
    marginTop: 6,
    lineHeight: 1.4,
  },
});
```

### Component Structure

```tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./RetirementPayPdfStyles";
import { formatMoneyCentavosPdf, formatDatePdf } from "@/lib/pdfFormat";
import type { RetirementOutput } from "@/types/retirement";

interface RetirementPayPdfDocumentProps {
  output: RetirementOutput;
}

export function RetirementPayPdfDocument({ output }: RetirementPayPdfDocumentProps) {
  const isEligible = output.eligibility.status !== "ineligible";
  const generatedDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* ── Document Header ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appName}>RetirePH Calculator</Text>
            <Text style={styles.appTagline}>RA 7641 Retirement Pay Compliance Tool</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Retirement Pay Computation</Text>
            <Text style={styles.docSubtitle}>Generated {generatedDate}</Text>
          </View>
        </View>

        {/* ── Employee Banner ── */}
        <View style={styles.employeeBanner}>
          <View>
            <Text style={styles.employeeName}>{output.employeeName}</Text>
            <Text style={styles.employeeCompany}>{output.companyName}</Text>
          </View>
          <Text style={[
            styles.eligibilityBadge,
            !isEligible && styles.eligibilityBadgeIneligible,
          ]}>
            {isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
          </Text>
        </View>

        {/* ── Employment Information ── */}
        <Text style={styles.sectionHeading}>Employment Information</Text>
        <RetirementPayKvRow label="Employee Name" value={output.employeeName} />
        <RetirementPayKvRow label="Employer" value={output.companyName} />
        <RetirementPayKvRow label="Date of Birth" value={formatDatePdf(output.birthDate)} />
        <RetirementPayKvRow label="Date Hired" value={formatDatePdf(output.hireDate)} />
        <RetirementPayKvRow label="Date Retired" value={formatDatePdf(output.retirementDate)} />
        <RetirementPayKvRow
          label="Age at Retirement"
          value={`${output.ageAtRetirementYears} years, ${output.ageAtRetirementMonths} months`}
        />
        <RetirementPayKvRow label="Retirement Type" value={
          output.retirementType === "optional" ? "Optional (Age 60+)" :
          output.retirementType === "compulsory" ? "Compulsory (Age 65)" :
          "Death — Heirs' Entitlement"
        } />

        {/* ── Service Record ── */}
        <Text style={styles.sectionHeading}>Service Record</Text>
        <RetirementPayKvRow
          label="Actual Service"
          value={`${output.creditedYearsWhole} years, ${output.creditedYearsMonths} months`}
        />
        <RetirementPayKvRow
          label="Credited Years (rounded)"
          value={`${output.creditedYearsRounded} years${output.creditedYearsMonths >= 6 ? " (rounded up)" : ""}`}
        />
        <RetirementPayKvRow
          label="Monthly Salary Basis"
          value={formatMoneyCentavosPdf(output.monthlySalaryCentavos)}
        />
        <RetirementPayKvRow
          label="Daily Rate Divisor"
          value={`÷ ${output.salaryDivisor} days`}
        />
        <RetirementPayKvRow
          label="Daily Rate"
          value={formatMoneyCentavosPdf(output.dailyRateCentavos)}
        />

        {/* ── 22.5-Day Breakdown ── */}
        <Text style={styles.sectionHeading}>
          "One-Half Month Salary" Decomposition (RA 7641, Sec. 1)
        </Text>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>
            Component A: 15 days basic salary
            {"\n"}
            <Text style={{ fontSize: 8, color: "#6B7280" }}>
              {formatMoneyCentavosPdf(output.dailyRateCentavos)} × 15
            </Text>
          </Text>
          <Text style={styles.tableAmount}>
            {formatMoneyCentavosPdf(output.fifteenDaysPayCentavos)}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>
            Component B: Service Incentive Leave — 5 days
            {"\n"}
            <Text style={{ fontSize: 8, color: "#6B7280" }}>
              {formatMoneyCentavosPdf(output.dailyRateCentavos)} × 5
            </Text>
          </Text>
          <Text style={styles.tableAmount}>
            {formatMoneyCentavosPdf(output.silPayCentavos)}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>
            Component C: 1/12 of 13th Month Pay — 2.5 days equivalent
            {"\n"}
            <Text style={{ fontSize: 8, color: "#6B7280" }}>
              {formatMoneyCentavosPdf(output.monthlySalaryCentavos)} ÷ 12
            </Text>
          </Text>
          <Text style={styles.tableAmount}>
            {formatMoneyCentavosPdf(output.thirteenthMonthPayCentavos)}
          </Text>
        </View>
        <View style={[styles.tableRow, styles.tableRowHighlight]}>
          <Text style={styles.tableLabelBold}>
            "One-Half Month Salary" (= 22.5 days total)
          </Text>
          <Text style={styles.tableAmountBold}>
            {formatMoneyCentavosPdf(output.totalHalfMonthCentavos)}
          </Text>
        </View>

        {/* ── Final Computation ── */}
        <Text style={styles.sectionHeading}>Retirement Pay Computation</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Half-Month Salary</Text>
          <Text style={styles.tableAmount}>
            {formatMoneyCentavosPdf(output.totalHalfMonthCentavos)}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>× Credited Years of Service</Text>
          <Text style={styles.tableAmount}>× {output.creditedYearsRounded}</Text>
        </View>
        <View style={[styles.tableRow, styles.tableRowHighlight]}>
          <Text style={styles.tableLabelBold}>
            Statutory Retirement Pay (RA 7641)
          </Text>
          <Text style={styles.tableAmountBold}>
            {formatMoneyCentavosPdf(output.retirementPayCentavos)}
          </Text>
        </View>

        {/* ── 15-Day Comparison ── */}
        <Text style={styles.sectionHeading}>Common Employer Error vs. Correct Computation</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.tableLabel, { color: "#9CA3AF" }]}>
            Erroneous calculation (15 days only — common employer mistake)
          </Text>
          <Text style={styles.tableAmountStrike}>
            {formatMoneyCentavosPdf(output.erroneous15DayPayCentavos)}
          </Text>
        </View>
        <View style={[styles.tableRow, styles.tableRowHighlight]}>
          <Text style={styles.tableLabelBold}>Correct computation (22.5 days per RA 7641)</Text>
          <Text style={styles.tableAmountBold}>
            {formatMoneyCentavosPdf(output.retirementPayCentavos)}
          </Text>
        </View>
        {output.correctMinusErroneousCentavos > 0 && (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightLabel}>Potential underpayment to recover:</Text>
            <Text style={styles.highlightAmount}>
              {formatMoneyCentavosPdf(output.correctMinusErroneousCentavos)}
            </Text>
          </View>
        )}

        {/* ── Tax Treatment ── */}
        <Text style={styles.sectionHeading}>Tax Treatment</Text>
        <View style={
          output.taxTreatment === "fullyExempt" ? styles.taxAlertExempt : styles.taxAlertTaxable
        }>
          <Text style={styles.taxAlertLabel}>
            {output.taxTreatment === "fullyExempt"
              ? "FULLY TAX-EXEMPT — NIRC Sec. 32(B)(6)(a)"
              : output.taxTreatment === "partiallyExempt"
              ? "PARTIALLY TAX-EXEMPT — Consult a tax professional"
              : "SUBJECT TO INCOME TAX — Conditions for exemption not met"}
          </Text>
          <Text style={styles.taxAlertBody}>
            {output.taxTreatment === "fullyExempt"
              ? "All four conditions met: age ≥ 50, service ≥ 10 years, first-time benefit, BIR-approved retirement plan."
              : output.taxTreatment === "partiallyExempt"
              ? "Some conditions for full exemption were not met. Taxable portion: "
                + formatMoneyCentavosPdf(output.taxableAmountCentavos)
                + ". Tax-exempt portion: "
                + formatMoneyCentavosPdf(output.exemptAmountCentavos) + "."
              : "Conditions not met: "
                + (output.ageAtRetirementYears < 50 ? "age < 50; " : "")
                + (output.creditedYearsRounded < 10 ? "service < 10 years; " : "")
                + "or no BIR-approved retirement plan."}
          </Text>
        </View>

        {/* ── Separation Pay Comparison (if applicable) ── */}
        {output.separationPayComparison.separationPayBasis !== "notApplicable" &&
          output.separationPayComparison.separationPayCentavos !== null && (
          <>
            <Text style={styles.sectionHeading}>Separation Pay Comparison</Text>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Retirement Pay (RA 7641)</Text>
              <Text style={styles.tableAmount}>
                {formatMoneyCentavosPdf(output.retirementPayCentavos)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>
                Separation Pay (Labor Code Art. 298 —{" "}
                {output.separationPayComparison.separationPayBasis})
              </Text>
              <Text style={styles.tableAmount}>
                {formatMoneyCentavosPdf(output.separationPayComparison.separationPayCentavos)}
              </Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowHighlight]}>
              <Text style={styles.tableLabelBold}>
                Recommended Benefit (pay-the-higher rule)
              </Text>
              <Text style={styles.tableAmountBold}>
                {formatMoneyCentavosPdf(
                  output.separationPayComparison.recommendedBenefitCentavos ??
                  output.retirementPayCentavos
                )}
              </Text>
            </View>
          </>
        )}

        {/* ── Legal Basis ── */}
        <Text style={styles.sectionHeading}>Legal Basis</Text>
        <Text style={{ fontSize: 8, color: "#374151", lineHeight: 1.6 }}>
          {"\u2022"} Republic Act No. 7641 (The New Retirement Pay Law, December 9, 1992), Section 1
          — "One-half (1/2) month salary" = 15 days + 5 days SIL + 1/12 of 13th month pay.{"\n"}
          {"\u2022"} Presidential Decree No. 442 (Labor Code), Article 302 — Retirement pay
          equivalent to at least one-half (1/2) month salary per year of service.{"\n"}
          {"\u2022"} Elegir v. Philippine Airlines, Inc., G.R. No. 181995 — Supreme Court
          confirmation: "one-half month salary means 22.5 days."{"\n"}
          {"\u2022"} IRR of RA 7641, Rule II, Section 5 — Total effective days: 22.5 days
          (15 + 5 + 2.5).
        </Text>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            RetirePH Calculator — RA 7641 Compliance
          </Text>
          <Text style={styles.footerText}>Generated {generatedDate}</Text>
        </View>
        <Text style={styles.disclaimer}>
          DISCLAIMER: This computation is for informational purposes only and does not constitute
          legal advice. Consult a Philippine labor law attorney for case-specific guidance.
          Final computation may vary based on employer records and applicable CBA provisions.
        </Text>

      </Page>
    </Document>
  );
}

// Reusable KV row sub-component (inline, no separate file needed)
function RetirementPayKvRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}
```

---

## PDF Document 2: Batch Summary — `BatchSummaryPdfDocument`

### File
`apps/retirement-pay/frontend/src/components/pdf/BatchSummaryPdfDocument.tsx`

### Paper Size and Margins
- **Paper**: Letter (8.5" × 11")
- **Orientation**: Portrait
- **Margins**: top 54pt, bottom 54pt, left 54pt, right 54pt
- **Font**: Helvetica
- **Font size**: 9pt body, 7pt table rows (to fit wide table), 11pt headings

### Trigger

```typescript
// apps/retirement-pay/frontend/src/components/batch/BatchExportMenu.tsx

async function exportSummaryPdf(output: BatchOutput): Promise<void> {
  const filename = `batch-summary-${sanitizeFilename(output.batchName)}-${
    new Date().toISOString().slice(0, 10)
  }.pdf`;
  // Toast while generating
  const id = "pdf-batch-summary";
  toast({ id, title: "Generating batch summary PDF..." });
  try {
    await generateAndDownloadPdf(
      <BatchSummaryPdfDocument output={output} />,
      filename,
    );
    toast({ id, title: "Batch summary PDF downloaded", variant: "default" });
  } catch (err) {
    toast({ id, title: "PDF generation failed", description: String(err), variant: "destructive" });
  }
}
```

### StyleSheet (additions to shared styles)

```typescript
const batchStyles = StyleSheet.create({
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    border: "1pt solid #E5E7EB",
    borderRadius: 4,
    padding: 8,
  },
  summaryTileBlue: {
    backgroundColor: "#EFF6FF",
    border: "1pt solid #BFDBFE",
  },
  summaryTileAmber: {
    backgroundColor: "#FFFBEB",
    border: "1pt solid #FDE68A",
  },
  summaryTileLabel: {
    fontSize: 7,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryTileValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  summaryTileValueBlue: {
    color: "#1E3A5F",
  },
  summaryTileValueAmber: {
    color: "#92400E",
  },
  summaryTileSub: {
    fontSize: 7,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // Batch table
  batchTableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottom: "1pt solid #D1D5DB",
  },
  batchTableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    textTransform: "uppercase",
  },
  batchTableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottom: "0.5pt solid #F3F4F6",
  },
  batchTableRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  batchTableRowError: {
    backgroundColor: "#FEF2F2",
  },
  batchTableRowIneligible: {
    backgroundColor: "#FFF7ED",
  },
  batchCell: { fontSize: 8, color: "#374151" },
  batchCellBold: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111827" },
  batchCellMono: { fontSize: 8, color: "#374151", textAlign: "right" },
  batchCellMonoBold: { fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#065F46" },
  batchCellAmber: { fontSize: 8, textAlign: "right", color: "#92400E" },
  batchCellGray: { fontSize: 8, textAlign: "right", color: "#9CA3AF" },
  batchCellError: { fontSize: 8, color: "#DC2626" },

  // Column widths for batch table (total ~468pt usable at 1" margins)
  colNum: { width: 22 },
  colName: { width: 100 },
  colStatus: { width: 52 },
  colYears: { width: 30 },
  colSalary: { width: 72 },
  colRetPay: { width: 78 },
  col15Day: { width: 72 },
  colUnderpay: { width: 60 },
});
```

### Component Structure

```tsx
export function BatchSummaryPdfDocument({ output }: { output: BatchOutput }) {
  const generatedDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Split eligible rows into pages of 30 rows each
  const eligibleRows = output.rows.filter(
    (r) => "Ok" in r.result && r.result.Ok.eligibility.status !== "ineligible"
  );
  const errorRows = output.rows.filter((r) => "Err" in r.result);
  const ineligibleRows = output.rows.filter(
    (r) => "Ok" in r.result && r.result.Ok.eligibility.status === "ineligible"
  );
  const allDisplayRows = [...eligibleRows, ...ineligibleRows, ...errorRows];

  return (
    <Document>
      {/* ── Page 1: Summary ── */}
      <Page size="LETTER" style={{ ...sharedStyles.page, paddingLeft: 54, paddingRight: 54 }}>
        {/* Header */}
        <View style={sharedStyles.headerRow}>
          <View>
            <Text style={sharedStyles.appName}>RetirePH Calculator</Text>
            <Text style={sharedStyles.appTagline}>RA 7641 Retirement Pay Compliance Tool</Text>
          </View>
          <View>
            <Text style={sharedStyles.docTitle}>Batch Computation Summary</Text>
            <Text style={sharedStyles.docSubtitle}>Generated {generatedDate}</Text>
          </View>
        </View>

        {/* Batch metadata */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{output.batchName}</Text>
          <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 2 }}>
            {output.totalEmployees.toLocaleString()} employees processed ·
            Computed {formatDatePdf(output.computationDate)}
          </Text>
        </View>

        {/* Summary tiles */}
        <View style={batchStyles.summaryGrid}>
          <View style={batchStyles.summaryTile}>
            <Text style={batchStyles.summaryTileLabel}>Total Employees</Text>
            <Text style={batchStyles.summaryTileValue}>{output.totalEmployees}</Text>
            <Text style={batchStyles.summaryTileSub}>
              {output.successCount} eligible · {output.errorCount} errors
            </Text>
          </View>
          <View style={[batchStyles.summaryTile, batchStyles.summaryTileBlue]}>
            <Text style={batchStyles.summaryTileLabel}>Total Retirement Obligation</Text>
            <Text style={[batchStyles.summaryTileValue, batchStyles.summaryTileValueBlue]}>
              {formatMoneyCentavosPdf(output.totalRetirementPayCentavos)}
            </Text>
            <Text style={batchStyles.summaryTileSub}>RA 7641 (22.5-day formula)</Text>
          </View>
          <View style={[batchStyles.summaryTile, batchStyles.summaryTileAmber]}>
            <Text style={batchStyles.summaryTileLabel}>Total Underpayment vs 15-Day</Text>
            <Text style={[batchStyles.summaryTileValue, batchStyles.summaryTileValueAmber]}>
              {formatMoneyCentavosPdf(output.totalUnderpaymentCentavos)}
            </Text>
            <Text style={batchStyles.summaryTileSub}>
              vs {formatMoneyCentavosPdf(output.totalErroneousPayCentavos)} at 15 days
            </Text>
          </View>
        </View>

        {/* Employee table — paginated via wrap={true} */}
        <Text style={sharedStyles.sectionHeading}>Employee Detail</Text>
        {/* Table header */}
        <View style={batchStyles.batchTableHeader}>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.colNum]}>#</Text>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.colName]}>Employee</Text>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.colStatus]}>Status</Text>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.colYears]}>Yrs</Text>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.colSalary, { textAlign: "right" }]}>Monthly Salary</Text>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.colRetPay, { textAlign: "right" }]}>Ret. Pay (22.5d)</Text>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.col15Day, { textAlign: "right" }]}>15-Day Amount</Text>
          <Text style={[batchStyles.batchTableHeaderCell, batchStyles.colUnderpay, { textAlign: "right" }]}>Underpayment</Text>
        </View>

        {/* Table rows — @react-pdf/renderer wraps automatically to next page */}
        {allDisplayRows.map((row, index) => {
          const isError = "Err" in row.result;
          const isIneligible = !isError && row.result.Ok.eligibility.status === "ineligible";
          const rowStyle = isError
            ? batchStyles.batchTableRowError
            : isIneligible
            ? batchStyles.batchTableRowIneligible
            : index % 2 === 1 ? batchStyles.batchTableRowAlt : {};

          return (
            <View key={row.rowIndex} style={[batchStyles.batchTableRow, rowStyle]} wrap={false}>
              <Text style={[batchStyles.batchCell, batchStyles.colNum, { color: "#9CA3AF" }]}>
                {row.rowIndex + 1}
              </Text>
              <Text style={[batchStyles.batchCellBold, batchStyles.colName]}>
                {row.employeeName}
              </Text>
              <Text style={[
                isError ? batchStyles.batchCellError : batchStyles.batchCell,
                batchStyles.colStatus,
              ]}>
                {isError ? "ERROR" : isIneligible ? "Ineligible" : "Eligible"}
              </Text>
              {isError ? (
                <Text style={[batchStyles.batchCellError, { flex: 1 }]}>
                  {row.result.Err.message}
                </Text>
              ) : (
                <>
                  <Text style={[batchStyles.batchCell, batchStyles.colYears, { textAlign: "center" }]}>
                    {isIneligible ? "—" : String(row.result.Ok.creditedYearsRounded)}
                  </Text>
                  <Text style={[batchStyles.batchCellMono, batchStyles.colSalary]}>
                    {isIneligible ? "—" : formatMoneyCentavosPdf(row.result.Ok.monthlySalaryCentavos)}
                  </Text>
                  <Text style={[
                    isIneligible ? batchStyles.batchCellGray : batchStyles.batchCellMonoBold,
                    batchStyles.colRetPay,
                  ]}>
                    {isIneligible ? "—" : formatMoneyCentavosPdf(row.result.Ok.retirementPayCentavos)}
                  </Text>
                  <Text style={[batchStyles.batchCellGray, batchStyles.col15Day]}>
                    {isIneligible ? "—" : formatMoneyCentavosPdf(row.result.Ok.erroneous15DayPayCentavos)}
                  </Text>
                  <Text style={[batchStyles.batchCellAmber, batchStyles.colUnderpay]}>
                    {isIneligible ? "—" : formatMoneyCentavosPdf(row.result.Ok.correctMinusErroneousCentavos)}
                  </Text>
                </>
              )}
            </View>
          );
        })}

        {/* Totals row */}
        <View style={[batchStyles.batchTableRow, { backgroundColor: "#F0FDF4", borderTop: "1.5pt solid #BBF7D0" }]}>
          <Text style={[batchStyles.batchCellBold, { width: 174 }]}>TOTALS ({output.successCount} eligible employees)</Text>
          <Text style={[batchStyles.batchCell, batchStyles.colYears]} />
          <Text style={[batchStyles.batchCell, batchStyles.colSalary]} />
          <Text style={[batchStyles.batchCellMonoBold, batchStyles.colRetPay]}>
            {formatMoneyCentavosPdf(output.totalRetirementPayCentavos)}
          </Text>
          <Text style={[batchStyles.batchCellGray, batchStyles.col15Day]}>
            {formatMoneyCentavosPdf(output.totalErroneousPayCentavos)}
          </Text>
          <Text style={[batchStyles.batchCellAmber, batchStyles.colUnderpay]}>
            {formatMoneyCentavosPdf(output.totalUnderpaymentCentavos)}
          </Text>
        </View>

        {/* Footer */}
        <View style={sharedStyles.footer} fixed>
          <Text style={sharedStyles.footerText}>RetirePH Calculator — Batch Summary</Text>
          <Text
            style={sharedStyles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
        </View>
        <Text style={sharedStyles.disclaimer}>
          DISCLAIMER: This computation is for informational purposes only and does not constitute legal advice.
        </Text>
      </Page>
    </Document>
  );
}
```

---

## PDF Document 3: NLRC Worksheet (Single) — `NlrcWorksheetPdfDocument`

### File
`apps/retirement-pay/frontend/src/components/nlrc/NlrcWorksheetPdfDocument.tsx`

### Paper Size and Margins
- **Paper**: LEGAL (8.5" × 13")
- **Orientation**: Portrait
- **Margins**: top 72pt (1.0"), bottom 72pt, left 90pt (1.25"), right 90pt
- **Font**: Times-Roman / Times-Bold / Courier (monospace for amounts)
- **Font size**: 11pt body, 12pt section headings, 14pt document title

This paper size and font choice follows Philippine court document conventions.

### StyleSheet

```typescript
const nlrcStyles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#111827",
    paddingTop: 72,
    paddingBottom: 72,
    paddingLeft: 90,
    paddingRight: 90,
  },

  // ── Court header ──────────────────────────────────────────
  courtHeader: {
    textAlign: "center",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottom: "1.5pt solid #111827",
  },
  republic: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#6B7280",
  },
  courtName: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#6B7280",
    marginBottom: 8,
  },
  docTitleNlrc: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  docSubtitleNlrc: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    fontSize: 10,
  },
  caseNumberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 10,
  },
  exhibitBadge: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    border: "1pt solid #374151",
    paddingVertical: 2,
    paddingHorizontal: 8,
  },

  // ── Section heading (NLRC style) ──────────────────────────
  nlrcSectionHeading: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 2,
    borderBottom: "1pt solid #6B7280",
  },
  citation: {
    fontSize: 8,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 6,
  },

  // ── Table (NLRC style) ────────────────────────────────────
  nlrcTableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #D1D5DB",
    paddingVertical: 4,
  },
  nlrcTableRowTotal: {
    flexDirection: "row",
    borderTop: "1.5pt solid #111827",
    borderBottom: "1pt solid #111827",
    backgroundColor: "#F9FAFB",
    paddingVertical: 5,
  },
  nlrcTableLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#374151",
  },
  nlrcTableLabelBold: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#111827",
  },
  nlrcTableSub: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 1,
  },
  nlrcTableAmount: {
    width: 110,
    fontFamily: "Courier",
    fontSize: 10,
    textAlign: "right",
    color: "#374151",
  },
  nlrcTableAmountBold: {
    width: 110,
    fontFamily: "Courier-Bold",
    fontSize: 11,
    textAlign: "right",
    color: "#111827",
  },
  nlrcTableAmountStrike: {
    width: 110,
    fontFamily: "Courier",
    fontSize: 10,
    textAlign: "right",
    color: "#9CA3AF",
    textDecoration: "line-through",
  },

  // ── Underpayment error table ──────────────────────────────
  errorTableGreen: {
    backgroundColor: "#F0FDF4",
    paddingVertical: 5,
    flexDirection: "row",
    borderTop: "1pt solid #BBF7D0",
    borderBottom: "1pt solid #BBF7D0",
  },
  errorTableRed: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 4,
    flexDirection: "row",
    borderBottom: "0.5pt solid #FECACA",
  },
  errorAmountRed: {
    width: 110,
    fontFamily: "Courier-Bold",
    fontSize: 11,
    textAlign: "right",
    color: "#DC2626",
  },
  errorAmountGreen: {
    width: 110,
    fontFamily: "Courier-Bold",
    fontSize: 11,
    textAlign: "right",
    color: "#065F46",
  },

  // ── Certification block ───────────────────────────────────
  certificationBlock: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: "1.5pt solid #111827",
  },
  certParagraph: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 16,
  },
  signatureGrid: {
    flexDirection: "row",
    gap: 40,
    marginTop: 16,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottom: "1pt solid #374151",
    marginBottom: 4,
    paddingTop: 24,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6B7280",
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Times-Bold",
  },
  attorneyBlock: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.6,
  },

  // ── Legal citations ───────────────────────────────────────
  legalList: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 3,
    color: "#374151",
  },

  // ── Footer ────────────────────────────────────────────────
  nlrcFooter: {
    position: "absolute",
    bottom: 36,
    left: 90,
    right: 90,
    borderTop: "0.5pt solid #D1D5DB",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nlrcFooterText: {
    fontSize: 7,
    color: "#9CA3AF",
    fontFamily: "Times-Roman",
  },
  nlrcDisclaimer: {
    fontSize: 8,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 8,
    lineHeight: 1.4,
  },
});
```

### Component Structure

```tsx
export function NlrcWorksheetPdfDocument({ data }: { data: NlrcWorksheetOutput }) {
  const isDemandMode = data.caseNumber === null && data.dateFiled === null;

  return (
    <Document>
      <Page size="LEGAL" style={nlrcStyles.page}>

        {/* ── Court Header ── */}
        <View style={nlrcStyles.courtHeader}>
          <Text style={nlrcStyles.republic}>Republic of the Philippines</Text>
          <Text style={nlrcStyles.courtName}>
            {data.regionalBranch ?? "National Labor Relations Commission"}
          </Text>
          <Text style={nlrcStyles.docTitleNlrc}>Statement of Computation of Retirement Pay</Text>
          <Text style={nlrcStyles.docSubtitleNlrc}>
            Pursuant to Republic Act No. 7641 and Article 302 of the Labor Code of the Philippines
          </Text>
          {!isDemandMode && (
            <View style={nlrcStyles.caseNumberRow}>
              <Text>
                NLRC Case No.: {data.caseNumber ?? "TO BE ASSIGNED"}
              </Text>
              <Text style={nlrcStyles.exhibitBadge}>EXHIBIT "{data.exhibitLabel}"</Text>
            </View>
          )}
          <View style={nlrcStyles.partiesRow}>
            <Text>Complainant: {data.complainantFullName}</Text>
            <Text>Respondent: {data.respondentName}</Text>
          </View>
        </View>

        {/* ── Section A: Employee Information ── */}
        <Text style={nlrcStyles.nlrcSectionHeading}>I. Employee Information</Text>
        <NlrcPdfKvRow label="Employee Name" value={data.complainantFullName} />
        <NlrcPdfKvRow label="Position / Job Title" value={data.complainantPosition} />
        <NlrcPdfKvRow label="Employer / Respondent" value={data.respondentName} />
        <NlrcPdfKvRow label="Date of Birth" value={data.birthDateFormatted} />
        <NlrcPdfKvRow label="Date of Hire" value={data.hireDateFormatted} />
        <NlrcPdfKvRow label="Date of Retirement" value={data.retirementDateFormatted} />
        <NlrcPdfKvRow
          label="Age at Retirement"
          value={`${data.ageAtRetirement} years`}
        />

        {/* ── Section B: Salary Basis ── */}
        <Text style={nlrcStyles.nlrcSectionHeading}>II. Salary Basis</Text>
        <NlrcPdfKvRow
          label="Monthly Basic Salary"
          value={formatMoneyCentavosPdf(data.monthlySalaryCentavos)}
        />
        <NlrcPdfKvRow
          label="Salary Divisor"
          value={`${data.salaryDivisor} working days per month`}
        />
        <NlrcPdfKvRow
          label="Daily Rate"
          value={formatMoneyCentavosPdf(data.dailyRateCentavos)}
        />

        {/* ── Section C: 22.5-Day Decomposition ── */}
        <Text style={nlrcStyles.nlrcSectionHeading}>
          III. Decomposition of "One-Half (1/2) Month Salary"
        </Text>
        <Text style={nlrcStyles.citation}>
          RA 7641, Section 1; IRR Rule II, Section 5; Elegir v. Philippine Airlines, Inc.,
          G.R. No. 181995
        </Text>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>
            Component A: Fifteen (15) Days Basic Salary{"\n"}
            <Text style={nlrcStyles.nlrcTableSub}>
              {formatMoneyCentavosPdf(data.dailyRateCentavos)} daily rate × 15 days
            </Text>
          </Text>
          <Text style={nlrcStyles.nlrcTableAmount}>
            {formatMoneyCentavosPdf(data.componentACentavos)}
          </Text>
        </View>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>
            Component B: Service Incentive Leave (SIL) — Five (5) Days{"\n"}
            <Text style={nlrcStyles.nlrcTableSub}>
              {formatMoneyCentavosPdf(data.dailyRateCentavos)} daily rate × 5 days
            </Text>
          </Text>
          <Text style={nlrcStyles.nlrcTableAmount}>
            {formatMoneyCentavosPdf(data.componentBCentavos)}
          </Text>
        </View>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>
            Component C: 1/12 of 13th Month Pay — 2.5 days equivalent{"\n"}
            <Text style={nlrcStyles.nlrcTableSub}>
              {formatMoneyCentavosPdf(data.monthlySalaryCentavos)} monthly salary ÷ 12
            </Text>
          </Text>
          <Text style={nlrcStyles.nlrcTableAmount}>
            {formatMoneyCentavosPdf(data.componentCCentavos)}
          </Text>
        </View>
        <View style={nlrcStyles.nlrcTableRowTotal}>
          <Text style={nlrcStyles.nlrcTableLabelBold}>
            "One-Half Month Salary" (22.5 days total)
          </Text>
          <Text style={nlrcStyles.nlrcTableAmountBold}>
            {formatMoneyCentavosPdf(data.halfMonthSalaryCentavos)}
          </Text>
        </View>

        {/* ── Section D: Credited Years ── */}
        <Text style={nlrcStyles.nlrcSectionHeading}>IV. Credited Years of Service</Text>
        <NlrcPdfKvRow
          label="Actual Service"
          value={`${data.fullYearsService} years, ${data.partialMonths} months`}
        />
        <NlrcPdfKvRow
          label="Rounding Rule Applied"
          value={data.roundingApplied
            ? `Partial year of ${data.partialMonths} months ≥ 6 months → rounded up`
            : data.partialMonths > 0
            ? `Partial year of ${data.partialMonths} months < 6 months → not counted`
            : "No partial year"}
        />
        <NlrcPdfKvRow
          label="Credited Years"
          value={`${data.creditedYears} years`}
        />

        {/* ── Section E: Retirement Pay Total ── */}
        <Text style={nlrcStyles.nlrcSectionHeading}>V. Retirement Pay Computation</Text>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>"One-Half Month Salary" (per III above)</Text>
          <Text style={nlrcStyles.nlrcTableAmount}>
            {formatMoneyCentavosPdf(data.halfMonthSalaryCentavos)}
          </Text>
        </View>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>× Credited Years of Service</Text>
          <Text style={nlrcStyles.nlrcTableAmount}>× {data.creditedYears}</Text>
        </View>
        <View style={nlrcStyles.nlrcTableRowTotal}>
          <Text style={nlrcStyles.nlrcTableLabelBold}>Total Retirement Pay (RA 7641)</Text>
          <Text style={nlrcStyles.nlrcTableAmountBold}>
            {formatMoneyCentavosPdf(data.retirementPayCentavos)}
          </Text>
        </View>

        {/* ── Section F: Employer Error Comparison (conditional) ── */}
        {data.includeEmployerComparison && (
          <>
            <Text style={nlrcStyles.nlrcSectionHeading}>
              VI. Common Employer Error vs. Correct Computation
            </Text>
            <View style={nlrcStyles.nlrcTableRow}>
              <Text style={[nlrcStyles.nlrcTableLabel, { color: "#9CA3AF" }]}>
                Erroneous computation (15 days only — common employer error)
              </Text>
              <Text style={nlrcStyles.nlrcTableAmountStrike}>
                {formatMoneyCentavosPdf(data.fifteenDayTotalCentavos)}
              </Text>
            </View>
            <View style={nlrcStyles.errorTableGreen}>
              <Text style={nlrcStyles.nlrcTableLabelBold}>
                Correct computation per RA 7641 (22.5 days)
              </Text>
              <Text style={nlrcStyles.errorAmountGreen}>
                {formatMoneyCentavosPdf(data.retirementPayCentavos)}
              </Text>
            </View>
            <View style={nlrcStyles.errorTableRed}>
              <Text style={[nlrcStyles.nlrcTableLabelBold, { color: "#DC2626" }]}>
                Underpayment (shortfall of 33%)
              </Text>
              <Text style={nlrcStyles.errorAmountRed}>
                {formatMoneyCentavosPdf(data.underpaymentCentavos)}
              </Text>
            </View>
          </>
        )}

        {/* ── Section G: Prior Payment (conditional) ── */}
        {data.amountAlreadyPaidCentavos !== null && (
          <>
            <Text style={nlrcStyles.nlrcSectionHeading}>VII. Prior Employer Payment</Text>
            <View style={nlrcStyles.nlrcTableRow}>
              <Text style={nlrcStyles.nlrcTableLabel}>Total Retirement Pay (RA 7641)</Text>
              <Text style={nlrcStyles.nlrcTableAmount}>
                {formatMoneyCentavosPdf(data.retirementPayCentavos)}
              </Text>
            </View>
            <View style={nlrcStyles.nlrcTableRow}>
              <Text style={nlrcStyles.nlrcTableLabel}>Less: Amount Already Paid by Employer</Text>
              <Text style={nlrcStyles.nlrcTableAmount}>
                ({formatMoneyCentavosPdf(data.amountAlreadyPaidCentavos)})
              </Text>
            </View>
            <View style={nlrcStyles.nlrcTableRowTotal}>
              <Text style={nlrcStyles.nlrcTableLabelBold}>Balance Due</Text>
              <Text style={nlrcStyles.nlrcTableAmountBold}>
                {formatMoneyCentavosPdf(data.balanceDueCentavos)}
              </Text>
            </View>
          </>
        )}

        {/* ── Section H: Interest (conditional) ── */}
        {data.includeInterestSection && data.interestCentavos !== null && (
          <>
            <Text style={nlrcStyles.nlrcSectionHeading}>
              {(data.amountAlreadyPaidCentavos !== null ? "VIII" : "VII")}. Legal Interest
              (Nacar v. Gallery Frames — 6% per annum)
            </Text>
            <NlrcPdfKvRow
              label="Date of Demand / Filing"
              value={data.dateOfDemandFormatted ?? ""}
            />
            <NlrcPdfKvRow
              label="Date of Computation"
              value={data.dateOfComputationFormatted ?? ""}
            />
            <NlrcPdfKvRow
              label="Days Elapsed"
              value={`${data.daysElapsed ?? 0} days`}
            />
            <View style={nlrcStyles.nlrcTableRow}>
              <Text style={nlrcStyles.nlrcTableLabel}>Balance Due</Text>
              <Text style={nlrcStyles.nlrcTableAmount}>
                {formatMoneyCentavosPdf(data.balanceDueCentavos)}
              </Text>
            </View>
            <View style={nlrcStyles.nlrcTableRow}>
              <Text style={nlrcStyles.nlrcTableLabel}>
                Legal Interest (6% per annum × {data.daysElapsed ?? 0} days ÷ 365)
              </Text>
              <Text style={nlrcStyles.nlrcTableAmount}>
                {formatMoneyCentavosPdf(data.interestCentavos)}
              </Text>
            </View>
            <View style={nlrcStyles.nlrcTableRowTotal}>
              <Text style={nlrcStyles.nlrcTableLabelBold}>
                Total Due with Interest
              </Text>
              <Text style={nlrcStyles.nlrcTableAmountBold}>
                {formatMoneyCentavosPdf(data.totalDueWithInterestCentavos ?? 0)}
              </Text>
            </View>
          </>
        )}

        {/* ── Tax Treatment (conditional) ── */}
        {data.includeTaxSection && (
          <>
            <Text style={nlrcStyles.nlrcSectionHeading}>Tax Treatment</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.6, color: "#374151" }}>
              {data.taxTreatmentNarrative}
            </Text>
          </>
        )}

        {/* ── Legal Citations ── */}
        <Text style={nlrcStyles.nlrcSectionHeading}>Legal Basis</Text>
        <Text style={nlrcStyles.legalList}>
          1. Republic Act No. 7641 (The New Retirement Pay Law, December 9, 1992), Section 1,
          amending Article 287 (now Art. 302) of the Labor Code. Defines "one-half (1/2) month
          salary" as 15 days + 5 days SIL + 1/12 of 13th month pay.
        </Text>
        <Text style={nlrcStyles.legalList}>
          2. Presidential Decree No. 442 (Labor Code of the Philippines), Article 302 —
          Retirement pay equivalent to at least one-half (1/2) month salary for every year
          of service.
        </Text>
        <Text style={nlrcStyles.legalList}>
          3. Elegir v. Philippine Airlines, Inc., G.R. No. 181995 — Supreme Court confirmation:
          "one-half (1/2) month salary means 22.5 days."
        </Text>
        <Text style={nlrcStyles.legalList}>
          4. Implementing Rules and Regulations of RA 7641, Rule II, Section 5 —
          "Total effective days: 22.5 days (15 + 5 + 2.5)."
        </Text>
        {data.includeInterestSection && (
          <Text style={nlrcStyles.legalList}>
            5. Nacar v. Gallery Frames, G.R. No. 189871 (August 13, 2013) — Legal interest
            at 6% per annum on monetary judgments and quasi-judicial awards.
          </Text>
        )}

        {/* ── Certification ── */}
        <View style={nlrcStyles.certificationBlock}>
          <Text style={{ fontSize: 10, fontFamily: "Times-Bold", marginBottom: 8, textTransform: "uppercase" }}>
            {isDemandMode ? "Demand for Payment" : "Certification"}
          </Text>
          <Text style={nlrcStyles.certParagraph}>
            {isDemandMode
              ? `On behalf of ${data.complainantFullName}, demand is hereby made upon `
                + `${data.respondentName} for payment of the above-computed retirement pay `
                + `in the amount of ${formatMoneyCentavosPdf(data.balanceDueCentavos)} within `
                + `five (5) days from receipt hereof, otherwise appropriate legal action will `
                + `be filed without further notice.`
              : `I, ${data.complainantFullName}, of legal age, after having been duly sworn in `
                + `accordance with law, depose and state that the foregoing computation is true `
                + `and correct to the best of my knowledge and belief, based on actual employment `
                + `records.`}
          </Text>
          <View style={nlrcStyles.signatureGrid}>
            <View style={nlrcStyles.signatureBlock}>
              <View style={nlrcStyles.signatureLine} />
              <Text style={nlrcStyles.signatureLabel}>Complainant / Authorized Representative</Text>
              <Text style={nlrcStyles.signatureName}>{data.complainantFullName}</Text>
              <Text style={[nlrcStyles.signatureLabel, { marginTop: 6 }]}>Date: {data.datePrepared}</Text>
            </View>
            {data.preparedByName && (
              <View style={nlrcStyles.attorneyBlock}>
                <Text style={{ fontFamily: "Times-Bold", marginBottom: 4 }}>Prepared by:</Text>
                <Text>{data.preparedByName}</Text>
                {data.attorneyRollNo && <Text>Roll No.: {data.attorneyRollNo}</Text>}
                {data.attorneyPtrNo && <Text>{data.attorneyPtrNo}</Text>}
                {data.attorneyIbpNo && <Text>{data.attorneyIbpNo}</Text>}
                {data.attorneyMcleNo && <Text>{data.attorneyMcleNo}</Text>}
                {data.lawFirmName && (
                  <Text style={{ fontFamily: "Times-Bold", marginTop: 6 }}>{data.lawFirmName}</Text>
                )}
                {data.lawFirmAddress && <Text>{data.lawFirmAddress}</Text>}
              </View>
            )}
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={nlrcStyles.nlrcFooter} fixed>
          <Text style={nlrcStyles.nlrcFooterText}>
            Statement of Computation of Retirement Pay — RA 7641
          </Text>
          <Text style={nlrcStyles.nlrcFooterText}>
            {data.complainantFullName} v. {data.respondentName}
          </Text>
        </View>
        <Text style={nlrcStyles.nlrcDisclaimer}>
          Prepared using RetirePH Calculator. This document is for informational purposes only
          and does not constitute legal advice. Verify all figures against official employment records.
        </Text>

      </Page>
    </Document>
  );
}

// NLRC KV row helper
function NlrcPdfKvRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", paddingVertical: 2.5, borderBottom: "0.5pt solid #F3F4F6" }}>
      <Text style={{ width: "42%", fontSize: 9, color: "#6B7280", fontFamily: "Times-Roman" }}>
        {label}
      </Text>
      <Text style={{ width: "58%", fontSize: 10, fontFamily: "Times-Bold", color: "#111827" }}>
        {value}
      </Text>
    </View>
  );
}
```

---

## PDF Document 4: Batch NLRC — `NlrcBatchPdfDocument`

### File
`apps/retirement-pay/frontend/src/components/nlrc/NlrcBatchPdfDocument.tsx`

### Design
One LEGAL-size page per employee (using the existing `NlrcWorksheetPdfDocument` for each),
preceded by a cover page with batch metadata and aggregate totals.

### Trigger

```typescript
// apps/retirement-pay/frontend/src/components/batch/BatchExportMenu.tsx

async function exportNlrcBatchPdf(output: BatchOutput): Promise<void> {
  const filename = `nlrc-batch-${sanitizeFilename(output.batchName)}-${
    new Date().toISOString().slice(0, 10)
  }.pdf`;
  const id = "pdf-nlrc-batch";
  toast({ id, title: "Generating NLRC batch PDF…", description: "This may take a moment." });
  try {
    // Build NlrcWorksheetOutput for each eligible employee from BatchOutput
    // (uses data already computed in BatchOutput rows)
    const worksheets = buildNlrcWorksheetsFromBatch(output);
    await generateAndDownloadPdf(
      <NlrcBatchPdfDocument batchName={output.batchName} worksheets={worksheets} />,
      filename,
    );
    toast({ id, title: "NLRC batch PDF downloaded", variant: "default" });
  } catch (err) {
    toast({ id, title: "PDF generation failed", description: String(err), variant: "destructive" });
  }
}
```

### `buildNlrcWorksheetsFromBatch`

```typescript
// apps/retirement-pay/frontend/src/lib/nlrcBatchBuilder.ts

import type { BatchOutput, BatchRowResult } from "@/types/batch";
import type { NlrcWorksheetOutput } from "@/types/nlrc";

export function buildNlrcWorksheetsFromBatch(output: BatchOutput): NlrcWorksheetOutput[] {
  const eligibleRows = output.rows.filter(
    (r): r is BatchRowResult & { result: { Ok: RetirementOutput } } =>
      "Ok" in r.result && r.result.Ok.eligibility.status !== "ineligible"
  );

  return eligibleRows.map((row): NlrcWorksheetOutput => {
    const ok = row.result.Ok;
    return {
      complainantFullName: row.employeeName,
      complainantPosition: row.position ?? "",
      respondentName: output.batchName,  // employer name from batch metadata
      exhibitLabel: "A",
      caseNumber: null,
      regionalBranch: null,
      dateFiled: null,
      datePrepared: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
      birthDateFormatted: ok.birthDateFormatted,
      hireDateFormatted: ok.hireDateFormatted,
      retirementDateFormatted: ok.retirementDateFormatted,
      ageAtRetirement: ok.ageAtRetirementYears,
      fullYearsService: ok.creditedYearsWhole,
      partialMonths: ok.creditedYearsMonths,
      roundingApplied: ok.creditedYearsMonths >= 6,
      creditedYears: ok.creditedYearsRounded,
      monthlySalaryCentavos: ok.monthlySalaryCentavos,
      dailyRateCentavos: ok.dailyRateCentavos,
      salaryDivisor: ok.salaryDivisor,
      componentACentavos: ok.fifteenDaysPayCentavos,
      componentBCentavos: ok.silPayCentavos,
      componentCCentavos: ok.thirteenthMonthPayCentavos,
      halfMonthSalaryCentavos: ok.totalHalfMonthCentavos,
      retirementPayCentavos: ok.retirementPayCentavos,
      fifteenDayDailyCentavos: ok.dailyRateCentavos,
      fifteenDayPerYearCentavos: ok.dailyRateCentavos * 15,
      fifteenDayTotalCentavos: ok.erroneous15DayPayCentavos,
      underpaymentCentavos: ok.correctMinusErroneousCentavos,
      amountAlreadyPaidCentavos: null,
      balanceDueCentavos: ok.retirementPayCentavos,
      includeInterestSection: false,
      dateOfDemandFormatted: null,
      dateOfComputationFormatted: null,
      daysElapsed: null,
      interestCentavos: null,
      totalDueWithInterestCentavos: null,
      taxTreatment: ok.taxTreatment,
      taxTreatmentNarrative: ok.taxTreatmentNarrative,
      includeEmployerComparison: true,
      includeTaxSection: true,
      preparedByName: null,
      attorneyRollNo: null,
      attorneyPtrNo: null,
      attorneyIbpNo: null,
      attorneyMcleNo: null,
      lawFirmName: null,
      lawFirmAddress: null,
    };
  });
}
```

### Component Structure

```tsx
export function NlrcBatchPdfDocument({
  batchName,
  worksheets,
}: {
  batchName: string;
  worksheets: NlrcWorksheetOutput[];
}) {
  const generatedDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const totalRetirementPay = worksheets.reduce(
    (sum, w) => sum + w.retirementPayCentavos, 0
  );
  const totalUnderpayment = worksheets.reduce(
    (sum, w) => sum + w.underpaymentCentavos, 0
  );

  return (
    <Document>
      {/* ── Cover Page ── */}
      <Page size="LEGAL" style={nlrcStyles.page}>
        <View style={nlrcStyles.courtHeader}>
          <Text style={nlrcStyles.republic}>Republic of the Philippines</Text>
          <Text style={nlrcStyles.courtName}>National Labor Relations Commission</Text>
          <Text style={nlrcStyles.docTitleNlrc}>
            Batch Statement of Computation of Retirement Pay
          </Text>
          <Text style={nlrcStyles.docSubtitleNlrc}>
            Pursuant to Republic Act No. 7641 and Article 302 of the Labor Code
          </Text>
        </View>

        {/* Batch metadata */}
        <Text style={{ fontSize: 12, fontFamily: "Times-Bold", marginBottom: 6 }}>
          {batchName}
        </Text>
        <Text style={{ fontSize: 10, color: "#6B7280", marginBottom: 20 }}>
          Generated: {generatedDate} · {worksheets.length} eligible employees
        </Text>

        {/* Aggregate totals */}
        <Text style={nlrcStyles.nlrcSectionHeading}>Aggregate Summary</Text>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>Number of eligible employees included</Text>
          <Text style={nlrcStyles.nlrcTableAmount}>{worksheets.length}</Text>
        </View>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>
            Total Retirement Pay Obligation (RA 7641, 22.5 days)
          </Text>
          <Text style={nlrcStyles.nlrcTableAmountBold}>
            {formatMoneyCentavosPdf(totalRetirementPay)}
          </Text>
        </View>
        <View style={nlrcStyles.nlrcTableRow}>
          <Text style={nlrcStyles.nlrcTableLabel}>
            Total Underpayment vs. 15-day erroneous formula
          </Text>
          <Text style={[nlrcStyles.nlrcTableAmount, { color: "#DC2626" }]}>
            {formatMoneyCentavosPdf(totalUnderpayment)}
          </Text>
        </View>

        {/* Employee index */}
        <Text style={[nlrcStyles.nlrcSectionHeading, { marginTop: 20 }]}>
          Index of Employee Worksheets
        </Text>
        {worksheets.map((w, i) => (
          <View key={i} style={{ flexDirection: "row", paddingVertical: 3, borderBottom: "0.5pt solid #F3F4F6" }}>
            <Text style={{ width: 30, fontSize: 9, color: "#6B7280" }}>{i + 1}.</Text>
            <Text style={{ flex: 1, fontSize: 9 }}>{w.complainantFullName}</Text>
            <Text style={{ width: 90, fontSize: 9, fontFamily: "Courier", textAlign: "right" }}>
              {formatMoneyCentavosPdf(w.retirementPayCentavos)}
            </Text>
          </View>
        ))}

        <View style={nlrcStyles.nlrcFooter} fixed>
          <Text style={nlrcStyles.nlrcFooterText}>Batch NLRC Worksheets — RA 7641</Text>
          <Text style={nlrcStyles.nlrcFooterText}>Cover Page</Text>
        </View>
      </Page>

      {/* ── Per-Employee Worksheet Pages ── */}
      {worksheets.map((worksheet, index) => (
        // Reuse NlrcWorksheetPdfDocument as a fragment of pages
        // @react-pdf/renderer supports rendering child components that contain Page elements
        <NlrcWorksheetPdfDocument key={index} data={worksheet} />
      ))}
    </Document>
  );
}
```

**Important note on nested Documents:** `@react-pdf/renderer` does not support nested
`<Document>` elements. The `NlrcBatchPdfDocument` uses `NlrcWorksheetPdfDocument` but
must extract its `<Page>` children directly. Refactor `NlrcWorksheetPdfDocument` to
export a `NlrcWorksheetPdfPage` component that renders just the `<Page>` (no `<Document>`
wrapper), which both `NlrcWorksheetPdfDocument` and `NlrcBatchPdfDocument` can use:

```tsx
// Refactored export pattern:

// NlrcWorksheetPdfPage — the Page contents (used by both single and batch)
export function NlrcWorksheetPdfPage({ data }: { data: NlrcWorksheetOutput }) {
  // ... all the Page JSX from above ...
  return <Page size="LEGAL" style={nlrcStyles.page}>...</Page>;
}

// NlrcWorksheetPdfDocument — wraps in Document for single download
export function NlrcWorksheetPdfDocument({ data }: { data: NlrcWorksheetOutput }) {
  return <Document><NlrcWorksheetPdfPage data={data} /></Document>;
}

// NlrcBatchPdfDocument — cover page + N employee pages in one Document
export function NlrcBatchPdfDocument({ batchName, worksheets }: { ... }) {
  return (
    <Document>
      <Page size="LEGAL" style={nlrcStyles.page}>
        {/* cover page contents */}
      </Page>
      {worksheets.map((w, i) => (
        <NlrcWorksheetPdfPage key={i} data={w} />
      ))}
    </Document>
  );
}
```

---

## File Structure Summary

```
apps/retirement-pay/frontend/src/
  lib/
    pdfDownload.ts                  ← generateAndDownloadPdf() utility
    pdfFormat.ts                    ← formatMoneyCentavosPdf(), formatDatePdf(), sanitizeFilename()
    nlrcBatchBuilder.ts             ← buildNlrcWorksheetsFromBatch()

  components/
    pdf/
      RetirementPayPdfDocument.tsx  ← Single computation PDF (Letter, Helvetica)
      RetirementPayPdfStyles.ts     ← StyleSheet export (shared between Pdf component and tests)
      BatchSummaryPdfDocument.tsx   ← Batch summary PDF (Letter, Helvetica, all rows table)

    nlrc/
      NlrcWorksheetPdfPage.tsx      ← Single LEGAL page (Legal, Times-Roman, no Document wrapper)
      NlrcWorksheetPdfDocument.tsx  ← Wraps NlrcWorksheetPdfPage in Document
      NlrcBatchPdfDocument.tsx      ← Cover + N NlrcWorksheetPdfPage instances

  hooks/
    usePdfExport.ts                 ← exportPdf() + isExporting for single computation
```

---

## Trigger Summary (Cross-Reference with Action Trigger Map)

| PDF Type | Trigger Button | Parent Component | Handler |
|---|---|---|---|
| Single computation PDF | `<Button onClick={exportPdf}>Export PDF</Button>` in `ResultsActionsRow` | `ResultsActionsRow` | `usePdfExport(output).exportPdf` |
| Single computation PDF (also) | `<PdfExportButton>` in `ResultsPageHeader` | `ResultsPageHeader` | same hook |
| Single computation PDF (share mode) | `<PdfExportButton>` in `SharedResultsPage` action row | `SharedResultsPage` | same hook |
| NLRC worksheet PDF | `<Button onClick={handleDownloadPdf}>Download PDF</Button>` | `NlrcWorksheetPage` | inline `handleDownloadPdf` calling `pdf(<NlrcWorksheetPdfDocument ...>).toBlob()` |
| Batch summary PDF | `<DropdownMenuItem onClick={() => exportSummaryPdf(output)}>` | `BatchExportMenu` | `exportSummaryPdf()` fn |
| Batch NLRC PDF | `<DropdownMenuItem onClick={() => exportNlrcBatchPdf(output)}>` | `BatchExportMenu` | `exportNlrcBatchPdf()` fn |

All PDF exports show a toast during generation and a success/error toast on completion.
The `isExporting` state from `usePdfExport` disables the single-computation export button
and shows "Generating PDF..." with a spinner while the `toBlob()` promise is pending.

---

## PdfExportButton Shared Component

```tsx
// apps/retirement-pay/frontend/src/components/shared/PdfExportButton.tsx
// Used in ResultsPageHeader, SharedResultsPage action row

interface PdfExportButtonProps {
  output: RetirementOutput;
  employeeName: string;
  size?: "sm" | "default";
  variant?: "outline" | "default";
}

export function PdfExportButton({
  output,
  employeeName,
  size = "sm",
  variant = "outline",
}: PdfExportButtonProps) {
  const { exportPdf, isExporting } = usePdfExport(output);

  return (
    <Button variant={variant} size={size} onClick={exportPdf} disabled={isExporting}>
      {isExporting ? (
        <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</>
      ) : (
        <><Download className="w-4 h-4 mr-1" /> Export PDF</>
      )}
    </Button>
  );
}
```

---

## Production Build Note

`@react-pdf/renderer` is tree-shaking-sensitive. It must be listed in Vite's
`optimizeDeps.include` to prevent production build issues:

```typescript
// apps/retirement-pay/frontend/vite.config.ts (relevant excerpt)
export default defineConfig({
  optimizeDeps: {
    include: [
      "@react-pdf/renderer",
      "@react-pdf/renderer/src/index.js",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-renderer": ["@react-pdf/renderer"],
        },
      },
    },
  },
});
```

This prevents the library from being tree-shaken in production while keeping it in a
separate chunk that is only loaded when the PDF export action is triggered.

---

## Summary

Four PDF document types are defined, each with exact `@react-pdf/renderer` StyleSheet values,
page sizes, font choices, and component structure:

1. **`RetirementPayPdfDocument`** — Letter, Helvetica, 3 main sections (employment info,
   22.5-day breakdown, comparison), legal basis, tax treatment, separation pay comparison,
   disclaimer footer.

2. **`BatchSummaryPdfDocument`** — Letter, Helvetica, summary stat tiles + full employee
   table with all rows (eligible, ineligible, errors), totals row, auto-paginated via
   `@react-pdf/renderer` page wrapping.

3. **`NlrcWorksheetPdfDocument`** — Legal (8.5"×13"), Times-Roman, 1.25" margins, Philippine
   court document format, 8 conditional sections (sections I–VIII), certification block with
   signature lines and attorney accreditation fields, legal citations, disclaimer.

4. **`NlrcBatchPdfDocument`** — Legal, Times-Roman, cover page with index + aggregate totals,
   followed by N `NlrcWorksheetPdfPage` instances (one per eligible employee). All in a single
   Document to produce one downloadable PDF with page numbers.

Key architecture: `NlrcWorksheetPdfPage` (no Document wrapper) is the reusable primitive
consumed by both `NlrcWorksheetPdfDocument` (single) and `NlrcBatchPdfDocument` (batch).
All PDF generation uses the `generateAndDownloadPdf(component, filename)` utility from
`lib/pdfDownload.ts`. Every trigger button is explicitly wired — no "infra without trigger"
failures. `@react-pdf/renderer` is isolated in its own Vite chunk to prevent tree-shaking
issues in production builds.
