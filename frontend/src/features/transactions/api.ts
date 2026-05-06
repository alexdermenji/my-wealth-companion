import { supabase } from "@/shared/auth/supabase";
import type { Transaction } from "./types";

type TransactionRow = {
  Id: string;
  Date: string;
  Amount: number;
  Details: string;
  AccountId: string;
  BudgetType: string;
  BudgetPositionId: string | null;
  TransferPairId?: string | null;
};

const toTransaction = (row: TransactionRow): Transaction => ({
  id: row.Id,
  // Date column is a PostgreSQL `date` type — comes back as "YYYY-MM-DD"
  date: row.Date.substring(0, 10),
  amount: row.Amount,
  details: row.Details,
  accountId: row.AccountId,
  budgetType: (row.BudgetType ?? "") as Transaction["budgetType"],
  budgetPositionId: row.BudgetPositionId ?? "",
  transferPairId: row.TransferPairId ?? undefined,
});

export type TransactionFilters = {
  budgetType?: string;
  accountId?: string;
  month?: number;
  year?: number;
};

export type PaginatedTransactionQuery = TransactionFilters & {
  page: number;
  pageSize: number;
};

export type PaginatedTransactionResult = {
  transactions: Transaction[];
  totalCount: number;
};

export const transactionsApi = {
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    let query = supabase
      .from("Transactions")
      .select("*")
      .order("Date", { ascending: false });

    if (filters?.budgetType && filters.budgetType !== "all")
      query = query.eq("BudgetType", filters.budgetType);
    if (filters?.accountId && filters.accountId !== "all")
      query = query.eq("AccountId", filters.accountId);
    if (filters?.year) {
      const startMonth = filters.month ?? 1;
      const endYear = filters.month ? (filters.month === 12 ? filters.year + 1 : filters.year) : filters.year + 1;
      const endMonth = filters.month ? (filters.month === 12 ? 1 : filters.month + 1) : 1;
      const startDate = `${filters.year}-${String(startMonth).padStart(2, "0")}-01`;
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
      query = query.gte("Date", startDate).lt("Date", endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const transactions = (data as TransactionRow[]).map(toTransaction);

    if (filters?.month && !filters.year) {
      return transactions.filter(tx => Number(tx.date.slice(5, 7)) === filters.month);
    }

    return transactions;
  },

  getPage: async ({ page, pageSize, ...filters }: PaginatedTransactionQuery): Promise<PaginatedTransactionResult> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("Transactions")
      .select("*", { count: "exact" })
      .order("Date", { ascending: false });

    if (filters.budgetType && filters.budgetType !== "all")
      query = query.eq("BudgetType", filters.budgetType);
    if (filters.accountId && filters.accountId !== "all")
      query = query.eq("AccountId", filters.accountId);
    if (filters.year) {
      const startMonth = filters.month ?? 1;
      const endYear = filters.month ? (filters.month === 12 ? filters.year + 1 : filters.year) : filters.year + 1;
      const endMonth = filters.month ? (filters.month === 12 ? 1 : filters.month + 1) : 1;
      const startDate = `${filters.year}-${String(startMonth).padStart(2, "0")}-01`;
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
      query = query.gte("Date", startDate).lt("Date", endDate);
    }

    if (filters.month && !filters.year) {
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const filtered = (data as TransactionRow[])
        .map(toTransaction)
        .filter(tx => Number(tx.date.slice(5, 7)) === filters.month);
      return { transactions: filtered.slice(from, to + 1), totalCount: filtered.length };
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw new Error(error.message);
    const transactions = (data as TransactionRow[]).map(toTransaction);

    return { transactions, totalCount: count ?? transactions.length };
  },

  create: async (payload: Omit<Transaction, "id">): Promise<Transaction> => {
    const { data, error } = await supabase
      .from("Transactions")
      .insert({
        Date: payload.date,
        Amount: payload.amount,
        Details: payload.details,
        AccountId: payload.accountId,
        BudgetType: payload.budgetType,
        BudgetPositionId: payload.budgetPositionId || null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toTransaction(data as TransactionRow);
  },

  update: async (id: string, payload: Omit<Transaction, "id">): Promise<Transaction> => {
    const { data, error } = await supabase
      .from("Transactions")
      .update({
        Date: payload.date,
        Amount: payload.amount,
        Details: payload.details,
        AccountId: payload.accountId,
        BudgetType: payload.budgetType,
        BudgetPositionId: payload.budgetPositionId || null,
      })
      .eq("Id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toTransaction(data as TransactionRow);
  },

  // Handles both regular and paired-transfer deletes via the delete_transaction function
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc("delete_transaction", { p_transaction_id: id });
    if (error) throw new Error(error.message);
  },

  createTransfer: async (data: {
    date: string;
    amount: number;
    details: string;
    accountFromId: string;
    accountToId: string;
  }): Promise<Transaction> => {
    const { data: rows, error } = await supabase.rpc("create_transfer", {
      p_date: data.date,
      p_amount: data.amount,
      p_details: data.details,
      p_from_account_id: data.accountFromId,
      p_to_account_id: data.accountToId,
    });
    if (error) throw new Error(error.message);
    // rpc returns SETOF — take the first row (the outflow)
    return toTransaction((rows as TransactionRow[])[0]);
  },
};
