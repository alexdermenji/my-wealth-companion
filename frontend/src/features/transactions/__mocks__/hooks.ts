import { vi } from "vitest";

export const useTransactions = vi.fn().mockReturnValue({ data: [], isLoading: false });
export const usePaginatedTransactions = vi.fn().mockReturnValue({ data: { transactions: [], totalCount: 0 }, isLoading: false });
export const useCreateTransaction = vi.fn().mockReturnValue({ mutate: vi.fn() });
export const useUpdateTransaction = vi.fn().mockReturnValue({ mutate: vi.fn() });
export const useDeleteTransaction = vi.fn().mockReturnValue({ mutate: vi.fn() });
export const useCreateTransfer = vi.fn().mockReturnValue({ mutate: vi.fn() });
