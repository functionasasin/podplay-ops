import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface GoLiveProps {
  projectId: string;
}

interface ProjectData {
  project_name: string;
  venue_name: string;
  project_status: string;
  go_live_date: string | null;
  notes: string | null;
  completed_at: string | null;
}

interface InvoiceRow {
  id: string;
  type: string;
  status: string;
}

interface ChecklistItem {
  total: number;
  completed: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function GoLive({ projectId }: GoLiveProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem>({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Go-live date section
  const [goLiveDateInput, setGoLiveDateInput] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  // Notes section
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Close project confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [projectRes, invoicesRes, checklistRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('projects') as any)
          .select('project_name, venue_name, project_status, go_live_date, notes, completed_at')
          .eq('id', projectId)
          .single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('invoices') as any)
          .select('id, type, status')
          .eq('project_id', projectId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('deployment_checklist') as any)
          .select('id, is_completed')
          .eq('project_id', projectId),
      ]);
      const proj = projectRes.data as ProjectData | null;
      setProject(proj);
      setInvoices(invoicesRes.data ?? []);
      const items: Array<{ is_completed: boolean }> = checklistRes.data ?? [];
      setChecklist({
        total: items.length,
        completed: items.filter((i) => i.is_completed).length,
      });
      if (proj?.go_live_date) {
        setGoLiveDateInput(proj.go_live_date);
      }
      if (proj?.notes) {
        setNotesInput(proj.notes);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  // --- Derived state ---
  const depositInvoice = invoices.find((inv) => inv.type ==='deposit');
  const finalInvoice = invoices.find((inv) => inv.type ==='final');
  const depositPaid = depositInvoice?.status === 'paid';
  const finalSent = finalInvoice?.status === 'sent' || finalInvoice?.status === 'paid';
  const allPhasesComplete =
    checklist.total > 0 && checklist.completed === checklist.total;
  const canClose = allPhasesComplete && depositPaid && finalSent;
  const isCompleted = project?.project_status === 'completed';

  async function handleSaveGoLiveDate() {
    if (!goLiveDateInput) return;
    setSavingDate(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('projects') as any)
      .update({ go_live_date: goLiveDateInput })
      .eq('id', projectId);
    if (error) {
      toast.error('Failed to save go-live date');
    } else {
      toast.success('Go-live date saved');
      setProject((prev) => (prev ? { ...prev, go_live_date: goLiveDateInput } : prev));
      setEditingDate(false);
    }
    setSavingDate(false);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('projects') as any)
      .update({ notes: notesInput })
      .eq('id', projectId);
    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved');
      setProject((prev) => (prev ? { ...prev, notes: notesInput } : prev));
    }
    setSavingNotes(false);
  }

  async function handleCloseProject() {
    setClosing(true);
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('projects') as any)
      .update({ project_status: 'completed', completed_at: now })
      .eq('id', projectId);
    if (error) {
      toast.error('Failed to close project');
    } else {
      toast.success('Project marked as completed!');
      setProject((prev) =>
        prev ? { ...prev, project_status: 'completed', completed_at: now } : prev,
      );
      setShowConfirm(false);
    }
    setClosing(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading go-live data...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Go-Live & Handoff</h3>
        <p className="text-sm text-muted-foreground">
          Set the go-live date, add handoff notes, and close this project when billing is complete.
        </p>
      </div>

      {/* Completed banner */}
      {isCompleted && project?.completed_at && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">
            ✓ Project completed on {formatDate(project.completed_at)}. All data is locked.
          </p>
        </div>
      )}

      {/* Go-Live Date Section */}
      <div className="border rounded-lg p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Go-Live Date
        </p>
        {project?.go_live_date && !editingDate ? (
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">
              ✓ Go-live: {formatDate(project.go_live_date)}
            </p>
            {!isCompleted && (
              <button
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setEditingDate(true)}
              >
                Change Date
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              The go-live date is required before sending the final invoice.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Go-live date
                </label>
                <input
                  type="date"
                  value={goLiveDateInput}
                  onChange={(e) => setGoLiveDateInput(e.target.value)}
                  disabled={isCompleted}
                  className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
              {!isCompleted && (
                <button
                  onClick={handleSaveGoLiveDate}
                  disabled={!goLiveDateInput || savingDate}
                  className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingDate ? 'Saving...' : 'Save Go-Live Date'}
                </button>
              )}
              {editingDate && (
                <button
                  onClick={() => setEditingDate(false)}
                  className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Handoff Notes Section */}
      <div className="border rounded-lg p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Handoff Notes
        </p>
        <p className="text-sm text-muted-foreground">
          Notes visible to the team (installer handoff, special config, follow-up items):
        </p>
        <textarea
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          rows={10}
          maxLength={5000}
          disabled={isCompleted}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-y"
          placeholder="Add handoff notes here..."
        />
        {!isCompleted && (
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        )}
      </div>

      {/* Project Completion Section */}
      {!isCompleted && (
        <div className="border rounded-lg p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Close Project
          </p>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className={allPhasesComplete ? 'text-green-600' : 'text-muted-foreground'}>
                {allPhasesComplete ? '✓' : '○'}
              </span>
              <span className={allPhasesComplete ? 'text-foreground' : 'text-muted-foreground'}>
                All deployment phases complete
                {!allPhasesComplete && checklist.total > 0 && (
                  <span className="text-xs ml-1">
                    ({checklist.completed}/{checklist.total})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={depositPaid ? 'text-green-600' : 'text-muted-foreground'}>
                {depositPaid ? '✓' : '○'}
              </span>
              <span className={depositPaid ? 'text-foreground' : 'text-muted-foreground'}>
                Deposit invoice paid
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={finalSent ? 'text-green-600' : 'text-muted-foreground'}>
                {finalSent ? '✓' : '○'}
              </span>
              <span className={finalSent ? 'text-foreground' : 'text-muted-foreground'}>
                Final invoice sent
              </span>
            </div>
          </div>

          {canClose ? (
            <p className="text-sm text-muted-foreground">
              All billing is complete. Mark this project as completed.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete all checklist items above before closing the project.
            </p>
          )}

          {/* Confirmation dialog inline */}
          {showConfirm ? (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-semibold">Close this project?</p>
              <p className="text-sm text-muted-foreground">
                Mark{' '}
                <span className="font-medium">{project?.venue_name ?? project?.project_name}</span>{' '}
                as completed? This will close the project. Financial data will be locked (can be
                unlocked manually if needed).
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={closing}
                  className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseProject}
                  disabled={closing}
                  className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {closing ? 'Closing...' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canClose}
              data-testid="close-project-btn"
              className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
