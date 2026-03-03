/**
 * Tests for Estate Tax Zod schemas (§4.23)
 */

import { describe, it, expect } from 'vitest';
import {
  decedentDetailsSchema,
  executorDetailsSchema,
  realPropertyItemSchema,
  personalPropertyItemSchema,
  taxableTransferSchema,
  businessInterestSchema,
  exemptAssetSchema,
  otherAssetsSchema,
  deductionItemSchema,
  ordinaryDeductionsSchema,
  specialDeductionsSchema,
  filingDataSchema,
  estateTaxWizardStateSchema,
} from '@/schemas/estate-tax';
import { createDefaultEstateTaxState } from '@/types/estate-tax';

// ============================================================================
// Tab 1 — Decedent Details Schema
// ============================================================================

describe('estate-tax schemas > decedentDetailsSchema', () => {
  const validDecedent = {
    name: 'Dela Cruz, Juan Andres Santos',
    dateOfDeath: '2024-03-15',
    citizenship: 'Filipino' as const,
    isNonResidentAlien: false,
    address: '14 Mabini St., Barangay San Antonio, Makati City',
    maritalStatus: 'married' as const,
    propertyRegime: 'ACP' as const,
    worldwideGrossEstate: null,
  };

  it('accepts valid decedent details', () => {
    const result = decedentDetailsSchema.safeParse(validDecedent);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = decedentDetailsSchema.safeParse({ ...validDecedent, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty dateOfDeath', () => {
    const result = decedentDetailsSchema.safeParse({ ...validDecedent, dateOfDeath: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = decedentDetailsSchema.safeParse({ ...validDecedent, dateOfDeath: '15-03-2024' });
    expect(result.success).toBe(false);
  });

  it('rejects empty address', () => {
    const result = decedentDetailsSchema.safeParse({ ...validDecedent, address: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid citizenship value', () => {
    const result = decedentDetailsSchema.safeParse({ ...validDecedent, citizenship: 'American' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid marital status', () => {
    const result = decedentDetailsSchema.safeParse({ ...validDecedent, maritalStatus: 'divorced' });
    expect(result.success).toBe(false);
  });

  it('accepts null propertyRegime', () => {
    const result = decedentDetailsSchema.safeParse({ ...validDecedent, propertyRegime: null });
    expect(result.success).toBe(true);
  });

  it('accepts NRA citizenship', () => {
    const result = decedentDetailsSchema.safeParse({
      ...validDecedent,
      citizenship: 'NRA',
      isNonResidentAlien: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts worldwide gross estate for NRA', () => {
    const result = decedentDetailsSchema.safeParse({
      ...validDecedent,
      citizenship: 'NRA',
      isNonResidentAlien: true,
      worldwideGrossEstate: 50_000_000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative worldwide gross estate', () => {
    const result = decedentDetailsSchema.safeParse({
      ...validDecedent,
      worldwideGrossEstate: -100,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tab 2 — Executor Schema
// ============================================================================

describe('estate-tax schemas > executorDetailsSchema', () => {
  it('accepts valid executor details', () => {
    const result = executorDetailsSchema.safeParse({
      name: 'Maria Santos',
      tin: '123-456-789',
      contact: '+63 917 123 4567',
      email: 'maria@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty executor name', () => {
    const result = executorDetailsSchema.safeParse({
      name: '',
      tin: '',
      contact: '',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty TIN, contact, email (not required)', () => {
    const result = executorDetailsSchema.safeParse({
      name: 'Maria Santos',
      tin: '',
      contact: '',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = executorDetailsSchema.safeParse({
      name: 'Maria Santos',
      tin: '',
      contact: '',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tab 3 — Real Property Schema
// ============================================================================

describe('estate-tax schemas > realPropertyItemSchema', () => {
  const validProperty = {
    id: 'prop-1',
    titleNumber: 'TCT-123456',
    taxDecNumber: 'TD-2024-001',
    location: 'Makati City, Metro Manila',
    lotArea: 200,
    improvementArea: 150,
    classification: 'residential' as const,
    fmvTaxDec: 3_000_000,
    fmvBirZonal: 4_500_000,
    ownership: 'exclusive' as const,
    isFamilyHome: true,
    hasBarangayCert: true,
  };

  it('accepts valid real property item', () => {
    const result = realPropertyItemSchema.safeParse(validProperty);
    expect(result.success).toBe(true);
  });

  it('rejects empty title number', () => {
    const result = realPropertyItemSchema.safeParse({ ...validProperty, titleNumber: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty location', () => {
    const result = realPropertyItemSchema.safeParse({ ...validProperty, location: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative FMV tax dec', () => {
    const result = realPropertyItemSchema.safeParse({ ...validProperty, fmvTaxDec: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects negative FMV BIR zonal', () => {
    const result = realPropertyItemSchema.safeParse({ ...validProperty, fmvBirZonal: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts null lot and improvement areas', () => {
    const result = realPropertyItemSchema.safeParse({
      ...validProperty,
      lotArea: null,
      improvementArea: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all classification types', () => {
    for (const classification of ['residential', 'commercial', 'industrial', 'agricultural']) {
      const result = realPropertyItemSchema.safeParse({ ...validProperty, classification });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all ownership types', () => {
    for (const ownership of ['exclusive', 'conjugal', 'community']) {
      const result = realPropertyItemSchema.safeParse({ ...validProperty, ownership });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// Tab 4 — Personal Property Schema
// ============================================================================

describe('estate-tax schemas > personalPropertyItemSchema', () => {
  const validItem = {
    id: 'pp-1',
    subtype: 'bank_deposit' as const,
    description: 'BDO Savings Account',
    fmv: 500_000,
    ownership: 'exclusive' as const,
  };

  it('accepts valid personal property item', () => {
    const result = personalPropertyItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = personalPropertyItemSchema.safeParse({ ...validItem, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative FMV', () => {
    const result = personalPropertyItemSchema.safeParse({ ...validItem, fmv: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts all 8 subtypes', () => {
    const subtypes = ['cash', 'bank_deposit', 'receivable', 'shares', 'bonds', 'vehicle', 'jewelry', 'other'];
    for (const subtype of subtypes) {
      const result = personalPropertyItemSchema.safeParse({ ...validItem, subtype });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// Tab 5 — Other Assets Schemas
// ============================================================================

describe('estate-tax schemas > taxableTransferSchema', () => {
  it('accepts valid taxable transfer', () => {
    const result = taxableTransferSchema.safeParse({
      id: 'tt-1',
      type: 'LIFE_INSURANCE',
      description: 'Sun Life policy',
      fmv: 1_000_000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all 5 transfer types', () => {
    const types = [
      'CONTEMPLATION_OF_DEATH', 'REVOCABLE', 'POWER_OF_APPOINTMENT',
      'LIFE_INSURANCE', 'INSUFFICIENT_CONSIDERATION',
    ];
    for (const type of types) {
      const result = taxableTransferSchema.safeParse({
        id: 'tt-1', type, description: 'test', fmv: 100,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('estate-tax schemas > businessInterestSchema', () => {
  it('accepts valid business interest', () => {
    const result = businessInterestSchema.safeParse({
      id: 'bi-1',
      businessName: 'ABC Corp',
      description: '30% share',
      fmv: 2_000_000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty business name', () => {
    const result = businessInterestSchema.safeParse({
      id: 'bi-1',
      businessName: '',
      description: '',
      fmv: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('estate-tax schemas > exemptAssetSchema', () => {
  it('accepts valid exempt asset', () => {
    const result = exemptAssetSchema.safeParse({
      id: 'ea-1',
      description: 'GSIS proceeds',
      fmv: 500_000,
      legalBasis: 'Sec. 87(A)',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Tab 6 — Ordinary Deductions Schema
// ============================================================================

describe('estate-tax schemas > deductionItemSchema', () => {
  it('accepts valid deduction item', () => {
    const result = deductionItemSchema.safeParse({
      id: 'di-1',
      description: 'Hospital bills',
      amount: 200_000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative amount', () => {
    const result = deductionItemSchema.safeParse({
      id: 'di-1',
      description: 'Hospital bills',
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = deductionItemSchema.safeParse({
      id: 'di-1',
      description: '',
      amount: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe('estate-tax schemas > ordinaryDeductionsSchema', () => {
  it('accepts valid ordinary deductions with empty arrays', () => {
    const result = ordinaryDeductionsSchema.safeParse(
      createDefaultEstateTaxState().ordinaryDeductions,
    );
    expect(result.success).toBe(true);
  });

  it('accepts funeral expenses as null', () => {
    const deductions = { ...createDefaultEstateTaxState().ordinaryDeductions, funeralExpenses: null };
    const result = ordinaryDeductionsSchema.safeParse(deductions);
    expect(result.success).toBe(true);
  });

  it('accepts judicial admin expenses as null', () => {
    const deductions = {
      ...createDefaultEstateTaxState().ordinaryDeductions,
      judicialAdminExpenses: null,
    };
    const result = ordinaryDeductionsSchema.safeParse(deductions);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Tab 7 — Special Deductions Schema
// ============================================================================

describe('estate-tax schemas > specialDeductionsSchema', () => {
  it('accepts valid special deductions', () => {
    const result = specialDeductionsSchema.safeParse({
      medicalExpenses: 100_000,
      ra4917Benefits: 0,
      foreignTaxCredits: 0,
      standardDeduction: 5_000_000,
      familyHomeDeduction: 10_000_000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative medical expenses', () => {
    const result = specialDeductionsSchema.safeParse({
      medicalExpenses: -100,
      ra4917Benefits: 0,
      foreignTaxCredits: 0,
      standardDeduction: 5_000_000,
      familyHomeDeduction: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tab 8 — Filing & Amnesty Schema
// ============================================================================

describe('estate-tax schemas > filingDataSchema', () => {
  it('accepts valid filing data', () => {
    const result = filingDataSchema.safeParse(createDefaultEstateTaxState().filing);
    expect(result.success).toBe(true);
  });

  it('accepts all flags set to true', () => {
    const result = filingDataSchema.safeParse({
      userElectsAmnesty: true,
      amnestyDeductionMode: 'narrow',
      isAmended: true,
      hasExtension: true,
      isInstallment: true,
      isJudicialSettlement: true,
      hasPcggViolation: true,
      hasRa3019Violation: true,
      hasRa9160Violation: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid amnesty deduction mode', () => {
    const result = filingDataSchema.safeParse({
      ...createDefaultEstateTaxState().filing,
      amnestyDeductionMode: 'custom',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Full Wizard State Schema
// ============================================================================

describe('estate-tax schemas > estateTaxWizardStateSchema', () => {
  it('accepts a complete default state', () => {
    const state = createDefaultEstateTaxState();
    // Need to fill required fields
    state.decedent.name = 'Juan dela Cruz';
    state.decedent.dateOfDeath = '2024-03-15';
    state.decedent.address = 'Makati City';
    state.executor.name = 'Maria Santos';

    const result = estateTaxWizardStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });

  it('rejects state with missing required decedent name', () => {
    const state = createDefaultEstateTaxState();
    // Leave name empty
    state.decedent.dateOfDeath = '2024-03-15';
    state.decedent.address = 'Makati City';
    state.executor.name = 'Maria Santos';

    const result = estateTaxWizardStateSchema.safeParse(state);
    expect(result.success).toBe(false);
  });
});
