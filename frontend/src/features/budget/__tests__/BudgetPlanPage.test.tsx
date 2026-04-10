import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BudgetPlanPage from "../BudgetPlanPage";
import { renderWithProviders } from "@/test/test-utils";
import { useBudgetPlans } from "../hooks";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSettings } from "@/features/settings/hooks";

import type { BudgetCategory } from "@/shared/types";
import type { BudgetPlan } from "../types";

vi.mock("../hooks");
vi.mock("@/shared/hooks/useCategories");
vi.mock("@/features/settings/hooks");

const mockCategories: BudgetCategory[] = [
  { id: "c1", name: "Salary", type: "Income", group: "Employment", order: 0 },
  { id: "c2", name: "Rent", type: "Expenses", group: "Housing", order: 0 },
];

const mockPlans: BudgetPlan[] = [
  { categoryId: "c1", year: 2026, months: { 1: 4000, 2: 4000 } },
  { categoryId: "c2", year: 2026, months: { 1: 1200, 2: 1200 } },
];

const mockBudgetPlans = (data: BudgetPlan[]) => {
  vi.mocked(useBudgetPlans).mockReturnValue({
    data,
    isLoading: false,
  } as unknown as ReturnType<typeof useBudgetPlans>);
};

describe("BudgetPlanPage", () => {
  beforeEach(() => {
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "£" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    mockBudgetPlans(mockPlans);
  });

  it("renders the year in the header", () => {
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
  });

  it("displays Allocations header", () => {
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getByText("Allocations")).toBeInTheDocument();
  });

  it("shows Remaining row", () => {
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getByText("Remaining")).toBeInTheDocument();
  });

  it("renders category rows from BudgetSection", () => {
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
  });

  it("computes remaining values (income - expenses) in Remaining row", () => {
    renderWithProviders(<BudgetPlanPage />);
    // Month 1 & 2: 4000 - 1200 = 2800 each
    const cells = screen.getAllByText("£2,800.00");
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("shows '—' when there are no values", () => {
    mockBudgetPlans([]);
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("displays Liabilities label for Debt type", () => {
    const catsWithDebt: BudgetCategory[] = [
      ...mockCategories,
      { id: "c3", name: "Loan", type: "Debt", group: "Loans", order: 0 },
    ];
    vi.mocked(useCategories).mockReturnValue({
      data: catsWithDebt,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getByText("Liabilities")).toBeInTheDocument();
  });

  it("navigates year with arrow buttons", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetPlanPage />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(currentYear.toString())).toBeInTheDocument();

    // Click right arrow to go to next year
    const buttons = screen.getAllByRole("button");
    const rightArrow = buttons[1]; // second button is right arrow
    await user.click(rightArrow);
    expect(screen.getByText((currentYear + 1).toString())).toBeInTheDocument();
  });
});
