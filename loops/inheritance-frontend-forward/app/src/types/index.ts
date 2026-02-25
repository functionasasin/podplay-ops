/**
 * TypeScript type definitions for the Philippine Inheritance Distribution Engine frontend.
 * Source of truth: ../inheritance-frontend-reverse/analysis/synthesis/types.ts
 */

// ============================================================================
// Type Aliases
// ============================================================================

export type PersonId = string;
export type HeirId = string;
export type DonationId = string;
export type DispositionId = string;
export type AssetId = string;
export type DateString = string;

// ============================================================================
// Enums (string literal unions)
// ============================================================================

export type Relationship =
  | "LegitimateChild"
  | "LegitimatedChild"
  | "AdoptedChild"
  | "IllegitimateChild"
  | "SurvivingSpouse"
  | "LegitimateParent"
  | "LegitimateAscendant"
  | "Sibling"
  | "NephewNiece"
  | "OtherCollateral"
  | "Stranger";

export type FiliationProof =
  | "BirthCertificate"
  | "FinalJudgment"
  | "PublicDocumentAdmission"
  | "PrivateHandwrittenAdmission"
  | "OpenContinuousPossession"
  | "OtherEvidence";

export type AdoptionRegime = "Ra8552" | "Ra11642";

export type LineOfDescent = "Paternal" | "Maternal";

export type EffectiveCategory =
  | "LegitimateChildGroup"
  | "IllegitimateChildGroup"
  | "SurvivingSpouseGroup"
  | "LegitimateAscendantGroup"
  | "CollateralGroup";

export type InheritanceMode = "OwnRight" | "Representation";

export type BloodType = "Full" | "Half";

export type SuccessionType =
  | "Testate"
  | "Intestate"
  | "Mixed"
  | "IntestateByPreterition";

export type ScenarioCode =
  | "T1" | "T2" | "T3" | "T4" | "T5a" | "T5b" | "T6" | "T7" | "T8"
  | "T9" | "T10" | "T11" | "T12" | "T13" | "T14" | "T15"
  | "I1" | "I2" | "I3" | "I4" | "I5" | "I6" | "I7" | "I8"
  | "I9" | "I10" | "I11" | "I12" | "I13" | "I14" | "I15";

export type ConditionType = "Suspensive" | "Resolutory" | "Modal";

export type ConditionStatus = "Pending" | "Fulfilled" | "Failed" | "NotApplicable";

export type SubstitutionType = "Simple" | "Reciprocal" | "Fideicommissary";

export type SubstitutionTrigger = "Predecease" | "Renunciation" | "Incapacity";

export type FideicommissaryValidationResult = "Valid" | "Invalid" | "PartialValid";

export type DisinheritanceCause =
  | "ChildAttemptOnLife"
  | "ChildGroundlessAccusation"
  | "ChildAdulteryWithSpouse"
  | "ChildFraudUndueInfluence"
  | "ChildRefusalToSupport"
  | "ChildMaltreatment"
  | "ChildDishonorableLife"
  | "ChildCivilInterdiction"
  | "ParentAbandonmentCorruption"
  | "ParentAttemptOnLife"
  | "ParentGroundlessAccusation"
  | "ParentAdulteryWithSpouse"
  | "ParentFraudUndueInfluence"
  | "ParentLossParentalAuthority"
  | "ParentRefusalToSupport"
  | "ParentAttemptOnOther"
  | "SpouseAttemptOnLife"
  | "SpouseGroundlessAccusation"
  | "SpouseFraudUndueInfluence"
  | "SpouseCauseLegalSeparation"
  | "SpouseLossParentalAuthority"
  | "SpouseRefusalToSupport";

// ============================================================================
// Tagged union types
// ============================================================================

export type ShareSpec =
  | { Fraction: string }
  | "EqualWithOthers"
  | "EntireEstate"
  | "EntireFreePort"
  | "Unspecified"
  | "Residuary";

export type LegacySpec =
  | { FixedAmount: Money }
  | { SpecificAsset: AssetId }
  | { GenericClass: [string, Money] };

export type DeviseSpec =
  | { SpecificProperty: AssetId }
  | { FractionalInterest: [AssetId, string] };

// ============================================================================
// Enum value arrays (for runtime validation and UI dropdowns)
// ============================================================================

export const RELATIONSHIPS: readonly Relationship[] = [];

export const FILIATION_PROOFS: readonly FiliationProof[] = [];

export const ADOPTION_REGIMES: readonly AdoptionRegime[] = [];

export const LINES_OF_DESCENT: readonly LineOfDescent[] = [];

export const EFFECTIVE_CATEGORIES: readonly EffectiveCategory[] = [];

export const INHERITANCE_MODES: readonly InheritanceMode[] = [];

export const BLOOD_TYPES: readonly BloodType[] = [];

export const SUCCESSION_TYPES: readonly SuccessionType[] = [];

export const SCENARIO_CODES: readonly ScenarioCode[] = [];

export const CONDITION_TYPES: readonly ConditionType[] = [];

export const CONDITION_STATUSES: readonly ConditionStatus[] = [];

export const SUBSTITUTION_TYPES: readonly SubstitutionType[] = [];

export const SUBSTITUTION_TRIGGERS: readonly SubstitutionTrigger[] = [];

export const FIDEICOMMISSARY_VALIDATION_RESULTS: readonly FideicommissaryValidationResult[] = [];

export const DISINHERITANCE_CAUSES: readonly DisinheritanceCause[] = [];

// ============================================================================
// Interfaces
// ============================================================================

export interface Money {
  centavos: number | string;
}

export interface EngineInput {
  net_distributable_estate: Money;
  decedent: Decedent;
  family_tree: Person[];
  will: Will | null;
  donations: Donation[];
  config: EngineConfig;
}

export interface EngineConfig {
  retroactive_ra_11642: boolean;
  max_pipeline_restarts: number;
}

export interface Decedent {
  id: PersonId;
  name: string;
  date_of_death: DateString;
  is_married: boolean;
  date_of_marriage: DateString | null;
  marriage_solemnized_in_articulo_mortis: boolean;
  was_ill_at_marriage: boolean;
  illness_caused_death: boolean;
  years_of_cohabitation: number;
  has_legal_separation: boolean;
  is_illegitimate: boolean;
}

export interface Person {
  id: PersonId;
  name: string;
  is_alive_at_succession: boolean;
  relationship_to_decedent: Relationship;
  degree: number;
  line: LineOfDescent | null;
  children: PersonId[];
  filiation_proved: boolean;
  filiation_proof_type: FiliationProof | null;
  is_guilty_party_in_legal_separation: boolean;
  adoption: Adoption | null;
  is_unworthy: boolean;
  unworthiness_condoned: boolean;
  has_renounced: boolean;
  blood_type: BloodType | null;
}

export interface Adoption {
  decree_date: DateString;
  regime: AdoptionRegime;
  adopter: PersonId;
  adoptee: PersonId;
  is_stepparent_adoption: boolean;
  biological_parent_spouse: PersonId | null;
  is_rescinded: boolean;
  rescission_date: DateString | null;
}

export interface Will {
  institutions: InstitutionOfHeir[];
  legacies: Legacy[];
  devises: Devise[];
  disinheritances: Disinheritance[];
  date_executed: DateString;
}

export interface HeirReference {
  person_id: PersonId | null;
  name: string;
  is_collective: boolean;
  class_designation: string | null;
}

export interface InstitutionOfHeir {
  id: DispositionId;
  heir: HeirReference;
  share: ShareSpec;
  conditions: Condition[];
  substitutes: Substitute[];
  is_residuary: boolean;
}

export interface Legacy {
  id: DispositionId;
  legatee: HeirReference;
  property: LegacySpec;
  conditions: Condition[];
  substitutes: Substitute[];
  is_preferred: boolean;
}

export interface Devise {
  id: DispositionId;
  devisee: HeirReference;
  property: DeviseSpec;
  conditions: Condition[];
  substitutes: Substitute[];
  is_preferred: boolean;
}

export interface Condition {
  condition_type: ConditionType;
  description: string;
  status: ConditionStatus;
}

export interface Substitute {
  substitution_type: SubstitutionType;
  substitute_heir: HeirReference;
  triggers: SubstitutionTrigger[];
}

export interface FideicommissarySubstitution {
  fiduciary: HeirReference;
  fideicommissary: HeirReference;
  property_scope: ShareSpec;
  is_express: boolean;
  is_valid: boolean;
  invalidity_reason: string | null;
}

export interface Disinheritance {
  heir_reference: HeirReference;
  cause_code: DisinheritanceCause;
  cause_specified_in_will: boolean;
  cause_proven: boolean;
  reconciliation_occurred: boolean;
}

export interface Donation {
  id: DonationId;
  recipient_heir_id: HeirId | null;
  recipient_is_stranger: boolean;
  value_at_time_of_donation: Money;
  date: DateString;
  description: string;
  is_expressly_exempt: boolean;
  is_support_education_medical: boolean;
  is_customary_gift: boolean;
  is_professional_expense: boolean;
  professional_expense_parent_required: boolean;
  professional_expense_imputed_savings: Money | null;
  is_joint_from_both_parents: boolean;
  is_to_child_spouse_only: boolean;
  is_joint_to_child_and_spouse: boolean;
  is_wedding_gift: boolean;
  is_debt_payment_for_child: boolean;
  is_election_expense: boolean;
  is_fine_payment: boolean;
}

export interface EngineOutput {
  per_heir_shares: InheritanceShare[];
  narratives: HeirNarrative[];
  computation_log: ComputationLog;
  warnings: ManualFlag[];
  succession_type: SuccessionType;
  scenario_code: ScenarioCode;
}

export interface InheritanceShare {
  heir_id: HeirId;
  heir_name: string;
  heir_category: EffectiveCategory;
  inherits_by: InheritanceMode;
  represents: HeirId | null;
  from_legitime: Money;
  from_free_portion: Money;
  from_intestate: Money;
  total: Money;
  legitime_fraction: string;
  legal_basis: string[];
  donations_imputed: Money;
  gross_entitlement: Money;
  net_from_estate: Money;
}

export interface HeirNarrative {
  heir_id: HeirId;
  heir_name: string;
  heir_category_label: string;
  text: string;
}

export interface ComputationLog {
  steps: StepLog[];
  total_restarts: number;
  final_scenario: string;
}

export interface StepLog {
  step_number: number;
  step_name: string;
  description: string;
}

export interface ManualFlag {
  category: string;
  description: string;
  related_heir_id: HeirId | null;
}

// ============================================================================
// Display Constants (stubs)
// ============================================================================

export const EFFECTIVE_CATEGORY_LABELS = {} as Record<EffectiveCategory, string>;

export const SUCCESSION_TYPE_LABELS = {} as Record<SuccessionType, string>;

export const WARNING_SEVERITY = {} as Record<string, "error" | "warning" | "info">;

// ============================================================================
// Utility Functions (stubs — implementation in next iteration)
// ============================================================================

export function pesosToCentavos(_pesos: number): number {
  return 0;
}

export function centavosToPesos(_centavos: number | string): number {
  return 0;
}

export function formatPeso(_centavos: number | string): string {
  return "";
}

export function serializeCentavos(_centavos: number | bigint): number | string {
  return 0;
}

export function fracToString(_numer: number, _denom: number): string {
  return "";
}

export function stringToFrac(_s: string): { numer: number; denom: number } {
  return { numer: 0, denom: 0 };
}
