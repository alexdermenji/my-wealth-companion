import { vi } from "vitest";

export const useDashboardSummary = vi.fn().mockReturnValue({ data: undefined, isLoading: false });
export const useMonthlyComparison = vi.fn().mockReturnValue({ data: undefined, isLoading: false });
