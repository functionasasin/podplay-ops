import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { CalendarClock, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { computeDeadlineStatus } from '@/lib/deadlines';
import type { CaseDeadline, DeadlineStatus } from '@/types';

export const deadlinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deadlines',
  component: DeadlinesPage,
});

interface DeadlineWithCase extends CaseDeadline {
  case_title: string;
  decedent_name: string | null;
}

type UrgencyGroup = 'overdue' | 'due_this_week' | 'urgent' | 'due_soon' | 'upcoming';

const GROUP_CONFIG: Record<UrgencyGroup, { label: string; color: string; textColor: string }> = {
  overdue: { label: 'Overdue', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  due_this_week: { label: 'Due This Week', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  due_soon: { label: 'Due Soon', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
  upcoming: { label: 'Upcoming', color: 'bg-slate-50 border-slate-200', textColor: 'text-slate-700' },
};

function getDaysUntil(dueDate: string): number {
  return Math.floor(
    (new Date(dueDate).getTime() - new Date().getTime()) / 86_400_000,
  );
}

function getUrgencyGroup(dueDate: string): UrgencyGroup {
  const daysUntil = getDaysUntil(dueDate);
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 7) return 'due_this_week';
  if (daysUntil <= 14) return 'urgent';
  if (daysUntil <= 30) return 'due_soon';
  return 'upcoming';
}

function formatDaysLabel(dueDate: string): string {
  const daysUntil = getDaysUntil(dueDate);
  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil);
    return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
  }
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return '1 day left';
  return `${daysUntil} days left`;
}

function DeadlinesPage() {
  const { user, loading: authLoading } = useAuth();
  const [deadlines, setDeadlines] = useState<DeadlineWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAllDeadlines() {
      setLoading(true);
      setError(null);

      // Fetch active cases for the user
      const { data: cases, error: casesErr } = await supabase
        .from('cases')
        .select('id, title, decedent_name')
        .eq('user_id', user!.id)
        .in('status', ['draft', 'computed', 'finalized']);

      if (casesErr) {
        if (!cancelled) {
          setError('Failed to load cases');
          setLoading(false);
        }
        return;
      }

      if (!cases || cases.length === 0) {
        if (!cancelled) {
          setDeadlines([]);
          setLoading(false);
        }
        return;
      }

      const caseIds = cases.map((c) => c.id);
      const caseMap = new Map(cases.map((c) => [c.id, c]));

      // Fetch all pending deadlines for those cases
      const { data: dls, error: dlsErr } = await supabase
        .from('case_deadlines')
        .select('*')
        .in('case_id', caseIds)
        .is('completed_date', null)
        .order('due_date', { ascending: true });

      if (dlsErr) {
        if (!cancelled) {
          setError('Failed to load deadlines');
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        const withCase: DeadlineWithCase[] = (dls ?? []).map((dl) => {
          const caseInfo = caseMap.get(dl.case_id);
          return {
            ...dl,
            case_title: caseInfo?.title ?? 'Unknown Case',
            decedent_name: caseInfo?.decedent_name ?? null,
          } as DeadlineWithCase;
        });
        setDeadlines(withCase);
        setLoading(false);
      }
    }

    fetchAllDeadlines();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const groupedDeadlines = useMemo(() => {
    const groups: Record<UrgencyGroup, DeadlineWithCase[]> = {
      overdue: [],
      due_this_week: [],
      urgent: [],
      due_soon: [],
      upcoming: [],
    };

    for (const dl of deadlines) {
      const group = getUrgencyGroup(dl.due_date);
      groups[group].push(dl);
    }

    return groups;
  }, [deadlines]);

  const groupOrder: UrgencyGroup[] = ['overdue', 'due_this_week', 'urgent', 'due_soon', 'upcoming'];
  const totalPending = deadlines.length;

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-serif">
            Deadlines
          </h1>
        </div>
        <p className="text-muted-foreground">
          Sign in to view your settlement deadlines.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Deadlines
        </h1>
        {!loading && (
          <span className="ml-auto text-sm text-muted-foreground">
            {totalPending} pending deadline{totalPending === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : totalPending === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No pending deadlines across your active cases.
        </p>
      ) : (
        <div className="space-y-6" data-testid="deadline-groups">
          {groupOrder.map((group) => {
            const items = groupedDeadlines[group];
            if (items.length === 0) return null;
            const config = GROUP_CONFIG[group];

            return (
              <section key={group} data-testid={`deadline-group-${group}`}>
                <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${config.textColor}`}>
                  {config.label} ({items.length})
                </h2>
                <div className="space-y-2">
                  {items.map((dl) => (
                    <div
                      key={dl.id}
                      className={`border rounded-md p-3 ${config.color}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{dl.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {dl.decedent_name
                              ? `Estate of ${dl.decedent_name}`
                              : dl.case_title}
                          </p>
                          {dl.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {dl.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-medium ${config.textColor}`}>
                            {formatDaysLabel(dl.due_date)}
                          </span>
                          <Link
                            to="/cases/$caseId"
                            params={{ caseId: dl.case_id }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Open Case
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
