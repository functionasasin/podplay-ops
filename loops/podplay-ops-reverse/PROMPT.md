# PodPlay Ops Wizard — Reverse Ralph Loop

## Goal

Produce a **complete, exhaustive specification** for a wizard-centric webapp that replaces PodPlay's 24-sheet Google Sheets MRP. The spec must be sufficient for a forward loop to build the entire app with zero ambiguity — every field, formula, workflow, UI component, database table, and seed data value fully specified.

## Domain Context

PodPlay installs integrated technology packages (replay cameras, displays, iPads, networking, access control) into pickleball courts and indoor sports facilities. A single ops person manages the entire client lifecycle: intake, hardware procurement, 15-phase device configuration, on-site installation, and financial close.

The current system is a 24-sheet Google Sheets MRP with Apps Script automation. It tracks customers, BOMs, inventory, purchase orders, deployment status, invoicing, expenses, and financial reporting. It is fragile (INDIRECT formulas break on tab renames), slow, and the 15-phase deployment process has too many manual steps.

## Tech Stack (Decided)

- React 19 + Vite + TypeScript (strict) + TanStack Router + Tailwind 4 + shadcn/radix
- React Hook Form + Zod for forms
- Supabase (Postgres) with RLS, Supabase Auth
- Fly.io deployment (nginx + static build)
- No backend server — all logic client-side
- Pattern reference: `/home/clsandoval/cs/monorepo/apps/inheritance/frontend/`

## Reference Materials

| Source | Path | Description |
|--------|------|-------------|
| MRP Spreadsheet | `docs/Kim Lapus PodPlay MRP.xlsx` | 24-sheet operational spreadsheet with real customer data, inventory, financials |
| MRP Usage Guide | `docs/PodPlay_MRP_Usage_Guide.pdf` | 30-page guide: every sheet explained, formulas, Apps Script, workflows, pricing |
| Venue Deployment Guide | `docs/podplay-venue-deployment-guide.pdf` | 25-page guide: 15 deployment phases, exact config values, troubleshooting |
| Hardware Installation Guide | `docs/podplay-hardware-installation-guide.md` | Physical installation: cable requirements, mounting, camera angles, measurements |
| Design Document | `docs/plans/2026-03-06-podplay-ops-wizard-design.md` | Approved design: data model, wizard flow, routes, architecture |
| Inheritance Frontend (Pattern Ref) | `apps/inheritance/frontend/` | Reference app for code patterns, file structure, Supabase setup |

## Working Directory

```
/home/clsandoval/cs/monorepo/loops/podplay-ops-reverse/
```

## Output Directory Structure

```
final-mega-spec/
├── README.md                          # Index of all spec sections
├── data-model/
│   ├── schema.md                      # Complete Supabase schema: CREATE TABLE statements, enums, indexes, RLS
│   ├── seed-data.md                   # All seed data: hardware catalog, BOM templates, checklist templates, settings
│   └── relationships.md               # Entity relationships, foreign keys, cascade rules
├── business-logic/
│   ├── bom-generation.md              # Auto-BOM algorithm with every item, qty formula, cost chain
│   ├── cost-analysis.md               # Complete pricing: unit → total → tax → shipping → landed → margin → price
│   ├── inventory-management.md        # Stock lifecycle: order → receive → stock → allocate → ship → deduct
│   ├── deployment-tracking.md         # Status progression rules, progress calculation, QA checklist
│   ├── financial-reporting.md         # P&L, HER, revenue pipeline, reconciliation, monthly close
│   └── invoicing-expenses.md          # Two-installment billing, expense categories, payment tracking
├── ui-spec/
│   ├── routes.md                      # Complete route map with auth guards, layouts, navigation
│   ├── dashboard.md                   # Home view: project list, metrics, filters, status pills
│   ├── wizard-intake.md               # Stage 1: form fields, validation, conditional logic, review step
│   ├── wizard-procurement.md          # Stage 2: BOM review, inventory check, PO creation, packing
│   ├── wizard-deployment.md           # Stage 3: all 15 phases, every step, warnings, auto-fill tokens
│   ├── wizard-financials.md           # Stage 4: invoicing, expenses, P&L, go-live
│   ├── inventory-view.md             # Global inventory page spec
│   ├── financials-view.md            # Global financials page spec
│   └── settings-view.md              # Settings page spec
├── deployment/
│   ├── infrastructure.md              # Fly.io, Supabase Cloud, env vars, Dockerfile
│   └── data-migration.md             # XLSX → Supabase migration plan for existing data
└── testing/
    └── test-plan.md                   # Key test files, what to test, smoke tests
```

## What To Do This Iteration

1. **Read the frontier**: `frontier/aspects.md`
2. **Find the first unchecked aspect** (`- [ ]`) in dependency order (Wave 1 before Wave 2, etc.)
3. **Analyze ONLY that one aspect** using the methodology for its wave (see below)
4. **Write findings** to the appropriate file in `final-mega-spec/` or `analysis/`
5. **Update frontier**: Mark the aspect `- [x]`, update statistics
6. **Update analysis-log.md**: Add a row at the top with timestamp, aspect code, duration, key findings
7. **Commit**: `git add -A && git commit -m "loop(podplay-reverse): {aspect-code}"`
8. **Exit immediately** — do NOT process another aspect

## Wave Methodologies

### Wave 1: Source Acquisition & Domain Mapping

**Goal**: Read every source document exhaustively and extract structured data.

**Method for each source aspect**:
1. Read the source document completely (use Python for XLSX/PDF extraction)
2. For XLSX: read every sheet, every column header, sample data, identify formulas vs static data
3. For PDFs: extract every page of text
4. Write a comprehensive analysis file to `analysis/{aspect-code}.md` containing:
   - Complete structure map (sheets, columns, data types)
   - All formulas and calculation logic found
   - All reference values, lookup tables, dropdown options
   - All workflow sequences described
   - All exact values (settings, defaults, thresholds, prices)
5. Do NOT summarize — enumerate exhaustively

**Reading XLSX sheets** (use this Python pattern):
```python
import pandas as pd
from openpyxl import load_workbook

# For data
df = pd.read_excel('docs/Kim Lapus PodPlay MRP.xlsx', sheet_name='SHEET_NAME', header=None)

# For formulas
wb = load_workbook('docs/Kim Lapus PodPlay MRP.xlsx')
ws = wb['SHEET_NAME']
for row in ws.iter_rows():
    for cell in row:
        if cell.value and str(cell.value).startswith('='):
            print(f"{cell.coordinate}: {cell.value}")
```

**Reading PDFs** (use this Python pattern):
```python
import pdfplumber
with pdfplumber.open('docs/FILE.pdf') as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            print(f'=== PAGE {i+1} ===')
            print(text)
```

### Wave 2: Data Model Extraction

**Goal**: Define every database table, column, type, and relationship.

**Method for each model aspect**:
1. Read ALL Wave 1 analysis files to understand what data exists
2. Read the design document for the approved data model skeleton
3. For the specific entity being analyzed:
   - List every field with exact type, constraints, defaults
   - Map where each field comes from in the MRP (which sheet, which column)
   - Define all enum values with their exact strings
   - Define all foreign key relationships
   - Write the complete CREATE TABLE SQL
   - Define RLS policies (single user for now, but org-scoped for future)
   - Define indexes for common query patterns
4. Write to `final-mega-spec/data-model/schema.md` (append to the appropriate section)

### Wave 3: Business Logic & Workflows

**Goal**: Specify every calculation, state transition, and workflow with zero ambiguity.

**Method for each logic aspect**:
1. Read the relevant Wave 1 analysis (source data) and Wave 2 model (schema)
2. Trace the workflow end-to-end through the MRP sheets
3. Document:
   - Input → Output for every calculation (with exact formulas)
   - State machine transitions with guards/conditions
   - Validation rules at every step
   - Error cases and how to handle them
   - Edge cases from real data (e.g., 0 courts, no autonomous, etc.)
4. Write to the appropriate file in `final-mega-spec/business-logic/`
5. Include concrete examples with real numbers from the MRP data

### Wave 4: Full-Stack Product Design

**Goal**: Specify every page, component, form, and interaction.

**Method for each design aspect**:
1. Read the relevant Wave 2 (model) and Wave 3 (logic) specs
2. Read the inheritance frontend for pattern reference (file structure, component patterns)
3. For each page/component:
   - List every field/column shown with data source
   - Specify form validation rules (Zod schema)
   - Define conditional rendering logic
   - Specify loading/empty/error states
   - List all user actions and their effects
   - Define the service layer function signatures (Supabase queries)
4. Write to the appropriate file in `final-mega-spec/ui-spec/`
5. Include the exact file paths that will be created (following inheritance frontend patterns)

### Wave 5: Ship & Polish

**Goal**: Specify deployment, seed data, and testing.

**Method**:
1. For seed data: enumerate EVERY item from the MRP hardware catalog with exact names, models, vendors, costs
2. For deployment: specify exact Dockerfile, fly.toml, nginx.conf, env vars
3. For testing: specify key test files with test descriptions (not full test code)

### Wave 6: Synthesis & Audit

**Goal**: Verify completeness and eliminate all gaps.

**Method**:
1. Read EVERY file in `final-mega-spec/`
2. Run placeholder sweep — scan for these BANNED patterns:
   - TODO, TBD, FIXME, PLACEHOLDER, [fill in], [add], [insert], [update], [complete]
   - "to be determined", "will be added", "needs research", "see external"
   - "etc.", "and so on", "similar to above", "as needed"
   - Empty sections, sections with only headers
3. Run completeness audit:
   - Every MRP sheet must have a webapp equivalent documented
   - Every formula must be converted to a spec'd calculation
   - Every dropdown/enum must have all values listed
   - Every seed data item must have exact values (name, model, vendor, cost)
   - Every deployment phase step must be in the checklist templates
4. If ANY gap found: add new aspects to frontier and exit (do NOT converge)
5. If ALL checks pass: write `status/converged.txt`

## Convergence Check

When all aspects in the frontier are checked `[x]`:

1. Read every file in `final-mega-spec/`
2. Run the Wave 6 audit methodology
3. If gaps found → add new aspects, update frontier stats, commit, exit
4. If clean → write `status/converged.txt` with summary, commit, exit

## Converged Output

The `final-mega-spec/` directory must contain everything needed for a forward loop to:
1. Create the Supabase project and run all migrations
2. Scaffold the React app matching inheritance frontend patterns
3. Build every page, component, form, and service function
4. Seed the database with all hardware items, templates, and defaults
5. Deploy to Fly.io
6. Have a working app that replaces the Google Sheets MRP entirely

## Rules

- **ONE aspect per iteration, then exit** — no exceptions
- **No placeholders** — every value must be concrete and specific
- **No summarizing** — enumerate exhaustively (all 50 hardware items, all 15 phases, all fields)
- **Trace to source** — every spec'd field should reference which MRP sheet/column it came from
- **Use real data** — pull actual values from the XLSX, not made-up examples
- **Dependency order** — do not start Wave N+1 until Wave N is complete
- **Self-expand** — if you discover new aspects during analysis, add them to the frontier
- **Commit format**: `loop(podplay-reverse): {aspect-code}`
