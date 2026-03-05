/**
 * DeadlineTimeline — Per-case vertical timeline panel (§4.20)
 */

import { useState } from 'react';
import { DeadlineCard } from './DeadlineCard';
import type { CaseDeadline } from '@/types';

export interface DeadlineTimelineProps {
  deadlines: CaseDeadline[];
  onMarkDone: (deadlineId: string, completedDate: string, note?: string) => void;
  onAddCustom: (data: {
    label: string;
    due_date: string;
    description: string;
    legal_basis?: string;
  }) => void;
}

export function DeadlineTimeline({
  deadlines,
  onMarkDone,
  onAddCustom,
}: DeadlineTimelineProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLegalBasis, setNewLegalBasis] = useState('');

  const completedCount = deadlines.filter((d) => d.completed_date !== null).length;
  const totalCount = deadlines.length;

  const handleSubmitCustom = () => {
    if (!newLabel.trim() || !newDate.trim()) return;
    onAddCustom({
      label: newLabel.trim(),
      due_date: newDate,
      description: newDescription.trim(),
      legal_basis: newLegalBasis.trim() || undefined,
    });
    setNewLabel('');
    setNewDate('');
    setNewDescription('');
    setNewLegalBasis('');
    setShowAddForm(false);
  };

  return (
    <div data-testid="deadline-timeline">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Settlement Deadlines</h3>
        <span data-testid="deadline-progress" className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} milestones complete
        </span>
      </div>

      <div className="space-y-3">
        {deadlines.map((d) => (
          <DeadlineCard
            key={d.id}
            deadline={d}
            onMarkDone={(id) => onMarkDone(id, new Date().toISOString().slice(0, 10))}
          />
        ))}
      </div>

      {!showAddForm ? (
        <button
          data-testid="add-custom-deadline-btn"
          onClick={() => setShowAddForm(true)}
          className="mt-4 text-sm text-primary underline"
        >
          Add Custom Deadline
        </button>
      ) : (
        <div data-testid="custom-deadline-form" className="mt-4 space-y-2 border p-4 rounded">
          <input
            data-testid="custom-deadline-label"
            placeholder="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <input
            data-testid="custom-deadline-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <input
            data-testid="custom-deadline-description"
            placeholder="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <input
            data-testid="custom-deadline-legal-basis"
            placeholder="Legal basis (optional)"
            value={newLegalBasis}
            onChange={(e) => setNewLegalBasis(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <div className="flex gap-2">
            <button
              data-testid="custom-deadline-submit"
              onClick={handleSubmitCustom}
              className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded"
            >
              Save
            </button>
            <button
              data-testid="custom-deadline-cancel"
              onClick={() => setShowAddForm(false)}
              className="text-sm px-3 py-1 border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
