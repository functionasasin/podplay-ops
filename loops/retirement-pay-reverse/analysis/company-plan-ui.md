# Analysis: Company Plan UI — RA 7641 Retirement Pay Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** company-plan-ui
**Date:** 2026-03-06
**Sources:** company-plan-comparison-rules.md, data-model.md, typescript-types.md,
             wizard-steps.md, zod-schemas.md

---

## Overview

The Company Plan UI covers two distinct but related surfaces:

1. **Step 5 of the single-employee wizard** — Optional company plan input collected during
   computation setup. The wizard already specified the shell of Step5CompanyPlan; this analysis
   details every field, conditional visibility, and validation rule for that step.

2. **Standalone Company Plan Comparison page** — A dedicated page at `/compute/$id/comparison`
   that displays the side-by-side statutory vs. company plan gap analysis after computation.
   Also accessible from the batch results page for portfolio-level analysis.

Both surfaces map to `CompanyPlanInput` (Rust input struct) and `CompanyPlanAnalysis` (Rust output
struct) via the WASM bridge.

---

## 1. Step 5 Company Plan Input — Wizard Step

### File
`apps/retirement-pay/frontend/src/pages/compute/new/Step5CompanyPlan.tsx`

### Parent
`NewComputationPage` at `/compute/new` (see wizard-steps.md)

### Purpose
Collect company retirement plan details to enable the gap analysis. User may click "Skip" to
proceed without a company plan (sets `hasCompanyPlan: false`).

### Zod Schema (Step5)

```typescript
// File: apps/retirement-pay/frontend/src/lib/schemas.ts

export const CompanyPlanTypeSchema = z.enum([
  "none",
  "daysPerYear",
  "monthsPerYear",
  "fixedLumpSum",
  "manualEntry",
]);
export type CompanyPlanTypeInput = z.infer<typeof CompanyPlanTypeSchema>;

export const Step5Schema = z.object({
  hasCompanyPlan: z.boolean(),
  companyPlanType: CompanyPlanTypeSchema.nullable(),
  // For daysPerYear — e.g. 26 for "1 month per year"; stored as integer hundredths (2600 = 26.00)
  companyDaysPerYearHundredths: z.number().int().min(100).max(10000).nullable(),
  // For monthsPerYear — e.g. 100 = 1.00 month, stored as integer hundredths
  companyMonthsPerYearHundredths: z.number().int().min(1).max(2400).nullable(),
  // For fixedLumpSum — centavos
  companyFixedAmountCentavos: z.number().int().min(0).nullable(),
  // For manualEntry — centavos
  companyPlanBenefitCentavos: z.number().int().min(0).nullable(),
  // PAG-IBIG offset fields
  hasPagibigOffset: z.boolean(),
  pagibigEmployerContributionsCentavos: z.number().int().min(0).nullable(),
  // CBA early retirement flag
  hasCbaEarlyRetirement: z.boolean(),
  cbaPlanNotes: z.string().max(500).nullable(),
}).strict();
export type Step5Data = z.infer<typeof Step5Schema>;
```

**Default values:**
```typescript
const defaultStep5: Step5Data = {
  hasCompanyPlan: false,
  companyPlanType: null,
  companyDaysPerYearHundredths: null,
  companyMonthsPerYearHundredths: null,
  companyFixedAmountCentavos: null,
  companyPlanBenefitCentavos: null,
  hasPagibigOffset: false,
  pagibigEmployerContributionsCentavos: null,
  hasCbaEarlyRetirement: false,
  cbaPlanNotes: null,
};
```

### Component Structure

```tsx
// File: apps/retirement-pay/frontend/src/pages/compute/new/Step5CompanyPlan.tsx

interface Step5Props {
  onBack: () => void;
  onSubmit: (data: Step5Data) => void;
  isSubmitting: boolean;
}

export function Step5CompanyPlan({ onBack, onSubmit, isSubmitting }: Step5Props) {
  const form = useForm<Step5Data>({
    resolver: zodResolver(Step5Schema),
    defaultValues: defaultStep5,
  });

  const hasCompanyPlan = form.watch("hasCompanyPlan");
  const companyPlanType = form.watch("companyPlanType");
  const hasPagibigOffset = form.watch("hasPagibigOffset");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Company Retirement Plan (Optional)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your company's retirement plan details to see how it compares to the RA 7641
            statutory minimum. You may skip this step.
          </p>
        </div>

        {/* Toggle: has company plan */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <div>
            <Label className="text-sm font-medium text-gray-900">
              Does the employer have a retirement plan?
            </Label>
            <p className="text-xs text-gray-500 mt-0.5">
              CBA provision, company policy, or BIR-registered plan
            </p>
          </div>
          <Switch
            checked={hasCompanyPlan}
            onCheckedChange={(v) => {
              form.setValue("hasCompanyPlan", v);
              if (!v) {
                form.setValue("companyPlanType", null);
                form.setValue("hasPagibigOffset", false);
              }
            }}
          />
        </div>

        {/* Plan type selector — visible when hasCompanyPlan = true */}
        {hasCompanyPlan && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan Formula Type</Label>
              <Select
                value={companyPlanType ?? ""}
                onValueChange={(v) => form.setValue("companyPlanType", v as CompanyPlanTypeInput)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan formula type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daysPerYear">Days per year of service</SelectItem>
                  <SelectItem value="monthsPerYear">Months per year of service</SelectItem>
                  <SelectItem value="fixedLumpSum">Fixed lump sum (total amount)</SelectItem>
                  <SelectItem value="manualEntry">I calculated it manually</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                "1 month per year" = 26 days per year. RA 7641 minimum = 22.5 days per year.
              </p>
            </div>

            {/* daysPerYear fields */}
            {companyPlanType === "daysPerYear" && (
              <div className="space-y-2">
                <Label htmlFor="companyDaysPerYear">Days Per Year of Service</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="companyDaysPerYear"
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    placeholder="e.g. 26"
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      form.setValue("companyDaysPerYearHundredths", Math.round(v * 100));
                    }}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">days / year</span>
                </div>
                <p className="text-xs text-gray-500">
                  Common values: 15 days (illegal minimum), 22.5 days (RA 7641), 26 days (1 month),
                  30 days (generous).
                </p>
                {form.formState.errors.companyDaysPerYearHundredths && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.companyDaysPerYearHundredths.message}
                  </p>
                )}
              </div>
            )}

            {/* monthsPerYear fields */}
            {companyPlanType === "monthsPerYear" && (
              <div className="space-y-2">
                <Label htmlFor="companyMonthsPerYear">Months Per Year of Service</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="companyMonthsPerYear"
                    type="number"
                    step="0.25"
                    min="0.01"
                    max="24"
                    placeholder="e.g. 1"
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      form.setValue("companyMonthsPerYearHundredths", Math.round(v * 100));
                    }}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">month(s) / year</span>
                </div>
                <p className="text-xs text-gray-500">
                  "1 month per year" = 26 days per year (equivalent to RA 7641 using 26-day divisor,
                  but slightly more than 22.5 days equivalent).
                </p>
              </div>
            )}

            {/* fixedLumpSum fields */}
            {companyPlanType === "fixedLumpSum" && (
              <div className="space-y-2">
                <Label htmlFor="companyFixedAmount">Total Fixed Retirement Amount</Label>
                <MoneyInput
                  id="companyFixedAmount"
                  placeholder="0.00"
                  onValueChange={(centavos) =>
                    form.setValue("companyFixedAmountCentavos", centavos)
                  }
                />
                <p className="text-xs text-gray-500">
                  Enter the total peso amount the company plan provides, regardless of years of
                  service. This is compared against the computed statutory minimum.
                </p>
              </div>
            )}

            {/* manualEntry fields */}
            {companyPlanType === "manualEntry" && (
              <div className="space-y-2">
                <Label htmlFor="companyPlanBenefit">Computed Company Plan Benefit</Label>
                <MoneyInput
                  id="companyPlanBenefit"
                  placeholder="0.00"
                  onValueChange={(centavos) =>
                    form.setValue("companyPlanBenefitCentavos", centavos)
                  }
                />
                <p className="text-xs text-gray-500">
                  Enter the amount already computed from your company's formula. The calculator will
                  compare this directly to the RA 7641 statutory minimum.
                </p>
              </div>
            )}

            {/* PAG-IBIG offset toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">
                  PAG-IBIG employer contribution offset?
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  If employer argues PAG-IBIG contributions satisfy part of RA 7641 obligation
                </p>
              </div>
              <Switch
                checked={hasPagibigOffset}
                onCheckedChange={(v) => {
                  form.setValue("hasPagibigOffset", v);
                  if (!v) form.setValue("pagibigEmployerContributionsCentavos", null);
                }}
              />
            </div>

            {hasPagibigOffset && (
              <div className="space-y-2">
                <Label htmlFor="pagibigContributions">
                  Total PAG-IBIG Employer Contributions (accumulated)
                </Label>
                <MoneyInput
                  id="pagibigContributions"
                  placeholder="0.00"
                  onValueChange={(centavos) =>
                    form.setValue("pagibigEmployerContributionsCentavos", centavos)
                  }
                />
                <Alert variant="default" className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800">
                    Only employer contributions count — not employee contributions. Obtain the
                    employee's PAG-IBIG contribution statement to verify the actual amount.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* CBA early retirement toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">
                  CBA specifies an early retirement age?
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  E.g. retirement at age 55 or after 25 years regardless of age
                </p>
              </div>
              <Switch
                checked={form.watch("hasCbaEarlyRetirement")}
                onCheckedChange={(v) => form.setValue("hasCbaEarlyRetirement", v)}
              />
            </div>

            {/* Optional notes field */}
            <div className="space-y-2">
              <Label htmlFor="cbaPlanNotes">Notes (optional)</Label>
              <Textarea
                id="cbaPlanNotes"
                placeholder="E.g. CBA Art. XIV Sec. 3: retirement at 55, 2 months per year of service..."
                maxLength={500}
                className="text-sm"
                {...form.register("cbaPlanNotes")}
              />
              <p className="text-xs text-gray-500">
                Record the plan formula verbatim for the NLRC worksheet. Max 500 characters.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex gap-3">
            {/* Skip button only shown when hasCompanyPlan = false (its default) */}
            {!hasCompanyPlan && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onSubmit(defaultStep5)}
                disabled={isSubmitting}
              >
                Skip
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  Compute Retirement Pay
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
```

### Conditional Visibility Rules (Step 5)

| Field | Shown when |
|-------|-----------|
| Plan formula type selector | `hasCompanyPlan = true` |
| Days per year input | `hasCompanyPlan = true` AND `companyPlanType = "daysPerYear"` |
| Months per year input | `hasCompanyPlan = true` AND `companyPlanType = "monthsPerYear"` |
| Fixed lump sum input | `hasCompanyPlan = true` AND `companyPlanType = "fixedLumpSum"` |
| Manual entry input | `hasCompanyPlan = true` AND `companyPlanType = "manualEntry"` |
| PAG-IBIG toggle | `hasCompanyPlan = true` |
| PAG-IBIG amount input | `hasCompanyPlan = true` AND `hasPagibigOffset = true` |
| CBA early retirement toggle | `hasCompanyPlan = true` |
| Notes field | `hasCompanyPlan = true` |
| Skip button | `hasCompanyPlan = false` (the default until toggled) |

### Validation Rules (Step 5)

| Field | Rule | Error message |
|-------|------|---------------|
| `companyPlanType` | Required when `hasCompanyPlan = true` | "Select the plan formula type" |
| `companyDaysPerYearHundredths` | Required when `companyPlanType = "daysPerYear"`, min 100 (=1.0 day), max 10000 (=100 days) | "Enter a value between 1 and 100 days" |
| `companyMonthsPerYearHundredths` | Required when `companyPlanType = "monthsPerYear"`, min 1 (=0.01 months), max 2400 (=24 months) | "Enter a value between 0.01 and 24 months" |
| `companyFixedAmountCentavos` | Required when `companyPlanType = "fixedLumpSum"`, min 0 | "Enter the fixed benefit amount" |
| `companyPlanBenefitCentavos` | Required when `companyPlanType = "manualEntry"`, min 0 | "Enter the computed benefit amount" |
| `pagibigEmployerContributionsCentavos` | Required when `hasPagibigOffset = true`, min 0 | "Enter the total employer PAG-IBIG contributions" |

---

## 2. Company Plan Comparison Page

### File
`apps/retirement-pay/frontend/src/pages/compute/$id/comparison.tsx`

### Route
`/compute/$id/comparison`

### Parent
Computation detail layout with tab navigation. Tabs: Results | NLRC Worksheet | **Comparison** | Share

### Auth required
Yes. If `$id` belongs to a different user's computation, return 404 (enforce via RLS).

### Data Source

Reads `CompanyPlanAnalysis` from the computation result stored in Supabase:

```typescript
// From RetirementOutput (typescript-types.md)
interface RetirementOutput {
  // ...other fields...
  companyPlanAnalysis: CompanyPlanAnalysis | null; // null when no plan entered
}

interface CompanyPlanAnalysis {
  companyPlanBenefitCentavos: number;        // plan benefit (0 if none)
  statutoryMinimumCentavos: number;          // 22.5-day formula result
  retirementPayOwedCentavos: number;         // max(company, statutory)
  planGoverns: "statutory" | "company";
  gapCentavos: number;                       // statutory - company (>=0; 0 = fully covered)
  gapPercentage: number;                     // gapCentavos / statutoryMinimumCentavos (integer basis points: 3300 = 33.00%)
  pagibigOffsetCentavos: number;             // 0 if no PAG-IBIG offset
  additionalObligationCentavos: number;      // after deducting PAG-IBIG offset
}
```

### Component: CompanyPlanComparisonPage

```tsx
// File: apps/retirement-pay/frontend/src/pages/compute/$id/comparison.tsx

export function CompanyPlanComparisonPage() {
  const { id } = useParams({ from: "/compute/$id/comparison" });
  const { data: computation, isLoading } = useComputationQuery(id);

  if (isLoading) return <ComparisonPageSkeleton />;
  if (!computation?.output.companyPlanAnalysis) return <NoCompanyPlanEmptyState />;

  const analysis = computation.output.companyPlanAnalysis;

  return (
    <div className="space-y-6">
      <ComparisonHeader analysis={analysis} />
      <ComparisonTable analysis={analysis} />
      {analysis.gapCentavos > 0 && <GapAlertCard analysis={analysis} />}
      {analysis.pagibigOffsetCentavos > 0 && <PagibigOffsetCard analysis={analysis} />}
      <LegalBasisCard />
    </div>
  );
}
```

### Sub-component: ComparisonHeader

```tsx
// Shows which plan governs + summary verdict badge

function ComparisonHeader({ analysis }: { analysis: CompanyPlanAnalysis }) {
  const governs = analysis.planGoverns;
  const gap = analysis.gapCentavos;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-indigo-600" />
          Plan Coverage Analysis
        </CardTitle>
        <CardDescription>
          Compares the employer's retirement plan against the RA 7641 statutory minimum (22.5 days
          per year of credited service).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {gap === 0 ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Fully Covered
            </Badge>
          ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              {formatPercentage(analysis.gapPercentage)} Shortfall
            </Badge>
          )}
          <span className="text-sm text-gray-600">
            {governs === "statutory"
              ? "RA 7641 statutory minimum governs — employer must pay the statutory amount."
              : "Company plan governs — plan benefit exceeds or equals the statutory minimum."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Sub-component: ComparisonTable

```tsx
// Side-by-side statutory vs company plan table

function ComparisonTable({ analysis }: { analysis: CompanyPlanAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Side-by-Side Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-1/3">Metric</TableHead>
              <TableHead className="text-right">RA 7641 Statutory</TableHead>
              <TableHead className="text-right">Company Plan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-sm">Formula</TableCell>
              <TableCell className="text-right text-sm">22.5 days × credited years</TableCell>
              <TableCell className="text-right text-sm text-gray-500">
                {analysis.companyPlanBenefitCentavos === 0 ? "—" : "Plan formula"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-sm">Gross Benefit</TableCell>
              <TableCell className="text-right font-semibold">
                {formatMoney(analysis.statutoryMinimumCentavos)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {analysis.companyPlanBenefitCentavos === 0
                  ? "—"
                  : formatMoney(analysis.companyPlanBenefitCentavos)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-sm">Governs?</TableCell>
              <TableCell className="text-right">
                {analysis.planGoverns === "statutory" ? (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Yes</Badge>
                ) : (
                  <span className="text-sm text-gray-400">No</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {analysis.planGoverns === "company" ? (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Yes</Badge>
                ) : (
                  <span className="text-sm text-gray-400">No</span>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-sm">Amount Owed</TableCell>
              <TableCell />
              <TableCell className="text-right font-bold text-indigo-700">
                {formatMoney(analysis.retirementPayOwedCentavos)}
              </TableCell>
            </TableRow>
            {analysis.gapCentavos > 0 && (
              <TableRow className="bg-red-50">
                <TableCell className="font-medium text-sm text-red-700">Gap (Shortfall)</TableCell>
                <TableCell />
                <TableCell className="text-right font-semibold text-red-700">
                  {formatMoney(analysis.gapCentavos)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### Sub-component: GapAlertCard

```tsx
// Shown only when gapCentavos > 0 — legal consequence callout

function GapAlertCard({ analysis }: { analysis: CompanyPlanAnalysis }) {
  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800 font-semibold">Compliance Gap Detected</AlertTitle>
      <AlertDescription className="text-red-700 space-y-2">
        <p>
          The company plan provides <strong>{formatMoney(analysis.companyPlanBenefitCentavos)}</strong>,
          which is <strong>{formatMoney(analysis.gapCentavos)}</strong> (
          {formatPercentage(analysis.gapPercentage)}) below the RA 7641 statutory minimum of{" "}
          <strong>{formatMoney(analysis.statutoryMinimumCentavos)}</strong>.
        </p>
        <p className="text-sm">
          Under RA 7641 Sec. 1, company retirement plans cannot provide benefits less than the
          statutory minimum. The employer must pay at least {formatMoney(analysis.statutoryMinimumCentavos)}.
          Failure to do so exposes the employer to an NLRC money claim for the {formatMoney(analysis.gapCentavos)} difference.
        </p>
      </AlertDescription>
    </Alert>
  );
}
```

### Sub-component: PagibigOffsetCard

```tsx
// Shown only when pagibigOffsetCentavos > 0

function PagibigOffsetCard({ analysis }: { analysis: CompanyPlanAnalysis }) {
  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-600" />
          PAG-IBIG Employer Contribution Offset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Employer PAG-IBIG Contributions</p>
            <p className="font-semibold">{formatMoney(analysis.pagibigOffsetCentavos)}</p>
          </div>
          <div>
            <p className="text-gray-500">Remaining Obligation After Offset</p>
            <p className="font-semibold text-indigo-700">
              {formatMoney(analysis.additionalObligationCentavos)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Per DOLE Advisory 1996, only employer contributions to PAG-IBIG count toward the RA 7641
          obligation. Employee contributions are excluded. Obtain the official PAG-IBIG contribution
          statement to verify this credit.
        </p>
      </CardContent>
    </Card>
  );
}
```

### Sub-component: LegalBasisCard

```tsx
// Always shown — legal citation for the comparison

function LegalBasisCard() {
  return (
    <Card className="border-gray-100 bg-gray-50">
      <CardContent className="pt-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Legal Basis
        </h4>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>
            <span className="font-medium">RA 7641, Sec. 1:</span> Company retirement plans shall
            not provide benefits less than the statutory minimum.
          </li>
          <li>
            <span className="font-medium">RA 7641, Sec. 2:</span> Employees retain whichever
            benefit is more favorable.
          </li>
          <li>
            <span className="font-medium">IRR, Sec. 3:</span> CBA/contract retirement benefits
            shall not be less than the statutory minimum.
          </li>
          <li>
            <span className="font-medium">DOLE Advisory 1996:</span> Employer must pay the
            difference when company plan is below statutory minimum.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
```

### Empty State: NoCompanyPlanEmptyState

```tsx
function NoCompanyPlanEmptyState() {
  const { id } = useParams({ from: "/compute/$id/comparison" });
  const navigate = useNavigate();

  return (
    <Card className="border-dashed border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Scale className="h-10 w-10 text-gray-300 mb-4" />
        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Company Plan Entered</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-4">
          Run a new computation and complete Step 5 to compare the RA 7641 statutory minimum against
          your employer's retirement plan.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/compute/new" })}>
          <Plus className="h-4 w-4 mr-1" />
          New Computation with Company Plan
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Loading Skeleton: ComparisonPageSkeleton

```tsx
function ComparisonPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-40" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 3. Batch Portfolio Gap Analysis

### Route
`/batch/$id` — batch results page. The comparison tab on the batch results page shows portfolio-level
gap analysis. This uses `BatchCompanyPlanSummary` from `BatchOutput`.

### Component: BatchGapAnalysisCard

```tsx
// Shown within the BatchResultsPage when companyPlanAnalysis is present in batch output

interface BatchCompanyPlanSummary {
  totalGapCentavos: number;
  undercoveredCount: number;
  fullyCoveredCount: number;
  totalEmployees: number;
  coverageRatioBasisPoints: number;   // fully_covered / total * 10000
  largestIndividualGapCentavos: number;
  averageGapUndercoveredCentavos: number; // 0 if undercoveredCount = 0
}

function BatchGapAnalysisCard({ summary }: { summary: BatchCompanyPlanSummary }) {
  const coveragePct = summary.coverageRatioBasisPoints / 100; // e.g. 6700 -> 67.00%

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          Portfolio Gap Analysis
        </CardTitle>
        <CardDescription>
          Company plan coverage across all {summary.totalEmployees} employees in this batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Coverage Rate"
            value={`${coveragePct.toFixed(1)}%`}
            variant={coveragePct >= 100 ? "success" : coveragePct >= 80 ? "warning" : "danger"}
          />
          <StatCard
            label="Undercovered Employees"
            value={summary.undercoveredCount.toString()}
            subtext={`of ${summary.totalEmployees} total`}
            variant={summary.undercoveredCount === 0 ? "success" : "danger"}
          />
          <StatCard
            label="Total Gap Exposure"
            value={formatMoney(summary.totalGapCentavos)}
            variant={summary.totalGapCentavos === 0 ? "success" : "danger"}
          />
          <StatCard
            label="Largest Individual Gap"
            value={formatMoney(summary.largestIndividualGapCentavos)}
            variant="neutral"
          />
          {summary.undercoveredCount > 0 && (
            <StatCard
              label="Average Gap (Undercovered)"
              value={formatMoney(summary.averageGapUndercoveredCentavos)}
              variant="neutral"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Utility: formatPercentage

```typescript
// File: apps/retirement-pay/frontend/src/lib/format.ts

/**
 * Format basis points as percentage string.
 * gapPercentage is stored as basis points × 100 (integer):
 *   3300 → "33.00%"
 *   100  → "1.00%"
 */
export function formatPercentage(basisPointsX100: number): string {
  const pct = basisPointsX100 / 100;
  return `${pct.toFixed(2)}%`;
}
```

---

## 5. Wire Format: Step5Data → RetirementInput Fields

When the wizard submits, `buildRetirementInput()` maps Step5Data fields to the `RetirementInput`
JSON object sent to `compute_single_json`. The mapping is:

```typescript
// File: apps/retirement-pay/frontend/src/lib/buildRetirementInput.ts (relevant portion)

function mapStep5(step5: Step5Data): Partial<RetirementInput> {
  if (!step5.hasCompanyPlan) {
    return {
      companyPlanType: "none",
      companyDaysPerYearHundredths: null,
      companyMonthsPerYearHundredths: null,
      companyFixedAmountCentavos: null,
      companyPlanBenefitCentavos: null,
      hasPagibigOffset: false,
      pagibigEmployerContributionsCentavos: null,
      hasCbaEarlyRetirement: false,
      cbaPlanNotes: null,
    };
  }

  return {
    companyPlanType: step5.companyPlanType,
    companyDaysPerYearHundredths: step5.companyDaysPerYearHundredths,
    companyMonthsPerYearHundredths: step5.companyMonthsPerYearHundredths,
    companyFixedAmountCentavos: step5.companyFixedAmountCentavos,
    companyPlanBenefitCentavos: step5.companyPlanBenefitCentavos,
    hasPagibigOffset: step5.hasPagibigOffset,
    pagibigEmployerContributionsCentavos: step5.pagibigEmployerContributionsCentavos,
    hasCbaEarlyRetirement: step5.hasCbaEarlyRetirement,
    cbaPlanNotes: step5.cbaPlanNotes,
  };
}
```

Note: `companyDaysPerYearHundredths` and `companyMonthsPerYearHundredths` are passed as integers
to the engine. The engine divides by 100 to get the decimal value before computing. This avoids
any float representation in the wire format.

---

## 6. Required Imports Per Component

| Component | shadcn/ui | lucide-react | Other |
|-----------|-----------|--------------|-------|
| Step5CompanyPlan | Switch, Select, Input, Button, Alert, AlertDescription, Textarea, Label | ChevronLeft, ChevronRight, Loader2, AlertTriangle | useForm, zodResolver, MoneyInput |
| CompanyPlanComparisonPage | Card, CardHeader, CardContent, CardTitle, CardDescription, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Alert, AlertTitle, AlertDescription | Scale, CheckCircle, AlertTriangle, Wallet, Plus, BarChart3 | useParams, useNavigate, useComputationQuery |
| BatchGapAnalysisCard | Card, CardHeader, CardContent, CardTitle, CardDescription | BarChart3 | StatCard, formatMoney |

---

## 7. Tab Navigation: Computation Detail

The `/compute/$id` layout renders tabs:

| Tab Label | Route | Component |
|-----------|-------|-----------|
| Results | `/compute/$id/results` | ResultsView |
| NLRC Worksheet | `/compute/$id/nlrc` | NlrcWorksheetView |
| Comparison | `/compute/$id/comparison` | CompanyPlanComparisonPage |
| Share | `/compute/$id/share` | SharePanel |

The "Comparison" tab is **always shown**, but renders `NoCompanyPlanEmptyState` when no company
plan was entered in Step 5. This prevents confusion about whether the feature exists.

---

## 8. Key Design Decisions

1. **Integer hundredths for fractional inputs** — Days per year and months per year are stored as
   integer hundredths (e.g., 22.5 days → 2250) to avoid float representation. The engine spec
   in data-model.md confirms the engine accepts these as `i32` hundredths and converts internally.

2. **Switch instead of radio for hasCompanyPlan** — Switch communicates a binary on/off state
   clearly. When off, the entire form section collapses to reduce visual noise.

3. **Skip vs. Submit** — The Skip button submits with `hasCompanyPlan: false`. This is explicit:
   the user actively chose not to enter a plan. The form never auto-skips.

4. **Comparison tab always visible** — Hiding the tab when no plan is entered would make the
   feature invisible. The empty state guides users to enter a plan on a new computation.

5. **gapPercentage as integer basis points × 100** — Consistent with the engine's avoidance of
   float. `3300` = 33.00%. The `formatPercentage()` utility divides by 100 for display.

6. **PAG-IBIG warning always shown when offset is active** — The Warning Alert in the PAG-IBIG
   input section reminds users that only employer contributions count. This is a common
   misunderstanding that leads to incorrect computations.
