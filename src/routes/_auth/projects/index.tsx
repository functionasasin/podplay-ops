import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProjectList, type Project } from '@/components/dashboard/ProjectList';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="p-6">
      <ProjectList projects={projects} />
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/')({
  component: ProjectsPage,
});
