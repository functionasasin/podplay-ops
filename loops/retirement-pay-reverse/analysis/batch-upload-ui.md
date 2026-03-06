# Analysis: Batch Upload UI

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** batch-upload-ui
**Date:** 2026-03-06
**Sources:** batch-computation-rules.md, batch-engine.md, typescript-types.md, wizard-steps.md

---

## Overview

The batch upload UI allows HR departments to upload a CSV of employees and receive RA 7641 retirement pay computations for each row. The entire flow lives at `/batch/new` (upload + compute) and `/batch/$id` (results). There is no multi-step wizard — the user selects a file, sees a preview, clicks Compute, and gets a results table.

State machine:
```
idle → file-selected → previewing → computing → results
                                              ↘ error (batch-level)
```

---

## 1. Route and Page Component

### `/batch/new` — `BatchNewPage`

**File:** `apps/retirement-pay/frontend/src/pages/batch/new.tsx`
**Auth required:** yes (redirect to `/auth` if not authenticated)

```tsx
export function BatchNewPage() {
  const [state, dispatch] = useReducer(batchReducer, initialBatchState);
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Batch Retirement Pay Computation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV of employees to compute RA 7641 retirement pay for each row.
          Maximum 5,000 employees per batch.
        </p>
      </div>

      {state.phase === "idle" && (
        <CsvDropZone onFile={(file) => dispatch({ type: "FILE_SELECTED", file })} />
      )}

      {state.phase === "file-selected" && (
        <FilePreviewCard
          file={state.file!}
          preview={state.preview!}
          onClear={() => dispatch({ type: "CLEAR" })}
          onCompute={() => dispatch({ type: "COMPUTE_START" })}
        />
      )}

      {state.phase === "computing" && (
        <ComputingProgressCard filename={state.file!.name} />
      )}

      {state.phase === "error" && (
        <BatchErrorCard error={state.batchError!} onRetry={() => dispatch({ type: "CLEAR" })} />
      )}

      {/* results phase: navigate away to /batch/$id */}
    </div>
  );
}
```

### `/batch/$id` — `BatchResultsPage`

**File:** `apps/retirement-pay/frontend/src/pages/batch/$id.tsx`
**Auth required:** yes
**URL param:** `$id` is the UUID of the saved batch computation record

```tsx
export function BatchResultsPage() {
  const { id } = useParams({ from: "/batch/$id" });
  const { data: record, isLoading, error } = useBatchRecord(id);

  if (isLoading) return <BatchResultsSkeleton />;
  if (error || !record) return <BatchLoadError />;

  const output = record.output as BatchOutput;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <BatchResultsHeader record={record} output={output} />
      <BatchSummaryCard output={output} />
      <BatchResultsTable output={output} />
    </div>
  );
}
```

---

## 2. State Management

### `batchReducer`

```typescript
// File: apps/retirement-pay/frontend/src/pages/batch/useBatchReducer.ts

type BatchPhase = "idle" | "file-selected" | "computing" | "results" | "error";

interface BatchState {
  phase: BatchPhase;
  file: File | null;
  preview: CsvParsePreview | null;
  batchError: string | null;  // batch-level error message (not row errors)
}

type BatchAction =
  | { type: "FILE_SELECTED"; file: File; preview: CsvParsePreview }
  | { type: "CLEAR" }
  | { type: "COMPUTE_START" }
  | { type: "COMPUTE_ERROR"; error: string }
  | { type: "COMPUTE_SUCCESS" };  // navigation happens outside reducer

const initialBatchState: BatchState = {
  phase: "idle",
  file: null,
  preview: null,
  batchError: null,
};

function batchReducer(state: BatchState, action: BatchAction): BatchState {
  switch (action.type) {
    case "FILE_SELECTED":
      return { ...state, phase: "file-selected", file: action.file, preview: action.preview, batchError: null };
    case "CLEAR":
      return initialBatchState;
    case "COMPUTE_START":
      return { ...state, phase: "computing" };
    case "COMPUTE_ERROR":
      return { ...state, phase: "error", batchError: action.error };
    case "COMPUTE_SUCCESS":
      return { ...state, phase: "results" };
    default:
      return state;
  }
}
```

---

## 3. Component: `CsvDropZone`

**File:** `apps/retirement-pay/frontend/src/components/batch/CsvDropZone.tsx`

### Props
```typescript
interface CsvDropZoneProps {
  onFile: (file: File, preview: CsvParsePreview) => void;
}
```

### Behavior
1. User can drag a `.csv` file onto the zone or click "Choose file" to open the system file picker.
2. On file selection: validate file type (`.csv`, MIME `text/csv` or `application/csv`), validate size (≤ 10 MB).
3. If invalid: show inline error inside the drop zone (do NOT navigate away). Reset to accept another file.
4. If valid: read file content via `FileReader.readAsText(file, 'UTF-8')`, then run `parsePreview(content)` to produce a `CsvParsePreview`, then call `onFile(file, preview)`.

### `parsePreview(content: string): CsvParsePreview`
Client-side preview parser (no WASM call). Runs synchronously.
- Parse header row → `columnHeaders: string[]`
- Count data rows (non-empty, non-comment) → `rowCount: number`
- Extract first 5 data rows as `string[][]` → `previewRows`
- Check for required columns: `employee_id`, `employee_name`, `birth_date`, `hire_date`, `retirement_date`, `monthly_salary`, `worker_category`, `employer_employee_count`, `employer_type`. Missing columns → `errors`.

**Required column list** (case-insensitive, underscore or space):
```typescript
const REQUIRED_COLUMNS = [
  "employee_id",
  "employee_name",
  "birth_date",
  "hire_date",
  "retirement_date",
  "monthly_salary",
  "worker_category",
  "employer_employee_count",
  "employer_type",
] as const;
```

### Validation Error Messages
| Condition | Message shown in drop zone |
|---|---|
| Wrong file type | "Please upload a CSV file (.csv)" |
| File > 10 MB | "File is too large. Maximum size is 10 MB." |
| Empty file (0 bytes) | "The file appears to be empty." |
| Missing required columns | "Missing required columns: {list}" |

### Visual States

**Idle state:**
```tsx
<div
  className={cn(
    "flex flex-col items-center justify-center",
    "rounded-xl border-2 border-dashed border-gray-300",
    "bg-gray-50 px-8 py-16 text-center",
    "transition-colors cursor-pointer",
    "hover:border-blue-400 hover:bg-blue-50",
    isDragging && "border-blue-500 bg-blue-100",
  )}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onClick={() => fileInputRef.current?.click()}
>
  <UploadCloud className="h-10 w-10 text-gray-400 mb-3" />
  <p className="text-sm font-medium text-gray-700">
    Drag and drop a CSV file, or <span className="text-blue-600 underline">browse</span>
  </p>
  <p className="mt-1 text-xs text-gray-400">
    .csv format · max 10 MB · max 5,000 employees
  </p>
  <input
    ref={fileInputRef}
    type="file"
    accept=".csv,text/csv,application/csv"
    className="hidden"
    onChange={handleInputChange}
  />
</div>
```

**Dragging state:** border becomes `border-blue-500`, background `bg-blue-100`.

**Error state:** red border `border-red-400`, inline `<p className="mt-3 text-sm text-red-600">` below the icon.

**Reading state** (after valid file selected, before preview ready): show spinner inside zone:
```tsx
<div className="flex items-center gap-2 text-gray-500">
  <Loader2 className="h-5 w-5 animate-spin" />
  <span className="text-sm">Reading file…</span>
</div>
```

### Template Download
Below the drop zone, a "Download CSV template" link lets users download a minimal valid CSV:
```tsx
<div className="mt-4 text-center">
  <Button variant="link" size="sm" onClick={downloadTemplate} className="text-gray-500">
    <Download className="h-3.5 w-3.5 mr-1" />
    Download CSV template
  </Button>
</div>
```
`downloadTemplate()` creates a Blob from a hardcoded CSV string and triggers a download.

**Template CSV content:**
```csv
employee_id,employee_name,birth_date,hire_date,retirement_date,monthly_salary,worker_category,employer_employee_count,employer_type,salary_divisor,has_company_plan,company_plan_monthly_benefit,notes
EMP001,Juan dela Cruz,1964-03-15,1994-01-01,2024-03-15,20000.00,general,50,general,26,false,,
EMP002,Maria Santos,1960-06-01,1994-07-01,2025-06-01,35000.00,general,100,general,26,true,5000.00,Sample with company plan
```

---

## 4. Component: `FilePreviewCard`

**File:** `apps/retirement-pay/frontend/src/components/batch/FilePreviewCard.tsx`

Shown after a valid file is selected and preview is ready.

### Props
```typescript
interface FilePreviewCardProps {
  file: File;
  preview: CsvParsePreview;
  onClear: () => void;
  onCompute: () => void;
}
```

### Layout

```tsx
<Card>
  <CardHeader className="pb-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <CardTitle className="text-base">{preview.filename}</CardTitle>
          <CardDescription>
            {formatFileSize(file.size)} · {preview.rowCount.toLocaleString()} employee rows detected
          </CardDescription>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClear} aria-label="Remove file">
        <X className="h-4 w-4" />
      </Button>
    </div>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Preview errors (missing columns) */}
    {preview.errors.length > 0 && (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>CSV validation errors</AlertTitle>
        <AlertDescription>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            {preview.errors.map((e, i) => (
              <li key={i} className="text-sm">
                Row {e.row}, column "{e.column}": {e.message}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )}

    {/* Column headers */}
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Detected columns</p>
      <div className="flex flex-wrap gap-1.5">
        {preview.columnHeaders.map((col) => (
          <Badge
            key={col}
            variant={REQUIRED_COLUMNS.includes(col.toLowerCase().replace(/ /g, "_")) ? "default" : "secondary"}
          >
            {col}
          </Badge>
        ))}
      </div>
    </div>

    {/* Data preview table (first 5 rows) */}
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preview (first {preview.previewRows.length} rows)</p>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {preview.columnHeaders.map((col) => (
                <TableHead key={col} className="whitespace-nowrap text-xs">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.previewRows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className="text-xs whitespace-nowrap">{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  </CardContent>

  <CardFooter className="flex justify-between">
    <Button variant="outline" onClick={onClear}>
      <X className="h-4 w-4 mr-2" />
      Choose different file
    </Button>
    <Button
      onClick={onCompute}
      disabled={preview.errors.some((e) => e.kind === "missingColumn")}
    >
      <Calculator className="h-4 w-4 mr-2" />
      Compute {preview.rowCount.toLocaleString()} employees
    </Button>
  </CardFooter>
</Card>
```

**Compute button disabled condition:** any `CsvPreviewError` with `kind === "missingColumn"`. Other preview errors (invalid date in preview row, etc.) are warnings only — the engine will handle them per-row.

---

## 5. Component: `ComputingProgressCard`

**File:** `apps/retirement-pay/frontend/src/components/batch/ComputingProgressCard.tsx`

Shown while WASM batch computation is in progress.

WASM is synchronous, so no real progress tracking is possible. Show an indeterminate spinner with a message.

```tsx
<Card>
  <CardContent className="py-12 flex flex-col items-center gap-4">
    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    <div className="text-center">
      <p className="text-base font-medium text-gray-800">Computing retirement pay…</p>
      <p className="text-sm text-gray-500 mt-1">Processing {filename}</p>
      <p className="text-xs text-gray-400 mt-3">This may take a few seconds for large batches.</p>
    </div>
  </CardContent>
</Card>
```

**Implementation note:** Because WASM is synchronous and will block the main thread, the computation is wrapped in a 1-tick `setTimeout` so the browser can render the progress card before blocking:

```typescript
// In BatchNewPage's useEffect when phase === "computing":
useEffect(() => {
  if (state.phase !== "computing") return;

  const timer = setTimeout(async () => {
    try {
      const { computeBatchJson } = await getBridge();
      const csvContent = await readFileAsText(state.file!);
      const rawOutput = computeBatchJson(JSON.stringify({ csvContent }));
      const result: EngineResult<BatchOutput> = JSON.parse(rawOutput);

      if ("Err" in result) {
        dispatch({ type: "COMPUTE_ERROR", error: result.Err.message });
        return;
      }

      // Save to Supabase and navigate
      const record = await saveBatchComputation(state.file!.name, result.Ok);
      navigate({ to: "/batch/$id", params: { id: record.id } });
    } catch (err) {
      dispatch({ type: "COMPUTE_ERROR", error: "An unexpected error occurred. Please try again." });
    }
  }, 50);  // 50ms to allow render cycle

  return () => clearTimeout(timer);
}, [state.phase]);
```

---

## 6. Component: `BatchErrorCard`

**File:** `apps/retirement-pay/frontend/src/components/batch/BatchErrorCard.tsx`

Shown for batch-level errors (file too large, empty file, encoding error, etc.).

```tsx
interface BatchErrorCardProps {
  error: string;   // human-readable message from engine or frontend validation
  onRetry: () => void;
}

// Renders:
<Alert variant="destructive" className="rounded-xl">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Batch computation failed</AlertTitle>
  <AlertDescription>{error}</AlertDescription>
  <div className="mt-4">
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Try again
    </Button>
  </div>
</Alert>
```

---

## 7. Component: `BatchResultsHeader`

**File:** `apps/retirement-pay/frontend/src/components/batch/BatchResultsHeader.tsx`

Top bar on the results page showing batch name, date, and action buttons.

```tsx
interface BatchResultsHeaderProps {
  record: ComputationRecord;
  output: BatchOutput;
}

// Renders:
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold text-gray-900">{record.name}</h1>
    <p className="text-sm text-gray-500 mt-0.5">
      Computed {formatDate(output.computationDate)} ·{" "}
      {output.totalEmployees.toLocaleString()} employees
    </p>
  </div>
  <div className="flex items-center gap-2">
    <BatchExportMenu output={output} />
    <ShareButton computationId={record.id} currentStatus={record.status} />
  </div>
</div>
```

---

## 8. Component: `BatchSummaryCard`

**File:** `apps/retirement-pay/frontend/src/components/batch/BatchSummaryCard.tsx`

Shows aggregate statistics from `BatchOutput`. Always visible at top of results page.

```tsx
interface BatchSummaryCardProps {
  output: BatchOutput;
}
```

### Layout (3-column grid of stat cards):

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">Batch Summary</CardTitle>
    <CardDescription>{output.batchName}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

      {/* Employee counts */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Employees</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{output.totalEmployees.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">
          {output.successCount} eligible · {output.errorCount} errors
        </p>
      </div>

      {/* Total retirement pay */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-xs text-blue-600 uppercase tracking-wide">Total Retirement Obligation</p>
        <p className="text-2xl font-bold text-blue-900 mt-1">
          {formatCentavos(output.totalRetirementPayCentavos)}
        </p>
        <p className="text-xs text-blue-400 mt-1">RA 7641 (22.5-day formula)</p>
      </div>

      {/* Total underpayment */}
      <div className="rounded-lg bg-amber-50 p-4">
        <p className="text-xs text-amber-600 uppercase tracking-wide">Total Underpayment vs 15-Day</p>
        <p className="text-2xl font-bold text-amber-900 mt-1">
          {formatCentavos(output.totalUnderpaymentCentavos)}
        </p>
        <p className="text-xs text-amber-500 mt-1">
          {output.totalErroneousPayCentavos > 0
            ? `vs ${formatCentavos(output.totalErroneousPayCentavos)} using 15-day formula`
            : "No underpayment detected"}
        </p>
      </div>

    </div>

    {/* Error count alert (if any) */}
    {output.errorCount > 0 && (
      <Alert className="mt-4" variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{output.errorCount} rows had errors</AlertTitle>
        <AlertDescription>
          These employees could not be computed. Filter by "Errors" to review.
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

---

## 9. Component: `BatchResultsTable`

**File:** `apps/retirement-pay/frontend/src/components/batch/BatchResultsTable.tsx`

The main results table. Paginated (100 rows per page), filterable, sortable client-side.

### Props
```typescript
interface BatchResultsTableProps {
  output: BatchOutput;
}
```

### Internal State
```typescript
const [filter, setFilter] = useState<"all" | "eligible" | "ineligible" | "errors">("all");
const [sortColumn, setSortColumn] = useState<SortableColumn>("rowIndex");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
const [page, setPage] = useState(1);
const PAGE_SIZE = 100;

type SortableColumn =
  | "rowIndex"
  | "employeeName"
  | "retirementPayCentavos"
  | "underpaymentCentavos"
  | "creditedYears"
  | "status";
```

### Filter Bar

```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex gap-2">
    {(["all", "eligible", "ineligible", "errors"] as const).map((f) => (
      <Button
        key={f}
        variant={filter === f ? "default" : "outline"}
        size="sm"
        onClick={() => { setFilter(f); setPage(1); }}
      >
        {f === "all" && `All (${output.totalEmployees})`}
        {f === "eligible" && `Eligible (${output.successCount})`}
        {f === "ineligible" && `Ineligible (${countIneligible(output)})`}
        {f === "errors" && `Errors (${output.errorCount})`}
      </Button>
    ))}
  </div>
  <p className="text-sm text-gray-500">
    Page {page} of {Math.ceil(filteredRows.length / PAGE_SIZE)}
  </p>
</div>
```

### Table Columns

| Column | Header | Source field | Notes |
|---|---|---|---|
| Row | "#" | `rowIndex + 1` | Right-aligned, gray |
| Employee | "Employee" | `employeeName` | Bold |
| Status | "Status" | computed from `result` | Badge (see below) |
| Credited Years | "Years" | `result.Ok.creditedYearsRounded` | Numeric |
| Monthly Salary | "Monthly Salary" | `result.Ok.breakdown.step4DailyRateCentavos × 26` | `formatCentavos()` |
| Retirement Pay | "Retirement Pay" | `result.Ok.retirementPayCentavos` | `formatCentavos()`, blue |
| 15-Day Amount | "15-Day (Error)" | `result.Ok.erroneous15DayPayCentavos` | `formatCentavos()`, gray |
| Underpayment | "Underpayment" | `result.Ok.correctMinusErroneousCentavos` | `formatCentavos()`, amber |
| Tax | "Tax" | `result.Ok.taxTreatment` | Badge |
| Actions | "" | — | "Details" button |

### Row Status Badge

```typescript
function getRowStatusBadge(row: BatchRowResult): JSX.Element {
  if ("Err" in row.result) {
    return <Badge variant="destructive">Error</Badge>;
  }
  const { eligibility } = row.result.Ok;
  if (eligibility.status === "eligible") {
    return <Badge variant="default" className="bg-green-600">Eligible</Badge>;
  }
  if (eligibility.status === "eligibleWithWarnings") {
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Eligible*</Badge>;
  }
  return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Ineligible</Badge>;
}
```

### Error Row Rendering

When `"Err" in row.result`, render a collapsed row with error info:

```tsx
<TableRow className="bg-red-50">
  <TableCell className="text-gray-400 text-right text-xs">{row.rowIndex + 1}</TableCell>
  <TableCell className="font-medium">{row.employeeName}</TableCell>
  <TableCell><Badge variant="destructive">Error</Badge></TableCell>
  <TableCell colSpan={6} className="text-sm text-red-600">
    {row.result.Err.message}
    {row.result.Err.fields.length > 0 && (
      <span className="ml-1 text-red-400">
        (field: {row.result.Err.fields.map(f => f.field).join(", ")})
      </span>
    )}
  </TableCell>
  <TableCell />
</TableRow>
```

### Ineligible Row Rendering

Row background `bg-orange-50`. Monetary cells show `—` instead of values.

### "Details" Button

Each eligible row has a "Details" button that opens a `BatchRowDetailSheet` (Radix Sheet from right edge):

```tsx
<Sheet open={detailRowIndex === row.rowIndex} onOpenChange={(open) => !open && setDetailRowIndex(null)}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="sm" onClick={() => setDetailRowIndex(row.rowIndex)}>
      Details
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[420px] sm:w-[540px] overflow-y-auto">
    <BatchRowDetail row={row} />
  </SheetContent>
</Sheet>
```

### Pagination Controls

```tsx
<div className="flex items-center justify-between mt-4">
  <Button
    variant="outline"
    size="sm"
    disabled={page === 1}
    onClick={() => setPage(p => p - 1)}
  >
    <ChevronLeft className="h-4 w-4 mr-1" />
    Previous
  </Button>
  <span className="text-sm text-gray-500">
    Showing rows {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
  </span>
  <Button
    variant="outline"
    size="sm"
    disabled={page >= Math.ceil(filteredRows.length / PAGE_SIZE)}
    onClick={() => setPage(p => p + 1)}
  >
    Next
    <ChevronRight className="h-4 w-4 ml-1" />
  </Button>
</div>
```

---

## 10. Component: `BatchRowDetail`

**File:** `apps/retirement-pay/frontend/src/components/batch/BatchRowDetail.tsx`

Shown in the right Sheet when user clicks "Details" on an eligible row. Mirrors the single-employee results view but in sheet form.

```tsx
interface BatchRowDetailProps {
  row: BatchRowResult;
}
```

Shows (if `result.Ok`):
- Employee name and eligibility badge
- Credited years (whole + months + rounded)
- Half-month breakdown table (15 days + SIL + 13th month = 22.5-day equivalent)
- Total retirement pay (large, blue)
- 15-day comparison: erroneous amount vs correct amount, difference in red
- Tax treatment badge with explanation

```tsx
<div className="space-y-5 p-1">
  <div className="flex items-center justify-between">
    <SheetTitle className="text-base">{row.employeeName}</SheetTitle>
    {getRowStatusBadge(row)}
  </div>

  {"Ok" in row.result && (
    <>
      {/* Service */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Credited Service</p>
        <p className="text-sm">
          {row.result.Ok.creditedYearsWhole} years, {row.result.Ok.creditedYearsMonths} months
          {" → "}
          <span className="font-semibold">{row.result.Ok.creditedYearsRounded} credited years</span>
          {row.result.Ok.creditedYearsMonths >= 6 && (
            <span className="ml-1 text-xs text-blue-500">(rounded up)</span>
          )}
        </p>
      </div>

      {/* Half-month breakdown */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">22.5-Day Breakdown</p>
        <div className="border rounded-lg divide-y text-sm">
          <div className="flex justify-between px-3 py-2">
            <span>15 days salary</span>
            <span className="font-mono">{formatCentavos(row.result.Ok.fifteenDaysPayCentavos)}</span>
          </div>
          <div className="flex justify-between px-3 py-2">
            <span>5 days SIL</span>
            <span className="font-mono">{formatCentavos(row.result.Ok.silPayCentavos)}</span>
          </div>
          <div className="flex justify-between px-3 py-2">
            <span>1/12 of 13th month</span>
            <span className="font-mono">{formatCentavos(row.result.Ok.thirteenthMonthPayCentavos)}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-gray-50 font-semibold">
            <span>Half-month salary (22.5 days)</span>
            <span className="font-mono">{formatCentavos(row.result.Ok.totalHalfMonthCentavos)}</span>
          </div>
        </div>
      </div>

      {/* Final pay */}
      <div className="rounded-lg bg-blue-50 p-3 text-center">
        <p className="text-xs text-blue-500 uppercase tracking-wide">Retirement Pay</p>
        <p className="text-2xl font-bold text-blue-900 mt-1">
          {formatCentavos(row.result.Ok.retirementPayCentavos)}
        </p>
        <p className="text-xs text-blue-400 mt-0.5">
          {formatCentavos(row.result.Ok.totalHalfMonthCentavos)} × {row.result.Ok.creditedYearsRounded} years
        </p>
      </div>

      {/* 15-day comparison */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-600 uppercase tracking-wide mb-2">vs 15-Day Formula (Common Error)</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">15-day amount</span>
            <span className="text-gray-500 line-through font-mono">
              {formatCentavos(row.result.Ok.erroneous15DayPayCentavos)}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Underpayment</span>
            <span className="text-amber-700 font-mono">
              +{formatCentavos(row.result.Ok.correctMinusErroneousCentavos)}
            </span>
          </div>
        </div>
      </div>

      {/* Tax */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tax Treatment</p>
        <TaxTreatmentBadge treatment={row.result.Ok.taxTreatment} />
      </div>
    </>
  )}
</div>
```

---

## 11. Component: `BatchExportMenu`

**File:** `apps/retirement-pay/frontend/src/components/batch/BatchExportMenu.tsx`

Dropdown menu with all export options.

```tsx
interface BatchExportMenuProps {
  output: BatchOutput;
}

// Renders a DropdownMenu triggered by an "Export" button:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export
      <ChevronDown className="h-4 w-4 ml-1" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>CSV Exports</DropdownMenuLabel>
    <DropdownMenuItem onClick={() => exportFullCsv(output)}>
      <FileDown className="h-4 w-4 mr-2" />
      Full results (.csv)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportEligibleCsv(output)}>
      <FileDown className="h-4 w-4 mr-2" />
      Eligible employees only (.csv)
    </DropdownMenuItem>
    {output.errorCount > 0 && (
      <DropdownMenuItem onClick={() => exportErrorCsv(output)}>
        <FileDown className="h-4 w-4 mr-2" />
        Error rows only (.csv)
      </DropdownMenuItem>
    )}
    <DropdownMenuSeparator />
    <DropdownMenuLabel>PDF Exports</DropdownMenuLabel>
    <DropdownMenuItem onClick={() => exportSummaryPdf(output)}>
      <FileText className="h-4 w-4 mr-2" />
      Summary report (.pdf)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportNlrcBatchPdf(output)}>
      <FileText className="h-4 w-4 mr-2" />
      NLRC worksheets (.pdf)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### CSV Export Implementations

**`exportFullCsv(output: BatchOutput): void`**

Converts `output.rows` to CSV with columns:
```
row_number,employee_name,status,eligibility_status,credited_years,
monthly_salary_php,retirement_pay_php,fifteen_day_amount_php,underpayment_php,
tax_treatment,has_company_plan,company_plan_gap_php,error_code,error_message
```
Money values as PHP pesos (centavos ÷ 100, 2 decimal places). Triggers download as `batch-results-{batchName}-{date}.csv`.

**`exportEligibleCsv(output: BatchOutput): void`**

Same columns as full results, filtered to rows where `"Ok" in row.result && row.result.Ok.eligibility.status !== "ineligible"`. Filename: `batch-eligible-{batchName}-{date}.csv`.

**`exportErrorCsv(output: BatchOutput): void`**

Rows where `"Err" in row.result`. Columns: `row_number,employee_name,error_code,error_message,error_field`. Filename: `batch-errors-{batchName}-{date}.csv`.

### CSV Blob Trigger Pattern
```typescript
function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### PDF Export Triggers

`exportSummaryPdf(output)` and `exportNlrcBatchPdf(output)` use `@react-pdf/renderer`. They render a React PDF component to a Blob and trigger download. See `pdf-export-layout.md` for PDF layouts.

Both show a toast while rendering:
```typescript
toast.loading("Generating PDF…", { id: "pdf-export" });
// on success:
toast.success("PDF downloaded", { id: "pdf-export" });
// on error:
toast.error("PDF generation failed", { id: "pdf-export" });
```

---

## 12. Component: `BatchResultsSkeleton`

**File:** `apps/retirement-pay/frontend/src/components/batch/BatchResultsSkeleton.tsx`

Shown while `useBatchRecord(id)` is loading.

```tsx
<div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="h-9 w-28" />
  </div>
  <Card>
    <CardContent className="pt-6">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="pt-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </CardContent>
  </Card>
</div>
```

---

## 13. Hook: `useBatchRecord`

**File:** `apps/retirement-pay/frontend/src/hooks/useBatchRecord.ts`

Fetches a saved batch computation from Supabase by ID.

```typescript
export function useBatchRecord(id: string) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["batch-record", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("computations")
        .select("*")
        .eq("id", id)
        .eq("mode", "batch")
        .single();

      if (error) throw new Error(error.message);
      return data as ComputationRecord;
    },
  });
}
```

---

## 14. Hook: `saveBatchComputation`

**File:** `apps/retirement-pay/frontend/src/hooks/useSaveBatchComputation.ts`

Saves batch output to Supabase after computation completes.

```typescript
async function saveBatchComputation(
  filename: string,
  output: BatchOutput,
  userId: string,
  orgId: string | null,
): Promise<ComputationRecord> {
  const { supabase } = getSupabaseClient();
  const name = `${filename} — ${formatDate(output.computationDate)}`;

  const { data, error } = await supabase
    .from("computations")
    .insert({
      user_id: userId,
      organization_id: orgId,
      name,
      mode: "batch",
      status: "computed",
      input: { csvContent: "<not stored>" },  // CSV content not saved to DB (too large)
      output,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to save batch: ${error.message}`);
  return data as ComputationRecord;
}
```

**Note:** The CSV content string is not stored in the database (too large). Only the `BatchOutput` (parsed results) is stored. If the user wants to re-run a batch, they re-upload the CSV.

---

## 15. File Path Summary

```
apps/retirement-pay/frontend/src/
  pages/
    batch/
      new.tsx                        ← BatchNewPage (upload + compute)
      $id.tsx                        ← BatchResultsPage (view results)

  components/
    batch/
      CsvDropZone.tsx                ← File drag-and-drop zone
      FilePreviewCard.tsx            ← Preview card after file selected
      ComputingProgressCard.tsx      ← Spinner during WASM computation
      BatchErrorCard.tsx             ← Batch-level error display
      BatchResultsHeader.tsx         ← Title bar + export + share buttons
      BatchSummaryCard.tsx           ← Aggregate stats (counts, totals)
      BatchResultsTable.tsx          ← Filterable/sortable/paginated table
      BatchRowDetail.tsx             ← Row detail Sheet (right panel)
      BatchExportMenu.tsx            ← Dropdown with all export options
      BatchResultsSkeleton.tsx       ← Loading skeleton for results page

  hooks/
    useBatchRecord.ts                ← Fetch saved batch from Supabase
    useSaveBatchComputation.ts       ← Save batch output to Supabase
```

---

## 16. shadcn/ui Components Used

| Component | Import | Used in |
|---|---|---|
| `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription` | `@/components/ui/card` | FilePreviewCard, BatchSummaryCard, BatchResultsHeader, Skeletons |
| `Alert`, `AlertTitle`, `AlertDescription` | `@/components/ui/alert` | BatchErrorCard, inline column errors, error count warning |
| `Badge` | `@/components/ui/badge` | Status indicators, column header badges, tax treatment |
| `Button` | `@/components/ui/button` | All CTAs |
| `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` | `@/components/ui/table` | Preview table, results table |
| `Sheet`, `SheetContent`, `SheetTitle`, `SheetTrigger` | `@/components/ui/sheet` | BatchRowDetail |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` | `@/components/ui/dropdown-menu` | BatchExportMenu |
| `Skeleton` | `@/components/ui/skeleton` | BatchResultsSkeleton |

---

## 17. Lucide Icons Used

| Icon | Component | Usage |
|---|---|---|
| `UploadCloud` | CsvDropZone | Drop zone center |
| `FileSpreadsheet` | FilePreviewCard | File type indicator |
| `X` | FilePreviewCard | Clear file button |
| `AlertTriangle` | BatchErrorCard, Alert | Error/warning icon |
| `AlertCircle` | BatchErrorCard | Destructive alert icon |
| `Loader2` | ComputingProgressCard | Spinner |
| `Calculator` | FilePreviewCard | Compute button |
| `Download` | BatchExportMenu trigger | Export button |
| `FileDown` | BatchExportMenu items | CSV export items |
| `FileText` | BatchExportMenu items | PDF export items |
| `ChevronDown` | BatchExportMenu trigger | Dropdown indicator |
| `ChevronLeft`, `ChevronRight` | Pagination | Prev/Next |
| `RefreshCw` | BatchErrorCard | Retry button |

---

## 18. Edge Cases and Error Handling

### File reading failure
`FileReader` error event → dispatch `COMPUTE_ERROR` with "Could not read file. Please try again."

### Very large valid batch (5,000 rows)
- WASM blocks main thread for up to 2 seconds
- The 50ms setTimeout before computation ensures the `ComputingProgressCard` renders first
- No progress bar (impossible with synchronous WASM)

### All rows are errors
- `output.successCount === 0` and `output.errorCount === output.totalEmployees`
- Summary card still shows, but monetary totals all zero
- Table shows all rows as errors
- Export: "Eligible employees only" option hidden (empty export not useful); "Error rows only" shown

### Navigating back to `/batch/new` while computing
- The reducer state is local to `BatchNewPage` — unmounting resets it
- If user navigates away and back, they start fresh (no saved intermediate state)

### Batch name collision
- Not prevented. Same user can upload the same CSV twice → two separate `computations` records with different IDs.

---

## Summary

The batch upload UI has two routes: `/batch/new` for file selection and computation, `/batch/$id` for results. The state machine (idle → file-selected → computing → results/error) is managed by a `useReducer` hook. File validation is client-side before the WASM call. WASM computation is wrapped in a 50ms timeout to allow the spinner to render. Results show a summary card (3 stat tiles) and a filterable/sortable/paginated table with per-row detail sheets. Export options cover full CSV, eligible-only CSV, error-only CSV, summary PDF, and NLRC batch PDF.
