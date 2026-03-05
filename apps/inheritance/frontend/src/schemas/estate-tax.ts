/**
 * Zod validation schemas for Estate Tax Inputs Wizard (§4.23)
 */

import { z } from 'zod';

// ============================================================================
// Tab 1 — Decedent Details
// ============================================================================

export const decedentDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  dateOfDeath: z
    .string()
    .min(1, 'Date of death is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  citizenship: z.enum(['Filipino', 'NRA']),
  isNonResidentAlien: z.boolean(),
  address: z.string().min(1, 'Address is required').max(500),
  maritalStatus: z.enum(['single', 'married', 'widowed', 'legally_separated', 'annulled']),
  propertyRegime: z.enum(['ACP', 'CPG', 'CSP']).nullable(),
  worldwideGrossEstate: z.number().nonnegative().nullable(),
});

// ============================================================================
// Tab 2 — Executor
// ============================================================================

export const executorDetailsSchema = z.object({
  name: z.string().min(1, 'Executor name is required').max(200),
  tin: z.string().max(20),
  contact: z.string().max(100),
  email: z.string().email('Invalid email').or(z.literal('')),
});

// ============================================================================
// Tab 3 — Real Properties
// ============================================================================

export const realPropertyItemSchema = z.object({
  id: z.string(),
  titleNumber: z.string().min(1, 'Title/TCT number is required'),
  taxDecNumber: z.string(),
  location: z.string().min(1, 'Location is required'),
  lotArea: z.number().nonnegative().nullable(),
  improvementArea: z.number().nonnegative().nullable(),
  classification: z.enum(['residential', 'commercial', 'industrial', 'agricultural']),
  fmvTaxDec: z.number().nonnegative('FMV must be non-negative'),
  fmvBirZonal: z.number().nonnegative('FMV must be non-negative'),
  ownership: z.enum(['exclusive', 'conjugal', 'community']),
  isFamilyHome: z.boolean(),
  hasBarangayCert: z.boolean(),
});

// ============================================================================
// Tab 4 — Personal Properties
// ============================================================================

export const personalPropertyItemSchema = z.object({
  id: z.string(),
  subtype: z.enum([
    'cash', 'bank_deposit', 'receivable', 'shares', 'bonds',
    'vehicle', 'jewelry', 'other',
  ]),
  description: z.string().min(1, 'Description is required'),
  fmv: z.number().nonnegative('FMV must be non-negative'),
  ownership: z.enum(['exclusive', 'conjugal', 'community']),
});

// ============================================================================
// Tab 5 — Other Assets
// ============================================================================

export const taxableTransferSchema = z.object({
  id: z.string(),
  type: z.enum([
    'CONTEMPLATION_OF_DEATH',
    'REVOCABLE',
    'POWER_OF_APPOINTMENT',
    'LIFE_INSURANCE',
    'INSUFFICIENT_CONSIDERATION',
  ]),
  description: z.string().min(1, 'Description is required'),
  fmv: z.number().nonnegative(),
});

export const businessInterestSchema = z.object({
  id: z.string(),
  businessName: z.string().min(1, 'Business name is required'),
  description: z.string(),
  fmv: z.number().nonnegative(),
});

export const exemptAssetSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  fmv: z.number().nonnegative(),
  legalBasis: z.string(),
});

export const otherAssetsSchema = z.object({
  taxableTransfers: z.array(taxableTransferSchema),
  businessInterests: z.array(businessInterestSchema),
  exemptAssets: z.array(exemptAssetSchema),
});

// ============================================================================
// Tab 6 — Ordinary Deductions
// ============================================================================

export const deductionItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().nonnegative(),
});

export const ordinaryDeductionsSchema = z.object({
  claimsAgainstEstate: z.array(deductionItemSchema),
  claimsAgainstInsolvent: z.array(deductionItemSchema),
  unpaidMortgages: z.array(deductionItemSchema),
  unpaidTaxes: z.array(deductionItemSchema),
  casualtyLosses: z.array(deductionItemSchema),
  vanishingDeduction: z.number().nonnegative(),
  publicUseTransfers: z.array(deductionItemSchema),
  funeralExpenses: z.number().nonnegative().nullable(),
  judicialAdminExpenses: z.number().nonnegative().nullable(),
});

// ============================================================================
// Tab 7 — Special Deductions
// ============================================================================

export const specialDeductionsSchema = z.object({
  medicalExpenses: z.number().nonnegative(),
  ra4917Benefits: z.number().nonnegative(),
  foreignTaxCredits: z.number().nonnegative(),
  standardDeduction: z.number().nonnegative(),
  familyHomeDeduction: z.number().nonnegative(),
});

// ============================================================================
// Tab 8 — Filing & Amnesty
// ============================================================================

export const filingDataSchema = z.object({
  userElectsAmnesty: z.boolean(),
  amnestyDeductionMode: z.enum(['standard', 'narrow']),
  isAmended: z.boolean(),
  hasExtension: z.boolean(),
  isInstallment: z.boolean(),
  isJudicialSettlement: z.boolean(),
  hasPcggViolation: z.boolean(),
  hasRa3019Violation: z.boolean(),
  hasRa9160Violation: z.boolean(),
});

// ============================================================================
// Full Wizard State Schema
// ============================================================================

export const estateTaxWizardStateSchema = z.object({
  decedent: decedentDetailsSchema,
  executor: executorDetailsSchema,
  realProperties: z.array(realPropertyItemSchema),
  personalProperties: z.array(personalPropertyItemSchema),
  otherAssets: otherAssetsSchema,
  ordinaryDeductions: ordinaryDeductionsSchema,
  specialDeductions: specialDeductionsSchema,
  filing: filingDataSchema,
});
