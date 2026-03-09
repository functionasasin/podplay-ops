import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Installer {
  id: string;
  name: string;
  company: string | null;
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
      .select('id, name, company, regions')
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
          <SearchableSelect
            options={installers.map((installer) => ({
              value: installer.id,
              label: `${installer.name}${installer.company ? ` (${installer.company})` : ''}`,
            }))}
            value={selectedId}
            onChange={(value) => setSelectedId(value)}
            placeholder="Select an installer…"
          />
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
