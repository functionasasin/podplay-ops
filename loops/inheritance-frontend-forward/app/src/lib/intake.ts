/**
 * Guided Intake Form mapping functions (§4.18)
 * Source: docs/plans/inheritance-premium-spec.md §4.18
 *
 * Converts intake form state into:
 * - EngineInput (pre-populated case wizard)
 * - CreateClientData (client record)
 * - IntakeData (stored in cases.intake_data JSONB)
 * - MilestoneSeed[] (deadline generation)
 */

import type { EngineInput, Person, Decedent } from '@/types';
import type { CreateClientData } from '@/types/client';
import type {
  IntakeFormState,
  IntakeData,
  MilestoneSeed,
  SettlementTrack,
  DecedentInfoStepState,
  FamilyCompositionStepState,
  IntakeHeirEntry,
} from '@/types/intake';

/**
 * Map decedent info step to EngineInput.decedent
 */
export function mapDecedentInfoToDecedent(
  _decedentInfo: DecedentInfoStepState,
): Partial<Decedent> {
  // stub — implementation in next iteration
  return {};
}

/**
 * Map family composition step to EngineInput.family_tree Person[]
 */
export function mapFamilyToPersons(
  _familyComposition: FamilyCompositionStepState,
): Person[] {
  // stub — implementation in next iteration
  return [];
}

/**
 * Map a single intake heir entry to a Person object
 */
export function mapHeirEntryToPerson(
  _heir: IntakeHeirEntry,
  _index: number,
): Person {
  // stub — implementation in next iteration
  return {} as Person;
}

/**
 * Map the full intake form state to a partial EngineInput for case pre-population.
 * This drives the inheritance wizard pre-population from intake data.
 */
export function mapIntakeToEngineInput(
  _state: IntakeFormState,
): Partial<EngineInput> {
  // stub — implementation in next iteration
  return {};
}

/**
 * Map client details step to CreateClientData for Supabase insert.
 */
export function mapIntakeToClientData(
  _state: IntakeFormState,
  _orgId: string,
  _userId: string,
): CreateClientData {
  // stub — implementation in next iteration
  return {} as CreateClientData;
}

/**
 * Map intake form state to IntakeData JSONB for cases.intake_data column.
 */
export function mapIntakeToIntakeData(
  _state: IntakeFormState,
): IntakeData {
  // stub — implementation in next iteration
  return {} as IntakeData;
}

/**
 * Get settlement milestones based on track selection.
 * EJS: 9 milestones, Judicial/Probate: 4 milestones.
 */
export function getSettlementMilestones(
  _track: SettlementTrack,
): MilestoneSeed[] {
  // stub — implementation in next iteration
  return [];
}

/**
 * Create the initial (empty) intake form state.
 */
export function createInitialIntakeState(): IntakeFormState {
  // stub — implementation in next iteration
  return {} as IntakeFormState;
}

/**
 * Validate whether a given step is complete enough to proceed.
 */
export function isStepComplete(
  _state: IntakeFormState,
  _step: number,
): boolean {
  // stub — implementation in next iteration
  return false;
}
