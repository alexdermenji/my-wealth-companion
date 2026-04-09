import { supabase } from "@/shared/auth/supabase";
import type { BudgetCategory } from "@/shared/types";

// DB columns are PascalCase. "Group" and "Order" are SQL reserved words —
// PostgREST requires them double-quoted in select/order params.
type CategoryRow = { Id: string; Name: string; Type: BudgetCategory["type"]; Group: string; Order: number };

const toCategory = (row: CategoryRow): BudgetCategory => ({
  id: row.Id,
  name: row.Name,
  type: row.Type,
  group: row.Group,
  order: row.Order,
});

export const categoriesApi = {
  getAll: async (type?: string): Promise<BudgetCategory[]> => {
    let query = supabase.from("Categories").select("*").order('"Order"' as string);
    if (type) query = query.eq("Type", type);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as CategoryRow[]).map(toCategory);
  },

  create: async (payload: Omit<BudgetCategory, "id" | "order">): Promise<BudgetCategory> => {
    // Get max Order for this type so the new category appends at the end
    const { data: existing } = await supabase
      .from("Categories")
      .select('"Order"')
      .eq("Type", payload.type)
      .order('"Order"' as string, { ascending: false })
      .limit(1);
    const maxOrder = (existing?.[0] as { Order?: number } | undefined)?.Order ?? -1;

    const { data, error } = await supabase
      .from("Categories")
      .insert({ Name: payload.name, Type: payload.type, Group: payload.group, Order: maxOrder + 1 })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toCategory(data as CategoryRow);
  },

  update: async (id: string, payload: Omit<BudgetCategory, "id" | "order">): Promise<BudgetCategory> => {
    const { data, error } = await supabase
      .from("Categories")
      .update({ Name: payload.name, Type: payload.type, Group: payload.group })
      .eq("Id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toCategory(data as CategoryRow);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("Categories").delete().eq("Id", id);
    if (error) throw new Error(error.message);
  },

  forceDelete: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc("force_delete_category", { p_category_id: id });
    if (error) throw new Error(error.message);
  },

  getUsage: async (id: string): Promise<{ transactionCount: number; budgetPlanCount: number }> => {
    const { data, error } = await supabase.rpc("get_category_usage", { p_category_id: id });
    if (error) throw new Error(error.message);
    return data as { transactionCount: number; budgetPlanCount: number };
  },

  reorder: async (id: string, newOrder: number): Promise<void> => {
    const { error } = await supabase.rpc("reorder_category", {
      p_category_id: id,
      p_new_order: newOrder,
    });
    if (error) throw new Error(error.message);
  },
};
