import { vi } from "vitest";

export const useCategories = vi.fn().mockReturnValue({ data: [], isLoading: false });
export const useCreateCategory = vi.fn().mockReturnValue({ mutate: vi.fn() });
export const useUpdateCategory = vi.fn().mockReturnValue({ mutate: vi.fn() });
export const useDeleteCategory = vi.fn().mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn() });
export const useForceDeleteCategory = vi.fn().mockReturnValue({ mutate: vi.fn() });
