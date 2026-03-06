import { z } from 'zod';
import { PesoSchema, ISODateSchema, TaxYearSchema } from './primitives';
import {
  TaxpayerTypeSchema, FilingPeriodSchema, RegimeElectionSchema, ReturnTypeSchema,
  OverpaymentPreferenceInputSchema, DepreciationMethodSchema, QuarterSchema,
} from './enums';

// DepreciationEntry sub-schema
export const DepreciationEntrySchema = z.object({
  assetName: z.string().min(1),
  assetCost: PesoSchema,
  salvageValue: PesoSchema,
  usefulLifeYears: z.number().int().min(1).max(50),
  acquisitionDate: ISODateSchema,
  method: DepreciationMethodSchema,
  priorAccumulatedDepreciation: PesoSchema,
}).strict();

// NolcoEntry sub-schema
export const NolcoEntrySchema = z.object({
  lossYear: TaxYearSchema,
  originalLoss: PesoSchema,
  remainingBalance: PesoSchema,
  expiryYear: TaxYearSchema,
}).strict();

// ItemizedExpenseInput sub-schema (23 fields — all required)
export const ItemizedExpenseInputSchema = z.object({
  salariesAndWages: PesoSchema,
  sssPhilhealthPagibigEmployerShare: PesoSchema,
  rent: PesoSchema,
  utilities: PesoSchema,
  communication: PesoSchema,
  officeSupplies: PesoSchema,
  professionalFeesPaid: PesoSchema,
  travelTransportation: PesoSchema,
  insurancePremiums: PesoSchema,
  interestExpense: PesoSchema,
  finalTaxedInterestIncome: PesoSchema,
  taxesAndLicenses: PesoSchema,
  casualtyTheftLosses: PesoSchema,
  badDebts: PesoSchema,
  isAccrualBasis: z.boolean(),
  depreciationEntries: z.array(DepreciationEntrySchema),
  charitableContributions: PesoSchema,
  charitableAccredited: z.boolean(),
  researchDevelopment: PesoSchema,
  entertainmentRepresentation: PesoSchema,
  homeOfficeExpense: PesoSchema,
  homeOfficeExclusiveUse: z.boolean(),
  nolcoEntries: z.array(NolcoEntrySchema),
}).strict();

// Form2307Entry sub-schema (CWT certificate)
export const Form2307EntrySchema = z.object({
  payorName: z.string().min(1),
  payorTin: z.string().regex(/^\d{3}-\d{3}-\d{3}(-\d{3})?$/),
  atcCode: z.string().min(1),
  incomePayment: PesoSchema,
  taxWithheld: PesoSchema,
  periodFrom: ISODateSchema,
  periodTo: ISODateSchema,
  quarterOfCredit: QuarterSchema.nullable(),
}).strict();

// QuarterlyPayment sub-schema
export const QuarterlyPaymentSchema = z.object({
  quarter: QuarterSchema,
  amountPaid: PesoSchema,
  datePaid: ISODateSchema.nullable(),
  form1701qPeriod: z.enum(['Q1', 'Q2', 'Q3']),
}).strict();

// TaxpayerInputSchema — top-level (all 25 fields)
export const TaxpayerInputSchema = z.object({
  taxpayerType: TaxpayerTypeSchema,
  taxYear: TaxYearSchema,
  filingPeriod: FilingPeriodSchema,
  isMixedIncome: z.boolean(),
  isVatRegistered: z.boolean(),
  isBmbeRegistered: z.boolean(),
  subjectToSec117128: z.boolean(),
  isGppPartner: z.boolean(),
  grossReceipts: PesoSchema,
  salesReturnsAllowances: PesoSchema,
  nonOperatingIncome: PesoSchema,
  fwtIncome: PesoSchema,
  costOfGoodsSold: PesoSchema,
  taxableCompensation: PesoSchema,
  compensationCwt: PesoSchema,
  itemizedExpenses: ItemizedExpenseInputSchema,
  electedRegime: RegimeElectionSchema.nullable(),
  osdElected: z.boolean().nullable(),
  priorQuarterlyPayments: z.array(QuarterlyPaymentSchema),
  cwt2307Entries: z.array(Form2307EntrySchema),
  priorYearExcessCwt: PesoSchema,
  actualFilingDate: ISODateSchema.nullable(),
  returnType: ReturnTypeSchema,
  priorPaymentForReturn: PesoSchema,
  overpaymentPreference: OverpaymentPreferenceInputSchema.nullable(),
}).strict();

// Per-step wizard schemas (§6.6)
export const TaxpayerProfileSchema = z.object({
  taxpayerType: TaxpayerTypeSchema,
}).strict();

export const TaxYearInfoSchema = z.object({
  taxYear: TaxYearSchema,
  filingPeriod: FilingPeriodSchema,
}).strict();

export const GrossReceiptsSchema = z.object({
  grossReceipts: PesoSchema,
}).strict();
