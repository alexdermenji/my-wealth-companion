import { Page } from '@playwright/test';
import type { Transaction } from '../../../src/features/transactions/types';
import { mockTransactions } from '../data/transactions';

export interface TransactionsMockOptions {
  initialData?: Transaction[];
}

function toRow(t: Transaction) {
  return {
    Id: t.id,
    Date: t.date,
    Amount: t.amount,
    Details: t.details,
    AccountId: t.accountId,
    BudgetType: t.budgetType,
    BudgetPositionId: t.budgetPositionId || null,
    TransferPairId: t.transferPairId ?? null,
    UserId: 'e2e-user-id',
  };
}

function getEqParam(url: URL, col: string): string | null {
  const val = url.searchParams.get(col);
  return val?.startsWith('eq.') ? val.slice(3) : null;
}

const isSupabase = (url: URL) => url.hostname.includes('supabase.co');

let nextId = 100;

export async function setupTransactionsMock(page: Page, options: TransactionsMockOptions = {}) {
  const store = (options.initialData ?? mockTransactions).map(toRow);

  // RPC: delete_transaction (handles both single and paired transfer delete)
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/delete_transaction',
    async (route, request) => {
      const { p_transaction_id } = request.postDataJSON();
      const target = store.find((t) => t.Id === p_transaction_id);
      if (target?.TransferPairId) {
        // Delete both legs of the transfer
        const pairId = target.TransferPairId;
        const indices = store
          .map((t, i) => (t.TransferPairId === pairId ? i : -1))
          .filter((i) => i >= 0)
          .reverse();
        indices.forEach((i) => store.splice(i, 1));
      } else {
        const idx = store.findIndex((t) => t.Id === p_transaction_id);
        if (idx >= 0) store.splice(idx, 1);
      }
      await route.fulfill({ status: 204, body: '' });
    }
  );

  // RPC: create_transfer
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/rpc/create_transfer',
    async (route, request) => {
      const { p_date, p_amount, p_details, p_from_account_id, p_to_account_id } = request.postDataJSON();
      const pairId = `pair-${nextId++}`;
      const absAmt = Math.abs(p_amount);

      const outflow = {
        Id: `tx-${nextId++}`, Date: p_date as string, Amount: -absAmt, Details: p_details as string,
        AccountId: p_from_account_id as string, BudgetType: 'Transfer' as const, TransferPairId: pairId,
        BudgetPositionId: null, UserId: 'e2e-user-id',
      };
      const inflow = {
        Id: `tx-${nextId++}`, Date: p_date as string, Amount: absAmt, Details: p_details as string,
        AccountId: p_to_account_id as string, BudgetType: 'Transfer' as const, TransferPairId: pairId,
        BudgetPositionId: null, UserId: 'e2e-user-id',
      };
      store.push(outflow, inflow);
      // Returns SETOF (array), frontend takes [0]
      await route.fulfill({ json: [outflow] });
    }
  );

  // Table: Transactions (GET, POST, PATCH)
  await page.route(
    (url) => isSupabase(url) && url.pathname === '/rest/v1/Transactions',
    async (route, request) => {
      const reqUrl = new URL(request.url());
      const method = request.method();

      if (method === 'GET') {
        const budgetType = getEqParam(reqUrl, 'BudgetType');
        const accountId = getEqParam(reqUrl, 'AccountId');
        let filtered = [...store];
        if (budgetType) filtered = filtered.filter((t) => t.BudgetType === budgetType);
        if (accountId) filtered = filtered.filter((t) => t.AccountId === accountId);
        await route.fulfill({ json: filtered });
      } else if (method === 'POST') {
        const body = request.postDataJSON();
        const newRow = { Id: `tx-${nextId++}`, UserId: 'e2e-user-id', TransferPairId: null, ...body };
        store.push(newRow);
        await route.fulfill({ json: newRow, status: 201 });
      } else if (method === 'PATCH') {
        const id = getEqParam(reqUrl, 'Id');
        const body = request.postDataJSON();
        const idx = store.findIndex((t) => t.Id === id);
        if (idx >= 0) {
          store[idx] = { ...store[idx], ...body };
          await route.fulfill({ json: store[idx] });
        } else {
          await route.fulfill({ status: 404, json: { message: 'Not found' } });
        }
      } else {
        await route.fallback();
      }
    }
  );

  return { getStore: () => [...store] };
}
