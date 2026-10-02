import { beforeEach, describe, expect, it, vi } from 'vitest';
import { categoriesApi } from '../categoriesApi';
const query = vi.hoisted(() => ({ update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn(), order: vi.fn() }));
vi.mock('@/shared/auth/supabase', () => ({ supabase: { from: vi.fn(() => query) } }));
const row = { Id: 'a', Name: 'Rent', Type: 'Expenses', Group: 'Bills', Order: 3, IsHiddenInBudget: true };
beforeEach(() => {
  vi.clearAllMocks();
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.single.mockResolvedValue({ data: row, error: null });
  query.order.mockResolvedValue({ data: [row, { ...row, Id: 'b', IsHiddenInBudget: undefined }], error: null });
});
describe('category budget visibility API', () => {
  it('reads hidden and visible categories without filtering and defaults legacy rows to visible', async () => {
    const categories = await categoriesApi.getAll();
    expect(categories.map(c => c.isHiddenInBudget)).toEqual([true, false]);
    expect(query.eq).not.toHaveBeenCalled();
  });
  it('writes only the target visibility flag for the chosen id', async () => {
    expect(await categoriesApi.setHiddenInBudget('a', true)).toMatchObject({ id: 'a', isHiddenInBudget: true, order: 3 });
    expect(query.update).toHaveBeenCalledWith({ IsHiddenInBudget: true });
    expect(query.eq).toHaveBeenCalledWith('Id', 'a');
  });
  it('keeps visibility out of ordinary category edits', async () => {
    await categoriesApi.update('a', { name: 'New name', type: 'Expenses', group: 'Bills' });
    expect(query.update).toHaveBeenCalledWith({ Name: 'New name', Type: 'Expenses', Group: 'Bills', SpendingType: null });
  });
  it('reports rejected updates instead of treating a missing category as success', async () => {
    query.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
    await expect(categoriesApi.setHiddenInBudget('other-user-id', true)).rejects.toThrow('Not found');
  });
});
