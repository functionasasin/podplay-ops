# Analysis: NLRC Worksheet UI — RA 7641 Retirement Pay Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** nlrc-worksheet-ui
**Date:** 2026-03-06
**Sources:** nlrc-worksheet-format.md, nlrc-worksheet-generator.md, typescript-types.md,
             zod-schemas.md, wizard-steps.md, company-plan-ui.md, data-model.md,
             serde-wire-format.md

---

## Overview

The NLRC Worksheet UI covers three surfaces:

1. **NLRC Input Dialog** — A multi-section form (accessible from `/compute/$id/results`) that
   collects case metadata, party names, attorney info, and flags before generating the worksheet.
2. **NLRC Worksheet View** — A screen-readable rendition of the generated worksheet at
   `/compute/$id/nlrc`, styled to resemble a Philippine legal document.
3. **PDF Export Trigger** — A "Download PDF" button on the worksheet view that triggers
   `@react-pdf/renderer` to generate the Legal-size PDF output.

---

## 1. NLRC Input Dialog

### File
`apps/retirement-pay/frontend/src/components/nlrc/NlrcInputDialog.tsx`

### Parent
`ResultsPage` at `/compute/$id/results` — "Generate NLRC Worksheet" button opens this dialog.

### Trigger
```tsx
// In ResultsPage:
<Button onClick={() => setNlrcDialogOpen(true)} variant="outline">
  <FileText className="mr-2 h-4 w-4" />
  Generate NLRC Worksheet
</Button>
```

### Component Structure

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>NLRC Money Claim Worksheet</DialogTitle>
      <DialogDescription>
        Generate a Statement of Computation suitable for filing as an NLRC exhibit
        or sending as a demand letter.
      </DialogDescription>
    </DialogHeader>
    <NlrcInputForm onSubmit={handleGenerate} defaultValues={defaultNlrcValues} />
  </DialogContent>
</Dialog>
```

### NlrcInputForm Sections

The form is divided into collapsible sections using shadcn `Accordion`:

#### Section A: Filing Mode Toggle

```tsx
<div className="space-y-2">
  <Label>Document Purpose</Label>
  <RadioGroup value={filingMode} onValueChange={setFilingMode}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="nlrc" id="mode-nlrc" />
      <Label htmlFor="mode-nlrc">NLRC Complaint Exhibit</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="demand" id="mode-demand" />
      <Label htmlFor="mode-demand">Pre-Filing Demand Letter Exhibit</Label>
    </div>
  </RadioGroup>
  <p className="text-sm text-muted-foreground">
    Demand letter mode omits case number, interest section, and changes the
    certification to a demand format.
  </p>
</div>
```

**Conditional visibility:** When `filingMode === "demand"`, hide fields: `caseNumber`,
`regionalBranch`, `dateFiled`, `includeInterest`. Force `includeInterest = false`.

#### Section B: Case Information (visible only when `filingMode === "nlrc"`)

| Field | Input Type | Required | Notes |
|---|---|---|---|
| `caseNumber` | `<Input>` | No | e.g. "NLRC-RAB-IV-12-0045-26"; placeholder: "TO BE ASSIGNED" |
| `regionalBranch` | `<Input>` | No | e.g. "Regional Arbitration Branch IV — Calamba City" |
| `exhibitLabel` | `<Input>` | Yes | Default `"A"`, max 3 chars |
| `dateFiled` | `<DateInput>` | No | Date filed; leave blank if not yet filed |

#### Section C: Parties

| Field | Input Type | Required | Notes |
|---|---|---|---|
| `complainantFullName` | `<Input>` | Yes | Pre-filled from computation: "DELA CRUZ, Juan Santos" |
| `complainantPosition` | `<Input>` | Yes | Pre-filled from computation wizard Step 1 |
| `respondentName` | `<Input>` | Yes | Pre-filled from computation wizard Step 1 (company name) |
| `respondentAddress` | `<Input>` | No | Optional; shown for completeness |

Pre-fill logic:
```typescript
// NlrcInputDialog.tsx
const defaultNlrcValues: NlrcFormData = {
  filingMode: "nlrc",
  caseNumber: null,
  regionalBranch: null,
  exhibitLabel: "A",
  dateFiled: null,
  // Pre-fill from computation input
  complainantFullName: `${computationInput.lastName.toUpperCase()}, ${computationInput.firstName} ${computationInput.middleName ?? ""}`.trim(),
  complainantPosition: computationInput.position ?? "",
  respondentName: computationInput.companyName,
  respondentAddress: null,
  // Attorney fields start empty
  preparedByName: null,
  attorneyRollNo: null,
  attorneyPtrNo: null,
  attorneyIbpNo: null,
  attorneyMcleNo: null,
  lawFirmName: null,
  lawFirmAddress: null,
  amountAlreadyPaidCentavos: null,
  dateOfDemand: null,
  includeInterest: false,
  includeEmployerComparison: true,
  includeTaxTreatment: true,
};
```

#### Section D: Prior Payment (Optional)

```tsx
<AccordionItem value="prior-payment">
  <AccordionTrigger>Prior Employer Payment (Optional)</AccordionTrigger>
  <AccordionContent className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Amount Already Paid by Employer</Label>
        <MoneyInput
          value={watch("amountAlreadyPaidCentavos")}
          onChange={(v) => setValue("amountAlreadyPaidCentavos", v)}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave blank if employer has not paid anything.
        </p>
      </div>
    </div>
  </AccordionContent>
</AccordionItem>
```

#### Section E: Interest Computation (hidden in demand mode)

```tsx
<AccordionItem value="interest">
  <AccordionTrigger>
    Legal Interest (Nacar v. Gallery Frames — 6% per annum)
  </AccordionTrigger>
  <AccordionContent className="space-y-4">
    <div className="flex items-center space-x-2">
      <Switch
        id="include-interest"
        checked={watch("includeInterest")}
        onCheckedChange={(v) => setValue("includeInterest", v)}
      />
      <Label htmlFor="include-interest">Include 6% interest computation</Label>
    </div>
    {watch("includeInterest") && (
      <div>
        <Label>Date of Demand / Date of Filing</Label>
        <DateInput
          value={watch("dateOfDemand")}
          onChange={(v) => setValue("dateOfDemand", v)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Interest accrues from this date at 6% per annum per Nacar v. Gallery Frames
          (G.R. No. 189871, August 13, 2013).
        </p>
      </div>
    )}
  </AccordionContent>
</AccordionItem>
```

**Validation:** If `includeInterest === true`, `dateOfDemand` is required.

#### Section F: Attorney Information (Optional)

```tsx
<AccordionItem value="attorney">
  <AccordionTrigger>Attorney / Counsel Information (Optional)</AccordionTrigger>
  <AccordionContent className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label>Prepared By (Attorney Name)</Label>
        <Input placeholder="Atty. Maria B. Reyes" {...register("preparedByName")} />
      </div>
      <div>
        <Label>Roll Number</Label>
        <Input placeholder="12345" {...register("attorneyRollNo")} />
      </div>
      <div>
        <Label>PTR Number</Label>
        <Input placeholder="PTR No. 2345678 / Jan. 5, 2026 / Makati City" {...register("attorneyPtrNo")} />
      </div>
      <div>
        <Label>IBP Number</Label>
        <Input placeholder="IBP No. 98765 / Jan. 3, 2026 / Makati" {...register("attorneyIbpNo")} />
      </div>
      <div>
        <Label>MCLE Compliance Number</Label>
        <Input placeholder="MCLE Compliance No. VI-0123456 / April 1, 2025" {...register("attorneyMcleNo")} />
      </div>
      <div>
        <Label>Law Firm Name</Label>
        <Input placeholder="Reyes & Associates Law Office" {...register("lawFirmName")} />
      </div>
      <div>
        <Label>Law Firm Address</Label>
        <Input placeholder="Suite 501, Alpha Tower, Makati City" {...register("lawFirmAddress")} />
      </div>
    </div>
  </AccordionContent>
</AccordionItem>
```

#### Section G: Display Flags

```tsx
<div className="space-y-3 pt-2">
  <div className="flex items-center space-x-2">
    <Checkbox
      id="employer-comparison"
      checked={watch("includeEmployerComparison")}
      onCheckedChange={(v) => setValue("includeEmployerComparison", !!v)}
    />
    <Label htmlFor="employer-comparison">
      Show 15-day vs 22.5-day employer error comparison
    </Label>
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox
      id="tax-treatment"
      checked={watch("includeTaxTreatment")}
      onCheckedChange={(v) => setValue("includeTaxTreatment", !!v)}
    />
    <Label htmlFor="tax-treatment">
      Include tax treatment section
    </Label>
  </div>
</div>
```

### Zod Schema (NlrcInputForm)

```typescript
// File: apps/retirement-pay/frontend/src/lib/schemas.ts

export const NlrcFilingModeSchema = z.enum(["nlrc", "demand"]);

export const NlrcInputSchema = z.object({
  filingMode: NlrcFilingModeSchema,
  caseNumber: z.string().max(60).nullable(),
  regionalBranch: z.string().max(120).nullable(),
  exhibitLabel: z.string().min(1).max(3),
  dateFiled: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  complainantFullName: z.string().min(1).max(200),
  complainantPosition: z.string().min(1).max(200),
  respondentName: z.string().min(1).max(200),
  respondentAddress: z.string().max(300).nullable(),
  preparedByName: z.string().max(200).nullable(),
  attorneyRollNo: z.string().max(50).nullable(),
  attorneyPtrNo: z.string().max(200).nullable(),
  attorneyIbpNo: z.string().max(200).nullable(),
  attorneyMcleNo: z.string().max(200).nullable(),
  lawFirmName: z.string().max(200).nullable(),
  lawFirmAddress: z.string().max(300).nullable(),
  amountAlreadyPaidCentavos: z.number().int().min(0).nullable(),
  dateOfDemand: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  includeInterest: z.boolean(),
  includeEmployerComparison: z.boolean(),
  includeTaxTreatment: z.boolean(),
}).strict().superRefine((data, ctx) => {
  if (data.includeInterest && data.dateOfDemand === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Date of demand is required when including interest computation",
      path: ["dateOfDemand"],
    });
  }
  if (data.filingMode === "nlrc" && data.exhibitLabel.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Exhibit label is required for NLRC filings",
      path: ["exhibitLabel"],
    });
  }
});
export type NlrcInputData = z.infer<typeof NlrcInputSchema>;
```

### Dialog Submit Handler

```typescript
// In NlrcInputDialog.tsx
const handleGenerate = async (formData: NlrcInputData) => {
  setGenerating(true);
  try {
    const input: NlrcGenerateInput = {
      retirement: computationInput,          // RetirementInput from saved computation
      nlrc: mapFormDataToNlrcInput(formData), // maps NlrcInputData -> NlrcWorksheetInput wire type
    };
    const result = await generateNlrcWorksheet(input); // calls WASM generate_nlrc_json
    if ("error" in result) {
      toast({ title: "Generation failed", description: result.error, variant: "destructive" });
      return;
    }
    onSuccess(result); // navigate to /compute/$id/nlrc with worksheet data
    onOpenChange(false);
  } finally {
    setGenerating(false);
  }
};
```

---

## 2. NLRC Worksheet View Page

### File
`apps/retirement-pay/frontend/src/pages/compute/NlrcWorksheetPage.tsx`

### Route
`/compute/$id/nlrc`

### Props Source
`NlrcWorksheetOutput` — loaded from route loader (stored in computation record in Supabase after generation) or from TanStack Router `state` (passed from the dialog on success).

### Page Layout

```tsx
export function NlrcWorksheetPage() {
  const { worksheetData } = useLoaderData<{ worksheetData: NlrcWorksheetOutput }>();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" asChild>
          <Link to="/compute/$id/results" params={{ id }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Document Rendition */}
      <NlrcWorksheetDocument data={worksheetData} />
    </div>
  );
}
```

### PDF Download Trigger (Action Trigger Map entry)

```typescript
// In NlrcWorksheetPage.tsx
const handleDownloadPdf = async () => {
  const toastId = toast({
    title: "Generating PDF...",
    description: "Preparing your NLRC worksheet PDF.",
  });
  try {
    const blob = await pdf(<NlrcWorksheetPdfDocument data={worksheetData} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nlrc-worksheet-${worksheetData.complainantFullName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "PDF downloaded", variant: "default" });
  } catch (err) {
    toast({ title: "PDF generation failed", description: String(err), variant: "destructive" });
  }
};
```

---

## 3. NlrcWorksheetDocument (Screen Rendition)

### File
`apps/retirement-pay/frontend/src/components/nlrc/NlrcWorksheetDocument.tsx`

### Purpose
Renders the NLRC worksheet as a styled React component (not PDF) for on-screen display.
Uses a "legal document" aesthetic: serif-style heading, bordered sections, monospace amounts.

### Component

```tsx
interface NlrcWorksheetDocumentProps {
  data: NlrcWorksheetOutput;
}

export function NlrcWorksheetDocument({ data }: NlrcWorksheetDocumentProps) {
  const isDemandMode = data.caseNumber === null && data.dateFiled === null;

  return (
    <Card className="font-serif bg-white border-2 border-gray-300 shadow-lg">
      <CardContent className="p-8 space-y-6">
        {/* Section A: Document Header */}
        <NlrcSectionHeader data={data} isDemandMode={isDemandMode} />
        {/* Section B: Employee Information */}
        <NlrcSectionEmployeeInfo data={data} />
        {/* Section C: Salary Basis */}
        <NlrcSectionSalaryBasis data={data} />
        {/* Section D: 22.5-Day Decomposition */}
        <NlrcSectionFormula data={data} />
        {/* Section E: Credited Years */}
        <NlrcSectionCreditedYears data={data} />
        {/* Section F: Retirement Pay Total */}
        <NlrcSectionRetirementTotal data={data} />
        {/* Section G: 15-Day Comparison (conditional) */}
        {data.includeEmployerComparison && (
          <NlrcSectionEmployerComparison data={data} />
        )}
        {/* Section H: Prior Payment (conditional) */}
        {data.amountAlreadyPaidCentavos !== null && (
          <NlrcSectionPriorPayment data={data} />
        )}
        {/* Section I: Interest (conditional) */}
        {data.includeInterestSection && data.interestCentavos !== null && (
          <NlrcSectionInterest data={data} />
        )}
        {/* Section J: Tax Treatment (conditional) */}
        {data.includeTaxSection && (
          <NlrcSectionTaxTreatment data={data} />
        )}
        {/* Section K: Legal Citations */}
        <NlrcSectionLegalCitations data={data} />
        {/* Section L: Certification */}
        <NlrcSectionCertification data={data} isDemandMode={isDemandMode} />
      </CardContent>
    </Card>
  );
}
```

---

## 4. Individual Section Components

### NlrcSectionHeader

```tsx
// apps/retirement-pay/frontend/src/components/nlrc/sections/NlrcSectionHeader.tsx
export function NlrcSectionHeader({ data, isDemandMode }: { data: NlrcWorksheetOutput; isDemandMode: boolean }) {
  return (
    <div className="text-center space-y-1 border-b-2 border-gray-800 pb-4">
      <p className="text-xs uppercase tracking-widest text-gray-500">Republic of the Philippines</p>
      <p className="text-xs uppercase tracking-widest text-gray-500">
        {data.regionalBranch ?? "National Labor Relations Commission"}
      </p>
      <h1 className="text-lg font-bold uppercase tracking-wide mt-3">
        Statement of Computation of Retirement Pay
      </h1>
      <p className="text-sm text-gray-600">
        (Pursuant to Republic Act No. 7641 and Article 302 of the Labor Code of the Philippines)
      </p>
      {!isDemandMode && (
        <div className="flex justify-between items-start mt-4 text-sm">
          <div className="text-left">
            {data.caseNumber && (
              <p><span className="font-semibold">NLRC Case No.:</span> {data.caseNumber}</p>
            )}
            {!data.caseNumber && (
              <p><span className="font-semibold">NLRC Case No.:</span> TO BE ASSIGNED</p>
            )}
          </div>
          <div className="text-right">
            <Badge variant="outline" className="font-bold text-base px-3 py-1">
              EXHIBIT &ldquo;{data.exhibitLabel}&rdquo;
            </Badge>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-sm text-left mt-3">
        <p><span className="font-semibold">Complainant:</span> {data.complainantFullName}</p>
        <p><span className="font-semibold">Respondent:</span> {data.respondentName}</p>
      </div>
    </div>
  );
}
```

### NlrcSectionFormula (22.5-Day Decomposition) — Key Section

```tsx
// apps/retirement-pay/frontend/src/components/nlrc/sections/NlrcSectionFormula.tsx
export function NlrcSectionFormula({ data }: { data: NlrcWorksheetOutput }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
        Decomposition of &ldquo;One-Half (1/2) Month Salary&rdquo;
      </h2>
      <p className="text-xs text-gray-600 italic">
        RA 7641, Section 1; IRR Rule II, Section 5; <em>Elegir v. Philippine Airlines, Inc.</em>,
        G.R. No. 181995
      </p>
      <Table className="text-sm font-mono">
        <TableBody>
          <TableRow>
            <TableCell className="w-2/3">
              Component A: Fifteen (15) Days Basic Salary
              <br />
              <span className="text-xs text-gray-500 font-sans">
                {formatMoney(data.dailyRateCentavos)} daily rate × 15 days
              </span>
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatMoney(data.componentACentavos)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Component B: Service Incentive Leave (SIL) — Five (5) Days
              <br />
              <span className="text-xs text-gray-500 font-sans">
                {formatMoney(data.dailyRateCentavos)} daily rate × 5 days
              </span>
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatMoney(data.componentBCentavos)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Component C: 1/12 of 13th Month Pay — 2.5 Days
              <br />
              <span className="text-xs text-gray-500 font-sans">
                {formatMoney(data.monthlySalaryCentavos)} monthly salary ÷ 12
              </span>
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatMoney(data.componentCCentavos)}
            </TableCell>
          </TableRow>
          <TableRow className="bg-gray-50 border-t-2 border-gray-800">
            <TableCell className="font-bold">
              &ldquo;One-Half Month Salary&rdquo; (22.5 days total)
            </TableCell>
            <TableCell className="text-right font-bold text-lg">
              {formatMoney(data.halfMonthSalaryCentavos)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-xs text-gray-500 italic">
        Note: Individual component amounts are approximate due to integer division of the daily rate.
        The retirement pay total uses the exact formula: Monthly Salary × 45/52 × Credited Years.
      </p>
    </div>
  );
}
```

### NlrcSectionEmployerComparison

```tsx
// apps/retirement-pay/frontend/src/components/nlrc/sections/NlrcSectionEmployerComparison.tsx
export function NlrcSectionEmployerComparison({ data }: { data: NlrcWorksheetOutput }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
        Common Employer Error vs. Correct Computation
      </h2>
      <Alert variant="destructive" className="text-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Many employers compute using only 15 days, underpaying retirees by exactly 33%.
          The 22.5-day formula has been confirmed by the Supreme Court.
        </AlertDescription>
      </Alert>
      <Table className="text-sm font-mono">
        <TableBody>
          <TableRow>
            <TableCell className="w-2/3 text-gray-500">
              Erroneous computation (15 days only)
              <br />
              <span className="text-xs font-sans">
                {formatMoney(data.dailyRateCentavos)} × 15 × {data.creditedYears} years
              </span>
            </TableCell>
            <TableCell className="text-right line-through text-gray-400">
              {formatMoney(data.fifteenDayTotalCentavos)}
            </TableCell>
          </TableRow>
          <TableRow className="bg-green-50">
            <TableCell className="font-semibold">
              Correct computation per RA 7641 (22.5 days)
            </TableCell>
            <TableCell className="text-right font-bold text-green-700">
              {formatMoney(data.retirementPayCentavos)}
            </TableCell>
          </TableRow>
          <TableRow className="bg-red-50">
            <TableCell className="font-semibold text-red-700">
              Underpayment (33% shortfall)
            </TableCell>
            <TableCell className="text-right font-bold text-red-700">
              {formatMoney(data.underpaymentCentavos)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
```

### NlrcSectionTaxTreatment

```tsx
// apps/retirement-pay/frontend/src/components/nlrc/sections/NlrcSectionTaxTreatment.tsx
export function NlrcSectionTaxTreatment({ data }: { data: NlrcWorksheetOutput }) {
  const isExempt = data.taxTreatment === "exemptMandatory" || data.taxTreatment === "exemptBirApproved";
  const requiresVerification = data.taxTreatment === "requiresVerification";

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
        Tax Treatment
      </h2>
      <Alert
        variant={isExempt ? "default" : requiresVerification ? "default" : "destructive"}
        className={isExempt ? "border-green-500 text-green-800 bg-green-50" : ""}
      >
        {isExempt
          ? <CheckCircle className="h-4 w-4 text-green-600" />
          : requiresVerification
            ? <AlertCircle className="h-4 w-4 text-yellow-600" />
            : <XCircle className="h-4 w-4" />
        }
        <AlertDescription className="text-sm leading-relaxed whitespace-pre-line">
          {data.taxTreatmentNarrative}
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

### NlrcSectionLegalCitations

```tsx
// apps/retirement-pay/frontend/src/components/nlrc/sections/NlrcSectionLegalCitations.tsx
export function NlrcSectionLegalCitations({ data }: { data: NlrcWorksheetOutput }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
        Legal Basis
      </h2>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>
          <strong>Republic Act No. 7641</strong> (The New Retirement Pay Law, December 9, 1992)
          &mdash; Section 1, amending Article 287 (now Art. 302) of the Labor Code. Defines
          &ldquo;one-half (1/2) month salary&rdquo; as 15 days + 5 days SIL + 1/12 of 13th month pay.
        </li>
        <li>
          <strong>Presidential Decree No. 442</strong> (Labor Code of the Philippines), Article 302
          &mdash; Retirement pay equivalent to at least one-half (1/2) month salary for every year
          of service.
        </li>
        <li>
          <em>Elegir v. Philippine Airlines, Inc.</em>, G.R. No. 181995 &mdash; Supreme Court
          confirmation: &ldquo;one-half (1/2) month salary means 22.5 days.&rdquo;
        </li>
        <li>
          <strong>Implementing Rules and Regulations (IRR) of RA 7641</strong>, Rule II, Section 5
          &mdash; &ldquo;Total effective days: 22.5 days (15 + 5 + 2.5)&rdquo;
        </li>
        {data.includeInterestSection && (
          <li>
            <em>Nacar v. Gallery Frames</em>, G.R. No. 189871 (August 13, 2013) &mdash; Legal
            interest at 6% per annum on monetary judgments and quasi-judicial awards.
          </li>
        )}
      </ol>
    </div>
  );
}
```

### NlrcSectionCertification

```tsx
// apps/retirement-pay/frontend/src/components/nlrc/sections/NlrcSectionCertification.tsx
export function NlrcSectionCertification({ data, isDemandMode }: { data: NlrcWorksheetOutput; isDemandMode: boolean }) {
  return (
    <div className="space-y-4 border-t-2 border-gray-800 pt-4">
      <h2 className="text-sm font-bold uppercase tracking-wide">
        {isDemandMode ? "Demand for Payment" : "Certification"}
      </h2>
      {isDemandMode ? (
        <p className="text-sm leading-relaxed">
          On behalf of <strong>{data.complainantFullName}</strong>, demand is hereby made upon{" "}
          <strong>{data.respondentName}</strong> for payment of the above-computed retirement pay
          in the amount of <strong>{formatMoney(data.balanceDueCentavos)}</strong> within five (5)
          days from receipt hereof, otherwise appropriate legal action will be filed without
          further notice.
        </p>
      ) : (
        <p className="text-sm leading-relaxed">
          I, <strong>{data.complainantFullName}</strong>, of legal age, after having been duly
          sworn in accordance with law, depose and state that the foregoing computation is true
          and correct to the best of my knowledge and belief, based on actual employment records.
        </p>
      )}
      <div className="grid grid-cols-2 gap-8 mt-6">
        <div className="space-y-8">
          <div className="border-b border-gray-600 pt-8">
            <p className="text-xs text-gray-600">Complainant / Authorized Representative</p>
            <p className="text-sm font-semibold">{data.complainantFullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Date</p>
            <p className="text-sm">{data.datePrepared}</p>
          </div>
        </div>
        {data.preparedByName && (
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Prepared by:</p>
            <p>{data.preparedByName}</p>
            {data.attorneyRollNo && <p>Roll No.: {data.attorneyRollNo}</p>}
            {data.attorneyPtrNo && <p>{data.attorneyPtrNo}</p>}
            {data.attorneyIbpNo && <p>{data.attorneyIbpNo}</p>}
            {data.attorneyMcleNo && <p>{data.attorneyMcleNo}</p>}
            {data.lawFirmName && <p className="font-semibold mt-2">{data.lawFirmName}</p>}
            {data.lawFirmAddress && <p className="text-gray-600">{data.lawFirmAddress}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 5. PDF Document Component

### File
`apps/retirement-pay/frontend/src/components/nlrc/NlrcWorksheetPdfDocument.tsx`

### Purpose
`@react-pdf/renderer` version of the worksheet. Legal-size paper, Times New Roman,
Philippine court document conventions. This is a SEPARATE component from the screen
rendition — it uses `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Text`),
not HTML/Tailwind.

### Component Skeleton

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    size: "LEGAL",             // 8.5" × 13"
    orientation: "portrait",
    marginTop: 72,             // 1.0" in points (72pt/inch)
    marginBottom: 72,
    marginLeft: 90,            // 1.25" in points
    marginRight: 90,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.4,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    borderBottom: "1pt solid #333",
    paddingBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #ccc",
    paddingVertical: 3,
  },
  monoAmount: {
    fontFamily: "Courier",
    fontSize: 11,
  },
  boldText: {
    fontFamily: "Times-Bold",
  },
  // ... additional styles
});

export function NlrcWorksheetPdfDocument({ data }: { data: NlrcWorksheetOutput }) {
  const isDemandMode = data.caseNumber === null && data.dateFiled === null;

  return (
    <Document>
      <Page style={styles.page}>
        <NlrcPdfHeader data={data} isDemandMode={isDemandMode} />
        <NlrcPdfEmployeeInfo data={data} />
        <NlrcPdfSalaryBasis data={data} />
        <NlrcPdfFormula data={data} />
        <NlrcPdfCreditedYears data={data} />
        <NlrcPdfRetirementTotal data={data} />
        {data.includeEmployerComparison && <NlrcPdfEmployerComparison data={data} />}
        {data.amountAlreadyPaidCentavos !== null && <NlrcPdfPriorPayment data={data} />}
        {data.includeInterestSection && data.interestCentavos !== null && (
          <NlrcPdfInterest data={data} />
        )}
        {data.includeTaxSection && <NlrcPdfTaxTreatment data={data} />}
        <NlrcPdfLegalCitations data={data} />
        <NlrcPdfCertification data={data} isDemandMode={isDemandMode} />
      </Page>
    </Document>
  );
}
```

---

## 6. NLRC Worksheet TypeScript Types (Frontend)

Matching the `NlrcWorksheetOutput` Rust struct via serde camelCase:

```typescript
// File: apps/retirement-pay/frontend/src/types/nlrc.ts

export interface NlrcWorksheetOutput {
  // Parties
  complainantFullName: string;
  complainantPosition: string;
  respondentName: string;
  exhibitLabel: string;

  // Case metadata
  caseNumber: string | null;
  regionalBranch: string | null;
  dateFiled: string | null;          // "March 6, 2026" formatted
  datePrepared: string;              // "March 6, 2026" formatted

  // Employee info
  birthDateFormatted: string;        // "March 15, 1964"
  hireDateFormatted: string;         // "January 1, 1994"
  retirementDateFormatted: string;   // "March 15, 2024"
  ageAtRetirement: number;
  fullYearsService: number;
  partialMonths: number;
  roundingApplied: boolean;
  creditedYears: number;

  // Salary
  monthlySalaryCentavos: number;
  dailyRateCentavos: number;
  salaryDivisor: number;             // 26 or 22

  // 22.5-day components
  componentACentavos: number;        // 15 days
  componentBCentavos: number;        // 5 days SIL
  componentCCentavos: number;        // 1/12 thirteenth month
  halfMonthSalaryCentavos: number;

  // Retirement pay
  retirementPayCentavos: number;

  // 15-day comparison
  fifteenDayDailyCentavos: number;
  fifteenDayPerYearCentavos: number;
  fifteenDayTotalCentavos: number;
  underpaymentCentavos: number;

  // Payments
  amountAlreadyPaidCentavos: number | null;
  balanceDueCentavos: number;

  // Interest
  includeInterestSection: boolean;
  dateOfDemandFormatted: string | null;
  dateOfComputationFormatted: string | null;
  daysElapsed: number | null;
  interestCentavos: number | null;
  totalDueWithInterestCentavos: number | null;

  // Tax treatment
  taxTreatment: TaxTreatment;         // from shared types
  taxTreatmentNarrative: string;      // pre-formatted paragraph

  // Flags
  includeEmployerComparison: boolean;
  includeTaxSection: boolean;

  // Attorney
  preparedByName: string | null;
  attorneyRollNo: string | null;
  attorneyPtrNo: string | null;
  attorneyIbpNo: string | null;
  attorneyMcleNo: string | null;
  lawFirmName: string | null;
  lawFirmAddress: string | null;
}

// Combined input sent to generate_nlrc_json WASM function
export interface NlrcGenerateInput {
  retirement: RetirementInput;
  nlrc: NlrcWorksheetInput;
}

export interface NlrcWorksheetInput {
  caseNumber: string | null;
  regionalBranch: string | null;
  exhibitLabel: string;
  dateFiled: string | null;          // "YYYY-MM-DD"
  complainantFullName: string;
  complainantPosition: string;
  respondentName: string;
  respondentAddress: string | null;
  preparedByName: string | null;
  attorneyRollNo: string | null;
  attorneyPtrNo: string | null;
  attorneyIbpNo: string | null;
  attorneyMcleNo: string | null;
  lawFirmName: string | null;
  lawFirmAddress: string | null;
  amountAlreadyPaidCentavos: number | null;
  dateOfDemand: string | null;       // "YYYY-MM-DD"
  includeInterest: boolean;
  includeEmployerComparison: boolean;
  includeTaxTreatment: boolean;
}
```

---

## 7. Utility: formatMoney

```typescript
// File: apps/retirement-pay/frontend/src/lib/format.ts

/**
 * Format integer centavos as Philippine peso string.
 * e.g. 5192307 => "PHP 51,923.07"
 */
export function formatMoney(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}
```

---

## 8. Route and Navigation

### Route File
`apps/retirement-pay/frontend/src/pages/compute/$id.nlrc.tsx`
(TanStack Router file-based; `$id` is the computation UUID)

### Loader

```typescript
export const Route = createFileRoute("/compute/$id/nlrc")({
  loader: async ({ params, context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("computations")
      .select("nlrc_worksheet_output")
      .eq("id", params.id)
      .single();
    if (error || !data?.nlrc_worksheet_output) {
      throw redirect({ to: `/compute/${params.id}/results` });
    }
    return { worksheetData: data.nlrc_worksheet_output as NlrcWorksheetOutput };
  },
  component: NlrcWorksheetPage,
});
```

### Navigation from Results Page

```tsx
// In ResultsPage, after successful NLRC generation:
const onNlrcSuccess = (result: NlrcWorksheetOutput) => {
  // Save to Supabase computations.nlrc_worksheet_output
  await saveNlrcWorksheet(computationId, result);
  // Navigate to worksheet view
  navigate({ to: "/compute/$id/nlrc", params: { id: computationId } });
};
```

---

## 9. Batch NLRC Mode

For batch computations, the NLRC worksheet is accessed from `/batch/$id` via a
"Generate NLRC Worksheets" button. The batch NLRC input uses a simplified dialog
(shared case metadata, per-employee data pre-filled from batch results).

### File
`apps/retirement-pay/frontend/src/components/nlrc/NlrcBatchInputDialog.tsx`

### Route for Batch NLRC View
`/batch/$id/nlrc` — renders a multi-page document with one section per eligible employee.

### Batch TypeScript Types

```typescript
export interface NlrcBatchInput {
  caseNumber: string | null;
  respondentName: string;
  exhibitLabel: string;
  dateFiled: string | null;
  preparedByName: string | null;
  attorneyRollNo: string | null;
  attorneyPtrNo: string | null;
  attorneyIbpNo: string | null;
  attorneyMcleNo: string | null;
  lawFirmName: string | null;
  lawFirmAddress: string | null;
  includeInterest: boolean;
  includeEmployerComparison: boolean;
  includeTaxTreatment: boolean;
  employees: NlrcEmployeeItem[];
}

export interface NlrcEmployeeItem {
  employeeId: string;
  complainantFullName: string;
  complainantPosition: string | null;
  amountAlreadyPaidCentavos: number | null;
  dateOfDemand: string | null;       // Per-employee interest start date
  // All computation fields from BatchEmployeeResult
  monthlySalaryCentavos: number;
  creditedYears: number;
  retirementPayCentavos: number;
  halfMonthSalaryCentavos: number;
  componentACentavos: number;
  componentBCentavos: number;
  componentCCentavos: number;
  dailyRateCentavos: number;
  fifteenDayTotalCentavos: number;
  underpaymentCentavos: number;
  taxTreatment: TaxTreatment;
  taxTreatmentNarrative: string;
}

export interface NlrcBatchOutput {
  employees: NlrcWorksheetOutput[];   // One per employee
  totalRetirementPayCentavos: number;
  totalBalanceDueCentavos: number;
  totalInterestCentavos: number | null;
  employeeCount: number;
}
```

---

## 10. Empty States and Error States

### No Worksheet Generated Yet
Route `/compute/$id/nlrc` redirects to `/compute/$id/results` if no worksheet data exists.
A banner on the results page guides the user:

```tsx
{!hasNlrcWorksheet && (
  <Alert className="border-blue-200 bg-blue-50">
    <FileText className="h-4 w-4 text-blue-600" />
    <AlertTitle className="text-blue-800">NLRC Worksheet Not Yet Generated</AlertTitle>
    <AlertDescription className="text-blue-700">
      Click &ldquo;Generate NLRC Worksheet&rdquo; to create a formatted Statement of Computation
      suitable for filing as an NLRC exhibit or demand letter.
    </AlertDescription>
  </Alert>
)}
```

### Generation Error
If `generate_nlrc_json` returns an error:
```tsx
toast({
  title: "Worksheet generation failed",
  description: errorResult.error,
  variant: "destructive",
});
// Dialog stays open; user can fix inputs and retry
```

---

## 11. Visual Verification Checklist

| Component | shadcn Wrapper | Key Tailwind | Icon | Color Variant |
|---|---|---|---|---|
| `NlrcInputDialog` | `Dialog` + `DialogContent` | `max-w-2xl max-h-[90vh] overflow-y-auto` | `FileText` | default |
| `NlrcWorksheetDocument` | `Card` | `font-serif bg-white border-2 border-gray-300 shadow-lg` | — | — |
| `NlrcSectionHeader` | none (div) | `text-center border-b-2 border-gray-800` | — | — |
| `NlrcSectionFormula` | `Table` | `font-mono text-sm` | — | — |
| Exhibit label | `Badge` | `font-bold text-base px-3 py-1` variant="outline" | — | outline |
| `NlrcSectionEmployerComparison` | `Alert` + `Table` | `border-destructive` | `AlertCircle` | destructive |
| `NlrcSectionTaxTreatment` — exempt | `Alert` | `border-green-500 bg-green-50` | `CheckCircle` | custom green |
| `NlrcSectionTaxTreatment` — verify | `Alert` | `border-yellow-500 bg-yellow-50` | `AlertCircle` | custom yellow |
| `NlrcSectionTaxTreatment` — taxable | `Alert` | default | `XCircle` | destructive |
| No worksheet banner | `Alert` | `border-blue-200 bg-blue-50` | `FileText` | custom blue |
| Download PDF button | `Button` | default | `Download` | default |
| Print button | `Button` | variant="outline" | `Printer` | outline |
| Back link | `Button` asChild | variant="ghost" | `ArrowLeft` | ghost |

---

## 12. Summary

The NLRC Worksheet UI has three surfaces: (1) `NlrcInputDialog` — a multi-section Accordion
form at `/compute/$id/results` that collects case metadata, parties, attorney info, and flags;
it pre-fills from existing computation data and validates cross-field rules (dateOfDemand required
when includeInterest = true); (2) `NlrcWorksheetDocument` — a screen rendition at
`/compute/$id/nlrc` styled like a Philippine legal document with Card wrapper, serif font,
bordered section headings, and 12 conditional sub-components; (3) `NlrcWorksheetPdfDocument` —
a separate `@react-pdf/renderer` component producing a Legal-size (8.5"×13") PDF with Times
New Roman font and Philippine court document margins. The "Download PDF" button in
`NlrcWorksheetPage` is the explicit action trigger that calls `pdf(...).toBlob()` and creates a
download link. All monetary values formatted via `formatMoney()` (Intl.NumberFormat en-PH).
Batch NLRC mode at `/batch/$id/nlrc` uses `NlrcBatchInputDialog` and renders multi-employee output.
