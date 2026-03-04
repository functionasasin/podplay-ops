# design-shared-components — Shared Form Component Design Audit

**Wave**: 3 — Design Modernization Audit
**Date**: 2026-03-04
**Components Audited**: MoneyInput, DateInput, PersonPicker, FractionInput, EnumSelect, PrintHeader + intake step components that use them (ClientDetailsStep, DecedentInfoStep, FamilyCompositionStep)
**Status**: 21 gaps found

---

## Audit Scope

Files read:
- `app/src/components/shared/MoneyInput.tsx` — currency input, centavos↔pesos, react-hook-form controller
- `app/src/components/shared/DateInput.tsx` — HTML date input wrapper, react-hook-form controller
- `app/src/components/shared/PersonPicker.tsx` — family-tree person selector, native `<select>`
- `app/src/components/shared/FractionInput.tsx` — n/d split inputs with preset chips
- `app/src/components/shared/EnumSelect.tsx` — generic enum dropdown, native `<select>`
- `app/src/components/shared/PrintHeader.tsx` — print-only header (references `print-header` CSS class)
- `app/src/styles/print.css` — print media query, defines `.print-header`
- `app/src/components/intake/ClientDetailsStep.tsx` — three inline native selects + Label+Input pattern
- `app/src/components/intake/DecedentInfoStep.tsx` — native radios without accent-primary class
- `app/src/components/intake/FamilyCompositionStep.tsx` — native select + native radios per heir row
- `app/src/components/ui/input.tsx` — shadcn Input (has `aria-invalid` ring support)
- `app/src/components/ui/button.tsx` — confirms `size="xs"` IS defined

Cross-referenced against:
- `analysis/design-wizard-components.md` — GAP-DWC-008 (native checkboxes/radios), GAP-DWC-013 (native selects)
- `analysis/catalog-config.md` — no toast library installed

---

## Gap Summary

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| GAP-DSC-001 | CRITICAL | PrintHeader | `styles/print.css` never imported — `.print-header` CSS class undefined at runtime |
| GAP-DSC-002 | HIGH | PersonPicker | Native `<select>` with manually copied `selectClassName` instead of shadcn Select |
| GAP-DSC-003 | HIGH | EnumSelect | Same — native `<select>` with copy-pasted `selectClassName` (4th distinct select variant in codebase) |
| GAP-DSC-004 | HIGH | ClientDetailsStep | 3 inline native selects with different className strings (5th, 6th, 7th variants) |
| GAP-DSC-005 | HIGH | FamilyCompositionStep | Native select per heir row + native radios without `accent-primary` class |
| GAP-DSC-006 | HIGH | All shared form components | `useController` returns `fieldState.error` but components ignore it — require manual `error` prop from parent |
| GAP-DSC-007 | HIGH | FractionInput | Label element only wraps the text `<span>`, not the inputs — label is not programmatically associated with either input |
| GAP-DSC-008 | MEDIUM | MoneyInput | Zero warning (`warnOnZero`) is plain unstyled text — no icon, inconsistent with Alert pattern |
| GAP-DSC-009 | MEDIUM | DateInput | Hint appears before error in DOM order — error should always appear last as immediate feedback |
| GAP-DSC-010 | MEDIUM | FractionInput | Preset buttons (1/2, 1/3, etc.) have no selected/active state when value matches a preset |
| GAP-DSC-011 | MEDIUM | PersonPicker | Placeholder hardcoded as `"-- Select --"`, unlike EnumSelect which accepts `placeholder` prop |
| GAP-DSC-012 | MEDIUM | FamilyCompositionStep | Empty-heir state is italic muted text, not icon+description pattern |
| GAP-DSC-013 | MEDIUM | DecedentInfoStep | Native radios use `className="h-4 w-4"` (no `accent-primary`) — third radio style variant in codebase |
| GAP-DSC-014 | MEDIUM | ClientDetailsStep | Hint text under "decedent address" `<p>` duplicates the placeholder text — redundant |
| GAP-DSC-015 | LOW | MoneyInput | `readOnly` mode has no visual indicator — no background tint, no cursor change |
| GAP-DSC-016 | LOW | DateInput | Browser-native calendar picker icon, inconsistent visual language — partial fix available via CSS |
| GAP-DSC-017 | LOW | PersonPicker | Relationship shown parenthetically in option text — no visual badge treatment possible with native select |
| GAP-DSC-018 | LOW | EnumSelect | `optgroup` elements are OS-styled — inconsistent with design system after shadcn Select migration |
| GAP-DSC-019 | LOW | FractionInput | `FractionInput:97-99` outer `<label>` wraps only the text span, not inputs — clicking label text doesn't focus numerator |
| GAP-DSC-020 | LOW | All shared components | `error` prop typed as `string | undefined` — should be `string | null | undefined` for react-hook-form compatibility |
| GAP-DSC-021 | LOW | PrintHeader | No `aria-label` on print header div — low impact since it's print-only, but missing role="banner" |

---

## Detailed Gap Specifications

### GAP-DSC-001 — PrintHeader: print.css Never Imported (CRITICAL)

**File**: `app/src/styles/print.css` + `app/src/index.css`

**Current state**: `PrintHeader.tsx:9` says "Hidden on screen via the `print-header` CSS class (see print.css)." The class is defined in `app/src/styles/print.css:37` as `display: none` (screen) and `display: block !important` (print). However, `print.css` is never imported anywhere in the app:

```
app/src/index.css imports:
  @import "tailwindcss";
  @import "tw-animate-css";
  @import "shadcn/tailwind.css";
  ← no @import "./styles/print.css"
```

`grep -r "print.css" app/src/` returns only the test file and PrintHeader.tsx comment — no actual import.

**Impact**: `.print-header` class is undefined in the browser. `PrintHeader` renders visibly on screen instead of being hidden. Print view also loses the header.

**Fix**: Add the import to `app/src/index.css` after the existing imports:

```css
/* app/src/index.css — add after line 3 */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "./styles/print.css";   /* ← ADD THIS */
```

**Result**: `.print-header` is hidden on screen, visible during print. PrintHeader component works as documented.

---

### GAP-DSC-002 + GAP-DSC-003 — PersonPicker + EnumSelect: Native Selects with Duplicated className

**Files**: `app/src/components/shared/PersonPicker.tsx:24-28`, `app/src/components/shared/EnumSelect.tsx:22-26`

**Current state**: Both files define an identical `selectClassName` constant:

```tsx
// PersonPicker.tsx:24-28 (identical in EnumSelect.tsx:22-26)
const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);
```

These render as native OS `<select>` elements — appearance varies across browsers/OS. Intake step files (`ClientDetailsStep.tsx`, `FamilyCompositionStep.tsx`) use *different* inline native select className strings (ring-1 vs ring-[3px]).

**Inventory of distinct native select class variants in codebase**:
1. `PersonPicker.tsx` / `EnumSelect.tsx` — `ring-[3px]` variant
2. `ClientDetailsStep.tsx:86` — `ring-1` variant, no shadow-xs
3. `ClientDetailsStep.tsx:115` — same as #2
4. `ClientDetailsStep.tsx:176` — same as #2
5. `FamilyCompositionStep.tsx:109` — `ring-1` variant
6. `DecedentInfoStep.tsx` — raw `<input type="radio" className="h-4 w-4">` (no accent-primary)

**Fix — PersonPicker.tsx**: Replace native `<select>` with shadcn Select:

```tsx
// PersonPicker.tsx — full replacement of the select block (lines 74-101)
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Replace lines 74-101:
return (
  <div data-testid="person-picker" className="space-y-2">
    <label className="block">
      <span className="text-sm font-medium leading-none">{label}</span>
    </label>
    <Select
      value={selectValue === STRANGER_VALUE ? STRANGER_VALUE : (field.value ?? '')}
      onValueChange={(v) => {
        if (v === STRANGER_VALUE) {
          field.onChange(null as unknown as T[typeof name]);
        } else {
          field.onChange(v as unknown as T[typeof name]);
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select person..." />
      </SelectTrigger>
      <SelectContent>
        {filteredPersons.map((person) => (
          <SelectItem key={person.id} value={person.id}>
            <span className="font-medium">{person.name}</span>
            {person.relationship && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({person.relationship})
              </span>
            )}
          </SelectItem>
        ))}
        {allowStranger && (
          <SelectItem value={STRANGER_VALUE}>
            <span className="text-muted-foreground">Other (not in family tree)</span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);
```

Remove `selectClassName` const and `STRANGER_VALUE` export (keep internal). Remove `cn` import if no longer used.

**Fix — EnumSelect.tsx**: Replace native `<select>` with shadcn Select:

```tsx
// EnumSelect.tsx — full replacement of the select block (lines 91-109)
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';

return (
  <div data-testid="enum-select" className="space-y-2">
    <label className="block">
      <span className="text-sm font-medium leading-none">{label}</span>
    </label>
    <Select
      value={field.value ?? ''}
      onValueChange={(v) => field.onChange(v as unknown as T[typeof name])}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? 'Select...'} />
      </SelectTrigger>
      <SelectContent>
        {hasGroups ? (
          (() => {
            const groups = new Map<string, EnumOption<V>[]>();
            for (const opt of filteredOptions) {
              const g = opt.group ?? 'Other';
              if (!groups.has(g)) groups.set(g, []);
              groups.get(g)!.push(opt);
            }
            return Array.from(groups.entries()).map(([groupName, opts]) => (
              <SelectGroup key={groupName}>
                <SelectLabel>{groupName}</SelectLabel>
                {opts.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.description && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        — {opt.description}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectGroup>
            ));
          })()
        ) : (
          filteredOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
              {opt.description && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  — {opt.description}
                </span>
              )}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);
```

Remove `selectClassName` const and `cn` import if no longer used.

---

### GAP-DSC-004 + GAP-DSC-005 — Intake Steps: Multiple Native Select Variants

**Files**: `ClientDetailsStep.tsx:78-94, 109-124, 170-185`, `FamilyCompositionStep.tsx:101-117`

**Current state**: Each intake step uses a raw `<select>` with an inline className that differs slightly from the shared components. Example:

```tsx
// ClientDetailsStep.tsx:86 — note: ring-1 not ring-[3px], no transition-[color,box-shadow]
className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm
  shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
```

Three inline variants in ClientDetailsStep.tsx alone, all slightly different.

**Fix — ClientDetailsStep.tsx**: Replace all three native selects with shadcn Select:

```tsx
// Add import at top:
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Replace relationship select (lines 78-95):
<div className="space-y-2">
  <Label htmlFor="client-relationship">Relationship to Decedent *</Label>
  <Select
    value={state.relationship_to_decedent ?? ''}
    onValueChange={(v) => update({ relationship_to_decedent: (v || null) as ClientRelationship | null })}
  >
    <SelectTrigger id="client-relationship">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
    <SelectContent>
      {CLIENT_RELATIONSHIPS.map((r) => (
        <SelectItem key={r} value={r}>{CLIENT_RELATIONSHIP_LABELS[r]}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

// Replace civil status select (lines 108-124) — same pattern
// Replace gov id type select (lines 169-185) — same pattern
```

**Fix — FamilyCompositionStep.tsx**: Replace per-heir `<select>` with shadcn Select:

```tsx
// Add import at top:
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Replace lines 101-117 per heir card:
<div className="space-y-1">
  <Label htmlFor={`heir-rel-${index}`}>Relationship</Label>
  <Select
    value={heir.relationship}
    onValueChange={(v) => updateHeir(index, { relationship: v as Relationship })}
  >
    <SelectTrigger id={`heir-rel-${index}`}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {RELATIONSHIPS.map((r) => (
        <SelectItem key={r} value={r}>{RELATIONSHIP_DISPLAY[r]}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

Also fix the native radios in the heir status (lines 122-141) — replace with shadcn RadioGroup:

```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Replace lines 119-143:
<div className="space-y-1">
  <Label>Status</Label>
  <RadioGroup
    value={heir.is_alive ? 'alive' : 'predeceased'}
    onValueChange={(v) => updateHeir(index, { is_alive: v === 'alive' })}
    className="flex items-center gap-3 pt-1"
  >
    <div className="flex items-center gap-1.5">
      <RadioGroupItem value="alive" id={`heir-alive-${index}`} />
      <Label htmlFor={`heir-alive-${index}`} className="text-sm font-normal cursor-pointer">
        Alive
      </Label>
    </div>
    <div className="flex items-center gap-1.5">
      <RadioGroupItem value="predeceased" id={`heir-predeceased-${index}`} />
      <Label htmlFor={`heir-predeceased-${index}`} className="text-sm font-normal cursor-pointer">
        Predeceased
      </Label>
    </div>
  </RadioGroup>
</div>
```

---

### GAP-DSC-006 — All Shared Components: fieldState.error Ignored

**Files**: `MoneyInput.tsx:32-33`, `DateInput.tsx:27`, `PersonPicker.tsx:44`, `FractionInput.tsx:36`, `EnumSelect.tsx:41`

**Current state**: All five components use `useController` but only destructure `field`:

```tsx
const { field } = useController({ name, control });
```

`useController` also returns `fieldState` containing `fieldState.error`. When react-hook-form's validation fires (after GAP-DWC-024 zod resolver is added), errors are stored in `fieldState.error` automatically. But none of the shared components surface this — they require the parent to pass `error={methods.formState.errors.xxx?.message}` explicitly.

**Fix**: Destructure `fieldState` in all five components and use it as fallback:

```tsx
// Pattern to apply to all five files:
const { field, fieldState } = useController({ name, control });

// In the error rendering, use fieldState.error?.message as default:
{(error || fieldState.error?.message) && (
  <p className="text-sm text-destructive">
    {error ?? fieldState.error?.message}
  </p>
)}
```

**Files to update**:
- `MoneyInput.tsx`: line 32 → `const { field, fieldState } = useController(...)`, line 120 → `{(error || fieldState.error?.message) && ...}`
- `DateInput.tsx`: line 27 → same pattern, line 45 → same pattern
- `PersonPicker.tsx`: line 44 → same pattern, line 99 → same pattern
- `FractionInput.tsx`: line 36 → same pattern, line 140 → same pattern
- `EnumSelect.tsx`: line 41 → same pattern, line 107 → same pattern

**Result**: When the zod resolver fires and marks a field invalid, the error message auto-appears below the input without requiring any prop wiring at usage sites.

---

### GAP-DSC-007 — FractionInput: Label Not Associated with Inputs

**File**: `app/src/components/shared/FractionInput.tsx:96-99`

**Current state**:

```tsx
// lines 96-99 — the <label> wraps ONLY the span, not the inputs
<div data-testid="fraction-input" className="space-y-2">
  <label>
    <span className="text-sm font-medium leading-none">{label}</span>
  </label>
  <div className="flex items-center gap-2">
    <Input ... aria-label="Numerator" />
    <span>/</span>
    <Input ... aria-label="Denominator" />
  </div>
```

The `<label>` closes before the inputs. Clicking the label text doesn't focus any input. Screen readers don't associate the label with either input.

**Fix**: Convert to explicit `htmlFor` association on the numerator input:

```tsx
// FractionInput.tsx — replace lines 96-124
<div data-testid="fraction-input" className="space-y-2">
  <label htmlFor={`${String(name)}-numer`} className="text-sm font-medium leading-none">
    {label}
  </label>
  <div className="flex items-center gap-2">
    <Input
      id={`${String(name)}-numer`}
      type="number"
      value={numer}
      onChange={handleNumerChange}
      min={0}
      readOnly={readOnly}
      aria-readonly={readOnly ? 'true' : undefined}
      disabled={readOnly}
      className="w-20"
      aria-label="Numerator"
    />
    <span className="text-muted-foreground font-medium">/</span>
    <Input
      id={`${String(name)}-denom`}
      type="number"
      value={denom}
      onChange={handleDenomChange}
      min={1}
      readOnly={readOnly}
      aria-readonly={readOnly ? 'true' : undefined}
      disabled={readOnly}
      className="w-20"
      aria-label="Denominator"
    />
  </div>
```

Clicking the label text now focuses the numerator input. Both inputs retain `aria-label` for screen reader context.

---

### GAP-DSC-008 — MoneyInput: Zero Warning Has No Icon

**File**: `app/src/components/shared/MoneyInput.tsx:121-123`

**Current state**:

```tsx
{showZeroWarning && (
  <p className="text-sm text-warning">Value is ₱0</p>
)}
```

Plain text. Inconsistent with GAP-DWC-007 fix (Alert with icon in EstateStep).

**Fix**:

```tsx
// MoneyInput.tsx — add import at top:
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Replace lines 121-123:
{showZeroWarning && (
  <Alert className="border-warning/40 bg-warning/5 py-2">
    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
    <AlertDescription className="text-warning text-xs">
      Value is ₱0 — verify this is intentional.
    </AlertDescription>
  </Alert>
)}
```

---

### GAP-DSC-009 — DateInput: Hint Before Error in DOM Order

**File**: `app/src/components/shared/DateInput.tsx:44-46`

**Current state**:

```tsx
{hint && <p className="text-sm text-muted-foreground">{hint}</p>}
{error && <p className="text-sm text-destructive">{error}</p>}
```

Error (highest priority feedback) appears after hint guidance.

**Fix**: Swap order — show error first, then hint:

```tsx
// DateInput.tsx — replace lines 44-46:
{error && <p className="text-sm text-destructive">{error}</p>}
{hint && <p className="text-sm text-muted-foreground">{hint}</p>}
```

**Result**: Validation errors are immediately visible below the input; guidance text appears after.

---

### GAP-DSC-010 — FractionInput: Preset Buttons Have No Active State

**File**: `app/src/components/shared/FractionInput.tsx:126-138`

**Current state**: All preset buttons (`1/2`, `1/3`, `1/4`, `2/3`, `3/4`) always render as `variant="outline"` regardless of the current value.

**Fix**: Derive active state from current numer/denom and apply `variant="default"` when matching:

```tsx
// FractionInput.tsx — replace lines 126-138:
{showPresets && (
  <div className="flex gap-1.5 flex-wrap">
    {FRACTION_PRESETS.map((preset) => {
      const isActive = numer === String(preset.numer) && denom === String(preset.denom);
      return (
        <Button
          key={preset.label}
          type="button"
          variant={isActive ? 'default' : 'outline'}
          size="xs"
          onClick={() => handlePresetClick(preset)}
          aria-pressed={isActive}
        >
          {preset.label}
        </Button>
      );
    })}
  </div>
)}
```

**Result**: When user selects "1/2", the "1/2" chip highlights in navy (`variant="default"` → `bg-primary text-primary-foreground`). Clearing the inputs deselects all.

---

### GAP-DSC-011 — PersonPicker: Hardcoded Placeholder Text

**File**: `app/src/components/shared/PersonPicker.tsx:85`

**Current state**: `<option value="">-- Select --</option>` — hardcoded, not configurable.

**Fix**: After migration to shadcn Select (GAP-DSC-002 fix), the placeholder is set via `<SelectValue placeholder={...} />`. Add `placeholder` prop to `PersonPickerProps`:

```tsx
// PersonPickerProps interface — add:
placeholder?: string;

// SelectTrigger — use:
<SelectValue placeholder={placeholder ?? 'Select person...'} />
```

---

### GAP-DSC-012 — FamilyCompositionStep: Heir Empty State

**File**: `app/src/components/intake/FamilyCompositionStep.tsx:153-157`

**Current state**:

```tsx
{state.heirs.length === 0 && (
  <p className="text-sm text-muted-foreground italic">
    Add at least one heir to proceed.
  </p>
)}
```

Plain italic muted text. Inconsistent with the icon+description pattern from GAP-DWC-010/015 fixes.

**Fix**:

```tsx
import { Users } from 'lucide-react';

{state.heirs.length === 0 && (
  <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border border-dashed border-border rounded-lg">
    <Users className="h-8 w-8 text-muted-foreground/30" />
    <p className="text-sm font-medium text-foreground">No heirs added yet</p>
    <p className="text-xs text-muted-foreground max-w-[240px]">
      Add at least one heir to proceed with the intake.
    </p>
  </div>
)}
```

---

### GAP-DSC-013 — DecedentInfoStep: Native Radios Without accent-primary

**File**: `app/src/components/intake/DecedentInfoStep.tsx:105-118, 123-143, 150-165`

**Current state**: `<input type="radio" className="h-4 w-4">` — no `accent-primary`, so radio buttons render in the browser's default blue (not navy). This is the third distinct radio variant:
- Wizard steps: `accent-primary` (navy)
- DecedentInfoStep: no accent (browser blue)
- FamilyCompositionStep: no accent (browser blue)

**Fix**: Replace all with shadcn RadioGroup (same pattern as GAP-DSC-005 fix for FamilyCompositionStep):

```tsx
// DecedentInfoStep.tsx — add imports:
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Replace civil status radios (lines 104-119):
<RadioGroup
  value={state.civil_status ?? ''}
  onValueChange={(v) => update({ civil_status: v as CivilStatus })}
  className="space-y-1"
>
  {CIVIL_STATUSES.map((cs) => (
    <div key={cs} className="flex items-center gap-2">
      <RadioGroupItem value={cs} id={`decedent-cs-${cs}`} />
      <Label htmlFor={`decedent-cs-${cs}`} className="text-sm font-normal cursor-pointer">
        {CIVIL_STATUS_LABELS[cs]}
      </Label>
    </div>
  ))}
</RadioGroup>

// Replace has-will radios (lines 122-144):
<RadioGroup
  value={state.has_will ? 'yes' : 'no'}
  onValueChange={(v) => update({ has_will: v === 'yes' })}
  className="space-y-1"
>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="no" id="decedent-will-no" />
    <Label htmlFor="decedent-will-no" className="text-sm font-normal cursor-pointer">
      No (intestate)
    </Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="yes" id="decedent-will-yes" />
    <Label htmlFor="decedent-will-yes" className="text-sm font-normal cursor-pointer">
      Yes (testate)
    </Label>
  </div>
</RadioGroup>

// Property regime radios (lines 151-165): same RadioGroup pattern
```

---

### GAP-DSC-015 — MoneyInput: No readOnly Visual Indicator

**File**: `app/src/components/shared/MoneyInput.tsx:116`

**Current state**: `readOnly` prop passed to `<Input>` but no visual differentiation — same border, same background as editable inputs. Users may not realize a field is read-only.

**Fix**: Add conditional className to Input and the peso prefix span:

```tsx
// MoneyInput.tsx — update Input className (line 116):
<Input
  ...
  className={cn("pl-7", readOnly && "bg-muted/50 cursor-default text-muted-foreground")}
/>

// Update peso prefix opacity when readOnly:
<span className={cn(
  "absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none",
  readOnly ? "text-muted-foreground/50" : "text-muted-foreground"
)}>₱</span>
```

Add `import { cn } from '@/lib/utils';` if not already imported.

---

## Modernization Specs Summary

| ID | Component | Current | Target |
|----|-----------|---------|--------|
| MOD-DSC-001 | PersonPicker | Native `<select>` | shadcn Select + SelectContent + SelectItem with name+relationship rendering |
| MOD-DSC-002 | EnumSelect | Native `<select>` with optgroups | shadcn Select + SelectGroup + SelectLabel |
| MOD-DSC-003 | ClientDetailsStep (3×) + FamilyCompositionStep (1×) | Inline native selects with inconsistent className strings | shadcn Select, same pattern as MOD-DSC-001 |
| MOD-DSC-004 | DecedentInfoStep + FamilyCompositionStep radios | Native radios without accent-primary | shadcn RadioGroup + RadioGroupItem |
| MOD-DSC-005 | All shared form components | `fieldState.error` ignored | Destructure `fieldState`, use `fieldState.error?.message` as fallback |
| MOD-DSC-006 | FractionInput | Label not associated with inputs | `htmlFor` on label → numerator input id |
| MOD-DSC-007 | MoneyInput | Plain text zero warning | Alert with AlertTriangle icon |
| MOD-DSC-008 | DateInput | Error after hint | Swap order: error then hint |
| MOD-DSC-009 | FractionInput | No active preset state | `variant="default"` on matching preset, `aria-pressed` |
| MOD-DSC-010 | PersonPicker | Hardcoded "-- Select --" placeholder | `placeholder` prop, default `"Select person..."` |
| MOD-DSC-011 | FamilyCompositionStep | Italic text empty state | Icon + title + description + dashed border container |
| MOD-DSC-012 | MoneyInput | No readOnly visual | `bg-muted/50 cursor-default` when readOnly |
| MOD-DSC-013 | PrintHeader | print.css not imported | `@import "./styles/print.css"` in index.css |

---

## Index.css Addition Required

```css
/* app/src/index.css — add to @import block */
@import "./styles/print.css";
```

---

## Dependencies Required

No new packages needed. All patterns use:
- `@/components/ui/select` — shadcn Select (already installed: `select.tsx` exists in ui/)
- `@/components/ui/radio-group` — shadcn RadioGroup (need to verify: `radio-group.tsx` not seen in ui glob)
- `lucide-react` — already used throughout
- `@/components/ui/alert` — already exists in ui/

**Verify radio-group**: Run `ls app/src/components/ui/` — if `radio-group.tsx` is missing, install with:
```bash
npx shadcn@latest add radio-group
```
This is likely already needed per GAP-DWC-008 fix.
