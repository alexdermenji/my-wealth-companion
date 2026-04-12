export type TimelineEventType = 'Custom';

export interface TimelineEvent {
  id: string;
  title: string;
  eventDate: string;
  type: TimelineEventType;
  amount: number | null;
  description: string;
}
