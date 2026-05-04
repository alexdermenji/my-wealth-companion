import { useMemo } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, addMonths } from 'date-fns';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';

const PROJECTION_MONTHS = 12;
const DELTA_WINDOW = 6;

interface Props {
  items: NetWorthItem[];
  values: NetWorthValue[];
  currency: string;
  milestoneAmounts: number[];
}

interface DataPoint {
  label: string;
  actual: number | null;
  projected: number | null;
  sortKey: number;
}

function fmtY(v: number, currency: string) {
  if (Math.abs(v) >= 1_000_000) return `${currency}${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${currency}${Math.round(v / 1_000)}k`;
  return `${currency}${v}`;
}

function fmtFull(v: number, currency: string) {
  return `${currency}${new Intl.NumberFormat('en-GB').format(Math.round(v))}`;
}

interface TooltipEntry { name: string; value: number | null; dataKey: string; }
interface TooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; currency: string; }

function CustomTooltip({ active, payload, label, currency }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const entries = payload.filter(e => e.value !== null && e.value !== undefined);
  if (!entries.length) return null;

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-md min-w-[130px]">
      <p className="font-display text-xs font-bold text-foreground mb-1.5">{label}</p>
      {entries.map(e => (
        <div key={e.dataKey} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ background: e.dataKey === 'actual' ? '#6c5ce7' : '#7a849e' }}
            />
            <span className="text-[11px] text-muted-foreground">
              {e.dataKey === 'actual' ? 'Actual' : 'Projected'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-foreground">
            {fmtFull(e.value!, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

function buildData(items: NetWorthItem[], values: NetWorthValue[]) {
  const assetIds = new Set(items.filter(i => i.type === 'Asset').map(i => i.id));
  const liabilityIds = new Set(items.filter(i => i.type === 'Liability').map(i => i.id));

  const nwMap = new Map<number, number>();
  for (const v of values) {
    const isAsset = assetIds.has(v.itemId);
    const isLiability = liabilityIds.has(v.itemId);
    if (!isAsset && !isLiability) continue;
    const sign = isAsset ? 1 : -1;
    for (const [monthStr, amount] of Object.entries(v.months)) {
      const key = v.year * 100 + parseInt(monthStr, 10);
      nwMap.set(key, (nwMap.get(key) ?? 0) + sign * (amount as number));
    }
  }

  const sortedKeys = Array.from(nwMap.keys()).sort((a, b) => a - b);
  if (sortedKeys.length < 2) return null;

  const actual: DataPoint[] = sortedKeys.map(key => ({
    label: format(new Date(Math.floor(key / 100), (key % 100) - 1, 1), 'MMM yy'),
    actual: nwMap.get(key) ?? 0,
    projected: null,
    sortKey: key,
  }));

  // Compute avg delta from last DELTA_WINDOW months
  const window = actual.slice(-DELTA_WINDOW);
  const deltas = window.slice(1).map((p, i) => (p.actual ?? 0) - (window[i].actual ?? 0));
  const avgDelta = deltas.length > 0
    ? deltas.reduce((a, b) => a + b, 0) / deltas.length
    : 0;

  // Connect actual last point into the projected series
  actual[actual.length - 1] = {
    ...actual[actual.length - 1],
    projected: actual[actual.length - 1].actual,
  };

  // Generate projected points
  const lastKey = sortedKeys[sortedKeys.length - 1];
  const lastDate = new Date(Math.floor(lastKey / 100), (lastKey % 100) - 1, 1);
  let runningValue = actual[actual.length - 1].actual ?? 0;

  const projectedPoints: DataPoint[] = Array.from({ length: PROJECTION_MONTHS }, (_, i) => {
    const d = addMonths(lastDate, i + 1);
    runningValue += avgDelta;
    return {
      label: format(d, 'MMM yy'),
      actual: null,
      projected: Math.round(runningValue),
      sortKey: d.getFullYear() * 100 + (d.getMonth() + 1),
    };
  });

  return {
    points: [...actual, ...projectedPoints],
    latestNetWorth: actual[actual.length - 1].actual ?? 0,
    earliestNetWorth: actual[0].actual ?? 0,
    avgDelta,
  };
}

export function NetWorthProjectionChart({ items, values, currency, milestoneAmounts }: Props) {
  const result = useMemo(() => buildData(items, values), [items, values]);

  if (!result) return null;

  const { points, latestNetWorth, avgDelta } = result;

  // Y-axis domain
  const allValues = points.flatMap(p => [p.actual, p.projected]).filter((v): v is number => v !== null);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const range = dataMax - dataMin || dataMax * 0.1;

  // Only draw milestone lines that are visible in a reasonable Y range
  const yMax = dataMax + range * 0.2;
  const yMin = Math.max(0, dataMin - range * 0.1);
  const visibleMilestones = milestoneAmounts.filter(a => a >= yMin && a <= yMax * 1.3);

  // Expand yMax to include nearby milestones
  const extendedMax = visibleMilestones.length > 0
    ? Math.max(yMax, ...visibleMilestones) + range * 0.05
    : yMax;

  const tickInterval = Math.max(1, Math.floor(points.length / 8));

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 pt-4 pb-2">
      {/* Summary strip */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Net Worth</p>
          <p className="mt-0.5 font-sans text-xl font-bold text-foreground">
            {fmtFull(latestNetWorth, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Monthly trend</p>
          <p className={`mt-0.5 text-sm font-bold ${avgDelta >= 0 ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
            {avgDelta >= 0 ? '+' : ''}{fmtFull(avgDelta, currency)}/mo
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-2 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: '#6c5ce7' }} />
          <span className="text-[11px] text-muted-foreground">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 20, borderTop: '2px dashed #7a849e', flexShrink: 0, marginTop: 1 }} />
          <span className="text-[11px] text-muted-foreground">Projected trend</span>
        </div>
        {visibleMilestones.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: '#f59e0b' }} />
            <span className="text-[11px] text-muted-foreground">Milestones</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 56, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradProjActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#7a849e' }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={[yMin, extendedMax]}
              tick={{ fontSize: 10, fill: '#7a849e' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => fmtY(v, currency)}
              width={42}
              tickCount={4}
            />

            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ stroke: '#6c5ce7', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            {visibleMilestones.map(amount => (
              <ReferenceLine
                key={amount}
                y={amount}
                stroke="rgba(245,158,11,0.6)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{
                  value: fmtY(amount, currency),
                  position: 'right',
                  fill: '#b45309',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ))}

            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#6c5ce7"
              strokeWidth={2.5}
              fill="url(#gradProjActual)"
              dot={false}
              activeDot={{ r: 5, fill: '#fff', stroke: '#6c5ce7', strokeWidth: 2 }}
              connectNulls={false}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="projected"
              name="Projected"
              stroke="#7a849e"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: '#fff', stroke: '#7a849e', strokeWidth: 2 }}
              connectNulls={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
