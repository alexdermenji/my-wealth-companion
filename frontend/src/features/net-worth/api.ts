import { supabase } from '@/shared/auth/supabase';
import type { NetWorthItem, NetWorthType, NetWorthValue } from './types';

// DB columns are PascalCase. "Group" and "Order" are SQL reserved words, so
// we avoid naming them directly in select strings and quote the order column.
type ItemRow = {
  Id: string;
  Name: string;
  Group: string;
  Type: NetWorthType;
  Order: number;
  LinkedBudgetCategoryId: string | null;
};

type ValueRow = {
  ItemId: string;
  Year: number;
  Month: number;
  Amount: number;
};

function rowToItem(row: ItemRow): NetWorthItem {
  return {
    id: row.Id,
    name: row.Name,
    group: row.Group,
    type: row.Type,
    order: row.Order,
    linkedBudgetCategoryId: row.LinkedBudgetCategoryId,
  };
}

export const netWorthApi = {
  getItems: async (): Promise<NetWorthItem[]> => {
    const { data, error } = await supabase
      .from('NetWorthItems')
      .select('*')
      .order('Type')
      .order('"Order"' as string);
    if (error) throw new Error(error.message);
    return (data as ItemRow[]).map(rowToItem);
  },

  createItem: async (payload: Omit<NetWorthItem, 'id' | 'order'>): Promise<NetWorthItem> => {
    const { data: existing } = await supabase
      .from('NetWorthItems')
      .select('"Order"')
      .eq('Type', payload.type)
      .order('"Order"' as string, { ascending: false })
      .limit(1);
    const maxOrder = (existing?.[0] as { Order?: number } | undefined)?.Order ?? -1;

    const { data, error } = await supabase
      .from('NetWorthItems')
      .insert({
        Name: payload.name,
        Group: payload.group,
        Type: payload.type,
        Order: maxOrder + 1,
        LinkedBudgetCategoryId: payload.linkedBudgetCategoryId ?? null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToItem(data as ItemRow);
  },

  updateItem: async (id: string, payload: Omit<NetWorthItem, 'id' | 'order'>): Promise<NetWorthItem> => {
    const { data, error } = await supabase
      .from('NetWorthItems')
      .update({
        Name: payload.name,
        Group: payload.group,
        Type: payload.type,
        LinkedBudgetCategoryId: payload.linkedBudgetCategoryId ?? null,
      })
      .eq('Id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToItem(data as ItemRow);
  },

  deleteItem: async (id: string): Promise<void> => {
    const { error } = await supabase.from('NetWorthItems').delete().eq('Id', id);
    if (error) throw new Error(error.message);
  },

  reorderItem: async (id: string, newOrder: number): Promise<void> => {
    const { error } = await supabase.rpc('reorder_net_worth_item', {
      p_item_id:   id,
      p_new_order: newOrder,
    });
    if (error) throw new Error(error.message);
  },

  getValuesByYear: async (year: number): Promise<NetWorthValue[]> => {
    const { data, error } = await supabase
      .from('NetWorthValues')
      .select('ItemId, Year, Month, Amount')
      .eq('Year', year);
    if (error) throw new Error(error.message);

    const map = new Map<string, NetWorthValue>();
    for (const row of data as ValueRow[]) {
      if (!map.has(row.ItemId)) {
        map.set(row.ItemId, { itemId: row.ItemId, year, months: {} });
      }
      map.get(row.ItemId)!.months[row.Month] = row.Amount;
    }
    return Array.from(map.values());
  },

  setValue: async (payload: {
    itemId: string;
    year: number;
    month: number;
    amount: number;
  }): Promise<NetWorthValue> => {
    const { data, error } = await supabase.rpc('set_net_worth_value', {
      p_item_id: payload.itemId,
      p_year:    payload.year,
      p_month:   payload.month,
      p_amount:  payload.amount,
    });
    if (error) throw new Error(error.message);

    const result = data as { itemId: string; year: number; months: Record<string, number> };
    const months: Record<number, number> = {};
    for (const [k, v] of Object.entries(result.months)) {
      months[Number(k)] = v;
    }
    return { itemId: result.itemId, year: result.year, months };
  },
};
