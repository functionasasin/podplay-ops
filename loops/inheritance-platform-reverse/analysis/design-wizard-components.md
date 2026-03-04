# design-wizard-components — Wizard Step Design Audit

**Wave**: 3 — Design Modernization Audit
**Date**: 2026-03-04
**Components Audited**: WizardContainer, EstateStep, DecedentStep, FamilyTreeStep, PersonCard, WillStep, DonationsStep, DonationCard, ReviewStep, GuidedIntakeForm
**Status**: 24 gaps found

---

## Audit Scope

Files read:
- `app/src/components/wizard/WizardContainer.tsx` — step nav, card wrapper, navigation buttons
- `app/src/components/wizard/EstateStep.tsx` — money input, succession type radio
- `app/src/components/wizard/DecedentStep.tsx` — identity, legitimacy, marital status cascades
- `app/src/components/wizard/FamilyTreeStep.tsx` — person list, add button
- `app/src/components/wizard/PersonCard.tsx` — relationship badge, status toggles, sub-forms
- `app/src/components/wizard/WillStep.tsx` — custom tab bar, sub-tab panels
- `app/src/components/wizard/DonationsStep.tsx` — donation list, add button
- `app/src/components/wizard/DonationCard.tsx` — donation form, exemption flags
- `app/src/components/wizard/ReviewStep.tsx` — summary cards, scenario badge, warnings, compute
- `app/src/components/intake/GuidedIntakeForm.tsx` — 7-step guided intake container
- `app/src/components/wizard/FiliationSection.tsx` — illegitimate child filiation cascade

Cross-referenced against:
- `analysis/reference-modern-saas.md` — adopted SaaS patterns
- `analysis/journey-first-case.md` — journey gaps (JFC-*)

---

## Gap Summary

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| GAP-DWC-001 | HIGH | WizardContainer | Step indicator: no progress bar, no mobile scroll indicator |
| GAP-DWC-002 | HIGH | WizardContainer | Card has no visible step title — h2 is sr-only |
| GAP-DWC-003 | MEDIUM | WizardContainer | No animation when switching steps |
| GAP-DWC-004 | CRITICAL | WizardContainer + ReviewStep | Dual Submit buttons on Review step (also JFC-009) |
| GAP-DWC-005 | LOW | WizardContainer | Back button absence at step 0 causes nav row layout shift |
| GAP-DWC-006 | LOW | EstateStep | h2 is sr-only; no visual step heading |
| GAP-DWC-007 | MEDIUM | EstateStep | Zero estate warning is plain text, no icon |
| GAP-DWC-008 | HIGH | All steps | Raw native checkboxes/radios instead of shadcn Checkbox/RadioGroup |
| GAP-DWC-009 | LOW | DecedentStep | Level-1 nesting uses `border-border` instead of `border-primary/20` |
| GAP-DWC-010 | MEDIUM | FamilyTreeStep | Empty state is plain text, no icon/CTA pattern |
| GAP-DWC-011 | LOW | FamilyTreeStep | "Add Person" button has no visual affordance (dashed/outline style) |
| GAP-DWC-012 | HIGH | PersonCard | Relationship badge uses hardcoded off-palette colors (blue/purple/emerald) |
| GAP-DWC-013 | HIGH | PersonCard + FiliationSection | Raw native `<select>` instead of shadcn Select |
| GAP-DWC-014 | HIGH | WillStep | Custom hand-rolled tab bar duplicates shadcn Tabs component |
| GAP-DWC-015 | MEDIUM | DonationsStep | Empty state is plain text, no icon/CTA pattern |
| GAP-DWC-016 | LOW | DonationCard | Card header shows only "Donation #N", no date/recipient context |
| GAP-DWC-017 | MEDIUM | ReviewStep | Summary cards use inline sparse text, not KPI card pattern |
| GAP-DWC-018 | LOW | ReviewStep | Scenario badge hardcodes `text-white`, should use `text-accent-foreground` |
| GAP-DWC-019 | HIGH | ReviewStep | Compute button + scenario badge use `[hsl(var(--accent))]` hardcoded class |
| GAP-DWC-020 | MEDIUM | GuidedIntakeForm | Progress indicator uses off-palette `bg-green-100 text-green-800` for completed |
| GAP-DWC-021 | MEDIUM | GuidedIntakeForm | Step connectors (h-0.5) are too thin; active step pill needs more prominence |
| GAP-DWC-022 | LOW | GuidedIntakeForm | Cancel button placement inconsistent with back/next in step components |
| GAP-DWC-023 | HIGH | GuidedIntakeForm | Submission error caught but not surfaced to user (no toast) |
| GAP-DWC-024 | CRITICAL | All wizard steps | No field-level validation — required fields have no validation rules, no error display |

---

## Detailed Gap Specifications

### GAP-DWC-001 — Step Indicator: No Progress Bar, No Mobile Scroll Cue

**File**: `app/src/components/wizard/WizardContainer.tsx:184`

**Current state**: Step indicators are `flex items-center gap-1 mb-8 overflow-x-auto pb-2` — a horizontal row of numbered pills. On mobile (< sm), the step label `hidden sm:inline` is hidden but the connecting `h-px flex-1` lines vanish too (`hidden sm:block`), leaving only bare circles with no progress context.

**Fix**: Add a linear progress bar above the step pills. Keep the existing pills for desktop (they work). On mobile, replace with a compact `Step N of M` text + gold progress bar:

```tsx
// WizardContainer.tsx — replace the <nav> block at line 184
{/* Mobile: compact progress */}
<div className="sm:hidden mb-6">
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      Step {currentStepIndex + 1} of {visibleSteps.length}
    </span>
    <span className="text-sm font-semibold text-primary">{currentStep?.label}</span>
  </div>
  <div className="h-1 bg-border rounded-full overflow-hidden">
    <div
      className="h-full bg-accent rounded-full transition-all duration-300 ease-in-out"
      style={{ width: `${((currentStepIndex + 1) / visibleSteps.length) * 100}%` }}
    />
  </div>
</div>

{/* Desktop: step pills (existing, keep as-is but with sm:flex hidden) */}
<nav className="hidden sm:flex items-center gap-1 mb-8">
  {/* ... existing pill rendering unchanged ... */}
</nav>
```

**Result**: Mobile gets a gold progress bar + "Step 2 of 5 | Decedent Details" compact header. Desktop retains the full step pills.

---

### GAP-DWC-002 — Card Missing Visible Step Title

**File**: `app/src/components/wizard/WizardContainer.tsx:226`

**Current state**: Each step is wrapped in `<Card><CardContent className="pt-6">{renderStep()}</CardContent></Card>`. Steps use `h2 className="sr-only"` (accessibility only). The card surface has no visible step title.

**Fix**: Add a `CardHeader` above `CardContent` with the current step label:

```tsx
// WizardContainer.tsx — replace lines 226-230
<Card>
  <CardHeader className="pb-4 border-b border-border">
    <CardTitle className="text-lg font-semibold text-primary">
      {currentStep?.label}
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    {renderStep()}
  </CardContent>
</Card>
```

Import `CardTitle` from `@/components/ui/card`. Remove the `sr-only h2` from individual step components (EstateStep, DecedentStep, FamilyTreeStep) — they're redundant once the container shows the title. Keep `sr-only h2` in ReviewStep since it has its own visible `h2`.

**Result**: Every step has a visible "Decedent Details" / "Family Tree" / etc. header at the top of the card.

---

### GAP-DWC-003 — No Step Transition Animation

**File**: `app/src/components/wizard/WizardContainer.tsx:225`

**Current state**: `renderStep()` just swaps JSX with no animation. Step changes are jarring.

**Fix**: Add a `key` prop on the step content `div` to trigger re-mount, then animate with CSS:

```tsx
// WizardContainer.tsx — wrap renderStep() output
<Card>
  <CardHeader className="pb-4 border-b border-border">
    <CardTitle className="text-lg font-semibold text-primary">
      {currentStep?.label}
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    <div key={currentStep?.key} className="animate-step-enter">
      {renderStep()}
    </div>
  </CardContent>
</Card>
```

In `app/src/index.css`, add:
```css
@keyframes step-enter {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-step-enter {
  animation: step-enter 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  .animate-step-enter { animation: none; }
}
```

**Result**: Each step slides in from the right with a 200ms ease when the user clicks Next/Back.

---

### GAP-DWC-004 — Dual Submit Buttons on Review Step (CRITICAL)

**File**: `app/src/components/wizard/WizardContainer.tsx:244-259` and `app/src/components/wizard/ReviewStep.tsx:404-412`

**Current state**: When `currentStepIndex === visibleSteps.length - 1` (Review step), `WizardContainer` renders a "Submit" button (`line 252-259`) AND `ReviewStep` renders a "Compute Distribution" button (`line 404`). The user sees two blue buttons.

**Fix**: In `WizardContainer.tsx`, suppress the outer navigation buttons entirely when the current step is `review`, since `ReviewStep` handles its own submit action:

```tsx
// WizardContainer.tsx — replace lines 233-261
{/* Navigation buttons — hidden on review step (ReviewStep has its own Compute button) */}
{currentStep?.key !== 'review' && (
  <div className="flex justify-between mt-6">
    {currentStepIndex > 0 ? (
      <Button type="button" variant="outline" onClick={handleBack}>
        Back
      </Button>
    ) : (
      <div />  {/* spacer to keep Next right-aligned */}
    )}
    <Button type="button" onClick={handleNext}>
      Next
    </Button>
  </div>
)}
{/* Back button on review step (no Next/Submit — ReviewStep has Compute) */}
{currentStep?.key === 'review' && currentStepIndex > 0 && (
  <div className="flex mt-6">
    <Button type="button" variant="outline" onClick={handleBack}>
      Back
    </Button>
  </div>
)}
```

**Result**: On Review step, only "Back" (left) and "Compute Distribution" (inside ReviewStep, bottom of card) are visible. No duplicate submit.

---

### GAP-DWC-005 — Nav Row Layout Shift When No Back Button

**File**: `app/src/components/wizard/WizardContainer.tsx:233-261`

**Current state**: When `currentStepIndex === 0`, the `Back` button is hidden with `{currentStepIndex > 0 && ...}`. The Next button is `ml-auto`, so it floats right with nothing on the left. This creates a visual shift when transitioning from step 1 (no Back) to step 2 (Back appears).

**Fix**: Always render both slots. When no Back button, render a `<div />` spacer:

```tsx
<div className="flex justify-between mt-6">
  {currentStepIndex > 0 ? (
    <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
  ) : (
    <div />
  )}
  <Button type="button" onClick={handleNext}>Next</Button>
</div>
```

(Already specified in GAP-DWC-004 fix above — combined.)

---

### GAP-DWC-007 — Zero Estate Warning: Plain Text, No Icon

**File**: `app/src/components/wizard/EstateStep.tsx:54-56`

**Current state**:
```tsx
{showZeroWarning && (
  <p className="text-sm text-warning">Estate must be greater than zero</p>
)}
```

**Fix**: Replace with `Alert` component:
```tsx
// EstateStep.tsx — replace lines 54-56
{showZeroWarning && (
  <Alert className="border-warning/40 bg-warning/5">
    <AlertTriangle className="h-4 w-4 text-warning" />
    <AlertDescription className="text-warning text-sm">
      Estate value is zero — computation will produce zero distributions.
    </AlertDescription>
  </Alert>
)}
```

Add `AlertTriangle` to imports at line 1: `import { AlertTriangle } from 'lucide-react';`
Add `Alert, AlertDescription` to shadcn imports.

---

### GAP-DWC-008 — Native Checkboxes/Radios Instead of Shadcn Components

**Files**: `DecedentStep.tsx` (lines 104, 130, 156, 165, 179, 191), `EstateStep.tsx` (lines 70, 78), `PersonCard.tsx` (lines 214, 226, 238, 257, 319), `FiliationSection.tsx` (line 41), `ReviewStep.tsx` (line 393), `DonationCard.tsx` (lines 132, 209), `GuidedIntakeForm.tsx` (not applicable — uses step components)

**Current state**: Every checkbox uses `<input type="checkbox" className="h-4 w-4 rounded accent-primary">`. Every radio uses `<input type="radio" ... className="h-4 w-4 accent-primary">`. These render as native browser controls — inconsistent across OS/browser.

**Fix**: Replace with shadcn components throughout:

**Checkboxes** — use `<Checkbox>` from `@/components/ui/checkbox`:
```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Before:
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" checked={isMarried ?? false} onChange={handleMarriedChange}
    className="h-4 w-4 rounded accent-primary" />
  <span className="text-sm">Was Married at Time of Death</span>
</label>

// After:
<div className="flex items-center gap-2">
  <Checkbox
    id="is-married"
    checked={isMarried ?? false}
    onCheckedChange={(checked) => handleMarriedChange({ target: { checked: !!checked } } as any)}
  />
  <Label htmlFor="is-married" className="cursor-pointer">Was Married at Time of Death</Label>
</div>
```

**Radio buttons** — use `<RadioGroup>` + `<RadioGroupItem>` from `@/components/ui/radio-group`:
```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// EstateStep.tsx succession type — before:
<div className="flex gap-6 pt-1">
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="radio" name="succession-type" value="intestate" ... />
    <span className="text-sm">Intestate</span>
  </label>
  ...
</div>

// After:
<RadioGroup
  value={hasWill ? 'testate' : 'intestate'}
  onValueChange={(v) => handleSuccessionChange({ target: { value: v } } as any)}
  className="flex gap-6 pt-1"
>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="intestate" id="intestate" />
    <Label htmlFor="intestate">Intestate</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="testate" id="testate" />
    <Label htmlFor="testate">Testate</Label>
  </div>
</RadioGroup>
```

**Files to update**: `EstateStep.tsx`, `DecedentStep.tsx`, `PersonCard.tsx`, `FiliationSection.tsx`, `ReviewStep.tsx`, `DonationCard.tsx`.

---

### GAP-DWC-010 — FamilyTreeStep Empty State: Plain Text

**File**: `app/src/components/wizard/FamilyTreeStep.tsx:147-151`

**Current state**:
```tsx
{fields.length === 0 && (
  <p className="text-muted-foreground text-center py-8">
    No family members added yet. Click "Add Person" to begin.
  </p>
)}
```

**Fix**:
```tsx
import { Users } from 'lucide-react';

{fields.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
    <Users className="h-10 w-10 text-muted-foreground/30" />
    <p className="text-sm font-medium text-foreground">No family members yet</p>
    <p className="text-xs text-muted-foreground max-w-[220px]">
      Add each heir, spouse, and relative using the button below.
    </p>
  </div>
)}
```

---

### GAP-DWC-012 — PersonCard Relationship Badge: Off-Palette Colors

**File**: `app/src/components/wizard/PersonCard.tsx:28-40`

**Current state**: `RELATIONSHIP_BADGE_STYLES` uses `bg-blue-600`, `bg-purple-600`, `bg-emerald-600`, `bg-amber-600`, `bg-slate-500`, `bg-neutral-400` — arbitrary Tailwind colors disconnected from the Navy+Gold design system.

**Fix**: Remap to design-system tokens. The color groupings should reflect legal hierarchy:
```tsx
// PersonCard.tsx — replace RELATIONSHIP_BADGE_STYLES (lines 28-40)
const RELATIONSHIP_BADGE_STYLES: Record<Relationship, string> = {
  // Compulsory heirs — navy (highest legal standing)
  LegitimateChild:   'bg-primary text-primary-foreground',
  LegitimatedChild:  'bg-primary text-primary-foreground',
  AdoptedChild:      'bg-primary text-primary-foreground',
  IllegitimateChild: 'bg-primary/70 text-primary-foreground',
  SurvivingSpouse:   'bg-primary text-primary-foreground',
  LegitimateParent:  'bg-primary/80 text-primary-foreground',
  // Ascendants — gold-adjacent (secondary standing)
  LegitimateAscendant: 'bg-accent/20 text-amber-900 border border-accent/40',
  // Collaterals — muted (tertiary standing)
  Sibling:         'bg-secondary text-secondary-foreground border border-border',
  NephewNiece:     'bg-secondary text-secondary-foreground border border-border',
  OtherCollateral: 'bg-secondary text-secondary-foreground border border-border',
  // Stranger — neutral
  Stranger:        'bg-muted text-muted-foreground border border-border',
};
```

**Result**: Badges now communicate legal hierarchy (compulsory heirs = full navy, ascendants = gold-tinted, collaterals = neutral) using only design system colors.

---

### GAP-DWC-013 — Native `<select>` Elements Instead of Shadcn Select

**Files**: `app/src/components/wizard/PersonCard.tsx` (lines 171, 277, 299), `app/src/components/wizard/FiliationSection.tsx` (line 54)

**Current state**: Custom `selectClassName` string with hand-rolled `<select>` elements. Pattern defined at `PersonCard.tsx:22-26` and duplicated in `FiliationSection.tsx:9-13`.

**Fix**: Replace with shadcn `<Select>` + `<SelectGroup>` + `<SelectLabel>`. Example for Relationship dropdown:

```tsx
// PersonCard.tsx — imports to add
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Replace lines 169-193 (Relationship select)
<div className="space-y-2">
  <Label className="text-sm font-medium">Relationship to Decedent</Label>
  <Select value={relationship ?? ''} onValueChange={(v) => handleRelationshipChange({ target: { value: v } } as any)}>
    <SelectTrigger>
      <SelectValue placeholder="Select relationship..." />
    </SelectTrigger>
    <SelectContent>
      {(() => {
        const groups = new Map<string, typeof RELATIONSHIP_OPTIONS>();
        for (const opt of RELATIONSHIP_OPTIONS) {
          if (!groups.has(opt.group)) groups.set(opt.group, []);
          groups.get(opt.group)!.push(opt);
        }
        return Array.from(groups.entries()).map(([group, options]) => (
          <SelectGroup key={group}>
            <SelectLabel>{group}</SelectLabel>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectGroup>
        ));
      })()}
    </SelectContent>
  </Select>
</div>
```

Same replacement for Line of Descent select (`PersonCard.tsx:277`) and Blood Type select (`PersonCard.tsx:299`).

For `FiliationSection.tsx:54`, same Select pattern for `filiation_proof_type`.

Remove the `selectClassName` constant from both files after migration.

---

### GAP-DWC-014 — WillStep Custom Tab Bar Should Use Shadcn Tabs

**File**: `app/src/components/wizard/WillStep.tsx:45-62`

**Current state**: Hand-rolled tab buttons with `after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[hsl(var(--accent))]` underline indicator. Duplicates `@/components/ui/tabs`.

**Fix**:
```tsx
// WillStep.tsx — remove SUB_TABS const and activeTab state, replace with:
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Replace lines 36-103 return block:
return (
  <div data-testid="will-step" className="space-y-6">
    <h2 className="sr-only">Last Will &amp; Testament</h2>
    <DateInput<EngineInput>
      name={'will.date_executed' as any}
      label="Date Will Was Executed"
      control={control}
    />
    <Tabs defaultValue="Institutions">
      <TabsList className="w-full">
        {SUB_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-1">{tab}</TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="Institutions" className="pt-4">
        <InstitutionsTab control={control} setValue={setValue} watch={watch} errors={errors} persons={persons} />
      </TabsContent>
      <TabsContent value="Legacies" className="pt-4">
        <LegaciesTab control={control} setValue={setValue} watch={watch} errors={errors} persons={persons} />
      </TabsContent>
      <TabsContent value="Devises" className="pt-4">
        <DevisesTab control={control} setValue={setValue} watch={watch} errors={errors} persons={persons} />
      </TabsContent>
      <TabsContent value="Disinheritances" className="pt-4">
        <DisinheritancesTab control={control} setValue={setValue} watch={watch} errors={errors} persons={persons} />
      </TabsContent>
    </Tabs>
  </div>
);
```

Remove `useState` import if no longer needed. Remove `activeTab` state, `SUB_TABS` const, `cn` import.

---

### GAP-DWC-015 — DonationsStep Empty State: Plain Text

**File**: `app/src/components/wizard/DonationsStep.tsx:68-70`

**Fix**:
```tsx
import { Gift } from 'lucide-react';

{fields.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
    <Gift className="h-10 w-10 text-muted-foreground/30" />
    <p className="text-sm font-medium text-foreground">No donations recorded</p>
    <p className="text-xs text-muted-foreground max-w-[220px]">
      Add any donations made by the decedent that may affect collation.
    </p>
  </div>
)}
```

---

### GAP-DWC-016 — DonationCard Header Lacks Context

**File**: `app/src/components/wizard/DonationCard.tsx:116`

**Current state**: `<div className="font-semibold">Donation #{index + 1}</div>` — no date or recipient shown.

**Fix**: Show date and recipient name (if set) alongside the donation number:
```tsx
// DonationCard.tsx — replace line 116
<div className="flex items-center gap-2 min-w-0">
  <span className="font-semibold">Donation #{index + 1}</span>
  {donation?.date && (
    <span className="text-sm text-muted-foreground shrink-0">{donation.date}</span>
  )}
  {donation?.description && (
    <span className="text-sm text-muted-foreground truncate">— {donation.description}</span>
  )}
</div>
```

---

### GAP-DWC-017 — ReviewStep Summary Cards: Sparse Inline Layout

**File**: `app/src/components/wizard/ReviewStep.tsx:252-304`

**Current state**: Summary cards show e.g. `Estate: ₱1,000,000 | Intestate` as a single inline text string in `<CardContent className="text-sm">`. No visual hierarchy.

**Fix**: Apply KPI card pattern (Vercel-style). Replace each summary card:

```tsx
// ReviewStep.tsx — replace Estate card (lines 254-261):
<Card>
  <CardContent className="pt-4 pb-3">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
      Estate
    </p>
    <p className="text-xl font-bold text-primary font-mono">
      {estate?.centavos != null ? formatPeso(estate.centavos) : '—'}
    </p>
    <p className="text-xs text-muted-foreground mt-0.5">
      {hasWill ? 'Testate succession' : 'Intestate succession'}
    </p>
  </CardContent>
</Card>

// Decedent card (lines 263-274):
<Card>
  <CardContent className="pt-4 pb-3">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
      Decedent
    </p>
    <p className="text-base font-semibold text-foreground">{decedent?.name || '—'}</p>
    <p className="text-xs text-muted-foreground mt-0.5">
      Died {decedent?.date_of_death || '—'} · {decedent?.is_married ? 'Married' : 'Single'}
    </p>
  </CardContent>
</Card>

// Family tree card (lines 275-280):
<Card>
  <CardContent className="pt-4 pb-3">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
      Family Tree
    </p>
    <p className="text-xl font-bold text-primary">{familyTree.length}</p>
    <p className="text-xs text-muted-foreground mt-0.5">
      person{familyTree.length !== 1 ? 's' : ''} added
    </p>
  </CardContent>
</Card>
```

---

### GAP-DWC-019 — Hardcoded `[hsl(var(--accent))]` Classes

**Files**: `ReviewStep.tsx` (lines 307, 309, 408), `DonationsStep.tsx` mentions `text-[hsl(var(--primary))]` at line 66.

**Current state**: `bg-[hsl(var(--accent))]`, `text-[hsl(var(--primary))]` — arbitrary value classes instead of design-system tokens.

**Fix**: Search and replace throughout wizard components:

| Before | After |
|--------|-------|
| `bg-[hsl(var(--accent))]` | `bg-accent` |
| `bg-[hsl(var(--primary))]/5` | `bg-primary/5` |
| `border-[hsl(var(--primary))]/20` | `border-primary/20` |
| `text-[hsl(var(--primary))]` | `text-primary` |
| `hover:bg-[hsl(var(--accent))]/90` | `hover:bg-accent/90` |
| `text-[hsl(var(--accent))]` | `text-accent` |

**Files to update**: `ReviewStep.tsx` (lines 198, 307, 309, 408), `DonationsStep.tsx` (line 66), `DonationCard.tsx` (line 225).

After fix, `ReviewStep.tsx:408` compute button becomes:
```tsx
<Button
  type="button"
  onClick={onSubmit}
  size="lg"
  className="w-full py-6 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
>
  Compute Distribution
</Button>
```

---

### GAP-DWC-020 — GuidedIntakeForm Progress: Off-Palette Completed State

**File**: `app/src/components/intake/GuidedIntakeForm.tsx:215-217`

**Current state**: `bg-green-100 text-green-800` — hardcoded arbitrary Tailwind green classes.

**Fix**:
```tsx
// GuidedIntakeForm.tsx — replace line 215
i < currentStep && isStepComplete(state, i)
  ? 'bg-success/10 text-success'   // was: 'bg-green-100 text-green-800'
  : 'bg-muted text-muted-foreground'
```

Also replace the `'✓'` emoji with a Lucide icon:
```tsx
// Line 226 — replace '✓' with icon
import { Check } from 'lucide-react';
// In the button content:
{i < currentStep && isStepComplete(state, i) ? (
  <Check className="h-3 w-3" />
) : (
  i + 1
)}
```

---

### GAP-DWC-021 — GuidedIntakeForm Progress Connector Too Thin

**File**: `app/src/components/intake/GuidedIntakeForm.tsx:229-233`

**Current state**: `<div className={h-0.5 w-4 ...} />` — 2px tall connector, nearly invisible.

**Fix**: Match the reference-modern-saas stepper dot pattern — grow the active step pill into a rectangle:
```tsx
// Replace the connector div (lines 229-233):
{i < INTAKE_STEP_COUNT - 1 && (
  <div className={`h-0.5 flex-1 min-w-3 max-w-8 rounded-full transition-colors duration-200
    ${i < currentStep ? 'bg-primary' : 'bg-border'}`}
  />
)}
```

Also make the active step button more prominent:
```tsx
// Replace button className (lines 212-218):
className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold
  transition-all duration-200
  ${i === currentStep
    ? 'bg-accent text-accent-foreground shadow-sm scale-105'   // gold pill, slightly larger
    : i < currentStep && isStepComplete(state, i)
      ? 'bg-success/10 text-success'
      : 'bg-muted text-muted-foreground'
  }`}
```

---

### GAP-DWC-023 — GuidedIntakeForm Submission Error Not Surfaced

**File**: `app/src/components/intake/GuidedIntakeForm.tsx:103-106`

**Current state**:
```tsx
} catch (err) {
  console.error('Intake form submission error:', err);
  setIsSubmitting(false);
}
```

**Fix**: Add `toast.error()` call (requires `sonner` installed per GAP from `catalog-config`):
```tsx
// GuidedIntakeForm.tsx — add import at top:
import { toast } from 'sonner';

// Replace catch block (lines 103-106):
} catch (err) {
  console.error('Intake form submission error:', err);
  toast.error(
    err instanceof Error ? err.message : 'Failed to create case — please try again'
  );
  setIsSubmitting(false);
}
```

---

### GAP-DWC-024 — No Field-Level Validation in Wizard Steps (CRITICAL)

**Files**: `app/src/components/wizard/WizardContainer.tsx` (line 79), all step components

**Current state**: `useForm<EngineInput>({ defaultValues: {...} })` — no validation resolver, no required rules. `methods.formState.errors` is always empty. Fields accept empty/invalid values and the form submits silently.

**Required fields that must validate before Next/Submit**:
- `EstateStep`: `net_distributable_estate.centavos` must be > 0
- `DecedentStep`: `decedent.name` required (non-empty), `decedent.date_of_death` required (valid ISO date)
- `FamilyTreeStep`: at most 1 `SurvivingSpouse` (already validated inline)
- `ReviewStep`: `config.max_pipeline_restarts` must be 1–100

**Fix — Part 1**: Add `zodResolver` to `WizardContainer.tsx`:
```tsx
// WizardContainer.tsx — add imports:
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const engineInputSchema = z.object({
  net_distributable_estate: z.object({
    centavos: z.number().min(1, 'Estate value must be greater than zero'),
  }),
  decedent: z.object({
    id: z.string(),
    name: z.string().min(1, 'Decedent name is required'),
    date_of_death: z.string().min(1, 'Date of death is required'),
    is_married: z.boolean(),
    // ... remaining fields optional/default
  }).passthrough(),
  family_tree: z.array(z.any()),
  will: z.any().nullable(),
  donations: z.array(z.any()),
  config: z.object({
    max_pipeline_restarts: z.number().min(1).max(100),
    retroactive_ra_11642: z.boolean(),
  }),
});

const methods = useForm<EngineInput>({
  defaultValues: { ...DEFAULT_ENGINE_INPUT, ...defaultValues },
  resolver: zodResolver(engineInputSchema),
  mode: 'onBlur',  // validate on blur, not on every keystroke
});
```

**Fix — Part 2**: Gate `handleNext` on per-step validation. Trigger only the fields for the current step:
```tsx
// WizardContainer.tsx — replace handleNext:
const handleNext = async () => {
  const stepFieldMap: Record<string, string[]> = {
    estate: ['net_distributable_estate.centavos'],
    decedent: ['decedent.name', 'decedent.date_of_death'],
    'family-tree': [],  // validated inline
    will: [],           // optional step
    donations: [],      // optional
    review: ['config.max_pipeline_restarts'],
  };
  const fieldsToValidate = stepFieldMap[currentStep?.key ?? ''] ?? [];
  if (fieldsToValidate.length > 0) {
    const valid = await methods.trigger(fieldsToValidate as any);
    if (!valid) return;
  }
  if (currentStepIndex < visibleSteps.length - 1) {
    setCurrentStepIndex(currentStepIndex + 1);
  }
};
```

**Fix — Part 3**: Display error messages below fields. Each step should render:
```tsx
// Pattern for error display (add below each input that needs validation)
{methods.formState.errors.decedent?.name && (
  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
    <AlertTriangle className="h-3 w-3 shrink-0" />
    {methods.formState.errors.decedent.name.message}
  </p>
)}
```

**Affected files**: `WizardContainer.tsx`, `EstateStep.tsx`, `DecedentStep.tsx`.
Also add `zod` and `@hookform/resolvers` to `package.json` if not already installed (check: neither appears in catalog-config findings — they need to be added).

---

## Modernization Specs Summary

| ID | Component | Current | Target |
|----|-----------|---------|--------|
| MOD-DWC-001 | WizardContainer | Pills only, mobile overflow | Gold progress bar on mobile, pills on desktop |
| MOD-DWC-002 | WizardContainer | sr-only step title | Visible CardHeader with step name |
| MOD-DWC-003 | WizardContainer | No transition | 200ms slide-in from right |
| MOD-DWC-004 | WizardContainer | Dual submit buttons | Back only on Review step; ReviewStep owns Compute |
| MOD-DWC-005 | All steps | Native checkboxes/radios | shadcn Checkbox, RadioGroup |
| MOD-DWC-006 | PersonCard | Off-palette badge colors | Navy/gold/neutral mapped to legal hierarchy |
| MOD-DWC-007 | PersonCard + FiliationSection | Native `<select>` | shadcn Select with SelectGroup |
| MOD-DWC-008 | WillStep | Custom hand-rolled tabs | shadcn Tabs component |
| MOD-DWC-009 | FamilyTreeStep + DonationsStep | Plain text empty states | Icon + title + description pattern |
| MOD-DWC-010 | ReviewStep | Inline sparse summary cards | KPI card pattern (label / metric / subtext) |
| MOD-DWC-011 | ReviewStep + others | `[hsl(var(--accent))]` classes | Design-system tokens `bg-accent text-accent-foreground` |
| MOD-DWC-012 | GuidedIntakeForm | `bg-green-100 text-green-800` | `bg-success/10 text-success` |
| MOD-DWC-013 | WizardContainer | No validation | Zod schema + per-step field trigger |

---

## New CSS Additions Required (app/src/index.css)

```css
/* Step enter animation for wizard */
@keyframes step-enter {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-step-enter {
  animation: step-enter 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  .animate-step-enter { animation: none; }
}
```

---

## New Dependencies Required

```json
// package.json additions (check if already installed first):
"zod": "^3.22.0",
"@hookform/resolvers": "^3.3.0"
```

Verify: `grep -r "zod\|@hookform/resolvers" app/package.json`
