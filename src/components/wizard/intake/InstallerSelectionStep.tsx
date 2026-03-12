import { useEffect, useState, type RefObject } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/MultiSelect';

interface Installer {
  id: string;
  name: string;
  company: string | null;
  regions: string[] | null;
}

export interface InstallerSelectionValues {
  installer_ids: string[];
}

interface InstallerSelectionStepProps {
  defaultValues?: Partial<InstallerSelectionValues>;
  onNext: (data: InstallerSelectionValues) => void;
  formRef?: RefObject<HTMLFormElement | null>;
}

export function InstallerSelectionStep({ defaultValues, onNext, formRef }: InstallerSelectionStepProps) {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultValues?.installer_ids ?? []);

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
    if (selectedIds.length === 0) return;
    onNext({ installer_ids: selectedIds });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Installer(s)
        </label>
        {loading ? (
          <p className="text-sm text-muted-foreground" aria-label="loading">
            Loading installers…
          </p>
        ) : installers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No installers found.</p>
        ) : (
          <MultiSelect
            options={installers.map((installer) => ({
              value: installer.id,
              label: `${installer.name}${installer.company ? ` (${installer.company})` : ''}`,
            }))}
            values={selectedIds}
            onChange={setSelectedIds}
            placeholder="Select an installer…"
          />
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={selectedIds.length === 0}>
          Continue
        </Button>
      </div>
    </form>
  );
}
