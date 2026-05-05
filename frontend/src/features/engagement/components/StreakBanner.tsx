import { cn } from "@/lib/utils";
import type { RecentDay, StreakData } from "../types";
import { CheckInWidget } from "./CheckInWidget";
import { useCheckIn } from "../hooks";
import { useDashboardSummary } from "@/features/dashboard/hooks";
import { useSettings } from "@/features/settings/hooks";
import { Plus } from "lucide-react";

interface Props {
  streak: StreakData;
  onSpentSelected: () => void;
}

const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
function getDayLetter(dateStr: string) {
  return DAY_LETTER[new Date(dateStr).getDay()];
}

function ActivitySquare({ day, isToday }: { day: RecentDay; isToday: boolean }) {
  return (
    <div
      title={`${day.date} — ${day.logged ? "Logged" : "No activity"}`}
      className={cn(
        "w-[15px] h-[15px] rounded transition-colors",
        isToday && "ring-2 ring-white ring-offset-[2px] ring-offset-transparent",
        day.logged ? "bg-emerald-400" : "bg-white/10"
      )}
    />
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const MONTH_METRICS = [
  { key: "Income",   color: "#6ee7b7" },
  { key: "Expenses", color: "#f9a8d4" },
  { key: "Debt",     color: "#38bdf8" },
] as const;

export function StreakBanner({ streak, onSpentSelected }: Props) {
  const { tracking } = streak;
  const { mutate: checkIn } = useCheckIn();

  const now = new Date();
  const { data: summary }  = useDashboardSummary(now.getFullYear(), now.getMonth() + 1);
  const { data: settings } = useSettings();
  const currency = settings?.currency ?? "$";
  const fmt = (v: number) =>
    `${currency}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  const income   = summary?.breakdown.find(b => b.type === "Income");
  const expenses = summary?.breakdown.find(b => b.type === "Expenses");
  const debt     = summary?.breakdown.find(b => b.type === "Debt");
  const net = (income?.totalTracked ?? 0) - (expenses?.totalTracked ?? 0) - (debt?.totalTracked ?? 0);

  const todayDate = tracking.recentDays[tracking.recentDays.length - 1]?.date;
  const weeks: RecentDay[][] = [];
  for (let i = 0; i < tracking.recentDays.length; i += 7) {
    weeks.push(tracking.recentDays.slice(i, i + 7));
  }

  const showCheckIn = tracking.todayStatus === "pending";

  const monthlyValues: Record<string, number> = {
    Income:   income?.totalTracked   ?? 0,
    Expenses: expenses?.totalTracked ?? 0,
    Debt:     debt?.totalTracked     ?? 0,
  };

  return (
    <div
      className="rounded-2xl text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #8b78ff 60%, #a99ef8 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/[0.07]" />
      <div className="pointer-events-none absolute -bottom-6 left-4 w-24 h-24 rounded-full bg-white/[0.05]" />

      {/* ── Main row ── */}
      <div className="flex items-stretch relative">

        {/* Desktop: mascot column */}
        <div
          className="hidden md:flex flex-col items-center justify-center flex-shrink-0 w-[180px] py-4 px-4"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <p className="mb-3 max-w-full truncate text-center text-[15px] font-bold text-white">
            {getGreeting()} 👋
          </p>
          <img src="/streak.png" alt="" aria-hidden="true" className="w-full h-auto object-contain object-bottom drop-shadow-xl" />
        </div>

        {/* Streak content */}
        <div className="flex-1 min-w-0 flex flex-col">

          <div className="flex items-start gap-5 p-5 pb-3">

            {/* Streak number */}
            <div className="flex-shrink-0">
              <div className="font-amount text-[42px] font-bold leading-none tracking-tight">
                {tracking.currentStreak}
              </div>
              <div className="text-sm font-semibold text-white/75 mt-1.5 leading-none whitespace-nowrap">
                day{tracking.currentStreak !== 1 ? "s" : ""} in a row
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mt-1.5">
                Tracking streak
              </div>
            </div>

            {/* Activity grid */}
            <div className="flex-shrink-0 mt-0.5">
              {weeks[0] && (
                <div className="flex gap-[4px] mb-[4px]">
                  {weeks[0].map((d) => (
                    <div key={d.date} className="w-[15px] text-center text-[9px] font-bold text-white/35">
                      {getDayLetter(d.date)}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-[4px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex gap-[4px]">
                    {week.map((day) => (
                      <ActivitySquare key={day.date} day={day} isToday={day.date === todayDate} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-white/45">
                  <div className="w-[10px] h-[10px] rounded bg-emerald-400" />
                  logged
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-white/45">
                  <div className="w-[10px] h-[10px] rounded bg-white/10" />
                  missed
                </span>
              </div>

              {!showCheckIn && (
                <button
                  type="button"
                  onClick={onSpentSelected}
                  className="mt-3 hidden h-8 items-center gap-1.5 rounded-lg bg-white/[0.12] px-3 text-xs font-semibold text-white/90 ring-1 ring-white/20 transition-colors hover:bg-white/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:inline-flex"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add transaction
                </button>
              )}
            </div>
          </div>

          {/* Mobile: mascot + monthly stats */}
          <div className="md:hidden px-5 pb-4">
            <div className="border-t border-white/15">
              <div className="flex items-center gap-4">
                <img src="/streak.png" alt="" aria-hidden="true" className="h-[130px] w-[130px] -translate-x-5 object-contain drop-shadow-xl flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">This month</p>
                  {MONTH_METRICS.map(({ key, color }) => (
                    <div key={key} className="flex items-center gap-2 text-xs font-semibold">
                      <span className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-white/70 w-14 flex-shrink-0">{key}</span>
                      <span className="font-amount">{fmt(monthlyValues[key])}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-baseline justify-end gap-4 pt-3 mt-3 border-t border-white/10">
                <span className="text-[11px] text-white/50 flex-shrink-0">Net</span>
                <span
                  className="font-amount font-bold leading-none whitespace-nowrap text-right"
                  style={{ color: net >= 0 ? "#6ee7b7" : "#ffffff", fontSize: "clamp(18px, 5vw, 20px)" }}
                >
                  {net >= 0 ? "" : "-"}{fmt(net)}
                </span>
              </div>
            </div>
          </div>

          {/* Check-in widget */}
          {showCheckIn && (
            <CheckInWidget
              onSpent={onSpentSelected}
              onNoSpend={() => checkIn("no_spend")}
            />
          )}

        </div>

        {/* Desktop: monthly stats column */}
        <div className="hidden md:flex w-px self-stretch bg-white/20 mx-1 flex-shrink-0" />
        <div className="hidden md:flex flex-col justify-center gap-0 flex-shrink-0 px-5 py-5 w-[280px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">This month</p>
          <div className="space-y-2.5">
            {MONTH_METRICS.map(({ key, color }) => (
              <div key={key} className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-white/70 w-14 flex-shrink-0">{key}</span>
                <span className="font-amount">{fmt(monthlyValues[key])}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 border-t border-white/15 mt-3 pt-3">
            <span className="w-1 flex-shrink-0" />
            <span className="text-xs text-white/60 w-14 flex-shrink-0 pt-0.5">Net</span>
            <span
              className="font-amount font-extrabold tracking-tight text-lg leading-none"
              style={{ color: net >= 0 ? "#6ee7b7" : "#ffffff" }}
            >
              {net >= 0 ? "" : "-"}{fmt(net)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
