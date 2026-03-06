interface Note {
  id: string;
  content: string;
  createdAt: string;
  authorName?: string;
}

interface NotesListProps {
  notes: Note[];
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">No notes yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="border rounded-lg p-3 text-sm space-y-1">
          <p>{note.content}</p>
          <p className="text-xs text-muted-foreground">
            {note.authorName && `${note.authorName} · `}
            {new Date(note.createdAt).toLocaleDateString('en-PH')}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default NotesList;
