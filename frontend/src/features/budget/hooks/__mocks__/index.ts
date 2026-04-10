import { vi } from "vitest";

export const useBudgetPlans = vi.fn().mockReturnValue({ data: [], isLoading: false });
export const useSetBudgetAmount = vi.fn().mockReturnValue({ mutate: vi.fn() });

export const useHeatMap = vi.fn().mockReturnValue({
  monthTotals: {},
  getHeatBg: vi.fn().mockReturnValue(''),
});

export const useDragReorder = vi.fn().mockImplementation((cats: unknown[]) => ({
  displayCats: cats,
  dropLineIndex: null,
  dragIndexRef: { current: null },
  handleDragStart: vi.fn(),
  handleDragOver: vi.fn(),
  handleDrop: vi.fn(),
  handleDragEnd: vi.fn(),
}));

export const useTabFill = vi.fn().mockReturnValue({
  tabFills: {},
  getBudget: vi.fn().mockReturnValue(0),
  handleTab: vi.fn(),
  cellRefs: { current: {} },
});
