import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NoteEditorProps {
  onSave: (content: string) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function NoteEditor({ onSave, onCancel, saving }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const trimmed = content.trim();
  const isEmpty = trimmed.length === 0;

  return (
    <div data-testid="note-editor">
      <div className="flex gap-2 mb-2" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'write'}
          data-testid="tab-write"
          className={tab === 'write' ? 'font-semibold' : 'text-muted-foreground'}
          onClick={() => setTab('write')}
        >
          Write
        </button>
        <button
          role="tab"
          aria-selected={tab === 'preview'}
          data-testid="tab-preview"
          className={tab === 'preview' ? 'font-semibold' : 'text-muted-foreground'}
          onClick={() => setTab('preview')}
        >
          Preview
        </button>
      </div>

      {tab === 'write' ? (
        <Textarea
          data-testid="note-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a note... (supports markdown)"
          rows={4}
        />
      ) : (
        <div data-testid="note-preview" className="prose prose-sm min-h-[100px] p-2 border rounded">
          {isEmpty ? (
            <p className="text-muted-foreground">Nothing to preview</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {trimmed}
            </ReactMarkdown>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" onClick={onCancel} data-testid="note-cancel">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(trimmed)}
          disabled={isEmpty || saving}
          data-testid="note-save"
        >
          {saving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
    </div>
  );
}
