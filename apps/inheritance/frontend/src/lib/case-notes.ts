import { supabase } from './supabase';
import type { CaseNote } from '@/types';

export async function addNote(
  caseId: string,
  userId: string,
  content: string,
): Promise<CaseNote> {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error('Note content cannot be empty');
  }

  const { data, error } = await supabase
    .from('case_notes')
    .insert({ case_id: caseId, user_id: userId, content: trimmed })
    .select('*')
    .single();

  if (error) throw error;
  return data as CaseNote;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('case_notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

export async function listNotes(caseId: string): Promise<CaseNote[]> {
  const { data, error } = await supabase
    .from('case_notes')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CaseNote[];
}
