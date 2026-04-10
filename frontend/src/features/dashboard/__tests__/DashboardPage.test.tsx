import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import DashboardPage from "../DashboardPage";
import { renderWithProviders } from "@/test/test-utils";
import { useDashboardSummary } from "../hooks";
import { useSettings } from "@/features/settings/hooks";

vi.mock("../hooks");
vi.mock("@/features/settings/hooks");

const mockSummary = {
  year: 2026,
  month: 4,
  breakdown: [
    {
      type: "Income",
      totalTracked: 0,
      totalBudget: 3761,
      items: [
        { categoryId: "i1", categoryName: "Space (Net)", group: "Employment", tracked: 0, budget: 2870, percentage: 0 },
      ],
    },
    {
      type: "Expenses",
      totalTracked: 900,
      totalBudget: 1200,
      items: [
        { categoryId: "e1", categoryName: "Rent", group: "Housing", tracked: 900, budget: 900, percentage: 100 },
      ],
    },
    {
      type: "Savings",
      totalTracked: 0,
      totalBudget: 400,
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

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      data: mockSummary,
      isLoading: false,
    } as ReturnType<typeof useDashboardSummary>);
    vi.mocked(useSettings).mockReturnValue({
      data: { startYear: 2026, startMonth: 1, currency: "£" },
      isLoading: false,
    } as ReturnType<typeof useSettings>);
  });

  it("renders the page title", () => {
    renderWithProviders(<DashboardPage />);
    // Both mobile hero and desktop <h1> render in jsdom (no CSS breakpoints);
    // target the heading role to specifically verify the desktop h1.
    expect(screen.getByRole("heading", { name: "Budget Dashboard" })).toBeInTheDocument();
  });

  it("renders year and month selectors", () => {
    renderWithProviders(<DashboardPage />);
    const selectors = screen.getAllByRole("combobox");
    expect(selectors).toHaveLength(2);
    expect(selectors[0]).toHaveTextContent("2026");
    expect(selectors[1]).toBeInTheDocument();
  });

  it("passes breakdown data to BudgetBreakdown — section tiles visible", () => {
    renderWithProviders(<DashboardPage />);
    // Mobile tabs + desktop nav both render in jsdom; use getAllByRole.
    expect(screen.getAllByRole("button", { name: /income/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /expenses/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("passes breakdown data to BudgetBreakdown — first section categories visible", () => {
    renderWithProviders(<DashboardPage />);
    // Category name renders in both mobile and desktop layouts in jsdom.
    expect(screen.getAllByText("Space (Net)").length).toBeGreaterThanOrEqual(1);
  });

  it("uses currency from settings for formatting", () => {
    renderWithProviders(<DashboardPage />);
    // The desktop Income nav button includes the tracked amount formatted with £.
    const incomeButtons = screen.getAllByRole("button", { name: /income/i });
    const desktopNavButton = incomeButtons.find(b => b.textContent?.includes("£0"));
    expect(desktopNavButton).toBeTruthy();
  });

  it("renders correctly with no breakdown data", () => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useDashboardSummary>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Budget Dashboard" })).toBeInTheDocument();
  });
});
