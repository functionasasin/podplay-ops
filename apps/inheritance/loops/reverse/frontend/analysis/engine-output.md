# engine-output — EngineOutput, InheritanceShare, HeirNarrative, ComputationLog, ManualFlag

> **Rust source:** `../inheritance-rust-forward/src/types.rs:523-580`
> **Construction:** `step10_finalize.rs:452-623` — `step10_finalize()` builds the EngineOutput
> **Rounding:** `step10_finalize.rs:306-353` — `allocate_with_rounding()` (§12.2 largest-remainder)
> **Narrative generation:** `step10_finalize.rs:358-448` — `generate_heir_narrative()` + `assemble_narrative()`
> **Pipeline entry:** `pipeline.rs:20-157` — `run_pipeline()` returns EngineOutput
> **Integration tests:** `tests/integration.rs` — 23 test vectors with invariant checks

## Rust Definitions

### EngineOutput (types.rs:525-533)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineOutput {
    pub per_heir_shares: Vec<InheritanceShare>,
    pub narratives: Vec<HeirNarrative>,
    pub computation_log: ComputationLog,
    pub warnings: Vec<ManualFlag>,
    pub succession_type: SuccessionType,
    pub scenario_code: ScenarioCode,
}
```

### InheritanceShare (types.rs:535-551)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InheritanceShare {
    pub heir_id: HeirId,
    pub heir_name: String,
    pub heir_category: EffectiveCategory,
    pub inherits_by: InheritanceMode,
    pub represents: Option<HeirId>,
    pub from_legitime: Money,
    pub from_free_portion: Money,
    pub from_intestate: Money,
    pub total: Money,
    pub legitime_fraction: String,
    pub legal_basis: Vec<String>,
    pub donations_imputed: Money,
    pub gross_entitlement: Money,
    pub net_from_estate: Money,
}
```

### HeirNarrative (types.rs:553-559)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeirNarrative {
    pub heir_id: HeirId,
    pub heir_name: String,
    pub heir_category_label: String,
    pub text: String,
}
```

### ComputationLog (types.rs:561-566)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputationLog {
    pub steps: Vec<StepLog>,
    pub total_restarts: i32,
    pub final_scenario: String,
}
```

### StepLog (types.rs:568-573)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepLog {
    pub step_number: i32,
    pub step_name: String,
    pub description: String,
}
```

### ManualFlag (types.rs:575-580)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualFlag {
    pub category: String,
    pub description: String,
    pub related_heir_id: Option<HeirId>,
}
```

### Supporting Enums (Output-relevant, already covered in other analyses)

```rust
// types.rs:142-149
pub enum EffectiveCategory {
    LegitimateChildGroup,
    IllegitimateChildGroup,
    SurvivingSpouseGroup,
    LegitimateAscendantGroup,
    CollateralGroup,
}

// types.rs:151-155
pub enum InheritanceMode {
    OwnRight,
    Representation,
}

// types.rs:173-178
pub enum SuccessionType {
    Testate,
    Intestate,
    Mixed,
    IntestateByPreterition,
}

// types.rs:248-283
pub enum ScenarioCode {
    T1, T2, T3, T4, T5a, T5b, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15,
    I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13, I14, I15,
}
```

## TypeScript Interfaces

```typescript
// Mirrors: ../inheritance-rust-forward/src/types.rs:525-533
/**
 * Complete engine output — the result of running the 10-step pipeline.
 * This is the response shape returned by the API and consumed by the Results View.
 */
export interface EngineOutput {
  /** Per-heir distribution breakdown. Includes zero-share entries for excluded heirs. */
  per_heir_shares: InheritanceShare[];
  /** Per-heir plain-English narrative explaining their share and legal basis. */
  narratives: HeirNarrative[];
  /** Pipeline computation log (steps executed, restarts, final scenario). */
  computation_log: ComputationLog;
  /** Manual review warnings (preterition, inofficiousness, unresolved vacancies, etc.). */
  warnings: ManualFlag[];
  /** Final succession type determined by the engine. */
  succession_type: SuccessionType;
  /** Final scenario code (T1-T15 or I1-I15) determined by the engine. */
  scenario_code: ScenarioCode;
}

// Mirrors: ../inheritance-rust-forward/src/types.rs:535-551
/**
 * A single heir's share breakdown.
 *
 * Key money relationships:
 * - gross_entitlement = net_from_estate + donations_imputed
 * - total = gross_entitlement (same value, engine uses both)
 * - net_from_estate = what the heir actually receives from the physical estate
 * - donations_imputed = previously received donations counted against their share
 *
 * Invariant (§14.2 Inv. 1): sum(all heirs' net_from_estate) == net_distributable_estate
 *
 * NOTE: from_legitime, from_free_portion, from_intestate are currently set to Money(0)
 * in the engine (step10_finalize.rs:538-540 "TODO: round sub-components"). The total
 * is the definitive amount. Frontend should use total/net_from_estate for display,
 * and treat the sub-components as informational when populated.
 */
export interface InheritanceShare {
  /** Heir ID matching a Person.id from the input family_tree, or a generated ID for strangers. */
  heir_id: string;
  /** Heir's display name. */
  heir_name: string;
  /** Effective heir category group (after adoption/legitimation normalization). */
  heir_category: EffectiveCategory;
  /** Whether the heir inherits by own right or by representation. */
  inherits_by: InheritanceMode;
  /** If inheriting by representation, the ID of the heir they represent. */
  represents: string | null;
  /** Amount from compulsory legitime. Currently always 0 (engine TODO). */
  from_legitime: Money;
  /** Amount from free portion dispositions. Currently always 0 (engine TODO). */
  from_free_portion: Money;
  /** Amount from intestate distribution. Currently always 0 (engine TODO). */
  from_intestate: Money;
  /** Total share = gross_entitlement (includes imputed donations). */
  total: Money;
  /** Human-readable legitime fraction string. Currently empty string (engine TODO). */
  legitime_fraction: string;
  /** Legal basis articles (e.g., ["Art. 888", "Art. 892"]). */
  legal_basis: string[];
  /** Total donations imputed against this heir's share (collation). */
  donations_imputed: Money;
  /** Gross entitlement = net_from_estate + donations_imputed. */
  gross_entitlement: Money;
  /** Net amount actually payable from the estate (after subtracting imputed donations). */
  net_from_estate: Money;
}

// Mirrors: ../inheritance-rust-forward/src/types.rs:553-559
/**
 * A plain-English narrative paragraph for one heir.
 * Generated by step10_finalize.rs:358-448.
 *
 * The text contains Markdown formatting (bold for names and amounts).
 * Sections in order: Header, SuccessionType, Category, [Representation if applicable].
 */
export interface HeirNarrative {
  /** Heir ID matching InheritanceShare.heir_id. */
  heir_id: string;
  /** Heir's display name. */
  heir_name: string;
  /** Short category label (e.g., "legitimate child", "surviving spouse", "grandchild, by representation"). */
  heir_category_label: string;
  /** Full narrative paragraph with Markdown bold markers. */
  text: string;
}

// Mirrors: ../inheritance-rust-forward/src/types.rs:561-566
/**
 * Computation log tracking pipeline execution.
 */
export interface ComputationLog {
  /** Individual step records. Currently only Step 10 is logged. */
  steps: StepLog[];
  /** Number of pipeline restarts (e.g., from total renunciation causing scenario re-evaluation). */
  total_restarts: number;
  /** Final scenario code as a Debug-format string (e.g., "T1", "I2"). */
  final_scenario: string;
}

// Mirrors: ../inheritance-rust-forward/src/types.rs:568-573
/**
 * A single pipeline step's log entry.
 */
export interface StepLog {
  /** Step number (1-10). */
  step_number: number;
  /** Human-readable step name (e.g., "Finalize + Narrate"). */
  step_name: string;
  /** Description of what this step did. */
  description: string;
}

// Mirrors: ../inheritance-rust-forward/src/types.rs:575-580
/**
 * A warning or manual review flag generated by the pipeline.
 * These indicate situations requiring human review beyond the automated computation.
 */
export interface ManualFlag {
  /** Warning category identifier. Known categories:
   *  - "unknown_donee" (step4): donation recipient not found in heirs
   *  - "preterition" (step6): Art. 854 compulsory heir totally omitted
   *  - "disinheritance" (step6): invalid disinheritance detected
   *  - "inofficiousness" (step6): Arts. 908-912 dispositions exceed free portion
   *  - "max_restarts" (step9): pipeline restart guard hit
   *  - "vacancy_unresolved" (step9): vacant share could not be resolved
   */
  category: string;
  /** Human-readable description of the warning, often citing specific legal articles. */
  description: string;
  /** ID of the related heir, if the warning is heir-specific. */
  related_heir_id: string | null;
}

// Mirrors: ../inheritance-rust-forward/src/types.rs:142-149
export type EffectiveCategory =
  | "LegitimateChildGroup"
  | "IllegitimateChildGroup"
  | "SurvivingSpouseGroup"
  | "LegitimateAscendantGroup"
  | "CollateralGroup";

// Mirrors: ../inheritance-rust-forward/src/types.rs:151-155
export type InheritanceMode = "OwnRight" | "Representation";

// Mirrors: ../inheritance-rust-forward/src/types.rs:173-178
export type SuccessionType = "Testate" | "Intestate" | "Mixed" | "IntestateByPreterition";

// Mirrors: ../inheritance-rust-forward/src/types.rs:248-283
export type ScenarioCode =
  | "T1" | "T2" | "T3" | "T4" | "T5a" | "T5b" | "T6" | "T7" | "T8"
  | "T9" | "T10" | "T11" | "T12" | "T13" | "T14" | "T15"
  | "I1" | "I2" | "I3" | "I4" | "I5" | "I6" | "I7" | "I8"
  | "I9" | "I10" | "I11" | "I12" | "I13" | "I14" | "I15";
```

## Zod Validation Schemas

```typescript
import { z } from "zod";

// ── Money (reuse from money.md analysis) ──────────────────────────
// Constraint origin: types.rs:22-29, step10_finalize.rs:306-353
const MoneySchema = z.object({
  centavos: z.union([z.number().int(), z.string().regex(/^\d+$/)]),
});

// ── Enum Schemas ──────────────────────────────────────────────────

// Constraint origin: types.rs:142-149
const EffectiveCategorySchema = z.enum([
  "LegitimateChildGroup",
  "IllegitimateChildGroup",
  "SurvivingSpouseGroup",
  "LegitimateAscendantGroup",
  "CollateralGroup",
]);

// Constraint origin: types.rs:151-155
const InheritanceModeSchema = z.enum(["OwnRight", "Representation"]);

// Constraint origin: types.rs:173-178
const SuccessionTypeSchema = z.enum([
  "Testate",
  "Intestate",
  "Mixed",
  "IntestateByPreterition",
]);

// Constraint origin: types.rs:248-283
const ScenarioCodeSchema = z.enum([
  "T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
  "T9", "T10", "T11", "T12", "T13", "T14", "T15",
  "I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
  "I9", "I10", "I11", "I12", "I13", "I14", "I15",
]);

// ── StepLog Schema ────────────────────────────────────────────────

// Constraint origin: types.rs:568-573
const StepLogSchema = z.object({
  step_number: z.number().int().min(1).max(10),
  step_name: z.string().min(1),
  description: z.string(),
});

// ── ComputationLog Schema ─────────────────────────────────────────

// Constraint origin: types.rs:561-566
// total_restarts constraint: pipeline.rs:131 (restart_count: 0) and
//   pipeline.rs:251 (restart_count: 1) — max 1 restart in current impl,
//   but config.max_pipeline_restarts allows up to 100
const ComputationLogSchema = z.object({
  steps: z.array(StepLogSchema).min(1),
  total_restarts: z.number().int().min(0),
  final_scenario: z.string().min(1),
});

// ── ManualFlag Schema ─────────────────────────────────────────────

// Constraint origin: types.rs:575-580
// Known categories from pipeline source:
//   step4_estate_base.rs:97 — "unknown_donee"
//   step6_validation.rs:218 — "preterition"
//   step6_validation.rs:258 — "disinheritance"
//   step6_validation.rs:269 — "inofficiousness"
//   step9_vacancy.rs:196,344 — "max_restarts"
//   step9_vacancy.rs:415 — "vacancy_unresolved"
const ManualFlagSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  related_heir_id: z.string().nullable(),
});

// ── HeirNarrative Schema ──────────────────────────────────────────

// Constraint origin: types.rs:553-559, step10_finalize.rs:574-601
const HeirNarrativeSchema = z.object({
  heir_id: z.string().min(1),
  heir_name: z.string().min(1),
  heir_category_label: z.string().min(1),
  text: z.string().min(1),
});

// ── InheritanceShare Schema ───────────────────────────────────────

// Constraint origin: types.rs:535-551, step10_finalize.rs:492-571
const InheritanceShareSchema = z.object({
  heir_id: z.string().min(1),
  heir_name: z.string().min(1),
  heir_category: EffectiveCategorySchema,
  inherits_by: InheritanceModeSchema,
  represents: z.string().nullable(),
  from_legitime: MoneySchema,
  from_free_portion: MoneySchema,
  from_intestate: MoneySchema,
  total: MoneySchema,
  legitime_fraction: z.string(), // May be empty string (engine TODO)
  legal_basis: z.array(z.string()),
  donations_imputed: MoneySchema,
  gross_entitlement: MoneySchema,
  net_from_estate: MoneySchema,
}).refine(
  // Invariant: gross = net + donations (within 1 centavo rounding tolerance)
  // Origin: step10_finalize.rs:517-518
  (share) => {
    const gross = typeof share.gross_entitlement.centavos === "number"
      ? share.gross_entitlement.centavos
      : parseInt(share.gross_entitlement.centavos, 10);
    const net = typeof share.net_from_estate.centavos === "number"
      ? share.net_from_estate.centavos
      : parseInt(share.net_from_estate.centavos, 10);
    const don = typeof share.donations_imputed.centavos === "number"
      ? share.donations_imputed.centavos
      : parseInt(share.donations_imputed.centavos, 10);
    return Math.abs(gross - (net + don)) <= 1;
  },
  { message: "gross_entitlement must equal net_from_estate + donations_imputed (±1 centavo rounding)" }
);

// ── EngineOutput Schema ───────────────────────────────────────────

// Constraint origin: types.rs:525-533, step10_finalize.rs:615-623
export const EngineOutputSchema = z.object({
  per_heir_shares: z.array(InheritanceShareSchema).min(0),
  narratives: z.array(HeirNarrativeSchema),
  computation_log: ComputationLogSchema,
  warnings: z.array(ManualFlagSchema),
  succession_type: SuccessionTypeSchema,
  scenario_code: ScenarioCodeSchema,
}).refine(
  // Each heir with a share should have a narrative
  // Origin: step10_finalize.rs:576-601
  (output) => {
    const shareIds = new Set(output.per_heir_shares.map(s => s.heir_id));
    const narrativeIds = new Set(output.narratives.map(n => n.heir_id));
    return [...shareIds].every(id => narrativeIds.has(id));
  },
  { message: "Every heir in per_heir_shares must have a corresponding narrative" }
).refine(
  // Scenario code must be consistent with succession type
  // Origin: step3_scenario.rs — T* codes for testate/mixed, I* for intestate
  (output) => {
    const isTestate = output.scenario_code.startsWith("T");
    const isIntestateType = output.succession_type === "Intestate";
    // IntestateByPreterition uses the original T* scenario code but succession_type is overridden
    // Mixed uses T* scenario code
    if (isIntestateType && isTestate) return false;
    return true;
  },
  { message: "Scenario code prefix must be consistent with succession_type" }
);
```

## Output Construction Details

### How EngineOutput is Built (step10_finalize.rs:452-623)

The `step10_finalize()` function performs 4 main operations:

1. **Rounding (§12)**: Converts fractional shares (Frac) to Money using largest-remainder allocation (step10_finalize.rs:462-484)
   - Each heir's net share = gross distribution − imputed donations
   - Negative net shares are floored to zero (step10_finalize.rs:475-477)
   - `allocate_with_rounding()` floors each share to centavos, then distributes the remainder 1 centavo at a time (largest fractional part first)
   - **Post-condition**: `sum(all net_from_estate) == net_distributable_estate` (Invariant 1)

2. **InheritanceShare assembly** (step10_finalize.rs:493-572)
   - One entry per heir with a distribution from Step 7/9
   - Zero-share entries added for renounced, validly disinherited, or ineligible heirs (step10_finalize.rs:551-572)
   - `from_legitime`, `from_free_portion`, `from_intestate` are **always Money(0)** — marked as TODO in the engine (step10_finalize.rs:538-540)
   - `legitime_fraction` is **always empty string** — also TODO (step10_finalize.rs:542)
   - `total` = `gross_entitlement` (same value) = `net_from_estate` + `donations_imputed`

3. **Narrative generation (§11)** (step10_finalize.rs:574-601)
   - One narrative per share entry
   - Sections: Header → SuccessionType → Category → [Representation if applicable]
   - Text contains Markdown bold markers (`**name (category)**`)
   - Non-heir beneficiaries (strangers) get a simplified "beneficiary" narrative

4. **Warnings**: Currently hardcoded to `vec![]` at the EngineOutput level (step10_finalize.rs:619). Individual step warnings exist in Step4/Step5/Step6/Step7/Step8/Step9 outputs but are **NOT propagated** to the final EngineOutput. This is a known gap — the frontend should still render the `warnings` array for forward compatibility.

### Warning Categories from Pipeline Steps

Although not yet propagated to EngineOutput, these warnings are generated internally:

| Category | Source | Trigger |
|----------|--------|---------|
| `unknown_donee` | step4_estate_base.rs:97 | Donation recipient_heir_id not found in classified heirs |
| `preterition` | step6_validation.rs:218 | Art. 854: compulsory heir totally omitted from will |
| `disinheritance` | step6_validation.rs:258 | Disinheritance failed validity checks (Arts. 915-922) |
| `inofficiousness` | step6_validation.rs:269 | Arts. 908-912: testamentary dispositions exceed free portion |
| `max_restarts` | step9_vacancy.rs:196,344 | Pipeline restart guard hit (config.max_pipeline_restarts) |
| `vacancy_unresolved` | step9_vacancy.rs:415 | Vacant share could not be resolved by substitution/accretion |

### ComputationLog Current Implementation

Currently minimal (step10_finalize.rs:604-613):
- Only 1 StepLog entry (Step 10)
- `total_restarts`: 0 or 1 (current pipeline max)
- `final_scenario`: Rust Debug format of ScenarioCode (e.g., `"T1"`, `"I2"`)

## Serialization Notes

### All Output Types Use Standard serde

No custom serialization — all output types derive `Serialize, Deserialize` with default behavior:
- Enums: PascalCase strings (e.g., `"LegitimateChildGroup"`, `"OwnRight"`, `"Testate"`, `"T1"`)
- Money: Custom serialization (centavos as number or string) — see money.md
- Optional fields: `null` when None
- Arrays: standard JSON arrays (can be empty `[]`)

### ScenarioCode Serialization

ScenarioCode variants serialize as their exact Rust variant names:
```json
"T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
"T9", "T10", "T11", "T12", "T13", "T14", "T15",
"I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
"I9", "I10", "I11", "I12", "I13", "I14", "I15"
```

Note: `T5a` and `T5b` use lowercase letter suffix. All others are uppercase letter + number.

### ComputationLog.final_scenario vs EngineOutput.scenario_code

- `computation_log.final_scenario`: Rust `format!("{:?}", scenario_code)` — produces `"T1"` etc.
- `scenario_code`: Standard serde — also produces `"T1"` etc.
- These will always match in value (both derived from `input.scenario_code`), but `final_scenario` is a raw String while `scenario_code` is a typed enum.

## Field Metadata for Results View

### EngineOutput — Top-Level Results

| Field | Display Type | Notes |
|-------|-------------|-------|
| `succession_type` | Badge/chip | Color-coded: Intestate=blue, Testate=green, Mixed=amber, IntestateByPreterition=red |
| `scenario_code` | Badge | Display as-is (e.g., "T1", "I2"); link to scenario description |
| `per_heir_shares` | Table/cards | Primary results display — one row/card per heir |
| `narratives` | Expandable text | Per-heir narrative paragraphs; render Markdown |
| `computation_log` | Collapsible section | Advanced/debug info |
| `warnings` | Alert banners | Show prominently if non-empty; color by severity |

### InheritanceShare — Per-Heir Results Row

| Field | Display Type | Format | Priority |
|-------|-------------|--------|----------|
| `heir_name` | Text | As-is | Primary |
| `heir_category` | Badge | Map to label (see below) | Primary |
| `net_from_estate` | Money | ₱ format with commas | **Primary display value** |
| `total` | Money | ₱ format | Secondary (show when donations_imputed > 0) |
| `donations_imputed` | Money | ₱ format | Secondary (show when > 0) |
| `gross_entitlement` | Money | ₱ format | Secondary (show when donations_imputed > 0) |
| `inherits_by` | Badge | "Own Right" / "By Representation" | Conditional (show only for Representation) |
| `represents` | Text | "representing {heir_name}" | Conditional (show only when non-null) |
| `legal_basis` | Tag list | Clickable article references | Detail view |
| `from_legitime` | Money | ₱ format | Detail (when engine populates) |
| `from_free_portion` | Money | ₱ format | Detail (when engine populates) |
| `from_intestate` | Money | ₱ format | Detail (when engine populates) |
| `legitime_fraction` | Text | As-is (e.g., "½") | Detail (when engine populates) |

### EffectiveCategory Display Labels

```typescript
// Mirrors: step10_finalize.rs:141-166 — category_label()
export const EFFECTIVE_CATEGORY_LABELS: Record<EffectiveCategory, string> = {
  LegitimateChildGroup: "Legitimate Child",
  IllegitimateChildGroup: "Illegitimate Child",
  SurvivingSpouseGroup: "Surviving Spouse",
  LegitimateAscendantGroup: "Legitimate Ascendant",
  CollateralGroup: "Collateral Relative",
};

// Finer-grained labels come from heir_category_label in HeirNarrative
// (e.g., "adopted child", "grandchild, by representation", "sibling", "nephew/niece")
```

### SuccessionType Display Labels

```typescript
export const SUCCESSION_TYPE_LABELS: Record<SuccessionType, string> = {
  Testate: "Testate Succession",
  Intestate: "Intestate Succession",
  Mixed: "Mixed Succession",
  IntestateByPreterition: "Intestate (Preterition)",
};

export const SUCCESSION_TYPE_DESCRIPTIONS: Record<SuccessionType, string> = {
  Testate: "The decedent left a valid will that disposes of the entire estate.",
  Intestate: "The decedent died without a will. Distribution follows the Civil Code rules.",
  Mixed: "The decedent left a will that does not dispose of the entire estate. Undisposed portion distributed intestate.",
  IntestateByPreterition: "Art. 854: A compulsory heir was totally omitted from the will, annulling all institutions.",
};
```

### ManualFlag Severity Mapping

```typescript
// Constraint origin: derived from pipeline behavior
export const WARNING_SEVERITY: Record<string, "error" | "warning" | "info"> = {
  preterition: "error",          // Annuls all institutions
  inofficiousness: "warning",    // Dispositions reduced but not annulled
  disinheritance: "warning",     // Invalid disinheritance — heir gets share anyway
  max_restarts: "error",         // Pipeline could not converge
  vacancy_unresolved: "warning", // Manual intervention needed
  unknown_donee: "info",         // Informational — donation excluded from collation
};
```

### ScenarioCode Descriptions (for Results View)

```typescript
export const SCENARIO_DESCRIPTIONS: Record<ScenarioCode, string> = {
  // Testate scenarios
  T1: "LC + Spouse + IC (with will)",
  T2: "LC + Spouse (with will)",
  T3: "LC + IC (with will)",
  T4: "LC only (with will)",
  T5a: "IC + Spouse (with will, 1 IC)",
  T5b: "IC + Spouse (with will, 2+ IC)",
  T6: "IC only (with will)",
  T7: "Spouse + Ascendants (with will)",
  T8: "Spouse + Parents (with will)",
  T9: "Spouse only (with will)",
  T10: "Ascendants only (with will)",
  T11: "Parents + IC (with will)",
  T12: "Spouse + LC + Articulo Mortis (with will)",
  T13: "Spouse + Ascendants + Articulo Mortis (with will)",
  T14: "Illegitimate decedent scenarios (with will)",
  T15: "No compulsory heirs (with will)",
  // Intestate scenarios
  I1: "LC only (intestate)",
  I2: "LC + Spouse (intestate)",
  I3: "LC + IC (intestate)",
  I4: "LC + Spouse + IC (intestate)",
  I5: "IC only (intestate)",
  I6: "IC + Spouse (intestate)",
  I7: "Ascendants only (intestate)",
  I8: "Ascendants + Spouse (intestate)",
  I9: "Spouse only (intestate)",
  I10: "Spouse + Collaterals (intestate)",
  I11: "Spouse + Siblings (intestate)",
  I12: "Siblings only (intestate)",
  I13: "Nephews/Nieces only (intestate)",
  I14: "Other Collaterals (intestate)",
  I15: "No heirs — Escheat to State (intestate)",
};
```

## Test Coverage & Invariants

### Integration Test Invariants (tests/integration.rs)

The integration tests verify these invariants against the EngineOutput:

1. **Sum invariant** (integration.rs:436-447): `sum(per_heir_shares[*].net_from_estate) == net_distributable_estate`
2. **Adoption equality** (integration.rs:450-467): Adopted children get the same share as legitimate children (same EffectiveCategory)
3. **Scenario consistency** (integration.rs:470-478): `output.scenario_code == expected`

### Test Vector Coverage

23 test vectors exercise the output shape:
- Each test calls `run_pipeline()` → `EngineOutput`
- Tests assert `succession_type`, `scenario_code`, individual heir shares (total, net_from_estate), and sum invariant
- Tests do NOT assert on `narratives`, `computation_log`, or `warnings` (these are informational)
- Tests do NOT assert on `from_legitime`/`from_free_portion`/`from_intestate` (engine TODO)

### Example Output Shape (derived from TV-01: Single LC, ₱5M estate)

```json
{
  "per_heir_shares": [
    {
      "heir_id": "lc1",
      "heir_name": "Maria Cruz",
      "heir_category": "LegitimateChildGroup",
      "inherits_by": "OwnRight",
      "represents": null,
      "from_legitime": {"centavos": 0},
      "from_free_portion": {"centavos": 0},
      "from_intestate": {"centavos": 0},
      "total": {"centavos": 500000000},
      "legitime_fraction": "",
      "legal_basis": ["Art. 888", "Art. 996"],
      "donations_imputed": {"centavos": 0},
      "gross_entitlement": {"centavos": 500000000},
      "net_from_estate": {"centavos": 500000000}
    }
  ],
  "narratives": [
    {
      "heir_id": "lc1",
      "heir_name": "Maria Cruz",
      "heir_category_label": "legitimate child",
      "text": "**Maria Cruz (legitimate child)** receives **₱5,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887 of the Civil Code), Maria Cruz is a compulsory heir."
    }
  ],
  "computation_log": {
    "steps": [
      {
        "step_number": 10,
        "step_name": "Finalize + Narrate",
        "description": "Converted fractional shares to peso amounts and generated narratives"
      }
    ],
    "total_restarts": 0,
    "final_scenario": "I1"
  },
  "warnings": [],
  "succession_type": "Intestate",
  "scenario_code": "I1"
}
```

## Edge Cases

1. **Zero-share heirs**: Renounced, validly disinherited, or ineligible heirs appear in `per_heir_shares` with all Money fields = 0. They still get narrative entries (step10_finalize.rs:551-572).

2. **Stranger beneficiaries**: Non-heir testamentary beneficiaries (person_id=null) get InheritanceShare entries but their heir lookup returns None. They receive a simplified "beneficiary" narrative (step10_finalize.rs:587-600).

3. **Collation (donations_imputed > 0)**: When a heir received advance donations, `net_from_estate` < `total`. The narrative header changes to show "receives {net} from the estate (plus {donations} previously received as a donation, for a total of {gross})" (step10_finalize.rs:367-375).

4. **Rounding remainder**: The largest-remainder method (Hare-Niemeyer) distributes at most `n-1` extra centavos across `n` heirs. The sum invariant always holds exactly (step10_finalize.rs:306-353).

5. **Pipeline restart (total renunciation)**: When all heirs of a degree renounce, the pipeline re-runs with updated heirs. `computation_log.total_restarts` will be 1. Current implementation supports max 1 restart (pipeline.rs:160-257).

6. **Empty warnings array**: Current engine ALWAYS returns `warnings: []` at the EngineOutput level (step10_finalize.rs:619). The frontend should still render warnings for forward compatibility when the engine begins propagating step-level warnings.

7. **from_legitime/from_free_portion/from_intestate = 0**: These sub-component fields are always zero in the current engine (marked TODO). The frontend should show `total`/`net_from_estate` as primary values and conditionally show sub-components when they become non-zero.

8. **legitime_fraction = ""**: Always empty string in current engine. The frontend should conditionally display this field only when non-empty.

9. **IntestateByPreterition**: A special succession type where the engine detects preterition (Art. 854), annuls all institutions, and falls back to intestate distribution. The scenario_code remains the original testate code (T*), but succession_type is overridden.

10. **Narrative Markdown**: The `text` field contains Markdown bold markers (`**...**`). The frontend must render this as rich text, not raw strings. The format_peso helper produces `₱` prefix with comma thousands grouping and conditional centavos (step10_finalize.rs:217-226).

## Rust→TS Mapping Notes

- **Money fields**: All 7 Money fields in InheritanceShare use the same `{centavos: number|string}` wire format. Frontend displays pesos (÷100) with `₱` prefix.
- **Enum PascalCase**: All enum values serialize as PascalCase strings matching Rust variant names exactly.
- **ScenarioCode edge**: `T5a` and `T5b` have lowercase letter suffixes — unique among all scenario codes.
- **legal_basis strings**: Free-form strings like `"Art. 888"`, `"Art. 996/999"`, `"Art. 970"`. No standardized format — frontend should display as-is.
- **computation_log.final_scenario**: This is a raw string from `format!("{:?}", scenario_code)`, NOT the serde serialization. In practice both produce the same value (e.g., `"T1"`), but the types differ (String vs ScenarioCode enum).
- **HeirNarrative.heir_category_label**: This is a computed label from `category_label()` (step10_finalize.rs:141-166), NOT a raw EffectiveCategory string. Examples: `"legitimate child"`, `"adopted child"`, `"grandchild, by representation"`, `"surviving spouse"`, `"legitimate parent"`, `"sibling"`, `"nephew/niece"`, `"collateral relative"`, `"beneficiary"` (for strangers).
