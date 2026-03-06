# TaxKlaro — Unified Platform Specification

**Date:** 2026-03-06
**Version:** 1.0 (from reverse-ralph synthesis, Wave 7)
**Purpose:** Forward loop builds the entire product from this document alone. Zero orphaned components. Zero type mismatches. Zero platform boot failures.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Repository Structure](#2-repository-structure)
3. [Engine — Rust WASM](#3-engine--rust-wasm)
4. [Bridge Contract](#4-bridge-contract)
5. [TypeScript Types](#5-typescript-types)
6. [Zod Schemas](#6-zod-schemas)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Design System](#8-design-system)
9. [Platform Layer — Auth](#9-platform-layer--auth)
10. [Platform Layer — Database Migrations](#10-platform-layer--database-migrations)
11. [Platform Layer — Routes](#11-platform-layer--routes)
12. [Platform Layer — Navigation](#12-platform-layer--navigation)
13. [Platform Layer — Org Model](#13-platform-layer--org-model)
14. [Component Wiring Map](#14-component-wiring-map)
15. [Testing](#15-testing)
16. [Deployment](#16-deployment)
17. [Monitoring and Alerts](#17-monitoring-and-alerts)
18. [Cross-Layer Consistency Checklist](#18-cross-layer-consistency-checklist)
19. [Critical Traps Master List](#19-critical-traps-master-list)
20. [Glossary](#20-glossary)

---

## 1. Overview

### Product

TaxKlaro is a Philippine freelance and self-employed income tax optimizer for tax year 2023+. It helps accountants and CPAs compute the optimal tax regime for their clients.

### Three Tax Paths

| Path | Name | Regime |
|------|------|--------|
| A | Graduated + Itemized | NIRC Sec. 24(A) + Sec. 34 deductions |
| B | Graduated + OSD 40% | NIRC Sec. 24(A) + Optional Standard Deduction |
| C | 8% Flat Rate | NIRC Sec. 24(A)(2)(b) — max ₱3M gross only |

The engine computes all applicable paths and recommends the lowest-tax option.

### Architecture

```
apps/taxklaro/
├── engine/          # Rust → wasm-pack → pkg/ (no I/O, pure computation)
├── frontend/        # React 19 + Vite + TanStack Router (loads WASM via bridge.ts)
│   └── supabase/    # Supabase migrations (4 files)
└── .github/
    └── workflows/   # ci.yml + deploy.yml
```

**Stack:**
- Engine: Rust + `rust_decimal` + `serde_json` → WASM (wasm-pack `--target web`)
- Frontend: React 19, Vite 6, TanStack Router v1, shadcn/ui, Radix, Tailwind CSS 4
- Auth/DB: Supabase (PKCE email/password, magic link, PostgreSQL, RLS, RPC)
- Hosting: Docker → nginx:alpine → Fly.io (Singapore region)
- Testing: Vitest (unit), Playwright (E2E)
- Error tracking: Sentry Browser SDK
- Uptime: BetterUptime external probe

### What This Is Not

- No Express server
- No Node.js runtime in production
- No Drizzle or Prisma ORM (Supabase client only)
- No Next.js (Vite SPA only)
- No Vercel (Fly.io only)

---

## 2. Repository Structure

```
apps/taxklaro/
├── engine/
│   ├── Cargo.toml
│   ├── Cargo.lock               # Must be committed
│   └── src/
│       ├── lib.rs
│       ├── wasm.rs              # #[wasm_bindgen] exports
│       ├── pipeline.rs          # 16-step pipeline (PL-01 to PL-17)
│       ├── types.rs             # All domain types
│       ├── rates.rs             # Tax rate tables
│       └── errors.rs            # EngineError, ValidationWarning, etc.
├── frontend/
│   ├── Dockerfile               # Multi-stage: node:20-alpine → nginx:alpine
│   ├── fly.toml
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── .env.local.example
│   ├── pkg/                     # wasm-pack output (built in Docker, see Dockerfile)
│   ├── supabase/
│   │   ├── config.toml
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_rls_policies.sql
│   │       ├── 003_rpc_functions.sql
│   │       └── 004_storage.sql
│   └── src/
│       ├── main.tsx
│       ├── router.ts
│       ├── routes/              # 18 route files
│       ├── components/          # 90 component files
│       ├── hooks/               # useAuth, useCompute, useAutoSave, useOrganization
│       ├── lib/                 # supabase.ts, auth.ts, computations.ts, monitoring.ts, etc.
│       ├── types/               # common.ts, engine-input.ts, engine-output.ts, org.ts
│       ├── schemas/             # Zod schemas (6 files)
│       └── wasm/
│           ├── bridge.ts        # WASM init + compute wrapper
│           └── pkg/             # symlink or direct wasm-pack output
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

---

## 3. Engine — Rust WASM

### 3.1 Cargo.toml

```toml
[package]
name = "taxklaro-engine"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_with = "3"
rust_decimal = { version = "1", features = ["serde-with-str"] }
chrono = { version = "0.4", features = ["serde"] }
getrandom = { version = "0.2", features = ["js"] }

[profile.release]
opt-level = "z"
lto = true
panic = "abort"           # Required for WASM size and compatibility
```

### 3.2 WASM Exports — `src/wasm.rs`

```rust
use wasm_bindgen::prelude::*;
use crate::pipeline::run_pipeline;
use crate::types::TaxpayerInput;

#[wasm_bindgen]
pub fn compute_json(input_json: &str) -> Result<String, JsValue> {
    let input: TaxpayerInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("InvalidInput: {}", e)))?;
    let result = run_pipeline(input);
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("SerializeError: {}", e)))
}

#[wasm_bindgen]
pub fn validate_json(input_json: &str) -> Result<String, JsValue> {
    let input: TaxpayerInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("InvalidInput: {}", e)))?;
    let errors = crate::validation::validate_input(&input);
    serde_json::to_string(&errors)
        .map_err(|e| JsValue::from_str(&format!("SerializeError: {}", e)))
}
```

### 3.3 Serde Conventions (Global)

| Rust type | JSON wire format | Notes |
|-----------|-----------------|-------|
| Struct fields | `camelCase` | `#[serde(rename_all = "camelCase")]` |
| Enum variants | `SCREAMING_SNAKE_CASE` | `#[serde(rename_all = "SCREAMING_SNAKE_CASE")]` |
| `Decimal` | `"1234567.89"` (string) | `#[serde_as(as = "DisplayFromStr")]` |
| `Option<T>` | `null` (not omitted) | `#[serde(default)]` on inputs only |
| `Vec<T>` | `[...]` JSON array | — |
| `NaiveDate` | `"YYYY-MM-DD"` | `#[serde(with = "chrono::naive::date")]` |
| Input structs | `deny_unknown_fields` | `#[serde(deny_unknown_fields)]` |
| Output structs | forward-compatible | No `deny_unknown_fields` |

### 3.4 Rust Types

All types live in `src/types.rs`.

#### Enumerations (14 total)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaxpayerType {
    PurelySelfEmployed,
    MixedIncome,
    CompensationOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaxRegimePath {
    PathA,
    PathB,
    PathC,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExpenseMethod {
    Itemized,
    Osd,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FilingMode {
    Annual,
    Quarterly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum BusinessNature {
    Professional,
    Trader,
    Both,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VatStatus {
    VatRegistered,
    NonVat,
    ExemptFromVat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaxpayerTier {
    Micro,   // < ₱3M
    Small,   // ₱3M–₱20M
    Medium,  // ₱20M–₱1B
    Large,   // ≥ ₱1B
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Quarter {
    Q1,
    Q2,
    Q3,
    Q4,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DepreciationMethod {
    StraightLine,
    DoubleDecliningBalance,
    SumOfYearsDigits,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum BirFormType {
    Form1701A,
    Form1701,
    Form1701Q,
    Form2551Q,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum BirFormVariant {
    GraduatedItemized,
    GraduatedOsd,
    EightPercent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OverpaymentDisposition {
    CarryOver,
    Refund,
    PendingElection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum InstallmentEligibility {
    Eligible,
    NotEligible,
    NotApplicable,
}
```

#### Primary Input — `TaxpayerInput`

```rust
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TaxpayerInput {
    pub tax_year: u16,                                    // 2018–2030
    pub taxpayer_type: TaxpayerType,
    pub business_nature: BusinessNature,
    pub filing_mode: FilingMode,
    pub vat_status: VatStatus,

    #[serde_as(as = "DisplayFromStr")]
    pub gross_receipts_amount: Decimal,                   // String in JSON

    pub has_compensation_income: bool,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub compensation_income: Option<Decimal>,

    pub expense_method: Option<ExpenseMethod>,            // None if 8% elected
    pub itemized_expenses: Option<ItemizedExpenseInput>,
    pub nolco_entries: Option<Vec<NolcoEntry>>,
    pub depreciation_entries: Option<Vec<DepreciationEntry>>,
    pub form_2307_entries: Option<Vec<Form2307Entry>>,
    pub quarterly_payments: Option<Vec<QuarterlyPayment>>,

    pub elected_8_percent: Option<bool>,
    pub has_prior_year_excess_credits: bool,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub prior_year_excess_credits: Option<Decimal>,

    pub filing_date: Option<String>,                      // "YYYY-MM-DD"
    pub bir_rdo_code: Option<String>,
    pub registered_address: Option<String>,
}
```

#### Sub-input Types

```rust
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ItemizedExpenseInput {
    #[serde_as(as = "DisplayFromStr")]
    pub salaries_and_wages: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub rental_expense: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub interest_expense: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub professional_fees: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub office_supplies: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub utilities: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub representation_expenses: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub transportation: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub miscellaneous: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub charitable_contributions: Decimal,          // Sec. 34(H) — limited to 10%
    #[serde_as(as = "DisplayFromStr")]
    pub sss_gsis_contributions: Decimal,            // Sec. 34(M)
}

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Form2307Entry {
    pub withholding_agent_name: String,
    pub tin: String,
    pub quarter: Quarter,
    #[serde_as(as = "DisplayFromStr")]
    pub amount_of_income_payment: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub tax_withheld: Decimal,
}

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct QuarterlyPayment {
    pub quarter: Quarter,
    #[serde_as(as = "DisplayFromStr")]
    pub amount_paid: Decimal,
    pub payment_date: Option<String>,               // "YYYY-MM-DD"
}

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DepreciationEntry {
    pub asset_description: String,
    pub depreciation_method: DepreciationMethod,
    #[serde_as(as = "DisplayFromStr")]
    pub cost: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub salvage_value: Decimal,
    pub useful_life_years: u16,
    pub year_acquired: u16,
}

#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NolcoEntry {
    pub year_incurred: u16,
    #[serde_as(as = "DisplayFromStr")]
    pub amount: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub amount_applied_previously: Decimal,
}
```

#### Primary Output — `TaxComputationResult`

```rust
#[serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxComputationResult {
    // Paths
    pub path_a: Option<PathAResult>,
    pub path_b: Option<PathBResult>,
    pub path_c: Option<PathCResult>,
    pub recommended_path: TaxRegimePath,

    // Percentage tax (if non-VAT)
    pub percentage_tax: Option<PercentageTaxResult>,

    // Form recommendation
    pub bir_form: BirFormType,
    pub bir_form_variant: BirFormVariant,
    pub form_output: FormOutputUnion,

    // CWT summary
    #[serde_as(as = "DisplayFromStr")]
    pub total_cwt_credits: Decimal,

    // Quarterly payments
    #[serde_as(as = "DisplayFromStr")]
    pub total_quarterly_paid: Decimal,

    // Balance
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub balance_due: Option<Decimal>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub overpayment: Option<Decimal>,
    pub overpayment_disposition: Option<OverpaymentDisposition>,

    // Installment
    pub installment_eligible: InstallmentEligibility,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub installment_amount: Option<Decimal>,

    // Penalties (if late filing_date)
    pub penalties: Option<PenaltyResult>,

    // Manual review flags
    pub manual_review_flags: Vec<ManualReviewFlag>,

    // Soft warnings
    pub warnings: Vec<ValidationWarning>,

    // Ineligibility notifications
    pub ineligibility_notifications: Vec<IneligibilityNotification>,

    // Metadata
    pub tax_year: u16,
    pub computed_at: String,                        // ISO 8601
}

// FormOutputUnion — adjacently tagged
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "formVariant", content = "fields", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FormOutputUnion {
    Form1701A(Form1701AOutput),
    Form1701(Form1701Output),
    Form1701Q(Form1701QOutput),
    Form2551Q(Form2551QOutput),
}
```

### 3.5 Pipeline — `src/pipeline.rs`

Pure function: `run_pipeline(input: TaxpayerInput) -> WasmResult<TaxComputationResult>`

No I/O, no side effects. Same inputs → same outputs always.

| Step | ID | Description |
|------|----|-------------|
| 1 | PL-01 | Validate inputs (hard errors) |
| 2 | PL-02 | Classify taxpayer tier |
| 3 | PL-03 | Aggregate gross income |
| 4 | PL-04 | Determine regime eligibility |
| 5 | PL-05 | Compute OSD (40% of gross) |
| 6 | PL-06 | Compute itemized deductions |
| 7 | PL-07 | Compute Path A (graduated + itemized) |
| 8 | PL-08 | Compute Path B (graduated + OSD) |
| 9 | PL-09 | Compute Path C (8% flat rate, if eligible) |
| 10 | PL-10 | Compute percentage tax (if non-VAT) |
| 11 | PL-11 | Apply NOLCO |
| 12 | PL-12 | Apply CWT credits |
| 13 | PL-13 | Apply quarterly payments |
| 14 | PL-14 | Compute balance due / overpayment |
| 15 | PL-15 | Check installment eligibility |
| 16 | PL-16 | Compute penalties (if late) |
| 17 | PL-17 | Assemble result |

**Tax rate tables:**
- 2023+: TRAIN Second Schedule (₱0–₱250K = 0%, ₱250K–₱400K = 15%, ₱400K–₱800K = 20%, ₱800K–₱2M = 25%, ₱2M–₱8M = 30%, >₱8M = 35%)
- 2018–2022: TRAIN First Schedule
- Percentage tax: 3% (pre-Jul 2020 and post-Jun 2023), 1% (Jul 2020–Jun 2023, CREATE Act RA 11534)

**Decimal precision:** Full precision throughout intermediates. Round to centavo (2 decimal places) at final output only.

### 3.6 Error Types

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    pub code: String,       // ERR_* or ASSERT_*
    pub message: String,
    pub field: Option<String>,
    pub severity: ErrorSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationWarning {
    pub code: String,       // WARN_*
    pub message: String,
    pub field: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IneligibilityNotification {
    pub code: String,       // IN-01 to IN-05
    pub message: String,
    pub path_excluded: TaxRegimePath,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManualReviewFlag {
    pub code: String,       // MRF_*
    pub message: String,
    pub suggested_action: String,
}
```

**Error codes:**
- `ERR_TAX_YEAR_OUT_OF_RANGE` through `ERR_ASSERT_BALANCE_CHECK` — 42 total codes
- `WARN_HIGH_REPRESENTATION` through `WARN_NEAR_VAT_THRESHOLD` — 9 warning codes
- `IN-01` through `IN-05` — 5 ineligibility notifications

### 3.7 WasmResult Envelope

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "lowercase")]
pub enum WasmResult<T> {
    #[serde(rename = "ok")]
    Ok { data: T },
    #[serde(rename = "error")]
    Error { errors: Vec<EngineError> },
}
```

JSON examples:
```json
// Success
{"status":"ok","data":{...TaxComputationResult...}}

// Error
{"status":"error","errors":[{"code":"ERR_GROSS_RECEIPTS_REQUIRED","message":"...","field":"grossReceiptsAmount","severity":"ERROR"}]}
```

### 3.8 Build Command

```sh
# From engine/ directory
wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg
```

Output: `pkg/taxklaro_engine.js`, `pkg/taxklaro_engine_bg.wasm`, `pkg/taxklaro_engine.d.ts`

---

## 4. Bridge Contract

### 4.1 WASM Init Patterns

| Context | Init method | When |
|---------|-------------|------|
| Browser (Vite dev/prod) | `init()` — async, streaming | Always use async in browser |
| Node.js / Vitest | `initSync()` — synchronous | Use `fs.readFileSync()` to load .wasm |

### 4.2 `src/wasm/bridge.ts`

```typescript
// src/wasm/bridge.ts

import type { TaxpayerInput } from '@/types/engine-input';
import type { TaxComputationResult } from '@/types/engine-output';
import type { WasmResult } from '@/types/common';
import { trackComputationError, trackWasmInitError } from '@/lib/monitoring';

let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      // Dynamic import — works with vite-plugin-wasm
      const { default: init } = await import('./pkg/taxklaro_engine.js');
      await init();
    } catch (e) {
      trackWasmInitError(e);
      initPromise = null;  // Allow retry on next call
      throw e;
    }
  })();
  return initPromise;
}

export async function computeTax(
  input: TaxpayerInput
): Promise<WasmResult<TaxComputationResult>> {
  await ensureInit();

  const startMs = performance.now();

  try {
    // Import directly from the WASM module (resolved after init)
    const { compute_json } = await import('./pkg/taxklaro_engine.js');
    const resultJson = compute_json(JSON.stringify(input));
    const result = JSON.parse(resultJson) as WasmResult<TaxComputationResult>;

    const durationMs = performance.now() - startMs;
    if (durationMs > 500) {
      // WASM should complete in <50ms — flag if slow
      trackWarning('Slow WASM computation', { durationMs, taxYear: input.taxYear });
    }

    return result;
  } catch (e) {
    trackComputationError(e, { taxYear: input.taxYear });
    return {
      status: 'error',
      errors: [{
        code: 'WASM_PANIC',
        message: 'Internal computation error. This has been reported.',
        field: null,
        severity: 'ERROR',
      }],
    };
  }
}

export async function validateInput(
  input: TaxpayerInput
): Promise<WasmResult<{ errors: unknown[] }>> {
  await ensureInit();
  try {
    const { validate_json } = await import('./pkg/taxklaro_engine.js');
    const resultJson = validate_json(JSON.stringify(input));
    return JSON.parse(resultJson);
  } catch (e) {
    trackComputationError(e);
    return { status: 'error', errors: [] };
  }
}
```

### 4.3 Vitest Setup — `src/test-setup.ts`

```typescript
// src/test-setup.ts
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initSync } from './wasm/pkg/taxklaro_engine.js';

// Load WASM synchronously for Node.js (Vitest) environment
const wasmPath = resolve(__dirname, './wasm/pkg/taxklaro_engine_bg.wasm');
const wasmBuffer = readFileSync(wasmPath);
initSync({ module: wasmBuffer });
```

### 4.4 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION ?? 'local'),
  },
});
```

**Required packages:** `vite-plugin-wasm`, `vite-plugin-top-level-await` — both MUST be installed and listed in order. Without them, WASM imports fail in Vite.

---

## 5. TypeScript Types

### 5.1 `src/types/common.ts`

```typescript
// Branded primitives
export type Peso = string;           // Decimal serialized as string — NEVER number
export type Rate = string;           // Percentage as string
export type TaxYear = number;        // 2018–2030
export type ISODate = string;        // "YYYY-MM-DD"
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

// All 14 enumerations (SCREAMING_SNAKE_CASE — exact match to Rust serde)
export type TaxpayerType = 'PURELY_SELF_EMPLOYED' | 'MIXED_INCOME' | 'COMPENSATION_ONLY';
export type TaxRegimePath = 'PATH_A' | 'PATH_B' | 'PATH_C';
export type ExpenseMethod = 'ITEMIZED' | 'OSD';
export type FilingMode = 'ANNUAL' | 'QUARTERLY';
export type BusinessNature = 'PROFESSIONAL' | 'TRADER' | 'BOTH';
export type VatStatus = 'VAT_REGISTERED' | 'NON_VAT' | 'EXEMPT_FROM_VAT';
export type TaxpayerTier = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';
export type DepreciationMethod = 'STRAIGHT_LINE' | 'DOUBLE_DECLINING_BALANCE' | 'SUM_OF_YEARS_DIGITS';
export type BirFormType = 'FORM_1701_A' | 'FORM_1701' | 'FORM_1701_Q' | 'FORM_2551_Q';
export type BirFormVariant = 'GRADUATED_ITEMIZED' | 'GRADUATED_OSD' | 'EIGHT_PERCENT';
export type OverpaymentDisposition = 'CARRY_OVER' | 'REFUND' | 'PENDING_ELECTION';
export type ErrorSeverity = 'ERROR' | 'WARNING' | 'INFO';
export type InstallmentEligibility = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NOT_APPLICABLE';

// As-const arrays for iteration/validation
export const TAX_REGIME_PATHS = ['PATH_A', 'PATH_B', 'PATH_C'] as const;
export const BIR_FORM_TYPES = ['FORM_1701_A', 'FORM_1701', 'FORM_1701_Q', 'FORM_2551_Q'] as const;

// WasmResult discriminated union
export type WasmResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; errors: EngineError[] };

// Error types
export interface EngineError {
  code: string;
  message: string;
  field: string | null;
  severity: ErrorSeverity;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field: string | null;
}

export interface IneligibilityNotification {
  code: string;
  message: string;
  pathExcluded: TaxRegimePath;
}

export interface ManualReviewFlag {
  code: string;
  message: string;
  suggestedAction: string;
}
```

### 5.2 `src/types/engine-input.ts`

```typescript
import type { Peso, TaxYear, ISODate, Quarter, TaxpayerType, BusinessNature, FilingMode, VatStatus, ExpenseMethod, DepreciationMethod } from './common';

export interface TaxpayerInput {
  taxYear: TaxYear;
  taxpayerType: TaxpayerType;
  businessNature: BusinessNature;
  filingMode: FilingMode;
  vatStatus: VatStatus;
  grossReceiptsAmount: Peso;         // String — NEVER number
  hasCompensationIncome: boolean;
  compensationIncome: Peso | null;
  expenseMethod: ExpenseMethod | null;
  itemizedExpenses: ItemizedExpenseInput | null;
  nolcoEntries: NolcoEntry[] | null;
  depreciationEntries: DepreciationEntry[] | null;
  form2307Entries: Form2307Entry[] | null;
  quarterlyPayments: QuarterlyPayment[] | null;
  elected8Percent: boolean | null;
  hasPriorYearExcessCredits: boolean;
  priorYearExcessCredits: Peso | null;
  filingDate: ISODate | null;
  birRdoCode: string | null;
  registeredAddress: string | null;
}

export interface ItemizedExpenseInput {
  salariesAndWages: Peso;
  rentalExpense: Peso;
  interestExpense: Peso;
  professionalFees: Peso;
  officeSupplies: Peso;
  utilities: Peso;
  representationExpenses: Peso;
  transportation: Peso;
  miscellaneous: Peso;
  charitableContributions: Peso;
  sssGsisContributions: Peso;
}

export interface Form2307Entry {
  withholdingAgentName: string;
  tin: string;
  quarter: Quarter;
  amountOfIncomePayment: Peso;
  taxWithheld: Peso;
}

export interface QuarterlyPayment {
  quarter: Quarter;
  amountPaid: Peso;
  paymentDate: ISODate | null;
}

export interface DepreciationEntry {
  assetDescription: string;
  depreciationMethod: DepreciationMethod;
  cost: Peso;
  salvageValue: Peso;
  usefulLifeYears: number;
  yearAcquired: number;
}

export interface NolcoEntry {
  yearIncurred: number;
  amount: Peso;
  amountAppliedPreviously: Peso;
}

// Factory function for safe defaults
export function createDefaultTaxpayerInput(): TaxpayerInput {
  return {
    taxYear: new Date().getFullYear(),
    taxpayerType: 'PURELY_SELF_EMPLOYED',
    businessNature: 'PROFESSIONAL',
    filingMode: 'ANNUAL',
    vatStatus: 'NON_VAT',
    grossReceiptsAmount: '0',
    hasCompensationIncome: false,
    compensationIncome: null,
    expenseMethod: null,
    itemizedExpenses: null,
    nolcoEntries: null,
    depreciationEntries: null,
    form2307Entries: null,
    quarterlyPayments: null,
    elected8Percent: null,
    hasPriorYearExcessCredits: false,
    priorYearExcessCredits: null,
    filingDate: null,
    birRdoCode: null,
    registeredAddress: null,
  };
}
```

**Critical field naming traps:**
- `form2307Entries` — digit inside field name, NOT `form_2307_entries` or `Form2307Entries`
- `elected8Percent` — digit inside, NOT `elected8percent` or `electedEightPercent`
- `birRdoCode` — acronym, NOT `birRDOCode`

### 5.3 `src/types/engine-output.ts`

```typescript
import type { Peso, TaxRegimePath, BirFormType, BirFormVariant, OverpaymentDisposition, InstallmentEligibility, ValidationWarning, IneligibilityNotification, ManualReviewFlag } from './common';

export interface TaxComputationResult {
  pathA: PathAResult | null;
  pathB: PathBResult | null;
  pathC: PathCResult | null;
  recommendedPath: TaxRegimePath;
  percentageTax: PercentageTaxResult | null;
  birForm: BirFormType;
  birFormVariant: BirFormVariant;
  formOutput: FormOutputUnion;
  totalCwtCredits: Peso;
  totalQuarterlyPaid: Peso;
  balanceDue: Peso | null;
  overpayment: Peso | null;
  overpaymentDisposition: OverpaymentDisposition | null;
  installmentEligible: InstallmentEligibility;
  installmentAmount: Peso | null;
  penalties: PenaltyResult | null;
  manualReviewFlags: ManualReviewFlag[];
  warnings: ValidationWarning[];
  ineligibilityNotifications: IneligibilityNotification[];
  taxYear: number;
  computedAt: string;
}

// FormOutputUnion — adjacently tagged
export type FormOutputUnion =
  | { formVariant: 'FORM_1701_A'; fields: Form1701AOutput }
  | { formVariant: 'FORM_1701'; fields: Form1701Output }
  | { formVariant: 'FORM_1701_Q'; fields: Form1701QOutput }
  | { formVariant: 'FORM_2551_Q'; fields: Form2551QOutput };

// Type guards
export function isForm1701A(f: FormOutputUnion): f is { formVariant: 'FORM_1701_A'; fields: Form1701AOutput } {
  return f.formVariant === 'FORM_1701_A';
}
```

### 5.4 `src/types/org.ts`

```typescript
export type OrgRole = 'admin' | 'accountant' | 'staff' | 'readonly';
export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  seatLimit: number;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
}

export const ROLE_PERMISSIONS: Record<OrgRole, { canInvite: boolean; canEdit: boolean; canDelete: boolean; canExportPdf: boolean }> = {
  admin: { canInvite: true, canEdit: true, canDelete: true, canExportPdf: true },
  accountant: { canInvite: false, canEdit: true, canDelete: false, canExportPdf: true },
  staff: { canInvite: false, canEdit: true, canDelete: false, canExportPdf: false },
  readonly: { canInvite: false, canEdit: false, canDelete: false, canExportPdf: false },
};
```

---

## 6. Zod Schemas

### 6.1 Key Rules

- All input schemas use `.strict()` — reject unknown fields
- Output schemas do NOT use `.strict()` — forward compatible
- All Decimal fields: `z.string().regex(/^\d+(\.\d+)?$/)` — NOT `z.number()`
- All optional fields: `.nullable()` — NOT `.optional()` (matches `null` not `undefined`)
- Enums: `z.enum([...])` matching SCREAMING_SNAKE_CASE strings
- Booleans: `z.boolean()` — NOT `z.coerce.boolean()`

### 6.2 File Structure

```
src/schemas/
  primitives.ts    — Peso, ISODate, TaxYear validators
  enums.ts         — All 14 enum schemas
  input.ts         — TaxpayerInputSchema + sub-input schemas
  output.ts        — TaxComputationResultSchema (no .strict())
  bridge.ts        — WasmResultSchema factory
  index.ts         — re-exports
```

### 6.3 Primitive Schemas

```typescript
// src/schemas/primitives.ts
import { z } from 'zod';

export const PesoSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid peso amount');
export const ISODateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
export const TaxYearSchema = z.number().int().min(2018).max(2030);
```

### 6.4 Enum Schemas

```typescript
// src/schemas/enums.ts
import { z } from 'zod';

export const TaxpayerTypeSchema = z.enum(['PURELY_SELF_EMPLOYED', 'MIXED_INCOME', 'COMPENSATION_ONLY']);
export const TaxRegimePathSchema = z.enum(['PATH_A', 'PATH_B', 'PATH_C']);
export const ExpenseMethodSchema = z.enum(['ITEMIZED', 'OSD']);
export const FilingModeSchema = z.enum(['ANNUAL', 'QUARTERLY']);
export const QuarterSchema = z.enum(['Q1', 'Q2', 'Q3', 'Q4']);
export const BirFormTypeSchema = z.enum(['FORM_1701_A', 'FORM_1701', 'FORM_1701_Q', 'FORM_2551_Q']);
// ... all 14 enums
```

### 6.5 Input Schema (key excerpt)

```typescript
// src/schemas/input.ts
import { z } from 'zod';
import { PesoSchema, ISODateSchema, TaxYearSchema } from './primitives';
import { TaxpayerTypeSchema, ExpenseMethodSchema, FilingModeSchema, VatStatusSchema, BusinessNatureSchema, QuarterSchema, DepreciationMethodSchema } from './enums';

export const TaxpayerInputSchema = z.object({
  taxYear: TaxYearSchema,
  taxpayerType: TaxpayerTypeSchema,
  businessNature: BusinessNatureSchema,
  filingMode: FilingModeSchema,
  vatStatus: VatStatusSchema,
  grossReceiptsAmount: PesoSchema,
  hasCompensationIncome: z.boolean(),
  compensationIncome: PesoSchema.nullable(),
  expenseMethod: ExpenseMethodSchema.nullable(),
  itemizedExpenses: ItemizedExpenseInputSchema.nullable(),
  nolcoEntries: z.array(NolcoEntrySchema).nullable(),
  depreciationEntries: z.array(DepreciationEntrySchema).nullable(),
  form2307Entries: z.array(Form2307EntrySchema).nullable(),
  quarterlyPayments: z.array(QuarterlyPaymentSchema).nullable(),
  elected8Percent: z.boolean().nullable(),
  hasPriorYearExcessCredits: z.boolean(),
  priorYearExcessCredits: PesoSchema.nullable(),
  filingDate: ISODateSchema.nullable(),
  birRdoCode: z.string().nullable(),
  registeredAddress: z.string().nullable(),
}).strict();
```

### 6.6 Per-Step Wizard Schemas

For live validation in each wizard step:

| Step | Schema | Key fields |
|------|--------|-----------|
| WS-01 | `TaxpayerProfileSchema` | `taxpayerType`, `businessNature` |
| WS-03 | `TaxYearInfoSchema` | `taxYear`, `filingMode` |
| WS-04 | `GrossReceiptsSchema` | `grossReceiptsAmount` |
| WS-07C | `DepreciationEntrySchema` | `cost`, `salvageValue`, `usefulLifeYears`, `yearAcquired` |
| WS-08 | `Form2307EntrySchema` | `tin`, `taxWithheld`, `amountOfIncomePayment` |

---

## 7. Frontend Architecture

### 7.1 Package.json Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-router": "^1.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "zod": "^3.0.0",
    "sonner": "^1.0.0",
    "@react-pdf/renderer": "^3.0.0",
    "@sentry/react": "^7.0.0",
    "lucide-react": "^0.400.0",
    "@fontsource/inter": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "vite-plugin-wasm": "^3.0.0",
    "vite-plugin-top-level-await": "^1.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.40.0",
    "typescript": "^5.0.0"
  }
}
```

**Toasts: Sonner only.** Do NOT install shadcn `toast` alongside Sonner — they conflict.

### 7.2 Wizard State

```typescript
// src/types/wizard.ts

export type WizardStepId =
  | 'WS00' | 'WS01' | 'WS02' | 'WS03' | 'WS04'
  | 'WS05' | 'WS06' | 'WS07A' | 'WS07B' | 'WS07C' | 'WS07D'
  | 'WS08' | 'WS09' | 'WS10' | 'WS11' | 'WS12' | 'WS13'
  | 'REVIEW';

export interface WizardFormData {
  // Maps to TaxpayerInput but split across wizard steps
  // Also includes UI-only fields not in TaxpayerInput
  filingMode: FilingMode;
  taxYear: TaxYear;
  taxpayerType: TaxpayerType;
  businessNature: BusinessNature;
  vatStatus: VatStatus;
  grossReceiptsAmount: string;         // String for PesoInput, converted on compute
  hasCompensationIncome: boolean;
  compensationIncome: string | null;
  expenseMethod: ExpenseMethod | null;
  elected8Percent: boolean | null;
  itemizedExpenses: Partial<ItemizedExpenseInput>;
  depreciationEntries: DepreciationEntry[];
  nolcoEntries: NolcoEntry[];
  form2307Entries: Form2307Entry[];
  quarterlyPayments: QuarterlyPayment[];
  hasPriorYearExcessCredits: boolean;
  priorYearExcessCredits: string | null;
  filingDate: string | null;
  birRdoCode: string | null;
  registeredAddress: string | null;
  // UI-only
  clientId: string | null;
  computationTitle: string;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
```

### 7.3 Step Routing Logic

```typescript
// src/components/computation/WizardPage.tsx

function computeActiveSteps(input: Partial<TaxpayerInput>): WizardStepId[] {
  const steps: WizardStepId[] = ['WS00', 'WS01', 'WS02', 'WS03', 'WS04'];

  if (input.taxpayerType === 'MIXED_INCOME') steps.push('WS05');

  const eightPctEligible =
    input.taxpayerType === 'PURELY_SELF_EMPLOYED' &&
    parseFloat(input.grossReceiptsAmount ?? '0') <= 3_000_000;

  if (!eightPctEligible) {
    steps.push('WS06');
    if (input.expenseMethod === 'ITEMIZED') {
      steps.push('WS07A', 'WS07B', 'WS07C');
      if (input.hasNolco) steps.push('WS07D');
    }
  } else {
    steps.push('WS11');
  }

  steps.push('WS08');
  if (input.filingMode === 'QUARTERLY') steps.push('WS09');
  steps.push('WS10', 'WS12', 'WS13');

  return steps;
}
```

### 7.4 Key Hooks

#### `useCompute`
```typescript
// src/hooks/useCompute.ts
export function useCompute() {
  const [result, setResult] = useState<TaxComputationResult | null>(null);
  const [errors, setErrors] = useState<EngineError[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  async function runCompute(input: TaxpayerInput) {
    setIsComputing(true);
    const wasmResult = await computeTax(input);
    if (wasmResult.status === 'ok') {
      setResult(wasmResult.data);
      setErrors([]);
    } else {
      setResult(null);
      setErrors(wasmResult.errors);
    }
    setIsComputing(false);
    return wasmResult;
  }

  return { result, errors, isComputing, runCompute };
}
```

#### `useAutoSave`
```typescript
// src/hooks/useAutoSave.ts
// 1500ms debounce. Saves to computations table on input change.
export function useAutoSave(computationId: string, input: TaxpayerInput) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');

  const debouncedSave = useDebouncedCallback(async (data: TaxpayerInput) => {
    setStatus('saving');
    const { error } = await updateComputationInput(computationId, data);
    setStatus(error ? 'error' : 'saved');
    if (!error) setTimeout(() => setStatus('idle'), 2000);
  }, 1500);

  useEffect(() => {
    debouncedSave(input);
  }, [input]);

  return { status };
}
```

#### `useOrganization`
```typescript
// src/hooks/useOrganization.ts
export function useOrganization() {
  // Fetches org membership for current user
  // Navigates to /onboarding if no membership found
  // Returns: { org, role, isLoading, canInvite, canEdit, canDelete, canExportPdf }
}
```

#### `useAuth`
```typescript
// src/hooks/useAuth.ts
// Wraps Supabase onAuthStateChange
// Calls identifyUser()/clearUser() on state change for Sentry
// Returns: { user, signIn, signUp, signOut, isLoading }
```

### 7.5 `src/lib/computations.ts`

```typescript
export async function createComputation(
  orgId: string,
  clientId: string | null,
  title: string,
  inputJson: TaxpayerInput
): Promise<{ id: string } | null>

export async function loadComputation(id: string): Promise<ComputationRow | null>

export async function updateComputationInput(
  id: string,
  inputJson: TaxpayerInput
): Promise<{ error: Error | null }>

export async function saveComputationOutput(
  id: string,
  outputJson: TaxComputationResult
): Promise<{ error: Error | null }>

export async function listComputations(orgId: string): Promise<ComputationListItem[]>

export async function updateComputationStatus(
  id: string,
  fromStatus: ComputationStatus,
  toStatus: ComputationStatus
): Promise<{ error: Error | null }>

export async function deleteComputation(id: string): Promise<{ error: Error | null }>
```

**Computation status workflow:** `draft` → `computed` → `finalized` → `archived`
- Auto-save active in all states except `finalized` and `archived`
- "Unlock" transitions `finalized` → `computed`

### 7.6 `src/lib/share.ts`

```typescript
export async function enableSharing(computationId: string): Promise<{ shareToken: string } | null>
export async function disableSharing(computationId: string): Promise<{ error: Error | null }>
export async function getSharedComputation(token: string): Promise<SharedComputationData | null>
// token is UUID string — validated by RPC which rejects non-UUID format gracefully
```

---

## 8. Design System

### 8.1 CSS Custom Properties — `src/index.css`

```css
@import "tailwindcss";
@import "@fontsource/inter/variable.css";

:root {
  /* Brand */
  --brand-600: 29 78 216;          /* #1D4ED8 — Tailwind blue-700 */
  --brand-50: 239 246 255;         /* #EFF6FF */

  /* shadcn/ui semantic */
  --background: 250 250 249;       /* Warm off-white */
  --foreground: 15 23 42;
  --primary: 29 78 216;            /* Brand blue */
  --primary-foreground: 255 255 255;
  --muted: 241 245 249;
  --muted-foreground: 100 116 139;
  --border: 226 232 240;
  --ring: 29 78 216;

  /* Tax-specific */
  --peso-savings: 21 128 61;       /* Green — savings amount */
  --peso-tax-due: 185 28 28;       /* Red — tax due */
  --regime-optimal-bg: 240 253 244; /* Light green — recommended path */
  --regime-suboptimal-bg: 255 251 235; /* Light yellow */

  /* Typography */
  font-family: "InterVariable", "Inter", system-ui, sans-serif;
}
```

### 8.2 shadcn/ui Components Used

| Component | Used in |
|-----------|---------|
| `Card`, `CardHeader`, `CardContent`, `CardTitle` | All panels, computation cards, auth pages |
| `Button` | All CTAs, wizard nav, action bar |
| `Input`, `Label`, `Textarea` | All forms |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | Dropdowns |
| `Switch` | Share toggle |
| `Badge` | Status indicators (draft/computed/finalized/archived) |
| `Alert`, `AlertDescription` | Error states, warnings banner |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Computation detail page tabs |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` | Delete confirmation, modals |
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | Share panel (slide-in from right) |
| `Skeleton` | Loading states |
| `Progress` | Wizard progress bar |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | PathDetailAccordion |
| `Separator` | Section dividers |
| `Tooltip`, `TooltipContent`, `TooltipTrigger` | Help text on field labels |

### 8.3 Lucide Icons

| Icon | Used for |
|------|---------|
| `Zap` | Compute / compute button |
| `RefreshCw` | Re-compute, rotate share link |
| `Lock` | Finalize |
| `LockOpen` | Unlock |
| `Download` | Export PDF |
| `Share2` | Share button |
| `Copy` | Copy share URL |
| `Archive` | Archive computation |
| `Trash2` | Delete |
| `Send` | Add note |
| `UserPlus` | Invite member |
| `UserMinus` | Remove member |
| `LogOut` | Sign out |
| `FileText` | Computations empty state |
| `Users` | Clients empty state / team |
| `Calendar` | Deadlines |
| `Settings` | Settings nav item |
| `AlertCircle` | Error states |
| `CheckCircle2` | Success states |
| `ChevronRight` | Sidebar active indicator |
| `MoreHorizontal` | Dropdown trigger in action bar |

### 8.4 Toast Catalog (Sonner)

Setup in `main.tsx`:
```typescript
import { Toaster } from 'sonner';
// In render:
<Toaster richColors position="bottom-right" />
```

Key toasts (41 total):

| Action | Variant | Message |
|--------|---------|---------|
| Compute success | success | "Computation complete. See results below." |
| Save failed | error | "Failed to save. Check your connection." |
| Sharing enabled | success | "Sharing enabled. Link is ready." |
| Share link copied | info | "Link copied to clipboard." |
| PDF downloaded | success | "PDF downloaded." |
| PDF preparing | loading → success | "Preparing PDF..." → "PDF downloaded." |
| Finalized | success | "Computation finalized." |
| Invitation sent | success | "Invitation sent to {email}." |
| Member removed | success | "Team member removed." |
| Client saved | success | "Client added successfully." |
| Settings saved | success | "Settings saved." |
| Logo uploaded | success | "Logo uploaded." |
| Share link rotated | success | "Share link rotated." |

**Loading + update pattern for PDF:**
```typescript
const toastId = toast.loading('Preparing PDF...');
// ... after download
toast.success('PDF downloaded.', { id: toastId });
// ... on error
toast.error('Failed to generate PDF.', { id: toastId });
```

---

## 9. Platform Layer — Auth

### 9.1 Environment Variables

```
# .env.local.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
VITE_SENTRY_DSN=          # Leave empty in local dev
```

All four are `VITE_*` — baked into JS bundle at build time. Not runtime secrets.

### 9.2 `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Guard: true only if both vars are present and non-empty
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null!;
// Callers must check supabaseConfigured before using supabase
```

### 9.3 `src/main.tsx`

```typescript
import * as Sentry from '@sentry/react';  // FIRST import

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 0.0,
  release: import.meta.env.VITE_APP_VERSION,
  beforeSend(event) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return null;
    return event;
  },
  ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured'],
});

import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { router } from './router';
import { supabase, supabaseConfigured } from './lib/supabase';
import { SetupPage } from './components/pages/SetupPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { identifyUser, clearUser } from './lib/monitoring';

function RouterWithAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) identifyUser(u.id, u.email ?? '');
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) identifyUser(u.id, u.email ?? '');
      else clearUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;  // Brief flicker prevention

  return (
    <RouterProvider router={router} context={{ auth: { user } }} />
  );
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <ErrorBoundary>
      {supabaseConfigured ? (
        <>
          <RouterWithAuth />
          <Toaster richColors position="bottom-right" />
        </>
      ) : (
        <SetupPage />
      )}
    </ErrorBoundary>
  </StrictMode>
);
```

### 9.4 Auth Redirect URLs (Supabase Dashboard)

Must be set in Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://taxklaro.ph`
- Redirect URLs:
  - `https://taxklaro.ph/auth/callback`
  - `https://taxklaro.ph/auth/reset-confirm`
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5173/auth/reset-confirm`

### 9.5 Auth Critical Traps

1. `getSession()` runs BEFORE `onAuthStateChange` fires on page load — get initial session from `getSession()`, not just the subscription.
2. PKCE code is in `window.location.search` (`?code=`), NOT in hash.
3. `/auth/reset-confirm` reads `#access_token=` from URL HASH (Supabase recovery flow uses hash, not query params).
4. Email confirmation must be enabled in local dev (Supabase local: auto-confirms by default in `config.toml`).
5. Never call `supabase.auth.signOut()` without also clearing Sentry user identity.
6. `beforeLoad` auth guard cannot check org membership without a DB call — org redirect happens in-component, not in `beforeLoad`.

---

## 10. Platform Layer — Database Migrations

### 10.1 Migration Files

```
supabase/migrations/
  001_initial_schema.sql    — enums, tables, triggers
  002_rls_policies.sql      — user_org_ids() helper + 32 RLS policies
  003_rpc_functions.sql     — 6 RPC functions with GRANTs
  004_storage.sql           — firm-logos bucket
```

All migrations are idempotent (use `IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`).

### 10.2 `001_initial_schema.sql`

```sql
-- ENUMS (idempotent)
DO $$ BEGIN CREATE TYPE org_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE org_role AS ENUM ('admin', 'accountant', 'staff', 'readonly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE computation_status AS ENUM ('draft', 'computed', 'finalized', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE client_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        org_plan NOT NULL DEFAULT 'free',
  seat_limit  INT NOT NULL DEFAULT 3,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS organization_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'staff',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ORGANIZATION INVITATIONS
CREATE TABLE IF NOT EXISTS organization_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        org_role NOT NULL DEFAULT 'staff',
  status      invitation_status NOT NULL DEFAULT 'pending',
  token       UUID NOT NULL DEFAULT gen_random_uuid(),  -- UUID, not TEXT
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  firm_name       TEXT,
  bir_rdo_code    TEXT,
  tin             TEXT,
  ptr_number      TEXT,
  roll_number     TEXT,
  firm_address    TEXT,
  logo_url        TEXT,
  pdf_accent_color TEXT DEFAULT '#1D4ED8',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  tin         TEXT,
  notes       TEXT,
  status      client_status NOT NULL DEFAULT 'active',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPUTATIONS
CREATE TABLE IF NOT EXISTS computations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  tax_year        INT NOT NULL,
  status          computation_status NOT NULL DEFAULT 'draft',
  input_json      JSONB,
  output_json     JSONB,
  regime_selected TEXT,                    -- 'PATH_A', 'PATH_B', 'PATH_C'
  share_token     UUID NOT NULL DEFAULT gen_random_uuid(),  -- UUID NOT TEXT
  share_enabled   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPUTATION NOTES
CREATE TABLE IF NOT EXISTS computation_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id  UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPUTATION DEADLINES
CREATE TABLE IF NOT EXISTS computation_deadlines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id  UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  due_date        DATE NOT NULL,
  completed_date  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_computations_org_id ON computations(org_id);
CREATE INDEX IF NOT EXISTS idx_computations_share_token ON computations(share_token);
CREATE INDEX IF NOT EXISTS idx_computations_status ON computations(status);
CREATE INDEX IF NOT EXISTS idx_computations_tax_year ON computations(tax_year);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON computation_deadlines(due_date);

-- TRIGGERS: updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_computations_updated_at
  BEFORE UPDATE ON computations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ENABLE RLS (must be explicit)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE computations ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_deadlines ENABLE ROW LEVEL SECURITY;
```

### 10.3 `002_rls_policies.sql`

```sql
-- Helper function: get org IDs for the current user
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public;  -- Required on SECURITY DEFINER

GRANT EXECUTE ON FUNCTION user_org_ids() TO authenticated;

-- organizations: members can view, admins can update
CREATE POLICY "org_select" ON organizations
  FOR SELECT TO authenticated
  USING (id = ANY(user_org_ids()));

CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE TO authenticated
  USING (id = ANY(user_org_ids()))
  WITH CHECK (id = ANY(user_org_ids()));

-- organization_members: members can view own org members
CREATE POLICY "member_select" ON organization_members
  FOR SELECT TO authenticated
  USING (org_id = ANY(user_org_ids()));

-- computations: org members can select; only non-readonly can insert/update
CREATE POLICY "computation_select" ON computations
  FOR SELECT TO authenticated
  USING (org_id = ANY(user_org_ids()));

CREATE POLICY "computation_insert" ON computations
  FOR INSERT TO authenticated
  WITH CHECK (org_id = ANY(user_org_ids()));

CREATE POLICY "computation_update" ON computations
  FOR UPDATE TO authenticated
  USING (org_id = ANY(user_org_ids()))
  WITH CHECK (org_id = ANY(user_org_ids()));

CREATE POLICY "computation_delete" ON computations
  FOR DELETE TO authenticated
  USING (org_id = ANY(user_org_ids()));

-- user_profiles: users can only see and edit their own profile
CREATE POLICY "profile_select" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profile_insert" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profile_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- clients: org members can CRUD
CREATE POLICY "client_select" ON clients FOR SELECT TO authenticated USING (org_id = ANY(user_org_ids()));
CREATE POLICY "client_insert" ON clients FOR INSERT TO authenticated WITH CHECK (org_id = ANY(user_org_ids()));
CREATE POLICY "client_update" ON clients FOR UPDATE TO authenticated USING (org_id = ANY(user_org_ids()));
CREATE POLICY "client_delete" ON clients FOR DELETE TO authenticated USING (org_id = ANY(user_org_ids()));

-- computation_notes: org members can view; authors can insert
CREATE POLICY "notes_select" ON computation_notes FOR SELECT TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids())));

CREATE POLICY "notes_insert" ON computation_notes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids()))
  );

-- computation_deadlines: follow computation access
CREATE POLICY "deadlines_select" ON computation_deadlines FOR SELECT TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids())));

CREATE POLICY "deadlines_update" ON computation_deadlines FOR UPDATE TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids())));
```

### 10.4 `003_rpc_functions.sql`

```sql
-- create_organization: creates org + makes caller the admin member
CREATE OR REPLACE FUNCTION create_organization(p_name TEXT, p_slug TEXT)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'admin');

  -- Create user_profile if it doesn't exist
  INSERT INTO user_profiles (id, firm_name) VALUES (auth.uid(), p_name)
  ON CONFLICT (id) DO UPDATE SET firm_name = EXCLUDED.firm_name;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION create_organization(TEXT, TEXT) TO authenticated;

-- invite_member: admin/accountant creates a pending invitation
CREATE OR REPLACE FUNCTION invite_member(p_email TEXT, p_role org_role, p_org_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invitation_id UUID;
BEGIN
  -- Verify caller is admin or accountant of this org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role IN ('admin', 'accountant')
  ) THEN
    RAISE EXCEPTION 'Not authorized to invite members';
  END IF;

  INSERT INTO organization_invitations (org_id, email, role, invited_by)
  VALUES (p_org_id, p_email, p_role, auth.uid())
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION invite_member(TEXT, org_role, UUID) TO authenticated;

-- accept_invitation: caller accepts invite by token (UUID)
CREATE OR REPLACE FUNCTION accept_invitation(p_token UUID)
RETURNS VOID AS $$
DECLARE
  v_invite organization_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM organization_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_invite.org_id, auth.uid(), v_invite.role)
  ON CONFLICT (org_id, user_id) DO NOTHING;

  UPDATE organization_invitations SET status = 'accepted' WHERE id = v_invite.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION accept_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(UUID) TO anon;  -- Allow pre-auth invitation acceptance flow

-- get_shared_computation: public RPC — no auth required
-- p_token is UUID (NOT TEXT — must match share_token column type)
CREATE OR REPLACE FUNCTION get_shared_computation(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'taxYear', c.tax_year,
    'outputJson', c.output_json,
    'shareEnabled', c.share_enabled,
    'orgName', o.name
  ) INTO v_result
  FROM computations c
  JOIN organizations o ON o.id = c.org_id
  WHERE c.share_token = p_token
    AND c.share_enabled = true;

  RETURN v_result;  -- NULL if not found or sharing disabled
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION get_shared_computation(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_computation(UUID) TO authenticated;

-- get_invitation_by_token: for InviteAcceptPage
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', i.id,
    'orgName', o.name,
    'email', i.email,
    'role', i.role,
    'status', i.status,
    'expiresAt', i.expires_at
  ) INTO v_result
  FROM organization_invitations i
  JOIN organizations o ON o.id = i.org_id
  WHERE i.token = p_token;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO authenticated;
```

### 10.5 `004_storage.sql`

```sql
-- firm-logos bucket for PDF branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('firm-logos', 'firm-logos', false)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users can upload to their own folder
CREATE POLICY "firm_logo_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'firm-logos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "firm_logo_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'firm-logos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "firm_logo_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'firm-logos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
```

**Note:** Firm logos are private — accessed via signed URLs (`supabase.storage.from('firm-logos').createSignedUrl(path, 3600)`). This URL is used in PDF generation.

### 10.6 Migration Critical Traps

1. `share_token` is `UUID` (not `TEXT`) — `get_shared_computation(p_token UUID)` must match.
2. All SECURITY DEFINER functions need `SET search_path = public` — prevents search_path injection.
3. `get_shared_computation` and `accept_invitation` need `GRANT EXECUTE TO anon` — public access.
4. All 8 tables need explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — RLS is off by default.
5. `user_org_ids()` must be `STABLE` (not `VOLATILE`) for RLS policy performance.
6. `Cargo.lock` must be committed; `Cargo.toml` must be pinned to avoid crate version drift.

---

## 11. Platform Layer — Routes

### 11.1 Router Setup

**`src/router.ts`** — registers all 18 routes. Every route file must be imported AND added to the route tree. Missing registration = silent white page.

**`RouterContext`:**
```typescript
export interface RouterContext {
  auth: { user: User | null };
}
```

### 11.2 Route Table

| # | Path | File | Auth | Layout |
|---|------|------|------|--------|
| 1 | `/` | `routes/index.tsx` | Conditional | AppLayout (auth) / bare |
| 2 | `/auth` | `routes/auth.tsx` | Public | Bare |
| 3 | `/auth/callback` | `routes/auth/callback.tsx` | Public | Bare |
| 4 | `/auth/reset` | `routes/auth/reset.tsx` | Public | Bare |
| 5 | `/auth/reset-confirm` | `routes/auth/reset-confirm.tsx` | Public | Bare |
| 6 | `/onboarding` | `routes/onboarding.tsx` | Auth only | Bare |
| 7 | `/invite/$token` | `routes/invite/$token.tsx` | Public | Bare |
| 8 | `/computations` | `routes/computations/index.tsx` | Auth + beforeLoad | AppLayout |
| 9 | `/computations/new` | `routes/computations/new.tsx` | Auth + beforeLoad | AppLayout |
| 10 | `/computations/$compId` | `routes/computations/$compId.tsx` | Auth + beforeLoad | AppLayout |
| 11 | `/computations/$compId/quarterly` | `routes/computations/$compId.quarterly.tsx` | Auth + beforeLoad | AppLayout |
| 12 | `/clients` | `routes/clients/index.tsx` | Auth + beforeLoad | AppLayout |
| 13 | `/clients/new` | `routes/clients/new.tsx` | Auth + beforeLoad | AppLayout |
| 14 | `/clients/$clientId` | `routes/clients/$clientId.tsx` | Auth + beforeLoad | AppLayout |
| 15 | `/deadlines` | `routes/deadlines.tsx` | Auth + beforeLoad | AppLayout |
| 16 | `/settings` | `routes/settings/index.tsx` | Auth + beforeLoad | AppLayout |
| 17 | `/settings/team` | `routes/settings/team.tsx` | Auth + beforeLoad | AppLayout |
| 18 | `/share/$token` | `routes/share/$token.tsx` | Public | Bare |

### 11.3 `beforeLoad` Guard Pattern

```typescript
// Applied to all 11 authenticated routes
beforeLoad: ({ context, location }) => {
  if (!context.auth.user) {
    throw redirect({
      to: '/auth',
      search: { redirect: location.href, mode: 'signin' },
    });
  }
},
```

### 11.4 Route Order in Tree

`/computations/new` must be registered before `/computations/$compId` in `routeTree` — literal "new" wins over dynamic `$compId`.

### 11.5 Public Routes — `publicRootRoute`

Public routes (auth, share, invite) must be children of `publicRootRoute` (not `rootRoute`) to bypass AppLayout. See `__root.tsx` pattern in Analysis Log.

### 11.6 Critical Route Traps

1. `/auth/callback` extracts PKCE code from `window.location.search` (`?code=`), NOT from hash.
2. `/auth/reset-confirm` reads `#access_token=` from URL HASH, NOT query params.
3. `/share/$token` param `$token` is a URL string; validate as UUID format before passing to RPC.
4. Org membership check happens in-component (via `useOrganization`), not in `beforeLoad` — prevents redirect loops to `/onboarding`.
5. `/computations/$compId.quarterly.tsx` uses a dot (`.`) to make it a sibling, not a nested child.

---

## 12. Platform Layer — Navigation

### 12.1 AppLayout — `src/components/layout/AppLayout.tsx`

- Desktop: fixed sidebar (256px width) + main content area
- Mobile: hamburger icon → `Sheet` (drawer) that slides in from left
- Contains: `SidebarContent` (always), `<Outlet />` for page content

### 12.2 SidebarContent — Navigation Items

```typescript
const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Computations', to: '/computations', icon: Calculator },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Deadlines', to: '/deadlines', icon: Calendar },
  { label: 'Settings', to: '/settings', icon: Settings },
];
```

Bottom of sidebar: user email display + Sign Out button.

Active state: match `pathname === item.to || pathname.startsWith(item.to + '/')` — highlight with `bg-primary/10 text-primary` class.

---

## 13. Platform Layer — Org Model

### 13.1 Plans and Seat Limits

| Plan | Seat Limit | PDF Export | Sharing |
|------|-----------|------------|---------|
| free | 3 | No | No |
| pro | 10 | Yes | Yes |
| enterprise | Unlimited | Yes | Yes |

### 13.2 `useOrganization` Hook

```typescript
// src/hooks/useOrganization.ts
export function useOrganization() {
  // 1. Fetches organization_members row for auth.uid()
  // 2. If no membership → navigate to /onboarding
  // 3. Fetches organizations row for org_id
  // Returns:
  return {
    org: Organization | null,
    role: OrgRole | null,
    orgId: string | null,
    isLoading: boolean,
    canInvite: boolean,
    canEdit: boolean,
    canDelete: boolean,
    canExportPdf: boolean,
    canShare: boolean,
  };
}
```

`canExportPdf` and `canShare` are gated by `org.plan !== 'free'`.

### 13.3 Auto-assign Overpayment Disposition

In Rust engine: if `overpayment <= 50_000` → `CARRY_OVER`; else → `PENDING_ELECTION`.

---

## 14. Component Wiring Map

### 14.1 Directory Structure

```
src/components/
  layout/
    AppLayout.tsx
    SidebarContent.tsx
  TaxKlaroLogo.tsx
  pages/
    LandingPage.tsx
    DashboardPage.tsx
    SetupPage.tsx
  computation/
    ComputationCard.tsx
    ComputationCardSkeleton.tsx
    ComputationPageHeader.tsx
    ActionsBar.tsx
    WizardPage.tsx
    WizardForm.tsx
    ResultsView.tsx
    AutoSaveIndicator.tsx
    ShareToggle.tsx
    DeleteComputationDialog.tsx
    NotesList.tsx
    AddNoteForm.tsx
    DeadlinesList.tsx
    QuarterlyBreakdownView.tsx
  wizard/
    steps/
      WizardStep00.tsx   — mode selection
      WizardStep01.tsx   — taxpayer profile
      WizardStep02.tsx   — business type
      WizardStep03.tsx   — tax year / filing period
      WizardStep04.tsx   — gross receipts
      WizardStep05.tsx   — compensation income (mixed only)
      WizardStep06.tsx   — expense method
      WizardStep07A.tsx  — itemized expenses general
      WizardStep07B.tsx  — itemized expenses financial
      WizardStep07C.tsx  — itemized expenses depreciation
      WizardStep07D.tsx  — itemized expenses NOLCO
      WizardStep08.tsx   — CWT Form 2307
      WizardStep09.tsx   — prior quarterly payments
      WizardStep10.tsx   — registration / VAT
      WizardStep11.tsx   — regime election (8% eligible only)
      WizardStep12.tsx   — filing details
      WizardStep13.tsx   — prior year credits
    WizardProgressBar.tsx
    WizardNavControls.tsx
  results/
    WarningsBanner.tsx
    RegimeComparisonTable.tsx
    RecommendationBanner.tsx
    TaxBreakdownPanel.tsx
    BalancePayableSection.tsx
    InstallmentSection.tsx
    PercentageTaxSummary.tsx
    BirFormRecommendation.tsx
    PenaltySummary.tsx
    ManualReviewFlags.tsx
    PathDetailAccordion.tsx
  clients/
    ClientsTable.tsx
    ClientRowSkeleton.tsx
    ClientInfoCard.tsx
  deadlines/
    DeadlineCard.tsx
  settings/
    PersonalInfoSection.tsx
    FirmBrandingSection.tsx
    BirInfoSection.tsx
    DangerZoneSection.tsx
    MembersTable.tsx
    PendingInvitationsTable.tsx
    InviteMemberForm.tsx
  shared-computation/
    SharedComputationView.tsx
    SharedComputationNotFound.tsx
  shared/
    EmptyState.tsx
    PageHeader.tsx
    FilterBar.tsx
    PesoInput.tsx
    MoneyDisplay.tsx
  pdf/
    TaxComputationDocument.tsx   — @react-pdf/renderer, lazy-loaded
  onboarding/
    OnboardingForm.tsx
  ErrorBoundary.tsx
```

**Total: 90 component files + 18 route files = 108 source files in frontend.**

### 14.2 Orphan Prevention Rules

1. Every `Page` component must have a route in `router.ts`
2. All 17 wizard step files must be statically imported in `WizardPage.tsx`
3. All 11 results sub-components must be statically imported in `ResultsView.tsx`
4. `TaxComputationDocument` is lazy-loaded — orphan scan will miss it. Add static comment import in `ActionsBar.tsx`: `// import('@/components/pdf/TaxComputationDocument')` as a marker.
5. `EmptyState` is shared — do NOT create per-page variants

### 14.3 Action Trigger Map

| Action | Button text | Icon | Parent | Handler |
|--------|------------|------|--------|---------|
| Run computation | "Compute" | Zap | ActionsBar | `handleCompute()` → `runCompute()` → `saveComputationOutput()` |
| Re-compute | "Re-compute" | RefreshCw | ActionsBar | Same as Compute |
| Finalize | "Finalize" | Lock | ActionsBar | `updateComputationStatus(id, 'computed', 'finalized')` |
| Unlock | "Unlock" | LockOpen | ActionsBar | `updateComputationStatus(id, 'finalized', 'computed')` |
| Export PDF | "Export PDF" | Download | ActionsBar | `import('@/components/pdf/TaxComputationDocument')` → render + download |
| Open share panel | "Share" | Share2 | ActionsBar | `setSharePanelOpen(true)` → Sheet |
| Toggle share on | Switch ON | — | ShareToggle (in Sheet) | `setShareEnabled(id, true)` |
| Toggle share off | Switch OFF | — | ShareToggle (in Sheet) | `setShareEnabled(id, false)` |
| Copy share URL | "Copy" | Copy | ShareToggle | `navigator.clipboard.writeText(url)` |
| Rotate share link | "Rotate link" | RefreshCw | ShareToggle | `rotateShareToken(id)` |
| Archive | "Archive" in dropdown | Archive | ActionsBar `MoreHorizontal` | Confirm → `updateComputationStatus(id, status, 'archived')` |
| Delete | "Delete" in dropdown | Trash2 | ActionsBar + ComputationCard | `DeleteComputationDialog` → `deleteComputation(id)` |
| Add note | "Add Note" | Send | AddNoteForm | `addComputationNote(id, userId, content)` |
| Send invitation | "Send Invitation" | UserPlus | InviteMemberForm | `invite_member(email, role, orgId)` RPC |
| Remove member | "Remove" | UserMinus | MembersTable | Confirm → Supabase DELETE |
| Revoke invitation | "Revoke" | X | PendingInvitationsTable | `UPDATE status = 'revoked'` |
| Upload logo | "Upload Logo" | Upload | FirmBrandingSection | `supabase.storage.upload()` → signed URL |
| Save settings | "Save Changes" | Save | Settings sections | Supabase UPDATE |
| Accept invitation | "Accept Invitation" | Check | InviteAcceptPage | `accept_invitation(token::UUID)` RPC |
| Create org | "Create Firm" | — | OnboardingForm | `create_organization(name, slug)` RPC |
| Sign out | "Sign Out" | LogOut | SidebarContent | `supabase.auth.signOut()` → clearUser() |

### 14.4 Component Visibility Rules

| Component | Shown when |
|-----------|-----------|
| `WizardStep05` | `taxpayerType === 'MIXED_INCOME'` |
| `WizardStep06` | `!eightPercentEligible` |
| `WizardStep07A/B/C` | `expenseMethod === 'ITEMIZED'` |
| `WizardStep07D` | `expenseMethod === 'ITEMIZED' && hasNolco` |
| `WizardStep09` | `filingMode === 'QUARTERLY'` |
| `WizardStep11` | `eightPercentEligible === true` |
| `WarningsBanner` | `result.warnings.length > 0` |
| `InstallmentSection` | `installmentEligible === 'ELIGIBLE'` |
| `PercentageTaxSummary` | `percentageTax !== null` |
| `PenaltySummary` | `penalties !== null` |
| `ManualReviewFlags` | `manualReviewFlags.length > 0` |
| `ShareToggle` | Inside Sheet, opened by "Share" button in ActionsBar |
| `DangerZoneSection` | `userRole === 'admin'` |

### 14.5 `ResultsView` ReadOnly Contract

- `ComputationDetailPage` (Results tab): `readOnly={false}` — full actions visible
- `SharedComputationView` (`/share/$token`): `readOnly={true}` — ActionsBar hidden entirely

### 14.6 `WizardForm` vs `WizardPage`

- `WizardPage`: Paginated (one step at a time), used for creating new computations
- `WizardForm`: Flat (all steps stacked), used in "Input" tab of `ComputationDetailPage`
- Both use the same step sub-components but are different components

---

## 15. Testing

### 15.1 Vitest — Unit Tests

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Tests that require WASM: import functions from `bridge.ts` — the `test-setup.ts` initializes WASM synchronously.

### 15.2 E2E — Playwright

**File:** `playwright.config.ts` (see Section 16 CI/CD for full config)

E2E tests in `frontend/e2e/`:

| File | Tests |
|------|-------|
| `auth.spec.ts` | Sign up, sign in, sign out, password reset, PKCE callback |
| `computation.spec.ts` | Create, wizard, compute, finalize, unlock, delete, auto-save |
| `sharing.spec.ts` | Enable sharing, copy URL, disable sharing, public access |
| `client-management.spec.ts` | Add client, view, new computation pre-filled |
| `smoke.prod.spec.ts` | App loads, auth page renders, no JS errors |

**E2E test user:** `smoketest@taxklaro.ph` — must be pre-created in Supabase Auth with email confirmed.

### 15.3 Production Build Smoke Test

Before any deploy, run locally:
```sh
npm run build
npx serve dist -s -l 4173
# Then verify:
# - App loads at http://localhost:4173
# - Auth page shows at /auth
# - /computations redirects to /auth (not 404)
# - Check browser console for WASM loading errors
# - dist/assets/*.wasm exists and > 100KB
# - dist/assets/*.css exists and > 20KB
```

---

## 16. Deployment

### 16.1 Dockerfile (Full — includes WASM build)

```dockerfile
# syntax=docker/dockerfile:1

# ---- Build WASM Engine ----
FROM node:20-alpine AS wasm-build

RUN apk add --no-cache curl build-base && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && \
    . $HOME/.cargo/env && \
    rustup target add wasm32-unknown-unknown && \
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app

COPY engine/ ./engine/
RUN . $HOME/.cargo/env && \
    wasm-pack build engine --target web --out-dir frontend/src/wasm/pkg

# ---- Build Frontend ----
FROM node:20-alpine AS frontend-build

WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL
ARG VITE_SENTRY_DSN
ARG VITE_APP_VERSION

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_APP_VERSION=$VITE_APP_VERSION

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
COPY --from=wasm-build /app/frontend/src/wasm/pkg ./src/wasm/pkg

RUN npm run build

# ---- Serve Stage ----
FROM nginx:alpine

COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
```

### 16.2 `nginx.conf`

```nginx
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    location ~* \.(js|css|wasm|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    types {
        application/wasm wasm;    # CRITICAL — streaming WASM compilation
    }

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/wasm;
    gzip_min_length 1024;
}
```

### 16.3 `fly.toml`

```toml
app = "taxklaro"
primary_region = "sin"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

  [http_service.checks]
    [http_service.checks.alive]
      interval = "30s"
      timeout = "5s"
      grace_period = "10s"
      method = "GET"
      path = "/"
      protocol = "http"

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

### 16.4 GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_APP_URL` | `https://taxklaro.ph` |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) |
| `FLY_API_TOKEN` | `fly tokens create deploy -x 999999h` |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token |
| `SUPABASE_DB_PASSWORD` | Supabase DB password |
| `SUPABASE_PROJECT_ID` | Supabase project ref |
| `E2E_TEST_EMAIL` | E2E test user email |
| `E2E_TEST_PASSWORD` | E2E test user password |

### 16.5 CI Workflow — `.github/workflows/ci.yml`

Runs on PRs to `main`. Does NOT deploy.

Jobs:
1. **Type Check + Lint**: `tsc --noEmit`, `eslint src --max-warnings 0`
2. **Build WASM**: `wasm-pack build engine --target web`
3. **Unit Tests**: `npm run test` (Vitest)
4. **Production Build**: `npm run build` with placeholder VITE_* vars
5. **Verify Outputs**: Check `.wasm > 100KB`, `.css > 20KB`

Rust caching:
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      engine/target
    key: rust-${{ runner.os }}-${{ hashFiles('engine/Cargo.lock') }}
```

### 16.6 Deploy Workflow — `.github/workflows/deploy.yml`

Runs on push to `main`. Four jobs, all must pass to deploy:

1. **verify** — Type check + lint + unit test + production build + output verification
2. **migrations** — Local Supabase start + `supabase db reset` + verify RPCs + verify UUID param type + verify anon GRANTs
3. **e2e** — Download dist artifact + `npx serve dist -s` + Playwright tests
4. **deploy** — `flyctl deploy --remote-only --build-arg VITE_* ...` + health check

`concurrency: cancel-in-progress: false` — do NOT cancel in-progress deploys.

`wasm-pack` installation: use installer script (fast binary download), NOT `cargo install wasm-pack` (slow source compile).

### 16.7 First Production Deploy Checklist

- [ ] Supabase project created (Singapore region)
- [ ] All 4 migration files applied: `supabase db push`
- [ ] Auth redirect URLs configured in Supabase dashboard
- [ ] `fly secrets set` with all VITE_* vars
- [ ] `fly launch --name taxklaro --region sin --no-deploy`
- [ ] `fly deploy` succeeds
- [ ] `fly open` shows app loading
- [ ] `fly certs add taxklaro.ph`
- [ ] Cloudflare DNS A/AAAA records pointing to Fly.io IPs
- [ ] Auth sign-up flow works end-to-end
- [ ] WASM compute works in production

---

## 17. Monitoring and Alerts

### 17.1 Sentry Setup

```typescript
// src/main.tsx — FIRST IMPORT before React
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 0.0,
  release: import.meta.env.VITE_APP_VERSION,
  beforeSend(event) {
    if (window.location.hostname === 'localhost') return null;
    return event;
  },
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

### 17.2 Error Handling Categories

| Error type | Sentry | User sees |
|------------|--------|-----------|
| `ValidationError` (ERR_* codes) | NOT sent | Field error / toast |
| `ComputeError` (ASSERT_* codes) | Sent as bug | Generic error toast |
| `WasmInitError` (WASM failed to load) | Sent as fatal | Error boundary |
| React render error | Sent via ErrorBoundary | ErrorBoundary fallback UI |

### 17.3 `src/lib/monitoring.ts`

```typescript
import * as Sentry from '@sentry/react';

export function trackValidationError(code: string, fieldName?: string) { /* no-op */ }
export function trackComputationError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, { tags: { category: 'wasm_computation' }, extra: context });
}
export function trackWasmInitError(error: unknown) {
  Sentry.captureException(error, { tags: { category: 'wasm_init' }, level: 'fatal' });
}
export function trackWarning(message: string, extra?: Record<string, unknown>) {
  Sentry.captureMessage(message, { level: 'warning', extra });
}
export function identifyUser(userId: string, email: string) {
  Sentry.setUser({ id: userId, email });
}
export function clearUser() { Sentry.setUser(null); }
```

### 17.4 External Uptime

BetterUptime: HTTP(S) probe on `https://taxklaro.ph` every 3 minutes. Set timeout to 10s (cold start after idle). Alert immediately on first failure.

### 17.5 Monitoring Critical Traps

1. Sentry.init() before ANY React code — render errors on first mount are missed otherwise
2. Do NOT send validation errors (ERR_*) to Sentry — noise
3. VITE_SENTRY_DSN is a build arg — changes require redeploy
4. identifyUser() in `onAuthStateChange` callback, not just sign-in — session restores must identify
5. BetterUptime timeout must be 10s+ — cold start on Fly.io takes 2-3s

---

## 18. Cross-Layer Consistency Checklist

For each field, verify the chain: **Rust type → Rust serde → JSON wire → TypeScript interface → Zod schema → Supabase column → React component**.

### 18.1 Critical Field Alignments

| Rust field | Serde → JSON | TypeScript field | Zod | Notes |
|-----------|-------------|-----------------|-----|-------|
| `gross_receipts_amount: Decimal` | `"grossReceiptsAmount": "1234.56"` | `grossReceiptsAmount: Peso` (string) | `PesoSchema` (string regex) | NEVER a number |
| `taxpayer_type: TaxpayerType` | `"taxpayerType": "PURELY_SELF_EMPLOYED"` | `taxpayerType: TaxpayerType` | `TaxpayerTypeSchema` | SCREAMING_SNAKE_CASE |
| `form_2307_entries: Vec<Form2307Entry>` | `"form2307Entries": [...]` | `form2307Entries: Form2307Entry[]` | `z.array(Form2307EntrySchema)` | Digit in name |
| `elected_8_percent: Option<bool>` | `"elected8Percent": true\|false\|null` | `elected8Percent: boolean \| null` | `z.boolean().nullable()` | Digit in name |
| `share_token: UUID` | — (Supabase column, not WASM) | — | — | UUID NOT TEXT |
| `bir_form: BirFormType` | `"birForm": "FORM_1701_A"` | `birForm: BirFormType` | `BirFormTypeSchema` | Underscore+digit |
| `form_output: FormOutputUnion` | `{"formVariant":"FORM_1701_A","fields":{...}}` | `formOutput: FormOutputUnion` | adjacently tagged | Tag is `formVariant`, content is `fields` |

### 18.2 Enum Value Alignments (must match exactly)

| TypeScript value | Rust variant | Notes |
|-----------------|-------------|-------|
| `'PURELY_SELF_EMPLOYED'` | `TaxpayerType::PurelySelfEmployed` | serde SCREAMING_SNAKE_CASE |
| `'PATH_A'` | `TaxRegimePath::PathA` | |
| `'FORM_1701_A'` | `BirFormType::Form1701A` | underscore before digit |
| `'Q1'` | `Quarter::Q1` | |
| `'CARRY_OVER'` | `OverpaymentDisposition::CarryOver` | |

### 18.3 Supabase RPC Parameter Type Alignments

| RPC | Parameter | Correct type | Wrong type |
|-----|-----------|-------------|-----------|
| `get_shared_computation` | `p_token` | `UUID` | `TEXT` |
| `accept_invitation` | `p_token` | `UUID` | `TEXT` |
| `get_invitation_by_token` | `p_token` | `UUID` | `TEXT` |
| `computations.share_token` column | — | `UUID` | `TEXT` |

### 18.4 Component → Props Alignments

| Component | Prop type | Source |
|-----------|----------|--------|
| `ResultsView` | `result: TaxComputationResult` | `loadComputation().outputJson` parsed via Zod |
| `WizardPage` | `initialInput?: TaxpayerInput` | `loadComputation().inputJson` |
| `PesoInput` | `value: string` | String always — never pass a number |
| `MoneyDisplay` | `amount: string` | String from Peso type |
| `ShareToggle` | `shareToken: string` (UUID format) | `computations.share_token` from Supabase |

---

## 19. Critical Traps Master List

These are the failure modes from the prior inheritance app that must be avoided:

### Engine / WASM

1. **Decimal as number**: `grossReceiptsAmount` must always be `string` ("1234.56"), never `number`. Floating-point arithmetic is prohibited.
2. **SCREAMING_SNAKE_CASE**: Enum JSON values are `"PURELY_SELF_EMPLOYED"` not `"PurelySelfEmployed"` or `"purely_self_employed"`.
3. **`deny_unknown_fields` on inputs**: Extra fields on input cause a parse error. Output types do NOT have `deny_unknown_fields`.
4. **`panic = "abort"` in release**: Required for WASM — panics that unwind crash the browser context.
5. **`getrandom/js` feature**: Required for any crate that uses randomness in WASM.

### Frontend Build

6. **WASM MIME type**: nginx must declare `application/wasm wasm` — missing causes `instantiateStreaming` failure.
7. **SPA routing**: nginx must have `try_files $uri $uri/ /index.html` — missing causes 404 on page refresh.
8. **Plugin order**: `wasm()` before `topLevelAwait()` in `vite.config.ts`. Both required.
9. **VITE_* are build args**: Changing after build does nothing. Must redeploy.
10. **WASM before frontend build**: `pkg/` must exist before `npm run build` runs.

### Supabase

11. **`share_token` is UUID**: Column type is `UUID`. RPC parameter `p_token` must be `UUID`. Passing a string UUID as `TEXT` to a `UUID` parameter raises a type error in PostgreSQL.
12. **Anon GRANT required**: `get_shared_computation` and `accept_invitation` need `GRANT EXECUTE TO anon` — without it, unauthenticated calls return "permission denied".
13. **SECURITY DEFINER needs `SET search_path = public`**: Prevents search_path injection attacks.
14. **RLS must be explicitly enabled**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — tables without explicit enable are wide open.
15. **`onAuthStateChange` race condition**: `getSession()` must be called first to get the initial session — the subscription fires only on changes.
16. **Email confirmation in local dev**: Supabase local `config.toml` must have `enable_signup = true` and optionally auto-confirm.
17. **Supabase Storage uses signed URLs**: `firm-logos` bucket is private — must use `createSignedUrl()`, not public URLs.

### Routes / Components

18. **Missing route registration**: Every route file must be imported AND added to `routeTree`. Silent white page otherwise.
19. **`publicRootRoute` nesting**: Public routes must be children of `publicRootRoute` to bypass AppLayout.
20. **`$compId.quarterly.tsx` naming**: Dot makes it a sibling route (correct), not nested.
21. **PDF dynamic import**: `TaxComputationDocument` uses dynamic `import()`. Orphan scan will miss it. Add a comment marker in `ActionsBar.tsx`.
22. **All 17 wizard steps statically imported**: All `WizardStep00` through `WizardStep13` (including 07A/B/C/D) must be statically imported in `WizardPage.tsx`, even if conditionally rendered.
23. **`ShareToggle` inside Sheet**: "Share" button in `ActionsBar` sets state; `ShareToggle` is in a `<Sheet>` in `ComputationDetailPage`, NOT directly in `ActionsBar`.
24. **`EmptyState` is shared**: One component, not per-page variants. Props: `icon`, `title`, `description`, `ctaLabel?`, `onCta?`.
25. **Sonner only for toasts**: Do NOT install shadcn `toast` alongside Sonner — they conflict.
26. **`SetupPage` bypasses router**: Rendered in `main.tsx` before `RouterProvider` when env vars missing.
27. **Sentry init before React**: `import * as Sentry from '@sentry/react'` must be the first import in `main.tsx`.
28. **Do NOT send validation errors to Sentry**: ERR_* codes are user input problems, not bugs.
29. **Cargo.lock must be committed**: Required for CI cache stability and build reproducibility.
30. **wasm-pack installer, not `cargo install`**: Installer downloads binary (~5s). `cargo install` compiles from source (~5min).

---

## 20. Glossary

| Term | Definition |
|------|-----------|
| BIR | Bureau of Internal Revenue (Philippine tax authority) |
| CWT | Creditable Withholding Tax — tax withheld by payors, applied as credit |
| Form 2307 | Certificate of Creditable Tax Withheld at Source |
| Form 1701A | Annual Income Tax Return (purely self-employed, all years) |
| Form 1701 | Annual Income Tax Return (mixed income or with employees) |
| Form 1701Q | Quarterly Income Tax Return |
| Form 2551Q | Quarterly Percentage Tax Return |
| NOLCO | Net Operating Loss Carry-Over — prior year losses applied to current year income |
| OSD | Optional Standard Deduction — 40% of gross receipts, no documentation required |
| Path A | Graduated income tax + Itemized deductions |
| Path B | Graduated income tax + OSD (40% of gross) |
| Path C | 8% flat rate on gross receipts (max ₱3M, purely self-employed only) |
| Percentage Tax | 3% (or 1% CREATE) tax on gross receipts for non-VAT taxpayers |
| PKCE | Proof Key for Code Exchange — Supabase auth flow for email/password |
| RDO | Revenue District Office — BIR regional office code |
| RLS | Row Level Security — PostgreSQL per-row access control |
| RPC | Remote Procedure Call — Supabase/PostgreSQL server-side function |
| TRAIN | Tax Reform for Acceleration and Inclusion (RA 10963, 2018) |
| CREATE | Corporate Recovery and Tax Incentives for Enterprises (RA 11534, 2021) |
| EOPT | Ease of Paying Taxes Act (RA 11976) — 4-tier taxpayer classification |
| WASM | WebAssembly — binary format for Rust engine compiled by wasm-pack |
| wasm-pack | Tool to compile Rust to WASM with JS bindings |
| Peso | Philippine peso (₱) — all monetary amounts stored as exact decimal strings |

---

*End of TaxKlaro Unified Platform Specification*
*Generated by reverse-ralph loop Wave 7 synthesis — 2026-03-06*
