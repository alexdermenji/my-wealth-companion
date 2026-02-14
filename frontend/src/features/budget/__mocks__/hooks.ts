import { vi } from "vitest";

export const useBudgetPlans = vi.fn().mockReturnValue({ data: [], isLoading: false });
export const useSetBudgetAmount = vi.fn().mockReturnValue({ mutate: vi.fn() });
