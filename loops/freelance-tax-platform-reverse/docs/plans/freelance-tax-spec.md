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

### 7.7 Wizard Step Field Specifications

This section specifies every field in every wizard step. The forward loop MUST implement each field
with the exact label, type, placeholder, validation rules, and error messages listed here.

#### 7.7.1 Field Spec Conventions

**Field property table format (used for every field below):**

| Property | Meaning |
|----------|---------|
| **ID** | Field identifier matching engine data model field name (or `(UI-only)` for routing fields) |
| **Label** | Exact text label displayed above the field |
| **Type** | `peso`, `radio`, `select`, `checkbox`, `date`, `text`, `toggle`, `radio-card` |
| **Placeholder** | Placeholder inside the field when empty; never a substitute for label |
| **Default** | Initial value on page load |
| **Required** | Whether field must be filled before advancing |
| **Visible When** | Condition for display; `always` means no condition |
| **Validation Rules** | Ordered list applied on blur and on "Continue" click |
| **Error Messages** | Exact text shown when each rule fails |
| **Help Text** | Tooltip or inline explanation; shown as ? icon or below label |

**Peso field behavior (applies to ALL fields with type `peso`):**
- Display prefix: "₱" rendered as non-editable left adornment
- Numeric input only; commas auto-inserted for thousands separators on blur (e.g., "1200000" → "1,200,000")
- Accepts decimal point for centavos (e.g., "12500.50")
- On paste: strips non-numeric characters except decimal point
- Min value: 0 (negative values rejected with "Amount cannot be negative")
- Max value: 9,999,999,999.99 ("Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us.")
- Empty = treated as ₱0 only if field is not Required; for Required fields empty triggers "This field is required."

**ATC code auto-classification (used in WS-08):**

| ATC Code | Classification | Credit Applied To |
|----------|---------------|------------------|
| WI010 | Income Tax CWT | Income tax due |
| WI011 | Income Tax CWT | Income tax due |
| WI157 | Income Tax CWT | Income tax due |
| WI160 | Income Tax CWT | Income tax due |
| WI760 | Income Tax CWT (RR 16-2023 Platform) | Income tax due |
| WC010 | Income Tax CWT | Income tax due |
| WC760 | Income Tax CWT (RR 16-2023 Platform) | Income tax due |
| PT010 | Percentage Tax CWT | Percentage tax due (2551Q), NOT income tax |
| Any other | Unknown — Manual Review Required | Not credited until confirmed |

**Navigation controls (present on every step):**
- "Back" button: returns to previous visible step; disabled on WS-00
- "Continue" button: validates current step and advances; label changes to "See My Results" on last step
- Progress bar: shows N of M steps completed (M = total visible steps for this user's path)
- "Save and continue later" link (Pro feature): visible after authentication

---

#### 7.7.2 Step WS-00: Mode Selection

**Screen title:** "What would you like to compute?"
**Engine field set:** `filing_period` (preliminary)

**Field: mode_selection**

| Property | Value |
|----------|-------|
| ID | `mode_selection` (UI-only) |
| Label | "What are you computing?" |
| Type | Radio card group |
| Default | "Annual Return" |
| Required | Yes |
| Visible When | Always |

**Options:**

| Value | Card Title | Card Description |
|-------|-----------|-----------------|
| `ANNUAL` | "Annual Income Tax Return" | "Compute your full-year income tax and decide which tax method saves you the most. Filing deadline: April 15. Forms: 1701 or 1701A." |
| `QUARTERLY` | "Quarterly Income Tax Return" | "Pay your income tax for Q1, Q2, or Q3. Uses the cumulative method — earlier quarters are credited. Forms: 1701Q." |
| `PENALTY` | "Penalty and Late Filing" | "Missed a deadline? Compute the exact surcharge, interest, and compromise penalty owed for a late return." |

**Validation:** A selection is required to continue.
**Error:** (no selection): "Please select what you'd like to compute."

---

#### 7.7.3 Step WS-01: Taxpayer Profile

**Screen title:** "Let's find your best tax option"
**Engine fields set:** `taxpayer_type`, `is_mixed_income`

**Field: taxpayer_type**

| Property | Value |
|----------|-------|
| ID | `taxpayer_type` |
| Label | "Which best describes your income situation?" |
| Type | Radio card group |
| Default | None (no pre-selection) |
| Required | Yes |
| Visible When | Always |

**Options:**

| Value | Card Title | Card Description |
|-------|-----------|-----------------|
| `PURELY_SE` | "I'm purely self-employed or freelancing" | "Your only income is from your own business, practice, or freelance work. No salary from any employer. You can choose the 8% flat rate if eligible." |
| `MIXED_INCOME` | "I have both a job AND freelance/business income" | "You receive a salary from an employer AND earn extra income from a side business or profession. Your compensation is taxed separately." |
| `COMPENSATION_ONLY` | "I only have a salary from an employer" | "You receive only a payslip. Your employer already handles your income tax via payroll (BIR Form 2316). This tool has limited use for you." |

**Conditional action — COMPENSATION_ONLY selected:**
Shows modal overlay before advancing:
- Title: "This tool is for self-employed and freelance income"
- Body: "If you only earn a salary from an employer, your employer already handles your income tax withheld through payroll. You receive a BIR Form 2316 from your employer. You typically don't need to file your own income tax return unless you have multiple employers or other income. If you also have any business income on the side, please select 'I have both a job AND freelance/business income' instead."
- Button 1: "I have business income too — go back" → closes modal, re-selects nothing
- Button 2: "I understand — show me what applies to me" → advances but shows limited-applicability state (no regime comparison; engine returns COMPENSATION_ONLY result with no optimization)

**Dynamic behavior:**
- When `MIXED_INCOME` is selected: `is_mixed_income` set to `true` automatically; progress bar updates to show 2 additional steps
- When `PURELY_SE` is selected: `is_mixed_income` set to `false` automatically

**Validation:** Required.
**Error:** (no selection): "Please tell us which best describes you."

---

#### 7.7.4 Step WS-02: Business Type

**Screen title:** "What type of business or profession do you have?"
**Engine fields set:** `taxpayer_class` (via UI), `is_gpp_partner`
**Visible When:** `taxpayer_type` is `PURELY_SE` or `MIXED_INCOME`

**Field: business_category**

| Property | Value |
|----------|-------|
| ID | `business_category` (UI-only; maps to `taxpayer_class` and `cost_of_goods_sold` logic) |
| Label | "What type of business or profession do you have?" |
| Type | Radio card group |
| Default | None |
| Required | Yes |
| Visible When | Always (within WS-02) |

**Options:**

| Value | Card Title | Card Description | Engine mapping |
|-------|-----------|-----------------|---------------|
| `PROFESSIONAL_SERVICES` | "Professional or freelance services" | "IT, software, design, writing, marketing, consulting, tutoring, photography, video production, virtual assistant, or any work where you exchange time and skill for payment. No physical goods sold." | `taxpayer_class = SERVICE_PROVIDER`; `cost_of_goods_sold` hidden |
| `REGULATED_PROFESSIONAL` | "Licensed / government-regulated profession" | "Lawyer, doctor, dentist, nurse, CPA, engineer, architect, pharmacist, or other profession regulated by PRC or the Supreme Court. May practice solo or through a partnership." | `taxpayer_class = SERVICE_PROVIDER`; shows GPP sub-question |
| `TRADER` | "Product-based business (I sell goods)" | "Retail, wholesale, buy-and-sell, manufacturing, or any business where you primarily sell physical products or merchandise. You have cost of goods sold." | `taxpayer_class = TRADER`; shows `cost_of_goods_sold` field |
| `MIXED_BUSINESS` | "Both products and services" | "Your business sells both goods and services — e.g., a repair shop, a restaurant, a product + installation business." | `taxpayer_class = TRADER` (engine uses TRADER logic when COGS > 0); shows `cost_of_goods_sold` |
| `NOT_SURE` | "I'm not sure how to categorize my work" | "See the helper guide below to determine which category fits your work." | Shows helper panel; no selection made until user re-selects |

**NOT_SURE conditional action:** Shows inline expandable helper panel explaining service vs trader vs mixed vs licensed profession. User must select one of the first four options before advancing.

---

**Field: is_gpp_partner**

| Property | Value |
|----------|-------|
| ID | `is_gpp_partner` |
| Label | "Do you practice through a General Professional Partnership (GPP)?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when visible) |
| Visible When | `business_category == REGULATED_PROFESSIONAL` |
| Help Text | "A GPP is a partnership formed by licensed professionals (e.g., a law firm, accounting firm, or medical group) that is itself tax-exempt at the entity level. If you are a partner receiving a distributive share of GPP net income, your income is classified differently. Most solo practitioners select 'No'." |

**Conditional action — is_gpp_partner = Yes:** Shows amber advisory: "GPP partners are subject to special rules. The 8% flat rate option is NOT available to GPP distributive share income. Computation will proceed under Graduated + Itemized or Graduated + OSD." Sets `is_gpp_partner = true`; triggers MRF-025 in engine output.

**Validation:** Required when `business_category == REGULATED_PROFESSIONAL`.
**Error:** (no selection): "Please indicate whether you practice through a General Professional Partnership."

---

**Field: cost_of_goods_sold**

| Property | Value |
|----------|-------|
| ID | `cost_of_goods_sold` |
| Label | "Cost of goods sold (COGS)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No (defaults to ₱0) |
| Visible When | `business_category == TRADER` OR `business_category == MIXED_BUSINESS` |
| Help Text | "Enter the total cost of the goods you purchased or manufactured for sale. This includes the purchase price of inventory, shipping costs to acquire goods, and direct production costs. Do NOT include your own salaries, rent, or overhead here — those go in the expenses section." |

**Validation Rules:**
1. Must be ≥ ₱0.
2. Must be ≤ `gross_receipts` (cross-field check after WS-04).

**Error Messages:**
1. (negative): "Cost of goods sold cannot be negative."
2. (exceeds gross receipts): "Cost of goods sold cannot exceed your gross receipts. If your COGS exceeded your revenue, you have a gross loss — please verify your numbers."

---

#### 7.7.5 Step WS-03: Tax Year and Filing Period

**Screen title:** "What period are you filing for?"
**Engine fields set:** `tax_year`, `filing_period`

**Field: tax_year**

| Property | Value |
|----------|-------|
| ID | `tax_year` |
| Label | "Tax year" |
| Type | Select (dropdown) |
| Default | 2025 |
| Required | Yes |
| Visible When | Always |
| Help Text | "Select the calendar year you are filing for. For the Annual ITR due April 15, 2026: select 2025. For quarterly returns during 2026: select 2026." |

**Options:**

| Value | Display Label |
|-------|--------------|
| 2018 | "2018" |
| 2019 | "2019" |
| 2020 | "2020" |
| 2021 | "2021" |
| 2022 | "2022" |
| 2023 | "2023" |
| 2024 | "2024" |
| 2025 | "2025 (most common)" |
| 2026 | "2026 (current year — quarterly filers only)" |

**Validation Rules:**
1. Must be integer between 2018 and 2030 inclusive.
2. Cannot select future year for Annual returns (`mode_selection == ANNUAL` AND `tax_year > 2025` for 2026 current date).
3. For QUARTERLY mode: `tax_year` can be 2026 for current-year quarterly returns.

**Error Messages:**
1. (out of range): "Please select a valid tax year between 2018 and 2026."
2. (future annual): "You cannot file an Annual ITR for a year that has not yet ended. For quarterly returns in progress, select 'Quarterly Income Tax Return' mode."

**Dynamic advisories:**
- `tax_year == 2023`: Amber — "For 2023, there are two rate tables. The OLD TRAIN rates apply to January–December 2022 only. The NEW (lower) TRAIN rates apply to 2023 onwards. This tool applies the 2023+ rate table for Tax Year 2023, which is correct per BIR."
- `tax_year <= 2022`: Blue — "You are computing tax for {tax_year}. The 2018–2022 graduated rate table applies, with higher brackets than the 2023+ table."

---

**Field: filing_period**

| Property | Value |
|----------|-------|
| ID | `filing_period` |
| Label | "Filing period" |
| Type | Radio buttons |
| Default | `ANNUAL` (if Annual mode); `Q1` (if Quarterly mode) |
| Required | Yes |
| Visible When | Always |
| Help Text | "Annual: covers the full calendar year (Jan 1–Dec 31). Quarterly: covers Jan–Mar (Q1), Jan–Jun (Q2), or Jan–Sep (Q3) on a cumulative basis." |

**Options (conditional on mode_selection):**

If `mode_selection == ANNUAL`: Single option `ANNUAL` — "Annual Return — Full year (January 1–December 31)" (pre-selected, read-only).

If `mode_selection == QUARTERLY`:
- `Q1` — "Q1 — January 1 through March 31" (Due May 15)
- `Q2` — "Q2 — January 1 through June 30 (cumulative)" (Due August 15)
- `Q3` — "Q3 — January 1 through September 30 (cumulative)" (Due November 15)

Note shown below: "There is no Q4 quarterly return for income tax. Q4 data is reported on your Annual ITR (Form 1701/1701A) due April 15 of the following year."

If `mode_selection == PENALTY`: Show `ANNUAL`, `Q1`, `Q2`, `Q3` (all four).

**Validation Rules:**
1. Required; must match options for selected mode.
2. For QUARTERLY mode: must be Q1, Q2, or Q3; Q4 not valid.

**Error Messages:**
1. (no selection): "Please select the filing period."
2. (Q4 attempted): "Q4 is not a valid quarterly filing period for income tax. Select Annual Return to compute your full-year balance."

---

#### 7.7.6 Step WS-04: Gross Receipts

**Screen title:** "How much did you earn?"
**Engine fields set:** `gross_receipts`, `sales_returns_allowances`, `non_operating_income`, `fwt_income`

**Field: gross_receipts**

| Property | Value |
|----------|-------|
| ID | `gross_receipts` |
| Label | "Total gross receipts or sales" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None (empty) |
| Required | Yes |
| Visible When | Always |
| Help Text | "Enter all income you received from your business or profession during the period — before subtracting any expenses. For freelancers: all amounts clients paid you. For quarterly returns: the cumulative total from January 1 through the end of the quarter, not just the current quarter's receipts." |

**Validation Rules:**
1. Required — cannot be empty.
2. Must be ≥ ₱0.
3. Must be ≥ `sales_returns_allowances` (cross-field; checked on step completion).
4. Maximum: ₱9,999,999,999.99.
5. If `filing_period == Q1` AND `gross_receipts == 0`: show WARN advisory but do not block.

**Error Messages:**
1. (empty): "Please enter your gross receipts. Enter ₱0 if you had no income this period."
2. (negative): "Gross receipts cannot be negative."
3. (less than returns): "Gross receipts cannot be less than your sales returns and allowances."
4. (over maximum): "Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us."

**Dynamic advisories (shown inline, updated on keypress with 300ms debounce):**

| Condition | Type | Text |
|-----------|------|------|
| `0 < gross_receipts <= 250000` | Amber | "Your income is ₱250,000 or below. Under the 8% flat rate option, your income tax would be ₱0 — the ₱250,000 is fully exempt. You still need to file a return with BIR." |
| `250000 < gross_receipts <= 3000000` | Green | "You may be eligible for the 8% flat rate option. The optimizer will compare all available methods and recommend the one that saves you the most." |
| `gross_receipts > 3000000` | Orange | "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is NOT available. The optimizer will compare Graduated + OSD versus Graduated + Itemized Deductions." |
| `gross_receipts > 3000000` AND not VAT-registered | Orange (appended) | "At this income level, you may be required to register for VAT. See Registration Details in a later step." |
| `gross_receipts == 0` | Amber | "You have entered ₱0 for gross receipts. If you had no income this period, you are still required to file a 'no-income' return with BIR by the deadline." |

---

**Field: sales_returns_allowances**

| Property | Value |
|----------|-------|
| ID | `sales_returns_allowances` |
| Label | "Sales returns and allowances (if any)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always |
| Help Text | "Refunds you gave back to clients, credit memos, or discounts off the invoice price that reduce your gross receipts. Most freelancers leave this at ₱0. Do NOT enter your business expenses here — those are entered separately." |

**Validation Rules:** (1) ≥ ₱0; (2) ≤ `gross_receipts`.
**Error Messages:** (1) "Sales returns and allowances cannot be negative." (2) "Returns and allowances cannot exceed your gross receipts."

---

**Field: non_operating_income**

| Property | Value |
|----------|-------|
| ID | `non_operating_income` |
| Label | "Other business-related income (not subject to final tax)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (collapsed inside expandable "Additional income" section) |
| Help Text | "Passive income from your business that is not subject to final withholding tax and is not already included in your gross receipts above. Examples: rental income from a property you own for business use, royalties from professional work where no final tax was withheld." |

**Validation:** ≥ ₱0. **Error:** "Income cannot be negative."

---

**Field: fwt_income**

| Property | Value |
|----------|-------|
| ID | `fwt_income` |
| Label | "Income already subject to final withholding tax" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (collapsed inside expandable "Additional income" section) |
| Help Text | "Income on which the payor already withheld the FINAL tax — meaning this income is fully taxed and excluded from your income tax return computation. Examples: interest income on bank savings/time deposits (20% FWT), PCSO prize winnings (20% FWT), dividends from domestic corporations (10% FWT). This amount is excluded from the taxable base." |

**Validation:** ≥ ₱0. **Error:** "Amount cannot be negative."

---

#### 7.7.7 Step WS-05: Compensation Income

**Screen title:** "Your employment income"
**Engine fields set:** `taxable_compensation`, `compensation_cwt`
**Visible When:** `taxpayer_type == MIXED_INCOME`

**Step introduction text:** "For mixed-income earners, your salary from employers and your business income are computed together for tax purposes. Your employer(s) already withheld income tax from your salary — enter the NET taxable compensation after all exclusions."

**Field: taxable_compensation**

| Property | Value |
|----------|-------|
| ID | `taxable_compensation` |
| Label | "Total taxable compensation income" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None (empty) |
| Required | Yes (when WS-05 is visible) |
| Visible When | `taxpayer_type == MIXED_INCOME` |
| Help Text | "From your BIR Form 2316, use the amount on 'Gross Taxable Compensation Income' or Item 22 — which is your gross compensation MINUS non-taxable exclusions (SSS, PhilHealth, Pag-IBIG employee share, 13th month pay up to ₱90,000, de minimis benefits). If you have multiple employers, add up all Form 2316 amounts. Do NOT reduce by income tax withheld — that goes in the next field." |

**Validation Rules:** (1) Required; (2) ≥ ₱0; (3) If `== 0`: amber advisory "You entered ₱0 for compensation. If you truly have no salary income, consider selecting 'Purely Self-Employed' instead."
**Error Messages:** (1) "Please enter your taxable compensation. Use ₱0 if your compensation was fully excluded." (2) "Taxable compensation cannot be negative."

---

**Field: number_of_employers** (UI-only)

| Property | Value |
|----------|-------|
| ID | `number_of_employers` (UI-only) |
| Label | "How many employers did you have this year?" |
| Type | Select |
| Default | "1" |
| Required | No |
| Visible When | `taxpayer_type == MIXED_INCOME` |
| Help Text | "If you had more than one employer in the tax year, enter the combined totals from all your Form 2316 certificates in the fields below." |

**Options:** "1 employer", "2 employers", "3 or more employers". **Conditional advisory if > 1:** Amber — "With multiple employers, your total tax withheld may exceed what a single employer would withhold. Make sure you combine all Form 2316 amounts."

---

**Field: compensation_cwt**

| Property | Value |
|----------|-------|
| ID | `compensation_cwt` |
| Label | "Total income tax withheld from your salary (from all Form 2316s)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None (empty) |
| Required | Yes (when WS-05 is visible) |
| Visible When | `taxpayer_type == MIXED_INCOME` |
| Help Text | "From your BIR Form 2316, use Item 33 'Total Taxes Withheld'. If you have multiple Form 2316s, add the Item 33 amounts from each. This amount credits against your total income tax due." |

**Validation Rules:** (1) Required; (2) ≥ ₱0; (3) ≤ `taxable_compensation × 0.35` (soft warning, non-blocking); (4) If `compensation_cwt > taxable_compensation`: amber warning "Tax withheld exceeds your taxable compensation. Please verify your Form 2316 figures."
**Error Messages:** (1) "Please enter the total tax withheld from your salary." (2) "Amount cannot be negative."

---

#### 7.7.8 Step WS-06: Expense Method Selection

**Screen title:** "How would you like to handle your business expenses?"
**Engine fields set:** `osd_elected` (preliminary), routing for WS-07A–WS-07D
**Visible When:** `taxpayer_type == PURELY_SE` OR `taxpayer_type == MIXED_INCOME`

**Step introduction text:** "To recommend the best tax method, the optimizer needs to know your business expenses. You have two options:"

**Field: expense_input_method**

| Property | Value |
|----------|-------|
| ID | `expense_input_method` (UI-only routing) |
| Label | "How will you enter your expenses?" |
| Type | Radio card group |
| Default | "OSD" |
| Required | Yes |
| Visible When | Always (within WS-06) |

**Options:**

| Value | Card Title | Card Description |
|-------|-----------|-----------------|
| `ITEMIZED` | "Enter my actual expenses" | "I'll enter a detailed breakdown of what I spent on my business. This may save you more tax if your actual expenses exceed 40% of your income. You'll need your receipts and records." |
| `OSD` | "Use the 40% standard deduction (easier)" | "I don't want to track individual expenses. The BIR allows you to deduct 40% of your gross income automatically — no receipts needed. Great if your expenses are below 40% of income or you don't keep detailed records." |
| `NO_EXPENSES` | "I had no significant business expenses" | "My only income source is services billed to clients and I had no notable business costs. The tool will compute using OSD (40%) and 8% flat rate (if eligible)." |

**Routing:**
- `ITEMIZED` selected: Steps WS-07A, WS-07B, WS-07C, WS-07D added to wizard flow.
- `OSD` or `NO_EXPENSES` selected: WS-07A–WS-07D skipped; engine receives `ItemizedExpenseInput` with all fields ₱0.

**Advisory when `OSD` or `NO_EXPENSES` selected and `gross_receipts > 0`:**
Blue info showing: "Estimated OSD deduction: ₱{gross_receipts × 0.40}. This is 40% of your gross receipts. Taxable income under OSD would be approximately ₱{(gross_receipts - sales_returns_allowances) × 0.60}."

**Note shown below option cards:** "Regardless of which you choose, the optimizer will always compare all three tax methods (8%, OSD, and Itemized) and tell you which saves the most."

**Validation:** Required. **Error:** "Please select how you'll enter your expenses."

---

#### 7.7.9 Step WS-07A: Itemized Expenses — General Business Costs

**Screen title:** "Your business expenses — General costs"
**Engine fields set:** `itemized_expenses.salaries_and_wages`, `.sss_philhealth_pagibig_employer_share`, `.rent`, `.utilities`, `.communication`, `.office_supplies`, `.professional_fees_paid`, `.travel_transportation`, `.insurance_premiums`, `.taxes_and_licenses`, `.entertainment_representation`, `.home_office_expense`, `.home_office_exclusive_use`
**Visible When:** `expense_input_method == ITEMIZED`

**Step introduction text:** "Enter the amounts you spent on your business this year. Enter ₱0 for any category that doesn't apply to you. All deductions are subject to BIR rules — the engine applies the correct caps and rules automatically."

All fields below have: Type=Peso, Placeholder="0.00", Default=0, Required=No, Visible When=Always (within WS-07A). All validate: (1) ≥ ₱0. All error: "Amount cannot be negative."

| Field ID | Label | Help Text |
|----------|-------|-----------|
| `itemized_expenses.salaries_and_wages` | "Salaries and wages paid to employees" | "Total gross salaries and wages you paid to your employees or helpers during the year. Do NOT include your own compensation." |
| `itemized_expenses.sss_philhealth_pagibig_employer_share` | "Employer's share of SSS, PhilHealth, and Pag-IBIG contributions" | "Only the mandatory employer's share paid for your employees is deductible. The employee's share is not your expense. Your own voluntary contributions as a self-employed individual are NOT deductible under this line." |
| `itemized_expenses.rent` | "Office or workspace rent" | "Rent paid for your dedicated office space, co-working desk, or business premises. For home offices, use the 'Home office' field instead." |
| `itemized_expenses.utilities` | "Utilities (electricity, water — business portion)" | "Electricity and water bills attributable to your business operations. If you work from home, enter only the business-use portion." |
| `itemized_expenses.communication` | "Communication and internet costs (business portion)" | "Phone, mobile load, and internet subscription costs for business use. If your internet is used for both personal and business purposes, enter only the business portion." |
| `itemized_expenses.office_supplies` | "Office supplies and materials" | "Stationery, printer ink and paper, small tools, and other consumable supplies used in your business. Do NOT include computers or equipment lasting more than one year — those are depreciated." |
| `itemized_expenses.professional_fees_paid` | "Professional fees paid to others" | "Fees paid to accountants, lawyers, consultants, subcontractors, or other professionals who helped your business. Do NOT include your own professional income here." |
| `itemized_expenses.travel_transportation` | "Business travel and transportation" | "Transportation costs for business-related travel: fuel, parking, Grab/taxi rides to client sites, airfare and hotel for business trips within the Philippines. Personal travel is NOT deductible." |
| `itemized_expenses.insurance_premiums` | "Business insurance premiums" | "Premiums for business insurance policies: general liability, professional indemnity, property insurance on business assets. Life insurance is deductible ONLY if the death benefit goes to the business, not to your family." |
| `itemized_expenses.taxes_and_licenses` | "Business taxes and licenses (excluding income tax)" | "Business registration fees (barangay, municipal, city), professional tax receipts (PTR), documentary stamp taxes paid, and other taxes that are NOT income tax. Do NOT include your income tax or percentage tax here." |

**Field: entertainment_representation** (additional dynamic advisory)

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.entertainment_representation` |
| Label | "Entertainment, meals, and representation expenses" |
| Help Text | "Client meals, entertainment costs, and gifts spent for business development. Important: the BIR limits this deduction to 1% of your net revenue (for service businesses) or 0.5% of net sales (for traders). The engine automatically computes the cap. Enter your actual spending — the engine applies the cap." |

**Dynamic advisory when value > 0:** Blue info: "The BIR caps entertainment deductions at 1% of net revenue for service providers. Your estimated cap is ₱{(gross_receipts - sales_returns_allowances) × 0.01}. If you entered more than this, the engine will automatically reduce your deductible amount to the cap."

---

**Field: home_office_expense**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.home_office_expense` |
| Label | "Home office expense (monthly rent or mortgage interest)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always (within WS-07A) |
| Help Text | "If you work from home and have a space used exclusively for business (a dedicated room, not a shared living area), enter the business-use portion of your monthly home rent or mortgage interest × 12. Example: if your rent is ₱15,000/month and your home office is 15% of your home's total floor area, enter ₱15,000 × 12 × 0.15 = ₱27,000." |

**Validation:** (1) ≥ ₱0; (2) If `> 0` AND `home_office_exclusive_use == false`: engine sets deductible to ₱0; show warning.

---

**Field: home_office_exclusive_use**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.home_office_exclusive_use` |
| Label | "Is this space used exclusively and regularly for business?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when `home_office_expense > 0`) |
| Visible When | `itemized_expenses.home_office_expense > 0` |
| Help Text | "BIR requires the space to be used EXCLUSIVELY for business — meaning you do no personal activities there. A dedicated home office room qualifies. A dining table, bedroom, or shared living space does NOT qualify even if you work there regularly." |

**Validation:** Required when `home_office_expense > 0`.
**Error:** "Please indicate whether the space is used exclusively for business."
**Advisory when `false` AND expense > 0:** Amber: "Since the space is not exclusively used for business, the BIR home office deduction does NOT apply. Your home office expense of ₱{home_office_expense} will NOT be deducted."

---

#### 7.7.10 Step WS-07B: Itemized Expenses — Financial and Special Items

**Screen title:** "Your business expenses — Financial and special items"
**Engine fields set:** `interest_expense`, `final_taxed_interest_income`, `casualty_theft_losses`, `bad_debts`, `is_accrual_basis`, `charitable_contributions`, `charitable_accredited`, `research_development`
**Visible When:** `expense_input_method == ITEMIZED`

**Field: interest_expense**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.interest_expense` |
| Label | "Interest expense on business loans" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always |
| Help Text | "Gross interest paid on loans used for your business. Personal loans are not deductible. The BIR reduces this deduction by 33% of your interest income on bank deposits. The engine automatically applies this reduction." |

**Validation:** ≥ ₱0. **Error:** "Amount cannot be negative."

---

**Field: final_taxed_interest_income**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.final_taxed_interest_income` |
| Label | "Interest income from bank deposits (subject to 20% final tax)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | `itemized_expenses.interest_expense > 0` |
| Help Text | "If you earned interest on bank savings accounts or time deposits, enter the gross interest (before the 20% withholding). This is used to compute the 33% arbitrage reduction to your interest expense deduction." |

**Validation:** ≥ ₱0. **Error:** "Amount cannot be negative."

**Dynamic advisory when both > 0:** Blue info: "BIR requires a reduction to your interest expense deduction: 33% × ₱{final_taxed_interest_income} = ₱{final_taxed_interest_income × 0.33} will be subtracted from the gross interest expense. Net deductible interest: ₱{interest_expense - (final_taxed_interest_income × 0.33)}."

---

**Field: casualty_theft_losses**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.casualty_theft_losses` |
| Label | "Casualty or theft losses (not covered by insurance)" |
| Type | Peso | Placeholder | "0.00" | Default | 0 | Required | No |
| Visible When | Always |
| Help Text | "Losses of business property due to fire, typhoon, earthquake, flood, or theft that were NOT compensated by insurance. Only business assets qualify." |

**Validation:** ≥ ₱0. **Error:** "Amount cannot be negative."

---

**Field: is_accrual_basis**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.is_accrual_basis` |
| Label | "Do you use accrual accounting?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when bad_debts field is visible) |
| Visible When | Always (within WS-07B) |
| Help Text | "Accrual basis: you record income when earned (invoiced) and expenses when incurred, even if not yet paid. Cash basis: you record income and expenses only when cash changes hands. Most freelancers use cash basis. Bad debts are only deductible under accrual basis." |

---

**Field: bad_debts**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.bad_debts` |
| Label | "Bad debts written off" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | `is_accrual_basis == true` |
| Help Text | "Receivables from clients that you have formally written off as uncollectible this year. The client owed you money, you previously recognized this as income (accrual basis), you made reasonable collection efforts, and you've now given up on collecting. This deduction is NOT available to cash-basis taxpayers." |

**Validation Rules:** (1) ≥ ₱0; (2) If `is_accrual_basis == false` AND `bad_debts > 0`: show error.
**Error Messages:** (1) "Amount cannot be negative." (2) "Bad debts deduction is only available to accrual-basis taxpayers. You indicated you use cash basis accounting. Please correct your accounting method selection or remove this amount."

---

**Field: charitable_contributions**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.charitable_contributions` |
| Label | "Charitable contributions and donations" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always |
| Help Text | "Donations to BIR-accredited charitable organizations, foundations, or institutions. Capped at 10% of your taxable income before this deduction. Donations to non-accredited organizations are NOT deductible. The engine automatically applies the cap." |

**Validation:** ≥ ₱0. **Error:** "Amount cannot be negative."

---

**Field: charitable_accredited**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.charitable_accredited` |
| Label | "Is the recipient a BIR-accredited charitable organization?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes (when `charitable_contributions > 0`) |
| Visible When | `itemized_expenses.charitable_contributions > 0` |
| Help Text | "BIR-accredited organizations have a certificate of accreditation. If you're unsure, select 'No' to be safe — unaccredited donations are not deductible." |

**Advisory when `false` AND contributions > 0:** Amber: "Donations to non-accredited organizations are NOT deductible under NIRC Sec. 34(H). Your charitable contribution of ₱{charitable_contributions} will be excluded from your deductions."
**Validation:** Required when `charitable_contributions > 0`. **Error:** "Please indicate whether the charitable organization is BIR-accredited."

---

**Field: research_development**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.research_development` |
| Label | "Research and development expenses" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Always |
| Help Text | "Expenditures for research, product development, or technological innovation directly connected to your business. Must be ordinary and necessary for your business." |

**Validation:** ≥ ₱0. **Error:** "Amount cannot be negative."

---

#### 7.7.11 Step WS-07C: Itemized Expenses — Depreciation Assets

**Screen title:** "Your business assets (for depreciation)"
**Engine fields set:** `itemized_expenses.depreciation_entries`
**Visible When:** `expense_input_method == ITEMIZED`

**Step introduction text:** "If you own business equipment, computers, furniture, or vehicles used for your work, you can deduct a portion of their cost each year as depreciation. Enter each asset separately."

**Controls:**
- "+ Add another asset" button appends a new asset entry form
- Initial state: one asset entry form shown pre-opened
- "Skip depreciation — I have no qualifying assets" sets `depreciation_entries = []` and proceeds

**Per-asset entry fields (each instance identified by 1-based index N):**

**Field: asset_name[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].asset_name` |
| Label | "Asset description" |
| Type | Text |
| Placeholder | "e.g., MacBook Pro 2023, Office desk, Delivery motorcycle" |
| Default | Empty |
| Required | Yes (if entry exists) |
| Help Text | "A descriptive name so you can identify this asset in your records." |

**Validation Rules:** (1) Required; (2) At least 2 characters; (3) Maximum 100 characters.
**Error Messages:** (1) "Please describe this asset." (2) — (3) "Asset description must be 100 characters or fewer."

---

**Field: asset_cost[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].asset_cost` |
| Label | "Original purchase price" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | None |
| Required | Yes |
| Help Text | "The amount you paid to acquire this asset. For used assets, enter the price you paid." |

**Validation Rules:** (1) Required; (2) Must be > ₱0.
**Error Messages:** (1) "Please enter the purchase price." (2) "Purchase price must be greater than ₱0."

**Dynamic advisory for vehicles:** If `asset_name` contains "car", "van", "vehicle", "truck", "SUV", "sedan", "motorcycle" (case-insensitive) AND `asset_cost > 2400000`: Amber — "Vehicle cost exceeds the BIR's ₱2,400,000 ceiling (RR 12-2012). The engine will cap the depreciation base at ₱2,400,000. The excess ₱{asset_cost - 2400000} is non-deductible."

---

**Field: salvage_value[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].salvage_value` |
| Label | "Estimated residual value at end of useful life" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Help Text | "The estimated value of the asset when it's fully depreciated (e.g., scrap value). Most freelancers leave this at ₱0. For vehicles, a common estimate is ₱50,000–₱100,000." |

**Validation Rules:** (1) ≥ ₱0; (2) < `asset_cost`.
**Error Messages:** (1) "Salvage value cannot be negative." (2) "Salvage value must be less than the original purchase price."

---

**Field: useful_life_years[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].useful_life_years` |
| Label | "Useful life (years)" |
| Type | Select (dropdown) |
| Default | "5" |
| Required | Yes |
| Help Text | "The number of years this asset is expected to be useful for your business. BIR-prescribed useful lives apply." |

**Options:** 1, 2, 3 ("3 years — software, mobile phones"), 4, 5 ("5 years — computers, laptops, office equipment, cameras, vehicles"), 6, 7, 8, 9, 10 ("10 years — office furniture, heavy equipment, generators"), 15, 20, 25, 50.

**BIR-prescribed useful lives reference (expandable panel below the field):**
- Computer / laptop / tablet: 5 years
- Mobile phone: 3 years
- Camera / video equipment: 5 years
- Software license (perpetual): 3 years
- Office furniture and fixtures: 5–10 years
- Office equipment (printer, scanner): 5 years
- Air conditioning unit: 5–10 years
- Generator set: 10 years
- Delivery motorcycle: 5 years
- Delivery van or light vehicle: 5 years
- Heavy trucks: 10 years
- Building improvements (leasehold): lease term or 5 years, whichever is shorter

**Validation Rules:** (1) Required; (2) Integer between 1 and 50.
**Error Messages:** (1) "Please select the useful life." (2) "Useful life must be between 1 and 50 years."

---

**Field: acquisition_date[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].acquisition_date` |
| Label | "Date placed in service" |
| Type | Date picker (YYYY-MM-DD) |
| Default | None (empty) |
| Required | Yes |
| Help Text | "The date this asset was first used for business. If unsure of the exact date, use the first of the month of purchase." |

**Validation Rules:** (1) Required; (2) Valid date; (3) ≤ December 31 of `tax_year`; (4) ≥ 1970-01-01.
**Error Messages:** (1) "Please enter the date this asset was placed in service." (2) "Please enter a valid date in YYYY-MM-DD format." (3) "The acquisition date cannot be in the future relative to the tax year being filed."

---

**Field: depreciation_method[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].method` |
| Label | "Depreciation method" |
| Type | Radio buttons |
| Default | `STRAIGHT_LINE` |
| Required | Yes |
| Help Text | "Straight-line divides the cost equally over the useful life. Declining balance gives higher deductions in early years. Most freelancers use straight-line for simplicity." |

**Options:**
- `STRAIGHT_LINE` — "Straight-line (recommended)" — "Equal deduction each year: (Cost − Salvage) ÷ Useful Life."
- `DECLINING_BALANCE` — "Declining balance (double)" — "Higher deductions in early years; 2× the straight-line rate applied to the remaining book value."

**Validation:** Required. **Error:** "Please select a depreciation method."

---

**Field: prior_accumulated_depreciation[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.depreciation_entries[N].prior_accumulated_depreciation` |
| Label | "Prior accumulated depreciation (if asset was acquired in a previous year)" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | Asset entry N exists AND (`acquisition_date` year < `tax_year`) |
| Help Text | "If you already claimed depreciation on this asset in prior years' tax returns, enter the total amount already deducted. Leave at ₱0 if this is the first year you're deducting depreciation on this asset." |

**Validation Rules:** (1) ≥ ₱0; (2) < `asset_cost`.
**Error Messages:** (1) "Prior depreciation cannot be negative." (2) "Prior accumulated depreciation cannot equal or exceed the original cost of the asset."

**Delete Asset button (per entry):** "Remove this asset" — removes entry; no confirmation required.

---

#### 7.7.12 Step WS-07D: Itemized Expenses — NOLCO Carry-Over

**Screen title:** "Net Operating Loss Carry-Over (NOLCO)"
**Engine fields set:** `itemized_expenses.nolco_entries`
**Visible When:** `expense_input_method == ITEMIZED`

**Step introduction text:** "If your business had a net operating loss in a prior year (2022, 2023, or 2024) and you are using itemized deductions, you can carry over that loss as an additional deduction this year. This deduction is ONLY available under Itemized Deductions (not OSD or 8%)."

**Skip option:** "I have no prior-year losses to carry over" → sets `nolco_entries = []` and proceeds.

**Field: has_nolco**

| Property | Value |
|----------|-------|
| ID | `has_nolco` (UI-only routing) |
| Label | "Do you have any unused net operating losses from prior years?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Help Text | "A net operating loss occurs when your total allowable deductions exceed your gross income for the year. Under NIRC Sec. 34(D)(3), you can carry this loss forward for up to 3 years." |

**Per-NOLCO entry fields (shown only when `has_nolco == true`; "+ Add another loss year" button adds entries; max 3 entries):**

**Field: loss_year[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.nolco_entries[N].loss_year` |
| Label | "Year the loss was incurred" |
| Type | Select (dropdown) |
| Default | `tax_year - 1` |
| Required | Yes |
| Help Text | "The calendar year in which your net operating loss was incurred — not the year you're carrying it over to." |

**Options:** Dynamically generated — the three years prior to `tax_year` (e.g., for 2025: 2022, 2023, 2024).

**Validation Rules:** (1) Required; (2) Must be between `tax_year - 3` and `tax_year - 1`; (3) No duplicate `loss_year` across entries.
**Error Messages:** (1) "Please select the year the loss was incurred." (2) "NOLCO can only be carried over for 3 years. Loss from {loss_year} has expired and cannot be claimed in {tax_year}." (3) "You already entered a NOLCO entry for {loss_year}. Each loss year can only appear once."

---

**Field: original_loss[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.nolco_entries[N].original_loss` |
| Label | "Original net operating loss amount for {loss_year}" |
| Type | Peso |
| Default | None |
| Required | Yes |
| Help Text | "The full amount of the net operating loss as reported on your {loss_year} income tax return." |

**Validation:** (1) Required; (2) > ₱0. **Error:** (1) "Please enter the original loss amount." (2) "The original net operating loss must be greater than ₱0."

---

**Field: remaining_balance[N]**

| Property | Value |
|----------|-------|
| ID | `itemized_expenses.nolco_entries[N].remaining_balance` |
| Label | "Remaining undeducted balance" |
| Type | Peso |
| Default | Equals `original_loss` when `original_loss` is entered |
| Required | Yes |
| Help Text | "How much of the original loss you have NOT yet claimed. If this is the first year you're claiming it, enter the same amount as the original loss." |

**Validation Rules:** (1) Required; (2) ≥ ₱0; (3) ≤ `original_loss`.
**Error Messages:** (1) "Please enter the remaining undeducted balance." (2) "Remaining balance cannot be negative." (3) "Remaining balance cannot exceed the original loss amount."

---

#### 7.7.13 Step WS-08: Creditable Withholding Tax (Form 2307)

**Screen title:** "Tax withheld by your clients (BIR Form 2307)"
**Engine fields set:** `cwt_2307_entries`
**Visible When:** Always (after WS-01; applicable to all self-employed taxpayers)

**Step introduction text:** "When Philippine clients pay you for services, they are often required to withhold a portion of your fee and give you a BIR Form 2307. This withheld amount is like a tax pre-payment — you deduct it from your computed income tax due."

**Field: has_2307**

| Property | Value |
|----------|-------|
| ID | `has_2307` (UI-only routing) |
| Label | "Did you receive any BIR Form 2307 certificates from clients this year?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always |
| Help Text | "Form 2307 is a certificate your client gives you when they withhold tax. It shows: (1) the client's name and TIN, (2) the amount they paid you, (3) the rate they withheld (usually 5% or 10%), and (4) the total tax withheld. If you only worked for foreign clients or platforms that don't withhold Philippine tax, select No." |

**Advisory when `has_2307 == false`:** Blue info: "If you worked through platforms like Upwork or Fiverr, check whether your payment processor (e.g., Payoneer, PayPal, GCash) issued you a Form 2307 under BIR RR 16-2023. These may withhold 1% (WI760) on remittances."

**Per-2307 entry fields (shown when `has_2307 == true`; "+ Add another Form 2307" appends; max 50 entries — show error at submission if exceeded):**

**Field: payor_name[N]**

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].payor_name` |
| Label | "Client or company name (withholding agent)" |
| Type | Text |
| Placeholder | "e.g., Acme Corporation, Juan Santos" |
| Default | Empty |
| Required | Yes |
| Help Text | "The name of the person or company that withheld the tax. This is the name on your Form 2307 as the 'Withholding Agent'." |

**Validation:** (1) Required; (2) 2–200 characters. **Error:** (1) "Please enter the name of the client who withheld this tax." (2/3) "Please enter at least 2 characters." / "Name must be 200 characters or fewer."

---

**Field: payor_tin[N]**

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].payor_tin` |
| Label | "Client's TIN (Tax Identification Number)" |
| Type | Text |
| Placeholder | "XXX-XXX-XXX-XXXX" |
| Default | Empty |
| Required | No |
| Help Text | "The 9- or 12-digit TIN of the withholding agent as shown on their Form 2307. Format: 123-456-789 or 123-456-789-000. Optional — leaving this blank will not affect your tax computation." |

**Validation:** If not empty: must match pattern `\d{3}-\d{3}-\d{3}(-\d{3})?`.
**Error:** "Please enter the TIN in the format XXX-XXX-XXX or XXX-XXX-XXX-XXX (e.g., 123-456-789-000)."

---

**Field: atc_code[N]**

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].atc_code` |
| Label | "ATC code (Alphanumeric Tax Code)" |
| Type | Select with free-text fallback |
| Default | "WI010" |
| Required | Yes |
| Help Text | "The ATC code tells BIR what type of income was withheld. It appears on your Form 2307 in the 'ATC' column. If you're not sure, WI010 (5–10% professional fee) is the most common for freelancers." |

**Dropdown options (searchable):**

| ATC | Display Label |
|-----|--------------|
| WI010 | "WI010 — Professional fee, individual (5% or 10%)" |
| WI011 | "WI011 — Rental income, individual" |
| WI157 | "WI157 — Professional fee ≥ ₱720K, individual (15%)" |
| WI160 | "WI160 — Additional professional fees, individual (10%)" |
| WI760 | "WI760 — E-marketplace / DFSP remittance (1%, RR 16-2023)" |
| WC010 | "WC010 — Professional fee, corporate payee (5% or 10%)" |
| WC760 | "WC760 — E-marketplace, corporate payee (1%)" |
| PT010 | "PT010 — Percentage tax (3%), withheld by government" |
| OTHER | "Other — I'll enter the code manually" |

When "OTHER" selected: show free-text input with placeholder "Enter ATC code (e.g., WI162)".

**ATC classification preview shown below dropdown:**

| ATC | Preview Text |
|-----|-------------|
| WI010–WI160, WC010, WC760, WI760 | Green: "This credit will apply to your **income tax** due." |
| PT010 | Amber: "This credit applies to your **percentage tax** (2551Q), NOT your income tax. It does not reduce your Form 1701/1701A balance." |
| OTHER with unrecognized code | Amber: "Unrecognized ATC code — this will require manual review. The credit will be flagged and NOT automatically applied until the code is confirmed." |

**Validation:** (1) Required; (2) If "OTHER": free-text field must be non-empty.
**Error:** (1) "Please select an ATC code." (2) "Please enter the ATC code."

---

**Field: income_payment[N]**

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].income_payment` |
| Label | "Gross income on which tax was withheld" |
| Type | Peso |
| Default | None |
| Required | Yes |
| Help Text | "The total amount the client paid you during this period — before they withheld tax. Found in the 'Amount of Income Payment' column of your Form 2307." |

**Validation:** (1) Required; (2) > ₱0; (3) ≥ `tax_withheld`.
**Error:** (1) "Please enter the income amount." (2) "Income payment must be greater than ₱0." (3) "The income payment cannot be less than the tax withheld."

---

**Field: tax_withheld[N]**

| Property | Value |
|----------|-------|
| ID | `cwt_2307_entries[N].tax_withheld` |
| Label | "Amount of tax withheld" |
| Type | Peso |
| Default | None |
| Required | Yes |
| Help Text | "The actual amount withheld by your client. Shown in the 'Amount of Tax Withheld' column of your Form 2307." |

**Auto-hint shown when `income_payment > 0` and `atc_code` is known:**
- WI010: "At 5%: ₱{income_payment × 0.05} | At 10%: ₱{income_payment × 0.10}"
- WI157: "At 15%: ₱{income_payment × 0.15}"
- WI760: "At 1% (on ½ remittance): ₱{income_payment × 0.005} (0.5% effective rate per RR 16-2023)"
- PT010: "At 3%: ₱{income_payment × 0.03}"

**Validation:** (1) Required; (2) ≥ ₱0; (3) ≤ `income_payment`.
**Error:** (1) "Please enter the amount withheld." (2) "Tax withheld cannot be negative." (3) "Tax withheld cannot exceed the income payment amount."

---

**Field: period_from[N] and period_to[N]**

| Property | period_from | period_to |
|----------|------------|----------|
| ID | `cwt_2307_entries[N].period_from` | `cwt_2307_entries[N].period_to` |
| Label | "Period start date" | "Period end date" |
| Type | Date picker | Date picker |
| Default | January 1 of `tax_year` | December 31 of `tax_year` |
| Required | Yes | Yes |

**Validation:** (1) Both required; (2) `period_from` ≤ `period_to`; (3) Both dates within `tax_year`.
**Error:** (1) "Please enter the period start/end date." (2) "Period start date cannot be after period end date." (3) "The period dates must fall within tax year {tax_year}."

**Running total display (shown at bottom of WS-08 when at least one 2307 entry exists):**
```
┌─────────────────────────────────────────────────────┐
│  Summary of Tax Credits from Form 2307              │
│                                                     │
│  Income Tax Credits (WI/WC series):    ₱XX,XXX.XX  │
│  Percentage Tax Credits (PT010):       ₱X,XXX.XX   │
│  Credits requiring review (unknown):   ₱X,XXX.XX   │
│                                                     │
│  Total Income Tax Credits:             ₱XX,XXX.XX  │
└─────────────────────────────────────────────────────┘
```

---

#### 7.7.14 Step WS-09: Prior Quarterly Payments

**Screen title:** "Previous quarterly tax payments this year"
**Engine fields set:** `prior_quarterly_payments`
**Visible When:** `filing_period == ANNUAL` OR `filing_period == Q2` OR `filing_period == Q3`

**Step introduction text:**
- For ANNUAL: "If you made quarterly income tax payments during the year (Q1, Q2, or Q3 using Form 1701Q), enter them here. These payments will be credited against your annual tax due."
- For Q2: "If you made a Q1 quarterly income tax payment earlier this year, enter it here. The Q2 return uses the cumulative method — your Q1 payment is credited against the Q2 tax due."
- For Q3: "If you made Q1 and/or Q2 quarterly income tax payments earlier this year, enter them here."

**Field: has_prior_payments**

| Property | Value |
|----------|-------|
| ID | `has_prior_payments` (UI-only routing) |
| Label | "Did you make any quarterly income tax payments this year?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Help Text | "Quarterly payments are made using BIR Form 1701Q. If this is your first time filing or you didn't file quarterly returns, select 'No'." |

**Available entry slots (shown when `has_prior_payments == true`):**
- ANNUAL: Q1, Q2, Q3 entries
- Q2: Q1 entry only
- Q3: Q1 and Q2 entries

**Per-quarter fields (Q1 shown; Q2 and Q3 follow same pattern with respective labels):**

| Field ID | Label | Type | Default | Visible When |
|----------|-------|------|---------|-------------|
| `prior_quarterly_payments[Q1].amount_paid` | "Q1 payment made (January–March)" | Peso | 0 | `has_prior_payments == true` AND filing_period allows Q1 |
| `prior_quarterly_payments[Q1].date_paid` | "Q1 payment date" | Date picker | None | `amount_paid[Q1] > 0` |
| `prior_quarterly_payments[Q2].amount_paid` | "Q2 payment made (January–June)" | Peso | 0 | `has_prior_payments == true` AND Q2/Q3/ANNUAL |
| `prior_quarterly_payments[Q2].date_paid` | "Q2 payment date" | Date picker | None | `amount_paid[Q2] > 0` |
| `prior_quarterly_payments[Q3].amount_paid` | "Q3 payment made (January–September)" | Peso | 0 | `has_prior_payments == true` AND ANNUAL |
| `prior_quarterly_payments[Q3].date_paid` | "Q3 payment date" | Date picker | None | `amount_paid[Q3] > 0` |

Help text for amount fields: "The net amount you actually paid to BIR for your QN 1701Q return. This is the payment amount, not the computed tax — enter the actual amount remitted."
**Validation:** amount ≥ ₱0. **Error:** "Payment amount cannot be negative."

---

#### 7.7.15 Step WS-10: Registration and VAT Status

**Screen title:** "Your BIR registration details"
**Engine fields set:** `is_vat_registered`, `is_bmbe_registered`, `subject_to_sec_117_128`
**Visible When:** Always (after WS-01; all self-employed taxpayers)

**Field: is_bir_registered** (UI-only)

| Property | Value |
|----------|-------|
| ID | `is_bir_registered` (UI-only) |
| Label | "Are you registered with BIR?" |
| Type | Radio buttons |
| Default | "Yes" |
| Required | Yes |
| Options | `YES` — "Yes — I have a TIN and Certificate of Registration (Form 2303)"; `PLANNING` — "Not yet — I'm planning to register" |
| Help Text | "BIR registration means you have a TIN and a Certificate of Registration (COR)." |

**Advisory when `PLANNING` selected:** Amber — "BIR registration is required if your annual income from business or profession exceeds ₱250,000. This tool can still estimate your taxes. Note that you may be subject to penalties for late registration."

---

**Field: is_vat_registered**

| Property | Value |
|----------|-------|
| ID | `is_vat_registered` |
| Label | "Are you VAT-registered?" |
| Type | Radio buttons |
| Default | "No" |
| Required | Yes |
| Help Text | "VAT registration is mandatory if your annual gross sales exceed ₱3,000,000. The 8% flat rate option is NOT available to VAT-registered taxpayers." |

**Options:**
- `NO` — "No — I am not VAT-registered (Non-VAT)" — Path C (8%) may be available; 3% percentage tax applies if gross < ₱3M
- `YES` — "Yes — I am VAT-registered" — Path C blocked; only Paths A and B available

**Advisories:**
- `YES` selected: Orange — "VAT-registered taxpayers cannot use the 8% flat rate option. The optimizer will compare only Graduated + OSD (Path B) vs Graduated + Itemized Deductions (Path A)."
- `NO` selected AND `gross_receipts > 3000000`: Orange — "Your gross receipts of ₱{gross_receipts} exceed ₱3,000,000. You may be required to register for VAT. Operating above the VAT threshold without VAT registration may result in BIR penalties."

---

**Field: is_bmbe_registered**

| Property | Value |
|----------|-------|
| ID | `is_bmbe_registered` |
| Label | "Are you registered as a Barangay Micro Business Enterprise (BMBE)?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always (collapsed inside expandable "Special registrations" section) |
| Help Text | "BMBE registration (under RA 9178) exempts micro businesses with total assets of ₱3,000,000 or less from income tax. If you are BMBE-registered with a valid BMBE certificate, your income tax due is ₱0 regardless of income." |

**Advisory when `YES` selected:** Green — "BMBE-registered businesses are exempt from income tax under RA 9178. The engine will return ₱0 income tax for all paths. You still have percentage tax obligations (3%) if non-VAT registered."

---

**Field: subject_to_sec_117_128**

| Property | Value |
|----------|-------|
| ID | `subject_to_sec_117_128` |
| Label | "Is your business subject to special percentage taxes (e.g., telecom, transport, electricity, gas, water, franchise)?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Visible When | Always (collapsed inside expandable "Special registrations" section) |
| Help Text | "Certain industries pay industry-specific percentage taxes under NIRC Sections 117–128 instead of the general 3% percentage tax under Section 116. Most freelancers and professionals select 'No'." |

**Advisory when `YES` selected:** Amber — "Industry-specific percentage taxes (Sec. 117–128) disqualify you from the 8% flat rate option. The engine will compute Paths A and B only."

---

#### 7.7.16 Step WS-11: Regime Election

**Screen title:** "Have you elected a specific tax method?"
**Engine fields set:** `elected_regime`
**Visible When:** Always (for PURELY_SE and MIXED_INCOME taxpayers)

**Field: elected_regime**

| Property | Value |
|----------|-------|
| ID | `elected_regime` |
| Label | "Which best describes your situation?" |
| Type | Radio card group |
| Default | null (Optimizer mode) |
| Required | Yes |
| Help Text | "Your 'election' is how you formally told BIR which tax method you're using. The 8% option must be elected on your first quarterly return (Q1 1701Q). If you're not sure what you elected, select 'I want the optimizer to recommend the best method'." |

**Options:**

| Value | Card Title | Card Description |
|-------|-----------|-----------------|
| `null` | "Show me the best option (Optimizer Mode)" | "I want the tool to compute all applicable methods and recommend the one that saves me the most. Best for planning or first-time filers." |
| `ELECT_EIGHT_PCT` | "I elected the 8% flat rate" | "I formally elected the 8% flat rate on my Q1 1701Q return (or first quarterly return)." |
| `ELECT_OSD` | "I elected the graduated method + 40% OSD" | "I use the standard 40% deduction without tracking individual expenses." |
| `ELECT_ITEMIZED` | "I elected the graduated method + itemized deductions" | "I track my actual business expenses and claim them as deductions." |

**Blocking advisories for `ELECT_EIGHT_PCT`:**
- If `is_vat_registered == true`: Error — "You indicated you are VAT-registered. The 8% flat rate is NOT available to VAT-registered taxpayers. Please change your election to Graduated + OSD or Graduated + Itemized, or go back and correct your VAT registration status."
- If `gross_receipts > 3000000`: Error — "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is only available to taxpayers with gross receipts at or below ₱3,000,000. Please change your election."
- If `is_gpp_partner == true`: Error — "GPP partners cannot elect the 8% flat rate. Please change your election."

**Advisory when `null` (optimizer) selected:** Blue — "The optimizer will compute all eligible methods and present a three-way comparison. You are not locked into the recommendation — it's for planning only."

**Validation:** Required. If `ELECT_EIGHT_PCT` and any blocking condition, wizard blocks advancement.
**Error:** "Please select your regime election status."

---

#### 7.7.17 Step WS-12: Filing Details and Return Type

**Screen title:** "Filing details"
**Engine fields set:** `return_type`, `prior_payment_for_return`, `actual_filing_date`
**Visible When:** Always (final data step before results)

**Field: return_type**

| Property | Value |
|----------|-------|
| ID | `return_type` |
| Label | "Is this an original or amended return?" |
| Type | Radio buttons |
| Default | `ORIGINAL` |
| Required | Yes |
| Options | `ORIGINAL` — "Original — I am filing this for the first time"; `AMENDED` — "Amended — I am correcting a previously filed return" |
| Help Text | "Original: you are filing this return for the first time. Amended: you are correcting a return you already filed. Amendments must be filed within 3 years of the original due date." |

---

**Field: prior_payment_for_return**

| Property | Value |
|----------|-------|
| ID | `prior_payment_for_return` |
| Label | "Amount already paid on your original return" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | No |
| Visible When | `return_type == AMENDED` |
| Help Text | "If you already paid tax when you filed the original return, enter that amount here. It will be credited against the amended balance." |

**Validation:** ≥ ₱0. **Error:** "Prior payment cannot be negative."

---

**Field: is_late_filing**

| Property | Value |
|----------|-------|
| ID | `is_late_filing` (UI-only routing) |
| Label | "Are you filing after the deadline?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Help Text | "Deadlines: Annual ITR — April 15. Q1 — May 15. Q2 — August 15. Q3 — November 15. If you are filing after your deadline, select 'Yes' to compute penalties (surcharge, interest, and compromise penalty)." |

---

**Field: actual_filing_date**

| Property | Value |
|----------|-------|
| ID | `actual_filing_date` |
| Label | "Actual (or planned) filing date" |
| Type | Date picker |
| Default | Today's date |
| Required | Yes (when `is_late_filing == true`) |
| Visible When | `is_late_filing == true` |
| Help Text | "Enter today's date if you are computing penalties as of today. Enter a future date if you want to estimate penalties for filing on a future date." |

**Validation Rules:** (1) Required; (2) Valid date; (3) Must be after the deadline for the selected `filing_period` and `tax_year`.
**Error Messages:** (1) "Please enter the filing date." (2) "Please enter a valid date." (3) "The date you entered is on or before the deadline for this return. If you are filing on time, select 'No' for late filing."

---

#### 7.7.18 Step WS-13: Prior Year Carry-Over Credits

**Screen title:** "Prior year carry-over tax credits"
**Engine fields set:** `prior_year_excess_cwt`
**Visible When:** `filing_period == ANNUAL`

**Field: has_prior_year_carryover**

| Property | Value |
|----------|-------|
| ID | `has_prior_year_carryover` (UI-only routing) |
| Label | "Did you carry over an excess tax credit from last year's annual return?" |
| Type | Toggle (Yes / No) |
| Default | No |
| Required | Yes |
| Help Text | "If your tax credits (from CWT and quarterly payments) exceeded your income tax due on last year's annual return and you elected 'Carry Over' as your overpayment disposition, you have a credit to apply this year. You can find this on your prior year's Form 1701 or 1701A under 'Tax Credit Carried Over'." |

---

**Field: prior_year_excess_cwt**

| Property | Value |
|----------|-------|
| ID | `prior_year_excess_cwt` |
| Label | "Amount of credit carried over from prior year" |
| Type | Peso |
| Placeholder | "0.00" |
| Default | 0 |
| Required | Yes (when `has_prior_year_carryover == true`) |
| Visible When | `has_prior_year_carryover == true` |
| Help Text | "The exact peso amount shown as 'Carry Over' or 'Credit to be Applied Next Year' on your prior year's annual ITR. This reduces your current year's income tax balance payable." |

**Validation Rules:** (1) Required when visible; (2) ≥ ₱0.
**Error Messages:** (1) "Please enter the carry-over credit amount." (2) "Credit amount cannot be negative."

---

#### 7.7.19 Step Routing Matrix

| Step | Annual PURELY_SE OSD/8% | Annual PURELY_SE Itemized | Annual MIXED_INCOME | Quarterly Q1 | Quarterly Q2/Q3 | Late Filing |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| WS-00 Mode Selection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-01 Taxpayer Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-02 Business Type | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-03 Tax Year & Period | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-04 Gross Receipts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-05 Compensation | — | — | ✓ | Mixed only | Mixed only | Mixed only |
| WS-06 Expense Method | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-07A Gen. Expenses | — | ✓ | ✓ if itemized | ✓ if itemized | ✓ if itemized | ✓ if itemized |
| WS-07B Financial Items | — | ✓ | ✓ if itemized | ✓ if itemized | ✓ if itemized | ✓ if itemized |
| WS-07C Depreciation | — | ✓ | ✓ if itemized | ✓ if itemized | ✓ if itemized | ✓ if itemized |
| WS-07D NOLCO | — | ✓ | ✓ if itemized | ✓ if itemized | ✓ if itemized | ✓ if itemized |
| WS-08 Form 2307 CWT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-09 Prior Qtly Pmts | ✓ | ✓ | ✓ | — | ✓ Q2/Q3 | ✓ if annual |
| WS-10 Registration/VAT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-11 Regime Election | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-12 Filing Details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WS-13 Prior Year Credits | ✓ | ✓ | ✓ | — | — | ✓ if annual |

---

#### 7.7.20 Global Validation Constraints

Checked at "See My Results" click (cross-field, in addition to per-step validation):

| ID | Rule | Error Message |
|----|------|--------------|
| GV-01 | `gross_receipts >= sales_returns_allowances` | "Sales returns (₱{sales_returns_allowances}) cannot exceed gross receipts (₱{gross_receipts}). Please correct your income figures." |
| GV-02 | `cost_of_goods_sold <= gross_receipts` | "Cost of goods sold (₱{cost_of_goods_sold}) cannot exceed your gross receipts (₱{gross_receipts}). If your costs exceeded revenue, you have a gross loss — verify your numbers." |
| GV-03 | If `MIXED_INCOME`: `taxable_compensation > 0` | "Mixed-income earners must have compensation income greater than ₱0. If you have no salary income, change your taxpayer type to 'Purely Self-Employed'." |
| GV-04 | If `PURELY_SE`: `taxable_compensation == 0` | "Purely self-employed taxpayers should have ₱0 compensation income. If you have a salary, change your taxpayer type to 'Mixed Income'." |
| GV-05 | `compensation_cwt <= taxable_compensation` (soft/amber, non-blocking) | Advisory: "Tax withheld (₱{compensation_cwt}) exceeds compensation (₱{taxable_compensation}). Verify your Form 2316 figures." |
| GV-06 | Each DepreciationEntry: `salvage_value < asset_cost` | "For asset '{asset_name}': salvage value (₱{salvage_value}) must be less than purchase price (₱{asset_cost})." |
| GV-07 | Each DepreciationEntry: `prior_accumulated_depreciation < asset_cost` | "For asset '{asset_name}': prior depreciation (₱{prior_accumulated_depreciation}) cannot equal or exceed the purchase price." |
| GV-08 | Each Form2307Entry: `tax_withheld <= income_payment` | "For Form 2307 from {payor_name}: tax withheld (₱{tax_withheld}) cannot exceed income payment (₱{income_payment})." |
| GV-09 | Each Form2307Entry: `period_from <= period_to` | "For Form 2307 from {payor_name}: period start date cannot be after period end date." |
| GV-10 | Each NolcoEntry: `remaining_balance <= original_loss` | "For NOLCO from {loss_year}: remaining balance cannot exceed the original loss." |
| GV-11 | `ELECT_EIGHT_PCT` AND `is_vat_registered == true` | "You elected the 8% flat rate but you are VAT-registered. The 8% option is not available to VAT-registered taxpayers. Please change your election." |
| GV-12 | `ELECT_EIGHT_PCT` AND `gross_receipts > 3000000` | "You elected the 8% flat rate but your gross receipts exceed ₱3,000,000. The 8% option is only available at or below the ₱3,000,000 threshold." |
| GV-13 | If `is_late_filing == true`: `actual_filing_date` must be after deadline | "The filing date you entered ({actual_filing_date}) is on or before the deadline for this return. Change 'Are you filing late?' to 'No' or enter a later date." |
| GV-14 | Each NolcoEntry: no duplicate `loss_year` values | "You have two NOLCO entries for {loss_year}. Each loss year can only appear once." |
| GV-15 | Each QuarterlyPayment: `amount_paid >= 0` | "Quarterly payment amounts cannot be negative." |
| GV-16 | `prior_year_excess_cwt >= 0` | "Prior year carry-over credit cannot be negative." |
| GV-17 | `bad_debts > 0` AND `is_accrual_basis == false` | "Bad debts deduction requires accrual-basis accounting. You indicated you use cash basis. Please correct your accounting method or remove the bad debts amount." |
| GV-18 | `home_office_expense > 0` AND `home_office_exclusive_use == false` (soft/amber, non-blocking) | Advisory: "Home office deduction requires exclusive business use of the space. Since you indicated mixed use, the engine will set the home office deduction to ₱0." |
| GV-19 | `prior_quarterly_payments` length ≤ 3 | "Cannot enter more than 3 quarterly payment entries (Q1, Q2, Q3)." |
| GV-20 | `cwt_2307_entries` length ≤ 50 | "Maximum 50 Form 2307 entries allowed. Please combine multiple forms from the same payor into a single entry." |

---

#### 7.7.21 Dynamic Advisories and Contextual Guidance

Real-time advisories computed client-side as user fills the wizard. These do NOT block form submission — informational only.

| ID | Trigger Condition | Type | Advisory Text |
|----|------------------|------|--------------|
| DA-01 | `0 < gross_receipts <= 250000` | Amber | "Your income is at or below ₱250,000. Under the 8% flat rate, your income tax is ₱0 — you are fully covered by the ₱250,000 exemption. You still need to file a return with BIR." |
| DA-02 | `gross_receipts > 3000000` AND not VAT-registered | Orange | "Gross receipts exceed ₱3,000,000. The 8% flat rate is unavailable. Consider speaking with a CPA about VAT registration obligations." |
| DA-03 | `is_vat_registered == true` | Orange | "VAT-registered taxpayers cannot use the 8% flat rate. Only Paths A and B will be computed." |
| DA-04 | `is_bmbe_registered == true` | Green | "BMBE-registered businesses are exempt from income tax. All paths will show ₱0 income tax due." |
| DA-05 | `is_gpp_partner == true` | Amber | "GPP partners cannot use the 8% flat rate. The computation will be limited to Paths A and B, with certain items flagged for manual review." |
| DA-06 | `expense_input_method == ITEMIZED` AND sum of expense fields < `gross_receipts × 0.40` | Blue | "Your itemized expenses total ₱{total_itemized}. This is less than the 40% OSD (₱{osd_amount}). Unless your receipts include more expenses not yet entered, the OSD method may save you more." |
| DA-07 | `expense_input_method == ITEMIZED` AND sum of expense fields > `gross_receipts × 0.40` | Green | "Your itemized expenses total ₱{total_itemized}, which exceeds the 40% OSD (₱{osd_amount}). Itemized deductions may give you a better result if you have documentation." |
| DA-08 | Sum of income-tax-type CWT credits > estimated income tax under best regime | Blue | "Your CWT credits (₱{total_cwt}) may exceed your estimated income tax due. You may have an overpayment. The results screen will show your options: carry over, refund, or TCC." |
| DA-09 | `return_type == AMENDED` | Amber | "Amended returns must be filed within 3 years of the original due date. For tax year {tax_year}, the last date to amend is April 15, {tax_year + 4}. Verify that this deadline has not passed." |
| DA-10 | `filing_period == ANNUAL` AND `prior_quarterly_payments` is empty | Blue | "You have not entered any quarterly tax payments. If you filed quarterly returns (1701Q) for Q1, Q2, or Q3, those payments reduce your annual balance. Go back to add them if applicable." |
| DA-11 | Any 2307 entry has `atc_code == PT010` | Amber | "Form 2307 with ATC PT010 is a percentage tax credit — it applies to your 2551Q percentage tax, NOT your income tax. This will be shown separately in your results." |
| DA-12 | `is_late_filing == true` | Orange | "Late filing penalties will be computed and shown in your results. Penalties include: surcharge, interest (6% or 12% per annum depending on your tier), and a compromise penalty." |
| DA-13 | `tax_year <= 2022` | Blue | "You are computing for tax year {tax_year}. Older rate tables apply. Verify your results against BIR issuances for that year." |
| DA-14 | All `cwt_2307_entries` have `atc_code == WI760` | Blue | "All your Form 2307 entries use WI760 (RR 16-2023 platform withholding). This is correct for Upwork/Fiverr payments via Payoneer or GCash. The 1% rate applies on half the remittance amount (0.5% effective rate)." |

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

### 8.5 Empty States, Skeleton Loaders, and Error States

Every async page has three states beyond "loaded with data": skeleton (data in-flight), error (fetch failed), and empty (zero items).

#### 8.5.1 Shared Components

**`src/components/shared/EmptyState.tsx`**

```typescript
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCta?: () => void;
  className?: string;
}
```

Structure (6+ Tailwind classes required — anti-scaffolding gate):
```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
    <Icon className="w-8 h-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
  <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
  {ctaLabel && <Button onClick={onCta} className="mb-2">{ctaLabel}</Button>}
  {secondaryCtaLabel && <Button variant="ghost" onClick={onSecondaryCta}>{secondaryCtaLabel}</Button>}
</div>
```

**`src/components/shared/ErrorState.tsx`**

```typescript
interface ErrorStateProps {
  title?: string;      // defaults to "Something went wrong"
  message?: string;    // optional specific message
  onRetry?: () => void;
  className?: string;
}
```

Structure:
```tsx
<Alert variant="destructive" className="my-6">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>{title ?? 'Something went wrong'}</AlertTitle>
  <AlertDescription className="mt-2">
    {message ?? 'Unable to load data. Please check your connection and try again.'}
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 block">
        Try again
      </Button>
    )}
  </AlertDescription>
</Alert>
```

**`src/components/ui/skeleton.tsx`** (shadcn/ui primitive):
```tsx
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}
```

#### 8.5.2 Loading State Pattern (ALL async pages)

```tsx
function ExamplePage() {
  const [data, setData] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true); // starts true — no flash of empty
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetchData());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) return <SkeletonLayout />;
  if (error) return <ErrorState title="Unable to load" onRetry={loadData} />;
  if (data.length === 0) return <EmptyState ... />;
  return <DataView data={data} />;
}
```

Rules:
1. `isLoading` starts `true` — skeleton renders on first load, not a flash of empty state
2. `error` is reset before each `loadData()` call
3. Empty state only renders when `!isLoading && !error && data.length === 0`
4. Retry button calls `loadData()`, NOT `window.location.reload()`
5. NO React Suspense boundaries for data fetching — explicit loading state with useState

#### 8.5.3 Dashboard Page (`/`)

**Skeleton — Recent Computations:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  ))}
</div>
```

**Skeleton — Upcoming Deadlines:**
```tsx
<div className="space-y-2">
  {Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  ))}
</div>
```

**Error:** `title="Unable to load dashboard"`, `message="Could not fetch your recent computations. Please refresh the page."`, `onRetry={() => window.location.reload()}`

**Empty — No computations:** `icon=Calculator`, `title="No computations yet"`, `description="Start by creating your first tax computation for a client."`, `ctaLabel="New Computation"`, `onCta: navigate({ to: '/computations/new' })`

**Empty — No deadlines:** `icon=Calendar`, `title="No upcoming deadlines"`, `description="Deadlines will appear here as you finalize computations."`, no CTA

#### 8.5.4 Computations List Page (`/computations`)

**`src/components/computation/ComputationCardSkeleton.tsx`** (exported separately — reused in Dashboard):
```tsx
<div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
  <div className="flex items-start justify-between">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-5 w-16 rounded-full" />
  </div>
  <Skeleton className="h-4 w-1/2" />
  <div className="flex gap-2 mt-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-16" />
  </div>
</div>
```
Grid of 6 skeleton cards while loading (same grid layout as data: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`).

**Error:** `title="Unable to load computations"`, `message="There was a problem fetching your computations. Please try again."`, `onRetry: refetch()`

**Empty — No computations (no filters):** `icon=FileText`, `title="No computations yet"`, `description="Create a computation to get BIR-compliant tax analysis for any freelancer or self-employed client."`, `ctaLabel="New Computation"`, `onCta: navigate({ to: '/computations/new' })`

**Empty — No filter match:** `icon=SearchX`, `title="No results"`, `description="No computations match the selected filters. Try adjusting your status or tax year filters."`, `ctaLabel="Clear filters"`, `onCta: () => { setStatusFilter('all'); setTaxYearFilter('all'); }`

**Plan limit alert (FREE, 5/5 used)** — rendered ABOVE the grid, not instead of it:
```tsx
<Alert variant="default" className="mb-4 border-amber-200 bg-amber-50">
  <AlertCircle className="h-4 w-4 text-amber-600" />
  <AlertTitle className="text-amber-800">Computation limit reached</AlertTitle>
  <AlertDescription className="text-amber-700">
    You've used 5/5 computations on the Free plan.{' '}
    <a href="/settings?section=billing" className="underline font-medium">Upgrade to Pro</a>{' '}
    to create unlimited computations.
  </AlertDescription>
</Alert>
```

#### 8.5.5 Computation Detail Page (`/computations/$compId`)

**Skeleton:**
```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
    </div>
    <Skeleton className="h-9 w-32" />
  </div>
  <div className="flex gap-2 border-b pb-0">
    <Skeleton className="h-9 w-24" />
    <Skeleton className="h-9 w-24" />
    <Skeleton className="h-9 w-24" />
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
</div>
```

**Error — Not found (404):**
```tsx
<EmptyState
  icon={FileQuestion}
  title="Computation not found"
  description="This computation doesn't exist or you don't have access to it."
  ctaLabel="Back to computations"
  onCta={() => navigate({ to: '/computations' })}
/>
```

**Error — Load failure:** `<ErrorState title="Unable to load computation" message="There was a problem loading this computation." onRetry={() => refetch()} />`

**Empty — No results yet (status=draft, Results tab):**
```tsx
<EmptyState icon={Calculator} title="Not computed yet"
  description="Fill in the wizard inputs and click 'Compute' to see the tax analysis."
  ctaLabel="Edit inputs" onCta={() => setActiveTab('inputs')} />
```

**Empty — No notes:** `icon=MessageSquare`, `title="No notes yet"`, `description="Add notes to track decisions, client discussions, or BIR instructions."`, no CTA

**Empty — No deadlines:** `icon=Calendar`, `title="No deadlines set"`, `description="Deadlines are calculated based on the computation's tax year and filing type."`, no CTA

#### 8.5.6 Clients List Page (`/clients`)

**`src/components/clients/ClientRowSkeleton.tsx`** (exported — used per-row in ClientsTable):
```tsx
<tr className="border-b">
  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
  <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
</tr>
```
Render 8 skeleton rows in ClientsTable while loading. Container: `<table className="rounded-lg border overflow-hidden w-full text-sm">`.

**Error:** `title="Unable to load clients"`, `message="There was a problem fetching your client directory."`, `onRetry: refetch()`

**Empty — No clients:** `icon=Users`, `title="No clients yet"`, `description="Add your first client to start creating computations on their behalf."`, `ctaLabel="Add client"`, `onCta: navigate({ to: '/clients/new' })`

**Empty — No search match:** `icon=SearchX`, `title="No clients found"`, `description="No clients match your search. Try a different name or TIN."`, `ctaLabel="Clear search"`, `onCta: () => setSearchQuery('')`

#### 8.5.7 Client Detail Page (`/clients/$clientId`)

**Skeleton:**
```tsx
<div className="space-y-6">
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-6 w-48" />
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  </div>
  <div className="space-y-2">
    <Skeleton className="h-5 w-40" />
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
</div>
```

**Error — Not found:** `icon=UserX`, `title="Client not found"`, `description="This client doesn't exist or you don't have access to their profile."`, `ctaLabel="Back to clients"`, `onCta: navigate({ to: '/clients' })`

**Empty — No computations for client:** `icon=FileText`, `title="No computations for this client"`, `description="Create a computation to analyze this client's tax obligations."`, `ctaLabel="New Computation"`, `onCta: navigate({ to: '/computations/new', search: { clientId: client.id } })`

#### 8.5.8 Deadlines Page (`/deadlines`)

**Skeleton:**
```tsx
<div className="space-y-3">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  ))}
</div>
```

**Error:** `title="Unable to load deadlines"`, `message="There was a problem fetching your filing deadlines."`, `onRetry: refetch()`

**Empty:** `icon=CalendarCheck`, `title="No deadlines yet"`, `description="Filing deadlines appear here once computations are finalized. Finalize a computation to generate its deadline schedule."`, `ctaLabel="View computations"`, `onCta: navigate({ to: '/computations' })`

#### 8.5.9 Settings Page (`/settings`)

**Skeleton:**
```tsx
<div className="space-y-6">
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-5 w-32" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-9 w-full rounded-md" /></div>
      <div className="space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-9 w-full rounded-md" /></div>
    </div>
  </div>
  <div className="rounded-lg border bg-card p-6 space-y-4">
    <Skeleton className="h-5 w-40" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-20 w-20 rounded-lg" />
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>
  </div>
</div>
```

**Error:** `title="Unable to load settings"`, `message="There was a problem loading your profile. Please try again."`, `onRetry: refetch()`

**No empty state** — a user always has a profile (created on sign-up). Unfilled fields render as empty inputs with placeholder values.

#### 8.5.10 Team Settings Page (`/settings/team`)

**Skeleton — Members Table:**
```tsx
<div className="rounded-lg border overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-muted text-muted-foreground">
      <tr>
        <th className="px-4 py-3 text-left">Member</th>
        <th className="px-4 py-3 text-left">Role</th>
        <th className="px-4 py-3 text-left">Joined</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
    <tbody className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
          <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
          <td className="px-4 py-3"><Skeleton className="h-7 w-7 rounded-md" /></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Skeleton — Pending Invitations:**
```tsx
<div className="space-y-2">
  {Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="space-y-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-7 w-16 rounded-md" />
    </div>
  ))}
</div>
```

**Error:** `title="Unable to load team"`, `message="There was a problem fetching your team members."`, `onRetry: refetch()`

**Empty — Solo plan (FREE):**
```tsx
<EmptyState
  icon={UserPlus}
  title="Team features are not available on your plan"
  description="Upgrade to Enterprise to add team members and collaborate on computations."
  ctaLabel="View plans"
  onCta={() => navigate({ to: '/settings', search: { section: 'billing' } })}
/>
```

**No pending invitations:** PendingInvitationsTable section is simply hidden (not rendered) when `pendingInvitations.length === 0`.

#### 8.5.11 Shared Computation Page (`/share/$token`)

No AppLayout chrome (no sidebar, no nav).

**Loading:**
```tsx
<div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
  <div className="space-y-2">
    <Skeleton className="h-7 w-56" />
    <Skeleton className="h-4 w-40" />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    ))}
  </div>
</div>
```

**`src/components/shared-computation/SharedComputationNotFound.tsx`** (6+ Tailwind classes — anti-scaffolding gate):
```tsx
<div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
    <LinkOff className="w-8 h-8 text-muted-foreground" />
  </div>
  <h1 className="text-2xl font-bold text-foreground mb-2">Link not found or expired</h1>
  <p className="text-muted-foreground max-w-sm">
    This shared computation link is no longer active or doesn't exist.
    Please ask the sender for a new link.
  </p>
</div>
```

Used when RPC returns null (token not found OR share disabled — RPC only returns rows where `share_enabled = true`).

#### 8.5.12 Auth Callback Page (`/auth/callback`)

**Loading:**
```tsx
<div className="flex flex-col items-center justify-center min-h-screen gap-4">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  <p className="text-sm text-muted-foreground">Confirming your email...</p>
</div>
```

**Error:**
```tsx
<div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
  <Alert variant="destructive" className="max-w-md">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Email confirmation failed</AlertTitle>
    <AlertDescription>
      The confirmation link has expired or is invalid. Please request a new one.
      <Button variant="outline" size="sm" className="mt-3 block" onClick={() => navigate({ to: '/auth' })}>
        Back to sign in
      </Button>
    </AlertDescription>
  </Alert>
</div>
```

#### 8.5.13 Invite Accept Page (`/invite/$token`)

**Loading:**
```tsx
<div className="flex flex-col items-center justify-center min-h-screen gap-4">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  <p className="text-sm text-muted-foreground">Loading invitation...</p>
</div>
```

**Error — Expired:** `icon=Clock`, `title="Invitation expired"`, `description="This invitation link has expired (invitations are valid for 7 days). Please ask your admin to send a new invitation."`, `ctaLabel="Sign in to TaxKlaro"`, `onCta: navigate({ to: '/auth' })`

**Error — Already accepted:** `icon=CheckCircle2`, `title="Invitation already accepted"`, `description="You've already joined this organization. Sign in to access your account."`, `ctaLabel="Sign in"`, `onCta: navigate({ to: '/auth' })`

**Error — Invalid token:** `icon=LinkOff`, `title="Invalid invitation link"`, `description="This invitation link is not valid. Please check the link in your email or ask your admin to resend it."`, `ctaLabel="Sign in to TaxKlaro"`, `onCta: navigate({ to: '/auth' })`

#### 8.5.14 Empty State Icons Reference

| Page | Empty State Icon | lucide-react import |
|------|-----------------|---------------------|
| Dashboard — no computations | `Calculator` | `lucide-react` |
| Dashboard — no deadlines | `Calendar` | `lucide-react` |
| Computations — no data | `FileText` | `lucide-react` |
| Computations — no filter match | `SearchX` | `lucide-react` |
| Computation detail — 404 | `FileQuestion` | `lucide-react` |
| Computation detail — no results | `Calculator` | `lucide-react` |
| Computation detail — no notes | `MessageSquare` | `lucide-react` |
| Computation detail — no deadlines | `Calendar` | `lucide-react` |
| Clients — no data | `Users` | `lucide-react` |
| Clients — no search match | `SearchX` | `lucide-react` |
| Client detail — 404 | `UserX` | `lucide-react` |
| Client detail — no computations | `FileText` | `lucide-react` |
| Deadlines — no data | `CalendarCheck` | `lucide-react` |
| Team — solo plan | `UserPlus` | `lucide-react` |
| Share — not found | `LinkOff` | `lucide-react` |
| Invite — expired | `Clock` | `lucide-react` |
| Invite — already accepted | `CheckCircle2` | `lucide-react` |
| Invite — invalid token | `LinkOff` | `lucide-react` |
| All error states | `AlertCircle` | `lucide-react` |

Only `lucide-react` is used — no other icon libraries.

#### 8.5.15 Anti-Scaffolding Verification (Phase 7 — Forward Loop)

The forward loop's Phase 7 visual check MUST verify:
1. `EmptyState.tsx` root element has 6+ Tailwind classes — FAIL if fewer
2. `ComputationCardSkeleton.tsx` root element has 6+ Tailwind classes (`rounded-lg border bg-card p-4 space-y-3 animate-pulse`) — FAIL if fewer
3. `ClientRowSkeleton.tsx` `<tr>` element has at least `border-b` — FAIL if bare `<tr>`
4. `SharedComputationNotFound.tsx` root element has 6+ Tailwind classes — FAIL if fewer
5. Every page must render a skeleton before data arrives — test: add `await new Promise(r => setTimeout(r, 5000))` to data fetcher, verify skeleton appears
6. Every page's error state has a working retry button — test: mock Supabase to throw, click retry, verify reload

**Separately exported skeleton components** (reused across pages):
- `src/components/computation/ComputationCardSkeleton.tsx` — reused in ComputationsList grid AND Dashboard RecentComputations widget
- `src/components/clients/ClientRowSkeleton.tsx` — reused per-row in ClientsTable

All other skeleton layouts are inline JSX in the `isLoading` branch of each page component (not extracted to separate files).

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

#### 15.2.1 Configuration

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,       // Must be sequential: auth state shared across tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                 // Single worker to prevent DB contention on Supabase
  reporter: [['html'], ['line']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Serve production build for E2E (not dev server).
  // webServer is handled by CI before Playwright runs.
});
```

**Directory structure:**

```
e2e/
  fixtures/
    test-data.ts       — Shared test data (users, computations)
    auth.setup.ts      — Authenticated session setup
  auth.spec.ts
  onboarding.spec.ts
  computation-wizard.spec.ts
  auto-save.spec.ts
  compute-engine.spec.ts
  share.spec.ts
  pdf-export.spec.ts
  client-management.spec.ts
  team-management.spec.ts
  deadlines.spec.ts
  responsive.spec.ts
  error-handling.spec.ts
```

**Environment variables required for E2E:**

```
E2E_BASE_URL=http://localhost:8080       # production build server
VITE_SUPABASE_URL=http://127.0.0.1:54321 # local Supabase
VITE_SUPABASE_ANON_KEY=<local-anon-key> # from supabase status
VITE_APP_URL=http://localhost:8080
```

#### 15.2.2 Test Data Fixtures

**`e2e/fixtures/test-data.ts`:**

```typescript
export const TEST_USER = {
  email: `e2e-test-${Date.now()}@taxklaro-test.ph`,
  password: 'TestPassword123!',
  fullName: 'Maria Santos',
  firmName: 'Santos Tax Consulting',
};

export const TEST_CLIENT = {
  fullName: 'Juan dela Cruz',
  email: 'juan.delacruz@example.ph',
  phone: '09171234567',
  tin: '123-456-789-000',
};

// Based on test vector TV-BASIC-001: SC-P-ML-8
// Purely self-employed, ₱700,000 gross receipts, 8% wins
export const TEST_COMPUTATION = {
  title: 'Juan dela Cruz — 2025 Annual',
  taxYear: 2025,
  wizardInputs: {
    mode: 'ANNUAL',
    taxpayerType: 'PURELY_SE',
    fullName: 'Juan dela Cruz',
    tin: '123-456-789-000',
    taxYear: '2025',
    filingPeriod: 'ANNUAL',
    grossReceipts: '700000',
    expenseMethod: 'OSD',
    isVatRegistered: false,
    returnType: 'ORIGINAL',
  },
  expectedResults: {
    recommendedRegime: 'PATH_B_8_PERCENT',
    // 8% of (₱700,000 − ₱250,000 exemption) = 8% × ₱450,000 = ₱36,000
    taxDue8Percent: '36,000.00',
  },
};

export const TEST_INVITE_EMAIL = `e2e-invite-${Date.now()}@taxklaro-test.ph`;
```

**`e2e/fixtures/auth.setup.ts`:**

```typescript
import { test as setup } from '@playwright/test';
import { TEST_USER } from './test-data';

// Creates a real user in Supabase and saves auth state to disk.
// Requires Supabase local dev with email auto-confirm enabled.
// In CI against production Supabase, use admin API to confirm email.

setup('create authenticated session', async ({ page }) => {
  await page.goto('/auth?mode=signup');

  await page.getByLabel('Full Name').fill(TEST_USER.fullName);
  await page.getByLabel('Firm Name').fill(TEST_USER.firmName);
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByLabel('Confirm Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  // In local dev, email is auto-confirmed — user lands on /onboarding
  await page.waitForURL('**/onboarding');

  // Complete onboarding
  await page.getByLabel('Firm Name').fill(TEST_USER.firmName);
  await page.getByRole('button', { name: 'Create Workspace' }).click();
  await page.waitForURL('**/computations');

  // Save auth state for reuse across tests
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

#### 15.2.3 Test Suite: Auth Flow

**File:** `e2e/auth.spec.ts`

**T-AUTH-01: Sign Up → Confirm → Onboarding**

```
Preconditions:
  - No existing account for test email
  - Supabase local with email auto-confirm enabled

Steps:
  1. Navigate to /auth?mode=signup
  2. Assert: page title "Create your account"
  3. Assert: fields visible: Full Name, Firm Name, Email, Password, Confirm Password
  4. Fill Full Name: "Maria Santos"
  5. Fill Firm Name: "Santos Tax Consulting"
  6. Fill Email: unique test email
  7. Fill Password: "TestPassword123!"
  8. Fill Confirm Password: "TestPassword123!"
  9. Click "Create Account" button
  10. Assert: URL changes to /onboarding
  11. Assert: "Set up your workspace" heading visible
  12. Assert: Firm Name field pre-filled from sign-up data
  13. Click "Create Workspace" button
  14. Assert: URL changes to /computations
  15. Assert: empty state visible "No computations yet"
  16. Assert: sidebar visible with navigation items

Expected result: User created, org created, authenticated session established.
```

**T-AUTH-02: Sign In with Valid Credentials**

```
Preconditions:
  - Account exists (from auth.setup.ts)

Steps:
  1. Navigate to /auth?mode=signin
  2. Assert: "Sign in" tab active
  3. Fill Email: TEST_USER.email
  4. Fill Password: TEST_USER.password
  5. Click "Sign In" button
  6. Assert: URL changes to /computations
  7. Assert: AppLayout sidebar visible
  8. Assert: user email displayed in sidebar footer

Expected result: Authenticated session, redirected to dashboard.
```

**T-AUTH-03: Sign In with Wrong Password**

```
Steps:
  1. Navigate to /auth?mode=signin
  2. Fill Email: TEST_USER.email
  3. Fill Password: "WrongPassword999!"
  4. Click "Sign In" button
  5. Assert: no URL change (stays on /auth)
  6. Assert: Alert destructive visible with text "Invalid email or password."
  7. Assert: Password field NOT cleared (user can correct and retry)

Expected result: Error shown, user remains on sign-in page.
```

**T-AUTH-04: Unauthenticated Redirect**

```
Preconditions:
  - Not signed in (page without auth state)

Steps:
  1. Navigate to /computations (authenticated route)
  2. Assert: URL changes to /auth?mode=signin&redirect=%2Fcomputations
  3. Sign in with valid credentials
  4. Assert: URL changes to /computations (redirect param honored)

Expected result: Redirect chain works, user lands on intended page after auth.
```

**T-AUTH-05: Password Reset Flow**

```
Steps:
  1. Navigate to /auth/reset
  2. Assert: "Reset Password" heading visible
  3. Fill Email: TEST_USER.email
  4. Click "Send Reset Link" button
  5. Assert: confirmation card visible "Check your email for a reset link"
  6. Assert: no redirect (stays on /auth/reset with in-place confirmation)

Expected result: Reset email sent confirmation shown.
```

#### 15.2.4 Test Suite: Computation Wizard

**File:** `e2e/computation-wizard.spec.ts`
**Auth:** uses `e2e/.auth/user.json` storage state

**T-WIZARD-01: Complete New Computation (Happy Path — TV-BASIC-001)**

```
Preconditions:
  - Authenticated, has org

Steps:
  1. Navigate to /computations/new
  2. Assert: TaxWizard renders, Step WS-00 visible
  3. Assert: progress bar shows "Step 1 of N"

  --- WS-00: Mode Selection ---
  4. Select "Annual" radio option
  5. Click "Continue"

  --- WS-01: Taxpayer Profile ---
  6. Assert: WS-01 visible, heading "Taxpayer Profile"
  7. Select taxpayer type: "Purely Self-Employed"
  8. Click "Continue"

  --- WS-03: Tax Year and Filing Period ---
  9. Assert: WS-03 visible
  10. Set Tax Year: "2025"
  11. Set Filing Period: "Annual"
  12. Click "Continue"

  --- WS-04: Gross Receipts ---
  13. Assert: WS-04 visible
  14. Fill Gross Receipts: "700000"
  15. Assert: ₱ prefix renders, number formatted as "700,000" on blur
  16. Assert: no error message visible
  17. Click "Continue"

  --- WS-06: Expense Method ---
  18. Assert: WS-06 visible
  19. Select "Optional Standard Deduction (OSD)" radio
  20. Assert: note visible "OSD = 40% of Net Receipts"
  21. Click "Continue"

  --- WS-10: Registration Status ---
  22. Assert: WS-10 visible
  23. Assert: VAT toggle defaults to OFF
  24. Leave VAT: Not Registered
  25. Click "Continue"

  --- WS-12: Filing Details ---
  26. Assert: WS-12 visible
  27. Set Return Type: "Original Return"
  28. Click "Continue"

  --- Final Step ---
  29. Assert: "See My Results" button visible (last step)
  30. Click "See My Results"

  --- Computation Trigger ---
  31. Assert: loading indicator visible ("Computing...")
  32. Assert: ResultsView appears within 5 seconds
  33. Assert: URL changed to /computations/$compId

  --- Results Assertions ---
  34. Assert: "Recommended Regime" section visible
  35. Assert: "8% Flat Tax Option" highlighted as recommended
  36. Assert: [data-testid="tax-due-path-b"] contains "36,000"
  37. Assert: 3-regime comparison table visible (Path A | Path B | Path C)
  38. Assert: [data-testid="savings-callout"] visible with non-zero savings
  39. Assert: ActionsBar visible with buttons: "Export PDF", "Share", "Finalize"
  40. Assert: status badge shows "Computed"

Expected result: Full wizard → compute → results flow completes successfully.
```

**T-WIZARD-02: Validation — Required Fields**

```
Steps:
  1. Navigate to /computations/new
  2. Complete WS-00 (Annual)
  3. On WS-01: click "Continue" without selecting taxpayer type
  4. Assert: error message "Please select a taxpayer type" visible below radio group
  5. Assert: NO navigation to next step

  6. On WS-04: fill Gross Receipts with "0"
  7. Click "Continue"
  8. Assert: error message "Gross receipts must be greater than ₱0" visible
  9. Assert: NO navigation

  10. On WS-04: fill Gross Receipts with "-500"
  11. Assert: negative sign rejected or field reverts to "0"

Expected result: Validation prevents advancing with invalid data.
```

**T-WIZARD-03: Mixed Income Path — WS-05 Appears**

```
Steps:
  1. Navigate to /computations/new
  2. WS-00: select "Annual"
  3. WS-01: select "Mixed Income (Self-Employed + Employed)"
  4. Click "Continue"
  5. Assert: WS-05 (Compensation Income) step appears
  6. Fill Compensation Income: "500000"
  7. Click "Continue"
  8. Continue through remaining steps and compute
  9. Assert: computation includes compensation income in results

Expected result: Mixed-income path enables WS-05 and factors compensation into computation.
```

**T-WIZARD-04: Resume from Draft**

```
Preconditions:
  - An existing draft computation

Steps:
  1. Navigate to /computations
  2. Click on a ComputationCard with draft status
  3. Assert: URL is /computations/$compId
  4. Assert: Status badge shows "Draft"
  5. Assert: Input form rendered (not ResultsView)
  6. Assert: Gross Receipts field retains previously saved value
  7. Click "Compute"
  8. Assert: ResultsView renders

Expected result: Draft computations load with saved inputs intact.
```

#### 15.2.5 Test Suite: Auto-Save

**File:** `e2e/auto-save.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

**T-AUTOSAVE-01: Input Changes Persist After Reload**

```
Steps:
  1. Navigate to /computations/new
  2. Complete WS-00, WS-01
  3. On WS-04: fill Gross Receipts: "1200000"
  4. Assert: [data-testid="save-status-saving"] appears (auto-save triggered)
  5. Assert: [data-testid="save-status-saved"] appears within 3 seconds
  6. Note the URL: /computations/$compId (created on first save)
  7. Reload the page
  8. Assert: URL is still /computations/$compId
  9. Assert: Gross Receipts field shows "1,200,000" (value persisted)

Expected result: Auto-save preserves wizard inputs across reloads.

Timing:
  - Auto-save debounce: 1.5s after last keystroke
  - DB write: within 1s
  - "Saved" indicator: within 3s of last keystroke
```

**T-AUTOSAVE-02: Status Indicator States**

```
Steps:
  1. On computation detail page (draft status)
  2. Change a field value
  3. Assert: "Saving..." text visible in status indicator immediately
  4. Wait 3 seconds
  5. Assert: "Saved" text visible
  6. Wait 5 more seconds
  7. Assert: indicator returns to idle (no text or checkmark only)

Expected result: Three-state auto-save indicator (saving → saved → idle).
```

#### 15.2.6 Test Suite: Compute Engine

**File:** `e2e/compute-engine.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

**T-ENGINE-01: WASM Bridge — Results Correctness (TV-BASIC-001)**

```
Description:
  Verify the WASM engine produces correct output vs TV-BASIC-001 expected values.

Steps:
  1. Navigate to /computations/new
  2. Fill wizard with TV-BASIC-001 inputs:
     - Mode: Annual
     - Type: Purely Self-Employed
     - Tax Year: 2025
     - Gross Receipts: 700000
     - No CWT certificates
     - Expense Method: OSD
     - Regime: Let TaxKlaro Recommend
  3. Click "See My Results"
  4. Wait for ResultsView

  Assertions (TV-BASIC-001 expected values):
  5. Assert: [data-testid="recommended-regime"] contains "8% Flat Tax"
  6. Assert: [data-testid="tax-due-path-b"] contains "36,000"
  7. Assert: [data-testid="regime-comparison-path-a"] visible
  8. Assert: [data-testid="regime-comparison-path-b"] has class/aria indicating "winner"
  9. Assert: [data-testid="regime-comparison-path-c"] visible
  10. Assert: NO manual review flags visible (clean case)
  11. Assert: [data-testid="savings-callout"] visible with non-zero savings

Expected result: Engine output exactly matches TV-BASIC-001 expected values.
```

**T-ENGINE-02: WASM Error Handling — VAT Ineligibility**

```
Description:
  VAT-registered taxpayers cannot elect 8% — verify ineligibility shown.

Steps:
  1. Navigate to /computations/new, fill wizard:
     - Gross Receipts: 2000000 (₱2M — VAT registered)
     - Is VAT Registered: YES
  2. Compute
  3. Assert: ResultsView visible
  4. Assert: 8% option section shows ineligibility note
  5. Assert: recommended regime is Path A or Path C (not Path B)
  6. Assert: advisory text "VAT-registered taxpayers cannot elect 8%"

Expected result: Ineligible regime flagged correctly, alternative recommended.
```

#### 15.2.7 Test Suite: Share Flow

**File:** `e2e/share.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

**T-SHARE-01: Enable Sharing and View Public Link**

```
Preconditions:
  - A computed computation exists
  - User org has PRO or ENTERPRISE plan

Steps:
  1. Navigate to /computations/$compId (computed status)
  2. Click "Share" button in ActionsBar
  3. Assert: Sheet/Panel opens with title "Share Computation"
  4. Assert: sharing toggle is OFF by default
  5. Toggle sharing ON
  6. Assert: share URL appears in link field (format: https://taxklaro.ph/share/{uuid})
  7. Assert: Sonner toast "Computation shared! Link copied."
  8. Assert: clipboard contains the share URL

  --- Open in incognito context ---
  9. Open new browser context (no auth state)
  10. Navigate to the share URL
  11. Assert: no AppLayout sidebar visible (bare layout)
  12. Assert: TaxKlaro logo visible in header
  13. Assert: ResultsView visible with the same data
  14. Assert: NO ActionsBar (no Compute, Export PDF, Share buttons)
  15. Assert: "Created with TaxKlaro" attribution footer visible

Expected result: Sharing toggle creates public link, incognito access shows read-only results.
```

**T-SHARE-02: Disable Sharing — Link Invalidated**

```
Preconditions:
  - T-SHARE-01 completed, share URL captured

Steps:
  1. Return to authenticated session
  2. Navigate to /computations/$compId
  3. Click "Share" button
  4. Assert: sharing toggle is ON
  5. Toggle sharing OFF
  6. Assert: toast "Share link disabled"
  7. Open incognito context, navigate to the share URL from T-SHARE-01
  8. Assert: "This link is no longer valid or sharing has been disabled." card visible
  9. Assert: NO computation data shown

Expected result: Disabling sharing invalidates existing share URLs.
```

**T-SHARE-03: Invalid Share Token — Not Found**

```
Steps:
  1. Open incognito context (no auth)
  2. Navigate to /share/00000000-0000-0000-0000-000000000000
  3. Assert: "This link is no longer valid" card visible
  4. Assert: no computation data shown
  5. Assert: no JavaScript errors in console

Expected result: Invalid/non-existent tokens handled gracefully (null from RPC, not an error).
```

#### 15.2.8 Test Suite: PDF Export

**File:** `e2e/pdf-export.spec.ts`
**Auth:** uses `e2e/.auth/user.json` with PRO plan org

**T-PDF-01: Export PDF Downloads Correctly**

```
Preconditions:
  - A computed computation exists
  - User org has PRO or ENTERPRISE plan
  - Browser context has acceptDownloads: true

Steps:
  1. Navigate to /computations/$compId (computed status)
  2. Set up download event listener
  3. Click "Export PDF" button in ActionsBar
  4. Assert: button disabled / loading indicator visible
  5. Assert: file download triggered within 10 seconds
  6. Assert: downloaded filename matches "tax-computation-*-2025.pdf"
  7. Assert: file size > 20KB (not empty/blank PDF)
  8. Assert: Sonner toast "PDF ready for download"

Expected result: PDF generates and downloads with correct filename and non-zero size.
```

**T-PDF-02: Export PDF Disabled for FREE Plan**

```
Preconditions:
  - User org has FREE plan

Steps:
  1. Navigate to /computations/$compId (computed status)
  2. Assert: "Export PDF" button visible but disabled (grayed out)
  3. Hover over "Export PDF" button
  4. Assert: Tooltip visible "Upgrade to PRO to export PDFs"
  5. Click the button
  6. Assert: no download event fired

Expected result: PDF export gracefully gated for free plan users with tooltip explanation.
```

#### 15.2.9 Test Suite: Client Management

**File:** `e2e/client-management.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

**T-CLIENT-01: Add New Client**

```
Steps:
  1. Click "Clients" in sidebar
  2. Assert: URL is /clients
  3. Assert: EmptyState "No clients yet" OR existing clients table
  4. Click "Add Client" button
  5. Assert: URL changes to /clients/new
  6. Fill Full Name: "Juan dela Cruz"
  7. Fill Email: "juan@example.ph"
  8. Fill Phone: "09171234567"
  9. Fill TIN: "123-456-789-000"
  10. Click "Save Client"
  11. Assert: URL changes to /clients/$clientId
  12. Assert: Sonner toast "Client added successfully"
  13. Assert: client profile shows: Name, Email, TIN
  14. Assert: "Computations for this client" section visible (empty initially)
  15. Assert: "New Computation" button visible → links to /computations/new?clientId=$clientId

Expected result: Client created and visible in profile with linked computation CTA.
```

**T-CLIENT-02: New Computation Pre-Filled from Client**

```
Preconditions:
  - Client exists with known $clientId

Steps:
  1. Navigate to /clients/$clientId
  2. Click "New Computation for This Client"
  3. Assert: URL is /computations/new?clientId=$clientId
  4. Assert: wizard opens with client name pre-filled in WS-01
  5. Complete wizard and compute
  6. Navigate back to /clients/$clientId
  7. Assert: new computation appears in "Computations for this client" list

Expected result: Client-linked computation flow works end-to-end.
```

**T-CLIENT-03: Client Table — Columns Present**

```
Preconditions:
  - At least 3 clients exist

Steps:
  1. Navigate to /clients
  2. Assert: clients table renders with columns: Name, TIN, Email, Phone, Actions
  3. Assert: rows sorted alphabetically by name (ascending)

Expected result: Clients list renders with all required columns.
```

#### 15.2.10 Test Suite: Team Management

**File:** `e2e/team-management.spec.ts`
**Auth:** uses `e2e/.auth/user.json` (admin role)

**T-TEAM-01: Send Team Invitation**

```
Preconditions:
  - User is org admin
  - Org has PRO or ENTERPRISE plan

Steps:
  1. Navigate to /settings/team
  2. Assert: "Current Members" section shows current user
  3. Assert: "Invite New Member" form visible
  4. Fill Invite Email: TEST_INVITE_EMAIL
  5. Select Role: "Staff"
  6. Click "Send Invitation"
  7. Assert: Sonner toast "Invitation sent to {email}"
  8. Assert: invitation in "Pending Invitations" table with: email, role "Staff", status "Pending", expiry date

Expected result: Invitation sent and visible in pending list.
```

**T-TEAM-02: Revoke Invitation**

```
Preconditions:
  - T-TEAM-01 completed

Steps:
  1. Navigate to /settings/team
  2. Find invitation for TEST_INVITE_EMAIL
  3. Click "Revoke" button
  4. Confirm revocation (if confirmation dialog appears)
  5. Assert: Sonner toast "Invitation revoked"
  6. Assert: invitation removed from Pending Invitations table

Expected result: Invitation revoked and removed from list.
```

**T-TEAM-03: Seat Limit Enforcement — FREE Plan**

```
Preconditions:
  - User org has FREE plan (1 seat)

Steps:
  1. Navigate to /settings/team
  2. Assert: "Invite New Member" form is NOT visible
  3. Assert: upgrade CTA visible "Upgrade to PRO to add team members"

Expected result: Free plan users cannot invite team members.
```

#### 15.2.11 Test Suite: Deadlines

**File:** `e2e/deadlines.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

**T-DEADLINES-01: Deadlines Page Loads**

```
Steps:
  1. Click "Deadlines" in sidebar
  2. Assert: URL is /deadlines
  3. Assert (no deadlines): EmptyState with Calendar icon, "No upcoming deadlines"
  4. Assert (has deadlines): DeadlineCards visible, grouped by month
  5. Assert: each card shows: label, due date, computation title, client name

Expected result: Deadlines page renders correctly for both empty and non-empty states.
```

#### 15.2.12 Test Suite: Responsive (Mobile)

**File:** `e2e/responsive.spec.ts`
**Auth:** uses `e2e/.auth/user.json`
**Viewport:** 375×812 (Pixel 5)

**T-RESPONSIVE-01: Mobile Navigation**

```
Steps:
  1. Navigate to /computations (mobile viewport)
  2. Assert: desktop sidebar NOT visible
  3. Assert: hamburger menu button (Menu icon) visible in top bar
  4. Click hamburger button
  5. Assert: drawer slides in from left
  6. Assert: navigation items visible: Dashboard, New Computation, Computations, Clients, Deadlines, Settings
  7. Click "Computations" in drawer
  8. Assert: drawer closes
  9. Assert: /computations content visible

Expected result: Mobile drawer navigation works correctly.
```

**T-RESPONSIVE-02: Mobile Wizard**

```
Steps:
  1. Navigate to /computations/new (mobile viewport)
  2. Assert: wizard renders in single-column layout
  3. Assert: "Continue" button full-width at bottom
  4. Assert: "Back" button visible above "Continue"
  5. Assert: progress bar visible and readable
  6. Fill Step WS-00, click "Continue"
  7. Assert: smooth transition to WS-01 (no layout shift)
  8. Assert: all fields on WS-01 visible without horizontal scroll

Expected result: Wizard is usable on 375px viewport.
```

#### 15.2.13 Test Suite: Error Handling

**File:** `e2e/error-handling.spec.ts`

**T-ERROR-01: Missing VITE_SUPABASE_URL — SetupPage**

```
Preconditions:
  - Production build with no VITE_SUPABASE_URL env var
  - Special build required; skip in standard CI (mark with test.skip unless ERROR_TEST=true)

Steps:
  1. Navigate to /
  2. Assert: SetupPage renders (NOT crash/white page)
  3. Assert: heading "TaxKlaro Setup" or "Configuration Required" visible
  4. Assert: instructions for setting VITE_SUPABASE_URL visible
  5. Assert: no JavaScript uncaught exceptions in console

Expected result: Missing config shows setup page, not a blank crash.
```

**T-ERROR-02: Network Error During Compute (WASM Load Failure)**

```
Steps:
  1. Navigate to /computations/$compId (draft status)
  2. Intercept WASM load request:
     await page.route('**/taxklaro_engine_bg.wasm', route => route.abort())
  3. Click "Compute" button
  4. Assert: Sonner toast error "Failed to initialize computation engine. Please refresh and try again."
  5. Assert: "Compute" button re-enabled (not stuck loading)
  6. Assert: computation status remains "draft"

Expected result: WASM load failure handled gracefully, user can retry.
```

**T-ERROR-03: Supabase Error During Save**

```
Steps:
  1. Navigate to /computations/new, fill WS-04 with ₱500,000
  2. Intercept Supabase REST calls and return 503:
     await page.route('**/rest/v1/computations**', route => route.fulfill({ status: 503 }))
  3. Wait 2 seconds after field change (trigger auto-save)
  4. Assert: [data-testid="save-status-saving"] appears
  5. Assert: Sonner toast error "Error saving computation. Changes may not be saved."
  6. Assert: status indicator shows error state (not "Saved")

Expected result: Save failures surfaced to user, data not silently lost.
```

#### 15.2.14 Orphan Verification Script

**File:** `scripts/orphan-scan.ts`

```typescript
// Verifies every component in src/components/ is:
// 1. Imported by at least one route OR parent component (static import graph)
// 2. Listed in the component-wiring-map

// Additionally verifies action triggers:
// For action-triggered features (PDF, share, delete, finalize):
// 3. The trigger button exists in the parent component from action-trigger-map

// Failure mode: exits with code 1, prints list of orphaned components
// Run in CI Phase 7 before Playwright: npx tsx scripts/orphan-scan.ts
```

#### 15.2.15 CI Integration Order

```
Phase 1: Unit tests (vitest run) — must pass before E2E starts
Phase 2: Production build (npm run build) — must succeed
Phase 3: Production serve (npx serve dist -l 8080) — start in background
Phase 4: Supabase local start (supabase start) — required for E2E auth
Phase 5: Playwright E2E (npx playwright test)
  - auth.setup.ts runs first (creates test user + org)
  - All other suites run with --workers=1 to avoid DB contention
  - Mobile suite runs on Pixel 5 project (all suites, not just smoke)
Phase 6: Cleanup (supabase stop, kill serve process)
```

#### 15.2.16 Critical Traps

1. **auth.setup.ts must run first** — Use Playwright `dependencies` in config. Auth state file `e2e/.auth/user.json` must exist before other suites start.

2. **Email auto-confirm in local dev** — Set `enable_email_autoconfirm = true` in `supabase/config.toml` for E2E. In CI against production Supabase, use service key to confirm email via admin API.

3. **UUID in share token** — `/share/$token` route param is a string. E2E tests using `00000000-0000-0000-0000-000000000000` must use valid UUID format — the RPC must handle this as "not found" not a DB type error.

4. **PDF download in headless Chrome** — Playwright headless mode blocks downloads by default. Set `acceptDownloads: true` in browser context for T-PDF-01.

5. **WASM path interception** — In T-ERROR-02, intercept the exact WASM filename `taxklaro_engine_bg.wasm`, not loose `**/*.wasm` (may intercept other binaries). Use `**/taxklaro_engine_bg.wasm`.

6. **Auto-save timing** — T-AUTOSAVE-01 must wait at least 2s after field change before asserting "Saved". Use `page.waitForSelector('[data-testid="save-status-saved"]')` with 5s timeout, not a fixed sleep.

7. **PRO plan for PDF/share tests** — T-PDF-01 and T-SHARE-01 require a PRO plan org. Create the test org with PRO plan via direct DB insert in `auth.setup.ts`, or use a separate PRO fixture.

8. **Test isolation** — Each test suite creates its own computations in `beforeEach`. Do not share draft/computed computation state across suites.

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
4. **Production Build**: Run with stub env vars (syntactically valid but not connected to real Supabase):
   ```sh
   VITE_SUPABASE_URL=https://placeholder-project.supabase.co \
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhc2UiLCJyZWYiOiJwbGFjZWhvbGRlciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.stub \
   VITE_APP_URL=http://localhost:5173 \
   npm run build
   ```
   These stub values match Supabase URL and JWT formats so Vite embeds them without error. Purpose: verify Vite + WASM + Tailwind compilation succeeds. NOT connected to a real backend.
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
