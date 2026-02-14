import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardSummary, useMonthlyComparison } from "../hooks";
import { dashboardApi } from "../api";
import { createHookWrapper, createTestQueryClient } from "@/test/test-utils";

vi.mock("../api");

const mockSummary = {
  year: 2026,
  month: 1,
  breakdown: [
    { type: "Income", totalTracked: 3500, totalBudget: 5000, items: [] },
    { type: "Expenses", totalTracked: 85.5, totalBudget: 2000, items: [] },
  ],
};

const mockComparison = {
  year: 2026,
  months: [
    { month: 1, monthName: "Jan", income: 3500, expenses: 85.5 },
    { month: 2, monthName: "Feb", income: 3500, expenses: 85.5 },
  ],
};

describe("useDashboardSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardApi.getSummary).mockResolvedValue(mockSummary);
  });

  it("fetches summary with year and month", async () => {
    const { result } = renderHook(() => useDashboardSummary(2026, 1), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSummary);
    expect(dashboardApi.getSummary).toHaveBeenCalledWith(2026, 1);
  });

  it("uses correct query key", async () => {
    const queryClient = createTestQueryClient();
    renderHook(() => useDashboardSummary(2026, 2), {
      wrapper: createHookWrapper(queryClient),
    });
    await waitFor(() =>
      expect(queryClient.getQueryState(["dashboard", "summary", 2026, 2])).toBeDefined()
    );
  });
});

describe("useMonthlyComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardApi.getMonthlyComparison).mockResolvedValue(mockComparison);
  });

  it("fetches monthly comparison by year", async () => {
    const { result } = renderHook(() => useMonthlyComparison(2026), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockComparison);
    expect(dashboardApi.getMonthlyComparison).toHaveBeenCalledWith(2026);
  });

  it("uses correct query key", async () => {
    const queryClient = createTestQueryClient();
    renderHook(() => useMonthlyComparison(2025), {
      wrapper: createHookWrapper(queryClient),
    });
    await waitFor(() =>
      expect(
        queryClient.getQueryState(["dashboard", "monthly-comparison", 2025])
      ).toBeDefined()
    );
  });
});
