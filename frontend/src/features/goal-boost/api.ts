import { supabase } from '@/shared/auth/supabase';
import type { BoostEntry, BoostGoal } from './model';
async function allRows<T>(table: string, order: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(order, { ascending: false })
      .order('id')
      .range(from, from + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data as T[]));
    if (data.length < 500) return rows;
  }
}
export const goalBoostApi = {
  async get() {
    const [goals, entries] = await Promise.all([
      allRows<BoostGoal>('GoalBoostGoals', 'created_at'),
      allRows<BoostEntry>('GoalBoostEntries', 'date'),
    ]);
    return { goals, entries };
  },
  async command(action: string, data: Record<string, unknown>) {
    const { error } = await supabase.rpc('goal_boost_command', {
      p_action: action,
      p_data: data,
    });
    if (error) throw new Error(error.message);
  },
};
