import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProjectList, type Project } from '@/components/dashboard/ProjectList';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { projectStatusLabels, serviceTierLabels } from '@/lib/enum-labels';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('projects').select('*');
    if (err) {
      setError(err.message);
    } else {
      setProjects(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.project_status !== statusFilter) return false;
      if (tierFilter !== 'all' && p.tier !== tierFilter) return false;
      if (query) {
        const nameMatch = (p.venue_name ?? p.customer_name).toLowerCase().includes(query);
        const customerMatch = p.customer_name.toLowerCase().includes(query);
        if (!nameMatch && !customerMatch) return false;
      }
      return true;
    });
  }, [projects, statusFilter, tierFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive font-medium">Failed to load projects</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
        <button
          className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
          onClick={() => void fetchProjects()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <MetricsBar projects={projects} />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        >
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(projectStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </Select>

        <Select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="w-36"
        >
          <SelectItem value="all">All Tiers</SelectItem>
          {Object.entries(serviceTierLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </Select>

        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-56"
        />

        <span className="text-sm text-muted-foreground ml-auto">
          Showing {filteredProjects.length} of {projects.length} projects
        </span>
      </div>

      <ProjectList projects={filteredProjects} />
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/')({
  component: ProjectsPage,
});
