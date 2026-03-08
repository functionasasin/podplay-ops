// src/components/financials/RevenueFunnel.tsx
// Revenue funnel component — shows project count and dollar amount per stage
// with a visual funnel layout that narrows from top to bottom.

import type { RevenueStage } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RevenuePipelineStage {
  stage: RevenueStage;
  label: string;
  project_count: number;
  total_contract_value: number;
  deposit_outstanding: number;
  final_outstanding: number;
}

interface RevenueFunnelProps {
  stages: RevenuePipelineStage[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_ORDER: RevenueStage[] = [
  'proposal',
  'signed',
  'deposit_invoiced',
  'deposit_paid',
  'final_invoiced',
  'final_paid',
];

const STAGE_LABELS: Record<RevenueStage, string> = {
  proposal:         'Proposal Sent',
  signed:           'Contract Signed',
  deposit_invoiced: 'Deposit Invoiced',
  deposit_paid:     'Deposit Received',
  final_invoiced:   'Final Invoice Sent',
  final_paid:       'Fully Paid',
};

const STAGE_COLORS: Record<RevenueStage, string> = {
  proposal:         'bg-slate-200 text-slate-800',
  signed:           'bg-blue-200 text-blue-900',
  deposit_invoiced: 'bg-yellow-200 text-yellow-900',
  deposit_paid:     'bg-green-200 text-green-900',
  final_invoiced:   'bg-orange-200 text-orange-900',
  final_paid:       'bg-green-400 text-green-950',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) {
    return '$' + (n / 1_000_000).toFixed(2) + 'M';
  }
  if (n >= 1_000) {
    return '$' + (n / 1_000).toFixed(1) + 'k';
  }
  return '$' + n.toFixed(0);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RevenueFunnel({ stages }: RevenueFunnelProps) {
  // Build a lookup by stage value
  const byStage: Record<string, RevenuePipelineStage> = {};
  for (const s of stages) {
    byStage[s.stage] = s;
  }

  const maxCount = Math.max(...STAGE_ORDER.map((s) => byStage[s]?.project_count ?? 0), 1);
  const totalValue = stages.reduce((sum, s) => sum + s.total_contract_value, 0);
  const totalProjects = (byStage['proposal']?.project_count ?? 0) +
    (byStage['signed']?.project_count ?? 0) +
    (byStage['deposit_invoiced']?.project_count ?? 0) +
    (byStage['deposit_paid']?.project_count ?? 0) +
    (byStage['final_invoiced']?.project_count ?? 0) +
    (byStage['final_paid']?.project_count ?? 0);

  return (
    <section className="space-y-4" data-testid="revenue-funnel">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Revenue Funnel</h2>
        <span className="text-sm text-muted-foreground">
          {totalProjects} project{totalProjects !== 1 ? 's' : ''} · {formatCurrency(totalValue)} pipeline
        </span>
      </div>

      <div className="space-y-1.5">
        {STAGE_ORDER.map((stageKey, index) => {
          const entry = byStage[stageKey];
          const count = entry?.project_count ?? 0;
          const value = entry?.total_contract_value ?? 0;

          // Width narrows from 100% at top to ~50% at bottom
          const minWidthPct = 50;
          const maxWidthPct = 100;
          const totalStages = STAGE_ORDER.length - 1;
          const widthPct = maxWidthPct - ((maxWidthPct - minWidthPct) * index) / totalStages;

          // Bar fill width within the container (proportional to project count)
          const fillPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div
              key={stageKey}
              className="flex flex-col"
              style={{ width: `${widthPct}%`, minWidth: '60%' }}
              data-testid={`funnel-stage-${stageKey}`}
            >
              <div className={`rounded-md px-4 py-3 relative overflow-hidden ${STAGE_COLORS[stageKey]}`}>
                {/* Background fill bar showing relative volume */}
                <div
                  className="absolute inset-0 opacity-20 bg-black"
                  style={{ width: `${fillPct}%` }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {STAGE_LABELS[stageKey]}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span
                      className="font-bold tabular-nums"
                      data-testid={`funnel-count-${stageKey}`}
                    >
                      {count} project{count !== 1 ? 's' : ''}
                    </span>
                    <span
                      className="font-medium tabular-nums"
                      data-testid={`funnel-value-${stageKey}`}
                    >
                      {formatCurrency(value)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
        <span>6 stages · funnel narrows by stage</span>
        <span>Total pipeline: {formatCurrency(totalValue)}</span>
      </div>
    </section>
  );
}
