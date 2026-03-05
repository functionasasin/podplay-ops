# Rust Types — Philippine Inheritance Engine v2
*Wave 3 — Engine Design*
*Depends on: heir-classification, heir-concurrence, representation, legitime-fractions, intestate-distribution, testate-validation, collation, vacancy-resolution, multiple-disinheritance-fix*

---

## Overview

This document defines every Rust type used in the v2 inheritance engine — input structs, output structs, enums, and intermediate computation types. Types are organized in dependency order. All types carry the serde attributes described in §2.

The authoritative serde convention is:
- **Struct fields**: `#[serde(rename_all = "snake_case")]`
- **Enum variants**: `#[serde(rename_all = "PascalCase")]`
- **Unknown fields rejected**: `#[serde(deny_unknown_fields)]` on all input types
- **Output types**: no `deny_unknown_fields` (forward-compatible)

---

## §1. Type Aliases and Primitive Wrappers

```rust
/// Stable string identifier for an heir within a single computation.
/// Assigned by the frontend; must be unique within the heirs Vec.
pub type HeirId = String;

/// Stable string identifier for a donation record.
pub type DonationId = String;

/// Stable string identifier for a will disposition (institution, devise, or legacy).
pub type DispositionId = String;

/// Specific ID for a devise (real property bequest).
pub type DeviseId = String;

/// Specific ID for a legacy (personal property bequest).
pub type LegacyId = String;

/// ID for a condition attached to a disposition.
pub type ConditionId = String;
```

---

## §2. Money Type

For the JSON wire format, money is expressed in centavos as an integer. Internally, the engine uses `Rational<BigInt>` (`num-rational` crate) for all arithmetic.

```rust
/// Money amount in Philippine centavos (1 peso = 100 centavos).
/// Wire format: JSON number OR JSON string (for BigInt interop).
/// The serde implementation accepts both and serializes as number.
/// Internal engine arithmetic uses BigRational, not this type.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Money {
    /// Amount in centavos. ₱1.00 = 100 centavos.
    /// Deserializes from JSON number OR JSON string.
    #[serde(deserialize_with = "deserialize_centavos")]
    pub centavos: i64,
}

/// Custom deserializer: accepts both `123456` and `"123456"`.
fn deserialize_centavos<'de, D: serde::Deserializer<'de>>(d: D) -> Result<i64, D::Error> {
    // Implementation: try i64 first; if string, parse as i64.
}
```

---

## §3. Core Domain Enums (Input-Level)

### 3.1 HeirType

```rust
/// The heir's legal status under Philippine civil law.
/// Drives EffectiveGroup assignment.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum HeirType {
    /// Born or conceived in valid marriage (FC Art. 164).
    LegitimateChild,
    /// Born outside wedlock, parents subsequently married (FC Arts. 177–179).
    LegitimatedChild,
    /// RA 8552 adoption (not rescinded) or RA 11642.
    AdoptedChild,
    /// Born outside marriage, filiation proved (FC Arts. 165, 175).
    IllegitimateChild,
    /// Legitimate parents, grandparents, or further ascendants (Art. 887(2)).
    LegitimateAscendant,
    /// Widow or widower (legally married, not validly separated).
    Spouse,
    /// Sibling (full or half blood) — intestate collateral (Arts. 1003–1007).
    Sibling,
    /// Nephew or niece — intestate collateral, inherits by representation (Art. 972).
    NieceNephew,
    /// Other collateral relative within 5th degree (Arts. 1009–1010).
    OtherCollateral,
}
```

### 3.2 LegalSeparationStatus

```rust
/// Applies only to heirs of type Spouse.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum LegalSeparationStatus {
    /// Legal separation not applicable or not decreed.
    NotApplicable,
    /// This spouse is the innocent party (Art. 892 — retains inheritance rights).
    InnocentSpouse,
    /// This spouse caused the legal separation (Art. 1002 — excluded from succession).
    GuiltySpouse,
}
```

### 3.3 DisinheritanceGround (22 grounds)

```rust
/// All enumerated disinheritance grounds from the Civil Code.
/// Variant naming: Art{article}_{paragraph} to be unambiguous.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum DisinheritanceGround {
    // Art. 919 — grounds against children/descendants (8 grounds)
    /// 919(1) Attempt on life of testator/spouse/descendants/ascendants.
    Art919AttemptOnLife,
    /// 919(2) Groundless accusation of crime carrying 6+ year sentence.
    Art919GroundlessAccusation,
    /// 919(3) Conviction of adultery/concubinage with testator's spouse.
    Art919Adultery,
    /// 919(4) Fraud, violence, intimidation, or undue influence on will-making.
    Art919FraudOnWill,
    /// 919(5) Refusal to support parent/ascendant without justifiable cause.
    Art919RefusalToSupportParent,
    /// 919(6) Maltreatment by word or deed.
    Art919Maltreatment,
    /// 919(7) Leading a dishonorable or disgraceful life.
    Art919DisgracefulLife,
    /// 919(8) Conviction for crime carrying civil interdiction.
    Art919CivilInterdiction,

    // Art. 920 — grounds against parents/ascendants (8 grounds)
    /// 920(1) Abandonment of children; inducing daughters to immoral life.
    Art920Abandonment,
    /// 920(2) Conviction of attempt on testator's/spouse's/descendants'/ascendants' life.
    Art920AttemptOnLife,
    /// 920(3) Groundless accusation of crime carrying 6+ year sentence.
    Art920GroundlessAccusation,
    /// 920(4) Conviction of adultery/concubinage with testator's spouse.
    Art920Adultery,
    /// 920(5) Fraud, violence, intimidation, undue influence on will-making.
    Art920FraudOnWill,
    /// 920(6) Loss of parental authority under FC Art. 228–232.
    Art920LossOfParentalAuthority,
    /// 920(7) Refusal to support children/descendants without justifiable cause.
    Art920RefusalToSupportChildren,
    /// 920(8) Attempt by one parent against the other parent's life.
    Art920AttemptOnOtherParentsLife,

    // Art. 921 — grounds against surviving spouse (6 grounds)
    /// 921(1) Conviction of attempt on testator's/descendants'/ascendants' life.
    Art921AttemptOnLife,
    /// 921(2) Groundless accusation of crime carrying 6+ year sentence.
    Art921GroundlessAccusation,
    /// 921(3) Fraud, violence, intimidation, undue influence on will-making.
    Art921FraudOnWill,
    /// 921(4) Spouse gave cause for legal separation (FC Art. 55).
    Art921CauseForLegalSeparation,
    /// 921(5) Spouse gave grounds for loss of parental authority.
    Art921LossOfParentalAuthority,
    /// 921(6) Unjustifiable refusal to support children or the other spouse.
    Art921RefusalToSupport,
}
```

### 3.4 SubstitutionType

```rust
/// Type of testamentary substitution.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum SubstitutionType {
    /// Art. 857: A inherits in default of B ("simple substitution").
    Simple,
    /// Art. 863: A holds title and transmits to B upon A's death/condition.
    Fideicommissary,
}
```

### 3.5 SuccessionType

```rust
/// Whether succession is governed by a will, by law, or partly both.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum SuccessionType {
    /// Entirely governed by a valid will.
    Testate,
    /// No will; entirely by operation of law (Art. 960).
    Intestate,
    /// Will disposes of only part of the estate (Art. 778, 780).
    Mixed,
}
```

---

## §4. Input Structs

### 4.1 Top-Level Input

```rust
/// Root input to the computation engine. Serialized to/from JSON for WASM bridge.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct ComputationInput {
    pub decedent: DecedentInput,
    pub estate: EstateInput,
    pub heirs: Vec<HeirInput>,
    pub donations: Vec<DonationInput>,
    pub will: Option<WillInput>,
}
```

### 4.2 DecedentInput

```rust
/// Information about the person who died (the "decedent").
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct DecedentInput {
    /// Full name for display.
    pub name: String,
    /// ISO-8601 date of death (YYYY-MM-DD). Determines who predeceased.
    pub date_of_death: String,
    /// True if the decedent was themselves an illegitimate child.
    /// Triggers Art. 903 scenarios T14/T15 when applicable.
    pub is_illegitimate: bool,
    /// True if the marriage was solemnized in articulo mortis.
    /// Triggers Art. 900 ¶2 reduced spouse legitime check.
    pub articulo_mortis: bool,
    /// Number of years decedent and spouse cohabited before marriage.
    /// Relevant only when articulo_mortis = true.
    /// If articulo_mortis = true AND cohabitation_years >= 5 → Art. 900 ¶2 exception
    /// does NOT apply (couple was long-cohabiting; normal ½ legitime to spouse).
    pub cohabitation_years: u32,
}
```

### 4.3 EstateInput

```rust
/// The gross estate value after debts and charges (the "hereditary estate").
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct EstateInput {
    /// Net estate value in centavos after deducting:
    ///  - Funeral expenses (Art. 908 ¶1)
    ///  - Debts and obligations (Art. 908 ¶1)
    ///  - Charges imposed by testator on the estate
    /// This is the base for all legitime and distribution computations
    /// BEFORE collation adjustment (Art. 908 ¶2).
    pub net_value_centavos: i64,
    /// Narrative note for the UI (e.g., "gross estate less ₱500,000 debts").
    pub description: Option<String>,
}
```

### 4.4 HeirInput

```rust
/// A single heir or potential heir. Covers all heir types and classification flags.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct HeirInput {
    /// Stable unique identifier within this computation.
    pub id: HeirId,
    /// Display name.
    pub name: String,
    /// Legal classification driving group assignment.
    pub heir_type: HeirType,

    // ── Eligibility Gate Flags (heir-classification §3) ──────────────────

    /// True if the heir predeceased the decedent.
    /// When true AND children is non-empty, representation may apply.
    pub is_deceased: bool,
    /// ISO-8601 date this heir died. Null if alive.
    pub date_of_death: Option<String>,

    /// True if Art. 1032 unworthiness applies.
    pub is_unworthy: bool,
    /// True if testator knew of the unworthiness cause when executing will (Art. 1033).
    /// If true, unworthiness is condoned and heir remains eligible.
    pub unworthiness_condoned: bool,

    /// True if filiation is legally proved.
    /// Always true for LegitimateChild, LegitimatedChild, AdoptedChild.
    /// Must be explicitly set for IllegitimateChild (FC Arts. 172, 175).
    pub filiation_proved: bool,

    /// For Spouse only. Defaults to NotApplicable.
    pub legal_separation_status: LegalSeparationStatus,

    /// For AdoptedChild only. True if adoption was rescinded before decedent's death.
    pub adoption_rescinded: bool,
    /// ISO-8601 date of adoption rescission. Null if not rescinded.
    pub adoption_rescission_date: Option<String>,
    /// For AdoptedChild: true if adopter is married to biological parent (RA 8552 §16).
    pub biological_parent_is_adopter_spouse: bool,

    /// Populated by testate validation step. Frontend sets false on input.
    /// True if a valid DisinheritanceRecord targets this heir.
    pub is_disinherited: bool,

    /// True if heir has executed a valid renunciation (Art. 1041).
    /// Renouncing heirs are NEVER represented (Art. 977).
    pub has_renounced: bool,

    // ── Classification Metadata ───────────────────────────────────────────

    /// True if this heir was legitimated (FC Arts. 177–179).
    /// Valid legitimation → treated same as LegitimateChild.
    pub is_legitimated: bool,

    /// For LegitimateAscendant only.
    /// True = paternal line; false = maternal line.
    pub paternal_line: bool,
    /// For LegitimateAscendant only.
    /// Degree of kinship: 1 = parent, 2 = grandparent, 3 = great-grandparent, etc.
    pub degree: Option<u32>,

    // ── Collateral Heir Fields (intestate only) ───────────────────────────

    /// True if this heir is a collateral relative (Sibling, NieceNephew, OtherCollateral).
    pub is_collateral: bool,
    /// For Sibling: true = full blood (same father AND mother), false = half blood.
    pub is_full_blood: bool,
    /// For collateral heirs: degree of kinship (2 = sibling, 3 = nephew/niece, etc.)
    /// 5th degree maximum eligible (Art. 1010).
    pub collateral_degree: u32,

    // ── Family Tree (for representation) ─────────────────────────────────

    /// IDs of this heir's direct children who are registered in the heirs Vec.
    /// Used to build representation chains (including cascading disinheritance).
    /// The engine calls children_of(heir_id) to find eligible representatives.
    pub children: Vec<HeirId>,
}
```

### 4.5 WillInput

```rust
/// The decedent's last will and testament.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct WillInput {
    /// General shares of the estate assigned to named heirs.
    pub institutions: Vec<InstitutionInput>,
    /// Specific real property bequests.
    pub devises: Vec<DeviseInput>,
    /// Specific personal property or sum-of-money bequests.
    pub legacies: Vec<LegacyInput>,
    /// Explicit disinheritances with stated grounds.
    pub disinheritances: Vec<DisinheritanceRecord>,
    /// Testator-designated substitutions (Art. 857 or 863).
    pub substitutions: Vec<SubstitutionInput>,
}

/// Institution: general share of the estate ("I leave ¼ of my estate to Juan").
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct InstitutionInput {
    pub id: DispositionId,
    pub heir_id: HeirId,
    /// Fractional share in "numer/denom" format (e.g., "1/2"). Null if peso amount used.
    pub fraction: Option<String>,
    /// Peso amount in centavos. Null if fraction used.
    pub amount_centavos: Option<i64>,
    /// Conditions on this institution (may be stripped by Art. 872 if on legitime).
    pub conditions: Vec<String>,
    /// True if testator explicitly preferred this institution for Art. 911 reduction order.
    pub is_preferred: bool,
}

/// Devise: specific real property bequest.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct DeviseInput {
    pub id: DeviseId,
    /// Null if beneficiary is a stranger not in the heirs Vec.
    pub beneficiary_heir_id: Option<HeirId>,
    pub beneficiary_name: String,
    pub property_description: String,
    pub estimated_value_centavos: i64,
    /// True if this is a usufruct devise (Art. 911(3) choice may apply).
    pub is_usufruct: bool,
    /// True if this is indivisible real property (Art. 912 may apply).
    pub is_real_property: bool,
    pub conditions: Vec<String>,
    pub is_preferred: bool,
}

/// Legacy: specific personal property or sum of money.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct LegacyInput {
    pub id: LegacyId,
    pub beneficiary_heir_id: Option<HeirId>,
    pub beneficiary_name: String,
    pub amount_centavos: i64,
    pub conditions: Vec<String>,
    pub is_preferred: bool,
}

/// Disinheritance record: names an heir and the ground.
/// `is_valid` is ENGINE-computed (not trusted from input).
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct DisinheritanceRecord {
    pub heir_id: HeirId,
    pub ground: DisinheritanceGround,
    /// True if testator reconciled with this heir after the disinheritance (Art. 922).
    /// Reconciliation voids the disinheritance entirely.
    pub reconciled: bool,
    /// True if cause is considered proven (user-attested; affects validity check).
    pub cause_proven: bool,
}

/// Testamentary substitution.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct SubstitutionInput {
    pub primary_heir_id: HeirId,
    pub substitute_heir_id: HeirId,
    pub substitution_type: SubstitutionType,
}
```

### 4.6 DonationInput

```rust
/// An inter vivos donation made by the decedent during their lifetime.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "snake_case")]
pub struct DonationInput {
    pub id: DonationId,
    /// Null if recipient is a stranger (not in heirs Vec).
    pub recipient_heir_id: Option<HeirId>,
    /// True if recipient is not a compulsory heir.
    pub recipient_is_stranger: bool,
    /// Value at the TIME OF DONATION (Art. 1071 — not current value).
    pub value_at_donation_centavos: i64,
    /// ISO-8601 date of donation (for Art. 911(3) reverse-chronological reduction).
    pub date: String,

    // ── Collatability Classification Flags ───────────────────────────────
    /// Donor expressly exempted this donation from collation (Art. 1062).
    pub is_expressly_exempt: bool,
    /// Exempt category: support, food, education, medical, customary gift (Art. 1067).
    pub is_support_education_medical: bool,
    /// Exempt category: ordinary customary gifts (Art. 1067).
    pub is_customary_gift: bool,
    /// Conditional: professional/vocational expense (Art. 1068).
    pub is_professional_expense: bool,
    /// For professional expense: parent expressly required child to pursue this career.
    pub professional_expense_parent_required: bool,
    /// For professional expense: imputed home-savings deduction in centavos (Art. 1068).
    pub professional_expense_imputed_savings_centavos: Option<i64>,
    /// Joint donation from both parents — each estate accounts for ½ (Art. 1072).
    pub is_joint_from_both_parents: bool,
    /// Donation to child's spouse ONLY — not collatable (Art. 1066 ¶1).
    pub is_to_child_spouse_only: bool,
    /// Joint donation to child AND spouse — child collates ½ (Art. 1066 ¶2).
    pub is_joint_to_child_and_spouse: bool,
    /// Wedding gift — exempt if ≤ 1/10 FP_disposable (Art. 1070).
    pub is_wedding_gift: bool,
    /// Debt payment, election expense, or fine on behalf of child (Art. 1069 — collatable).
    pub is_debt_or_expense_for_child: bool,
}
```

---

## §5. Computed / Intermediate Enums

### 5.1 ScenarioCode

```rust
/// The 30-scenario classification driving all legitime and distribution computations.
/// Determined from the eligible heir set (post-representation, post-disinheritance).
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ScenarioCode {
    // ── Testate Scenarios (T1–T15) ──────────────────────────────────────
    /// n legitimate children only. G1=½; FP=½.
    T1,
    /// 1 legitimate child + spouse. G1=½; G3=¼; FP=¼.
    T2,
    /// n≥2 legitimate children + spouse. G1=½; G3=per-child; FP=remainder.
    T3,
    /// n legitimate + m illegitimate (no spouse). Cap rule applies.
    T4,
    /// n legitimate + m illegitimate + spouse. Cap rule applies.
    T5,
    /// Ascendants only (no descendants). G2=½; FP=½.
    T6,
    /// Ascendants + spouse. G2=½; G3=¼; FP=¼.
    T7,
    /// Ascendants + m illegitimate. G2=½; G4=¼; FP=¼.
    T8,
    /// Ascendants + m illegitimate + spouse. G2=½; G4=¼; G3=⅛; FP=⅛.
    T9,
    /// Spouse + m illegitimate (no descendants, no ascendants). G3=⅓; G4=⅓; FP=⅓.
    T10,
    /// m illegitimate only. G4=½; FP=½.
    T11,
    /// Spouse only. G3=½ (or ⅓ articulo mortis; Art. 900).
    T12,
    /// No compulsory heirs. No legitime; FP=entire estate.
    T13,
    /// Illegitimate decedent, parents only (Art. 903 ¶1). Parents=½; FP=½.
    T14,
    /// Illegitimate decedent, parents + spouse (Art. 903 ¶2). Parents=¼; Spouse=¼; FP=½.
    T15,

    // ── Intestate Scenarios (I1–I15) ────────────────────────────────────
    /// n legitimate children. Equal 1/n shares.
    I1,
    /// n legitimate children + spouse. Equal 1/(n+1) shares (Art. 996).
    I2,
    /// n legitimate + m illegitimate (2:1 ratio; Art. 983, 895).
    I3,
    /// n legitimate + m illegitimate + spouse (2:1:2; Art. 999).
    I4,
    /// Legitimate parents only (Art. 985). Equal halves or survivor takes all.
    I5,
    /// Legitimate parents + spouse. ½ parents; ½ spouse (Art. 997).
    I6,
    /// m illegitimate children only. Equal 1/m shares (Art. 988).
    I7,
    /// m illegitimate + spouse. ½ spouse; ½ illegitimate (Art. 998).
    I8,
    /// Legitimate ascendants + m illegitimate. ½ ascendants; ½ illegitimate (Art. 991).
    I9,
    /// Legitimate ascendants + m illegitimate + spouse. ½ asc; ¼ illegit; ¼ spouse (Art. 1000).
    I10,
    /// Spouse only (no collaterals eligible). Entire estate (Art. 994/995).
    I11,
    /// Spouse + siblings/nephews-nieces. ½ spouse; ½ collaterals (Art. 1001).
    I12,
    /// Siblings only (no spouse). Full=2 units, half=1 unit (Arts. 1003–1006).
    I13,
    /// Other collaterals only (within 5th degree). Nearer excludes remoter (Art. 1009).
    I14,
    /// No heirs. Entire estate to the State (Art. 1011).
    I15,
}
```

### 5.2 EffectiveGroup

```rust
/// Computed group for distribution purposes (derived from HeirType + validation flags).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EffectiveGroup {
    /// G1: LegitimateChild, LegitimatedChild, AdoptedChild
    LegitimateChildGroup,
    /// G2: LegitimateAscendant (only when G1 absent)
    LegitimateAscendantGroup,
    /// G3: Spouse
    SurvivingSpouseGroup,
    /// G4: IllegitimateChild
    IllegitimateChildGroup,
    /// Collateral relatives (intestate Class 5)
    CollateralGroup,
}
```

### 5.3 ExclusionReason

```rust
/// Why an heir was removed from the eligible set.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ExclusionReason {
    /// Predeceased the decedent, no eligible representatives.
    PredeceaseNoRepresentation,
    /// Art. 1032: Unworthiness, not condoned by testator.
    Unworthiness,
    /// Art. 887 ¶3: Illegitimate filiation not proved.
    FiliationNotProved,
    /// Art. 1002: Spouse gave cause for legal separation.
    GuiltySpouseLegalSeparation,
    /// RA 8552 §20: Adoption rescinded before decedent's death.
    AdoptionRescinded,
    /// Arts. 915–923: Valid disinheritance with enumerated ground.
    ValidDisinheritance,
    /// Art. 1041: Heir renounced the inheritance.
    Renounced,
    /// Art. 887(2): Legitimate ascendant group excluded because G1 is present.
    ExcludedByGroup,
}
```

### 5.4 RepresentationTrigger

```rust
/// The cause that activated representation for a given heir slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum RepresentationTrigger {
    /// Heir predeceased the decedent (Arts. 970–971).
    Predecease,
    /// Heir validly disinherited (Art. 923).
    Disinheritance,
    /// Heir unworthy/incapacitated (Art. 1035).
    Unworthiness,
    /// Art. 902: Illegitimate child's descendants may represent in intestate.
    IllegitimateTransmission,
}
```

### 5.5 VacancyCause

```rust
/// What caused a share to become vacant after initial distribution.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum VacancyCause {
    Predecease,
    Renunciation,
    Unworthiness,
    Disinheritance,
    SubstitutePredeceased,
    SubstituteIncapacitated,
}
```

### 5.6 ShareSource

```rust
/// Whether the vacant share originates from a legitime or free portion allocation.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ShareSource {
    /// The heir's legitime portion (Art. 1021 ¶2: triggers recompute, not true accretion).
    Legitime,
    /// A will-allocated free portion share (Art. 1021 ¶1: accretion, requires pro indiviso).
    FreePortion,
    /// An intestate share (Art. 1018: always accretes to co-heirs).
    Intestate,
    /// A devise/legacy (specific property bequest).
    Devise,
    /// A legacy (sum of money or personal property).
    Legacy,
}
```

### 5.7 ResolutionMethod

```rust
/// How a vacant share was resolved.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ResolutionMethod {
    /// Art. 859/1022(1): Named substitute inherits.
    Substitution,
    /// Arts. 970–977: Representatives step in per stirpes.
    Representation,
    /// Arts. 1016–1019, 1021 ¶1: Pro indiviso FP share accretes proportionally.
    AccretionFreePortion,
    /// Art. 1018: Intestate share accretes proportionally.
    AccretionIntestate,
    /// Art. 1021 ¶2: Vacant legitime → co-heirs succeed "in own right" → recompute scenario.
    OwnRightLegitime,
    /// Art. 1022(2): No accretion possible → falls to legal/intestate heirs.
    IntestateFallback,
    /// Art. 969: All heirs of same degree renounce → next degree inherits in own right.
    NextDegreeInOwnRight,
    /// Art. 1011: No heirs → entire estate to the State.
    Escheat,
}
```

---

## §6. Intermediate / Computed Structs

### 6.1 ClassifiedHeir (Internal — not serialized to output directly)

```rust
/// An heir after eligibility gate evaluation.
/// Internal to the pipeline; not directly serialized in output JSON.
pub struct ClassifiedHeir {
    pub input: HeirInput,
    pub effective_group: Option<EffectiveGroup>,
    pub is_eligible: bool,
    pub exclusion_reason: Option<ExclusionReason>,
    /// True if this heir fills another heir's slot by representation.
    pub is_representative: bool,
    /// The representation chain if is_representative = true.
    pub representation_chain: Option<RepresentationChain>,
}
```

### 6.2 RepresentationChain

```rust
/// Records how a representative heir fills an excluded heir's slot.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RepresentationChain {
    /// The original heir whose slot is being filled (e.g., A in A→B→C chain).
    pub root_heir_id: HeirId,
    /// Excluded heirs between root and representative (empty for simple representation).
    pub through_excluded: Vec<HeirId>,
    /// The actual heir receiving the share.
    pub representative_id: HeirId,
    /// Which cause activated representation at the root.
    pub trigger: RepresentationTrigger,
    /// Per stirpes: total_slot / count_of_representatives_in_same_slot.
    pub per_stirpes_fraction: String,   // "numer/denom" format
}
```

### 6.3 LegitimeResult

```rust
/// Computed legitimes for all compulsory heirs.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct LegitimeResult {
    pub scenario_code: ScenarioCode,
    pub collation_adjusted_estate_centavos: i64,
    /// Total legitime = sum of all groups' legitimes.
    pub total_legitime_centavos: i64,
    /// Free portion gross (before spouse + illegitimate pulls).
    pub free_portion_gross_centavos: i64,
    /// Free portion disposable (after spouse and illegitimate legitimes deducted).
    pub free_portion_disposable_centavos: i64,
    /// Per-heir legitime entries.
    pub entries: Vec<LegitimeEntry>,
    /// True if Art. 895 cap was applied to illegitimate children.
    pub cap_applied: bool,
    /// True if Art. 900 ¶2 articulo mortis reduction was applied to spouse.
    pub articulo_mortis_reduction_applied: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct LegitimeEntry {
    pub heir_id: HeirId,
    pub effective_group: EffectiveGroup,
    pub group_fraction: String,          // Group's fraction of estate, "numer/denom"
    pub per_heir_fraction: String,       // This heir's fraction, "numer/denom"
    pub legitime_centavos: i64,
    /// True if this heir's share was proportionally reduced by Art. 895 cap.
    pub cap_reduced: bool,
}
```

---

## §7. Testate Validation Result Types

### 7.1 PreteritionEffect

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
#[serde(tag = "type")]
pub enum PreteritionEffect {
    /// No preterition detected.
    None,
    /// Art. 854: All heir institutions annulled; devises/legacies survive.
    InstitutionAnnulled {
        preterited_heir_ids: Vec<HeirId>,
    },
}
```

### 7.2 DisinheritanceResult (BUG-001 batch fix)

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DisinheritanceResult {
    /// Heirs validly disinherited and excluded from the estate.
    pub valid_disinheritances: Vec<HeirId>,
    /// Heirs whose disinheritance was invalid (Art. 918 partial annulment applies).
    pub invalid_disinheritances: Vec<HeirId>,
    /// Heirs whose disinheritance was voided by reconciliation (Art. 922).
    pub reconciled_disinheritances: Vec<HeirId>,
    /// New representative heirs added as a result of Art. 923.
    pub representatives_added: Vec<HeirId>,
    /// Pipeline must recompute scenario code and legitimes from scratch.
    pub requires_restart: bool,
}
```

### 7.3 InofficiousnessResult

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct InofficiousnessResult {
    pub total_excess_centavos: i64,
    pub devise_reduction_total_centavos: i64,
    pub devise_reductions: Vec<DeviseReduction>,
    pub donation_reduction_total_centavos: i64,
    pub donation_reductions: Vec<DonationReduction>,
    /// True if any usufruct/annuity devise triggers Art. 911(3) heir election.
    pub has_annuity_choice: bool,
    /// True if any inofficious devise involves indivisible real property (Art. 912).
    pub has_indivisible_realty: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DeviseReduction {
    pub devise_id: DeviseId,
    pub original_amount_centavos: i64,
    pub reduced_amount_centavos: i64,
    pub reduction_centavos: i64,
}
```

### 7.4 Underprovision

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Underprovision {
    pub heir_id: HeirId,
    pub will_allocation_centavos: i64,
    pub legitime_centavos: i64,
    pub deficiency_centavos: i64,
}
```

### 7.5 StrippedCondition

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct StrippedCondition {
    pub disposition_id: DispositionId,
    pub heir_id: HeirId,
    pub condition_text: String,
    pub article_basis: String,   // e.g., "Art. 872"
}
```

### 7.6 TestateValidationResult

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TestateValidationResult {
    pub preterition: PreteritionEffect,
    pub disinheritance_result: DisinheritanceResult,
    pub underprovisions: Vec<Underprovision>,
    pub inofficiousness: Option<InofficiousnessResult>,
    pub stripped_conditions: Vec<StrippedCondition>,
    pub requires_restart: bool,
    pub warnings: Vec<ValidationWarning>,
    pub manual_review_flags: Vec<ManualReviewFlag>,
}
```

---

## §8. Collation Types

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct CollationResult {
    pub collation_adjusted_estate_centavos: i64,
    pub collatable_sum_centavos: i64,
    pub collatable_donation_ids: Vec<DonationId>,
    pub non_collatable_donation_ids: Vec<DonationId>,
    pub imputation_results: Vec<ImputationResult>,
    pub stranger_donations_total_centavos: i64,
    pub inofficious: bool,
    pub inofficious_amount_centavos: i64,
    pub donation_reductions: Vec<DonationReduction>,
    pub partition_allocations: Vec<PartitionAllocation>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ImputationResult {
    pub heir_id: HeirId,
    /// Heir's gross entitlement computed on collation-adjusted estate.
    pub gross_entitlement_centavos: i64,
    /// Total of donations received by this heir (at donation-time value).
    pub donations_received_centavos: i64,
    /// Amount charged against this heir's legitime.
    pub charged_to_legitime_centavos: i64,
    /// Amount charged against free portion (excess over legitime).
    pub charged_to_fp_centavos: i64,
    /// max(0, gross_entitlement − donations_received). Actual cash from estate.
    pub net_from_estate_centavos: i64,
    pub is_excess: bool,
    pub excess_amount_centavos: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DonationReduction {
    pub donation_id: DonationId,
    pub original_value_centavos: i64,
    pub reduced_by_centavos: i64,
    pub remaining_value_centavos: i64,
    /// Amount donee must return to the estate.
    pub return_required_centavos: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct PartitionAllocation {
    pub heir_id: HeirId,
    pub total_entitlement_centavos: i64,
    pub already_received_centavos: i64,
    pub from_actual_estate_centavos: i64,
    pub partition_note: Option<String>,
}
```

---

## §9. Vacancy Resolution Types

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct VacantShare {
    pub heir_id: HeirId,
    pub cause: VacancyCause,
    pub amount_centavos: i64,
    pub source: ShareSource,
    /// Null for intestate shares; set for will dispositions.
    pub disposition_id: Option<DispositionId>,
    /// Obligations/charges that transfer with the share (Art. 1020).
    pub inherited_charges: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct VacancyResolution {
    pub vacancy: VacantShare,
    pub method: ResolutionMethod,
    pub redistributions: Vec<VacancyRedistribution>,
    /// True for OwnRightLegitime and NextDegreeInOwnRight → pipeline must restart.
    pub requires_restart: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct VacancyRedistribution {
    /// HeirId of recipient, or "STATE" sentinel for escheat.
    pub recipient_id: String,
    pub amount_centavos: i64,
    /// Legal basis (e.g., "Art. 1019 proportional accretion").
    pub basis: String,
    pub inherited_charges: Vec<String>,
}
```

---

## §10. Warning and Review Types

### 10.1 ValidationWarning

```rust
/// Codes used in TestateValidationResult.warnings for UI display.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
#[serde(tag = "code", content = "data")]
pub enum ValidationWarning {
    /// Art. 854: At least one G1/G2 heir was completely omitted from the will.
    PreteritionDetected { preterited_heir_ids: Vec<HeirId> },
    /// Art. 918: Disinheritance attempt was invalid; legitime portion protected.
    InvalidDisinheritance { heir_ids: Vec<HeirId> },
    /// Art. 872: Condition on legitime portion legally void.
    ConditionStripped { disposition_ids: Vec<DispositionId> },
    /// Heir allocation < legitime; engine adjusts distribution.
    Underprovision { heir_id: HeirId, deficiency_centavos: i64 },
    /// Art. 911: Devise/legacy reduced due to inofficiousness.
    InoficiousnessReduced { total_reduced_centavos: i64 },
    /// Art. 922: Reconciliation voids a prior disinheritance.
    ReconciliationVoided { heir_ids: Vec<HeirId> },
    /// Art. 854 ¶2: Posthumous child may exist; external verification needed.
    PosthumousHeirPossible,
    /// Art. 911(3): Compulsory heirs must elect compliance or cash-out for usufruct devise.
    AnnuityChoiceRequired { devise_ids: Vec<DeviseId> },
    /// Art. 912: Inofficious real property devise requires physical partition analysis.
    IndivisibleRealty { devise_ids: Vec<DeviseId> },
    /// BUG-001 resolved: Multiple disinheritances batch-processed.
    MultipleDisinheritances { count: u32 },
}
```

### 10.2 ManualReviewFlag

```rust
/// Items that require legal counsel before finalizing distribution.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
#[serde(tag = "flag")]
pub enum ManualReviewFlag {
    /// All G1 descendants disinherited with no representatives; G2 emergence unclear.
    AllDescendantsDisinherited { heir_ids: Vec<HeirId> },
    /// Disinherited heir has both Art. 923 representatives AND a testamentary substitute.
    DisinheritedWithSubstituteAndReps { heir_id: HeirId },
    /// Posthumous child may exist within 300 days of decedent's death.
    PosthumousChildPossible,
    /// Art. 911(3): Heir election required for usufruct/annuity devise.
    UsufructElectionRequired { devise_id: DeviseId },
    /// Art. 912: Physical partition analysis needed for indivisible real property.
    IndivisibleRealtyPartition { devise_id: DeviseId },
    /// Reconciliation date is earlier than will date; heir likely underprovided.
    ReconciliationPreWill { heir_id: HeirId },
    /// Art. 177 legitimation contested; engine result conditional on validity.
    LegitimationContested { heir_id: HeirId },
}
```

---

## §11. Output Types

### 11.1 HeirDistribution

```rust
/// Final distribution result for a single heir.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct HeirDistribution {
    pub heir_id: HeirId,
    pub heir_name: String,
    pub effective_group: EffectiveGroup,
    /// Heir's legitime (zero for testate strangers and intestate non-heirs).
    pub legitime_centavos: i64,
    /// Heir's total distribution (legitime + FP allocation).
    pub total_centavos: i64,
    /// Breakdown: how much comes from legitime vs free portion vs donations.
    pub from_legitime_centavos: i64,
    pub from_free_portion_centavos: i64,
    /// Donation already received (deducted from cash distribution).
    pub donations_already_received_centavos: i64,
    /// Representation chain if this heir is a representative (null for direct heirs).
    pub representation: Option<RepresentationChain>,
    /// Per stirpes fraction of represented slot (null if not representing).
    pub per_stirpes_fraction: Option<String>,
    /// Display-ready narrative explanation of this heir's share.
    pub narrative: String,
}
```

### 11.2 ComputationOutput

```rust
/// Root output from the computation engine.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ComputationOutput {
    /// Effective succession type determined by the engine.
    pub succession_type: SuccessionType,
    /// Final scenario code used for distribution.
    pub scenario_code: ScenarioCode,
    /// Net estate before collation.
    pub net_estate_centavos: i64,
    /// Estate after collation adjustment (Art. 908 ¶2).
    pub collation_adjusted_estate_centavos: i64,
    /// Total of all legitimes.
    pub total_legitime_centavos: i64,
    /// Remaining free portion after satisfying all legitimes.
    pub free_portion_centavos: i64,
    /// Per-heir distributions (all heirs, including excluded with zero amounts).
    pub distributions: Vec<HeirDistribution>,
    /// Testate validation findings (null for intestate succession).
    pub testate_validation: Option<TestateValidationResult>,
    /// Collation computation results.
    pub collation: Option<CollationResult>,
    /// Shares that became vacant and how they were resolved.
    pub vacancy_resolutions: Vec<VacancyResolution>,
    /// All warnings for the UI.
    pub warnings: Vec<ValidationWarning>,
    /// Items flagged for mandatory manual legal review.
    pub manual_review_flags: Vec<ManualReviewFlag>,
    /// Number of pipeline restarts that occurred (for debugging/audit).
    pub restart_count: u32,
    /// Rounding adjustments applied (Hare-Niemeyer).
    pub rounding_adjustments: Vec<RoundingAdjustment>,
    /// Sum check: net_estate = sum(distributions.total_centavos).
    /// Any discrepancy indicates a rounding error; should be ≤ 1 centavo.
    pub sum_check_discrepancy_centavos: i64,
}
```

### 11.3 RoundingAdjustment

```rust
/// Hare-Niemeyer rounding adjustment applied to one heir.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RoundingAdjustment {
    pub heir_id: HeirId,
    /// +1 or −1 centavo adjustment.
    pub adjustment_centavos: i64,
    /// Fractional remainder before rounding, for audit.
    pub fractional_remainder: String,   // "numer/denom"
}
```

---

## §12. Error Types

```rust
/// Errors returned by the WASM bridge `compute_json` function.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
#[serde(tag = "error_type")]
pub enum ComputationError {
    /// Input JSON failed serde deserialization (unknown field, wrong type, etc.).
    InputValidation {
        message: String,
        field_path: Option<String>,
    },
    /// Domain validation failed before computation.
    DomainValidation {
        message: String,
        /// Which heir IDs were involved.
        related_heir_ids: Vec<HeirId>,
    },
    /// Pipeline exceeded maximum restart guard.
    MaxRestartsExceeded {
        restart_count: u32,
        last_step: String,
    },
    /// Internal arithmetic error (should never occur with BigRational).
    ArithmeticError {
        message: String,
    },
    /// Unexpected panic recovered by the WASM panic hook.
    PanicRecovered {
        message: String,
    },
}
```

---

## §13. Module Organization

```
src/
├── lib.rs           — pub use re-exports; #[wasm_bindgen] entry point
├── types/
│   ├── mod.rs       — pub use all
│   ├── ids.rs       — HeirId, DonationId, DispositionId, etc.
│   ├── money.rs     — Money, deserialize_centavos
│   ├── input.rs     — ComputationInput, DecedentInput, EstateInput,
│   │                  HeirInput, WillInput, InstitutionInput, DeviseInput,
│   │                  LegacyInput, DisinheritanceRecord, SubstitutionInput,
│   │                  DonationInput
│   ├── enums.rs     — HeirType, LegalSeparationStatus, DisinheritanceGround,
│   │                  SubstitutionType, SuccessionType, ScenarioCode,
│   │                  EffectiveGroup, ExclusionReason, RepresentationTrigger,
│   │                  VacancyCause, ShareSource, ResolutionMethod
│   ├── intermediate.rs — ClassifiedHeir, RepresentationChain, LegitimeResult,
│   │                     LegitimeEntry
│   ├── validation.rs — PreteritionEffect, DisinheritanceResult,
│   │                   InofficiousnessResult, DeviseReduction, Underprovision,
│   │                   StrippedCondition, TestateValidationResult
│   ├── collation.rs  — CollationResult, ImputationResult, DonationReduction,
│   │                   PartitionAllocation
│   ├── vacancy.rs    — VacantShare, VacancyResolution, VacancyRedistribution
│   ├── warnings.rs   — ValidationWarning, ManualReviewFlag
│   ├── output.rs     — HeirDistribution, ComputationOutput, RoundingAdjustment
│   └── errors.rs     — ComputationError
├── pipeline/
│   ├── mod.rs
│   ├── step1_estate.rs     — Net estate from input
│   ├── step2_classify.rs   — Eligibility gate + effective groups
│   ├── step3_represent.rs  — Representation chains (predecease + Art. 902)
│   ├── step4_collation.rs  — Collation-adjusted estate (Art. 908 ¶2)
│   ├── step5_scenario.rs   — ScenarioCode determination
│   ├── step6_legitimes.rs  — Legitime fractions → centavos
│   ├── step7_validate.rs   — Testate validation (BUG-001 fix)
│   ├── step8_distribute.rs — Initial distribution (testate + intestate)
│   ├── step9_vacancy.rs    — Vacancy detection + resolution
│   └── step10_round.rs     — Hare-Niemeyer rounding + narratives
└── bridge.rs        — compute_json WASM export
```

---

## §14. Key Design Decisions

### D1: children field over representatives
`HeirInput.children: Vec<HeirId>` stores all direct children registered in the computation. The engine builds representation eligibility dynamically. This enables `find_representatives_recursive` to cascade through excluded children (BUG-001 cascading disinheritance fix).

### D2: BigRational internally, i64 for I/O
All fraction arithmetic uses `num_rational::BigRational`. Centavos (i64) appear only at input/output boundaries and in the final Hare-Niemeyer rounding step.

### D3: Money accepts number OR string
The custom `deserialize_centavos` deserializer handles both JSON `123456` and `"123456"` to support JavaScript's `BigInt` use case.

### D4: Enums use PascalCase for serde
All enum variants serialize/deserialize as `PascalCase` strings (e.g., `"LegitimateChild"`, `"T1"`, `"ValidDisinheritance"`). Struct fields use `snake_case`.

### D5: ScenarioCode as flat enum (not nested)
T1–T15 and I1–I15 are all variants of one enum. This matches the original v1 engine and simplifies the JSON wire format (just a string like `"T3"` or `"I12"`).

### D6: DisinheritanceRecord is input (not computed)
The `ground` and `reconciled` fields come from the frontend. `is_valid` is NOT on the input struct — validity is engine-computed from ground + reconciled status + cause_proven.

### D7: fraction format is "numer/denom"
Rational fractions in output fields (e.g., `per_stirpes_fraction`, `per_heir_fraction`) are serialized as `"numer/denom"` strings (e.g., `"1/3"`, `"7/24"`). This is the only format the engine emits for fractions.

### D8: null for absent optionals
All `Option<T>` fields serialize as `null` in JSON when absent, never as absent fields. The serde default is to omit absent fields; this must be overridden with `#[serde(default)]` on deserialization and explicit `null` serialization.

---

## §15. Type Coverage Checklist

All Rust types that Wave 4 (bridge contract) will use have been defined here:

| Category | Types Defined |
|----------|--------------|
| Input | ComputationInput, DecedentInput, EstateInput, HeirInput, WillInput, InstitutionInput, DeviseInput, LegacyInput, DisinheritanceRecord, SubstitutionInput, DonationInput |
| Core enums | HeirType, LegalSeparationStatus, DisinheritanceGround (22 variants), SubstitutionType, SuccessionType |
| Computed enums | ScenarioCode (30 variants), EffectiveGroup, ExclusionReason, RepresentationTrigger, VacancyCause, ShareSource, ResolutionMethod |
| Intermediate | ClassifiedHeir, RepresentationChain, LegitimeResult, LegitimeEntry |
| Validation | PreteritionEffect, DisinheritanceResult, InofficiousnessResult, DeviseReduction, Underprovision, StrippedCondition, TestateValidationResult |
| Collation | CollationResult, ImputationResult, DonationReduction, PartitionAllocation |
| Vacancy | VacantShare, VacancyResolution, VacancyRedistribution |
| Warnings | ValidationWarning (10 variants), ManualReviewFlag (7 variants) |
| Output | HeirDistribution, ComputationOutput, RoundingAdjustment |
| Errors | ComputationError (5 variants) |
| Primitives | Money, HeirId, DonationId, DispositionId, DeviseId, LegacyId, ConditionId |

Total distinct types: **49 structs/enums** across all modules.
