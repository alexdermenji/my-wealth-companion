import { vi } from "vitest";

export const transactionsApi = {
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
