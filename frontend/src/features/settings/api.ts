import { supabase } from "@/shared/auth/supabase";
import type { SettingsDto } from "./types";

export const settingsApi = {
  get: async (): Promise<SettingsDto> => {
    const { data, error } = await supabase
      .from("Settings")
      .select("StartYear, StartMonth, Currency")
      .single();
    if (error) throw new Error(error.message);
    const row = data as { StartYear: number; StartMonth: number; Currency: string };
    return { startYear: row.StartYear, startMonth: row.StartMonth, currency: row.Currency };
  },

  update: async (payload: SettingsDto): Promise<SettingsDto> => {
    const { data, error } = await supabase
      .from("Settings")
      .update({ StartYear: payload.startYear, StartMonth: payload.startMonth, Currency: payload.currency })
      .select("StartYear, StartMonth, Currency")
      .single();
    if (error) throw new Error(error.message);
    const row = data as { StartYear: number; StartMonth: number; Currency: string };
    return { startYear: row.StartYear, startMonth: row.StartMonth, currency: row.Currency };
  },
};
