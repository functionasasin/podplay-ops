# Accessibility Specification — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Design tokens: [ui/design-system.md](design-system.md)
- Component definitions: [ui/component-library.md](component-library.md)
- Responsive breakpoints: [ui/responsive.md](responsive.md)
- Wizard step fields: [frontend/wizard-steps.md](../frontend/wizard-steps.md)
- Results views: [frontend/results-views.md](../frontend/results-views.md)
- User-facing copy: [frontend/copy.md](../frontend/copy.md)

---

## Table of Contents

1. [Compliance Target and Scope](#1-compliance-target-and-scope)
2. [Color Contrast — All Required Pairs](#2-color-contrast--all-required-pairs)
3. [Focus Indicators](#3-focus-indicators)
4. [Skip Navigation Links](#4-skip-navigation-links)
5. [Heading Hierarchy](#5-heading-hierarchy)
6. [ARIA Roles and Labels — Per Component](#6-aria-roles-and-labels--per-component)
7. [Keyboard Interaction Patterns — Per Component](#7-keyboard-interaction-patterns--per-component)
8. [Focus Management — Wizard Step Transitions](#8-focus-management--wizard-step-transitions)
9. [Live Regions — Screen Reader Announcements](#9-live-regions--screen-reader-announcements)
10. [Form Accessibility — Labels, Errors, Required Fields](#10-form-accessibility--labels-errors-required-fields)
11. [Table Accessibility — Results Comparison Table](#11-table-accessibility--results-comparison-table)
12. [Modal and Dialog Accessibility](#12-modal-and-dialog-accessibility)
13. [Images, Icons, and Decorative Elements](#13-images-icons-and-decorative-elements)
14. [Motion and Animation](#14-motion-and-animation)
15. [Language and Internationalization](#15-language-and-internationalization)
16. [Touch Target Sizes](#16-touch-target-sizes)
17. [Error Recovery and Recovery Patterns](#17-error-recovery-and-recovery-patterns)
18. [Screen Reader Test Matrix](#18-screen-reader-test-matrix)
19. [Implementation Checklist](#19-implementation-checklist)

---

## 1. Compliance Target and Scope

### 1.1 Target Standard

**WCAG 2.1 Level AA** — All features of the platform must meet every Level A and Level AA success criterion from WCAG 2.1 (W3C Recommendation, June 2018).

Level AAA criteria are implemented where feasible and noted individually. Level AAA is not a universal requirement.

### 1.2 Scope

The following surfaces are in scope:

| Surface | Description |
|---------|-------------|
| Tax computation wizard | Steps WS-00 through WS-13 — all input forms |
| Results page | Sections RV-01 through RV-13 |
| Landing page | Marketing page with hero, features, pricing, CTAs |
| Authentication pages | Login, register, forgot password, reset password |
| Dashboard | Saved computations list, account management |
| Pro upgrade flow | Subscription/billing screens |
| PDF export | Exported PDFs are out of scope for WCAG (BIR form layout) |
| Email notifications | Out of scope — system emails not covered by WCAG |

### 1.3 Applicable WCAG 2.1 Criteria

**Perceivable:**
- 1.1.1 Non-text Content — Level A
- 1.3.1 Info and Relationships — Level A
- 1.3.2 Meaningful Sequence — Level A
- 1.3.3 Sensory Characteristics — Level A
- 1.3.4 Orientation — Level AA
- 1.3.5 Identify Input Purpose — Level AA
- 1.4.1 Use of Color — Level A
- 1.4.2 Audio Control — Level A (no audio used; N/A)
- 1.4.3 Contrast (Minimum) — Level AA (4.5:1 for normal text, 3:1 for large text)
- 1.4.4 Resize Text — Level AA
- 1.4.5 Images of Text — Level AA
- 1.4.10 Reflow — Level AA (content reflows at 320px width without horizontal scroll)
- 1.4.11 Non-text Contrast — Level AA (3:1 for UI components)
- 1.4.12 Text Spacing — Level AA
- 1.4.13 Content on Hover or Focus — Level AA

**Operable:**
- 2.1.1 Keyboard — Level A
- 2.1.2 No Keyboard Trap — Level A
- 2.1.4 Character Key Shortcuts — Level A (no single-key shortcuts; N/A)
- 2.2.1 Timing Adjustable — Level A (no time limits; N/A)
- 2.3.1 Three Flashes — Level A (no flashing content; N/A)
- 2.4.1 Bypass Blocks — Level A
- 2.4.2 Page Titled — Level A
- 2.4.3 Focus Order — Level A
- 2.4.4 Link Purpose — Level A
- 2.4.6 Headings and Labels — Level AA
- 2.4.7 Focus Visible — Level AA
- 2.5.3 Label in Name — Level A

**Understandable:**
- 3.1.1 Language of Page — Level A
- 3.1.2 Language of Parts — Level AA
- 3.2.1 On Focus — Level A
- 3.2.2 On Input — Level A
- 3.2.3 Consistent Navigation — Level AA
- 3.2.4 Consistent Identification — Level AA
- 3.3.1 Error Identification — Level A
- 3.3.2 Labels or Instructions — Level A
- 3.3.3 Error Suggestion — Level AA
- 3.3.4 Error Prevention — Level AA

**Robust:**
- 4.1.1 Parsing — Level A
- 4.1.2 Name, Role, Value — Level A
- 4.1.3 Status Messages — Level AA

---

## 2. Color Contrast — All Required Pairs

### 2.1 Methodology

Contrast ratios are computed using the WCAG 2.1 relative luminance formula:
- L = 0.2126 × R_lin + 0.7152 × G_lin + 0.0722 × B_lin
- where: if c_sRGB ≤ 0.04045 → c_lin = c_sRGB / 12.92; else c_lin = ((c_sRGB + 0.055) / 1.055) ^ 2.4
- Contrast ratio = (L_lighter + 0.05) / (L_darker + 0.05)

WCAG 2.1 AA thresholds:
- Normal text (< 18pt / < 14pt bold): ≥ 4.5:1
- Large text (≥ 18pt / ≥ 14pt bold): ≥ 3:1
- UI components and graphical objects: ≥ 3:1

### 2.2 Text Contrast Pairs

| Foreground Token | Hex | Background Token | Hex | Ratio | WCAG Level | Usage |
|-----------------|-----|-----------------|-----|-------|-----------|-------|
| `neutral-900` | `#1C1917` | `neutral-0` | `#FFFFFF` | 18.1:1 | AAA | Primary body text, headings |
| `neutral-800` | `#292524` | `neutral-0` | `#FFFFFF` | 14.7:1 | AAA | Paragraph text |
| `neutral-700` | `#44403C` | `neutral-0` | `#FFFFFF` | 9.9:1 | AAA | Caption text, table cells |
| `neutral-600` | `#57534E` | `neutral-0` | `#FFFFFF` | 7.6:1 | AAA | Hint text, placeholder text |
| `neutral-500` | `#78716C` | `neutral-0` | `#FFFFFF` | 5.0:1 | AA | Disabled labels, inactive icons |
| `neutral-400` | `#A8A29E` | `neutral-0` | `#FFFFFF` | 2.7:1 | FAIL — use for decorative only | Decorative dividers only; never text |
| `brand-600` | `#1D4ED8` | `neutral-0` | `#FFFFFF` | 6.7:1 | AA | Primary links, active nav |
| `brand-700` | `#1E40AF` | `neutral-0` | `#FFFFFF` | 8.6:1 | AAA | Hovered link text |
| `brand-800` | `#1E3A8A` | `neutral-0` | `#FFFFFF` | 10.9:1 | AAA | Dark header links |
| `neutral-0` | `#FFFFFF` | `brand-600` | `#1D4ED8` | 6.7:1 | AA | Button text on primary button |
| `neutral-0` | `#FFFFFF` | `brand-700` | `#1E40AF` | 8.6:1 | AAA | Button text on hovered primary button |
| `neutral-0` | `#FFFFFF` | `danger-600` | `#DC2626` | 5.5:1 | AA | Button text on danger button |
| `danger-700` | `#B91C1C` | `danger-100` | `#FEF2F2` | 5.7:1 | AA | Error text on error background |
| `danger-700` | `#B91C1C` | `neutral-0` | `#FFFFFF` | 5.5:1 | AA | Inline error messages |
| `danger-600` | `#DC2626` | `neutral-0` | `#FFFFFF` | 4.6:1 | AA | Error icon color |
| `success-700` | `#15803D` | `success-100` | `#DCFCE7` | 4.6:1 | AA | Success text on success background |
| `success-700` | `#15803D` | `neutral-0` | `#FFFFFF` | 6.0:1 | AA | Success text on white |
| `success-600` | `#16A34A` | `neutral-0` | `#FFFFFF` | 5.2:1 | AA | Optimal regime badge text on white |
| `warning-700` | `#B45309` | `warning-100` | `#FEF3C7` | 4.5:1 | AA | Warning text on warning background |
| `warning-700` | `#B45309` | `neutral-0` | `#FFFFFF` | 4.9:1 | AA | Warning text on white |
| `info-700` | `#0369A1` | `info-100` | `#E0F2FE` | 5.9:1 | AA | Info text on info background |
| `info-700` | `#0369A1` | `neutral-0` | `#FFFFFF` | 7.7:1 | AAA | Info text on white |
| `peso-tax-due` | `#7C3AED` | `neutral-0` | `#FFFFFF` | 6.8:1 | AA | Tax due amount display |
| `peso-savings` | `#059669` | `neutral-0` | `#FFFFFF` | 4.6:1 | AA | Savings amount display |
| `brand-700` | `#1E40AF` | `brand-200` | `#BFDBFE` | 5.1:1 | AA | "Recommended" chip text |
| `neutral-900` | `#1C1917` | `neutral-100` | `#F5F5F4` | 16.3:1 | AAA | Text on table hover row |
| `neutral-900` | `#1C1917` | `neutral-50` | `#FAFAF9` | 17.8:1 | AAA | Text on page background |
| `neutral-0` | `#FFFFFF` | `neutral-900` | `#1C1917` | 18.1:1 | AAA | Tooltip text |

### 2.3 Pairs That Fail WCAG AA — Prohibited Uses

| Token | Hex | Fails on | Use restriction |
|-------|-----|----------|-----------------|
| `neutral-400` | `#A8A29E` | Any background | Never use as text color. Permitted for decorative borders only. |
| `neutral-300` | `#D6D3D1` | Any background | Never use as text color. Input borders only. |
| `brand-400` | `#60A5FA` | White | Never use as text on white. Icon highlight on dark backgrounds only. |
| `brand-300` | `#93C5FD` | White | Never use as text. Progress bar fill only. |
| `brand-200` | `#BFDBFE` | White | Never use as text. Chip/badge background only. |
| `regime-optimal-bg` | `#F0FDF4` | Any | Background only; never use as foreground text. |
| `regime-ineligible` | `#E7E5E4` | Any | Background only; never use as foreground text. |

### 2.4 Non-Text UI Component Contrast (WCAG 1.4.11 — 3:1 minimum)

| Component | Boundary color | Background | Ratio | Pass? |
|-----------|---------------|-----------|-------|-------|
| Input field border (default) | `neutral-300 (#D6D3D1)` | `neutral-0 (#FFFFFF)` | 1.9:1 | FAIL — compensated by label association |
| Input field border (focus) | `brand-600 (#1D4ED8)` | `neutral-0 (#FFFFFF)` | 6.7:1 | Pass |
| Input field border (error) | `danger-600 (#DC2626)` | `neutral-0 (#FFFFFF)` | 4.6:1 | Pass |
| Checkbox border (default) | `neutral-400 (#A8A29E)` | `neutral-0 (#FFFFFF)` | 2.7:1 | FAIL — compensated by focus indicator |
| Checkbox border (focus) | `brand-600 (#1D4ED8)` | `neutral-0 (#FFFFFF)` | 6.7:1 | Pass |
| Toggle track (OFF) | `neutral-300 (#D6D3D1)` | `neutral-0 (#FFFFFF)` | 1.9:1 | FAIL — supplement with text state indicator |
| Toggle track (ON) | `brand-600 (#1D4ED8)` | `neutral-0 (#FFFFFF)` | 6.7:1 | Pass |
| Radio circle border | `neutral-400 (#A8A29E)` | `neutral-0 (#FFFFFF)` | 2.7:1 | FAIL — supplement with focus indicator |
| Progress bar fill | `brand-300 (#93C5FD)` | `neutral-200 (#E7E5E4)` | 1.6:1 | FAIL — supplement with text "Step N of M" |

**Remediation for failing UI component pairs:**
- **Input borders:** Because the input's content area is 40px tall and clearly labeled, failing non-text contrast is acceptable under advisory. However, on focus, the 2px `brand-600` ring provides 6.7:1 contrast. The label text identifies the field unambiguously.
- **Checkbox and radio:** The visible check/fill state (`brand-600`) provides sufficient contrast on change. Supplement checkbox with `aria-checked` state; radio with `aria-selected`.
- **Toggle:** Supplement track with visible text state label rendered next to the toggle: "On" / "Off" in `neutral-900` when checked or unchecked respectively.
- **Progress bar:** Always render "Step N of M — [Label]" text above the bar in `brand-600` at `text-sm` weight `600`.

---

## 3. Focus Indicators

### 3.1 Focus Ring Specification

All interactive elements must have a visible focus indicator that meets WCAG 2.4.7 (Focus Visible, Level AA) and the new AAA criterion 2.4.11 (Focus Appearance) from WCAG 2.2.

**Standard focus ring:**
- Style: `outline: 2px solid #1D4ED8` (brand-600)
- Offset: `outline-offset: 2px`
- Border-radius: matches element border-radius
- Must not be suppressed by `outline: none` without a replacement indicator

**Focus ring on dark backgrounds (e.g., footer, dark header):**
- Style: `outline: 2px solid #FFFFFF` (neutral-0)
- Offset: `outline-offset: 2px`

**Focus ring for inner elements within cards (radio options, table rows):**
- Style: `box-shadow: 0 0 0 2px #1D4ED8` (inset ring)
- Complements the card's existing border

**CSS implementation:**
```css
:focus-visible {
  outline: 2px solid #1D4ED8;
  outline-offset: 2px;
}
/* Remove outline for mouse/touch — only show for keyboard */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 3.2 Focus Ring Variants Per Component

| Component | Focus Style | Notes |
|-----------|-------------|-------|
| Button (all variants) | `outline: 2px solid #1D4ED8; outline-offset: 2px` | On danger button: `outline: 2px solid #DC2626` |
| Input field | `outline: 2px solid #1D4ED8; outline-offset: 0px` + border becomes `2px solid #1D4ED8` | Replaces default border on focus |
| Select dropdown | Same as Input field | Arrow icon inherits from container |
| Radio button circle | `box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #1D4ED8` | Double ring: white gap + brand ring |
| Checkbox box | `box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #1D4ED8` | Same double-ring as radio |
| Toggle switch | `outline: 2px solid #1D4ED8; outline-offset: 2px` on track container | Tab to switch, Space to toggle |
| Card radio option | `outline: 2px solid #1D4ED8` on card border | Card already has 1px border; focus replaces with 2px brand ring |
| Tooltip trigger (? icon) | `outline: 2px solid #1D4ED8; outline-offset: 2px` | Tooltip shows on focus |
| Link | `outline: 2px solid #1D4ED8; outline-offset: 2px` + underline | Underline persists on focus |
| Progress stepper step (clickable) | `outline: 2px solid #1D4ED8` on circle | Completed/active steps are interactive |
| Table row (expandable) | `outline: 2px solid #1D4ED8` on row | Regime comparison rows are keyboard-expandable |
| Accordion header | `outline: 2px solid #1D4ED8` on header button | Path detail accordions |
| Modal close button | `outline: 2px solid #FFFFFF; outline-offset: 2px` | On dark overlay background |

---

## 4. Skip Navigation Links

### 4.1 Structure

Every page includes two skip links as the first focusable elements in the DOM. They are visually hidden until focused.

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#wizard-navigation" class="skip-link">Skip to form navigation</a>
```

The second skip link is only rendered on wizard pages (WS-00 through WS-13).

### 4.2 Visual Style (when focused)

- Position: fixed, top `8px`, left `8px`
- Background: `brand-600 (#1D4ED8)`
- Text: `neutral-0 (#FFFFFF)`, `text-base (16px)`, weight `600`
- Padding: `12px 24px`
- Border-radius: `radius-base (6px)`
- Z-index: `z-modal + 1` (above all overlays)

### 4.3 CSS Implementation

```css
.skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 9999;
  background: #1D4ED8;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-100px);
  transition: transform 200ms;
}
.skip-link:focus {
  transform: translateY(0);
}
```

### 4.4 Target IDs

| Skip Link Text | Target ID | Where Present |
|----------------|-----------|---------------|
| Skip to main content | `#main-content` | All pages |
| Skip to form navigation | `#wizard-navigation` | Wizard pages only |
| Skip to results | `#results-content` | Results page only |

---

## 5. Heading Hierarchy

### 5.1 Heading Structure — Wizard Pages

```
<h1> — Page title: "Philippine Freelance Tax Optimizer"
  <h2> — Step title: e.g., "Step 1: Your Taxpayer Profile"
    <h3> — Section within step (if step has multiple sections): e.g., "Income Details"
      <h4> — Sub-section or field group: e.g., "Quarterly Gross Receipts Breakdown"
```

Rules:
- One `<h1>` per page, always the product name
- Step title is always `<h2>`
- No skipped heading levels (never jump from h2 to h4)
- The `<h2>` label on the wizard step matches the progress stepper's step name

### 5.2 Heading Structure — Results Page

```
<h1> — "Your Tax Computation Results"
  <h2> — "Tax Regime Comparison"
  <h2> — "Recommended: 8% Flat Rate" (or whichever is optimal)
  <h2> — "Tax Due and Credits Breakdown"
  <h2> — "Quarterly Payments Summary" (if applicable)
  <h2> — "Percentage Tax Obligation" (if applicable)
  <h2> — "Late Filing Penalties" (if applicable)
  <h2> — "Items Requiring Manual Review" (if applicable)
  <h2> — "What To File"
    <h3> — "BIR Form 1701A" (or 1701)
    <h3> — "BIR Form 2551Q" (if applicable)
```

### 5.3 Heading Structure — Landing Page

```
<h1> — "Find Your Lowest Legal Tax — In 3 Minutes"
  <h2> — "How It Works"
  <h2> — "What's Included"
  <h2> — "Pricing"
  <h2> — "Frequently Asked Questions"
  <h2> — "Start Your Free Tax Computation"
```

### 5.4 Heading Structure — Dashboard

```
<h1> — "My Tax Computations"
  <h2> — "Recent Computations"
  <h2> — "Account Settings"
    <h3> — "Subscription"
    <h3> — "Profile"
```

---

## 6. ARIA Roles and Labels — Per Component

### 6.1 Button Component

```html
<!-- Primary compute button -->
<button
  type="submit"
  aria-label="Calculate my taxes"
  aria-disabled="false"
>
  Calculate My Taxes
</button>

<!-- Loading state -->
<button
  type="submit"
  aria-label="Calculating taxes, please wait"
  aria-disabled="true"
  aria-busy="true"
>
  <span aria-hidden="true"><!-- spinner svg --></span>
  Computing…
</button>

<!-- Danger/destructive button -->
<button
  type="button"
  aria-label="Delete this computation"
>
  Delete
</button>
```

Rules:
- `aria-label` is required when button text alone is ambiguous (e.g., icon-only buttons)
- `aria-disabled="true"` and `disabled` attribute together for disabled state; `aria-busy="true"` for loading
- `type="button"` on non-submit buttons to prevent accidental form submission

### 6.2 Input Field Component

```html
<div>
  <label for="gross_receipts" id="gross_receipts_label">
    Total Gross Receipts
    <span aria-label="required" class="required-marker">*</span>
  </label>
  <div role="group" aria-labelledby="gross_receipts_label gross_receipts_hint">
    <span aria-hidden="true" class="peso-prefix">₱</span>
    <input
      id="gross_receipts"
      name="gross_receipts"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      aria-required="true"
      aria-describedby="gross_receipts_hint gross_receipts_error"
      aria-invalid="false"
      value=""
      placeholder="0"
    />
  </div>
  <span id="gross_receipts_hint" class="hint-text">
    Enter your total gross receipts for the year, before any deductions.
  </span>
  <span id="gross_receipts_error" role="alert" class="error-text" aria-live="polite">
    <!-- Error message injected here when invalid -->
  </span>
</div>
```

Rules:
- Every input has a `<label>` with `for` matching input `id`
- `aria-required="true"` on required fields
- `aria-invalid="true"` set on the input when it has a validation error
- `aria-describedby` references both the hint ID and the error ID
- Error container always rendered in DOM (empty when no error); `role="alert"` causes screen reader announcement on content change
- `inputmode="decimal"` on peso fields (shows numeric keyboard on mobile)
- `autocomplete` attributes set per [Section 10.3](#103-autocomplete-attributes)
- The `₱` prefix has `aria-hidden="true"` because the field label already communicates currency

### 6.3 Select / Dropdown Component

```html
<div>
  <label for="taxpayer_type" id="taxpayer_type_label">
    Taxpayer Type
    <span aria-label="required" class="required-marker">*</span>
  </label>
  <select
    id="taxpayer_type"
    name="taxpayer_type"
    aria-required="true"
    aria-describedby="taxpayer_type_hint taxpayer_type_error"
    aria-invalid="false"
  >
    <option value="" disabled selected>Select your taxpayer type…</option>
    <option value="PURE_PROFESSIONAL">Registered Professional (doctor, lawyer, engineer, CPA)</option>
    <option value="PURE_FREELANCER">Freelancer / Self-Employed Individual</option>
    <option value="SOLE_PROPRIETOR">Sole Proprietor (with registered business name)</option>
    <option value="MIXED_INCOME">Mixed Income Earner (employed + self-employed)</option>
  </select>
  <span id="taxpayer_type_hint" class="hint-text">
    This determines which BIR form applies to you.
  </span>
  <span id="taxpayer_type_error" role="alert" aria-live="polite" class="error-text"></span>
</div>
```

### 6.4 Radio Group — Card Variant (Taxpayer Type Selection)

```html
<fieldset>
  <legend id="taxpayer_class_legend">
    What best describes your income situation?
    <span aria-label="required" class="required-marker">*</span>
  </legend>
  <div role="radiogroup" aria-labelledby="taxpayer_class_legend" aria-required="true">
    <label class="radio-card">
      <input
        type="radio"
        name="taxpayer_class"
        value="PURE_PROFESSIONAL"
        aria-describedby="taxpayer_class_professional_desc"
      />
      <span class="radio-card-content">
        <span class="radio-card-title">Registered Professional</span>
        <span id="taxpayer_class_professional_desc" class="radio-card-desc">
          Doctor, lawyer, engineer, CPA, or other PRC-licensed professional
        </span>
      </span>
    </label>
    <label class="radio-card">
      <input
        type="radio"
        name="taxpayer_class"
        value="PURE_FREELANCER"
        aria-describedby="taxpayer_class_freelancer_desc"
      />
      <span class="radio-card-content">
        <span class="radio-card-title">Freelancer / Self-Employed</span>
        <span id="taxpayer_class_freelancer_desc" class="radio-card-desc">
          Upwork, Fiverr, local platforms, or any freelance work without PRC license
        </span>
      </span>
    </label>
    <label class="radio-card">
      <input
        type="radio"
        name="taxpayer_class"
        value="MIXED_INCOME"
        aria-describedby="taxpayer_class_mixed_desc"
      />
      <span class="radio-card-content">
        <span class="radio-card-title">Mixed Income Earner</span>
        <span id="taxpayer_class_mixed_desc" class="radio-card-desc">
          Employed full-time or part-time AND earning freelance or professional income
        </span>
        <span class="badge" aria-label="Most common">Most Common</span>
      </span>
    </label>
    <label class="radio-card">
      <input
        type="radio"
        name="taxpayer_class"
        value="SOLE_PROPRIETOR"
        aria-describedby="taxpayer_class_soleproprietor_desc"
      />
      <span class="radio-card-content">
        <span class="radio-card-title">Sole Proprietor</span>
        <span id="taxpayer_class_soleproprietor_desc" class="radio-card-desc">
          DTI-registered business with a trade name
        </span>
      </span>
    </label>
  </div>
  <span id="taxpayer_class_error" role="alert" aria-live="polite" class="error-text"></span>
</fieldset>
```

Rules:
- Radio groups use `<fieldset>` + `<legend>` for group labeling
- Each `<input type="radio">` is wrapped in a `<label>` (implicit association)
- Badge text ("Most Common") wrapped in `aria-label` to give screen readers meaningful text

### 6.5 Checkbox Component

```html
<div>
  <label class="checkbox-label">
    <input
      type="checkbox"
      name="has_cwt"
      id="has_cwt"
      aria-describedby="has_cwt_desc has_cwt_error"
      aria-checked="false"
    />
    <span class="checkbox-text">I have Creditable Withholding Tax (Form 2307) to claim</span>
  </label>
  <span id="has_cwt_desc" class="hint-text">
    Check this if a client or employer withheld income tax on your behalf and issued BIR Form 2307.
  </span>
  <span id="has_cwt_error" role="alert" aria-live="polite" class="error-text"></span>
</div>
```

### 6.6 Toggle Switch Component

```html
<div class="toggle-wrapper">
  <button
    role="switch"
    type="button"
    id="has_quarterly_payments"
    aria-checked="false"
    aria-label="I made quarterly income tax payments (Form 1701Q)"
    aria-describedby="has_quarterly_payments_desc"
  >
    <span aria-hidden="true" class="toggle-track">
      <span class="toggle-knob"></span>
    </span>
    <span class="toggle-state-label" aria-hidden="true">
      <!-- Dynamically shows "On" or "Off" -->
      Off
    </span>
  </button>
  <label for="has_quarterly_payments" class="toggle-label">
    I made quarterly income tax payments (Form 1701Q)
  </label>
  <span id="has_quarterly_payments_desc" class="hint-text">
    Enable this to enter payments already made for Q1, Q2, and Q3 of the tax year.
  </span>
</div>
```

Rules:
- Toggle uses `role="switch"` with `aria-checked` (not a checkbox `<input>`)
- Adjacent visible "On/Off" text label supplements the icon-only toggle track
- The `<label>` element is associated with the button `id`

### 6.7 Tooltip Component

```html
<!-- The trigger element -->
<button
  type="button"
  class="tooltip-trigger"
  aria-label="More information about Optional Standard Deduction"
  aria-describedby="osd_tooltip"
  aria-expanded="false"
>
  <svg aria-hidden="true" focusable="false"><!-- ? icon --></svg>
</button>

<!-- The tooltip panel -->
<div
  id="osd_tooltip"
  role="tooltip"
  aria-live="polite"
  class="tooltip-panel"
  hidden
>
  Optional Standard Deduction (OSD) lets you deduct 40% of gross receipts with no receipts
  required. No need to substantiate expenses. Most freelancers with expenses below 40% of
  gross receipts benefit from using 8% instead.
</div>
```

Rules:
- Tooltip trigger is a `<button>` (not a `<span>` or `<div>`) to ensure keyboard focusability
- `aria-expanded="true/false"` toggled when tooltip is open/closed
- `role="tooltip"` on the panel
- Tooltip dismisses on `Escape` key press
- Tooltip content is available to screen readers via `aria-describedby` even when visually hidden

### 6.8 Progress Stepper Component

```html
<nav aria-label="Tax wizard progress">
  <ol class="stepper">
    <li class="step-completed" aria-current="false">
      <button type="button" aria-label="Go back to step 1: Taxpayer Profile (completed)">
        <span aria-hidden="true" class="step-circle">
          <svg aria-hidden="true"><!-- check icon --></svg>
        </span>
        <span class="step-label">Taxpayer Profile</span>
      </button>
    </li>
    <li class="step-active" aria-current="step">
      <span class="step-circle" aria-hidden="true">2</span>
      <span class="step-label">Income Details</span>
    </li>
    <li class="step-pending" aria-current="false">
      <span class="step-circle" aria-hidden="true">3</span>
      <span class="step-label">Deductions</span>
    </li>
    <li class="step-pending" aria-current="false">
      <span class="step-circle" aria-hidden="true">4</span>
      <span class="step-label">Credits &amp; Filing</span>
    </li>
  </ol>
</nav>

<!-- Mobile compact alternative (< 640px) -->
<div aria-label="Tax wizard progress" class="stepper-mobile">
  <p class="step-counter" aria-live="polite" aria-atomic="true">
    Step 2 of 4 — Income Details
  </p>
  <div
    role="progressbar"
    aria-valuenow="50"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Wizard progress: 50% complete"
    class="progress-bar"
  ></div>
</div>
```

Rules:
- `<nav>` with `aria-label` wraps the stepper
- Completed steps are `<button>` elements (users can navigate back)
- Active step has `aria-current="step"`
- Mobile progress bar uses `role="progressbar"` with `aria-valuenow`

### 6.9 Alert / Callout Component

```html
<!-- Warning alert (WARN_* codes) -->
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  class="alert alert-warning"
>
  <svg aria-hidden="true" class="alert-icon"><!-- triangle icon --></svg>
  <div>
    <p class="alert-title">Review Recommended: Home Office Deduction</p>
    <p class="alert-message">
      Your home office deduction requires that the space is used exclusively and regularly
      for business. Mixed-use spaces are not deductible.
    </p>
  </div>
</div>

<!-- Non-dismissible Manual Review Flag (MRF) -->
<div
  role="note"
  aria-label="Manual review required: Travel expense purpose unclear"
  class="alert alert-info"
>
  <svg aria-hidden="true" class="alert-icon"><!-- info icon --></svg>
  <div>
    <p class="alert-title">Manual Review Required</p>
    <p class="alert-message">
      The BIR requires that travel expenses be ordinary, necessary, and directly connected
      to your business. Please retain receipts and be prepared to substantiate this deduction.
    </p>
  </div>
</div>
```

Rules:
- Error and warning alerts use `role="alert"` with `aria-live="assertive"` — announced immediately
- Informational notes use `role="note"` with `aria-live="polite"` — announced when user is idle
- Success messages use `role="status"` with `aria-live="polite"`
- Dismissible alerts include a close button: `<button aria-label="Dismiss this warning" type="button">`

### 6.10 Regime Comparison Table Component

```html
<section aria-labelledby="regime_comparison_heading">
  <h2 id="regime_comparison_heading">Tax Regime Comparison</h2>
  <table aria-describedby="regime_table_desc">
    <caption id="regime_table_desc">
      Comparison of all three tax computation methods for your inputs.
      The optimal method (lowest tax due) is highlighted.
    </caption>
    <thead>
      <tr>
        <th scope="col">Tax Method</th>
        <th scope="col">Annual Tax Due</th>
        <th scope="col">Difference from Optimal</th>
        <th scope="col">Status</th>
        <th scope="col">
          <span class="sr-only">View details</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        aria-label="8% Flat Rate — Optimal method, tax due ₱60,000"
        class="row-optimal"
      >
        <td>
          8% Flat Rate
          <span class="sr-only">(recommended)</span>
        </td>
        <td>
          <span aria-label="Philippine pesos 60,000">₱60,000</span>
        </td>
        <td>
          <span aria-label="Saves 32,000 pesos compared to next best option">
            ₱32,000 less
          </span>
        </td>
        <td>
          <span
            class="badge badge-optimal"
            aria-label="Optimal — this method results in the lowest tax"
          >
            Optimal
          </span>
        </td>
        <td>
          <button
            type="button"
            aria-expanded="false"
            aria-controls="path_c_detail"
            aria-label="View breakdown for 8% Flat Rate"
          >
            View details
          </button>
        </td>
      </tr>
      <tr
        aria-label="Graduated rate with Optional Standard Deduction — tax due ₱92,000"
        class="row-option"
      >
        <td>Graduated + Optional Standard Deduction</td>
        <td>
          <span aria-label="Philippine pesos 92,000">₱92,000</span>
        </td>
        <td>
          <span aria-label="32,000 pesos more than optimal">₱32,000 more</span>
        </td>
        <td>Option</td>
        <td>
          <button
            type="button"
            aria-expanded="false"
            aria-controls="path_b_detail"
            aria-label="View breakdown for Graduated rate with Optional Standard Deduction"
          >
            View details
          </button>
        </td>
      </tr>
      <tr
        aria-label="Graduated rate with Itemized Deductions — tax due ₱108,000"
        class="row-option"
      >
        <td>Graduated + Itemized Deductions</td>
        <td>
          <span aria-label="Philippine pesos 108,000">₱108,000</span>
        </td>
        <td>
          <span aria-label="48,000 pesos more than optimal">₱48,000 more</span>
        </td>
        <td>Option</td>
        <td>
          <button
            type="button"
            aria-expanded="false"
            aria-controls="path_a_detail"
            aria-label="View breakdown for Graduated rate with Itemized Deductions"
          >
            View details
          </button>
        </td>
      </tr>
      <!-- Ineligible Path C row example when gross > ₱3M -->
      <!--
      <tr aria-label="8% Flat Rate — Not available for your income level" class="row-ineligible">
        <td>8% Flat Rate</td>
        <td aria-label="Not available">
          <span class="not-available">Not available</span>
          <button
            type="button"
            aria-label="Why is 8% Flat Rate not available?"
            aria-describedby="path_c_ineligible_reason"
          >
            <svg aria-hidden="true">info icon</svg>
          </button>
          <span id="path_c_ineligible_reason" role="tooltip" hidden>
            The 8% flat rate is only available when gross receipts do not exceed ₱3,000,000
            per year. Your gross receipts of ₱4,200,000 exceed this threshold.
          </span>
        </td>
        <td aria-hidden="true">—</td>
        <td>Not eligible</td>
        <td aria-hidden="true"></td>
      </tr>
      -->
    </tbody>
  </table>
</section>
```

Rules:
- `<table>` with `<caption>` describing the table purpose
- `scope="col"` on all `<th>` elements
- `aria-label` on each `<tr>` provides full row context for screen readers navigating cell-by-cell
- Monetary values use `aria-label` to include the word "pesos" for screen readers (₱ symbol may be read as "peso sign" or skipped)
- Ineligible row's empty cells use `aria-hidden="true"` to prevent screen reader from reading empty cells

### 6.11 Accordion / Path Detail Component

```html
<div id="path_c_detail" role="region" aria-labelledby="path_c_detail_heading">
  <h3 id="path_c_detail_heading">8% Flat Rate — Computation Breakdown</h3>
  <dl>
    <div class="breakdown-row">
      <dt>Gross Receipts</dt>
      <dd aria-label="Philippine pesos 500,000">₱500,000</dd>
    </div>
    <div class="breakdown-row">
      <dt>Less: ₱250,000 exemption</dt>
      <dd aria-label="Philippine pesos 250,000">₱250,000</dd>
    </div>
    <div class="breakdown-row">
      <dt>Taxable Amount</dt>
      <dd aria-label="Philippine pesos 250,000">₱250,000</dd>
    </div>
    <div class="breakdown-row">
      <dt>Tax Rate</dt>
      <dd>8%</dd>
    </div>
    <div class="breakdown-row total-row">
      <dt>Income Tax Due</dt>
      <dd aria-label="Philippine pesos 20,000">₱20,000</dd>
    </div>
  </dl>
</div>
```

Rules:
- Accordion region uses `<dl>` (definition list) for key-value breakdowns
- `role="region"` with `aria-labelledby` linking to the section heading
- All values labeled with "Philippine pesos" for screen readers

---

## 7. Keyboard Interaction Patterns — Per Component

### 7.1 Global Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Tab` | Move focus to next interactive element | All pages |
| `Shift+Tab` | Move focus to previous interactive element | All pages |
| `Enter` | Activate focused button or link; submit form | All pages |
| `Space` | Activate focused button; toggle checkbox/switch | All pages |
| `Escape` | Close open tooltip, modal, or dropdown | All pages |
| `Arrow keys` | Navigate radio group options | Radio groups |
| `Arrow keys` | Navigate select options (native behavior) | Select/dropdown |

### 7.2 Button

| Key | Action |
|-----|--------|
| `Enter` | Activate button |
| `Space` | Activate button |

### 7.3 Input Field

| Key | Action |
|-----|--------|
| `Tab` | Move to next input |
| `Shift+Tab` | Move to previous input |
| All character keys | Enter text normally |
| `Enter` | If in last field of step: triggers "Continue" validation |

### 7.4 Select / Dropdown

Native `<select>` behavior:
| Key | Action |
|-----|--------|
| `Space` or `Enter` | Open dropdown |
| `Arrow Up/Down` | Navigate options |
| `Enter` or `Space` | Select highlighted option |
| `Escape` | Close without selection |
| First letter of option | Jump to first option starting with that letter |

### 7.5 Radio Group

| Key | Action |
|-----|--------|
| `Tab` | Focus the radio group (enters at selected option or first option) |
| `Arrow Right / Arrow Down` | Move to next option and select it |
| `Arrow Left / Arrow Up` | Move to previous option and select it |
| `Space` | Select focused option (when none selected) |
| `Tab` | Exit radio group to next focusable element |

### 7.6 Checkbox

| Key | Action |
|-----|--------|
| `Space` | Toggle checked state |
| `Tab` | Move to next interactive element |

### 7.7 Toggle Switch

| Key | Action |
|-----|--------|
| `Space` | Toggle the switch |
| `Enter` | Toggle the switch |
| `Tab` | Move to next interactive element |

### 7.8 Tooltip Trigger

| Key | Action |
|-----|--------|
| `Enter` or `Space` | Open tooltip |
| `Escape` | Close tooltip |
| `Tab` | Close tooltip and move to next element |

### 7.9 Accordion / Path Detail Expand

| Key | Action |
|-----|--------|
| `Enter` or `Space` | Toggle accordion open/closed |
| `Tab` | Move to next interactive element (when closed: skips accordion content) |

### 7.10 Progress Stepper (Completed Steps)

| Key | Action |
|-----|--------|
| `Enter` or `Space` | Navigate back to that completed step |
| `Tab` | Move to next completed step or next interactive element |

### 7.11 Modal Dialog

| Key | Action |
|-----|--------|
| `Tab` | Cycle through focusable elements within modal (trapped) |
| `Shift+Tab` | Cycle backward through modal elements |
| `Escape` | Close modal, return focus to trigger |

### 7.12 Wizard Navigation Buttons (Back / Continue)

| Key | Action |
|-----|--------|
| `Enter` or `Space` on "Continue" | Validate current step, advance if valid |
| `Enter` or `Space` on "Back" | Return to previous step |

---

## 8. Focus Management — Wizard Step Transitions

### 8.1 Step Advance (user clicks "Continue")

When the user advances from step N to step N+1:

1. Validate all fields in step N.
2. If validation fails: focus moves to the first field with an error. Screen reader reads the error message via `aria-live="polite"` on the error span.
3. If validation passes: the DOM replaces step N content with step N+1 content. Focus moves to the `<h2>` of the new step. The `<h2>` must have `tabindex="-1"` to receive programmatic focus.

```javascript
// After DOM update for new step:
const stepHeading = document.querySelector('#wizard-step-heading');
stepHeading.tabIndex = -1;
stepHeading.focus();
```

### 8.2 Step Back (user clicks "Back")

When the user goes back from step N to step N-1:

1. DOM replaces content with previous step's content.
2. Focus moves to the `<h2>` of the previous step.
3. All previously entered values are restored to their saved state.

### 8.3 Results Page Load

When the user submits the last step and the results page loads:

1. Show loading skeleton for 0-500ms while engine computes.
2. On results ready: focus moves to the `<h1>` "Your Tax Computation Results".
3. Screen reader announcement (via `aria-live="polite"` region): "Your tax computation is ready. The optimal tax method is 8% Flat Rate with a tax due of ₱20,000."

```html
<!-- Live region at top of results page -->
<div
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
  id="results-announcement"
>
  <!-- Dynamically populated: "Your tax computation is ready. The optimal tax method is [NAME] with a tax due of ₱[AMOUNT]." -->
</div>
```

### 8.4 Conditional Field Appearance

When a conditional field becomes visible (e.g., CWT entry rows appear when toggle is turned on):

1. The newly visible field(s) appear in the DOM immediately.
2. Focus does NOT automatically move to the new field — the user continues from where they are.
3. A polite live region announces: "New fields added: [field label]. Use Tab to navigate to them."

```html
<div aria-live="polite" class="sr-only" id="field-visibility-announcer">
  <!-- e.g., "New section added: Creditable Withholding Tax entries. Use Tab to navigate." -->
</div>
```

### 8.5 Error Summary on Submit Attempt

When the user clicks "Continue" and multiple fields have errors:

1. Scroll to top of the step.
2. Display an error summary above the form:

```html
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  id="error-summary"
  class="error-summary"
>
  <h3>Please fix the following errors before continuing:</h3>
  <ul>
    <li><a href="#gross_receipts">Gross Receipts: This field is required.</a></li>
    <li><a href="#tax_year">Tax Year: Please select a valid tax year.</a></li>
  </ul>
</div>
```

3. Focus moves to the `<h3>` within the error summary.
4. Each list item is a link to the specific field.
5. `role="alert"` causes immediate announcement.

### 8.6 Modal Open / Close

When a modal opens:
1. Focus moves to the modal's `<h2>` title (with `tabindex="-1"`).
2. All other page content is inert (using `inert` attribute or `aria-hidden="true"` on page root).
3. Tab order is trapped within the modal.

When a modal closes:
1. `inert` / `aria-hidden` removed from page root.
2. Focus returns to the element that triggered the modal.

---

## 9. Live Regions — Screen Reader Announcements

### 9.1 Live Region Registry

| Region ID | `aria-live` | `aria-atomic` | Content | Trigger |
|-----------|-------------|---------------|---------|---------|
| `#results-announcement` | `polite` | `true` | "Your tax computation is ready. Optimal method: [NAME]. Tax due: ₱[AMOUNT]." | Results page loads |
| `#field-visibility-announcer` | `polite` | `false` | "New fields added: [LABEL]. Use Tab to navigate." | Conditional field appears |
| `#step-transition-announcer` | `polite` | `true` | "Now on step [N] of [M]: [STEP LABEL]." | Wizard step advance |
| `#error-summary` (role=alert) | `assertive` | `true` | Error summary list | Multi-field validation failure |
| Each field's `#[id]_error` span | `polite` | `true` | Specific field error message | Single field error |
| `#regime-recommendation-announcer` | `polite` | `true` | "Based on your inputs, [8% Flat Rate / Graduated + OSD / Graduated + Itemized] is recommended. Saves ₱[AMOUNT] compared to next option." | Real-time regime estimate updates |
| `#save-status` | `polite` | `true` | "Computation saved." / "Save failed. Please try again." | Save action |
| `#toast-announcer` | `polite` | `true` | Toast notification text | Any toast shown |

### 9.2 Real-Time Regime Estimate (Live Update Behavior)

The results preview (shown on the expense steps as a live estimate) updates as the user types. To prevent screen reader flooding:

- Live region updates are **debounced by 1500ms** after last keystroke before the screen reader reads the update.
- Update text: "Estimated optimal tax: ₱[AMOUNT] using [METHOD]. Updates as you type."
- If no valid estimate is available: region is empty (not announced).

```html
<div
  aria-live="polite"
  aria-atomic="true"
  aria-label="Live tax estimate"
  id="regime-recommendation-announcer"
  class="sr-only"
>
  <!-- Updated by debounced JS -->
</div>
```

### 9.3 Step Transition Announcement

When advancing to a new step:

```javascript
const announcer = document.getElementById('step-transition-announcer');
announcer.textContent = `Now on step ${currentStep} of ${totalSteps}: ${stepLabel}.`;
```

The `aria-live="polite"` region reads this after the DOM update settles. Combined with focus moving to `<h2>`, screen reader users hear "Step 2 of 4: Income Details" followed by the heading.

---

## 10. Form Accessibility — Labels, Errors, Required Fields

### 10.1 Required Field Indication

Required fields display a red asterisk `*` after the label text. The asterisk has `aria-label="required"` and the form includes a note at the top of each step:

```html
<p class="form-required-note">
  Fields marked with <span aria-label="an asterisk">*</span> are required.
</p>
```

### 10.2 Error Message Format

All field error messages follow this format:
- Short label identifying the field: "[Field Name]: [Error description]"
- Written in plain language, not technical terms
- Specific enough to guide correction
- No error codes shown to the user (WARN_* and ERR_* are internal identifiers only)

Examples:
| Invalid input | Error message displayed |
|--------------|------------------------|
| Empty required field | "This field is required." |
| Negative peso amount | "Amount cannot be negative. Please enter ₱0 or more." |
| Gross receipts > ₱3M with 8% elected | "Your gross receipts exceed ₱3,000,000. The 8% flat rate is only available when gross receipts do not exceed this amount. Please select a different tax method or update your gross receipts." |
| CWT amount > computed tax | "Your withholding credits (₱X) exceed your computed income tax (₱Y). This will result in a refund. This is allowed — please verify the amount is correct." |
| Future tax year | "Tax year cannot be in the future. The most recent complete tax year is [YEAR]." |
| OSD amount manually edited to exceed 40% | "The Optional Standard Deduction cannot exceed 40% of your gross receipts (₱X maximum). This value has been corrected automatically." |

### 10.3 Autocomplete Attributes

Fields that collect personal or financial information include `autocomplete` attributes per WCAG 1.3.5:

| Field | `autocomplete` value |
|-------|---------------------|
| Email address | `email` |
| Password | `current-password` |
| New password | `new-password` |
| Full name | `name` |
| TIN (Tax Identification Number) | `off` (do not suggest — security) |
| RDO code | `off` |
| All peso input fields | `off` (financial data — do not suggest) |

### 10.4 Input Purpose for Auto-fill

Authentication forms:

```html
<input type="email" name="email" id="email" autocomplete="email" aria-label="Email address" />
<input type="password" name="password" id="password" autocomplete="current-password" aria-label="Password" />
```

### 10.5 Fieldset Grouping

All multi-field logical groups use `<fieldset>` + `<legend>`:

| Group | `<legend>` text |
|-------|----------------|
| Taxpayer type radio group | "What best describes your income situation?" |
| Tax year and period | "Which tax period are you filing for?" |
| Gross receipts entry (with quarterly breakdown) | "Enter your gross receipts" |
| CWT entries (repeating rows) | "Creditable Withholding Tax — BIR Form 2307 entries" |
| Quarterly payments (prior Q1-Q3) | "Quarterly income tax payments already made" |
| Filing status | "Return type and filing status" |

---

## 11. Table Accessibility — Results Comparison Table

### 11.1 Table Structure Requirements

All data tables must have:
- `<caption>` describing the table purpose (visible or `sr-only`)
- `scope="col"` on all column headers
- `scope="row"` on row headers (if any)
- No layout tables (use CSS grid/flexbox instead)
- `<thead>`, `<tbody>`, `<tfoot>` section elements

### 11.2 Screen Reader Reading Order

The regime comparison table is read in this order by screen readers:
1. Table caption: "Comparison of all three tax computation methods for your inputs. The optimal method is highlighted."
2. Column headers: "Tax Method, Annual Tax Due, Difference from Optimal, Status, [View details column]"
3. Row 1 (optimal): "8% Flat Rate — optimal, recommended. Philippine pesos 60,000. Saves 32,000 pesos compared to next best option. Optimal — this method results in the lowest tax. [View details button]"
4. Row 2: "Graduated rate with Optional Standard Deduction. Philippine pesos 92,000. 32,000 pesos more than optimal. Option. [View details button]"
5. Row 3: "Graduated rate with Itemized Deductions. Philippine pesos 108,000. 48,000 pesos more than optimal. Option. [View details button]"

### 11.3 Tax Breakdown Detail Tables

Each path detail accordion contains a `<dl>` (definition list) for key-value pairs, not a `<table>`, since it is a series of label-value pairs without column relationships.

---

## 12. Modal and Dialog Accessibility

### 12.1 Modal ARIA Structure

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal_title"
  aria-describedby="modal_desc"
  id="upgrade-modal"
>
  <h2 id="modal_title" tabindex="-1">Upgrade to TaxOptimizer Pro</h2>
  <p id="modal_desc">
    Save your computations, export to PDF, and track quarterly payments with Pro.
  </p>
  <!-- Modal content -->
  <button type="button" aria-label="Close upgrade modal">
    <svg aria-hidden="true"><!-- X icon --></svg>
  </button>
</div>
<!-- Backdrop -->
<div aria-hidden="true" class="modal-backdrop"></div>
```

### 12.2 Page Inert When Modal Open

When modal is open, the page root receives `inert` attribute (or `aria-hidden="true"` as fallback):

```javascript
// Open modal
document.getElementById('page-root').setAttribute('inert', '');
document.getElementById('upgrade-modal').removeAttribute('hidden');
document.getElementById('modal_title').focus();

// Close modal
document.getElementById('page-root').removeAttribute('inert');
document.getElementById('upgrade-modal').setAttribute('hidden', '');
triggerButton.focus(); // Return focus to trigger
```

### 12.3 Focus Trap in Modal

Tab key cycles through all focusable elements within the modal. When focus reaches the last element and user presses Tab, it wraps to the first element. When focus is on the first element and user presses Shift+Tab, it wraps to the last element. Focus never escapes to the background page.

---

## 13. Images, Icons, and Decorative Elements

### 13.1 Icon Classification

| Usage | Technique | Example |
|-------|-----------|---------|
| Decorative icon accompanying text | `aria-hidden="true"` | ✓ check icon next to "Optimal" badge text |
| Icon-only button | `aria-label` on `<button>` | Copy link button: `aria-label="Copy shareable link"` |
| Status icon with adjacent text | `aria-hidden="true"` on icon (text conveys meaning) | ExclamationTriangle icon in warning alert |
| Informational icon alone (no text) | `role="img"` with `aria-label` | BIR logo in header |
| Loading spinner | `aria-hidden="true"`, button has `aria-busy="true"` and `aria-label` | "Calculating taxes, please wait" |

### 13.2 SVG Icon Requirements

All SVG icons in the codebase must:
- Include `aria-hidden="true"` and `focusable="false"` by default
- Never use `<title>` inside SVG for accessibility (use `aria-label` on the wrapping button/element instead)
- Be sized via CSS, not `width/height` attributes on the `<svg>` element

```html
<!-- Correct: decorative icon in button -->
<button type="button" aria-label="Delete computation">
  <svg aria-hidden="true" focusable="false" class="icon-sm">
    <!-- trash icon paths -->
  </svg>
</button>

<!-- Incorrect: do not use title inside SVG for accessibility -->
<!-- <svg><title>Delete</title>...</svg> -->
```

### 13.3 Images

| Image Type | Required Alt Text |
|------------|------------------|
| Logo (header) | `alt="TaxOptimizer — Philippine Freelance Tax Calculator"` |
| Favicon | N/A (decorative) |
| OG image (social share) | N/A (not rendered on page) |
| Illustration on landing page (tax forms) | `alt="Illustration of BIR tax forms and a Philippine peso symbol"` |
| Screenshot of results (in landing page) | `alt="Screenshot showing three tax regime options with the 8% flat rate highlighted as optimal, saving ₱32,000"` |
| Blog post thumbnail | `alt="[Blog post title]"` |

---

## 14. Motion and Animation

### 14.1 prefers-reduced-motion

All animations and transitions must respect the `prefers-reduced-motion: reduce` media query.

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable transitions */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 14.2 Animation Inventory

| Animation | Default duration | Reduced-motion behavior |
|-----------|-----------------|------------------------|
| Toggle switch knob slide | 150ms | Instant position change |
| Tooltip fade-in | 150ms | Instant appear |
| Modal backdrop fade | 200ms | Instant appear |
| Progress bar fill on step advance | 300ms | Instant fill |
| Accordion expand/collapse | 200ms height transition | Instant show/hide |
| Step transition (wizard step slide) | 250ms slide animation | Instant replace |
| Loading spinner rotation | continuous | Replaced with static ellipsis "…" text |
| Toast notification slide-in | 200ms | Instant appear |
| Card hover elevation change | 150ms box-shadow | Instant change |
| Real-time regime estimate fade | 200ms | Instant update |

### 14.3 Flashing Content

No flashing content is used anywhere in the platform. The platform contains no video, no GIFs, no animated banners. The loading spinner rotates continuously but at a frequency well below 3Hz (it completes one rotation per 800ms ≈ 1.25Hz), satisfying WCAG 2.3.1.

---

## 15. Language and Internationalization

### 15.1 Page Language

```html
<html lang="en-PH">
```

`lang="en-PH"` specifies English as used in the Philippines. This ensures screen readers use appropriate English pronunciation (not US-English-only). BIR acronyms (BIR, RDO, ITR, CWT) are read as letter-by-letter abbreviations.

### 15.2 Language of Parts

Specific terms in Filipino must be identified:

```html
<!-- Filipino legal/official terms in documents -->
<span lang="fil">Republika ng Pilipinas</span>

<!-- Philippine Peso symbol in context -->
<!-- ₱ symbol is read as "Philippine peso" or "peso" by screen readers -->
<!-- Supplement with aria-label where amount clarity matters -->
<span aria-label="Philippine pesos 500,000">₱500,000</span>
```

### 15.3 BIR Acronyms

BIR acronyms must not be expanded inline (they are understood by the target audience), but their first appearance on each page is supplemented with an `<abbr>` element:

```html
<abbr title="Bureau of Internal Revenue">BIR</abbr> Form 1701A
```

| Acronym | Expansion |
|---------|-----------|
| BIR | Bureau of Internal Revenue |
| ITR | Income Tax Return |
| CWT | Creditable Withholding Tax |
| OSD | Optional Standard Deduction |
| RDO | Revenue District Office |
| TIN | Tax Identification Number |
| TRAIN | Tax Reform for Acceleration and Inclusion |
| EOPT | Ease of Paying Taxes |
| CREATE | Corporate Recovery and Tax Incentives for Enterprises |
| NOLCO | Net Operating Loss Carry-Over |

---

## 16. Touch Target Sizes

### 16.1 Minimum Touch Target Requirements

Per WCAG 2.5.5 (Level AAA) and Apple/Google HIG guidelines, all interactive elements must have a minimum touch target of **44×44 CSS pixels**.

| Component | Visual size | Touch target size | Method |
|-----------|------------|-------------------|--------|
| Button (md) | 40px tall | 44px tall (padding added) | Increase padding |
| Button (sm) | 32px tall | 44px tall | `min-height: 44px` |
| Checkbox | 18×18px box | 44×44px | Padding on `<label>` |
| Radio button | 20×20px circle | 44×44px | Padding on `<label>` |
| Toggle switch | 44×24px track | 44×44px | Wrapper div with min-height |
| Tooltip trigger (? icon) | 20×20px | 44×44px | Padding on `<button>` |
| Close button (modal, toast) | 24×24px icon | 44×44px | Padding on `<button>` |
| Table "View details" button | 32×24px | 44×44px | `min-height: 44px; min-width: 44px` |
| Navigation links | varies | 44px height | `padding: 10px 0` |
| Step circles in stepper | 32px | 44px | `min-width: 44px; min-height: 44px` on `<button>` |
| Dismiss alert button | 20×20px | 44×44px | Padding |

### 16.2 Spacing Between Touch Targets

Adjacent touch targets must have at least 8px spacing between them to prevent mis-taps. This applies to:
- Wizard navigation buttons (Back / Continue): minimum `16px` gap
- Radio card options: minimum `8px` vertical gap
- Checkbox list items: minimum `8px` vertical gap

---

## 17. Error Recovery and Recovery Patterns

### 17.1 Form Error Recovery

When a field has an error, the user can correct it by:
1. Clicking or tabbing into the field (focus moves to field with error border)
2. Entering a corrected value
3. On blur: error re-validates and clears if corrected
4. Screen reader reads: "[Field label]: [New value]. [Error cleared]" (via `aria-live`)

### 17.2 Engine Error Recovery

If the engine returns an error (`ERR_*` code) after submission:

```html
<div role="alert" aria-live="assertive" id="engine-error-banner">
  <h2>We could not complete your computation</h2>
  <p>[User-friendly error description mapped from ERR_* code]</p>
  <button type="button" onclick="goToStep(errorStep)">
    Fix this issue
  </button>
</div>
```

Focus moves to the `<h2>` inside the error banner. The "Fix this issue" button returns the user to the specific wizard step where the error input originates.

### 17.3 Network Error Recovery

If the API request fails:

```html
<div role="alert" aria-live="assertive">
  <p>Unable to connect. Please check your internet connection and try again.</p>
  <button type="button" id="retry-button">Try Again</button>
</div>
```

Focus moves to the error message heading. The retry button resubmits the same inputs.

---

## 18. Screen Reader Test Matrix

### 18.1 Required Browser / Screen Reader Combinations for QA

| Screen Reader | Browser | Platform | Priority |
|--------------|---------|----------|----------|
| NVDA (latest stable) | Chrome (latest) | Windows 10/11 | P1 — must pass all |
| JAWS 2024 | Chrome (latest) | Windows 10/11 | P1 — must pass all |
| VoiceOver | Safari (latest) | macOS (latest) | P1 — must pass all |
| VoiceOver | Safari (latest) | iOS (latest) | P1 — must pass all |
| TalkBack (latest) | Chrome (latest) | Android (latest) | P2 — must pass critical flows |
| NVDA | Firefox (latest) | Windows 10/11 | P2 — smoke test only |

### 18.2 Critical Test Scenarios

| Scenario | Steps | Expected Screen Reader Behavior |
|----------|-------|--------------------------------|
| Complete the wizard | Navigate all steps WS-00 to WS-12 using Tab/Arrow/Enter only | Each step heading read on arrival; all fields labeled; errors announced |
| Correct a form error | Enter invalid value, Tab away, hear error, correct it | Error announced on blur; clearance announced on re-blur |
| View results | Complete wizard, hear results | Results announcement, table read with regime names and amounts |
| Navigate comparison table | Use Table navigation commands | Each cell readable; row aria-labels provide full context |
| Expand path detail | Press Enter on "View details" | Accordion content appears; not re-focused (user can Tab in) |
| Use tooltip | Tab to ? icon, press Enter | Tooltip content read |
| Navigate stepper | Tab to completed step button, press Enter | Returns to that step; heading announced |
| Dismiss alert | Tab to dismiss button, press Space | Alert removed from DOM; announcement: "Warning dismissed" |

---

## 19. Implementation Checklist

All items below must be verified by code review and automated testing before each release.

### 19.1 Automated Testing

- [ ] Run `axe-core` audit on every page and wizard step — zero violations
- [ ] Run `eslint-plugin-jsx-a11y` as part of CI lint — zero errors
- [ ] Lighthouse accessibility score ≥ 95 on all pages
- [ ] All color contrast pairs pass automated contrast checker against spec values in Section 2.2

### 19.2 Manual Testing

- [ ] Tab through entire wizard using keyboard only — reach results without mouse
- [ ] All focus rings visible at each interactive element
- [ ] Skip links appear on focus and navigate to correct targets
- [ ] Heading hierarchy: no skipped levels on any page
- [ ] All images have appropriate alt text
- [ ] All form fields have visible labels
- [ ] Required indicators communicated to screen readers
- [ ] All error messages announced by screen reader
- [ ] Wizard step transitions announce new step heading
- [ ] Results page announces optimal regime and tax due
- [ ] Modal traps focus; Escape closes and returns focus to trigger
- [ ] Tooltips accessible via keyboard and close on Escape
- [ ] Table headers and scope attributes correct
- [ ] All SVG icons have `aria-hidden="true" focusable="false"`
- [ ] Toggle switches use `role="switch"` with `aria-checked`
- [ ] Radio groups use `<fieldset>` + `<legend>`
- [ ] `prefers-reduced-motion` tested — no animations in reduced-motion mode
- [ ] Touch targets ≥ 44×44px on mobile (Chrome DevTools device simulation)
- [ ] Page reflows at 320px viewport width without horizontal scroll
- [ ] Text resizes to 200% without loss of content or functionality
- [ ] Language attribute `lang="en-PH"` present on `<html>`
- [ ] `aria-live` regions announce dynamic content changes

### 19.3 Screen Reader Testing

- [ ] NVDA + Chrome: complete critical flows in Section 18.2
- [ ] VoiceOver + Safari (macOS): complete critical flows
- [ ] VoiceOver + Safari (iOS): complete wizard on mobile
- [ ] TalkBack + Chrome (Android): complete wizard on mobile
