// Phase 4, Step 10/11: VLAN Architecture Reference Panel (Autonomous tiers)
// Spec: ui-spec/wizard-deployment.md § Phase 4, Step 10/11: VLAN Panel

type Tier = 'pro' | 'autonomous' | 'autonomous_plus';

type VlanReferencePanelProps = {
  tier: Tier | string;
};

/**
 * VLAN Architecture Reference card shown above Phase 4 checklist.
 * VLAN 31 (Surveillance) grayed out for non-autonomous_plus tiers.
 * VLAN 33 (Access Control) grayed out for non-autonomous tiers.
 */
export function VlanReferencePanel({ tier }: VlanReferencePanelProps) {
  const isAutonomousPlus = tier === 'autonomous_plus';
  const isAutonomous = tier === 'autonomous' || tier === 'autonomous_plus';

  return (
    <div className="mb-4 border rounded-lg p-4 bg-muted/10 text-sm font-mono space-y-1">
      <p className="font-semibold text-xs text-muted-foreground mb-2 not-italic font-sans">
        VLAN Architecture Reference
      </p>
      <p>VLAN 30 — Default (192.168.30.0/24) — Management</p>
      <p>VLAN 32 — REPLAY (192.168.32.0/24) — Mac Mini + cameras</p>
      <p className="text-xs text-muted-foreground ml-4">
        Mac Mini fixed IP: 192.168.32.100
      </p>
      <p className={isAutonomousPlus ? '' : 'text-muted-foreground line-through opacity-50'}>
        VLAN 31 — SURVEILLANCE (192.168.31.0/24) [Autonomous+]
      </p>
      <p className={isAutonomous ? '' : 'text-muted-foreground line-through opacity-50'}>
        VLAN 33 — ACCESS CONTROL (192.168.33.0/24) [Autonomous]
      </p>
      <p className="mt-2 text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded text-xs not-italic font-sans">
        ⚠ Port 4000: Replay service — MUST be forwarded
      </p>
    </div>
  );
}
