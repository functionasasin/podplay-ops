import { z } from 'zod';

export const TaxpayerTypeSchema = z.enum(['PURELY_SE', 'MIXED_INCOME', 'COMPENSATION_ONLY']);
export const RegimePathSchema = z.enum(['PATH_A', 'PATH_B', 'PATH_C']);
export const DeductionMethodSchema = z.enum(['ITEMIZED', 'OSD', 'NONE']);
export const FilingPeriodSchema = z.enum(['Q1', 'Q2', 'Q3', 'ANNUAL']);
export const TaxpayerTierSchema = z.enum(['MICRO', 'SMALL', 'MEDIUM', 'LARGE']);
export const RegimeElectionSchema = z.enum(['ELECT_EIGHT_PCT', 'ELECT_OSD', 'ELECT_ITEMIZED']);
export const BalanceDispositionSchema = z.enum(['BALANCE_PAYABLE', 'ZERO_BALANCE', 'OVERPAYMENT']);
export const ReturnTypeSchema = z.enum(['ORIGINAL', 'AMENDED']);
export const FormTypeSchema = z.enum(['FORM_1701', 'FORM_1701A', 'FORM_1701Q']);
export const OverpaymentDispositionSchema = z.enum(['CARRY_OVER', 'REFUND', 'TCC', 'PENDING_ELECTION']);
export const OverpaymentPreferenceInputSchema = z.enum(['CARRY_OVER', 'REFUND', 'TCC']);
export const DepreciationMethodSchema = z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']);
export const TaxpayerClassSchema = z.enum(['SERVICE_PROVIDER', 'TRADER']);
export const CwtClassificationSchema = z.enum(['INCOME_TAX_CWT', 'PERCENTAGE_TAX_CWT', 'UNKNOWN']);

// Quarter is a NUMBER 1|2|3, not a string schema
export const QuarterSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
// For Form2551Q which can also be Q4:
export const QuarterOr4Schema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
