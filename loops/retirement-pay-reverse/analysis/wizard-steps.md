# Analysis: Wizard Steps — Single Employee Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** wizard-steps
**Date:** 2026-03-06
**Sources:** typescript-types.md, zod-schemas.md, data-model.md, computation-pipeline.md

---

## Overview

The single employee wizard is a 5-step form that collects all fields needed to build a
`RetirementInput` and send it to `compute_single_json`. Step 5 (company plan) is optional —
the user may skip it. Each step is validated with its own Zod schema before advancing.

The wizard lives at route `/compute/new` and is rendered by the `NewComputationPage` component.
State accumulates across steps in a top-level `useWizard` hook. On submit (end of Step 4 or 5),
the hook calls `computeSingle(input)`, stores the result, auto-saves to Supabase, and navigates
to `/compute/$id/results`.

---

## 1. Wizard Container

**File:** `apps/retirement-pay/frontend/src/pages/compute/new.tsx`
**Route:** `/compute/new`
**Auth required:** yes (redirect to `/auth` if not authenticated)

```tsx
// Component: NewComputationPage
// Parent: root layout with sidebar
// Renders: WizardContainer + step components

export function NewComputationPage() {
  const { step, stepData, setStep, setStepData, submit, isSubmitting } = useWizard();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <WizardProgressBar currentStep={step} totalSteps={5} />
      <Card className="mt-6">
        <CardContent className="pt-6">
          {step === 1 && <Step1EmployeeInfo onNext={(d) => { setStepData(1, d); setStep(2); }} />}
          {step === 2 && <Step2EmploymentDates onBack={() => setStep(1)} onNext={(d) => { setStepData(2, d); setStep(3); }} />}
          {step === 3 && <Step3SalaryBenefits onBack={() => setStep(2)} onNext={(d) => { setStepData(3, d); setStep(4); }} />}
          {step === 4 && <Step4RetirementDetails onBack={() => setStep(3)} onNext={(d) => { setStepData(4, d); setStep(5); }} />}
          {step === 5 && <Step5CompanyPlan onBack={() => setStep(4)} onSubmit={(d) => { setStepData(5, d); submit(); }} isSubmitting={isSubmitting} />}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 2. useWizard Hook

**File:** `apps/retirement-pay/frontend/src/hooks/useWizard.ts`

```typescript
interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  step1: WizardStep1 | null;
  step2: WizardStep2 | null;
  step3: WizardStep3 | null;
  step4: WizardStep4 | null;
  step5: WizardStep5 | null;
}

export function useWizard() {
  const [state, setState] = useState<WizardState>({
    step: 1,
    step1: null, step2: null, step3: null, step4: null, step5: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  function setStep(step: 1 | 2 | 3 | 4 | 5) {
    setState((s) => ({ ...s, step }));
  }

  function setStepData(step: 1 | 2 | 3 | 4 | 5, data: unknown) {
    setState((s) => ({ ...s, [`step${step}`]: data }));
  }

  async function submit() {
    const { step1, step2, step3, step4, step5 } = state;
    if (!step1 || !step2 || !step3 || !step4 || !step5) return;

    setIsSubmitting(true);
    try {
      const input = formStateToInput(step1, step2, step3, step4, step5);
      const result = await computeSingle(input);

      if (isOk(result)) {
        // Save to Supabase
        const record = await saveComputation({ input, output: result.Ok });
        toast({ title: "Computation complete", description: "Results saved." });
        navigate({ to: "/compute/$id/results", params: { id: record.id } });
      } else {
        // Engine returned an error (ineligible, bad input)
        toast({
          title: "Cannot compute retirement pay",
          description: result.Err.message,
          variant: "destructive",
        });
        // Navigate back to step with the offending field
        const firstField = result.Err.fields[0]?.field;
        if (firstField && fieldToStep[firstField]) {
          setStep(fieldToStep[firstField]);
        }
      }
    } catch (err) {
      // ZodError from output parse — engine contract breach
      toast({
        title: "Internal error",
        description: "Unexpected engine response. Please try again.",
        variant: "destructive",
      });
      console.error("Engine contract breach:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { step: state.step, stepData: state, setStep, setStepData, submit, isSubmitting };
}

// Maps EngineError field names back to the wizard step where the field is collected
const fieldToStep: Record<string, 1 | 2 | 3 | 4 | 5> = {
  employeeName: 1,
  companyName: 1,
  employerSize: 1,
  workerCategory: 1,
  age: 1,
  hireDate: 2,
  retirementDate: 2,
  retirementType: 2,
  basicSalaryCentavos: 3,
  silDaysPerYear: 3,
  hasThirteenthMonth: 3,
  monthlyAllowanceCentavos: 3,
  hasBirApprovedPlan: 4,
  isFirstRetirement: 4,
  separationPayBasis: 4,
  hasCompanyPlan: 5,
  companyPlanType: 5,
  companyPlanAmountCentavos: 5,
  companyPlanName: 5,
};
```

---

## 3. WizardProgressBar

**File:** `apps/retirement-pay/frontend/src/components/wizard/WizardProgressBar.tsx`

```tsx
// Props: currentStep (1-5), totalSteps (5)
// Renders: horizontal stepper with step labels below each circle
// shadcn: uses cn() utility for conditional classes; no shadcn component, pure Tailwind

const STEP_LABELS = [
  "Employee Info",
  "Employment Dates",
  "Salary & Benefits",
  "Retirement Details",
  "Company Plan",
];

export function WizardProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
              isCompleted && "bg-primary border-primary text-primary-foreground",
              isCurrent && "border-primary text-primary",
              !isCompleted && !isCurrent && "border-muted-foreground text-muted-foreground",
            )}>
              {isCompleted ? <Check className="w-4 h-4" /> : step}
            </div>
            <span className={cn(
              "mt-1 text-xs text-center",
              isCurrent ? "text-primary font-medium" : "text-muted-foreground",
            )}>
              {label}
            </span>
            {step < totalSteps && (
              <div className={cn(
                "absolute h-0.5 w-full top-4",
                isCompleted ? "bg-primary" : "bg-muted",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## 4. Step 1 — Employee Info

**File:** `apps/retirement-pay/frontend/src/components/wizard/Step1EmployeeInfo.tsx`

### Props
```typescript
interface Step1Props {
  defaultValues?: WizardStep1;
  onNext: (data: WizardStep1) => void;
}
```

### Fields

| Field | Label | Input Type | Default | Validation |
|-------|-------|------------|---------|------------|
| `employeeName` | Employee Name | `<Input type="text">` | `""` | required, max 200 chars |
| `companyName` | Company Name | `<Input type="text">` | `""` | required, max 200 chars |
| `employerSize` | Number of Employees | `<Input type="number" min="1">` | `""` | required, integer >= 1 |
| `workerCategory` | Worker Category | `<Select>` | `"general"` | required enum |
| `age` | Age at Retirement | `<Input type="number" min="15" max="100">` | `""` | required, 15–100 |

### Worker Category Select Options
```
"general"       → "General Employee"
"undergroundMine" → "Underground Mine Worker"
"racehorse"     → "Jockey / Racehorse Trainer"
```

### Conditional UI
- If `workerCategory === "undergroundMine"`: show `<Alert variant="default">` below the select:
  > "Underground mine workers have a lower optional retirement age of 50 (instead of 60). The engine applies this automatically."
- If `workerCategory === "racehorse"`: show similar Alert:
  > "Jockeys and racehorse trainers have a lower optional retirement age of 55. The engine applies this automatically."
- If `employerSize` value is entered and <= 10: show `<Alert variant="default" className="border-amber-500">`:
  > "Employers with 10 or fewer employees may be exempt from RA 7641. The engine will flag this in the eligibility check."

### Component Structure
```tsx
export function Step1EmployeeInfo({ defaultValues, onNext }: Step1Props) {
  const form = useForm<WizardStep1>({
    resolver: zodResolver(WizardStep1Schema),
    defaultValues: defaultValues ?? {
      employeeName: "",
      companyName: "",
      employerSize: "",
      workerCategory: "general",
      age: "",
    },
  });

  const workerCategory = form.watch("workerCategory");
  const employerSize = form.watch("employerSize");
  const employerSizeNum = parseInt(employerSize, 10);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h2 className="text-lg font-semibold">Step 1: Employee Information</h2>

        {/* employeeName */}
        <FormField control={form.control} name="employeeName" render={({ field }) => (
          <FormItem>
            <FormLabel>Employee Name</FormLabel>
            <FormControl><Input placeholder="Juan Dela Cruz" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* companyName */}
        <FormField control={form.control} name="companyName" render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl><Input placeholder="Manila Textiles Inc." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* employerSize */}
        <FormField control={form.control} name="employerSize" render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Employees</FormLabel>
            <FormControl><Input type="number" min={1} placeholder="500" {...field} /></FormControl>
            <FormDescription>Total headcount of the employer</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        {/* Small employer warning */}
        {!isNaN(employerSizeNum) && employerSizeNum <= 10 && (
          <Alert className="border-amber-500 text-amber-800 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Small Employer Notice</AlertTitle>
            <AlertDescription>
              Employers with 10 or fewer employees may be exempt from RA 7641.
              The engine will flag this in the eligibility check.
            </AlertDescription>
          </Alert>
        )}

        {/* workerCategory */}
        <FormField control={form.control} name="workerCategory" render={({ field }) => (
          <FormItem>
            <FormLabel>Worker Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="general">General Employee</SelectItem>
                <SelectItem value="undergroundMine">Underground Mine Worker</SelectItem>
                <SelectItem value="racehorse">Jockey / Racehorse Trainer</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Underground mine worker info */}
        {workerCategory === "undergroundMine" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Underground mine workers may retire optionally at age 50 (vs. 60 for general employees).
              The engine applies this automatically.
            </AlertDescription>
          </Alert>
        )}
        {workerCategory === "racehorse" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Jockeys and racehorse trainers may retire optionally at age 55.
              The engine applies this automatically.
            </AlertDescription>
          </Alert>
        )}

        {/* age */}
        <FormField control={form.control} name="age" render={({ field }) => (
          <FormItem>
            <FormLabel>Age at Retirement Date</FormLabel>
            <FormControl><Input type="number" min={15} max={100} placeholder="65" {...field} /></FormControl>
            <FormDescription>Age the employee will be on their retirement date</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end pt-2">
          <Button type="submit">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 5. Step 2 — Employment Dates

**File:** `apps/retirement-pay/frontend/src/components/wizard/Step2EmploymentDates.tsx`

### Props
```typescript
interface Step2Props {
  defaultValues?: WizardStep2;
  onBack: () => void;
  onNext: (data: WizardStep2) => void;
}
```

### Fields

| Field | Label | Input Type | Default | Validation |
|-------|-------|------------|---------|------------|
| `hireDate` | Date of Hire | `<Input type="date">` | `""` | required, YYYY-MM-DD |
| `retirementDate` | Date of Retirement | `<Input type="date">` | `""` | required, YYYY-MM-DD, after hireDate |
| `retirementType` | Retirement Type | `<Select>` | `"optional"` | required enum |

### Retirement Type Options
```
"optional"    → "Optional Retirement (age ≥ 60, service ≥ 5 years)"
"compulsory"  → "Compulsory Retirement (age = 65)"
"death"       → "Death Before Retirement (compute heirs' entitlement)"
```

### Conditional UI
- After both dates are entered: show computed service length inline below the two date fields:
  > `<p className="text-sm text-muted-foreground">Service period: 25 years, 6 months</p>`
  - Computed in the component using: `differenceInMonths(retirementDate, hireDate)` then formatted as years + months.
- If `retirementType === "death"`: show `<Alert>`:
  > "For death before retirement, the engine computes the retirement pay as if the employee retired on the date of death. The heirs are entitled to receive this amount."

### Component Structure
```tsx
export function Step2EmploymentDates({ defaultValues, onBack, onNext }: Step2Props) {
  const form = useForm<WizardStep2>({
    resolver: zodResolver(WizardStep2Schema),
    defaultValues: defaultValues ?? {
      hireDate: "",
      retirementDate: "",
      retirementType: "optional",
    },
  });

  const hireDate = form.watch("hireDate");
  const retirementDate = form.watch("retirementDate");
  const retirementType = form.watch("retirementType");

  // Compute service period for display
  const servicePeriod = useMemo(() => {
    if (!hireDate || !retirementDate || retirementDate <= hireDate) return null;
    const hire = new Date(hireDate);
    const retirement = new Date(retirementDate);
    const totalMonths = (retirement.getFullYear() - hire.getFullYear()) * 12
      + (retirement.getMonth() - hire.getMonth());
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (months === 0) return `${years} year${years !== 1 ? "s" : ""}`;
    return `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""}`;
  }, [hireDate, retirementDate]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h2 className="text-lg font-semibold">Step 2: Employment Dates</h2>

        {/* hireDate */}
        <FormField control={form.control} name="hireDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Date of Hire</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* retirementDate */}
        <FormField control={form.control} name="retirementDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Date of Retirement</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Service period computed display */}
        {servicePeriod && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Service period: <span className="font-medium text-foreground">{servicePeriod}</span>
          </p>
        )}

        {/* retirementType */}
        <FormField control={form.control} name="retirementType" render={({ field }) => (
          <FormItem>
            <FormLabel>Retirement Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="optional">Optional Retirement (age ≥ 60, service ≥ 5 years)</SelectItem>
                <SelectItem value="compulsory">Compulsory Retirement (age = 65)</SelectItem>
                <SelectItem value="death">Death Before Retirement</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {retirementType === "death" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Death Before Retirement</AlertTitle>
            <AlertDescription>
              The engine computes retirement pay as if the employee retired on the date of death.
              The heirs are entitled to receive this amount.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button type="submit">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 6. Step 3 — Salary & Benefits

**File:** `apps/retirement-pay/frontend/src/components/wizard/Step3SalaryBenefits.tsx`

### Props
```typescript
interface Step3Props {
  defaultValues?: WizardStep3;
  onBack: () => void;
  onNext: (data: WizardStep3) => void;
}
```

### Fields

| Field | Label | Input Type | Default | Validation |
|-------|-------|------------|---------|------------|
| `basicSalaryPesos` | Monthly Basic Salary | `<MoneyInput>` | `""` | required, > 0 |
| `silDaysPerYear` | SIL Days per Year | `<RadioGroup>` | `"5"` | required, one of 0/5/10/15 |
| `hasThirteenthMonth` | Receives 13th Month Pay | `<Switch>` | `true` | boolean |
| `monthlyAllowancePesos` | Monthly Fixed Allowance | `<MoneyInput>` | `""` | optional, >= 0 |

### SIL Radio Options
```
"0"  → "0 days (not provided)"
"5"  → "5 days (minimum required by law)"
"10" → "10 days"
"15" → "15 days"
```

### Conditional UI
- Below `basicSalaryPesos`, show a live preview card after a valid amount is entered:
  ```
  Daily rate (salary ÷ 26): ₱X,XXX.XX
  ```
  - Computed: `Math.round(centavos / 26)` then formatted.
- Below `silDaysPerYear`, if "0" is selected, show `<Alert variant="default" className="border-amber-500">`:
  > "SIL (Service Incentive Leave) of at least 5 days per year is required by the Labor Code for employees who have worked at least 1 year. Setting to 0 will reduce the computed retirement pay."
- Below `hasThirteenthMonth`, if `false`, show `<Alert variant="default" className="border-amber-500">`:
  > "The 13th month pay component (1/12 of annual basic salary) is part of the statutory 22.5-day formula. If the employer does not pay 13th month, the retirement pay is reduced by approximately 5.9%."
- `monthlyAllowancePesos`: labeled with helper text explaining which allowances count:
  > "Include only fixed monthly allowances contractually guaranteed and regularly received (e.g., housing, transportation COLA). Exclude overtime, night shift differential, and variable bonuses."

### Live Preview Card
After any salary field changes, render a `<Card>` below the fields (updated live as user types):
```tsx
{centavosValid && (
  <Card className="bg-muted">
    <CardContent className="pt-4 pb-3 px-4">
      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
        Live Preview
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Monthly basic salary</span>
          <span className="font-mono">{formatCentavos(centavos)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Daily rate (÷ 26)</span>
          <span className="font-mono">{formatCentavos(Math.round(centavos / 26))}</span>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### Component Structure
```tsx
export function Step3SalaryBenefits({ defaultValues, onBack, onNext }: Step3Props) {
  const form = useForm<WizardStep3>({
    resolver: zodResolver(WizardStep3Schema),
    defaultValues: defaultValues ?? {
      basicSalaryPesos: "",
      silDaysPerYear: "5",
      hasThirteenthMonth: true,
      monthlyAllowancePesos: "",
    },
  });

  const basicSalaryPesos = form.watch("basicSalaryPesos");
  const silDays = form.watch("silDaysPerYear");
  const hasThirteenthMonth = form.watch("hasThirteenthMonth");

  const basicCentavos = parsePesosToCentavos(basicSalaryPesos);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h2 className="text-lg font-semibold">Step 3: Salary & Benefits</h2>

        {/* basicSalaryPesos — MoneyInput */}
        <FormField control={form.control} name="basicSalaryPesos" render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Basic Salary</FormLabel>
            <FormControl>
              <MoneyInput placeholder="60,000.00" {...field} />
            </FormControl>
            <FormDescription>Basic salary only — exclude allowances, OT, and bonuses</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        {/* Live preview card */}
        {basicCentavos !== null && basicCentavos > 0 && (
          <Card className="bg-muted border-muted">
            <CardContent className="pt-4 pb-3 px-4 space-y-1 text-sm">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Preview</p>
              <div className="flex justify-between">
                <span>Monthly basic salary</span>
                <span className="font-mono">{formatCentavos(basicCentavos)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Daily rate (÷ 26)</span>
                <span className="font-mono">{formatCentavos(Math.round(basicCentavos / 26))}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* silDaysPerYear — RadioGroup */}
        <FormField control={form.control} name="silDaysPerYear" render={({ field }) => (
          <FormItem>
            <FormLabel>SIL Days per Year</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4 flex-wrap"
              >
                {(["0", "5", "10", "15"] as const).map((v) => (
                  <div key={v} className="flex items-center space-x-2">
                    <RadioGroupItem value={v} id={`sil-${v}`} />
                    <Label htmlFor={`sil-${v}`}>{v} days</Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription>Service Incentive Leave provided by the employer per year</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        {silDays === "0" && (
          <Alert className="border-amber-500 text-amber-800 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              SIL of at least 5 days/year is required by law. Setting to 0 will reduce retirement pay
              and may expose the employer to additional labor claims.
            </AlertDescription>
          </Alert>
        )}

        {/* hasThirteenthMonth — Switch */}
        <FormField control={form.control} name="hasThirteenthMonth" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Receives 13th Month Pay</FormLabel>
              <FormDescription>Required by PD 851 for rank-and-file employees</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />

        {!hasThirteenthMonth && (
          <Alert className="border-amber-500 text-amber-800 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The 13th month pay component (1/12 of annual salary) is part of the RA 7641 retirement pay formula.
              Excluding it reduces retirement pay by approximately 5.9%.
            </AlertDescription>
          </Alert>
        )}

        {/* monthlyAllowancePesos — MoneyInput */}
        <FormField control={form.control} name="monthlyAllowancePesos" render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Fixed Allowance <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
            <FormControl>
              <MoneyInput placeholder="0.00" {...field} />
            </FormControl>
            <FormDescription>
              Include only fixed, contractually guaranteed monthly allowances (e.g., integrated COLA, housing).
              Exclude overtime pay, night shift differential, and performance bonuses.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button type="submit">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 7. Step 4 — Retirement Details

**File:** `apps/retirement-pay/frontend/src/components/wizard/Step4RetirementDetails.tsx`

### Props
```typescript
interface Step4Props {
  defaultValues?: WizardStep4;
  onBack: () => void;
  onNext: (data: WizardStep4) => void;
}
```

### Fields

| Field | Label | Input Type | Default | Validation |
|-------|-------|------------|---------|------------|
| `hasBirApprovedPlan` | BIR-Approved Retirement Plan | `<Switch>` | `false` | boolean |
| `isFirstRetirement` | First Retirement Benefit Received | `<Switch>` | `true` | boolean |
| `separationPayBasis` | Separation Pay Basis | `<Select>` | `"notApplicable"` | required enum |

### Separation Pay Basis Options
```
"notApplicable"  → "Not Applicable (retirement only)"
"authorizedCause" → "Authorized Cause (general)"
"retrenchment"   → "Retrenchment to Prevent Losses"
"redundancy"     → "Redundancy"
"closure"        → "Closure / Cessation of Business"
"disease"        → "Disease / Health Condition"
```

### Conditional UI
- If `hasBirApprovedPlan === true`: show `<Alert>`:
  > "For retirement pay to be fully tax-exempt, the BIR-approved plan must also require: employee age ≥ 50 and service ≥ 10 years. These are verified by the engine."
- If `isFirstRetirement === false`: show `<Alert variant="destructive">`:
  > "Retirement pay tax exemption applies only once in an employee's lifetime. This computation will be flagged as taxable (not exempt) because the employee has previously received this benefit."
- If `separationPayBasis !== "notApplicable"`: show `<Alert>`:
  > "When both retirement pay and separation pay are due, the employee receives whichever is higher — not both. The engine will compute both and show the recommended benefit."

### Information Cards for Tax Treatment
Below the BIR plan switch, always show:
```tsx
<Card className="bg-muted border-muted">
  <CardContent className="pt-4 pb-3 px-4">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
      Tax Exemption Conditions (all 4 must be met)
    </p>
    <ul className="text-sm space-y-1">
      <li className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        Employee age ≥ 50 at retirement
      </li>
      <li className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        At least 10 years of service
      </li>
      <li className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        First time receiving retirement benefit
      </li>
      <li className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        Employer has a BIR-approved retirement plan
      </li>
    </ul>
    <p className="text-xs text-muted-foreground mt-2">
      Source: NIRC Sec. 32(B)(6)(a), Revenue Regulation 1-68
    </p>
  </CardContent>
</Card>
```

### Component Structure
```tsx
export function Step4RetirementDetails({ defaultValues, onBack, onNext }: Step4Props) {
  const form = useForm<WizardStep4>({
    resolver: zodResolver(WizardStep4Schema),
    defaultValues: defaultValues ?? {
      hasBirApprovedPlan: false,
      isFirstRetirement: true,
      separationPayBasis: "notApplicable",
    },
  });

  const hasBirPlan = form.watch("hasBirApprovedPlan");
  const isFirstRetirement = form.watch("isFirstRetirement");
  const separationPayBasis = form.watch("separationPayBasis");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h2 className="text-lg font-semibold">Step 4: Retirement Details</h2>

        {/* Tax exemption info card */}
        <Card className="bg-muted border-muted">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Tax Exemption Conditions (all 4 required)
            </p>
            <ul className="text-sm space-y-1">
              {[
                "Employee age ≥ 50 at retirement",
                "At least 10 years of service",
                "First time receiving retirement benefit",
                "Employer has a BIR-approved retirement plan",
              ].map((condition) => (
                <li key={condition} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Source: NIRC Sec. 32(B)(6)(a), Revenue Regulation 1-68
            </p>
          </CardContent>
        </Card>

        {/* hasBirApprovedPlan */}
        <FormField control={form.control} name="hasBirApprovedPlan" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>BIR-Approved Retirement Plan</FormLabel>
              <FormDescription>Does the employer have a BIR-approved pension/retirement plan?</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />

        {hasBirPlan && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              For full tax exemption, the BIR-approved plan must also require age ≥ 50 and service ≥ 10 years.
              Age and service are verified from the dates entered in Step 2.
            </AlertDescription>
          </Alert>
        )}

        {/* isFirstRetirement */}
        <FormField control={form.control} name="isFirstRetirement" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>First Retirement Benefit</FormLabel>
              <FormDescription>Has the employee previously received a retirement pay benefit from any employer?</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />

        {!isFirstRetirement && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tax exemption applies only once per lifetime. This computation will be flagged as taxable.
            </AlertDescription>
          </Alert>
        )}

        {/* separationPayBasis */}
        <FormField control={form.control} name="separationPayBasis" render={({ field }) => (
          <FormItem>
            <FormLabel>Separation Pay Basis <span className="font-normal text-muted-foreground">(if applicable)</span></FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="notApplicable">Not Applicable (retirement only)</SelectItem>
                <SelectItem value="authorizedCause">Authorized Cause (general)</SelectItem>
                <SelectItem value="retrenchment">Retrenchment to Prevent Losses</SelectItem>
                <SelectItem value="redundancy">Redundancy</SelectItem>
                <SelectItem value="closure">Closure / Cessation of Business</SelectItem>
                <SelectItem value="disease">Disease / Health Condition</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              If retirement coincides with an authorized cause dismissal, indicate the cause here.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        {separationPayBasis !== "notApplicable" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              When both retirement pay and separation pay are due, the employee receives whichever is higher — not both.
              The engine will compute both and recommend the higher benefit.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button type="submit">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 8. Step 5 — Company Plan (Optional)

**File:** `apps/retirement-pay/frontend/src/components/wizard/Step5CompanyPlan.tsx`

### Props
```typescript
interface Step5Props {
  defaultValues?: WizardStep5;
  onBack: () => void;
  onSubmit: (data: WizardStep5) => void;
  isSubmitting: boolean;
}
```

### Fields

| Field | Label | Input Type | Default | Conditional Visibility |
|-------|-------|------------|---------|------------------------|
| `hasCompanyPlan` | Company Has a Retirement Plan | `<Switch>` | `false` | always visible |
| `companyPlanType` | Plan Type | `<Select>` | `"none"` | visible when `hasCompanyPlan === true` |
| `companyPlanAmountPesos` | Company Plan Benefit Amount | `<MoneyInput>` | `""` | visible when `hasCompanyPlan === true` |
| `companyPlanName` | Plan Name | `<Input type="text">` | `""` | visible when `hasCompanyPlan === true` |

### Company Plan Type Options
```
"definedBenefit"      → "Defined Benefit Plan"
"definedContribution" → "Defined Contribution Plan"
```
(Note: "none" is excluded from the select — it's only set when `hasCompanyPlan === false`)

### Conditional UI
- When `hasCompanyPlan === false`: show brief explanation:
  > "If the employer has no retirement plan, the statutory RA 7641 amount is the employee's sole entitlement. Skip this step to proceed."
- When `hasCompanyPlan === true` and a valid amount is entered:
  - Show a preview card (updated live) that compares the plan amount to the statutory minimum based on the salary data from Step 3.
  - Preview card content:
    ```
    Statutory minimum (computed after submission)
    Company plan: ₱X,XXX,XXX.XX
    If company plan < statutory minimum → employee is entitled to the statutory amount
    ```
  - Note: exact statutory minimum not computable here (need full engine run). Instead show:
    ```
    Company plan amount: ₱X,XXX,XXX.XX
    The engine will compare this to the statutory minimum after submission.
    ```

### Skip Button
Step 5 has three actions:
1. **Back** — navigate to step 4 (always visible)
2. **Skip** — submit with `hasCompanyPlan: false` (visible when `hasCompanyPlan === false`)
3. **Compute** — full submit with plan data (visible when `hasCompanyPlan === true` or always as alternative)

Actually, to keep it simple: "Compute Retirement Pay" button always submits (no separate skip). When `hasCompanyPlan === false`, the form is valid by default.

### Submit Button State
- Label: `"Compute Retirement Pay"`
- Loading state: `isSubmitting === true` → show `<Loader2 className="animate-spin" />` + label "Computing..."
- Disabled while `isSubmitting`

### Component Structure
```tsx
export function Step5CompanyPlan({ defaultValues, onBack, onSubmit, isSubmitting }: Step5Props) {
  const form = useForm<WizardStep5>({
    resolver: zodResolver(WizardStep5Schema),
    defaultValues: defaultValues ?? {
      hasCompanyPlan: false,
      companyPlanType: "none",
      companyPlanAmountPesos: "",
      companyPlanName: "",
    },
  });

  const hasCompanyPlan = form.watch("hasCompanyPlan");
  const companyPlanAmountPesos = form.watch("companyPlanAmountPesos");
  const planCentavos = parsePesosToCentavos(companyPlanAmountPesos);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-lg font-semibold">Step 5: Company Retirement Plan</h2>
        <p className="text-sm text-muted-foreground">Optional — skip if no company plan exists.</p>

        {/* hasCompanyPlan */}
        <FormField control={form.control} name="hasCompanyPlan" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Employer Has a Retirement Plan</FormLabel>
              <FormDescription>Separate from RA 7641 statutory requirement</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />

        {!hasCompanyPlan && (
          <p className="text-sm text-muted-foreground">
            No company plan. The statutory RA 7641 amount is the employee's full entitlement.
            Click "Compute Retirement Pay" to proceed.
          </p>
        )}

        {hasCompanyPlan && (
          <>
            {/* companyPlanType */}
            <FormField control={form.control} name="companyPlanType" render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value === "none" ? undefined : field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select plan type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="definedBenefit">Defined Benefit Plan</SelectItem>
                    <SelectItem value="definedContribution">Defined Contribution Plan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* companyPlanName */}
            <FormField control={form.control} name="companyPlanName" render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Input placeholder="ABC Retirement Fund" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* companyPlanAmountPesos */}
            <FormField control={form.control} name="companyPlanAmountPesos" render={({ field }) => (
              <FormItem>
                <FormLabel>Company Plan Benefit Amount</FormLabel>
                <FormControl><MoneyInput placeholder="0.00" {...field} /></FormControl>
                <FormDescription>
                  Total amount the company plan would pay this employee upon retirement
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            {/* Preview */}
            {planCentavos !== null && planCentavos > 0 && (
              <Card className="bg-muted border-muted">
                <CardContent className="pt-4 pb-3 px-4 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Preview</p>
                  <div className="flex justify-between">
                    <span>Company plan benefit</span>
                    <span className="font-mono">{formatCentavos(planCentavos)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    The engine will compare this to the statutory minimum and show any gap.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Computing...</>
            ) : (
              <>Compute Retirement Pay <Calculator className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 9. MoneyInput Shared Component

**File:** `apps/retirement-pay/frontend/src/components/ui/MoneyInput.tsx`

```tsx
// Shared input component for peso amounts
// - Accepts string value (peso string from WizardFormState)
// - Displays ₱ prefix
// - Formats on blur (adds commas)
// - Strips formatting on focus

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(value);

    // On focus: strip commas for raw editing
    const handleFocus = () => {
      setDisplayValue(value.replace(/,/g, ""));
    };

    // On blur: format with commas
    const handleBlur = () => {
      const centavos = parsePesosToCentavos(value);
      if (centavos !== null) {
        const pesos = centavos / 100;
        setDisplayValue(pesos.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          className="pl-7"
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            setDisplayValue(e.target.value);
            onChange(e);
          }}
          {...props}
        />
      </div>
    );
  }
);
MoneyInput.displayName = "MoneyInput";
```

---

## 10. Step Dependency Map

Summary of which form fields are collected in which step, and which WASM input fields they map to:

| Step | WizardStep Field | RetirementInput Field | Notes |
|------|------------------|-----------------------|-------|
| 1 | `employeeName` | `employeeName` | direct |
| 1 | `companyName` | `companyName` | direct |
| 1 | `employerSize` | `employerSize` | string → parseInt |
| 1 | `workerCategory` | `workerCategory` | direct enum |
| 1 | `age` | `age` | string → parseInt |
| 2 | `hireDate` | `hireDate` | direct |
| 2 | `retirementDate` | `retirementDate` | direct |
| 2 | `retirementType` | `retirementType` | direct enum |
| 3 | `basicSalaryPesos` | `basicSalaryCentavos` | parsePesosToCentavos() |
| 3 | `silDaysPerYear` | `silDaysPerYear` | string → parseInt |
| 3 | `hasThirteenthMonth` | `hasThirteenthMonth` | direct bool |
| 3 | `monthlyAllowancePesos` | `monthlyAllowanceCentavos` | parsePesosToCentavos() ?? 0 |
| 4 | `hasBirApprovedPlan` | `hasBirApprovedPlan` | direct bool |
| 4 | `isFirstRetirement` | `isFirstRetirement` | direct bool |
| 4 | `separationPayBasis` | `separationPayBasis` | direct enum |
| 5 | `hasCompanyPlan` | `hasCompanyPlan` | direct bool |
| 5 | `companyPlanType` | `companyPlanType` | direct enum (or "none" if !hasCompanyPlan) |
| 5 | `companyPlanAmountPesos` | `companyPlanAmountCentavos` | parsePesosToCentavos() or null |
| 5 | `companyPlanName` | `companyPlanName` | direct or null |

All conversions happen in `formStateToInput()` as specified in `zod-schemas.md`.

---

## 11. Component File List

```
apps/retirement-pay/frontend/src/
  pages/
    compute/
      new.tsx                     ← NewComputationPage (route: /compute/new)
  components/
    wizard/
      WizardProgressBar.tsx       ← Step indicator strip
      Step1EmployeeInfo.tsx       ← Step 1 form
      Step2EmploymentDates.tsx    ← Step 2 form
      Step3SalaryBenefits.tsx     ← Step 3 form
      Step4RetirementDetails.tsx  ← Step 4 form
      Step5CompanyPlan.tsx        ← Step 5 form + submit
    ui/
      MoneyInput.tsx              ← Shared peso input component
  hooks/
    useWizard.ts                  ← Wizard state + submit logic
```

---

## 12. Lucide Icons Used

| Component | Icon | Usage |
|-----------|------|-------|
| `WizardProgressBar` | `Check` | Completed step circle |
| `Step1EmployeeInfo` | `AlertTriangle`, `Info` | Alert icons |
| `Step2EmploymentDates` | `Calendar`, `Info` | Service period, death alert |
| `Step3SalaryBenefits` | `AlertTriangle` | SIL=0 and no 13th month warnings |
| `Step4RetirementDetails` | `Info`, `AlertTriangle`, `CheckCircle2` | Alerts, tax condition list |
| `Step5CompanyPlan` | `Loader2`, `Calculator` | Submit button states |
| All steps | `ChevronRight`, `ChevronLeft` | Next/Back buttons |

---

## Summary

The wizard is 5 steps, each a separate component with its own `react-hook-form` instance
and Zod resolver. State accumulates in `useWizard`. On submit in Step 5, `formStateToInput()`
assembles `RetirementInput`, `computeSingle()` calls the WASM engine, the result is saved
to Supabase, and the user is navigated to `/compute/$id/results`.

Key UI decisions:
- **Live preview cards** in Step 3 and Step 5 give immediate feedback on entered amounts.
- **Contextual alerts** on worker category (Steps 1), small employer (Step 1), SIL=0 (Step 3),
  no 13th month (Step 3), no BIR plan (Step 4), non-first retirement (Step 4), and separation
  pay (Step 4) educate the user about the legal implications of their inputs.
- **Step 5 is optional** in practice — the submit button is always available regardless of
  whether `hasCompanyPlan` is true or false.
- **MoneyInput** is a shared component used in Steps 3 and 5, handling peso formatting on
  blur and centavo parsing.
- Zero placeholders: every field, label, default, validation rule, conditional, and component
  structure is fully specified.
