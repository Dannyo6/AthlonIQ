import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { EpistemicCoachMessage, ProposedCoachAction } from "@/types";

export const CoachMessageDbRowSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  tools_invoked: z.array(z.string()).default([]),
  epistemic_breakdown: z.any().nullable().default(null),
  created_at: z.string(),
});

export const CoachConversationDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  created_at: z.string(),
});

export function mapDbCoachMessageToDomain(row: z.infer<typeof CoachMessageDbRowSchema>): EpistemicCoachMessage {
  const breakdown = row.epistemic_breakdown || {};
  return {
    id: row.id,
    sender: row.role === "user" ? "athlete" : "coach",
    text: row.content,
    timestamp: row.created_at,
    toolsUsed: row.tools_invoked || breakdown.tools_used || [],
    factsFromTools: breakdown.facts_from_tools || [],
    appCalculations: breakdown.app_calculations || [],
    recommendations: breakdown.recommendations || [],
    missingOrUncertain: breakdown.missing_or_uncertain || [],
    proposedAction: breakdown.proposed_action as ProposedCoachAction | null | undefined,
  };
}

export const coachRepo = {
  async fetchOrCreateActiveConversation(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from("coach_conversations")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`[coachRepo] Error fetching conversation: ${error.message}`);
    }
    if (data?.id) return data.id;

    const { data: newConv, error: createErr } = await supabase
      .from("coach_conversations")
      .insert({ user_id: userId, title: "Athletic Intelligence Session" })
      .select("id")
      .single();

    if (createErr) {
      throw new Error(`[coachRepo] Error creating conversation: ${createErr.message}`);
    }
    return newConv.id;
  },

  async fetchMessages(userId: string): Promise<EpistemicCoachMessage[]> {
    const { data, error } = await supabase
      .from("coach_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`[coachRepo] Error fetching messages: ${error.message}`);
    }

    return (data || []).map((row) => mapDbCoachMessageToDomain(CoachMessageDbRowSchema.parse(row)));
  },

  async saveMessage(userId: string, conversationId: string, msg: EpistemicCoachMessage): Promise<void> {
    const role = msg.sender === "athlete" ? "user" : "assistant";
    const payload = {
      conversation_id: conversationId,
      user_id: userId,
      role,
      content: msg.text,
      tools_invoked: msg.toolsUsed || [],
      epistemic_breakdown: {
        facts_from_tools: msg.factsFromTools || [],
        app_calculations: msg.appCalculations || [],
        recommendations: msg.recommendations || [],
        missing_or_uncertain: msg.missingOrUncertain || [],
        proposed_action: msg.proposedAction || null,
      },
    };

    const { error } = await supabase.from("coach_messages").insert(payload);
    if (error) {
      throw new Error(`[coachRepo] Error saving coach message: ${error.message}`);
    }
  },
};
