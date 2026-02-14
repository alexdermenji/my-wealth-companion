import { api } from "@/shared/api/client";
import type { SettingsDto } from "./types";

export const settingsApi = {
  get: () => api.get<SettingsDto>("/settings"),
  update: (data: SettingsDto) => api.put<SettingsDto>("/settings", data),
};
