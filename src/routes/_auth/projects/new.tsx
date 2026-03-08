import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { VALIDATION } from '@/lib/validation-messages';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const newProjectSchema = z.object({
  project_name: z.string().min(2, VALIDATION.newProject.project_name.min),
  customer_name: z.string().min(2, VALIDATION.newProject.customer_name.min),
  venue_name: z.string().optional(),
});

type NewProjectFormValues = z.infer<typeof newProjectSchema>;

// Token map for checklist template substitution at project creation time.
// Fields not yet collected in this simple form use placeholder values per spec.
function buildTokenMap(customerName: string): Record<string, string> {
  return {
    '{{CUSTOMER_NAME}}': customerName,
    '{{COURT_COUNT}}': '[TBD]',
    '{{DDNS_SUBDOMAIN}}': '[SET IN STEP 5]',
    '{{UNIFI_SITE_NAME}}': '[SET IN STEP 5]',
    '{{MAC_MINI_USERNAME}}': '[SET IN STEP 5]',
    '{{LOCATION_ID}}': '[GET FROM AGUSTIN]',
  };
}

function replaceTokens(text: string, tokenMap: Record<string, string>): string {
  return Object.entries(tokenMap).reduce(
    (acc, [token, val]) => acc.split(token).join(val),
    text,
  );
}

async function seedChecklist(projectId: string, customerName: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: templates, error: tmplError } = await (supabase.from('deployment_checklist_templates') as any)
    .select('id, phase, step_number, sort_order, title, description, warnings');

  if (tmplError || !templates) {
    throw tmplError ?? new Error('No templates returned');
  }

  const tokenMap = buildTokenMap(customerName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (templates as any[]).map((t) => ({
    project_id: projectId,
    template_id: t.id,
    phase: t.phase,
    step_number: t.step_number,
    sort_order: t.sort_order,
    title: t.title,
    description: replaceTokens(t.description as string, tokenMap),
    warnings: t.warnings,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase.from('deployment_checklist_items') as any).insert(items);

  if (insertError) throw insertError;
}

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
    // Step 1: Insert project row
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

    const projectId = (data as { id: string }).id;

    // Step 2: Seed deployment checklist from templates.
    // If seeding fails, show a warning but still redirect — project exists and checklist can be retried.
    try {
      await seedChecklist(projectId, values.customer_name);
      showToast('CREATE_PROJECT_SUCCESS');
    } catch (err) {
      console.error('Checklist seeding failed:', err);
      showToast('CHECKLIST_SEED_WARNING');
    }

    window.location.href = `/projects/${projectId}/intake`;
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-6">New Project</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="project_name" className="text-sm font-medium">
            Project Name
          </label>
          <Input
            id="project_name"
            placeholder="Enter project name"
            className="h-11"
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
            className="h-11"
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
            className="h-11"
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
