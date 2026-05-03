import { useState } from "react";
import type { TaskData } from "../types";

interface Props {
  daysSince: number;
  tasks: TaskData;
}

export function WhatYouMissedBanner({ daysSince, tasks }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const bullets: string[] = [];

  if (daysSince >= 2) {
    bullets.push(`${daysSince} day${daysSince === 1 ? "" : "s"} without logged transactions`);
  }
  if (tasks.overBudgetCategories.length > 0) {
    const names = tasks.overBudgetCategories.map((c) => c.name).join(", ");
    bullets.push(`${names} went over budget`);
  }
  if (!tasks.currentMonthNetWorthFilled) {
    bullets.push("This month's net worth hasn't been updated");
  }

  if (bullets.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/8 px-4 py-3 flex items-start gap-3">
      <span className="text-xl leading-none flex-shrink-0 mt-0.5" aria-hidden>👀</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-warning-foreground" style={{ color: "hsl(32 95% 35%)" }}>
          You've been away for {daysSince} day{daysSince === 1 ? "" : "s"}
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(32 80% 45%)" }}>
          {bullets.join(" · ")}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0 px-1 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
