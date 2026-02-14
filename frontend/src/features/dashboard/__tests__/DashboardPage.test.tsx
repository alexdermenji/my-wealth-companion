import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import DashboardPage from "../DashboardPage";
import { renderWithProviders } from "@/test/test-utils";
import { useDashboardSummary, useMonthlyComparison } from "../hooks";
import { useSettings } from "@/features/settings/hooks";

vi.mock("../hooks");
vi.mock("@/features/settings/hooks");

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

const mockSummary = {
  year: 2026,
  month: 2,
  breakdown: [
    {
      type: "Income",
      totalTracked: 3500,
      totalBudget: 5000,
      items: [
        { categoryId: "c1", categoryName: "Employment (Net)", group: "Employment", tracked: 3500, budget: 4000, percentage: 88 },
      ],
    },
    {
      type: "Expenses",
      totalTracked: 85,
      totalBudget: 2000,
      items: [
        { categoryId: "c2", categoryName: "Groceries", group: "Food", tracked: 85, budget: 800, percentage: 11 },
      ],
    },
    {
      type: "Savings",
      totalTracked: 0,
      totalBudget: 500,
      items: [],
    },
    {
      type: "Debt",
      totalTracked: 0,
      totalBudget: 300,
      items: [],
    },
  ],
};

const mockComparison = {
  year: 2026,
  months: [
    { month: 1, monthName: "Jan", income: 3500, expenses: 85 },
    { month: 2, monthName: "Feb", income: 3500, expenses: 85 },
  ],
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      data: mockSummary,
      isLoading: false,
    } as ReturnType<typeof useDashboardSummary>);
    vi.mocked(useMonthlyComparison).mockReturnValue({
      data: mockComparison,
      isLoading: false,
    } as ReturnType<typeof useMonthlyComparison>);
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "$" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
  });

  it("renders the page title", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Budget Dashboard")).toBeInTheDocument();
  });

  it("displays income summary card", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("$3,500")).toBeInTheDocument();
  });

  it("displays expense summary card", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("$85")).toBeInTheDocument();
  });

  it("shows breakdown section with category data", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Employment (Net)")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("shows no expense data message for empty pie", () => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      data: {
        ...mockSummary,
        breakdown: mockSummary.breakdown.map(b =>
          b.type === "Expenses" ? { ...b, totalTracked: 0, items: [] } : b
        ),
      },
      isLoading: false,
    } as ReturnType<typeof useDashboardSummary>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("No expense data for this period")).toBeInTheDocument();
  });

  it("renders chart containers", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Income vs Expenses")).toBeInTheDocument();
    expect(screen.getByText("Expense Allocation")).toBeInTheDocument();
  });
});
