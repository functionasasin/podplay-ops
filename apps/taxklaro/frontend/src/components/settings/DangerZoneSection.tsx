// DangerZoneSection: Shown only when userRole === 'admin' (spec §14.4).
import { Button } from '@/components/ui/button';

interface DangerZoneSectionProps {
  orgName: string;
  onDeleteOrg: () => Promise<void>;
}

export function DangerZoneSection({ orgName, onDeleteOrg }: DangerZoneSectionProps) {
  return (
    <div className="border border-destructive rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
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
