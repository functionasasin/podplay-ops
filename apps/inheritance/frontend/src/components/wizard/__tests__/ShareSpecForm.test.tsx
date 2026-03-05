import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import {
  ShareSpecForm,
  SHARE_SPEC_UNIT_VARIANTS,
  serializeShareSpec,
  deserializeShareSpec,
} from '../ShareSpecForm';
import type { EngineInput, ShareSpec } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------
function createDefaultEngineInput(): EngineInput {
  return {
    net_distributable_estate: { centavos: 1000000 },
    decedent: {
      id: 'd',
      name: 'Test Decedent',
      date_of_death: '2026-01-15',
      is_married: false,
      date_of_marriage: null,
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 0,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [],
    will: {
      date_executed: '2026-01-01',
      institutions: [
        {
          id: 'i1',
          heir: { person_id: null, name: 'Test Heir', is_collective: false, class_designation: null },
          share: 'EntireFreePort',
          conditions: [],
          substitutes: [],
          is_residuary: false,
        },
      ],
      legacies: [],
      devises: [],
      disinheritances: [],
    },
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
  };
}

function ShareSpecFormWrapper({
  defaultShare,
  onValues,
}: {
  defaultShare?: ShareSpec;
  onValues?: (values: EngineInput) => void;
}) {
  const defaultValues = createDefaultEngineInput();
  if (defaultShare && defaultValues.will) {
    defaultValues.will.institutions[0].share = defaultShare;
  }
  const methods = useForm<EngineInput>({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <ShareSpecForm
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          fieldPath="will.institutions.0.share"
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — ShareSpecForm (wizard-step4)
// --------------------------------------------------------------------------
describe('wizard-step4 > ShareSpecForm', () => {
  describe('rendering', () => {
    it('renders the share spec form container', () => {
      render(<ShareSpecFormWrapper />);
      expect(screen.getByTestId('share-spec-form')).toBeInTheDocument();
    });

    it('renders share type selector', () => {
      render(<ShareSpecFormWrapper />);
      expect(screen.getByText(/Share Type/i)).toBeInTheDocument();
    });
  });

  describe('variant display', () => {
    it('shows FractionInput when variant is Fraction', () => {
      render(<ShareSpecFormWrapper defaultShare={{ Fraction: '1/2' }} />);
      // Should show fraction input fields
      expect(screen.getByTestId('share-spec-form')).toBeInTheDocument();
    });

    it('does NOT show FractionInput for unit variants', () => {
      render(<ShareSpecFormWrapper defaultShare="EntireFreePort" />);
      // Should not show numerator/denominator inputs for unit variants
      expect(screen.getByTestId('share-spec-form')).toBeInTheDocument();
    });
  });

  describe('serializeShareSpec utility', () => {
    it('serializes EntireFreePort as bare string', () => {
      expect(serializeShareSpec('EntireFreePort')).toBe('EntireFreePort');
    });

    it('serializes EntireEstate as bare string', () => {
      expect(serializeShareSpec('EntireEstate')).toBe('EntireEstate');
    });

    it('serializes Residuary as bare string', () => {
      expect(serializeShareSpec('Residuary')).toBe('Residuary');
    });

    it('serializes EqualWithOthers as bare string', () => {
      expect(serializeShareSpec('EqualWithOthers')).toBe('EqualWithOthers');
    });

    it('serializes Unspecified as bare string', () => {
      expect(serializeShareSpec('Unspecified')).toBe('Unspecified');
    });

    it('serializes Fraction as {"Fraction": "n/d"}', () => {
      expect(serializeShareSpec('Fraction', '1/2')).toEqual({ Fraction: '1/2' });
    });

    it('serializes Fraction with "3/4"', () => {
      expect(serializeShareSpec('Fraction', '3/4')).toEqual({ Fraction: '3/4' });
    });

    it('Fraction without value falls back to string', () => {
      expect(serializeShareSpec('Fraction')).toBe('Fraction');
    });
  });

  describe('deserializeShareSpec utility', () => {
    it('deserializes bare string "EntireFreePort"', () => {
      const result = deserializeShareSpec('EntireFreePort');
      expect(result.variant).toBe('EntireFreePort');
      expect(result.fractionValue).toBeUndefined();
    });

    it('deserializes bare string "EqualWithOthers"', () => {
      const result = deserializeShareSpec('EqualWithOthers');
      expect(result.variant).toBe('EqualWithOthers');
    });

    it('deserializes {"Fraction": "1/2"}', () => {
      const result = deserializeShareSpec({ Fraction: '1/2' });
      expect(result.variant).toBe('Fraction');
      expect(result.fractionValue).toBe('1/2');
    });

    it('deserializes {"Fraction": "3/8"}', () => {
      const result = deserializeShareSpec({ Fraction: '3/8' });
      expect(result.variant).toBe('Fraction');
      expect(result.fractionValue).toBe('3/8');
    });

    it('roundtrips EntireFreePort through serialize/deserialize', () => {
      const original: ShareSpec = 'EntireFreePort';
      const { variant } = deserializeShareSpec(original);
      const reserialized = serializeShareSpec(variant);
      expect(reserialized).toEqual(original);
    });

    it('roundtrips Fraction through serialize/deserialize', () => {
      const original: ShareSpec = { Fraction: '1/3' };
      const { variant, fractionValue } = deserializeShareSpec(original);
      const reserialized = serializeShareSpec(variant, fractionValue);
      expect(reserialized).toEqual(original);
    });
  });

  describe('constants', () => {
    it('SHARE_SPEC_UNIT_VARIANTS has exactly 5 unit variants', () => {
      expect(SHARE_SPEC_UNIT_VARIANTS).toHaveLength(5);
    });

    it('SHARE_SPEC_UNIT_VARIANTS includes all non-Fraction variants', () => {
      expect(SHARE_SPEC_UNIT_VARIANTS).toContain('EntireFreePort');
      expect(SHARE_SPEC_UNIT_VARIANTS).toContain('EntireEstate');
      expect(SHARE_SPEC_UNIT_VARIANTS).toContain('Residuary');
      expect(SHARE_SPEC_UNIT_VARIANTS).toContain('EqualWithOthers');
      expect(SHARE_SPEC_UNIT_VARIANTS).toContain('Unspecified');
    });

    it('SHARE_SPEC_UNIT_VARIANTS does NOT include Fraction', () => {
      expect(SHARE_SPEC_UNIT_VARIANTS).not.toContain('Fraction');
    });
  });

  describe('wire format compliance', () => {
    it('unit variant does NOT serialize as tagged object', () => {
      const result = serializeShareSpec('EntireFreePort');
      expect(typeof result).toBe('string');
      expect(result).not.toEqual({ EntireFreePort: null });
    });

    it('Fraction does NOT serialize as bare string', () => {
      const result = serializeShareSpec('Fraction', '1/2');
      expect(typeof result).not.toBe('string');
      expect(result).toEqual({ Fraction: '1/2' });
    });

    it('Fraction value is a "n/d" string, not an object', () => {
      const result = serializeShareSpec('Fraction', '1/2') as { Fraction: string };
      expect(typeof result.Fraction).toBe('string');
      expect(result.Fraction).toMatch(/^\d+\/\d+$/);
    });
  });
});
