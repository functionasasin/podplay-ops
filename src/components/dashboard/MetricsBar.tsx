import { LayoutDashboard, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrencyCompact } from '@/lib/formatters';
import type { Project } from './ProjectList';

const ACTIVE_STATUSES = new Set(['intake', 'procurement', 'deployment', 'financial_close']);

const STATUS_LABELS: Record<string, string> = {
  intake: 'Intake',
  procurement: 'Procurement',
  deployment: 'Deployment',
  financial_close: 'Financial Close',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_PILL_CLASSES: Record<string, string> = {
  intake: 'bg-slate-100 text-slate-700',
  procurement: 'bg-yellow-100 text-yellow-700',
  deployment: 'bg-blue-100 text-blue-700',
  financial_close: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface ProjectWithValue extends Project {
  total_contract_value?: number;
}

interface MetricsBarProps {
  projects: ProjectWithValue[];
}

export function MetricsBar({ projects }: MetricsBarProps) {
  const totalProjects = projects.length;

  const activeDeployments = projects.filter((p) => ACTIVE_STATUSES.has(p.project_status)).length;

  const revenuePipeline = projects.reduce(
    (sum, p) => sum + (p.total_contract_value ?? 0),
    0,
  );

  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    const s = p.project_status;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Projects */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Projects</p>
            <p className="text-2xl font-semibold mt-0.5">{totalProjects}</p>
          </div>
        </div>
      </Card>

      {/* Card 2: Active Deployments */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Active Deployments
            </p>
            <p className="text-2xl font-semibold mt-0.5">{activeDeployments}</p>
          </div>
        </div>
      </Card>

      {/* Card 3: Revenue Pipeline */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Revenue Pipeline
            </p>
            <p className="text-2xl font-semibold mt-0.5">{formatCurrencyCompact(revenuePipeline)}</p>
          </div>
        </div>
      </Card>

      {/* Card 4: By Status Breakdown */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              By Status
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_PILL_CLASSES[status] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {STATUS_LABELS[status] ?? status}
                  <span className="font-semibold">{count}</span>
                </span>
              ))}
              {Object.keys(statusCounts).length === 0 && (
                <span className="text-xs text-muted-foreground">No projects</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
