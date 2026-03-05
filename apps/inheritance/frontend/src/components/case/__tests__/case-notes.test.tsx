import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CaseNote } from '@/types';

// Mock supabase before importing components
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock case-notes lib
const mockAddNote = vi.fn();
const mockDeleteNote = vi.fn();
vi.mock('@/lib/case-notes', () => ({
  addNote: (...args: unknown[]) => mockAddNote(...args),
  deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
  listNotes: vi.fn(),
}));

import { CaseNotesPanel } from '../CaseNotesPanel';
import { NoteEditor } from '../NoteEditor';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function createNote(overrides: Partial<CaseNote> = {}): CaseNote {
  return {
    id: 'note-1',
    case_id: 'case-123',
    user_id: 'user-1',
    content: 'Filed BIR Form 1904 at RDO 40.',
    created_at: '2026-03-01T14:15:00Z',
    ...overrides,
  };
}

const defaultProps = {
  caseId: 'case-123',
  userId: 'user-1',
  notes: [] as CaseNote[],
  onNotesChange: vi.fn(),
  isSharedView: false,
};

// --------------------------------------------------------------------------
// Tests — CaseNotesPanel
// --------------------------------------------------------------------------

describe('case-notes > CaseNotesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the case notes panel', () => {
      render(<CaseNotesPanel {...defaultProps} />);
      expect(screen.getByTestId('case-notes-panel')).toBeInTheDocument();
    });

    it('renders "Case Notes" heading', () => {
      render(<CaseNotesPanel {...defaultProps} />);
      expect(screen.getByText('Case Notes')).toBeInTheDocument();
    });

    it('renders "+ Add Note" button', () => {
      render(<CaseNotesPanel {...defaultProps} />);
      expect(screen.getByTestId('add-note-button')).toBeInTheDocument();
    });

    it('renders notes in the list', () => {
      const notes = [
        createNote({ id: 'note-1', content: 'First note' }),
        createNote({ id: 'note-2', content: 'Second note' }),
      ];
      render(<CaseNotesPanel {...defaultProps} notes={notes} />);
      expect(screen.getByTestId('note-note-1')).toBeInTheDocument();
      expect(screen.getByTestId('note-note-2')).toBeInTheDocument();
    });
  });

  describe('adding a note', () => {
    it('shows editor when "+ Add Note" is clicked', async () => {
      const user = userEvent.setup();
      render(<CaseNotesPanel {...defaultProps} />);

      await user.click(screen.getByTestId('add-note-button'));
      expect(screen.getByTestId('note-editor')).toBeInTheDocument();
    });

    it('adding a note renders it in the list (optimistic)', async () => {
      const user = userEvent.setup();
      const onNotesChange = vi.fn();
      mockAddNote.mockResolvedValue(
        createNote({ id: 'note-new', content: 'New note content' }),
      );

      render(
        <CaseNotesPanel {...defaultProps} onNotesChange={onNotesChange} />,
      );

      // Open editor
      await user.click(screen.getByTestId('add-note-button'));

      // Type and save
      const textarea = screen.getByTestId('note-textarea');
      await user.type(textarea, 'New note content');
      await user.click(screen.getByTestId('note-save'));

      // Should have called onNotesChange with the optimistic note
      expect(onNotesChange).toHaveBeenCalled();
      const firstCall = onNotesChange.mock.calls[0][0];
      expect(firstCall[0].content).toBe('New note content');
    });
  });

  describe('deleting a note', () => {
    it('delete removes note optimistically', async () => {
      const user = userEvent.setup();
      const onNotesChange = vi.fn();
      mockDeleteNote.mockResolvedValue(undefined);

      const notes = [
        createNote({ id: 'note-1', content: 'Will be deleted', user_id: 'user-1' }),
        createNote({ id: 'note-2', content: 'Will remain', user_id: 'user-1' }),
      ];

      render(
        <CaseNotesPanel
          {...defaultProps}
          notes={notes}
          onNotesChange={onNotesChange}
        />,
      );

      // Click delete on note-1
      await user.click(screen.getByTestId('note-delete-note-1'));

      // Should have been called with the note removed
      expect(onNotesChange).toHaveBeenCalled();
      const updatedNotes = onNotesChange.mock.calls[0][0];
      expect(updatedNotes).toHaveLength(1);
      expect(updatedNotes[0].id).toBe('note-2');
    });

    it('only shows delete button for notes by current user', () => {
      const notes = [
        createNote({ id: 'note-mine', user_id: 'user-1' }),
        createNote({ id: 'note-other', user_id: 'user-other' }),
      ];
      render(<CaseNotesPanel {...defaultProps} notes={notes} userId="user-1" />);

      expect(screen.getByTestId('note-delete-note-mine')).toBeInTheDocument();
      expect(screen.queryByTestId('note-delete-note-other')).not.toBeInTheDocument();
    });
  });

  describe('shared view', () => {
    it('notes hidden when in shared view mode', () => {
      const notes = [createNote()];
      render(
        <CaseNotesPanel {...defaultProps} notes={notes} isSharedView={true} />,
      );
      expect(screen.queryByTestId('case-notes-panel')).not.toBeInTheDocument();
    });
  });

  describe('markdown rendering', () => {
    it('renders markdown bold as strong', () => {
      const notes = [createNote({ id: 'note-md', content: '**bold text**' })];
      render(<CaseNotesPanel {...defaultProps} notes={notes} />);

      const noteContent = screen.getByTestId('note-content-note-md');
      const strong = noteContent.querySelector('strong');
      expect(strong).not.toBeNull();
      expect(strong?.textContent).toBe('bold text');
    });

    it('sanitizes script tags', () => {
      const notes = [
        createNote({
          id: 'note-xss',
          content: 'safe text\n\n<script>alert("xss")</script>\n\nmore safe text',
        }),
      ];
      render(<CaseNotesPanel {...defaultProps} notes={notes} />);

      const noteContent = screen.getByTestId('note-content-note-xss');
      expect(noteContent.querySelector('script')).toBeNull();
      expect(noteContent.textContent).toContain('safe text');
      expect(noteContent.textContent).toContain('more safe text');
    });

    it('renders markdown italic', () => {
      const notes = [createNote({ id: 'note-italic', content: '*italic text*' })];
      render(<CaseNotesPanel {...defaultProps} notes={notes} />);

      const noteContent = screen.getByTestId('note-content-note-italic');
      const em = noteContent.querySelector('em');
      expect(em).not.toBeNull();
      expect(em?.textContent).toBe('italic text');
    });

    it('renders markdown lists', () => {
      const notes = [
        createNote({ id: 'note-list', content: '- item 1\n- item 2\n- item 3' }),
      ];
      render(<CaseNotesPanel {...defaultProps} notes={notes} />);

      const noteContent = screen.getByTestId('note-content-note-list');
      const listItems = noteContent.querySelectorAll('li');
      expect(listItems.length).toBe(3);
    });
  });

  describe('timestamps', () => {
    it('renders note timestamp', () => {
      const notes = [createNote({ id: 'note-ts', created_at: '2026-03-01T14:15:00Z' })];
      render(<CaseNotesPanel {...defaultProps} notes={notes} />);

      const timestamp = screen.getByTestId('note-timestamp-note-ts');
      expect(timestamp.textContent).toBeTruthy();
      // Should contain a date-like format
      expect(timestamp.textContent).toMatch(/Mar|2026/);
    });
  });
});

// --------------------------------------------------------------------------
// Tests — NoteEditor
// --------------------------------------------------------------------------

describe('case-notes > NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders write and preview tabs', () => {
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('tab-write')).toBeInTheDocument();
    expect(screen.getByTestId('tab-preview')).toBeInTheDocument();
  });

  it('renders textarea in write tab by default', () => {
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('note-textarea')).toBeInTheDocument();
  });

  it('switches to preview tab showing rendered markdown', async () => {
    const user = userEvent.setup();
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} />);

    // Type some markdown
    await user.type(screen.getByTestId('note-textarea'), '**bold**');

    // Switch to preview
    await user.click(screen.getByTestId('tab-preview'));

    const preview = screen.getByTestId('note-preview');
    expect(preview.querySelector('strong')?.textContent).toBe('bold');
  });

  it('save button is disabled when content is empty', () => {
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('note-save')).toBeDisabled();
  });

  it('save button is enabled when content is present', async () => {
    const user = userEvent.setup();
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByTestId('note-textarea'), 'Some note');
    expect(screen.getByTestId('note-save')).toBeEnabled();
  });

  it('calls onSave with trimmed content', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<NoteEditor onSave={onSave} onCancel={vi.fn()} />);

    await user.type(screen.getByTestId('note-textarea'), '  Hello  ');
    await user.click(screen.getByTestId('note-save'));

    expect(onSave).toHaveBeenCalledWith('Hello');
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<NoteEditor onSave={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByTestId('note-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows "Saving..." when saving prop is true', () => {
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} saving={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows "Nothing to preview" for empty content in preview tab', async () => {
    const user = userEvent.setup();
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByTestId('tab-preview'));
    expect(screen.getByText('Nothing to preview')).toBeInTheDocument();
  });

  it('sanitizes script tags in preview', async () => {
    const user = userEvent.setup();
    render(<NoteEditor onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.type(
      screen.getByTestId('note-textarea'),
      '<script>alert("xss")</script>safe',
    );
    await user.click(screen.getByTestId('tab-preview'));

    const preview = screen.getByTestId('note-preview');
    expect(preview.querySelector('script')).toBeNull();
  });
});
