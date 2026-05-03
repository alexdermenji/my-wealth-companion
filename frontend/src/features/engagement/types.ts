export interface RecentDay {
  date: string;
  logged: boolean;
}

export interface TrackingStreak {
  currentStreak: number;
  longestStreak: number;
  todayStatus: "logged" | "pending";
  recentDays: RecentDay[];
}

export interface NoSpendStreak {
  currentStreak: number;
  longestStreak: number;
  todayStatus: "no-spend" | "spent";
}

export interface StreakData {
  tracking: TrackingStreak;
  noSpend: NoSpendStreak;
}

export interface OverBudgetCategory {
  name: string;
  overspend: number;
}

export interface TaskData {
  daysSinceLastTransaction: number | null;
  overBudgetCategories: OverBudgetCategory[];
  nextMonthBudgetFilled: boolean;
  currentMonthNetWorthFilled: boolean;
}

export interface InsightsData {
  weeklyTrackedTotal: number;
  avgDailySpend: number;
}

export interface EngagementSummary {
  streak: StreakData;
  tasks: TaskData;
  insights: InsightsData;
}

export type TaskStatus = "pending" | "done";

export type TaskSeverity = "danger" | "warning" | "ok";

export interface EngagementTask {
  id: "transactions" | "over-budget" | "next-budget" | "net-worth";
  status: TaskStatus;
  severity: TaskSeverity;
  title: string;
  copy: string;
}
