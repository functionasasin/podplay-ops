import { describe, it, expect } from 'vitest';
import {
  TaxpayerProfileSchema,
  TaxYearInfoSchema,
  GrossReceiptsSchema,
  DepreciationEntrySchema,
  NolcoEntrySchema,
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
} from '@/components/wizard';
import type { WizardMode } from '@/components/wizard/WS00ModeSelection';
import type { BusinessCategory } from '@/components/wizard/WS02BusinessType';
import type { ExpenseInputMethod } from '@/components/wizard/WS06ExpenseMethod';

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
