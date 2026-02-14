import { vi } from "vitest";

export const categoriesApi = {
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  forceDelete: vi.fn(),
  getUsage: vi.fn(),
};
