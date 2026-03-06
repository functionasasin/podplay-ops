# Analysis: Results View — RA 7641 Retirement Pay Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** results-view
**Date:** 2026-03-06
**Sources:** typescript-types.md, wizard-steps.md, computation-pipeline.md, nlrc-worksheet-ui.md, company-plan-ui.md

---

## Overview

The results view displays a `RetirementOutput` after the wizard completes. It lives at route
`/compute/$id/results` and is rendered by `ComputationResultsPage`. The page is also used for
read-only shared links at `/share/$token` — the same component tree with share-mode = true (no
edit/delete actions).

The results view is the core product experience. It must make the 22.5-day vs 15-day underpayment
immediately visible and viscerally clear. Every section maps directly to a field or sub-struct of
`RetirementOutput`.

---

## 1. Page Layout

**File:** `apps/retirement-pay/frontend/src/pages/compute/[id]/results.tsx`
**Route:** `/compute/$id/results`
**Auth required:** yes (redirect to `/auth` if unauthenticated; `/share/$token` is public)

```tsx
// Component: ComputationResultsPage
// Parent: root layout with sidebar
// Props source: useComputation(id) hook → fetches saved ComputationRecord from Supabase
//               then deserializes output: RetirementOutput

export function ComputationResultsPage() {
  const { id } = useParams({ from: "/compute/$id/results" });
  const { computation, isLoading, error } = useComputation(id);

  if (isLoading) return <ResultsPageSkeleton />;
  if (error || !computation?.output) return <ErrorState message="Computation not found" />;

  const output = computation.output as RetirementOutput;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <ResultsPageHeader computation={computation} output={output} />
      <EligibilityBadgeCard eligibility={output.eligibility} retirementType={computation.input.retirementType} />
      <UnderpaymentHighlightCard output={output} />
      <PayBreakdownCard output={output} />
      <TaxTreatmentAlert output={output} />
      <SeparationPayComparisonCard output={output} />
      <CompanyPlanComparisonCard output={output} />
      <ResultsActionsRow computationId={id} output={output} />
    </div>
  );
}
```

---

## 2. Component: `ResultsPageHeader`

**File:** `apps/retirement-pay/frontend/src/components/results/ResultsPageHeader.tsx`
**Parent:** `ComputationResultsPage`
**Props:**
- `computation: ComputationRecord`
- `output: RetirementOutput`

**Purpose:** Shows employee name, company, retirement date, and top-level action buttons
(Edit, Share, Export PDF, View NLRC Worksheet).

```tsx
// Renders: page title + subtitle + action row
// shadcn: no wrapper Card (header sits above cards)
// Tailwind: flex items-start justify-between gap-4 mb-2
// Icon: lucide FileText for page title area

export function ResultsPageHeader({
  computation,
  output,
}: {
  computation: ComputationRecord;
  output: RetirementOutput;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{output.employeeName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {output.companyName} · Retired{" "}
          {formatDate((computation.input as RetirementInput).retirementDate)}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {/* Edit button — navigates to /compute/$id/edit */}
        <Button variant="outline" size="sm" asChild>
          <Link to="/compute/$id/edit" params={{ id: computation.id }}>
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Link>
        </Button>
        {/* Share button — opens ShareDialog */}
        <ShareButton computationId={computation.id} status={computation.status} />
        {/* PDF export button — triggers usePdfExport(output) */}
        <PdfExportButton output={output} employeeName={output.employeeName} />
      </div>
    </div>
  );
}
```

---

## 3. Component: `EligibilityBadgeCard`

**File:** `apps/retirement-pay/frontend/src/components/results/EligibilityBadgeCard.tsx`
**Parent:** `ComputationResultsPage`
**Props:**
- `eligibility: EligibilityResult`
- `retirementType: RetirementType`

**Purpose:** Shows eligibility status prominently. Green checkmark for eligible,
red X for ineligible, yellow warning for eligible with warnings.

**Ineligible rendering:** If status is `"ineligible"`, show the ineligibility reasons
as a list (map `IneligibilityReason` enum values to human-readable labels).

```tsx
// shadcn wrapper: Card > CardHeader + CardContent
// Tailwind: border-l-4 (green: border-green-500, yellow: border-yellow-500, red: border-red-500)
// Icon: lucide CheckCircle2 (green), AlertTriangle (yellow), XCircle (red)
// Badge variant: "default" (green), "secondary" (yellow), "destructive" (red)

const ELIGIBILITY_LABELS: Record<EligibilityStatus, { label: string; icon: LucideIcon; badgeVariant: string; borderColor: string }> = {
  eligible: { label: "Eligible for Retirement Pay", icon: CheckCircle2, badgeVariant: "default", borderColor: "border-green-500" },
  eligibleWithWarnings: { label: "Eligible (with warnings)", icon: AlertTriangle, badgeVariant: "secondary", borderColor: "border-yellow-500" },
  ineligible: { label: "Not Eligible for Retirement Pay", icon: XCircle, badgeVariant: "destructive", borderColor: "border-red-500" },
};

const INELIGIBILITY_REASON_LABELS: Record<IneligibilityReason, string> = {
  ageTooYoung: "Employee has not reached minimum retirement age (60 for optional, 65 for compulsory)",
  serviceTooShort: "Employee has fewer than 5 years of credited service",
  employerTooSmall: "Employer has 10 or fewer employees (RA 7641 does not apply)",
  alreadyReceivedBenefit: "Employee has already received retirement benefit from the same employer",
};

export function EligibilityBadgeCard({
  eligibility,
  retirementType,
}: {
  eligibility: EligibilityResult;
  retirementType: RetirementType;
}) {
  const config = ELIGIBILITY_LABELS[eligibility.status];
  const Icon = config.icon;

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <CardTitle className="text-base">{config.label}</CardTitle>
          <Badge variant={config.badgeVariant as BadgeProps["variant"]}>
            {retirementType === "optional" ? "Optional (Age 60+)" :
             retirementType === "compulsory" ? "Compulsory (Age 65)" :
             "Death (Heirs)"}
          </Badge>
        </div>
      </CardHeader>
      {(eligibility.reasons.length > 0 || eligibility.warnings.length > 0) && (
        <CardContent>
          {eligibility.reasons.map((r) => (
            <p key={r} className="text-sm text-red-700">{INELIGIBILITY_REASON_LABELS[r]}</p>
          ))}
          {eligibility.warnings.map((w, i) => (
            <p key={i} className="text-sm text-yellow-700">{w}</p>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
```

---

## 4. Component: `UnderpaymentHighlightCard` (Core Value Prop)

**File:** `apps/retirement-pay/frontend/src/components/results/UnderpaymentHighlightCard.tsx`
**Parent:** `ComputationResultsPage`
**Props:** `output: RetirementOutput`

**Purpose:** The headline card. Shows the 22.5-day correct amount vs the 15-day erroneous
amount side-by-side. This is the core product value — the underpayment the employee was owed.

**Visual design:** Two-column comparison. Left: "What you're owed (22.5 days)" in green.
Right: "Common employer calculation (15 days)" in gray with strikethrough styling.
Below: a large highlighted underpayment amount in amber/orange.

```tsx
// shadcn wrapper: Card with className="bg-amber-50 border-amber-200"
// Tailwind: grid grid-cols-2 gap-4 for the comparison columns
// Icon: lucide TrendingUp for the correct amount, AlertTriangle for underpayment amount

export function UnderpaymentHighlightCard({ output }: { output: RetirementOutput }) {
  const underpayment = output.correctMinusErroneousCentavos;
  const correctPct = underpayment > 0
    ? Math.round((underpayment / output.erroneous15DayPayCentavos) * 100)
    : 0;

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-700" />
          Retirement Pay Comparison: 22.5 Days vs. 15 Days
        </CardTitle>
        <CardDescription className="text-amber-800 text-xs">
          RA 7641 defines "one-half month salary" as 22.5 days, not 15 days.
          Many employers use 15 days, underpaying every retiree.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Correct 22.5-day amount */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-xs font-medium text-green-700 mb-1">Correct (22.5 days)</p>
            <p className="text-2xl font-bold text-green-800">
              {formatCentavos(output.retirementPayCentavos)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {output.creditedYearsRounded} credited years
            </p>
          </div>
          {/* Erroneous 15-day amount */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-75">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Common Employer Calculation (15 days)
            </p>
            <p className="text-2xl font-bold text-gray-400 line-through">
              {formatCentavos(output.erroneous15DayPayCentavos)}
            </p>
            <p className="text-xs text-red-500 mt-1">Underpayment by {correctPct}%</p>
          </div>
        </div>
        {/* Underpayment highlight */}
        {underpayment > 0 && (
          <div className="bg-amber-100 rounded-lg p-3 flex items-center justify-between border border-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span className="text-sm font-medium text-amber-900">
                Potential underpayment to recover:
              </span>
            </div>
            <span className="text-lg font-bold text-amber-900">
              {formatCentavos(underpayment)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 5. Component: `PayBreakdownCard`

**File:** `apps/retirement-pay/frontend/src/components/results/PayBreakdownCard.tsx`
**Parent:** `ComputationResultsPage`
**Props:** `output: RetirementOutput`

**Purpose:** Shows the step-by-step arithmetic behind the retirement pay computation.
Maps to the pipeline steps in `ComputationBreakdown`.

**Layout:** Accordion or always-expanded table with labeled rows.

```tsx
// shadcn wrapper: Card > CardHeader + CardContent
// shadcn Table inside CardContent for the breakdown rows
// Icon: lucide Calculator in CardHeader
// Tailwind: text-right on amount cells, font-mono for numbers

export function PayBreakdownCard({ output }: { output: RetirementOutput }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Computation Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {/* Service years */}
            <TableRow>
              <TableCell className="text-sm text-gray-600">Years of service</TableCell>
              <TableCell className="text-right text-sm">
                {output.creditedYearsWhole} yrs {output.creditedYearsMonths} mo
                {output.creditedYearsMonths >= 6 && (
                  <span className="ml-1 text-xs text-blue-600">(rounds up to {output.creditedYearsRounded} yrs)</span>
                )}
                {output.creditedYearsMonths > 0 && output.creditedYearsMonths < 6 && (
                  <span className="ml-1 text-xs text-gray-400">(rounds down to {output.creditedYearsRounded} yrs)</span>
                )}
              </TableCell>
            </TableRow>
            {/* Daily rate */}
            <TableRow>
              <TableCell className="text-sm text-gray-600">Daily rate (basic salary ÷ 26)</TableCell>
              <TableCell className="text-right text-sm font-mono">
                {formatCentavos(output.dailyRateCentavos)}
              </TableCell>
            </TableRow>
            {/* 15-day component */}
            <TableRow>
              <TableCell className="text-sm text-gray-600 pl-6">15 days salary</TableCell>
              <TableCell className="text-right text-sm font-mono">
                {formatCentavos(output.fifteenDaysPayCentavos)}
              </TableCell>
            </TableRow>
            {/* SIL component */}
            <TableRow>
              <TableCell className="text-sm text-gray-600 pl-6">Service Incentive Leave (5 days)</TableCell>
              <TableCell className="text-right text-sm font-mono">
                {formatCentavos(output.silPayCentavos)}
              </TableCell>
            </TableRow>
            {/* 13th month component */}
            <TableRow>
              <TableCell className="text-sm text-gray-600 pl-6">1/12 of 13th month pay</TableCell>
              <TableCell className="text-right text-sm font-mono">
                {formatCentavos(output.thirteenthMonthPayCentavos)}
              </TableCell>
            </TableRow>
            {/* Total half-month */}
            <TableRow className="border-t-2">
              <TableCell className="text-sm font-medium">
                Total "half-month salary" (22.5 days equivalent)
              </TableCell>
              <TableCell className="text-right text-sm font-mono font-medium">
                {formatCentavos(output.totalHalfMonthCentavos)}
              </TableCell>
            </TableRow>
            {/* Multiplier */}
            <TableRow>
              <TableCell className="text-sm text-gray-600">× credited years of service</TableCell>
              <TableCell className="text-right text-sm font-mono">× {output.creditedYearsRounded}</TableCell>
            </TableRow>
            {/* Final result */}
            <TableRow className="border-t-2 bg-green-50">
              <TableCell className="text-base font-bold text-green-800">
                Statutory Retirement Pay
              </TableCell>
              <TableCell className="text-right text-base font-bold font-mono text-green-800">
                {formatCentavos(output.retirementPayCentavos)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

## 6. Component: `TaxTreatmentAlert`

**File:** `apps/retirement-pay/frontend/src/components/results/TaxTreatmentAlert.tsx`
**Parent:** `ComputationResultsPage`
**Props:** `output: RetirementOutput`

**Purpose:** Show tax treatment status (fully exempt / partially exempt / fully taxable)
and the conditions that were/weren't met.

**Conditional visibility:** Always shown. The variant changes based on `taxTreatment`.

```tsx
// shadcn wrapper: Alert with variant "default" (green border) or "destructive" (red)
// Icon: lucide ShieldCheck (exempt), ShieldAlert (partially), ShieldX (taxable)
// Tailwind: for fully exempt use className="border-green-500 bg-green-50 text-green-800"

const TAX_CONFIG = {
  fullyExempt: {
    icon: ShieldCheck,
    title: "Fully Tax-Exempt",
    description: "This retirement pay is exempt from income tax under NIRC Sec. 32(B)(6)(a).",
    className: "border-green-500 bg-green-50",
  },
  partiallyExempt: {
    icon: ShieldAlert,
    title: "Partially Tax-Exempt",
    description: "Part of this retirement pay may be subject to income tax. Consult a tax professional.",
    className: "border-yellow-500 bg-yellow-50",
  },
  fullyTaxable: {
    icon: ShieldX,
    title: "Subject to Income Tax",
    description: "This retirement pay does not qualify for tax exemption under current BIR rules.",
    className: "border-red-500 bg-red-50",
  },
};

export function TaxTreatmentAlert({ output }: { output: RetirementOutput }) {
  const config = TAX_CONFIG[output.taxTreatment];
  const Icon = config.icon;

  return (
    <Alert className={config.className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription>
        <p>{config.description}</p>
        {output.taxTreatment !== "fullyExempt" && output.taxableAmountCentavos > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <span>Taxable amount:</span>
            <span className="font-mono font-medium text-right">
              {formatCentavos(output.taxableAmountCentavos)}
            </span>
            <span>Tax-exempt amount:</span>
            <span className="font-mono font-medium text-right">
              {formatCentavos(output.exemptAmountCentavos)}
            </span>
          </div>
        )}
        {output.taxTreatment === "fullyExempt" && (
          <p className="text-xs mt-1 text-green-700">
            Conditions met: Age ≥ 50, service ≥ 10 years, first-time benefit, BIR-approved plan.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

---

## 7. Component: `SeparationPayComparisonCard`

**File:** `apps/retirement-pay/frontend/src/components/results/SeparationPayComparisonCard.tsx`
**Parent:** `ComputationResultsPage`
**Props:** `output: RetirementOutput`

**Purpose:** If `separationPayComparison.separationPayBasis !== "notApplicable"`, show the
Art. 298 separation pay vs. retirement pay comparison and recommend which is higher.

**Conditional visibility:** Hidden when `separationPayBasis === "notApplicable"`.

```tsx
// shadcn wrapper: Card > CardHeader + CardContent
// shadcn Table for the side-by-side comparison
// Icon: lucide Scale for the comparison header
// Badge showing "Recommended" on the higher amount's row

export function SeparationPayComparisonCard({ output }: { output: RetirementOutput }) {
  const comp = output.separationPayComparison;

  if (comp.separationPayBasis === "notApplicable" || comp.separationPayCentavos === null) {
    return null; // hidden when no separation pay context
  }

  const BASIS_LABELS: Record<SeparationPayBasis, string> = {
    authorizedCause: "Authorized Cause (Art. 298)",
    retrenchment: "Retrenchment (Art. 298)",
    redundancy: "Redundancy (Art. 298)",
    closure: "Closure/Cessation (Art. 298)",
    disease: "Disease (Art. 299)",
    notApplicable: "",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Separation Pay vs. Retirement Pay
        </CardTitle>
        <CardDescription>
          {BASIS_LABELS[comp.separationPayBasis]} — employee receives whichever is higher.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benefit</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Recommended</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className={comp.retirementPayIsHigher ? "bg-green-50" : ""}>
              <TableCell className="text-sm">Retirement Pay (RA 7641)</TableCell>
              <TableCell className="text-right text-sm font-mono">
                {formatCentavos(output.retirementPayCentavos)}
              </TableCell>
              <TableCell className="text-right">
                {comp.retirementPayIsHigher && (
                  <Badge variant="default" className="text-xs">Higher</Badge>
                )}
              </TableCell>
            </TableRow>
            <TableRow className={comp.retirementPayIsHigher === false ? "bg-green-50" : ""}>
              <TableCell className="text-sm">Separation Pay (Labor Code)</TableCell>
              <TableCell className="text-right text-sm font-mono">
                {formatCentavos(comp.separationPayCentavos)}
              </TableCell>
              <TableCell className="text-right">
                {comp.retirementPayIsHigher === false && (
                  <Badge variant="default" className="text-xs">Higher</Badge>
                )}
              </TableCell>
            </TableRow>
            {comp.recommendedBenefitCentavos !== null && (
              <TableRow className="border-t-2 font-medium">
                <TableCell className="text-sm font-medium">Recommended Benefit</TableCell>
                <TableCell className="text-right text-sm font-mono font-bold">
                  {formatCentavos(comp.recommendedBenefitCentavos)}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

## 8. Component: `CompanyPlanComparisonCard`

**File:** `apps/retirement-pay/frontend/src/components/results/CompanyPlanComparisonCard.tsx`
**Parent:** `ComputationResultsPage`
**Props:** `output: RetirementOutput`

**Purpose:** If the employee has a company plan, show statutory minimum vs. company plan
amount and whether the company plan is sufficient.

**Conditional visibility:** Hidden when `companyPlanComparison.companyPlanType === "none"` or
`companyPlanAmountCentavos === null`.

```tsx
// shadcn wrapper: Card > CardHeader + CardContent
// shadcn Alert inside CardContent when gap > 0 (company plan insufficient)
// Icon: lucide Building2 in CardHeader
// Color: green card border if sufficient, red if gap > 0

export function CompanyPlanComparisonCard({ output }: { output: RetirementOutput }) {
  const comp = output.companyPlanComparison;

  if (comp.companyPlanType === "none" || comp.companyPlanAmountCentavos === null) {
    return null;
  }

  const isSufficient = comp.companyPlanIsSufficient === true;
  const gap = comp.gapCentavos;

  return (
    <Card className={isSufficient ? "border-green-300" : "border-red-300"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Company Retirement Plan vs. Statutory Minimum
        </CardTitle>
        <CardDescription>
          {comp.companyPlanType === "definedBenefit" ? "Defined Benefit Plan" : "Defined Contribution Plan"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Statutory Minimum (RA 7641)</p>
            <p className="text-xl font-mono font-bold">
              {formatCentavos(comp.statutoryMinimumCentavos)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Company Plan Amount</p>
            <p className={`text-xl font-mono font-bold ${isSufficient ? "text-green-700" : "text-red-700"}`}>
              {formatCentavos(comp.companyPlanAmountCentavos)}
            </p>
          </div>
        </div>
        {isSufficient ? (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Company Plan Is Sufficient</AlertTitle>
            <AlertDescription className="text-green-700">
              The company plan equals or exceeds the RA 7641 statutory minimum.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Company Plan Is Insufficient — Gap: {gap !== null ? formatCentavos(gap) : "N/A"}</AlertTitle>
            <AlertDescription>
              The company plan falls short of the RA 7641 statutory minimum by{" "}
              {gap !== null ? formatCentavos(gap) : "an unknown amount"}.
              The employer must pay the difference.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 9. Component: `ResultsActionsRow`

**File:** `apps/retirement-pay/frontend/src/components/results/ResultsActionsRow.tsx`
**Parent:** `ComputationResultsPage`
**Props:**
- `computationId: string`
- `output: RetirementOutput`

**Purpose:** Bottom action row with: View NLRC Worksheet, Export PDF, New Computation,
Delete Computation (destructive, opens confirm dialog).

```tsx
// shadcn: no wrapper (just a flex row)
// Tailwind: flex flex-wrap gap-3 pt-2 border-t mt-2
// Buttons: all size="sm" variant as described

export function ResultsActionsRow({
  computationId,
  output,
}: {
  computationId: string;
  output: RetirementOutput;
}) {
  const navigate = useNavigate();
  const { deleteComputation, isDeleting } = useComputationActions(computationId);
  const { exportPdf, isExporting } = usePdfExport(output);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="flex flex-wrap gap-3 pt-2 border-t mt-2">
      {/* NLRC Worksheet button */}
      <Button variant="outline" size="sm" asChild>
        <Link to="/compute/$id/nlrc" params={{ id: computationId }}>
          <FileText className="w-4 h-4 mr-1" /> NLRC Worksheet
        </Link>
      </Button>

      {/* PDF Export button */}
      <Button
        variant="outline"
        size="sm"
        onClick={exportPdf}
        disabled={isExporting}
      >
        {isExporting ? (
          <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating PDF...</>
        ) : (
          <><Download className="w-4 h-4 mr-1" /> Export PDF</>
        )}
      </Button>

      {/* New Computation button */}
      <Button variant="outline" size="sm" asChild>
        <Link to="/compute/new">
          <Plus className="w-4 h-4 mr-1" /> New Computation
        </Link>
      </Button>

      {/* Delete button (right-aligned) */}
      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this computation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the computation for{" "}
              <strong>{output.employeeName}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteComputation();
                navigate({ to: "/dashboard" });
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---

## 10. Shared View: Read-Only Share Mode

**Route:** `/share/$token`
**File:** `apps/retirement-pay/frontend/src/pages/share/[token].tsx`

When loading a shared link, the page fetches `get_shared_computation(token)` RPC and renders the
same component tree with `shareMode = true`. In share mode:
- `ResultsPageHeader` omits the Edit, Share, Delete buttons
- `ResultsActionsRow` shows only "Export PDF" and "New Computation (Sign Up)" CTA
- A banner at the top displays: "Shared computation — read only. [Sign up to create your own]"

```tsx
export function SharedResultsPage() {
  const { token } = useParams({ from: "/share/$token" });
  const { data: computation, isLoading, error } = useSharedComputation(token);

  if (isLoading) return <ResultsPageSkeleton />;
  if (error || !computation) return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">Computation Not Found</h2>
      <p className="text-gray-500 mb-6">This shared link may have expired or been removed.</p>
      <Button asChild><Link to="/">Go to Homepage</Link></Button>
    </div>
  );

  const output = computation.output as RetirementOutput;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Share mode banner */}
      <Alert className="border-blue-300 bg-blue-50">
        <Share2 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          This is a shared computation — read only.{" "}
          <Link to="/auth/signup" className="font-medium underline">Sign up</Link> to create your own.
        </AlertDescription>
      </Alert>
      <EligibilityBadgeCard eligibility={output.eligibility} retirementType={computation.input.retirementType} />
      <UnderpaymentHighlightCard output={output} />
      <PayBreakdownCard output={output} />
      <TaxTreatmentAlert output={output} />
      <SeparationPayComparisonCard output={output} />
      <CompanyPlanComparisonCard output={output} />
      {/* Share-mode action row: PDF only + sign-up CTA */}
      <div className="flex gap-3 pt-2 border-t">
        <PdfExportButton output={output} employeeName={output.employeeName} />
        <Button asChild>
          <Link to="/auth/signup">Sign Up to Save Computations</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## 11. Skeleton Loader

**File:** `apps/retirement-pay/frontend/src/components/results/ResultsPageSkeleton.tsx`

Shown while `useComputation(id)` or `useSharedComputation(token)` is loading.

```tsx
// shadcn: Skeleton component from shadcn/ui
// Tailwind: animate-pulse

export function ResultsPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
```

---

## 12. Hooks

### `useComputation(id: string)`

**File:** `apps/retirement-pay/frontend/src/hooks/useComputation.ts`

```typescript
// Fetches a saved ComputationRecord from Supabase by UUID.
// Returns { computation: ComputationRecord | null, isLoading: boolean, error: Error | null }
// Implemented with TanStack Query (useQuery) against supabase.from("computations").select("*").eq("id", id).single()
```

### `useSharedComputation(token: string)`

**File:** `apps/retirement-pay/frontend/src/hooks/useSharedComputation.ts`

```typescript
// Calls the get_shared_computation Supabase RPC with token parameter (UUID type).
// Returns { data: ComputationRecord | null, isLoading: boolean, error: Error | null }
// Uses supabase.rpc("get_shared_computation", { p_token: token })
// Accessible to anon role (no auth required).
```

### `useComputationActions(id: string)`

**File:** `apps/retirement-pay/frontend/src/hooks/useComputationActions.ts`

```typescript
// deleteComputation(): Promise<void> — calls supabase.from("computations").delete().eq("id", id)
//   On success: invalidates useQuery cache for this id + the dashboard list query
// isDeleting: boolean
```

### `usePdfExport(output: RetirementOutput)`

**File:** `apps/retirement-pay/frontend/src/hooks/usePdfExport.ts`

```typescript
// exportPdf(): triggers @react-pdf/renderer download via pdf(RetirementPayPdfDocument({output})).toBlob()
//   then URL.createObjectURL(blob) + <a> click trigger
//   filename: `retirement-pay-${output.employeeName.replace(/ /g, "-").toLowerCase()}.pdf`
// isExporting: boolean (set true during async toBlob call)
```

---

## 13. Component File Map

| File | Component | Route/Parent |
|------|-----------|-------------|
| `pages/compute/[id]/results.tsx` | `ComputationResultsPage` | `/compute/$id/results` |
| `pages/share/[token].tsx` | `SharedResultsPage` | `/share/$token` |
| `components/results/ResultsPageHeader.tsx` | `ResultsPageHeader` | `ComputationResultsPage` |
| `components/results/EligibilityBadgeCard.tsx` | `EligibilityBadgeCard` | Both pages |
| `components/results/UnderpaymentHighlightCard.tsx` | `UnderpaymentHighlightCard` | Both pages |
| `components/results/PayBreakdownCard.tsx` | `PayBreakdownCard` | Both pages |
| `components/results/TaxTreatmentAlert.tsx` | `TaxTreatmentAlert` | Both pages |
| `components/results/SeparationPayComparisonCard.tsx` | `SeparationPayComparisonCard` | Both pages |
| `components/results/CompanyPlanComparisonCard.tsx` | `CompanyPlanComparisonCard` | Both pages |
| `components/results/ResultsActionsRow.tsx` | `ResultsActionsRow` | `ComputationResultsPage` only |
| `components/results/ResultsPageSkeleton.tsx` | `ResultsPageSkeleton` | Both pages |
| `hooks/useComputation.ts` | `useComputation` | `ComputationResultsPage` |
| `hooks/useSharedComputation.ts` | `useSharedComputation` | `SharedResultsPage` |
| `hooks/useComputationActions.ts` | `useComputationActions` | `ResultsActionsRow` |
| `hooks/usePdfExport.ts` | `usePdfExport` | `ResultsActionsRow` + `PdfExportButton` |

---

## 14. Conditional Rendering Summary

| Component | Condition to Show | Condition to Hide |
|-----------|-------------------|-------------------|
| `EligibilityBadgeCard` content | Always shown | Never hidden |
| Ineligibility reasons in `EligibilityBadgeCard` | `eligibility.reasons.length > 0` | No reasons |
| Underpayment highlight in `UnderpaymentHighlightCard` | `correctMinusErroneousCentavos > 0` | Zero gap |
| Taxable/exempt amounts in `TaxTreatmentAlert` | `taxTreatment !== "fullyExempt"` | Fully exempt |
| Full exemption conditions text | `taxTreatment === "fullyExempt"` | Not fully exempt |
| `SeparationPayComparisonCard` | `separationPayBasis !== "notApplicable"` | `notApplicable` |
| `CompanyPlanComparisonCard` | `companyPlanType !== "none" && companyPlanAmountCentavos !== null` | No company plan |
| Gap alert in `CompanyPlanComparisonCard` | `companyPlanIsSufficient === false` | Sufficient |
| Edit/Share/Delete in share mode | Never (share mode = true) | Always hidden |
| "Sign Up" CTA in share mode | `shareMode === true` | Authenticated mode |

---

## 15. Data Flow: Wizard → Results

```
/compute/new (NewComputationPage)
  → useWizard().submit(input: RetirementInput)
    → bridge.computeSingle(input) → RetirementOutput
    → supabase.from("computations").insert({ input, output, status: "computed" })
    → navigate("/compute/${newId}/results")

/compute/$id/results (ComputationResultsPage)
  → useComputation(id) → ComputationRecord { input, output }
  → deserialize output as RetirementOutput
  → render all result cards
```

---

## Summary

The results view consists of 9 distinct components, 4 hooks, and 2 route-level pages:
- `ComputationResultsPage` at `/compute/$id/results` (auth-required)
- `SharedResultsPage` at `/share/$token` (public, anon-accessible)

Both pages share the same 7 display components (`EligibilityBadgeCard`, `UnderpaymentHighlightCard`,
`PayBreakdownCard`, `TaxTreatmentAlert`, `SeparationPayComparisonCard`,
`CompanyPlanComparisonCard`, `ResultsPageSkeleton`). The share page omits `ResultsActionsRow`
(replaced by a minimal action row), `ResultsPageHeader` edit/delete controls, and shows a
share-mode banner.

The `UnderpaymentHighlightCard` is the core product value proposition — the 22.5-day vs.
15-day side-by-side comparison with the underpayment delta rendered prominently in amber.
