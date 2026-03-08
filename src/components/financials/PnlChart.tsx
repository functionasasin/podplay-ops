/**
 * PnlChart — monthly P&L table + SVG bar chart
 * Columns: Revenue, COGS, Expenses, Margin (grouped bars)
 */

interface MonthRow {
  label: string;
  revenue: number;
  cogs: number;
  expenses: number;
  margin: number;
}

interface PnlChartProps {
  months: MonthRow[];
}

function formatCurrency(n: number): string {
  return `$${Math.abs(n)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${n < 0 ? ' (loss)' : ''}`;
}

const BAR_HEIGHT = 160;
const BAR_WIDTH = 12;
const GROUP_GAP = 24;
const BAR_GAP = 2;

export function PnlChart({ months }: PnlChartProps) {
  if (months.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No monthly data to display.
      </p>
    );
  }

  const allValues = months.flatMap((m) => [m.revenue, m.cogs, m.expenses, Math.abs(m.margin)]);
  const maxVal = Math.max(...allValues, 1);

  const groupWidth = 4 * (BAR_WIDTH + BAR_GAP) + GROUP_GAP;
  const svgWidth = months.length * groupWidth;
  const svgHeight = BAR_HEIGHT + 40; // extra for labels

  const toBarH = (v: number) => Math.max((Math.abs(v) / maxVal) * BAR_HEIGHT, 1);

  const COLORS = {
    revenue: '#22c55e',
    cogs: '#f97316',
    expenses: '#ef4444',
    margin: '#3b82f6',
  };

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Monthly P&L Chart</h4>
        <div className="flex gap-4 text-xs mb-2 flex-wrap">
          {Object.entries(COLORS).map(([key, color]) => (
            <span key={key} className="flex items-center gap-1 capitalize">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
              {key}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            aria-label="Monthly P&L bar chart"
            role="img"
          >
            {months.map((m, i) => {
              const x = i * groupWidth;
              const bars = [
                { key: 'revenue', val: m.revenue, color: COLORS.revenue },
                { key: 'cogs', val: m.cogs, color: COLORS.cogs },
                { key: 'expenses', val: m.expenses, color: COLORS.expenses },
                { key: 'margin', val: m.margin, color: COLORS.margin },
              ];
              return (
                <g key={m.label} transform={`translate(${x}, 0)`}>
                  {bars.map((b, bi) => {
                    const bx = bi * (BAR_WIDTH + BAR_GAP);
                    const bh = toBarH(b.val);
                    const by = BAR_HEIGHT - bh;
                    return (
                      <rect
                        key={b.key}
                        x={bx}
                        y={by}
                        width={BAR_WIDTH}
                        height={bh}
                        fill={b.val < 0 && b.key === 'margin' ? '#ef4444' : b.color}
                        opacity={0.85}
                        rx={1}
                        aria-label={`${m.label} ${b.key}: ${b.val}`}
                      />
                    );
                  })}
                  {/* Month label */}
                  <text
                    x={(4 * (BAR_WIDTH + BAR_GAP)) / 2 - BAR_GAP}
                    y={BAR_HEIGHT + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    className="text-muted-foreground"
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Monthly Table */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Monthly Breakdown</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm" data-testid="pnl-chart-table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Month</th>
                <th className="text-right px-4 py-2 font-medium">Revenue</th>
                <th className="text-right px-4 py-2 font-medium">COGS</th>
                <th className="text-right px-4 py-2 font-medium">Expenses</th>
                <th className="text-right px-4 py-2 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {months.map((row) => (
                <tr key={row.label} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">{row.label}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {formatCurrency(row.cogs)}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {formatCurrency(row.expenses)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      row.margin < 0 ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {formatCurrency(row.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
