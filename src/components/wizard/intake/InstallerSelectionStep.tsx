import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface Installer {
  id: string;
  name: string;
  regions: string[] | null;
}

export interface InstallerSelectionValues {
  installer_id: string;
}

interface InstallerSelectionStepProps {
  defaultValues?: Partial<InstallerSelectionValues>;
  onNext: (data: InstallerSelectionValues) => void;
}

export function InstallerSelectionStep({ defaultValues, onNext }: InstallerSelectionStepProps) {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(defaultValues?.installer_id ?? '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('installers')
      .select('id, name, regions')
      .then(({ data }) => {
        if (!cancelled) {
          setInstallers((data as Installer[]) ?? []);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    onNext({ installer_id: selectedId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-1">
        <label htmlFor="installer_id" className="text-sm font-medium">
          Installer
        </label>
        {loading ? (
          <p className="text-sm text-muted-foreground" aria-label="loading">
            Loading installers…
          </p>
        ) : installers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No installers found.</p>
        ) : (
          <select
            id="installer_id"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select an installer…</option>
            {installers.map((installer) => (
              <option key={installer.id} value={installer.id}>
                {installer.name}
                {installer.regions?.length ? ` — ${installer.regions.join(', ')}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={!selectedId}>
          Continue
        </Button>
      </div>
    </form>
  );
}
