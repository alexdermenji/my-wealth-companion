import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "../useAccounts";
import { accountsApi } from "@/shared/api/accountsApi";
import { createHookWrapper, createTestQueryClient } from "@/test/test-utils";

vi.mock("@/shared/api/accountsApi");

const mockAccounts = [
  { id: "a1", name: "Cash", type: "Cash" as const },
  { id: "a2", name: "Bank", type: "Bank" as const },
];

describe("useAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountsApi.getAll).mockResolvedValue(mockAccounts);
  });

  it("fetches accounts", async () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockAccounts);
    expect(accountsApi.getAll).toHaveBeenCalledOnce();
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: createHookWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });
});

describe("useCreateAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountsApi.getAll).mockResolvedValue(mockAccounts);
    vi.mocked(accountsApi.create).mockResolvedValue({ id: "a3", name: "New", type: "Cash" });
  });

  it("creates an account and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateAccount(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate({ name: "New", type: "Cash" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountsApi.create).toHaveBeenCalledWith({ name: "New", type: "Cash" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["accounts"] });
  });
});

describe("useUpdateAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountsApi.update).mockResolvedValue({ id: "a1", name: "Updated", type: "Bank" });
  });

  it("updates an account and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateAccount(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate({ id: "a1", data: { name: "Updated", type: "Bank" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountsApi.update).toHaveBeenCalledWith("a1", { name: "Updated", type: "Bank" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["accounts"] });
  });
});

describe("useDeleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountsApi.delete).mockResolvedValue(undefined);
  });

  it("deletes an account and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate("a1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountsApi.delete).toHaveBeenCalledWith("a1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["accounts"] });
  });
});
