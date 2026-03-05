/**
 * export-zip.ts — ZIP archive export for estate cases.
 *
 * Generates a ZIP containing report.pdf, input.json, output.json,
 * notes.txt (optional), and metadata.json.
 *
 * Spec: §4.16
 */
import type { EngineInput, EngineOutput, CaseNote } from '../types';

export interface ZipMetadata {
  export_format_version: '1.0';
  case_id: string;
  decedent_name: string | null;
  date_of_death: string | null;
  exported_at: string; // ISO datetime
  exported_by_user_id: string;
}

/**
 * Build the ZIP filename.
 * Pattern: estate-{decedent-name-slug}-{YYYY-MM-DD}.zip
 */
export function buildZipFilename(decedentName: string, date?: string): string {
  const slug = decedentName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const dateStr = date || new Date().toISOString().slice(0, 10);
  return `estate-${slug}-${dateStr}.zip`;
}

/**
 * Format case notes as plain text for inclusion in ZIP.
 */
export function formatNotesAsText(notes: CaseNote[]): string {
  return notes
    .map(
      (n) =>
        `[${n.created_at}]\n${n.content}\n`,
    )
    .join('\n');
}

/**
 * Export a case as a ZIP archive and trigger browser download.
 *
 * Requires an authenticated, saved case (caseId must be non-empty).
 * Generates report.pdf via §4.1, bundles input/output JSON, notes, and metadata.
 */
export async function exportCaseZip(
  caseId: string,
  input: EngineInput,
  output: EngineOutput,
  notes: CaseNote[],
): Promise<void> {
  if (!caseId) {
    throw new Error('Cannot export: case must be saved first (no caseId)');
  }

  const [JSZipModule, { generatePDF }, { supabase }] = await Promise.all([
    import('jszip'),
    import('./pdf-export'),
    import('./supabase'),
  ]);

  const JSZip = JSZipModule.default;
  const zip = JSZip();

  // Generate the PDF report
  const pdfBlob = await generatePDF(input, output, null);
  zip.file('report.pdf', pdfBlob);

  // Add input and output as pretty-printed JSON
  zip.file('input.json', JSON.stringify(input, null, 2));
  zip.file('output.json', JSON.stringify(output, null, 2));

  // Add notes.txt only when notes exist
  if (notes.length > 0) {
    zip.file('notes.txt', formatNotesAsText(notes));
  }

  // Get current user for metadata
  const { data: { user } } = await supabase.auth.getUser();

  // Build metadata
  const metadata: ZipMetadata = {
    export_format_version: '1.0',
    case_id: caseId,
    decedent_name: input.decedent?.name ?? null,
    date_of_death: input.decedent?.date_of_death ?? null,
    exported_at: new Date().toISOString(),
    exported_by_user_id: user?.id ?? 'anonymous',
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Trigger browser download
  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildZipFilename(
    input.decedent?.name ?? '',
    input.decedent?.date_of_death,
  );
  anchor.click();
  URL.revokeObjectURL(url);
}
