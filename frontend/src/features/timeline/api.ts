import { supabase } from '@/shared/auth/supabase';
import type { TimelineEvent } from './types';

type TimelineEventRow = {
  Id: string;
  Title: string;
  EventDate: string;
  Type: TimelineEvent['type'];
  Amount: number | null;
  Description: string;
};

function toTimelineEvent(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.Id,
    title: row.Title,
    eventDate: row.EventDate,
    type: row.Type,
    amount: row.Amount,
    description: row.Description,
  };
}

export const timelineEventsApi = {
  getAll: async (): Promise<TimelineEvent[]> => {
    const { data, error } = await supabase
      .from('TimelineEvents')
      .select('Id, Title, EventDate, Type, Amount, Description')
      .order('EventDate')
      .order('Title');
    if (error) throw new Error(error.message);
    return (data as TimelineEventRow[]).map(toTimelineEvent);
  },

  create: async (payload: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> => {
    const { data, error } = await supabase
      .from('TimelineEvents')
      .insert({
        Title: payload.title,
        EventDate: payload.eventDate,
        Type: payload.type,
        Amount: payload.amount,
        Description: payload.description,
      })
      .select('Id, Title, EventDate, Type, Amount, Description')
      .single();
    if (error) throw new Error(error.message);
    return toTimelineEvent(data as TimelineEventRow);
  },

  update: async (id: string, payload: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> => {
    const { data, error } = await supabase
      .from('TimelineEvents')
      .update({
        Title: payload.title,
        EventDate: payload.eventDate,
        Type: payload.type,
        Amount: payload.amount,
        Description: payload.description,
      })
      .eq('Id', id)
      .select('Id, Title, EventDate, Type, Amount, Description')
      .single();
    if (error) throw new Error(error.message);
    return toTimelineEvent(data as TimelineEventRow);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('TimelineEvents').delete().eq('Id', id);
    if (error) throw new Error(error.message);
  },
};
