import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
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
  { id: "c1", name: "Salary", type: "Income", group: "Employment", groupEmoji: "💼" },
  { id: "c2", name: "Rent", type: "Expenses", group: "Housing", groupEmoji: "🏠" },
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
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    mockBudgetPlans(mockPlans);
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
  });

  it("renders the page title", () => {
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getByText("Budget Planning")).toBeInTheDocument();
  });

  it("displays To be Allocated header", () => {
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getByText("To be Allocated")).toBeInTheDocument();
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

  it("computes allocation values (income - expenses)", () => {
    renderWithProviders(<BudgetPlanPage />);
    // Month 1 & 2: 4000 - 1200 = 2800 each
    const allocationCells = screen.getAllByText("$2,800");
    expect(allocationCells.length).toBeGreaterThanOrEqual(1);
  });

  it("shows green check when allocations match income for a month with data", () => {
    mockBudgetPlans([
      { categoryId: "c1", year: 2026, months: { 1: 1000 } },
      { categoryId: "c2", year: 2026, months: { 1: 1000 } },
    ]);

    const { container } = renderWithProviders(<BudgetPlanPage />);
    const checks = container.querySelectorAll("svg.stroke-\\[3\\]");
    // Month 1 + Year total (both zero with data)
    expect(checks).toHaveLength(2);
  });

  it("shows allocation amount when allocations do not match income", () => {
    mockBudgetPlans([
      { categoryId: "c1", year: 2026, months: { 1: 1000 } },
      { categoryId: "c2", year: 2026, months: { 1: 800 } },
    ]);

    const { container } = renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("$200").length).toBeGreaterThanOrEqual(1);
    expect(container.querySelectorAll("svg.stroke-\\[3\\]")).toHaveLength(0);
  });

  it("shows '-' when there are no values", () => {
    mockBudgetPlans([]);

    const { container } = renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("svg.stroke-\\[3\\]")).toHaveLength(0);
  });
});
