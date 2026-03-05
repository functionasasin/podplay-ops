/**
 * Document Checklist functions (§4.22)
 * Source: docs/plans/inheritance-premium-spec.md §4.22
 */

import { supabase } from './supabase';
import { getApplicableDocuments } from '@/data/document-templates';
import type { CaseDocument, DocumentSeedingContext, DocumentProgress } from '@/types';

/**
 * Seed documents for a case based on the seeding context.
 * Inserts applicable document templates as case_documents rows.
 * Uses upsert on (case_id, document_key) to avoid duplicates on re-seed.
 */
export async function seedDocuments(
  caseId: string,
  userId: string,
  context: DocumentSeedingContext,
): Promise<void> {
  const templates = getApplicableDocuments(context);

  const rows = templates.map((tpl) => ({
    case_id: caseId,
    user_id: userId,
    document_key: tpl.document_key,
    label: tpl.label,
    category: tpl.category,
    description: tpl.description,
    required_when: tpl.required_when,
    is_obtained: false,
    is_not_applicable: false,
  }));

  const { error } = await supabase
    .from('case_documents')
    .upsert(rows, { onConflict: 'case_id,document_key' });

  if (error) throw error;
}

/**
 * Check off a document as obtained, with an obtained date and optional note.
 */
export async function checkOffDocument(
  documentId: string,
  obtainedDate: string,
  note?: string,
): Promise<void> {
  const update: Record<string, unknown> = {
    is_obtained: true,
    obtained_date: obtainedDate,
  };
  if (note !== undefined) {
    update.note = note;
  }

  const { error } = await supabase
    .from('case_documents')
    .update(update)
    .eq('id', documentId);

  if (error) throw error;
}

/**
 * Mark a document as not applicable.
 */
export async function markNotApplicable(documentId: string): Promise<void> {
  const { error } = await supabase
    .from('case_documents')
    .update({ is_not_applicable: true })
    .eq('id', documentId);

  if (error) throw error;
}

/**
 * List all documents for a case, ordered by category and label.
 */
export async function listDocuments(caseId: string): Promise<CaseDocument[]> {
  const { data, error } = await supabase
    .from('case_documents')
    .select('*')
    .eq('case_id', caseId)
    .order('category', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw error;
  return (data ?? []) as CaseDocument[];
}

/**
 * Compute progress: obtained / (total − not_applicable) × 100.
 * Pure function — no database access.
 */
export function computeProgress(documents: CaseDocument[]): DocumentProgress {
  const notApplicable = documents.filter((d) => d.is_not_applicable).length;
  const total = documents.length - notApplicable;
  const obtained = documents.filter((d) => d.is_obtained && !d.is_not_applicable).length;
  const percentage = total > 0 ? Math.round((obtained / total) * 100) : 0;

  return { obtained, total, percentage };
}
