/**
 * Case Export ZIP Tests — Stage 14
 *
 * Tests for buildZipFilename, formatNotesAsText, exportCaseZip.
 * Spec: §4.16
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EngineInput, EngineOutput, Money, CaseNote } from '../../types';
import {
  buildZipFilename,
  formatNotesAsText,
  exportCaseZip,
  type ZipMetadata,
} from '../export-zip';

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

function createNote(overrides: Partial<CaseNote> = {}): CaseNote {
  return {
    id: 'note-1',
    case_id: 'case-1',
    user_id: 'user-1',
    content: 'This is a test note.',
    created_at: '2024-03-15T10:30:00Z',
    ...overrides,
  };
}

// ===========================================================================
// buildZipFilename
// ===========================================================================

describe('export-zip', () => {
  describe('buildZipFilename', () => {
    it('builds filename with pattern estate-{slug}-{date}.zip', () => {
      const result = buildZipFilename('Juan dela Cruz', '2024-03-15');
      expect(result).toBe('estate-juan-dela-cruz-2024-03-15.zip');
    });

    it('uses provided date string', () => {
      const result = buildZipFilename('Test Name', '2026-01-01');
      expect(result).toBe('estate-test-name-2026-01-01.zip');
    });

    it('uses current date when date is not provided', () => {
      const result = buildZipFilename('Juan dela Cruz');
      expect(result).toMatch(/^estate-juan-dela-cruz-\d{4}-\d{2}-\d{2}\.zip$/);
    });

    it('handles names with special characters', () => {
      const result = buildZipFilename("María O'Brien", '2024-06-01');
      expect(result).toBe('estate-mara-obrien-2024-06-01.zip');
    });

    it('handles empty name', () => {
      const result = buildZipFilename('', '2024-03-15');
      expect(result).toBe('estate--2024-03-15.zip');
    });

    it('collapses multiple spaces to single hyphen', () => {
      const result = buildZipFilename('Juan   dela   Cruz', '2024-03-15');
      expect(result).toBe('estate-juan-dela-cruz-2024-03-15.zip');
    });
  });

  // ===========================================================================
  // formatNotesAsText
  // ===========================================================================

  describe('formatNotesAsText', () => {
    it('formats single note with timestamp and content', () => {
      const notes = [createNote()];
      const text = formatNotesAsText(notes);
      expect(text).toContain('[2024-03-15T10:30:00Z]');
      expect(text).toContain('This is a test note.');
    });

    it('formats multiple notes separated by newlines', () => {
      const notes = [
        createNote({ id: 'note-1', content: 'First note', created_at: '2024-03-15T10:00:00Z' }),
        createNote({ id: 'note-2', content: 'Second note', created_at: '2024-03-15T11:00:00Z' }),
      ];
      const text = formatNotesAsText(notes);
      expect(text).toContain('First note');
      expect(text).toContain('Second note');
      expect(text).toContain('[2024-03-15T10:00:00Z]');
      expect(text).toContain('[2024-03-15T11:00:00Z]');
    });

    it('returns empty string for empty notes array', () => {
      const text = formatNotesAsText([]);
      expect(text).toBe('');
    });
  });

  // ===========================================================================
  // ZipMetadata interface
  // ===========================================================================

  describe('ZipMetadata', () => {
    it('has correct shape with all required fields', () => {
      const metadata: ZipMetadata = {
        export_format_version: '1.0',
        case_id: 'case-123',
        decedent_name: 'Juan dela Cruz',
        date_of_death: '2024-03-15',
        exported_at: '2024-03-15T10:30:00Z',
        exported_by_user_id: 'user-1',
      };
      expect(metadata.export_format_version).toBe('1.0');
      expect(metadata.case_id).toBe('case-123');
      expect(metadata.decedent_name).toBe('Juan dela Cruz');
      expect(metadata.date_of_death).toBe('2024-03-15');
      expect(metadata.exported_at).toBe('2024-03-15T10:30:00Z');
      expect(metadata.exported_by_user_id).toBe('user-1');
    });

    it('allows null for decedent_name and date_of_death', () => {
      const metadata: ZipMetadata = {
        export_format_version: '1.0',
        case_id: 'case-123',
        decedent_name: null,
        date_of_death: null,
        exported_at: '2024-03-15T10:30:00Z',
        exported_by_user_id: 'user-1',
      };
      expect(metadata.decedent_name).toBeNull();
      expect(metadata.date_of_death).toBeNull();
    });
  });

  // ===========================================================================
  // exportCaseZip
  // ===========================================================================

  describe('exportCaseZip', () => {
    let mockJSZip: {
      file: ReturnType<typeof vi.fn>;
      generateAsync: ReturnType<typeof vi.fn>;
    };
    let mockPDFBlob: Blob;

    beforeEach(() => {
      vi.resetModules();

      mockPDFBlob = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });

      mockJSZip = {
        file: vi.fn().mockReturnThis(),
        generateAsync: vi.fn().mockResolvedValue(
          new Blob(['fake zip content'], { type: 'application/zip' }),
        ),
      };

      // Mock JSZip constructor
      vi.doMock('jszip', () => ({
        default: vi.fn().mockImplementation(() => mockJSZip),
      }));

      // Mock generatePDF
      vi.doMock('../pdf-export', () => ({
        generatePDF: vi.fn().mockResolvedValue(mockPDFBlob),
      }));

      // Mock supabase auth
      vi.doMock('../supabase', () => ({
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-123' } },
              error: null,
            }),
          },
        },
      }));

      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects when caseId is empty', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      await expect(
        exportFn('', createMinimalInput(), createMinimalOutput(), []),
      ).rejects.toThrow();
    });

    it('is an async function exported from export-zip', async () => {
      const mod = await import('../export-zip');
      expect(typeof mod.exportCaseZip).toBe('function');
    });

    it('calls JSZip with report.pdf file', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');

      // Create a mock anchor element
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      await exportFn('case-123', createMinimalInput(), createMinimalOutput(), []);

      expect(mockJSZip.file).toHaveBeenCalledWith('report.pdf', mockPDFBlob);
    });

    it('includes input.json as pretty-printed valid JSON', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      const input = createMinimalInput();
      await exportFn('case-123', input, createMinimalOutput(), []);

      // Find the call that added input.json
      const inputCall = mockJSZip.file.mock.calls.find(
        (call: unknown[]) => call[0] === 'input.json',
      );
      expect(inputCall).toBeDefined();
      const inputJson = inputCall![1] as string;
      // Should be pretty-printed (contains newlines)
      expect(inputJson).toContain('\n');
      // Should be valid JSON
      const parsed = JSON.parse(inputJson);
      expect(parsed).toEqual(input);
    });

    it('includes output.json as pretty-printed valid JSON', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      const output = createMinimalOutput();
      await exportFn('case-123', createMinimalInput(), output, []);

      const outputCall = mockJSZip.file.mock.calls.find(
        (call: unknown[]) => call[0] === 'output.json',
      );
      expect(outputCall).toBeDefined();
      const outputJson = outputCall![1] as string;
      expect(outputJson).toContain('\n');
      const parsed = JSON.parse(outputJson);
      expect(parsed).toEqual(output);
    });

    it('includes metadata.json with export_format_version "1.0"', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      await exportFn('case-123', createMinimalInput(), createMinimalOutput(), []);

      const metaCall = mockJSZip.file.mock.calls.find(
        (call: unknown[]) => call[0] === 'metadata.json',
      );
      expect(metaCall).toBeDefined();
      const metadata: ZipMetadata = JSON.parse(metaCall![1] as string);
      expect(metadata.export_format_version).toBe('1.0');
      expect(metadata.case_id).toBe('case-123');
      expect(metadata.decedent_name).toBe('Juan dela Cruz');
      expect(metadata.date_of_death).toBe('2024-03-15');
      expect(metadata.exported_by_user_id).toBe('user-123');
      expect(metadata.exported_at).toBeTruthy();
    });

    it('includes notes.txt when notes are provided', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      const notes = [createNote()];
      await exportFn('case-123', createMinimalInput(), createMinimalOutput(), notes);

      const notesCall = mockJSZip.file.mock.calls.find(
        (call: unknown[]) => call[0] === 'notes.txt',
      );
      expect(notesCall).toBeDefined();
      expect(notesCall![1]).toContain('This is a test note.');
    });

    it('does NOT include notes.txt when notes array is empty', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      await exportFn('case-123', createMinimalInput(), createMinimalOutput(), []);

      const notesCall = mockJSZip.file.mock.calls.find(
        (call: unknown[]) => call[0] === 'notes.txt',
      );
      expect(notesCall).toBeUndefined();
    });

    it('triggers browser download with correct filename', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      await exportFn('case-123', createMinimalInput(), createMinimalOutput(), []);

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toMatch(/^estate-juan-dela-cruz-\d{4}-\d{2}-\d{2}\.zip$/);
    });

    it('generates ZIP as blob type', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      await exportFn('case-123', createMinimalInput(), createMinimalOutput(), []);

      expect(mockJSZip.generateAsync).toHaveBeenCalledWith({ type: 'blob' });
    });

    it('revokes object URL after download', async () => {
      const { exportCaseZip: exportFn } = await import('../export-zip');
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);

      await exportFn('case-123', createMinimalInput(), createMinimalOutput(), []);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-url');
    });
  });
});
