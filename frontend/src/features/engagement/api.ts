import { supabase } from "@/shared/auth/supabase";
import type { EngagementSummary } from "./types";

export type CheckInResponse = "spent" | "no_spend";

export const engagementApi = {
  getSummary: async (): Promise<EngagementSummary> => {
    const { data, error } = await supabase.rpc("get_engagement_summary");
    if (error) throw new Error(error.message);
    return data as EngagementSummary;
  },

  checkIn: async (responseType: CheckInResponse | "passive"): Promise<void> => {
    const { error } = await supabase.rpc("complete_daily_checkin", {
      response_type: responseType,
    });
    if (error) throw new Error(error.message);
  },
};
