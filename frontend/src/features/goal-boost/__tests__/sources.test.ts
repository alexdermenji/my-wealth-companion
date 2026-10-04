import { describe, it, expect } from 'vitest';
import { selectForecastSources } from '../sources';
describe('forecast source selection', () => {
  const items = [
    {
      id: 'loan',
      name: 'Loan',
      type: 'Liability' as const,
      group: 'Loans',
      order: 0,
      linkedBudgetCategoryId: 'debt',
    },
  ];
  const values = [
    { itemId: 'loan', year: 2026, months: { 1: 2000, 3: 1500, 12: 900 } },
  ];
  it('uses the latest non-future snapshot and current month budget', () => {
    expect(
      selectForecastSources(
        'debt',
        items,
        values,
        [{ categoryId: 'debt', year: 2026, months: { 3: 200 } }],
        new Date(2026, 2, 15),
      ),
    ).toEqual({
      balance: 1500,
      balanceDate: '2026-03-01',
      itemName: 'Loan',
      payment: 200,
      ambiguous: false,
    });
  });
  it('does not silently choose between multiple liabilities', () => {
    expect(
      selectForecastSources(
        'debt',
        [...items, { ...items[0], id: 'second' }],
        values,
        [],
        new Date(2026, 2, 15),
      ).balance,
    ).toBeUndefined();
  });
  it('does not use future-only snapshots or invent missing payments', () => {
    const r = selectForecastSources(
      'debt',
      items,
      [{ itemId: 'loan', year: 2027, months: { 1: 500 } }],
      [],
      new Date(2026, 2, 15),
    );
    expect(r.balance).toBeUndefined();
    expect(r.payment).toBeUndefined();
  });
});
