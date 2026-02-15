import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { useBudgetPlans, useSetBudgetAmount } from "../hooks";
import { budgetPlansApi } from "../api";
import { createHookWrapper, createTestQueryClient } from "@/test/test-utils";

import type { BudgetPlan } from "../types";

vi.mock("../api");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPlans: BudgetPlan[] = [
  { categoryId: "c1", year: 2026, months: { 1: 1000, 2: 1000 } },
  { categoryId: "c2", year: 2026, months: { 1: 500 } },
];

describe("useBudgetPlans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(budgetPlansApi.getByYear).mockResolvedValue(mockPlans);
  });

  it("fetches budget plans by year", async () => {
    const { result } = renderHook(() => useBudgetPlans(2026), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPlans);
    expect(budgetPlansApi.getByYear).toHaveBeenCalledWith(2026);
  });

  it("uses year in query key", async () => {
    const queryClient = createTestQueryClient();
    renderHook(() => useBudgetPlans(2025), {
      wrapper: createHookWrapper(queryClient),
    });
    await waitFor(() =>
      expect(queryClient.getQueryState(["budgetPlans", 2025])).toBeDefined()
    );
  });
});

describe("useSetBudgetAmount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(budgetPlansApi.setAmount).mockResolvedValue({
      categoryId: "c1",
      year: 2026,
      months: { 1: 2000 },
    });
  });

  it("sets amount and invalidates budgetPlans + dashboard", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSetBudgetAmount(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate({ categoryId: "c1", year: 2026, month: 1, amount: 2000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(budgetPlansApi.setAmount).toHaveBeenCalledWith({
      categoryId: "c1",
      year: 2026,
      month: 1,
      amount: 2000,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["budgetPlans"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("shows success toast on update", async () => {
    const { result } = renderHook(() => useSetBudgetAmount(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ categoryId: "c1", year: 2026, month: 1, amount: 2000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith("Budget updated", { id: "budget-saved" });
  });

  it("shows error toast on update failure", async () => {
    vi.mocked(budgetPlansApi.setAmount).mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useSetBudgetAmount(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ categoryId: "c1", year: 2026, month: 1, amount: 2000 });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith("Failed to update budget", { id: "budget-saved" });
  });

  it("handles mutation error", async () => {
    vi.mocked(budgetPlansApi.setAmount).mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useSetBudgetAmount(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ categoryId: "c1", year: 2026, month: 1, amount: 2000 });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("fail");
  });
});
