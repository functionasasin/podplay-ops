# Feature Spec: Statute Citations UI

**Aspect:** spec-statute-citations-ui
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** codebase-audit
**No backend dependencies — purely frontend**

---

## 1. Overview

The inheritance engine already computes `legal_basis: string[]` for every heir (e.g., `["Art. 887 NCC", "Art. 980 NCC"]`). These article codes are currently rendered as small secondary `<Badge>` elements in the "Legal Basis" column of `HeirTable` — raw codes with no descriptions. A lawyer looking at "Art. 887 NCC" must recall from memory what that article says.

This feature transforms those raw badges into **interactive statute citations** with:
1. **Tooltip on hover/tap** — shows a plain-English description of the article
2. **Expandable citation panel per heir row** — expanded view lists each article with its number and full short description in a structured layout suitable for client presentations

This is purely a **frontend enhancement** to `DistributionSection.tsx` and `HeirTable`. No database tables, no Supabase, no new dependencies (the shadcn `Tooltip` component is already installed). One new data file is required: `src/data/ncc-articles.ts` — a static lookup table. This file is **shared with spec-pdf-export** (referenced there as `src/data/ncc-articles.ts` for the NCC_ARTICLE_DESCRIPTIONS export).

**Why a PH estate lawyer needs this:**
- Clients ask "why does Maria only get 1/4?" — lawyer can point to Art. 892 and read the tooltip explanation
- In client consultations, the distribution table is shown on a laptop or tablet; interactive citations avoid having to print a separate NCC excerpt
- Legal credibility: seeing "Art. 887, New Civil Code — Compulsory heirs: legitimate children, parents, surviving spouse, illegitimate children" next to a share amount is more convincing than "Art. 887 NCC"
- Junior staff (paralegals) can verify computations against article descriptions without memorizing the NCC

---

## 2. Data Model

No database tables required. Entirely static data + client-side state.

### 2.1 Static Data File: `src/data/ncc-articles.ts`

This file is the **single authoritative source** for NCC article descriptions used by both this feature and `spec-pdf-export`. The key is the bare article number string (e.g., `"887"`). Lookups strip "Art. " prefix and " NCC" / "NCC" suffix before querying.

```typescript
// src/data/ncc-articles.ts
// Philippine New Civil Code (NCC) article descriptions for the inheritance engine.
// Key: bare article number string (e.g. "887")
// Value: plain-English short description (≤100 characters)
// Covers all articles emitted by the inheritance engine in legal_basis[].

export const NCC_ARTICLE_DESCRIPTIONS: Record<string, string> = {
  // ── GENERAL SUCCESSION ──────────────────────────────────────────────────────
  '774':  'Inheritance — transmission of property, rights, and obligations upon death',
  '776':  'Inheritance includes all property, rights, and obligations not extinguished by death',
  '777':  'Rights to succession are transmitted from the moment of the decedent\'s death',
  '782':  'Legatee/devisee defined — one who receives a specific legacy or devise by will',
  '783':  'Will — act by which a person disposes of estate, to take effect after death',
  '804':  'Will must be in writing, executed in a language or dialect known to the testator',
  '838':  'No will shall pass real or personal property without being probated',
  '840':  'Institution of heir — act of giving a person a part of the estate by will',
  '846':  'Equal division — heirs with unspecified shares divide equally',
  '847':  'Collective institution — "children of A" as a class takes equal shares',
  '851':  'Residuary institution — heir takes remainder after all specific legacies/devises',
  '854':  'Preterition — omission of a compulsory heir in the direct line annuls institution of heirs',
  '855':  'Preterition effect — intestate succession applies to the portion that should have gone to omitted heir',
  '859':  'Substitution — testator may designate a second heir if first predeceases, repudiates, or is incapacitated',
  '863':  'Fideicommissary substitution — fiduciary must preserve and transmit estate to fideicommissary',
  '872':  'Testator may not impose a charge, condition, or substitution that diminishes the legitime',
  // ── LEGITIME ─────────────────────────────────────────────────────────────────
  '886':  'Legitime — portion reserved by law that testator cannot freely dispose of',
  '887':  'Compulsory heirs: legitimate children/descendants, parents/ascendants, surviving spouse, illegitimate children',
  '888':  'Legitimate children\'s legitime = 1/2 of estate (shared equally among all)',
  '889':  'Legitimate parents\' or ascendants\' legitime = 1/2 of estate',
  '890':  'Ascendants\' legitime when illegitimate children also survive = 1/4 of estate',
  '891':  'Reserva troncal — property from ascendant by gratuitous title is reserved for relatives within 3rd degree',
  '892':  'Surviving spouse\'s legitime concurring with legitimate children',
  '893':  'Surviving spouse\'s legitime concurring with legitimate ascendants = 1/4 of estate',
  '894':  'Surviving spouse\'s legitime concurring with illegitimate children = 1/3 each',
  '895':  'Illegitimate children\'s legitime = 1/2 of each legitimate child\'s share (subject to free-portion cap)',
  '896':  'When no legitimate children: illegitimate children\'s legitime = 1/4 of estate',
  '899':  'Legitimate children + illegitimate children + surviving spouse: LC=1/2, SS=1/4, IC split remaining',
  '900':  'Surviving spouse alone: legitime = 1/2 of estate (or 1/3 in articulo mortis marriage)',
  '901':  'Illegitimate children alone: collective legitime = 1/2 of estate',
  '902':  'Illegitimate child\'s legitime transmitted to their own legitimate and illegitimate children if heir predeceases',
  '903':  'Parents of illegitimate decedent: their legitime = 1/2 of estate',
  // ── REDUCTION OF TESTAMENTARY DISPOSITIONS ────────────────────────────────
  '906':  'Preterited compulsory heir shall receive their legitime',
  '908':  'Gross estate for legitime = net estate plus collatable donations from heirs',
  '909':  'Donations by will (mortis causa): valued at time of execution of will',
  '910':  'Donations inter vivos charged to the portion of the estate the donor can freely dispose of',
  '911':  'Order of reduction: (1) voluntary institutions pro rata, (2) non-preferred legacies/devises, (3) preferred',
  '912':  'When devise reduced by ≥1/2 its value, compulsory heir may opt to take property and pay the reducible amount',
  // ── DISINHERITANCE ───────────────────────────────────────────────────────────
  '916':  'Disinheritance can only be made through a valid will',
  '917':  'Disinheritance must be for a legal cause expressly stated in the will',
  '918':  'Invalid disinheritance is treated as if not made — heir reinstated to their share',
  '919':  'Grounds for disinheriting a child or descendant (8 enumerated causes)',
  '920':  'Grounds for disinheriting a parent or ascendant (8 enumerated causes)',
  '921':  'Grounds for disinheriting a spouse (6 enumerated causes)',
  '922':  'Reconciliation between testator and disinherited heir revokes disinheritance',
  '923':  'Children of disinherited heir may represent the parent in the legitime; not in free portion',
  // ── INTESTATE SUCCESSION ─────────────────────────────────────────────────────
  '960':  'Intestate succession opens when: no will, void/ineffective will, or heir repudiates',
  '962':  'Order of intestate succession: children → parents → siblings → other relatives → state',
  '966':  'Degree of relationship: each generation = one degree (parents=1st degree, grandparents=2nd)',
  '969':  'Heirs who repudiate or are incapacitated: portion goes to co-heirs in own right, not by representation',
  '970':  'Right of representation — heir takes share that predeceased heir would have taken',
  '972':  'Representation in direct descending line: always allowed, even to infinite degrees',
  '974':  'Representation in collateral line: only to nephews/nieces (children of siblings)',
  '975':  'Children of a repudiating heir may represent the parent; they take by representation, not in own right',
  '977':  'Heirs who repudiate cannot be represented — representation only applies to predecease/incapacity',
  '980':  'Legitimate children inherit in equal shares; each takes estate ÷ number of children',
  '982':  'Grandchildren and other descendants represent predeceased legitimate children',
  '987':  'Relatives of the same degree inherit in equal shares',
  '988':  'Illegitimate children succeed intestate; share = 1/2 of each legitimate child\'s share',
  '991':  'Illegitimate children may be represented by their descendants (own children)',
  '992':  'Iron Curtain Rule — illegitimate child cannot inherit ab intestato from legitimate relatives of parent',
  '995':  'Surviving spouse with legitimate children: spouse takes share equal to one LC share',
  '996':  'Surviving spouse only: takes entire estate',
  '997':  'Surviving spouse with legitimate ascendants: each takes 1/2 of estate',
  '998':  'Surviving spouse with illegitimate children: spouse = 1/3, IC collectively = 1/3, remainder to others',
  '1000': 'Illegitimate children with legitimate ascendants: ascendants = 1/2, IC collectively = 1/2',
  '1001': 'Surviving spouse alone (no descendants, no ascendants): inherits entire estate',
  '1002': 'Guilty spouse in legal separation is not entitled to intestate share',
  '1004': 'Collateral relatives of same degree: inherit in equal shares',
  '1005': 'Brothers and sisters may be represented by their nephews and nieces',
  '1006': 'Full blood siblings receive twice the share of half blood siblings',
  '1007': 'Half blood siblings take 1/2 of full blood sibling share',
  '1008': 'Nephews and nieces representing a predeceased parent: take only what parent would have taken',
  '1009': 'No other collateral relative: estate goes to surviving spouse',
  '1010': 'No surviving spouse or collateral: estate escheats to municipal/city government',
  '1011': 'Estate escheats to the State (Republic of the Philippines) if no heirs exist',
  // ── ACCRETION ─────────────────────────────────────────────────────────────────
  '1016': 'Accretion — vacant portion accretes to co-heirs in same proportion as their shares',
  '1017': 'Accretion in testamentary succession conditions',
  '1018': 'Accretion in intestate succession',
  '1019': 'Accretion — co-heir who accepts takes full accreted share; cannot separately renounce accreted part',
  '1020': 'Accretion without co-heirs: passes to heirs of next degree by intestate rules',
  '1021': 'Vacant legitime: accretes to co-compulsory heirs in own right (not by representation)',
  '1022': 'Vacant legacy/devise: accretes to heir(s) designated the same property',
  // ── CAPACITY AND UNWORTHINESS ─────────────────────────────────────────────────
  '1032': 'Grounds for incapacity by reason of unworthiness (6 causes)',
  '1033': 'Unworthiness condoned by testator in a will or public document — heir reinstated',
  '1035': 'Heir incapacitated by unworthiness may be represented by their children',
  '1050': 'Repudiation of inheritance — heir who renounces cannot be represented',
  // ── COLLATION ─────────────────────────────────────────────────────────────────
  '1061': 'Compulsory heirs must collate (return to computation) all donations received in life',
  '1062': 'Collation not required if donor expressly exempts the donation',
  '1064': 'Donation expressly charged to heir\'s free portion: not collated; does not reduce legitime',
  '1066': 'Donation made to child and their spouse: only child\'s half is collatable',
  '1067': 'Exempt from collation: support, education, medical, emergency, customary gifts',
  '1068': 'Professional expenses (tuition, apprenticeship): collatable unless expressly exempted',
  '1069': 'Collatable items: debts paid, election expenses, fines, other ordinary expenses',
  '1070': 'Wedding gifts: collatable only if value exceeds 1/10 of free portion',
  '1071': 'Collation is made at value of donation at time of gift (not current value)',
  '1072': 'Joint donation from two parents: each contributes 1/2 to collation',
  '1073': 'Property donated in kind: returned in kind unless agreed otherwise',
  '1077': 'Partition of estate: provisions on collation apply analogously',
  // ── FAMILY CODE REFERENCES ───────────────────────────────────────────────────
  'FC172': 'Filiation of legitimate children: established by birth certificate or final judgment',
  'FC176': 'Illegitimate children: use surname of mother; entitled to support and legitime',
  'FC179': 'Legitimation of illegitimate children: by subsequent valid marriage of parents',
};

/**
 * Parse an article string from legal_basis[] into a lookup key.
 * Handles formats:
 *   "Art. 887 NCC"   → "887"
 *   "Art. 887"       → "887"
 *   "Art. FC 172"    → "FC172"
 *   "FC Art. 176"    → "FC176"
 *   "NCC Art. 888"   → "888"
 */
export function parseArticleKey(article: string): string {
  // Family Code: "Art. FC 172", "FC Art. 176", "FC Art. 172"
  const fcMatch = article.match(/FC\s*Art\.?\s*(\d+)|Art\.?\s*FC\s*(\d+)/i);
  if (fcMatch) return `FC${fcMatch[1] ?? fcMatch[2]}`;

  // Standard NCC: "Art. 887 NCC", "Art. 887", "NCC Art. 888"
  const nccMatch = article.match(/Art\.?\s*(\d+)/i);
  if (nccMatch) return nccMatch[1];

  return article; // fallback: return as-is
}

/**
 * Get the description for an article string from legal_basis[].
 * Returns undefined if article is not in the lookup.
 */
export function getArticleDescription(article: string): string | undefined {
  return NCC_ARTICLE_DESCRIPTIONS[parseArticleKey(article)];
}
```

### 2.2 Client-Side State

The only state needed is a per-row expanded boolean, managed locally in `HeirTable`:

```typescript
// Inside HeirTable component — no external state needed
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

function toggleRow(heirId: string) {
  setExpandedRows(prev => {
    const next = new Set(prev);
    if (next.has(heirId)) next.delete(heirId);
    else next.add(heirId);
    return next;
  });
}
```

---

## 3. UI Design

### 3.1 Enhanced HeirTable Row — Default State

The "Legal Basis" column changes from plain badge clusters to interactive badges with tooltip + a chevron button to expand the citation panel.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Name          │ Category    │ Net from Estate │ Legal Basis                    │     │
├───────────────┼─────────────┼─────────────────┼────────────────────────────────┼─────┤
│ Maria Santos  │ Legit Child │ ₱1,000,000      │ [Art. 887]  [Art. 980]  [⌄]   │     │
├───────────────┼─────────────┼─────────────────┼────────────────────────────────┼─────┤
│ Jose Santos   │ Legit Child │ ₱1,000,000      │ [Art. 887]  [Art. 980]  [⌄]   │     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                                        ↑
                                          Each badge has a Tooltip on hover
```

Each article badge:
- Renders with `variant="secondary"` (same as current)
- On hover/focus: shows a `Tooltip` with description text
- Badge text: `"Art. 887"` (strip " NCC" suffix for brevity — full form in tooltip)

The chevron `[⌄]` button is an icon-only `Button variant="ghost" size="icon"` using `ChevronDown` (collapsed) / `ChevronUp` (expanded) from `lucide-react`.

**Hover tooltip anatomy:**
```
 ┌─────────────────────────────────────────────────────────┐
 │  Art. 887, New Civil Code                               │
 │  Compulsory heirs: legitimate children, parents,        │
 │  surviving spouse, illegitimate children                │
 └─────────────────────────────────────────────────────────┘
         ▲
   [Art. 887]   ← badge the user is hovering
```

### 3.2 Expanded Citation Panel

When the chevron is clicked, a citation panel expands **below the heir row** (full-width, spanning all columns via a second `<TableRow>` with `colSpan`):

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Name          │ Category    │ Net from Estate │ Legal Basis                    │     │
├───────────────┼─────────────┼─────────────────┼────────────────────────────────┼─────┤
│ Maria Santos  │ Legit Child │ ₱1,000,000      │ [Art. 887]  [Art. 980]  [⌃]   │     │
├───────────────────────────────────────────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Statutory Basis for Maria Santos's Share                                      │  │
│  │  ─────────────────────────────────────────────────────────────────────────    │  │
│  │  Art. 887, New Civil Code                                                      │  │
│  │  Compulsory heirs: legitimate children, legitimate parents, surviving           │  │
│  │  spouse, illegitimate children                                                  │  │
│  │                                                                                 │  │
│  │  Art. 980, New Civil Code                                                      │  │
│  │  Legitimate children inherit in equal shares; each takes estate ÷ number       │  │
│  │  of children                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
├───────────────┼─────────────┼─────────────────┼────────────────────────────────┼─────┤
│ Jose Santos   │ Legit Child │ ₱1,000,000      │ [Art. 887]  [Art. 980]  [⌄]   │     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

The citation panel is a `<TableRow>` with a single `<TableCell colSpan={totalColumns}>` containing a `<div className="px-3 py-3 bg-muted/30 rounded-md mx-1 my-1">`.

Each article in `legal_basis[]` is rendered as a citation block:

```
  Art. 887, New Civil Code
  ───────────────────────────────────────────────────────────────
  Compulsory heirs: legitimate children, legitimate parents,
  surviving spouse, illegitimate children
```

If an article key is NOT in `NCC_ARTICLE_DESCRIPTIONS` (lookup miss), show the raw article string with a fallback message: `"See Philippine Civil Code for full text."`

### 3.3 Legal Basis Column — No Articles Edge Case

If `share.legal_basis` is empty (`[]`), the Legal Basis cell renders:
```
  —
```
(an em-dash, no chevron button, no tooltip)

### 3.4 Mobile Responsive

On screens `< sm` (< 640px):
- The table uses `overflow-x-auto` (already present) — badges scroll horizontally
- Tooltips are displayed as **popovers on tap** (Radix `Tooltip` already uses `pointer: coarse` detection — no additional work needed)
- The citation panel expands below the row on tap of the chevron — same as desktop
- Chevron icon remains accessible (44×44px touch target via `size="sm"` button with `p-2`)

---

## 4. Component Hierarchy (Changes)

### 4.1 Files to Create

```
src/data/ncc-articles.ts        ← NEW — static article description map + helpers
```

### 4.2 Files to Modify

```
src/components/results/DistributionSection.tsx   ← extend HeirTable
```

No new component files needed. All changes are within `DistributionSection.tsx` with data imported from `ncc-articles.ts`.

### 4.3 HeirTable — Modified JSX Sketch

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '../ui/tooltip';
import { getArticleDescription, parseArticleKey } from '../../data/ncc-articles';

// Inside HeirTable:
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

// Count total columns for colSpan on citation panel row
const totalCols =
  2 +                          // Name + Category
  (isCollateral ? 2 : 0) +    // Blood Type + Units
  (showRepresentation ? 1 : 0) +
  (showDonations ? 2 : 0) +   // Gross Entitlement + Donations Imputed
  2;                           // Net from Estate + Legal Basis (with chevron)

// Legal Basis cell (replacing the existing div):
<TableCell>
  <div className="flex flex-wrap items-center gap-1">
    <TooltipProvider delayDuration={300}>
      {share.legal_basis.map((art) => {
        const desc = getArticleDescription(art);
        // Strip " NCC" for badge display brevity
        const displayLabel = art.replace(/\s*NCC$/i, '').replace(/\s*,\s*New Civil Code$/i, '');
        return (
          <Tooltip key={art}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs font-normal cursor-help"
              >
                {displayLabel}
              </Badge>
            </TooltipTrigger>
            {desc && (
              <TooltipContent
                className="max-w-xs text-left text-xs leading-relaxed"
                side="top"
              >
                <p className="font-semibold mb-0.5">{art.replace(/\s*NCC$/i, '')}, New Civil Code</p>
                <p>{desc}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </TooltipProvider>

    {share.legal_basis.length > 0 && (
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 ml-1 shrink-0"
        aria-label={expandedRows.has(share.heir_id) ? 'Collapse citations' : 'Expand citations'}
        onClick={() => {
          setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(share.heir_id)) next.delete(share.heir_id);
            else next.add(share.heir_id);
            return next;
          });
        }}
      >
        {expandedRows.has(share.heir_id)
          ? <ChevronUp className="h-3 w-3" />
          : <ChevronDown className="h-3 w-3" />}
      </Button>
    )}

    {share.legal_basis.length === 0 && (
      <span className="text-muted-foreground text-xs">—</span>
    )}
  </div>
</TableCell>

// Citation panel row (inserted after each heir row when expanded):
{expandedRows.has(share.heir_id) && (
  <TableRow key={`${share.heir_id}-citations`} className="bg-muted/20 hover:bg-muted/20">
    <TableCell colSpan={totalCols} className="pt-0 pb-3 px-4">
      <div className="rounded-md border border-border/50 bg-background px-4 py-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Statutory Basis — {share.heir_name}
        </p>
        <div className="space-y-3">
          {share.legal_basis.map((art) => {
            const desc = getArticleDescription(art);
            const displayArt = art.replace(/\s*NCC$/i, '');
            return (
              <div key={art} className="text-sm">
                <p className="font-semibold text-foreground">
                  {displayArt}, New Civil Code
                </p>
                <p className="text-muted-foreground leading-relaxed mt-0.5">
                  {desc ?? 'See Philippine Civil Code for full text.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </TableCell>
  </TableRow>
)}
```

---

## 5. Integration Points

### 5.1 Shared with spec-pdf-export

`src/data/ncc-articles.ts` is consumed by both:
- **This feature** — runtime browser tooltips and citation panels
- **spec-pdf-export** — PDF narrative sections listing article descriptions

The `getArticleDescription()` and `parseArticleKey()` helpers are used by both. The PDF export spec already references this file. Build order: create `ncc-articles.ts` first (no dependencies), then both features can import it independently.

### 5.2 All 7 Layout Variants

The `HeirTable` component is called from all layout variants in `DistributionSection`. The statute citation changes are **inside `HeirTable`** — automatically applies to all 7 layouts:

| Layout | HeirTable Used? | Citation Panel Works? |
|---|---|---|
| `standard-distribution` | YES | YES |
| `testate-with-dispositions` | YES | YES |
| `mixed-succession` | YES | YES |
| `preterition-override` | YES | YES |
| `collateral-weighted` | YES | YES (extra cols handled by totalCols) |
| `escheat` | NO (Alert only) | N/A |
| `no-compulsory-full-fp` | Conditional | YES when rendered |

The `totalCols` calculation accounts for conditional columns (collateral blood type/units, donations, representation). **This must be exact** — if `colSpan` is too small, the citation panel cell will be clipped; if too large, shadcn Table will warn in dev. The formula above covers all column combinations.

### 5.3 Excluded Heirs Section

The excluded heirs section (heirs with `net_from_estate = 0`) is rendered as a simple `<div>` list, not a `<Table>` — no changes needed there. Excluded heirs do not show legal basis citations (they are excluded, no active share).

### 5.4 Print Behavior (spec-print-layout)

When `@media print` CSS is applied (see `spec-print-layout`):
- Tooltips do NOT appear (hover interactions disabled in print)
- The citation panel, **if expanded**, prints normally (it is part of the DOM)
- All citation panels should be **auto-expanded** when generating print — the `spec-print-layout` spec should force all rows to expanded state via a `data-print-expanded` prop or a CSS approach

**Recommended print override:** Add a `forcedExpanded?: boolean` prop to `HeirTable`. When `true` (set by print layout logic), citation panels render as expanded regardless of user interaction state. This avoids needing to programmatically call `setExpandedRows` from an outside component.

```typescript
// HeirTable prop addition:
interface HeirTableProps {
  // ... existing props ...
  forcedExpanded?: boolean;  // when true, all citation panels are open (for print)
}

// In render:
const isExpanded = forcedExpanded || expandedRows.has(share.heir_id);
```

### 5.5 PDF Export

The PDF export (`spec-pdf-export`) independently renders article descriptions in its own PDF layout using the same `NCC_ARTICLE_DESCRIPTIONS` map. The UI citation panel and PDF are not connected — they read from the same static file but render independently.

---

## 6. Edge Cases

| Scenario | Behavior |
|---|---|
| `legal_basis[]` is empty | Legal Basis cell shows em-dash `—`, no chevron |
| Article key not in `NCC_ARTICLE_DESCRIPTIONS` | Tooltip does not appear (no `TooltipContent`); citation panel shows "See Philippine Civil Code for full text." |
| Very long `legal_basis[]` (e.g., 6+ articles) | Badges wrap with `flex-wrap`; citation panel scrolls if needed (no max-height; content is always visible) |
| Multiple rows expanded simultaneously | All expanded rows stay open independently; no accordion-style auto-close |
| Collateral layout (extra columns) | `totalCols` calculation includes blood type + units columns; `colSpan` remains correct |
| Donations columns visible | `totalCols` calculation includes gross entitlement + donations imputed; citation panel still spans full width |
| Article string format variation | `parseArticleKey()` handles "Art. 887 NCC", "Art. 887", "NCC Art. 888", "Art. FC 172" — any format the engine emits |
| Mobile tap on badge | Radix Tooltip opens on touch; user taps elsewhere to dismiss |
| Screen reader / keyboard nav | Badge has `cursor-help`; Tooltip triggered by focus; chevron button has `aria-label` |
| Escheat scenario (no HeirTable) | No changes needed — DistributionSection renders only the Alert in this case |
| `forcedExpanded=true` + `expandedRows` state | `forcedExpanded` takes precedence — all rows are expanded for print |

---

## 7. Dependencies

- **No new npm packages** — shadcn `Tooltip` already installed (`components/ui/tooltip.tsx` confirmed in codebase)
- **No backend** — entirely client-side static data
- **No other features must be built first** — this feature is fully self-contained
- **Build after** `src/data/ncc-articles.ts` is created — can be created as the very first step

---

## 8. Acceptance Criteria

### AC-1: Tooltip on Hover
- [ ] Hovering any article badge in the Legal Basis column shows a tooltip
- [ ] Tooltip shows: article number + ", New Civil Code" on first line; description on second line
- [ ] Tooltip appears within 300ms of hover (Radix default delay)
- [ ] Tooltip disappears when cursor leaves badge
- [ ] For article numbers not in the lookup, no tooltip appears (no broken/empty tooltip)

### AC-2: Expandable Citation Panel
- [ ] Each active heir row with at least one article has a chevron `[⌄]` button
- [ ] Clicking the chevron expands a citation panel below that row
- [ ] Clicking again collapses the panel
- [ ] Multiple rows can be expanded simultaneously
- [ ] Citation panel header reads "Statutory Basis — Maria dela Cruz" (i.e., the expanded heir's name interpolated into the header)
- [ ] Each article in `legal_basis[]` is listed with: full citation name + description
- [ ] Articles not in lookup show "See Philippine Civil Code for full text."

### AC-3: Empty State
- [ ] Heir rows with empty `legal_basis[]` show `—` in the cell, no chevron

### AC-4: All Layout Variants
- [ ] Statute citation UI appears correctly in all 7 layout variants
- [ ] `colSpan` on citation panel row is always exactly equal to the total column count (no visual overflow)
- [ ] Collateral layout (blood type + units columns) correctly widens colSpan

### AC-5: Static Data File
- [ ] `src/data/ncc-articles.ts` exists and exports `NCC_ARTICLE_DESCRIPTIONS`, `parseArticleKey`, `getArticleDescription`
- [ ] All articles listed in §2.1 are present in the map
- [ ] `parseArticleKey("Art. 887 NCC")` returns `"887"`
- [ ] `parseArticleKey("FC Art. 172")` returns `"FC172"`
- [ ] `getArticleDescription("Art. 887 NCC")` returns the description string
- [ ] `getArticleDescription("Art. 9999 NCC")` returns `undefined`

### AC-6: Print Integration Point
- [ ] `HeirTable` accepts an optional `forcedExpanded?: boolean` prop
- [ ] When `forcedExpanded={true}`, all citation panels render as expanded without user interaction

### AC-7: Mobile
- [ ] Badges are tappable on mobile (touch targets ≥ 44px via badge + padding)
- [ ] Tooltip opens on tap (Radix Tooltip behavior on touch devices)
- [ ] Chevron button is accessible (44px touch area)
- [ ] Citation panel expands correctly on mobile

### AC-8: Accessibility
- [ ] Chevron button has `aria-label="Expand citations"` / `"Collapse citations"`
- [ ] Article badges have `cursor-help` CSS indicating they are interactive
- [ ] Tooltip is focusable (keyboard Tab → focus badge → Tooltip appears)
- [ ] Citation panel is announced by screen readers (no `aria-hidden`)

### AC-9: No Regressions
- [ ] All 7 `DistributionSection` layout variants pass existing snapshot tests
- [ ] `HeirTable` renders correctly with donations and representation columns
- [ ] `formatPeso` and other existing utility functions are unchanged
