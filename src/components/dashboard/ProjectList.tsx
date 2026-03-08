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

export interface Project {
  id: string;
  customer_name: string;
  venue_name?: string;
  project_status: string;
  tier: string;
  go_live_date: string | null;
  deployment_progress_pct?: number;
}

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium mb-2">No projects yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          Start by creating your first installation project.
        </p>
        <a
          href="/projects/new"
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New Project
        </a>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
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
                    href={`/projects/${project.id}/intake`}
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
  );
}
