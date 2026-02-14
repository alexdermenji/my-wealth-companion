import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../hooks";
import { transactionsApi } from "../api";
import { createHookWrapper, createTestQueryClient } from "@/test/test-utils";

vi.mock("../api");

const mockTransactions = [
  {
    id: "t1",
    date: "2026-01-15",
    amount: 3500,
    details: "Salary",
    accountId: "a1",
    budgetType: "Income",
    budgetPositionId: "c1",
  },
  {
    id: "t2",
    date: "2026-01-20",
    amount: 85.5,
    details: "Groceries",
    accountId: "a1",
    budgetType: "Expenses",
    budgetPositionId: "c2",
  },
];

describe("useTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transactionsApi.getAll).mockResolvedValue(mockTransactions);
  });

  it("fetches transactions without filters", async () => {
    const { result } = renderHook(() => useTransactions(), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTransactions);
    expect(transactionsApi.getAll).toHaveBeenCalledWith(undefined);
  });

  it("fetches transactions with filters", async () => {
    const filters = { budgetType: "Income", accountId: "a1" };
    const { result } = renderHook(() => useTransactions(filters), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionsApi.getAll).toHaveBeenCalledWith(filters);
  });

  it("uses filters in query key", async () => {
    const queryClient = createTestQueryClient();
    const filters = { budgetType: "Income" };
    renderHook(() => useTransactions(filters), {
      wrapper: createHookWrapper(queryClient),
    });
    await waitFor(() =>
      expect(queryClient.getQueryState(["transactions", filters])).toBeDefined()
    );
  });
});

describe("useCreateTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transactionsApi.create).mockResolvedValue({ ...mockTransactions[0], id: "t3" });
  });

  it("creates a transaction and invalidates transactions + dashboard", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createHookWrapper(queryClient),
    });

    const newTx = { ...mockTransactions[0] };
    delete (newTx as Record<string, unknown>).id;
    result.current.mutate(newTx as Omit<(typeof mockTransactions)[0], "id">);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });
});

describe("useUpdateTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transactionsApi.update).mockResolvedValue(mockTransactions[0]);
  });

  it("updates a transaction and invalidates both caches", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateTransaction(), {
      wrapper: createHookWrapper(queryClient),
    });

    const { id, ...data } = mockTransactions[0];
    result.current.mutate({ id, data });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionsApi.update).toHaveBeenCalledWith("t1", data);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });
});

describe("useDeleteTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transactionsApi.delete).mockResolvedValue(undefined);
  });

  it("deletes a transaction and invalidates both caches", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate("t1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionsApi.delete).toHaveBeenCalledWith("t1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });
});
