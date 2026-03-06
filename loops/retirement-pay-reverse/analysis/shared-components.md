# Analysis: Shared Components — RA 7641 Retirement Pay Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** shared-components
**Date:** 2026-03-06
**Sources:** typescript-types.md, zod-schemas.md, wizard-steps.md, batch-upload-ui.md, results-view.md, nlrc-worksheet-ui.md

---

## Overview

Six reusable widgets are used across multiple features of the app. Each is a standalone component
with no feature-specific business logic baked in — they accept well-typed props and emit
well-typed callbacks. They live in `apps/retirement-pay/frontend/src/components/shared/`.

| Component | Used By |
|-----------|---------|
| `MoneyInput` | Wizard Step 3 (salary fields), Company Plan UI, Batch corrections |
| `DateInput` | Wizard Step 2 (hire date, retirement date), Batch CSV override |
| `EnumSelect` | Wizard Step 1 (retirement type), Company Plan UI, NLRC Worksheet |
| `CsvUploader` | Batch Upload UI |
| `ComparisonTable` | Results (separation pay, company plan), Company Plan gap analysis |
| `LegalCitation` | NLRC Worksheet, Results breakdown footer, PDF export |

All money values flowing through MoneyInput are integers in **centavos** (i64 in Rust, `number`
in TypeScript — capped at `Number.MAX_SAFE_INTEGER`). Display formatting always divides by 100.

---

## 1. Component: `MoneyInput`

**File:** `apps/retirement-pay/frontend/src/components/shared/MoneyInput.tsx`

**Purpose:** A peso amount input that stores and emits integer centavos. Displays as "₱ 50,000.00"
but the underlying `value` prop and `onChange` callback use integer centavos.

**Design:**
- Prefix "₱" rendered as input adornment (non-editable, gray)
- User types pesos and centavos in decimal format: "50000.00" or "50000"
- On blur: normalizes to 2 decimal places, formats with thousands separator
- Internal state holds the display string; emits centavos via `onChange` only on blur/commit
- Validation: disallow negative values; max 999_999_999_99 centavos (≈ PHP 9.99 billion)
- Keyboard: accepts digits, `.`, `,` (stripped on parse), backspace, arrow keys
- Tab/Enter triggers the same blur normalization

**Props:**

```typescript
interface MoneyInputProps {
  /** Current value in integer centavos. null means empty/unset. */
  value: number | null;
  /** Called with new centavo integer on blur/commit. null if field cleared. */
  onChange: (centavos: number | null) => void;
  /** Input label (rendered above input, or as aria-label if labelHidden=true) */
  label: string;
  /** Optional helper text rendered below input */
  hint?: string;
  /** Error message from form validation. If set, renders input in error state. */
  error?: string;
  /** Whether to hide the visible label (still present for a11y). Default false. */
  labelHidden?: boolean;
  /** Disables the input. Default false. */
  disabled?: boolean;
  /** Placeholder shown when empty. Default "0.00" */
  placeholder?: string;
  /** aria-describedby for accessibility */
  describedBy?: string;
  /** ID for label association */
  id?: string;
}
```

**Implementation:**

```tsx
// File: apps/retirement-pay/frontend/src/components/shared/MoneyInput.tsx

import { useState, useCallback, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Format integer centavos to display string: 5000000 → "50,000.00" */
function centavosToDisplay(centavos: number): string {
  const pesos = centavos / 100;
  return pesos.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parse display string to centavos: "50,000.00" → 5000000. Returns null if invalid. */
function displayToCentavos(display: string): number | null {
  // Remove commas and whitespace
  const cleaned = display.replace(/,/g, "").trim();
  if (cleaned === "" || cleaned === ".") return null;
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return null;
  // Round to 2 decimal places then convert to centavos
  return Math.round(parsed * 100);
}

export function MoneyInput({
  value,
  onChange,
  label,
  hint,
  error,
  labelHidden = false,
  disabled = false,
  placeholder = "0.00",
  id: propId,
}: MoneyInputProps) {
  const generatedId = useId();
  const id = propId ?? generatedId;

  // Initialize display from value prop
  const [display, setDisplay] = useState<string>(
    value !== null ? centavosToDisplay(value) : ""
  );
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // On focus: show plain decimal for easy editing
    if (value !== null) {
      setDisplay((value / 100).toFixed(2));
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const centavos = displayToCentavos(display);
    if (centavos !== value) {
      onChange(centavos);
    }
    // Reformat display
    if (centavos !== null) {
      setDisplay(centavosToDisplay(centavos));
    } else {
      setDisplay("");
    }
  }, [display, value, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits, decimal point, and comma
    const raw = e.target.value.replace(/[^0-9.,]/g, "");
    setDisplay(raw);
  }, []);

  return (
    <div className="space-y-1.5">
      {!labelHidden && (
        <Label htmlFor={id} className={cn(error && "text-red-600")}>
          {label}
        </Label>
      )}
      {labelHidden && (
        <Label htmlFor={id} className="sr-only">{label}</Label>
      )}
      <div className="relative">
        {/* Peso prefix */}
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none select-none"
          aria-hidden="true"
        >
          ₱
        </span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={display}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          aria-label={labelHidden ? label : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "pl-7 font-mono",
            error && "border-red-500 focus-visible:ring-red-500",
            disabled && "bg-gray-50"
          )}
        />
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
```

**Edge cases:**
- If user types "50000" (no cents), emits 5_000_000 centavos (= PHP 50,000.00)
- If user types ".50", emits 50 centavos
- If user clears field entirely, emits null
- Typing letters or symbols: silently stripped by the replace regex
- Copy-paste of formatted string "₱50,000.00": commas stripped, peso sign stripped, parses correctly

---

## 2. Component: `DateInput`

**File:** `apps/retirement-pay/frontend/src/components/shared/DateInput.tsx`

**Purpose:** A date picker for hire date, retirement date, and similar date fields. Stores and emits
ISO 8601 date strings (`"YYYY-MM-DD"`). Uses a native `<input type="date">` with a custom overlay
button for the calendar icon.

**Design:**
- Renders a shadcn `Input` with `type="date"`
- Calendar icon (lucide `CalendarDays`) as suffix adornment, clickable to focus input
- Value is always `"YYYY-MM-DD"` string (ISO 8601) — no time component
- Min/max constraints: min defaults to "1950-01-01", max defaults to today + 1 year
- Conditional min/max: hire date max = retirement date (if known); retirement date min = hire date (if known)

**Props:**

```typescript
interface DateInputProps {
  /** ISO 8601 date string "YYYY-MM-DD". null = unset/empty. */
  value: string | null;
  /** Called with new ISO date string, or null if cleared. */
  onChange: (date: string | null) => void;
  label: string;
  hint?: string;
  error?: string;
  labelHidden?: boolean;
  disabled?: boolean;
  /** Minimum allowed date as "YYYY-MM-DD". Default "1950-01-01". */
  min?: string;
  /** Maximum allowed date as "YYYY-MM-DD". Default today + 1 year. */
  max?: string;
  id?: string;
}
```

**Implementation:**

```tsx
// File: apps/retirement-pay/frontend/src/components/shared/DateInput.tsx

import { useId, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

/** Default max: today + 1 year */
function defaultMax(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function DateInput({
  value,
  onChange,
  label,
  hint,
  error,
  labelHidden = false,
  disabled = false,
  min = "1950-01-01",
  max = defaultMax(),
  id: propId,
}: DateInputProps) {
  const generatedId = useId();
  const id = propId ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v === "" ? null : v);
  };

  return (
    <div className="space-y-1.5">
      {!labelHidden ? (
        <Label htmlFor={id} className={cn(error && "text-red-600")}>{label}</Label>
      ) : (
        <Label htmlFor={id} className="sr-only">{label}</Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="date"
          value={value ?? ""}
          min={min}
          max={max}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "pr-9",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        {/* Calendar icon: clicking focuses the date input to open picker */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => inputRef.current?.showPicker?.()}
          disabled={disabled}
        >
          <CalendarDays className="w-4 h-4" />
        </button>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
```

**Edge cases:**
- `showPicker()` may not be available in all browsers — the optional chaining (`?.`) prevents errors
- Mobile: native `type="date"` renders OS date picker, which is acceptable
- Clearing: `<input type="date">` emits `""` on clear; we convert to `null`

---

## 3. Component: `EnumSelect`

**File:** `apps/retirement-pay/frontend/src/components/shared/EnumSelect.tsx`

**Purpose:** A typed dropdown/select for enum fields. Wraps shadcn `Select` with a `Record<T, string>`
label map so the caller never has to manage label strings in the parent component.

**Design:**
- Built on shadcn `Select` + `SelectTrigger` + `SelectContent` + `SelectItem`
- Generic over `T extends string` — fully typed
- Takes an ordered array of options to control display order (not Object.keys order)
- Optionally shows a placeholder "Select..." item when no value is selected
- Shows a description below each option item when `descriptions` map is provided

**Props:**

```typescript
interface EnumSelectProps<T extends string> {
  /** Currently selected value, or null if unselected. */
  value: T | null;
  /** Called when selection changes. null if placeholder is re-selected. */
  onChange: (value: T | null) => void;
  /** Ordered list of enum values to display. */
  options: readonly T[];
  /** Human-readable labels for each enum value. */
  labels: Record<T, string>;
  /** Optional short descriptions shown below each option label. */
  descriptions?: Partial<Record<T, string>>;
  label: string;
  hint?: string;
  error?: string;
  labelHidden?: boolean;
  disabled?: boolean;
  /** Placeholder text when no value selected. Default "Select..." */
  placeholder?: string;
  id?: string;
}
```

**Concrete usage examples:**

```typescript
// RetirementType select — used in Wizard Step 1
<EnumSelect<RetirementType>
  value={formData.retirementType}
  onChange={(v) => setField("retirementType", v)}
  options={["optional", "compulsory", "death"] as const}
  labels={{
    optional: "Optional Retirement (Age 60+)",
    compulsory: "Compulsory Retirement (Age 65)",
    death: "Death — Claim by Heirs",
  }}
  descriptions={{
    optional: "Employee voluntarily retires at age 60 or older",
    compulsory: "Employer may compulsorily retire employee at age 65",
    death: "Heirs entitled to retirement pay as if employee retired on date of death",
  }}
  label="Retirement Type"
  error={errors.retirementType}
/>

// SeparationPayBasis select — used in Wizard Step 4 conditional
<EnumSelect<SeparationPayBasis>
  value={formData.separationPayBasis}
  onChange={(v) => setField("separationPayBasis", v)}
  options={["notApplicable", "authorizedCause", "retrenchment", "redundancy", "closure", "disease"]}
  labels={{
    notApplicable: "Not Applicable",
    authorizedCause: "Authorized Cause (Art. 298)",
    retrenchment: "Retrenchment",
    redundancy: "Redundancy",
    closure: "Closure / Cessation of Operations",
    disease: "Disease (Art. 299)",
  }}
  label="Separation Pay Basis"
  hint="If applicable, select the authorized cause triggering separation pay"
/>

// CompanyPlanType select — used in Wizard Step 5 and Company Plan UI
<EnumSelect<CompanyPlanType>
  value={formData.companyPlanType}
  onChange={(v) => setField("companyPlanType", v)}
  options={["none", "definedBenefit", "definedContribution"]}
  labels={{
    none: "No Company Retirement Plan",
    definedBenefit: "Defined Benefit Plan",
    definedContribution: "Defined Contribution Plan",
  }}
  label="Company Retirement Plan Type"
/>
```

**Implementation:**

```tsx
// File: apps/retirement-pay/frontend/src/components/shared/EnumSelect.tsx

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  descriptions,
  label,
  hint,
  error,
  labelHidden = false,
  disabled = false,
  placeholder = "Select...",
  id: propId,
}: EnumSelectProps<T>) {
  const generatedId = useId();
  const id = propId ?? generatedId;

  return (
    <div className="space-y-1.5">
      {!labelHidden ? (
        <Label htmlFor={id} className={cn(error && "text-red-600")}>{label}</Label>
      ) : (
        <Label htmlFor={id} className="sr-only">{label}</Label>
      )}
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v === "" ? null : (v as T))}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-invalid={!!error}
          className={cn(error && "border-red-500 focus:ring-red-500")}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              <div>
                <span className="font-medium">{labels[option]}</span>
                {descriptions?.[option] && (
                  <p className="text-xs text-gray-500 mt-0.5">{descriptions[option]}</p>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
```

---

## 4. Component: `CsvUploader`

**File:** `apps/retirement-pay/frontend/src/components/shared/CsvUploader.tsx`

**Purpose:** Drag-and-drop + click-to-browse CSV file uploader. Validates file type and size.
Emits parsed raw text for the parent to interpret.

**Design:**
- Drop zone: dashed border, "Drop CSV here or click to browse" text
- Icon: lucide `Upload` or `FileSpreadsheet`
- Accepts only `.csv` files (MIME type `text/csv` or `application/vnd.ms-excel`)
- Max file size: 10 MB
- On valid drop/select: emits `{ fileName: string, csvText: string }` to `onFile`
- On invalid file: shows inline error (wrong type or too large), does NOT call `onFile`
- On second upload: replaces previous file (no accumulation)
- Shows file name + size badge after successful selection
- "Remove" button (×) clears selection
- Shows a "Downloading template" link to the sample CSV template

**Props:**

```typescript
interface CsvUploaderProps {
  /** Called with parsed CSV text when a valid file is selected. */
  onFile: (result: { fileName: string; csvText: string }) => void;
  /** Called when the file is cleared. */
  onClear?: () => void;
  /** Currently selected file name (for display if controlled from outside). null = no file. */
  currentFileName?: string | null;
  /** Whether upload is disabled (e.g., during processing). Default false. */
  disabled?: boolean;
  /** Hint text below the drop zone. Default: shows CSV template columns. */
  hint?: string;
  /** Download URL for CSV template file */
  templateDownloadUrl?: string;
}
```

**Implementation:**

```tsx
// File: apps/retirement-pay/frontend/src/components/shared/CsvUploader.tsx

import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME_TYPES = ["text/csv", "application/vnd.ms-excel", "text/plain"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CsvUploader({
  onFile,
  onClear,
  currentFileName,
  disabled = false,
  hint,
  templateDownloadUrl,
}: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);

  const processFile = useCallback(async (file: File) => {
    setUploadError(null);

    // Validate type: check extension and MIME
    const isValidType =
      ACCEPTED_MIME_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".csv");
    if (!isValidType) {
      setUploadError("Invalid file type. Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large. Maximum size is 10 MB (your file: ${formatFileSize(file.size)}).`);
      return;
    }

    const csvText = await file.text();
    setSelectedFile({ name: file.name, size: file.size });
    onFile({ fileName: file.name, csvText });
  }, [onFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [disabled, processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [processFile]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
    onClear?.();
  }, [onClear]);

  const displayFileName = currentFileName ?? selectedFile?.name ?? null;

  if (displayFileName) {
    // File selected state
    return (
      <div className="border border-green-300 bg-green-50 rounded-lg p-4 flex items-center gap-3">
        <FileSpreadsheet className="w-8 h-8 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-900 truncate">{displayFileName}</p>
          {selectedFile && (
            <p className="text-xs text-green-700">{formatFileSize(selectedFile.size)}</p>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-green-700 hover:text-green-900 hover:bg-green-100 flex-shrink-0"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload CSV file — click or drop file here"
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragOver && !disabled
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          Drop your CSV file here, or{" "}
          <span className="text-blue-600 underline">click to browse</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">Accepts .csv files up to 10 MB</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={handleFileInput}
        disabled={disabled}
        aria-hidden="true"
      />

      {/* Error message */}
      {uploadError && (
        <p className="text-xs text-red-600">{uploadError}</p>
      )}

      {/* Hint and template link */}
      {hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {templateDownloadUrl && (
        <a
          href={templateDownloadUrl}
          download="retirement-pay-batch-template.csv"
          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          Download CSV template
        </a>
      )}
    </div>
  );
}
```

**CSV template structure** (for the downloadable template):
```
employeeId,employeeName,basicSalaryCentavos,hireDate,retirementDate,retirementType,employeeCount,hasBirApprovedPlan,hasCompanyPlan,companyPlanType,companyPlanFormula
E001,Juan dela Cruz,5000000,1985-06-15,2025-06-15,optional,250,true,false,none,
```

---

## 5. Component: `ComparisonTable`

**File:** `apps/retirement-pay/frontend/src/components/shared/ComparisonTable.tsx`

**Purpose:** A reusable two-column (or more) comparison table for displaying side-by-side monetary
values with labels and optional highlighting. Used in separation pay comparison, company plan gap
analysis, and batch summary.

**Design:**
- Renders as a shadcn `Table` with configurable columns
- Each row has a label column + one or more value columns
- A row can be marked `highlight: true` to render with bg-green-50 and bold text
- A row can be marked `type: "total"` to render with a top border separator
- Money values formatted via `formatCentavos()` utility
- Optional `badge` per cell (e.g., "Higher", "Recommended", "Insufficient")

**Props:**

```typescript
interface ComparisonTableColumn {
  /** Column header text */
  header: string;
  /** Optional header alignment. Default "right". */
  align?: "left" | "right" | "center";
}

interface ComparisonTableCell {
  /** Centavo value to display via formatCentavos(). Mutually exclusive with textValue. */
  centavos?: number | null;
  /** Arbitrary text value for non-money cells. Mutually exclusive with centavos. */
  textValue?: string;
  /** Optional badge text shown after the value */
  badge?: string;
  /** Badge variant. Default "secondary". */
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface ComparisonTableRow {
  /** Row label in the first column */
  label: string;
  /** Values for each data column (must match columns array length) */
  cells: ComparisonTableCell[];
  /** If true, renders with bg-green-50 and font-medium */
  highlight?: boolean;
  /** Row type: "total" adds border-t-2 separator */
  type?: "data" | "total" | "separator";
}

interface ComparisonTableProps {
  /** Column definitions for the data columns (excludes the label column) */
  columns: ComparisonTableColumn[];
  /** Table rows */
  rows: ComparisonTableRow[];
  /** Optional table caption for accessibility */
  caption?: string;
}
```

**Concrete usage — separation pay comparison:**

```tsx
<ComparisonTable
  caption="Retirement Pay vs. Separation Pay Comparison"
  columns={[
    { header: "Amount", align: "right" },
    { header: "", align: "right" },
  ]}
  rows={[
    {
      label: "Retirement Pay (RA 7641, 22.5 days)",
      cells: [
        { centavos: output.retirementPayCentavos },
        { badge: output.separationPayComparison.retirementPayIsHigher ? "Higher" : undefined,
          badgeVariant: "default" },
      ],
      highlight: output.separationPayComparison.retirementPayIsHigher,
    },
    {
      label: `Separation Pay (${BASIS_LABELS[comp.separationPayBasis]})`,
      cells: [
        { centavos: comp.separationPayCentavos },
        { badge: comp.retirementPayIsHigher === false ? "Higher" : undefined,
          badgeVariant: "default" },
      ],
      highlight: comp.retirementPayIsHigher === false,
    },
    {
      label: "Recommended Benefit",
      cells: [
        { centavos: comp.recommendedBenefitCentavos },
        { textValue: "" },
      ],
      type: "total",
    },
  ]}
/>
```

**Implementation:**

```tsx
// File: apps/retirement-pay/frontend/src/components/shared/ComparisonTable.tsx

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCentavos } from "@/lib/format";

export function ComparisonTable({ columns, rows, caption }: ComparisonTableProps) {
  return (
    <Table>
      {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {/* Label column header — empty */}
          <TableHead className="w-[40%]" />
          {columns.map((col, i) => (
            <TableHead
              key={i}
              className={cn(
                col.align === "left" ? "text-left" : col.align === "center" ? "text-center" : "text-right"
              )}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIdx) => (
          <TableRow
            key={rowIdx}
            className={cn(
              row.highlight && "bg-green-50",
              row.type === "total" && "border-t-2 font-medium"
            )}
          >
            <TableCell
              className={cn(
                "text-sm",
                row.type === "total" ? "font-medium" : "text-gray-600"
              )}
            >
              {row.label}
            </TableCell>
            {row.cells.map((cell, cellIdx) => (
              <TableCell
                key={cellIdx}
                className={cn(
                  columns[cellIdx]?.align === "left" ? "text-left" : "text-right",
                  "text-sm"
                )}
              >
                <span className={cn(
                  "font-mono",
                  row.type === "total" && "font-bold",
                  row.highlight && "text-green-800"
                )}>
                  {cell.centavos !== undefined && cell.centavos !== null
                    ? formatCentavos(cell.centavos)
                    : cell.textValue ?? ""}
                </span>
                {cell.badge && (
                  <Badge
                    variant={cell.badgeVariant ?? "secondary"}
                    className="ml-2 text-xs"
                  >
                    {cell.badge}
                  </Badge>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 6. Component: `LegalCitation`

**File:** `apps/retirement-pay/frontend/src/components/shared/LegalCitation.tsx`

**Purpose:** Renders a formatted legal citation with source, section, and quoted text. Used in
NLRC worksheets, the PDF export, and results page breakdown footers. Ensures consistent
citation formatting across all output types.

**Design:**
- Renders as a bordered blockquote-style element with icon
- Icon: lucide `Scale` or `BookOpen`
- Citation has: source name (bold), section reference (italic), optional quoted text
- Two variants: `"inline"` (small, fits inside a card) and `"block"` (full width, standalone)
- Color: neutral gray-blue — not alarming, but visually distinct from body text

**Props:**

```typescript
interface LegalCitationProps {
  /** Primary source name: "RA 7641", "Labor Code", "NIRC", etc. */
  source: string;
  /** Section or article reference: "Sec. 1", "Art. 302", "Sec. 32(B)(6)(a)" */
  section: string;
  /** Full citation title for context: "Retirement Pay Law", "New Labor Code", etc. */
  title?: string;
  /** Optional direct quote from the provision (rendered in italics with quotation marks) */
  quote?: string;
  /** "inline" = compact, sits inside card footers. "block" = full-width with left border. */
  variant?: "inline" | "block";
}
```

**Pre-defined citations (constants for common sources):**

```typescript
// File: apps/retirement-pay/frontend/src/lib/legal-citations.ts

export const LEGAL_CITATIONS = {
  RA7641_FORMULA: {
    source: "RA 7641",
    section: "Sec. 1",
    title: "Retirement Pay Law",
    quote: '"one-half (1/2) month salary" shall include fifteen (15) days salary plus five (5) days of service incentive leave plus one-twelfth (1/12) of the thirteenth month pay.',
  },
  RA7641_ELIGIBILITY: {
    source: "RA 7641",
    section: "Sec. 1",
    title: "Retirement Pay Law",
    quote: "any employee who retires pursuant to a collective bargaining agreement or other applicable employment contract, or shall have served at least five (5) years in the same establishment and shall be at least sixty (60) years of age",
  },
  LABOR_CODE_ART302: {
    source: "Labor Code",
    section: "Art. 302",
    title: "New Labor Code of the Philippines",
    quote: "Any employee may be retired upon reaching the retirement age established in the collective bargaining agreement or other applicable employment contract.",
  },
  ELEGIR_V_PAL: {
    source: "G.R. No. 181995",
    section: "Elegir v. Philippine Airlines, Inc.",
    title: "Supreme Court, 2010",
    quote: "The computation of retirement pay under RA 7641 must include the Service Incentive Leave pay and the one-twelfth of the thirteenth month pay.",
  },
  NIRC_SEC32: {
    source: "NIRC",
    section: "Sec. 32(B)(6)(a)",
    title: "National Internal Revenue Code",
    quote: "Gross Income does not include retirement benefits received under a reasonable private benefit plan maintained by the employer, provided that the retiring official or employee has been in the service of the same employer for at least ten (10) years and is not less than fifty (50) years of age at the time of his retirement.",
  },
} as const satisfies Record<string, LegalCitationProps>;
```

**Implementation:**

```tsx
// File: apps/retirement-pay/frontend/src/components/shared/LegalCitation.tsx

import { Scale, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function LegalCitation({
  source,
  section,
  title,
  quote,
  variant = "block",
}: LegalCitationProps) {
  if (variant === "inline") {
    return (
      <span className="inline-flex items-baseline gap-1 text-xs text-gray-500">
        <Scale className="w-3 h-3 flex-shrink-0 self-center" />
        <span>
          <strong>{source}</strong>
          {", "}
          <em>{section}</em>
          {title && <span className="text-gray-400"> ({title})</span>}
        </span>
      </span>
    );
  }

  // block variant
  return (
    <div className={cn(
      "border-l-4 border-blue-200 bg-blue-50 rounded-r-md px-4 py-3",
      "text-sm text-gray-700"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span>
          <strong className="text-gray-900">{source}</strong>
          {", "}
          <em>{section}</em>
          {title && <span className="text-gray-500 text-xs"> — {title}</span>}
        </span>
      </div>
      {quote && (
        <blockquote className="text-xs text-gray-600 italic mt-1 leading-relaxed">
          &ldquo;{quote}&rdquo;
        </blockquote>
      )}
    </div>
  );
}
```

**Usage examples:**

```tsx
// In NLRC worksheet — block citation at top of each section
<LegalCitation {...LEGAL_CITATIONS.RA7641_FORMULA} variant="block" />

// In PayBreakdownCard footer — inline citation
<p className="text-xs text-gray-400 mt-2">
  Formula per <LegalCitation source="RA 7641" section="Sec. 1" variant="inline" />{" "}
  as confirmed in <LegalCitation source="G.R. No. 181995" section="Elegir v. PAL" variant="inline" />
</p>
```

---

## 7. Utility: `formatCentavos`

**File:** `apps/retirement-pay/frontend/src/lib/format.ts`

This utility is used by almost every component. Centralizing it here prevents inconsistencies.

```typescript
/**
 * Format integer centavos to Philippine peso display string.
 * 5000000 → "₱50,000.00"
 * 0       → "₱0.00"
 * null    → "—" (em dash, not "N/A")
 */
export function formatCentavos(centavos: number | null): string {
  if (centavos === null) return "—";
  const pesos = centavos / 100;
  return "₱" + pesos.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a credited years/months display string.
 * (5, 7) → "5 years, 7 months"
 * (10, 0) → "10 years"
 */
export function formatCreditedYears(whole: number, months: number): string {
  if (months === 0) return `${whole} year${whole !== 1 ? "s" : ""}`;
  return `${whole} year${whole !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""}`;
}

/**
 * Format ISO date string to Philippine display format.
 * "2025-06-15" → "June 15, 2025"
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Format a percentage for display.
 * 33.33 → "33.33%"
 */
export function formatPercent(pct: number, decimals = 1): string {
  return pct.toFixed(decimals) + "%";
}
```

---

## 8. Component File Map

| File | Component / Export | Used By |
|------|--------------------|---------|
| `components/shared/MoneyInput.tsx` | `MoneyInput` | Wizard Step 3, Company Plan UI, Batch corrections |
| `components/shared/DateInput.tsx` | `DateInput` | Wizard Step 2 |
| `components/shared/EnumSelect.tsx` | `EnumSelect<T>` | Wizard Steps 1 + 4 + 5, Company Plan UI |
| `components/shared/CsvUploader.tsx` | `CsvUploader` | Batch Upload UI |
| `components/shared/ComparisonTable.tsx` | `ComparisonTable` | Results, Company Plan, NLRC Worksheet |
| `components/shared/LegalCitation.tsx` | `LegalCitation` | NLRC Worksheet, Results footer, PDF export |
| `lib/format.ts` | `formatCentavos`, `formatCreditedYears`, `formatDate`, `formatPercent` | All components |
| `lib/legal-citations.ts` | `LEGAL_CITATIONS` constants | NLRC Worksheet, LegalCitation usages |

---

## 9. Accessibility Requirements

| Component | A11y Requirements |
|-----------|-------------------|
| `MoneyInput` | `aria-invalid`, `aria-describedby` for error/hint, `inputMode="decimal"` for mobile keyboard |
| `DateInput` | `aria-invalid`, `aria-describedby`, calendar button `tabIndex={-1}` + `aria-hidden` |
| `EnumSelect` | shadcn Select handles a11y natively (role="combobox", aria-expanded, keyboard nav) |
| `CsvUploader` | Drop zone has `role="button"`, `tabIndex=0`, keyboard Enter/Space triggers file dialog |
| `ComparisonTable` | `<TableCaption>` for screen readers (hidden visually with `sr-only` on non-NLRC usage) |
| `LegalCitation` | Inline variant uses `<em>` for semantic emphasis; block uses `<blockquote>` |

---

## 10. Summary

Six shared components, one utility module, and one constants file constitute the shared component layer:

- `MoneyInput` — centavo-precision peso input with peso prefix and blur normalization
- `DateInput` — ISO 8601 date input with calendar icon affordance
- `EnumSelect<T>` — generic typed dropdown with ordered options and optional per-item descriptions
- `CsvUploader` — drag-and-drop CSV uploader with type/size validation and template download link
- `ComparisonTable` — configurable two-column money comparison table with row highlighting and badges
- `LegalCitation` — formatted legal citation in inline or block variant, with pre-defined constants for all cited sources
- `format.ts` — `formatCentavos`, `formatCreditedYears`, `formatDate`, `formatPercent`
- `legal-citations.ts` — `LEGAL_CITATIONS` pre-defined objects for RA 7641, Labor Code, Elegir v. PAL, NIRC

All components follow the same prop pattern: `value`, `onChange`, `label`, `error`, `hint`,
`disabled`, `id`. This consistency makes them easy to wire into react-hook-form or custom wizard
state management.
