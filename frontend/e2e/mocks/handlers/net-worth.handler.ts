import { Page } from '@playwright/test';
import type { NetWorthItem, NetWorthValue } from '../../../src/features/net-worth/types';
import { mockNetWorthItems, mockNetWorthValues } from '../data/net-worth';

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

function getEqParam(url: URL, col: string): string | null {
  const val = url.searchParams.get(col);
  return val?.startsWith('eq.') ? val.slice(3) : null;
}

type NetWorthValueRow = {
  ItemId: string;
  Year: number;
  Month: number;
  Amount: number;
  UserId: string;
};

function valuesToRows(values: NetWorthValue[]): NetWorthValueRow[] {
  return values.flatMap(value => (
    Object.entries(value.months).map(([month, amount]) => ({
      ItemId: value.itemId,
      Year: value.year,
      Month: Number(month),
      Amount: amount,
      UserId: 'e2e-user-id',
    }))
  ));
}

export async function setupNetWorthMock(page: Page) {
  const itemStore: NetWorthItem[] = structuredClone(mockNetWorthItems);
  const valueRows: NetWorthValueRow[] = valuesToRows(mockNetWorthValues);

  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/NetWorthItems',
    async (route, request) => {
      const id = getEqParam(new URL(request.url()), 'Id');
      if (request.method() === 'PATCH') {
        const item = itemStore.find(item => item.id === id);
        if (item) item.isHidden = request.postDataJSON().IsHidden;
      }
      const rows = itemStore.map(item => ({
        Id: item.id,
        Name: item.name,
        Group: item.group,
        Type: item.type,
        Order: item.order,
        UserId: 'e2e-user-id',
        IsHidden: item.isHidden ?? false,
      }));
      await route.fulfill({ json: request.method() === 'PATCH' ? rows.find(row => row.Id === id) : rows });
    },
  );

  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/NetWorthValues',
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const yearParam = getEqParam(reqUrl, 'Year');
      let filtered = [...valueRows];
      if (yearParam) filtered = filtered.filter(row => row.Year === Number(yearParam));
      await route.fulfill({ json: filtered });
    },
  );

  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/set_net_worth_value',
    async (route, request) => {
      const { p_item_id, p_year, p_month, p_amount } = request.postDataJSON();
      const existing = valueRows.find(
        row => row.ItemId === p_item_id && row.Year === p_year && row.Month === p_month,
      );

      if (existing) {
        existing.Amount = p_amount;
      } else {
        valueRows.push({
          ItemId: p_item_id,
          Year: p_year,
          Month: p_month,
          Amount: p_amount,
          UserId: 'e2e-user-id',
        });
      }

      // Mirrors the database trigger; the actual SQL is tested in a disposable DB.
      const item = itemStore.find(item => item.id === p_item_id);
      const now = new Date();
      const limit = now.getFullYear() * 12 + now.getMonth() + 1;
      const latest = valueRows.filter(row => row.ItemId === p_item_id && row.Year * 12 + row.Month <= limit)
        .sort((a, b) => b.Year - a.Year || b.Month - a.Month)[0];
      if (item?.type === 'Liability' && latest?.Year === p_year && latest.Month === p_month) item.isHidden = p_amount <= 0;

      const itemYearRows = valueRows.filter(row => row.ItemId === p_item_id && row.Year === p_year);
      const months: Record<string, number> = {};
      itemYearRows.forEach(row => {
        months[String(row.Month)] = row.Amount;
      });

      await route.fulfill({ json: { itemId: p_item_id, year: p_year, months } });
    },
  );

  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/reorder_net_worth_item',
    async (route, request) => {
      const { p_item_id, p_new_order } = request.postDataJSON();
      const item = itemStore.find(entry => entry.id === p_item_id);
      if (!item) {
        await route.fulfill({ status: 404, json: { message: 'Item not found' } });
        return;
      }

      const siblings = itemStore
        .filter(entry => entry.type === item.type && entry.id !== p_item_id)
        .sort((a, b) => a.order - b.order);
      const nextOrder = Math.max(0, Math.min(p_new_order, siblings.length));
      const reordered = [...siblings];
      reordered.splice(nextOrder, 0, item);
      reordered.forEach((entry, index) => {
        entry.order = index;
      });

      await route.fulfill({ json: null });
    },
  );

  return {
    getItems: () => structuredClone(itemStore),
    getValues: () => structuredClone(valueRows),
  };
}
