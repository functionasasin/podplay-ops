# Analysis: Zod Schemas — RA 7641 Retirement Pay Engine

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** zod-schemas
**Date:** 2026-03-06
**Sources:** typescript-types.md, serde-wire-format.md, error-contract.md

---

## Overview

Strict Zod schemas for every TypeScript type defined in `typescript-types.md`. These schemas
serve two purposes:

1. **Input validation** — Validate user form data before sending to WASM engine (frontend-facing)
2. **Output parsing** — Validate and parse WASM JSON responses (wire-facing)

All wire-facing schemas use `.strict()` to mirror the Rust engine's `deny_unknown_fields`.
All optional fields use `z.nullable()` — never `z.optional()` on wire types.
All booleans use `z.boolean()` — never `z.coerce.boolean()`.
All money fields use `z.number().int()` — no decimals, no strings.

---

## 1. Schema File Layout

```
apps/retirement-pay/frontend/src/schemas/
  engine-input.ts    ← RetirementInputSchema, BatchInputSchema, BatchEmployeeInputSchema
  engine-output.ts   ← RetirementOutputSchema, BatchOutputSchema, NlrcWorksheetSchema
  engine-error.ts    ← EngineErrorSchema, FieldErrorSchema, EngineResultSchema
  enums.ts           ← All enum schemas (WorkerCategorySchema, etc.)
  ui-forms.ts        ← WizardStepSchemas (form validation, pesos not centavos)
  db.ts              ← ComputationRecordSchema, SharedLinkSchema
  index.ts           ← Re-exports all schemas
```

---

## 2. Primitive Schema Helpers

Defined in `schemas/primitives.ts` and imported everywhere:

```typescript
import { z } from "zod";

/** ISO 8601 date string: "YYYY-MM-DD" */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/** Integer centavo amount: non-negative for most fields */
export const CentavosSchema = z
  .number()
  .int("Must be an integer (centavos)")
  .finite("Must be a finite number");

/** Non-negative centavos (salary, pay amounts) */
export const NonNegCentavosSchema = CentavosSchema.nonnegative(
  "Amount must be zero or positive"
);

/** Centavos that may be negative (gap values) */
export const SignedCentavosSchema = CentavosSchema;

/** Non-negative integer count (years, months, days, headcount) */
export const NonNegIntSchema = z
  .number()
  .int()
  .nonnegative()
  .finite();

/** UUID string */
export const UuidSchema = z
  .string()
  .uuid("Must be a valid UUID");
```

---

## 3. Enum Schemas

File: `schemas/enums.ts`

```typescript
import { z } from "zod";

export const WorkerCategorySchema = z.enum([
  "general",
  "undergroundMine",
  "racehorse",
]);

export const RetirementTypeSchema = z.enum([
  "optional",
  "compulsory",
  "death",
]);

export const EligibilityStatusSchema = z.enum([
  "eligible",
  "ineligible",
  "eligibleWithWarnings",
]);

export const IneligibilityReasonSchema = z.enum([
  "ageTooYoung",
  "serviceTooShort",
  "employerTooSmall",
  "alreadyReceivedBenefit",
]);

export const TaxTreatmentSchema = z.enum([
  "fullyExempt",
  "partiallyExempt",
  "fullyTaxable",
]);

export const SeparationPayBasisSchema = z.enum([
  "authorizedCause",
  "retrenchment",
  "redundancy",
  "closure",
  "disease",
  "notApplicable",
]);

export const CompanyPlanTypeSchema = z.enum([
  "definedBenefit",
  "definedContribution",
  "none",
]);

export const CsvErrorKindSchema = z.enum([
  "missingColumn",
  "invalidDate",
  "invalidNumber",
  "negativeValue",
  "emptyRequired",
  "invalidEnum",
]);

export const ErrorCodeSchema = z.enum([
  "parse_error",
  "validation_failed",
  "internal_error",
  "serialization_error",
]);

export const ComputationModeSchema = z.enum(["single", "batch"]);

export const ComputationStatusSchema = z.enum(["draft", "computed", "shared"]);

export const OrgRoleSchema = z.enum(["owner", "admin", "member"]);
```

---

## 4. Engine Input Schemas

File: `schemas/engine-input.ts`

All input schemas use `.strict()` to catch accidental extra fields before they hit the engine.

### 4.1 `RetirementInputSchema`

```typescript
import { z } from "zod";
import {
  IsoDateSchema,
  NonNegCentavosSchema,
  NonNegIntSchema,
} from "./primitives";
import {
  WorkerCategorySchema,
  RetirementTypeSchema,
  CompanyPlanTypeSchema,
  SeparationPayBasisSchema,
} from "./enums";

export const RetirementInputSchema = z
  .object({
    employeeName: z
      .string()
      .min(1, "Employee name is required")
      .max(200, "Employee name must be 200 characters or fewer"),
    companyName: z
      .string()
      .min(1, "Company name is required")
      .max(200, "Company name must be 200 characters or fewer"),
    employerSize: NonNegIntSchema.min(1, "Employer size must be at least 1"),
    workerCategory: WorkerCategorySchema,
    age: NonNegIntSchema.min(15, "Age must be at least 15").max(
      100,
      "Age must be 100 or below"
    ),
    hireDate: IsoDateSchema,
    retirementDate: IsoDateSchema,
    retirementType: RetirementTypeSchema,
    basicSalaryCentavos: NonNegCentavosSchema.min(
      1,
      "Basic salary must be greater than zero"
    ),
    silDaysPerYear: z
      .number()
      .int()
      .refine((v) => [0, 5, 10, 15].includes(v), {
        message: "SIL days must be 0, 5, 10, or 15",
      }),
    hasThirteenthMonth: z.boolean(),
    monthlyAllowanceCentavos: NonNegCentavosSchema,
    hasCompanyPlan: z.boolean(),
    companyPlanType: CompanyPlanTypeSchema,
    companyPlanAmountCentavos: NonNegCentavosSchema.nullable(),
    companyPlanName: z.string().max(200).nullable(),
    hasBirApprovedPlan: z.boolean(),
    isFirstRetirement: z.boolean(),
    separationPayBasis: SeparationPayBasisSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    // Cross-field: retirement date must be after hire date
    if (data.retirementDate <= data.hireDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Retirement date must be after hire date",
        path: ["retirementDate"],
      });
    }
    // Cross-field: if hasCompanyPlan = true, companyPlanType must not be "none"
    if (data.hasCompanyPlan && data.companyPlanType === "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Company plan type must not be 'none' when company plan is enabled",
        path: ["companyPlanType"],
      });
    }
    // Cross-field: if hasCompanyPlan = true, companyPlanAmountCentavos required
    if (data.hasCompanyPlan && data.companyPlanAmountCentavos === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company plan amount is required when company plan is enabled",
        path: ["companyPlanAmountCentavos"],
      });
    }
    // Cross-field: death retirement type age check (no age minimum for death)
    // No constraint needed — engine handles eligibility for death type
  });

export type RetirementInput = z.infer<typeof RetirementInputSchema>;
```

### 4.2 `BatchEmployeeInputSchema`

```typescript
export const BatchEmployeeInputSchema = RetirementInputSchema.extend({
  rowIndex: NonNegIntSchema,
}).strict();

export type BatchEmployeeInput = z.infer<typeof BatchEmployeeInputSchema>;
```

### 4.3 `BatchInputSchema`

```typescript
export const BatchInputSchema = z
  .object({
    employees: z
      .array(BatchEmployeeInputSchema)
      .min(1, "Batch must have at least one employee")
      .max(500, "Batch cannot exceed 500 employees"),
    batchName: z
      .string()
      .min(1, "Batch name is required")
      .max(200, "Batch name must be 200 characters or fewer"),
    computationDate: IsoDateSchema,
  })
  .strict();

export type BatchInput = z.infer<typeof BatchInputSchema>;
```

---

## 5. Engine Output Schemas

File: `schemas/engine-output.ts`

Output schemas validate what the WASM engine returns. All use `.strict()` to catch new
engine fields that the frontend hasn't accounted for.

### 5.1 `EligibilityResultSchema`

```typescript
import { z } from "zod";
import { EligibilityStatusSchema, IneligibilityReasonSchema } from "./enums";

export const EligibilityResultSchema = z
  .object({
    status: EligibilityStatusSchema,
    reasons: z.array(IneligibilityReasonSchema),
    warnings: z.array(z.string()),
  })
  .strict();

export type EligibilityResult = z.infer<typeof EligibilityResultSchema>;
```

### 5.2 `SeparationPayComparisonSchema`

```typescript
import { SeparationPayBasisSchema } from "./enums";
import { SignedCentavosSchema } from "./primitives";

export const SeparationPayComparisonSchema = z
  .object({
    separationPayBasis: SeparationPayBasisSchema,
    separationPayCentavos: SignedCentavosSchema.nullable(),
    retirementPayIsHigher: z.boolean().nullable(),
    recommendedBenefitCentavos: NonNegCentavosSchema.nullable(),
  })
  .strict();

export type SeparationPayComparison = z.infer<
  typeof SeparationPayComparisonSchema
>;
```

### 5.3 `CompanyPlanComparisonSchema`

```typescript
import { CompanyPlanTypeSchema } from "./enums";

export const CompanyPlanComparisonSchema = z
  .object({
    companyPlanType: CompanyPlanTypeSchema,
    companyPlanAmountCentavos: NonNegCentavosSchema.nullable(),
    statutoryMinimumCentavos: NonNegCentavosSchema,
    gapCentavos: SignedCentavosSchema.nullable(),
    companyPlanIsSufficient: z.boolean().nullable(),
  })
  .strict();

export type CompanyPlanComparison = z.infer<typeof CompanyPlanComparisonSchema>;
```

### 5.4 `HalfMonthComponentsSchema`

```typescript
export const HalfMonthComponentsSchema = z
  .object({
    fifteenDaysCentavos: NonNegCentavosSchema,
    silCentavos: NonNegCentavosSchema,
    thirteenthMonthCentavos: NonNegCentavosSchema,
  })
  .strict();

export type HalfMonthComponents = z.infer<typeof HalfMonthComponentsSchema>;
```

### 5.5 `ComputationBreakdownSchema`

```typescript
import { TaxTreatmentSchema } from "./enums";

export const ComputationBreakdownSchema = z
  .object({
    step1EligibilityPassed: z.boolean(),
    step2ServiceMonths: NonNegIntSchema,
    step3CreditedYearsRounded: NonNegIntSchema,
    step4DailyRateCentavos: NonNegCentavosSchema,
    step5HalfMonthComponents: HalfMonthComponentsSchema,
    step6RetirementPayCentavos: NonNegCentavosSchema,
    step7TaxTreatment: TaxTreatmentSchema,
    step8SeparationPayComparison: SeparationPayComparisonSchema.nullable(),
    step9CompanyPlanGap: CompanyPlanComparisonSchema.nullable(),
  })
  .strict();

export type ComputationBreakdown = z.infer<typeof ComputationBreakdownSchema>;
```

### 5.6 `RetirementOutputSchema`

```typescript
import { TaxTreatmentSchema } from "./enums";

export const RetirementOutputSchema = z
  .object({
    employeeName: z.string(),
    companyName: z.string(),
    eligibility: EligibilityResultSchema,
    creditedYearsWhole: NonNegIntSchema,
    creditedYearsMonths: NonNegIntSchema.max(
      11,
      "Credited years months must be 0–11"
    ),
    creditedYearsRounded: NonNegIntSchema,
    dailyRateCentavos: NonNegCentavosSchema,
    fifteenDaysPayCentavos: NonNegCentavosSchema,
    silPayCentavos: NonNegCentavosSchema,
    thirteenthMonthPayCentavos: NonNegCentavosSchema,
    totalHalfMonthCentavos: NonNegCentavosSchema,
    retirementPayCentavos: NonNegCentavosSchema,
    taxTreatment: TaxTreatmentSchema,
    taxableAmountCentavos: NonNegCentavosSchema,
    exemptAmountCentavos: NonNegCentavosSchema,
    separationPayComparison: SeparationPayComparisonSchema,
    companyPlanComparison: CompanyPlanComparisonSchema,
    breakdown: ComputationBreakdownSchema,
    erroneous15DayPayCentavos: NonNegCentavosSchema,
    correctMinusErroneousCentavos: NonNegCentavosSchema,
  })
  .strict();

export type RetirementOutput = z.infer<typeof RetirementOutputSchema>;
```

### 5.7 `BatchRowResultSchema`

The `result` field inside each row is `{"Ok": RetirementOutput} | {"Err": EngineError}`.
Zod discriminated union:

```typescript
import { EngineErrorSchema } from "./engine-error";

export const BatchRowResultSchema = z
  .object({
    rowIndex: NonNegIntSchema,
    employeeName: z.string(),
    result: z.discriminatedUnion("Ok" as never, [
      z.object({ Ok: RetirementOutputSchema }).strict(),
      z.object({ Err: EngineErrorSchema }).strict(),
    ]) as z.ZodType<
      | { Ok: RetirementOutput }
      | { Err: z.infer<typeof EngineErrorSchema> }
    >,
  })
  .strict();

// Note: Zod discriminatedUnion requires a string literal discriminant key.
// Because {"Ok":...} and {"Err":...} use different keys (not a single shared key),
// use z.union instead:
export const RowResultUnionSchema = z.union([
  z.object({ Ok: RetirementOutputSchema }).strict(),
  z.object({ Err: EngineErrorSchema }).strict(),
]);

export const BatchRowResultSchema = z
  .object({
    rowIndex: NonNegIntSchema,
    employeeName: z.string(),
    result: RowResultUnionSchema,
  })
  .strict();

export type BatchRowResult = z.infer<typeof BatchRowResultSchema>;
```

### 5.8 `BatchOutputSchema`

```typescript
export const BatchOutputSchema = z
  .object({
    batchName: z.string(),
    computationDate: IsoDateSchema,
    totalEmployees: NonNegIntSchema,
    successCount: NonNegIntSchema,
    errorCount: NonNegIntSchema,
    totalRetirementPayCentavos: NonNegCentavosSchema,
    totalErroneousPayCentavos: NonNegCentavosSchema,
    totalUnderpaymentCentavos: NonNegCentavosSchema,
    rows: z.array(BatchRowResultSchema),
  })
  .strict();

export type BatchOutput = z.infer<typeof BatchOutputSchema>;
```

---

## 6. NLRC Worksheet Schemas

File: `schemas/engine-output.ts` (continued)

### 6.1 `HalfMonthBreakdownSchema`

```typescript
export const HalfMonthBreakdownSchema = z
  .object({
    fifteenDaysLabel: z.string().min(1),
    fifteenDaysAmount: z.string().min(1),
    silLabel: z.string().min(1),
    silAmount: z.string().min(1),
    thirteenthMonthLabel: z.string().min(1),
    thirteenthMonthAmount: z.string().min(1),
    totalLabel: z.string().min(1),
    totalAmount: z.string().min(1),
  })
  .strict();

export type HalfMonthBreakdown = z.infer<typeof HalfMonthBreakdownSchema>;
```

### 6.2 `ComputationRowSchema`

```typescript
export const ComputationRowSchema = z
  .object({
    description: z.string().min(1),
    amount: z.string().min(1),
    amountCentavos: SignedCentavosSchema.nullable(),
  })
  .strict();

export type ComputationRow = z.infer<typeof ComputationRowSchema>;
```

### 6.3 `NlrcRawCentavosSchema`

```typescript
export const NlrcRawCentavosSchema = z
  .object({
    retirementPayCentavos: NonNegCentavosSchema,
    erroneous15DayPayCentavos: NonNegCentavosSchema,
    correctMinusErroneousCentavos: NonNegCentavosSchema,
  })
  .strict();

export type NlrcRawCentavos = z.infer<typeof NlrcRawCentavosSchema>;
```

### 6.4 `NlrcWorksheetSchema`

```typescript
export const NlrcWorksheetSchema = z
  .object({
    caseCaption: z.string().min(1),
    claimantName: z.string().min(1),
    respondentName: z.string().min(1),
    dateOfBirth: IsoDateSchema.nullable(),
    dateOfHire: IsoDateSchema,
    dateOfRetirement: IsoDateSchema,
    yearsOfService: z.string().min(1),
    creditedYears: NonNegIntSchema,
    monthlyBasicSalary: z.string().min(1),
    dailyRate: z.string().min(1),
    halfMonthSalaryBreakdown: HalfMonthBreakdownSchema,
    computationTable: z.array(ComputationRowSchema).min(1),
    legalBasisStatements: z.array(z.string().min(1)).min(1),
    exhibitLabel: z.string().min(1),
    preparedBy: z.string().nullable(),
    preparedDate: IsoDateSchema,
    comparisonNote: z.string().min(1),
    rawCentavos: NlrcRawCentavosSchema,
  })
  .strict();

export type NlrcWorksheet = z.infer<typeof NlrcWorksheetSchema>;
```

---

## 7. Error Schemas

File: `schemas/engine-error.ts`

### 7.1 `FieldErrorSchema`

```typescript
import { z } from "zod";

export const FieldErrorSchema = z
  .object({
    field: z.string().min(1),
    code: z.string().min(1),
    message: z.string().min(1),
  })
  .strict();

export type FieldError = z.infer<typeof FieldErrorSchema>;
```

### 7.2 `EngineErrorSchema`

```typescript
import { ErrorCodeSchema } from "./enums";

export const EngineErrorSchema = z
  .object({
    code: ErrorCodeSchema,
    message: z.string().min(1),
    fields: z.array(FieldErrorSchema),
  })
  .strict();

export type EngineError = z.infer<typeof EngineErrorSchema>;
```

### 7.3 `EngineResultSchema<T>` (Generic)

Zod does not support generic schemas directly; create a factory function:

```typescript
/**
 * Creates a Zod schema for { Ok: T } | { Err: EngineError }.
 * Usage: EngineResultSchema(RetirementOutputSchema)
 */
export function EngineResultSchema<T extends z.ZodTypeAny>(okSchema: T) {
  return z.union([
    z.object({ Ok: okSchema }).strict(),
    z.object({ Err: EngineErrorSchema }).strict(),
  ]);
}

// Pre-built instances for each use case:
export const SingleResultSchema = EngineResultSchema(RetirementOutputSchema);
export const BatchResultSchema = EngineResultSchema(BatchOutputSchema);
export const NlrcResultSchema = EngineResultSchema(NlrcWorksheetSchema);

export type SingleResult = z.infer<typeof SingleResultSchema>;
export type BatchResult = z.infer<typeof BatchResultSchema>;
export type NlrcResult = z.infer<typeof NlrcResultSchema>;
```

### 7.4 Narrowing Helper

```typescript
/**
 * Type guard: checks if an EngineResult is Ok.
 * Works for any EngineResult<T> without calling Zod.
 */
export function isOk<T>(
  result: { Ok: T } | { Err: EngineError }
): result is { Ok: T } {
  return "Ok" in result;
}

/**
 * Usage in component:
 *
 * const raw = computeSingleJson(JSON.stringify(input));
 * const result = SingleResultSchema.parse(JSON.parse(raw));
 * if (isOk(result)) {
 *   // result.Ok: RetirementOutput — fully validated
 * } else {
 *   // result.Err: EngineError — display to user
 * }
 */
```

---

## 8. UI Form Schemas (Wizard Steps)

File: `schemas/ui-forms.ts`

These schemas validate user-facing form fields (strings from input elements). Pesos are
entered as strings and converted to centavos on submit. These schemas are NOT sent to WASM —
they are for Zod-powered form validation only (e.g., with react-hook-form + `zodResolver`).

### 8.1 Step 1 Schema — Employee Info

```typescript
import { z } from "zod";
import { WorkerCategorySchema } from "./enums";

export const WizardStep1Schema = z.object({
  employeeName: z
    .string()
    .min(1, "Employee name is required")
    .max(200, "Must be 200 characters or fewer"),
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Must be 200 characters or fewer"),
  employerSize: z
    .string()
    .min(1, "Employer size is required")
    .refine(
      (v) => {
        const n = parseInt(v, 10);
        return !isNaN(n) && n >= 1;
      },
      { message: "Employer size must be a positive integer" }
    ),
  workerCategory: WorkerCategorySchema,
  age: z
    .string()
    .min(1, "Age is required")
    .refine(
      (v) => {
        const n = parseInt(v, 10);
        return !isNaN(n) && n >= 15 && n <= 100;
      },
      { message: "Age must be between 15 and 100" }
    ),
});

export type WizardStep1 = z.infer<typeof WizardStep1Schema>;
```

### 8.2 Step 2 Schema — Employment Dates

```typescript
import { RetirementTypeSchema } from "./enums";

export const WizardStep2Schema = z
  .object({
    hireDate: IsoDateSchema,
    retirementDate: IsoDateSchema,
    retirementType: RetirementTypeSchema,
  })
  .superRefine((data, ctx) => {
    if (data.retirementDate <= data.hireDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Retirement date must be after hire date",
        path: ["retirementDate"],
      });
    }
  });

export type WizardStep2 = z.infer<typeof WizardStep2Schema>;
```

### 8.3 Step 3 Schema — Salary & Benefits

```typescript
export const WizardStep3Schema = z.object({
  basicSalaryPesos: z
    .string()
    .min(1, "Basic salary is required")
    .refine(
      (v) => {
        const cleaned = v.replace(/[₱,\s]/g, "");
        const n = parseFloat(cleaned);
        return !isNaN(n) && n > 0;
      },
      { message: "Basic salary must be a positive amount" }
    ),
  silDaysPerYear: z.enum(["0", "5", "10", "15"], {
    errorMap: () => ({ message: "SIL days must be 0, 5, 10, or 15" }),
  }),
  hasThirteenthMonth: z.boolean(),
  monthlyAllowancePesos: z
    .string()
    .refine(
      (v) => {
        if (v === "" || v === "0") return true;
        const cleaned = v.replace(/[₱,\s]/g, "");
        const n = parseFloat(cleaned);
        return !isNaN(n) && n >= 0;
      },
      { message: "Monthly allowance must be zero or a positive amount" }
    ),
});

export type WizardStep3 = z.infer<typeof WizardStep3Schema>;
```

### 8.4 Step 4 Schema — Retirement Details

```typescript
import { SeparationPayBasisSchema } from "./enums";

export const WizardStep4Schema = z.object({
  hasBirApprovedPlan: z.boolean(),
  isFirstRetirement: z.boolean(),
  separationPayBasis: SeparationPayBasisSchema,
});

export type WizardStep4 = z.infer<typeof WizardStep4Schema>;
```

### 8.5 Step 5 Schema — Company Plan (Optional)

```typescript
import { CompanyPlanTypeSchema } from "./enums";

export const WizardStep5Schema = z
  .object({
    hasCompanyPlan: z.boolean(),
    companyPlanType: CompanyPlanTypeSchema,
    companyPlanAmountPesos: z.string(),
    companyPlanName: z.string().max(200),
  })
  .superRefine((data, ctx) => {
    if (data.hasCompanyPlan) {
      if (data.companyPlanType === "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a company plan type",
          path: ["companyPlanType"],
        });
      }
      const cleaned = data.companyPlanAmountPesos.replace(/[₱,\s]/g, "");
      const n = parseFloat(cleaned);
      if (isNaN(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company plan amount is required when plan is enabled",
          path: ["companyPlanAmountPesos"],
        });
      }
    }
  });

export type WizardStep5 = z.infer<typeof WizardStep5Schema>;
```

### 8.6 Batch Upload Form Schema

```typescript
export const BatchUploadFormSchema = z.object({
  batchName: z
    .string()
    .min(1, "Batch name is required")
    .max(200, "Must be 200 characters or fewer"),
  computationDate: IsoDateSchema,
  // file is validated separately (File object, not Zod)
});

export type BatchUploadForm = z.infer<typeof BatchUploadFormSchema>;
```

---

## 9. Database / Supabase Schemas

File: `schemas/db.ts`

### 9.1 `ComputationRecordSchema`

```typescript
import { z } from "zod";
import { ComputationModeSchema, ComputationStatusSchema } from "./enums";
import { RetirementInputSchema, BatchInputSchema } from "./engine-input";
import { RetirementOutputSchema, BatchOutputSchema } from "./engine-output";
import { UuidSchema, IsoDateSchema } from "./primitives";

export const ComputationRecordSchema = z
  .object({
    id: UuidSchema,
    userId: UuidSchema,
    organizationId: UuidSchema.nullable(),
    name: z.string().min(1).max(200),
    mode: ComputationModeSchema,
    status: ComputationStatusSchema,
    input: z.union([RetirementInputSchema, BatchInputSchema]),
    output: z
      .union([RetirementOutputSchema, BatchOutputSchema])
      .nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type ComputationRecord = z.infer<typeof ComputationRecordSchema>;
```

### 9.2 `SharedLinkSchema`

```typescript
export const SharedLinkSchema = z
  .object({
    id: UuidSchema,
    computationId: UuidSchema,
    token: UuidSchema,
    createdAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export type SharedLink = z.infer<typeof SharedLinkSchema>;
```

---

## 10. CSV Preview Schemas

Used for frontend-side CSV parsing preview before sending to WASM batch.

```typescript
import { CsvErrorKindSchema } from "./enums";
import { NonNegIntSchema } from "./primitives";

export const CsvPreviewErrorSchema = z.object({
  row: NonNegIntSchema.min(1),   // 1-based row number
  column: z.string().min(1),
  kind: CsvErrorKindSchema,
  message: z.string().min(1),
});

export const CsvParsePreviewSchema = z.object({
  filename: z.string().min(1),
  rowCount: NonNegIntSchema,
  columnHeaders: z.array(z.string()),
  previewRows: z.array(z.array(z.string())).max(5),
  errors: z.array(CsvPreviewErrorSchema),
});

export type CsvPreviewError = z.infer<typeof CsvPreviewErrorSchema>;
export type CsvParsePreview = z.infer<typeof CsvParsePreviewSchema>;
```

---

## 11. Parsing Patterns in the Bridge

Exact usage patterns for parsing WASM output with Zod:

```typescript
// apps/retirement-pay/frontend/src/lib/bridge.ts

import { SingleResultSchema, BatchResultSchema, NlrcResultSchema } from "../schemas";

export async function computeSingle(input: RetirementInput) {
  const wasm = await getModule();
  const raw = wasm.compute_single_json(JSON.stringify(input));
  // Throws ZodError if engine returns unexpected shape (should never happen)
  return SingleResultSchema.parse(JSON.parse(raw));
}

export async function computeBatch(input: BatchInput) {
  const wasm = await getModule();
  const raw = wasm.compute_batch_json(JSON.stringify(input));
  return BatchResultSchema.parse(JSON.parse(raw));
}

export async function generateNlrc(input: RetirementInput) {
  const wasm = await getModule();
  const raw = wasm.generate_nlrc_json(JSON.stringify(input));
  return NlrcResultSchema.parse(JSON.parse(raw));
}
```

**Error handling strategy:**

- `ZodError` from output parsing = engine bug (log to console, show generic error toast)
- `EngineError` from `{ Err: ... }` = user input problem (display field errors in form)
- Both are distinct code paths with distinct UI feedback

```typescript
import { isOk } from "../schemas/engine-error";

const result = await computeSingle(input);

if (isOk(result)) {
  // Navigate to results page with result.Ok
  navigate({ to: "/compute/$id/results", params: { id: computationId } });
} else {
  // result.Err: EngineError — display in form
  result.Err.fields.forEach((fieldErr) => {
    form.setError(fieldErr.field as keyof RetirementInput, {
      type: "server",
      message: fieldErr.message,
    });
  });
}
```

---

## 12. Validation Integration with React Hook Form

```typescript
// In wizard step component:
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WizardStep1Schema, type WizardStep1 } from "@/schemas/ui-forms";

export function Step1Form({ onNext }: { onNext: (data: WizardStep1) => void }) {
  const form = useForm<WizardStep1>({
    resolver: zodResolver(WizardStep1Schema),
    defaultValues: {
      employeeName: "",
      companyName: "",
      employerSize: "",
      workerCategory: "general",
      age: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)}>
        {/* FormField components */}
      </form>
    </Form>
  );
}
```

---

## 13. WizardFormState → RetirementInput Conversion

The wizard accumulates `WizardFormState` (string-based form fields). Before calling WASM,
convert to `RetirementInput`:

```typescript
import { parsePesosToCentavos } from "@/types/display";
import { RetirementInputSchema } from "@/schemas/engine-input";

export function formStateToInput(
  s1: WizardStep1,
  s2: WizardStep2,
  s3: WizardStep3,
  s4: WizardStep4,
  s5: WizardStep5
): RetirementInput {
  const raw = {
    employeeName: s1.employeeName,
    companyName: s1.companyName,
    employerSize: parseInt(s1.employerSize, 10),
    workerCategory: s1.workerCategory,
    age: parseInt(s1.age, 10),
    hireDate: s2.hireDate,
    retirementDate: s2.retirementDate,
    retirementType: s2.retirementType,
    basicSalaryCentavos: parsePesosToCentavos(s3.basicSalaryPesos) ?? 0,
    silDaysPerYear: parseInt(s3.silDaysPerYear, 10),
    hasThirteenthMonth: s3.hasThirteenthMonth,
    monthlyAllowanceCentavos:
      parsePesosToCentavos(s3.monthlyAllowancePesos) ?? 0,
    hasCompanyPlan: s5.hasCompanyPlan,
    companyPlanType: s5.hasCompanyPlan ? s5.companyPlanType : "none",
    companyPlanAmountCentavos: s5.hasCompanyPlan
      ? parsePesosToCentavos(s5.companyPlanAmountPesos)
      : null,
    companyPlanName: s5.hasCompanyPlan && s5.companyPlanName
      ? s5.companyPlanName
      : null,
    hasBirApprovedPlan: s4.hasBirApprovedPlan,
    isFirstRetirement: s4.isFirstRetirement,
    separationPayBasis: s4.separationPayBasis,
  };

  // Final validation before sending to engine (should not throw if wizard
  // validation passed, but catches conversion bugs)
  return RetirementInputSchema.parse(raw);
}
```

---

## 14. Cross-Reference: Schema → Type → Rust Struct

| Schema | Inferred Type | Rust Struct |
|--------|---------------|-------------|
| `RetirementInputSchema` | `RetirementInput` | `RetirementInput` |
| `BatchEmployeeInputSchema` | `BatchEmployeeInput` | `BatchEmployeeInput` |
| `BatchInputSchema` | `BatchInput` | `BatchInput` |
| `RetirementOutputSchema` | `RetirementOutput` | `RetirementOutput` |
| `BatchOutputSchema` | `BatchOutput` | `BatchOutput` |
| `BatchRowResultSchema` | `BatchRowResult` | `BatchRowResult` |
| `EligibilityResultSchema` | `EligibilityResult` | `EligibilityResult` |
| `SeparationPayComparisonSchema` | `SeparationPayComparison` | `SeparationPayComparison` |
| `CompanyPlanComparisonSchema` | `CompanyPlanComparison` | `CompanyPlanComparison` |
| `HalfMonthComponentsSchema` | `HalfMonthComponents` | `HalfMonthComponents` |
| `ComputationBreakdownSchema` | `ComputationBreakdown` | `ComputationBreakdown` |
| `NlrcWorksheetSchema` | `NlrcWorksheet` | `NlrcWorksheet` |
| `HalfMonthBreakdownSchema` | `HalfMonthBreakdown` | `HalfMonthBreakdown` |
| `ComputationRowSchema` | `ComputationRow` | `ComputationRow` |
| `NlrcRawCentavosSchema` | `NlrcRawCentavos` | `NlrcRawCentavos` |
| `EngineErrorSchema` | `EngineError` | `EngineError` |
| `FieldErrorSchema` | `FieldError` | `FieldError` |
| `WizardStep1Schema` | `WizardStep1` | — (UI only) |
| `WizardStep2Schema` | `WizardStep2` | — (UI only) |
| `WizardStep3Schema` | `WizardStep3` | — (UI only) |
| `WizardStep4Schema` | `WizardStep4` | — (UI only) |
| `WizardStep5Schema` | `WizardStep5` | — (UI only) |
| `ComputationRecordSchema` | `ComputationRecord` | — (Supabase only) |
| `SharedLinkSchema` | `SharedLink` | — (Supabase only) |

---

## 15. Key Schema Rules Summary

| Rule | Implementation |
|------|----------------|
| Strict mode on all wire schemas | `.strict()` on every `z.object()` for engine I/O |
| No coercion on booleans | `z.boolean()` — never `z.coerce.boolean()` |
| Nullable not optional on wire | `z.nullable()` — `z.optional()` only for UI-only fields with defaults |
| Integer centavos | `z.number().int()` — never `z.number()` alone for money |
| Date format enforced | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` |
| Enum exact strings | `z.enum([...])` — never `z.string()` for enum fields |
| Cross-field validation | `.superRefine()` — date ordering, plan conditional fields |
| UI forms use string inputs | Wizard schemas accept string fields, convert on submit |
| Bridge parsing catches bugs | `SingleResultSchema.parse()` — `ZodError` = engine contract breach |
| Type inference | `z.infer<typeof Schema>` — no manual type duplication |
