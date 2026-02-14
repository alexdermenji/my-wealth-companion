import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSettings, useUpdateSettings } from "../hooks";
import { settingsApi } from "../api";
import { createHookWrapper, createTestQueryClient } from "@/test/test-utils";

vi.mock("../api");

const mockSettings = { startYear: 2026, startMonth: 1, currency: "USD" };

describe("useSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsApi.get).mockResolvedValue(mockSettings);
  });

  it("fetches settings", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSettings);
    expect(settingsApi.get).toHaveBeenCalledOnce();
  });
});

describe("useUpdateSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsApi.update).mockResolvedValue({
      startYear: 2025,
      startMonth: 6,
      currency: "EUR",
    });
  });

  it("updates settings and invalidates cache", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: createHookWrapper(queryClient),
    });

    result.current.mutate({ startYear: 2025, startMonth: 6, currency: "EUR" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(settingsApi.update).toHaveBeenCalledWith({
      startYear: 2025,
      startMonth: 6,
      currency: "EUR",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["settings"] });
  });

  it("handles update error", async () => {
    vi.mocked(settingsApi.update).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ startYear: 2025, startMonth: 6, currency: "EUR" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
