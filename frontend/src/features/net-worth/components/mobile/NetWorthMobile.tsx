import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MONTHS } from '@/shared/types';
import type { NetWorthItem, NetWorthType, NetWorthValue } from '../../types';
import { NetWorthSectionMobile } from './NetWorthSectionMobile';

interface NetWorthMobileProps {
  year: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  items: NetWorthItem[];
  values: NetWorthValue[];
  totalsByType: Record<NetWorthType, number[]>;
  netWorthByMonth: number[];
  onAmountChange: (itemId: string, month: number, value: string) => void;
  existingGroups: string[];
  currency: string;
  currentMonth?: number | null;
}

const NET_WORTH_TYPES: NetWorthType[] = ['Asset', 'Liability'];
const ARC_LEN = 141;

function formatAmount(value: number, currency: string) {
  if (value === 0) return '—';
  return `${value < 0 ? '-' : ''}${currency}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))}`;
}

function formatCompactAmount(value: number, currency: string) {
  if (value === 0) return `${currency}0`;
  return `${value < 0 ? '-' : ''}${currency}${new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(value))}`;
}

export function NetWorthMobile({
  year,
  selectedMonth,
  onMonthChange,
  items,
  values,
  totalsByType,
  netWorthByMonth,
  onAmountChange,
  existingGroups,
  currency,
  currentMonth = null,
}: NetWorthMobileProps) {
  const [selectedType, setSelectedType] = useState<NetWorthType>('Asset');

  const assets = totalsByType.Asset[selectedMonth - 1] ?? 0;
  const liabilities = totalsByType.Liability[selectedMonth - 1] ?? 0;
  const netWorth = netWorthByMonth[selectedMonth - 1] ?? 0;

  const monthDelta = useMemo(() => {
    if (selectedMonth <= 1) return null;
    return netWorth - (netWorthByMonth[selectedMonth - 2] ?? 0);
  }, [netWorth, netWorthByMonth, selectedMonth]);

  const previousNetWorth = selectedMonth > 1 ? (netWorthByMonth[selectedMonth - 2] ?? 0) : null;
  const changePct = monthDelta !== null && previousNetWorth !== null && previousNetWorth !== 0
    ? Math.round((monthDelta / Math.abs(previousNetWorth)) * 1000) / 10
    : null;
  const gaugeFillPct = changePct === null ? (monthDelta === null ? 0 : 100) : Math.min(Math.abs(changePct), 100);
  const gaugeDashOffset = ARC_LEN - (gaugeFillPct / 100) * ARC_LEN;
  const gaugeColor = monthDelta === null
    ? 'rgba(255,255,255,0.25)'
    : monthDelta < 0
      ? '#f9a8d4'
      : changePct !== null && changePct >= 20
        ? '#fbbf24'
        : '#6ee7b7';
  const gaugeValue = changePct !== null
    ? `${changePct > 0 ? '+' : ''}${Math.round(changePct)}%`
    : monthDelta === null
      ? '—'
      : formatCompactAmount(monthDelta, currency);

  const deltaColor = monthDelta === null
    ? 'text-white/70'
    : monthDelta < 0
      ? 'text-[#f9a8d4]'
      : 'text-[#6ee7b7]';

  const netWorthColor = netWorth < 0 ? 'text-[#f9a8d4]' : 'text-white';

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto">
      <div
        className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-7 text-white mb-4 min-h-[228px]"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #8b78ff 60%, #a99ef8 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/[0.07]" />
          <div className="absolute -bottom-6 left-4 h-24 w-24 rounded-full bg-white/[0.05]" />
          <div className="absolute -bottom-3 right-4 h-20 w-28 rounded-t-[28px] bg-white/[0.12]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                Net Worth
              </p>
              <p className="font-display text-lg font-bold text-white">
                {MONTHS[selectedMonth - 1]} {year}
              </p>
            </div>
            <div className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-1.5 backdrop-blur-sm">
              <button
                onClick={() => onMonthChange(selectedMonth - 1)}
                disabled={selectedMonth <= 1}
                className="p-1 text-white/80 transition-colors hover:text-white disabled:opacity-30"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onMonthChange(selectedMonth + 1)}
                disabled={selectedMonth >= 12}
                className="p-1 text-white/80 transition-colors hover:text-white disabled:opacity-30"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center gap-4 mb-4 mt-4">
            <svg width="110" height="70" viewBox="0 0 110 70" className="flex-shrink-0">
              <path
                d="M 10 65 A 45 45 0 0 1 100 65"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {monthDelta !== null && (
                <path
                  d="M 10 65 A 45 45 0 0 1 100 65"
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ARC_LEN}
                  strokeDashoffset={gaugeDashOffset}
                />
              )}
              <text x="55" y="48" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" opacity="0.8">
                CHANGE
              </text>
              <text x="55" y="62" textAnchor="middle" fill="white" fontSize="14" fontWeight="800">
                {gaugeValue}
              </text>
            </svg>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-1 h-5 rounded-full flex-shrink-0 bg-[#6ee7b7]" />
                <span className="text-white/70 w-14 flex-shrink-0">Assets</span>
                <span className="font-amount text-white">{formatAmount(assets, currency)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-1 h-5 rounded-full flex-shrink-0 bg-[#f9a8d4]" />
                <span className="text-white/70 w-14 flex-shrink-0">Debt</span>
                <span className="font-amount text-white">{formatAmount(liabilities, currency)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-1 h-5 rounded-full flex-shrink-0 bg-white/60" />
                <span className="text-white/70 w-14 flex-shrink-0">Change</span>
                <span className={cn('font-amount flex items-center gap-1', deltaColor)}>
                  {monthDelta === null ? (
                    '—'
                  ) : (
                    <>
                      {monthDelta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {formatAmount(monthDelta, currency)}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="relative pt-3 border-t border-white/15 flex items-baseline justify-between">
            <span className="text-sm text-white/70">Net worth</span>
            <p
              className={cn('font-amount whitespace-nowrap font-extrabold leading-none tracking-tight', netWorthColor)}
              style={{ fontSize: 'clamp(20px, 6vw, 28px)' }}
            >
              {formatAmount(netWorth, currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 bg-card border border-border rounded-full p-1 shadow-sm mb-5">
        {NET_WORTH_TYPES.map(type => {
          const isActive = type === selectedType;
          const label = type === 'Asset' ? 'Assets' : 'Liabilities';
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                'flex-1 rounded-full px-2 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                isActive ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
              style={isActive ? { background: type === 'Asset' ? '#10b981' : '#ec4899' } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      <NetWorthSectionMobile
        type={selectedType}
        items={items}
        values={values}
        onAmountChange={onAmountChange}
        currency={currency}
        month={selectedMonth}
        existingGroups={existingGroups}
        currentMonth={currentMonth}
      />
    </div>
  );
}
