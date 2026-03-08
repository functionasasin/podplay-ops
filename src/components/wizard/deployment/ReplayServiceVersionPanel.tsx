import { supabase } from '@/lib/supabase';

type ReplayServiceVersion = 'v1' | 'v2';

type Props = {
  version: ReplayServiceVersion | null;
  projectId: string;
  onVersionChange: (v: ReplayServiceVersion) => void;
};

export function ReplayServiceVersionPanel({ version, projectId, onVersionChange }: Props) {
  async function handleChange(v: ReplayServiceVersion) {
    onVersionChange(v);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('projects') as any)
      .update({ replay_service_version: v })
      .eq('id', projectId);
  }

  const current = version ?? 'v1';

  return (
    <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/10">
      <p className="text-sm font-semibold">Replay Service Version</p>

      {/* V1 option */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="radio"
          name="replay_service_version"
          value="v1"
          checked={current === 'v1'}
          onChange={() => handleChange('v1')}
          className="mt-0.5"
        />
        <div>
          <p className="text-sm font-medium">V1 (Current — UDP transport)</p>
          <p className="text-xs text-muted-foreground">
            Deploy from NJ office Mac Mini via SFTP.
          </p>
          <p className="text-xs text-yellow-700 mt-0.5">
            Known issue: pixelation under packet loss (UDP).
          </p>
        </div>
      </label>

      {/* V2 option — disabled */}
      <label className="flex items-start gap-3 cursor-not-allowed opacity-60">
        <input
          type="radio"
          name="replay_service_version"
          value="v2"
          checked={current === 'v2'}
          onChange={() => handleChange('v2')}
          disabled
          className="mt-0.5"
          title="V2 not yet released (expected April 2026)"
        />
        <div>
          <p className="text-sm font-medium">V2 (Coming April 2026 — TCP transport)</p>
          <p className="text-xs text-muted-foreground">
            Deploy from GitHub + configure via admin dashboard.
          </p>
          <p className="text-xs text-muted-foreground">
            Eliminates pixelation. Not yet available.
          </p>
          <button
            type="button"
            className="text-xs text-primary underline mt-0.5"
            onClick={() => {}}
          >
            Request V2 early access
          </button>
        </div>
      </label>

      {current === 'v2' && (
        <p className="text-xs text-muted-foreground border-t pt-2">
          V2 deployment checklist is pending the V2 service release (targeted April 2026). V1
          steps are shown until V2 templates are seeded.
        </p>
      )}
    </div>
  );
}
