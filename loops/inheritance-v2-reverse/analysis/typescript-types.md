# TypeScript Types — Philippine Inheritance Engine v2

**Aspect**: typescript-types
**Wave**: 5a (Frontend Data Model)
**Depends On**: rust-types, serde-wire-format, wasm-export

---

## Overview

Every Rust struct and enum from the v2 engine maps to a TypeScript interface or string-literal
union. The authoritative mapping rules:

| Rust | TypeScript |
|------|-----------|
| `struct` | `interface` |
| `enum` (plain) | `type` = string literal union |
| `enum` (tagged) | discriminated union |
| `i64` / `u32` | `number` |
| `bool` | `boolean` |
| `String` | `string` |
| `Option<T>` | `T \| null` (never `undefined`) |
| `Vec<T>` | `T[]` |
| `"numer/denom"` fraction | `string` (see `FractionString`) |
| ISO-8601 date `String` | `string` (see `DateString`) |
| `HeirId` / `DonationId` etc | `string` |

**Wire format authority**: The serde attributes `#[serde(rename_all = "snake_case")]` (structs)
and `#[serde(rename_all = "PascalCase")]` (enums) are canonical. TypeScript interface field
names match the JSON keys exactly (snake_case). Enum literal values match the JSON strings
exactly (PascalCase).

**Money**: On input, `centavos` accepts `number | string`. On output, `centavos` is always
`number`. TypeScript types reflect both sides explicitly.

**Null vs absent**: Every `Option<T>` field is ALWAYS present in JSON as `null` (never
omitted). TypeScript types model this as `T | null`, never `T | undefined`. At the Zod
layer, `z.nullable()` is used (not `z.optional()`).

---

## §1. Type Aliases

```typescript
// Stable identifier types — all are opaque strings assigned by the frontend
export type HeirId = string;
export type DonationId = string;
export type DispositionId = string;
export type DeviseId = string;
export type LegacyId = string;
export type ConditionId = string;

// Semantic string aliases for documentation clarity
/** ISO-8601 date string: "YYYY-MM-DD" */
export type DateString = string;

/** Rational fraction string: "numer/denom" reduced to lowest terms */
export type FractionString = string;
```

---

## §2. Input Enums (plain string unions)

All serialize as PascalCase strings on the wire.

### 2.1 HeirType

```typescript
/**
 * Legal classification of an heir under Philippine civil law.
 * Drives EffectiveGroup assignment.
 *
 * Wire format: PascalCase variant names.
 */
export type HeirType =
  | "LegitimateChild"      // FC Art. 164 — born/conceived in valid marriage
  | "LegitimatedChild"     // FC Arts. 177–179 — legitimated by subsequent marriage
  | "AdoptedChild"         // RA 8552 / RA 11642 — adoption not rescinded
  | "IllegitimateChild"    // FC Arts. 165, 175 — filiation proved
  | "LegitimateAscendant"  // Art. 887(2) — legitimate parents/grandparents/higher
  | "Spouse"               // Widow/widower (legally married, not validly separated)
  | "Sibling"              // Arts. 1003–1007 — full or half blood
  | "NieceNephew"          // Art. 972 — intestate, representation eligible
  | "OtherCollateral";     // Arts. 1009–1010 — within 5th degree

export const HEIR_TYPES: readonly HeirType[] = [
  "LegitimateChild", "LegitimatedChild", "AdoptedChild", "IllegitimateChild",
  "LegitimateAscendant", "Spouse", "Sibling", "NieceNephew", "OtherCollateral",
];
```

### 2.2 LegalSeparationStatus

```typescript
/**
 * Legal separation status — applies to Spouse heirs only.
 */
export type LegalSeparationStatus =
  | "NotApplicable"   // No legal separation, or not a Spouse
  | "InnocentSpouse"  // Art. 892 — retains inheritance rights
  | "GuiltySpouse";   // Art. 1002 — excluded from succession

export const LEGAL_SEPARATION_STATUSES: readonly LegalSeparationStatus[] = [
  "NotApplicable", "InnocentSpouse", "GuiltySpouse",
];
```

### 2.3 DisinheritanceGround (22 grounds)

```typescript
/**
 * Enumerated disinheritance grounds from Arts. 919–921.
 * Wire format: "Art{article}_{paragraph}" (e.g., "Art919_1").
 *
 * NOTE: The Rust enum variant names may differ (e.g., Art919AttemptOnLife) — the
 * serde-wire-format analysis §4.2 is authoritative for JSON keys. In v2 the Rust
 * variants MUST be named Art919_1..Art921_6 (or use explicit #[serde(rename)]) so that
 * the JSON wire value matches "Art919_1" through "Art921_6".
 */
export type DisinheritanceGround =
  // Art. 919 — grounds against children/descendants (8 grounds)
  | "Art919_1"  // Attempt on life of testator/spouse/descendants/ascendants
  | "Art919_2"  // Groundless accusation of crime carrying 6+ year sentence
  | "Art919_3"  // Conviction of adultery/concubinage with testator's spouse
  | "Art919_4"  // Fraud, violence, intimidation, or undue influence on will-making
  | "Art919_5"  // Refusal to support parent/ascendant without justifiable cause
  | "Art919_6"  // Maltreatment by word or deed
  | "Art919_7"  // Leading a dishonorable or disgraceful life
  | "Art919_8"  // Conviction for crime carrying civil interdiction
  // Art. 920 — grounds against parents/ascendants (8 grounds)
  | "Art920_1"  // Abandonment of children; inducing daughters to immoral life
  | "Art920_2"  // Conviction of attempt on testator's/spouse's/descendants'/ascendants' life
  | "Art920_3"  // Groundless accusation of crime carrying 6+ year sentence
  | "Art920_4"  // Conviction of adultery/concubinage with testator's spouse
  | "Art920_5"  // Fraud, violence, intimidation, undue influence on will-making
  | "Art920_6"  // Loss of parental authority under FC Art. 228–232
  | "Art920_7"  // Refusal to support children/descendants without justifiable cause
  | "Art920_8"  // Attempt by one parent against the other parent's life
  // Art. 921 — grounds against surviving spouse (6 grounds)
  | "Art921_1"  // Conviction of attempt on testator's/descendants'/ascendants' life
  | "Art921_2"  // Groundless accusation of crime carrying 6+ year sentence
  | "Art921_3"  // Fraud, violence, intimidation, undue influence on will-making
  | "Art921_4"  // Spouse gave cause for legal separation (FC Art. 55)
  | "Art921_5"  // Spouse gave grounds for loss of parental authority
  | "Art921_6"; // Unjustifiable refusal to support children or the other spouse

export const DISINHERITANCE_GROUNDS: readonly DisinheritanceGround[] = [
  "Art919_1", "Art919_2", "Art919_3", "Art919_4", "Art919_5", "Art919_6", "Art919_7", "Art919_8",
  "Art920_1", "Art920_2", "Art920_3", "Art920_4", "Art920_5", "Art920_6", "Art920_7", "Art920_8",
  "Art921_1", "Art921_2", "Art921_3", "Art921_4", "Art921_5", "Art921_6",
];
```

### 2.4 SubstitutionType

```typescript
export type SubstitutionType =
  | "Simple"            // Art. 857: A inherits in default of B
  | "Fideicommissary"   // Art. 863: A holds title, transmits to B at death/condition
  | "Reciprocal";       // Arts. 860–861: A and B each substitute for the other

export const SUBSTITUTION_TYPES: readonly SubstitutionType[] = [
  "Simple", "Fideicommissary", "Reciprocal",
];
```

---

## §3. Output / Computed Enums

### 3.1 SuccessionType

```typescript
export type SuccessionType =
  | "Testate"    // Entirely governed by a valid will
  | "Intestate"  // No will; entirely by operation of law (Art. 960)
  | "Mixed";     // Will disposes of only part of the estate (Arts. 778, 780)
```

### 3.2 ScenarioCode (30 variants)

```typescript
/**
 * The 30-scenario classification driving all legitime and distribution computations.
 * T1–T15 = testate; I1–I15 = intestate.
 */
export type ScenarioCode =
  | "T1"  | "T2"  | "T3"  | "T4"  | "T5"
  | "T6"  | "T7"  | "T8"  | "T9"  | "T10"
  | "T11" | "T12" | "T13" | "T14" | "T15"
  | "I1"  | "I2"  | "I3"  | "I4"  | "I5"
  | "I6"  | "I7"  | "I8"  | "I9"  | "I10"
  | "I11" | "I12" | "I13" | "I14" | "I15";

export const SCENARIO_CODES: readonly ScenarioCode[] = [
  "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10",
  "T11", "T12", "T13", "T14", "T15",
  "I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8", "I9", "I10",
  "I11", "I12", "I13", "I14", "I15",
];

/**
 * NOTE: v1 used "T5a"/"T5b" for the split legitimate+illegitimate scenario.
 * v2 unifies these as "T5" (cap rule handles the sub-cases internally).
 */
```

### 3.3 EffectiveGroup

```typescript
/**
 * Computed heir group for distribution purposes.
 * Serializes as PascalCase variant name.
 *
 * NOTE: serde-wire-format §5.2 documentation uses shorthand "G1"–"G4" but the
 * actual JSON values are the full PascalCase names below.
 */
export type EffectiveGroup =
  | "LegitimateChildGroup"     // G1: LC, LegitimatedChild, AdoptedChild
  | "LegitimateAscendantGroup" // G2: Parents/grandparents (only when G1 absent)
  | "SurvivingSpouseGroup"     // G3: Surviving spouse
  | "IllegitimateChildGroup"   // G4: Illegitimate children
  | "CollateralGroup";         // Intestate: siblings, nephews/nieces, other collateral
```

### 3.4 ExclusionReason

```typescript
/**
 * Why an heir was excluded from the eligible set.
 * Serializes as PascalCase variant name.
 *
 * NOTE: serde-wire-format §4.7 uses simplified names ("Predeceased", "Incapacity",
 * "IronCurtain", "NotCalled"). Rust-types §5.3 uses more granular names. The values
 * below follow the rust-types as the implementation source of truth.
 * Reconcile with serde-wire-format in the cross-layer-consistency aspect.
 */
export type ExclusionReason =
  | "PredeceaseNoRepresentation"  // Predeceased, no eligible representatives
  | "Unworthiness"                // Art. 1032, not condoned by testator
  | "FiliationNotProved"          // Art. 887 ¶3: IC filiation not proved
  | "GuiltySpouseLegalSeparation" // Art. 1002: guilty party in legal separation
  | "AdoptionRescinded"           // RA 8552 §20: rescinded before death
  | "ValidDisinheritance"         // Arts. 915–923: valid enumerated ground
  | "Renounced"                   // Art. 1041: heir renounced
  | "ExcludedByGroup";            // Art. 887(2): G2 excluded because G1 present
```

### 3.5 RepresentationTrigger

```typescript
/**
 * The cause that activated representation for a given heir slot.
 *
 * NOTE: serde-wire-format §4.8 uses "Art902IllegitimateLine" but rust-types §5.4
 * uses "IllegitimateTransmission". v2 Rust code should use "IllegitimateTransmission"
 * with PascalCase rename → "IllegitimateTransmission" on wire (not "Art902IllegitimateLine").
 * Flag for reconciliation in cross-layer-consistency.
 */
export type RepresentationTrigger =
  | "Predecease"                  // Arts. 970–971: heir predeceased
  | "Disinheritance"              // Art. 923: validly disinherited
  | "Unworthiness"                // Art. 1035: unworthy/incapacitated
  | "IllegitimateTransmission";   // Art. 902: illegitimate child's descendants in intestate
```

### 3.6 VacancyCause

```typescript
/**
 * What caused a share to become vacant after initial distribution.
 *
 * NOTE: Rust-types §5.5 is more granular than serde-wire-format §4.9.
 * Using rust-types as authoritative.
 */
export type VacancyCause =
  | "Predecease"
  | "Renunciation"
  | "Unworthiness"
  | "Disinheritance"
  | "SubstitutePredeceased"
  | "SubstituteIncapacitated";
```

### 3.7 ShareSource

```typescript
export type ShareSource =
  | "Legitime"    // Art. 1021 ¶2: triggers recompute on vacancy
  | "FreePortion" // Art. 1021 ¶1: true accretion, pro indiviso
  | "Intestate"   // Art. 1018: always accretes to co-heirs
  | "Devise"      // Specific real property bequest
  | "Legacy";     // Sum of money or personal property
```

### 3.8 ResolutionMethod

```typescript
/**
 * How a vacant share was resolved.
 *
 * NOTE: Rust-types §5.7 is more granular than serde-wire-format §4.10.
 * Using rust-types as authoritative.
 */
export type ResolutionMethod =
  | "Substitution"          // Art. 859/1022(1): named substitute inherits
  | "Representation"        // Arts. 970–977: representatives per stirpes
  | "AccretionFreePortion"  // Arts. 1016–1019, 1021 ¶1: pro indiviso FP
  | "AccretionIntestate"    // Art. 1018: intestate share accretes
  | "OwnRightLegitime"      // Art. 1021 ¶2: co-heirs succeed in own right → recompute
  | "IntestateFallback"     // Art. 1022(2): falls to legal/intestate heirs
  | "NextDegreeInOwnRight"  // Art. 969: all heirs renounce → next degree
  | "Escheat";              // Art. 1011: no heirs → State
```

---

## §4. Tagged Union Types (Discriminated Unions)

### 4.1 PreteritionEffect

```typescript
/**
 * Preterition effect — internally tagged with "type" key.
 * Rust: #[serde(tag = "type")] #[serde(rename_all = "PascalCase")]
 */
export type PreteritionEffect =
  | { type: "None" }
  | { type: "InstitutionAnnulled"; preterited_heir_ids: HeirId[] };
```

### 4.2 ValidationWarning

```typescript
/**
 * Validation warning — tagged with "code" key, data in "data" key.
 * Rust: #[serde(tag = "code", content = "data")] #[serde(rename_all = "PascalCase")]
 */
export type ValidationWarning =
  | { code: "PreteritionDetected";     data: { preterited_heir_ids: HeirId[] } }
  | { code: "InvalidDisinheritance";   data: { heir_ids: HeirId[] } }
  | { code: "ConditionStripped";       data: { disposition_ids: DispositionId[] } }
  | { code: "Underprovision";          data: { heir_id: HeirId; deficiency_centavos: number } }
  | { code: "InoficiousnessReduced";   data: { total_reduced_centavos: number } }
  | { code: "ReconciliationVoided";    data: { heir_ids: HeirId[] } }
  | { code: "PosthumousHeirPossible";  data: Record<string, never> }
  | { code: "AnnuityChoiceRequired";   data: { devise_ids: DeviseId[] } }
  | { code: "IndivisibleRealty";       data: { devise_ids: DeviseId[] } }
  | { code: "MultipleDisinheritances"; data: { count: number } };
```

### 4.3 ManualReviewFlag

```typescript
/**
 * Manual review flag — tagged with "flag" key, additional data as inline fields.
 * Rust: #[serde(tag = "flag")] #[serde(rename_all = "PascalCase")]
 */
export type ManualReviewFlag =
  | { flag: "AllDescendantsDisinherited";          heir_ids: HeirId[] }
  | { flag: "DisinheritedWithSubstituteAndReps";   heir_id: HeirId }
  | { flag: "PosthumousChildPossible" }
  | { flag: "UsufructElectionRequired";            devise_id: DeviseId }
  | { flag: "IndivisibleRealtyPartition";          devise_id: DeviseId }
  | { flag: "ReconciliationPreWill";               heir_id: HeirId }
  | { flag: "LegitimationContested";               heir_id: HeirId };
```

### 4.4 ComputationError

```typescript
/**
 * Computation error — tagged with "error_type" key.
 * Rust: #[serde(tag = "error_type")] #[serde(rename_all = "PascalCase")]
 * Returned as the Err(String) side of compute_json.
 */
export type ComputationError =
  | { error_type: "InputValidation";     message: string; field_path: string | null }
  | { error_type: "DomainValidation";    message: string; related_heir_ids: HeirId[] }
  | { error_type: "MaxRestartsExceeded"; restart_count: number; last_step: string }
  | { error_type: "ArithmeticError";     message: string }
  | { error_type: "PanicRecovered";      message: string };
```

---

## §5. Money Type

```typescript
/**
 * Money type — centavos as i64.
 * INPUT: accepts number | string (BigInt support for large estates).
 * OUTPUT: always number.
 * Use the InputMoney / OutputMoney distinction at boundaries.
 */
export interface InputMoney {
  centavos: number | string;
}

export interface OutputMoney {
  centavos: number;
}

/** Convenience alias used in most input interfaces */
export type Money = InputMoney;
```

---

## §6. Input Interfaces

### 6.1 ComputationInput

```typescript
/**
 * Root input to the computation engine.
 * All Option<T> fields are T | null (never absent from JSON).
 */
export interface ComputationInput {
  decedent: DecedentInput;
  estate: EstateInput;
  heirs: HeirInput[];
  /** null for intestate succession */
  will: WillInput | null;
  /** null or [] if no inter vivos donations */
  donations: DonationInput[] | null;
}
```

### 6.2 DecedentInput

```typescript
/**
 * Information about the deceased person.
 *
 * NOTE: rust-types §4.2 and serde-wire-format §3.2 partially disagree on fields.
 * This definition merges both, as both sets of fields are needed for computation.
 * See §12 Discrepancy Log.
 */
export interface DecedentInput {
  /** Display name */
  name: string;
  /** ISO-8601 "YYYY-MM-DD"; null if unknown */
  date_of_death: DateString | null;
  /** True if decedent executed a valid will (drives SuccessionType determination) */
  has_will: boolean;
  /** Derived hint: engine also checks heirs array */
  has_legitimate_children: boolean;
  /** Derived hint */
  has_illegitimate_children: boolean;
  /** Applies to decedent's own legal separation from spouse heir */
  legal_separation_status: LegalSeparationStatus;
  /** True if decedent was themselves an illegitimate child (triggers Art. 903 T14/T15) */
  is_illegitimate: boolean;
  /** True if marriage solemnized in articulo mortis (Art. 900 ¶2 check) */
  articulo_mortis: boolean;
  /**
   * Years decedent and spouse cohabited before marriage.
   * Only relevant when articulo_mortis = true.
   * If articulo_mortis = true AND cohabitation_years >= 5 → Art. 900 ¶2 exception does NOT apply.
   */
  cohabitation_years: number;
  /** Free text; optional */
  domicile: string | null;
  /** Free text; optional */
  nationality: string | null;
}
```

### 6.3 EstateInput

```typescript
export interface EstateInput {
  /** Net estate in centavos after deducting funeral expenses, debts, obligations */
  net_estate: InputMoney;
  /**
   * Gross estate before deductions — optional; used for collation base if provided.
   * If null, engine uses net_estate as the collation base.
   */
  gross_estate: InputMoney | null;
  /** Obligations/debts deducted from gross — for audit trail only */
  obligations: InputMoney | null;
  /** Optional narrative label */
  description: string | null;
}
```

### 6.4 HeirInput

```typescript
/**
 * A single heir or potential heir.
 * Merges rust-types §4.4 and serde-wire-format §3.4.
 * See §12 Discrepancy Log for field-level notes.
 */
export interface HeirInput {
  /** Unique stable identifier within this computation (assigned by frontend) */
  id: HeirId;
  /** Display name */
  name: string;
  /** Legal classification */
  heir_type: HeirType;

  // ── Eligibility Gate Flags ─────────────────────────────────────────────────
  /** True if heir is alive at succession */
  is_alive: boolean;
  /** For AdoptedChild: true if RA 8552 adoption was rescinded before decedent's death */
  is_adopted: boolean;
  /** For AdoptedChild: true if adoption was rescinded */
  adoption_rescinded: boolean;
  /** ISO-8601 date of adoption; null if not adopted */
  adoption_date: DateString | null;
  /** ISO-8601 date of rescission; null if not rescinded */
  adoption_rescission_date: DateString | null;
  /** True if cause of disinheritance/unworthiness is considered proven */
  cause_proven: boolean;
  /** True if testator reconciled with this heir after disinheritance (Art. 922) */
  reconciled: boolean;
  /** True if filiation is legally proved (FC Arts. 172, 175) */
  filiation_proved: boolean;
  /** True if heir validly renounced (Art. 1041) — blocks representation (Art. 977) */
  has_renounced: boolean;
  /** True if Art. 1032 unworthiness applies */
  is_unworthy: boolean;
  /** True if testator condoned unworthiness (Art. 1033) — heir remains eligible */
  unworthiness_condoned: boolean;

  // ── Classification Metadata ────────────────────────────────────────────────
  /** True if this heir was legitimated by subsequent marriage (FC Arts. 177–179) */
  is_legitimated: boolean;
  /** For LegitimateAscendant: true = paternal line */
  paternal_line: boolean;
  /** For collateral heirs: degree of kinship (2 = sibling, 3 = nephew/niece; max 5) */
  degree: number | null;
  /** For Sibling: true = full blood (same father AND mother) */
  is_full_blood: boolean;
  /** For adopter-is-spouse-of-bio-parent cases (RA 8552 §16) */
  biological_parent_is_adopter_spouse: boolean;

  // ── Date Fields ───────────────────────────────────────────────────────────
  /** ISO-8601 date of birth; null if unknown */
  date_of_birth: DateString | null;
  /** ISO-8601 date of death (if predeceased); null if alive */
  date_of_death: DateString | null;

  // ── Disposition Records ──────────────────────────────────────────────────
  /** Disinheritances targeting this heir — from the will */
  disinheritances: DisinheritanceRecord[];
  /** Testamentary substitutions where this heir is the primary */
  substitutions: SubstitutionInput[];

  // ── Family Tree (for representation) ─────────────────────────────────────
  /**
   * Children of this heir registered in the heirs array.
   * Used to build representation chains (including cascading disinheritance BUG-001 fix).
   */
  children: HeirInput[];

  // ── Collation Linkage ────────────────────────────────────────────────────
  /** IDs of DonationInput records received by this heir */
  donations_received: DonationId[];

  // ── Legal Separation ────────────────────────────────────────────────────
  /** For Spouse only */
  legal_separation_status: LegalSeparationStatus;
}
```

### 6.5 DisinheritanceRecord

```typescript
export interface DisinheritanceRecord {
  /** Unique identifier */
  id: string;
  /** References HeirInput.id */
  heir_id: HeirId;
  /** One of the 22 enumerated grounds */
  ground: DisinheritanceGround;
  /** User-attested: true if cause is considered proven */
  cause_proven: boolean;
  /** Art. 922: true if testator reconciled → disinheritance void */
  reconciled: boolean;
  /** Optional free text note */
  note: string | null;
}
```

### 6.6 WillInput

```typescript
export interface WillInput {
  id: string;
  /** ISO-8601 date will was executed; null if unknown */
  date_executed: DateString | null;
  institutions: InstitutionInput[];
  devises: DeviseInput[];
  legacies: LegacyInput[];
  substitutions: SubstitutionInput[];
}
```

### 6.7 InstitutionInput

```typescript
/**
 * General share of the estate instituted to an heir ("I leave ¼ of my estate to Juan").
 * Exactly one of fraction or amount_centavos must be non-null; if both are set, fraction takes
 * precedence. If both are null, the institution is invalid (InputValidation error).
 */
export interface InstitutionInput {
  id: DispositionId;
  /** References HeirInput.id */
  heir_id: HeirId;
  /** "numer/denom" format; null if amount_centavos is used */
  fraction: FractionString | null;
  /** Specific amount in centavos; null if fraction is used */
  amount_centavos: number | null;
  /** Conditions (may be stripped by Art. 872 on legitime portions) */
  conditions: string[];
  /** Art. 911 reduction priority */
  is_preferred: boolean;
  /** Optional label */
  description: string | null;
}
```

### 6.8 DeviseInput

```typescript
/** Specific real property bequest */
export interface DeviseInput {
  id: DeviseId;
  description: string;
  /** Market value of the property in centavos */
  value: InputMoney;
  /** References HeirInput.id; null for charitable devises */
  beneficiary_heir_id: HeirId | null;
  /** Display name for the beneficiary */
  beneficiary_name: string;
  /** True if this is a usufruct/annuity devise (Art. 911(3) election may apply) */
  is_usufruct: boolean;
  /** True if indivisible real property (Art. 912 may apply) */
  is_real_property: boolean;
  conditions: string[];
  is_preferred: boolean;
}
```

### 6.9 LegacyInput

```typescript
/** Specific personal property or sum-of-money bequest */
export interface LegacyInput {
  id: LegacyId;
  /** References HeirInput.id; null for non-heir beneficiaries */
  beneficiary_heir_id: HeirId | null;
  beneficiary_name: string;
  amount_centavos: number;
  conditions: string[];
  is_preferred: boolean;
}
```

### 6.10 SubstitutionInput

```typescript
export interface SubstitutionInput {
  id: string;
  /** The heir being substituted */
  primary_heir_id: HeirId;
  /** The heir taking over */
  substitute_heir_id: HeirId;
  substitution_type: SubstitutionType;
  conditions: string[];
}
```

### 6.11 DonationInput

```typescript
/** An inter vivos donation made by the decedent during their lifetime */
export interface DonationInput {
  id: DonationId;
  /** null if donation was to a third-party stranger */
  recipient_heir_id: HeirId | null;
  /** True if recipient is not a compulsory heir */
  recipient_is_stranger: boolean;
  /** Value at TIME OF DONATION (Art. 1071 — not current market value) */
  value_at_donation_centavos: number;
  /** ISO-8601 date (for Art. 911(3) reverse-chronological reduction order) */
  date: DateString | null;

  // ── Collatability Classification Flags ──────────────────────────────────
  /** Art. 1062: donor expressly exempted from collation */
  is_expressly_exempt: boolean;
  /** Art. 1067: support, food, education, medical, customary gift */
  is_support_education_medical: boolean;
  /** Art. 1067: ordinary customary gift */
  is_customary_gift: boolean;
  /** Art. 1068: professional/vocational expense (conditional) */
  is_professional_expense: boolean;
  /** For professional expense: parent expressly required career */
  professional_expense_parent_required: boolean;
  /** For professional expense: imputed home-savings deduction in centavos (Art. 1068) */
  professional_expense_imputed_savings_centavos: number | null;
  /** Art. 1072: joint from both parents → each estate accounts for ½ */
  is_joint_from_both_parents: boolean;
  /** Art. 1066 ¶1: donation to child's spouse ONLY → not collatable */
  is_to_child_spouse_only: boolean;
  /** Art. 1066 ¶2: joint donation to child AND spouse → child collates ½ */
  is_joint_to_child_and_spouse: boolean;
  /** Art. 1070: wedding gift — exempt if ≤ 1/10 FP_disposable */
  is_wedding_gift: boolean;
  /** Art. 1069: debt payment, election expense, or fine on behalf of child */
  is_debt_or_expense_for_child: boolean;
  description: string | null;
}
```

---

## §7. Output Interfaces

### 7.1 RepresentationChain

```typescript
/** Records how a representative heir fills an excluded heir's slot */
export interface RepresentationChain {
  /** Original heir whose slot is being filled */
  root_heir_id: HeirId;
  /** Excluded intermediate heirs (empty for simple one-level representation) */
  through_excluded: HeirId[];
  /** The heir actually receiving the share */
  representative_id: HeirId;
  /** Cause that activated representation at the root */
  trigger: RepresentationTrigger;
  /** Per stirpes fraction: total_slot / count_of_reps_in_same_slot */
  per_stirpes_fraction: FractionString;
}
```

### 7.2 HeirDistribution

```typescript
/** Final distribution result for a single heir */
export interface HeirDistribution {
  heir_id: HeirId;
  heir_name: string;
  /** Computed classification group */
  effective_group: EffectiveGroup;
  /** Legitime floor (zero for strangers and collaterals) */
  legitime_centavos: number;
  /** Total distribution (legitime + FP allocation) */
  total_centavos: number;
  /** Breakdown by source */
  from_legitime_centavos: number;
  from_free_portion_centavos: number;
  /** Donation already received — deducted from cash distribution */
  donations_already_received_centavos: number;
  /** Representation chain if this heir is a representative; null for direct heirs */
  representation: RepresentationChain | null;
  /** Per stirpes fraction if representing; null if direct */
  per_stirpes_fraction: FractionString | null;
  /** Display-ready narrative explanation */
  narrative: string;
}
```

### 7.3 RoundingAdjustment

```typescript
/** Hare-Niemeyer rounding adjustment applied to one heir */
export interface RoundingAdjustment {
  heir_id: HeirId;
  /** Typically +1 or −1 centavo */
  adjustment_centavos: number;
  /** Fractional remainder before rounding, for audit trail */
  fractional_remainder: FractionString;
}
```

### 7.4 LegitimeEntry

```typescript
export interface LegitimeEntry {
  heir_id: HeirId;
  effective_group: EffectiveGroup;
  /** Group's fraction of the estate */
  group_fraction: FractionString;
  /** This heir's individual fraction */
  per_heir_fraction: FractionString;
  legitime_centavos: number;
  /** True if Art. 895 cap proportionally reduced this heir's share */
  cap_reduced: boolean;
}
```

### 7.5 LegitimeResult

```typescript
export interface LegitimeResult {
  scenario_code: ScenarioCode;
  collation_adjusted_estate_centavos: number;
  total_legitime_centavos: number;
  free_portion_gross_centavos: number;
  free_portion_disposable_centavos: number;
  entries: LegitimeEntry[];
  /** True if Art. 895 IC cap was applied */
  cap_applied: boolean;
  /** True if Art. 900 ¶2 articulo mortis reduction was applied to spouse */
  articulo_mortis_reduction_applied: boolean;
}
```

### 7.6 DisinheritanceResult

```typescript
/** BUG-001 batch-processing result */
export interface DisinheritanceResult {
  valid_disinheritances: HeirId[];
  invalid_disinheritances: HeirId[];
  reconciled_disinheritances: HeirId[];
  representatives_added: HeirId[];
  requires_restart: boolean;
}
```

### 7.7 DeviseReduction

```typescript
export interface DeviseReduction {
  devise_id: DeviseId;
  original_amount_centavos: number;
  reduced_amount_centavos: number;
  reduction_centavos: number;
}
```

### 7.8 InofficiousnessResult

```typescript
export interface InofficiousnessResult {
  total_excess_centavos: number;
  devise_reduction_total_centavos: number;
  devise_reductions: DeviseReduction[];
  donation_reduction_total_centavos: number;
  donation_reductions: DonationReduction[];
  /** True if Art. 911(3) heir election is required */
  has_annuity_choice: boolean;
  /** True if Art. 912 physical partition analysis is needed */
  has_indivisible_realty: boolean;
}
```

### 7.9 Underprovision

```typescript
export interface Underprovision {
  heir_id: HeirId;
  will_allocation_centavos: number;
  legitime_centavos: number;
  deficiency_centavos: number;
}
```

### 7.10 StrippedCondition

```typescript
export interface StrippedCondition {
  disposition_id: DispositionId;
  heir_id: HeirId;
  condition_text: string;
  /** e.g., "Art. 872" */
  article_basis: string;
}
```

### 7.11 TestateValidationResult

```typescript
export interface TestateValidationResult {
  preterition: PreteritionEffect;
  disinheritance_result: DisinheritanceResult;
  underprovisions: Underprovision[];
  inofficiousness: InofficiousnessResult | null;
  stripped_conditions: StrippedCondition[];
  requires_restart: boolean;
  warnings: ValidationWarning[];
  manual_review_flags: ManualReviewFlag[];
}
```

### 7.12 ImputationResult

```typescript
export interface ImputationResult {
  heir_id: HeirId;
  /** Heir's gross entitlement computed on collation-adjusted estate */
  gross_entitlement_centavos: number;
  /** Total donations received at donation-time value */
  donations_received_centavos: number;
  charged_to_legitime_centavos: number;
  charged_to_fp_centavos: number;
  /** max(0, gross_entitlement - donations_received) */
  net_from_estate_centavos: number;
  is_excess: boolean;
  excess_amount_centavos: number;
}
```

### 7.13 DonationReduction

```typescript
export interface DonationReduction {
  donation_id: DonationId;
  original_value_centavos: number;
  reduced_by_centavos: number;
  remaining_value_centavos: number;
  /** Amount donee must return to the estate */
  return_required_centavos: number;
}
```

### 7.14 PartitionAllocation

```typescript
export interface PartitionAllocation {
  heir_id: HeirId;
  total_entitlement_centavos: number;
  already_received_centavos: number;
  from_actual_estate_centavos: number;
  partition_note: string | null;
}
```

### 7.15 CollationResult

```typescript
export interface CollationResult {
  /** E_adj = net_estate + collatable_sum */
  collation_adjusted_estate_centavos: number;
  collatable_sum_centavos: number;
  collatable_donation_ids: DonationId[];
  non_collatable_donation_ids: DonationId[];
  imputation_results: ImputationResult[];
  stranger_donations_total_centavos: number;
  inofficious: boolean;
  inofficious_amount_centavos: number;
  donation_reductions: DonationReduction[];
  partition_allocations: PartitionAllocation[];
}
```

### 7.16 VacantShare

```typescript
export interface VacantShare {
  heir_id: HeirId;
  cause: VacancyCause;
  amount_centavos: number;
  source: ShareSource;
  /** null for intestate shares; set for will dispositions */
  disposition_id: DispositionId | null;
  /** Obligations/charges that transfer with the share (Art. 1020) */
  inherited_charges: string[];
}
```

### 7.17 VacancyRedistribution

```typescript
export interface VacancyRedistribution {
  /** HeirId of recipient, or sentinel string "STATE" for escheat */
  recipient_id: string;
  amount_centavos: number;
  /** e.g., "Art. 1019 proportional accretion" */
  basis: string;
  inherited_charges: string[];
}
```

### 7.18 VacancyResolution

```typescript
export interface VacancyResolution {
  vacancy: VacantShare;
  method: ResolutionMethod;
  redistributions: VacancyRedistribution[];
  /** True if OwnRightLegitime or NextDegreeInOwnRight — pipeline must restart */
  requires_restart: boolean;
}
```

### 7.19 ComputationLogEntry

```typescript
export interface ComputationLogEntry {
  step_number: number;
  step_name: string;
  description: string;
  /** ISO-8601 timestamp for audit trail */
  timestamp: string | null;
}
```

### 7.20 ComputationOutput

```typescript
/** Root output from the computation engine */
export interface ComputationOutput {
  succession_type: SuccessionType;
  scenario_code: ScenarioCode;
  net_estate_centavos: number;
  /** E_adj = net_estate + collatable_donations (Art. 908 ¶2) */
  collation_adjusted_estate_centavos: number;
  total_legitime_centavos: number;
  /** Remaining free portion after satisfying all legitimes */
  free_portion_centavos: number;
  /** All heirs including excluded (with zero amounts for excluded) */
  distributions: HeirDistribution[];
  /** null for intestate succession */
  testate_validation: TestateValidationResult | null;
  /** null if no collatable donations */
  collation: CollationResult | null;
  /** [] if no vacant shares */
  vacancy_resolutions: VacancyResolution[];
  warnings: ValidationWarning[];
  manual_review_flags: ManualReviewFlag[];
  restart_count: number;
  rounding_adjustments: RoundingAdjustment[];
  /** Should be 0 or ≤ 1 centavo due to rounding */
  sum_check_discrepancy_centavos: number;
}
```

---

## §8. WASM Bridge Types

```typescript
/**
 * Type-safe wrapper for the compute_json bridge call.
 * Mirrors the Rust Result<ComputationOutput, ComputationError>.
 */
export type ComputeResult =
  | { ok: true;  value: ComputationOutput }
  | { ok: false; error: ComputationError };
```

---

## §9. Display Utility Constants

```typescript
export const HEIR_TYPE_LABELS: Record<HeirType, string> = {
  LegitimateChild:     "Legitimate Child",
  LegitimatedChild:    "Legitimated Child",
  AdoptedChild:        "Adopted Child",
  IllegitimateChild:   "Illegitimate Child",
  LegitimateAscendant: "Legitimate Ascendant",
  Spouse:              "Surviving Spouse",
  Sibling:             "Sibling",
  NieceNephew:         "Niece/Nephew",
  OtherCollateral:     "Other Collateral",
};

export const EFFECTIVE_GROUP_LABELS: Record<EffectiveGroup, string> = {
  LegitimateChildGroup:     "Legitimate Children (G1)",
  LegitimateAscendantGroup: "Legitimate Ascendants (G2)",
  SurvivingSpouseGroup:     "Surviving Spouse (G3)",
  IllegitimateChildGroup:   "Illegitimate Children (G4)",
  CollateralGroup:          "Collateral Relatives",
};

export const SUCCESSION_TYPE_LABELS: Record<SuccessionType, string> = {
  Testate:   "Testate Succession",
  Intestate: "Intestate Succession",
  Mixed:     "Mixed Succession",
};

export const DISINHERITANCE_GROUND_LABELS: Record<DisinheritanceGround, string> = {
  Art919_1: "Art. 919(1) — Attempt on life",
  Art919_2: "Art. 919(2) — Groundless accusation",
  Art919_3: "Art. 919(3) — Adultery/concubinage",
  Art919_4: "Art. 919(4) — Fraud/coercion on will",
  Art919_5: "Art. 919(5) — Refusal to support parent",
  Art919_6: "Art. 919(6) — Maltreatment",
  Art919_7: "Art. 919(7) — Dishonorable life",
  Art919_8: "Art. 919(8) — Civil interdiction",
  Art920_1: "Art. 920(1) — Abandonment of children",
  Art920_2: "Art. 920(2) — Attempt on life",
  Art920_3: "Art. 920(3) — Groundless accusation",
  Art920_4: "Art. 920(4) — Adultery/concubinage",
  Art920_5: "Art. 920(5) — Fraud/coercion on will",
  Art920_6: "Art. 920(6) — Loss of parental authority",
  Art920_7: "Art. 920(7) — Refusal to support",
  Art920_8: "Art. 920(8) — Attempt on other parent",
  Art921_1: "Art. 921(1) — Attempt on life (spouse)",
  Art921_2: "Art. 921(2) — Groundless accusation",
  Art921_3: "Art. 921(3) — Fraud/coercion on will",
  Art921_4: "Art. 921(4) — Cause for legal separation",
  Art921_5: "Art. 921(5) — Loss of parental authority",
  Art921_6: "Art. 921(6) — Refusal to support",
};
```

---

## §10. Utility Functions

```typescript
/** Convert peso amount to centavos (integer rounding) */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/** Convert centavos to pesos */
export function centavosToPesos(centavos: number | string): number {
  const c = typeof centavos === "string" ? Number(centavos) : centavos;
  return c / 100;
}

/** Format centavos as ₱ display string */
export function formatPeso(centavos: number | string): string {
  const n = typeof centavos === "string" ? BigInt(centavos) : BigInt(Math.round(Number(centavos)));
  const pesos = n / 100n;
  const cents = n % 100n;
  const absP = pesos < 0n ? -pesos : pesos;
  const sign = pesos < 0n ? "-" : "";
  const pesosStr = absP.toLocaleString("en-PH");
  if (cents === 0n || cents === -0n) return `${sign}₱${pesosStr}`;
  return `${sign}₱${pesosStr}.${Math.abs(Number(cents)).toString().padStart(2, "0")}`;
}

/** Serialize centavos for WASM input (BigInt support) */
export function serializeCentavos(centavos: number | bigint): number | string {
  if (typeof centavos === "bigint") {
    return centavos <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(centavos) : centavos.toString();
  }
  return centavos;
}

/** Parse "numer/denom" fraction string */
export function parseFraction(s: FractionString): { numer: number; denom: number } {
  const [n, d] = s.split("/").map(Number);
  return { numer: n, denom: d };
}

/** Format fraction as display string (e.g., "1/4" → "¼" or keep as "1/4") */
export function formatFraction(s: FractionString): string {
  const VULGAR: Record<string, string> = {
    "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾",
    "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞",
  };
  return VULGAR[s] ?? s;
}
```

---

## §11. Type Guards

```typescript
export function isComputeError(v: unknown): v is ComputationError {
  return typeof v === "object" && v !== null && "error_type" in v;
}

export function isPreteritionAnnulled(e: PreteritionEffect): e is Extract<PreteritionEffect, { type: "InstitutionAnnulled" }> {
  return e.type === "InstitutionAnnulled";
}

export function isValidationWarning(v: ValidationWarning, code: ValidationWarning["code"]): boolean {
  return v.code === code;
}

export function isExcluded(d: HeirDistribution): boolean {
  return d.total_centavos === 0 && d.legitime_centavos === 0;
}
```

---

## §12. Cross-File Discrepancy Log

The following discrepancies were found between `rust-types.md` and `serde-wire-format.md`.
These MUST be resolved before implementation. The `cross-layer-consistency` aspect will
produce the definitive ruling; this log captures the issues.

### D-01: DecedentInput Fields
- **rust-types §4.2**: `{ name, date_of_death, is_illegitimate, articulo_mortis, cohabitation_years }`
- **serde-wire-format §3.2**: `{ name, date_of_death, has_will, has_legitimate_children, has_illegitimate_children, legal_separation_status, domicile, nationality }`
- **Resolution**: Merge both field sets (all are needed for computation). TypeScript interface above includes all fields from both sources.

### D-02: DisinheritanceGround Variant Names
- **rust-types §3.3**: Descriptive names: `Art919AttemptOnLife`, `Art919GroundlessAccusation`, etc.
- **serde-wire-format §4.2**: Short codes: `Art919_1`, `Art919_2`, etc.
- **Resolution**: Wire format values follow serde-wire-format. Rust variants must either be named `Art919_1` (etc.) OR use explicit `#[serde(rename = "Art919_1")]`. TypeScript uses `"Art919_1"` through `"Art921_6"`.

### D-03: ExclusionReason Variants
- **rust-types §5.3**: `PredeceaseNoRepresentation | Unworthiness | FiliationNotProved | GuiltySpouseLegalSeparation | AdoptionRescinded | ValidDisinheritance | Renounced | ExcludedByGroup`
- **serde-wire-format §4.7**: `Predeceased | Incapacity | Unworthiness | Renunciation | IronCurtain | NotCalled | ValidDisinheritance | InvalidDisinheritance`
- **Resolution**: Use rust-types variants (more granular and implementation-accurate). Serde-wire-format was simplified documentation.

### D-04: EffectiveGroup JSON Values
- **serde-wire-format §5.2**: Documentation uses shorthand "G1"–"G4"
- **rust-types §5.2**: PascalCase variant names: `LegitimateChildGroup`, etc.
- **Resolution**: Use PascalCase variant names (what `rename_all = "PascalCase"` actually produces). TypeScript uses `"LegitimateChildGroup"` etc.

### D-05: RepresentationTrigger Variants
- **rust-types §5.4**: `Predecease | Disinheritance | Unworthiness | IllegitimateTransmission`
- **serde-wire-format §4.8**: `Predecease | Disinheritance | Incapacity | Art902IllegitimateLine`
- **Resolution**: Use rust-types variants. Rename `Incapacity → Unworthiness` and `Art902IllegitimateLine → IllegitimateTransmission` in the Rust code.

### D-06: VacancyCause Variants
- **rust-types §5.5**: `Predecease | Renunciation | Unworthiness | Disinheritance | SubstitutePredeceased | SubstituteIncapacitated`
- **serde-wire-format §4.9**: `Predecease | Incapacity | Renunciation | DisinheritanceInvalid | ConditionFailed | LegitimacyVacancy`
- **Resolution**: Use rust-types variants; add `ConditionFailed` and `LegitimacyVacancy` as they are legitimate vacancy causes missing from rust-types. Final set: `Predecease | Renunciation | Unworthiness | Disinheritance | SubstitutePredeceased | SubstituteIncapacitated | ConditionFailed | LegitimacyVacancy`.

### D-07: ResolutionMethod Variants
- **rust-types §5.7**: Granular set with `AccretionFreePortion | AccretionIntestate | OwnRightLegitime | NextDegreeInOwnRight`
- **serde-wire-format §4.10**: Simplified set with just `Accretion | IntestateFallback | Escheat`
- **Resolution**: Use rust-types granular set (needed for correct Art. 1021 logic).

### D-08: v1 "T5a/T5b" → v2 "T5"
- v1 types used `"T5a"` and `"T5b"` for legitimate+illegitimate testate scenarios.
- v2 unifies as `"T5"` (cap rule handles sub-cases internally).
- **Impact**: Any existing v1 test data using "T5a"/"T5b" must be migrated.

### D-09: EstateInput Structure
- **rust-types §4.3**: `{ net_value_centavos: i64, description: Option<String> }` (flat centavos)
- **serde-wire-format §3.3**: `{ net_estate: Money, gross_estate: Money | null, obligations: Money | null, description: string | null }` (Money wrapper)
- **Resolution**: Use serde-wire-format structure (Money wrapper is consistent with the Money type design). Rust EstateInput must use nested Money struct.

---

## §13. Key Differences from v1

| Type | v1 | v2 | Change |
|------|----|----|--------|
| `Relationship` | 11-variant including "Stranger", "SurvivingSpouse" | `HeirType` 9-variant | Renamed; "Stranger" removed; "Spouse" instead of "SurvivingSpouse" |
| `DisinheritanceCause` | Descriptive names (`ChildAttemptOnLife`) | `DisinheritanceGround` with article codes (`Art919_1`) | Article-code based |
| `EngineInput` | Flat with `family_tree: Person[]` | `ComputationInput` with `heirs: HeirInput[]` | Struct names align with Rust |
| `EngineOutput` | `per_heir_shares`, `narratives`, `computation_log` | `ComputationOutput` with `distributions`, inline `narrative` | Simpler; narrative embedded in HeirDistribution |
| `Money` input | `number \| string` | `InputMoney` with `centavos: number \| string` | Explicit wrapper |
| `Option<T>` | key absent in JSON | always `null` in JSON | Strict null semantics |
| `ScenarioCode` | T5a/T5b variants | T5 only | Unified |
| `SuccessionType` | 4 variants (IntestateByPreterition) | 3 variants | Preterition triggers Mixed → intestate path internally |
