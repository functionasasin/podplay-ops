/**
 * Guided Intake Form types (§4.18)
 * Source: docs/plans/inheritance-premium-spec.md §4.18
 */

import type { Relationship } from './index';
import type { CivilStatus, GovIdType } from './client';
import type { ConflictOutcome } from '@/lib/conflict-check';

/** Settlement track for the case */
export type SettlementTrack = 'ejs' | 'judicial';

/** Relationship of client to decedent */
export type ClientRelationship =
  | 'surviving_spouse'
  | 'child'
  | 'executor'
  | 'administrator'
  | 'other_heir'
  | 'third_party_buyer';

export const CLIENT_RELATIONSHIPS: readonly ClientRelationship[] = [
  'surviving_spouse',
  'child',
  'executor',
  'administrator',
  'other_heir',
  'third_party_buyer',
];

export const CLIENT_RELATIONSHIP_LABELS: Record<ClientRelationship, string> = {
  surviving_spouse: 'Surviving Spouse',
  child: 'Child',
  executor: 'Executor',
  administrator: 'Administrator',
  other_heir: 'Other Heir',
  third_party_buyer: 'Third-Party Buyer',
};

/** Property regime options */
export type PropertyRegime = 'ACP' | 'CPG' | 'complete_separation';

export const PROPERTY_REGIMES: readonly PropertyRegime[] = [
  'ACP',
  'CPG',
  'complete_separation',
];

export const PROPERTY_REGIME_LABELS: Record<PropertyRegime, string> = {
  ACP: 'Absolute Community (ACP)',
  CPG: 'Conjugal Partnership (CPG)',
  complete_separation: 'Complete Separation',
};

/** Heir entry in family composition step */
export interface IntakeHeirEntry {
  name: string;
  relationship: Relationship;
  is_alive: boolean;
}

/** Conflict check step state */
export interface ConflictCheckStepState {
  outcome: ConflictOutcome | null;
  checkedName: string;
  checkedTin: string | null;
  notes: string;
}

/** Client details step state */
export interface ClientDetailsStepState {
  full_name: string;
  nickname: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  tin: string;
  gov_id_type: GovIdType | null;
  gov_id_number: string;
  civil_status: CivilStatus | null;
  referral_source: string;
  relationship_to_decedent: ClientRelationship | null;
}

/** Decedent info step state */
export interface DecedentInfoStepState {
  full_name: string;
  date_of_death: string;
  place_of_death: string;
  last_known_address: string;
  civil_status: CivilStatus | null;
  has_will: boolean;
  property_regime: PropertyRegime | null;
  citizenship: string;
  tin: string;
}

/** Family composition step state */
export interface FamilyCompositionStepState {
  heirs: IntakeHeirEntry[];
}

/** Asset summary step state */
export interface AssetSummaryStepState {
  real_property_count: number;
  real_property_total_value: number;
  has_cash: boolean;
  has_vehicles: boolean;
  vehicle_count: number;
}

/** Settlement track step state */
export interface SettlementTrackStepState {
  track: SettlementTrack | null;
}

/** The overall intake form state across all 7 steps */
export interface IntakeFormState {
  currentStep: number;
  conflictCheck: ConflictCheckStepState;
  clientDetails: ClientDetailsStepState;
  decedentInfo: DecedentInfoStepState;
  familyComposition: FamilyCompositionStepState;
  assetSummary: AssetSummaryStepState;
  settlementTrack: SettlementTrackStepState;
}

/** Data stored in cases.intake_data JSONB column */
export interface IntakeData {
  decedent_tin: string | null;
  asset_categories: {
    has_real_property: boolean;
    real_property_count: number;
    real_property_total_value: number;
    has_cash: boolean;
    has_vehicles: boolean;
    vehicle_count: number;
  };
  will_status: 'intestate' | 'testate';
  settlement_track: SettlementTrack;
  relationship_to_decedent: ClientRelationship | null;
}

/** Milestone seed data for deadline generation */
export interface MilestoneSeed {
  label: string;
  offset_days: number;
  description: string;
  legal_basis: string | null;
}

/** The 7 intake steps */
export const INTAKE_STEPS = [
  'Conflict Check',
  'Client Details',
  'Decedent Info',
  'Family Composition',
  'Asset Summary',
  'Settlement Track',
  'Review & Save',
] as const;

export type IntakeStepName = (typeof INTAKE_STEPS)[number];

/** Total number of intake steps */
export const INTAKE_STEP_COUNT = INTAKE_STEPS.length;
