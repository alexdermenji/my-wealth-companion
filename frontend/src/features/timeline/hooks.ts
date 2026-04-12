import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timelineEventsApi } from './api';
import type { TimelineEvent } from './types';

export function useTimelineEvents() {
  return useQuery({
    queryKey: ['timelineEvents'],
    queryFn: () => timelineEventsApi.getAll(),
  });
}

export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TimelineEvent, 'id'>) => timelineEventsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timelineEvents'] }),
  });
}

export function useUpdateTimelineEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<TimelineEvent, 'id'> }) =>
      timelineEventsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timelineEvents'] }),
  });
}

export function useDeleteTimelineEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timelineEventsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timelineEvents'] }),
  });
}
