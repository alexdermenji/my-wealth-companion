import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import BudgetPlanPage from "../BudgetPlanPage";
import { renderWithProviders } from "@/test/test-utils";
import { useBudgetPlans } from "../hooks";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSettings } from "@/features/settings/hooks";
import { useDashboardSummary } from "@/features/dashboard/hooks";

import type { BudgetCategory } from "@/shared/types";
import type { BudgetPlan } from "../types";

vi.mock("../hooks");
vi.mock("@/shared/hooks/useCategories");
vi.mock("@/features/settings/hooks");
vi.mock("@/features/dashboard/hooks");

const mockCategories: BudgetCategory[] = [
  { id: "c1", name: "Salary", type: "Income", group: "Employment", order: 0 },
  { id: "c2", name: "Rent", type: "Expenses", group: "Housing", order: 0 },
];

const mockPlans: BudgetPlan[] = [
  { categoryId: "c1", year: 2026, months: { 1: 4000, 2: 4000 } },
  { categoryId: "c2", year: 2026, months: { 1: 1200, 2: 1200 } },
];

const mockSummary = {
  year: 2026,
  month: 4,
  breakdown: [
    {
      type: "Income",
      totalTracked: 3500,
      totalBudget: 4000,
      items: [{ categoryId: "c1", categoryName: "Salary", group: "Employment", tracked: 3500, budget: 4000, percentage: 87 }],
    },
    {
      type: "Expenses",
      totalTracked: 900,
      totalBudget: 1200,
      items: [{ categoryId: "c2", categoryName: "Rent", group: "Housing", tracked: 900, budget: 1200, percentage: 75 }],
    },
    { type: "Savings", totalTracked: 0, totalBudget: 500, items: [] },
    { type: "Debt", totalTracked: 0, totalBudget: 300, items: [] },
  ],
};

function setupMocks(budgetPlansData: BudgetPlan[] = mockPlans) {
  vi.mocked(useSettings).mockReturnValue({
    data: { startYear: 2026, startMonth: 1, currency: "£" },
    isLoading: false,
  } as ReturnType<typeof useSettings>);
  vi.mocked(useCategories).mockReturnValue({
    data: mockCategories,
    isLoading: false,
  } as ReturnType<typeof useCategories>);
  vi.mocked(useBudgetPlans).mockReturnValue({
    data: budgetPlansData,
    isLoading: false,
  } as unknown as ReturnType<typeof useBudgetPlans>);
  vi.mocked(useDashboardSummary).mockReturnValue({
    data: mockSummary,
    isLoading: false,
  } as ReturnType<typeof useDashboardSummary>);
}

describe("BudgetPlanPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
    setupMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Slice 1: tab bar renders, Overview is default ──────────────────
  describe("tab navigation", () => {
    it("renders Overview and Edit Budget tabs", () => {
      renderWithProviders(<BudgetPlanPage />);
      expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /edit budget/i })).toBeInTheDocument();
    });

    it("defaults to Overview tab", () => {
      renderWithProviders(<BudgetPlanPage />);
      expect(screen.getByRole("tab", { name: /overview/i })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: /edit budget/i })).toHaveAttribute("aria-selected", "false");
    });

    // ── Slice 2: Overview tab shows dashboard summary ─────────────────
    it("Overview tab shows budget type sections from the summary", () => {
      renderWithProviders(<BudgetPlanPage />);
      expect(screen.getAllByRole("button", { name: /income/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole("button", { name: /expenses/i }).length).toBeGreaterThanOrEqual(1);
    });

    // ── Slice 3: Edit tab shows grid, switching hides/shows ───────────
    it("budget grid is not visible on the Overview tab", () => {
      renderWithProviders(<BudgetPlanPage />);
      expect(screen.queryByText("Allocations")).not.toBeInTheDocument();
    });

    it("clicking Edit Budget tab shows the budget grid", () => {
      renderWithProviders(<BudgetPlanPage />);
      fireEvent.click(screen.getByRole("tab", { name: /edit budget/i }));
      expect(screen.getByText("Allocations")).toBeInTheDocument();
      expect(screen.getByText("Salary")).toBeInTheDocument();
    });

    it("clicking back to Overview tab hides the budget grid", () => {
      renderWithProviders(<BudgetPlanPage />);
      fireEvent.click(screen.getByRole("tab", { name: /edit budget/i }));
      fireEvent.click(screen.getByRole("tab", { name: /overview/i }));
      expect(screen.queryByText("Allocations")).not.toBeInTheDocument();
    });
  });

  // ── Edit Budget tab: existing grid behaviour ───────────────────────
  describe("Edit Budget tab — grid", () => {
    function switchToEdit() {
      renderWithProviders(<BudgetPlanPage />);
      fireEvent.click(screen.getByRole("tab", { name: /edit budget/i }));
    }

    it("renders the year in the year pill", () => {
      switchToEdit();
      expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
    });

    it("displays Allocations header", () => {
      switchToEdit();
      expect(screen.getByText("Allocations")).toBeInTheDocument();
    });

    it("shows Remaining row", () => {
      switchToEdit();
      expect(screen.getByText("Remaining")).toBeInTheDocument();
    });

    it("renders category rows from BudgetSection", () => {
      switchToEdit();
      expect(screen.getByText("Salary")).toBeInTheDocument();
      expect(screen.getByText("Rent")).toBeInTheDocument();
    });

    it("computes remaining values (income - expenses) in Remaining row", () => {
      switchToEdit();
      // Month 1 & 2: 4000 - 1200 = 2800 each
      const cells = screen.getAllByText("£2,800.00");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows '—' when there are no values", () => {
      setupMocks([]);
      switchToEdit();
      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("displays Liabilities label for Debt type", () => {
      vi.mocked(useCategories).mockReturnValue({
        data: [...mockCategories, { id: "c3", name: "Loan", type: "Debt", group: "Loans", order: 0 }],
        isLoading: false,
      } as ReturnType<typeof useCategories>);
      switchToEdit();
      expect(screen.getByText("Liabilities")).toBeInTheDocument();
    });

    it("shows a year dropdown on the Edit tab", () => {
      switchToEdit();
      const comboboxes = screen.getAllByRole("combobox");
      const yearSelect = comboboxes.find(cb => cb.textContent?.includes("2026"));
      expect(yearSelect).toBeTruthy();
    });

    it("highlights the current month for the current year", () => {
      const { container } = renderWithProviders(<BudgetPlanPage />);
      fireEvent.click(screen.getByRole("tab", { name: /edit budget/i }));

      expect(container.querySelectorAll('[data-current-month="true"]').length).toBeGreaterThan(0);
      expect(screen.getAllByText("Apr")[0].closest('[data-current-month="true"]')).not.toBeNull();
      expect(container.querySelector('[data-current-month="true"]')).toHaveTextContent(/Apr|£2,800.00/);
    });
  });
});
