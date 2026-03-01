# Feature Spec: Guided Client Intake Form

**Aspect:** spec-intake-form
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** crm-law-firm-patterns, codebase-audit, ph-practice-workflow
**Depends on:** spec-client-profiles (clients table, conflict_cleared field, ClientPicker combobox)

---

## 1. Overview

The Guided Client Intake Form is a multi-step interview that a Philippine estate lawyer runs with
a client at the start of every estate matter. It replaces the current paper form or Word document
that lawyers manually transcribe into the computation wizard.

**Why a PH estate lawyer needs this:**
- Today's workflow: consultation → handwritten notes → re-type into wizard → re-type into BIR form
- With this feature: consultation → fill intake form → case wizard pre-fills automatically
- Captures all BIR Form 1801 prerequisite data (decedent TIN, asset categories, civil status,
  property regime) in one sitting
- The intake form is written in plain lawyer language; the computation wizard uses technical engine
  terms (EngineInput, family_tree, net_distributable_estate). The intake form maps one to the other.
- `spec-document-checklist` auto-generates a smart checklist from the intake answers (which docs
  are needed depends on asset types, settlement track, whether heirs include minors, etc.)
- `spec-deadline-tracker` auto-computes BIR filing deadline from `date_of_death` captured here

**What the form produces:**
1. Creates or links a `clients` row (the lawyer's client — usually an heir or executor)
2. Creates a `cases` row with `input_json` pre-populated from the intake data
3. Stores additional intake metadata in `cases.intake_data JSONB` (decedent TIN, will details,
   preliminary asset breakdown, engagement notes — fields that don't fit `EngineInput`)
4. Redirects to the computation wizard with all translatable fields pre-filled
5. Triggers conflict check (integration with spec-conflict-check)

**Scope of this spec:**
- 6-step intake wizard
- IntakeFormData TypeScript interface
- Mapping logic: IntakeFormData → EngineInput
- `intake_data JSONB` column on `cases` table
- Intake draft persistence (save progress between sessions)
- Post-intake routing into computation wizard

---

## 2. Data Model

### 2.1 Schema Changes (Migration: add intake_data column)

```sql
-- Migration: 005_intake_data.sql
-- Adds intake_data column to cases table (defined in spec-auth-persistence)

ALTER TABLE cases
  ADD COLUMN intake_data JSONB;

COMMENT ON COLUMN cases.intake_data IS
  'Stores rich intake interview data that does not fit EngineInput: decedent TIN, will details, '
  'asset category breakdown, settlement track, engagement notes. Populated by the intake form.';

-- Optional: partial index for cases that used the intake form
CREATE INDEX idx_cases_has_intake
  ON cases ((intake_data IS NOT NULL))
  WHERE intake_data IS NOT NULL;
```

No new table is needed. The `cases` table already holds `input_json` (EngineInput) and
`client_id`. The `intake_data` column stores the richer intake metadata that feeds
estate tax inputs, document checklist, and deadline tracker.

### 2.2 IntakeFormData TypeScript Interface

```typescript
// types/intake.ts

export interface IntakeFormData {
  // ── Section A: Client Linkage ───────────────────────────────────
  client_id: string | null          // links to clients.id; null = no client linked
  client_relationship_to_decedent:  // who the lawyer's client is in this estate
    | 'surviving_spouse'
    | 'child'
    | 'executor_named_in_will'
    | 'administrator'
    | 'heir_other'
    | 'third_party_buyer'
    | null

  // ── Section B: Decedent ─────────────────────────────────────────
  decedent: IntakeDecedent

  // ── Section C: Settlement Track ─────────────────────────────────
  settlement_track: 'extrajudicial' | 'judicial' | null
  // null = not yet determined (lawyer completes after intake)

  // ── Section D: Family Composition ───────────────────────────────
  family: IntakeFamily

  // ── Section E: Estate Assets ────────────────────────────────────
  assets: IntakeAssets

  // ── Section F: Engagement Notes ─────────────────────────────────
  engagement_notes: string | null   // free-text scope/fee notes
}

export interface IntakeDecedent {
  full_name: string                  // "Juan dela Cruz Santos" — as on death certificate
  date_of_death: string              // ISO date: "YYYY-MM-DD"
  place_of_death: string | null      // city/municipality
  last_address: string | null        // last domicile — determines RDO jurisdiction
  civil_status_at_death:
    | 'single'
    | 'married'
    | 'widowed'
    | 'legally_separated'
    | 'annulled'
  tin: string | null                 // Decedent's TIN (XXX-XXX-XXX) for BIR Form 1801 Part I
  estate_tin: string | null          // TIN of the estate entity (from BIR Form 1904)
  psa_death_cert_no: string | null   // PSA certificate number (for document tracking)
  was_will_executed: boolean         // "Did the decedent leave a will?"
  will_type: 'notarial' | 'holographic' | null
  will_location: string | null       // e.g. "Notary Atty. Cruz, Makati" or "Safety deposit box BDO Pasig"
  has_prior_bir_filing: boolean      // Was estate tax ever filed before?
  has_prior_ejs: boolean             // Was there a prior extrajudicial settlement for this estate?
}

export interface IntakeFamily {
  surviving_spouse: IntakeSpouse | null
  children: IntakeChild[]
  parents: IntakeParent[]            // relevant when there are no children
  siblings: IntakeSibling[]          // relevant when there are no children and no parents
}

export interface IntakeSpouse {
  full_name: string
  date_of_birth: string | null
  tin: string | null
  is_predeceased: boolean            // true = died before decedent (not actually surviving)
  marriage_date: string | null       // ISO date — determines ACP vs CPG
  property_regime:
    | 'ACP'                          // Absolute Community of Property (default, FC Art. 75)
    | 'CPG'                          // Conjugal Partnership of Gains (pre-FC marriages)
    | 'SPG'                          // Separation of Property (prenuptial)
    | 'exclusive'                    // Exclusive property (never married / no conjugal assets)
  prenup_exists: boolean
}

export interface IntakeChild {
  full_name: string
  date_of_birth: string | null
  filiation: 'legitimate' | 'legitimated' | 'acknowledged' | 'illegitimate_strict'
  is_living: boolean
  // If deceased child has their own children (representation):
  children_of_deceased: IntakeGrandchild[]
  tin: string | null
  is_minor: boolean                  // true = under 18; triggers guardian flag
  guardian_name: string | null       // required if is_minor = true
}

export interface IntakeGrandchild {
  full_name: string
  date_of_birth: string | null
  filiation: 'legitimate' | 'illegitimate'
  is_living: boolean
  is_minor: boolean
  guardian_name: string | null
}

export interface IntakeParent {
  full_name: string
  is_living: boolean
  relationship: 'father' | 'mother'
}

export interface IntakeSibling {
  full_name: string
  is_living: boolean
  filiation: 'legitimate' | 'half-blood_father' | 'half-blood_mother'
  children_of_deceased: IntakeGrandchild[]  // nieces/nephews for representation
}

export interface IntakeAssets {
  // Preliminary asset categories — total values in centavos
  // These feed both the inheritance engine (net_distributable_estate)
  // and the estate tax engine (gross estate breakdown).

  real_property: IntakeRealProperty[]   // TCT/OCT/CCT items
  bank_accounts: number                 // total centavos across all accounts
  shares_of_stock: number               // total FMV in centavos
  motor_vehicles: number                // total FMV in centavos (OR/CR)
  personal_property: number             // jewelry, furniture, other tangibles
  other_assets: number                  // receivables, business interests not categorized
  outstanding_debts: number             // mortgages, loans, obligations (for deduction)
  // Net distributable = sum(all assets) - outstanding_debts
  // Note: does not yet apply conjugal / community deduction — that's in the estate tax engine
  notes: string | null                  // free-text notes on asset complications
}

export interface IntakeRealProperty {
  id: string                           // UUID v4 — local form key
  description: string                  // e.g. "Residential lot in Pasig City"
  tct_oct_cct_no: string | null        // title number
  td_no: string | null                 // tax declaration number
  location_city: string | null         // for RDO routing and zonal value lookup
  estimated_fmv_centavos: number       // lawyer's estimate; BIR will use zonal value
}
```

### 2.3 Mapping: IntakeFormData → EngineInput

The intake form pre-fills the computation wizard. This function is called after the intake
completes and before navigating to the wizard.

```typescript
// lib/intake/mapToEngineInput.ts
import type { IntakeFormData } from '@/types/intake'
import type { EngineInput, Person } from '@/types'

export function mapIntakeToEngineInput(intake: IntakeFormData): EngineInput {
  const family_tree: Person[] = buildFamilyTree(intake)

  const total_gross_centavos =
    intake.assets.real_property.reduce((s, p) => s + p.estimated_fmv_centavos, 0) +
    intake.assets.bank_accounts +
    intake.assets.shares_of_stock +
    intake.assets.motor_vehicles +
    intake.assets.personal_property +
    intake.assets.other_assets

  const net_distributable_estate = Math.max(
    0,
    total_gross_centavos - intake.assets.outstanding_debts
  )

  return {
    net_distributable_estate,
    decedent: {
      name: intake.decedent.full_name,
      date_of_death: intake.decedent.date_of_death,
      is_married: !!intake.family.surviving_spouse && !intake.family.surviving_spouse.is_predeceased,
      is_predeceased_spouse: intake.family.surviving_spouse?.is_predeceased ?? null,
      spouse_name: intake.family.surviving_spouse?.full_name ?? null,
    },
    family_tree,
    donations: [],   // intake form does not capture donations; lawyer adds in WillStep
    will: intake.decedent.was_will_executed
      // Pre-fill will as empty; lawyer fills institutions/legacies in WillStep
      ? { institutions: [], legacies: [], devises: [], disinheritances: [] }
      : null,
  }
}

function buildFamilyTree(intake: IntakeFormData): Person[] {
  const persons: Person[] = []
  let idSeq = 1
  const nextId = () => `heir-${idSeq++}`

  // Surviving spouse (if any, if alive)
  if (
    intake.family.surviving_spouse &&
    !intake.family.surviving_spouse.is_predeceased
  ) {
    persons.push({
      id: nextId(),
      name: intake.family.surviving_spouse.full_name,
      relationship: 'SpouseToDecedent',
      filiation: 'Legitimate',
      is_living: true,
      represents: null,
    })
  }

  // Children
  for (const child of intake.family.children) {
    const childId = nextId()
    persons.push({
      id: childId,
      name: child.full_name,
      relationship: 'ChildOfDecedent',
      filiation: mapFiliation(child.filiation),
      is_living: child.is_living,
      represents: null,
    })
    // Grandchildren representing predeceased child
    if (!child.is_living) {
      for (const gc of child.children_of_deceased) {
        persons.push({
          id: nextId(),
          name: gc.full_name,
          relationship: 'ChildOfDecedent',  // engine treats as grandchild via represents
          filiation: mapFiliation(gc.filiation),
          is_living: gc.is_living,
          represents: childId,  // representation: Art. 970 NCC
        })
      }
    }
  }

  // Parents (only added to family tree if no children exist)
  if (intake.family.children.length === 0) {
    for (const parent of intake.family.parents) {
      persons.push({
        id: nextId(),
        name: parent.full_name,
        relationship: 'ParentOfDecedent',
        filiation: 'Legitimate',
        is_living: parent.is_living,
        represents: null,
      })
    }
  }

  // Siblings (only added if no children and no living parents)
  const hasLivingParents = intake.family.parents.some(p => p.is_living)
  if (intake.family.children.length === 0 && !hasLivingParents) {
    for (const sib of intake.family.siblings) {
      const sibId = nextId()
      persons.push({
        id: sibId,
        name: sib.full_name,
        relationship: 'SiblingOfDecedent',
        filiation: mapSiblingFiliation(sib.filiation),
        is_living: sib.is_living,
        represents: null,
      })
      if (!sib.is_living) {
        for (const niece of sib.children_of_deceased) {
          persons.push({
            id: nextId(),
            name: niece.full_name,
            relationship: 'SiblingOfDecedent',
            filiation: mapFiliation(niece.filiation),
            is_living: niece.is_living,
            represents: sibId,
          })
        }
      }
    }
  }

  return persons
}

function mapFiliation(
  f: 'legitimate' | 'legitimated' | 'acknowledged' | 'illegitimate_strict' | 'illegitimate'
): 'Legitimate' | 'Legitimated' | 'Acknowledged' | 'StrictlyIllegitimate' {
  switch (f) {
    case 'legitimate':       return 'Legitimate'
    case 'legitimated':      return 'Legitimated'
    case 'acknowledged':     return 'Acknowledged'
    case 'illegitimate_strict':
    case 'illegitimate':     return 'StrictlyIllegitimate'
  }
}

function mapSiblingFiliation(
  f: 'legitimate' | 'half-blood_father' | 'half-blood_mother'
): 'Legitimate' | 'StrictlyIllegitimate' {
  return f === 'legitimate' ? 'Legitimate' : 'StrictlyIllegitimate'
}
```

### 2.4 IntakeData Zod Schema (for form validation)

```typescript
// schemas/intake.ts
import { z } from 'zod'
import { TIN_REGEX } from '@/types/client'

const tinField = z.string()
  .refine(v => !v || TIN_REGEX.test(v), { message: 'TIN must be in XXX-XXX-XXX format' })
  .optional()
  .nullable()

const IntakeGrandchildSchema = z.object({
  full_name:      z.string().min(2, 'Name required'),
  date_of_birth:  z.string().optional().nullable(),
  filiation:      z.enum(['legitimate', 'illegitimate']),
  is_living:      z.boolean(),
  is_minor:       z.boolean(),
  guardian_name:  z.string().optional().nullable(),
})

const IntakeChildSchema = z.object({
  full_name:               z.string().min(2, 'Name required'),
  date_of_birth:           z.string().optional().nullable(),
  filiation:               z.enum(['legitimate', 'legitimated', 'acknowledged', 'illegitimate_strict']),
  is_living:               z.boolean(),
  children_of_deceased:    z.array(IntakeGrandchildSchema).default([]),
  tin:                     tinField,
  is_minor:                z.boolean(),
  guardian_name:           z.string().optional().nullable(),
}).refine(
  d => !d.is_minor || !!d.guardian_name,
  { message: 'Guardian name required for minor heir', path: ['guardian_name'] }
)

const IntakeSpouseSchema = z.object({
  full_name:       z.string().min(2, 'Name required'),
  date_of_birth:   z.string().optional().nullable(),
  tin:             tinField,
  is_predeceased:  z.boolean(),
  marriage_date:   z.string().optional().nullable(),
  property_regime: z.enum(['ACP', 'CPG', 'SPG', 'exclusive']),
  prenup_exists:   z.boolean(),
})

const IntakeRealPropertySchema = z.object({
  id:                       z.string().uuid(),
  description:              z.string().min(3, 'Description required'),
  tct_oct_cct_no:           z.string().optional().nullable(),
  td_no:                    z.string().optional().nullable(),
  location_city:            z.string().optional().nullable(),
  estimated_fmv_centavos:   z.number().int().min(0),
})

export const IntakeFormSchema = z.object({
  client_id:                        z.string().uuid().optional().nullable(),
  client_relationship_to_decedent:  z.enum([
    'surviving_spouse', 'child', 'executor_named_in_will',
    'administrator', 'heir_other', 'third_party_buyer',
  ]).optional().nullable(),

  decedent: z.object({
    full_name:          z.string().min(2, 'Decedent name required'),
    date_of_death:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    place_of_death:     z.string().optional().nullable(),
    last_address:       z.string().optional().nullable(),
    civil_status_at_death: z.enum(['single', 'married', 'widowed', 'legally_separated', 'annulled']),
    tin:                tinField,
    estate_tin:         tinField,
    psa_death_cert_no:  z.string().optional().nullable(),
    was_will_executed:  z.boolean(),
    will_type:          z.enum(['notarial', 'holographic']).optional().nullable(),
    will_location:      z.string().optional().nullable(),
    has_prior_bir_filing: z.boolean(),
    has_prior_ejs:      z.boolean(),
  }),

  settlement_track: z.enum(['extrajudicial', 'judicial']).optional().nullable(),

  family: z.object({
    surviving_spouse:   IntakeSpouseSchema.optional().nullable(),
    children:           z.array(IntakeChildSchema).default([]),
    parents:            z.array(z.object({
      full_name:   z.string().min(2),
      is_living:   z.boolean(),
      relationship: z.enum(['father', 'mother']),
    })).default([]),
    siblings:           z.array(z.object({
      full_name:             z.string().min(2),
      is_living:             z.boolean(),
      filiation:             z.enum(['legitimate', 'half-blood_father', 'half-blood_mother']),
      children_of_deceased:  z.array(IntakeGrandchildSchema).default([]),
    })).default([]),
  }),

  assets: z.object({
    real_property:       z.array(IntakeRealPropertySchema).default([]),
    bank_accounts:       z.number().int().min(0),
    shares_of_stock:     z.number().int().min(0),
    motor_vehicles:      z.number().int().min(0),
    personal_property:   z.number().int().min(0),
    other_assets:        z.number().int().min(0),
    outstanding_debts:   z.number().int().min(0),
    notes:               z.string().optional().nullable(),
  }),

  engagement_notes: z.string().optional().nullable(),
})

export type IntakeFormData = z.infer<typeof IntakeFormSchema>
```

---

## 3. UI Design

### 3.1 Routes

| Path | Component | Guard |
|------|-----------|-------|
| `/cases/new/intake` | `IntakeWizard` | `RequireAuth` |
| `/cases/new/intake?client=:id` | `IntakeWizard` (client pre-selected) | `RequireAuth` |
| `/cases/:id/intake` | `IntakeWizard` (edit existing intake) | `RequireAuth` |

Entry points:
- Dashboard → `[+ New Case]` → modal asks "Guided Intake" vs "Start Wizard Directly"
- Client detail page → `[+ New Case]` → goes directly to `/cases/new/intake?client=:id`
- From any route → `[+ New Case]` in top nav (authenticated) → intake wizard

### 3.2 Progress Indicator

All 6 steps share a top progress bar:

```
┌──────────────────────────────────────────────────────────────────────┐
│  New Estate Case — Guided Intake                                      │
│                                                                       │
│  Step 2 of 6                                                         │
│  ●━━━━━●━━━━━○━━━━━○━━━━━○━━━━━○                                    │
│  Client  Decedent  Track  Family  Assets  Review                     │
│                                                                       │
│                               [Save Draft]  [Cancel]                 │
└──────────────────────────────────────────────────────────────────────┘
```

- Steps completed: filled circle ●
- Current step: filled circle ● (highlighted)
- Future steps: empty circle ○
- "Save Draft" persists `intake_data` to the case without proceeding to wizard
- "Cancel" prompts "Discard this intake?" if any data was entered

### 3.3 Step 1 — Client Linkage

Who is the lawyer's client in this matter?

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 1: Who is your client?                                          │
│  ─────────────────────────────────────────────────────────────────── │
│  Select an existing client or create a new one.                       │
│                                                                       │
│  CLIENT                                                               │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search clients…                                            │  │
│  │  ──────────────────────────────────────────────────────────    │  │
│  │  Maria Santos Reyes                                            │  │
│  │  Juan dela Cruz Santos                                         │  │
│  │  ──────────────────────────────────────────────────────────    │  │
│  │  + Create new client                                           │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  Or leave unlinked — [Continue without a client]                      │
│                                                                       │
│  RELATIONSHIP TO DECEDENT                                             │
│  This client is the: [Select ▼]                                       │
│    • Surviving spouse                                                 │
│    • Child / heir                                                     │
│    • Executor named in will                                           │
│    • Court-appointed administrator                                    │
│    • Other heir                                                       │
│    • Third-party buyer                                                │
│                                                                       │
│  CONFLICT CHECK                                                       │
│  ⚠ Run conflict check before proceeding.  [Run Check →]              │
│  ✓ Conflict check passed — no matching clients found.                 │
│  (This message shown after check passes)                              │
│                                                                       │
│                                  [Next: Decedent Info →]              │
└──────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- ClientPicker combobox from spec-client-profiles
- "Create new client" opens `/clients/new?returnTo=/cases/new/intake` in same tab
- After client creation, redirects back and auto-selects the new client
- Conflict check button calls the spec-conflict-check API; result shown inline
- If conflict found: show warning but do not block (lawyer confirms they've reviewed)
- "Continue without a client" skips client selection; `client_id` remains null

### 3.4 Step 2 — Decedent Information

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 2: About the Decedent                                           │
│  ─────────────────────────────────────────────────────────────────── │
│  IDENTITY                                                             │
│  Full name *           [___________________________________________]  │
│                         As it appears on the death certificate        │
│  Date of death *       [___________]   (YYYY-MM-DD)                  │
│  Place of death        [___________________________________________]  │
│  Last known address    [___________________________________________]  │
│                         (City/municipality — determines BIR RDO)     │
│  Civil status at death [Select ▼]                                     │
│    • Single                                                           │
│    • Married                                                          │
│    • Widowed                                                          │
│    • Legally separated                                                │
│    • Marriage annulled                                                │
│                                                                       │
│  PHILIPPINE IDS                                                       │
│  Decedent TIN          [___-___-___]  (for BIR Form 1801 Part I)     │
│  Estate TIN            [___-___-___]  (from BIR Form 1904, if filed) │
│  PSA Death Cert No.    [___________________________________________]  │
│                                                                       │
│  WILL                                                                 │
│  Did the decedent leave a will?   ○ Yes   ● No                       │
│                                                                       │
│  [Shown only if Yes:]                                                 │
│  Will type    ○ Notarial   ○ Holographic                              │
│  Location     [___________________________________________]           │
│               e.g. "In custody of Atty. Reyes, Makati office"        │
│                                                                       │
│  PRIOR FILINGS                                                        │
│  Was an estate tax return (Form 1801) previously filed?  ○ Yes ● No  │
│  Was a prior extrajudicial settlement executed?          ○ Yes ● No  │
│                                                                       │
│              [← Back]                   [Next: Settlement Track →]   │
└──────────────────────────────────────────────────────────────────────┘
```

**Field notes:**
- `date_of_death` — must not be in the future; drives `spec-deadline-tracker` computation
- `last_address` — city/municipality routes to the correct RDO for BIR filing
- `decedent.tin` — required for BIR Form 1801; warn if missing but do not block
- `estate_tin` — if the lawyer has already filed Form 1904; can be blank
- Will section conditionally expands on "Yes"

### 3.5 Step 3 — Settlement Track

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 3: Determine Settlement Track                                   │
│  ─────────────────────────────────────────────────────────────────── │
│  Answer these questions to determine the appropriate track:           │
│                                                                       │
│  Does the decedent have a contested will?                             │
│  ○ Yes — there is a will and heirs are disputing it                   │
│  ● No  — no will, or will is uncontested                              │
│                                                                       │
│  Do all heirs agree on the distribution?                              │
│  ● Yes — all heirs consent                                            │
│  ○ No  — some heirs are in dispute                                    │
│                                                                       │
│  Are all heirs legal adults? (18 years old or above)                  │
│  ● Yes — all heirs are adults (or have court-approved guardians)      │
│  ○ No  — one or more heirs are minors without guardian orders         │
│                                                                       │
│  Are there outstanding debts that require court involvement?          │
│  ○ Yes — creditors may contest or there are unresolved debts          │
│  ● No  — debts are settled or manageable                              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Recommended Track: Extrajudicial Settlement (EJS)              │ │
│  │                                                                  │ │
│  │  All heirs are in agreement, no contested will, no complex       │ │
│  │  debts. EJS is faster (3–12 months) and less costly than         │ │
│  │  judicial probate. Governed by Rule 74, Rules of Court.          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Track selection   ● Extrajudicial (EJS)   ○ Judicial (Probate)      │
│  (Auto-selected from above but lawyer can override)                   │
│                                                                       │
│              [← Back]                    [Next: Family Composition →] │
└──────────────────────────────────────────────────────────────────────┘
```

**Logic:**
```typescript
function recommendedTrack(answers: TrackQuestions): 'extrajudicial' | 'judicial' {
  if (answers.contested_will) return 'judicial'
  if (answers.heirs_in_dispute) return 'judicial'
  if (answers.minors_without_guardian) return 'judicial'
  if (answers.complex_debts) return 'judicial'
  return 'extrajudicial'
}
```

The recommendation is advisory; the `settlement_track` field stores the lawyer's final selection.

### 3.6 Step 4 — Family Composition

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 4: Family Composition                                           │
│  ─────────────────────────────────────────────────────────────────── │
│  SURVIVING SPOUSE                                                     │
│  Is there a surviving spouse?   ● Yes   ○ No                         │
│                                                                       │
│  [Shown if Yes:]                                                      │
│  Spouse's full name     [____________________________________]        │
│  Date of birth          [__________]   TIN   [___-___-___]           │
│  Date of marriage       [__________]                                  │
│  Property regime        [ACP (Absolute Community) ▼]                  │
│    • ACP — Absolute Community (default for marriages after Aug 1988)  │
│    • CPG — Conjugal Partnership (marriages before Aug 1988 or prenup) │
│    • SPG — Separation of Property (prenuptial agreement)              │
│    • Exclusive — No conjugal/community property                       │
│  Prenuptial agreement?  ○ Yes ● No                                    │
│  Did spouse predecease the decedent?  ○ Yes ● No                     │
│                                                                       │
│  CHILDREN (0 added)                                [+ Add Child]      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  No children added. Click "+ Add Child" to begin.            │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  [After children are added, each row shows:]                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Ana Maria Santos                                       [✎] [✗]  │  │
│  │  Legitimate child · Living · DOB: 1985-03-12                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Pedro Santos Jr.                                       [✎] [✗]  │  │
│  │  Legitimate child · Deceased                             [+ Add grandchild]  │
│  │  └─ Carlos Santos (grandson, representing Pedro Jr.)    [✎] [✗]  │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  [Show parents section only if 0 children:]                           │
│  PARENTS                                       [+ Add Parent]         │
│                                                                       │
│  [Show siblings section only if 0 children AND no living parents:]   │
│  SIBLINGS                                      [+ Add Sibling]        │
│                                                                       │
│              [← Back]                   [Next: Estate Assets →]       │
└──────────────────────────────────────────────────────────────────────┘
```

**Add Child Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│  Add Child                                                   │
│  Full name *        [__________________________________]     │
│  Date of birth      [__________]                            │
│  Is this child living?   ● Yes   ○ No (deceased)            │
│  Filiation                                                   │
│    ● Legitimate child                                        │
│    ○ Legitimated child (legitimated by subsequent marriage)  │
│    ○ Acknowledged illegitimate (Art. 175 FC)                 │
│    ○ Non-acknowledged illegitimate                           │
│  Is this child a minor?   ○ Yes   ● No                       │
│  [If minor:] Guardian name  [__________________________]    │
│  TIN (optional)   [___-___-___]                              │
│                                                              │
│                    [Cancel]   [Add Child]                    │
└─────────────────────────────────────────────────────────────┘
```

**Add Grandchild Modal** (shown when child is deceased):
```
┌──────────────────────────────────────────────────────────────┐
│  Add Grandchild (representing [deceased child name])          │
│  Full name *        [__________________________________]      │
│  Date of birth      [__________]                             │
│  Is this grandchild living?   ● Yes   ○ No                   │
│  Filiation (of grandchild)   ● Legitimate   ○ Illegitimate   │
│  Is this grandchild a minor?  ○ Yes   ● No                   │
│  [If minor:] Guardian name   [__________________________]    │
│                                                               │
│                    [Cancel]   [Add Grandchild]                │
└──────────────────────────────────────────────────────────────┘
```

**Dynamic section visibility rules:**
- Parents section only shown if `children.length === 0`
- Siblings section only shown if `children.length === 0 AND parents.every(p => !p.is_living)`
- This mirrors the NCC succession order (Arts. 960–1014 NCC)

### 3.7 Step 5 — Estate Assets

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 5: Estate Assets (Preliminary)                                  │
│  These are estimates for now. Exact values will be entered in the     │
│  estate tax computation later.                                        │
│  ─────────────────────────────────────────────────────────────────── │
│  REAL PROPERTY                                     [+ Add Property]   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  No real properties added. Click "+ Add Property".           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  [After properties added:]                                            │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Residential lot, Pasig City — TCT No. 12345     [✎] [✗]     │    │
│  │  Estimated FMV: ₱4,500,000                                   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  OTHER ASSETS (estimated totals)                                      │
│  Bank accounts (total)     ₱ [_______________]  centavos            │
│  Shares of stock (FMV)     ₱ [_______________]                      │
│  Motor vehicles (FMV)      ₱ [_______________]                      │
│  Personal property          ₱ [_______________]                      │
│  Other assets               ₱ [_______________]                      │
│                                                                       │
│  DEDUCTIONS                                                           │
│  Outstanding debts / mortgages  ₱ [_______________]                  │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────── │
│  Estimated Net Distributable Estate:  ₱ 6,750,000.00                │
│  (Real property + other assets − debts. Spouse's share deducted      │
│   in estate tax computation, not here.)                               │
│                                                                       │
│  Notes on asset complications                                         │
│  [__________________________________________________________________] │
│  e.g. "One lot has cloudy title", "Bank account is joint account"    │
│                                                                       │
│              [← Back]                          [Next: Review →]       │
└──────────────────────────────────────────────────────────────────────┘
```

**Add Real Property Modal:**
```
┌──────────────────────────────────────────────────────────────┐
│  Add Real Property                                            │
│  Description *     [___________________________________]     │
│                    e.g. "Residential lot, Pasig City"        │
│  TCT/OCT/CCT No.   [___________________________________]     │
│  Tax Declaration   [___________________________________]     │
│  Location (city)   [___________________________________]     │
│  Estimated FMV  ₱  [___________________________________]     │
│                                                               │
│                  [Cancel]   [Add Property]                   │
└──────────────────────────────────────────────────────────────┘
```

**Monetary input component:**
- All monetary fields accept input in pesos (not centavos)
- Store as centavos (multiply ×100)
- Display formatted: "₱ 4,500,000.00"
- Allow commas: "4,500,000" → 4500000 pesos → 450000000 centavos

**Estimated Net Distributable Estate:**
```typescript
function computeEstimatedNet(assets: IntakeAssets): number {
  const realProp = assets.real_property.reduce(
    (s, p) => s + p.estimated_fmv_centavos, 0
  )
  const gross =
    realProp +
    assets.bank_accounts +
    assets.shares_of_stock +
    assets.motor_vehicles +
    assets.personal_property +
    assets.other_assets
  return Math.max(0, gross - assets.outstanding_debts)
}
```

Note shown to lawyer: "This is the gross estate minus debts. The surviving spouse's conjugal
share (if ACP/CPG) will be deducted when you complete the estate tax computation."

### 3.8 Step 6 — Review & Create Case

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 6: Review and Create Case                                       │
│  ─────────────────────────────────────────────────────────────────── │
│  SUMMARY                                                              │
│  Client:          Maria Santos Reyes [Edit]                          │
│  Decedent:        Juan dela Cruz Santos                               │
│  Date of death:   January 15, 2025                                   │
│  Civil status:    Married (ACP)                                       │
│  TIN:             123-456-789                                         │
│  Will:            None (intestate)                                    │
│  Settlement:      Extrajudicial                                       │
│                                                                       │
│  FAMILY                                                               │
│  Surviving spouse:  Maria Santos Reyes                                │
│  Children (2):      Ana Maria Santos (legitimate, living)             │
│                     Pedro Santos Jr. (legitimate, deceased)           │
│    Grandchildren:   Carlos Santos (representing Pedro Jr.)            │
│                                                                       │
│  ESTATE (estimated)                                                   │
│  Gross estate:      ₱ 6,000,000.00                                   │
│  Outstanding debts: ₱ 250,000.00                                     │
│  Net distributable: ₱ 5,750,000.00                                   │
│  Real properties:   1 (Pasig City, TCT No. 12345)                   │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────── │
│  NEXT STEPS                                                           │
│  ● After creating the case, you will be taken to the computation      │
│    wizard with all data pre-filled.                                   │
│  ● Review the wizard for accuracy and run the computation.            │
│  ● For testamentary succession, you will enter will instructions      │
│    in the wizard's Will Step.                                         │
│                                                                       │
│  ENGAGEMENT NOTES                                                     │
│  [__________________________________________________________________] │
│  [__________________________________________________________________] │
│  Optional — fee arrangement, scope of engagement, initial notes      │
│                                                                       │
│      [← Back]   [Save as Draft]           [Create Case & Continue →] │
└──────────────────────────────────────────────────────────────────────┘
```

**"Create Case & Continue →" behavior:**
1. `POST /cases` (via `createIntakeCase(intake)`)
2. Save: `cases.input_json = mapIntakeToEngineInput(intake)`, `cases.intake_data = intake`, `cases.client_id`, `cases.decedent_name`, `cases.date_of_death`, `cases.gross_estate = computeEstimatedNet(intake.assets)`, `status = 'draft'`
3. Redirect to `/?caseId={newCaseId}&prefilled=true` — the computation wizard with state loaded from the case
4. Wizard shows a banner: "Pre-filled from intake. Review each step and run computation."

**"Save as Draft" behavior:**
1. Same DB write as above but `status = 'draft'` and no redirect to wizard
2. Stays on review step with "Saved as draft. [Continue to wizard →]" message

---

## 4. API / Data Layer

### 4.1 createIntakeCase

```typescript
// lib/api/intake.ts
import { supabase } from '@/lib/supabase'
import { mapIntakeToEngineInput } from '@/lib/intake/mapToEngineInput'
import type { IntakeFormData } from '@/types/intake'

export async function createIntakeCase(
  userId: string,
  intake: IntakeFormData
): Promise<{ caseId: string; error: Error | null }> {
  const engineInput = mapIntakeToEngineInput(intake)
  const grossEstate = computeEstimatedNet(intake.assets)  // centavos

  const { data, error } = await supabase
    .from('cases')
    .insert({
      user_id:       userId,
      client_id:     intake.client_id ?? null,
      title:         `Estate of ${intake.decedent.full_name}`,
      decedent_name: intake.decedent.full_name,
      date_of_death: intake.decedent.date_of_death,
      gross_estate:  grossEstate,
      input_json:    engineInput as unknown as Json,
      intake_data:   intake as unknown as Json,
      status:        'draft',
    })
    .select('id')
    .single()

  return { caseId: data?.id ?? '', error: error as Error | null }
}
```

### 4.2 saveIntakeDraft

```typescript
// Upsert — used for "Save Draft" and for auto-save as user types
export async function saveIntakeDraft(
  caseId: string,
  intake: IntakeFormData
): Promise<{ error: Error | null }> {
  const engineInput = mapIntakeToEngineInput(intake)
  const { error } = await supabase
    .from('cases')
    .update({
      client_id:     intake.client_id ?? null,
      decedent_name: intake.decedent.full_name,
      date_of_death: intake.decedent.date_of_death,
      gross_estate:  computeEstimatedNet(intake.assets),
      input_json:    engineInput as unknown as Json,
      intake_data:   intake as unknown as Json,
      status:        'draft',
    })
    .eq('id', caseId)
  return { error: error as Error | null }
}
```

### 4.3 loadIntakeDraft

```typescript
// Load an existing draft into the intake wizard (resume mid-intake)
export async function loadIntakeDraft(
  caseId: string
): Promise<{ intake: IntakeFormData | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('cases')
    .select('intake_data, status')
    .eq('id', caseId)
    .single()

  if (error) return { intake: null, error: error as Error }
  if (!data?.intake_data) return { intake: null, error: null }

  // Validate the stored JSON against the current schema
  const parsed = IntakeFormSchema.safeParse(data.intake_data)
  if (!parsed.success) return { intake: null, error: new Error('Stored intake data is invalid') }

  return { intake: parsed.data, error: null }
}
```

### 4.4 computeEstimatedNet (shared utility)

```typescript
// lib/intake/computeEstimatedNet.ts
import type { IntakeAssets } from '@/types/intake'

export function computeEstimatedNet(assets: IntakeAssets): number {
  const real = assets.real_property.reduce((s, p) => s + p.estimated_fmv_centavos, 0)
  const gross =
    real +
    assets.bank_accounts +
    assets.shares_of_stock +
    assets.motor_vehicles +
    assets.personal_property +
    assets.other_assets
  return Math.max(0, gross - assets.outstanding_debts)
}
```

### 4.5 Intake Auto-Save

The intake wizard uses a 2-second debounced auto-save after a case has been created (the first
`createIntakeCase()` call happens when user enters Step 1 and proceeds to Step 2, or when user
explicitly clicks "Save Draft"). Auto-save only writes to the `intake_data` and `input_json` columns
via `saveIntakeDraft()`.

```typescript
// hooks/useIntakeAutoSave.ts
import { useEffect, useRef } from 'react'
import { saveIntakeDraft } from '@/lib/api/intake'
import { useDebounce } from '@/hooks/useDebounce'
import type { IntakeFormData } from '@/types/intake'

export function useIntakeAutoSave(
  caseId: string | null,
  intake: IntakeFormData
): void {
  const debouncedIntake = useDebounce(intake, 2000)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    if (!caseId) return
    saveIntakeDraft(caseId, debouncedIntake)
  }, [debouncedIntake, caseId])
}
```

---

## 5. Integration Points

| Feature | Integration |
|---------|------------|
| **spec-client-profiles** | Step 1 uses `ClientPicker` combobox; creates/links `clients` row; `conflict_cleared` field pre-populated from conflict check result |
| **spec-conflict-check** | "Run conflict check" button in Step 1 triggers conflict check before intake proceeds; result shown inline |
| **spec-auth-persistence** | `createIntakeCase()` writes to `cases` table; `intake_data JSONB` is a new column added via migration on top of spec-auth-persistence schema |
| **Computation wizard** | After intake, redirect to `/?caseId=...&prefilled=true`; wizard loads `input_json` from case; shows "Pre-filled from intake" banner on each step |
| **spec-bir-1801-integration** | `intake.assets` (real properties, bank accounts, etc.) seeds the estate tax input wizard's Schedules 1–4; `intake.decedent.tin` and `intake.decedent.estate_tin` appear in BIR Form 1801 Part I |
| **spec-document-checklist** | On case creation, checklist is auto-generated from intake answers: real properties → request TCT certified copies; bank accounts → request bank certification; motor vehicles → request OR/CR; `is_minor` heirs → flag guardianship order |
| **spec-deadline-tracker** | `date_of_death` from Step 2 feeds deadline computation: BIR deadline = DOD + 365 days; publication window tracked from deed execution date |
| **spec-case-notes** | `engagement_notes` from Step 6 becomes the first `case_notes` entry with author and timestamp |
| **spec-pdf-export** | `intake_data.decedent.tin` populates the PDF cover sheet; asset summary can appear in a preliminary section before the distribution table |

---

## 6. Component Hierarchy

```
pages/
  IntakeWizardPage              — route: /cases/new/intake
    IntakeProgressBar           — step indicators, step labels, Save Draft button
    IntakeStep1Client           — ClientPicker + relationship selector + conflict check
    IntakeStep2Decedent         — decedent fields + will toggle + prior filings
    IntakeStep3Track            — settlement track questions + auto-recommendation
    IntakeStep4Family           — spouse section + children list + parents + siblings
      SpouseForm                — inline form for spouse details + property regime
      HeirListManager           — add/edit/remove children with modal
        AddChildModal           — child form with filiation + minor flag
        AddGrandchildModal      — grandchild form for predeceased child
      ParentListManager         — add/edit/remove parents (shown if no children)
      SiblingListManager        — add/edit/remove siblings (shown if no children + no living parents)
    IntakeStep5Assets           — real property list + asset category inputs + estimated net
      RealPropertyListManager   — add/edit/remove with AddPropertyModal
      AddPropertyModal          — TCT/OCT/CCT + location + FMV
      AssetCategoryInputs       — bank, stocks, vehicles, personal, other, debts
      EstimatedNetDisplay       — live-computed net estate shown at bottom
    IntakeStep6Review           — summary cards + engagement notes + Create Case button
      IntakeSummaryCard         — collapsible review section per intake category
    IntakeWizardNav             — Back / Next / Save Draft / Create Case buttons

components/
  PHCurrencyInput               — peso input → centavos storage, formatted display
  MinorHeirGuardianField        — conditional guardian name field
  PropertyRegimeExplainer       — tooltip explaining ACP vs CPG
  SettlementTrackRecommender    — question-based track advisor
```

---

## 7. Edge Cases

### Existing Case with Intake Data

If navigating to `/cases/:id/intake` for a case that already has `intake_data`, the wizard
pre-loads from `intake_data`. A banner shows:
```
This intake was last updated on Feb 25, 2026. You are editing an existing intake.
[Discard changes and start fresh] if you want to reset.
```

### Zero Assets Entered

If all asset fields are 0 (lawyer skips Step 5), the net distributable estate = ₱0.00.
The review step shows a warning:
```
⚠ Estimated estate value is ₱0.00. You can add asset values now or enter them
directly in the computation wizard. The inheritance computation requires a non-zero estate.
```
This is a warning, not a blocker. Lawyer can proceed and enter the estate value in the wizard's
EstateStep.

### No Children, No Parents, No Siblings

If the family tree is empty in Step 4, the review step warns:
```
⚠ No heirs have been added. The inheritance engine requires at least one heir.
Please add heirs in the Family Composition step or in the computation wizard.
```
Again a warning, not a blocker.

### Minor Heir Without Guardian

If `child.is_minor = true` and `child.guardian_name` is blank, the Zod schema rejects on
step navigation. Inline error: "Guardian name is required for minor heirs (Rule 93, Rules of Court)."

### Decedent TIN Missing

TIN field is optional at intake (lawyer may not have it yet). If blank, a yellow info note shows
at the bottom of Step 2:
```
ℹ Decedent TIN not entered. You will need it for BIR Form 1801. Add it later in
estate tax inputs or edit this intake.
```
Does not block navigation.

### Spouse Marked as Predeceased

If `surviving_spouse.is_predeceased = true`:
- Step 4 shows inline note: "The spouse predeceased the decedent and will not be an heir.
  The inheritance computation will treat the estate as if the decedent was unmarried."
- `mapIntakeToEngineInput` sets `is_married = false` and `is_predeceased_spouse = true`
- Property regime is still captured (for estate tax conjugal share computation)

### Network Error Mid-Intake

If `createIntakeCase()` fails (network error):
- Show toast: "Could not save case. Check your connection and try again."
- Intake data is preserved in React state; user does not lose work
- The case ID is null; "Save Draft" button retries the create

### Duplicate Case Warning

Before creating the case, check if a case already exists with the same `decedent_name`
and `date_of_death` for this user:
```typescript
const { data: duplicates } = await supabase
  .from('cases')
  .select('id, title, status')
  .eq('user_id', userId)
  .eq('decedent_name', intake.decedent.full_name)
  .eq('date_of_death', intake.decedent.date_of_death)
  .limit(3)
```
If duplicates found, show modal:
```
A case for "Estate of Juan dela Cruz Santos" (January 15, 2025) already exists.

  Case #001 — Estate of Juan dela Cruz Santos (computed)  [Open]

[Create Anyway]  [Cancel]
```

### Family Section Visibility

When children are entered and then deleted:
- If count goes back to 0, parents section reappears
- This recalculates visibility dynamically — no page refresh needed

---

## 8. Dependencies

| Dependency | Reason |
|-----------|--------|
| **spec-auth-persistence** | `cases` table, `RequireAuth`, `useAuth`, save/load patterns |
| **spec-client-profiles** | `ClientPicker` combobox, `clients` table, `conflict_cleared` field |
| **spec-conflict-check** | Conflict check button and result display in Step 1 |
| **react-hook-form + zod** | Already in `package.json`; multi-step wizard form validation |
| **shadcn/ui** | `Dialog`, `Select`, `RadioGroup`, `Input`, `Button`, `Badge`, `Card`, `Tooltip`, `Alert` |

**New packages:**
No new npm packages required. All dependencies already present in the stack.

**New files required:**
| File | Purpose |
|------|---------|
| `src/types/intake.ts` | `IntakeFormData` interface and all sub-interfaces |
| `src/schemas/intake.ts` | Zod schema `IntakeFormSchema` |
| `src/lib/api/intake.ts` | `createIntakeCase`, `saveIntakeDraft`, `loadIntakeDraft` |
| `src/lib/intake/mapToEngineInput.ts` | `mapIntakeToEngineInput` and `buildFamilyTree` |
| `src/lib/intake/computeEstimatedNet.ts` | `computeEstimatedNet` shared utility |
| `src/hooks/useIntakeAutoSave.ts` | Debounced auto-save hook |
| `src/pages/IntakeWizardPage.tsx` | Main intake wizard container |
| `src/components/intake/IntakeStep1Client.tsx` | Step 1 — client selection |
| `src/components/intake/IntakeStep2Decedent.tsx` | Step 2 — decedent info |
| `src/components/intake/IntakeStep3Track.tsx` | Step 3 — settlement track |
| `src/components/intake/IntakeStep4Family.tsx` | Step 4 — family composition |
| `src/components/intake/IntakeStep5Assets.tsx` | Step 5 — estate assets |
| `src/components/intake/IntakeStep6Review.tsx` | Step 6 — review + create |
| `src/components/intake/AddChildModal.tsx` | Child add/edit modal |
| `src/components/intake/AddGrandchildModal.tsx` | Grandchild add/edit modal |
| `src/components/intake/AddPropertyModal.tsx` | Real property add/edit modal |
| `src/components/intake/PHCurrencyInput.tsx` | Peso input component |
| `supabase/migrations/005_intake_data.sql` | `ALTER TABLE cases ADD COLUMN intake_data JSONB` |

---

## 9. Acceptance Criteria

### Form Navigation
- [ ] Can navigate forward and backward through all 6 steps without losing data
- [ ] "Save Draft" on any step persists current intake data; case appears in dashboard as draft
- [ ] Reloading page with a `caseId` in URL restores all intake data from `intake_data` column
- [ ] "Cancel" with no data entered navigates away without confirmation
- [ ] "Cancel" with data entered shows "Discard intake?" confirmation modal

### Step 1 — Client
- [ ] ClientPicker searches existing clients with 300ms debounce
- [ ] "Create new client" opens `/clients/new?returnTo=...` and redirects back with new client selected
- [ ] "Continue without a client" leaves `client_id = null`
- [ ] Conflict check runs and displays result (passed / conflicts found) inline
- [ ] If conflict found, a warning badge shows on Step 1 progress indicator throughout the intake

### Step 2 — Decedent
- [ ] `date_of_death` cannot be a future date; shows inline error "Date of death cannot be in the future"
- [ ] TIN input auto-formats to XXX-XXX-XXX as user types
- [ ] Will section (type, location) only visible when "Yes" is selected for will question
- [ ] All fields except `full_name` and `date_of_death` are optional; intake can proceed without them

### Step 3 — Settlement Track
- [ ] Track auto-recommended based on answers to the 4 questions
- [ ] Lawyer can override recommendation via the radio buttons
- [ ] Recommendation box updates instantly when answers change

### Step 4 — Family
- [ ] Can add, edit, and remove children via modal
- [ ] Deceased child row shows "+ Add grandchild" button
- [ ] Grandchildren added under a deceased child appear indented in the list
- [ ] Minor child validation: if `is_minor = true`, guardian name is required before step can proceed
- [ ] Parents section hidden when at least one child exists
- [ ] Siblings section hidden when at least one child exists OR at least one living parent exists

### Step 5 — Assets
- [ ] Can add, edit, and remove real properties via modal
- [ ] Monetary inputs accept peso amounts (with or without commas); stored as centavos
- [ ] "Estimated Net Distributable Estate" recomputes live as values change
- [ ] Net cannot go below ₱0.00 (displayed as ₱0.00, not a negative number)

### Step 6 — Review
- [ ] Summary accurately reflects all data entered in steps 1–5
- [ ] "Create Case & Continue →" creates the case, writes `input_json` and `intake_data`, and redirects to the computation wizard at `/?caseId=...&prefilled=true`
- [ ] Wizard shows banner: "Pre-filled from intake. Review each step before computing."
- [ ] All wizard steps are pre-populated from the intake mapping
- [ ] WillStep of wizard shows empty will form (ready for lawyer to enter institutions/legacies if testate)

### Mapping Accuracy
- [ ] Surviving spouse → `EngineInput.decedent.is_married = true` and `spouse_name` populated
- [ ] Predeceased spouse → `EngineInput.decedent.is_predeceased_spouse = true` and `is_married = false`
- [ ] Legitimate child (living) → `family_tree` Person with `relationship = 'ChildOfDecedent'`, `filiation = 'Legitimate'`, `is_living = true`
- [ ] Deceased child with grandchildren → child Person with `is_living = false`; each grandchild as Person with `represents = child.id`
- [ ] Asset total correctly computes `net_distributable_estate` in centavos
- [ ] No will → `input.will = null`; will exists → `input.will = { institutions: [], legacies: [], devises: [], disinheritances: [] }`

### Auto-Save
- [ ] Auto-save fires 2 seconds after last change; save status indicator shows Saving → Saved
- [ ] Intake data survives browser refresh for any step if a case was already created
- [ ] `beforeunload` handler flushes pending intake draft to localStorage if case not yet created

### Security
- [ ] Anonymous user accessing `/cases/new/intake` is redirected to sign-in with `?next=/cases/new/intake`
- [ ] Intake creates case with `user_id = auth.uid()` — cannot create cases for other users (RLS)
- [ ] Loading `?caseId=X` where X belongs to another user returns 404 (RLS blocks read)

### Philippine-Specific
- [ ] TIN auto-formats to XXX-XXX-XXX
- [ ] Property regime dropdown explains ACP vs CPG difference (tooltip)
- [ ] Settlement track recommendation logic follows Rule 74 / Rule 75 distinction
- [ ] Minor heir guardian name field references "Rule 93, Rules of Court" in error message
- [ ] "Last known address" field has helper: "city/municipality — determines the BIR RDO for estate tax filing"

---

## Sources

- `analysis/crm-law-firm-patterns.md` — Client intake workflow sections A–F, dynamic form
  patterns (MyCase custom fields), estate-specific intake from DecisionVault/Estateably
- `analysis/spec-client-profiles.md` — ClientPicker combobox, clients table schema,
  TIN format validation, conflict_cleared field, Philippine ID types
- `analysis/codebase-audit.md` — EngineInput type, family_tree Person type, filiation values,
  inheritance modes (Representation), wizard steps for pre-fill navigation
- `analysis/ph-practice-workflow.md` — Stage 1 consultation data capture, Stage 2 document
  gathering requirements, settlement track decision logic (EJS vs Judicial), decedent TIN
  requirements for BIR Form 1801, minor heir + guardian considerations
- `analysis/spec-auth-persistence.md` — cases table schema, status state machine,
  createCase pattern, auto-save hook, RequireAuth guard
