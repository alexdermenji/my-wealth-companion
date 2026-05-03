import type { EngagementTask, TaskData } from "./types";

export function buildTaskList(tasks: TaskData): EngagementTask[] {
  return [
    buildTransactionsTask(tasks.daysSinceLastTransaction),
    buildOverBudgetTask(tasks.overBudgetCategories),
    buildNextBudgetTask(tasks.nextMonthBudgetFilled),
    buildNetWorthTask(tasks.currentMonthNetWorthFilled),
  ];
}

function buildTransactionsTask(
  daysSince: number | null
): EngagementTask {
  if (daysSince === 0) {
    return { id: "transactions", status: "done", severity: "ok", title: "Log your transactions", copy: "All caught up today." };
  }
  if (daysSince === null) {
    return { id: "transactions", status: "pending", severity: "warning", title: "Log your transactions", copy: "No transactions yet. Add your first one to get started." };
  }
  if (daysSince >= 4) {
    return { id: "transactions", status: "pending", severity: "danger", title: "Log your transactions", copy: `You haven't logged a transaction in ${daysSince} days. Your budget is flying blind.` };
  }
  return { id: "transactions", status: "pending", severity: "warning", title: "Log your transactions", copy: `You're ${daysSince} day${daysSince === 1 ? "" : "s"} behind on transactions.` };
}

function buildOverBudgetTask(
  categories: TaskData["overBudgetCategories"]
): EngagementTask {
  if (categories.length === 0) {
    return { id: "over-budget", status: "done", severity: "ok", title: "Budget categories", copy: "All categories within budget." };
  }
  const names = categories.map((c) => c.name).join(" · ");
  return { id: "over-budget", status: "pending", severity: "danger", title: `${categories.length} ${categories.length === 1 ? "category" : "categories"} over budget`, copy: names };
}

function buildNextBudgetTask(filled: boolean): EngagementTask {
  if (filled) {
    return { id: "next-budget", status: "done", severity: "ok", title: "Next month budget", copy: "Next month is planned." };
  }
  return { id: "next-budget", status: "pending", severity: "warning", title: "Plan next month's budget", copy: "Get your budget set before the month begins." };
}

function buildNetWorthTask(filled: boolean): EngagementTask {
  if (filled) {
    return { id: "net-worth", status: "done", severity: "ok", title: "Net worth", copy: "This month's net worth is up to date." };
  }
  return { id: "net-worth", status: "pending", severity: "warning", title: "Update net worth", copy: "You haven't updated your net worth this month." };
}
