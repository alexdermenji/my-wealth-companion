import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved", { id: "settings-saved" });
    },
    onError: () => {
      toast.error("Failed to save settings", { id: "settings-saved" });
    },
  });
}
