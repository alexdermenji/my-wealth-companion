import { supabase } from '@/shared/auth/supabase';
import type { UserMilestone } from './utils';

type MilestoneRow = {
  Id: string;
  Label: string | null;
  TargetAmount: number;
  TargetDate: string | null;
  Note: string;
  Order: number;
};

function toUserMilestone(row: MilestoneRow): UserMilestone {
  return {
    id: row.Id,
    label: row.Label,
    amount: row.TargetAmount,
    targetDate: row.TargetDate,
    note: row.Note,
  };
}

export const netWorthMilestonesApi = {
  getAll: async (): Promise<UserMilestone[]> => {
    const { data, error } = await supabase
      .from('NetWorthMilestones')
      .select('Id, Label, TargetAmount, TargetDate, Note, Order')
      .order('TargetAmount');
    if (error) throw new Error(error.message);
    return (data as MilestoneRow[]).map(toUserMilestone);
  },

  create: async (payload: Omit<UserMilestone, 'id'>): Promise<UserMilestone> => {
    const { data, error } = await supabase
      .from('NetWorthMilestones')
      .insert({
        Label: payload.label,
        TargetAmount: payload.amount,
        TargetDate: payload.targetDate,
        Note: payload.note,
      })
      .select('Id, Label, TargetAmount, TargetDate, Note, Order')
      .single();
    if (error) throw new Error(error.message);
    return toUserMilestone(data as MilestoneRow);
  },

  update: async (id: string, payload: Omit<UserMilestone, 'id'>): Promise<UserMilestone> => {
    const { data, error } = await supabase
      .from('NetWorthMilestones')
      .update({
        Label: payload.label,
        TargetAmount: payload.amount,
        TargetDate: payload.targetDate,
        Note: payload.note,
      })
      .eq('Id', id)
      .select('Id, Label, TargetAmount, TargetDate, Note, Order')
      .single();
    if (error) throw new Error(error.message);
    return toUserMilestone(data as MilestoneRow);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('NetWorthMilestones').delete().eq('Id', id);
    if (error) throw new Error(error.message);
  },
};
