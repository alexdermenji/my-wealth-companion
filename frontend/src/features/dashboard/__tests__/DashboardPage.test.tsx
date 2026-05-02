import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import DashboardPage from "../DashboardPage";
import { renderWithProviders } from "@/test/test-utils";
import { useNetWorthItems, useAllNetWorthValues } from "@/features/net-worth/hooks";
import { useSettings } from "@/features/settings/hooks";

vi.mock("@/features/net-worth/hooks");
vi.mock("@/features/settings/hooks");

const mockItems = [
  { id: 'nw1', name: 'Cash Savings', group: 'Cash', type: 'Asset' as const, order: 0 },
  { id: 'nw2', name: 'Mortgage', group: 'Home', type: 'Liability' as const, order: 0 },
];

// Two data points minimum for the chart to render
const mockValues = [
  { itemId: 'nw1', year: 2026, months: { 1: 50000, 2: 52000 } },
  { itemId: 'nw2', year: 2026, months: { 1: 20000, 2: 19500 } },
];

function setupMocks(
  items = mockItems,
  values = mockValues,
) {
  vi.mocked(useSettings).mockReturnValue({
    data: { startYear: 2026, startMonth: 1, currency: '£' },
    isLoading: false,
  } as ReturnType<typeof useSettings>);
  vi.mocked(useNetWorthItems).mockReturnValue({
    data: items,
    isLoading: false,
  } as ReturnType<typeof useNetWorthItems>);
  vi.mocked(useAllNetWorthValues).mockReturnValue({
    data: values,
    isLoading: false,
  } as ReturnType<typeof useAllNetWorthValues>);
}

describe("DashboardPage", () => {
  beforeEach(() => {
    setupMocks();
  });

  it("renders the page heading", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders the Net Worth chart when data is available", () => {
    renderWithProviders(<DashboardPage />);
    // "Net Worth" appears in both the label strip and the chart legend
    expect(screen.getAllByText("Net Worth").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Assets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Liabilities").length).toBeGreaterThanOrEqual(1);
  });

  it("shows current net worth value", () => {
    // Jan: 50000 - 20000 = 30000, Feb: 52000 - 19500 = 32500 (latest)
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByText(/32,500/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows the gain since earliest data point", () => {
    // Gain: 32500 - 30000 = 2500; formatted as £2,500
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/\+£2,500/)).toBeInTheDocument();
  });

  it("shows empty state when no items exist", () => {
    setupMocks([], []);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/no net worth data yet/i)).toBeInTheDocument();
  });

  it("shows loading skeleton while fetching", () => {
    vi.mocked(useNetWorthItems).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useNetWorthItems>);
    const { container } = renderWithProviders(<DashboardPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it("uses currency from settings", () => {
    renderWithProviders(<DashboardPage />);
    // Net worth values are formatted with £
    const netWorthEl = screen.getAllByText(/£/);
    expect(netWorthEl.length).toBeGreaterThan(0);
  });
});
