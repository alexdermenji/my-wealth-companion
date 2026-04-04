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
  { id: "c1", name: "Salary", type: "Income", group: "Employment" },
  { id: "c2", name: "Rent", type: "Expenses", group: "Housing" },
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

const mockSettingsData = (currency: string) => {
  vi.mocked(useSettings).mockReturnValue({
    data: { startYear: 2026, startMonth: 1, currency },
    isLoading: false,
  } as ReturnType<typeof useSettings>);
};

describe("BudgetPlanPage", () => {
  beforeEach(() => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    mockBudgetPlans(mockPlans);
    mockSettingsData("$");
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

  it("shows '-' when there are no values", () => {
    mockBudgetPlans([]);
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("displays Liabilities label for Debt type", () => {
    const catsWithDebt: BudgetCategory[] = [
      ...mockCategories,
      { id: "c3", name: "Loan", type: "Debt", group: "Loans" },
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

    const buttons = screen.getAllByRole("button");
    const rightArrow = buttons[1];
    await user.click(rightArrow);
    expect(screen.getByText((currentYear + 1).toString())).toBeInTheDocument();
  });
});

describe("BudgetPlanPage — currency display", () => {
  beforeEach(() => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as ReturnType<typeof useCategories>);
    mockBudgetPlans(mockPlans);
  });

  it("shows £ symbol in Remaining row when currency is £", () => {
    mockSettingsData("£");
    renderWithProviders(<BudgetPlanPage />);
    // Remaining = 4000 - 1200 = 2800
    expect(screen.getAllByText("£2,800").length).toBeGreaterThanOrEqual(1);
  });

  it("shows $ symbol in Remaining row when currency is $", () => {
    mockSettingsData("$");
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("$2,800").length).toBeGreaterThanOrEqual(1);
  });

  it("shows € symbol in Remaining row when currency is €", () => {
    mockSettingsData("€");
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("€2,800").length).toBeGreaterThanOrEqual(1);
  });

  it("resolves CA$ code to $ symbol in Remaining row", () => {
    mockSettingsData("CA$");
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("$2,800").length).toBeGreaterThanOrEqual(1);
  });

  it("resolves kr-sek code to kr symbol in Remaining row", () => {
    mockSettingsData("kr-sek");
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("kr2,800").length).toBeGreaterThanOrEqual(1);
  });

  it("shows $ symbol in section totals when currency is $", () => {
    mockSettingsData("$");
    renderWithProviders(<BudgetPlanPage />);
    // Income total = 4000 for month 1
    expect(screen.getAllByText("$4,000").length).toBeGreaterThanOrEqual(1);
  });

  it("shows £ symbol in section totals when currency is £", () => {
    mockSettingsData("£");
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("£4,000").length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to $ when settings not loaded", () => {
    vi.mocked(useSettings).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useSettings>);
    renderWithProviders(<BudgetPlanPage />);
    expect(screen.getAllByText("$2,800").length).toBeGreaterThanOrEqual(1);
  });
});
