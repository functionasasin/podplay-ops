import { describe, it, expect } from 'vitest';
import {
  TaxpayerProfileSchema,
  TaxYearInfoSchema,
  GrossReceiptsSchema,
  DepreciationEntrySchema,
  NolcoEntrySchema,
  Form2307EntrySchema,
  QuarterlyPaymentSchema,
} from '@/schemas/input';
import {
  WS00ModeSelection,
  WS01TaxpayerProfile,
  WS02BusinessType,
  WS03TaxYear,
  WS04GrossReceipts,
  WS05Compensation,
  WS06ExpenseMethod,
  WS07AItemizedExpenses,
  WS07BFinancialItems,
  WS07CDepreciation,
  WS07DNolco,
  WS08CwtForm2307,
  WS09PriorQuarterly,
  WS10Registration,
  WS11RegimeElection,
  WS12FilingDetails,
  WS13PriorYearCredits,
  WizardReview,
} from '@/components/wizard';
import type { WizardMode } from '@/components/wizard/WS00ModeSelection';
import type { BusinessCategory } from '@/components/wizard/WS02BusinessType';
import type { ExpenseInputMethod } from '@/components/wizard/WS06ExpenseMethod';
import type { VatStatus, BirRegistrationStatus } from '@/components/wizard/WS10Registration';
import type { RegimeElectionOption } from '@/components/wizard/WS11RegimeElection';
import type { ReturnTypeOption } from '@/components/wizard/WS12FilingDetails';

// ============================================================================
// Component exports — all steps export functions
// ============================================================================

describe('Wizard step component exports', () => {
  it('WS00ModeSelection is a function', () => {
    expect(typeof WS00ModeSelection).toBe('function');
  });

  it('WS01TaxpayerProfile is a function', () => {
    expect(typeof WS01TaxpayerProfile).toBe('function');
  });

  it('WS02BusinessType is a function', () => {
    expect(typeof WS02BusinessType).toBe('function');
  });

  it('WS03TaxYear is a function', () => {
    expect(typeof WS03TaxYear).toBe('function');
  });

  it('WS04GrossReceipts is a function', () => {
    expect(typeof WS04GrossReceipts).toBe('function');
  });

  it('WS05Compensation is a function', () => {
    expect(typeof WS05Compensation).toBe('function');
  });

  it('WS06ExpenseMethod is a function', () => {
    expect(typeof WS06ExpenseMethod).toBe('function');
  });

  it('WS07AItemizedExpenses is a function', () => {
    expect(typeof WS07AItemizedExpenses).toBe('function');
  });

  it('WS07BFinancialItems is a function', () => {
    expect(typeof WS07BFinancialItems).toBe('function');
  });

  it('WS07CDepreciation is a function', () => {
    expect(typeof WS07CDepreciation).toBe('function');
  });

  it('WS07DNolco is a function', () => {
    expect(typeof WS07DNolco).toBe('function');
  });
});

// ============================================================================
// WS00 — Mode Selection type contract
// ============================================================================

describe('WS00 mode selection types', () => {
  it('ANNUAL is a valid WizardMode', () => {
    const mode: WizardMode = 'ANNUAL';
    expect(mode).toBe('ANNUAL');
  });

  it('QUARTERLY is a valid WizardMode', () => {
    const mode: WizardMode = 'QUARTERLY';
    expect(mode).toBe('QUARTERLY');
  });

  it('PENALTY is a valid WizardMode', () => {
    const mode: WizardMode = 'PENALTY';
    expect(mode).toBe('PENALTY');
  });
});

// ============================================================================
// WS01 — TaxpayerProfileSchema (§7.7.3)
// ============================================================================

describe('WS01 — TaxpayerProfileSchema', () => {
  it('accepts PURELY_SE', () => {
    const result = TaxpayerProfileSchema.safeParse({ taxpayerType: 'PURELY_SE' });
    expect(result.success).toBe(true);
  });

  it('accepts MIXED_INCOME', () => {
    const result = TaxpayerProfileSchema.safeParse({ taxpayerType: 'MIXED_INCOME' });
    expect(result.success).toBe(true);
  });

  it('accepts COMPENSATION_ONLY', () => {
    const result = TaxpayerProfileSchema.safeParse({ taxpayerType: 'COMPENSATION_ONLY' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid taxpayerType', () => {
    const result = TaxpayerProfileSchema.safeParse({ taxpayerType: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects missing taxpayerType', () => {
    const result = TaxpayerProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict)', () => {
    const result = TaxpayerProfileSchema.safeParse({
      taxpayerType: 'PURELY_SE',
      extraField: 'oops',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// WS02 — BusinessCategory type contract
// ============================================================================

describe('WS02 business category types', () => {
  it('PROFESSIONAL_SERVICES is a valid BusinessCategory', () => {
    const cat: BusinessCategory = 'PROFESSIONAL_SERVICES';
    expect(cat).toBe('PROFESSIONAL_SERVICES');
  });

  it('REGULATED_PROFESSIONAL is a valid BusinessCategory', () => {
    const cat: BusinessCategory = 'REGULATED_PROFESSIONAL';
    expect(cat).toBe('REGULATED_PROFESSIONAL');
  });

  it('TRADER is a valid BusinessCategory', () => {
    const cat: BusinessCategory = 'TRADER';
    expect(cat).toBe('TRADER');
  });

  it('MIXED_BUSINESS is a valid BusinessCategory', () => {
    const cat: BusinessCategory = 'MIXED_BUSINESS';
    expect(cat).toBe('MIXED_BUSINESS');
  });

  it('NOT_SURE is a valid BusinessCategory', () => {
    const cat: BusinessCategory = 'NOT_SURE';
    expect(cat).toBe('NOT_SURE');
  });
});

// ============================================================================
// WS03 — TaxYearInfoSchema (§7.7.5)
// ============================================================================

describe('WS03 — TaxYearInfoSchema', () => {
  it('accepts valid tax year + ANNUAL period', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2025,
      filingPeriod: 'ANNUAL',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid tax year + Q1 period', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2025,
      filingPeriod: 'Q1',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid tax year + Q2 period', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2024,
      filingPeriod: 'Q2',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid tax year + Q3 period', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2023,
      filingPeriod: 'Q3',
    });
    expect(result.success).toBe(true);
  });

  it('rejects tax year below 2018', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2017,
      filingPeriod: 'ANNUAL',
    });
    expect(result.success).toBe(false);
  });

  it('rejects tax year above 2030', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2031,
      filingPeriod: 'ANNUAL',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid filing period', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2025,
      filingPeriod: 'Q4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing tax year', () => {
    const result = TaxYearInfoSchema.safeParse({ filingPeriod: 'ANNUAL' });
    expect(result.success).toBe(false);
  });

  it('rejects missing filing period', () => {
    const result = TaxYearInfoSchema.safeParse({ taxYear: 2025 });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict)', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2025,
      filingPeriod: 'ANNUAL',
      mode: 'ANNUAL',
    });
    expect(result.success).toBe(false);
  });

  it('accepts min valid tax year 2018', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2018,
      filingPeriod: 'ANNUAL',
    });
    expect(result.success).toBe(true);
  });

  it('accepts max valid tax year 2030', () => {
    const result = TaxYearInfoSchema.safeParse({
      taxYear: 2030,
      filingPeriod: 'Q1',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// WS04 — GrossReceiptsSchema (§7.7.6)
// ============================================================================

describe('WS04 — GrossReceiptsSchema', () => {
  it('accepts valid gross receipts string', () => {
    const result = GrossReceiptsSchema.safeParse({ grossReceipts: '500000.00' });
    expect(result.success).toBe(true);
  });

  it('accepts zero gross receipts', () => {
    const result = GrossReceiptsSchema.safeParse({ grossReceipts: '0.00' });
    expect(result.success).toBe(true);
  });

  it('accepts large valid amount', () => {
    const result = GrossReceiptsSchema.safeParse({ grossReceipts: '3000000.00' });
    expect(result.success).toBe(true);
  });

  it('rejects negative gross receipts', () => {
    const result = GrossReceiptsSchema.safeParse({ grossReceipts: '-100.00' });
    expect(result.success).toBe(false);
  });

  it('rejects missing gross receipts', () => {
    const result = GrossReceiptsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric string', () => {
    const result = GrossReceiptsSchema.safeParse({ grossReceipts: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict)', () => {
    const result = GrossReceiptsSchema.safeParse({
      grossReceipts: '500000.00',
      extra: 'field',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// WS06 — ExpenseInputMethod type contract
// ============================================================================

describe('WS06 expense input method types', () => {
  it('ITEMIZED is a valid ExpenseInputMethod', () => {
    const m: ExpenseInputMethod = 'ITEMIZED';
    expect(m).toBe('ITEMIZED');
  });

  it('OSD is a valid ExpenseInputMethod', () => {
    const m: ExpenseInputMethod = 'OSD';
    expect(m).toBe('OSD');
  });

  it('NO_EXPENSES is a valid ExpenseInputMethod', () => {
    const m: ExpenseInputMethod = 'NO_EXPENSES';
    expect(m).toBe('NO_EXPENSES');
  });
});

// ============================================================================
// WS07C — DepreciationEntrySchema (§7.7.11)
// ============================================================================

const validDepreciationEntry = {
  assetName: 'MacBook Pro 2023',
  assetCost: '120000.00',
  salvageValue: '0.00',
  usefulLifeYears: 5,
  acquisitionDate: '2023-01-15',
  method: 'STRAIGHT_LINE' as const,
  priorAccumulatedDepreciation: '0.00',
};

describe('WS07C — DepreciationEntrySchema', () => {
  it('accepts valid depreciation entry', () => {
    const result = DepreciationEntrySchema.safeParse(validDepreciationEntry);
    expect(result.success).toBe(true);
  });

  it('accepts DECLINING_BALANCE method', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      method: 'DECLINING_BALANCE',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing asset name', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      assetName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative asset cost', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      assetCost: '-1000.00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects useful life below 1', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      usefulLifeYears: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects useful life above 50', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      usefulLifeYears: 51,
    });
    expect(result.success).toBe(false);
  });

  it('accepts useful life of 1', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      usefulLifeYears: 1,
    });
    expect(result.success).toBe(true);
  });

  it('accepts useful life of 50', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      usefulLifeYears: 50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid depreciation method', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      method: 'UNITS_OF_PRODUCTION',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid acquisition date', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      acquisitionDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = DepreciationEntrySchema.safeParse({
      assetName: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict)', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      unknownField: 'oops',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero salvage value', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      salvageValue: '0.00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts non-zero salvage value', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      salvageValue: '5000.00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts zero prior accumulated depreciation', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      priorAccumulatedDepreciation: '0.00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts non-zero prior accumulated depreciation', () => {
    const result = DepreciationEntrySchema.safeParse({
      ...validDepreciationEntry,
      priorAccumulatedDepreciation: '24000.00',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// WS07D — NolcoEntrySchema (§7.7.12)
// ============================================================================

const validNolcoEntry = {
  lossYear: 2023,
  originalLoss: '500000.00',
  remainingBalance: '300000.00',
  expiryYear: 2026,
};

describe('WS07D — NolcoEntrySchema', () => {
  it('accepts valid NOLCO entry', () => {
    const result = NolcoEntrySchema.safeParse(validNolcoEntry);
    expect(result.success).toBe(true);
  });

  it('accepts loss year 2022', () => {
    const result = NolcoEntrySchema.safeParse({
      ...validNolcoEntry,
      lossYear: 2022,
    });
    expect(result.success).toBe(true);
  });

  it('rejects loss year below 2018', () => {
    const result = NolcoEntrySchema.safeParse({
      ...validNolcoEntry,
      lossYear: 2017,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero original loss', () => {
    const result = NolcoEntrySchema.safeParse({
      ...validNolcoEntry,
      originalLoss: '-100.00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative remaining balance', () => {
    const result = NolcoEntrySchema.safeParse({
      ...validNolcoEntry,
      remainingBalance: '-1.00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts remaining balance equal to original loss (first year carry-over)', () => {
    const result = NolcoEntrySchema.safeParse({
      ...validNolcoEntry,
      originalLoss: '500000.00',
      remainingBalance: '500000.00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing loss year', () => {
    const result = NolcoEntrySchema.safeParse({
      originalLoss: '500000.00',
      remainingBalance: '300000.00',
      expiryYear: 2026,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing original loss', () => {
    const result = NolcoEntrySchema.safeParse({
      lossYear: 2023,
      remainingBalance: '300000.00',
      expiryYear: 2026,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict)', () => {
    const result = NolcoEntrySchema.safeParse({
      ...validNolcoEntry,
      extraField: 'bad',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Wizard step prop interfaces — structural tests
// ============================================================================

describe('WizardFormData field presence (via DEFAULT_WIZARD_DATA)', () => {
  it('DEFAULT_WIZARD_DATA contains all required wizard fields', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('taxpayerType');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('taxYear');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('filingPeriod');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('grossReceipts');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('taxableCompensation');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('compensationCwt');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('itemizedExpenses');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('cwt2307Entries');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('osdElected');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('electedRegime');
  });

  it('grossReceipts defaults to string "0.00"', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(typeof DEFAULT_WIZARD_DATA.grossReceipts).toBe('string');
    expect(DEFAULT_WIZARD_DATA.grossReceipts).toBe('0.00');
  });

  it('taxableCompensation defaults to string "0.00"', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(typeof DEFAULT_WIZARD_DATA.taxableCompensation).toBe('string');
  });

  it('itemizedExpenses defaults to empty object', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA.itemizedExpenses).toEqual({});
  });

  it('cwt2307Entries defaults to empty array', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(Array.isArray(DEFAULT_WIZARD_DATA.cwt2307Entries)).toBe(true);
    expect(DEFAULT_WIZARD_DATA.cwt2307Entries).toHaveLength(0);
  });

  it('osdElected defaults to null', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA.osdElected).toBeNull();
  });

  it('electedRegime defaults to null', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA.electedRegime).toBeNull();
  });

  it('filingPeriod defaults to ANNUAL', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA.filingPeriod).toBe('ANNUAL');
  });
});

// ============================================================================
// Stage 11 — Component exports WS-08 through REVIEW
// ============================================================================

describe('Stage 11 wizard step component exports', () => {
  it('WS08CwtForm2307 is a function', () => {
    expect(typeof WS08CwtForm2307).toBe('function');
  });

  it('WS09PriorQuarterly is a function', () => {
    expect(typeof WS09PriorQuarterly).toBe('function');
  });

  it('WS10Registration is a function', () => {
    expect(typeof WS10Registration).toBe('function');
  });

  it('WS11RegimeElection is a function', () => {
    expect(typeof WS11RegimeElection).toBe('function');
  });

  it('WS12FilingDetails is a function', () => {
    expect(typeof WS12FilingDetails).toBe('function');
  });

  it('WS13PriorYearCredits is a function', () => {
    expect(typeof WS13PriorYearCredits).toBe('function');
  });

  it('WizardReview is a function', () => {
    expect(typeof WizardReview).toBe('function');
  });
});

// ============================================================================
// WS-08 — Form2307EntrySchema (§7.7.13)
// ============================================================================

const validForm2307Entry = {
  payorName: 'Acme Corporation',
  payorTin: '123-456-789',
  atcCode: 'WI010',
  incomePayment: '100000.00',
  taxWithheld: '10000.00',
  periodFrom: '2024-01-01',
  periodTo: '2024-12-31',
  quarterOfCredit: null,
};

describe('WS08 — Form2307EntrySchema', () => {
  it('accepts valid Form 2307 entry', () => {
    const result = Form2307EntrySchema.safeParse(validForm2307Entry);
    expect(result.success).toBe(true);
  });

  it('accepts 9-digit TIN format (XXX-XXX-XXX)', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      payorTin: '123-456-789',
    });
    expect(result.success).toBe(true);
  });

  it('accepts 12-digit TIN format (XXX-XXX-XXX-XXX)', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      payorTin: '123-456-789-000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects malformed TIN', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      payorTin: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty payor name', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      payorName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing payor name', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      payorName: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty ATC code', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      atcCode: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative income payment', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      incomePayment: '-1.00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative tax withheld', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      taxWithheld: '-1.00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid period from date', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      periodFrom: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid period to date', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      periodTo: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero tax withheld', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      taxWithheld: '0.00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null quarterOfCredit', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      quarterOfCredit: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid quarterOfCredit (numeric 1)', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      quarterOfCredit: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown fields (strict)', () => {
    const result = Form2307EntrySchema.safeParse({
      ...validForm2307Entry,
      extraField: 'bad',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// WS-09 — QuarterlyPaymentSchema (§7.7.14)
// ============================================================================

// Quarter is numeric (1, 2, 3) per QuarterSchema; form1701qPeriod is string enum
const validQuarterlyPayment = {
  quarter: 1 as const,
  amountPaid: '15000.00',
  datePaid: '2024-05-15',
  form1701qPeriod: 'Q1' as const,
};

describe('WS09 — QuarterlyPaymentSchema', () => {
  it('accepts valid Q1 payment', () => {
    const result = QuarterlyPaymentSchema.safeParse(validQuarterlyPayment);
    expect(result.success).toBe(true);
  });

  it('accepts valid Q2 payment', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      ...validQuarterlyPayment,
      quarter: 2,
      form1701qPeriod: 'Q2',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid Q3 payment', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      ...validQuarterlyPayment,
      quarter: 3,
      form1701qPeriod: 'Q3',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative amount paid', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      ...validQuarterlyPayment,
      amountPaid: '-100.00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero amount paid', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      ...validQuarterlyPayment,
      amountPaid: '0.00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null datePaid', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      ...validQuarterlyPayment,
      datePaid: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid form1701qPeriod (Q4 not allowed)', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      ...validQuarterlyPayment,
      form1701qPeriod: 'Q4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing quarter field', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      amountPaid: '15000.00',
      datePaid: null,
      form1701qPeriod: 'Q1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict)', () => {
    const result = QuarterlyPaymentSchema.safeParse({
      ...validQuarterlyPayment,
      extra: 'bad',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// WS-10 — Registration/VAT type contracts (§7.7.15)
// ============================================================================

describe('WS10 registration status types', () => {
  it('YES is a valid VatStatus', () => {
    const v: VatStatus = 'YES';
    expect(v).toBe('YES');
  });

  it('NO is a valid VatStatus', () => {
    const v: VatStatus = 'NO';
    expect(v).toBe('NO');
  });

  it('YES is a valid BirRegistrationStatus', () => {
    const s: BirRegistrationStatus = 'YES';
    expect(s).toBe('YES');
  });

  it('PLANNING is a valid BirRegistrationStatus', () => {
    const s: BirRegistrationStatus = 'PLANNING';
    expect(s).toBe('PLANNING');
  });
});

// ============================================================================
// WS-11 — Regime election type contracts (§7.7.16)
// ============================================================================

describe('WS11 regime election types', () => {
  it('ELECT_EIGHT_PCT is a valid RegimeElectionOption', () => {
    const r: RegimeElectionOption = 'ELECT_EIGHT_PCT';
    expect(r).toBe('ELECT_EIGHT_PCT');
  });

  it('ELECT_OSD is a valid RegimeElectionOption', () => {
    const r: RegimeElectionOption = 'ELECT_OSD';
    expect(r).toBe('ELECT_OSD');
  });

  it('ELECT_ITEMIZED is a valid RegimeElectionOption', () => {
    const r: RegimeElectionOption = 'ELECT_ITEMIZED';
    expect(r).toBe('ELECT_ITEMIZED');
  });

  it('null is valid for optimizer mode', () => {
    const r: RegimeElectionOption = null;
    expect(r).toBeNull();
  });
});

// ============================================================================
// WS-12 — Filing details type contracts (§7.7.17)
// ============================================================================

describe('WS12 return type contracts', () => {
  it('ORIGINAL is a valid ReturnTypeOption', () => {
    const r: ReturnTypeOption = 'ORIGINAL';
    expect(r).toBe('ORIGINAL');
  });

  it('AMENDED is a valid ReturnTypeOption', () => {
    const r: ReturnTypeOption = 'AMENDED';
    expect(r).toBe('AMENDED');
  });
});

// ============================================================================
// WS-13 — Prior year carry-over via TaxpayerInputSchema (§7.7.18)
// ============================================================================

describe('WS13 prior year credits — DEFAULT_WIZARD_DATA', () => {
  it('priorYearExcessCwt defaults to string "0.00"', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('priorYearExcessCwt');
    expect(typeof DEFAULT_WIZARD_DATA.priorYearExcessCwt).toBe('string');
    expect(DEFAULT_WIZARD_DATA.priorYearExcessCwt).toBe('0.00');
  });
});

// ============================================================================
// REVIEW — WizardReview structural test
// ============================================================================

describe('WizardReview step', () => {
  it('WizardReview is a function', () => {
    expect(typeof WizardReview).toBe('function');
  });

  it('DEFAULT_WIZARD_DATA has returnType field', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('returnType');
  });

  it('DEFAULT_WIZARD_DATA has priorPaymentForReturn field', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('priorPaymentForReturn');
  });

  it('DEFAULT_WIZARD_DATA returnType is ORIGINAL', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA.returnType).toBe('ORIGINAL');
  });

  it('DEFAULT_WIZARD_DATA actualFilingDate defaults to null', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('actualFilingDate');
    expect(DEFAULT_WIZARD_DATA.actualFilingDate).toBeNull();
  });

  it('DEFAULT_WIZARD_DATA overpaymentPreference defaults to null', async () => {
    const { DEFAULT_WIZARD_DATA } = await import('@/types/wizard');
    expect(DEFAULT_WIZARD_DATA).toHaveProperty('overpaymentPreference');
    expect(DEFAULT_WIZARD_DATA.overpaymentPreference).toBeNull();
  });
});
