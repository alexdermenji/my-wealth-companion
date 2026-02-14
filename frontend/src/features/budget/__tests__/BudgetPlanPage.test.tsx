import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import BudgetPlanPage from "../BudgetPlanPage";
import { renderWithProviders } from "@/test/test-utils";
import { useBudgetPlans } from "../hooks";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSettings } from "@/features/settings/hooks";

vi.mock("../hooks");
vi.mock("@/shared/hooks/useCategories");
vi.mock("@/features/settings/hooks");

const mockCategories = [
  { id: "c1", name: "Salary", type: "Income", group: "Employment", groupEmoji: "💼" },
  { id: "c2", name: "Rent", type: "Expenses", group: "Housing", groupEmoji: "🏠" },
];

const mockPlans = [
  { categoryId: "c1", year: 2026, months: { 1: 4000, 2: 4000 } },
  { categoryId: "c2", year: 2026, months: { 1: 1200, 2: 1200 } },
];

describe("BudgetPlanPage", () => {
  beforeEach(() => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    vi.mocked(useBudgetPlans).mockReturnValue({
      data: mockPlans,
      isLoading: false,
    } as ReturnType<typeof useBudgetPlans>);
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
});
