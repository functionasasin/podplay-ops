import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SmartChecklist, type ChecklistItem, type ProjectTokenFields } from '@/components/wizard/deployment/SmartChecklist';

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

function phaseIcon(completed: number, total: number): string {
  if (total === 0) return '○';
  if (completed === total) return '●';
  if (completed > 0) return '◑';
  return '○';
}

type ProjectState = ProjectTokenFields & { project_name: string };

function DeploymentPage() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<ProjectState | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const [{ data: proj }, { data: checklist }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('projects') as any)
          .select('project_name, customer_name, court_count, ddns_subdomain, unifi_site_name, mac_mini_username, location_id')
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

  const selectedItems = byPhase[selectedPhase] ?? [];

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
        <h1 className="text-xl font-semibold">Deployment</h1>
        {loading ? (
          <p className="text-sm text-muted-foreground mt-0.5">Loading...</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-0.5">
            {project?.project_name ?? projectId} — {project?.customer_name ?? ''}
          </p>
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

      <div className="flex gap-0 border rounded-lg overflow-hidden min-h-[600px]">
        {/* Left sidebar: phase list */}
        <div className="w-60 flex-shrink-0 border-r bg-muted/20 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {PHASE_DISPLAY_ORDER.map((phaseNum) => {
              const phaseItems = byPhase[phaseNum] ?? [];
              const phaseCompleted = phaseItems.filter((i) => i.is_completed).length;
              const phaseTotal = phaseItems.length;
              const icon = phaseIcon(phaseCompleted, phaseTotal);
              const isActive = selectedPhase === phaseNum;

              return (
                <button
                  key={phaseNum}
                  onClick={() => setSelectedPhase(phaseNum)}
                  className={[
                    'w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors',
                    isActive
                      ? 'bg-background border-l-2 border-primary text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  ].join(' ')}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="flex-shrink-0 w-4 text-center">{icon}</span>
                  <span className="flex-1 truncate">
                    Phase {phaseNum}: {PHASE_NAMES[phaseNum]}
                  </span>
                  {phaseTotal > 0 && (
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {phaseCompleted}/{phaseTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel: phase checklist */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading checklist...</p>
          ) : (
            <>
              <h2 className="text-base font-semibold mb-4">
                Phase {selectedPhase}: {PHASE_NAMES[selectedPhase]}
              </h2>

              <SmartChecklist
                items={selectedItems}
                project={project ?? { customer_name: '', court_count: 0 }}
                onToggle={toggleItem}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/deployment')({
  component: DeploymentPage,
});
