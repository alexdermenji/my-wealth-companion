import { vi } from "vitest";

export const useAccounts = vi.fn().mockReturnValue({ data: [], isLoading: false });
export const useCreateAccount = vi.fn().mockReturnValue({ mutate: vi.fn() });
export const useUpdateAccount = vi.fn().mockReturnValue({ mutate: vi.fn() });
export const useDeleteAccount = vi.fn().mockReturnValue({ mutate: vi.fn() });
