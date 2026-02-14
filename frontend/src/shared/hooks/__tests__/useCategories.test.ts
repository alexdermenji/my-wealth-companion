import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useForceDeleteCategory,
} from "../useCategories";
import { categoriesApi } from "@/shared/api/categoriesApi";
import { createHookWrapper, createTestQueryClient } from "@/test/test-utils";

import type { BudgetCategory } from "@/shared/types";

vi.mock("@/shared/api/categoriesApi");

const mockCategories: BudgetCategory[] = [
  { id: "c1", name: "Rent", type: "Expenses", group: "Housing", groupEmoji: "🏠" },
  { id: "c2", name: "Salary", type: "Income", group: "Employment", groupEmoji: "💼" },
];

describe("useCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.getAll).mockResolvedValue(mockCategories);
  });

  it("fetches all categories when no type provided", async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCategories);
    expect(categoriesApi.getAll).toHaveBeenCalledWith(undefined);
  });

  it("fetches categories filtered by type", async () => {
    vi.mocked(categoriesApi.getAll).mockResolvedValue([mockCategories[1]]);
    const { result } = renderHook(() => useCategories("Income"), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoriesApi.getAll).toHaveBeenCalledWith("Income");
    expect(result.current.data).toHaveLength(1);
  });

  it("uses correct query key with type", async () => {
    const queryClient = createTestQueryClient();
    renderHook(() => useCategories("Expenses"), {
      wrapper: createHookWrapper(queryClient),
    });
    await waitFor(() =>
      expect(queryClient.getQueryState(["categories", "Expenses"])).toBeDefined()
    );
  });
});

describe("useCreateCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.create).mockResolvedValue({
      id: "c3",
      name: "Gym",
      type: "Expenses",
      group: "Health",
      groupEmoji: "🏋️",
    });
  });

  it("creates a category and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createHookWrapper(queryClient),
    });

    const newCat = { name: "Gym", type: "Expenses" as const, group: "Health", groupEmoji: "🏋️" };
    result.current.mutate(newCat);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoriesApi.create).toHaveBeenCalledWith(newCat);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] });
  });
});

describe("useUpdateCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.update).mockResolvedValue({
      id: "c1",
      name: "Updated",
      type: "Expenses",
      group: "Housing",
      groupEmoji: "🏠",
    });
  });

  it("updates a category and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate({
      id: "c1",
      data: { name: "Updated", type: "Expenses", group: "Housing", groupEmoji: "🏠" },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] });
  });
});

describe("useDeleteCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.delete).mockResolvedValue(undefined);
  });

  it("deletes a category and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate("c1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoriesApi.delete).toHaveBeenCalledWith("c1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] });
  });
});

describe("useForceDeleteCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.forceDelete).mockResolvedValue(undefined);
  });

  it("force deletes a category and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useForceDeleteCategory(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate("c1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoriesApi.forceDelete).toHaveBeenCalledWith("c1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] });
  });
});
