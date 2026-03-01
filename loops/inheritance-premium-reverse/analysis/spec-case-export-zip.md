# Feature Spec: Case Export ZIP

**Aspect:** spec-case-export-zip
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** spec-pdf-export, spec-auth-persistence, codebase-audit
**Discovered by:** auth-persistence-patterns

---

## 1. Overview

The Case Export ZIP feature bundles all files associated with a case — computation input, computation output, the formatted PDF report, any case notes, and a machine-readable metadata manifest — into a single downloadable `.zip` archive. The lawyer can store this archive on their office server, send it to a client, attach it to email, or hand it to a paralegal for review. The archive is self-contained: it can be re-opened years later without any internet connection or app access.

**Why a PH estate lawyer needs this:**

Philippine law imposes strict record-retention obligations on practicing attorneys:
- **Canon 16, Rule 16.01 of the Code of Professional Responsibility (CPR):** Lawyers must account for all property and documents belonging to or obtained for the client. Estate settlement files are client property.
- **Section 26, Rule 138, Rules of Court:** Attorneys shall keep all client-related records and papers and return them to clients upon demand. A digital archive satisfies the "keeping" obligation.
- **BIR Revenue Regulations No. 17-2013:** Taxpayers (including law firms acting as authorized agents in estate tax filings) must retain all tax-related records for 10 years from filing date. The estate tax computation is part of this record.
- **RA 9470 (National Archives Act of 2007):** Records with legal or financial significance must be preserved. Estate distribution computations adjudicating property rights qualify.

Beyond legal compliance, the ZIP archive is operationally critical:
- SaaS platform could be unavailable or shut down years later; lawyers need offline copies
- BIR auditors may demand the underlying computation at any point within 3 years of estate tax assessment or 10 years if fraud is alleged
- Court records require computation exhibits to be reproduced on demand
- Heirs may challenge the distribution years later; a timestamped export proves the original computation

**Key user story:** Atty. Reyes finalizes the estate of Remedios Villanueva. She clicks "Export ZIP" in the ActionsBar → a ZIP file named `Estate-of-Remedios-Villanueva-2025-04-12.zip` downloads instantly. Inside: `input.json`, `output.json`, `report.pdf`, `notes.txt`, and `metadata.json`. She saves it to `G:\Clients\Villanueva-2025\` and emails a copy to the heir.

---

## 2. Data Model

The ZIP export is **entirely client-side** — no new database tables are required. All source data comes from:
- `cases` table row (`input_json`, `output_json`, `title`, `decedent_name`, `date_of_death`, `status`) — defined in `spec-auth-persistence`
- `case_notes` table rows for the case — defined in `spec-case-notes` (optional; ZIP exports gracefully without notes)
- `user_profiles` row for firm header — defined in `spec-auth-persistence`
- In-memory `EngineInput` + `EngineOutput` for anonymous (unsaved) exports

### 2.1 ZIP Archive Structure

```
Estate-of-Remedios-Villanueva-2025-04-12.zip
├── report.pdf          — Formatted PDF (from @react-pdf/renderer, same as "Export PDF")
├── input.json          — EngineInput (the wizard inputs fed to the WASM engine)
├── output.json         — EngineOutput (the full engine result including per_heir_shares, narratives, logs)
├── notes.txt           — Case notes (plain text, one note per block; OMITTED if no notes)
└── metadata.json       — Export manifest with case context and file descriptions
```

### 2.2 `metadata.json` Schema

```typescript
interface ZipMetadata {
  export_format_version: "1.0";         // Semver — increment when structure changes
  exported_at: string;                   // ISO 8601: "2026-03-01T14:30:00+08:00"
  case_id: string | null;               // UUID from cases table; null for anonymous exports
  case_title: string;                   // e.g., "Estate of Remedios Villanueva"
  decedent_name: string;                // e.g., "Remedios Santos Villanueva"
  date_of_death: string | null;         // ISO date: "2025-04-12"
  gross_estate_centavos: number | null; // Integer centavos
  gross_estate_formatted: string | null; // e.g., "₱12,500,000.00"
  case_status: "draft" | "computed" | "finalized" | "archived" | "anonymous";
  succession_scenario: string;          // e.g., "TESTATE_WITH_WILL" from EngineOutput.scenario_code
  heir_count: number;                   // EngineOutput.per_heir_shares.length
  exported_by: string | null;           // User email or null for anonymous
  files: {
    "report.pdf":   { description: string; size_note: string };
    "input.json":   { description: string; schema_version: string };
    "output.json":  { description: string; schema_version: string };
    "notes.txt"?:   { description: string; note_count: number };
  };
  legal_disclaimer: string;
}
```

**Concrete example `metadata.json`:**
```json
{
  "export_format_version": "1.0",
  "exported_at": "2026-03-01T14:30:00+08:00",
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "case_title": "Estate of Remedios Santos Villanueva",
  "decedent_name": "Remedios Santos Villanueva",
  "date_of_death": "2025-04-12",
  "gross_estate_centavos": 1250000000,
  "gross_estate_formatted": "₱12,500,000.00",
  "case_status": "finalized",
  "succession_scenario": "TESTATE_LEGITIMATE_CHILDREN_AND_SPOUSE",
  "heir_count": 4,
  "exported_by": "atty.reyes@reyeslaw.ph",
  "files": {
    "report.pdf": {
      "description": "Formatted Inheritance Distribution Analysis Report — suitable for court filing and client presentation",
      "size_note": "Approximately 80–250 KB depending on heir count and computation log length"
    },
    "input.json": {
      "description": "Raw wizard inputs: decedent info, family tree, will provisions, donations, and estate value",
      "schema_version": "inh-engine-input@1.0"
    },
    "output.json": {
      "description": "Full engine computation output: per-heir shares with NCC legal basis, narratives, warnings, and pipeline log",
      "schema_version": "inh-engine-output@1.0"
    },
    "notes.txt": {
      "description": "Case notes and annotations entered by counsel",
      "note_count": 3
    }
  },
  "legal_disclaimer": "This archive was generated by the Philippine Inheritance Calculator. The computation is based on user-supplied inputs and the provisions of the New Civil Code of the Philippines (Republic Act No. 386) as amended. This document is for reference only and does not constitute legal advice. Verify all figures against original documents before filing."
}
```

---

## 3. UI Design

### 3.1 Export ZIP Button Placement

The "Export ZIP" button lives in the `ActionsBar` component alongside the existing "Export PDF", "Edit Input", and "Copy Narratives" buttons.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Actions                                                                    │
│                                                                             │
│  [Edit Input]   [Export PDF]   [Export ZIP ▾]   [Copy Narratives]  [Share] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The `[Export ZIP ▾]` button has a dropdown arrow because it offers two modes:

**Dropdown options:**
```
┌─────────────────────────────────────────┐
│  Export ZIP (with PDF)                  │  ← default, includes PDF
│  Export ZIP (data only, no PDF)         │  ← skips PDF generation; faster
└─────────────────────────────────────────┘
```

**Why two modes:**
- "With PDF" is the default for compliance: all three files.
- "Data only" is useful for developers or cases where the lawyer wants to quickly back up inputs/outputs without waiting for PDF rendering (~100–300ms savings on large cases).

### 3.2 Progress Feedback

ZIP generation is synchronous (all client-side), but PDF generation via `@react-pdf/renderer` can take 100–500ms for complex cases. Show a non-blocking inline loading indicator on the button:

```
[⏳ Generating ZIP…]    ← spinner on button label during generation
[✓ ZIP Downloaded]      ← brief success state, reverts to normal after 2s
[✗ Export failed · Retry]   ← error state with retry action
```

**No modal, no separate progress page** — this is a brief client-side operation that should never need a loading modal. If it takes longer than 2 seconds something is wrong.

### 3.3 Dashboard Integration

The case list kebab menu (`[···]` on each case card) adds a new "Export ZIP" option:

```
┌─────────────────────┐
│  Rename             │
│  Finalize           │
│  Export PDF         │
│  Export ZIP         │  ← NEW
│  Archive            │
│  ─────────────────  │
│  Delete             │
└─────────────────────┘
```

Clicking "Export ZIP" from the dashboard triggers:
1. `loadCase(caseId)` to fetch `input_json` + `output_json` + `decedent_name` (if not already loaded)
2. `listCaseNotes(caseId)` to fetch notes (if spec-case-notes is implemented)
3. `loadUserProfile()` for firm header in PDF
4. ZIP generation + download

Progress indicator: The kebab menu item changes to "Exporting…" then "Done" inline.

### 3.4 Filename Convention

```typescript
function zipFilename(caseTitle: string, dateOfDeath: string | null): string {
  // Sanitize: replace non-alphanumeric chars (except hyphens) with hyphens
  const slug = caseTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60)  // cap at 60 chars to avoid OS filename limits

  const datePart = dateOfDeath
    ? dateOfDeath.replace(/-/g, '-')   // already ISO: YYYY-MM-DD
    : new Date().toISOString().split('T')[0]

  return `${slug}-${datePart}.zip`
  // Example: "Estate-of-Remedios-Santos-Villanueva-2025-04-12.zip"
}
```

---

## 4. API / Data Layer

### 4.1 Package: `jszip`

**Recommendation: `jszip@3.10.1`**

| Library | Bundle size | Browser support | API style | Streams |
|---------|-------------|-----------------|-----------|---------|
| `jszip@3.10.1` | 98 KB gzipped | All modern + IE11 | Promise-based | No |
| `fflate@0.8.2` | 30 KB gzipped | All modern | Sync/async | Yes |
| `archiver` | Node.js only | N/A | Stream | Yes |

`jszip` is chosen over `fflate` because:
- Significantly better documentation and community examples
- Mature API with clear blob generation (`generateAsync({ type: 'blob' })`)
- Full TypeScript types in `@types/jszip`
- The 68 KB size difference is negligible (shipped once, tree-shakeable)

```bash
npm install jszip
npm install --save-dev @types/jszip
```

### 4.2 Core Export Function

```typescript
// lib/exportZip.ts
import JSZip from 'jszip'
import { generatePdf } from './generatePdf'               // from spec-pdf-export
import { listCaseNotes } from './caseNotes'               // from spec-case-notes
import { loadCase } from './cases'                        // from spec-auth-persistence
import { loadUserProfile } from './userProfile'           // from spec-firm-branding
import type { EngineInput, EngineOutput } from '@/types'
import type { FirmProfile } from '@/types/firm'
import type { ZipMetadata } from '@/types/export'

export interface ExportZipOptions {
  includePdf: boolean   // default: true
}

export interface ExportZipSource {
  input: EngineInput
  output: EngineOutput
  caseId: string | null
  caseTitle: string
  firmProfile?: FirmProfile
  notes?: { content: string; created_at: string }[]
  exportedByEmail?: string
}

export async function exportCaseZip(
  source: ExportZipSource,
  opts: ExportZipOptions = { includePdf: true }
): Promise<void> {
  const zip = new JSZip()

  // ── 1. input.json ───────────────────────────────────────────────
  zip.file(
    'input.json',
    JSON.stringify(source.input, null, 2),
    { binary: false }
  )

  // ── 2. output.json ──────────────────────────────────────────────
  zip.file(
    'output.json',
    JSON.stringify(source.output, null, 2),
    { binary: false }
  )

  // ── 3. report.pdf (optional) ────────────────────────────────────
  if (opts.includePdf) {
    const pdfBlob = await generatePdf({
      input: source.input,
      output: source.output,
      firmProfile: source.firmProfile,
      generatedAt: new Date().toISOString(),
    })
    // generatePdf returns a Blob; JSZip accepts Blob directly
    zip.file('report.pdf', pdfBlob)
  }

  // ── 4. notes.txt (optional) ─────────────────────────────────────
  if (source.notes && source.notes.length > 0) {
    const notesText = source.notes
      .map((n, i) => {
        const date = new Date(n.created_at).toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
        return `--- Note ${i + 1} (${date}) ---\n${n.content}`
      })
      .join('\n\n')
    zip.file('notes.txt', notesText)
  }

  // ── 5. metadata.json ────────────────────────────────────────────
  const grossEstateCentavos = source.input.net_distributable_estate ?? null
  const grossEstateFormatted = grossEstateCentavos !== null
    ? `₱${(grossEstateCentavos / 100).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    : null

  const metadata: ZipMetadata = {
    export_format_version: '1.0',
    exported_at: new Date().toISOString(),
    case_id: source.caseId,
    case_title: source.caseTitle,
    decedent_name: source.input.decedent?.name ?? source.caseTitle,
    date_of_death: source.input.decedent?.date_of_death ?? null,
    gross_estate_centavos: grossEstateCentavos,
    gross_estate_formatted: grossEstateFormatted,
    case_status: source.caseId ? 'computed' : 'anonymous',
    succession_scenario: source.output.scenario_code,
    heir_count: source.output.per_heir_shares.length,
    exported_by: source.exportedByEmail ?? null,
    files: {
      'report.pdf': opts.includePdf
        ? {
            description: 'Formatted Inheritance Distribution Analysis Report — suitable for court filing and client presentation',
            size_note: 'Approximately 80–250 KB depending on heir count and computation log length',
          }
        : undefined,
      'input.json': {
        description: 'Raw wizard inputs: decedent info, family tree, will provisions, donations, and estate value',
        schema_version: 'inh-engine-input@1.0',
      },
      'output.json': {
        description: 'Full engine computation output: per-heir shares with NCC legal basis, narratives, warnings, and pipeline log',
        schema_version: 'inh-engine-output@1.0',
      },
      ...(source.notes && source.notes.length > 0
        ? {
            'notes.txt': {
              description: 'Case notes and annotations entered by counsel',
              note_count: source.notes.length,
            },
          }
        : {}),
    } as ZipMetadata['files'],
    legal_disclaimer:
      'This archive was generated by the Philippine Inheritance Calculator. The computation is based on user-supplied inputs and the provisions of the New Civil Code of the Philippines (Republic Act No. 386) as amended. This document is for reference only and does not constitute legal advice. Verify all figures against original documents before filing.',
  }

  zip.file('metadata.json', JSON.stringify(metadata, null, 2))

  // ── 6. Generate + trigger download ──────────────────────────────
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },   // balanced: size vs speed
  })

  const filename = zipFilename(source.caseTitle, source.input.decedent?.date_of_death ?? null)
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke after 60s to allow download to start
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function zipFilename(caseTitle: string, dateOfDeath: string | null): string {
  const slug = caseTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60)
  const datePart = dateOfDeath ?? new Date().toISOString().split('T')[0]
  return `${slug}-${datePart}.zip`
}
```

### 4.3 React Hook: `useExportZip`

```typescript
// hooks/useExportZip.ts
import { useState, useCallback } from 'react'
import { exportCaseZip, ExportZipOptions, ExportZipSource } from '@/lib/exportZip'

export type ExportZipStatus = 'idle' | 'generating' | 'done' | 'error'

export function useExportZip() {
  const [status, setStatus] = useState<ExportZipStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const triggerExport = useCallback(async (
    source: ExportZipSource,
    opts?: ExportZipOptions
  ) => {
    if (status === 'generating') return   // prevent double-click
    setStatus('generating')
    setErrorMessage(null)

    try {
      await exportCaseZip(source, opts)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Export failed')
    }
  }, [status])

  return { status, errorMessage, triggerExport }
}
```

### 4.4 ActionsBar Integration

```typescript
// components/results/ActionsBar.tsx  (modified)
import { useExportZip } from '@/hooks/useExportZip'
import { useAuth } from '@/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ActionsBarProps {
  input: EngineInput
  output: EngineOutput
  caseId: string | null
  onEditInput: () => void
}

export function ActionsBar({ input, output, caseId, onEditInput }: ActionsBarProps) {
  const { user } = useAuth()
  const { status: zipStatus, triggerExport } = useExportZip()

  async function buildSource(includePdf: boolean): Promise<ExportZipSource> {
    const firmProfile = user
      ? await loadUserProfile(user.id).catch(() => undefined)
      : undefined

    const notes = caseId
      ? await listCaseNotes(caseId).catch(() => [])
      : []

    return {
      input,
      output,
      caseId,
      caseTitle: `Estate of ${input.decedent?.name ?? 'Unknown'}`,
      firmProfile,
      notes,
      exportedByEmail: user?.email,
    }
  }

  async function handleExportZip(includePdf: boolean) {
    const source = await buildSource(includePdf)
    triggerExport(source, { includePdf })
  }

  const zipLabel =
    zipStatus === 'generating' ? '⏳ Generating ZIP…'
    : zipStatus === 'done'     ? '✓ ZIP Downloaded'
    : zipStatus === 'error'    ? '✗ Failed · Retry'
    : 'Export ZIP'

  return (
    <div className="flex flex-wrap gap-2 py-4">
      <button onClick={onEditInput}>Edit Input</button>
      <button onClick={() => handleExportPdf(input, output)}>Export PDF</button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button disabled={zipStatus === 'generating'}>
            {zipLabel} ▾
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExportZip(true)}>
            Export ZIP (with PDF)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportZip(false)}>
            Export ZIP (data only, no PDF)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button onClick={() => copyNarratives(output)}>Copy Narratives</button>
    </div>
  )
}
```

### 4.5 Dashboard-Level Export

For exporting from the dashboard kebab menu without navigating to the case:

```typescript
// lib/exportZipFromDashboard.ts
import { loadCase } from './cases'
import { listCaseNotes } from './caseNotes'
import { loadUserProfile } from './userProfile'
import { exportCaseZip } from './exportZip'
import type { User } from '@supabase/supabase-js'

export async function exportCaseFromDashboard(
  caseId: string,
  user: User
): Promise<void> {
  // Parallel fetches: case data, notes, firm profile
  const [caseRow, notes, firmProfile] = await Promise.all([
    loadCase(caseId),
    listCaseNotes(caseId).catch(() => []),
    loadUserProfile(user.id).catch(() => undefined),
  ])

  if (!caseRow || !caseRow.input_json || !caseRow.output_json) {
    throw new Error(
      'Case data is incomplete. Open the case and re-run the computation before exporting.'
    )
  }

  await exportCaseZip({
    input: caseRow.input_json as EngineInput,
    output: caseRow.output_json as EngineOutput,
    caseId,
    caseTitle: caseRow.title,
    firmProfile,
    notes,
    exportedByEmail: user.email ?? undefined,
  })
}
```

---

## 5. Integration Points

### 5.1 `spec-pdf-export`

The `generatePdf()` function from `spec-pdf-export` is called directly within `exportCaseZip()`. It receives the same `PDFReportData` shape and returns a `Blob`. No modifications to the PDF generation logic are needed — `exportCaseZip` is a consumer, not a modifier.

**Contract used:**
```typescript
// From spec-pdf-export
export async function generatePdf(data: PDFReportData): Promise<Blob>
```

### 5.2 `spec-auth-persistence`

- `loadCase(caseId)` — retrieves `input_json`, `output_json`, `title` from `cases` table
- `loadUserProfile(userId)` — retrieves firm name, counsel name, logo for PDF header
- Both functions are already defined in `spec-auth-persistence`; no new queries needed

### 5.3 `spec-case-notes` (Optional)

If `spec-case-notes` is implemented, `listCaseNotes(caseId)` retrieves all notes for inclusion in `notes.txt`. The function signature expected:

```typescript
// From spec-case-notes
export async function listCaseNotes(
  caseId: string
): Promise<{ id: string; content: string; created_at: string }[]>
```

If `spec-case-notes` is not yet built, the ZIP export gracefully omits `notes.txt` — the `notes` field is optional in `ExportZipSource`.

### 5.4 `spec-firm-branding`

When firm profile data is available, the PDF embedded in the ZIP will include the firm letterhead (name, address, IBP roll, PTR, MCLE). If branding is not yet set up, the PDF is generated without letterhead — same fallback as standalone PDF export.

### 5.5 Anonymous Export

The export feature works for anonymous (unsaved) cases. When `caseId` is null:
- `metadata.json` sets `case_status: "anonymous"` and `case_id: null`
- Notes are omitted (no case to look up)
- Firm profile is omitted
- PDF is generated without letterhead
- The "Export ZIP (with PDF)" option still generates a complete archive

This allows the export feature to be useful even without authentication.

---

## 6. Edge Cases

### 6.1 Data Completeness

| Scenario | Handling |
|----------|----------|
| `output_json` is null (draft never computed) | "Export ZIP" button is disabled with tooltip: "Run the computation first before exporting" |
| `input_json` is null (corrupt case) | Error message: "Case input data is missing. Open the case and re-run computation." |
| Case has 0 heirs in output | ZIP still generates; distribution table in PDF shows an empty heirs section with warning |
| Notes table query fails (spec-case-notes not yet deployed) | `notes.txt` silently omitted; no error shown to user |
| Firm profile query fails | PDF generated without letterhead; no error shown; ZIP still downloads |

### 6.2 PDF Generation Errors

| Scenario | Handling |
|----------|----------|
| `@react-pdf/renderer` throws (corrupt font, malformed data) | `useExportZip` catches error; button shows "✗ Failed · Retry"; user can retry with "Export ZIP (data only, no PDF)" as fallback |
| PDF takes longer than 3 seconds | No timeout imposed — let the Promise resolve naturally. If PDF consistently fails, user should use "data only" mode |
| Very large case (50+ heirs, 200+ computation log entries) | PDF generation handles long content via page breaks. ZIP file size expected 500 KB–2 MB max. No special handling needed |

### 6.3 File System / Download

| Scenario | Handling |
|----------|----------|
| Browser blocks programmatic download (popup blocker) | The download link is appended to `document.body` before click; this pattern is not blocked by popup blockers (it is not a `window.open()` call) |
| User clicks "Export ZIP" twice rapidly | `status === 'generating'` guard prevents double-export |
| Disk full on client device | Browser download fails silently or shows OS-level error. No app-side handling needed — this is a browser/OS concern |
| ZIP contains non-ASCII chars in filename | `URL.createObjectURL` + `a.download` attribute handles UTF-8 filenames in all modern browsers. Sanitization in `zipFilename()` replaces problematic chars with hyphens |
| Safari compatibility | JSZip generates `Blob`; Safari requires the `<a>` download click pattern (same as other browsers). No Safari-specific workaround needed |

### 6.4 Permissions

| Action | Permission |
|--------|------------|
| Export ZIP (anonymous) | Always allowed; produces archive without firm branding or notes |
| Export ZIP (authenticated, own case) | Allowed; includes firm branding, notes |
| Export ZIP (shared case, viewer) | Allowed for read-only data. PDF and JSON exported; no notes (notes are private) |
| Export ZIP from dashboard | Allowed only for own cases (RLS on `loadCase` enforces ownership) |

### 6.5 Validation

| Rule | Implementation |
|------|----------------|
| Cannot export if `output_json` is null | Disable button in UI; function throws if called programmatically without output |
| ZIP filename max length 255 chars | `zipFilename()` caps slug at 60 chars + date = ~71 total, well within limit |
| `metadata.json` `export_format_version` must be `"1.0"` | Hardcoded in `exportCaseZip()`; must be bumped when ZIP structure changes |

---

## 7. Dependencies

### 7.1 Feature Dependencies

- `spec-pdf-export` — must be built first (provides `generatePdf()` function)
- `spec-auth-persistence` — must be built first (provides `loadCase()`, `loadUserProfile()`, `cases` table)
- `spec-case-notes` — optional; if built, notes are included. If not built, notes are omitted silently

### 7.2 Package Dependencies

```bash
npm install jszip
npm install --save-dev @types/jszip
```

No additional environment variables are required — all computation is client-side.

### 7.3 File Changes Required

| File | Change |
|------|--------|
| `package.json` | Add `jszip` dependency |
| `src/lib/exportZip.ts` | NEW — core ZIP assembly and download |
| `src/lib/exportZipFromDashboard.ts` | NEW — dashboard-level convenience wrapper |
| `src/hooks/useExportZip.ts` | NEW — React hook managing export status |
| `src/types/export.ts` | NEW — `ZipMetadata` interface |
| `src/components/results/ActionsBar.tsx` | MODIFY — add Export ZIP dropdown button |
| `src/pages/Dashboard.tsx` | MODIFY — add "Export ZIP" to case kebab menu |

---

## 8. Acceptance Criteria

### Basic Export

- [ ] "Export ZIP" button appears in ActionsBar when `output` is available
- [ ] "Export ZIP" button is visibly disabled (with tooltip "Run computation first") when `output` is null
- [ ] Clicking "Export ZIP (with PDF)" downloads a `.zip` file within 3 seconds for cases with ≤ 20 heirs
- [ ] Clicking "Export ZIP (data only, no PDF)" downloads a `.zip` file within 500ms
- [ ] Downloaded ZIP filename follows format: `Estate-of-[Name]-YYYY-MM-DD.zip`
- [ ] Non-ASCII characters in decedent name (e.g., "ñ", "Ñ") are replaced with hyphens in filename

### ZIP Contents

- [ ] `input.json` inside the ZIP is valid JSON matching the `EngineInput` type
- [ ] `output.json` inside the ZIP is valid JSON matching the `EngineOutput` type
- [ ] `report.pdf` inside the ZIP is a valid PDF that opens in Adobe Reader, Chrome, Safari
- [ ] `metadata.json` inside the ZIP is valid JSON and matches the `ZipMetadata` schema
- [ ] `notes.txt` is present when the case has at least one note, absent when it has none
- [ ] Each note in `notes.txt` is preceded by a date/time header in Philippine Standard Time (UTC+8)
- [ ] `metadata.json` `legal_disclaimer` field is present and non-empty

### Anonymous Export

- [ ] Anonymous user (no auth) can use "Export ZIP" — download proceeds without auth prompt
- [ ] Anonymous export `metadata.json` has `case_id: null` and `case_status: "anonymous"`
- [ ] Anonymous export PDF has no firm letterhead (correct — no profile available)

### Dashboard Export

- [ ] Case kebab menu on Dashboard includes "Export ZIP" item
- [ ] Clicking "Export ZIP" from dashboard exports the case without requiring navigation to case detail
- [ ] Dashboard export uses the same filename convention
- [ ] "Export ZIP" from dashboard shows inline loading state ("Exporting…") and completion ("Done") on the kebab menu item

### Error Handling

- [ ] If PDF generation fails, button shows "✗ Failed · Retry" and clicking it retries the export
- [ ] The "Export ZIP (data only, no PDF)" option always succeeds when `input_json` and `output_json` are present (no PDF generation to fail)
- [ ] Double-clicking "Export ZIP" rapidly does not produce two ZIP downloads

### Compression

- [ ] ZIP file uses DEFLATE compression at level 6
- [ ] ZIP file for a typical 4-heir testate case with one note and PDF is under 500 KB
- [ ] ZIP file for a 30-heir intestate case with computation log and PDF is under 3 MB

### Security

- [ ] User can only export their own cases from the dashboard (RLS enforced via `loadCase()`)
- [ ] The export function does not make any additional server calls beyond what is needed to fetch case data (no telemetry, no upload of ZIP to server)
- [ ] `URL.createObjectURL()` object URL is revoked after 60 seconds to release browser memory
