// Wizard step locking logic — Q11
// Defines steps for each wizard and determines step states (completed/current/locked).

export type StepState = 'completed' | 'current' | 'locked';

export type WizardType = 'intake' | 'procurement' | 'deployment' | 'financials';

export interface WizardStepDef {
  label: string;
}

export const WIZARD_STEPS: Record<WizardType, WizardStepDef[]> = {
  intake: [
    { label: 'Customer Info' },
    { label: 'Venue Config' },
    { label: 'Service Tier' },
    { label: 'ISP Info' },
    { label: 'Installer' },
    { label: 'Financial Setup' },
    { label: 'Review & Submit' },
  ],
  procurement: [
    { label: 'BOM Review' },
    { label: 'Inventory Check' },
    { label: 'Purchase Orders' },
    { label: 'Packing List' },
  ],
  deployment: [
    { label: 'Pre-Purchase & Planning' },
    { label: 'Pre-Configuration (Office)' },
    { label: 'Unboxing & Labeling' },
    { label: 'Network Rack Assembly' },
    { label: 'Networking Setup (UniFi)' },
    { label: 'ISP Router Configuration' },
    { label: 'Camera Configuration' },
    { label: 'DDNS Setup (FreeDNS)' },
    { label: 'Mac Mini Setup' },
    { label: 'Replay Service Deployment (V1)' },
    { label: 'iPad Setup' },
    { label: 'Apple TV Setup' },
    { label: 'Physical Installation' },
    { label: 'Testing & Verification' },
    { label: 'Health Monitoring Setup' },
    { label: 'Packaging & Shipping' },
  ],
  financials: [
    { label: 'Invoicing' },
    { label: 'Expenses' },
    { label: 'P&L Summary' },
    { label: 'Go-Live' },
    { label: 'Recurring Fees' },
  ],
};

/**
 * Returns the state of each step given the current step index.
 * Steps before currentStepIndex are 'completed', currentStepIndex is 'current',
 * steps after are 'locked'.
 */
export function getStepStates(wizard: WizardType, currentStepIndex: number): StepState[] {
  return WIZARD_STEPS[wizard].map((_, index) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'locked';
  });
}

/**
 * Returns true if a step can be clicked/navigated to.
 * Only completed and current steps are accessible.
 */
export function isStepAccessible(state: StepState): boolean {
  return state !== 'locked';
}

/**
 * Derives the current intake step index from project data.
 * Prefers the explicit wizard_step field; falls back to inferring from filled fields.
 */
export function getIntakeCurrentStep(project: {
  wizard_step?: number | null;
  customer_name?: string | null;
  venue_address_line1?: string | null;
  tier?: string | null;
  isp_provider?: string | null;
  installer_ids?: string[] | null;
  go_live_date?: string | null;
}): number {
  if (project.wizard_step != null) return project.wizard_step;
  if (!project.customer_name) return 0;
  if (!project.venue_address_line1) return 1;
  if (!project.tier) return 2;
  if (!project.isp_provider) return 3;
  if (!project.installer_ids?.length) return 4;
  if (!project.go_live_date) return 5;
  return 6;
}
