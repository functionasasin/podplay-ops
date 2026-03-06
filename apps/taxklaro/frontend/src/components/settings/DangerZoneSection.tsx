// DangerZoneSection: Shown only when userRole === 'admin' (spec §14.4).
import { Button } from '@/components/ui/button';

interface DangerZoneSectionProps {
  orgName: string;
  onDeleteOrg: () => Promise<void>;
}

export function DangerZoneSection({ orgName, onDeleteOrg }: DangerZoneSectionProps) {
  return (
    <div className="bg-destructive/5 border border-destructive/40 rounded-xl p-6 space-y-3">
      <h2 className="font-display text-xl text-destructive">Danger Zone</h2>
      <p className="text-sm text-muted-foreground">
        Delete the organization <strong>{orgName}</strong>. This action is irreversible.
      </p>
      <Button variant="destructive" size="sm" onClick={onDeleteOrg}>
        Delete Organization
      </Button>
    </div>
  );
}

export default DangerZoneSection;
