/**
 * HerChart — monthly HER bar chart
 * Bars colored by HER status threshold: loss/break_even/healthy/strong
 */
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

interface HerMonthRow {
  label: string;
  herRatio: number | null;
}

interface HerChartProps {
  months: HerMonthRow[];
}

type HerStatus = 'loss' | 'break_even' | 'healthy' | 'strong' | 'no_data';

function classifyHER(her: number | null): HerStatus {
  if (her === null || her === undefined) return 'no_data';
  if (her < 1.0) return 'loss';
  if (her < 1.5) return 'break_even';
  if (her < 2.0) return 'healthy';
  return 'strong';
}

function herStatusColor(status: HerStatus): string {
  switch (status) {
    case 'strong':
      return '#16a34a';
    case 'healthy':
      return '#22c55e';
    case 'break_even':
      return '#ca8a04';
    case 'loss':
      return '#dc2626';
    default:
      return '#94a3b8';
  }
}

function herStatusLabel(status: HerStatus): string {
  switch (status) {
    case 'strong':
      return 'Strong';
    case 'healthy':
      return 'Healthy';
    case 'break_even':
      return 'Break-even';
    case 'loss':
      return 'Loss';
    default:
      return 'No data';
  }
}

const BAR_HEIGHT = 160;
const BAR_WIDTH = 28;
const BAR_GAP = 16;

// Reference lines at HER = 1.0, 1.5, 2.0 (max scale = 3.0)
const HER_MAX = 3.0;
const REFERENCE_LINES = [
  { value: 1.0, label: '1.0' },
  { value: 1.5, label: '1.5' },
  { value: 2.0, label: '2.0' },
];

export function HerChart({ months }: HerChartProps) {
  if (months.length === 0) {
    const cfg = EMPTY_STATES.herNoData;
    return <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} cta={{ label: cfg.cta.label }} />;
  }

  const LABEL_WIDTH = 28;
  const groupWidth = BAR_WIDTH + BAR_GAP;
  const chartWidth = months.length * groupWidth + LABEL_WIDTH;
  const svgHeight = BAR_HEIGHT + 40;

  const toBarH = (her: number) =>
    Math.max(Math.min(her / HER_MAX, 1) * BAR_HEIGHT, 1);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Monthly HER Chart</h4>
        {/* Legend */}
        <div className="flex gap-4 text-xs mb-2 flex-wrap">
          {(['loss', 'break_even', 'healthy', 'strong'] as HerStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: herStatusColor(s) }}
              />
              {herStatusLabel(s)}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={svgHeight}
          aria-label="Monthly HER bar chart"
          role="img"
        >
          {/* Reference lines */}
          {REFERENCE_LINES.map((ref) => {
            const y = BAR_HEIGHT - toBarH(ref.value);
            return (
              <g key={ref.value}>
                <line
                  x1={LABEL_WIDTH}
                  x2={chartWidth}
                  y1={y}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <text
                  x={LABEL_WIDTH - 2}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill="#94a3b8"
                >
                  {ref.label}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {months.map((m, i) => {
            const status = classifyHER(m.herRatio);
            const her = m.herRatio ?? 0;
            const bh = toBarH(her);
            const by = BAR_HEIGHT - bh;
            const x = LABEL_WIDTH + i * groupWidth;
            return (
              <g key={m.label}>
                <rect
                  x={x}
                  y={by}
                  width={BAR_WIDTH}
                  height={bh}
                  fill={herStatusColor(status)}
                  opacity={0.85}
                  rx={2}
                  aria-label={`${m.label} HER: ${m.herRatio?.toFixed(2) ?? 'N/A'}`}
                  data-testid={`her-bar-${m.label}`}
                />
                {/* Value label above bar */}
                {m.herRatio !== null && (
                  <text
                    x={x + BAR_WIDTH / 2}
                    y={by - 3}
                    textAnchor="middle"
                    fontSize={9}
                    fill="currentColor"
                  >
                    {m.herRatio.toFixed(1)}
                  </text>
                )}
                {/* Month label */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={BAR_HEIGHT + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Monthly Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm" data-testid="her-chart-table">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Month</th>
              <th className="text-right px-4 py-2 font-medium">HER Ratio</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {months.map((row) => {
              const status = classifyHER(row.herRatio);
              return (
                <tr key={row.label} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">{row.label}</td>
                  <td
                    className="px-4 py-2 text-right font-semibold tabular-nums"
                    style={{ color: herStatusColor(status) }}
                  >
                    {row.herRatio !== null ? row.herRatio.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs" style={{ color: herStatusColor(status) }}>
                    {herStatusLabel(status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
