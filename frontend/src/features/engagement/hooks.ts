import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { engagementApi, type CheckInResponse } from "./api";

export function useEngagementSummary() {
  return useQuery({
    queryKey: ["engagement", "summary"],
    queryFn: () => engagementApi.getSummary(),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (responseType: CheckInResponse | "passive") =>
      engagementApi.checkIn(responseType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement", "summary"] });
    },
  });
}
