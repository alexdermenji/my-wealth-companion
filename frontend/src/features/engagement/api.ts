import { supabase } from "@/shared/auth/supabase";
import type { EngagementSummary } from "./types";

export const engagementApi = {
  getSummary: async (): Promise<EngagementSummary> => {
    const { data, error } = await supabase.rpc("get_engagement_summary");
    if (error) throw new Error(error.message);
    return data as EngagementSummary;
  },
};
