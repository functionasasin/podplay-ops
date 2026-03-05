# Feature Spec: Donation Summary in Results View

**Aspect:** `spec-donation-summary-in-results`
**Wave:** 2 — Per-Feature Specification
**Status:** Complete
**Date:** 2026-03-01
**Reads:** `codebase-audit`
**Source:** Discovered during codebase-audit (donations list in `EngineInput` is not displayed in results)

---

## 1. Overview

The `EngineInput.donations[]` array captures every inter-vivos donation the decedent made to heirs (or to strangers) before death. These donations may be subject to collation under Art. 1061 NCC — the engine deducts collatable amounts from each heir's gross entitlement and records the imputed amount in `InheritanceShare.donations_imputed`.

**The problem:** The results view currently shows `donations_imputed` per heir (when non-zero) but never shows the original donation list. A lawyer reviewing a distribution with the client cannot answer "why was María's share reduced?" without going back to the wizard inputs.

**The feature:** A new `DonationsSummaryPanel` component inserted into `ResultsView` between `DistributionSection` and `NarrativePanel`. It renders the full donations list with recipient names, amounts, dates, descriptions, and collation status (exempt or collatable with legal basis). Cross-references `InheritanceShare.donations_imputed` to show the actual imputed amount per heir.

**Why a PH estate lawyer would pay for this:**
- Clients ask "why is my share less than my sibling's?" — the donations panel answers it directly
- Auditable transparency for BIR review of collation computations
- Required for professional-grade legal reports that accompany estate settlement filings
- Art. 1061 NCC collation disputes are common; a clear table forestalls family conflicts

**Implementation scope:** Pure frontend, no backend. Reads `input.donations` and `output.per_heir_shares` already present in `ResultsView` props.

---

## 2. Data Model

No new tables or API calls. All data is already present at the results phase:

```typescript
// Already in ResultsView props:
input: EngineInput       // → input.donations: Donation[]
                         // → input.family_tree: Person[]
output: EngineOutput     // → output.per_heir_shares: InheritanceShare[]
                         //   .donations_imputed: Money  (imputed per heir)
```

**Derived data (computed client-side in DonationsSummaryPanel):**

```typescript
// Recipient name resolution:
// For each donation:
//   if donation.recipient_is_stranger → "Stranger (not in family tree)"
//   else → input.family_tree.find(p => p.id === donation.recipient_heir_id)?.name ?? "Unknown Heir"

// Imputed amount resolution:
// For each donation with recipient_heir_id:
//   output.per_heir_shares.find(s => s.heir_id === donation.recipient_heir_id)?.donations_imputed
//   NOTE: donations_imputed is the TOTAL imputed across all donations to that heir;
//         if multiple donations exist for the same heir, the column shows the per-heir total,
//         with a note "(total for all donations to this heir)"

// Collation status:
// See §5 CollationStatus logic below
```

**Collation status derivation (pure function, no WASM call):**

```typescript
type CollationStatus =
  | { kind: 'exempt'; reason: string; ncc_article: string }
  | { kind: 'collatable'; ncc_article: string }
  | { kind: 'stranger'; ncc_article: string };

function getDonationCollationStatus(donation: Donation): CollationStatus {
  if (donation.recipient_is_stranger) {
    return { kind: 'stranger', ncc_article: 'Art. 909 ¶2 NCC' };
  }
  if (donation.is_expressly_exempt) {
    return { kind: 'exempt', reason: 'Expressly Exempt (donor declared)', ncc_article: 'Art. 1062 NCC' };
  }
  if (donation.is_support_education_medical) {
    return { kind: 'exempt', reason: 'Support, Education, or Medical', ncc_article: 'Art. 1067 NCC' };
  }
  if (donation.is_customary_gift) {
    return { kind: 'exempt', reason: 'Customary Gift', ncc_article: 'Art. 1065 NCC' };
  }
  if (donation.is_professional_expense) {
    return { kind: 'exempt', reason: 'Professional/Business Expense', ncc_article: 'Art. 1068 NCC' };
  }
  if (donation.is_joint_from_both_parents) {
    return { kind: 'exempt', reason: 'Joint Gift from Both Parents', ncc_article: 'Art. 1066 NCC' };
  }
  if (donation.is_to_child_spouse_only) {
    return { kind: 'exempt', reason: "Gift to Child's Spouse Only", ncc_article: 'Art. 1066 NCC' };
  }
  if (donation.is_joint_to_child_and_spouse) {
    return { kind: 'exempt', reason: 'Joint Gift to Child and Spouse', ncc_article: 'Art. 1066 NCC' };
  }
  if (donation.is_wedding_gift) {
    return { kind: 'exempt', reason: 'Wedding Gift', ncc_article: 'Art. 1065 NCC' };
  }
  if (donation.is_debt_payment_for_child) {
    return { kind: 'exempt', reason: 'Debt Payment for Child', ncc_article: 'Art. 1063 NCC' };
  }
  if (donation.is_election_expense) {
    return { kind: 'exempt', reason: 'Election Expense', ncc_article: 'Art. 1068 NCC' };
  }
  if (donation.is_fine_payment) {
    return { kind: 'exempt', reason: 'Fine Payment', ncc_article: 'Art. 1068 NCC' };
  }
  return { kind: 'collatable', ncc_article: 'Art. 1061 NCC' };
}
```

---

## 3. UI Design

### 3.1 Placement in ResultsView

```
ResultsView (space-y-8)
├── ResultsHeader
├── DistributionSection           ← distribution table with donations_imputed column
├── [NEW] DonationsSummaryPanel  ← INSERTED HERE — explains the collation above
├── NarrativePanel
├── WarningsPanel
├── ComputationLog
└── ActionsBar
```

Placement rationale: Immediately after `DistributionSection` so the lawyer can see the distribution table (which may show `donations_imputed` deductions) and then look down to see exactly what donations caused those deductions.

### 3.2 DonationsSummaryPanel Wireframe

Panel is hidden entirely when `input.donations.length === 0`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ↙ Advances on Inheritance (Donations Subject to Collation)         │
│  Art. 1061 NCC — Compulsory heirs must bring inter-vivos donations  │
│  into the mass of the estate.                                        │
├──────┬─────────────────────┬────────────┬──────────────────┬────────┤
│  #   │ Recipient           │ Date       │ Value Donated    │ Status │
├──────┼─────────────────────┼────────────┼──────────────────┼────────┤
│  1   │ Remedios Santos     │ 2018-03-15 │ ₱500,000         │ ●      │
│      │ (Legitimate Child)  │            │                  │ Collatb│
│      │                     │            │                  │ Art.   │
│      │                     │            │                  │ 1061   │
│      │ "Land in Batangas"  │            │ Imputed from     │        │
│      │                     │            │ share: ₱500,000  │        │
├──────┼─────────────────────┼────────────┼──────────────────┼────────┤
│  2   │ Juan dela Cruz Jr.  │ 2020-06-01 │ ₱200,000         │ ○      │
│      │ (Legitimate Child)  │            │                  │ Exempt │
│      │ "Tuition fees"      │            │                  │ Supprt/│
│      │                     │            │                  │ Educ.  │
│      │                     │            │                  │ Art.   │
│      │                     │            │                  │ 1067   │
├──────┼─────────────────────┼────────────┼──────────────────┼────────┤
│  3   │ Stranger            │ 2021-09-30 │ ₱100,000         │ ▲      │
│      │ (Not in family tree)│            │                  │ Collatb│
│      │ "Business loan"     │            │                  │ Strngr │
│      │                     │            │                  │ Art.909│
│      │                     │            │                  │ ¶2     │
└──────┴─────────────────────┴────────────┴──────────────────┴────────┘
  Totals:  3 donations    Collatable: 2   Exempt: 1    Stranger: 1
```

### 3.3 Full Column Specification

| Column | Width | Content |
|--------|-------|---------|
| **#** | 3rem | 1-based index |
| **Recipient** | 30% | `heir_name` (from family_tree lookup) + relationship badge<br>Sub-row: italic description text (if non-empty) |
| **Date** | 10rem | `donation.date` formatted as `MMM D, YYYY` (e.g., "Mar 15, 2018") |
| **Value Donated** | 15% | `formatPeso(value_at_time_of_donation)` |
| **Imputed from Share** | 15% | `formatPeso(per_heir_shares[heir_id].donations_imputed)` if `kind === 'collatable'` or `kind === 'stranger'`<br>"Not imputed" (muted) if `kind === 'exempt'`<br>"—" if recipient is stranger (imputed across estate, not one heir) |
| **Status** | 20% | Status badge + NCC article citation |

### 3.4 Status Badge Colors

| Status Kind | Badge Color | Label |
|-------------|-------------|-------|
| `collatable` | amber/yellow | "Collatable · Art. 1061 NCC" |
| `exempt` | green | "Exempt · [reason]" |
| `stranger` | slate | "Stranger · Art. 909 ¶2 NCC" |

### 3.5 Summary Footer Row

Below the table, a footer row:

```
3 donations · 1 collatable · 1 exempt · 1 to stranger
Total donated to heirs: ₱700,000 · Total imputed: ₱500,000
```

Where:
- **Total donated to heirs** = sum of `value_at_time_of_donation` for all donations where `!recipient_is_stranger`
- **Total imputed** = sum of all `per_heir_shares[*].donations_imputed` (from output, not re-computed)

### 3.6 Component Wireframe (ASCII — detailed layout)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Gift icon]  Advances on Inheritance                              [▲ hide] │
│              Art. 1061 NCC — Inter-vivos donations from the decedent       │
│              to compulsory heirs are charged against their share.           │
├────────────────────────────────────────────────────────────────────────────┤
│ #  │ Recipient                    │ Date         │ Value      │ Status      │
│────┼──────────────────────────────┼──────────────┼────────────┼─────────────│
│ 1  │ Remedios Santos              │ Mar 15, 2018 │ ₱500,000   │ [AMBER]     │
│    │ [Legitimate Child badge]     │              │            │ Collatable  │
│    │ ↳ "Land in Batangas"         │              │ ─────────  │ Art.1061 NCC│
│    │                              │              │ Imputed:   │             │
│    │                              │              │ ₱500,000   │             │
├────┼──────────────────────────────┼──────────────┼────────────┼─────────────┤
│ 2  │ Juan dela Cruz Jr.           │ Jun 1, 2020  │ ₱200,000   │ [GREEN]     │
│    │ [Legitimate Child badge]     │              │            │ Exempt      │
│    │ ↳ "Tuition and board fees"   │              │ Not imputed│ Support/    │
│    │   "AY 2020–2021"             │              │            │ Education   │
│    │                              │              │            │ Art.1067 NCC│
├────┼──────────────────────────────┼──────────────┼────────────┼─────────────┤
│ 3  │ Stranger                     │ Sep 30, 2021 │ ₱100,000   │ [SLATE]     │
│    │ Not in family tree           │              │            │ Stranger    │
│    │ ↳ "Business loan guarantee"  │              │ Estate adj.│ Art.909 ¶2  │
│    │                              │              │            │ NCC         │
├────┴──────────────────────────────┴──────────────┴────────────┴─────────────┤
│  3 donations  ·  1 collatable  ·  1 exempt  ·  1 to stranger              │
│  Total donated to heirs: ₱700,000  ·  Total imputed from shares: ₱500,000  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Collapsible Behavior

The panel uses the same `Accordion` shadcn/ui pattern as `ComputationLog`:
- Default state: **open** (expanded) — donation data is important for client meetings
- Toggle: `[▲ hide]` / `[▼ show]` label in header
- For print (@media print): always fully expanded, accordion state ignored

---

## 4. Component API

### 4.1 DonationsSummaryPanel Props

```typescript
interface DonationsSummaryPanelProps {
  donations: Donation[];          // from input.donations
  persons: Person[];              // from input.family_tree (for name lookup)
  shares: InheritanceShare[];     // from output.per_heir_shares (for imputed amounts)
}
```

Returns `null` immediately when `donations.length === 0`.

### 4.2 Placement in ResultsView

```tsx
// ResultsView.tsx — add after DistributionSection, before NarrativePanel
<DonationsSummaryPanel
  donations={input.donations}
  persons={input.family_tree}
  shares={output.per_heir_shares}
/>
```

No changes to existing ResultsView props — all required data is already passed via `input` and `output`.

### 4.3 Helper Types (internal to component)

```typescript
// Internal to DonationsSummaryPanel:
interface DonationRow {
  index: number;                   // 1-based
  donation: Donation;
  recipientName: string;           // resolved from persons lookup or "Stranger"
  recipientRelationship: string;   // e.g., "Legitimate Child" or "Not in family tree"
  collationStatus: CollationStatus; // see §2
  imputedCentavos: number;         // 0 if exempt or stranger, per-heir total otherwise
}
```

### 4.4 PDF Section Integration

When `DonationsSummaryPanel` data is included in PDF export (`spec-pdf-export`), the section is titled:

```
ADVANCES ON INHERITANCE (DONATIONS INTER VIVOS)
(Art. 1061, New Civil Code)
```

Table in PDF:
| # | Recipient | Date | Value Donated | Collation Status | Imputed from Share |
|---|---|---|---|---|---|
| 1 | Remedios Santos (Legitimate Child) | Mar 15, 2018 | ₱500,000.00 | Collatable (Art. 1061 NCC) | ₱500,000.00 |
| 2 | Juan dela Cruz Jr. (Legitimate Child) | Jun 1, 2020 | ₱200,000.00 | Exempt — Support/Education (Art. 1067 NCC) | Not imputed |
| 3 | Stranger | Sep 30, 2021 | ₱100,000.00 | Stranger — Collatable (Art. 909 ¶2 NCC) | Estate adjustment |

The PDF section is omitted when `input.donations.length === 0`.

---

## 5. Edge Cases

### 5.1 Empty State (no donations)

When `input.donations.length === 0`, the component returns `null` with no visible output. No empty-state card is shown. This prevents noise in the 90% of cases where no donations exist.

### 5.2 Multiple Donations to the Same Heir

If donations exist for the same `recipient_heir_id`, each donation is shown as a separate row. The "Imputed from Share" column shows the **per-heir total** (from `InheritanceShare.donations_imputed`) on each row where `kind === 'collatable'`, with a tooltip explaining: "This is the total imputed amount for all collatable donations to this heir, not the amount for this specific donation."

The total imputed per heir is the engine's output — the per-donation breakdown is not available from the engine (engine collation is calculated at the heir level). This is explicitly noted in the UI.

### 5.3 Recipient Heir Not in per_heir_shares

If `donation.recipient_heir_id` does not appear in `output.per_heir_shares` (heir was excluded — e.g., disinherited), the "Imputed from Share" column shows "Heir excluded from distribution" in muted text.

### 5.4 Heir in per_heir_shares with Zero donations_imputed but Donation Listed as Collatable

This can happen when the engine determines the donation is exempt despite no exemption flag being set (e.g., edge cases in the Rust engine). Show the engine's result (₱0 imputed) with a tooltip: "The engine determined no imputation was required. See Computation Log for details."

### 5.5 Stranger Donations — No Imputed Amount Shown

For stranger donations (`recipient_is_stranger === true`), no per-heir imputed amount is shown. Stranger donations reduce the net distributable estate before division; the reduction is visible in the total estate value, not in individual heir shares. The "Imputed from Share" column shows "Estate adjustment" in muted italic text.

### 5.6 Very Long Description Text

`donation.description` may be up to 500 characters. The description sub-row is truncated to 2 lines with a `...` overflow and a "show more" toggle (small text link beneath the truncated text).

### 5.7 Date Formatting for Missing or Partial Dates

If `donation.date` is empty string: show "Date not specified" in muted text. If the date string is valid ISO 8601 (YYYY-MM-DD): format as "MMM D, YYYY" using `Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })`.

### 5.8 Zero-Value Donation

If `value_at_time_of_donation.centavos === 0`: show "₱0" for the value and display a warning icon with tooltip: "A zero-value donation will have no effect on collation."

### 5.9 Professional Expense with Imputed Savings

When `donation.is_professional_expense === true` and `donation.professional_expense_imputed_savings !== null`, the value shown is `professional_expense_imputed_savings` (the engine uses the imputed savings figure, not the full expense, for collation). Show both values:
- "Expense: ₱[full amount]"
- "Imputed: ₱[imputed_savings]"

with a tooltip: "Only the imputed savings portion is subject to collation under Art. 1068 NCC."

---

## 6. Integration Points

| Feature | Integration |
|---------|-------------|
| `spec-pdf-export` | Add "Advances on Inheritance" table section when donations exist. See §4.4 for PDF table structure. Section heading: "ADVANCES ON INHERITANCE (DONATIONS INTER VIVOS) — Art. 1061 NCC". |
| `spec-print-layout` | Panel must be fully expanded in print view. Do not use Accordion collapse in print. All rows visible, description text not truncated. |
| `spec-share-breakdown-panel` | Share breakdown panel shows `donations_imputed` and `gross_entitlement` per heir. DonationsSummaryPanel shows the source donations that generate those imputed amounts. Together they provide a complete collation audit trail. |
| `spec-scenario-comparison` | Comparison view runs the same `input` with and without a will. `input.donations` is identical in both runs. DonationsSummaryPanel shows the same donation list in both comparison columns. Imputed amounts may differ between runs if representation changes. |
| `spec-bir-1801-integration` | Donations to strangers reduce the net distributable estate and feed into BIR Form 1801 Schedule 2 (Donations Made by Decedent). The panel provides visibility into which donations are relevant to BIR filing. |
| `spec-case-notes` | No direct integration. The lawyer may add notes referencing donation details, but the panel is read-only. |

---

## 7. Dependencies

| Dependency | Reason |
|------------|--------|
| None (pure frontend) | All data available from existing `EngineInput` and `EngineOutput` already in `ResultsView` props. No new state, no network calls, no auth required. |

This feature is safe to build as the first Wave 2 implementation item because it has zero dependencies on other premium features.

---

## 8. Acceptance Criteria

- [ ] `DonationsSummaryPanel` renders nothing when `input.donations.length === 0`
- [ ] When 1+ donations exist, the panel appears between `DistributionSection` and `NarrativePanel`
- [ ] Each donation row shows: index, recipient name (heir name or "Stranger"), recipient relationship label, formatted date, formatted amount, collation status badge with NCC article
- [ ] Recipient name is resolved from `input.family_tree` via `person.id === donation.recipient_heir_id`; stranger donations show "Stranger / Not in family tree"
- [ ] Collation status `kind === 'collatable'` renders amber badge with "Collatable · Art. 1061 NCC"
- [ ] Collation status `kind === 'exempt'` renders green badge with "Exempt · [reason]" and correct NCC article per exemption type
- [ ] Collation status `kind === 'stranger'` renders slate badge with "Stranger · Art. 909 ¶2 NCC"
- [ ] "Imputed from Share" column shows `formatPeso(share.donations_imputed)` for collatable heir donations (not zero)
- [ ] "Imputed from Share" shows "Not imputed" for exempt donations
- [ ] "Imputed from Share" shows "Estate adjustment" for stranger donations
- [ ] Summary footer row shows total donation count, counts by status, total donated to heirs (₱), and total imputed (₱)
- [ ] Panel is collapsible (shadcn Accordion); default state is open
- [ ] Description text is shown in a sub-row with italic styling; truncated at 2 lines with "show more" if >120 chars
- [ ] Panel is fully expanded and not collapsible in `@media print`
- [ ] Component file is at `components/results/DonationsSummaryPanel.tsx`
- [ ] All monetary values use `formatPeso()` from `../../types`
- [ ] Zero-donation scenario (empty panel) verified with a test case that has `donations: []`
- [ ] Single-donation collatable scenario verified: imputed amount matches engine output
- [ ] Single-donation exempt scenario verified: "Not imputed" shown, green badge
- [ ] Stranger donation scenario verified: slate badge, "Estate adjustment" in imputed column
