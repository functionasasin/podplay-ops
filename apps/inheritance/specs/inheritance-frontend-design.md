# Inheritance Engine Frontend — Design Doc

**Date**: 2026-02-24
**Status**: Approved
**Location**: `loops/inheritance-rust-forward/frontend/`

## Overview

A browser-based frontend for the Philippine Inheritance Distribution Engine. Targets lawyers and estate planners who understand Civil Code concepts. Compiles the Rust engine to WebAssembly so everything runs client-side with no server.

## Architecture

```
loops/inheritance-rust-forward/
├── src/                    # Existing Rust engine (untouched)
├── Cargo.toml              # Existing, becomes workspace root or lib
├── wasm/                   # Thin wasm-bindgen crate
│   ├── Cargo.toml          # Depends on engine crate, adds wasm-bindgen
│   └── src/lib.rs          # Exports compute(json_string) -> json_string
├── frontend/               # Vite + React + TypeScript
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx         # Wizard shell + step routing
│   │   ├── engine.ts       # WASM loader, typed wrapper
│   │   ├── types.ts        # TypeScript mirrors of EngineInput/EngineOutput
│   │   ├── steps/          # One component per wizard step
│   │   │   ├── EstateStep.tsx
│   │   │   ├── DecedentStep.tsx
│   │   │   ├── FamilyTreeStep.tsx
│   │   │   ├── WillStep.tsx
│   │   │   ├── DonationsStep.tsx
│   │   │   └── ReviewStep.tsx
│   │   ├── results/        # Output visualization
│   │   │   ├── ResultsView.tsx
│   │   │   ├── HeirCard.tsx
│   │   │   ├── DistributionChart.tsx
│   │   │   └── NarrativePanel.tsx
│   │   └── components/     # Shared UI (PersonForm, MoneyInput, etc.)
│   └── public/
│       └── engine.wasm     # Pre-built WASM binary
```

### WASM Bridge

The `wasm/` crate wraps the existing engine with a single exported function:

```rust
#[wasm_bindgen]
pub fn compute(input_json: &str) -> String
```

Returns `EngineOutput` JSON on success, or an error JSON on failure. The existing `src/` Rust code stays untouched — the WASM crate depends on it as a library.

## Tech Stack

- **Build**: Vite
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: react-hook-form + zod
- **Charts**: Recharts (pie chart for distribution, bar segments for per-heir breakdown)
- **WASM**: wasm-pack + wasm-bindgen, loaded via vite-plugin-wasm

## Wizard Steps

### Step 1 — Estate Basics
- Net distributable estate amount (peso input → centavos)
- Succession type toggle: Intestate vs. Testate
- Config flags (retroactive RA 11642, max pipeline restarts)

### Step 2 — Decedent
- Name, date of death
- Marriage section: is_married toggle → date of marriage, legal separation, cohabitation years
- Death-bed marriage flags (articulo mortis, was ill, illness caused death)
- Illegitimate status toggle

### Step 3 — Family Tree
- "Add Person" button, each person is an expandable card
- Per person: name, relationship dropdown (11 types), alive/predeceased, degree
- Conditional sections based on relationship:
  - Children: filiation proof (if illegitimate/legitimated), children IDs for representation
  - Siblings: blood type (Full/Half)
  - Adopted: adoption sub-form (regime, decree date, adopter, rescission)
- Unworthiness/renunciation toggles
- Line of descent (paternal/maternal) when relevant
- Visual mini family tree showing relationships

### Step 4 — Will (only if testate)
- Will metadata: date executed
- Sub-tabs:
  - **Institutions**: heir reference, share spec (Fraction/EqualWithOthers/EntireEstate/EntireFreePort/Residuary), conditions, substitutes
  - **Legacies**: fixed amount or specific asset bequests
  - **Devises**: real property (specific or fractional interest)
  - **Disinheritances**: heir ref, cause code (grouped by Art. 919/920/921), proof status, reconciliation

### Step 5 — Donations
- "Add Donation" button, each is a card
- Recipient (pick from family tree or stranger), amount, date, description
- Exemption flags checklist (support/education, customary, wedding gift, professional expense, etc.)

### Step 6 — Review & Run
- Compact read-only summary of all entered data
- Validation errors shown inline
- "Compute Distribution" button → calls WASM engine

## Results View

### Distribution Overview
- Pie chart: each heir's total share as proportion of estate
- Scenario code badge (e.g. "T5a") with explanation
- Succession type label, total estate amount

### Per-Heir Cards
- Name, relationship category, inheritance mode (own right vs. representation)
- Amount breakdown: bar segments for legitime / free portion / intestate
- Donation imputation (gross entitlement vs. net from estate)
- Legal basis citations
- Expandable narrative section

### Audit & Warnings
- Collapsible computation log (10 pipeline steps)
- Warning cards for manual flags (preterition, inofficiousness) in amber
- Pipeline restart count

### Actions
- "Edit Input" — back to wizard with data preserved
- "Export JSON" — download input and/or output JSON
- "Copy Narrative" — copy all heir narratives as formatted text

## Validation

- Zod schemas mirror Rust types exactly
- Person IDs unique, decedent ID not in family tree
- Monetary amounts validated as positive integers
- Dates validated as ISO-8601
- Will step gated behind testate selection in step 1

## Build Pipeline

```bash
# Build WASM
cd wasm && wasm-pack build --target web && cd ..

# Copy WASM artifacts to frontend
cp wasm/pkg/engine_bg.wasm frontend/public/engine.wasm
cp wasm/pkg/engine.js frontend/src/engine-wasm.js

# Dev
cd frontend && npm run dev

# Production
cd frontend && npm run build  # Static output in frontend/dist/
```

## Key Decisions

- **No server**: Everything runs in the browser. No database.
- **Exact arithmetic preserved**: BigRational runs in WASM, no floating-point approximation.
- **Engine untouched**: Existing Rust source not modified. WASM crate is a thin wrapper.
- **Synchronous WASM**: Engine is fast enough to run on the main thread.
- **JSON save/load**: Users can export input as JSON files and re-import them later.
