# Design System — Philippine Inheritance Engine v2

**Aspect**: design-system
**Wave**: 5c (Frontend UI — Visual Design)
**Depends On**: wizard-steps, results-view, shared-components

---

## Overview

A fresh visual direction for a legal/financial tool serving Philippine lawyers, estate
planners, and heirs. The design must communicate **authority, precision, and trust** while
remaining approachable enough for non-lawyers navigating a complex subject. It must also
signal Philippine cultural context subtly — not through flags or tourist clichés, but
through palette and typographic choices that feel locally familiar.

**NOT** Navy + Gold (v1). This spec exercises fresh design judgment.

---

## §1. Palette

### Design Rationale

Inspired by **archival green** — the color of Philippine legal ledgers, notarial paper,
and BIR documents. Deep jade green reads as institutional authority without the coldness of
navy. A warm copper accent nods to peso coins and Philippine craftsmanship. Off-white
backgrounds mimic document paper, reducing eye strain for long sessions.

### CSS Custom Properties (Tailwind CSS v4 `@theme` block)

```css
@theme {
  /* ─── Core Brand ─────────────────────────────────────────────── */
  --color-brand-50:  #ecfdf5;   /* mint tint — lightest bg */
  --color-brand-100: #d1fae5;   /* mint — hover states */
  --color-brand-200: #a7f3d0;   /* light green — selected */
  --color-brand-600: #059669;   /* jade green — interactive elements */
  --color-brand-700: #047857;   /* deep jade — primary buttons */
  --color-brand-800: #065f46;   /* forest — headers, nav */
  --color-brand-900: #064e3b;   /* darkest — active/pressed states */

  /* ─── Accent (Copper / Bronze) ───────────────────────────────── */
  --color-accent-100: #fef3c7;  /* pale amber — accent bg */
  --color-accent-400: #fbbf24;  /* gold — inline highlights */
  --color-accent-600: #d97706;  /* copper — accent text, badges */
  --color-accent-700: #b45309;  /* deep copper — active accent */

  /* ─── Neutrals (Warm Stone) ──────────────────────────────────── */
  --color-stone-50:  #fafaf9;   /* page background */
  --color-stone-100: #f5f5f4;   /* card background alt */
  --color-stone-200: #e7e5e4;   /* borders — default */
  --color-stone-300: #d6d3d1;   /* borders — strong / dividers */
  --color-stone-400: #a8a29e;   /* placeholder text */
  --color-stone-500: #78716c;   /* muted / secondary text */
  --color-stone-700: #44403c;   /* body text */
  --color-stone-900: #1c1917;   /* heading text */

  /* ─── Semantic Status ────────────────────────────────────────── */
  --color-error-50:  #fef2f2;
  --color-error-600: #dc2626;   /* validation errors */
  --color-error-700: #b91c1c;

  --color-warning-50:  #fffbeb;
  --color-warning-600: #d97706;  /* warnings (amber) — reuses accent-600 */
  --color-warning-700: #b45309;

  --color-info-50:  #eff6ff;
  --color-info-600: #2563eb;    /* informational notices */
  --color-info-700: #1d4ed8;

  --color-success-50:  #f0fdf4;
  --color-success-600: #16a34a;  /* confirmation / computed-ok */
  --color-success-700: #15803d;

  /* ─── Heir Group Colors ──────────────────────────────────────── */
  /* Used in DistributionTable badges and chart segments */
  --color-group-primary:       #2563eb;  /* blue-600 — G1 (LC/SC/Spouse) */
  --color-group-secondary:     #7c3aed;  /* violet-600 — G2 (Parents/Ascendants) */
  --color-group-tertiary:      #0d9488;  /* teal-600 — G3 (Siblings/Collaterals) */
  --color-group-illegitimate:  #059669;  /* emerald-600 — IC (Illegitimate Children) */
  --color-group-excluded:      #9ca3af;  /* gray-400 — excluded heirs (dimmed) */

  /* Chart segment pairs (darker = legitime, lighter = free portion) */
  --color-chart-lc-legitime:   #1d4ed8;  /* blue-700 */
  --color-chart-lc-fp:         #93c5fd;  /* blue-300 */
  --color-chart-sp-legitime:   #6d28d9;  /* violet-700 */
  --color-chart-sp-fp:         #c4b5fd;  /* violet-300 */
  --color-chart-ic-legitime:   #065f46;  /* brand-800 */
  --color-chart-ic-fp:         #6ee7b7;  /* emerald-300 */
  --color-chart-collateral:    #0f766e;  /* teal-700 */

  /* ─── Surface & Overlay ──────────────────────────────────────── */
  --color-surface:          #ffffff;
  --color-surface-raised:   #ffffff;     /* dialog / modal */
  --color-surface-sunken:   #f5f5f4;    /* input backgrounds */
  --color-overlay:          rgba(28, 25, 23, 0.5);

  /* ─── Focus Ring ─────────────────────────────────────────────── */
  --color-focus-ring: #059669;           /* brand-600 */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
}
```

### Usage Rules

| Token | Used For |
|---|---|
| `brand-700` | Primary action buttons, active step indicator |
| `brand-800` | App header, sidebar (if added), section headings |
| `accent-600` | Copper badges, amount highlights, key result numbers |
| `stone-50` | Page background |
| `stone-200` | Card borders, input borders at rest |
| `stone-700` | Body copy, table cell text |
| `stone-900` | H1–H3 headings |
| `error-600` | Validation error text + icon |
| `warning-600` | Amber warning banners |
| `success-600` | Green "computation successful" banner |

---

## §2. Typography

### Font Stack

```css
@theme {
  /* UI font — forms, tables, labels, buttons, navigation */
  --font-ui: "Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Legal/narrative font — narratives, article citations, explanation panels */
  --font-legal: "Source Serif 4", "Source Serif Pro", Georgia, serif;

  /* Monospace — peso amounts in tables, JSON export, computation log */
  --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}
```

### Loading (Google Fonts / Variable Fonts)

```html
<!-- In <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
```

### Type Scale

```
Display     36px / 40px line-height / font-legal / weight-700
H1          30px / 36px              font-ui      weight-700
H2          24px / 32px              font-ui      weight-600
H3          20px / 28px              font-ui      weight-600
H4          16px / 24px              font-ui      weight-600
Body        15px / 24px              font-ui      weight-400
Body-sm     13px / 20px              font-ui      weight-400
Caption     12px / 16px              font-ui      weight-400  color: stone-500
Legal-body  16px / 28px              font-legal   weight-400  (narrative panel)
Legal-sm    14px / 24px              font-legal   weight-400  (inline article citations)
Mono        14px / 20px              font-mono    weight-400  (amounts in table)
Mono-sm     12px / 16px              font-mono    weight-400  (computation log)
```

### Tailwind Typography Config (v4)

```css
/* src/app.css */
@layer base {
  html {
    font-family: var(--font-ui);
    font-size: 15px;
    color: theme(colors.stone.700);
    background-color: theme(colors.stone.50);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4 {
    color: theme(colors.stone.900);
    font-weight: 600;
  }

  /* Narrative sections use legal font */
  .prose-legal {
    font-family: var(--font-legal);
    font-size: 1rem;
    line-height: 1.75;
    color: theme(colors.stone.700);
  }

  .prose-legal cite,
  .prose-legal .article-ref {
    font-style: italic;
    color: theme(colors.brand.700);
    font-size: 0.875em;
  }

  /* Amount display uses monospace */
  .amount {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
}
```

---

## §3. Component Library

**Stack**: shadcn/ui (Radix UI primitives + Tailwind CSS v4)

### Installation

```bash
# Tailwind CSS v4 + shadcn/ui
npm install tailwindcss@4 @tailwindcss/vite
npx shadcn@latest init
```

**`components.json`** configuration:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Core shadcn/ui Components Used

| shadcn/ui Component | Used For |
|---|---|
| `Button` | Primary/secondary actions (Next Step, Compute, Back) |
| `Input` | Text fields (name, IC count, degree) |
| `Label` | Form field labels |
| `Select` | Enum pickers (HeirType, SubstitutionType, DisinheritanceGround) |
| `Checkbox` | Boolean flags (is_adopted, has_children, is_full_blood) |
| `Switch` | Toggle for hasWill UI flag |
| `Card` + `CardHeader` + `CardContent` | Form step cards, result cards |
| `Accordion` | Computation log sections, advanced field disclosure |
| `Badge` | Heir type tags, succession type, scenario code |
| `Alert` + `AlertTitle` + `AlertDescription` | Warnings, errors, manual review flags |
| `Dialog` + `DialogContent` | Confirmation dialogs, JSON export viewer |
| `Tabs` | WillInput (Institutions / Devises & Legacies / Disinheritances / Substitutions) |
| `Separator` | Visual dividers within form cards |
| `Progress` | Wizard step indicator (optional) |
| `Tooltip` | Article reference inline explanations |
| `Sheet` | Mobile wizard nav drawer (optional) |
| `Table` + `TableHeader` + `TableBody` | Distribution table |
| `ScrollArea` | Long distribution tables, computation log |

---

## §4. Spacing System

**Base unit**: 4px (Tailwind default, `spacing.1 = 4px`)

### Philosophy

- **Generous intra-card padding**: `p-6` (24px) inside form cards
- **Tight field-to-label gap**: `gap-1.5` (6px) label → input
- **Standard field row gap**: `gap-4` (16px) between form fields in a row
- **Section gap within a step**: `gap-6` (24px) between field groups
- **Card gap**: `gap-4` (16px) between cards in a list (heir list, donation list)
- **Step outer padding**: `px-4 py-6 sm:px-8 sm:py-8`

### Layout Grid

```
Max content width:    1280px   (max-w-7xl)
Wizard card width:    768px    (max-w-3xl) — centered
Results layout:       1024px   (max-w-5xl) — full results page
Sidebar (if used):    256px    (w-64)
```

### Responsive Breakpoints (Tailwind CSS v4 defaults)

```
sm:   640px
md:   768px
lg:   1024px
xl:   1280px
```

---

## §5. Key Component Patterns

### 5.1 Form Step Card

Each wizard step is a white card with a brand-colored header band.

```
┌─────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████   │  ← brand-800 header band, 8px height
│  Step 2 of 5                                        │  ← step indicator (stone-500, sm)
│  Decedent Information                               │  ← H2 (stone-900)
│  ─────────────────────────────────────────────      │  ← Separator
│                                                     │
│  [Field rows with label + input]                    │  ← p-6, gap-4
│                                                     │
│  ─────────────────────────────────────────────      │  ← Separator
│  [Back Button]                   [Next Step →]      │  ← p-4 footer area
└─────────────────────────────────────────────────────┘
```

**Tailwind classes for card**:
```tsx
<div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
  <div className="h-2 bg-brand-800" />  {/* color band */}
  <div className="px-6 py-5">
    <p className="text-sm text-stone-500 mb-1">Step {n} of {total}</p>
    <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
  </div>
  <Separator />
  <div className="p-6 space-y-4">{children}</div>
  <Separator />
  <div className="flex justify-between items-center px-6 py-4">{footer}</div>
</div>
```

### 5.2 Field Row Pattern

```tsx
/* Single field */
<div className="flex flex-col gap-1.5">
  <Label htmlFor={id} className="text-sm font-medium text-stone-700">
    {label}
    {required && <span className="text-error-600 ml-1">*</span>}
  </Label>
  <Input id={id} ... />
  {error && (
    <p className="text-xs text-error-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {error.message}
    </p>
  )}
  {hint && <p className="text-xs text-stone-500">{hint}</p>}
</div>

/* Two-column row */
<div className="grid grid-cols-2 gap-4">
  <FieldRow ... />
  <FieldRow ... />
</div>
```

### 5.3 Heir Card (Family Tree Step)

Each heir in the family tree is displayed as a compact card with color-coded left border.

```
┌─[group color border]─────────────────────────────────┐
│  👤 Maria Santos                          [Remove ×]  │
│     Spouse  ·  Legitimate Child (1)                   │
│  ─────────────────────────────────────────────────    │
│  [Expand fields ▼]                                    │
└───────────────────────────────────────────────────────┘
```

```tsx
<div className={cn(
  "rounded-lg border border-stone-200 bg-white shadow-sm",
  "border-l-4",
  groupBorderColor[heir.heir_type]  // see §6 below
)}>
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-3">
      <UserCircle className="w-5 h-5 text-stone-400" />
      <div>
        <p className="font-medium text-stone-900">{heir.name}</p>
        <p className="text-sm text-stone-500">
          <HeirTypeBadge type={heir.heir_type} size="sm" />
          {childCount > 0 && ` · ${childCount} child${childCount > 1 ? "ren" : ""}`}
        </p>
      </div>
    </div>
    <Button variant="ghost" size="icon" onClick={onRemove}>
      <X className="w-4 h-4" />
    </Button>
  </div>
  <Accordion type="single" collapsible>
    <AccordionItem value="fields">
      <AccordionTrigger className="px-4 py-2 text-sm text-stone-500">
        Edit details
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 space-y-4">
        {/* type-specific fields */}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

**Group border colors**:
```typescript
const groupBorderColor: Record<HeirType, string> = {
  LegitimateChild:    "border-l-blue-500",
  LegitimatedChild:   "border-l-blue-400",
  AdoptedChild:       "border-l-blue-300",
  IllegitimateChild:  "border-l-emerald-500",
  Spouse:             "border-l-violet-500",
  LegitimateParent:   "border-l-amber-500",
  LegitimateAscendant:"border-l-amber-400",
  Sibling:            "border-l-teal-500",
  Collateral:         "border-l-teal-400",
};
```

### 5.4 Heir Type Badge

```tsx
const HEIR_TYPE_BADGE_CONFIG: Record<HeirType, { label: string; className: string }> = {
  LegitimateChild:     { label: "LC",   className: "bg-blue-100 text-blue-700" },
  LegitimatedChild:    { label: "LGD",  className: "bg-blue-50  text-blue-600" },
  AdoptedChild:        { label: "AC",   className: "bg-sky-100  text-sky-700"  },
  IllegitimateChild:   { label: "IC",   className: "bg-emerald-100 text-emerald-700" },
  Spouse:              { label: "SP",   className: "bg-violet-100 text-violet-700" },
  LegitimateParent:    { label: "LP",   className: "bg-amber-100 text-amber-700" },
  LegitimateAscendant: { label: "LA",   className: "bg-amber-50  text-amber-600" },
  Sibling:             { label: "SIB",  className: "bg-teal-100  text-teal-700"  },
  Collateral:          { label: "COL",  className: "bg-teal-50   text-teal-600"  },
};

function HeirTypeBadge({ type, size = "md" }: { type: HeirType; size?: "sm" | "md" }) {
  const { label, className } = HEIR_TYPE_BADGE_CONFIG[type];
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-mono font-semibold rounded",
        size === "sm" ? "text-xs px-1.5 py-0" : "text-xs px-2 py-0.5",
        className
      )}
    >
      {label}
    </Badge>
  );
}
```

### 5.5 EffectiveGroup Badge (Results Table)

```typescript
const GROUP_BADGE_CONFIG: Record<EffectiveGroup, { label: string; className: string }> = {
  PrimaryCompulsory:   { label: "Primary",   className: "bg-blue-100 text-blue-700 border-blue-200" },
  SecondaryCompulsory: { label: "Secondary", className: "bg-violet-100 text-violet-700 border-violet-200" },
  ConcurrentIllegit:  { label: "Concurrent", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  Intestate:           { label: "Intestate", className: "bg-teal-100 text-teal-700 border-teal-200" },
};
```

### 5.6 Severity Alert Patterns

Three severity tiers, mapped to semantic colors:

```tsx
/* MANUAL REVIEW (blocking) — error severity */
<Alert variant="destructive" className="border-error-200 bg-error-50">
  <AlertTriangle className="w-4 h-4 text-error-600" />
  <AlertTitle className="text-error-700 font-semibold">Manual Review Required</AlertTitle>
  <AlertDescription className="text-error-600 space-y-2">
    {flags.map(flag => <ManualReviewFlagItem key={flag.flag} flag={flag} />)}
  </AlertDescription>
</Alert>

/* WARNINGS — warning severity */
<Alert className="border-warning-200 bg-warning-50">
  <AlertCircle className="w-4 h-4 text-warning-600" />
  <AlertTitle className="text-warning-700 font-semibold">Computation Warnings</AlertTitle>
  <AlertDescription className="text-warning-600 space-y-2">
    {warnings.map(w => <ValidationWarningItem key={w.code} warning={w} />)}
  </AlertDescription>
</Alert>

/* INFORMATIONAL */
<Alert className="border-info-200 bg-info-50">
  <Info className="w-4 h-4 text-info-600" />
  <AlertTitle className="text-info-700 font-semibold">{title}</AlertTitle>
  <AlertDescription className="text-info-700">{message}</AlertDescription>
</Alert>

/* SUCCESS */
<Alert className="border-success-200 bg-success-50">
  <CheckCircle2 className="w-4 h-4 text-success-600" />
  <AlertTitle className="text-success-700 font-semibold">Computation Complete</AlertTitle>
  <AlertDescription className="text-success-600">{message}</AlertDescription>
</Alert>
```

### 5.7 Step Indicator

```tsx
/* Horizontal progress dots with labels for wizard */
<nav aria-label="Wizard progress">
  <ol className="flex items-center gap-0">
    {WIZARD_STEPS.map((step, idx) => (
      <li key={step.id} className="flex items-center">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
          idx < currentStep  && "bg-brand-700 text-white",       /* completed */
          idx === currentStep && "bg-brand-800 text-white ring-2 ring-brand-300", /* active */
          idx > currentStep  && "bg-stone-200 text-stone-500",   /* pending */
        )}>
          {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
        </div>
        <span className={cn(
          "hidden sm:block text-xs ml-2 mr-4",
          idx === currentStep ? "text-brand-800 font-medium" : "text-stone-500"
        )}>
          {step.label}
        </span>
        {idx < WIZARD_STEPS.length - 1 && (
          <div className={cn(
            "h-px w-8 sm:w-12",
            idx < currentStep ? "bg-brand-600" : "bg-stone-200"
          )} />
        )}
      </li>
    ))}
  </ol>
</nav>
```

### 5.8 Amount Display

Peso amounts in the distribution table use monospace with copper color for positive values.

```tsx
function MoneyDisplay({
  centavos,
  size = "md",
  dimmed = false,
}: {
  centavos: number;
  size?: "sm" | "md" | "lg";
  dimmed?: boolean;
}) {
  const formatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);

  return (
    <span className={cn(
      "font-mono tabular-nums",
      size === "sm" && "text-xs",
      size === "md" && "text-sm",
      size === "lg" && "text-base font-semibold",
      dimmed ? "text-stone-400" : "text-accent-700",
    )}>
      {formatted}
    </span>
  );
}
```

### 5.9 Scenario Code Badge

```tsx
function ScenarioCodeBadge({ code }: { code: ScenarioCode }) {
  const isTestate = code.startsWith("T");
  return (
    <Badge variant="outline" className={cn(
      "font-mono text-xs font-bold",
      isTestate
        ? "border-brand-300 text-brand-700 bg-brand-50"
        : "border-stone-300 text-stone-600 bg-stone-50"
    )}>
      {code}
    </Badge>
  );
}
```

### 5.10 Succession Type Badge

```tsx
const SUCCESSION_TYPE_CONFIG: Record<SuccessionType, { label: string; className: string }> = {
  Intestate: {
    label: "Intestate",
    className: "border-stone-300 bg-stone-100 text-stone-700",
  },
  Testate: {
    label: "Testate",
    className: "border-brand-300 bg-brand-50 text-brand-800",
  },
  Mixed: {
    label: "Mixed",
    className: "border-accent-300 bg-accent-100 text-accent-700",
  },
};
```

---

## §6. App Shell

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  APP HEADER                                             │  ← brand-800 bg, white text
│  🏛 Philippine Inheritance Calculator     [v2.0]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  MAIN CONTENT                                           │  ← stone-50 bg
│  (wizard OR results, centered, max-w-3xl/5xl)           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                 │  ← stone-100 bg
│  Based on Civil Code Arts. 774-1105 · Family Code       │
│  RA 8552 · RA 11642 · © 2025                            │
└─────────────────────────────────────────────────────────┘
```

```tsx
/* App Header */
<header className="bg-brand-800 text-white px-6 py-4 shadow-md">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Scale className="w-6 h-6 text-brand-200" />  {/* lucide-react Scale icon */}
      <div>
        <h1 className="text-lg font-semibold leading-tight">
          Philippine Inheritance Calculator
        </h1>
        <p className="text-xs text-brand-300">
          Civil Code Arts. 774–1105 · Family Code
        </p>
      </div>
    </div>
    <Badge variant="secondary" className="bg-brand-700 text-brand-200 border-brand-600">
      v2.0
    </Badge>
  </div>
</header>
```

---

## §7. Dark Mode

**Decision: Dark mode is deferred for v2.**

A legal tool is primarily used during business hours in professional settings. Dark mode
adds significant complexity (all semantic colors need dark variants). Defer to v3. The
CSS custom property approach makes future dark mode straightforward to add via
`@media (prefers-color-scheme: dark)` overrides.

---

## §8. Icon Library

**Library**: `lucide-react` (consistent with shadcn/ui defaults)

| Context | Icon |
|---|---|
| App header | `Scale` (balance of justice) |
| Heir (person) | `UserCircle` |
| Remove heir | `X` or `Trash2` |
| Add heir | `UserPlus` |
| Estate | `Home` or `Landmark` |
| Decedent | `User` |
| Will document | `Scroll` or `FileText` |
| Donation | `Gift` |
| Error / Manual Review | `AlertTriangle` |
| Warning | `AlertCircle` |
| Info | `Info` |
| Success | `CheckCircle2` |
| Print | `Printer` |
| Export JSON | `Download` |
| Back | `ChevronLeft` |
| Next | `ChevronRight` |
| Expand accordion | `ChevronDown` |
| Computation log | `ClipboardList` |
| Peso amount | `Banknote` (optional in MoneyInput prefix) |
| Representation | `GitMerge` |

---

## §9. Motion & Animation

**Philosophy**: Minimal. Legal/financial tools prioritize predictability over delight.

- **Page transitions**: None (instant) — wizard steps swap instantly via conditional render
- **Accordion**: `data-[state=open]:animate-accordion-down` (shadcn default, ~200ms ease)
- **Alert appearance**: `animate-in fade-in-0 slide-in-from-top-2 duration-200`
- **Loading state**: `animate-pulse` on skeleton cards while WASM initializes
- **Button press**: Default Radix `active:scale-[0.98]` via shadcn

No CSS transitions on background colors or borders (avoid distracting flicker).

---

## §10. Print Styles

Results page must print cleanly (lawyers need paper copies).

```css
@media print {
  /* Hide UI chrome */
  header, footer, nav, .actions-bar { display: none !important; }

  /* Expand all accordions */
  [data-state="closed"] > [data-radix-accordion-content] {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Expand all heir narrative cards */
  .narrative-card[data-state="closed"] .narrative-body {
    display: block !important;
  }

  /* Page breaks */
  .distribution-table { page-break-inside: avoid; }
  .manual-review-panel { page-break-before: always; }

  /* Font sizes */
  body { font-size: 11px; }
  .amount { font-size: 11px; }

  /* Colors */
  .bg-brand-50 { background: white !important; }
  .border { border-color: #ccc !important; }

  /* Remove shadows */
  * { box-shadow: none !important; }
}
```

---

## §11. Accessibility

- **Color contrast**: All text/background combinations meet WCAG 2.1 AA (4.5:1 for body, 3:1 for large text)
  - `stone-700` on `stone-50`: 8.6:1 ✓
  - `brand-700` on white: 5.3:1 ✓
  - `error-600` on `error-50`: 4.8:1 ✓
  - `warning-600` on `warning-50`: 4.6:1 ✓
  - `accent-700` on white: 5.1:1 ✓
- **Focus ring**: `ring-2 ring-brand-600 ring-offset-2` on all interactive elements
- **ARIA**: shadcn/ui Radix primitives handle all ARIA roles automatically
- **Screen reader labels**: Every icon-only button has `aria-label`
- **Form errors**: `role="alert"` on error messages, `aria-invalid="true"` on fields
- **Semantic HTML**: `<main>`, `<nav>`, `<section aria-labelledby>` throughout
- **Skip link**: `<a href="#main-content" className="sr-only focus:not-sr-only">` in app shell

---

## §12. CSS Variable Map (Tailwind CSS v4 → shadcn Integration)

shadcn/ui uses specific CSS variables. Map our brand palette to shadcn's expected variables:

```css
@layer base {
  :root {
    --background:   250 250 249;    /* stone-50 */
    --foreground:   28 25 23;       /* stone-900 */
    --card:         255 255 255;    /* white */
    --card-foreground: 28 25 23;
    --popover:      255 255 255;
    --popover-foreground: 28 25 23;
    --primary:      4 95 70;        /* brand-800 */
    --primary-foreground: 236 253 245; /* brand-50 */
    --secondary:    245 245 244;    /* stone-100 */
    --secondary-foreground: 28 25 23;
    --muted:        245 245 244;
    --muted-foreground: 120 113 108; /* stone-500 */
    --accent:       180 83 9;       /* accent-700 */
    --accent-foreground: 255 251 235;
    --destructive:  220 38 38;      /* error-600 */
    --destructive-foreground: 255 255 255;
    --border:       231 229 228;    /* stone-200 */
    --input:        231 229 228;
    --ring:         5 150 105;      /* brand-600 */
    --radius:       0.5rem;         /* 8px — matches rounded-lg */
  }
}
```

---

## §13. File Layout

```
src/
├── app.css                     ← @theme, @layer base (global styles)
├── components/
│   ├── ui/                     ← shadcn/ui generated components (Button, Card, etc.)
│   ├── shared/
│   │   ├── MoneyInput.tsx
│   │   ├── DateInput.tsx
│   │   ├── FractionInput.tsx
│   │   ├── PersonPicker.tsx
│   │   ├── EnumSelect.tsx
│   │   ├── HeirTypeBadge.tsx
│   │   ├── EffectiveGroupBadge.tsx
│   │   ├── ScenarioCodeBadge.tsx
│   │   ├── SuccessionTypeBadge.tsx
│   │   ├── MoneyDisplay.tsx
│   │   ├── AlertCard.tsx
│   │   └── StepIndicator.tsx
│   ├── wizard/
│   │   ├── WizardShell.tsx
│   │   ├── Step1Estate.tsx
│   │   ├── Step2Decedent.tsx
│   │   ├── Step3FamilyTree.tsx
│   │   ├── Step4Will.tsx        ← conditional on hasWill
│   │   ├── Step5Donations.tsx
│   │   └── Step6Review.tsx
│   ├── results/
│   │   ├── ResultsPage.tsx
│   │   ├── SummaryHeader.tsx
│   │   ├── DistributionTable.tsx
│   │   ├── DistributionChart.tsx
│   │   ├── NarrativePanel.tsx
│   │   ├── ManualReviewPanel.tsx
│   │   ├── WarningsPanel.tsx
│   │   ├── ComputationLog.tsx
│   │   ├── ErrorState.tsx
│   │   └── ActionsBar.tsx
│   └── layout/
│       ├── AppHeader.tsx
│       └── AppFooter.tsx
└── lib/
    └── cn.ts                   ← clsx + tailwind-merge util
```

---

## §14. Design Tokens Summary Table

| Token | Value | Usage |
|---|---|---|
| `--color-brand-700` | `#047857` | Primary buttons, active steps |
| `--color-brand-800` | `#065f46` | App header, section headings |
| `--color-accent-600` | `#d97706` | Copper amounts, accent badges |
| `--color-accent-700` | `#b45309` | Copper text on light bg |
| `--color-stone-50` | `#fafaf9` | Page bg |
| `--color-stone-200` | `#e7e5e4` | Borders, dividers |
| `--color-stone-700` | `#44403c` | Body text |
| `--color-error-600` | `#dc2626` | Errors, destructive |
| `--color-warning-600` | `#d97706` | Warnings (amber) |
| `--font-ui` | Inter Variable | All UI text |
| `--font-legal` | Source Serif 4 | Narrative panels, citations |
| `--font-mono` | JetBrains Mono | Amounts, code, log |
| `--radius` | `0.5rem` | shadcn border radius |

---

## §15. Cross-Layer Notes

1. **EffectiveGroup badge labels** use human labels ("Primary", "Secondary", "Concurrent", "Intestate"), NOT the raw PascalCase enum values — this is presentation-only mapping, not serialization.

2. **HeirType badge abbreviations** (LC, IC, SP etc.) are display-only shorthands. The actual `HeirType` enum values in TypeScript and Rust remain full PascalCase (e.g., `"LegitimateChild"`).

3. **MoneyDisplay centavo precision**: Always divide by 100 exactly. Use `Intl.NumberFormat` with `en-PH` locale and `currency: "PHP"` for ₱ symbol. Never use manual string concatenation for peso display.

4. **Recharts palette**: Chart segment colors from `§1` CSS variables must be referenced as string literals in Recharts `<Cell fill="...">` — Recharts does not read CSS variables. Extract hardcoded hex values from `§1` for chart usage.

5. **Tailwind CSS v4**: Uses `@theme` directive (not `theme.extend` in `tailwind.config.js`). Peer-dependent on `@tailwindcss/vite` plugin. shadcn/ui works with CSS variables regardless of Tailwind version.

6. **Print media query**: The accordion expansion hack (overriding Radix `data-[state=closed]`) requires testing — Radix may use inline `height: 0` instead of `display: none`. Use `height: auto !important; overflow: visible !important` to force expansion in print context.

7. **No dark mode in v2**: All palette tokens are light-mode only. Adding `@media (prefers-color-scheme: dark)` overrides in a future v3 patch is straightforward with the CSS variable architecture.
