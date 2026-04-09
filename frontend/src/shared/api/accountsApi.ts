import { supabase } from "@/shared/auth/supabase";
import type { Account } from "@/shared/types";

// DB columns are PascalCase (created by EF Core with double-quoted identifiers)
type AccountRow = { Id: string; Name: string; Type: Account["type"]; OpeningBalance: number };

const toAccount = (row: AccountRow): Account => ({
  id: row.Id,
  name: row.Name,
  type: row.Type,
  openingBalance: row.OpeningBalance,
});

export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const { data, error } = await supabase.from("Accounts").select("*").order("Name");
    if (error) throw new Error(error.message);
    return (data as AccountRow[]).map(toAccount);
  },

  create: async (payload: Omit<Account, "id">): Promise<Account> => {
    const { data, error } = await supabase
      .from("Accounts")
      .insert({ Name: payload.name, Type: payload.type, OpeningBalance: payload.openingBalance })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toAccount(data as AccountRow);
  },

  update: async (id: string, payload: Omit<Account, "id">): Promise<Account> => {
    const { data, error } = await supabase
      .from("Accounts")
      .update({ Name: payload.name, Type: payload.type, OpeningBalance: payload.openingBalance })
      .eq("Id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toAccount(data as AccountRow);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("Accounts").delete().eq("Id", id);
    if (error) throw new Error(error.message);
  },
};
