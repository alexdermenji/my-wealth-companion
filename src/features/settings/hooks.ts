import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "./api";
import type { SettingsDto } from "./types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettingsDto) => settingsApi.update(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}
