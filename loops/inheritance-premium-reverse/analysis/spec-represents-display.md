# Feature Spec: Representation Label in Distribution Table

**Aspect:** spec-represents-display
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** codebase-audit
**No backend dependencies — purely frontend**

---

## 1. Overview

Under Philippine succession law (NCC Art. 970–977), the **right of representation**
(_derecho de representación_) allows the descendants of a predeceased compulsory heir
to step into that heir's place and receive the share the deceased would have inherited.
For example, if Juan Santos (legitimate child of the decedent) predeceased the decedent,
Juan's own children — Maria and Pedro Santos — inherit *by representation*, each taking
an equal slice of Juan's would-be share.

The engine already computes this precisely:
- `InheritanceShare.inherits_by === 'Representation'` identifies the representative heir
- `InheritanceShare.represents: HeirId | null` records **which predeceased person they represent**

The current UI renders a generic `[By Representation]` badge in the "Inherits By" column but
**never displays the name of the person being represented**. A client looking at "Maria Santos —
By Representation" cannot answer the natural question: "Representing *whom*?"

This feature adds a **"representing [Parent Name]"** sub-label beneath the heir name in the
distribution table Name cell. The sub-label resolves the represented person's name from
`EngineInput.family_tree` using the `represents` HeirId.

**Why a PH estate lawyer needs this:**
- The core question in representation cases is "who stands in for whom?" — the label
  answers it without requiring the client to read the full narrative.
- Extrajudicial settlement deeds (EJS) must name the predeceased heir and their
  representative heirs explicitly (Art. 1078 NCC; Rule 74 §1 Rules of Court). Seeing
  the representation chain in the distribution table directly helps draft those deeds.
- In families with multiple representation chains (e.g., children of two different
  predeceased siblings), lawyers need a quick visual audit: "Pedro Santos' three
  children — are they all representing Pedro?" The sub-label makes this scannable.
- The PDF export must also carry this label so that printed client handouts are
  self-explanatory (specified in §5.2 below).

---

## 2. Data Model

No database tables. No Supabase. No new npm packages. Entirely client-side.

### 2.1 Source Fields

All fields consumed by this feature are already present in current component props:

```typescript
// InheritanceShare (from EngineOutput.per_heir_shares):
interface InheritanceShare {
  heir_id:      HeirId;            // identifies this heir
  heir_name:    string;            // displayed in Name column
  inherits_by:  InheritanceMode;  // 'OwnRight' | 'Representation'
  represents:   HeirId | null;    // PersonId of the predeceased heir, or null
  // ... other fields unchanged
}

// Person (from EngineInput.family_tree):
interface Person {
  id:                     PersonId;  // matches InheritanceShare.represents
  name:                   string;    // the name to display
  is_alive_at_succession: boolean;  // always false for a represented heir
  // ... other fields not used by this feature
}
```

`HeirId` and `PersonId` are both `string` type aliases and are interchangeable —
`InheritanceShare.represents` holds the same identifier as `Person.id`.

### 2.2 Name Resolution Logic

```typescript
// Computed at render time inside HeirTable row loop:
function getRepresentedName(
  share: InheritanceShare,
  persons: Person[] | undefined,
): string | null {
  if (share.inherits_by !== 'Representation') return null;
  if (share.represents == null) return null;
  const person = persons?.find((p) => p.id === share.represents);
  return person?.name ?? null;
}
```

This function:
1. Short-circuits for `OwnRight` heirs (returns `null` — no label shown)
2. Short-circuits when `represents` is `null` (edge case — see §6)
3. Looks up the person in the `persons` array (already passed to `HeirTable`)
4. Returns `null` if the person is not found (graceful fallback — see §6)

No memoization is needed: the `persons` array is stable (from `EngineInput.family_tree`)
and the loop runs over a small number of shares (typical estates have 2–15 heirs).

---

## 3. UI Design

### 3.1 Current State vs. After This Spec

**Current Name cell (no representation sub-label):**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Name          │ Category           │ Inherits By         │ Net from Estate      │
├───────────────┼────────────────────┼─────────────────────┼──────────────────────┤
│ Maria Santos  │ [Legitimate Child] │ [By Representation] │ ₱500,000             │
├───────────────┼────────────────────┼─────────────────────┼──────────────────────┤
│ Ana Santos    │ [Legitimate Child] │ [By Representation] │ ₱500,000             │
├───────────────┼────────────────────┼─────────────────────┼──────────────────────┤
│ Rosa Cruz     │ [Legitimate Child] │                     │ ₱1,000,000           │
└───────────────┴────────────────────┴─────────────────────┴──────────────────────┘
```

**After spec-represents-display (sub-label added to Name cell):**
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Name                          │ Category           │ Inherits By         │ Net    │
├───────────────────────────────┼────────────────────┼─────────────────────┼────────┤
│ Maria Santos                  │ [Legitimate Child] │ [By Representation] │₱500,000│
│ representing Juan Santos      │                    │                     │        │
├───────────────────────────────┼────────────────────┼─────────────────────┼────────┤
│ Ana Santos                    │ [Legitimate Child] │ [By Representation] │₱500,000│
│ representing Juan Santos      │                    │                     │        │
├───────────────────────────────┼────────────────────┼─────────────────────┼────────┤
│ Rosa Cruz                     │ [Legitimate Child] │                     │₱1,000,000│
└───────────────────────────────┴────────────────────┴─────────────────────┴────────┘
```

Both Maria and Ana Santos show "representing Juan Santos" — confirming they are the
children of the predeceased Juan Santos who inherit per stirpes (Art. 974 NCC).
Rosa Cruz has no sub-label because she inherits in her own right.

### 3.2 Name Cell HTML Structure

The Name cell is modified from a plain `<TableCell>` with a text node to a
`<TableCell>` containing a two-line flex column:

```tsx
<TableCell className="font-medium">
  <div className="flex flex-col gap-0.5">
    <span>{share.heir_name}</span>
    {share.inherits_by === 'Representation' && (
      <span className="text-xs text-muted-foreground font-normal italic">
        representing {getRepresentedName(share, persons) ?? 'deceased heir'}
      </span>
    )}
  </div>
</TableCell>
```

**Style rationale:**
- `text-xs` (12px) — sub-label is subordinate information; smaller than the 14px name
- `text-muted-foreground` — visually de-emphasized; the heir name remains primary
- `font-normal` — removes the `font-medium` inherited from `TableCell` for the sub-label
- `italic` — distinguishes the contextual label from the heir's own name
- `gap-0.5` (2px) — compact vertical separation; does not push rows to an uncomfortable height

### 3.3 Multiple Representation Chains (Two Predeceased Heirs)

When the family has two (or more) predeceased heirs, each represented by different
children, the sub-labels correctly show distinct parent names:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Name                          │ Category           │ Inherits By         │ Net    │
├───────────────────────────────┼────────────────────┼─────────────────────┼────────┤
│ Maria Santos                  │ [Legitimate Child] │ [By Representation] │₱333,333│
│ representing Juan Santos      │                    │                     │        │
├───────────────────────────────┼────────────────────┼─────────────────────┼────────┤
│ Ana Santos                    │ [Legitimate Child] │ [By Representation] │₱333,333│
│ representing Juan Santos      │                    │                     │        │
├───────────────────────────────┼────────────────────┼─────────────────────┼────────┤
│ Luis Dela Cruz                │ [Legitimate Child] │ [By Representation] │₱333,333│
│ representing Carmen Dela Cruz │                    │                     │        │
└───────────────────────────────┴────────────────────┴─────────────────────┴────────┘
```

### 3.4 Excluded Heirs Section

Excluded heirs (those with `net_from_estate.centavos === 0`) are rendered as a `<div>`
list below the table (not as `<TableRow>` elements). The "representing" label is not
shown for excluded heirs. The excluded section conveys exclusion, not contribution —
the representation chain is irrelevant when the share is zero.

### 3.5 Mobile Layout

On screens narrower than 640px, the table scrolls horizontally inside the
`overflow-x-auto` wrapper. The Name cell, being the first column, is always visible
before horizontal scrolling begins. The two-line structure stacks cleanly:

```
┌──────────────────────────┐
│ Maria Santos             │  ← font-medium, 14px
│ representing Juan Santos │  ← muted, italic, 12px
└──────────────────────────┘
```

No `min-width` is needed on the Name cell — the sub-label is shorter than most heir names.

### 3.6 Print Layout

In print mode (as defined by spec-print-layout), the `@media print` stylesheet
does not hide the Name cell or its sub-label. The two-line structure prints naturally.
Font size differences (`text-xs` vs default) are preserved in print. No special
print-specific override is needed.

---

## 4. Component Design

### 4.1 Modified Component: `HeirTable` inside `DistributionSection.tsx`

**File:** `src/components/results/DistributionSection.tsx`

**Change location:** Inside the `activeShares.map((share) => ...)` render loop in `HeirTable`.

**Before (current code, line 106):**
```tsx
<TableCell className="font-medium">{share.heir_name}</TableCell>
```

**After:**
```tsx
<TableCell className="font-medium">
  <div className="flex flex-col gap-0.5">
    <span>{share.heir_name}</span>
    {share.inherits_by === 'Representation' && (
      <span className="text-xs text-muted-foreground font-normal italic">
        representing {getRepresentedName(share, persons) ?? 'deceased heir'}
      </span>
    )}
  </div>
</TableCell>
```

**Helper function added** at the top of `DistributionSection.tsx` (alongside the other
helpers like `getCentavos`, `hasDonationsImputed`, `hasRepresentation`):

```typescript
function getRepresentedName(
  share: InheritanceShare,
  persons: Person[] | undefined,
): string | null {
  if (share.inherits_by !== 'Representation') return null;
  if (share.represents == null) return null;
  const person = persons?.find((p) => p.id === share.represents);
  return person?.name ?? null;
}
```

### 4.2 No New Files

This feature requires changes to exactly one existing file:
```
src/components/results/DistributionSection.tsx   ← add helper + modify Name cell
```

No new files. No changes to `App.tsx`, `ResultsView.tsx`, `ResultsHeader.tsx`,
`NarrativePanel.tsx`, `WarningsPanel.tsx`, `ComputationLog.tsx`, `ActionsBar.tsx`,
`bridge.ts`, or `types/index.ts`.

### 4.3 No New Imports

`getRepresentedName` uses `InheritanceShare` and `Person` — both already imported
in `DistributionSection.tsx` (confirmed in codebase-audit: `import type { InheritanceShare, ..., Person } from '../../types'`).

---

## 5. Integration Points

### 5.1 With `spec-statute-citations-ui` + `spec-share-breakdown-panel`

Both of those specs add an expandable panel below each row. Neither modifies the Name
cell. This spec modifies only the Name cell. There is no conflict — all three changes
can coexist in the same `HeirTable` implementation:

| Change | Location |
|---|---|
| `spec-represents-display` (this spec) | Name `<TableCell>` — adds sub-label |
| `spec-statute-citations-ui` | Legal Basis cell — adds chevron; inserts expanded row |
| `spec-share-breakdown-panel` | Content of the expanded row — share computation section |

The Name cell sub-label is independently visible in the collapsed (default) state.
The expanded panels from the other two specs are hidden by default. Build order: any
order is acceptable since they touch different DOM locations.

### 5.2 With `spec-pdf-export`

The PDF distribution table (specified in `spec-pdf-export`) must replicate the same
two-line Name cell pattern. The PDF renderer (`@react-pdf/renderer`) uses its own
component tree, so the sub-label must be explicitly added to the PDF `HeirRow`
component:

```tsx
// Inside @react-pdf/renderer HeirRow:
<View style={styles.nameCell}>
  <Text style={styles.heirName}>{share.heir_name}</Text>
  {share.inherits_by === 'Representation' && representedName && (
    <Text style={styles.representingLabel}>
      representing {representedName}
    </Text>
  )}
</View>
```

PDF styles:
```typescript
const styles = StyleSheet.create({
  heirName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  representingLabel: {
    fontSize: 8,
    color: '#6b7280',      // muted-foreground equivalent in PDF
    fontStyle: 'italic',
    marginTop: 1,
  },
});
```

The `representedName` lookup in the PDF generator uses the same `getRepresentedName`
logic but applied to the `EngineInput.family_tree` array passed to the PDF component.

### 5.3 With `spec-print-layout`

The `@media print` stylesheet (spec-print-layout) needs no changes. The Name cell's
two-line structure prints as-is. The `text-xs` and `italic` CSS classes render
correctly in print contexts.

### 5.4 With all 7 `DistributionSection` layout variants

The Name cell change is inside `HeirTable`, which is used by all layouts except
`escheat` (no table). The sub-label renders correctly in all applicable layouts:

| Layout | `HeirTable` Used | Sub-label Works |
|---|---|---|
| `standard-distribution` | YES | YES |
| `testate-with-dispositions` | YES | YES |
| `mixed-succession` | YES | YES |
| `preterition-override` | YES | YES |
| `collateral-weighted` | YES | YES |
| `escheat` | NO (Alert only) | N/A |
| `no-compulsory-full-fp` | Conditional | YES when rendered |

Representation under NCC Art. 972 occurs only in the direct descending line, so
`collateral-weighted` cases (siblings, nephews/nieces — NCC Art. 973 limits this)
may also show the sub-label when nephews/nieces represent a predeceased sibling.

---

## 6. Edge Cases

| Scenario | Behavior |
|---|---|
| `share.inherits_by === 'OwnRight'` | Sub-label not rendered; `<TableCell>` shows only heir name as before |
| `share.inherits_by === 'Representation'` AND `share.represents === null` | Sub-label reads "representing deceased heir" (safe fallback; engine should not emit this combination but defensive handling prevents blank sub-label) |
| `share.represents` is non-null but no matching person found in `persons` | Sub-label reads "representing deceased heir" (graceful fallback — `getRepresentedName` returns `null` → fallback string shown) |
| `persons` prop is `undefined` (HeirTable called without `persons`) | `getRepresentedName` receives `undefined` → `persons?.find(...)` returns `undefined` → `null` returned → sub-label reads "representing deceased heir" |
| Represented person has no name set (empty string) | Sub-label reads "representing " — empty name is a data entry error; the feature should not crash. In practice, the wizard requires a name on every person card. |
| Two heirs represent the same predeceased parent (multiple grandchildren) | Both rows independently show "representing [same parent name]" — correct; they are per stirpes co-heirs |
| Heir inherits by representation but their share is 0 (excluded) | Heir appears in the excluded section as a plain `<div>`, not in the `<TableRow>` loop — sub-label is not shown for excluded heirs |
| Decedent's own entry appears in `family_tree` (if the wizard adds the decedent as a person) | The decedent's `id` is in `EngineInput.decedent.id`, which is a separate field from `family_tree`. The `represents` field points to a person in `family_tree`. The lookup is safe and will not accidentally match the decedent. |
| `heir_id === represents` (heir represents themselves — malformed data) | The lookup would return the heir's own name: "representing Maria Santos". This is semantically incorrect but is a malformed engine output case that cannot be produced by valid wizard input. Display degrades gracefully rather than crashing. |

---

## 7. Dependencies

- **No new npm packages** required
- **No backend** (Supabase, API) required
- **`persons: Person[]`** — already passed as optional prop to `DistributionSection` from
  `ResultsView` (confirmed: `persons={input.family_tree}` in `ResultsView.tsx` line 37);
  already forwarded to `HeirTable` as `persons?: Person[]` in current code
- **`InheritanceShare.represents`** — already in the type definition (`types/index.ts` line 405)
- **`InheritanceMode`** — already imported in `DistributionSection.tsx`
- **Tailwind CSS v4** — all classes used (`text-xs`, `text-muted-foreground`, `font-normal`,
  `italic`, `flex`, `flex-col`, `gap-0.5`) are standard Tailwind utilities, no custom config needed

**Build order relative to other specs:**
This spec can be built at any point — it is fully independent of all persistence,
auth, PDF, and print specs. It only changes `DistributionSection.tsx`.

---

## 8. Acceptance Criteria

### AC-1: Sub-label Visible for Representation Heirs

- [ ] Every heir row where `share.inherits_by === 'Representation'` shows a sub-label
  beneath the heir name in the Name cell
- [ ] The sub-label text reads "representing [predeceased parent name]" where the name
  is the `name` field of the person whose `id` equals `share.represents`
- [ ] The sub-label uses `text-xs text-muted-foreground font-normal italic` styling classes
- [ ] The heir name line retains `font-medium` weight (unchanged from current style)

### AC-2: No Sub-label for OwnRight Heirs

- [ ] Every heir row where `share.inherits_by === 'OwnRight'` shows only the heir name
  with no additional text beneath it
- [ ] Rows without sub-labels render identically to the current implementation
  (no extra `<div>` wrapper visible in tests or snapshots that breaks existing assertions)

### AC-3: Multiple Representation Chains

- [ ] When two heirs represent two different predeceased parents, each row shows the
  correct respective parent name (not the same name for both)
- [ ] When two heirs represent the same predeceased parent (siblings inheriting per stirpes),
  both rows show the same parent name

### AC-4: Fallback Handling

- [ ] When `share.represents` is `null` AND `inherits_by === 'Representation'`:
  sub-label reads "representing deceased heir"
- [ ] When `share.represents` is non-null but not found in `persons`:
  sub-label reads "representing deceased heir"
- [ ] No JavaScript error is thrown in any fallback scenario

### AC-5: Excluded Heirs

- [ ] Heirs in the "Excluded Heirs" `<div>` list (those with `net_from_estate = 0`)
  do not show the "representing" label — excluded heirs render as before

### AC-6: All Layout Variants

- [ ] Sub-label renders for representation heirs in `standard-distribution` layout
- [ ] Sub-label renders for representation heirs in `testate-with-dispositions` layout
- [ ] Sub-label renders for representation heirs in `mixed-succession` layout
- [ ] Sub-label renders for representation heirs in `preterition-override` layout
- [ ] Sub-label renders for representation heirs in `collateral-weighted` layout
  (nephews/nieces representing predeceased sibling under Art. 973 NCC)
- [ ] No change in `escheat` layout (no table rendered)

### AC-7: PDF Export Parity

- [ ] The PDF distribution table (spec-pdf-export) shows the same two-line Name cell
  for representation heirs: heir name on line 1, "representing [parent name]" on line 2
- [ ] PDF sub-label uses 8pt italic muted-gray styling
- [ ] PDF fallback matches UI fallback: "representing deceased heir" when name not resolvable

### AC-8: No Regressions

- [ ] All existing tests for `DistributionSection` continue to pass
- [ ] `hasRepresentation()` helper in `DistributionSection.tsx` is unchanged
  (still controls the "Inherits By" column visibility — that column remains)
- [ ] The "By Representation" badge in the "Inherits By" column is unchanged
  (this spec adds context in the Name cell; it does not replace the badge)
- [ ] `getCentavos`, `hasDonationsImputed`, and `CategoryBadge` are unchanged
- [ ] `persons` prop continues to be passed through from `DistributionSection` to
  `HeirTable` without change in type or forwarding behavior

### AC-9: Component Encapsulation

- [ ] `getRepresentedName()` is a module-level function in `DistributionSection.tsx`,
  not exported (internal use only)
- [ ] No changes to any other file in the codebase
- [ ] No new files are created
