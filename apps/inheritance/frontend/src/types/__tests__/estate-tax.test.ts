/**
 * Tests for Estate Tax types and utility functions (§4.23)
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultEstateTaxState,
  getDeductionRules,
  prePopulateFromEngineInput,
  isTabValid,
  TAB_NAMES,
  TAB_COUNT,
  MARITAL_STATUSES,
  PROPERTY_REGIMES,
  PROPERTY_CLASSIFICATIONS,
  PROPERTY_OWNERSHIPS,
  PERSONAL_PROPERTY_SUBTYPES,
  TAXABLE_TRANSFER_TYPES,
} from '@/types/estate-tax';
import type {
  EstateTaxWizardState,
  TabIndex,
  DecedentDetails,
} from '@/types/estate-tax';

// ============================================================================
// createDefaultEstateTaxState
// ============================================================================

describe('estate-tax > createDefaultEstateTaxState', () => {
  it('returns a complete default state with all 8 sections', () => {
    const state = createDefaultEstateTaxState();
    expect(state).toHaveProperty('decedent');
    expect(state).toHaveProperty('executor');
    expect(state).toHaveProperty('realProperties');
    expect(state).toHaveProperty('personalProperties');
    expect(state).toHaveProperty('otherAssets');
    expect(state).toHaveProperty('ordinaryDeductions');
    expect(state).toHaveProperty('specialDeductions');
    expect(state).toHaveProperty('filing');
  });

  it('initializes decedent with empty strings and Filipino citizenship', () => {
    const state = createDefaultEstateTaxState();
    expect(state.decedent.name).toBe('');
    expect(state.decedent.dateOfDeath).toBe('');
    expect(state.decedent.citizenship).toBe('Filipino');
    expect(state.decedent.isNonResidentAlien).toBe(false);
    expect(state.decedent.address).toBe('');
    expect(state.decedent.maritalStatus).toBe('single');
    expect(state.decedent.propertyRegime).toBeNull();
    expect(state.decedent.worldwideGrossEstate).toBeNull();
  });

  it('initializes executor with empty strings', () => {
    const state = createDefaultEstateTaxState();
    expect(state.executor.name).toBe('');
    expect(state.executor.tin).toBe('');
    expect(state.executor.contact).toBe('');
    expect(state.executor.email).toBe('');
  });

  it('initializes property arrays as empty', () => {
    const state = createDefaultEstateTaxState();
    expect(state.realProperties).toEqual([]);
    expect(state.personalProperties).toEqual([]);
  });

  it('initializes other assets sections as empty arrays', () => {
    const state = createDefaultEstateTaxState();
    expect(state.otherAssets.taxableTransfers).toEqual([]);
    expect(state.otherAssets.businessInterests).toEqual([]);
    expect(state.otherAssets.exemptAssets).toEqual([]);
  });

  it('initializes ordinary deductions with empty arrays and null PRE_TRAIN fields', () => {
    const state = createDefaultEstateTaxState();
    expect(state.ordinaryDeductions.claimsAgainstEstate).toEqual([]);
    expect(state.ordinaryDeductions.claimsAgainstInsolvent).toEqual([]);
    expect(state.ordinaryDeductions.unpaidMortgages).toEqual([]);
    expect(state.ordinaryDeductions.unpaidTaxes).toEqual([]);
    expect(state.ordinaryDeductions.casualtyLosses).toEqual([]);
    expect(state.ordinaryDeductions.vanishingDeduction).toBe(0);
    expect(state.ordinaryDeductions.publicUseTransfers).toEqual([]);
    expect(state.ordinaryDeductions.funeralExpenses).toBeNull();
    expect(state.ordinaryDeductions.judicialAdminExpenses).toBeNull();
  });

  it('initializes special deductions with standard deduction of ₱5M', () => {
    const state = createDefaultEstateTaxState();
    expect(state.specialDeductions.standardDeduction).toBe(5_000_000);
    expect(state.specialDeductions.medicalExpenses).toBe(0);
    expect(state.specialDeductions.ra4917Benefits).toBe(0);
    expect(state.specialDeductions.foreignTaxCredits).toBe(0);
    expect(state.specialDeductions.familyHomeDeduction).toBe(0);
  });

  it('initializes filing with all flags false and standard amnesty mode', () => {
    const state = createDefaultEstateTaxState();
    expect(state.filing.userElectsAmnesty).toBe(false);
    expect(state.filing.amnestyDeductionMode).toBe('standard');
    expect(state.filing.isAmended).toBe(false);
    expect(state.filing.hasExtension).toBe(false);
    expect(state.filing.isInstallment).toBe(false);
    expect(state.filing.isJudicialSettlement).toBe(false);
    expect(state.filing.hasPcggViolation).toBe(false);
    expect(state.filing.hasRa3019Violation).toBe(false);
    expect(state.filing.hasRa9160Violation).toBe(false);
  });
});

// ============================================================================
// getDeductionRules
// ============================================================================

describe('estate-tax > getDeductionRules', () => {
  it('returns PRE_TRAIN for DOD before 2018-01-01', () => {
    expect(getDeductionRules('2017-12-31')).toBe('PRE_TRAIN');
    expect(getDeductionRules('2010-06-15')).toBe('PRE_TRAIN');
    expect(getDeductionRules('2000-01-01')).toBe('PRE_TRAIN');
  });

  it('returns TRAIN for DOD on or after 2018-01-01', () => {
    expect(getDeductionRules('2018-01-01')).toBe('TRAIN');
    expect(getDeductionRules('2024-03-15')).toBe('TRAIN');
    expect(getDeductionRules('2026-01-01')).toBe('TRAIN');
  });
});

// ============================================================================
// prePopulateFromEngineInput
// ============================================================================

describe('estate-tax > prePopulateFromEngineInput', () => {
  it('populates name and dateOfDeath from EngineInput', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Juan dela Cruz',
        date_of_death: '2024-03-15',
        is_married: false,
        date_of_marriage: null,
      },
    });

    expect(result.decedent!.name).toBe('Juan dela Cruz');
    expect(result.decedent!.dateOfDeath).toBe('2024-03-15');
  });

  it('sets maritalStatus to married when is_married is true', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Test',
        date_of_death: '2024-01-01',
        is_married: true,
        date_of_marriage: '2000-01-01',
      },
    });

    expect(result.decedent!.maritalStatus).toBe('married');
  });

  it('sets maritalStatus to single when is_married is false', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Test',
        date_of_death: '2024-01-01',
        is_married: false,
        date_of_marriage: null,
      },
    });

    expect(result.decedent!.maritalStatus).toBe('single');
  });

  it('sets ACP property regime for marriage >= 1988-08-03', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Test',
        date_of_death: '2024-01-01',
        is_married: true,
        date_of_marriage: '1990-05-20',
      },
    });

    expect(result.decedent!.propertyRegime).toBe('ACP');
  });

  it('sets CPG property regime for marriage < 1988-08-03', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Test',
        date_of_death: '2024-01-01',
        is_married: true,
        date_of_marriage: '1985-01-01',
      },
    });

    expect(result.decedent!.propertyRegime).toBe('CPG');
  });

  it('defaults ACP when married but date_of_marriage is null', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Test',
        date_of_death: '2024-01-01',
        is_married: true,
        date_of_marriage: null,
      },
    });

    expect(result.decedent!.propertyRegime).toBe('ACP');
  });

  it('sets null property regime for unmarried', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Test',
        date_of_death: '2024-01-01',
        is_married: false,
        date_of_marriage: null,
      },
    });

    expect(result.decedent!.propertyRegime).toBeNull();
  });

  it('defaults citizenship to Filipino', () => {
    const result = prePopulateFromEngineInput({
      decedent: {
        name: 'Test',
        date_of_death: '2024-01-01',
        is_married: false,
        date_of_marriage: null,
      },
    });

    expect(result.decedent!.citizenship).toBe('Filipino');
    expect(result.decedent!.isNonResidentAlien).toBe(false);
  });
});

// ============================================================================
// isTabValid
// ============================================================================

describe('estate-tax > isTabValid', () => {
  const filledState: EstateTaxWizardState = {
    ...createDefaultEstateTaxState(),
    decedent: {
      name: 'Juan dela Cruz',
      dateOfDeath: '2024-03-15',
      citizenship: 'Filipino',
      isNonResidentAlien: false,
      address: '14 Mabini St., Makati City',
      maritalStatus: 'single',
      propertyRegime: null,
      worldwideGrossEstate: null,
    },
    executor: {
      name: 'Maria Santos',
      tin: '',
      contact: '',
      email: '',
    },
  };

  it('tab 0 (Decedent) is valid when required fields are filled', () => {
    expect(isTabValid(0, filledState)).toBe(true);
  });

  it('tab 0 (Decedent) is invalid when name is empty', () => {
    const state = { ...filledState, decedent: { ...filledState.decedent, name: '' } };
    expect(isTabValid(0, state)).toBe(false);
  });

  it('tab 0 (Decedent) is invalid when dateOfDeath is empty', () => {
    const state = { ...filledState, decedent: { ...filledState.decedent, dateOfDeath: '' } };
    expect(isTabValid(0, state)).toBe(false);
  });

  it('tab 0 (Decedent) is invalid when address is empty', () => {
    const state = { ...filledState, decedent: { ...filledState.decedent, address: '' } };
    expect(isTabValid(0, state)).toBe(false);
  });

  it('tab 1 (Executor) is valid when executor name is filled', () => {
    expect(isTabValid(1, filledState)).toBe(true);
  });

  it('tab 1 (Executor) is invalid when executor name is empty', () => {
    const state = { ...filledState, executor: { ...filledState.executor, name: '' } };
    expect(isTabValid(1, state)).toBe(false);
  });

  it('tabs 2-7 are always valid (empty = valid)', () => {
    const emptyState = createDefaultEstateTaxState();
    for (let i = 2; i <= 7; i++) {
      expect(isTabValid(i as TabIndex, emptyState)).toBe(true);
    }
  });
});

// ============================================================================
// Constants
// ============================================================================

describe('estate-tax > constants', () => {
  it('TAB_NAMES has 8 entries', () => {
    expect(TAB_NAMES).toHaveLength(8);
  });

  it('TAB_COUNT is 8', () => {
    expect(TAB_COUNT).toBe(8);
  });

  it('MARITAL_STATUSES has 5 values', () => {
    expect(MARITAL_STATUSES).toHaveLength(5);
    expect(MARITAL_STATUSES).toContain('single');
    expect(MARITAL_STATUSES).toContain('married');
    expect(MARITAL_STATUSES).toContain('widowed');
    expect(MARITAL_STATUSES).toContain('legally_separated');
    expect(MARITAL_STATUSES).toContain('annulled');
  });

  it('PROPERTY_REGIMES has ACP, CPG, CSP', () => {
    expect(PROPERTY_REGIMES).toEqual(['ACP', 'CPG', 'CSP']);
  });

  it('PROPERTY_CLASSIFICATIONS has 4 values', () => {
    expect(PROPERTY_CLASSIFICATIONS).toHaveLength(4);
  });

  it('PROPERTY_OWNERSHIPS has 3 values', () => {
    expect(PROPERTY_OWNERSHIPS).toEqual(['exclusive', 'conjugal', 'community']);
  });

  it('PERSONAL_PROPERTY_SUBTYPES has 8 values', () => {
    expect(PERSONAL_PROPERTY_SUBTYPES).toHaveLength(8);
    expect(PERSONAL_PROPERTY_SUBTYPES).toContain('cash');
    expect(PERSONAL_PROPERTY_SUBTYPES).toContain('bank_deposit');
    expect(PERSONAL_PROPERTY_SUBTYPES).toContain('shares');
    expect(PERSONAL_PROPERTY_SUBTYPES).toContain('vehicle');
    expect(PERSONAL_PROPERTY_SUBTYPES).toContain('jewelry');
  });

  it('TAXABLE_TRANSFER_TYPES has 5 values', () => {
    expect(TAXABLE_TRANSFER_TYPES).toHaveLength(5);
    expect(TAXABLE_TRANSFER_TYPES).toContain('CONTEMPLATION_OF_DEATH');
    expect(TAXABLE_TRANSFER_TYPES).toContain('LIFE_INSURANCE');
    expect(TAXABLE_TRANSFER_TYPES).toContain('INSUFFICIENT_CONSIDERATION');
  });
});
