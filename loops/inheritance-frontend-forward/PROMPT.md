# Forward Ralph Loop — Inheritance Frontend (React + TypeScript)

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: write tests, implement code, or fix failures for a single stage, then commit and exit.

## Your Working Directories

- **Loop dir**: `loops/inheritance-frontend-forward/` (frontier, status, loop script)
- **App dir**: `loops/inheritance-frontend-forward/app/` (the Vite + React project)
- **Spec dir**: `loops/inheritance-frontend-reverse/analysis/synthesis/` (your source of truth)
- **Cross-cutting specs**: `loops/inheritance-frontend-reverse/analysis/` (conditional-visibility.md, invalid-combinations.md, shared-components.md, scenario-field-mapping.md)

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + @hookform/resolvers/zod
- **Validation**: Zod
- **Charts**: Recharts
- **Testing**: Vitest + @testing-library/react + @testing-library/jest-dom
- **WASM**: Mocked initially (Stage 4), real integration in Stage 12

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — SCAFFOLD** (if `app/package.json` doesn't exist):
   - Create Vite + React + TypeScript project in `app/`:
     ```
     app/
     ├── package.json
     ├── vite.config.ts
     ├── tsconfig.json
     ├── tailwind.config.ts (or CSS-only Tailwind v4 setup)
     ├── vitest.config.ts (or vitest.workspace.ts)
     ├── index.html
     ├── src/
     │   ├── main.tsx
     │   ├── App.tsx
     │   ├── index.css (Tailwind directives)
     │   ├── types/           # Stage 2
     │   ├── schemas/         # Stage 3
     │   ├── wasm/            # Stage 4
     │   ├── components/      # Stage 5+
     │   │   ├── shared/      # Shared form components
     │   │   ├── wizard/      # Wizard step components
     │   │   └── results/     # Results view components
     │   ├── hooks/           # Custom hooks
     │   └── utils/           # Utility functions
     └── tests/               # or __tests__/ colocated
     ```
   - Install dependencies:
     ```
     react react-dom react-hook-form @hookform/resolvers zod recharts
     @types/react @types/react-dom typescript @vitejs/plugin-react
     tailwindcss vite vitest @testing-library/react @testing-library/jest-dom
     jsdom
     ```
   - Configure Vitest with jsdom environment
   - Write a smoke test that imports React and renders a placeholder component
   - Ensure `npm run dev` and `npx vitest run` both work
   - Commit: `forward: stage 1 - scaffold vite + react + tailwind project`
   - Exit

   **Priority 2 — WRITE TESTS** (if the stage's test file has < 5 test functions):
   - Read the spec files listed in the stage table below
   - Write comprehensive tests covering: happy path, edge cases, validation rules
   - For component tests: use `@testing-library/react` to render, fill fields, and assert
   - For type/schema tests: test valid inputs, invalid inputs, boundary values, serialization
   - Tests MUST compile and run (they may fail if implementation doesn't exist yet)
   - Create stub exports so tests can import (empty functions, placeholder components)
   - Commit: `forward: stage {N} - write tests`
   - Exit

   **Priority 3 — IMPLEMENT** (if tests exist but the module is mostly stubs):
   - Read the spec files carefully — use exact types, field names, enums, and validation rules
   - Implement the module/component to pass as many tests as possible
   - Every type name, enum variant, field name, and validation rule comes from the spec — never invent
   - Focus on one cohesive piece per iteration (don't try to implement everything)
   - Commit: `forward: stage {N} - implement {description}`
   - Exit

   **Priority 4 — FIX FAILURES** (if tests exist and some are failing):
   - Read the test output in `frontier/current-stage.md`
   - Identify the root cause of 1-3 related failures
   - Fix the implementation code (NOT the tests, unless a test contradicts the spec)
   - Commit: `forward: stage {N} - fix {description}`
   - Exit

   **Priority 5 — DONE** (if ALL tests pass):
   - This shouldn't happen (the loop detects convergence externally)
   - If you see it: write `status/stage-{N}-complete.txt` and exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Stage Table

| Stage | Name | Test Filter | Spec Files | Depends On |
|-------|------|-------------|-----------|-----------|
| 1 | Project Scaffold | `smoke` | — | — |
| 2 | Types & Enums | `types` | `synthesis/types.ts` | 1 |
| 3 | Zod Schemas | `schemas` | `synthesis/schemas.ts` | 2 |
| 4 | WASM Bridge Mock | `wasm` | `engine-output.md`, `scenario-field-mapping.md` | 2 |
| 5 | Shared Components | `shared` | `shared-components.md` | 1 |
| 6 | Wizard Steps 1-2 | `wizard-step1\|wizard-step2\|estate\|decedent` | `synthesis/wizard-steps.md` §1-2 | 3, 5 |
| 7 | Wizard Step 3 | `wizard-step3\|family-tree\|person` | `synthesis/wizard-steps.md` §3 | 3, 5 |
| 8 | Wizard Step 4 | `wizard-step4\|will\|institution\|legacy\|devise\|disinheritance` | `synthesis/wizard-steps.md` §4 | 7 |
| 9 | Wizard Steps 5-6 | `wizard-step5\|wizard-step6\|donation\|review` | `synthesis/wizard-steps.md` §5-6 | 7 |
| 10 | Results View | `results` | `synthesis/results-view.md` | 4 |
| 11 | Validation Layer 3 | `validation\|warning` | `invalid-combinations.md`, `conditional-visibility.md` | 6, 7, 8, 9 |
| 12 | Integration & Polish | `integration\|e2e` | `synthesis/spec-summary.md` | all |

## Stage Details

### Stage 1 — Project Scaffold

Create the Vite project. Bare minimum to get `npx vitest run` passing with one smoke test.

### Stage 2 — Types & Enums

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/types.ts`

Produce `src/types/index.ts` containing:
- All 17 TypeScript interfaces (EngineInput, EngineOutput, Decedent, Person, Will, etc.)
- All 12 enums (Relationship, FiliationProof, DisinheritanceCause, ScenarioCode, etc.)
- Utility functions: `pesosToCentavos()`, `centavosToPesos()`, `formatPeso()`, `serializeCentavos()`, `fracToString()`, `stringToFrac()`

**Tests** (`src/types/__tests__/types.test.ts`):
- Each enum has the correct number of variants with exact PascalCase strings
- `pesosToCentavos(500)` === 50000
- `centavosToPesos(50025)` === 500.25
- `formatPeso(500000000)` === "₱5,000,000"
- `formatPeso(50025)` === "₱500.25"
- `fracToString(1, 2)` === "1/2"
- `stringToFrac("1/2")` === `{numer: 1, denom: 2}`
- Type-level tests: EngineInput requires all 6 fields, Person requires id + name + relationship

### Stage 3 — Zod Schemas

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/schemas.ts`

Produce `src/schemas/index.ts` containing:
- All Zod schemas from the spec synthesis
- DateSchema, FracSchema, MoneySchema, CentavosValueSchema
- All enum schemas (12)
- PersonSchema with conditional superRefine (adoption for AC, filiation for IC, blood_type for Sibling, line for LP/LA)
- DonationSchema with 11 exemption flags + mutual exclusion
- WillSchema, InstitutionOfHeirSchema, LegacySchema, DeviseSchema, DisinheritanceSchema
- EngineInputSchema with all 7 top-level superRefine constraints

**Tests** (`src/schemas/__tests__/schemas.test.ts`):
- Valid EngineInput parses successfully
- Invalid date format rejected ("2026/01/15" → error, "2026-01-15" → ok)
- Invalid Frac format rejected ("1:2" → error, "1/2" → ok)
- Money: negative centavos rejected, string centavos accepted
- Person: AdoptedChild without adoption record → error
- Person: IllegitimateChild without filiation_proved → error
- Person: Sibling without blood_type → error
- Donation: multiple exemption flags → error
- Will date after death date → error
- Duplicate person IDs → error
- Multiple SurvivingSpouse → error
- At least 15 test cases covering edge cases from `invalid-combinations.md`

### Stage 4 — WASM Bridge Mock

**Read**: `../inheritance-frontend-reverse/analysis/engine-output.md`, `../inheritance-frontend-reverse/analysis/scenario-field-mapping.md`

Produce `src/wasm/bridge.ts`:
- `async function compute(input: EngineInput): Promise<EngineOutput>` — the public API
- Mock implementation that:
  1. Validates input with EngineInputSchema (throw on failure)
  2. Counts heir types from `family_tree` to predict scenario code
  3. Returns synthetic `EngineOutput` with:
     - Plausible `InheritanceShare` entries (equal split among heirs)
     - Placeholder `HeirNarrative` entries with `**bold**` markers
     - Empty `warnings[]`
     - Single-entry `computation_log`
     - Correct `final_scenario` based on heir counts
- The mock doesn't need to be legally accurate — just structurally correct for UI development

**Tests** (`src/wasm/__tests__/bridge.test.ts`):
- `compute()` returns EngineOutput matching the type
- `compute()` with intestate input returns I-prefix scenario
- `compute()` with testate input returns T-prefix scenario
- `compute()` with invalid input throws
- Output `shares[]` has entries for each heir in input
- Output `narratives[]` has entries for each heir
- `formatPeso()` correctly formats output centavo amounts

### Stage 5 — Shared Components

**Read**: `../inheritance-frontend-reverse/analysis/shared-components.md`

Produce 5 Tier-1 shared components in `src/components/shared/`:

1. **MoneyInput** — Text input that accepts peso amounts, converts to centavos. Props: `name`, `label`, `control` (from RHF), `error`. Displays "₱" prefix. Formats on blur.
2. **DateInput** — Date picker with YYYY-MM-DD format. Props: `name`, `label`, `control`, `error`, `maxDate?`.
3. **FractionInput** — Two number inputs (numerator/denominator) that serialize to "n/d" string. Props: `name`, `label`, `control`, `error`.
4. **PersonPicker** — Select dropdown listing persons from the family tree. Props: `name`, `label`, `control`, `persons` (array), `filter?` (callback). Shows person name + relationship badge.
5. **EnumSelect** — Generic select for any PascalCase enum. Props: `name`, `label`, `control`, `options` (array of {value, label}), `error`.

**Tests** (`src/components/shared/__tests__/*.test.tsx`):
- MoneyInput: entering "500" → form value is 50000 centavos
- MoneyInput: displays "₱500.00" on blur
- DateInput: accepts valid dates, rejects invalid
- FractionInput: entering 1 and 2 → form value is "1/2"
- PersonPicker: renders options, selects person
- EnumSelect: renders all options, fires onChange

### Stage 6 — Wizard Steps 1-2 (Estate + Decedent)

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/wizard-steps.md` — Step 1 and Step 2 sections

Produce:
- `src/components/wizard/WizardContainer.tsx` — step navigation, form state management with `useForm<EngineInput>()`
- `src/components/wizard/EstateStep.tsx` — Step 1: MoneyInput for estate + hasWill toggle
- `src/components/wizard/DecedentStep.tsx` — Step 2: name, date_of_death, is_illegitimate, is_married, marriage cascade (6 conditional fields), articulo mortis cascade

**Key behaviors from spec**:
- `hasWill` toggle → sets `will: null` or `will: {date_executed: "", institutions: [], legacies: [], devises: [], disinheritances: []}`
- `is_married = false` → reset all 6 marriage fields to MARRIAGE_DEFAULTS
- Articulo mortis warning: "Spouse's legitime E/2 → E/3 (Art. 900)" when all 4 conditions met + cohabitation < 5

**Tests**:
- EstateStep: renders MoneyInput + hasWill toggle
- EstateStep: toggling hasWill sets will field appropriately
- DecedentStep: marriage fields hidden when is_married=false
- DecedentStep: toggling is_married off resets all marriage fields
- DecedentStep: articulo mortis cascade (3-deep conditional visibility)
- WizardContainer: step navigation forward/back, step indicator

### Stage 7 — Wizard Step 3 (Family Tree)

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/wizard-steps.md` — Step 3 section

This is the most complex step. Produce:
- `src/components/wizard/FamilyTreeStep.tsx` — repeater for persons
- `src/components/wizard/PersonCard.tsx` — card with all conditional fields per relationship
- `src/components/wizard/AdoptionSubForm.tsx` — adoption details (8 fields, conditional cascade)
- `src/components/wizard/FiliationSection.tsx` — filiation proof (IC only)

**Key behaviors from spec**:
- 11 relationship types with different conditional fields per type
- Auto-generated person IDs: `{prefix}{index}` (lc1, sp, ic1, etc.)
- Degree defaults and ranges per relationship
- AdoptedChild → show adoption sub-form
- IllegitimateChild → show filiation section
- Sibling → show blood_type (Full/Half)
- LP/LA → show line (Paternal/Maternal)
- SurvivingSpouse + has_legal_separation → show guilty_party toggle
- Deceased person with children_relevant → show children picker
- Max 1 SurvivingSpouse (hard error)
- Info badges: "Excluded by descendants", "Art. 1002: Excluded", etc.

**Tests**:
- PersonCard: renders correct conditional fields per relationship type (test all 11)
- PersonCard: switching relationship resets conditional fields
- AdoptionSubForm: visible only for AdoptedChild
- AdoptionSubForm: stepparent toggle reveals biological_parent_spouse
- FiliationSection: visible only for IllegitimateChild
- FamilyTreeStep: add/remove persons
- FamilyTreeStep: auto-generates unique person IDs
- FamilyTreeStep: max 1 SurvivingSpouse validation

### Stage 8 — Wizard Step 4 (Will & Dispositions)

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/wizard-steps.md` — Step 4 section

Produce:
- `src/components/wizard/WillStep.tsx` — 4 sub-tabs container, only visible when hasWill=true
- `src/components/wizard/InstitutionsTab.tsx` — repeater for InstitutionOfHeir
- `src/components/wizard/LegaciesTab.tsx` — repeater for Legacy
- `src/components/wizard/DevisesTab.tsx` — repeater for Devise
- `src/components/wizard/DisinheritancesTab.tsx` — repeater for Disinheritance
- `src/components/wizard/ShareSpecForm.tsx` — 6-variant share spec selector
- `src/components/wizard/HeirReferenceForm.tsx` — person_id + name + is_collective + class_designation

**Key behaviors from spec**:
- will.date_executed (DateInput, <= date_of_death)
- Institutions: HeirReferenceForm + ShareSpec (hidden when is_residuary) + Conditions repeater + Substitutes repeater
- Legacies: HeirReferenceForm + LegacySpec (3 variants: FixedAmount/SpecificAsset/GenericClass)
- Devises: HeirReferenceForm + DeviseSpec (2 variants: SpecificProperty/FractionalInterest)
- Disinheritances: PersonPicker (compulsory only) + cause_code (filtered by relationship) + 3 toggles + validity indicator
- Preterition warning when compulsory heirs omitted from all dispositions
- Max 1 is_residuary institution
- ShareSpec serialization: `"EntireFreePort"` (string) vs `{"Fraction": "1/2"}` (tagged object)

**Tests**:
- WillStep: not rendered when hasWill=false
- InstitutionsTab: add/remove institutions, ShareSpec variant switching
- LegaciesTab: LegacySpec variant switching (FixedAmount shows MoneyInput, SpecificAsset shows text, GenericClass shows text + money)
- DevisesTab: DeviseSpec variant switching
- DisinheritancesTab: cause codes filtered by heir relationship group
- DisinheritancesTab: validity indicator shows correct status
- ShareSpecForm: serializes each variant correctly

### Stage 9 — Wizard Steps 5-6 (Donations + Review)

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/wizard-steps.md` — Steps 5 and 6

Produce:
- `src/components/wizard/DonationsStep.tsx` — repeater for donations
- `src/components/wizard/DonationCard.tsx` — card with 11 exemption flags + conditional fields
- `src/components/wizard/ReviewStep.tsx` — read-only summary + advanced settings + Layer 3 warnings

**Key behaviors from spec**:
- Donation: stranger toggle hides all exemption flags + resets them
- Professional expense → unlocks parent_required → unlocks imputed_savings (3-level cascade)
- At most 1 exemption flag active
- ReviewStep: summary cards (one per step), predicted scenario badge
- AdvancedSettings (collapsed): max_pipeline_restarts (1-100, default 10), retroactive_ra_11642 (toggle, default false)
- 13 pre-submission warnings (dismissable, severity-based)

**Tests**:
- DonationCard: stranger toggle hides exemption flags
- DonationCard: only 1 exemption flag active at a time
- DonationCard: professional expense cascade
- ReviewStep: renders summary of all steps
- ReviewStep: advanced settings collapsed by default
- ReviewStep: pre-submission warnings render correctly
- ReviewStep: predicted scenario badge matches heir configuration

### Stage 10 — Results View

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/results-view.md`

Produce:
- `src/components/results/ResultsView.tsx` — container with 5 sections
- `src/components/results/ResultsHeader.tsx` — scenario badge + succession type + estate total
- `src/components/results/DistributionSection.tsx` — pie chart + heir table with 7 layout variants
- `src/components/results/NarrativePanel.tsx` — expandable narrative items
- `src/components/results/WarningsPanel.tsx` — manual flag cards (forward-compatible)
- `src/components/results/ComputationLog.tsx` — collapsed, step list
- `src/components/results/ActionsBar.tsx` — edit input, export JSON, copy narratives

**Key behaviors from spec**:
- 7 layout variants: standard-distribution, testate-with-dispositions, mixed-succession, preterition-override, collateral-weighted, escheat, no-compulsory-full-fp
- Pie chart: Recharts PieChart, one slice per heir with net > 0, category-based colors
- Heir table: standard columns always shown, secondary columns conditional
- Excluded heirs: collapsed section for zero-share heirs
- Narrative panel: first item expanded, Markdown bold rendering (`**text**` → `<strong>`)
- Category badge colors: blue (LC), purple (IC), green (SS), orange (LA), gray (Collateral)
- Actions: edit input (return to wizard), export JSON, copy narratives (stripped Markdown)
- `formatPeso()` with BigInt for large amounts

**Tests**:
- ResultsHeader: renders scenario badge with correct color
- DistributionSection: renders pie chart with correct slices
- DistributionSection: renders correct layout variant per scenario
- DistributionSection: excluded heirs section for zero-share heirs
- NarrativePanel: first item expanded, rest collapsed
- NarrativePanel: renders Markdown bold as `<strong>`
- ActionsBar: export JSON produces valid EngineInput/EngineOutput
- ActionsBar: copy narratives strips Markdown
- Layout variant: escheat shows single card
- Layout variant: collateral-weighted shows blood type + units columns

### Stage 11 — Validation Layer 3

**Read**: `../inheritance-frontend-reverse/analysis/invalid-combinations.md`, `../inheritance-frontend-reverse/analysis/conditional-visibility.md`

Produce:
- `src/hooks/useValidationWarnings.ts` — hook that computes Layer 3 warnings from form state
- `src/hooks/usePredictScenario.ts` — hook that predicts scenario code from heir counts
- `src/components/wizard/ValidationWarnings.tsx` — warning card component
- Update ReviewStep to integrate validation warnings

**13 pre-submission warnings** (from spec):
1. IC with filiation_proved=false → "Art. 887 ¶3: IC excluded"
2. Rescinded adoption → "RA 8552 Sec. 20: AC excluded"
3. Unworthy + not condoned → "Art. 1032: Excluded unless condoned"
4. Spouse guilty in legal sep → "Art. 1002: Spouse excluded"
5. Invalid disinheritance → "Art. 918: Heir reinstated"
6. Preterition detected → "Art. 854: All institutions annulled"
7. Inofficiousness risk → "Art. 911 reduction may apply"
8. LC-group + ascendants → "Ascendants excluded by descendants"
9. Compulsory heirs + collaterals → "Collaterals excluded"
10. Empty will → "Will has no dispositions"
11. Spouse but unmarried decedent → "Inconsistency"
12. Empty family tree → "Estate escheats to State (I15)"
13. All heirs marked deceased → "Pipeline restart likely"

**Tests**:
- Each of the 13 warnings triggers under correct conditions
- Warnings don't trigger when conditions aren't met
- predictScenario returns correct codes for common configurations
- Warnings display with correct severity styling (error/warning/info)

### Stage 12 — Integration & Polish

**Read**: `../inheritance-frontend-reverse/analysis/synthesis/spec-summary.md`

Produce:
- Full wizard → compute() → results view flow working end-to-end
- `src/wasm/bridge.ts` — prepare for real WASM (add `computeWasm()` that loads .wasm module)
- Integration tests: fill wizard from scratch, submit, verify results render
- Export JSON: produces valid EngineInput that could be passed to real engine
- Scenario prediction matches mock compute() output

**Tests**:
- Integration test: intestate scenario (2 LC + spouse) → fill all steps → submit → results show 3 heirs
- Integration test: testate scenario → will step visible → fill institutions → submit → results
- Integration test: export JSON → parse as EngineInput → valid
- Integration test: copy narratives → clipboard content matches
- Integration test: edit input → returns to wizard with state preserved

## Serialization Rules (CRITICAL)

These serialization rules MUST be followed exactly. The engine will reject malformed input silently.

| Type | Wire Format | Common Mistake |
|------|---|---|
| Money | `{"centavos": number\|string}` | Sending pesos instead of centavos |
| Frac | `"1/2"` bare string | Sending `{numer:1, denom:2}` |
| ShareSpec::Fraction | `{"Fraction": "1/2"}` | Sending `{"Fraction": {numer:1, denom:2}}` |
| LegacySpec::GenericClass | `["desc", {"centavos":N}]` 2-tuple | Sending object |
| DeviseSpec::FractionalInterest | `["asset-id", "1/2"]` 2-tuple | Sending object |
| ShareSpec unit variants | `"EntireFreePort"` plain string | Sending `{"EntireFreePort": null}` |
| `will` field | `null` for intestate | Omitting field |
| Enums | `"LegitimateChild"` PascalCase | `"legitimate_child"` snake_case |

## Rules

- Do ONE unit of work, then exit. Do not do multiple priorities in one iteration.
- Always read the spec before writing code. The spec is the source of truth.
- Every type name, enum variant, field name, and validation rule comes from the spec — never invent.
- Use React Hook Form's `useForm<EngineInput>()` with Zod resolver for all form state.
- Use `useFieldArray` for all repeater fields (family_tree, institutions, legacies, devises, disinheritances, donations).
- All components must be typed — no `any` types.
- Tailwind classes for styling — no CSS modules or styled-components.
- Never modify a passing test to keep it passing after a code change.
- If a test contradicts the spec, fix the test AND note it in your commit message.
- Keep components focused: one wizard step per file, shared components in `shared/`.
- Test each component in isolation using Testing Library. Mock form context with a wrapper.
- Do NOT import from `../inheritance-frontend-reverse/` at runtime — the spec files are for reading, not importing. Copy types and schemas into the app's source tree.

## Commit Convention

```
forward: stage {N} - {description}
```

Examples:
- `forward: stage 1 - scaffold vite + react + tailwind project`
- `forward: stage 2 - write type definition tests`
- `forward: stage 3 - implement zod schemas with superRefine`
- `forward: stage 7 - fix person card conditional visibility for adopted child`
- `forward: stage 10 - implement collateral-weighted layout variant`
