import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useEngagementSummary } from "../hooks";
import { engagementApi } from "../api";
import { createHookWrapper, createTestQueryClient } from "@/test/test-utils";

vi.mock("../api");

const mockSummary = {
  streak: {
    tracking: {
      currentStreak: 4,
      longestStreak: 7,
      todayStatus: "logged" as const,
      recentDays: [],
    },
    noSpend: {
      currentStreak: 2,
      longestStreak: 5,
      todayStatus: "no-spend" as const,
    },
  },
  tasks: {
    daysSinceLastTransaction: 0,
    overBudgetCategories: [],
    nextMonthBudgetFilled: true,
    currentMonthNetWorthFilled: true,
  },
};

describe("useEngagementSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(engagementApi.getSummary).mockResolvedValue(mockSummary);
  });

  it("returns engagement summary on success", async () => {
    const { result } = renderHook(() => useEngagementSummary(), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSummary);
  });

  it("uses the correct query key", async () => {
    const queryClient = createTestQueryClient();
    renderHook(() => useEngagementSummary(), {
      wrapper: createHookWrapper(queryClient),
    });
    await waitFor(() =>
      expect(queryClient.getQueryState(["engagement", "summary"])).toBeDefined()
    );
  });

  it("surfaces error state when api throws", async () => {
    vi.mocked(engagementApi.getSummary).mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useEngagementSummary(), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
