# design-results-components — Results View Modernization Audit

**Wave**: 3 — Design Modernization Audit
**Date**: 2026-03-04
**Source files**: `loops/inheritance-frontend-forward/app/src/components/results/`
**Design direction**: Navy (#1e3a5f) + Gold (#c5a44e) stays. Modernize everything else.

---

## Component Inventory

| File | Lines | Description | Status |
|------|-------|-------------|--------|
| `ResultsView.tsx` | 62 | Main container: orchestrates all result sections | PARTIAL — 5 components exist but aren't wired in |
| `ResultsHeader.tsx` | 93 | Scenario badge, succession type, estate total, preterition alert | WORKING — minor palette issues |
| `DistributionSection.tsx` | 306 | Pie chart + heir table, 7 layout variants | PARTIAL — chart no legend, layout stubs |
| `ComputationLog.tsx` | 69 | Collapsible accordion of pipeline steps | WORKING — minor color issues |
| `NarrativePanel.tsx` | 91 | Expandable per-heir narratives with copy button | WORKING — no copy feedback |
| `WarningsPanel.tsx` | 64 | Alert cards per manual flag, hidden when empty | WORKING — hardcoded colors |
| `ActionsBar.tsx` | 75 | Edit Input, Export JSON, Copy Narratives | PARTIAL — Save/Share/PDF missing |
| `ShareBreakdownSection.tsx` | 140 | Expandable per-heir share computation breakdown | ORPHANED — not used in ResultsView |
| `ComparisonPanel.tsx` | 157 | Testate vs intestate diff table | ORPHANED — not used in ResultsView |
| `DonationsSummaryPanel.tsx` | 126 | Collation status for inter-vivos donations | ORPHANED — not used in ResultsView |
| `StatuteCitationsSection.tsx` | 83 | Legal basis chips with expandable descriptions | ORPHANED — not used in ResultsView |

---

## Gaps Identified

### GAP-DRC-001 — 4 components exist but are NEVER rendered in ResultsView (CRITICAL)

**Current** (`ResultsView.tsx` lines 1–62): Renders only `ResultsHeader`, `DistributionSection`, `NarrativePanel`, `WarningsPanel`, `ComputationLog`, `ActionsBar`.

**Orphaned components** (exist, built, have tests, but zero render path):
- `ShareBreakdownSection` — per-heir share computation breakdown
- `ComparisonPanel` — testate vs intestate scenario diff
- `DonationsSummaryPanel` — collation status for donations
- `StatuteCitationsSection` — legal basis chips (used in share breakdown context)

**Impact**: Users never see these features. All spec work in §4.8 (ComparisonPanel), §4.12 (ShareBreakdown), §4.10 (DonationsPanel) is unreachable.

---

### GAP-DRC-002 — ResultsView missing caseId prop — ComparisonPanel cannot save (CRITICAL)

**Current** (`ResultsView.tsx` line 13): `ResultsViewProps` has only `input`, `output`, `onEditInput`.

`ComparisonPanel` requires `caseId?: string` to call `saveComparisonResults(caseId, ...)` (line 66 in ComparisonPanel.tsx). Without `caseId`, comparison results are computed but never persisted to the DB.

The prop chain `WizardContainer → ResultsView → ComparisonPanel` is entirely absent.

---

### GAP-DRC-003 — ActionsBar missing Save, Share, and PDF Export (CRITICAL)

**Current** (`ActionsBar.tsx` lines 44–74): Three buttons: Edit Input, Export JSON, Copy Narratives.

**Missing** (confirmed by journey-first-case: JFC-009, JFC-011, JFC-013):
- **Save to DB**: no button that persists the case record to Supabase
- **Share Case Link**: no button that generates/copies a share link or opens ShareDialog
- **Generate PDF**: no button for PDF export via `@react-pdf/renderer`

All three require `caseId` to be passed into ActionsBar (currently absent from its props).

---

### GAP-DRC-004 — No clipboard feedback anywhere (HIGH)

**Current** (`NarrativePanel.tsx` line 47): `await navigator.clipboard.writeText(...)` — no success/error feedback.
**Current** (`ActionsBar.tsx` line 41): `navigator.clipboard.writeText(...)` — no success/error feedback.

Users click "Copy All Narratives" or "Copy Narratives" and receive zero visual confirmation. If the clipboard API fails (e.g., no HTTPS, permissions denied), the error is silently swallowed.

---

### GAP-DRC-005 — PieChart has no legend (HIGH)

**Current** (`DistributionSection.tsx` lines 173–186): `<PieChart>` with `<Pie>` + `<Tooltip>` but no `<Legend>`. `CHART_COLORS` maps category names to raw hex colors — none of which are labeled in the chart.

**Impact**: Users cannot identify which pie slice corresponds to which heir group (Legitimate Children vs Surviving Spouse vs Legitimate Ascendants etc). The Tooltip fires on hover but is invisible on mobile (touch users get no legend at all).

---

### GAP-DRC-006 — ComparisonPanel loading and error states are unstyled text (HIGH)

**Current** (`ComparisonPanel.tsx` lines 88–103):
```tsx
// Loading:
<p className="text-muted-foreground">Computing comparison...</p>
// Error:
<p className="text-red-600">Error computing comparison. Please try again.</p>
```

Both are bare `<p>` tags. The loading state has no spinner or skeleton. The error state is inconsistent with the Alert/AlertDescription pattern used by WarningsPanel and ResultsHeader.

---

### GAP-DRC-007 — Mixed-succession and testate-with-dispositions layouts have orphaned subsections (HIGH)

**Current** (`DistributionSection.tsx`):
- `layout === 'mixed-succession'` (lines 274–284): renders "Testate Portion" heading + HeirTable + Separator + "Intestate Remainder" heading — but **nothing follows** the Intestate Remainder heading. Empty stub.
- `layout === 'testate-with-dispositions'` (lines 286–296): renders "Compulsory Shares (Legitime)" heading + HeirTable + Separator + "Free Portion (Testamentary Dispositions)" heading — but **nothing follows** the Free Portion heading. Empty stub.

Both subsections end with heading-only output — no content, no table, no explanation.

---

### GAP-DRC-008 — ComparisonPanel table missing mobile overflow wrapper (HIGH)

**Current** (`ComparisonPanel.tsx` lines 121–154): `<Table>` rendered directly with no overflow wrapper and no `min-w-[...]`. On screens below ~500px, the 5-column table (Heir, Current, Alternative, Delta, %) will overflow and clip. The app will show horizontal scroll at page level (ugly) or cut content.

---

### GAP-DRC-009 — Chart colors are raw hex values not aligned with Navy+Gold palette (MEDIUM)

**Current** (`DistributionSection.tsx` lines 31–37):
```tsx
const CHART_COLORS: Record<string, string> = {
  LegitimateChildGroup: '#3b82f6',      // Tailwind blue-500
  IllegitimateChildGroup: '#a855f7',    // Tailwind purple-500
  SurvivingSpouseGroup: '#22c55e',      // Tailwind green-500
  LegitimateAscendantGroup: '#f97316',  // Tailwind orange-500
  CollateralGroup: '#6b7280',           // Tailwind gray-500
};
```

None of these colors are from the Navy (#1e3a5f) + Gold (#c5a44e) palette. Chart looks mismatched against the professional Navy sidebar.

---

### GAP-DRC-010 — Hardcoded raw Tailwind color classes throughout (MEDIUM)

Across all results components, semantic color intents are expressed as hardcoded Tailwind utilities instead of CSS custom properties:

| File | Hardcoded | Should use |
|------|-----------|-----------|
| `ResultsHeader.tsx` line 30 | `bg-green-100 text-green-800 border-green-200` | CSS vars or semantic token |
| `ResultsHeader.tsx` line 71 | `border-destructive/30 bg-red-50` | `Alert variant="destructive"` |
| `ResultsHeader.tsx` line 82 | `border-blue-200 bg-blue-50 text-blue-800` | `Alert variant="info"` |
| `WarningsPanel.tsx` line 22 | `border-destructive/30 bg-red-50 text-red-800` | CSS vars |
| `WarningsPanel.tsx` line 23 | `border-warning/30 bg-amber-50 text-amber-800` | CSS vars |
| `WarningsPanel.tsx` line 24 | `border-blue-200 bg-blue-50 text-blue-800` | CSS vars |
| `ComputationLog.tsx` line 42 | `border-blue-200 bg-blue-50 text-blue-800 text-blue-700` | CSS vars |
| `DistributionSection.tsx` lines 40–45 | `bg-blue-100 text-blue-800`, `bg-purple-100`, etc. | palette-aligned tokens |
| `DonationsSummaryPanel.tsx` line 24 | `bg-emerald-100 text-emerald-800` | palette-aligned tokens |
| `ShareBreakdownSection.tsx` line 107 | `text-amber-700` | `text-warning` or token |

---

### GAP-DRC-011 — DistributionSection missing section heading (MEDIUM)

**Current** (`DistributionSection.tsx`): Starts directly with `<DistributionChart>` or an `<Alert>`. No `<h2>` heading to anchor the section within the page.

Every other section has a heading: `ResultsHeader` has the estate title, `NarrativePanel` has "Heir Narratives", `WarningsPanel` has "Manual Review Required". DistributionSection has no heading.

---

### GAP-DRC-012 — Results sections are plain divs with no card wrapping (MEDIUM)

**Current** (`ResultsView.tsx`): `<div className="space-y-8">` wrapper — sections are bare `<div>`s flowing in vertical space. No card separation, no visual grouping boundary.

**Modern pattern** (Vercel/Linear): Each major result section is wrapped in a `Card` with `CardHeader` (section title + optional action) and `CardContent`. This creates clear visual groupings and depth hierarchy.

---

### GAP-DRC-013 — NarrativePanel badge uses secondary variant (MEDIUM)

**Current** (`NarrativePanel.tsx` line 76): `<Badge variant="secondary" className="text-xs font-normal">{narrative.heir_category_label}</Badge>`

`variant="secondary"` is a generic gray background. The heir category badge in narratives should use the same palette-aligned category colors as the DistributionSection's CategoryBadge component — or at minimum a styled variant that reads clearly on the accordion background.

---

### GAP-DRC-014 — ComparisonPanel collapse/expand is text-only (LOW)

**Current** (`ComparisonPanel.tsx` lines 111–117): Text-only "Expand" / "Collapse" buttons with `variant="ghost"` — no icon.

Should use `ChevronDown`/`ChevronUp` icons (or `ChevronsUpDown`) alongside text, consistent with the accordion pattern used by ComputationLog.

---

### GAP-DRC-015 — ComparisonPanel idle button is icon-less and unstyled (LOW)

**Current** (`ComparisonPanel.tsx` lines 79–84):
```tsx
<Button onClick={handleCompare}>Compare Scenarios</Button>
```
Default primary button (navy fill) — good for prominence. But missing: `<GitCompare>` or `<ArrowLeftRight>` icon, and no description text explaining what the comparison does.

---

## Modernization Proposals

### MOD-DRC-001: Wire up orphaned components in ResultsView

**File**: `app/src/components/results/ResultsView.tsx`

**Add to imports**:
```tsx
import { ShareBreakdownSection } from './ShareBreakdownSection';
import { ComparisonPanel } from './ComparisonPanel';
import { DonationsSummaryPanel } from './DonationsSummaryPanel';
```

**Add `caseId` to props interface**:
```tsx
export interface ResultsViewProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  caseId?: string;
}

export function ResultsView({ input, output, onEditInput, caseId }: ResultsViewProps) {
```

**Updated return JSX** (replace current `<div className="space-y-8">` body):
```tsx
return (
  <div data-testid="results-view" className="space-y-6">
    <ResultsHeader
      scenarioCode={output.scenario_code}
      successionType={output.succession_type}
      netDistributableEstate={input.net_distributable_estate}
      decedentName={input.decedent.name}
      dateOfDeath={input.decedent.date_of_death}
    />

    <DistributionSection
      shares={output.per_heir_shares}
      totalCentavos={totalCentavos}
      successionType={output.succession_type}
      scenarioCode={output.scenario_code}
      persons={input.family_tree}
    />

    <ShareBreakdownSection shares={output.per_heir_shares} />

    {input.donations && input.donations.length > 0 && (
      <DonationsSummaryPanel
        donations={input.donations}
        persons={input.family_tree}
      />
    )}

    {input.will !== null && (
      <ComparisonPanel input={input} output={output} caseId={caseId} />
    )}

    <NarrativePanel
      narratives={output.narratives}
      decedentName={input.decedent.name}
      dateOfDeath={input.decedent.date_of_death}
    />

    <WarningsPanel
      warnings={output.warnings}
      shares={output.per_heir_shares}
    />

    <ComputationLog log={output.computation_log} />

    <ActionsBar
      input={input}
      output={output}
      onEditInput={onEditInput}
      caseId={caseId}
    />
  </div>
);
```

**Result**: All 4 orphaned components are now rendered. `ShareBreakdownSection` follows the distribution table for drill-down. `DonationsSummaryPanel` appears only when donations exist. `ComparisonPanel` appears only for testate cases. `caseId` flows through to enable DB persistence.

---

### MOD-DRC-002: Add caseId prop to ActionsBar and implement Save/Share

**File**: `app/src/components/results/ActionsBar.tsx`

**Add to imports**:
```tsx
import { Pencil, Download, Copy, Save, Share2, FileText } from 'lucide-react';
import { toast } from 'sonner';
```

**Update interface**:
```tsx
export interface ActionsBarProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  caseId?: string;
}
```

**Add Save handler** (inside component, before return):
```tsx
const handleSave = async () => {
  if (!caseId) {
    toast.error('No case ID — save the case first via New Case wizard');
    return;
  }
  try {
    // useCases.updateCase is called from parent; ActionsBar uses a passed-in callback
    // or calls Supabase directly with the output
    toast.success('Case saved');
  } catch {
    toast.error('Failed to save case');
  }
};
```

**Note**: For Save to function, the parent (WizardContainer or the cases/:id route) must pass `onSave?: () => Promise<void>` into ActionsBar. Update interface to include `onSave?: () => Promise<void>`. The button calls `onSave?.()` wrapped in try/catch with toast feedback.

**Add Share handler**:
```tsx
const handleShare = async () => {
  if (!caseId) {
    toast.error('Case must be saved before sharing');
    return;
  }
  const shareUrl = `${window.location.origin}/share/${caseId}`;
  await navigator.clipboard.writeText(shareUrl);
  toast.success('Share link copied to clipboard');
};
```

**Add PDF handler**:
```tsx
const handlePDF = async () => {
  // @react-pdf/renderer must be installed: npm install @react-pdf/renderer
  // Import lazily to avoid blocking thread
  const { pdf } = await import('@react-pdf/renderer');
  const { EstatePDF } = await import('../pdf/EstatePDF');
  const blob = await pdf(<EstatePDF input={input} output={output} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `estate-${input.decedent.name.replace(/\s+/g, '-')}-${input.decedent.date_of_death}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('PDF downloaded');
};
```

**Updated button group** (replace lines 44–74):
```tsx
return (
  <div data-testid="actions-bar">
    <Separator className="mb-4" />
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <Button type="button" variant="outline" onClick={onEditInput}>
        <Pencil className="size-4" />
        Edit Input
      </Button>
      {caseId && (
        <Button type="button" variant="outline" onClick={onSave}>
          <Save className="size-4" />
          Save
        </Button>
      )}
      {caseId && (
        <Button type="button" variant="outline" onClick={handleShare}>
          <Share2 className="size-4" />
          Share
        </Button>
      )}
      <Button type="button" variant="outline" onClick={handlePDF}>
        <FileText className="size-4" />
        Export PDF
      </Button>
      <Button type="button" variant="outline" onClick={handleExport}>
        <Download className="size-4" />
        Export JSON
      </Button>
      <Button type="button" variant="outline" onClick={handleCopyNarratives}>
        <Copy className="size-4" />
        Copy Narratives
      </Button>
    </div>
  </div>
);
```

**Result**: Save, Share, and PDF Export buttons appear when `caseId` is present. All copy/clipboard actions surface toast feedback. PDF uses lazy import to avoid thread blocking.

---

### MOD-DRC-003: Add toast feedback to all clipboard actions

**File**: `app/src/components/results/NarrativePanel.tsx`

**Add to imports**:
```tsx
import { toast } from 'sonner';
```

**Replace `handleCopyAll`** (lines 45–49):
```tsx
const handleCopyAll = async () => {
  try {
    const header = `Philippine Inheritance Distribution — ${decedentName} (${dateOfDeath})\n\n`;
    const body = narratives.map((n) => stripMarkdownBold(n.text)).join('\n\n');
    await navigator.clipboard.writeText(header + body);
    toast.success('All narratives copied to clipboard');
  } catch {
    toast.error('Failed to copy — check clipboard permissions');
  }
};
```

**File**: `app/src/components/results/ActionsBar.tsx`

**Replace `handleCopyNarratives`** (lines 36–42):
```tsx
const handleCopyNarratives = async () => {
  try {
    const header = `Philippine Inheritance Distribution — ${input.decedent.name} (${input.decedent.date_of_death})\n\n`;
    const body = output.narratives.map((n) => stripMarkdownBold(n.text)).join('\n\n');
    await navigator.clipboard.writeText(header + body);
    toast.success('Narratives copied to clipboard');
  } catch {
    toast.error('Failed to copy — check clipboard permissions');
  }
};
```

**Result**: Both copy buttons show a green success toast on completion or a red error toast on failure. Users have clear confirmation that the copy worked.

---

### MOD-DRC-004: Add PieChart legend and palette-aligned colors

**File**: `app/src/components/results/DistributionSection.tsx`

**Replace raw chart colors** (lines 31–37):
```tsx
// Navy+Gold palette hierarchy for heir groups
const CHART_COLORS: Record<string, string> = {
  LegitimateChildGroup: '#1e3a5f',       // Navy (primary)
  IllegitimateChildGroup: '#4a7fa5',     // Navy-medium-light
  SurvivingSpouseGroup: '#c5a44e',       // Gold (primary)
  LegitimateAscendantGroup: '#a08030',   // Gold-darker
  CollateralGroup: '#7e97b3',            // Navy-muted
};
```

**Update `DistributionChart`** (lines 170–186):
```tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DistributionChart({ chartData }: { chartData: { name: string; value: number; category: string }[] }) {
  if (chartData.length === 0) return null;

  // Build legend data — one entry per category group
  const legendData = [...new Map(
    chartData.map(d => [d.category, { value: d.category.replace('Group', ''), color: CHART_COLORS[d.category] ?? '#6b7280' }])
  ).values()];

  return (
    <div data-testid="distribution-chart" className="mb-6">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={85}
            paddingAngle={2}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={CHART_COLORS[entry.category] ?? '#7e97b3'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatPeso(value)}
            contentStyle={{ borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)' }}
          />
          <Legend
            content={() => (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {legendData.map(item => (
                  <div key={item.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    {item.value}
                  </div>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Result**: Chart uses Navy+Gold derivatives. A custom legend below the chart labels each category group with a color swatch. Tooltip uses CSS vars for consistent card background.

---

### MOD-DRC-005: Fix ComparisonPanel loading and error states

**File**: `app/src/components/results/ComparisonPanel.tsx`

**Replace loading state** (lines 87–93):
```tsx
if (state === 'loading') {
  return (
    <div className="mt-4 space-y-3" aria-busy="true" aria-label="Computing comparison">
      <div className="h-6 w-48 skeleton rounded" />
      <div className="border rounded-lg overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 p-3 border-b last:border-b-0">
            <div className="h-4 skeleton rounded flex-1" />
            <div className="h-4 skeleton rounded w-24" />
            <div className="h-4 skeleton rounded w-24" />
            <div className="h-4 skeleton rounded w-20" />
            <div className="h-4 skeleton rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Replace error state** (lines 95–104):
```tsx
if (state === 'error') {
  return (
    <div className="mt-4">
      <Alert variant="destructive" className="border-destructive/30 bg-red-50">
        <AlertCircle className="size-4" />
        <AlertTitle>Comparison Failed</AlertTitle>
        <AlertDescription>
          Could not compute scenario comparison. This may be a WASM engine error.
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompare}
            className="mt-2 flex items-center gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

**Add to imports**:
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, ArrowLeftRight, ChevronDown, ChevronUp } from 'lucide-react';
```

**Fix mobile overflow** — wrap the table (line 121):
```tsx
<div className="overflow-x-auto">
  <Table className="min-w-[500px]">
    {/* ... unchanged ... */}
  </Table>
</div>
```

**Fix Collapse/Expand button** (line 111):
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => setCollapsed(!collapsed)}
  aria-label={collapsed ? 'Expand comparison' : 'Collapse comparison'}
  className="flex items-center gap-1"
>
  {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
  {collapsed ? 'Expand' : 'Collapse'}
</Button>
```

**Fix idle button** (line 79):
```tsx
if (state === 'idle') {
  return (
    <div className="mt-4">
      <Button variant="outline" onClick={handleCompare} className="flex items-center gap-2">
        <ArrowLeftRight className="size-4" />
        Compare Testate vs Intestate
      </Button>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Run the engine without the will to see how each heir's share would change.
      </p>
    </div>
  );
}
```

**Result**: Loading state shows a skeleton table matching the real layout. Error state uses the Alert component with a Retry button. Mobile overflow is handled. Idle button explains the action. Collapse/expand uses chevron icons.

---

### MOD-DRC-006: Fix mixed-succession and testate-with-dispositions orphaned subsections

**File**: `app/src/components/results/DistributionSection.tsx`

The "Intestate Remainder" and "Free Portion" sections currently end after the heading with no content. Until the intestate remainder shares are available in the output structure, add an explanatory callout instead of a blank heading.

**Replace** `layout === 'mixed-succession'` block (lines 274–284):
```tsx
if (layout === 'mixed-succession') {
  return (
    <div data-testid="distribution-section">
      <h2 className="font-serif text-lg font-semibold text-primary mb-4">Distribution of Estate</h2>
      <DistributionChart chartData={chartData} />
      <h3 className="font-serif text-base font-semibold text-primary mb-3 mt-6">Testate Portion</h3>
      <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
      <Separator className="my-6" />
      <h3 className="font-serif text-base font-semibold text-primary mb-3">Intestate Remainder</h3>
      <Alert className="border-border bg-muted/40 text-foreground">
        <Info className="size-4 text-muted-foreground" />
        <AlertDescription className="text-muted-foreground text-sm">
          The intestate portion follows the same heir distribution above.
          The testate and intestate shares have been consolidated in the table.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

**Replace** `layout === 'testate-with-dispositions'` block (lines 286–296):
```tsx
if (layout === 'testate-with-dispositions') {
  return (
    <div data-testid="distribution-section">
      <h2 className="font-serif text-lg font-semibold text-primary mb-4">Distribution of Estate</h2>
      <DistributionChart chartData={chartData} />
      <h3 className="font-serif text-base font-semibold text-primary mb-3 mt-6">Compulsory Shares (Legitime)</h3>
      <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
      <Separator className="my-6" />
      <h3 className="font-serif text-base font-semibold text-primary mb-3">Free Portion (Testamentary Dispositions)</h3>
      <Alert className="border-border bg-muted/40 text-foreground">
        <Info className="size-4 text-muted-foreground" />
        <AlertDescription className="text-muted-foreground text-sm">
          Testamentary dispositions of the free portion are specified in the will and are not
          computed by the engine. Enter the specific legacies and devises in the case input to
          display them here.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

**Add section headings to all other layouts**. For example, `standard-distribution` (lines 298–304):
```tsx
return (
  <div data-testid="distribution-section">
    <h2 className="font-serif text-lg font-semibold text-primary mb-4">Distribution of Estate</h2>
    <DistributionChart chartData={chartData} />
    <HeirTable ... />
  </div>
);
```

**Result**: No more orphaned headings. Every section layout has a consistent `<h2>` title. The "orphaned" subsections now contain an informative callout explaining the limitation rather than blank space.

---

### MOD-DRC-007: Wrap results sections in Card components

**File**: `app/src/components/results/ResultsView.tsx`

Add Card imports:
```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
```

Wrap each section:
```tsx
return (
  <div data-testid="results-view" className="space-y-6">
    {/* ResultsHeader stays unwrapped — it IS the page header */}
    <ResultsHeader ... />

    <Card>
      <CardContent className="pt-6">
        <DistributionSection ... />
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <ShareBreakdownSection shares={output.per_heir_shares} />
      </CardContent>
    </Card>

    {input.donations && input.donations.length > 0 && (
      <Card>
        <CardContent className="pt-6">
          <DonationsSummaryPanel donations={input.donations} persons={input.family_tree} />
        </CardContent>
      </Card>
    )}

    {input.will !== null && (
      <Card>
        <CardContent className="pt-6">
          <ComparisonPanel input={input} output={output} caseId={caseId} />
        </CardContent>
      </Card>
    )}

    <Card>
      <CardContent className="pt-6">
        <NarrativePanel ... />
      </CardContent>
    </Card>

    {output.warnings.length > 0 && (
      <Card className="border-destructive/20">
        <CardContent className="pt-6">
          <WarningsPanel warnings={output.warnings} shares={output.per_heir_shares} />
        </CardContent>
      </Card>
    )}

    <Card>
      <CardContent className="pt-6">
        <ComputationLog log={output.computation_log} />
      </CardContent>
    </Card>

    <ActionsBar input={input} output={output} onEditInput={onEditInput} caseId={caseId} />
  </div>
);
```

**Note**: `WarningsPanel` is now only rendered when `warnings.length > 0` at the ResultsView level — removes the empty `<div data-testid="warnings-panel" />` antipattern and eliminates an unnecessary DOM node.

**Result**: Each result section has a white card surface with subtle shadow (var(--shadow-sm)) providing depth against the page background. Professional card-based layout consistent with Linear/Vercel patterns.

---

### MOD-DRC-008: Palette-align category badge colors in DistributionSection

**File**: `app/src/components/results/DistributionSection.tsx`

Replace `CATEGORY_BADGE_CLASSES` (lines 39–45) with palette-aligned values that match the chart colors:
```tsx
const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  // Navy tint for legitimate children (largest group)
  LegitimateChildGroup: 'bg-[#e8eef5] text-[#1e3a5f] border-[#1e3a5f]/20',
  // Lighter navy for illegitimate children
  IllegitimateChildGroup: 'bg-[#dce8f0] text-[#2a5d7a] border-[#2a5d7a]/20',
  // Gold tint for surviving spouse (prominence = gold)
  SurvivingSpouseGroup: 'bg-[#fdf6e3] text-[#7d5c00] border-[#c5a44e]/30',
  // Darker gold for ascendants
  LegitimateAscendantGroup: 'bg-[#f5ead0] text-[#6b4e00] border-[#a08030]/30',
  // Muted for collaterals
  CollateralGroup: 'bg-[#edf1f7] text-[#4a6080] border-[#7e97b3]/30',
};
```

**Result**: Badge colors derived from the chart palette. Legitimate children use navy tints, spouse uses gold tints, collaterals use muted blue-gray.

---

## Summary of All Changes

### Files Modified

| File | Changes | Gaps Fixed |
|------|---------|-----------|
| `ResultsView.tsx` | Wire ComparisonPanel, ShareBreakdownSection, DonationsSummaryPanel; add caseId prop; wrap sections in Card | GAP-DRC-001, GAP-DRC-002, GAP-DRC-012 |
| `ActionsBar.tsx` | Add caseId + onSave props; add Save, Share, PDF buttons; add toast feedback | GAP-DRC-002, GAP-DRC-003, JFC-009/011/013 |
| `NarrativePanel.tsx` | Add toast feedback to copy action | GAP-DRC-004 |
| `DistributionSection.tsx` | Palette-align chart colors; add Legend; add section headings; fix orphaned subsections; palette-align badge colors | GAP-DRC-005, GAP-DRC-007, GAP-DRC-009, GAP-DRC-011 |
| `ComparisonPanel.tsx` | Skeleton loading state; Alert error state; mobile overflow; chevron icons; descriptive idle button | GAP-DRC-006, GAP-DRC-008, GAP-DRC-014, GAP-DRC-015 |

### Gaps by Priority

| Priority | Count | IDs |
|----------|-------|-----|
| CRITICAL | 3 | GAP-DRC-001, 002, 003 |
| HIGH | 6 | GAP-DRC-004, 005, 006, 007, 008, 010 |
| MEDIUM | 5 | GAP-DRC-009, 011, 012, 013, 016 |
| LOW | 2 | GAP-DRC-014, 015 |

**Total**: 16 gaps found.

---

## Before / After Visual Summary

### ResultsView — Before
```
┌─────────────────────────────────────────────────────┐
│  Estate of [name]                                   │
│  Date of Death: ...    Philippine Inheritance Dist. │
│  ─────────────────────────────────────────────────  │
│  [S-01] Intestate Succession  |  Total: ₱X,000,000  │
│                                                     │
│  [Raw pie chart — colors unrelated to palette]      │
│  [no legend]                                        │
│                                                     │
│  [heir table]                                       │
│  ─────────────────────────────────────────────────  │
│  Heir Narratives                          [Copy All]│
│  [accordion items]                                  │
│  ─────────────────────────────────────────────────  │
│  Manual Review Required                             │
│  [alert cards]                                      │
│  ─────────────────────────────────────────────────  │
│  Computation Log ▼                                  │
│  ─────────────────────────────────────────────────  │
│  [Edit Input] [Export JSON] [Copy Narratives]       │
│                          ← Save/Share/PDF ABSENT    │
└─────────────────────────────────────────────────────┘
ShareBreakdownSection: NOT SHOWN
ComparisonPanel: NOT SHOWN
DonationsSummaryPanel: NOT SHOWN
```

### ResultsView — After
```
┌─────────────────────────────────────────────────────┐
│  Estate of [name]                                   │
│  Date of Death: ...    Philippine Inheritance Dist. │
│  ─────────────────────────────────────────────────  │
│  [S-01] Intestate Succession  |  Total: ₱X,000,000  │
│                                                     │
│  ┌─ Card ────────────────────────────────────────┐  │
│  │  Distribution of Estate                       │  │
│  │  [Pie chart — Navy/Gold palette with legend]  │  │
│  │  ● Legitimate Children  ● Surviving Spouse    │  │
│  │  [heir table with palette-aligned badges]     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Card ────────────────────────────────────────┐  │
│  │  [Expandable per-heir share breakdown]        │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Card ────────────────────────────────────────┐  │  ← only if donations exist
│  │  Advances on Inheritance (collation table)    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Card ────────────────────────────────────────┐  │  ← only if testate
│  │  [↔ Compare Testate vs Intestate] (idle btn)  │  │
│  │  or: [skeleton loading table]                 │  │
│  │  or: [Alert: error + retry]                   │  │
│  │  or: [comparison table + ⌃ Collapse]         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Card ────────────────────────────────────────┐  │
│  │  Heir Narratives                   [Copy All] │  │
│  │  [accordion — toast on copy success/fail]     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Card (border-destructive/20) ────────────────┐  │  ← only if warnings > 0
│  │  Manual Review Required                       │  │
│  │  [alert cards]                                │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Card ────────────────────────────────────────┐  │
│  │  Computation Log ▼                            │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Edit Input] [Save] [Share] [Export PDF]           │
│  [Export JSON] [Copy Narratives]                    │
│  ← Save/Share/PDF now present (when caseId exists)  │
└─────────────────────────────────────────────────────┘
```
