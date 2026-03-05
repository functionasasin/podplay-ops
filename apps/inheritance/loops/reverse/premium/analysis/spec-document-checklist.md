# Spec: Document Checklist

**Aspect:** spec-document-checklist
**Wave:** 2 — Per-Feature Specification
**Date:** 2026-03-01
**Reads:** ph-practice-workflow, spec-auth-persistence
**Discovered by:** competitive-landscape (no legal tool tracks per-stage PH estate document status)

---

## 1. Overview

Philippine estate settlement requires 15–35 distinct government-issued documents across 6–8 stages. Today, lawyers maintain these checklists manually — in Excel, Word documents, or paper. PSA delays alone can run 3–6 weeks; missing one document (eCAR, Transfer Tax receipt, Affidavit of Publication) blocks the entire title transfer.

This feature adds a **per-case document checklist** to each saved case. On first open, the system seeds the checklist automatically from a static template, then conditionally includes items based on what the lawyer has already entered (real properties, overseas heirs, minor heirs, businesses). Items are checked off as documents arrive. Progress is shown at a glance.

**What lawyers get:**
- Zero-setup checklist that appears when a case is saved — no manual entry of document names
- Smart seeding: only shows TCT items if there is real property; only shows SPA if an heir is overseas
- Check-off tracking: tap once to mark a document received
- Per-document notes: "Received from PSA Branch Makati on 03 Feb 2026"
- Progress bar: 8 of 14 documents obtained (57%)
- Optional inclusion in PDF export as Case Appendix
- Not-applicable toggle: mark items the case does not need without deleting them

**Why lawyers pay for this:**
- Document status anxiety is the #1 non-computation pain point for solo PH estate lawyers (per `ph-practice-workflow.md` research)
- Paralegals use this as a task list — they can see at a glance what still needs to be chased
- Prevents missed deadlines caused by forgotten documents (eCAR not filed → cannot register title)

---

## 2. Data Model

### 2.1 DDL

```sql
-- ============================================================
-- Case Document Items
-- Per-case checklist items seeded from a static template
-- then customizable per case.
-- ============================================================
CREATE TABLE case_document_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Category key (matches ChecklistCategory enum)
  category        TEXT NOT NULL CHECK (category IN (
    'civil_status',
    'real_property',
    'personal_property',
    'business',
    'bir',
    'deed',
    'post_settlement'
  )),

  -- Display label for the item
  label           TEXT NOT NULL,

  -- Where to obtain this document (shown as helper text)
  source          TEXT NOT NULL DEFAULT '',

  -- Seed ID: non-null for auto-generated items; null for user-added custom items.
  -- Used to prevent duplicate seeding on re-open.
  seed_id         TEXT,

  -- Status flags
  is_applicable   BOOLEAN NOT NULL DEFAULT TRUE,
    -- FALSE = lawyer has marked this item N/A for this case (hidden from count)
  is_checked      BOOLEAN NOT NULL DEFAULT FALSE,
    -- TRUE = document obtained / step completed

  -- Optional free-text note (date obtained, branch, notes)
  notes           TEXT NOT NULL DEFAULT '',

  -- Display order within category
  sort_order      INTEGER NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_document_items ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_doc_items_seed ON case_document_items(case_id, seed_id)
  WHERE seed_id IS NOT NULL;

CREATE INDEX idx_doc_items_case_id ON case_document_items(case_id);
CREATE INDEX idx_doc_items_user_id ON case_document_items(user_id);

CREATE POLICY "doc_items_all_own" ON case_document_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER doc_items_updated_at
  BEFORE UPDATE ON case_document_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.2 TypeScript Types

```typescript
// types/checklist.ts

export type ChecklistCategory =
  | 'civil_status'
  | 'real_property'
  | 'personal_property'
  | 'business'
  | 'bir'
  | 'deed'
  | 'post_settlement'

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  civil_status:      'Identity & Civil Status',
  real_property:     'Real Property Documents',
  personal_property: 'Personal Property Documents',
  business:          'Business Interest Documents',
  bir:               'BIR Requirements',
  deed:              'Deed & Legal Instruments',
  post_settlement:   'Post-Settlement / Title Transfer',
}

export interface DocumentItemRow {
  id:             string
  case_id:        string
  user_id:        string
  category:       ChecklistCategory
  label:          string
  source:         string
  seed_id:        string | null     // null for custom items
  is_applicable:  boolean
  is_checked:     boolean
  notes:          string
  sort_order:     number
  created_at:     string
  updated_at:     string
}

// Progress summary (computed client-side)
export interface ChecklistProgress {
  total:         number   // applicable items only (is_applicable = true)
  obtained:      number   // is_applicable = true AND is_checked = true
  pct:           number   // Math.round(obtained / total * 100) or 0 if total === 0
  by_category:   Record<ChecklistCategory, { total: number; obtained: number }>
}
```

### 2.3 Seed Template

All static seed items defined in code (not the DB). Each seed item has a stable `seed_id` string so the seeding function is idempotent.

**Condition flags** — what case data is checked before including an item:

| Condition key | Checks |
|---------------|--------|
| `always` | Always included |
| `has_spouse` | `input_json.family_tree.spouse !== null` |
| `has_real_property` | `tax_input_json.real_properties.length > 0` OR `cases.gross_estate > 0 && tax_input_json IS NULL` (default-include if no tax data yet) |
| `has_bank_accounts` | `tax_input_json.bank_accounts.length > 0` |
| `has_vehicles` | `tax_input_json.vehicles.length > 0` |
| `has_stocks` | `tax_input_json.shares.length > 0` |
| `has_business` | `tax_input_json.business_interests.length > 0` |
| `has_gross_over_2m` | `cases.gross_estate >= 200000000` (centavos = ₱2M) |
| `has_gross_over_5m` | `cases.gross_estate >= 500000000` (centavos = ₱5M) |
| `has_heirs_abroad` | Any heir in `input_json.family_tree` where `is_overseas === true` |
| `has_minor_heirs` | Any heir in `input_json.family_tree` where `is_minor === true` |

**When tax_input_json is null** (estate tax wizard not yet completed): default to including ALL real-property-conditional items — lawyer can mark N/A items later.

```typescript
// lib/checklistSeeds.ts

export interface ChecklistSeedItem {
  seed_id:    string
  category:   ChecklistCategory
  label:      string
  source:     string
  condition:  'always'
            | 'has_spouse'
            | 'has_real_property'
            | 'has_bank_accounts'
            | 'has_vehicles'
            | 'has_stocks'
            | 'has_business'
            | 'has_gross_over_2m'
            | 'has_gross_over_5m'
            | 'has_heirs_abroad'
            | 'has_minor_heirs'
  sort_order: number
}

export const CHECKLIST_SEED_ITEMS: ChecklistSeedItem[] = [
  // ── civil_status ──────────────────────────────────────────
  { seed_id: 'cs-01', category: 'civil_status', label: 'PSA-certified Death Certificate of decedent',
    source: 'Philippine Statistics Authority (PSA) — Serbilis, PSA Helpline, or LCR',
    condition: 'always', sort_order: 10 },
  { seed_id: 'cs-02', category: 'civil_status', label: 'PSA-certified Birth Certificate of decedent',
    source: 'PSA — required to prove age and legitimacy chain',
    condition: 'always', sort_order: 20 },
  { seed_id: 'cs-03', category: 'civil_status', label: 'PSA-certified Marriage Certificate of decedent and surviving spouse',
    source: 'PSA — required to establish conjugal/community property regime',
    condition: 'has_spouse', sort_order: 30 },
  { seed_id: 'cs-04', category: 'civil_status', label: 'PSA-certified Birth Certificates of all compulsory heirs',
    source: 'PSA (one per heir) — required to prove filiation and legitime rights',
    condition: 'always', sort_order: 40 },
  { seed_id: 'cs-05', category: 'civil_status', label: 'Valid government-issued IDs of all heirs (photocopy + original for verification)',
    source: 'PhilSys, Passport, SSS ID, GSIS ID, Driver\'s License, or Voter\'s ID',
    condition: 'always', sort_order: 50 },

  // ── real_property ─────────────────────────────────────────
  { seed_id: 'rp-01', category: 'real_property', label: 'Certified True Copy of TCT/OCT/CCT for each real property parcel',
    source: 'Register of Deeds of the city/municipality where property is located',
    condition: 'has_real_property', sort_order: 10 },
  { seed_id: 'rp-02', category: 'real_property', label: 'Latest Tax Declaration (TD) for each real property',
    source: 'City/Municipal Assessor\'s Office — must show year and declared value',
    condition: 'has_real_property', sort_order: 20 },
  { seed_id: 'rp-03', category: 'real_property', label: 'BIR Zonal Valuation printout for each property location',
    source: 'BIR RDO covering the property location — used to compute FMV for estate tax',
    condition: 'has_real_property', sort_order: 30 },

  // ── personal_property ─────────────────────────────────────
  { seed_id: 'pp-01', category: 'personal_property', label: 'Bank certification of account balance as of date of death (per bank account)',
    source: 'Each bank where decedent held accounts — must be on bank letterhead, signed by branch manager',
    condition: 'has_bank_accounts', sort_order: 10 },
  { seed_id: 'pp-02', category: 'personal_property', label: 'Stock certificates for all shares of stock',
    source: 'Corporation secretary — also obtain latest audited financial statements (for unlisted shares)',
    condition: 'has_stocks', sort_order: 20 },
  { seed_id: 'pp-03', category: 'personal_property', label: 'PSE certification of closing price as of date of death (listed stocks)',
    source: 'Philippine Stock Exchange (PSE) daily price history — or newspaper closing price on date of death',
    condition: 'has_stocks', sort_order: 30 },
  { seed_id: 'pp-04', category: 'personal_property', label: 'Official Receipt and Certificate of Registration (OR/CR) for each motor vehicle',
    source: 'Land Transportation Office (LTO) — include Sanvic or LTO appraisal for FMV',
    condition: 'has_vehicles', sort_order: 40 },

  // ── business ──────────────────────────────────────────────
  { seed_id: 'bi-01', category: 'business', label: 'CPA-certified financial statements of business as of date of death',
    source: 'External auditor — required if gross estate exceeds ₱2,000,000 (RR No. 12-2018)',
    condition: 'has_gross_over_2m', sort_order: 10 },
  { seed_id: 'bi-02', category: 'business', label: 'Articles of Incorporation / Partnership Agreement',
    source: 'Corporate Secretary / SEC — establishes ownership percentage of decedent',
    condition: 'has_business', sort_order: 20 },
  { seed_id: 'bi-03', category: 'business', label: 'Board Resolution authorizing estate administrator to act on behalf of shares',
    source: 'Corporation Secretary — required to handle stock transfers post-settlement',
    condition: 'has_business', sort_order: 30 },

  // ── bir ───────────────────────────────────────────────────
  { seed_id: 'bir-01', category: 'bir', label: 'BIR Form 1904 (Application for Estate TIN)',
    source: 'RDO of decedent\'s last domicile — file this first, early in process',
    condition: 'always', sort_order: 10 },
  { seed_id: 'bir-02', category: 'bir', label: 'BIR Form 1949 (Notice of Death)',
    source: 'RDO of decedent\'s last domicile — required if gross estate > ₱5,000,000 or if there is real property',
    condition: 'has_gross_over_5m', sort_order: 20 },
  { seed_id: 'bir-03', category: 'bir', label: 'Completed BIR Form 1801 (Estate Tax Return) with all schedules',
    source: 'Prepared by attorney/CPA — file at Authorized Agent Bank (AAB) of applicable RDO',
    condition: 'always', sort_order: 30 },
  { seed_id: 'bir-04', category: 'bir', label: 'Schedule 1 / 1A — Real Properties inventory (values + TD nos. + TCT nos.)',
    source: 'Attached to BIR Form 1801 — list each parcel with FMV vs. zonal value',
    condition: 'has_real_property', sort_order: 40 },
  { seed_id: 'bir-05', category: 'bir', label: 'Schedule 2 / 2A — Claims against the gross estate (deductions list)',
    source: 'Attached to BIR Form 1801 — itemize outstanding debts, funeral expenses, judicial expenses',
    condition: 'always', sort_order: 50 },

  // ── deed ──────────────────────────────────────────────────
  { seed_id: 'deed-01', category: 'deed', label: 'Notarized Deed of Extrajudicial Settlement of Estate',
    source: 'Prepared by handling attorney — all heirs must sign before notary public',
    condition: 'always', sort_order: 10 },
  { seed_id: 'deed-02', category: 'deed', label: 'Special Power of Attorney (SPA) for overseas heirs (consularized)',
    source: 'Philippine Consulate/Embassy in country where heir resides — must be authenticated (apostille or red-ribbon)',
    condition: 'has_heirs_abroad', sort_order: 20 },
  { seed_id: 'deed-03', category: 'deed', label: 'Court-approved guardianship order for minor heirs',
    source: 'Regional Trial Court — file guardianship petition before EJS deed execution if minor heir has no surviving parent',
    condition: 'has_minor_heirs', sort_order: 30 },
  { seed_id: 'deed-04', category: 'deed', label: 'Newspaper publication — proof of 3 consecutive weekly publications',
    source: 'Newspaper of general circulation in the province/city where decedent was domiciled',
    condition: 'always', sort_order: 40 },
  { seed_id: 'deed-05', category: 'deed', label: 'Affidavit of Publication from newspaper after 3rd weekly publication',
    source: 'Newspaper editorial office — obtained after final publication',
    condition: 'always', sort_order: 50 },

  // ── post_settlement ───────────────────────────────────────
  { seed_id: 'ps-01', category: 'post_settlement', label: 'BIR Official Receipt (proof of estate tax payment)',
    source: 'Authorized Agent Bank (AAB) where Form 1801 was filed — retain original',
    condition: 'always', sort_order: 10 },
  { seed_id: 'ps-02', category: 'post_settlement', label: 'eCAR (electronic Certificate Authorizing Registration) per real property',
    source: 'BIR RDO — issued after estate tax payment; one eCAR per parcel of land',
    condition: 'has_real_property', sort_order: 20 },
  { seed_id: 'ps-03', category: 'post_settlement', label: 'Transfer Tax Official Receipt from Local Government Unit (LGU)',
    source: 'City/Municipal Treasurer\'s Office where property is located — rate is 0.5–0.75% of FMV',
    condition: 'has_real_property', sort_order: 30 },
  { seed_id: 'ps-04', category: 'post_settlement', label: 'Register of Deeds filing — annotation or issuance of new TCT in heirs\' names',
    source: 'Register of Deeds — file: Deed of EJS + Affidavit of Publication + eCAR + Transfer Tax receipt',
    condition: 'has_real_property', sort_order: 40 },
  { seed_id: 'ps-05', category: 'post_settlement', label: 'New Titles (TCT/CCT) issued to heirs per agreed distribution',
    source: 'Register of Deeds — final step confirming title transfer is complete',
    condition: 'has_real_property', sort_order: 50 },
]
```

### 2.4 Item Count by Category (Standard EJS Case with One Property)

| Category | Items (no-property) | Items (with 1 property) |
|----------|--------------------|-----------------------|
| Identity & Civil Status | 4 (no spouse) or 5 (with spouse) | 4–5 |
| Real Property | 0 | 3 |
| Personal Property | 0–4 (varies by assets) | 0–4 |
| Business Interests | 0 (unless business) | 0 |
| BIR Requirements | 2 (1801 + TIN) | 4 (+ 1949 if >₱5M, + Schedule 1) |
| Deed & Legal Instruments | 3 (always) + 2 (SPA + guardianship conditionally) | 3–5 |
| Post-Settlement | 1 (no real property) | 5 |
| **Typical totals** | **~10 items** | **~20 items** |

---

## 3. UI Design

### 3.1 Checklist Panel in Case Detail View

The checklist panel appears as a tab in the case detail view (alongside Results, Notes, BIR 1801):

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Dashboard       Estate of Juan dela Cruz            ✓ Saved       │
│  [Results]  [Document Checklist]  [Notes]  [BIR 1801]                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Document Checklist                            8 of 20 obtained  40% │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Progress bar           │
│                                                                       │
│  ┌─ Identity & Civil Status ──────────────────────────── 2 of 5 ──┐  │
│  │  [✓]  PSA-certified Death Certificate                           │  │
│  │       Source: Philippine Statistics Authority                   │  │
│  │  [✓]  PSA-certified Birth Certificate of decedent              │  │
│  │  [ ]  PSA-certified Marriage Certificate                        │  │
│  │  [ ]  PSA-certified Birth Certificates of all heirs            │  │
│  │  [ ]  Valid government IDs of all heirs                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ Real Property Documents ───────────────────────────── 1 of 3 ──┐ │
│  │  [✓]  Certified True Copy of TCT for Lot 45-A, Quezon City     │ │
│  │       Note: Obtained from RD-QC on 10 Feb 2026  [Edit note]    │ │
│  │  [ ]  Latest Tax Declaration for Lot 45-A                      │ │
│  │       Source: Quezon City Assessor's Office                    │ │
│  │  [ ]  BIR Zonal Valuation for Quezon City (RDO No. 38)        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─ BIR Requirements ──────────────────────────────────── 0 of 3 ──┐ │
│  │  [ ]  BIR Form 1904 (Estate TIN application)                   │ │
│  │  [ ]  BIR Form 1801 with all schedules                         │ │
│  │  [ ]  Schedule 1 / 1A — Real Properties inventory             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─ Deed & Legal Instruments ──────────────────────────── 0 of 5 ──┐ │
│  │  [ ]  Notarized Deed of Extrajudicial Settlement               │ │
│  │  [ ]  Special Power of Attorney for overseas heirs             │ │
│  │       Source: Philippine Consulate / Embassy                   │ │
│  │  [ ]  Publication Week 1                                       │ │
│  │  [ ]  Publication Week 2                                       │ │
│  │  [ ]  Affidavit of Publication from newspaper                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─ Post-Settlement / Title Transfer ────────────────────── 5 of 5 ─┐│
│  │  [✓]  BIR Official Receipt                                     ││
│  │  [✓]  eCAR for Lot 45-A                                        ││
│  │  [✓]  Transfer Tax Receipt from Quezon City                    ││
│  │  [✓]  RD filing (annotation/new TCT)                           ││
│  │  [✓]  New TCT issued to heirs                                  ││
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  [+ Add Custom Item]                  [Include in PDF Export]        │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Individual Item Row States

**Unchecked (pending):**
```
  [ ]  PSA-certified Death Certificate
       Source: Philippine Statistics Authority (PSA)  [Mark N/A]
```

**Checked (obtained):**
```
  [✓]  PSA-certified Death Certificate  ← label strikethrough
       Note: Received at PSA Megamall on 05 Feb 2026  [Edit]
       [Uncheck]
```

**Not applicable (hidden from progress count, visually dimmed):**
```
  [—]  Special Power of Attorney for overseas heirs  ← gray, italic
       N/A for this case  [Restore]
```

### 3.3 Item Interaction — Check with Optional Note

When the user clicks `[ ]` to check an item:

```
┌──────────────────────────────────────────────────────────┐
│  Mark document as obtained?                              │
│                                                          │
│  PSA-certified Death Certificate                         │
│                                                          │
│  Add a note (optional):                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ e.g., "Received from PSA Megamall, 05 Feb 2026"  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Cancel]                               [Mark Obtained]  │
└──────────────────────────────────────────────────────────┘
```

For speed (most items don't need a note), the modal has a single click alternative:
- First click on the checkbox = immediate check (no modal) if no existing note
- Long-press / right-click = open note modal

Alternatively (simpler), the note is an inline-editable field that appears after checking:

```
  [✓]  PSA-certified Death Certificate
       [Add a note about when/where you obtained this…]  ← appears inline on check
```

### 3.4 Add Custom Item Modal

For documents not in the default template (e.g., court-specific requirements):

```
┌─────────────────────────────────────────────────────────────┐
│  Add Custom Document                                         │
│                                                              │
│  Category                                                    │
│  [BIR Requirements                                  ▾]       │
│                                                              │
│  Document Name *                                             │
│  [_____________________________________________]             │
│                                                              │
│  Source / Where to Obtain (optional)                         │
│  [_____________________________________________]             │
│                                                              │
│  [Cancel]                                      [Add Item]   │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 Progress Summary (Compact Badge for Case Detail Tab)

Shown on the tab label so lawyer can see status without opening the full checklist:

```
[Document Checklist  8/20]
```

Also shown as a pill in the case card on the Dashboard:

```
┌──────────────────────────────────────────────────────────────┐
│  Estate of Juan dela Cruz                           computed  │
│  Date of Death: 15 Jan 2025 · Estate: ₱12,500,000           │
│  Documents: 8/20 ●●●●●○○○○○  Last updated: 2 hours ago     │
│                                              [Open] [···]    │
└──────────────────────────────────────────────────────────────┘
```

### 3.6 Component Hierarchy

```
CaseDetailPage
├── CaseTabs (Results | Document Checklist | Notes | BIR 1801)
│   └── DocumentChecklistPanel  ← NEW
│       ├── ChecklistProgressBar
│       │   ├── obtained/total count
│       │   └── <progress> bar (HTML5 native, styled)
│       ├── ChecklistCategorySection (×N categories)
│       │   ├── CategoryHeader (label + X of Y count + collapse toggle)
│       │   └── ChecklistItem (×M items per category)
│       │       ├── CheckboxButton (immediate toggle)
│       │       ├── ItemLabel (strikethrough when checked)
│       │       ├── SourceText (helper text, collapsible)
│       │       ├── NoteField (inline editable)
│       │       └── MarkNaApplicableButton
│       ├── AddCustomItemButton
│       │   └── AddCustomItemModal
│       └── IncludeInPdfToggle
```

---

## 4. API / Data Layer

### 4.1 Seeding Function

Called once per case when the checklist tab is first opened. The unique index on `(case_id, seed_id)` ensures no duplicate items are inserted on repeated opens.

```typescript
// lib/checklist.ts
import { supabase } from './supabase'
import { CHECKLIST_SEED_ITEMS, type ChecklistSeedItem } from './checklistSeeds'
import type { DocumentItemRow, ChecklistCategory } from '@/types/checklist'
import type { CaseRow } from '@/types/db'

// ── Condition evaluation ─────────────────────────────────────────────
function evaluateConditions(caseRow: CaseRow): Set<ChecklistSeedItem['condition']> {
  const active = new Set<ChecklistSeedItem['condition']>(['always'])
  const input = caseRow.input_json
  const tax   = caseRow.tax_input_json as Record<string, unknown[]> | null

  if (input?.family_tree?.spouse)                          active.add('has_spouse')
  if (input?.family_tree?.heirs?.some((h: { is_overseas?: boolean }) => h.is_overseas))
                                                            active.add('has_heirs_abroad')
  if (input?.family_tree?.heirs?.some((h: { is_minor?: boolean }) => h.is_minor))
                                                            active.add('has_minor_heirs')

  // Use tax_input_json for asset conditions if available; otherwise default-include
  if (tax) {
    if ((tax.real_properties ?? []).length > 0)            active.add('has_real_property')
    if ((tax.bank_accounts   ?? []).length > 0)            active.add('has_bank_accounts')
    if ((tax.vehicles        ?? []).length > 0)            active.add('has_vehicles')
    if ((tax.shares          ?? []).length > 0)            active.add('has_stocks')
    if ((tax.business_interests ?? []).length > 0)         active.add('has_business')
  } else {
    // No estate tax data yet → default-include all asset-dependent items so lawyer can
    // mark N/A manually once they know the estate composition.
    active.add('has_real_property')
    active.add('has_bank_accounts')
    active.add('has_vehicles')
    active.add('has_stocks')
    active.add('has_business')
  }

  const grossCentavos = caseRow.gross_estate ?? 0
  if (grossCentavos >= 200_000_000) active.add('has_gross_over_2m')  // ₱2M
  if (grossCentavos >= 500_000_000) active.add('has_gross_over_5m')  // ₱5M

  return active
}

// ── Seed the checklist (idempotent via unique index) ─────────────────
export async function seedChecklist(caseRow: CaseRow, userId: string): Promise<void> {
  const active = evaluateConditions(caseRow)

  const rows = CHECKLIST_SEED_ITEMS
    .filter(item => active.has(item.condition))
    .map(item => ({
      case_id:       caseRow.id,
      user_id:       userId,
      category:      item.category,
      label:         item.label,
      source:        item.source,
      seed_id:       item.seed_id,
      is_applicable: true,
      is_checked:    false,
      notes:         '',
      sort_order:    item.sort_order,
    }))

  // upsert with ignoreDuplicates: unique index on (case_id, seed_id) prevents duplicates
  const { error } = await supabase
    .from('case_document_items')
    .upsert(rows, { onConflict: 'case_id,seed_id', ignoreDuplicates: true })

  if (error) throw error
}

// ── Load all items for a case ─────────────────────────────────────────
export async function loadChecklist(caseId: string): Promise<DocumentItemRow[]> {
  const { data, error } = await supabase
    .from('case_document_items')
    .select('*')
    .eq('case_id', caseId)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as DocumentItemRow[]
}

// ── Toggle is_checked ─────────────────────────────────────────────────
export async function toggleDocumentItem(
  itemId: string,
  isChecked: boolean,
  notes: string = ''
): Promise<void> {
  const { error } = await supabase
    .from('case_document_items')
    .update({ is_checked: isChecked, notes })
    .eq('id', itemId)

  if (error) throw error
}

// ── Toggle is_applicable (mark N/A or restore) ───────────────────────
export async function toggleItemApplicability(
  itemId: string,
  isApplicable: boolean
): Promise<void> {
  const { error } = await supabase
    .from('case_document_items')
    .update({ is_applicable: isApplicable, is_checked: false })
    .eq('id', itemId)

  if (error) throw error
}

// ── Update note only ──────────────────────────────────────────────────
export async function updateItemNote(itemId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('case_document_items')
    .update({ notes })
    .eq('id', itemId)

  if (error) throw error
}

// ── Add custom item ───────────────────────────────────────────────────
export async function addCustomItem(
  caseId: string,
  userId: string,
  category: ChecklistCategory,
  label: string,
  source: string
): Promise<DocumentItemRow> {
  const { data, error } = await supabase
    .from('case_document_items')
    .insert({
      case_id:       caseId,
      user_id:       userId,
      category,
      label:         label.trim(),
      source:        source.trim(),
      seed_id:       null,  // custom items have no seed_id
      is_applicable: true,
      is_checked:    false,
      notes:         '',
      sort_order:    9999,  // appended after seed items
    })
    .select()
    .single()

  if (error) throw error
  return data as DocumentItemRow
}

// ── Delete custom item (seed items cannot be deleted, only marked N/A) ─
export async function deleteCustomItem(itemId: string): Promise<void> {
  // Only allow deletion of custom items (seed_id IS NULL)
  const { error } = await supabase
    .from('case_document_items')
    .delete()
    .eq('id', itemId)
    .is('seed_id', null)  // guard: only custom items

  if (error) throw error
}
```

### 4.2 Progress Computation (Client-Side)

```typescript
// lib/checklist.ts (continued)
import type { ChecklistProgress, ChecklistCategory } from '@/types/checklist'

export function computeProgress(items: DocumentItemRow[]): ChecklistProgress {
  const applicable = items.filter(i => i.is_applicable)
  const obtained   = applicable.filter(i => i.is_checked)

  const by_category = {} as ChecklistProgress['by_category']
  const categories: ChecklistCategory[] = [
    'civil_status', 'real_property', 'personal_property',
    'business', 'bir', 'deed', 'post_settlement',
  ]
  for (const cat of categories) {
    const catItems = applicable.filter(i => i.category === cat)
    by_category[cat] = {
      total:    catItems.length,
      obtained: catItems.filter(i => i.is_checked).length,
    }
  }

  return {
    total:       applicable.length,
    obtained:    obtained.length,
    pct:         applicable.length > 0
                   ? Math.round((obtained.length / applicable.length) * 100)
                   : 0,
    by_category,
  }
}
```

### 4.3 useChecklist Hook

```typescript
// hooks/useChecklist.ts
import { useEffect, useState, useCallback } from 'react'
import { seedChecklist, loadChecklist, toggleDocumentItem, toggleItemApplicability,
         updateItemNote, addCustomItem, deleteCustomItem, computeProgress } from '@/lib/checklist'
import type { DocumentItemRow, ChecklistProgress, ChecklistCategory } from '@/types/checklist'
import type { CaseRow } from '@/types/db'

export function useChecklist(caseRow: CaseRow, userId: string) {
  const [items, setItems] = useState<DocumentItemRow[]>([])
  const [progress, setProgress] = useState<ChecklistProgress>({
    total: 0, obtained: 0, pct: 0, by_category: {} as ChecklistProgress['by_category'],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      await seedChecklist(caseRow, userId)          // idempotent — safe to call each time
      const loaded = await loadChecklist(caseRow.id)
      setItems(loaded)
      setProgress(computeProgress(loaded))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load checklist')
    } finally {
      setLoading(false)
    }
  }, [caseRow.id, userId])

  useEffect(() => { reload() }, [reload])

  function updateLocal(updatedItem: Partial<DocumentItemRow> & { id: string }) {
    setItems(prev => {
      const next = prev.map(i => i.id === updatedItem.id ? { ...i, ...updatedItem } : i)
      setProgress(computeProgress(next))
      return next
    })
  }

  async function toggle(itemId: string, isChecked: boolean, notes = '') {
    updateLocal({ id: itemId, is_checked: isChecked, notes })  // optimistic
    try {
      await toggleDocumentItem(itemId, isChecked, notes)
    } catch {
      updateLocal({ id: itemId, is_checked: !isChecked })      // rollback
    }
  }

  async function toggleApplicability(itemId: string, isApplicable: boolean) {
    updateLocal({ id: itemId, is_applicable: isApplicable, is_checked: false })
    await toggleItemApplicability(itemId, isApplicable)
  }

  async function saveNote(itemId: string, notes: string) {
    updateLocal({ id: itemId, notes })
    await updateItemNote(itemId, notes)
  }

  async function addItem(category: ChecklistCategory, label: string, source: string) {
    const newItem = await addCustomItem(caseRow.id, userId, category, label, source)
    setItems(prev => {
      const next = [...prev, newItem]
      setProgress(computeProgress(next))
      return next
    })
  }

  async function removeItem(itemId: string) {
    await deleteCustomItem(itemId)
    setItems(prev => {
      const next = prev.filter(i => i.id !== itemId)
      setProgress(computeProgress(next))
      return next
    })
  }

  return { items, progress, loading, error, toggle, toggleApplicability, saveNote, addItem, removeItem }
}
```

### 4.4 PDF Export Integration

When `include_checklist_in_pdf = true` (stored in case metadata or as UI toggle state):

The PDF generation function receives the checklist items and appends a "Document Checklist" section after the main distribution report.

```typescript
// In spec-pdf-export's generatePdf() function — new parameter
export interface PdfGenerateParams {
  input:            EngineInput
  output:           EngineOutput
  firmProfile:      FirmProfile | null
  checklistItems:   DocumentItemRow[] | null  // null = exclude from PDF
}
```

PDF checklist section layout:
```
APPENDIX A — Document Checklist
─────────────────────────────────────────────────────
Estate of Juan dela Cruz  •  Generated: 01 Mar 2026

Progress: 8 of 20 documents obtained (40%)

Identity & Civil Status                            2 of 5
  ☑  PSA-certified Death Certificate
  ☑  PSA-certified Birth Certificate of decedent
  ☐  PSA-certified Marriage Certificate
  ☐  PSA-certified Birth Certificates of all heirs
  ☐  Valid government IDs of all heirs

Real Property Documents                            1 of 3
  ☑  Certified True Copy of TCT for Lot 45-A
     Note: Obtained from RD-QC on 10 Feb 2026
  ☐  Latest Tax Declaration for Lot 45-A
  ☐  BIR Zonal Valuation for Quezon City (RDO 38)

BIR / Tax Documents                                0 of 5
  ☐  BIR Form 1801 (Estate Tax Return)
  ☐  TIN of the Estate (BIR-issued)
  ☐  Certified True Copy of the Last Will and Testament (if testate)
  ☐  Proof of payment of estate tax (BIR official receipt)
  ☐  eCAR (Electronic Certificate Authorizing Registration)

Other Documents                                    5 of 7
  ☑  Extrajudicial Settlement of Estate (draft)
  ☑  Affidavit of Publication (from newspaper)
  ☑  Notarized Deed of Extrajudicial Settlement
  ☑  Special Power of Attorney (for absentee heir)
  ☑  Deed of Absolute Sale (for sold property)
  ☐  Affidavit of No Creditors
  ☐  Surety bond (if estate includes personal property > ₱5,000)
```

---

## 5. Integration Points

### 5.1 Case Detail Tabs

The Document Checklist is a new tab in `CaseDetailPage`. The tabs are:

| Tab | Route fragment | When shown |
|-----|----------------|------------|
| Results | (default) | Always |
| Document Checklist | `#checklist` | Only for saved (authenticated) cases |
| Notes | `#notes` | Only for saved cases |
| BIR 1801 | `#bir` | Only for saved cases |

Anonymous (un-saved) cases do not show the checklist tab; it appears immediately after first save.

### 5.2 Dashboard Case Card

`ChecklistProgress` is included in the `CaseListItem` query as a subquery or stored summary:

```sql
-- Add to cases table for dashboard display (avoids live count query)
ALTER TABLE cases ADD COLUMN checklist_total     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cases ADD COLUMN checklist_obtained  INTEGER NOT NULL DEFAULT 0;
```

These columns are updated by a Postgres function called from the application each time a checklist item is toggled:

```typescript
// Called after any toggle/seed operation
export async function syncChecklistProgress(caseId: string): Promise<void> {
  const { error } = await supabase.rpc('sync_checklist_progress', { p_case_id: caseId })
  if (error) throw error
}
```

```sql
-- Supabase RPC function
CREATE OR REPLACE FUNCTION sync_checklist_progress(p_case_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total    INTEGER;
  v_obtained INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE is_applicable = TRUE),
    COUNT(*) FILTER (WHERE is_applicable = TRUE AND is_checked = TRUE)
  INTO v_total, v_obtained
  FROM case_document_items
  WHERE case_id = p_case_id;

  UPDATE cases
    SET checklist_total    = v_total,
        checklist_obtained = v_obtained
  WHERE id = p_case_id;
END;
$$;
```

### 5.3 Deadline Tracker (`spec-deadline-tracker`)

The deadline tracker already exists as a feature spec. When a lawyer checks off "BIR Form 1801 filed", the deadline tracker's BIR deadline item can be automatically resolved:

```typescript
// In toggle() — when item seed_id === 'bir-03' and isChecked === true:
// Optional: also resolve the BIR deadline item in the deadline tracker
// (implemented as a side-effect in useChecklist)
if (item.seed_id === 'bir-03' && isChecked) {
  await markDeadlineResolved(caseRow.id, 'bir_filing')
}
```

This linkage is optional in v1 (can be implemented as a future enhancement if the data model supports it).

### 5.4 Estate Tax Inputs Wizard (`spec-estate-tax-inputs-wizard`)

When the estate tax inputs wizard completes and `tax_input_json` is populated, the checklist should be **re-seeded** to add or hide asset-conditional items that were not visible before (e.g., if the wizard reveals 2 real properties that were previously unknown):

```typescript
// After estate tax wizard saves tax_input_json:
await seedChecklist(updatedCaseRow, userId)  // idempotent — only adds new items, never removes
// Then sync the dashboard counters:
await syncChecklistProgress(caseRow.id)
```

Items that were previously included (under the default-include fallback) but are now determined to be inapplicable are NOT automatically removed — the lawyer marks them N/A manually. This prevents unexpected data loss.

---

## 6. Edge Cases

### 6.1 Seeding Edge Cases

| Scenario | Handling |
|----------|----------|
| Checklist tab opened twice simultaneously (two browser tabs) | Unique index on `(case_id, seed_id)` prevents duplicate rows; second upsert is a no-op |
| Case has no `input_json` yet (draft never computed) | Seed with `always` items only (no family-tree-dependent items); lawyer can add custom items |
| Lawyer adds a custom item then re-seeds | Custom items (`seed_id IS NULL`) are never affected by seeding; seeding only adds new seed items |
| All items marked N/A | `progress.total = 0, pct = 0`; display: "All items marked not applicable" (no divide-by-zero) |
| Case is in `finalized` status | Checklist is read-only (no toggling); "This case is finalized — open in edit mode to update checklist" banner |

### 6.2 Validation Rules

| Field | Rule |
|-------|------|
| `label` (custom item) | 1–255 characters; must not be blank; trimmed |
| `source` (custom item) | 0–500 characters; optional |
| `notes` | 0–1000 characters |
| `category` | Must be one of the 7 valid values (DB CHECK constraint) |
| `seed_id` | Unique per `case_id` (partial unique index where `seed_id IS NOT NULL`) |

### 6.3 Permission Matrix

| Action | Required Condition |
|--------|-------------------|
| View checklist | Authenticated + case owner |
| Toggle is_checked | Authenticated + case owner + case status ≠ 'finalized' |
| Toggle is_applicable | Authenticated + case owner + case status ≠ 'finalized' |
| Edit note | Authenticated + case owner |
| Add custom item | Authenticated + case owner + case status ≠ 'finalized' |
| Delete custom item | Authenticated + case owner + item.seed_id IS NULL |
| Delete seed item | Not allowed (use Mark N/A instead) |
| View in shared link | Read-only view via share token (is_checked, label only; no notes shown) |

### 6.4 Re-Seeding After Asset Changes

If the lawyer updates the estate tax inputs to add a new real property after checklist was already seeded:
- Calling `seedChecklist()` again adds the new items (TCT, TD, eCAR for the new property)
- Items already in the DB are untouched (unique index prevents duplicate)
- Lawyer is shown a toast: "Checklist updated: 3 new items added for new real property"

The seeding function should return a count of newly inserted items to enable this toast.

### 6.5 Empty State

When a case has no checklist items at all (e.g., fresh case with no assets, anonymous):

```
┌───────────────────────────────────────────────────────────┐
│  No documents yet                                         │
│                                                           │
│  Save this case and open the checklist to auto-generate   │
│  a document list based on your estate inputs.             │
│                                                           │
│  [Save Case]                                              │
└───────────────────────────────────────────────────────────┘
```

---

## 7. Dependencies

**Must be built first:**
- `spec-auth-persistence` — `case_document_items` references `cases(id)` and `auth.users(id)`

**Should be built before but not strictly required:**
- `spec-bir-1801-integration` — enables asset-condition-based smart seeding from `tax_input_json`; without it, all asset-conditional items are default-included and the lawyer marks N/A as needed

**Works better alongside:**
- `spec-deadline-tracker` — BIR filing check-off can trigger deadline resolution
- `spec-pdf-export` — checklist included as optional appendix in PDF

**New dependency added to DDL migration:**
- `checklist_total` and `checklist_obtained` columns added to `cases` table (migration 005 or later)

**Package additions required:**
```bash
# No new npm packages — uses existing Supabase client
```

---

## 8. Acceptance Criteria

### Seeding
- [ ] Opening the checklist tab for the first time on a newly saved case auto-generates items within 2 seconds
- [ ] Re-opening the checklist tab does not create duplicate items
- [ ] A case with a married decedent includes the Marriage Certificate item; a case with no spouse does not
- [ ] A case with `has_heirs_abroad = true` includes the SPA item; one without overseas heirs does not
- [ ] A case with no estate tax data includes all asset-conditional items (default-include behavior)
- [ ] A case with estate tax data showing 2 real properties includes 3 items per property (TCT, TD, zonal)

### Toggling
- [ ] Clicking a checkbox immediately updates the UI (optimistic update) and persists to Supabase within 500ms
- [ ] Checking an item with a note opens an inline note field or optional modal
- [ ] Unchecking a checked item clears the check mark but retains the note
- [ ] Marking an item N/A removes it from the progress count and dims it
- [ ] Restoring a N/A item adds it back to the progress count

### Progress
- [ ] Progress bar updates in real-time as items are toggled
- [ ] Progress "X of Y" count excludes N/A items
- [ ] Dashboard case card shows `checklist_obtained/checklist_total` after sync
- [ ] 100% progress shows "All documents obtained" with a green checkmark visual

### Custom Items
- [ ] "Add Custom Item" opens modal with category dropdown and label/source fields
- [ ] Custom item appears in the correct category after saving
- [ ] Custom items can be deleted; seed items cannot be deleted (delete button hidden for seed items)

### PDF Export
- [ ] "Include in PDF Export" toggle adds the checklist as an appendix to the generated PDF
- [ ] PDF checklist shows item status (☑/☐), labels, and notes
- [ ] N/A items do not appear in the PDF checklist

### Finalized Cases
- [ ] Checklist is read-only when case status is 'finalized'
- [ ] A banner informs the lawyer the case is finalized
- [ ] No checkboxes or note fields are interactive in finalized state

### Security
- [ ] RLS prevents a user from reading another user's `case_document_items` (verify via direct Supabase query)
- [ ] Seed items cannot be deleted via API (seed_id guard in `deleteCustomItem`)
- [ ] Shared read-only case link shows checklist items (is_checked, label) without notes

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `supabase/migrations/005_document_checklist.sql` | NEW — `case_document_items` table DDL, RLS policies, `sync_checklist_progress` RPC, `checklist_total`/`checklist_obtained` columns on `cases` |
| `src/lib/checklist.ts` | NEW — seed, load, toggle, CRUD functions, computeProgress |
| `src/lib/checklistSeeds.ts` | NEW — static seed template (28 items across 7 categories) |
| `src/hooks/useChecklist.ts` | NEW — React hook wrapping all checklist operations |
| `src/types/checklist.ts` | NEW — ChecklistCategory, DocumentItemRow, ChecklistProgress types |
| `src/components/checklist/DocumentChecklistPanel.tsx` | NEW — main panel component |
| `src/components/checklist/ChecklistCategorySection.tsx` | NEW — collapsible category group |
| `src/components/checklist/ChecklistItem.tsx` | NEW — individual item row with checkbox, note, N/A toggle |
| `src/components/checklist/ChecklistProgressBar.tsx` | NEW — progress bar + X/Y count |
| `src/components/checklist/AddCustomItemModal.tsx` | NEW — custom item modal |
| `src/pages/CaseDetailPage.tsx` | MODIFY — add Document Checklist tab; wire useChecklist hook |
| `src/pages/Dashboard.tsx` | MODIFY — show `checklist_obtained/checklist_total` in case cards |
| `src/lib/cases.ts` | MODIFY — include `checklist_total, checklist_obtained` in CaseListItem select |
