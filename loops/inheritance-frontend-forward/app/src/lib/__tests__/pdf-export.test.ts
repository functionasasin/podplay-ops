/**
 * PDF Export Utility Tests — Stage 11
 *
 * Tests for slugifyName, buildPDFFilename, and generatePDF.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EngineInput, EngineOutput, Money } from '../../types';
import type { FirmProfile } from '../firm-profile';
import { defaultFirmProfile } from '../firm-profile';
import {
  slugifyName,
  buildPDFFilename,
  DEFAULT_PDF_OPTIONS,
  type PDFExportOptions,
} from '../pdf-export';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function money(pesos: number): Money {
  return { centavos: pesos * 100 };
}

function zeroMoney(): Money {
  return { centavos: 0 };
}

function createMinimalInput(): EngineInput {
  return {
    net_distributable_estate: money(1000000),
    decedent: {
      id: 'decedent-1',
      name: 'Juan dela Cruz',
      date_of_death: '2024-03-15',
      is_married: true,
      date_of_marriage: '1990-06-01',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 34,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [
      {
        id: 'person-1',
        name: 'Maria Santos',
        is_alive_at_succession: true,
        relationship_to_decedent: 'LegitimateChild' as const,
        degree: 1,
        line: null,
        children: [],
        filiation_proved: true,
        filiation_proof_type: 'BirthCertificate' as const,
        is_guilty_party_in_legal_separation: false,
        adoption: null,
        is_unworthy: false,
        unworthiness_condoned: false,
        has_renounced: false,
        blood_type: null,
      },
    ],
    will: null,
    donations: [],
    config: {
      retroactive_ra_11642: false,
      max_pipeline_restarts: 3,
    },
  };
}

function createMinimalOutput(): EngineOutput {
  return {
    per_heir_shares: [
      {
        heir_id: 'heir-1',
        heir_name: 'Maria Santos',
        heir_category: 'LegitimateChildGroup' as const,
        inherits_by: 'OwnRight' as const,
        represents: null,
        from_legitime: money(500000),
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: money(500000),
        legitime_fraction: '1/2',
        legal_basis: ['Art.887'],
        donations_imputed: zeroMoney(),
        gross_entitlement: money(500000),
        net_from_estate: money(500000),
      },
    ],
    narratives: [
      {
        heir_id: 'heir-1',
        heir_name: 'Maria Santos',
        heir_category_label: 'Legitimate Child',
        text: 'Maria Santos inherits her share.',
      },
    ],
    computation_log: {
      steps: [
        { step_number: 1, step_name: 'Classify', description: 'Intestate succession' },
      ],
      total_restarts: 0,
      final_scenario: 'I1',
    },
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I1',
  };
}

// ===========================================================================
// slugifyName
// ===========================================================================

describe('pdf-export', () => {
  describe('slugifyName', () => {
    it('converts simple name to lowercase hyphenated slug', () => {
      expect(slugifyName('Juan dela Cruz')).toBe('juan-dela-cruz');
    });

    it('removes special characters', () => {
      expect(slugifyName("María O'Brien-López")).toBe('mara-obrien-lpez');
    });

    it('collapses multiple spaces to single hyphen', () => {
      expect(slugifyName('Juan    dela   Cruz')).toBe('juan-dela-cruz');
    });

    it('removes leading and trailing hyphens', () => {
      expect(slugifyName(' Juan ')).toBe('juan');
    });

    it('handles single word name', () => {
      expect(slugifyName('Madonna')).toBe('madonna');
    });

    it('handles empty string', () => {
      expect(slugifyName('')).toBe('');
    });

    it('handles name with numbers', () => {
      expect(slugifyName('John Smith III')).toBe('john-smith-iii');
    });

    it('handles name with all special characters', () => {
      expect(slugifyName('***')).toBe('');
    });

    it('collapses consecutive hyphens into one', () => {
      expect(slugifyName('A--B')).toBe('a-b');
    });
  });

  // ===========================================================================
  // buildPDFFilename
  // ===========================================================================

  describe('buildPDFFilename', () => {
    it('builds filename with pattern estate-{slug}-{date}.pdf', () => {
      const result = buildPDFFilename('Juan dela Cruz', '2024-03-15');
      expect(result).toBe('estate-juan-dela-cruz-2024-03-15.pdf');
    });

    it('uses provided date string', () => {
      const result = buildPDFFilename('Test Name', '2026-01-01');
      expect(result).toBe('estate-test-name-2026-01-01.pdf');
    });

    it('uses current date when date is not provided', () => {
      const result = buildPDFFilename('Juan dela Cruz');
      // Should match pattern: estate-juan-dela-cruz-YYYY-MM-DD.pdf
      expect(result).toMatch(/^estate-juan-dela-cruz-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('handles names with special characters', () => {
      const result = buildPDFFilename("María O'Brien", '2024-06-01');
      expect(result).toBe("estate-mara-obrien-2024-06-01.pdf");
    });

    it('handles empty name', () => {
      const result = buildPDFFilename('', '2024-03-15');
      expect(result).toBe('estate--2024-03-15.pdf');
    });
  });

  // ===========================================================================
  // DEFAULT_PDF_OPTIONS
  // ===========================================================================

  describe('DEFAULT_PDF_OPTIONS', () => {
    it('has all fields defaulted to true', () => {
      expect(DEFAULT_PDF_OPTIONS.includeFirmHeader).toBe(true);
      expect(DEFAULT_PDF_OPTIONS.includeFamilyTree).toBe(true);
      expect(DEFAULT_PDF_OPTIONS.includeDeadlines).toBe(true);
      expect(DEFAULT_PDF_OPTIONS.includeChecklist).toBe(true);
    });
  });

  // ===========================================================================
  // generatePDF (integration — lazy-loads @react-pdf/renderer)
  // ===========================================================================

  describe('generatePDF', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('is an async function exported from pdf-export', async () => {
      // Re-import to get the real module shape
      const mod = await import('../pdf-export');
      expect(typeof mod.generatePDF).toBe('function');
    });

    it('downloadPDF is an async function exported from pdf-export', async () => {
      const mod = await import('../pdf-export');
      expect(typeof mod.downloadPDF).toBe('function');
    });
  });
});
