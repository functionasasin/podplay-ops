# Frontier — Inheritance Frontend Spec

## Statistics

- **Total aspects**: 25
- **Analyzed**: 25
- **Pending**: 0
- **Convergence**: 100%

## Wave 1: Rust Type → Frontend Spec (17 aspects)

- [x] engine-input-root — EngineInput struct, top-level shape and required fields
- [x] money — Money struct, centavos representation, pesos display conversion
- [x] engine-config — EngineConfig struct, boolean flags and defaults
- [x] decedent — Decedent struct, all fields including marriage and death-bed flags
- [x] person — Person struct, core fields (id, name, alive, degree, line)
- [x] relationship-enum — Relationship enum, all 11 variants and their implications
- [x] filiation-proof — FiliationProof enum, when required, valid options
- [x] blood-type — BloodType enum (Full/Half), sibling-only field
- [x] adoption — Adoption struct, regimes (RA 8552 vs RA 11642), rescission
- [x] will — Will struct, top-level shape, date_executed
- [x] institution-of-heir — InstitutionOfHeir struct, HeirReference, ShareSpec enum
- [x] legacy — Legacy struct, LegacySpec enum (FixedAmount, SpecificAsset, GenericClass)
- [x] devise — Devise struct, DeviseSpec enum (SpecificProperty, FractionalInterest)
- [x] condition-substitute — Condition and Substitute structs, enums for types/triggers
- [x] disinheritance — Disinheritance struct, 23 cause codes grouped by article
- [x] donation — Donation struct, 11+ exemption flags, collation rules
- [x] engine-output — EngineOutput, InheritanceShare, HeirNarrative, ComputationLog, ManualFlag

## Wave 2: Cross-Cutting Analysis (5 aspects)

- [x] conditional-visibility — Which fields appear/hide based on other field values (e.g. will step gated on testate, adoption sub-form on relationship type)
- [x] invalid-combinations — Combinations the engine rejects or that produce warnings (mine pipeline validation logic and test case failures)
- [x] scenario-field-mapping — Which scenario codes (T1-T15, I1-I15) are reachable from which input configurations, and how the results view adapts
- [x] test-case-field-coverage — Analyze all 20+ test case JSONs to verify Wave 1 specs cover every field value that appears in practice
- [x] shared-components — Identify reusable form components (MoneyInput, PersonPicker, DateInput, FractionInput) from Wave 1 field metadata

## Wave 3: Synthesis (3 aspects)

- [x] synthesis-types — Assemble complete types.ts from all Wave 1 TypeScript interfaces
- [x] synthesis-schemas — Assemble complete schemas.ts from all Wave 1 Zod schemas
- [x] synthesis-spec — Assemble wizard-steps.md, results-view.md, and spec-summary.md from all analysis

---

## FAILURE: Children for Representation — Insufficiently Specified

**Date discovered**: 2026-03-01
**Severity**: Spec gap led to unimplemented feature in forward loop

### What happened

The spec mentions `person.children` as a one-liner in the wizard-steps.md field table (line 228):
```
| person.children | Children (for Representation) | ... | PersonPicker (multi-select) | [] | No | All IDs must exist in family_tree |
```

And a single line in the person card layout:
```
(if dead + children_relevant)
Children (for representation): [PersonPicker multi]
```

This was NOT sufficient. Every other conditional section in the spec got a dedicated sub-section with:
- Detailed field breakdown (FiliationSection: 6 lines of spec)
- Layout diagram (AdoptionSubForm: full tree diagram)
- Variant-specific behavior (Legacy, Devise: variant tables)
- Reset/toggle logic (marriage cascade: explicit reset defaults)

`children` got none of this. The forward loop implemented it as a bare label stub with no actual picker, because the spec didn't describe:
1. That a **multi-select** PersonPicker doesn't exist — the shared PersonPicker component is single-select only
2. How to filter available persons (exclude self, optionally filter by relationship)
3. What helper text to show ("Select this person's children from the family tree")
4. What to show when no persons are available ("Add children first, then link them here")
5. How grandchildren work in the data model (children of a deceased LegitimateChild with degree 2+)

### Root cause

The reverse loop treated `children` as a simple field reference rather than recognizing it needs a **new UI pattern** (multi-select person picker via checkboxes) that doesn't exist in the shared component library. The spec's analysis of `person.md` even notes the field and its purpose but never escalated it to a dedicated component spec.

### Fix applied

Implemented `ChildrenForRepresentation` component in PersonCard.tsx with:
- Checkbox-based multi-select of family tree members
- Self-exclusion filter
- Helper text explaining representation
- Empty state when no other persons exist

---

## FAILURE: Authentication Flow — Completely Absent from Spec

**Date discovered**: 2026-03-03
**Severity**: Spec gap — entire feature missing, app non-functional on first run

### What happened

The forward loop's premium stages added Supabase auth infrastructure:
- `src/lib/supabase.ts` — client that **throws** if `VITE_SUPABASE_URL` is missing
- `src/lib/auth.ts` — full auth functions (signIn, signUp, signOut, Google OAuth, magic link)
- `src/hooks/useAuth.ts` — React hook wiring auth state
- `src/routes/auth.tsx` — auth page (placeholder only: "will be implemented in Stage 3")
- RLS policies on every table gated on `auth.uid()`
- Supabase migrations expecting authenticated users

But the reverse loop spec **never analyzed or specified authentication**:
1. No analysis document for auth flow (no `analysis/auth.md`)
2. No mention of sign-in/sign-up UI in `synthesis/wizard-steps.md` or `synthesis/spec-summary.md`
3. No auth stage in the forward loop's stage plan
4. The `/auth` route was added as a stub with "will be implemented in Stage 3" but Stage 3 in the plan is "Zod Schemas" — there is no auth stage

This resulted in:
- **Blank page on first run** — `supabase.ts` throws immediately without env vars, crashing the entire app before any component renders
- **No way to sign in** — even after configuring Supabase, the auth page had no form, just a placeholder message
- **Unregistered routes** — `/clients/new` and `/clients/$clientId` existed as files but weren't added to the router

### Root cause

The reverse loop analyzed only the inheritance calculator domain (types, schemas, wizard, results) and ignored the platform layer (auth, Supabase, routing registration, env configuration). The premium spec (`inheritance-premium-spec.md`) presumably covers auth but was never fed into the reverse loop's analysis pipeline. The forward loop's premium stages added auth infrastructure piecemeal without a spec to validate against.

### Fix applied

1. Created `.env.local` with Supabase project URL and anon key
2. Built functional auth page (`routes/auth.tsx`) with sign-in/sign-up forms using existing `useAuth` hook
3. Added auth-aware landing page — unauthenticated users see Sign In / Create Account buttons; authenticated users see welcome + New Case button
4. Registered missing routes (`/clients/new`, `/clients/$clientId`) in `router.ts`
5. Fixed duplicate migration (`006_case_documents.sql`) that prevented `supabase db push`

Additionally, the landing page (`routes/index.tsx`) rendered "Sign in to view your cases" as static text with no link or button to `/auth`. The sidebar navigation also had no Sign In entry. A new user visiting the app had zero affordance to discover authentication. This is a UX dead end that the spec never addressed because it never specified any unauthenticated user flow.

---

## FAILURE: Duplicate Database Migration — 006 Conflicts with 001

**Date discovered**: 2026-03-03
**Severity**: Blocks deployment — migrations fail on fresh project

### What happened

Migration `006_case_documents.sql` contains a `CREATE TABLE case_documents` statement, but this table is already created in `001_initial_schema.sql` (lines 291-317) with identical schema, indexes, RLS policy, and trigger. Running `supabase db push` on a fresh project fails at migration 006 with:

```
ERROR: relation "case_documents" already exists (SQLSTATE 42P07)
```

### Root cause

The premium stages were developed incrementally. Early stages created individual migration files (005 for deadlines, 006 for documents, 007 for conflict checks). Later, `001_initial_schema.sql` was consolidated to include all tables, but the now-redundant individual migrations were not removed or made idempotent.

### Fix applied

Replaced `006_case_documents.sql` contents with a no-op comment, preserving migration history consistency.
