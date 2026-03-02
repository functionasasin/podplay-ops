/**
 * pdf-export.ts — PDF generation utilities for estate distribution reports.
 *
 * Lazy-loads @react-pdf/renderer to avoid bundling in non-PDF paths.
 *
 * Spec: §4.1
 */
import type { EngineInput, EngineOutput } from '../types';
import type { FirmProfile } from './firm-profile';

export interface PDFExportOptions {
  includeFirmHeader: boolean;
  includeFamilyTree: boolean;
  includeDeadlines: boolean;
  includeChecklist: boolean;
}

export const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  includeFirmHeader: true,
  includeFamilyTree: true,
  includeDeadlines: true,
  includeChecklist: true,
};

/**
 * Slugify decedent name for filename.
 * "Juan dela Cruz" → "juan-dela-cruz"
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build the PDF filename.
 * Pattern: estate-{decedent-name-slug}-{YYYY-MM-DD}.pdf
 */
export function buildPDFFilename(decedentName: string, date?: string): string {
  const slug = slugifyName(decedentName);
  const dateStr = date || new Date().toISOString().slice(0, 10);
  return `estate-${slug}-${dateStr}.pdf`;
}

/**
 * Generate a PDF blob from engine input/output + firm profile.
 * Lazy-loads @react-pdf/renderer for code splitting.
 */
export async function generatePDF(
  input: EngineInput,
  output: EngineOutput,
  profile: FirmProfile | null,
  options: PDFExportOptions = DEFAULT_PDF_OPTIONS,
): Promise<Blob> {
  const [{ pdf }, { EstatePDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/pdf/EstatePDF'),
  ]);

  const doc = EstatePDF({ input, output, profile, options });
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Generate and trigger browser download of the PDF.
 */
export async function downloadPDF(
  input: EngineInput,
  output: EngineOutput,
  profile: FirmProfile | null,
  options: PDFExportOptions = DEFAULT_PDF_OPTIONS,
): Promise<void> {
  const blob = await generatePDF(input, output, profile, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildPDFFilename(input.decedent.name);
  a.click();
  URL.revokeObjectURL(url);
}
