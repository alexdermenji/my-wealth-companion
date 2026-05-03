export function getTrackingCopy({
  currentStreak,
  todayStatus,
  longestStreak,
}: {
  currentStreak: number;
  todayStatus: string;
  longestStreak?: number;
}): { headline: string; subline?: string } {
  const daysToRecord =
    longestStreak && longestStreak > 0 && currentStreak < longestStreak
      ? longestStreak - currentStreak
      : null;
  const daysToSeven = currentStreak < 7 ? 7 - currentStreak : null;

  if (todayStatus === "logged") {
    const headline =
      currentStreak >= 7 ? `${currentStreak} days strong` : "Habit protected";

    const subline =
      daysToRecord && daysToRecord > 0
        ? `${daysToRecord} more day${daysToRecord > 1 ? "s" : ""} to beat your best`
        : daysToSeven && daysToSeven > 0
        ? `${daysToSeven} more day${daysToSeven > 1 ? "s" : ""} to reach a 7-day streak`
        : undefined;

    return { headline, subline };
  }

  if (currentStreak >= 7) {
    return {
      headline: `${currentStreak} days and counting`,
      subline:
        daysToRecord && daysToRecord > 0
          ? `${daysToRecord} more to beat your best — log today`
          : "Don't break the chain — log today",
    };
  }
  if (currentStreak >= 1) {
    return {
      headline: `${currentStreak}-day streak`,
      subline: daysToSeven
        ? `Log today — ${daysToSeven} more to reach a week`
        : "Log today to keep going",
    };
  }
  return {
    headline: "Start your streak",
    subline: "Log a transaction to begin",
  };
}

export function getNoSpendCopy({
  currentStreak,
  todayStatus,
  longestStreak,
}: {
  currentStreak: number;
  todayStatus: string;
  longestStreak?: number;
}): { status: string; challenge?: string } {
  if (todayStatus === "spent") {
    const challenge =
      longestStreak && longestStreak > 0
        ? `Next goal: beat your ${longestStreak}-day best`
        : "Try a 2-day no-spend streak";
    return {
      status: "Spent today — fresh start tomorrow",
      challenge,
    };
  }

  const status = "No spending today — great control";
  if (currentStreak >= 7)
    return { status, challenge: `${currentStreak} days — incredible discipline!` };
  const daysToSeven = 7 - currentStreak;
  if (currentStreak >= 3)
    return { status, challenge: `${daysToSeven} more day${daysToSeven > 1 ? "s" : ""} for a full week!` };
  if (currentStreak >= 1)
    return { status, challenge: "Next goal: 3 no-spend days" };
  return { status, challenge: "Next goal: 3 no-spend days" };
}
