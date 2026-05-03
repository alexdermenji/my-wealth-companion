import { describe, it, expect } from "vitest";
import { buildTaskList } from "../taskOrdering";
import type { TaskData } from "../types";

const base: TaskData = {
  daysSinceLastTransaction: 0,
  overBudgetCategories: [],
  nextMonthBudgetFilled: true,
  currentMonthNetWorthFilled: true,
};

describe("buildTaskList", () => {
  it("returns all-done state when everything is up to date", () => {
    const tasks = buildTaskList(base);
    expect(tasks.every((t) => t.status === "done")).toBe(true);
  });

  it("transactions task is always first", () => {
    const tasks = buildTaskList({ ...base, daysSinceLastTransaction: 5 });
    expect(tasks[0].id).toBe("transactions");
  });

  it("marks transactions task danger when 4+ days overdue", () => {
    const tasks = buildTaskList({ ...base, daysSinceLastTransaction: 4 });
    const tx = tasks.find((t) => t.id === "transactions")!;
    expect(tx.severity).toBe("danger");
    expect(tx.status).toBe("pending");
  });

  it("marks transactions task warning when 1–3 days overdue", () => {
    const tasks = buildTaskList({ ...base, daysSinceLastTransaction: 2 });
    const tx = tasks.find((t) => t.id === "transactions")!;
    expect(tx.severity).toBe("warning");
    expect(tx.status).toBe("pending");
  });

  it("marks transactions task done when logged today (0 days)", () => {
    const tasks = buildTaskList({ ...base, daysSinceLastTransaction: 0 });
    const tx = tasks.find((t) => t.id === "transactions")!;
    expect(tx.status).toBe("done");
  });

  it("marks transactions task done when no transactions ever and user is new", () => {
    const tasks = buildTaskList({ ...base, daysSinceLastTransaction: null });
    const tx = tasks.find((t) => t.id === "transactions")!;
    expect(tx.status).toBe("pending");
    expect(tx.severity).toBe("warning");
  });

  it("over-budget task is second and pending when categories exist", () => {
    const tasks = buildTaskList({
      ...base,
      overBudgetCategories: [{ name: "Dining Out", overspend: 84 }],
    });
    expect(tasks[1].id).toBe("over-budget");
    expect(tasks[1].status).toBe("pending");
    expect(tasks[1].severity).toBe("danger");
  });

  it("over-budget task is done when no categories are over", () => {
    const tasks = buildTaskList({ ...base, overBudgetCategories: [] });
    const ob = tasks.find((t) => t.id === "over-budget")!;
    expect(ob.status).toBe("done");
  });

  it("next-budget task is pending when next month budget not filled", () => {
    const tasks = buildTaskList({ ...base, nextMonthBudgetFilled: false });
    const nb = tasks.find((t) => t.id === "next-budget")!;
    expect(nb.status).toBe("pending");
    expect(nb.severity).toBe("warning");
  });

  it("net-worth task is pending when current month not filled", () => {
    const tasks = buildTaskList({ ...base, currentMonthNetWorthFilled: false });
    const nw = tasks.find((t) => t.id === "net-worth")!;
    expect(nw.status).toBe("pending");
    expect(nw.severity).toBe("warning");
  });

  it("always returns exactly 4 tasks", () => {
    expect(buildTaskList(base)).toHaveLength(4);
    expect(buildTaskList({ ...base, daysSinceLastTransaction: 10 })).toHaveLength(4);
  });

  it("order is always: transactions, over-budget, next-budget, net-worth", () => {
    const ids = buildTaskList(base).map((t) => t.id);
    expect(ids).toEqual(["transactions", "over-budget", "next-budget", "net-worth"]);
  });
});
