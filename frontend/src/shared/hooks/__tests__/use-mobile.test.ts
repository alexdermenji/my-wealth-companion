import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

describe("useIsMobile", () => {
  let listeners: Array<() => void>;

  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: (_: string, cb: () => void) => listeners.push(cb),
        removeEventListener: vi.fn(),
      }),
    });
  });

  it("returns false when window width is >= 768", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when window width is < 768", () => {
    Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when window resizes across breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
    act(() => {
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });
});
