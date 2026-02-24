//! Data model types from Spec §3.
//!
//! All types needed for the Philippine Inheritance Distribution Engine.

use num_bigint::BigInt;
use serde::{Deserialize, Serialize};

use crate::fraction::Frac;

// ── Primitive aliases ──────────────────────────────────────────────

pub type HeirId = String;
pub type DonationId = String;
pub type DispositionId = String;
pub type AssetId = String;
pub type PersonId = String;
/// ISO-8601 date string, e.g. "2026-01-15"
pub type Date = String;

// ── Money ──────────────────────────────────────────────────────────

/// Monetary value in centavos (₱1.00 = 100 centavos).
/// Only used for input and final output — all intermediate computation uses Frac.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Money {
    pub centavos: BigInt,
}

impl Money {
    pub fn new(centavos: i64) -> Self {
        Self {
            centavos: BigInt::from(centavos),
        }
    }

    /// Create from peso amount (e.g. 1_000_000 pesos).
    pub fn from_pesos(pesos: i64) -> Self {
        Self {
            centavos: BigInt::from(pesos) * BigInt::from(100),
        }
    }
}

// ── Enums ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum LineOfDescent {
    Paternal,
    Maternal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Relationship {
    LegitimateChild,
    LegitimatedChild,
    AdoptedChild,
    IllegitimateChild,
    SurvivingSpouse,
    LegitimateParent,
    LegitimateAscendant,
    Sibling,
    NephewNiece,
    OtherCollateral,
    Stranger,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum FiliationProof {
    BirthCertificate,
    FinalJudgment,
    PublicDocumentAdmission,
    PrivateHandwrittenAdmission,
    OpenContinuousPossession,
    OtherEvidence,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AdoptionRegime {
    Ra8552,
    Ra11642,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum HeirCategory {
    LegitimateChild,
    LegitimatedChild,
    AdoptedChild,
    IllegitimateChild,
    SurvivingSpouse,
    LegitimateParent,
    LegitimateAscendant,
    // Non-compulsory intestate heir categories
    Sibling,
    NephewNiece,
    OtherCollateral,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum EffectiveCategory {
    LegitimateChildGroup,
    IllegitimateChildGroup,
    SurvivingSpouseGroup,
    LegitimateAscendantGroup,
    /// Non-compulsory collateral heirs (siblings, nephews/nieces, other collaterals).
    CollateralGroup,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum InheritanceMode {
    OwnRight,
    Representation,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RepresentationTrigger {
    Predecease,
    Disinheritance,
    Incapacity,
    Unworthiness,
    // Note: RENUNCIATION is NOT a trigger (Art. 977)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BloodType {
    Full,
    Half,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SuccessionType {
    Testate,
    Intestate,
    Mixed,
    IntestateByPreterition,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ConditionType {
    Suspensive,
    Resolutory,
    Modal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ConditionStatus {
    Pending,
    Fulfilled,
    Failed,
    NotApplicable,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SubstitutionType {
    Simple,
    Reciprocal,
    Fideicommissary,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SubstitutionTrigger {
    Predecease,
    Renunciation,
    Incapacity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum FideicommissaryValidationResult {
    Valid,
    Invalid,
    PartialValid,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DisinheritanceCause {
    // Art. 919 — Children/descendants
    ChildAttemptOnLife,
    ChildGroundlessAccusation,
    ChildAdulteryWithSpouse,
    ChildFraudUndueInfluence,
    ChildRefusalToSupport,
    ChildMaltreatment,
    ChildDishonorableLife,
    ChildCivilInterdiction,
    // Art. 920 — Parents/ascendants
    ParentAbandonmentCorruption,
    ParentAttemptOnLife,
    ParentGroundlessAccusation,
    ParentAdulteryWithSpouse,
    ParentFraudUndueInfluence,
    ParentLossParentalAuthority,
    ParentRefusalToSupport,
    ParentAttemptOnOther,
    // Art. 921 — Spouse
    SpouseAttemptOnLife,
    SpouseGroundlessAccusation,
    SpouseFraudUndueInfluence,
    SpouseCauseLegalSeparation,
    SpouseLossParentalAuthority,
    SpouseRefusalToSupport,
}

// ── Scenario Codes ─────────────────────────────────────────────────

/// All 30 scenario codes (15 testate + 15 intestate) from Spec §3.7.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ScenarioCode {
    // Testate
    T1,
    T2,
    T3,
    T4,
    T5a,
    T5b,
    T6,
    T7,
    T8,
    T9,
    T10,
    T11,
    T12,
    T13,
    T14,
    T15,
    // Intestate
    I1,
    I2,
    I3,
    I4,
    I5,
    I6,
    I7,
    I8,
    I9,
    I10,
    I11,
    I12,
    I13,
    I14,
    I15,
}

// ── Structs — Input ────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineInput {
    pub net_distributable_estate: Money,
    pub decedent: Decedent,
    pub family_tree: Vec<Person>,
    pub will: Option<Will>,
    pub donations: Vec<Donation>,
    pub config: EngineConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Decedent {
    pub id: PersonId,
    pub name: String,
    pub date_of_death: Date,
    pub is_married: bool,
    pub date_of_marriage: Option<Date>,
    pub marriage_solemnized_in_articulo_mortis: bool,
    pub was_ill_at_marriage: bool,
    pub illness_caused_death: bool,
    pub years_of_cohabitation: i32,
    pub has_legal_separation: bool,
    pub is_illegitimate: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    pub id: PersonId,
    pub name: String,
    pub is_alive_at_succession: bool,
    pub relationship_to_decedent: Relationship,
    pub degree: i32,
    pub line: Option<LineOfDescent>,
    pub children: Vec<PersonId>,
    pub filiation_proved: bool,
    pub filiation_proof_type: Option<FiliationProof>,
    pub is_guilty_party_in_legal_separation: bool,
    pub adoption: Option<Adoption>,
    pub is_unworthy: bool,
    pub unworthiness_condoned: bool,
    pub has_renounced: bool,
    /// Blood type for collateral heirs (siblings): Full or Half.
    pub blood_type: Option<BloodType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Adoption {
    pub decree_date: Date,
    pub regime: AdoptionRegime,
    pub adopter: PersonId,
    pub adoptee: PersonId,
    pub is_stepparent_adoption: bool,
    pub biological_parent_spouse: Option<PersonId>,
    pub is_rescinded: bool,
    pub rescission_date: Option<Date>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineConfig {
    pub retroactive_ra_11642: bool,
    pub max_pipeline_restarts: i32,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            retroactive_ra_11642: false,
            max_pipeline_restarts: 10,
        }
    }
}

// ── Structs — Will & Testamentary Dispositions ─────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Will {
    pub institutions: Vec<InstitutionOfHeir>,
    pub legacies: Vec<Legacy>,
    pub devises: Vec<Devise>,
    pub disinheritances: Vec<Disinheritance>,
    pub date_executed: Date,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstitutionOfHeir {
    pub id: DispositionId,
    pub heir: HeirReference,
    pub share: ShareSpec,
    pub conditions: Vec<Condition>,
    pub substitutes: Vec<Substitute>,
    pub is_residuary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ShareSpec {
    Fraction(Frac),
    EqualWithOthers,
    EntireEstate,
    EntireFreePort,
    Unspecified,
    Residuary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeirReference {
    pub person_id: Option<PersonId>,
    pub name: String,
    pub is_collective: bool,
    pub class_designation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Legacy {
    pub id: DispositionId,
    pub legatee: HeirReference,
    pub property: LegacySpec,
    pub conditions: Vec<Condition>,
    pub substitutes: Vec<Substitute>,
    pub is_preferred: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LegacySpec {
    FixedAmount(Money),
    SpecificAsset(AssetId),
    GenericClass(String, Money),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Devise {
    pub id: DispositionId,
    pub devisee: HeirReference,
    pub property: DeviseSpec,
    pub conditions: Vec<Condition>,
    pub substitutes: Vec<Substitute>,
    pub is_preferred: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DeviseSpec {
    SpecificProperty(AssetId),
    FractionalInterest(AssetId, Frac),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Condition {
    pub condition_type: ConditionType,
    pub description: String,
    pub status: ConditionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Substitute {
    pub substitution_type: SubstitutionType,
    pub substitute_heir: HeirReference,
    pub triggers: Vec<SubstitutionTrigger>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FideicommissarySubstitution {
    pub fiduciary: HeirReference,
    pub fideicommissary: HeirReference,
    pub property_scope: ShareSpec,
    pub is_express: bool,
    pub is_valid: bool,
    pub invalidity_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Disinheritance {
    pub heir_reference: HeirReference,
    pub cause_code: DisinheritanceCause,
    pub cause_specified_in_will: bool,
    pub cause_proven: bool,
    pub reconciliation_occurred: bool,
}

// ── Structs — Donation ─────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Donation {
    pub id: DonationId,
    pub recipient_heir_id: Option<HeirId>,
    pub recipient_is_stranger: bool,
    pub value_at_time_of_donation: Money,
    pub date: Date,
    pub description: String,
    pub is_expressly_exempt: bool,
    pub is_support_education_medical: bool,
    pub is_customary_gift: bool,
    pub is_professional_expense: bool,
    pub professional_expense_parent_required: bool,
    pub professional_expense_imputed_savings: Option<Money>,
    pub is_joint_from_both_parents: bool,
    pub is_to_child_spouse_only: bool,
    pub is_joint_to_child_and_spouse: bool,
    pub is_wedding_gift: bool,
    pub is_debt_payment_for_child: bool,
    pub is_election_expense: bool,
    pub is_fine_payment: bool,
}

// ── Structs — Classified Heir (pipeline internal) ──────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Heir {
    pub id: HeirId,
    pub name: String,
    pub raw_category: HeirCategory,
    pub effective_category: EffectiveCategory,
    pub is_compulsory: bool,
    pub is_alive: bool,
    pub is_eligible: bool,
    pub filiation_proved: bool,
    pub filiation_proof_type: Option<FiliationProof>,
    pub is_unworthy: bool,
    pub unworthiness_condoned: bool,
    pub is_disinherited: bool,
    pub disinheritance_valid: bool,
    pub has_renounced: bool,
    pub adoption: Option<Adoption>,
    pub has_valid_adoption: bool,
    pub is_stepparent_adoptee: bool,
    pub legal_separation_guilty: bool,
    pub articulo_mortis_marriage: bool,
    pub degree_from_decedent: i32,
    pub line: Option<LineOfDescent>,
    pub blood_type: Option<BloodType>,
    pub representation_trigger: Option<RepresentationTrigger>,
    pub represented_by: Vec<HeirId>,
    pub represents: Option<HeirId>,
    pub inherits_by: InheritanceMode,
    pub line_ancestor: Option<HeirId>,
    pub children: Vec<HeirId>,
}

// ── Structs — Output ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineOutput {
    pub per_heir_shares: Vec<InheritanceShare>,
    pub narratives: Vec<HeirNarrative>,
    pub computation_log: ComputationLog,
    pub warnings: Vec<ManualFlag>,
    pub succession_type: SuccessionType,
    pub scenario_code: ScenarioCode,
}

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeirNarrative {
    pub heir_id: HeirId,
    pub heir_name: String,
    pub heir_category_label: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputationLog {
    pub steps: Vec<StepLog>,
    pub total_restarts: i32,
    pub final_scenario: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepLog {
    pub step_number: i32,
    pub step_name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualFlag {
    pub category: String,
    pub description: String,
    pub related_heir_id: Option<HeirId>,
}
