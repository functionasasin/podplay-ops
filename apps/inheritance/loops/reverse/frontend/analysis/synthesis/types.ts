/**
 * Complete TypeScript type definitions for the Philippine Inheritance
 * Distribution Engine frontend.
 *
 * Assembled from Wave 1 analysis of the Rust engine source at
 * ../inheritance-rust-forward/src/types.rs and related pipeline files.
 *
 * Every interface, type alias, and enum mirrors the exact Rust type
 * and its JSON serialization format. Comments reference the originating
 * Rust source file and line number.
 *
 * Key serialization conventions:
 * - All JSON field names are snake_case (no rename_all in Rust serde)
 * - All enums serialize as PascalCase strings (Rust derive default)
 * - Money: { centavos: number | string } (custom serde, types.rs:31-70)
 * - Frac: "numer/denom" string (custom serde, fraction.rs:241-264)
 * - Option<T>: T | null in JSON
 * - Vec<T>: T[] in JSON (can be empty [])
 * - Date: ISO-8601 "YYYY-MM-DD" string (type alias for String)
 * - PersonId, HeirId, DonationId, DispositionId, AssetId: plain strings
 */

// ============================================================================
// Type Aliases (types.rs:6-18)
// ============================================================================

/** Unique identifier for a person. Plain string. (types.rs:8) */
export type PersonId = string;

/** Unique identifier for a classified heir. Plain string. (types.rs:10) */
export type HeirId = string;

/** Unique identifier for a donation. Plain string. (types.ts:9) */
export type DonationId = string;

/** Unique identifier for a testamentary disposition. Plain string. (types.rs:14) */
export type DispositionId = string;

/** Unique identifier for a named asset. Plain string. (types.rs:15) */
export type AssetId = string;

/** ISO-8601 date string: "YYYY-MM-DD". (types.rs:18) */
export type DateString = string;

// ============================================================================
// Money (types.rs:22-85)
// ============================================================================

/**
 * Monetary value in centavos (₱1.00 = 100 centavos).
 * Custom serde at types.rs:31-70.
 *
 * JSON wire format: {"centavos": <number|string>}
 * - Small values: {"centavos": 100000000} (₱1,000,000)
 * - Large values: {"centavos": "99999999999999999999"} (exceeds Number.MAX_SAFE_INTEGER)
 *
 * Frontend: display as pesos (centavos / 100) with ₱ prefix.
 * Accept user input in pesos, convert to centavos (* 100) for JSON.
 */
// Mirrors: types.rs:22-29
export interface Money {
  /** Value in centavos. Number for safe integers, string for large values. */
  centavos: number | string;
}

// ============================================================================
// Enums — Relationship & Classification (types.rs:95-170)
// ============================================================================

/**
 * Relationship of a family member to the decedent.
 * Determines HeirCategory classification in Step 1.
 * Mirrors: types.rs:95-108
 * Serializes as PascalCase string.
 */
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

/**
 * Filiation proof method for illegitimate children.
 * FC Art. 172, 176. Informational — engine checks filiation_proved bool only.
 * Mirrors: types.rs:110-118
 */
export type FiliationProof =
  | "BirthCertificate"
  | "FinalJudgment"
  | "PublicDocumentAdmission"
  | "PrivateHandwrittenAdmission"
  | "OpenContinuousPossession"
  | "OtherEvidence";

/**
 * Adoption law regime.
 * Mirrors: types.rs:121-124
 */
export type AdoptionRegime = "Ra8552" | "Ra11642";

/**
 * Line of descent for ascendant heirs.
 * Used in step5_legitimes.rs:488-493 for paternal/maternal split.
 * Mirrors: types.rs:127-130 (inferred from usage)
 */
export type LineOfDescent = "Paternal" | "Maternal";

/**
 * Effective heir category after classification normalization.
 * Used in Step 3 scenario selection and Step 5 legitime computation.
 * Mirrors: types.rs:142-149
 */
export type EffectiveCategory =
  | "LegitimateChildGroup"
  | "IllegitimateChildGroup"
  | "SurvivingSpouseGroup"
  | "LegitimateAscendantGroup"
  | "CollateralGroup";

/**
 * Whether the heir inherits by their own right or by representation.
 * Mirrors: types.rs:151-155
 */
export type InheritanceMode = "OwnRight" | "Representation";

/**
 * Blood relationship for siblings — Full (2 units) or Half (1 unit).
 * Art. 1006: full-blood inherits double the share of half-blood.
 * Mirrors: types.rs:166-170
 */
export type BloodType = "Full" | "Half";

// ============================================================================
// Enums — Succession & Scenario (types.rs:173-283)
// ============================================================================

/**
 * Final succession type determined by the engine.
 * Mirrors: types.rs:173-178
 */
export type SuccessionType =
  | "Testate"
  | "Intestate"
  | "Mixed"
  | "IntestateByPreterition";

/**
 * Scenario code identifying the specific heir-group configuration.
 * T-codes for testate/mixed, I-codes for intestate.
 * Note: T5a and T5b have lowercase letter suffixes.
 * Mirrors: types.rs:248-283
 */
export type ScenarioCode =
  | "T1" | "T2" | "T3" | "T4" | "T5a" | "T5b" | "T6" | "T7" | "T8"
  | "T9" | "T10" | "T11" | "T12" | "T13" | "T14" | "T15"
  | "I1" | "I2" | "I3" | "I4" | "I5" | "I6" | "I7" | "I8"
  | "I9" | "I10" | "I11" | "I12" | "I13" | "I14" | "I15";

// ============================================================================
// Enums — Condition & Substitute (types.rs:181-214)
// ============================================================================

/**
 * Types of conditions attached to testamentary dispositions.
 * Mirrors: types.rs:181-185
 */
export type ConditionType = "Suspensive" | "Resolutory" | "Modal";

/**
 * Evaluation status of a condition.
 * Mirrors: types.rs:188-193
 */
export type ConditionStatus = "Pending" | "Fulfilled" | "Failed" | "NotApplicable";

/**
 * Types of testamentary substitution.
 * Mirrors: types.rs:196-200
 */
export type SubstitutionType = "Simple" | "Reciprocal" | "Fideicommissary";

/**
 * Events that can trigger a substitution.
 * Mirrors: types.rs:203-207
 */
export type SubstitutionTrigger = "Predecease" | "Renunciation" | "Incapacity";

/**
 * Result of fideicommissary substitution validity check.
 * NOT consumed by any current pipeline step.
 * Mirrors: types.rs:210-214
 */
export type FideicommissaryValidationResult = "Valid" | "Invalid" | "PartialValid";

// ============================================================================
// Enums — Disinheritance Cause (types.rs:217-243)
// ============================================================================

/**
 * Cause codes for disinheritance, grouped by relationship article.
 * - Art. 919: Children/descendants (8 causes, prefix "Child")
 * - Art. 920: Parents/ascendants (8 causes, prefix "Parent")
 * - Art. 921: Spouse (6 causes, prefix "Spouse")
 * Mirrors: types.rs:217-243
 * Serializes as PascalCase string.
 */
export type DisinheritanceCause =
  // Art. 919 — Children/descendants
  | "ChildAttemptOnLife"
  | "ChildGroundlessAccusation"
  | "ChildAdulteryWithSpouse"
  | "ChildFraudUndueInfluence"
  | "ChildRefusalToSupport"
  | "ChildMaltreatment"
  | "ChildDishonorableLife"
  | "ChildCivilInterdiction"
  // Art. 920 — Parents/ascendants
  | "ParentAbandonmentCorruption"
  | "ParentAttemptOnLife"
  | "ParentGroundlessAccusation"
  | "ParentAdulteryWithSpouse"
  | "ParentFraudUndueInfluence"
  | "ParentLossParentalAuthority"
  | "ParentRefusalToSupport"
  | "ParentAttemptOnOther"
  // Art. 921 — Spouse
  | "SpouseAttemptOnLife"
  | "SpouseGroundlessAccusation"
  | "SpouseFraudUndueInfluence"
  | "SpouseCauseLegalSeparation"
  | "SpouseLossParentalAuthority"
  | "SpouseRefusalToSupport";

// ============================================================================
// Input Structs — Core
// ============================================================================

/**
 * Top-level engine input. The single JSON payload sent to the engine.
 * Mirrors: types.rs:287-295
 * All fields required in JSON (no serde defaults on this struct).
 */
export interface EngineInput {
  /** Net distributable estate in centavos. Required. */
  net_distributable_estate: Money;

  /** Decedent information. Required. */
  decedent: Decedent;

  /** All heirs and relatives in the family tree. Can be empty []. */
  family_tree: Person[];

  /** Will data. null for intestate succession. */
  will: Will | null;

  /** Prior donations subject to collation. Can be empty []. */
  donations: Donation[];

  /** Engine configuration flags. Required. */
  config: EngineConfig;
}

/**
 * Engine configuration flags.
 * Mirrors: types.rs:344-348
 * Default impl at types.rs:350-357 (not invoked by serde — both fields required in JSON).
 */
export interface EngineConfig {
  /**
   * Whether to apply RA 11642 retroactively to RA 8552 adoptions.
   * NOTE: NOT consumed by any pipeline step in the current engine.
   * Forward-looking config flag.
   * Default: false
   */
  retroactive_ra_11642: boolean;

  /**
   * Maximum number of pipeline restarts before emitting "max_restarts" warning.
   * Consumed at: pipeline.rs:131,237 -> step9_vacancy.rs:148
   * Default: 10. Must be >= 1.
   */
  max_pipeline_restarts: number;
}

/**
 * Decedent information.
 * Mirrors: types.rs:297-310
 * All fields required in JSON.
 */
export interface Decedent {
  /** Unique identifier for the decedent. Auto-generated ("d"). */
  id: PersonId;

  /** Full name of the decedent. */
  name: string;

  /** Date of death (ISO-8601). */
  date_of_death: DateString;

  /**
   * Whether the decedent was married at time of death.
   * NOTE: NOT consumed by pipeline — spouse presence from family_tree.
   * Used to gate marriage sub-section in wizard UI.
   */
  is_married: boolean;

  /** Date of marriage (ISO-8601). null when is_married is false. */
  date_of_marriage: DateString | null;

  /**
   * Articulo mortis condition 1/4 (Art. 900).
   * Pipeline: step1_classify.rs:227, step5_legitimes.rs:432
   */
  marriage_solemnized_in_articulo_mortis: boolean;

  /**
   * Articulo mortis condition 2/4 (Art. 900).
   * Pipeline: step1_classify.rs:228, step5_legitimes.rs:433
   */
  was_ill_at_marriage: boolean;

  /**
   * Articulo mortis condition 3/4 (Art. 900).
   * Pipeline: step1_classify.rs:229, step5_legitimes.rs:434
   */
  illness_caused_death: boolean;

  /**
   * Articulo mortis condition 4/4: must be < 5 for reduction to apply.
   * Pipeline: step1_classify.rs:230, step5_legitimes.rs:435
   */
  years_of_cohabitation: number;

  /**
   * Whether the decedent had a legal separation decree.
   * NOTE: NOT consumed by pipeline — actual exclusion on Person.is_guilty_party.
   * Used to gate guilty-party question on spouse in UI.
   */
  has_legal_separation: boolean;

  /**
   * Whether the decedent was illegitimate (born out of wedlock).
   * Drives Art. 903 scenario selection: T14/T15.
   * Pipeline: step3_scenario.rs:133
   */
  is_illegitimate: boolean;
}

/**
 * A family member of the decedent who may be an heir.
 * Mirrors: types.rs:312-330
 */
export interface Person {
  /** Unique identifier within the case. */
  id: PersonId;

  /** Display name. Required, non-empty. */
  name: string;

  /** Whether this person is alive at the time of the decedent's death. */
  is_alive_at_succession: boolean;

  /** Relationship to the decedent. Determines HeirCategory classification. */
  relationship_to_decedent: Relationship;

  /**
   * Degree of kinship from the decedent (1-5).
   * Art. 1010: collaterals beyond 5th degree cannot inherit.
   */
  degree: number;

  /**
   * Line of descent — Paternal or Maternal.
   * Required for LegitimateParent / LegitimateAscendant.
   * null for all other relationship types.
   */
  line: LineOfDescent | null;

  /**
   * IDs of this person's children who also appear in family_tree.
   * Used for representation line-building (step2_lines.rs:235).
   */
  children: PersonId[];

  /**
   * Whether filiation has been duly proved (FC Art. 172, 176).
   * CRITICAL for IllegitimateChild: if false, heir is INELIGIBLE
   * (step1_classify.rs:178, Art. 887 para 3).
   */
  filiation_proved: boolean;

  /**
   * Type of filiation proof, if applicable.
   * Only meaningful when relationship is IllegitimateChild.
   * Informational — engine checks filiation_proved boolean only.
   */
  filiation_proof_type: FiliationProof | null;

  /**
   * Whether this person is the guilty party in legal separation.
   * Only relevant for SurvivingSpouse: if true, INELIGIBLE
   * (step1_classify.rs:195, Art. 1002).
   */
  is_guilty_party_in_legal_separation: boolean;

  /**
   * Adoption record. REQUIRED when relationship is AdoptedChild.
   * If null for AdoptedChild, heir is INELIGIBLE (step1_classify.rs:188-189).
   * null for all other relationship types.
   */
  adoption: Adoption | null;

  /**
   * Whether declared unworthy (Art. 1032).
   * If true AND unworthiness_condoned is false, INELIGIBLE (step1_classify.rs:200).
   */
  is_unworthy: boolean;

  /**
   * Whether the decedent condoned the unworthiness (Art. 1033).
   * Only meaningful when is_unworthy is true.
   */
  unworthiness_condoned: boolean;

  /**
   * Whether this person has renounced their inheritance.
   * Art. 977: renunciation is NOT a representation trigger.
   */
  has_renounced: boolean;

  /**
   * Blood type for siblings: Full (2 units) / Half (1 unit).
   * Art. 1006: full-blood inherits double the share of half-blood.
   * null for all non-Sibling relationship types.
   */
  blood_type: BloodType | null;
}

/**
 * Adoption record for a Person with relationship = "AdoptedChild".
 * Mirrors: types.rs:333-342
 */
export interface Adoption {
  /** Date the adoption decree was issued. ISO-8601. */
  decree_date: DateString;

  /** Which adoption law governs: "Ra8552" or "Ra11642". */
  regime: AdoptionRegime;

  /** PersonId of the adopting parent (typically the decedent). */
  adopter: PersonId;

  /** PersonId of the adopted person (same as the owning Person.id). */
  adoptee: PersonId;

  /** Whether this is a stepparent adoption. */
  is_stepparent_adoption: boolean;

  /**
   * PersonId of the biological parent who is the spouse of the adopter.
   * Only relevant when is_stepparent_adoption is true. null otherwise.
   */
  biological_parent_spouse: PersonId | null;

  /**
   * Whether the adoption has been rescinded by court order.
   * RA 8552 Sec. 20: rescission removes all succession rights.
   * step1_classify.rs:184-187
   */
  is_rescinded: boolean;

  /**
   * Date of the rescission decree. null when not rescinded.
   * Required when is_rescinded is true.
   */
  rescission_date: DateString | null;
}

// ============================================================================
// Input Structs — Will & Dispositions
// ============================================================================

/**
 * A last will and testament containing testamentary dispositions.
 * Mirrors: types.rs:362-368
 *
 * In EngineInput, will is Will | null:
 * - null -> intestate succession
 * - present -> testate or mixed succession
 */
export interface Will {
  /** Institutions of heir — appointments with share allocations. Can be []. */
  institutions: InstitutionOfHeir[];

  /** Legacies — bequests of personal property or money. Can be []. */
  legacies: Legacy[];

  /** Devises — bequests of real property. Can be []. */
  devises: Devise[];

  /** Disinheritances — explicit exclusions of compulsory heirs. Can be []. */
  disinheritances: Disinheritance[];

  /** Date the will was executed/signed. ISO-8601. */
  date_executed: DateString;
}

/**
 * Reference to an heir — either a person in the family tree or an
 * external entity (charity, friend, etc.).
 * Mirrors: types.rs:391-396
 *
 * Used in: InstitutionOfHeir.heir, Legacy.legatee, Devise.devisee,
 * Substitute.substitute_heir, Disinheritance.heir_reference.
 */
export interface HeirReference {
  /**
   * ID of a person in the family_tree, or null for external entities.
   * When null, the heir is identified by name only (stranger).
   */
  person_id: PersonId | null;

  /** Display name of the heir. Required even when person_id is set. */
  name: string;

  /** Whether this is a class/collective gift. */
  is_collective: boolean;

  /**
   * Class designation label (e.g., "legitimate children", "grandchildren").
   * Only meaningful when is_collective is true. null otherwise.
   */
  class_designation: string | null;
}

/**
 * Share specification — how much of the estate the heir receives.
 * Mirrors: types.rs:381-388
 *
 * Serde externally-tagged format:
 * - Unit variants -> bare JSON string: "EntireEstate", "EntireFreePort",
 *   "EqualWithOthers", "Unspecified", "Residuary"
 * - Newtype variant -> tagged object: {"Fraction": "1/2"}
 *   (Frac serializes as "numer/denom" string, NOT {numer, denom} object)
 *
 * Step 7 resolution (step7_distribute.rs:143-151):
 * - Fraction(f) -> estate_base * f
 * - EntireEstate -> estate_base
 * - EntireFreePort -> fp_disposable
 * - EqualWithOthers -> 0 (deferred to co-heir counting)
 * - Unspecified -> 0
 * - Residuary -> 0 (handled by is_residuary flag)
 */
export type ShareSpec =
  | { Fraction: string }  // Frac as "numer/denom" string, e.g. "1/2", "1/4"
  | "EqualWithOthers"
  | "EntireEstate"
  | "EntireFreePort"
  | "Unspecified"
  | "Residuary";

/**
 * An institution of heir — a testamentary appointment of a person
 * to inherit a share of the estate.
 * Mirrors: types.rs:371-378
 */
export interface InstitutionOfHeir {
  /** Unique disposition identifier. Must be unique across all will dispositions. */
  id: DispositionId;

  /** Reference to the heir being instituted. */
  heir: HeirReference;

  /** The share specification. */
  share: ShareSpec;

  /** Conditions attached to this institution. */
  conditions: Condition[];

  /** Testamentary substitutes for this institution. */
  substitutes: Substitute[];

  /**
   * Whether this institution is a residuary clause.
   * Residuary captures ALL remaining FP after other dispositions.
   * step7_distribute.rs:987-994: disposes_of_entire_estate = true.
   */
  is_residuary: boolean;
}

/**
 * Specification of what a legacy comprises.
 * Mirrors: types.rs:409-413
 *
 * Serde externally-tagged format:
 * - FixedAmount: {"FixedAmount": {"centavos": <number|string>}}
 * - SpecificAsset: {"SpecificAsset": "<asset_id>"}
 * - GenericClass: {"GenericClass": ["<description>", {"centavos": <number|string>}]}
 *
 * NOTE: GenericClass is a TUPLE variant — serializes as JSON array, NOT object.
 * NOTE: SpecificAsset resolves to zero in all pipeline calculations.
 */
export type LegacySpec =
  | { FixedAmount: Money }
  | { SpecificAsset: AssetId }
  | { GenericClass: [string, Money] };

/**
 * A legacy — a testamentary gift of personal property or money.
 * Mirrors: types.rs:399-406
 */
export interface Legacy {
  /** Unique disposition identifier. Must be unique across all will dispositions. */
  id: DispositionId;

  /** Reference to the legatee receiving this legacy. */
  legatee: HeirReference;

  /** What property or amount is being bequeathed. */
  property: LegacySpec;

  /** Conditions attached to this legacy. */
  conditions: Condition[];

  /** Testamentary substitutes for this legacy. */
  substitutes: Substitute[];

  /**
   * Whether this legacy has preference in Art. 911 reduction ordering.
   * Preferred legacies are reduced last during inofficiousness.
   */
  is_preferred: boolean;
}

/**
 * Specification of what a devise comprises.
 * Mirrors: types.rs:426-429
 *
 * Serde externally-tagged format:
 * - SpecificProperty: {"SpecificProperty": "<asset_id>"}
 * - FractionalInterest: {"FractionalInterest": ["<asset_id>", "<numer>/<denom>"]}
 *
 * NOTE: FractionalInterest is a TUPLE variant — serializes as JSON array.
 * NOTE: Both variants resolve to zero in all pipeline calculations.
 */
export type DeviseSpec =
  | { SpecificProperty: AssetId }
  | { FractionalInterest: [AssetId, string] };  // [AssetId, Frac as "numer/denom"]

/**
 * A devise — a testamentary gift of real property.
 * Mirrors: types.rs:416-423
 *
 * In the current engine, devises have NO monetary impact on distribution.
 * They defeat preterition and enable substitute resolution.
 */
export interface Devise {
  /** Unique disposition identifier. Must be unique across all will dispositions. */
  id: DispositionId;

  /** Reference to the devisee receiving this devise. */
  devisee: HeirReference;

  /** What real property is being devised. */
  property: DeviseSpec;

  /** Conditions attached to this devise. */
  conditions: Condition[];

  /** Testamentary substitutes for this devise. */
  substitutes: Substitute[];

  /**
   * Whether this devise has preference in Art. 911 reduction ordering.
   * Engine currently skips devises in reduction (step6_validation.rs:586).
   */
  is_preferred: boolean;
}

/**
 * A condition attached to a testamentary disposition.
 * Mirrors: types.rs:432-436
 *
 * Step 6 Check 5 (Art. 872): conditions on a compulsory heir's legitime
 * portion are VOID — the engine strips them. Only FP conditions retained.
 */
export interface Condition {
  /** The type of condition imposed. */
  condition_type: ConditionType;

  /**
   * Free-text description of the condition.
   * Primary consumed field — condition stripping collects these descriptions.
   */
  description: string;

  /**
   * Current status of the condition.
   * Informational — not consumed by condition stripping logic.
   */
  status: ConditionStatus;
}

/**
 * A testamentary substitute — a named replacement heir for vacancy resolution.
 * Mirrors: types.rs:439-443
 *
 * Step 9 vacancy (step9_vacancy.rs:568-652): when an heir's share becomes
 * vacant, substitutes are checked before representation/accretion.
 * NOTE: Engine does NOT check triggers or substitution_type — only alive+eligible.
 */
export interface Substitute {
  /** Type of substitution. Informational — engine treats all identically. */
  substitution_type: SubstitutionType;

  /**
   * Reference to the substitute heir. Must have person_id set to a valid
   * Person ID from family_tree for engine resolution.
   */
  substitute_heir: HeirReference;

  /**
   * Events that trigger this substitution.
   * Informational — engine does NOT filter by trigger.
   * Convention: specify all three.
   */
  triggers: SubstitutionTrigger[];
}

/**
 * A fideicommissary substitution (Arts. 863-870).
 * Mirrors: types.rs:446-453
 *
 * NOT consumed by any current pipeline step. Forward-looking type.
 */
export interface FideicommissarySubstitution {
  /** The first heir (fiduciary) who receives and must preserve property. */
  fiduciary: HeirReference;

  /** The second heir (fideicommissary) who ultimately receives property. */
  fideicommissary: HeirReference;

  /** Scope of property subject to this substitution. */
  property_scope: ShareSpec;

  /** Whether expressly stated in the will (Art. 863 requires it). */
  is_express: boolean;

  /** Whether the substitution is legally valid. */
  is_valid: boolean;

  /** Reason for invalidity, if is_valid is false. null when valid. */
  invalidity_reason: string | null;
}

/**
 * A disinheritance clause — the testator's exclusion of a compulsory heir.
 * Mirrors: types.rs:456-462
 *
 * Validity: cause_specified_in_will && cause_proven && !reconciliation_occurred
 * (step1_classify.rs:207-210)
 *
 * Even invalid disinheritances defeat preterition (step6_validation.rs:847-852).
 */
export interface Disinheritance {
  /**
   * Reference to the heir being disinherited.
   * Must reference a person in the family tree (person_id required).
   */
  heir_reference: HeirReference;

  /**
   * Specific cause code for disinheritance.
   * Must match the heir's relationship: Child causes for children,
   * Parent causes for ascendants, Spouse causes for spouse.
   */
  cause_code: DisinheritanceCause;

  /** Whether the cause is expressly stated in the will (Art. 916). */
  cause_specified_in_will: boolean;

  /** Whether the cause has been proven (Art. 917). */
  cause_proven: boolean;

  /** Whether reconciliation occurred after the cause (Art. 922). */
  reconciliation_occurred: boolean;
}

// ============================================================================
// Input Structs — Donations
// ============================================================================

/**
 * An inter vivos donation made by the decedent during their lifetime.
 * Mirrors: types.rs:467-487
 *
 * Pipeline: step4_estate_base.rs (collatability), step6_validation.rs
 * (inofficiousness), step8_collation.rs (imputation).
 *
 * Money values in centavos. Art. 1071: valued at time of donation, NOT death.
 */
export interface Donation {
  /** Unique identifier. Auto-generated by frontend. */
  id: DonationId;

  /**
   * ID of the heir who received the donation.
   * null when recipient_is_stranger is true.
   */
  recipient_heir_id: HeirId | null;

  /**
   * Whether the recipient is a stranger (not in the family tree).
   * Stranger donations: ALWAYS collatable, charged to free portion (Art. 909).
   */
  recipient_is_stranger: boolean;

  /**
   * Value of the donation at the time it was given.
   * JSON: { centavos: number }. Frontend displays as pesos.
   */
  value_at_time_of_donation: Money;

  /**
   * Date the donation was made (ISO-8601).
   * Critical for Phase 3 inofficiousness reduction ordering (most recent first).
   */
  date: DateString;

  /** Free-text description. Informational only. */
  description: string;

  // ── Exemption/Special Flags (step4_estate_base.rs:156-301) ──
  // Priority order matters: engine checks top-to-bottom, first match wins.

  /** Art. 1062: donor expressly exempted from collation. Still checked for inofficiousness. */
  is_expressly_exempt: boolean;

  /** Art. 1067: support, education, or medical expenses. Fully exempt. */
  is_support_education_medical: boolean;

  /** Art. 1067: customary/ordinary gift. Fully exempt. */
  is_customary_gift: boolean;

  /** Art. 1068: professional/vocational education. Conditionally collatable. */
  is_professional_expense: boolean;

  /** Art. 1068: parent was legally required to provide. Only when is_professional_expense=true. */
  professional_expense_parent_required: boolean;

  /**
   * Imputed savings (Art. 1068). Only when is_professional_expense=true AND
   * professional_expense_parent_required=true.
   * Collatable amount = value - imputed_savings.
   */
  professional_expense_imputed_savings: Money | null;

  /** Art. 1072: joint donation from both parents. Half collatable. */
  is_joint_from_both_parents: boolean;

  /** Art. 1066: given to child's spouse only. Fully exempt. */
  is_to_child_spouse_only: boolean;

  /** Art. 1066 para 2: joint gift to child and spouse. Half collatable. */
  is_joint_to_child_and_spouse: boolean;

  /** Art. 1070: wedding gift. Exempt but inofficiousness checked. */
  is_wedding_gift: boolean;

  /** Art. 1069: payment of child's debt. ALWAYS collatable. */
  is_debt_payment_for_child: boolean;

  /** Art. 1069: election campaign expense. ALWAYS collatable. */
  is_election_expense: boolean;

  /** Art. 1069: payment of child's fine. ALWAYS collatable. */
  is_fine_payment: boolean;
}

// ============================================================================
// Output Structs
// ============================================================================

/**
 * Complete engine output — the result of running the 10-step pipeline.
 * Mirrors: types.rs:525-533
 * Constructed by step10_finalize.rs:452-623.
 */
export interface EngineOutput {
  /** Per-heir distribution breakdown. Includes zero-share entries for excluded heirs. */
  per_heir_shares: InheritanceShare[];

  /** Per-heir plain-English narrative explaining their share and legal basis. */
  narratives: HeirNarrative[];

  /** Pipeline computation log (steps executed, restarts, final scenario). */
  computation_log: ComputationLog;

  /**
   * Manual review warnings.
   * NOTE: Currently always [] in the engine (step10_finalize.rs:619).
   * Frontend should render for forward compatibility.
   */
  warnings: ManualFlag[];

  /** Final succession type determined by the engine. */
  succession_type: SuccessionType;

  /** Final scenario code (T1-T15 or I1-I15). */
  scenario_code: ScenarioCode;
}

/**
 * A single heir's share breakdown.
 * Mirrors: types.rs:535-551
 *
 * Key money relationships:
 * - gross_entitlement = net_from_estate + donations_imputed
 * - total = gross_entitlement
 * - net_from_estate = what the heir actually receives from the physical estate
 *
 * Invariant: sum(all heirs' net_from_estate) == net_distributable_estate
 *
 * NOTE: from_legitime, from_free_portion, from_intestate are currently
 * always Money(0) in the engine (TODO in step10_finalize.rs:538-540).
 * Use total/net_from_estate for display.
 */
export interface InheritanceShare {
  /** Heir ID matching a Person.id from the input, or generated for strangers. */
  heir_id: HeirId;

  /** Heir's display name. */
  heir_name: string;

  /** Effective heir category group. */
  heir_category: EffectiveCategory;

  /** Whether the heir inherits by own right or by representation. */
  inherits_by: InheritanceMode;

  /** If inheriting by representation, the ID of the heir they represent. */
  represents: HeirId | null;

  /** Amount from compulsory legitime. Currently always 0 (engine TODO). */
  from_legitime: Money;

  /** Amount from free portion dispositions. Currently always 0 (engine TODO). */
  from_free_portion: Money;

  /** Amount from intestate distribution. Currently always 0 (engine TODO). */
  from_intestate: Money;

  /** Total share = gross_entitlement. */
  total: Money;

  /** Human-readable legitime fraction string. Currently empty string (engine TODO). */
  legitime_fraction: string;

  /** Legal basis articles (e.g., ["Art. 888", "Art. 892"]). */
  legal_basis: string[];

  /** Total donations imputed against this heir's share (collation). */
  donations_imputed: Money;

  /** Gross entitlement = net_from_estate + donations_imputed. */
  gross_entitlement: Money;

  /** Net amount actually payable from the estate. PRIMARY DISPLAY VALUE. */
  net_from_estate: Money;
}

/**
 * A plain-English narrative paragraph for one heir.
 * Mirrors: types.rs:553-559
 * Generated by step10_finalize.rs:358-448.
 * Text contains Markdown bold markers (**name (category)**).
 */
export interface HeirNarrative {
  /** Heir ID matching InheritanceShare.heir_id. */
  heir_id: HeirId;

  /** Heir's display name. */
  heir_name: string;

  /** Short category label (e.g., "legitimate child", "surviving spouse"). */
  heir_category_label: string;

  /** Full narrative paragraph with Markdown bold markers. */
  text: string;
}

/**
 * Computation log tracking pipeline execution.
 * Mirrors: types.rs:561-566
 */
export interface ComputationLog {
  /** Individual step records. Currently only Step 10 is logged. */
  steps: StepLog[];

  /** Number of pipeline restarts. */
  total_restarts: number;

  /** Final scenario code as a string (e.g., "T1", "I2"). */
  final_scenario: string;
}

/**
 * A single pipeline step's log entry.
 * Mirrors: types.rs:568-573
 */
export interface StepLog {
  /** Step number (1-10). */
  step_number: number;

  /** Human-readable step name (e.g., "Finalize + Narrate"). */
  step_name: string;

  /** Description of what this step did. */
  description: string;
}

/**
 * A warning or manual review flag generated by the pipeline.
 * Mirrors: types.rs:575-580
 *
 * Known categories:
 * - "unknown_donee" (step4): donation recipient not found
 * - "preterition" (step6): Art. 854 compulsory heir omitted
 * - "disinheritance" (step6): invalid disinheritance
 * - "inofficiousness" (step6): Arts. 908-912 FP exceeded
 * - "max_restarts" (step9): pipeline restart guard hit
 * - "vacancy_unresolved" (step9): vacant share could not be resolved
 */
export interface ManualFlag {
  /** Warning category identifier. */
  category: string;

  /** Human-readable description, often citing legal articles. */
  description: string;

  /** ID of the related heir, if the warning is heir-specific. */
  related_heir_id: HeirId | null;
}

// ============================================================================
// Utility Functions — Money Conversion
// ============================================================================

/**
 * Convert pesos (user input) to centavos (wire format).
 * Rounds to nearest centavo to handle floating-point imprecision.
 * Mirrors: Money::from_pesos() at types.rs:80-84
 */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/**
 * Convert centavos (wire format) to pesos (display).
 * Inverse of Money::from_pesos() at types.rs:80-84
 */
export function centavosToPesos(centavos: number | string): number {
  const c = typeof centavos === "string" ? Number(centavos) : centavos;
  return c / 100;
}

/**
 * Format centavos as a peso string following engine conventions.
 * Mirrors: step10_finalize.rs:215-226 — format_peso()
 * - ₱ prefix, comma-separated thousands
 * - Centavos shown only when non-zero, always 2 digits
 */
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

/**
 * Serialize a centavos value for JSON.
 * Uses number for safe integers, string for large values.
 * Mirrors: types.rs:31-45 — custom Serialize impl
 */
export function serializeCentavos(centavos: number | bigint): number | string {
  if (typeof centavos === "bigint") {
    return centavos <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(centavos)
      : centavos.toString();
  }
  return centavos;
}

// ============================================================================
// Utility Functions — Fraction Conversion
// ============================================================================

/**
 * Convert numerator/denominator to the "numer/denom" string format
 * expected by the engine's Frac serde (fraction.rs:241-244).
 */
export function fracToString(numer: number, denom: number): string {
  return `${numer}/${denom}`;
}

/**
 * Parse a "numer/denom" string back to numerator and denominator.
 * Inverse of the engine's Frac serde (fraction.rs:247-264).
 */
export function stringToFrac(s: string): { numer: number; denom: number } {
  const [n, d] = s.split("/").map(Number);
  return { numer: n, denom: d };
}

// ============================================================================
// Display Constants — Enum Labels
// ============================================================================

/** Human-readable labels for EffectiveCategory. Mirrors step10_finalize.rs:141-166. */
export const EFFECTIVE_CATEGORY_LABELS: Record<EffectiveCategory, string> = {
  LegitimateChildGroup: "Legitimate Child",
  IllegitimateChildGroup: "Illegitimate Child",
  SurvivingSpouseGroup: "Surviving Spouse",
  LegitimateAscendantGroup: "Legitimate Ascendant",
  CollateralGroup: "Collateral Relative",
};

/** Human-readable labels for SuccessionType. */
export const SUCCESSION_TYPE_LABELS: Record<SuccessionType, string> = {
  Testate: "Testate Succession",
  Intestate: "Intestate Succession",
  Mixed: "Mixed Succession",
  IntestateByPreterition: "Intestate (Preterition)",
};

/** Warning severity mapping for ManualFlag categories. */
export const WARNING_SEVERITY: Record<string, "error" | "warning" | "info"> = {
  preterition: "error",
  inofficiousness: "warning",
  disinheritance: "warning",
  max_restarts: "error",
  vacancy_unresolved: "warning",
  unknown_donee: "info",
};
