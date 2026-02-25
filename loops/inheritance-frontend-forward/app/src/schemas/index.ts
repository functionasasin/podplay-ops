/**
 * Zod validation schemas for the Philippine Inheritance Distribution Engine.
 * Source of truth: ../inheritance-frontend-reverse/analysis/synthesis/schemas.ts
 *
 * STUBS — these are minimal placeholders that allow tests to compile.
 * Real implementation will follow in a subsequent iteration.
 */

import { z } from "zod";

// Section 1: Primitive Helpers
export const DateSchema = z.any();
export const FracSchema = z.any();
export const FractionalInterestFracSchema = z.any();

// Section 2: Money
export const CentavosValueSchema = z.any();
export const MoneySchema = z.any();

// Section 3: Enum Schemas
export const RelationshipSchema = z.any();
export const FiliationProofSchema = z.any();
export const AdoptionRegimeSchema = z.any();
export const LineOfDescentSchema = z.any();
export const BloodTypeSchema = z.any();
export const ConditionTypeSchema = z.any();
export const ConditionStatusSchema = z.any();
export const SubstitutionTypeSchema = z.any();
export const SubstitutionTriggerSchema = z.any();
export const FideicommissaryValidationResultSchema = z.any();
export const DisinheritanceCauseSchema = z.any();

// Section 4-5: Adoption, Condition, HeirReference, Substitute
export const AdoptionSchema = z.any();
export const ConditionSchema = z.any();
export const HeirReferenceSchema = z.any();
export const SubstituteSchema = z.any();
export const FideicommissarySubstitutionSchema = z.any();

// Section 6-7: ShareSpec, LegacySpec, DeviseSpec
export const ShareSpecSchema = z.any();
export const LegacySpecSchema = z.any();
export const DeviseSpecSchema = z.any();

// Section 8: Will Dispositions
export const InstitutionOfHeirSchema = z.any();
export const LegacySchema = z.any();
export const DeviseSchema = z.any();
export const DisinheritanceSchema = z.any();

// Section 9: Will
export const WillSchema = z.any();

// Section 10: Donation
export const DonationSchema = z.any();

// Section 11: Person
export const PersonSchema = z.any();

// Section 12: Decedent
export const DecedentSchema = z.any();

// Section 13: EngineConfig
export const EngineConfigSchema = z.any();

// Section 14: EngineInput
export const EngineInputSchema = z.any();

// Section 15: Output Schemas
export const EffectiveCategorySchema = z.any();
export const InheritanceModeSchema = z.any();
export const SuccessionTypeSchema = z.any();
export const ScenarioCodeSchema = z.any();
export const InheritanceShareSchema = z.any();
export const HeirNarrativeSchema = z.any();
export const StepLogSchema = z.any();
export const ComputationLogSchema = z.any();
export const ManualFlagSchema = z.any();
export const EngineOutputSchema = z.any();

// Section 16: Disinheritance Cause Lookup Constants
export const CHILD_CAUSES: readonly string[] = [];
export const PARENT_CAUSES: readonly string[] = [];
export const SPOUSE_CAUSES: readonly string[] = [];
export const CAUSE_BY_RELATIONSHIP: Partial<Record<string, readonly string[]>> = {};

// Section 17: Warning Severity Map
export const WARNING_SEVERITY: Record<string, "error" | "warning" | "info"> = {};
