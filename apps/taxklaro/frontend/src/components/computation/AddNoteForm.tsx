import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface AddNoteFormProps {
  onAdd: (content: string) => Promise<void>;
}

export function AddNoteForm({ onAdd }: AddNoteFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    await onAdd(content.trim());
    setContent('');
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note..."
        rows={2}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
        <Send className="h-4 w-4 mr-1" />Add Note
      </Button>
    </form>
  );
}

export default AddNoteForm;
