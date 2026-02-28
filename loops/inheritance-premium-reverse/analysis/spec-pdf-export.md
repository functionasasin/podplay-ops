# Feature Spec: PDF Export with Statute Citations

**Aspect:** spec-pdf-export
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-02-28
**Reads:** codebase-audit, pdf-export-patterns, legal-doc-formatting
**Depended on by:** spec-firm-branding, spec-bir-1801-integration, spec-case-export-zip

---

## 1. Overview

The PDF export feature generates a professional **Inheritance Distribution Analysis Report** as a downloadable PDF from the current `ResultsView` state. This is the single most important premium feature: it transforms ephemeral in-browser computation results into a formal document that a Philippine estate lawyer can present to clients, attach to BIR filings, and file in court proceedings.

**Why a PH estate lawyer needs this:**
- Clients require a physical/digital document summarizing distribution — a browser screenshot is not acceptable
- Court petitions for judicial settlement require an attached computation exhibit
- BIR estate tax filings include the heir distribution as a supporting schedule
- Professional credibility: a branded PDF from the law firm's letterhead shows competence and justifies fees
- Audit trail: the PDF captures the computation at a point in time, immutable, with all NCC citations

**Key user story:** After computing an inheritance distribution, the lawyer clicks "Export PDF" → a formatted A4 PDF downloads in under 2 seconds, with the firm's letterhead, full distribution table with NCC article citations, per-heir narratives with share breakdowns, computation log, and a legal disclaimer.

---

## 2. Data Model

The PDF export feature is **purely client-side** — no database tables or Supabase integration required. The feature operates entirely on in-memory data already available in `ResultsView` props.

### 2.1 Input Data (already in app state)

```typescript
// From App state: { phase: 'results', input: EngineInput, output: EngineOutput }
// Passed to ResultsView as props — PDF reads from same props

interface PDFReportData {
  input: EngineInput;       // decedent, family_tree, will, donations, net_distributable_estate
  output: EngineOutput;     // per_heir_shares, narratives, computation_log, warnings, scenario_code
  firmProfile?: FirmProfile; // optional — PDF is usable without firm branding
  generatedAt: string;       // ISO 8601 timestamp, e.g. "2026-02-28T14:30:00+08:00"
}
```

### 2.2 FirmProfile Type (used by PDF, defined in spec-firm-branding)

```typescript
// Defined by spec-firm-branding, consumed here as an optional prop
interface FirmProfile {
  firm_name: string;           // e.g., "Santos & Reyes Law Offices"
  firm_address: string;        // e.g., "4F Salcedo Tower, Legaspi Village, Makati City"
  firm_phone: string;          // e.g., "+63-2-8888-9999"
  firm_email: string;          // e.g., "info@santosreyes.law"
  counsel_name: string;        // e.g., "Atty. Maria G. Santos"
  ibp_roll_no: string;         // e.g., "123456"
  ptr_no: string;              // e.g., "7654321, Jan 5, 2026, Makati City"
  mcle_compliance_no: string;  // e.g., "VII-0012345"
  logo_url: string | null;     // Supabase Storage URL or null
}
```

### 2.3 NCC Article Description Map

A static lookup table mapping NCC article numbers to short descriptions. Used in the narrative section legal basis lines and in tooltips (shared with `spec-statute-citations-ui`). Stored in `src/data/ncc-articles.ts`:

```typescript
// src/data/ncc-articles.ts
export const NCC_ARTICLE_DESCRIPTIONS: Record<string, string> = {
  '774':  'Inheritance defined — transmission of property, rights, and obligations at death',
  '776':  'Inheritance includes all property, rights, and obligations not extinguished by death',
  '777':  'Rights to succession transmitted from moment of death',
  '782':  'Legatee/devisee defined',
  '783':  'Will defined — act by which person disposes of estate',
  '804':  'Will must be in writing, executed in a language known to testator',
  '838':  'Probate — no will shall pass real or personal property without probate',
  '840':  'Institution of heir — act of giving a person a part of the estate',
  '854':  'Preterition — omission of a compulsory heir annuls institution of heirs',
  '855':  'Preterition effect — intestate succession operates only as to omitted heir',
  '872':  'Testator may not impose charges that diminish legitime',
  '886':  'Legitime — portion of estate reserved by law for compulsory heirs',
  '887':  'Compulsory heirs: legitimate children, parents, surviving spouse, illegitimate children',
  '888':  'Legitime of legitimate children: one-half of estate',
  '889':  'Legitimate children share legitime in equal parts',
  '890':  'Legitimate children of predeceased child represent parent by right of representation',
  '891':  'Reserva troncal — ascendant must reserve property for relatives within 3rd degree',
  '892':  'Legitime of surviving spouse with legitimate children: equal share with each child up to 1/4',
  '893':  'Surviving spouse with one legitimate child: each gets 1/4',
  '894':  'Legitime of surviving spouse with illegitimate children',
  '895':  'Legitime of illegitimate children: 1/2 of each legitimate child\'s share',
  '896':  'Surviving spouse without descendants: 1/3 in presence of legitimate ascendants',
  '897':  'Legitimate ascendants\'s share with surviving spouse',
  '898':  'Legitimate ascendants: entire estate if no descendants or spouse',
  '899':  'Illegitimate children\'s legitime in presence of legitimate ascendants',
  '900':  'Surviving spouse without descendants or ascendants: 1/2 of estate',
  '901':  'Illegitimate children without other compulsory heirs: 1/2 of estate',
  '902':  'Rights of illegitimate children transmissible to descendants',
  '960':  'Intestate succession rules',
  '962':  'Nearer relatives exclude farther relatives (proximity rule)',
  '963':  'Representation defined — right to inherit in place of deceased heir',
  '964':  'Representation in descending line: always allowed',
  '965':  'Representation in ascending line: never — nearest ascendant excludes others',
  '972':  'Collateral relatives inherit by representation only if in same degree',
  '975':  'Legitimate children represent parent in inheritance from grandparent',
  '980':  'Children and descendants of deceased heir inherit by right of representation',
  '981':  'Children of repudiating heir inherit by representation',
  '982':  'Grandchildren represent their parents',
  '987':  'Intestate heirs: descendants, ascendants, illegitimate children, surviving spouse, siblings, State',
  '988':  'Legitimate children and descendants exclude other relatives',
  '989':  'Grandchildren and further descendants inherit by representation',
  '995':  'Surviving spouse\'s intestate share in presence of legitimate children',
  '996':  'Surviving spouse\'s intestate share if only heir: entire estate',
  '997':  'Surviving spouse and illegitimate children: equal shares',
  '998':  'Legitimate ascendants and surviving spouse: half each',
  '999':  'Illegitimate children, legitimate ascendants, and surviving spouse: split shares',
  '1000': 'Illegitimate children and surviving spouse: half each',
  '1001': 'Surviving spouse alone: entire estate',
  '1003': 'Collateral relatives inherit in absence of descendants, ascendants, and spouse',
  '1004': 'Legitimate siblings inherit equally',
  '1005': 'Half-blood siblings get half share of full-blood siblings',
  '1006': 'Mixed full and half siblings — full gets double of half',
  '1007': 'Nieces and nephews represent parents',
  '1009': 'Other collateral relatives within 5th degree',
  '1010': 'Nearest collateral relative excludes farther relatives',
  '1011': 'Escheat — estate passes to State when no heirs',
  '1015': 'Collation — donation brought into estate for computation',
  '1016': 'Collation only applies among compulsory heirs',
  '1062': 'Property donated to compulsory heir during lifetime subject to collation',
  '1078': 'Co-ownership of inheritance before partition',
  '1100': 'Advances on legitime — donations imputed to heir\'s share',
};
```

---

## 3. UI Design

### 3.1 Entry Point — ActionsBar Extension

The "Export PDF" button is added to `ActionsBar` alongside existing actions. It occupies the same visual weight as "Export JSON".

```
┌─────────────────────────────────────────────────────────┐
│                    [ActionsBar]                         │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │  ✏ Edit Input │ │ 📥 Export PDF │ │ {} Export JSON │  │
│  └──────────────┘ └──────────────┘ └────────────────┘  │
│  ┌──────────────────────┐                               │
│  │ 📋 Copy Narratives   │                               │
│  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

**Button states:**
- Default: "Export PDF" with `FileDown` icon (lucide-react)
- Generating: "Generating..." with `Loader2` spinning icon, button disabled
- Error: Button re-enables, toast notification: "PDF generation failed — please try again"

### 3.2 User Flow

```
1. User is on ResultsView (phase: 'results')
2. User clicks "Export PDF" button
3. Button shows "Generating..." (disabled)
4. downloadInheritancePDF(input, output, firmProfile?) called
   a. React.createElement(<InheritanceReportDocument .../>)
   b. pdf(doc).toBlob() — renders PDF in browser
   c. URL.createObjectURL(blob) → <a>.click() → file downloads
   d. URL.revokeObjectURL(url) — cleanup
5. Button returns to normal state
6. File saves as: "estate-dela-cruz-2025-01-15.pdf"
```

**Filename format:** `estate-{slugified-decedent-name}-{date-of-death}.pdf`
```typescript
function pdfFilename(input: EngineInput): string {
  const slug = input.decedent.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `estate-${slug}-${input.decedent.date_of_death}.pdf`;
}
// "estate-juan-dela-cruz-2025-01-15.pdf"
```

### 3.3 PDF Document Layout (all pages)

```
┌────────────────────────────────────────────────────────────────────┐
│ FIXED HEADER (72pt from top, every page):                          │
│ [Firm Name or "INHERITANCE REPORT"]        Estate of: Juan dela Cruz│
│ ────────────────────────────────────────────────────────────────── │
├────────────────────────────────────────────────────────────────────┤
│ PAGE 1 CONTENT:                                                     │
│                                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [FIRM HEADER — first page only if firmProfile exists]        │   │
│ │ SANTOS & REYES LAW OFFICES                                   │   │
│ │ Attorneys and Counselors at Law                              │   │
│ │ 4F Salcedo Tower, Legaspi Village, Makati City 1229          │   │
│ │ +63-2-8888-9999 | info@santosreyes.law                       │   │
│ │ Prepared by: Atty. Maria G. Santos                           │   │
│ │ IBP Roll No. 123456 | PTR No. 7654321                        │   │
│ │ MCLE Compliance No. VII-0012345                              │   │
│ │ Date: February 28, 2026                                      │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ═══════════════════════════════════════════════════════════════     │
│ INHERITANCE DISTRIBUTION ANALYSIS REPORT                           │
│ ═══════════════════════════════════════════════════════════════     │
│                                                                     │
│ I. CASE SUMMARY                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Decedent:              Juan dela Cruz                        │   │
│ │ Date of Death:         January 15, 2025                     │   │
│ │ Net Distributable Estate: ₱12,500,000.00                    │   │
│ │ Succession Type:       Testate                               │   │
│ │ Scenario Code:         T-03 — Spouse + Legitimate Children   │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ II. DISTRIBUTION TABLE                                             │
│ ┌────────────────┬───────────────┬──────────────────┬───────────┐  │
│ │ Heir           │ Category      │ Legal Basis      │ Net Share │  │
│ ├────────────────┼───────────────┼──────────────────┼───────────┤  │
│ │ Maria dela Cruz│ Surviving     │ Art. 887, NCC;   │ ₱3,125,   │  │
│ │                │ Spouse        │ Art. 892, NCC    │ 000.00    │  │
│ ├────────────────┼───────────────┼──────────────────┼───────────┤  │
│ │ Pedro dela Cruz│ Legitimate    │ Art. 887, NCC;   │ ₱3,125,   │  │
│ │                │ Child         │ Art. 888, NCC    │ 000.00    │  │
│ ├────────────────┼───────────────┼──────────────────┼───────────┤  │
│ │                               │ TOTAL ESTATE:    │₱12,500,   │  │
│ │                               │                  │ 000.00    │  │
│ └────────────────┴───────────────┴──────────────────┴───────────┘  │
│                                                                     │
│ [Additional sections on subsequent pages if content overflows]      │
├────────────────────────────────────────────────────────────────────┤
│ FIXED FOOTER (every page):                                          │
│ ────────────────────────────────────────────────────────────────── │
│ Generated Feb 28, 2026 (PHT) • Computation aid only • Verify all  │
│                                                   Page 1 of 4      │
└────────────────────────────────────────────────────────────────────┘
```

```
PAGE 2+ — NARRATIVES:
─────────────────────────────────────────────────────────────────────
III. PER-HEIR NARRATIVES
─────────────────────────────────────────────────────────────────────

  Maria dela Cruz — Surviving Spouse
  ──────────────────────────────────
  Maria dela Cruz is entitled to one-fourth (1/4) of the net
  distributable estate in her capacity as surviving spouse of Juan
  dela Cruz. Under Article 887 of the New Civil Code, the surviving
  spouse is a compulsory heir. Pursuant to Article 892 NCC, in the
  presence of four (4) legitimate children, the surviving spouse's
  legitime is reduced to a share equal to each legitimate child.

  Legal Basis: Art. 887, NCC (Compulsory heirs);
               Art. 892, NCC (Spouse share with children)

  Share Breakdown:
    Legitime (Art. 892, NCC):     ₱3,125,000.00 (1/4 of estate)
    From Free Portion:            ₱0.00
    Total Net Share:              ₱3,125,000.00


  Pedro dela Cruz — Legitimate Child
  ────────────────────────────────────
  [narrative text from engine]

  Legal Basis: Art. 887, NCC; Art. 888, NCC; Art. 889, NCC

  Share Breakdown:
    Legitime (Art. 888, NCC):    ₱3,125,000.00 (1/4 of estate)
    From Free Portion:           ₱0.00
    Total Net Share:             ₱3,125,000.00

─────────────────────────────────────────────────────────────────────
IV. COMPUTATION LOG
─────────────────────────────────────────────────────────────────────
  Step 1: Identify succession type                    Testate
  Step 2: Classify heirs and apply filiation          4 heirs
  Step 3: Apply preterition check                     None
  Step 4: Compute legitime pool                       ₱6,250,000.00
  ...

─────────────────────────────────────────────────────────────────────
V. WARNINGS & MANUAL REVIEW FLAGS
─────────────────────────────────────────────────────────────────────
  [Only rendered if warnings.length > 0]
  ⚠ WARNING: [flag title]
    [flag description]

─────────────────────────────────────────────────────────────────────
VI. ATTESTATION & DISCLAIMER
─────────────────────────────────────────────────────────────────────
  [Standard disclaimer text]
  Prepared by: [firm name / "—" if no firm profile]
  Counsel:     [counsel_name + credentials / "—" if no firm profile]
```

### 3.4 Component Tree (`src/pdf/`)

```
src/pdf/
├── InheritanceReportDocument.tsx   — root <Document><Page> component
├── styles.ts                        — StyleSheet.create({ ... }) definitions
├── formatters.ts                    — formatPeso, formatLegalBasis, formatDate, pdfFilename
└── components/
    ├── PageHeader.tsx               — fixed header shown on every page
    ├── PageFooter.tsx               — fixed footer with page numbers
    ├── FirmHeaderSection.tsx        — first-page-only firm letterhead
    ├── CaseSummarySection.tsx       — decedent, DOD, estate value, scenario
    ├── DistributionTableSection.tsx — switches on 7 layout variants
    │   ├── StandardTable.tsx        — default single-table layout
    │   ├── TwoPartTable.tsx         — reused for testate/mixed/fp variants
    │   ├── CollateralTable.tsx      — adds Blood Type + Units columns
    │   ├── EscheatAlert.tsx         — Art. 1011 box, no table
    │   └── PreteritionAlert.tsx     — Art. 854 alert box above table
    ├── NarrativesSection.tsx        — per-heir narrative with share breakdown
    ├── ShareBreakdownRow.tsx        — legitime / free_portion / intestate rows
    ├── ComputationLogSection.tsx    — all steps expanded
    ├── WarningsSection.tsx          — conditional, omitted if empty
    └── DisclaimerSection.tsx        — attestation + disclaimer text
```

---

## 4. API / Data Layer

No Supabase calls. All logic is client-side.

### 4.1 Primary Export Function

```typescript
// src/pdf/exportPDF.ts

import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { InheritanceReportDocument } from './InheritanceReportDocument';
import type { EngineInput, EngineOutput } from '../types';
import type { FirmProfile } from '../types/firm';

export async function downloadInheritancePDF(
  input: EngineInput,
  output: EngineOutput,
  firmProfile?: FirmProfile | null,
): Promise<void> {
  const generatedAt = new Date().toISOString();
  const doc = createElement(InheritanceReportDocument, {
    input,
    output,
    firmProfile: firmProfile ?? undefined,
    generatedAt,
  });
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfFilename(input);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 4.2 Root Document Component

```typescript
// src/pdf/InheritanceReportDocument.tsx

import {
  Document,
  Page,
  View,
  Text,
} from '@react-pdf/renderer';
import { reportStyles as styles } from './styles';
import { PageHeader } from './components/PageHeader';
import { PageFooter } from './components/PageFooter';
import { FirmHeaderSection } from './components/FirmHeaderSection';
import { CaseSummarySection } from './components/CaseSummarySection';
import { DistributionTableSection } from './components/DistributionTableSection';
import { NarrativesSection } from './components/NarrativesSection';
import { ComputationLogSection } from './components/ComputationLogSection';
import { WarningsSection } from './components/WarningsSection';
import { DisclaimerSection } from './components/DisclaimerSection';
import { formatDatePHT } from './formatters';
import type { EngineInput, EngineOutput } from '../types';
import type { FirmProfile } from '../types/firm';

interface Props {
  input: EngineInput;
  output: EngineOutput;
  firmProfile?: FirmProfile;
  generatedAt: string;
}

export function InheritanceReportDocument({ input, output, firmProfile, generatedAt }: Props) {
  const decedentName = input.decedent.name;
  const dod = input.decedent.date_of_death;

  return (
    <Document
      title={`Estate of ${decedentName} — Inheritance Distribution Report`}
      author={firmProfile?.firm_name ?? 'Philippine Inheritance Engine'}
      subject="Inheritance Distribution Analysis Report"
      creator="Philippine Inheritance Computation Platform"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page}>
        {/* Fixed on every page */}
        <PageHeader
          firmName={firmProfile?.firm_name ?? null}
          decedentName={decedentName}
          dod={dod}
        />
        <PageFooter generatedAt={generatedAt} />

        {/* Page 1 body content */}
        <View style={styles.body}>
          {firmProfile && (
            <FirmHeaderSection firm={firmProfile} generatedAt={generatedAt} />
          )}

          <Text style={styles.documentTitle}>
            INHERITANCE DISTRIBUTION ANALYSIS REPORT
          </Text>

          <CaseSummarySection input={input} output={output} />
          <DistributionTableSection output={output} />
          <NarrativesSection output={output} />
          <ComputationLogSection output={output} />
          {output.warnings.length > 0 && (
            <WarningsSection warnings={output.warnings} />
          )}
          <DisclaimerSection firmProfile={firmProfile} generatedAt={generatedAt} />
        </View>
      </Page>
    </Document>
  );
}
```

### 4.3 Page Layout Dimensions

```typescript
// src/pdf/styles.ts — key layout constants

const MARGIN_LEFT   = 108;  // 1.5 inches in pt (38mm)
const MARGIN_TOP    = 85;   // 1.2 inches in pt (30mm)
const MARGIN_RIGHT  = 71;   // 1.0 inch in pt (25mm)
const MARGIN_BOTTOM = 71;   // 1.0 inch in pt (25mm)
const HEADER_HEIGHT = 32;   // fixed header: firm name line + rule
const FOOTER_HEIGHT = 28;   // fixed footer: rule + page number line

export const reportStyles = StyleSheet.create({
  page: {
    size: 'A4',
    // Account for fixed header/footer — body starts below header
    paddingTop: MARGIN_TOP + HEADER_HEIGHT,
    paddingBottom: MARGIN_BOTTOM + FOOTER_HEIGHT,
    paddingLeft: MARGIN_LEFT,
    paddingRight: MARGIN_RIGHT,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  body: {
    // The scrollable page content area between fixed header and footer
  },
  documentTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  // ... (full StyleSheet from pdf-export-patterns analysis §12)
});
```

### 4.4 Distribution Table Section (7 Variants)

```typescript
// src/pdf/components/DistributionTableSection.tsx

import { getResultsLayout } from '../../utils';  // reuse existing utility

export function DistributionTableSection({ output }: { output: EngineOutput }) {
  const layout = getResultsLayout(output);

  switch (layout) {
    case 'standard-distribution':
      return <StandardTable shares={output.per_heir_shares} output={output} />;

    case 'testate-with-dispositions':
      return (
        <>
          <TwoPartTable
            title1="Compulsory Heirs"
            shares1={output.per_heir_shares.filter(s =>
              ['LegitimateChild','Spouse','LegitimateAscendant','IllegitimateChild'].includes(s.heir_category)
            )}
            title2="Free Portion Beneficiaries"
            shares2={output.per_heir_shares.filter(s =>
              !['LegitimateChild','Spouse','LegitimateAscendant','IllegitimateChild'].includes(s.heir_category)
            )}
            output={output}
          />
        </>
      );

    case 'mixed-succession':
      return (
        <TwoPartTable
          title1="Testate Portion"
          shares1={output.per_heir_shares.filter(s => s.from_free_portion > 0)}
          title2="Intestate Remainder"
          shares2={output.per_heir_shares.filter(s => s.from_intestate > 0)}
          output={output}
        />
      );

    case 'preterition-override':
      return (
        <>
          <PreteritionAlert />
          <StandardTable shares={output.per_heir_shares} output={output} />
        </>
      );

    case 'collateral-weighted':
      return <CollateralTable shares={output.per_heir_shares} output={output} />;

    case 'escheat':
      return <EscheatAlert />;

    case 'no-compulsory-full-fp':
      return (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              No compulsory heirs — entire estate constitutes free portion.
              Distributed according to testamentary dispositions (Art. 842, NCC).
            </Text>
          </View>
          {output.per_heir_shares.length > 0 && (
            <StandardTable shares={output.per_heir_shares} output={output} />
          )}
        </>
      );

    default:
      return <StandardTable shares={output.per_heir_shares} output={output} />;
  }
}
```

### 4.5 NCC Legal Basis Formatters

```typescript
// src/pdf/formatters.ts

import { NCC_ARTICLE_DESCRIPTIONS } from '../data/ncc-articles';

/** For table cells — compact: "Arts. 887, 892, NCC" */
export function formatLegalBasisShort(basis: string[]): string {
  const nums = basis
    .map(b => b.match(/\d+/)?.[0])
    .filter((n): n is string => Boolean(n));
  if (nums.length === 0) return '—';
  if (nums.length === 1) return `Art. ${nums[0]}, NCC`;
  return `Arts. ${nums.join(', ')}, NCC`;
}

/** For narrative sections — multiline with descriptions */
export function formatLegalBasisLong(basis: string[]): string {
  return basis.map(b => {
    const num = b.match(/\d+/)?.[0];
    if (!num) return b;
    const desc = NCC_ARTICLE_DESCRIPTIONS[num];
    return desc ? `Art. ${num}, NCC — ${desc}` : `Art. ${num}, NCC`;
  }).join('\n');
}

/** Format centavos as Philippine legal monetary format */
export function formatPeso(centavos: number): string {
  const pesos = centavos / 100;
  return `₱${pesos.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format ISO date as Philippine legal document date */
export function formatDatePHT(isoDate: string): string {
  // "2025-01-15" → "January 15, 2025"
  const [year, month, day] = isoDate.split('-').map(Number);
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return `${months[month - 1]} ${day}, ${year}`;
}

/** Format ISO timestamp for footer */
export function formatGeneratedAt(iso: string): string {
  // "2026-02-28T14:30:00+08:00" → "February 28, 2026 at 2:30 PM (PHT)"
  const d = new Date(iso);
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'long',
    timeStyle: 'short',
  }) + ' (PHT)';
}

/** Safe filename slug from decedent name */
export function pdfFilename(input: EngineInput): string {
  const slug = input.decedent.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents (ñ → n, etc.)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `estate-${slug}-${input.decedent.date_of_death}.pdf`;
}
```

### 4.6 NarrativesSection with Share Breakdown

```typescript
// src/pdf/components/NarrativesSection.tsx
// Shows full narrative text + legal basis citations + from_legitime/from_free_portion/from_intestate breakdown

export function NarrativesSection({ output }: { output: EngineOutput }) {
  const shareMap = new Map(output.per_heir_shares.map(s => [s.heir_id, s]));

  return (
    <View>
      <Text style={styles.sectionTitle}>III. PER-HEIR NARRATIVES</Text>
      <View style={styles.sectionDivider} />

      {output.narratives.map(narrative => {
        const share = shareMap.get(narrative.heir_id);
        if (!share) return null;

        const hasMultipleSources =
          (share.from_legitime > 0 ? 1 : 0) +
          (share.from_free_portion > 0 ? 1 : 0) +
          (share.from_intestate > 0 ? 1 : 0) > 1;

        return (
          <View key={narrative.heir_id} style={styles.narrativeSection}>
            {/* Heir heading with category */}
            <Text style={styles.narrativeHeading} minPresenceAhead={50}>
              {share.heir_name} — {formatCategory(share.heir_category)}
              {share.inherits_by === 'Representation' && share.represents
                ? ` (representing ${resolveHeirName(share.represents, output)})`
                : ''}
            </Text>

            {/* Engine-generated narrative text */}
            <Text style={styles.narrativeBody}>
              {narrative.text}
            </Text>

            {/* Legal basis citations */}
            <Text style={styles.narrativeBasis}>
              Legal Basis: {formatLegalBasisLong(share.legal_basis)}
            </Text>

            {/* Share breakdown — always show */}
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Share Breakdown:</Text>
              {share.from_legitime > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Legitime{share.legitime_fraction ? ` (${share.legitime_fraction})` : ''}:
                  </Text>
                  <Text style={styles.breakdownValue}>{formatPeso(share.from_legitime)}</Text>
                </View>
              )}
              {share.from_free_portion > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>From Free Portion:</Text>
                  <Text style={styles.breakdownValue}>{formatPeso(share.from_free_portion)}</Text>
                </View>
              )}
              {share.from_intestate > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Intestate Share:</Text>
                  <Text style={styles.breakdownValue}>{formatPeso(share.from_intestate)}</Text>
                </View>
              )}
              {share.donations_imputed > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Less: Advance (collation):</Text>
                  <Text style={styles.breakdownValue}>({formatPeso(share.donations_imputed)})</Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                <Text style={[styles.breakdownLabel, styles.breakdownTotalLabel]}>
                  Net from Estate:
                </Text>
                <Text style={[styles.breakdownValue, styles.breakdownTotalValue]}>
                  {formatPeso(share.net_from_estate)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
```

### 4.7 Disclaimer Text

```typescript
// src/pdf/components/DisclaimerSection.tsx

const DISCLAIMER_TEXT = `DISCLAIMER: This report is generated by automated computation software based on the provisions of the New Civil Code of the Philippines (Republic Act No. 386) and applicable revenue regulations. The computations herein are for informational purposes only and do not constitute legal advice. The distributable shares shown are subject to verification of all relevant facts, applicable tax obligations, and final determination by a licensed Philippine attorney. All figures are in Philippine Pesos (₱) and centavos.

This report was prepared using data provided by the user and has not been independently verified. The platform and its operators assume no liability for any reliance on this document without independent legal review. For estate tax obligations, consult a Certified Public Accountant registered with the BIR.`;

export function DisclaimerSection({
  firmProfile,
  generatedAt,
}: {
  firmProfile?: FirmProfile;
  generatedAt: string;
}) {
  return (
    <View style={styles.disclaimerSection} wrap={false}>
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>VI. ATTESTATION</Text>

      {firmProfile && (
        <View style={styles.attestationBlock}>
          <Text style={styles.attestationText}>Prepared by: {firmProfile.firm_name}</Text>
          <Text style={styles.attestationText}>
            Counsel: {firmProfile.counsel_name}
            {firmProfile.ibp_roll_no ? ` | IBP Roll No. ${firmProfile.ibp_roll_no}` : ''}
            {firmProfile.ptr_no ? ` | PTR No. ${firmProfile.ptr_no}` : ''}
            {firmProfile.mcle_compliance_no
              ? ` | MCLE Compliance No. ${firmProfile.mcle_compliance_no}`
              : ''}
          </Text>
          <Text style={styles.attestationText}>
            Generated: {formatGeneratedAt(generatedAt)}
          </Text>
        </View>
      )}

      <Text style={styles.disclaimer}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}
```

### 4.8 ActionsBar Integration

```typescript
// In ActionsBar.tsx — add Export PDF button

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadInheritancePDF } from '@/pdf/exportPDF';
import type { FirmProfile } from '@/types/firm';

interface ActionsBarProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  firmProfile?: FirmProfile | null;  // new prop — optional
}

export function ActionsBar({ input, output, onEditInput, firmProfile }: ActionsBarProps) {
  const [pdfGenerating, setPdfGenerating] = useState(false);

  async function handleExportPDF() {
    setPdfGenerating(true);
    try {
      await downloadInheritancePDF(input, output, firmProfile);
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Show error toast (use shadcn/ui toast or native alert)
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={onEditInput}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit Input
      </Button>

      <Button
        variant="default"
        onClick={handleExportPDF}
        disabled={pdfGenerating}
      >
        {pdfGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </>
        )}
      </Button>

      {/* ... existing Export JSON and Copy Narratives buttons unchanged */}
    </div>
  );
}
```

---

## 5. Integration Points

| Feature | Integration |
|---|---|
| **spec-firm-branding** | Provides `FirmProfile` object injected into `ResultsView` → `ActionsBar` → `downloadInheritancePDF()`. If `firmProfile` is null/undefined, PDF renders with generic "INHERITANCE REPORT" header and no attorney credentials — still fully functional |
| **spec-statute-citations-ui** | Shares `NCC_ARTICLE_DESCRIPTIONS` from `src/data/ncc-articles.ts` — same map used for UI tooltips and PDF narrative citations |
| **spec-case-notes** | If case has notes, they appear as an optional appendix section in the PDF (after Disclaimer). Only rendered if `caseNotes?.length > 0` |
| **spec-bir-1801-integration** | Estate tax summary is appended as an "Annex A" page at the end of the PDF when estate tax has been computed. PDF component accepts optional `estateTaxOutput?: EstateTaxOutput` prop |
| **spec-case-export-zip** | The `downloadInheritancePDF()` function is reused internally by the ZIP export — it calls `pdf(doc).toBlob()` and includes the blob in the ZIP without triggering a download |
| **spec-auth-persistence** | No direct dependency. When cases are saved, the PDF can be regenerated on demand from `input_json` + `output_json`. No need to store PDF blobs in Supabase Storage |

---

## 6. Edge Cases

### 6.1 Escheat scenario (Scenario I15)
- `per_heir_shares` is empty, `warnings` contains the escheat flag
- `DistributionTableSection` renders `<EscheatAlert>` — "Art. 1011, NCC — Estate Escheats to the State"
- `NarrativesSection` renders nothing (no heirs)
- `WarningsSection` shows the escheat warning prominently
- Computation log and disclaimer still render normally

### 6.2 No firm profile
- `firmProfile` is `undefined`
- `FirmHeaderSection` is omitted entirely
- Fixed page header shows "INHERITANCE REPORT" instead of firm name
- Disclaimer shows "Prepared by: —" with no attorney credentials
- PDF is still valid and professional-looking

### 6.3 Very large heir count (20+ heirs)
- Distribution table spans multiple pages — `fixed` prop on `TableHeader` repeats column headers on each page
- Each heir row has `wrap={false}` to prevent row from splitting across pages
- Narratives section: each heir gets its own `<View>` with `minPresenceAhead={50}` on heading
- No special handling needed — @react-pdf/renderer handles pagination automatically

### 6.4 Long heir names / long narrative text
- `flex: 3` on heir name column allows multi-line wrapping within the cell
- narrative text uses `textAlign: 'justify'` and `lineHeight: 1.6`
- `orphans: 3` / `widows: 3` prevents orphaned lines at page boundaries

### 6.5 Donations / collation present
- `donations_imputed > 0` triggers the "Less: Advance (collation):" row in share breakdown
- `gross_entitlement` is shown when `donations_imputed > 0` (as gross before collation)
- Donation list from `input.donations` is NOT rendered in the PDF (covered by `spec-donation-summary-in-results`)

### 6.6 Preterition (layout: preterition-override)
- `<PreteritionAlert>` box is rendered above the distribution table
- Text: "Art. 854, NCC — Preterition Applied: One or more compulsory heirs were omitted from the will. The institution of heirs is annulled and intestate succession governs."
- Distribution table then shows the resulting intestate shares

### 6.7 Collateral heirs (layout: collateral-weighted)
- Table adds two columns: "Blood Type" (full/half) and "Units" (collateral weighting units)
- Column widths adjusted: colHeir=3, colBlood=1.5, colUnits=1, colAmount=2

### 6.8 ₱ symbol rendering
- react-pdf built-in `Times-Roman` and `Helvetica` fonts support Unicode including U+20B1 (₱)
- No font registration required for ₱
- If a custom font is used in v2 (spec-firm-branding logo customization), verify that font includes ₱ before registering

### 6.9 PDF generation timeout
- `pdf(doc).toBlob()` is async — for typical cases (≤15 heirs), completes in < 500ms
- No timeout handling needed for v1
- If the promise rejects (out of memory, renderer crash), the `catch` block in `handleExportPDF` catches and shows user error message

### 6.10 Mobile devices
- The "Export PDF" button is visible on mobile — PDF downloads work on iOS Safari and Android Chrome
- PDF viewer opens in browser's built-in PDF viewer or triggers download
- No special mobile handling required

---

## 7. Dependencies

### Build-time
```bash
npm install @react-pdf/renderer
# Version: ^4.3.2
# No additional Vite config needed (works in browser without Node polyfills)
```

### Runtime
- `@react-pdf/renderer` — PDF generation (new)
- `react` — already installed (v19)
- All existing types (`EngineInput`, `EngineOutput`, `InheritanceShare`, etc.) — already available

### Feature dependencies
- **spec-firm-branding** — `FirmProfile` type and data (OPTIONAL — PDF works without it)
- **spec-statute-citations-ui** — shares `NCC_ARTICLE_DESCRIPTIONS` map (create this file in this spec, reused by that spec)

### No dependency on:
- `spec-auth-persistence` — PDF works anonymously
- `spec-client-profiles` — no client data needed for PDF
- Any Supabase feature

---

## 8. Acceptance Criteria

### AC1: Basic PDF Generation
- [ ] Clicking "Export PDF" on the results view downloads a PDF file
- [ ] Filename follows pattern: `estate-{decedent-name}-{dod}.pdf`
- [ ] PDF downloads within 3 seconds for cases with ≤ 20 heirs
- [ ] PDF opens correctly in Adobe Acrobat, macOS Preview, and browser PDF viewer
- [ ] PDF text is selectable and searchable (not an image)

### AC2: Page Layout
- [ ] Page size is A4 (210mm × 297mm)
- [ ] Margins: Left 38mm, Top 30mm, Right 25mm, Bottom 25mm
- [ ] Body font is Times-Roman 11pt
- [ ] Section titles are Times-Bold 13–14pt
- [ ] Fixed header appears on every page with firm name (or "INHERITANCE REPORT") and case reference
- [ ] Fixed footer appears on every page with generation timestamp and "Page X of Y"

### AC3: Content — Case Summary
- [ ] Decedent's name rendered exactly as entered
- [ ] Date of death formatted as "Month DD, YYYY" (e.g., "January 15, 2025")
- [ ] Net distributable estate shown as ₱N,NNN,NNN.NN
- [ ] Succession type (Testate / Intestate / Mixed / etc.) shown
- [ ] Scenario code shown with description

### AC4: Content — Distribution Table
- [ ] All heirs from `per_heir_shares` appear in the table
- [ ] Each row shows: heir name, category, legal basis (short form), net share (₱ format)
- [ ] Legal basis uses "Arts. 887, 892, NCC" short format (not raw engine string)
- [ ] Total row shows sum of all net shares equal to net distributable estate
- [ ] Table header row repeats when table spans multiple pages
- [ ] All 7 layout variants render correctly:
  - [ ] Standard table (intestate default)
  - [ ] Two-part table for testate (Compulsory + Free Portion sections)
  - [ ] Two-part table for mixed succession
  - [ ] Preterition alert + table
  - [ ] Collateral table with Blood Type + Units columns
  - [ ] Escheat alert (no table)
  - [ ] No-compulsory info box + optional table

### AC5: Content — Narratives
- [ ] Every heir in `output.narratives` has a narrative section
- [ ] Engine-generated narrative text is rendered verbatim
- [ ] Legal basis appears as long-form (with NCC descriptions) below each narrative
- [ ] Share breakdown shows from_legitime, from_free_portion, from_intestate (non-zero only)
- [ ] Legitime fraction (e.g., "1/4") shown next to legitime amount
- [ ] Donations imputed shown as "(₱N)" deduction if present
- [ ] Net from estate total shown in bold
- [ ] Representation: heir heading includes "(representing [deceased parent name])" when applicable
- [ ] No orphaned section headings at page bottom (minPresenceAhead enforced)

### AC6: Content — Computation Log
- [ ] All computation log steps are rendered (not collapsed)
- [ ] Step number, description, and value shown per row
- [ ] No truncation even for long descriptions

### AC7: Content — Warnings
- [ ] Section is omitted entirely when `output.warnings` is empty
- [ ] Each warning rendered as yellow alert box with title and description
- [ ] Warning count matches engine output exactly

### AC8: Content — Firm Header (when firmProfile provided)
- [ ] Firm name appears prominently on page 1
- [ ] "Attorneys and Counselors at Law" designation shown
- [ ] Address, phone, email shown
- [ ] Counsel name shown
- [ ] IBP Roll No. shown (if provided)
- [ ] PTR No. shown (if provided)
- [ ] MCLE Compliance No. shown (if provided)
- [ ] Generation date shown
- [ ] Firm header appears on page 1 ONLY (not repeated on subsequent pages)

### AC9: Content — No Firm Profile
- [ ] PDF generates successfully without firmProfile
- [ ] Generic "INHERITANCE REPORT" appears in fixed header
- [ ] Disclaimer section shows "Prepared by: —" gracefully

### AC10: Content — Disclaimer
- [ ] Full disclaimer text appears on last page
- [ ] Disclaimer mentions NCC, Republic Act No. 386, Philippine attorney review

### AC11: Monetary Formatting
- [ ] All amounts use ₱ symbol (U+20B1, not P or PHP)
- [ ] Comma thousands separator: ₱1,234,567.89
- [ ] Always two decimal places: ₱500,000.00 (not ₱500,000)
- [ ] ₱ symbol renders correctly (not as a box or missing glyph)

### AC12: Escaping and Special Characters
- [ ] Filipino names with ñ, é, etc. render correctly in PDF
- [ ] Narrative text with quotation marks, apostrophes renders correctly
- [ ] Long firm names do not overflow header layout

### AC13: Performance
- [ ] PDF generation completes in < 2 seconds for cases with ≤ 15 heirs
- [ ] PDF generation completes in < 5 seconds for cases with 20 heirs
- [ ] UI remains responsive during PDF generation (async, non-blocking)
- [ ] Button shows "Generating..." during generation, returns to normal after

### AC14: Error Handling
- [ ] If PDF generation throws an error, button returns to normal state
- [ ] User sees an error notification (alert or toast)
- [ ] No console errors in the happy path

---

## 9. File Inventory

Files to create:
```
src/
├── data/
│   └── ncc-articles.ts              — NCC article description map (shared with spec-statute-citations-ui)
├── types/
│   └── firm.ts                      — FirmProfile interface (placeholder until spec-firm-branding)
├── pdf/
│   ├── InheritanceReportDocument.tsx
│   ├── styles.ts
│   ├── formatters.ts
│   ├── exportPDF.ts
│   └── components/
│       ├── PageHeader.tsx
│       ├── PageFooter.tsx
│       ├── FirmHeaderSection.tsx
│       ├── CaseSummarySection.tsx
│       ├── DistributionTableSection.tsx
│       ├── StandardTable.tsx
│       ├── TwoPartTable.tsx
│       ├── CollateralTable.tsx
│       ├── EscheatAlert.tsx
│       ├── PreteritionAlert.tsx
│       ├── NarrativesSection.tsx
│       ├── ShareBreakdownRow.tsx
│       ├── ComputationLogSection.tsx
│       ├── WarningsSection.tsx
│       └── DisclaimerSection.tsx
```

Files to modify:
```
src/components/results/ActionsBar.tsx  — add Export PDF button + pdfGenerating state + firmProfile prop
```

---

*Sources: codebase-audit.md, pdf-export-patterns.md, legal-doc-formatting.md*
