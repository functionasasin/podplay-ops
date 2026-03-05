# Forward Ralph Loop — Inheritance UI/UX Redesign

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: restyle components, install dependencies, or fix visual regressions for a single stage, then commit and exit.

**CRITICAL — You are running in `--print` mode. You MUST output text describing what you are doing.** If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which stage you detected and what priority you matched
2. Print progress as you work (e.g., "Editing App.tsx for responsive breakpoints...")
3. End with a summary of what you did and whether you committed

## Your Working Directories

- **Loop dir**: `apps/inheritance/loops/forward/ui/` (frontier, status, loop script)
- **App dir**: `apps/inheritance/frontend/` (the Vite + React project — your canvas)
- **Existing components**: All components in `app/src/components/` are fully functional with tests passing

## Design Direction

**Aesthetic**: Professional legal tool — clean, authoritative, law-firm quality.
**Library**: shadcn/ui (Radix primitives + Tailwind CSS)
**Palette**: Navy + Gold

```
Primary:    #1e3a5f (deep navy)
Accent:     #c5a44e (warm gold)
Success:    #166534 (forest green)
Warning:    #92400e (amber brown)
Error:      #991b1b (deep red)
Surface:    #f8fafc (slate-50)
Border:     #e2e8f0 (slate-200)
Text:       #0f172a (slate-900)
Muted:      #64748b (slate-500)
```

**Typography**: Inter for UI text, serif (like Lora or Georgia) for legal headings/narratives.

**Design principles**:
- Whitespace over density — legal tools need breathing room
- Clear hierarchy with typography weight/size, not just color
- Subtle borders and shadows, nothing flashy
- Gold accent used sparingly — active states, key CTAs, scenario badges
- Form labels always visible (no floating labels)
- Error states must be unmistakable (red border + icon + text)

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — INSTALL & CONFIGURE** (if shadcn/ui is not installed):
   - Install shadcn/ui and its dependencies into `app/`
   - Configure the shadcn/ui theme with the Navy + Gold palette
   - Set up CSS custom properties for the color tokens
   - Install Inter font (via @fontsource/inter or Google Fonts CDN)
   - Configure Tailwind to use the custom palette
   - Verify `npm run dev` still works and existing tests still pass
   - Commit: `ui-forward: stage 1 - install shadcn/ui and configure design tokens`
   - Exit

   **Priority 2 — RESTYLE COMPONENTS** (if the stage's target components still use raw Tailwind):
   - Read the existing component code carefully
   - Replace raw Tailwind utility classes with shadcn/ui components (Button, Card, Input, Select, Badge, Table, etc.)
   - Apply the design tokens (colors, typography, spacing)
   - Keep ALL existing functionality — do NOT change props, state management, or form logic
   - Keep ALL existing data-testid attributes
   - Run `npx vitest run` — all tests must pass
   - Run the rendering smoke test (`npm run build`, check CSS bundle > 20KB) — styles must actually ship
   - Commit: `ui-forward: stage {N} - restyle {description}`
   - Exit

   **Priority 2b — POLISH & RESPONSIVE** (if the current stage is a polish/responsive pass, e.g. Stage 9):
   - This priority applies when the stage's work is NOT about replacing raw Tailwind, but about adding responsive breakpoints, spacing/typography audits, focus states, empty states, or consistency fixes
   - Read the Stage Details section for the current stage's specific task list
   - Work through the tasks methodically — you may do all tasks in one iteration if feasible
   - Keep ALL existing functionality, props, state management, data-testid attributes
   - Run `npx vitest run` — all tests must pass
   - Run the rendering smoke test (`npm run build`, check CSS bundle > 20KB)
   - Commit: `ui-forward: stage {N} - {description}`
   - Exit

   **Priority 3 — FIX REGRESSIONS** (if tests are failing after a restyle):
   - Read test output in `frontier/current-stage.md`
   - Fix the visual/structural issue without reverting the new design
   - Common issues: changed DOM structure breaks querySelector, removed className breaks test assertion
   - Keep data-testid attributes intact — tests rely on them
   - Commit: `ui-forward: stage {N} - fix {description}`
   - Exit

   **Priority 4 — DONE** (if all target components are restyled and tests pass):
   - Write `status/stage-{N}-complete.txt` and exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Stage Table

| Stage | Name | Target Components | Depends On |
|-------|------|-------------------|-----------|
| 1 | Design System Setup | — (install + config) | — |
| 2 | Shared Form Components | MoneyInput, DateInput, FractionInput, PersonPicker, EnumSelect | 1 |
| 3 | Wizard Shell & Navigation | WizardContainer, App.tsx (header, layout) | 1 |
| 4 | Estate + Decedent Steps | EstateStep, DecedentStep | 2, 3 |
| 5 | Family Tree Step | FamilyTreeStep, PersonCard, AdoptionSubForm, FiliationSection | 2, 3 |
| 6 | Will & Dispositions | WillStep, InstitutionsTab, LegaciesTab, DevisesTab, DisinheritancesTab, HeirReferenceForm, ShareSpecForm | 2, 3 |
| 7 | Donations + Review | DonationsStep, DonationCard, ReviewStep | 2, 3 |
| 8 | Results View | ResultsView, ResultsHeader, DistributionSection, NarrativePanel, WarningsPanel, ComputationLog, ActionsBar | 1 |
| 9 | Responsive + Final Polish | All components (responsive breakpoints, spacing audit, consistency pass) | 2-8 |

## Stage Details

### Stage 1 — Design System Setup

Install and configure the foundation. No component changes yet.

**Tasks**:
1. Initialize shadcn/ui in `app/`:
   - `npx shadcn@latest init` (select "New York" style, slate base, CSS variables: yes)
   - This creates `components.json`, `lib/utils.ts`, updates `tailwind.config.ts` and `globals.css`
2. **CRITICAL — Install and configure the Tailwind v4 Vite plugin**:
   - `npm install -D @tailwindcss/vite`
   - Update `vite.config.ts` to import and register the plugin:
     ```ts
     import tailwindcss from '@tailwindcss/vite'
     // ...
     plugins: [tailwindcss(), react()],
     ```
   - Without this, `@import "tailwindcss"` in CSS is silently ignored and ALL Tailwind classes resolve to nothing. Unit tests won't catch this because jsdom doesn't process CSS.
3. Override the default shadcn palette with Navy + Gold tokens in CSS custom properties:
   ```css
   :root {
     --primary: 213 52% 24%;        /* #1e3a5f navy */
     --primary-foreground: 0 0% 100%;
     --accent: 41 48% 53%;          /* #c5a44e gold */
     --accent-foreground: 0 0% 100%;
     --destructive: 0 63% 35%;      /* #991b1b deep red */
     --warning: 26 85% 30%;         /* #92400e amber brown */
     --success: 152 75% 24%;        /* #166534 forest green */
     /* ... keep other shadcn defaults for radius, ring, etc. */
   }
   ```
4. Add Inter font:
   - `npm install @fontsource-variable/inter`
   - Import in `main.tsx`: `import '@fontsource-variable/inter'`
   - Set `font-family: 'Inter Variable', sans-serif` as the base
5. Optionally add a serif font for legal headings (Lora or just use Georgia as fallback)
6. Install commonly needed shadcn components:
   ```
   npx shadcn@latest add button card input label select badge table separator accordion tabs dialog alert tooltip
   ```
7. **Verify the full pipeline** — all three checks must pass:
   - `npx vitest run` — all existing tests pass (functional correctness)
   - `npm run build` — production build succeeds
   - CSS bundle > 20KB — confirms Tailwind is actually processing classes (if < 5KB, the `@tailwindcss/vite` plugin is missing or misconfigured)
8. Write `status/stage-1-complete.txt`

### Stage 2 — Shared Form Components

Restyle the 5 shared form components to use shadcn/ui primitives.

**Target files** (`app/src/components/shared/`):
- `MoneyInput.tsx` → Use shadcn `Input` with "₱" prefix using input group pattern. Clean label above with shadcn `Label`. Error text below in destructive color.
- `DateInput.tsx` → Use shadcn `Input` type="date" with `Label`. Consider shadcn `Calendar`/`DatePicker` if available.
- `FractionInput.tsx` → Two shadcn `Input` fields with "/" separator between them. Inline layout.
- `PersonPicker.tsx` → Use shadcn `Select` with person options showing name + relationship `Badge`.
- `EnumSelect.tsx` → Use shadcn `Select` with option groups.
- Export barrel file `index.ts` — keep existing exports

**Rules**:
- Keep ALL existing props and form integration (react-hook-form control, name, etc.)
- Keep ALL data-testid attributes
- Run `npx vitest run` after each component — fix any test failures before moving on
- Tests in `shared/__tests__/` must all pass

### Stage 3 — Wizard Shell & Navigation

Restyle the wizard container and app shell.

**Target files**:
- `App.tsx` — Professional header with navy background, gold accent line. Centered content area with max-width. Subtle shadow on header. Loading spinner styled. Error state uses shadcn `Alert`.
- `WizardContainer.tsx` — Step indicators become a proper stepper/progress bar:
  - Horizontal step indicators with numbers
  - Current step highlighted with gold accent
  - Completed steps show checkmark
  - Step labels visible on desktop, hidden on mobile (just numbers)
  - Navigation buttons use shadcn `Button` (Back = outline variant, Next = default/primary, Submit = gold accent)
  - Wrap step content in a shadcn `Card` with proper padding

**Rules**:
- Keep ALL form state management, step logic, hasWill filtering
- Keep ALL data-testid attributes
- The wizard must remain functional — step navigation, form submission

### Stage 4 — Estate + Decedent Steps

Restyle the first two wizard steps.

**Target files**:
- `EstateStep.tsx` — Clean card layout. MoneyInput prominent. hasWill toggle as a styled switch or segmented control ("Intestate" / "Testate"). When testate, show subtle gold indicator.
- `DecedentStep.tsx` — Form fields in logical groups:
  - Section 1: Name + Date of Death
  - Section 2: Legitimacy status (is_illegitimate toggle)
  - Section 3: Marital status (is_married toggle → cascading marriage fields)
  - Section 4: Articulo mortis cascade (conditionally visible)
  - Use shadcn `Separator` between sections
  - Conditional fields should appear with smooth reveal (CSS transition on max-height or use Radix Collapsible)
  - Articulo mortis warning in a shadcn `Alert` with warning variant

### Stage 5 — Family Tree Step

The most complex step. Restyle the person repeater and all sub-forms.

**Target files**:
- `FamilyTreeStep.tsx` — "Add Person" button at top. Person cards in a stack. Empty state message styled.
- `PersonCard.tsx` — Each person in a shadcn `Card`:
  - Header: person name (editable) + relationship `Badge` (color-coded by category) + remove button (ghost variant, destructive)
  - Body: conditional fields in a clean grid layout
  - Collapsible sections for less common fields (unworthiness, renunciation)
  - Relationship selector as prominent shadcn `Select`
  - Status toggles (is_alive, is_unworthy, etc.) as clean switches with labels
- `AdoptionSubForm.tsx` — Nested card (slightly indented) with adoption-specific fields. Visually distinct border.
- `FiliationSection.tsx` — Compact section with filiation toggle + proof type selector.

**Design details**:
- Relationship badge colors (consistent with results view):
  - Legitimate Child/Legitimated/Adopted: blue (#2563eb)
  - Illegitimate Child: purple (#7c3aed)
  - Surviving Spouse: green (#059669)
  - Legitimate Parent/Ascendant: orange (#d97706)
  - Sibling/Nephew/Collateral: slate (#64748b)
  - Stranger: neutral (#a3a3a3)

### Stage 6 — Will & Dispositions

Restyle the 4 sub-tabs and their forms.

**Target files**:
- `WillStep.tsx` — Use shadcn `Tabs` component for the 4 sub-tabs. Date executed field at top.
- `InstitutionsTab.tsx` — Repeater with shadcn `Card` per institution. ShareSpec variant selector as segmented control or select.
- `LegaciesTab.tsx` — Similar card-based repeater. LegacySpec variant switcher.
- `DevisesTab.tsx` — Similar card-based repeater.
- `DisinheritancesTab.tsx` — Compact cards with cause code select and validity indicator badge.
- `HeirReferenceForm.tsx` — Inline form group (person picker + name + collective toggle).
- `ShareSpecForm.tsx` — Variant selector with contextual fields below.

### Stage 7 — Donations + Review

Restyle the donation cards and the review/summary page.

**Target files**:
- `DonationsStep.tsx` — Card-based repeater, empty state.
- `DonationCard.tsx` — Clean card with:
  - Header: donation description + value badge + remove button
  - Recipient section: heir picker or stranger toggle
  - Exemption flags as a clean checkbox group (only one active, others dim when one selected)
  - Professional expense cascade in a nested section
- `ReviewStep.tsx` — The crown jewel pre-submission screen:
  - Summary cards in a 2-column grid (estate, decedent, family tree count, will summary, donations count)
  - Predicted scenario badge: large, centered, gold background
  - Warnings section: dismissable alerts with severity icons
  - Advanced Settings: shadcn `Accordion` (collapsed by default)
  - "Compute Distribution" button: large, prominent, gold accent color

### Stage 8 — Results View

Restyle the results display — this is what users stare at.

**Target files**:
- `ResultsView.tsx` — Clean container with sections separated by whitespace.
- `ResultsHeader.tsx` — Large scenario badge (gold on navy). Succession type label. Estate total in prominent typography.
- `DistributionSection.tsx` — Recharts pie chart with the palette colors. Heir table using shadcn `Table` with proper column alignment. Excluded heirs in a collapsed `Accordion`.
- `NarrativePanel.tsx` — Each narrative in a shadcn `Accordion` item. First expanded. Legal text in serif font. Markdown bold rendered. Clean indentation.
- `WarningsPanel.tsx` — shadcn `Alert` components with severity-based variants (destructive, warning, default). Icon per severity.
- `ComputationLog.tsx` — Collapsed by default in an `Accordion`. Step list in a `Table` or structured list. Monospace font for step numbers.
- `ActionsBar.tsx` — Sticky bottom bar or card with 3 action buttons: Edit Input (outline), Export JSON (outline), Copy Narratives (outline). Clean spacing.

### Stage 9 — Responsive + Final Polish

Make everything work on mobile and do a consistency pass.

**Tasks**:
1. **Responsive breakpoints**:
   - Mobile (< 640px): Single column, step indicators show numbers only, cards stack vertically, pie chart above table
   - Tablet (640-1024px): Comfortable reading width, side padding
   - Desktop (> 1024px): Max-width 768px centered, generous whitespace
2. **Spacing audit**: Ensure consistent spacing throughout (use 4/6/8 spacing scale)
3. **Typography audit**: Ensure heading hierarchy is consistent (h1 for page title, h2 for step/section titles, h3 for sub-sections)
4. **Form field consistency**: All form fields same height, same label positioning, same error styling
5. **Focus states**: All interactive elements have visible focus rings (navy color)
6. **Empty states**: All repeaters (persons, donations, institutions, etc.) have styled empty state messages
7. Final `npx vitest run` — all tests must pass

## Rules

- Do ONE unit of work per iteration, then exit. Do not do multiple stages in one iteration.
- **NEVER change component logic, props, state management, or form integration** — only change styling/markup.
- **NEVER remove data-testid attributes** — tests depend on them.
- **NEVER modify test files** unless a test asserts a specific CSS class that changed (update the assertion, not the component).
- Run `npx vitest run` before committing — all tests must pass.
- Run the **rendering smoke test** (see below) before committing — CSS must actually load.
- If tests fail after a restyle, fix the restyle (Priority 3) before moving to new components.
- When in doubt about a shadcn/ui component, use the simpler option.
- Use `cn()` utility from shadcn for conditional class merging.
- Keep existing React Hook Form integration intact — shadcn/ui form components are compatible.
- Prefer shadcn/ui's built-in variants (e.g., `variant="destructive"`) over custom Tailwind classes.

## Rendering Smoke Test

Unit tests use jsdom which does NOT process CSS — they will pass even if Tailwind is completely broken. You MUST validate that styles actually render by running the build and checking the CSS output.

**Run this after every stage commit:**

```bash
cd apps/inheritance/frontend
npm run build 2>&1 | tail -5
CSS_SIZE=$(stat -c%s dist/assets/*.css 2>/dev/null || echo "0")
echo "CSS bundle size: ${CSS_SIZE} bytes"
```

**Validation rules:**
1. `npm run build` must succeed with zero errors
2. The CSS bundle must be **> 20KB** — if it's tiny (< 5KB), Tailwind classes are not being processed
3. If CSS is missing or tiny, check these common failure points:
   - `@tailwindcss/vite` must be installed AND added as a plugin in `vite.config.ts` (Tailwind v4 requirement — without this plugin, `@import "tailwindcss"` in CSS is silently ignored)
   - `index.css` must have `@import "tailwindcss"` at the top
   - The `@` path alias must resolve correctly in `vite.config.ts`

**Stage 1 specifically must verify:**
- `@tailwindcss/vite` is in `package.json` devDependencies
- `vite.config.ts` imports and uses the tailwindcss plugin: `import tailwindcss from '@tailwindcss/vite'` and `plugins: [tailwindcss(), react()]`
- After build, the CSS bundle contains the design token values (grep for `#1e3a5f` or `navy` in the CSS output)

## Commit Convention

```
ui-forward: stage {N} - {description}
```

Examples:
- `ui-forward: stage 1 - install shadcn/ui and configure navy + gold design tokens`
- `ui-forward: stage 2 - restyle shared form components with shadcn inputs`
- `ui-forward: stage 5 - restyle family tree step and person cards`
- `ui-forward: stage 9 - responsive breakpoints and final polish`

## Convergence

The loop is converged when:
1. All 9 stages have `status/stage-{N}-complete.txt` files
2. All existing tests pass (`npx vitest run`)
3. Every component uses the design system (no raw `bg-blue-600` or `text-gray-500` utility classes remain)
4. **Rendering smoke test passes**: `npm run build` succeeds and CSS bundle is > 20KB (proves styles actually ship to the browser)

When all conditions are met, write `status/converged.txt` with a summary.
