import { vi } from "vitest";

export const useSettings = vi.fn().mockReturnValue({ data: undefined, isLoading: false });
export const useUpdateSettings = vi.fn().mockReturnValue({ mutate: vi.fn() });
