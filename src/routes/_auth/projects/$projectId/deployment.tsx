import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SmartChecklist, type ChecklistItem, type ProjectTokenFields } from '@/components/wizard/deployment/SmartChecklist';
import { VlanReferencePanel } from '@/components/wizard/deployment/VlanReferencePanel';
import { IspConfigMethodPanel } from '@/components/wizard/deployment/IspConfigMethodPanel';
import { ReplayServiceVersionPanel } from '@/components/wizard/deployment/ReplayServiceVersionPanel';
import { AppLockWarningBanner } from '@/components/wizard/deployment/AppLockWarningBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { advanceToFinancialCloseDialog } from '@/lib/confirmation-dialogs';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { isStepAccessible, getStepStates, WIZARD_STEPS } from '@/lib/wizard-steps';

// Phase display ordering per spec: 0-11, then 15, then 12-14
const PHASE_DISPLAY_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 12, 13, 14];

const PHASE_NAMES: Record<number, string> = {
  0: 'Pre-Purchase & Planning',
  1: 'Pre-Configuration (Office)',
  2: 'Unboxing & Labeling',
  3: 'Network Rack Assembly',
  4: 'Networking Setup (UniFi)',
  5: 'ISP Router Configuration',
  6: 'Camera Configuration',
  7: 'DDNS Setup (FreeDNS)',
  8: 'Mac Mini Setup',
  9: 'Replay Service Deployment (V1)',
  10: 'iPad Setup',
  11: 'Apple TV Setup',
  12: 'Physical Installation',
  13: 'Testing & Verification',
  14: 'Health Monitoring Setup',
  15: 'Packaging & Shipping',
};

type IspConfigMethod = 'static_ip' | 'dmz' | 'port_forward';
type ReplayServiceVersion = 'v1' | 'v2';

type ProjectState = ProjectTokenFields & {
  project_name: string;
  tier: string;
  venue_country: string;
  isp_config_method: IspConfigMethod | null;
  replay_service_version: ReplayServiceVersion | null;
};

function DeploymentPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectState | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<number>(PHASE_DISPLAY_ORDER[0]);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: proj }, { data: checklist }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('projects') as any)
          .select('project_name, customer_name, court_count, ddns_subdomain, unifi_site_name, mac_mini_username, location_id, tier, venue_country, isp_config_method, replay_service_version')
          .eq('id', projectId)
          .single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('deployment_checklist_items') as any)
          .select('id, phase, step_number, sort_order, title, description, warnings, is_completed, notes')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true }),
      ]);
      setProject(proj);
      setItems(checklist ?? []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  // Group items by phase
  const byPhase = items.reduce<Record<number, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {});

  const totalSteps = items.length;
  const completedSteps = items.filter((i) => i.is_completed).length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const allItemsChecked = totalSteps === 0 || completedSteps === totalSteps;

  const activeDisplayIdx = PHASE_DISPLAY_ORDER.indexOf(selectedPhase);
  const stepStates = getStepStates('deployment', activeDisplayIdx);
  const navigationSteps = WIZARD_STEPS.deployment.map((step, index) => ({
    id: String(index),
    label: step.label,
    status: stepStates[index],
  }));
  const isLastStep = activeDisplayIdx === WIZARD_STEPS.deployment.length - 1;

  function handleNavigationNext() {
    if (isLastStep) {
      if (!allItemsChecked) {
        toast.warning('Complete all deployment checklist items before advancing');
        return;
      }
      setShowAdvanceDialog(true);
    } else {
      setSelectedPhase(PHASE_DISPLAY_ORDER[activeDisplayIdx + 1]);
    }
  }

  function handleNavigationPrevious() {
    if (activeDisplayIdx > 0) {
      setSelectedPhase(PHASE_DISPLAY_ORDER[activeDisplayIdx - 1]);
    }
  }

  function handleStepClick(stepId: string) {
    const index = Number(stepId);
    if (isStepAccessible(stepStates[index])) {
      setSelectedPhase(PHASE_DISPLAY_ORDER[index]);
    }
  }

  const selectedItems = byPhase[selectedPhase] ?? [];

  function handleIspMethodChange(method: IspConfigMethod) {
    if (!project) return;
    setProject({ ...project, isp_config_method: method });
  }

  function handleReplayVersionChange(version: ReplayServiceVersion) {
    if (!project) return;
    setProject({ ...project, replay_service_version: version });
  }

  async function toggleItem(item: ChecklistItem) {
    const newCompleted = !item.is_completed;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('deployment_checklist_items') as any)
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_completed: newCompleted } : i,
      ),
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {loading ? 'Deployment' : `Deployment — ${project?.project_name ?? projectId}`}
        </h1>
        {!loading && project?.customer_name && (
          <p className="text-sm text-muted-foreground mt-0.5">{project.customer_name}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{progressPct}% complete ({completedSteps}/{totalSteps} steps)</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-background">
        <WizardNavigation
          steps={navigationSteps}
          onStepClick={handleStepClick}
          onPrevious={handleNavigationPrevious}
          onNext={handleNavigationNext}
          isFirstStep={activeDisplayIdx === 0}
          isLastStep={isLastStep}
          nextLabel={isLastStep ? 'Advance to Financial Close' : undefined}
        />
      </div>

      <div className="border rounded-lg p-6 min-h-64">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading checklist...</p>
        ) : !loading && items.length === 0 ? (
          (() => {
            const cfg = EMPTY_STATES.deploymentChecklistEmpty;
            return <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} />;
          })()
        ) : (
          <>
            <h2 className="text-base font-semibold mb-4">
              Phase {selectedPhase}: {PHASE_NAMES[selectedPhase]}
            </h2>

            {/* Phase 4: VLAN Architecture Reference */}
            {selectedPhase === 4 && project && (
              <VlanReferencePanel tier={project.tier} />
            )}

            {/* Phase 5: ISP Router Configuration Method */}
            {selectedPhase === 5 && project && (
              <IspConfigMethodPanel
                projectId={projectId}
                method={project.isp_config_method}
                venueCountry={project.venue_country}
                onMethodChange={handleIspMethodChange}
              />
            )}

            {/* Phase 9: Replay Service Version */}
            {selectedPhase === 9 && project && (
              <ReplayServiceVersionPanel
                projectId={projectId}
                version={project.replay_service_version}
                onVersionChange={handleReplayVersionChange}
              />
            )}

            {/* Phase 12: App Lock Warning Banner (above Step 108 / Flic button pairing) */}
            {selectedPhase === 12 && <AppLockWarningBanner />}

            <SmartChecklist
              items={selectedItems}
              project={project ?? { customer_name: '', court_count: 0 }}
              onToggle={toggleItem}
            />
          </>
        )}
      </div>

      {showAdvanceDialog && (() => {
        const cfg = advanceToFinancialCloseDialog(
          project?.project_name ?? projectId,
        );
        return (
          <ConfirmDialog
            open={true}
            onOpenChange={(open) => { if (!open) setShowAdvanceDialog(false); }}
            title={cfg.title}
            body={cfg.body}
            confirmLabel={cfg.confirmLabel}
            cancelLabel={cfg.cancelLabel}
            destructive={cfg.destructive}
            onConfirm={async () => {
              setAdvancing(true);
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('projects') as any)
                  .update({ project_status: 'financial_close' })
                  .eq('id', projectId);
                toast.success('Project advanced to Financial Close');
                setShowAdvanceDialog(false);
                navigate({ to: '/projects/$projectId/financials', params: { projectId } });
              } catch (err) {
                toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
              } finally {
                setAdvancing(false);
              }
            }}
          />
        );
      })()}
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/deployment')({
  component: DeploymentPage,
});
