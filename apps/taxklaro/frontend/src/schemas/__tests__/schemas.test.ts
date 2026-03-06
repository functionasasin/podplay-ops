import { describe, it, expect } from 'vitest';
import {
  PesoSchema, ISODateSchema, TaxYearSchema,
} from '../primitives';
import {
  TaxpayerTypeSchema, FilingPeriodSchema, RegimeElectionSchema,
  FormTypeSchema, QuarterSchema, QuarterOr4Schema,
} from '../enums';
import {
  TaxpayerInputSchema, ItemizedExpenseInputSchema, Form2307EntrySchema,
  QuarterlyPaymentSchema, DepreciationEntrySchema, NolcoEntrySchema,
  TaxpayerProfileSchema, TaxYearInfoSchema, GrossReceiptsSchema,
} from '../input';
import { TaxComputationResultSchema } from '../output';
import { WasmResultSchema } from '../bridge';

// ─── Primitives ───────────────────────────────────────────────────────────────

describe('PesoSchema', () => {
  it('accepts integer string', () => {
    expect(PesoSchema.safeParse('1000').success).toBe(true);
  });
  it('accepts decimal with 1 digit', () => {
    expect(PesoSchema.safeParse('1000.5').success).toBe(true);
  });
  it('accepts decimal with 2 digits', () => {
    expect(PesoSchema.safeParse('1234.56').success).toBe(true);
  });
  it('rejects 3 decimal places', () => {
    expect(PesoSchema.safeParse('1234.567').success).toBe(false);
  });
  it('rejects negative', () => {
    expect(PesoSchema.safeParse('-100').success).toBe(false);
  });
  it('rejects number type (must be string)', () => {
    expect(PesoSchema.safeParse(1000).success).toBe(false);
  });
  it('rejects empty string', () => {
    expect(PesoSchema.safeParse('').success).toBe(false);
  });
  it('accepts zero', () => {
    expect(PesoSchema.safeParse('0').success).toBe(true);
  });
  it('accepts large amount', () => {
    expect(PesoSchema.safeParse('3000000.00').success).toBe(true);
  });
});

describe('ISODateSchema', () => {
  it('accepts valid date', () => {
    expect(ISODateSchema.safeParse('2024-01-15').success).toBe(true);
  });
  it('rejects wrong format', () => {
    expect(ISODateSchema.safeParse('01/15/2024').success).toBe(false);
  });
  it('rejects partial date', () => {
    expect(ISODateSchema.safeParse('2024-01').success).toBe(false);
  });
  it('rejects non-date string', () => {
    expect(ISODateSchema.safeParse('not-a-date').success).toBe(false);
  });
});

describe('TaxYearSchema', () => {
  it('accepts 2024', () => {
    expect(TaxYearSchema.safeParse(2024).success).toBe(true);
  });
  it('accepts boundary 2018', () => {
    expect(TaxYearSchema.safeParse(2018).success).toBe(true);
  });
  it('accepts boundary 2030', () => {
    expect(TaxYearSchema.safeParse(2030).success).toBe(true);
  });
  it('rejects 2017', () => {
    expect(TaxYearSchema.safeParse(2017).success).toBe(false);
  });
  it('rejects 2031', () => {
    expect(TaxYearSchema.safeParse(2031).success).toBe(false);
  });
  it('rejects float', () => {
    expect(TaxYearSchema.safeParse(2024.5).success).toBe(false);
  });
  it('rejects string', () => {
    expect(TaxYearSchema.safeParse('2024').success).toBe(false);
  });
});

// ─── Enums ────────────────────────────────────────────────────────────────────

describe('TaxpayerTypeSchema', () => {
  it('accepts PURELY_SE', () => {
    expect(TaxpayerTypeSchema.safeParse('PURELY_SE').success).toBe(true);
  });
  it('accepts MIXED_INCOME', () => {
    expect(TaxpayerTypeSchema.safeParse('MIXED_INCOME').success).toBe(true);
  });
  it('accepts COMPENSATION_ONLY', () => {
    expect(TaxpayerTypeSchema.safeParse('COMPENSATION_ONLY').success).toBe(true);
  });
  it('rejects lowercase', () => {
    expect(TaxpayerTypeSchema.safeParse('purely_se').success).toBe(false);
  });
  it('rejects invalid value', () => {
    expect(TaxpayerTypeSchema.safeParse('SELF_EMPLOYED').success).toBe(false);
  });
});

describe('FilingPeriodSchema', () => {
  it('accepts Q1/Q2/Q3/ANNUAL', () => {
    for (const v of ['Q1', 'Q2', 'Q3', 'ANNUAL']) {
      expect(FilingPeriodSchema.safeParse(v).success).toBe(true);
    }
  });
  it('rejects Q4 (not valid ITR filing period)', () => {
    expect(FilingPeriodSchema.safeParse('Q4').success).toBe(false);
  });
  it('rejects QUARTERLY', () => {
    expect(FilingPeriodSchema.safeParse('QUARTERLY').success).toBe(false);
  });
});

describe('FormTypeSchema', () => {
  it('accepts FORM_1701', () => {
    expect(FormTypeSchema.safeParse('FORM_1701').success).toBe(true);
  });
  it('accepts FORM_1701A (no underscore before A)', () => {
    expect(FormTypeSchema.safeParse('FORM_1701A').success).toBe(true);
  });
  it('accepts FORM_1701Q', () => {
    expect(FormTypeSchema.safeParse('FORM_1701Q').success).toBe(true);
  });
  it('rejects FORM_1701_A (underscore before A — wrong)', () => {
    expect(FormTypeSchema.safeParse('FORM_1701_A').success).toBe(false);
  });
});

describe('QuarterSchema', () => {
  it('accepts 1, 2, 3', () => {
    for (const v of [1, 2, 3]) {
      expect(QuarterSchema.safeParse(v).success).toBe(true);
    }
  });
  it('rejects 4', () => {
    expect(QuarterSchema.safeParse(4).success).toBe(false);
  });
  it('rejects string "1"', () => {
    expect(QuarterSchema.safeParse('1').success).toBe(false);
  });
});

describe('QuarterOr4Schema', () => {
  it('accepts 1, 2, 3, 4', () => {
    for (const v of [1, 2, 3, 4]) {
      expect(QuarterOr4Schema.safeParse(v).success).toBe(true);
    }
  });
  it('rejects 5', () => {
    expect(QuarterOr4Schema.safeParse(5).success).toBe(false);
  });
});

// ─── Input sub-schemas ────────────────────────────────────────────────────────

describe('DepreciationEntrySchema', () => {
  const valid = {
    assetName: 'Laptop',
    assetCost: '50000.00',
    salvageValue: '5000.00',
    usefulLifeYears: 5,
    acquisitionDate: '2022-01-01',
    method: 'STRAIGHT_LINE',
    priorAccumulatedDepreciation: '0.00',
  };

  it('accepts valid entry', () => {
    expect(DepreciationEntrySchema.safeParse(valid).success).toBe(true);
  });
  it('rejects unknown field (strict)', () => {
    expect(DepreciationEntrySchema.safeParse({ ...valid, extraField: 'x' }).success).toBe(false);
  });
  it('rejects usefulLifeYears = 0', () => {
    expect(DepreciationEntrySchema.safeParse({ ...valid, usefulLifeYears: 0 }).success).toBe(false);
  });
  it('rejects usefulLifeYears = 51', () => {
    expect(DepreciationEntrySchema.safeParse({ ...valid, usefulLifeYears: 51 }).success).toBe(false);
  });
});

describe('Form2307EntrySchema', () => {
  const valid = {
    payorName: 'Acme Corp',
    payorTin: '123-456-789',
    atcCode: 'WI010',
    incomePayment: '100000.00',
    taxWithheld: '2000.00',
    periodFrom: '2024-01-01',
    periodTo: '2024-03-31',
    quarterOfCredit: 1,
  };

  it('accepts valid entry', () => {
    expect(Form2307EntrySchema.safeParse(valid).success).toBe(true);
  });
  it('accepts null quarterOfCredit', () => {
    expect(Form2307EntrySchema.safeParse({ ...valid, quarterOfCredit: null }).success).toBe(true);
  });
  it('accepts TIN with branch code', () => {
    expect(Form2307EntrySchema.safeParse({ ...valid, payorTin: '123-456-789-0001' }).success).toBe(true);
  });
  it('rejects invalid TIN format', () => {
    expect(Form2307EntrySchema.safeParse({ ...valid, payorTin: '1234567890' }).success).toBe(false);
  });
  it('rejects unknown field (strict)', () => {
    expect(Form2307EntrySchema.safeParse({ ...valid, extra: 'x' }).success).toBe(false);
  });
  it('rejects undefined quarterOfCredit (must be null, not omitted)', () => {
    const { quarterOfCredit: _removed, ...withoutField } = valid;
    expect(Form2307EntrySchema.safeParse(withoutField).success).toBe(false);
  });
});

describe('ItemizedExpenseInputSchema', () => {
  const valid = {
    salariesAndWages: '0.00',
    sssPhilhealthPagibigEmployerShare: '0.00',
    rent: '0.00',
    utilities: '0.00',
    communication: '0.00',
    officeSupplies: '0.00',
    professionalFeesPaid: '0.00',
    travelTransportation: '0.00',
    insurancePremiums: '0.00',
    interestExpense: '0.00',
    finalTaxedInterestIncome: '0.00',
    taxesAndLicenses: '0.00',
    casualtyTheftLosses: '0.00',
    badDebts: '0.00',
    isAccrualBasis: false,
    depreciationEntries: [],
    charitableContributions: '0.00',
    charitableAccredited: false,
    researchDevelopment: '0.00',
    entertainmentRepresentation: '0.00',
    homeOfficeExpense: '0.00',
    homeOfficeExclusiveUse: false,
    nolcoEntries: [],
  };

  it('accepts valid zeroed-out expense', () => {
    expect(ItemizedExpenseInputSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects unknown field (strict)', () => {
    expect(ItemizedExpenseInputSchema.safeParse({ ...valid, otherExpenses: '100.00' }).success).toBe(false);
  });
  it('rejects boolean coercion — isAccrualBasis must be boolean not string', () => {
    expect(ItemizedExpenseInputSchema.safeParse({ ...valid, isAccrualBasis: 'true' }).success).toBe(false);
  });
  it('rejects optional field — isAccrualBasis must be present', () => {
    const { isAccrualBasis: _removed, ...without } = valid;
    expect(ItemizedExpenseInputSchema.safeParse(without).success).toBe(false);
  });
});

// ─── TaxpayerInputSchema (top-level) ─────────────────────────────────────────

const minimalItemizedExpenses = {
  salariesAndWages: '0.00',
  sssPhilhealthPagibigEmployerShare: '0.00',
  rent: '0.00',
  utilities: '0.00',
  communication: '0.00',
  officeSupplies: '0.00',
  professionalFeesPaid: '0.00',
  travelTransportation: '0.00',
  insurancePremiums: '0.00',
  interestExpense: '0.00',
  finalTaxedInterestIncome: '0.00',
  taxesAndLicenses: '0.00',
  casualtyTheftLosses: '0.00',
  badDebts: '0.00',
  isAccrualBasis: false,
  depreciationEntries: [],
  charitableContributions: '0.00',
  charitableAccredited: false,
  researchDevelopment: '0.00',
  entertainmentRepresentation: '0.00',
  homeOfficeExpense: '0.00',
  homeOfficeExclusiveUse: false,
  nolcoEntries: [],
};

const validInput = {
  taxpayerType: 'PURELY_SE',
  taxYear: 2024,
  filingPeriod: 'ANNUAL',
  isMixedIncome: false,
  isVatRegistered: false,
  isBmbeRegistered: false,
  subjectToSec117128: false,
  isGppPartner: false,
  grossReceipts: '500000.00',
  salesReturnsAllowances: '0.00',
  nonOperatingIncome: '0.00',
  fwtIncome: '0.00',
  costOfGoodsSold: '0.00',
  taxableCompensation: '0.00',
  compensationCwt: '0.00',
  itemizedExpenses: minimalItemizedExpenses,
  electedRegime: null,
  osdElected: null,
  priorQuarterlyPayments: [],
  cwt2307Entries: [],
  priorYearExcessCwt: '0.00',
  actualFilingDate: null,
  returnType: 'ORIGINAL',
  priorPaymentForReturn: '0.00',
  overpaymentPreference: null,
};

describe('TaxpayerInputSchema', () => {
  it('accepts valid complete input', () => {
    const result = TaxpayerInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects unknown fields (strict)', () => {
    expect(TaxpayerInputSchema.safeParse({ ...validInput, unknownField: 'x' }).success).toBe(false);
  });

  it('rejects grossReceiptsAmount (wrong field name)', () => {
    const { grossReceipts: _r, ...without } = validInput;
    expect(TaxpayerInputSchema.safeParse({ ...without, grossReceiptsAmount: '500000.00' }).success).toBe(false);
  });

  it('rejects form2307Entries (wrong field name)', () => {
    const { cwt2307Entries: _r, ...without } = validInput;
    expect(TaxpayerInputSchema.safeParse({ ...without, form2307Entries: [] }).success).toBe(false);
  });

  it('rejects priorYearExcessCredits (wrong field name)', () => {
    const { priorYearExcessCwt: _r, ...without } = validInput;
    expect(TaxpayerInputSchema.safeParse({ ...without, priorYearExcessCredits: '0.00' }).success).toBe(false);
  });

  it('rejects number for grossReceipts (must be string)', () => {
    expect(TaxpayerInputSchema.safeParse({ ...validInput, grossReceipts: 500000 }).success).toBe(false);
  });

  it('rejects boolean coercion for isVatRegistered', () => {
    expect(TaxpayerInputSchema.safeParse({ ...validInput, isVatRegistered: 'false' }).success).toBe(false);
  });

  it('accepts null for actualFilingDate', () => {
    expect(TaxpayerInputSchema.safeParse({ ...validInput, actualFilingDate: null }).success).toBe(true);
  });

  it('accepts valid actualFilingDate', () => {
    expect(TaxpayerInputSchema.safeParse({ ...validInput, actualFilingDate: '2024-04-15' }).success).toBe(true);
  });

  it('rejects undefined for nullable fields (must use null)', () => {
    expect(TaxpayerInputSchema.safeParse({ ...validInput, electedRegime: undefined }).success).toBe(false);
  });

  it('accepts all RegimeElection values', () => {
    for (const v of ['ELECT_EIGHT_PCT', 'ELECT_OSD', 'ELECT_ITEMIZED']) {
      expect(TaxpayerInputSchema.safeParse({ ...validInput, electedRegime: v }).success).toBe(true);
    }
  });
});

// ─── Per-step wizard schemas ──────────────────────────────────────────────────

describe('TaxpayerProfileSchema (WS-01)', () => {
  it('accepts valid taxpayerType', () => {
    expect(TaxpayerProfileSchema.safeParse({ taxpayerType: 'PURELY_SE' }).success).toBe(true);
  });
  it('rejects unknown field', () => {
    expect(TaxpayerProfileSchema.safeParse({ taxpayerType: 'PURELY_SE', extra: 'x' }).success).toBe(false);
  });
});

describe('TaxYearInfoSchema (WS-03)', () => {
  it('accepts valid year and period', () => {
    expect(TaxYearInfoSchema.safeParse({ taxYear: 2024, filingPeriod: 'ANNUAL' }).success).toBe(true);
  });
  it('rejects Q4 filing period', () => {
    expect(TaxYearInfoSchema.safeParse({ taxYear: 2024, filingPeriod: 'Q4' }).success).toBe(false);
  });
});

describe('GrossReceiptsSchema (WS-04)', () => {
  it('accepts valid grossReceipts', () => {
    expect(GrossReceiptsSchema.safeParse({ grossReceipts: '1500000.00' }).success).toBe(true);
  });
  it('rejects grossReceiptsAmount (wrong field name)', () => {
    expect(GrossReceiptsSchema.safeParse({ grossReceiptsAmount: '1500000.00' }).success).toBe(false);
  });
});

// ─── WasmResultSchema ─────────────────────────────────────────────────────────

describe('WasmResultSchema', () => {
  const ResultSchema = WasmResultSchema(TaxpayerTypeSchema);

  it('accepts ok=true result', () => {
    expect(ResultSchema.safeParse({ ok: true, data: 'PURELY_SE' }).success).toBe(true);
  });
  it('accepts ok=false result with errors array', () => {
    expect(ResultSchema.safeParse({
      ok: false,
      errors: [{ code: 'E001', message: 'bad input', field: null }],
    }).success).toBe(true);
  });
  it('rejects ok=true without data', () => {
    expect(ResultSchema.safeParse({ ok: true }).success).toBe(false);
  });
  it('rejects ok=false without errors', () => {
    expect(ResultSchema.safeParse({ ok: false }).success).toBe(false);
  });
  it('rejects ok=true with wrong data type', () => {
    expect(ResultSchema.safeParse({ ok: true, data: 'NOT_A_TAXPAYER_TYPE' }).success).toBe(false);
  });
});

// ─── RegimeElectionSchema ────────────────────────────────────────────────────

describe('RegimeElectionSchema', () => {
  it('accepts ELECT_EIGHT_PCT', () => {
    expect(RegimeElectionSchema.safeParse('ELECT_EIGHT_PCT').success).toBe(true);
  });
  it('accepts ELECT_OSD', () => {
    expect(RegimeElectionSchema.safeParse('ELECT_OSD').success).toBe(true);
  });
  it('accepts ELECT_ITEMIZED', () => {
    expect(RegimeElectionSchema.safeParse('ELECT_ITEMIZED').success).toBe(true);
  });
  it('rejects EIGHT_PCT (missing ELECT_ prefix)', () => {
    expect(RegimeElectionSchema.safeParse('EIGHT_PCT').success).toBe(false);
  });
});
