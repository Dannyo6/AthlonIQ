import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { WeeklyReviewReport } from "@/types";

export const WeeklyReportDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  week_start_date: z.string(),
  week_end_date: z.string(),
  summary_payload: z.any(),
  created_at: z.string(),
});

export type WeeklyReportDbRow = z.infer<typeof WeeklyReportDbRowSchema>;

export const weeklyReportsRepo = {
  async fetchLatestReport(userId: string): Promise<WeeklyReviewReport | null> {
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`[weeklyReportsRepo] Error fetching latest report: ${error.message}`);
    }
    if (!data) return null;

    const validated = WeeklyReportDbRowSchema.parse(data);
    return validated.summary_payload as WeeklyReviewReport;
  },

  async saveReport(userId: string, report: WeeklyReviewReport): Promise<void> {
    const payload = {
      user_id: userId,
      week_start_date: report.week_start_date,
      week_end_date: report.week_end_date,
      summary_payload: report,
    };

    const { error } = await supabase.from("weekly_reports").insert(payload);
    if (error) {
      throw new Error(`[weeklyReportsRepo] Error saving weekly report: ${error.message}`);
    }
  },
};
