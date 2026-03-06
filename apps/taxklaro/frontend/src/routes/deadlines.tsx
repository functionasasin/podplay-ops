import { useState, useEffect, useCallback } from 'react';
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { authGuard } from '../lib/auth-guard';
import { useOrganization } from '../hooks/useOrganization';
import { listComputations } from '../lib/computations';
import { DeadlineCard } from '../components/deadlines/DeadlineCard';
import type { ComputationListItem } from '../types/org';

export const DeadlinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deadlines',
  beforeLoad: authGuard,
  component: DeadlinesPage,
});

interface DeadlineEntry {
  key: string;
  milestoneKey: string;
  dueDate: string;
  description: string;
  completed: boolean;
  computationTitle: string;
}

/** Derive filing deadlines from computation metadata. */
function deriveDeadlines(computations: ComputationListItem[]): DeadlineEntry[] {
  const entries: DeadlineEntry[] = [];

  for (const c of computations) {
    const year = c.taxYear;
    const title = c.title || `Tax Year ${year}`;

    // Annual ITR deadline: April 15 of the following year
    entries.push({
      key: `${c.id}-annual-itr`,
      milestoneKey: 'annual-itr',
      dueDate: `${year + 1}-04-15`,
      description: `Annual ITR Filing (${year})`,
      completed: c.status === 'finalized' || c.status === 'archived',
      computationTitle: title,
    });

    // Q1 deadline: May 15
    entries.push({
      key: `${c.id}-q1`,
      milestoneKey: 'q1-filing',
      dueDate: `${year}-05-15`,
      description: `Q1 Quarterly Return (${year})`,
      completed: c.status === 'finalized' || c.status === 'archived',
      computationTitle: title,
    });

    // Q2 deadline: August 15
    entries.push({
      key: `${c.id}-q2`,
      milestoneKey: 'q2-filing',
      dueDate: `${year}-08-15`,
      description: `Q2 Quarterly Return (${year})`,
      completed: c.status === 'finalized' || c.status === 'archived',
      computationTitle: title,
    });

    // Q3 deadline: November 15
    entries.push({
      key: `${c.id}-q3`,
      milestoneKey: 'q3-filing',
      dueDate: `${year}-11-15`,
      description: `Q3 Quarterly Return (${year})`,
      completed: c.status === 'finalized' || c.status === 'archived',
      computationTitle: title,
    });
  }

  // Sort by due date ascending
  entries.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return entries;
}

function DeadlinesPage() {
  const { orgId, isLoading: orgLoading } = useOrganization();
  const [deadlines, setDeadlines] = useState<DeadlineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    const computations = await listComputations(orgId);
    setDeadlines(deriveDeadlines(computations));
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  if (orgLoading || isLoading) {
    return (
      <div className="space-y-4" data-testid="deadlines-page">
        <h1 className="text-2xl font-semibold">Deadlines</h1>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const upcoming = deadlines.filter((d) => !d.completed);
  const completed = deadlines.filter((d) => d.completed);

  return (
    <div className="space-y-6" data-testid="deadlines-page">
      <h1 className="text-2xl font-semibold">Deadlines</h1>

      {deadlines.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No deadlines yet. Create a computation to see filing deadlines.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">All deadlines completed.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcoming.map((d) => (
                  <DeadlineCard
                    key={d.key}
                    milestoneKey={d.milestoneKey}
                    dueDate={d.dueDate}
                    description={d.description}
                    completed={d.completed}
                    computationTitle={d.computationTitle}
                  />
                ))}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Completed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completed.map((d) => (
                  <DeadlineCard
                    key={d.key}
                    milestoneKey={d.milestoneKey}
                    dueDate={d.dueDate}
                    description={d.description}
                    completed={d.completed}
                    computationTitle={d.computationTitle}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
