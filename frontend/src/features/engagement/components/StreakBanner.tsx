import { cn } from "@/lib/utils";
import type { InsightsData, RecentDay, StreakData } from "../types";
import { getTrackingCopy, getNoSpendCopy } from "../shameCopy";

interface Props {
  streak: StreakData;
  insights: InsightsData;
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

export function StreakBanner({ streak, insights }: Props) {
  const { tracking, noSpend } = streak;
  const todayDate = tracking.recentDays[tracking.recentDays.length - 1]?.date;

  const weeks: RecentDay[][] = [];
  for (let i = 0; i < tracking.recentDays.length; i += 7) {
    weeks.push(tracking.recentDays.slice(i, i + 7));
  }

  const trackingCopy = getTrackingCopy({
    currentStreak: tracking.currentStreak,
    todayStatus: tracking.todayStatus,
    longestStreak: tracking.longestStreak,
  });
  const noSpendCopy = getNoSpendCopy({
    currentStreak: noSpend.currentStreak,
    todayStatus: noSpend.todayStatus,
    longestStreak: noSpend.longestStreak,
  });

  const isLogged = tracking.todayStatus === "logged";
  const thisWeekDays = tracking.recentDays.slice(-7);
  const thisWeekLogged = thisWeekDays.filter((d) => d.logged).length;

  return (
    <div
      className="rounded-xl text-white overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #8b78f0 100%)" }}
    >
      {/* ── Mobile: greeting row ── */}
      <div className="md:hidden flex items-center gap-3 px-4 pt-4 pb-3" style={{ background: "rgba(255,255,255,0.12)" }}>
        <img
          src="/streak.png"
          alt=""
          aria-hidden="true"
          className="h-14 w-auto object-contain drop-shadow-lg flex-shrink-0"
        />
        <div>
          <p className="text-[15px] font-bold text-white">{getGreeting()} 👋</p>
          <p className="text-[12px] text-white/55 mt-0.5">Here's your streak</p>
        </div>
      </div>

      {/* ── Main row ── */}
      <div className="flex items-stretch">

        {/* Desktop only: mascot column */}
        <div
          className="hidden md:flex flex-col items-center justify-center flex-shrink-0 w-[180px] py-4 px-4"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <p className="text-[14px] font-bold text-white mb-3 whitespace-nowrap">{getGreeting()} 👋</p>
          <img
            src="/streak.png"
            alt=""
            aria-hidden="true"
            className="w-full h-auto object-contain object-bottom drop-shadow-xl"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Top: streak data */}
          <div className="flex items-start gap-5 p-5 pb-3">

            {/* Number block */}
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
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-white/20 hidden md:block mx-1" />

            {/* Weekly progress + stats */}
            <div className="hidden md:flex flex-col justify-between gap-3 self-stretch min-w-0">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                  This week
                </div>
<p className="text-[15px] font-bold text-white leading-snug">
                  {thisWeekLogged} / 7 days logged
                </p>
                {trackingCopy.subline && (
                  <p className="text-xs text-white/55 mt-1.5 leading-snug">
                    {trackingCopy.subline}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] text-white/45 mb-1">Best ever</div>
                  <div className="font-amount text-[17px] font-bold leading-none whitespace-nowrap">
                    {tracking.longestStreak} days
                  </div>
                </div>
                <div className="w-px h-7 bg-white/20" />
                <div>
                  <div className="text-[11px] text-white/45 mb-1">Today</div>
                  <span
                    className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap",
                      isLogged
                        ? "bg-emerald-400/30 text-emerald-100 ring-1 ring-emerald-400/40"
                        : "bg-white/15 text-white/65"
                    )}
                  >
                    {isLogged ? "✓ Done today" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: no-spend */}
          <div className="px-5 pb-5">
            <div
              className="w-full md:w-auto md:max-w-[65%] rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(0,0,0,0.30)" }}
            >
              <span className="text-lg leading-none select-none flex-shrink-0">💸</span>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/80 leading-snug">
                  No-spend challenge
                  <span className="font-normal text-white/55"> · {noSpendCopy.status}</span>
                </p>
                {noSpendCopy.challenge && (
                  <p className="text-[11px] text-white/50 mt-1 leading-snug">
                    {noSpendCopy.challenge}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="font-amount leading-none">
                  <span className="text-[24px] font-bold text-white/85">{noSpend.currentStreak}</span>
                  <span className="text-[11px] font-semibold text-white/50 ml-0.5">days</span>
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  best {noSpend.longestStreak}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
