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
  _caseId: string,
  _input: EngineInput,
  _output: EngineOutput,
  _notes: CaseNote[],
): Promise<void> {
  // Stub — implementation in next iteration
  throw new Error('Not implemented');
}
