import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getEnumLabel, getEnumBadgeClass } from '@/lib/enum-labels';
import { formatDate, formatPct } from '@/lib/formatters';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

export interface Project {
  id: string;
  customer_name: string;
  venue_name?: string;
  project_status: string;
  tier: string;
  go_live_date: string | null;
  deployment_progress_pct?: number;
}

function getProjectHref(id: string, status: string): string {
  if (status === 'procurement') return `/projects/${id}/procurement`;
  if (status === 'deployment') return `/projects/${id}/deployment`;
  if (status === 'financial_close' || status === 'completed' || status === 'cancelled') return `/projects/${id}/financials`;
  return `/projects/${id}/intake`;
}

export function ProjectList({
  projects,
  hasFilters,
  onClearFilters,
}: {
  projects: Project[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
}) {
  if (projects.length === 0) {
    if (hasFilters) {
      const cfg = EMPTY_STATES.dashboardNoResults;
      return (
        <EmptyState
          icon={cfg.icon}
          heading={cfg.heading}
          description={cfg.description}
          cta={{ label: cfg.cta.label, onClick: onClearFilters }}
        />
      );
    }
    const cfg = EMPTY_STATES.dashboardNoProjects;
    return (
      <EmptyState
        icon={cfg.icon}
        heading={cfg.heading}
        description={cfg.description}
        cta={{ label: cfg.cta.label, href: cfg.cta.href }}
      />
    );
  }

  return (
    <div>
      {/* Table view — sm and above */}
      <div className="border rounded-lg hidden sm:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-44">Status</TableHead>
                <TableHead className="w-28">Tier</TableHead>
                <TableHead className="w-28">Go-Live</TableHead>
                <TableHead className="w-24 text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const statusLabel = getEnumLabel('project_status', project.project_status);
                const statusDotClass = getEnumBadgeClass('project_status', project.project_status);
                const tierLabel = getEnumLabel('service_tier', project.tier);
                const tierBadgeClass = getEnumBadgeClass('service_tier', project.tier);

                return (
                  <TableRow key={project.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <a
                        href={getProjectHref(project.id, project.project_status)}
                        className="font-medium text-sm hover:underline"
                      >
                        {project.venue_name ?? project.customer_name}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.customer_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusDotClass}`} />
                        <span className="text-sm">{statusLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${tierBadgeClass}`}
                      >
                        {tierLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {project.go_live_date ? (
                        formatDate(project.go_live_date)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {project.deployment_progress_pct != null
                        ? formatPct(project.deployment_progress_pct)
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Card view — below sm */}
      <div className="sm:hidden space-y-2">
        {projects.map((project) => {
          const statusLabel = getEnumLabel('project_status', project.project_status);
          const statusDotClass = getEnumBadgeClass('project_status', project.project_status);
          const tierLabel = getEnumLabel('service_tier', project.tier);
          const tierBadgeClass = getEnumBadgeClass('service_tier', project.tier);
          return (
            <div key={project.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={getProjectHref(project.id, project.project_status)}
                  className="font-medium text-sm hover:underline"
                >
                  {project.venue_name ?? project.customer_name}
                </a>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border flex-shrink-0 ${tierBadgeClass}`}
                >
                  {tierLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusDotClass}`} />
                <span className="text-sm">{statusLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Customer:</span>{' '}
                  {project.customer_name}
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Go-Live:</span>{' '}
                  {project.go_live_date ? formatDate(project.go_live_date) : '—'}
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Progress:</span>{' '}
                  {project.deployment_progress_pct != null
                    ? formatPct(project.deployment_progress_pct)
                    : '—'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
