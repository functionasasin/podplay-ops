# Analysis: design-mobile-responsive
Wave 3 — Mobile/Responsive Audit
Date: 2026-03-04

## Scope
Audit every page at mobile breakpoints (375px / 390px iPhones, 360px Android), document layout
failures, touch-target violations, overflow problems, and missing responsive patterns. Propose
exact fixes for each gap.

The Tailwind breakpoints in use are the defaults: `sm=640px`, `md=768px`. The primary mobile
target is ≤640px (sub-sm), with special attention to 375px and 320px.

---

## Gaps Found: 13 (5 CRITICAL · 4 HIGH · 4 MEDIUM)

---

### GAP-DMR-001 CRITICAL — AppLayout: ghost nav buttons unreadable on navy mobile header
**File**: `components/layout/AppLayout.tsx:62–89`

**Problem**: The mobile header background is `bg-primary` (navy `#1e3a5f`). The nav items use
`variant="ghost"` for inactive items and `variant="secondary"` for the active item. The ghost
variant renders with `text-foreground` (`#0f172a`, dark slate) as default text color on hover,
which is near-invisible against navy. The "ghost" hover state is `bg-accent/10 text-accent-foreground`
which would also render oddly. Primary buttons on primary background produces invisible text.

**Current code** (lines 77–88):
```tsx
<Button
  variant={isActive ? 'secondary' : 'ghost'}
  size="sm"
  className="text-xs gap-1 shrink-0"
>
```

**Fix**: Use `variant="ghost"` but override text color to white/transparent-white for the nav bar
context. Create a `nav-item` variant or use explicit className overrides:
```tsx
<Button
  variant="ghost"
  size="sm"
  className={cn(
    "text-xs gap-1 shrink-0 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10",
    isActive && "bg-white/20 text-primary-foreground font-medium"
  )}
>
```
This ensures both active and inactive items are readable on the navy background.

---

### GAP-DMR-002 CRITICAL — WillStep: 4-tab bar overflows 375px viewport, no overflow-x-auto
**File**: `components/wizard/WillStep.tsx:45–62`

**Problem**: Tab bar is `flex gap-1 border-b border-border` with 4 buttons at `px-4 py-2.5 text-sm`:
- "Institutions": ~120px
- "Legacies": ~80px
- "Devises": ~72px
- "Disinheritances": ~140px
- Gaps (3×4px): 12px
- Total: ~424px

At 375px with `px-4` parent padding (16px each side), available width is 343px. The tab bar
overflows by ~81px. No `overflow-x-auto` on the container means content clips or causes horizontal
page scroll.

**Fix**: Replace the hand-rolled tab bar with the shadcn `<Tabs>` component (already installed per
`package.json`). In `WillStep.tsx`, replace lines 45–101:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Remove: const [activeTab, setActiveTab] = useState<SubTab>('Institutions');

return (
  <div data-testid="will-step" className="space-y-6">
    <h2 className="sr-only">Last Will &amp; Testament</h2>
    <DateInput<EngineInput>
      name={'will.date_executed' as any}
      label="Date Will Was Executed"
      control={control}
    />

    <Tabs defaultValue="Institutions">
      <TabsList className="w-full overflow-x-auto flex">
        {SUB_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="shrink-0 flex-1 text-xs sm:text-sm">
            {tab}
          </TabsTrigger>
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
Result: shadcn TabsList handles overflow gracefully, renders gold active underline via `--accent`,
`flex-1` distributes tabs evenly on wider screens. On 375px, 4 tabs compress to ~85px each = 340px
which fits.

---

### GAP-DMR-003 CRITICAL — EstateTaxWizard: 8 plain buttons overflow mobile, no styling
**File**: `components/tax/EstateTaxWizard.tsx:79–98`

**Problem**: Tab bar `flex gap-2 px-4 py-2 border-b` with 8 plain unstyled `<button>` elements.
Tab labels include "Real Properties" (~120px), "Personal Properties" (~150px) etc. Total row width
≥1000px on a 375px screen. No `overflow-x-auto`. Plain `<button>` with no padding = ~24px height,
far below 44px minimum.

**Fix — tab navigation** (lines 79–98): Replace with overflow-scroll row using `Button` components:
```tsx
<div className="flex overflow-x-auto gap-1 px-4 py-2 border-b scrollbar-hide" role="tablist">
  {TAB_NAMES.map((name, i) => {
    const valid = isTabValid(i as TabIndex, state);
    return (
      <Button
        key={i}
        role="tab"
        aria-selected={activeTab === i}
        data-testid={`tab-${i}`}
        onClick={() => handleTabChange(i as TabIndex)}
        variant={activeTab === i ? 'default' : 'ghost'}
        size="sm"
        className="shrink-0 gap-1 text-xs"
      >
        {valid && <Check className="h-3 w-3" />}
        {name}
      </Button>
    );
  })}
  <span className="ml-auto shrink-0 text-sm text-muted-foreground self-center px-2">
    {activeTab + 1}/{TAB_COUNT}
  </span>
</div>
```

**Fix — header bar** (lines 69–77): Replace plain `<button>` and `<span>` with:
```tsx
<div className="flex items-center gap-3 px-4 py-2 border-b">
  <Button variant="ghost" size="sm" onClick={onBack} data-testid="back-to-inheritance">
    <ChevronLeft className="h-4 w-4" />
    <span className="hidden sm:inline">Back</span>
  </Button>
  <span className="flex-1 text-center text-sm font-medium truncate">
    Estate Tax — <span className="font-semibold">{decedentName}</span>
  </span>
  {saveStatusText && (
    <span data-testid="auto-save-status" className="text-xs text-muted-foreground shrink-0">
      {saveStatusText}
    </span>
  )}
</div>
```

**Fix — back/next buttons** (lines 152–167):
```tsx
<div className="flex justify-between px-4 py-3 border-t">
  <Button variant="outline" onClick={handleBack} disabled={activeTab === 0} data-testid="prev-tab">
    <ChevronLeft className="h-4 w-4" />
    Back
  </Button>
  <Button onClick={handleNext} disabled={activeTab === TAB_COUNT - 1} data-testid="next-tab">
    Next: {TAB_NAMES[activeTab + 1] ?? ''}
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```
Result: Header truncates long decedent names, tab bar scrolls horizontally with 44px-tall buttons,
back/next are proper `Button` components. Add `import { ChevronLeft, ChevronRight, Check } from 'lucide-react'`.

---

### GAP-DMR-004 CRITICAL — ClientList: raw HTML table with no overflow wrapper or styling
**File**: `components/clients/ClientList.tsx:62–86`

**Problem**: `<table data-testid="client-list-table">` has zero Tailwind classes. On 375px, a
4-column table (Name, TIN, Cases, Status) with full text will expand beyond the viewport without
a containing `overflow-x-auto`. Additionally, the search `<input>` and filter `<select>` elements
are raw HTML with no styling — no padding, no border, no responsive layout.

**Fix — controls** (lines 30–58): Replace raw elements with styled shadcn components:
```tsx
<div className="flex flex-col sm:flex-row gap-3 mb-4">
  <Input
    data-testid="client-search"
    type="text"
    placeholder="Search clients by name..."
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    className="flex-1"
  />
  <div className="flex gap-2">
    <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as ClientStatus | 'all')}>
      <SelectTrigger data-testid="client-status-filter" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="former">Former</SelectItem>
      </SelectContent>
    </Select>
    <Select value={sortBy} onValueChange={(v) => onSortChange(v as 'name' | 'intake_date' | 'status')}>
      <SelectTrigger data-testid="client-sort" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name">Name A–Z</SelectItem>
        <SelectItem value="intake_date">Intake Date</SelectItem>
        <SelectItem value="status">Status</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

**Fix — table** (lines 60–88): Replace raw `<table>` with shadcn Table inside overflow wrapper:
```tsx
{loading && (
  <div className="flex items-center gap-2 py-4 text-muted-foreground" data-testid="client-list-loading">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span className="text-sm">Loading clients...</span>
  </div>
)}

<div className="overflow-x-auto">
  <Table data-testid="client-list-table" className="min-w-[500px]">
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>TIN</TableHead>
        <TableHead className="text-right">Cases</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {clients.map((client) => (
        <TableRow
          key={client.id}
          data-testid={`client-row-${client.id}`}
          onClick={() => onClientClick(client.id)}
          className="cursor-pointer hover:bg-muted/50"
        >
          <TableCell data-testid="client-name" className="font-medium">{client.full_name}</TableCell>
          <TableCell data-testid="client-tin" className="font-mono text-sm">{client.tin ? maskTIN(client.tin) : '—'}</TableCell>
          <TableCell data-testid="client-case-count" className="text-right">{client.case_count}</TableCell>
          <TableCell data-testid="client-status">
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="capitalize">
              {client.status}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```
Add imports: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'`, `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'`, `import { Badge } from '@/components/ui/badge'`, `import { Input } from '@/components/ui/input'`, `import { Loader2 } from 'lucide-react'`.

---

### GAP-DMR-005 CRITICAL — FamilyTreeTab: hardcoded translate x=400 renders tree off-screen on mobile
**File**: `components/results/visualizer/FamilyTreeTab.tsx:94`

**Problem**: `translate={{ x: 400, y: 50 }}` hardcodes the tree center at x=400px. On a 375px
viewport (with padding, container is ~343px wide), the tree root starts at x=400 — off the right
edge. The user sees only branches with no root, with no indication the tree exists.

Also, zoom/download control buttons use `px-3 py-1` (≈38px height) below the 44px minimum.

**Fix — responsive translate** (lines 23–35): Use a ResizeObserver or containerRef size:
```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver(([entry]) => {
    setDimensions({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    });
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);
```
Then pass `translate={{ x: dimensions.width / 2, y: 50 }}` to the `<Tree>` component. This
centers the tree root regardless of viewport width.

**Fix — container height** (line 87): Make height responsive:
```tsx
className="w-full border rounded-lg overflow-hidden"
style={{ height: 'clamp(300px, 50vh, 600px)' }}
```

**Fix — control buttons** (lines 53–80): Replace raw `<button>` with `<Button>`:
```tsx
<Button variant="outline" size="sm" onClick={handleZoomOut} aria-label="Zoom out">−</Button>
<Button variant="outline" size="sm" onClick={handleZoomIn} aria-label="Zoom in">+</Button>
<Button variant="outline" size="sm" onClick={handleFitToScreen} aria-label="Fit to screen">
  Fit
</Button>
<Button variant="outline" size="sm" onClick={handleDownloadSVG}>
  <Download className="h-3 w-3 mr-1" />
  <span className="hidden sm:inline">Download SVG</span>
  <span className="sm:hidden">SVG</span>
</Button>
```
Add `import { Download } from 'lucide-react'` and `import { Button } from '@/components/ui/button'`.

---

### GAP-DMR-006 HIGH — AppLayout: mobile nav touch targets below 44px minimum
**File**: `components/layout/AppLayout.tsx:77–88`

**Problem**: Nav buttons use `size="sm"` which produces `h-9` (36px height). WCAG 2.5.5 and
Apple HIG recommend minimum 44×44px touch targets. On the mobile nav bar, 5 buttons at 36px height
create mis-tap risk, especially while scrolling.

**Fix**: In the mobile nav, use `size="sm"` but add `min-h-[44px]` to override:
```tsx
<Button
  variant="ghost"
  size="sm"
  className={cn(
    "text-xs gap-1 shrink-0 min-h-[44px] text-primary-foreground/80",
    "hover:text-primary-foreground hover:bg-white/10",
    isActive && "bg-white/20 text-primary-foreground font-medium"
  )}
>
```
This preserves the compact visual size while expanding the touch target to 44px. Note this is
combined with the fix from GAP-DMR-001 (color contrast).

---

### GAP-DMR-007 HIGH — TeamMemberList: email addresses overflow flex row, dropdown off-screen risk
**File**: `components/settings/TeamMemberList.tsx:36–45`

**Problem**: Member row `flex items-center justify-between py-2 border-b` has a `flex-1` div
containing `<span className="font-medium">{name}</span>` and `<span className="text-sm... ml-2">{email}</span>`
inline. The flex-1 div has no `min-w-0`, so long emails like `juan.delacruz@fernandez-law.com.ph`
expand the left column beyond viewport width.

Also, the action dropdown is `absolute right-0` — on screens where the button is near the left
edge of the viewport, `right-0` positions the dropdown to the right of the button, potentially
clipping off-screen if the member list is in a left-side layout.

**Fix — member row** (lines 36–79): Add `min-w-0` and truncate email:
```tsx
<div key={member.id} data-testid="member-row"
     className="flex items-center gap-3 py-3 sm:py-2 border-b">
  <div className="flex-1 min-w-0">
    <p className="font-medium text-sm truncate">
      {profile?.full_name ?? member.user_id.slice(0, 8) + '...'}
    </p>
    {profile?.email && (
      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
    )}
  </div>
  <Badge variant="secondary" className="shrink-0 capitalize">{member.role}</Badge>
  {isAdmin && !isSelf && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" aria-label="Member actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRemoveMember(member.id)}
        >
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}
</div>
```
Add imports: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'`, `import { MoreHorizontal } from 'lucide-react'`.

---

### GAP-DMR-008 HIGH — GuidedIntakeForm: 7-step indicator may overflow 320px screens
**File**: `components/intake/GuidedIntakeForm.tsx:207–237`

**Problem**: Step indicator row `flex items-center gap-1` renders 7 step buttons + 6 connector
divs (each `w-4`). On mobile, step labels are `hidden sm:inline`, so only numbers show. Each
number button is `px-2 py-1` + number = ~32–36px. Total: 7×36 + 6×16 = 252 + 96 = 348px.
On a 320px screen with padding (16px each side = 288px available), this overflows by 60px.

**Fix** (line 207): Add `overflow-x-auto` + `shrink-0` on step items:
```tsx
<div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
  {INTAKE_STEPS.map((stepName, i) => (
    <div key={stepName} className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors min-h-[36px] shrink-0",
          i === currentStep
            ? 'bg-primary text-primary-foreground'
            : i < currentStep && isStepComplete(state, i)
              ? 'bg-green-100 text-green-800'
              : 'bg-muted text-muted-foreground'
        )}
        onClick={() => { if (i <= currentStep) setState((prev) => ({ ...prev, currentStep: i })); }}
        disabled={i > currentStep}
      >
        {i < currentStep && isStepComplete(state, i) ? <Check className="h-3 w-3" /> : i + 1}
        <span className="hidden sm:inline">{stepName}</span>
      </button>
      {i < INTAKE_STEP_COUNT - 1 && (
        <div className={cn("h-0.5 w-4 shrink-0", i < currentStep ? 'bg-primary' : 'bg-muted')} />
      )}
    </div>
  ))}
</div>
```
Also add `import { cn } from '@/lib/utils'` if not already imported, and `import { Check } from 'lucide-react'`.

---

### GAP-DMR-009 MEDIUM — AppLayout: mobile header takes ~130px, compresses main content area
**File**: `components/layout/AppLayout.tsx:61–90`

**Problem**: The mobile header renders as:
1. Title row: `px-4 py-3` ≈ 58px
2. Gold separator: 2px
3. Nav tab bar: `py-1.5` ≈ 44px

Total: ~104px of header before main content. On a 667px iPhone SE (375×667), this leaves 563px
for content. On a 568px short screen, only 464px. More critically, when keyboard opens (reduces
viewport to ~300–350px on many Androids), the main content area becomes unusably small.

**Fix** (partially overlaps with GAP-DMR-001): Replace multi-row mobile header with single-row
header + hamburger menu (as specified in design-layout-nav MOD-DLN-006). The result:
- Header: 1 row, ~56px — saves ~50px vs current.
- Nav: In a `Sheet` overlay that doesn't consume viewport height.

Until the Sheet migration is done, a quick win is reducing the title padding:
```tsx
<div className="px-4 py-2 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Scale className="h-4 w-4 text-primary-foreground" />
    <span className="text-sm font-bold tracking-tight font-serif">Inheritance</span>
  </div>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-primary-foreground md:hidden" aria-label="Menu">
    <Menu className="h-5 w-5" />
  </Button>
</div>
```
This reduces the header to a single ~42px row. Full hamburger+Sheet implementation is in
design-layout-nav MOD-DLN-006.

---

### GAP-DMR-010 MEDIUM — WizardContainer: no intrinsic horizontal padding (fragile reliance on parent)
**File**: `components/wizard/WizardContainer.tsx:182`

**Problem**: `<div className="max-w-2xl mx-auto">` has no `px-` classes. Horizontal padding comes
entirely from the parent `CasesNewPage` (`px-4 sm:px-6`). If WizardContainer is ever rendered
outside a padded parent — e.g., in a future modal or a different route — content will touch screen
edges.

**Fix**: Add padding directly to WizardContainer so it's self-contained:
```tsx
<div data-testid="wizard-container" className="max-w-2xl mx-auto px-0">
  {/* px-0 on container: parent route already adds px-4 sm:px-6.
      No change needed currently, but document the dependency: */}
  {/* Parent MUST provide horizontal padding. See: routes/cases/new.tsx:44 */}
```
OR (safer): Add padding to the WizardContainer itself and remove from the route:
```tsx
// WizardContainer.tsx:182 — change:
<div data-testid="wizard-container" className="max-w-2xl mx-auto px-4 sm:px-6">

// routes/cases/new.tsx:44 — remove px-4 sm:px-6 from parent since wizard now owns it:
<div className="max-w-3xl mx-auto py-6 sm:py-8">
```
Preferred option: keep padding on the route page (`CasesNewPage`) — that's the right boundary.
Add an explicit comment in WizardContainer documenting the dependency.

---

### GAP-DMR-011 MEDIUM — ReviewStep: summary cards use flex layout that wraps poorly on mobile
**File**: `components/wizard/ReviewStep.tsx` (inferred from prior analysis)

**Problem**: From design-wizard-components analysis (GAP-DWC-017), ReviewStep has sparse summary
cards. The layout uses inline flex rows for key-value pairs. On mobile, pairs like
"Net Distributable Estate: ₱1,500,000.00" need to stack or the value must truncate.

**Fix**: Use a definition-list pattern in summary cards:
```tsx
// For each review section in ReviewStep, replace:
<div className="flex justify-between">
  <span>{label}</span>
  <span>{value}</span>
</div>
// With:
<div className="flex justify-between gap-4 flex-wrap sm:flex-nowrap">
  <span className="text-sm text-muted-foreground shrink-0">{label}</span>
  <span className="text-sm font-medium text-right">{value}</span>
</div>
```
This wraps only when truly necessary. For monetary values (formatted Peso amounts), ensure
`text-right` so amounts right-align.

---

### GAP-DMR-012 MEDIUM — InviteMemberDialog: raw HTML in a div, not a real dialog
**File**: `components/settings/InviteMemberDialog.tsx`
(from catalog-components: "unstyled buttons, raw HTML form, no Dialog component")

**Problem**: InviteMemberDialog is not using the shadcn `Dialog` component. On mobile, a raw HTML
form that appears inline (or as a positioned div) has no overlay, no focus trap, and can be
obscured by the mobile keyboard when the email input focuses.

**Fix**: Wrap the form in shadcn `<Dialog>`:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function InviteMemberDialog({ open, onClose, onInvite, loading }: InviteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Invite Team Member</DialogTitle>
          <DialogDescription>Send an invitation email to add someone to your organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={...} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input id="invite-email" type="email" required placeholder="colleague@firm.com" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select ...>...</Select>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```
The `DialogContent` handles mobile: centers with padding, constrains width, keeps visible above keyboard.

---

## Summary Table

| Gap | Severity | Component | Issue | Fix |
|-----|----------|-----------|-------|-----|
| GAP-DMR-001 | CRITICAL | AppLayout | Ghost button text invisible on navy | White text + bg-white/20 active |
| GAP-DMR-002 | CRITICAL | WillStep | 4-tab bar overflows 375px | Replace with shadcn Tabs |
| GAP-DMR-003 | CRITICAL | EstateTaxWizard | 8 plain buttons overflow, unstyled | overflow-x-auto + Button components |
| GAP-DMR-004 | CRITICAL | ClientList | Raw HTML table, no overflow wrapper | shadcn Table + overflow-x-auto |
| GAP-DMR-005 | CRITICAL | FamilyTreeTab | translate x=400 off-screen on mobile | ResizeObserver-driven translate |
| GAP-DMR-006 | HIGH | AppLayout | Touch targets 36px < 44px min | min-h-[44px] on nav buttons |
| GAP-DMR-007 | HIGH | TeamMemberList | Email overflow, dropdown off-screen | min-w-0 + truncate + DropdownMenu |
| GAP-DMR-008 | HIGH | GuidedIntakeForm | 7-step indicator overflows 320px | overflow-x-auto + shrink-0 |
| GAP-DMR-009 | MEDIUM | AppLayout | 104px mobile header wastes viewport | Single-row header + Sheet nav |
| GAP-DMR-010 | MEDIUM | WizardContainer | Padding from parent only (fragile) | Document dependency or add intrinsic px |
| GAP-DMR-011 | MEDIUM | ReviewStep | flex rows wrap badly on mobile | flex-wrap + text-right values |
| GAP-DMR-012 | MEDIUM | InviteMemberDialog | Raw div, not Dialog | shadcn Dialog with DialogContent |

---

## Pages With Passing Mobile Layout (no fix needed)

| Page / Component | Status | Notes |
|-----------------|--------|-------|
| `routes/index.tsx` DashboardPage | PASS | `max-w-md mx-auto py-16 px-4` ✓, `flex flex-col gap-3` ✓ |
| `routes/auth.tsx` AuthPage | PASS | `max-w-md mx-auto py-12 px-4` ✓, full-width button ✓ |
| `routes/deadlines.tsx` DeadlinesPage | PASS | `px-4 sm:px-6` ✓, deadline cards `min-w-0 flex-1` ✓ |
| `routes/settings/index.tsx` | PASS | `px-4 sm:px-6` ✓, `grid cols-1 md:cols-2` on form ✓ |
| `routes/share/$token.tsx` | PASS | `px-4 sm:px-6` ✓, Card adapts ✓ |
| `routes/cases/new.tsx` | PASS | `px-4 sm:px-6` ✓, wizard inside padded container ✓ |
| `components/results/ActionsBar` | PASS | `flex-col sm:flex-row` ✓ |
| `components/results/ResultsHeader` | PASS | `flex-wrap items-center` ✓, responsive text sizes ✓ |
| `components/results/DistributionSection` HeirTable | PASS | `overflow-x-auto` + `min-w-[600px]` ✓ |
| `components/wizard/WizardContainer` step nav | PASS | `overflow-x-auto pb-2` ✓, labels `hidden sm:inline` ✓ |
| `components/settings/FirmProfileForm` | PASS | `grid cols-1 md:cols-2` ✓ |
