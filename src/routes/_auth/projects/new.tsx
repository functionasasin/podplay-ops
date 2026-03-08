import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const newProjectSchema = z.object({
  project_name: z.string().min(2, 'Project name must be at least 2 characters'),
  customer_name: z.string().min(2, 'Customer name must be at least 2 characters'),
  venue_name: z.string().optional(),
});

type NewProjectFormValues = z.infer<typeof newProjectSchema>;

export function NewProjectPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(newProjectSchema),
  });

  async function onSubmit(values: NewProjectFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('projects') as any)
      .insert({
        project_name: values.project_name,
        customer_name: values.customer_name,
        venue_name: values.venue_name || null,
        project_status: 'intake',
      })
      .select('id')
      .single();

    if (error || !data) {
      showToast('CREATE_PROJECT_ERROR');
      return;
    }

    // /projects/$id/intake route not yet in tree — use href navigation
    window.location.href = `/projects/${data.id}/intake`;
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-6">New Project</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="project_name" className="text-sm font-medium">
            Project Name
          </label>
          <Input
            id="project_name"
            placeholder="Enter project name"
            {...register('project_name')}
          />
          {errors.project_name && (
            <p className="text-xs text-destructive">{errors.project_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="customer_name" className="text-sm font-medium">
            Customer Name
          </label>
          <Input
            id="customer_name"
            placeholder="Enter customer name"
            {...register('customer_name')}
          />
          {errors.customer_name && (
            <p className="text-xs text-destructive">{errors.customer_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="venue_name" className="text-sm font-medium">
            Venue Name <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            id="venue_name"
            placeholder="Enter venue name"
            {...register('venue_name')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Project'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: '/projects' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/new')({
  component: NewProjectPage,
});
