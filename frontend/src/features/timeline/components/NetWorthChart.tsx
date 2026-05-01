import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import type { NetWorthItem, NetWorthValue } from '@/features/net-worth/types';

interface Props {
  items: NetWorthItem[];
  values: NetWorthValue[];
  currency: string;
}

interface DataPoint {
  label: string;
  assets: number;
  liabilities: number;
  netWorth: number;
  sortKey: number;
}

function buildChartData(items: NetWorthItem[], values: NetWorthValue[]): DataPoint[] {
  const assetIds = new Set(items.filter(i => i.type === 'Asset').map(i => i.id));
  const liabilityIds = new Set(items.filter(i => i.type === 'Liability').map(i => i.id));

  const assetsMap = new Map<number, number>();
  const liabilitiesMap = new Map<number, number>();

  for (const v of values) {
    const isAsset = assetIds.has(v.itemId);
    const isLiability = liabilityIds.has(v.itemId);
    if (!isAsset && !isLiability) continue;
    const map = isAsset ? assetsMap : liabilitiesMap;
    for (const [monthStr, amount] of Object.entries(v.months)) {
      const month = parseInt(monthStr, 10);
      const key = v.year * 100 + month;
      map.set(key, (map.get(key) ?? 0) + (amount as number));
    }
  }

  const allKeys = new Set([...assetsMap.keys(), ...liabilitiesMap.keys()]);

  return Array.from(allKeys)
    .sort((a, b) => a - b)
    .map(key => {
      const year = Math.floor(key / 100);
      const month = key % 100;
      const date = new Date(year, month - 1, 1);
      const assets = assetsMap.get(key) ?? 0;
      const liabilities = liabilitiesMap.get(key) ?? 0;
      return {
        label: format(date, 'MMM yy'),
        assets,
        liabilities,
        netWorth: assets - liabilities,
        sortKey: key,
      };
    });
}

function fmtY(v: number, currency: string) {
  if (Math.abs(v) >= 1_000_000) return `${currency}${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${currency}${Math.round(v / 1_000)}k`;
  return `${currency}${v}`;
}

function fmtFull(v: number, currency: string) {
  return `${currency}${new Intl.NumberFormat('en-GB').format(Math.round(v))}`;
}

interface TooltipEntry { name: string; value: number; }
interface TooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; currency: string; }

function CustomTooltip({ active, payload, label, currency }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const order = ['Assets', 'Net Worth', 'Liabilities'];
  const sorted = [...payload].sort(
    (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
  );

  const dotColor: Record<string, string> = {
    Assets: '#10b981',
    Liabilities: '#ec4899',
    'Net Worth': '#6c5ce7',
  };

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-md min-w-[140px]">
      <p className="font-display text-xs font-bold text-foreground mb-1.5">{label}</p>
      {sorted.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: dotColor[entry.name] ?? '#999' }} />
            <span className="text-[11px] text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-[11px] font-semibold text-foreground">{fmtFull(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

export function NetWorthChart({ items, values, currency }: Props) {
  const data = useMemo(() => buildChartData(items, values), [items, values]);

  if (data.length < 2) return null;

  const latest = data[data.length - 1];
  const earliest = data[0];
  const gain = latest.netWorth - earliest.netWorth;
  const gainPct = earliest.netWorth !== 0
    ? ((gain / Math.abs(earliest.netWorth)) * 100).toFixed(1)
    : null;

  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 pt-4 pb-2">
      {/* Summary strip */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Net Worth</p>
          <p className="mt-0.5 font-sans text-xl font-bold text-foreground">{fmtFull(latest.netWorth, currency)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Since {earliest.label}</p>
          <p className={`mt-0.5 font-sans text-base font-bold ${gain >= 0 ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
            {gain >= 0 ? '+' : ''}{fmtFull(gain, currency)}
          </p>
          {gainPct !== null && (
            <p className={`text-[11px] font-medium ${gain >= 0 ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
              {gain >= 0 ? '↑' : '↓'} {gainPct}% total
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-2 flex gap-4">
        {[
          { label: 'Assets', color: '#10b981' },
          { label: 'Liabilities', color: '#ec4899' },
          { label: 'Net Worth', color: '#6c5ce7' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLiabilities" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.22} />
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
              tick={{ fontSize: 10, fill: '#7a849e' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => fmtY(v, currency)}
              width={42}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ stroke: '#6c5ce7', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="assets"
              name="Assets"
              stroke="#10b981"
              strokeWidth={1.5}
              fill="url(#gradAssets)"
              dot={false}
              activeDot={{ r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="liabilities"
              name="Liabilities"
              stroke="#ec4899"
              strokeWidth={1.5}
              fill="url(#gradLiabilities)"
              dot={false}
              activeDot={{ r: 4, fill: '#fff', stroke: '#ec4899', strokeWidth: 2 }}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#6c5ce7"
              strokeWidth={2.5}
              fill="url(#gradNetWorth)"
              dot={false}
              activeDot={{ r: 5, fill: '#fff', stroke: '#6c5ce7', strokeWidth: 2 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
