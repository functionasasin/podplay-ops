import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type CcTerminalStatus = 'ordered' | 'received' | 'configured' | 'deployed' | 'returned';

const STATUS_OPTIONS: { value: CcTerminalStatus; label: string }[] = [
  { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' },
  { value: 'configured', label: 'Configured' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'returned', label: 'Returned' },
];

const STATUS_BADGE: Record<CcTerminalStatus, string> = {
  ordered: 'bg-blue-100 text-blue-800',
  received: 'bg-yellow-100 text-yellow-800',
  configured: 'bg-purple-100 text-purple-800',
  deployed: 'bg-green-100 text-green-800',
  returned: 'bg-red-100 text-red-800',
};

interface CcTerminal {
  id: string;
  serial_number: string;
  model: string;
  status: CcTerminalStatus;
  deployed_date: string | null;
  notes: string | null;
}

interface CcTerminalOrderProps {
  projectId: string;
}

export function CcTerminalOrder({ projectId }: CcTerminalOrderProps) {
  const [terminals, setTerminals] = useState<CcTerminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState<CcTerminalStatus>('ordered');
  const [notes, setNotes] = useState('');

  async function loadTerminals() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('cc_terminals') as any)
      .select('id, serial_number, model, status, deployed_date, notes')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    setTerminals((data as CcTerminal[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadTerminals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedSerial = serialNumber.trim();
    const trimmedModel = model.trim();

    if (!trimmedSerial) {
      setError('Serial number is required.');
      return;
    }
    if (!trimmedModel) {
      setError('Model is required.');
      return;
    }

    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('cc_terminals') as any).insert({
        project_id: projectId,
        serial_number: trimmedSerial,
        model: trimmedModel,
        status,
        notes: notes.trim() || null,
      });

      if (insertError) throw new Error(insertError.message);

      setSerialNumber('');
      setModel('');
      setStatus('ordered');
      setNotes('');
      setShowForm(false);
      await loadTerminals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add terminal.');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, newStatus: CcTerminalStatus) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('cc_terminals') as any)
      .update({
        status: newStatus,
        deployed_date: newStatus === 'deployed' ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', id);
    await loadTerminals();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading CC terminals...</p>;

  return (
    <div className="space-y-4 max-w-3xl">
      {terminals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No CC terminals added yet.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                <th className="py-2 px-3">Serial Number</th>
                <th className="py-2 px-3">Model</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Notes</th>
                <th className="py-2 px-3 w-36">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {terminals.map((terminal) => (
                <tr key={terminal.id} className="border-b last:border-0">
                  <td className="py-2 px-3 font-mono text-xs">{terminal.serial_number}</td>
                  <td className="py-2 px-3">{terminal.model}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[terminal.status]}`}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === terminal.status)?.label ??
                        terminal.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{terminal.notes ?? '—'}</td>
                  <td className="py-2 px-3">
                    <select
                      value={terminal.status}
                      onChange={(e) =>
                        updateStatus(terminal.id, e.target.value as CcTerminalStatus)
                      }
                      className="border rounded px-2 py-1 text-xs w-full"
                      aria-label={`Update status for ${terminal.serial_number}`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium"
        >
          Add CC Terminal
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-4 bg-muted/20">
          <h3 className="text-sm font-semibold">Add CC Terminal</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cc-serial">
                Serial Number
              </label>
              <input
                id="cc-serial"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder="e.g., SN-12345678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cc-model">
                Model
              </label>
              <input
                id="cc-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder="e.g., Clover Flex"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="cc-status">
              Status
            </label>
            <select
              id="cc-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as CcTerminalStatus)}
              className="border rounded px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="cc-notes">
              Notes (optional)
            </label>
            <textarea
              id="cc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="border rounded px-3 py-2 text-sm w-full resize-none"
              placeholder="e.g., Assigned to court 1 entrance"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add Terminal'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="px-4 py-2 border rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
