import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from '@/components/ui/button';
import { NoteEditor } from './NoteEditor';
import type { CaseNote } from '@/types';
import { addNote, deleteNote } from '@/lib/case-notes';

interface CaseNotesPanelProps {
  caseId: string;
  userId: string;
  notes: CaseNote[];
  onNotesChange: (notes: CaseNote[]) => void;
  isSharedView?: boolean;
}

export function CaseNotesPanel({
  caseId,
  userId,
  notes,
  onNotesChange,
  isSharedView = false,
}: CaseNotesPanelProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  if (isSharedView) {
    return null;
  }

  const handleSave = useCallback(
    async (content: string) => {
      setSaving(true);
      const optimisticNote: CaseNote = {
        id: `temp-${Date.now()}`,
        case_id: caseId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
      };

      // Optimistic add
      onNotesChange([optimisticNote, ...notes]);
      setShowEditor(false);

      try {
        const savedNote = await addNote(caseId, userId, content);
        // Replace optimistic with real
        onNotesChange([savedNote, ...notes]);
      } catch {
        // Rollback
        onNotesChange(notes);
      } finally {
        setSaving(false);
      }
    },
    [caseId, userId, notes, onNotesChange],
  );

  const handleDelete = useCallback(
    async (noteId: string) => {
      const previous = [...notes];
      // Optimistic removal
      onNotesChange(notes.filter((n) => n.id !== noteId));

      try {
        await deleteNote(noteId);
      } catch {
        // Rollback
        onNotesChange(previous);
      }
    },
    [notes, onNotesChange],
  );

  return (
    <div data-testid="case-notes-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Case Notes</h3>
        {!showEditor && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditor(true)}
            data-testid="add-note-button"
          >
            + Add Note
          </Button>
        )}
      </div>

      {showEditor && (
        <div className="mb-4">
          <NoteEditor
            onSave={handleSave}
            onCancel={() => setShowEditor(false)}
            saving={saving}
          />
        </div>
      )}

      <div data-testid="notes-list">
        {notes.map((note) => (
          <div
            key={note.id}
            data-testid={`note-${note.id}`}
            className="border-t py-3"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span data-testid={`note-timestamp-${note.id}`}>
                {formatNoteTimestamp(note.created_at)}
              </span>
              {note.user_id === userId && (
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-destructive hover:underline text-xs"
                  data-testid={`note-delete-${note.id}`}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="prose prose-sm" data-testid={`note-content-${note.id}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {note.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNoteTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
