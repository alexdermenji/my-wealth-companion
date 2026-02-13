import { api } from "./client";

export interface SettingsDto {
  startYear: number;
  startMonth: number;
  currency: string;
}

export const settingsApi = {
  get: () => api.get<SettingsDto>("/settings"),
  update: (data: SettingsDto) => api.put<SettingsDto>("/settings", data),
};
