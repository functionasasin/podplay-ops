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

export const RELATIONSHIPS: readonly Relationship[] = [
  "LegitimateChild",
  "LegitimatedChild",
  "AdoptedChild",
  "IllegitimateChild",
  "SurvivingSpouse",
  "LegitimateParent",
  "LegitimateAscendant",
  "Sibling",
  "NephewNiece",
  "OtherCollateral",
  "Stranger",
];

export const FILIATION_PROOFS: readonly FiliationProof[] = [
  "BirthCertificate",
  "FinalJudgment",
  "PublicDocumentAdmission",
  "PrivateHandwrittenAdmission",
  "OpenContinuousPossession",
  "OtherEvidence",
];

export const ADOPTION_REGIMES: readonly AdoptionRegime[] = ["Ra8552", "Ra11642"];

export const LINES_OF_DESCENT: readonly LineOfDescent[] = ["Paternal", "Maternal"];

export const EFFECTIVE_CATEGORIES: readonly EffectiveCategory[] = [
  "LegitimateChildGroup",
  "IllegitimateChildGroup",
  "SurvivingSpouseGroup",
  "LegitimateAscendantGroup",
  "CollateralGroup",
];

export const INHERITANCE_MODES: readonly InheritanceMode[] = ["OwnRight", "Representation"];

export const BLOOD_TYPES: readonly BloodType[] = ["Full", "Half"];

export const SUCCESSION_TYPES: readonly SuccessionType[] = [
  "Testate",
  "Intestate",
  "Mixed",
  "IntestateByPreterition",
];

export const SCENARIO_CODES: readonly ScenarioCode[] = [
  "T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
  "T9", "T10", "T11", "T12", "T13", "T14", "T15",
  "I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
  "I9", "I10", "I11", "I12", "I13", "I14", "I15",
];

export const CONDITION_TYPES: readonly ConditionType[] = ["Suspensive", "Resolutory", "Modal"];

export const CONDITION_STATUSES: readonly ConditionStatus[] = [
  "Pending",
  "Fulfilled",
  "Failed",
  "NotApplicable",
];

export const SUBSTITUTION_TYPES: readonly SubstitutionType[] = [
  "Simple",
  "Reciprocal",
  "Fideicommissary",
];

export const SUBSTITUTION_TRIGGERS: readonly SubstitutionTrigger[] = [
  "Predecease",
  "Renunciation",
  "Incapacity",
];

export const FIDEICOMMISSARY_VALIDATION_RESULTS: readonly FideicommissaryValidationResult[] = [
  "Valid",
  "Invalid",
  "PartialValid",
];

export const DISINHERITANCE_CAUSES: readonly DisinheritanceCause[] = [
  "ChildAttemptOnLife",
  "ChildGroundlessAccusation",
  "ChildAdulteryWithSpouse",
  "ChildFraudUndueInfluence",
  "ChildRefusalToSupport",
  "ChildMaltreatment",
  "ChildDishonorableLife",
  "ChildCivilInterdiction",
  "ParentAbandonmentCorruption",
  "ParentAttemptOnLife",
  "ParentGroundlessAccusation",
  "ParentAdulteryWithSpouse",
  "ParentFraudUndueInfluence",
  "ParentLossParentalAuthority",
  "ParentRefusalToSupport",
  "ParentAttemptOnOther",
  "SpouseAttemptOnLife",
  "SpouseGroundlessAccusation",
  "SpouseFraudUndueInfluence",
  "SpouseCauseLegalSeparation",
  "SpouseLossParentalAuthority",
  "SpouseRefusalToSupport",
];

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
// Display Constants
// ============================================================================

export const EFFECTIVE_CATEGORY_LABELS: Record<EffectiveCategory, string> = {
  LegitimateChildGroup: "Legitimate Child",
  IllegitimateChildGroup: "Illegitimate Child",
  SurvivingSpouseGroup: "Surviving Spouse",
  LegitimateAscendantGroup: "Legitimate Ascendant",
  CollateralGroup: "Collateral Relative",
};

export const SUCCESSION_TYPE_LABELS: Record<SuccessionType, string> = {
  Testate: "Testate Succession",
  Intestate: "Intestate Succession",
  Mixed: "Mixed Succession",
  IntestateByPreterition: "Intestate (Preterition)",
};

export const WARNING_SEVERITY: Record<string, "error" | "warning" | "info"> = {
  preterition: "error",
  inofficiousness: "warning",
  disinheritance: "warning",
  max_restarts: "error",
  vacancy_unresolved: "warning",
  unknown_donee: "info",
};

// ============================================================================
// Utility Functions
// ============================================================================

export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function centavosToPesos(centavos: number | string): number {
  const c = typeof centavos === "string" ? Number(centavos) : centavos;
  return c / 100;
}

export function formatPeso(centavos: number | string): string {
  const c = typeof centavos === "string" ? BigInt(centavos) : BigInt(centavos);
  const pesos = c / 100n;
  const cents = c % 100n;
  const pesosStr = pesos.toLocaleString("en-US");
  if (cents === 0n) {
    return `₱${pesosStr}`;
  }
  return `₱${pesosStr}.${cents.toString().padStart(2, "0")}`;
}

export function serializeCentavos(centavos: number | bigint): number | string {
  if (typeof centavos === "bigint") {
    return centavos <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(centavos)
      : centavos.toString();
  }
  return centavos;
}

export function fracToString(numer: number, denom: number): string {
  return `${numer}/${denom}`;
}

export function stringToFrac(s: string): { numer: number; denom: number } {
  const [n, d] = s.split("/").map(Number) as [number, number];
  return { numer: n, denom: d };
}

// ============================================================================
// Premium Platform Types (§4.2)
// ============================================================================

export type CaseStatus = 'draft' | 'computed' | 'finalized' | 'archived';

export interface CaseRow {
  id: string;
  org_id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  status: CaseStatus;
  input_json: EngineInput | null;
  output_json: EngineOutput | null;
  tax_input_json: object | null;
  tax_output_json: object | null;
  comparison_input_json: EngineInput | null;
  comparison_output_json: EngineOutput | null;
  comparison_ran_at: string | null;
  decedent_name: string | null;
  date_of_death: string | null;
  gross_estate: number | null;
  share_token: string;
  share_enabled: boolean;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export interface CaseListItem {
  id: string;
  title: string;
  status: CaseStatus;
  decedent_name: string | null;
  date_of_death: string | null;
  gross_estate: number | null;
  updated_at: string;
  notes_count: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  firm_name: string | null;
  firm_address: string | null;
  firm_phone: string | null;
  firm_email: string | null;
  counsel_name: string | null;
  ibp_roll_no: string | null;
  ptr_no: string | null;
  mcle_compliance_no: string | null;
  logo_url: string | null;
  letterhead_color: string;
  secondary_color: string;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface CaseNote {
  id: string;
  case_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

/** Valid case status transitions */
export const VALID_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  draft: ['computed'],
  computed: ['finalized'],
  finalized: ['archived'],
  archived: ['finalized'], // admin only
};

// ============================================================================
// Deadline Types (§4.20)
// ============================================================================

export type DeadlineStatus = 'done' | 'overdue' | 'urgent' | 'upcoming' | 'future';

export interface CaseDeadline {
  id: string;
  case_id: string;
  user_id: string;
  milestone_key: string;
  label: string;
  description: string;
  due_date: string;
  completed_date: string | null;
  legal_basis: string;
  is_auto: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export const DEADLINE_STATUS_COLORS: Record<DeadlineStatus, string> = {
  done: 'green',
  overdue: 'red',
  urgent: 'amber',
  upcoming: 'yellow',
  future: 'slate',
};

// ============================================================================
// Document Checklist Types (§4.22)
// ============================================================================

export interface CaseDocument {
  id: string;
  case_id: string;
  user_id: string;
  document_key: string;
  label: string;
  category: string;
  description: string;
  required_when: string;
  is_obtained: boolean;
  is_not_applicable: boolean;
  obtained_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  document_key: string;
  label: string;
  category: string;
  description: string;
  required_when: string;
}

export interface DocumentSeedingContext {
  is_married: boolean;
  has_real_property: boolean;
  has_bank_account: boolean;
  has_business_interest: boolean;
  has_overseas_heir: boolean;
  settlement_track: 'ejs' | 'judicial';
}

export interface DocumentProgress {
  obtained: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Organization / Multi-Seat Types (§4.11)
// ============================================================================

export type OrgPlan = 'solo' | 'team' | 'firm';
export type OrgRole = 'admin' | 'attorney' | 'paralegal' | 'readonly';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  seat_limit: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: string;
}

export interface OrganizationInvitation {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  token: string;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

/** Permission matrix per role (§4.11) */
export const ROLE_PERMISSIONS: Record<OrgRole, {
  canCreateCase: boolean;
  canEditCase: boolean;
  canFinalizeCase: boolean;
  canDeleteCase: boolean;
  canManageClients: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageBilling: boolean;
}> = {
  admin: {
    canCreateCase: true,
    canEditCase: true,
    canFinalizeCase: true,
    canDeleteCase: true,
    canManageClients: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canManageBilling: true,
  },
  attorney: {
    canCreateCase: true,
    canEditCase: true,
    canFinalizeCase: true,
    canDeleteCase: false,
    canManageClients: true,
    canInviteMembers: false,
    canRemoveMembers: false,
    canManageBilling: false,
  },
  paralegal: {
    canCreateCase: true,
    canEditCase: true,
    canFinalizeCase: false,
    canDeleteCase: false,
    canManageClients: true,
    canInviteMembers: false,
    canRemoveMembers: false,
    canManageBilling: false,
  },
  readonly: {
    canCreateCase: false,
    canEditCase: false,
    canFinalizeCase: false,
    canDeleteCase: false,
    canManageClients: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canManageBilling: false,
  },
};

/** Seat limits per plan */
export const PLAN_SEAT_LIMITS: Record<OrgPlan, number> = {
  solo: 1,
  team: 5,
  firm: Infinity,
};
